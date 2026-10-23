const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  await pg.waitForFunction(() => App.st.tickles.filter(t => t.group && t.group.visible).length >= 6, null, { timeout: 120000 });
  const a = await pg.evaluate(() => {
    const st = App.st, d0 = Math.floor(st.T / 1440);
    for (let d = d0; d < d0 + 40; d++) {
      st.seaDay = null; st.T = d * 1440 + 6 * 60 + 1; App.seaTick();
      const A = st.seaAttacks.find(x => x.day === d);
      if (A) { st.T = A.t0 + 1; A.live = true; App.updateSeaBeasts(); return { day: d, kind: A.kind }; }
    }
    return null;
  });
  log('attack', JSON.stringify(a));
  if (!a) return;
  await pg.waitForTimeout(1500);
  const p = await pg.evaluate(() => { for (const f of App.handThings) for (const k of f(0, 0) || []) if (k.lift === undefined && k.obj && k.obj.lift === 7) return { x: k.x, y: k.y, z: k.z }; return null; });
  log('beast at', JSON.stringify(p));
  if (!p) return;
  await L.look(pg, p.x, p.z, 45, null, 0.85, 7000);
  const q = await pg.evaluate((p) => { App.applyCamera(); const f = App.handThings.map(f => f(App.cam.target.x, App.cam.target.z) || []).flat().find(k => k.obj && k.obj.lift === 7); return f && App.project(new THREE.Vector3(f.x, f.y, f.z)); }, p);
  await pg.mouse.click(q.x, q.y); await pg.waitForTimeout(800);
  log(JSON.stringify(await pg.evaluate(() => document.getElementById('placeCard').innerText.replace(/\s+/g, ' ').slice(0, 600))));
  await L.shot(pg, 'insp_seabeast.png');
};
