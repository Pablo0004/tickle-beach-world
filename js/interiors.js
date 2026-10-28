/* Interiors, the way the Pokemon games build them. Every house, town hall, granary, dungeon and mine
 * leads into its own small maps (rooms), drawn on their own on black, away from the overworld. Each
 * room numbers its warps -- a doormat, a stair, a ladder -- and each warp names where it lands: a warp
 * of another room, or the outside door it came from, so going in and coming back out always match up.
 *   house (cottage)  1F living room <-> 2F bedroom          house (round hut)  one room
 *   town hall        1F hall <-> 2F council room            granary            the store room
 *   dungeon          the Great Underworld, 12 floors          mine               galleries, deeper with its level
 *   guild hall       the hall and its board
 * Inside you see the furniture and whoever is in there: the owner asleep or at breakfast, villagers
 * hiding from a dragon, the parties fighting their way down (warriors with blades, mages with spells,
 * healers with light), the miners at the rock face and the guards of the Warriors' Guild on their rounds.
 * Enter: click a building, cave or mine and press "Go inside" (or press E near one). Leave: the
 * doormat, stairs or ladder buttons, or Esc. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const maps = new Map();
  const rngOf = (seed) => { let s = (Math.imul(seed + 7, 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  // ---------- what can be entered, and where its door is ----------
  function doorOf(s) {
    const v = App.villages[s.village];
    if (s.house) { const h = (v.houses && v.houses[s.slot]) || v.homes[s.slot]; return { x: h.x, z: h.z }; }
    if (s.hall) return { x: v.hall.door.x, z: v.hall.door.z };
    return { x: s.x + Math.sin(s.rot) * 3, z: s.z + Math.cos(s.rot) * 3 };
  }
  App.enterableAt = (x, z) => {
    let best = null, bd = 7;
    for (const s of App.gridNear("scenery", x, z, 12)) {
      if (!s.building || s.ruined || s.village == null || !(s.house || s.hall || s.granary)) continue;
      const door = doorOf(s), d = Math.min(Math.hypot(door.x - x, door.z - z), Math.hypot(s.x - x, s.z - z) * 0.9);
      if (d < bd) { bd = d; best = { kind: s.house ? "house" : s.hall ? "hall" : "granary", sc: s, door }; }
    }
    for (const dg of App.dungeons || []) { const d = Math.min(Math.hypot(dg.door.x - x, dg.door.z - z), Math.hypot(dg.x - x, dg.z - z)); if (d < bd + 3) { bd = d - 3; best = { kind: "dungeon", dg, door: dg.door }; } }
    for (const m of App.mines || []) { const d = Math.min(Math.hypot(m.door.x - x, m.door.z - z), Math.hypot(m.x - x, m.z - z)); if (d < bd + 3) { bd = d - 3; best = { kind: "mine", mine: m, door: m.door }; } }
    for (const Cs of App.casinos || []) { const d = Math.min(Math.hypot(Cs.door.x - x, Cs.door.z - z), Math.hypot(Cs.x - x, Cs.z - z) * 0.8); if (d < bd + 2) { bd = d - 2; best = { kind: "casino", casino: Cs, door: Cs.door }; } }
    if (App.parliament && App.parliament.door) { const P = App.parliament, d = Math.min(Math.hypot(P.door.x - x, P.door.z - z), Math.hypot(P.sc.x - x, P.sc.z - z) * 0.6); if (d < bd + 2) { bd = d - 2; best = { kind: "parliament", parliament: P, door: P.door }; } }
    if (App.prison && App.prison.door) { const P = App.prison, d = Math.min(Math.hypot(P.door.x - x, P.door.z - z), Math.hypot(P.sc.x - x, P.sc.z - z) * 0.9); if (d < bd + 1) { bd = d - 1; best = { kind: "prison", prison: P, door: P.door }; } }
    // a sea cave: only from down at its mouth, under the water (sea.js)
    const sc0 = App.seaCaveAt ? App.seaCaveAt(x, z, App.diverY ? App.diverY() : 99) : null;
    if (sc0) return sc0.under ? { kind: "seacave", cave: sc0.cave, door: sc0.cave.door, name: sc0.cave.name } : { kind: "seacave", cave: sc0.cave, door: sc0.cave.door, name: sc0.cave.name, shut: "The way into " + sc0.cave.name + " is down on the sea floor: dive down to it." };
    const gh = App.guildHallAt ? App.guildHallAt(x, z) : null;
    if (gh) { const d = Math.min(Math.hypot(gh.door.x - x, gh.door.z - z), Math.hypot(gh.x - x, gh.z - z) * 0.9); if (d < bd) { bd = d; best = { kind: "guild", hall: gh, door: gh.door }; } }
    if (best) best.name = nameOf(best);
    return best;
  };
  function nameOf(T) {
    if (T.kind === "house") { const ids = App.residentsOf(T.sc); if (T.sc.castle) return App.villages[T.sc.village].name; if (/^(mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic)_/.test(T.sc.type)) return App.villages[T.sc.village].name + ": a mansion of " + ids.length; if (ids.length > 1) return "The house of a household of " + ids.length; return (ids.length ? App.nameOf(ids[0]) + "'s " : "A ") + (T.sc.type.startsWith("manor") ? "manor" : T.sc.type.startsWith("townhouse") ? "townhouse" : "house"); }
    if (T.kind === "hall") { const v = App.villages[T.sc.village]; return v.warren ? v.name : v.kind === "town" || !v.kind ? v.name + " Town Hall" : v.kind === "estate" ? v.name + ": the Manor" : v.name; }
    if (T.kind === "granary") return App.villages[T.sc.village].name + " Granary";
    if (T.kind === "dungeon") return T.dg.name;
    if (T.kind === "guild") return App.GUILDS[T.hall.guild].name + " of " + App.regions[T.hall.region].name;
    if (T.kind === "casino") return T.casino.name;
    if (T.kind === "prison") return T.prison.name;
    if (T.kind === "parliament") return T.parliament.name;
    if (T.kind === "seacave") return T.cave.name;
    return T.mine.name;
  }

  // ---------- the maps: rooms, their furniture and their numbered warps ----------
  // room: { name, w, d, h, floor: [colour, colour], wall, trim, dark, items: [{ k, v, x, z, y, rot, s }], warps: [{ id, x, z, kind, label, to }], spots }
  // a warp's `to` is { room, warp } inside the same map, or { outside: true } (the door it came in by)
  function room(name, w, d, o) { return Object.assign({ name, w, d, h: 6, floor: ["#c79a62", "#b58850"], wall: "#fff4d6", trim: "#a0703a", dark: false, items: [], warps: [], spots: {} }, o || {}); }
  const back = (R, dz) => -R.d / 2 + (dz || 0.6);
  // a townhouse or a manor, bought with its owner's shells (wealth.js): bigger rooms and more in them
  // the bed model is about 3.1 long and 2 wide; a Tickle is about 3 tall, so beds are made a little bigger
  const BED_W = 1.15, BED_L = 1.3, BED_HALF = (254 / 160) * BED_L, BED_HEAD = ((254 - 36) / 160) * BED_L - 0.15, BED_TOP = 126 / 160 - 0.08;
  // a bed for each Tickle who lives there, in rows from the back wall; the first is the one in spots.bed
  function bedsFor(R, n, c, x0, perRow, dx) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / perRow), col = k % perRow, x = x0 + col * (dx || 2.9), z = back(R, 2.2 + row * 5.4);
      if (k > 0) R.items.push({ k: "bed", v: c, x, z });
      out.push({ x, z: z - 0.2 });
    }
    R.spots.beds = out; R.spots.bed = out[0];
  }
  // a mansion: every Tickle of its holder lives in it; a great hall, a dormitory with a bed for each, a strong room
  function mansionMap(T) {
    const map = richMap(T, 2), n = App.residentsOf(T.sc).length, v = App.villages[T.sc.village];
    if (n > 2) {
      const rows = Math.ceil(n / 6), B = map.rooms[1];
      B.name = "Bedrooms (2F)"; B.w = 20; B.d = 6 + rows * 5.4;
      B.items = B.items.filter((it) => it.k !== "bed" && it.k !== "stairs" && it.k !== "window" && it.k !== "picture" && it.k !== "shelf");
      B.items.push({ k: "bed", v: v.style, x: -7.2, z: back(B, 2.2) }, { k: "stairs", x: B.w / 2 - 2, z: B.d / 2 - 2 }, { k: "window", x: 0, z: back(B, 0.15) }, { k: "picture", x: 5, z: back(B, 0.2), y: 2.2 });
      B.warps[0].x = B.w / 2 - 2; B.warps[0].z = B.d / 2 - 2;
      bedsFor(B, n, v.style, -7.2, 6);
    }
    map.title = v.name;
    return map;
  }
  // a warren: one great cavern dug under the hill, walls of bare rock; the hearth and the long table by the round door,
  // a bed for every Tickle who lives there in rows at the back, the stores along the sides, glowing mushrooms
  function warrenMap(T) {
    const v = App.villages[T.sc.village], c = v.style, n = Math.max(1, App.residentsOf(T.sc).length);
    const perRow = n > 60 ? 12 : n > 24 ? 8 : 6, rows = Math.ceil(n / perRow), dx = 2.9, w = Math.max(24, perRow * dx + 8), d = 16 + rows * 5.4;
    const A = room("The cavern", w, d, { h: 7, floor: ["#7a6a58", "#6e5f4f"], wall: "#8a7a68", trim: "#5a4a3a", dark: true });
    const front = A.d / 2, x0 = -((perRow - 1) * dx) / 2, tz = front - 6;
    A.items.push({ k: "mat", x: 0, z: front - 1 }, { k: "rug", v: c, x: 3, z: front - 4.5 }, { k: "banner", v: c, x: -4, z: back(A, 0.2), y: 0.6 }, { k: "banner", v: c, x: 4, z: back(A, 0.2), y: 0.6 },
      { k: "longtable", x: -w / 2 + 7, z: tz, rot: Math.PI / 2, tag: "table" }, { k: "stove", x: -w / 2 + 1.6, z: front - 2.2 },
      { k: "lantern", x: -w / 2 + 7, z: tz - 2.6, light: true }, { k: "lantern", x: w / 2 - 6, z: front - 3, light: true });
    for (let k = 0; k < 3; k++) for (const side of [-1, 1]) A.items.push({ k: "chair", x: -w / 2 + 4 + k * 2.4, z: tz + side * 1.9, rot: side > 0 ? Math.PI : 0 });
    // the stores along the walls, the mushrooms in the corners, torches all the way back
    A.items.push({ k: "barrel", x: w / 2 - 1.3, z: front - 7 }, { k: "barrel", x: w / 2 - 1.3, z: front - 8.8 }, { k: "sacks", x: w / 2 - 1.5, z: front - 11 }, { k: "crate", x: w / 2 - 3.2, z: front - 7.6, rot: 0.3 },
      { k: "mushrooms", x: -w / 2 + 1.4, z: back(A, 1.4) }, { k: "mushrooms", x: w / 2 - 1.4, z: back(A, 1.4) }, { k: "mushrooms", x: -w / 2 + 1.6, z: front - 9 });
    for (let z = front - 4; z > -front + 2; z -= 7) for (const side of [-1, 1]) A.items.push({ k: "torch", x: side * (w / 2 - 0.3), z, y: 2.4, rot: -side * Math.PI / 2 });
    A.items.push({ k: "bed", v: c, x: x0, z: back(A, 2.2) });
    bedsFor(A, n, c, x0, perRow, dx);
    A.spots.table = { x: -w / 2 + 4, z: tz + 1.8, face: Math.PI };
    A.warps.push({ id: 0, x: 0, z: front - 1, kind: "mat", label: "Outside", to: { outside: true } });
    A.note = v.name + ": " + App.placeKindText(v) + ". A bed for each of them; they grow mushrooms in the dark until a plot comes free on the land above.";
    return { title: v.name, rooms: [A] };
  }
  // a castle (or a great palace) for all of a holder's Tickles: the throne hall with its long tables, a dormitory in
  // every tower with a bed for each (48 to a tower), and the treasury
  const PER_DORM = 48;
  function castleMap(T) {
    const s = T.sc, v = App.villages[s.village], c = v.style, ids = App.residentsOf(s), n = Math.max(1, ids.length), dorms = Math.ceil(n / PER_DORM), keep = s.type.startsWith("castle");
    const A = room(keep ? "Throne hall (1F)" : "Great hall (1F)", 34, 24, { h: 9, floor: keep ? ["#9a948a", "#8a847a"] : ["#d8c8a8", "#c8b898"], wall: keep ? "#b0aa9e" : "#fff8e8", trim: keep ? "#6e665a" : "#a0703a" });
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "rug", v: c, x: 0, z: 0 }, { k: "throne", x: 0, z: back(A, 2.6) }, { k: "banner", v: c, x: -5, z: back(A, 0.2), y: 0.6 }, { k: "banner", v: c, x: 5, z: back(A, 0.2), y: 0.6 },
      { k: "longtable", x: -8, z: 3, rot: Math.PI / 2, tag: "table" }, { k: "longtable", x: 8, z: 3, rot: Math.PI / 2 }, { k: "brazier", x: -3, z: back(A, 3), light: true }, { k: "brazier", x: 3, z: back(A, 3), light: true });
    for (const tx of [-8, 8]) for (let k = 0; k < 3; k++) for (const side of [-1, 1]) A.items.push({ k: "chair", x: tx - 2.4 + k * 2.4, z: 3 + side * 1.9, rot: side > 0 ? Math.PI : 0 });
    for (const z of [-6, 2, 8]) for (const side of [-1, 1]) A.items.push({ k: "torch", x: side * (A.w / 2 - 0.3), z, y: 2.6, rot: -side * Math.PI / 2 });
    A.spots.table = { x: -10.4, z: 4.9, face: Math.PI };
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    const rooms = [A];
    for (let d = 0; d < dorms; d++) {
      const nb = Math.min(PER_DORM, n - d * PER_DORM), perRow = 8, rows = Math.ceil(nb / perRow), x0 = -((perRow - 1) * 2.9) / 2;
      const R = room("Tower dormitory " + (d + 1), perRow * 2.9 + 6, 8 + rows * 5.4, { floor: keep ? ["#8a847a", "#7e786e"] : ["#d8b98a", "#c9a978"], wall: keep ? "#b0aa9e" : "#fff4d6" });
      R.items.push({ k: "bed", v: c, x: x0, z: back(R, 2.2) }, { k: "stairs", x: R.w / 2 - 2, z: R.d / 2 - 2 }, { k: "torch", x: -R.w / 2 + 0.3, z: 0, y: 2.4, rot: Math.PI / 2 }, { k: "torch", x: R.w / 2 - 0.3, z: 0, y: 2.4, rot: -Math.PI / 2 });
      bedsFor(R, nb, c, x0, perRow);
      R.warps.push({ id: 0, x: R.w / 2 - 2, z: R.d / 2 - 2, kind: "stairs", label: "Down to the hall", to: { room: 0, warp: d + 1 } });
      // the stairs up to the towers, along both side walls of the hall
      const sx = (d % 2 ? 1 : -1) * (A.w / 2 - 2), sz = back(A, 3 + Math.floor(d / 2) * 4);
      A.items.push({ k: "stairs", x: sx, z: sz });
      A.warps.push({ id: d + 1, x: sx, z: sz, kind: "stairs", label: "Up to tower dormitory " + (d + 1), to: { room: d + 1, warp: 0 } });
      rooms.push(R);
    }
    const Tr = room("Treasury (1F)", 14, 11, { floor: ["#9a9a9a", "#8a8a8a"], wall: "#e8e0d0" });
    Tr.items.push({ k: "chest", v: 1, x: -4, z: back(Tr, 1.2) }, { k: "chest", v: 1, x: -1.3, z: back(Tr, 1.2) }, { k: "chest", v: 1, x: 1.4, z: back(Tr, 1.2) }, { k: "chest", v: 0, x: 4, z: back(Tr, 1.2) }, { k: "sacks", x: -Tr.w / 2 + 1.5, z: 1.5 }, { k: "barrel", x: Tr.w / 2 - 1.3, z: 1.6 }, { k: "mat", x: 0, z: Tr.d / 2 - 1 });
    Tr.warps.push({ id: 0, x: 0, z: Tr.d / 2 - 1, kind: "mat", label: "Back to the hall", to: { room: 0, warp: 99 } });
    A.warps.push({ id: 99, x: A.w / 2 - 4, z: A.d / 2 - 1.2, kind: "mat", label: "The treasury", to: { room: rooms.length, warp: 0 } });
    rooms.push(Tr);
    A.note = v.name + ": " + App.placeKindText(v) + ". " + dorms + " tower dormitor" + (dorms === 1 ? "y" : "ies") + ", a bed for every one of them.";
    return { title: v.name, rooms, perDorm: PER_DORM, firstDorm: 1, maxEat: 24 };
  }
  // the prison (prison.js): a guard room under the blockhouse, the canteen below it, and the cell blocks one after another
  // further down, twelve cells to a block, a bed and an iron gate to each
  // the Parliament (parliament.js): one great chamber, a seat for every one of the 333 ministers in rows round the
  // Speaker's chair, the blocs side by side
  function chamberMap(T) {
    const P = App.parliament, R = room("The Chamber", 62, 36, { h: 9, floor: ["#e8e0d0", "#d8d0c0"], wall: "#fff8e8", trim: "#a0703a" });
    const cz = -R.d / 2 + 4;
    R.items.push({ k: "mat", x: 0, z: R.d / 2 - 1 }, { k: "throne", x: 0, z: back(R, 1.6) }, { k: "longtable", x: 0, z: cz - 0.2, rot: Math.PI / 2 },
      { k: "banner", v: 0, x: -6, z: back(R, 0.2), y: 1 }, { k: "banner", v: 3, x: 6, z: back(R, 0.2), y: 1 }, { k: "picture", x: 0, z: back(R, 0.2), y: 4.6 },
      { k: "plant", x: -R.w / 2 + 1.4, z: R.d / 2 - 2 }, { k: "plant", x: R.w / 2 - 1.4, z: R.d / 2 - 2 });
    for (const z of [-10, 0, 10]) for (const side of [-1, 1]) R.items.push({ k: "torch", x: side * (R.w / 2 - 0.3), z, y: 3, rot: -side * Math.PI / 2 });
    R.seats = App.chamberSeats(R);
    for (const s of R.seats) R.items.push({ k: "chair", x: s.x, z: s.z, rot: s.rot });
    R.warps.push({ id: 0, x: 0, z: R.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    R.note = App.parliamentNote ? App.parliamentNote() : "";
    return { title: P.name, rooms: [R] };
  }
  const PER_BLOCK = 12;
  function prisonMap(T) {
    const P = App.prison, n = Math.max(1, App.prisoners().length), blocks = Math.max(1, Math.ceil(n / PER_BLOCK));
    const look = { floor: ["#7a766e", "#6e6a62"], wall: "#9a948a", trim: "#4a4a4a" };
    const A = room("Guard room", 18, 12, Object.assign({ h: 6 }, look));
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "table", v: 1, x: -4, z: -1.5 }, { k: "chair", x: -4, z: 0.2, rot: Math.PI }, { k: "chair", x: -5.6, z: -1.5, rot: Math.PI / 2 },
      { k: "barrel", x: A.w / 2 - 1.3, z: A.d / 2 - 1.6 }, { k: "crate", x: A.w / 2 - 1.5, z: A.d / 2 - 3.6, rot: 0.3 }, { k: "cage", x: 3, z: back(A, 1.4) },
      { k: "torch", x: -A.w / 2 + 0.3, z: 0, y: 2.4, rot: Math.PI / 2 }, { k: "torch", x: A.w / 2 - 0.3, z: 0, y: 2.4, rot: -Math.PI / 2 },
      { k: "stairs", x: -A.w / 2 + 2, z: back(A, 1.8) }, { k: "stairs", x: A.w / 2 - 2, z: back(A, 1.8) });
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } },
      { id: 1, x: -A.w / 2 + 2, z: back(A, 1.8), kind: "stairs", label: "Down to the canteen (B1)", to: { room: 1, warp: 0 } },
      { id: 2, x: A.w / 2 - 2, z: back(A, 1.8), kind: "stairs", label: "Down to the cells (B2)", to: { room: 2, warp: 0 } });
    A.note = P.name + ": " + App.prisoners().length + " Tickles up for sale live here until somebody buys them.";
    const B = room("Canteen (B1)", 22, 14, Object.assign({ h: 5, dark: true }, look));
    B.items.push({ k: "longtable", x: -4, z: 0, rot: 0, tag: "table" }, { k: "longtable", x: 4, z: 0, rot: 0 }, { k: "stove", x: -B.w / 2 + 1.6, z: back(B, 1.6) }, { k: "barrel", x: B.w / 2 - 1.3, z: back(B, 1.4) },
      { k: "sacks", x: B.w / 2 - 1.5, z: back(B, 3.2) }, { k: "stairs", x: B.w / 2 - 2, z: B.d / 2 - 2 },
      { k: "torch", x: -B.w / 2 + 0.3, z: 0, y: 2.4, rot: Math.PI / 2 }, { k: "torch", x: B.w / 2 - 0.3, z: 0, y: 2.4, rot: -Math.PI / 2 });
    B.seats = [];
    for (let k = 0; k < 6; k++) for (const side of [-1, 1]) for (const tx of [-4, 4]) B.seats.push({ x: tx + side * 1.6, z: -2.8 + k * 1.1, rot: side > 0 ? -Math.PI / 2 : Math.PI / 2 }); // both tables fill up together
    B.warps.push({ id: 0, x: B.w / 2 - 2, z: B.d / 2 - 2, kind: "stairs", label: "Up to the guard room", to: { room: 0, warp: 1 } });
    const rooms = [A, B];
    for (let k = 0; k < blocks; k++) {
      const nb = Math.min(PER_BLOCK, n - k * PER_BLOCK), w = Math.ceil(PER_BLOCK * 3.4 + 3), R = room("Cell block " + (k + 1) + " (B" + (k + 2) + ")", w, 13, Object.assign({ h: 5, dark: true }, look));
      const x0 = -((PER_BLOCK - 1) * 3.4) / 2, front = back(R, 4.9);
      R.items.push({ k: "bed", v: 0, x: x0, z: back(R, 2.2) });
      bedsFor(R, nb, 0, x0, PER_BLOCK, 3.4);
      // an iron gate across the front of every cell, a stone pillar between one cell and the next
      for (let c = 0; c < PER_BLOCK; c++) R.items.push({ k: "gate", x: x0 + c * 3.4, z: front, s: [0.62, 0.8, 1] });
      for (let c = 0; c <= PER_BLOCK; c++) R.items.push({ k: "pillar", x: x0 - 1.7 + c * 3.4, z: front, s: [0.55, 0.62, 0.55] });
      for (let c = 0; c < 4; c++) R.items.push({ k: "torch", x: x0 + 1.7 + c * 3.4 * 3, z: back(R, 0.3), y: 2.6 });
      const sx = R.w / 2 - 2, sz = R.d / 2 - 1.8, nx = -R.w / 2 + 2;
      R.items.push({ k: "stairs", x: sx, z: sz });
      R.warps.push({ id: 0, x: sx, z: sz, kind: "stairs", label: k ? "Up to cell block " + k : "Up to the guard room", to: k ? { room: k + 1, warp: 1 } : { room: 0, warp: 2 } });
      if (k + 1 < blocks) { R.items.push({ k: "stairs", x: nx, z: sz }); R.warps.push({ id: 1, x: nx, z: sz, kind: "stairs", label: "Down to cell block " + (k + 2), to: { room: k + 3, warp: 0 } }); }
      R.note = nb + " cells in this block, a bed in each.";
      rooms.push(R);
    }
    return { title: P.name, rooms, perDorm: PER_BLOCK, firstDorm: 2 };
  }
  function richMap(T, tier) {
    const s = T.sc, v = App.villages[s.village], c = v.style, id = App.residentsOf(s)[0];
    const A = room(tier === 2 ? "Great hall (1F)" : "Parlour (1F)", tier === 2 ? 24 : 18, tier === 2 ? 16 : 13, { h: tier === 2 ? 7 : 6, floor: tier === 2 ? ["#d8c8a8", "#c8b898"] : ["#c79a62", "#b58850"], wall: tier === 2 ? "#fff8e8" : "#fff4d6" });
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "rug", v: c, x: 0, z: 0.5 }, { k: "picture", x: 0, z: back(A, 0.2), y: 1.8 }, { k: "window", x: -5.5, z: back(A, 0.15) }, { k: "window", x: 5.5, z: back(A, 0.15) },
      { k: "plant", x: -A.w / 2 + 1.3, z: A.d / 2 - 2 }, { k: "plant", x: A.w / 2 - 1.3, z: A.d / 2 - 2 }, { k: "shelf", x: -A.w / 2 + 2.6, z: back(A, 0.45) }, { k: "stove", x: -A.w / 2 + 1.6, z: back(A, 2.6) },
      { k: "stairs", x: A.w / 2 - 2.2, z: back(A, 1.8) });
    if (tier === 2) {
      A.items.push({ k: "longtable", x: -1, z: 0.6, rot: Math.PI / 2, tag: "table" }, { k: "throne", x: -6.2, z: 0.6, rot: Math.PI / 2 }, { k: "banner", v: c, x: -3, z: back(A, 0.2), y: 0.6 }, { k: "banner", v: c, x: 3, z: back(A, 0.2), y: 0.6 },
        { k: "torch", x: -A.w / 2 + 0.3, z: -2, y: 2.4, rot: Math.PI / 2 }, { k: "torch", x: A.w / 2 - 0.3, z: -2, y: 2.4, rot: -Math.PI / 2 });
      for (let k = 0; k < 3; k++) for (const side of [-1, 1]) A.items.push({ k: "chair", x: -3 + k * 2.4, z: 0.6 + side * 1.9, rot: side > 0 ? Math.PI : 0 });
      A.spots.table = { x: -3, z: 2.4, face: Math.PI };
    } else {
      A.items.push({ k: "table", v: 1, x: -2.8, z: 0.4, tag: "table" }, { k: "chair", x: -2.8, z: 2, rot: Math.PI }, { k: "chair", x: -2.8, z: -1.2 }, { k: "chair", x: -4.4, z: 0.4, rot: Math.PI / 2 });
      A.spots.table = { x: -2.8, z: 1.9, face: Math.PI };
    }
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } }, { id: 1, x: A.w / 2 - 2.2, z: back(A, 1.8), kind: "stairs", label: "Up to the bedroom (2F)", to: { room: 1, warp: 0 } });
    const B = room(tier === 2 ? "Master bedroom (2F)" : "Bedroom (2F)", tier === 2 ? 18 : 15, tier === 2 ? 12 : 11, { floor: ["#d8b98a", "#c9a978"] });
    B.items.push({ k: "stairs", x: B.w / 2 - 2, z: back(B, 1.8) }, { k: "bed", v: c, x: -3.8, z: back(B, 2.2), tag: "bed" }, { k: "rug", v: c, x: -1, z: 1.2 }, { k: "window", x: 0.5, z: back(B, 0.15) },
      { k: "plant", x: -B.w / 2 + 1.2, z: B.d / 2 - 1.6 }, { k: "picture", x: -3.8, z: back(B, 0.2), y: 2.2 }, { k: "shelf", x: 3, z: back(B, 0.45) });
    if (tier === 2) B.items.push({ k: "bed", v: c, x: -0.2, z: back(B, 2.2) }, { k: "window", x: -6, z: back(B, 0.15) });
    B.warps.push({ id: 0, x: B.w / 2 - 2, z: back(B, 1.8), kind: "stairs", label: "Down to the " + (tier === 2 ? "great hall" : "parlour") + " (1F)", to: { room: 0, warp: 1 } });
    B.spots.bed = { x: -3.8, z: back(B, 2.0) };
    { const n = App.residentsOf(s).length; if (n > 1 && !s.mansion && !s.type.startsWith("palace")) bedsFor(B, Math.min(6, n), c, -3.8, 3);
      // with a third bed in the row the bookshelf goes against the side wall, out of its way
      if (n > 2 && !s.mansion) { const sh = B.items.find((it) => it.k === "shelf"); if (sh) { sh.x = -B.w / 2 + 0.45; sh.z = 0.6; sh.rot = Math.PI / 2; } } }
    const rooms = [A, B];
    // a manor's strong room: the family's shells in open chests, its Ethernum, its arms on the wall
    if (tier === 2) {
      const C = room("Strong room (1F)", 12, 10, { floor: ["#9a9a9a", "#8a8a8a"], wall: "#e8e0d0" });
      C.items.push({ k: "chest", v: 1, x: -3, z: back(C, 1.2) }, { k: "chest", v: 1, x: 0, z: back(C, 1.2) }, { k: "chest", v: 0, x: 3, z: back(C, 1.2) }, { k: "sacks", x: -C.w / 2 + 1.5, z: 1.5 }, { k: "barrel", x: C.w / 2 - 1.3, z: 1.6 },
        { k: "torch", x: -C.w / 2 + 0.3, z: -1, y: 2.4, rot: Math.PI / 2 }, { k: "torch", x: C.w / 2 - 0.3, z: -1, y: 2.4, rot: -Math.PI / 2 }, { k: "mat", x: 0, z: C.d / 2 - 1 });
      if (id != null && App.ethernumOf && App.ethernumOf(id) >= 1) C.items.push({ k: "crystal", x: 2.6, z: 1.4 });
      C.warps.push({ id: 0, x: 0, z: C.d / 2 - 1, kind: "mat", label: "Back to the great hall", to: { room: 0, warp: 2 } });
      A.warps.push({ id: 2, x: -A.w / 2 + 2, z: A.d / 2 - 1.2, kind: "mat", label: "The strong room", to: { room: 2, warp: 0 } });
      C.note = id != null ? App.nameOf(id) + "'s fortune: " + Math.round(App.shellsOf(id)).toLocaleString() + " shells in the chests" + (App.ethernumOf ? " and " + (Math.round(App.ethernumOf(id) * 10) / 10) + " Ethernum" : "") + "." : "";
      rooms.push(C);
    }
    if (id != null) {
      if (App.pop.ground[id] >= 0) A.items.push({ k: "__ground", id, x: A.w / 2 - 3, z: -0.6, rot: -0.5 });
      const pet = App.leadCreature && App.leadCreature(id);
      if (pet) A.items.push({ k: pet.sp, x: 2.4, z: 3, rot: Math.PI + 0.4, pet: true });
      if (App.slayerOf && App.slayerOf(id)) A.items.push({ k: "bones", x: A.w / 2 - 1.6, z: 2.4, rot: 2 });
      if (App.gearOf && App.gearOf(id)) A.items.push({ k: "chest", v: 1, x: -A.w / 2 + 3.6, z: A.d / 2 - 1.6, rot: 0.2 });
      const job = App.JOB_INFO[App.jobOf(id)];
      A.note = App.nameOf(id) + ": " + (job ? job.title : "villager") + ", level " + App.levelOf(id) + (App.wealthText && App.wealthText(id) ? " \u00b7 owns " + App.wealthText(id) : "") + (App.gearOf && App.gearOf(id) ? " \u00b7 " + App.gearText(id) : "");
    }
    return { title: nameOf(T), rooms };
  }
  function houseMap(T) {
    const s = T.sc, v = App.villages[s.village], c = v.style, r = rngOf(s.idx * 31 + 5), cottage = s.type.startsWith("cottage");
    if (s.castle) return castleMap(T);
    if (/^(mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic)_/.test(s.type)) return mansionMap(T);
    if (s.type.startsWith("manor") || s.type.startsWith("townhouse")) return richMap(T, s.type.startsWith("manor") ? 2 : 1);
    const A = room(cottage ? "Living room (1F)" : "One room", cottage ? 16 : 15, cottage ? 12 : 12);
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "rug", v: c, x: 0, z: 0.5 }, { k: "table", v: 0, x: -3.2, z: 0.2, tag: "table" },
      { k: "chair", x: -3.2, z: 1.8, rot: Math.PI }, { k: "chair", x: -3.2, z: -1.4 }, { k: "stove", x: -A.w / 2 + 1.6, z: back(A, 1.1) },
      { k: "picture", x: 0, z: back(A, 0.2), y: 1.6 }, { k: "window", x: -4.5, z: back(A, 0.15) }, { k: "plant", x: A.w / 2 - 1.3, z: A.d / 2 - 2.2 });
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    A.spots.table = { x: -3.2, z: 1.7, face: Math.PI };
    // what makes it this Tickle's home: its on-chain Ground item, its creature, its trophies, its stores
    const id = App.residentsOf(s)[0];
    A.items.push({ k: "barrel", x: -A.w / 2 + 1.3, z: A.d / 2 - 1.6 }, { k: "crate", x: -A.w / 2 + 1.4, z: A.d / 2 - 3.6, rot: 0.3 });
    if (id != null) {
      if (App.pop.ground[id] >= 0) A.items.push({ k: "__ground", id, x: A.w / 2 - 2.6, z: -0.6, rot: -0.5 });
      const pet = App.leadCreature && App.leadCreature(id);
      if (pet) A.items.push({ k: pet.sp, x: 2.4, z: 2.6, rot: Math.PI + 0.4, pet: true });
      if (App.slayerOf && App.slayerOf(id)) A.items.push({ k: "bones", x: A.w / 2 - 1.6, z: 2.2, rot: 2 });
      if (App.gearOf && App.gearOf(id)) A.items.push({ k: "chest", v: 1, x: -A.w / 2 + 3.4, z: A.d / 2 - 1.6, rot: 0.2 });
      const job = App.JOB_INFO[App.jobOf(id)], item = App.pop.ground[id] >= 0 ? App.MODEL_NAMES["ground:" + App.pop.ground[id]] : null;
      A.note = App.nameOf(id) + ": " + (job ? job.title : "villager") + ", level " + App.levelOf(id) + (item ? " \u00b7 keeps its " + item + " by the wall" : "") + (pet ? " \u00b7 " + App.creatureLabel(pet) + " lives here too" : "") +
        (App.gearOf && App.gearOf(id) ? " \u00b7 " + App.gearText(id) : "") + (App.slayerOf && App.slayerOf(id) ? " \u00b7 a dragon slayer: the dragon's bones are its trophy" : "");
    }
    if (!cottage) {
      A.items.push({ k: "bed", v: c, x: A.w / 2 - 2.4, z: back(A, 2.2), tag: "bed" }, { k: "shelf", x: 3, z: back(A, 0.45) });
      A.spots.bed = { x: A.w / 2 - 2.4, z: back(A, 2.0) };
      { const n = App.residentsOf(s).length; if (n > 1) bedsFor(A, Math.min(4, n), c, A.w / 2 - 2.4, 2, -2.9); }
      return { title: nameOf(T), rooms: [A] };
    }
    A.items.push({ k: "shelf", x: 2.6, z: back(A, 0.45) }, { k: "ladder", x: A.w / 2 - 1.8, z: back(A, 0.35) });
    A.warps.push({ id: 1, x: A.w / 2 - 1.8, z: back(A, 0.8), kind: "ladder", label: "Up to the bedroom (2F)", to: { room: 1, warp: 0 } });
    const B = room("Bedroom (2F)", 14, 10, { floor: ["#d8b98a", "#c9a978"] });
    B.items.push({ k: "stairs", x: B.w / 2 - 2, z: back(B, 1.8) }, { k: "bed", v: c, x: -3.6, z: back(B, 2.2), tag: "bed" }, { k: "rug", v: c, x: -1, z: 1.2 },
      { k: "window", x: 0.5, z: back(B, 0.15) }, { k: "plant", x: -B.w / 2 + 1.2, z: B.d / 2 - 1.6 }, { k: "picture", x: -0.5 - (r() < 0.5 ? 2 : 0), z: back(B, 0.2), y: 1.6 });
    B.warps.push({ id: 0, x: B.w / 2 - 2, z: back(B, 1.8), kind: "stairs", label: "Down to the living room (1F)", to: { room: 0, warp: 1 } });
    B.spots.bed = { x: -3.6, z: back(B, 2.0) };
    { const n = App.residentsOf(s).length; if (n > 1) bedsFor(B, Math.min(4, n), c, -3.6, 2); }
    return { title: nameOf(T), rooms: [A, B] };
  }
  function hallMap(T) {
    const v = App.villages[T.sc.village], c = v.style;
    const A = room("Great hall (1F)", 22, 16, { floor: ["#9a9a9a", "#8a8a8a"], wall: "#f3e2c0", h: 7 });
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "longtable", x: 0, z: 0, rot: 0 }, { k: "throne", x: 0, z: back(A, 1.4), rot: 0 },
      { k: "banner", v: c, x: -5, z: back(A, 0.2), y: 0.6 }, { k: "banner", v: c, x: 5, z: back(A, 0.2), y: 0.6 }, { k: "picture", x: 0, z: back(A, 0.2), y: 3.4 },
      { k: "ladder", x: A.w / 2 - 1.8, z: back(A, 0.35) }, { k: "plant", x: -A.w / 2 + 1.3, z: A.d / 2 - 2 }, { k: "plant", x: A.w / 2 - 1.3, z: A.d / 2 - 2 });
    // chairs down both sides of the long table, facing it
    for (let k = 0; k < 3; k++) for (const side of [-1, 1]) A.items.push({ k: "chair", x: side * 1.9, z: -2.5 + k * 2.5, rot: -side * Math.PI / 2 });
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } },
      { id: 1, x: A.w / 2 - 1.8, z: back(A, 0.8), kind: "ladder", label: "Up to the council room (2F)", to: { room: 1, warp: 0 } });
    A.spots.sleep = { x: -A.w / 2 + 3, z: 0 };
    // the notice board: how the village is doing
    const o = App.oreOf ? App.oreOf(v) : {}, ores = Object.keys(App.ORES || {}).filter((k) => o[k] >= 1);
    const armed = v.residents.filter((id) => App.gearOf && App.gearOf(id)).length, slain = (st.slayers || []).filter((x) => App.villageOfToken(x.id) === v).length;
    A.note = "Notice board: " + Math.round(v.food) + " food (" + App.foodWord(v) + ") \u00b7 " + v.residents.length + " villagers, " + armed + " armed" + (ores.length ? " \u00b7 stores: " + ores.map((k) => Math.floor(o[k]) + " " + k).join(", ") : "") + (slain ? " \u00b7 " + slain + " dragon" + (slain > 1 ? "s" : "") + " slain by its people" : "");
    A.items.push({ k: "barrel", x: -A.w / 2 + 1.4, z: -2 }, { k: "barrel", x: -A.w / 2 + 1.4, z: -0.2 }, { k: "crate", x: A.w / 2 - 1.6, z: 1.2 });
    if (slain) A.items.push({ k: "bones", x: 3, z: back(A, 1.6), rot: 0.6 }, { k: "bones", x: -3, z: back(A, 1.6), rot: -0.6 });
    if (armed) A.items.push({ k: "chest", v: 1, x: A.w / 2 - 1.8, z: -1.2, rot: -Math.PI / 2 });
    const B = room("Council room (2F)", 16, 12, { floor: ["#c79a62", "#b58850"], wall: "#f3e2c0" });
    // the treasury: a heap of each ore the mine has sent up
    const ORE_V = { stone: 0, iron: 1, gold: 2, orichalcum: 3, copper: 4, silver: 5, coal: 6, gems: 7 };
    ores.slice(0, 6).forEach((k, i) => B.items.push({ k: "orepile", v: ORE_V[k], x: 1.5 + (i % 3) * 2, z: 2.6 + Math.floor(i / 3) * 1.8 }));
    B.items.push({ k: "chest", v: v.residents.reduce((a, id) => a + App.shellsOf(id), 0) > 50 * v.residents.length ? 1 : 0, x: 5.5, z: back(B, 1.2) });
    B.note = ores.length ? "The treasury: " + ores.map((k) => Math.floor(o[k]) + " " + k).join(", ") + "." : "The treasury is empty: nothing has come up from the mine yet.";
    B.items.push({ k: "stairs", x: B.w / 2 - 2, z: back(B, 1.8) }, { k: "table", v: 0, x: -1.5, z: 0.5 }, { k: "chair", x: -1.5, z: 2.1, rot: Math.PI }, { k: "chair", x: -1.5, z: -1.1 },
      { k: "shelf", x: -5, z: back(B, 0.45) }, { k: "shelf", x: -2.6, z: back(B, 0.45) }, { k: "window", x: 2, z: back(B, 0.15) }, { k: "banner", v: c, x: -B.w / 2 + 0.6, z: 0, rot: Math.PI / 2, y: 0.4 });
    B.warps.push({ id: 0, x: B.w / 2 - 2, z: back(B, 1.8), kind: "stairs", label: "Down to the great hall (1F)", to: { room: 0, warp: 1 } });
    return { title: nameOf(T), rooms: [A, B] };
  }
  function granaryMap(T) {
    const v = App.villages[T.sc.village], A = room("Store room", 14, 12, { floor: ["#c79a62", "#b58850"], wall: "#e8d9b0" });
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 });
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    // as many sacks as there is food in the granary
    const n = Math.max(1, Math.min(10, Math.round(v.food / 12)));
    for (let k = 0; k < n; k++) A.items.push({ k: "sacks", x: -5 + (k % 5) * 2.5, z: back(A, 1.4 + Math.floor(k / 5) * 2.4), rot: k });
    A.items.push({ k: "barrel", x: A.w / 2 - 1.5, z: 1 }, { k: "barrel", x: A.w / 2 - 1.5, z: 2.8 }, { k: "barrel", x: -A.w / 2 + 1.5, z: 2 });
    // crates of fruit and fish, the harvest baskets, a lantern
    const crates = Math.max(0, Math.min(4, Math.round(v.food / 40)));
    for (let k = 0; k < crates; k++) A.items.push({ k: "crate", x: -A.w / 2 + 1.6 + (k % 2) * 2.2, z: -0.4 - Math.floor(k / 2) * 2.2, rot: k * 0.4 });
    A.items.push({ k: "lantern", x: 3.5, z: back(A, 0.6), light: true });
    const days = v.food / Math.max(1, v.residents.length * 3);
    A.note = Math.round(v.food) + " food in store for " + v.residents.length + " villagers: " + (days >= 1 ? "about " + Math.floor(days) + " day" + (Math.floor(days) === 1 ? "" : "s") + " of meals" : "not even a day of meals") + " (" + App.foodWord(v) + ").";
    return { title: nameOf(T), rooms: [A] };
  }
  // the hall of a guild: its board (who belongs, the best of them, what they did today) and what the guild works with
  function guildMap(T) {
    const H = T.hall, G = App.GUILDS[H.guild], v0 = App.villages.find((v) => v.region === H.region) || App.villages[0], c = v0.style;
    const A = room("The hall", 20, 14, { floor: ["#a88a62", "#987a52"], wall: "#f3e2c0", h: 7 });
    A.items.push({ k: "mat", x: 0, z: A.d / 2 - 1 }, { k: "board", x: 0, z: back(A, 0.5) }, { k: "longtable", x: 0, z: 0.8 },
      { k: "banner", v: c, x: -6, z: back(A, 0.2), y: 0.6 }, { k: "banner", v: c, x: 6, z: back(A, 0.2), y: 0.6 }, { k: "lantern", x: -A.w / 2 + 1.2, z: back(A, 0.6), light: true }, { k: "lantern", x: A.w / 2 - 1.2, z: back(A, 0.6), light: true });
    for (let k = 0; k < 3; k++) for (const side of [-1, 1]) A.items.push({ k: "chair", x: side * 1.9, z: -1.7 + k * 2.5, rot: -side * Math.PI / 2 });
    A.warps.push({ id: 0, x: 0, z: A.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    // what each guild keeps in its hall
    const L = -A.w / 2 + 1.6, Rr = A.w / 2 - 1.6;
    const put = (...a) => A.items.push(...a);
    if (H.guild === "adventurers") put({ k: "chest", v: 1, x: L, z: -1, rot: Math.PI / 2 }, { k: "chest", v: 0, x: L, z: 1.5, rot: Math.PI / 2 }, { k: "shelf", x: Rr, z: -1, rot: -Math.PI / 2 }, { k: "bones", x: Rr - 1, z: 3, rot: 1 });
    else if (H.guild === "warriors") put({ k: "chest", v: 1, x: L, z: -1, rot: Math.PI / 2 }, { k: "barrel", x: L, z: 1.5 }, { k: "bones", x: Rr - 0.6, z: -1.2, rot: 0.4 }, { k: "crate", x: Rr, z: 2, rot: 0.3 });
    else if (H.guild === "marauders") put({ k: "chest", v: 1, x: L, z: -1, rot: Math.PI / 2 }, { k: "chest", v: 1, x: L, z: 1.5, rot: Math.PI / 2 }, { k: "crystal", x: Rr, z: -1 }, { k: "crate", x: Rr, z: 2, rot: 0.6 });
    else if (H.guild === "miners") put({ k: "orepile", v: 1, x: L, z: -1 }, { k: "orepile", v: 2, x: L, z: 1.6 }, { k: "cart", x: Rr - 0.4, z: 0, rot: Math.PI / 2 }, { k: "mineframe", x: Rr, z: back(A, 1.4) });
    else if (H.guild === "merchants") put({ k: "sacks", x: L, z: -1 }, { k: "sacks", x: L, z: 1.6 }, { k: "barrel", x: Rr, z: -1.2 }, { k: "barrel", x: Rr, z: 0.6 }, { k: "crate", x: Rr, z: 2.6, rot: 0.3 });
    else put({ k: "crystal", x: L, z: -1 }, { k: "crystal", x: L + 1, z: 2 }, { k: "shelf", x: Rr, z: -1, rot: -Math.PI / 2 }, { k: "shelf", x: Rr, z: 1.6, rot: -Math.PI / 2 }, { k: "brazier", x: 0, z: back(A, 2.6), light: true });
    A.spots.table = { x: -1.9, z: -1.7, face: Math.PI / 2 };
    const B = App.guildBoard ? App.guildBoard(H.guild, H.region) : { members: 0, top: [], duty: "" };
    A.note = "The board: " + B.members + " members in " + App.regions[H.region].name + ". " + (B.top.length && st.gxp && st.gxp[B.top[0]] > 0 ? "The best of them: " + B.top.filter((id) => st.gxp[id] > 0).map((id) => App.nameOf(id) + " (" + App.guildRankName(id) + ", " + Math.round(st.gxp[id]) + " standing)").join(", ") + ". " : "Nobody has earned any standing yet. ") + (B.duty ? "Today: " + B.duty + "." : "");
    A.top = B.top;
    return { title: nameOf(T), rooms: [A] };
  }
  // a casino: a lobby with the slot machines and a door to a room for each game (poker, blackjack, roulette,
  // bingo); what happens at the tables is in casino.js
  function casinoMap(T) {
    const Cs = T.casino, L = App.CASINO_LAYOUT.tables, RM = App.CASINO_ROOMS, SC = App.CASINO_SCALE, KS = SC.slot;
    const rooms = RM.map((r) => room(r.name, r.w, r.d, { floor: ["#7a1a24", "#6a1420"], wall: "#2a1a3a", trim: "#ffd23f", h: 8 }));
    const [Lb, Pk, Bj, Rl, Bg] = rooms, LY = App.CASINO_LAYOUT;
    Lb.items.push({ k: "mat", x: 0, z: Lb.d / 2 - 1, s: 2 });
    Lb.warps.push({ id: 0, x: 0, z: Lb.d / 2 - 1, kind: "mat", label: "Outside", to: { outside: true } });
    [[1, -8, "To the poker room"], [2, 4, "To the blackjack room"], [3, 16, "To the roulette room"], [4, 28, "To the bingo hall"]].forEach(([ri, x, label]) => {
      Lb.items.push({ k: "mat", x, z: back(Lb, 1.6), s: 2 }, { k: "lantern", x: x + 3, z: back(Lb, 0.6), light: ri % 2 === 1, s: 1.8 });
      Lb.warps.push({ id: ri, x, z: back(Lb, 1.6), kind: "mat", label, to: { room: ri, warp: 0 } });
    });
    // the slot machines; the bar along the left wall: counter, shelves of bottles behind, stools in front
    for (const M of LY.slots) Lb.items.push({ k: "slotmachine", x: M.x, z: M.z, rot: M.rot, s: KS });
    const B = LY.bar;
    for (let k = 0; k < 5; k++) Lb.items.push({ k: "barcounter", x: B.x, z: B.z0 + 2.4 + k * 4.8, rot: Math.PI / 2, s: 1.2 }, { k: "barshelf", x: -Lb.w / 2 + 0.8, z: B.z0 + 2.4 + k * 4.8, rot: Math.PI / 2, s: 1.2 });
    for (const S of B.stools) Lb.items.push({ k: "barstool", x: S.x, z: S.z, s: 1.3 });
    Lb.items.push({ k: "plant", x: -6, z: Lb.d / 2 - 3, s: 2 }, { k: "plant", x: 6, z: Lb.d / 2 - 3, s: 2 }, { k: "lantern", x: B.x, z: B.z0 - 2.5, light: true, s: 1.8 }, { k: "lantern", x: B.x, z: B.z1 + 2.5, light: true, s: 1.8 });
    rooms.slice(1).forEach((R, k) => {
      R.items.push({ k: "mat", x: 0, z: R.d / 2 - 1, s: 2 });
      R.warps.push({ id: 0, x: 0, z: R.d / 2 - 1, kind: "mat", label: "Back to the lobby", to: { room: 0, warp: k + 1 } });
      for (const [x, z] of [[-R.w / 2 + 2.5, -R.d / 2 + 2.5], [R.w / 2 - 2.5, -R.d / 2 + 2.5], [-R.w / 2 + 2.5, R.d / 2 - 4], [R.w / 2 - 2.5, R.d / 2 - 4]]) R.items.push({ k: "lantern", x, z, light: true, s: 1.8 });
    });
    // the poker room: two tables for six by the door, the three big tournament tables at the back
    Pk.items.push({ k: "pokertable", v: 0, x: L.poker0.x, z: L.poker0.z, s: SC.poker }, { k: "pokertable", v: 0, x: L.poker1.x, z: L.poker1.z, s: SC.poker });
    for (const k of ["tour0", "tour1", "tour2"]) Pk.items.push({ k: "pokertable", v: 1, x: L[k].x, z: L[k].z, s: SC.big });
    Bj.items.push({ k: "bjtable", x: L.blackjack0.x, z: L.blackjack0.z, s: SC.blackjack }, { k: "bjtable", x: L.blackjack1.x, z: L.blackjack1.z, s: SC.blackjack });
    for (let k = 0; k < 3; k++) for (const side of [-1, 1]) Bj.items.push({ k: "slotmachine", x: side * (Bj.w / 2 - 2.6), z: -8 + k * 5.4, rot: -side * Math.PI / 2, s: KS });
    Rl.items.push({ k: "roulettetable", x: L.roulette0.x, z: L.roulette0.z, s: SC.roulette }, { k: "roulettetable", x: L.roulette1.x, z: L.roulette1.z, s: SC.roulette });
    // the bingo hall: a long table in front of each row of players, all facing the board and the cage
    for (const dz of [4.3, 9.4, 14.5]) for (const xx of [-21, 0, 21]) Bg.items.push({ k: "longtable", x: xx, z: L.bingo0.z + dz, rot: Math.PI / 2, s: [2.2, 1.6, 2.2] });
    const bank = (st.casinoBank && st.casinoBank[Cs.i]) || 0, TT = App.CASINO_TOUR;
    Lb.note = "Every night from 19:00 to 23:30. Slot machines, and a cocktail bar with its bartenders and waiters (a drink costs a shell or two). Through the doors at the back: poker, blackjack, roulette and bingo, all played for shells. The house is " + (bank >= 0 ? "up " : "down ") + Math.abs(Math.round(bank)) + " shells.";
    Pk.note = "Texas Hold'em, fixed limit. Two tables for six (blinds 1/2), and three big tables for nine where tonight's tournament is played at 20:30 (buy-in " + TT.buyin + " shells, " + TT.chips + " chips each, blinds up every " + TT.level + " minutes).";
    Bj.note = "Four decks; the dealer stands on 17; blackjack pays 3 to 2; double down on any two cards.";
    Rl.note = "European wheels with one zero: straight up pays 35 to 1, dozens 2 to 1, red/black, odd/even and low/high 1 to 1.";
    Bg.note = "90 balls, tickets of 3 rows of 5 numbers at 2 shells: 30% of the pot for the first line, 60% for bingo.";
    return { title: nameOf(T), rooms };
  }
  // ---------- labyrinths: the underworlds and the mines are mazes of corridors, floor after floor ----------
  // A floor is a grid of cells carved into a maze (a winding path with a few loops and chambers). Under
  // each region lies its Underworld: every floor has the shape of the region itself (one cell for every
  // 16 steps of land above), so it runs under the whole of it, and both dungeon caves of the region
  // lead down into it. Each floor has its guardian at the stairs down.
  const CS = 6; // one cell of the maze, in room units (a Tickle is 3 tall)
  function carve(r, W, H, loops, start, active) {
    const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (!active || active.has(x + "," + y));
    const E = [], Sd = [];
    for (let x = 0; x < W; x++) { E.push(new Array(H).fill(true)); Sd.push(new Array(H).fill(true)); }
    const seen = new Set([start[0] + "," + start[1]]), stack = [start];
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([nx, ny]) => ok(nx, ny) && !seen.has(nx + "," + ny));
      if (!nb.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
      if (dx === 1) E[x][y] = false; else if (dx === -1) E[nx][ny] = false; else if (dy === 1) Sd[x][y] = false; else Sd[nx][ny] = false;
      seen.add(nx + "," + ny); stack.push([nx, ny]);
    }
    // a few loops, so there is more than one way round
    for (let k = 0; k < W * H * loops; k++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * H);
      if (!seen.has(x + "," + y)) continue;
      if (r() < 0.5) { if (x < W - 1 && seen.has(x + 1 + "," + y)) E[x][y] = false; } else if (y < H - 1 && seen.has(x + "," + (y + 1))) Sd[x][y] = false;
    }
    return { W, H, E, S: Sd, seen };
  }
  const openTo = (m, x, y, dx, dy) => dx === 1 ? x < m.W - 1 && !m.E[x][y] : dx === -1 ? x > 0 && !m.E[x - 1][y] : dy === 1 ? y < m.H - 1 && !m.S[x][y] : y > 0 && !m.S[x][y - 1];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function bfs(m, from) {
    const dist = new Map([[from[0] + "," + from[1], 0]]), prev = new Map(), q = [from];
    for (let h = 0; h < q.length; h++) {
      const [x, y] = q[h], d = dist.get(x + "," + y);
      for (const [dx, dy] of DIRS) if (openTo(m, x, y, dx, dy)) { const k = x + dx + "," + (y + dy); if (!dist.has(k)) { dist.set(k, d + 1); prev.set(k, [x, y]); q.push([x + dx, y + dy]); } }
    }
    return { dist, prev };
  }
  function pathOf(m, a, b) {
    const { prev } = bfs(m, a), out = [b];
    let k = b[0] + "," + b[1];
    while (prev.has(k)) { const p = prev.get(k); out.unshift(p); k = p[0] + "," + p[1]; }
    return out;
  }
  // a chamber: a block of cells opened into one room (only cells that are part of the maze)
  function chamber(m, x0, y0, w, h) {
    const In = (x, y) => m.seen.has(x + "," + y);
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) { if (!In(x, y)) continue; if (x < x0 + w - 1 && In(x + 1, y)) m.E[x][y] = false; if (y < y0 + h - 1 && In(x, y + 1)) m.S[x][y] = false; }
  }
  const exits = (m, x, y) => DIRS.filter(([dx, dy]) => openTo(m, x, y, dx, dy)).length;
  // a wall side of a cell, for things that stand against a wall (torches, veins, cobwebs)
  function wallSide(m, x, y, r) {
    const sides = DIRS.filter(([dx, dy]) => !openTo(m, x, y, dx, dy));
    return sides.length ? sides[Math.floor(r() * sides.length)] : null;
  }
  const MON_NAME = { skeleton: "skeletons", goblin: "goblins", gloomslime: "gloomslimes", shadebat: "shadebats", spider: "giant spiders", brutecap: "brutecaps", troll: "trolls", ogre: "ogres", minotaur: "minotaurs",
    kobold: "kobolds", mummy: "mummies", harpy: "harpies", basilisk: "basilisks", werewolf: "werewolves", centaur: "centaurs", golem: "golems", salamander: "salamanders", manticore: "manticores",
    wraith: "wraiths", cerberus: "hellhounds", cyclops: "cyclopes", hydra: "hydras", chimera: "chimeras", medusa: "gorgons", lich: "liches" };
  // fill one floor: ways in and out, chambers, dead ends with treasure, torches, traps, monsters on patrol, the guardian
  function mazeFloor(o) {
    const { r, W, H, loops, entry, name, look, last, kind } = o;
    const m = carve(r, W, H, loops, entry, o.active);
    const In = (x, y) => m.seen.has(x + "," + y);
    let cells = [...m.seen].map((k) => k.split(",").map(Number));
    // chambers (a big floor gets more of them)
    const nCh = o.big ? Math.round(cells.length / 140) : kind === "mine" ? 2 : 1 + (r() < 0.5 ? 1 : 0);
    const chambers = [];
    for (let k = 0; k < nCh; k++) { const [x, y] = cells[Math.floor(r() * cells.length)]; if (In(x + 1, y) && In(x, y + 1) && In(x + 1, y + 1)) { chamber(m, x, y, 2, 2); chambers.push([x, y]); } }
    // the ways out of the first floor: one for every cave mouth, each on the maze
    const snap = (c) => { if (In(c[0], c[1])) return c; let best = cells[0], bd = Infinity; for (const q of cells) { const d = Math.abs(q[0] - c[0]) + Math.abs(q[1] - c[1]); if (d < bd) { bd = d; best = q; } } return best; };
    const outs = (o.exits || []).map((e) => Object.assign({}, e, { cell: snap(e.cell) }));
    // the stairs down: as far from every way in as the maze allows
    const from = [entry].concat(outs.map((e) => e.cell));
    const dists = from.map((c) => bfs(m, c).dist);
    let far = entry, fd = -1;
    for (const [x, y] of cells) { const k = x + "," + y, d = Math.min(...dists.map((D) => (D.has(k) ? D.get(k) : 0))); if (d > fd) { fd = d; far = [x, y]; } }
    // the guardian's hall: a big square room (dug out of the rock where it has to be) round the stairs
    let bossRoom = null, hall = null;
    if (o.boss) {
      const k = Math.min(o.bossSize || 5, W, H), h = Math.floor(k / 2), c = o.bossCell || far;
      const x0 = Math.max(0, Math.min(W - k, c[0] - h)), y0 = Math.max(0, Math.min(H - k, c[1] - h));
      const inHall = (q) => q[0] >= x0 && q[0] < x0 + k && q[1] >= y0 && q[1] < y0 + k;
      for (let x = x0; x < x0 + k; x++) for (let y = y0; y < y0 + k; y++) m.seen.add(x + "," + y);
      for (let x = x0; x < x0 + k; x++) for (let y = y0; y < y0 + k; y++) { if (x < x0 + k - 1) m.E[x][y] = false; if (y < y0 + k - 1) m.S[x][y] = false; }
      cells = [...m.seen].map((q) => q.split(",").map(Number));
      bossRoom = [x0 + h, y0 + h];
      // where the way in reaches the hall, and the stairs as far from there as the hall allows
      const way = pathOf(m, entry, c), door = way.find(inHall) || c;
      hall = { x0, y0, k, door, has: inHall };
      if (o.bossCell) far = o.bossCell;
      else { let best = c, bd = -1; for (let x = x0; x < x0 + k; x++) for (let y = y0; y < y0 + k; y++) { const d = Math.abs(x - door[0]) + Math.abs(y - door[1]); if (d > bd) { bd = d; best = [x, y]; } } far = best; }
    }
    const R = room(name, W * CS, H * CS, { floor: look.floor, wall: look.wall, trim: look.wall2, dark: true, h: 4.2 });
    R.maze = m; R.cs = CS; R.entry = entry; R.exit = far; R.look = look; R.mons = []; R.big = !!o.big; R.cells = cells; R.outs = outs; R.last = !!last;
    const cx = (x) => (x + 0.5) * CS - R.w / 2, cz = (y) => (y + 0.5) * CS - R.d / 2;
    R.cx = cx; R.cz = cz;
    const used = new Set([entry + "", far + ""].concat(outs.map((e) => e.cell + "")));
    // the hall is kept clear for the fight
    if (hall) for (let x = hall.x0; x < hall.x0 + hall.k; x++) for (let y = hall.y0; y < hall.y0 + hall.k; y++) used.add(x + "," + y);
    R.hall = hall ? { x0: cx(hall.x0) - CS / 2 + 1.5, z0: cz(hall.y0) - CS / 2 + 1.5, size: hall.k * CS - 3, door: { x: cx(hall.door[0]), z: cz(hall.door[1]) } } : null;
    const put = (it) => { R.items.push(it); return it; };
    const against = (x, y, side, inset) => ({ x: cx(x) + side[0] * (CS / 2 - (inset || 0.9)), z: cz(y) + side[1] * (CS / 2 - (inset || 0.9)), rot: Math.atan2(-side[0], -side[1]) });
    // torches along the walls (a few of them cast real light near the camera); none where the sky is open above
    for (const [x, y] of cells) {
      if ((x * 7 + y * 3) % (o.big ? 5 : 4) || look.sun) continue;
      const sd = wallSide(m, x, y, r);
      if (!sd) continue;
      const a = against(x, y, sd, 0.7);
      put({ k: kind === "mine" ? "lantern" : kind === "seacave" ? "crystal" : "torch", x: a.x, z: a.z, rot: a.rot, light: true });
    }
    // dead ends: treasure, bones, cages; ore veins in a mine
    const ends = cells.filter(([x, y]) => exits(m, x, y) === 1 && !used.has(x + "," + y));
    ends.forEach(([x, y], i) => {
      used.add(x + "," + y);
      const sd = wallSide(m, x, y, r) || [0, -1], a = against(x, y, sd, 1.4);
      if (kind === "mine") { put({ k: "orevein", v: o.ore(i), x: a.x, z: a.z, rot: a.rot, tag: "face" }); if (r() < 0.6) put({ k: "orepile", v: o.ore(i), x: cx(x) - sd[0] * 0.8, z: cz(y) - sd[1] * 0.8 }); }
      else if (o.band == null) { if (i % 3 === 0) put({ k: "chest", v: 0, x: a.x, z: a.z, rot: a.rot, chest: true }); else put({ k: i % 3 === 1 ? "bones" : look.deco[i % look.deco.length], x: cx(x), z: cz(y), rot: r() * 6.28 }); }
      else {
        // the Great Underworld: chests, Ether crystals and veins of precious metal (richer the deeper you go)
        const q = i % 5, PREC = [[5, 5], [5, 2], [2, 7], [7, 3], [3, 7], [3, 3]][Math.min(5, o.band)];
        if (q === 0) put({ k: "chest", v: 0, x: a.x, z: a.z, rot: a.rot, chest: true });
        else if (q === 1) put({ k: "crystal", x: cx(x), z: cz(y), rot: r() * 6.28, ether: true });
        else if (q === 2) put({ k: "orevein", v: PREC[i % 2], x: a.x, z: a.z, rot: a.rot, precious: true });
        else put({ k: q === 3 ? "bones" : look.deco[i % look.deco.length], x: cx(x), z: cz(y), rot: r() * 6.28 });
      }
    });
    // in the corridors: cobwebs, rocks, puddles, traps; in a mine: props and veins along the walls
    for (const [x, y] of cells) {
      if (used.has(x + "," + y) || r() > (o.big ? 0.22 : 0.32)) continue;
      used.add(x + "," + y);
      const sd = wallSide(m, x, y, r), q = r();
      if (kind === "mine") {
        if (sd && q < 0.35) { const a = against(x, y, sd, 1.4); put({ k: "orevein", v: o.ore(x + y), x: a.x, z: a.z, rot: a.rot, tag: "face" }); }
        else if (q < 0.55) put({ k: "mineframe", x: cx(x), z: cz(y), rot: openTo(m, x, y, 1, 0) || openTo(m, x, y, -1, 0) ? Math.PI / 2 : 0 });
        else if (q < 0.7) put({ k: ["crate", "barrel", "boulders"][Math.floor(r() * 3)], x: cx(x) + (r() - 0.5) * 2, z: cz(y) + (r() - 0.5) * 2, rot: r() * 6.28 });
        else if (q < 0.82) put({ k: o.deep ? "mushrooms" : "puddle", x: cx(x) + (r() - 0.5) * 2, z: cz(y) + (r() - 0.5) * 2 });
        else put({ k: "stalagmite", x: cx(x) + (r() - 0.5) * 2, z: cz(y) + (r() - 0.5) * 2 });
      } else {
        if (sd && q < 0.3) { const a = against(x, y, sd, 0.4); put({ k: "cobweb", x: a.x, z: a.z, rot: a.rot }); }
        else if (q < 0.45 && exits(m, x, y) === 2) put({ k: "spikes", x: cx(x), z: cz(y), trap: true });
        else if (q < 0.7) put({ k: look.deco[Math.floor(r() * look.deco.length)], x: cx(x) + (r() - 0.5) * 1.5, z: cz(y) + (r() - 0.5) * 1.5, rot: r() * 6.28 });
        else put({ k: r() < 0.5 ? "boulders" : "stalagmite", x: cx(x) + (r() - 0.5) * 2, z: cz(y) + (r() - 0.5) * 2, rot: r() * 6.28 });
      }
    }
    // chambers: braziers and statues (a dungeon) or a working face with a cart (a mine)
    for (const [x, y] of chambers) {
      const mx = cx(x) + CS / 2, mz = cz(y) + CS / 2;
      if (kind === "mine") { put({ k: "cart", x: mx, z: mz, rot: r() * 6.28 }); put({ k: "orepile", v: o.ore(x), x: mx + 2, z: mz - 1.5 }); put({ k: "lantern", x: mx - 2, z: mz + 1.5, light: true }); }
      else { put({ k: "brazier", x: mx, z: mz, light: true }); put({ k: look.deco[0], x: mx - 2.6, z: mz - 2.6, rot: 0.8 }); put({ k: look.deco[0], x: mx + 2.6, z: mz - 2.6, rot: -0.8 }); }
    }
    // the guardian's hall: braziers in the corners, Ether crystals along the walls, the deep vein in a mine
    if (bossRoom) {
      const bx = cx(bossRoom[0]), bz = cz(bossRoom[1]), X0 = cx(hall.x0) - CS / 2, Z0 = cz(hall.y0) - CS / 2, SZ = hall.k * CS;
      R.bossAt = { x: bx, z: bz };
      const lamp = kind === "mine" ? "lantern" : kind === "seacave" ? "crystal" : "brazier";
      for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put({ k: lamp, x: X0 + 1.6 + u * (SZ - 3.2), z: Z0 + 1.6 + v * (SZ - 3.2), light: true });
      for (const [u, v] of [[0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) { const x = X0 + 1.2 + u * (SZ - 2.4), z = Z0 + 1.2 + v * (SZ - 2.4); if (Math.hypot(x - cx(far[0]), z - cz(far[1])) > CS && Math.hypot(x - cx(hall.door[0]), z - cz(hall.door[1])) > CS) put({ k: "crystal", x, z, ether: true }); }
      if (kind === "mine") { put({ k: "orevein", v: o.ore(0), x: cx(far[0]), z: cz(far[1]) - CS / 2 + 1.1, tag: "face" }); put({ k: "orepile", v: o.ore(0), x: cx(far[0]) - 2.4, z: cz(far[1]) }); }
    }
    // monsters: on patrol along a stretch of corridor, back and forth
    const nMon = o.big ? Math.round(cells.length / 30) : o.monsters;
    const far2 = cells.filter(([x, y]) => from.every((c) => Math.abs(x - c[0]) + Math.abs(y - c[1]) > 2) && !(hall && hall.has([x, y])));
    for (let k = 0; k < nMon && far2.length; k++) {
      const home = far2[Math.floor(r() * far2.length)];
      // its beat: a short walk along the corridors from where it lives
      let path = [home], prev = null;
      for (let st2 = 0; st2 < 8; st2++) {
        const [x, y] = path[path.length - 1], opts = DIRS.filter(([dx, dy]) => openTo(m, x, y, dx, dy) && !(prev && prev[0] === x + dx && prev[1] === y + dy));
        if (!opts.length) break;
        const [dx, dy] = opts[Math.floor(r() * opts.length)];
        prev = [x, y]; path.push([x + dx, y + dy]);
      }
      if (path.length < 2) path = [home, home];
      const [mk, mv] = o.pick(k);
      R.mons.push({ k: mk, v: mv, path, i: 0, dir: 1, x: cx(home[0]), z: cz(home[1]), h: 0, hp: 1, scale: 1 });
    }
    if (o.boss && bossRoom) {
      // it stands in front of the stairs, facing the way the parties come
      const at = bossRoom;
      // the way down is sealed by an iron gate, just in front of the stairs on the hall's side, until the guardian falls
      if (!last) {
        const ddx = bossRoom[0] - far[0], ddy = bossRoom[1] - far[1];
        R.gate = Math.abs(ddx) >= Math.abs(ddy) ? { x: cx(far[0]) + Math.sign(ddx || 1) * CS * 0.5, z: cz(far[1]), rot: Math.PI / 2 } : { x: cx(far[0]), z: cz(far[1]) + Math.sign(ddy || 1) * CS * 0.5, rot: 0 };
      }
      R.boss = { name: o.boss.name, k: o.boss.k };
      R.mons.push({ k: o.boss.k, v: o.boss.v || 0, scale: o.boss.scale || 1, boss: true, crown: !!o.boss.crown, name: o.boss.name, path: [at, at], i: 0, dir: 1, x: cx(at[0]), z: cz(at[1]), h: 0, hp: 1, floor: o.index });
    }
    // the ways in and out
    if (o.first && outs.length) outs.forEach((e, i) => { put({ k: "mat", x: cx(e.cell[0]), z: cz(e.cell[1]) + CS / 2 - 1 }); R.warps.push({ id: i, x: cx(e.cell[0]), z: cz(e.cell[1]), kind: "mat", label: e.label, to: { outside: true, door: e.door, dg: e.dg } }); });
    else if (o.first) { put({ k: "mat", x: cx(entry[0]), z: R.d / 2 - 1 }); R.warps.push({ id: 0, x: cx(entry[0]), z: R.d / 2 - 1, kind: "mat", label: o.outLabel, to: { outside: true } }); }
    else { put({ k: "ladder", x: cx(entry[0]), z: cz(entry[1]) - CS / 2 + 0.4 }); R.warps.push({ id: 0, x: cx(entry[0]), z: cz(entry[1]), kind: "ladder", label: o.upLabel, to: { room: o.index - 1, warp: "down" } }); }
    if (!last) { put({ k: "stairs", x: cx(far[0]), z: cz(far[1]) }); R.warps.push({ id: R.warps.length, x: cx(far[0]), z: cz(far[1]), kind: "stairs", label: o.downLabel, to: { room: o.index + 1, warp: 0 }, down: true }); }
    // the teleport gem, the save point beside the guardian: in its hall, next to the stairs down
    if (o.gem && hall) {
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => [far[0] + dx, far[1] + dy]).find((q) => hall.has(q) && q + "" !== hall.door + "") || far;
      const gx = cx(nb[0]) + (nb === far ? CS * 0.3 : 0), gz = cz(nb[1]);
      put({ k: "warpgem", v: o.index % 2, x: gx, z: gz, s: 1.6, light: true });
      R.gem = { x: gx, z: gz };
      R.warps.push({ id: R.warps.length, x: gx, z: gz, kind: "gem", label: "Teleport gem: back up to the surface", to: { outside: true } });
    }
    // pools of water (or of lava) in some of the cells
    R.pools = [];
    if (look.pools) for (const [x, y] of cells) if (!used.has(x + "," + y) && hash2(x, y, 941 + o.index) < 0.12) R.pools.push([cx(x) + (hash2(x, y, 943) - 0.5) * 1.5, cz(y) + (hash2(x, y, 947) - 0.5) * 1.5, 2.2 + hash2(x, y, 949) * 1.6]);
    return R;
  }
  // ---------- the Great Underworld: one dungeon under the whole map, 12 floors deep ----------
  // Every dungeon cave on the map leads down into it. Each floor has the shape of all the land above
  // (one cell for every 45 steps), with tunnels under the channels so every region is joined to the
  // rest. Twelve floors, the hardest of the old thirty-six, each with its guardian at the stairs down and a teleport
  // gem beside it; the same rock dug out in different ways: the goblins' warrens, the catacombs, a sunlit grotto open
  // to the sky with pools of water, a great forest grown into a maze, caverns of ice, the volcanic deep with its lava,
  // the abyss, and at the bottom the Heart of the Chain. Floors are dug out when someone first goes down to them.
  const FLOORS = 12;
  // the look of the last floor, under the Maker's Isle
  const HEART = { smooth: 0.45, label: "the Heart of the Chain", wall: "#6a5420", wall2: "#4a3a16", floor: ["#2a2414", "#221d10"], mons: [["wraith", 0], ["cerberus", 0]], deco: ["crystal", "brazier", "gargoyle", "crystal"] };
  // the look of each kind of floor: sun = open to the sky (daylight, a sky above); pools = water (or lava) in some
  // cells; forest = walls of trees and hedges instead of rock
  const UNDER = [
    { smooth: 0.25, label: "the Goblin Warrens", wall: "#6e5a44", wall2: "#56463a", floor: ["#3a3027", "#322a22"], mons: [["goblin", 0], ["kobold", 0], ["gloomslime", 0], ["shadebat", 0]], deco: ["bones", "crate", "boulders", "brazier"] },
    { smooth: 0.55, label: "the Catacombs", wall: "#7a7a72", wall2: "#5e5e58", floor: ["#34332f", "#2c2b28"], mons: [["skeleton", 0], ["mummy", 0], ["shadebat", 0], ["spider", 0]], deco: ["tomb", "bones", "cobweb", "cage"] },
    { smooth: 0.15, label: "the Sunlit Grotto", sun: "#8fd3f4", pools: "water", wall: "#7a8a6a", wall2: "#5e6e52", floor: ["#6e8a4a", "#5e7a40"], mons: [["basilisk", 0], ["harpy", 0], ["brutecap", 0], ["gloomslime", 0]], deco: ["cattail", "boulders", "mushrooms", "stalagmite"] },
    { smooth: 0, label: "the Forest Maze", sun: "#a8dcf0", forest: true, wall: "#3c7a34", wall2: "#2e6228", floor: ["#4e7a36", "#466e30"], mons: [["werewolf", 0], ["centaur", 0], ["harpy", 0], ["spider", 0]], deco: ["mushrooms", "boulders", "bones", "mushrooms"] },
    { smooth: 1, label: "the Ice Caverns", cold: true, wall: "#cfe6f2", wall2: "#a8cde4", floor: ["#e4f2f8", "#d4e8f2"], mons: [["wraith", 0], ["golem", 0], ["troll", 0], ["werewolf", 0]], deco: ["crystal", "stalagmite", "boulders", "bones"] },
    { smooth: 0.2, label: "the Burning Deep", pools: "lava", wall: "#6a3a2e", wall2: "#4e2a22", floor: ["#2e1e18", "#261814"], mons: [["salamander", 0], ["troll", 0], ["ogre", 0], ["manticore", 0]], deco: ["brazier", "stalagmite", "boulders", "bones"] },
    { smooth: 0.35, label: "the Abyss", wall: "#3a3050", wall2: "#2a2240", floor: ["#1e1a2a", "#191524"], mons: [["wraith", 0], ["cerberus", 0], ["minotaur", 0], ["troll", 0]], deco: ["crystal", "cage", "gargoyle", "cobweb"] },
  ];
  // which kind of floor each one is, and which of the old thirty-six floors it stands for (how hard it is: dungeons.js)
  const BAND = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], OLD = (App.UNDER_OLD = [5, 11, 15, 17, 22, 23, 26, 27, 28, 29, 33, 35]);
  // the monsters that roam a floor of the Great Underworld (for taming: dungeons.js)
  App.BAND_MONSTERS = (f) => { const L = f >= FLOORS - 1 ? HEART : UNDER[BAND[Math.min(FLOORS - 1, f)]]; return L.mons.map((m) => m[0]).filter((k) => App.MONSTER_TAMABLE && App.MONSTER_TAMABLE.includes(k)); };
  // the 12 guardians, one per floor, from B1F down to the last
  const B = (k, scale, name, crown) => ({ k, scale, name, crown: !!crown });
  const GUARDIANS = [
    B("goblin", 2.6, "the Goblin King", 1), B("lich", 1.6, "the Lich"), B("medusa", 1.8, "Medusa the Gorgon"), B("basilisk", 2.7, "the Basilisk King", 1),
    B("cyclops", 1.5, "the Cyclops"), B("golem", 1.95, "the Titan Golem"), B("troll", 1.45, "the Frost Troll Warlord", 1), B("chimera", 1.9, "the Chimera"),
    B("salamander", 2.9, "the Fire Wyrm", 1), B("hydra", 1.7, "the Hydra"), B("lich", 2.2, "the Lich King", 1), B("goldtickle", 2.6, "the Golden Tickle"),
  ];
  App.UNDER = UNDER; App.GUARDIANS = GUARDIANS; App.UNDER_FLOORS = FLOORS;
  const G = 45; // steps of land above for one cell of the maze below (about half the cells of a finer grid, so it runs smoothly)
  let grid = null;
  function underGrid() {
    if (grid) return grid;
    const W0 = App.WORLD, minX = W0.minX + G / 2, minZ = W0.minZ + G / 2;
    const W = Math.ceil((W0.maxX - W0.minX) / G), H = Math.ceil((W0.maxZ - W0.minZ) / G);
    const active = new Set();
    for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) if (App.genHeight(minX + i * G, minZ + j * G) >= App.SEA) active.add(i + "," + j);
    // join every island of land to the rest with a tunnel under the water
    const comps = () => {
      const seen = new Set(), out = [];
      for (const k of active) {
        if (seen.has(k)) continue;
        const c = [], q = [k]; seen.add(k);
        while (q.length) { const cur = q.pop(); c.push(cur); const [x, y] = cur.split(",").map(Number); for (const [dx, dy] of DIRS) { const n = x + dx + "," + (y + dy); if (active.has(n) && !seen.has(n)) { seen.add(n); q.push(n); } } }
        out.push(c);
      }
      return out.sort((a, b) => b.length - a.length);
    };
    for (let guard = 0; guard < 40; guard++) {
      const cs = comps();
      if (cs.length < 2) break;
      // the smallest piece digs towards the nearest cell of any other piece
      const small = cs[cs.length - 1], others = new Set(cs.slice(0, -1).flat());
      let best = null, bd = Infinity;
      for (const a of small) { const [ax, ay] = a.split(",").map(Number); for (const b of others) { const [bx, by] = b.split(",").map(Number), d = Math.abs(ax - bx) + Math.abs(ay - by); if (d < bd) { bd = d; best = [ax, ay, bx, by]; } } }
      if (!best || bd > 40) { for (const k of small) active.delete(k); continue; } // a far speck of land: no tunnel
      let [x, y] = best;
      while (x !== best[2]) { x += Math.sign(best[2] - x); active.add(x + "," + y); }
      while (y !== best[3]) { y += Math.sign(best[3] - y); active.add(x + "," + y); }
    }
    grid = { minX, minZ, W, H, active, toCell: (x, z) => [Math.max(0, Math.min(W - 1, Math.round((x - minX) / G))), Math.max(0, Math.min(H - 1, Math.round((z - minZ) / G)))] };
    return grid;
  }
  App.underGrid = underGrid;
  const nearestActive = (U, c) => { if (U.active.has(c[0] + "," + c[1])) return c; let best = null, bd = Infinity; for (const k of U.active) { const [x, y] = k.split(",").map(Number), d = Math.abs(x - c[0]) + Math.abs(y - c[1]); if (d < bd) { bd = d; best = [x, y]; } } return best; };
  function greatUnderworld() {
    const U = underGrid(), caves = App.dungeons || [];
    const map = { title: "The Great Underworld", rooms: [], floors: FLOORS, maze: true, big: true };
    // dig out floor f (and every floor above it that is not dug yet)
    map.floor = (f) => {
      for (let k = map.rooms.length; k <= f; k++) map.rooms[k] = makeFloor(k);
      return map.rooms[f];
    };
    function makeFloor(f) {
      const L = UNDER[BAND[f]], next = UNDER[Math.min(UNDER.length - 1, BAND[f] + 1)], last = f === FLOORS - 1, boss = GUARDIANS[f];
      const entry = nearestActive(U, f === 0 ? U.toCell(caves[0].x, caves[0].z) : map.rooms[f - 1].exit);
      let active = U.active, bossCell = null;
      if (last && App.ISLE) {
        // the hall under the Maker's statue, and a tunnel from it to the rest of the floor
        bossCell = U.toCell(App.ISLE.x, App.ISLE.z);
        active = new Set(U.active);
        for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) active.add(bossCell[0] + dx + "," + (bossCell[1] + dy));
        const near = nearestActive(U, bossCell);
        let [x, y] = bossCell;
        while (x !== near[0]) { x += Math.sign(near[0] - x); active.add(x + "," + y); }
        while (y !== near[1]) { y += Math.sign(near[1] - y); active.add(x + "," + y); }
      }
      // deeper in a band, the next band's monsters start to come up
      const mix = f > 0 && BAND[f - 1] === BAND[f] ? L.mons.concat(next.mons.slice(0, 2)) : L.mons;
      const R = mazeFloor({ r: rngOf(9001 + f * 131), W: U.W, H: U.H, loops: 0.08, entry, active, bossCell, bossSize: last ? 7 : 5, big: true, kind: "dungeon", look: last ? HEART : L, last, first: f === 0, index: f, band: Math.floor(OLD[f] / 6), gem: true,
        exits: f === 0 ? caves.map((d) => ({ cell: U.toCell(d.x, d.z), label: "Up and out by " + d.name + " (" + App.regions[d.region].name + ")", door: d.door, dg: d.i })) : null,
        name: "B" + (f + 1) + "F \u00b7 " + (last ? "The Heart of the Chain" : L.label.charAt(0).toUpperCase() + L.label.slice(1)), upLabel: "Up to B" + f + "F", downLabel: "Down to B" + (f + 2) + "F, past " + boss.name,
        pick: (k) => mix[k % mix.length], boss: Object.assign({ v: 0 }, boss) });
      // the chests refill every day: only today's parties have emptied a few on the upper floors
      const today = Math.floor(st.T / DAY), opened = 3 * Object.values(st.parties || {}).filter((p) => p && p.day === today).length;
      R.items.filter((it) => it.chest).forEach((it, i) => { if (f < 3 && i < opened - f * 4) it.v = 1; });
      const kinds = [...new Set(R.mons.filter((m) => !m.boss).map((m) => m.k))].map((k) => MON_NAME[k] || k);
      R.note = last ? "The bottom of the world, right beneath the Maker's Isle, where every way through the Great Underworld meets. In the great hall under the statue waits the Golden Tickle, the strongest guardian of all, and behind it the Maker's hoard. " + kinds.join(", ").replace(/, ([^,]*)$/, " and $1") + " roam the ways in."
        : kinds.join(", ").replace(/, ([^,]*)$/, " and $1") + " roam " + L.label + ". " + boss.name.charAt(0).toUpperCase() + boss.name.slice(1) + " guards the stairs down: nobody goes further until it is beaten. Beside it stands a teleport gem: a party that beats the guardian comes back to the gem next time.";
      if (last) {
        // the hall: braziers and Ether all round, the hoard behind the Golden Tickle
        const bx = R.cx(bossCell[0]), bz = R.cz(bossCell[1]);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283 + 0.39; R.items.push({ k: k % 2 ? "crystal" : "brazier", x: bx + Math.cos(a) * 13, z: bz + Math.sin(a) * 13, light: k % 2 === 0 }); }
        for (let k = 0; k < 7; k++) R.items.push({ k: "chest", v: 0, x: bx - 9 + k * 3, z: bz - 17, chest: true });
      }
      return R;
    }
    return map;
  }
  const MINE_LOOK = { smooth: 0.12, wall: "#5e4e3e", wall2: "#4a3d30", floor: ["#3a3027", "#322a22"], deco: ["crate", "barrel"] };
  const ORE_IDX = { stone: 0, iron: 1, gold: 2, orichalcum: 3, copper: 4, silver: 5, coal: 6, gems: 7 };
  function mineMap(T) {
    const M = T.mine, r = rngOf(M.i * 131 + 7), rooms = [];
    const rich = (M.rich || []).map((n) => ORE_IDX[n]).filter((v) => v != null);
    // the Miners' Guild digs a mine deeper: three floors at first, five at the deepest level
    const lv = App.mineLevel ? App.mineLevel(M) : 1, nF = 3 + Math.floor((lv - 1) / 2);
    const names = ["Upper galleries", "Lower galleries", "The old workings", "The flooded drifts"].slice(0, nF - 1).concat(["The deep vein"]);
    let entry = [3, 4];
    for (let f = 0; f < nF; f++) {
      const W = 8 + f, H = 5 + f, last = f === nF - 1;
      entry = f === 0 ? [Math.floor(W / 2), H - 1] : [Math.min(W - 1, rooms[f - 1].exit[0]), Math.min(H - 1, rooms[f - 1].exit[1])];
      const ore = (i) => last && M.orichalcum && i % 4 === 0 ? 3 : i % 3 === 0 ? 6 : (rich.length ? rich[i % rich.length] : 0);
      const R = mazeFloor({ r, W, H, loops: 0.28, entry, kind: "mine", look: MINE_LOOK, last, first: f === 0, index: f, monsters: [2, 3, 3, 4, 4][f], ore, deep: f > 0,
        name: names[f], outLabel: "Out of the mine", upLabel: "Up to the " + names[f - 1 < 0 ? 0 : f - 1].toLowerCase(), downLabel: "Down to the " + (names[f + 1] || "").toLowerCase(),
        pick: (k) => (f === 0 ? ["goblin", 1] : (k % 2 ? ["spider", 0] : ["goblin", 1])), boss: last ? { k: "troll", v: 1, scale: 1, name: "the rock troll" } : null });
      // rails along the main tunnel, from the way in to the way down
      const main = pathOf(R.maze, R.entry, R.exit);
      main.forEach(([x, y], i) => { const nx = main[i + 1] || main[i - 1]; const along = nx && nx[0] !== x ? Math.PI / 2 : 0; R.items.push({ k: "rails", x: R.cx(x), z: R.cz(y), rot: along }); });
      R.rails = main; R.carts = main.length > 4 ? [2, Math.floor(main.length * 0.6)] : [0];
      R.note = (f === 0 ? "Mine goblins sneak in to steal the ore; the Warriors' Guild keeps guards down here." : "Goblins and giant spiders lurk in the side tunnels.") + (last ? " A rock troll guards the deepest vein" + (M.orichalcum ? ", where the orichalcum glows." : ".") : "") +
        (f === 0 && App.mineLevel ? " Level " + lv + " of 5" + (App.mineNextAt && App.mineNextAt(M) ? " (the Miners' Guild has dug " + Math.round(((st.mineWork && st.mineWork[M.i]) || 0) / App.mineNextAt(M) * 100) + "% of the way to the next)" : " (the deepest it goes)") + "." : "");
      rooms.push(R);
    }
    return { title: M.name, rooms, maze: true };
  }
  // a sea cave, only reached by diving (sea.js): two floors of grotto, lit by glowing crystals, coral, sponges, weed and
  // shells everywhere, treasure in the dead ends and, at the bottom, the pearl chamber; nothing hostile lives there
  const SEA_LOOK = { smooth: 0.2, wall: "#2e5864", wall2: "#22464f", floor: ["#c8b894", "#b4a684"], deco: ["coral", "sponge", "anemone", "seagrass", "seashell", "searock"], sun: 0x082a34, pools: false };
  function seaCaveMap(T) {
    const c = T.cave, r = rngOf(c.i * 977 + 13), rooms = [], names = ["The grotto", "The pearl chamber"];
    let entry = null;
    for (let f = 0; f < 2; f++) {
      const W = 6 + f * 2, H = 5 + f, last = f === 1;
      entry = f === 0 ? [Math.floor(W / 2), H - 1] : [Math.min(W - 1, rooms[0].exit[0]), Math.min(H - 1, rooms[0].exit[1])];
      const R = mazeFloor({ r, W, H, loops: 0.35, entry, kind: "seacave", look: SEA_LOOK, last, first: f === 0, index: f, monsters: 0, name: names[f],
        outLabel: "Swim out of the cave", upLabel: "Up to the grotto", downLabel: "Down to the pearl chamber", pick: () => ["goblin", 1], boss: null });
      R.note = f === 0 ? "A cave in the sea floor that only divers ever find: the water is still and blue-green, crystals glow on the walls, and coral and sponges grow over everything. Treasure lies in the dead ends." : "The deepest chamber, where the oysters grow big and the oldest chests lie half buried in the sand.";
      if (last) for (let k = 0; k < 6; k++) R.items.push({ k: "oyster", x: R.cx(R.exit[0]) + Math.cos(k) * 2.6, z: R.cz(R.exit[1]) + Math.sin(k) * 2.6, rot: k });
      rooms.push(R);
    }
    return { title: c.name, rooms, maze: true };
  }
  App.mapOf = (T) => {
    const key = T.kind + ":" + (T.sc ? T.sc.idx : T.dg ? "great" : T.hall ? T.hall.guild + ":" + T.hall.region : T.casino ? T.casino.i : T.prison ? "prison" : T.parliament ? "parliament" : T.cave ? "cave" + T.cave.i : T.mine.i + ":" + (App.mineLevel ? App.mineLevel(T.mine) : 1));
    if (T.kind === "granary" || T.kind === "hall" || T.kind === "house" || T.kind === "guild" || T.kind === "casino" || T.kind === "prison" || T.kind === "parliament" || !maps.has(key)) maps.set(key, T.kind === "parliament" ? chamberMap(T) : T.kind === "prison" ? prisonMap(T) : T.kind === "house" ? houseMap(T) : T.kind === "hall" && T.sc && T.sc.warren ? warrenMap(T) : T.kind === "hall" && T.sc && T.sc.mansion ? mansionMap(T) : T.kind === "hall" ? hallMap(T) : T.kind === "granary" ? granaryMap(T) : T.kind === "guild" ? guildMap(T) : T.kind === "casino" ? casinoMap(T) : T.kind === "dungeon" ? greatUnderworld() : T.kind === "seacave" ? seaCaveMap(T) : mineMap(T));
    const m = maps.get(key);
    m.key = key; m.target = T;
    return m;
  };

  // ---------- who is in there right now ----------
  function insideNow(id) {
    const t = App.pop.agent[id];
    if (t) return !t.group.visible && Math.hypot(t.pos.x - t.home.x, t.pos.z - t.home.z) < 2.5 && !(t.action && t.action.kind === "delve");
    const p = App.planPos(id, st.T);
    return !!p.inside && !App.isDead(id);
  }
  function occupants(map, ri) {
    const T = map.target, out = [], day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (T.kind === "casino") return App.casinoOccupants ? App.casinoOccupants(T.casino, ri).slice(0, 40) : [];
    if (T.kind === "parliament") return App.chamberOccupants ? App.chamberOccupants(map.rooms[ri]) : [];
    if (T.kind === "prison") {
      // the inmates: asleep in the cell of their block, or round the canteen tables (as many as there are seats)
      const R = map.rooms[ri];
      let eating = 0;
      App.prisoners().forEach((id, k) => {
        const ag = App.pop.agent[id], step = App.planStep(id, st.T).step;
        const inNow = ag ? !!(ag.action && ag.action.kind === "rounds" && ag.action.prison) : (step.k === "cell" || step.k === "canteen") && App.planPos(id, st.T).inside;
        if (!inNow || App.isDead(id)) return;
        if (step.k === "cell" && ri === map.firstDorm + Math.floor(k / map.perDorm)) out.push({ id, pose: "sleep" });
        else if (step.k === "canteen" && ri === 1 && R.seats && eating < R.seats.length) out.push({ id, pose: "eat", at: R.seats[eating++] });
      });
      return out;
    }
    if (T.kind === "house" || (T.kind === "hall" && T.sc && T.sc.mansion)) {
      // (in a castle each Tickle sleeps in the dormitory of its tower; only so many fit round the tables at once)
      const bedRoom = Math.max(0, map.rooms.findIndex((R) => R.spots.beds || R.spots.bed));
      let awake = 0;
      App.residentsOf(T.sc).forEach((id, k) => {
        if (!insideNow(id) || (App.isListed && App.isListed(id))) return;
        const step = App.planStep(id, st.T).step, asleep = step.k === "sleep" || App.isKO(id);
        const where = asleep ? (map.perDorm ? map.firstDorm + Math.floor(k / map.perDorm) : bedRoom) : 0;
        if (ri !== where || (!asleep && map.maxEat && ++awake > map.maxEat)) return;
        out.push({ id, pose: asleep ? "sleep" : step.k === "shelter" ? "cower" : "eat" });
      });
    }
    if (T.kind === "hall" && ri === 0 && !(T.sc && T.sc.mansion)) {
      const v = App.villages[T.sc.village];
      for (const id of v.residents) if (App.homeRuined(id) && insideNow(id)) out.push({ id, pose: "sleep" });
    }
    if (T.kind === "dungeon") {
      // every party down there now, on the floor its afternoon has reached (floor by floor, guardian by guardian, as planned)
      // (one party at a time faces the guardian in its hall: the one you came to watch, or the first to get there; the rest wait their turn out of sight)
      const live = (App.liveParties ? App.liveParties() : []).filter((L) => L.S.f === ri), w = cur && cur.watch;
      live.sort((a, b) => (b.key === w) - (a.key === w));
      let atHall = null;
      for (const L of live) {
        if (L.S.kind === "guardian") { if (atHall) continue; atHall = L.key; }
        L.p.members.forEach((id, j) => { if (!App.isKO(id) && !App.isDead(id)) out.push({ id, pose: "fight", party: L.key, j, dg: ri === 0 ? L.p.dungeon : null }); });
      }
    }
    if (T.kind === "guild" && T.hall) {
      // members spending their free time at the hall
      let j = 0;
      for (const v of App.villages) if (v.region === T.hall.region) for (const id of v.residents) {
        if (j >= 10 || App.isKO(id) || App.isDead(id)) continue;
        const step = App.planStep(id, st.T).step;
        if (step.k === "guildhall" && step.p.hall === T.hall.guild && m >= step.s + (step.travel || 0)) out.push({ id, pose: "stand", j: j++ });
      }
    }
    if (T.kind === "mine") {
      const v0 = App.villages.filter((v) => v.region === T.mine.region);
      for (const v of v0) for (const id of v.residents) {
        if (!App.isMiner(id) || App.mineOf(id) !== T.mine || App.isKO(id)) continue;
        const step = App.planStep(id, st.T).step;
        if (step.k === "mine" && m >= step.s + step.travel && (hash2(id, 243, 3) * map.rooms.length | 0) === ri) out.push({ id, pose: "dig" });
      }
      // the guard of the Warriors' Guild on its rounds: floor by floor, deeper as the afternoon goes on
      if (App.mineGuards) App.mineGuards(T.mine, day).forEach((id, j) => {
        if (App.isKO(id) || App.isDead(id)) return;
        const step = App.planStep(id, st.T).step;
        if (step.k !== "rounds" || m < step.s + (step.travel || 0)) return;
        const on = m - step.s - (step.travel || 0), shift = Math.max(1, step.e - step.s - (step.travel || 0));
        if (Math.min(map.rooms.length - 1, Math.floor((on / shift) * map.rooms.length)) === ri) out.push({ id, pose: "guard", j });
      });
    }
    return out.slice(0, map.big ? 16 : 8);
  }

  // ---------- drawing a room on black ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x50463c, 0.95), sun = new THREE.DirectionalLight(0xfff1dc, 0.65);
  sun.position.set(6, 14, 10);
  scene.add(hemi, sun);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  let cur = null; // { map, ri, group, figures, token, worldCam }
  const box = (w, h, d, color) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  function build(map, ri) {
    if (cur && cur.group) { scene.remove(cur.group); cur.group.traverse((o) => { if (o.isMesh && !o.userData.shared) { o.geometry.dispose(); } }); }
    const R = map.floor ? map.floor(ri) : map.rooms[ri], g = new THREE.Group(), token = {};
    cur.ri = ri; cur.group = g; cur.token = token; cur.rockAreas = null; cur.itemAreas = null; cur.figures = []; cur.lights = []; cur.carts = []; cur.pending = new Set(); cur.refreshT = performance.now();
    // the floor, in tiles (a maze floor: one slab per cell of the maze)
    const tile = new THREE.BoxGeometry(1, 0.25, 1);
    if (R.maze) {
      // most of a maze is rough rock, with patches of smooth worked stone (more in the catacombs and the labyrinth, few in a mine)
      const share = R.look && R.look.smooth != null ? R.look.smooth : 0.3, seed = (R.w * 31 + R.d * 17 + ri * 7) % 997;
      R.isSmooth = (x, z) => hash2(Math.floor((x + 3000) / (CS * 3)), Math.floor((z + 3000) / (CS * 3)), 431 + seed) < share;
      const slab = new THREE.BoxGeometry(CS, 0.25, CS), M = new THREE.Matrix4(), c0 = new THREE.Color(R.floor[0]), c1 = new THREE.Color(R.floor[1]), c = new THREE.Color();
      const im = new THREE.InstancedMesh(slab, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, R.cells.length));
      R.cells.forEach(([x, y], i) => {
        const sm = R.isSmooth(R.cx(x), R.cz(y));
        im.setMatrixAt(i, M.makeTranslation(R.cx(x), -0.125 - (sm ? 0 : hash2(x, y, 41) * 0.08), R.cz(y)));
        if (sm) c.copy((x + y) % 2 ? c1 : c0); else c.copy(c0).lerp(c1, hash2(x, y, 43)).multiplyScalar(0.82 + hash2(x, y, 47) * 0.28);
        im.setColorAt(i, c);
      });
      im.instanceColor.needsUpdate = true;
      g.add(im);
    }
    for (let k = 0; k < 2 && !R.maze; k++) {
      // (a room need not be a whole number of tiles across: the last row is a part tile, and there is room for all of them)
      const nw = Math.ceil(R.w), nd = Math.ceil(R.d), n = Math.ceil((nw * nd) / 2) + 2, im = new THREE.InstancedMesh(tile, new THREE.MeshLambertMaterial({ color: R.floor[k] }), n), M = new THREE.Matrix4();
      let c = 0;
      for (let x = 0; x < nw; x++) for (let z = 0; z < nd; z++) if ((x + z) % 2 === k) {
        const sx = Math.min(1, R.w - x), sz = Math.min(1, R.d - z);
        im.setMatrixAt(c++, M.makeScale(sx, 1, sz).setPosition(x + sx / 2 - R.w / 2, -0.125, z + sz / 2 - R.d / 2));
      }
      im.count = c;
      g.add(im);
    }
    if (R.maze) buildMaze(R, g, token);
    else {
      // the back and side walls (the front is left open, like a doll's house), with a skirting board
      const wb = box(R.w + 1.2, R.h, 0.6, R.wall); wb.position.set(0, R.h / 2, -R.d / 2 - 0.3); g.add(wb);
      for (const s of [-1, 1]) { const w = box(0.6, R.h, R.d, R.wall); w.position.set(s * (R.w / 2 + 0.3), R.h / 2, 0); g.add(w); const t = box(0.66, 0.6, R.d, R.trim); t.position.set(s * (R.w / 2 + 0.27), 0.3, 0); g.add(t); }
      const tb = box(R.w + 1.2, 0.6, 0.66, R.trim); tb.position.set(0, 0.3, -R.d / 2 - 0.27); g.add(tb);
    }
    if (R.dark && !R.maze) {
      // rough rock: a few boulders along the walls
      const rm = new THREE.MeshLambertMaterial({ color: R.wall });
      for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + hash2(k, ri, 7) * 1.2), rm); const side = k % 3; b.position.set(side === 0 ? -R.w / 2 + 0.4 : side === 1 ? R.w / 2 - 0.4 : -R.w / 2 + hash2(k, ri, 9) * R.w, 0.4 + hash2(k, ri, 11) * 3, side === 2 ? -R.d / 2 + 0.3 : -R.d / 2 + hash2(k, ri, 13) * R.d); g.add(b); }
      hemi.intensity = 0.45; sun.intensity = 0.25;
    } else if (R.maze && R.look && R.look.sun) { hemi.intensity = 0.95; sun.intensity = 0.7; } // open to the sky: daylight
    else if (R.maze && R.look && R.look.cold) { hemi.intensity = 0.55; sun.intensity = 0.3; }
    else if (R.maze) { hemi.intensity = 0.34; sun.intensity = 0.22; }
    else { hemi.intensity = 0.95; sun.intensity = 0.65; }
    scene.background = new THREE.Color(R.maze && R.look && R.look.sun ? R.look.sun : 0x000000);
    // the furniture, from the kit; on a maze floor, each kind of thing in one batch, and a few lights that follow the view
    if (R.maze) {
      // each kind of thing in one batch per patch of the floor (three cells by three), so that only the patches
      // in view, and not too far off, are drawn
      const groups = new Map(), AREA = CS * 3;
      cur.itemAreas = [];
      for (const it of R.items) { const k = it.k + ":" + (it.v || 0) + "|" + Math.floor((it.x + 3000) / AREA) + ":" + Math.floor((it.z + 3000) / AREA); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
      for (const [k, list] of groups) {
        const [kind, v] = k.split("|")[0].split(":");
        App.kitMesh(kind, +v).then((mk) => {
          if (cur.token !== token) return;
          const base = App.centeredMesh(mk.md, mk.geo, true); base.updateMatrix();
          let cx = 0, cz = 0;
          for (const it of list) { cx += it.x / list.length; cz += it.z / list.length; }
          const pg = new THREE.BufferGeometry();
          for (const n in mk.geo.attributes) pg.setAttribute(n, mk.geo.attributes[n]);
          pg.setIndex(mk.geo.index);
          pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 2, cz), AREA + 4);
          const im = new THREE.InstancedMesh(pg, App.voxMaterial, list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), O = new THREE.Vector3(1, 1, 1);
          im.userData.shared = true;
          list.forEach((it, i) => { M.compose(P.set(it.x, it.y || 0, it.z), Q.setFromAxisAngle(Y, it.rot || 0), O.setScalar(typeof it.s === "number" ? it.s : 1)).multiply(base.matrix); im.setMatrixAt(i, M); });
          g.add(im);
          cur.itemAreas.push({ cx, cz, m: im });
          cur.rockLodT = 0;
        });
      }
      cur.lightItems = R.items.filter((it) => it.light);
      cur.gate = null;
      if (R.gate) App.kitMesh("gate", 0).then((mk) => { if (cur.token !== token) return; const h = new THREE.Group(), mesh = App.centeredMesh(mk.md, mk.geo, true); mesh.userData.shared = true; h.add(mesh); h.position.set(R.gate.x, 0, R.gate.z); h.rotation.y = R.gate.rot; g.add(h); cur.gate = h; });
      for (let k = 0; k < 8; k++) { const L = new THREE.PointLight(R.look === MINE_LOOK ? 0xffd890 : 0xffb060, 1.3, 16, 1.6); L.position.set(0, -50, 0); g.add(L); cur.lights.push(L); }
      // the carts of a mine roll along its rails
      if (R.rails && R.carts) App.kitMesh("cart", 0).then((mk) => {
        if (cur.token !== token) return;
        for (const i0 of R.carts) {
          const h = new THREE.Group(), mesh = App.centeredMesh(mk.md, mk.geo, true), i = Math.min(R.rails.length - 1, i0), [x, y] = R.rails[i];
          mesh.userData.shared = true; h.add(mesh); h.position.set(R.cx(x), 0, R.cz(y)); g.add(h);
          cur.carts.push({ holder: h, path: R.rails, i, dir: i0 ? -1 : 1, x: R.cx(x), z: R.cz(y), wait: 0 });
        }
      });
      cur.poolT = 0;
    }
    for (const it of R.maze ? [] : R.items) {
      if (it.mon && !App.kitOn(it.k)) continue;
      if (it.k === "__ground") {
        // the owner's own on-chain Ground item, leaning by the wall
        App.itemMesh(App.pop.ground[it.id], App.pop.gtheme[it.id]).then(({ md, geo }) => {
          if (cur.token !== token) return;
          const holder = new THREE.Group(), mesh = App.centeredMesh(md, geo, true);
          mesh.userData.shared = true; holder.add(mesh); holder.scale.setScalar(0.8);
          holder.position.set(it.x, 0, it.z); holder.rotation.y = it.rot || 0;
          g.add(holder);
        });
        continue;
      }
      App.kitMesh(it.k, it.v || 0).then((mk) => {
        if (cur.token !== token) return;
        const holder = new THREE.Group(), mesh = App.centeredMesh(mk.md, mk.geo, true);
        mesh.userData.shared = true;
        holder.add(mesh);
        holder.position.set(it.x, it.y || 0, it.z);
        holder.rotation.y = it.rot || 0;
        if (it.s) Array.isArray(it.s) ? holder.scale.set(it.s[0], it.s[1], it.s[2]) : holder.scale.setScalar(it.s);
        else if (it.k === "bed") holder.scale.set(BED_W, 1, BED_L); // a bed long and wide enough for a Tickle lying in it
        if (it.mon) holder.userData.mon = true;
        g.add(holder);
      });
      if (it.light) { const L = new THREE.PointLight(R.maze && R.look === MINE_LOOK ? 0xffd890 : 0xffb060, 1.3, R.maze ? 16 : 14, 1.6); L.position.set(it.x, 3.2, it.z + 0.8); g.add(L); cur.lights.push(L); }
    }
    if (map.target.kind === "casino" && App.casinoBuild) App.casinoBuild(cur, g, token);
    // whoever is in there
    const who = occupants(map, ri);
    who.forEach((o, j) => spawnFigure(o, j, R, g, token));
    scene.add(g);
    hud(map, ri, who);
  }
  // where a party member is on this floor at this point of its afternoon: somewhere along the way, or at the guardian's hall
  function stageSpot(R, o) {
    const out = o.dg != null && R.outs ? R.outs.find((e) => e.dg === o.dg) : null;
    const path = pathOf(R.maze, out ? out.cell : R.entry, R.exit);
    const p = o.party && st.parties[o.party], S = p && App.partyStage ? App.partyStage(p, st.T) : null, j = o.j || 0;
    let door = Math.max(0, path.length - 2);
    if (R.hall) { const k = path.findIndex(([x, y]) => Math.hypot(R.cx(x) - R.hall.door.x, R.cz(y) - R.hall.door.z) < 1); if (k >= 0) door = k; }
    if (S && S.kind === "guardian") return { path, door, pi: Math.max(0, door - 1 + (j % 2)) };
    const prog = S && S.prog != null ? Math.min(1, S.prog) : 0;
    return { path, door, pi: Math.max(0, Math.min(door - 1, Math.floor(prog * door) - (j % 4))) };
  }
  // one figure: its look, its pose, and in a fight its weapon (a mage its staff and hat), its health and its part
  function spawnFigure(o, j, R, g, token) {
    if (cur.pending.has(o.id)) return;
    cur.pending.add(o.id);
    const faces = R.items.filter((i) => i.tag === "face");
    App.characterOf(o.id).then((e) => {
      if (cur.token !== token) return;
      cur.pending.delete(o.id);
      if (cur.figures.some((f) => f.id === o.id)) return;
      const F = App.buildFigure(e), holder = new THREE.Group();
      const fig = { F, pose: o.pose, id: o.id, holder, power: App.underPower ? App.underPower(o.id) : 10, party: o.party || null, tag: o.tag || null };
      if (o.pose === "fight" || o.pose === "guard") {
        const gear = App.gearOf ? App.gearOf(o.id) : null;
        fig.role = (App.combatRole && App.combatRole(o.id)) || "warrior"; fig.school = App.mageSchool ? App.mageSchool(o.id) : null; fig.weapon = gear ? gear.weapon : null; fig.shield = !!(gear && gear.armor);
        fig.max = fig.hp = Math.round(80 + 2 * App.levelOf(o.id));
        if (gear && App.weaponShow) App.weaponShow({ pivot: F.pivot, arms: F.arms, id: o.id, height: F.height }, gear.weapon, gear.armor);
        const bar = new THREE.Group(), bg = box(1.2, 0.14, 0.06, 0x330000), fg = box(1.2, 0.14, 0.08, 0x3cbf6c);
        bar.add(bg, fg); bar.position.y = (F.height || 3) + (fig.school && gear && gear.weapon === "staff" ? 1.4 : 0.5); bar.visible = false;
        holder.add(bar); fig.bar = bar; fig.fg = fg;
      }
      // whatever its paws hold is put away while it fights or digs (both paws are busy)
      if ((o.pose === "fight" || o.pose === "guard" || o.pose === "dig" || o.pose === "cards" || o.pose === "deal") && F.arms && F.arms.held) for (const s of ["R", "L"]) if (F.arms.held[s]) F.arms.held[s].visible = false;
      F.pivot.traverse((q) => { q.userData.shared = true; });
      holder.add(F.pivot);
      let x = -4 + j * 2.2, z = 2, rot = Math.PI;
      if (o.pose === "sleep") {
        // lying on its back, head on the pillow just short of the headboard, feet toward the foot of the bed
        const bj = R.spots.beds && R.spots.beds[j], b = bj || R.spots.bed || R.spots.sleep || { x: 0, z: 0 }, inBed = !!(bj || R.spots.bed), h = F.height || 3;
        x = b.x + (bj || !j ? 0 : 1.4 * j); rot = 0; F.pivot.rotation.x = -1.45; F.pivot.position.y = inBed ? 0.85 : 0.35; fig.bed = b;
        z = inBed ? Math.min(b.z + 0.2 + BED_HALF - 0.1, b.z + 0.2 - BED_HEAD + h) : b.z + 0.4;
      }
      else if (o.pose === "eat") { const sp = R.spots.table || { x: 0, z: 1.5, face: Math.PI }; x = sp.x + j * 1.6; z = sp.z; rot = sp.face; }
      else if (o.pose === "stand") { x = -6 + (j % 5) * 3; z = j < 5 ? -R.d / 2 + 3.4 : 4.6; rot = j < 5 ? Math.PI : 0; }
      else if (o.pose === "dig" && faces.length) {
        // along the rock faces, side by side
        const f = faces[j % faces.length], k = Math.floor(j / faces.length), off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.9;
        x = f.x + (f.rot ? 2.4 + Math.floor(k / 3) * 1.8 : off); z = f.z + (f.rot ? off : 2.4 + Math.floor(k / 3) * 1.8); rot = f.rot ? -Math.PI / 2 : Math.PI;
      }
      else if (o.pose === "fight") { x = -3 + j * 3; z = 3; rot = Math.PI; }
      if (o.at) { x = o.at.x; z = o.at.z; rot = o.at.rot; } // a place given by the room (a seat at a table)
      if (R.maze) {
        // in a maze the party walks its corridors from the way in to the stairs down; miners work the veins; guards make their rounds
        if (o.pose === "dig" && faces.length) {
          const fc = faces[(j * 3) % faces.length]; x = fc.x - Math.sin(fc.rot || 0) * 1.6; z = fc.z - Math.cos(fc.rot || 0) * 1.6; rot = fc.rot || 0; fig.digger = true;
          // a miner fights back with its pick if a goblin goes for it; it gets knocked about but never falls
          fig.role = "miner"; fig.digRot = rot; fig.max = fig.hp = Math.round(70 + 2 * App.levelOf(o.id)); fig.minHP = 1;
          const bar = new THREE.Group(), bg = box(1.2, 0.14, 0.06, 0x330000), fg = box(1.2, 0.14, 0.08, 0x3cbf6c);
          bar.add(bg, fg); bar.position.y = (F.height || 3) + 0.5; bar.visible = false; holder.add(bar); fig.bar = bar; fig.fg = fg;
        }
        else if (o.pose === "guard") {
          fig.patrol = pathOf(R.maze, R.entry, R.exit); fig.pi = Math.min(fig.patrol.length - 1, (o.j || 0) * 3); fig.pdir = 1;
          x = R.cx(fig.patrol[fig.pi][0]) + 0.9; z = R.cz(fig.patrol[fig.pi][1]) + 0.9;
        } else {
          const at = stageSpot(R, o);
          fig.path = at.path; fig.pi = Math.min(at.path.length - 1, at.pi); fig.door = at.door; fig.off = (j % 3 - 1) * 0.9;
          x = R.cx(fig.path[fig.pi][0]) + fig.off; z = R.cz(fig.path[fig.pi][1]) + fig.off * 0.6;
        }
        fig.x = x; fig.z = z;
      }
      holder.position.set(x, 0, z); holder.rotation.y = rot;
      // a sleeper is fitted to its own shape (Tickles are round): lying on top of the mattress (or the floor),
      // its head just short of the headboard
      if (o.pose === "sleep") {
        holder.updateMatrixWorld(true);
        const bx = new THREE.Box3().setFromObject(F.pivot), b = fig.bed && (R.spots.beds || R.spots.bed) ? fig.bed : null;
        F.pivot.position.y += (b ? BED_TOP : 0.03) - bx.min.y;
        if (b) { const head = b.z + 0.2 - BED_HEAD + 0.05, foot = b.z + 0.2 + BED_HALF + 0.3; let dz = 0; if (bx.min.z < head) dz = head - bx.min.z; else if (bx.max.z > foot) dz = Math.max(head - bx.min.z, foot - bx.max.z); holder.position.z += dz; }
      }
      g.add(holder);
      cur.figures.push(fig);
    });
  }
  // every second or so on a maze floor: newcomers come in, and those whose part here is over go on (or back up)
  function refreshFigures() {
    const R = cur.map.rooms[cur.ri], who = occupants(cur.map, cur.ri), ids = new Set(who.map((o) => o.id));
    if (cur.map.target.kind === "casino") {
      // guests come and go, and move from table to table
      const want = new Map(who.map((o) => [o.id, o]));
      for (const f of cur.figures) {
        const o = want.get(f.id);
        if (!o) { if (!f.gone) { f.gone = true; f.holder.visible = false; } continue; }
        if (f.gone) { f.gone = false; f.holder.visible = true; }
        if (f.tag === "waiter") continue;
        if (o.at) { f.holder.position.set(o.at.x, 0, o.at.z); f.holder.rotation.y = o.at.rot; }
        f.pose = o.pose;
      }
      who.forEach((o, j) => { if (!cur.figures.some((f) => f.id === o.id)) spawnFigure(o, j, R, cur.group, cur.token); });
      const sig = who.map((o) => o.id + (o.table || "")).join(",");
      if (sig !== cur.sig) { cur.sig = sig; hud(cur.map, cur.ri, who); }
      return;
    }
    who.forEach((o, j) => { if (!cur.figures.some((f) => f.id === o.id)) spawnFigure(o, j, R, cur.group, cur.token); });
    for (const f of cur.figures) {
      if (f.gone || f.leaving || ids.has(f.id) || !f.role) continue;
      const p = f.party && st.parties[f.party], S = p && App.partyStage ? App.partyStage(p, st.T) : null;
      if (S && !S.done && !S.pre && S.f > cur.ri && !f.ko && f.path) f.leaving = true;
      else { f.gone = true; f.holder.visible = false; }
    }
    // the party you are watching goes on down: offer to follow it
    const wp = cur.watch && st.parties[cur.watch], WS = wp && App.partyStage ? App.partyStage(wp, st.T) : null;
    if (WS && !WS.done && !WS.pre && WS.f > cur.ri && cur.followed !== WS.f) { cur.followed = WS.f; const key = cur.watch; App.toastAction ? App.toastAction(App.partyName(wp) + " is going down to B" + (WS.f + 1) + "F.", "Follow", () => App.watchParty(key)) : App.toast(App.partyName(wp) + " is going down to B" + (WS.f + 1) + "F."); }
    const sig = who.map((o) => o.id).join(",") + "|" + (App.liveParties ? App.liveParties().map((L) => L.key + L.S.i).join(",") : "");
    if (sig !== cur.sig) { cur.sig = sig; hud(cur.map, cur.ri, who); }
  }
  // the maze itself: walls between the cells (mostly rough rock like the on-chain boulders, here and there
  // smooth worked stone), and the monsters on patrol
  let ROCK_MAT = null;
  function buildMaze(R, g, token) {
    const m = R.maze, H = 3.4, boxes = [], In = (x, y) => m.seen.has(x + "," + y), forest = !!(R.look && R.look.forest), cold = !!(R.look && R.look.cold);
    for (const [x, y] of R.cells) {
      // east and south sides always; west and north only where nothing of the maze is beyond
      if (!openTo(m, x, y, 1, 0)) boxes.push([(x + 1) * CS - R.w / 2, R.cz(y), 1, CS + 1]);
      if (!openTo(m, x, y, 0, 1)) { const front = !In(x, y + 1); const door = front && !R.big && R.warps[0] && R.warps[0].to.outside && Math.abs(R.cx(x) - R.warps[0].x) < 0.1; if (!door) boxes.push([R.cx(x), (y + 1) * CS - R.d / 2, CS + 1, 1, front && !R.big ? 1.2 : 0]); }
      if (!In(x - 1, y)) boxes.push([x * CS - R.w / 2, R.cz(y), 1, CS + 1]);
      if (!In(x, y - 1)) boxes.push([R.cx(x), y * CS - R.d / 2, CS + 1, 1]);
    }
    const smoothAt = R.isSmooth || (() => true), flat = [], rock = [];
    for (const b of boxes) (smoothAt(b[0], b[1]) ? flat : rock).push(b);
    const geo = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, flat.length)), M = new THREE.Matrix4(), c1 = new THREE.Color(R.look.wall), c2 = new THREE.Color(R.look.wall2), c = new THREE.Color();
    flat.forEach(([x, z, w, d, h], i) => { const hh = h || H; M.makeScale(w, hh, d).setPosition(x, hh / 2, z); im.setMatrixAt(i, M); im.setColorAt(i, c.copy(c1).lerp(c2, hash2(i, 3, 17))); });
    im.count = flat.length;
    if (flat.length) { im.instanceColor.needsUpdate = true; g.add(im); } // (not drawn empty: its colourless shader would be reused by the blocks below)
    // the rough rock: stretches of the rock-wall kit, grey, darker grey or brown, tinted a little by the band's colour;
    // batched by patch of the maze so that only the patches in view are drawn
    const lt = new THREE.Color(R.look.wall), mx = Math.max(lt.r, lt.g, lt.b, 0.01);
    lt.setRGB(lt.r / mx, lt.g / mx, lt.b / mx);
    const TINTS = [new THREE.Color(1, 1, 1), new THREE.Color(0.68, 0.68, 0.72), new THREE.Color(0.92, 0.74, 0.56)];
    // batched by patch of the maze (two cells by two); near the view a patch shows the stones themselves,
    // further off the same walls as plain blocks in the rocks' colours (the stones are too many to draw everywhere)
    const PATCH = CS * 2, areas = new Map();
    rock.forEach((b, i) => {
      const key = Math.floor((b[0] + 3000) / PATCH) + ":" + Math.floor((b[1] + 3000) / PATCH);
      if (!areas.has(key)) areas.set(key, { segs: [], rock: [], box: null, cx: 0, cz: 0 });
      areas.get(key).segs.push({ b, v: Math.floor(hash2(i, 7, 23) * 3), tint: Math.floor(hash2(Math.round(b[0]), Math.round(b[1]), 37) * 3) });
    });
    const Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), O = new THREE.Vector3(), grey = new THREE.Color(0x8a8a8a);
    cur.rockAreas = [];
    for (const A of areas.values()) {
      for (const s of A.segs) { A.cx += s.b[0] / A.segs.length; A.cz += s.b[1] / A.segs.length; }
      const bm = new THREE.InstancedMesh(geo, mat, A.segs.length);
      // (in the forest: a hedge, always there, the trees standing over it near the view)
      A.segs.forEach(({ b: [x, z, w, d, h], tint }, i) => { const hh = (h || H) * (forest ? 0.62 : 0.95); M.makeScale(w * 1.15, hh, d * 1.15).setPosition(x, hh / 2, z); bm.setMatrixAt(i, M); bm.setColorAt(i, forest ? c.copy(c1).lerp(c2, hash2(i, 9, 19)) : c.copy(grey).multiply(TINTS[tint]).lerp(lt, cold ? 0.85 : 0.2)); });
      A.keepBox = forest;
      bm.instanceColor.needsUpdate = true;
      g.add(bm);
      A.box = bm;
      cur.rockAreas.push(A);
    }
    for (let v = 0; v < 3; v++) (forest ? App.kitMesh(["tree_leafy", "tree_pine", "tree_leafy"][v], 0) : App.kitMesh("rockwall", v)).then((mk) => {
      if (cur.token !== token) return;
      const base = App.centeredMesh(mk.md, mk.geo, true); base.updateMatrix();
      for (const A of cur.rockAreas) {
        const list = A.segs.filter((s) => s.v === v);
        if (!list.length) continue;
        // its own geometry, sharing the rock's buffers, with bounds round just this patch
        const pg = new THREE.BufferGeometry();
        for (const n in mk.geo.attributes) pg.setAttribute(n, mk.geo.attributes[n]);
        pg.setIndex(mk.geo.index);
        pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(A.cx, 2, A.cz), PATCH + 6);
        // (a material of its own: three r128 would reuse a coloured-instance shader for the other kit pieces)
        const rm = new THREE.InstancedMesh(pg, ROCK_MAT || (ROCK_MAT = new THREE.MeshLambertMaterial({ vertexColors: true })), list.length);
        rm.userData.shared = true;
        rm.visible = false;
        list.forEach(({ b: [x, z, w, d, h], tint }, i) => {
          const along = w > d, flip = hash2(Math.round(x * 3), Math.round(z * 3), 29) < 0.5;
          const sy = h ? 0.32 : 0.82 + hash2(Math.round(x), Math.round(z), 31) * 0.18;
          if (forest) { const k = 1.0 + hash2(Math.round(x), Math.round(z), 33) * 0.45; M.compose(P.set(x, 0, z), Q.setFromAxisAngle(Y, hash2(Math.round(x), Math.round(z), 35) * 6.28), O.set(k, k, k)).multiply(base.matrix); }
          else M.compose(P.set(x, 0, z), Q.setFromAxisAngle(Y, (along ? 0 : Math.PI / 2) + (flip ? Math.PI : 0)), O.set(1, sy, 1)).multiply(base.matrix);
          rm.setMatrixAt(i, M);
          rm.setColorAt(i, forest ? c.setRGB(1, 1, 1) : cold ? c.copy(TINTS[0]).lerp(c1, 0.75) : c.copy(TINTS[tint]).lerp(lt, 0.3)); // (ice: pale and blue)
        });
        rm.instanceColor.needsUpdate = true;
        g.add(rm);
        A.rock.push(rm);
      }
      cur.rockLodT = 0;
    });
    // pebbles on the floor of the rocky stretches (fallen leaves would do in the forest: none there)
    const peb = [];
    for (const [x, y] of R.cells) {
      const px = R.cx(x), pz = R.cz(y);
      if (smoothAt(px, pz) || forest) continue;
      for (let k = 0; k < 3; k++) { const a = hash2(x * 7 + k, y, 51) * 6.28, d = 1.6 + hash2(x, y * 7 + k, 53) * 1.2; peb.push([px + Math.cos(a) * d, pz + Math.sin(a) * d, 0.12 + hash2(x + k, y, 55) * 0.22]); }
    }
    if (peb.length) {
      const pm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1), new THREE.MeshLambertMaterial({ color: 0xffffff }), peb.length), pc = new THREE.Color(0x5e5a54);
      peb.forEach(([x, z, s], i) => { M.compose(P.set(x, s * 0.4, z), Q.setFromAxisAngle(Y, i), O.set(s * 1.3, s, s)); pm.setMatrixAt(i, M); pm.setColorAt(i, c.copy(pc).multiply(TINTS[i % 3]).lerp(c1, 0.35)); });
      pm.instanceColor.needsUpdate = true;
      g.add(pm);
    }
    // a rough top on the smooth walls: rubble along them
    const tall = flat.filter((b) => !b[4]);
    const top = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5), new THREE.MeshLambertMaterial({ color: R.look.wall2 }), Math.max(1, tall.length));
    tall.forEach(([x, z, w, d], i) => { M.makeScale(w * 0.9, 0.5 + hash2(i, 5, 7) * 0.5, d * 0.9).setPosition(x, H, z); top.setMatrixAt(i, M); });
    top.count = tall.length;
    g.add(top);
    // pools of water in the grotto, of glowing lava in the volcanic deep
    if (R.pools && R.pools.length) {
      const lava = R.look.pools === "lava", pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 0.08, 16), lava ? new THREE.MeshBasicMaterial({ color: 0xff6a1a }) : new THREE.MeshLambertMaterial({ color: 0x2f8fe0, transparent: true, opacity: 0.8 }), R.pools.length);
      R.pools.forEach(([x, z, r0], i) => { M.compose(P.set(x, 0.05, z), Q.identity(), O.set(r0, 1, r0 * 0.8)); pm.setMatrixAt(i, M); });
      g.add(pm);
      if (lava) { const rim = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 0.06, 16), new THREE.MeshBasicMaterial({ color: 0xffd23f }), R.pools.length); R.pools.forEach(([x, z, r0], i) => { M.compose(P.set(x, 0.09, z), Q.identity(), O.set(r0 * 0.45, 1, r0 * 0.36)); rim.setMatrixAt(i, M); }); g.add(rim); }
    }
    // the monsters, each with a health bar
    cur.mons = [];
    for (const mo of R.mons) if (App.kitOn(mo.k)) addMonster(mo, g, token);
  }
  function addMonster(mo, g, token) {
    {
      const bossHP = (500 + (mo.floor || 0) * 12) * (mo.k === "goldtickle" ? 1.8 : 1); // the Golden Tickle outlasts every other guardian
      const hp0 = mo.boss ? bossHP : mo.minion ? 60 : 100;
      const st0 = { mo, holder: null, x: mo.x, z: mo.z, i: 0, dir: 1, hp: hp0, max: hp0, dead: 0, h: 0, foe: null, hit: 0 };
      cur.mons.push(st0);
      App.kitMesh(mo.k, mo.v || 0).then((mk) => {
        if (cur.token !== token) return;
        const holder = new THREE.Group(), mesh = App.centeredMesh(mk.md, mk.geo, true);
        mesh.userData.shared = true; mesh.scale.multiplyScalar(mo.scale || 1);
        const pivot = new THREE.Group(); pivot.add(mesh); holder.add(pivot); st0.body = pivot; st0.bodyScale = 1; st0.seed = Math.random() * 6.28; // (the pivot moves, so the model turns about its feet)
        const tall = new THREE.Box3().setFromObject(mesh).max.y;
        const bar = new THREE.Group(), bg = box(mo.boss ? 3 : 1.6, 0.18, 0.08, 0x330000), fg = box(mo.boss ? 3 : 1.6, 0.18, 0.1, mo.boss ? 0xff7a2f : 0xe8443a);
        bar.add(bg, fg); bar.position.y = tall + (mo.crown ? 1.4 : 0.5); bar.visible = false;
        holder.add(bar);
        st0.barW = mo.boss ? 3 : 1.6;
        if (mo.crown) App.kitMesh("crown", 0).then((ck) => { if (cur.token !== token) return; const c = App.centeredMesh(ck.md, ck.geo, true); c.userData.shared = true; c.scale.multiplyScalar(Math.max(1, (mo.scale || 1) * 0.7)); c.position.y += tall - 0.15; holder.add(c); });
        holder.position.set(st0.x, 0, st0.z);
        g.add(holder);
        st0.holder = holder; st0.bar = bar; st0.fg = fg; st0.tall = tall;
      });
      return st0;
    }
  }
  const turnTo = (h, t, k) => { let df = t - h; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; return h + Math.max(-k, Math.min(k, df)); };
  // two points can fight only in the same cell or in neighbouring cells with no wall between
  function reach(R, ax, az, bx, bz) {
    const c = (x, z) => [Math.max(0, Math.min(R.maze.W - 1, Math.floor((x + R.w / 2) / CS))), Math.max(0, Math.min(R.maze.H - 1, Math.floor((z + R.d / 2) / CS)))];
    const [x0, y0] = c(ax, az), [x1, y1] = c(bx, bz), dx = x1 - x0, dy = y1 - y0;
    if (!dx && !dy) return true;
    return Math.abs(dx) + Math.abs(dy) === 1 && openTo(R.maze, x0, y0, dx, dy);
  }
  // ---------- fighting down below ----------
  // Warriors close in and strike, mages keep their distance and cast, healers mend whoever is hurt; monsters
  // go for the nearest of them and hit back, and a guardian shakes the ground now and then. Every blow shows
  // what it took off. A party's afternoon was planned when it went down (floor by floor, guardian by
  // guardian), and what you watch follows that plan: a guardian cannot fall before its time, a party that
  // wins does not fall, and one that loses is struck down one by one.
  const FXS = () => App.FX;
  const needOf = (m) => (m && m.mo.boss ? (App.guardianNeed ? App.guardianNeed(cur.ri) : 60) : (App.floorNeed ? App.floorNeed(cur.ri) : 30));
  const SCH_COL = { fire: "#ff7a2f", frost: "#8fd3f4", storm: "#fff4a0", arcane: "#c9a6ff", light: "#7be08f" };
  function hurtMonster(m, f, dmg, color) {
    if (m.dead || !m.holder) return;
    m.hp -= dmg; m.hit = performance.now(); if (!m.foe) m.foe = f;
    if (f) { m.aggro = f; m.aggroUntil = m.hit + 8000; } // it goes after whoever hit it, spell or blade
    if (m.floorHP != null) m.hp = Math.max(m.hp, m.floorHP);
    if (FXS()) FXS().number(scene, { x: m.x, y: (m.tall || 3) + 0.9, z: m.z }, String(Math.max(1, Math.round(dmg))), color || "#ffd23f");
    if (m.hp <= 0) killMonster(m, f);
  }
  function killMonster(m, f) {
    m.dead = performance.now() + (m.mo.boss ? 180000 : m.mo.minion ? 2500 : 45000); m.hp = 0; m.foe = null; m.cast = null; m.dash = null; m.enraged = false;
    if (m.fg && m.mo.boss) m.fg.material.color.set(0xff7a2f);
    // a guardian's summoned creatures go with it
    if (m.mo.boss) for (const x of cur.mons) if (x.owner === m && !x.dead) killMonster(x, null);
    if (FXS()) FXS().burst(scene, { x: m.x, y: 1.4, z: m.z }, m.mo.boss ? "#ffd23f" : "#c9a6ff", m.mo.boss ? 40 : 20, m.mo.boss ? 0.24 : 0.16);
    App.sfx && App.sfx.punch && App.sfx.punch();
    if (m.mo.boss) {
      const p = f && f.party && st.parties[f.party];
      App.toast((p ? App.partyName(p) + " has" : f ? App.nameOf(f.id) + " has" : "They have") + " beaten " + m.mo.name + "!");
      hud(cur.map, cur.ri, cur.who || []);
    }
  }
  function hurtFighter(f, dmg) {
    if (f.ko || f.gone) return;
    f.hp -= dmg; f.hitAt = performance.now();
    if (f.minHP != null) f.hp = Math.max(f.hp, f.minHP);
    if (FXS()) { FXS().number(scene, { x: f.x, y: 3.9, z: f.z }, String(Math.max(1, Math.round(dmg))), "#ff6b5e"); FXS().burst(scene, { x: f.x, y: 1.5, z: f.z }, "#ff6b5e", 6, 0.1); }
    if (f.hp <= 0) { f.hp = 0; f.ko = true; f.pose = "ko"; App.toast(App.nameOf(f.id) + " is down!"); }
  }
  // in sight: the same cell, or a neighbouring one with no wall between (two cells for a caster or a guardian)
  function viaCell(R, a, b) {
    const c = (x, z) => [Math.floor((x + R.w / 2) / CS), Math.floor((z + R.d / 2) / CS)], [x0, y0] = c(a.x, a.z);
    for (const [dx, dy] of DIRS) if (openTo(R.maze, x0, y0, dx, dy) && reach(R, R.cx(x0 + dx), R.cz(y0 + dy), b.x, b.z)) return { x: R.cx(x0 + dx), z: R.cz(y0 + dy) };
    return null;
  }
  function inSight(R, a, b, far) {
    if (reach(R, a.x, a.z, b.x, b.z)) return true;
    if (!far) return false;
    const c = (x, z) => [Math.floor((x + R.w / 2) / CS), Math.floor((z + R.d / 2) / CS)], [x0, y0] = c(a.x, a.z), [x1, y1] = c(b.x, b.z);
    if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > 2) return false;
    for (const [dx, dy] of DIRS) if (openTo(R.maze, x0, y0, dx, dy) && reach(R, R.cx(x0 + dx), R.cz(y0 + dy), b.x, b.z)) return true;
    return false;
  }
  const SPEED = { goblin: 2.2, skeleton: 1.4, spider: 2.6, ogre: 1.0, minotaur: 1.2, troll: 0.9, gloomslime: 0.8, shadebat: 2.4, brutecap: 1.0, kobold: 2.3, mummy: 0.8, harpy: 2.6, basilisk: 1.6,
    werewolf: 2.6, centaur: 2.4, golem: 0.7, salamander: 1.8, manticore: 2.0, wraith: 1.3, cerberus: 2.4, cyclops: 1.0, hydra: 0.7, chimera: 1.6, medusa: 1.0, lich: 1.0, goldtickle: 1.1 };
  // ---------- what a guardian can do besides hitting ----------
  // Every guardian has two to four special attacks of its own. Each is announced (its name over the guardian's
  // head) and the ground where it will land glows red for a moment first, so you can see it coming:
  //   Ground Slam  a shockwave all round it          Breath      fire, venom or a curse in a cone in front
  //   Charge       straight at the one furthest off   Storm       bolts from the sky (or a volley) on each fighter
  //   Gaze         a beam that turns its target to stone for a moment (the cyclops's eye burns instead)
  //   Screech      everyone close is stunned           Summon      it calls up more of its kind
  // Below a third of its health a guardian is enraged: it strikes faster and uses its specials more often.
  const BOSS_MOVES = {
    goblin: ["summon", "charge", "quake"], kobold: ["summon", "nova"], gloomslime: ["quake", "breath"], shadebat: ["screech", "summon"], spider: ["breath", "summon"],
    skeleton: ["summon", "charge"], mummy: ["breath", "summon"], wraith: ["nova", "screech"], lich: ["nova", "summon", "screech"],
    harpy: ["screech", "nova"], basilisk: ["gaze", "charge"], brutecap: ["quake", "summon"], medusa: ["gaze", "nova"], werewolf: ["charge", "screech"],
    centaur: ["charge", "nova"], golem: ["quake", "charge"], minotaur: ["charge", "quake"], ogre: ["quake", "charge"], cyclops: ["gaze", "quake"],
    salamander: ["breath", "quake"], manticore: ["breath", "charge", "nova"], troll: ["quake", "charge"], chimera: ["breath", "charge"], hydra: ["breath", "nova"],
    cerberus: ["breath", "charge", "screech"], goldtickle: ["nova", "quake", "summon", "charge", "breath"],
  };
  const BREATH = { salamander: "fire", chimera: "fire", cerberus: "fire", goldtickle: "gold", manticore: "venom", hydra: "venom", spider: "venom", gloomslime: "venom", mummy: "dark" };
  const NOVA = { lich: ["sky", "#9a5cff"], wraith: ["sky", "#9a5cff"], harpy: ["sky", "#fff4a0"], goldtickle: ["sky", "#ffd23f"], kobold: ["throw", "fire"], centaur: ["throw", "arcane"], hydra: ["throw", "venom"], medusa: ["throw", "venom"], manticore: ["throw", "venom"] };
  const MINION = { goblin: "goblin", kobold: "kobold", shadebat: "shadebat", spider: "spider", skeleton: "skeleton", mummy: "skeleton", lich: "skeleton", brutecap: "brutecap", goldtickle: "golem" };
  const EL_COL = { fire: "#ff7a2f", venom: "#7bd34a", dark: "#9a5cff", gold: "#ffd23f" };
  function moveName(k, mv) {
    if (mv === "quake") return "Ground Slam!";
    if (mv === "charge") return "Charge!";
    if (mv === "screech") return k === "werewolf" || k === "cerberus" ? "Howl!" : k === "lich" || k === "wraith" ? "Wail of the Dead!" : "Screech!";
    if (mv === "gaze") return k === "cyclops" ? "Eye Beam!" : "Petrifying Gaze!";
    if (mv === "breath") return { fire: "Fire Breath!", venom: k === "manticore" ? "Venom Spikes!" : "Venom Spray!", dark: "Curse of Sand!", gold: "Golden Breath!" }[BREATH[k] || "fire"];
    if (mv === "nova") return k === "goldtickle" ? "Golden Rays!" : k === "kobold" ? "Fire Pots!" : k === "centaur" ? "Volley!" : k === "harpy" ? "Lightning Storm!" : NOVA[k] && NOVA[k][1] === "venom" ? "Venom Rain!" : "Dark Storm!";
    return k === "goldtickle" ? "The Maker's Echoes!" : k === "goblin" || k === "kobold" ? "Call the Horde!" : k === "spider" ? "The Brood!" : k === "shadebat" ? "Swarm!" : k === "brutecap" ? "Spore Brood!" : "Raise the Dead!";
  }
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return Math.abs(d); };
  const weakTo = (m, f) => Math.max(0.2, Math.min(3, needOf(m) / (4 * (f.power || 10))));
  // knocked back (or a quick hop out of the way)
  function shove(f, from, speed, now) { const dx = f.x - from.x, dz = f.z - from.z, d = Math.hypot(dx, dz) || 1; f.kb = { vx: (dx / d) * speed, vz: (dz / d) * speed, until: now + 320 }; }
  function startSpecial(R, m, tgt, fighters, now) {
    const fx = FXS();
    if (!fx) return;
    const moves = BOSS_MOVES[m.mo.k] || ["quake"]; m.moveI = ((m.moveI == null ? -1 : m.moveI) + 1) % moves.length;
    const mv = moves[m.moveI], wait = m.enraged ? 850 : 1200, h = Math.atan2(tgt.x - m.x, tgt.z - m.z), C = { mv, at: now + wait, h }, L = wait / 1000;
    const near = fighters.filter((f) => !f.ko && !f.leaving && Math.hypot(f.x - m.x, f.z - m.z) < 16);
    m.h = h;
    if (mv === "quake") fx.warn(scene, m, 7, L, "#ff7a2f");
    else if (mv === "breath") fx.warnCone(scene, m, h, 10, L, EL_COL[BREATH[m.mo.k] || "fire"]);
    else if (mv === "charge") { const far = near.slice().sort((a, b) => Math.hypot(b.x - m.x, b.z - m.z) - Math.hypot(a.x - m.x, a.z - m.z))[0] || tgt; C.to = { x: far.x, z: far.z }; C.h = Math.atan2(far.x - m.x, far.z - m.z); fx.warnLine(scene, m, C.to, 2.8, L); }
    else if (mv === "nova") { C.spots = (near.length ? near : [tgt]).slice(0, m.enraged ? 6 : 4).map((f) => ({ x: f.x + (Math.random() - 0.5) * 1.2, z: f.z + (Math.random() - 0.5) * 1.2 })); const nv = NOVA[m.mo.k] || ["sky", "#9a5cff"], ncol = nv[1].charAt(0) === "#" ? nv[1] : EL_COL[nv[1]] || "#ff3b2f"; for (const q of C.spots) fx.warn(scene, q, 2.3, L, ncol); }
    else if (mv === "gaze") { C.to = tgt; fx.warnLine(scene, m, tgt, 1.3, L, m.mo.k === "cyclops" ? "#ff7a2f" : "#d8d0b0"); }
    else if (mv === "screech") fx.warn(scene, m, 9, L, "#c9a6ff");
    else fx.warn(scene, m, 4, L, "#9a5cff");
    fx.label(scene, { x: m.x, y: (m.tall || 3) + 0.9, z: m.z }, moveName(m.mo.k, mv), m.enraged ? "#ff6b5e" : "#ffd23f");
    // the quick ones hop out of a slam or a breath they see coming
    if (mv === "quake" || mv === "breath") for (const f of near) if (Math.random() < 0.3 && (mv === "quake" ? Math.hypot(f.x - m.x, f.z - m.z) < 7 : angDiff(Math.atan2(f.x - m.x, f.z - m.z), h) < 0.6)) setTimeout(() => shove(f, m, 10, performance.now()), 300 + Math.random() * 400);
    m.cast = C; m.nextSpecial = now + wait + (m.enraged ? 4200 : 6500);
  }
  function runSpecial(R, m, fighters, dt, now) {
    const fx = FXS(), C = m.cast;
    if (m.dash) {
      // the charge: straight at where its target stood, knocking aside whoever is in the way
      const D = m.dash, dx = D.x - m.x, dz = D.z - m.z, d = Math.hypot(dx, dz), sp = Math.min(d, 20 * dt);
      if (d < 0.4 || now > D.until) { m.dash = null; fx.burst(scene, { x: m.x, y: 0.5, z: m.z }, "#c8a070", 18, 0.18); }
      else { m.x += (dx / d) * sp; m.z += (dz / d) * sp; }
      for (const f of fighters) if (!f.ko && !D.hit.has(f) && Math.hypot(f.x - m.x, f.z - m.z) < 2.6) { D.hit.add(f); hurtFighter(f, 14 * weakTo(m, f)); shove(f, m, 12, now); }
      m.holder.rotation.y = m.h; m.holder.position.set(m.x, 0, m.z);
      return;
    }
    // winding up: it stands its ground and shakes
    m.holder.rotation.y = m.h;
    if (now < C.at) { m.holder.position.set(m.x + Math.sin(now / 25) * 0.1, 0, m.z + Math.cos(now / 31) * 0.1); return; }
    m.cast = null; m.lungeAt = now;
    m.holder.position.set(m.x, 0, m.z);
    const k = m.mo.k, mouth = { x: m.x + Math.sin(C.h) * 1.5, y: Math.max(1.5, (m.tall || 3) * 0.65), z: m.z + Math.cos(C.h) * 1.5 }, inR = (q, r) => fighters.filter((f) => !f.ko && Math.hypot(f.x - q.x, f.z - q.z) < r);
    if (C.mv === "quake") {
      fx.ring(scene, { x: m.x, y: 0, z: m.z }, k === "goldtickle" ? "#ffd23f" : "#ff9a3c", 7, 0.7); fx.ring(scene, { x: m.x, y: 0, z: m.z }, "#ffffff", 5, 0.45); fx.burst(scene, { x: m.x, y: 0.4, z: m.z }, "#c8a070", 30, 0.22);
      for (const f of inR(m, 7)) { hurtFighter(f, 12 * weakTo(m, f)); shove(f, m, 8, now); }
    } else if (C.mv === "breath") {
      const el = BREATH[k] || "fire", cone = fx.CONE ? fx.CONE() : 1.2;
      for (let n = 0; n < 9; n++) { const a = C.h + (Math.random() - 0.5) * cone, r = 3 + Math.random() * 7; setTimeout(() => fx.bolt(scene, mouth, { x: m.x + Math.sin(a) * r, y: 0.4, z: m.z + Math.cos(a) * r }, el), n * 45); }
      for (const f of fighters) if (!f.ko && Math.hypot(f.x - m.x, f.z - m.z) < 10.5 && angDiff(Math.atan2(f.x - m.x, f.z - m.z), C.h) < cone / 2 + 0.1) hurtFighter(f, 11 * weakTo(m, f));
    } else if (C.mv === "charge") m.dash = { x: C.to.x, z: C.to.z, hit: new Set(), until: now + 1500 };
    else if (C.mv === "nova") {
      const [how, col] = NOVA[k] || ["sky", "#9a5cff"];
      C.spots.forEach((q, n) => setTimeout(() => {
        if (how === "sky") fx.lightning(scene, { x: q.x, y: 14, z: q.z }, { x: q.x, y: 0.1, z: q.z }, col); else fx.bolt(scene, mouth, { x: q.x, y: 0.3, z: q.z }, col);
        fx.ring(scene, { x: q.x, y: 0, z: q.z }, how === "sky" ? col : EL_COL[col] || "#ffffff", 2.4, 0.4);
        for (const f of inR(q, 2.4)) hurtFighter(f, 10 * weakTo(m, f));
      }, n * 120));
    } else if (C.mv === "gaze") {
      const f = C.to, burn = k === "cyclops";
      fx.bolt(scene, { x: m.x, y: (m.tall || 3) * 0.8, z: m.z }, { x: f.x, y: 1.6, z: f.z }, burn ? "fire" : "stone");
      if (!f.ko && Math.hypot(f.x - m.x, f.z - m.z) < 18) {
        hurtFighter(f, (burn ? 13 : 5) * weakTo(m, f));
        if (!burn && !f.ko) { f.stunUntil = now + 2600; fx.burst(scene, { x: f.x, y: 1.8, z: f.z }, "#d8d0b0", 16, 0.14); }
      }
    } else if (C.mv === "screech") {
      fx.ring(scene, { x: m.x, y: 0.5, z: m.z }, "#c9a6ff", 9, 0.5); setTimeout(() => fx.ring(scene, { x: m.x, y: 0.5, z: m.z }, "#c9a6ff", 9, 0.5), 180);
      for (const f of inR(m, 9)) { hurtFighter(f, 5 * weakTo(m, f)); if (!f.ko) f.stunUntil = now + 1300; }
    } else {
      // it calls up more of its kind (they fade away again after a while)
      const kind = MINION[k] || "goblin";
      if (!App.kitOn(kind)) return;
      const alive = cur.mons.filter((x) => x.owner === m && !x.dead).length, want = Math.min(4, alive + 2 + (m.enraged ? 1 : 0));
      for (let n = alive; n < want; n++) {
        const near = fighters.filter((f) => !f.ko), aim = near.length ? near[Math.floor(Math.random() * near.length)] : null;
        const a = aim ? Math.atan2(aim.z - m.z, aim.x - m.x) + (Math.random() - 0.5) * 1.2 : Math.random() * 6.283, x = m.x + Math.cos(a) * 3.2, z = m.z + Math.sin(a) * 3.2;
        const cell = [Math.max(0, Math.min(R.maze.W - 1, Math.floor((x + R.w / 2) / CS))), Math.max(0, Math.min(R.maze.H - 1, Math.floor((z + R.d / 2) / CS)))];
        const mo2 = addMonster({ k: kind, v: 0, x, z, path: [cell, cell], minion: true, scale: kind === "golem" ? 0.75 : 1 }, cur.group, cur.token);
        mo2.owner = m; mo2.expire = now + 30000;
        fx.burst(scene, { x, y: 0.5, z }, "#9a5cff", 16, 0.16); fx.ring(scene, { x, y: 0, z }, "#9a5cff", 1.8, 0.5);
      }
    }
  }
  function stepMaze(dt, now) {
    const R = cur.map.rooms[cur.ri];
    if (!R.maze || !cur.mons) return;
    const fx = FXS(), vx = cur.view ? cur.view.x : 0, vz = cur.view ? cur.view.z : 0;
    const fighters = cur.figures.filter((f) => f.role && !f.ko && !f.gone);
    const guard = cur.mons.find((m) => m.mo.boss), sealed = guard && !guard.dead;
    // the parties on this floor, and where each is in its afternoon
    const SG = {};
    for (const f of cur.figures) if (f.party && !(f.party in SG)) { const p = st.parties[f.party]; SG[f.party] = p && App.partyStage ? App.partyStage(p, st.T) : null; }
    for (const m of cur.mons) m.floorHP = null;
    for (const key in SG) {
      const S = SG[key];
      if (!S || S.pre || S.done || S.f !== cur.ri) continue;
      const mine = cur.figures.filter((f) => f.party === key && !f.gone), prog = Math.min(1, S.prog);
      // a party that gets through does not fall; one that does not is struck down one by one
      if (S.ok) for (const f of mine) f.minHP = 1;
      else mine.forEach((f, j) => { f.minHP = null; if (prog > 0.25 + (0.7 * (j + 1)) / (mine.length + 1) && !f.ko) hurtFighter(f, f.hp + 1); });
      // the guardian's health follows the plan: it falls at the end of a winning fight, never to a losing one
      if (S.kind === "guardian" && guard && !guard.dead) {
        guard.floorHP = guard.max * (1 - prog * (S.ok ? 1 : 0.55));
        guard.hp = Math.min(guard.hp, guard.floorHP + guard.max * 0.1);
        if (S.ok && prog > 0.97 && guard.holder) killMonster(guard, mine[0]);
      }
    }
    // the party (and the guards in a mine): find a foe, close in or cast; or go on along the way
    for (const f of fighters) {
      const S = f.party ? SG[f.party] : null, caster = f.role === "mage" || (f.role === "healer" && f.weapon === "staff");
      if (f.leaving) {
        // its part on this floor is over: on to the stairs down
        const [tx, ty] = f.path[Math.min(f.path.length - 1, f.pi)], gx = R.cx(tx), gz = R.cz(ty), dx = gx - f.x, dz = gz - f.z, d = Math.hypot(dx, dz);
        f.pose = "walk";
        if (d < 0.3) { f.pi++; if (f.pi >= f.path.length) { f.gone = true; f.holder.visible = false; if (!R.last) App.toast(App.nameOf(f.id) + " went down to B" + (cur.ri + 2) + "F."); } }
        else { const sp = Math.min(d, 3.2 * dt); f.x += (dx / d) * sp; f.z += (dz / d) * sp; f.holder.rotation.y = Math.atan2(dx, dz); f.holder.position.set(f.x, 0, f.z); }
        continue;
      }
      // knocked back, or stunned (turned to stone for a moment, deafened by a screech)
      if (f.kb && f.kb.until > now) { f.x += f.kb.vx * dt; f.z += f.kb.vz * dt; f.holder.position.set(f.x, 0, f.z); continue; }
      if (f.stunUntil > now) { f.pose = "stun"; if (fx && Math.random() < dt * 5) fx.burst(scene, { x: f.x, y: 2.6, z: f.z }, "#d8d0b0", 2, 0.08); continue; }
      if (f.role === "miner") {
        const att = cur.mons.find((m) => m.foe === f && !m.dead && m.holder && Math.hypot(m.x - f.x, m.z - f.z) < 3.8);
        if (!att) { f.pose = "dig"; f.holder.rotation.y = f.digRot || 0; if (f.hp < f.max && now - (f.hitAt || 0) > 5000) f.hp = Math.min(f.max, f.hp + dt * 4); continue; }
        f.holder.rotation.y = Math.atan2(att.x - f.x, att.z - f.z); f.pose = "melee";
        if (!(f.next > now)) { f.next = now + 1300 + Math.random() * 500; f.swingAt = now; hurtMonster(att, f, 4 * (0.8 + Math.random() * 0.4) * Math.max(0.3, Math.min(2, (f.power || 10) / (needOf(att) / 4))), "#ffd23f"); }
        continue;
      }
      let foe = null, fd = 1e9;
      for (const m of cur.mons) { if (m.dead || !m.holder) continue; const d = Math.hypot(m.x - f.x, m.z - f.z); if (d < (m.mo.boss ? 13 : caster ? 10 : 8) && d < fd && inSight(R, f, m, caster || m.mo.boss)) { fd = d; foe = m; } }
      // on its guardian stage the party goes for the guardian
      if (S && S.kind === "guardian" && S.f === cur.ri && guard && !guard.dead && guard.holder) { const d = Math.hypot(guard.x - f.x, guard.z - f.z); if (d < 40 && !(foe && foe.mo.minion && fd < 4)) { foe = guard; fd = d; } }
      // a guard of the Warriors' Guild runs to help a miner something has gone for
      if (!foe && f.patrol) for (const m of cur.mons) { if (m.dead || !m.holder || !m.foe || m.foe.role !== "miner") continue; const d = Math.hypot(m.x - f.x, m.z - f.z); if (d < 16 && d < fd && inSight(R, f, m, true)) { fd = d; foe = m; } }
      // a healer looks after the most hurt friend first
      if (f.role === "healer" && !(f.next > now)) {
        const hurt = fighters.filter((o) => o.hp < o.max * 0.7 && Math.hypot(o.x - f.x, o.z - f.z) < 12).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
        if (hurt) {
          f.next = now + 2400; f.castAt = now; f.pose = "cast";
          f.holder.rotation.y = Math.atan2(hurt.x - f.x, hurt.z - f.z);
          const n = Math.round(hurt.max * 0.3), done = () => { hurt.hp = Math.min(hurt.max, hurt.hp + n); if (fx) { fx.heal(scene, { x: hurt.x, y: 0, z: hurt.z }); fx.number(scene, { x: hurt.x, y: 3.9, z: hurt.z }, "+" + n, "#7be08f"); } };
          if (fx && hurt !== f) fx.bolt(scene, { x: f.x, y: 3.2, z: f.z }, { x: hurt.x, y: 1.6, z: hurt.z }, "light", done); else done();
          continue;
        }
      }
      if (foe) {
        const want = caster ? 6 : (foe.mo.boss ? 2.6 : 2.3) * (foe.mo.scale || 1);
        f.holder.rotation.y = Math.atan2(foe.x - f.x, foe.z - f.z);
        if (fd > want + 0.3) {
          let gx = foe.x, gz = foe.z;
          if (!R.hall || !foe.mo.boss) { if (!reach(R, f.x, f.z, foe.x, foe.z)) { const via = viaCell(R, f, foe); if (via) { gx = via.x; gz = via.z; } } }
          const dx = gx - f.x, dz = gz - f.z, dd = Math.hypot(dx, dz) || 1, sp = Math.min(fd - want, 2.2 * dt);
          f.x += (dx / dd) * sp; f.z += (dz / dd) * sp; f.pose = "walk"; f.holder.rotation.y = Math.atan2(dx, dz); f.holder.position.set(f.x, 0, f.z); continue;
        }
        f.pose = caster ? "cast" : "melee";
        if (!(f.next > now)) {
          // each blow counts for as much as the Tickle's strength against what this floor asks of a party of four
          const ratio = Math.max(0.15, Math.min(3, (f.power || 10) / (needOf(foe) / 4)));
          if (caster) {
            // a spell, from the orb of the staff to the foe
            f.next = now + 1800 + Math.random() * 600; f.castAt = now;
            const sch = f.school || "arcane", dmg = (f.role === "healer" ? 5 : 13) * ratio * (0.8 + Math.random() * 0.4), h = f.holder.rotation.y;
            if (fx) fx.bolt(scene, { x: f.x + Math.sin(h) * 0.8, y: 3.4, z: f.z + Math.cos(h) * 0.8 }, { x: foe.x, y: Math.min(2.5, (foe.tall || 3) * 0.6), z: foe.z }, sch, () => hurtMonster(foe, f, dmg, SCH_COL[sch]));
            else hurtMonster(foe, f, dmg);
          } else {
            // a blow: the blade flashes
            f.next = now + 1000 + Math.random() * 500; f.swingAt = now;
            const dmg = 6.5 * ratio * (0.8 + Math.random() * 0.4), h = f.holder.rotation.y, col = f.weapon === "goldsword" ? "#ffd23f" : f.weapon === "orisword" ? "#ff8f6a" : "#ffffff";
            if (fx) fx.slash(scene, { x: f.x + Math.sin(h) * 1.1, y: 1.7, z: f.z + Math.cos(h) * 1.1 }, h, col);
            hurtMonster(foe, f, dmg, col === "#ffffff" ? "#ffd23f" : col);
          }
        }
        continue;
      }
      // out of the fight a while: it gets its breath back
      if (f.hp < f.max && now - (f.hitAt || 0) > 5000) f.hp = Math.min(f.max, f.hp + dt * 4);
      if (f.patrol) {
        // a guard of the Warriors' Guild on its rounds, up and down the main tunnel
        const [tx, ty] = f.patrol[f.pi], gx = R.cx(tx) + 0.9, gz = R.cz(ty) + 0.9, dx = gx - f.x, dz = gz - f.z, d = Math.hypot(dx, dz);
        f.pose = "walk";
        if (d < 0.2) {
          if (f.rest > 0) { f.rest -= dt; f.pose = "guard"; continue; }
          f.pi += f.pdir;
          if (f.pi >= f.patrol.length || f.pi < 0) { f.pdir *= -1; f.pi += f.pdir * 2; f.pi = Math.max(0, Math.min(f.patrol.length - 1, f.pi)); f.rest = 4; }
        } else { const sp = Math.min(d, 1.4 * dt); f.x += (dx / d) * sp; f.z += (dz / d) * sp; f.holder.rotation.y = Math.atan2(dx, dz); }
        f.holder.position.set(f.x, 0, f.z);
        continue;
      }
      if (!f.path) continue;
      // keeping up with its afternoon: a party behind where it should be hurries (out of sight, it is simply there)
      f.hurry = 1;
      if (S && !S.pre && !S.done && S.f === cur.ri && f.door != null) {
        const want = S.kind === "guardian" ? f.door : Math.floor(S.prog * f.door), behind = want - f.pi;
        if (behind > 12 && Math.hypot(f.x - vx, f.z - vz) > 45) { f.pi = Math.max(0, want - 1); const c = f.path[f.pi]; f.x = R.cx(c[0]) + (f.off || 0); f.z = R.cz(c[1]) + (f.off || 0) * 0.6; }
        else if (behind > 3) f.hurry = 2.4;
        // on a floor stage it waits at the guardian's door for its turn
        if (S.kind === "floor" && f.pi >= f.door - 1) { f.pose = "guard"; f.holder.position.set(f.x, 0, f.z); continue; }
      }
      f.pose = "walk";
      if (sealed && f.pi >= f.path.length - 2) {
        // at the guardian's hall with the way down still sealed: go for the guardian
        const ex = guard.x - f.x, ez = guard.z - f.z, ed = Math.hypot(ex, ez);
        if (ed > 3) { const sp = Math.min(ed - 3, 1.8 * dt); f.x += (ex / ed) * sp; f.z += (ez / ed) * sp; }
        f.holder.rotation.y = Math.atan2(ex, ez); f.holder.position.set(f.x, 0, f.z);
        continue;
      }
      const [tx, ty] = f.path[Math.min(f.path.length - 1, f.pi)], gx = R.cx(tx) + (f.off || 0), gz = R.cz(ty) + (f.off || 0) * 0.6;
      const dx = gx - f.x, dz = gz - f.z, d = Math.hypot(dx, dz);
      if (d < 0.2) {
        f.pi++;
        if (f.pi >= f.path.length) {
          // the guardian is beaten and the gate is open: down the stairs (on the last floor, the hoard is theirs)
          f.gone = true; f.holder.visible = false; f.pose = "gone";
          if (!R.last) App.toast(App.nameOf(f.id) + " went down to B" + (cur.ri + 2) + "F.");
          continue;
        }
      } else { const sp = Math.min(d, 1.8 * f.hurry * dt); f.x += (dx / d) * sp; f.z += (dz / d) * sp; f.holder.rotation.y = Math.atan2(dx, dz); }
      f.holder.position.set(f.x, 0, f.z);
    }
    // fighters do not stand inside one another: those too close step apart
    for (let i = 0; i < fighters.length; i++) for (let j = i + 1; j < fighters.length; j++) {
      const a = fighters[i], b = fighters[j];
      if (a.ko || b.ko || a.gone || b.gone || a.role === "miner" || b.role === "miner") continue;
      let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d >= 2.2) continue;
      if (d < 0.01) { dx = Math.random() - 0.5; dz = Math.random() - 0.5; d = Math.hypot(dx, dz); }
      const k = ((2.2 - d) / 2) * Math.min(1, dt * 6);
      a.x -= (dx / d) * k; a.z -= (dz / d) * k; b.x += (dx / d) * k; b.z += (dz / d) * k;
      a.holder.position.x = a.x; a.holder.position.z = a.z; b.holder.position.x = b.x; b.holder.position.z = b.z;
    }
    // the health bars over the fighters
    for (const f of cur.figures) if (f.bar) { f.bar.visible = !f.ko && !f.gone && f.hp < f.max; f.fg.scale.x = Math.max(0.01, f.hp / f.max); f.fg.position.x = -0.6 * (1 - f.hp / f.max); f.bar.rotation.y = -f.holder.rotation.y; }
    if (cur.gate) { const open = !guard || !!guard.dead; if (cur.gate.visible === open) { cur.gate.visible = !open; if (open) App.toast("The gate to the stairs down is open."); } }
    for (const m of cur.mons) {
      if (!m.holder) continue;
      if (R.big && Math.abs(m.x - vx) + Math.abs(m.z - vz) > 110 && !m.foe && !m.dead) continue;
      if (m.mo.minion && !m.dead && now > m.expire) killMonster(m, null);
      if (m.dead) {
        // fallen: it topples and fades into the floor, then another takes its place later (one called up by a guardian is gone for good)
        if (m.mo.minion && now > m.dead) { if (m.holder.parent) m.holder.parent.remove(m.holder); m.removed = true; continue; }
        if (now > m.dead) { m.dead = 0; m.hp = m.max; m.holder.visible = true; m.holder.rotation.z = 0; m.holder.position.y = 0; }
        else { m.holder.rotation.z = Math.min(1.5, m.holder.rotation.z + dt * 3); m.holder.position.y = Math.max(-3, m.holder.position.y - dt * 0.6); if (m.holder.position.y < -2.5) m.holder.visible = false; }
        m.bar.visible = false;
        continue;
      }
      // whom to fight: the nearest fighter in sight
      let tgt = null, td = 1e9;
      const A = m.aggro;
      if (A && now < m.aggroUntil && !A.ko && !A.gone && !A.leaving) { const d = Math.hypot(A.x - m.x, A.z - m.z); if (d < 18) { tgt = A; td = d; } }
      if (!tgt) for (const f of fighters) { if (f.ko || f.gone || f.leaving) continue; const d = Math.hypot(f.x - m.x, f.z - m.z); if (d < (m.mo.boss ? 12 : m.mo.minion ? 18 : 9) && d < td && (m.mo.minion || inSight(R, m, f, true))) { td = d; tgt = f; } }
      m.foe = tgt;
      if (m.mo.boss && (tgt || m.cast || m.dash)) {
        // below a third of its health a guardian is enraged
        if (!m.enraged && m.hp < m.max * 0.34 && fx) { m.enraged = true; fx.label(scene, { x: m.x, y: (m.tall || 3) + 2, z: m.z }, "Enraged!", "#ff4a3a"); fx.burst(scene, { x: m.x, y: 1.5, z: m.z }, "#ff4a3a", 30, 0.2); if (m.fg) m.fg.material.color.set(0xff2a2a); }
        if (m.nextSpecial == null) m.nextSpecial = now + 2500;
        if (!m.cast && !m.dash && tgt && td < 14 && now > m.nextSpecial) startSpecial(R, m, tgt, fighters, now);
        if (m.cast || m.dash) { runSpecial(R, m, fighters, dt, now); m.bar.visible = true; m.fg.scale.x = Math.max(0.01, m.hp / m.max); m.fg.position.x = -(m.barW || 1.6) / 2 * (1 - m.hp / m.max); m.bar.rotation.y = -m.holder.rotation.y; continue; }
      }
      if (tgt) {
        const reachM = (m.mo.boss ? 3.2 : 2.5) * Math.max(1, (m.mo.scale || 1) * 0.8);
        m.h = turnTo(m.h, Math.atan2(tgt.x - m.x, tgt.z - m.z), dt * 5);
        if (td > reachM) {
          // round a corner by way of the open cell between (a guardian's hall is open all through)
          let gx = tgt.x, gz = tgt.z;
          if (!m.mo.minion && !reach(R, m.x, m.z, tgt.x, tgt.z)) { const via = viaCell(R, m, tgt); if (via) { gx = via.x; gz = via.z; } }
          // in a fight even the slow ones close in (a summoned one fastest)
          const dx = gx - m.x, dz = gz - m.z, dd = Math.hypot(dx, dz) || 1, sp = Math.min(td - reachM, Math.max(m.mo.minion ? 2.6 : 1.8, (SPEED[m.mo.k] || 1.2) * 1.3) * dt);
          m.x += (dx / dd) * sp; m.z += (dz / dd) * sp;
        }
        else if (!(m.nextHit > now)) {
          // a blow; or, from a guardian now and then, a shockwave that hits everyone close
          m.nextHit = now + (m.mo.boss ? (m.enraged ? 1100 : 1700) : 1900 + Math.random() * 800); m.lungeAt = now;
          const weak = weakTo(m, tgt);
          hurtFighter(tgt, (m.mo.boss ? 12 : m.mo.minion ? 4 : 6) * weak * (0.8 + Math.random() * 0.4));
          if (m.mo.boss && fx) fx.slash(scene, { x: m.x + Math.sin(m.h) * 2, y: 1.6, z: m.z + Math.cos(m.h) * 2 }, m.h, m.enraged ? "#ff4a3a" : "#ffb070");
        }
        const l = m.lungeAt && now - m.lungeAt < 300 ? Math.sin(((now - m.lungeAt) / 300) * Math.PI) * 0.8 : 0;
        m.holder.rotation.y = m.h;
        m.holder.position.set(m.x + Math.sin(m.h) * l, 0, m.z + Math.cos(m.h) * l);
      } else {
        // on patrol, back and forth along its stretch of corridor; the guardian keeps watch over its hall
        const path = m.mo.path, [tx, ty] = path[m.i];
        let gx = R.cx(tx), gz = R.cz(ty);
        if (m.mo.boss && R.hall) {
          // it walks to a spot in its hall, stops there a while facing the way in, then moves on
          const Hh = R.hall;
          if (m.rest > 0) { m.rest -= dt; m.h = turnTo(m.h, Math.atan2(Hh.door.x - m.x, Hh.door.z - m.z), dt * 1.5); m.holder.rotation.y = m.h; m.holder.position.set(m.x, 0, m.z); m.bar.visible = m.hp < m.max; continue; }
          if (!m.spot) m.spot = { x: Hh.x0 + Hh.size * (0.2 + Math.random() * 0.6), z: Hh.z0 + Hh.size * (0.2 + Math.random() * 0.6) };
          gx = m.spot.x; gz = m.spot.z;
        }
        const dx = gx - m.x, dz = gz - m.z, d = Math.hypot(dx, dz), sp = (SPEED[m.mo.k] || 1.2) * (m.mo.boss ? 0.6 : 1) * dt;
        if (d < 0.15) {
          if (m.mo.boss && R.hall) { m.spot = null; m.rest = 3 + Math.random() * 5; }
          else { m.i += m.dir; if (m.i >= path.length || m.i < 0) { m.dir *= -1; m.i += m.dir * 2; m.i = Math.max(0, Math.min(path.length - 1, m.i)); } }
        } else { m.x += (dx / d) * Math.min(d, sp); m.z += (dz / d) * Math.min(d, sp); m.h = m.mo.boss ? turnTo(m.h, Math.atan2(dx, dz), dt * 2) : Math.atan2(dx, dz); }
        m.holder.rotation.y = m.h;
        const hov = m.mo.k === "shadebat" || m.mo.k === "harpy" ? 1.6 + Math.sin(now / 200 + m.x) * 0.3 : m.mo.k === "wraith" ? 0.6 + Math.sin(now / 600 + m.x) * 0.25 : 0;
        m.holder.position.set(m.x, hov + (m.mo.k === "gloomslime" ? Math.abs(Math.sin(now / 250 + m.x)) * 0.15 : 0), m.z);
        if (now - (m.hit || 0) > 4000 && m.hp < m.max && m.floorHP == null) m.hp = Math.min(m.max, m.hp + dt * 10);
      }
      // alive, not a statue: a swagger from side to side and a bob in its stride while it moves, slow breathing when
      // it stands, leaning into a blow, sinking when it falls
      if (m.body) {
        const B = m.body, k0 = m.bodyScale, moving = Math.hypot(m.x - (m.px == null ? m.x : m.px), m.z - (m.pz == null ? m.z : m.pz)) > dt * 0.2;
        m.px = m.x; m.pz = m.z;
        m.gait = (m.gait || 0) + dt * (moving ? 9 : 0);
        const flier = m.mo.k === "shadebat" || m.mo.k === "harpy" || m.mo.k === "wraith", br = Math.sin(now / 700 + m.seed);
        const lunge = m.lungeAt && now - m.lungeAt < 300 ? Math.sin(((now - m.lungeAt) / 300) * Math.PI) : 0;
        B.rotation.z = moving && !flier ? Math.sin(m.gait) * 0.07 : flier ? Math.sin(now / 180 + m.seed) * 0.12 : 0;
        B.rotation.x = -0.25 * lunge + (moving ? 0.04 : 0);
        B.position.y = moving && !flier ? Math.abs(Math.sin(m.gait)) * 0.12 * (m.mo.scale || 1) : 0;
        B.scale.set(k0 * (1 - 0.012 * br), k0 * (1 + 0.025 * br + (moving ? 0 : 0)), k0 * (1 - 0.012 * br));
        if (m.dead) B.position.y -= 0.02;
      }
      m.bar.visible = m.hp < m.max;
      m.fg.scale.x = Math.max(0.01, m.hp / m.max); m.fg.position.x = -(m.barW || 1.6) / 2 * (1 - m.hp / m.max);
      m.bar.rotation.y = -m.holder.rotation.y;
    }
    if (cur.mons.some((m) => m.removed)) cur.mons = cur.mons.filter((m) => !m.removed);
    // carts rolling along the rails of a mine, stopping at each end to load and unload
    for (const c of cur.carts || []) {
      if (c.path.length < 2) continue;
      const [tx, ty] = c.path[c.i], gx = R.cx(tx), gz = R.cz(ty), dx = gx - c.x, dz = gz - c.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { if (c.wait > 0) { c.wait -= dt; continue; } c.i += c.dir; if (c.i >= c.path.length || c.i < 0) { c.dir *= -1; c.i += c.dir * 2; c.i = Math.max(0, Math.min(c.path.length - 1, c.i)); c.wait = 3; } }
      else { const sp = Math.min(d, 2.6 * dt); c.x += (dx / d) * sp; c.z += (dz / d) * sp; c.holder.rotation.y = Math.atan2(dx, dz); }
      c.holder.position.set(c.x, 0, c.z);
    }
  }
  function pose(f, now) {
    const A = f.F.arms, s = Math.sin(now / 260 + f.id);
    if (f.pose === "sleep") { if (f.lieY == null) f.lieY = f.F.pivot.position.y; f.F.pivot.position.y = f.lieY + Math.abs(Math.sin(now / 900 + f.id)) * 0.04; /* breathing, from where it was laid */ if (A) { A.R.rotation.z = 0.5; A.L.rotation.z = -0.5; } return; }
    if (!A) return;
    A.R.rotation.z = 0; A.L.rotation.z = 0;
    if (f.pose !== "dig" && f.pose !== "ko") { f.F.pivot.rotation.x = 0; f.F.pivot.position.y = 0; }
    if (f.pose === "eat") { A.R.rotation.x = -1.1 + s * 0.35; A.L.rotation.x = -0.3; }
    else if (f.pose === "dig") { A.R.rotation.x = A.L.rotation.x = -1.6 + Math.sin(now / 200 + f.id) * 0.9; f.F.pivot.rotation.x = 0.2 + Math.max(0, Math.sin(now / 200 + f.id)) * 0.2; }
    else if (f.pose === "melee" || f.pose === "fight") {
      // a swing: the arm goes up and comes down hard
      const k = f.swingAt ? Math.max(0, 1 - (now - f.swingAt) / 350) : 0;
      // (one arm swings the weapon; the other comes up only when it carries a shield)
      A.R.rotation.x = k > 0 ? -2.6 + (1 - k) * 2.2 : -0.9 + Math.sin(now / 300 + f.id) * 0.1; A.L.rotation.x = f.shield ? -1.0 : -0.12;
      f.F.pivot.rotation.x = k * 0.15; f.F.pivot.position.y = Math.abs(Math.sin(now / 240 + f.id)) * 0.06;
    } else if (f.pose === "cast") {
      // the staff raised, both paws up as the spell goes
      const k = f.castAt ? Math.max(0, 1 - (now - f.castAt) / 500) : 0;
      A.R.rotation.x = -1.8 - k * 0.9; A.L.rotation.x = -1.2 - k * 1.2; A.R.rotation.z = 0.2; A.L.rotation.z = -0.2;
      f.F.pivot.position.y = k * 0.15;
    } else if (f.pose === "guard") { A.R.rotation.x = -0.6; A.L.rotation.x = f.shield ? -0.8 : -0.1; }
    else if (f.pose === "cower") { A.R.rotation.x = A.L.rotation.x = -2.7; f.F.pivot.position.y = -0.2; }
    else if (f.pose === "seat") { const c = (now / 3000 + f.id * 0.137) % 1; A.R.rotation.x = c < 0.08 ? -2.7 : -0.25; A.L.rotation.x = -0.25; f.F.pivot.position.y = -0.15; } // a minister in its seat, a paw up now and then
    else if (f.pose === "cards") { const c = (now / 2400 + f.id * 0.17) % 1; A.R.rotation.x = c < 0.15 ? -1.6 : -1.05; A.L.rotation.x = -1.05; }
    else if (f.pose === "deal") { A.R.rotation.x = -1.2 + Math.sin(now / 260 + f.id) * 0.35; A.L.rotation.x = -1.0; }
    else if (f.pose === "slots") { const c = (now / 3200 + f.id * 0.21) % 1; A.R.rotation.x = c < 0.12 ? -2.4 + (c / 0.12) * 1.8 : -0.9; A.L.rotation.x = -0.9; }
    else if (f.pose === "drink") { const c = (now / 2800 + f.id * 0.17) % 1; A.R.rotation.x = c < 0.2 ? -2.3 : -1.0; A.L.rotation.x = -0.8; }
    else if (f.pose === "serve") { A.R.rotation.x = -1.35; A.L.rotation.x = -0.2; }
    else if (f.pose === "stun") { A.R.rotation.x = A.L.rotation.x = -0.5; A.R.rotation.z = 0.5; A.L.rotation.z = -0.5; f.F.pivot.position.y = Math.sin(now / 35) * 0.03; }
    else if (f.pose === "ko") { f.F.pivot.rotation.x = -1.45; f.F.pivot.position.y = 0.35; A.R.rotation.x = A.L.rotation.x = 0; }
    else if (f.pose === "walk") { const w = Math.sin(now / 140 + f.id); A.R.rotation.x = w * 0.6; A.L.rotation.x = -w * 0.6; f.F.pivot.position.y = Math.abs(w) * 0.12; }
    // a hit makes it flinch
    if (f.hitAt && now - f.hitAt < 200 && !f.ko) f.F.pivot.rotation.x = -0.2;
  }

  // ---------- the heads-up panel: where you are and the numbered ways out ----------
  function hud(map, ri, who) {
    const R = map.rooms[ri], el = document.getElementById("roomHud");
    if (!el) return;
    if (cur) cur.who = who;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    el.hidden = false;
    el.innerHTML = '<div class="rh-title">' + esc(map.title) + '</div><div class="rh-room">' + esc(R.name) + ((map.floors || map.rooms.length) > 1 ? " &middot; " + (map.floors ? "floor " : "room ") + (ri + 1) + " of " + (map.floors || map.rooms.length) : "") + "</div>" +
      (R.note ? '<div class="rh-note">' + esc(R.note) + "</div>" : "") +
      (R.boss ? '<div class="rh-note"><b>Guardian:</b> ' + esc(R.boss.name) + (cur && cur.mons && cur.mons.some((m) => m.mo.boss && m.dead) ? " (beaten! it will rise again)" : "") +
        (map.floors && st.guardians ? (st.guardians[ri] ? " \u00b7 first beaten by " + (st.guardians[ri].chosen ? "the Maker's Chosen" : esc(App.placeName(st.guardians[ri].village, st.guardians[ri].vname))) : " \u00b7 never beaten" + (App.guardianNeed ? " (a party needs about " + Math.round(App.guardianNeed(ri)) + " strength)" : "")) : "") + "</div>" : "") +
      (map.floors && App.bandLoot ? '<div class="rh-note"><b>Treasure:</b> ' + esc(App.bandLoot(ri)) + " in the chests and the veins" + (App.RELICS ? "; relics: " + esc(Object.values(App.RELICS).filter((x) => x.band === Math.floor(ri / 6)).map((x) => x.name).join(", ")) : "") + "</div>" : "") +
      (R.big ? (() => { const k = Math.min(240 / R.maze.W, 200 / R.maze.H, 4); return '<canvas id="roomMap" width="' + Math.round(R.maze.W * k) + '" height="' + Math.round(R.maze.H * k) + '" title="The whole floor: click to look there"></canvas>'; })() : "") +
      (R.maze ? '<div class="rh-note">' + (R.mons.length ? R.mons.length + " monster" + (R.mons.length > 1 ? "s" : "") + " on this floor" : "") + (R.items.some((i) => i.chest) ? " \u00b7 " + R.items.filter((i) => i.chest && !i.v).length + " treasure chest" + (R.items.filter((i) => i.chest && !i.v).length === 1 ? "" : "s") + " still closed" : "") + " \u00b7 drag to look around the floor</div>" : "") +
      (map.target.kind === "casino" && App.casinoTables ? (() => {
        const Cs = map.target.casino, R = App.casinoTour(Cs), TT = App.CASINO_TOUR, tabs = App.casinoTables(Cs).filter((t) => t.def.room === ri);
        const tour = ri <= 1 ? '<div class="rh-note"><b>Poker tournament:</b> ' + (R.done ? (R.cancelled ? "called off tonight (too few players)" : "won tonight by " + esc(App.nameOf(R.winner))) : R.started ? R.alive.size + " of " + R.n + " players left, level " + (R.level + 1) : "tonight at 20:30 in the poker room, buy-in " + TT.buyin + " shells, " + R.reg.size + " entered") + (ri === 0 ? ' <button class="btn" style="font-size:11.5px;padding:2px 8px" data-ctable="tour0">' + (R.started && !R.done ? "Watch" : "Enter / see it") + "</button>" : "") + "</div>" : "";
        const slots = ri === 0 ? '<div class="rh-note"><b>Slot machines:</b> ' + Math.min((Cs.spectators || []).length, 51) + ' guests playing <button class="btn primary" style="font-size:11.5px;padding:2px 10px" data-cslot="1">Play a machine</button></div>' : "";
        return slots + tour + (tabs.length ? '<div class="rh-note"><b>The tables</b> (click one to watch it, or to play):</div><div class="rh-warps">' + tabs.map((t) => '<button class="btn" style="font-size:11.5px;padding:3px 9px" data-ctable="' + t.key + '">' + esc(t.def.tour ? "Tournament " + (t.n + 1) : App.CASINO_GAMES[t.kind] + (t.kind !== "bingo" ? " " + (t.n + 1) : "")) + " \u00b7 " + t.seats.filter(Boolean).length + "/" + t.seats.length + "</button>").join("") + "</div>" : "");
      })() : "") +
      '<div class="rh-note">' + (map.target.kind === "casino" ? (who.length ? (() => { const g = who.filter((o) => !o.staff).length, d = who.filter((o) => o.staff).length; return g + (g === 1 ? " guest" : " guests") + (d ? " and " + d + (d === 1 ? " dealer" : " dealers") : "") + " in here."; })() : (() => { const m = st.T % 1440; return m >= 19 * 60 && m < 23 * 60 + 30 ? "Nobody in this room right now." : "Nobody in here right now: the casino opens at 19:00."; })()) : who.length ? esc(who.slice(0, 10).map((o) => App.nameOf(o.id) + " (" + (o.pose === "fight" ? roleWord(o.id) : { sleep: "asleep", eat: "having a meal", dig: "mining", cower: "hiding", seat: "minister", guard: "on guard, Warriors' Guild", stand: App.guildRankName ? App.guildRankName(o.id) : "member" }[o.pose]) + ")").join(", ") + (who.length > 10 ? " and " + (who.length - 10) + " more" : "")) : "Nobody in here right now.") + "</div>" +
      (map.floors && App.liveParties ? (() => { const L = App.liveParties(); return L.length ? '<div class="rh-note"><b>Fighting down here now</b> (click to watch):</div><div class="rh-warps">' + L.slice(0, 5).map((x) => '<button class="btn" style="font-size:11.5px;padding:3px 9px" data-watch="' + esc(x.key) + '">' + esc(App.partyName(x.p)) + " \u00b7 B" + (x.S.f + 1) + "F" + (x.S.kind === "guardian" ? " \u2694 " + esc(GUARDIANS[x.S.f].name) : "") + "</button>").join("") + (L.length > 5 ? '<span class="note" style="align-self:center">and ' + (L.length - 5) + " more parties</span>" : "") + "</div>" : ""; })() : "") +
      (map.floors ? '<div class="rh-warps"><button class="btn" data-floor="up" ' + (ri === 0 ? "disabled" : "") + ' title="One floor up">&#9650;</button><select id="floorSel" aria-label="Go to floor">' +
        Array.from({ length: map.floors }, (_, f) => { const n = App.villages.filter((v) => ((st.depth && st.depth[v.i]) || 0) >= f).length; return '<option value="' + f + '"' + (f === ri ? " selected" : "") + ">B" + (f + 1) + "F \u00b7 " + esc(GUARDIANS[f].name) + (f === 0 ? "" : n ? " \u00b7 reached by " + n + " village" + (n === 1 ? "" : "s") : " \u00b7 nobody has been here") + "</option>"; }).join("") +
        '</select><button class="btn" data-floor="down" ' + (ri === map.floors - 1 ? "disabled" : "") + ' title="One floor down">&#9660;</button></div>' : "") +
      (R.warps.filter((w) => w.to.outside).length > 3
        ? '<div class="rh-warps"><select id="exitSel" aria-label="Way out">' + R.warps.filter((w) => w.to.outside).map((w) => '<option value="' + w.id + '"' + (cur && cur.map.target.dg && w.to.dg === cur.map.target.dg.i ? " selected" : "") + ">" + esc(w.label) + "</option>").join("") + '</select><button class="btn primary" data-warp="exit">Leave</button>' +
          R.warps.filter((w) => !w.to.outside).map((w) => '<button class="btn" data-warp="' + w.id + '">' + esc(w.label) + "</button>").join("") + "</div>"
        : '<div class="rh-warps">' + R.warps.map((w) => '<button class="btn' + (w.to.outside ? " primary" : "") + '" data-warp="' + w.id + '">' + w.id + ". " + esc(w.label) + "</button>").join("") + "</div>");
  }
  // what a fighter does in a fight
  function roleWord(id) {
    const r = App.combatRole ? App.combatRole(id) : null, s = App.mageSchool ? App.mageSchool(id) : null;
    if (r === "mage") return "mage: " + (App.SPELLS && App.SPELLS[s] ? App.SPELLS[s].name : "spells");
    if (r === "healer") return "healer: Healing Light";
    return r === "tamer" ? "fighting with its creature" : "warrior";
  }
  // the map of a big floor: the ways out (green), the stairs and its guardian (gold, red), the party (blue), where you are looking (white)
  function drawFloorMap() {
    const c = document.getElementById("roomMap");
    if (!c || !cur) return;
    const R = cur.map.rooms[cur.ri], x = c.getContext("2d"), sx = c.width / R.maze.W, sy = c.height / R.maze.H;
    // the maze itself is drawn once: floor in its colour, the walls as lines
    if (!R.mapBase || R.mapBase.width !== c.width) {
      const b = (R.mapBase = document.createElement("canvas")); b.width = c.width; b.height = c.height;
      const y = b.getContext("2d");
      y.fillStyle = "#0b0b10"; y.fillRect(0, 0, b.width, b.height);
      y.fillStyle = R.look.floor[0];
      for (const [i, j] of R.cells) y.fillRect(i * sx, j * sy, Math.ceil(sx), Math.ceil(sy));
      y.fillStyle = R.look.wall;
      for (const [i, j] of R.cells) {
        if (!openTo(R.maze, i, j, 1, 0)) y.fillRect((i + 1) * sx - 1, j * sy, 1, Math.ceil(sy));
        if (!openTo(R.maze, i, j, 0, 1)) y.fillRect(i * sx, (j + 1) * sy - 1, Math.ceil(sx), 1);
        if (!R.maze.seen.has(i - 1 + "," + j)) y.fillRect(i * sx, j * sy, 1, Math.ceil(sy));
        if (!R.maze.seen.has(i + "," + (j - 1))) y.fillRect(i * sx, j * sy, Math.ceil(sx), 1);
      }
    }
    x.drawImage(R.mapBase, 0, 0);
    const dot = (px, pz, col, r) => { x.fillStyle = col; x.beginPath(); x.arc(((px + R.w / 2) / R.w) * c.width, ((pz + R.d / 2) / R.d) * c.height, r, 0, 6.283); x.fill(); };
    for (const w of R.warps) dot(w.x, w.z, w.to.outside ? "#3cbf6c" : w.down ? "#ffd23f" : "#8fd3f4", 3);
    for (const m of cur.mons || []) if (m.mo.boss && !m.dead) dot(m.x, m.z, "#ff4a3a", 3.5);
    for (const f of cur.figures) if (f.x != null && !f.gone) dot(f.x, f.z, "#2f8fe0", 2.5);
    if (cur.view) { x.strokeStyle = "#ffffff"; x.lineWidth = 1.5; const vx = ((cur.view.x + R.w / 2) / R.w) * c.width, vz = ((cur.view.z + R.d / 2) / R.d) * c.height; x.strokeRect(vx - 8, vz - 6, 16, 12); }
  }
  // straight to any floor of the Great Underworld (the view only: Tickles still have to beat each guardian)
  function goFloor(f, at) {
    if (!cur || !cur.map.floors) return;
    f = Math.max(0, Math.min(cur.map.floors - 1, f));
    fade(() => {
      build(cur.map, f);
      const R = cur.map.rooms[f], W = R.warps[0];
      cur.focus = at || { x: W ? W.x : 0, z: W ? W.z : 0 }; cur.lastT = null;
      App.cam.target.x = cur.worldCam.x; App.cam.target.z = cur.worldCam.z;
    });
  }
  App.goFloor = goFloor;
  // watch a party: down to the floor where it is now, looking at it (or at the guardian's hall when it is fighting the guardian)
  App.watchParty = (key) => {
    const p = st.parties && st.parties[key], S = p && App.partyStage ? App.partyStage(p, st.T) : null;
    if (!S || S.pre || S.done) { App.toast(!p ? "That party is not down there." : S && S.pre ? App.partyName(p) + " has not gone down yet." : App.partyName(p) + " is back up already."); return; }
    const dg = App.dungeons[p.dungeon] || App.dungeons[0], T = { kind: "dungeon", dg, door: dg.door }, map = App.mapOf(T), R = map.floor(S.f);
    let at;
    if (S.kind === "guardian" && R.hall) at = { x: R.hall.x0 + R.hall.size / 2, z: R.hall.z0 + R.hall.size / 2 };
    else { const sp = stageSpot(R, { party: key, j: 0, dg: S.f === 0 ? p.dungeon : null }), c = sp.path[sp.pi]; at = { x: R.cx(c[0]), z: R.cz(c[1]) }; }
    for (const id of ["placeCard", "doorChip"]) { const el = document.getElementById(id); if (el) el.hidden = true; }
    if (cur && cur.map === map) { cur.watch = key; cur.followed = S.f; cur.follow = true; App.cam.radius = 26; App.cam.phi = 0.8; return goFloor(S.f, at); }
    if (cur) { scene.remove(cur.group); cur = null; App.inside = null; }
    App.enter(T, { floor: S.f, at, watch: key });
  };
  document.addEventListener("change", (e) => { if (e.target && e.target.id === "floorSel") goFloor(+e.target.value); });
  document.addEventListener("click", (e) => {
    const fb = e.target.closest("[data-floor]");
    if (fb && cur) { goFloor(cur.ri + (fb.dataset.floor === "up" ? -1 : 1)); return; }
    const mapEl = e.target.closest("#roomMap");
    if (mapEl && cur) {
      const R = cur.map.rooms[cur.ri], rc = mapEl.getBoundingClientRect(), u = (e.clientX - rc.left) / rc.width, v = (e.clientY - rc.top) / rc.height;
      const C = App.cam, w = cur.worldCam;
      C.target.x = w.x + (u - 0.5) * R.w - cur.focus.x; C.target.z = w.z + (v - 0.5) * R.d - cur.focus.z;
      return;
    }
    const b = e.target.closest("[data-warp]");
    if (!b || !cur) return;
    const ws = cur.map.rooms[cur.ri].warps, w = b.dataset.warp === "exit" ? ws[+document.getElementById("exitSel").value] : ws[+b.dataset.warp];
    if (w) take(w);
  });
  function take(w) {
    fade(() => {
      if (w.to.outside) return leave(w.to.door);
      build(cur.map, w.to.room);
      const ws = cur.map.rooms[w.to.room].warps, W = w.to.warp === "down" ? ws.find((x) => x.down) : ws[w.to.warp];
      cur.focus = cur.map.maze ? { x: W ? W.x : 0, z: W ? W.z : 0 } : { x: W ? W.x * 0.4 : 0, z: W ? W.z * 0.3 : 0 };
      App.cam.target.x = cur.worldCam.x; App.cam.target.z = cur.worldCam.z;
    });
  }
  function fade(fn) {
    const f = document.getElementById("roomFade");
    if (!f) return fn();
    f.style.opacity = 1;
    setTimeout(() => { fn(); setTimeout(() => (f.style.opacity = 0), 60); }, 220);
  }

  // ---------- going in and coming out ----------
  App.enter = (T, opt) => {
    if (!T) return;
    const map = App.mapOf(T), C = App.cam;
    fade(() => {
      cur = { map, ri: 0, worldCam: { x: C.target.x, z: C.target.z, r: C.radius, theta: C.theta, phi: C.phi }, focus: { x: 0, z: 0 }, watch: opt && opt.watch, followed: opt && opt.floor };
      C.follow = null; C.fly = null;
      C.radius = map.maze ? (opt ? 26 : 30) : T.kind === "casino" ? 52 : T.kind === "parliament" ? 50 : 20; C.phi = map.maze ? (opt ? 0.8 : 0.75) : 0.95; C.theta = 0;
      App.inside = cur;
      build(map, (opt && opt.floor) || 0);
      // in an Underworld you arrive at the foot of the cave you came down (or, watching a party, right where it is)
      const ws = map.rooms[cur.ri].warps, W0 = (T.dg != null && ws.find((w) => w.to.dg === T.dg.i)) || ws[0];
      if (opt && opt.at) cur.focus = opt.at;
      else if (map.maze && W0) cur.focus = { x: W0.x, z: W0.z - (map.big ? 0 : 6) };
      App.sfx && App.sfx.bell && App.sfx.bell(1);
    });
  };
  function leave(door) {
    if (!cur) return;
    const w = cur.worldCam, T = cur.map.target, C = App.cam;
    if (door) T.door = door; // out by the other cave
    scene.remove(cur.group);
    cur = null; App.inside = null;
    const el = document.getElementById("roomHud"); if (el) el.hidden = true;
    // back outside, in front of the door you came in by
    C.target.x = T.door.x; C.target.z = T.door.z; C.radius = Math.min(w.r, 30); C.theta = w.theta; C.phi = w.phi;
  }
  App.leaveInterior = () => fade(() => leave());
  // what is under the cursor inside (inspect.js): a Tickle, a monster, or a piece of furniture or of the cave
  App.insidePick = (ndc) => {
    if (!cur) return null;
    const rc = App.renderer.domElement.getBoundingClientRect(), W = rc.width, H = rc.height, sx = ((ndc.x + 1) / 2) * W, sy = ((1 - ndc.y) / 2) * H, P = new THREE.Vector3();
    let best = null, bd = 1e9;
    const consider = (o, x, y, z, r, bias) => { P.set(x, y, z).project(cam); if (P.z > 1) return; const d = Math.hypot(((P.x + 1) / 2) * W - sx, ((1 - P.y) / 2) * H - sy); if (d < r && d + bias < bd) { bd = d + bias; best = o; } };
    for (const f of cur.figures) if (!f.gone && f.holder) consider({ kind: "tickle", id: f.id, pose: f.pose }, f.holder.position.x, (f.F.height || 3) * 0.5, f.holder.position.z, 34, 0);
    for (const m of cur.mons || []) if (m.holder && !m.dead) consider({ kind: "umonster", m, room: cur.map.rooms[cur.ri] }, m.holder.position.x, (m.tall || 2) * 0.5, m.holder.position.z, m.mo.boss ? 70 : 36, 1);
    const R = cur.map.rooms[cur.ri];
    if (R) for (const it of R.items) consider({ kind: "item", it, room: R, map: cur.map }, it.x, (it.y || 0) + 0.8, it.z, 24, 10);
    // nothing in particular: the floor or the walls, so the room itself
    return best || (R ? { kind: "room", room: R, map: cur.map, ri: cur.ri, mons: cur.mons || [] } : null);
  };
  App.MON_NAME = MON_NAME;
  // drawn instead of the world while inside; the view orbits and zooms as usual, and a drag pans within the room
  App.renderInside = (renderer, camera) => {
    const C = App.cam, R = cur.map.rooms[cur.ri], w = cur.worldCam;
    if (cur.watch && cur.follow !== false && R.maze) {
      if (cur.lastT && Math.hypot(C.target.x - cur.lastT.x, C.target.z - cur.lastT.z) > 0.05) cur.follow = false;
      else {
        const mine = cur.figures.filter((f) => f.party === cur.watch && !f.gone && f.x != null);
        if (mine.length) {
          const mx = mine.reduce((a, f) => a + f.x, 0) / mine.length, mz = mine.reduce((a, f) => a + f.z, 0) / mine.length, t = performance.now();
          const k = Math.min(1, ((t - (cur.last || t)) / 1000) * 2.5), vx0 = C.target.x - w.x + cur.focus.x, vz0 = C.target.z - w.z + cur.focus.z;
          C.target.x += (mx - vx0) * k; C.target.z += (mz - vz0) * k;
        }
      }
    }
    const px = Math.max(-R.w / 2, Math.min(R.w / 2, C.target.x - w.x + cur.focus.x)), pz = Math.max(-R.d / 2, Math.min(R.d / 2, C.target.z - w.z + cur.focus.z));
    C.target.x = w.x + px - cur.focus.x; C.target.z = w.z + pz - cur.focus.z;
    cur.lastT = { x: C.target.x, z: C.target.z };
    const r = Math.max(6, Math.min(R.maze ? 70 : 45, C.radius)), phi = Math.max(0.35, Math.min(1.35, C.phi));
    cur.view = { x: px, z: pz };
    cam.aspect = camera.aspect; cam.updateProjectionMatrix();
    cam.position.set(px + r * Math.sin(phi) * Math.sin(C.theta), 1.5 + r * Math.cos(phi), pz + r * Math.sin(phi) * Math.cos(C.theta));
    cam.lookAt(px, 1.5, pz);
    const now = performance.now(), dtm = Math.min(0.1, (now - (cur.last || now)) / 1000) * Math.max(0.25, Math.min(2, st.speed || 0.25));
    cur.last = now;
    stepMaze(dtm, now);
    if ((R.maze || cur.map.target.kind === "casino") && now - cur.refreshT > 1200) { cur.refreshT = now; refreshFigures(); }
    if (cur.cv && App.casinoFrame) App.casinoFrame(cur, dtm);
    for (const f of cur.figures) pose(f, now);
    // the pool of lights goes to the torches nearest the view; the floor map follows
    if (cur.lightItems && now - cur.poolT > 400) {
      cur.poolT = now;
      const near = cur.lightItems.slice().sort((a, b) => Math.abs(a.x - px) + Math.abs(a.z - pz) - (Math.abs(b.x - px) + Math.abs(b.z - pz))).slice(0, cur.lights.length);
      cur.lights.forEach((L, i) => { const it = near[i]; if (it) L.position.set(it.x, 3.2, it.z + 0.8); else L.position.set(0, -50, 0); });
      drawFloorMap();
    }
    for (const L of cur.lights) L.intensity = 1.1 + Math.sin(now / 90 + L.position.x) * 0.15;
    // rock walls: the stones near the view, plain blocks further off
    if ((cur.rockAreas || cur.itemAreas) && now - (cur.rockLodT || 0) > 250) {
      cur.rockLodT = now;
      // the things on the floor: not drawn when far from the view (they are too small to see from there)
      const reach = Math.max(40, r * 0.9);
      for (const A of cur.itemAreas || []) A.m.visible = Math.abs(A.cx - px) < reach && Math.abs(A.cz - pz) < reach;
      const close = r < 52;
      for (const A of cur.rockAreas || []) {
        const near = close && Math.abs(A.cx - px) < 34 && Math.abs(A.cz - pz) < 34 && A.rock.length === new Set(A.segs.map((s) => s.v)).size;
        for (const m of A.rock) m.visible = near;
        A.box.visible = !near || A.keepBox;
      }
    }
    if (cur.group && !R.maze) for (const o of cur.group.children) if (o.userData.mon) o.position.y = Math.abs(Math.sin(now / 300 + o.position.x)) * 0.2;
    renderer.render(scene, cam);
  };
})();
