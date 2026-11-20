"""A plain file server for the game, in Python (no Node needed): python tests/serve.py [root] [port]
(root defaults to the repository, port to 8765). Same as tests/serve.js, with the film recorder's extras:
  GET  /film.html        the game with tools/film-hook.js loaded before anything else (the recorder's audio tap)
  POST /film/<name>      appends the request body to film/<name> under the root (the recorder sends its video in chunks);
                         with ?at=<offset> it is written at that offset instead
  DELETE /film/<name>    removes that file
"""
import os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):  # quiet, but for the film uploads
        if '/film/' in str(args[0] if args else ''):
            super().log_message(fmt, *args)

    def _film_path(self):
        name = os.path.basename(self.path.split('?')[0])
        if not re.fullmatch(r'[\w.-]+', name):
            return None
        d = os.path.join(ROOT, 'film')
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, name)

    def do_GET(self):
        if self.path.split('?')[0] == '/film.html':
            with open(os.path.join(ROOT, 'index.html'), 'rb') as f:
                page = f.read()
            stamp = str(int(os.path.getmtime(os.path.join(ROOT, 'tools', 'film-hook.js')))).encode()  # (never a stale copy from the cache)
            page = re.sub(rb'<script', b'<script src="tools/film-hook.js?v=' + stamp + b'"></script><script', page, count=1)
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(page)))
            self.end_headers()
            self.wfile.write(page)
            return
        super().do_GET()

    def do_POST(self):
        p = self._film_path() if self.path.startswith('/film/') else None
        if not p:
            self.send_error(400)
            return
        n = int(self.headers.get('Content-Length') or 0)
        data = self.rfile.read(n)
        q = self.path.split('?', 1)[1] if '?' in self.path else ''
        at = next((int(v) for k, _, v in (x.partition('=') for x in q.split('&')) if k == 'at' and v.isdigit()), None)
        if at is not None and os.path.exists(p):
            with open(p, 'r+b') as f:  # ?at=<offset>: written over that place (the muxer's header patch at the end)
                f.seek(at)
                f.write(data)
        else:
            with open(p, 'ab') as f:
                f.write(data)
        body = ('{"size": %d}' % os.path.getsize(p)).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_DELETE(self):
        p = self._film_path() if self.path.startswith('/film/') else None
        if not p:
            self.send_error(400)
            return
        try:
            os.remove(p)
        except OSError:
            pass
        self.send_response(200)
        self.send_header('Content-Length', '2')
        self.end_headers()
        self.wfile.write(b'ok')


Handler.extensions_map.update({'.mp4': 'video/mp4', '.webm': 'video/webm', '.js': 'text/javascript', '.md': 'text/plain'})
print('serving', ROOT, 'on', PORT)
ThreadingHTTPServer(('', PORT), Handler).serve_forever()
