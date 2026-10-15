/* Faith in the Maker. The Tickles venerate the one who made them as "the Maker"; his name has been lost,
 * only his initials, P.M., survive in the stories the Tickles tell. In the middle of
 * the great lake, on the Maker's Isle, stands a giant golden statue of a Tickle raising its arms to the
 * sky (the Maker himself is never shown); the devout go there on pilgrimage on the launches that leave
 * every dock, and the revival ritual in each village is a prayer to the Maker. Prayers
 * are answered in Ethernum, the crystals that power creature magic (also found in dungeons and in a
 * dragon's hoard).
 * The rarest Tickles of the collection are the Maker's blessed, the heroes: every Tickle of Matching
 * Rank 8 carries the blessing of its colour (might, the bulwark, healing or fortune), and the 1/1s --
 * the only one of their colour at rank 8, and the only Tickle at rank 0 -- carry the total blessing. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  // ---------- the blessed ----------
  const BLESSINGS = (App.BLESSINGS = {
    might: { name: "Blessing of Might", what: "strikes far harder", color: "#ffd23f" },
    bulwark: { name: "Blessing of the Bulwark", what: "twice the health, and blows glance off", color: "#8fd3f4" },
    healing: { name: "Blessing of Healing", what: "heals the fighters around it and halves the cost of a revival", color: "#7be08f" },
    fortune: { name: "Blessing of Fortune", what: "double wages, luck at the bets and a nose for treasure", color: "#ffb020" },
    total: { name: "Total Blessing", what: "all of the Maker's gifts at once", color: "#ffffff" },
  });
  const BY_THEME = { "Yellow & Black": "might", Orange: "might", Maroon: "bulwark", "Brown & Blue": "bulwark", Pink: "healing", Green: "healing", Golden: "fortune", Beige: "fortune" };
  const THEMES = ["Location Theme", "Glasses Theme", "Shirt Theme", "Ground Theme", "Holding Theme", "Head Theme", "Necklace Theme", "Shoes Theme"];
  // the collection's Matching Rank: how many of a Tickle's eight themed parts share one colour
  App.matchingRank = (id) => {
    const t = App.traitsOf(id), cnt = {};
    let best = 0, theme = null;
    for (const k of THEMES) { const v = t[k]; if (v && v !== "None") { cnt[v] = (cnt[v] || 0) + 1; if (cnt[v] > best) { best = cnt[v]; theme = v; } } }
    return { rank: best, theme };
  };
  let HEROES = null;
  function heroes() {
    if (HEROES) return HEROES;
    HEROES = new Map();
    const rank8 = {}, rank0 = [];
    for (let id = 0; id < TB.SUPPLY; id++) {
      const m = App.matchingRank(id);
      if (m.rank === 8) (rank8[m.theme] = rank8[m.theme] || []).push(id);
      else if (m.rank === 0) rank0.push(id);
    }
    for (const th in rank8) for (const id of rank8[th]) { const one = rank8[th].length === 1; HEROES.set(id, { id, rank: 8, theme: th, one, kind: one ? "total" : BY_THEME[th] || "might" }); }
    for (const id of rank0) { const one = rank0.length === 1; HEROES.set(id, { id, rank: 0, theme: null, one, kind: one ? "total" : "fortune" }); }
    return HEROES;
  }
  App.heroOf = (id) => heroes().get(id) || null;
  App.heroList = () => [...heroes().values()];
  App.blessingOf = (id) => { const h = App.heroOf(id); return h ? h.kind : null; };
  const has = (id, k) => { const b = App.blessingOf(id); return b === k || b === "total"; };
  App.hasBlessing = has;
  // what the blessings do, for the rest of the game to ask
  App.heroPower = (id) => (App.blessingOf(id) === "total" ? 2.2 : has(id, "might") ? 1.8 : App.heroOf(id) ? 1.2 : 1);
  App.heroHP = (id) => (App.blessingOf(id) === "total" ? 2.5 : has(id, "bulwark") ? 2 : App.heroOf(id) ? 1.3 : 1);
  App.heroGuard = (id) => (has(id, "bulwark") ? 0.6 : 1);
  App.heroLuck = (id) => (has(id, "fortune") ? 1 : 0);

  // ---------- Ethernum ----------
  let ETH = null;
  App.ethernumOf = (id) => (ETH ? ETH[id] : 0);
  App.addEthernum = (id, n) => { if (ETH) ETH[id] = Math.max(0, ETH[id] + n); };
  App.spendEthernum = (id, n) => { if (!ETH || ETH[id] < n) return false; ETH[id] -= n; return true; };
  App.devout = (id) => App.heroOf(id) || hash2(id, 221, 3) < 0.3;
  App.initFaith = (saved) => {
    ETH = new Float32Array(TB.SUPPLY);
    for (let id = 0; id < ETH.length; id++) ETH[id] = Math.floor(hash2(id, 223, 3) * 3) + (App.isTamer(id) ? 2 : 0) + (App.heroOf(id) ? 10 : 0);
    if (saved && saved.eth && saved.eth.length === ETH.length) ETH.set(saved.eth);
    st.prayDay = saved && saved.prayDay;
    st.faithLog = (saved && saved.faithLog) || { prayers: 0, spells: 0 };
  };
  App.saveFaith = () => ({ eth: Array.from(ETH, (x) => Math.round(x * 10) / 10), prayDay: st.prayDay, faithLog: st.faithLog });

  // ---------- prayers ----------
  // the devout spend the start of their free time at the statue on about half the days
  // a pilgrimage to the Maker's Isle now and then (the blessed go more often)
  App.prayerOf = (id, day) => App.devout(id) && hash2(id, day, 225) < (App.heroOf(id) ? 0.5 : 0.3);
  App.prayerSpot = (id) => {
    const I = App.ISLE, a = hash2(id, 227, 3) * 6.283, r = 9.5 + hash2(id, 229, 3) * 3.5;
    return { x: I.x + Math.cos(a) * r, z: I.z + Math.sin(a) * r, label: "the Maker's Isle (pilgrimage)", cx: I.x, cz: I.z };
  };
  App.PRAY = { id: "pray", name: "Pray to the Maker", verb: "is praying to the Maker", needs: { social: 6, fun: 4 }, capacity: 99, minutes: 8, where: "self", anim: "chant", source: "core", status: "core" };
  // answered prayers: a little Ethernum, more for the blessed
  function answer(day) {
    let n = 0;
    for (let id = 0; id < ETH.length; id++) if (!App.isDead(id) && App.prayerOf(id, day)) { ETH[id] += App.heroOf(id) ? 3 : 1.5; n++; }
    st.faithLog.prayers += n;
  }
  App.prayed = (t) => {
    if (rnd() < 0.08) {
      App.say(t, pick(["Thank you, Maker.", "Maker, watch over us.", "Bless our granary.", "For the Maker!"]), 3);
      if (rnd() < 0.3) for (let k = 0; k < 10; k++) App.spawnParticle({ kind: "spark", x: t.pos.x, y: t.pos.y + 3, z: t.pos.z, vx: (rnd() - 0.5) * 1.2, vy: 1.5 + rnd() * 2, vz: (rnd() - 0.5) * 1.2, age: -k * 0.03, life: 1, color: new THREE.Color("#ffd23f") });
    }
  };

  // ---------- the Ether fields: crystals growing out of the rock, out in the wild ----------
  // tamers and the devout go and gather some in their free time now and then
  App.etherFieldNear = (x, z) => (App.etherFields || []).filter((f) => Math.hypot(f.x - x, f.z - z) < 260).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0] || null;
  App.etherOf = (id, day) => {
    if (!(App.isTamer(id) || App.devout(id)) || hash2(id, day, 253) > 0.12) return null;
    const P = App.pop;
    return App.etherFieldNear(P.home[2 * id], P.home[2 * id + 1]);
  };
  App.etherSpot = (id, f, day) => { const a = hash2(id, day, 255) * 6.283, r = 4 + hash2(id, day, 257) * 6; return { x: f.x + Math.cos(a) * r, z: f.z + Math.sin(a) * r, label: f.name + " (gathering Ether)", cx: f.x, cz: f.z }; };
  App.GATHER_ETHER = { id: "gather_ether", name: "Gather Ether", verb: "is gathering Ether crystals", needs: { fun: 6 }, capacity: 99, minutes: 10, where: "self", anim: "reach", source: "core", status: "core" };
  App.gatheredEther = (t) => {
    App.addEthernum(t.id, 0.4);
    st.faithLog.ether = (st.faithLog.ether || 0) + 0.4;
    for (let k = 0; k < 14; k++) App.spawnParticle({ kind: "spark", x: t.pos.x + (rnd() - 0.5), y: t.pos.y + 1.5, z: t.pos.z + (rnd() - 0.5), vx: (rnd() - 0.5) * 2, vy: 1.5 + rnd() * 2, vz: (rnd() - 0.5) * 2, age: -k * 0.02, life: 0.9, color: new THREE.Color(rnd() < 0.5 ? "#c9a6ff" : "#8fd3f4") });
    if (rnd() < 0.15) App.say(t, pick(["Ether crystals!", "Feel that energy...", "These will power a spell or two."]), 3);
  };
  function etherDay(day) { for (let id = 0; id < ETH.length; id++) if (!App.pop.agent[id] && !App.isDead(id) && App.etherOf(id, day)) { ETH[id] += 1.5; st.faithLog.ether = (st.faithLog.ether || 0) + 1.5; } }

  // ---------- creature magic: a spell costs one Ethernum of its tamer ----------
  const SPELLS = { Fire: "Ember Nova", Water: "Tidal Crash", Nature: "Bloom Storm", Earth: "Quake", Spark: "Thunder Arc", Air: "Sky Cutter", Mystic: "Ether Beam" };
  App.spellOf = (type) => SPELLS[type] || "Ether Beam";
  // a tamer with Ethernum may have its creature cast a spell instead of a plain attack
  App.tryCast = (ownerId, chance) => {
    if (ownerId == null || rnd() > chance || !App.spendEthernum(ownerId, 1)) return false;
    st.faithLog.spells++;
    return true;
  };

  // ---------- the halo of the blessed ----------
  App.makeHalo = (t) => {
    const h = App.heroOf(t.id);
    if (!h || t.halo) return;
    const B = BLESSINGS[h.kind], m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 18), new THREE.MeshBasicMaterial({ color: B.color }));
    m.rotation.x = Math.PI / 2;
    m.position.y = t.height + 0.35;
    t.pivot.add(m);
    t.halo = m;
  };
  // every frame: halos bob, the blessed sparkle, healers mend the fighters around them
  App.stepFaith = (dm) => {
    const now = performance.now() / 1000;
    for (const f of App.etherFields || []) {
      if (Math.abs(f.x - App.cam.target.x) + Math.abs(f.z - App.cam.target.z) > 150 || rnd() > dm * 4) continue;
      const a = rnd() * 6.283, r = rnd() * 8;
      App.spawnParticle({ kind: "spark", x: f.x + Math.cos(a) * r, y: App.genHeight(f.x, f.z) + 1 + rnd() * 2, z: f.z + Math.sin(a) * r, vx: 0, vy: 1 + rnd(), vz: 0, age: 0, life: 1.2, color: new THREE.Color(rnd() < 0.5 ? "#c9a6ff" : "#8fd3f4") });
    }
    for (const t of st.tickles) {
      if (!t.halo) continue;
      t.halo.position.y = t.height + 0.35 + Math.sin(now * 2 + t.id) * 0.06;
      t.halo.rotation.z += dm * 0.5;
      const b = App.blessingOf(t.id);
      if (t.group.visible && rnd() < dm * 0.6) App.spawnParticle({ kind: "spark", x: t.pos.x + (rnd() - 0.5) * 1.2, y: t.pos.y + 1 + rnd() * 2, z: t.pos.z + (rnd() - 0.5) * 1.2, vx: 0, vy: 0.8, vz: 0, age: 0, life: 0.8, color: new THREE.Color(BLESSINGS[b].color) });
      if ((b === "healing" || b === "total") && t.action && (t.action.kind === "slay" || t.action.kind === "command") && !(t.healAt > st.T)) {
        t.healAt = st.T + 2;
        for (const o of st.tickles) if (o !== t && o.hpMax > 0 && o.hp < o.hpMax && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 10) {
          o.hp = Math.min(o.hpMax, o.hp + 14);
          for (let k = 0; k < 6; k++) App.spawnParticle({ kind: "spark", x: o.pos.x, y: o.pos.y + 1.5, z: o.pos.z, vx: (rnd() - 0.5), vy: 2, vz: (rnd() - 0.5), age: -k * 0.02, life: 0.7, color: new THREE.Color("#7be08f") });
        }
      }
    }
  };

  // ---------- the clock ----------
  App.faithTick = () => {
    if (!ETH) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= 18 * 60 + 30 && st.prayDay !== day) { st.prayDay = day; answer(day); etherDay(day); }
  };

  // ---------- the panel ----------
  App.faithHTML = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const list = App.heroList().sort((a, b) => (b.kind === "total") - (a.kind === "total") || a.id - b.id);
    let h = '<div class="card"><h2>The Maker</h2><p class="note">The Tickles venerate the one who made them as the Maker. His name has been lost: only his initials, P.M., survive in the stories the Tickles tell. A giant golden statue of a Tickle raising its arms to the sky stands on the Maker&#39;s Isle in the middle of the great lake; the devout go there on pilgrimage on the launches that leave every dock, and the revival ritual is a prayer to the Maker. Prayers are answered in Ethernum, the crystals that power creature magic: a tamer with Ethernum can have its creature cast a spell (' + Object.values(SPELLS).join(", ") + ').</p>' +
      '<div class="kv"><span class="k">Pilgrimages</span><span>' + st.faithLog.prayers.toLocaleString() + '</span><span class="k">Spells cast</span><span>' + st.faithLog.spells.toLocaleString() + "</span></div></div>";
    h += '<div class="card"><h3>The blessed (' + list.length + ")</h3><p class=\"note\">The rarest Tickles of the collection: Matching Rank 8 carries the blessing of its colour, and the 1/1s (the only one of their colour at rank 8, and the only Tickle at rank 0) carry the total blessing.</p>";
    h += list.map((x) => { const B = BLESSINGS[x.kind]; return '<div class="row" style="justify-content:space-between"><span><span class="clandot" style="background:' + B.color + '"></span>' + esc(App.nameOf(x.id)) + (x.one ? " <b>1/1</b>" : "") + '</span><span class="note">' + esc(B.name) + " &middot; " + (x.rank === 8 ? "Matching 8, " + esc(x.theme) : "Matching 0") + "</span></div>"; }).join("") + "</div>";
    return h;
  };
})();
