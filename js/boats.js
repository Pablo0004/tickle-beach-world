/* Boats on the great lake. Three ferries cross between the north and the south shore on a timetable
 * (from 06:00, waiting ten minutes at each dock, until the last full crossing before 22:00); Tickles
 * who spend their free time across the lake ride them over and back. Each dock also keeps four rowing
 * boats: on some days the fishers of the shore villages row out and fish on the lake, and what they
 * catch goes to the granary. A pilgrims' launch also runs from every dock to the Maker's Isle in the
 * middle of the lake, on the same kind of timetable. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const FSPEED = 9, WAIT = 10, OPEN = 6 * 60, CLOSE = 22 * 60;
  App.FERRY_WAIT = WAIT;

  // ---------- the timetable ----------
  const info = (F) => { if (!F.Tc) { F.Tc = F.len / FSPEED; F.P = 2 * (F.Tc + WAIT); F.N = Math.floor((CLOSE - OPEN) / F.P); } return F; };
  function at(F, f, docked, back) {
    const d = f * F.len, p = App.alongPath(F.path, d), q = App.alongPath(F.path, Math.min(F.len, d + 1)), r = App.alongPath(F.path, Math.max(0, d - 1));
    // the bow points the way it is going (a -> b, or back)
    return { x: p.x, z: p.z, h: Math.atan2(q.x - r.x, q.z - r.z) + (back ? Math.PI : 0), docked };
  }
  // where a ferry is at time T: docked at "a" or "b", or out on the lake
  App.ferryAt = (F, T) => {
    info(F);
    const day = Math.floor(T / DAY), m = T - day * DAY;
    if (m < OPEN || m >= OPEN + F.N * F.P) return at(F, 0, "a", false);
    const u = (m - OPEN) % F.P;
    // a pilgrims' launch only makes the round trip when someone has booked one of its two crossings
    if (F.launch) {
      const c0 = day * DAY + OPEN + Math.floor((m - OPEN) / F.P) * F.P;
      if (!booked(F, c0 + WAIT) && !booked(F, c0 + 2 * WAIT + F.Tc)) return at(F, 0, "a", false);
    }
    if (u < WAIT) return at(F, 0, "a", false);
    if (u < WAIT + F.Tc) return at(F, (u - WAIT) / F.Tc, null, false);
    if (u < 2 * WAIT + F.Tc) return at(F, 1, "b", true);
    return at(F, 1 - (u - 2 * WAIT - F.Tc) / F.Tc, null, true);
  };
  // the first crossing from one side at or after time T: { dep, arr }
  App.ferryDeparture = (F, side, T) => {
    info(F);
    const off = side === "a" ? WAIT : 2 * WAIT + F.Tc;
    for (let day = Math.floor(T / DAY), k = 0; k < 2; k++, day++) {
      const base = day * DAY + OPEN + off, n = Math.max(0, Math.ceil((T - base) / F.P));
      if (n < F.N) return { dep: base + n * F.P, arr: base + n * F.P + F.Tc };
    }
    return null;
  };
  App.ferryEvery = (F) => Math.round(info(F).P);
  // bookings: the plans of the day reserve their crossings
  const bookings = new Map();
  const bkey = (F, dep) => F.i + ":" + Math.round(dep);
  function booked(F, dep) { return (bookings.get(bkey(F, dep)) || 0) > 0; }
  App.bookFerry = (F, dep) => { const k = bkey(F, dep); bookings.set(k, (bookings.get(k) || 0) + 1); };
  // every morning the plans of the villages by the docks are worked out a few at a time, so the
  // launches know who is coming
  let preDay = -1, queue = [];
  App.ferryTick = () => {
    const day = Math.floor(st.T / DAY);
    if (day !== preDay) {
      preDay = day; bookings.clear(); queue = [];
      for (const D of App.docks || []) for (const v of App.villages) if (v.region === D.region && Math.hypot(v.x - D.x, v.z - D.z) < 360) queue.push(...v.residents);
    }
    for (let k = 0; k < 80 && queue.length; k++) App.planOf(queue.pop(), day);
  };
  // ---------- boatmen: every line has one, at the helm from first crossing to last ----------
  App.boatmen = new Map(); // Tickle id -> line
  App.assignBoatmen = () => {
    App.boatmen.clear();
    for (const F of App.ferries || []) {
      const D = App.docks[F.a], v = App.villages.filter((o) => o.region === D.region).sort((p, q) => Math.hypot(p.x - D.x, p.z - D.z) - Math.hypot(q.x - D.x, q.z - D.z))[0];
      if (!v) continue;
      const id = v.residents.filter((x) => !App.boatmen.has(x) && !(App.heroOf && App.heroOf(x))).sort((p, q) => hash2(p, F.i, 261) - hash2(q, F.i, 261))[0];
      if (id == null) continue;
      F.boatman = id; App.boatmen.set(id, F);
    }
  };
  App.boatmanLine = (id) => (App.boatmen.size ? App.boatmen.get(id) || null : null);
  App.ferryHours = { open: OPEN, close: CLOSE };

  // ---------- rowing boats, four by each dock ----------
  App.rowboats = [];
  App.initBoats = () => {
    App.rowboats = [];
    for (const D of App.docks || []) for (let k = 0; k < 4; k++) {
      const side = k & 1 ? 1 : -1, rx = D.uz, rz = -D.ux, along = 4.5 + (k >> 1) * 3.5;
      const x = D.x + D.ux * along + rx * side * 3.3, z = D.z + D.uz * along + rz * side * 3.3;
      App.rowboats.push({ i: App.rowboats.length, dock: D.i, home: { x, z, h: D.rot + Math.PI }, x, z, h: D.rot + Math.PI, user: null });
    }
  };
  // a fisher on a lake day takes a boat out, if one is free
  App.boatJob = (t, step, dayStart) => {
    const D = App.docks[step.p.boat];
    if (!D || dayStart + step.e - st.T < 45) return null;
    const b = App.rowboats.find((x) => x.dock === D.i && !x.user && x.sunk == null); // (none from the bottom of the lake)
    if (!b) return null;
    // a spot out on the lake, the same for this fisher all day
    let spot = null;
    for (let k = 0; k < 6 && !spot; k++) {
      const d = 18 + hash2(t.id, k, 215) * 40, side = (hash2(t.id, k, 217) - 0.5) * 50;
      const x = D.berth.x + D.ux * d + D.uz * side, z = D.berth.z + D.uz * d - D.ux * side;
      if (!App.isLand(x, z) && App.lakeSd(x, z) < -6) spot = { x, z };
    }
    if (!spot) return null;
    b.user = t.id;
    t.action = { kind: "row", boat: b, phase: "board", spot, until: dayStart + step.e - 20, started: st.T };
    return t.action;
  };

  // ---------- fishing from a dock: a place each, on the jetty or along the bank, facing the water ----------
  const dockSlots = new Map();
  function slotsOf(D) {
    let S = dockSlots.get(D.i);
    if (S) return S;
    const ux = D.ux, uz = D.uz, px = uz, pz = -ux, spots = [];
    const at = (along, side) => ({ x: D.x + ux * along + px * side, z: D.z + uz * along + pz * side });
    // on the jetty: at its end looking out over the lake, and along both sides looking out sideways
    for (const [al, sd, fx, fz] of [[11, 0, ux, uz], [9.6, 0.85, px, pz], [9.6, -0.85, -px, -pz], [7.4, 0.85, px, pz], [7.4, -0.85, -px, -pz], [5.2, 0.85, px, pz], [5.2, -0.85, -px, -pz]]) {
      const p = at(al, sd);
      spots.push({ x: p.x, z: p.z, cx: p.x + fx * 6, cz: p.z + fz * 6, deck: true });
    }
    // along the bank on both sides, clear of the rowing boats moored by the jetty
    for (let k = 0; k < 26; k++) {
      const side = (k % 2 ? -1 : 1) * (6.5 + Math.floor(k / 2) * 2.6), b = at(-3, side);
      let last = null;
      for (let j = -8; j <= 14; j += 0.5) { const x = b.x + ux * j, z = b.z + uz * j; if (App.isLand(x, z)) last = { x, z }; else if (last) break; }
      if (!last) continue;
      const wx = last.x + ux * 1.5, wz = last.z + uz * 1.5;
      if (App.isLand(wx, wz) || App.lakeSd(wx, wz) > 0) continue;
      spots.push({ x: last.x - ux * 0.5, z: last.z - uz * 0.5, cx: wx + ux * 5, cz: wz + uz * 5 });
    }
    // taken in turns: the end of the jetty, two on the bank, two along the jetty, two more on the bank...
    const deck = spots.filter((x) => x.deck), bank = spots.filter((x) => !x.deck), order = [];
    if (deck.length) order.push(deck.shift());
    while (deck.length || bank.length) { order.push(...bank.splice(0, 2)); order.push(...deck.splice(0, 2)); }
    S = { spots: order, taken: new Map() };
    dockSlots.set(D.i, S);
    return S;
  }
  App.dockSpot = (id, D) => {
    const S = slotsOf(D);
    if (!S.spots.length) return null;
    if (!S.taken.has(id)) S.taken.set(id, S.taken.size);
    const k = S.taken.get(id), n = S.spots.length, bank = S.spots.filter((x) => !x.deck);
    // more of them than places: the late ones squeeze in beside the others on the bank
    let sp = S.spots[k], off = 0;
    if (k >= n) { const j = k - n, extra = 1 + Math.floor(j / Math.max(1, bank.length)); sp = bank[j % Math.max(1, bank.length)] || S.spots[0]; off = (extra % 2 ? 1 : -1) * 1.2 * Math.ceil(extra / 2); }
    return { x: sp.x + D.uz * off, z: sp.z - D.ux * off, cx: sp.cx + D.uz * off, cz: sp.cz - D.ux * off, deck: !!sp.deck };
  };

  // at a pier, a pond or a beach: a place each on the water's edge round it, facing the water
  const shoreSlots = new Map();
  App.shoreSpot = (key, cx, cz, id, pond) => {
    let S = shoreSlots.get(key);
    if (!S) {
      const spots = [];
      for (let r = 1.5; r <= 16 && spots.length < 16; r += 1.1) for (let a = 0; a < 6.283 && spots.length < 16; a += 0.9 / r) {
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        if (!App.isLand(x, z) || App.deckY(x, z) != null || !App.climbOK(x, z, x, z)) continue;
        let w = null;
        for (let b = 0; b < 6.28 && !w; b += 0.785) { const wx = x + Math.cos(b) * 1.3, wz = z + Math.sin(b) * 1.3; if (!App.isLand(wx, wz) && !!App.pondWater(wx, wz) === !!pond) w = { x: wx, z: wz }; }
        if (!w || spots.some((o) => Math.hypot(o.x - x, o.z - z) < 2.4)) continue;
        spots.push({ x, z, cx: x + (w.x - x) * 4, cz: z + (w.z - z) * 4 });
      }
      S = { spots, taken: new Map() };
      shoreSlots.set(key, S);
    }
    if (!S.spots.length) return null;
    if (!S.taken.has(id)) S.taken.set(id, S.taken.size);
    const k = S.taken.get(id), sp = S.spots[k % S.spots.length], ring = Math.floor(k / S.spots.length);
    // a second ring stands a step back from the first
    const bx = sp.x - (sp.cx - sp.x) * 0.3 * ring, bz = sp.z - (sp.cz - sp.z) * 0.3 * ring;
    return { x: bx, z: bz, cx: sp.cx, cz: sp.cz };
  };

  // ---------- the 3D boats near the player ----------
  let geoF = null, geoR = null;
  const objs = new Map();
  App.loadBoats = async () => {
    const [f, r] = await Promise.all([App.kitMesh("ferry", 0), App.kitMesh("rowboat", 0)]);
    geoF = f; geoR = r;
    App.initBoats();
    App.assignBoatmen();
  };
  function make(g) { const grp = new THREE.Group(); grp.add(App.centeredMesh(g.md, g.geo, true)); App.scene.add(grp); return grp; }
  const turn = (h, target, k) => { let d = target - h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return h + d * Math.min(1, k); };
  App.updateBoats = (dtReal) => {
    if (!geoF || !App.ferries) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, now = performance.now() / 1000;
    const show = (key, x, z, g) => {
      const near = Math.hypot(x - tx, z - tz) < 420;
      let o = objs.get(key);
      if (near && !o) { o = { grp: make(g), h: null }; objs.set(key, o); }
      else if (!near && o) { App.scene.remove(o.grp); objs.delete(key); o = null; }
      return o;
    };
    for (const F of App.ferries) {
      const p = App.ferryAt(F, st.T), o = show("f" + F.i, p.x, p.z, F.launch ? geoR : geoF);
      if (o && F.launch && !o.scaled) { o.grp.scale.setScalar(1.9); o.scaled = true; }
      // the smoothed pose is where riders stand
      const h = o ? (o.h = o.h == null ? p.h : turn(o.h, p.h, dtReal * 1.2)) : p.h;
      F.live = { x: p.x, z: p.z, h };
      if (!o) continue;
      o.grp.position.set(p.x, App.WATER_Y - (F.launch ? 0.6 : 0.55) + Math.sin(now * 1.3 + F.i) * 0.06, p.z);
      o.grp.rotation.set(Math.sin(now * 0.9 + F.i) * 0.02, h, Math.sin(now * 1.1 + F.i) * 0.025);
    }
    for (const b of App.rowboats) {
      const o = show("r" + b.i, b.x, b.z, geoR);
      if (o) o.grp.visible = b.sunk == null; // sunk by a sea beast: on the bottom until morning
      if (!o) continue;
      o.grp.position.set(b.x, b.hy != null ? b.hy : App.WATER_Y - 0.3 + Math.sin(now * 1.7 + b.i) * 0.05, b.z);
      o.grp.rotation.set(0, b.h, Math.sin(now * 1.4 + b.i) * 0.04);
    }
  };
  App.boatTurn = turn;
  // the hand (hand.js) can pick up a rowing boat lying at its dock; set down in the water it floats there until
  // someone takes it out, set down on land it is carried back to its mooring
  (App.handThings = App.handThings || []).push((tx, tz) => {
    const out = [];
    for (const b of App.rowboats) {
      if (b.user || b.sunk != null || Math.abs(b.x - tx) + Math.abs(b.z - tz) > 140) continue;
      const T = { x: b.x, y: App.WATER_Y, z: b.z, sound: "boat", lift: 2,
        grab() { b.held = true; },
        set(x, y, z) { b.x = x; b.z = z; b.hy = y; },
        land() { b.held = false; b.hy = null; if (App.isLand(b.x, b.z)) { b.x = b.home.x; b.z = b.home.z; b.h = b.home.h; } } };
      out.push({ kind: "thing", obj: T, x: b.x, y: App.WATER_Y + 0.6, z: b.z, r: 30 });
    }
    return out;
  });
})();
