// The sea's breakers (item 1.2): made of small cubes. Goes to a beach of the open sea and takes screenshots of the
// waves building, breaking and the foam (waves_N.png), and the count of breakers near.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg); await L.noClouds(pg);
  const S = await pg.evaluate(() => {
    for (let r = 200; r < 2000; r += 40) for (let a = 0; a < 6.28; a += 0.2) {
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (App.seaAt && App.seaAt(x, z) && App.isLand(x + Math.cos(a) * -6, z + Math.sin(a) * -6)) return [x, z, a];
    }
    return null;
  });
  log("beach", JSON.stringify(S));
  if (!S) return;
  await L.look(pg, S[0], S[1], 16, S[2] + 1.9, 1.15, 10000);
  // one wave held still at each stage: building, full, breaking (beside the beach, the camera side-on)
  await pg.evaluate(([x, z, a]) => {
    App.stepSeaWaves = () => {};
    for (const o of App.scene.children.filter((o) => o.isGroup && o.userData && o.userData.bits)) o.visible = false;
    const dx = Math.cos(a), dz = Math.sin(a);
    const S = { sx: x, sz: z, dx: -dx, dz: -dz, tx: dz, tz: -dx };
    [[0.45, 0], [0.85, 0], [0.7, 0.5]].forEach(([h, b], i) => { const g = App._wave.makeWave(9); App._wave.placeWave(g, S, 4, (i - 1) * 10, h, b); });
  }, S);
  await L.look(pg, S[0] + Math.cos(S[2]) * 4, S[1] + Math.sin(S[2]) * 4, 12, -S[2] + 1.57 + 0.5, 1.25, 3000);
  await L.shot(pg, "waves_stages.png");
  // close to one breaker, from the beach side and low
  const B = await pg.evaluate(() => { const g = App.scene.children.find((o) => o.isGroup && o.userData && o.userData.bits && o.visible); return g ? [g.position.x, g.position.z, g.rotation.y] : null; });
  if (B) await L.look(pg, B[0], B[1], 8, B[2], 1.3, 3000);
  for (let i = 0; i < 3; i++) {
    log("breakers visible", await pg.evaluate(() => App.scene.children.filter((o) => o.isGroup && o.userData && o.userData.bits && o.visible).length));
    await L.shot(pg, "waves_" + i + ".png");
    await pg.waitForTimeout(2500);
  }
};
