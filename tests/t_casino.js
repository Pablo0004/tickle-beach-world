const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const rooms = await pg.evaluate(() => {
    const st = App.st, Cs = App.casinos[0], d = Math.floor(st.T / 1440);
    st.T = d * 1440 + 20 * 60 + 50;
    for (let i = 0; i < 600; i++) { st.T += 0.05; App.casinoTick(); }
    const T = App.enterableAt(Cs.door.x, Cs.door.z), map = App.mapOf(T);
    return map.rooms.map((R, i) => i + ':' + R.name + ' ' + R.w + 'x' + R.d);
  });
  log(rooms.join(' | '));
  const n = rooms.length;
  for (let ri = 0; ri < n; ri++) {
    await pg.evaluate((ri) => { if (App.inside) App.leaveInterior(); }, ri);
    await pg.waitForTimeout(1200);
    await pg.evaluate((ri) => { const Cs = App.casinos[0]; App.enter(App.enterableAt(Cs.door.x, Cs.door.z), { floor: ri }); }, ri);
    await pg.waitForTimeout(12000);
    const info = await pg.evaluate(() => { const T = App.casinoTables(App.casinos[0]); return T.filter(t => t.kind === 'poker' && !t.def.tour).map(t => t.key + ':' + t.phase + ':' + t.seats.filter(Boolean).length + ' seated, cards ' + t.seats.filter(Boolean).map(S => (S.cards || []).length).join('')).join(' | '); });
    log(ri, info);
    await L.shot(pg, 'casino_' + ri + '.png');
  }
};
