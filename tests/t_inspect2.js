const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.addStyleTag({ content: '#toasts{display:none!important}' });
  await pg.waitForFunction(() => App.st.tickles.filter(t => t.group && t.group.visible).length >= 6, null, { timeout: 120000 });
  const card = (tag) => pg.evaluate(() => { const el = document.getElementById('placeCard'); return { hidden: el.hidden, insp: !!el.dataset.insp, text: el.innerText.replace(/\s+/g, ' ').slice(0, 260) }; }).then(r => (log(tag, JSON.stringify(r)), r));
  // 1. a building: its own card
  const v = await pg.evaluate(() => { const v = App.villages.find(v => v.granary); return { x: v.granary.x, z: v.granary.z }; });
  await L.look(pg, v.x, v.z, 30, null, 0.9, 8000);
  const p = await pg.evaluate((v) => { App.applyCamera(); const q = App.project(new THREE.Vector3(v.x, App.genHeight(v.x, v.z) + 2, v.z)); return q; }, v);
  log('dbg', JSON.stringify(await pg.evaluate((p) => { const el = App.renderer.domElement, n = { x: (p.x / el.clientWidth) * 2 - 1, y: -((p.y / el.clientHeight) * 2 - 1) }; const o = App.inspectPick(n); const r = App.rayFrom(n); const P = App.pickPlace(r); const near = App.st.tickles.filter(t => t.group.visible).map(t => { const q = App.project(new THREE.Vector3(t.pos.x, t.pos.y + 1.3, t.pos.z)); return [t.name, Math.round(Math.hypot(q.x - p.x, q.y - p.y))]; }).sort((a, b) => a[1] - b[1]).slice(0, 3); return { seen: o && { d: o.d, live: o.live, title: o.fn().title }, place: P && { name: P.name, dist: P.dist }, near }; }, p)));
  log('dbg2', JSON.stringify(await pg.evaluate((p) => { const el = App.renderer.domElement, n = { x: (p.x / el.clientWidth) * 2 - 1, y: -((p.y / el.clientHeight) * 2 - 1) }; const r = App.rayFrom(n), V = new THREE.Vector3(), out = []; for (const t of App.st.tickles) { const box = new THREE.Box3(new THREE.Vector3(t.pos.x - 0.65, t.pos.y, t.pos.z - 0.65), new THREE.Vector3(t.pos.x + 0.65, t.pos.y + t.height, t.pos.z + 0.65)); if (r.intersectBox(box, V)) out.push([t.name, t.group.visible, Math.round(V.distanceTo(r.origin)), t.action && t.action.kind]); } return out; }, p)));
  await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(800);
  await card('BUILDING');
  // and a spot on the building away from anyone
  const p2 = await pg.evaluate((v) => { App.applyCamera(); for (const dy of [3, 4, 5, 2.5, 6]) { const q = App.project(new THREE.Vector3(v.x, App.genHeight(v.x, v.z) + dy, v.z)); const near = App.st.tickles.some(t => { const r = App.project(new THREE.Vector3(t.pos.x, t.pos.y + 1.3, t.pos.z)); return Math.hypot(r.x - q.x, r.y - q.y) < 30; }); if (!near) return q; } }, v);
  if (p2) { await pg.evaluate(() => { App.closeInspect(); document.getElementById('placeCard').hidden = true; }); await pg.mouse.click(p2.x, p2.y); await pg.waitForTimeout(800); await card('BUILDING clear spot'); await L.shot(pg, 'insp_building.png'); }
  // 2. a Tickle, then its Full card button
  const t = await pg.evaluate(() => { const t = App.st.tickles.find(t => t.group.visible); return { id: t.id }; });
  await pg.evaluate((id) => App.inspectTickle(id), t.id); await pg.waitForTimeout(600);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('#placeCard [data-ib]')].find(b => b.textContent === 'Full card'); b && b.click(); });
  await pg.waitForTimeout(800);
  log('after Full card', JSON.stringify(await pg.evaluate(() => ({ sel: App.ui && App.ui.sel, tab: App.ui && App.ui.tab, tabActive: (document.querySelector('[aria-selected="true"]') || {}).id }))));
  // 3. a creature battle followed in the window
  const pet = await pg.evaluate(() => { const tm = App.st.tickles.find(t => App.leadCreature(t.id) && t.group.visible); return tm && { x: tm.pos.x, z: tm.pos.z }; });
  if (pet) {
    await L.look(pg, pet.x, pet.z, 16, null, 1.0, 5000);
    const ok = await pg.evaluate(() => {
      const bs = App.creatureBodiesNear(App.cam.target.x, App.cam.target.z, 60).filter(b => !b.battle);
      if (!bs.length) return 'no bodies';
      const a = bs[0], c2 = { sp: 'cinderling', lvl: 3, xp: 0, wild: true };
      const b2 = Object.assign({}, a, { data: c2, sp: 'cinderling', x: a.x + 3, battle: null, owner: null });
      window._fake = b2;
      App.startBattle({ c: a.data, b: a, owner: null }, { c: c2, b: b2, owner: null }, 'wild', () => {});
      return a.sp;
    });
    log('battle', ok);
    // open the window on the first body by clicking where it is
    const q = await pg.evaluate(() => { const b = App.creatureBodiesNear(App.cam.target.x, App.cam.target.z, 60).find(b => b.battle); App.applyCamera(); return b && App.project(new THREE.Vector3(b.x, (b.y || 0) + 0.6, b.z)); });
    if (q) { await pg.mouse.click(q.x, q.y); }
    for (let i = 0; i < 2; i++) { await pg.waitForTimeout(2500); await card('BATTLE t+' + (i * 2.5)); }
    await L.shot(pg, 'insp_battle.png');
  }
  // 4. inside, with the side panel showing, at this width
  const home = await pg.evaluate((id) => { const v = App.villageOfToken(id); const H = (v.houses || [])[0] || v; return { x: H.x, z: H.z }; }, t.id);
  await pg.evaluate((h) => { const T = App.enterableAt(h.x, h.z); if (T) App.enter(T, { floor: 0 }); }, home);
  await pg.waitForTimeout(9000);
  await pg.evaluate(() => { const el = App.renderer.domElement, W = el.clientWidth, H = el.clientHeight; for (let y = 60; y < H - 20; y += 9) for (let x = 20; x < W - 20; x += 9) { const n = { x: (x / W) * 2 - 1, y: -((y / H) * 2 - 1) }, o = App.inspectPick(n); if (o && o.live) { App.onWorldClick(n); return; } } });
  await pg.waitForTimeout(800);
  await card('INSIDE');
  await L.shot(pg, 'insp_inside_panel.png');
};
