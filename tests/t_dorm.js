const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const r = await pg.evaluate(() => { const cit = App.villages.find(v => v.kind === 'citadel'); const H = cit.houses[0]; const T = App.enterableAt(H.x, H.z); App.enter(T, { floor: 1 }); const R = App.mapOf(T).rooms[1]; return R.items.filter(i => i.k !== 'bed').map(i => i.k + '@' + i.x.toFixed(1) + ',' + i.z.toFixed(1) + (i.s ? ' s' + i.s : '') + (i.y ? ' y' + i.y : '')).join(' | ') + ' WARPS ' + JSON.stringify(R.warps.map(w => [w.kind, w.x, w.z])); });
  log(r);
  await pg.waitForTimeout(6000);
  for (const [rad, phi, th] of [[45, 0.3, 0], [45, 0.95, 3.14]]) { await pg.evaluate(([rad, phi, th]) => { App.cam.radius = rad; App.cam.phi = phi; App.cam.theta = th; }, [rad, phi, th]); await pg.waitForTimeout(2500); await L.shot(pg, 'dorm_' + rad + '_' + phi + '.png'); }
};
