/* Shells and factions. Every Tickle has a purse of shells: it is paid for its work, spends a little
 * every day, and money changes hands at the arenas, with the trainers, the merchants and the
 * outlaws. Across the clans run six factions:
 *   Adventurers' Guild - dungeons, and dragon hunts at the lairs (a beaten dragon hides for 3 days)
 *   Trainers' League   - coach other tamers' creatures at the arena, for a fee
 *   The Lucky Shells   - gamblers who bet at the tournaments and boxing matches (some go broke)
 *   Night Watch        - patrol their village at night and catch outlaws
 *   Black Sails        - outlaws who steal from purses or set fires at night
 *   Merchants          - carry food from villages with plenty to hungry ones, for shells
 * Near the player all of it happens in 3D (factionBrain below); elsewhere it is settled on the clock. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const DAY = 1440;
  const near = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z) < 520;

  // ---------- factions ----------
  const FACTIONS = (App.FACTIONS = {
    guild: { name: "Adventurers' Guild", color: "#ffb48a", what: "explore dungeons and hunt dragons" },
    trainers: { name: "Trainers' League", color: "#c9a6ff", what: "coach other tamers' creatures for a fee" },
    gamblers: { name: "The Lucky Shells", color: "#ffd23f", what: "bet on tournaments and boxing" },
    watch: { name: "Night Watch", color: "#8fd3f4", what: "patrol the village at night and catch outlaws" },
    outlaws: { name: "Black Sails", color: "#ff6b5e", what: "steal and start fires at night" },
    merchants: { name: "Merchants", color: "#7be08f", what: "carry food to hungry villages for shells" },
  });
  App.factionOf = (id) => {
    if (App.isAdventurer(id)) return "guild";
    const h = hash2(id, 141, 3);
    return h < 0.09 ? "trainers" : h < 0.21 ? "gamblers" : h < 0.3 ? "watch" : h < 0.345 ? "outlaws" : h < 0.42 ? "merchants" : null;
  };

  // ---------- shells ----------
  let SH = null;
  const DAYKEYS = ["factionDay", "payDay", "betDay", "nightPlanDay", "nightDay", "trainDay"];
  App.shellsOf = (id) => (SH ? SH[id] : 0);
  App.pay = (id, n) => { if (SH) SH[id] = Math.max(0, SH[id] + n); };
  App.initFactions = (saved) => {
    SH = new Float32Array(TB.SUPPLY);
    for (let id = 0; id < SH.length; id++) SH[id] = 20 + Math.floor(hash2(id, 143, 3) * 40);
    if (saved && saved.shells && saved.shells.length === SH.length) SH.set(saved.shells);
    st.hunts = (saved && saved.hunts) || {};
    st.hiding = (saved && saved.hiding) || {};
    st.nights = (saved && saved.nights) || {};
    st.trades = (saved && saved.trades) || {};
    st.training = (saved && saved.training) || {};
    st.factionLog = (saved && saved.factionLog) || { thefts: 0, fires: 0, caught: 0, bets: 0, betShells: 0, hunts: 0, huntsWon: 0, trades: 0, sessions: 0 };
    if (saved && saved.days) for (const k of DAYKEYS) st[k] = saved.days[k];
  };
  App.saveFactions = () => {
    const days = {};
    for (const k of DAYKEYS) days[k] = st[k];
    return { shells: Array.from(SH, (x) => Math.round(x)), hunts: st.hunts, hiding: st.hiding, nights: st.nights, trades: st.trades, training: st.training, factionLog: st.factionLog, days };
  };
  // wages at the end of the working day, and what daily life costs
  function payday() {
    for (let id = 0; id < SH.length; id++) {
      if (App.isDead(id)) continue;
      let w = 6 + (App.doesChores(id) ? 3 : 0);
      if (App.factionOf(id) === "outlaws") w -= 3; // they work less
      if (App.heroLuck && App.heroLuck(id)) w *= 2; // the Blessing of Fortune
      SH[id] = Math.max(0, SH[id] + w - 5);
    }
  }

  // ---------- dragon hunts ----------
  App.dragonHiding = (L) => (st.hiding ? st.hiding[L.i] > st.T : false);
  App.huntOf = (id, day) => {
    if (!st.hunts) return null;
    for (const k in st.hunts) { const h = st.hunts[k]; if (h.day === day && !h.done && h.party.includes(id)) return h; }
    return null;
  };
  function planHunts(day) {
    for (const L of App.lairs) {
      if (App.dragonHiding(L) || (App.dragonSlain && App.dragonSlain(L)) || hash2(L.i, day, 145) > 0.3) continue;
      // the strongest guild members from villages within reach of the lair (not those off to a dungeon today)
      const pool = [];
      for (const v of App.villages) if (Math.hypot(v.x - L.x, v.z - L.z) < 280) for (const id of v.residents) {
        if (App.factionOf(id) !== "guild" || App.isKO(id)) continue;
        const p = App.partyOf(id, day);
        if (p && p.members.includes(id)) continue;
        pool.push([id, App.levelOf(id) + hash2(id, day, 146) * 3]);
      }
      pool.sort((a, b) => b[1] - a[1]);
      const party = pool.slice(0, 6 + Math.floor(hash2(L.i, day, 147) * 3)).map((x) => x[0]);
      if (party.length < 4) continue;
      const k = day + ":" + L.i;
      st.hunts[k] = { key: k, day, lair: L.i, party, done: false, hp: 0, maxHp: 0, hits: 0, live: false };
      for (const id of party) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && t.action.kind !== "ko" && !t.action.order) App.endAction(t); }
      if (near(L.x, L.z)) App.log("hunt", "The Adventurers' Guild is gathering " + party.length + " hunters to go after the dragon of " + L.name + ".", "They set off after lunch. Whoever drives it off shares the reward.", { who: party.slice(0, 6) });
    }
  }
  App.huntWindow = { start: 13 * 60 + 40, end: 17 * 60 + 20 };
  function settleHunt(h) {
    if (h.done) return;
    h.done = true;
    const L = App.lairs[h.lair], alive = h.party.filter((id) => !App.isKO(id));
    let won;
    if (h.live) won = h.hp <= 0;
    else {
      const power = alive.reduce((s, id) => s + 8 + App.levelOf(id) * 2.5, 0), dragon = 120 + hash2(h.lair, h.day, 149) * 60;
      won = rnd() < power / (power + dragon);
      // the dragon does not go down without a fight
      const hurt = h.party.filter((id) => hash2(id, h.day, 151) < (won ? 0.15 : 0.35));
      for (const id of hurt) { if (hash2(id, h.day, 152) < 0.3) App.kill(id, "hunting the dragon of " + L.name); else App.pop.ko[id] = Math.max(App.pop.ko[id], st.T + 240); }
    }
    h.won = won;
    st.factionLog.hunts++;
    if (!h.live && App.armsWear) for (const id of h.party) App.armsWear(id, 6 + hash2(id, h.day, 735) * 10, 4 + hash2(id, h.day, 737) * 8);
    if (won) {
      st.factionLog.huntsWon++;
      st.hiding[h.lair] = st.T + 3 * DAY;
      const bounty = 40;
      for (const id of alive) { App.pay(id, bounty); App.giveXP(id, 60); if (App.addEthernum) App.addEthernum(id, 4); }
      App.log("hunt", "The Guild drove the dragon of " + L.name + " into hiding!", alive.length + " hunters share the reward of " + bounty + " shells each" + (App.addEthernum ? " and a few Ethernum crystals from its hoard" : "") + ". No attacks from " + L.name + " for three days.", { who: alive.slice(0, 6) });
    } else {
      for (const id of alive) App.giveXP(id, 20);
      if (near(L.x, L.z) || h.live) App.log("hunt", "The hunt at " + L.name + " failed; the dragon held its peak.", "The hunters limp home to try another day.", { who: h.party.slice(0, 6) });
      // and it does not forget who came for it
      const home = App.villageOfToken(h.party[0]);
      if (App.disturbDragon) App.disturbDragon(L, 1, home.i, "The dragon of " + L.name + " beat off the Guild's hunters, and now it wants revenge on " + home.name + "!");
    }
  }
  // the fight at the lair, near the player: the dragon stays on its peak and breathes fire at the hunters
  App.lairFight = (d, dm, dtReal) => {
    const h = d.hunt;
    if (!h || h.done) { d.hunt = null; return false; }
    const foes = st.tickles.filter((t) => h.party.includes(t.id) && !App.isKO(t.id) && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 18);
    if (foes.length) {
      let df = Math.atan2(foes[0].pos.x - d.x, foes[0].pos.z - d.z) - d.heading;
      while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283;
      d.heading += df * Math.min(1, dtReal * 2);
    }
    if (!(st.T < (h.nextFire || 0)) && foes.length) {
      h.nextFire = st.T + 4 + rnd() * 2;
      const tgt = foes[Math.floor(rnd() * foes.length)];
      App.breathe && App.breathe(d, { x: tgt.pos.x, z: tgt.pos.z });
      // the Guild's hunters know to dive out of the way, most of the time
      for (const t of foes) if (Math.hypot(t.pos.x - tgt.pos.x, t.pos.z - tgt.pos.z) < 2.5) {
        if (rnd() < 0.45) App.say(t, pick(["Missed me!", "Too slow!", "Hot, hot, hot!"]), 2);
        else App.hurt(t, 30 + rnd() * 15, "hunting the dragon of " + d.lair.name, "Too hot! KO!", 0.08);
      }
    }
    if (h.hp <= 0) {
      settleHunt(h); d.hunt = null;
      for (const t of foes) App.say(t, pick(["We did it!", "For the Guild!", "And stay away!"]), 4);
      return false;
    }
    return true;
  };
  App.huntOn = (L) => { if (!st.hunts) return null; for (const k in st.hunts) { const h = st.hunts[k]; if (h.lair === L.i && !h.done) return h; } return null; };

  // ---------- gamblers ----------
  // gamblers near a fight put money on it; called when a match starts and when it ends
  App.placeBets = (x, z, sideA, sideB, odds, skip) => {
    const bets = [];
    for (const t of st.tickles) {
      if (App.factionOf(t.id) !== "gamblers" || App.isKO(t.id) || (skip && skip.includes(t)) || Math.hypot(t.pos.x - x, t.pos.z - z) > 35) continue;
      const purse = App.shellsOf(t.id);
      if (purse < 2) { if (rnd() < 0.5) App.say(t, pick(["I'm broke...", "Lend me a shell?", "Just one more bet..."]), 3); continue; }
      const side = rnd() < (odds == null ? 0.5 : clamp(odds, 0.15, 0.85)) ? 0 : 1, stake = Math.max(1, Math.round(purse * (0.1 + rnd() * 0.4)));
      App.pay(t.id, -stake);
      bets.push({ t, pick: side, stake });
      st.factionLog.bets++; st.factionLog.betShells += stake;
      App.say(t, stake + " shells on " + (side === 0 ? sideA : sideB) + "!", 3);
    }
    return bets;
  };
  App.settleBets = (bets, winner) => {
    for (const b of bets) {
      if (b.pick === winner) { const win = Math.round(b.stake * 1.9); App.pay(b.t.id, win); App.say(b.t, pick(["Ka-ching! +" + win, "I knew it! +" + win, "Lucky me! +" + win]), 3); }
      else App.say(b.t, pick(["Noooo!", "Not again...", "Rigged!", "Double or nothing next time..."]), 3);
    }
  };
  // off screen: the region's gamblers bet on tonight's tournament
  function offscreenBets(day) {
    for (let id = 0; id < SH.length; id++) {
      if (App.factionOf(id) !== "gamblers" || App.pop.agent[id] || App.isKO(id) || SH[id] < 2) continue;
      const rounds = 1 + Math.floor(hash2(id, day, 153) * 4);
      for (let r = 0; r < rounds && SH[id] >= 2; r++) {
        const stake = Math.max(1, Math.round(SH[id] * (0.1 + hash2(id, day * 9 + r, 154) * 0.4)));
        SH[id] -= stake;
        if (hash2(id, day * 9 + r, 155) < (App.heroLuck && App.heroLuck(id) ? 0.65 : 0.47)) SH[id] += Math.round(stake * 1.9);
        st.factionLog.bets++; st.factionLog.betShells += stake;
      }
    }
  }

  // ---------- trainers ----------
  // every morning each trainer books up to three tamers of the region for an afternoon at the arena
  App.trainerAt = (id) => { const v = App.villageOfToken(id); const ar = App.arenas && App.arenas[v.region]; return ar && Math.hypot(ar.x - v.x, ar.z - v.z) < 300 ? ar : null; };
  function planTraining(day) {
    const list = [], busy = new Set();
    for (let id = 0; id < SH.length; id++) {
      if (App.factionOf(id) !== "trainers" || App.isKO(id) || App.isDead(id) || hash2(id, day, 175) > 0.7) continue;
      const ar = App.trainerAt(id);
      if (!ar) continue;
      const v = App.villageOfToken(id), tamers = [];
      for (const o of App.gridNear("village", v.x, v.z, 220)) for (const t of o.residents) {
        if (tamers.length >= 3) break;
        if (t === id || busy.has(t) || hash2(t, day, 157) > 0.08 || SH[t] < 5 || App.isKO(t) || !App.leadCreature(t) || App.villageOfToken(t).region !== ar.region) continue;
        tamers.push(t); busy.add(t);
      }
      if (tamers.length) list.push({ trainer: id, region: ar.region, tamers, done: false });
    }
    st.training[day] = list;
    idxDay = -1;
    for (const s of list) { App.invalidatePlan(s.trainer); s.tamers.forEach((t) => App.invalidatePlan(t)); }
    for (const k in st.training) if (+k < day - 2) delete st.training[k];
  }
  let idx = new Map(), idxDay = -1;
  App.trainingOf = (id, day) => {
    if (!st.training) return null;
    if (idxDay !== day) { idx = new Map(); idxDay = day; for (const s of st.training[day] || []) { idx.set(s.trainer, s); for (const t of s.tamers) idx.set(t, s); } }
    return idx.get(id) || null;
  };
  // the session's end: fees to the trainer, experience for the creatures
  function settleTraining(day) {
    for (const s of st.training[day] || []) {
      if (s.done) continue;
      s.done = true;
      let n = 0;
      for (const t of s.tamers) {
        const c = App.leadCreature(t);
        if (!c || SH[t] < 5) continue;
        SH[t] -= 5; SH[s.trainer] += 5; n++;
        App.creatureTrain && App.creatureTrain(c, 14 + Math.floor(App.levelOf(s.trainer) / 2));
      }
      st.factionLog.sessions++;
      const ar = App.arenas[s.region];
      if (n && ar && Math.hypot(ar.x - App.cam.target.x, ar.z - App.cam.target.z) < 200) App.log("train", App.nameOf(s.trainer) + " of the Trainers' League coached " + n + " creature" + (n > 1 ? "s" : "") + " at " + ar.name + ".", "Each tamer paid 5 shells; their creatures came away stronger.", { who: [s.trainer].concat(s.tamers) });
    }
  }

  // ---------- outlaws and the night watch ----------
  App.nightWindow = { start: 23 * 60, end: 23 * 60 + 50 };
  App.nightJobOf = (id, day) => {
    if (!st.nights) return null;
    const n = st.nights[day];
    if (!n) return null;
    return n.raids.find((r) => r.outlaw === id) || (n.watch.includes(id) ? { watch: true } : null);
  };
  function planNight(day) {
    const raids = [], watch = [];
    for (const v of App.villages) for (const id of v.residents) {
      const f = App.factionOf(id);
      if (App.isKO(id) || App.isDead(id)) continue;
      if (f === "watch" && hash2(id, day, 159) < 0.7) watch.push(id);
      if (f === "outlaws" && hash2(id, day, 161) < 0.15) {
        const targets = App.gridNear("village", v.x, v.z, 200).filter((o) => o !== v && Math.hypot(o.x - v.x, o.z - v.z) < 200);
        const o = targets.sort((a, b) => b.food - a.food)[Math.floor(hash2(id, day, 163) * Math.min(3, targets.length))];
        if (o && o.homes.length) raids.push({ outlaw: id, from: v.i, to: o.i, house: Math.floor(hash2(id, day, 169) * o.homes.length), kind: hash2(id, day, 165) < 0.75 ? "theft" : "arson", done: false });
      }
    }
    st.nights[day] = { raids, watch };
    for (const r of raids) App.invalidatePlan(r.outlaw);
    for (const id of watch) App.invalidatePlan(id);
    for (const k in st.nights) if (+k < day - 2) delete st.nights[k];
  }
  // whatever nobody saw happen: the watch of the target village may still catch the outlaw
  function settleNight(day) {
    const n = st.nights[day];
    if (!n) return;
    let thefts = 0, fires = 0, caught = 0;
    for (const r of n.raids) {
      if (r.done) continue;
      r.done = true;
      const o = App.villages[r.to], guards = o.residents.filter((id) => n.watch.includes(id) && !App.isKO(id)).length;
      if (rnd() < clamp(guards * 0.18 * (App.lawMul ? App.lawMul("watch") : 1), 0, 0.9)) { caught++; r.caught = true; jail(r.outlaw, o, null); continue; }
      outlawDeed(r, o, false);
      if (r.kind === "theft") thefts++; else fires++;
    }
    st.factionLog.thefts += thefts; st.factionLog.fires += fires; st.factionLog.caught += caught;
    if (thefts + fires + caught > 0) App.log("outlaw", "A night of the Black Sails: " + thefts + " thefts and " + fires + " fires.", caught + " outlaw" + (caught === 1 ? " was" : "s were") + " caught by the Night Watch and put in the stocks.");
  }
  function outlawDeed(r, o, live) {
    if (r.kind === "theft") {
      let take = 0;
      for (let k = 0; k < 4; k++) { const id = o.residents[Math.floor(rnd() * o.residents.length)], s = Math.min(SH[id], 5 + Math.floor(rnd() * 10)); SH[id] -= s; take += s; }
      SH[r.outlaw] += take;
      r.take = Math.round(take);
    } else {
      o.food = Math.max(0, o.food - 12);
      const h = o.homes[r.house] || o.homes[0];
      if (h && h.sc && !h.sc.ruined && (live || rnd() < 0.25)) App.ruin(h.sc, "in a fire set by the Black Sails");
    }
  }
  // caught: a night in the stocks, a fine, and the loot goes back
  function jail(id, o, guard) {
    App.pop.ko[id] = Math.max(App.pop.ko[id], st.T + DAY * 0.4);
    const fine = Math.min(SH[id], 20);
    SH[id] -= fine;
    if (guard) App.pay(guard.id, fine); else for (const g of o.residents.slice(0, 3)) App.pay(g, fine / 3);
  }

  // ---------- merchants ----------
  App.tradeOf = (id, day) => (st.trades && st.trades[day] ? st.trades[day].find((x) => x.merchant === id) : null);
  function planTrades(day) {
    // one delivery per hungry village, one sale per rich granary
    const list = [], served = new Set(), sold = new Set();
    for (const v of App.villages) for (const id of v.residents) {
      if (App.factionOf(id) !== "merchants" || App.isKO(id) || App.isDead(id) || hash2(id, day, 167) > 0.6) continue;
      const around = App.gridNear("village", v.x, v.z, 200).filter((o) => Math.hypot(o.x - v.x, o.z - v.z) < 200);
      const hungry = around.filter((o) => !served.has(o.i) && o.food < o.residents.length * 1.5).sort((a, b) => a.food - b.food)[0];
      const rich = hungry && around.filter((o) => !sold.has(o.i) && o.food > o.residents.length * 4 && Math.hypot(o.x - hungry.x, o.z - hungry.z) < 220).sort((a, b) => b.food - a.food)[0];
      if (hungry && rich && hungry !== rich) { list.push({ merchant: id, from: rich.i, to: hungry.i, done: false }); served.add(hungry.i); sold.add(rich.i); }
    }
    st.trades[day] = list;
    for (const t of list) App.invalidatePlan(t.merchant);
    for (const k in st.trades) if (+k < day - 2) delete st.trades[k];
  }
  // the deal: food out of the rich granary, into the hungry one; the hungry village pays in shells
  App.settleTrade = (tr) => {
    if (tr.done) return;
    tr.done = true;
    const a = App.villages[tr.from], b = App.villages[tr.to], load = Math.min(20, Math.max(0, a.food - a.residents.length * 3));
    if (load < 3) return;
    a.food -= load; b.food += load;
    const price = load * 2;
    let paid = 0;
    for (const id of b.residents) { const p = Math.min(SH[id], (price / b.residents.length) * 1.5); SH[id] -= p; paid += p; if (paid >= price) break; }
    SH[tr.merchant] += paid * 0.6;
    for (const id of a.residents.slice(0, 5)) SH[id] += (paid * 0.4) / 5;
    st.factionLog.trades++;
    tr.load = load;
    if (near(b.x, b.z)) App.log("trade", App.nameOf(tr.merchant) + " brought " + Math.round(load) + " food from " + a.name + " to hungry " + b.name + ".", b.name + " paid " + Math.round(paid) + " shells.", { who: [tr.merchant] });
  };

  // ---------- on screen: what each faction does when its step of the day comes up ----------
  App.FACTION_STEPS = { hunt: 1, train: 1, bet: 1, watch: 1, outlaw: 1, trade: 1, trade2: 1, guard: 1 };
  const ACT = (id, name, verb, needs, anim) => ({ id, name, verb, needs: needs || {}, capacity: 99, minutes: 6, where: "self", anim, source: "core", status: "core" });
  const COACH = ACT("coach", "Coaching", "is coaching creatures at the arena", { fun: 6, social: 6 });
  const DRILL = ACT("drill", "Training", "is training a creature at the arena", { fun: 8 });
  const BETTING = ACT("bet", "Betting", "is watching the tournament, shells in hand", { fun: 10, social: 4 }, "sitWatch");
  const PATROL = ACT("patrol", "Night watch", "is keeping watch over the village");
  const LURK = ACT("lurk", "Lurking", "is lurking in the shadows");
  const LOAD = ACT("load", "Trading", "is loading sacks of food", {}, "dig");
  const WAIT_HUNT = ACT("wait_hunt", "Dragon hunt", "is waiting for the dragon to show itself");
  const homeward = (t, why) => (Math.hypot(t.home.x - t.pos.x, t.home.z - t.pos.z) > 2 ? { travel: t.home, why } : { act: LURK, until: st.T + 6 });
  App.factionBrain = (t, step) => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY, p = step.p, far = Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 4;
    if (step.k === "guard") return App.guardBrain ? App.guardBrain(t, step) : null; // the Warriors' Guild at a mine door
    if (step.k === "hunt") {
      const h = st.hunts[step.hunt], L = h && App.lairs[h.lair];
      if (!h || h.done) return homeward(t, "home from the hunt");
      const D = App.dragonObjects && App.dragonObjects.get(L.i);
      if (D && D.hunt === h) {
        const d = Math.hypot(D.x - t.pos.x, D.z - t.pos.z);
        if (d > 30) return { travel: { x: D.x, z: D.z }, why: "to the dragon" };
        if (App.joinFight(t, D)) return { set: true };
      }
      if (far) return { travel: p, why: "to hunt the dragon of " + L.name };
      if (rnd() < 0.1) App.say(t, pick(["Come down and fight!", "For the Guild!", "I can see its tail..."]), 3);
      return { act: WAIT_HUNT, face: { x: L.x, z: L.z }, until: st.T + 4 };
    }
    if (step.k === "train") {
      if (far) return { travel: p, why: "to the arena" };
      const s = App.trainingOf(t.id, day), face = { x: p.cx, z: p.cz };
      if (s && s.trainer === t.id) {
        if (rnd() < 0.25) App.say(t, pick(["Again!", "Faster, faster!", "Good! Now dodge!", "Watch the tail!", "Breathe, then strike!"]), 2.5);
        return { act: COACH, face, until: st.T + 4 };
      }
      if (rnd() < 0.15) App.say(t, pick(["Come on, buddy!", "You can do it!", "Ten more laps!"]), 2.5);
      return { act: DRILL, face, until: st.T + 4 };
    }
    if (step.k === "bet") {
      if (far) return { travel: p, why: "to the arena" };
      if (rnd() < 0.06) App.say(t, pick(["Who's the favourite?", "Tonight's my night!", "Just one more bet..."]), 3);
      return { act: BETTING, face: { x: p.cx, z: p.cz }, until: st.T + 5 };
    }
    if (step.k === "watch") {
      const v = t.village, n = st.nights[day];
      // an outlaw creeping about the village? catch it
      if (n && m >= App.nightWindow.start - 40) {
        for (const o of st.tickles) {
          if (!o.step || o.step.k !== "outlaw" || App.isKO(o.id) || Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) > 12) continue;
          const r = n.raids.find((x) => x.outlaw === o.id && !x.done && x.to === v.i);
          if (!r) continue;
          r.done = true; r.caught = true;
          App.say(t, "Stop right there, Black Sail!", 3);
          App.say(o, pick(["Curses!", "It wasn't me!", "Not the stocks!"]), 3);
          jail(o.id, v, t);
          App.endAction(o);
          st.factionLog.caught++;
          App.log("outlaw", t.name + " of the Night Watch caught " + o.name + " of the Black Sails in " + v.name + ".", o.name + " spends the night in the stocks and pays a fine of shells to the watch.", { who: [t.id, o.id] });
          return { act: PATROL, until: st.T + 3 };
        }
      }
      // otherwise walk the rounds, corner to corner
      if (t.patrolAt && Math.hypot(t.patrolAt.x - t.pos.x, t.patrolAt.z - t.pos.z) < 3) {
        t.patrolAt = null;
        if (rnd() < 0.25) App.say(t, pick(["All quiet.", "Who goes there?", "Nothing on this side."]), 3);
        return { act: PATROL, face: { x: v.x, z: v.z }, until: st.T + 2 + rnd() * 3 };
      }
      for (let k = 0; k < 8 && !t.patrolAt; k++) { const a = rnd() * 6.28, d = v.r * (0.3 + rnd() * 0.6), q = { x: v.x + Math.cos(a) * d, z: v.z + Math.sin(a) * d }; if (App.isLand(q.x, q.z)) t.patrolAt = q; }
      return t.patrolAt ? { travel: t.patrolAt, why: "on patrol", slow: 0.8 } : { act: PATROL, until: st.T + 3 };
    }
    if (step.k === "outlaw") {
      const n = st.nights[day], r = n && n.raids.find((x) => x.outlaw === t.id);
      if (!r || r.done) return homeward(t, "slinking home");
      if (far) return { travel: p, why: "somewhere, quietly", slow: 0.7 };
      if (m < App.nightWindow.start) {
        if (rnd() < 0.05) App.say(t, "Shh...", 2);
        return { act: LURK, face: { x: p.cx, z: p.cz }, until: st.T + 3 };
      }
      // the deed
      const o = App.villages[r.to];
      r.done = true;
      outlawDeed(r, o, true);
      if (r.kind === "theft") {
        st.factionLog.thefts++;
        App.say(t, "Heh heh... " + r.take + " shells.", 3);
        App.log("outlaw", t.name + " of the Black Sails crept into " + o.name + " and stole " + r.take + " shells.", "Nobody from the Night Watch was close enough to stop it.", { who: [t.id] });
      } else {
        st.factionLog.fires++;
        const y = App.genHeight(p.cx, p.cz);
        for (let k = 0; k < 90; k++) App.spawnParticle({ kind: "fire", x: p.cx + (rnd() - 0.5) * 3, y: y + 0.5 + rnd(), z: p.cz + (rnd() - 0.5) * 3, vx: (rnd() - 0.5) * 2, vy: 3 + rnd() * 4, vz: (rnd() - 0.5) * 2, age: -k * 0.02, life: 0.8 + rnd() * 0.5 });
        App.say(t, "Let it burn!", 3);
        App.log("outlaw", t.name + " of the Black Sails set fire to a house in " + o.name + "!", "Some of the granary's food went up in smoke too. The villagers will have to rebuild.", { who: [t.id] });
      }
      return { act: LURK, until: st.T + 2 };
    }
    if (step.k === "trade" || step.k === "trade2") {
      const tr = App.tradeOf(t.id, day);
      if (!tr || tr.done) return null;
      const a = App.villages[tr.from], b = App.villages[tr.to];
      if (far) return { travel: p, why: step.k === "trade" ? "to buy food in " + a.name : "carrying food to " + b.name };
      if (step.k === "trade") {
        if (rnd() < 0.12) App.say(t, pick(["Fresh food for " + b.name + "!", "Two shells a sack.", "Load it up!"]), 3);
        return { act: LOAD, face: { x: p.cx, z: p.cz }, until: st.T + 5 };
      }
      App.settleTrade(tr);
      App.say(t, tr.load ? "Food from " + a.name + "! " + Math.round(tr.load) + " sacks." : "They had nothing left to sell...", 3);
      return { act: LOAD, face: { x: p.cx, z: p.cz }, until: st.T + 4 };
    }
    return null;
  };

  // ---------- the clock ----------
  App.factionTick = () => {
    if (!SH) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (st.factionDay !== day) { st.factionDay = day; planHunts(day); planTrades(day); planTraining(day); }
    if (m >= 17 * 60 + 15 && st.trainDay !== day) { st.trainDay = day; settleTraining(day); }
    if (m >= 18 * 60 && st.payDay !== day) { st.payDay = day; payday(); }
    if (m >= 19 * 60 + 40 && st.betDay !== day) { st.betDay = day; offscreenBets(day); }
    if (m >= 20 * 60 && st.nightPlanDay !== day) { st.nightPlanDay = day; planNight(day); }
    if (m >= 23 * 60 + 52 && st.nightDay !== day) { st.nightDay = day; settleNight(day); }
    for (const k in st.hunts) { const h = st.hunts[k]; if (!h.done && (h.day < day || m >= App.huntWindow.end)) settleHunt(h); if (h.day < day - 2) delete st.hunts[k]; }
    for (const tr of st.trades[day] || []) if (!tr.done && m >= 16 * 60 + 30) App.settleTrade(tr);
  };

  // ---------- the panel ----------
  App.factionsHTML = () => {
    if (!SH) return "";
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const count = {}, best = {}, rich = [];
    for (let id = 0; id < SH.length; id++) {
      const f = App.factionOf(id);
      if (f) { count[f] = (count[f] || 0) + 1; if (best[f] == null || App.levelOf(id) > App.levelOf(best[f])) best[f] = id; }
      rich.push(id);
    }
    rich.sort((a, b) => SH[b] - SH[a]);
    const L = st.factionLog, dot = " &middot; ";
    let h = '<div class="card"><h2>Factions</h2><p class="note">They cut across the clans: a Sabre and a Koda can both be in the Night Watch. Money is counted in shells: everyone earns a wage for their work and spends a little every day.</p><div class="kv">';
    for (const k in FACTIONS) h += '<span class="k"><span class="clandot" style="background:' + FACTIONS[k].color + '"></span>' + FACTIONS[k].name + "</span><span>" + (count[k] || 0) + " members" + dot + FACTIONS[k].what + (best[k] != null ? dot + "best: " + esc(App.nameOf(best[k])) : "") + "</span>";
    h += "</div></div>";
    h += '<div class="card"><h3>So far</h3><div class="kv"><span class="k">Dragon hunts</span><span>' + L.hunts + " (" + L.huntsWon + " won)</span>" +
      '<span class="k">Training sessions</span><span>' + (L.sessions || 0) + "</span>" +
      '<span class="k">Bets</span><span>' + L.bets + " (" + Math.round(L.betShells).toLocaleString() + ' shells staked)</span><span class="k">Thefts and fires</span><span>' + L.thefts + " and " + L.fires + " (" + L.caught + ' outlaws caught)</span><span class="k">Food deliveries</span><span>' + L.trades + "</span></div>" +
      (App.lairs.some((x) => App.dragonHiding(x)) ? '<p class="note">In hiding: ' + App.lairs.filter((x) => App.dragonHiding(x)).map((x) => esc(x.name)).join(", ") + ".</p>" : "") + "</div>";
    h += '<div class="card"><h3>Richest Tickles</h3>' + rich.slice(0, 6).map((id, i) => '<div class="row" style="justify-content:space-between"><span>' + (i + 1) + ". " + esc(App.nameOf(id)) + '</span><span class="note">' + Math.round(SH[id]) + " shells" + (App.factionOf(id) ? dot + FACTIONS[App.factionOf(id)].name : "") + "</span></div>").join("") + "</div>";
    return h;
  };
})();
