const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const targets = await pg.evaluate(() => {
    const out = [];
    const add = (label, H, v) => out.push({ label, x: H.x, z: H.z, n: H.members.length, v: v.i });
    const cit = App.villages.find(v => v.kind === 'citadel'); add('citadel', cit.houses[0], cit);
    const keep = App.villages.find(v => v.kind === 'keep'); add('keep', keep.houses[0], keep);
    const gr = App.villages.find(v => v.kind === 'grand' && v.houses.length >= 2); add('mansion', gr.houses[0], gr);
    const md = App.villages.find(v => v.kind === 'medium'); add('medium', md.houses[0], md);
    const tw = App.villages.find(v => v.kind === 'town'); const pair = tw.houses.find(H => H.kind === 'townhouse' && H.members.length >= 3) || tw.houses[0]; add('townhouse', pair, tw);
    return out;
  });
  for (const t of targets) {
    const info = await pg.evaluate((t) => { const T = App.enterableAt(t.x, t.z); if (!T) return null; const map = App.mapOf(T); return { name: T.name, kind: T.kind, rooms: map.rooms ? map.rooms.map(R => R.name + ' beds:' + R.items.filter(i => i.k === 'bed').length + ' ' + R.w + 'x' + R.d) : 'floor fn' }; }, t);
    log(t.label, t.n, JSON.stringify(info));
    if (!info || !Array.isArray(info.rooms)) continue;
    for (let ri = 0; ri < Math.min(info.rooms.length, +(process.env.MAXR || 3)); ri++) {
      await pg.evaluate(([t, ri]) => { if (App.inside) App.leaveInterior(); }, [t, ri]);
      await pg.waitForTimeout(1500);
      await pg.evaluate(([t, ri]) => { App.enter(App.enterableAt(t.x, t.z), { floor: ri }); }, [t, ri]);
      await pg.waitForTimeout(6000);
      await L.shot(pg, 'in_' + t.label + '_' + ri + '.png');
    }
    await pg.evaluate(() => { if (App.inside) App.leaveInterior(); }); await pg.waitForTimeout(1500);
  }
};
