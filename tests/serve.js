const http = require('http'), fs = require('fs'), path = require('path');
// usage: node tests/serve.js [root] [port]   (root defaults to the repository, port to 8765)
const root = process.argv[2] || path.join(__dirname, '..'), port = +process.argv[3] || 8765;
const T = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(port);
