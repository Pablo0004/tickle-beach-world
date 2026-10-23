const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const r = await pg.evaluate(() => {
    const P = App.parliament; if (!P) return null;
    const S = App.parliamentSeats();
    const near = (App.diveSites || []).filter(d => Math.hypot(d.x - App.ISLE.x, d.z - App.ISLE.z) < 70).length;
    return { P: { x: P.x, z: P.z, door: P.door, sc: P.sc && P.sc.type }, seats: S.seats.length, blocs: S.blocs.length, top: S.blocs.slice(0, 6).map(g => g.n + ':' + g.s), minN: Math.min(...S.blocs.map(g => g.n)), diveNear: near, statue: !!App.isleStatue };
  });
  log(JSON.stringify(r));
  if (!r) return;
  // a sitting: the agenda at four, the vote at half past five
  const v = await pg.evaluate(() => {
    const d = Math.floor(App.st.T / 1440);
    App.st.T = d * 1440 + 16 * 60 + 1; App.parliamentTick();
    const ag = JSON.parse(JSON.stringify(App.st.parl.agenda));
    App.st.T = d * 1440 + 17 * 60 + 31; App.parliamentTick();
    const mins = App.parliamentSeats().seats.filter(id => { const s = App.planStep(id, App.st.T).step; return s.k === 'parliament'; }).length;
    return { ag, log: App.st.parl.log.slice(0, 3), laws: App.st.parl.laws, att: mins, note: App.parliamentNote() };
  });
  log(JSON.stringify(v));
  // force more sittings to see laws pass and fail
  const many = await pg.evaluate(() => { const out = []; for (let k = 1; k <= 8; k++) { const d = Math.floor(App.st.T / 1440) + 1; App.st.T = d * 1440 + 16 * 60 + 1; App.parliamentTick(); App.st.T = d * 1440 + 17 * 60 + 31; App.parliamentTick(); } return { laws: App.st.parl.laws, log: App.st.parl.log.slice(0, 9).map(L => 'D' + L.day + ' ' + L.name + ' ' + (L.passed ? 'PASS' : 'fail') + ' ' + L.yes + '-' + L.no) }; });
  log(JSON.stringify(many));
  await L.look(pg, r.P.x, r.P.z + 20, 90, 0.4, 0.9, 16000); await L.noClouds(pg);
  await L.shot(pg, 'parl_out.png');
  await pg.evaluate(() => { const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + 17 * 60; });
  await pg.evaluate(() => { App.enter(App.enterableAt(App.parliament.door.x, App.parliament.door.z)); });
  await pg.waitForTimeout(12000);
  await L.shot(pg, 'parl_in.png');
  log(await pg.evaluate(() => document.getElementById('roomHud') ? document.getElementById('roomHud').textContent.slice(0, 300) : ''));
};
