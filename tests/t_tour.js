module.exports = async (pg, log) => {
  const r = await pg.evaluate(() => {
    const st = App.st, Cs = App.casinos[0], d = Math.floor(st.T / 1440);
    // play as the holder of a Tickle with shells, and enter it
    let id = null;
    for (const v of App.villages.filter(v => v.region === Cs.region)) { id = v.residents.find(x => App.shellsOf(x) >= 30 && !App.isKO(x)); if (id != null) break; }
    st.wallet = App.ownerOf(id);
    st.T = d * 1440 + 19 * 60 + 5;
    const before = App.shellsOf(id);
    const err = App.casinoRegister(Cs, id);
    const out = { id, name: App.nameOf(id), err, before, steps: [] };
    let lastAlive = -1;
    for (let i = 0; i < 4 * 60 * 5 && st.T < d * 1440 + 23 * 60 + 59; i++) {
      st.T += 0.2; App.casinoTick();
      const R = App.casinoTour(Cs);
      if (R.started && R.alive.size !== lastAlive) { lastAlive = R.alive.size; out.steps.push(App.clock(st.T).short + ' alive ' + R.alive.size + ' level ' + R.level + (R.alive.has(id) ? ' (mine in)' : ' (mine out)')); }
      if (R.done) { out.done = true; out.cancelled = !!R.cancelled; out.n = R.n; out.places = (R.places || []).map(q => App.nameOf(q.id) + ' ' + q.n); out.mineOutAt = R.out.indexOf(id); break; }
    }
    out.after = App.shellsOf(id); out.T = App.clock(st.T).short;
    return out;
  });
  log(JSON.stringify(r, null, 1).slice(0, 3000));
};
