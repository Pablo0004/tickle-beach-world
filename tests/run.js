// usage: node tests/run.js tests/<script>.js   (with the game served at BASE, see tests/README.md)
// A script exports async (pg, log) => {}; it gets the page once the world has loaded.
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PWP || 'playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
const THREE_LOCAL = path.join(__dirname, 'vendor', 'three.min.js');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: +(process.env.W || 1100), height: +(process.env.H || 720) } });
  const errs = [];
  // three.js from a local copy if there is one (tests/vendor/three.min.js), else from its CDN; everything else outside
  // the local server (music, owners refreshes...) is blocked so a run does not depend on the network
  if (fs.existsSync(THREE_LOCAL)) await pg.route('**/three.min.js', (r) => r.fulfill({ path: THREE_LOCAL, contentType: 'text/javascript' }));
  await pg.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => (r.request().url().includes('three.min.js') ? r.fallback() : r.abort()));
  pg.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 300)); });
  const t0 = Date.now();
  await pg.goto(BASE + (process.env.PAGE || ''), { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => window.App && document.getElementById('loading') && document.getElementById('loading').hidden, null, { timeout: 300000 }).catch(() => errs.push('LOAD TIMEOUT'));
  console.log('loaded in', (Date.now() - t0) / 1000, 's');
  try { await require(path.resolve(process.argv[2]))(pg, console.log); } catch (e) { console.log('SCRIPT ERR', e.message); }
  console.log('ERRORS', errs.length); for (const e of [...new Set(errs)].filter((e) => !e.includes('Failed to load resource')).slice(0, 30)) console.log(' ', e);
  await b.close();
})();
