/* Surfing. A surfer paddles out lying on its board, waits for a swell, then stands up and rides the wave in
 * towards the beach, drifting along it; at the shore the wave breaks into foam and the surfer paddles out
 * again. Only the open sea round the land has waves (the great lake, the channels and the ponds are calm):
 * surfers go there, and breakers roll in on the beaches of the open sea near the view. */
(function () {
  "use strict";
  const App = window.App;
  const rnd = Math.random;
  const waves = new Map(); // Tickle id -> { grp, extra, spotKey }
  // the profile of a wave, seen from the side (toward the shore is +u): a long back slope, the crest, the lip
  // curling over and a steep face. It is built of small cubes (a fifth of a block), like everything else: deep blue
  // low down, paler towards the crest, the lip white with foam; the crest rises and falls a little along the
  // beach, and the ends taper off into the sea. The cubes keep their size as the wave grows: a wave is drawn from
  // one of several ready-made heights.
  const BODY = [[-3.4, 0], [-2.2, 0.18], [-1.2, 0.5], [-0.4, 0.88], [0.25, 1.02], [0.7, 0.86], [0.62, 0.6], [0.5, 0.3], [0.62, 0], [-3.4, 0]];
  const LIP = [[-0.3, 0.86], [0.25, 1.08], [0.78, 0.92], [0.84, 0.66], [0.62, 0.52], [0.56, 0.76], [0.3, 0.86], [-0.3, 0.86]];
  function inPoly(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
  // TALL: the waves stand half again as high as their old smooth shape, so they rise clearly out of the sea
  const CUBE = 0.2, TALL = 1.5, LEVELS = [0.15, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5];
  const C_DEEP = new THREE.Color("#0d5f86"), C_MID = new THREE.Color("#1d97c0"), C_HI = new THREE.Color("#a6ecf6"), C_FOAM = new THREE.Color("#f4fbff"), C_FACE = new THREE.Color("#0f6a78");
  const geos = {};
  // the cubes of a wave of length len (along the beach) and height H, as one mesh: only the faces that show
  function waveGeo(len, H) {
    const k = len + ":" + H;
    if (geos[k]) return geos[k];
    const nu = Math.ceil(4.4 / CUBE), nv = Math.ceil(1.2 * TALL / CUBE) + 1, nz = Math.ceil(len / CUBE);
    const cell = new Uint8Array(nu * nv * nz); // 0 empty, 1 water, 2 foam
    const at = (i, j, l) => (i < 0 || j < 0 || l < 0 || i >= nu || j >= nv || l >= nz ? 0 : cell[(l * nv + j) * nu + i]);
    for (let l = 0; l < nz; l++) {
      const z = (l + 0.5) / nz, end = Math.min(1, Math.min(z, 1 - z) * 5), wob = 0.9 + 0.1 * Math.sin(l * 0.7 + len) + 0.06 * Math.sin(l * 2.3);
      const h = H * end * wob;
      if (h < 0.05) continue;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const x = -3.4 + (i + 0.5) * CUBE, y = ((j + 0.5) * CUBE) / h;
        if (y > 1.1) continue;
        const v = inPoly(LIP, x, y) && h > 0.2 ? 2 : inPoly(BODY, x, y) ? 1 : 0;
        if (v) cell[(l * nv + j) * nu + i] = v;
      }
    }
    const pos = [], nor = [], col = [], idx = [];
    const F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], c = new THREE.Color();
    for (let l = 0; l < nz; l++) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const v = at(i, j, l);
      if (!v) continue;
      // the colour: foam on the lip; the water paler the higher it is, with a speckle so it is not one flat blue
      const up = (j * CUBE) / Math.max(0.2, H), sp = ((i * 7 + j * 13 + l * 29) % 11) / 11;
      if (v === 2) c.copy(C_FOAM).multiplyScalar(0.94 + sp * 0.06);
      else {
        c.copy(C_DEEP).lerp(C_MID, Math.min(1, up * 1.4)).lerp(C_HI, Math.max(0, up - 0.65) * 2); c.multiplyScalar(0.92 + sp * 0.1);
        // the steep face toward the beach is in its own shadow: darker and greener
        if (-3.4 + i * CUBE > 0.2) c.lerp(C_FACE, 0.45);
      }
      for (const n of F) {
        if (at(i + n[0], j + n[1], l + n[2])) continue;
        // the four corners of the face (u, y, z in the wave's own frame; the wave runs along x once turned)
        const base = [i, j, l];
        const off = [n[0] > 0 ? 1 : 0, n[1] > 0 ? 1 : 0, n[2] > 0 ? 1 : 0];
        const A = [0, 0, 0], B = [0, 0, 0];
        if (n[0]) { A[1] = 1; B[2] = 1; } else if (n[1]) { A[2] = 1; B[0] = 1; } else { A[0] = 1; B[1] = 1; }
        // (the turn into the wave's frame swaps two axes, which mirrors the faces: wind them the other way round)
        if (n[0] > 0 || n[1] > 0 || n[2] > 0) { const t = A.slice(); A[0] = B[0]; A[1] = B[1]; A[2] = B[2]; B[0] = t[0]; B[1] = t[1]; B[2] = t[2]; }
        const sh = n[1] > 0 ? 1 : n[1] < 0 ? 0.6 : n[0] ? 0.86 : 0.92;
        for (let q = 0; q < 4; q++) {
          const a = q === 1 || q === 2 ? 1 : 0, b = q >= 2 ? 1 : 0;
          const p0 = base[0] + off[0] + A[0] * a + B[0] * b, p1 = base[1] + off[1] + A[1] * a + B[1] * b, p2 = base[2] + off[2] + A[2] * a + B[2] * b;
          // into the wave's frame: u (toward the shore) is +z after the turn, the length runs along x
          pos.push(p2 * CUBE - len / 2, p1 * CUBE, -3.4 + p0 * CUBE);
          nor.push(n[2], n[1], n[0]);
          col.push(c.r * sh, c.g * sh, c.b * sh);
        }
        const vc = pos.length / 3 - 4;
        idx.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return (geos[k] = g);
  }
  const waterMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.92 });
  const foamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
  const FOAM_N = 140, foamBit = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const M4 = new THREE.Matrix4();
  function makeWave(len) {
    const grp = new THREE.Group(), shape = new THREE.Mesh(waveGeo(len, LEVELS[3]), waterMat);
    grp.add(shape);
    // the white water spilling in front of it once it breaks: loose cubes of foam
    const foam = new THREE.InstancedMesh(foamBit, foamMat, FOAM_N);
    const bits = [];
    for (let k = 0; k < FOAM_N; k++) bits.push([(rnd() - 0.5) * len * 0.92, rnd(), rnd(), rnd()]);
    foam.count = 0; grp.add(foam);
    grp.userData = { shape, foam, len, bits };
    App.scene.add(grp);
    return grp;
  }
  // a wave at distance d from the shore line (toward the open water), with height h and how broken it is
  function placeWave(grp, S, d, side, h, broken) {
    const x = S.sx - S.dx * d + S.tx * side, z = S.sz - S.dz * d + S.tz * side;
    grp.position.set(x, App.WATER_Y - 0.28, z);
    grp.rotation.y = Math.atan2(S.dx, S.dz);
    const U = grp.userData, H = Math.max(0.05, h * TALL * (1 - broken * 0.6));
    let best = LEVELS[0];
    for (const L of LEVELS) if (Math.abs(L - H) < Math.abs(best - H)) best = L;
    const g = waveGeo(U.len, best);
    if (U.shape.geometry !== g) U.shape.geometry = g;
    // the foam: more of it, spread further toward the beach, the more the wave has broken; it jiggles as it rolls
    const n = broken > 0.02 ? Math.round(FOAM_N * Math.min(1, broken * 1.4)) : 0, t = performance.now() / 1000;
    for (let k = 0; k < n; k++) {
      const B = U.bits[k], s = 0.6 + B[3] * 0.8;
      M4.makeScale(s, s, s).setPosition(B[0], 0.3 + B[2] * (0.25 + broken * 0.4) + Math.sin(t * 6 + k) * 0.04, 0.6 + B[1] * (0.3 + broken * 2.6));
      U.foam.setMatrixAt(k, M4);
    }
    U.foam.count = n;
    U.foam.instanceMatrix.needsUpdate = true;
    grp.visible = h > 0.06;
  }
  App._wave = { makeWave, placeWave }; // (tests/t_waves.js)
  // the surf break in front of a surfer: the line of the shore and how far out the water goes
  function setup(t, a) {
    const sp = a.spot, sh = a.shore;
    let dx = sh ? sh.x - sp.x : 0, dz = sh ? sh.z - sp.z : 1, d = Math.hypot(dx, dz);
    if (d < 0.01) { dx = 0; dz = 1; d = 1; }
    dx /= d; dz /= d;
    // out from the beach along the water, up to 14 steps
    let out = 3;
    for (let k = 3; k <= 14; k++) { const x = sp.x - dx * k, z = sp.z - dz * k, s = App.surfaceAt(x, z); if (!s.water || App.isLand(x, z)) break; out = k; }
    // one ride takes about ten game minutes: paddle out, wait for the set, ride it in
    return { sx: sp.x, sz: sp.z, dx, dz, tx: -dz, tz: dx, out: Math.max(3, out - 1), t0: App.st.T - rnd() * 3, period: 9 + rnd() * 3, side: (rnd() < 0.5 ? -1 : 1) };
  }
  // the surfer's body and the board for this moment of the ride; returns true (the pose is set)
  App.surfPose = (t, dtReal) => {
    const a = t.action;
    if (!a) return false;
    if (!a.surf) a.surf = setup(t, a);
    const S = a.surf, now = performance.now() / 1000, u = (((App.st.T - S.t0) / S.period) % 1 + 1) % 1, inner = 1.2;
    let d, side = 0, mode, waveD, waveH, broken = 0;
    if (u < 0.38) { mode = "paddle"; d = inner + (S.out - inner) * (u / 0.38); waveD = S.out + 6; waveH = 0; }
    else if (u < 0.5) { mode = "wait"; d = S.out; const k = (u - 0.38) / 0.12; waveD = S.out + 6 - 6 * k; waveH = 0.3 + 0.5 * k; }
    else {
      // the ride: in with the wave, drifting along the beach and carving a little
      mode = "ride"; const k = (u - 0.5) / 0.5;
      d = S.out - (S.out - inner) * k; side = S.side * Math.sin(k * Math.PI) * 3.2;
      waveD = d + 0.6; waveH = k < 0.75 ? 0.85 : 0.85 * (1 - (k - 0.75) / 0.25) + 0.1; broken = k < 0.6 ? 0 : (k - 0.6) / 0.4;
    }
    a.surfMode = mode;
    // the wave this surfer rides, and one more behind it in the set
    let W = waves.get(t.id);
    if (!W) { W = { main: makeWave(9), next: makeWave(8) }; waves.set(t.id, W); }
    W.t = t;
    placeWave(W.main, S, waveD, side * 0.6, waveH, broken);
    const u2 = (u + 0.5) % 1, k2 = u2 < 0.5 ? u2 / 0.5 : 1;
    placeWave(W.next, S, S.out + 7 - (S.out + 7 - inner) * k2, -S.side * 2, u2 < 0.5 ? 0.25 + 0.4 * k2 : 0, u2 < 0.5 && k2 > 0.8 ? (k2 - 0.8) / 0.2 : 0);
    if (broken > 0.2 && rnd() < dtReal * 8 && App.spawnParticle) {
      const px = W.main.position.x + S.tx * (rnd() - 0.5) * 7, pz = W.main.position.z + S.tz * (rnd() - 0.5) * 7;
      App.spawnParticle({ kind: "spark", x: px, y: App.WATER_Y + waveH, z: pz, vx: S.dx * 2 + (rnd() - 0.5), vy: 1.5 + rnd(), vz: S.dz * 2 + (rnd() - 0.5), age: 0, life: 0.7, color: new THREE.Color("#ffffff") });
    }
    // where the surfer is, and which way it faces: out to sea paddling, in to the beach riding
    t.pos.x = S.sx - S.dx * d + S.tx * side; t.pos.z = S.sz - S.dz * d + S.tz * side;
    const bob = Math.sin(now * 1.6 + t.id) * 0.06;
    if (mode === "ride") {
      t.heading = Math.atan2(S.dx + S.tx * S.side * Math.cos(((u - 0.5) / 0.5) * Math.PI) * 0.6, S.dz + S.tz * S.side * Math.cos(((u - 0.5) / 0.5) * Math.PI) * 0.6);
      t.pos.y = App.WATER_Y - 0.28 + Math.max(0.35, waveH * 0.62 * TALL) + bob * 0.5; // on the face of the wave, just under the lip
      t.pivot.rotation.x = 0.12; t.pivot.rotation.z = Math.sin(now * 2.1 + t.id) * 0.18 - S.side * 0.12; t.pivot.position.set(0, 0, 0);
    } else {
      t.heading = Math.atan2(-S.dx, -S.dz);
      t.pos.y = App.WATER_Y + 0.05 + bob;
      // lying on the board to paddle out; sitting up on it while waiting for the wave
      if (mode === "paddle") { t.pivot.rotation.x = 1.4; t.pivot.rotation.z = 0; t.pivot.position.set(0, 0.35, -1.4); }
      else { t.pivot.rotation.x = 0; t.pivot.rotation.z = Math.sin(now * 1.2 + t.id) * 0.05; t.pivot.position.set(0, -0.55, 0); }
    }
    t.group.position.copy(t.pos); t.group.rotation.y = t.heading;
    if (t.itemObj) { t.itemObj.position.set(0, 0.05, 1.3); t.itemObj.rotation.z = 0; }
    return true;
  };
  // ---------- the open sea: breakers rolling in on the beaches near you (the great lake stays calm) ----------
  const breakers = [];
  let coastKey = "";
  function findCoast(tx, tz) {
    const out = [];
    for (let r = 6; r <= 72 && out.length < 24; r += 6) for (let a = 0; a < 6.283 && out.length < 24; a += 6 / r) {
      const x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r;
      if (!App.seaAt(x, z)) continue;
      // a stretch of sea with the beach close by: which way the land is
      // (the average of every direction in which land is close: square on to the beach)
      let lx = 0, lz = 0;
      for (let b = 0; b < 6.283; b += 0.262) for (const d of [2.5, 4]) if (App.isLand(x + Math.cos(b) * d, z + Math.sin(b) * d)) { lx += Math.cos(b); lz += Math.sin(b); }
      const ll = Math.hypot(lx, lz);
      if (ll < 0.5 || out.some((o) => Math.hypot(o.sx - x, o.sz - z) < 12)) continue;
      const dx = lx / ll, dz = lz / ll;
      // out to sea there must be open water for the wave to come from
      if (!App.seaAt(x - dx * 10, z - dz * 10)) continue;
      out.push({ sx: x, sz: z, dx, dz, tx: -dz, tz: dx, per: 6 + (out.length % 3) * 1.3, ph: (out.length * 0.37) % 1 });
    }
    // the swell comes in from one side along a stretch of coast: every wave mostly follows the main direction,
    // with only a little of its own beach's (so no two cross)
    let mx = 0, mz = 0;
    for (const o of out) { mx += o.dx; mz += o.dz; }
    const ml = Math.hypot(mx, mz);
    if (ml > 0.1) for (const o of out) {
      let dx = (mx / ml) * 0.8 + o.dx * 0.2, dz = (mz / ml) * 0.8 + o.dz * 0.2;
      const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      o.dx = dx; o.dz = dz; o.tx = -dz; o.tz = dx;
    }
    return out.filter((o, i) => !out.slice(0, i).some((p) => Math.hypot(p.sx - o.sx, p.sz - o.sz) < 15));
  }
  App.stepSeaWaves = () => {
    if (!App.seaAt || App.inside) { for (const B of breakers) B.grp.visible = false; return; }
    const tx = App.cam.target.x, tz = App.cam.target.z, key = Math.round(tx / 20) + ":" + Math.round(tz / 20);
    if (key !== coastKey) {
      coastKey = key;
      // two waves in a set at each stretch of beach, half a period apart
      const coast = findCoast(tx, tz).slice(0, 6), sets = [];
      for (const S of coast) sets.push(S, Object.assign({}, S, { ph: S.ph + 0.5 }));
      while (breakers.length > sets.length) App.scene.remove(breakers.pop().grp);
      while (breakers.length < sets.length) breakers.push({ grp: makeWave(10) });
      sets.forEach((S, i) => { breakers[i].S = S; });
    }
    const now = performance.now() / 1000;
    for (const B of breakers) {
      const S = B.S, u = ((now / S.per + S.ph) % 1 + 1) % 1, d = 0.6 + 12 * (1 - u);
      const h = u < 0.72 ? 0.2 + 0.65 * (u / 0.72) : 0.85 * (1 - (u - 0.72) / 0.28) + 0.05, broken = u > 0.72 ? (u - 0.72) / 0.28 : 0;
      placeWave(B.grp, S, d, 0, h, broken);
      if (broken > 0.25 && Math.random() < 0.05 && App.spawnParticle) App.spawnParticle({ kind: "spark", x: B.grp.position.x + S.tx * (Math.random() - 0.5) * 8, y: App.WATER_Y + 0.3, z: B.grp.position.z + S.tz * (Math.random() - 0.5) * 8, vx: S.dx * 1.5, vy: 1 + Math.random(), vz: S.dz * 1.5, age: 0, life: 0.6, color: new THREE.Color("#ffffff") });
    }
  };
  // the waves go when nobody rides them any more
  App.stepSurf = () => {
    App.stepSeaWaves();
    for (const [id, W] of waves) {
      const a = W.t && W.t.action;
      if (a && a.surf && a.phase === "doing" && W.t.group.parent) continue;
      App.scene.remove(W.main, W.next);
      waves.delete(id);
    }
  };
})();
