module.exports = async (pg, log) => {
  const r = await pg.evaluate(() => {
    const out = [];
    for (const v of App.villages) if (["citadel", "fortress", "keep"].includes(v.kind) || v.residents.length >= 100) out.push([v.i, v.kind, v.region, v.floor, v.residents.length, v.name, v.fort ? JSON.stringify(Object.keys(v.fort)) : '-', Math.round(v.x), Math.round(v.z)]);
    return { out, settle: App.SETTLE };
  });
  for (const x of r.out) log(JSON.stringify(x));
  log(JSON.stringify(r.settle));
};
