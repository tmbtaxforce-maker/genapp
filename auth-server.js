'use strict';
/*
 * auth-server.js — GenApp backend (PostgreSQL + Express + bcryptjs + SSE)
 * Stack: express + bcryptjs + pg (PostgreSQL driver)
 * Set DATABASE_URL for PostgreSQL connection string.
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const { Pool } = require('pg');
const path    = require('path');
const crypto  = require('crypto');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const app   = express();
const PORT  = process.env.PORT || 8000;
const SALT  = 10;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { ok: false, error: 'Too many requests. Please wait before retrying.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/login', authLimiter);
app.use('/api/logout', authLimiter);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const q = (sql, params = []) => pool.query(sql, params);
const wrapAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const pubCols   = 'id, username, name, email, role, avatar, status';
const orderCols = 'id, type, requester_role, requester_name, counterparty, qty, liters_qty, rate, amount, status, delivered_qty, created_at::text';
const txCols    = 'id, type, counterparty, qty, unit, rate, amount, status, date';

async function initDb() {
  await q(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      email         TEXT,
      role          TEXT NOT NULL DEFAULT 'client',
      avatar        TEXT,
      status        TEXT DEFAULT 'active',
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS orders (
      id              SERIAL PRIMARY KEY,
      type            TEXT NOT NULL,
      requester_role  TEXT NOT NULL,
      requester_name  TEXT,
      counterparty    TEXT,
      qty             REAL,
      liters_qty      REAL,
      rate            REAL,
      amount          REAL,
      status          TEXT DEFAULT 'pending',
      created_at      TIMESTAMP DEFAULT NOW()
    )
  `);
  await q('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_qty REAL DEFAULT 0');
  await q(`
    CREATE TABLE IF NOT EXISTS transactions (
      id           SERIAL PRIMARY KEY,
      type         TEXT NOT NULL,
      counterparty TEXT,
      qty          REAL,
      unit         TEXT DEFAULT 'gen',
      rate         REAL,
      amount       REAL,
      status       TEXT DEFAULT 'completed',
      date         TEXT
    )
  `);
  await q(`
    CREATE INDEX IF NOT EXISTS idx_orders_requester ON orders(requester_name);
    CREATE INDEX IF NOT EXISTS idx_orders_counterparty ON orders(counterparty);
    CREATE INDEX IF NOT EXISTS idx_orders_role_date ON orders(requester_role, created_at);
    CREATE INDEX IF NOT EXISTS idx_tx_counterparty ON transactions(counterparty);
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  const countRes = await q('SELECT COUNT(*)::int AS c FROM users');
  if (countRes.rows[0].c > 0) return;
  const seedUsers = [
    { u: 'admin',          n: 'Faisal Ahmad',    e: 'faisal@genapp.com',    role: 'admin',  a: 'F', p: 'admin123' },
    { u: 'citygarage',     n: 'City Garage',     e: 'citygarage@email.com', role: 'client', a: 'C', p: 'client123' },
    { u: 'ahmedtraders',   n: 'Ahmed Traders',   e: 'ahmed@traders.com',   role: 'agent',  a: 'A', p: 'agent123' }
  ];
  for (const r of seedUsers) {
    await q(
      'INSERT INTO users (username, name, email, role, avatar, status, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [r.u, r.n, r.e, r.role, r.a, 'active', bcrypt.hashSync(r.p, SALT)]
    );
  }
  console.log('[auth] seeded 3 demo users (hashed).');
}

function sign(payload) {
  return crypto.createHmac('sha256', COOKIE_SECRET).update(String(payload)).digest('hex');
}
function setSession(res, userId) {
  const cookie = `${userId}.${sign(userId)}`;
  res.setHeader('Set-Cookie', `sid=${cookie}; HttpOnly; Path=/; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}`);
}
function clearSession(res) {
  res.setHeader('Set-Cookie', `sid=; HttpOnly; Path=/; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}; Max-Age=0`);
}
function getSessionUserId(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const m = raw.match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig) return null;
  if (sig !== sign(payload)) return null;
  return payload;
}
async function sessionUser(req) {
  const uid = getSessionUserId(req);
  if (!uid) return null;
  const r = await q(`SELECT ${pubCols} FROM users WHERE id = $1`, [uid]);
  return r.rows[0] || null;
}
async function requireAdmin(req, res) {
  const u = await sessionUser(req);
  if (!u || u.role !== 'admin') { res.status(u ? 403 : 401).json({ ok: false, error: u ? 'Forbidden' : 'Unauthenticated' }); return null; }
  return u;
}
async function requireAuth(req, res) {
  const u = await sessionUser(req);
  if (!u) { res.status(401).json({ ok: false, error: 'Unauthenticated' }); return null; }
  return u;
}

const orderClients = new Set();
const txClients = new Set();
function safeWrite(res, data) { try { res.write(data); if (typeof res.flush === 'function') res.flush(); } catch { } }
const broadcastOrder          = (order) => { const line = `event: order\ndata: ${JSON.stringify(order)}\n\n`; for (const res of orderClients) safeWrite(res, line); };
const broadcastTransaction    = (tx)   => { const line = `event: transaction\ndata: ${JSON.stringify(tx)}\n\n`;   for (const res of txClients) safeWrite(res, line); };
const broadcastOrderDelete    = (id)   => { const line = `event: order_delete\ndata: ${JSON.stringify({id})}\n\n`; for (const res of orderClients) safeWrite(res, line); };
const broadcastTransactionDelete = (id) => { const line = `event: transaction_delete\ndata: ${JSON.stringify({id})}\n\n`; for (const res of txClients) safeWrite(res, line); };

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'running' }));

app.post('/api/login', wrapAsync(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: 'Username and password required.' });
  const r = await q(`SELECT ${pubCols}, password_hash FROM users WHERE username = $1`, [username]);
  if (r.rowCount === 0) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  setSession(res, user.id);
  res.json({ ok: true, user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
}));

app.get('/api/me', wrapAsync(async (req, res) => {
  const u = await sessionUser(req);
  if (!u) return res.status(401).json({ ok: false, user: null });
  res.json({ ok: true, user: u });
}));

app.post('/api/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });

app.get('/api/users', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const r = await q(`SELECT ${pubCols} FROM users ORDER BY id`);
  res.json({ ok: true, users: r.rows });
}));

app.post('/api/users', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const { username, name, email, role, password } = req.body || {};
  if (!username || !name || !email || !password) return res.status(400).json({ ok: false, error: 'username, name, email and password are required.' });
  try {
    const r = await q(
      'INSERT INTO users (username, name, email, role, avatar, status, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [username, name, email, role || 'client', (name || '').charAt(0), 'active', bcrypt.hashSync(password, SALT)]
    );
    res.status(201).json({ ok: true, user: { id: r.rows[0].id, username, name, email, role: role || 'client', avatar: (name || '').charAt(0) } });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ ok: false, error: 'Username already exists.' });
    throw e;
  }
}));

app.put('/api/users/:id', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const id = Number(req.params.id);
  const { username, name, email, role, password } = req.body || {};
  if (!username || !name || !email) return res.status(400).json({ ok: false, error: 'username, name and email are required.' });
  let r;
  if (password) {
    r = await q('UPDATE users SET username = $1, name = $2, email = $3, role = $4, password_hash = $5 WHERE id = $6', [username, name, email, role || 'client', bcrypt.hashSync(password, SALT), id]);
  } else {
    r = await q('UPDATE users SET username = $1, name = $2, email = $3, role = $4 WHERE id = $5', [username, name, email, role || 'client', id]);
  }
  if (r.rowCount === 0) return res.status(404).json({ ok: false, error: 'User not found.' });
  res.json({ ok: true, user: { id, username, name, email, role: role || 'client', avatar: (name || '').charAt(0) } });
}));

app.delete('/api/users/:id', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ ok: false, error: 'invalid id' });
  if (a.id === id) return res.status(400).json({ ok: false, error: 'Cannot delete your own account' });
  const userRes = await q('SELECT name FROM users WHERE id = $1', [id]);
  if (userRes.rowCount > 0) {
    const userName = userRes.rows[0].name;
    const ordersRes = await q('SELECT id, counterparty FROM orders WHERE requester_name = $1', [userName]);
    for (const o of ordersRes.rows) {
      if (o.counterparty) {
        const txs = await q('SELECT id FROM transactions WHERE counterparty = $1', [o.counterparty]);
        for (const tx of txs.rows) broadcastTransactionDelete(tx.id);
        await q('DELETE FROM transactions WHERE counterparty = $1', [o.counterparty]);
      }
    }
    await q('DELETE FROM orders WHERE requester_name = $1', [userName]);
  }
  await q('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
}));

app.get('/api/orders', wrapAsync(async (req, res) => {
  const u = await requireAuth(req, res); if (!u) return;
  const r = await q(`SELECT ${orderCols} FROM orders ORDER BY id DESC`);
  res.json({ ok: true, orders: r.rows });
}));

app.post('/api/orders', wrapAsync(async (req, res) => {
  const u = await requireAuth(req, res); if (!u) return;
  const { type, counterparty, qty, litersQty, rate, amount, requester_name, requester_role } = req.body || {};
  if (!type || !counterparty) return res.status(400).json({ ok: false, error: 'type and counterparty required' });
  const role = (requester_role && u.role === 'admin') ? requester_role : u.role;
  const r = await q(
    'INSERT INTO orders (type, requester_role, requester_name, counterparty, qty, liters_qty, rate, amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [type, role, requester_name || u.name, counterparty, qty || 0, litersQty || 0, rate || 0, amount || 0]
  );
  const o = await q(`SELECT ${orderCols} FROM orders WHERE id = $1`, [r.rows[0].id]);
  broadcastOrder(o.rows[0]);
  res.status(201).json({ ok: true, order: o.rows[0] });
}));

app.patch('/api/orders/:id', wrapAsync(async (req, res) => {
  const u = await requireAuth(req, res); if (!u) return;
  const id = Number(req.params.id);
  const { status, delivered_qty } = req.body || {};
  if (isNaN(id) || (!status && delivered_qty === undefined)) return res.status(400).json({ ok: false, error: 'status or delivered_qty required' });
  const set = []; const vals = [];
  if (status)             { set.push(`status = $${vals.length + 1}`); vals.push(status); }
  if (delivered_qty !== undefined) { set.push(`delivered_qty = $${vals.length + 1}`); vals.push(delivered_qty); }
  vals.push(id);
  await q('UPDATE orders SET ' + set.join(', ') + ` WHERE id = $${vals.length}`, vals);
  const o = await q(`SELECT ${orderCols} FROM orders WHERE id = $1`, [id]);
  broadcastOrder(o.rows[0]);
  res.json({ ok: true, order: o.rows[0] });
}));

app.delete('/api/orders/:id', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ ok: false, error: 'invalid id' });
  const oRes = await q('SELECT counterparty FROM orders WHERE id = $1', [id]);
  if (oRes.rowCount > 0 && oRes.rows[0].counterparty) {
    const counterparty = oRes.rows[0].counterparty;
    const txs = await q('SELECT id FROM transactions WHERE counterparty = $1', [counterparty]);
    for (const tx of txs.rows) broadcastTransactionDelete(tx.id);
    await q('DELETE FROM transactions WHERE counterparty = $1', [counterparty]);
  }
  await q('DELETE FROM orders WHERE id = $1', [id]);
  broadcastOrderDelete(id);
  res.json({ ok: true });
}));

app.delete('/api/transactions/:id', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ ok: false, error: 'invalid id' });
  await q('DELETE FROM transactions WHERE id = $1', [id]);
  broadcastTransactionDelete(id);
  res.json({ ok: true });
}));

app.post('/api/admin/delete-data', wrapAsync(async (req, res) => {
  const a = await requireAdmin(req, res); if (!a) return;
  const { scope, dateRange } = req.body || {};
  const scopes = Array.isArray(scope) ? scope : (scope ? [scope] : []);
  if (scopes.length === 0) return res.status(400).json({ ok: false, error: 'scope required' });
  const results = {};
  for (const s of scopes) {
    if (s === 'transactions') {
      if (dateRange && dateRange.start) {
        if (dateRange.end) {
          results.transactions = (await q('DELETE FROM transactions WHERE date >= $1 AND date <= $2', [dateRange.start, dateRange.end])).rowCount;
        } else {
          results.transactions = (await q('DELETE FROM transactions WHERE date >= $1', [dateRange.start])).rowCount;
        }
      } else {
        results.transactions = (await q('DELETE FROM transactions')).rowCount;
      }
    } else if (s === 'agents') {
      const baseQ = "DELETE FROM orders WHERE requester_role = 'agent'";
      if (dateRange && dateRange.start) {
        if (dateRange.end) {
          results.agents = (await q(baseQ + ' AND created_at >= $1 AND created_at <= $2', [dateRange.start, dateRange.end])).rowCount;
        } else {
          results.agents = (await q(baseQ + ' AND created_at >= $1', [dateRange.start])).rowCount;
        }
      } else {
        results.agents = (await q(baseQ)).rowCount;
      }
    } else if (s === 'clients') {
      const baseQ = "DELETE FROM orders WHERE requester_role = 'client'";
      if (dateRange && dateRange.start) {
        if (dateRange.end) {
          results.clients = (await q(baseQ + ' AND created_at >= $1 AND created_at <= $2', [dateRange.start, dateRange.end])).rowCount;
        } else {
          results.clients = (await q(baseQ + ' AND created_at >= $1', [dateRange.start])).rowCount;
        }
      } else {
        results.clients = (await q(baseQ)).rowCount;
      }
    } else if (s === 'inventory') {
      results.inventory_orders = (await q('DELETE FROM orders')).rowCount;
    } else if (s === 'users') {
      const userRes = await q('SELECT name FROM users WHERE id != $1', [a.id]);
      for (const row of userRes.rows) {
        const orders = await q('SELECT counterparty FROM orders WHERE requester_name = $1', [row.name]);
        for (const o of orders.rows) {
          if (o.counterparty) await q('DELETE FROM transactions WHERE counterparty = $1', [o.counterparty]);
        }
        await q('DELETE FROM orders WHERE requester_name = $1', [row.name]);
      }
      results.users = (await q('DELETE FROM users WHERE id != $1', [a.id])).rowCount;
    }
  }
  const payload = JSON.stringify({ scope: scopes, dateRange: dateRange || null });
  for (const res of orderClients) safeWrite(res, `event: data_deleted\ndata: ${payload}\n\n`);
  for (const res of txClients)  safeWrite(res, `event: data_deleted\ndata: ${payload}\n\n`);
  res.json({ ok: true, deleted: results });
}));

app.get('/api/transactions', wrapAsync(async (req, res) => {
  const u = await requireAuth(req, res); if (!u) return;
  const r = await q(`SELECT ${txCols} FROM transactions ORDER BY id DESC`);
  res.json({ ok: true, transactions: r.rows });
}));

app.post('/api/transactions', wrapAsync(async (req, res) => {
  const u = await requireAuth(req, res); if (!u) return;
  const { type, counterparty, qty, unit, rate, amount, status, date } = req.body || {};
  if (!type || !counterparty) return res.status(400).json({ ok: false, error: 'type and counterparty required' });
  const r = await q(
    'INSERT INTO transactions (type, counterparty, qty, unit, rate, amount, status, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [type, counterparty, qty || 0, unit || 'gen', rate || 0, amount || 0, status || 'completed', date || new Date().toISOString().split('T')[0]]
  );
  const t = await q(`SELECT ${txCols} FROM transactions WHERE id = $1`, [r.rows[0].id]);
  broadcastTransaction(t.rows[0]);
  res.status(201).json({ ok: true, transaction: t.rows[0] });
}));

app.get('/api/orders/stream', (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write('retry: 4500\n\n');
  if (typeof res.flush === 'function') res.flush();
  orderClients.add(res);
  const hb = setInterval(() => safeWrite(res, ':hb\n\n'), 15000);
  req.on('close', () => { orderClients.delete(res); clearInterval(hb); });
});
app.get('/api/transactions/stream', (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write('retry: 4500\n\n');
  if (typeof res.flush === 'function') res.flush();
  txClients.add(res);
  const hb = setInterval(() => safeWrite(res, ':hb\n\n'), 15000);
  req.on('close', () => { txClients.delete(res); clearInterval(hb); });
});

app.use((err, req, res, next) => {
  console.error('[api] error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

initDb()
  .then(() => app.listen(PORT, '0.0.0.0', () => {
    console.log(`[auth] GenApp auth+static server on http://0.0.0.0:${PORT}`);
  }))
  .catch(err => {
    console.error('[auth] DB init failed:', err);
    process.exit(1);
  });

process.on('SIGTERM', () => { console.log('[auth] SIGTERM — closing pool…'); pool.end(() => process.exit(0)); });
process.on('SIGINT',  () => { console.log('[auth] SIGINT  — closing pool…');  pool.end(() => process.exit(0)); });
