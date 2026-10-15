/* Mines. Every region has one, dug into high ground. Some villagers of the villages around it are
 * miners: in the afternoon they go down and work the rock. What they bring up goes into their village's
 * stores, and every ore has a use:
 *   stone   speeds up rebuilding                coal    feeds the smith's forge (no coal, no forging)
 *   copper  tools: the whole village works faster
 *   iron    weapons and shields, so more villagers can stand against a dragon
 *   silver  silver-tipped weapons (harder blows, and far harder against dungeon monsters)
 *   gems    gem collars for the tamers' creatures     gold    sold for shells, and an offering to the Maker
 *   orichalcum, the legendary metal from the deep veins: the Orichalcum Blade for the village's best fighter
 * Each mine is rich in two of the lesser ores. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const near = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z) < 520;
  const ORES = (App.ORES = { stone: "Stone", coal: "Coal", copper: "Copper", iron: "Iron", silver: "Silver", gold: "Gold", gems: "Gems", orichalcum: "Orichalcum" });

  App.initMines = (saved) => {
    st.ore = (saved && saved.ore) || {};
    st.mineLog = Object.assign({ stone: 0, coal: 0, copper: 0, iron: 0, silver: 0, gold: 0, gems: 0, orichalcum: 0, forged: 0, blades: 0, tools: 0, silvered: 0, collars: 0 }, (saved && saved.mineLog) || {});
    st.mineDay = saved && saved.mineDay; st.forgeDay = saved && saved.forgeDay;
  };
  App.saveMines = () => ({ ore: st.ore, mineLog: st.mineLog, mineDay: st.mineDay, forgeDay: st.forgeDay });
  App.oreOf = (v) => { const o = st.ore[v.i] || (st.ore[v.i] = {}); for (const k in ORES) if (o[k] == null) o[k] = 0; if (o.tools == null) o.tools = 0; return o; };
  // tools from copper: every set makes the village's work a little quicker
  App.toolBonus = (v) => 1 + Math.min(10, (st.ore && st.ore[v.i] && st.ore[v.i].tools) || 0) * 0.02;

  // ---------- who mines ----------
  App.mineOf = (id) => {
    const v = App.villageOfToken(id);
    return (App.mines || []).find((m) => m.region === v.region && Math.hypot(m.x - v.x, m.z - v.z) < 300) || null;
  };
  App.isMiner = (id) => !!App.mineOf(id) && hash2(id, 231, 3) < 0.1 && App.doesChores(id);
  App.MINE_ACT = { id: "mine", name: "Mining", verb: "is working the rock face", needs: { energy: -6 }, capacity: 99, minutes: 30, where: "work", anim: "dig", source: "core", status: "core" };

  // one shift's haul (also used for miners seen live)
  function haul(id, m, v, k) {
    // the Maker's fortune, and a miner's standing in the Miners' Guild, make it luckier; a deeper mine has richer veins
    const o = App.oreOf(v), luck = (App.hasBlessing && App.hasBlessing(id, "fortune") ? 2 : 1) * (App.minerLuck ? App.minerLuck(id) : 1), deep = App.mineRich ? App.mineRich(m) : 1;
    const rich = (ore) => (m.rich && m.rich.includes(ore) ? 2.5 : 1) * deep;
    const got = { stone: 2 + Math.floor(hash2(id, k, 233) * 3), coal: hash2(id, k, 245) < 0.4 * rich("coal") ? 1 : 0, copper: hash2(id, k, 247) < 0.25 * rich("copper") ? 1 : 0,
      iron: hash2(id, k, 235) < 0.5 * deep ? 1 : 0, silver: hash2(id, k, 249) < 0.1 * rich("silver") * luck ? 1 : 0, gold: hash2(id, k, 237) < 0.12 * luck * deep ? 1 : 0,
      gems: hash2(id, k, 251) < 0.03 * rich("gems") * luck ? 1 : 0, orichalcum: m.orichalcum && hash2(id, k, 239) < 0.0012 * luck * deep ? 1 : 0 }; // orichalcum: a find every few days across the whole map
    for (const r in got) { o[r] += got[r]; st.mineLog[r] += got[r]; }
    // the shift digs the mine a little deeper, and earns the miner standing in its guild
    if (App.mineWorked) App.mineWorked(m, 1);
    if (App.guildDeed) App.guildDeed(id, 1);
    // a tamer at the rock face may win over a mine goblin or a cave spider
    if (App.tameMonster && App.isTamer(id) && App.creaturesOf(id).length < 3 && hash2(id, k, 253) < 0.01) {
      const c = App.tameMonster(id, hash2(id, k, 255) < 0.6 ? "goblin" : "spider", 2 + Math.floor(hash2(id, k, 257) * 4));
      if (c) { got.tamed = c; if (Math.hypot(m.x - App.cam.target.x, m.z - App.cam.target.z) < 400 || (App.isMine && App.isMine(id))) App.log("creature", App.nameOf(id) + " tamed a " + App.CREATURES[c.sp].name + " down " + m.name + " and named it " + c.nick + ".", "It comes up with its new friend at the end of the shift.", { who: [id] }); }
    }
    if (got.orichalcum) App.log("mine", App.nameOf(id) + " struck orichalcum deep in " + m.name + "!", "The legendary metal, rose-gold and warm to the touch. The smith of " + v.name + " will know what to do with it.", { who: [id] });
    return got;
  }
  App.mineHaul = haul;
  function shift(day) {
    for (let id = 0; id < TB.SUPPLY; id++) {
      if (App.pop.agent[id] || App.isKO(id) || App.isDead(id) || !App.isMiner(id)) continue;
      haul(id, App.mineOf(id), App.villageOfToken(id), day);
    }
  }

  // ---------- the smith, every evening ----------
  const WEAPONS = ["sword", "axe", "spear"];
  function forge(day) {
    for (const v of App.villages) {
      const o = App.oreOf(v);
      // orichalcum: the legendary blade for the village's best fighter
      if (o.orichalcum >= 1 && o.coal >= 2) {
        const best = v.residents.filter((id) => !App.isDead(id) && !(st.gear[id] && st.gear[id].legendary) && !(App.isMage && App.isMage(id))).sort((a, b) => App.levelOf(b) - App.levelOf(a))[0];
        if (best != null) {
          o.orichalcum -= 1; o.coal -= 2; st.mineLog.blades++;
          st.gear[best] = { weapon: "orisword", armor: 2, legendary: true };
          App.log("mine", "The smith of " + v.name + " forged an Orichalcum Blade for " + App.nameOf(best) + "!", "A legendary weapon: it cuts through a dragon's scales like no other.", { who: [best] });
        }
      }
      // iron: a weapon (and with plenty, a shield) for someone who has none; one a day at most
      const unarmed = o.iron >= 6 && o.coal >= 1 ? v.residents.find((x) => !App.isDead(x) && !App.gearOf(x)) : null;
      if (unarmed != null) {
        const id = unarmed;
        o.iron -= 6; o.coal -= 1;
        const armor = o.iron >= 2 ? 1 : 0;
        if (armor) o.iron -= 2;
        st.gear[id] = { weapon: WEAPONS[Math.floor(hash2(id, day, 241) * 3)], armor };
        st.mineLog.forged++;
        if (near(v.x, v.z)) App.log("mine", "The smith of " + v.name + " forged " + (st.gear[id].weapon === "axe" ? "an axe" : "a " + st.gear[id].weapon) + (armor ? " and a shield" : "") + " for " + App.nameOf(id) + ".", "Iron from the mine: one more villager ready to stand against a dragon.", { who: [id] });
      }
      // copper: a set of tools (up to ten), and everyone works a little faster
      if (o.copper >= 4 && o.coal >= 1 && o.tools < 10) { o.copper -= 4; o.coal -= 1; o.tools++; st.mineLog.tools++; if (near(v.x, v.z)) App.log("mine", "The smith of " + v.name + " made new tools from copper.", "Hoes, saws and buckets: the village works a little faster now."); }
      // silver: tips a fighter's weapon (harder blows, and far harder against dungeon monsters)
      if (o.silver >= 3 && o.coal >= 1) {
        const id = v.residents.find((x) => !App.isDead(x) && App.gearOf(x) && !App.gearOf(x).silver && !App.gearOf(x).blessed);
        if (id != null) { o.silver -= 3; o.coal -= 1; st.gear[id] = Object.assign({}, App.gearOf(id), { silver: true }); st.mineLog.silvered++; if (near(v.x, v.z)) App.log("mine", "The smith of " + v.name + " tipped " + App.nameOf(id) + "'s weapon with silver.", "Silver bites deep, and monsters fear it.", { who: [id] }); }
        else if (App.pay) { const each = (o.silver * 8) / v.residents.length; for (const x of v.residents) App.pay(x, each); o.silver = 0; }
      }
      // gems: a collar for a tamer's creature
      if (o.gems >= 2) {
        let done = false;
        for (const id of v.residents) { const c = App.leadCreature && App.leadCreature(id); if (c && !c.gem) { c.gem = true; o.gems -= 2; st.mineLog.collars++; done = true; if (near(v.x, v.z)) App.log("mine", App.nameOf(id) + "'s " + App.creatureLabel(c) + " got a gem collar.", "Its gems from the mine make it stronger in battle.", { who: [id] }); break; } }
        if (!done && App.pay) { const each = (o.gems * 15) / v.residents.length; for (const x of v.residents) App.pay(x, each); o.gems = 0; }
      }
      // gold: sold to the merchants, the shells shared out, and a little offered to the Maker
      if (o.gold >= 2 && App.pay) {
        const each = (o.gold * 12) / v.residents.length; for (const id of v.residents) App.pay(id, each);
        if (App.addEthernum) for (const id of v.residents) if (App.devout && App.devout(id)) App.addEthernum(id, 0.3);
        o.gold = 0;
      }
    }
  }
  // stone makes rebuilding go faster (rebuildTick asks)
  App.stoneBoost = (v) => { const o = App.oreOf(v); if (o.stone >= 1) { o.stone -= 0.25; return 1.5; } return 1; };

  // ---------- the clock ----------
  App.mineTick = () => {
    if (!st.ore) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= 17 * 60 + 30 && st.mineDay !== day) { st.mineDay = day; shift(day); }
    if (m >= 18 * 60 + 10 && st.forgeDay !== day) { st.forgeDay = day; forge(day); }
  };

  // ---------- the panel ----------
  App.minesHTML = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const L = st.mineLog;
    let h = '<div class="card"><h3>Mines</h3><p class="note">One in every region, each rich in two of the lesser ores. Stone speeds up rebuilding; coal feeds the forge; copper makes tools (the village works faster); iron makes weapons and shields; silver tips weapons (monsters fear it); gems make collars for creatures; gold is sold for shells and offered to the Maker; and orichalcum, from the deep veins, becomes the legendary Orichalcum Blade.</p><div class="kv">';
    for (const m of App.mines || []) h += '<span class="k"><button class="btn" data-mine="' + m.i + '">' + esc(m.name) + "</button></span><span>" + App.regions[m.region].name + " &middot; rich in " + (m.rich || []).join(" and ") + (m.orichalcum ? " &middot; a deep orichalcum vein" : "") + "</span>";
    if (App.mineLevel) h += '<span class="k">Levels</span><span>' + (App.mines || []).map((m) => esc(m.name) + " " + App.mineLevel(m) + "/5").join(", ") + " (the Miners' Guild digs them deeper: more galleries, richer veins)</span>";
    h += '<span class="k">Brought up</span><span>' + Object.keys(ORES).map((k) => L[k] + " " + k).join(", ") + '</span><span class="k">The smiths</span><span>' + L.forged + " weapons, " + L.tools + " sets of tools, " + L.silvered + " silver-tipped weapons, " + L.collars + " gem collars, " + L.blades + " Orichalcum Blades</span></div></div>";
    return h;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mine]");
    if (!b) return;
    const m = App.mines[+b.dataset.mine];
    if (m) App.flyTo(m.x, m.z, 30);
  });
})();
