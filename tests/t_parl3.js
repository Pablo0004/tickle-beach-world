module.exports = async (pg, log) => {
  const v = await pg.evaluate(() => {
    const d = Math.floor(App.st.T / 1440), S = App.parliamentSeats().seats, out = [];
    for (const id of S) { const v = App.villageOfToken(id), D = App.docks.find(x => x.region === v.region); if (!(D && Math.hypot(D.x - App.homeOf(id).x, D.z - App.homeOf(id).z) < 340) || !App.sitsToday(id, d)) continue;
      const pl = App.planOf(id, d); out.push(pl.steps.map(s => s.k + '@' + Math.round(s.s) + '-' + Math.round(s.e)).join(' ')); }
    return out.slice(0, 14);
  });
  for (const x of v) log(x);
};
