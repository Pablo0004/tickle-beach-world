const http = require('http'), fs = require('fs'), path = require('path');
// usage: node tests/serve.js [root] [port]   (root defaults to the repository, port to 8765)
// A plain file server for the game. One extra: POST /film/<name> appends the request body to film/<name> under the
// root (the film recorder, tools/film.js, sends the video it records in chunks); DELETE /film/<name> removes it.
const root = process.argv[2] || path.join(__dirname, '..'), port = +process.argv[3] || 8765;
const T = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.md': 'text/plain' };
http.createServer((q, r) => {
  const url = decodeURIComponent(q.url.split('?')[0]);
  if (url.startsWith('/film/') && (q.method === 'POST' || q.method === 'DELETE')) {
    const name = path.basename(url), dir = path.join(root, 'film'), file = path.join(dir, name);
    if (!/^[\w.-]+$/.test(name)) { r.writeHead(400); return r.end(); }
    fs.mkdirSync(dir, { recursive: true });
    if (q.method === 'DELETE') { try { fs.unlinkSync(file); } catch (e) { /* not there */ } r.writeHead(200); return r.end('ok'); }
    const parts = [];
    q.on('data', (d) => parts.push(d));
    q.on('end', () => { fs.appendFile(file, Buffer.concat(parts), (e) => { if (e) { r.writeHead(500); return r.end(String(e)); } r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify({ size: fs.statSync(file).size })); }); });
    return;
  }
  // film.html: the game with the recorder's audio tap loaded first (tools/film-hook.js)
  if (url === '/film.html') return fs.readFile(path.join(root, 'index.html'), 'utf8', (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'text/html' }); r.end(d.replace(/<script/i, '<script src="tools/film-hook.js"></script><script')); });
  const p = path.join(root, url.replace(/^\/$/, '/index.html'));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
}).listen(port);
