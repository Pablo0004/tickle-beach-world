const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const vi = +(process.env.VI || 163);
  const v = await pg.evaluate((vi) => { const v = App.villages[vi]; App.cam.target.set(v.x, 0, v.z); const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + 545; return { x: v.x, z: v.z, w: v.walls }; }, vi);
  await L.look(pg, v.x, v.z, 60, 0.75, 0.9, 20000);
  const r = await pg.evaluate((vi) => {
    const out = [];
    for (const t of App.st.tickles) if (t.action && t.action.kind === 'wallwatch') out.push({ id: t.id, x: +t.pos.x.toFixed(1), y: +t.pos.y.toFixed(2), z: +t.pos.z.toFixed(1), deck: App.wallDeckY(t.pos.x, t.pos.z), ground: +App.genHeight(t.pos.x, t.pos.z).toFixed(2), vis: t.group && t.group.visible, gy: t.group && +t.group.position.y.toFixed(2) });
    const trav = App.st.tickles.filter(t => t.travel && /walls/.test(t.travel.why || t.travel.label || '')).length;
    return { T: App.st.T, n: App.st.tickles.length, out, trav, acts: App.st.tickles.reduce((m, t) => (m[t.action ? t.action.kind : 'none'] = (m[t.action ? t.action.kind : 'none'] || 0) + 1, m), {}) };
  }, vi);
  log(JSON.stringify(r));
  if (r.out.length) { const g = r.out[0]; await L.look(pg, g.x, g.z, 22, 0.75, 1.0, 3000); await L.noClouds(pg); await L.shot(pg, 'guard.png'); }
};
