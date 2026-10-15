/* Guilds. Every region has a Guild Quarter with a hall for each of six guilds, and a Tickle can belong
 * to one of them by what it does:
 *   Adventurers' Guild - the village parties that go down into the Great Underworld; dragon hunts
 *   Warriors' Guild    - the armed: they stand guard at the mines against the goblins, keep the night
 *                        watch, stand against dragons and go down with the parties
 *   Marauders' Guild   - scouts and treasure hunters: a party with a scout finds more and gets further;
 *                        out in the wilds they turn up hidden caches of Ethernum, gems and old relics
 *   Miners' Guild      - the miners: their work deepens the mines, which gives richer veins
 *   Merchants' Guild   - the traders who carry food (and sell treasure) between villages
 *   Mages' Guild       - those who study the Ether: they fight with spells (fire, frost, lightning,
 *                        arcane missiles) or heal their friends with light, at a dragon or down below
 * What a member does earns guild standing: Novice, Journeyman, Veteran, Master, Grandmaster. Standing makes
 * a fighter stronger in the Underworld and a miner luckier at the rock. Each hall shows its board. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the guild hall, in the kit's stroke format ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    const ROOF = ["#e07a3a", "#b0302b", "#5a3d8a", "#8a6a4a", "#2e8b3a", "#2f5fb0"];
    function guildhall(v) {
      const st = [], roof = C(ROOF[v || 0]), wall = C("#f3e2c0"), stone = C("#9a9a9a"), wood = C("#a0703a"), dark = C("#6b4a2b"), gold = C("#ffd23f");
      st.push(S("cube", [0, 0, 30], [450, 380, 30], { color: stone, round: 0.05 }));
      st.push(S("cube", [0, 0, 250], [400, 330, 220], { color: wall, round: 0.03 }));
      st.push(S("cube", [0, 335, 150], [80, 30, 125], { m: "sub", color: wall }));
      // layer 1: the roof and the doorway
      st.push(S("cube", [0, 0, 560], [450, 380, 110], { color: roof, cone: 0.85 }));
      st.push(S("cube", [0, 0, 470], [430, 360, 14], { color: dark }));
      st.push(S("cube", [0, 332, 150], [90, 20, 132], { color: dark, layer: 1 }));
      st.push(S("cube", [0, 334, 140], [70, 14, 120], { color: C("#3a2a1a"), layer: 1 }));
      // layer 2: the sign over the door and the banners on the corners
      st.push(S("cube", [0, 345, 395], [150, 10, 70], { color: wood, layer: 2 }));
      st.push(S("cube", [405, 300, 300], [10, 40, 130], { color: roof, mirror: true, offsX: 405, layer: 2 }));
      // layer 3: the guild's emblem on the sign
      if (v === 0) { // adventurers: a compass rose
        st.push(S("cylinder", [0, 358, 395], [52, 52, 6], { color: gold, rot: [1.5708, 0, 0], layer: 3 }));
        st.push(S("cube", [0, 362, 395], [10, 4, 62], { color: dark, rot: [0, 0.785, 0], layer: 3 }));
        st.push(S("cube", [0, 362, 395], [10, 4, 62], { color: dark, rot: [0, -0.785, 0], layer: 3 }));
      } else if (v === 1) { // warriors: a shield and a sword
        st.push(S("cylinder", [0, 358, 395], [55, 55, 6], { color: C("#e8443a"), rot: [1.5708, 0, 0], layer: 3 }));
        st.push(S("joint", [0, 364, 395], [7, 7, 62], { color: C("#c8c8c8"), layer: 3 }));
        st.push(S("cube", [0, 364, 370], [28, 5, 6], { color: gold, layer: 3 }));
      } else if (v === 2) { // marauders: a treasure map with its red cross
        st.push(S("cube", [0, 358, 395], [62, 4, 44], { color: C("#f3e2c0"), layer: 3 }));
        st.push(S("cube", [10, 362, 390], [5, 3, 22], { color: C("#e8443a"), rot: [0, 0.785, 0], layer: 3 }));
        st.push(S("cube", [10, 362, 390], [5, 3, 22], { color: C("#e8443a"), rot: [0, -0.785, 0], layer: 3 }));
      } else if (v === 3) { // miners: a pickaxe
        st.push(S("joint", [0, 362, 390], [7, 7, 55], { color: wood, rot: dir(0.3, 0, 1), layer: 3 }));
        st.push(S("cylinder", [14, 364, 440], [62, 8, 8], { color: C("#6a6a6a"), cone: 0.4, layer: 3 }));
      } else if (v === 5) { // mages: a crescent moon and a star
        st.push(S("cylinder", [0, 358, 398], [46, 46, 6], { color: gold, rot: [1.5708, 0, 0], layer: 3 }));
        st.push(S("cylinder", [16, 360, 410], [38, 38, 8], { m: "sub", color: gold, rot: [1.5708, 0, 0], layer: 3 }));
        st.push(S("cube", [40, 362, 370], [10, 4, 10], { color: C("#ffffff"), rot: [0, 0.785, 0], layer: 3 }));
      } else { // merchants: a pile of coins
        st.push(S("cylinder", [-22, 360, 385], [26, 26, 6], { color: gold, rot: [1.5708, 0, 0], layer: 3 }));
        st.push(S("cylinder", [22, 360, 400], [26, 26, 6], { color: gold, rot: [1.5708, 0, 0], layer: 3 }));
      }
      return st;
    }
    TB.KIT.guildhall = { name: "Guild Hall", group: "Village", variants: [0, 1, 2, 3, 4, 5], build: guildhall, voxel: [10, 24], scenery: true, variantLabel: (v) => ["Adventurers' Guild", "Warriors' Guild", "Marauders' Guild", "Miners' Guild", "Merchants' Guild", "Mages' Guild"][v] };
    // the guild's notice board, inside
    TB.KIT.board = { name: "Notice Board", group: "Interiors", variants: [0], voxel: [7], build: () => {
      const st = [];
      st.push(S("cube", [0, 0, 260], [150, 12, 110], { color: C("#a0703a") }));
      st.push(S("joint", [130, 0, 120], [10, 10, 120], { color: C("#6b4a2b"), mirror: true, offsX: 130 }));
      for (const [x, z, c] of [[-80, 290, "#fff4d6"], [-10, 300, "#ffd23f"], [70, 280, "#fff4d6"], [-50, 220, "#8fd3f4"], [40, 215, "#ff8fc0"]]) st.push(S("cube", [x, 14, z], [32, 3, 40], { color: C(c), layer: 1 }));
      return st;
    } };
  }
  if (!G.App) return;
  const App = G.App, st = App.st;
  const hash2 = App.hash2, DAY = 1440;
  const near = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z) < 520;
  const GUILDS = (App.GUILDS = {
    adventurers: { i: 0, name: "Adventurers' Guild", color: "#ffb48a", does: "go down into the Great Underworld and hunt dragons" },
    warriors: { i: 1, name: "Warriors' Guild", color: "#ff6b5e", does: "guard the mines against the goblins, keep the night watch and stand against dragons" },
    marauders: { i: 2, name: "Marauders' Guild", color: "#c9a6ff", does: "scout ahead of the parties and hunt for hidden treasure in the wilds" },
    miners: { i: 3, name: "Miners' Guild", color: "#d9a878", does: "work the mines, and dig them deeper" },
    merchants: { i: 4, name: "Merchants' Guild", color: "#7be08f", does: "carry food and treasure between the villages" },
    mages: { i: 5, name: "Mages' Guild", color: "#8fb8ff", does: "study the Ether and fight with spells (fire, frost, lightning, arcane missiles) or heal their friends with light" },
  });
  // ---------- magic: who casts, and what ----------
  // a quarter of the adventurers are mages; the Mages' Guild has its own; the Maker's healers mend their friends
  const SCHOOL = ["fire", "frost", "storm", "arcane", "fire", "frost", "storm", "arcane", "light", "light"];
  App.mageSchool = (id) => {
    if (App.heroOf && App.heroOf(id)) return App.hasBlessing && App.hasBlessing(id, "healing") ? "light" : null;
    const m = hash2(id, 293, 3) < 0.05 || (App.isAdventurer && App.isAdventurer(id) && hash2(id, 295, 3) < 0.3);
    return m ? SCHOOL[Math.floor(hash2(id, 297, 3) * SCHOOL.length)] : null;
  };
  App.isMage = (id) => !!App.mageSchool(id);
  App.combatRole = (id) => { const s = App.mageSchool(id); if (s) return s === "light" ? "healer" : "mage"; if (App.gearOf && App.gearOf(id)) return "warrior"; return App.leadCreature && App.leadCreature(id) ? "tamer" : null; };
  const KEYS = Object.keys(GUILDS);
  App.guildOf = (id) => {
    if (App.isAdventurer && App.isAdventurer(id)) return "adventurers";
    if (App.isMiner && App.isMiner(id)) return "miners";
    const F = App.factionOf ? App.factionOf(id) : null;
    if (F === "merchants") return "merchants";
    if (App.mageSchool(id)) return "mages";
    if ((App.jobOf && App.jobOf(id) === "hunter") || hash2(id, 271, 3) < 0.04) return "marauders";
    if (F === "watch" || (App.gearOf && App.gearOf(id))) return "warriors";
    return null;
  };
  // ---------- standing ----------
  const RANKS = (App.GUILD_RANKS = [["Novice", 0], ["Journeyman", 20], ["Veteran", 60], ["Master", 150], ["Grandmaster", 400]]);
  App.guildRank = (id) => { const x = (st.gxp && st.gxp[id]) || 0; let r = 0; for (let k = 0; k < RANKS.length; k++) if (x >= RANKS[k][1]) r = k; return r; };
  App.guildRankName = (id) => RANKS[App.guildRank(id)][0];
  App.guildDeed = (id, pts) => {
    if (!st.gxp || !App.guildOf(id)) return;
    const before = App.guildRank(id);
    st.gxp[id] = (st.gxp[id] || 0) + pts;
    const after = App.guildRank(id), t = App.pop.agent[id];
    if (after > before && (t || after >= 3)) App.log("guild", App.nameOf(id) + " is now a " + RANKS[after][0] + " of the " + GUILDS[App.guildOf(id)].name + ".", "Standing earned by its deeds.", { who: [id] });
  };
  // standing makes a fighter stronger down below, and a miner luckier at the rock
  App.guildPower = (id) => { const g = App.guildOf(id); return g === "adventurers" || g === "warriors" || g === "marauders" || g === "mages" ? 1 + 0.04 * App.guildRank(id) : 1; };
  App.minerLuck = (id) => (App.guildOf(id) === "miners" ? 1 + 0.1 * App.guildRank(id) : 1);
  App.initGuilds = (saved) => {
    st.gxp = (saved && saved.gxp) || {};
    st.mineLevel = (saved && saved.mineLevel) || {};
    st.mineWork = (saved && saved.mineWork) || {};
    st.guildLog = Object.assign({ caches: 0, relics: 0, guardShifts: 0, stolen: 0, saved: 0 }, (saved && saved.guildLog) || {});
    st.guildDay = saved && saved.guildDay;
  };
  App.saveGuilds = () => ({ gxp: st.gxp, mineLevel: st.mineLevel, mineWork: st.mineWork, guildLog: st.guildLog, guildDay: st.guildDay });

  // ---------- the Warriors' Guild guards the mines ----------
  // two warriors from the villages round each mine stand guard there in the afternoon; inside they fight the goblins
  const GUARD0 = 13 * 60 + 30, GUARD1 = 17 * 60 + 25;
  const guardCache = new Map();
  App.mineGuards = (M, day) => {
    const k = day + ":" + M.i;
    if (guardCache.has(k)) return guardCache.get(k);
    const pool = [];
    for (const v of App.villages) if (v.region === M.region && Math.hypot(v.x - M.x, v.z - M.z) < 300) for (const id of v.residents) {
      if (App.guildOf(id) !== "warriors" || App.isDead(id)) continue;
      const p = App.partyOf && App.partyOf(id, day);
      if (p) continue;
      // not those off on a dragon hunt or at the tournament
      if (App.factionOf && App.factionOf(id) === "guild" && App.huntOf && App.huntOf(id, day)) continue;
      if ((App.arenaOf && App.arenaOf(id, day)) || (App.trainingOf && App.trainingOf(id, day))) continue;
      pool.push([id, hash2(id, day, 273)]);
    }
    pool.sort((a, b) => a[1] - b[1]);
    const g = pool.slice(0, 2).map((x) => x[0]);
    guardCache.set(k, g);
    if (guardCache.size > 200) guardCache.delete(guardCache.keys().next().value);
    return g;
  };
  App.guardOf = (id, day) => { const M = App.mineOf && App.mineOf(id); if (!M && App.guildOf(id) === "warriors") { for (const m of App.mines || []) if (App.mineGuards(m, day).includes(id)) return m; return null; } return M && App.mineGuards(M, day).includes(id) ? M : null; };
  // the plan hook (population.js): a guard's afternoon at the mine
  App.guildPlan = (id, day) => {
    if (App.guildOf(id) !== "warriors") return null;
    let M = null;
    for (const m of App.mines || []) if (App.villageOfToken(id).region === m.region && App.mineGuards(m, day).includes(id)) { M = m; break; }
    if (!M) return null;
    const idx = App.mineGuards(M, day).indexOf(id), side = idx ? 1 : -1, ox = Math.cos(M.rot) * side * 2.2, oz = -Math.sin(M.rot) * side * 2.2;
    // set off early enough to be there when the shift starts (the mines are a long walk from the villages)
    const v = App.villageOfToken(id), walk = Math.min(150, (Math.hypot(v.x - M.door.x, v.z - M.door.z) * 1.25) / (App.WALK_SPEED || 2.1)), s0 = Math.max(12 * 60 + 30, GUARD0 - walk);
    // the second guard goes down inside with the miners and walks its rounds there (you see it when you go in)
    if (idx === 1) return { k: "rounds", s: s0, e: GUARD1, mine: M.i, p: { x: M.door.x + Math.sin(M.rot) * 3, z: M.door.z + Math.cos(M.rot) * 3, label: M.name + " (on guard down inside)", cx: M.x, cz: M.z, mine: M.i } };
    return { k: "guard", s: s0, e: GUARD1, mine: M.i, p: { x: M.door.x + Math.sin(M.rot) * 3.5 + ox, z: M.door.z + Math.cos(M.rot) * 3.5 + oz, label: M.name + " (guarding the miners)", cx: M.door.x + Math.sin(M.rot) * 12, cz: M.door.z + Math.cos(M.rot) * 12 } };
  };
  const GUARD_ACT = { id: "guard_mine", name: "Guarding the mine", verb: "is standing guard at the mine", needs: { social: 2 }, capacity: 9, minutes: 10, where: "self", anim: "guard", source: "core", status: "core" };
  App.guardBrain = (t, step) => {
    if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 1.5) return { travel: step.p, why: "to guard the mine" };
    if (Math.random() < 0.04) App.say(t, ["No goblin gets past me.", "All quiet down there?", "For the Warriors' Guild!"][Math.floor(Math.random() * 3)], 3);
    return { act: GUARD_ACT, face: { x: step.p.cx, z: step.p.cz }, until: st.T + 8 };
  };

  // ---------- the Miners' Guild deepens the mines ----------
  // every shift worked adds to a mine's works; enough of them opens a deeper level: more galleries, richer veins
  const LEVEL_AT = [0, 250, 750, 1750, 3500];
  App.mineLevel = (M) => (st.mineLevel && st.mineLevel[M.i]) || 1;
  App.mineNextAt = (M) => LEVEL_AT[App.mineLevel(M)] || null;
  App.mineWorked = (M, n) => {
    if (!st.mineWork) return;
    st.mineWork[M.i] = (st.mineWork[M.i] || 0) + n;
    const lv = App.mineLevel(M);
    if (lv < LEVEL_AT.length && st.mineWork[M.i] >= LEVEL_AT[lv]) {
      st.mineLevel[M.i] = lv + 1;
      App.log("mine", "The Miners' Guild has opened level " + (lv + 1) + " of " + M.name + "!", "Deeper galleries, richer veins" + (lv + 1 >= 4 && M.orichalcum ? ", and the orichalcum lies closer now" : "") + ".");
      if (near(M.x, M.z)) App.toast(M.name + " is now level " + (lv + 1));
    }
  };
  // how much better the veins are at a mine's level
  App.mineRich = (M) => 1 + 0.2 * (App.mineLevel(M) - 1);

  // ---------- the Marauders' Guild hunts treasure in the wilds ----------
  function caches(day) {
    for (let id = 0; id < TB.SUPPLY; id++) {
      if (App.guildOf(id) !== "marauders" || App.isDead(id) || App.isKO(id) || (App.jobOf && App.jobOf(id) !== "hunter" && hash2(id, day, 277) > 0.3)) continue;
      const r = hash2(id, day, 279) / (1 + 0.15 * App.guildRank(id));
      if (r > 0.05) continue;
      const v = App.villageOfToken(id), o = App.oreOf ? App.oreOf(v) : null, eth = 1 + Math.floor(hash2(id, day, 281) * 3);
      if (App.addEthernum) App.addEthernum(id, eth);
      if (o && hash2(id, day, 283) < 0.4) o.gems += 1;
      App.pay && App.pay(id, 10 + Math.round(hash2(id, day, 285) * 20));
      App.guildDeed(id, 4);
      st.guildLog.caches++;
      let relic = null;
      if (hash2(id, day, 287) < 0.02 && App.RELICS) {
        const keys = Object.keys(App.RELICS).filter((k) => App.RELICS[k].band <= 1);
        relic = keys[Math.floor(hash2(id, day, 289) * keys.length)];
        const list = (st.relics[id] = st.relics[id] || []);
        if (!list.includes(relic) && list.length < 6) { list.push(relic); st.guildLog.relics++; } else relic = null;
      }
      if (near(v.x, v.z) || relic) App.log("guild", App.nameOf(id) + " of the Marauders' Guild dug up a hidden cache!", eth + " Ethernum" + (relic ? " and an old relic: " + App.RELICS[relic].name : "") + ", with shells for the finder.", { who: [id] });
    }
  }
  // ---------- the day's deeds ----------
  function settle(day) {
    // the warriors who stood guard; the goblins steal from unguarded mines
    for (const M of App.mines || []) {
      const g = App.mineGuards(M, day);
      for (const id of g) { App.guildDeed(id, 3); st.guildLog.guardShifts++; if (App.armsWear) App.armsWear(id, 0.8, 0.5); }
      if (!g.length) {
        // nobody on guard: the goblins carry off part of the day's haul from the villages round the mine
        let lost = 0;
        for (const v of App.villages) if (v.region === M.region && Math.hypot(v.x - M.x, v.z - M.z) < 300) { const o = App.oreOf(v); for (const k of ["iron", "silver", "gold", "gems"]) { const take = Math.floor(o[k] * 0.1); o[k] -= take; lost += take; } }
        st.guildLog.stolen += lost;
        if (lost && near(M.x, M.z)) App.log("mine", "Goblins raided the stores of " + M.name + "'s villages: nobody stood guard.", lost + " pieces of ore are gone. The Warriors' Guild should post guards.");
      } else st.guildLog.saved++;
    }
    caches(day);
  }
  App.guildTick = () => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= GUARD1 + 5 && st.guildDay !== day) { st.guildDay = day; settle(day); }
  };

  // ---------- the guild quarter: one hall per guild in every region ----------
  App.guildHallAt = (x, z) => {
    let best = null, bd = 6;
    for (const q of App.guildQuarters || []) if (q) for (const h of q.halls) { const d = Math.hypot(h.door.x - x, h.door.z - z); if (d < bd) { bd = d; best = h; } }
    return best;
  };
  // now and then a member spends its free time at its guild's hall (the board, the talk, the news from below)
  App.guildLeisure = (id, day) => {
    if (hash2(id, day, 301) > 0.15) return null;
    const g = App.guildOf(id);
    if (!g) return null;
    const v = App.villageOfToken(id), Q = App.guildQuarters && App.guildQuarters[v.region];
    if (!Q || Math.hypot(Q.x - v.x, Q.z - v.z) > 320) return null;
    return Q.halls.find((h) => h.guild === g) || null;
  };
  // the board: who belongs in this region, the best of them, what they did today
  App.guildBoard = (key, region) => {
    const day = Math.floor(st.T / DAY), mem = [];
    for (const v of App.villages) if (v.region === region) for (const id of v.residents) if (App.guildOf(id) === key) mem.push(id);
    mem.sort((a, b) => ((st.gxp[b] || 0) - (st.gxp[a] || 0)));
    const out = { members: mem.length, top: mem.slice(0, 5), duty: "" };
    if (key === "adventurers") { const ps = Object.values(st.parties || {}).filter((p) => p && p.day === day && !p.chosen && App.villages[p.village].region === region); out.duty = ps.length + " part" + (ps.length === 1 ? "y" : "ies") + " down in the Underworld"; }
    else if (key === "warriors") { const ms = (App.mines || []).filter((M) => M.region === region); out.duty = ms.map((M) => M.name + ": " + App.mineGuards(M, day).map(App.nameOf).join(" and ") + " on guard").join("; ") || "no mine in this region"; }
    else if (key === "marauders") out.duty = st.guildLog.caches + " hidden caches found so far, " + st.guildLog.relics + " old relics";
    else if (key === "miners") { const ms = (App.mines || []).filter((M) => M.region === region); out.duty = ms.map((M) => M.name + " at level " + App.mineLevel(M) + (App.mineNextAt(M) ? " (" + Math.round(((st.mineWork[M.i] || 0) / App.mineNextAt(M)) * 100) + "% of the way to the next)" : " (the deepest)")).join("; ") || "no mine in this region"; }
    else if (key === "merchants") out.duty = (st.factionLog ? st.factionLog.trades : 0) + " trade runs so far";
    else if (key === "mages") { const sch = {}; for (const id of mem) { const s = App.mageSchool(id); sch[s] = (sch[s] || 0) + 1; } out.duty = Object.keys(sch).map((s) => sch[s] + " of " + (App.SPELLS && App.SPELLS[s] ? App.SPELLS[s].name : s)).join(", "); }
    return out;
  };
  App.guildsHTML = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const count = {}, masters = {};
    for (let id = 0; id < TB.SUPPLY; id++) { const g = App.guildOf(id); if (!g) continue; count[g] = (count[g] || 0) + 1; if (App.guildRank(id) >= 3) masters[g] = (masters[g] || 0) + 1; }
    let h = '<div class="card"><h3>The guilds</h3><p class="note">Every region has a Guild Quarter with a hall for each guild (click one, or go inside to read its board). Deeds earn standing (' + RANKS.map((r) => r[0]).join(", ") + "); standing makes a fighter stronger in the Underworld and a miner luckier at the rock.</p>";
    for (const k of KEYS) h += '<div class="row" style="justify-content:space-between"><span><b style="color:' + GUILDS[k].color + '">' + esc(GUILDS[k].name) + '</b></span><span class="note">' + (count[k] || 0).toLocaleString() + " members \u00b7 " + (masters[k] || 0) + " masters</span></div><p class=\"note\">They " + esc(GUILDS[k].does) + ".</p>";
    const mines = (App.mines || []).map((M) => esc(M.name) + " level " + App.mineLevel(M)).join(", ");
    h += '<p class="note">Mines: ' + mines + ". Goblin raids on unguarded mines so far: " + st.guildLog.stolen + " pieces of ore lost. Hidden caches found by marauders: " + st.guildLog.caches + ".</p></div>";
    return h;
  };
})(typeof self !== "undefined" ? self : this);
