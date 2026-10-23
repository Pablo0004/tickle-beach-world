const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.waitForFunction(() => App.st.tickles.length > 5, null, { timeout: 60000 });
  await pg.evaluate(() => { const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + 15 * 60 + 30; App.setListings([1, 2, 3, 4, 5, 100, 200, 300]); const P = App.parliament; App.cam.target.set(P.x, 0, P.z + 20); App.st.speed = 12; });
  for (let k = 0; k < 10; k++) { await pg.waitForTimeout(10000); log(await pg.evaluate(() => App.clock(App.st.T).label + ' agents ' + App.st.tickles.length + ' parl ' + App.st.tickles.filter(t => t.action && t.action.parl).length + ' | ' + (App.st.parl.log[0] ? App.st.parl.log[0].name + ' ' + App.st.parl.log[0].yes + '-' + App.st.parl.log[0].no : '-'))); }
  await pg.evaluate(() => { App.st.speed = 1; App.save(); });
  log('saved ' + await pg.evaluate(() => { const s = App.loadSaved(); return !!s && !!s.parliament && s.layout; }));
};
