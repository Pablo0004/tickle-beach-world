const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const vi = +(process.env.VI || 163);
  const r = await pg.evaluate((vi) => {
    const v = App.villages[vi], day = Math.floor(App.st.T / 1440), out = [];
    for (const id of v.residents) { const p = App.planOf(id, day); const s = p && (p.steps || p).find && (p.steps || p).find(x => x.k === 'wallwatch'); if (s) out.push([id, s.s, s.e]); }
    return { n: v.residents.length, out, keys: Object.keys(App.planOf(v.residents[0], day) || {}) };
  }, vi);
  log(JSON.stringify(r));
  const g = r.out.find(x => x[1] === 540) || r.out[0];
  if (!g) return;
  // put the clock in the turn and follow the guard
  await pg.evaluate(([id, s]) => { const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + s + 20; App.goToToken(id, true); App.st.speed = 12; }, g);
  await pg.waitForFunction((id) => App.st.tickles.some(x => x.id === id), g[0], { timeout: 60000 });
  await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); const s = t.step || App.planOf(id, Math.floor(App.st.T/1440)).steps.find(x => x.k === 'wallwatch'); t.pos.x = s.p.x; t.pos.z = s.p.z; t.action = null; }, g[0]);
  for (let k = 0; k < 12; k++) { await pg.waitForTimeout(2000); const a = await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); if (!t || !t.action) return '-'; const a = t.action, P = a.path && a.path[a.path.length - 1]; return a.kind + ' ' + Math.round(App.st.T) + ' ' + (a.label || '') + ' pos ' + Math.round(t.pos.x) + ',' + Math.round(t.pos.z) + ' to ' + (P ? Math.round(P.x) + ',' + Math.round(P.z) + ' n' + a.path.length : '') + ' step ' + (t.step ? t.step.k + ' ' + t.step.s : ''); }, g[0]); log(a); if (a.startsWith('wallwatch')) break; }
  await pg.evaluate(() => { App.st.speed = 1; });
  const q = await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); return t ? { act: t.action && t.action.kind, x: t.pos.x, y: t.pos.y, z: t.pos.z, deck: App.wallDeckY(t.pos.x, t.pos.z), gy: t.group && t.group.position.y, T: App.st.T, ground: App.genHeight(t.pos.x, t.pos.z) } : 'not agent'; }, g[0]);
  log(JSON.stringify(q));
  if (q.x != null) { await L.look(pg, q.x, q.z, 24, 0.75, 1.05, 3000); await L.noClouds(pg); await L.shot(pg, 'guard.png'); }
};
