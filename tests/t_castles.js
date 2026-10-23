const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const ids = (process.env.IDS || '0,1,163,206').split(',').map(Number);
  const vs = await pg.evaluate((ids) => ids.map(i => { const v = App.villages[i]; return { i, x: v.x, z: v.z, kind: v.kind, f: v.floor }; }), ids);
  for (const v of vs) {
    await L.look(pg, v.x, v.z, 130, 0.75, 0.55, 10000); await L.noClouds(pg); await pg.waitForTimeout(500);
    await L.shot(pg, 'top_' + v.i + '.png');
    await L.look(pg, v.x, v.z, 70, 2.2, 0.95, 5000); await L.noClouds(pg); await pg.waitForTimeout(500);
    await L.shot(pg, 'side_' + v.i + '.png'); log('shot', v.i, v.kind, v.f);
  }
};
