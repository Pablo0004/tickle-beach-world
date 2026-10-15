/* Life in the great lake. Near the player the lake fills with what lives in it, laid out by depth:
 * cattails along the shore, lily pads (some in flower) in the shallows with frogs on them, herons
 * standing in the shallows, swans in pairs, turtles and otters, koi, and lake weed swaying under the
 * surface. None of it is a Tickle species.
 * They behave like animals, not like clockwork: each picks somewhere to go and swims there, turning
 * gently, and stops for a while; swans keep to their mate; turtles dive and come up to bask; frogs hop
 * from pad to pad nearby and croak. And they eat each other: otters chase koi, herons stand still and
 * strike at frogs and fish that come close. Any of them can be picked up and thrown with the hand
 * (each with its own cry); set down on land they make their way back to the water. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const rnd = Math.random, hash2 = App.hash2;
  const KINDS = [["swan", 0], ["turtle", 0], ["frog", 0], ["heron", 0], ["otter", 0], ["koi", 0], ["koi", 1], ["koi", 2], ["lilypad", 0], ["lilypad", 1], ["cattail", 0], ["seaweed", 0]];
  const CAP = 260, CELL = 40, RANGE = 170;
  const geo = {}, meshes = {};
  const cells = new Map(); // cell key -> { things }
  const strays = []; // animals the hand took away from their cell
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1);
  const key = (k, v) => k + "_" + v;
  function entryFor(md) {
    const g = App.makeVoxMesh(md).geometry, box = App.meshBox(md);
    const local = new THREE.Matrix4().compose(new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - box.min.y, md.origin[2] * S - (box.min.z + box.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
    return { geo: g, local };
  }
  App.loadLakeLife = async () => {
    await Promise.all(KINDS.map(async ([k, v]) => {
      const K = TB.KIT[k], r = await App.job("compact", { strokes: K.build(v), voxel: K.voxel[0], lip: 1.5 });
      geo[key(k, v)] = entryFor(r.mesh);
      const m = new THREE.InstancedMesh(geo[key(k, v)].geo, App.voxMaterial, CAP);
      m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      App.scene.add(m);
      meshes[key(k, v)] = m;
    }));
  };
  const depth = (x, z) => (App.lakeSd ? -App.lakeSd(x, z) : -1); // > 0 out in the lake, the bigger the deeper
  const water = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) < App.SEA;
  // how each animal swims: speed, how fast it turns, how far it roams from home, how deep it likes it, how long it rests
  const HOW = {
    swan: { sp: 0.9, turn: 0.9, roam: 18, min: 5, rest: [4, 12] },
    turtle: { sp: 0.55, turn: 1.1, roam: 12, min: 3, rest: [5, 14] },
    otter: { sp: 2.2, turn: 2.6, roam: 22, min: 4, rest: [2, 6] },
    koi: { sp: 1.1, turn: 1.8, roam: 9, min: 2.5, rest: [0.5, 3] },
  };
  // what lives in one cell of the lake (always the same for the same cell)
  function populate(cx, cz) {
    const things = [], r = (k) => hash2(cx * 131 + k, cz * 71 + k, 263);
    const x0 = cx * CELL, z0 = cz * CELL;
    const at = (k) => ({ x: x0 + r(k) * CELL, z: z0 + r(k + 50) * CELL });
    // plants first
    for (let k = 0; k < 14; k++) {
      const p = at(k), d = depth(p.x, p.z);
      if (d > -1.5 && d < 3 && r(k + 100) < 0.5) things.push({ k: "cattail", v: 0, x: p.x, z: p.z, h: r(k + 101) * 6.28, plant: true });
      else if (d >= 3 && d < 30 && water(p.x, p.z)) {
        // a raft of lily pads
        const n = 3 + Math.floor(r(k + 102) * 6);
        for (let j = 0; j < n; j++) { const a = r(k * 7 + j) * 6.28, q = r(k * 9 + j) * 4; things.push({ k: "lilypad", v: r(k * 11 + j) < 0.25 ? 1 : 0, x: p.x + Math.cos(a) * q, z: p.z + Math.sin(a) * q, h: a, plant: true, pad: true }); }
        k += 2;
      } else if (d >= 8 && r(k + 103) < 0.3) things.push({ k: "seaweed", v: 0, x: p.x, z: p.z, h: r(k + 104) * 6.28, plant: true, under: true });
    }
    const pads = things.filter((t) => t.pad);
    // animals
    const add = (k, v, where, n, extra) => { const made = []; for (let j = 0; j < n; j++) { const p = where(j); if (p) { const o = Object.assign({ k, kind: k, v, x: p.x, z: p.z, y: App.WATER_Y, h: r(j + 300 + k.length) * 6.28, home: { x: p.x, z: p.z }, wait: rnd() * 4, phase: rnd() * 6.28, gone: 0 }, extra || {}); things.push(o); made.push(o); } } return made; };
    const deep = (min) => (j) => { for (let tr = 0; tr < 6; tr++) { const p = at(200 + j * 6 + tr); if (depth(p.x, p.z) > min && water(p.x, p.z)) return p; } return null; };
    const shallow = (j) => { for (let tr = 0; tr < 6; tr++) { const p = at(260 + j * 6 + tr); const d = depth(p.x, p.z); if (d > 1 && d < 5 && water(p.x, p.z)) return p; } return null; };
    if (r(400) < 0.35) { const sw = add("swan", 0, deep(6), r(401) < 0.6 ? 2 : 1, { swim: true }); if (sw.length === 2) { sw[1].mate = sw[0]; sw[1].home = sw[0].home; } }
    if (r(402) < 0.4) add("turtle", 0, deep(4), 1 + Math.floor(r(403) * 2), { swim: true, dive: true });
    if (r(404) < 0.25) add("otter", 0, deep(5), 1, { swim: true, dive: true, hunter: true });
    if (r(405) < 0.3) add("heron", 0, shallow, 1, { stand: true });
    if (r(406) < 0.7) for (let j = 0; j < 2 + Math.floor(r(407) * 3); j++) add("koi", Math.floor(r(408 + j) * 3), deep(3), 1, { swim: true, fish: true });
    // frogs sit on pads and hop only to pads within reach
    for (const p of pads) { p.near = pads.filter((q) => q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 3.2); if (!p.near.length) p.near = pads.filter((q) => q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 6.5); }
    if (pads.length) for (let j = 0; j < Math.min(3, Math.floor(pads.length / 3)); j++) { const p = pads[Math.floor(r(420 + j) * pads.length)]; things.push({ k: "frog", kind: "frog", v: 0, x: p.x, z: p.z, y: App.WATER_Y, h: r(421 + j) * 6.28, frog: true, pad: p, homePad: p, home: { x: p.x, z: p.z }, wait: 2 + rnd() * 6, phase: rnd() * 6.28, gone: 0 }); }
    return things;
  }
  // somewhere to swim to: water deep enough, within the animal's range of home
  function pickTarget(o, H) {
    for (let k = 0; k < 8; k++) {
      const a = rnd() * 6.28, d = rnd() * H.roam, x = o.home.x + Math.cos(a) * d, z = o.home.z + Math.sin(a) * d;
      if (water(x, z) && depth(x, z) > H.min) return { x, z };
    }
    return null;
  }
  function turnTo(h, t, k) { let d = t - h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return h + Math.max(-k, Math.min(k, d)); }
  // steer towards a point: limited turning, slower while the point is off to the side, never onto land
  function swimTo(o, tx, tz, sp, turn, dm) {
    const dx = tx - o.x, dz = tz - o.z, dist = Math.hypot(dx, dz);
    if (dist < 0.4) return dist;
    const want = Math.atan2(dx, dz);
    o.h = turnTo(o.h, want, turn * dm);
    let diff = want - o.h; while (diff > Math.PI) diff -= 6.283; while (diff < -Math.PI) diff += 6.283;
    const step = Math.min(dist, sp * Math.max(0.2, Math.cos(diff)) * dm);
    const nx = o.x + Math.sin(o.h) * step, nz = o.z + Math.cos(o.h) * step;
    if (water(nx, nz)) { o.x = nx; o.z = nz; } else { o.tgt = null; o.h += Math.PI * 0.6; }
    return dist;
  }
  // everything alive nearby, for hunters to look through
  function animalsAround(x, z, R, pred) {
    const out = [];
    for (const things of cells.values()) for (const o of things) if (!o.plant && !o.gone && !o.held && !o.flying && Math.abs(o.x - x) + Math.abs(o.z - z) < R && (!pred || pred(o))) out.push(o);
    return out;
  }
  // frogs croak in bouts: two or three calls, one answering another, then quiet for a while (shorter at night)
  let nextCroak = 0, bout = 0;
  function croak(o, tx, tz) {
    const now = performance.now(), d = Math.hypot(o.x - tx, o.z - tz);
    // only once the player has clicked or pressed a key (before that the browser keeps sound asleep)
    if (now < nextCroak || d > 40 || App.inside || !App.sfx || !App.sfx.animal || !(navigator.userActivation && navigator.userActivation.hasBeenActive)) return;
    App.sfx.animal("frog", Math.max(0.12, 0.5 - d / 80), "amb");
    if (bout > 0) { bout--; nextCroak = now + 500 + rnd() * 900; }
    else { bout = Math.floor(rnd() * 3); nextCroak = now + (App.isNight ? 3000 + rnd() * 5000 : 9000 + rnd() * 14000); }
  }
  // one animal's life for one frame; returns its height
  function live(o, dm, now, tx, tz) {
    const WY = App.WATER_Y;
    if (o.held || o.flying) return o.y;
    // set down on land: back to the water the shortest way
    if (!water(o.x, o.z)) {
      const ground = App.columnHeight(Math.floor(o.x), Math.floor(o.z));
      if (!o.back) { o.back = null; for (let r = 2; r < 40 && !o.back; r += 2) for (let a = 0; a < 6.28 && !o.back; a += 0.5) { const x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r; if (water(x, z)) o.back = { x, z }; } }
      if (o.back) {
        const dx = o.back.x - o.x, dz = o.back.z - o.z, dist = Math.hypot(dx, dz) || 1, sp = o.k === "frog" ? 2.4 : o.k === "otter" ? 2 : o.k === "koi" ? 1.5 : 0.8;
        o.h = Math.atan2(dx, dz); o.x += (dx / dist) * Math.min(dist, sp * dm); o.z += (dz / dist) * Math.min(dist, sp * dm);
      }
      // a stranded fish flops, a frog hops, the rest waddle
      const hop = o.k === "koi" || o.k === "frog" ? Math.abs(Math.sin(now * (o.k === "koi" ? 9 : 5) + o.phase)) * (o.k === "koi" ? 0.35 : 0.5) : 0;
      return ground + hop;
    }
    if (o.back) { o.back = null; if (!o.frog) o.home = { x: o.x, z: o.z }; else { const p = nearestPad(o); if (p) o.pad = p; } }
    if (o.frog) return frog(o, dm, now, tx, tz);
    if (o.stand) return heron(o, dm, now);
    const H = HOW[o.k];
    // a swan keeps close to its mate
    if (o.mate && !o.mate.gone) {
      const m = o.mate, d = Math.hypot(m.x - o.x, m.z - o.z);
      if (d > 2.2) swimTo(o, m.x - Math.sin(m.h) * 1.6, m.z - Math.cos(m.h) * 1.6, H.sp * (d > 6 ? 1.6 : 1), H.turn, dm);
      else o.h = turnTo(o.h, m.h, dm * 0.5);
      return WY - 0.35 + Math.sin(now * 1.4 + o.phase) * 0.04;
    }
    // an otter hunts koi
    if (o.hunter) {
      if (o.eating > 0) { o.eating -= dm; o.roll = Math.min(1, (o.roll || 0) + dm); return WY - 0.25; }
      o.roll = Math.max(0, (o.roll || 0) - dm);
      if (!o.prey && o.wait <= 0 && rnd() < dm * 0.15) o.prey = animalsAround(o.x, o.z, 16, (q) => q.fish)[0] || null;
      if (o.prey) {
        const p = o.prey;
        if (p.gone || p.held || p.flying || Math.hypot(p.x - o.x, p.z - o.z) > 24) o.prey = null;
        else {
          p.fleeFrom = o;
          if (swimTo(o, p.x, p.z, H.sp * 1.5, H.turn * 1.4, dm) < 0.9) {
            // caught: the koi is gone for a while, the otter floats on its back with it
            if (rnd() < 0.5) { p.gone = now + 40 + rnd() * 40; o.eating = 6; spray(p.x, p.z, "#ff9a3c"); } else o.wait = 3;
            o.prey = null; p.fleeFrom = null;
          }
          return WY - 0.3;
        }
      }
    }
    // a koi with an otter behind it bolts away
    if (o.fish && o.fleeFrom) {
      const f = o.fleeFrom, ax = o.x - f.x, az = o.z - f.z, L = Math.hypot(ax, az) || 1;
      if (L > 10 || f.prey !== o) o.fleeFrom = null;
      else { swimTo(o, o.x + (ax / L) * 5, o.z + (az / L) * 5, H.sp * 1.9, H.turn * 1.5, dm); return WY - 0.6; }
    }
    // otherwise: rest a while, then swim somewhere
    if (o.wait > 0) { o.wait -= dm; if (o.k === "turtle" && o.wait > 2) o.bask = true; }
    else {
      o.bask = false;
      if (!o.tgt) o.tgt = pickTarget(o, H);
      if (!o.tgt || swimTo(o, o.tgt.x, o.tgt.z, H.sp, H.turn, dm) < 0.5) { o.tgt = null; o.wait = H.rest[0] + rnd() * (H.rest[1] - H.rest[0]); }
    }
    if (o.fish) {
      if (!o.jump && rnd() < dm * 0.01) o.jump = { t: 0 };
      if (o.jump) { o.jump.t += dm * 2.4; const u = o.jump.t; o.tilt = (0.5 - Math.min(1, u)) * 1.6; if (u >= 1) { o.jump = null; o.tilt = 0; } return WY - 0.7 + Math.sin(Math.min(1, u) * Math.PI) * 1.6; }
      return WY - 0.7;
    }
    if (o.k === "swan") return WY - 0.35 + Math.sin(now * 1.4 + o.phase) * 0.04;
    if (o.dive) { if (o.bask) return WY - 0.2; const s = Math.sin(now * 0.25 + o.phase); return WY - 0.35 - (s > 0.6 ? (s - 0.6) * 4 : 0); }
    return WY - 0.3;
  }
  function nearestPad(o) {
    let best = null, bd = 6;
    for (const things of cells.values()) for (const p of things) if (p.pad) { const d = Math.hypot(p.x - o.x, p.z - o.z); if (d < bd) { bd = d; best = p; } }
    if (best && !best.near) best.near = [];
    return best;
  }
  // frogs sit, croak, and hop to a pad within reach (or plop into the water and swim to one)
  function frog(o, dm, now, tx, tz) {
    const WY = App.WATER_Y;
    if (o.hop) {
      o.hop.u += dm / o.hop.T;
      const u = Math.min(1, o.hop.u);
      o.x = o.hop.from.x + (o.hop.to.x - o.hop.from.x) * u; o.z = o.hop.from.z + (o.hop.to.z - o.hop.from.z) * u;
      if (u >= 1) { o.pad = o.hop.to; o.hop = null; o.wait = 2 + rnd() * 7; }
      return WY + 0.05 + Math.sin(u * Math.PI) * o.hop_h;
    }
    o.wait -= dm;
    if (o.scared > 0) o.scared -= dm;
    if (o.wait <= 0) {
      const opts = (o.pad && o.pad.near) || [];
      let to = opts.length ? opts[Math.floor(rnd() * opts.length)] : null;
      // no pad in reach (thrown somewhere): hop back towards its own raft, a few steps at a time
      if (!to && o.homePad) { const hp = o.homePad, d = Math.hypot(hp.x - o.x, hp.z - o.z); to = d < 3 ? hp : { x: o.x + ((hp.x - o.x) / d) * 2.5, z: o.z + ((hp.z - o.z) / d) * 2.5, near: [hp] }; }
      if (to) {
        const d = Math.hypot(to.x - o.x, to.z - o.z);
        o.h = Math.atan2(to.x - o.x, to.z - o.z);
        o.hop = { from: { x: o.x, z: o.z }, to, u: 0, T: 0.25 + d * 0.09 }; o.hop_h = 0.35 + d * 0.15;
      } else o.wait = 3 + rnd() * 5;
      if (rnd() < 0.35) croak(o, tx, tz);
    }
    // the throat puffs while it croaks
    o.puff = Math.max(0, (o.puff || 0) - dm);
    return WY + 0.05;
  }
  // herons stand still and strike at whatever swims or hops within reach
  function heron(o, dm, now) {
    const WY = App.WATER_Y, ground = Math.max(App.columnHeight(Math.floor(o.x), Math.floor(o.z)), WY - 1.2);
    if (o.strike) {
      o.strike.t += dm * 2.5;
      const u = o.strike.t;
      o.tilt = Math.sin(Math.min(1, u) * Math.PI) * 0.9;
      if (u >= 0.5 && !o.strike.done) {
        o.strike.done = true;
        const p = o.strike.prey;
        if (!p.gone && !p.held && Math.hypot(p.x - o.x, p.z - o.z) < 3 && rnd() < 0.45) { p.gone = now + 50 + rnd() * 40; spray(p.x, p.z, p.frog ? "#4caf50" : "#ff9a3c"); }
        else if (p.frog) { p.wait = 0; p.scared = 4; } // missed: the frog leaps away
      }
      if (u >= 1) { o.strike = null; o.tilt = 0; o.wait = 4 + rnd() * 8; }
      return ground;
    }
    if (o.wait > 0) { o.wait -= dm; if (rnd() < dm * 0.02) o.h += (rnd() - 0.5) * 1.2; return ground; }
    const prey = animalsAround(o.x, o.z, 5, (q) => (q.frog || q.fish) && Math.hypot(q.x - o.x, q.z - o.z) < 2.8)[0];
    if (prey) { o.h = Math.atan2(prey.x - o.x, prey.z - o.z); o.strike = { t: 0, prey }; }
    else o.wait = 1 + rnd() * 2;
    return ground;
  }
  function spray(x, z, col) {
    if (!App.spawnParticle) return;
    for (let k = 0; k < 14; k++) App.spawnParticle({ kind: "spark", x, y: App.WATER_Y + 0.2, z, vx: (rnd() - 0.5) * 3, vy: 1.5 + rnd() * 2, vz: (rnd() - 0.5) * 3, age: -k * 0.01, life: 0.7, color: new THREE.Color(k % 3 ? "#cfefff" : col) });
  }
  // for the hand: the animals of the lake near a point (not the plants)
  App.lakeAnimalsNear = (x, z, R) => {
    const out = animalsAround(x, z, R);
    for (const o of strays) if (!o.gone && Math.abs(o.x - x) + Math.abs(o.z - z) < R) out.push(o);
    return out;
  };
  App.updateLakeLife = (dtReal) => {
    if (!geo.swan_0 || !App.lakeSd) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, dm = Math.min(dtReal, 0.1) * Math.min(1.5, Math.max(0.3, st.speed)), now = performance.now() / 1000;
    // the cells in view, populated once
    const keep = new Set();
    const c0x = Math.floor((tx - RANGE) / CELL), c1x = Math.floor((tx + RANGE) / CELL), c0z = Math.floor((tz - RANGE) / CELL), c1z = Math.floor((tz + RANGE) / CELL);
    for (let cx = c0x; cx <= c1x; cx++) for (let cz = c0z; cz <= c1z; cz++) {
      const mx = cx * CELL + CELL / 2, mz = cz * CELL + CELL / 2;
      if (depth(mx, mz) < -CELL) continue; // nowhere near the lake
      const k = cx + "," + cz;
      keep.add(k);
      if (!cells.has(k)) cells.set(k, populate(cx, cz));
    }
    for (const k of [...cells.keys()]) if (!keep.has(k)) {
      // an animal the hand has carried off stays with the player until it is home again
      for (const o of cells.get(k)) if (o.away && !o.plant) strays.push(o);
      cells.delete(k);
    }
    for (let i = strays.length - 1; i >= 0; i--) { const o = strays[i]; if (Math.abs(o.x - tx) + Math.abs(o.z - tz) > RANGE * 2.5 || (water(o.x, o.z) && !o.held && Math.abs(o.x - tx) + Math.abs(o.z - tz) > RANGE * 1.4)) strays.splice(i, 1); }
    const n = {};
    const WY = App.WATER_Y;
    const draw = (o) => {
      if (o.gone) { if (now < o.gone) return; o.gone = 0; if (o.home) { o.x = o.home.x; o.z = o.home.z; } }
      if (o.held || o.flying) o.away = true;
      let y;
      if (o.plant) {
        y = o.k === "seaweed" ? App.columnHeight(Math.floor(o.x), Math.floor(o.z)) + 0.02 : o.k === "cattail" ? Math.max(App.columnHeight(Math.floor(o.x), Math.floor(o.z)), WY - 1.2) : WY + 0.02;
        o.tilt = o.k === "seaweed" || o.k === "cattail" ? Math.sin(now * 0.8 + o.x * 0.3) * 0.08 : 0;
      } else { y = live(o, dm, now, tx, tz); if (!o.held && !o.flying) o.y = y; else y = o.y; }
      const id = key(o.k, o.v), mesh = meshes[id];
      if (!mesh || (n[id] || 0) >= CAP || Math.abs(o.x - tx) + Math.abs(o.z - tz) > RANGE * 1.4) return;
      // held or thrown animals tumble; an otter eating floats on its back
      const roll = o.flying ? Math.sin(now * 6) * 0.6 : o.roll ? o.roll * Math.PI : 0;
      E.set(o.tilt || 0, o.h, o.plant ? o.tilt || 0 : roll, "YXZ");
      Q.setFromEuler(E);
      M4.compose(V.set(o.x, y, o.z), Q, SC).multiply(geo[id].local);
      mesh.setMatrixAt((n[id] = (n[id] || 0) + 1) - 1, M4);
    };
    for (const things of cells.values()) for (const o of things) draw(o);
    for (const o of strays) draw(o);
    for (const id in meshes) { meshes[id].count = n[id] || 0; meshes[id].instanceMatrix.needsUpdate = true; }
  };
  App.lakeLifeCounts = () => Object.fromEntries(Object.entries(meshes).map(([k, m]) => [k, m.count]));
})();
