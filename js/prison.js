/* The prison. One for the whole map, and most of it underground: a stone blockhouse over the stairs, inside a round
 * walled yard with a gate and two watchtowers. While a Tickle is up for sale on a marketplace it lives here: it leaves
 * its holder's place, sleeps in a cell down below, eats in the canteen, spends the morning and the end of the
 * afternoon in the yard and works there breaking rocks. Once it is sold it walks free and moves in with its new holder
 * (as soon as the owners are read again); if the listing is withdrawn it goes home.
 * Who is for sale comes from a snapshot of the marketplace listings (js/listings.js, made by tools/update_listings.py
 * with the owner's own OpenSea key), or from a list of token numbers kept in this browser (Holders tab). */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the blockhouse and the rock piles, in the kit's stroke format ----------
  if (TB && TB.kitHelpers) {
    const { C, S } = TB.kitHelpers;
    // a squat stone blockhouse with battlements, a barred gate over the stairs down, barred windows and two lanterns
    function prison() {
      const st = [], stone = C("#8f8f8f"), stone2 = C("#b8b4aa"), dark = C("#1e1e1e"), iron = C("#4a4a4a"), lamp = C("#ffd23f"), wood = C("#6b4a2b");
      // layer 0: the plinth and the block of the walls, with the doorway cut in
      st.push(S("cube", [0, 0, 30], [500, 400, 30], { color: stone2, round: 0.05 }));
      st.push(S("cube", [0, 0, 310], [460, 360, 270], { color: stone, round: 0.02 }));
      st.push(S("cube", [0, 360, 180], [120, 60, 170], { m: "sub", color: stone }));
      // layer 1: the roof slab and the battlements all round
      st.push(S("cube", [0, 0, 592], [476, 376, 14], { color: stone2, layer: 1 }));
      st.push(S("cube", [0, 350, 640], [44, 24, 40], { color: stone2, layer: 1 }));
      st.push(S("cube", [150, 350, 640], [44, 24, 40], { color: stone2, mirror: true, offsX: 150, layer: 1 }));
      st.push(S("cube", [370, 350, 640], [44, 24, 40], { color: stone2, mirror: true, offsX: 370, layer: 1 }));
      st.push(S("cube", [0, -350, 640], [44, 24, 40], { color: stone2, layer: 1 }));
      st.push(S("cube", [150, -350, 640], [44, 24, 40], { color: stone2, mirror: true, offsX: 150, layer: 1 }));
      st.push(S("cube", [370, -350, 640], [44, 24, 40], { color: stone2, mirror: true, offsX: 370, layer: 1 }));
      st.push(S("cube", [450, 0, 640], [24, 44, 40], { color: stone2, mirror: true, offsX: 450, layer: 1 }));
      st.push(S("cube", [450, 180, 640], [24, 44, 40], { color: stone2, mirror: true, offsX: 450, layer: 1 }));
      st.push(S("cube", [450, -180, 640], [24, 44, 40], { color: stone2, mirror: true, offsX: 450, layer: 1 }));
      // layer 2: the dark stairwell behind the gate, and the gate's iron bars
      st.push(S("cube", [0, 345, 175], [112, 20, 165], { color: dark, layer: 2 }));
      st.push(S("cube", [0, 372, 175], [8, 8, 165], { color: iron, layer: 2 }));
      st.push(S("cube", [42, 372, 175], [8, 8, 165], { color: iron, mirror: true, offsX: 42, layer: 2 }));
      st.push(S("cube", [84, 372, 175], [8, 8, 165], { color: iron, mirror: true, offsX: 84, layer: 2 }));
      st.push(S("cube", [0, 372, 250], [118, 8, 10], { color: iron, layer: 2 }));
      st.push(S("cube", [0, 372, 110], [118, 8, 10], { color: iron, layer: 2 }));
      // layer 3: barred windows either side of the gate and down both flanks
      st.push(S("cube", [270, 362, 380], [46, 10, 46], { color: dark, mirror: true, offsX: 270, layer: 3 }));
      st.push(S("cube", [270, 370, 380], [6, 6, 46], { color: iron, mirror: true, offsX: 270, layer: 3 }));
      st.push(S("cube", [462, 120, 380], [10, 46, 46], { color: dark, mirror: true, offsX: 462, layer: 3 }));
      st.push(S("cube", [470, 120, 380], [6, 6, 46], { color: iron, mirror: true, offsX: 470, layer: 3 }));
      st.push(S("cube", [462, -150, 380], [10, 46, 46], { color: dark, mirror: true, offsX: 462, layer: 3 }));
      st.push(S("cube", [470, -150, 380], [6, 6, 46], { color: iron, mirror: true, offsX: 470, layer: 3 }));
      // layer 4: the lanterns either side of the gate, and the plank over it
      st.push(S("cube", [170, 390, 330], [14, 30, 14], { color: iron, mirror: true, offsX: 170, layer: 4 }));
      st.push(S("sphere", [170, 412, 300], [24, 24, 28], { color: lamp, mirror: true, offsX: 170, layer: 4 }));
      st.push(S("cube", [0, 372, 420], [150, 12, 40], { color: wood, round: 0.2, layer: 4 }));
      st.push(S("cube", [0, 380, 420], [100, 6, 8], { color: iron, layer: 4 }));
      return st;
    }
    // the inmates' work: big rocks to break and a heap of what has been broken
    function rockpile(v) {
      const st = [], r1 = C("#9a948a"), r2 = C("#7a746a"), r3 = C("#b8b0a0"), grit = C("#c8c0b0");
      st.push(S("sphere", [0, 0, 120], [210, 170, 130], { color: r1, blend: 30 }));
      st.push(S("sphere", [140, 80, 80], [120, 110, 90], { color: r2, blend: 30 }));
      st.push(S("sphere", [-150, -60, 70], [110, 100, 80], { color: r3, blend: 30 }));
      st.push(S("sphere", [60, -170, 30], [150, 90, 34], { color: grit, layer: 1 }));
      st.push(S("sphere", [-60, 190, 26], [120, 70, 28], { color: grit, layer: 1 }));
      if (v) { st.push(S("sphere", [200, -120, 40], [50, 46, 44], { color: r2, layer: 2 }), S("sphere", [-210, 120, 36], [44, 40, 40], { color: r1, layer: 2 })); }
      return st;
    }
    TB.KIT.prison = { name: "Prison", group: "Village", variants: [0], build: prison, voxel: [16, 34], lazy: true };
    TB.KIT.rockpile = { name: "Rock Pile", group: "Village", variants: [0, 1], build: rockpile, voxel: [10, 24], lazy: true, variantLabel: (v) => ["rocks", "rocks and stones"][v] };
  }
  if (!G.App) return;
  const App = G.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  // ---------- who is up for sale ----------
  // the snapshot that ships with the game, or a list typed in this browser (which wins while it is kept)
  const LIST_KEY = "tickle-listings-v1";
  let kept = null, listed = null;
  try { const o = JSON.parse(localStorage.getItem(LIST_KEY) || "null"); if (o && Array.isArray(o.ids)) kept = o; } catch (e) { kept = null; }
  const source = () => kept || TB.LISTINGS || { ids: [], date: "", source: "" };
  const listSet = () => { if (!listed) listed = new Set(source().ids.filter((id) => id >= 0 && id < TB.SUPPLY)); return listed; };
  App.isListed = (id) => !!App.prison && listSet().has(id);
  App.prisoners = () => [...listSet()].sort((a, b) => a - b);
  App.listingsInfo = () => { const s = source(); return { n: listSet().size, date: s.date || "", from: kept ? "browser" : s.source || "" }; };
  // a new list: everyone whose plan changes today plans again
  function relist(next) {
    const before = new Set(listSet());
    kept = next; listed = null;
    for (const id of new Set([...before, ...listSet()])) if (before.has(id) !== listSet().has(id)) App.invalidatePlan(id);
  }
  App.setListings = (ids) => {
    const clean = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id >= 0 && id < TB.SUPPLY))];
    const next = { ids: clean, date: new Date().toISOString().slice(0, 10), source: "typed in this browser" };
    try { localStorage.setItem(LIST_KEY, JSON.stringify(next)); } catch (e) { /* kept for this visit only */ }
    relist(next);
    return clean.length;
  };
  App.clearListings = () => { try { localStorage.removeItem(LIST_KEY); } catch (e) { /* storage blocked */ } relist(null); };

  // ---------- where it stands: placed with the world (geo.js), after every other fixed building ----------
  // On high ground away from the villages and the roads, in the Waterfall if there is room, else in another region.
  // The blockhouse at the back of a round yard, its gate facing the yard's own gate; rock piles either side.
  const YARD_R = 15, WALL_SCALE = 1, WALL_LEN = (980 / 160) * WALL_SCALE, GATE_HALF = 2.75;
  App.placePrison = (H) => {
    const { regions, villages, genColumn, regionField, waterDist, segDist, gadd, sc, rng, SEA } = H;
    const order = [2, 0, 4, 1, 5, 3].map((i) => regions[i]).filter(Boolean);
    let spot = null;
    for (const R of order) {
      const r = rng(R.i * 4409 + 13);
      for (let tries = 0; tries < 3000 && !spot; tries++) {
        const lv = tries < 1500 ? 0 : 1, a = r() * 6.28, d = 60 + r() * 420, x = Math.round(R.cx + Math.cos(a) * d), z = Math.round(R.cz + Math.sin(a) * d);
        if (regionField(x, z).r !== R.i || waterDist(x, z) < 30) continue;
        const h = genColumn(x, z).h;
        if (h < SEA + (lv ? 1 : 3)) continue;
        let flat = true;
        for (let k = 0; k < 12 && flat; k++) { const b = (k / 12) * 6.28; for (const q of [8, 16, 21]) { const ph = genColumn(x + Math.cos(b) * q, z + Math.sin(b) * q).h; if (Math.abs(ph - h) > (lv ? 4 : 3) || ph < SEA + 1) flat = false; } }
        if (!flat) continue;
        if (villages.some((v) => Math.hypot(v.x - x, v.z - z) < v.r + 26)) continue;
        if (App.gridNear("road", x, z, 30).some((rd) => segDist(x, z, rd) < 22)) continue;
        if (App.gridNear("field", x, z, 60).some((f) => Math.abs(f.x - x) < (f.w || 0) + 24 && Math.abs(f.z - z) < (f.d || 0) + 24)) continue;
        if (App.gridNear("poi", x, z, 60).some((p) => Math.hypot(p.x - x, p.z - z) < (p.lake ? p.lake.r + 26 : p.hill ? p.hill.r + 20 : 26))) continue;
        const far = (list, dmin) => !(list || []).some((o) => o && Math.hypot(o.x - x, o.z - z) < dmin);
        if (!far(App.arenas, 50) || !far(App.mines, 50) || !far(App.dungeons, 50) || !far(App.lairs, 90) || !far(App.etherFields, 40) || !far(App.docks, 40) || !far(App.guildQuarters, 45) || !far(App.casinos, 40) || !far(App.smithies, 45)) continue;
        spot = { x, z, h, R };
      }
      if (spot) break;
    }
    if (!spot) return;
    const { x, z, h, R } = spot;
    // the gate faces the nearest village
    const near = villages.filter((v) => v.region === R.i).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
    const ga = near ? Math.atan2(near.z - z, near.x - x) : 0, fx = Math.cos(ga), fz = Math.sin(ga), rot = Math.atan2(fx, fz);
    gadd("field", { kind: "prison", mud: true, x, z, w: YARD_R + 2, d: YARD_R + 2, h }, x - YARD_R - 4, z - YARD_R - 4, x + YARD_R + 4, z + YARD_R + 4);
    for (const o of App.gridNear("scenery", x, z, YARD_R + 6)) if (!o.building && Math.hypot(o.x - x, o.z - z) < YARD_R + 3) o.gone = true;
    const P = (App.prison = { x, z, h, rot, region: R.i, name: "Saltrock Penitentiary", walls: { x, z, r: YARD_R, gates: [ga] }, rocks: [] });
    // the blockhouse, at the back of the yard, its gate towards the yard's gate
    const bx = x - fx * 7.5, bz = z - fz * 7.5;
    P.sc = sc("prison_0", bx, bz, rot, { building: true, fixed: true, prison: true, scale: 1.25 });
    P.door = { x: bx + fx * 4.8, z: bz + fz * 4.8 };
    // the wall, round from one side of the gate to the other, with a watchtower either side of the gate
    sc("gatehouse_0", x + fx * YARD_R, z + fz * YARD_R, Math.atan2(-fx, -fz), { building: true, fixed: true, wall: true, gate: true, prisonWall: true, scale: WALL_SCALE });
    const gh = (GATE_HALF - 0.3) / YARD_R, a0 = ga + gh, span = Math.PI * 2 - 2 * gh, n = Math.ceil((span * YARD_R) / (WALL_LEN * 0.94)), step = span / n;
    for (let k = 0; k < n; k++) {
      const a = a0 + (k + 0.5) * step, wx = x + Math.cos(a) * YARD_R, wz = z + Math.sin(a) * YARD_R;
      sc("wall_0", wx, wz, -(a + Math.PI / 2), { building: true, fixed: true, wall: true, prisonWall: true, scale: WALL_SCALE });
    }
    for (const s of [-1, 1]) { const a = ga + s * (gh + step * 1.0), tx = x + Math.cos(a) * YARD_R, tz = z + Math.sin(a) * YARD_R; sc("walltower_0", tx, tz, 0, { building: true, fixed: true, wall: true, prisonWall: true, scale: WALL_SCALE * 1.15 }); }
    // the rock piles, two on each side of the yard
    for (const [side, along] of [[1, -1], [1, 4], [-1, -1], [-1, 4]]) {
      const px = x + fz * side * 8.5 + fx * along, pz = z - fx * side * 8.5 + fz * along;
      const s0 = sc("rockpile_" + (P.rocks.length % 2), px, pz, rot + side * 0.6, { building: false, fixed: true, prisonRock: true, scale: 1.1 });
      if (s0) P.rocks.push({ x: px, z: pz });
    }
  };

  // ---------- the day of an inmate ----------
  // in its cell until morning, the yard, rocks to break, the canteen at noon, rocks again, the yard, supper, the cell
  App.prisonPlan = (id, day) => {
    const P = App.prison;
    if (!P || !App.isListed(id) || (App.isDead && App.isDead(id))) return null;
    const door = { x: P.door.x, z: P.door.z, label: P.name, prison: true };
    const wake = 400 + hash2(id, day, 811) * 50;
    // a spot of its own in the yard (in front of the blockhouse, clear of the rock piles), and a place at one of them
    const ga = P.walls.gates[0], a = ga + (hash2(id, day, 813) - 0.5) * 2, d = 2 + hash2(id, day, 815) * 8, yx = P.x + Math.cos(a) * d, yz = P.z + Math.sin(a) * d;
    const yard = { x: yx, z: yz, label: P.name + " (the yard)", cx: P.x, cz: P.z };
    const rk = P.rocks[Math.floor(hash2(id, 817, 3) * P.rocks.length)] || P, ra = hash2(id, 819, 3) * 6.28;
    const rocks = { x: rk.x + Math.cos(ra) * 2.6, z: rk.z + Math.sin(ra) * 2.6, label: P.name + " (breaking rocks)", cx: rk.x, cz: rk.z };
    return [
      { k: "cell", s: 0, e: wake, p: door }, { k: "yard", s: wake, e: 600, p: yard }, { k: "pwork", s: 600, e: 720, p: rocks },
      { k: "canteen", s: 720, e: 780, p: door }, { k: "pwork", s: 780, e: 1020, p: rocks }, { k: "yard", s: 1020, e: 1140, p: yard },
      { k: "canteen", s: 1140, e: 1200, p: door }, { k: "cell", s: 1200, e: DAY, p: door },
    ];
  };
  const BREAK_ROCKS = { id: "break_rocks", name: "Breaking rocks", verb: "is breaking rocks in the prison yard", needs: { energy: -8, fun: -2 }, capacity: 99, minutes: 15, where: "self", anim: "dig", source: "core", status: "core" };
  const YARD_LINES = ["Same old yard.", "Any news from outside?", "Somebody buy me, please!", "My price is too high, I tell you.", "One day I'll walk out of here.", "I miss my bed at home."];
  // near the player: in and out of the blockhouse, about the yard, at the rocks
  App.prisonBrain = (t, step) => {
    if (step.k !== "cell" && step.k !== "canteen" && step.k !== "yard" && step.k !== "pwork") return false;
    const dayStart = Math.floor(st.T / DAY) * DAY, P = step.p;
    if (step.k === "cell" || step.k === "canteen") {
      if (Math.hypot(P.x - t.pos.x, P.z - t.pos.z) > 2) { App.startTravel(t, P, step.k === "cell" ? "back to its cell" : "to the canteen"); return true; }
      t.action = { kind: "rounds", prison: true, until: dayStart + step.e, started: st.T, bye: step.k === "cell" ? pick(["Another day inside.", "Out to the yard!"]) : pick(["Same gruel again.", "Back to the rocks."]), what: step.k === "cell" ? "Locked in its cell" : "In the prison canteen" };
      return true;
    }
    if (Math.hypot(P.x - t.pos.x, P.z - t.pos.z) > 1.2) { App.startTravel(t, P, step.k === "pwork" ? "to the rock piles" : "out to the yard"); return true; }
    if (step.k === "pwork") { App.startDo(t, { act: BREAK_ROCKS, ref: "rocks" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: P.cx, z: P.cz } }, false, st.T + 15); return true; }
    t.action = { kind: "idle", until: st.T + 8 + rnd() * 8 };
    if (rnd() < 0.15) App.say(t, pick(YARD_LINES), 3);
    return true;
  };

  // ---------- the card ----------
  App.prisonInfo = () => {
    const P = App.prison;
    if (!P) return null;
    const I = App.listingsInfo(), ids = App.prisoners(), m = st.T % DAY;
    const now = m < 420 || m >= 1200 ? "locked in their cells" : (m >= 720 && m < 780) || (m >= 1140 && m < 1200) ? "at the canteen" : (m >= 600 && m < 1020) ? "breaking rocks in the yard" : "out in the yard";
    const rows = [["Inmates", ids.length ? ids.length.toLocaleString() + " Tickles up for sale, " + now : "nobody: no Tickle is up for sale"], ["The list", I.date ? "read " + esc(I.date) + (I.from ? " (" + esc(I.from) + ")" : "") : "no listings read yet"]];
    if (ids.length) rows.push(["Some of them", ids.slice(0, 8).map((id) => '<a href="#" data-tickle="' + id + '">' + esc(App.nameOf(id)) + "</a>").join(", ") + (ids.length > 8 ? " \u2026" : "")]);
    const text = "<p>Every Tickle that its holder has put up for sale on a marketplace is sent here until somebody buys it: it leaves home, sleeps in a cell down below, eats in the canteen and spends its days in the yard breaking rocks. Once it is sold it walks free and moves in with its new holder; if the listing is taken down it goes home. The list comes from the marketplaces (tools/update_listings.py reads it with an OpenSea key), or you can type one in the Holders tab.</p>";
    return { name: P.name, sub: "Prison" + " \u00b7 " + App.regions[P.region].name, rows, text };
  };
  // the Holders tab: who is for sale, and a list of token numbers you can type in yourself
  App.prisonHoldersHTML = () => {
    if (!App.prison) return "";
    const I = App.listingsInfo();
    return '<div class="card"><h3>Up for sale (in the prison)</h3><p class="note">' + (I.n ? I.n.toLocaleString() + " Tickles are listed for sale" : "No Tickle is listed for sale") + (I.date ? ", list of " + esc(I.date) + (I.from ? " (" + esc(I.from) + ")" : "") : "") +
      ". While a Tickle is up for sale it lives in " + esc(App.prison.name) + ". The marketplaces' listings are read by tools/update_listings.py with an OpenSea key; here you can type token numbers instead.</p>" +
      '<textarea id="listIds" rows="2" spellcheck="false" placeholder="e.g. 12, 345, 6789" style="width:100%;box-sizing:border-box"></textarea>' +
      '<div class="row"><button class="btn" id="listUse">Use this list</button>' + (I.from === "browser" ? '<button class="btn" id="listClear">Back to the game\'s list</button>' : "") + '<button class="btn" id="prisonGo">Go to the prison</button></div></div>';
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("#listUse, #listClear, #prisonGo");
    if (!b) return;
    if (b.id === "prisonGo" && App.prison) { App.flyTo(App.prison.x, App.prison.z, 45); return; }
    if (b.id === "listUse") {
      const el = document.getElementById("listIds"), ids = ((el && el.value) || "").split(/[^0-9]+/).filter(Boolean);
      const n = App.setListings(ids);
      App.toast(n ? n + " Tickles are now up for sale: they go to the prison." : "The list is empty: nobody is up for sale.");
      App.log("world", n + " Tickles listed for sale (a list typed in this browser).", "While they are for sale they live in " + App.prison.name + ".");
    } else { App.clearListings(); App.toast("Back to the game's own list of listings."); }
    if (App.refresh) App.refresh(true);
    const t = document.getElementById("t-holders"); if (t) t.click();
  });
})(typeof self !== "undefined" ? self : this);
