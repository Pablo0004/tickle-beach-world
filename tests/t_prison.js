const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const P = await pg.evaluate(() => App.prison ? { x: App.prison.x, z: App.prison.z, region: App.regions[App.prison.region].name, rocks: App.prison.rocks.length, door: App.prison.door, sc: App.prison.sc && App.prison.sc.type } : null);
  log('prison', JSON.stringify(P));
  if (!P) return;
  // 30 Tickles up for sale: from the nearest village and from far away
  const r = await pg.evaluate(() => {
    const P = App.prison, near = App.villages.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    const ids = near.residents.slice(0, 20).concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const n = App.setListings(ids);
    const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + 640;
    const pl = App.planOf(ids[0], d);
    return { n, near: near.name, plan: pl.steps.map((s) => s.k + '@' + Math.round(s.s)), info: App.listingsInfo(), ids };
  });
  log(JSON.stringify(r));
  await L.look(pg, P.x, P.z, 55, 0.75, 0.85, 20000); await L.noClouds(pg);
  await L.shot(pg, 'prison_out.png');
  const who = await pg.evaluate((ids) => ids.map((id) => { const t = App.st.tickles.find((x) => x.id === id); return t ? id + ':' + (t.action ? t.action.kind : '-') + ':' + Math.round(Math.hypot(t.pos.x - App.prison.x, t.pos.z - App.prison.z)) : null; }).filter(Boolean), r.ids);
  log('agents', who.join(' '));
  await L.look(pg, P.x, P.z, 26, 2.4, 1.0, 6000); await L.noClouds(pg);
  await L.shot(pg, 'prison_yard.png');
  // inside: the guard room, the canteen at noon, a cell block at night
  for (const [T, ri, name] of [[700, 0, 'guard'], [740, 1, 'canteen'], [1300, 2, 'cells']]) {
    await pg.evaluate(([T, ri]) => { const d = Math.floor(App.st.T / 1440); App.st.T = d * 1440 + T; if (App.inside) App.leaveInterior(); }, [T, ri]);
    await pg.waitForTimeout(1500);
    await pg.evaluate(([T, ri]) => { App.enter(App.enterableAt(App.prison.door.x, App.prison.door.z), { floor: ri }); }, [T, ri]);
    await pg.waitForTimeout(7000);
    await L.shot(pg, 'prison_in_' + name + '.png');
  }
  const card = await pg.evaluate(() => { if (App.inside) App.leaveInterior(); const I = App.prisonInfo(); return I.name + ' | ' + I.rows.map((r) => r[0] + ': ' + r[1].replace(/<[^>]+>/g, '')).join(' | '); });
  log(card);
};
