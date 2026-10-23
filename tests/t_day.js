const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.evaluate(() => { const P = App.prison; const near = App.villages.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; App.setListings(near.residents.slice(0, 15).concat([11, 12, 13, 14, 15])); App.cam.target.set(P.x, 0, P.z); App.st.speed = 12; });
  for (let k = 0; k < 12; k++) { await pg.waitForTimeout(10000); log(await pg.evaluate(() => App.clock(App.st.T).label + ' agents ' + App.st.tickles.length + ' ' + JSON.stringify(App.st.tickles.filter(t => App.isListed(t.id)).reduce((m, t) => (m[(t.step && t.step.k) + '/' + (t.action ? t.action.kind : '-')] = (m[(t.step && t.step.k) + '/' + (t.action ? t.action.kind : '-')] || 0) + 1, m), {})))); }
};
