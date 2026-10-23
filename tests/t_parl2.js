const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const v = await pg.evaluate(() => {
    const d = Math.floor(App.st.T / 1440), S = App.parliamentSeats().seats;
    let near = 0, sit = 0, att = 0;
    for (const id of S) { const v = App.villageOfToken(id), D = App.docks.find(x => x.region === v.region); if (D && Math.hypot(D.x - App.homeOf(id).x, D.z - App.homeOf(id).z) < 340) near++; if (App.sitsToday(id, d)) sit++; }
    App.st.T = d * 1440 + 17 * 60;
    for (const id of S) { const s = App.planStep(id, App.st.T).step; if (s.k === 'parliament') att++; }
    return { near, sit, att };
  });
  log(JSON.stringify(v));
  await pg.evaluate(() => { App.enter(App.enterableAt(App.parliament.door.x, App.parliament.door.z)); });
  await pg.waitForTimeout(25000);
  await L.shot(pg, 'parl_in.png');
  log(await pg.evaluate(() => document.getElementById('roomHud').textContent.slice(0, 200)));
};
