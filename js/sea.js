/* Life on the sea floor. Near the view the open sea round the land fills with what lives on its bottom and in its
 * water, laid out by depth and by the region's climate, all of it in cubes like everything else: kelp forests in the
 * cool seas (tall strands swaying with the swell), seagrass meadows in the shallows, coral gardens in the warm seas
 * of Beach Sand and the Palm, anemones, sponges, sea stars, urchins, rocks crusted with barnacles and shells on the
 * sand; and swimming through it, schools of fish of five kinds, sea turtles, manta rays gliding, jellyfish drifting
 * up and down and crabs scuttling sideways over the sand. None of it is a Tickle species. (The lake has its own
 * life, lakelife.js; the dive sites their wrecks and reefs, diving.js.) */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the models, in the kit's stroke format (every layer needs two strokes or more) ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    // kelp: a stem rising in a gentle curve, long blades off it all the way up, a float at each blade's foot
    function kelp(v) {
      const st = [], stem = C("#6a5a1a"), blade = [C("#7a8a2a"), C("#5a7a2a"), C("#8a7a2a")][v], bulb = C("#a08a3a");
      const H = [520, 640, 440][v], n = Math.round(H / 80);
      for (let k = 0; k < n; k++) {
        const z0 = k * 80, x0 = Math.sin(k * 0.6 + v) * 18, x1 = Math.sin((k + 1) * 0.6 + v) * 18;
        st.push(S("joint", [(x0 + x1) / 2, 0, z0 + 40], [7, 7, 44], { color: stem, rot: dir((x1 - x0) / 80, 0, 1) }));
        const side = k % 2 ? 1 : -1;
        st.push(S("cube", [x0 + side * 34, 0, z0 + 50], [32, 4, 12], { color: blade, rot: [0, side * 0.5, 0], layer: 1 }));
        st.push(S("sphere", [x0 + side * 8, 0, z0 + 40], [8, 8, 8], { color: bulb, layer: 1 }));
      }
      st.push(S("cube", [0, 0, H + 20], [10, 30, 40], { color: blade, layer: 1 }));
      return st;
    }
    // seagrass: a clump of thin blades, some bent
    function seagrass(v) {
      const st = [], g1 = C(v ? "#3a9a4a" : "#4aa83a"), g2 = C(v ? "#2a7a3a" : "#6ab84a");
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4, r = 10 + (k % 3) * 14, h = 70 + ((k * 37) % 60);
        st.push(S("joint", [Math.cos(a) * r, Math.sin(a) * r, h / 2], [4, 4, h / 2], { color: k % 2 ? g1 : g2, rot: dir(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 1), layer: k % 2 }));
      }
      return st;
    }
    // an anemone: a short column and a crown of fat tentacles
    function anemone(v) {
      const st = [], col = C(["#ff7aa8", "#7ae0a0", "#ffb04a"][v]), tip = C(["#ffe0ec", "#e0ffe8", "#fff0c8"][v]), foot = C(["#c04a78", "#3a9a6a", "#c07a2a"][v]);
      st.push(S("cylinder", [0, 0, 22], [30, 30, 22], { color: foot }));
      st.push(S("cylinder", [0, 0, 48], [36, 36, 6], { color: col }));
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * 6.283, r = 24;
        st.push(S("joint", [Math.cos(a) * r, Math.sin(a) * r, 74], [6, 6, 26], { color: col, rot: dir(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1), layer: 1 }));
        st.push(S("sphere", [Math.cos(a) * (r + 14), Math.sin(a) * (r + 14), 96], [7, 7, 7], { color: tip, layer: 2 }));
      }
      st.push(S("sphere", [0, 0, 52], [12, 12, 6], { color: tip, layer: 2 }));
      return st;
    }
    // a sponge: a few hollow tubes
    function sponge(v) {
      const st = [], c = C(v ? "#e88a2a" : "#e8c83a"), d = C(v ? "#b05a1a" : "#b8962a");
      st.push(S("sphere", [0, 0, 14], [50, 44, 16], { color: d }));
      for (const [x, y, h] of [[0, 0, 110], [34, 14, 80], [-30, 18, 64], [8, -30, 54]]) st.push(S("cylinder", [x, y, h / 2 + 10], [18, 18, h / 2], { color: c, hole: 0.55, layer: 1 }));
      return st;
    }
    // a sea star on the sand, and a sea urchin
    function seastar(v) {
      const st = [], c = C(["#ff6a2a", "#e83a5a", "#8a5ad8"][v]), dot = C("#fff0d0");
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283; st.push(S("joint", [Math.cos(a) * 30, Math.sin(a) * 30, 8], [10, 10, 30], { color: c, rot: dir(Math.cos(a), Math.sin(a), 0.05) })); }
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283; st.push(S("sphere", [Math.cos(a) * 30, Math.sin(a) * 30, 16], [4, 4, 4], { color: dot, layer: 1 })); }
      st.push(S("sphere", [0, 0, 10], [14, 14, 8], { color: c, layer: 1 }));
      return st;
    }
    function urchin() {
      const st = [], c = C("#3a1a4a"), sp = C("#5a2a6a");
      st.push(S("sphere", [0, 0, 26], [28, 28, 24], { color: c }));
      st.push(S("sphere", [0, 0, 28], [20, 20, 18], { color: sp }));
      for (let k = 0; k < 14; k++) { const a = k * 2.4, e = 0.2 + (k % 4) * 0.25; st.push(S("joint", [Math.cos(a) * 30 * Math.cos(e), Math.sin(a) * 30 * Math.cos(e), 26 + Math.sin(e) * 30], [3, 3, 18], { color: sp, rot: dir(Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)), layer: 1 })); }
      return st;
    }
    // a rock crusted with barnacles and a little weed
    function searock(v) {
      const st = [], r = C(v ? "#6a6e6a" : "#7a7268"), r2 = C(v ? "#5a5e5a" : "#6a6258"), bar = C("#e8e4d4"), weed = C("#4a8a3a");
      st.push(S("sphere", [0, 0, 60], [110 + v * 30, 90, 70], { color: r }));
      st.push(S("sphere", [60, 40, 40], [60, 50, 44], { color: r2 }));
      for (const [x, y, z] of [[-40, 60, 100], [30, -50, 110], [70, 20, 90], [-70, -30, 70], [0, 70, 80], [50, 60, 60]]) st.push(S("cylinder", [x, y, z], [10, 10, 8], { color: bar, hole: 0.4, layer: 1 }));
      for (const [x, y] of [[-60, 10], [20, 60]]) st.push(S("joint", [x, y, 140], [5, 5, 30], { color: weed, layer: 1 }));
      return st;
    }
    // shells on the sand: a conch and a scallop
    function shell(v) {
      const st = [];
      if (!v) {
        const c = C("#f4d8b0"), p = C("#f4a8a0");
        st.push(S("cylinder", [0, 0, 16], [26, 26, 40], { color: c, cone: 1, rot: dir(0, 1, 0.1) }));
        st.push(S("sphere", [0, -22, 16], [16, 10, 14], { color: p }));
      } else {
        const c = C("#ffb8a0"), d = C("#e88a70");
        st.push(S("sphere", [0, 0, 8], [30, 26, 8], { color: c }));
        for (let k = -2; k <= 2; k++) st.push(S("cube", [k * 10, 0, 14], [2, 24, 3], { color: d, rot: [0, 0, k * 0.25], layer: 1 }));
      }
      return st;
    }
    // fish: the body along +y (the front), a tail fin behind, eyes; five kinds
    function fish(v) {
      const st = [], P = [
        ["#ff7a1a", "#ffffff", "#1a1a1a", 1], // clownfish: orange with white bands
        ["#2a6ae8", "#ffd23f", "#1a2a5a", 1], // blue tang: blue, a yellow tail
        ["#ffd23f", "#ffe88a", "#1a1a1a", 1], // yellow tang
        ["#b8c8d8", "#e8f0f8", "#5a6a7a", 0.7], // sardine: small and silver, in big schools
        ["#3ac8a0", "#ff8ac0", "#1a5a4a", 1.4], // parrotfish: green with pink, bigger
      ][v];
      const body = C(P[0]), acc = C(P[1]), dark = C(P[2]), k = P[3];
      st.push(S("sphere", [0, 0, 40 * k], [16 * k, 42 * k, 24 * k], { color: body }));
      st.push(S("cube", [0, -50 * k, 40 * k], [3, 14 * k, 20 * k], { color: v === 1 ? acc : body, round: 0.3 }));
      st.push(S("cube", [0, 0, 64 * k], [3, 22 * k, 8 * k], { color: v === 1 ? dark : body, layer: 1 }));
      if (v === 0) for (const y of [-14, 18]) st.push(S("cube", [0, y, 40], [18, 4, 26], { m: "rep", color: acc, layer: 1 }));
      else if (v === 4) st.push(S("sphere", [0, 22 * k, 34 * k], [14 * k, 14 * k, 14 * k], { m: "rep", color: acc, layer: 1 }));
      else st.push(S("sphere", [0, -10 * k, 30 * k], [14 * k, 26 * k, 10 * k], { m: "rep", color: acc, layer: 1 }));
      st.push(S("sphere", [10 * k, 26 * k, 46 * k], [4, 4, 4], { color: C("#101010"), mirror: true, offsX: 10 * k, layer: 2 }));
      st.push(S("sphere", [0, 38 * k, 38 * k], [4, 4, 4], { color: dark, layer: 2 }));
      return st;
    }
    // a sea turtle: a domed shell with its pattern, a head, four flippers
    function seaturtle() {
      const st = [], sh = C("#5a7a3a"), pat = C("#8a6a2a"), skin = C("#9ab07a"), dark = C("#2a3a1a");
      st.push(S("sphere", [0, 0, 50], [90, 110, 40], { color: sh }));
      st.push(S("sphere", [0, 0, 36], [86, 104, 20], { color: skin }));
      for (const [x, y] of [[0, 0], [-46, 40], [46, 40], [-46, -40], [46, -40], [0, 70], [0, -70]]) st.push(S("sphere", [x, y, 84], [22, 22, 8], { color: pat, layer: 1 }));
      st.push(S("sphere", [0, 140, 46], [30, 34, 26], { color: skin, layer: 1 }));
      st.push(S("cube", [100, 60, 40], [70, 26, 8], { color: skin, rot: [0, 0, -0.5], mirror: true, offsX: 100, layer: 2 }));
      st.push(S("cube", [70, -90, 40], [40, 18, 8], { color: skin, rot: [0, 0, 0.5], mirror: true, offsX: 70, layer: 2 }));
      st.push(S("sphere", [16, 160, 56], [5, 5, 5], { color: dark, mirror: true, offsX: 16, layer: 2 }));
      return st;
    }
    // a manta ray: wide flat wings, dark above and white beneath, a long thin tail
    function manta() {
      const st = [], top = C("#2a3440"), belly = C("#e8ecf0"), dark = C("#1a2028");
      st.push(S("sphere", [0, 0, 30], [80, 70, 22], { color: top }));
      st.push(S("cube", [120, -10, 30], [110, 50, 6], { color: top, rot: [0, 0, 0.35], round: 0.6, mirror: true, offsX: 120 }));
      st.push(S("sphere", [0, 0, 18], [76, 66, 10], { color: belly, layer: 1 }));
      st.push(S("joint", [0, -170, 30], [4, 4, 110], { color: dark, rot: dir(0, -1, 0), layer: 1 }));
      st.push(S("cube", [26, 82, 30], [10, 20, 8], { color: dark, mirror: true, offsX: 26, layer: 1 }));
      return st;
    }
    // a jellyfish: a pale pink bell and trailing tentacles
    function jelly(v) {
      const st = [], bell = C(v ? "#c8a8ff" : "#ffb0d0"), rim = C(v ? "#9a7ad8" : "#e880b0"), ten = C(v ? "#e0d0ff" : "#ffd8e8");
      st.push(S("sphere", [0, 0, 160], [56, 56, 40], { color: bell }));
      st.push(S("sphere", [0, 0, 132], [50, 50, 14], { m: "sub", color: bell }));
      st.push(S("cylinder", [0, 0, 128], [56, 56, 4], { color: rim, hole: 0.85, layer: 1 }));
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; st.push(S("joint", [Math.cos(a) * 34, Math.sin(a) * 34, 70], [3, 3, 56], { color: ten, rot: dir(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 1), layer: 1 })); }
      return st;
    }
    // a crab: a red shell, two claws held up, legs either side
    function crab() {
      const st = [], c = C("#d8402a"), d = C("#a82a1a"), eye = C("#101010");
      st.push(S("sphere", [0, 0, 34], [52, 38, 20], { color: c }));
      for (const y of [-20, 0, 20]) st.push(S("joint", [60, y, 18], [5, 5, 26], { color: d, rot: dir(1, 0, -0.6), mirror: true, offsX: 60 }));
      st.push(S("joint", [46, 48, 48], [7, 7, 22], { color: c, rot: dir(0.3, 1, 0.6), mirror: true, offsX: 46, layer: 1 }));
      st.push(S("sphere", [54, 74, 62], [16, 14, 12], { color: c, mirror: true, offsX: 54, layer: 1 }));
      st.push(S("joint", [14, 34, 58], [3, 3, 10], { color: d, mirror: true, offsX: 14, layer: 1 }));
      st.push(S("sphere", [14, 36, 70], [5, 5, 5], { color: eye, mirror: true, offsX: 14, layer: 2 }));
      st.push(S("sphere", [0, 0, 50], [30, 20, 6], { color: d, layer: 2 }));
      return st;
    }
    // the mouth of a sea cave: a mound of dark rock with a black arch, weed on it and a glow of crystals inside
    function seacave() {
      const st = [], rock = C("#4a5258"), rock2 = C("#3a4248"), dark = C("#05090c"), weed = C("#3a8a4a"), glow = C("#7ae8ff");
      st.push(S("sphere", [0, 0, 120], [360, 300, 220], { color: rock }));
      st.push(S("sphere", [-220, -60, 80], [180, 160, 130], { color: rock2 }));
      st.push(S("sphere", [230, -40, 70], [170, 150, 110], { color: rock2 }));
      st.push(S("cube", [0, 250, 110], [110, 120, 110], { m: "sub", color: rock, round: 0.9 }));
      st.push(S("cube", [0, 210, 100], [96, 70, 96], { m: "rep", color: dark, round: 0.9, layer: 1 }));
      st.push(S("cube", [0, 150, 100], [100, 90, 100], { color: dark, round: 0.9, layer: 1 }));
      for (const [x, y, z] of [[-150, 180, 260], [140, 200, 240], [-60, -120, 320], [200, 60, 230], [-260, 40, 180]]) st.push(S("joint", [x, y, z + 50], [9, 9, 60], { color: weed, rot: dir((x % 7) * 0.05, 0.1, 1), layer: 2 }));
      for (const [x, z] of [[-60, 40], [50, 70], [10, 150]]) st.push(S("cube", [x, 230, z], [14, 14, 30], { color: glow, rot: [0.3, 0.2, 0], layer: 2 }));
      return st;
    }
    const SEA = { group: "Sea" };
    Object.assign(TB.KIT, {
      kelp: Object.assign({ name: "Kelp", variants: [0, 1, 2], build: kelp, voxel: [7] }, SEA),
      seagrass: Object.assign({ name: "Seagrass", variants: [0, 1], build: seagrass, voxel: [7] }, SEA),
      anemone: Object.assign({ name: "Sea Anemone", variants: [0, 1, 2], build: anemone, voxel: [6] }, SEA),
      sponge: Object.assign({ name: "Sea Sponge", variants: [0, 1], build: sponge, voxel: [7] }, SEA),
      seastar: Object.assign({ name: "Sea Star", variants: [0, 1, 2], build: seastar, voxel: [6] }, SEA),
      urchin: Object.assign({ name: "Sea Urchin", variants: [0], build: urchin, voxel: [5] }, SEA),
      searock: Object.assign({ name: "Barnacled Rock", variants: [0, 1], build: searock, voxel: [8] }, SEA),
      seashell: Object.assign({ name: "Seashell", variants: [0, 1], build: shell, voxel: [5] }, SEA),
      seafish: Object.assign({ name: "Sea Fish", variants: [0, 1, 2, 3, 4], build: fish, voxel: [4], variantLabel: (v) => ["clownfish", "blue tang", "yellow tang", "sardine", "parrotfish"][v] }, SEA),
      seaturtle: Object.assign({ name: "Sea Turtle", variants: [0], build: seaturtle, voxel: [6] }, SEA),
      manta: Object.assign({ name: "Manta Ray", variants: [0], build: manta, voxel: [6] }, SEA),
      jelly: Object.assign({ name: "Jellyfish", variants: [0, 1], build: jelly, voxel: [7] }, SEA),
      seacrab: Object.assign({ name: "Crab", variants: [0], build: crab, voxel: [6] }, SEA),
      seacave: Object.assign({ name: "Sea Cave Mouth", variants: [0], build: seacave, voxel: [10] }, SEA),
    });
  }
  if (!G.App) return;
  const App = G.App, S = App.S, hash2 = App.hash2, rnd = Math.random;
  // what is placed: the bottom's plants and things (sway: how much the swell moves it), and what swims
  const STATIC = [["kelp", 0, 1], ["kelp", 1, 1], ["kelp", 2, 1], ["seagrass", 0, 1], ["seagrass", 1, 1], ["anemone", 0, 0.4], ["anemone", 1, 0.4], ["anemone", 2, 0.4],
    ["sponge", 0, 0], ["sponge", 1, 0], ["seastar", 0, 0], ["seastar", 1, 0], ["seastar", 2, 0], ["urchin", 0, 0], ["searock", 0, 0], ["searock", 1, 0], ["seashell", 0, 0], ["seashell", 1, 0],
    ["coral", 0, 0.15], ["coral", 1, 0.3], ["coral", 2, 0], ["coral", 3, 0.1]];
  const MOVING = [["seafish", 0], ["seafish", 1], ["seafish", 2], ["seafish", 3], ["seafish", 4], ["seaturtle", 0], ["manta", 0], ["jelly", 0], ["jelly", 1], ["seacrab", 0]];
  const CELL = 24, RANGE = 40, CAP = 900; // (under the water the haze closes in at 25-30 blocks; from above little of the bottom shows)
  const geo = {}, meshes = {}, cells = new Map(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const key = (k, v) => k + "_" + v;
  let ready = false, swayMat = null, sig = "";
  // the swell: the plants lean back and forth, more the higher up they are (a vertex shader on the instanced plants)
  const swayU = { value: 0 };
  function swayMaterial() {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSway = swayU;
      sh.vertexShader = "uniform float uSway;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\n  float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;\n  float hgt = max(0.0, position.y);\n  float amt = hgt * hgt * 0.025 * swayK;\n  transformed.x += sin(uSway * 1.3 + ph) * amt;\n  transformed.z += cos(uSway * 1.1 + ph * 1.7) * amt * 0.6;\n#endif");
      sh.vertexShader = "uniform float swayK;\n" + sh.vertexShader;
      sh.uniforms.swayK = { value: m.userData.k || 1 };
    };
    return m;
  }
  // a model's mesh with its base at y = 0, centred, in blocks (so the shader's height is the height above the sand)
  function entryFor(md) {
    const g = App.makeVoxMesh(md).geometry, box = App.meshBox(md);
    // (the mesher's positions and normals are small integers: into floats first, or the move into blocks would round them)
    for (const n of ["position", "normal"]) { const A = g.getAttribute(n); g.setAttribute(n, new THREE.Float32BufferAttribute(Float32Array.from(A.array, (v) => (A.normalized ? v / 127 : v)), 3)); }
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - box.min.y, md.origin[2] * S - (box.min.z + box.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S)));
    return g;
  }
  App.loadSeaLife = async () => {
    await Promise.all(STATIC.concat(MOVING).map(async ([k, v, sway]) => {
      const K = TB.KIT[k], r = await App.job("compact", { strokes: K.build(v), voxel: K.voxel[0], lip: 1.5 });
      geo[key(k, v)] = entryFor(r.mesh);
      let mat = App.voxMaterial;
      if (sway) { mat = swayMaterial(); mat.userData.k = sway; }
      const m = new THREE.InstancedMesh(geo[key(k, v)], mat, k === "seafish" ? CAP : CAP / 3);
      m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      App.scene.add(m);
      meshes[key(k, v)] = m;
    }));
    await caveModel();
    ready = true;
  };
  // ---------- where things are: by cell, the same every time ----------
  // (out in the deep sea the blocks stop at the bottom and a flat sea bed lies a block above them, world.js)
  const floorY = (x, z) => Math.max(1, App.columnHeight(Math.floor(x), Math.floor(z)));
  const depthAt = (x, z) => App.WATER_Y - floorY(x, z); // how much water there is over the sand
  const warmSea = (x, z) => { const R = App.regions[App.regionOf(x, z)]; return !!R && (R.name === "Beach Sand" || R.name === "The Palm"); };
  App.seaFloorY = floorY;
  function makeCell(cx, cz) {
    const out = { stat: [], swim: [] }, x0 = cx * CELL, z0 = cz * CELL;
    const r = (k) => hash2(cx * 7919 + k, cz * 104729 - k, 4411);
    if (!App.seaAt(x0 + CELL / 2, z0 + CELL / 2) && !App.seaAt(x0 + 3, z0 + 3) && !App.seaAt(x0 + CELL - 3, z0 + CELL - 3)) return out;
    const warm = warmSea(x0 + CELL / 2, z0 + CELL / 2);
    // a few patches per cell: a kelp stand or a coral garden, a seagrass meadow, a rock with things round it
    for (let p = 0; p < 4; p++) {
      const px = x0 + 2 + r(p * 13) * (CELL - 4), pz = z0 + 2 + r(p * 13 + 1) * (CELL - 4);
      if (!App.seaAt(px, pz)) continue;
      const d = depthAt(px, pz), kind = r(p * 13 + 2);
      const put = (k, v, x, z, s, rot) => { if (App.seaAt(x, z) && depthAt(x, z) > 0.8) out.stat.push({ k: key(k, v), x, z, y: floorY(x, z), s, rot }); };
      if (d > 2.6 && kind < 0.4 && !warm) for (let j = 0; j < 7; j++) { const a = r(p * 50 + j) * 6.28, rr = r(p * 50 + j + 20) * 4; put("kelp", Math.floor(r(p * 50 + j + 40) * 3), px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 0.85 + r(p * 50 + j + 60) * 0.4, a); }
      else if (d > 1.4 && kind < 0.45 && warm) for (let j = 0; j < 10; j++) { const a = r(p * 50 + j) * 6.28, rr = r(p * 50 + j + 20) * 4.5; put("coral", Math.floor(r(p * 50 + j + 40) * 4), px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 0.8 + r(p * 50 + j + 60) * 0.7, a); if (j % 3 === 0) put("anemone", Math.floor(r(p * 50 + j + 80) * 3), px + Math.cos(a + 1) * rr, pz + Math.sin(a + 1) * rr, 1, a); }
      else if (d < 3.2 && kind < 0.75) for (let j = 0; j < 12; j++) { const a = r(p * 50 + j) * 6.28, rr = r(p * 50 + j + 20) * 3.5; put("seagrass", j % 2, px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 0.9 + r(p * 50 + j + 60) * 0.5, a); }
      else {
        put("searock", Math.floor(r(p * 13 + 3) * 2), px, pz, 0.9 + r(p * 13 + 4) * 0.8, r(p * 13 + 5) * 6.28);
        for (let j = 0; j < 5; j++) {
          const a = r(p * 50 + j) * 6.28, rr = 1.6 + r(p * 50 + j + 20) * 2.5, w = r(p * 50 + j + 40);
          const [k, n] = w < 0.25 ? ["seastar", 3] : w < 0.45 ? ["urchin", 1] : w < 0.65 ? ["sponge", 2] : w < 0.85 ? ["anemone", 3] : ["seashell", 2];
          put(k, Math.floor(r(p * 50 + j + 60) * n), px + Math.cos(a) * rr, pz + Math.sin(a) * rr, 1, a);
        }
      }
    }
    // shells and sea stars here and there on the sand
    for (let j = 0; j < 6; j++) { const x = x0 + r(300 + j) * CELL, z = z0 + r(320 + j) * CELL; if (App.seaAt(x, z)) out.stat.push({ k: key(r(340 + j) < 0.5 ? "seashell" : "seastar", r(340 + j) < 0.5 ? j % 2 : j % 3), x, z, y: floorY(x, z), s: 1, rot: r(360 + j) * 6.28 }); }
    // what swims: a school or two, now and then a turtle, a manta or jellyfish; crabs in the shallows
    const deepSpot = (k, min) => { for (let j = 0; j < 6; j++) { const x = x0 + 3 + r(k + j) * (CELL - 6), z = z0 + 3 + r(k + j + 9) * (CELL - 6); if (App.seaAt(x, z) && depthAt(x, z) > min) return { x, z }; } return null; };
    for (let s = 0; s < 2; s++) {
      const p = deepSpot(500 + s * 30, 1.6);
      if (!p || r(560 + s) < 0.25) continue;
      const sp = warm ? [0, 1, 2, 4][Math.floor(r(570 + s) * 4)] : [3, 3, 1, 4][Math.floor(r(570 + s) * 4)], n = sp === 3 ? 26 : sp === 4 ? 4 : 9;
      out.swim.push({ type: "school", k: key("seafish", sp), cx: p.x, cz: p.z, home: { x: p.x, z: p.z }, n, rad: sp === 3 ? 2.2 : 1.6, h: r(580 + s) * 6.28, ph: r(590 + s) * 100, depthK: 0.35 + r(600 + s) * 0.4 });
    }
    if (r(700) < 0.18) { const p = deepSpot(710, 2.4); if (p) out.swim.push({ type: "glide", k: key("seaturtle", 0), cx: p.x, cz: p.z, home: p, h: r(720) * 6.28, ph: r(721) * 100, depthK: 0.5, sp: 0.9, s: 1 }); }
    if (r(730) < 0.1) { const p = deepSpot(740, 3.2); if (p) out.swim.push({ type: "glide", k: key("manta", 0), cx: p.x, cz: p.z, home: p, h: r(750) * 6.28, ph: r(751) * 100, depthK: 0.45, sp: 1.3, s: 1.2 }); }
    if (r(760) < 0.3) { const p = deepSpot(770, 2.5); if (p) for (let j = 0; j < 3; j++) out.swim.push({ type: "drift", k: key("jelly", (j + cx) & 1), cx: p.x + (r(780 + j) - 0.5) * 6, cz: p.z + (r(790 + j) - 0.5) * 6, ph: r(800 + j) * 100, depthK: 0.3 + r(810 + j) * 0.4 }); }
    if (r(820) < 0.6) for (let j = 0; j < 3; j++) { const p = deepSpot(830 + j * 10, 0.6); if (p && depthAt(p.x, p.z) < 2.5) out.swim.push({ type: "crab", k: key("seacrab", 0), cx: p.x, cz: p.z, home: p, h: r(860 + j) * 6.28, ph: r(870 + j) * 100 }); }
    return out;
  }
  // ---------- every frame near the sea ----------
  const counts = {};
  App.updateSeaLife = (dt) => {
    if (!ready) return;
    swayU.value += dt;
    const tx = App.cam.target.x, tz = App.cam.target.z, high = App.cam.radius > 220 || App.inside;
    drawCaves(tx, tz);
    // the cells round the view (none from high up or inside)
    const ccx = Math.floor(tx / CELL), ccz = Math.floor(tz / CELL), s2 = high ? "off" : ccx + "," + ccz;
    if (s2 !== sig) {
      sig = s2;
      const want = new Set(), R = Math.ceil(RANGE / CELL);
      if (!high) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dz * dz <= R * R) { const k = (ccx + dx) + ":" + (ccz + dz); want.add(k); if (!cells.has(k)) cells.set(k, makeCell(ccx + dx, ccz + dz)); }
      for (const k of [...cells.keys()]) if (!want.has(k)) cells.delete(k);
      // the bottom: written once per change of cells
      for (const k in counts) counts[k] = 0;
      for (const c of cells.values()) for (const o of c.stat) {
        const m = meshes[o.k]; if (!m) continue;
        const i = counts[o.k] = (counts[o.k] || 0);
        if (i >= m.instanceMatrix.count) continue;
        Q.setFromAxisAngle(V.set(0, 1, 0), o.rot);
        M4.compose(V.set(o.x, o.y, o.z), Q, SC.set(o.s, o.s, o.s));
        m.setMatrixAt(i, M4); counts[o.k] = i + 1;
      }
      for (const [k, v] of STATIC) { const m = meshes[key(k, v)]; if (m) { m.count = counts[key(k, v)] || 0; m.instanceMatrix.needsUpdate = true; } }
    }
    // what swims, moved every frame
    const n = {}, now = performance.now() / 1000;
    for (const [k, v] of MOVING) n[key(k, v)] = 0;
    const put = (k, x, y, z, yaw, pitch, roll, s) => {
      const m = meshes[k]; if (!m || n[k] >= m.instanceMatrix.count) return;
      E.set(pitch || 0, yaw, roll || 0, "YXZ"); Q.setFromEuler(E);
      M4.compose(V.set(x, y, z), Q, SC.set(s || 1, s || 1, s || 1));
      m.setMatrixAt(n[k]++, M4);
    };
    if (!high) for (const c of cells.values()) for (const o of c.swim) {
      const f = floorY(o.cx, o.cz), top = App.WATER_Y - 0.5, mid = f + 0.6 + (top - f - 0.6) * o.depthK;
      if (o.type === "school") {
        // the school wanders round its home; each fish circles in it, the school turning together
        const t = now * 0.25 + o.ph;
        o.cx = o.home.x + Math.sin(t * 0.7) * 4; o.cz = o.home.z + Math.cos(t * 0.5) * 4;
        if (!App.seaAt(o.cx, o.cz)) { o.cx = o.home.x; o.cz = o.home.z; }
        const head = Math.atan2(Math.cos(t * 0.7) * 0.7 * 4, -Math.sin(t * 0.5) * 0.5 * 4);
        for (let i = 0; i < o.n; i++) {
          const a = i * 2.39996 + now * 0.6, rr = o.rad * Math.sqrt((i + 0.5) / o.n);
          const x = o.cx + Math.cos(a) * rr, z = o.cz + Math.sin(a) * rr, y = Math.max(f + 0.4, Math.min(top, mid + Math.sin(i * 1.7 + now) * 0.35));
          put(o.k, x, y, z, head + Math.sin(now * 8 + i) * 0.15, 0, 0, 1);
        }
      } else if (o.type === "glide") {
        const t = now * 0.08 * o.sp + o.ph, x = o.home.x + Math.sin(t) * 7, z = o.home.z + Math.sin(t * 2) * 3.5;
        const dx = Math.cos(t) * 7, dz = Math.cos(t * 2) * 7, y = Math.max(f + 0.5, Math.min(top - 0.3, mid + Math.sin(now * 0.4 + o.ph) * 0.4));
        if (App.seaAt(x, z)) { o.cx = x; o.cz = z; }
        put(o.k, o.cx, y, o.cz, Math.atan2(dx, dz), 0, Math.sin(now * 1.2 + o.ph) * 0.12, o.s);
      } else if (o.type === "drift") {
        const y = Math.max(f + 0.6, Math.min(top - 0.6, mid + Math.sin(now * 0.5 + o.ph) * 0.8));
        put(o.k, o.cx + Math.sin(now * 0.1 + o.ph) * 0.6, y, o.cz, now * 0.2 + o.ph, 0, 0, 0.9 + Math.sin(now * 2 + o.ph) * 0.06);
      } else if (o.type === "crab") {
        // sideways over the sand, stopping now and then
        const t = now * 0.3 + o.ph, go = Math.sin(t) > -0.3, s = go ? Math.sin(t * 0.5) * 2.2 : 0;
        const x = o.home.x + Math.cos(o.h) * s, z = o.home.z - Math.sin(o.h) * s;
        if (App.seaAt(x, z) || App.isLand(x, z) === false) { o.cx = x; o.cz = z; }
        put(o.k, o.cx, floorY(o.cx, o.cz), o.cz, o.h, 0, go ? Math.sin(now * 14 + o.ph) * 0.05 : 0, 1);
      }
    }
    for (const [k, v] of MOVING) { const m = meshes[key(k, v)]; if (m) { m.count = n[key(k, v)]; m.instanceMatrix.needsUpdate = true; } }
  };
  // ---------- the sea caves: only reached by diving ----------
  // Two in every region, out in deep water off its coast (four blocks of water or more over the sand): a mound of rock
  // on the bottom with a black arch. A Tickle you control in first person swims down to its mouth and goes in with E
  // (interiors.js: a grotto of two floors with treasure). From the surface there is no way in.
  const CAVE_NAMES = ["Pearl Grotto", "Kelp Hollow", "Siren's Cave", "Coral Vault", "Drowned Arch", "Mermaid's Rest", "Blue Hole", "Urchin Den", "Moon Grotto", "Tidecutter Cave", "Starfish Hall", "Anchor Deep"];
  App.seaCaves = [];
  App.prepareSeaCaves = () => {
    App.seaCaves.length = 0;
    (App.regions || []).forEach((R, ri) => {
      let made = 0;
      for (let k = 0; k < 1500 && made < 2; k++) {
        const a = hash2(ri, k, 6101) * 6.283, d = 250 + hash2(ri, k, 6103) * 2200, x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (App.regionOf(x, z) !== ri || !App.seaAt(x, z) || depthAt(x, z) < 4) continue;
        // it must have deep sea all round it, and no other cave or dive site close
        if ([0, 1.57, 3.14, 4.71].some((b) => !App.seaAt(x + Math.cos(b) * 5, z + Math.sin(b) * 5))) continue;
        if (App.seaCaves.some((c) => Math.hypot(c.x - x, c.z - z) < 120) || (App.diveSites || []).some((s) => Math.hypot(s.x - x, s.z - z) < 30)) continue;
        const rot = hash2(ri, k, 6107) * 6.283, i = App.seaCaves.length;
        App.seaCaves.push({ i, region: ri, x, z, y: floorY(x, z), rot, name: CAVE_NAMES[i % CAVE_NAMES.length], door: { x: x + Math.sin(rot) * 3.2, z: z + Math.cos(rot) * 3.2 } });
        made++;
      }
    });
  };
  // the cave whose mouth is near (x, z), for a Tickle at height y: it has to be down there, under the water
  App.seaCaveAt = (x, z, y) => {
    for (const c of App.seaCaves) if (Math.hypot(c.door.x - x, c.door.z - z) < 3.2 || Math.hypot(c.x - x, c.z - z) < 3.6) return { cave: c, under: y < App.WATER_Y - 1.2 };
    return null;
  };
  let caveMesh = null;
  async function caveModel() {
    const K = TB.KIT.seacave, r = await App.job("compact", { strokes: K.build(0), voxel: K.voxel[0], lip: 1.5 });
    caveMesh = new THREE.InstancedMesh(entryFor(r.mesh), App.voxMaterial, 24);
    caveMesh.frustumCulled = false; caveMesh.count = 0; App.scene.add(caveMesh);
  }
  function drawCaves(tx, tz) {
    if (!caveMesh) return;
    let n = 0;
    for (const c of App.seaCaves) {
      if (Math.hypot(c.x - tx, c.z - tz) > 160 || n >= 24) continue;
      Q.setFromAxisAngle(V.set(0, 1, 0), c.rot);
      M4.compose(V.set(c.x, c.y, c.z), Q, SC.set(1.3, 1.3, 1.3));
      caveMesh.setMatrixAt(n++, M4);
    }
    caveMesh.count = n; caveMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- under the water ----------
  // Whenever the camera is under the surface (diving in first person, or following a diver: world.js keeps the view
  // down with it, from above and behind, as diving in the old handheld games): the water closes in, deep blue-green and
  // darker the deeper it is, shafts of light come down from the surface and sway, bubbles rise, the screen is tinted.
  const SHALLOW = new THREE.Color(0x2a8c9c), DEEP = new THREE.Color(0x0a3444), UWC = new THREE.Color(), SAND = new THREE.Color(0xb8a77a), BED = new THREE.Color();
  let rays = null, bubbles = null, wasUnder = false;
  const bub = [];
  function makeUnderwater() {
    // a soft vertical shaft: bright at the top, fading to nothing below
    const cv = document.createElement("canvas"); cv.width = 16; cv.height = 64;
    const cx = cv.getContext("2d"), gr = cx.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, "rgba(200,255,255,0.55)"); gr.addColorStop(1, "rgba(200,255,255,0)");
    cx.fillStyle = gr; cx.fillRect(0, 0, 16, 64);
    const tex = new THREE.CanvasTexture(cv);
    rays = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, opacity: 0.6 });
    for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + (k % 3) * 0.6, 7), mat); m.userData.ph = k * 1.7; rays.add(m); }
    rays.visible = false; App.scene.add(rays);
    bubbles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.75 }), 90);
    bubbles.frustumCulled = false; bubbles.count = 0; App.scene.add(bubbles);
    for (let k = 0; k < 90; k++) bub.push({ x: 0, y: -99, z: 0, v: 0.6 + Math.random() * 0.8, w: Math.random() * 6 });
  }
  App.underwaterRender = (camera, dt) => {
    if (!rays) makeUnderwater();
    const inWater = camera.position.y < App.WATER_Y - 0.05, above = !inWater && App.diveView;
    const under = !App.inside && (inWater || above), sc = App.scene, fog = sc.fog;
    const tint = document.getElementById("uwTint");
    if (tint && tint.hidden === under) tint.hidden = !under;
    const W = App.waterMesh, B = App.seabedMesh;
    if (!under) {
      if (wasUnder) {
        wasUnder = false; rays.visible = false; bubbles.count = 0;
        if (W) W.visible = true;
        if (B && B.userData.col) B.material.color.copy(B.userData.col);
        if (fog && App.NO_FOG && !(App.fpOn && App.fpOn())) { fog.near = App.NO_FOG.near; fog.far = App.NO_FOG.far; }
      }
      return;
    }
    wasUnder = true;
    // the sea bed is sand down here (from above, through the water, it is the deep blue of the sea)
    if (B) { if (!B.userData.col) B.userData.col = B.material.color.clone(); B.material.color.copy(SAND); }
    if (W) W.visible = !above;
    const depth = above ? 3 : Math.max(0, App.WATER_Y - camera.position.y), night = App.isNight ? 0.45 : 1;
    UWC.copy(SHALLOW).lerp(DEEP, Math.min(1, depth / 6)).multiplyScalar(night).convertSRGBToLinear();
    const r = above ? App.cam.radius : 0;
    if (fog) { fog.color.copy(UWC); fog.near = 1 + r * 0.6; fog.far = Math.max(12, 30 - depth * 2.2) + r; }
    sc.background = fog ? fog.color : UWC;
    // the shafts of light, round the camera, leaning a little and swaying
    const t = performance.now() / 1000;
    rays.visible = !App.isNight;
    rays.children.forEach((m, k) => {
      const a = k * 2.39996 + Math.floor(camera.position.x / 9) * 0.3, r = 3 + (k % 4) * 2.4;
      m.position.set(camera.position.x + Math.cos(a) * r + Math.sin(t * 0.3 + m.userData.ph) * 0.6, App.WATER_Y - 3.4, camera.position.z + Math.sin(a) * r);
      m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), Math.sin(t * 0.4 + m.userData.ph) * 0.12);
      m.material.opacity = 0.35 + 0.15 * Math.sin(t * 0.7 + m.userData.ph);
    });
    // bubbles: from the sand round the camera, and from whoever is diving near
    let n = 0;
    for (const b of bub) {
      if (b.y < -50 || b.y > App.WATER_Y) { const a = Math.random() * 6.283, r = Math.random() * 7; b.x = camera.position.x + Math.cos(a) * r; b.z = camera.position.z + Math.sin(a) * r; b.y = floorY(b.x, b.z) + Math.random() * 0.5; }
      b.y += b.v * (dt || 0.016); b.w += (dt || 0.016) * 3;
      M4.makeTranslation(b.x + Math.sin(b.w) * 0.08, b.y, b.z + Math.cos(b.w) * 0.08);
      bubbles.setMatrixAt(n++, M4);
    }
    bubbles.count = n; bubbles.instanceMatrix.needsUpdate = true;
  };
  // how much there is near the view (tests)
  App.seaLifeCounts = () => { const o = {}; for (const k in meshes) if (meshes[k].count) o[k] = meshes[k].count; return o; };
})(typeof self !== "undefined" ? self : this);
