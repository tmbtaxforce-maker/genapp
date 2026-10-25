// Minimal static file server for GenApp (zero dependencies).
// WHY: app.js is an ES module (type="module"). Chromium refuses to load
//      type="module" scripts from file:// URLs, so the app must be served
//      over http://. Double-click dev.bat to run; close the server window to stop.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico':  'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  rel = path.normalize('.' + rel).replace(/^(\.\.[\/\\])/g, './');
  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) { res.statusCode = 403; res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not Found'); return; }
    const ct = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GenApp  listening  http://127.0.0.1:${PORT}`);
  console.log('Close this window to stop the server.');
});
