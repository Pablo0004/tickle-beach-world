/* Inspect: click anything to see what it is, in a small window. A Tickle, a creature, a monster, a farm or a wild
 * animal, the lake's animals and the ponds' ducks and fish, a songbird, a dragon, a sea beast, a boat, a mount, a tree
 * or a rock, a placed object, the ground itself or the water; inside, the Tickles, the monsters and every piece of
 * furniture or of the cave. Living things show their health, what they can do, what they fight with and carry, and
 * what they are up to. The window keeps itself up to date while it is open (a fight can be followed in it).
 * Buildings and landmarks keep their own card (places.js). */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cap = (s) => String(s || "").replace(/^./, (c) => c.toUpperCase());
  const short = (a) => (a ? a.slice(0, 6) + "\u2026" + a.slice(-4) : "");
  const needText = (needs) => Object.entries(needs || {}).map(([k, n]) => (App.NEED_LABEL[k] || k) + " " + (n > 0 ? "+" : "") + n).join(", ");
  const V = new THREE.Vector3();
  const NEED_COL = { hunger: "#ffb24a", energy: "#7be08f", social: "#ff8fc0", fun: "#3cc6d8" };

  // ---------- a Tickle ----------
  // (rows are plain text; text is HTML)
  function tickleInfo(id) {
    const P = App.pop, t = P.agent[id], v = App.villageOfToken(id), job = App.JOB_INFO[App.jobOf(id)];
    const out = { title: App.nameOf(id), sub: (job ? job.title : "Villager") + " \u00b7 level " + (App.levelOf ? App.levelOf(id) : 1) + (v ? " \u00b7 " + v.name : ""), rows: [], chips: [], arms: [], tickle: id, isTickle: true };
    // health: what the last fight has left it (between fights it is back to full), or knocked out, or fallen
    const max = App.maxHPOf ? Math.round(App.maxHPOf(id)) : 100, fight = t && t.hpMax > 0 && st.T - (t.hpAt || -1e9) <= 120;
    const dead = App.isDead(id), ko = App.isKO(id);
    out.hp = { now: dead || ko ? 0 : fight ? t.hp : max, max: fight ? t.hpMax : max, label: dead ? "Fallen: its spirit waits at the altar" : ko ? "Knocked out, coming round" : null };
    out.bars = App.NEEDS.map((k, i) => ({ label: App.NEED_LABEL[k], v: (t ? t.needs[k] : P.needs[id * 4 + i]) / 100, col: NEED_COL[k] }));
    // what it is doing, and its day
    const step = App.planStep(id, st.T).step;
    out.rows.push(["Now", t && App.actionText ? App.actionText(t) : App.stepLabel(step.k) || step.k]);
    out.rows.push(["Today", (App.stepLabel(step.k) || step.k) + (step.p && step.p.label ? " \u00b7 " + step.p.label : "")]);
    out.rows.push(["Holder", (short(App.ownerOf(id)) || "nobody") + (App.isMine && App.isMine(id) ? " (you)" : "")]);
    if (v) out.rows.push(["Home", v.name + (App.placeKindText ? ": " + App.placeKindText(v) : "")]);
    // what it can do
    const role = App.combatRole ? App.combatRole(id) : null, school = App.mageSchool ? App.mageSchool(id) : null, lead = App.leadCreature ? App.leadCreature(id) : null;
    if (role === "mage") out.chips.push("Mage: casts " + (App.SPELLS[school] ? App.SPELLS[school].name : "spells"));
    else if (role === "healer") out.chips.push("Healer: casts Healing Light");
    else if (role === "warrior") out.chips.push("Fights with arms");
    if (lead || (App.isTamer && App.isTamer(id))) out.chips.push("Tamer");
    if (App.heroOf && App.heroOf(id)) out.chips.push("Blessed by the Maker");
    if (App.isAdventurer && App.isAdventurer(id)) out.chips.push("Adventurer");
    if (App.isMinister && App.isMinister(id)) out.chips.push("Minister in the Parliament");
    if (App.isListed && App.isListed(id)) out.chips.push("Up for sale: lives in the prison");
    if (job) out.chips.push(cap(job.verb.replace(/^is /, "")) + " (work)");
    const gld = App.guildOf ? App.guildOf(id) : null, fac = App.factionOf ? App.factionOf(id) : null;
    if (gld && App.GUILDS[gld]) out.rows.push(["Guild", App.GUILDS[gld].name + (App.guildRankName ? " \u00b7 " + App.guildRankName(id) : "")]);
    if (fac && fac !== "guild" && App.FACTIONS[fac]) out.rows.push(["Faction", App.FACTIONS[fac].name]);
    // what it fights with and carries
    const gt = App.gearText ? App.gearText(id) : null;
    if (gt) out.arms.push(gt);
    const c = App.armsCond ? App.armsCond(id) : null;
    if (c) out.arms.push("weapon " + Math.round(c.w) + "%" + (c.s != null ? ", shield " + Math.round(c.s) + "%" : ""));
    if (lead) out.arms.push("its creature " + App.creatureLabel(lead) + " (" + App.CREATURES[lead.sp].move + ")");
    if (!out.arms.length) out.arms.push("none: it runs from a fight");
    const crs = App.creaturesOf ? App.creaturesOf(id) : [];
    if (crs.length > 1) out.rows.push(["Creatures", crs.map((x) => App.creatureLabel(x)).join(", ")]);
    const relics = App.relicsOf ? App.relicsOf(id) : [];
    if (relics.length) out.rows.push(["Relics", relics.map((k) => App.relicInfo(k).name).join(", ")]);
    const M = App.mountOf ? App.mountOf(id) : null;
    if (M) out.rows.push(["Rides", M.name]);
    // its on-chain things
    const tr = App.traitsOf ? App.traitsOf(id) : {}, wear = Object.entries(tr).filter(([k, x]) => !/Theme$/.test(k) && k !== "Body" && x !== "None" && x !== "?").map(([k, x]) => k + ": " + x);
    if (wear.length) out.rows.push(["On-chain", wear.join(" \u00b7 ")]);
    out.rows.push(["Shells", Math.floor(App.shellsOf(id)).toLocaleString() + (App.ethernumOf ? " \u00b7 Ethernum " + Math.round(App.ethernumOf(id) * 10) / 10 : "")]);
    const w = App.wealthText ? App.wealthText(id) : "";
    if (w) out.rows.push(["Owns", w]);
    if (App.underPower) out.rows.push(["Strength", Math.round(App.underPower(id)) + " (in a party down the Underworld)"]);
    out.buttons = [{ label: "Full card", act: () => App.selectTickle && App.selectTickle(id) }];
    if (!App.inside) out.buttons.push({ label: "Follow", act: () => { App.cam.follow = id; App.cam.fly = null; } });
    if (App.enterFP && !App.inside) out.buttons.push({ label: "First person", act: () => App.enterFP(id) });
    return out;
  }
  // ---------- creatures: wild, or at their tamer's heel (the tamed monsters too) ----------
  function creatureInfo(b) {
    const B = App.CREATURES[b.sp], d = b.data || { sp: b.sp, lvl: 1 }, S = App.creatureStats(d), owner = b.owner != null ? b.owner : null;
    const bt = b.battle, side = bt ? (bt.A.b === b ? 0 : 1) : -1;
    const out = { title: (d.nick ? d.nick + " the " : "") + B.name, sub: B.type + " type \u00b7 level " + d.lvl + " \u00b7 " + (owner != null ? "tamed by " + App.nameOf(owner) : "wild"),
      hp: side >= 0 ? { now: bt.hp[side], max: bt.max[side] } : { now: S.hp, max: S.hp }, chips: ["Attack: " + B.move], rows: [], tickle: owner };
    out.rows.push(["Attack", Math.round(S.atk)], ["Defence", Math.round(S.def)], ["Speed", Math.round(S.spd)]);
    if (App.CREATURE_STRONG[B.type]) out.rows.push(["Strong against", App.CREATURE_STRONG[B.type].join(" and ") + " types"]);
    if (side >= 0) out.chips.push("Battling!");
    if (d.gem) out.chips.push("Gem collar from the mine");
    if (App.MOUNT_MONSTERS[b.sp]) out.chips.push("Big enough to carry its tamer");
    if (B.hover) out.chips.push("Flies");
    out.text = B.monster ? "<p>A monster of the deep places, won over by a tamer. It follows its tamer about and fights for it in the arena with its type and its attack.</p>"
      : "<p>One of the creatures that live wild in their habitats (" + esc((B.habitats || []).join(", ")) + "). Tamers win them over with a snack and a battle, keep up to three, and fight with them, type against type, in the arena every evening.</p>";
    return out;
  }
  // ---------- the monsters at the cave mouths ----------
  function monsterInfo(m) {
    const M = App.MONSTERS[m.kind] || { name: cap(m.kind), atk: 5, xp: 5 };
    return { title: M.name, sub: "At the mouth of " + (m.d && m.d.name ? m.d.name : "a cave"), hp: { now: m.hp, max: m.max || m.hp }, chips: ["Attacks whoever comes near"].concat(App.MONSTER_TAMABLE.includes(m.kind) ? ["A tamer can win it over"] : []).concat(m.foe ? ["Fighting!"] : []),
      rows: [["Attack", M.atk], ["Worth", M.xp + " experience to whoever beats it"]], text: "<p>Monsters lurk at the mouths of the caves that lead down into the Great Underworld; the parties fight their way past them.</p>" };
  }
  // ---------- farm and wild animals, the lake's, the ponds' ----------
  const ANIMAL = {
    pig: "A pig of the village's sty: the herders feed it.", chicken: "A hen of the village's coop: eggs for the granary.", sheep: "A sheep of the village's fold: the shepherd brings the flock in at night. A ram can be ridden.",
    deer: "A wild deer of the meadows: the hunters and the wild griffins chase it, and it can outrun them for a while. A stag can be ridden.", boar: "A wild boar: the hunters go after it for the granary. It can be ridden.",
    swan: "Swans swim the lake in pairs and keep to their mate.", turtle: "A lake turtle: it dives and comes up again to bask.", frog: "A frog: it hops from pad to pad and croaks in bouts, more at night. Herons hunt it.",
    heron: "A heron: it stands still in the shallows and strikes at the frogs and fish that come close.", otter: "An otter: it chases the koi through the lake.", koi: "A koi below the surface: the otters hunt it.",
    duck: "A duck of the pond: it paddles about, waddles onto the bank now and then, and swims over to whoever feeds it.", fish: "A fish of the pond: it swims below the surface and jumps now and then.",
  };
  const WATERLIFE = new Set(["swan", "turtle", "frog", "heron", "otter", "koi", "duck", "fish"]);
  function animalInfo(o) {
    const k = o.k || o.kind, farm = o.vi != null ? App.villages[o.vi] : null;
    return { title: cap(k), sub: farm ? "Farm animal of " + farm.name : WATERLIFE.has(k) ? (k === "duck" || k === "fish" ? "Pond life" : "Lake life") : "Wild animal", text: "<p>" + esc(ANIMAL[k] || "An animal of the island.") + "</p>",
      chips: [o.fleeing > st.T ? "Running away!" : null].filter(Boolean), rows: [] };
  }
  function birdInfo(b) {
    const SONG = { "Moon Owl": "a hoot, at night", "Sea Gull": "its cry, wheeling over the shore" };
    return { title: b.kind, sub: "Songbird", text: "<p>It sings " + esc(SONG[b.kind] || "now and then from its perch") + ". All the birds sing in the same scale and on the same slow pulse, so those that sing together are in tune; the dawn chorus is the fullest.</p>", rows: [] };
  }
  // ---------- a dragon ----------
  function dragonInfo(d) {
    const L = d.lair, look = TB.DRAGON_LOOKS[L.look] ? TB.DRAGON_LOOKS[L.look].name : "", s = App.dragonState(L, st.T);
    const D = d.duel ? (d.duel.a === d ? d.duel.fa : d.duel.fb) : null, A = d.live && d.live.attack;
    const H = d.rampage || D || (A && A.maxHp ? A : null) || d.hunt || null;
    const doing = d.dead ? "Slain" : d.rampage ? "On the rampage among the Tickles!" : D ? "Fighting another dragon!" : A ? "Attacking " + App.villages[A.to].name + "!" : d.hunt ? "Fighting the Guild's hunters on its peak" : d.held ? "In your hand" : s.mode === "patrol" ? "Flying a patrol over its land" : s.mode === "perch" ? (App.sleepingDragonNear && App.sleepingDragonNear(L.x, L.z) === L ? "Asleep on its peak" : "Watching from its peak") : s.mode === "fly" || s.mode === "circle" ? "On the wing" : "Awake";
    const out = { title: (look ? look + " dragon" : "Dragon") + " of " + L.name, sub: doing, chips: ["Fire breath", "Tail swipe", "Roar that scatters Tickles"], rows: [["Lair", L.name + " \u00b7 " + App.regions[L.region].name]] };
    if (H && H.maxHp > 0) out.hp = { now: H.hp, max: H.maxHp };
    out.text = "<p>Dragons sleep on their peaks and fly patrols over their land; now and then one flies at a village and the Tickles run to the granary with stones. Only the armed, the mages and the tamers stand and fight it. The Adventurers' Guild hunts them; a slain dragon's peak stands empty for a while.</p>";
    return out;
  }
  // ---------- scenery, placed objects ----------
  const SCN = {
    tree_leafy: "A leafy tree.", tree_pine: "A pine.", bush: "A flowering bush.", wheat: "Wheat: the farmers harvest it for the granary.", cabbage: "Cabbages: the farmers harvest them for the granary.",
    boulders: "Rocks to climb.", fence: "A fence round the animals' pen.", sty: "The pigs' shed.", coop: "The hens' house.", trough: "The animals' trough.",
  };
  function sceneryInfo(s) {
    const kind = App.kindOf(s.type), K = TB.KIT[kind], F = TB.FRAGMENTS && TB.FRAGMENTS[s.type];
    const out = { title: F ? F.name : K ? K.name : cap(kind.replace(/_/g, " ")), sub: (F ? "Cut from an on-chain floor" : K && K.group ? K.group : "Scenery") + " \u00b7 " + App.regions[App.regionOf(s.x, s.z)].name, rows: [], chips: [] };
    const A = App.SCENERY_ACTS[kind] || App.SCENERY_ACTS[s.type];
    if (A) out.rows.push(["Tickles come to", A[0] + " (" + needText(A[2]) + ")"]);
    const movable = !s.fixed && !s.building && !s.ruined;
    out.text = "<p>" + esc(SCN[kind] || (F ? "A piece of the on-chain floors, set into the world." : "Part of the scenery.")) + (movable ? " The hand can pick it up and throw it; broken, it grows back later." : "") + "</p>";
    if (App.isBroken && App.isBroken(s)) out.chips.push("Broken: it will grow back");
    if (s.ruined) out.chips.push("In ruins: being rebuilt");
    if (App.warSceneryInfo) App.warSceneryInfo(s, out); // its health, and what a war has to do with it (war.js)
    return out;
  }
  function propInfo(p) {
    const a = App.assetById(p.assetId);
    if (!a) return null;
    const act = st.acts.find((x) => x.assetId === a.id && x.status !== "rejected");
    const out = { title: a.name, sub: "Placed object" + (a.category ? " \u00b7 " + a.category : ""), rows: [], chips: [] };
    if (act) { out.chips.push(act.name); out.rows.push(["Helps", needText(act.needs)]); }
    if (a.score != null) out.rows.push(["Fidelity", a.score + "% to the on-chain models"]);
    if (a.basedOn) out.rows.push(["Based on", String(a.basedOn)]);
    if (a.brief) out.text = "<p>" + esc(a.brief) + "</p>";
    out.buttons = [{ label: "Open in Review", act: () => App.openReview && App.openReview(a.id) }];
    return out;
  }
  function ferryInfo(F) {
    const D = App.docks[F.a];
    return { title: F.name || "Ferry", sub: F.launch ? "Launch to the Maker's Isle" : "Ferry across the great lake", rows: [["Boatman", F.boatman != null ? App.nameOf(F.boatman) : "-"], ["Runs", F.launch ? "from " + (D ? D.name : "the dock") + " when pilgrims or ministers have booked it" : "about every " + App.ferryEvery(F) + " minutes, 06:00 to 22:00"]], text: "<p>Tickles who spend their free time across the lake ride it over and back.</p>", chips: [] };
  }
  // ---------- the ground and the water ----------
  function groundInfo(x, z, block, water) {
    const R = App.regions[App.regionOf(x, z)], W = App.weatherAt ? App.weatherAt(x, z, st.T) : null, near = App.nearestVillage ? App.nearestVillage(x, z) : null;
    let title, text;
    if (water) {
      if (App.lakeSd(x, z) <= 0) { title = "The great lake"; text = "Calm water in the middle of the six regions, round the Maker's Isle. Ferries cross it, the fishers row out on it, and now and then the Lake Serpent rises from it."; }
      else if (App.seaAt(x, z)) { title = "The open sea"; text = "The sea round all the land, with waves that the surfers ride in to the beaches. The Kraken lives out there, and divers go down to the wrecks and the reefs."; }
      else if (App.pondWater(x, z)) { title = "A pond"; text = "Ducks paddle on it and fish swim below."; }
      else { title = "A channel"; text = "The water between two regions: the bridges cross it."; }
    } else {
      const B = App.BLOCK_INFO[block] || { name: "Ground" };
      title = B.name;
      text = { Sand: "Beach sand.", Grass: "Grass.", Path: "A path: the Tickles walk along it between the places.", Farmland: "Farmland: the village's fields.", Dirt: "Bare earth.", Stone: "Rock.", "Wet sand": "Wet sand at the water's edge.", Log: "Logs.", Plank: "Planks.", Leaves: "Leaves." }[B.name] || "Built ground.";
    }
    const rows = [["Region", R.name]];
    if (near) rows.push(["Nearest place", near.name]);
    if (W) rows.push(["Weather here", App.weatherName ? App.weatherName(W.kind) : W.kind]);
    return { title, sub: water ? "Water" : "Ground", text: "<p>" + esc(text) + "</p>", rows, chips: [] };
  }
  // ---------- inside: Tickles, monsters and things ----------
  const ITEM = {
    bed: "A bed, a little bigger than the usual so a Tickle fits.", crystal: "An Ether crystal: the stuff of creature magic.", orevein: "A vein of ore in the rock: the miners work it.",
    warpgem: "A teleport gem, the Underworld's save point: a party that has beaten this floor's guardian starts here the next time, and from here it can go back up.",
    spikes: "A spike trap: a party loses some health crossing it.", bones: "Bones of those who came before.", cobweb: "A cobweb.", torch: "A torch on the wall.", brazier: "A brazier.",
    throne: "The elder's seat at the head of the hall.", longtable: "The long table where the household sits in council.", banner: "The banner of the place's holder.",
    picture: "A portrait of the Maker, P.M., who made the island and everyone on it.", table: "A table: breakfast and supper are eaten at it.", stove: "The stove: breakfast and supper are cooked on it.",
    chair: "A chair.", rug: "A rug.", shelf: "A bookshelf.", plant: "A house plant.", window: "A window.", mat: "The doormat, by the way out.", sacks: "Sacks of grain from the fields.", barrel: "A barrel.",
    pillar: "A rock pillar holding up the cave roof.", ladder: "A ladder.", stairs: "Stairs to the next floor.", rubble: "Fallen rock.", mineframe: "Timber props holding up the roof.",
    cart: "A mine cart: the ore goes up in it.", rails: "Rails for the mine carts.", lantern: "A lantern.",
  };
  function itemInfo(o) {
    const it = o.it, K = TB.KIT[it.k], name = it.k === "__ground" ? App.MODEL_NAMES["ground:" + App.pop.ground[it.id]] || "Its on-chain item" : K ? K.name : cap(it.k);
    let text = ITEM[it.k] || "";
    const rows = [];
    if (it.k === "chest") text = it.chest ? (it.v ? "Opened: a party has emptied it today (the chests fill again every day)." : "Closed, and full: the parties open the chests as they go down.") : it.v ? "Open, with the household's shells inside." : "A closed chest.";
    if (it.k === "__ground") text = "Its owner's own on-chain Ground item.";
    const w = o.room.warps.find((x) => Math.hypot(x.x - it.x, x.z - it.z) < 2.5);
    if (w) rows.push(["Way", w.label]);
    return { title: name, sub: o.room.name, text: text ? "<p>" + esc(text) + "</p>" : "", rows, chips: [] };
  }
  function umonsterInfo(o) {
    const m = o.m, mo = m.mo, C = App.CREATURES[mo.k], base = C ? C.name : App.MONSTERS[mo.k] ? App.MONSTERS[mo.k].name : cap(mo.k);
    const out = { title: mo.boss && mo.name ? mo.name : base, sub: (mo.boss ? "Guardian of " : "Roams ") + o.room.name, hp: { now: m.hp, max: m.max }, rows: [], chips: [] };
    if (C) { out.chips.push(C.type + " type", "Attack: " + C.move); out.rows.push(["Attack", C.atk], ["Defence", C.def]); }
    if (mo.boss) out.chips.push("Guards the stairs down: nobody goes deeper until it is beaten");
    else if (App.MONSTER_TAMABLE.includes(mo.k)) out.chips.push("A tamer in a party can win it over");
    if (mo.boss && App.guardianNeed && mo.floor != null) out.rows.push(["To beat it", "a party of about " + Math.round(App.guardianNeed(mo.floor)) + " strength"]);
    return out;
  }

  // the floor or the walls: the room itself
  function roomInfo(o) {
    const R = o.room, map = o.map, n = map.floors || map.rooms.length, out = { title: R.name, sub: map.title + (n > 1 ? " \u00b7 " + (map.floors ? "floor " : "room ") + (o.ri + 1) + " of " + n : ""), rows: [], chips: [] };
    if (R.maze) {
      const left = o.mons.filter((m) => !m.dead), boss = o.mons.find((m) => m.mo.boss);
      out.rows.push(["Monsters", left.length + " still about"]);
      if (boss) out.rows.push(["Guardian", (boss.mo.name || "") + (boss.dead ? " (beaten: it will rise again)" : "")]);
      const closed = R.items.filter((i) => i.chest && !i.v).length;
      out.rows.push(["Chests", closed + " still closed"]);
      if (App.bandLoot) out.rows.push(["Treasure", App.bandLoot(o.ri)]);
    } else {
      const beds = R.items.filter((i) => i.k === "bed").length;
      if (beds) out.rows.push(["Beds", beds]);
    }
    out.text = R.note ? "<p>" + esc(R.note) + "</p>" : "<p>The floor and the walls of " + esc(R.name.replace(/^./, (c) => c.toLowerCase())) + ".</p>";
    return out;
  }

  // ---------- what is under the cursor ----------
  // returns { fn, live, tickle, d } (live: a living thing or something that moves, which wins over a building behind it
  // when it is right under the cursor; tickle: the Tickle's id when it is one; d: how far from the cursor, in pixels)
  App.inspectPick = (ndc) => {
    if (App.inside) {
      const o = App.insidePick ? App.insidePick(ndc) : null;
      if (!o) return null;
      if (o.kind === "tickle") return { fn: () => tickleInfo(o.id), live: true, tickle: o.id };
      if (o.kind === "umonster") return { fn: () => umonsterInfo(o), live: true };
      if (o.kind === "room") return { fn: () => roomInfo(o) };
      return { fn: () => itemInfo(o) };
    }
    const rc = App.renderer.domElement.getBoundingClientRect(), cx = ((ndc.x + 1) / 2) * rc.width, cy = ((1 - ndc.y) / 2) * rc.height;
    const tx = App.cam.target.x, tz = App.cam.target.z;
    let best = null, bd = 1e9;
    App.applyCamera();
    const consider = (fn, x, y, z, r, bias, live, tickle) => { const p = App.project(V.set(x, y, z)); if (p.behind) return; const d = Math.hypot(p.x - cx, p.y - cy); if (d < r && d + bias < bd) { bd = d + bias; best = { fn, live, tickle, d }; } };
    for (const t of st.tickles) if (t.group.visible && t.id !== App.inspectSkip) consider(() => tickleInfo(t.id), t.pos.x, t.pos.y + 1.3, t.pos.z, 30, 0, true, t.id);
    for (const d of App.dragonObjects ? App.dragonObjects.values() : []) if (d.group && d.group.visible !== false) consider(() => dragonInfo(d), d.x, d.y + 3, d.z, 70, 2, true);
    for (const b of App.creatureBodiesNear ? App.creatureBodiesNear(tx, tz, 110) : []) if (!(b.ridden && performance.now() - b.ridden < 300)) consider(() => creatureInfo(b), b.x, (b.y || 0) + 0.6, b.z, 24, 3, true);
    for (const m of App.monstersNear ? App.monstersNear(tx, tz, 110) : []) consider(() => monsterInfo(m), m.x, (m.y || 0) + 0.8, m.z, 26, 3, true);
    for (const an of App.animalsNear ? App.animalsNear(tx, tz, 110) : []) consider(() => animalInfo(an), an.x, (an.y || 0) + 0.6, an.z, an.kind === "chicken" ? 18 : 24, 4, true);
    for (const o of App.lakeAnimalsNear ? App.lakeAnimalsNear(tx, tz, 110) : []) consider(() => animalInfo(o), o.x, (o.y || App.WATER_Y) + 0.5, o.z, o.k === "frog" || o.k === "koi" ? 20 : 26, 4, true);
    for (const o of App.pondCrittersNear ? App.pondCrittersNear(tx, tz, 110) : []) consider(() => animalInfo(o), o.x, (o.y || App.WATER_Y) + 0.4, o.z, 20, 4, true);
    for (const b of App.birdSpots ? App.birdSpots() : []) if (b.shown) consider(() => birdInfo(b), b.x, b.y, b.z, 16, 4, true);
    for (const f of App.handThings || []) for (const k of f(tx, tz) || []) if (k.info) consider(k.info, k.x, k.y, k.z, k.r, 3, true);
    for (const F of App.ferries || []) if (F.live) consider(() => ferryInfo(F), F.live.x, App.WATER_Y + 1, F.live.z, 50, 5, true);
    for (const p of st.props) if (p.group.visible) consider(() => propInfo(p), p.x, p.group.position.y + Math.min(2, p.height / 2), p.z, 30, 8, false);
    for (const s of App.sceneryVisible) {
      if (s.building) continue; // (buildings and landmarks have their own card)
      consider(() => sceneryInfo(s), s.x, (s.y != null ? s.y : App.genHeight(s.x, s.z)) + (s.tree ? 2.4 : 0.8), s.z, s.tree ? 30 : 20, 12, false);
    }
    return best;
  };
  // the ground (or the water) the ray meets, when there is nothing else there
  App.inspectGround = (r) => {
    const v = App.pickVoxel(r), w = App.pickWater(r);
    if (w && (!v || w.distanceTo(r.origin) < v.point.distanceTo(r.origin) - 0.2) && !App.isLand(w.x, w.z)) return () => groundInfo(w.x, w.z, 0, true);
    if (v) return () => groundInfo(v.point.x, v.point.z, App.getBlock(v.x, v.y, v.z), false);
    return null;
  };

  // ---------- the window ----------
  let cur = null, timer = null, btns = [];
  function bar(label, f, col, right) {
    f = Math.max(0, Math.min(1, f || 0));
    return "<span>" + esc(label) + '</span><div class="bar"><i style="width:' + Math.round(f * 100) + "%;background:" + col + '"></i></div><span class="num">' + esc(right) + "</span>";
  }
  function render() {
    if (!cur) return;
    let I = null;
    try { I = cur(); } catch (e) { console.warn("inspect", e); }
    const el = $("placeCard");
    if (!I || !el) { close(); return; }
    let h = '<div class="pc-head"><div><div class="pc-name">' + esc(I.title) + '</div><div class="pc-sub">' + esc(I.sub || "") + '</div></div><button class="btn" id="inspClose" aria-label="Close">Close</button></div>';
    const bars = [];
    if (I.hp) { const f = I.hp.max > 0 ? I.hp.now / I.hp.max : 0; bars.push(bar("Health", f, f > 0.5 ? "#7be08f" : f > 0.2 ? "#ffd23f" : "#ff6b5e", I.hp.label || Math.max(0, Math.round(I.hp.now)) + " / " + Math.round(I.hp.max))); }
    for (const b of I.bars || []) bars.push(bar(b.label, b.v, b.col, Math.round(b.v * 100) + "%"));
    if (bars.length) h += '<div class="needs insp-bars' + (I.hp && I.hp.label ? " wide" : "") + '">' + bars.join("") + "</div>";
    if (I.chips && I.chips.length) h += '<div class="insp-chips">' + I.chips.map((c) => "<span>" + esc(c) + "</span>").join("") + "</div>";
    if (I.arms && I.arms.length) h += '<div class="insp-arms"><b>Arms</b> ' + I.arms.map(esc).join(" \u00b7 ") + "</div>";
    if (I.rows && I.rows.length) h += '<div class="kv">' + I.rows.map((r) => '<span class="k">' + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span>").join("") + "</div>";
    if (I.text) h += '<div class="pc-text">' + I.text + "</div>";
    btns = (I.buttons || []).concat(I.tickle != null && !I.isTickle ? [{ label: "Its Tickle", act: () => App.selectTickle && App.selectTickle(I.tickle) }] : []);
    if (btns.length) h += '<div class="insp-btns">' + btns.map((b, i) => '<button class="btn" data-ib="' + i + '">' + esc(b.label) + "</button>").join("") + "</div>";
    // only touch the page when something changed (so a button can be clicked while it refreshes)
    if (el.dataset.html !== h) { el.innerHTML = h; el.dataset.html = h; }
    el.classList.toggle("inside", !!App.inside);
    el.hidden = false;
  }
  function stop() { cur = null; clearInterval(timer); timer = null; const el = $("placeCard"); if (el) { delete el.dataset.insp; delete el.dataset.html; el.classList.remove("inside"); } }
  function close() { const was = !!cur; stop(); if (was) { const el = $("placeCard"); if (el) el.hidden = true; } }
  App.showInspect = (fn) => {
    stop();
    cur = fn;
    const el = $("placeCard"); if (el) el.dataset.insp = "1";
    const dc = $("doorChip"); if (dc) dc.hidden = true;
    render();
    timer = setInterval(() => { const e2 = $("placeCard"); if (!cur || !e2 || e2.hidden || !e2.dataset.insp) { stop(); return; } render(); }, 500);
  };
  App.inspectTickle = (id) => App.showInspect(() => tickleInfo(id));
  App.closeInspect = close;
  // a building's card takes the window over
  App.inspectYield = stop;
  document.addEventListener("click", (e) => {
    if (e.target.closest("#inspClose")) { close(); return; }
    const b = e.target.closest("[data-ib]");
    if (b && cur && btns[+b.dataset.ib]) btns[+b.dataset.ib].act();
  });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && cur && !(App.fpOn && App.fpOn())) close(); });
})();
