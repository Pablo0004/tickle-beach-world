/* Wars between holders (item 1.5, agreed with the owner on 28 October 2026, inspired by Imperivm).
 * Every holder's place (an estate, a fortress, a lodge, a small plot; never a town of small holders nor a warren)
 * can go to war. Rivalries declare them: two places whose quarrels (raids, thefts) have left them bitter rivals
 * go to war on their own, in the morning. The armies are the armed Tickles of each holder (infantry with swords
 * and axes, spearmen, mages, healers, tamers with their creatures, cavalry on horses and riding beasts, griffin
 * riders), up to fifty, led by a general (the strongest of them), plus whoever the armoury can arm with the arms
 * taken in earlier wars. Allies come along with part of their own. In the afternoon the attackers muster in
 * their square and march along the roads in a column, four abreast, to the front: the gate of a fortress (a
 * siege: the gate is broken first, then the castle), or the edge of a place without walls (an open battle; once
 * its defenders are broken, its houses burn and its hall is taken). Formations as in Imperivm: the column on the
 * march; in battle the line, or cavalry in the centre when there is enough of it, or the square when outnumbered,
 * or on the walls. A fortress's catapults throw stones at the attackers. Every building has health; walls,
 * gates, castles, mansions and houses can be destroyed (and are rebuilt afterwards, as any ruin).
 * The fallen (knocked out) do not recover until the war is over and the supplies have been moved. The war ends
 * when the castle or hall falls, or when an army is broken (under a quarter of it on its feet), or after five
 * days with a truce. The winner takes everything: the granary's food, the ores in store, the shells of the
 * loser's Tickles, their arms (into the winner's armoury) and the place itself, houses and plot, which is held
 * by the winner from then on (in the game only, never the real tokens) and pays it tribute every morning, until
 * it wins its freedom back in a war of its own. After a war, the same two holders cannot fight again for three
 * days, unless an ally who has not fought that holder takes the war up (the ally's right to battle).
 * Off screen the same battle is fought minute by minute by the strength of the armies; near you, you see it. */
(function () {
  "use strict";
  const App = window.App, st = App.st, hash2 = App.hash2, DAY = 1440, rnd = Math.random;
  const nm = (id) => App.nameOf(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const DECLARE = 9 * 60, MUSTER = 13 * 60, DEPART = 13 * 60 + 30, LAST = 19 * 60 + 30, MAXDAYS = 5, CAP = 50, HPU = 180, PEACE = 3 * DAY;
  const MARCH = 0.85; // the column marches a little slower than a Tickle walks

  // ---------- the units ----------
  const UNITS = (App.WAR_UNITS = {
    infantry: { name: "Infantry", p: 1, what: "Swords and axes: the body of every army." },
    spear: { name: "Spearmen", p: 1.1, what: "Long spears that keep the cavalry off." },
    archer: { name: "Archers", p: 1.0, what: "Bows: they shoot from behind the line, and from the top of the walls in a siege." },
    cavalry: { name: "Cavalry", p: 1.5, what: "Armed Tickles on horses and riding beasts; they charge first." },
    griffin: { name: "Griffin riders", p: 1.6, what: "Fly over the column and strike from above." },
    mage: { name: "Mages", p: 1.3, what: "Cast their spells from the back ranks." },
    healer: { name: "Healers", p: 0.5, what: "Mend the wounded of their own side as the battle goes on." },
    tamer: { name: "Tamers", p: 1.2, what: "Fight with their creatures, on the flanks." },
  });
  const FORMATIONS = (App.WAR_FORMATIONS = {
    column: { name: "Column", what: "Four abreast along the road, the cavalry at the head and the healers at the back." },
    line: { name: "Line", what: "A long front, every soldier in reach of the enemy: a little stronger (+5%)." },
    cavalry: { name: "Cavalry in the centre", what: "When a sixth or more of the army rides: the riders strike a fifth harder." },
    square: { name: "Square", what: "Outnumbered, they close up: they take less harm (-15%)." },
    walls: { name: "On the walls", what: "Behind the gate and up on the walls: the defenders fight half as hard again while the gate stands." },
  });
  function unitOf(id, lent) {
    const M = App.mountOf ? App.mountOf(id) : null, role = App.combatRole ? App.combatRole(id) : null;
    if (M && M.fly) return "griffin";
    if (M && M.kind !== "monster" && (role === "warrior" || lent)) return "cavalry";
    if (role === "mage") return "mage";
    if (role === "healer") return "healer";
    if (role === "tamer") return "tamer";
    const g = App.gearOf ? App.gearOf(id) : null;
    if (g && g.weapon === "spear") return "spear";
    return hash2(id, 621, 3) < 0.35 ? "archer" : "infantry"; // about a third of the foot soldiers carry bows
  }
  const RANGED = new Set(["mage", "healer", "tamer", "archer"]);
  const ORDER = ["cavalry", "infantry", "spear", "archer", "tamer", "mage", "healer", "griffin"]; // the column, head to tail

  // ---------- who can go to war ----------
  const isWarren = (v) => !!(v.hall && v.hall.sc && /^warren/.test(v.hall.sc.type));
  const capable = (v) => !!(v && v.holder && v.kind !== "town" && !v.vacant && !isWarren(v));
  const W = () => st.war;
  const relKey = (a, b) => Math.min(a, b) + ":" + Math.max(a, b);
  const setRel = (a, b, x) => { if (a !== b && st.clanRel) st.clanRel[relKey(a, b)] = Math.max(0, Math.min(100, x)); };
  const pairKey = (p, q) => (p < q ? p + "|" + q : q + "|" + p);
  const lordOf = (v) => { const L = W() && W().lords[v.ident]; if (!L) return null; const o = App.villages.find((x) => x.ident === L); return o || null; };
  App.lordOf = lordOf;
  App.warAt = (vi) => !!(W() && W().wars.some((w) => w.status === "on" && w.b === vi));
  App.heldBy = (v) => lordOf(v);
  const atWar = (vi) => W().wars.some((w) => w.status !== "over" && (w.A.concat(w.B)).some((c) => c.vi === vi));
  const inPeace = (p, q) => (W().peace[pairKey(p.ident, q.ident)] || 0) > st.T;
  const foughtBefore = (p, q) => !!W().fought[pairKey(p.ident, q.ident)];
  const near = (x, z, r) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z) < (r || 520);

  // ---------- the armies ----------
  function raise(vi, share) {
    const v = App.villages[vi], armed = [], spare = [];
    for (const id of v.residents) {
      if (App.isKO(id) || App.isDead(id) || (App.isListed && App.isListed(id))) continue;
      if (App.combatRole && App.combatRole(id)) armed.push(id); else spare.push(id);
    }
    armed.sort((a, b) => App.levelOf(b) - App.levelOf(a) || a - b);
    // the armoury arms as many more as it holds weapons taken in earlier wars
    const stock = W().stock[v.ident] || 0;
    const lent = stock > 0 ? spare.sort((a, b) => hash2(a, 71, 3) - hash2(b, 71, 3)).slice(0, Math.min(stock, CAP)) : [];
    let ids = armed.concat(lent);
    if (share < 1) ids = ids.slice(0, Math.max(2, Math.round(ids.length * share)));
    ids = ids.slice(0, CAP);
    return { vi, ident: v.ident, ids, lent: lent.filter((id) => ids.includes(id)) };
  }
  const sideIds = (w, s) => [].concat(...w[s].map((c) => c.ids));
  const standing = (w, s) => sideIds(w, s).filter((id) => !w.fallen[id] && !App.isKO(id) && !App.isDead(id));
  const sideOf = (w, id) => (w.A.some((c) => c.ids.includes(id)) ? "A" : w.B.some((c) => c.ids.includes(id)) ? "B" : null);
  const lentOf = (w, id) => w.A.concat(w.B).some((c) => c.lent.includes(id));
  function formationOf(w, s) {
    if (w.bt && st.T < w.bt.arrive && s === "A") return "column";
    if (s === "B" && w.siege && !gateDown(w)) return "walls";
    const ids = standing(w, s), o = standing(w, s === "A" ? "B" : "A");
    const riders = ids.filter((id) => w.unit[id] === "cavalry" || w.unit[id] === "griffin").length;
    if (ids.length && riders / ids.length >= 1 / 6) return "cavalry";
    if (ids.length < o.length * 0.7) return "square";
    return "line";
  }
  function unitPower(w, s, id, f, gen) {
    const u = w.unit[id] || "infantry";
    return UNITS[u].p * (1 + App.levelOf(id) * 0.04) * (App.heroPower ? App.heroPower(id) : 1) * (f === "cavalry" && (u === "cavalry" || u === "griffin") ? 1.2 : 1) *
      (f === "line" ? 1.05 : 1) * (gen != null && !w.fallen[gen] && !App.isKO(gen) ? 1.1 : 1);
  }
  function power(w, s, ids) {
    const f = formationOf(w, s), gen = w[s][0] && w[s][0].general;
    let p = 0;
    for (const id of ids) p += unitPower(w, s, id, f, gen);
    return p;
  }

  // ---------- as in Clash of Clans: what each unit goes for, the destruction and the stars ----------
  // The cavalry, the griffin riders and the mages go for the defences first (catapults, wall towers, the armoury);
  // swords, spears and tamers for whatever is nearest; the healers mend. The griffins fly over the walls. A battle
  // is scored by how much of the place is destroyed (every building but the stretches of wall): one star at half,
  // one for the castle or hall, one for all of it. Three stars end the war at once; two at the end of a day of
  // battle; after five days one star is still a win, none a truce. The loot goes by the stars.
  const PREFER = { cavalry: "defense", griffin: "defense", mage: "defense", infantry: "any", spear: "any", archer: "any", tamer: "any", healer: null };
  const BUILD_SHARE = { infantry: 0.5, spear: 0.3, cavalry: 0.6, griffin: 0.9, mage: 0.4, archer: 0.2, tamer: 0.4, healer: 0 };
  const isDefense = (b) => /^(catapult|walltower|armoury)_/.test(b.type);
  const towersOf = (v) => (App.sceneryAll || []).filter((b) => b.tkey && b.tkey.startsWith(v.key + "/t") && /^walltower_/.test(b.type));
  function bldsOf(w) {
    if (!w.blds) {
      const B = App.villages[w.b];
      w.blds = (App.sceneryAll || []).filter((b) => b.building && !b.ruined && !/^wall_/.test(b.type) && ((b.tkey && b.tkey.startsWith(B.key + "/")) || b.village === B.i)).map((b) => b.idx);
    }
    return w.blds.map((i) => App.sceneryAll[i]).filter(Boolean);
  }
  function starsOf(w) {
    const L = bldsOf(w), down = L.filter((b) => b.ruined).length, pct = L.length ? down / L.length : 0, H = hallOf(w.b);
    return { pct, stars: (pct >= 0.5 ? 1 : 0) + (H && H.ruined ? 1 : 0) + (pct >= 0.999 ? 1 : 0), down, of: L.length };
  }
  App.warStars = (w) => starsOf(w);
  const starText = (n) => "\u2605".repeat(n) + "\u2606".repeat(3 - n);
  function targetFor(w, u, from) {
    const pref = PREFER[u];
    if (!pref) return null;
    const shut = w.siege && !gateDown(w) && u !== "griffin";
    const list = bldsOf(w).filter((b) => !b.ruined && (!shut || b.idx === w.gate));
    if (!list.length) return null;
    const fx = from ? from.x : w.front.x, fz = from ? from.z : w.front.z;
    const near0 = (arr) => { let best = null, bd = 1e9; for (const b of arr) { const d = Math.hypot(b.x - fx, b.z - fz); if (d < bd) { bd = d; best = b; } } return best; };
    return (pref === "defense" && near0(list.filter(isDefense))) || near0(list);
  }
  function destroyed(w, b) {
    const B = App.villages[w.b];
    if (b.idx === w.gate) {
      // the traps behind the gate catch the first ones through
      const a = standing(w, "A"), n = Math.min(a.length, 2 + Math.floor(hash2(w.days, w.b, 617) * 3));
      for (let k = 0; k < n; k++) fall(w, "A", a[Math.floor(hash2(k, Math.floor(st.T), 619) * a.length)]);
      App.log("war", "The gate of " + B.name + " is broken!", "The attackers pour in; the traps behind it catch " + n + " of them.", { war: w.id });
    }
    const S = starsOf(w);
    if (S.stars > (w.starsSeen || 0)) {
      w.starsSeen = S.stars;
      App.log("war", starText(S.stars) + " " + App.villages[w.a].name + " has " + S.stars + " star" + (S.stars > 1 ? "s" : "") + " against " + B.name + ".", Math.round(S.pct * 100) + "% of " + B.name + " destroyed" + (hallOf(w.b) && hallOf(w.b).ruined ? ", its " + (w.siege ? "castle" : "hall") + " included" : "") + ".", { war: w.id });
      if (near(B.x, B.z, 300)) App.toast && App.toast(starText(S.stars) + " " + Math.round(S.pct * 100) + "% of " + B.name);
    }
    if (S.pct >= 0.999) finish(w, "A", "Three stars: " + B.name + " has been destroyed from end to end.");
  }

  // ---------- the health of buildings ----------
  const bkey = (s) => s.tkey || "i" + s.idx;
  const MAXHP = [[/^(castle|castle2|castle3|palace)_/, 5000], [/^gatehouse_/, 3000], [/^walltower_/, 2500], [/^wall_/, 2000], [/^(mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic)_/, 1500],
    [/^armoury_/, 900], [/^catapult_/, 300], [/^manor_/, 800], [/^townhouse_/, 500], [/^(cottage|hut)_/, 300]];
  App.buildingMaxHP = (s) => { const t = s.ruined ? s.orig || s.type : s.type; for (const [re, hp] of MAXHP) if (re.test(t)) return hp; return s.hall ? 1000 : s.granary ? 400 : 400; };
  App.buildingHP = (s) => { const max = App.buildingMaxHP(s); if (s.ruined) return { now: 0, max }; const h = W() && W().bhp[bkey(s)]; return { now: h == null ? max : h, max }; };
  App.damageBuilding = (s, dmg, cause) => {
    if (!s || s.ruined || !s.building || !W()) return false;
    const H = App.buildingHP(s), now = H.now - dmg;
    if (now > 0) { W().bhp[bkey(s)] = now; return false; }
    delete W().bhp[bkey(s)];
    App.ruin(s, cause || "in a war", true);
    return true;
  };

  // ---------- where the armies meet ----------
  const gateOf = (w) => (w.gate != null ? App.sceneryAll[w.gate] : null);
  const gateDown = (w) => { const g = gateOf(w); return !g || g.ruined; };
  const hallOf = (vi) => App.villages[vi].hall.sc;
  function gatesOf(v) { return (App.sceneryAll || []).filter((s) => s.gate && s.tkey && s.tkey.startsWith(v.key + "/g")); }
  function frontFor(a, b) {
    const A = App.villages[a], B = App.villages[b];
    if (B.walls) {
      // the gate the march reaches first
      const gs = gatesOf(B);
      let best = null, bd = 1e9;
      for (const g of gs) { const d = Math.hypot(g.x - A.x, g.z - A.z); if (d < bd) { bd = d; best = g; } }
      if (best) {
        const ux = B.walls.x - best.x, uz = B.walls.z - best.z, L = Math.hypot(ux, uz) || 1;
        return { siege: true, gate: best.idx, x: best.x - (ux / L) * 7, z: best.z - (uz / L) * 7, ux: ux / L, uz: uz / L, gx: best.x, gz: best.z };
      }
    }
    // an open battle at the edge of the place, on the road the march comes in by
    const path = App.route(A.x, A.z, B.x, B.z), R = (B.r || 20) + 10;
    let p = path[path.length - 1] || { x: B.x, z: B.z };
    for (const q of path) if (Math.hypot(q.x - B.x, q.z - B.z) < R) { p = q; break; }
    const ux = B.x - p.x, uz = B.z - p.z, L = Math.hypot(ux, uz) || 1;
    return { siege: false, gate: null, x: p.x, z: p.z, ux: ux / L, uz: uz / L };
  }

  // ---------- declaring war ----------
  function declare(a, b, why, via) {
    const A = App.villages[a], B = App.villages[b], F = frontFor(a, b);
    const len = App.pathLength(App.route(A.x, A.z, F.x, F.z));
    if (len / (App.WALK_SPEED * MARCH) > 4 * 60) return null; // too far to march in an afternoon
    const lead = raise(a, 1), def = raise(b, 1);
    if (lead.ids.length < 3 || def.ids.length < 1) return null;
    const w = { id: App.uid("war"), a, b, aId: A.ident, bId: B.ident, why, via: via != null ? App.villages[via].ident : null, day0: Math.floor(st.T / DAY), days: 0, status: "on",
      A: [lead], B: [def], unit: {}, fallen: {}, siege: F.siege, gate: F.gate, front: F, len, dA: 0, dB: 0, kos: { A: 0, B: 0 }, burned: 0, bt: null, start: {} };
    lead.general = lead.ids[0]; def.general = def.ids[0];
    // to a siege the attackers bring a battering ram, and up to two catapults from their own walls
    w.eng = [];
    if (F.siege) {
      w.eng.push({ k: "ram", hp: 450, max: 450 });
      for (let i = 0; i < Math.min(2, (A.catapults || []).filter((c) => !c.ruined).length); i++) w.eng.push({ k: "cat", hp: 300, max: 300, i });
    }
    // allies of either side come with part of their armies
    const allies = (me, foe, side) => App.villages.filter((x) => x.i !== me.i && x.i !== foe.i && capable(x) && !atWar(x.i) && App.clanRel(x.clan, me.clan) >= 75 && App.clanRel(x.clan, foe.clan) < 55 && Math.hypot(x.x - foe.x, x.z - foe.z) < 420)
      .sort((p, q) => App.clanRel(q.clan, me.clan) - App.clanRel(p.clan, me.clan)).slice(0, 3)
      .forEach((x) => { const c = raise(x.i, 0.35); if (c.ids.length >= 2) w[side].push(c); });
    allies(A, B, "A"); allies(B, A, "B");
    if (via != null && !w.A.some((c) => c.vi === via)) { const c = raise(via, 0.6); if (c.ids.length >= 2) w.A.push(c); }
    for (const s of ["A", "B"]) { for (const c of w[s]) for (const id of c.ids) w.unit[id] = unitOf(id, c.lent.includes(id)); w.start[s] = sideIds(w, s).length; }
    W().wars.push(w);
    for (const c of w.A) for (const d of w.B) W().fought[pairKey(c.ident, d.ident)] = st.T;
    planDay(w, Math.floor(st.T / DAY));
    const names = (s) => w[s].slice(1).map((c) => App.villages[c.vi].name);
    App.log("war", A.name + " has declared war on " + B.name + "!", why + " " + (F.siege ? "The army will lay siege to the gate of " + B.name + "." : "They will meet in open battle at the edge of " + B.name + ".") + " " +
      w.start.A + " soldiers against " + w.start.B + (names("A").length ? "; with " + A.name + ": " + names("A").join(", ") : "") + (names("B").length ? "; with " + B.name + ": " + names("B").join(", ") : "") + ".", { war: w.id });
    App.toast && App.toast("War: " + A.name + " against " + B.name + "!");
    return w;
  }
  // the day's battle: muster at 13:00, march at 13:30, fight from arrival until 19:30
  function planDay(w, day, now) {
    const d0 = day * DAY, depart = now != null ? now + 4 : d0 + DEPART, arrive = depart + w.len / (App.WALK_SPEED * MARCH) + 6;
    w.bt = { day, muster: now != null ? now : d0 + MUSTER, depart, arrive, end: Math.max(arrive + 60, d0 + LAST), done: false };
    w.days++;
    w.lt = null;
    const ids = sideIds(w, "A").concat(sideIds(w, "B")).concat(App.villages[w.b].residents);
    for (const id of new Set(ids)) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && !t.action.order && t.action.kind !== "ko" && t.action.kind !== "fall") App.endAction(t); }
  }
  function declareTick(day) {
    if (W().wars.filter((w) => w.status === "on").length >= 4) return;
    let n = 0;
    for (const v of App.villages) {
      if (n >= 2 || !capable(v) || atWar(v.i)) continue;
      const lord = lordOf(v);
      const foes = App.gridNear("village", v.x, v.z, 520).filter((o) => o !== v && capable(o) && !atWar(o.i) && Math.hypot(o.x - v.x, o.z - v.z) < 520 && App.clanRel(v.clan, o.clan) <= 15 &&
        (!lord || o === lord) && lordOf(o) !== v);
      for (const o of foes) {
        if (hash2(v.i * 31 + o.i, day, 601) > 0.3) continue;
        let w = null;
        if (!inPeace(v, o)) w = declare(v.i, o.i, lord === o ? v.name + " rises against " + o.name + ", which has held it since the last war." : v.name + " and " + o.name + " are bitter rivals: too many raids and thefts between them.");
        else {
          // the ally's right to battle: an ally who has not fought it takes the war up, and v comes along
          const c = App.villages.find((x) => x !== v && x !== o && capable(x) && !atWar(x.i) && App.clanRel(x.clan, v.clan) >= 75 && App.clanRel(x.clan, o.clan) < 55 && !inPeace(x, o) && !foughtBefore(x, o) && Math.hypot(x.x - o.x, x.z - o.z) < 520);
          if (c) w = declare(c.i, o.i, v.name + " may not attack " + o.name + " again so soon, so its ally " + c.name + " takes the war up with its right to battle, and " + v.name + " marches with it.", v.i);
        }
        if (w) { n++; break; }
      }
    }
  }

  // ---------- the battle, minute by minute ----------
  function fall(w, s, id) {
    if (w.fallen[id]) return;
    w.fallen[id] = s; w.kos[s]++;
    const t = App.pop.agent[id];
    App.knockOut(id, 1, ["Ugh...", "I'm down!", "Fall back...", "KO!"][Math.floor(rnd() * 4)]);
    App.pop.ko[id] = 1e8; // until the war is over and the supplies have been moved
    if (t && App.FX) App.FX.burst(App.scene, { x: t.pos.x, y: t.pos.y + 1, z: t.pos.z }, s === "A" ? "#ff6b5e" : "#5ab0ff", 12, 0.15);
  }
  // a siege engine hit (by a catapult's stone, off screen or near you)
  function hitEngine(w, e, dmg) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    if (e.hp > 0) return;
    e.hp = 0;
    const o = engObjs.get(w.id + ":" + w.eng.indexOf(e));
    if (o && App.FX) { App.FX.burst(App.scene, { x: o.grp.position.x, y: o.grp.position.y + 1.5, z: o.grp.position.z }, "#8a5a30", 26, 0.3); App.sfx && App.sfx.crash && App.sfx.crash(0.7); }
    if (near(w.front.x, w.front.z, 400)) App.log("war", "The defenders of " + App.villages[w.b].name + " smashed " + (e.k === "ram" ? "the battering ram" : "a catapult") + " of " + App.villages[w.a].name + ".", "Their catapults found it.", { war: w.id });
  }
  const isLive = (w) => performance.now() - (w.liveAt || -1e9) < 2500;
  const pickOne = (list, salt) => list[Math.floor(hash2(list.length, salt, 607) * list.length)];
  function minute(w) {
    const a = standing(w, "A"), b = standing(w, "B");
    if (a.length < w.start.A * 0.25 || !a.length) return finish(w, "B", App.villages[w.a].name + "'s army was broken and fell back.");
    const pa = power(w, "A", a), pb = power(w, "B", b), B = App.villages[w.b], fB = formationOf(w, "B");
    const cats = (B.catapults || []).filter((c) => !c.ruined).length, live = isLive(w);
    const cause = "in the war between " + App.villages[w.a].name + " and " + B.name;
    // the siege engines: the defenders' catapults aim at them first; the ram batters the gate, the attackers'
    // catapults throw at the gate and then at the castle (near you, the stones you see do this instead)
    const engs = (w.eng || []).filter((e) => e.hp > 0);
    let catsMen = live ? 0 : cats * 0.8;
    if (!live) for (let i = 0; i < cats; i++) if (engs.length && hash2(Math.floor(w.lt), i, 611) < 0.12) { hitEngine(w, engs[Math.floor(hash2(Math.floor(w.lt), i, 613) * engs.length)], 25); catsMen -= 0.8; }
    const ram = engs.find((e) => e.k === "ram" && e.hp > 0), acats = live ? 0 : engs.filter((e) => e.k === "cat" && e.hp > 0).length;
    const shut = w.siege && !gateDown(w), hits = new Map(), hit = (b, d) => { if (b && d > 0) hits.set(b, (hits.get(b) || 0) + d); };
    if (shut) { if (ram) hit(gateOf(w), 25); hit(gateOf(w), acats * 15); }
    else if (acats) hit(targetFor(w, "cavalry"), acats * 15);
    // every attacker sends part of its strength at the buildings it prefers, the rest at the defenders
    const fA = formationOf(w, "A"), genA = w.A[0] && w.A[0].general;
    let toMen = 0;
    for (const id of a) {
      const u = w.unit[id] || "infantry", p = unitPower(w, "A", id, fA, genA);
      // behind a standing gate the swords and spears batter it, the mages and tamers shoot at the walls, the griffins fly over
      let share = shut ? (u === "griffin" ? 0.9 : RANGED.has(u) ? 0 : 1) : BUILD_SHARE[u];
      if (!b.length) share = u === "healer" ? 0 : 1;
      toMen += p * (1 - share) * (shut ? 0.8 : 1);
      if (share > 0) hit(shut && u !== "griffin" ? gateOf(w) : targetFor(w, u), p * share * (shut ? 2.4 : 3));
    }
    for (const [bd, d] of hits) { if (App.damageBuilding(bd, d, cause)) destroyed(w, bd); if (w.status !== "on") return; }
    // the defenders: up on the walls while the gate stands (the rest throw stones down), and the wall towers shoot
    const rb = b.filter((id) => RANGED.has(w.unit[id])), pRb = power(w, "B", rb);
    let pbHit = shut ? pRb * 1.3 + (pb - pRb) * 0.25 : pb;
    if (!live && w.siege) pbHit += towersOf(B).filter((t) => !t.ruined && Math.hypot(t.x - w.front.x, t.z - w.front.z) < 45).length * 0.6;
    w.dB += toMen; w.dA += pbHit + Math.max(0, catsMen);
    const heal = (s, ids) => ids.filter((id) => w.unit[id] === "healer").length * 0.35;
    w.dA = Math.max(0, w.dA - heal("A", a)) * (formationOf(w, "A") === "square" ? 0.85 : 1);
    w.dB = Math.max(0, w.dB - heal("B", b)) * (fB === "square" ? 0.85 : 1);
    // who falls: the visible ones in the thick of it first, so what you see is what is fought
    const pickFall = (ids, salt) => { const close = ids.filter((id) => { const t = App.pop.agent[id]; return t && t.action && t.action.kind === "warfight" && t.action.engaged; }); return close.length && rnd() < 0.7 ? close[Math.floor(rnd() * close.length)] : pickOne(ids, salt); };
    while (w.dA >= HPU && a.length) { w.dA -= HPU; const id = pickFall(a, Math.floor(st.T * 7)); fall(w, "A", id); a.splice(a.indexOf(id), 1); }
    while (w.dB >= HPU && b.length) { w.dB -= HPU; const id = pickFall(b, Math.floor(st.T * 11)); fall(w, "B", id); b.splice(b.indexOf(id), 1); }
    if (w.status !== "on") return;
    if (a.length < w.start.A * 0.25) finish(w, "B", App.villages[w.a].name + "'s army was broken and fell back.");
  }
  function endOfDay(w) {
    w.bt.done = true;
    // supplies: every soldier eats from its own granary for the day's march and battle
    for (const c of w.A.concat(w.B)) { const v = App.villages[c.vi]; v.food = Math.max(0, v.food - c.ids.length * 0.5); }
    const a = standing(w, "A").length, b = standing(w, "B").length;
    const S = starsOf(w);
    if (S.stars >= 2) return finish(w, "A", starText(S.stars) + " " + Math.round(S.pct * 100) + "% of " + App.villages[w.b].name + " destroyed by nightfall.");
    if (!w.siege && b < w.start.B * 0.1) return finish(w, "A", "Hardly anyone of " + App.villages[w.b].name + " is left on their feet.");
    if (w.days >= MAXDAYS) return S.stars ? finish(w, "A", starText(S.stars) + " After " + MAXDAYS + " days, " + Math.round(S.pct * 100) + "% of " + App.villages[w.b].name + " destroyed.") : truce(w);
    App.log("war", "The " + ordinal(w.days) + " day of the war between " + App.villages[w.a].name + " and " + App.villages[w.b].name + " is over.",
      starText(S.stars) + " " + Math.round(S.pct * 100) + "% destroyed. " + a + " of " + w.start.A + " attackers and " + b + " of " + w.start.B + " defenders are still on their feet." + (w.siege ? gateDown(w) ? " The gate is broken; the castle holds (" + hpText(hallOf(w.b)) + ")." : " The gate holds (" + hpText(gateOf(w)) + ")." : "") + " They fight again tomorrow.", { war: w.id });
    planDay(w, w.bt.day + 1);
  }
  const ordinal = (n) => ["first", "second", "third", "fourth", "fifth", "sixth"][n - 1] || n + "th";
  const hpText = (s) => { if (!s) return "gone"; const H = App.buildingHP(s); return Math.round((H.now / H.max) * 100) + "% of its health"; };

  // ---------- the end: the winner takes everything ----------
  function finish(w, s, why) {
    if (w.status !== "on") return;
    const win = s === "A" ? w.a : w.b, lose = s === "A" ? w.b : w.a, V = App.villages[win], L = App.villages[lose];
    w.status = "convoy"; w.winner = win; w.loser = lose; w.why2 = why; w.endT = st.T; w.side = s;
    w.stars = s === "A" ? Math.max(1, starsOf(w).stars) : 0;
    if (w.bt) w.bt.done = true;
    for (const c of w.A) for (const d of w.B) W().peace[pairKey(c.ident, d.ident)] = st.T + PEACE;
    setRel(V.clan, L.clan, 25);
    // the supplies are moved: the winner's soldiers carry the loot from the loser's granary to their own
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY, t0 = m >= 20 * 60 ? (day + 1) * DAY + 8 * 60 : st.T + 10;
    const len = App.pathLength(App.route(L.granary.x, L.granary.z, V.granary.x, V.granary.z));
    const carriers = (s === "A" ? w.A : w.B)[0].ids.filter((id) => !w.fallen[id] && !App.isKO(id)).slice(0, 12);
    w.convoy = { t0, t1: t0 + 25 + len / App.WALK_SPEED, carriers, from: lose, to: win };
    App.log("war", V.name + " has won the war against " + L.name + "!", why + " The soldiers of " + V.name + " will carry everything off from " + L.name + "'s granary at " + App.clock(t0).short + "; the fallen of both sides recover once the supplies have been moved.", { war: w.id });
    App.toast && App.toast(V.name + " won the war against " + L.name);
    for (const id of new Set(sideIds(w, "A").concat(sideIds(w, "B")).concat(L.residents))) App.invalidatePlan(id);
    if (App.sfx && App.sfx.cheer && near(L.x, L.z, 200)) App.sfx.cheer();
  }
  function truce(w) {
    w.status = "over"; w.truce = true; w.endT = st.T;
    for (const c of w.A) for (const d of w.B) W().peace[pairKey(c.ident, d.ident)] = st.T + PEACE;
    setRel(App.villages[w.a].clan, App.villages[w.b].clan, 30);
    recover(w, 60);
    App.log("war", "Truce between " + App.villages[w.a].name + " and " + App.villages[w.b].name + ".", "After " + MAXDAYS + " days nobody has won. The armies go home with their supplies; the fallen recover within the hour.", { war: w.id });
  }
  function recover(w, mins) { for (const id in w.fallen) if (App.pop.ko[id] > 1e7) App.pop.ko[id] = st.T + (mins || 20); for (const id in w.fallen) App.invalidatePlan(+id); }
  // the loot, by the stars: three, everything and the place itself; two, everything but the place; one, half of the
  // granary, the ores and the shells. Defenders who beat the attack off take half the attackers' granary and ores,
  // and the arms of the attackers who fell.
  function deliver(w) {
    const V = App.villages[w.winner], L = App.villages[w.loser], A = w.side === "A", S = w.stars || 0, share = A && S >= 2 ? 1 : 0.5;
    w.status = "over";
    const loot = { food: Math.round(L.food * share), shells: 0, arms: 0, ores: 0, place: A && S >= 3 };
    V.food += L.food * share; L.food -= L.food * share;
    if (App.oreOf) { const a = App.oreOf(L), b = App.oreOf(V); for (const k in a) { if (typeof a[k] === "number" && a[k] > 0) { const n = k === "tools" ? (share === 1 ? a[k] : 0) : a[k] * share; b[k] = (b[k] || 0) + n; loot.ores += k === "tools" ? 0 : n; a[k] -= n; } } }
    loot.ores = Math.round(loot.ores);
    if (A && App.shellsOf && App.pay) {
      for (const id of L.residents) { const n = Math.floor(App.shellsOf(id) * share); if (n > 0) { loot.shells += n; App.pay(id, -n); } }
      const each = Math.floor(loot.shells / Math.max(1, V.residents.length));
      for (const id of V.residents) App.pay(id, each);
    }
    // arms, into the winner's armoury (a Tickle left without them can buy new ones at the smithy)
    st.gear = st.gear || {};
    const disarm = A ? (S >= 2 ? L.residents : []) : Object.keys(w.fallen).map(Number).filter((id) => w.fallen[id] === "A");
    for (const id of disarm) {
      if (App.heroOf && App.heroOf(id)) continue;
      const g = App.gearOf ? App.gearOf(id) : null;
      if (!g || g.mage || g.weapon === "staff") continue;
      st.gear[id] = { none: true, was: g.weapon };
      loot.arms++;
    }
    W().stock[V.ident] = (W().stock[V.ident] || 0) + loot.arms;
    if (A && S >= 2 && W().stock[L.ident]) { W().stock[V.ident] += W().stock[L.ident]; loot.arms += W().stock[L.ident]; W().stock[L.ident] = 0; }
    // three stars: the place itself, houses and plot, and whatever the loser held
    if (loot.place) {
      const lords = W().lords;
      delete lords[V.ident];
      for (const k in lords) if (lords[k] === L.ident) lords[k] = V.ident;
      lords[L.ident] = V.ident;
    } else if (A && lordOf(V) === L) delete W().lords[V.ident]; // a held place that wins any war against its lord is free again
    w.loot = loot;
    recover(w, 20);
    App.log("war", "The supplies have been moved from " + L.name + " to " + V.name + (A ? " (" + starText(S) + ")." : "."), "Taken: " + loot.food + " food, " + loot.shells + " shells, " + loot.ores + " ore and " + loot.arms + " sets of arms for the armoury of " + V.name + ". " +
      (loot.place ? L.name + ", its houses and its plot are now held by " + App.clanName(V.clan) + ", and pay it tribute every morning. " : "") + "The fallen of the war are on their feet again.", { war: w.id });
    for (const id of L.residents.concat(V.residents)) App.invalidatePlan(id);
  }
  // every morning a held place sends the lord half of what its granary has to spare, and resents it a little more
  function tribute() {
    for (const v of App.villages) {
      const L = lordOf(v);
      if (!L) continue;
      const give = Math.max(0, v.food - v.residents.length * 2.5) * 0.5;
      v.food -= give; L.food += give;
      setRel(v.clan, L.clan, App.clanRel(v.clan, L.clan) - 2);
    }
  }

  // ---------- the clock (sim.js) ----------
  App.warTick = () => {
    if (!W()) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= DECLARE && W().day !== day) { W().day = day; try { tribute(); declareTick(day); } catch (e) { console.warn("war plan", e); } }
    for (const w of W().wars) {
      if (w.status === "on" && w.bt) {
        if (st.T >= w.bt.arrive && !w.bt.done) {
          if (w.lt == null) { w.lt = w.bt.arrive; App.log("war", "The armies of " + App.villages[w.a].name + " and " + App.villages[w.b].name + " have met!", w.siege ? "The siege of " + App.villages[w.b].name + "'s gate has begun." : "Battle at the edge of " + App.villages[w.b].name + ".", { war: w.id }); }
          let k = 0;
          while (w.status === "on" && w.lt + 1 <= Math.min(st.T, w.bt.end) && k++ < 400) { w.lt += 1; minute(w); }
          if (w.status === "on" && st.T >= w.bt.end) endOfDay(w);
        }
      }
      if (w.status === "convoy" && st.T >= w.convoy.t1) deliver(w);
    }
    // a war long over is forgotten after a week; the peace after it runs out
    W().wars = W().wars.filter((w) => w.status !== "over" || st.T - (w.endT || 0) < 7 * DAY);
    for (const k in W().peace) if (W().peace[k] < st.T) delete W().peace[k];
  };

  // ---------- each soldier's day (population.js) ----------
  const warFor = (id, day) => W() && W().wars.find((w) => (w.status === "on" && w.bt && w.bt.day === day && !w.bt.done && sideOf(w, id)) || (w.status === "convoy" && w.convoy.carriers.includes(id) && Math.floor(w.convoy.t0 / DAY) === day));
  App.warStep = (id, day) => {
    if (!W() || !W().wars.length) return null;
    const d0 = day * DAY, w = warFor(id, day);
    if (w && w.status === "convoy") {
      const L = App.villages[w.convoy.from], V = App.villages[w.convoy.to];
      return { k: "war", s: Math.max(0, w.convoy.t0 - d0 - 20), e: Math.min(1435, w.convoy.t1 - d0 + 5), war: w.id, convoy: true, p: { x: V.granary.x + 2, z: V.granary.z, label: "carrying the spoils of " + L.name + " home", cx: V.granary.x, cz: V.granary.z } };
    }
    if (w && !w.fallen[id]) {
      const s = sideOf(w, id), bt = w.bt, F = w.front;
      const p = slotOf(w, s, id, true);
      return { k: "war", s: Math.max(0, (s === "A" ? bt.muster - 20 : bt.arrive - 50) - d0), e: Math.min(1435, bt.end + 15 - d0), war: w.id, p: { x: p.x, z: p.z, label: (s === "A" ? "at war with " + App.villages[w.b].name : "defending " + App.villages[w.b].name), cx: F.x, cz: F.z } };
    }
    // the people of a place under attack who do not fight keep indoors while the battle is on
    const v = App.villageOfToken(id);
    const u = v && W().wars.find((x) => x.status === "on" && x.bt && x.bt.day === day && x.b === v.i);
    if (u) return { k: "shelter", warShelter: true, s: Math.max(0, u.bt.arrive - 30 - d0), e: Math.min(1435, u.bt.end + 5 - d0), p: { x: App.pop.home[2 * id], z: App.pop.home[2 * id + 1], label: "keeping indoors: " + v.name + " is at war" } };
    return null;
  };

  // ---------- formations on the ground ----------
  const routes = new Map(); // the march's way, worked out once per war (not saved)
  function marchRoute(w) {
    let R = routes.get(w.id);
    if (!R) {
      const A = App.villages[w.a], path = [{ x: A.x, z: A.z }].concat(App.route(A.x, A.z, w.front.x, w.front.z)), cum = [0];
      for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));
      R = { path, cum, L: cum[cum.length - 1] };
      routes.set(w.id, R);
    }
    return R;
  }
  function along(R, d) {
    d = Math.max(0, Math.min(R.L, d));
    let i = 1;
    while (i < R.path.length - 1 && R.cum[i] < d) i++;
    const a = R.path[i - 1], b = R.path[i] || a, seg = Math.max(1e-6, R.cum[i] - R.cum[i - 1]), f = Math.max(0, Math.min(1, (d - R.cum[i - 1]) / seg));
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    return { x: a.x + dx * f, z: a.z + dz * f, ux: dx / L, uz: dz / L };
  }
  // where a soldier stands in its army: its rank and file, by unit (the column's order)
  function rankOf(w, s, id) {
    const key = s + w.days;
    w._ord = w._ord || {};
    if (!w._ord[key]) { const ids = sideIds(w, s).slice().sort((a, b) => ORDER.indexOf(w.unit[a]) - ORDER.indexOf(w.unit[b]) || a - b); w._ord[key] = new Map(ids.map((x, i) => [x, i])); }
    return w._ord[key].get(id) || 0;
  }
  function slotOf(w, s, id, battle) {
    const k = rankOf(w, s, id), F = w.front, u = w.unit[id] || "infantry";
    const nx = -F.uz, nz = F.ux;
    if (s === "B" && w.siege) {
      const V = App.villages[w.b];
      if (!gateDown(w) && RANGED.has(u) && V.walls) {
        // up on the walls either side of the gate: archers, mages and tamers along the top, a pace apart
        const W0 = V.walls, ga = Math.atan2(F.gz - W0.z, F.gx - W0.x), kr = wallRank(w, id), j = Math.floor(kr / 2), side = kr % 2 ? 1 : -1, off = (6.2 + j * 1.3) / W0.r;
        return { x: W0.x + Math.cos(ga + side * off) * W0.r, z: W0.z + Math.sin(ga + side * off) * W0.r, h: Math.atan2(-F.ux, -F.uz) };
      }
      const at = gateDown(w) ? hallDoor(w) : { x: F.gx + F.ux * 4.5, z: F.gz + F.uz * 4.5 }, files = 6, r = Math.floor(k / files), f = (k % files) - (files - 1) / 2;
      return { x: at.x + F.ux * r * 1.4 + nx * f * 1.2, z: at.z + F.uz * r * 1.4 + nz * f * 1.2, h: Math.atan2(-F.ux, -F.uz) };
    }
    const files = 10, r = Math.floor(k / files), f = (k % files) - (files - 1) / 2, dir = s === "A" ? -1 : 1;
    let at = { x: F.x, z: F.z };
    if (s === "A" && (w.siege ? gateDown(w) : standing(w, "B").length < w.start.B * 0.25)) at = hallDoor(w);
    const gap = s === "A" && w.siege && !gateDown(w) ? 2 : 5;
    return { x: at.x + F.ux * dir * (gap + r * 1.6) + nx * f * 1.25, z: at.z + F.uz * dir * (gap + r * 1.6) + nz * f * 1.25, h: Math.atan2(F.ux * -dir, F.uz * -dir) };
  }
  function wallRank(w, id) {
    const key = "wall" + w.days;
    w._ord = w._ord || {};
    if (!w._ord[key]) w._ord[key] = new Map(sideIds(w, "B").filter((x) => RANGED.has(w.unit[x])).sort((a, b) => a - b).map((x, i) => [x, i]));
    return w._ord[key].get(id) || 0;
  }
  function hallDoor(w) { const v = App.villages[w.b], d = v.hall.door || v.hall; return { x: d.x - w.front.ux * 3, z: d.z - w.front.uz * 3 }; }
  // on the march: four abreast along the road, so far behind the head as its rank
  function marchPos(w, id) {
    const R = marchRoute(w), k = rankOf(w, "A", id), rank = Math.floor(k / 4), file = (k % 4) - 1.5;
    const head = (st.T - w.bt.depart) * App.WALK_SPEED * MARCH, d = head - rank * 1.5;
    const p = along(R, d < 0 ? 0 : d), back = d < 0 ? -d : 0;
    return { x: p.x - p.ux * back + -p.uz * file * 1.1, z: p.z - p.uz * back + p.ux * file * 1.1, h: Math.atan2(p.ux, p.uz), moving: d > 0 && d < R.L };
  }

  // ---------- the brain and the fighting near you (sim.js) ----------
  const LINES = { A: ["Forward!", "For " , "Break the gate!", "Charge!", "Hold the line!"], B: ["Hold them!", "Not one step back!", "Defend ", "Shields up!", "Push them back!"] };
  App.warBrain = (t, step) => {
    const w = W() && W().wars.find((x) => x.id === step.war);
    if (!w) return false;
    if (step.convoy) {
      if (w.status !== "convoy") return false;
      if (st.T < w.convoy.t0) { const g = App.villages[w.convoy.from].granary; App.startTravel(t, { x: g.x + (rnd() - 0.5) * 4, z: g.z + (rnd() - 0.5) * 4, label: "to the granary of " + App.villages[w.convoy.from].name }, "to carry off the spoils"); return true; }
      App.startTravel(t, step.p, "carrying the spoils home");
      return true;
    }
    if (w.status !== "on" || !w.bt || w.fallen[t.id]) return false;
    const s = sideOf(w, t.id), bt = w.bt;
    if (!s || st.T >= bt.end || bt.done) { App.startTravel(t, t.home, "home from the war"); return true; }
    if (s === "A" && st.T < bt.depart) {
      // mustering in the square, in column
      const p = marchPos(w, t.id);
      if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 1.5) { App.startTravel(t, { x: p.x, z: p.z, label: "mustering for the war" }, "to muster for the war"); return true; }
      t.action = { kind: "warfight", war: w.id, side: s, wait: true, started: st.T };
      return true;
    }
    if (s === "A" && st.T < bt.arrive) { t.action = { kind: "warmarch", war: w.id, started: st.T }; if (rnd() < 0.2) App.say(t, ["Forward, march!", "Left, right, left!", "To " + App.villages[w.b].name + "!"][Math.floor(rnd() * 3)], 2); return true; }
    const p = slotOf(w, s, t.id);
    if (s === "B" && w.siege && !gateDown(w) && RANGED.has(w.unit[t.id]) && App.wallDeckY && App.wallDeckY(p.x, p.z) != null) {
      // up the stairs of the gate towers and along the top of the wall to its place
      const W0 = App.villages[w.b].walls, F = w.front, inGate = { x: F.gx + F.ux * 4, z: F.gz + F.uz * 4 };
      if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 1 && Math.hypot(inGate.x - t.pos.x, inGate.z - t.pos.z) > 3 && App.wallDeckY(t.pos.x, t.pos.z) == null) { App.startTravel(t, { x: inGate.x, z: inGate.z, label: "to the walls" }, "up to the walls"); return true; }
      t.pos.x = p.x; t.pos.z = p.z; t.heading = p.h; void W0;
      t.action = { kind: "warfight", war: w.id, side: s, next: st.T + rnd() * 1.5, started: st.T, onWall: true };
      return true;
    }
    if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 12) { App.startTravel(t, { x: p.x, z: p.z, label: s === "A" ? "to the front" : "to the defences" }, s === "A" ? "to the front" : "to defend " + App.villages[w.b].name); return true; }
    t.action = { kind: "warfight", war: w.id, side: s, next: st.T + rnd() * 1.5, started: st.T };
    return true;
  };
  const foesNear = (w, t, s, R) => {
    let best = null, bd = R;
    for (const o of st.tickles) {
      if (o === t || App.isKO(o.id) || w.fallen[o.id] || sideOf(w, o.id) !== (s === "A" ? "B" : "A")) continue;
      const d = Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  };
  function ride(t, u) {
    if (u !== "cavalry" && u !== "griffin") return;
    const M = App.mountRide && App.mountRide(t, { slow: false, path: null }, 100);
    if (M && M.fly && t.riding) { const alt = 4.5 + Math.sin(st.T * 0.7 + t.id) * 0.8; t.riding.alt = alt; t.flyY = Math.max(App.surfaceAt(t.pos.x, t.pos.z).y, App.WATER_Y) + alt; }
  }
  App.stepWar = (t, a, dm, dtReal) => {
    const w = W() && W().wars.find((x) => x.id === a.war);
    if (!w || w.status !== "on" || !w.bt || w.bt.done || App.isKO(t.id) || w.fallen[t.id]) { t.action = null; t.flyY = null; App.animateTickle(t, false, dtReal); return; }
    const u = w.unit[t.id] || "infantry";
    if (a.kind === "warmarch") {
      if (st.T >= w.bt.arrive) { t.action = null; App.animateTickle(t, false, dtReal); return; }
      const p = marchPos(w, t.id);
      t.pos.x = p.x; t.pos.z = p.z; t.heading = p.h;
      ride(t, u);
      App.animateTickle(t, p.moving, dtReal);
      return;
    }
    if (a.wait) {
      if (st.T >= w.bt.depart) { t.action = null; App.animateTickle(t, false, dtReal); return; }
      App.faceTo(t, w.front, dtReal); App.animateTickle(t, false, dtReal); return;
    }
    if (st.T < w.bt.arrive) { App.faceTo(t, w.front, dtReal); App.animateTickle(t, false, dtReal); return; }
    // the battle: melee units go for the closest foe; the rest keep their place and cast or throw
    const p = slotOf(w, a.side, t.id), ranged = u === "mage" || u === "healer" || u === "tamer";
    // (while the gate stands, no one fights through it: the attackers hammer at it, the archers shoot over it)
    const foe = !ranged && w.siege && !gateDown(w) ? null : foesNear(w, t, a.side, ranged ? 22 : 9);
    let target = p, walking = false;
    a.engaged = false;
    // with no foe at hand, an attacker goes for the building it prefers and sets about it
    const bld = a.side === "A" ? (w.siege && !gateDown(w) && u !== "griffin" ? gateOf(w) : targetFor(w, u, t.pos)) : null;
    if (!foe && bld && !ranged) { const d = Math.hypot(bld.x - t.pos.x, bld.z - t.pos.z), R0 = bld.castle ? 9 : bld.gate ? 3.2 : 3; if (d > R0) target = { x: bld.x + (t.pos.x - bld.x) / d * R0, z: bld.z + (t.pos.z - bld.z) / d * R0 }; else target = null; }
    if (foe && !ranged) { const d = Math.hypot(foe.pos.x - t.pos.x, foe.pos.z - t.pos.z); if (d > 1.3) target = { x: foe.pos.x + (t.pos.x - foe.pos.x) / d * 1.2, z: foe.pos.z + (t.pos.z - foe.pos.z) / d * 1.2 }; else target = null; a.engaged = true; }
    if (a.onWall) { target = null; if (gateDown(w)) { t.action = null; App.animateTickle(t, false, dtReal); return; } }
    if (target && Math.hypot(target.x - t.pos.x, target.z - t.pos.z) > 0.4) {
      const dx = target.x - t.pos.x, dz = target.z - t.pos.z, d = Math.hypot(dx, dz), stp = Math.min(d, App.WALK_SPEED * dm * (u === "cavalry" ? 1.9 : 1.15));
      t.pos.x += (dx / d) * stp; t.pos.z += (dz / d) * stp; t.heading = Math.atan2(dx, dz); walking = stp > 1e-4;
    } else App.faceTo(t, foe ? foe.pos : { x: t.pos.x + Math.sin(p.h), z: t.pos.z + Math.cos(p.h) }, dtReal);
    ride(t, u);
    App.animateTickle(t, walking, dtReal);
    // blows and spells (what they cost the other side is decided by the battle itself, minute by minute)
    if (st.T >= a.next && dm > 0 && App.FX) {
      a.next = st.T + 1.2 + rnd() * 1.2;
      const from = { x: t.pos.x + Math.sin(t.heading) * 0.6, y: t.pos.y + 2.2, z: t.pos.z + Math.cos(t.heading) * 0.6 };
      const gate = bld && bld.idx === w.gate ? bld : null;
      if (ranged && (foe || bld)) {
        const to = foe ? { x: foe.pos.x, y: foe.pos.y + 1.2, z: foe.pos.z } : { x: bld.x, y: App.genHeight(bld.x, bld.z) + 3, z: bld.z };
        const school = u === "healer" ? "light" : u === "mage" ? (App.mageSchool(t.id) || "arcane") : "arcane";
        if (u === "archer") {
          const tt = foe;
          App.spawnParticle && App.spawnParticle({ kind: "stone", x0: from.x, y0: from.y + (a.onWall ? 0.4 : 0), z0: from.z, x1: to.x, y1: to.y, z1: to.z, arc: a.onWall ? 0.8 : 1.6, age: 0, life: 0.45, onHit: () => { if (tt && a.side === "B" && !w.fallen[tt.id] && rnd() < 0.12) fall(w, "A", tt.id); } });
        } else if (u === "healer") { const mate = st.tickles.find((o) => o !== t && sideOf(w, o.id) === a.side && !App.isKO(o.id) && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 10); if (mate) App.FX.heal(App.scene, { x: mate.pos.x, y: mate.pos.y + 1, z: mate.pos.z }); }
        else App.FX.bolt(App.scene, from, to, school, () => { if (!foe && bld) App.FX.burst(App.scene, to, "#c79a62", 8, 0.15); });
        t.throwAt = performance.now();
      } else if (foe && a.engaged && Math.hypot(foe.pos.x - t.pos.x, foe.pos.z - t.pos.z) < 1.6) {
        App.FX.slash(App.scene, { x: foe.pos.x, y: foe.pos.y + 1.2, z: foe.pos.z }, t.heading, a.side === "A" ? "#ff6b5e" : "#5ab0ff");
        t.throwAt = performance.now();
        if (rnd() < 0.15) App.say(t, ["Pow!", "Take that!", "Hiyah!", "Yield!"][Math.floor(rnd() * 4)], 1.2);
      } else if (!foe && bld && Math.hypot(bld.x - t.pos.x, bld.z - t.pos.z) < (bld.castle ? 12 : 6)) {
        // hammering at the gate or the castle door
        App.FX.burst(App.scene, { x: t.pos.x + Math.sin(t.heading) * 1.2, y: t.pos.y + 1.4, z: t.pos.z + Math.cos(t.heading) * 1.2 }, "#c79a62", 5, 0.12);
        t.throwAt = performance.now();
        if (rnd() < 0.08) App.say(t, bld === gate ? "Break it down!" : isDefense(bld) ? "Take out the defences!" : "Tear it down!", 1.5);
      }
      if (rnd() < 0.04) { const L = LINES[a.side], x = L[Math.floor(rnd() * L.length)]; App.say(t, x.endsWith(" ") ? x + App.villages[a.side === "A" ? w.a : w.b].name + "!" : x, 2); }
    }
    const k = Math.max(0, 1 - (performance.now() - (t.throwAt || 0)) / 380);
    if (t.arms) { t.arms.R.rotation.x = k > 0 ? 1.0 - (1 - k) * 3.0 : -0.3; t.arms.L.rotation.x = -0.15; }
  };
  App.warActionText = (t) => {
    const a = t.action, w = W() && W().wars.find((x) => x.id === a.war);
    if (!w) return "At war";
    const foe = App.villages[a.side === "A" || sideOf(w, t.id) === "A" ? w.b : w.a].name, u = UNITS[w.unit[t.id] || "infantry"].name;
    if (a.kind === "warmarch") return "Marching on " + foe + " (" + u.toLowerCase() + ", in column)";
    if (a.wait) return "Mustering for the war on " + foe;
    return (w.siege ? (sideOf(w, t.id) === "A" ? "Besieging " : "Holding the walls against ") : "In battle with ") + foe + " (" + u.toLowerCase() + ")";
  };

  // ---------- what you see near you every frame (ui.js): catapults throwing, gates opening and shutting, health bars ----------
  const leaves = new Map(); // gate idx -> { grp, L, R, open }
  let catT = 0;
  App.updateWar = (dt) => {
    if (!W() || App.inside) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, now = performance.now();
    // the great gates near you: open by day, shut at night (they open for the household) and through a war
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    const nearGates = (App.sceneryAll || []).length ? App.gridNear("village", tx, tz, 200).filter((v) => v.walls).flatMap((v) => gatesOf(v).map((g) => [v, g])) : [];
    const keep = new Set();
    for (const [v, g] of nearGates) {
      if (Math.hypot(g.x - tx, g.z - tz) > 170) continue;
      keep.add(g.idx);
      let G = leaves.get(g.idx);
      if (!G) {
        G = { grp: new THREE.Group(), L: null, R: null, open: 1 };
        leaves.set(g.idx, G);
        App.scene.add(G.grp);
        const S = App.S, k = g.scale || 1, mk = (r) => { const mesh = new THREE.Mesh(r.geo, App.voxMaterial); mesh.scale.setScalar(r.md.voxel * S); mesh.position.set(r.md.origin[0] * S, r.md.origin[1] * S, r.md.origin[2] * S); return mesh; };
        Promise.all([App.kitMesh("gateleaf", 0), App.kitMesh("gateleaf", 1)]).then(([r0, r1]) => {
          const R = new THREE.Group(), L = new THREE.Group();
          R.position.set((240 / 160) * k, 0, (100 / 160) * k); L.position.set((-240 / 160) * k, 0, (100 / 160) * k);
          const a = mk(r0), b = mk(r1); a.scale.multiplyScalar(k); a.position.multiplyScalar(k); b.scale.multiplyScalar(k); b.position.multiplyScalar(k);
          R.add(a); L.add(b); G.grp.add(R); G.grp.add(L); G.R = R; G.L = L;
        });
      }
      G.grp.visible = !g.ruined;
      G.grp.position.set(g.x, App.genHeight(g.x, g.z), g.z); G.grp.rotation.y = g.rot || 0;
      const war = W().wars.some((w) => w.status === "on" && (w.b === v.i || w.a === v.i) && w.bt && st.T >= w.bt.muster - 60 && st.T < w.bt.end + 10 && !(w.a === v.i && st.T < w.bt.depart + 15));
      const night = m < 6 * 60 || m >= 21 * 60;
      const someone = night && !war && st.tickles.some((t) => t.village === v && Math.hypot(t.pos.x - g.x, t.pos.z - g.z) < 7);
      const want = war ? 0 : night && !someone ? 0 : 1;
      G.open += (want - G.open) * Math.min(1, dt * 1.4);
      if (G.R) { G.R.rotation.y = G.open * 1.45; G.L.rotation.y = -G.open * 1.45; }
    }
    for (const [k, G] of leaves) if (!keep.has(k)) { App.scene.remove(G.grp); leaves.delete(k); }
    // the catapults near you: each arm swings over when it throws and is wound back again
    for (const v of App.gridNear("village", tx, tz, 200)) for (const c of v.catapults || []) {
      if (Math.hypot(c.x - tx, c.z - tz) > 150 || c.ruined) continue;
      keepArm.add("s" + c.idx);
      if (!arms.has("s" + c.idx)) arms.set("s" + c.idx, makeArm(c.x, c.z, c.rot || 0, 1));
      arms.get("s" + c.idx).grp.position.y = App.genHeight(c.x, c.z);
    }
    // a battle near you: the defenders' catapults throw at the engines and the attackers, the attackers' at the gate
    catT += dt;
    for (const w of W().wars) {
      if (w.status !== "on" || !w.bt || w.bt.done || st.T < w.bt.depart || !near(w.front.x, w.front.z, 180)) continue;
      const fighting = st.T >= w.bt.arrive;
      if (fighting) w.liveAt = now;
      drawEngines(w);
      if (!fighting || catT < 0.6) continue;
      const B = App.villages[w.b];
      for (const c of B.catapults || []) {
        const A = arms.get("s" + c.idx);
        if (c.ruined || !A || now - A.fired < 4500 || rnd() > 0.3) continue;
        const engs = (w.eng || []).map((e, i) => [e, engObjs.get(w.id + ":" + i)]).filter(([e, o]) => e.hp > 0 && o && Math.hypot(o.grp.position.x - c.x, o.grp.position.z - c.z) < 90);
        const foes = st.tickles.filter((t) => sideOf(w, t.id) === "A" && !App.isKO(t.id) && !w.fallen[t.id] && Math.hypot(t.pos.x - c.x, t.pos.z - c.z) < 90);
        const tgt = engs.length && rnd() < 0.5 ? engs[Math.floor(rnd() * engs.length)] : null, t = !tgt && foes.length ? foes[Math.floor(rnd() * foes.length)] : null;
        if (!tgt && !t) continue;
        const to = tgt ? { x: tgt[1].grp.position.x, y: tgt[1].grp.position.y + 1, z: tgt[1].grp.position.z } : { x: t.pos.x, y: t.pos.y + 0.4, z: t.pos.z };
        fire(A, to, () => {
          if (tgt) { hitEngine(w, tgt[0], 60); return; }
          for (const o of st.tickles) if (sideOf(w, o.id) === "A" && !w.fallen[o.id] && !App.isKO(o.id) && Math.hypot(o.pos.x - to.x, o.pos.z - to.z) < 2.2 && rnd() < 0.4) fall(w, "A", o.id);
        });
      }
      (w.eng || []).forEach((e, i) => {
        const o = engObjs.get(w.id + ":" + i);
        if (e.k !== "cat" || e.hp <= 0 || !o || !o.arm || now - o.arm.fired < 5000 || rnd() > 0.35) return;
        const bld = gateDown(w) ? hallOf(w.b) : gateOf(w);
        if (!bld || bld.ruined) return;
        const to = { x: bld.x + (rnd() - 0.5) * 3, y: App.genHeight(bld.x, bld.z) + 3 + rnd() * 2, z: bld.z + (rnd() - 0.5) * 3 };
        fire(o.arm, to, () => { if (w.status === "on" && App.damageBuilding(bld, 45, "in the war between " + App.villages[w.a].name + " and " + B.name) && bld === hallOf(w.b)) finish(w, "A", "The castle of " + B.name + " has fallen."); });
      });
    }
    // the wall towers near the front shoot arrows at the attackers
    if (catT >= 0.6) for (const w of W().wars) {
      if (w.status !== "on" || !w.siege || !w.bt || w.bt.done || st.T < w.bt.arrive || !near(w.front.x, w.front.z, 180)) continue;
      for (const tw of towersOf(App.villages[w.b])) {
        if (tw.ruined || rnd() > 0.35 || Math.hypot(tw.x - w.front.x, tw.z - w.front.z) > 45) continue;
        const foes = st.tickles.filter((t) => sideOf(w, t.id) === "A" && !App.isKO(t.id) && !w.fallen[t.id] && Math.hypot(t.pos.x - tw.x, t.pos.z - tw.z) < 30);
        if (!foes.length) continue;
        const t = foes[Math.floor(rnd() * foes.length)], y0 = App.genHeight(tw.x, tw.z) + 7;
        App.spawnParticle && App.spawnParticle({ kind: "stone", x0: tw.x, y0, z0: tw.z, x1: t.pos.x, y1: t.pos.y + 1, z1: t.pos.z, arc: 2, age: 0, life: 0.6, onHit: () => { if (!w.fallen[t.id] && rnd() < 0.25) fall(w, "A", t.id); } });
      }
    }
    if (catT >= 0.6) catT = 0;
    for (const [k, A] of arms) {
      if (!keepArm.has(k)) { if (A.grp.parent) A.grp.parent.remove(A.grp); arms.delete(k); continue; }
      // wound back (the bucket low at the back), thrown over in a quarter of a second, wound back over three
      const e = (now - A.fired) / 1000, ang = e < 0.25 ? -0.7 + (e / 0.25) * 2.6 : e < 1 ? 1.9 : e < 4 ? 1.9 - ((e - 1) / 3) * 2.6 : -0.7;
      if (A.pivot) A.pivot.rotation.x = ang;
    }
    for (const [k, o] of engObjs) if (!keepArm.has("e" + k)) { if (o.grp.parent) o.grp.parent.remove(o.grp); engObjs.delete(k); }
    keepArm.clear();
  };
  const arms = new Map(), engObjs = new Map(), keepArm = new Set();
  const meshOf = (r, k) => { const S = App.S, f = k || 1, m = new THREE.Mesh(r.geo, App.voxMaterial); m.scale.setScalar(r.md.voxel * S * f); m.position.set(r.md.origin[0] * S * f, r.md.origin[1] * S * f, r.md.origin[2] * S * f); return m; };
  // the arm of a catapult: a pivot at the axle, the arm hung from it
  function makeArm(x, z, rot, k, parent) {
    const S = App.S, grp = new THREE.Group(), pivot = new THREE.Group();
    pivot.position.set(0, 360 * S * k, 10 * S * k);
    grp.add(pivot); grp.position.set(x, 0, z); grp.rotation.y = rot;
    (parent || App.scene).add(grp);
    const A = { grp, pivot: null, fired: -1e9 };
    App.kitMesh("catapultarm", 0).then((r) => { pivot.add(meshOf(r, k)); A.pivot = pivot; });
    return A;
  }
  // a throw: the arm swings over, and the stone flies from the top of the swing
  function fire(A, to, onHit) {
    A.fired = performance.now();
    const p = new THREE.Vector3();
    A.grp.getWorldPosition(p);
    setTimeout(() => App.spawnParticle && App.spawnParticle({ kind: "stone", x0: p.x, y0: p.y + 5, z0: p.z, x1: to.x, y1: to.y, z1: to.z, arc: 9, age: 0, life: 1.5,
      onHit: () => { App.FX && App.FX.burst(App.scene, to, "#8a8a8a", 16, 0.25); App.sfx && App.sfx.crash && App.sfx.crash(0.4); onHit && onHit(); } }), 220);
  }
  // the attackers' engines: in the column on the march (the ram at its head, the catapults at its tail), then at
  // the gate (the ram, swinging its log) and out of reach of the walls (the catapults)
  function drawEngines(w) {
    const F = w.front, nx = -F.uz, nz = F.ux, R = marchRoute(w), head = (st.T - w.bt.depart) * App.WALK_SPEED * MARCH, n = sideIds(w, "A").length;
    (w.eng || []).forEach((e, i) => {
      if (e.hp <= 0) return;
      const key = w.id + ":" + i;
      keepArm.add("e" + key);
      let o = engObjs.get(key);
      if (!o) {
        const grp = new THREE.Group();
        App.scene.add(grp);
        o = { grp, arm: null };
        engObjs.set(key, o);
        App.kitMesh(e.k === "ram" ? "ram" : "catapult", 0).then((r) => grp.add(meshOf(r)));
        if (e.k === "cat") { o.arm = makeArm(0, 0, 0, 1, grp); arms.set("e" + key, o.arm); }
      }
      let x, z, h, swing = 0;
      if (st.T < w.bt.arrive) {
        const d = e.k === "ram" ? head + 3 : head - (Math.ceil(n / 4) + 2) * 1.5 - e.i * 4.5, p = along(R, Math.max(0, d));
        x = p.x; z = p.z; h = Math.atan2(p.ux, p.uz);
      } else if (e.k === "ram") {
        swing = gateDown(w) ? 0 : Math.max(0, Math.sin(performance.now() / 380));
        x = F.gx - F.ux * (3.4 - 0.6 * swing); z = F.gz - F.uz * (3.4 - 0.6 * swing); h = Math.atan2(F.ux, F.uz);
        if (!gateDown(w) && swing > 0.98 && App.FX && rnd() < 0.2) App.FX.burst(App.scene, { x: F.gx - F.ux * 1.5, y: App.genHeight(F.gx, F.gz) + 1.5, z: F.gz - F.uz * 1.5 }, "#c79a62", 6, 0.15);
      } else {
        const side = e.i ? 1 : -1;
        x = F.x - F.ux * 18 + nx * side * 5; z = F.z - F.uz * 18 + nz * side * 5; h = Math.atan2(F.ux, F.uz);
      }
      o.grp.position.set(x, App.genHeight(x, z), z); o.grp.rotation.y = h;
    });
  }

  // a fortress's great gate is shut fast through a battle: nobody walks through it until it is broken (sim.js)
  App.gateShut = (s) => {
    if (!W() || !s.tkey || s.ruined) return false;
    return W().wars.some((w) => w.status === "on" && w.bt && !w.bt.done && st.T >= w.bt.muster && st.T < w.bt.end && s.tkey.startsWith(App.villages[w.b].key + "/g"));
  };

  // ---------- the inspect window (inspect.js) ----------
  App.warSceneryInfo = (s, out) => {
    if (!s.building || !W()) return;
    const H = App.buildingHP(s);
    out.hp = { now: H.now, max: H.max, label: s.ruined ? "Destroyed: being rebuilt" : null };
    const kind = App.kindOf(s.type);
    if (kind === "armoury") { const v = App.villages[s.village]; out.text = "<p>Where the place keeps the arms taken in its wars: in a war it arms as many more of its people as it holds sets of arms.</p>"; if (v) out.rows.push(["Arms in store", String(W().stock[v.ident] || 0)]); }
    if (kind === "catapult") out.text = "<p>Stands inside the walls, between two gates. When the fortress is besieged it throws stones over the walls at the attackers.</p>";
    if (kind === "gatehouse") out.text = "<p>The great gate: open by day, shut at night (it opens for the household) and shut fast in a war. Besiegers must break it before they can go in.</p>";
    const v = s.village != null ? App.villages[s.village] : null, L = v && lordOf(v);
    if (L) out.chips.push("Held by " + L.name + " since a war");
    const w = v && W().wars.find((x) => x.status === "on" && (x.a === v.i || x.b === v.i));
    if (w) out.chips.push("At war with " + App.villages[w.a === v.i ? w.b : w.a].name);
  };
  // a place's name, with who holds it (village.js)
  const clanName0 = App.clanName;
  App.clanName = (c) => { const v = App.villages[c], s = clanName0(c), L = v && W() && lordOf(v); return L ? s + ", held by " + L.name : s; };

  // ---------- the war panel (Menu > World) ----------
  App.warSig = () => (W() ? W().wars.map((w) => w.id + w.status + (w.bt ? w.bt.day : "") + w.kos.A + "," + w.kos.B).join("|") + Object.keys(W().lords).length : "");
  App.warHTML = () => {
    if (!W()) return "";
    const live = W().wars.filter((w) => w.status !== "over"), past = W().wars.filter((w) => w.status === "over").slice(-5).reverse();
    let h = '<div class="card"><h3>Wars</h3><p class="note">Places whose quarrels have made them bitter rivals go to war. The armies muster at 13:00, march along the roads in column and fight from when they arrive until 19:30, day after day, until a castle or a hall falls or an army is broken. The fallen recover only when the war is over and the supplies have been moved. The winner takes everything, the place itself included, which pays it tribute until it wins its freedom back. Then three days of peace between the two, unless an ally takes the war up with its right to battle.</p>';
    if (!live.length) h += '<p class="note">No wars at the moment.</p>';
    for (const w of live) {
      const A = App.villages[w.a], B = App.villages[w.b], a = standing(w, "A").length, b = standing(w, "B").length;
      const when = w.status === "convoy" ? "won by " + App.villages[w.winner].name + "; supplies on the move until " + App.clock(w.convoy.t1).short : st.T < w.bt.depart ? "mustering, they march at " + App.clock(w.bt.depart).short : st.T < w.bt.arrive ? "marching, at the front at " + App.clock(w.bt.arrive).short : "fighting now (day " + w.days + ")";
      h += '<div class="kv"><span class="k"><button class="btn" data-war="' + w.id + '">' + esc(A.name) + " vs " + esc(B.name) + "</button></span><span>" + esc(when) + "</span>";
      h += '<span class="k">Armies</span><span>' + a + "/" + w.start.A + " (" + FORMATIONS[formationOf(w, "A")].name.toLowerCase() + ", led by " + esc(nm(w.A[0].general)) + ") against " + b + "/" + w.start.B + " (" + FORMATIONS[formationOf(w, "B")].name.toLowerCase() + ", led by " + esc(nm(w.B[0].general)) + ")</span>";
      const units = (s) => { const c = {}; for (const id of sideIds(w, s)) c[w.unit[id]] = (c[w.unit[id]] || 0) + 1; return ORDER.filter((k) => c[k]).map((k) => c[k] + " " + UNITS[k].name.toLowerCase()).join(", "); };
      h += '<span class="k">' + esc(A.name) + "</span><span>" + units("A") + (w.A.length > 1 ? "; allies " + w.A.slice(1).map((c) => esc(App.villages[c.vi].name)).join(", ") : "") + "</span>";
      h += '<span class="k">' + esc(B.name) + "</span><span>" + units("B") + (w.B.length > 1 ? "; allies " + w.B.slice(1).map((c) => esc(App.villages[c.vi].name)).join(", ") : "") + "</span>";
      const S = starsOf(w);
      h += '<span class="k">Stars</span><span>' + starText(S.stars) + " " + Math.round(S.pct * 100) + "% destroyed (" + S.down + " of " + S.of + " buildings)</span>";
      if (w.siege) h += '<span class="k">Siege</span><span>Gate: ' + (gateDown(w) ? "broken" : hpText(gateOf(w))) + " \u00b7 Castle: " + hpText(hallOf(w.b)) + " \u00b7 " + (B.catapults || []).filter((c) => !c.ruined).length + " catapults</span>";
      h += "</div>";
    }
    if (past.length) { h += '<div class="kv">'; for (const w of past) h += '<span class="k">' + esc(App.villages[w.a] ? App.villages[w.a].name : "?") + " vs " + esc(App.villages[w.b] ? App.villages[w.b].name : "?") + "</span><span>" + (w.truce ? "truce" : "won by " + esc(App.villages[w.winner].name) + (w.side === "A" ? " " + starText(w.stars || 0) : " (attack beaten off)")) + (w.loot ? ": " + w.loot.food + " food, " + w.loot.shells + " shells, " + w.loot.arms + " arms" + (w.loot.place ? " and the place" : "") : "") + "</span>"; h += "</div>"; }
    const held = Object.keys(W().lords).map((k) => [App.villages.find((v) => v.ident === k), App.villages.find((v) => v.ident === W().lords[k])]).filter(([a, b]) => a && b);
    if (held.length) h += '<p class="note">Held after a war: ' + held.map(([a, b]) => esc(a.name) + " by " + esc(b.name)).join(", ") + ".</p>";
    return h + "</div>";
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-war]"); if (!b) return; const w = W() && W().wars.find((x) => x.id === b.dataset.war); if (w) App.flyTo(w.front.x, w.front.z, 50); });

  // ---------- save, load ----------
  App.initWar = (saved) => {
    st.war = { wars: [], peace: {}, lords: {}, bhp: {}, stock: {}, fought: {}, day: undefined };
    if (saved) Object.assign(st.war, { peace: saved.peace || {}, lords: saved.lords || {}, bhp: saved.bhp || {}, stock: saved.stock || {}, fought: saved.fought || {}, day: saved.day });
    // a war under way goes on if both places are still where they were; otherwise its fallen get up
    for (const w of (saved && saved.wars) || []) {
      const A = App.villages[w.a], B = App.villages[w.b];
      if (!A || !B || A.ident !== w.aId || B.ident !== w.bId) { for (const id in w.fallen || {}) if (App.pop.ko[id] > 1e7) App.pop.ko[id] = 0; continue; }
      st.war.wars.push(w);
    }
    // places that are gone hold nothing and are held by nobody
    const idents = new Set(App.villages.map((v) => v.ident));
    for (const k in st.war.lords) if (!idents.has(k) || !idents.has(st.war.lords[k])) delete st.war.lords[k];
  };
  App.saveWar = () => (st.war ? { wars: st.war.wars.map((w) => { const o = Object.assign({}, w); delete o._ord; return o; }), peace: st.war.peace, lords: st.war.lords, bhp: st.war.bhp, stock: st.war.stock, fought: st.war.fought, day: st.war.day } : null);

  App.warSlot = (w, id) => slotOf(w, sideOf(w, id), id); // (for the tests: where a soldier stands)
  // test hook: a war declared now, the armies marching at once
  App.debugWar = (a, b) => {
    const w = declare(a, b, "A test war.");
    if (w) planDay(w, Math.floor(st.T / DAY), st.T);
    return w;
  };
})();
