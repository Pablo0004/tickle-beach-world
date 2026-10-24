// The log seats round a village fire lie lengthwise round it (screenshot logs.png from above).
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg); await L.noClouds(pg);
  const v = await pg.evaluate(() => { const v = App.villages.find((v) => v.kind === "grand") || App.villages[0]; return { x: v.fire ? v.fire.x : v.x, z: v.fire ? v.fire.z : v.z, logs: (v.logs || []).filter(Boolean).length }; });
  log(JSON.stringify(v));
  await L.look(pg, v.x, v.z, 26, 0.3, 0.35, 9000);
  await L.shot(pg, "logs.png");
};
