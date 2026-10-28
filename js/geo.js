/* World layout: six large regions (one per on-chain Location) split by narrow channels with
 * bridges, villages with roads between them, and places (beaches, piers, palm groves, duck
 * ponds, waterfall hills, camps, meadows) dressed with pieces cut from the on-chain floors. */
(function () {
  "use strict";
  const App = window.App;
  const SEA = App.SEA, H = App.H, B = App.BLOCK;
  const hash2 = App.hash2, fbm = App.fbm;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // ---------- regions ----------
  const SPX = 880, SPZ = 880, ROUT = 540;
  const LAYOUT = [
    { floor: 16, name: "Camping", gx: -1, gz: -0.5, amp: 6 }, { floor: 11, name: "Duck Pond", gx: 0, gz: -0.5, amp: 3 },
    { floor: 14, name: "Waterfall", gx: 1, gz: -0.5, amp: 5 }, { floor: 3, name: "The Pier", gx: -1, gz: 0.5, amp: 2.5 },
    { floor: 1, name: "Beach Sand", gx: 0, gz: 0.5, amp: 2 }, { floor: 4, name: "The Palm", gx: 1, gz: 0.5, amp: 3 },
  ];
  const regions = (App.regions = LAYOUT.map((r, i) => ({ i, floor: r.floor, name: r.name, cx: r.gx * SPX, cz: r.gz * SPZ, amp: r.amp, gx: r.gx, gz: r.gz })));
  App.BIOMES = regions.map((r) => ({ floor: r.floor, name: r.name }));
  App.biomeOf = (floor) => App.BIOMES.find((b) => b.floor === floor);
  App.WORLD = { minX: -SPX - ROUT - 60, maxX: SPX + ROUT + 60, minZ: -SPZ / 2 - ROUT - 60, maxZ: SPZ / 2 + ROUT + 60 };
  // the open sea round all the land reaches further than the land itself (the view and the boats can go out there)
  App.OCEAN = { minX: App.WORLD.minX - 260, maxX: App.WORLD.maxX + 260, minZ: App.WORLD.minZ - 260, maxZ: App.WORLD.maxZ + 260 };
  const ADJ = [];
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) if (Math.abs(regions[a].gx - regions[b].gx) + Math.abs(regions[a].gz - regions[b].gz) === 1) ADJ.push([a, b]);
  const adjacent = (a, b) => ADJ.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  // ---------- spatial grid ----------
  const GC = 64, grid = new Map();
  const gk = (cx, cz) => cx * 100000 + cz;
  function gadd(layer, obj, x0, z0, x1, z1) {
    for (let cx = Math.floor(x0 / GC); cx <= Math.floor(x1 / GC); cx++) for (let cz = Math.floor(z0 / GC); cz <= Math.floor(z1 / GC); cz++) {
      const k = gk(cx, cz);
      let c = grid.get(k);
      if (!c) { c = {}; grid.set(k, c); }
      (c[layer] = c[layer] || []).push(obj);
    }
  }
  function gget(layer, x, z) { const c = grid.get(gk(Math.floor(x / GC), Math.floor(z / GC))); return (c && c[layer]) || EMPTY; }
  const EMPTY = [];
  App.gridNear = (layer, x, z, r) => {
    const out = new Set();
    for (let cx = Math.floor((x - r) / GC); cx <= Math.floor((x + r) / GC); cx++) for (let cz = Math.floor((z - r) / GC); cz <= Math.floor((z + r) / GC); cz++) {
      const c = grid.get(gk(cx, cz));
      if (c && c[layer]) for (const o of c[layer]) out.add(o);
    }
    return [...out];
  };

  // ---------- region field ----------
  function regionField(x, z) {
    // the borders between regions wander like real coasts and rivers: a broad bend and a finer wiggle
    const wx = x + (fbm(x * 0.003, z * 0.003, 41) - 0.5) * 380 + (fbm(x * 0.008, z * 0.008, 37) - 0.5) * 120 + (fbm(x * 0.02, z * 0.02, 45) - 0.5) * 40;
    const wz = z + (fbm(x * 0.003, z * 0.003, 43) - 0.5) * 380 + (fbm(x * 0.008, z * 0.008, 39) - 0.5) * 120 + (fbm(x * 0.02, z * 0.02, 49) - 0.5) * 40;
    let i1 = 0, d1 = 1e9, i2 = 0, d2 = 1e9;
    for (const r of regions) {
      const dd = Math.hypot(wx - r.cx, wz - r.cz);
      if (dd < d1) { i2 = i1; d2 = d1; i1 = r.i; d1 = dd; } else if (dd < d2) { i2 = r.i; d2 = dd; }
    }
    const R = regions[i1];
    const ox = x + (fbm(x * 0.0032, z * 0.0032, 47) - 0.5) * 300, oz = z + (fbm(x * 0.0032, z * 0.0032, 53) - 0.5) * 300;
    const coast = ROUT - Math.hypot(ox - R.cx, oz - R.cz); // cells inside the outer coast
    const chan = adjacent(i1, i2) ? (d2 - d1) / 2 - (6 + fbm(x * 0.02, z * 0.02, 59) * 5) : 1e9; // cells away from a channel
    return { r: i1, r2: i2, coast, chan };
  }
  App.regionOf = (x, z) => regionField(x, z).r;
  // the open sea: water beyond the outer coast (not the great lake, not a channel between two regions, not a pond).
  // It has waves; the lake is calm.
  App.seaAt = (x, z) => { if (App.columnHeight(Math.floor(x), Math.floor(z)) >= SEA || lakeSd(x, z) <= 0) return false; const f = regionField(x, z); return f.coast < 0 && f.chan > 4; };
  App.regionField = regionField;
  // the nearest beach on the open sea: a spot on dry land at the water's edge, and a point out at sea in front of it
  const seaBeaches = new Map();
  // a coarse map of the open sea (and of which region each cell belongs to), made the first time it is needed,
  // so that looking for the nearest sea beach does not test the sea point by point (that took seconds)
  const SG = 12;
  let seaGrid = null, seaReg = null, sgW = 0, sgH = 0, sgX = 0, sgZ = 0;
  function buildSeaGrid() {
    const OB = App.OCEAN || App.WORLD;
    sgX = OB.minX; sgZ = OB.minZ; sgW = Math.ceil((OB.maxX - OB.minX) / SG); sgH = Math.ceil((OB.maxZ - OB.minZ) / SG);
    seaGrid = new Uint8Array(sgW * sgH); seaReg = new Int8Array(sgW * sgH);
    for (let j = 0; j < sgH; j++) for (let i = 0; i < sgW; i++) {
      const x = sgX + (i + 0.5) * SG, z = sgZ + (j + 0.5) * SG;
      if (App.columnHeight(Math.floor(x), Math.floor(z)) >= SEA || lakeSd(x, z) <= 0) continue;
      const f = regionField(x, z);
      if (f.coast < 0 && f.chan > 4) { seaGrid[j * sgW + i] = 1; seaReg[j * sgW + i] = f.r; }
    }
  }
  const seaCell = (x, z) => { if (!seaGrid) buildSeaGrid(); const i = Math.floor((x - sgX) / SG), j = Math.floor((z - sgZ) / SG); return i < 0 || j < 0 || i >= sgW || j >= sgH ? -1 : seaGrid[j * sgW + i] ? j * sgW + i : -1; };
  App.seaBeach = (x, z, maxR, region) => {
    const key = Math.round(x / 40) + ":" + Math.round(z / 40) + ":" + (maxR || 300) + ":" + (region == null ? "" : region);
    if (seaBeaches.has(key)) return seaBeaches.get(key);
    let found = null;
    for (let r = 12; r <= (maxR || 300) && !found; r += 10) for (let a = 0; a < 6.283 && !found; a += 5 / r) {
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, c = seaCell(px, pz);
      if (c < 0 || (region != null && seaReg[c] !== region) || !App.seaAt(px, pz)) continue;
      // walk back towards the start until dry land: the beach
      for (let k = 1; k < 30; k++) {
        const lx = px - Math.cos(a) * k, lz = pz - Math.sin(a) * k;
        if (App.isLand(lx, lz)) {
          const bx = lx - Math.cos(a) * 1.2, bz = lz - Math.sin(a) * 1.2;
          if (App.isLand(bx, bz) && App.climbOK(bx, bz, bx, bz)) found = { x: bx, z: bz, cx: lx + Math.cos(a) * 8, cz: lz + Math.sin(a) * 8 };
          break;
        }
      }
    }
    seaBeaches.set(key, found);
    return found;
  };
  // the great lake in the middle of the six regions: a long oval (a stadium) along the seam between
  // the north and the south row, with a ragged shore; every region has some lake shore
  const LAKE = (App.LAKE = { L: 430, R: 235 });
  // and in its middle the Maker's Isle: the giant statue, the pilgrims round it, and behind them the Parliament
  const ISLE = (App.ISLE = { x: 0, z: 0, r: 50 });
  function lakeSd(x, z) {
    const lake = Math.hypot(Math.max(Math.abs(x) - LAKE.L, 0), z) - LAKE.R + (fbm(x * 0.006, z * 0.006, 71) - 0.5) * 60;
    return Math.max(lake, ISLE.r - Math.hypot(x - ISLE.x, z - ISLE.z));
  }
  App.lakeSd = lakeSd;
  // cells to the nearest water (negative = in water)
  function waterDist(x, z, f) {
    f = f || regionField(x, z);
    let coast = f.coast;
    for (const b of gget("landing", x, z)) { const d = Math.hypot(x - b.mx, z - b.mz); if (d < 90) coast = Math.max(coast, 40 - d * 0.3); }
    // the Maker's Isle stands even where the channel between the two middle regions runs
    return Math.max(Math.min(coast, f.chan, lakeSd(x, z)), ISLE.r - Math.hypot(x - ISLE.x, z - ISLE.z));
  }

  // for placing things: the Maker's Isle counts as water (only the statue and the Parliament stand on it)
  const placeDist = (x, z, f) => Math.min(waterDist(x, z, f), Math.hypot(x - ISLE.x, z - ISLE.z) - ISLE.r - 10);
  // ---------- terrain ----------
  function genColumn(x, z) {
    const f = regionField(x, z), R = regions[f.r];
    const dw = waterDist(x, z, f);
    if (dw < -16) return { h: 0, top: 0 };
    if (dw < 0) return { h: Math.max(1, SEA - 1 - Math.floor(-dw / 4)), top: B.WETSAND };
    let h = SEA + 1 + Math.floor(Math.min(1, dw / 18) * (R.amp * (0.5 + fbm(x * 0.011, z * 0.011, 9)) + (fbm(x * 0.04, z * 0.04, 11) - 0.5) * 2));
    if (Math.hypot(x - ISLE.x, z - ISLE.z) < ISLE.r + 2) h = Math.min(h, SEA + 2); // the Maker's Isle is low and level
    let top = 0, stony = false;
    for (const hl of gget("hill", x, z)) {
      const d = Math.hypot(x - hl.x, z - hl.z);
      if (d < hl.r) { const k = Math.pow(1 - d / hl.r, 1.25); h += Math.round(hl.h * k); if (k > 0.55) stony = true; }
    }
    for (const v of gget("lot", x, z)) {
      const d = Math.hypot(x - v.x, z - v.z);
      if (d < v.r + 6) { const k = Math.min(1, Math.max(0, (v.r + 6 - d) / 10)); h = Math.round(h + (v.h - h) * k); if (d < 6) top = B.PATH; }
    }
    for (const f of gget("field", x, z)) {
      if (f.sunk) {
        const K = f.sunk, dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz);
        const along = dx * K.fx + dz * K.fz, side = Math.abs(-dx * K.fz + dz * K.fx);
        let depth = 0;
        // rows of seats step up from the floor, one block at a time
        const tiers = K.tiers ? K.tiers * K.tw : 0;
        if (d < K.pit) depth = K.depth;
        else if (d < K.pit + tiers) depth = K.depth - 1 - Math.floor((d - K.pit) / K.tw);
        else if (d < K.pit + tiers + K.rim) depth = tiers ? 0 : K.depth * (1 - (d - K.pit) / K.rim);
        if (along > 0 && along < K.pit + K.ramp && side < K.rampW) depth = Math.max(depth, K.depth * Math.min(1, 1 - (along - K.pit) / K.ramp));
        if (depth > 0.01) { h = f.h - Math.round(depth); top = d < K.pit ? K.floor : K.edge; }
        else if (d < K.pit + (K.tiers ? K.tiers * K.tw : 0) + K.rim + 2.5) { h = f.h; if (K.tiers && d < K.pit + K.tiers * K.tw + 0.5) top = K.edge; }
        continue;
      }
      const ex = Math.abs(x - f.x) - f.w, ez = Math.abs(z - f.z) - f.d;
      if (ex <= 0 && ez <= 0) { h = f.h; top = f.kind ? (f.mud ? B.DIRT : f.sand ? B.SAND : top) : B.FARM; }
      else if (ex < 3 && ez < 3) h = Math.round(h + (f.h - h) * (1 - Math.max(ex, ez, 0) / 3));
    }
    for (const lk of gget("lake", x, z)) {
      const d = Math.hypot(x - lk.x, z - lk.z) * (1 + (fbm(x * 0.08, z * 0.08, 61) - 0.5) * 0.3);
      if (d < lk.r) return { h: SEA - 2, top: B.WETSAND };
      if (d < lk.r + 28) { h = Math.min(h, SEA + Math.floor((d - lk.r) / 1.4)); if (d < lk.r + 2.5) top = B.SAND; }
    }
    h = Math.max(1, Math.min(H - 5, h));
    if (!top) {
      if (stony && h > SEA + 6) top = B.STONE;
      else if (dw < 5 || h <= SEA + 1) top = B.SAND;
      else if (R.floor === 1) top = fbm(x * 0.03, z * 0.03, 5) > 0.58 ? B.GRASS : B.SAND;
      else if (R.floor === 4 && fbm(x * 0.03, z * 0.03, 5) > 0.66) top = B.SAND;
      else top = B.GRASS;
      for (const rd of gget("road", x, z)) if (segDist(x, z, rd) < 1.25) { top = B.PATH; break; }
    }
    return { h, top };
  }
  App.genColumn = genColumn;
  App.genHeight = (x, z) => genColumn(x, z).h;
  function segDist(x, z, s) {
    const vx = s.x2 - s.x1, vz = s.z2 - s.z1, L = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * vx + (z - s.z1) * vz) / L));
    return Math.hypot(s.x1 + vx * t - x, s.z1 + vz * t - z);
  }
  // bridge decks are built into the terrain
  App.bridgeBlock = (x, z) => {
    for (const b of gget("bridge", x, z)) {
      const px = x - b.mx, pz = z - b.mz;
      const along = px * b.dx + pz * b.dz, side = Math.abs(-px * b.dz + pz * b.dx);
      if (Math.abs(along) > b.half) continue;
      if (side < 1.6) return "deck";
      if (side < 2.4) return Math.round(along) % 4 === 0 ? "post" : "rail";
    }
    return null;
  };

  // ---------- layout ----------
  const VPREFIX = ["Coral", "Driftwood", "Sandy", "Pebble", "Lagoon", "Sunny", "Breezy", "Kelp", "Tide", "Shell", "Palm", "Ember", "Willow", "Moss", "Fern", "Cedar",
    "Lily", "Reed", "Misty", "Granite", "Echo", "Salt", "Anchor", "Barnacle", "Dune", "Seagull", "Mango", "Coconut", "Ginger", "Honey", "Starfish", "Pelican", "Otter", "Clover", "Maple", "Juniper", "Puffin", "Marigold", "Sparrow", "Cobble"];
  const VSUFFIX = { 16: ["Hollow", "Camp", "Woods", "Ridge", "Glade"], 11: ["Pond", "Marsh", "Meadow", "Brook", "Pool"], 14: ["Falls", "Peak", "Cliffs", "Gorge", "Springs"],
    3: ["Harbor", "Wharf", "Docks", "Point", "Quay"], 1: ["Beach", "Dunes", "Shore", "Cove", "Sands"], 4: ["Grove", "Oasis", "Bay", "Palms", "Isle"] };
  const POI_W = {
    16: { camp: 4, meadow: 3, pond: 1, falls: 1, grove: 1 }, 11: { pond: 5, meadow: 3, camp: 1, grove: 1 }, 14: { falls: 5, meadow: 2, camp: 1, pond: 1 },
    3: { camp: 1, grove: 1, meadow: 1, pond: 1 }, 1: { grove: 2, meadow: 1, camp: 1 }, 4: { grove: 5, meadow: 1, camp: 1, pond: 1 },
  };
  const COAST_W = { 16: { beach: 2, pier: 1 }, 11: { beach: 2, pier: 1 }, 14: { beach: 2, pier: 1 }, 3: { pier: 4, beach: 2 }, 1: { beach: 5, pier: 1 }, 4: { beach: 3, pier: 1 } };
  const POI_NAME = { camp: "camp", meadow: "meadow", pond: "duck pond", falls: "waterfall", grove: "palm grove", beach: "beach", pier: "pier", plaza: "plaza" };
  function pickW(r, w) { let tot = 0; for (const k in w) tot += w[k]; let x = r() * tot; for (const k in w) { x -= w[k]; if (x <= 0) return k; } return Object.keys(w)[0]; }

  // ---------- the plots, and who lives on them ----------
  // The land is laid out in plots that never move. Who lives on each comes from the ownership snapshot, and the
  // assignment is remembered in the save: when ownership changes, everyone who still fits keeps their plot; only
  // those who bought or sold enough to change size move, newcomers take a free plot (its sign says it is for sale),
  // and plots left empty go back up for sale. By how many Tickles a holder has:
  //   1 to 4       a house for its household, in a town shared with other small holders
  //   5 to 9       two medium houses (two-storey townhouses), in such a town
  //   10 to 19     four medium houses, on a small plot of its own
  //   20 or more   a mansion for every 20 Tickles (each bigger than four medium houses together), on a plot of its own,
  //                in the style of its region
  //   100 to 149   a fortress: walls round the plot and a castle (the keep castle) or a palace where all of them live
  //   150 to 249   a great fortress: wider walls and the great castle, or a great palace
  //   250 or more  a citadel: wider walls still and the huge castle, or a huge palace
  const GRAND = 20, MEDIUM = 10, PAIR = 5, KEEP = 100, FORT = 150, CITADEL = 250, BURN = "0x000000000000000000000000000000000000dead";
  const TOWN_HOUSES = 26, MANSION_SCALE = 1.3, MANSION_DOOR = 4.6;
  App.SETTLE = { GRAND, MEDIUM, PAIR, KEEP, FORT, CITADEL };
  // every region builds its mansions in its own style, and its fortress as a castle or a palace
  const MANSION_KIND = { 16: "mlodge", 11: "mfarm", 14: "mkeep", 3: "mcaptain", 1: "mvilla", 4: "mtropic" };
  const FORT_KIND = { 16: "castle", 11: "castle", 14: "castle", 3: "palace", 1: "palace", 4: "palace" };
  // the three kinds of fortress plot: where the castle stands from the square, the walls' middle and radius, the plot
  const FORTS = { keep: { hd: 26, off: 14, R: 36, r: 56 }, fortress: { hd: 35, off: 20, R: 50, r: 76 }, citadel: { hd: 42, off: 24, R: 60, r: 92 } };
  // the fortress's great building, by region and by the holder's size: the keep castle, the great castle or the huge
  // castle; or a palace, bigger with the holder
  const fortBuilding = (v) => {
    const t = v.kind === "citadel" ? 2 : v.kind === "fortress" ? 1 : 0;
    if (FORT_KIND[v.floor] === "palace") return { kind: "palace", scale: [2.4, 3.0, 3.6][t], door: [10.4, 12.8, 15.2][t] };
    return [{ kind: "castle2", scale: 2.4, door: 12.4 }, { kind: "castle", scale: 2.5, door: 21 }, { kind: "castle3", scale: 2.8, door: 25 }][t];
  };
  // the walls: stretches about eight blocks long, thick enough to walk along the top; a gatehouse whose towers reach
  // 3.85 blocks either side of its arch
  const WALL_SCALE = 1.4, WALL_LEN = (980 / 160) * WALL_SCALE, GATE_HALF = 4.55, WALL_TOP = (535 / 160) * WALL_SCALE, WALL_HW = (150 / 160) * WALL_SCALE;
  App.MANSION_KINDS = Object.values(MANSION_KIND);
  const mansionsOf = (n) => Math.max(1, Math.floor(n / GRAND));
  const housesOf = (n) => (n >= PAIR ? 2 : 1); // a town household's houses
  // in every region: plots for the big holders by how many mansions they hold, small plots of their own, towns
  const GRAND_CAPS = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const MEDIUM_LOTS = 22, TOWN_LOTS = 13;
  const lotR = (cls, cap) => (FORTS[cls] ? FORTS[cls].r : cls === "grand" ? Math.round(20 + 13 * Math.sqrt(cap)) : cls === "medium" ? 22 : 48);
  function lotPlan() {
    return regions.map(() => {
      const list = [{ cls: "citadel", cap: 1 }, { cls: "fortress", cap: 1 }, { cls: "keep", cap: 1 }, { cls: "keep", cap: 1 }].concat(GRAND_CAPS.map((cap) => ({ cls: "grand", cap })));
      for (let k = 0; k < TOWN_LOTS; k++) list.push({ cls: "town", cap: TOWN_HOUSES });
      for (let k = 0; k < MEDIUM_LOTS; k++) list.push({ cls: "medium", cap: 4 });
      for (const L of list) L.R = lotR(L.cls, L.cap) + 4;
      return list.sort((a, b) => b.R - a.R);
    });
  }
  // the holders in the snapshot: a plot with mansions, a small plot, or a household in a town
  function ownerGroups() {
    const N = TB.SUPPLY, groups = new Map();
    for (let id = 0; id < N; id++) {
      const o = App.ownerOf ? App.ownerOf(id) : null, key = !o || o === BURN ? "lone:" + id : o;
      (groups.get(key) || groups.set(key, []).get(key)).push(id);
    }
    return [...groups].map(([key, ids]) => ({ key, ids, n: ids.length, use: ids.length >= CITADEL ? "citadel" : ids.length >= FORT ? "fortress" : ids.length >= KEEP ? "keep" : ids.length >= GRAND ? "grand" : ids.length >= MEDIUM ? "medium" : "town", houses: housesOf(ids.length) }));
  }
  // who goes where. First everyone who can stay where the save had them (a holder keeps its plot while it still
  // fits; a town keeps its households); then those waiting in a warren, who move up to a free plot of their kind;
  // then the rest, biggest first, each to the region with the fewest Tickles so far (evenly over the six), on the
  // plot that fits best. Whoever the plots cannot hold gets a warren dug for it: there is always room for everyone.
  // A holder's Tickles keep their order (so each keeps its mansion or house) and a town's households their slots.
  function assignLots(lots, prev) {
    const groups = ownerGroups(), byKey = new Map(groups.map((g) => [g.key, g]));
    const tot = regions.map(() => 0), placed = new Set(), occ = new Array(lots.length).fill(null), warrens = [];
    const PL = (prev && prev.lots) || {}, PW = (prev && prev.warrens) || [];
    // a holder's Tickles in their order: those still owned keep their place in it, newcomers take the first gaps
    const ownOf = (g, order) => {
      const have = new Set(g.ids), ord = (order || []).map((id) => (have.has(id) ? id : -1)), inn = new Set(ord);
      let hole = 0;
      for (const id of g.ids) if (!inn.has(id)) { while (hole < ord.length && ord[hole] >= 0) hole++; if (hole < ord.length) ord[hole] = id; else ord.push(id); }
      while (ord.length && ord[ord.length - 1] < 0) ord.pop();
      return { use: g.use, holder: g.key, order: ord, ids: g.ids.slice() };
    };
    // a town: its households' holders in their slots (null where one has left); its houses counted
    const townOf = (keys, limit) => {
      const members = [], ids = [];
      let houses = 0;
      for (const key of keys || []) {
        const g = key && byKey.get(key);
        if (!g || g.use !== "town" || placed.has(key) || houses + g.houses > limit) { members.push(null); continue; }
        members.push(key); ids.push(...g.ids); houses += g.houses; placed.add(key);
      }
      while (members.length && members[members.length - 1] == null) members.pop();
      return ids.length ? { use: "town", members, ids, houses } : null;
    };
    // what a saved plot or warren still holds
    const held = (p) => {
      if (FORTS[p.use] || p.use === "grand" || p.use === "medium") {
        const g = byKey.get(p.holder);
        if (!g || g.use !== p.use || placed.has(g.key)) return null;
        placed.add(g.key);
        return ownOf(g, p.order);
      }
      return p.use === "town" ? townOf(p.members, TOWN_HOUSES + 3) : null;
    };
    const free = (pred) => lots.filter((L) => !occ[L.lot] && pred(L));
    const pickRegion = (cands) => { let best = null; for (const L of cands) if (!best || tot[L.region] < tot[best.region] || (tot[L.region] === tot[best.region] && L.lot < best.lot)) best = L; return best; };
    // the best free plot for o: a big holder the smallest plot its mansions fit on, in the region with the fewest Tickles
    const plotFor = (o) => {
      if (o.use === "grand") {
        const need = mansionsOf(o.ids.length);
        let c = free((L) => L.cls === "grand" && L.cap >= need);
        if (!c.length) c = free((L) => L.cls === "grand" && Math.ceil(L.cap * 1.25) >= need);
        if (!c.length) return null;
        const R = pickRegion(c).region;
        return c.filter((L) => L.region === R).sort((a, b) => a.cap - b.cap || a.lot - b.lot)[0];
      }
      // (with no plot of its own kind left, a fortress holder takes a bigger fortress plot, or a smaller one if its castle fits)
      const alt = { fortress: ["citadel"], keep: ["fortress", "citadel"] }[o.use] || [];
      let L = pickRegion(free((x) => x.cls === o.use));
      for (const c of alt) if (!L) L = pickRegion(free((x) => x.cls === c));
      return L;
    };
    const settle = (L, o) => { occ[L.lot] = o; tot[L.region] += o.ids.length; };
    const leastRegion = () => { let b = 0; for (let k = 1; k < tot.length; k++) if (tot[k] < tot[b]) b = k; return b; };
    // a new warren in the region with the fewest Tickles, in its first free slot there
    const dig = (o) => {
      const R = leastRegion();
      let j = 0;
      while (warrens.some((w) => w.region === R && w.j === j)) j++;
      const w = { region: R, j, o };
      warrens.push(w); tot[R] += o.ids.length;
      return w;
    };
    // 1. those who stay on their plots
    for (const k in PL) {
      const L = lots[+k], p = PL[k];
      if (!L || occ[L.lot] || (L.cls !== p.use && !(FORTS[p.use] && FORTS[L.cls] && FORTS[L.cls].r >= FORTS[p.use].r))) continue;
      if (p.use === "grand") { const g = byKey.get(p.holder); if (!g || g.use !== "grand" || Math.ceil(L.cap * 1.25) < mansionsOf(g.n)) continue; }
      const o = held(p);
      if (o) settle(L, o);
    }
    // 2. those waiting in warrens: up to a free plot of their kind if there is one; if not, they stay where they are
    const waiting = [];
    for (const p of PW) { if (!p || !regions[p.region]) continue; const o = held(p); if (o) waiting.push({ p, o }); }
    for (const { p, o } of waiting) {
      const L = plotFor(o);
      if (L) settle(L, o);
      else { warrens.push({ region: p.region, j: p.j, o }); tot[p.region] += o.ids.length; }
    }
    // 3. the holders with plots of their own still to place, biggest first
    for (const g of groups.filter((x) => x.use !== "town" && !placed.has(x.key)).sort((a, b) => b.n - a.n || (a.key < b.key ? -1 : 1))) {
      placed.add(g.key);
      const o = ownOf(g, null), L = plotFor(o);
      if (L) settle(L, o); else dig(o);
    }
    // 4. the households of the towns: a town with room, or a new town on a free plot, or a warren town with room,
    // or a new warren
    const room = (o, g) => o.use === "town" && o.houses + g.houses <= TOWN_HOUSES;
    const join = (o, g) => { const k = o.members.indexOf(null); if (k >= 0) o.members[k] = g.key; else o.members.push(g.key); o.ids.push(...g.ids); o.houses += g.houses; };
    for (const g of groups.filter((x) => x.use === "town" && !placed.has(x.key)).sort((a, b) => hash2(a.ids[0], 3, 1203) - hash2(b.ids[0], 3, 1203))) {
      placed.add(g.key);
      let L = pickRegion(lots.filter((x) => occ[x.lot] && room(occ[x.lot], g)));
      if (!L) { L = plotFor({ use: "town" }); if (L) settle(L, { use: "town", members: [], ids: [], houses: 0 }); }
      if (L) { join(occ[L.lot], g); tot[L.region] += g.n; continue; }
      let w = null;
      for (const x of warrens) if (room(x.o, g) && (!w || tot[x.region] < tot[w.region])) w = x;
      if (!w) w = dig({ use: "town", members: [], ids: [], houses: 0 });
      join(w.o, g); tot[w.region] += g.n;
    }
    // who lives in which building: a big holder's Tickles shared out over its mansions, a small plot's over its four
    // houses, a town's by household
    const split = (list, k) => { const out = []; for (let i = 0; i < k; i++) out.push(list.slice(Math.round((i * list.length) / k), Math.round(((i + 1) * list.length) / k))); return out; };
    const slotsOf = (o) => (o.use === "town" ? o.members.map((k) => (k ? byKey.get(k).ids : null)) : split(o.order.filter((id) => id >= 0), FORTS[o.use] ? 1 : o.use === "grand" ? mansionsOf(o.ids.length) : 4));
    for (const o of occ) if (o) o.slots = slotsOf(o);
    for (const w of warrens) w.o.slots = slotsOf(w.o);
    return { occ, warrens };
  }
  // ---------- the walk along the top of a fortress's walls ----------
  // Every stretch of wall has a deck on top (like a jetty's): whoever stands on it stands at the top of the wall. The
  // guards of the fortress walk it in turns, up and down from the gates (App.wallWatch).
  const wallGrid = new Map(), WG = 8, wgk = (cx, cz) => cx * 100003 + cz;
  function addWallDeck(d) {
    App.wallDecks.push(d);
    const r = d.hl + 1;
    for (let cx = Math.floor((d.x - r) / WG); cx <= Math.floor((d.x + r) / WG); cx++) for (let cz = Math.floor((d.z - r) / WG); cz <= Math.floor((d.z + r) / WG); cz++) {
      const k = wgk(cx, cz);
      (wallGrid.get(k) || wallGrid.set(k, []).get(k)).push(d);
    }
  }
  App.wallDeckY = (x, z) => {
    const list = wallGrid.get(wgk(Math.floor(x / WG), Math.floor(z / WG)));
    if (list) for (const p of list) { const dx = x - p.x, dz = z - p.z, al = dx * p.ux + dz * p.uz, sd = dx * p.uz - dz * p.ux; if (al > -p.hl && al < p.hl && sd > -p.hw && sd < p.hw) return p.y; }
    return null;
  };
  // who keeps watch on the walls today, and when: about one in ten of a fortress's Tickles, each day a turn in the
  // morning, the afternoon or the evening (or a day off), between one gate and the next
  App.wallWatch = (id, day, v) => {
    if (!v || !v.walls || App.hash2(id, 401, 3) > 0.1) return null;
    const turn = Math.floor(App.hash2(id, day, 403) * 4);
    if (turn === 3) return null;
    const W = v.walls, G = W.gates, gi = Math.floor(App.hash2(id, day, 405) * G.length), a = G[gi], b = gi + 1 < G.length ? G[gi + 1] : G[0] + Math.PI * 2;
    const ww = { x: W.x, z: W.z, r: W.r, a, b, off: App.hash2(id, day, 407) };
    const p = { x: W.x + Math.cos(a) * (W.r - 3.5), z: W.z + Math.sin(a) * (W.r - 3.5), label: "on the walls of " + v.name, cx: W.x, cz: W.z };
    const [s, e] = [[540, 720], [900, 1080], [1200, 1380]][turn];
    return { k: "wallwatch", s, e, p, ww };
  };
  // an evening turn on the walls, for a fortress whose people do not all go to the fire (population.js)
  App.wallWatchAt = (id, day, v, s, e) => {
    if (!v || !v.walls) return null;
    const W = v.walls, G = W.gates, gi = Math.floor(App.hash2(id, day, 409) * G.length), a = G[gi], b = gi + 1 < G.length ? G[gi + 1] : G[0] + Math.PI * 2;
    const ww = { x: W.x, z: W.z, r: W.r, a, b, off: App.hash2(id, day, 411) };
    return { k: "wallwatch", s, e, p: { x: W.x + Math.cos(a) * (W.r - 3.5), z: W.z + Math.sin(a) * (W.r - 3.5), label: "on the walls of " + v.name + " (evening watch)", cx: W.x, cz: W.z }, ww };
  };
  // where a guard is on its round, so many minutes after climbing up: along the top from its gate to the next and back
  App.wallPos = (ww, mins) => {
    const gh = (GATE_HALF + 1.4) / ww.r, a0 = ww.a + gh, span = Math.max(0.05, ww.b - ww.a - 2 * gh), L = span * ww.r, per = (2 * L) / 1.2;
    const u = ((mins + ww.off * per) % per) / per, f = u < 0.5 ? u * 2 : 2 - u * 2, ang = a0 + span * f, dir = u < 0.5 ? 1 : -1;
    return { x: ww.x + Math.cos(ang) * ww.r, z: ww.z + Math.sin(ang) * ww.r, h: Math.atan2(-Math.sin(ang) * dir, Math.cos(ang) * dir) };
  };
  App.buildWorld = (residentsByFloor, clanOf) => {
    const villages = (App.villages = []), pois = (App.pois = []), bridges = (App.bridges = []), roads = (App.roads = []);
    App.sceneryAll = [];
    const r0 = rng(1234567);
    // bridges: two per pair of neighbouring regions
    for (const [a, b] of ADJ) {
      const A = regions[a], Bq = regions[b];
      const mx = (A.cx + Bq.cx) / 2, mz = (A.cz + Bq.cz) / 2;
      const L = Math.hypot(Bq.cx - A.cx, Bq.cz - A.cz), dx = (Bq.cx - A.cx) / L, dz = (Bq.cz - A.cz) / L;
      for (const off of [-210, 190]) {
        let bx = mx - dz * off, bz = mz + dx * off;
        const half = 34;
        // the channel wanders, so the bridge goes where the water actually is along this line
        let bestT = 0, bestC = Infinity;
        for (let t = -170; t <= 170; t += 2) {
          const f = regionField(bx + dx * t, bz + dz * t);
          if (!((f.r === a && f.r2 === b) || (f.r === b && f.r2 === a))) continue;
          if (f.chan < bestC) { bestC = f.chan; bestT = t; }
        }
        bx += dx * bestT; bz += dz * bestT;
        if (lakeSd(bx, bz) < 70) continue; // under the lake: the ferries cross there instead
        const br = { a, b, mx: bx, mz: bz, dx, dz, half, ax: bx - dx * (half + 4), az: bz - dz * (half + 4), bx: bx + dx * (half + 4), bz: bz + dz * (half + 4) };
        bridges.push(br);
        gadd("bridge", br, bx - half - 4, bz - half - 4, bx + half + 4, bz + half + 4);
        gadd("landing", br, bx - 90, bz - 90, bx + 90, bz + 90);
      }
    }
    const usedName = new Set();
    const nameFor = (floor, r) => {
      for (let k = 0; k < 50; k++) {
        const n = VPREFIX[Math.floor(r() * VPREFIX.length)] + " " + VSUFFIX[floor][Math.floor(r() * VSUFFIX[floor].length)];
        if (!usedName.has(n)) { usedName.add(n); return n; }
      }
      return "Village " + (usedName.size + 1);
    };
    // every holder has its own place (App.SETTLE): an estate from 20 Tickles (its manor in the middle and a house
    // for each Tickle), a mansion from 5 to 19 (all of them under one roof, the bigger the more of them), and the
    // small holders (1 to 4) a house each in towns shared with others. They are spread evenly over the six
    // regions, the biggest placed first; every place is its own clan.
    const PLAN = lotPlan();
    for (const R of regions) {
      const plan = PLAN[R.i];
      const r = rng(R.i * 7919 + 13);
      // candidate spots on a jittered grid inside the region, not too close to the water
      const cands = [];
      for (let gx = -560; gx <= 560; gx += 26) for (let gz = -560; gz <= 560; gz += 26) {
        const x = R.cx + gx + (r() - 0.5) * 20, z = R.cz + gz + (r() - 0.5) * 20;
        const f = regionField(x, z);
        if (f.r !== R.i) continue;
        const dw = placeDist(x, z, f);
        if (dw > 30) cands.push({ x, z, dw });
      }
      // the biggest first, each where it keeps furthest from those already placed
      const placed = [];
      for (const pl of plan) {
        let best = null, bs = -Infinity;
        for (const c of cands) {
          if (c.dw < Math.min(55, pl.R * 0.45)) continue;
          let clear = 1e9;
          for (const q of placed) { const d = Math.hypot(q.x - c.x, q.z - c.z) - q.R - pl.R; if (d < clear) clear = d; }
          // big plots prefer the middle of the region, the rest anywhere with room
          const score = Math.min(clear, 60) - (pl.R > 60 ? Math.hypot(c.x - R.cx, c.z - R.cz) * 0.05 : 0) + c.dw * 0.02;
          if (score > bs) { bs = score; best = c; }
        }
        if (!best) best = cands[Math.floor(r() * cands.length)] || { x: R.cx, z: R.cz, dw: 60 };
        placed.push({ x: best.x, z: best.z, R: pl.R });
        const name = nameFor(R.floor, r) + (pl.cls === "fortress" ? " Castle" : pl.cls === "grand" ? " Estate" : pl.cls === "medium" ? " Lodge" : "");
        const v = { i: villages.length, lot: villages.length, region: R.i, floor: R.floor, cls: pl.cls, cap: pl.cap, x: best.x, z: best.z, r: lotR(pl.cls, pl.cap),
          h: SEA + 2 + Math.floor(Math.min(1, best.dw / 18) * R.amp * 0.5), name, residents: [], homes: [], houses: [], households: [] };
        v.style = Math.floor(hash2(v.i, 7, 1201) * TB.CLANS.length);
        villages.push(v);
        gadd("lot", v, v.x - v.r - 8, v.z - v.r - 8, v.x + v.r + 8, v.z + v.r + 8);
      }
      // places between villages
      for (let gx = -560; gx <= 560; gx += 50) for (let gz = -560; gz <= 560; gz += 50) {
        const x = R.cx + gx + (r() - 0.5) * 36, z = R.cz + gz + (r() - 0.5) * 36;
        const f = regionField(x, z);
        if (f.r !== R.i) continue;
        const dw = placeDist(x, z, f);
        if (dw < 4) continue;
        if (villages.some((v) => v.region === R.i && Math.hypot(v.x - x, v.z - z) < v.r + 24)) continue;
        if (bridges.some((b) => Math.hypot(b.mx - x, b.mz - z) < 50)) continue;
        let type;
        if (dw < 24) type = pickW(r, COAST_W[R.floor]);
        else type = pickW(r, POI_W[R.floor]);
        if ((type === "pond" && dw < 40) || (type === "falls" && dw < 50)) type = "meadow";
        const p = { i: pois.length, region: R.i, type, x, z, name: POI_NAME[type] };
        if (type === "pond") { p.lake = { x, z, r: 9 + r() * 8 }; gadd("lake", p.lake, x - 50, z - 50, x + 50, z + 50); }
        if (type === "falls") {
          p.hill = { x, z, r: 24 + r() * 12, h: 9 + Math.floor(r() * 6) };
          gadd("hill", p.hill, x - p.hill.r, z - p.hill.r, x + p.hill.r, z + p.hill.r);
          // the waterfall pours into a pool at the foot of the hill
          p.fallA = r() * 6.28;
          const pr = 5 + r() * 2, pd = p.hill.r * 0.42 + pr + 1.5;
          p.pool = { x: x + Math.cos(p.fallA) * pd, z: z + Math.sin(p.fallA) * pd, r: pr };
          gadd("lake", p.pool, p.pool.x - 50, p.pool.z - 50, p.pool.x + 50, p.pool.z + 50);
        }
        pois.push(p);
      }
      // extra hills to shape the land
      const extra = R.floor === 14 ? 10 : R.floor === 16 ? 7 : 2;
      for (let k = 0; k < extra; k++) {
        const x = R.cx + (r() - 0.5) * 760, z = R.cz + (r() - 0.5) * 760;
        if (regionField(x, z).r !== R.i || placeDist(x, z) < 40) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 40)) continue;
        const hl = { x, z, r: 30 + r() * 30, h: 6 + Math.floor(r() * (R.floor === 14 ? 10 : 6)) };
        gadd("hill", hl, x - hl.r, z - hl.r, x + hl.r, z + hl.r);
      }
    }
    // roads: each village to its two nearest neighbours, and bridges to the nearest village
    const seen = new Set();
    const addRoad = (x1, z1, x2, z2) => {
      const s = { x1, z1, x2, z2 };
      roads.push(s);
      gadd("road", s, Math.min(x1, x2) - 3, Math.min(z1, z2) - 3, Math.max(x1, x2) + 3, Math.max(z1, z2) + 3);
    };
    for (const v of villages) {
      const near = villages.filter((o) => o !== v && o.region === v.region).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z)).slice(0, 2);
      for (const o of near) { const k = Math.min(v.i, o.i) + "-" + Math.max(v.i, o.i); if (!seen.has(k)) { seen.add(k); addRoad(v.x, v.z, o.x, o.z); } }
    }
    for (const b of bridges) for (const [rid, ex, ez] of [[b.a, b.ax, b.az], [b.b, b.bx, b.bz]]) {
      const v = villages.filter((o) => o.region === rid).sort((p, q) => Math.hypot(p.x - ex, p.z - ez) - Math.hypot(q.x - ex, q.z - ez))[0];
      if (v) addRoad(ex, ez, v.x, v.z);
    }
    // docks on the great lake, one per region where the walk in from its centre first meets the lake,
    // joined to the nearest village by a road
    const docks = (App.docks = []);
    for (const R of regions) {
      const ax = Math.max(-LAKE.L, Math.min(LAKE.L, R.cx)), az = 0;
      let land = null;
      for (let t = 0; t <= 1.0001; t += 0.002) {
        const x = R.cx + (ax - R.cx) * t, z = R.cz + (az - R.cz) * t;
        if (regionField(x, z).r !== R.i) break;
        if (waterDist(x, z) < 1.5) { land = { x, z }; break; }
      }
      if (!land) continue;
      const L0 = Math.hypot(ax - R.cx, az - R.cz), ux = (ax - R.cx) / L0, uz = (az - R.cz) / L0;
      land = { x: Math.round(land.x - ux * 2), z: Math.round(land.z - uz * 2) };
      const D = { i: docks.length, region: R.i, x: land.x, z: land.z, ux, uz, rot: Math.atan2(ux, uz), name: R.name + " Dock",
        land: { x: land.x - ux * 1.5, z: land.z - uz * 1.5 }, berth: { x: land.x + ux * 16.5, z: land.z + uz * 16.5 } }; // the ferry's stern just off the end of the jetty
      docks.push(D);
      const v = villages.filter((o) => o.region === R.i).sort((p, q) => Math.hypot(p.x - land.x, p.z - land.z) - Math.hypot(q.x - land.x, q.z - land.z))[0];
      if (v) addRoad(land.x - ux * 3, land.z - uz * 3, v.x, v.z);
    }
    // three ferry lines across the lake, north shore to south shore
    const ferries = (App.ferries = []);
    for (const [a, b] of [[0, 3], [1, 4], [2, 5]]) {
      const A = docks.find((d) => d.region === a), Bd = docks.find((d) => d.region === b);
      if (!A || !Bd) continue;
      const path = [A.berth];
      let open = true;
      for (let k = 1; k < 24; k++) { const x = A.berth.x + ((Bd.berth.x - A.berth.x) * k) / 24, z = A.berth.z + ((Bd.berth.z - A.berth.z) * k) / 24; if (waterDist(x, z) > -4) open = false; }
      if (!open) path.push({ x: Math.max(-LAKE.L, Math.min(LAKE.L, (A.berth.x + Bd.berth.x) / 2)), z: 0 });
      if (Math.abs((A.berth.x + Bd.berth.x) / 2 - ISLE.x) < ISLE.r + 20) path.splice(1, path.length - 1, { x: ISLE.x + ISLE.r + 22, z: ISLE.z - 18 }, { x: ISLE.x + ISLE.r + 22, z: ISLE.z + 18 });
      path.push(Bd.berth);
      let len = 0;
      for (let k = 1; k < path.length; k++) len += Math.hypot(path[k].x - path[k - 1].x, path[k].z - path[k - 1].z);
      ferries.push({ i: ferries.length, a: A.i, b: Bd.i, path, len, name: regions[a].name + " \u2013 " + regions[b].name + " Ferry" });
      A.ferry = Bd.ferry = ferries.length - 1;
    }
    // a pilgrims' launch from every dock to the Maker's Isle
    for (const D of docks) {
      const a = Math.atan2(D.berth.z - ISLE.z, D.berth.x - ISLE.x), c = Math.cos(a), s = Math.sin(a);
      const berth = { x: ISLE.x + c * (ISLE.r + 8), z: ISLE.z + s * (ISLE.r + 8) }, land = { x: ISLE.x + c * (ISLE.r - 3), z: ISLE.z + s * (ISLE.r - 3) };
      const path = [D.berth, berth], len = Math.hypot(berth.x - D.berth.x, berth.z - D.berth.z);
      ferries.push({ i: ferries.length, a: D.i, b: -1, launch: true, isleLand: land, path, len, name: regions[D.region].name + " Pilgrims' Launch" });
      D.launch = ferries.length - 1;
    }
    // who lives on which plot (and who in a warren): the snapshot, with the assignment of the save the game was
    // started with kept wherever it still fits
    const SB = App.bootSave, prevPlots = SB && SB.layout === App.LAYOUT && SB.plots ? SB.plots : null;
    const ASSIGN = assignLots(villages, prevPlots);
    const keep = (o) => (o.use === "town" ? { use: "town", members: o.members } : { use: o.use, holder: o.holder, order: o.order });
    App.plotsAssigned = { lots: {}, warrens: ASSIGN.warrens.map((w) => Object.assign({ region: w.region, j: w.j }, keep(w.o))) };
    const occupy = (v, o) => { v.kind = o.use; v.vacant = false; v.holder = o.holder || null; v.slots = o.slots; v.households = o.slots.filter(Boolean); v.residents = o.ids; };
    villages.forEach((v, li) => {
      const o = ASSIGN.occ[li];
      if (o) { occupy(v, o); App.plotsAssigned.lots[li] = keep(o); }
      else { v.kind = "vacant"; v.vacant = true; v.holder = null; v.slots = []; v.households = []; v.residents = []; }
    });
    // the square: town hall and granary (where a house for every household will stand round it, last of all)
    const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    for (const v of villages) {
      const r = rng(v.i * 131 + 17);
      let ha = r() * 6.28;
      // the hall: a town hall in a town; on a holder's own plot the spot where its first mansion (or house) stands
      const fk = FORT_KIND[v.floor];
      v.hallScale = FORTS[v.cls] ? 2.5 : v.cls === "grand" ? MANSION_SCALE : 1;
      const hd = FORTS[v.cls] ? FORTS[v.cls].hd : v.cls === "grand" ? 24 : v.cls === "medium" ? 11 : 13;
      // a castle or a mansion is big: it goes on the side of the square furthest from the roads
      if (FORTS[v.cls] || v.cls === "grand") {
        let best = ha, bd = -1;
        for (let k = 0; k < 16; k++) {
          const a = ha + (k / 16) * 6.28, x = v.x + Math.cos(a) * hd, z = v.z + Math.sin(a) * hd;
          const d = Math.min(99, ...App.gridNear("road", x, z, 40).map((rd) => segDist(x, z, rd)));
          if (d > bd + 0.5) { bd = d; best = a; }
        }
        ha = best;
      }
      const dd = FORTS[v.cls] ? hd - 14 : v.cls === "grand" ? hd - MANSION_DOOR : v.cls === "medium" ? hd - 2.7 : 9;
      v.hall = { x: v.x + Math.cos(ha) * hd, z: v.z + Math.sin(ha) * hd };
      v.hall.rot = faceTo(v.hall.x, v.hall.z, v.x, v.z);
      v.hall.door = { x: v.x + Math.cos(ha) * dd, z: v.z + Math.sin(ha) * dd };
      const ga = ha + 2.3 + r() * 0.6;
      v.granary = { x: v.x + Math.cos(ga) * 12, z: v.z + Math.sin(ga) * 12 };
      v.granary.rot = faceTo(v.granary.x, v.granary.z, v.x, v.z);
    }
    // scenery
    // the on-chain pier (cut from the Pier floor): about 7 blocks square once scaled, its boards just off the ground
    const PIER_TOP = 0.18 * 1.25, PIER_HALF = 3.3;
    App.pierDecks = [];
    const sc = (type, x, z, rot, extra) => {
      if (!(extra && extra.water) && genColumn(x, z).h < SEA) return null; // nothing but ducks and piers in the water
      const s = Object.assign({ type, x, z, rot, idx: App.sceneryAll.length }, extra || {}); App.sceneryAll.push(s); gadd("scenery", s, x, z, x, z); return s;
    };
    // the jetty starts at the bank and runs out over the lake to where the ferry moors (App.JETTY: along the dock's u)
    for (const D of App.docks) D.sc = sc("dock_0", D.x + D.ux * App.JETTY.mid, D.z + D.uz * App.JETTY.mid, D.rot, { building: true, fixed: true, water: true, dock: D.i });
    for (const v of villages) {
      const r = rng(v.i * 31 + 7), hide = v.vacant ? { gone: true } : {};
      v.fire = sc("campfire", v.x, v.z, r() * 6.28, hide);
      v.logs = [];
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.4; v.logs.push(sc("logseat", v.x + Math.cos(a) * 4.2, v.z + Math.sin(a) * 4.2, a, hide)); }
      const deco = { 16: "grass16", 11: "grass11", 14: "grass14", 3: "grass4", 1: "palm", 4: "palm" }[v.floor];
      for (let k = 0; k < 3; k++) {
        const a = r() * 6.28, d = 6 + r() * 2, x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
        if (Math.hypot(x - v.hall.x, z - v.hall.z) > 5 && Math.hypot(x - v.granary.x, z - v.granary.z) > 4) sc(deco, x, z, r() * 6.28);
      }
      v.hall.sc = v.cls === "town" ? sc("townhall_" + v.style, v.hall.x, v.hall.z, v.hall.rot, Object.assign({ building: true, village: v.i, hall: true }, hide)) : null;
      v.granary.sc = sc("granary_0", v.granary.x, v.granary.z, v.granary.rot, Object.assign({ building: true, village: v.i, granary: true }, hide));
      // a plot for sale: a sign in the middle of it
      v.sign = sc("plotsign_0", v.x, v.z + 2, r() * 0.6 - 0.3, Object.assign({ lot: v.lot, forSale: true }, v.vacant ? {} : { gone: true }));
      // the altar between the town hall and the fire, where the village brings its fallen back
      const aa = Math.atan2(v.hall.z - v.z, v.hall.x - v.x);
      v.altar = { x: v.x + Math.cos(aa) * 6.6, z: v.z + Math.sin(aa) * 6.6 };
      sc("altar_0", v.altar.x, v.altar.z, Math.atan2(v.x - v.altar.x, v.z - v.altar.z), Object.assign({ building: true, village: v.i, fixed: true }, hide));
      v.plaza = { x: v.x, z: v.z };
    }
    for (const p of pois) {
      const r = rng(p.i * 53 + 11);
      const around = (type, n, rad, minR) => { for (let k = 0; k < n; k++) { const a = r() * 6.28, d = (minR || 0) + r() * rad; sc(type, p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, r() * 6.28); } };
      if (p.type === "camp") { sc("campfire", p.x, p.z, r() * 6.28); for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28; sc("logseat", p.x + Math.cos(a) * 4, p.z + Math.sin(a) * 4, -a); } around("grass16", 3, 10, 6); }
      else if (p.type === "meadow") { around("grass14", 3, 12); around("grass4", 2, 12); around("logseat", 1, 4); }
      else if (p.type === "pond") {
        // many ponds are fed by a little waterfall coming off a rocky bank
        if (r() < (p.region != null && (regions[p.region].floor === 14 || regions[p.region].floor === 11) ? 0.6 : 0.35)) {
          const a = r() * 6.28, L = p.lake;
          const hl = { x: L.x + Math.cos(a) * (L.r + 11), z: L.z + Math.sin(a) * (L.r + 11), r: 12 + r() * 4, h: 6 + Math.floor(r() * 4) };
          gadd("hill", hl, hl.x - hl.r, hl.z - hl.r, hl.x + hl.r, hl.z + hl.r);
          sc("waterfall", L.x + Math.cos(a) * (L.r + 3.2), L.z + Math.sin(a) * (L.r + 3.2), Math.atan2(-Math.cos(a), -Math.sin(a)), { feeds: p.i });
          for (const da of [-0.55, 0.55]) if (r() < 0.8) sc("boulders", L.x + Math.cos(a + da) * (L.r + 5.5), L.z + Math.sin(a + da) * (L.r + 5.5), r() * 6.28);
          p.fall = a;
        }
        for (let k = 0; k < 3 + Math.floor(r() * 4); k++) { const a = r() * 6.28, d = r() * p.lake.r * 0.7; sc("duck", p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, r() * 6.28, { water: true, pond: p.i }); } around("grass11", 5, 4, p.lake.r + 1); if (r() < 0.7) around("umbrella", 1 + Math.floor(r() * 2), 3, p.lake.r + 3); }
      else if (p.type === "falls") { const a = p.fallA != null ? p.fallA : r() * 6.28; sc("waterfall", p.x + Math.cos(a) * p.hill.r * 0.42, p.z + Math.sin(a) * p.hill.r * 0.42, Math.atan2(Math.cos(a), Math.sin(a))); around("boulders", 2, p.hill.r * 0.4, p.hill.r * 0.5); around("grass14", 3, 10, p.hill.r * 0.7); p.spot = { x: p.x + Math.cos(a) * p.hill.r * 0.75, z: p.z + Math.sin(a) * p.hill.r * 0.75 }; }
      else if (p.type === "grove") around("palm", 6 + Math.floor(r() * 4), 12), around("grass4", 2, 10);
      else if (p.type === "beach") {
        const sh = shoreFrom(p.x, p.z);
        if (sh) {
          for (let k = 0; k < 3 + Math.floor(r() * 3); k++) {
            const a = sh.a + (r() - 0.5) * 1.2, d = Math.max(1, sh.d - 3 - r() * 4);
            const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
            if (genColumn(x, z).h >= SEA + 1) sc("umbrella", x, z, r() * 6.28);
          }
          p.spot = { x: p.x + Math.cos(sh.a) * Math.max(1, sh.d - 5), z: p.z + Math.sin(sh.a) * Math.max(1, sh.d - 5) };
        }
        around("palm", 1, 8, 6);
      }
      else if (p.type === "pier") {
        // walk towards the water: the pier starts on the bank and runs out over the water, its boards level with
        // the bank, so it can be walked on (App.pierDecks, world.js)
        let best = null;
        for (let k = 0; k < 16 && !best; k++) {
          const a = (k / 16) * 6.28;
          for (let d = 2; d < 36; d += 1.5) { const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (genColumn(x, z).h < SEA) { best = { a, x: x + Math.cos(a) * 2.5, z: z + Math.sin(a) * 2.5, d }; break; } }
        }
        if (best) {
          // the water's edge: back along the line to the last dry cell
          let ex = best.x, ez = best.z;
          for (let k = 0; k < 12; k++) { const x = ex - Math.cos(best.a) * 0.5, z = ez - Math.sin(best.a) * 0.5; ex = x; ez = z; if (genColumn(x, z).h >= SEA) break; }
          const bank = Math.max(SEA, genColumn(ex - Math.cos(best.a) * 1.5, ez - Math.sin(best.a) * 1.5).h);
          const cx = ex + Math.cos(best.a) * 2.2, cz = ez + Math.sin(best.a) * 2.2, rot = Math.atan2(Math.cos(best.a), Math.sin(best.a)) + Math.PI / 2;
          const ps = sc("pier", cx, cz, rot, { water: true });
          if (ps) { ps.y = bank + 0.12 - PIER_TOP; ps.deckY = bank + 0.12; App.pierDecks.push({ x: cx, z: cz, ux: Math.cos(best.a), uz: Math.sin(best.a), y: bank + 0.12, hl: PIER_HALF, hw: PIER_HALF }); }
          p.spot = { x: best.x - Math.cos(best.a) * 4, z: best.z - Math.sin(best.a) * 4 };
          const ua = best.a + (r() < 0.5 ? 1.2 : -1.2), ux = p.spot.x + Math.cos(ua) * 4, uz = p.spot.z + Math.sin(ua) * 4;
          if (genColumn(ux, uz).h >= SEA + 1) sc("umbrella", ux, uz, r() * 6.28);
        }
      }
    }
    for (const p of pois) gadd("poi", p, p.x, p.z, p.x, p.z);
    App.poisIndexed = true;
    const fields = (App.fields = []);
    App.pens = [];
    for (const v of villages) {
      const r = rng(v.i * 977 + 3);
      v.fields = [];
      const want = 2 + (r() < 0.5 ? 1 : 0);
      for (let tries = 0; tries < 60 && v.fields.length < want; tries++) {
        const a = r() * 6.28, d = v.r + 9 + r() * 10;
        const x = Math.round(v.x + Math.cos(a) * d) + 0.5, z = Math.round(v.z + Math.sin(a) * d) + 0.5, w = 5 + Math.floor(r() * 2), dd = 4 + Math.floor(r() * 2);
        const col = genColumn(x, z);
        if (col.h < SEA + 2 || placeDist(x, z) < 12) continue;
        if ([[-w, -dd], [w, -dd], [-w, dd], [w, dd]].some(([ox, oz]) => { const c = genColumn(x + ox, z + oz); return c.h < SEA + 1 || Math.abs(c.h - col.h) > 2; })) continue;
        if (App.gridNear("road", x, z, 30).some((rd) => segDist(x, z, rd) < Math.max(w, dd) + 3)) continue;
        if (App.gridNear("field", x, z, 40).some((f) => Math.abs(f.x - x) < f.w + w + 4 && Math.abs(f.z - z) < f.d + dd + 4)) continue;
        if (villages.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 12)) continue;
        if (App.gridNear("poi", x, z, 40).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 14 : p.hill ? p.hill.r + 6 : 16))) continue;
        if (bridges.some((b) => Math.hypot(b.mx - x, b.mz - z) < 60)) continue;
        const f = { i: fields.length, x, z, w, d: dd, h: col.h, village: v.i, crop: r() < 0.6 ? "wheat" : "cabbage" };
        fields.push(f); v.fields.push(f);
        gadd("field", f, x - w - 3, z - dd - 3, x + w + 3, z + dd + 3);
      }
      // the farm, just outside the houses: a fenced pig pen (mud, a shed and a trough), a hen yard with
      // its hen house, and a sheepfold where the flock sleeps. Each has a gate facing the village.
      const penFits = (x, z, w, d) => {
        const col = genColumn(x, z);
        if (col.h < SEA + 2 || placeDist(x, z) < 10) return null;
        if ([[-w, -d], [w, -d], [-w, d], [w, d]].some(([ox, oz]) => { const c = genColumn(x + ox, z + oz); return c.h < SEA + 1 || Math.abs(c.h - col.h) > 2; })) return null;
        if (App.gridNear("road", x, z, 25).some((rd) => segDist(x, z, rd) < Math.max(w, d) + 2.5)) return null;
        if (App.gridNear("field", x, z, 30).some((f) => Math.abs(f.x - x) < f.w + w + 3 && Math.abs(f.z - z) < f.d + d + 3)) return null;
        if (villages.some((o) => o !== v && Math.hypot(o.x - x, o.z - z) < o.r + 8)) return null;
        if (App.gridNear("poi", x, z, 30).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 10 : p.hill ? p.hill.r + 4 : 12))) return null;
        return col.h;
      };
      const makePen = (kind, w, d, mud) => {
        for (let tries = 0; tries < 70; tries++) {
          const a = r() * 6.28, dd = v.r + w + 3 + r() * 12;
          const x = Math.round(v.x + Math.cos(a) * dd), z = Math.round(v.z + Math.sin(a) * dd);
          const h = penFits(x, z, w, d);
          if (h == null) continue;
          // the gate goes in the middle of the side that faces the village
          const ux = v.x - x, uz = v.z - z, alongX = Math.abs(uz) * w >= Math.abs(ux) * d;
          const sx = alongX ? 0 : Math.sign(ux), sz = alongX ? Math.sign(uz) : 0;
          const pen = { kind, x, z, w, d, h, mud, village: v.i,
            gateIn: { x: x + sx * (w - 1.2), z: z + sz * (d - 1.2) }, gateOut: { x: x + sx * (w + 1.6), z: z + sz * (d + 1.6) }, gateSide: [sx, sz] };
          gadd("field", pen, x - w - 3, z - d - 3, x + w + 3, z + d + 3);
          return pen;
        }
        return null;
      };
      // odd half-sizes, so a stretch of fence sits in the middle of every side and can be left out for the gate
      v.pen = makePen("pigs", 5, 3, true);
      v.yard = makePen("chickens", 3, 3, false);
      v.fold = makePen("sheep", 5, 5, false);
      v.pens = [v.pen, v.yard, v.fold].filter(Boolean);
      for (const pen of v.pens) App.pens.push(pen);
      v.pasture = v.fold ? { x: v.fold.x, z: v.fold.z, r: 3 } : { x: v.x + v.r + 6, z: v.z, r: 6 };
      const meadow = App.poisNear(v.x, v.z, 150, (p) => p.type === "meadow").sort((p, q) => Math.hypot(p.x - v.x, p.z - v.z) - Math.hypot(q.x - v.x, q.z - v.z))[0];
      v.grazing = meadow ? { x: meadow.x, z: meadow.z, r: 9 } : { x: v.pasture.x + (v.pasture.x - v.x) * 0.6, z: v.pasture.z + (v.pasture.z - v.z) * 0.6, r: 9 };
      // where its hunters and gatherers go
      const wild = App.poisNear(v.x, v.z, 240, (p) => p.type === "meadow" || p.type === "camp" || p.type === "falls" || p.type === "grove").sort((p, q) => Math.hypot(p.x - v.x, p.z - v.z) - Math.hypot(q.x - v.x, q.z - v.z));
      const hp = wild.find((p) => p.type !== "grove") || wild[0];
      v.hunt = hp ? { x: hp.x, z: hp.z, poi: hp.i } : { x: v.x + v.r + 50, z: v.z, poi: -1 };
      const gp = wild.find((p) => p.type === "grove") || wild[0];
      v.gather = gp ? { x: gp.x, z: gp.z, poi: gp.i } : { x: v.x, z: v.z + v.r + 40, poi: -1 };
    }
    for (const pen of App.pens) {
      const { x, z, w, d } = pen, [gx, gz] = pen.gateSide;
      const edge = (along, fixed, horiz, side) => {
        const L = 2 * (horiz ? w : d);
        for (let k = 0; k < L / 2; k++) {
          const t = -L / 2 + 1 + k * 2;
          // leave the middle stretch of the gate side open
          if (side && Math.abs(t) < 0.5) continue;
          if (horiz) sc("fence_0", x + t, z + fixed, 0, { building: true, fence: true });
          else sc("fence_0", x + fixed, z + t, Math.PI / 2, { building: true, fence: true });
        }
      };
      edge(0, -d, true, gz === -1); edge(0, d, true, gz === 1); edge(0, -w, false, gx === -1); edge(0, w, false, gx === 1);
      const back = Math.atan2(gx, gz); // facing the gate
      if (pen.kind === "pigs") {
        sc("sty_0", x - gx * (w - 1.6), z - gz * (d - 1.6), back, { building: true });
        sc("trough_0", x + gz * 1.5, z + gx * 1.5, back + Math.PI / 2, { building: true });
        pen.trough = { x: x + gz * 1.5, z: z + gx * 1.5 };
      } else if (pen.kind === "chickens") {
        sc("coop_0", x - gx * (w - 1.4), z - gz * (d - 1.4), back, { building: true });
        pen.coop = { x: x - gx * (w - 1.4), z: z - gz * (d - 1.4) };
      } else sc("trough_0", x - gx * (w - 1.2), z - gz * (d - 1.2), back + Math.PI / 2, { building: true });
    }
    // one creature arena per region, on open flat ground away from the villages
    App.arenas = [];
    for (const R of regions) {
      const r = rng(R.i * 4111 + 9);
      // every region gets one: if no flat open spot turns up, try again less fussily
      for (let tries = 0; tries < 1200; tries++) {
        const easy = tries >= 400;
        const a = r() * 6.28, d = 40 + r() * (easy ? 420 : 320), x = Math.round(R.cx + Math.cos(a) * d), z = Math.round(R.cz + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < (easy ? 18 : 25)) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + 1) continue;
        let flat = true;
        for (let k = 0; k < 8 && flat; k++) { const b = (k / 8) * 6.28; if (Math.abs(genColumn(x + Math.cos(b) * 10, z + Math.sin(b) * 10).h - h) > (easy ? 3 : 2)) flat = false; }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 22)) continue;
        if (App.gridNear("road", x, z, 30).some((rd) => segDist(x, z, rd) < 15)) continue;
        if (App.gridNear("field", x, z, 40).some((f) => Math.abs(f.x - x) < f.w + 14 && Math.abs(f.z - z) < f.d + 14)) continue;
        if (App.gridNear("poi", x, z, 50).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 22 : p.hill ? p.hill.r + 14 : 22))) continue;
        const ar = { region: R.i, x, z, h, name: R.name + " Arena" }, rot = Math.atan2(R.cx - x, R.cz - z);
        // the sand floor lies three blocks down, with stone steps round it and a ramp down to the gate
        gadd("field", { kind: "arena", x, z, w: 14, d: 14, h, sunk: { pit: 6.5, tiers: 3, tw: 1.8, rim: 0.6, ramp: 9, rampW: 2.2, depth: 3, fx: Math.sin(rot), fz: Math.cos(rot), floor: B.SAND, edge: B.STONE } }, x - 24, z - 24, x + 24, z + 24);
        sc("arena_" + (R.i % 3), x, z, rot, { building: true });
        ar.rot = rot;
        App.arenas[R.i] = ar;
        break;
      }
    }
    // two dungeon caves per region, out in the wilds
    App.dungeons = [];
    const DNAMES = ["Gloom Hollow", "Bat Grotto", "Mushroom Deep", "Echo Cave", "Shadow Den", "Moss Crypt", "Crystal Burrow", "Whisper Pit", "Ember Vault", "Fungus Fen", "Dripstone Hall", "Old Mine"];
    for (const R of regions) {
      const r = rng(R.i * 5153 + 21);
      let made = 0;
      // (a crowded region gets a second, less fussy round, so that every region has both of its caves)
      for (let tries = 0; tries < 1800 && made < 2; tries++) {
        const easy = tries >= 600;
        const a = r() * 6.28, d = 60 + r() * (easy ? 480 : 420), x = Math.round(R.cx + Math.cos(a) * d), z = Math.round(R.cz + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < (easy ? 14 : 20)) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + 1) continue;
        let flat = true;
        for (let k = 0; k < 8 && flat; k++) { const b = (k / 8) * 6.28; if (Math.abs(genColumn(x + Math.cos(b) * 9, z + Math.sin(b) * 9).h - h) > (easy ? 3 : 2)) flat = false; }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + (easy ? 18 : 30))) continue;
        if (App.gridNear("road", x, z, 25).some((rd) => segDist(x, z, rd) < (easy ? 9 : 12))) continue;
        if (App.gridNear("field", x, z, 40).some((f) => Math.abs(f.x - x) < f.w + (easy ? 10 : 14) && Math.abs(f.z - z) < f.d + (easy ? 10 : 14))) continue;
        if (App.gridNear("poi", x, z, 50).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + (easy ? 12 : 18) : p.hill ? p.hill.r + (easy ? 6 : 10) : easy ? 14 : 20))) continue;
        if (App.dungeons.some((o) => Math.hypot(o.x - x, o.z - z) < (easy ? 110 : 160))) continue;
        const rot = r() * 6.28;
        const dg = { i: App.dungeons.length, region: R.i, x, z, h, rot, name: DNAMES[App.dungeons.length % DNAMES.length], depth: 1 + Math.floor(r() * 3) + Math.floor(Math.hypot(x, z) / 500),
          door: { x: x + Math.sin(rot) * 4.3, z: z + Math.cos(rot) * 4.3 } };
        // the cave sits four blocks down; a stair cut in the ground leads to its door
        gadd("field", { kind: "dungeon", x, z, w: 16, d: 16, h, sunk: { pit: 4.4, rim: 2, ramp: 11, rampW: 1.9, depth: 4, fx: Math.sin(rot), fz: Math.cos(rot), floor: B.STONE, edge: B.STONE } }, x - 20, z - 20, x + 20, z + 20);
        sc("dungeon_" + (App.dungeons.length % 4), x, z, rot, { building: true });
        App.dungeons.push(dg);
        made++;
      }
    }
    // one dragon per region, on the highest ground of each, away from the villages and the arena
    const lairs = (App.lairs = []);
    const LAIR_NAMES = { 16: "Cinder Crag", 11: "Mire Spire", 14: "Ashen Peak", 3: "Salt Fang", 1: "Dune Horn", 4: "Blaze Tor" };
    for (const R of regions) {
      let best = null;
      for (let gx = -540; gx <= 540; gx += 12) for (let gz = -540; gz <= 540; gz += 12) {
        // keep to the heart of the region, well away from the channels and the neighbours' dragons
        if (Math.hypot(gx, gz) > 380) continue;
        const x = R.cx + gx, z = R.cz + gz, fld = regionField(x, z);
        if (fld.r !== R.i || fld.chan < 50 || placeDist(x, z) < 30) continue;
        const c = genColumn(x, z);
        if (best && c.h <= best.h) continue;
        if (lairs.some((l) => Math.hypot(l.x - x, l.z - z) < 420)) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 30)) continue;
        if (App.arenas[R.i] && Math.hypot(App.arenas[R.i].x - x, App.arenas[R.i].z - z) < 40) continue;
        if ((App.dungeons || []).some((d) => Math.hypot(d.x - x, d.z - z) < 30)) continue;
        best = { x, z, h: c.h };
      }
      if (!best) continue;
      // settle on the very top of that hill
      for (let dx = -12; dx <= 12; dx += 2) for (let dz = -12; dz <= 12; dz += 2) { const h = genColumn(best.x + dx, best.z + dz).h; if (h > best.h) best = { x: best.x + dx, z: best.z + dz, h }; }
      lairs.push({ i: lairs.length, region: R.i, x: best.x, z: best.z, h: best.h, look: lairs.length % 3, name: LAIR_NAMES[R.floor] || "Dragon Peak" });
    }
    // a little wilderness decor
    const rw = rng(99);
    for (let x = App.WORLD.minX; x < App.WORLD.maxX; x += 48) for (let z = App.WORLD.minZ; z < App.WORLD.maxZ; z += 48) {
      const px = x + rw() * 48, pz = z + rw() * 48;
      const f = regionField(px, pz);
      if (placeDist(px, pz, f) < 6) continue;
      if (gget("field", px, pz).some((q) => Math.abs(q.x - px) < q.w + 2 && Math.abs(q.z - pz) < q.d + 2)) continue;
      const fl = regions[f.r].floor;
      sc(fl === 14 && rw() < 0.3 ? "boulders" : ["grass4", "grass14", "grass16"][Math.floor(rw() * 3)], px, pz, rw() * 6.28);
    }
    // forests and palm groves: patches of trees by region, kept off roads, squares, places and water
    const FOREST = {
      16: { thr: 0.4, mix: { tree_pine: 5, tree_leafy: 3, bush: 2 } }, 11: { thr: 0.45, mix: { tree_leafy: 6, bush: 3, tree_pine: 1 } },
      14: { thr: 0.43, mix: { tree_pine: 6, bush: 2, tree_leafy: 2 } }, 3: { thr: 0.49, mix: { palm: 5, tree_leafy: 3, bush: 2 } },
      1: { thr: 0.52, mix: { palm: 8, bush: 2 } }, 4: { thr: 0.38, mix: { palm: 9, bush: 1 } },
    };
    const rf = rng(4242);
    let trees = 0;
    for (let x = App.WORLD.minX; x < App.WORLD.maxX; x += 9) for (let z = App.WORLD.minZ; z < App.WORLD.maxZ; z += 9) {
      const px = x + rf() * 9, pz = z + rf() * 9;
      const f = regionField(px, pz);
      const fl = regions[f.r].floor, cfg = FOREST[fl];
      const dens = fbm(px * 0.011, pz * 0.011, 77) + (rf() - 0.5) * 0.12;
      if (dens < cfg.thr && rf() > 0.12) continue; // mostly in patches, plenty of loners
      if (placeDist(px, pz, f) < 4) continue;
      const col = genColumn(px, pz);
      if (col.h < SEA + 1 || col.top === B.PATH || col.top === B.STONE) continue;
      if (gget("lot", px, pz).some((v) => Math.hypot(v.x - px, v.z - pz) < v.r + 3)) continue;
      if (gget("road", px, pz).some((rd) => segDist(px, pz, rd) < 3)) continue;
      if (gget("field", px, pz).some((q) => Math.abs(q.x - px) < q.w + 3 && Math.abs(q.z - pz) < q.d + 3)) continue;
      if (gget("landing", px, pz).some((b) => Math.hypot(b.mx - px, b.mz - pz) < 40)) continue;
      if (App.gridNear("poi", px, pz, 20).some((p) => Math.hypot(p.x - px, p.z - pz) < (p.lake ? p.lake.r + 6 : 13))) continue;
      let type = pickW(rf, cfg.mix);
      if (col.top === B.SAND && type !== "palm") type = rf() < 0.6 ? "palm" : "bush";
      if (type !== "palm") type += "_" + (rf() < 0.5 ? 0 : 1);
      sc(type, px, pz, rf() * 6.28, { tree: true });
      trees++;
    }
    App.treeCount = trees;
    for (const p of pois) if (!p.spot) p.spot = { x: p.x, z: p.z };
    // the giant statue of the Maker on its isle in the middle of the lake (placed last, so earlier pieces keep their index)
    App.isleStatue = sc("maker_0", ISLE.x, ISLE.z, 0, { building: true, fixed: true, statue: true, giant: true });
    // a mine in every region, dug into high ground, facing its nearest village; deep in some of them
    // runs a vein of orichalcum
    const MINE_NAMES = ["Old Iron Mine", "Crow Hollow Mine", "Goldvein Pit", "Saltrock Mine", "Sunstone Delve", "Copperleaf Mine"];
    App.mines = [];
    for (const R of regions) {
      const r = rng(R.i * 6151 + 33);
      let best = null;
      // first well away from farms and villages; if the region has no such spot, a little closer
      for (let tries = 0, strict = 1; tries < 2800 && !(tries >= 900 && best); tries++) {
        if (tries === 900) strict = 0;
        if (tries === 1800) strict = -1; // a crowded region: closer still to the villages
        const a = r() * 6.28, d = 60 + r() * (strict < 0 ? 480 : 380), x = Math.round(R.cx + Math.cos(a) * d), z = Math.round(R.cz + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < (strict > 0 ? 30 : strict === 0 ? 18 : 12)) continue;
        const h = genColumn(x, z).h;
        if (best && h <= best.h) continue;
        let flat = true;
        for (let k = 0; k < 8 && flat; k++) { const b = (k / 8) * 6.28; if (Math.abs(genColumn(x + Math.cos(b) * 7, z + Math.sin(b) * 7).h - h) > 3) flat = false; }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + (strict > 0 ? 45 : strict === 0 ? 30 : 16))) continue;
        if (App.gridNear("road", x, z, 20).some((rd) => segDist(x, z, rd) < (strict > 0 ? 10 : 7))) continue;
        if (App.gridNear("field", x, z, 50).some((f) => Math.abs(f.x - x) < f.w + (strict > 0 ? 24 : strict === 0 ? 16 : 10) && Math.abs(f.z - z) < f.d + (strict > 0 ? 24 : strict === 0 ? 16 : 10))) continue;
        if ((App.lairs || []).some((L) => Math.hypot(L.x - x, L.z - z) < (strict ? 70 : 50)) || (App.dungeons || []).some((dg) => Math.hypot(dg.x - x, dg.z - z) < (strict ? 50 : 35))) continue;
        if (App.arenas[R.i] && Math.hypot(App.arenas[R.i].x - x, App.arenas[R.i].z - z) < 50) continue;
        best = { x, z, h };
      }
      if (!best) continue;
      const v = villages.filter((o) => o.region === R.i).sort((p, q) => Math.hypot(p.x - best.x, p.z - best.z) - Math.hypot(q.x - best.x, q.z - best.z))[0];
      const rot = v ? Math.atan2(v.x - best.x, v.z - best.z) : 0;
      // each mine is rich in two of the lesser ores
      const RICH = [["copper", "coal"], ["silver", "gems"], ["coal", "silver"], ["copper", "gems"], ["silver", "copper"], ["gems", "coal"]][App.mines.length % 6];
      const M = { i: App.mines.length, region: R.i, x: best.x, z: best.z, h: best.h, rot, name: MINE_NAMES[App.mines.length % MINE_NAMES.length], orichalcum: r() < 0.5, rich: RICH,
        door: { x: best.x + Math.sin(rot) * 4.6, z: best.z + Math.cos(rot) * 4.6 } };
      App.mines.push(M);
      // sunk into a cutting: the hill rises out of a hollow and a ramp runs down along the rails to the portal
      gadd("field", { kind: "mine", x: best.x, z: best.z, w: 16, d: 16, h: best.h, sunk: { pit: 6, rim: 3, ramp: 14, rampW: 2.6, depth: 3, fx: Math.sin(rot), fz: Math.cos(rot), floor: B.STONE, edge: B.STONE } }, best.x - 24, best.z - 24, best.x + 24, best.z + 24);
      for (const o of App.gridNear("scenery", best.x, best.z, 20)) if (!o.building && Math.hypot(o.x - best.x, o.z - best.z) < 18) o.gone = true;
      sc("mine_" + (M.i % 4), best.x, best.z, rot, { building: true, fixed: true, mine: M.i });
    }
    // fields of Ether crystals out in the wild, two in every region
    const ETHER_NAMES = ["Glimmer", "Starfall", "Moonwell", "Shimmer", "Wisp", "Dawnglow", "Hollowlight", "Duskspire", "Brightmoor", "Ember", "Frost", "Echo"];
    App.etherFields = [];
    for (const R of regions) {
      const r = rng(R.i * 7393 + 51);
      let made = 0;
      // (a crowded region gets a second, less fussy round, so that every region has both of its fields)
      for (let tries = 0; tries < 2000 && made < 2; tries++) {
        const easy = tries >= 700;
        const a = r() * 6.28, d = 80 + r() * (easy ? 470 : 380), x = Math.round(R.cx + Math.cos(a) * d), z = Math.round(R.cz + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < (easy ? 16 : 25)) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + (easy ? 20 : 40))) continue;
        if (App.gridNear("road", x, z, 20).some((rd) => segDist(x, z, rd) < (easy ? 8 : 12))) continue;
        if (App.gridNear("field", x, z, 40).some((f) => Math.abs(f.x - x) < f.w + (easy ? 8 : 12) && Math.abs(f.z - z) < f.d + (easy ? 8 : 12))) continue;
        if ((App.lairs || []).some((L) => Math.hypot(L.x - x, L.z - z) < (easy ? 60 : 80)) || (App.mines || []).some((m) => Math.hypot(m.x - x, m.z - z) < (easy ? 36 : 50)) || (App.dungeons || []).some((g) => Math.hypot(g.x - x, g.z - z) < (easy ? 36 : 50))) continue;
        if (App.etherFields.some((f) => Math.hypot(f.x - x, f.z - z) < (easy ? 100 : 150))) continue;
        const F = { i: App.etherFields.length, region: R.i, x, z, name: ETHER_NAMES[App.etherFields.length % ETHER_NAMES.length] + " Ether Field" };
        App.etherFields.push(F);
        for (let k = 0; k < 7; k++) { const b = r() * 6.28, q = k ? 3 + r() * 6 : 0; sc("etherfield_0", x + Math.cos(b) * q, z + Math.sin(b) * q, r() * 6.28, { fixed: true, ether: F.i }); }
        made++;
      }
    }
    // the village fire: bigger, with a second ring of logs, so the whole village can sit down to dinner round it
    for (const v of villages) {
      if (v.fire) v.fire.scale = 1.6;
      const clear = (x, z) => Math.hypot(x - v.altar.x, z - v.altar.z) > 2.6 && Math.hypot(x - v.hall.x, z - v.hall.z) > 5.4 && Math.hypot(x - v.granary.x, z - v.granary.z) > 4.2 &&
        !gget("road", x, z).some((rd) => segDist(x, z, rd) < 1.6) && genColumn(x, z).h >= SEA + 1;
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.4 + Math.PI / 4, x = v.x + Math.cos(a) * 4.2, z = v.z + Math.sin(a) * 4.2; if (clear(x, z)) { const s = sc("logseat", x, z, a); if (s) v.logs.push(s); } }
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28 + 0.15, x = v.x + Math.cos(a) * 7.2, z = v.z + Math.sin(a) * 7.2; if (clear(x, z)) { const s = sc("logseat", x, z, a); if (s) v.logs.push(s); } }
      if (v.vacant) for (const s0 of v.logs) if (s0) s0.gone = true;
      // (a third ring, further out and only as far as the people need it, is laid with the houses, last of all)
      v.ring3 = clear;
      // two to a log, side by side along it; the logs lie round the fire like benches
      v.seats = [];
      for (const s of v.logs.filter(Boolean)) {
        const a = Math.atan2(s.z - v.z, s.x - v.x), tx = -Math.sin(a), tz = Math.cos(a);
        s.rot = Math.atan2(tx, tz); // (the log model is long along its z: lengthwise round the fire)
        for (const side of [-0.8, 0.8]) v.seats.push({ x: s.x + tx * side, z: s.z + tz * side, log: s });
      }
    }
    // a Guild Quarter in every region, on flat open ground not far from its biggest village: a hall for each
    // guild round a dirt yard, the doors facing in (made last, so nothing placed before it moves)
    const GKEYS = ["adventurers", "warriors", "marauders", "miners", "merchants", "mages"];
    App.guildQuarters = [];
    for (const R of regions) {
      const r = rng(R.i * 8317 + 61), home = villages.filter((v) => v.region === R.i).sort((a, b) => b.r - a.r || a.lot - b.lot)[0];
      if (!home) continue;
      let spot = null;
      // first close by on flat open ground; if the region has none, further out and less fussy (the yard is levelled anyway)
      for (let tries = 0; tries < 4000 && !spot; tries++) {
        const lv = tries < 700 ? 0 : tries < 1500 ? 1 : tries < 2600 ? 2 : 3, a = r() * 6.28, d = home.r + 30 + r() * [200, 320, 480, 620][lv], x = Math.round(home.x + Math.cos(a) * d), z = Math.round(home.z + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < [28, 20, 16, 12][lv]) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + 1) continue;
        let flat = true;
        for (let k = 0; k < 12 && flat; k++) { const b = (k / 12) * 6.28; for (const q of [9, 18]) if (Math.abs(genColumn(x + Math.cos(b) * q, z + Math.sin(b) * q).h - h) > [2, 3, 5, 7][lv]) flat = false; }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + [26, 24, 20, 14][lv])) continue;
        if (App.gridNear("road", x, z, 30).some((rd) => segDist(x, z, rd) < [21, 20, 19, 16][lv])) continue;
        if (App.gridNear("field", x, z, 50).some((f) => Math.abs(f.x - x) < (f.w || 0) + [24, 24, 24, 18][lv] && Math.abs(f.z - z) < (f.d || 0) + [24, 24, 24, 18][lv])) continue;
        if (App.gridNear("poi", x, z, 50).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 26 : p.hill ? p.hill.r + 16 : 26))) continue;
        const far = (list, dmin) => !(list || []).some((o) => o && Math.hypot(o.x - x, o.z - z) < dmin);
        if (!far(App.arenas, 60) || !far(App.mines, 60) || !far(App.dungeons, 50) || !far(App.lairs, 80) || !far(App.etherFields, 50) || !far(App.docks, 40)) continue;
        spot = { x, z, h };
      }
      if (!spot) continue;
      const { x, z, h } = spot, Q = { region: R.i, x, z, h, name: R.name + " Guild Quarter", halls: [] };
      gadd("field", { kind: "quarter", mud: true, x, z, w: 19, d: 19, h }, x - 22, z - 22, x + 22, z + 22);
      for (const o of App.gridNear("scenery", x, z, 26)) if (!o.building && Math.hypot(o.x - x, o.z - z) < 23) o.gone = true;
      // the open side of the ring faces the village, so the way in is from there
      const toV = Math.atan2(home.z - z, home.x - x);
      GKEYS.forEach((key, i) => {
        const a = toV + Math.PI / 6 + (i / (GKEYS.length - 1)) * (Math.PI * 2 - Math.PI / 3), hx = x + Math.cos(a) * 13, hz = z + Math.sin(a) * 13, rot = Math.atan2(x - hx, z - hz);
        const s = sc("guildhall_" + i, hx, hz, rot, { building: true, fixed: true, guild: key, region: R.i });
        if (s) Q.halls.push({ guild: key, region: R.i, x: hx, z: hz, rot, sc: s, door: { x: hx + Math.sin(rot) * 4.2, z: hz + Math.cos(rot) * 4.2 } });
      });
      App.guildQuarters[R.i] = Q;
    }
    // a casino in every region, near its arena (or its biggest village), on flat open ground
    const CNAMES = ["The Lucky Clam", "The Golden Shell", "Pearl Palace", "Coconut Royale", "Starfish Club", "Tide and Dice"];
    App.casinos = [];
    for (const R of regions) {
      const r = rng(R.i * 9103 + 71), ar = App.arenas[R.i], home = villages.filter((v) => v.region === R.i).sort((a, b) => b.r - a.r || a.lot - b.lot)[0], c0 = ar || home;
      if (!c0) continue;
      let spot = null;
      for (let tries = 0; tries < 2400 && !spot; tries++) {
        const lv = tries < 800 ? 0 : tries < 1600 ? 1 : 2, a = r() * 6.28, d = 40 + r() * [110, 200, 360][lv], x = Math.round(c0.x + Math.cos(a) * d), z = Math.round(c0.z + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < [22, 16, 12][lv]) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + 1) continue;
        let flat = true;
        for (let k = 0; k < 10 && flat; k++) { const b = (k / 10) * 6.28; for (const q of [7, 13]) if (Math.abs(genColumn(x + Math.cos(b) * q, z + Math.sin(b) * q).h - h) > [2, 3, 5][lv]) flat = false; }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 16)) continue;
        if (App.gridNear("road", x, z, 24).some((rd) => segDist(x, z, rd) < 12)) continue;
        if (App.gridNear("field", x, z, 50).some((f) => Math.abs(f.x - x) < (f.w || 0) + 16 && Math.abs(f.z - z) < (f.d || 0) + 16)) continue;
        if (App.gridNear("poi", x, z, 50).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 20 : p.hill ? p.hill.r + 12 : 18))) continue;
        const far = (list, dmin) => !(list || []).some((o) => o && Math.hypot(o.x - x, o.z - z) < dmin);
        if (!far(App.arenas, 34) || !far(App.mines, 50) || !far(App.dungeons, 40) || !far(App.lairs, 70) || !far(App.etherFields, 40) || !far(App.docks, 30) || !far(App.guildQuarters, 40)) continue;
        spot = { x, z, h };
      }
      if (!spot) continue;
      const { x, z, h } = spot, rot = Math.atan2(c0.x - x, c0.z - z), k = App.casinos.length;
      gadd("field", { kind: "casino", x, z, w: 10, d: 10, h }, x - 13, z - 13, x + 13, z + 13);
      for (const o of App.gridNear("scenery", x, z, 16)) if (!o.building && Math.hypot(o.x - x, o.z - z) < 13) o.gone = true;
      const s = sc("casino_" + (k % 3), x, z, rot, { building: true, fixed: true, casino: k, scale: 1.3 });
      if (!s) continue;
      App.casinos.push({ i: k, region: R.i, x, z, rot, sc: s, name: CNAMES[k % CNAMES.length], door: { x: x + Math.sin(rot) * 6.2, z: z + Math.cos(rot) * 6.2 } });
    }
    // the Blacksmiths' Guild in every region, not far from its Guild Quarter: the forge in the middle facing
    // the quarter, a horse paddock on its left and a griffin roost on its right (wealth.js sells from it).
    // Made last of all, so nothing placed before it moves and old saves keep their buildings.
    App.smithies = [];
    for (const R of regions) {
      const Q = App.guildQuarters[R.i];
      if (!Q) continue;
      const r = rng(R.i * 7717 + 83);
      let spot = null;
      for (let tries = 0; tries < 7000 && !spot; tries++) {
        // first close by and fussy; then further out, turned any way, and less fussy (the yards are levelled anyway)
        const lv = tries < 900 ? 0 : tries < 2000 ? 1 : tries < 3400 ? 2 : tries < 5000 ? 3 : 4, a = r() * 6.28, d = 36 + r() * [90, 170, 320, 460, 600][lv], x = Math.round(Q.x + Math.cos(a) * d), z = Math.round(Q.z + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || placeDist(x, z) < [30, 24, 18, 12, 10][lv]) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + 1) continue;
        const rot = Math.atan2(Q.x - x, Q.z - z) + (lv >= 2 ? Math.floor(r() * 4) * Math.PI / 2 : 0), fx = Math.sin(rot), fz = Math.cos(rot), rx = Math.cos(rot), rz = -Math.sin(rot);
        // a strip about forty blocks long: flat enough all along it
        let flat = true;
        for (let s = -28; s <= 20 && flat; s += 4) for (const q of [-9, 0, 8]) { const px = x + rx * s + fx * q, pz = z + rz * s + fz * q, ph = genColumn(px, pz).h; if (Math.abs(ph - h) > [2, 3, 4, 6, 8][lv] || ph < SEA + 1) flat = false; }
        if (!flat) continue;
        const pts = [[x, z], [x - rx * 20, z - rz * 20], [x + rx * 14, z + rz * 14]];
        if (pts.some(([px, pz]) => villages.some((v) => Math.hypot(v.x - px, v.z - pz) < v.r + [18, 16, 14, 11, 7][lv]))) continue;
        if (pts.some(([px, pz]) => App.gridNear("road", px, pz, 24).some((rd) => segDist(px, pz, rd) < [13, 12, 11, 10, 8][lv]))) continue;
        if (pts.some(([px, pz]) => App.gridNear("field", px, pz, 50).some((f) => Math.abs(f.x - px) < (f.w || 0) + [14, 13, 12, 11, 9][lv] && Math.abs(f.z - pz) < (f.d || 0) + [14, 13, 12, 11, 9][lv]))) continue;
        if (pts.some(([px, pz]) => App.gridNear("poi", px, pz, 50).some((p) => Math.hypot(p.x - px, p.z - pz) < (p.lake ? p.lake.r + 18 : p.hill ? p.hill.r + 11 : [16, 15, 14, 12, 10][lv])))) continue;
        const far = (list, dmin) => !(list || []).some((o) => o && pts.some(([px, pz]) => Math.hypot(o.x - px, o.z - pz) < dmin));
        if (!far(App.arenas, 45) || !far(App.mines, 45) || !far(App.dungeons, 40) || !far(App.lairs, 75) || !far(App.etherFields, 36) || !far(App.docks, 34) || !far(App.guildQuarters, 32) || !far(App.casinos, 30)) continue;
        spot = { x, z, h, rot, rx, rz, fx, fz };
      }
      if (!spot) continue;
      const { x, z, h, rot, rx, rz, fx, fz } = spot, P = { x: x - rx * 20, z: z - rz * 20 }, Rt = { x: x + rx * 14, z: z + rz * 14 };
      gadd("field", { kind: "smithy", mud: true, x, z, w: 9, d: 9, h }, x - 12, z - 12, x + 12, z + 12);
      gadd("field", { kind: "paddock", x: P.x, z: P.z, w: 10, d: 10, h }, P.x - 13, P.z - 13, P.x + 13, P.z + 13);
      gadd("field", { kind: "roost", mud: true, x: Rt.x, z: Rt.z, w: 3, d: 3, h }, Rt.x - 6, Rt.z - 6, Rt.x + 6, Rt.z + 6);
      for (const [px, pz, rr] of [[x, z, 11], [P.x, P.z, 12], [Rt.x, Rt.z, 5]]) for (const o of App.gridNear("scenery", px, pz, rr + 3)) if (!o.building && Math.hypot(o.x - px, o.z - pz) < rr) o.gone = true;
      const k = App.smithies.length;
      const s = sc("smithy_0", x, z, rot, { building: true, fixed: true, smithy: k, scale: 1.45 });
      const sp = sc("paddock_0", P.x, P.z, rot, { building: true, fixed: true, smithy: k, paddock: true });
      const sr = sc("roost_0", Rt.x, Rt.z, rot, { building: true, fixed: true, smithy: k, roost: true, scale: 1.3 });
      if (!s) continue;
      App.smithies.push({ i: k, region: R.i, x, z, h, rot, fx, fz, rx, rz, sc: s, scale: 1.45, paddock: { x: P.x, z: P.z, sc: sp }, roost: { x: Rt.x, z: Rt.z, sc: sr }, name: R.name + " Blacksmiths' Guild",
        door: { x: x + fx * 6.5, z: z + fz * 6.5 } });
    }
    // the prison (prison.js): one for the whole map, the last of the buildings that never move
    App.prison = null;
    if (App.placePrison) App.placePrison({ regions, villages, genColumn, regionField, waterDist: placeDist, segDist, gadd, sc, rng, SEA });
    // the Parliament (parliament.js) on the Maker's Isle
    App.parliament = null;
    if (App.placeParliament) App.placeParliament({ genColumn, gadd, sc });
    // ---------- last of all, what follows ownership ----------
    // The houses on every plot lived on, the outer ring of logs round its fire, and the warrens dug for whoever the
    // plots cannot hold. They come after every piece that never moves, so those keep their index whoever owns what;
    // each piece made here is known in the save by a key (its place and its slot), not by its index.
    App.tailStart = App.sceneryAll.length;
    App.wallDecks = []; wallGrid.clear();
    const tailKeys = (App.tailKeys = []);
    const tsc = (key, type, x, z, rot, extra) => { const s = sc(type, x, z, rot, extra); if (s) { s.tkey = key; tailKeys.push(key); } return s; };
    const nearRoad = (x, z, d) => gget("road", x, z).some((rd) => segDist(x, z, rd) < d);
    const inField = (x, z, m) => gget("field", x, z).some((f) => !f.sunk && Math.abs(f.x - x) < (f.w || 0) + m && Math.abs(f.z - z) < (f.d || 0) + m);
    // two to a log, side by side along it; the logs lie round the fire like benches
    const seatsOf = (v) => {
      v.seats = [];
      for (const s0 of v.logs.filter(Boolean)) {
        const a = Math.atan2(s0.z - v.z, s0.x - v.x), tx = -Math.sin(a), tz = Math.cos(a);
        s0.rot = Math.atan2(tx, tz); // (the log model is long along its z: lengthwise round the fire)
        for (const side of [-0.8, 0.8]) v.seats.push({ x: s0.x + tx * side, z: s0.z + tz * side, log: s0 });
      }
    };
    const homesInOrder = (v) => { const byId = new Map(); v.homes.forEach((H) => H.members.forEach((id) => byId.set(id, H))); v.homes = v.residents.map((id) => byId.get(id)); };
    for (const v of villages) {
      if (v.vacant) continue;
      const key = (v.key = "L" + v.lot);
      const spiral = (c, j0, step, ok) => {
        // the next spot of a loose spiral round the square that passes ok(x, z); every call moves on
        let x = v.x, z = v.z, good = false;
        for (let tries = 0; tries < 60 && !good; tries++, spiral.j += step) {
          const rr = c * Math.sqrt(spiral.j), a = spiral.j * 2.39996 + v.lot;
          x = v.x + Math.cos(a) * rr; z = v.z + Math.sin(a) * rr;
          good = ok(x, z);
        }
        return { x, z };
      };
      const flatAt = (x, z, pts, tol) => { const h0 = genColumn(x, z).h; return h0 >= SEA + 1 && pts.every(([ox, oz]) => Math.abs(genColumn(x + ox, z + oz).h - h0) <= tol); };
      const noLake = (x, z, m) => !gget("lake", x, z).some((lk) => Math.hypot(lk.x - x, lk.z - z) < lk.r + m);
      const SMALL = [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3], [0, 3.2]], BIG = [[-6, -3], [6, -3], [-6, 3], [6, 3], [0, 5]];
      const build = (k, x, z, rot, kind, members, door, extra) => {
        const fx = Math.sin(rot), fz = Math.cos(rot);
        const H = { x: x + fx * door, z: z + fz * door, hx: x, hz: z, rot, kind, members: members.slice(), slot: v.houses.length };
        H.sc = tsc(key + "/" + k, kind + "_" + v.style, x, z, rot, Object.assign({ building: true, house: true, village: v.i, slot: H.slot, members: H.members }, extra || {}));
        v.houses.push(H);
        for (let i = 0; i < members.length; i++) v.homes.push(H);
        return H;
      };
      if (v.cls === "town") {
        // a house for every household (two medium ones for a household of five to nine) in a loose spiral round the
        // square, front door towards it, kept off the roads, the fields and the farm. The spots of the spiral are the same
        // whoever lives there: a household's house stands on the spot of its slot, and a second house on a spot of its
        // own further out, so nobody moves when a neighbour grows or shrinks; an empty slot keeps its spot
        const MAXH = TOWN_HOUSES + 3, K2 = Math.max(MAXH, v.slots.length);
        const jmax = Math.pow((v.r - 3) / 4.7, 2), c = 4.7 * Math.max(0.8, Math.min(1, Math.sqrt(jmax / (12 + 2 * MAXH * 1.3))));
        const okHouse = (x, z) => !nearRoad(x, z, 3.6) && Math.hypot(x - v.hall.x, z - v.hall.z) > 8 && Math.hypot(x - v.granary.x, z - v.granary.z) > 6.5 &&
          Math.hypot(x - v.altar.x, z - v.altar.z) > 4 && !inField(x, z, 3.5) && flatAt(x, z, SMALL, 1) && noLake(x, z, 10);
        spiral.j = 12;
        const P = [], spotAt = (k) => { while (P.length <= k) { P.push(spiral(c, 12, 1, okHouse)); spiral.j++; } return P[k]; };
        spotAt(K2 - 1);
        // the second house next to the first if there is room between the spots, or else on its own spot further out
        const seconds = [], clear = (x, z) => P.slice(0, K2).every((q) => Math.hypot(q.x - x, q.z - z) > 5) && seconds.every((q) => Math.hypot(q.x - x, q.z - z) > 5);
        const beside = (p, slot) => {
          const a0 = Math.atan2(p.z - v.z, p.x - v.x);
          for (const da of [0, 1.57, -1.57, 0.79, -0.79, 2.36, -2.36, 3.14]) {
            const x = p.x + Math.cos(a0 + da) * 5.4, z = p.z + Math.sin(a0 + da) * 5.4;
            if (Math.hypot(x - v.x, z - v.z) < v.r - 3 && okHouse(x, z) && clear(x, z)) return { x, z };
          }
          return spotAt(K2 + slot);
        };
        v.slots.forEach((members, slot) => {
          if (!members) return;
          const nh = housesOf(members.length), spots = [spotAt(slot)];
          if (nh === 2) { const q = beside(spots[0], slot); seconds.push(q); spots.push(q); }
          const half = Math.ceil(members.length / 2), parts = nh === 1 ? [members] : [members.slice(0, half), members.slice(half)];
          parts.forEach((mem, h) => {
            const { x, z } = spots[h];
            // a household of three or more gets a two-storey house; one or two, a cottage or a round hut
            const kind = nh === 2 || mem.length >= 3 ? "townhouse" : mem.length === 2 || hash2(mem[0], 5, 1207) < 0.55 ? "cottage" : "hut";
            build(slot + (h ? "b" : ""), x, z, faceTo(x, z, v.x, v.z), kind, mem, 2.7);
          });
        });
      } else if (FORTS[v.cls]) {
        // a fortress: the castle (or palace) where the hall stands, for all of them; walls round the plot with a
        // tower every few stretches and a gate wherever a road comes in
        const fb = fortBuilding(v);
        const H = build("castle", v.hall.x, v.hall.z, v.hall.rot, fb.kind, v.residents, fb.door, { scale: fb.scale, castle: true, fixed: true });
        v.hall.sc = H.sc; v.hall.door = { x: H.x, z: H.z };
        // the walls go round a point between the square and the castle, so both are inside
        const FP = FORTS[v.cls], WALL_R = FP.R, cx = v.x + (v.hall.x - v.x) * (FP.off / FP.hd), cz = v.z + (v.hall.z - v.z) * (FP.off / FP.hd);
        const gates = [];
        for (const rd of App.gridNear("road", cx, cz, WALL_R + 20)) {
          // where the road crosses the circle
          const dx = rd.x2 - rd.x1, dz = rd.z2 - rd.z1, fx0 = rd.x1 - cx, fz0 = rd.z1 - cz;
          const A = dx * dx + dz * dz, Bq = 2 * (fx0 * dx + fz0 * dz), Cq = fx0 * fx0 + fz0 * fz0 - WALL_R * WALL_R, disc = Bq * Bq - 4 * A * Cq;
          if (A < 1e-6 || disc < 0) continue;
          for (const t of [(-Bq - Math.sqrt(disc)) / (2 * A), (-Bq + Math.sqrt(disc)) / (2 * A)]) if (t >= 0 && t <= 1) { const a = Math.atan2(fz0 + dz * t, fx0 + dx * t); if (!gates.some((g) => Math.abs(Math.atan2(Math.sin(g - a), Math.cos(g - a))) < 0.45)) gates.push(a); }
        }
        if (!gates.length) gates.push(Math.atan2(v.z - v.hall.z, v.x - v.hall.x));
        // at least four gates round every wall: more go in the middle of the widest stretches without one
        while (gates.length < 4) {
          gates.sort((a, b) => a - b);
          let best = 0, gap = -1;
          gates.forEach((a, i) => { const b = i + 1 < gates.length ? gates[i + 1] : gates[0] + Math.PI * 2; if (b - a > gap) { gap = b - a; best = i; } });
          const a = gates[best] + gap / 2;
          gates.push(Math.atan2(Math.sin(a), Math.cos(a)));
        }
        gates.sort((a, b) => a - b);
        v.walls = { x: cx, z: cz, r: WALL_R, gates: gates.slice() };
        gates.forEach((a, i) => { const x = cx + Math.cos(a) * WALL_R, z = cz + Math.sin(a) * WALL_R; tsc(key + "/g" + i, "gatehouse_" + v.style, x, z, faceTo(x, z, cx, cz), { building: true, fixed: true, wall: true, gate: true, scale: WALL_SCALE }); });
        // between one gate and the next, stretches of wall that just overlap, from the tower of one gate to the tower of
        // the next, and a round tower at every third joint
        const gh = (GATE_HALF - 0.4) / WALL_R;
        gates.forEach((g, i) => {
          const g2 = i + 1 < gates.length ? gates[i + 1] : gates[0] + Math.PI * 2, a0 = g + gh, span = g2 - gh - a0;
          if (span <= 0.02) return;
          const n = Math.max(1, Math.ceil((span * WALL_R) / (WALL_LEN * 0.94))), step = span / n;
          for (let k = 0; k < n; k++) {
            const a = a0 + (k + 0.5) * step, x = cx + Math.cos(a) * WALL_R, z = cz + Math.sin(a) * WALL_R;
            tsc(key + "/w" + i + "_" + k, "wall_0", x, z, -(a + Math.PI / 2), { building: true, fixed: true, wall: true, scale: WALL_SCALE });
            // the walk along the top, a deck like a jetty's (world.js App.deckY), for the guards on their rounds
            addWallDeck({ x, z, ux: -Math.sin(a), uz: Math.cos(a), y: genColumn(x, z).h + WALL_TOP, hl: (step * WALL_R) / 2 + 0.3, hw: WALL_HW });
            if (k > 0 && k % 3 === 0) { const b = a0 + k * step, tx = cx + Math.cos(b) * WALL_R, tz = cz + Math.sin(b) * WALL_R; tsc(key + "/t" + i + "_" + k, "walltower_0", tx, tz, 0, { building: true, fixed: true, wall: true, scale: WALL_SCALE }); }
          }
        });
      } else {
        // a holder's own plot: its first mansion (or house) where the hall stands, facing the square, the others round it
        const grand = v.cls === "grand", placedAt = [];
        const okOwn = (x, z) => !nearRoad(x, z, grand ? 9.5 : 3.6) && placedAt.every((q) => Math.hypot(q.x - x, q.z - z) > (grand ? 21 : 6.5)) &&
          Math.hypot(x - v.granary.x, z - v.granary.z) > (grand ? 11 : 6.5) && Math.hypot(x - v.altar.x, z - v.altar.z) > (grand ? 9 : 4) &&
          Math.hypot(x - v.x, z - v.z) > (grand ? 16 : 9) && !inField(x, z, grand ? 9 : 3.5) && flatAt(x, z, grand ? BIG : SMALL, grand ? 2 : 1) && noLake(x, z, grand ? 14 : 10);
        spiral.j = grand ? 5 : 6;
        v.slots.forEach((members, k) => {
          const at = k ? spiral(grand ? 11.5 : 5.2, 0, 1, okOwn) : { x: v.hall.x, z: v.hall.z };
          placedAt.push(at);
          const H = build("m" + k, at.x, at.z, k ? faceTo(at.x, at.z, v.x, v.z) : v.hall.rot, grand ? MANSION_KIND[v.floor] : "townhouse", members, grand ? MANSION_DOOR : 2.7, grand ? { scale: MANSION_SCALE } : null);
          if (!k) { v.hall.sc = H.sc; v.hall.door = { x: H.x, z: H.z }; }
        });
      }
      // a fortress (and a great estate) keeps its arms in an armoury; a fortress's catapults stand inside its walls,
      // between the gates, ready to throw over them (war.js)
      if (FORTS[v.cls] || v.cls === "grand") {
        const W0 = v.walls, keepClear = (x, z, d) => App.gridNear("scenery", x, z, d + 12).every((o) => !o.building || Math.hypot(o.x - x, o.z - z) > d + (o.castle ? 14 : o.house && v.cls === "grand" ? 8 : o.wall ? 1 : 3));
        const okAt = (x, z, d) => !nearRoad(x, z, d) && !inField(x, z, d) && flatAt(x, z, SMALL, 1.5) && noLake(x, z, 6) && keepClear(x, z, d) &&
          Math.hypot(x - v.granary.x, z - v.granary.z) > d + 4 && Math.hypot(x - v.altar.x, z - v.altar.z) > d + 3 && Math.hypot(x - v.x, z - v.z) > d + 8 &&
          (!W0 || Math.hypot(x - W0.x, z - W0.z) < W0.r - d - 2);
        const mx = W0 ? W0.x : v.x, mz = W0 ? W0.z : v.z, far0 = W0 ? W0.r * 0.62 : 26;
        for (let k = 0; k < 40; k++) {
          const a = hash2(v.i, k, 1301) * 6.283, r = far0 * (0.75 + hash2(v.i, k, 1303) * 0.45), x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r;
          if (!okAt(x, z, 4.5)) continue;
          v.armoury = tsc(key + "/armoury", "armoury_" + v.style, x, z, faceTo(x, z, v.x, v.z), { building: true, armoury: true, village: v.i });
          break;
        }
        v.catapults = [];
        if (W0) W0.gates.forEach((g, i) => {
          const g2 = i + 1 < W0.gates.length ? W0.gates[i + 1] : W0.gates[0] + Math.PI * 2;
          for (const f of [0.5, 0.35, 0.65]) {
            const a = g + (g2 - g) * f, x = W0.x + Math.cos(a) * (W0.r - 6.5), z = W0.z + Math.sin(a) * (W0.r - 6.5);
            if (!okAt(x, z, 2.2)) continue;
            // facing out over the wall
            const s0 = tsc(key + "/cat" + i, "catapult_0", x, z, Math.atan2(Math.cos(a), Math.sin(a)), { building: true, catapult: true, village: v.i });
            if (s0) v.catapults.push(s0);
            break;
          }
        });
      }
      homesInOrder(v);
      // a third ring of logs round the fire, as far as the people need it
      for (let k = 0; k < 16 && v.logs.filter(Boolean).length * 2 < v.residents.length; k++) {
        const a = (k / 16) * 6.28 + 0.3, x = v.x + Math.cos(a) * 10, z = v.z + Math.sin(a) * 10;
        if (v.ring3(x, z) && v.homes.every((h) => Math.hypot(h.hx - x, h.hz - z) > 4.2)) { const s0 = tsc(key + "/r" + k, "logseat", x, z, a); if (s0) v.logs.push(s0); }
      }
      seatsOf(v);
    }
    // the warrens, dug for whoever the plots cannot hold (there is no limit to them). Each region keeps a list of spots
    // for them, always the same (on the high ground, clear of everything else), and its j-th warren always takes its
    // j-th spot. A warren is a grassy hill with a round door in its clan's colour and a little square in front;
    // inside (interiors.js) a cavern with a bed for every Tickle who lives there.
    const W = (App.warrens = []), spotsOf = new Map();
    const warrenSpot = (R, j) => {
      if (!spotsOf.has(R.i)) {
        const r = rng(R.i * 6007 + 91), list = [];
        for (let gx = -540; gx <= 540; gx += 13) for (let gz = -540; gz <= 540; gz += 13) {
          const x = Math.round(R.cx + gx + (r() - 0.5) * 8), z = Math.round(R.cz + gz + (r() - 0.5) * 8);
          if (regionField(x, z).r !== R.i || placeDist(x, z) < 16) continue;
          const h = genColumn(x, z).h;
          if (h >= SEA + 2) list.push({ x, z, h, k: hash2(x, z, 6011) });
        }
        // the high ground first (a warren is dug into a hill), then at random
        list.sort((a, b) => b.h - a.h || a.k - b.k);
        spotsOf.set(R.i, { list, at: 0, got: [] });
      }
      const S0 = spotsOf.get(R.i);
      const far = (list, x, z, dmin) => !(list || []).some((o) => o && Math.hypot(o.x - x, o.z - z) < dmin);
      while (S0.got.length <= j) {
        let spot = null;
        while (!spot && S0.at < S0.list.length) {
          const { x, z, h } = S0.list[S0.at++];
          let flat = true;
          for (let k = 0; k < 8 && flat; k++) { const b = (k / 8) * 6.28; const hh = genColumn(x + Math.cos(b) * 10, z + Math.sin(b) * 10).h; if (Math.abs(hh - h) > 3 || hh < SEA + 1) flat = false; }
          if (!flat || !far(S0.got, x, z, 36)) continue;
          if (App.gridNear("lot", x, z, 40).some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 18)) continue;
          if (App.gridNear("road", x, z, 20).some((rd) => segDist(x, z, rd) < 9)) continue;
          if (App.gridNear("field", x, z, 50).some((f) => Math.abs(f.x - x) < (f.w || 0) + 12 && Math.abs(f.z - z) < (f.d || 0) + 12)) continue;
          if (App.gridNear("poi", x, z, 50).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 12 : p.hill ? p.hill.r + 6 : 18))) continue;
          if (!far(App.lairs, x, z, 70) || !far(App.docks, x, z, 34) || !far(App.etherFields, x, z, 30) || !far(App.dungeons, x, z, 34) || !far(App.mines, x, z, 40)) continue;
          if (gget("landing", x, z).some((b) => Math.hypot(b.mx - x, b.mz - z) < 50)) continue;
          spot = { x, z, h, rot: Math.atan2(R.cx - x, R.cz - z) };
        }
        // (a region with no room left at all: next to its middle, which never happens with the land as it is)
        S0.got.push(spot || { x: R.cx + S0.got.length * 9, z: R.cz, h: genColumn(R.cx + S0.got.length * 9, R.cz).h, rot: 0 });
      }
      return S0.got[j];
    };
    const wilds = (v) => {
      const meadow = App.poisNear(v.x, v.z, 150, (p) => p.type === "meadow").sort((p, q) => Math.hypot(p.x - v.x, p.z - v.z) - Math.hypot(q.x - v.x, q.z - v.z))[0];
      v.grazing = meadow ? { x: meadow.x, z: meadow.z, r: 9 } : { x: v.pasture.x + (v.pasture.x - v.x) * 0.6, z: v.pasture.z + (v.pasture.z - v.z) * 0.6, r: 9 };
      const wild = App.poisNear(v.x, v.z, 240, (p) => p.type === "meadow" || p.type === "camp" || p.type === "falls" || p.type === "grove").sort((p, q) => Math.hypot(p.x - v.x, p.z - v.z) - Math.hypot(q.x - v.x, q.z - v.z));
      const hp = wild.find((p) => p.type !== "grove") || wild[0];
      v.hunt = hp ? { x: hp.x, z: hp.z, poi: hp.i } : { x: v.x + v.r + 50, z: v.z, poi: -1 };
      const gp = wild.find((p) => p.type === "grove") || wild[0];
      v.gather = gp ? { x: gp.x, z: gp.z, poi: gp.i } : { x: v.x, z: v.z + v.r + 40, poi: -1 };
    };
    for (const w of ASSIGN.warrens.slice().sort((a, b) => a.region - b.region || a.j - b.j)) {
      const R = regions[w.region], sp = warrenSpot(R, w.j), fx = Math.sin(sp.rot), fz = Math.cos(sp.rot), rx = fz, rz = -fx;
      const v = { i: villages.length + W.length, lot: null, warren: true, j: w.j, region: R.i, floor: R.floor, cls: "warren", cap: 0, x: sp.x, z: sp.z, r: 15, h: sp.h,
        name: nameFor(R.floor, rng(R.i * 4409 + w.j * 61 + 3)) + " Warren", homes: [], houses: [], hallScale: 1 };
      const key = (v.key = "W" + R.i + ":" + w.j);
      v.style = Math.floor(hash2(R.i * 97 + w.j, 7, 1201) * TB.CLANS.length);
      occupy(v, w.o);
      // the hill behind the square, its door facing the middle of the region
      const mx = sp.x - fx * 10, mz = sp.z - fz * 10;
      for (const [px, pz, rr] of [[sp.x, sp.z, 12], [mx, mz, 10]]) for (const o of App.gridNear("scenery", px, pz, rr + 3)) if (!o.building && Math.hypot(o.x - px, o.z - pz) < rr) o.gone = true;
      v.hall = { x: mx, z: mz, rot: sp.rot, door: { x: mx + fx * 4.4, z: mz + fz * 4.4 } };
      v.hall.sc = tsc(key + "/hall", "warren_" + v.style, mx, mz, sp.rot, { building: true, fixed: true, village: v.i, hall: true, mansion: true, warren: true, scale: 1.3 });
      const H = { x: v.hall.door.x, z: v.hall.door.z, hx: mx, hz: mz, rot: sp.rot, kind: "warren", mansion: true, members: v.residents.slice(), sc: v.hall.sc };
      for (let k = 0; k < v.residents.length; k++) v.homes.push(H);
      // the stores are kept inside, by the door; the altar on one side of the square, the fire in the middle
      v.granary = { x: mx + fx * 5 + rx * 4, z: mz + fz * 5 + rz * 4, rot: sp.rot };
      v.altar = { x: sp.x - rx * 6.5, z: sp.z - rz * 6.5 };
      tsc(key + "/altar", "altar_0", v.altar.x, v.altar.z, Math.atan2(sp.x - v.altar.x, sp.z - v.altar.z), { building: true, village: v.i, fixed: true });
      v.fire = tsc(key + "/fire", "campfire", sp.x, sp.z, hash2(R.i, w.j, 6013) * 6.28, { scale: 1.3 });
      v.logs = [];
      const ring = (n, rad, a0, tag) => {
        for (let k = 0; k < n && v.logs.length * 2 < v.residents.length + 1; k++) {
          const a = (k / n) * 6.28 + a0, x = sp.x + Math.cos(a) * rad, z = sp.z + Math.sin(a) * rad;
          if (Math.hypot(x - mx, z - mz) < 6 || Math.hypot(x - v.altar.x, z - v.altar.z) < 2.6 || genColumn(x, z).h < SEA + 1) continue;
          const s0 = tsc(key + "/" + tag + k, "logseat", x, z, a);
          if (s0) v.logs.push(s0);
        }
      };
      ring(4, 4.2, 0.4, "a"); ring(10, 7.2, 0.15, "b");
      seatsOf(v);
      v.plaza = { x: sp.x, z: sp.z };
      v.fields = []; v.pens = []; v.pen = v.yard = v.fold = null;
      v.pasture = { x: sp.x + rx * 9, z: sp.z + rz * 9, r: 5 };
      wilds(v);
      W.push(v);
    }
    // the places lived in, numbered from 0 (App.villages, the clans); every plot, lived on or not, stays in App.lots
    App.lots = villages.slice();
    const live = villages.filter((v) => !v.vacant).concat(W), remap = new Map();
    live.forEach((v, k) => remap.set(v.i, k));
    for (const v of App.lots) if (v.vacant) v.i = -1;
    for (const v of live) { v.i = remap.get(v.i); v.clan = v.i; v.ident = v.holder || "town:" + v.key; }
    for (const s0 of App.sceneryAll) if (s0.village != null) { const k = remap.get(s0.village); if (k == null) delete s0.village; else s0.village = k; }
    for (const f of App.fields) { const k = remap.get(f.village); f.village = k == null ? -1 : k; }
    for (const pn of App.pens) { const k = remap.get(pn.village); pn.village = k == null ? -1 : k; }
    App.villages = live;
    App.placeByKey = new Map(live.map((v) => [v.key, v]));
    for (const v of live) gadd("village", v, v.x - v.r - 8, v.z - v.r - 8, v.x + v.r + 8, v.z + v.r + 8);
  };
  // the forest pass needs the places indexed first, so buildWorld indexes them itself

  // the direction and distance from a point to the closest water within 40 cells
  function shoreFrom(x, z) {
    let best = null;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * 6.28;
      for (let d = 2; d < 40; d += 1) { if (genColumn(x + Math.cos(a) * d, z + Math.sin(a) * d).h < SEA) { if (!best || d < best.d) best = { a, d }; break; } }
    }
    return best;
  }
  App.shoreFrom = shoreFrom;
  // move a piece of scenery (the hand picks some up); y is only given while it is in the air
  App.moveScenery = (s, x, z, y) => {
    const k0 = gk(Math.floor(s.x / GC), Math.floor(s.z / GC)), k1 = gk(Math.floor(x / GC), Math.floor(z / GC));
    if (k0 !== k1) {
      const c0 = grid.get(k0);
      if (c0 && c0.scenery) { const i = c0.scenery.indexOf(s); if (i >= 0) c0.scenery.splice(i, 1); }
      gadd("scenery", s, x, z, x, z);
    }
    s.x = x; s.z = z;
    if (y != null) s.y = y;
    else { s.y = App.genHeight(x, z); App.st.moved[s.idx] = [Math.round(x * 10) / 10, Math.round(z * 10) / 10]; }
  };
  // the pen a point is in, if any (for walking in and out through the gate)
  App.penAt = (x, z) => { for (const f of gget("field", x, z)) if (f.gateIn && Math.abs(x - f.x) < f.w && Math.abs(z - f.z) < f.d) return f; return null; };
  App.villageAt = (x, z) => { for (const v of gget("village", x, z)) if (Math.hypot(v.x - x, v.z - z) < v.r + 4) return v; return null; };
  App.nearestVillage = (x, z, region) => {
    let best = null, bd = Infinity;
    for (const v of App.villages) { if (region != null && v.region !== region) continue; const d = Math.hypot(x - v.x, z - v.z); if (d < bd) { bd = d; best = v; } }
    return best;
  };
  App.poisNear = (x, z, r, filter) => App.gridNear("poi", x, z, r).filter((p) => Math.hypot(p.x - x, p.z - z) < r && (!filter || filter(p)));
  App.indexPois = () => { if (App.poisIndexed) return; for (const p of App.pois) gadd("poi", p, p.x, p.z, p.x, p.z); };

  // ---------- routes (across bridges when needed) ----------
  // the pairs of regions that a bridge joins
  let links = null;
  const LINKS = () => links || (links = ADJ.filter(([a, b]) => App.bridges.some((br) => (br.a === a && br.b === b) || (br.a === b && br.b === a))));
  function regionPath(a, b) {
    if (a === b) return [a];
    const prev = new Array(6).fill(-1), seen = new Set([a]), q = [a];
    while (q.length) {
      const c = q.shift();
      for (const [x, y] of LINKS()) { const n = x === c ? y : y === c ? x : -1; if (n < 0 || seen.has(n)) continue; seen.add(n); prev[n] = c; q.push(n); }
    }
    const out = [b];
    while (out[0] !== a) out.unshift(prev[out[0]]);
    return out;
  }
  App.route = (x1, z1, x2, z2) => {
    const ra = App.regionOf(x1, z1), rb = App.regionOf(x2, z2);
    const pts = [{ x: x1, z: z1 }];
    if (ra !== rb) {
      const path = regionPath(ra, rb);
      let cx = x1, cz = z1;
      for (let k = 0; k < path.length - 1; k++) {
        const a = path[k], b = path[k + 1];
        const cands = App.bridges.filter((br) => (br.a === a && br.b === b) || (br.a === b && br.b === a));
        const br = cands.sort((p, q) => Math.hypot(p.mx - cx, p.mz - cz) - Math.hypot(q.mx - cx, q.mz - cz))[0];
        const fromA = br.a === a;
        pts.push(fromA ? { x: br.ax, z: br.az } : { x: br.bx, z: br.bz }, fromA ? { x: br.bx, z: br.bz } : { x: br.ax, z: br.az });
        cx = pts[pts.length - 1].x; cz = pts[pts.length - 1].z;
      }
    }
    pts.push({ x: x2, z: z2 });
    return App.throughGates ? App.throughGates(pts) : pts;
  };
  // a way in or out of a fortress goes through the gate that makes it shortest (and a way across it, in by one gate
  // and out by another), so nobody walks through its walls
  App.throughGates = (pts) => {
    const forts = (App.villages || []).filter((v) => v.walls).concat(App.prison && App.prison.walls ? [App.prison] : []);
    if (!forts.length) return pts;
    let out = pts;
    for (const v of forts) {
      const W = v.walls, inside = (p) => Math.hypot(p.x - W.x, p.z - W.z) < W.r - 1;
      const gate = (a, k) => ({ x: W.x + Math.cos(a) * (W.r + k), z: W.z + Math.sin(a) * (W.r + k) });
      const best = (p, q) => { let bg = W.gates[0], bd = Infinity; for (const g of W.gates) { const m = gate(g, 0), d = Math.hypot(m.x - p.x, m.z - p.z) + Math.hypot(m.x - q.x, m.z - q.z); if (d < bd) { bd = d; bg = g; } } return bg; };
      const next = [out[0]];
      for (let i = 1; i < out.length; i++) {
        const p = out[i - 1], q = out[i], pin = inside(p), qin = inside(q);
        if (pin !== qin) { const g = best(p, q); next.push(gate(g, pin ? -3 : 3), gate(g, pin ? 3 : -3)); }
        else if (!pin) {
          // both outside: does the way cross the walls?
          const dx = q.x - p.x, dz = q.z - p.z, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((W.x - p.x) * dx + (W.z - p.z) * dz) / L));
          if (Math.hypot(p.x + dx * t - W.x, p.z + dz * t - W.z) < W.r + 1) { const g1 = best(p, p), g2 = best(q, q); next.push(gate(g1, 3), gate(g1, -3)); if (g2 !== g1) next.push(gate(g2, -3)); next.push(gate(g2, 3)); }
        }
        next.push(q);
      }
      out = next;
    }
    return out;
  };
  App.pathLength = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return L; };
  App.alongPath = (pts, d) => {
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
      if (d <= L) { const t = L ? d / L : 0; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t }; }
      d -= L;
    }
    return pts[pts.length - 1];
  };
})();
