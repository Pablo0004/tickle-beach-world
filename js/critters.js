/* Pond life: ducks (the on-chain duck from the Duck Pond floor) paddle around and now and then
 * waddle onto the bank, and fish (the on-chain fish from the Waterfall floor, plus versions
 * recoloured with on-chain themes) swim below the surface and jump. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const ponds = new Map(); // poi index -> { poi, ducks, fish }
  const FISH_THEMES = [null, 2, 0, 8, 7, 3]; // on-chain look first, then Blue, Pink, Orange, Purple, Green
  let duckGeo = null, fishGeo = [], duckMesh = null, fishMeshes = [];
  const MAXD = 120, MAXF = 60; // per mesh
  const rnd = Math.random;

  function entryFor(md) {
    const geo = App.makeVoxMesh(md).geometry;
    const box = App.meshBox(md);
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - (box.min.y + box.max.y) / 2, md.origin[2] * S - (box.min.z + box.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
    return { geo, local, h: box.max.y - box.min.y };
  }
  App.loadCritters = async () => {
    const d = await App.job("fragment", { key: "duck", voxel: 6 });
    duckGeo = entryFor(d.mesh);
    const fs = await Promise.all(FISH_THEMES.map((th) => App.job("fragment", { key: "fish", voxel: 3, theme: th })));
    fishGeo = fs.map((r) => entryFor(r.mesh));
    duckMesh = new THREE.InstancedMesh(duckGeo.geo, App.voxMaterial, MAXD);
    duckMesh.frustumCulled = false; // three r128 culls instanced meshes by the base geometry only
    duckMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    duckMesh.count = 0;
    App.scene.add(duckMesh);
    fishMeshes = fishGeo.map((g) => { const m = new THREE.InstancedMesh(g.geo, App.voxMaterial, MAXF); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; App.scene.add(m); return m; });
  };

  const isWater = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) < App.SEA;
  function pointIn(poi, water, r0, r1) {
    for (let k = 0; k < 12; k++) {
      const a = rnd() * 6.28, d = r0 + rnd() * (r1 - r0);
      const W = poi.lake || poi.pool;
      const x = W.x + Math.cos(a) * d, z = W.z + Math.sin(a) * d;
      if (isWater(x, z) === water) return { x, z };
    }
    return null;
  }
  function makePond(poi) {
    const L = poi.lake || poi.pool, ducks = [], fish = [];
    // ducks live on the ponds; the small pools under waterfalls only have fish
    const nd = poi.lake ? 3 + Math.floor(App.hash2(poi.i, 1, 91) * 4) : 0, nf = poi.lake ? 5 + Math.floor(App.hash2(poi.i, 2, 91) * 6) : 2 + Math.floor(App.hash2(poi.i, 2, 91) * 3);
    for (let k = 0; k < nd; k++) {
      const p = pointIn(poi, true, 0, L.r * 0.7) || { x: L.x, z: L.z };
      ducks.push({ x: p.x, z: p.z, y: App.WATER_Y, h: rnd() * 6.28, t: null, mode: "swim", wait: rnd() * 3, wob: rnd() * 6 });
    }
    for (let k = 0; k < nf; k++) {
      const p = pointIn(poi, true, 0, L.r * 0.65) || { x: L.x, z: L.z };
      fish.push({ x: p.x, z: p.z, depth: 0.15 + rnd() * 0.25, h: rnd() * 6.28, t: null, sp: 0.5 + rnd() * 0.6, v: Math.floor(App.hash2(poi.i, k, 93) * FISH_THEMES.length), jump: 8 + rnd() * 30, jt: -1 });
    }
    return { poi, lake: L, ducks, fish };
  }

  // keep pond life only around the player
  App.updateCritterSet = () => {
    if (!duckMesh) return;
    const tx = App.cam.target.x, tz = App.cam.target.z;
    const near = App.poisNear(tx, tz, App.RANGE.scenery * 0.8, (p) => p.type === "pond" || !!p.pool);
    const keep = new Set(near.map((p) => p.i));
    for (const k of [...ponds.keys()]) if (!keep.has(k)) ponds.delete(k);
    for (const p of near) if (!ponds.has(p.i)) ponds.set(p.i, makePond(p));
  };

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  function turnTo(h, target, k) { let d = target - h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return h + d * Math.min(1, k); }

  // in the hand or flying from a throw: the hand moves it, it just flaps
  function heldPose(o, geoLocal, k, flat) {
    E.set(flat ? Math.PI / 2 : 0, o.flying ? performance.now() / 150 : -(o.h || 0), o.flying ? Math.sin(performance.now() / 90) * 0.5 : 0, "YXZ");
    Q.setFromEuler(E);
    M.compose(V.set(o.x, o.y, o.z), Q, SC.set(k, k, k)).multiply(geoLocal);
  }
  function stepDuck(dk, pond, dt, feeders) {
    const L = pond.lake;
    if (dk.held || dk.flying) { dk.kind = "duck"; return heldPose(dk, duckGeo.local, 1.3); }
    if (dk.wait > 0) { dk.wait -= dt; }
    else if (!dk.t) {
      const feeder = feeders.length && rnd() < 0.6 ? feeders[Math.floor(rnd() * feeders.length)] : null;
      if (feeder) { dk.t = { x: feeder.pos.x + (rnd() - 0.5) * 2, z: feeder.pos.z + (rnd() - 0.5) * 2 }; }
      else {
        const onLand = !isWater(dk.x, dk.z);
        const goLand = onLand ? rnd() < 0.3 : rnd() < 0.14;
        dk.t = goLand ? pointIn(pond.poi, false, L.r + 0.5, L.r + 4) : pointIn(pond.poi, true, 0, L.r * 0.8);
      }
      if (!dk.t) dk.wait = 1;
    } else {
      const dx = dk.t.x - dk.x, dz = dk.t.z - dk.z, dist = Math.hypot(dx, dz);
      const water = isWater(dk.x, dk.z);
      const sp = (water ? 0.75 : 0.45) * (App.isNight ? 0.4 : 1);
      if (dist < 0.25) { dk.t = null; dk.wait = 1 + rnd() * (water ? 4 : 6); }
      else {
        const step = Math.min(dist, sp * dt);
        dk.x += (dx / dist) * step; dk.z += (dz / dist) * step;
        dk.h = turnTo(dk.h, Math.atan2(dz, dx), dt * 4);
      }
    }
    const water = isWater(dk.x, dk.z);
    const ty = water ? App.WATER_Y - 0.08 : App.columnHeight(Math.floor(dk.x), Math.floor(dk.z));
    dk.y += (ty - dk.y) * Math.min(1, dt * 6);
    dk.wob += dt * (water ? 2 : 9);
    const moving = !!dk.t && dk.wait <= 0;
    E.set(water ? Math.sin(dk.wob) * 0.05 : moving ? Math.sin(dk.wob) * 0.18 : 0, -dk.h, 0, "YXZ");
    Q.setFromEuler(E);
    const k = 1.3;
    M.compose(V.set(dk.x, dk.y + (water ? Math.sin(dk.wob * 0.7) * 0.03 : 0) + duckGeo.h * k * 0.5 - (water ? 0.12 : 0), dk.z), Q, SC.set(k, k, k)).multiply(duckGeo.local);
  }
  function stepFish(f, pond, dt, fishers) {
    const L = pond.lake;
    if (f.held || f.flying) { f.kind = "fish"; return heldPose(f, fishGeo[f.v].local, 2.4, true); }
    // thrown onto dry land: it flops its way back to the pond
    if (!isWater(f.x, f.z)) {
      const dx = L.x - f.x, dz = L.z - f.z, d = Math.hypot(dx, dz) || 1;
      f.x += (dx / d) * dt * 1.6; f.z += (dz / d) * dt * 1.6; f.h = Math.atan2(dz, dx);
      f.y = App.columnHeight(Math.floor(f.x), Math.floor(f.z)) + 0.15 + Math.abs(Math.sin(performance.now() / 110 + f.v)) * 0.4;
      E.set(0, -f.h, Math.sin(performance.now() / 60) * 0.6, "YZX"); Q.setFromEuler(E);
      M.compose(V.set(f.x, f.y, f.z), Q, SC.set(2.4, 2.4, 2.4)).multiply(fishGeo[f.v].local);
      f.jt = -1; f.t = null;
      return;
    }
    if (f.jt >= 0) { // mid-jump
      f.jt += dt;
      const T = 0.9, u = f.jt / T;
      f.x += Math.cos(f.h) * dt * 1.4; f.z += Math.sin(f.h) * dt * 1.4;
      f.y = App.WATER_Y - f.depth + Math.sin(Math.min(1, u) * Math.PI) * (0.9 + f.depth);
      f.pitch = (0.5 - u) * 1.8;
      if (u >= 1) { f.jt = -1; f.jump = 10 + rnd() * 35; f.pitch = 0; }
    } else {
      f.tt = (f.tt || 0) + dt;
      if (!f.t || f.tt > 12 || Math.hypot(f.t.x - f.x, f.t.z - f.z) < 0.8) {
        f.tt = 0; f.t = null;
        const near = fishers.length && rnd() < 0.35 ? fishers[Math.floor(rnd() * fishers.length)] : null;
        if (near) { const a = Math.atan2(L.z - near.pos.z, L.x - near.pos.x); const c = { x: near.pos.x + Math.cos(a) * 2.2, z: near.pos.z + Math.sin(a) * 2.2 }; if (isWater(c.x, c.z)) f.t = c; }
        for (let k = 0; k < 6 && !f.t; k++) { const c = pointIn(pond.poi, true, 0, L.r * 0.75); if (c && Math.hypot(c.x - f.x, c.z - f.z) > 2) f.t = c; }
        if (!f.t) f.t = { x: L.x, z: L.z };
      }
      // steer: limited turning speed, and slow down while the target is off to the side or behind,
      // so a fish turns gently instead of orbiting its target
      const dx = f.t.x - f.x, dz = f.t.z - f.z, dist = Math.hypot(dx, dz) || 1;
      let diff = Math.atan2(dz, dx) - f.h;
      while (diff > Math.PI) diff -= 6.283; while (diff < -Math.PI) diff += 6.283;
      const maxTurn = 1.5 * dt;
      f.h += Math.max(-maxTurn, Math.min(maxTurn, diff));
      const align = Math.max(0.15, Math.cos(diff));
      const step = Math.min(dist, f.sp * align * dt);
      const nx = f.x + Math.cos(f.h) * step, nz = f.z + Math.sin(f.h) * step;
      if (isWater(nx, nz)) { f.x = nx; f.z = nz; } else { f.t = null; f.h += Math.PI * 0.5 * Math.sign(diff || 1) * dt; }
      f.y = App.WATER_Y - f.depth + Math.sin(performance.now() / 700 + f.v) * 0.04;
      f.pitch = 0;
      f.jump -= dt;
      if (f.jump <= 0 && !App.isNight) {
        if (isWater(f.x + Math.cos(f.h) * 1.4, f.z + Math.sin(f.h) * 1.4)) f.jt = 0; else f.jump = 2;
      }
    }
    // the on-chain fish lies on its side: stand it up, then point it where it swims
    E.set(Math.PI / 2, -f.h, f.pitch || 0, "YZX");
    Q.setFromEuler(E);
    const k = 2.4;
    M.compose(V.set(f.x, f.y, f.z), Q, SC.set(k, k, k)).multiply(fishGeo[f.v].local);
  }

  App.stepCritters = (dtReal) => {
    if (!duckMesh) return;
    // pond life is ambient: it never runs faster than 1.5x, and moves in short substeps
    const dtAll = Math.min(0.1, dtReal) * Math.min(1.5, Math.max(0, st.speed));
    const sub = Math.max(1, Math.ceil(dtAll / 0.034)), dt = dtAll / sub;
    let nd = 0;
    const nf = fishMeshes.map(() => 0);
    const tx = App.cam.target.x, tz = App.cam.target.z;
    for (const pond of ponds.values()) {
      const L = pond.lake;
      const close = st.tickles.filter((t) => Math.hypot(t.pos.x - L.x, t.pos.z - L.z) < L.r + 8 && t.action && t.action.phase === "doing" && t.action.act);
      const feeders = close.filter((t) => t.action.act.id === "s_duck");
      const fishers = close.filter((t) => /fish/i.test(t.action.act.name || "") || t.job === "fisher");
      const vis = Math.hypot(L.x - tx, L.z - tz) < App.RANGE.scenery * 0.8;
      for (const dk of pond.ducks) {
        for (let k = 0; k < sub; k++) stepDuck(dk, pond, dt, feeders);
        if (vis && nd < MAXD) duckMesh.setMatrixAt(nd++, M);
      }
      for (const f of pond.fish) {
        for (let k = 0; k < sub; k++) stepFish(f, pond, dt, fishers);
        if (vis && nf[f.v] < MAXF) fishMeshes[f.v].setMatrixAt(nf[f.v]++, M);
      }
    }
    duckMesh.count = nd;
    duckMesh.instanceMatrix.needsUpdate = true;
    fishMeshes.forEach((m, i) => { m.count = nf[i]; m.instanceMatrix.needsUpdate = true; });
  };
  // for the hand: the ducks and fish of the ponds near a point
  App.pondCrittersNear = (x, z, R) => {
    const out = [];
    for (const p of ponds.values()) {
      for (const d of p.ducks) if (Math.abs(d.x - x) + Math.abs(d.z - z) < R) { d.kind = "duck"; out.push(d); }
      for (const f of p.fish) if (Math.abs(f.x - x) + Math.abs(f.z - z) < R) { f.kind = "fish"; out.push(f); }
    }
    return out;
  };
  App._ponds = ponds; // debug handle
  App.critterSnapshot = () => { const out = { ducksOnLand: 0, ducks: 0, jumping: 0 }; for (const p of ponds.values()) { for (const d of p.ducks) { out.ducks++; if (!isWater(d.x, d.z)) out.ducksOnLand++; } for (const f of p.fish) if (f.jt >= 0) out.jumping++; } return out; };
  App.critterCount = () => { let d = 0, f = 0; for (const p of ponds.values()) { d += p.ducks.length; f += p.fish.length; } return { ponds: ponds.size, ducks: d, fish: f }; };
})();
