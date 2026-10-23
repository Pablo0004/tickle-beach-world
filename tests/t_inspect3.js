const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  await pg.waitForFunction(() => App.st.tickles.filter(t => t.group && t.group.visible).length >= 6, null, { timeout: 120000 });
  const seen = {};
  const docks = await pg.evaluate(() => App.docks.slice(0, 6).map(d => ({ x: d.x, z: d.z })));
  const spots = docks.concat(await pg.evaluate(() => App.st.tickles.slice(0, 4).map(t => ({ x: t.pos.x, z: t.pos.z }))));
  for (const s of spots) {
    await L.look(pg, s.x, s.z, 30, null, 0.9, 6000);
    const r = await pg.evaluate(() => { const out = []; for (const f of App.handThings) for (const k of f(App.cam.target.x, App.cam.target.z) || []) { if (!k.info) { out.push('NOINFO ' + (k.sound || '')); continue; } try { const I = k.info(); out.push(I ? I.title + ' | ' + I.sub + ' | ' + (I.rows || []).map(r => r.join(': ')).join('; ') : 'null'); } catch (e) { out.push('ERR ' + e.message); } } return out; });
    for (const x of r) { const key = x.split(' | ')[0]; if (!seen[key]) { seen[key] = 1; log(x.slice(0, 260)); } }
  }
  // a sea beast attack
  const r = await pg.evaluate(() => { try { if (!App.startSeaAttack) return 'no startSeaAttack'; const d = App.docks[0]; const A = App.startSeaAttack(d.i, 'serpent'); return !!A; } catch (e) { return 'ERR ' + e.message; } });
  log('sea attack', r);
};
