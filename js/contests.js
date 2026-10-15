/* Contests. Besides the arenas and the dungeons, every region holds a contest every day, a different kind
 * each day, so that over eight days each region has had them all:
 *   Fishing Derby     on the bank by the region's dock: the heaviest catch in an hour and a half wins
 *   Surf Contest      on the same shore: judges score every wave; the best two waves count
 *   Regatta           sailing dinghies round the buoys in front of the dock
 *   Foot Race         laps of a circuit marked with cones near the region's main town
 *   Kart Grand Prix   karts on the same circuit
 *   Strongest Tickle  on the town square: a one-paw dumbbell press each, the heaviest wins
 *   Fashion Show      a catwalk on the square: the models change their clothes and the judges score them;
 *                     they keep their new look, and the winner's look becomes the fashion of the region
 *   Song Contest      a stage on the square: each singer performs a song; the winner's song becomes the
 *                     tune of every village in the region
 * The best of the region enter (fishers in the derby, surf teachers in the surf contest, DJs in the song
 * contest...), the neighbours come to watch and three judges score the shows. The top three climb the podium
 * and take 40, 20 and 10 shells. A contest is decided whether or not you watch it: what you see is the same
 * contest you would read about afterwards. Play as a holder and you can enter your own Tickles. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the props, in the kit's stroke format ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    const ACC = ["#e8443a", "#2f8fe0", "#3cbf6c", "#ffd23f", "#8a4fd8", "#ff8a2f"];
    // a go-kart: the driver sits low between the side pods, hands on the wheel
    function kart(v) {
      const st = [], acc = C(ACC[(v || 0) % 6]), pan = C("#2a2a2a"), grey = C("#9a9a9a"), white = C("#ffffff"), black = C("#151515");
      st.push(S("cube", [0, 0, 24], [118, 205, 8], { color: pan, round: 0.2 }));
      st.push(S("cube", [0, 150, 52], [78, 62, 30], { color: acc, round: 0.45 }));
      st.push(S("cube", [118, -10, 46], [24, 120, 22], { color: acc, round: 0.5, mirror: true, offsX: 118 }));
      st.push(S("cube", [0, -178, 72], [56, 34, 40], { color: grey, round: 0.25 }));
      st.push(S("cube", [0, -55, 60], [64, 50, 32], { color: black, round: 0.4, layer: 1 }));
      st.push(S("cube", [0, -102, 128], [64, 12, 62], { color: black, round: 0.4, layer: 1 }));
      st.push(S("joint", [0, 80, 100], [6, 6, 62], { color: grey, rot: dir(0, -0.75, 1), layer: 1 }));
      st.push(S("cylinder", [0, 46, 150], [40, 40, 6], { color: black, hole: 0.72, rot: dir(0, -0.75, 1), layer: 1 }));
      st.push(S("cylinder", [150, 140, 44], [44, 44, 20], { color: black, rot: dir(1, 0, 0), mirror: true, offsX: 150, layer: 2 }));
      st.push(S("cylinder", [155, -140, 52], [52, 52, 26], { color: black, rot: dir(1, 0, 0), mirror: true, offsX: 155, layer: 2 }));
      st.push(S("cylinder", [171, 140, 44], [20, 20, 3], { color: white, rot: dir(1, 0, 0), mirror: true, offsX: 171, layer: 2 }));
      st.push(S("cylinder", [182, -140, 52], [24, 24, 3], { color: white, rot: dir(1, 0, 0), mirror: true, offsX: 182, layer: 2 }));
      st.push(S("cube", [0, -224, 162], [140, 22, 8], { color: acc, round: 0.3, layer: 3 }));
      st.push(S("cube", [92, -216, 122], [6, 10, 34], { color: grey, mirror: true, offsX: 92, layer: 3 }));
      st.push(S("cube", [0, 214, 66], [40, 6, 24], { color: white, round: 0.3, layer: 3 }));
      return st;
    }
    // a sailing dinghy: white hull, mast, boom high enough to sit under, a stepped sail with a coloured band
    function dinghy(v) {
      const st = [], hull = C("#ffffff"), acc = C(ACC[(v || 0) % 6]), wood = C("#a0703a"), dark = C("#6b4a2b"), sail = C("#fff8e8");
      st.push(S("sphere", [0, 0, 60], [125, 300, 80], { color: hull }));
      st.push(S("sphere", [0, 0, 112], [105, 275, 70], { m: "sub", color: hull }));
      st.push(S("sphere", [0, 250, 116], [52, 62, 22], { color: acc, layer: 1 }));
      st.push(S("joint", [0, 90, 510], [9, 9, 440], { color: dark, layer: 1 }));
      st.push(S("joint", [0, -45, 330], [7, 7, 140], { color: dark, rot: dir(0, 1, 0), layer: 1 }));
      for (let k = 0; k < 7; k++) { const w = 132 - k * 17; st.push(S("cube", [0, 90 - w, 380 + k * 85], [3, w, 43], { color: k === 2 ? acc : sail, layer: 2 })); }
      st.push(S("cube", [0, -298, 40], [5, 30, 62], { color: wood, layer: 2 }));
      st.push(S("joint", [0, -250, 118], [5, 5, 52], { color: wood, rot: dir(0, 1, 0.2), layer: 2 }));
      return st;
    }
    // the song contest's stage: boards, a lit back wall, speakers and a microphone
    function stage() {
      const st = [], wood = C("#8a5a30"), wall = C("#2a1a40"), black = C("#151515"), grey = C("#9a9a9a"), gold = C("#ffd23f"), pink = C("#ff5fa8"), cyan = C("#3fd0ff");
      st.push(S("cube", [0, 0, 35], [440, 260, 35], { color: wood, round: 0.03 }));
      st.push(S("cube", [0, 278, 16], [160, 20, 16], { color: wood }));
      st.push(S("cube", [0, -250, 330], [440, 14, 260], { color: wall, layer: 2 }));
      st.push(S("cube", [0, -236, 600], [460, 20, 18], { color: gold, layer: 2 }));
      for (let k = 0; k < 11; k++) st.push(S("sphere", [-400 + k * 80, -224, 640], [18, 18, 18], { color: k % 2 ? pink : cyan, layer: 2 }));
      st.push(S("cube", [360, 130, 200], [55, 50, 130], { color: black, round: 0.1, mirror: true, offsX: 360, layer: 3 }));
      st.push(S("cylinder", [360, 182, 250], [34, 34, 4], { color: grey, rot: dir(0, 1, 0), mirror: true, offsX: 360, layer: 3 }));
      st.push(S("cylinder", [360, 182, 140], [24, 24, 4], { color: grey, rot: dir(0, 1, 0), mirror: true, offsX: 360, layer: 3 }));
      st.push(S("joint", [0, 205, 190], [4, 4, 120], { color: grey, layer: 4 }));
      st.push(S("sphere", [0, 205, 320], [12, 12, 16], { color: black, layer: 4 }));
      return st;
    }
    // the fashion show's catwalk, with its backdrop and a doorway the models come out of
    function catwalk() {
      const st = [], white = C("#f4f4f4"), pink = C("#ff5fa8"), gold = C("#ffd23f"), wall = C("#2a1a40"), bulb = C("#fff6b0");
      st.push(S("cube", [0, 0, 30], [130, 620, 30], { color: white, round: 0.04 }));
      st.push(S("cube", [0, 0, 62], [104, 612, 3], { color: pink }));
      for (let k = 0; k < 13; k++) st.push(S("sphere", [120, -570 + k * 95, 64], [9, 9, 9], { color: bulb, mirror: true, offsX: 120, layer: 1 }));
      st.push(S("cube", [0, -650, 330], [280, 16, 300], { color: wall, layer: 2 }));
      st.push(S("cube", [0, -650, 230], [90, 30, 230], { m: "sub", color: wall, layer: 2 }));
      st.push(S("cube", [0, -640, 650], [300, 22, 22], { color: gold, layer: 3 }));
      st.push(S("cube", [290, -640, 330], [16, 22, 320], { color: gold, mirror: true, offsX: 290, layer: 3 }));
      return st;
    }
    // the start and finish: two posts and a chequered banner
    function startarch() {
      const st = [], post = C("#e8e8e8"), red = C("#e8443a"), black = C("#151515"), white = C("#ffffff");
      st.push(S("cube", [360, 0, 320], [18, 18, 320], { color: post, mirror: true, offsX: 360 }));
      st.push(S("cube", [0, 0, 600], [378, 12, 50], { color: white }));
      for (let r = 0; r < 2; r++) for (let k = 0; k < 14; k++) if ((k + r) % 2 === 0) st.push(S("cube", [-351 + k * 54, 13, 575 + r * 50], [27, 3, 25], { color: black, layer: 2 }));
      st.push(S("cube", [0, 0, 680], [150, 10, 30], { color: red, layer: 2 }));
      return st;
    }
    function trackcone() {
      const st = [], o = C("#ff7a2f"), w = C("#ffffff");
      st.push(S("cube", [0, 0, 5], [36, 36, 5], { color: o }));
      st.push(S("cylinder", [0, 0, 30], [24, 24, 20], { color: o }));
      st.push(S("cylinder", [0, 0, 62], [18, 18, 12], { color: w, layer: 1 }));
      st.push(S("cylinder", [0, 0, 88], [13, 13, 14], { color: o, layer: 1 }));
      st.push(S("cylinder", [0, 0, 108], [8, 8, 8], { color: o, layer: 1 }));
      return st;
    }
    function buoy(v) {
      const st = [], c1 = C(v ? "#ffd23f" : "#e8443a"), w = C("#ffffff"), dark = C("#3a3a3a");
      st.push(S("sphere", [0, 0, 40], [70, 70, 60], { color: c1 }));
      st.push(S("cylinder", [0, 0, 120], [40, 40, 30], { color: w }));
      st.push(S("cylinder", [0, 0, 175], [28, 28, 25], { color: c1 }));
      st.push(S("joint", [0, 0, 280], [5, 5, 80], { color: dark, layer: 2 }));
      st.push(S("cube", [40, 0, 330], [40, 3, 26], { color: c1, layer: 2 }));
      return st;
    }
    // first in the middle and highest, second on its right, third on its left
    function podium() {
      const st = [], base = C("#2f5fb0"), gold = C("#ffd23f"), silver = C("#c8ccd4"), bronze = C("#c9803a");
      st.push(S("cube", [0, 0, 100], [120, 100, 100], { color: base, round: 0.04 }));
      st.push(S("cube", [-240, 0, 70], [120, 100, 70], { color: base, round: 0.04 }));
      st.push(S("cube", [240, 0, 45], [120, 100, 45], { color: base, round: 0.04 }));
      st.push(S("cube", [0, 0, 203], [122, 102, 5], { color: gold, layer: 1 }));
      st.push(S("cube", [-240, 0, 143], [122, 102, 5], { color: silver, layer: 1 }));
      st.push(S("cube", [240, 0, 93], [122, 102, 5], { color: bronze, layer: 1 }));
      st.push(S("cylinder", [0, 102, 110], [40, 40, 4], { color: gold, rot: dir(0, 1, 0), layer: 1 }));
      st.push(S("cylinder", [-240, 102, 75], [36, 36, 4], { color: silver, rot: dir(0, 1, 0), layer: 1 }));
      st.push(S("cylinder", [240, 102, 48], [32, 32, 4], { color: bronze, rot: dir(0, 1, 0), layer: 1 }));
      return st;
    }
    // a dumbbell: lifted with one paw (the handle runs along x)
    function dumbbell() {
      const st = [], steel = C("#c8ccd4"), dark = C("#2a2a2a"), red = C("#e8443a");
      st.push(S("joint", [0, 0, 40], [7, 7, 52], { color: steel, rot: dir(1, 0, 0) }));
      st.push(S("cube", [56, 0, 40], [16, 34, 34], { color: dark, round: 0.25, mirror: true, offsX: 56 }));
      st.push(S("cube", [74, 0, 40], [4, 36, 36], { color: red, round: 0.25, mirror: true, offsX: 74, layer: 1 }));
      st.push(S("cube", [40, 0, 40], [3, 28, 28], { color: red, round: 0.25, mirror: true, offsX: 40, layer: 1 }));
      return st;
    }
    // the judges' table, its skirt and three score cards facing the contestants (+y)
    function judgetable() {
      const st = [], cloth = C("#2f5fb0"), wood = C("#7a4a2a"), white = C("#ffffff"), gold = C("#ffd23f");
      st.push(S("cube", [0, 0, 130], [300, 70, 8], { color: wood }));
      st.push(S("cube", [0, 66, 65], [300, 4, 62], { color: cloth }));
      st.push(S("cube", [290, 0, 65], [8, 66, 62], { color: cloth, mirror: true, offsX: 290, layer: 1 }));
      st.push(S("cube", [0, 68, 112], [300, 5, 8], { color: gold, layer: 1 }));
      for (const x of [-200, 0, 200]) st.push(S("cube", [x, 30, 175], [40, 3, 34], { color: white, layer: 2 }));
      return st;
    }
    function liftplatform() {
      const st = [], rubber = C("#2a2a2a"), wood = C("#c8a060");
      st.push(S("cube", [0, 0, 12], [260, 260, 12], { color: rubber, round: 0.05 }));
      st.push(S("cube", [0, 0, 25], [150, 258, 2], { color: wood }));
      return st;
    }
    const K = { group: "Contests" };
    const six = [0, 1, 2, 3, 4, 5], colour = (v) => ["red", "blue", "green", "yellow", "purple", "orange"][v];
    Object.assign(TB.KIT, {
      kart: Object.assign({ name: "Go-Kart", variants: six, build: kart, voxel: [6], variantLabel: colour }, K),
      dinghy: Object.assign({ name: "Sailing Dinghy", variants: six, build: dinghy, voxel: [8], variantLabel: colour }, K),
      stage: Object.assign({ name: "Song Contest Stage", variants: [0], build: stage, voxel: [9] }, K),
      catwalk: Object.assign({ name: "Catwalk", variants: [0], build: catwalk, voxel: [8] }, K),
      startarch: Object.assign({ name: "Start and Finish Arch", variants: [0], build: startarch, voxel: [8] }, K),
      trackcone: Object.assign({ name: "Track Cone", variants: [0], build: trackcone, voxel: [4] }, K),
      buoy: Object.assign({ name: "Race Buoy", variants: [0, 1], build: buoy, voxel: [6], variantLabel: (v) => (v ? "yellow" : "red") }, K),
      podium: Object.assign({ name: "Podium", variants: [0], build: podium, voxel: [8] }, K),
      dumbbell: Object.assign({ name: "Dumbbell", variants: [0], build: dumbbell, voxel: [4] }, K),
      judgetable: Object.assign({ name: "Judges' Table", variants: [0], build: judgetable, voxel: [7] }, K),
      liftplatform: Object.assign({ name: "Lifting Platform", variants: [0], build: liftplatform, voxel: [8] }, K),
    });
  }
  if (!G.App) return;
  const App = G.App, st = App.st, hash2 = App.hash2, DAY = 1440, rnd = Math.random;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nm = (id) => App.nameOf(id);
  const KU = 0.0064; // one kit unit, in blocks
  const CER = 12, PRIZE = [40, 20, 10], XPS = [30, 20, 10];
  const hm = (m) => { m = ((Math.round(m) % DAY) + DAY) % DAY; const h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const today = () => Math.floor(st.T / DAY);
  const CLOTHES = (App.CLOTHES = ["shirt", "headtop", "glasses", "neck"]);
  // the songs a singer can choose from (all of them happy enough to be a village's tune)
  const SONGS = ["town_rpg", "happy_town", "exploring_town", "puppy_garden", "floppy_ears", "heckin_crows", "feel_good_island", "tropical_fantasy", "sandy_seaside"];
  function rng(a, b) { let s = (Math.imul(a + 11, 2654435761) ^ Math.imul(b + 5, 40503)) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // ---------- the kinds of contest (times are minutes of the day) ----------
  const KINDS = (App.CONTEST_KINDS = {
    fishing: { name: "Fishing Derby", venue: "shore", gather: 870, go: 885, end: 975, n: 10, who: "fishers", unit: "kg", what: "the heaviest catch in an hour and a half wins" },
    surf: { name: "Surf Contest", venue: "sea", gather: 900, go: 915, end: 980, n: 8, who: "surfers", unit: "points", judges: true, what: "the judges score every wave; the best two count" },
    regatta: { name: "Regatta", venue: "lake", gather: 900, go: 920, cap: 995, n: 6, who: "sailors", race: true, what: "sailing dinghies round the buoys, twice" },
    run: { name: "Foot Race", venue: "track", gather: 930, go: 945, cap: 1005, n: 10, who: "runners", race: true, what: "laps of a circuit marked with cones" },
    kart: { name: "Kart Grand Prix", venue: "track", gather: 960, go: 975, cap: 1020, n: 8, who: "drivers", race: true, what: "go-karts round the circuit" },
    strong: { name: "Strongest Tickle", venue: "square", gather: 960, go: 975, n: 8, turn: 6, who: "lifters", unit: "kg", judges: true, what: "a one-paw dumbbell press each, the heaviest wins" },
    fashion: { name: "Fashion Show", venue: "square", gather: 1200, go: 1215, n: 8, turn: 5, who: "models", unit: "points", judges: true, what: "new clothes on the catwalk; the winning look becomes the fashion" },
    music: { name: "Song Contest", venue: "square", gather: 1260, go: 1275, n: 6, turn: 11, who: "singers", unit: "points", judges: true, what: "a song each on the stage; the winning song becomes the region's tune" },
  });
  const ORDER = ["fishing", "run", "surf", "music", "kart", "fashion", "regatta", "strong"];

  // ---------- who is good at what ----------
  const P = App.pop;
  const gname = (id) => (P.ground[id] >= 0 ? App.MODEL_NAMES["ground:" + P.ground[id]] : null);
  const per = (id) => App.personaOf(id);
  const lvl = (id) => Math.min(12, App.levelOf ? App.levelOf(id) : 1);
  const luck = (id, k) => hash2(id, 401, k);
  const job = (id) => App.jobOf(id);
  const SKILL = {
    fishing: (id) => (job(id) === "fisher" ? 3 : 0) + (gname(id) === "Fishing Rod" ? 2 : 0) + (App.choreOf && App.choreOf(id) === "fish" ? 1.5 : 0) + per(id).lazy * 1.5 + luck(id, 1) * 2,
    surf: (id) => (gname(id) === "Surfs Up" ? 3.5 : 0) + (job(id) === "surfer" ? 2.5 : 0) + per(id).playful * 2 + luck(id, 2) * 2,
    regatta: (id) => (job(id) === "dockhand" ? 3 : job(id) === "fisher" ? 1.5 : 0) + (P.floor[id] === 3 ? 1.5 : 0) + lvl(id) * 0.2 + luck(id, 3) * 3,
    run: (id) => (2.3 - per(id).lazy) * 3 + lvl(id) * 0.2 + (job(id) === "courier" ? 1 : 0) + luck(id, 4) * 3,
    kart: (id) => (job(id) === "courier" ? 2 : 0) + (gname(id) === "Skateboard" || gname(id) === "Skates" ? 1.5 : 0) + per(id).playful * 2 + luck(id, 5) * 3,
    strong: (id) => (gname(id) === "Workout" ? 3 : 0) + (job(id) === "coach" ? 2 : 0) + (App.guildOf && App.guildOf(id) === "warriors" ? 2 : 0) + lvl(id) * 0.3 + per(id).appetite + luck(id, 6) * 2,
    fashion: (id) => { const tr = TB.pickTraits(TB.seedOf(id)); let n = 0, same = 0; for (const s of CLOTHES) if (tr.sel[s] !== undefined) { n++; if (tr.themeFor[s] !== undefined && tr.themeFor[s] === tr.themeFor.shoes) same++; } return n * 0.8 + same * 0.6 + per(id).sociable * 2 + luck(id, 7) * 3; },
    music: (id) => (gname(id) === "808" ? 3.5 : 0) + (job(id) === "dj" ? 2.5 : 0) + per(id).playful * 1.5 + per(id).sociable * 1.2 + luck(id, 8) * 2,
  };

  // ---------- where each region holds them ----------
  const VEN = {};
  // a point given in a venue's own frame (lx to its right, ly to its front), as rotation.y = rot turns a model
  const frame = (x, z, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return (lx, ly) => ({ x: x + lx * c + ly * s, z: z - lx * s + ly * c }); };
  function obstR(s) {
    if (s.gone || s.type === "duck" || /^grass/.test(s.type)) return 0;
    if (s.building) { const f = App.frag[s.type]; return s.fence ? 1.3 : f ? f.rad * (s.scale || 1) + 0.4 : 3; }
    if (s.tree) return s.type.startsWith("bush") ? 0.8 : 1.3;
    return s.type === "campfire" ? 1.8 : s.type === "logseat" ? 1 : 0.8;
  }
  function clearAt(x, z, r) { for (const s of App.gridNear("scenery", x, z, r + 10)) { const R = obstR(s); if (R && Math.hypot(s.x - x, s.z - z) < r + R) return false; } return true; }
  function hostOf(r) { return App.villages.filter((v) => v.region === r).sort((a, b) => b.residents.length - a.residents.length || a.i - b.i)[0] || null; }
  const dockOf = (r) => (App.docks || []).find((d) => d.region === r) || null;
  function venue(r, type) {
    const k = r + ":" + type;
    if (!(k in VEN)) { try { VEN[k] = { square: squareVenue, shore: shoreVenue, lake: lakeVenue, track: trackVenue, sea: seaVenue }[type](r); } catch (e) { console.warn("contest venue", k, e); VEN[k] = null; } }
    return VEN[k];
  }
  App.contestVenue = venue;
  // worked out once, while the world loads
  App.prepareContests = () => { for (let r = 0; r < App.regions.length; r++) for (const type of ["square", "shore", "lake", "track", "sea"]) venue(r, type); };
  function squareVenue(r) {
    const v = hostOf(r);
    if (!v) return null;
    let best = null, bs = -1;
    for (let k = 0; k < 24; k++) for (const d of [16, 20, 24, 28]) {
      const a = (k / 24) * 6.2832, x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
      if (!App.isLand(x, z)) continue;
      const rot = Math.atan2(v.x - x, v.z - z), L = frame(x, z, rot), h0 = App.genHeight(x, z);
      let ok = 0, n = 0;
      for (let lx = -7.5; lx <= 6; lx += 2.25) for (let ly = -5.5; ly <= 11; ly += 1.5) { n++; const p = L(lx, ly); if (App.isLand(p.x, p.z) && Math.abs(App.genHeight(p.x, p.z) - h0) <= 1.5 && clearAt(p.x, p.z, 0.7)) ok++; }
      const sc = ok / n - d * 0.002;
      if (sc > bs) { bs = sc; best = { x, z, rot }; }
    }
    if (!best) return null;
    return { type: "square", x: best.x, z: best.z, rot: best.rot, L: frame(best.x, best.z, best.rot), village: v, name: v.name + " square", fit: bs };
  }
  // spots on the bank on either side of a dock (or one side only), each with the open lake in front
  const lakeWet = (x, z) => !App.isLand(x, z) && !App.pondWater(x, z) && App.lakeSd(x, z) <= -0.5;
  function bankLine(D, sgn, n, gap, wet) {
    const ux = D.ux, uz = D.uz, px = uz, pz = -ux, out = [];
    for (let k = 0; out.length < n && k < 70; k++) {
      const s = sgn ? sgn * (6 + k * gap) : (k % 2 ? 1 : -1) * (6 + Math.floor(k / 2) * gap);
      const bx = D.land.x + px * s, bz = D.land.z + pz * s;
      let last = null;
      for (let j = -12; j <= 16; j += 0.5) { const x = bx + ux * j, z = bz + uz * j; if (App.isLand(x, z)) last = { x, z }; else if (last) break; }
      if (!last) continue;
      const wx = last.x + ux * 1.7, wz = last.z + uz * 1.7;
      if (!(wet || lakeWet)(wx, wz)) continue;
      const x = last.x - ux * 0.6, z = last.z - uz * 0.6;
      if (!clearAt(x, z, 0.5) || out.some((o) => Math.hypot(o.x - x, o.z - z) < gap * 0.8)) continue;
      out.push({ x, z, wx, wz, s, face: { x: wx, z: wz } });
    }
    return out.sort((a, b) => a.s - b.s);
  }
  App.bankLine = (D, sgn, n, gap, wet) => bankLine(D, sgn, n, gap, wet);
  function shoreVenue(r) {
    const D = dockOf(r);
    if (!D) return null;
    const spots = bankLine(D, 0, 12, 3.2), surf = bankLine(D, 0, 8, 7.5);
    if (spots.length < 6 || surf.length < 4) return null;
    return { type: "shore", D, spots, surf, x: D.land.x, z: D.land.z, name: D.name };
  }
  // a beach on the open sea, for the surf contest (the waves are out there, not on the lake)
  function seaVenue(r) {
    const v = hostOf(r);
    if (!v || !App.seaBeach) return null;
    const b = App.seaBeach(v.x, v.z, 520, r) || App.seaBeach(v.x, v.z, 780, r);
    if (!b) return null;
    const ux = b.cx - b.x, uz = b.cz - b.z, L = Math.hypot(ux, uz) || 1;
    const D = { x: b.x, z: b.z, ux: ux / L, uz: uz / L, land: { x: b.x, z: b.z }, name: App.nearestVillage(b.x, b.z, r).name + " Beach" };
    const sea = (x, z) => App.seaAt(x, z);
    const surf = bankLine(D, 0, 8, 7.5, sea), spots = bankLine(D, 0, 10, 3.2, sea);
    if (surf.length < 4) return null;
    return { type: "shore", D, spots, surf, x: D.x, z: D.z, name: D.name, sea: true };
  }
  function course(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    const L = cum[cum.length - 1];
    const at = (d) => {
      d = ((d % L) + L) % L;
      let i = 1;
      while (i < pts.length - 1 && cum[i] < d) i++;
      const a = pts[i - 1], b = pts[i], u = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u };
    };
    // the way ahead, smoothed over a couple of blocks so a racer turns into a bend
    const head = (d) => { const a = at(d - 1.2), b = at(d + 1.2); return Math.atan2(b.x - a.x, b.z - a.z); };
    return { pts, cum, L, at, head };
  }
  function lakeVenue(r) {
    const D = dockOf(r);
    if (!D) return null;
    const ux = D.ux, uz = D.uz, px = uz, pz = -ux;
    const wet = (x, z) => !App.isLand(x, z) && App.lakeSd(x, z) < -2.5;
    const segWet = (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z)); for (let k = 0; k <= n; k++) if (!wet(a.x + ((b.x - a.x) * k) / n, a.z + ((b.z - a.z) * k) / n)) return false; return true; };
    for (const sgn of [1, -1]) for (const k of [1, 0.8, 0.65]) {
      const at = (f, s) => ({ x: D.berth.x + ux * f * k + px * sgn * s * k, z: D.berth.z + uz * f * k + pz * sgn * s * k });
      const S = at(9, 16), M1 = at(44, 30), M2 = at(44, 4);
      if (![S, M1, M2].every((p) => wet(p.x, p.z)) || !segWet(S, M1) || !segWet(M1, M2) || !segWet(M2, S)) continue;
      const moor = bankLine(D, sgn, 8, 3.4);
      if (moor.length < 4) continue;
      return { type: "lake", D, sgn, S, marks: [M1, M2], course: course([S, M1, M2, S]), moor, x: S.x, z: S.z, name: D.name };
    }
    return null;
  }
  function trackVenue(r) {
    const v = hostOf(r);
    if (!v) return null;
    const cands = [];
    for (let k = 0; k < 12; k++) for (const d of [(v.r || 30) + 24, (v.r || 30) + 40]) cands.push({ x: v.x + Math.cos(k * 0.5236) * d, z: v.z + Math.sin(k * 0.5236) * d });
    for (const p of App.poisNear(v.x, v.z, 220, (p) => p.region === r && /meadow|camp|grove|beach/.test(p.type))) cands.push({ x: p.x, z: p.z });
    cands.sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z));
    const colH = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z));
    for (const [A, B] of [[20, 11], [16, 9]]) for (const c of cands) for (let o = 0; o < 4; o++) {
      if (App.regionOf(c.x, c.z) !== r) continue;
      const th = o * 0.785, N = 28, pts = [];
      let ok = true;
      for (let k = 0; k < N && ok; k++) {
        const a = (k / N) * 6.2832, lx = Math.cos(a) * A, lz = Math.sin(a) * B;
        const x = c.x + lx * Math.cos(th) - lz * Math.sin(th), z = c.z + lx * Math.sin(th) + lz * Math.cos(th);
        if (!App.isLand(x, z) || App.pondWater(x, z) || !clearAt(x, z, 2.9)) ok = false;
        pts.push({ x, z });
      }
      if (!ok) continue;
      pts.push(pts[0]);
      // solid ground all the way round, and no step higher than one block
      for (let i = 1; i < pts.length && ok; i++) {
        const a = pts[i - 1], b = pts[i], n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 2);
        let ph = colH(a.x, a.z);
        for (let k = 1; k <= n && ok; k++) { const x = lerp(a.x, b.x, k / n), z = lerp(a.z, b.z, k / n), h = colH(x, z); if (h < App.SEA || Math.abs(h - ph) > 1) ok = false; ph = h; }
      }
      if (!ok) continue;
      return { type: "track", course: course(pts), cx: c.x, cz: c.z, A, B, th, x: c.x, z: c.z, village: v, name: "the circuit by " + v.name };
    }
    return null;
  }
  const venueOf = (c) => venue(c.region, KINDS[c.kind].venue);

  // ---------- each contest's layout: where everyone stands, and the props ----------
  const W = 2.6; // half the width of the circuit
  function lay(c) {
    if (c._lay) return c._lay;
    const V = venueOf(c), K = KINDS[c.kind], Y = { props: [], crowd: [], judges: [], wait: [], start: [] };
    const n = c.entrants.length;
    if (V.type === "square") {
      const L = V.L, rot = V.rot, back = rot + Math.PI;
      Y.look = rot + Math.PI; Y.rot = rot; Y.L = L;
      const y0 = App.surfaceAt(V.x, V.z).y;
      Y.baseY = y0;
      if (c.kind === "music") {
        Y.props.push({ k: "stage", p: L(0, -1.5), rot });
        Y.perf = L(0, -1.6); Y.perfY = 70 * KU; Y.stair = L(0, 0.6);
        for (let i = 0; i < n; i++) Y.wait.push(L((i % 2 ? 1 : -1) * 4.4, -2.6 + Math.floor(i / 2) * 1.3));
      } else if (c.kind === "fashion") {
        Y.props.push({ k: "catwalk", p: L(0, 0), rot });
        Y.door = L(0, -3.85); Y.front = L(0, 3.35); Y.perfY = 64 * KU;
        for (let i = 0; i < n; i++) Y.wait.push(L(-1.7 + (i % 3) * 1.7, -5.3 - Math.floor(i / 3) * 1.1));
      } else {
        Y.props.push({ k: "liftplatform", p: L(0, 0), rot });
        Y.perf = L(0, -0.2); Y.perfY = 25 * KU; Y.bar = L(0, 0.55);
        for (let i = 0; i < n; i++) Y.wait.push(L((i % 2 ? 1 : -1) * 4.8, -2.4 + Math.floor(i / 2) * 1.3));
      }
      const jy = c.kind === "fashion" ? 6.2 : 5;
      Y.props.push({ k: "judgetable", p: L(0, jy), rot: back });
      for (let j = 0; j < 3; j++) Y.judges.push(Object.assign(L(-1.3 + j * 1.3, jy + 1), { face: back }));
      for (let j = 0; j < 24; j++) Y.crowd.push(L(-5.5 + (j % 6) * 2.2 + (Math.floor(j / 6) % 2) * 1.1, jy + 2.8 + Math.floor(j / 6) * 1.5));
      if (c.kind === "fashion") for (let j = 0; j < 8; j++) Y.crowd.push(L((j % 2 ? 1 : -1) * 3, -1.8 + Math.floor(j / 2) * 1.5));
      Y.focus = c.kind === "fashion" ? L(0, 0.5) : L(0, -0.5);
      Y.podium = Object.assign(L(-8, 2.5), { rot });
    } else if (V.type === "shore" || V.type === "lake") {
      const D = V.D, ux = D.ux, uz = D.uz, face = Math.atan2(ux, uz);
      const line = V.type === "lake" ? V.moor : c.kind === "surf" ? V.surf : V.spots;
      Y.line = line;
      line.forEach((s, i) => { if (i < n) Y.start.push(s); });
      const mid = line[Math.floor(line.length / 2)], inland = (p, k, side) => ({ x: p.x - ux * k + uz * (side || 0), z: p.z - uz * k - ux * (side || 0) });
      for (let j = 0; j < 20; j++) { const s = line[j % line.length]; Y.crowd.push(inland(s, 3.4 + Math.floor(j / line.length) * 1.5, ((j * 7) % 5 - 2) * 0.35)); }
      Y.look = face; Y.focus = { x: mid.wx, z: mid.wz };
      const pod = inland(D.land, 13);
      Y.podium = Object.assign(pod, { rot: face });
      Y.props.push({ k: "startarch", p: inland(D.land, 2.2), rot: face });
      if (c.kind === "surf") {
        const jt = inland(mid, 5.5);
        Y.props.push({ k: "judgetable", p: jt, rot: face });
        for (let j = 0; j < 3; j++) { const q = inland(mid, 6.6, -1.3 + j * 1.3); Y.judges.push(Object.assign(q, { face })); }
      }
      if (V.type === "lake") {
        const C = V.course, h0 = C.head(0.5), nx = Math.cos(h0), nz = -Math.sin(h0);
        Y.course = C; Y.laps = C.L > 140 ? 1 : 2; Y.total = Y.laps * C.L;
        Y.slots = [];
        for (let i = 0; i < n; i++) { const lane = (i - (n - 1) / 2) * 1.9; Y.slots.push({ x: V.S.x + nx * lane - Math.sin(h0) * 1.5, z: V.S.z + nz * lane - Math.cos(h0) * 1.5, lane }); }
        V.marks.forEach((m, i) => Y.props.push({ k: "buoy", v: i % 2, p: m, rot: 0, water: true }));
        Y.props.push({ k: "buoy", v: 1, p: { x: V.S.x + nx * 7, z: V.S.z + nz * 7 }, rot: 0, water: true }, { k: "buoy", v: 1, p: { x: V.S.x - nx * 7, z: V.S.z - nz * 7 }, rot: 0, water: true });
        Y.focus = V.S;
      }
    } else if (V.type === "track") {
      const C = V.course, h0 = C.head(0), nx = Math.cos(h0), nz = -Math.sin(h0), p0 = C.at(0);
      Y.course = C;
      Y.laps = c.kind === "kart" ? Math.max(2, Math.round(380 / C.L)) : Math.max(1, Math.round(200 / C.L));
      Y.total = Y.laps * C.L;
      const lanes = c.kind === "kart" ? [-1.2, 1.2] : [-1.8, -0.6, 0.6, 1.8];
      Y.lanes = lanes;
      Y.slots = [];
      for (let i = 0; i < n; i++) { const g = -(1.4 + Math.floor(i / lanes.length) * (c.kind === "kart" ? 3.4 : 1.6)), lane = lanes[i % lanes.length], q = C.at(g), h = C.head(g); Y.slots.push({ x: q.x + Math.cos(h) * lane, z: q.z - Math.sin(h) * lane, g, lane }); }
      Y.start = Y.slots;
      // the cones down both sides, the arch over the line
      for (let d = 2; d < C.L - 1; d += 4) { const q = C.at(d), h = C.head(d); for (const sd of [-1, 1]) Y.props.push({ k: "trackcone", p: { x: q.x + Math.cos(h) * sd * (W + 0.5), z: q.z - Math.sin(h) * sd * (W + 0.5) }, rot: h }); }
      Y.props.push({ k: "startarch", p: p0, rot: h0 });
      // the crowd on the outside of the bend at the start (the side away from the middle of the circuit)
      const out = Math.hypot(p0.x + nx - V.cx, p0.z + nz - V.cz) > Math.hypot(p0.x - nx - V.cx, p0.z - nz - V.cz) ? 1 : -1;
      for (let j = 0; j < 20; j++) { const d = -7 + (j % 10) * 1.6, q = C.at(d), h = C.head(d), off = out * (W + 2 + Math.floor(j / 10) * 1.4); Y.crowd.push({ x: q.x + Math.cos(h) * off, z: q.z - Math.sin(h) * off }); }
      Y.look = h0 + out * Math.PI / 2 + Math.PI;
      const pd = C.at(5), off = out * (W + 7.5);
      Y.podium = { x: pd.x + Math.cos(h0) * off, z: pd.z - Math.sin(h0) * off, rot: Math.atan2(-out * Math.cos(h0), out * Math.sin(h0)) };
      Y.focus = p0;
    }
    // the crowd at the podium afterwards
    const pr = Y.podium.rot, PL = frame(Y.podium.x, Y.podium.z, pr);
    Y.podTop = [PL(0, 0), PL(-240 * KU, 0), PL(240 * KU, 0)];
    Y.podH = [208 * KU, 148 * KU, 98 * KU];
    Y.podCrowd = [];
    for (let j = 0; j < 30; j++) Y.podCrowd.push(PL(-4.5 + (j % 7) * 1.5 + (Math.floor(j / 7) % 2) * 0.75, 3 + Math.floor(j / 7) * 1.4));
    Y.props.push({ k: "podium", p: Y.podium, rot: pr, late: true });
    return (c._lay = Y);
  }

  // ---------- planning the day ----------
  const FREE = new Set(["job", "lunch", "chore", "leisure", "evening", "morning", "sleep", "guildhall", "ether"]);
  function busy(id, day, s, e) {
    if (App.isKO(id) || (App.isDead && App.isDead(id)) || (App.boatmanLine && App.boatmanLine(id))) return true;
    for (const x of App.planOf(id, day).steps) if (x.e > s && x.s < e && !FREE.has(x.k)) return true;
    return false;
  }
  function kindsFor(day) {
    const used = new Set(), out = [];
    for (let r = 0; r < App.regions.length; r++) {
      let pick = null;
      for (let j = 0; j < ORDER.length && !pick; j++) {
        const k = ORDER[(day + r * 3 + j) % ORDER.length];
        if (!used.has(k) && venue(r, KINDS[k].venue)) pick = k;
      }
      if (pick) { used.add(pick); out.push([r, pick]); }
    }
    return out;
  }
  const endOf = (c) => { const K = KINDS[c.kind]; return K.turn ? c.go + c.entrants.length * K.turn : c.end; };
  function planDay(day) {
    for (const [r, kind] of kindsFor(day)) {
      const key = day + ":" + r;
      if (st.contests[key]) continue;
      const K = KINDS[kind], V = venue(r, K.venue), d0 = day * DAY;
      const c = { key, day, region: r, kind, entrants: [], spectators: [], judges: [], gather: d0 + K.gather, go: d0 + K.go, done: false };
      const s0 = K.gather - 70, e0 = (K.cap || K.end || K.go + K.n * K.turn) + CER;
      const pool = [];
      for (const v of App.villages) if (v.region === r && Math.hypot(v.x - V.x, v.z - V.z) < 300) for (const id of v.residents) if (!(App.isMine && App.isMine(id))) pool.push([id, SKILL[kind](id) + hash2(id, day, 403) * 4]);
      pool.sort((a, b) => b[1] - a[1]);
      let tried = 0;
      for (const [id] of pool) { if (c.entrants.length >= K.n || tried++ > 80) break; if (!busy(id, day, s0, e0)) c.entrants.push(id); }
      if (c.entrants.length < 3) continue;
      // the judges (from the host town) and some of the neighbours to watch
      const near = App.villages.filter((v) => v.region === r).sort((a, b) => Math.hypot(a.x - V.x, a.z - V.z) - Math.hypot(b.x - V.x, b.z - V.z)).slice(0, 3);
      const taken = new Set(c.entrants), cands = [];
      for (const v of near) for (const id of v.residents) if (!taken.has(id) && !(App.isMine && App.isMine(id))) cands.push(id);
      cands.sort((a, b) => hash2(a, day, 407) - hash2(b, day, 407));
      for (const id of cands) {
        if (c.judges.length >= (K.judges ? 3 : 0) && c.spectators.length >= 14) break;
        if (busy(id, day, s0, e0)) continue;
        if (K.judges && c.judges.length < 3) c.judges.push(id); else if (c.spectators.length < 14) c.spectators.push(id);
      }
      settle(c);
      st.contests[key] = c;
    }
    for (const k in st.contests) if (st.contests[k].day < day - 1) delete st.contests[k];
    reindex();
    for (const k in st.contests) { const c = st.contests[k]; if (c.day === day) touch(c); }
  }
  // everyone in it thinks again about today
  function touch(c) {
    for (const id of c.entrants.concat(c.spectators, c.judges)) {
      App.invalidatePlan(id);
      const t = P.agent[id];
      if (t && t.action && !t.action.order && t.action.kind !== "ko" && t.action.kind !== "contest") App.endAction(t);
    }
  }

  // ---------- the results, worked out in advance (so the contest is the same whether you watch or not) ----------
  const prog = (R, tau) => (tau <= 0 ? 0 : R.v * tau + R.a * (Math.sin(R.f * tau + R.p) - Math.sin(R.p)));
  function newOutfit(id, day) {
    const r = rng(id, day * 7 + 5), idx = TB.repoIndex(), tr = TB.pickTraits(TB.seedOf(id)), out = {};
    const slots = CLOTHES.slice();
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    for (const s of slots.slice(0, 1 + Math.floor(r() * 3))) {
      const list = idx[s];
      let m = list[Math.floor(r() * list.length)];
      if (m === tr.sel[s] && list.length > 1) m = list[(list.indexOf(m) + 1) % list.length];
      out[s] = [m, r() < 0.85 ? Math.floor(r() * TB.THEMES.length) : null];
    }
    return out;
  }
  function settle(c) {
    const K = KINDS[c.kind], d = c.day, sk = (id) => SKILL[c.kind](id);
    c._lay = null;
    if (c.kind === "fishing") {
      const dur = K.end - K.go;
      c.catches = {};
      for (const id of c.entrants) {
        const r = rng(id, d * 7 + 1), gap = Math.max(5, 15 - sk(id) * 0.9), list = [];
        for (let tau = 2 + r() * 8; tau < dur; tau += gap * (0.5 + r())) { const big = r() < 0.05; list.push([+tau.toFixed(1), +(big ? 3 + r() * 4 : 0.3 + r() * 1.3 + sk(id) * 0.07).toFixed(1)]); }
        c.catches[id] = list;
      }
      c.end = c.go + dur;
      c.res = c.entrants.map((id) => ({ id, s: +c.catches[id].reduce((a, x) => a + x[1], 0).toFixed(1) }));
    } else if (c.kind === "surf") {
      const dur = K.end - K.go, PER = 10.5;
      c.rides = {};
      for (const id of c.entrants) {
        const r = rng(id, d * 7 + 2), off = 1.5 + r() * 4, list = [];
        for (let tau = off + PER; tau < dur; tau += PER) list.push([+tau.toFixed(2), +Math.max(0.5, Math.min(9.9, 1.2 + sk(id) * 0.55 + (r() - 0.5) * 4)).toFixed(1)]);
        c.rides[id] = { off, per: PER, list };
      }
      c.end = c.go + dur;
      c.res = c.entrants.map((id) => ({ id, s: best2(c.rides[id].list.map((x) => x[1])) }));
    } else if (K.race) {
      const Y = lay(c), base = { run: [4.6, 2.2, 0.18], kart: [15, 5, 0.2], regatta: [5.6, 2.6, 0.15] }[c.kind];
      c.racers = c.entrants.map((id, i) => { const r = rng(id, d * 7 + 3), s = sk(id); return { v: base[0] * (0.84 + Math.min(10, s) * 0.03 + r() * 0.08), a: base[1] * (0.6 + r() * 0.8), f: base[2] * (0.7 + r() * 0.6), p: r() * 6.28, g: Y.slots[i].g || 0 }; });
      const cap = K.cap - K.go;
      for (const R of c.racers) {
        const need = Y.total - R.g;
        if (prog(R, cap) < need) { R.fin = null; R.dnf = prog(R, cap); continue; }
        let lo = 0, hi = cap;
        for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (prog(R, mid) >= need) hi = mid; else lo = mid; }
        R.fin = +hi.toFixed(3);
      }
      const last = Math.max(...c.racers.map((R) => (R.fin == null ? cap : R.fin)));
      c.end = c.go + Math.min(cap, last) + 2;
      c.res = c.entrants.map((id, i) => ({ id, s: c.racers[i].fin, d: c.racers[i].fin == null ? c.racers[i].dnf : null }));
    } else {
      c.scores = {};
      for (const id of c.entrants) {
        const r = rng(id, d * 7 + 4), s = sk(id);
        c.scores[id] = c.kind === "strong" ? [Math.round((18 + s * 4.5 + r() * 14) / 2.5) * 2.5] : [0, 1, 2].map(() => Math.max(1, Math.min(10, Math.round(2 + s * 0.5 + (r() - 0.5) * 5))));
      }
      if (c.kind === "music") { c.songs = {}; for (const id of c.entrants) c.songs[id] = SONGS[Math.floor(hash2(id, d, 409) * SONGS.length)]; }
      if (c.kind === "fashion") { c.outfits = {}; for (const id of c.entrants) c.outfits[id] = newOutfit(id, d); }
      c.end = endOf(c);
      c.res = c.entrants.map((id) => ({ id, s: c.scores[id].reduce((a, b) => a + b, 0) }));
    }
    const lowWins = !!K.race;
    c.res.sort((a, b) => {
      if (lowWins) { if (a.s == null && b.s == null) return b.d - a.d; if (a.s == null) return 1; if (b.s == null) return -1; return a.s - b.s; }
      // a tie on points goes to the one with the best single mark
      const top = (x) => (c.scores && c.scores[x.id] ? Math.max(...c.scores[x.id]) : 0);
      return b.s - a.s || top(b) - top(a) || hash2(a.id, d, 411) - hash2(b.id, d, 411);
    });
  }
  function best2(list) { const s = list.slice().sort((a, b) => b - a); return +((s[0] || 0) + (s[1] || 0)).toFixed(1); }

  // ---------- the plan hook (population.js): where a contestant, a judge or a spectator is today ----------
  let idx = new Map(), idxDay = -1;
  function reindex() {
    idx = new Map();
    const day = today();
    for (const k in st.contests) {
      const c = st.contests[k];
      if (c.day !== day) continue;
      c.entrants.forEach((id, i) => idx.set(id, { c, role: "in", i }));
      c.judges.forEach((id, i) => { if (!idx.has(id)) idx.set(id, { c, role: "judge", i }); });
      c.spectators.forEach((id, i) => { if (!idx.has(id)) idx.set(id, { c, role: "watch", i }); });
    }
    idxDay = day;
  }
  function spotOf(c, role, i) {
    const Y = lay(c);
    if (role === "judge") return Y.judges[i % Math.max(1, Y.judges.length)] || Y.crowd[0];
    if (role === "watch") return Y.crowd[i % Y.crowd.length];
    if (KINDS[c.kind].venue === "square") return Y.wait[i];
    return Y.start[i] || Y.crowd[0];
  }
  App.contestStep = (id, day) => {
    if (!st.contests || day !== today()) return null;
    if (idxDay !== day) reindex();
    const r = idx.get(id);
    if (!r) return null;
    const c = r.c, K = KINDS[c.kind], V = venueOf(c), d0 = day * DAY;
    if (!V) return null;
    const v = App.villageOfToken(id), walk = Math.min(240, (Math.hypot(v.x - V.x, v.z - V.z) * 1.25) / App.WALK_SPEED);
    const sp = spotOf(c, r.role, r.i);
    return { k: r.role === "in" ? "contest" : "contestWatch", s: Math.max(0, c.gather - d0 - walk - 8), e: Math.min(1438, c.end - d0 + CER),
      p: { x: sp.x, z: sp.z, label: K.name + " at " + V.name + (r.role === "in" ? " (competing)" : r.role === "judge" ? " (judging)" : " (watching)"), contest: c.key, role: r.role, i: r.i, cx: V.x, cz: V.z } };
  };
  App.contestOf = (id) => { if (idxDay !== today()) reindex(); const r = idx.get(id); return r ? { c: r.c, role: r.role } : null; };

  // ---------- the brain (sim.js): what a contestant, a judge or a spectator does now ----------
  const ACT = (id, name, verb, needs, anim) => ({ id, name, verb, needs, capacity: 99, minutes: 6, where: "self", source: "core", status: "core", anim });
  const WAITA = ACT("contest_wait", "Waiting for the start", "is waiting for the start", { fun: 4 });
  const WATCHA = ACT("contest_watch", "Watching a contest", "is watching the contest", { fun: 16, social: 8 }, "sitWatch");
  const JUDGEA = ACT("contest_judge", "Judging", "is judging the contest", { fun: 8, social: 4 });
  const CHEERA = ACT("contest_cheer", "At the podium", "is cheering the winners", { fun: 10, social: 8 });
  const FISHA = Object.assign(ACT("contest_fish", "Fishing Derby", "is fishing in the derby", { fun: 10 }), { minutes: 90 });
  const SURFA = Object.assign(ACT("contest_surf", "Surf Contest", "is surfing in the contest", { fun: 20, energy: -8 }), { minutes: 60 });
  const far = (t, q, r) => Math.hypot(q.x - t.pos.x, q.z - t.pos.z) > r;
  const angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  App.contestBrain = (t, step) => {
    const p = step.p, c = st.contests && st.contests[p.contest];
    if (!c || !venueOf(c)) return false;
    const K = KINDS[c.kind], Y = lay(c), T = st.T;
    const go = (q, why) => { App.startTravel(t, { x: q.x, z: q.z, label: why }, why); return true; };
    const stay = (q, look, act, until) => { App.startDo(t, { act: act || WAITA, ref: "contest" + t.id, spot: { x: q.x, z: q.z }, exact: true, face: look }, false, until || T + 5); return true; };
    // afterwards: the top three climb the podium, everyone else gathers round it
    if (T >= c.end) {
      const rank = c.res.findIndex((x) => x.id === t.id);
      if (p.role === "in" && rank >= 0 && rank < 3) { t.action = { kind: "contest", c: c.key, podium: rank, fixed: true, started: T }; return true; }
      const q = Y.podCrowd[(p.i + (p.role === "in" ? 0 : p.role === "judge" ? 12 : 15)) % Y.podCrowd.length];
      if (far(t, q, 2)) return go(q, "to the podium");
      return stay(q, { x: Y.podium.x, z: Y.podium.z }, CHEERA, T + 4);
    }
    const focus = Y.focus;
    if (p.role === "watch") { const q = Y.crowd[p.i % Y.crowd.length]; if (far(t, q, 1.6)) return go(q, "to watch the " + K.name); return stay(q, focus, WATCHA, T + 6); }
    if (p.role === "judge") { const q = Y.judges[p.i] || Y.crowd[0]; if (far(t, q, 1)) return go(q, "to judge the " + K.name); return stay(q, focus, JUDGEA, T + 4); }
    const i = p.i;
    if (c.kind === "fishing") {
      const q = Y.start[i];
      if (far(t, q, 1)) return go(q, "to the " + K.name);
      if (T < c.go) return stay(q, q.face, WAITA, c.go);
      App.startDo(t, { act: FISHA, ref: "contest" + t.id, spot: { x: q.x, z: q.z }, exact: true, ownItem: true, itemName: "Fishing Rod", face: q.face }, false, c.end);
      return true;
    }
    if (c.kind === "surf") {
      const q = Y.start[i];
      if (T < c.go) { if (far(t, q, 1)) return go(q, "to the " + K.name); return stay(q, q.face, WAITA, c.go); }
      App.startDo(t, { act: SURFA, ref: "contest" + t.id, spot: { x: q.wx, z: q.wz, lx: q.x, lz: q.z }, exact: true, water: true, ownItem: true, itemName: "Surfs Up", face: q.face }, false, c.end);
      return true;
    }
    if (K.race) {
      const q = c.kind === "regatta" ? Y.start[i] : Y.slots[i];
      const R = c.racers[i];
      // the race is over for this one: watch the rest come in
      if (R && R.fin != null && T > c.go + R.fin + (c.kind === "regatta" ? 9 : 3)) { const w = Y.crowd[(i * 3) % Y.crowd.length]; if (far(t, w, 1.6)) return go(w, "to watch the finish"); return stay(w, focus, WATCHA, T + 4); }
      if (T < c.go - 14 && far(t, q, 1.2)) return go(q, "to the start of the " + K.name);
      if (far(t, q, 1.2) && T < c.go) return go(q, "to the start of the " + K.name);
      t.action = { kind: "contest", c: c.key, race: true, i, fixed: true, started: T };
      return true;
    }
    // a show: wait for its turn beside the stage (or backstage), then go on
    const q = Y.wait[i], t0 = c.go + i * K.turn;
    if (T >= t0 && T < t0 + K.turn) { t.action = { kind: "contest", c: c.key, perform: true, i, fixed: true, started: T }; return true; }
    if (far(t, q, 1)) return go(q, "to the " + K.name);
    return stay(q, Y.focus, WAITA, T < t0 ? Math.min(t0, T + 4) : T + 4);
  };

  // ---------- on the course, on stage, on the podium (called every frame for an agent with a contest action) ----------
  App.stepContest = (t, a, dm, dtReal) => {
    const c = st.contests && st.contests[a.c];
    if (!c || App.isKO(t.id)) { dropVehicle(t); t.action = null; return; }
    try {
      if (a.race) return stepRace(t, a, c, dtReal);
      if (a.perform) return stepPerform(t, a, c, dtReal);
      if (a.podium != null) return stepPodium(t, a, c, dtReal);
    } catch (e) { console.warn("contest step", e); dropVehicle(t); }
    t.action = null;
  };
  // a kart or a dinghy under the Tickle while it races
  function vehicle(t, kind, v) {
    if (t._veh && t._veh.kind === kind) return t._veh.obj;
    dropVehicle(t);
    const tok = (t._veh = { kind, obj: null });
    App.kitMesh(kind, v).then((g) => {
      if (t._veh !== tok || !t.group.parent) return;
      const o = new THREE.Group();
      o.add(App.centeredMesh(g.md, g.geo, true));
      o.position.z = kind === "kart" ? 0.27 : 0.95; // the seat is behind the middle
      t.group.add(o);
      tok.obj = o;
    });
    return null;
  }
  function dropVehicle(t) { if (t._veh) { if (t._veh.obj && t._veh.obj.parent) t._veh.obj.parent.remove(t._veh.obj); t._veh = null; } }
  App.dropVehicle = dropVehicle;
  const turnTo = (h, target, k) => { let d = target - h; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return h + d * Math.min(1, k); };
  function setArms(t, rx, lx, rz, lz) { const A = t.arms; if (!A) return; A.R.rotation.x = rx; A.L.rotation.x = lx; A.R.rotation.z = rz || 0; A.L.rotation.z = lz || 0; }
  // where a racer is on the course, d blocks from the line, with its lane
  function racePos(c, i, d) {
    const Y = lay(c), C = Y.course, R = c.racers[i];
    // lanes: keep your own, but swing out to pass anyone just ahead in it
    let lane = Y.slots[i].lane;
    if (c.kind !== "regatta") {
      const mine = R.g + prog(R, st.T - c.go);
      for (let j = 0; j < c.racers.length; j++) {
        if (j === i) continue;
        const o = c.racers[j], dj = o.g + prog(o, st.T - c.go), gap = dj - mine;
        if (gap > -0.8 && gap < 2.4 && Math.abs(Y.slots[j].lane - lane) < 0.9) { lane = Y.lanes.reduce((b, x) => (Math.abs(x - Y.slots[j].lane) > Math.abs(b - Y.slots[j].lane) ? x : b), lane); break; }
      }
    } else lane = lane * clamp01(1 - (d - 4) / 30) + lane * 0.25; // boats close in on the first mark
    const q = C.at(d), h = C.head(d);
    return { x: q.x + Math.cos(h) * lane, z: q.z - Math.sin(h) * lane, h };
  }
  function stepRace(t, a, c, dtReal) {
    const Y = lay(c), K = KINDS[c.kind], R = c.racers[a.i], T = st.T, tau = T - c.go, boat = c.kind === "regatta", kart = c.kind === "kart";
    if (!R) { t.action = null; return; }
    const fin = R.fin == null ? K.cap - K.go : R.fin;
    let x, z, h, moving = false;
    if (tau < 0) {
      const s = Y.slots[a.i];
      if (boat) {
        // in the dinghy at the mooring, then out to the line
        const m = Y.start[a.i], u = clamp01((T - (c.go - 12)) / 9);
        x = lerp(m.wx, s.x, u); z = lerp(m.wz, s.z, u); h = u > 0 && u < 1 ? angTo(m, s) : u <= 0 ? angTo(m, { x: m.wx, z: m.wz }) : Y.course.head(0); moving = u > 0 && u < 1;
      } else { x = s.x; z = s.z; h = Y.course.head(s.g); }
    } else if (tau < fin + (boat ? 9 : 3)) {
      if (tau <= fin) { const d = R.g + prog(R, tau), q = racePos(c, a.i, d); x = q.x; z = q.z; h = q.h; moving = true; }
      else if (boat) {
        // over the line: back to the mooring
        const e = racePos(c, a.i, Y.total), m = Y.start[a.i], u = clamp01((tau - fin) / 8);
        x = lerp(e.x, m.wx, u); z = lerp(e.z, m.wz, u); h = u < 1 ? angTo(e, { x: m.wx, z: m.wz }) : angTo(m, { x: m.wx, z: m.wz }); moving = u < 1;
      } else {
        // over the line, slowing down
        const d = Y.total - R.g * 0 + (1 - Math.pow(1 - clamp01((tau - fin) / 3), 2)) * (kart ? 9 : 4), q = racePos(c, a.i, d); x = q.x; z = q.z; h = q.h; moving = tau - fin < 2.5;
      }
    } else {
      dropVehicle(t);
      if (boat) { const m = Y.start[a.i]; t.pos.x = m.x; t.pos.z = m.z; }
      t.action = null;
      return;
    }
    t.pos.x = x; t.pos.z = z;
    t.heading = turnTo(t.heading, h, dtReal * 8);
    const now = performance.now() / 1000;
    if (kart || boat) {
      vehicle(t, kart ? "kart" : "dinghy", a.i % 6);
      App.animateTickle(t, false, dtReal);
      if (kart) {
        t.pos.y = App.surfaceAt(x, z).y + (moving ? Math.sin(now * 40 + t.id) * 0.02 : 0);
        t.pivot.position.set(0, -0.62, 0); t.pivot.rotation.set(-0.04, 0, 0);
        setArms(t, -1.25, -1.25, 0.2, -0.2); // both paws on the wheel
        if (moving && st.speed > 0 && rnd() < dtReal * 6 && App.spawnParticle) { const bx = x - Math.sin(t.heading) * 1.4, bz = z - Math.cos(t.heading) * 1.4; App.spawnParticle({ kind: "spark", x: bx, y: t.pos.y + 0.5, z: bz, vx: (rnd() - 0.5) * 0.6, vy: 0.8, vz: (rnd() - 0.5) * 0.6, age: 0, life: 0.6, color: new THREE.Color("#c8c8c8") }); }
      } else {
        const heel = moving ? 0.1 + Math.sin(now * 0.7 + t.id) * 0.05 : 0;
        t.pos.y = App.WATER_Y - 0.42 + Math.sin(now * 1.5 + t.id) * 0.05;
        t.pivot.position.set(0, -0.3, 0); t.pivot.rotation.set(0, 0, heel * 0.5);
        if (t._veh && t._veh.obj) t._veh.obj.rotation.z = heel;
        setArms(t, -0.55, -1.5, 0.25, -0.1); // a paw on the tiller, the other on the sheet
      }
      t.group.position.copy(t.pos);
      t.group.rotation.y = t.heading;
      return;
    }
    // running: legs going, arms pumping, leaning into it
    if (moving) {
      t.walk += dtReal * Math.min(3, st.speed) * 7;
      App.animateTickle(t, true, dtReal);
      t.pivot.position.y = Math.abs(Math.sin(t.walk)) * 0.3; t.pivot.rotation.x = 0.16;
      const w = Math.sin(t.walk);
      setArms(t, w * 1.1, -w * 1.1, 0.1, -0.1);
    } else {
      App.animateTickle(t, false, dtReal);
      t.pivot.rotation.x = 0.28; t.pivot.position.y = -0.12; // set, on the line
      setArms(t, 0.35, -0.6, 0, 0);
    }
  }
  // the performance of the one whose turn it is
  // the dumbbell in the right paw (the handle front to back), or put away
  function grip(t, on) {
    if (!on) { if (t._bell) { if (t._bell.parent) t._bell.parent.remove(t._bell); t._bell = null; } return; }
    if (t._bell || t._bellLoading || !t.arms) return;
    t._bellLoading = true;
    App.kitMesh("dumbbell", 0).then((g) => {
      t._bellLoading = false;
      if (t._bell || !t.arms || !(t.action && t.action.perform)) return;
      const m = new THREE.Group(), mesh = App.centeredMesh(g.md, g.geo, false);
      mesh.position.y -= 40 * KU; // the handle at the paw
      m.add(mesh);
      m.position.copy(t.arms.paw);
      m.rotation.y = Math.PI / 2;
      t.arms.R.add(m);
      t._bell = m;
    });
  }
  App.contestGrip = grip;
  function stepPerform(t, a, c, dtReal) {
    const K = KINDS[c.kind], Y = lay(c), t0 = c.go + a.i * K.turn, u = (st.T - t0) / K.turn, now = performance.now() / 1000;
    if (u < 0 || u >= 1) { t.action = null; grip(t, false); if (c._bar) c._bar.held = null; return; }
    const y0 = Y.baseY;
    const place = (p, y, h, walking) => {
      t.pos.x = p.x; t.pos.z = p.z;
      t.heading = turnTo(t.heading, h, dtReal * 8);
      App.animateTickle(t, !!walking, dtReal);
      if (y != null) { t.pos.y = y; t.group.position.copy(t.pos); }
    };
    const walkPath = (A, B, k, y, slow) => { const p = { x: lerp(A.x, B.x, k), z: lerp(A.z, B.z, k) }; place(p, y, angTo(A, B), true); if (slow) t.walk -= dtReal * Math.min(3, st.speed) * 9 * slow; };
    if (c.kind === "strong") {
      const W0 = Y.wait[a.i], S = Y.perf, kg = c.scores[t.id] ? c.scores[t.id][0] : 40, bell = c._bar || (c._bar = {});
      if (u < 0.12) { walkPath(W0, S, u / 0.12); grip(t, false); bell.held = null; return; }
      if (u >= 0.8) { walkPath(S, W0, (u - 0.8) / 0.2); grip(t, false); bell.held = null; return; }
      place(S, y0 + Y.perfY, Y.rot, false);
      // down for the dumbbell, up to the shoulder, a dip, then pressed up with one paw and held; the other paw on the hip
      let rx, rz = 0, py = 0, tilt = 0;
      if (u < 0.2) { const k = (u - 0.12) / 0.08; rx = -0.2; py = -0.4 * k; tilt = 0.35 * k; }
      else if (u < 0.34) { const k = (u - 0.2) / 0.14; rx = lerp(-0.2, -1.6, k); py = lerp(-0.4, 0, k); tilt = lerp(0.35, 0, k); }
      else if (u < 0.4) { const k = (u - 0.34) / 0.06; rx = -1.6; py = -Math.sin(k * Math.PI) * 0.15; }
      else if (u < 0.46) { const k = (u - 0.4) / 0.06; rx = lerp(-1.6, -3.0, k); rz = 0.22 * k; }
      else if (u < 0.74) { rx = -3.0 + Math.sin(now * 8) * 0.04; rz = 0.22; }
      else { const k = (u - 0.74) / 0.06; rx = lerp(-3.0, -0.2, k); rz = lerp(0.22, 0, k); py = -0.3 * Math.sin(k * Math.PI); }
      t.pivot.position.y = py; t.pivot.rotation.x = tilt; t.pivot.rotation.z = 0;
      setArms(t, rx, -0.35, rz, -0.6);
      const holding = u >= 0.18 && u < 0.79;
      grip(t, holding);
      bell.held = holding ? t : null;
      if (u >= 0.46 && !a.lifted) { a.lifted = true; App.FX && App.FX.label(App.scene, { x: t.pos.x, y: t.pos.y + 4.6, z: t.pos.z }, "Good lift! " + kg + " kg", "#ffd23f"); App.say(t, "Hnnngh!", 2); }
      return;
    }
    if (c.kind === "music") {
      const W0 = Y.wait[a.i], S = Y.perf, top = y0 + Y.perfY;
      if (u < 0.07) { const k = u / 0.07; const mid = Y.stair; if (k < 0.5) walkPath(W0, mid, k * 2); else walkPath(mid, S, (k - 0.5) * 2, lerp(y0, top, (k - 0.5) * 2)); return; }
      if (u >= 0.93) { const k = (u - 0.93) / 0.07; if (k < 0.5) walkPath(S, Y.stair, k * 2, lerp(top, y0, k * 2)); else walkPath(Y.stair, W0, (k - 0.5) * 2); return; }
      place(S, top, Y.rot, false);
      if (u < 0.86) {
        // singing: one paw holds the microphone up, the other swings to the beat; a little dance
        const b = now * 5.2 + t.id;
        t.pivot.position.y = Math.abs(Math.sin(b)) * 0.18; t.pivot.rotation.z = Math.sin(b * 0.5) * 0.12; t.pivot.rotation.x = 0;
        setArms(t, -2.35, -1.0 + Math.sin(b) * 0.9, 0.3, -0.35 - Math.max(0, Math.sin(b)) * 0.5);
        if (st.speed > 0 && rnd() < dtReal * 3 && App.spawnParticle) App.spawnParticle({ kind: "spark", x: t.pos.x + (rnd() - 0.5), y: t.pos.y + 3.2, z: t.pos.z + (rnd() - 0.5), vx: (rnd() - 0.5) * 1.2, vy: 1.2 + rnd(), vz: (rnd() - 0.5) * 1.2, age: 0, life: 1.4, color: new THREE.Color(["#ffd23f", "#ff8fc0", "#8fd3f4"][Math.floor(rnd() * 3)]) });
        if (!a.sang && u > 0.1) { a.sang = true; const T = App.MUSIC_TRACKS && App.MUSIC_TRACKS[c.songs[t.id]]; App.say(t, "\u266a " + (T ? T.title : "my song") + " \u266a", 4); }
      } else { t.pivot.rotation.x = 0.55; t.pivot.position.y = 0; t.pivot.rotation.z = 0; setArms(t, -0.2, -0.2, 0, 0); } // a bow
      return;
    }
    // the fashion show: out of the doorway, down the catwalk, a turn at the end and back
    const top = y0 + Y.perfY, D0 = Y.door, F = Y.front;
    if (!a.dressed) { a.dressed = true; wear(t.id, c); }
    if (u < 0.4) { walkPath(D0, F, u / 0.4, top, 0.45); t.pivot.rotation.z = Math.sin(t.walk) * 0.1; setArms(t, Math.sin(t.walk) * 0.35, -Math.sin(t.walk) * 0.35, 0.1, -0.1); return; }
    if (u < 0.56) {
      // the pose: a paw on the hip, a full turn
      const k = (u - 0.4) / 0.16;
      place(F, top, Y.rot + (k > 0.3 && k < 0.8 ? ((k - 0.3) / 0.5) * 6.2832 : 0), false);
      t.group.rotation.y = t.heading = Y.rot + (k > 0.3 && k < 0.8 ? ((k - 0.3) / 0.5) * 6.2832 : 0);
      t.pivot.rotation.z = -0.08; t.pivot.position.y = 0;
      setArms(t, -0.3, -0.5, 0.15, 0.9);
      return;
    }
    if (u < 0.94) { walkPath(F, D0, (u - 0.56) / 0.38, top, 0.45); t.pivot.rotation.z = Math.sin(t.walk) * 0.1; setArms(t, Math.sin(t.walk) * 0.35, -Math.sin(t.walk) * 0.35, 0.1, -0.1); return; }
    place(Y.wait[a.i], null, Y.rot, false);
  }
  function stepPodium(t, a, c, dtReal) {
    const Y = lay(c), r = a.podium;
    if (st.T >= c.end + CER) { t.action = null; return; }
    const q = Y.podTop[r];
    t.pos.x = q.x; t.pos.z = q.z;
    t.heading = turnTo(t.heading, Y.podium.rot, dtReal * 6);
    App.animateTickle(t, false, dtReal);
    t.pos.y = App.surfaceAt(Y.podium.x, Y.podium.z).y + Y.podH[r];
    t.group.position.copy(t.pos);
    const now = performance.now() / 1000;
    if (r === 0) { t.pivot.position.y = Math.abs(Math.sin(now * 4)) * 0.25; setArms(t, -2.9 + Math.sin(now * 7) * 0.12, -2.9 - Math.sin(now * 7) * 0.12, 0.3, -0.3); } // both arms up: the winner
    else setArms(t, -2.6 + Math.sin(now * 5 + r) * 0.25, -0.2, 0.2, 0); // one paw waving
  }

  // ---------- clothes ----------
  App.outfitOf = (id) => (st.outfits && st.outfits[id]) || null;
  // the model puts on its new look (for good)
  function wear(id, c) {
    const o = c.outfits && c.outfits[id];
    if (!o) return;
    const cur = Object.assign({}, st.outfits[id] || {}, o);
    if (JSON.stringify(cur) === JSON.stringify(st.outfits[id] || {})) return;
    st.outfits[id] = cur;
    App.refreshLook && App.refreshLook(id);
  }
  App.resetOutfit = (id) => { if (st.outfits && st.outfits[id]) { delete st.outfits[id]; App.refreshLook && App.refreshLook(id); } };
  const pieceName = (slot, o) => (o == null ? "nothing" : (App.MODEL_NAMES[slot + ":" + o[0]] || "?") + (o[1] != null ? " (" + TB.THEME_NAMES[o[1]] + ")" : ""));
  // "the Surfs Up shirt (Orange)", "the Beads necklace", "Punk" (on the head)
  const NOUN = { shirt: "shirt", glasses: "glasses", neck: "necklace", headtop: "" };
  const pieceText = (slot, o) => { if (o == null) return "no " + (NOUN[slot] || "hat"); const n = App.MODEL_NAMES[slot + ":" + o[0]] || "?", w = NOUN[slot]; return n + (w && !n.toLowerCase().includes(w) ? " " + w : "") + (o[1] != null ? " in " + TB.THEME_NAMES[o[1]] : ""); };
  App.outfitText = (id) => { const o = App.outfitOf(id); if (!o) return ""; return Object.keys(o).map((s) => TB.SLOT_LABEL[s] + ": " + pieceName(s, o[s])).join(", "); };
  // the winning look catches on: every morning a few in the region copy one piece of it
  function spreadTrends(day) {
    for (const r in st.trends || {}) {
      const tr = st.trends[r];
      if (day - tr.day > 6) { delete st.trends[r]; continue; }
      const keys = Object.keys(tr.outfit);
      if (!keys.length) continue;
      let n = 0;
      for (const v of App.villages) if (v.region === +r) for (const id of v.residents) {
        if (id === tr.id || (App.isMine && App.isMine(id)) || hash2(id, day, 413) > 0.012) continue;
        const s = keys[Math.floor(hash2(id, day, 415) * keys.length)];
        const cur = st.outfits[id] || {};
        if (JSON.stringify(cur[s]) === JSON.stringify(tr.outfit[s])) continue;
        st.outfits[id] = Object.assign({}, cur, { [s]: tr.outfit[s] });
        if (P.agent[id] && App.refreshLook) App.refreshLook(id);
        n++;
      }
      if (n) App.log("contest", n + " Tickles of " + App.regions[r].name + " are copying the look of " + nm(tr.id) + ", the winner of its Fashion Show.", "The look: " + keys.map((k) => pieceText(k, tr.outfit[k])).join(", ") + ".", { who: [tr.id] });
    }
  }

  // ---------- the clock (sim.js): planning, what happens live, the results ----------
  const nearCam = (V, r) => Math.hypot(V.x - App.cam.target.x, V.z - App.cam.target.z) < (r || 140);
  const fx = (p, text, col, big) => App.FX && (big ? App.FX.label : App.FX.number)(App.scene, p, text, col);
  App.contestTick = () => {
    if (!st.contests) return;
    const day = today(), m = st.T - day * DAY;
    if (m >= 6 * 60 && st.contestDay !== day) { st.contestDay = day; try { planDay(day); } catch (e) { console.warn("contest plan", e); } }
    if (m >= 7 * 60 && st.trendDay !== day) { st.trendDay = day; spreadTrends(day); }
    if (idxDay !== day) reindex();
    for (const k in st.contests) {
      const c = st.contests[k];
      if (c.done) continue;
      if (c.day < day && !c.done) { finish(c, false); continue; }
      const V = venueOf(c);
      if (!V) { c.done = true; continue; }
      const T = st.T, lt = c._lt == null ? T : c._lt, live = nearCam(V);
      c._lt = T;
      if (live && T >= c.gather - 10) c.live = true;
      // the models change backstage as the show begins
      if (c.kind === "fashion" && lt < c.go && T >= c.go) for (const id of c.entrants) if (P.agent[id]) wear(id, c);
      if (lt < c.go && T >= c.go && live) {
        App.log("contest", "The " + KINDS[c.kind].name + " of " + App.regions[c.region].name + " has begun at " + V.name + ".", c.entrants.length + " " + KINDS[c.kind].who + ": " + c.entrants.slice(0, 4).map(nm).join(", ") + (c.entrants.length > 4 ? "\u2026" : "") + ". " + KINDS[c.kind].what[0].toUpperCase() + KINDS[c.kind].what.slice(1) + ".", { who: c.entrants.slice(0, 6) });
        const Y = lay(c);
        fx({ x: Y.focus.x, y: App.surfaceAt(Y.focus.x, Y.focus.z).y + 5, z: Y.focus.z }, KINDS[c.kind].race ? "GO!" : "Let the show begin!", "#ffd23f", true);
        App.sfx && App.sfx.cheer && App.sfx.cheer();
      }
      if (live && T >= c.go) liveEvents(c, lt, T);
      if (T >= c.end) finish(c, live);
    }
  };
  // what you see happen as it happens: catches, scores, finishes
  function liveEvents(c, lt, T) {
    const tau0 = lt - c.go, tau1 = T - c.go, head = (t) => ({ x: t.pos.x, y: t.pos.y + (t.height || 3) + 0.8, z: t.pos.z });
    if (c.kind === "fishing") for (const id of c.entrants) {
      const t = P.agent[id];
      if (!t) continue;
      for (const [tau, kg] of c.catches[id]) if (tau > tau0 && tau <= tau1) { fx(head(t), (kg >= 3 ? "Whopper! " : "") + kg + " kg", kg >= 3 ? "#ffd23f" : "#ffffff", kg >= 3); App.say(t, kg >= 3 ? "A monster!" : "Got one!", 2); }
    }
    if (c.kind === "surf") for (const id of c.entrants) {
      const t = P.agent[id];
      if (!t) continue;
      for (const [tau, s] of c.rides[id].list) if (tau > tau0 && tau <= tau1) { fx(head(t), String(s), s >= 7 ? "#ffd23f" : "#ffffff"); judgesSay(c, s.toFixed(1)); }
    }
    if (KINDS[c.kind].race) c.racers.forEach((R, i) => {
      if (R.fin == null || !(R.fin > tau0 && R.fin <= tau1)) return;
      const t = P.agent[c.entrants[i]], place = c.res.findIndex((x) => x.id === c.entrants[i]) + 1;
      if (t) { fx(head(t), place === 1 ? "WINNER!" : ordinal(place), place === 1 ? "#ffd23f" : "#ffffff", place === 1); App.say(t, place === 1 ? "Yes! First!" : place <= 3 ? "On the podium!" : "Made it!", 3); }
    });
    if (KINDS[c.kind].turn) {
      const K = KINDS[c.kind], at = c.kind === "strong" ? 0.5 : c.kind === "music" ? 0.89 : 0.6;
      c.entrants.forEach((id, i) => {
        const tau = (i + at) * K.turn;
        if (!(tau > tau0 && tau <= tau1)) return;
        if (c.kind === "strong") judgesSay(c, "Good lift!");
        else c.judges.forEach((j, k) => { const t = P.agent[j]; if (t) { fx(head(t), String(c.scores[id][k]), "#ffd23f"); App.say(t, c.scores[id][k] + "!", 2); } });
      });
    }
  }
  function judgesSay(c, text) { for (const j of c.judges) { const t = P.agent[j]; if (t) App.say(t, text, 1.5); } }
  const ordinal = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
  function scoreText(c, r) {
    if (!r) return "";
    const K = KINDS[c.kind];
    if (K.race) return r.s == null ? "did not finish" : clockTime(r.s);
    return r.s + " " + (K.unit || "points");
  }
  const clockTime = (min) => { const s = Math.round(min * 60); return Math.floor(s / 60) + "m " + (s % 60 < 10 ? "0" : "") + (s % 60) + "s"; };
  // prizes, medals and what the winner's victory changes
  function finish(c, live) {
    if (c.done) return;
    c.done = true;
    const K = KINDS[c.kind], R = App.regions[c.region], top = c.res.slice(0, 3);
    top.forEach((r, k) => {
      if (k > 0 && r.s == null && K.race) return;
      App.pay(r.id, PRIZE[k]); App.giveXP && App.giveXP(r.id, XPS[k]);
      const w = (st.contestWins[r.id] = st.contestWins[r.id] || [0, 0, 0]); w[k]++;
    });
    for (const id of c.entrants) if (!top.some((r) => r.id === id) && App.giveXP) App.giveXP(id, 5);
    const win = top[0];
    let extra = "";
    if (c.kind === "fishing") {
      // the catch goes to the granaries
      let tot = 0;
      for (const id of c.entrants) { const kg = c.catches[id].reduce((a, x) => a + x[1], 0); tot += kg; const v = App.villageOfToken(id); v.food += kg * 0.6; }
      extra = " " + Math.round(tot) + " kg of fish went to the granaries.";
    }
    if (c.kind === "music" && win) { st.regionTune[c.region] = c.songs[win.id]; const T = App.MUSIC_TRACKS && App.MUSIC_TRACKS[c.songs[win.id]]; extra = " Its song, " + (T ? "\u201c" + T.title + "\u201d" : "its song") + ", is now the tune of every village in " + R.name + "."; }
    if (c.kind === "fashion") {
      for (const id of c.entrants) { const o = c.outfits[id]; if (o) { st.outfits[id] = Object.assign({}, st.outfits[id] || {}, o); if (P.agent[id] && !live && App.refreshLook) App.refreshLook(id); } }
      if (win) { st.trends[c.region] = { id: win.id, outfit: c.outfits[win.id], day: c.day }; extra = " Its look is the fashion of " + R.name + " now; the models keep their new clothes."; }
    }
    st.contestChamps[c.kind] = { id: win ? win.id : null, region: c.region, day: c.day, score: scoreText(c, win) };
    st.contestHist.unshift({ kind: c.kind, region: c.region, day: c.day, top: top.map((r) => [r.id, scoreText(c, r)]) });
    if (st.contestHist.length > 30) st.contestHist.length = 30;
    if (win) App.log("contest", nm(win.id) + " won the " + K.name + " of " + R.name + " (" + scoreText(c, win) + ").", (top[1] ? "Second " + nm(top[1].id) + " (" + scoreText(c, top[1]) + ")" : "") + (top[2] ? ", third " + nm(top[2].id) + " (" + scoreText(c, top[2]) + ")" : "") + ". Prizes of 40, 20 and 10 shells." + extra, { who: top.map((r) => r.id) });
    const mine = c.entrants.filter((id) => App.isMine && App.isMine(id));
    for (const id of mine) { const k = c.res.findIndex((r) => r.id === id); App.toast(nm(id) + " finished " + ordinal(k + 1) + " in the " + K.name + "!"); }
    if (live && win) { const Y = lay(c); fx({ x: Y.podium.x, y: App.surfaceAt(Y.podium.x, Y.podium.z).y + 6, z: Y.podium.z }, nm(win.id) + " wins!", "#ffd23f", true); if (App.FX) App.FX.burst(App.scene, { x: Y.podium.x, y: App.surfaceAt(Y.podium.x, Y.podium.z).y + 3, z: Y.podium.z }, "#ffd23f", 30, 0.18); App.sfx && App.sfx.cheer && App.sfx.cheer(); }
  }

  // ---------- every frame (ui.js): the props near you, the barbell, the waves, the scoreboard ----------
  const propObjs = new Map(); // contest key -> { grp, list }
  function buildProps(c) {
    const Y = lay(c), grp = new THREE.Group(), list = [];
    App.scene.add(grp);
    for (const it of Y.props) {
      const o = { it, obj: null };
      list.push(o);
      App.kitMesh(it.k, it.v || 0).then((g) => {
        const m = new THREE.Group();
        m.add(App.centeredMesh(g.md, g.geo, true));
        const y = it.water ? App.WATER_Y - 0.35 : App.surfaceAt(it.p.x, it.p.z).y;
        m.position.set(it.p.x, y, it.p.z);
        m.rotation.y = it.rot || 0;
        grp.add(m);
        o.obj = m;
      });
    }
    if (c.kind === "strong") App.kitMesh("dumbbell", 0).then((g) => { const m = new THREE.Group(); m.add(App.centeredMesh(g.md, g.geo, true)); const Y = lay(c); m.position.set(Y.bar.x, App.surfaceAt(Y.bar.x, Y.bar.z).y + Y.perfY, Y.bar.z); m.rotation.y = Y.rot + Math.PI / 2; grp.add(m); (c._bar = c._bar || {}).obj = m; });
    return { grp, list };
  }
  let hudT = 0;
  App.updateContests = (dt) => {
    if (!st.contests) return;
    const T = st.T;
    const want = new Set();
    for (const k in st.contests) {
      const c = st.contests[k], V = venueOf(c);
      if (!V || T < c.gather - 20 || T > (c.end || c.go) + CER + 2 || !nearCam(V, 220)) continue;
      want.add(k);
      let P0 = propObjs.get(k);
      if (!P0) { P0 = buildProps(c); propObjs.set(k, P0); }
      // the podium only once it is over
      for (const o of P0.list) if (o.obj && o.it.late) o.obj.visible = T >= c.end - 3;
      // the dumbbell: on the platform, unless it is up in someone's paw
      if (c._bar && c._bar.obj) c._bar.obj.visible = !(c._bar.held && c._bar.held.action && c._bar.held.action.perform);
      // the surfers ride the judges' waves: each ride ends when its score is due
      if (c.kind === "surf" && T >= c.go) for (const id of c.entrants) { const t = P.agent[id], a = t && t.action; if (a && a.surf && !a.surf.synced && a.act && a.act.id === "contest_surf") { a.surf.t0 = c.go + c.rides[id].off; a.surf.period = c.rides[id].per; a.surf.synced = true; } }
    }
    for (const [k, o] of propObjs) if (!want.has(k)) { App.scene.remove(o.grp); propObjs.delete(k); }
    // a kart or a dinghy left on someone who is no longer racing
    for (const t of st.tickles) if (t._veh && !(t.action && t.action.kind === "contest" && t.action.race)) dropVehicle(t);
    for (const t of st.tickles) if (t._bell && !(t.action && t.action.kind === "contest" && t.action.perform)) grip(t, false);
    hudT += dt;
    if (hudT > 0.5) { hudT = 0; drawHud(); }
  };
  // the scoreboard at the top of the screen while you watch
  function standings(c) {
    const K = KINDS[c.kind], T = st.T, tau = T - c.go;
    if (c.done || T >= c.end) return c.res.map((r) => [r.id, scoreText(c, r)]);
    if (tau < 0) return c.entrants.map((id) => [id, ""]);
    if (c.kind === "fishing") return c.entrants.map((id) => [id, +c.catches[id].filter((x) => x[0] <= tau).reduce((a, x) => a + x[1], 0).toFixed(1)]).sort((a, b) => b[1] - a[1]).map(([id, s]) => [id, s + " kg"]);
    if (c.kind === "surf") return c.entrants.map((id) => [id, best2(c.rides[id].list.filter((x) => x[0] <= tau).map((x) => x[1]))]).sort((a, b) => b[1] - a[1]).map(([id, s]) => [id, s + " pts"]);
    if (K.race) {
      const Y = lay(c);
      return c.racers.map((R, i) => [c.entrants[i], R.fin != null && R.fin <= tau ? -1e6 + R.fin : -(R.g + prog(R, tau)), R]).sort((a, b) => a[1] - b[1]).map(([id, v, R]) => [id, R.fin != null && R.fin <= tau ? clockTime(R.fin) : "lap " + Math.min(Y.laps, 1 + Math.floor(Math.max(0, -v) / Y.course.L)) + "/" + Y.laps]);
    }
    const done = c.entrants.filter((id, i) => tau >= (i + (c.kind === "strong" ? 0.5 : c.kind === "music" ? 0.89 : 0.6)) * K.turn);
    return done.map((id) => [id, c.scores[id].reduce((a, b) => a + b, 0)]).sort((a, b) => b[1] - a[1]).map(([id, s]) => [id, s + " " + (K.unit || "")]).concat(c.entrants.filter((id) => !done.includes(id)).map((id) => [id, "\u2026"]));
  }
  let hudSig = "";
  function drawHud() {
    const el = document.getElementById("contestHud");
    if (!el) return;
    let c = null;
    for (const k in st.contests) { const x = st.contests[k], V = venueOf(x); if (V && st.T >= x.gather - 5 && st.T <= (x.end || x.go) + CER && nearCam(V, 75) && !App.inside) { c = x; break; } }
    if (!c) { if (!el.hidden) el.hidden = true; hudSig = ""; return; }
    const K = KINDS[c.kind], T = st.T, tau = T - c.go;
    let sub;
    if (T < c.go) sub = "Starts at " + hm(c.go - c.day * DAY) + " \u00b7 " + c.entrants.length + " " + K.who;
    else if (T < c.end) {
      if (K.turn) { const i = Math.min(c.entrants.length - 1, Math.floor(tau / K.turn)); sub = "On now: " + nm(c.entrants[i]) + (c.kind === "music" && App.MUSIC_TRACKS[c.songs[c.entrants[i]]] ? " sings \u201c" + App.MUSIC_TRACKS[c.songs[c.entrants[i]]].title + "\u201d" : ""); }
      else if (K.race) sub = "Race on \u00b7 " + lay(c).laps + " lap" + (lay(c).laps > 1 ? "s" : "");
      else sub = Math.max(0, Math.ceil(c.end - T)) + " min left";
    } else sub = "Final results";
    const rows = standings(c).slice(0, 6);
    const html = '<div class="ch-t">' + esc(K.name) + ' <span class="ch-r">' + esc(App.regions[c.region].name) + "</span></div><div class=\"ch-s\">" + esc(sub) + "</div>" +
      rows.map(([id, s], k) => '<div class="ch-row' + (App.isMine && App.isMine(id) ? " mine" : "") + '"><span>' + (k + 1) + ". " + esc(nm(id)) + "</span><span>" + esc(s) + "</span></div>").join("");
    if (html !== hudSig) { hudSig = html; el.innerHTML = html; }
    if (el.hidden) el.hidden = false;
  }
  // the song contest's music, while someone is singing near you
  App.contestTune = () => {
    if (!st.contests) return null;
    for (const k in st.contests) {
      const c = st.contests[k];
      if (c.kind !== "music" || c.done || st.T < c.go || st.T >= c.end) continue;
      const V = venueOf(c);
      if (!V || !nearCam(V, 70)) continue;
      const K = KINDS.music, i = Math.floor((st.T - c.go) / K.turn), u = (st.T - c.go) / K.turn - i;
      if (u >= 0.07 && u < 0.86 && c.entrants[i] != null) return c.songs[c.entrants[i]];
    }
    return null;
  };
  App.regionTune = (r) => (st.regionTune && st.regionTune[r]) || null;

  // ---------- entering one of your own ----------
  App.enterContest = (key, id) => {
    const c = st.contests[key];
    if (!c || c.done) return "That contest is over.";
    if (!(App.isMine && App.isMine(id))) return "You can only enter your own Tickles.";
    if (st.T > c.gather - 5) return "Entries are closed: the " + KINDS[c.kind].name + " is about to start.";
    if (c.entrants.includes(id)) return nm(id) + " is already in it.";
    if (idx.get(id) && idx.get(id).c !== c) return nm(id) + " is already down for the " + KINDS[idx.get(id).c.kind].name + " today.";
    const V = venueOf(c), v = App.villageOfToken(id), walk = (Math.hypot(v.x - V.x, v.z - V.z) * 1.25) / App.WALK_SPEED;
    if (st.T + walk > c.gather) return nm(id) + " lives too far away to get there in time.";
    if (App.isKO(id) || (App.isDead && App.isDead(id))) return nm(id) + " is in no state to compete.";
    const max = KINDS[c.kind].n + 2;
    if (c.entrants.length >= max) c.entrants.pop();
    c.entrants.push(id);
    c.spectators = c.spectators.filter((x) => x !== id); c.judges = c.judges.filter((x) => x !== id);
    settle(c);
    reindex(); touch(c);
    App.log("contest", nm(id) + " has entered the " + KINDS[c.kind].name + " of " + App.regions[c.region].name + ".", "It starts at " + hm(c.go - c.day * DAY) + " at " + V.name + ".", { who: [id] });
    return null;
  };

  // ---------- save and load ----------
  App.initContests = (saved) => {
    st.contests = {};
    for (const k in (saved && saved.contests) || {}) st.contests[k] = saved.contests[k];
    st.contestWins = (saved && saved.wins) || {};
    st.contestChamps = (saved && saved.champs) || {};
    st.contestHist = (saved && saved.hist) || [];
    st.regionTune = (saved && saved.tune) || {};
    st.outfits = (saved && saved.outfits) || {};
    st.trends = (saved && saved.trends) || {};
    st.contestDay = saved ? saved.day : undefined;
    st.trendDay = saved ? saved.trendDay : undefined;
    idxDay = -1;
  };
  App.saveContests = () => {
    const contests = {};
    for (const k in st.contests) { const c = st.contests[k], o = {}; for (const f in c) if (f[0] !== "_") o[f] = c[f]; contests[k] = o; }
    return { contests, wins: st.contestWins, champs: st.contestChamps, hist: st.contestHist, tune: st.regionTune, outfits: st.outfits, trends: st.trends, day: st.contestDay, trendDay: st.trendDay };
  };

  // ---------- the Adventure tab ----------
  App.contestsHTML = () => {
    if (!st.contests) return "";
    const day = today(), T = st.T, mineList = st.wallet && App.tokensOf ? App.tokensOf(st.wallet).slice(0, 400) : [];
    let h = '<div class="card"><h3>Contests</h3><p class="note">Besides the arenas and the dungeons, every region holds a contest every day, a different one each day: a fishing derby, a surf contest, a regatta, a foot race, a kart Grand Prix, the Strongest Tickle, a fashion show and a song contest. The best of the region compete, the neighbours watch, and the top three climb the podium (40, 20 and 10 shells). The winning song becomes the region\u2019s tune; the winning look, its fashion.' + (st.wallet ? " You can enter your own Tickles before a contest starts." : " Play as a holder to enter your own Tickles.") + '</p><div class="kv">';
    const list = Object.values(st.contests).filter((c) => c.day === day).sort((a, b) => a.go - b.go);
    if (!list.length) h += '<span class="k">Today</span><span>The contests are announced at 06:00.</span>';
    for (const c of list) {
      const K = KINDS[c.kind], V = venueOf(c);
      if (!V) continue;
      const st0 = c.done ? "Won by " + esc(nm(c.res[0].id)) + " (" + esc(scoreText(c, c.res[0])) + ")" : T >= c.go ? "On now at " + esc(V.name) : hm(c.go - day * DAY) + " at " + esc(V.name) + " \u00b7 " + c.entrants.length + " " + K.who;
      h += '<span class="k"><button class="btn" data-contest="' + c.key + '">' + esc(K.name) + '</button></span><span><b>' + esc(App.regions[c.region].name) + "</b> \u00b7 " + st0;
      if (mineList.length && !c.done && T < c.gather - 5) h += ' <select data-contest-who="' + c.key + '">' + mineList.map((id) => '<option value="' + id + '">' + esc(nm(id)) + "</option>").join("") + '</select> <button class="btn" data-contest-enter="' + c.key + '">Enter</button>';
      const mine = c.entrants.filter((id) => App.isMine && App.isMine(id));
      if (mine.length) h += ' <span class="note">(yours: ' + mine.map((id) => esc(nm(id))).join(", ") + ")</span>";
      h += "</span>";
    }
    h += "</div></div>";
    const champs = ORDER.filter((k) => st.contestChamps[k] && st.contestChamps[k].id != null);
    const medals = Object.keys(st.contestWins).map((id) => [+id, st.contestWins[id]]).sort((a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || b[1][2] - a[1][2]).slice(0, 6);
    if (champs.length || medals.length) {
      h += '<div class="card"><h3>Champions</h3><div class="kv">';
      for (const k of champs) { const ch = st.contestChamps[k]; h += '<span class="k">' + esc(KINDS[k].name) + "</span><span>" + esc(nm(ch.id)) + " \u00b7 " + esc(App.regions[ch.region].name) + ", day " + (ch.day + 1) + " (" + esc(ch.score) + ")</span>"; }
      const tunes = Object.keys(st.regionTune).map((r) => App.regions[r].name + ": \u201c" + ((App.MUSIC_TRACKS[st.regionTune[r]] || {}).title || st.regionTune[r]) + "\u201d");
      if (tunes.length) h += '<span class="k">Region tunes</span><span>' + esc(tunes.join(" \u00b7 ")) + "</span>";
      if (medals.length) h += '<span class="k">Most medals</span><span>' + medals.map(([id, w]) => esc(nm(id)) + " " + w[0] + "\u00b7" + w[1] + "\u00b7" + w[2]).join(" \u00b7 ") + ' <span class="note">(gold\u00b7silver\u00b7bronze)</span></span>';
      h += "</div></div>";
    }
    return h;
  };
  App.contestRowHTML = (id) => {
    const w = st.contestWins && st.contestWins[id], o = App.outfitText(id), cur = App.contestOf ? App.contestOf(id) : null;
    let h = "";
    if (w) h += '<span class="k">Medals</span><span>' + w[0] + " gold, " + w[1] + " silver, " + w[2] + " bronze</span>";
    if (cur) h += '<span class="k">Today</span><span>' + (cur.role === "in" ? "Competing in" : cur.role === "judge" ? "Judging" : "Watching") + " the " + esc(KINDS[cur.c.kind].name) + " at " + hm(cur.c.go - cur.c.day * DAY) + "</span>";
    if (o) h += '<span class="k">Wearing</span><span>' + esc(o) + ((!st.wallet || (App.isMine && App.isMine(id))) ? ' <button class="btn" data-outfit-reset="' + id + '">Back to its on-chain look</button>' : "") + "</span>";
    return h;
  };
  App.contestActionText = (t) => {
    const a = t.action, c = st.contests && st.contests[a.c];
    if (!c) return "At a contest";
    const K = KINDS[c.kind];
    if (a.race) return st.T < c.go ? "On the start line of the " + K.name : "Racing in the " + K.name;
    if (a.perform) return { strong: "Lifting in the Strongest Tickle", music: "Singing in the Song Contest", fashion: "On the catwalk at the Fashion Show" }[c.kind];
    if (a.podium != null) return "On the podium: " + ordinal(a.podium + 1) + " in the " + K.name;
    return "At the " + K.name;
  };
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-contest]");
    if (g) { const c = st.contests[g.dataset.contest], V = c && venueOf(c); if (V) { const Y = lay(c); App.flyTo(Y.focus.x, Y.focus.z, 36); } return; }
    const en = e.target.closest("[data-contest-enter]");
    if (en) {
      const key = en.dataset.contestEnter, sel = document.querySelector('[data-contest-who="' + key + '"]');
      const err = App.enterContest(key, sel ? +sel.value : -1);
      App.toast(err || "Entered!");
      App.renderArena && App.renderArena(true);
      return;
    }
    const rs = e.target.closest("[data-outfit-reset]");
    if (rs) { App.resetOutfit(+rs.dataset.outfitReset); App.toast("Back in its on-chain clothes."); }
  });
})(typeof self !== "undefined" ? self : this);
