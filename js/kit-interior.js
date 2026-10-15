/* The interior kit: furniture and fittings for the insides of houses, town halls, granaries, dungeons
 * and mines, plus the mine entrance, in the same stroke format and palette as the rest of the kit.
 * SDF units, z up, ground at z = 0, front +y; a Tickle is about 480 tall. */
(function (G) {
  "use strict";
  const TB = G.TB, { C, S, dir, CLANS } = TB.kitHelpers;
  const wood = () => C("#a0703a"), dark = () => C("#6b4a2b"), stone = () => C("#9a9a9a"), stone2 = () => C("#c8c8c8"), gold = () => C("#ffd23f");

  // ---------- a home ----------
  function bed(v) {
    const st = [], blanket = C(CLANS[v % CLANS.length].color);
    st.push(S("cube", [0, 0, 55], [150, 250, 35], { color: wood(), round: 0.2 }));
    st.push(S("cube", [0, -238, 150], [160, 16, 110], { color: dark(), round: 0.2 }));
    st.push(S("cube", [0, 20, 100], [140, 230, 18], { color: C("#ffffff"), round: 0.4, layer: 1 }));
    st.push(S("cube", [0, 70, 118], [142, 170, 8], { color: blanket, round: 0.3, layer: 1 }));
    st.push(S("sphere", [0, -170, 128], [100, 45, 25], { color: C("#fff4d6"), layer: 1 }));
    return st;
  }
  function table(v) {
    const st = [];
    st.push(S("cylinder", [0, 0, 200], [150, 150, 12], { color: wood(), round: 0.2 }));
    st.push(S("joint", [0, 0, 100], [22, 22, 90], { color: dark() }));
    st.push(S("cylinder", [0, 0, 12], [70, 70, 10], { color: dark() }));
    if (v === 1) {
      // breakfast on the table
      st.push(S("cylinder", [-50, 20, 226], [38, 38, 14], { color: C("#ffffff"), hole: 0.6, layer: 1 }));
      st.push(S("sphere", [60, -30, 232], [42, 26, 22], { color: C("#e8b35a"), layer: 1 }));
    }
    return st;
  }
  function chair() {
    const st = [];
    st.push(S("cube", [0, 0, 120], [70, 70, 10], { color: wood(), round: 0.2 }));
    st.push(S("cube", [0, -64, 220], [70, 8, 90], { color: wood(), round: 0.3 }));
    for (const [x, y] of [[55, 55], [-55, 55], [55, -55], [-55, -55]]) st.push(S("joint", [x, y, 60], [9, 9, 55], { color: dark() }));
    return st;
  }
  function rug(v) {
    const st = [], c = C(CLANS[v % CLANS.length].color);
    st.push(S("cylinder", [0, 0, 4], [340, 230, 4], { color: c }));
    st.push(S("cylinder", [0, 0, 6], [290, 185, 4], { color: C("#fff4d6") }));
    st.push(S("cylinder", [0, 0, 8], [200, 120, 4], { color: c }));
    return st;
  }
  function shelf() {
    const st = [], cols = ["#e8443a", "#2f8fe0", "#3cbf6c", "#ffd23f", "#8a4fd8", "#ff8fc0"];
    st.push(S("cube", [0, 0, 260], [170, 50, 260], { color: wood() }));
    st.push(S("cube", [0, 20, 260], [150, 40, 240], { m: "sub", color: wood() }));
    for (let r = 0; r < 3; r++) st.push(S("cube", [0, 10, 100 + r * 160], [150, 40, 8], { color: dark() }));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) st.push(S("cube", [-120 + k * 46, 12, 160 + r * 160], [16, 32, 50 - ((k * 7 + r * 3) % 4) * 6], { color: C(cols[(k + r) % 6]), layer: 1 }));
    return st;
  }
  function stove() {
    const st = [], fire = C("#ffb020");
    st.push(S("cube", [0, 0, 150], [170, 110, 150], { color: stone(), round: 0.15 }));
    st.push(S("cube", [0, 60, 110], [100, 70, 80], { m: "sub", color: stone() }));
    st.push(S("cube", [0, -40, 420], [70, 60, 130], { color: stone2() }));
    st.push(S("sphere", [0, 50, 70], [60, 40, 50], { color: fire, layer: 1 }));
    st.push(S("sphere", [0, 50, 40], [80, 40, 20], { color: dark(), layer: 1 }));
    return st;
  }
  function plant() {
    const st = [];
    st.push(S("cylinder", [0, 0, 60], [60, 60, 60], { color: C("#c96a3a"), cone: -0.3 }));
    st.push(S("sphere", [0, 0, 190], [90, 90, 90], { color: C("#3cbf6c"), layer: 1 }));
    st.push(S("sphere", [40, 20, 260], [55, 55, 55], { color: C("#2e8b3a"), layer: 1 }));
    return st;
  }
  // a framed picture of the Maker's statue, for a wall
  function picture() {
    const st = [];
    st.push(S("cube", [0, 0, 150], [120, 10, 150], { color: gold() }));
    st.push(S("cube", [0, 8, 150], [100, 6, 130], { color: C("#8fd3f4") }));
    st.push(S("sphere", [0, 14, 130], [40, 6, 50], { color: gold(), layer: 1 }));
    st.push(S("sphere", [0, 14, 200], [36, 6, 32], { color: gold(), layer: 1 }));
    st.push(S("joint", [40, 14, 200], [9, 4, 40], { color: gold(), rot: dir(0.5, 0, 1), mirror: true, offsX: 40, layer: 1 }));
    return st;
  }
  function window_() {
    const st = [];
    st.push(S("cube", [0, 0, 300], [130, 12, 110], { color: C("#ffffff") }));
    st.push(S("cube", [0, 6, 300], [112, 8, 92], { color: C("#8fd3f4") }));
    st.push(S("cube", [0, 10, 300], [6, 6, 92], { color: C("#ffffff"), layer: 1 }));
    st.push(S("cube", [0, 10, 300], [112, 6, 6], { color: C("#ffffff"), layer: 1 }));
    return st;
  }
  // the doormat: where you come in and go out
  function mat() {
    const st = [];
    st.push(S("cube", [0, 0, 4], [150, 90, 4], { color: C("#c79a62"), round: 0.3 }));
    st.push(S("cube", [0, 0, 6], [120, 66, 3], { color: C("#e8443a"), round: 0.3 }));
    return st;
  }
  // ---------- the town hall ----------
  function longtable() {
    const st = [];
    st.push(S("cube", [0, 0, 210], [160, 520, 14], { color: wood(), round: 0.15 }));
    for (const y of [-440, 440]) st.push(S("cube", [0, y, 100], [130, 20, 100], { color: dark() }));
    for (let k = 0; k < 3; k++) { st.push(S("joint", [0, -240 + k * 240, 250], [8, 8, 30], { color: C("#fff4d6"), layer: 1 + k })); st.push(S("sphere", [0, -240 + k * 240, 290], [8, 8, 12], { color: C("#ffb020"), layer: 1 + k })); }
    return st;
  }
  function banner(v) {
    const st = [], c = C(CLANS[v % CLANS.length].color);
    st.push(S("joint", [0, 0, 560], [8, 8, 150], { color: dark(), rot: dir(1, 0, 0) }));
    st.push(S("cube", [0, 0, 380], [120, 6, 170], { color: c }));
    st.push(S("cube", [0, 4, 400], [50, 4, 50], { color: gold(), round: 0.5 }));
    return st;
  }
  function throne() {
    const st = [], red = C("#e8443a");
    st.push(S("cube", [0, 0, 120], [120, 110, 30], { color: gold(), round: 0.2 }));
    st.push(S("cube", [0, -100, 330], [120, 18, 220], { color: gold(), round: 0.2 }));
    st.push(S("cube", [0, -5, 156], [100, 90, 10], { color: red, round: 0.3, layer: 1 }));
    st.push(S("cube", [0, -85, 330], [96, 6, 190], { color: red, round: 0.3, layer: 1 }));
    return st;
  }
  // ---------- the granary ----------
  function sacks() {
    const st = [], sack = C("#d8b98a"), tie = C("#a0703a");
    for (const [x, y, z, r] of [[-90, 0, 70, 80], [90, 10, 70, 80], [0, 60, 70, 76], [0, -30, 190, 74], [-60, 40, 300, 60]]) st.push(S("sphere", [x, y, z], [r, r * 0.85, r], { color: sack, blend: 6 }));
    st.push(S("sphere", [-60, 40, 360], [20, 20, 14], { color: tie, layer: 1 }));
    st.push(S("sphere", [0, -30, 260], [20, 20, 14], { color: tie, layer: 1 }));
    return st;
  }
  function barrel() {
    const st = [];
    st.push(S("cylinder", [0, 0, 150], [100, 100, 150], { color: wood(), round: 10 }));
    st.push(S("cylinder", [0, 0, 60], [104, 104, 10], { m: "rep", color: dark() }));
    st.push(S("cylinder", [0, 0, 240], [104, 104, 10], { m: "rep", color: dark() }));
    return st;
  }
  // ---------- dungeons ----------
  function torch() {
    const st = [];
    st.push(S("joint", [0, 0, 300], [12, 12, 70], { color: dark(), rot: dir(0, 0.5, 1) }));
    st.push(S("sphere", [0, 40, 390], [26, 26, 40], { color: C("#ffb020") }));
    st.push(S("sphere", [0, 40, 410], [14, 14, 24], { color: C("#fff4d6"), layer: 1 }));
    st.push(S("cube", [0, -20, 260], [30, 10, 40], { color: stone(), layer: 1 }));
    return st;
  }
  function chest(v) {
    const st = [];
    st.push(S("cube", [0, 0, 90], [150, 100, 90], { color: wood(), round: 0.1 }));
    st.push(S("cylinder", [0, 0, 180], [150, 100, 60], { color: wood(), rot: [0, 1.5708, 0], m: "add" }));
    st.push(S("cube", [0, 0, 90], [154, 104, 12], { m: "rep", color: gold() }));
    st.push(S("cube", [0, 102, 150], [24, 6, 30], { color: gold(), layer: 1 }));
    st.push(S("cube", [-120, 0, 150], [10, 106, 110], { color: gold(), mirror: true, offsX: -120, layer: 1 }));
    if (v === 1) st.push(S("sphere", [0, 0, 240], [110, 70, 40], { color: gold(), layer: 2 }), S("sphere", [40, 20, 270], [26, 26, 40], { color: C("#c9a6ff"), layer: 2 }));
    return st;
  }
  // a cluster of Ethernum crystals
  function crystal() {
    const st = [], a = C("#c9a6ff"), b = C("#8fd3f4");
    st.push(S("cube", [0, 0, 40], [130, 110, 40], { color: stone(), round: 0.5 }));
    st.push(S("cylinder", [0, 0, 200], [40, 40, 160], { color: a, cone: 1, layer: 1 }));
    st.push(S("cylinder", [60, 30, 150], [30, 30, 110], { color: b, cone: 1, rot: dir(0.4, 0.2, 1), layer: 1 }));
    st.push(S("cylinder", [-55, -20, 140], [28, 28, 100], { color: a, cone: 1, rot: dir(-0.4, -0.1, 1), layer: 1 }));
    return st;
  }
  function pillar() {
    const st = [];
    st.push(S("cylinder", [0, 0, 330], [70, 70, 330], { color: stone2() }));
    st.push(S("cube", [0, 0, 30], [100, 100, 30], { color: stone() }));
    st.push(S("cube", [0, 0, 650], [100, 100, 25], { color: stone() }));
    return st;
  }
  function ladder() {
    const st = [];
    st.push(S("cube", [70, 0, 300], [12, 12, 300], { color: wood(), mirror: true, offsX: 70 }));
    for (let k = 0; k < 6; k++) st.push(S("cube", [0, 0, 60 + k * 95], [70, 10, 8], { color: dark() }));
    return st;
  }
  // a stair cut down into the floor (going to a deeper level)
  function stairs() {
    const st = [];
    st.push(S("cube", [0, 0, 20], [170, 220, 20], { color: stone() }));
    st.push(S("cube", [0, 0, 20], [140, 190, 30], { m: "sub", color: stone() }));
    for (let k = 0; k < 4; k++) st.push(S("cube", [0, -150 + k * 70, 24 - k * 6], [138, 34, 6], { color: stone2(), layer: 1 }));
    st.push(S("cube", [0, 120, 12], [138, 60, 4], { color: C("#111111"), layer: 1 }));
    return st;
  }
  function rubble() {
    const st = [];
    for (const [x, y, r] of [[0, 0, 60], [70, 30, 40], [-60, 40, 35], [30, -60, 30]]) st.push(S("sphere", [x, y, r * 0.7], [r, r * 0.9, r * 0.7], { color: stone(), blend: 6 }));
    return st;
  }
  // ---------- mines ----------
  function mineframe() {
    const st = [];
    st.push(S("cube", [170, 0, 260], [20, 20, 260], { color: wood(), mirror: true, offsX: 170 }));
    st.push(S("cube", [0, 0, 540], [210, 24, 22], { color: wood() }));
    st.push(S("cube", [120, 0, 470], [10, 10, 60], { color: dark(), rot: dir(1, 0, 1), mirror: true, offsX: 120, layer: 1 }));
    st.push(S("cube", [0, 0, 500], [8, 8, 8], { color: dark(), layer: 1 }));
    return st;
  }
  // a vein of ore in the rock: 0 stone, 1 iron, 2 gold, 3 orichalcum (the legendary one, rose-gold and glowing)
  const ORE = [["#9a9a9a", "#c8c8c8"], ["#9a9a9a", "#b0302b"], ["#8a7a6a", "#ffd23f"], ["#6a5a7a", "#ff8f6a"], ["#8a7a6a", "#c96a3a"], ["#7a7a8a", "#f4f8fc"], ["#7a7a7a", "#222222"], ["#6a6a7a", "#2f8fe0"]];
  function orevein(v) {
    const st = [], [rock, ore] = ORE[v] || ORE[0];
    st.push(S("sphere", [0, 0, 160], [190, 150, 170], { color: C(rock) }));
    st.push(S("sphere", [90, -60, 90], [120, 110, 100], { color: C(rock), blend: 30 }));
    for (const [x, y, z, r] of [[-60, 130, 200, 34], [40, 135, 120, 28], [90, 110, 230, 24], [-20, 140, 280, 22], [-110, 100, 110, 26]]) st.push(S("sphere", [x, y, z], [r, r * 0.6, r], { color: C(ore), layer: 1 }));
    if (v === 3) st.push(S("sphere", [0, 150, 180], [60, 10, 60], { color: C("#ffd23f"), layer: 2 }), S("sphere", [0, 152, 180], [30, 8, 30], { color: C("#ffffff"), layer: 2 }));
    if (v === 7) st.push(S("cylinder", [50, 130, 250], [22, 22, 40], { color: C("#e8443a"), cone: 1, rot: dir(0.3, 1, 0.4), layer: 2 }), S("cylinder", [-70, 130, 160], [20, 20, 36], { color: C("#3cbf6c"), cone: 1, rot: dir(-0.3, 1, 0.3), layer: 2 }));
    return st;
  }
  function cart() {
    const st = [];
    st.push(S("cube", [0, 0, 130], [110, 160, 70], { color: C("#7a7a7a"), round: 0.1 }));
    st.push(S("cube", [0, 0, 150], [95, 145, 60], { m: "sub", color: C("#7a7a7a") }));
    for (const y of [-100, 100]) st.push(S("cylinder", [115, y, 45], [40, 40, 10], { color: dark(), rot: [0, 1.5708, 0], mirror: true, offsX: 115 }));
    st.push(S("sphere", [0, 0, 180], [90, 130, 40], { color: C("#5a5a5a"), layer: 1 }));
    st.push(S("sphere", [30, 40, 210], [24, 24, 20], { color: C("#ffd23f"), layer: 1 }));
    return st;
  }
  function rails() {
    const st = [];
    st.push(S("cube", [80, 0, 12], [8, 320, 8], { color: C("#7a7a7a"), mirror: true, offsX: 80 }));
    for (let k = 0; k < 5; k++) st.push(S("cube", [0, -260 + k * 130, 5], [110, 18, 5], { color: dark() }));
    return st;
  }
  function lantern() {
    const st = [];
    st.push(S("joint", [0, 0, 250], [10, 10, 240], { color: dark() }));
    st.push(S("cube", [0, 30, 470], [12, 40, 8], { color: dark() }));
    st.push(S("cube", [0, 60, 420], [26, 26, 36], { color: C("#ffd23f"), round: 0.3, layer: 1 }));
    st.push(S("cube", [0, 60, 460], [30, 30, 6], { color: dark(), layer: 1 }));
    return st;
  }
  // the way into a mine: a rocky hill with a great timber portal, a sign and two lanterns, and rails
  // running out of the dark with a loaded cart on them (front, +y); in the world it is sunk into a cutting
  function mine() {
    const st = [], rock = C("#8a8a8a"), rock2 = C("#6a6a6a"), board = C("#c79a62");
    // layer 0: the hill, with the tunnel cut into it
    st.push(S("sphere", [0, -160, 260], [420, 300, 320], { color: rock }));
    st.push(S("sphere", [-300, -90, 180], [210, 200, 210], { color: rock2, blend: 50 }));
    st.push(S("sphere", [300, -120, 200], [200, 190, 220], { color: rock, blend: 50 }));
    st.push(S("sphere", [90, -260, 520], [170, 150, 120], { color: rock2, blend: 40 }));
    st.push(S("cube", [0, 200, 170], [130, 190, 170], { m: "sub", color: rock }));
    st.push(S("cube", [0, 180, 150], [114, 60, 150], { color: C("#111111") }));
    // layer 1: the timber portal: posts, a lintel with braces, and a sign board
    st.push(S("cube", [145, 250, 200], [26, 26, 200], { color: wood(), mirror: true, offsX: 145, layer: 1 }));
    st.push(S("cube", [0, 250, 410], [190, 30, 28], { color: wood(), layer: 1 }));
    st.push(S("cube", [95, 250, 360], [10, 14, 60], { color: dark(), rot: dir(1, 0, 1), mirror: true, offsX: 95, layer: 1 }));
    st.push(S("cube", [0, 268, 480], [110, 10, 44], { color: board, round: 0.2, layer: 1 }));
    st.push(S("cube", [0, 276, 480], [80, 4, 14], { color: dark(), layer: 1 }));
    // layer 2: lanterns on the posts
    st.push(S("cube", [145, 290, 330], [22, 22, 30], { color: gold(), round: 0.3, mirror: true, offsX: 145, layer: 2 }));
    st.push(S("cube", [145, 290, 366], [26, 26, 6], { color: dark(), mirror: true, offsX: 145, layer: 2 }));
    // layer 3: rails running out of the tunnel
    st.push(S("cube", [60, 520, 10], [8, 330, 8], { color: C("#7a7a7a"), mirror: true, offsX: 60, layer: 3 }));
    for (let k = 0; k < 7; k++) st.push(S("cube", [0, 230 + k * 95, 4], [88, 14, 5], { color: dark(), layer: 3 }));
    // layer 4: the cart on the rails, loaded with ore
    st.push(S("cube", [0, 560, 120], [95, 130, 62], { color: C("#7a7a7a"), round: 0.1, layer: 4 }));
    st.push(S("cube", [0, 560, 138], [82, 117, 54], { m: "sub", color: C("#7a7a7a"), layer: 4 }));
    st.push(S("cylinder", [100, 480, 42], [36, 36, 9], { color: dark(), rot: [0, 1.5708, 0], mirror: true, offsX: 100, layer: 4 }));
    st.push(S("cylinder", [100, 640, 42], [36, 36, 9], { color: dark(), rot: [0, 1.5708, 0], mirror: true, offsX: 100, layer: 4 }));
    st.push(S("sphere", [0, 560, 170], [80, 110, 36], { color: C("#5a5a5a"), layer: 5 }));
    st.push(S("sphere", [25, 590, 196], [22, 22, 18], { color: C("#ffd23f"), layer: 5 }));
    st.push(S("sphere", [-30, 530, 192], [20, 20, 16], { color: C("#f4f8fc"), layer: 5 }));
    return st;
  }
  // a field of Ether crystals out in the wild: tall glowing spires on a rocky base
  function etherfield(v) {
    const st = [], a = C("#c9a6ff"), b = C("#8fd3f4"), r = (k) => (Math.sin((v + 1) * 12.9898 + k * 78.233) * 43758.5453) % 1;
    st.push(S("sphere", [0, 0, 30], [150, 130, 50], { color: C("#7a7a8a"), blend: 10 }));
    st.push(S("sphere", [70, -40, 25], [80, 70, 40], { color: C("#6a6a7a"), blend: 20 }));
    st.push(S("cylinder", [0, 0, 260], [46, 46, 240], { color: a, cone: 1, layer: 1 }));
    st.push(S("cylinder", [70, 40, 170], [34, 34, 160], { color: b, cone: 1, rot: dir(0.35, 0.2, 1), layer: 1 }));
    st.push(S("cylinder", [-70, -20, 150], [32, 32, 140], { color: a, cone: 1, rot: dir(-0.4, -0.1, 1), layer: 1 }));
    st.push(S("cylinder", [20, -70, 120], [26, 26, 110], { color: b, cone: 1, rot: dir(0.1, -0.45, 1), layer: 1 }));
    st.push(S("sphere", [0, 0, 120], [40, 40, 40], { color: C("#ffffff"), layer: 2 }));
    st.push(S("sphere", [0, 0, 120], [60, 60, 20], { color: b, layer: 2 }));
    return st;
  }

  // ---------- life in the great lake (none of it a Tickle species) ----------
  function swan() {
    const st = [], white = C("#ffffff");
    st.push(S("sphere", [0, 0, 90], [100, 170, 75], { color: white }));
    st.push(S("sphere", [0, -150, 120], [70, 60, 50], { color: white, blend: 20 }));
    st.push(S("joint", [0, 120, 180], [22, 22, 70], { color: white, rot: dir(0, 0.35, 1), blend: 12 }));
    st.push(S("sphere", [0, 150, 270], [30, 42, 28], { color: white, blend: 8 }));
    st.push(S("cylinder", [0, 200, 268], [12, 12, 26], { color: C("#ff8f3a"), cone: 1, rot: dir(0, 1, -0.2), layer: 1 }));
    st.push(S("sphere", [22, 165, 280], [6, 6, 6], { color: C("#111111"), mirror: true, offsX: 22, layer: 1 }));
    return st;
  }
  function turtle() {
    const st = [], shell = C("#5a7a3a"), skin = C("#8fbf6a");
    st.push(S("sphere", [0, 0, 50], [110, 140, 50], { color: shell }));
    st.push(S("sphere", [0, 0, 62], [80, 105, 40], { m: "rep", color: C("#7a9a4a") }));
    st.push(S("sphere", [0, 160, 40], [34, 40, 28], { color: skin, layer: 1 }));
    st.push(S("sphere", [95, 80, 25], [50, 22, 10], { color: skin, mirror: true, offsX: 95, layer: 1 }));
    st.push(S("sphere", [80, -90, 25], [40, 20, 10], { color: skin, mirror: true, offsX: 80, layer: 1 }));
    return st;
  }
  function frog() {
    const st = [], g = C("#3cbf6c");
    st.push(S("sphere", [0, 0, 40], [55, 65, 38], { color: g }));
    st.push(S("sphere", [26, 40, 70], [16, 16, 16], { color: C("#ffffff"), mirror: true, offsX: 26, layer: 1 }));
    st.push(S("sphere", [26, 52, 72], [8, 6, 8], { color: C("#111111"), mirror: true, offsX: 26, layer: 1 }));
    st.push(S("sphere", [55, -30, 18], [30, 40, 14], { color: C("#2e8b3a"), mirror: true, offsX: 55, layer: 2 }));
    st.push(S("sphere", [40, 45, 12], [16, 22, 10], { color: C("#2e8b3a"), mirror: true, offsX: 40, layer: 2 }));
    return st;
  }
  function heron() {
    const st = [], grey = C("#b8c0c8"), dark = C("#5a6470");
    st.push(S("sphere", [0, 0, 300], [55, 110, 60], { color: grey }));
    st.push(S("joint", [0, 90, 400], [16, 16, 70], { color: grey, rot: dir(0, 0.4, 1), blend: 10 }));
    st.push(S("sphere", [0, 120, 470], [26, 36, 24], { color: C("#ffffff"), blend: 6 }));
    st.push(S("cylinder", [0, 175, 470], [9, 9, 40], { color: C("#ffd23f"), cone: 1, rot: dir(0, 1, 0), layer: 1 }));
    st.push(S("joint", [24, 0, 130], [7, 7, 120], { color: C("#ffb020"), mirror: true, offsX: 24, layer: 1 }));
    st.push(S("sphere", [0, -100, 310], [40, 60, 30], { color: dark, layer: 2 }));
    st.push(S("sphere", [0, 120, 492], [16, 30, 6], { color: dark, layer: 2 }));
    return st;
  }
  function otter() {
    const st = [], b = C("#7a4a24");
    st.push(S("sphere", [0, 0, 40], [45, 150, 38], { color: b }));
    st.push(S("sphere", [0, 150, 55], [36, 40, 32], { color: b, blend: 12 }));
    st.push(S("joint", [0, -180, 30], [14, 14, 60], { color: b, rot: dir(0, 1, 0.1), blend: 8 }));
    st.push(S("sphere", [0, 175, 55], [22, 20, 18], { color: C("#d8b98a"), layer: 1 }));
    st.push(S("sphere", [16, 170, 72], [6, 6, 6], { color: C("#111111"), mirror: true, offsX: 16, layer: 1 }));
    return st;
  }
  function koi(v) {
    const st = [], c = C(["#ff8f3a", "#ffffff", "#ffd23f"][v % 3]);
    st.push(S("sphere", [0, 0, 40], [34, 110, 40], { color: c }));
    st.push(S("sphere", [0, 30, 60], [24, 40, 20], { m: "rep", color: C(v === 1 ? "#ff8f3a" : "#ffffff") }));
    st.push(S("cube", [0, -120, 40], [6, 30, 36], { color: c, layer: 1 }));
    st.push(S("sphere", [14, 90, 48], [5, 5, 5], { color: C("#111111"), mirror: true, offsX: 14, layer: 1 }));
    return st;
  }
  function lilypad(v) {
    const st = [], g = C("#3cbf6c");
    st.push(S("cylinder", [0, 0, 4], [120, 120, 4], { color: g }));
    st.push(S("cube", [60, 0, 4], [60, 12, 10], { m: "sub", color: g, rot: [0, 0, 0.3] }));
    st.push(S("cylinder", [0, 0, 7], [70, 70, 2], { color: C("#2e8b3a"), layer: 1 }));
    st.push(S("cylinder", [0, 0, 8], [6, 120, 2], { color: C("#2e8b3a"), layer: 1 }));
    if (v === 1) {
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283; st.push(S("sphere", [Math.cos(a) * 28, Math.sin(a) * 28, 30], [22, 14, 26], { color: C("#ff8fc0"), rot: [0, 0, a], layer: 2 })); }
      st.push(S("sphere", [0, 0, 36], [16, 16, 12], { color: C("#ffd23f"), layer: 2 }));
    }
    return st;
  }
  function cattail() {
    const st = [], g = C("#5aa04a");
    for (const [x, y, h] of [[0, 0, 260], [40, 20, 220], [-35, 25, 240], [15, -35, 200], [-20, -25, 180]]) {
      st.push(S("joint", [x, y, h / 2], [6, 6, h / 2], { color: g }));
      st.push(S("cylinder", [x, y, h - 20], [12, 12, 30], { color: C("#7a4a24"), layer: 1 }));
    }
    st.push(S("cube", [60, 0, 90], [4, 30, 90], { color: g, rot: dir(0.3, 0, 1), layer: 2 }), S("cube", [-60, 0, 80], [4, 30, 80], { color: g, rot: dir(-0.3, 0, 1), layer: 2 }));
    return st;
  }
  function seaweed() {
    const st = [], g = C("#2e8b3a"), g2 = C("#3cbf6c");
    for (const [x, y, h, lean] of [[0, 0, 180, 0.2], [40, 30, 140, -0.3], [-40, 10, 160, 0.35], [10, -40, 120, -0.2]]) {
      st.push(S("joint", [x, y, h * 0.3], [10, 10, h * 0.3], { color: g }));
      st.push(S("joint", [x + lean * 40, y, h * 0.8], [9, 9, h * 0.25], { color: g2, rot: dir(lean, 0, 1), layer: 1 }));
    }
    return st;
  }

  // ---------- more looks for dungeon mouths, mine entrances and arenas ----------
  function skullCave() {
    const st = [], rock = C("#6a6a6a"), bone = C("#e8e2d0"), black = C("#111111"), glow = C("#c9a6ff");
    st.push(S("sphere", [0, -60, 200], [320, 260, 240], { color: rock }));
    st.push(S("sphere", [-220, -80, 130], [170, 160, 150], { color: C("#5a5a5a"), blend: 50 }));
    st.push(S("sphere", [230, -90, 140], [160, 150, 160], { color: rock, blend: 50 }));
    // layer 1: a giant skull carved into the rock, its jaw the way in
    st.push(S("sphere", [0, 190, 300], [200, 120, 180], { color: bone, layer: 1 }));
    st.push(S("cube", [0, 220, 120], [130, 100, 90], { color: bone, round: 0.3, layer: 1 }));
    st.push(S("sphere", [80, 290, 330], [55, 40, 50], { m: "sub", color: bone, mirror: true, offsX: 80, layer: 1 }));
    st.push(S("cube", [0, 290, 110], [90, 60, 90], { m: "sub", color: bone, layer: 1 }));
    // layer 2: glowing eyes, the dark mouth, the nose
    st.push(S("sphere", [80, 262, 330], [26, 10, 22], { color: glow, mirror: true, offsX: 80, layer: 2 }));
    st.push(S("cube", [0, 248, 105], [86, 10, 86], { color: black, layer: 2 }));
    st.push(S("sphere", [0, 300, 232], [24, 12, 26], { color: black, layer: 2 }));
    // layer 3: fangs and scattered bones
    for (let k = 0; k < 4; k++) st.push(S("cylinder", [-60 + k * 40, 290, 180], [14, 14, 30], { color: bone, cone: 1, rot: [3.1416, 0, 0], layer: 3 }));
    st.push(S("joint", [170, 330, 15], [10, 10, 50], { color: bone, rot: dir(1, 0.3, 0), layer: 3 }));
    st.push(S("joint", [-180, 310, 15], [10, 10, 44], { color: bone, rot: dir(1, -0.4, 0), layer: 3 }));
    return st;
  }
  function crystalGrotto() {
    const st = [], rock = C("#5a5a7a"), a = C("#c9a6ff"), b = C("#8fd3f4");
    st.push(S("sphere", [0, -60, 200], [320, 250, 230], { color: rock }));
    st.push(S("sphere", [-200, -40, 130], [160, 160, 140], { color: C("#4a4a6a"), blend: 50 }));
    st.push(S("cube", [0, 240, 150], [150, 120, 150], { m: "sub", color: rock }));
    st.push(S("sphere", [0, 222, 130], [120, 26, 130], { color: C("#111122") }));
    // layer 1: crystals bursting out of the hill
    for (const [x, y, z, r, h, dx, dy] of [[-150, 60, 330, 50, 200, -0.4, 0.2], [120, 40, 360, 56, 230, 0.35, 0.1], [-40, -80, 420, 44, 180, -0.1, -0.3], [230, 120, 200, 40, 150, 0.6, 0.3], [-240, 140, 180, 38, 140, -0.6, 0.4], [60, 180, 330, 30, 110, 0.2, 0.6]])
      st.push(S("cylinder", [x, y, z], [r, r, h], { color: x > 0 ? b : a, cone: 1, rot: dir(dx, dy, 1), layer: 1 }));
    // layer 2: a glow in the mouth
    st.push(S("sphere", [0, 230, 150], [70, 20, 70], { color: a, layer: 2 }));
    st.push(S("sphere", [0, 236, 150], [36, 12, 36], { color: C("#ffffff"), layer: 2 }));
    return st;
  }
  function ruinedTower() {
    const st = [], stone = C("#b8b0a0"), stone2 = C("#8a8478"), moss = C("#3cbf6c");
    st.push(S("cylinder", [0, -40, 300], [190, 190, 300], { color: stone }));
    st.push(S("cylinder", [0, -40, 330], [150, 150, 320], { m: "sub", color: stone }));
    st.push(S("cube", [130, -120, 560], [150, 190, 110], { m: "sub", color: stone, rot: [0.45, 0, 0.35] }));
    st.push(S("cube", [0, 160, 140], [80, 70, 140], { m: "sub", color: stone }));
    st.push(S("sphere", [-120, -150, 420], [110, 60, 90], { m: "rep", color: moss }));
    // layer 1: the arch over the door and the dark way down
    st.push(S("cylinder", [0, 165, 270], [100, 100, 26], { color: stone2, rot: [1.5708, 0, 0], hole: 0.72, layer: 1 }));
    st.push(S("cube", [0, 145, 120], [76, 20, 120], { color: C("#111111"), layer: 1 }));
    // layer 2: fallen stones; layer 3: a torch by the door
    for (const [x, y, r] of [[200, 180, 50], [-210, 150, 60], [140, 260, 34], [-120, 280, 30]]) st.push(S("cube", [x, y, r], [r, r * 0.9, r], { color: stone2, rot: [0, 0, x * 0.01], round: 0.3, layer: 2 }));
    st.push(S("joint", [120, 175, 230], [8, 8, 40], { color: C("#6b4a2b"), layer: 3 }));
    st.push(S("sphere", [120, 175, 285], [18, 18, 26], { color: C("#ffb020"), layer: 3 }));
    return st;
  }
  function mineArch() {
    const st = [], rock = C("#8a7a6a"), stone = C("#c8c0b0"), iron = C("#5a5a5a");
    st.push(S("cube", [0, -140, 260], [420, 220, 260], { color: rock, round: 0.5 }));
    st.push(S("sphere", [-260, -60, 160], [180, 160, 170], { color: C("#7a6a5a"), blend: 40 }));
    st.push(S("cube", [0, 100, 170], [120, 200, 170], { m: "sub", color: rock }));
    st.push(S("cube", [0, 80, 140], [104, 40, 140], { color: C("#111111") }));
    // layer 1: a stone arch with a keystone; layer 2: an open iron gate
    st.push(S("cylinder", [0, 100, 300], [170, 170, 40], { color: stone, rot: [1.5708, 0, 0], hole: 0.7, layer: 1 }));
    st.push(S("cube", [140, 100, 150], [34, 40, 150], { color: stone, mirror: true, offsX: 140, layer: 1 }));
    st.push(S("cube", [0, 112, 470], [30, 30, 40], { color: C("#ffd23f"), layer: 1 }));
    for (let k = 0; k < 4; k++) st.push(S("cube", [-210, 150 + k * 22, 140], [4, 4, 130], { color: iron, layer: 2 }));
    st.push(S("cube", [-210, 183, 260], [4, 40, 6], { color: iron, layer: 2 }));
    // layer 3: rails; layer 4: a cart full of silver ore
    st.push(S("cube", [60, 450, 10], [8, 330, 8], { color: C("#7a7a7a"), mirror: true, offsX: 60, layer: 3 }));
    for (let k = 0; k < 7; k++) st.push(S("cube", [0, 160 + k * 95, 4], [88, 14, 5], { color: C("#6b4a2b"), layer: 3 }));
    st.push(S("cube", [0, 520, 120], [95, 130, 62], { color: C("#7a7a7a"), round: 0.1, layer: 4 }));
    st.push(S("sphere", [0, 520, 175], [80, 110, 36], { color: C("#f4f8fc"), layer: 4 }));
    return st;
  }
  function mineShaft() {
    const st = [], wood2 = C("#8a5a2b"), stone = C("#9a9a9a");
    st.push(S("cylinder", [0, 0, 20], [300, 300, 20], { color: stone }));
    st.push(S("cylinder", [0, 120, 30], [90, 90, 40], { m: "sub", color: stone }));
    st.push(S("cylinder", [0, 120, 22], [86, 86, 4], { color: C("#111111") }));
    // layer 1: the headframe over the shaft; layer 2: its wheel and cable
    st.push(S("joint", [110, 50, 320], [16, 16, 300], { color: wood2, rot: dir(-0.3, 0.2, 1), mirror: true, offsX: 110, layer: 1 }));
    st.push(S("joint", [110, 200, 320], [16, 16, 300], { color: wood2, rot: dir(-0.3, -0.25, 1), mirror: true, offsX: 110, layer: 1 }));
    st.push(S("cube", [0, 120, 610], [80, 80, 20], { color: wood2, layer: 1 }));
    st.push(S("cylinder", [0, 120, 690], [80, 80, 12], { color: C("#5a5a5a"), rot: [0, 1.5708, 0], hole: 0.75, layer: 2 }));
    st.push(S("cylinder", [0, 120, 690], [14, 14, 18], { color: C("#5a5a5a"), rot: [0, 1.5708, 0], layer: 2 }));
    st.push(S("joint", [0, 140, 380], [4, 4, 300], { color: C("#3a3a3a"), layer: 2 }));
    // layer 3: a shed; layer 4: rails; layer 5: a cart of copper ore
    st.push(S("cube", [-220, -120, 120], [90, 90, 110], { color: C("#c79a62"), layer: 3 }));
    st.push(S("cube", [-220, -120, 260], [100, 100, 40], { color: C("#e8443a"), cone: 1, layer: 3 }));
    st.push(S("cube", [60, 420, 10], [8, 220, 8], { color: C("#7a7a7a"), mirror: true, offsX: 60, layer: 4 }));
    for (let k = 0; k < 5; k++) st.push(S("cube", [0, 240 + k * 90, 4], [88, 14, 5], { color: C("#6b4a2b"), layer: 4 }));
    st.push(S("cube", [0, 470, 120], [95, 130, 62], { color: C("#7a7a7a"), round: 0.1, layer: 5 }));
    st.push(S("sphere", [0, 470, 175], [80, 110, 36], { color: C("#c96a3a"), layer: 5 }));
    return st;
  }
  function mineHill() {
    const st = [], grass = C("#3cbf6c"), brick = C("#b0302b");
    st.push(S("sphere", [0, -120, 120], [380, 300, 260], { color: grass }));
    st.push(S("sphere", [-240, -60, 80], [200, 180, 160], { color: C("#2e8b3a"), blend: 40 }));
    st.push(S("cylinder", [0, 150, 150], [110, 110, 160], { m: "sub", color: grass, rot: [1.5708, 0, 0] }));
    st.push(S("cylinder", [0, 140, 150], [100, 100, 30], { color: C("#111111"), rot: [1.5708, 0, 0] }));
    // layer 1: a brick ring round the tunnel and lantern posts; layer 2: lanterns and a sign
    st.push(S("cylinder", [0, 170, 150], [130, 130, 30], { color: brick, rot: [1.5708, 0, 0], hole: 0.8, layer: 1 }));
    st.push(S("joint", [190, 230, 120], [8, 8, 120], { color: C("#6b4a2b"), mirror: true, offsX: 190, layer: 1 }));
    st.push(S("cube", [190, 230, 250], [22, 22, 28], { color: C("#ffd23f"), round: 0.3, mirror: true, offsX: 190, layer: 2 }));
    st.push(S("cube", [0, 210, 330], [100, 10, 34], { color: C("#c79a62"), round: 0.2, layer: 2 }));
    // layer 3: rails; layer 4: a cart with gems on top
    st.push(S("cube", [60, 470, 10], [8, 300, 8], { color: C("#7a7a7a"), mirror: true, offsX: 60, layer: 3 }));
    for (let k = 0; k < 6; k++) st.push(S("cube", [0, 220 + k * 95, 4], [88, 14, 5], { color: C("#6b4a2b"), layer: 3 }));
    st.push(S("cube", [0, 520, 120], [95, 130, 62], { color: C("#7a7a7a"), round: 0.1, layer: 4 }));
    st.push(S("sphere", [0, 520, 175], [80, 110, 36], { color: C("#5a5a5a"), layer: 4 }));
    st.push(S("sphere", [30, 540, 200], [22, 22, 18], { color: C("#2f8fe0"), layer: 4 }));
    return st;
  }
  function woodenStadium() {
    const st = [], wood2 = C("#a0703a"), dark2 = C("#6b4a2b"), red = C("#e8443a");
    st.push(S("cylinder", [0, 0, 110], [470, 470, 110], { color: wood2, hole: 0.12 }));
    st.push(S("cylinder", [0, 0, 60], [420, 420, 60], { color: C("#c79a62"), hole: 0.15, blend: 4 }));
    st.push(S("cube", [0, 470, 110], [70, 90, 110], { m: "sub", color: wood2 }));
    // layer 1: sharpened stakes all round the top (none over the gate)
    for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.283; if (Math.sin(a) > 0.93) continue; st.push(S("cylinder", [Math.cos(a) * 470, Math.sin(a) * 470, 250], [24, 24, 40], { color: dark2, cone: 1, layer: 1 })); }
    // layer 2: banners on poles at the gate; layer 3: the emblem on the sand
    st.push(S("joint", [110, 480, 330], [8, 8, 120], { color: dark2, mirror: true, offsX: 110, layer: 2 }));
    st.push(S("cube", [140, 480, 400], [30, 4, 40], { color: red, mirror: true, offsX: 140, layer: 2 }));
    st.push(S("cylinder", [0, 0, 4], [78, 78, 4], { color: red, layer: 3 }));
    st.push(S("cylinder", [0, 0, 6], [44, 44, 4], { color: C("#ffd23f"), layer: 3 }));
    return st;
  }
  function amphitheatre() {
    const st = [], stone = C("#d8d0c0"), stone2 = C("#b0a898");
    // stepped seats in a horseshoe round the back, open at the front
    for (let k = 0; k < 3; k++) st.push(S("cylinder", [0, 0, 40 + k * 70], [480, 480, 40 + k * 70], { color: k % 2 ? stone2 : stone, hole: 0.82 - k * 0.05 }));
    st.push(S("cube", [0, 330, 250], [480, 200, 260], { m: "sub", color: stone }));
    // layer 1: columns along the back; layer 2: an architrave and the emblem
    for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI; st.push(S("cylinder", [Math.cos(a) * 440, Math.sin(a) * 440, 320], [26, 26, 110], { color: C("#ffffff"), layer: 1 })); }
    st.push(S("cylinder", [0, 0, 4], [78, 78, 4], { color: C("#2f8fe0"), layer: 2 }));
    st.push(S("cylinder", [0, 0, 6], [44, 44, 4], { color: C("#ffffff"), layer: 2 }));
    return st;
  }

  const I = { group: "Interiors" }, clanV = CLANS.map((_, i) => i);
  Object.assign(TB.KIT, {
    bed: Object.assign({ name: "Bed", variants: clanV, build: bed, voxel: [8], variantLabel: (v) => CLANS[v].species + " blanket" }, I),
    table: Object.assign({ name: "Table", variants: [0, 1], build: table, voxel: [8], variantLabel: (v) => (v ? "laid for breakfast" : "bare") }, I),
    chair: Object.assign({ name: "Chair", variants: [0], build: chair, voxel: [8] }, I),
    rug: Object.assign({ name: "Rug", variants: clanV, build: rug, voxel: [8], variantLabel: (v) => CLANS[v].species + " colours" }, I),
    shelf: Object.assign({ name: "Bookshelf", variants: [0], build: shelf, voxel: [8] }, I),
    stove: Object.assign({ name: "Stove", variants: [0], build: stove, voxel: [8] }, I),
    plant: Object.assign({ name: "House Plant", variants: [0], build: plant, voxel: [8] }, I),
    picture: Object.assign({ name: "Picture of the Maker", variants: [0], build: picture, voxel: [6] }, I),
    window: Object.assign({ name: "Window", variants: [0], build: window_, voxel: [8] }, I),
    mat: Object.assign({ name: "Doormat", variants: [0], build: mat, voxel: [6] }, I),
    longtable: Object.assign({ name: "Council Table", variants: [0], build: longtable, voxel: [8] }, I),
    banner: Object.assign({ name: "Clan Banner", variants: clanV, build: banner, voxel: [8], variantLabel: (v) => CLANS[v].species }, I),
    throne: Object.assign({ name: "Elder's Seat", variants: [0], build: throne, voxel: [8] }, I),
    sacks: Object.assign({ name: "Grain Sacks", variants: [0], build: sacks, voxel: [8] }, I),
    barrel: Object.assign({ name: "Barrel", variants: [0], build: barrel, voxel: [8] }, I),
    torch: Object.assign({ name: "Wall Torch", variants: [0], build: torch, voxel: [6] }, I),
    chest: Object.assign({ name: "Treasure Chest", variants: [0, 1], build: chest, voxel: [8], variantLabel: (v) => (v ? "open" : "closed") }, I),
    crystal: Object.assign({ name: "Ethernum Crystals", variants: [0], build: crystal, voxel: [8] }, I),
    pillar: Object.assign({ name: "Cave Pillar", variants: [0], build: pillar, voxel: [10] }, I),
    ladder: Object.assign({ name: "Ladder", variants: [0], build: ladder, voxel: [8] }, I),
    stairs: Object.assign({ name: "Stairs Down", variants: [0], build: stairs, voxel: [8] }, I),
    rubble: Object.assign({ name: "Rubble", variants: [0], build: rubble, voxel: [8] }, I),
    mineframe: Object.assign({ name: "Mine Props", variants: [0], build: mineframe, voxel: [8] }, I),
    orevein: Object.assign({ name: "Ore Vein", variants: [0, 1, 2, 3, 4, 5, 6, 7], build: orevein, voxel: [8], variantLabel: (v) => ["stone", "iron", "gold", "orichalcum", "copper", "silver", "coal", "gems"][v] }, I),
    cart: Object.assign({ name: "Mine Cart", variants: [0], build: cart, voxel: [8] }, I),
    rails: Object.assign({ name: "Mine Rails", variants: [0], build: rails, voxel: [8] }, I),
    lantern: Object.assign({ name: "Lantern", variants: [0], build: lantern, voxel: [6] }, I),
    mine: { name: "Mine Entrance", group: "Mines", variants: [0, 1, 2, 3], build: (v) => [mine, mineArch, mineShaft, mineHill][v || 0](), voxel: [14, 32], scenery: true, variantLabel: (v) => ["timber portal", "stone arch", "headframe and shaft", "hillside tunnel"][v] },
    swan: { name: "Swan", group: "Lake", variants: [0], build: swan, voxel: [7] },
    turtle: { name: "Lake Turtle", group: "Lake", variants: [0], build: turtle, voxel: [6] },
    frog: { name: "Frog", group: "Lake", variants: [0], build: frog, voxel: [4] },
    heron: { name: "Heron", group: "Lake", variants: [0], build: heron, voxel: [6] },
    otter: { name: "Otter", group: "Lake", variants: [0], build: otter, voxel: [5] },
    koi: { name: "Koi", group: "Lake", variants: [0, 1, 2], build: koi, voxel: [4], variantLabel: (v) => ["orange", "white", "gold"][v] },
    lilypad: { name: "Lily Pad", group: "Lake", variants: [0, 1], build: lilypad, voxel: [6], variantLabel: (v) => (v ? "in flower" : "leaf") },
    cattail: { name: "Cattails", group: "Lake", variants: [0], build: cattail, voxel: [6] },
    seaweed: { name: "Lake Weed", group: "Lake", variants: [0], build: seaweed, voxel: [6] },
    etherfield: { name: "Ether Crystals", group: "Mines", variants: [0], build: etherfield, voxel: [10, 26], scenery: true },
  });
  // dungeon mouths and arenas come in several looks too
  const D0 = TB.KIT.dungeon.build, A0 = TB.KIT.arena.build;
  Object.assign(TB.KIT.dungeon, { variants: [0, 1, 2, 3], build: (v) => (v ? [null, skullCave, crystalGrotto, ruinedTower][v]() : D0(0)), variantLabel: (v) => ["temple front", "skull cave", "crystal grotto", "ruined tower"][v] });
  Object.assign(TB.KIT.arena, { variants: [0, 1, 2], build: (v) => (v ? [null, woodenStadium, amphitheatre][v]() : A0(0)), variantLabel: (v) => ["stone colosseum", "wooden stadium", "amphitheatre"][v] });
})(typeof self !== "undefined" ? self : this);
