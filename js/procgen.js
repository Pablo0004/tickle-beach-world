/* Local "designer" for the Director: builds new props in the native Tickle stroke format, plus
 * the fidelity checker that compares any AI-made model against the 58 on-chain models. */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});

  // ---------- small helpers ----------
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const R2 = (v) => Math.round(v * 100) / 100;
  let PAL = null;
  function palette() {
    if (!PAL) PAL = TB.paletteList();
    return PAL;
  }
  function hexToRgb(h) { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function nearest(rgb) {
    if (typeof rgb === "string") rgb = hexToRgb(rgb);
    let best = 0, bd = Infinity;
    for (const p of palette()) {
      const rm = (p.rgb[0] + rgb[0]) / 2, dr = p.rgb[0] - rgb[0], dg = p.rgb[1] - rgb[1], db = p.rgb[2] - rgb[2];
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = p.i; }
    }
    return best;
  }
  function rgbHex(rgb) { return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""); }
  // direction -> euler that points a primitive's local +z along d
  function dirRot(dx, dy, dz) {
    const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    return [R2(Math.atan2(-dy, dz)), R2(Math.asin(Math.max(-1, Math.min(1, dx)))), 0];
  }
  function S(p, pos, size, o) {
    o = o || {};
    const s = { p, m: o.m || "add", pos: pos.map(R2), rot: (o.rot || [0, 0, 0]).map(R2), size: size.map(R2), color: o.color || 0, layer: o.layer || 0 };
    for (const k of ["blend", "round", "bevel", "cone", "hole", "lw"]) if (o[k]) s[k] = R2(o[k]);
    if (o.torus) s.torus = true;
    if (o.mirror) { s.mirror = true; s.offsX = R2(o.offsX != null ? o.offsX : pos[0]); }
    return s;
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function jitterColor(r, hex, amt) {
    const c = hexToRgb(hex).map((v) => Math.max(0, Math.min(255, v + (r() - 0.5) * amt)));
    return nearest(c);
  }

  // ---------- templates (SDF units, z up, ground at z=0, a Tickle stands ~480 tall) ----------
  const TEMPLATES = {
    "Coconut Palm": { cat: "hunger", act: ["Pick coconuts", "is cracking a coconut", { hunger: 35, fun: 5 }, 2, 15], build(r) {
      const st = [], bark = jitterColor(r, "#9b6a3c", 20), leaf = nearest(r() < 0.5 ? "#00a110" : "#00b126"), nut = nearest("#6b4a2a");
      const segs = 4 + Math.floor(r() * 2), lean = (r() - 0.5) * 0.25;
      let x = 0, z = 0;
      for (let i = 0; i < segs; i++) {
        const hl = 38, rad = 20 - i * 1.6;
        st.push(S("joint", [x, 0, z + hl], [rad, rad, hl], { color: bark, blend: 6, rot: [0, lean, 0] }));
        x += Math.sin(lean) * hl * 2; z += Math.cos(lean) * hl * 2 - 6;
      }
      const top = [x, 0, z + 10], n = 6 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.3, droop = -0.35 - r() * 0.3;
        const d = [Math.cos(a) * Math.cos(droop), Math.sin(a) * Math.cos(droop), Math.sin(droop)];
        st.push(S("sphere", [top[0] + d[0] * 62, top[1] + d[1] * 62, top[2] + d[2] * 62 + 8], [24, 7, 70], { color: leaf, blend: 4, rot: dirRot(...d) }));
      }
      for (let i = 0; i < 3; i++) st.push(S("sphere", [top[0] + (i - 1) * 16, 12 - (i % 2) * 20, top[2] - 18], [13, 13, 13], { color: nut, blend: 2 }));
      return st;
    } },
    "Fruit Stand": { cat: "hunger", act: ["Grab a snack", "is munching fruit", { hunger: 40, social: 5 }, 2, 15], build(r) {
      const wood = jitterColor(r, "#b07a45", 30), awn = [nearest("#ffffff"), jitterColor(r, pick(r, ["#e8443a", "#2f8fe0", "#f2b52b", "#3cbf6c"]), 20)];
      const w = 90 + r() * 30, st = [];
      st.push(S("cube", [0, 0, 48], [w, 48, 48], { color: wood, round: 0.25 }));
      st.push(S("cube", [0, 0, 100], [w + 8, 54, 6], { color: nearest("#f3e2c0"), round: 0.4, blend: 3 }));
      st.push(S("joint", [w - 6, 30, 165], [6, 6, 70], { color: wood, mirror: true, offsX: w - 6 }));
      st.push(S("cube", [0, 10, 238], [w + 14, 62, 6], { color: awn[0], rot: [0.18, 0, 0], round: 0.3 }));
      const stripes = 5;
      for (let i = 0; i < stripes; i++) {
        const x = -w + ((i + 0.5) / stripes) * 2 * w;
        st.push(S("cube", [x, 10, 238], [w / stripes / 2, 66, 9], { m: "rep", color: awn[1], rot: [0.18, 0, 0] }));
      }
      const fruit = ["#ff5a3c", "#ffb020", "#ffe14a", "#7ac943", "#b0302b"];
      for (let i = 0; i < 7; i++) st.push(S("sphere", [-w + 20 + i * ((2 * w - 40) / 6), -14 + (i % 2) * 18, 118], [13, 13, 13], { color: nearest(pick(r, fruit)), blend: 1 }));
      return st;
    } },
    "Ice Cream Cart": { cat: "hunger", act: ["Get ice cream", "is licking ice cream", { hunger: 25, fun: 15 }, 2, 12], build(r) {
      const body = jitterColor(r, pick(r, ["#f7a1c4", "#8fd3f4", "#fff2a8"]), 20), st = [];
      st.push(S("cube", [0, 0, 95], [85, 50, 50], { color: body, round: 0.5 }));
      st.push(S("cylinder", [62, 0, 38], [34, 34, 8], { color: nearest("#333333"), rot: [1.57, 0, 0], mirror: true, offsX: 62 }));
      st.push(S("cylinder", [62, 0, 38], [14, 14, 10], { color: nearest("#cccccc"), rot: [1.57, 0, 0], mirror: true, offsX: 62, m: "rep" }));
      st.push(S("joint", [-50, 0, 230], [5, 5, 90], { color: nearest("#dddddd") }));
      st.push(S("cylinder", [-50, 0, 318], [100, 100, 18], { color: nearest("#ffffff"), cone: 0.9 }));
      for (let i = 0; i < 4; i++) st.push(S("cube", [-50, 0, 318], [100, 14, 20], { m: "rep", color: body, rot: [0, 0, i * 0.785], cone: 0.9 }));
      st.push(S("joint", [35, 0, 168], [16, 16, 18], { color: nearest("#e2a35a"), cone: 0.85, rot: [3.14, 0, 0] }));
      st.push(S("sphere", [35, 0, 196], [19, 19, 17], { color: nearest(pick(r, ["#ffd1e0", "#7a4a2a", "#fff4d6", "#9be38f"])), blend: 4 }));
      return st;
    } },
    Grill: { cat: "hunger", act: ["Grill fish", "is grilling", { hunger: 45, social: 10, energy: -5 }, 3, 20], build(r) {
      const metal = jitterColor(r, "#3a3a3a", 20), st = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        st.push(S("joint", [Math.cos(a) * 28, Math.sin(a) * 28, 55], [5, 5, 55], { color: metal, rot: dirRot(-Math.cos(a) * 0.25, -Math.sin(a) * 0.25, 1) }));
      }
      st.push(S("cylinder", [0, 0, 118], [58, 58, 22], { color: jitterColor(r, pick(r, ["#c0392b", "#222222", "#2c6fbb"]), 20), round: 0.6, blend: 3 }));
      st.push(S("cylinder", [0, 0, 132], [50, 50, 14], { m: "sub", color: metal }));
      st.push(S("cube", [0, 0, 128], [48, 48, 2], { color: nearest("#999999") }));
      st.push(S("sphere", [-14, 6, 136], [16, 8, 5], { color: nearest("#e98b5a") }));
      st.push(S("sphere", [16, -10, 136], [16, 8, 5], { color: nearest("#e98b5a") }));
      return st;
    } },
    "Beach Ball": { cat: "fun", act: ["Play catch", "is playing catch", { fun: 30, social: 10, energy: -8 }, 4, 15], build(r) {
      const st = [], rad = 38 + r() * 18;
      st.push(S("sphere", [0, 0, rad], [rad, rad, rad], { color: nearest("#ffffff") }));
      const cols = ["#e8443a", "#2f8fe0", "#f2d22b", "#3cbf6c"];
      for (let i = 0; i < 3; i++) st.push(S("cube", [0, 0, rad], [4 + rad * 0.18, rad + 4, rad + 4], { m: "rep", color: nearest(cols[(i + Math.floor(r() * 4)) % 4]), rot: [0, 0, (i / 3) * Math.PI] }));
      st.push(S("sphere", [0, 0, rad * 2 - 2], [8, 8, 4], { m: "rep", color: nearest("#ffffff") }));
      return st;
    } },
    "Volleyball Net": { cat: "fun", act: ["Play volleyball", "is spiking a volleyball", { fun: 40, social: 15, energy: -15 }, 4, 25], build(r) {
      const st = [], span = 170 + r() * 50, post = jitterColor(r, "#e6e6e6", 15);
      st.push(S("joint", [span, 0, 140], [7, 7, 140], { color: post, mirror: true, offsX: span }));
      st.push(S("cube", [0, 0, 225], [span, 3, 40], { color: nearest("#fafafa") }));
      for (let i = 0; i < 6; i++) st.push(S("cube", [-span + ((i + 0.5) / 6) * 2 * span, 0, 225], [2, 5, 41], { m: "rep", color: nearest("#9a9a9a") }));
      st.push(S("cube", [0, 0, 266], [span, 4, 4], { color: nearest("#2f8fe0") }));
      st.push(S("sphere", [40, 60, 22], [22, 22, 22], { color: nearest("#ffe14a"), layer: 1 }));
      st.push(S("cube", [40, 60, 22], [4, 24, 24], { color: nearest("#2f8fe0"), m: "rep", layer: 1 }));
      return st;
    } },
    Slide: { cat: "fun", act: ["Go down the slide", "is sliding down", { fun: 35, energy: -10 }, 2, 10], build(r) {
      const st = [], h = 220 + r() * 60, c = jitterColor(r, pick(r, ["#ff7a2f", "#2fb4e0", "#e83f8c"]), 20), rail = nearest("#d9d9d9");
      st.push(S("joint", [-110, 28, h / 2], [5, 5, h / 2], { color: rail, layer: 0 }));
      st.push(S("joint", [-110, -28, h / 2], [5, 5, h / 2], { color: rail, layer: 0 }));
      for (let i = 1; i < 5; i++) st.push(S("joint", [-110, 0, (h * i) / 5], [4, 4, 28], { color: rail, rot: [1.57, 0, 0], layer: 0 }));
      st.push(S("cube", [-110, 0, h], [30, 34, 5], { color: c, layer: 1 }));
      st.push(S("cube", [20, 0, h / 2], [150, 30, 5], { color: c, rot: [0, 0.95, 0], round: 0.5, layer: 1 }));
      st.push(S("cube", [20, 30, h / 2 + 10], [150, 4, 12], { color: c, rot: [0, 0.95, 0], layer: 1, blend: 3 }));
      st.push(S("cube", [20, -30, h / 2 + 10], [150, 4, 12], { color: c, rot: [0, 0.95, 0], layer: 1, blend: 3 }));
      return st;
    } },
    Surfboard: { cat: "fun", act: ["Surf a wave", "is surfing", { fun: 40, energy: -15 }, 1, 20], build(r) {
      const st = [], c = jitterColor(r, pick(r, ["#f2b52b", "#2fb4e0", "#e8443a", "#9be38f"]), 25);
      st.push(S("sphere", [0, 0, 150], [42, 9, 155], { color: c, rot: [0.08, 0.12, 0] }));
      st.push(S("cube", [0, 0, 150], [7, 12, 150], { m: "rep", color: nearest("#ffffff"), rot: [0.08, 0.12, 0] }));
      st.push(S("cylinder", [0, 0, 8], [55, 40, 8], { color: nearest("#e9c88b"), round: 0.8, blend: 6 }));
      return st;
    } },
    Bonfire: { cat: "social", act: ["Gather at the fire", "is telling stories by the fire", { social: 35, fun: 10, energy: 5 }, 6, 30], build(r) {
      const st = [], log = jitterColor(r, "#7a4a24", 20), stone = nearest("#8f8f8f");
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; st.push(S("sphere", [Math.cos(a) * 62, Math.sin(a) * 62, 10], [16, 14, 12], { color: stone, blend: 2 })); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; st.push(S("joint", [Math.cos(a) * 18, Math.sin(a) * 18, 30], [9, 9, 34], { color: log, rot: dirRot(-Math.cos(a), -Math.sin(a), 0.9), layer: 1 })); }
      st.push(S("joint", [0, 0, 60], [26, 26, 26], { color: nearest("#ff7a1a"), cone: 0.95, layer: 2 }));
      st.push(S("joint", [0, 0, 62], [14, 14, 18], { color: nearest("#ffd84a"), cone: 0.95, layer: 2, blend: 6 }));
      return st;
    } },
    Bench: { cat: "social", act: ["Sit and chat", "is chatting on the bench", { social: 25, energy: 15 }, 3, 20], build(r) {
      const st = [], w = 120 + r() * 50, wood = jitterColor(r, "#a8743f", 30);
      st.push(S("cube", [0, 0, 62], [w, 32, 6], { color: wood, round: 0.4 }));
      st.push(S("cube", [w - 14, 0, 30], [6, 28, 30], { color: nearest("#555555"), mirror: true, offsX: w - 14 }));
      st.push(S("cube", [0, -30, 110], [w, 5, 22], { color: wood, round: 0.4, rot: [-0.18, 0, 0] }));
      st.push(S("joint", [w - 14, -30, 88], [5, 5, 26], { color: nearest("#555555"), mirror: true, offsX: w - 14 }));
      return st;
    } },
    "Picnic Table": { cat: "social", act: ["Have a picnic", "is having a picnic", { social: 30, hunger: 20 }, 4, 25], build(r) {
      const st = [], wood = jitterColor(r, "#b5824b", 25), cloth = jitterColor(r, pick(r, ["#e8443a", "#2f8fe0", "#3cbf6c"]), 15);
      st.push(S("cube", [0, 0, 120], [140, 60, 6], { color: wood, round: 0.3 }));
      st.push(S("cube", [0, 0, 127], [100, 50, 2], { color: cloth }));
      for (let i = 0; i < 4; i++) st.push(S("cube", [-80 + i * 53, 0, 127], [12, 50, 3], { m: "rep", color: nearest("#ffffff") }));
      st.push(S("cube", [0, 95, 66], [140, 18, 5], { color: wood, round: 0.3 }));
      st.push(S("cube", [0, -95, 66], [140, 18, 5], { color: wood, round: 0.3 }));
      st.push(S("cube", [110, 0, 62], [6, 100, 4], { color: wood, mirror: true }));
      st.push(S("joint", [110, 0, 60], [6, 6, 60], { color: wood, mirror: true }));
      return st;
    } },
    Hammock: { cat: "energy", act: ["Nap in the hammock", "is napping", { energy: 45, fun: 5 }, 1, 40], build(r) {
      const st = [], span = 150 + r() * 30, wood = jitterColor(r, "#8a5a2e", 20), cloth = jitterColor(r, pick(r, ["#e8443a", "#2fb4e0", "#f2b52b", "#9b59b6"]), 25);
      st.push(S("joint", [span, 0, 130], [9, 9, 130], { color: wood, mirror: true, offsX: span }));
      st.push(S("bezier", [0, 0, 175], [span, 45, 34], { color: cloth, rot: [-1.57, 0, 0], lw: 6 }));
      return st;
    } },
    "Beach Umbrella": { cat: "energy", act: ["Rest in the shade", "is resting in the shade", { energy: 30, fun: 5 }, 2, 30], build(r) {
      const st = [], c1 = jitterColor(r, pick(r, ["#e8443a", "#2f8fe0", "#f2b52b", "#3cbf6c", "#e83f8c"]), 20), tilt = (r() - 0.5) * 0.3;
      st.push(S("joint", [0, 0, 160], [6, 6, 160], { color: nearest("#eeeeee"), rot: [tilt, 0, 0] }));
      st.push(S("cylinder", [0, -Math.sin(tilt) * 300, 312], [150, 150, 26], { color: nearest("#ffffff"), cone: 0.92, rot: [tilt, 0, 0], blend: 4 }));
      for (let i = 0; i < 4; i++) st.push(S("cube", [0, -Math.sin(tilt) * 300, 312], [150, 22, 30], { m: "rep", color: c1, rot: [tilt, 0, i * 0.785], cone: 0.92 }));
      st.push(S("cube", [70, 50, 16], [55, 28, 6], { color: jitterColor(r, "#f2e3c4", 20), rot: [0, 0, 0.4], layer: 1 }));
      st.push(S("cube", [70, 50, 16], [55, 6, 7], { m: "rep", color: c1, rot: [0, 0, 0.4], layer: 1 }));
      return st;
    } },
    "Lounge Chair": { cat: "energy", act: ["Sunbathe", "is sunbathing", { energy: 30, fun: 10 }, 1, 30], build(r) {
      const st = [], c = jitterColor(r, pick(r, ["#2fb4e0", "#f2b52b", "#ffffff", "#e8443a"]), 20), frame = nearest("#dddddd");
      st.push(S("cube", [0, 20, 44], [34, 70, 4], { color: c, round: 0.4 }));
      st.push(S("cube", [0, -70, 80], [34, 40, 4], { color: c, round: 0.4, rot: [-0.9, 0, 0] }));
      st.push(S("joint", [30, 60, 22], [4, 4, 22], { color: frame, mirror: true }));
      st.push(S("joint", [30, -40, 22], [4, 4, 22], { color: frame, mirror: true }));
      return st;
    } },
    Sandcastle: { cat: "fun", act: ["Build sandcastles", "is building a sandcastle", { fun: 30, social: 10, energy: -10 }, 3, 25], build(r) {
      const st = [], sand = jitterColor(r, "#e3c27f", 18), flag = nearest(pick(r, ["#e8443a", "#2f8fe0", "#f2b52b"]));
      st.push(S("cube", [0, 0, 30], [80, 60, 30], { color: sand, round: 0.2 }));
      st.push(S("cylinder", [62, 44, 60], [24, 24, 60], { color: sand, mirror: true, blend: 4 }));
      st.push(S("cylinder", [62, -44, 60], [24, 24, 60], { color: sand, mirror: true, blend: 4 }));
      st.push(S("joint", [62, 44, 136], [26, 26, 20], { color: sand, cone: 0.9, mirror: true }));
      st.push(S("joint", [62, -44, 136], [26, 26, 20], { color: sand, cone: 0.9, mirror: true }));
      st.push(S("cylinder", [0, 0, 100], [30, 30, 40], { color: sand }));
      st.push(S("joint", [0, 0, 166], [32, 32, 26], { color: sand, cone: 0.9 }));
      st.push(S("joint", [0, 0, 215], [2, 2, 26], { color: nearest("#6b4a2a") }));
      st.push(S("cube", [12, 0, 232], [12, 2, 8], { color: flag }));
      st.push(S("cube", [0, -62, 22], [18, 10, 22], { m: "sub", color: sand, round: 0.9 }));
      return st;
    } },
    Lantern: { cat: "decor", act: null, build(r) {
      const st = [], metal = nearest("#3a3a3a");
      st.push(S("joint", [0, 0, 120], [5, 5, 120], { color: metal }));
      st.push(S("cube", [0, 0, 260], [22, 22, 28], { color: nearest("#ffe58a"), round: 0.4, blend: 3 }));
      st.push(S("joint", [0, 0, 296], [24, 24, 8], { color: metal, cone: 0.9 }));
      return st;
    } },
    "Flower Bush": { cat: "decor", act: null, build(r) {
      const st = [], g = jitterColor(r, "#00751f", 30), f = nearest(pick(r, ["#ff6fa8", "#ffd84a", "#ffffff", "#ff5a3c", "#b37cf2"]));
      for (let i = 0; i < 5; i++) st.push(S("sphere", [(r() - 0.5) * 70, (r() - 0.5) * 60, 30 + r() * 25], [36, 32, 30], { color: g, blend: 12 }));
      for (let i = 0; i < 8; i++) st.push(S("sphere", [(r() - 0.5) * 90, (r() - 0.5) * 80, 40 + r() * 35], [9, 9, 9], { color: f, m: "rep", blend: 1 }));
      return st;
    } },
    Rock: { cat: "decor", act: null, build(r) {
      const st = [], c = jitterColor(r, "#8e8e8e", 25);
      for (let i = 0; i < 3; i++) st.push(S("sphere", [(r() - 0.5) * 60, (r() - 0.5) * 50, 25 + r() * 15], [40 + r() * 20, 34 + r() * 16, 28 + r() * 14], { color: c, blend: 16 }));
      return st;
    } },
  };
  const NEED_TEMPLATES = { hunger: ["Fruit Stand", "Ice Cream Cart", "Grill", "Coconut Palm"], fun: ["Volleyball Net", "Slide", "Sandcastle"],
    social: ["Bonfire", "Bench", "Picnic Table"], energy: ["Hammock", "Beach Umbrella", "Lounge Chair"], decor: ["Flower Bush", "Rock", "Lantern", "Coconut Palm"] };
  const ADJ = ["Sunny", "Breezy", "Salty", "Lucky", "Tiny", "Grand", "Wobbly", "Cozy", "Golden", "Tidal", "Coral", "Lazy"];

  function design(templateName, seed, opts) {
    const r = rng(seed || Date.now());
    const T = TEMPLATES[templateName];
    const strokes = T.build(r);
    const name = opts && opts.plain ? templateName : (r() < 0.6 ? pick(r, ADJ) + " " : "") + templateName;
    let activity = null;
    if (T.act) {
      const [aname, verb, needs, capacity, minutes] = T.act;
      activity = { name: aname, verb, needs: { ...needs }, capacity, minutes };
    }
    return { name, template: templateName, category: T.cat, strokes, activity };
  }

  // ---------- canonical style statistics ----------
  let STATS = null;
  function styleStats() {
    if (STATS) return STATS;
    const R = TB.repo();
    const hist = { cube: 0, cylinder: 0, bezier: 0, joint: 0, sphere: 0 };
    let n = 0, mirrored = 0, blended = 0, rep = 0, sub = 0;
    const groundCounts = [], allCounts = [], colors = new Set();
    for (const part of Object.keys(R.models)) for (const mdl of R.models[part]) {
      if (!mdl) continue;
      const m = mdl.the || mdl.left || mdl.right;
      let c = 0;
      for (const L of m.layers) for (const sp of L.subparts) {
        if (sp.primitive === "attach") continue;
        c++; n++;
        if (hist[sp.primitive] != null) hist[sp.primitive]++;
        if (sp.mirrorX) mirrored++;
        if (sp.blend > 0) blended++;
        if (sp.mode === "rep") rep++;
        if (sp.mode === "sub") sub++;
        colors.add(sp.material);
      }
      allCounts.push(c);
      if (part === "ground") groundCounts.push(c);
    }
    const norm = (h) => { const L = Math.hypot(...Object.values(h)) || 1; const o = {}; for (const k in h) o[k] = h[k] / L; return o; };
    STATS = { strokes: n, models: allCounts.length, hist, histN: norm(hist), mirrorShare: mirrored / n, blendShare: blended / n,
      repShare: rep / n, subShare: sub / n, groundMin: Math.min(...groundCounts), groundMax: Math.max(...groundCounts),
      allMin: Math.min(...allCounts), allMax: Math.max(...allCounts), colorsUsed: colors.size, paletteSize: palette().length };
    return STATS;
  }

  // ---------- fidelity checks ----------
  // vox: voxelization result (count, positions, voxel, origin). tickleHeight in SDF units.
  function check(asset, vox) {
    const st = styleStats();
    const out = [];
    const add = (id, label, status, detail, w) => out.push({ id, label, status, detail, w });
    const strokes = asset.strokes || [];
    const bad = strokes.filter((s) => TB.ALLOWED.indexOf(s.p) < 0 || !Array.isArray(s.pos) || !Array.isArray(s.size) ||
      [...s.pos, ...s.size, ...(s.rot || [])].some((v) => !Number.isFinite(+v)));
    add("format", "Stroke format", bad.length ? "fail" : "pass",
      bad.length ? bad.length + " stroke(s) use something the on-chain engine cannot read" : "All " + strokes.length + " strokes use on-chain primitives", 3);
    const n = strokes.length;
    add("budget", "Stroke budget", n < 3 || n > 160 ? "fail" : n < st.groundMin || n > 60 ? "warn" : "pass",
      n + " strokes (on-chain ground items use " + st.groundMin + "\u2013" + st.groundMax + ")", 1);
    const badCol = strokes.filter((s) => s._snapped || !(Number.isInteger(+s.color) && +s.color >= 0 && +s.color < st.paletteSize)).length;
    add("palette", "On-chain palette", badCol ? "warn" : "pass",
      badCol ? badCol + " colour(s) were snapped to the nearest on-chain colour" : "Every colour is one of the " + st.paletteSize + " on-chain colours", 2);
    const h = { cube: 0, cylinder: 0, bezier: 0, joint: 0, sphere: 0 };
    strokes.forEach((s) => { if (h[s.p] != null) h[s.p]++; });
    const L = Math.hypot(...Object.values(h)) || 1;
    let cos = 0;
    for (const k in h) cos += (h[k] / L) * st.histN[k];
    add("mix", "Primitive mix", cos >= 0.75 ? "pass" : cos >= 0.55 ? "warn" : "fail",
      "Similarity to the collection's shape mix: " + Math.round(cos * 100) + "%", 2);
    const blendShare = n ? strokes.filter((s) => +s.blend > 0).length / n : 0;
    add("blend", "Soft blending", blendShare >= st.blendShare * 0.25 || n < 6 ? "pass" : "warn",
      Math.round(blendShare * 100) + "% of strokes blend softly (collection: " + Math.round(st.blendShare * 100) + "%)", 1);
    // layer quirk: single-stroke layers are skipped by the on-chain shader
    const byLayer = {};
    strokes.forEach((s) => { const k = Number.isFinite(+s.layer) ? +s.layer : 0; byLayer[k] = (byLayer[k] || 0) + 1; });
    const lonely = Object.values(byLayer).filter((c) => c === 1).length;
    add("layers", "Engine quirks", lonely ? "warn" : "pass",
      lonely ? lonely + " layer(s) hold a single stroke; the on-chain shader skips those" : "No single-stroke layers (the shader would skip them)", 1);
    if (vox) {
      const cnt = vox.count;
      add("renders", "Renders", cnt >= 40 ? "pass" : "fail", cnt + " voxels at " + vox.voxel + " units", 3);
      if (cnt) {
        let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        const key = (x, y, z) => (x + 512) * 1048576 + (y + 512) * 1024 + (z + 512);
        const set = new Set();
        for (let i = 0; i < cnt; i++) {
          const x = vox.positions[3 * i], y = vox.positions[3 * i + 1], z = vox.positions[3 * i + 2];
          mn = [Math.min(mn[0], x), Math.min(mn[1], y), Math.min(mn[2], z)];
          mx = [Math.max(mx[0], x), Math.max(mx[1], y), Math.max(mx[2], z)];
          set.add(key(x, y, z));
        }
        const height = (mx[2] - mn[2] + 1) * vox.voxel, width = Math.max(mx[0] - mn[0] + 1, mx[1] - mn[1] + 1) * vox.voxel;
        const rel = height / 480;
        add("scale", "Scale next to a Tickle", rel >= 0.06 && rel <= 2.4 && width <= 1400 ? "pass" : rel < 0.03 || rel > 4 ? "fail" : "warn",
          Math.round(rel * 100) + "% of a Tickle's height, " + Math.round(width) + " units wide", 2);
        const floorZ = vox.origin[2] + mn[2] * vox.voxel;
        add("grounded", "Sits on the ground", Math.abs(floorZ) < 30 ? "pass" : "warn",
          Math.abs(floorZ) < 30 ? "Base touches z = 0" : "Base floats " + Math.round(floorZ) + " units off the ground", 1);
        // largest connected piece
        const seen = new Set();
        let best = 0;
        for (const k0 of set) {
          if (seen.has(k0)) continue;
          let size = 0;
          const stack = [k0];
          seen.add(k0);
          while (stack.length) {
            const k = stack.pop();
            size++;
            const z = (k % 1024) - 512, y = (Math.floor(k / 1024) % 1024) - 512, x = Math.floor(k / 1048576) - 512;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
              if (!dx && !dy && !dz) continue;
              const kk = key(x + dx, y + dy, z + dz);
              if (set.has(kk) && !seen.has(kk)) { seen.add(kk); stack.push(kk); }
            }
          }
          best = Math.max(best, size);
        }
        const share = best / cnt;
        add("pieces", "One solid piece", share >= 0.9 ? "pass" : share >= 0.7 ? "warn" : "fail",
          Math.round(share * 100) + "% of voxels are connected", 2);
      }
    }
    let tot = 0, got = 0;
    for (const c of out) { tot += c.w; got += c.w * (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0); }
    const fails = out.filter((c) => c.status === "fail").length;
    return { checks: out, score: Math.round((got / tot) * 100), fails };
  }

  // Make an untrusted (AI) model safe for the engine: clamp, snap colours, cap size.
  function sanitize(raw) {
    const st = styleStats();
    const strokes = (Array.isArray(raw) ? raw : []).slice(0, 160).map((s) => {
      const o = { ...s };
      if (typeof o.color === "string") o.color = nearest(o.color), o._snapped = true;
      if (!(Number.isInteger(+o.color) && +o.color >= 0 && +o.color < st.paletteSize)) { o.color = nearest([200, 200, 200]); o._snapped = true; }
      const clampv = (a, lim, d) => (Array.isArray(a) && a.length === 3 ? a.map((v) => Math.max(-lim, Math.min(lim, Number.isFinite(+v) ? +v : d))) : [d, d, d]);
      o.pos = clampv(o.pos, 1200, 0);
      o.rot = clampv(o.rot, 6.3, 0);
      o.size = clampv(o.size, 700, 10).map((v) => Math.max(1, Math.abs(v)));
      return o;
    });
    return strokes;
  }

  // ---------- chit-chat ----------
  function chatLine(r, a, b, ctx) {
    const lines = [];
    const tb = b.traits, ta = a.traits;
    if (tb.Holding && tb.Holding !== "None") lines.push("Nice " + tb.Holding.toLowerCase() + "!", "Can I borrow your " + tb.Holding.toLowerCase() + "?");
    if (tb.Head && tb.Head !== "None") lines.push("Love the " + tb.Head.toLowerCase() + ".");
    if (tb.Location) lines.push("How's life at " + tb.Location + "?", "Your " + tb.Location + " looks cozy.");
    if (ta.Ground && ta.Ground !== "None") lines.push("Come see my " + ta.Ground.toLowerCase() + " later.");
    if (ctx.latest) lines.push("Did you try the new " + ctx.latest + "?", "The " + ctx.latest + " is the best thing on the island.");
    if (a.needs.hunger < 35) lines.push("I'm starving.", "Anyone got snacks?");
    if (a.needs.energy < 30) lines.push("I need a nap...");
    if (a.needs.fun < 35) lines.push("I'm so bored.", "Let's do something fun!");
    if (ctx.night) lines.push("The stars are out.", "Sleepy time soon.");
    lines.push("Tickle tickle!", "Sun's out!", "Waves are big today.", "Beach day, every day.", "Ha! Good one.", "Same.", "Totally.", "No way!");
    return lines[Math.floor(r() * lines.length)];
  }

  // ---------- trees for the landscape (stroke format, on-chain palette) ----------
  // The collection only has one tree (the palm on The Palm floor); these fill the rest of the
  // land in the same style. Each kind has two variants so forests don't look stamped.
  const TREES = {
    tree_leafy: (v) => {
      const r = rng(4001 + v), st = [], bark = nearest("#7a4a24"), g1 = nearest(v ? "#00751f" : "#006308"), g2 = nearest("#00b126");
      const lean = (r() - 0.5) * 0.12;
      st.push(S("joint", [0, 0, 190], [30, 30, 190], { color: bark, rot: [0, lean, 0], cone: 0.25 }));
      st.push(S("joint", [55, 0, 330], [14, 14, 70], { color: bark, rot: dirRot(0.7, 0.1, 1), blend: 8 }));
      st.push(S("joint", [-50, 20, 350], [13, 13, 60], { color: bark, rot: dirRot(-0.7, 0.3, 1), blend: 8 }));
      const cx = Math.sin(lean) * 380;
      const blobs = [[0, 0, 470, 150], [95, 20, 420, 115], [-95, -15, 425, 120], [20, 85, 440, 110], [-15, -90, 445, 110], [10, 5, 560, 105]];
      for (const [x, y, z, rr] of blobs) st.push(S("sphere", [cx + x * (0.9 + r() * 0.2), y * (0.9 + r() * 0.2), z], [rr, rr * (0.9 + r() * 0.2), rr * 0.82], { color: g1, blend: 26, layer: 1 }));
      for (let k = 0; k < 7; k++) { const a = r() * 6.28, d = 60 + r() * 90; st.push(S("sphere", [cx + Math.cos(a) * d, Math.sin(a) * d, 400 + r() * 170], [42, 42, 36], { color: g2, m: "rep", layer: 1 })); }
      return st;
    },
    tree_pine: (v) => {
      const r = rng(5003 + v), st = [], bark = nearest("#6b4a2a"), g = nearest(v ? "#00731f" : "#005a10");
      const sc = 0.9 + r() * 0.25;
      st.push(S("joint", [0, 0, 130 * sc], [22, 22, 130 * sc], { color: bark }));
      st.push(S("sphere", [0, 0, 10], [34, 34, 16], { color: bark, blend: 10 }));
      const tiers = [[0, 270, 175, 120], [0, 410, 140, 105], [0, 535, 100, 90], [0, 640, 55, 55]];
      for (const [, z, rr, hl] of tiers) st.push(S("joint", [0, 0, z * sc], [rr * sc, rr * sc, hl * sc], { color: g, cone: 0.95, blend: 6, layer: 1 }));
      st.push(S("joint", [0, 0, 700 * sc], [8, 8, 22], { color: g, layer: 1 }));
      return st;
    },
    bush: (v) => {
      const r = rng(6007 + v), st = [], g = nearest(v ? "#00751f" : "#006308"), g2 = nearest(v ? "#ff8fc0" : "#ffd23f");
      for (let k = 0; k < 5; k++) st.push(S("sphere", [(r() - 0.5) * 90, (r() - 0.5) * 80, 45 + r() * 30], [55 + r() * 20, 50 + r() * 18, 45 + r() * 15], { color: g, blend: 18 }));
      for (let k = 0; k < 4; k++) st.push(S("sphere", [(r() - 0.5) * 100, (r() - 0.5) * 90, 60 + r() * 35], [22, 22, 20], { color: g2, m: "rep" }));
      return st;
    },
  };

  Object.assign(TB, { rng, nearest, rgbHex, hexToRgb, dirRot, TEMPLATES, NEED_TEMPLATES, TREES, design, styleStats, check, sanitize, chatLine });
})(typeof self !== "undefined" ? self : this);
