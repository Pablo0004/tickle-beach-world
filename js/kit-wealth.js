/* The wealth kit: what shells can buy, in the same stroke format and palette as the rest of the kit.
 * Bigger houses (a two-storey townhouse and a manor with a tower), the Blacksmiths' Guild (a forge
 * with anvils and a weapons rack), its horse paddock and its griffin roost, horses to ride (the body,
 * and one leg that is drawn four times so it can trot), a griffin to fly (body and wings apart, so the
 * wings can beat), and two private boats (a sailing boat and a yacht).
 * SDF units, z up, ground at z = 0, front +y; a Tickle is about 480 tall. Every layer holds at least
 * two strokes (the on-chain shader skips a layer with a single one). */
(function (G) {
  "use strict";
  const TB = G.TB, { C, S, dir, CLANS } = TB.kitHelpers;
  const clanV = CLANS.map((_, i) => i);
  const ACC = ["#e8443a", "#2f8fe0", "#3cbf6c", "#ffd23f", "#8a4fd8", "#ff7a2f"];

  // ---------- houses ----------
  // a townhouse: two storeys, timbered upstairs, a balcony over the door, flower boxes and a chimney
  function townhouse(clan) {
    const st = [], wall = C("#fff4d6"), up = C("#f3e2c0"), beam = C("#6b4a2b"), wood = C("#7a4a24"), stone = C("#9a9a9a"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color), red = C("#e8443a"), green = C("#3cbf6c");
    // layer 0: plinth, the two storeys, door and windows
    st.push(S("cube", [0, 0, 20], [345, 300, 20], { color: stone, round: 0.2 }));
    st.push(S("cube", [0, 0, 250], [320, 280, 230], { color: wall, round: 0.08, blend: 6 }));
    st.push(S("cube", [0, 0, 640], [335, 292, 165], { color: up, round: 0.05 }));
    st.push(S("cube", [0, 282, 150], [80, 14, 130], { m: "rep", color: wood }));
    st.push(S("cube", [0, 288, 150], [70, 8, 122], { color: wood, round: 0.3 }));
    st.push(S("cube", [195, 282, 300], [58, 14, 62], { m: "rep", color: glass, mirror: true, offsX: 195 }));
    st.push(S("cube", [200, 294, 650], [56, 14, 70], { m: "rep", color: glass, mirror: true, offsX: 200 }));
    st.push(S("cube", [322, 0, 300], [14, 70, 62], { m: "rep", color: glass, mirror: true, offsX: 322 }));
    st.push(S("cube", [336, 0, 650], [14, 70, 66], { m: "rep", color: glass, mirror: true, offsX: 336 }));
    // layer 1: the timber frame upstairs
    st.push(S("cube", [0, 296, 480], [340, 8, 14], { color: beam, layer: 1 }));
    st.push(S("cube", [0, 296, 800], [340, 8, 12], { color: beam, layer: 1 }));
    st.push(S("cube", [320, 296, 640], [14, 8, 165], { color: beam, mirror: true, offsX: 320, layer: 1 }));
    st.push(S("cube", [100, 296, 640], [10, 8, 165], { color: beam, mirror: true, offsX: 100, layer: 1 }));
    // layer 2: the balcony over the door, its rail, the flower boxes
    st.push(S("cube", [0, 330, 495], [130, 48, 12], { color: wood, layer: 2 }));
    st.push(S("cube", [0, 374, 560], [130, 5, 8], { color: wood, layer: 2 }));
    for (const x of [-120, -60, 0, 60, 120]) st.push(S("joint", [x, 372, 528], [5, 5, 32], { color: wood, layer: 2 }));
    st.push(S("cube", [195, 300, 228], [62, 18, 14], { color: wood, mirror: true, offsX: 195, layer: 2 }));
    // layer 3: flowers, the roof, eaves and chimney
    st.push(S("sphere", [195, 304, 250], [52, 14, 16], { color: red, mirror: true, offsX: 195, layer: 3 }));
    st.push(S("sphere", [0, 334, 520], [100, 26, 14], { color: green, layer: 3 }));
    st.push(S("cube", [0, 0, 930], [365, 318, 125], { color: roof, cone: 1, layer: 3 }));
    st.push(S("cube", [0, 0, 806], [372, 326, 10], { color: wood, layer: 3, blend: 4 }));
    st.push(S("cube", [215, -150, 1010], [38, 38, 140], { color: stone, layer: 3 }));
    st.push(S("cube", [215, -150, 1150], [46, 46, 10], { color: C("#6a6a6a"), layer: 3 }));
    return st;
  }
  // a manor: a wide two-storey house with a pillared porch, a tower with a flag and a gold vane,
  // tall windows on both floors and clipped bushes by the door
  function manor(clan) {
    const st = [], wall = C("#fff8e8"), wood = C("#7a4a24"), stone = C("#b8b0a0"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color), white = C("#ffffff"), gold = C("#ffd23f"), green = C("#2e8b3a"), dark = C("#3a2a1a");
    // layer 0: plinth, the body, the tower, the doors and the windows
    st.push(S("cube", [0, 0, 24], [540, 345, 24], { color: stone, round: 0.15 }));
    st.push(S("cube", [0, -10, 330], [505, 315, 300], { color: wall, round: 0.04, blend: 6 }));
    st.push(S("cube", [395, -150, 720], [105, 105, 700], { color: wall, round: 0.05 }));
    st.push(S("cube", [0, 302, 175], [118, 16, 150], { m: "rep", color: wood }));
    st.push(S("cube", [0, 310, 175], [108, 8, 142], { color: dark, round: 0.15 }));
    st.push(S("cube", [215, 302, 210], [58, 16, 92], { m: "rep", color: glass, mirror: true, offsX: 215 }));
    st.push(S("cube", [400, 302, 210], [48, 16, 92], { m: "rep", color: glass, mirror: true, offsX: 400 }));
    st.push(S("cube", [0, 302, 485], [58, 16, 82], { m: "rep", color: glass }));
    st.push(S("cube", [215, 302, 485], [58, 16, 82], { m: "rep", color: glass, mirror: true, offsX: 215 }));
    st.push(S("cube", [400, 302, 485], [48, 16, 82], { m: "rep", color: glass, mirror: true, offsX: 400 }));
    st.push(S("cube", [395, -44, 1010], [40, 12, 70], { m: "rep", color: glass }));
    // layer 1: the string course between the floors, the window frames and the porch columns
    st.push(S("cube", [0, -10, 352], [512, 322, 10], { color: stone, layer: 1 }));
    st.push(S("cube", [215, 316, 108], [66, 10, 8], { color: white, mirror: true, offsX: 215, layer: 1 }));
    st.push(S("cube", [215, 316, 400], [66, 10, 8], { color: white, mirror: true, offsX: 215, layer: 1 }));
    for (const x of [-170, -70, 70, 170]) st.push(S("joint", [x, 405, 205], [22, 22, 185], { color: white, layer: 1 }));
    st.push(S("cube", [0, 360, 30], [200, 60, 30], { color: stone, layer: 1, round: 0.2 }));
    // layer 2: the porch roof with its pediment, the main roof, the tower roof and the eaves
    st.push(S("cube", [0, 400, 405], [205, 70, 16], { color: white, layer: 2 }));
    st.push(S("cube", [0, 400, 455], [205, 70, 40], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [0, -10, 765], [530, 340, 135], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [0, -10, 636], [538, 348, 12], { color: wood, layer: 2, blend: 4 }));
    st.push(S("cube", [395, -150, 1520], [128, 128, 110], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [395, -150, 1414], [126, 126, 10], { color: wood, layer: 2 }));
    // layer 3: chimneys, the flag on the tower, the gold vane, the gold over the door, the clipped bushes
    st.push(S("cube", [-300, -170, 860], [40, 40, 160], { color: stone, layer: 3 }));
    st.push(S("cube", [120, -200, 860], [40, 40, 140], { color: stone, layer: 3 }));
    st.push(S("joint", [395, -150, 1720], [7, 7, 120], { color: dark, layer: 3 }));
    st.push(S("cube", [455, -150, 1790], [60, 4, 36], { color: roof, layer: 3 }));
    st.push(S("sphere", [395, -150, 1636], [16, 16, 16], { color: gold, layer: 3 }));
    st.push(S("cube", [0, 316, 345], [90, 8, 12], { color: gold, layer: 3 }));
    st.push(S("sphere", [290, 395, 95], [55, 55, 70], { color: green, mirror: true, offsX: 290, layer: 3 }));
    st.push(S("joint", [290, 395, 20], [10, 10, 20], { color: wood, mirror: true, offsX: 290, layer: 3 }));
    return st;
  }

  // ---------- the Blacksmiths' Guild ----------
  // a stone forge hall with a tall chimney; at the front an open shed on posts over the hearth, two
  // anvils on their stumps, a quenching barrel, a rack of swords, axes and spears, and shields on the wall
  function smithy() {
    const st = [], stone = C("#8a8a8a"), stone2 = C("#6a6a6a"), slate = C("#4a4a5a"), wood = C("#7a4a24"), dark = C("#3a2a1a"), brick = C("#a0442a"), coal = C("#ff7a2f"), glow = C("#ffd23f"), iron = C("#4a4a4a"), steel = C("#c8d0d8"), gold = C("#ffd23f");
    // layer 0: the hall at the back, its door, the yard floor
    st.push(S("cube", [0, -230, 290], [470, 200, 270], { color: stone, round: 0.04 }));
    st.push(S("cube", [0, -28, 150], [80, 14, 130], { m: "rep", color: stone }));
    st.push(S("cube", [-250, -28, 150], [70, 10, 120], { color: dark, round: 0.2 }));
    st.push(S("cube", [0, 170, 6], [460, 220, 6], { color: C("#7a6a5a") }));
    // layer 1: the hall's roof and chimney
    st.push(S("cube", [0, -230, 680], [490, 220, 120], { color: slate, cone: 1, layer: 1 }));
    st.push(S("cube", [300, -300, 860], [75, 75, 330], { color: stone2, layer: 1 }));
    st.push(S("cube", [300, -300, 1196], [86, 86, 12], { color: iron, layer: 1 }));
    // layer 2: the open shed in front: posts and a lean-to roof
    st.push(S("joint", [450, 360, 300], [20, 20, 300], { color: wood, mirror: true, offsX: 450, layer: 2 }));
    st.push(S("joint", [150, 360, 300], [16, 16, 300], { color: wood, mirror: true, offsX: 150, layer: 2 }));
    st.push(S("cube", [0, 160, 640], [480, 230, 18], { color: C("#8a5a3a"), rot: [-0.18, 0, 0], layer: 2 }));
    // layer 3: the hearth with glowing coals and its hood, the bellows
    st.push(S("cube", [-280, 120, 95], [120, 95, 95], { color: brick, round: 0.1, layer: 3 }));
    st.push(S("cube", [-280, 120, 194], [92, 70, 8], { color: coal, layer: 3 }));
    st.push(S("sphere", [-280, 120, 205], [60, 40, 14], { color: glow, layer: 3 }));
    st.push(S("cube", [-280, 80, 470], [110, 80, 150], { color: brick, cone: 0.6, layer: 3 }));
    st.push(S("sphere", [-440, 140, 120], [40, 70, 34], { color: C("#6b4a2b"), layer: 3 }));
    // layer 4: two anvils on stumps, a quenching barrel, a grindstone
    for (const [x, y] of [[40, 210], [270, 190]]) {
      st.push(S("cylinder", [x, y, 55], [44, 44, 55], { color: wood, layer: 4 }));
      st.push(S("cube", [x, y, 128], [64, 26, 18], { color: iron, round: 0.2, layer: 4 }));
      st.push(S("joint", [x + 78, y, 136], [14, 14, 30], { color: iron, cone: 1, rot: dir(1, 0, 0), layer: 4 }));
    }
    st.push(S("cylinder", [-100, 300, 70], [52, 52, 70], { color: wood, layer: 4 }));
    st.push(S("cylinder", [-100, 300, 138], [44, 44, 4], { color: C("#2f8fe0"), layer: 4 }));
    // layer 5: the weapons rack (swords, axes, spears) and shields hung on the hall wall
    st.push(S("cube", [420, 120, 160], [14, 100, 150], { color: wood, layer: 5 }));
    for (let k = 0; k < 4; k++) st.push(S("cube", [404, 50 + k * 45, 200], [4, 8, 120], { color: steel, layer: 5 }));
    st.push(S("joint", [404, 230, 220], [4, 4, 170], { color: wood, layer: 5 }));
    for (const [x, c] of [[-120, "#c8d0d8"], [0, "#e8443a"], [120, "#2f8fe0"]]) st.push(S("cylinder", [x, -26, 380], [52, 52, 8], { color: C(c), rot: [1.5708, 0, 0], layer: 5 }));
    // layer 6: the guild sign: a gold anvil and a hammer on a board
    st.push(S("cube", [0, 392, 540], [150, 10, 60], { color: wood, layer: 6 }));
    st.push(S("cube", [-20, 404, 528], [60, 6, 18], { color: gold, layer: 6 }));
    st.push(S("joint", [60, 404, 548], [6, 6, 34], { color: steel, rot: dir(0.6, 0, 1), layer: 6 }));
    return st;
  }
  // the horse paddock: a round rail fence with a gate, a stable shed with three stalls at the back,
  // a water trough and hay bales
  function paddock() {
    const st = [], wood = C("#7a4a24"), plank = C("#c79a62"), straw = C("#e8c35a"), roof = C("#b0302b"), water = C("#2f8fe0");
    const R = 900, N = 14;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, b = ((k + 0.5) / N) * Math.PI * 2, x = Math.sin(a) * R, y = Math.cos(a) * R;
      st.push(S("joint", [x, y, 75], [14, 14, 75], { color: wood }));
      if (k === 0) continue; // the gate, at the front
      const len = Math.PI * R / N;
      st.push(S("cube", [Math.sin(b) * R, Math.cos(b) * R, 110], [len, 7, 10], { color: plank, rot: [0, 0, -b], layer: 1 }));
      st.push(S("cube", [Math.sin(b) * R, Math.cos(b) * R, 55], [len, 7, 10], { color: plank, rot: [0, 0, -b], layer: 1 }));
    }
    // layer 2: the stable shed at the back
    st.push(S("cube", [0, -1150, 210], [420, 150, 210], { color: plank, round: 0.04, layer: 2 }));
    st.push(S("cube", [0, -1004, 150], [360, 14, 150], { m: "rep", color: plank, layer: 2 }));
    st.push(S("cube", [-120, -1004, 150], [8, 18, 150], { color: wood, layer: 2 }));
    st.push(S("cube", [120, -1004, 150], [8, 18, 150], { color: wood, layer: 2 }));
    st.push(S("cube", [0, -1150, 500], [445, 175, 90], { color: roof, cone: 1, layer: 3 }));
    st.push(S("cube", [0, -1150, 412], [450, 180, 10], { color: wood, layer: 3 }));
    // layer 4: trough and hay
    st.push(S("cube", [500, -300, 45], [120, 40, 45], { color: wood, layer: 4 }));
    st.push(S("cube", [500, -300, 82], [108, 30, 6], { color: water, layer: 4 }));
    st.push(S("cube", [-520, -360, 45], [70, 50, 45], { color: straw, round: 0.3, layer: 4 }));
    st.push(S("cube", [-430, -470, 45], [70, 50, 45], { color: straw, round: 0.3, layer: 4 }));
    return st;
  }
  // the griffin roost: a tall timber tower with a ladder and a great nest on top
  function roost() {
    const st = [], wood = C("#7a4a24"), dark = C("#5a3a1a"), straw = C("#c9a060"), plank = C("#a0703a");
    for (const [x, y] of [[-150, -150], [150, -150], [-150, 150], [150, 150]]) st.push(S("joint", [x, y, 650], [24, 24, 650], { color: wood, rot: dir(-x * 0.0004, -y * 0.0004, 1) }));
    st.push(S("cube", [0, 0, 420], [170, 170, 10], { color: dark }));
    st.push(S("cube", [0, 0, 860], [160, 160, 10], { color: dark }));
    // layer 1: the platform and the nest
    st.push(S("cylinder", [0, 0, 1300], [260, 260, 24], { color: plank, layer: 1 }));
    st.push(S("cylinder", [0, 0, 1360], [250, 250, 50], { color: straw, hole: 0.7, layer: 1 }));
    st.push(S("cylinder", [0, 0, 1330], [190, 190, 8], { color: straw, layer: 1 }));
    // layer 2: the ladder up the front
    st.push(S("joint", [-55, 185, 650], [8, 8, 650], { color: dark, layer: 2 }));
    st.push(S("joint", [55, 185, 650], [8, 8, 650], { color: dark, layer: 2 }));
    for (let k = 0; k < 11; k++) st.push(S("cube", [0, 185, 100 + k * 110], [55, 6, 6], { color: dark, layer: 2 }));
    return st;
  }

  // ---------- horses ----------
  // 0 a dun pony, 1 a chestnut horse, 2 a black horse, 3 the white charger with gold tack
  const COATS = [
    { coat: "#c9a27a", mane: "#5a3a1a", saddle: "#7a4a24", cloth: "#e8443a" },
    { coat: "#a0522d", mane: "#f3e2c0", saddle: "#5a3a1a", cloth: "#2f8fe0" },
    { coat: "#2a2a2a", mane: "#111111", saddle: "#7a4a24", cloth: "#3cbf6c" },
    { coat: "#f4f4f4", mane: "#d8d8e8", saddle: "#ffd23f", cloth: "#2f5fb0" },
  ];
  // the body without its legs (the legs are drawn apart so they can trot); hips and shoulders at z 200
  function horse(v) {
    const st = [], K = COATS[v || 0], coat = C(K.coat), mane = C(K.mane), saddle = C(K.saddle), cloth = C(K.cloth), dark = C("#222222"), white = C("#ffffff"), gold = C("#ffd23f");
    st.push(S("sphere", [0, 0, 275], [88, 215, 92], { color: coat }));
    st.push(S("sphere", [0, 150, 300], [80, 80, 88], { color: coat, blend: 30 }));
    st.push(S("sphere", [0, -150, 290], [84, 80, 86], { color: coat, blend: 30 }));
    st.push(S("joint", [0, 240, 385], [42, 42, 105], { color: coat, rot: dir(0, 1, 1.1), blend: 24 }));
    st.push(S("sphere", [0, 345, 468], [44, 92, 46], { color: coat, rot: [-0.65, 0, 0], blend: 18 }));
    // layer 1: the muzzle, eyes, nostrils and ears
    st.push(S("sphere", [0, 418, 418], [36, 40, 36], { color: v === 2 ? C("#3a3a3a") : coat, layer: 1 }));
    st.push(S("sphere", [37, 330, 492], [9, 9, 9], { color: dark, mirror: true, offsX: 37, layer: 1 }));
    st.push(S("sphere", [13, 452, 410], [6, 5, 6], { color: dark, mirror: true, offsX: 13, layer: 1 }));
    st.push(S("joint", [24, 296, 556], [10, 10, 30], { color: coat, cone: 0.8, mirror: true, offsX: 24, layer: 1 }));
    // layer 2: the mane down the back of the neck, the forelock and the tail
    st.push(S("joint", [0, 212, 412], [14, 22, 108], { color: mane, rot: dir(0, 1, 1.1), layer: 2 }));
    st.push(S("sphere", [0, 300, 540], [16, 28, 24], { color: mane, layer: 2 }));
    st.push(S("joint", [0, -255, 230], [22, 22, 95], { color: mane, rot: dir(0, -0.35, -1), layer: 2 }));
    // layer 3: the saddle cloth, saddle, stirrups and bridle
    st.push(S("cube", [0, -10, 352], [96, 95, 12], { color: cloth, round: 0.4, layer: 3 }));
    st.push(S("cube", [0, -10, 372], [70, 70, 16], { color: saddle, round: 0.5, layer: 3 }));
    st.push(S("sphere", [0, 52, 392], [40, 14, 18], { color: saddle, layer: 3 }));
    st.push(S("joint", [96, -10, 270], [4, 4, 70], { color: dark, mirror: true, offsX: 96, layer: 3 }));
    st.push(S("cube", [96, -10, 196], [14, 12, 6], { color: v === 3 ? gold : C("#9a9a9a"), mirror: true, offsX: 96, layer: 3 }));
    st.push(S("cylinder", [0, 392, 436], [40, 40, 6], { color: v === 3 ? gold : dark, hole: 0.85, rot: [1.5708 - 0.65, 0, 0], layer: 3 }));
    // layer 4: the blaze on the black, the plume and gold studs on the charger, a star on the others
    if (v === 3) {
      st.push(S("joint", [0, 300, 585], [10, 10, 40], { color: C("#e8443a"), layer: 4 }));
      st.push(S("sphere", [0, 300, 635], [18, 18, 24], { color: C("#e8443a"), layer: 4 }));
      st.push(S("cube", [0, -10, 386], [40, 40, 4], { color: gold, layer: 4 }));
    } else {
      st.push(S("sphere", [0, 372, 486], [14, 20, 22], { color: v === 2 ? white : C("#f3e2c0"), rot: [-0.65, 0, 0], layer: 4 }));
      st.push(S("sphere", [0, 405, 452], [10, 14, 16], { color: v === 2 ? white : C("#f3e2c0"), rot: [-0.65, 0, 0], layer: 4 }));
    }
    return st;
  }
  // one leg, hip at z 200 (the top), hoof on the ground; white socks on the charger and the chestnut
  function horseleg(v) {
    const st = [], K = COATS[v || 0], coat = C(K.coat), hoof = C("#2a2a2a"), sock = C("#f4f4f4");
    st.push(S("joint", [0, 0, 130], [22, 22, 75], { color: coat }));
    st.push(S("sphere", [0, 0, 190], [34, 40, 38], { color: coat, blend: 16 }));
    st.push(S("joint", [0, 0, 50], [17, 17, 45], { color: v === 1 || v === 3 ? sock : coat, layer: 1 }));
    st.push(S("cylinder", [0, 6, 10], [22, 24, 10], { color: hoof, layer: 1 }));
    return st;
  }

  // ---------- the riding griffin ----------
  // bigger than the wild ones: a lion's body, an eagle's front and head, a saddle; the wings apart
  function griffinmount() {
    const st = [], white = C("#f4f4f4"), tan = C("#c9a27a"), beak = C("#ffb020"), dark = C("#222222"), talon = C("#ffd23f"), saddle = C("#7a4a24"), cloth = C("#8a4fd8"), gold = C("#ffd23f");
    st.push(S("sphere", [0, -60, 300], [115, 210, 105], { color: tan }));
    st.push(S("sphere", [0, 130, 340], [110, 110, 120], { color: white, blend: 40 }));
    st.push(S("joint", [70, 150, 120], [26, 26, 120], { color: talon, mirror: true, offsX: 70, blend: 12 }));
    st.push(S("joint", [78, -190, 120], [32, 32, 120], { color: tan, mirror: true, offsX: 78, blend: 14 }));
    st.push(S("sphere", [70, 170, 14], [30, 44, 14], { color: talon, mirror: true, offsX: 70 }));
    st.push(S("sphere", [78, -175, 14], [32, 44, 14], { color: tan, mirror: true, offsX: 78 }));
    // layer 1: the head, beak and eyes, the crest
    st.push(S("sphere", [0, 230, 500], [78, 84, 78], { color: white, blend: 22, layer: 1 }));
    st.push(S("joint", [0, 320, 485], [24, 24, 40], { color: beak, cone: 0.9, rot: dir(0, 1, -0.45), layer: 1 }));
    st.push(S("sphere", [40, 280, 530], [11, 11, 11], { color: dark, mirror: true, offsX: 40, layer: 1 }));
    st.push(S("joint", [0, 190, 600], [14, 30, 46], { color: tan, rot: dir(0, -0.8, 0.6), layer: 1 }));
    // layer 2: the tail with its tuft
    st.push(S("joint", [0, -300, 360], [14, 14, 110], { color: tan, rot: dir(0, -1, 0.6), layer: 2 }));
    st.push(S("sphere", [0, -390, 430], [30, 30, 40], { color: C("#8a5a3a"), layer: 2 }));
    // layer 3: the saddle
    st.push(S("cube", [0, -30, 400], [100, 100, 12], { color: cloth, round: 0.4, layer: 3 }));
    st.push(S("cube", [0, -30, 420], [72, 72, 16], { color: saddle, round: 0.5, layer: 3 }));
    st.push(S("sphere", [0, 38, 440], [40, 14, 18], { color: gold, layer: 3 }));
    return st;
  }
  // a wing reaching out along +x from the shoulder (variant 1 is the left wing, a mirror image)
  function griffinwing(v) {
    const st = [], sx = v ? -1 : 1, brown = C("#8a5a3a"), white = C("#f4f4f4"), tan = C("#c9a27a");
    st.push(S("sphere", [sx * 150, 0, 0], [160, 70, 20], { color: brown }));
    st.push(S("sphere", [sx * 380, -40, 0], [170, 80, 16], { color: brown, blend: 20 }));
    st.push(S("sphere", [sx * 560, -90, 0], [110, 70, 12], { color: white, blend: 16, layer: 1 }));
    st.push(S("sphere", [sx * 300, -100, -4], [220, 50, 10], { color: tan, layer: 1 }));
    return st;
  }

  // ---------- private boats ----------
  // a sailing boat: a coloured stripe, a little cabin, a tall mast with mainsail and jib
  function sailboat(v) {
    const st = [], hull = C("#ffffff"), acc = C(ACC[(v || 0) % 6]), wood = C("#a0703a"), dark = C("#6b4a2b"), sail = C("#fff8e8"), blue = C("#2f8fe0");
    st.push(S("sphere", [0, 0, 70], [150, 380, 95], { color: hull }));
    st.push(S("sphere", [0, 0, 128], [128, 352, 80], { m: "sub", color: hull }));
    st.push(S("cube", [0, 0, 92], [120, 300, 8], { color: wood }));
    st.push(S("sphere", [0, 0, 112], [152, 382, 12], { color: acc, layer: 1 }));
    st.push(S("sphere", [0, 0, 70], [149, 379, 10], { color: acc, layer: 1 }));
    st.push(S("cube", [0, -150, 170], [80, 90, 55], { color: hull, round: 0.2, layer: 2 }));
    st.push(S("cube", [0, -150, 232], [90, 100, 10], { color: blue, round: 0.3, layer: 2 }));
    st.push(S("joint", [0, 60, 620], [9, 9, 520], { color: dark, layer: 3 }));
    st.push(S("joint", [0, -80, 300], [7, 7, 140], { color: dark, rot: dir(0, 1, 0), layer: 3 }));
    for (let k = 0; k < 7; k++) { const w = 135 - k * 17; st.push(S("cube", [0, 60 - w, 360 + k * 100], [3, w, 50], { color: k === 1 ? acc : sail, layer: 4 })); }
    for (let k = 0; k < 5; k++) { const w = 85 - k * 15; st.push(S("cube", [0, 70 + w, 300 + k * 90], [3, w, 45], { color: sail, layer: 5 })); }
    return st;
  }
  // a yacht: a long white hull with a stripe in its owner's colour, a deck, a cabin with a bridge on top,
  // a mast with two sails, a flag, a lifebuoy and a gold name board
  function yacht(v) {
    const st = [], hull = C("#ffffff"), acc = C(ACC[(v || 0) % 6]), deck = C("#c79a62"), dark = C("#6b4a2b"), sail = C("#fff8e8"), glass = C("#8fd3f4"), gold = C("#ffd23f"), red = C("#e8443a");
    st.push(S("sphere", [0, 0, 110], [210, 640, 140], { color: hull }));
    st.push(S("sphere", [0, 0, 200], [186, 610, 120], { m: "sub", color: hull }));
    st.push(S("cube", [0, -20, 150], [175, 520, 10], { color: deck }));
    st.push(S("sphere", [0, 0, 170], [212, 642, 16], { color: acc, layer: 1 }));
    st.push(S("sphere", [0, 0, 120], [211, 641, 10], { color: C("#2f5fb0"), layer: 1 }));
    // layer 2: the cabin with windows, the bridge on top
    st.push(S("cube", [0, -170, 270], [140, 250, 110], { color: hull, round: 0.12, layer: 2 }));
    st.push(S("cube", [0, -170, 300], [145, 210, 30], { m: "rep", color: glass, layer: 2 }));
    st.push(S("cube", [0, -230, 420], [110, 140, 50], { color: hull, round: 0.2, layer: 2 }));
    st.push(S("cube", [0, -170, 385], [150, 255, 8], { color: acc, layer: 2 }));
    // layer 3: the mast, the boom, the flag
    st.push(S("joint", [0, 140, 900], [11, 11, 760], { color: dark, layer: 3 }));
    st.push(S("joint", [0, -40, 470], [8, 8, 190], { color: dark, rot: dir(0, 1, 0), layer: 3 }));
    st.push(S("cube", [40, 140, 1640], [50, 4, 26], { color: acc, layer: 3 }));
    // layer 4: the mainsail
    for (let k = 0; k < 9; k++) { const w = 180 - k * 18; st.push(S("cube", [0, 140 - w, 560 + k * 120], [3, w, 60], { color: k === 2 ? acc : sail, layer: 4 })); }
    // layer 5: the jib
    for (let k = 0; k < 6; k++) { const w = 120 - k * 19; st.push(S("cube", [0, 150 + w, 420 + k * 110], [3, w, 55], { color: sail, layer: 5 })); }
    // layer 6: lifebuoy, name board, rail posts
    st.push(S("cylinder", [212, -380, 250], [40, 40, 10], { color: red, hole: 0.55, rot: [0, 1.5708, 0], layer: 6 }));
    st.push(S("cube", [0, -636, 175], [90, 6, 22], { color: gold, layer: 6 }));
    for (const y of [-500, -300, 200, 400]) st.push(S("joint", [180, y, 215], [5, 5, 50], { color: C("#c8c8c8"), mirror: true, offsX: 180, layer: 6 }));
    return st;
  }

  // ---------- a holder's mansion (one for every 20 Tickles it owns) ----------
  // bigger than four townhouses together: a three-storey middle with a columned portico, a drum and a dome in the
  // clan's colour, two long wings, a round tower at each end with a pointed roof and a flag, steps up from the
  // garden and clipped hedges along the front
  function palace(clan) {
    const st = [], wall = C("#fff8e8"), wall2 = C("#f3e2c0"), stone = C("#b8b0a0"), white = C("#ffffff"), glass = C("#8fd3f4"), roof = C(CLANS[clan].color), gold = C("#ffd23f"), dark = C("#3a2a1a"), green = C("#2e8b3a"), wood = C("#7a4a24");
    // layer 0: the terrace, the middle block, the wings, the towers, the great door and the windows
    st.push(S("cube", [0, 0, 30], [960, 480, 30], { color: stone, round: 0.1 }));
    st.push(S("cube", [0, -20, 500], [340, 360, 470], { color: wall, round: 0.03, blend: 6 }));
    st.push(S("cube", [640, -60, 370], [300, 300, 340], { color: wall2, round: 0.04, mirror: true, offsX: 640 }));
    st.push(S("cylinder", [900, -60, 560], [125, 125, 530], { color: wall, mirror: true, offsX: 900 }));
    st.push(S("cube", [0, 330, 210], [130, 20, 180], { m: "rep", color: wood }));
    st.push(S("cube", [0, 338, 205], [118, 10, 170], { color: dark, round: 0.2 }));
    for (const [x, w] of [[200, 52], [0, 60]]) for (const z of [520, 790]) st.push(S("cube", [x, 330, z], [w, 20, 90], x ? { m: "rep", color: glass, mirror: true, offsX: x } : { m: "rep", color: glass }));
    for (const x of [470, 640, 810]) for (const z of [200, 500]) st.push(S("cube", [x, 230, z], [50, 20, 85], { m: "rep", color: glass, mirror: true, offsX: x }));
    // layer 1: the cornices, the portico's six columns and its steps, the tower windows
    st.push(S("cube", [0, -20, 975], [352, 372, 14], { color: stone, layer: 1 }));
    st.push(S("cube", [640, -60, 718], [310, 310, 12], { color: stone, mirror: true, offsX: 640, layer: 1 }));
    for (const x of [-250, -150, -50, 50, 150, 250]) st.push(S("joint", [x, 470, 330], [28, 28, 300], { color: white, layer: 1 }));
    st.push(S("cube", [0, 520, 40], [320, 60, 40], { color: stone, round: 0.15, layer: 1 }));
    st.push(S("cube", [0, 590, 16], [300, 40, 16], { color: stone, round: 0.15, layer: 1 }));
    st.push(S("cube", [900, 66, 760], [40, 8, 80], { m: "rep", color: glass, mirror: true, offsX: 900, layer: 1 }));
    // layer 2: the portico's pediment, the roofs of the wings, the drum and the dome, the tower roofs
    st.push(S("cube", [0, 470, 650], [300, 80, 20], { color: white, layer: 2 }));
    st.push(S("cube", [0, 470, 720], [300, 80, 55], { color: white, cone: 1, layer: 2 }));
    st.push(S("cube", [640, -60, 830], [312, 312, 110], { color: roof, cone: 1, mirror: true, offsX: 640, layer: 2 }));
    st.push(S("cylinder", [0, -20, 1060], [230, 230, 90], { color: wall, layer: 2 }));
    st.push(S("sphere", [0, -20, 1150], [240, 240, 230], { color: roof, layer: 2, blend: 4 }));
    st.push(S("cylinder", [900, -60, 1250], [150, 150, 170], { color: roof, cone: 1, mirror: true, offsX: 900, layer: 2 }));
    // layer 3: the lantern and gold ball on the dome, the flags on the towers, gold over the door, the hedges
    st.push(S("cylinder", [0, -20, 1420], [50, 50, 60], { color: white, layer: 3 }));
    st.push(S("sphere", [0, -20, 1510], [36, 36, 36], { color: gold, layer: 3 }));
    st.push(S("joint", [900, -60, 1520], [8, 8, 110], { color: dark, mirror: true, offsX: 900, layer: 3 }));
    st.push(S("cube", [960, -60, 1590], [60, 4, 36], { color: roof, mirror: true, offsX: 960, layer: 3 }));
    st.push(S("cube", [0, 352, 420], [110, 8, 16], { color: gold, layer: 3 }));
    st.push(S("cube", [640, 420, 50], [250, 40, 50], { color: green, round: 0.6, mirror: true, offsX: 640, layer: 3 }));
    return st;
  }

  // ---------- a fortress: for a holder of more than eight mansions' worth of Tickles ----------
  // the castle: a whole castle in one piece. At the back a tall keep with a turret at each corner and a pointed roof,
  // in front of it the great hall under its long roof, two wings, its own curtain walls with battlements all round,
  // a great round tower at each corner, and at the front the gatehouse between two half-round towers, with the
  // portcullis, long banners in the clan's colour, flags on every tower; buttresses, arrow slits, tall windows
  function castle(clan) {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), stone3 = C("#84807a"), dark = C("#2a2420"), roof = C(CLANS[clan].color), gold = C("#ffd23f"), wood = C("#7a4a24"), slit = C("#1a1612"), glass = C("#ffd27a"), moss = C("#5a8a3a");
    const M = (o) => Object.assign({ mirror: true }, o);
    // layer 0: the terrace, the curtain walls, the corner towers, the keep, the hall, the wings, the gatehouse
    st.push(S("cube", [0, 0, 40], [1320, 1120, 40], { color: stone3, round: 0.06 }));
    st.push(S("cube", [700, 900, 400], [380, 75, 360], M({ color: stone, offsX: 700 })));
    st.push(S("cube", [1100, 0, 400], [75, 820, 360], M({ color: stone, offsX: 1100 })));
    st.push(S("cube", [0, -900, 400], [1050, 75, 360], { color: stone }));
    st.push(S("cylinder", [1080, 860, 900], [240, 240, 860], M({ color: stone2, offsX: 1080 })));
    st.push(S("cylinder", [1080, -860, 900], [240, 240, 860], M({ color: stone2, offsX: 1080 })));
    st.push(S("cube", [0, -480, 1220], [340, 340, 1180], { color: stone2, round: 0.02 }));
    st.push(S("cube", [0, -60, 620], [640, 300, 580], { color: stone, round: 0.02 }));
    st.push(S("cube", [760, 200, 470], [230, 560, 430], M({ color: stone2, offsX: 760 })));
    st.push(S("cube", [0, 900, 560], [300, 210, 520], { color: stone2 }));
    st.push(S("cylinder", [330, 980, 640], [160, 160, 600], M({ color: stone, offsX: 330 })));
    // the gate, the windows and the arrow slits
    st.push(S("cube", [0, 1110, 300], [140, 24, 260], { m: "rep", color: dark }));
    st.push(S("cylinder", [0, 1110, 560], [140, 140, 24], { m: "rep", color: dark, rot: [1.5708, 0, 0] }));
    for (const x of [160, 400]) st.push(S("cube", [x, 240, 820], [55, 24, 150], M({ m: "rep", color: glass, offsX: x })));
    for (const z of [900, 1350, 1800, 2150]) st.push(S("cube", [0, -138, z], [22, 24, 80], { m: "rep", color: slit }));
    for (const z of [600, 1100]) st.push(S("cube", [1080, 1098, z], [20, 24, 70], M({ m: "rep", color: slit, offsX: 1080 })));
    st.push(S("cube", [760, 760, 600], [24, 24, 80], M({ m: "rep", color: slit, offsX: 760 })));
    st.push(S("sphere", [-900, 980, 120], [160, 30, 100], { m: "rep", color: moss }));
    // layer 1: the battlements of every wall, the keep and the gatehouse; the portcullis; the buttresses
    st.push(S("cube", [700, 900, 775], [385, 85, 18], M({ color: stone2, offsX: 700, layer: 1 })));
    for (const x of [420, 560, 700, 840]) st.push(S("cube", [x, 960, 830], [40, 22, 45], M({ color: stone2, offsX: x, layer: 1 })));
    for (const y of [-650, -400, -150, 100, 350, 600]) st.push(S("cube", [1160, y, 830], [22, 40, 45], M({ color: stone2, offsX: 1160, layer: 1 })));
    for (const x of [100, 300, 500, 700, 900]) st.push(S("cube", [x, -960, 830], [40, 22, 45], M({ color: stone2, offsX: x, layer: 1 })));
    st.push(S("cube", [0, -480, 2410], [360, 360, 24], { color: stone, layer: 1 }));
    for (const x of [90, 250]) { st.push(S("cube", [x, -130, 2475], [45, 25, 45], M({ color: stone, offsX: x, layer: 1 }))); st.push(S("cube", [x, -830, 2475], [45, 25, 45], M({ color: stone, offsX: x, layer: 1 }))); }
    st.push(S("cube", [0, 900, 1095], [310, 220, 20], { color: stone, layer: 1 }));
    for (const x of [80, 230]) st.push(S("cube", [x, 1110, 1150], [45, 25, 45], M({ color: stone, offsX: x, layer: 1 })));
    for (const x of [-90, -30, 30, 90]) st.push(S("cube", [x, 1126, 280], [7, 8, 240], { color: dark, layer: 1 }));
    st.push(S("cube", [0, 1126, 330], [130, 8, 7], { color: dark, layer: 1 }));
    for (const x of [-500, -250, 250, 500]) st.push(S("cube", [x, 250, 360], [40, 40, 320], { color: stone3, layer: 1 }));
    // layer 2: the roofs: the corner towers, the keep's turrets and its spire, the hall, the wings, the gate towers
    st.push(S("cylinder", [1080, 860, 2000], [280, 280, 260], M({ color: roof, cone: 1, offsX: 1080, layer: 2 })));
    st.push(S("cylinder", [1080, -860, 2000], [280, 280, 260], M({ color: roof, cone: 1, offsX: 1080, layer: 2 })));
    st.push(S("cylinder", [1080, 860, 1770], [260, 260, 24], M({ color: stone, offsX: 1080, layer: 2 })));
    st.push(S("cylinder", [1080, -860, 1770], [260, 260, 24], M({ color: stone, offsX: 1080, layer: 2 })));
    st.push(S("cylinder", [300, -180, 2560], [90, 90, 160], M({ color: stone2, offsX: 300, layer: 2 })));
    st.push(S("cylinder", [300, -780, 2560], [90, 90, 160], M({ color: stone2, offsX: 300, layer: 2 })));
    st.push(S("cylinder", [300, -180, 2820], [115, 115, 140], M({ color: roof, cone: 1, offsX: 300, layer: 2 })));
    st.push(S("cylinder", [300, -780, 2820], [115, 115, 140], M({ color: roof, cone: 1, offsX: 300, layer: 2 })));
    st.push(S("cube", [0, -480, 2700], [250, 250, 260], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [0, -60, 1360], [660, 320, 170], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [760, 200, 1060], [245, 575, 150], M({ color: roof, cone: 1, offsX: 760, layer: 2 })));
    st.push(S("cylinder", [330, 980, 1420], [185, 185, 180], M({ color: roof, cone: 1, offsX: 330, layer: 2 })));
    // layer 3: the banners on the gatehouse, the flags on every tower and the keep, gold over the gate, the doors
    st.push(S("cube", [150, 1126, 760], [55, 8, 200], M({ color: roof, offsX: 150, layer: 3 })));
    st.push(S("cube", [150, 1130, 760], [16, 6, 140], M({ color: gold, offsX: 150, layer: 3 })));
    st.push(S("joint", [1080, 860, 2400], [10, 10, 160], M({ color: wood, offsX: 1080, layer: 3 })));
    st.push(S("cube", [1160, 860, 2500], [80, 5, 46], M({ color: roof, offsX: 1160, layer: 3 })));
    st.push(S("joint", [1080, -860, 2400], [10, 10, 160], M({ color: wood, offsX: 1080, layer: 3 })));
    st.push(S("cube", [1160, -860, 2500], [80, 5, 46], M({ color: roof, offsX: 1160, layer: 3 })));
    st.push(S("joint", [0, -480, 3120], [12, 12, 180], { color: wood, layer: 3 }));
    st.push(S("cube", [110, -480, 3240], [110, 6, 66], { color: roof, layer: 3 }));
    st.push(S("sphere", [0, 1130, 640], [50, 10, 50], { color: gold, layer: 3 }));
    st.push(S("sphere", [0, -480, 2985], [40, 40, 40], { color: gold, layer: 3 }));
    return st;
  }
  // the huge castle, a citadel: its own curtain wall with six round towers and a great gatehouse, inside it a giant
  // keep with a turret at each corner and a tall spire, two tall towers with needle spires either side, the great
  // hall in front of the keep, a chapel with its bell tower; battlements everywhere, banners and flags
  function castle3(clan) {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), stone3 = C("#84807a"), dark = C("#2a2420"), roof = C(CLANS[clan].color), gold = C("#ffd23f"), wood = C("#7a4a24"), slit = C("#1a1612"), glass = C("#ffd27a"), white = C("#f3efe6");
    const M = (o) => Object.assign({ mirror: true }, o);
    // layer 0: terrace, curtain walls, six towers, the keep, the side towers, the hall, the chapel, the gatehouse
    st.push(S("cube", [0, 0, 40], [1500, 1300, 40], { color: stone3, round: 0.05 }));
    st.push(S("cube", [800, 1060, 430], [520, 80, 390], M({ color: stone, offsX: 800 })));
    st.push(S("cube", [1300, 0, 430], [80, 1000, 390], M({ color: stone, offsX: 1300 })));
    st.push(S("cube", [0, -1060, 430], [1250, 80, 390], { color: stone }));
    st.push(S("cylinder", [1280, 1040, 950], [260, 260, 910], M({ color: stone2, offsX: 1280 })));
    st.push(S("cylinder", [1280, -1040, 950], [260, 260, 910], M({ color: stone2, offsX: 1280 })));
    st.push(S("cylinder", [1330, 0, 800], [220, 220, 760], M({ color: stone2, offsX: 1330 })));
    st.push(S("cube", [0, -520, 1450], [430, 430, 1410], { color: stone2, round: 0.02 }));
    st.push(S("cylinder", [760, -480, 1250], [210, 210, 1210], M({ color: stone, offsX: 760 })));
    st.push(S("cube", [0, 80, 700], [620, 300, 660], { color: stone, round: 0.02 }));
    st.push(S("cube", [-900, 380, 520], [220, 360, 480], { color: white, round: 0.03 }));
    st.push(S("cube", [-900, 700, 1050], [110, 110, 1010], { color: white }));
    st.push(S("cube", [0, 1080, 640], [360, 240, 600], { color: stone2 }));
    st.push(S("cylinder", [400, 1160, 740], [180, 180, 700], M({ color: stone, offsX: 400 })));
    // the gate, the windows, the slits
    st.push(S("cube", [0, 1320, 340], [160, 24, 300], { m: "rep", color: dark }));
    st.push(S("cylinder", [0, 1320, 640], [160, 160, 24], { m: "rep", color: dark, rot: [1.5708, 0, 0] }));
    for (const x of [180, 420]) st.push(S("cube", [x, 380, 900], [60, 24, 170], M({ m: "rep", color: glass, offsX: x })));
    for (const z of [1100, 1600, 2100, 2550]) st.push(S("cube", [0, -88, z], [26, 24, 90], { m: "rep", color: slit }));
    for (const y of [300, 460]) st.push(S("cube", [-680, y, 640], [24, 50, 150], { m: "rep", color: glass }));
    for (const z of [700, 1300, 1900]) st.push(S("cube", [760, -268, z], [22, 24, 80], M({ m: "rep", color: slit, offsX: 760 })));
    // layer 1: battlements on every wall, the keep, the side towers and the gatehouse; the portcullis; buttresses
    st.push(S("cube", [800, 1060, 835], [525, 90, 18], M({ color: stone2, offsX: 800, layer: 1 })));
    for (const x of [500, 650, 800, 950, 1100]) st.push(S("cube", [x, 1130, 890], [42, 22, 48], M({ color: stone2, offsX: x, layer: 1 })));
    for (const y of [-800, -550, -300, 300, 550, 800]) st.push(S("cube", [1370, y, 890], [22, 42, 48], M({ color: stone2, offsX: 1370, layer: 1 })));
    for (const x of [100, 350, 600, 850, 1100]) st.push(S("cube", [x, -1130, 890], [42, 22, 48], M({ color: stone2, offsX: x, layer: 1 })));
    st.push(S("cube", [0, -520, 2880], [450, 450, 26], { color: stone, layer: 1 }));
    for (const x of [100, 280]) { st.push(S("cube", [x, -90, 2950], [50, 28, 50], M({ color: stone, offsX: x, layer: 1 }))); st.push(S("cube", [x, -950, 2950], [50, 28, 50], M({ color: stone, offsX: x, layer: 1 }))); }
    st.push(S("cylinder", [760, -480, 2480], [230, 230, 26], M({ color: stone2, offsX: 760, layer: 1 })));
    st.push(S("cube", [0, 1080, 1260], [370, 250, 22], { color: stone, layer: 1 }));
    for (const x of [90, 270]) st.push(S("cube", [x, 1325, 1320], [50, 26, 50], M({ color: stone, offsX: x, layer: 1 })));
    for (const x of [-105, -35, 35, 105]) st.push(S("cube", [x, 1336, 320], [8, 8, 280], { color: dark, layer: 1 }));
    st.push(S("cube", [0, 1336, 380], [150, 8, 8], { color: dark, layer: 1 }));
    for (const x of [-450, -150, 150, 450]) st.push(S("cube", [x, 390, 420], [44, 44, 380], { color: stone3, layer: 1 }));
    // layer 2: the roofs: six towers, the keep's turrets and spire, the side towers' needles, the hall, the chapel
    st.push(S("cylinder", [1280, 1040, 2140], [300, 300, 280], M({ color: roof, cone: 1, offsX: 1280, layer: 2 })));
    st.push(S("cylinder", [1280, -1040, 2140], [300, 300, 280], M({ color: roof, cone: 1, offsX: 1280, layer: 2 })));
    st.push(S("cylinder", [1330, 0, 1800], [250, 250, 240], M({ color: roof, cone: 1, offsX: 1330, layer: 2 })));
    st.push(S("cylinder", [340, -180, 3050], [100, 100, 180], M({ color: stone2, offsX: 340, layer: 2 })));
    st.push(S("cylinder", [340, -860, 3050], [100, 100, 180], M({ color: stone2, offsX: 340, layer: 2 })));
    st.push(S("cylinder", [340, -180, 3340], [125, 125, 160], M({ color: roof, cone: 1, offsX: 340, layer: 2 })));
    st.push(S("cylinder", [340, -860, 3340], [125, 125, 160], M({ color: roof, cone: 1, offsX: 340, layer: 2 })));
    st.push(S("cube", [0, -520, 3250], [320, 320, 360], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cylinder", [760, -480, 2900], [240, 240, 420], M({ color: roof, cone: 1, offsX: 760, layer: 2 })));
    st.push(S("cube", [0, 80, 1520], [640, 320, 200], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [-900, 380, 1120], [235, 375, 160], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [-900, 700, 2300], [130, 130, 260], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cylinder", [400, 1160, 1640], [210, 210, 220], M({ color: roof, cone: 1, offsX: 400, layer: 2 })));
    // layer 3: banners, flags on every tower, the gold on the spires and over the gate
    st.push(S("cube", [180, 1336, 900], [60, 8, 230], M({ color: roof, offsX: 180, layer: 3 })));
    st.push(S("cube", [180, 1340, 900], [18, 6, 160], M({ color: gold, offsX: 180, layer: 3 })));
    st.push(S("joint", [1280, 1040, 2580], [11, 11, 170], M({ color: wood, offsX: 1280, layer: 3 })));
    st.push(S("cube", [1370, 1040, 2690], [90, 5, 50], M({ color: roof, offsX: 1370, layer: 3 })));
    st.push(S("joint", [1280, -1040, 2580], [11, 11, 170], M({ color: wood, offsX: 1280, layer: 3 })));
    st.push(S("cube", [1370, -1040, 2690], [90, 5, 50], M({ color: roof, offsX: 1370, layer: 3 })));
    st.push(S("joint", [0, -520, 3780], [13, 13, 190], { color: wood, layer: 3 }));
    st.push(S("cube", [120, -520, 3910], [120, 6, 72], { color: roof, layer: 3 }));
    st.push(S("sphere", [760, -480, 3350], [40, 40, 40], M({ color: gold, offsX: 760, layer: 3 })));
    st.push(S("sphere", [-900, 700, 2600], [36, 36, 36], { color: gold, layer: 3 }));
    st.push(S("sphere", [0, 1340, 720], [60, 12, 60], { color: gold, layer: 3 }));
    return st;
  }
  // the smaller castle (the first design): a tall square keep behind a great hall, four round towers with pointed
  // roofs in the clan's colour, battlements all round, a gate with its portcullis, long banners and flags
  function castle2(clan) {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), dark = C("#2a2420"), roof = C(CLANS[clan].color), gold = C("#ffd23f"), wood = C("#7a4a24"), slit = C("#1a1612");
    st.push(S("cube", [0, 0, 30], [660, 560, 30], { color: C("#7e786e"), round: 0.1 }));
    st.push(S("cube", [0, -40, 420], [470, 390, 390], { color: stone, round: 0.02 }));
    st.push(S("cube", [0, -150, 900], [230, 230, 880], { color: stone2, round: 0.02 }));
    st.push(S("cylinder", [540, 420, 640], [140, 140, 640], { color: stone2, mirror: true, offsX: 540 }));
    st.push(S("cylinder", [540, -480, 640], [140, 140, 640], { color: stone2, mirror: true, offsX: 540 }));
    st.push(S("cube", [0, 352, 190], [130, 20, 180], { m: "rep", color: dark }));
    st.push(S("cylinder", [0, 352, 370], [130, 130, 20], { m: "rep", color: dark, rot: [1.5708, 0, 0] }));
    for (const x of [220, 380]) st.push(S("cube", [x, 352, 520], [16, 20, 70], { m: "rep", color: slit, mirror: true, offsX: x }));
    for (const z of [1000, 1300, 1560]) st.push(S("cube", [0, 82, z], [18, 20, 70], { m: "rep", color: slit }));
    st.push(S("cube", [0, -40, 830], [480, 400, 24], { color: stone2, layer: 1 }));
    for (const x of [60, 180, 300, 420]) { st.push(S("cube", [x, 360, 880], [40, 30, 40], { color: stone2, mirror: true, offsX: x, layer: 1 })); st.push(S("cube", [x, -440, 880], [40, 30, 40], { color: stone2, mirror: true, offsX: x, layer: 1 })); }
    st.push(S("cube", [0, -150, 1790], [250, 250, 24], { color: stone, layer: 1 }));
    for (const x of [70, 200]) { st.push(S("cube", [x, 90, 1850], [40, 30, 40], { color: stone, mirror: true, offsX: x, layer: 1 })); st.push(S("cube", [x, -390, 1850], [40, 30, 40], { color: stone, mirror: true, offsX: x, layer: 1 })); }
    for (const x of [-90, -30, 30, 90]) st.push(S("cube", [x, 362, 190], [6, 8, 170], { color: dark, layer: 1 }));
    st.push(S("cube", [0, 362, 230], [120, 8, 6], { color: dark, layer: 1 }));
    st.push(S("cylinder", [540, 420, 1450], [175, 175, 190], { color: roof, cone: 1, mirror: true, offsX: 540, layer: 2 }));
    st.push(S("cylinder", [540, -480, 1450], [175, 175, 190], { color: roof, cone: 1, mirror: true, offsX: 540, layer: 2 }));
    st.push(S("cylinder", [540, 420, 1275], [160, 160, 22], { color: stone, mirror: true, offsX: 540, layer: 2 }));
    st.push(S("cylinder", [540, -480, 1275], [160, 160, 22], { color: stone, mirror: true, offsX: 540, layer: 2 }));
    st.push(S("cube", [240, 368, 600], [50, 8, 170], { color: roof, mirror: true, offsX: 240, layer: 3 }));
    st.push(S("cube", [240, 372, 600], [14, 6, 120], { color: gold, mirror: true, offsX: 240, layer: 3 }));
    st.push(S("joint", [540, 420, 1760], [8, 8, 140], { color: wood, mirror: true, offsX: 540, layer: 3 }));
    st.push(S("cube", [600, 420, 1850], [60, 4, 36], { color: roof, mirror: true, offsX: 600, layer: 3 }));
    st.push(S("joint", [0, -150, 2000], [10, 10, 170], { color: wood, layer: 3 }));
    st.push(S("cube", [90, -150, 2110], [90, 5, 55], { color: roof, layer: 3 }));
    st.push(S("sphere", [0, 368, 420], [40, 8, 40], { color: gold, layer: 3 }));
    return st;
  }
  // a stretch of curtain wall (about six blocks long, along x), thick enough for a walk along the top: the merlons on
  // the outer side (-y), a low parapet on the inner side
  function wall() {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), moss = C("#5a8a3a"), walk = C("#8a847a");
    st.push(S("cube", [0, 0, 250], [490, 150, 250], { color: stone, round: 0.02 }));
    st.push(S("cube", [0, 0, 515], [495, 160, 18], { color: walk }));
    st.push(S("sphere", [-260, -145, 60], [90, 20, 50], { m: "rep", color: moss }));
    for (const x of [60, 180, 300, 420]) st.push(S("cube", [x, -135, 580], [42, 26, 48], { color: stone2, mirror: true, offsX: x, layer: 1 }));
    st.push(S("cube", [0, 148, 555], [495, 10, 22], { color: stone2, layer: 1 }));
    return st;
  }
  // a round tower in the wall, its battlements and arrow slits
  function walltower() {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), slit = C("#1a1612"), roof = C("#7a4a24");
    st.push(S("cylinder", [0, 0, 420], [215, 215, 420], { color: stone2 }));
    st.push(S("cylinder", [0, 0, 850], [235, 235, 22], { color: stone }));
    st.push(S("cube", [0, 172, 520], [16, 12, 60], { m: "rep", color: slit }));
    for (const [x, y] of [[150, 0], [0, 150]]) st.push(S("cube", [x, y, 905], [40, 40, 40], { color: stone, mirror: true, offsX: x, layer: 1 }));
    st.push(S("cube", [0, -150, 905], [40, 40, 40], { color: stone, layer: 1 }));
    st.push(S("joint", [0, 0, 990], [7, 7, 110], { color: roof, layer: 1 }));
    return st;
  }
  // the gate in the wall: two square towers over an arch, the portcullis raised, a banner over it
  function gatehouse(clan) {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), dark = C("#2a2420"), roof = C(CLANS[clan].color);
    st.push(S("cube", [300, 0, 480], [140, 175, 480], { color: stone2, mirror: true, offsX: 300 }));
    st.push(S("cube", [0, 0, 760], [180, 165, 200], { color: stone }));
    st.push(S("cylinder", [0, 0, 560], [160, 160, 130], { m: "sub", color: stone, rot: [1.5708, 0, 0] }));
    for (const x of [-100, 0, 100]) st.push(S("cube", [x, 0, 880], [8, 8, 70], { color: dark, layer: 1 }));
    for (const x of [230, 370]) st.push(S("cube", [x, 0, 1000], [40, 150, 40], { color: stone, mirror: true, offsX: x, layer: 1 }));
    st.push(S("cube", [0, 125, 760], [60, 6, 120], { color: roof, layer: 2 }));
    st.push(S("cube", [0, -125, 760], [60, 6, 120], { color: roof, layer: 2 }));
    return st;
  }

  // ---------- the mansions: one style for every region ----------
  // each bigger than four medium houses together; the roofs, doors or awnings in the clan's colour
  // Camping: a great log lodge, a stone chimney at each end, a porch on posts all along the front
  function mlodge(clan) {
    const st = [], log = C("#8a5a30"), log2 = C("#6e4422"), stone = C("#9a9a9a"), roof = C(CLANS[clan].color), glass = C("#ffe08a"), wood = C("#5a3a1a"), green = C("#2e8b3a");
    st.push(S("cube", [0, 0, 24], [760, 460, 24], { color: stone, round: 0.15 }));
    st.push(S("cube", [-80, -40, 330], [600, 360, 300], { color: log, round: 0.06 }));
    st.push(S("cube", [560, -80, 260], [220, 300, 230], { color: log, round: 0.06 }));
    for (const z of [110, 230, 350, 470]) st.push(S("cube", [-80, 322, z], [600, 6, 14], { m: "rep", color: log2 }));
    st.push(S("cube", [-80, 322, 170], [90, 10, 140], { m: "rep", color: wood }));
    for (const x of [-400, 240]) st.push(S("cube", [x, 322, 230], [70, 10, 70], { m: "rep", color: glass }));
    for (const x of [-560, -260, 100, 400]) st.push(S("joint", [x, 440, 150], [18, 18, 140], { color: log2, layer: 1 }));
    st.push(S("cube", [-80, 430, 300], [640, 100, 14], { color: roof, layer: 1 }));
    st.push(S("cube", [-80, -40, 800], [640, 400, 180], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [560, -80, 600], [240, 320, 120], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [-700, -40, 560], [70, 80, 560], { color: stone, layer: 3 }));
    st.push(S("cube", [700, -80, 520], [60, 70, 520], { color: stone, layer: 3 }));
    st.push(S("sphere", [480, 450, 70], [70, 50, 70], { color: green, mirror: true, offsX: 480, layer: 3 }));
    return st;
  }
  // Duck Pond: a country house, white with dark timbers, a hipped roof with dormers, a side wing and flower boxes
  function mfarm(clan) {
    const st = [], wall = C("#fff4d6"), beam = C("#5a3a1a"), roof = C(CLANS[clan].color), glass = C("#8fd3f4"), stone = C("#b8b0a0"), red = C("#e8443a"), green = C("#3cbf6c");
    st.push(S("cube", [0, 0, 24], [740, 440, 24], { color: stone, round: 0.15 }));
    st.push(S("cube", [-60, -30, 330], [520, 330, 300], { color: wall, round: 0.04 }));
    st.push(S("cube", [560, -90, 230], [200, 260, 200], { color: wall, round: 0.04 }));
    st.push(S("cube", [-60, 302, 175], [90, 8, 150], { m: "rep", color: beam }));
    for (const x of [-420, -230, 110, 300]) for (const z of [200, 470]) st.push(S("cube", [x, 302, z], [55, 8, 70], { m: "rep", color: glass }));
    for (const x of [-560, -330, 210, 440]) st.push(S("cube", [x, 304, 330], [8, 6, 300], { m: "rep", color: beam }));
    st.push(S("cube", [-60, 304, 335], [520, 6, 8], { color: beam, layer: 1 }));
    for (const x of [-420, -230, 110, 300]) st.push(S("cube", [x, 330, 140], [60, 22, 14], { color: red, layer: 1 }));
    st.push(S("cube", [-60, -30, 780], [550, 360, 150], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cube", [560, -90, 520], [215, 275, 90], { color: roof, cone: 1, layer: 2 }));
    for (const x of [-300, 180]) st.push(S("cube", [x, 210, 760], [70, 80, 70], { color: wall, layer: 3 }));
    for (const x of [-300, 180]) st.push(S("cube", [x, 210, 860], [80, 90, 40], { color: roof, cone: 1, layer: 3 }));
    st.push(S("sphere", [-650, 380, 60], [80, 50, 60], { color: green, layer: 3 }));
    return st;
  }
  // Waterfall: a little stone castle, a square keep with battlements, a hall, two round turrets with pointed roofs
  function mkeep(clan) {
    const st = [], stone = C("#9a948a"), stone2 = C("#b0aa9e"), roof = C(CLANS[clan].color), dark = C("#2a2420"), slit = C("#1a1612"), wood = C("#7a4a24");
    st.push(S("cube", [0, 0, 24], [720, 420, 24], { color: C("#7e786e"), round: 0.12 }));
    st.push(S("cube", [-150, -20, 300], [440, 300, 280], { color: stone }));
    st.push(S("cube", [380, -60, 560], [200, 200, 540], { color: stone2 }));
    st.push(S("cylinder", [-600, 230, 420], [110, 110, 420], { color: stone2 }));
    st.push(S("cylinder", [-600, -270, 420], [110, 110, 420], { color: stone2 }));
    st.push(S("cube", [-150, 272, 160], [90, 12, 140], { m: "rep", color: dark }));
    for (const x of [-420, 90]) st.push(S("cube", [x, 272, 380], [16, 12, 60], { m: "rep", color: slit }));
    st.push(S("cube", [380, 132, 800], [16, 12, 60], { m: "rep", color: slit }));
    for (const x of [-500, -330, -160, 10, 180]) st.push(S("cube", [x, 280, 620], [40, 26, 40], { color: stone2, layer: 1 }));
    for (const x of [260, 380, 500]) st.push(S("cube", [x, 140, 1140], [40, 26, 40], { color: stone, layer: 1 }));
    st.push(S("cylinder", [-600, 230, 990], [140, 140, 160], { color: roof, cone: 1, layer: 2 }));
    st.push(S("cylinder", [-600, -270, 990], [140, 140, 160], { color: roof, cone: 1, layer: 2 }));
    st.push(S("joint", [380, -60, 1240], [7, 7, 120], { color: wood, layer: 3 }));
    st.push(S("cube", [440, -60, 1320], [60, 4, 36], { color: roof, layer: 3 }));
    return st;
  }
  // The Pier: a captain's house, pale blue boards and white trim, a porch with white columns, a widow's walk on the
  // roof and a white-and-red lookout tower like a little lighthouse
  function mcaptain(clan) {
    const st = [], board = C("#a8d8f0"), white = C("#ffffff"), roof = C("#5a6a7a"), red = C("#e8443a"), glass = C("#ffe08a"), acc = C(CLANS[clan].color), stone = C("#b8b0a0"), gold = C("#ffd23f");
    st.push(S("cube", [0, 0, 24], [740, 440, 24], { color: stone, round: 0.15 }));
    st.push(S("cube", [-100, -40, 330], [560, 330, 300], { color: board, round: 0.04 }));
    st.push(S("cylinder", [560, -60, 560], [150, 150, 540], { color: white }));
    st.push(S("cube", [-100, 292, 170], [90, 8, 150], { m: "rep", color: acc }));
    for (const x of [-480, -290, 90, 280]) for (const z of [200, 480]) st.push(S("cube", [x, 292, z], [55, 8, 75], { m: "rep", color: glass }));
    for (const z of [300, 700]) st.push(S("cylinder", [560, -60, z], [154, 154, 50], { m: "rep", color: red }));
    for (const x of [-420, -220, 20, 220]) st.push(S("joint", [x, 420, 160], [20, 20, 150], { color: white, layer: 1 }));
    st.push(S("cube", [-100, 410, 320], [580, 110, 14], { color: white, layer: 1 }));
    st.push(S("cube", [-100, -40, 780], [580, 350, 150], { color: roof, cone: 0.7, layer: 2 }));
    st.push(S("cylinder", [560, -60, 1190], [175, 175, 90], { color: red, cone: 1, layer: 2 }));
    st.push(S("cube", [-100, -40, 900], [200, 120, 50], { color: white, layer: 3 }));
    st.push(S("cylinder", [560, -60, 1110], [100, 100, 40], { color: glass, layer: 3 }));
    st.push(S("cylinder", [-100, 300, 640], [60, 60, 8], { color: gold, hole: 0.6, rot: [1.5708, 0, 0], layer: 3 }));
    return st;
  }
  // Beach Sand: a white villa, cubic rooms stepping up in terraces, arches, shutters and doors in the clan's colour,
  // a little blue-white dome and pots of flowers
  function mvilla(clan) {
    const st = [], white = C("#ffffff"), white2 = C("#f3efe6"), acc = C(CLANS[clan].color), dark = C("#3a3a4a"), blue = C("#2f8fe0"), sand = C("#e8d9b0"), green = C("#3cbf6c");
    st.push(S("cube", [0, 0, 24], [760, 450, 24], { color: sand, round: 0.15 }));
    st.push(S("cube", [-200, 0, 260], [500, 380, 240], { color: white, round: 0.08 }));
    st.push(S("cube", [360, -80, 360], [300, 280, 340], { color: white2, round: 0.08 }));
    st.push(S("cube", [-300, -100, 640], [260, 220, 140], { color: white, round: 0.08 }));
    for (const x of [-480, -200, 80]) st.push(S("cube", [x, 372, 190], [70, 12, 130], { m: "rep", color: dark }));
    for (const x of [-480, -200, 80]) st.push(S("cylinder", [x, 372, 320], [70, 70, 12], { m: "rep", color: dark, rot: [1.5708, 0, 0] }));
    for (const x of [270, 450]) st.push(S("cube", [x, 194, 520], [50, 10, 70], { m: "rep", color: acc }));
    st.push(S("cube", [-200, 0, 510], [510, 390, 12], { color: white2, layer: 1 }));
    for (const x of [-660, 260]) st.push(S("cube", [x, 380, 540], [40, 8, 30], { color: white2, layer: 1 }));
    st.push(S("sphere", [360, -80, 760], [150, 150, 130], { color: blue, layer: 2 }));
    st.push(S("cylinder", [360, -80, 705], [160, 160, 14], { color: white, layer: 2 }));
    st.push(S("sphere", [-650, 400, 70], [60, 50, 70], { color: green, layer: 3 }));
    st.push(S("cylinder", [-650, 400, 30], [50, 50, 30], { color: acc, layer: 3 }));
    return st;
  }
  // The Palm: a tropical villa on a stone base, wooden walls under great steep thatched roofs, two smaller pavilions,
  // a veranda on posts and tiki torches
  function mtropic(clan) {
    const st = [], thatch = C("#e8c35a"), thatch2 = C("#d4a94a"), wood = C("#8a5a30"), dark = C("#5a3a1a"), stone = C("#9a9a9a"), acc = C(CLANS[clan].color), flame = C("#ffb020");
    st.push(S("cube", [0, 0, 50], [760, 440, 50], { color: stone, round: 0.15 }));
    st.push(S("cube", [0, -20, 300], [380, 300, 200], { color: wood, round: 0.05 }));
    st.push(S("cube", [560, -40, 260], [170, 200, 160], { color: wood, round: 0.05, mirror: true, offsX: 560 }));
    st.push(S("cube", [0, 282, 220], [80, 8, 120], { m: "rep", color: dark }));
    for (const x of [-230, 230]) st.push(S("cube", [x, 282, 300], [60, 8, 60], { m: "rep", color: acc }));
    for (const x of [-330, -110, 110, 330]) st.push(S("joint", [x, 400, 230], [16, 16, 140], { color: dark, layer: 1 }));
    st.push(S("cube", [0, 400, 380], [400, 120, 12], { color: thatch2, layer: 1 }));
    st.push(S("cube", [0, -20, 820], [470, 380, 320], { color: thatch, cone: 1, layer: 2 }));
    st.push(S("cube", [560, -40, 600], [220, 250, 200], { color: thatch2, cone: 1, mirror: true, offsX: 560, layer: 2 }));
    st.push(S("joint", [700, 380, 160], [10, 10, 130], { color: dark, mirror: true, offsX: 700, layer: 3 }));
    st.push(S("sphere", [700, 380, 310], [22, 22, 30], { color: flame, mirror: true, offsX: 700, layer: 3 }));
    st.push(S("sphere", [0, -20, 1150], [40, 40, 30], { color: acc, layer: 3 }));
    return st;
  }

  // ---------- where holders live when the land is full ----------
  // a warren: a grassy hill with a round door in its clan's colour, round windows, lanterns, a chimney
  // and a flag; inside (interiors.js) a cavern with a bed for every Tickle who lives there
  function warren(clan) {
    const st = [], grass = C("#5aa84a"), grass2 = C("#4a9a3e"), rock = C("#8a8a8a"), stone = C("#b8b0a0"), wood = C("#7a4a24"), door = C(CLANS[clan].color), gold = C("#ffd23f"), glass = C("#ffe08a"), dark = C("#3a2a1a"), flower = C("#ff8fc0");
    // layer 0: the hill, a few rocks and flowers on it, the doorway set into its front
    st.push(S("sphere", [0, -60, 170], [520, 420, 330], { color: grass }));
    st.push(S("sphere", [-300, -120, 120], [300, 280, 230], { color: grass2, blend: 60 }));
    st.push(S("sphere", [320, -140, 110], [280, 260, 210], { color: grass, blend: 60 }));
    st.push(S("sphere", [-160, -200, 420], [120, 90, 60], { m: "rep", color: rock }));
    st.push(S("sphere", [210, 40, 380], [50, 40, 40], { m: "rep", color: flower }));
    st.push(S("cylinder", [0, 380, 250], [250, 250, 70], { m: "sub", color: grass, rot: [1.5708, 0, 0] }));
    // layer 1: the round door in its stone ring, the knob, two round windows with their frames
    st.push(S("cylinder", [0, 318, 250], [232, 232, 18], { color: door, rot: [1.5708, 0, 0], layer: 1 }));
    st.push(S("cylinder", [0, 322, 250], [262, 262, 26], { color: stone, hole: 0.86, rot: [1.5708, 0, 0], layer: 1 }));
    st.push(S("sphere", [0, 342, 250], [22, 14, 22], { color: gold, layer: 1 }));
    st.push(S("cube", [0, 337, 250], [8, 4, 200], { color: dark, layer: 1, blend: 2 }));
    st.push(S("cylinder", [360, 230, 210], [70, 70, 14], { color: glass, rot: [1.5708, 0, -0.45], mirror: true, offsX: 360, layer: 1 }));
    st.push(S("cylinder", [362, 236, 210], [86, 86, 18], { color: wood, hole: 0.8, rot: [1.5708, 0, -0.45], mirror: true, offsX: 362, layer: 1 }));
    // layer 2: a lantern on a post either side of the door
    st.push(S("joint", [330, 430, 150], [10, 10, 150], { color: wood, mirror: true, offsX: 330, layer: 2 }));
    st.push(S("cube", [330, 430, 320], [26, 26, 30], { color: glass, round: 0.3, mirror: true, offsX: 330, layer: 2 }));
    st.push(S("cube", [330, 430, 360], [34, 34, 10], { color: dark, cone: 1, mirror: true, offsX: 330, layer: 2 }));
    // layer 3: the chimney, the flag pole and the flag in the clan's colour
    st.push(S("cylinder", [-230, -120, 470], [44, 44, 90], { color: stone, layer: 3 }));
    st.push(S("cylinder", [-230, -120, 565], [52, 52, 12], { color: rock, layer: 3 }));
    st.push(S("joint", [190, -80, 560], [7, 7, 140], { color: wood, layer: 3 }));
    st.push(S("cube", [250, -80, 650], [60, 4, 40], { color: door, layer: 3 }));
    return st;
  }
  // a plot for sale: two posts and a board with a red band and a golden shell painted on it
  function plotsign() {
    const st = [], wood = C("#7a4a24"), board = C("#f3e2c0"), red = C("#e8443a"), gold = C("#ffd23f");
    // layer 0: the posts and the board
    st.push(S("joint", [90, 0, 140], [10, 10, 140], { color: wood, mirror: true, offsX: 90 }));
    st.push(S("cube", [0, 0, 215], [130, 9, 65], { color: board, round: 0.2 }));
    // layer 1: the red band and the golden shell
    st.push(S("cube", [0, 10, 262], [128, 3, 14], { color: red, layer: 1 }));
    st.push(S("sphere", [0, 11, 200], [30, 4, 28], { color: gold, layer: 1 }));
    st.push(S("cube", [0, 11, 166], [9, 3, 12], { color: gold, layer: 1 }));
    return st;
  }

  const W = { group: "Wealth" }, six = [0, 1, 2, 3, 4, 5];
  Object.assign(TB.KIT, {
    townhouse: Object.assign({ name: "Townhouse", variants: clanV, build: townhouse, voxel: [18, 40], lazy: true, variantLabel: (v) => CLANS[v].species + " roof" }, W),
    manor: Object.assign({ name: "Manor", variants: clanV, build: manor, voxel: [18, 40], lazy: true, variantLabel: (v) => CLANS[v].species + " roof" }, W),
    smithy: Object.assign({ name: "Blacksmiths' Guild", variants: [0], build: smithy, voxel: [12, 30], lazy: true }, W),
    paddock: Object.assign({ name: "Horse Paddock", variants: [0], build: paddock, voxel: [14, 32], lazy: true }, W),
    roost: Object.assign({ name: "Griffin Roost", variants: [0], build: roost, voxel: [14, 32], lazy: true }, W),
    horse: Object.assign({ name: "Horse", variants: [0, 1, 2, 3], build: horse, voxel: [7], variantLabel: (v) => ["dun pony", "chestnut", "black", "white charger"][v] }, W),
    horseleg: Object.assign({ name: "Horse Leg", variants: [0, 1, 2, 3], build: horseleg, voxel: [6] }, W),
    griffinmount: Object.assign({ name: "Riding Griffin", variants: [0], build: griffinmount, voxel: [8] }, W),
    griffinwing: Object.assign({ name: "Griffin Wing", variants: [0, 1], build: griffinwing, voxel: [8], variantLabel: (v) => (v ? "left" : "right") }, W),
    sailboat: Object.assign({ name: "Sailing Boat", variants: six, build: sailboat, voxel: [9] }, W),
    yacht: Object.assign({ name: "Yacht", variants: six, build: yacht, voxel: [11] }, W),
    palace: { name: "Great Palace", group: "Village", variants: clanV, build: palace, voxel: [24, 52], lazy: true, variantLabel: (v) => CLANS[v].species + " dome" },
    castle: { name: "Castle", group: "Village", variants: clanV, build: castle, voxel: [28, 60], lazy: true, variantLabel: (v) => CLANS[v].species + " roofs" },
    castle2: { name: "Keep Castle", group: "Village", variants: clanV, build: castle2, voxel: [26, 56], lazy: true, variantLabel: (v) => CLANS[v].species + " roofs" },
    castle3: { name: "Citadel", group: "Village", variants: clanV, build: castle3, voxel: [32, 68], lazy: true, variantLabel: (v) => CLANS[v].species + " roofs" },
    wall: { name: "Castle Wall", group: "Village", variants: [0], build: wall, voxel: [16, 36], lazy: true },
    walltower: { name: "Wall Tower", group: "Village", variants: [0], build: walltower, voxel: [16, 36], lazy: true },
    gatehouse: { name: "Castle Gate", group: "Village", variants: clanV, build: gatehouse, voxel: [16, 36], lazy: true, variantLabel: (v) => CLANS[v].species + " banner" },
    mlodge: { name: "Log Lodge (Camping mansion)", group: "Village", variants: clanV, build: mlodge, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " roof" },
    mfarm: { name: "Country House (Duck Pond mansion)", group: "Village", variants: clanV, build: mfarm, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " roof" },
    mkeep: { name: "Stone Keep (Waterfall mansion)", group: "Village", variants: clanV, build: mkeep, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " roofs" },
    mcaptain: { name: "Captain's House (Pier mansion)", group: "Village", variants: clanV, build: mcaptain, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " door" },
    mvilla: { name: "White Villa (Beach Sand mansion)", group: "Village", variants: clanV, build: mvilla, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " shutters" },
    mtropic: { name: "Tropical Villa (Palm mansion)", group: "Village", variants: clanV, build: mtropic, voxel: [22, 48], lazy: true, variantLabel: (v) => CLANS[v].species + " accents" },
    warren: { name: "Warren", group: "Village", variants: clanV, build: warren, voxel: [16, 36], lazy: true, variantLabel: (v) => CLANS[v].species + " door" },
    plotsign: { name: "Plot for Sale", group: "Village", variants: [0], build: plotsign, voxel: [8, 20], lazy: true },
  });
})(typeof self !== "undefined" ? self : this);
