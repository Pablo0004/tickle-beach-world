// Castles and mansions up close (item 1.2): the biggest places by kind, at the chosen quality (Q=high|ultra), once
// their finest copies are made; screenshots manor_<kind>.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  if (process.env.Q) await pg.evaluate((q) => App.setQuality(q), process.env.Q);
  const vs = await pg.evaluate(() => { const out = {}; for (const v of App.villages) if (!out[v.kind]) out[v.kind] = { x: v.x, z: v.z, i: v.i, name: v.name }; return out; });
  log(JSON.stringify(vs));
  for (const k of (process.env.KINDS || 'citadel,keep,grand').split(',')) {
    const v = vs[k]; if (!v) continue;
    await L.look(pg, v.x, v.z, { citadel: 120, keep: 80 }[k] || 40, 0.7, 1.0, 8000); await L.noClouds(pg);
    for (let i = 0; i < 150 && (await pg.evaluate(() => App.jobsPending())); i++) await pg.waitForTimeout(1000);
    await pg.waitForTimeout(3000);
    log(k, v.name, 'fine', await pg.evaluate(() => Object.keys(App.fragX).join(',')));
    await L.shot(pg, 'manor_' + k + '.png');
  }
};
