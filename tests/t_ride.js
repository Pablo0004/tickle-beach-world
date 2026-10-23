const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  const kinds = (process.env.KINDS || 'deer,sheep,boar,ogre,centaur,spider').split(',');
  await pg.waitForFunction(() => App.st.tickles.filter(t => t.group && !App.isKO(t.id)).length >= 8, null, { timeout: 120000 });
  const ids = await pg.evaluate((kinds) => {
    const st = App.st, out = [];
    const ts = st.tickles.filter(t => !App.isKO(t.id)).slice(0, kinds.length);
    ts.forEach((t, i) => {
      const k = kinds[i]; st.own = st.own || {};
      const o = st.own[t.id] || (st.own[t.id] = {}); delete o.m;
      if (App.RIDE_BEASTS[k]) { o.rb = k; st.tamed[t.id] = []; }
      else { st.tamed[t.id] = []; App.tameMonster(t.id, k, 5); }
      App.endAction && App.endAction(t);
      const a = Math.random() * 6.28; let dest = null;
      for (let r = 70; r < 200 && !dest; r += 10) for (let j = 0; j < 12 && !dest; j++) { const x = t.pos.x + Math.cos(a + j) * r, z = t.pos.z + Math.sin(a + j) * r; if (App.isLand(x, z)) dest = { x, z, label: 'a long trip' }; }
      App.startTravel(t, dest, 'a long trip');
      out.push([t.id, k, App.mountOf(t.id) && App.mountOf(t.id).name]);
    });
    return out;
  }, kinds);
  log(JSON.stringify(ids));
  await pg.waitForTimeout(6000);
  for (const [id, k] of ids) {
    const p = await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); return t ? { x: t.pos.x, z: t.pos.z, h: t.heading, riding: !!t.riding, seat: t.riding && t.riding.seat, act: t.action && t.action.kind, mo: !!App.mountObjOf(id) } : null; }, id);
    log(k, JSON.stringify(p));
    if (!p) continue;
    await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); App.cam.follow = t; }, id);
    await L.look(pg, p.x, p.z, 11, p.h + 1.9, 1.15, 100);
    await pg.evaluate((id) => { const t = App.st.tickles.find(x => x.id === id); App.cam.follow = t; App.cam.radius = 11; }, id);
    await pg.waitForTimeout(2500);
    await L.noClouds(pg);
    await L.shot(pg, 'ride_' + k + '.png');
  }
};
