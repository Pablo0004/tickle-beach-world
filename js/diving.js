/* Diving. Dive sites all over the water, each marked on the surface by a float with a diver's flag:
 * out at sea off every region's coast and in the great lake. Down on the bottom there is a sunken ship,
 * a coral reef, a bed of oysters or, in the lake, the drowned ruins of an old temple of the Maker.
 * Divers spend their free time there: they swim out, go down again and again, search the bottom and come
 * up with what they find: shells and coral to sell, pearls (now and then a black one), old coins and,
 * very rarely, a sea chest or a relic; in the ruins, Ethernum. Who dives: those who love the water
 * (a float in their paws, a surfboard, lifeguards, beachcombers, treasure hunters) and the Marauders'
 * Guild, and now and then anyone else who lives close to a site. Your own Tickles can be sent diving. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- what lies on the bottom, in the kit's stroke format (every layer needs two strokes or more) ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    // a diver's flag on a float: red with a white diagonal
    function diveflag() {
      const st = [], white = C("#ffffff"), red = C("#e8302a"), dark = C("#3a3a3a");
      st.push(S("cylinder", [0, 0, 30], [60, 60, 30], { color: white }));
      st.push(S("cylinder", [0, 0, 62], [62, 62, 5], { color: red }));
      st.push(S("joint", [0, 0, 200], [5, 5, 140], { color: dark, layer: 1 }));
      st.push(S("cube", [72, 0, 300], [70, 3, 46], { color: red, layer: 1 }));
      st.push(S("cube", [72, 4, 300], [84, 3, 11], { color: white, rot: [0, 0.58, 0], layer: 2 }));
      st.push(S("cube", [72, -4, 300], [84, 3, 11], { color: white, rot: [0, 0.58, 0], layer: 2 }));
      return st;
    }
    // a sunken ship: the hull broken open, the mast fallen across the sand, weed growing on it
    function wreck() {
      const st = [], wood = C("#5a3a22"), dark = C("#3a2614"), weed = C("#3a7a4a"), rust = C("#8a5a2a");
      st.push(S("sphere", [0, 0, 90], [180, 520, 120], { color: wood }));
      st.push(S("sphere", [0, 0, 150], [158, 492, 110], { m: "sub", color: wood }));
      st.push(S("cube", [150, 160, 110], [80, 120, 90], { m: "sub", color: wood }));
      st.push(S("cube", [0, -120, 140], [140, 150, 8], { color: dark, layer: 1 }));
      st.push(S("cube", [0, -390, 210], [120, 90, 80], { color: wood, round: 0.1, layer: 1 }));
      st.push(S("cube", [0, -300, 230], [70, 6, 30], { m: "sub", color: wood, layer: 1 }));
      st.push(S("joint", [260, -60, 30], [14, 14, 330], { color: dark, rot: dir(0.9, 0.45, 0.02), layer: 2 }));
      st.push(S("cube", [-230, 260, 20], [70, 18, 8], { color: wood, rot: [0, 0, 0.6], layer: 2 }));
      st.push(S("cube", [-250, -40, 16], [16, 90, 8], { color: wood, rot: [0, 0, -0.4], layer: 2 }));
      st.push(S("cylinder", [-60, 420, 120], [22, 22, 30], { color: rust, rot: dir(0, 1, 0.3), layer: 2 }));
      for (const [x, y] of [[120, -300], [-130, 120], [60, 380], [-90, -420]]) st.push(S("joint", [x, y, 220], [10, 10, 60], { color: weed, rot: dir((x % 3) * 0.1, 0.1, 1), layer: 3 }));
      return st;
    }
    // coral: a pink branching one, an orange fan, a purple brain coral, yellow tubes
    function coral(v) {
      const st = [];
      if (v === 0) {
        const c = C("#ff6fa8"), tip = C("#ffd0e4");
        st.push(S("sphere", [0, 0, 20], [44, 44, 26], { color: c }));
        for (let k = 0; k < 6; k++) { const a = k * 1.05, x = Math.cos(a) * 34, y = Math.sin(a) * 34; st.push(S("joint", [x, y, 90], [11, 11, 70], { color: c, rot: dir(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 1) })); }
        for (let k = 0; k < 6; k++) { const a = k * 1.05; st.push(S("sphere", [Math.cos(a) * 74, Math.sin(a) * 74, 158], [14, 14, 14], { color: tip, layer: 1 })); }
      } else if (v === 1) {
        const c = C("#ff8a2f"), d = C("#c05a1a");
        st.push(S("joint", [0, 0, 40], [12, 12, 40], { color: d }));
        st.push(S("cube", [0, 0, 130], [120, 7, 100], { color: c, round: 0.9 }));
        st.push(S("cube", [0, 0, 130], [90, 9, 4], { color: d, layer: 1 }));
        st.push(S("cube", [0, 0, 130], [4, 9, 80], { color: d, layer: 1 }));
      } else if (v === 2) {
        const c = C("#8a4fd8"), d = C("#5a2fa0");
        st.push(S("sphere", [0, 0, 50], [80, 80, 55], { color: c }));
        st.push(S("sphere", [0, 0, 104], [70, 6, 6], { m: "sub", color: c }));
        for (const [x, y] of [[-40, 30], [40, -20], [10, 50]]) st.push(S("sphere", [x, y, 90], [16, 16, 12], { color: d, layer: 1 }));
      } else {
        const c = C("#ffd23f"), d = C("#e0a020");
        st.push(S("cylinder", [0, 0, 10], [70, 70, 10], { color: d }));
        for (const [x, y, h] of [[0, 0, 150], [40, 20, 100], [-36, 26, 120], [10, -44, 80], [-30, -30, 60]]) st.push(S("cylinder", [x, y, h / 2 + 10], [18, 18, h / 2], { color: c, hole: 0.6 }));
        st.push(S("sphere", [0, 0, 162], [10, 10, 6], { color: d, layer: 1 }), S("sphere", [40, 20, 112], [10, 10, 6], { color: d, layer: 1 }));
      }
      return st;
    }
    // an oyster, open, with its pearl
    function oyster() {
      const st = [], shell = C("#9a9488"), inner = C("#f4c8d0"), pearl = C("#fffaf0");
      st.push(S("sphere", [0, 0, 14], [60, 50, 16], { color: shell }));
      st.push(S("sphere", [0, -34, 52], [58, 48, 12], { color: shell, rot: dir(0, -0.75, 1) }));
      st.push(S("sphere", [0, 0, 24], [44, 36, 6], { color: inner, layer: 1 }));
      st.push(S("sphere", [0, 6, 32], [14, 14, 14], { color: pearl, layer: 1 }));
      return st;
    }
    // the drowned ruins of an old temple of the Maker: broken columns, a fallen one, a broken lintel
    function sunkenruin() {
      const st = [], stone = C("#b8b0a0"), dark = C("#8a8478"), weed = C("#3a7a4a"), gold = C("#ffd23f");
      st.push(S("cube", [0, 0, 20], [300, 220, 20], { color: stone, round: 0.1 }));
      st.push(S("cube", [0, 245, 10], [200, 30, 10], { color: dark }));
      for (const [x, y, h] of [[-220, -150, 300], [220, -150, 180], [-220, 150, 420], [220, 150, 90]]) {
        st.push(S("cylinder", [x, y, 40 + h / 2], [34, 34, h / 2], { color: stone, layer: 1 }));
        if (h > 250) st.push(S("cube", [x, y, 50 + h], [48, 48, 12], { color: dark, layer: 1 }));
      }
      st.push(S("joint", [60, -30, 60], [32, 32, 190], { color: stone, rot: dir(1, 0.45, 0), layer: 2 }));
      st.push(S("cube", [-150, 150, 470], [110, 40, 26], { color: dark, rot: [0, 0.25, 0.3], layer: 2 }));
      st.push(S("sphere", [-60, 60, 60], [40, 40, 22], { color: gold, layer: 2 }));
      for (const [x, y] of [[-200, -60], [160, 80], [0, -190], [250, -30]]) st.push(S("joint", [x, y, 80], [9, 9, 50], { color: weed, layer: 3 }));
      return st;
    }
    const D = { group: "Diving" };
    Object.assign(TB.KIT, {
      diveflag: Object.assign({ name: "Diver's Flag Float", variants: [0], build: diveflag, voxel: [6] }, D),
      wreck: Object.assign({ name: "Sunken Ship", variants: [0], build: wreck, voxel: [10] }, D),
      coral: Object.assign({ name: "Coral", variants: [0, 1, 2, 3], build: coral, voxel: [5], variantLabel: (v) => ["pink branching", "orange fan", "purple brain", "yellow tubes"][v] }, D),
      oyster: Object.assign({ name: "Oyster with a Pearl", variants: [0], build: oyster, voxel: [4] }, D),
      sunkenruin: Object.assign({ name: "Drowned Temple Ruins", variants: [0], build: sunkenruin, voxel: [9] }, D),
    });
  }
  if (!G.App) return;
  const App = G.App, st = App.st, hash2 = App.hash2, DAY = 1440, rnd = Math.random;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nm = (id) => App.nameOf(id);
  const SWIM = 2.4; // blocks a game minute, on the surface
  const CYCLE = 5; // one dive: down, a search of the bottom, up, breathe
  const KINDS = (App.DIVE_KINDS = {
    wreck: { name: "Wreck", what: "a sunken ship: old coins, now and then a sea chest" },
    reef: { name: "Reef", what: "a coral garden: shells and coral to sell, a pearl now and then" },
    pearls: { name: "Pearl Bed", what: "a bed of oysters: pearls, sometimes a black one" },
    ruins: { name: "Drowned Temple", what: "the ruins of an old temple of the Maker: Ethernum, old gold" },
  });
  // what one dive brings up: [key, chance] by kind of site (the rest of the time, nothing)
  const FINDS = {
    reef: [["shell", 0.22], ["coral", 0.12], ["pearl", 0.03], ["blackpearl", 0.002]],
    pearls: [["shell", 0.12], ["pearl", 0.16], ["blackpearl", 0.008]],
    wreck: [["coins", 0.2], ["shell", 0.08], ["chest", 0.012], ["tank", 0.004], ["relic", 0.0004]],
    ruins: [["ether", 0.14], ["gold", 0.05], ["coins", 0.06], ["relic", 0.0006]],
  };
  const ITEM = (App.DIVE_ITEMS = {
    shell: { name: "a pretty shell", shells: 1 }, coral: { name: "a piece of coral", shells: 3 }, pearl: { name: "a pearl", shells: 12 },
    blackpearl: { name: "a black pearl", shells: 50, big: true }, coins: { name: "old coins", shells: 5 }, chest: { name: "a sea chest", shells: 40, gold: 1, big: true },
    ether: { name: "Ethernum", ether: 1 }, gold: { name: "old gold", gold: 0.5 }, relic: { name: "a relic", big: true },
    tank: { name: "an old oxygen tank, still sound", tank: true, big: true },
  });
  // relics only the sea gives
  const SEA_RELICS = { combs: { name: "Mermaid's Comb", band: 0, bonus: 1.05 }, bell: { name: "Drowned Bell", band: 1, bonus: 1.07 }, deeppearl: { name: "Pearl of the Deep", band: 1, bonus: 1.08 } };
  if (App.RELICS) Object.assign(App.RELICS, SEA_RELICS);

  // ---------- the sites: in the lake off every region's shore, and out at sea off its coast ----------
  const SITES = (App.diveSites = []);
  const colH = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z));
  const deepAt = (x, z) => !App.isLand(x, z) && colH(x, z) <= 3 && !App.pondWater(x, z);
  // the nearest dry land, to wade in from
  function shoreOf(x, z) {
    for (let r = 2; r < 40; r += 1) for (let a = 0; a < 6.28; a += 0.2) {
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (App.isLand(px, pz) && App.climbOK(px, pz, px, pz)) {
        // a step back from the edge, on dry land
        const bx = px + Math.cos(a) * 1.5, bz = pz + Math.sin(a) * 1.5;
        return App.isLand(bx, bz) ? { x: bx, z: bz, ex: px - Math.cos(a) * 0.6, ez: pz - Math.sin(a) * 0.6, d: r } : { x: px, z: pz, ex: px - Math.cos(a) * 0.6, ez: pz - Math.sin(a) * 0.6, d: r };
      }
    }
    return null;
  }
  function addSite(r, x, z, kind, where) {
    const sh = shoreOf(x, z);
    if (!sh || sh.d < 9 || sh.d > 26) return false;
    if (SITES.some((o) => Math.hypot(o.x - x, o.z - z) < 50)) return false;
    // keep clear of the docks, the ferries' lines and the regatta courses
    for (const D of App.docks || []) if (Math.hypot(D.berth.x - x, D.berth.z - z) < 26) return false;
    for (const F of App.ferries || []) if (F.path && F.path.some((p, i) => i && distSeg(x, z, F.path[i - 1], p) < 10)) return false;
    const i = SITES.length, R = App.regions[r];
    const names = {
      wreck: ["the Wreck of the Sea Shell", "the Wreck of the Golden Duck", "the Wreck of the Old Ferry", "the Wreck of the Lucky Tide", "the Wreck of the Coconut Queen", "the Wreck of the Merry Otter", "the Wreck of the Blue Heron"],
      reef: ["Coral Garden", "Rainbow Reef", "Pink Reef", "the Sunny Shoals", "Fan Coral Reef", "the Painted Reef", "Starfish Reef", "the Glass Shoals"],
      pearls: ["the Pearl Bed", "Oyster Bank", "Moonpearl Shallows", "the White Shallows", "Silver Oyster Bed", "Mother-of-Pearl Bank"],
      ruins: ["the Drowned Temple", "the Sunken Shrine of the Maker"],
    }[kind];
    const used = SITES.filter((o) => o.kind === kind).length;
    SITES.push({ i, region: r, x, z, kind, where, shore: sh, name: names[used % names.length] + " (" + R.name + ")", floor: colH(x, z) });
    return true;
  }
  function distSeg(x, z, a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L));
    return Math.hypot(x - a.x - dx * u, z - a.z - dz * u);
  }
  App.prepareDiving = () => {
    if (SITES.length) return;
    for (const R of App.regions) {
      // in the lake: off the region's shore, to one side of its dock (the regatta keeps to the other side)
      const D = (App.docks || []).find((d) => d.region === R.i);
      const regSide = App.contestVenue && App.contestVenue(R.i, "lake") ? App.contestVenue(R.i, "lake").sgn : 1;
      let done = false;
      if (D) for (const off of [40, 60, 80, 30, 100]) for (const sgn of [-regSide, regSide]) {
        if (done) break;
        for (const out of [14, 18, 22]) {
          const x = D.land.x + D.uz * sgn * off + D.ux * out, z = D.land.z - D.ux * sgn * off + D.uz * out;
          if (deepAt(x, z) && App.lakeSd(x, z) < -6 && addSite(R.i, x, z, R.gx === 0 ? "ruins" : "pearls", "lake")) { done = true; break; }
        }
      }
      // at sea: two sites off the outer coast, facing away from the middle of the world
      const ang0 = Math.atan2(R.cz, R.cx || 0.001);
      let n = 0;
      for (let k = 0; k < 40 && n < 2; k++) {
        const a = ang0 + ((k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.13), dirx = Math.cos(a), dirz = Math.sin(a);
        // walk out from the middle of the region until the sea is deep enough
        let x = R.cx, z = R.cz, wet = 0;
        for (let d = 300; d < 760; d += 3) { x = R.cx + dirx * d; z = R.cz + dirz * d; if (!App.isLand(x, z)) { wet++; if (wet > 4 && deepAt(x, z)) break; } else wet = 0; }
        if (!deepAt(x, z) || App.regionOf(x, z) !== R.i || App.lakeSd(x, z) < 20) continue;
        if (addSite(R.i, x, z, n === 0 ? (hash2(R.i, 11, 437) < 0.5 ? "wreck" : "reef") : (hash2(R.i, 13, 439) < 0.5 ? "reef" : "wreck"), "sea")) n++;
      }
    }
  };

  // ---------- who dives today, and where ----------
  const P = App.pop;
  function lovesWater(id) {
    const g = P.ground[id] >= 0 ? App.MODEL_NAMES["ground:" + P.ground[id]] : null, hd = P.hand[id] >= 0 ? App.MODEL_NAMES["hand:" + P.hand[id]] : null, j = App.jobOf(id);
    let p = 0.004;
    if (hd === "Tube") p += 0.12;
    if (g === "Surfs Up" || g === "Treasure") p += 0.08;
    if (j === "lifeguard" || j === "comber" || j === "hunter") p += 0.08;
    if (App.guildOf && App.guildOf(id) === "marauders") p += 0.06;
    return p;
  }
  const siteCache = new Map();
  function siteNear(v) {
    if (siteCache.has(v.i)) return siteCache.get(v.i);
    let best = null, bd = 150; // within an hour's walk
    for (const s of SITES) { const d = Math.hypot(s.shore.x - v.x, s.shore.z - v.z); if (d < bd) { bd = d; best = s; } }
    siteCache.set(v.i, best);
    return best;
  }
  App.diveOf = (id, day) => {
    if (!SITES.length || (App.isMine && App.isMine(id) && st.mode === "manual" && !st.freeWill)) return null;
    const v = App.villageOfToken(id), s = siteNear(v);
    if (!s || hash2(id, day, 441) >= lovesWater(id)) return null;
    return s;
  };
  // where a diver waits on the shore (off screen), and the label of the plan step
  App.diveStep = (s) => ({ x: s.shore.x, z: s.shore.z, label: s.name + " (diving)", site: s.i, cx: s.x, cz: s.z });

  // ---------- what each dive brings up (the same whether you watch or not) ----------
  function findOf(id, day, k, s) {
    const u = hash2(id * 37 + k, day, 443 + s.i) * (App.hasTank && App.hasTank(id) ? 0.8 : 1);
    let acc = 0;
    for (const [key, p] of FINDS[s.kind]) { acc += p; if (u < acc) return key; }
    return null;
  }
  function credit(id, key, s) {
    const I = ITEM[key], v = App.villageOfToken(id), L = st.diveLog;
    L.finds = (L.finds || 0) + 1;
    L[key] = (L[key] || 0) + 1;
    if (I.shells) App.pay(id, I.shells);
    if (I.ether && App.addEthernum) App.addEthernum(id, I.ether);
    if (I.gold && App.oreOf) App.oreOf(v).gold += I.gold;
    let what = I.name;
    // an old tank: kept if it has none (and used on the next dives), sold for shells if it has one already
    if (I.tank) { if (!(App.giveTank && App.giveTank(id))) { App.pay(id, 25); what = I.name + " (sold: it has one)"; } }
    if (key === "relic") {
      const keys = Object.keys(SEA_RELICS), r = keys[Math.floor(hash2(id, Math.floor(st.T), 445) * keys.length)];
      st.relics = st.relics || {};
      const list = (st.relics[id] = st.relics[id] || []);
      if (!list.includes(r)) { list.push(r); if (list.length > 6) { list.sort((a, b) => App.relicInfo(b).bonus - App.relicInfo(a).bonus); list.length = 6; } }
      what = SEA_RELICS[r].name;
    }
    if (I.big) {
      L.best = { id, what, site: s.i, day: Math.floor(st.T / DAY) };
      const near = Math.hypot(s.x - App.cam.target.x, s.z - App.cam.target.z) < 400 || (App.isMine && App.isMine(id));
      if (near || key === "relic") App.log("dive", nm(id) + " brought up " + (key === "relic" ? "a relic, the " + what : what) + " at " + s.name + "!", key === "chest" ? "Forty shells' worth of old coins and a little gold for " + v.name + "." : key === "blackpearl" ? "Worth fifty shells." : "It makes its bearer a little stronger down in the Great Underworld.", { who: [id] });
    }
    return what;
  }
  // how many dives fit in a stretch of free time at a site
  const divesIn = (step, s) => Math.max(0, Math.floor((step.e - step.s - (step.travel || 0) - (2 * s.shore.d) / SWIM - 4) / CYCLE));
  // off screen: everyone who dived today is paid for what it found, once its free time is over
  function settle(day) {
    const done = (st.diveDone[day] = st.diveDone[day] || {});
    for (const v of App.villages) {
      const s = siteNear(v);
      if (!s) continue;
      for (const id of v.residents) {
        if (done[id] != null && done[id] < 0) continue;
        if (!App.diveOf(id, day)) continue;
        const step = App.planOf(id, day).steps.find((x) => x.k === "dive");
        if (!step || st.T - day * DAY < step.e) continue;
        const from = done[id] || 0, n = divesIn(step, s);
        for (let k = from; k < n; k++) { const f = findOf(id, day, k, s); if (f) credit(id, f, s); }
        st.diveLog.dives = (st.diveLog.dives || 0) + Math.max(0, n - from);
        done[id] = -1;
      }
    }
    for (const d in st.diveDone) if (+d < day - 1) delete st.diveDone[d];
  }

  // ---------- the brain and the body (sim.js) ----------
  App.diveBrain = (t, step) => {
    const s = SITES[step.p.site];
    if (!s) return false;
    const day = Math.floor(st.T / DAY), until = day * DAY + step.e;
    if (until - st.T < 2 * s.shore.d / SWIM + 6) return false;
    if (Math.hypot(s.shore.x - t.pos.x, s.shore.z - t.pos.z) > 2) { App.startTravel(t, { x: s.shore.x, z: s.shore.z, label: s.name }, "to dive at " + s.name); return true; }
    startDive(t, s, until, false);
    return true;
  };
  function startDive(t, s, until, order) {
    App.endAction(t);
    const k = (t.id * 0.618) % 1, a = k * 6.283, r = 1.6 + ((t.id * 0.37) % 1) * 2.2;
    t.action = { kind: "dive", site: s.i, phase: "out", until, order: !!order, started: st.T, spot: { x: s.x + Math.cos(a) * r, z: s.z + Math.sin(a) * r }, n: (st.diveDone[Math.floor(st.T / DAY)] || {})[t.id] || 0 };
    if (rnd() < 0.5) App.say(t, ["Time for a dive!", "Let's see what's down there.", "Into the water!"][Math.floor(rnd() * 3)], 3);
  }
  App.startDiveAt = (t, i, until) => { const s = SITES[i]; if (!s) { t.action = null; return; } startDive(t, s, until, true); };
  // your own Tickle, sent to the nearest site for an hour or so
  App.orderDive = (t) => {
    let best = null, bd = 1e9;
    for (const s of SITES) { const d = Math.hypot(s.shore.x - t.pos.x, s.shore.z - t.pos.z); if (d < bd) { bd = d; best = s; } }
    if (!best) return "There is nowhere to dive.";
    App.endAction(t);
    t.queue = [];
    const until = st.T + bd / App.WALK_SPEED + 80;
    t.action = { kind: "travel", path: App.route(t.pos.x, t.pos.z, best.shore.x, best.shore.z).slice(1), order: true, started: st.T, label: "to dive at " + best.name, then: { dive: best.i, until } };
    return null;
  };
  const turnTo = (h, target, k) => { let d = target - h; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return h + d * Math.min(1, k); };
  function setArms(t, rx, lx, rz, lz) { const A = t.arms; if (!A) return; A.R.rotation.x = rx; A.L.rotation.x = lx; A.R.rotation.z = rz || 0; A.L.rotation.z = lz || 0; }
  const SURF_Y = () => App.WATER_Y - 0.95;
  App.stepDive = (t, a, dm, dtReal) => {
    const s = SITES[a.site];
    if (!s || App.isKO(t.id)) { t.action = null; return; }
    const now = performance.now() / 1000, T = st.T;
    const swimTo = (q) => {
      const dx = q.x - t.pos.x, dz = q.z - t.pos.z, d = Math.hypot(dx, dz), step = Math.min(d, SWIM * dm);
      if (d > 0.05) { t.pos.x += (dx / d) * step; t.pos.z += (dz / d) * step; t.heading = turnTo(t.heading, Math.atan2(dx, dz), dtReal * 5); }
      return d;
    };
    const pose = (y, tilt, swimming) => {
      App.animateTickle(t, false, dtReal);
      t.pos.y = y; t.group.position.copy(t.pos); t.group.rotation.y = t.heading;
      t.pivot.rotation.set(tilt, 0, 0);
      // lying along the water the body pivots about its middle, not its feet
      t.pivot.position.set(0, tilt > 0.6 ? 0.45 : 0, tilt > 0.6 ? -1.1 * Math.sin(tilt) : 0);
      const w = now * 3.2 + t.id;
      if (swimming) setArms(t, -1.7 + Math.sin(w) * 0.9, -1.7 + Math.sin(w) * 0.9, 0.55 + Math.cos(w) * 0.35, -0.55 - Math.cos(w) * 0.35); // breaststroke: both paws
      else setArms(t, -0.25, -0.25, 0.25, -0.25);
    };
    if (a.phase === "out") {
      if (swimTo(a.spot) < 0.3) { a.phase = "dive"; a.t0 = T; }
      pose(SURF_Y() + Math.sin(now * 2 + t.id) * 0.05, 1.25, true);
      return;
    }
    if (a.phase === "back") {
      const e = { x: s.shore.ex, z: s.shore.ez };
      if (swimTo(e) < 0.4) {
        t.pos.x = s.shore.x; t.pos.z = s.shore.z; t.action = null;
        App.animateTickle(t, false, dtReal);
        if (a.got && rnd() < 0.7) App.say(t, a.got > 1 ? "A good day under the water!" : "Not bad at all.", 3);
        return;
      }
      pose(SURF_Y() + Math.sin(now * 2 + t.id) * 0.05, 1.25, true);
      return;
    }
    // down and up, again and again
    const tau = T - a.t0, k = Math.floor(tau / CYCLE), c = tau - k * CYCLE, floorY = s.floor + 0.25;
    if (T >= a.until && c >= 3.8) { a.phase = "back"; return; }
    if (k > (a.lastK == null ? -1 : a.lastK) && c >= 3.8) {
      // just come up: what did it find?
      a.lastK = k;
      const day = Math.floor(T / DAY), done = (st.diveDone[day] = st.diveDone[day] || {}), n = Math.max(0, done[t.id] || 0);
      const f = findOf(t.id, day, n, s);
      done[t.id] = n + 1;
      st.diveLog.dives = (st.diveLog.dives || 0) + 1;
      if (f) {
        const what = credit(t.id, f, s);
        a.got = (a.got || 0) + 1;
        if (App.FX) (ITEM[f].big ? App.FX.label : App.FX.number)(App.scene, { x: t.pos.x, y: App.WATER_Y + 2.2, z: t.pos.z }, ITEM[f].big ? what + "!" : "+ " + what.replace(/^an? /, ""), ITEM[f].big ? "#ffd23f" : "#ffffff");
        App.say(t, ITEM[f].big ? "Look at this!" : ["Got something!", "Ooh, shiny!", "One more for the purse."][Math.floor(rnd() * 3)], 2);
      }
    }
    const surf = SURF_Y();
    let y, tilt, swimming = false;
    if (c < 0.6) { const u = c / 0.6; y = surf + (floorY - surf) * u * u; tilt = 1.25 + u * 0.4; } // head first, down
    else if (c < 3.2) {
      // along the bottom, looking under the weed and in the sand
      const u = (c - 0.6) / 2.6, ang = (t.id % 7) + u * 3.5;
      t.pos.x = a.spot.x + Math.cos(ang) * 1.2; t.pos.z = a.spot.z + Math.sin(ang) * 1.2;
      t.heading = turnTo(t.heading, ang + Math.PI / 2, dtReal * 3);
      y = floorY + 0.15 + Math.sin(now * 1.5 + t.id) * 0.1; tilt = 1.45; swimming = true;
    } else if (c < 3.8) { const u = (c - 3.2) / 0.6; y = floorY + (surf - floorY) * (1 - (1 - u) * (1 - u)); tilt = 1.45 - u * 1.6; } // up
    else { y = surf + Math.sin(now * 2 + t.id) * 0.06; tilt = -0.1; } // a breath at the surface
    pose(y, tilt, swimming);
    // bubbles while under
    if (y < surf - 0.4 && st.speed > 0 && rnd() < dtReal * 5 && App.spawnParticle) App.spawnParticle({ kind: "bubble", x: t.pos.x + (rnd() - 0.5) * 0.4, y: y + 1.2, z: t.pos.z + (rnd() - 0.5) * 0.4, vx: (rnd() - 0.5) * 0.2, vy: 1.2 + rnd() * 0.6, vz: (rnd() - 0.5) * 0.2, age: 0, life: Math.max(0.5, (App.WATER_Y - y - 1.2) / 1.7), color: new THREE.Color("#e8fbff") });
    if (c >= 3.8 && c < 3.85 && rnd() < 0.5) App.say(t, "Phew!", 1);
  };
  App.diveActionText = (t) => {
    const a = t.action, s = SITES[a.site];
    if (!s) return "Diving";
    if (a.phase === "out") return "Swimming out to " + s.name;
    if (a.phase === "back") return "Swimming back from " + s.name;
    const c = (st.T - a.t0) % CYCLE;
    return c < 3.8 ? "Diving at " + s.name + ", down on the bottom" : "Diving at " + s.name + ", up for a breath";
  };

  // ---------- the clock (sim.js) and the props near you (ui.js) ----------
  App.diveTick = () => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    // every free time is over by 21:30
    if (m >= 21 * 60 + 30 && st.diveDay !== day) { st.diveDay = day; try { settle(day); } catch (e) { console.warn("dive settle", e); } }
  };
  const props = new Map();
  const PROPS = {
    wreck: (r) => [["wreck", 0, 0, 0, r * 6.28, 0.35], ["coral", 0, 5, 3, 0], ["coral", 2, -4, 5, 0], ["coral", 1, 4, -5, 1]],
    reef: (r) => [["coral", 0, 0, 0, 0], ["coral", 1, 2.5, 1.5, 1], ["coral", 2, -2, 2, 0], ["coral", 3, 1.5, -2.5, 0], ["coral", 0, -3, -1.5, 2], ["coral", 1, 4, -1, 2.5], ["coral", 3, -1, 4, 1], ["coral", 2, 3.5, 3.5, 0], ["coral", 0, -4.5, 2.5, 1], ["coral", 3, 0, -4.5, 2]],
    pearls: () => [[0, 0], [1.4, 0.6], [-1.2, 1.1], [0.6, -1.5], [-1.8, -0.8], [2.4, -1.2], [-0.4, 2.4], [2, 2], [-2.6, 1.8], [1, -2.8]].map(([x, z], i) => ["oyster", 0, x, z, i * 1.3]).concat([["coral", 1, 3.5, 0.5, 0], ["coral", 3, -3.6, -1.5, 0]]),
    ruins: (r) => [["sunkenruin", 0, 0, 0, r * 6.28], ["crystal", 0, 3.5, 2.2, 0], ["crystal", 0, -3, -2.8, 1], ["coral", 2, 4, -3, 0]],
  };
  // the tank on its back while a Tickle with one dives (as a diver, or in first person in the water)
  let tankRes = null;
  function tanks() {
    if (!App.hasTank || !App.kitMesh) return;
    if (!tankRes) { tankRes = "loading"; App.kitMesh("oxytank", 0).then((r) => { tankRes = r; }); return; }
    if (tankRes === "loading") return;
    for (const t of st.tickles) {
      const a = t.action, want = App.hasTank(t.id) && a && (a.kind === "dive" || (a.kind === "fp" && a.water)) && t.pivot;
      if (want && !t.tankMesh) {
        const m = new THREE.Mesh(tankRes.geo, App.voxMaterial), S = App.S, k = 0.8;
        m.scale.setScalar(tankRes.md.voxel * S * k); m.position.set(tankRes.md.origin[0] * S * k, tankRes.md.origin[1] * S * k + (t.height || 3) * 0.28, tankRes.md.origin[2] * S * k - 0.75);
        m.userData.tickle = true;
        t.pivot.add(m); t.tankMesh = m;
      } else if (!want && t.tankMesh) { if (t.tankMesh.parent) t.tankMesh.parent.remove(t.tankMesh); t.tankMesh = null; }
    }
  }
  App.updateDiving = (dt) => {
    tanks();
    if (!SITES.length) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, now = performance.now() / 1000;
    for (const s of SITES) {
      const near = Math.hypot(s.x - tx, s.z - tz) < 180;
      let o = props.get(s.i);
      if (near && !o) {
        o = { grp: new THREE.Group(), flag: null };
        App.scene.add(o.grp);
        props.set(s.i, o);
        const r = hash2(s.i, 1, 447);
        for (const [k, v, dx, dz, rot, roll] of PROPS[s.kind](r)) {
          if (!TB.KIT[k]) continue;
          const x = s.x + dx, z = s.z + dz;
          if (App.isLand(x, z)) continue;
          App.kitMesh(k, v).then((g) => {
            const m = new THREE.Group();
            m.add(App.centeredMesh(g.md, g.geo, true));
            m.position.set(x, colH(x, z), z);
            m.rotation.set(0, rot || 0, roll || 0);
            if (k === "coral" || k === "oyster") m.scale.setScalar(1.6);
            o.grp.add(m);
          });
        }
        App.kitMesh("diveflag", 0).then((g) => { const m = new THREE.Group(); m.add(App.centeredMesh(g.md, g.geo, true)); o.grp.add(m); o.flag = m; });
      } else if (!near && o) { App.scene.remove(o.grp); props.delete(s.i); continue; }
      if (o && o.flag) { o.flag.position.set(s.x + 2.2, App.WATER_Y - 0.3 + Math.sin(now * 1.4 + s.i) * 0.06, s.z - 1.6); o.flag.rotation.set(Math.sin(now * 1.1 + s.i) * 0.04, s.i, Math.sin(now * 0.9 + s.i) * 0.05); }
    }
  };

  // ---------- save, load and the Adventure tab ----------
  App.initDiving = (saved) => {
    st.diveLog = (saved && saved.log) || { dives: 0, finds: 0 };
    st.diveDone = (saved && saved.done) || {};
    st.diveDay = saved ? saved.day : undefined;
  };
  App.saveDiving = () => ({ log: st.diveLog, done: st.diveDone, day: st.diveDay });
  App.divingHTML = () => {
    if (!SITES.length) return "";
    const L = st.diveLog || {}, day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    let h = '<div class="card"><h3>Diving</h3><p class="note">' + SITES.length + " dive sites, each marked by a diver's flag: out at sea off every region and in the great lake. Divers swim out in their free time, go down again and again and come up with shells, coral, pearls (now and then a black one), old coins, a sea chest now and then, Ethernum from the drowned temples and, very rarely, a relic of the sea." + (st.wallet ? " Send one of your own from its card (Go diving)." : "") + '</p><div class="kv">';
    for (const s of SITES) {
      let n = 0;
      if (m > 11 * 60 && m < 21 * 60 + 30) for (const t of st.tickles) if (t.action && t.action.kind === "dive" && t.action.site === s.i) n++;
      h += '<span class="k"><button class="btn" data-dive="' + s.i + '">' + esc(s.name.replace(/ \(.*\)$/, "")) + "</button></span><span>" + esc(App.regions[s.region].name) + " \u00b7 " + (s.where === "sea" ? "at sea" : "in the lake") + " \u00b7 " + esc(KINDS[s.kind].what) + (n ? " \u00b7 <b>" + n + " diving now</b>" : "") + "</span>";
    }
    h += '<span class="k">Brought up</span><span>' + (L.dives || 0).toLocaleString() + " dives \u00b7 " + (L.pearl || 0) + " pearls, " + (L.blackpearl || 0) + " black pearls, " + (L.chest || 0) + " sea chests, " + (L.ether || 0) + " Ethernum, " + (L.relic || 0) + " relics" + (L.best ? " \u00b7 best: " + esc(nm(L.best.id)) + ", " + esc(L.best.what) : "") + "</span>";
    return h + "</div></div>";
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dive]");
    if (b) { const s = SITES[+b.dataset.dive]; if (s) App.flyTo(s.x, s.z, 30); return; }
    const o = e.target.closest("[data-order-dive]");
    if (o) { const t = st.tickles.find((x) => x.id === +o.dataset.orderDive); if (t) { const err = App.orderDive(t); App.toast(err || t.name + " is off to dive."); } }
  });
})(typeof self !== "undefined" ? self : this);
