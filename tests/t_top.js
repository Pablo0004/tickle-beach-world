const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const ids = (process.env.IDS || '0').split(',').map(Number);
  for (const i of ids) {
    const v = await pg.evaluate((i) => { const v = App.villages[i]; return { x: v.x, z: v.z, kind: v.kind }; }, i);
    await L.look(pg, v.x, v.z, +(process.env.R || 230), 0.75, +(process.env.PHI || 0.12), 14000); await L.noClouds(pg); await pg.waitForTimeout(800);
    await L.shot(pg, 'up_' + i + '.png'); log('shot', i, v.kind);
  }
};
