// An arena from above and from the side: its four gates (screenshots arena_top.png, arena_side.png).
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg); await L.noClouds(pg);
  const a = await pg.evaluate(() => { const s = App.sceneryAll.find((s) => /^arena/.test(s.type)); return [s.x, s.z, s.rot]; });
  await L.look(pg, a[0], a[1], 70, a[2], 0.5, 10000); await L.shot(pg, "arena_top.png");
  await L.look(pg, a[0], a[1], 45, a[2] + 0.8, 1.2, 4000); await L.shot(pg, "arena_side.png");
};
