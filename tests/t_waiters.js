const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  await pg.evaluate(() => { const st = App.st, d = Math.floor(st.T / 1440); st.T = d * 1440 + 20 * 60 + 50; for (let i = 0; i < 600; i++) { st.T += 0.05; App.casinoTick(); } const Cs = App.casinos[0]; App.enter(App.enterableAt(Cs.door.x, Cs.door.z), { floor: 0 }); });
  await pg.waitForTimeout(12000);
  const snap = () => pg.evaluate(() => (App.inside.figures || []).filter(f => f.tag === 'waiter').map(f => Math.round(f.wx * 10) / 10 + ',' + Math.round(f.wz * 10) / 10 + ' ' + f.pose + (f.route ? ' r' + f.route.length : '')));
  const a = await snap(); await pg.waitForTimeout(6000); const b = await snap(); await pg.waitForTimeout(6000); const c = await snap();
  log('waiters t0', JSON.stringify(a)); log('t+6s', JSON.stringify(b)); log('t+12s', JSON.stringify(c));
  await L.shot(pg, 'waiters.png');
};
