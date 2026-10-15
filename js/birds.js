/* Songbirds. Birds of several kinds live in the trees near you and sing: the sunfinch's quick bright trill,
 * the meadow warbler's sliding warble, the palm robin's whistle, the coral thrush's flute phrase sung twice,
 * the turtle dove's soft coo; at night only the moon owl hoots, and gulls wheel and cry over the open sea.
 * They sing in harmony: every song is made of the notes of one scale (D major pentatonic) and starts on the
 * beat of one shared slow pulse, so birds that sing together are in tune and in time. The dawn chorus is
 * the fullest; it thins out through the day and stops at dark. Each bird can be seen on its tree, bobbing
 * as it sings, and its song comes from where it sits (louder close by, from the left or the right).
 * All synthesized live; it is ambience (Menu > Sound). Quiet indoors. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the birds' models: small, round, in each kind's colours ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    const LOOK = [
      { body: "#ffd23f", belly: "#fff4d6", wing: "#ff7a2f", beak: "#ff7a2f" }, // sunfinch
      { body: "#8fb85a", belly: "#f3e2c0", wing: "#5a7a3a", beak: "#3a2a1a" }, // meadow warbler
      { body: "#8a5a3a", belly: "#e8443a", wing: "#6b4a2b", beak: "#3a2a1a" }, // palm robin
      { body: "#c9a27a", belly: "#fff4d6", wing: "#8a5a3a", beak: "#3a2a1a" }, // coral thrush
      { body: "#d8d0e0", belly: "#f4f0f8", wing: "#a090b0", beak: "#e8a0a0" }, // turtle dove
      { body: "#8a6a4a", belly: "#d8c0a0", wing: "#5a4030", beak: "#ffd23f" }, // moon owl
      { body: "#f4f4f4", belly: "#ffffff", wing: "#9aa0a8", beak: "#ffb020" }, // sea gull
    ];
    function songbird(v) {
      const L = LOOK[v || 0], st = [], body = C(L.body), belly = C(L.belly), wing = C(L.wing), beak = C(L.beak), eye = C("#111111");
      const owl = v === 5, gull = v === 6;
      st.push(S("sphere", [0, 0, 42], [24, owl ? 26 : 34, owl ? 34 : 24], { color: body }));
      st.push(S("sphere", [0, owl ? 4 : 22, owl ? 74 : 62], [owl ? 24 : 18, owl ? 20 : 18, owl ? 20 : 18], { color: body, blend: 8 }));
      st.push(S("cube", [0, -38, 44], [gull ? 8 : 12, 18, 4], { color: wing, rot: [0.4, 0, 0] }));
      // layer 1: the belly, the wings folded at the sides, the beak and the eyes
      st.push(S("sphere", [0, 8, 34], [18, 22, 18], { color: belly, layer: 1 }));
      st.push(S("sphere", [20, -6, 46], [6, 24, 14], { color: wing, mirror: true, offsX: 20, layer: 1 }));
      st.push(S("joint", [0, owl ? 26 : 40, owl ? 70 : 62], [5, 5, owl ? 5 : 9], { color: beak, cone: 1, rot: dir(0, 1, owl ? -1 : -0.1), layer: 1 }));
      st.push(S("sphere", [owl ? 10 : 9, owl ? 20 : 34, owl ? 80 : 68], [owl ? 6 : 3.5, 3, owl ? 6 : 3.5], { color: owl ? C("#ffd23f") : eye, mirror: true, offsX: owl ? 10 : 9, layer: 1 }));
      return st;
    }
    TB.KIT.songbird = { name: "Songbird", group: "Wildlife", variants: [0, 1, 2, 3, 4, 5, 6], build: songbird, voxel: [3], variantLabel: (v) => ["sunfinch", "meadow warbler", "palm robin", "coral thrush", "turtle dove", "moon owl", "sea gull"][v] };
  }
  if (!G.App) return;
  const App = G.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2;

  // ---------- the songs: notes of one scale, on one pulse ----------
  const BASE = 293.66, SCALE = [0, 2, 4, 7, 9], BEAT = 0.3; // D, a slow shared pulse (seconds)
  const freq = (deg, oct) => BASE * Math.pow(2, oct + (SCALE[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5)) / 12);
  // each song: [degree, start (beats), length (beats), slide to degree (or null)], the octave, the voice
  const SONGS = {
    trill: (r) => { const d0 = Math.floor(r * 3), out = []; for (let k = 0; k < 6; k++) out.push([d0 + k, k * 0.5, 0.45, null]); return { notes: out, oct: 2, wave: "sine", vib: 18, vol: 0.5 }; },
    warble: (r) => { const d0 = 2 + Math.floor(r * 3); return { notes: [[d0, 0, 0.8, d0 + 2], [d0 + 2, 1, 0.8, d0 + 1], [d0 + 1, 2, 0.8, d0 + 3], [d0 + 3, 3, 1.2, d0]], oct: 2, wave: "sine", vib: 9, vol: 0.45 }; },
    whistle: (r) => { const d = r < 0.5 ? [4, 2, 4, 3, 5] : [2, 4, 2, 5, 4]; return { notes: [[d[0], 0, 1.4, null], [d[1], 1.5, 0.45, null], [d[2], 2, 1.4, null], [d[3], 3.5, 0.45, null], [d[4], 4, 1.8, null]], oct: 1, wave: "sine", vib: 5, vol: 0.55 }; },
    flute: (r) => { const p = r < 0.33 ? [0, 2, 4] : r < 0.66 ? [4, 3, 1] : [2, 4, 5], out = []; for (let rep = 0; rep < 2; rep++) p.forEach((d, k) => out.push([d, rep * 4 + k, 0.9, null])); return { notes: out, oct: 1, wave: "triangle", vib: 4, vol: 0.5 }; },
    coo: () => ({ notes: [[2, 0, 1.6, 1], [4, 2, 2.2, 3], [2, 4.6, 1, null]], oct: 0, wave: "sine", vib: 2, vol: 0.45 }),
    hoot: () => ({ notes: [[1, 0, 1.8, 0], [1, 3, 0.7, null], [1, 4, 2, 0]], oct: -1, wave: "sine", vib: 3, vol: 0.6 }),
    cry: () => ({ notes: [[3, 0, 0.5, 6], [6, 0.5, 1.1, 1]], oct: 1, wave: "sawtooth", vib: 25, vol: 0.18, harsh: true }),
  };
  const KINDS = [
    { name: "Sunfinch", v: 0, song: "trill", every: [5, 11] },
    { name: "Meadow Warbler", v: 1, song: "warble", every: [7, 14] },
    { name: "Palm Robin", v: 2, song: "whistle", every: [8, 16] },
    { name: "Coral Thrush", v: 3, song: "flute", every: [9, 18] },
    { name: "Turtle Dove", v: 4, song: "coo", every: [10, 20] },
    { name: "Moon Owl", v: 5, song: "hoot", every: [14, 28] },
    { name: "Sea Gull", v: 6, song: "cry", every: [6, 15] },
  ];
  App.BIRDS = KINDS;
  // one song from (x, z): on the next beat of the shared pulse, from the left or the right of the camera
  function sing(b, kind) {
    const A = App.sfx && App.sfx.ambient && navigator.userActivation && navigator.userActivation.hasBeenActive ? App.sfx.ambient() : null;
    if (!A) return 0;
    const { ctx, bus } = A, tx = App.cam.target.x, tz = App.cam.target.z, dx = b.x - tx, dz = b.z - tz, d = Math.hypot(dx, dz);
    const near = Math.pow(Math.max(0, 1 - d / 70), 1.4);
    if (near < 0.02) return 0;
    const th = App.cam.theta || 0, pan = Math.max(-0.85, Math.min(0.85, d > 0.5 ? (dx * Math.cos(th) - dz * Math.sin(th)) / d : 0));
    const S = SONGS[kind.song](rnd());
    const grid = BEAT * 2, t0 = Math.ceil((ctx.currentTime + 0.05) / grid) * grid;
    const out = ctx.createGain(); out.gain.value = near * S.vol * 0.35;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) { p.pan.value = pan; out.connect(p).connect(bus); } else out.connect(bus);
    let last = 0;
    for (const [deg, at, len, to] of S.notes) {
      const t = t0 + at * BEAT, dur = len * BEAT, f0 = freq(deg, S.oct);
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = S.wave; o.frequency.setValueAtTime(f0, t);
      if (to != null) o.frequency.exponentialRampToValueAtTime(freq(to, S.oct), t + dur * 0.9);
      lfo.frequency.value = S.vib; lg.gain.value = f0 * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + Math.min(0.03, dur * 0.2)); g.gain.setValueAtTime(1, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = o;
      if (S.harsh) { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 2; o.connect(bp); node = bp; }
      node.connect(g).connect(out);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      last = Math.max(last, at + len);
    }
    setTimeout(() => { try { out.disconnect(); } catch (e) { /* gone */ } }, (t0 - ctx.currentTime + last * BEAT + 1) * 1000);
    return (t0 - ctx.currentTime) * 1000; // when it starts, so the bird bobs then
  }

  // ---------- who sings now, and where ----------
  // how many sing at this hour: a full chorus at dawn, fewer by day, none at dark (the owls then)
  function chorus() {
    const m = st.T % 1440;
    if (m >= 300 && m < 540) return { n: 8, rate: 0.7, night: false };
    if (m >= 540 && m < 1080) return { n: 5, rate: 1, night: false };
    if (m >= 1080 && m < 1230) return { n: 4, rate: 1.2, night: false };
    return { n: 2, rate: 1, night: true };
  }
  const birds = new Map(); // key -> bird
  let pickAt = 0, pickKey = "";
  const treeTop = (s) => { const F = App.frag[s.type]; return (s.y != null ? s.y : App.genHeight(s.x, s.z)) + (F ? F.height * (s.scale || 1) * 0.9 : 3); };
  function choose() {
    const tx = App.cam.target.x, tz = App.cam.target.z, C = chorus(), want = new Map();
    // the trees near the camera, a stable few of them, each with the kind of bird that suits it
    const trees = (App.sceneryVisible || []).filter((s) => s.tree && !s.gone && Math.hypot(s.x - tx, s.z - tz) < 60).sort((a, b) => hash2(a.idx, 3, 801) - hash2(b.idx, 3, 801));
    for (const s of trees) {
      if (want.size >= C.n) break;
      const h = hash2(s.idx, 5, 803), palm = s.type === "palm";
      const kind = C.night ? (h < 0.5 ? KINDS[5] : null) : palm ? KINDS[h < 0.6 ? 2 : 0] : KINDS[[0, 1, 3, 4, 1, 3][Math.floor(h * 6)]];
      if (!kind) continue;
      const a = hash2(s.idx, 7, 805) * 6.28, F = App.frag[s.type], r = F ? F.rad * (s.scale || 1) * 0.45 : 1;
      want.set("t" + s.idx, { kind, x: s.x + Math.cos(a) * r, z: s.z + Math.sin(a) * r, y: treeTop(s), tree: s });
    }
    // gulls over the open sea close by, by day
    if (!C.night && App.seaAt) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.28, x = tx + Math.cos(a) * 30, z = tz + Math.sin(a) * 30;
      if (App.seaAt(x, z)) { for (let g = 0; g < 2; g++) want.set("g" + Math.round(x) + ":" + Math.round(z) + ":" + g, { kind: KINDS[6], x, z, y: App.WATER_Y + 9 + g * 2, fly: { cx: x, cz: z, r: 10 + g * 5, w: (g ? -1 : 1) * 0.35 } }); break; }
    }
    // the ones no longer wanted go; new ones fly in
    for (const [k, b] of birds) if (!want.has(k)) { if (b.obj) App.scene.remove(b.obj); birds.delete(k); }
    for (const [k, w] of want) if (!birds.has(k)) {
      const b = Object.assign(w, { obj: null, next: performance.now() + 1000 + rnd() * w.kind.every[1] * 1000, bobUntil: 0, bobFrom: 0, born: performance.now(), from: { x: w.x + (rnd() - 0.5) * 30, y: w.y + 12, z: w.z + (rnd() - 0.5) * 30 } });
      birds.set(k, b);
      App.kitMesh("songbird", w.kind.v).then((r) => { if (birds.get(k) !== b) return; const g = new THREE.Group(); g.add(App.centeredMesh(r.md, r.geo, true)); g.scale.setScalar(b.kind.v === 5 ? 2.2 : b.kind.v === 6 ? 2.4 : 1.8); App.scene.add(g); b.obj = g; });
    }
  }
  App.updateBirds = (dt) => {
    const now = performance.now(), quiet = App.inside;
    const tx = App.cam.target.x, tz = App.cam.target.z, key = Math.round(tx / 20) + ":" + Math.round(tz / 20) + ":" + (chorus().night ? "n" : "d");
    if (quiet) { for (const b of birds.values()) if (b.obj) b.obj.visible = false; return; }
    if (now > pickAt || key !== pickKey) { pickAt = now + 4000; pickKey = key; choose(); }
    const C = chorus(), t = now / 1000;
    for (const b of birds.values()) {
      // flying in to its perch, then sitting; gulls wheel round and round
      let x = b.x, y = b.y, z = b.z, h = hash2(b.x | 0, b.z | 0, 807) * 6.28, flying = false;
      if (b.fly) { const a = t * b.fly.w + (b.fly.r * 0.7); x = b.fly.cx + Math.cos(a) * b.fly.r; z = b.fly.cz + Math.sin(a) * b.fly.r; y = b.y + Math.sin(t * 0.7 + b.fly.r) * 0.8; h = a + (b.fly.w > 0 ? 0 : Math.PI); flying = true; }
      else { const k = Math.min(1, (now - b.born) / 2200); if (k < 1) { const e = k * k * (3 - 2 * k); x = b.from.x + (b.x - b.from.x) * e; z = b.from.z + (b.z - b.from.z) * e; y = b.from.y + (b.y - b.from.y) * e + Math.sin(k * Math.PI) * 2; h = Math.atan2(b.x - b.from.x, b.z - b.from.z); flying = true; } }
      if (b.obj) {
        b.obj.visible = true;
        b.obj.position.set(x, y + (flying ? Math.sin(t * 18) * 0.12 : 0), z);
        b.obj.rotation.y = h;
        // bobbing its head and tail while it sings
        const singing = now > b.bobFrom && now < b.bobUntil;
        b.obj.rotation.x = singing ? Math.sin(t * 22) * 0.12 - 0.15 : flying ? 0.2 : 0;
      }
      const W = App.weatherHere && App.weatherHere();
      if (now >= b.next && !st.paused && st.speed > 0 && !(W && (W.rain > 0.25 || W.storm))) { // quiet in the rain
        const lead = sing(b, b.kind);
        b.bobFrom = now + lead; b.bobUntil = b.bobFrom + 2000;
        b.next = now + (b.kind.every[0] + rnd() * (b.kind.every[1] - b.kind.every[0])) * 1000 * C.rate;
      }
    }
  };
  // what is singing round you (for the card in the Sound menu)
  App.birdSpots = () => [...birds.values()].map((b) => ({ kind: b.kind.name, x: b.x, y: b.y, z: b.z, shown: !!b.obj }));
  App.birdsNear = () => { const c = {}; for (const b of birds.values()) c[b.kind.name] = (c[b.kind.name] || 0) + 1; return c; };
})(typeof self !== "undefined" ? self : this);
