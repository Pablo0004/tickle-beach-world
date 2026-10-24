// Life on the sea floor (item 1.2c): a stretch of open sea near the coast of a cool region and of a warm one; how much
// is placed and swims there, triangles, and screenshots from above the water (sea_N.png).
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg); await L.noClouds(pg);
  const spots = await pg.evaluate(() => {
    const out = [];
    for (const want of [false, true]) {
      let got = null;
      for (let r = 300; r < 2400 && !got; r += 25) for (let a = 0; a < 6.28 && !got; a += 0.13) {
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!App.seaAt(x, z) || App.WATER_Y - App.seaFloorY(x, z) < 3) continue;
        const R = App.regions[App.regionOf(x, z)], warm = R.name === "Beach Sand" || R.name === "The Palm";
        if (warm === want) got = [x, z, R.name];
      }
      if (got) out.push(got);
    }
    return out;
  });
  let i = 0;
  for (const [x, z, name] of spots) {
    await L.look(pg, x, z, 18, 0.8, 0.75, 14000);
    log(name, JSON.stringify(await pg.evaluate(() => App.seaLifeCounts())), "tris", await pg.evaluate(() => App.renderer.info.render.triangles));
    await L.shot(pg, "sea_" + i++ + ".png");
  }
};
