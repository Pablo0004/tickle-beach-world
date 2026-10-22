/* Wealth shows. Shells buy things, and what a Tickle owns can be seen:
 *   a bigger house    the village builders rebuild its house as a two-storey townhouse, then a manor
 *   a boat            moored in the marina beside its dock: its own rowing boat, a sailing boat, a yacht;
 *                     some afternoons the owner takes it out on the lake
 *   a mount           a pony, a saddle horse, a white charger, or a riding griffin: on long trips the
 *                     owner rides at a trot (or flies, straight over everything), so it gets there sooner
 *   better arms       fine steel and masterwork weapons and steel shields from the Blacksmiths' Guild
 * Every region has a Blacksmiths' Guild near its Guild Quarter: a forge where two smiths hammer all day,
 * a paddock with horses for sale and a groom, and a roost with a griffin. A Tickle with shells to spare
 * goes there in its free time and buys what it wants most (fighters want arms first, travellers a mount,
 * those who live by a dock a boat, everyone a better house); a trade-in pays for half of what it had.
 * Some families were rich before the game began: their Tickles start out owning things.
 * Your own Tickles buy on their own too, except while you are in control; and you can buy for them
 * from their card. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440, S = App.S;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const camD = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z);

  // ---------- the catalogue ----------
  const CAT = (App.WEALTH = {
    house: [null, { name: "a townhouse", short: "Townhouse", kind: "townhouse", price: 160 }, { name: "a manor", short: "Manor", kind: "manor", price: 480 }],
    boat: [null, { name: "a rowing boat of its own", short: "Rowing boat", kind: "rowboat", price: 45 }, { name: "a sailing boat", short: "Sailing boat", kind: "sailboat", price: 150 }, { name: "a yacht", short: "Yacht", kind: "yacht", price: 420 }],
    mount: [null, { name: "a dun pony", short: "Pony", kind: "horse", price: 55, mul: 2.0, scale: 0.8 }, { name: "a saddle horse", short: "Saddle horse", kind: "horse", price: 120, mul: 2.5, scale: 0.95 },
      { name: "a white charger", short: "White charger", kind: "horse", price: 240, mul: 3.0, scale: 1.05 }, { name: "a riding griffin", short: "Riding griffin", kind: "griffin", price: 400, mul: 4.5, fly: true, scale: 1 }],
    weapon: [null, { name: "a fine steel weapon", short: "Fine steel", price: 60 }, { name: "a masterwork weapon", short: "Masterwork", price: 180 }],
    shield: [null, null, { name: "a steel shield", short: "Steel shield", price: 45 }],
  });
  // riding beasts: not every mount is a horse. Some Tickles ride the animal of their way of life (the rangers and the
  // climbing guides a stag, the duck keepers and the coconut farmers a ram, the treasure hunters a boar), and any
  // Tickle can buy one at the guild's paddock for less than a pony. Their size under the rider, the height of the back
  // (SDF units, before scaling) and how much faster than walking they go.
  const BEASTS = (CAT.beast = {
    sheep: { name: "a riding ram", short: "Riding ram", price: 18, mul: 1.6, s: 1.25, back: 297 },
    boar: { name: "a riding boar", short: "Riding boar", price: 30, mul: 1.9, s: 1.4, back: 250 },
    deer: { name: "a stag to ride", short: "Stag", price: 45, mul: 2.3, s: 1.1, back: 347 },
  });
  const WAY = { ranger: ["deer", 0.3], climber: ["deer", 0.3], keeper: ["sheep", 0.25], farmer: ["sheep", 0.25], hunter: ["boar", 0.35] };
  const beastOf = (id) => { const o = st.own && st.own[id]; if (o && o.rb) return o.rb; const w = WAY[App.jobOf(id)]; return w && hash2(id, 17, 663) < w[1] ? w[0] : null; };
  App.beastOf = beastOf; App.RIDE_BEASTS = BEASTS;
  const LABEL = { house: "House", boat: "Boat", mount: "Mount", weapon: "Weapon", shield: "Shield", beast: "Mount" };
  // what a purchase is called (the catalogue has tiers; a repair or a replacement weapon does not)
  const lostWeapon = (id) => (((st.gear && st.gear[id]) || {}).was) || "weapon";
  const nameOfBuy = (w, id) => (w.cat === "repair" ? "a repair of its arms" : w.cat === "rearm" ? (w.price === 14 ? "a second-hand " : "a new ") + lostWeapon(id) : CAT[w.cat][w.to].name);
  const shortOfBuy = (w, id) => (w.cat === "repair" ? "Repair arms" : w.cat === "rearm" ? (w.price === 14 ? "Second-hand " : "New ") + lostWeapon(id) : CAT[w.cat][w.to].short + (w.cat === "weapon" ? " " + (((App.gearOf(id) || {}).weapon) || lostWeapon(id)) : ""));
  const RESERVE = 20; // what a Tickle keeps back for daily life
  // (the Fair Market Act, when the Parliament has passed it, takes a fifth off mounts, riding beasts and boats)
  const costOf = (cat, from, to) => Math.round((CAT[cat][to].price - (from && CAT[cat][from] ? Math.round(CAT[cat][from].price * 0.5) : 0)) * (cat === "mount" || cat === "beast" || cat === "boat" ? (App.lawMul ? App.lawMul("market") : 1) : 1));
  const today = () => Math.floor(st.T / DAY);

  // ---------- what each Tickle owns ----------
  App.assetsOf = (id) => (st.own && st.own[id]) || null;
  // what it rides on long trips: a horse or a griffin it bought comes first, then the tamed monster it has at heel if
  // that one is big enough to carry it, then a riding beast (seat: how high it sits, in blocks)
  App.mountOf = (id) => {
    if (App.isListed && App.isListed(id)) return null; // (nothing to ride in the prison: its mount waits at home)
    const o = st.own && st.own[id];
    if (o && o.m) {
      const M = CAT.mount[o.m];
      return { tier: o.m, kind: M.kind, mul: M.mul, fly: !!M.fly, scale: M.scale, coat: o.m === 1 ? 0 : o.m === 2 ? o.coat || 1 : 3, name: M.short, seat: M.fly ? 2.45 : 2.2 * M.scale };
    }
    const c = App.leadCreature && App.leadCreature(id), R = c && App.MOUNT_MONSTERS && App.MOUNT_MONSTERS[c.sp];
    if (R) return { tier: "c:" + c.sp, kind: "monster", sp: c.sp, mul: R.mul, fly: false, scale: R.s, coat: 0, dz: R.dz, biped: !!R.biped, seat: R.back * R.s * 0.85 * S, pet: true, nick: c.nick || App.CREATURES[c.sp].name, name: (c.nick ? c.nick + " the " : "its ") + App.CREATURES[c.sp].name };
    const b = beastOf(id);
    if (b) { const B = BEASTS[b]; return { tier: "b:" + b, kind: "beast", sp: b, mul: B.mul, fly: false, scale: B.s, coat: 0, dz: 0, seat: B.back * B.s * 0.85 * S, name: B.short }; }
    return null;
  };
  // what it is all worth: purse and belongings (for the richest list)
  const worthOf = (id) => {
    const o = (st.own && st.own[id]) || {}, g = st.gear && st.gear[id];
    return App.shellsOf(id) + (o.h ? CAT.house[o.h].price : 0) + (o.b ? CAT.boat[o.b].price : 0) + (o.m ? CAT.mount[o.m].price : 0) + (o.rb && BEASTS[o.rb] ? BEASTS[o.rb].price : 0) + (g && g.q ? CAT.weapon[g.q].price : 0);
  };
  App.worthOf = worthOf;
  App.wealthText = (id) => {
    const o = (st.own && st.own[id]) || {}, g = st.gear && st.gear[id], out = [];
    if (o.h) out.push(CAT.house[o.h].short + (App.homeRuined && App.homeRuined(id) && st.ruins && (() => { const s = homeSc(id); return s && st.ruins[s.idx] && st.ruins[s.idx].upgrade; })() ? " (being built)" : ""));
    if (o.b) out.push(CAT.boat[o.b].short + (o.dock != null && App.docks[o.dock] ? " at " + App.docks[o.dock].name : ""));
    if (o.m) out.push(App.mountOf(id).name);
    else if (o.rb && BEASTS[o.rb]) out.push(BEASTS[o.rb].short);
    if (g && g.q) out.push(CAT.weapon[g.q].short + " " + g.weapon);
    return out.join(" \u00b7 ");
  };

  // ---------- where things are bought ----------
  App.smithyOf = (id) => {
    const v = App.villageOfToken(id);
    let best = null, bd = 420;
    for (const S0 of App.smithies || []) { const d = Math.hypot(S0.x - v.x, S0.z - v.z) + (S0.region === v.region ? 0 : 120); if (d < bd) { bd = d; best = S0; } }
    return best;
  };
  const dockCache = new Map();
  function dockOf(id) {
    if (dockCache.has(id)) return dockCache.get(id);
    const v = App.villageOfToken(id);
    let best = null, bd = 340;
    for (const D of App.docks || []) { const d = Math.hypot(D.x - v.x, D.z - v.z); if (d < bd) { bd = d; best = D; } }
    dockCache.set(id, best);
    return best;
  }
  // the marina: moorings on both sides of the jetty, beyond the rowing boats, bows pointing out
  const marinas = new Map();
  function marinaOf(D) {
    let M = marinas.get(D.i);
    if (M) return M;
    const ux = D.ux, uz = D.uz, px = uz, pz = -ux, slots = [];
    for (let row = 0; row < 8 && slots.length < 12; row++) for (const sd of [1, -1]) {
      const along = 6.5 + row * 3.6, x = D.x + ux * along + px * sd * 9.5, z = D.z + uz * along + pz * sd * 9.5;
      // room for a yacht: the whole hull over open water
      const ok = [-4.6, -2.3, 0, 2.3, 4.6].every((o) => { const qx = x + px * sd * o, qz = z + pz * sd * o; return !App.isLand(qx, qz) && App.lakeSd(qx, qz) < -1; }) &&
        [-1.4, 1.4].every((o) => !App.isLand(x + ux * o, z + uz * o));
      if (ok && slots.length < 12) slots.push({ k: slots.length, x, z, h: Math.atan2(px * sd, pz * sd), sd, along });
    }
    M = { D, slots };
    marinas.set(D.i, M);
    return M;
  }
  function freeMooring(D) {
    const M = marinaOf(D), used = new Set();
    for (const id in st.own) { const o = st.own[id]; if (o.b && o.dock === D.i) used.add(o.moor); }
    const s = M.slots.find((x) => !used.has(x.k));
    return s ? s.k : -1;
  }
  // a house and the room round it (a manor needs more than a townhouse)
  function homeSc(id) { const v = App.villageOfToken(id), k = v.residents.indexOf(id), h = v.homes[k]; return h && h.sc; }
  // only a house of its own can be rebuilt bigger (a household's shared house or a mansion cannot)
  const ownHouse = (s) => !!(s && s.house && !s.ruined && App.residentsOf(s).length === 1);
  const roomCache = new Map();
  function roomAt(id) {
    if (roomCache.has(id)) return roomCache.get(id);
    const v = App.villageOfToken(id), s = homeSc(id);
    if (!s) return 0;
    let r = 99;
    const by = (x, z) => { const d = Math.hypot(x - s.x, z - s.z); if (d < r) r = d; };
    for (const h of v.homes) if (h.sc && h.sc !== s) by(h.sc.x, h.sc.z);
    by(v.hall.x, v.hall.z); by(v.granary.x, v.granary.z); if (v.altar) by(v.altar.x, v.altar.z);
    for (const p of [v.pen, v.fold, v.yard]) if (p) by(p.x, p.z);
    roomCache.set(id, r);
    return r;
  }
  const ROOM = [0, 6.4, 8.6];

  // ---------- arms wear out ----------
  // every weapon and shield has a condition (100 new, 0 broken). Each blow struck wears the weapon a little and
  // each blow taken wears the shield; a party's day below, a dragon hunt or a sea beast wears them more. A worn
  // weapon hits softer and a worn shield stops less; one that is very worn can break, and then it is gone.
  // Old and handed-down arms (much of the village militia's) start worn; fine steel wears slower, masterwork
  // slower still, and the Maker's blade and the Orichalcum Blade never do. The Blacksmiths' Guild repairs them,
  // and sells plain weapons new or second-hand (cheaper, but already worn).
  const COND_WORDS = [[90, "new"], [65, "good"], [40, "worn"], [15, "very worn"], [-1, "about to break"]];
  App.condWord = (c) => COND_WORDS.find((x) => c >= x[0])[1];
  const condMul = (c) => (c >= 75 ? 1 : c >= 50 ? 0.92 : c >= 25 ? 0.8 : 0.65);
  const unwearing = (g) => !g || g.blessed || g.legendary || g.mage || g.weapon === "staff";
  // the condition of a Tickle's arms: { w, s } (s null without a shield), or null when it has nothing that wears
  App.armsCond = (id) => {
    const g = App.gearOf(id);
    if (!g || unwearing(g)) return null;
    const stored = !!(st.gear && st.gear[id]), f = App.factionOf ? App.factionOf(id) : null;
    // what it was handed: the guild's and the watch's arms have seen use, the militia's are often old
    const base = f === "guild" ? 55 : f === "watch" ? 45 : 25, span = f === "guild" ? 45 : f === "watch" ? 50 : 65;
    const w = g.cw != null ? g.cw : stored ? 100 : Math.round(base + hash2(id, 721, 3) * span);
    const sh = !g.armor ? null : g.cs != null ? g.cs : stored ? 100 : Math.round(base + hash2(id, 723, 3) * span);
    return { w, s: sh };
  };
  App.armsMul = (id) => { const c = App.armsCond(id); return c ? { w: condMul(c.w), s: c.s == null ? 1 : condMul(c.s) } : { w: 1, s: 1 }; };
  // wear: w on the weapon, s on the shield; returns what broke ("weapon", "shield" or null)
  App.armsWear = (id, w, s) => {
    const g = App.gearOf(id), c = App.armsCond(id);
    if (!c) return null;
    const rate = g.q === 2 ? 0.35 : g.q === 1 ? 0.6 : 1;
    const nw = c.w - (w || 0) * rate, ns = c.s == null ? null : c.s - (s || 0);
    const breaks = (after, amount) => after <= 0 || (after < 30 && amount > 0 && rnd() < 1 - Math.pow(1 - (0.02 * (30 - after)) / 30, amount * 3));
    let broke = null;
    if (w && breaks(nw, w * rate)) {
      st.gear[id] = { none: true, was: g.weapon, armor: g.armor || 0, wasQ: g.q || 0 };
      if (ns != null) st.gear[id].cs = Math.max(1, ns);
      broke = "weapon";
    } else if (ns != null && s && breaks(ns, s)) {
      st.gear[id] = Object.assign({}, g, { cw: Math.max(1, nw), armor: 0 });
      delete st.gear[id].cs;
      broke = "shield";
    } else {
      st.gear[id] = Object.assign({}, g, { cw: Math.max(1, Math.round(nw * 10) / 10) });
      if (ns != null) st.gear[id].cs = Math.max(1, Math.round(ns * 10) / 10);
    }
    if (broke) {
      st.wealthLog.broken = (st.wealthLog.broken || 0) + 1;
      const t = App.pop.agent[id];
      if (t) {
        App.say(t, broke === "weapon" ? pick(["My " + g.weapon + "! It snapped!", "Oh no, my " + g.weapon + "...", "It broke!"]) : pick(["My shield split!", "There goes my shield..."]), 4);
        if (App.weaponShow && (t.weaponObj || t.shieldObj)) App.weaponShow(t, null);
        for (let k = 0; k < 14; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: t.pos.x, y: t.pos.y + 1.6, z: t.pos.z, vx: (rnd() - 0.5) * 4, vy: 1 + rnd() * 2, vz: (rnd() - 0.5) * 4, age: 0, life: 0.5, color: new THREE.Color("#c8d0d8") });
        if (broke === "weapon" && t.action && t.action.kind === "slay") t.action = null; // nothing left to fight with
      }
      if ((t && camD(t.pos.x, t.pos.z) < 300) || (App.isMine && App.isMine(id))) App.log("arms", App.nameOf(id) + "'s " + (broke === "weapon" ? g.weapon : "shield") + " broke.", broke === "weapon" ? "Worn out with use. Without arms it hides from dragons until it buys a new one or its village smith forges one." : "Worn out with use; it fights on without one.", { who: [id] });
    }
    return broke;
  };
  // the smiths' price to put its arms right again
  const repairCost = (id) => { const g = App.gearOf(id), c = App.armsCond(id); if (!c) return 0; return Math.max(5, Math.ceil((100 - c.w) * (g.q === 2 ? 0.6 : g.q === 1 ? 0.4 : 0.25) + (c.s == null ? 0 : (100 - c.s) * 0.2))); };
  const PLAIN = { price: 30 }, USED = { price: 14 };

  // ---------- wishes: what each Tickle would buy next, most wanted first ----------
  const WATER_JOBS = new Set(["fisher"]);
  function wishes(id) {
    const o = (st.own && st.own[id]) || {}, g = App.gearOf(id), out = [], taste = (k) => hash2(id, k, 631);
    const fighter = g && !g.mage && !g.blessed && !g.legendary && g.weapon !== "staff";
    // first things first: a broken weapon replaced, worn arms put right
    const lost = st.gear && st.gear[id] && st.gear[id].none;
    if (lost) out.push({ cat: "rearm", from: 0, to: 0, pref: 3.5, price: App.shellsOf(id) >= PLAIN.price + RESERVE ? PLAIN.price : USED.price });
    const c = fighter ? App.armsCond(id) : null;
    if (c && (c.w < 45 || (c.s != null && c.s < 45))) out.push({ cat: "repair", from: 0, to: 0, pref: 3.0, price: repairCost(id) });
    if (fighter && (g.q || 0) < 2) out.push({ cat: "weapon", from: g.q || 0, to: (g.q || 0) + 1, pref: 1.5 + taste(1) });
    if (fighter && (g.armor || 0) < 2 && (g.q || 0) >= 1) out.push({ cat: "shield", from: g.armor || 0, to: 2, pref: 1.2 + taste(2) });
    const f = App.factionOf ? App.factionOf(id) : null;
    if ((o.m || 0) < 4) out.push({ cat: "mount", from: o.m || 0, to: (o.m || 0) + 1, pref: 1.1 + taste(3) + (f === "merchants" || App.isAdventurer(id) ? 0.6 : 0) });
    const D = dockOf(id);
    if (D && (o.b || 0) < 3 && (o.b || freeMooring(D) >= 0)) out.push({ cat: "boat", from: o.b || 0, to: (o.b || 0) + 1, pref: 0.8 + taste(4) + (WATER_JOBS.has(App.jobOf(id)) ? 0.7 : 0) });
    const s = homeSc(id);
    if (ownHouse(s) && (o.h || 0) < 2 && roomAt(id) >= ROOM[(o.h || 0) + 1]) out.push({ cat: "house", from: o.h || 0, to: (o.h || 0) + 1, pref: 1.0 + taste(5) });
    for (const w of out) if (w.price == null) w.price = costOf(w.cat, w.from, w.to);
    return out.sort((a, b) => b.pref - a.pref);
  }
  App.wishesOf = wishes;

  // ---------- buying ----------
  function purchase(id, w) {
    const o = st.own[id] || (st.own[id] = {});
    if (w.cat === "house") { if (!startBuild(id, w.to)) return false; o.h = w.to; }
    else if (w.cat === "boat") {
      const D = dockOf(id);
      if (!D) return false;
      if (!o.b) { const k = freeMooring(D); if (k < 0) return false; o.dock = D.i; o.moor = k; }
      o.b = w.to; boatsDirty = true;
    } else if (w.cat === "mount") { o.m = w.to; if (w.to === 2) o.coat = hash2(id, 3, 661) < 0.5 ? 1 : 2; }
    else if (w.cat === "beast") o.rb = w.to;
    else if (w.cat === "weapon") {
      const old = (st.gear && st.gear[id]) || {}, g = App.gearOf(id) || { weapon: old.was || ["sword", "axe", "spear"][Math.floor(hash2(id, 5, 661) * 3)], armor: old.armor || 0 };
      const c = App.armsCond(id), cs = g.armor ? (c && c.s != null ? c.s : old.cs) : null;
      st.gear[id] = Object.assign({}, g, { q: w.to, cw: 100 });
      delete st.gear[id].none; delete st.gear[id].was; delete st.gear[id].wasQ;
      if (cs != null) st.gear[id].cs = cs;
    } else if (w.cat === "shield") st.gear[id] = Object.assign({}, App.gearOf(id), { armor: 2, cs: 100 });
    else if (w.cat === "repair") { const g = App.gearOf(id); if (!g) return false; st.gear[id] = Object.assign({}, g, { cw: 100 }); if (g.armor) st.gear[id].cs = 100; }
    else if (w.cat === "rearm") {
      // a plain weapon of the same kind as the one that broke: new, or second-hand and already worn
      const old = (st.gear && st.gear[id]) || {}, used = w.price === USED.price;
      st.gear[id] = { weapon: old.was || ["sword", "axe", "spear"][Math.floor(hash2(id, 5, 661) * 3)], armor: old.armor || 0, cw: used ? 40 + Math.round(rnd() * 30) : 100 };
      if (old.armor && old.cs != null) st.gear[id].cs = old.cs;
    }
    if (!Object.keys(o).length) delete st.own[id];
    App.pay(id, -w.price);
    const lk = w.cat === "beast" ? "mount" : w.cat;
    st.wealthLog[lk] = (st.wealthLog[lk] || 0) + 1; st.wealthLog.spent += w.price;
    return true;
  }
  App.homeUpgrading = (id) => { const s = homeSc(id); return !!(s && s.ruined && st.ruins && st.ruins[s.idx] && st.ruins[s.idx].upgrade); };
  // the builders rebuild the house bigger: scaffolding (the owner sleeps in the town hall meanwhile), then the new house
  function startBuild(id, tier) {
    const v = App.villageOfToken(id), s = homeSc(id);
    if (!s || s.ruined || !st.ruins) return false;
    const type = CAT.house[tier].kind + "_" + v.style;
    s.orig = type; s.ruined = true; s.type = "scaffold_0";
    st.ruins[s.idx] = { orig: type, progress: 0.5, since: st.T, village: v.i, cause: "to build it bigger", upgrade: tier };
    App.sceneryDirty = true;
    App.invalidatePlan(id);
    ensureFrag(type);
    return true;
  }
  // the player buys for one of its own Tickles from its card: no reserve, done at once
  App.buyFor = (id, cat, price) => {
    const w = allNext(id).find((x) => x.cat === cat && (price == null || x.price === price)) || wishes(id).find((x) => x.cat === cat);
    if (!w) { App.toast("Nothing more of that kind to buy."); return; }
    if (App.shellsOf(id) < w.price) { App.toast(App.nameOf(id) + " needs " + w.price + " shells for that (it has " + Math.floor(App.shellsOf(id)) + ")."); return; }
    if (!purchase(id, w)) { App.toast(w.cat === "boat" ? "The marina is full." : w.cat === "house" ? "The builders cannot start just now." : "Could not buy that."); return; }
    const t = App.pop.agent[id];
    if (t) { App.say(t, line(w), 4); App.invalidatePlan(id); }
    App.log("wealth", App.nameOf(id) + " bought " + nameOfBuy(w, id) + " for " + w.price + " shells.", w.cat === "house" ? "The builders of " + App.villageOfToken(id).name + " start on it this afternoon." : "Paid out of its own purse.", { who: [id] });
    if (App.refresh) App.refresh(true);
  };
  // every next thing it could buy (the card shows them all, not only what it wants)
  function allNext(id) {
    const o = (st.own && st.own[id]) || {}, g = App.gearOf(id), out = [];
    if ((o.h || 0) < 2 && ownHouse(homeSc(id)) && roomAt(id) >= ROOM[(o.h || 0) + 1]) out.push({ cat: "house", from: o.h || 0, to: (o.h || 0) + 1 });
    if ((o.m || 0) < 4) out.push({ cat: "mount", from: o.m || 0, to: (o.m || 0) + 1 });
    // a riding beast, for whoever has no horse yet (a new one replaces the one it had)
    if (!o.m) for (const b in BEASTS) if (o.rb !== b) out.push({ cat: "beast", from: 0, to: b, price: costOf("beast", 0, b) });
    const D = dockOf(id);
    if (D && (o.b || 0) < 3 && (o.b || freeMooring(D) >= 0)) out.push({ cat: "boat", from: o.b || 0, to: (o.b || 0) + 1 });
    const mageOrBlessed = g && (g.mage || g.blessed || g.legendary || g.weapon === "staff");
    // arms to put right, or a weapon to replace (new, or second-hand and cheaper)
    const c = App.armsCond(id);
    if (c && (c.w < 100 || (c.s != null && c.s < 100))) out.push({ cat: "repair", from: 0, to: 0, price: repairCost(id) });
    if (st.gear && st.gear[id] && st.gear[id].none) out.push({ cat: "rearm", from: 0, to: 0, price: PLAIN.price }, { cat: "rearm", from: 0, to: 0, price: USED.price });
    if (!mageOrBlessed && (!g || (g.q || 0) < 2)) out.push({ cat: "weapon", from: (g && g.q) || 0, to: ((g && g.q) || 0) + 1 });
    if (g && !mageOrBlessed && (g.armor || 0) < 2) out.push({ cat: "shield", from: g.armor || 0, to: 2 });
    for (const w of out) if (w.price == null) w.price = costOf(w.cat, w.from, w.to);
    return out;
  }
  const line = (w) => w.cat === "repair" ? pick(["Good as new!", "Sharp again.", "Not a scratch on it now."]) : w.cat === "rearm" ? pick(["Armed again!", "A blade of my own again.", "Let them come now."]) : w.cat === "mount" ? (w.to === 4 ? "My own griffin! To the skies!" : pick(["My own horse!", "Giddy up!", "Isn't it beautiful?"])) : w.cat === "beast" ? (w.to === "deer" ? "What antlers! Let's go." : w.to === "boar" ? "Steady, piggy... steady!" : "Baa-rilliant! My own ram!") : w.cat === "boat" ? pick(["She's all mine!", "Fair winds!", "Wait till you see her sail."])
    : w.cat === "house" ? pick(["A bigger house!", "The builders start today.", "Room for everything at last."]) : pick(["Look at this blade!", "Finest work in the land.", "Now let a dragon come."]);

  // ---------- the families that were rich before the game began ----------
  function oldMoney() {
    for (let id = 0; id < TB.SUPPLY; id++) {
      const u = hash2(id, 611, 3);
      if (u >= 0.12 || App.isDead(id)) continue;
      let fortune = Math.min(2400, Math.round(70 * Math.pow(0.12 / Math.max(u, 0.0004), 0.75)));
      for (let k = 0; k < 12; k++) {
        const w = wishes(id).find((x) => x.price <= fortune);
        if (!w) break;
        const o = st.own[id] || (st.own[id] = {});
        // already built and moored: no scaffolding for an old family's house
        if (w.cat === "house") { o.h = w.to; }
        else if (w.cat === "boat") { const D = dockOf(id); if (!o.b) { const m = freeMooring(D); if (m < 0) { if (!Object.keys(o).length) delete st.own[id]; break; } o.dock = D.i; o.moor = m; } o.b = w.to; }
        else if (w.cat === "mount") { o.m = w.to; if (w.to === 2) o.coat = hash2(id, 3, 661) < 0.5 ? 1 : 2; }
        else if (w.cat === "weapon") st.gear[id] = Object.assign({}, App.gearOf(id), { q: w.to });
        else if (w.cat === "shield") st.gear[id] = Object.assign({}, App.gearOf(id), { armor: 2 });
        if (!Object.keys(o).length) delete st.own[id];
        fortune -= w.price;
      }
      App.pay(id, fortune);
      st.wealthLog.old++;
    }
  }
  // the houses as they were saved: townhouses and manors (and the ones still being built)
  function applyHouses() {
    for (const id in st.own) {
      const o = st.own[id];
      if (!o.h) continue;
      const v = App.villageOfToken(+id), s = homeSc(+id);
      if (!s) continue;
      const type = CAT.house[o.h].kind + "_" + v.style, R = st.ruins && st.ruins[s.idx];
      if (!s.ruined) s.type = type;
      else if (R && !R.upgrade) { s.orig = type; R.orig = type; }
    }
    App.sceneryDirty = true;
  }

  // ---------- the models, made the first time they are needed ----------
  const fragLoading = new Set();
  function ensureFrag(type) {
    if (App.frag[type] || fragLoading.has(type) || !App.fragEntry) return;
    const kind = App.kindOf(type), v = +type.slice(kind.length + 1) || 0, K = TB.KIT[kind];
    if (!K) return;
    fragLoading.add(type);
    const strokes = K.build(v);
    Promise.all([App.job("compact", { strokes, voxel: K.voxel[0], lip: 1.5 }), App.job("compact", { strokes, voxel: K.voxel[1], lip: 1.5 })]).then(([hi, lo]) => {
      App.frag[type] = App.fragEntry(hi.mesh);
      App.fragLo[type] = App.fragEntry(lo.mesh, App.frag[type].box);
      App.sceneryDirty = true;
    }).catch(() => fragLoading.delete(type));
  }
  App.prepareWealth = () => {
    for (const k of ["smithy_0", "paddock_0", "roost_0"]) ensureFrag(k);
    const want = new Set();
    // the manors and the townhouses the map is built with (estates, mansions, the bigger households)
    for (const s of App.sceneryAll || []) if (!App.frag[s.type]) { const K = TB.KIT[App.kindOf(s.type)]; if (K && K.lazy) want.add(s.type); }
    for (const id in st.own) { const o = st.own[id]; if (o.h) want.add(CAT.house[o.h].kind + "_" + App.villageOfToken(+id).style); }
    for (const k in st.ruins || {}) if (st.ruins[k].upgrade) want.add(st.ruins[k].orig);
    for (const k of want) ensureFrag(k);
  };

  // ---------- the Blacksmiths' Guild's people: two smiths at the anvils and a groom, every day ----------
  const ANVILS = [[40, 210], [270, 190]];
  const local = (S0, lx, ly) => { const k = S * (S0.scale || 1); return { x: S0.x + S0.rx * lx * k + S0.fx * ly * k, z: S0.z + S0.rz * lx * k + S0.fz * ly * k }; };
  let staffKey = null, staffMap = new Map();
  function staffFor(day) {
    const key = day + ":" + (st.wallet || "");
    if (key === staffKey) return staffMap;
    staffKey = key; staffMap = new Map();
    for (const S0 of App.smithies || []) {
      const vs = App.villages.filter((v) => v.region === S0.region).sort((a, b) => Math.hypot(a.x - S0.x, a.z - S0.z) - Math.hypot(b.x - S0.x, b.z - S0.z)).slice(0, 4), pool = [];
      for (const v of vs) for (const id of v.residents) if (!(App.heroOf && App.heroOf(id)) && !App.isAdventurer(id) && !(App.isMine && App.isMine(id)) && !(App.boatmanLine && App.boatmanLine(id)) && !App.isDead(id)) pool.push(id);
      pool.sort((a, b) => hash2(a, S0.i, 681) - hash2(b, S0.i, 681));
      pool.slice(0, 3).forEach((id, k) => {
        const p = k < 2 ? (() => { const a = local(S0, ANVILS[k][0] - 95, ANVILS[k][1] + 40), c = local(S0, ANVILS[k][0], ANVILS[k][1]); return { x: a.x, z: a.z, cx: c.x, cz: c.z, label: S0.name + " (at the anvil)" }; })()
          : { x: S0.paddock.x + S0.fx * 3, z: S0.paddock.z + S0.fz * 3, cx: S0.paddock.x, cz: S0.paddock.z, label: S0.name + " (tending the horses)" };
        staffMap.set(id, { S: S0, k: k < 2 ? "smith" : "groom", slot: k, p });
      });
    }
    return staffMap;
  }
  App.smithStaff = (id) => (App.smithies && App.smithies.length ? staffFor(today()).get(id) || null : null);

  // ---------- the day's shopping ----------
  let orderIdx = new Map();
  function planOrders(day) {
    const list = [], manual = st.mode === "manual", staff = staffFor(day);
    for (let id = 0; id < TB.SUPPLY; id++) {
      if (hash2(id, day, 641) > 0.3) continue; // a shopping day now and then
      const purse = App.shellsOf(id);
      if (purse < 45 + RESERVE || App.isDead(id) || App.isKO(id) || (manual && App.isMine && App.isMine(id)) || staff.has(id)) continue;
      // what it wants most, if it can afford it; otherwise it saves up for it
      const w = wishes(id).slice(0, 2).find((x) => purse >= x.price + RESERVE);
      if (w) list.push({ id, cat: w.cat, from: w.from, to: w.to, price: w.price, done: false });
    }
    st.orders = { day, list };
    indexOrders();
  }
  function indexOrders() { orderIdx = new Map(); if (st.orders) for (const o of st.orders.list) orderIdx.set(o.id, o); }
  function ensureOrders(day) { if (!st.orders || st.orders.day !== day) planOrders(day); else if (orderIdx.size !== st.orders.list.length) indexOrders(); }
  App.orderOf = (id) => { const d = today(); if (!st.orders || st.orders.day !== d) return null; if (orderIdx.size !== st.orders.list.length) indexOrders(); return orderIdx.get(id) || null; };
  // where each order is bought
  function venueOf(o) {
    const id = o.id;
    if (o.cat === "boat") { const D = dockOf(id); return D ? { x: D.land.x + (hash2(id, 1, 691) - 0.5) * 4, z: D.land.z + (hash2(id, 2, 691) - 0.5) * 4, cx: D.berth.x, cz: D.berth.z, label: D.name + " (buying a boat)" } : null; }
    if (o.cat === "house") return null; // the builders come to the house
    const S0 = App.smithyOf(id);
    if (!S0) return null;
    if (o.cat === "mount") { const P = S0.paddock, a = (hash2(id, 3, 691) - 0.5) * 1.6; return { x: P.x + Math.sin(S0.rot + a) * 7.4, z: P.z + Math.cos(S0.rot + a) * 7.4, cx: P.x, cz: P.z, label: S0.name + " (choosing a mount)" }; }
    const c = local(S0, -200 + hash2(id, 4, 691) * 480, 420 + hash2(id, 5, 691) * 160), f = local(S0, 0, 120);
    return { x: c.x, z: c.z, cx: f.x, cz: f.z, label: S0.name + " (buying arms)" };
  }

  // ---------- the plan hook (population.js): the smiths' day, a shopping trip, an afternoon's sailing ----------
  App.wealthStep = (id, day, steps) => {
    if (!App.smithies) return null;
    const job = staffFor(day).get(id);
    if (job) return [{ k: job.k, s: 470, e: 1110, p: job.p, smithy: job.S.i }];
    if (day !== today()) return null;
    const L = steps.find((s) => s.k === "leisure" && !s.taming);
    if (!L) return null;
    ensureOrders(day);
    const o = orderIdx.get(id);
    if (o && !o.done) { const p = venueOf(o); return p ? [{ k: "shop", s: L.s, e: L.e, p, cat: o.cat }] : null; }
    const own = st.own && st.own[id];
    if (own && own.b && hash2(id, day, 651) < 0.35 && L.e - L.s >= 50 && App.docks[own.dock]) {
      const D = App.docks[own.dock];
      return [{ k: "sail", s: L.s, e: L.e, p: { x: D.land.x, z: D.land.z, label: D.name + " (out sailing)" }, dock: D.i }];
    }
    return null;
  };

  // ---------- the clock ----------
  App.wealthTick = () => {
    if (!st.own) return;
    const day = today(), m = st.T - day * DAY;
    ensureOrders(day);
    // each order is paid for when its shopping trip is over (or at seven in the evening if there was none)
    let planned = 0;
    for (const o of st.orders.list) {
      if (o.done) continue;
      if (o.due == null) { if (++planned > 40) continue; const s = App.planOf(o.id, day).steps.find((x) => x.k === "shop"); o.due = s ? s.e : 19 * 60; }
      if (m < o.due) continue;
      o.done = true;
      if (App.isDead(o.id) || App.shellsOf(o.id) < o.price) continue; // spent it all at the casino first
      const w = wishes(o.id).find((x) => x.cat === o.cat && x.to === o.to);
      if (!w || !purchase(o.id, w)) continue;
      const t = App.pop.agent[o.id], v = App.villageOfToken(o.id);
      if (t) App.say(t, line(w), 4);
      if ((t && camD(t.pos.x, t.pos.z) < 300) || (App.isMine && App.isMine(o.id)) || w.price >= 300)
        App.log("wealth", App.nameOf(o.id) + " of " + v.name + " bought " + nameOfBuy(w, o.id) + " for " + w.price + " shells.", w.cat === "house" ? "The village builders start on it in the afternoons; it sleeps in the town hall until it is done." : w.cat === "boat" ? "Moored at " + App.docks[st.own[o.id].dock].name + "." : "From the Blacksmiths' Guild.", { who: [o.id] });
    }
  };

  // ---------- init and save ----------
  App.initWealth = (saved) => {
    st.own = (saved && saved.own) || {};
    st.wealthLog = Object.assign({ house: 0, boat: 0, mount: 0, weapon: 0, shield: 0, spent: 0, old: 0 }, (saved && saved.log) || {});
    st.orders = (saved && saved.orders) || null;
    indexOrders();
    if (!(saved && saved.init)) oldMoney();
    applyHouses();
    boatsDirty = true;
  };
  // a bigger house belongs to the house: the save notes which one (its key), so it stays with it when ownership changes
  App.saveWealth = () => {
    for (const id in st.own) { const o = st.own[id]; if (o.h) o.hk = App.homeKeyOf ? App.homeKeyOf(+id) : null; else delete o.hk; }
    return { own: st.own, log: st.wealthLog, orders: st.orders, init: true };
  };

  // ---------- the brain (sim.js): at the anvil, with the horses, shopping, out sailing ----------
  const SHOP_ACT = { id: "shop", name: "Shopping", verb: "is looking over the wares", needs: { fun: 6 }, capacity: 30, minutes: 10, where: "self", source: "core", status: "core" };
  const GROOM_ACT = { id: "groom", name: "Tending the horses", verb: "is grooming a horse", needs: { social: 2 }, capacity: 9, minutes: 8, where: "self", anim: "reach", source: "core", status: "core" };
  App.wealthBrain = (t, step) => {
    const k = step.k;
    if (k !== "smith" && k !== "groom" && k !== "shop" && k !== "sail") return false;
    const ds = today() * DAY, until = ds + step.e, p = step.p;
    if (k === "sail") {
      const pose = boatPose(t.id);
      if (pose && pose.out) { t.action = { kind: "sail", until, started: st.T }; return true; }
      if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 2.5) { App.startTravel(t, p, "to its boat"); return true; }
      t.action = { kind: "idle", until: st.T + 2 }; // waiting on the jetty for the boat to sail
      return true;
    }
    if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 1.2) { App.startTravel(t, p, k === "shop" ? "shopping" : "to the Blacksmiths' Guild"); return true; }
    if (k === "smith") { t.action = { kind: "forge", anvil: { x: p.cx, z: p.cz }, until, started: st.T, slot: step.smithy }; return true; }
    if (k === "groom") {
      const S0 = App.smithies[step.smithy], a = rnd() * 6.28, r = 1 + rnd() * 3.6, spot = { x: S0.paddock.x + Math.cos(a) * r, z: S0.paddock.z + Math.sin(a) * r };
      App.startDo(t, { act: GROOM_ACT, ref: "groom" + t.id, spot, exact: true, face: { x: S0.paddock.x, z: S0.paddock.z } }, false, Math.min(until, st.T + 8));
      return true;
    }
    if (rnd() < 0.05) App.say(t, step.cat === "mount" ? pick(["That one, with the white socks.", "How fast does it trot?", "Can I ride it first?"]) : step.cat === "boat" ? pick(["How much for the blue one?", "Does she sail well?"]) : pick(["How much for that sword?", "Let me feel the balance.", "Steel from our own mines?"]), 3);
    App.startDo(t, { act: SHOP_ACT, ref: "shop" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: p.cx, z: p.cz } }, false, Math.min(until, st.T + 10));
    return true;
  };
  // a smith at its anvil: the hammer comes down every second or so, sparks fly and the anvil rings
  App.stepForge = (t, a, dm, dtReal) => {
    if (st.T >= a.until || App.isKO(t.id)) { App.weaponShow(t, null); t.action = null; App.animateTickle(t, false, dtReal); return; }
    App.faceTo(t, a.anvil, dtReal);
    if (!t.weaponObj) App.weaponShow(t, "hammer");
    const now = performance.now();
    if (st.speed > 0 && now >= (a.nextAt || 0)) { a.nextAt = now + (750 + rnd() * 450) / Math.min(3, Math.max(0.6, st.speed)); t.swingAt = now; a.hitAt = now + 70; }
    if (a.hitAt && now >= a.hitAt) {
      a.hitAt = 0;
      const y = App.genHeight(a.anvil.x, a.anvil.z) + 1.3;
      for (let k = 0; k < 7; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: a.anvil.x, y, z: a.anvil.z, vx: (rnd() - 0.5) * 3, vy: 0.5 + rnd() * 1.8, vz: (rnd() - 0.5) * 3, age: 0, life: 0.25 + rnd() * 0.25, color: new THREE.Color(rnd() < 0.5 ? "#ffd23f" : "#ff7a2f") });
      const d = camD(a.anvil.x, a.anvil.z);
      if (d < 45 && App.sfx && App.sfx.animal && !App.inside) App.sfx.animal("anvil", Math.max(0.05, 0.5 * (1 - d / 45)), "amb");
    }
    App.animateTickle(t, false, dtReal);
  };

  // ---------- mounts: riding, flying, and waiting by their rider ----------
  App.mountRide = (t, a, remaining) => {
    const M = App.mountOf(t.id);
    if (!M || a.slow || App.isKO(t.id)) return null;
    if (!t.riding) {
      if (remaining < 30) return null;
      t.riding = { fly: M.fly, seat: M.seat, ph: 0, bob: 0, seen: frameNo, from: { x: t.pos.x, z: t.pos.z } };
      // a griffin goes straight there, over water, hills and houses
      if (M.fly && a.path && a.path.length) a.path = [a.path[a.path.length - 1]];
      if (rnd() < 0.5) App.say(t, M.fly ? pick(["Up we go!", "Hold on tight!", "To the skies!"]) : M.kind === "monster" ? pick(["Carry me, " + M.nick + "!", "Up on your back I go!", "Onward, my beast!"]) : M.kind === "beast" ? pick(["Hup, hup!", "Off we go!", "Don't throw me off!"]) : pick(["Giddy up!", "Off we trot!", "Easy, easy..."]), 2);
    }
    t.riding.seen = frameNo;
    return M;
  };
  // first person (firstperson.js): in the saddle while you ride it; null when it has no mount
  App.fpSaddle = (t, on) => {
    const M = App.mountOf(t.id);
    if (!M || !on) { if (t.riding) { t.riding.seen = -99; } return null; }
    if (!t.riding) t.riding = { fly: M.fly, seat: M.seat, ph: 0, bob: 0, seen: frameNo, from: { x: t.pos.x, z: t.pos.z }, fp: true };
    t.riding.seen = frameNo;
    return M;
  };
  App.flyStep = (t, a, wp, dm, dtReal, mul) => {
    const dx = wp.x - t.pos.x, dz = wp.z - t.pos.z, d = Math.hypot(dx, dz), step = Math.min(d, App.WALK_SPEED * dm * mul);
    if (d > 1e-6) { t.pos.x += (dx / d) * step; t.pos.z += (dz / d) * step; t.heading = App.boatTurn(t.heading, Math.atan2(dx, dz), dtReal * 5); }
    const R = t.riding, flown = Math.hypot(t.pos.x - R.from.x, t.pos.z - R.from.z), left = d - step;
    const alt = Math.max(0, Math.min(14, flown * 0.6, left * 0.6));
    R.alt = alt;
    t.flyY = Math.max(App.surfaceAt(t.pos.x, t.pos.z).y, App.WATER_Y) + alt;
    return left;
  };
  const mounts = new Map(); // id -> { tier, coat, obj, legs, wings, ph, park }
  const raw = (r) => { const m = new THREE.Mesh(r.geo, App.voxMaterial); m.scale.setScalar(r.md.voxel * S); m.position.set(r.md.origin[0] * S, r.md.origin[1] * S, r.md.origin[2] * S); return m; };
  const LEGS = [[55, 140], [-55, 140], [55, -140], [-55, -140]];
  // a horse (the body and four legs that swing at the hip) or a griffin (the body and two wings); a riding beast or a
  // tamed monster is one piece that bobs and sways as it goes, set so the rider sits where its seat is (M.dz)
  function buildMount(kind, coat, scale, M) {
    if (kind === "beast" || kind === "monster") return App.kitMesh(M.sp, 0).then((b) => {
      const g = new THREE.Group(), body = new THREE.Group();
      body.add(raw(b)); body.position.z = -(M.dz || 0) * S;
      g.add(body); g.scale.setScalar(scale || 1);
      return { obj: g, legs: [], wings: [], body, biped: !!M.biped };
    });
    if (kind === "griffin") return Promise.all([App.kitMesh("griffinmount", 0), App.kitMesh("griffinwing", 0), App.kitMesh("griffinwing", 1)]).then(([b, wr, wl]) => {
      const g = new THREE.Group(), wings = [];
      g.add(raw(b));
      for (const [r, sx] of [[wr, 1], [wl, -1]]) { const p = new THREE.Group(); p.position.set(sx * 95 * S, 420 * S, 40 * S); p.add(raw(r)); g.add(p); wings.push(p); }
      g.scale.setScalar(scale || 1);
      return { obj: g, legs: [], wings };
    });
    return Promise.all([App.kitMesh("horse", coat), App.kitMesh("horseleg", coat)]).then(([b, l]) => {
      const g = new THREE.Group(), legs = [];
      g.add(raw(b));
      for (const [x, y] of LEGS) { const p = new THREE.Group(); p.position.set(x * S, 200 * S, y * S); const m = raw(l); m.position.y -= 200 * S; p.add(m); g.add(p); legs.push(p); }
      g.scale.setScalar(scale || 1);
      return { obj: g, legs, wings: [] };
    });
  }
  App.buildMount = buildMount;
  // the legs at a trot (diagonal pairs together) or a walk; the wings beating or folded
  function poseMount(m, moving, flying, dt, gait) {
    if (moving) m.ph += dt * (gait || 11);
    const s = moving ? Math.sin(m.ph) : 0;
    if (m.legs.length) { const k = moving ? 0.55 : 0; m.legs[0].rotation.x = m.legs[3].rotation.x = s * k; m.legs[1].rotation.x = m.legs[2].rotation.x = -s * k; }
    if (m.wings.length) {
      const flap = flying ? 0.2 + Math.sin(m.ph * 0.55) * 0.8 : 0;
      m.wings[0].rotation.set(0, flying ? 0 : 1.4, flying ? flap : 0.1); m.wings[1].rotation.set(0, flying ? 0 : -1.4, flying ? -flap : -0.1);
    }
    // one piece: a beast rocks fore and aft as it lopes, a monster on two legs sways from foot to foot
    if (m.body) {
      if (m.biped) { m.body.rotation.set(0, 0, s * 0.07); m.body.position.y = Math.abs(s) * 0.05; }
      else { m.body.rotation.set(Math.cos(m.ph) * (moving ? 0.06 : 0), 0, 0); m.body.position.y = moving ? Math.abs(s) * 0.06 : 0; }
    }
  }
  function stableSpot(id) {
    const s = homeSc(id), t = App.pop.agent[id], hm = App.homeOf(id);
    if (!s) return { x: hm.x + 2, z: hm.z, h: 0 };
    const ux = hm.x - s.x, uz = hm.z - s.z, d = Math.hypot(ux, uz) || 1, px = uz / d, pz = -ux / d, side = hash2(id, 9, 701) < 0.5 ? 1 : -1, r = (App.assetsOf(id) || {}).h === 2 ? 5.6 : 4.2;
    const x = s.x + px * side * r + (ux / d) * 0.8, z = s.z + pz * side * r + (uz / d) * 0.8;
    return App.isLand(x, z) ? { x, z, h: Math.atan2(ux, uz) } : { x: hm.x + px * 2, z: hm.z + pz * 2, h: Math.atan2(ux, uz) };
  }
  function dropMount(id) { const m = mounts.get(id); if (m && m.obj && m.obj.parent) m.obj.parent.remove(m.obj); mounts.delete(id); const t = App.pop.agent[id]; if (t) { t.riding = null; t.flyY = null; } }
  let frameNo = 0;
  function updateMounts(dt) {
    frameNo++;
    for (const t of st.tickles) {
      const M = App.mountOf(t.id);
      let m = mounts.get(t.id);
      if (!M) { if (m) dropMount(t.id); if (t.riding) { t.riding = null; t.flyY = null; } continue; }
      if (m && (m.tier !== M.tier || m.coat !== M.coat)) { dropMount(t.id); m = null; }
      if (!m) {
        m = { tier: M.tier, coat: M.coat, fly: M.fly, obj: null, legs: [], wings: [], ph: 0, park: null };
        mounts.set(t.id, m);
        buildMount(M.kind, M.coat, M.scale, M).then((r) => { if (mounts.get(t.id) !== m) return; Object.assign(m, r); });
        continue;
      }
      if (!m.obj) continue;
      // the trip is over when nothing has asked for the mount for a few frames (the game running)
      if (t.riding && st.speed > 0 && frameNo - t.riding.seen > 3) {
        // off at the end of the trip: the mount waits beside its rider
        t.riding = null; t.flyY = null;
        const px = Math.cos(t.heading), pz = -Math.sin(t.heading), bx = -Math.sin(t.heading), bz = -Math.cos(t.heading);
        const spot = [[px * 2.4, pz * 2.4], [-px * 2.4, -pz * 2.4], [bx * 2.8, bz * 2.8], [px * 1.6 + bx * 1.6, pz * 1.6 + bz * 1.6]].map(([ox, oz]) => ({ x: t.pos.x + ox, z: t.pos.z + oz })).find((q) => App.isLand(q.x, q.z) && App.climbOK(t.pos.x, t.pos.z, q.x, q.z));
        m.park = spot ? { x: spot.x, z: spot.z, h: t.heading } : { x: t.pos.x + px * 2.4, z: t.pos.z + pz * 2.4, h: t.heading };
        m.goal = null;
      }
      if (t.riding) {
        if (m.obj.parent !== t.group) { t.group.add(m.obj); m.obj.position.set(0, 0, 0); m.obj.rotation.set(0, 0, 0); }
        const flying = m.fly && (t.riding.alt || 0) > 1.2, moving = st.speed > 0;
        const beat = Math.floor(m.ph / Math.PI);
        poseMount(m, moving && (!t.riding.fp || t.riding.moving), flying, dt * Math.min(3, Math.max(0.5, st.speed)), m.fly ? 9 : m.biped ? 7 : 11);
        // a tamed monster under its tamer is drawn here, not at heel (creatures.js), and is beside it again when it gets off
        if (M.pet) { const pb = App.petOf && App.petOf(t.id); if (pb) { pb.ridden = performance.now(); pb.x = t.pos.x; pb.z = t.pos.z; pb.h = t.heading; } }
        // hoofbeats near you
        if ((M.kind === "horse" || M.sp === "deer") && Math.floor(m.ph / Math.PI) !== beat && App.sfx && App.sfx.animal && !App.inside) { const d = camD(t.pos.x, t.pos.z); if (d < 26) App.sfx.animal("hoof", 0.35 * (1 - d / 26), "amb"); }
        t.riding.bob = m.fly ? (flying ? Math.sin(m.ph * 0.55) * 0.12 : 0) : Math.abs(Math.sin(m.ph)) * 0.14;
        m.obj.position.y = m.fly ? 0 : Math.abs(Math.sin(m.ph)) * 0.06;
        m.obj.rotation.x = flying ? 0.08 : 0;
        continue;
      }
      // waiting: at home by the house at night (or while its rider is indoors), otherwise near its rider
      if (M.pet) { if (m.obj.parent) m.obj.parent.remove(m.obj); continue; } // at heel, as a creature (creatures.js)
      if (m.obj.parent !== App.scene) App.scene.add(m.obj);
      if (m.held) continue; // in the hand (hand.js)
      m.obj.rotation.x = 0;
      const indoors = !t.group.visible || (t.step && (t.step.k === "sleep" || t.step.k === "morning") && Math.hypot(t.pos.x - t.home.x, t.pos.z - t.home.z) < 3);
      // where it is going: to the stable by the house, or up beside its rider when left too far behind
      if (indoors) { if (Math.hypot(t.pos.x - t.home.x, t.pos.z - t.home.z) < 6 && (!m.goal || !m.goal.stable)) m.goal = Object.assign(stableSpot(t.id), { stable: true }); }
      else if (m.park && (!m.goal || m.goal.stable) && Math.hypot(m.park.x - t.pos.x, m.park.z - t.pos.z) > 10 && !(App.ISLE && Math.hypot(t.pos.x - App.ISLE.x, t.pos.z - App.ISLE.z) < App.ISLE.r + 12)) { /* (no mount follows its rider over the lake to the Maker's Isle) */ const px = Math.cos(t.heading), pz = -Math.sin(t.heading); m.goal = { x: t.pos.x + px * 2.6 - Math.sin(t.heading) * 1.5, z: t.pos.z + pz * 2.6 - Math.cos(t.heading) * 1.5, h: t.heading }; }
      if (!m.park) m.park = m.goal ? { x: m.goal.x, z: m.goal.z, h: m.goal.h } : { x: t.pos.x + 2.4, z: t.pos.z, h: t.heading };
      let moving = false;
      const goal = m.goal;
      if (goal) {
        const dx = goal.x - m.park.x, dz = goal.z - m.park.z, d = Math.hypot(dx, dz);
        if (d > 60) { m.park.x = goal.x; m.park.z = goal.z; m.park.h = goal.h; m.goal = null; }
        else if (d > 0.3) { const sp = Math.min(d, dt * 3.2 * Math.min(3, Math.max(0.5, st.speed))); m.park.x += (dx / d) * sp; m.park.z += (dz / d) * sp; m.park.h = App.boatTurn(m.park.h, Math.atan2(dx, dz), dt * 5); moving = st.speed > 0; }
        else { m.park.h = App.boatTurn(m.park.h, goal.h, dt * 2); if (Math.abs(m.park.h - goal.h) < 0.05) m.goal = null; }
      }
      poseMount(m, moving, false, dt, 7);
      m.obj.position.set(m.park.x, App.surfaceAt(m.park.x, m.park.z).y + (m.fly ? 0 : Math.abs(Math.sin(m.ph)) * 0.04), m.park.z);
      m.obj.rotation.y = m.park.h;
    }
    for (const id of [...mounts.keys()]) if (!App.pop.agent[id]) dropMount(id);
  }
  App.mountObjOf = (id) => (mounts.get(id) || {}).obj || null;

  // ---------- private boats: moored in the marina, or out on the lake with their owner ----------
  let boatsDirty = true, owners = [];
  const boatObjs = new Map(); // id -> { grp, kind, v }
  const courses = new Map();
  const isOpen = (x, z) => !App.isLand(x, z) && App.lakeSd(x, z) < -3;
  const clearRun = (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 3); for (let k = 0; k <= n; k++) { const u = k / n; if (!isOpen(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u)) return false; } return true; };
  function mooringOf(id) { const o = st.own[id]; const D = App.docks[o.dock]; if (!D) return null; const M = marinaOf(D); return M.slots[o.moor] || M.slots[0] || null; }
  // a loop of marks out on the lake in front of the dock, the same for this boat every time
  function courseOf(id) {
    let C = courses.get(id);
    if (C) return C;
    const o = st.own[id], D = App.docks[o.dock], moor = mooringOf(id);
    if (!D || !moor) return null;
    const ux = D.ux, uz = D.uz, px = uz, pz = -ux, side = moor.sd;
    const exit = { x: moor.x + px * side * 6 + ux * 2, z: moor.z + pz * side * 6 + uz * 2 };
    let marks = null;
    for (let tries = 0; tries < 10 && !marks; tries++) {
      const k = 1 - tries * 0.08, sw = (hash2(id, tries, 671) - 0.5) * 0.9, cs = Math.cos(sw), sn = Math.sin(sw);
      const pts = [[26, side * 22], [58, side * 12], [62, -side * 18], [32, -side * 24]].map(([al, sd]) => { al *= k; sd *= k; const a2 = al * cs - sd * sn, s2 = al * sn + sd * cs; return { x: D.berth.x + ux * a2 + px * s2, z: D.berth.z + uz * a2 + pz * s2 }; });
      if (pts.every((p) => isOpen(p.x, p.z)) && clearRun(exit, pts[0]) && pts.every((p, i) => clearRun(p, pts[(i + 1) % pts.length])) && clearRun(pts[pts.length - 1], exit)) marks = pts;
    }
    if (!marks) { const out = { x: exit.x + ux * 14, z: exit.z + uz * 14 }; marks = isOpen(out.x, out.z) ? [out] : [{ x: exit.x + ux * 4, z: exit.z + uz * 4 }]; }
    C = { moor, exit, marks };
    courses.set(id, C);
    return C;
  }
  // where a boat is at time T: moored, or sailing its course (n laps, timed to be back when the afternoon ends)
  function boatPose(id, T) {
    T = T == null ? st.T : T;
    const o = st.own && st.own[id];
    if (!o || !o.b) return null;
    const moor = mooringOf(id);
    if (!moor) return null;
    const day = Math.floor(T / DAY), m = T - day * DAY;
    const { step } = App.planStep(id, T);
    if (step.k === "sail" && !App.isKO(id)) {
      const s0 = step.s + (step.travel || 0) + 3, e0 = step.e - 4;
      if (m > s0 && m < e0) {
        const C = courseOf(id);
        if (C) {
          const loop = C.marks.concat([C.marks[0]]), Lloop = C.marks.length > 1 ? App.pathLength(loop) : 0, Lout = Math.hypot(C.exit.x - moor.x, C.exit.z - moor.z) + Math.hypot(C.marks[0].x - C.exit.x, C.marks[0].z - C.exit.z);
          const W = e0 - s0, laps = Lloop > 0 ? Math.max(1, Math.round((W * 6 - 2 * Lout) / Lloop)) : 1;
          const route = [moor, C.exit];
          for (let k = 0; k < laps; k++) route.push(...C.marks);
          if (Lloop > 0) route.push(C.marks[0]);
          route.push(C.exit, moor);
          const L = App.pathLength(route), d = ((m - s0) / W) * L, p = App.alongPath(route, d), q = App.alongPath(route, Math.min(L, d + 1.5)), r = App.alongPath(route, Math.max(0, d - 1.5));
          return { x: p.x, z: p.z, h: Math.atan2(q.x - r.x, q.z - r.z), out: true, until: day * DAY + e0 };
        }
      }
    }
    return { x: moor.x, z: moor.z, h: moor.h, out: false };
  }
  App.boatPose = boatPose;
  const DECK = { rowboat: { y: 0.05, f: -0.6 }, sailboat: { y: 0.42, f: -1.4 }, yacht: { y: 0.78, f: -2.6 } };
  // the owner aboard, at the helm (sim.js: action kind "sail")
  App.stepSail = (t, a, dm, dtReal) => {
    const p = boatPose(t.id), o = st.own[t.id];
    if (!p || !p.out || st.T >= a.until) {
      const D = o && App.docks[o.dock];
      if (D) { t.pos.x = D.land.x; t.pos.z = D.land.z; }
      t.action = null; App.animateTickle(t, false, dtReal); return;
    }
    const kind = CAT.boat[o.b].kind, dk = DECK[kind];
    App.animateTickle(t, false, dtReal);
    t.heading = p.h;
    t.pos.x = p.x + Math.sin(p.h) * dk.f; t.pos.z = p.z + Math.cos(p.h) * dk.f;
    t.pos.y = App.WATER_Y - 0.3 + dk.y + Math.sin(performance.now() / 600 + t.id) * 0.05;
    t.group.position.copy(t.pos); t.group.rotation.y = t.heading;
    if (rnd() < dm * 0.004) App.say(t, pick(["What a breeze!", "Ahoy!", "Nothing like the open water.", "Look at her go!"]), 3);
  };
  function updateBoats(dt) {
    if (!App.docks) return;
    if (boatsDirty) { boatsDirty = false; owners = Object.keys(st.own || {}).map(Number).filter((id) => st.own[id].b); for (const [id, b] of boatObjs) if (!st.own[id] || !st.own[id].b) { App.scene.remove(b.grp); boatObjs.delete(id); } }
    const now = performance.now() / 1000;
    for (const id of owners) {
      const o = st.own[id], D = App.docks[o.dock];
      if (!D) continue;
      const near = camD(D.x, D.z) < 430;
      let b = boatObjs.get(id);
      const kind = CAT.boat[o.b].kind, v = Math.floor(hash2(id, 7, 711) * 6);
      if (b && (!near || b.kind !== kind)) { App.scene.remove(b.grp); boatObjs.delete(id); b = null; }
      if (!near) continue;
      if (!b) {
        b = { grp: new THREE.Group(), kind, v, ready: false };
        boatObjs.set(id, b);
        App.scene.add(b.grp);
        App.kitMesh(kind, kind === "rowboat" ? 0 : v).then((r) => { if (boatObjs.get(id) !== b) return; b.grp.add(App.centeredMesh(r.md, r.geo, true)); b.ready = true; });
      }
      let p = boatPose(id);
      if (!p) continue;
      // in the hand, or set down somewhere for a while (hand.js)
      if (b.hand) { if (b.hand.held || performance.now() < b.hand.until) p = { x: b.hand.x, z: b.hand.z, h: p.h, out: false, y: b.hand.y }; else b.hand = null; }
      b.pose = p;
      const lean = p.out && kind !== "rowboat" ? 0.08 : 0;
      b.grp.position.set(p.x, p.y != null ? p.y : App.WATER_Y - 0.3 + Math.sin(now * 1.5 + id) * 0.05, p.z);
      b.grp.rotation.set(Math.sin(now * 1.1 + id) * 0.02, p.h, lean + Math.sin(now * 1.3 + id) * 0.03);
    }
  }

  // ---------- the Blacksmiths' Guild near you: horses in the paddock, a griffin on the roost, smoke ----------
  const deco = new Map(); // smithy index -> { horses: [...], griffin }
  function updateSmithies(dt) {
    for (const S0 of App.smithies || []) {
      const d = camD(S0.x, S0.z);
      let D = deco.get(S0.i);
      if (d > 300) { if (D) { for (const h of D.horses) if (h.obj) App.scene.remove(h.obj); if (D.griffin && D.griffin.obj) App.scene.remove(D.griffin.obj); deco.delete(S0.i); } continue; }
      if (!D) {
        D = { horses: [], griffin: null };
        deco.set(S0.i, D);
        [0, 1, 2, 3].forEach((coat, k) => {
          const h = { obj: null, legs: [], wings: [], ph: 0, x: S0.paddock.x + Math.cos(k * 1.7) * 3, z: S0.paddock.z + Math.sin(k * 1.7) * 3, h: k, goal: null, wait: rnd() * 3 };
          D.horses.push(h);
          buildMount("horse", coat, CAT.mount[Math.min(3, coat + 1)].scale).then((r) => { if (deco.get(S0.i) !== D) return; Object.assign(h, r); App.scene.add(h.obj); });
        });
        const g = { obj: null, legs: [], wings: [], ph: 0, flapUntil: 0 };
        D.griffin = g;
        buildMount("griffin", 0, 1).then((r) => { if (deco.get(S0.i) !== D) return; Object.assign(g, r); App.scene.add(g.obj); });
      }
      const sp = Math.min(3, Math.max(0.5, st.speed)) * (st.speed > 0 ? 1 : 0);
      for (const h of D.horses) {
        if (!h.obj) continue;
        let moving = false;
        if (!h.goal) { h.wait -= dt * sp; if (h.wait <= 0) { const a = rnd() * 6.28, r = rnd() * 4.2; h.goal = { x: S0.paddock.x + Math.cos(a) * r, z: S0.paddock.z + Math.sin(a) * r }; } }
        else {
          const dx = h.goal.x - h.x, dz = h.goal.z - h.z, dd = Math.hypot(dx, dz);
          if (dd < 0.2) { h.goal = null; h.wait = 2 + rnd() * 6; }
          else { const st2 = Math.min(dd, dt * 1.3 * sp); h.x += (dx / dd) * st2; h.z += (dz / dd) * st2; h.h = App.boatTurn(h.h, Math.atan2(dx, dz), dt * 3); moving = sp > 0; }
        }
        if (h.held) continue; // in the hand
        poseMount(h, moving, false, dt * sp, 6);
        h.obj.position.set(h.x, App.surfaceAt(h.x, h.z).y, h.z);
        h.obj.rotation.y = h.h;
      }
      const g = D.griffin;
      if (g && g.obj) {
        const now = performance.now();
        if (now > g.flapUntil + 9000 + (S0.i % 3) * 3000 && rnd() < dt * 0.2) { g.flapUntil = now + 1800; if (d < 60 && App.sfx && App.sfx.animal && !App.inside) App.sfx.animal("griffin", 0.3 * (1 - d / 60), "amb"); }
        const top = { x: S0.roost.x, y: App.genHeight(S0.roost.x, S0.roost.z) + 1336 * S * 1.3, z: S0.roost.z };
        if (g.held) { poseMount(g, true, true, dt * 1.6, 14); }
        else if (g.back) {
          // thrown off its roost: it flies straight back up
          const k = Math.min(1, (now - g.back.t0) / 4000), e = k * k * (3 - 2 * k);
          g.x = g.back.x + (top.x - g.back.x) * e; g.z = g.back.z + (top.z - g.back.z) * e; g.y = g.back.y + (top.y - g.back.y) * e + Math.sin(k * Math.PI) * 6;
          g.obj.position.set(g.x, g.y, g.z); g.obj.rotation.y = Math.atan2(top.x - g.back.x, top.z - g.back.z);
          poseMount(g, true, true, dt * 1.6, 14);
          if (k >= 1) g.back = null;
        } else {
          const flapping = now < g.flapUntil;
          poseMount(g, flapping, flapping, dt * 1.6, 12);
          g.x = top.x; g.y = top.y; g.z = top.z;
          g.obj.position.set(top.x, top.y, top.z);
          g.obj.rotation.y = S0.rot + Math.sin(now / 4000) * 0.6;
        }
      }
      // smoke from the forge chimney
      if (st.speed > 0 && rnd() < dt * 2.2 && App.spawnParticle && !App.inside) {
        const c = local(S0, 300, -300);
        App.spawnParticle({ kind: "smoke", x: c.x + (rnd() - 0.5) * 0.4, y: S0.h + 1 + 1210 * S * (S0.scale || 1), z: c.z + (rnd() - 0.5) * 0.4, vx: (rnd() - 0.5) * 0.3, vy: 0.4 + rnd() * 0.3, vz: (rnd() - 0.5) * 0.3, age: 0, life: 3 + rnd() * 2, color: new THREE.Color(rnd() < 0.5 ? "#8a8a8a" : "#6a6a6a") });
      }
    }
  }

  // ---------- what the inspect window says about a mount (inspect.js) ----------
  function mountInfo(id) {
    const M = App.mountOf(id);
    if (!M) return null;
    return { title: M.name, sub: "The mount of " + App.nameOf(id), tickle: id,
      chips: [M.fly ? "Flies straight over everything" : "Trots on the long trips", "x" + M.mul + " the walking speed"],
      rows: [["Rider", App.nameOf(id)], ["Kind", M.kind === "beast" ? "a riding beast" : M.kind === "monster" ? "a tamed monster" : M.fly ? "a riding griffin" : "a horse"]].concat(M.kind === "horse" || M.fly ? [["Worth", CAT.mount[M.tier] ? CAT.mount[M.tier].price + " shells" : "-"]] : []),
      text: "<p>It waits by its rider, and at night by the house. On a long trip its rider gets on and rides; in first person, M gets you into the saddle.</p>" };
  }
  App.mountInfo = mountInfo;
  // ---------- the hand can pick them all up (hand.js) ----------
  // a horse, a pony, a charger or a griffin: waiting by its rider, in the guild's paddock or on the roost
  function handThing(m, P, sound, onLand, info) {
    const T = { x: P.x, y: m.obj.position.y, z: P.z, sound, lift: 2.4,
      grab() { m.held = true; m.goal = null; },
      set(x, y, z) { P.x = x; P.z = z; if (P.y != null) P.y = y; m.obj.position.set(x, y, z); },
      land(hard) { m.held = false; m.goal = null; if (onLand) onLand(T, hard); } };
    return { kind: "thing", obj: T, x: P.x, y: m.obj.position.y + 1.6, z: P.z, r: 36, info };
  }
  (App.handThings = App.handThings || []).push((tx, tz) => {
    const out = [];
    // a private boat moored in the marina: dropped in the water it floats there a while, then drifts home
    for (const [id, b] of boatObjs) {
      if (!b.pose || b.pose.out || !b.ready) continue;
      const P = b.pose;
      const T = { x: P.x, y: App.WATER_Y, z: P.z, sound: "boat", lift: 2.4,
        grab() { b.hand = { x: P.x, z: P.z, y: App.WATER_Y, held: true, until: 0 }; },
        set(x, y, z) { if (b.hand) { b.hand.x = x; b.hand.y = y; b.hand.z = z; } },
        land() { if (!b.hand) return; b.hand.held = false; b.hand.y = App.isLand(b.hand.x, b.hand.z) ? App.surfaceAt(b.hand.x, b.hand.z).y : null; b.hand.until = performance.now() + (App.isLand(b.hand.x, b.hand.z) ? 6000 : 40000); } };
      const B = CAT.boat[(st.own[id] || {}).b || 1];
      out.push({ kind: "thing", obj: T, x: P.x, y: App.WATER_Y + 1, z: P.z, r: 40, info: () => ({ title: B.short, sub: "The boat of " + App.nameOf(id), rows: [["Owner", App.nameOf(id)], ["Moored", App.docks[st.own[id].dock] ? "in the marina of " + App.docks[st.own[id].dock].name : "in a marina"], ["Worth", B.price + " shells"]], text: "<p>Bought at the Blacksmiths' Guild. Some afternoons its owner takes it out on the lake.</p>", tickle: id }) });
    }
    for (const [id, m] of mounts) if (m.obj && m.park && m.obj.parent === App.scene && Math.abs(m.park.x - tx) + Math.abs(m.park.z - tz) < 140) out.push(handThing(m, m.park, m.fly ? "griffin" : "horse", null, () => mountInfo(id)));
    for (const D of deco.values()) {
      const forSale = (t, x) => () => ({ title: t, sub: "For sale at the Blacksmiths' Guild", rows: [["Price", x]], chips: [t === "A riding griffin" ? "Flies straight over everything" : "Trots on the long trips"], text: "<p>Bought by Tickles with shells to spare (and by you for yours, from their card). A trade-in pays half of what the old one cost.</p>" });
      for (const h of D.horses) if (h.obj) out.push(handThing(h, h, "horse", () => { h.goal = null; h.wait = 1 + rnd() * 2; }, forSale("A horse in the paddock", "a pony " + CAT.mount[1].price + ", a saddle horse " + CAT.mount[2].price + ", a white charger " + CAT.mount[3].price + " shells")));
      const g = D.griffin;
      if (g && g.obj && g.x != null) out.push(handThing(g, g, "griffin", (T) => { g.back = { x: T.x, y: T.y, z: T.z, t0: performance.now() }; }, forSale("A riding griffin", CAT.mount[4].price + " shells")));
    }
    return out;
  });

  // ---------- every frame ----------
  App.updateWealth = (dt) => {
    if (!st.own) return;
    updateMounts(dt);
    updateBoats(dt);
    updateSmithies(dt);
  };

  // ---------- the panels ----------
  App.wealthRowHTML = (id) => {
    const txt = App.wealthText(id), mine = (App.isMine && App.isMine(id)) || (st.mode === "manual" && !st.wallet);
    let h = '<span class="k">Belongings</span><span>' + (txt ? esc(txt) : '<span class="note">nothing more than its house and what it carries</span>') + "</span>";
    if (mine) {
      const list = allNext(id), purse = App.shellsOf(id);
      if (list.length) h += '<span class="k">Buy</span><span>' + list.map((w) => '<button class="btn" data-buy="' + id + ":" + w.cat + ":" + w.price + '"' + (purse < w.price ? " disabled" : "") + ' title="' + esc(nameOfBuy(w, id)) + (w.from ? " (trading in the old one for half its price)" : "") + '">' + esc(shortOfBuy(w, id)) + " \u00b7 " + w.price + "</button>").join(" ") + "</span>";
    }
    return h;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-buy]");
    if (b) { const [id, cat, price] = b.dataset.buy.split(":"); App.buyFor(+id, cat, price ? +price : null); return; }
    const tk = e.target.closest("[data-tickle]");
    if (tk && App.goToToken) { App.goToToken(+tk.dataset.tickle, true); return; }
    const f = e.target.closest("[data-smithy]");
    if (f) { const S0 = App.smithies[+f.dataset.smithy]; if (S0) App.flyTo(S0.x, S0.z, 30); }
  });
  App.wealthHTML = () => {
    if (!st.own) return "";
    const L = st.wealthLog, cnt = { h1: 0, h2: 0, b1: 0, b2: 0, b3: 0, m1: 0, m2: 0, m3: 0, m4: 0 };
    for (const id in st.own) { const o = st.own[id]; if (o.h) cnt["h" + o.h]++; if (o.b) cnt["b" + o.b]++; if (o.m) cnt["m" + o.m]++; }
    let fine = 0, master = 0;
    for (const id in st.gear || {}) { const q = st.gear[id].q; if (q === 1) fine++; else if (q === 2) master++; }
    const top = [];
    for (let id = 0; id < TB.SUPPLY; id++) { const w = worthOf(id); if (top.length < 8 || w > top[top.length - 1][1]) { top.push([id, w]); top.sort((a, b) => b[1] - a[1]); if (top.length > 8) top.pop(); } }
    let h = '<div class="card"><h3>Wealth</h3><p class="note">Shells buy bigger houses (built by the village), boats for the marina by each dock, mounts that make long trips quicker (a griffin flies straight there); some ride a stag, a ram or a boar instead, and a tamer rides its tamed monster when it is big enough to carry it and better arms. They are sold at the Blacksmiths\' Guild of each region; a trade-in pays half of what the old one cost. Some families were rich before it all began.</p><div class="kv">' +
      '<span class="k">Houses</span><span>' + cnt.h2 + " manors, " + cnt.h1 + " townhouses</span>" +
      '<span class="k">Boats</span><span>' + cnt.b3 + " yachts, " + cnt.b2 + " sailing boats, " + cnt.b1 + " rowing boats</span>" +
      '<span class="k">Mounts</span><span>' + cnt.m4 + " riding griffins, " + cnt.m3 + " white chargers, " + cnt.m2 + " saddle horses, " + cnt.m1 + " ponies</span>" +
      '<span class="k">Arms</span><span>' + master + " masterwork and " + fine + " fine steel weapons</span>" +
      '<span class="k">Bought</span><span>' + (L.house + L.boat + L.mount + L.weapon + L.shield) + " things since the game began, for " + Math.round(L.spent).toLocaleString() + " shells</span>" +
      '<span class="k">Price list</span><span>' + ["house", "mount", "boat", "weapon", "shield"].map((c) => CAT[c].filter(Boolean).map((x) => esc(x.short) + " " + x.price).join(", ")).join(" \u00b7 ") + "</span>" +
      '<span class="k">Guilds</span><span>' + (App.smithies || []).map((S0) => '<button class="btn" data-smithy="' + S0.i + '">' + esc(S0.name) + "</button>").join(" ") + "</span></div>" +
      '<h3>The richest</h3><div class="kv">' + top.map(([id, w]) => '<span class="k"><button class="btn" data-tickle="' + id + '">' + esc(App.nameOf(id)) + "</button></span><span>" + Math.round(w).toLocaleString() + " shells in all" + (App.wealthText(id) ? " \u00b7 " + esc(App.wealthText(id)) : "") + "</span>").join("") + "</div></div>";
    return h;
  };
  // the card of the Blacksmiths' Guild (places.js)
  App.smithyInfo = (s) => {
    const S0 = App.smithies && App.smithies[s.smithy];
    if (!S0) return null;
    const staff = [...staffFor(today()).entries()].filter(([, j]) => j.S === S0);
    const d = today(), shoppers = st.orders && st.orders.day === d ? st.orders.list.filter((o) => !o.done && o.cat !== "house" && o.cat !== "boat" && App.smithyOf(o.id) === S0) : [];
    const what = s.paddock ? "The guild's paddock: horses for sale (a dun pony " + CAT.mount[1].price + ", a saddle horse " + CAT.mount[2].price + ", a white charger " + CAT.mount[3].price + " shells), and for less than a pony a riding ram (" + BEASTS.sheep.price + "), a riding boar (" + BEASTS.boar.price + ") or a stag (" + BEASTS.deer.price + "); a groom looks after them all."
      : s.roost ? "The griffin roost: a riding griffin costs " + CAT.mount[4].price + " shells. It flies its rider straight over lakes and hills, four times faster than walking."
      : "Two smiths hammer at the anvils all day. Fine steel weapons " + CAT.weapon[1].price + " shells, masterwork " + CAT.weapon[2].price + ", steel shields " + CAT.shield[2].price + "; the guild also sells the mounts in its paddock and roost. Better arms hit harder: fine steel by a quarter, masterwork by half.";
    return { name: S0.name + (s.paddock ? " \u00b7 Paddock" : s.roost ? " \u00b7 Griffin Roost" : ""), text: "<p>" + esc(what) + "</p>" +
      '<p class="note">' + (staff.length ? "Working today: " + staff.map(([id, j]) => esc(App.nameOf(id)) + " (" + (j.k === "smith" ? "smith" : "groom") + ")").join(", ") + ". " : "") +
      (shoppers.length ? shoppers.length + " customer" + (shoppers.length === 1 ? "" : "s") + " expected this afternoon." : "No customers expected today.") + "</p>" };
  };
  App.isSmithyType = (t) => t === "smithy_0" || t === "paddock_0" || t === "roost_0";
})();
