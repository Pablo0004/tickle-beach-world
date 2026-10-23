const L = require('./lib');
// click things in the world and read the inspect window
module.exports = async (pg, log) => {
  await L.closeMenu(pg); await L.hidePanels(pg);
  await pg.waitForFunction(() => App.st.tickles.filter(t => t.group && t.group.visible).length >= 6, null, { timeout: 120000 });
  const card = async (tag) => {
    const r = await pg.evaluate(() => { const el = document.getElementById('placeCard'); return { hidden: el.hidden, insp: !!el.dataset.insp, text: el.innerText.replace(/\s+/g, ' ').slice(0, 700) }; });
    log(tag, JSON.stringify(r));
    return r;
  };
  const shut = () => pg.evaluate(() => { App.closeInspect(); document.getElementById('placeCard').hidden = true; });
  const clickAt = async (fnSrc, arg, tag, shot) => {
    await shut();
    const p = await pg.evaluate(([src, arg]) => { const f = eval(src); const w = f(arg); if (!w) return null; App.applyCamera(); const q = App.project(new THREE.Vector3(w.x, w.y, w.z)); return { x: q.x, y: q.y, behind: q.behind, what: w.what }; }, [fnSrc, arg]);
    if (!p || p.behind || p.x < 0 || p.y < 0 || p.x > 1100 || p.y > 720) { log(tag, 'NOT ON SCREEN', JSON.stringify(p)); return null; }
    const under = await pg.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + '#' + e.id : null; }, [p.x, p.y]);
    await pg.mouse.click(p.x, p.y);
    await pg.waitForTimeout(700);
    const r = await card(tag + ' (' + (p.what || '') + ' @' + Math.round(p.x) + ',' + Math.round(p.y) + ' on ' + under + ')');
    if (shot) await L.shot(pg, 'insp_' + shot + '.png');
    return r;
  };
  // 1. a Tickle
  const t0 = await pg.evaluate(() => { const t = App.st.tickles.find(t => t.group.visible && !App.isKO(t.id)); return { id: t.id, x: t.pos.x, z: t.pos.z }; });
  await L.look(pg, t0.x, t0.z, 16, null, 1.0, 2000);
  await pg.evaluate((id) => { App.cam.follow = id; }, t0.id);
  await pg.waitForTimeout(1500);
  await clickAt('(id) => { const t = App.st.tickles.find(t => t.id === id); return { x: t.pos.x, y: t.pos.y + 1.2, z: t.pos.z, what: t.name }; }', t0.id, 'TICKLE', 'tickle');
  await pg.evaluate(() => { App.cam.follow = null; });
  // 2. a pet at its Tickle's feet
  const pet = await pg.evaluate(() => { const tm = App.st.tickles.find(t => App.leadCreature(t.id) && t.group.visible); return tm ? { x: tm.pos.x, z: tm.pos.z } : null; });
  if (pet) {
    await L.look(pg, pet.x, pet.z, 14, null, 1.0, 6000);
    await clickAt('() => { const b = App.creatureBodiesNear(App.cam.target.x, App.cam.target.z, 40).find(b => !b.battle); return b && { x: b.x, y: (b.y || 0) + 0.6, z: b.z, what: b.sp }; }', null, 'CREATURE', 'creature');
  }
  // 3. a farm animal, 4. a tree, 5. the ground
  let found = null;
  for (const v of await pg.evaluate(() => App.villages.slice(0, 40).map(v => ({ x: v.x, z: v.z, name: v.name })))) {
    await L.look(pg, v.x, v.z, 40, null, 0.9, 5000);
    const n = await pg.evaluate(() => App.animalsNear(App.cam.target.x, App.cam.target.z, 80).length);
    if (n) { found = v; break; }
  }
  log('village with animals', JSON.stringify(found));
  if (found) {
    await pg.evaluate(() => { const a = (window._an = App.animalsNear(App.cam.target.x, App.cam.target.z, 80)[0]); App.cam.target.set(a.x, a.y, a.z); App.cam.radius = 18; });
    await pg.waitForTimeout(2500);
    await clickAt('() => { const a = window._an; return a && { x: a.x, y: a.y + 0.5, z: a.z, what: a.kind }; }', null, 'ANIMAL', 'animal');
  }
  await clickAt('() => { const T = App.cam.target; const s = App.sceneryVisible.filter(s => s.tree && !s.gone).sort((a, b) => Math.hypot(a.x - T.x, a.z - T.z) - Math.hypot(b.x - T.x, b.z - T.z))[0]; return s && { x: s.x, y: App.genHeight(s.x, s.z) + 2.4, z: s.z, what: s.type }; }', null, 'TREE', 'tree');
  await clickAt('() => { const T = App.cam.target; for (let i = 0; i < 200; i++) { const x = T.x + (Math.random() - 0.5) * 24, z = T.z + (Math.random() - 0.5) * 24; if (!App.isLand(x, z)) continue; if (App.sceneryVisible.some(s => Math.hypot(s.x - x, s.z - z) < 6) || App.st.tickles.some(t => Math.hypot(t.pos.x - x, t.pos.z - z) < 5) || App.animalsNear(x, z, 8).length || App.creatureBodiesNear(x, z, 8).length) continue; App.applyCamera(); const q = App.project(new THREE.Vector3(x, App.genHeight(x, z), z)); if (q.x < 450 || q.x > 1050 || q.y < 80 || q.y > 680) continue; return { x, y: App.genHeight(x, z) + 0.02, z, what: "ground" }; } }', null, 'GROUND', 'ground');
  // 6. the lake, near the isle
  const lake = await pg.evaluate(() => { for (let r = 52; r < 400; r += 2) { const x = r, z = 0; if (!App.isLand(x, z) && App.lakeSd(x, z) <= 0) return { x, z }; } });
  log('lake point', JSON.stringify(lake));
  if (lake) {
    await L.look(pg, lake.x + 10, lake.z, 30, null, 0.9, 5000);
    await clickAt('(p) => ({ x: p.x + 10, y: App.WATER_Y, z: p.z, what: "lake" })', lake, 'WATER', 'water');
  }
  // 7. a monster at a cave mouth
  const cave = await pg.evaluate(() => { const d = App.dungeons[0]; return { x: d.door.x, z: d.door.z }; });
  await L.look(pg, cave.x, cave.z, 30, null, 0.9, 8000);
  await clickAt('() => { const m = App.monstersNear(App.cam.target.x, App.cam.target.z, 60)[0]; return m && { x: m.x, y: m.y + 0.8, z: m.z, what: m.kind }; }', null, 'MONSTER', 'monster');
  // 8. a dragon on its peak
  const lair = await pg.evaluate(() => { const L = App.lairs[0]; return { x: L.x, z: L.z }; });
  await L.look(pg, lair.x, lair.z, 50, null, 0.8, 8000);
  await clickAt('() => { const d = [...App.dragonObjects.values()][0]; return d && { x: d.x, y: d.y + 3, z: d.z, what: "dragon" }; }', null, 'DRAGON', 'dragon');
  // inside: scan the screen for what can be clicked
  const scan = () => pg.evaluate(() => {
    const el = App.renderer.domElement, W = el.clientWidth, H = el.clientHeight, out = {};
    for (let y = 60; y < H - 20; y += 18) for (let x = 20; x < W - 20; x += 18) {
      const o = App.inspectPick({ x: (x / W) * 2 - 1, y: -((y / H) * 2 - 1) });
      if (!o) continue;
      let t; try { t = o.fn().title; } catch (e) { t = 'ERR ' + e.message; }
      if (!out[t]) out[t] = { x, y, live: !!o.live };
    }
    return out;
  });
  const clickInside = async (tag, pick, shot) => {
    const S = await scan();
    log(tag, 'pickable', JSON.stringify(Object.keys(S).slice(0, 30)));
    const k = Object.keys(S).find(pick);
    if (!k) { log(tag, 'nothing to click'); return; }
    await shut();
    // (the view drifts a little inside: pick again and click in the same moment)
    await pg.evaluate((k) => {
      const el = App.renderer.domElement, W = el.clientWidth, H = el.clientHeight;
      for (let y = 60; y < H - 20; y += 9) for (let x = 20; x < W - 20; x += 9) { const n = { x: (x / W) * 2 - 1, y: -((y / H) * 2 - 1) }, o = App.inspectPick(n); if (o && o.fn().title === k) { App.onWorldClick(n); return; } }
    }, k);
    await pg.waitForTimeout(800);
    await card(tag + ' clicked ' + k);
    if (shot) await L.shot(pg, 'insp_' + shot + '.png');
  };
  // a house with its people
  const home = await pg.evaluate((id) => { const v = App.villageOfToken(id); const H = (v.houses || [])[0] || v; return { x: H.x, z: H.z }; }, t0.id);
  await pg.evaluate((h) => { const T = App.enterableAt(h.x, h.z); if (T) App.enter(T, { floor: 0 }); }, home);
  await pg.waitForTimeout(9000);
  log('inside', await pg.evaluate(() => !!App.inside));
  if (await pg.evaluate(() => !!App.inside)) {
    await clickInside('HOUSE', (k) => /bed|chest|table|shelf|chair/i.test(k), 'house_item');
    await clickInside('HOUSE', (k) => /#\d+/.test(k), 'house_tickle');
    await clickInside('HOUSE', (k) => !/#\d+|Bookshelf|Chair|Window|Rug|Torch|Stove|Banner|Picture|Table|Seat|Treasure|Stairs|Doormat|Bed|Chest/i.test(k), 'house_room');
  }
  // an Underworld floor with monsters
  await pg.evaluate(() => { if (App.inside) App.leaveInterior(); });
  await pg.waitForTimeout(2000);
  const fl = await pg.evaluate(() => { const dg = App.dungeons[0], T = { kind: 'dungeon', dg, door: dg.door }, R = App.mapOf(T).floor(2); return { gem: R.gem, hall: R.hall && { x: R.hall.x0 + R.hall.size / 2, z: R.hall.z0 + R.hall.size / 2 } }; });
  await pg.evaluate((at) => { const dg = App.dungeons[0]; App.enter({ kind: 'dungeon', dg, door: dg.door }, { floor: 2, at }); }, fl.gem || fl.hall);
  await pg.waitForTimeout(12000);
  await pg.evaluate(() => { App.cam.radius = 30; App.cam.phi = 0.85; });
  await pg.waitForTimeout(3000);
  await clickInside('UNDER', (k) => /gem|Teleport/i.test(k), 'under_gem');
  await clickInside('UNDER', (k) => /Ore|Crystal/i.test(k), 'under_item');
  await clickInside('UNDER', (k) => /Harpy|Gorgon|Medusa|Goblin|Bat|Slime|Skeleton|Spider|Kobold/i.test(k), 'under_mon');
  await clickInside('UNDER', (k) => /^B\d+F|Grotto|Floor|Warrens|Catacomb|Cavern|Forest|Abyss|Heart/i.test(k), 'under_room');
  // the real mouse on a monster
  const mp = await pg.evaluate(() => { const el = App.renderer.domElement, W = el.clientWidth, H = el.clientHeight; for (let y = 60; y < H - 20; y += 9) for (let x = 20; x < W - 20; x += 9) { const o = App.inspectPick({ x: (x / W) * 2 - 1, y: -((y / H) * 2 - 1) }); if (o && o.live) return { x, y }; } });
  if (mp) { await shut(); await pg.mouse.click(mp.x, mp.y); await pg.waitForTimeout(800); await card('UNDER real mouse'); await L.shot(pg, 'insp_under_mouse.png'); }
  log('done');
};
