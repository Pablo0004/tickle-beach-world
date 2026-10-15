/* The mythological bestiary of the underworlds: cyclops, medusa, hydra, cerberus, harpy, basilisk,
 * chimera, manticore, golem, mummy, werewolf, wraith, centaur, kobold, lich and salamander, plus the
 * crown the guardian of each floor wears. Same stroke format and palette as the rest of the kit.
 * SDF units, z up, ground at z = 0, front +y; a Tickle is about 480 tall. Every layer holds at
 * least two strokes (the on-chain shader skips a layer with a single one). */
(function (G) {
  "use strict";
  const TB = G.TB, { C, S, dir } = TB.kitHelpers;
  const bone = () => C("#e8e2d0"), black = () => C("#111111"), steel = () => C("#c8c8c8"), iron = () => C("#6a6a6a"), wood = () => C("#a0703a"), dark = () => C("#6b4a2b");
  const red = () => C("#e8443a"), gold = () => C("#ffd23f"), white = () => C("#ffffff"), ivory = () => C("#f3e2c0");

  // the Cyclops: one great eye, a horn on the brow, a tree for a club
  function cyclops() {
    const st = [], skin = C("#d9a878"), skin2 = C("#b8885a");
    st.push(S("joint", [72, 0, 145], [44, 44, 112], { color: skin, mirror: true, offsX: 72 }));
    st.push(S("sphere", [72, 30, 30], [50, 70, 30], { color: skin2, mirror: true, offsX: 72 }));
    st.push(S("sphere", [0, 0, 425], [155, 118, 185], { color: skin, blend: 30 }));
    st.push(S("joint", [190, 10, 455], [40, 40, 140], { color: skin, mirror: true, offsX: 190, rot: dir(0.4, 0.2, -1), blend: 20 }));
    st.push(S("sphere", [235, 50, 320], [48, 48, 48], { color: skin2, mirror: true, offsX: 235 }));
    st.push(S("sphere", [0, 22, 665], [90, 88, 92], { color: skin, blend: 30 }));
    // layer 1: the eye, the horn, the loincloth
    st.push(S("sphere", [0, 98, 690], [46, 14, 40], { color: white(), layer: 1 }));
    st.push(S("sphere", [0, 108, 690], [22, 8, 22], { color: C("#2f8fe0"), layer: 1 }));
    st.push(S("sphere", [0, 113, 690], [10, 5, 10], { color: black(), layer: 1 }));
    st.push(S("cube", [0, 100, 742], [52, 14, 10], { color: skin2, round: 0.5, layer: 1 }));
    st.push(S("cylinder", [0, 60, 770], [14, 14, 30], { color: ivory(), cone: 1, rot: dir(0, 0.3, 1), layer: 1 }));
    st.push(S("cube", [0, 10, 268], [140, 120, 62], { color: C("#8a6a4a"), round: 0.3, layer: 1 }));
    // layer 2: the club, a young tree with its knots
    st.push(S("joint", [245, 75, 450], [30, 30, 220], { color: wood(), cone: 0.5, rot: dir(0, -0.2, -1), layer: 2 }));
    st.push(S("sphere", [250, 120, 640], [22, 22, 22], { color: dark(), layer: 2 }));
    st.push(S("sphere", [230, 110, 590], [16, 16, 16], { color: dark(), layer: 2 }));
    return st;
  }
  // Medusa: a coiled serpent below, a green gorgon above, a crown of living snakes
  function medusa() {
    const st = [], scale = C("#3f8a4a"), skin = C("#8fc77a"), snake = C("#2e8b3a");
    st.push(S("sphere", [0, 0, 55], [155, 150, 55], { color: scale }));
    st.push(S("sphere", [0, -15, 150], [112, 108, 62], { color: scale, blend: 30 }));
    st.push(S("sphere", [0, 10, 300], [74, 56, 100], { color: skin, blend: 22 }));
    st.push(S("joint", [85, 20, 310], [18, 18, 80], { color: skin, mirror: true, offsX: 85, rot: dir(0.5, 0.4, -1) }));
    st.push(S("sphere", [0, 22, 452], [56, 56, 62], { color: skin, blend: 14 }));
    st.push(S("cylinder", [130, -110, 40], [36, 36, 80], { color: scale, cone: 1, rot: dir(1, -0.6, 0.1) }));
    // layer 1: the snakes for hair, and the stone-cold eyes
    for (let k = 0; k < 7; k++) {
      const a = -0.9 + (k / 6) * 1.8 + Math.PI / 2, cx = Math.cos(a), cy = Math.sin(a) - 0.5;
      st.push(S("joint", [cx * 46, cy * 40, 505], [11, 11, 42], { color: snake, rot: dir(cx, cy, 0.9), layer: 1 }));
    }
    st.push(S("sphere", [22, 70, 462], [11, 6, 9], { color: gold(), mirror: true, offsX: 22, layer: 1 }));
    // layer 2: the snakes' heads
    for (let k = 0; k < 7; k++) {
      const a = -0.9 + (k / 6) * 1.8 + Math.PI / 2, cx = Math.cos(a), cy = Math.sin(a) - 0.5;
      st.push(S("sphere", [cx * 95, cy * 82, 545], [16, 14, 12], { color: snake, layer: 2 }));
    }
    return st;
  }
  // the Hydra: five heads on long necks over a heavy body
  function hydra() {
    const st = [], body = C("#2e6b3a"), belly = C("#9ac77a");
    st.push(S("sphere", [0, -40, 220], [195, 235, 150], { color: body }));
    st.push(S("sphere", [0, 40, 180], [140, 160, 100], { color: belly, blend: 40 }));
    st.push(S("joint", [140, 90, 90], [44, 44, 80], { color: body, mirror: true, offsX: 140 }));
    st.push(S("joint", [140, -160, 90], [44, 44, 80], { color: body, mirror: true, offsX: 140 }));
    st.push(S("joint", [0, -300, 130], [46, 46, 130], { color: body, cone: 0.8, rot: dir(0, -1, -0.3) }));
    // layer 1: the five necks
    st.push(S("joint", [0, 150, 440], [36, 36, 170], { color: body, rot: dir(0, 0.35, 1), layer: 1 }));
    st.push(S("joint", [110, 120, 400], [32, 32, 160], { color: body, rot: dir(0.5, 0.3, 1), mirror: true, offsX: 110, layer: 1 }));
    st.push(S("joint", [200, 60, 340], [30, 30, 140], { color: body, rot: dir(0.9, 0.3, 0.8), mirror: true, offsX: 200, layer: 1 }));
    // layer 2: the heads with their yellow eyes
    st.push(S("sphere", [0, 230, 620], [52, 70, 45], { color: body, layer: 2 }));
    st.push(S("sphere", [180, 190, 560], [46, 62, 40], { color: body, mirror: true, offsX: 180, layer: 2 }));
    st.push(S("sphere", [320, 120, 460], [42, 56, 38], { color: body, mirror: true, offsX: 320, layer: 2 }));
    // layer 3: eyes and open red mouths
    st.push(S("sphere", [22, 270, 640], [9, 6, 9], { color: gold(), mirror: true, offsX: 22, layer: 3 }));
    st.push(S("sphere", [198, 228, 578], [8, 5, 8], { color: gold(), mirror: true, offsX: 198, layer: 3 }));
    st.push(S("sphere", [334, 155, 476], [8, 5, 8], { color: gold(), mirror: true, offsX: 334, layer: 3 }));
    st.push(S("cube", [0, 290, 600], [26, 10, 8], { color: red(), layer: 3 }));
    return st;
  }
  // Cerberus: the three-headed hound, spiked collars and red eyes
  function cerberus() {
    const st = [], fur = C("#2a2a2a"), fur2 = C("#3a3a3a");
    st.push(S("sphere", [0, -30, 235], [112, 195, 112], { color: fur }));
    st.push(S("joint", [70, 110, 110], [30, 30, 100], { color: fur, mirror: true, offsX: 70 }));
    st.push(S("joint", [70, -160, 110], [30, 30, 100], { color: fur, mirror: true, offsX: 70 }));
    st.push(S("joint", [0, -240, 290], [16, 16, 90], { color: fur, rot: dir(0, -1, 0.8) }));
    st.push(S("sphere", [0, 195, 345], [62, 70, 60], { color: fur, blend: 20 }));
    st.push(S("sphere", [100, 170, 320], [56, 64, 54], { color: fur, mirror: true, offsX: 100, blend: 20 }));
    // layer 1: snouts, ears, red eyes
    st.push(S("sphere", [0, 262, 330], [30, 40, 26], { color: fur2, layer: 1 }));
    st.push(S("sphere", [112, 232, 305], [27, 36, 24], { color: fur2, mirror: true, offsX: 112, layer: 1 }));
    st.push(S("cylinder", [30, 190, 405], [16, 10, 30], { color: fur, cone: 1, mirror: true, offsX: 30, layer: 1 }));
    st.push(S("sphere", [22, 245, 362], [9, 5, 8], { color: red(), mirror: true, offsX: 22, layer: 1 }));
    st.push(S("sphere", [124, 214, 336], [8, 5, 7], { color: red(), mirror: true, offsX: 124, layer: 1 }));
    // layer 2: the spiked collars
    st.push(S("cylinder", [0, 170, 300], [52, 52, 10], { color: iron(), hole: 0.3, rot: [1.2, 0, 0], layer: 2 }));
    st.push(S("cylinder", [95, 148, 280], [46, 46, 10], { color: iron(), hole: 0.3, rot: [1.2, 0, 0], mirror: true, offsX: 95, layer: 2 }));
    return st;
  }
  // a Harpy: wings and talons, a wild crest and a hooked beak
  function harpy() {
    const st = [], feather = C("#7a5a8a"), pale = C("#e8c8a8"), claw = C("#ffd23f");
    st.push(S("sphere", [0, 0, 235], [72, 62, 102], { color: feather }));
    st.push(S("sphere", [0, 22, 355], [50, 50, 50], { color: pale, blend: 12 }));
    st.push(S("joint", [32, 0, 90], [10, 10, 60], { color: claw, mirror: true, offsX: 32 }));
    st.push(S("sphere", [32, 22, 22], [20, 30, 10], { color: claw, mirror: true, offsX: 32 }));
    // layer 1: wings, crest, tail
    st.push(S("sphere", [150, -30, 300], [120, 20, 80], { color: feather, rot: [0, 0.5, 0.2], mirror: true, offsX: 150, layer: 1 }));
    st.push(S("sphere", [0, -20, 405], [40, 60, 40], { color: C("#4a2a5a"), layer: 1 }));
    st.push(S("sphere", [0, -80, 150], [50, 60, 20], { color: feather, rot: [0.6, 0, 0], layer: 1 }));
    // layer 2: eyes and beak
    st.push(S("sphere", [18, 66, 365], [9, 5, 8], { color: red(), mirror: true, offsX: 18, layer: 2 }));
    st.push(S("cylinder", [0, 80, 340], [12, 12, 24], { color: claw, cone: 1, rot: dir(0, 1, -0.5), layer: 2 }));
    return st;
  }
  // the Basilisk: king of serpents, a red crest like a crown and burning eyes
  function basilisk() {
    const st = [], body = C("#6a8a2a"), body2 = C("#4e6a1e");
    const segs = [[0, -280, 40, 46], [60, -200, 50, 54], [30, -110, 60, 60], [-30, -30, 75, 64], [0, 50, 100, 62], [0, 110, 150, 56]];
    for (const [x, y, z, r] of segs) st.push(S("sphere", [x, y, z], [r, r * 1.2, r * 0.8], { color: body, blend: 30 }));
    st.push(S("sphere", [0, 175, 200], [58, 70, 48], { color: body2, blend: 20 }));
    // layer 1: the crest, the eyes, the fangs
    st.push(S("cylinder", [0, 150, 270], [20, 30, 50], { color: red(), cone: 1, layer: 1 }));
    st.push(S("cylinder", [30, 140, 255], [14, 22, 40], { color: red(), cone: 1, rot: dir(0.5, 0, 1), mirror: true, offsX: 30, layer: 1 }));
    st.push(S("sphere", [26, 230, 215], [11, 6, 9], { color: gold(), mirror: true, offsX: 26, layer: 1 }));
    st.push(S("joint", [16, 238, 168], [5, 5, 16], { color: white(), cone: 1, rot: [3.1416, 0, 0], mirror: true, offsX: 16, layer: 1 }));
    return st;
  }
  // the Chimera: a lion with a goat's head on its back and a serpent for a tail
  function chimera() {
    const st = [], lion = C("#c8962e"), mane = C("#8a5a1e"), goat = C("#bdbdbd"), snake = C("#3f8a4a");
    st.push(S("sphere", [0, 0, 230], [100, 190, 110], { color: lion }));
    st.push(S("joint", [62, 120, 100], [28, 28, 95], { color: lion, mirror: true, offsX: 62 }));
    st.push(S("joint", [62, -130, 100], [28, 28, 95], { color: lion, mirror: true, offsX: 62 }));
    st.push(S("sphere", [0, 175, 320], [112, 62, 112], { color: mane, blend: 20 }));
    st.push(S("sphere", [0, 200, 320], [78, 72, 78], { color: lion, blend: 14 }));
    // layer 1: the goat's head and horns, the serpent tail
    st.push(S("sphere", [0, -20, 390], [40, 52, 46], { color: goat, layer: 1 }));
    st.push(S("cylinder", [26, -36, 440], [12, 12, 40], { color: ivory(), cone: 1, rot: dir(0.4, -0.6, 0.8), mirror: true, offsX: 26, layer: 1 }));
    st.push(S("joint", [0, -260, 300], [20, 20, 110], { color: snake, rot: dir(0, -0.4, 1), layer: 1 }));
    st.push(S("sphere", [0, -300, 420], [28, 36, 24], { color: snake, layer: 1 }));
    // layer 2: the lion's face
    st.push(S("sphere", [0, 262, 300], [36, 26, 30], { color: C("#e8b35a"), layer: 2 }));
    st.push(S("sphere", [26, 258, 345], [10, 5, 9], { color: gold(), mirror: true, offsX: 26, layer: 2 }));
    st.push(S("sphere", [0, 288, 312], [12, 6, 10], { color: black(), layer: 2 }));
    return st;
  }
  // the Manticore: a red lion with bat wings and a scorpion's sting
  function manticore() {
    const st = [], lion = C("#c0502b"), mane = C("#7a2a1a"), wing = C("#5a1e1e");
    st.push(S("sphere", [0, 0, 230], [100, 185, 108], { color: lion }));
    st.push(S("joint", [62, 120, 100], [28, 28, 95], { color: lion, mirror: true, offsX: 62 }));
    st.push(S("joint", [62, -125, 100], [28, 28, 95], { color: lion, mirror: true, offsX: 62 }));
    st.push(S("sphere", [0, 172, 322], [110, 60, 110], { color: mane, blend: 20 }));
    st.push(S("sphere", [0, 198, 322], [76, 70, 76], { color: lion, blend: 14 }));
    // layer 1: the bat wings and the scorpion tail
    st.push(S("sphere", [170, -20, 360], [140, 24, 80], { color: wing, rot: [0, 0.45, 0.25], mirror: true, offsX: 170, layer: 1 }));
    st.push(S("joint", [0, -230, 330], [22, 22, 100], { color: lion, rot: dir(0, -0.3, 1), layer: 1 }));
    st.push(S("joint", [0, -170, 470], [18, 18, 70], { color: lion, rot: dir(0, 1, 0.6), layer: 1 }));
    st.push(S("cylinder", [0, -100, 520], [16, 16, 36], { color: black(), cone: 1, rot: dir(0, 1, -0.2), layer: 1 }));
    // layer 2: the face
    st.push(S("sphere", [26, 256, 348], [10, 5, 9], { color: gold(), mirror: true, offsX: 26, layer: 2 }));
    st.push(S("sphere", [0, 262, 302], [34, 24, 28], { color: C("#e07a4a"), layer: 2 }));
    return st;
  }
  // a Golem: blocks of stone held together by glowing runes
  function golem() {
    const st = [], stone = C("#8a8a8a"), stone2 = C("#6a6a6a"), rune = C("#4fe0c0");
    st.push(S("cube", [70, 0, 120], [50, 50, 110], { color: stone2, round: 0.15, mirror: true, offsX: 70 }));
    st.push(S("cube", [0, 0, 400], [155, 105, 145], { color: stone, round: 0.2 }));
    st.push(S("joint", [200, 0, 420], [52, 52, 150], { color: stone2, rot: dir(0.3, 0.1, -1), mirror: true, offsX: 200 }));
    st.push(S("cube", [240, 30, 250], [62, 62, 62], { color: stone, round: 0.2, mirror: true, offsX: 240 }));
    st.push(S("cube", [0, 20, 615], [80, 70, 70], { color: stone, round: 0.25 }));
    // layer 1: runes, eyes, moss
    st.push(S("cube", [0, 108, 420], [40, 4, 40], { color: rune, rot: [0, 0.785, 0], layer: 1 }));
    st.push(S("sphere", [30, 90, 630], [14, 6, 10], { color: rune, mirror: true, offsX: 30, layer: 1 }));
    st.push(S("sphere", [90, -60, 540], [50, 30, 26], { color: C("#3cbf6c"), layer: 1 }));
    return st;
  }
  // a Mummy: wound in old bandages, arms out, green eyes in the dark
  function mummy() {
    const st = [], band = C("#e8dcc0"), band2 = C("#c8b890");
    st.push(S("joint", [32, 0, 110], [26, 26, 100], { color: band, mirror: true, offsX: 32 }));
    st.push(S("joint", [0, 0, 300], [64, 64, 95], { color: band, blend: 20 }));
    st.push(S("sphere", [0, 8, 445], [52, 54, 58], { color: band, blend: 12 }));
    st.push(S("joint", [70, 80, 350], [18, 18, 70], { color: band, rot: dir(0.1, 1, 0.05), mirror: true, offsX: 70 }));
    // layer 1: the darker bands and a trailing strip, the eyes
    for (const z of [200, 260, 320, 380]) st.push(S("cylinder", [0, 0, z], [68, 68, 8], { color: band2, rot: [0.1 * ((z / 60) % 2 ? 1 : -1), 0, 0], layer: 1 }));
    st.push(S("cube", [40, -60, 210], [10, 4, 90], { color: band2, rot: [0.4, 0, 0.2], layer: 1 }));
    st.push(S("sphere", [20, 56, 452], [10, 5, 8], { color: C("#7cff6a"), mirror: true, offsX: 20, layer: 1 }));
    return st;
  }
  // a Werewolf: hunched, claws out, a wolf's head howling at nothing
  function werewolf() {
    const st = [], fur = C("#5a4232"), fur2 = C("#7a5a42");
    st.push(S("joint", [58, -10, 120], [32, 32, 100], { color: fur, mirror: true, offsX: 58, rot: dir(0, 0.3, 1) }));
    st.push(S("sphere", [0, 0, 340], [120, 100, 140], { color: fur, blend: 30 }));
    st.push(S("sphere", [0, 50, 360], [80, 60, 90], { color: fur2, blend: 30 }));
    st.push(S("joint", [150, 40, 330], [30, 30, 140], { color: fur, mirror: true, offsX: 150, rot: dir(0.3, 0.4, -1) }));
    st.push(S("sphere", [0, 90, 500], [60, 62, 58], { color: fur, blend: 16 }));
    st.push(S("joint", [0, 150, 490], [26, 26, 44], { color: fur2, rot: dir(0, 1, -0.1) }));
    // layer 1: ears, eyes, fangs, claws, tail
    st.push(S("cylinder", [36, 70, 560], [16, 10, 34], { color: fur, cone: 1, mirror: true, offsX: 36, layer: 1 }));
    st.push(S("sphere", [24, 140, 520], [9, 5, 7], { color: gold(), mirror: true, offsX: 24, layer: 1 }));
    st.push(S("joint", [12, 192, 470], [5, 5, 12], { color: white(), cone: 1, rot: [3.1416, 0, 0], mirror: true, offsX: 12, layer: 1 }));
    st.push(S("joint", [196, 110, 190], [6, 6, 22], { color: white(), cone: 1, rot: dir(0, 1, -0.6), mirror: true, offsX: 196, layer: 1 }));
    st.push(S("joint", [0, -120, 230], [24, 24, 80], { color: fur, cone: 0.6, rot: dir(0, -1, -0.4), layer: 1 }));
    return st;
  }
  // a Wraith: a hooded shadow that floats, eyes like cold stars, a scythe
  function wraith() {
    const st = [], cloak = C("#2a1e3a"), cloak2 = C("#3d2a52");
    st.push(S("cylinder", [0, 0, 250], [110, 100, 240], { color: cloak, cone: 0.7 }));
    st.push(S("sphere", [0, 10, 470], [72, 72, 72], { color: cloak2, blend: 20 }));
    st.push(S("joint", [110, 40, 340], [26, 26, 100], { color: cloak, mirror: true, offsX: 110, rot: dir(0.4, 0.6, -0.6) }));
    // layer 1: the empty face and its eyes, the pale hands
    st.push(S("sphere", [0, 52, 465], [46, 30, 46], { color: black(), layer: 1 }));
    st.push(S("sphere", [18, 70, 475], [8, 4, 8], { color: C("#8fd3f4"), mirror: true, offsX: 18, layer: 1 }));
    st.push(S("sphere", [160, 120, 280], [20, 20, 20], { color: C("#c9d4ff"), mirror: true, offsX: 160, layer: 1 }));
    // layer 2: the scythe
    st.push(S("joint", [170, 120, 330], [8, 8, 220], { color: dark(), rot: dir(0, 0.1, 1), layer: 2 }));
    st.push(S("cylinder", [170, 60, 545], [80, 12, 8], { color: steel(), cone: 0.8, rot: [0, 0, 0.3], layer: 2 }));
    return st;
  }
  // a Centaur: a bronze-helmed warrior on a horse's body, spear and round shield
  function centaur() {
    const st = [], horse = C("#8a5a32"), skin = C("#d9a878"), bronze = C("#c8962e");
    st.push(S("sphere", [0, -60, 230], [92, 185, 92], { color: horse }));
    st.push(S("joint", [55, 60, 100], [22, 22, 100], { color: horse, mirror: true, offsX: 55 }));
    st.push(S("joint", [55, -180, 100], [22, 22, 100], { color: horse, mirror: true, offsX: 55 }));
    st.push(S("joint", [0, -260, 240], [14, 14, 80], { color: C("#3a2a1a"), rot: dir(0, -1, -0.6) }));
    st.push(S("sphere", [0, 100, 385], [62, 52, 92], { color: skin, blend: 30 }));
    st.push(S("joint", [70, 120, 400], [16, 16, 70], { color: skin, mirror: true, offsX: 70, rot: dir(0.5, 0.4, -1) }));
    st.push(S("sphere", [0, 110, 525], [46, 46, 50], { color: skin, blend: 10 }));
    // layer 1: helmet and crest, eyes
    st.push(S("sphere", [0, 105, 548], [52, 52, 44], { color: bronze, layer: 1 }));
    st.push(S("cube", [0, 95, 600], [8, 50, 26], { color: red(), round: 0.6, layer: 1 }));
    st.push(S("sphere", [18, 150, 522], [8, 5, 7], { color: black(), mirror: true, offsX: 18, layer: 1 }));
    // layer 2: spear and shield
    st.push(S("joint", [110, 170, 420], [7, 7, 220], { color: wood(), rot: dir(0, 0.2, 1), layer: 2 }));
    st.push(S("cylinder", [110, 214, 650], [16, 16, 30], { color: steel(), cone: 1, layer: 2 }));
    st.push(S("cylinder", [-110, 140, 380], [58, 58, 9], { color: bronze, rot: [1.5708, 0, 0.3], layer: 2 }));
    return st;
  }
  // a Kobold: a little scaly dog-lizard with horns and a spear
  function kobold() {
    const st = [], scale = C("#d9603a"), belly = C("#ffd09a");
    st.push(S("joint", [36, 0, 55], [18, 18, 46], { color: scale, mirror: true, offsX: 36 }));
    st.push(S("sphere", [0, 0, 160], [64, 56, 78], { color: scale }));
    st.push(S("sphere", [0, 30, 160], [44, 34, 58], { color: belly, blend: 14 }));
    st.push(S("sphere", [0, 30, 262], [52, 56, 46], { color: scale, blend: 12 }));
    st.push(S("joint", [0, 90, 252], [22, 22, 30], { color: scale, rot: dir(0, 1, -0.1) }));
    st.push(S("joint", [0, -80, 90], [18, 18, 60], { color: scale, cone: 0.8, rot: dir(0, -1, -0.5) }));
    // layer 1: horns, eyes, arms
    st.push(S("cylinder", [26, 10, 312], [10, 10, 30], { color: ivory(), cone: 1, rot: dir(0.3, -0.5, 1), mirror: true, offsX: 26, layer: 1 }));
    st.push(S("sphere", [20, 72, 278], [8, 5, 7], { color: gold(), mirror: true, offsX: 20, layer: 1 }));
    st.push(S("joint", [70, 20, 165], [12, 12, 46], { color: scale, mirror: true, offsX: 70, rot: dir(0.5, 0.5, -1), layer: 1 }));
    // layer 2: the spear
    st.push(S("joint", [95, 60, 200], [5, 5, 130], { color: wood(), rot: dir(0, 0.3, 1), layer: 2 }));
    st.push(S("cylinder", [95, 100, 330], [10, 10, 20], { color: steel(), cone: 1, layer: 2 }));
    return st;
  }
  // a Lich: a crowned skeleton in rotting robes with a staff and a glowing orb
  function lich() {
    const st = [], robe = C("#3d2a52"), robe2 = C("#2a1e3a");
    st.push(S("cylinder", [0, 0, 220], [100, 90, 220], { color: robe, cone: 0.5 }));
    st.push(S("sphere", [0, 0, 400], [80, 64, 60], { color: robe2, blend: 20 }));
    st.push(S("sphere", [0, 14, 475], [46, 50, 50], { color: bone(), blend: 6 }));
    st.push(S("joint", [95, 40, 330], [18, 18, 80], { color: robe, mirror: true, offsX: 95, rot: dir(0.4, 0.6, -0.5) }));
    // layer 1: the face, its burning eyes, a gold circlet
    st.push(S("sphere", [18, 54, 482], [11, 5, 10], { color: black(), mirror: true, offsX: 18, layer: 1 }));
    st.push(S("sphere", [18, 58, 482], [5, 3, 5], { color: red(), mirror: true, offsX: 18, layer: 1 }));
    st.push(S("cylinder", [0, 14, 518], [50, 50, 8], { color: gold(), hole: 0.2, layer: 1 }));
    // layer 2: the staff and its orb
    st.push(S("joint", [140, 100, 300], [8, 8, 230], { color: dark(), rot: dir(0, 0.15, 1), layer: 2 }));
    st.push(S("sphere", [140, 135, 545], [30, 30, 30], { color: C("#4fe0c0"), layer: 2 }));
    st.push(S("sphere", [150, 120, 280], [18, 18, 18], { color: bone(), layer: 2 }));
    return st;
  }
  // a Salamander: a fire lizard with a crest of flames
  function salamander() {
    const st = [], body = C("#e85a2a"), belly = C("#ffb020");
    st.push(S("sphere", [0, 0, 90], [80, 190, 70], { color: body }));
    st.push(S("sphere", [0, 20, 70], [60, 150, 40], { color: belly, blend: 20 }));
    st.push(S("sphere", [0, 210, 110], [60, 72, 50], { color: body, blend: 20 }));
    st.push(S("joint", [80, 100, 40], [16, 16, 50], { color: body, mirror: true, offsX: 80, rot: dir(1, 0.3, -0.6) }));
    st.push(S("joint", [80, -100, 40], [16, 16, 50], { color: body, mirror: true, offsX: 80, rot: dir(1, -0.3, -0.6) }));
    st.push(S("joint", [0, -260, 70], [30, 30, 110], { color: body, cone: 0.9, rot: dir(0, -1, 0) }));
    // layer 1: the flames along its back, eyes
    for (let k = 0; k < 5; k++) st.push(S("cylinder", [0, 160 - k * 80, 175 - k * 8], [18, 26, 40], { color: k % 2 ? C("#ffd23f") : C("#ffb020"), cone: 1, layer: 1 }));
    st.push(S("sphere", [30, 250, 140], [9, 6, 8], { color: C("#ffd23f"), mirror: true, offsX: 30, layer: 1 }));
    return st;
  }
  // the Golden Tickle: the last guardian, beneath the Maker's statue. A round golden Tickle like the
  // statue above, but awake: burning white eyes, the Maker's golden blade raised, a shield and a halo
  function goldtickle() {
    const st = [], gold = C("#ffd23f"), gold2 = C("#ffb020"), glow = C("#fff4d6"), dark = C("#6b4a2b");
    st.push(S("sphere", [0, 0, 235], [122, 106, 148], { color: gold }));
    st.push(S("sphere", [0, 0, 435], [112, 100, 100], { color: gold, blend: 20 }));
    st.push(S("sphere", [76, 0, 525], [38, 24, 38], { color: gold, mirror: true, offsX: 76 }));
    st.push(S("sphere", [50, 30, 40], [46, 62, 32], { color: gold2, mirror: true, offsX: 50 }));
    st.push(S("joint", [150, 30, 360], [32, 32, 95], { color: gold, rot: dir(0.5, 0.2, 1), blend: 12 }));
    st.push(S("joint", [-145, 50, 240], [32, 32, 80], { color: gold, rot: dir(-0.5, 0.6, -0.4), blend: 12 }));
    // layer 1: the face (burning eyes, a stern brow), the belly
    st.push(S("sphere", [36, 92, 455], [15, 8, 18], { color: glow, mirror: true, offsX: 36, layer: 1 }));
    st.push(S("cube", [36, 96, 486], [26, 8, 6], { color: dark, rot: [0, 0.35, 0], mirror: true, offsX: 36, layer: 1 }));
    st.push(S("cube", [0, 98, 405], [28, 6, 6], { color: dark, layer: 1 }));
    st.push(S("sphere", [0, 62, 225], [72, 52, 92], { color: gold2, layer: 1 }));
    // layer 2: the golden blade held high, the round shield, the halo
    st.push(S("joint", [205, 60, 560], [11, 11, 170], { color: glow, cone: 0.3, rot: dir(0.15, 0.2, 1), layer: 2 }));
    st.push(S("cube", [192, 45, 420], [40, 10, 10], { color: gold2, layer: 2 }));
    st.push(S("cylinder", [-160, 95, 250], [74, 74, 10], { color: gold2, rot: [1.5708, 0, 0.3], layer: 2 }));
    st.push(S("sphere", [-160, 108, 250], [20, 10, 20], { color: glow, layer: 2 }));
    st.push(S("cylinder", [0, 0, 615], [92, 92, 7], { color: glow, hole: 0.15, layer: 2 }));
    return st;
  }
  // the crown a floor's guardian wears
  function crown() {
    const st = [];
    st.push(S("cylinder", [0, 0, 30], [70, 70, 30], { color: gold(), hole: 0.15 }));
    st.push(S("cylinder", [0, 0, 8], [74, 74, 8], { color: C("#ffb020"), hole: 0.15 }));
    // layer 1: the points and their gems
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; st.push(S("cylinder", [Math.cos(a) * 64, Math.sin(a) * 64, 80], [14, 14, 26], { color: gold(), cone: 1, layer: 1 })); }
    st.push(S("sphere", [0, 70, 34], [12, 6, 12], { color: red(), layer: 1 }));
    st.push(S("sphere", [60, 36, 34], [10, 6, 10], { color: C("#2f8fe0"), mirror: true, offsX: 60, layer: 1 }));
    return st;
  }

  const D = { group: "Dungeons" };
  Object.assign(TB.KIT, {
    cyclops: Object.assign({ name: "Cyclops", variants: [0], build: cyclops, voxel: [12] }, D),
    medusa: Object.assign({ name: "Medusa", variants: [0], build: medusa, voxel: [8] }, D),
    hydra: Object.assign({ name: "Hydra", variants: [0], build: hydra, voxel: [11] }, D),
    cerberus: Object.assign({ name: "Cerberus", variants: [0], build: cerberus, voxel: [9] }, D),
    harpy: Object.assign({ name: "Harpy", variants: [0], build: harpy, voxel: [7] }, D),
    basilisk: Object.assign({ name: "Basilisk", variants: [0], build: basilisk, voxel: [8] }, D),
    chimera: Object.assign({ name: "Chimera", variants: [0], build: chimera, voxel: [9] }, D),
    manticore: Object.assign({ name: "Manticore", variants: [0], build: manticore, voxel: [9] }, D),
    golem: Object.assign({ name: "Stone Golem", variants: [0], build: golem, voxel: [11] }, D),
    mummy: Object.assign({ name: "Mummy", variants: [0], build: mummy, voxel: [7] }, D),
    werewolf: Object.assign({ name: "Werewolf", variants: [0], build: werewolf, voxel: [8] }, D),
    wraith: Object.assign({ name: "Wraith", variants: [0], build: wraith, voxel: [8] }, D),
    centaur: Object.assign({ name: "Centaur", variants: [0], build: centaur, voxel: [9] }, D),
    kobold: Object.assign({ name: "Kobold", variants: [0], build: kobold, voxel: [6] }, D),
    lich: Object.assign({ name: "Lich", variants: [0], build: lich, voxel: [8] }, D),
    salamander: Object.assign({ name: "Salamander", variants: [0], build: salamander, voxel: [8] }, D),
    crown: Object.assign({ name: "Guardian's Crown", variants: [0], build: crown, voxel: [5] }, D),
    goldtickle: Object.assign({ name: "The Golden Tickle", variants: [0], build: goldtickle, voxel: [9] }, D),
  });
})(typeof self !== "undefined" ? self : this);
