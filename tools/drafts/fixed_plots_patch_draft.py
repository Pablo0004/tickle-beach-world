# DRAFT (not applied yet): first half of the fixed-plots redesign of js/geo.js (see PENDING.md, item 11).
# It replaces the per-holder settlement plan with fixed plots and a remembered assignment.
# The second half (houses generated last, renumbering, save reconciliation, underground warrens) is still to write.
import os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "js", "geo.js")
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:100]
    s = s.replace(a, b, 1)

# ---------- 1. the plots (fixed) and who lives on them (from the ownership snapshot, remembered between updates) ----------
a0 = s.index("  // ---------- who lives where: the holders' places ----------")
a1 = s.index("  App.buildWorld = (residentsByFloor, clanOf) => {")
s = s[:a0] + """  // ---------- the plots, and who lives on them ----------
  // The land is laid out in plots that never move: in every region estate plots of set sizes, mansion plots and
  // town plots (with room to spare). Who lives on each comes from the ownership snapshot, and the assignment is
  // remembered in the save: when ownership changes, everyone who still fits keeps their plot; only those who
  // bought or sold enough to change size move, newcomers take a free plot (marked for sale), and plots left
  // empty go back up for sale. Estates from 20 Tickles (the holder's manor and a house for each Tickle),
  // mansions from 5 to 19 (all under one roof, bigger the more of them), and small holders (1 to 4) a house
  // each for their household in towns shared with others.
  const ESTATE = 20, MANSION = 5, TOWN = 36, BURN = "0x000000000000000000000000000000000000dead";
  App.SETTLE = { ESTATE, MANSION };
  const ESTATE_CAPS = [400, 170, 120, 90, 70, 60, 50, 44, 38, 34, 30, 28, 26, 24, 24, 22, 22, 22];
  const MANSION_LOTS = 48, TOWN_LOTS = 13;
  const lotR = (cls, cap) => (cls === "estate" ? Math.round(4.7 * Math.sqrt(16 + cap * 1.1)) + 6 : cls === "mansion" ? 22 : 46);
  function lotPlan() {
    return regions.map(() => {
      const list = ESTATE_CAPS.map((cap) => ({ cls: "estate", cap }));
      for (let k = 0; k < TOWN_LOTS; k++) list.push({ cls: "town", cap: TOWN });
      for (let k = 0; k < MANSION_LOTS; k++) list.push({ cls: "mansion", cap: ESTATE - 1 });
      for (const L of list) L.R = lotR(L.cls, L.cap) + (L.cls === "mansion" ? 4 : 4);
      return list.sort((a, b) => b.R - a.R);
    });
  }
  // the holders in the snapshot: an estate, a mansion, or a small household
  function ownerGroups() {
    const N = TB.SUPPLY, groups = new Map();
    for (let id = 0; id < N; id++) {
      const o = App.ownerOf ? App.ownerOf(id) : null, key = !o || o === BURN ? "lone:" + id : o;
      (groups.get(key) || groups.set(key, []).get(key)).push(id);
    }
    return [...groups].map(([key, ids]) => ({ key, ids, n: ids.length, use: ids.length >= ESTATE ? "estate" : ids.length >= MANSION ? "mansion" : "small" }));
  }
  // who goes on which plot: first everyone who can stay where the save had them, then the rest, biggest first,
  // each to the region with the fewest Tickles so far (evenly over the six), on the plot that fits best
  function assignLots(lots, prev) {
    const groups = ownerGroups(), byKey = new Map(groups.map((g) => [g.key, g]));
    const tot = regions.map(() => 0), placed = new Set();
    const occ = new Array(lots.length).fill(null);
    const set = (li, o) => { occ[li] = o; tot[lots[li].region] += o.ids.length; };
    const fitsEstate = (L, n) => L.cls === "estate" && L.cap * 1.4 >= n;
    // 1. those who stay
    if (prev) for (const k in prev) {
      const li = +k, P = prev[k], L = lots[li];
      if (!L) continue;
      if (P.use === "estate" || P.use === "mansion") {
        const g = byKey.get(P.holder);
        if (!g || g.use !== P.use || placed.has(g.key) || (g.use === "estate" && !fitsEstate(L, g.n))) continue;
        set(li, { use: g.use, holder: g.key, households: g.use === "estate" ? g.ids.map((id) => [id]) : [g.ids], ids: g.ids.slice() });
        placed.add(g.key);
      } else if (P.use === "town") {
        const hh = [], ids = [];
        for (const key of P.members || []) { const g = byKey.get(key); if (!g || g.use !== "small" || placed.has(key) || ids.length + g.n > TOWN + 4) continue; hh.push(g.ids); ids.push(...g.ids); placed.add(key); }
        if (hh.length) set(li, { use: "town", holder: null, households: hh, ids, members: hh.map((x, j) => P.members.find((key) => byKey.get(key) && byKey.get(key).ids === x)) });
      }
    }
    const free = (pred) => lots.filter((L) => !occ[L.lot] && pred(L));
    const pickRegion = (cands) => { let best = null; for (const L of cands) if (!best || tot[L.region] < tot[best.region] || (tot[L.region] === tot[best.region] && L.lot < best.lot)) best = L; return best; };
    // 2. the estates still to place
    for (const g of groups.filter((x) => x.use === "estate" && !placed.has(x.key)).sort((a, b) => b.n - a.n || (a.key < b.key ? -1 : 1))) {
      let cands = free((L) => L.cls === "estate" && L.cap >= g.n);
      if (cands.length) { const R = pickRegion(cands).region; cands = cands.filter((L) => L.region === R).sort((a, b) => a.cap - b.cap); }
      else cands = free((L) => L.cls === "estate").sort((a, b) => b.cap - a.cap);
      if (!cands.length) cands = free((L) => L.cls !== "mansion").sort((a, b) => b.R - a.R);
      if (!cands.length) cands = free(() => true);
      if (!cands.length) continue;
      set(cands[0].lot, { use: "estate", holder: g.key, households: g.ids.map((id) => [id]), ids: g.ids.slice() }); placed.add(g.key);
    }
    // 3. the mansions
    for (const g of groups.filter((x) => x.use === "mansion" && !placed.has(x.key)).sort((a, b) => b.n - a.n || (a.key < b.key ? -1 : 1))) {
      let L = pickRegion(free((x) => x.cls === "mansion"));
      if (!L) L = free((x) => x.cls === "estate").sort((a, b) => a.cap - b.cap)[0] || free(() => true)[0];
      if (!L) continue;
      set(L.lot, { use: "mansion", holder: g.key, households: [g.ids], ids: g.ids.slice() }); placed.add(g.key);
    }
    // 4. the small holders: into a town with room, or a new town, in the region with the fewest Tickles
    for (const g of groups.filter((x) => x.use === "small" && !placed.has(x.key)).sort((a, b) => hash2(a.ids[0], 3, 1203) - hash2(b.ids[0], 3, 1203))) {
      const towns = lots.filter((L) => occ[L.lot] && occ[L.lot].use === "town" && occ[L.lot].ids.length + g.n <= TOWN);
      let L = pickRegion(towns);
      if (!L) { L = pickRegion(free((x) => x.cls === "town")) || free((x) => x.cls !== "mansion")[0] || free(() => true)[0]; if (!L) continue; set(L.lot, { use: "town", holder: null, households: [], ids: [], members: [] }); }
      const o = occ[L.lot];
      o.households.push(g.ids); o.ids.push(...g.ids); o.members.push(g.key); tot[L.region] += g.n; placed.add(g.key);
    }
    return occ;
  }
""" + s[a1:]

# ---------- 2. the plots placed in each region (they never move) ----------
a0 = s.index("    const PLAN = settlementPlan();")
a1 = s.index("      // places between villages")
s = s[:a0] + """    const PLAN = lotPlan();
    for (const R of regions) {
      const plan = PLAN[R.i];
      const r = rng(R.i * 7919 + 13);
      // candidate spots on a jittered grid inside the region, not too close to the water
      const cands = [];
      for (let gx = -560; gx <= 560; gx += 26) for (let gz = -560; gz <= 560; gz += 26) {
        const x = R.cx + gx + (r() - 0.5) * 20, z = R.cz + gz + (r() - 0.5) * 20;
        const f = regionField(x, z);
        if (f.r !== R.i) continue;
        const dw = waterDist(x, z, f);
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
        const name = nameFor(R.floor, r) + (pl.cls === "estate" ? " Estate" : pl.cls === "mansion" ? " Manor" : "");
        const v = { i: villages.length, lot: villages.length, region: R.i, floor: R.floor, cls: pl.cls, cap: pl.cap, x: best.x, z: best.z, r: lotR(pl.cls, pl.cap),
          h: SEA + 2 + Math.floor(Math.min(1, best.dw / 18) * R.amp * 0.5), name, residents: [], homes: [], houses: [], households: [] };
        v.style = Math.floor(hash2(v.i, 7, 1201) * TB.CLANS.length);
        villages.push(v);
        gadd("lot", v, v.x - v.r - 8, v.z - v.r - 8, v.x + v.r + 8, v.z + v.r + 8);
      }
""" + s[a1:]

# who lives where (the save remembers it between ownership updates)
rep("""    // the square: town hall and granary; then a house for every Tickle in a loose spiral, front door
    // towards the square, kept off the roads
    const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);""",
"""    // who lives on which plot: the snapshot, with the save's earlier assignment kept wherever it still fits
    let prevSave = null;
    try { prevSave = App.loadSaved ? App.loadSaved() : null; } catch (e) { prevSave = null; }
    const prevLots = prevSave && prevSave.lotsLayout === App.LOTS_LAYOUT && prevSave.lots ? prevSave.lots : null;
    const OCC = assignLots(villages, prevLots);
    App.lotOccupants = {};
    villages.forEach((v, li) => {
      const o = OCC[li];
      v.kind = o ? o.use : "vacant"; v.vacant = !o;
      if (o) { v.holder = o.holder; v.households = o.households; v.residents = o.ids; App.lotOccupants[li] = o.use === "town" ? { use: "town", members: o.members } : { use: o.use, holder: o.holder }; }
    });
    // the square: town hall and granary (where a house for every household will stand round it, last of all)
    const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);""")

# the square: the hall by plot class (fixed), its look by who lives there; no houses here any more
rep("""      v.hallScale = v.kind === "estate" ? 1.6 : v.kind === "mansion" ? 1 + 0.035 * (v.residents.length - MANSION) : 1;
      const hd = v.kind === "estate" ? 17 : 13, dd = v.kind === "town" ? 9 : hd - 2.9 * v.hallScale;""",
"""      v.hallScale = v.kind === "estate" ? 1.6 : v.kind === "mansion" ? 1 + 0.035 * (v.residents.length - MANSION) : 1;
      const hd = v.cls === "estate" ? 17 : 13, dd = v.kind === "estate" || v.kind === "mansion" ? hd - 2.9 * v.hallScale : 9;""")
a0 = s.index("""      const nearRoad = (x, z, d) => gget("road", x, z).some((rd) => segDist(x, z, rd) < d);
      let j = v.kind === "estate" ? 16 : 12;""")
a1 = s.index("""      v.r = Math.max(v.r, 20, ...v.homes.map((p) => Math.hypot(p.hx - v.x, p.hz - v.z) + 5));
    }""") + len("""      v.r = Math.max(v.r, 20, ...v.homes.map((p) => Math.hypot(p.hx - v.x, p.hz - v.z) + 5));
    }""")
s = s[:a0] + """    }""" + s[a1:]

# the plot's fixed scenery: always the same pieces (so nothing else is renumbered); hidden on a plot for sale
rep("""    for (const v of villages) {
      const r = rng(v.i * 31 + 7);
      v.fire = sc("campfire", v.x, v.z, r() * 6.28);
      v.logs = [];
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.4; v.logs.push(sc("logseat", v.x + Math.cos(a) * 4.2, v.z + Math.sin(a) * 4.2, a)); }""",
"""    for (const v of villages) {
      const r = rng(v.i * 31 + 7), hide = v.vacant ? { gone: true } : {};
      v.fire = sc("campfire", v.x, v.z, r() * 6.28, hide);
      v.logs = [];
      for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.4; v.logs.push(sc("logseat", v.x + Math.cos(a) * 4.2, v.z + Math.sin(a) * 4.2, a, hide)); }""")
rep("""        if (Math.hypot(x - v.hall.x, z - v.hall.z) > 5 && Math.hypot(x - v.granary.x, z - v.granary.z) > 4) sc(deco, x, z, r() * 6.28);
      }
      v.hall.sc = sc((v.kind === "town" ? "townhall_" : "manor_") + v.style, v.hall.x, v.hall.z, v.hall.rot, Object.assign({ building: true, village: v.i, hall: true }, v.kind === "town" ? {} : { scale: v.hallScale, manor: true }, v.kind === "mansion" ? { mansion: true } : {}));
      v.granary.sc = sc("granary_0", v.granary.x, v.granary.z, v.granary.rot, { building: true, village: v.i, granary: true });
      v.houses.forEach((h, k) => { h.sc = sc(h.kind + "_" + v.style, h.hx, h.hz, h.rot, { building: true, house: true, village: v.i, slot: k, members: h.members }); });
      if (v.kind === "mansion") v.homes[0].sc = v.hall.sc;""",
"""        if (Math.hypot(x - v.hall.x, z - v.hall.z) > 5 && Math.hypot(x - v.granary.x, z - v.granary.z) > 4) sc(deco, x, z, r() * 6.28);
      }
      const manor = v.kind === "estate" || v.kind === "mansion";
      v.hall.sc = sc((manor ? "manor_" : "townhall_") + v.style, v.hall.x, v.hall.z, v.hall.rot, Object.assign({ building: true, village: v.i, hall: true }, manor ? { scale: v.hallScale, manor: true } : {}, v.kind === "mansion" ? { mansion: true } : {}, hide));
      v.granary.sc = sc("granary_0", v.granary.x, v.granary.z, v.granary.rot, Object.assign({ building: true, village: v.i, granary: true }, hide));
      // a plot for sale: a sign in the middle of it
      v.sign = sc("plotsign_0", v.x, v.z + 2, r() * 0.6 - 0.3, Object.assign({ lot: v.lot, forSale: true }, v.vacant ? {} : { gone: true }));""")
rep("""      sc("altar_0", v.altar.x, v.altar.z, Math.atan2(v.x - v.altar.x, v.z - v.altar.z), { building: true, village: v.i, fixed: true });""",
"""      sc("altar_0", v.altar.x, v.altar.z, Math.atan2(v.x - v.altar.x, v.z - v.altar.z), Object.assign({ building: true, village: v.i, fixed: true }, hide));""")
# pens no longer look at the houses (they are placed outside the plot; the houses come later and keep clear of them)
rep("""        if (v.homes.some((hm) => Math.abs(hm.hx - x) < w + 3.5 && Math.abs(hm.hz - z) < d + 3.5)) return null;\n""", "")
# the village fire's rings: the first two always; the third (as far as the people need it) comes with the houses
rep("""      // and a third ring further out, only as far as the village needs it
      for (let k = 0; k < 16 && v.logs.filter(Boolean).length * 2 < v.residents.length; k++)""",
"""      if (v.vacant) for (const s0 of v.logs) if (s0) s0.gone = true;
      v.ring3 = clear;
      // (the third ring, further out and only as far as the people need it, is laid with the houses, last of all)
      for (let k = 0; k < 0; k++)""")

# terrain and the forest keep to every plot (lived on or not)
rep("""    for (const v of gget("village", x, z)) {""", """    for (const v of gget("lot", x, z)) {""")
rep("""      if (gget("village", px, pz).some((v) => Math.hypot(v.x - px, v.z - pz) < v.r + 3)) continue;""",
"""      if (gget("lot", px, pz).some((v) => Math.hypot(v.x - px, v.z - pz) < v.r + 3)) continue;""")
# the guild quarter and the casino near the region's biggest plot (fixed), not its biggest village
rep("""home = villages.filter((v) => v.region === R.i).sort((a, b) => b.residents.length - a.residents.length)[0];""",
"""home = villages.filter((v) => v.region === R.i).sort((a, b) => b.r - a.r || a.lot - b.lot)[0];""")
rep("""home = villages.filter((v) => v.region === R.i).sort((a, b) => b.residents.length - a.residents.length)[0], c0 = ar || home;""",
"""home = villages.filter((v) => v.region === R.i).sort((a, b) => b.r - a.r || a.lot - b.lot)[0], c0 = ar || home;""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
