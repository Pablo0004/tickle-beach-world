// Block textures (item 1.2): close views of a village (grass, paths, plank and log houses), farmland, a beach and
// a cliff; screenshots tex_N.png. Options: NOTEX=1 switches the textures off (flat blocks) for a comparison.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg); await L.noClouds(pg);
  if (process.env.Q) await pg.evaluate((q) => App.setQuality(q), process.env.Q);
  if (process.env.NOTEX) await pg.evaluate(() => { App.gfx = Object.assign(App.gfx || {}, { flatBlocks: true }); });
  const spots = await pg.evaluate(() => {
    const v = App.villages.find((v) => v.kind === "town") || App.villages[0];
    // a beach: walk out from the village until the sand
    let beach = null;
    for (let r = 10; r < 300 && !beach; r += 4) for (let a = 0; a < 6.28 && !beach; a += 0.4) { const x = v.x + Math.cos(a) * r, z = v.z + Math.sin(a) * r; if (App.getBlock(Math.floor(x), App.columnHeight(Math.floor(x), Math.floor(z)) - 1, Math.floor(z)) === App.BLOCK.SAND) beach = [x, z]; }
    return { v: [v.x, v.z], beach };
  });
  log(JSON.stringify(spots));
  const views = [[spots.v[0], spots.v[1], 14, 0.6, 1.05], [spots.v[0], spots.v[1], 34, 2.2, 0.9], spots.beach && [spots.beach[0], spots.beach[1], 12, 1.2, 1.0], [spots.v[0], spots.v[1], 30, 0.3, 1.42]].filter(Boolean);
  let i = 0;
  for (const [x, z, r, th, ph] of views) {
    await L.look(pg, x, z, r, th, ph, 12000);
    for (let k = 0; k < 40 && (await pg.evaluate(() => App.jobsPending())); k++) await pg.waitForTimeout(1000);
    await pg.waitForTimeout(3000);
    log('fine models', await pg.evaluate(() => Object.keys(App.fragX).length), 'quality', await pg.evaluate(() => App.gfx.quality), 'shadows', await pg.evaluate(() => App.renderer.shadowMap.enabled));
    const ms = await pg.evaluate(() => { const t0 = performance.now(); App.render(); return performance.now() - t0; });
    log("view", i, "render ms", ms.toFixed(0), "tris", await pg.evaluate(() => App.renderer.info.render.triangles));
    await L.shot(pg, (process.env.NOTEX ? "notex_" : "tex_" + (process.env.Q || "") ) + i++ + ".png");
  }
};
