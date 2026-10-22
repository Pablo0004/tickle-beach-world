/* The dungeon kit: the monsters that live down in the labyrinths and the mines (minotaur, ogre,
 * goblins, skeletons, giant spiders, trolls) and what the deep places are dressed with (bones, cobwebs,
 * spike traps, cages, tombs, gargoyles, braziers, iron gates, stalagmites, boulders, glowing
 * mushrooms, crates and ore piles). Same stroke format and palette as the rest of the kit.
 * SDF units, z up, ground at z = 0, front +y; a Tickle is about 480 tall. Every layer holds at
 * least two strokes (the on-chain shader skips a layer with a single one). */
(function (G) {
  "use strict";
  const TB = G.TB, { C, S, dir } = TB.kitHelpers;
  const bone = () => C("#e8e2d0"), black = () => C("#111111"), steel = () => C("#c8c8c8"), iron = () => C("#6a6a6a"), wood = () => C("#a0703a"), dark = () => C("#6b4a2b");
  const red = () => C("#e8443a"), gold = () => C("#ffd23f");

  // ---------- the monsters ----------
  // the Minotaur: a bull's head on a giant's body, a double axe in its fist
  function minotaur() {
    const st = [], fur = C("#6b4a2b"), tan = C("#a0703a"), hoof = C("#222222"), ivory = C("#f3e2c0");
    st.push(S("joint", [75, 0, 150], [44, 44, 105], { color: fur, mirror: true, offsX: 75 }));
    st.push(S("cylinder", [75, 12, 24], [46, 52, 24], { color: hoof, mirror: true, offsX: 75 }));
    st.push(S("sphere", [0, 0, 440], [170, 125, 190], { color: fur, blend: 30 }));
    st.push(S("sphere", [0, 62, 480], [125, 70, 115], { color: tan, blend: 30 }));
    st.push(S("joint", [205, 10, 470], [42, 42, 130], { color: fur, mirror: true, offsX: 205, rot: dir(0.45, 0.25, -1), blend: 20 }));
    st.push(S("sphere", [250, 55, 335], [50, 50, 50], { color: fur, mirror: true, offsX: 250 }));
    st.push(S("sphere", [0, 45, 690], [95, 110, 95], { color: fur, blend: 30 }));
    st.push(S("sphere", [0, 145, 655], [72, 58, 52], { color: tan, blend: 20 }));
    // layer 1: horns, eyes, the nose ring, the loincloth
    st.push(S("cylinder", [140, 35, 780], [26, 26, 95], { color: ivory, cone: 1, rot: dir(1, 0.25, 0.9), mirror: true, offsX: 140, layer: 1 }));
    st.push(S("sphere", [92, 35, 742], [36, 30, 30], { color: ivory, mirror: true, offsX: 92, layer: 1 }));
    st.push(S("sphere", [46, 128, 718], [15, 8, 12], { color: red(), mirror: true, offsX: 46, layer: 1 }));
    st.push(S("cylinder", [0, 198, 628], [26, 26, 6], { color: gold(), hole: 0.65, rot: [1.5708, 0, 0], layer: 1 }));
    st.push(S("sphere", [22, 198, 660], [8, 4, 8], { color: black(), mirror: true, offsX: 22, layer: 1 }));
    st.push(S("cube", [0, 10, 270], [135, 115, 62], { color: C("#b0302b"), round: 0.3, layer: 1 }));
    st.push(S("cylinder", [0, 0, 335], [152, 118, 16], { color: C("#3a2a1a"), layer: 1 }));
    // layer 2: the double axe
    st.push(S("joint", [255, 70, 430], [12, 12, 270], { color: dark(), rot: dir(0, 0.15, 1), layer: 2 }));
    st.push(S("cylinder", [255, 108, 690], [105, 105, 10], { color: steel(), rot: [0, 1.5708, 0], layer: 2 }));
    st.push(S("cylinder", [255, 108, 690], [30, 30, 14], { color: iron(), rot: [0, 1.5708, 0], layer: 2 }));
    return st;
  }
  // the Ogre: a huge belly, a little head with tusks, a spiked club
  function ogre() {
    const st = [], skin = C("#7fa05a"), skin2 = C("#5e7d43"), cloth = C("#6b4a2b"), ivory = C("#f3e2c0");
    st.push(S("joint", [95, 0, 130], [62, 62, 105], { color: skin, mirror: true, offsX: 95 }));
    st.push(S("sphere", [95, 40, 32], [62, 82, 32], { color: skin2, mirror: true, offsX: 95 }));
    st.push(S("sphere", [0, 25, 420], [215, 195, 225], { color: skin, blend: 40 }));
    st.push(S("sphere", [0, 0, 570], [195, 140, 140], { color: skin, blend: 40 }));
    st.push(S("joint", [235, 0, 520], [56, 56, 170], { color: skin, mirror: true, offsX: 235, rot: dir(0.35, 0.1, -1), blend: 25 }));
    st.push(S("sphere", [295, 30, 330], [62, 62, 62], { color: skin2, mirror: true, offsX: 295 }));
    st.push(S("sphere", [0, 45, 735], [92, 92, 92], { color: skin, blend: 30 }));
    st.push(S("sphere", [98, 25, 748], [30, 16, 42], { color: skin2, mirror: true, offsX: 98 }));
    // layer 1: tusks, eyes, a heavy brow, the loincloth
    st.push(S("cylinder", [40, 118, 712], [13, 13, 32], { color: ivory, cone: 1, mirror: true, offsX: 40, layer: 1 }));
    st.push(S("sphere", [33, 120, 765], [13, 7, 11], { color: gold(), mirror: true, offsX: 33, layer: 1 }));
    st.push(S("cube", [0, 118, 790], [70, 18, 14], { color: skin2, round: 0.5, layer: 1 }));
    st.push(S("cube", [0, 15, 270], [195, 175, 72], { color: cloth, round: 0.3, layer: 1 }));
    st.push(S("cylinder", [0, 15, 340], [205, 185, 16], { color: C("#3a2a1a"), layer: 1 }));
    // layer 2: the club, thick end up, with iron studs
    st.push(S("joint", [305, 80, 470], [36, 36, 210], { color: wood(), cone: 0.6, rot: dir(0, -0.25, -1), layer: 2 }));
    st.push(S("sphere", [305, 130, 660], [16, 16, 16], { color: iron(), layer: 2 }));
    st.push(S("sphere", [340, 110, 630], [14, 14, 14], { color: iron(), layer: 2 }));
    st.push(S("sphere", [270, 120, 610], [14, 14, 14], { color: iron(), layer: 2 }));
    return st;
  }
  // a Goblin: small, green, all ears and teeth. v0 with a dagger, v1 a mine goblin with a pick and a sack of stolen ore
  function goblin(v) {
    const st = [], skin = C("#5a9a3a"), tunic = v ? C("#5a5a5a") : C("#6b4a2b");
    st.push(S("joint", [42, 0, 62], [20, 20, 50], { color: skin, mirror: true, offsX: 42 }));
    st.push(S("sphere", [42, 28, 14], [24, 36, 14], { color: dark(), mirror: true, offsX: 42 }));
    st.push(S("sphere", [0, 0, 175], [78, 62, 88], { color: tunic }));
    st.push(S("sphere", [0, 22, 295], [72, 66, 62], { color: skin, blend: 14 }));
    st.push(S("sphere", [0, 90, 285], [18, 32, 16], { color: skin, blend: 8 }));
    st.push(S("joint", [88, 12, 172], [16, 16, 62], { color: skin, mirror: true, offsX: 88, rot: dir(0.6, 0.35, -1) }));
    st.push(S("sphere", [118, 44, 122], [21, 21, 21], { color: skin, mirror: true, offsX: 118 }));
    // layer 1: the ears, the red eyes, the grin (and the miner's helmet and lamp)
    st.push(S("cylinder", [100, 12, 312], [20, 10, 72], { color: skin, cone: 1, rot: dir(1, 0, 0.35), mirror: true, offsX: 100, layer: 1 }));
    st.push(S("sphere", [27, 76, 312], [13, 6, 11], { color: red(), mirror: true, offsX: 27, layer: 1 }));
    st.push(S("cube", [0, 80, 262], [26, 4, 5], { color: C("#ffffff"), layer: 1 }));
    if (v) {
      st.push(S("sphere", [0, 12, 338], [74, 68, 38], { color: gold(), layer: 1 }));
      st.push(S("sphere", [0, 70, 350], [15, 8, 15], { color: C("#fff4d6"), layer: 1 }));
    }
    // layer 2: what it carries
    if (v) {
      st.push(S("joint", [125, 52, 190], [7, 7, 95], { color: wood(), rot: dir(0, 0.25, 1), layer: 2 }));
      st.push(S("cylinder", [125, 75, 285], [70, 10, 10], { color: iron(), cone: 0.3, layer: 2 }));
      st.push(S("sphere", [0, -78, 200], [58, 42, 64], { color: C("#c79a62"), layer: 2 }));
      st.push(S("sphere", [0, -88, 262], [22, 18, 18], { color: C("#8fd3f4"), layer: 2 }));
    } else {
      st.push(S("joint", [125, 92, 128], [6, 6, 52], { color: steel(), rot: dir(0, 1, 0.3), layer: 2 }));
      st.push(S("cube", [125, 48, 116], [18, 6, 6], { color: dark(), layer: 2 }));
    }
    return st;
  }
  // a Skeleton with a rusty sword and a cracked shield
  function skeleton() {
    const st = [];
    st.push(S("sphere", [0, 12, 455], [52, 58, 56], { color: bone() }));
    st.push(S("cube", [0, 34, 408], [36, 30, 14], { color: bone(), round: 0.4 }));
    st.push(S("joint", [0, 0, 300], [10, 10, 92], { color: bone() }));
    st.push(S("cylinder", [0, 0, 330], [62, 46, 58], { color: bone(), hole: 0.22 }));
    st.push(S("sphere", [0, 0, 215], [48, 30, 22], { color: bone() }));
    st.push(S("joint", [32, 0, 112], [10, 10, 102], { color: bone(), mirror: true, offsX: 32 }));
    st.push(S("cube", [32, 26, 10], [14, 26, 8], { color: bone(), mirror: true, offsX: 32 }));
    st.push(S("joint", [82, 6, 320], [9, 9, 92], { color: bone(), mirror: true, offsX: 82, rot: dir(0.3, 0.2, -1) }));
    // layer 1: dark eye sockets with a cold glow, the nose hole
    st.push(S("sphere", [21, 60, 462], [13, 6, 13], { color: black(), mirror: true, offsX: 21, layer: 1 }));
    st.push(S("sphere", [0, 66, 440], [6, 4, 8], { color: black(), layer: 1 }));
    st.push(S("sphere", [21, 64, 462], [5, 3, 5], { color: C("#8fd3f4"), mirror: true, offsX: 21, layer: 1 }));
    // layer 2: sword and shield
    st.push(S("joint", [112, 82, 260], [8, 8, 112], { color: C("#9a9a9a"), rot: dir(0, 0.4, 1), layer: 2 }));
    st.push(S("cube", [112, 40, 168], [26, 6, 6], { color: dark(), layer: 2 }));
    st.push(S("cylinder", [-112, 40, 300], [62, 62, 10], { color: dark(), rot: [1.5708, 0, 0], layer: 2 }));
    st.push(S("sphere", [-112, 52, 300], [16, 8, 16], { color: iron(), layer: 2 }));
    return st;
  }
  // a giant Spider: black, eight legs, a cluster of red eyes and a purple mark
  function spider() {
    const st = [], body = C("#222222"), leg = C("#333333");
    st.push(S("sphere", [0, -125, 175], [145, 165, 122], { color: body }));
    st.push(S("sphere", [0, 62, 150], [82, 82, 62], { color: body, blend: 22 }));
    for (let k = 0; k < 4; k++) {
      const fy = 90 - k * 62;
      st.push(S("joint", [125, fy, 205], [14, 14, 95], { color: leg, rot: dir(1, (1.5 - k) * 0.45, 0.85), mirror: true, offsX: 125 }));
      st.push(S("joint", [245, fy + (1.5 - k) * 45, 92], [12, 12, 102], { color: leg, rot: dir(0.45, (1.5 - k) * 0.35, -1), mirror: true, offsX: 245 }));
    }
    // layer 1: eyes, fangs, the mark on its back
    st.push(S("sphere", [24, 136, 178], [13, 8, 13], { color: red(), mirror: true, offsX: 24, layer: 1 }));
    st.push(S("sphere", [11, 142, 152], [8, 6, 8], { color: red(), mirror: true, offsX: 11, layer: 1 }));
    st.push(S("joint", [18, 140, 108], [6, 6, 22], { color: C("#ffffff"), cone: 1, rot: [3.1416, 0, 0], mirror: true, offsX: 18, layer: 1 }));
    st.push(S("sphere", [0, -145, 288], [62, 72, 18], { color: C("#8a4fd8"), layer: 1 }));
    return st;
  }
  // a Troll: hunched, long-armed, with a big nose and moss on its back. v1: a rock troll of the deep mines, crystals growing out of it
  function troll(v) {
    const st = [], skin = v ? C("#7a7a7a") : C("#5a7a8a"), skin2 = v ? C("#5a5a5a") : C("#46606e");
    st.push(S("joint", [82, 0, 122], [56, 56, 102], { color: skin, mirror: true, offsX: 82 }));
    st.push(S("sphere", [82, 40, 30], [60, 80, 30], { color: skin2, mirror: true, offsX: 82 }));
    st.push(S("sphere", [0, -20, 425], [200, 172, 222], { color: skin, blend: 40 }));
    st.push(S("sphere", [0, -82, 565], [152, 122, 112], { color: skin, blend: 50 }));
    st.push(S("joint", [212, 42, 420], [50, 50, 225], { color: skin, mirror: true, offsX: 212, rot: dir(0.25, 0.35, -1), blend: 25 }));
    st.push(S("sphere", [252, 125, 198], [66, 66, 56], { color: skin2, mirror: true, offsX: 252 }));
    st.push(S("sphere", [0, 160, 610], [95, 95, 85], { color: skin, blend: 30 }));
    st.push(S("sphere", [0, 258, 592], [44, 56, 64], { color: skin2, blend: 14 }));
    // layer 1: moss (or crystals), eyes, teeth, the fur loincloth
    if (v) {
      st.push(S("cylinder", [70, -110, 660], [34, 34, 90], { color: C("#c9a6ff"), cone: 1, rot: dir(0.4, -0.3, 1), mirror: true, offsX: 70, layer: 1 }));
      st.push(S("cylinder", [0, -150, 640], [38, 38, 100], { color: C("#8fd3f4"), cone: 1, rot: dir(0, -0.6, 1), layer: 1 }));
    } else {
      st.push(S("sphere", [62, -62, 645], [62, 52, 42], { color: C("#3cbf6c"), layer: 1 }));
      st.push(S("sphere", [-82, -42, 605], [52, 46, 36], { color: C("#2e8b3a"), layer: 1 }));
    }
    st.push(S("sphere", [42, 240, 640], [13, 7, 13], { color: gold(), mirror: true, offsX: 42, layer: 1 }));
    st.push(S("cylinder", [34, 240, 548], [11, 11, 24], { color: C("#f3e2c0"), cone: 1, mirror: true, offsX: 34, layer: 1 }));
    st.push(S("cube", [0, 0, 265], [180, 160, 62], { color: v ? C("#3a3a3a") : C("#8a6a4a"), round: 0.4, layer: 1 }));
    return st;
  }

  // ---------- what the deep places are dressed with ----------
  function bones() {
    const st = [];
    st.push(S("joint", [-40, 10, 14], [10, 10, 60], { color: bone(), rot: dir(1, 0.3, 0) }));
    st.push(S("joint", [30, -30, 14], [9, 9, 52], { color: bone(), rot: dir(0.4, 1, 0) }));
    st.push(S("joint", [10, 40, 24], [9, 9, 46], { color: bone(), rot: dir(1, -0.6, 0.2) }));
    st.push(S("sphere", [-95, 28, 14], [16, 16, 14], { color: bone(), mirror: true, offsX: -10 }));
    // layer 1: a skull
    st.push(S("sphere", [60, 50, 42], [40, 44, 40], { color: bone(), layer: 1 }));
    st.push(S("sphere", [46, 86, 48], [10, 5, 10], { color: black(), mirror: true, offsX: 14, layer: 1 }));
    return st;
  }
  function cobweb() {
    const st = [], silk = C("#f4f4f4");
    for (let k = 0; k < 5; k++) { const a = (k / 4) * 1.5708; st.push(S("joint", [Math.cos(a) * 110, 0, 300 - Math.sin(a) * 110 + 0], [4, 4, 110], { color: silk, rot: dir(Math.cos(a), 0, -Math.sin(a)) })); }
    // layer 1: the rings of the web
    for (const r of [70, 130, 190]) st.push(S("cylinder", [0, 0, 300], [r, r, 4], { color: silk, hole: 0.06, rot: [1.5708, 0, 0], layer: 1 }));
    st.push(S("cube", [110, 0, 190], [110, 6, 110], { m: "sub", color: silk, layer: 1 }));
    return st;
  }
  function spikes() {
    const st = [];
    st.push(S("cube", [0, 0, 8], [150, 150, 8], { color: iron(), round: 0.2 }));
    st.push(S("cube", [0, 0, 18], [130, 130, 4], { color: C("#3a3a3a") }));
    // layer 1: the spikes
    for (const x of [-90, -30, 30, 90]) for (const y of [-90, -30, 30, 90]) st.push(S("cylinder", [x, y, 60], [14, 14, 42], { color: steel(), cone: 1, layer: 1 }));
    return st;
  }
  function cage() {
    const st = [], bar = iron();
    st.push(S("cylinder", [0, 0, 20], [120, 120, 14], { color: bar }));
    st.push(S("cylinder", [0, 0, 420], [120, 120, 14], { color: bar }));
    st.push(S("cylinder", [0, 0, 455], [50, 50, 30], { color: bar, cone: 0.6 }));
    // layer 1: the bars, and something that was left in there
    for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; st.push(S("joint", [Math.cos(a) * 112, Math.sin(a) * 112, 220], [7, 7, 200], { color: bar, layer: 1 })); }
    st.push(S("sphere", [0, 0, 70], [38, 42, 38], { color: bone(), layer: 1 }));
    return st;
  }
  function tomb() {
    const st = [], stone = C("#9a9a9a"), stone2 = C("#c8c8c8");
    st.push(S("cube", [0, 0, 80], [120, 230, 80], { color: stone, round: 0.15 }));
    st.push(S("cube", [0, 0, 172], [135, 245, 14], { color: stone2, round: 0.2 }));
    // layer 1: a carved figure on the lid and a crack
    st.push(S("sphere", [0, 150, 196], [48, 44, 22], { color: stone, layer: 1 }));
    st.push(S("cube", [0, -20, 192], [56, 140, 14], { color: stone, round: 0.6, layer: 1 }));
    st.push(S("cube", [70, -90, 180], [6, 80, 20], { m: "sub", color: stone2, rot: [0, 0, 0.6], layer: 1 }));
    return st;
  }
  function gargoyle() {
    const st = [], stone = C("#7a7a7a"), stone2 = C("#9a9a9a");
    st.push(S("cube", [0, 0, 80], [110, 110, 80], { color: stone2, round: 0.1 }));
    st.push(S("sphere", [0, 0, 260], [80, 75, 95], { color: stone }));
    st.push(S("sphere", [0, 40, 380], [55, 60, 52], { color: stone, blend: 14 }));
    st.push(S("joint", [55, 50, 210], [20, 20, 60], { color: stone, mirror: true, offsX: 55 }));
    // layer 1: wings, horns, eyes
    st.push(S("sphere", [110, -40, 320], [80, 20, 110], { color: stone, mirror: true, offsX: 110, rot: [0, 0.4, 0.3], layer: 1 }));
    st.push(S("cylinder", [30, 30, 440], [12, 12, 36], { color: stone2, cone: 1, mirror: true, offsX: 30, rot: dir(0.4, -0.2, 1), layer: 1 }));
    st.push(S("sphere", [20, 96, 392], [9, 5, 8], { color: red(), mirror: true, offsX: 20, layer: 1 }));
    return st;
  }
  function brazier() {
    const st = [];
    st.push(S("joint", [0, 0, 120], [14, 14, 110], { color: iron() }));
    st.push(S("cylinder", [0, 0, 18], [55, 55, 12], { color: iron() }));
    st.push(S("cylinder", [0, 0, 250], [80, 80, 34], { color: C("#3a3a3a"), cone: -0.4 }));
    // layer 1: the fire
    st.push(S("sphere", [0, 0, 300], [62, 62, 50], { color: C("#ffb020"), layer: 1 }));
    st.push(S("sphere", [0, 0, 350], [34, 34, 46], { color: C("#ffd23f"), layer: 1 }));
    return st;
  }
  function gate() {
    const st = [], bar = iron();
    st.push(S("cube", [-200, 0, 260], [30, 30, 260], { color: C("#7a7a7a") }));
    st.push(S("cube", [200, 0, 260], [30, 30, 260], { color: C("#7a7a7a") }));
    st.push(S("cube", [0, 0, 540], [235, 34, 26], { color: C("#7a7a7a") }));
    // layer 1: the portcullis
    for (let k = 0; k < 7; k++) st.push(S("joint", [-150 + k * 50, 0, 270], [8, 8, 240], { color: bar, layer: 1 }));
    for (const z of [120, 300, 460]) st.push(S("cube", [0, 0, z], [172, 8, 8], { color: bar, layer: 1 }));
    return st;
  }
  function stalagmite() {
    const st = [], rock = C("#7a7a7a"), rock2 = C("#5a5a5a");
    st.push(S("cylinder", [0, 0, 170], [70, 70, 170], { color: rock, cone: 1 }));
    st.push(S("cylinder", [80, 40, 100], [46, 46, 100], { color: rock2, cone: 1 }));
    st.push(S("cylinder", [-70, -30, 80], [40, 40, 80], { color: rock, cone: 1 }));
    st.push(S("sphere", [0, 0, 20], [130, 110, 30], { color: rock2, blend: 30 }));
    return st;
  }
  function boulders() {
    const st = [], rock = C("#8a8a8a"), rock2 = C("#6a6a6a");
    st.push(S("sphere", [0, 0, 90], [120, 105, 95], { color: rock }));
    st.push(S("sphere", [120, 50, 55], [70, 65, 58], { color: rock2 }));
    st.push(S("sphere", [-110, 60, 40], [55, 50, 42], { color: rock2 }));
    st.push(S("sphere", [40, -110, 35], [48, 44, 36], { color: rock }));
    return st;
  }
  // a stretch of rock wall for the mines and the Underworld: big rounded stones like the on-chain boulders,
  // side by side along x (one cell long, about seven blocks), some with a smaller one on top, pebbles at the foot
  function rockwall(v) {
    const st = [], rock = C("#8a8a8a"), rock2 = C("#6e6e6e");
    const r = (k) => { const x = Math.sin((v || 0) * 91.7 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
    let x = -560, k = 0;
    while (x < 560) {
      const w = 150 + r(k) * 130, h = 300 + r(k + 1) * 260, t = 110 + r(k + 2) * 40;
      st.push(S("cube", [x + w * 0.5, (r(k + 3) - 0.5) * 30, h / 2], [w * 0.62, t, h / 2], { color: k % 3 === 1 ? rock2 : rock, round: 0.55 + r(k + 4) * 0.3 }));
      if (h < 420 && r(k + 5) < 0.7) st.push(S("cube", [x + w * 0.5 + (r(k + 6) - 0.5) * 60, (r(k + 7) - 0.5) * 30, h + 90 + r(k + 8) * 60], [w * 0.5, t * 0.85, 100 + r(k + 9) * 50], { color: k % 2 ? rock : rock2, round: 0.7 }));
      x += w * 0.92; k += 10;
    }
    for (let j = 0; j < 6; j++) st.push(S("sphere", [-480 + j * 190 + r(j + 200) * 60, (j % 2 ? 1 : -1) * (150 + r(j + 210) * 20), 30], [40 + r(j + 220) * 25, 34, 30], { color: rock2, layer: 1 }));
    return st;
  }
  function mushrooms() {
    const st = [], stem = C("#f3e2c0"), glow = C("#8fd3f4"), glow2 = C("#c9a6ff");
    st.push(S("joint", [0, 0, 60], [14, 14, 55], { color: stem }));
    st.push(S("joint", [60, 30, 40], [10, 10, 38], { color: stem }));
    st.push(S("joint", [-50, 40, 34], [9, 9, 30], { color: stem }));
    // layer 1: the glowing caps
    st.push(S("sphere", [0, 0, 120], [60, 60, 28], { color: glow, layer: 1 }));
    st.push(S("sphere", [60, 30, 82], [40, 40, 20], { color: glow2, layer: 1 }));
    st.push(S("sphere", [-50, 40, 68], [32, 32, 16], { color: glow, layer: 1 }));
    return st;
  }
  function crate() {
    const st = [];
    st.push(S("cube", [0, 0, 100], [100, 100, 100], { color: wood(), round: 0.05 }));
    st.push(S("cube", [0, 0, 100], [92, 104, 92], { m: "sub", color: wood() }));
    st.push(S("cube", [0, 0, 100], [104, 92, 92], { m: "sub", color: wood() }));
    st.push(S("cube", [0, 0, 100], [88, 88, 88], { color: C("#c79a62") }));
    // layer 1: the cross-planks
    st.push(S("cube", [0, 102, 100], [12, 4, 120], { color: dark(), rot: [0, 0.78, 0], layer: 1 }));
    st.push(S("cube", [102, 0, 100], [4, 12, 120], { color: dark(), rot: [0.78, 0, 0], layer: 1 }));
    return st;
  }
  // a heap of ore, in the colour of what was dug: stone, iron, gold, orichalcum, copper, silver, coal, gems
  const ORE_COL = ["#9a9a9a", "#b06a4a", "#ffd23f", "#4fe0c0", "#d9803a", "#e8e8f0", "#222222", "#c9a6ff"];
  function orepile(v) {
    const st = [], c = C(ORE_COL[v || 0]), rock = C("#6a6a6a");
    st.push(S("sphere", [0, 0, 40], [120, 100, 50], { color: rock }));
    st.push(S("sphere", [50, 20, 70], [48, 44, 40], { color: c }));
    st.push(S("sphere", [-40, -10, 80], [44, 40, 38], { color: c }));
    st.push(S("sphere", [0, 40, 110], [38, 34, 32], { color: c }));
    st.push(S("sphere", [-10, -50, 60], [34, 30, 28], { color: c }));
    return st;
  }
  function puddle() {
    const st = [];
    st.push(S("cylinder", [0, 0, 3], [150, 110, 3], { color: C("#2f8fe0") }));
    st.push(S("cylinder", [60, 40, 4], [60, 45, 3], { color: C("#8fd3f4") }));
    return st;
  }

  // a teleport gem, the Underworld's save point beside every guardian: a great crystal floating over a carved plinth
  function warpgem(v) {
    const st = [], stone = C("#8a8a8a"), stone2 = C("#b8b8b8"), gem = C(["#3cc6d8", "#8fd3f4"][v || 0]), glow = C(["#e8f8ff", "#ffffff"][v || 0]), gold = C("#ffd23f");
    st.push(S("cylinder", [0, 0, 40], [210, 210, 40], { color: stone, round: 0.2 }));
    st.push(S("cylinder", [0, 0, 110], [150, 150, 40], { color: stone2, round: 0.2 }));
    // layer 1: the gem, a cube stood on one corner (a diamond), floating over the plinth, with a ring of gold round it
    st.push(S("cube", [0, 0, 360], [120, 120, 120], { color: gem, rot: [0.7854, 0.6155, 0], layer: 1 }));
    st.push(S("cylinder", [0, 0, 360], [150, 150, 8], { color: gold, hole: 0.85, layer: 1 }));
    // layer 2: its light, and small bright shards on the plinth
    st.push(S("sphere", [0, 0, 360], [70, 70, 90], { color: glow, layer: 2 }));
    st.push(S("cube", [130, 40, 175], [26, 26, 26], { color: gem, rot: [0.7854, 0.6155, 0], mirror: true, offsX: 130, layer: 2 }));
    st.push(S("cube", [0, -140, 175], [22, 22, 22], { color: gem, rot: [0.7854, 0.6155, 0], layer: 2 }));
    return st;
  }
  const D = { group: "Dungeons" };
  Object.assign(TB.KIT, {
    minotaur: Object.assign({ name: "Minotaur", variants: [0], build: minotaur, voxel: [12] }, D),
    ogre: Object.assign({ name: "Ogre", variants: [0], build: ogre, voxel: [12] }, D),
    goblin: Object.assign({ name: "Goblin", variants: [0, 1], build: goblin, voxel: [7], variantLabel: (v) => (v ? "mine goblin" : "dungeon goblin") }, D),
    skeleton: Object.assign({ name: "Skeleton", variants: [0], build: skeleton, voxel: [7] }, D),
    spider: Object.assign({ name: "Giant Spider", variants: [0], build: spider, voxel: [8] }, D),
    troll: Object.assign({ name: "Troll", variants: [0, 1], build: troll, voxel: [12], variantLabel: (v) => (v ? "rock troll" : "cave troll") }, D),
    bones: Object.assign({ name: "Bones", variants: [0], build: bones, voxel: [6] }, D),
    cobweb: Object.assign({ name: "Cobweb", variants: [0], build: cobweb, voxel: [5] }, D),
    spikes: Object.assign({ name: "Spike Trap", variants: [0], build: spikes, voxel: [6] }, D),
    cage: Object.assign({ name: "Hanging Cage", variants: [0], build: cage, voxel: [7] }, D),
    tomb: Object.assign({ name: "Stone Tomb", variants: [0], build: tomb, voxel: [8] }, D),
    gargoyle: Object.assign({ name: "Gargoyle", variants: [0], build: gargoyle, voxel: [8] }, D),
    brazier: Object.assign({ name: "Brazier", variants: [0], build: brazier, voxel: [7] }, D),
    gate: Object.assign({ name: "Iron Gate", variants: [0], build: gate, voxel: [8] }, D),
    stalagmite: Object.assign({ name: "Stalagmites", variants: [0], build: stalagmite, voxel: [8] }, D),
    boulders: Object.assign({ name: "Boulders", variants: [0], build: boulders, voxel: [8] }, D),
    warpgem: Object.assign({ name: "Teleport Gem", variants: [0, 1], build: warpgem, voxel: [8], variantLabel: (v) => ["violet", "blue"][v] }, D),
    rockwall: Object.assign({ name: "Rock Wall", variants: [0, 1, 2], build: rockwall, voxel: [36] }, D),
    mushrooms: Object.assign({ name: "Glowing Mushrooms", variants: [0], build: mushrooms, voxel: [6] }, D),
    crate: Object.assign({ name: "Crate", variants: [0], build: crate, voxel: [8] }, D),
    orepile: Object.assign({ name: "Ore Heap", variants: [0, 1, 2, 3, 4, 5, 6, 7], build: orepile, voxel: [7], variantLabel: (v) => ["stone", "iron", "gold", "orichalcum", "copper", "silver", "coal", "gems"][v] }, D),
    puddle: Object.assign({ name: "Puddle", variants: [0], build: puddle, voxel: [6] }, D),
  });
})(typeof self !== "undefined" ? self : this);
