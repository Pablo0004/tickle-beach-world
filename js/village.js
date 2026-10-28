/* Village life: clans (every holder's place is its own clan: an estate, a mansion, or a town of small
 * holders), the granary and its food, the afternoon chores
 * that fill it (farming, hunting, herding, gathering, fishing), raids between hungry clans and
 * their rivals, knock-outs (nobody dies), and the dragons that attack everyone. All of it runs
 * for every village, watched or not; near the player the same events are acted out in 3D. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const hash2 = App.hash2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const NC = TB.CLANS.length;
  const DAY = 1440;

  // ---------- clans: every place is one (its holder's house, or a town's folk) ----------
  const shortAddr = (a) => (a && a.length > 12 ? a.slice(0, 6) + "\u2026" + a.slice(-4) : a || "");
  App.shortAddr = shortAddr;
  App.clanName = (c) => { const v = App.villages[c]; if (!v) return "?"; return v.kind === "town" ? v.name + " folk" : (st.wallet && v.holder === st.wallet ? "your house" : "the house of " + shortAddr(v.holder)); };
  App.clanColor = (c) => { const v = App.villages[c]; return TB.CLANS[v ? v.style : 0].color; };
  App.clanOfVillage = (v) => v.clan;
  // what kind of place it is, and whose
  App.placeKindText = (v) => {
    const whose = (what) => (st.wallet && v.holder === st.wallet ? "your " + what : "the " + what + " of " + shortAddr(v.holder)) + " (" + v.residents.length + " Tickles)";
    const t = v.kind === "fortress" || v.kind === "keep" || v.kind === "citadel" ? whose(v.kind === "citadel" ? "citadel" : "fortress").replace(" Tickles)", " Tickles in its castle)") : v.kind === "grand" ? whose("estate").replace(" Tickles)", " Tickles in " + v.slots.length + " mansion" + (v.slots.length === 1 ? "" : "s") + ")") : v.kind === "medium" ? whose("plot").replace(" Tickles)", " Tickles in 4 houses)") : "a town of small holders (" + v.households.length + " households)";
    return v.warren ? t + ", underground in a warren until a plot is free" : t;
  };
  // relations between the clans: neutral (50) unless something has happened between them
  const relKey = (a, b) => Math.min(a, b) + ":" + Math.max(a, b);
  App.clanRel = (a, b) => (a === b ? 100 : st.clanRel && st.clanRel[relKey(a, b)] != null ? st.clanRel[relKey(a, b)] : 50);
  function bumpClan(a, b, d) { if (a !== b) st.clanRel[relKey(a, b)] = clamp(App.clanRel(a, b) + d, 0, 100); }
  App.relWord = (v) => (v >= 75 ? "allies" : v >= 55 ? "friendly" : v >= 35 ? "wary" : "rivals");

  // ---------- the map's layout: plots that never move, and every holder on one (geo.js) ----------
  // A save from another layout (before the plots) keeps what belongs to each Tickle (level, shells, arms, relics,
  // creatures, Ethernum, medals, mounts and boats) and starts what belongs to the old villages afresh (granaries,
  // ruins, things moved by hand, the Underworld's progress by village). A save from this layout keeps everything:
  // when ownership has changed since, App.reconcilePlots carries each place's things over to where it is now.
  App.LAYOUT = "plots-3"; // plots-2: the sizes of 16 October (houses, small plots, a mansion for every 20); plots-3: the Maker's Isle grown for the Parliament, and the prison
  App.migrateLayout = (S) => {
    if (S.layout === App.LAYOUT) return false;
    S.moved = {};
    S.villages = null;
    if (S.fate) S.fate = { fallen: S.fate.fallen || {}, rituals: {}, ruins: {}, broken: {} };
    if (S.dungeons) S.dungeons = { lv: S.dungeons.lv, relics: S.dungeons.relics, uwlog: S.dungeons.uwlog, parties: {}, delves: {}, conquered: {}, depth: {}, guardians: {} };
    if (S.mines) S.mines = { ore: {}, mineLog: S.mines.mineLog };
    S.lairs = null;
    if (S.rampage) S.rampage = { slain: {}, slayers: S.rampage.slayers, gear: S.rampage.gear };
    if (S.factions) { S.factions.hunts = {}; S.factions.hiding = {}; S.factions.nights = {}; S.factions.trades = {}; }
    if (S.contests) S.contests.contests = {};
    if (S.wealth && S.wealth.own) { for (const id in S.wealth.own) { delete S.wealth.own[id].h; if (!Object.keys(S.wealth.own[id]).length) delete S.wealth.own[id]; } S.wealth.orders = null; }
    S.plots = null;
    S.log = [{ t: S.T || 0, kind: "world", text: "The island has been rebuilt: every holder now has its own place.", why: "Estates for the big holders, mansions for the middling ones, a house in a shared town for the small ones, and a warren underground for whoever the plots cannot hold. Every Tickle kept its level, its shells, its arms, its relics and its creatures." }].concat(S.log || []);
    S.layout = App.LAYOUT;
    return true;
  };

  // ---------- when ownership has changed since the save ----------
  // A place is known by who it is (its holder; a town by its plot), so a holder who moved to another plot, or up out
  // of a warren, keeps its granary, its friendships and its record in the Underworld. The pieces made after the
  // fixed scenery (houses, the outer logs, the warrens) are known by their key (place and slot), so ruins and things
  // moved by hand follow them. What belonged to places that are gone, and short-lived business between places
  // (raids under way, parties, trades, contests, rituals), starts afresh.
  App.plotsSave = () => (App.plotsAssigned ? { lots: App.plotsAssigned.lots, warrens: App.plotsAssigned.warrens, keys: App.villages.map((v) => v.key), ids: App.villages.map((v) => v.ident),
    names: App.villages.map((v) => v.name), tail: { start: App.tailStart, keys: App.tailKeys } } : null);
  App.homeKeyOf = (id) => { const v = App.villageOfToken(id); if (!v) return null; const H = v.homes[v.residents.indexOf(id)]; return H && H.sc ? H.sc.tkey || null : null; };
  App.placeName = (i, fallback) => (App.villages[i] ? App.villages[i].name : fallback || "a place that is gone");
  App.reconcilePlots = (S) => {
    const P = S && S.plots;
    if (!P || S.layout !== App.LAYOUT || !P.ids || !P.keys) return false;
    const now = new Map(App.villages.map((v) => [v.ident, v.i])), map = P.ids.map((id) => (now.has(id) ? now.get(id) : -1));
    const T = P.tail || { start: 0, keys: [] }, tailNow = new Map(App.tailKeys.map((k, i) => [k, App.tailStart + i]));
    const sameV = map.length === App.villages.length && map.every((k, i) => k === i);
    const sameT = T.start === App.tailStart && T.keys.length === App.tailKeys.length && T.keys.every((k, i) => k === App.tailKeys[i]);
    if (sameV && sameT) return false;
    const V = (i) => (i >= 0 && i < map.length ? map[i] : -1);
    const reKeys = (obj) => { const out = {}; for (const k in obj || {}) { const n = V(+k); if (n >= 0) out[n] = obj[k]; } return out; };
    // a piece of scenery: the fixed ones keep their index; a tail piece follows its key while its place is the same place
    const identOf = new Map(P.keys.map((k, i) => [k, P.ids[i]]));
    const idx = (k) => {
      k = +k;
      if (k < T.start) return k;
      const key = T.keys[k - T.start];
      if (!key) return -1;
      const place = key.split("/")[0], v = App.placeByKey.get(place);
      if (!v || identOf.get(place) !== v.ident) return -1;
      return tailNow.has(key) ? tailNow.get(key) : -1;
    };
    const reIdx = (obj) => { const out = {}; for (const k in obj || {}) { const n = idx(k); if (n >= 0) out[n] = obj[k]; } return out; };
    if (S.villages) {
      const food = new Array(App.villages.length), rel = {};
      (S.villages.food || []).forEach((f, i) => { const n = V(i); if (n >= 0) food[n] = f; });
      for (const k in S.villages.clanRel || {}) { const [a, b] = k.split(":").map(Number), A = V(a), B = V(b); if (A >= 0 && B >= 0 && A !== B) rel[Math.min(A, B) + ":" + Math.max(A, B)] = S.villages.clanRel[k]; }
      S.villages.food = food; S.villages.clanRel = rel; S.villages.raids = []; S.villages.attacks = [];
    }
    if (S.dungeons) {
      const D = S.dungeons;
      D.conquered = reKeys(D.conquered); D.depth = reKeys(D.depth); D.parties = {};
      const fix = (o, chosen) => { if (chosen) return; const n = V(o.village); if (n >= 0) o.village = n; else { o.vname = o.vname || P.names[o.village] || null; o.village = -2; } };
      for (const f in D.guardians || {}) fix(D.guardians[f], D.guardians[f].chosen);
      for (const e of D.uwlog || []) fix(e, e.village === -1);
    }
    if (S.fate) {
      for (const id in S.fate.fallen || {}) S.fate.fallen[id].village = App.pop.village[+id];
      const ruins = {};
      for (const k in S.fate.ruins || {}) {
        const n = idx(k), r = S.fate.ruins[k], s0 = n >= 0 ? App.sceneryAll[n] : null;
        if (!s0) continue;
        if (r.village != null) { r.village = V(r.village); if (r.village < 0 || (s0.village != null && s0.village !== r.village)) continue; }
        ruins[n] = r;
      }
      S.fate.ruins = ruins; S.fate.broken = reIdx(S.fate.broken); S.fate.rituals = {};
    }
    S.moved = reIdx(S.moved);
    if (S.mines) S.mines.ore = reKeys(S.mines.ore);
    if (S.lairs && S.lairs.anger) for (const k in S.lairs.anger) { const A = S.lairs.anger[k]; if (A && A.by != null) { const n = V(A.by); A.by = n >= 0 ? n : null; } }
    if (S.factions) { S.factions.nights = {}; S.factions.trades = {}; }
    if (S.contests) S.contests.contests = {};
    if (S.wealth) {
      for (const id in S.wealth.own || {}) { const o = S.wealth.own[id]; if (o.h && o.hk !== App.homeKeyOf(+id)) { delete o.h; delete o.hk; } }
      S.wealth.orders = null;
    }
    S.event = null;
    const oldKey = new Map(P.ids.map((id, i) => [id, P.keys[i]]));
    const moved = App.villages.filter((v) => oldKey.get(v.ident) !== v.key).length;
    S.log = [{ t: S.T || 0, kind: "world", text: "Ownership has changed: the plots have new neighbours.", why: moved ? moved + " place" + (moved === 1 ? " is" : "s are") + " new or moved; everyone else kept their plot, their granary and their friends." : "Everyone kept their plot; some households moved house." }].concat(S.log || []);
    return true;
  };

  // ---------- chores: what each Tickle does for the village in the afternoon ----------
  const CHORE_INFO = (App.CHORE_INFO = {
    farm: { title: "Farmer", label: "Farming", verb: "is tending the crops", rate: 1.15, needs: { fun: 4, energy: -10 } },
    hunt: { title: "Hunter", label: "Hunting", verb: "is out hunting", rate: 1.3, needs: { fun: 10, energy: -12 } },
    pigs: { title: "Pig breeder", label: "Pig farming", verb: "is feeding the pigs", rate: 0.95, needs: { fun: 6, energy: -8 } },
    sheep: { title: "Shepherd", label: "Shepherding", verb: "is out with the flock", rate: 0.9, needs: { fun: 8, social: 2, energy: -6 } },
    chickens: { title: "Poultry keeper", label: "Keeping hens", verb: "is collecting eggs", rate: 0.85, needs: { fun: 6, energy: -4 } },
    gather: { title: "Gatherer", label: "Gathering", verb: "is gathering fruit", rate: 0.85, needs: { fun: 6, energy: -6 } },
    build: { title: "Builder", label: "Rebuilding", verb: "is rebuilding a house", rate: 0, needs: { fun: 4, social: 6, energy: -10 } },
    fish: { title: "Fisher", label: "Fishing", verb: "is fishing for the village", rate: 1.0, needs: { fun: 8, energy: -6 } },
  });
  App.choreOf = (id) => {
    if (App.jobOf(id) === "fisher") return "fish";
    const h = hash2(id, 11, 3);
    const v = App.villageOfToken(id);
    const c = h < 0.5 ? "farm" : h < 0.68 ? "hunt" : h < 0.76 ? "pigs" : h < 0.82 ? "sheep" : h < 0.87 ? "chickens" : "gather";
    // a village without that pen sends them to the fields instead
    if ((c === "pigs" && !v.pen) || (c === "sheep" && !v.fold) || (c === "chickens" && !v.yard)) return "farm";
    return c;
  };
  App.doesChores = (id) => hash2(id, 15, 3) < 0.82;
  App.chorePlace = (id) => {
    const v = App.villageOfToken(id), c = App.choreOf(id);
    const j = (k, r) => (hash2(id, k, 3) - 0.5) * r;
    if (c === "farm" && v.warren) return { x: v.hall.door.x + j(13, 4), z: v.hall.door.z + j(14, 4), type: "plaza", label: "the mushroom beds of " + v.name, cx: v.hall.x, cz: v.hall.z };
    if (c === "farm" && v.fields.length) {
      const f = v.fields[Math.floor(hash2(id, 12, 3) * v.fields.length)];
      return { x: f.x + j(13, f.w * 1.7), z: f.z + j(14, f.d * 1.7), type: "field", label: "the fields of " + v.name, field: f.i, cx: f.x, cz: f.z };
    }
    if (c === "hunt") return { x: v.hunt.x + j(16, 18), z: v.hunt.z + j(17, 18), type: "hunt", label: "the hunting grounds near " + v.name, cx: v.hunt.x, cz: v.hunt.z };
    if (c === "gather") return { x: v.gather.x + j(18, 16), z: v.gather.z + j(19, 16), type: "gather", label: "the groves near " + v.name, cx: v.gather.x, cz: v.gather.z };
    if (c === "fish") { const w = App.workplaceOf(id); return Object.assign({}, w, { type: w.type || "shore" }); }
    if (c === "pigs") { const p = v.pen; return { x: p.trough.x + j(20, 2), z: p.trough.z + j(21, 2), type: "pen", label: "the pig pen of " + v.name, cx: p.trough.x, cz: p.trough.z }; }
    if (c === "chickens") { const p = v.yard; return { x: p.x + j(20, 3), z: p.z + j(21, 3), type: "pen", label: "the hen yard of " + v.name, cx: p.coop.x, cz: p.coop.z }; }
    // the shepherd starts at the sheepfold gate and leads the flock out from there
    if (c === "sheep") return { x: v.fold.gateOut.x, z: v.fold.gateOut.z, type: "fold", label: "the sheepfold of " + v.name, cx: v.fold.x, cz: v.fold.z };
    return { x: v.x + j(20, 10), z: v.z + j(21, 10), type: "plaza", label: v.name + " square", cx: v.x, cz: v.z };
  };

  // ---------- food ----------
  // per-hour output of a village's chores; fields, game and fruit nearby make a difference
  function workRate(v) {
    const crew = { farm: 0, hunt: 0, pigs: 0, sheep: 0, chickens: 0, gather: 0, fish: 0 };
    for (const id of v.residents) if (App.doesChores(id)) crew[App.choreOf(id)]++;
    v.crew = crew;
    const fieldK = v.warren ? 1 : v.fields.length ? Math.min(1.2, v.fields.length / 2.4) : 0.4, tools = App.toolBonus ? App.toolBonus(v) : 1;
    return { farm: crew.farm * CHORE_INFO.farm.rate * v.fert * fieldK * tools,
      other: tools * crew.hunt * CHORE_INFO.hunt.rate * v.game + (crew.pigs * CHORE_INFO.pigs.rate + crew.sheep * CHORE_INFO.sheep.rate + crew.chickens * CHORE_INFO.chickens.rate) + crew.gather * CHORE_INFO.gather.rate * v.fruit + crew.fish * CHORE_INFO.fish.rate };
  }
  App.initVillages = (saved) => {
    st.clanRel = saved && saved.clanRel && !Array.isArray(saved.clanRel) ? saved.clanRel : {};
    st.raids = (saved && saved.raids) || [];
    st.attacks = (saved && saved.attacks) || [];
    for (const v of App.villages) {
      v.fert = 0.8 + hash2(v.i, 1, 41) * 0.45;
      v.game = 0.6 + hash2(v.i, 2, 41) * 0.7;
      v.fruit = 0.7 + hash2(v.i, 3, 41) * 0.6;
      v.rate = workRate(v);
      v.food = v.residents.length * 3;
      v.fed = 1;
    }
    if (saved && saved.food) saved.food.forEach((f, i) => { if (App.villages[i]) App.villages[i].food = f; });
    if (saved && saved.fieldsBurnt) for (const [i, until] of saved.fieldsBurnt) if (App.fields[i]) App.fields[i].burnt = until;
    if (saved && saved.ko) for (const [id, until] of saved.ko) App.pop.ko[id] = until;
    reindex();
  };
  App.saveVillages = () => ({
    food: App.villages.map((v) => Math.round(v.food * 10) / 10), clanRel: st.clanRel, raids: st.raids, attacks: st.attacks,
    fieldsBurnt: App.fields.filter((f) => f.burnt > st.T).map((f) => [f.i, f.burnt]),
    ko: (() => { const out = [], K = App.pop.ko; for (let i = 0; i < K.length; i++) if (K[i] > st.T) out.push([i, Math.round(K[i])]); return out; })(),
  });
  App.villageFull = (v) => v.food >= v.residents.length * 2;
  App.foodWord = (v) => { const d = v.food / v.residents.length; return d >= 4 ? "plenty" : d >= 2 ? "enough" : d >= 1 ? "running low" : "almost empty"; };

  const MEALS = [7 * 60, 13 * 60, 19 * 60 + 30];
  const overlap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  // called every 15 game minutes from the population tick, for every village
  App.economyTick = (T0, T1) => {
    if (App.rebuildTick) App.rebuildTick(T0, T1);
    for (const v of App.villages) {
      const n = v.residents.length;
      for (let day = Math.floor(T0 / DAY); day <= Math.floor(T1 / DAY); day++) {
        const d0 = day * DAY, yieldK = 0.75 + hash2(v.i, day, 5) * 0.5;
        const burnt = v.fields.length ? v.fields.filter((f) => f.burnt > T1).length / v.fields.length : 0;
        const hrs = overlap(T0, T1, d0 + 14 * 60, d0 + 17 * 60 + 30) / 60;
        const allHands = v.food < n * 1.5 ? 1.25 : 1; // a hungry village sends everyone out to work
        v.food += hrs * (v.rate.farm * (1 - burnt) + v.rate.other) * yieldK * allHands;
        for (const m of MEALS) if (T0 < d0 + m && T1 >= d0 + m) {
          const need = n;
          if (v.food >= need) { v.food -= need; v.fed = 1; } else { v.fed = need ? v.food / need : 1; v.food = 0; }
        }
      }
      v.food = clamp(v.food, 0, n * 9);
    }
  };

  // ---------- knock-outs ----------
  App.isKO = (id) => App.pop.ko[id] > st.T;
  App.knockOut = (id, mins, why) => {
    App.pop.ko[id] = Math.max(App.pop.ko[id], st.T + (mins || 300));
    const t = App.pop.agent[id];
    if (t) { App.endAction(t); t.action = { kind: "ko", until: st.T + 22, started: st.T }; App.say(t, why || "KO!", 6); }
  };

  // ---------- raids ----------
  let raidBy = new Map(), defendBy = new Map();
  function reindex() {
    raidBy = new Map(); defendBy = new Map();
    for (const r of st.raids) if (!r.done) for (const id of r.raiders) raidBy.set(id, r);
    for (const a of st.attacks) if (!a.done) for (const vi of a.helpers) for (const id of App.villages[vi].residents) defendBy.set(id, a);
  }
  App.raidOf = (id, day) => { const r = raidBy.get(id); return r && r.day === day && !r.done ? r : null; };
  App.defendOf = (id, day) => { const a = defendBy.get(id); return a && a.day === day && !a.done ? a : null; };
  App.raidById = (rid) => st.raids.find((r) => r.id === rid);
  App.attackById = (aid) => st.attacks.find((a) => a.id === aid);
  // anyone whose plan changes gets a fresh plan, and stops what it is doing if it is on screen
  function replan(ids) {
    for (const id of ids) {
      App.invalidatePlan(id);
      const t = App.pop.agent[id];
      if (t && t.action && t.action.kind !== "ko" && !t.action.order) App.endAction(t);
    }
  }
  const near = (v) => Math.hypot(v.x - App.cam.target.x, v.z - App.cam.target.z) < 520;
  function planRaids(day) {
    let count = 0, far = 0;
    for (const v of App.villages) {
      const n = v.residents.length;
      // at 17:00 the day's harvest is in; a village that cannot cover dinner, breakfast and lunch is hungry
      if (v.food >= n * 2.3) continue;
      const want = clamp((2.3 - v.food / n) / 2.3, 0, 1);
      if (hash2(v.i, day, 21) > 0.25 + want * 0.6) continue;
      const targets = App.gridNear("village", v.x, v.z, 230).filter((o) => o.clan !== v.clan && Math.hypot(o.x - v.x, o.z - v.z) < 230 &&
        o.food > o.residents.length * 3.2 && App.clanRel(v.clan, o.clan) < 65 && !st.raids.some((r) => r.day === day && r.to === o.i));
      if (!targets.length) continue;
      const score = (o) => o.food / o.residents.length - Math.hypot(o.x - v.x, o.z - v.z) / 70;
      targets.sort((a, b) => score(b) - score(a));
      const o = targets[0];
      const fighters = v.residents.filter((id) => !(App.pop.ko[id] > day * DAY + 19 * 60)).sort((a, b) => hash2(a, day, 23) - hash2(b, day, 23)).slice(0, 4 + Math.round(want * 3));
      if (fighters.length < 3) continue;
      const dist = App.pathLength(App.route(v.x, v.z, o.granary.x, o.granary.z));
      const s = day * DAY + 19 * 60 + 30, arrive = s + dist / App.WALK_SPEED + 6;
      if (arrive > day * DAY + 22 * 60 + 30) continue;
      const r = { id: App.uid("raid"), day, from: v.i, to: o.i, raiders: fighters, s, arrive, end: arrive + 35, done: false, looted: 0, live: false, fights: 0, kos: 0 };
      st.raids.push(r);
      for (const id of fighters) raidBy.set(id, r);
      replan(fighters);
      count++;
      if (near(v) || near(o)) App.log("raid", "The hungry people of " + v.name + " plan a raid on " + o.name + " (" + App.clanName(o.clan) + ") tonight.",
        v.name + "'s granary is " + App.foodWord(v) + " (" + Math.round(v.food) + " food for " + n + " Tickles); " + o.name + " has " + Math.round(o.food) + ". " + fighters.length + " of them will set off at 19:30.", { raid: r.id });
      else far++;
    }
    if (far) App.log("raid", far + " more raid" + (far > 1 ? "s are" : " is") + " planned elsewhere tonight.", "Villages whose granaries run low go after richer rival clans nearby.");
    st.raids = st.raids.filter((r) => r.day >= day - 2);
    return count;
  }
  function pick(list, n, salt) { return list.slice().sort((a, b) => hash2(a, salt, 29) - hash2(b, salt, 29)).slice(0, Math.max(0, n)); }
  function resolveRaid(r) {
    r.done = true;
    const v = App.villages[r.from], o = App.villages[r.to];
    let stolen;
    const rr = (k) => hash2(r.day * 7 + r.from, r.to, k);
    if (r.live) stolen = Math.min(o.food, r.looted);
    else {
      const A = r.raiders.filter((id) => !(App.pop.ko[id] > r.arrive)).length;
      const D = Math.round(o.residents.filter((id) => !(App.pop.ko[id] > r.arrive)).length * 0.5);
      const sa = A * (0.9 + rr(1) * 0.4), sd = D * 0.5 * (0.9 + rr(2) * 0.4), p = sa / (sa + sd || 1);
      const won = rr(3) < p;
      stolen = won ? Math.min(o.food * 0.35, A * 4) : Math.min(o.food * 0.05, A * 0.5);
      const ka = pick(r.raiders, Math.round(A * (1 - p) * rr(4) * 1.3), r.day * 3 + 1), kd = pick(o.residents, Math.round(A * p * 0.7 * rr(5)), r.day * 3 + 2);
      // now and then a raid costs a life (the village will bring it back)
      for (const id of ka.concat(kd)) { if (hash2(id, r.day, 131) < 0.06) App.kill(id, "in a raid between " + v.name + " and " + o.name); else App.pop.ko[id] = Math.max(App.pop.ko[id], r.arrive + 300); }
      r.kos = ka.length + kd.length;
    }
    o.food -= stolen; v.food += stolen;
    r.stolen = stolen;
    if (App.resultCard && (r.live || near(o))) App.resultCard({ kind: "Raid \u00b7 " + v.name + " on " + o.name, title: stolen > 5 ? v.name + " got away with it" : o.name + " beat them back", good: stolen > 5 ? false : true,
      score: Math.round(stolen) + " food taken", lines: [(r.kos ? r.kos + " knocked out" : "Nobody hurt"), (r.fights ? r.fights + " fights at the granary" : "")] });
    bumpClan(v.clan, o.clan, -8);
    if (near(v) || near(o) || r.live)
      App.log("raid", stolen > 5 ? "The raiders from " + v.name + " got away with " + Math.round(stolen) + " food from " + o.name + "." : o.name + " beat back the raid from " + v.name + ".",
        (r.kos ? r.kos + " Tickle" + (r.kos > 1 ? "s were" : " was") + " knocked out and went home to recover. " : "Nobody was hurt. ") + v.name + " and " + o.name + " are now " + App.relWord(App.clanRel(v.clan, o.clan)) + ".", { raid: r.id });
    for (const id of r.raiders) raidBy.delete(id);
  }

  // ---------- dragons ----------
  const FLY = 11; // cells per game minute
  function planDragons(day) {
    if (!App.kitOn("dragon")) return;
    const taken = new Set();
    for (const L of App.lairs) {
      if (hash2(L.i, day, 31) > 0.35 || (App.dragonHiding && App.dragonHiding(L)) || (App.dragonSlain && App.dragonSlain(L)) || st.attacks.some((x) => x.lair === L.i && x.wrath && x.day === day)) continue;
      // each region's dragon preys on the villages of its own region
      const cands = App.villages.filter((v) => (L.region != null ? v.region === L.region : Math.hypot(v.x - L.x, v.z - L.z) < 470) && !taken.has(v.i));
      if (!cands.length) continue;
      const score = (v) => v.food / v.residents.length + hash2(v.i, day, 35) * 2 - Math.hypot(v.x - L.x, v.z - L.z) / 200;
      cands.sort((a, b) => score(b) - score(a));
      const o = cands[0];
      taken.add(o.i);
      const flight = Math.hypot(o.x - L.x, o.z - L.z) / FLY;
      const t0 = day * DAY + 20 * 60 + 30 + hash2(L.i, day, 33) * 140;
      const helpers = App.villages.filter((v) => Math.hypot(v.x - o.x, v.z - o.z) < 150).map((v) => v.i);
      const a = { id: App.uid("drg"), day, lair: L.i, look: L.look, to: o.i, depart: t0 - flight, t0, t1: t0 + 55, back: t0 + 55 + flight, hp: 100, maxHp: 100, power: 70 + hash2(L.i, day, 37) * 50,
        helpers, live: false, done: false, burned: 0, stolen: 0, kos: 0, hits: 0 };
      st.attacks.push(a);
      const ids = [];
      for (const vi of helpers) for (const id of App.villages[vi].residents) { defendBy.set(id, a); ids.push(id); }
      replan(ids);
      const clans = [...new Set(helpers.map((vi) => App.villages[vi].clan))];
      App.log("dragon", "Lookouts on " + L.name + " see a " + TB.DRAGON_LOOKS[L.look].name.toLowerCase() + " dragon stirring. It is heading for " + o.name + ".",
        "It should reach " + o.name + " (" + App.clanName(o.clan) + ") around " + App.clock(t0).short + ". " + (helpers.length > 1 ? helpers.length + " places nearby will stand together against it." : "Its people will stand against it alone."), { attack: a.id });
    }
    st.attacks = st.attacks.filter((a) => a.day >= day - 2);
  }
  function resolveAttack(a) {
    a.done = true;
    const o = App.villages[a.to], L = App.lairs[a.lair];
    const rr = (k) => hash2(a.day * 13 + a.lair, a.to, k);
    const defenders = [];
    for (const vi of a.helpers) for (const id of App.villages[vi].residents) if (!(App.pop.ko[id] > a.t0)) defenders.push(id);
    const D = defenders.length * 0.7;
    if (!a.live) {
      const ratio = D / a.power;
      a.burned = ratio > 1.6 ? 0 : ratio > 1 ? 1 : 2;
      a.stolen = Math.min(o.food * 0.5, Math.max(4, (a.power - D) * 0.35 + 6));
      const kd = pick(defenders, 2 + Math.floor(rr(1) * 4), a.day * 5 + a.lair);
      for (const id of kd) { if (hash2(id, a.day, 133) < 0.3) App.kill(id, "fighting the dragon at " + o.name); else App.pop.ko[id] = Math.max(App.pop.ko[id], a.t0 + 330); }
      // its fire takes a house or two
      const standing = o.homes.filter((h) => h.sc && !h.sc.ruined);
      for (let k = 0; k < (a.burned > 1 ? 2 : a.burned); k++) { const h = standing[Math.floor(hash2(a.day * 7 + k, a.to, 135) * standing.length)]; if (h) App.ruin(h.sc, "by the dragon's fire"); }
      a.kos = kd.length;
      for (const f of o.fields.slice(0, a.burned)) f.burnt = a.t1 + DAY;
    }
    o.food = Math.max(0, o.food - a.stolen);
    if (App.resultCard && (a.live || near(o))) App.resultCard({ kind: "Dragon attack \u00b7 " + o.name, title: "The dragon was driven off", good: !a.burned, score: Math.round(a.stolen) + " food lost" + (a.burned ? " \u00b7 " + a.burned + " field" + (a.burned > 1 ? "s" : "") + " burned" : ""), lines: [(a.kos ? a.kos + " defenders knocked out" : "No defender hurt"), a.helpers.length > 1 ? a.helpers.length + " places fought side by side" : ""] });
    const clans = [...new Set(a.helpers.map((vi) => App.villages[vi].clan))];
    for (let i = 0; i < clans.length; i++) for (let j = i + 1; j < clans.length; j++) bumpClan(clans[i], clans[j], clans[i] === o.clan || clans[j] === o.clan ? 7 : 4);
    for (const id of defenders) defendBy.delete(id);
    const names = clans.map((c) => App.villages[c].name);
    App.log("dragon", (clans.length > 1 ? "Tickles of " + clans.length + " places" : "The people of " + o.name) + " drove the " + TB.DRAGON_LOOKS[a.look].name.toLowerCase() + " dragon away from " + o.name + ".",
      (a.burned ? "It burned " + (a.burned > 1 ? a.burned + " fields" : "a field") + " and" : "It") + " carried off " + Math.round(a.stolen) + " food. " + (a.kos ? a.kos + " defender" + (a.kos > 1 ? "s were" : " was") + " knocked out. " : "") +
      (clans.length > 1 ? names.join(", ") + " fought side by side, and they are closer for it." : ""), { attack: a.id });
    if (L) a.home = L.name;
  }
  // where a lair's dragon is at time T (the 3D dragon follows this when nobody is fighting it)
  // a dragon woken from its sleep flies at once, in a rage, at the village it blames
  App.dragonWrath = (L, vi, why) => {
    if (st.attacks.some((x) => x.lair === L.i && st.T < x.back)) return null;
    const day = Math.floor(st.T / DAY), o = App.villages[vi], flight = Math.hypot(o.x - L.x, o.z - L.z) / FLY;
    const t0 = st.T + 3 + flight;
    const helpers = App.villages.filter((v) => Math.hypot(v.x - o.x, v.z - o.z) < 150).map((v) => v.i);
    const a = { id: App.uid("drg"), day: Math.floor(t0 / DAY), lair: L.i, look: L.look, to: o.i, depart: st.T + 3, t0, t1: t0 + 45, back: t0 + 45 + flight, hp: 100, maxHp: 100, power: 90 + hash2(L.i, day, 39) * 50,
      helpers, live: false, done: false, burned: 0, stolen: 0, kos: 0, hits: 0, wrath: true };
    st.attacks.push(a);
    const ids = [];
    for (const v of helpers) for (const id of App.villages[v].residents) { defendBy.set(id, a); ids.push(id); }
    replan(ids);
    App.log("dragon", why, "Roaring, it takes off and flies straight for " + o.name + " (" + App.clanName(o.clan) + "). It will be there around " + App.clock(t0).short + ".", { attack: a.id });
    App.toast("The dragon of " + L.name + " is awake, and angry!");
    return a;
  };
  App.dragonState = (L, T) => {
    const a = st.attacks.find((x) => x.lair === L.i && T >= x.depart && T < x.back);
    const top = { x: L.x, z: L.z, y: L.h + 0.1 };
    if (!a && App.dragonSlain && App.dragonSlain(L)) return { mode: "slain", x: top.x, z: top.z, y: top.y, heading: 0, attack: null };
    if (!a && App.dragonHiding && App.dragonHiding(L)) return { mode: "hidden", x: top.x, z: top.z, y: top.y + 60, heading: 0, attack: null };
    const pt = !a && App.patrolOf && App.patrolOf(L, T);
    if (pt) return { mode: "patrol", x: pt.x, z: pt.z, y: pt.y, heading: pt.heading, attack: null };
    if (!a) return { mode: "perch", x: top.x, z: top.z, y: top.y, heading: hash2(L.i, 1, 1) * 6.28, attack: null };
    const o = App.villages[a.to], g = o.granary;
    const sky = App.SEA + 21;
    if (T < a.t0) {
      const p = (T - a.depart) / (a.t0 - a.depart);
      return { mode: "fly", x: top.x + (g.x - top.x) * p, z: top.z + (g.z - top.z) * p, y: top.y + (sky - top.y) * Math.min(1, p * 4) + Math.sin(p * Math.PI) * 4, heading: Math.atan2(g.x - top.x, g.z - top.z), attack: a };
    }
    if (T < a.t1) {
      const w = (T - a.t0) * 0.35;
      return { mode: "circle", x: g.x + Math.cos(w) * 16, z: g.z + Math.sin(w) * 16, y: App.SEA + 15 + Math.sin(w * 2) * 1.5, heading: Math.atan2(-Math.sin(w), Math.cos(w)) + Math.PI, attack: a };
    }
    const p = (T - a.t1) / (a.back - a.t1);
    return { mode: "fly", x: g.x + (top.x - g.x) * p, z: g.z + (top.z - g.z) * p, y: sky + (top.y - sky) * Math.max(0, p * 4 - 3), heading: Math.atan2(top.x - g.x, top.z - g.z), attack: a };
  };
  App.activeAttackAt = (vi) => st.attacks.find((a) => a.to === vi && !a.done && st.T >= a.t0 - 30 && st.T < a.t1);

  // ---------- solidarity: every morning, places with plenty send food to their allies in need ----------
  function shareFood(day) {
    let gifts = 0, total = 0;
    for (const v of App.villages) {
      const n = v.residents.length;
      if (v.food < n * 5) continue;
      const poor = App.gridNear("village", v.x, v.z, 300).filter((o) => o !== v && App.clanRel(v.clan, o.clan) >= 75 && o.food < o.residents.length * 1.2)
        .sort((a, b) => a.food / a.residents.length - b.food / b.residents.length)[0];
      if (!poor) continue;
      const give = Math.min((v.food - n * 4) * 0.5, poor.residents.length * 2);
      if (give < 3) continue;
      v.food -= give; poor.food += give; gifts++; total += give;
      if (near(poor)) App.log("clan", v.name + " sent " + Math.round(give) + " food to " + poor.name + ".", "They are allies, and allies look after each other.");
    }
    if (gifts > 1) App.log("clan", gifts + " places shared " + Math.round(total) + " food with their allies this morning.", "Rivals raid each other; allies help each other through hard times.");
  }

  // ---------- the daily clock ----------
  App.villageTick = () => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= 8 * 60 && st.shareDay !== day) { st.shareDay = day; shareFood(day); }
    if (m >= 17 * 60 && st.raidDay !== day) { st.raidDay = day; planRaids(day); }
    if (m >= 18 * 60 + 30 && st.dragonDay !== day) { st.dragonDay = day; planDragons(day); }
    for (const r of st.raids) if (!r.done && st.T >= r.end) resolveRaid(r);
    for (const a of st.attacks) if (!a.done && st.T >= a.t1) resolveAttack(a);
  };
  App.reindexVillageEvents = reindex;
  // test hooks: send a dragon or a raid at a village right away
  App.debugDragon = (vi, lead) => {
    const o = App.villages[vi], day = Math.floor(st.T / DAY);
    const L = App.lairs.slice().sort((p, q) => Math.hypot(p.x - o.x, p.z - o.z) - Math.hypot(q.x - o.x, q.z - o.z))[0];
    const flight = Math.hypot(o.x - L.x, o.z - L.z) / FLY, t0 = st.T + (lead || 10);
    const helpers = App.villages.filter((v) => Math.hypot(v.x - o.x, v.z - o.z) < 150).map((v) => v.i);
    const a = { id: App.uid("drg"), day, lair: L.i, look: L.look, to: o.i, depart: t0 - flight, t0, t1: t0 + 55, back: t0 + 55 + flight, hp: 100, maxHp: 100, power: 90, helpers, live: false, done: false, burned: 0, stolen: 0, kos: 0, hits: 0 };
    st.attacks.push(a);
    const ids = [];
    for (const i of helpers) for (const id of App.villages[i].residents) { defendBy.set(id, a); ids.push(id); }
    replan(ids);
    return a;
  };
  App.debugRaid = (from, to, lead) => {
    const v = App.villages[from], o = App.villages[to], day = Math.floor(st.T / DAY);
    const fighters = v.residents.slice(0, 6);
    const dist = App.pathLength(App.route(v.x, v.z, o.granary.x, o.granary.z));
    const s = st.T - day * DAY > 0 ? st.T : day * DAY, arrive = s + dist / App.WALK_SPEED + 6;
    const r = { id: App.uid("raid"), day, from, to, raiders: fighters, s, arrive, end: arrive + (lead || 35), done: false, looted: 0, live: false, fights: 0, kos: 0 };
    st.raids.push(r);
    for (const id of fighters) raidBy.set(id, r);
    replan(fighters);
    return r;
  };

  // ---------- crops on the fields near the player ----------
  let cropMeshes = null;
  const CROP_HI = 40; // full detail up close, the light version further out
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0);
  App.updateCrops = () => {
    if (!App.frag.wheat_0 || !App.frag.cabbage_0) return;
    if (!cropMeshes) {
      cropMeshes = {};
      for (const k of ["wheat", "cabbage"]) for (const L of ["hi", "lo"]) {
        const F = (L === "hi" ? App.frag : App.fragLo)[k + "_0"];
        const m = new THREE.InstancedMesh(F.geo, App.voxMaterial, 2400);
        m.frustumCulled = false; m.count = 0;
        App.scene.add(m);
        cropMeshes[k + L] = { m, F };
      }
    }
    const tx = App.cam.target.x, tz = App.cam.target.z;
    const n = { wheathi: 0, wheatlo: 0, cabbagehi: 0, cabbagelo: 0 };
    for (const f of App.gridNear("field", tx, tz, App.RANGE.scenery)) {
      if (f.kind || Math.hypot(f.x - tx, f.z - tz) > App.RANGE.scenery || f.burnt > st.T || !App.kitOn(f.crop)) continue;
      const key = f.crop + (Math.hypot(f.x - tx, f.z - tz) < CROP_HI ? "hi" : "lo"), C = cropMeshes[key];
      for (let x = -f.w + 1; x <= f.w - 1; x += 2) for (let z = -f.d + 1; z <= f.d - 1; z += 2) {
        if (n[key] >= 2400) break;
        const px = f.x + x + (hash2(f.i * 64 + x, z, 3) - 0.5) * 0.5, pz = f.z + z + (hash2(f.i * 64 + x, z, 4) - 0.5) * 0.5;
        Q.setFromAxisAngle(YAX, hash2(f.i, x * 31 + z, 5) * 6.28);
        const k = 0.9 + hash2(f.i, x * 17 + z, 6) * 0.3;
        M4.compose(V.set(px, f.h, pz), Q, SC.set(k, k, k)).multiply(C.F.local);
        C.m.setMatrixAt(n[key]++, M4);
      }
    }
    for (const k in cropMeshes) { cropMeshes[k].m.count = n[k]; cropMeshes[k].m.instanceMatrix.needsUpdate = true; }
  };
})();
