module.exports = async (pg, log) => {
  const r = await pg.evaluate(() => {
    const out = [];
    for (let k = 0; k < 6; k++) {
      const d = Math.floor(App.st.T / 1440) + (k ? 1 : 0);
      App.st.T = d * 1440 + 13 * 60 + 55; App.dungeonTick();
      App.st.T = d * 1440 + 17 * 60 + 20; App.dungeonTick();
      out.push('day ' + d + ': ' + (App.st.uwlog || []).filter(e => e.day === d).length + ' parties; ' + (App.st.uwlog || []).filter(e => e.day === d).slice(0, 2).map(e => e.text.slice(0, 140)).join(' | '));
    }
    const deep = Object.values(App.st.depth || {}); return { out, maxDepth: Math.max(0, ...deep), guardians: Object.keys(App.st.guardians || {}) };
  });
  for (const x of r.out) log(x);
  log('max depth', r.maxDepth, 'guardians beaten', JSON.stringify(r.guardians));
};
