// Under the sea in first person (item 1.2c): your own Tickle three blocks down in a kelp forest (a cool sea) and in a
// coral garden (a warm one), looking about; screenshots uw_0.png, uw_1.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.waitForFunction(() => App.st.tickles.filter((t) => t.group && !App.isKO(t.id)).length >= 2, null, { timeout: 180000 });
  const spots = await pg.evaluate(() => {
    const out = [];
    for (const warm of [false, true]) {
      let got = null;
      for (let r = 300; r < 2400 && !got; r += 20) for (let a = 0; a < 6.28 && !got; a += 0.1) {
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!App.seaAt(x, z) || App.WATER_Y - App.seaFloorY(x, z) < 4.5) continue;
        const R = App.regions[App.regionOf(x, z)];
        if ((R.name === "Beach Sand" || R.name === "The Palm") === warm) got = [x, z];
      }
      if (got) out.push(got);
    }
    return out;
  });
  let i = 0;
  for (const [x, z] of spots) {
    await pg.evaluate(([x, z]) => {
      const st = App.st, t = st.tickles.find((t) => !App.isKO(t.id));
      if (App.fpOn()) App.exitFP();
      st.mode = "manual"; st.wallet = App.ownerOf(t.id);
      App.endAction(t); t.pos.x = x; t.pos.z = z; App.cam.target.set(x, 7, z);
      App.enterFP(t.id);
      t.action.water = true; t.action.dive = 3;
      window.__t = t;
    }, [x, z]);
    await pg.waitForTimeout(12000);
    await pg.evaluate(() => App.fpLook(0, 60));
    await pg.waitForTimeout(3000);
    log(JSON.stringify(await pg.evaluate(() => {
      const out = [], c = App.camera.position;
      for (const o of App.scene.children) if (o.isInstancedMesh && o.count && o.geometry.attributes.position.count < 60000) {
        const M = new THREE.Matrix4(), p = new THREE.Vector3();
        let best = 1e9;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); p.setFromMatrixPosition(M); best = Math.min(best, p.distanceTo(c)); }
        if (best < 25) out.push([o.material.type + (o.material.onBeforeCompile ? "*" : ""), o.count, +best.toFixed(1), o.visible]);
      }
      return out.slice(0, 20);
    })));
    log(JSON.stringify(await pg.evaluate(() => ({ y: +__t.pos.y.toFixed(2), cam: +App.camera.position.y.toFixed(2), life: Object.values(App.seaLifeCounts()).reduce((a, b) => a + b, 0), tris: App.renderer.info.render.triangles }))));
    await L.hidePanels(pg);
    await L.shot(pg, "uw_" + i++ + ".png");
  }
};
