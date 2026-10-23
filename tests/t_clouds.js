const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  for (const i of [0, 1]) {
    const v = await pg.evaluate((i) => { const v = App.villages[i]; return { x: v.x, z: v.z }; }, i);
    await L.look(pg, v.x, v.z, 120, 0.75, 0.92, 12000);
    log('weather', JSON.stringify(await pg.evaluate(() => App.weatherHere())));
    await L.shot(pg, 'cloud_' + i + '.png');
  }
};
