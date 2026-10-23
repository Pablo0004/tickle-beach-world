module.exports = async (pg, log) => {
  const r = await pg.evaluate(() => {
    const sc = App.sceneryAll || [], out = { n: sc.length };
    const kinds = {}; for (const s of sc) { const k = s.building ? 'b' : s.tree ? 't' : 'o'; kinds[k] = (kinds[k] || 0) + 1; }
    out.kinds = kinds;
    const types = {}; for (const s of sc) { const k = App.kindOf(s.type); types[k] = (types[k] || 0) + 1; }
    out.types = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 40);
    out.sample = Object.keys(sc[0] || {});
    return out;
  });
  log(JSON.stringify(r));
};
