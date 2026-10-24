// Who goes into their castle or mansion at night (owner's report, 24 October: they crowd and sleep at the door).
// Sets the clock to 22:30 at a citadel, a keep and an estate, lets the night run, then lists each resident on
// screen: what it does, how far from its home point, and whether it is shown outside. Screenshot night_<kind>.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const vs = await pg.evaluate(() => { const out = {}; for (const v of App.villages) if (!out[v.kind]) out[v.kind] = { x: v.x, z: v.z, i: v.i }; return out; });
  for (const k of (process.env.KINDS || 'citadel,keep,grand,medium').split(',')) {
    const v = vs[k]; if (!v) continue;
    await pg.evaluate((v) => { const st = App.st, d = Math.floor(st.T / 1440); st.T = d * 1440 + 22 * 60 + 30; App.flyTo(v.x, v.z, 40); }, v);
    await pg.evaluate(() => App.setSpeed ? App.setSpeed(12) : (App.st.speed = 12)); await pg.waitForTimeout(40000); await pg.evaluate(() => (App.st.speed = 1));
    const r = await pg.evaluate((vi) => {
      const v = App.villages[vi], rows = [], P = App.pop;
      let inside = 0, out = 0;
      for (const id of v.residents) {
        const t = P.agent[id]; if (!t) continue;
        const a = t.action, act = a && a.act ? a.act.id : a ? a.kind : "-";
        const d = Math.hypot(t.pos.x - t.home.x, t.pos.z - t.home.z);
        if (t.group.visible) out++; else inside++;
        if (t.group.visible) rows.push(App.nameOf(id) + " " + act + " " + (a && a.phase || "") + " d=" + d.toFixed(1));
      }
      return { name: v.name, kind: v.kind, residents: v.residents.length, onScreen: inside + out, inside, out, clock: App.clock(App.st.T).short, rows: rows.slice(0, 14) };
    }, v.i);
    log(JSON.stringify(r, null, 1));
    await L.shot(pg, "night_" + k + ".png");
  }
};
