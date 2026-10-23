const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const floors = (process.env.FL || '0,2,4,6,8').split(',').map(Number);
  for (const f of floors) {
    const info = await pg.evaluate((f) => {
      const dg = App.dungeons[0], T = { kind: 'dungeon', dg, door: dg.door }, map = App.mapOf(T), R = map.floor(f);
      if (App.inside) App.leaveInterior();
      return { name: R.name, gem: R.gem, pools: (R.pools || []).length, warps: R.warps.map(w => w.kind + ':' + w.label), guardian: R.boss && R.boss.name, mons: R.mons.length, hall: R.hall && { x: R.hall.x0 + R.hall.size / 2, z: R.hall.z0 + R.hall.size / 2 } };
    }, f);
    log(f, JSON.stringify(info));
    await pg.waitForTimeout(1500);
    await pg.evaluate(([f, at]) => { const dg = App.dungeons[0]; App.enter({ kind: 'dungeon', dg, door: dg.door }, { floor: f, at }); }, [f, info.gem || info.hall]);
    await pg.waitForTimeout(14000);
    await pg.evaluate(() => { App.cam.radius = 34; App.cam.phi = 0.85; });
    await pg.waitForTimeout(4000);
    await L.shot(pg, 'under_' + f + '.png');
  }
};
