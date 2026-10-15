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
  });
})(typeof self !== "undefined" ? self : this);
