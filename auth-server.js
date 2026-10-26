'use strict';
/*
 * auth-server.js — GenApp static file server (simplified)
 *
 * All authentication is handled by Firebase Auth (Google Sign-In).
 * All data is stored in Firestore (real-time listeners).
 *
 * This server only serves static files (index.html, app.js, style.css,
 * firebase-config.js, icons, manifest, service worker).
 * No Express API routes, no SQLite, no session cookies, no SSE.
 */
const express = require('express');
const path    = require('path');
const helmet  = require('helmet');

const app   = express();
app.set('trust proxy', 1);
const PORT  = process.env.PORT || 8000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://www.gstatic.com", "https://www.googleapis.com", "https://www.google.com", "https://www.googletagmanager.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com", "https://*.google.com", "https://*.firebasestorage.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      childSrc: ["'self'"],
    },
  },
}));

app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => res.json({ ok: true, status: 'running' }));

// Serve index.html for all non-static routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[genapp] static server on http://0.0.0.0:' + PORT);
});

process.on('SIGTERM', () => { console.log('[genapp] SIGTERM'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[genapp] SIGINT');  process.exit(0); });
