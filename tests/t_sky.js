const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const t0 = Date.now();
  await pg.waitForFunction(() => App.farViewReady && App.farViewReady(), null, { timeout: 240000 }).catch(() => log('far view not ready'));
  log('far view ready after', (Date.now() - t0) / 1000, 's');
  const radii = (process.env.RADII || '46,130,400,1000,2600').split(',').map(Number);
  for (const r of radii) {
    await pg.evaluate((r) => { App.cam.radius = r; App.cam.phi = r > 1500 ? 0.55 : 0.92; }, r);
    await pg.waitForTimeout(6000);
    const info = await pg.evaluate(async () => {
      const ts = []; let last = performance.now();
      for (let i = 0; i < 20; i++) { await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); ts.push(n - last); last = n; }
      const ri = App.renderer.info.render;
      const fs = App.farStats(); const farTris = fs.reduce((a, x) => a + x[1] * x[2], 0), inst = fs.reduce((a, x) => a + x[2], 0);
      const top = fs.map(x => [x[0], x[1], x[2], x[1] * x[2]]).sort((a, b) => b[3] - a[3]).slice(0, 8);
      return { ms: Math.round(ts.reduce((a, b) => a + b) / ts.length), tris: ri.triangles, calls: ri.calls, farTris, inst, top: JSON.stringify(top) };
    });
    log('radius', r, JSON.stringify(info));
    await L.shot(pg, 'sky_' + r + '.png');
  }
};
