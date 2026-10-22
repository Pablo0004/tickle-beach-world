/* The Parliament. One for the whole map, on the Maker's Isle behind the statue: a great marble hall with a portico of
 * columns and a dome, and inside a hemicycle of 333 seats. The seats are shared out among the holders by how many
 * Tickles each one has (the D'Hondt method) and every holder sends its best Tickles (highest level first) as its
 * ministers; a holder's ministers vote together, though now and then one of them breaks ranks.
 * It sits every afternoon. A minister puts a law to the vote (or the repeal of one in force), and so does every design,
 * activity, event and building the Director has come up with and nobody has decided on yet: what passes comes into
 * force, what fails goes. The laws change the game for real (see LAWS). Ministers who live near a dock cross on the
 * pilgrims' launch to sit in the chamber; the others vote from home. The town halls stay: the notice board, the ore
 * stores and the shelter for whoever lost their house are still theirs. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the building, in the kit's stroke format ----------
  if (TB && TB.kitHelpers) {
    const { C, S } = TB.kitHelpers;
    function parliament() {
      const st = [], marble = C("#f4f0e6"), marble2 = C("#dcd6c8"), stone = C("#b8b0a0"), dome = C("#3cbf6c"), gold = C("#ffd23f"), dark = C("#3a2a1a"), glass = C("#8fd3f4"), red = C("#e8443a"), wood = C("#7a4a24");
      // layer 0: the podium, the hall, and the doorway behind the portico
      st.push(S("cube", [0, 0, 50], [1180, 760, 50], { color: stone, round: 0.03 }));
      st.push(S("cube", [0, -80, 420], [1060, 600, 330], { color: marble, round: 0.02 }));
      st.push(S("cube", [0, 520, 220], [130, 30, 170], { m: "sub", color: marble }));
      // layer 1: the portico: six columns, the beam over them and the triangular pediment
      st.push(S("cylinder", [130, 640, 380], [56, 56, 290], { color: marble2, mirror: true, offsX: 130, layer: 1 }));
      st.push(S("cylinder", [390, 640, 380], [56, 56, 290], { color: marble2, mirror: true, offsX: 390, layer: 1 }));
      st.push(S("cylinder", [650, 640, 380], [56, 56, 290], { color: marble2, mirror: true, offsX: 650, layer: 1 }));
      st.push(S("cube", [0, 600, 700], [760, 120, 36], { color: marble, layer: 1 }));
      st.push(S("cube", [0, 600, 830], [760, 100, 100], { color: marble2, cone: 1, layer: 1 }));
      st.push(S("cube", [0, 470, 120], [760, 160, 20], { color: stone, layer: 1 }));
      // layer 2: the drum and the green dome, its lantern and the golden finial
      st.push(S("cylinder", [0, -100, 830], [340, 340, 110], { color: marble2, layer: 2 }));
      st.push(S("sphere", [0, -100, 960], [330, 330, 300], { color: dome, layer: 2 }));
      st.push(S("cylinder", [0, -100, 1290], [70, 70, 60], { color: marble, layer: 2 }));
      st.push(S("sphere", [0, -100, 1380], [44, 44, 44], { color: gold, layer: 2 }));
      // layer 3: the dark doorway, tall windows down the front and the sides, the steps up the podium
      st.push(S("cube", [0, 505, 220], [118, 14, 160], { color: dark, layer: 3 }));
      st.push(S("cube", [300, 524, 470], [50, 10, 130], { color: glass, mirror: true, offsX: 300, layer: 3 }));
      st.push(S("cube", [1064, -60, 470], [10, 60, 130], { color: glass, mirror: true, offsX: 1064, layer: 3 }));
      st.push(S("cube", [1064, -360, 470], [10, 60, 130], { color: glass, mirror: true, offsX: 1064, layer: 3 }));
      st.push(S("cube", [0, 800, 25], [700, 50, 25], { color: stone, layer: 3 }));
      st.push(S("cube", [0, 760, 60], [700, 30, 20], { color: stone, layer: 3 }));
      // layer 4: flags at the front corners
      st.push(S("cylinder", [1000, 560, 760], [14, 14, 300], { color: wood, mirror: true, offsX: 1000, layer: 4 }));
      st.push(S("cube", [1080, 560, 980], [80, 6, 54], { color: red, mirror: true, offsX: 1080, layer: 4 }));
      return st;
    }
    TB.KIT.parliament = { name: "Parliament", group: "Village", variants: [0], build: parliament, voxel: [28, 56], lazy: true };
  }
  if (!G.App) return;
  const App = G.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440, SEATS = 333, S0 = 16 * 60, VOTE = 17 * 60 + 30, S1 = 18 * 60;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const BURN = "0x000000000000000000000000000000000000dead";

  // ---------- the laws that can be voted ----------
  // support(id): how much a Tickle likes the law, 0 to 1 (its holder's ministers vote with their average)
  const armed = (id) => !!(App.gearOf && App.gearOf(id)) || (App.isTamer && App.isTamer(id));
  const fac = (id) => (App.factionOf ? App.factionOf(id) : null);
  const LAWS = (App.LAWS = {
    prizes: { name: "The Prize Act", text: "contest prizes are doubled", mul: 2, support: (id) => 0.5 + (fac(id) === "gamblers" ? 0.2 : 0) + hash2(id, 901, 3) * 0.2 - 0.1 },
    bounty: { name: "The Sea Bounty Act", text: "those who beat a sea beast are paid half as much again", mul: 1.5, support: (id) => 0.45 + (armed(id) ? 0.25 : 0) },
    watch: { name: "The Night Watch Act", text: "the Night Watch catches outlaws twice as often", mul: 2, support: (id) => (fac(id) === "outlaws" ? 0.1 : fac(id) === "watch" ? 0.9 : 0.55) },
    market: { name: "The Fair Market Act", text: "mounts, riding beasts and boats are a fifth cheaper at the Blacksmiths' Guild", mul: 0.8, support: (id) => 0.6 - (App.mountOf && App.mountOf(id) ? 0.2 : 0) + (fac(id) === "merchants" ? -0.2 : 0) },
    restday: { name: "The Rest Day Act", text: "every seventh day is a day of rest: no work and no chores, free time all day", support: (id) => 0.55 + (App.doesChores && App.doesChores(id) ? 0.15 : 0) - (fac(id) === "merchants" ? 0.25 : 0) },
    tax: { name: "The Shell Tax", text: "every evening those with more than 100 shells give 2% of it, shared out among those with fewer than 20", support: (id) => { const w = App.worthOf ? App.worthOf(id) : App.shellsOf(id); return w > 400 ? 0.15 : w > 150 ? 0.4 : 0.7; } },
  });
  App.lawOn = (k) => !!(st.parl && st.parl.laws && st.parl.laws[k] != null);
  App.lawMul = (k) => (App.lawOn(k) ? LAWS[k].mul : 1);
  App.restDay = (day) => App.lawOn("restday") && day % 7 === 6;

  // ---------- the seats: D'Hondt over the holders, and each holder's ministers ----------
  let seatDay = -1, seats = [], blocs = [], ministerOf = new Map();
  function shareSeats() {
    const day = Math.floor(st.T / DAY);
    if (day === seatDay && seats.length) return;
    seatDay = day;
    const groups = new Map();
    for (let id = 0; id < TB.SUPPLY; id++) {
      const o = App.ownerOf(id);
      if (!o || o === BURN) continue;
      (groups.get(o) || groups.set(o, []).get(o)).push(id);
    }
    const list = [...groups].map(([addr, ids]) => ({ addr, ids, n: ids.length, s: 0 }));
    // the D'Hondt method: seat after seat goes to the holder with the biggest Tickles / (seats so far + 1)
    for (let k = 0; k < SEATS; k++) {
      let best = null, bq = -1;
      for (const g of list) { const q = g.n / (g.s + 1); if (q > bq || (q === bq && g.addr < best.addr)) { bq = q; best = g; } }
      best.s++;
    }
    blocs = list.filter((g) => g.s > 0).sort((a, b) => b.s - a.s || (a.addr < b.addr ? -1 : 1));
    // the ministers: a holder's best Tickles (highest level first), never one in the prison or fallen
    seats = []; ministerOf = new Map();
    for (const g of blocs) {
      const best = g.ids.filter((id) => !(App.isListed && App.isListed(id)) && !(App.isDead && App.isDead(id))).sort((a, b) => App.levelOf(b) - App.levelOf(a) || a - b);
      g.ministers = best.slice(0, g.s);
      for (const id of g.ministers) { ministerOf.set(id, { bloc: g, seat: seats.length }); seats.push(id); }
    }
  }
  App.parliamentSeats = () => { shareSeats(); return { seats, blocs }; };
  App.isMinister = (id) => { shareSeats(); return ministerOf.has(id); };
  // who crosses to sit today: most ministers who can reach the launch (the plan decides whether one can)
  App.sitsToday = (id, day) => App.isMinister(id) && !!App.parliament && hash2(id, day, 907) < 0.75;
  App.parliamentSeat = (id) => { const P = App.parliament, a = (hash2(id, 909, 3) - 0.5) * 1.6; return { x: P.door.x + Math.sin(a) * 2.5, z: P.door.z + Math.cos(a) * 2.5, label: "the Parliament (in session)", parl: true }; };

  // ---------- where it stands: on the Maker's Isle, behind the statue, facing it (geo.js) ----------
  App.placeParliament = (H) => {
    const { genColumn, gadd, sc } = H, I = App.ISLE;
    if (!I) return;
    const x = I.x, z = I.z - 31, h = genColumn(x, z).h, scale = 2.5;
    gadd("field", { kind: "parliament", x, z, w: 19, d: 14, h }, x - 22, z - 17, x + 22, z + 17);
    for (const o of App.gridNear("scenery", x, z, 26)) if (!o.building && Math.abs(o.x - x) < 21 && Math.abs(o.z - z) < 16) o.gone = true;
    const P = (App.parliament = { x, z, h, rot: 0, scale, name: "The Parliament" });
    P.sc = sc("parliament_0", x, z, 0, { building: true, fixed: true, parliament: true, scale, water: true });
    P.door = { x, z: z + (860 / 160) * scale + 1.2 };
  };

  // ---------- a sitting: the agenda at four, the vote at half past five ----------
  App.initParliament = (saved) => {
    st.parl = Object.assign({ laws: {}, log: [], agenda: null, day: -1, sat: 0 }, saved || {});
  };
  App.saveParliament = () => st.parl;
  // what the Director has made that nobody has decided on yet, oldest first
  function directorItems() {
    const out = [];
    for (const a of st.assets || []) if (a.source === "director" && (a.status === "pending" || a.status === "auto")) out.push({ type: "asset", obj: a, name: a.name, what: "the design " + a.name, t: a.createdAt || 0 });
    for (const a of st.acts || []) if (a.source === "director" && !a.assetId && !a.project && (a.kind === "mechanic" || a.kind === "event") && (a.status === "pending" || a.status === "auto")) out.push({ type: a.kind, obj: a, name: a.name, what: (a.kind === "event" ? "the event " : "the activity ") + a.name, t: a.createdAt || 0 });
    for (const p of st.projects || []) if (p.source === "director" && (p.status === "pending" || p.status === "auto")) out.push({ type: "project", obj: p, name: p.name, what: "building the " + p.name, t: p.createdAt || 0 });
    return out.sort((a, b) => a.t - b.t);
  }
  function agendaFor(day) {
    const items = [];
    // a law: one not in force, or (now and then) the repeal of one that is
    const off = Object.keys(LAWS).filter((k) => !App.lawOn(k)), on = Object.keys(LAWS).filter((k) => App.lawOn(k) && day - st.parl.laws[k] >= 3);
    const r = hash2(day, 911, 3);
    if (on.length && (r < 0.3 || !off.length)) items.push({ kind: "repeal", law: on[Math.floor(hash2(day, 913, 3) * on.length)] });
    else if (off.length) items.push({ kind: "law", law: off[Math.floor(hash2(day, 915, 3) * off.length)] });
    for (const d of directorItems().slice(0, 2)) items.push({ kind: "director", type: d.type, id: d.obj.id, name: d.name, what: d.what });
    // who proposes each: a minister of one of the bigger blocs
    shareSeats();
    for (const it of items) { const g = blocs[Math.floor(hash2(day, items.indexOf(it), 917) * Math.min(8, blocs.length))]; it.by = g && g.ministers[0] != null ? g.ministers[0] : null; }
    return items;
  }
  const itemName = (it) => (it.kind === "law" ? LAWS[it.law].name : it.kind === "repeal" ? "the repeal of " + LAWS[it.law].name : it.what);
  // how a minister leans on an item
  function lean(id, it) {
    if (it.kind === "law") return LAWS[it.law].support(id);
    if (it.kind === "repeal") return 1 - LAWS[it.law].support(id);
    // the Director's things: liked for how well made they are and for how much the chamber takes to them (some it does not)
    const o = findObj(it), score = o && o.score != null ? o.score / 100 : 0.8;
    let hs = 0;
    for (let k = 0; k < it.id.length; k++) hs = (hs * 31 + it.id.charCodeAt(k)) >>> 0;
    return clamp(0.15 + score * 0.25 + hash2(hs % 100003, 3, 925) * 0.3 + (hash2(id, hs % 9973, 919) - 0.5) * 0.3, 0, 1);
  }
  function findObj(it) {
    if (it.type === "asset") return (st.assets || []).find((a) => a.id === it.id);
    if (it.type === "project") return (st.projects || []).find((p) => p.id === it.id);
    return (st.acts || []).find((a) => a.id === it.id);
  }
  function vote(it, day) {
    shareSeats();
    let yes = 0, no = 0;
    for (const g of blocs) {
      // the bloc's line: its ministers' average leaning; a minister breaks ranks one time in eight
      const m = g.ministers.length ? g.ministers.reduce((s, id) => s + lean(id, it), 0) / g.ministers.length : 0.5;
      const line = m + (hash2(day, g.n, 921) - 0.5) * 0.1 >= 0.5;
      g.ministers.forEach((id, k) => { const v = hash2(id, day, 923 + k) < 0.125 ? !line : line; if (v) yes++; else no++; });
      // seats with no minister to fill them (all its Tickles in the prison): they abstain
    }
    return { yes, no, passed: yes > no };
  }
  function apply(it, res, day) {
    if (it.kind === "law") { if (res.passed) st.parl.laws[it.law] = day; }
    else if (it.kind === "repeal") { if (res.passed) delete st.parl.laws[it.law]; }
    else {
      const o = findObj(it);
      if (o && (o.status === "pending" || o.status === "auto") && App.reviewOne) {
        // the same decision as in Review, told by the Parliament instead of "you"
        const log = App.log;
        App.log = () => {};
        try { App.reviewOne({ type: it.type, obj: o }, res.passed ? "approve" : "reject"); } finally { App.log = log; }
      }
    }
  }
  App.parliamentTick = () => {
    if (!App.parliament || !st.parl) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= S0 && m < S1 && (!st.parl.agenda || st.parl.agenda.day !== day)) {
      st.parl.agenda = { day, items: agendaFor(day), done: false };
      if (st.parl.agenda.items.length) App.log("parliament", "The Parliament sits: " + st.parl.agenda.items.map(itemName).join("; ") + ".", "The vote is at " + App.clock(day * DAY + VOTE).short + ". " + SEATS + " seats; a majority carries it.");
    }
    const A = st.parl.agenda;
    if (A && A.day === day && !A.done && m >= VOTE) {
      A.done = true;
      st.parl.sat++;
      for (const it of A.items) {
        const res = vote(it, day);
        it.res = res;
        apply(it, res, day);
        const nm = itemName(it), by = it.by != null ? App.nameOf(it.by) : null;
        st.parl.log.unshift({ day, name: nm, kind: it.kind, yes: res.yes, no: res.no, passed: res.passed, by });
        App.log("parliament", "Parliament " + (res.passed ? "passed " : "threw out ") + nm + ", " + res.yes + " to " + res.no + ".",
          (by ? "Proposed by " + by + ". " : "") + (it.kind === "law" ? (res.passed ? "From now on " : "It would have meant that ") + LAWS[it.law].text + "." : it.kind === "repeal" ? (res.passed ? "No longer: " : "Still in force: ") + LAWS[it.law].text + "." : res.passed ? "It stays in the world." : "It is taken out of the world."));
        if (App.toast && (it.kind !== "director" || res.passed)) App.toast("Parliament " + (res.passed ? "passed " : "threw out ") + nm + " (" + res.yes + "–" + res.no + ")");
      }
      st.parl.log = st.parl.log.slice(0, 40);
      if (App.refresh) App.refresh(true);
    }
    // the Shell Tax, every evening
    if (App.lawOn("tax") && st.parl.taxDay !== day && m >= 20 * 60) { st.parl.taxDay = day; shellTax(); }
  };
  function shellTax() {
    let pot = 0;
    const poor = [];
    for (let id = 0; id < TB.SUPPLY; id++) {
      if (App.isDead && App.isDead(id)) continue;
      const s = App.shellsOf(id);
      if (s > 100) { const t = Math.floor(s * 0.02); App.pay(id, -t); pot += t; }
      else if (s < 20) poor.push(id);
    }
    if (!poor.length) return;
    const each = Math.floor(pot / poor.length);
    if (each > 0) for (const id of poor) App.pay(id, each);
    st.parl.taxed = { pot, poor: poor.length, each };
  }

  // ---------- ministers near you: over on the launch, then in the chamber until the sitting ends ----------
  App.parliamentBrain = (t, step) => {
    if (step.k !== "parliament") return false;
    const P = step.p;
    if (Math.hypot(P.x - t.pos.x, P.z - t.pos.z) > 2.2) { App.startTravel(t, P, "to the Parliament"); return true; }
    t.action = { kind: "rounds", parl: true, until: Math.floor(st.T / DAY) * DAY + step.e, started: st.T, bye: pick(["Order, order!", "A good session.", "The people have spoken."]), what: "In the Parliament" };
    return true;
  };

  // ---------- the chamber: 333 seats in rows round the Speaker's chair ----------
  // seat k of the hemicycle (the blocs side by side from left to right), as { x, z, rot } in the room
  App.chamberSeats = (R) => {
    const out = [], cz = -R.d / 2 + 4;
    let r = 6.5;
    while (out.length < SEATS) {
      const n = Math.min(SEATS - out.length, Math.floor((Math.PI * 0.92 * r) / 1.9));
      for (let k = 0; k < n; k++) { const a = Math.PI * 0.04 + (Math.PI * 0.92 * (k + 0.5)) / n, x = -Math.cos(a) * r, z = cz + Math.sin(a) * r; out.push({ x, z, rot: Math.atan2(-x, cz - z), row: r }); }
      r += 1.9;
    }
    // ordered by angle across all the rows, so a bloc sits together in a wedge
    return out.sort((a, b) => Math.atan2(a.z - cz, -a.x) - Math.atan2(b.z - cz, -b.x) || a.row - b.row);
  };
  App.chamberOccupants = (R) => {
    shareSeats();
    const day = Math.floor(st.T / DAY), out = [], P = App.parliament;
    seats.forEach((id, k) => {
      const ag = App.pop.agent[id], step = App.planStep(id, st.T).step;
      const here = ag ? !!(ag.action && ag.action.kind === "rounds" && ag.action.parl) : step.k === "parliament" && App.planPos(id, st.T).inside;
      if (here && R.seats[k] && out.length < 120) out.push({ id, pose: "seat", at: R.seats[k] });
    });
    return out;
  };
  App.parliamentNote = () => {
    const A = st.parl && st.parl.agenda, day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (!A || A.day !== day || !A.items.length) return "No sitting right now: the Parliament sits every afternoon from 16:00, and votes at 17:30.";
    return (A.done ? "Today's votes: " + A.items.map((it) => itemName(it) + (it.res ? (it.res.passed ? " passed " : " failed ") + it.res.yes + "–" + it.res.no : "")).join("; ") : "On the agenda: " + A.items.map(itemName).join("; ") + ". The vote is at 17:30.") + (m < S1 ? "" : "");
  };

  // ---------- the cards ----------
  App.parliamentInfo = () => {
    const P = App.parliament;
    if (!P) return null;
    shareSeats();
    const laws = Object.keys(LAWS).filter((k) => App.lawOn(k));
    const rows = [["Seats", SEATS + ", shared out among " + blocs.length + " holders by how many Tickles each has (D'Hondt)"],
      ["Biggest blocs", blocs.slice(0, 4).map((g) => esc(g.addr.slice(0, 6) + "…" + g.addr.slice(-4)) + " " + g.s).join(", ")],
      ["Laws in force", laws.length ? laws.map((k) => esc(LAWS[k].name)).join(", ") : "none yet"],
      ["Today", esc(App.parliamentNote())]];
    const L = st.parl.log[0];
    if (L) rows.push(["Last vote", esc(L.name) + (L.passed ? " passed " : " failed ") + L.yes + "–" + L.no]);
    return { name: P.name, sub: "On the Maker's Isle · sits every afternoon", rows,
      text: "<p>The Tickles' democracy. Every holder has seats by how many Tickles it holds, and sends its best Tickles as ministers. Each afternoon they put a law to the vote, and everything new the Director has come up with too: what passes is done, what fails goes. Go inside to see the chamber when it sits.</p>" };
  };
  App.parliamentHTML = () => {
    if (!App.parliament || !st.parl) return "";
    shareSeats();
    let h = '<div class="card"><h3>The Parliament</h3><p class="note">' + SEATS + " seats on the Maker's Isle, shared out among " + blocs.length + " holders by how many Tickles each has (D'Hondt); every holder sends its best Tickles as ministers and they vote together. It sits every afternoon from 16:00 and votes at 17:30: a law, and whatever the Director has come up with. " + esc(App.parliamentNote()) + "</p><div class=\"kv\">";
    for (const k in LAWS) h += '<span class="k">' + esc(LAWS[k].name) + "</span><span>" + (App.lawOn(k) ? "<b>in force</b> since day " + (st.parl.laws[k] + 1) + ": " : '<span class="note">not in force: </span>') + esc(LAWS[k].text) + "</span>";
    h += "</div>";
    if (st.parl.log.length) h += '<p class="note">' + st.parl.log.slice(0, 6).map((L) => "Day " + (L.day + 1) + ": " + esc(L.name) + (L.passed ? " passed " : " failed ") + L.yes + "–" + L.no).join("<br>") + "</p>";
    return h + "</div>";
  };
})(typeof self !== "undefined" ? self : this);
