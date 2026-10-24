/* The world kit: models designed for the map in the collection's own stroke format and palette
 * (trees, village buildings, crops, animals and dragons). Every kind can be reviewed, exported,
 * and opened in the original on-chain viewer. Coordinates: SDF units, z up, ground at z = 0,
 * the front faces +y, a Tickle is about 480 tall. */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});
  const R2 = (v) => Math.round(v * 100) / 100;
  // nearest on-chain colour, skipping the one entry the packed format cannot write
  function C(hex) {
    const i = TB.nearest(hex);
    if (i !== TB.repo().hardcoded.length) return i;
    const rgb = TB.hexToRgb(hex), pal = TB.paletteList();
    let best = 0, bd = Infinity;
    for (const p of pal) { if (p.i === i) continue; const d = (p.rgb[0] - rgb[0]) ** 2 + (p.rgb[1] - rgb[1]) ** 2 + (p.rgb[2] - rgb[2]) ** 2; if (d < bd) { bd = d; best = p.i; } }
    return best;
  }
  function S(p, pos, size, o) {
    o = o || {};
    const s = { p, m: o.m || "add", pos: pos.map(R2), rot: (o.rot || [0, 0, 0]).map(R2), size: size.map(R2), color: o.color || 0, layer: o.layer || 0 };
    for (const k of ["blend", "round", "bevel", "cone", "hole", "lw"]) if (o[k]) s[k] = R2(o[k]);
    if (o.mirror) { s.mirror = true; s.offsX = R2(o.offsX != null ? o.offsX : pos[0]); }
    return s;
  }
  const dir = (dx, dy, dz) => TB.dirRot(dx, dy, dz);

  // ---------- clans: one per species, each with its own colour for roofs and banners ----------
  const CLANS = (TB.CLANS = [
    { species: "Sabre", color: "#ff7a2f" }, { species: "Tessy", color: "#2f8fe0" }, { species: "Umka", color: "#39c6c0" },
    { species: "Urci", color: "#b0302b" }, { species: "String Cheese", color: "#ffd23f" }, { species: "Roary", color: "#8a4fd8" },
    { species: "Bellow", color: "#e8443a" }, { species: "Koda", color: "#3cbf6c" }, { species: "Snort", color: "#ff8fc0" },
  ]);

  // ---------- village buildings ----------
  function cottage(clan) {
    const st = [], wall = C("#fff4d6"), wood = C("#7a4a24"), stone = C("#9a9a9a"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color);
    st.push(S("cube", [0, 0, 18], [320, 280, 18], { color: stone, round: 0.3 }));
    st.push(S("cube", [0, 0, 230], [300, 260, 200], { color: wall, round: 0.12, blend: 6 }));
    st.push(S("cube", [0, 262, 150], [78, 12, 128], { m: "rep", color: wood }));
    st.push(S("cube", [0, 266, 150], [68, 8, 120], { color: wood, round: 0.3 }));
    st.push(S("sphere", [42, 276, 150], [11, 11, 11], { color: C("#ffd23f") }));
    st.push(S("cube", [180, 262, 290], [56, 12, 56], { m: "rep", color: glass, mirror: true, offsX: 180 }));
    st.push(S("cube", [302, 0, 290], [12, 72, 56], { m: "rep", color: glass, mirror: true, offsX: 302 }));
    st.push(S("cube", [205, -130, 610], [36, 36, 120], { color: stone }));
    st.push(S("cube", [0, 0, 545], [345, 305, 135], { color: roof, cone: 1, layer: 1 }));
    st.push(S("cube", [0, 0, 414], [352, 312, 10], { color: wood, layer: 1, blend: 4 }));
    return st;
  }
  function roundHut(clan) {
    const st = [], wall = C("#f3e2c0"), wood = C("#7a4a24"), stone = C("#9a9a9a"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color);
    st.push(S("cylinder", [0, 0, 18], [300, 300, 18], { color: stone }));
    st.push(S("cylinder", [0, 0, 220], [262, 262, 190], { color: wall, blend: 6 }));
    st.push(S("cube", [0, 262, 150], [74, 30, 128], { m: "rep", color: wood }));
    st.push(S("cube", [0, 262, 150], [64, 14, 118], { color: wood, round: 0.3 }));
    st.push(S("cube", [258, 0, 290], [30, 62, 52], { m: "rep", color: glass, mirror: true, offsX: 258 }));
    st.push(S("cylinder", [0, 0, 530], [255, 255, 150], { color: roof, cone: 0.6, layer: 1 }));
    st.push(S("cylinder", [0, 0, 386], [338, 338, 10], { color: wood, layer: 1, blend: 4 }));
    st.push(S("sphere", [0, 0, 680], [34, 34, 30], { color: wood, layer: 1, blend: 6 }));
    return st;
  }
  function townHall(clan) {
    const st = [], wall = C("#fff4d6"), wood = C("#7a4a24"), stone = C("#9a9a9a"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color), white = C("#f4f4f4");
    st.push(S("cube", [0, 0, 26], [470, 360, 26], { color: stone, round: 0.2 }));
    st.push(S("cube", [0, -40, 270], [420, 280, 220], { color: wall, round: 0.08, blend: 6 }));
    st.push(S("cube", [0, 242, 180], [96, 14, 128], { m: "rep", color: wood }));
    st.push(S("cube", [250, 242, 300], [52, 14, 72], { m: "rep", color: glass, mirror: true, offsX: 250 }));
    st.push(S("cube", [422, -40, 300], [14, 90, 72], { m: "rep", color: glass, mirror: true, offsX: 422 }));
    st.push(S("joint", [130, 300, 230], [24, 24, 180], { color: white, mirror: true, offsX: 130 }));
    st.push(S("joint", [330, 300, 230], [24, 24, 180], { color: white, mirror: true, offsX: 330 }));
    st.push(S("cube", [0, 300, 430], [400, 64, 22], { color: white, round: 0.3 }));
    st.push(S("cube", [0, -40, 612], [462, 322, 140], { color: roof, cone: 1, layer: 1 }));
    st.push(S("cube", [0, -40, 486], [470, 330, 12], { color: wood, layer: 1, blend: 4 }));
    st.push(S("cube", [0, 300, 470], [400, 64, 20], { color: roof, cone: 1, layer: 1 }));
    st.push(S("cube", [0, -40, 820], [92, 92, 120], { color: wall, layer: 2, round: 0.1 }));
    st.push(S("cube", [0, 52, 840], [44, 6, 44], { m: "rep", color: C("#ffd23f"), layer: 2 }));
    st.push(S("cube", [0, -40, 990], [112, 112, 60], { color: roof, cone: 1, layer: 3 }));
    st.push(S("joint", [0, -40, 1090], [6, 6, 70], { color: wood, layer: 3 }));
    st.push(S("cube", [56, -40, 1130], [52, 4, 30], { color: roof, layer: 3 }));
    return st;
  }
  function granary() {
    const st = [], plank = C("#c79a62"), wood = C("#7a4a24"), stone = C("#9a9a9a"), straw = C("#e8c35a"), sack = C("#d8b98a");
    st.push(S("cylinder", [0, 0, 20], [200, 200, 20], { color: stone }));
    st.push(S("cylinder", [0, 0, 220], [170, 170, 190], { color: plank, blend: 4 }));
    st.push(S("cylinder", [0, 0, 120], [176, 176, 10], { m: "rep", color: wood }));
    st.push(S("cylinder", [0, 0, 300], [176, 176, 10], { m: "rep", color: wood }));
    st.push(S("cube", [0, 168, 130], [60, 16, 100], { m: "rep", color: wood }));
    st.push(S("sphere", [205, 110, 60], [58, 50, 60], { color: sack, blend: 8 }));
    st.push(S("sphere", [150, 190, 50], [50, 44, 50], { color: sack, blend: 8 }));
    st.push(S("cylinder", [0, 0, 500], [145, 145, 120], { color: straw, cone: 1, layer: 1 }));
    st.push(S("cylinder", [0, 0, 412], [222, 222, 8], { color: wood, layer: 1, blend: 3 }));
    return st;
  }

  // ---------- farm pieces ----------
  // one stretch of fence, two cells long (320 units) along x
  function fence() {
    const st = [], wood = C("#7a4a24"), plank = C("#c79a62");
    st.push(S("joint", [150, 0, 75], [13, 13, 75], { color: wood, mirror: true, offsX: 150 }));
    st.push(S("cube", [0, 0, 110], [166, 7, 10], { color: plank, round: 0.3 }));
    st.push(S("cube", [0, 0, 55], [166, 7, 10], { color: plank, round: 0.3 }));
    return st;
  }
  // an open-fronted pig shed
  function sty() {
    const st = [], wood = C("#7a4a24"), plank = C("#c79a62"), straw = C("#e8c35a"), roof = C("#b0302b");
    st.push(S("cube", [0, -110, 120], [230, 18, 120], { color: plank, round: 0.1 }));
    st.push(S("cube", [215, -10, 95], [16, 110, 95], { color: plank, mirror: true, offsX: 215, round: 0.1 }));
    st.push(S("cube", [0, -20, 8], [200, 90, 8], { color: straw }));
    st.push(S("joint", [215, 100, 110], [12, 12, 110], { color: wood, mirror: true, offsX: 215 }));
    st.push(S("cube", [0, -10, 245], [255, 150, 14], { color: roof, rot: [0.22, 0, 0], round: 0.2, layer: 1 }));
    st.push(S("cube", [0, 135, 222], [255, 6, 10], { color: wood, rot: [0.22, 0, 0], layer: 1, blend: 3 }));
    return st;
  }
  function trough() {
    const st = [], wood = C("#7a4a24"), feed = C("#e8c35a");
    st.push(S("cube", [0, 0, 38], [120, 44, 38], { color: wood, round: 0.2 }));
    st.push(S("cube", [0, 0, 62], [104, 30, 26], { m: "sub", color: wood }));
    st.push(S("cube", [0, 0, 50], [104, 30, 6], { color: feed, layer: 1 }));
    st.push(S("sphere", [-60, 0, 58], [26, 20, 14], { color: feed, layer: 1, blend: 6 }));
    return st;
  }
  // a hen house on legs with a ramp
  function coop() {
    const st = [], wood = C("#7a4a24"), plank = C("#f3e2c0"), roof = C("#e8443a"), dark = C("#3a2a1a");
    st.push(S("joint", [100, 70, 55], [10, 10, 55], { color: wood, mirror: true, offsX: 100 }));
    st.push(S("joint", [100, -70, 55], [10, 10, 55], { color: wood, mirror: true, offsX: 100 }));
    st.push(S("cube", [0, 0, 175], [130, 100, 66], { color: plank, round: 0.12, blend: 4 }));
    st.push(S("cube", [0, 100, 160], [32, 8, 36], { m: "rep", color: dark }));
    st.push(S("cube", [0, 175, 70], [30, 90, 5], { color: wood, rot: [0.75, 0, 0] }));
    st.push(S("cube", [0, 0, 285], [150, 120, 52], { color: roof, cone: 1, layer: 1 }));
    st.push(S("cube", [0, 0, 236], [154, 124, 6], { color: wood, layer: 1, blend: 3 }));
    return st;
  }

  // ---------- crops ----------
  function wheat() {
    const st = [], stalk = C("#c9a227"), head = C("#e8c35a");
    const pts = [[0, 0], [38, 22], [-36, 18], [20, -36], [-24, -30], [44, -12], [-46, -8]];
    pts.forEach(([x, y], i) => {
      const h = 70 + (i % 3) * 10;
      st.push(S("joint", [x, y, h], [5, 5, h], { color: stalk }));
      st.push(S("sphere", [x, y, h * 2 + 8], [11, 11, 26], { color: head, blend: 4 }));
    });
    return st;
  }
  function cabbage() {
    const st = [], g1 = C("#3cbf6c"), g2 = C("#9be38f");
    st.push(S("sphere", [0, 0, 45], [58, 58, 45], { color: g2 }));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.28; st.push(S("sphere", [Math.cos(a) * 42, Math.sin(a) * 42, 34], [40, 22, 34], { color: g1, rot: [0, 0, a + 1.57], blend: 10 })); }
    return st;
  }

  // ---------- animals (head towards +y) ----------
  // farm animals and game; none of them is one of the nine Tickle species
  function chicken() {
    const st = [], white = C("#f4f4f4"), red = C("#e8443a"), beak = C("#ffb020"), dark = C("#222222");
    st.push(S("sphere", [0, -10, 92], [44, 58, 46], { color: white }));
    st.push(S("sphere", [0, -62, 126], [20, 24, 36], { color: white, rot: [-0.5, 0, 0], blend: 10 }));
    st.push(S("sphere", [0, 42, 150], [27, 29, 30], { color: white, blend: 12 }));
    st.push(S("sphere", [40, -6, 98], [12, 40, 26], { color: white, mirror: true, offsX: 40, blend: 6 }));
    st.push(S("joint", [16, 0, 26], [5, 5, 26], { color: beak, mirror: true, offsX: 16, layer: 1 }));
    st.push(S("cube", [16, 10, 3], [12, 18, 3], { color: beak, mirror: true, offsX: 16, layer: 1 }));
    st.push(S("sphere", [0, 38, 186], [6, 20, 15], { color: red, layer: 2 }));
    st.push(S("sphere", [0, 62, 126], [7, 6, 12], { color: red, layer: 2 }));
    st.push(S("cube", [0, 76, 150], [8, 12, 6], { color: beak, cone: 0.8, rot: [-1.57, 0, 0], layer: 2 }));
    st.push(S("sphere", [17, 62, 160], [5, 5, 5], { color: dark, mirror: true, offsX: 17, layer: 2 }));
    return st;
  }
  function pig() {
    const st = [], pink = C("#ffa8b8"), snout = C("#f07a95"), dark = C("#222222");
    st.push(S("sphere", [0, 0, 150], [88, 138, 86], { color: pink }));
    st.push(S("sphere", [0, 138, 168], [62, 60, 58], { color: pink, blend: 16 }));
    st.push(S("cylinder", [0, 198, 152], [30, 30, 16], { color: snout, rot: [1.57, 0, 0], blend: 6 }));
    st.push(S("sphere", [10, 214, 152], [5, 4, 7], { m: "rep", color: dark, mirror: true, offsX: 10 }));
    st.push(S("joint", [48, 80, 42], [16, 16, 42], { color: pink, mirror: true, offsX: 48, blend: 8 }));
    st.push(S("joint", [50, -84, 42], [17, 17, 42], { color: pink, mirror: true, offsX: 50, blend: 8 }));
    st.push(S("joint", [0, -142, 176], [5, 5, 14], { color: pink, rot: dir(0, -0.6, 1), blend: 4 }));
    st.push(S("sphere", [40, 134, 222], [24, 9, 26], { color: pink, mirror: true, offsX: 40, rot: [0.6, 0, 0.3], layer: 1 }));
    st.push(S("sphere", [24, 186, 186], [7, 7, 7], { color: dark, mirror: true, offsX: 24, layer: 1 }));
    return st;
  }
  function deer() {
    const st = [], coat = C("#b5833d"), cream = C("#f3e2c0"), dark = C("#3a2a1a"), antler = C("#e6d3a3");
    st.push(S("sphere", [0, 0, 280], [72, 150, 74], { color: coat }));
    st.push(S("sphere", [0, 0, 236], [56, 120, 36], { m: "rep", color: cream }));
    st.push(S("joint", [40, 92, 125], [13, 13, 125], { color: coat, mirror: true, offsX: 40, blend: 10 }));
    st.push(S("joint", [42, -96, 125], [14, 14, 125], { color: coat, mirror: true, offsX: 42, blend: 10 }));
    st.push(S("joint", [40, 92, 12], [14, 14, 12], { m: "rep", color: dark, mirror: true, offsX: 40 }));
    st.push(S("joint", [42, -96, 12], [15, 15, 12], { m: "rep", color: dark, mirror: true, offsX: 42 }));
    st.push(S("joint", [0, 150, 370], [30, 30, 80], { color: coat, rot: dir(0, 0.6, 1), blend: 18 }));
    st.push(S("sphere", [0, 200, 450], [38, 58, 40], { color: coat, blend: 12 }));
    st.push(S("sphere", [0, 248, 432], [22, 26, 22], { color: dark, blend: 8 }));
    st.push(S("sphere", [0, -150, 310], [16, 14, 26], { color: cream, blend: 6 }));
    st.push(S("sphere", [42, 182, 482], [24, 8, 13], { color: coat, mirror: true, offsX: 42, rot: [0, 0, 0.4], layer: 1 }));
    st.push(S("sphere", [26, 222, 462], [7, 7, 7], { color: dark, mirror: true, offsX: 26, layer: 1 }));
    st.push(S("joint", [26, 190, 540], [7, 7, 48], { color: antler, mirror: true, offsX: 26, rot: dir(0.45, -0.1, 1), layer: 2 }));
    st.push(S("joint", [48, 200, 560], [5, 5, 26], { color: antler, mirror: true, offsX: 48, rot: dir(0.2, 0.9, 0.6), layer: 2, blend: 4 }));
    st.push(S("joint", [62, 180, 600], [5, 5, 22], { color: antler, mirror: true, offsX: 62, rot: dir(0.7, -0.2, 0.8), layer: 2, blend: 4 }));
    return st;
  }
  function boar() {
    const st = [], hide = C("#5a3a28"), dark = C("#2e1f16"), snout = C("#c48a6a"), tusk = C("#fff4d6");
    st.push(S("sphere", [0, 0, 150], [82, 140, 90], { color: hide }));
    st.push(S("sphere", [0, -10, 228], [24, 112, 28], { color: dark, blend: 16 }));
    st.push(S("sphere", [0, 150, 145], [56, 72, 56], { color: hide, blend: 14 }));
    st.push(S("cylinder", [0, 218, 128], [27, 27, 20], { color: snout, rot: [1.57, 0, 0], blend: 6 }));
    st.push(S("joint", [46, 82, 46], [15, 15, 46], { color: dark, mirror: true, offsX: 46, blend: 8 }));
    st.push(S("joint", [48, -92, 46], [16, 16, 46], { color: dark, mirror: true, offsX: 48, blend: 8 }));
    st.push(S("joint", [0, -146, 170], [5, 5, 26], { color: dark, rot: dir(0, -1, 0.4) }));
    st.push(S("joint", [24, 222, 110], [5, 5, 20], { color: tusk, mirror: true, offsX: 24, rot: dir(0.2, 0.5, 1), layer: 1 }));
    st.push(S("sphere", [40, 132, 196], [20, 10, 26], { color: dark, mirror: true, offsX: 40, rot: [0.3, 0, 0], layer: 1 }));
    st.push(S("sphere", [24, 196, 168], [7, 7, 7], { color: C("#111111"), mirror: true, offsX: 24, layer: 1 }));
    return st;
  }
  function sheep() {
    const st = [], wool = C("#f4f4f4"), face = C("#333333");
    st.push(S("sphere", [0, 0, 190], [92, 122, 82], { color: wool }));
    st.push(S("sphere", [52, 40, 205], [52, 56, 52], { color: wool, mirror: true, offsX: 52, blend: 24 }));
    st.push(S("sphere", [50, -60, 200], [50, 56, 52], { color: wool, mirror: true, offsX: 50, blend: 24 }));
    st.push(S("sphere", [0, 20, 262], [58, 70, 40], { color: wool, blend: 24 }));
    st.push(S("joint", [42, 66, 58], [11, 11, 58], { color: face, mirror: true, offsX: 42 }));
    st.push(S("joint", [42, -70, 58], [11, 11, 58], { color: face, mirror: true, offsX: 42 }));
    st.push(S("sphere", [0, 140, 200], [34, 46, 40], { color: face, layer: 1 }));
    st.push(S("sphere", [0, 118, 238], [40, 30, 26], { color: wool, layer: 1, blend: 12 }));
    st.push(S("sphere", [42, 138, 214], [22, 8, 11], { color: face, mirror: true, offsX: 42, rot: [0, 0, -0.3], layer: 1 }));
    return st;
  }

  // ---------- creatures: invented fantasy animals Tickles can tame (none is a Tickle species) ----------
  function griffin() {
    const st = [], white = C("#f4f4f4"), tan = C("#c9a27a"), wing = C("#8a5a3a"), beak = C("#ffb020"), dark = C("#222222");
    st.push(S("sphere", [0, -20, 128], [70, 112, 62], { color: tan }));
    st.push(S("sphere", [0, 70, 158], [62, 60, 66], { color: white, blend: 24 }));
    st.push(S("joint", [40, 70, 46], [14, 14, 46], { color: tan, mirror: true, offsX: 40, blend: 8 }));
    st.push(S("joint", [42, -95, 46], [16, 16, 46], { color: tan, mirror: true, offsX: 42, blend: 8 }));
    st.push(S("sphere", [40, 80, 8], [17, 24, 9], { m: "rep", color: beak, mirror: true, offsX: 40 }));
    st.push(S("joint", [0, -150, 190], [9, 9, 55], { color: tan, rot: dir(0, -1, 0.7) }));
    st.push(S("sphere", [0, -188, 232], [18, 18, 22], { color: wing, blend: 6 }));
    st.push(S("sphere", [0, 112, 262], [44, 48, 44], { color: white, blend: 16, layer: 1 }));
    st.push(S("joint", [0, 162, 252], [14, 14, 22], { color: beak, cone: 0.9, rot: dir(0, 1, -0.4), layer: 1 }));
    st.push(S("sphere", [22, 142, 276], [7, 7, 7], { color: dark, mirror: true, offsX: 22, layer: 1 }));
    st.push(S("sphere", [62, -10, 230], [16, 90, 50], { color: wing, mirror: true, offsX: 62, rot: [0.5, 0.3, 0], layer: 2 }));
    st.push(S("sphere", [62, -60, 275], [12, 60, 30], { color: white, mirror: true, offsX: 62, rot: [0.7, 0.3, 0], layer: 2, blend: 8 }));
    return st;
  }
  function cinderling() {
    const st = [], red = C("#e8443a"), belly = C("#ffb020"), flame = C("#ffd23f"), dark = C("#222222"), white = C("#ffffff");
    st.push(S("sphere", [0, 0, 62], [46, 108, 40], { color: red }));
    st.push(S("sphere", [0, 0, 40], [36, 92, 20], { m: "rep", color: belly }));
    st.push(S("sphere", [0, 102, 86], [44, 46, 38], { color: red, blend: 16 }));
    st.push(S("joint", [36, 50, 20], [11, 11, 22], { color: red, mirror: true, offsX: 36, blend: 6 }));
    st.push(S("joint", [36, -55, 20], [11, 11, 22], { color: red, mirror: true, offsX: 36, blend: 6 }));
    st.push(S("joint", [0, -150, 70], [22, 22, 60], { color: red, cone: 0.7, rot: dir(0, -1, 0.35), blend: 10 }));
    st.push(S("sphere", [0, -205, 110], [24, 24, 34], { color: flame, layer: 1 }));
    st.push(S("sphere", [0, -205, 96], [16, 16, 22], { color: C("#ff7a2f"), layer: 1, blend: 6 }));
    st.push(S("sphere", [20, 132, 102], [11, 9, 12], { color: white, mirror: true, offsX: 20, layer: 2 }));
    st.push(S("sphere", [21, 140, 103], [6, 5, 7], { color: dark, mirror: true, offsX: 21, layer: 2 }));
    for (let k = 0; k < 3; k++) st.push(S("joint", [0, 90 - k * 55, 128 - k * 22], [13 - k * 2, 13 - k * 2, 22], { color: flame, cone: 1, layer: 3 }));
    return st;
  }
  function bubblefin() {
    const st = [], blue = C("#2f8fe0"), pale = C("#8fd3f4"), fin = C("#39c6c0"), dark = C("#222222"), white = C("#ffffff");
    st.push(S("sphere", [0, 0, 82], [72, 72, 66], { color: blue }));
    st.push(S("sphere", [0, 30, 66], [56, 50, 44], { m: "rep", color: pale }));
    st.push(S("sphere", [26, 16, 14], [16, 22, 12], { color: pale, mirror: true, offsX: 26, blend: 8 }));
    st.push(S("sphere", [70, 0, 120], [10, 30, 42], { color: fin, mirror: true, offsX: 70, rot: [0, -0.5, 0], layer: 1 }));
    st.push(S("sphere", [0, -82, 100], [10, 34, 44], { color: fin, rot: [0.5, 0, 0], layer: 1, blend: 6 }));
    st.push(S("sphere", [0, -10, 158], [8, 30, 30], { color: fin, layer: 1, blend: 6 }));
    st.push(S("sphere", [26, 58, 104], [15, 10, 16], { color: white, mirror: true, offsX: 26, layer: 2 }));
    st.push(S("sphere", [27, 66, 104], [8, 5, 9], { color: dark, mirror: true, offsX: 27, layer: 2 }));
    st.push(S("sphere", [30, 40, 196], [12, 12, 12], { color: white, layer: 2 }));
    return st;
  }
  function mossling() {
    const st = [], bark = C("#7a4a24"), moss = C("#3cbf6c"), leaf = C("#9be38f"), dark = C("#222222"), flower = C("#ff8fc0");
    st.push(S("cylinder", [0, 0, 62], [52, 52, 58], { color: bark, round: 0.4 }));
    st.push(S("joint", [30, 0, 10], [10, 10, 14], { color: bark, mirror: true, offsX: 30, rot: dir(0.5, 0.2, -1) }));
    st.push(S("joint", [0, 30, 10], [10, 10, 14], { color: bark, rot: dir(0, 0.6, -1) }));
    st.push(S("sphere", [0, 0, 128], [66, 66, 36], { color: moss, layer: 1 }));
    st.push(S("sphere", [58, 0, 150], [34, 12, 18], { color: leaf, mirror: true, offsX: 58, rot: [0, -0.5, 0], layer: 1, blend: 6 }));
    st.push(S("sphere", [0, 0, 168], [14, 14, 14], { color: flower, layer: 1, blend: 4 }));
    st.push(S("sphere", [18, 50, 78], [8, 6, 10], { color: dark, mirror: true, offsX: 18, layer: 2 }));
    st.push(S("sphere", [0, 52, 58], [12, 4, 5], { color: dark, layer: 2 }));
    return st;
  }
  function pebblit() {
    const st = [], rock = C("#9a9a9a"), dark = C("#5a5a5a"), moss = C("#3cbf6c"), glow = C("#39c6c0");
    st.push(S("cube", [0, 0, 92], [62, 50, 62], { color: rock, round: 0.5 }));
    st.push(S("cube", [0, 8, 180], [44, 40, 34], { color: rock, round: 0.5, blend: 10 }));
    st.push(S("joint", [76, 10, 90], [20, 20, 48], { color: dark, mirror: true, offsX: 76, rot: dir(0.2, 0.3, -1), blend: 8 }));
    st.push(S("joint", [30, 0, 20], [20, 20, 22], { color: dark, mirror: true, offsX: 30, blend: 8 }));
    st.push(S("sphere", [-30, -30, 150], [28, 24, 16], { m: "rep", color: moss }));
    st.push(S("sphere", [16, 46, 186], [8, 5, 6], { color: glow, mirror: true, offsX: 16, layer: 1 }));
    st.push(S("sphere", [0, 48, 166], [10, 4, 4], { color: dark, layer: 1 }));
    return st;
  }
  function zapbug() {
    const st = [], yellow = C("#ffd23f"), black = C("#222222"), shell = C("#ffb020"), spark = C("#fff4d6");
    st.push(S("sphere", [0, -10, 62], [62, 76, 46], { color: yellow }));
    for (let k = 0; k < 3; k++) st.push(S("cube", [0, -50 + k * 32, 70], [64, 6, 50], { m: "rep", color: black }));
    st.push(S("sphere", [0, 68, 64], [36, 30, 30], { color: black, blend: 8 }));
    st.push(S("joint", [52, 20, 22], [5, 5, 24], { color: black, mirror: true, offsX: 52, rot: dir(0.8, 0.4, -1) }));
    st.push(S("joint", [56, -20, 22], [5, 5, 24], { color: black, mirror: true, offsX: 56, rot: dir(0.9, 0, -1) }));
    st.push(S("joint", [52, -55, 22], [5, 5, 24], { color: black, mirror: true, offsX: 52, rot: dir(0.8, -0.4, -1) }));
    st.push(S("joint", [16, 96, 110], [4, 4, 34], { color: black, mirror: true, offsX: 16, rot: dir(0.3, 0.6, 1), layer: 1 }));
    st.push(S("sphere", [30, 116, 140], [11, 11, 11], { color: spark, mirror: true, offsX: 30, layer: 1, blend: 4 }));
    st.push(S("sphere", [32, -8, 92], [30, 62, 18], { color: shell, mirror: true, offsX: 32, rot: [0, 0.3, 0], layer: 2 }));
    st.push(S("sphere", [14, 92, 74], [7, 6, 7], { color: spark, mirror: true, offsX: 14, layer: 2 }));
    return st;
  }
  function lumoth() {
    const st = [], fluff = C("#c9a6ff"), wing = C("#8a4fd8"), spot = C("#ff8fc0"), glow = C("#fff4d6"), dark = C("#222222");
    st.push(S("sphere", [0, 0, 170], [38, 54, 44], { color: fluff }));
    st.push(S("sphere", [0, 52, 196], [32, 30, 30], { color: fluff, blend: 14 }));
    st.push(S("sphere", [0, -46, 150], [22, 26, 22], { color: fluff, blend: 12 }));
    st.push(S("sphere", [92, 10, 190], [70, 44, 8], { color: wing, mirror: true, offsX: 92, rot: [0, -0.35, 0.2], layer: 1 }));
    st.push(S("sphere", [80, -50, 160], [50, 36, 8], { color: wing, mirror: true, offsX: 80, rot: [0, -0.3, -0.3], layer: 1, blend: 6 }));
    st.push(S("sphere", [104, 14, 196], [18, 14, 12], { m: "rep", color: spot, mirror: true, offsX: 104, layer: 1 }));
    st.push(S("joint", [16, 82, 240], [4, 4, 30], { color: wing, mirror: true, offsX: 16, rot: dir(0.4, 0.5, 1), layer: 2 }));
    st.push(S("sphere", [26, 98, 264], [9, 9, 9], { color: glow, mirror: true, offsX: 26, layer: 2 }));
    st.push(S("sphere", [14, 78, 204], [6, 5, 7], { color: dark, mirror: true, offsX: 14, layer: 2 }));
    return st;
  }
  // the colosseum: a stone base ring, sixteen piers carrying an upper ring (the gaps between the piers are
  // the arches), a cornice, and two gold-roofed towers at the gate (front, +y). In the world it stands in
  // a pit three blocks deep, so its sand floor is sunk into the earth and a ramp leads down to the gate.
  function arena() {
    const st = [], stone = C("#d8d8d8"), stone2 = C("#a8a8a8"), dark = C("#6a6a6a"), gold = C("#ffd23f"), red = C("#e8443a");
    // layer 0: the base ring
    st.push(S("cylinder", [0, 0, 22], [474, 474, 22], { color: stone2, hole: 0.12 }));
    st.push(S("cylinder", [0, 0, 48], [466, 466, 6], { color: stone, hole: 0.1 }));
    // four gates through the base ring, one on every side (the arena is entered and left only through them)
    st.push(S("cube", [0, 0, 40], [74, 520, 60], { m: "sub", color: stone }));
    st.push(S("cube", [0, 0, 40], [520, 74, 60], { m: "sub", color: stone }));
    // layer 1: the piers (none in front of a gate)
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.283 + 0.196;
      if (Math.abs(Math.sin(a)) > 0.95 || Math.abs(Math.cos(a)) > 0.95) continue;
      st.push(S("cube", [Math.cos(a) * 452, Math.sin(a) * 452, 150], [34, 26, 100], { color: stone, rot: [0, 0, a], round: 0.2, layer: 1 }));
    }
    // layer 2: the upper ring and cornice
    st.push(S("cylinder", [0, 0, 272], [474, 474, 22], { color: stone, hole: 0.1, layer: 2 }));
    st.push(S("cylinder", [0, 0, 300], [486, 486, 8], { color: stone2, hole: 0.12, layer: 2, blend: 4 }));
    // layer 3: the gate towers with gold roofs and dark windows
    st.push(S("cube", [118, 470, 190], [50, 50, 190], { color: stone, round: 0.1, mirror: true, offsX: 118, layer: 3 }));
    st.push(S("cube", [118, 470, 410], [58, 58, 34], { color: gold, cone: 1, mirror: true, offsX: 118, layer: 3 }));
    st.push(S("cube", [118, 522, 270], [20, 6, 34], { m: "rep", color: dark, mirror: true, offsX: 118, layer: 3 }));
    // and the same towers either side of the other three gates
    st.push(S("cube", [118, -470, 190], [50, 50, 190], { color: stone, round: 0.1, mirror: true, offsX: 118, layer: 3 }));
    st.push(S("cube", [118, -470, 410], [58, 58, 34], { color: gold, cone: 1, mirror: true, offsX: 118, layer: 3 }));
    for (const y of [118, -118]) {
      st.push(S("cube", [470, y, 190], [50, 50, 190], { color: stone, round: 0.1, mirror: true, offsX: 470, layer: 3 }));
      st.push(S("cube", [470, y, 410], [58, 58, 34], { color: gold, cone: 1, mirror: true, offsX: 470, layer: 3 }));
    }
    // layer 4: banners on the towers
    st.push(S("joint", [118, 470, 488], [6, 6, 46], { color: dark, mirror: true, offsX: 118, layer: 4 }));
    st.push(S("cube", [150, 470, 516], [30, 3, 18], { color: red, mirror: true, offsX: 150, layer: 4 }));
    // layer 5: the emblem in the middle of the sand
    st.push(S("cylinder", [0, 0, 4], [78, 78, 4], { color: red, layer: 5 }));
    st.push(S("cylinder", [0, 0, 6], [44, 44, 4], { color: C("#ffffff"), layer: 5 }));
    return st;
  }

  // the statue of the Maker on a village square: a golden Tickle raising its arms to the sky, on a stone
  // pedestal with a plaque (the Maker is honoured as a Tickle, never shown as a person)
  function maker() {
    const st = [], gold = C("#ffd23f"), gold2 = C("#ffb020"), stone = C("#c8c8c8"), stone2 = C("#9a9a9a"), dark = C("#6b4a2b");
    // layer 0: the pedestal
    st.push(S("cylinder", [0, 0, 60], [200, 200, 60], { color: stone2 }));
    st.push(S("cylinder", [0, 0, 150], [150, 150, 40], { color: stone, blend: 4 }));
    // layer 1: a round golden Tickle with round ears and feet, and a happy face
    st.push(S("sphere", [0, 0, 320], [110, 95, 135], { color: gold, layer: 1 }));
    st.push(S("sphere", [0, 0, 510], [105, 95, 95], { color: gold, layer: 1, blend: 20 }));
    st.push(S("sphere", [72, 0, 600], [36, 22, 36], { color: gold, mirror: true, offsX: 72, layer: 1 }));
    st.push(S("sphere", [45, 30, 200], [40, 55, 30], { color: gold, mirror: true, offsX: 45, layer: 1 }));
    st.push(S("sphere", [34, 86, 530], [12, 8, 16], { color: dark, mirror: true, offsX: 34, layer: 1 }));
    st.push(S("sphere", [0, 92, 480], [28, 8, 10], { color: dark, layer: 1 }));
    // layer 2: the arms, raised to the sky
    st.push(S("joint", [118, 0, 470], [26, 26, 110], { color: gold, rot: dir(0.55, 0, 1), mirror: true, offsX: 118, layer: 2 }));
    st.push(S("sphere", [178, 0, 575], [30, 30, 30], { color: gold2, mirror: true, offsX: 178, layer: 2 }));
    // layer 3: a halo and a star above it
    st.push(S("cylinder", [0, 0, 690], [95, 95, 8], { color: gold2, hole: 0.78, layer: 3 }));
    st.push(S("sphere", [0, 0, 760], [26, 26, 26], { color: C("#ffffff"), layer: 3 }));
    // layer 4: a plain golden plaque on the front of the pedestal (the Maker's initials live on only in the stories)
    st.push(S("cube", [0, 200, 62], [124, 10, 58], { color: gold2, layer: 4 }));
    st.push(S("cube", [0, 204, 62], [112, 8, 46], { color: gold, layer: 4 }));
    return st;
  }

  // ---------- the great lake: docks, rowboats and ferries ----------
  // a wooden jetty from the bank out over the water (front, +y, points out to the lake)
  function dock() {
    const st = [], wood = C("#a0703a"), dark = C("#6b4a2b"), rope = C("#e8d9b0"), lamp = C("#ffd23f"), red = C("#e8443a");
    // layer 0: the deck, and a step at the bank
    st.push(S("cube", [0, 640, 40], [240, 800, 14], { color: wood, round: 0.1 }));
    st.push(S("cube", [0, -110, 26], [270, 60, 22], { color: wood, round: 0.2 }));
    // layer 1: posts down into the water
    for (let k = 0; k < 6; k++) st.push(S("cylinder", [220, -40 + k * 290, -150], [26, 26, 200], { color: dark, mirror: true, offsX: 220, layer: 1 }));
    // layer 2: rope rails on short posts
    st.push(S("cube", [220, 680, 120], [7, 760, 6], { color: rope, mirror: true, offsX: 220, layer: 2 }));
    for (let k = 0; k < 6; k++) st.push(S("cylinder", [220, -40 + k * 290, 90], [14, 14, 48], { color: dark, mirror: true, offsX: 220, layer: 2 }));
    // layer 3: a lamp at the far end and the ferry sign by the bank
    st.push(S("joint", [160, 1400, 210], [9, 9, 170], { color: dark, layer: 3 }));
    st.push(S("sphere", [160, 1400, 390], [30, 30, 30], { color: lamp, layer: 3 }));
    st.push(S("joint", [-170, -110, 180], [9, 9, 140], { color: dark, layer: 3 }));
    st.push(S("cube", [-170, -110, 310], [100, 8, 54], { color: red, round: 0.2, layer: 3 }));
    st.push(S("cube", [-170, -118, 310], [56, 4, 20], { color: C("#ffffff"), layer: 3 }));
    return st;
  }
  // a little rowing boat with two seats and a pair of oars
  function rowboat() {
    const st = [], wood = C("#a0703a"), dark = C("#6b4a2b"), red = C("#e8443a");
    // layer 0: the hull, hollowed out
    st.push(S("sphere", [0, 0, 60], [140, 330, 90], { color: wood }));
    st.push(S("sphere", [0, 0, 112], [118, 302, 80], { m: "sub", color: wood }));
    // layer 1: a red rim at the bow and stern, and the seats
    st.push(S("sphere", [0, 250, 120], [60, 70, 26], { color: red, layer: 1 }));
    st.push(S("sphere", [0, -250, 120], [60, 70, 26], { color: red, layer: 1 }));
    st.push(S("cube", [0, 40, 72], [118, 24, 8], { color: dark, layer: 1 }));
    st.push(S("cube", [0, -170, 72], [100, 24, 8], { color: dark, layer: 1 }));
    // layer 2: the oars
    st.push(S("joint", [165, 30, 95], [7, 7, 150], { color: dark, rot: dir(1, 0.15, -0.55), mirror: true, offsX: 165, layer: 2 }));
    st.push(S("cube", [270, 45, 25], [14, 34, 60], { color: wood, rot: dir(1, 0.15, -0.55), mirror: true, offsX: 270, layer: 2 }));
    return st;
  }
  // the ferry: a broad white hull with a deck, a cabin at the stern, a mast with a sail and a flag
  function ferry() {
    const st = [], white = C("#f4f4f4"), blue = C("#2f8fe0"), wood = C("#a0703a"), dark = C("#6b4a2b"), red = C("#e8443a"), sail = C("#fff4d6");
    // layer 0: hull, hollowed, with a plank deck inside
    st.push(S("sphere", [0, 0, 90], [320, 780, 140], { color: white }));
    st.push(S("sphere", [0, 0, 205], [292, 742, 120], { m: "sub", color: white }));
    st.push(S("cube", [0, 0, 122], [270, 620, 10], { color: wood }));
    // layer 1: the cabin with a blue roof and windows
    st.push(S("cube", [0, -430, 240], [170, 140, 110], { color: white, round: 0.15, layer: 1 }));
    st.push(S("cube", [0, -430, 366], [196, 166, 22], { color: blue, round: 0.2, layer: 1 }));
    st.push(S("cube", [0, -288, 260], [110, 10, 36], { m: "rep", color: C("#8fd3f4"), layer: 1 }));
    // layer 2: mast, sail and flag
    st.push(S("joint", [0, 180, 440], [12, 12, 320], { color: dark, layer: 2 }));
    st.push(S("cube", [0, 180, 500], [230, 8, 200], { color: sail, round: 0.1, layer: 2 }));
    st.push(S("cube", [40, 180, 790], [50, 4, 24], { color: red, layer: 2 }));
    // layer 3: benches along the sides and a bollard at the bow
    st.push(S("cube", [200, 140, 160], [36, 240, 30], { color: wood, mirror: true, offsX: 200, layer: 3 }));
    st.push(S("cylinder", [0, 640, 170], [40, 40, 40], { color: blue, layer: 3 }));
    return st;
  }

  // ---------- dungeons and their monsters ----------
  // a hill of rock with a temple front carved into it: two great columns, a lintel and pediment with
  // glowing eyes, braziers, and a stair cut down to a dark doorway; in the world it is sunk four blocks
  function dungeon() {
    const st = [], rock = C("#8a8a8a"), rock2 = C("#6a6a6a"), moss = C("#3cbf6c"), carved = C("#c8c8c8"), black = C("#111111"), gold = C("#ffd23f"), flame = C("#ffb020"), glow = C("#c9a6ff");
    // layer 0: the hill, with the doorway and stair carved out of it
    st.push(S("sphere", [0, -40, 200], [330, 260, 250], { color: rock }));
    st.push(S("sphere", [-230, -60, 140], [180, 170, 170], { color: rock2, blend: 50 }));
    st.push(S("sphere", [240, -90, 150], [170, 160, 180], { color: rock, blend: 50 }));
    st.push(S("sphere", [-90, -150, 400], [170, 130, 70], { m: "rep", color: moss }));
    st.push(S("cube", [0, 250, 160], [190, 120, 160], { m: "sub", color: rock }));
    // layer 1: the carved front
    st.push(S("cylinder", [150, 262, 175], [40, 40, 175], { color: C("#e6e6e6"), mirror: true, offsX: 150 }));
    st.push(S("cylinder", [150, 262, 20], [52, 52, 20], { color: rock2, mirror: true, offsX: 150, blend: 4 }));
    st.push(S("cube", [0, 250, 372], [215, 48, 30], { color: carved, round: 0.2, blend: 6 }));
    st.push(S("cube", [0, 250, 440], [222, 48, 44], { color: carved, cone: 1, blend: 6 }));
    st.push(S("sphere", [52, 300, 430], [16, 6, 12], { m: "rep", color: glow, mirror: true, offsX: 52 }));
    st.push(S("cube", [0, 240, 120], [100, 30, 120], { color: black }));
    // layer 2: braziers on the columns
    st.push(S("cylinder", [150, 250, 360], [30, 30, 10], { color: rock2, cone: -0.4, mirror: true, offsX: 150, layer: 2 }));
    st.push(S("sphere", [150, 250, 384], [22, 22, 30], { color: flame, mirror: true, offsX: 150, layer: 2, blend: 8 }));
    // layer 3: a gold sun on the pediment
    st.push(S("sphere", [0, 280, 470], [16, 8, 16], { color: gold, layer: 3 }));
    st.push(S("sphere", [0, 276, 470], [24, 4, 24], { color: C("#ffb020"), layer: 3, blend: 4 }));
    return st;
  }
  function gloomslime() {
    const st = [], goo = C("#8a4fd8"), pale = C("#c9a6ff"), white = C("#ffffff"), dark = C("#222222");
    st.push(S("sphere", [0, 0, 70], [80, 80, 70], { color: goo }));
    st.push(S("sphere", [0, 0, 22], [96, 96, 22], { color: goo, blend: 26 }));
    st.push(S("sphere", [-26, -20, 120], [26, 22, 16], { m: "rep", color: pale }));
    st.push(S("sphere", [28, 62, 92], [17, 10, 20], { color: white, mirror: true, offsX: 28, layer: 1 }));
    st.push(S("sphere", [28, 70, 90], [8, 5, 10], { color: dark, mirror: true, offsX: 28, layer: 1 }));
    st.push(S("cube", [0, 76, 58], [24, 4, 5], { color: dark, layer: 1 }));
    return st;
  }
  function shadebat() {
    const st = [], fur = C("#3d2370"), wing = C("#6a3fb0"), eye = C("#ffd23f"), fang = C("#ffffff");
    st.push(S("sphere", [0, 0, 150], [40, 42, 46], { color: fur }));
    st.push(S("sphere", [26, 10, 196], [12, 8, 26], { color: fur, mirror: true, offsX: 26, rot: [0, 0.3, 0], blend: 6 }));
    st.push(S("sphere", [92, 0, 160], [64, 34, 7], { color: wing, mirror: true, offsX: 92, rot: [0, -0.3, 0], layer: 1 }));
    st.push(S("sphere", [128, -14, 140], [30, 28, 7], { color: wing, mirror: true, offsX: 128, rot: [0, -0.5, 0], layer: 1, blend: 6 }));
    st.push(S("sphere", [16, 36, 160], [8, 6, 8], { color: eye, mirror: true, offsX: 16, layer: 2 }));
    st.push(S("joint", [8, 38, 128], [3, 3, 7], { color: fang, mirror: true, offsX: 8, cone: 1, rot: [3.14, 0, 0], layer: 2 }));
    return st;
  }
  function brutecap() {
    const st = [], stem = C("#f3e2c0"), cap = C("#b0302b"), spot = C("#ffffff"), dark = C("#222222");
    st.push(S("cylinder", [0, 0, 95], [62, 62, 90], { color: stem, round: 0.4 }));
    st.push(S("joint", [70, 0, 110], [18, 18, 46], { color: stem, mirror: true, offsX: 70, rot: dir(0.7, 0.2, -0.5), blend: 10 }));
    st.push(S("joint", [32, 0, 18], [18, 18, 18], { color: stem, mirror: true, offsX: 32, blend: 8 }));
    st.push(S("sphere", [0, 0, 220], [130, 130, 72], { color: cap, layer: 1 }));
    st.push(S("sphere", [60, 50, 262], [24, 24, 14], { m: "rep", color: spot, layer: 1 }));
    st.push(S("sphere", [-70, 20, 252], [20, 20, 12], { m: "rep", color: spot, layer: 1 }));
    st.push(S("sphere", [0, -60, 270], [22, 22, 12], { m: "rep", color: spot, layer: 1 }));
    st.push(S("cube", [22, 58, 130], [14, 6, 6], { color: dark, mirror: true, offsX: 22, rot: [0, 0.4, 0], layer: 2 }));
    st.push(S("sphere", [22, 60, 112], [7, 5, 7], { color: dark, mirror: true, offsX: 22, layer: 2 }));
    return st;
  }

  // ---------- ruin and rebuilding ----------
  // what is left of a house after a dragon (or a throw): broken walls, fallen planks, stones
  function ruins() {
    const st = [], wall = C("#f3e2c0"), wood = C("#7a4a24"), stone = C("#9a9a9a"), soot = C("#3a3a3a");
    st.push(S("cube", [0, 0, 16], [300, 260, 16], { color: stone, round: 0.3 }));
    st.push(S("cube", [-220, -170, 90], [70, 18, 90], { color: wall, round: 0.1 }));
    st.push(S("cube", [-280, -60, 60], [18, 110, 60], { color: wall, round: 0.1 }));
    st.push(S("cube", [200, 150, 50], [60, 16, 50], { color: wall, rot: [0, 0, 0.3] }));
    st.push(S("sphere", [-150, -120, 140], [60, 40, 30], { m: "rep", color: soot }));
    st.push(S("cube", [40, 20, 46], [150, 14, 10], { color: wood, rot: [0.2, 0.15, 0.6], layer: 1 }));
    st.push(S("cube", [-40, 80, 40], [130, 12, 10], { color: wood, rot: [-0.25, 0, -0.4], layer: 1 }));
    st.push(S("sphere", [110, -60, 36], [60, 50, 30], { color: stone, layer: 1, blend: 12 }));
    st.push(S("sphere", [-60, 30, 30], [50, 46, 24], { color: soot, layer: 1, blend: 12 }));
    return st;
  }
  // a house going back up: wooden frame, half-built walls, a ladder
  function scaffold() {
    const st = [], wall = C("#fff4d6"), wood = C("#7a4a24"), plank = C("#c79a62"), stone = C("#9a9a9a");
    st.push(S("cube", [0, 0, 18], [320, 280, 18], { color: stone, round: 0.3 }));
    st.push(S("cube", [0, -258, 130], [300, 14, 110], { color: wall }));
    st.push(S("cube", [-298, 0, 100], [14, 260, 80], { color: wall }));
    st.push(S("joint", [300, 270, 240], [11, 11, 240], { color: wood, mirror: true, offsX: 300, layer: 1 }));
    st.push(S("joint", [300, -270, 240], [11, 11, 240], { color: wood, mirror: true, offsX: 300, layer: 1 }));
    st.push(S("cube", [0, 270, 470], [312, 9, 9], { color: wood, layer: 1 }));
    st.push(S("cube", [0, -270, 470], [312, 9, 9], { color: wood, layer: 1 }));
    st.push(S("cube", [0, 270, 250], [312, 22, 7], { color: plank, layer: 1 }));
    st.push(S("cube", [200, 300, 200], [10, 8, 200], { color: wood, rot: [0.25, 0, 0], mirror: true, offsX: 200, layer: 2 }));
    for (let k = 0; k < 5; k++) st.push(S("cube", [0, 300 + k * 10, 40 + k * 80], [200, 5, 5], { color: wood, rot: [0.25, 0, 0], layer: 2 }));
    return st;
  }
  // the stone altar in front of each town hall, where villages bring their fallen back
  function altar() {
    const st = [], stone = C("#c8c8c8"), dark = C("#9a9a9a"), gold = C("#ffd23f"), candle = C("#fff4d6"), flame = C("#ffb020");
    st.push(S("cylinder", [0, 0, 12], [130, 130, 12], { color: dark }));
    st.push(S("cube", [0, 0, 70], [70, 70, 50], { color: stone, round: 0.3, blend: 6 }));
    st.push(S("cube", [0, 0, 124], [84, 84, 8], { color: stone, round: 0.4 }));
    st.push(S("sphere", [0, 0, 150], [26, 26, 26], { color: gold, layer: 1 }));
    st.push(S("cube", [0, 0, 128], [86, 86, 3], { m: "rep", color: gold, layer: 1 }));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * 6.283 + 0.785, x = Math.cos(a) * 105, y = Math.sin(a) * 105;
      st.push(S("joint", [x, y, 40], [8, 8, 20], { color: candle, layer: 2 + k }));
      st.push(S("sphere", [x, y, 70], [7, 7, 11], { color: flame, layer: 2 + k }));
    }
    return st;
  }

  // ---------- dragons ----------
  const DRAGON_LOOKS = [
    { name: "Red", body: "#c0392b", belly: "#ffd23f", wing: "#8b1a1a", horn: "#fff4d6" },
    { name: "Green", body: "#2e8b3a", belly: "#c9e27a", wing: "#1f6b2a", horn: "#fff4d6" },
    { name: "Purple", body: "#6a3fb0", belly: "#ff8fc0", wing: "#4b2a80", horn: "#fff4d6" },
  ];
  TB.DRAGON_LOOKS = DRAGON_LOOKS;
  // a stroke between two points (a bone, a neck, a tail segment)
  const seg = (a, b, r, o) => S("joint", [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [r, r, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2], Object.assign({ rot: dir(b[0] - a[0], b[1] - a[1], b[2] - a[2]) }, o));
  function dragonBody(v) {
    const L = DRAGON_LOOKS[v], st = [], body = C(L.body), belly = C(L.belly), horn = C(L.horn), eye = C("#ffd23f"), dark = C("#111111");
    // torso, chest, belly
    st.push(S("sphere", [0, -10, 230], [112, 190, 104], { color: body }));
    st.push(S("sphere", [0, 120, 262], [96, 100, 100], { color: body, blend: 40 }));
    st.push(S("sphere", [0, 20, 176], [80, 170, 50], { m: "rep", color: belly }));
    // legs: thighs and shins, short and strong
    st.push(seg([78, 120, 230], [86, 150, 40], 30, { color: body, mirror: true, offsX: 82, blend: 22 }));
    st.push(S("sphere", [86, -110, 180], [46, 66, 74], { color: body, mirror: true, offsX: 86, blend: 26 }));
    st.push(seg([92, -100, 140], [92, -70, 34], 30, { color: body, mirror: true, offsX: 92, blend: 18 }));
    st.push(S("sphere", [88, 168, 20], [40, 52, 20], { color: body, mirror: true, offsX: 88, blend: 10 }));
    st.push(S("sphere", [94, -52, 20], [44, 56, 20], { color: body, mirror: true, offsX: 94, blend: 10 }));
    // neck in an S, then the head with its jaw
    st.push(seg([0, 150, 300], [0, 220, 420], 50, { color: body, blend: 34 }));
    st.push(seg([0, 220, 420], [0, 300, 480], 42, { color: body, blend: 26 }));
    st.push(S("sphere", [0, 330, 500], [60, 74, 54], { color: body, blend: 22 }));
    st.push(S("cube", [0, 410, 494], [42, 62, 26], { color: body, round: 0.6, blend: 16 }));
    st.push(S("cube", [0, 398, 458], [36, 56, 12], { color: belly, round: 0.6, blend: 10 }));
    // tail sweeping back to a spade
    st.push(seg([0, -170, 220], [0, -330, 170], 54, { color: body, cone: 0.3, layer: 1 }));
    st.push(seg([0, -330, 170], [0, -450, 190], 34, { color: body, cone: 0.35, layer: 1, blend: 18 }));
    st.push(seg([0, -450, 190], [0, -500, 225], 20, { color: body, layer: 1, blend: 12 }));
    st.push(S("cube", [0, -508, 232], [40, 30, 8], { color: body, cone: 0.9, rot: [-1.2, 0, 0], layer: 1, blend: 8 }));
    // horns, eyes, nostrils, spines
    st.push(seg([36, 300, 540], [52, 250, 610], 13, { color: horn, cone: 1, mirror: true, offsX: 36, layer: 2 }));
    st.push(S("sphere", [44, 372, 520], [12, 12, 12], { color: eye, mirror: true, offsX: 44, layer: 2 }));
    st.push(S("sphere", [48, 380, 522], [5, 6, 9], { color: dark, mirror: true, offsX: 48, layer: 2 }));
    st.push(S("sphere", [16, 470, 508], [6, 5, 6], { color: dark, mirror: true, offsX: 16, layer: 2 }));
    const spine = [[0, 250, 480], [0, 200, 420], [0, 120, 350], [0, 30, 330], [0, -70, 330], [0, -170, 300], [0, -270, 250], [0, -370, 220]];
    spine.forEach(([x, y, z], k) => st.push(S("joint", [x, y, z + 18], [15 - k, 15 - k, 26 - k * 1.5], { color: horn, cone: 1, layer: 3 })));
    return st;
  }
  // one wing, from the shoulder (origin) out along +x; the other is its mirror image
  function dragonWing(v) {
    const L = DRAGON_LOOKS[v], st = [], bone = C(L.body), skin = C(L.wing);
    // the wing rises away from the body (dihedral), so every point is lifted with x
    const up = (p) => [p[0], p[1], p[2] + p[0] * 0.45];
    const sh = up([0, 0, 0]), el = up([150, -10, 40]), wr = up([300, 30, 60]);
    const tips = [[440, 10, 40], [420, -130, 20], [320, -220, 0]].map(up);
    st.push(seg(sh, el, 22, { color: bone }));
    st.push(seg(el, wr, 16, { color: bone, blend: 8 }));
    tips.forEach((t) => st.push(seg(wr, t, 9, { color: bone, cone: 0.5, blend: 6 })));
    st.push(S("joint", [wr[0], wr[1] + 20, wr[2] + 30], [9, 9, 22], { color: C(L.horn), cone: 1, rot: dir(0.2, 0.6, 1) }));
    // membrane: thin discs lying in the wing's plane; their rims make the scalloped edge
    const n = dir(-0.42, 0, 1);
    for (const [x, y, r] of [[375, -40, 70], [365, -140, 60], [250, -130, 96], [150, -90, 84], [275, 2, 66], [190, -190, 60]]) {
      const c = up([x, y, 30]);
      st.push(S("sphere", c, [r, r, 6], { color: skin, rot: n, layer: 1, blend: 6 }));
    }
    return st;
  }
  // body plus both wings, as one model (for previews and the on-chain viewer)
  function dragonWhole(v) {
    const st = dragonBody(v);
    const [sx, sy, sz] = TB.dragonParts ? TB.dragonParts.shoulder : [70, 90, 300];
    for (const w of dragonWing(v)) st.push(Object.assign({}, w, { pos: [R2(w.pos[0] + sx), R2(w.pos[1] + sy), R2(w.pos[2] + sz)], mirror: true, offsX: R2(w.pos[0] + sx), layer: w.layer + 4 }));
    return st;
  }
  TB.dragonParts = { body: dragonBody, wing: dragonWing, shoulder: [70, 90, 300] };

  // ---------- the kit ----------
  // variants: how many versions each kind has; scenery kinds render as landscape/buildings,
  // animals and dragons move about.
  const clanVariants = CLANS.map((_, i) => i);
  TB.KIT = {
    tree_leafy: { name: "Leafy Tree", group: "Landscape", variants: [0, 1], build: (v) => TB.TREES.tree_leafy(v), voxel: [14, 34], scenery: true },
    tree_pine: { name: "Pine Tree", group: "Landscape", variants: [0, 1], build: (v) => TB.TREES.tree_pine(v), voxel: [14, 34], scenery: true },
    bush: { name: "Flowering Bush", group: "Landscape", variants: [0, 1], build: (v) => TB.TREES.bush(v), voxel: [14, 34], scenery: true },
    cottage: { name: "Cottage", group: "Village", variants: clanVariants, build: cottage, voxel: [18, 40], scenery: true, variantLabel: (v) => CLANS[v].species + " roof" },
    hut: { name: "Round Hut", group: "Village", variants: clanVariants, build: roundHut, voxel: [18, 40], scenery: true, variantLabel: (v) => CLANS[v].species + " roof" },
    townhall: { name: "Town Hall", group: "Village", variants: clanVariants, build: townHall, voxel: [18, 40], scenery: true, variantLabel: (v) => CLANS[v].species + " banner" },
    granary: { name: "Granary", group: "Village", variants: [0], build: granary, voxel: [16, 36], scenery: true },
    fence: { name: "Fence", group: "Farming", variants: [0], build: fence, voxel: [12, 30], scenery: true },
    sty: { name: "Pig Shed", group: "Farming", variants: [0], build: sty, voxel: [14, 32], scenery: true },
    trough: { name: "Feed Trough", group: "Farming", variants: [0], build: trough, voxel: [10, 24], scenery: true },
    coop: { name: "Hen House", group: "Farming", variants: [0], build: coop, voxel: [12, 28], scenery: true },
    wheat: { name: "Wheat", group: "Farming", variants: [0], build: wheat, voxel: [11, 22] },
    cabbage: { name: "Cabbage", group: "Farming", variants: [0], build: cabbage, voxel: [11, 22] },
    chicken: { name: "Chicken", group: "Animals", variants: [0], build: chicken, voxel: [8] },
    pig: { name: "Pig", group: "Animals", variants: [0], build: pig, voxel: [11] },
    deer: { name: "Deer", group: "Animals", variants: [0], build: deer, voxel: [12] },
    boar: { name: "Boar", group: "Animals", variants: [0], build: boar, voxel: [11] },
    sheep: { name: "Sheep", group: "Animals", variants: [0], build: sheep, voxel: [11] },
    griffin: { name: "Griffin", group: "Creatures", variants: [0], build: griffin, voxel: [9] },
    cinderling: { name: "Cinderling", group: "Creatures", variants: [0], build: cinderling, voxel: [7] },
    bubblefin: { name: "Bubblefin", group: "Creatures", variants: [0], build: bubblefin, voxel: [7] },
    mossling: { name: "Mossling", group: "Creatures", variants: [0], build: mossling, voxel: [7] },
    pebblit: { name: "Pebblit", group: "Creatures", variants: [0], build: pebblit, voxel: [8] },
    zapbug: { name: "Zapbug", group: "Creatures", variants: [0], build: zapbug, voxel: [7] },
    lumoth: { name: "Lumoth", group: "Creatures", variants: [0], build: lumoth, voxel: [7] },
    arena: { name: "Creature Arena", group: "Creatures", variants: [0], build: arena, voxel: [16, 36], scenery: true },
    dungeon: { name: "Dungeon Cave", group: "Dungeons", variants: [0], build: dungeon, voxel: [16, 36], scenery: true },
    gloomslime: { name: "Gloomslime", group: "Dungeons", variants: [0], build: gloomslime, voxel: [8] },
    shadebat: { name: "Shadebat", group: "Dungeons", variants: [0], build: shadebat, voxel: [7] },
    brutecap: { name: "Brutecap", group: "Dungeons", variants: [0], build: brutecap, voxel: [9] },
    ruins: { name: "House Ruins", group: "Village", variants: [0], build: ruins, voxel: [16, 36], scenery: true },
    scaffold: { name: "Rebuilding Scaffold", group: "Village", variants: [0], build: scaffold, voxel: [16, 36], scenery: true },
    altar: { name: "Revival Altar", group: "Village", variants: [0], build: altar, voxel: [10, 24], scenery: true },
    maker: { name: "Statue of the Maker", group: "Village", variants: [0], build: maker, voxel: [8, 30], scenery: true },
    dock: { name: "Lake Dock", group: "Lake", variants: [0], build: dock, voxel: [14, 32], scenery: true },
    rowboat: { name: "Rowing Boat", group: "Lake", variants: [0], build: rowboat, voxel: [8] },
    ferry: { name: "Ferry", group: "Lake", variants: [0], build: ferry, voxel: [12] },
    dragon: { name: "Dragon", group: "Dragons", variants: [0, 1, 2], build: dragonWhole, voxel: [12], variantLabel: (v) => DRAGON_LOOKS[v].name },
  };
  TB.kitKey = (kind, v) => kind + "_" + v;
  TB.kitHelpers = { C, S, dir, CLANS }; // for the interior kit (kit-interior.js)
})(typeof self !== "undefined" ? self : this);
