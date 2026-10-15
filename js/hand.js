/* The hand: the same left button that drags the map picks things up. Press on a Tickle, an animal,
 * a placed object or a loose piece of scenery (trees, palms, umbrellas, logs, rocks...) and drag:
 * it lifts and follows the cursor. Let go to set it down, or let go while moving to throw it.
 * Buildings, fences, piers and waterfalls stay put. Playing as a holder, only your own Tickles.
 * Other modules offer more things through App.handThings (mounts, the guild's horses and griffin, sea beasts,
 * boats): each is { kind: "thing", obj, x, y, z, r } where obj has x, y, z and set(), and may have grab(),
 * release(hard), land(hard) and a sound for when it is thrown. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const V = new THREE.Vector3();
  const FIXED = new Set(["pier", "waterfall", "duck", "fence_0", "arena_0", "dungeon_0", "altar_0", "ruins_0", "scaffold_0", "dock_0", "mine_0", "maker_0", "arena_1", "arena_2", "dungeon_1", "dungeon_2", "dungeon_3", "mine_1", "mine_2", "mine_3", "etherfield_0"]);
  let pending = null, held = null;
  const flights = [];

  function canvasXY(e) { const r = App.renderer.domElement.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  // everything that can be picked up, with where to grab it
  function candidates() {
    const out = [], tx = App.cam.target.x, tz = App.cam.target.z;
    for (const t of st.tickles) if (t.group.visible) out.push({ kind: "tickle", obj: t, x: t.pos.x, y: t.pos.y + 1.3, z: t.pos.z, r: 30 });
    for (const an of App.animalsNear ? App.animalsNear(tx, tz, 95) : []) out.push({ kind: "animal", obj: an, x: an.x, y: an.y + 0.6, z: an.z, r: an.kind === "chicken" ? 18 : 24 });
    for (const b of App.creatureBodiesNear ? App.creatureBodiesNear(tx, tz, 95) : []) if (!b.battle && !b.busy) out.push({ kind: "animal", obj: b, x: b.x, y: b.y + 0.6, z: b.z, r: 22 });
    for (const m of App.monstersNear ? App.monstersNear(tx, tz, 95) : []) if (!m.foe) out.push({ kind: "animal", obj: m, x: m.x, y: m.y + 0.8, z: m.z, r: 26 });
    // the lake's animals and the ponds' ducks and fish
    for (const o of App.lakeAnimalsNear ? App.lakeAnimalsNear(tx, tz, 95) : []) out.push({ kind: "animal", obj: o, x: o.x, y: (o.y || App.WATER_Y) + 0.5, z: o.z, r: o.k === "frog" || o.k === "koi" ? 20 : 26 });
    for (const o of App.pondCrittersNear ? App.pondCrittersNear(tx, tz, 95) : []) out.push({ kind: "animal", obj: o, x: o.x, y: (o.y || App.WATER_Y) + 0.4, z: o.z, r: 20 });
    for (const p of st.props) if (p.group.visible) out.push({ kind: "prop", obj: p, x: p.x, y: p.group.position.y + Math.min(2, p.height / 2), z: p.z, r: 30 });
    for (const s of App.sceneryVisible) {
      if (s.fixed || s.ruined || FIXED.has(s.type) || !App.kitOn(App.kindOf(s.type)) || App.isBroken(s)) continue;
      const tall = s.building ? 2.2 : s.tree ? 2.4 : 0.8;
      out.push({ kind: "scenery", obj: s, x: s.x, y: (s.y || App.genHeight(s.x, s.z)) + tall, z: s.z, r: s.building ? 46 : s.tree ? 34 : 24 });
    }
    for (const d of App.dragonObjects ? App.dragonObjects.values() : []) if (!d.dead) out.push({ kind: "dragon", obj: d, x: d.x, y: d.y + 3, z: d.z, r: 70 });
    for (const fn of App.handThings || []) for (const o of fn(tx, tz) || []) out.push(o);
    return out;
  }
  // called on press: remember what is under the cursor, lift it only once the pointer moves
  App.handPress = (e) => {
    if (App.inside) return false; // no hand inside buildings
    if (App.inside) return false; // no hand inside buildings
    pending = null;
    const tool = App.ui && App.ui.tool;
    if (tool && tool !== "select" && tool !== "order") return false;
    const c = canvasXY(e);
    let best = null, bd = 1e9;
    App.applyCamera();
    for (const k of candidates()) {
      const p = App.project(V.set(k.x, k.y, k.z));
      if (p.behind) continue;
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      // Tickles first, then animals, then objects, then scenery
      const bias = { tickle: 0, dragon: 2, thing: 3, animal: 4, prop: 8, scenery: 12 }[k.kind];
      if (d < k.r && d + bias < bd) { bd = d + bias; best = k; }
    }
    if (!best) return false;
    if (best.kind === "tickle" && st.wallet && !App.isMine(best.obj.id)) { App.toast("Only its owner can pick up " + best.obj.name + "."); return false; }
    pending = best;
    return true;
  };
  App.handGrab = () => {
    if (!pending) return false;
    held = Object.assign({}, pending, { trail: [], ox: pending.obj.x != null ? pending.obj.x : pending.obj.pos.x, oz: pending.obj.z != null ? pending.obj.z : pending.obj.pos.z });
    pending = null;
    const o = held.obj;
    if (held.kind === "tickle") {
      App.endAction(o); o.action = { kind: "held", started: st.T }; o.detour = null;
      App.say(o, ["Whoa!", "Put me down!", "Wheee!", "Hey, I can fly!"][Math.floor(Math.random() * 4)], 3);
    } else if (held.kind === "animal") o.held = true;
    else if (held.kind === "thing") { if (o.grab) o.grab(); }
    else if (held.kind === "dragon") { o.held = true; App.say && st.tickles.slice(0, 3).forEach((t) => Math.hypot(t.pos.x - o.x, t.pos.z - o.z) < 30 && App.say(t, "The dragon is flying away?!", 2)); }
    return true;
  };
  // the point on the ground under the cursor
  function groundAt(ndc) {
    const r = App.rayFrom(ndc), hit = App.pickVoxel(r);
    if (hit) return { x: hit.point.x, z: hit.point.z };
    const w = App.pickWater(r);
    return w ? { x: w.x, z: w.z } : null;
  }
  function posOf(h) { const o = h.obj; return h.kind === "tickle" ? o.pos : h.kind === "prop" ? { x: o.x, y: o.group.position.y, z: o.z } : o; } // (a thing keeps its own x, y, z)
  function setPos(h, x, y, z) {
    const o = h.obj;
    if (h.kind === "tickle") { o.pos.set(x, y, z); o.group.position.copy(o.pos); }
    else if (h.kind === "animal") { o.x = x; o.y = y; o.z = z; o.t = null; o.wp = null; }
    else if (h.kind === "dragon") { o.x = x; o.y = y; o.z = z; o.group.position.set(x, y, z); }
    else if (h.kind === "prop") { o.x = x; o.z = z; o.group.position.set(x, y, z); }
    else if (h.kind === "thing") { o.x = x; o.y = y; o.z = z; o.set(x, y, z); }
    else { App.moveScenery(o, x, z, y); }
  }
  App.handMove = (ndc) => {
    if (!held) return;
    const g = groundAt(ndc);
    if (!g) return;
    const gy = App.surfaceAt(g.x, g.z).y;
    held.goal = { x: g.x, y: gy + (held.kind === "scenery" ? 1.2 : held.kind === "dragon" ? 6 : held.kind === "thing" ? held.obj.lift || 2.6 : 2.6), z: g.z };
    held.trail.push({ x: g.x, z: g.z, t: performance.now() });
    while (held.trail.length > 12) held.trail.shift();
  };
  App.handRelease = () => {
    pending = null;
    if (!held) return false;
    const h = held;
    held = null;
    // speed of the last tenth of a second decides between setting down and throwing
    const now = performance.now(), tr = h.trail.filter((p) => now - p.t < 120);
    let vx = 0, vz = 0;
    if (tr.length >= 2) { const a = tr[0], b = tr[tr.length - 1], dt = Math.max(0.016, (b.t - a.t) / 1000); vx = (b.x - a.x) / dt; vz = (b.z - a.z) / dt; }
    const sp = Math.hypot(vx, vz), cap = 38;
    if (sp > cap) { vx *= cap / sp; vz *= cap / sp; }
    const p = posOf(h);
    const f = { h, x: p.x, y: p.y != null ? p.y : App.surfaceAt(p.x, p.z).y + 2.6, z: p.z, vx: sp > 7 ? vx : 0, vz: sp > 7 ? vz : 0, vy: sp > 7 ? 5 + Math.min(sp, cap) * 0.3 : 0, spin: 0 };
    if (h.kind === "tickle") {
      h.obj.action = { kind: "flying", started: st.T };
      // thrown: a proper scream
      if (sp > 7) { App.say(h.obj, ["Aaaaaah!", "Wheeeee!", "Noooooo!", "Yaaaaay!"][Math.floor(Math.random() * 4)], 3); App.sfx.scream(h.obj.id, sp); }
    }
    // thrown: every animal, creature and monster makes its own noise (creatures by species)
    if (h.kind === "animal") { h.obj.flying = true; if (sp > 7) App.sfx.animal(h.obj.data ? h.obj.data.sp : h.obj.kind); }
    if (h.kind === "dragon") { h.obj.held = false; h.obj.handFlying = true; if (sp > 7) App.sfx.animal("dragon"); }
    if (h.kind === "thing") { if (h.obj.release) h.obj.release(sp > 7); if (sp > 7 && h.obj.sound) App.sfx.animal(h.obj.sound); }
    flights.push(f);
    return true;
  };
  App.handBusy = () => !!held || flights.length > 0;
  App.handHolding = () => !!held;

  // follow the cursor while held; fall and land when let go
  App.stepHand = (dtReal) => {
    const dt = Math.min(0.05, dtReal);
    if (held && held.goal) {
      const p = posOf(held), k = Math.min(1, dt * 14);
      const y0 = p.y != null ? p.y : held.goal.y;
      setPos(held, p.x + (held.goal.x - p.x) * k, y0 + (held.goal.y - y0) * k, p.z + (held.goal.z - p.z) * k);
      if (held.kind === "tickle") { const o = held.obj; o.pivot.rotation.z = Math.sin(performance.now() / 160) * 0.35; o.pivot.rotation.x = 0; o.pivot.position.y = 0; }
      if (held.kind === "scenery") App.updateScenery(true);
    }
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.vy -= 24 * dt;
      f.x += f.vx * dt; f.z += f.vz * dt; f.y += f.vy * dt;
      const OB = App.OCEAN || App.WORLD;
      f.x = Math.max(OB.minX, Math.min(OB.maxX, f.x)); f.z = Math.max(OB.minZ, Math.min(OB.maxZ, f.z));
      f.spin += dt * Math.hypot(f.vx, f.vz) * 0.4;
      const ground = App.surfaceAt(f.x, f.z).y;
      if (f.y <= ground) { f.y = ground; land(f); flights.splice(i, 1); continue; }
      setPos(f.h, f.x, f.y, f.z);
      if (f.h.kind === "tickle") f.h.obj.pivot.rotation.x = -f.spin;
      if (f.h.kind === "scenery") App.updateScenery(true);
    }
  };
  function land(f) {
    const h = f.h, o = h.obj;
    setPos(h, f.x, f.y, f.z);
    // anything dropped on a dragon's peak wakes it
    if (h.kind !== "dragon" && App.disturbAt) App.disturbAt(f.x, f.z, Math.abs(f.vx) + Math.abs(f.vz) > 7);
    if (h.kind === "tickle") {
      o.pivot.rotation.set(0, 0, 0);
      const hard = Math.abs(f.vx) + Math.abs(f.vz) > 7;
      // dropped into an arena: the ring becomes a boxing ring
      const ring = App.ringAt(f.x, f.z);
      if (ring && !App.isKO(o.id)) { o.action = null; App.enterRing(o, ring); return; }
      o.action = hard ? { kind: "dizzy", until: st.T + 3, started: st.T } : null;
      if (hard) App.say(o, ["Whoa\u2026 dizzy!", "Again! Again!", "That was fun!", "Ouch, my head."][Math.floor(Math.random() * 4)], 4);
    } else if (h.kind === "animal") {
      o.held = false; o.flying = false; o.wait = 1; o.t = null;
      const ring = App.ringAt(f.x, f.z);
      if (ring && App.enterRingBeast) App.enterRingBeast(o, ring);
    }
    else if (h.kind === "dragon") { o.y = f.y; App.dragonDropped(o, Math.abs(f.vx) + Math.abs(f.vz) > 7); return; }
    else if (h.kind === "prop") { o.rot = o.group.rotation.y; App.save(); }
    else if (h.kind === "thing") { if (o.land) o.land(Math.abs(f.vx) + Math.abs(f.vz) > 7); }
    else {
      // a building takes its residents' door with it; anything thrown hard breaks where it lands
      App.moveScenery(o, f.x, f.z);
      if (o.building) App.syncBuilding(o);
      if (Math.abs(f.vx) + Math.abs(f.vz) > 7) App.breakScenery(o);
      App.updateScenery(true); App.save();
    }
  }
})();
