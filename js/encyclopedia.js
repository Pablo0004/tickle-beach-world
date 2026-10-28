/* The encyclopedia (Menu > Encyclopedia), the way a Pokedex works: every animal, bird, creature, monster, guardian,
 * dragon and sea beast of the world has a numbered entry, and an entry is filled in the first time you see that
 * one near you (in the open, or inside a cave, a mine or the Great Underworld; a guardian also when its floor is
 * first beaten). Until then it shows only its number and a dark shape. What is knowledge rather than something to
 * meet (weapons and shields, spells, relics, mounts and riding beasts, boats, ores, jobs, guilds, factions) is open
 * from the start. Every entry: its model, its number, what it is, where it lives or is found, health, attack,
 * defence, speed, type and what it is strong against, its ability, who can tame, ride or use it, price, and what
 * it drops or gives. What has been seen is kept in the saved game (st.dex). */
(function () {
  "use strict";
  const App = window.App, st = App.st, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const HABITAT = { falls: "waterfall hills", camp: "camps", pond: "duck ponds", beach: "beaches", pier: "piers", grove: "palm groves", meadow: "meadows" };

  // ---------- the entries ----------
  let ENTRIES = null;
  function build() {
    const E = [];
    const add = (cat, o) => E.push(Object.assign({ cat, no: E.length + 1 }, o));
    const C = App.CREATURES || {}, STRONG = App.CREATURE_STRONG || {};
    const strong = (t) => (STRONG[t] ? STRONG[t].join(", ") : "");
    const weakTo = (t) => Object.keys(STRONG).filter((k) => STRONG[k].includes(t)).join(", ");
    // animals of the farms and the wilds
    const FARM = { chicken: ["Chicken", "the hen yards of every village", "Lays the eggs the poultry keepers collect for the granary."], pig: ["Pig", "the pig pens", "Fattened by the pig breeders; food for the granary."], sheep: ["Sheep", "the sheepfolds, out grazing with the shepherd by day", "Led out to the meadows and back by its shepherd. Some Tickles ride a ram."], deer: ["Deer", "the hunting grounds: meadows, camps and waterfall hills", "Runs from Tickles; the hunters bring it down for the granary. Rangers and climbing guides ride stags."], boar: ["Boar", "the hunting grounds", "Charges and runs; a hunter's prize. Treasure hunters ride boars."] };
    for (const k in FARM) add("Creatures", { open: true,  id: "animal:" + k, model: [k, 0], name: FARM[k][0], what: FARM[k][2], where: FARM[k][1], seenBy: "animal" });
    // life on the water
    const WATER = { duck: ["Duck", "the duck ponds", "The on-chain duck of the Duck Pond floor: paddles about and waddles onto the bank; swims over to anyone feeding it.", null], fish: ["Fish", "the ponds", "The on-chain fish of the Waterfall floor, in its own colours and the collection's themes; jumps now and then.", null],
      swan: ["Swan", "the great lake, in pairs", "Keeps to its mate on the open water.", ["swan", 0]], turtle: ["Lake Turtle", "the great lake", "Dives, and comes up to bask.", ["turtle", 0]], frog: ["Frog", "the lily pads of the great lake", "Hops from pad to pad and croaks in bouts, more at night.", ["frog", 0]],
      heron: ["Heron", "the shallows of the great lake", "Stands still and strikes at frogs and fish that come close.", ["heron", 0]], otter: ["Otter", "the great lake", "Chases the koi.", ["otter", 0]], koi: ["Koi", "the great lake", "Jumps; the otters and herons hunt it.", ["koi", 0]] };
    for (const k in WATER) add("Creatures", { open: true,  id: "water:" + k, model: WATER[k][3], name: WATER[k][0], what: WATER[k][2], where: WATER[k][1], seenBy: "water" });
    // birds
    for (const b of App.BIRDS || []) add("Creatures", { open: true,  id: "bird:" + b.name, model: ["songbird", b.v], name: b.name, what: "Sings its " + b.song + (b.name === "Moon Owl" ? ", only at night." : b.name === "Sea Gull" ? ", wheeling over the open sea." : " from the trees near you; all the birds sing in one key, fullest at dawn."), where: b.name === "Sea Gull" ? "over the open sea" : "the trees", seenBy: "bird" });
    // the wild creatures
    for (const k in C) if (!C[k].monster) { const c = C[k]; add("Creatures", { open: true, id: "creature:" + k, model: [k, 0], name: c.name, what: "A wild creature of the " + c.type + " type. Tamers tame it, keep up to three, level them up and fight with them at the arenas.", where: (c.habitats || []).map((h) => HABITAT[h] || h).join(", "), hp: c.hp, atk: c.atk, def: c.def, spd: c.spd, type: c.type, strong: strong(c.type), weak: weakTo(c.type), ability: c.move, use: "Tamers can tame it", seenBy: "creature" }); }
    // the sea beasts
    const SB = App.SEA_BEASTS || {};
    for (const k in SB) add("Creatures", { id: "sea:" + k, model: null, name: cap(SB[k].name.replace(/^the /, "")), what: k === "serpent" ? "Rises from the great lake by a dock some afternoons, smashes the rowing boats and spits at whoever is by the water." : "Rises from the open sea off a beach some afternoons, smashes the boats and spits at whoever is on the shore.", where: k === "serpent" ? "the great lake" : "the open sea", hp: SB[k].hp, gives: "30 shells, 2 Ethernum and experience to every defender; a relic to the last blow", seenBy: "sea" });
    // the monsters (cave mouths, mines and the Great Underworld; most can be tamed)
    const M = App.MONSTERS || {};
    for (const k in C) if (C[k].monster) { const c = C[k], m = M[k]; add("Monsters", { id: "monster:" + k, model: [k, 0], name: c.name, what: m ? "Lurks at the mouths of the caves and attacks whoever comes near." : "Roams the mines and the floors of the Great Underworld.", where: m ? "the cave mouths" : "the Great Underworld and the mines", hp: c.hp, atk: c.atk, def: c.def, spd: c.spd, type: c.type, strong: strong(c.type), weak: weakTo(c.type), ability: c.move, use: "A tamer can win it over (never a guardian)", gives: m && m.xp ? m.xp + " experience to whoever beats it" : "Experience, and treasure on its floor", seenBy: "monster" }); }
    // the guardians of the Great Underworld
    (App.GUARDIANS || []).forEach((g, f) => add("Guardians", { id: "guardian:" + f, model: g.k ? [g.k, g.v || 0] : null, name: g.name ? cap(g.name) : "Guardian " + (f + 1), what: "The guardian of floor B" + (f + 1) + "F: the stairs down are sealed behind it until it is beaten. Special attacks, telegraphed by a red glow on the ground; enraged below a third of its health.", where: "B" + (f + 1) + "F of the Great Underworld", gives: f === (App.GUARDIANS.length - 1) ? "The Heart of the Chain to the first to beat it" : "The way down, treasure and experience", use: "Never tamed", seenBy: "guardian", floor: f }));
    // the dragons
    const DL = TB.KIT.dragon;
    for (const v of DL ? DL.variants : []) add("Dragons", { id: "dragon:" + v, model: ["dragon", v], name: (DL.variantLabel ? cap(DL.variantLabel(v)) : "Dragon") + " dragon", what: "Sleeps on the highest peak of its region, wings folded; flies a patrol twice a day, burns fields and steals food some evenings, and wakes in a rage when its sleep is broken.", where: "a lair on a region's highest peak", hp: 2000, ability: "Fire breath, claws and tail", use: "Fought by the armed and the tamers; the hand can drop it among the Tickles", gives: "A hoard of shells and Ethernum, and the name of dragon slayer to the last blow", seenBy: "dragon" });
    // arms
    for (const [n, w] of [["Sword", "A blade for the Guild and the militia."], ["Axe", "Heavy blows."], ["Spear", "The Night Watch's weapon; reaches further."], ["Hammer", "For the strongest."]]) add("Arms", { id: "arm:" + n, name: n, what: w + " Plain, fine steel (+25%) or masterwork (+50%). Wears from new to good, worn, very worn and about to break: worn arms hit less, look rusty and can break.", where: "the Blacksmiths' Guild of every region", price: "Fine steel 60 shells, masterwork 180 (a trade-in pays half)", use: "Fighters, the Watch, the militia", open: true });
    for (const [n, w] of [["Wooden shield", "The Night Watch's shield."], ["Steel shield", "Takes more of every blow."]]) add("Arms", { id: "arm:" + n, name: n, what: w + " Wears like the weapons.", where: "the Blacksmiths' Guild", price: n.startsWith("Steel") ? "45 shells" : "", use: "Fighters", open: true });
    // spells
    const SP = App.SPELLS || {};
    for (const k in SP) add("Spells", { id: "spell:" + k, name: SP[k].name, what: SP[k].heal ? "Mends a wounded friend." : ["venom", "dark", "gold", "stone"].includes(k) ? "Thrown by the guardians of the Great Underworld." : "Cast from a distance by the mages of the Mages' Guild.", use: ["venom", "dark", "gold", "stone"].includes(k) ? "Guardians" : SP[k].heal ? "Healers" : "Mages", open: true, colour: SP[k].color });
    // relics
    const RL = App.RELICS || {};
    for (const k in RL) add("Relics", { id: "relic:" + k, name: RL[k].name, what: "A relic that makes its bearer stronger (x" + (RL[k].bonus || 1).toFixed(2) + "). At most six per Tickle.", where: k === "heartofchain" || /heart/i.test(RL[k].name) ? "the Golden Tickle" : /serpent|kraken/i.test(RL[k].name) ? "a sea beast's last blow" : /comb|bell|pearl/i.test(RL[k].name) ? "the dive sites" : "the floors of the Great Underworld", open: true });
    // mounts and boats
    const W = App.WEALTH || {};
    for (const m of (W.mount || []).filter(Boolean)) add("Mounts", { id: "mount:" + m.short, model: [m.kind === "griffin" ? "griffinmount" : "horse", m.kind === "griffin" ? 0 : Math.max(0, (W.mount || []).indexOf(m) - 1)], name: m.short, what: "Ridden on long trips: " + (m.kind === "griffin" ? "it flies straight over everything" : "at a trot") + ", " + m.mul + " times walking speed. Waits beside its rider and sleeps by its house.", where: "the paddock or the roost of the Blacksmiths' Guild", price: m.price + " shells", spd: m.mul, open: true });
    for (const k in W.beast || {}) { const b = W.beast[k]; add("Mounts", { id: "beast:" + k, model: [k, 0], name: b.short, what: "A riding beast, " + b.mul + " times walking speed.", where: "the guild's paddock", price: b.price + " shells", spd: b.mul, open: true }); }
    for (const b of (W.boat || []).filter(Boolean)) add("Boats", { id: "boat:" + b.short, model: [b.kind, 0], name: b.short, what: "Moored in the marina beside a dock; some afternoons its owner takes it out on the lake.", where: "the marinas", price: b.price + " shells", open: true });
    // ores, jobs, guilds, factions
    const OR = App.ORES || {};
    for (const k in OR) add("Ores", { id: "ore:" + k, name: OR[k], what: { stone: "Speeds up rebuilding.", coal: "Feeds the smith's forge.", copper: "Tools: the whole village works faster.", iron: "Weapons and shields.", silver: "Silver-tipped weapons that monsters fear.", gold: "Sold for shells and offered to the Maker.", gems: "Collars that make creatures stronger.", orichalcum: "The legendary metal of the Orichalcum Blade." }[k] || "", where: "the mines" + (k === "orichalcum" ? " (deep veins)" : ""), open: true });
    add("Ores", { id: "ore:ethernum", name: "Ethernum", what: "Crystals of Ether that power creature magic; an adventurer can burn one to light the way.", where: "Ether fields, the dungeons, dragon hoards, the drowned temples, prayers", open: true });
    for (const k in App.JOB_INFO || {}) add("Jobs", { id: "job:" + k, name: App.JOB_INFO[k].title, what: "A Tickle who " + App.JOB_INFO[k].verb.replace(/^is /, "is ") + ".", where: [].concat(App.JOB_INFO[k].place).join(", "), open: true });
    for (const k in App.GUILDS || {}) add("Guilds", { id: "guild:" + k, name: App.GUILDS[k].name, what: App.GUILDS[k].text || "One of the six guilds, with a hall in every region's Guild Quarter; ranks from Novice to Grandmaster.", where: "the Guild Quarters", open: true });
    for (const k in App.FACTIONS || {}) add("Factions", { id: "faction:" + k, name: App.FACTIONS[k].name || cap(k), what: App.FACTIONS[k].text || App.FACTIONS[k].what || "", open: true });
    // war (war.js): the units of an army, its formations, and what a fortress fights with
    const WU = App.WAR_UNITS || {}, WF = App.WAR_FORMATIONS || {}, UM = { cavalry: ["horse", 2], griffin: ["griffinmount", 0] };
    for (const k in WU) add("War", { id: "unit:" + k, model: UM[k] || null, name: WU[k].name, what: WU[k].what + " Strength x" + WU[k].p.toFixed(1) + " in battle.", where: "every holder's army: up to fifty soldiers, led by a general", open: true });
    for (const k in WF) add("War", { id: "formation:" + k, name: "Formation: " + WF[k].name, what: WF[k].what, where: "on the march and in battle", open: true });
    add("War", { id: "war:armoury", model: ["armoury", 0], name: "Armoury", what: "Keeps the arms taken in wars; in a war it arms that many more of the place's people.", where: "inside the walls of the fortresses and in the great estates", hp: 900, open: true });
    add("War", { id: "war:catapult", model: ["catapult", 0], name: "Catapult", what: "Throws stones over the walls at the besiegers.", where: "inside the walls of the fortresses, between the gates", hp: 300, open: true });
    add("War", { id: "war:tower", model: ["walltower", 0], name: "Wall Tower", what: "Its archers shoot at the attackers who come near the walls.", where: "along the walls of the fortresses", hp: 2500, open: true });
    add("War", { id: "war:traps", name: "Traps", what: "Hidden behind the gate: they catch the first attackers through when it breaks.", where: "behind the gates of the fortresses", open: true });
    add("War", { id: "war:stars", name: "Stars", what: "A battle is scored as in Clash of Clans: one star when half the place is destroyed (every building but the stretches of wall), one for its castle or hall, one for all of it. Three stars win at once; two at the end of a day of battle; after five days one star still wins. Loot: three stars, everything and the place; two, everything but the place; one, half the granary, ores and shells.", where: "every war", open: true });
    add("War", { id: "war:gate", model: ["gatehouse", 0], name: "Castle Gate", what: "Its great gate opens by day and shuts at night and in a war; besiegers must break it to go in.", where: "the walls of the fortresses", hp: 3000, open: true });
    return E;
  }
  const entries = () => ENTRIES || (ENTRIES = build());
  const dex = () => st.dex || (st.dex = {});
  const isSeen = (e) => !!(e.open || dex()[e.id]);
  App.dexSee = (id) => { if (!id || dex()[id]) return; dex()[id] = st.T || 1; const e = entries().find((x) => x.id === id); if (e && App.toast) App.toast("New in the encyclopedia: #" + String(e.no).padStart(3, "0") + " " + e.name); };

  // ---------- seeing things: every two seconds, what is near the view ----------
  let lastScan = 0;
  App.dexScan = () => {
    const now = performance.now();
    if (now - lastScan < 2000 || !App.cam) return;
    lastScan = now;
    if (App.cam.radius > 95) return; // too far up to make anything out
    const tx = App.cam.target.x, tz = App.cam.target.z, R = 45;
    for (const a of App.animalsNear ? App.animalsNear(tx, tz, R) : []) App.dexSee("animal:" + (a.kind || a.k));
    for (const o of App.lakeAnimalsNear ? App.lakeAnimalsNear(tx, tz, R) : []) if (o.k && o.k !== "lilypad" && o.k !== "cattail" && o.k !== "seaweed") App.dexSee("water:" + o.k);
    for (const o of App.pondCrittersNear ? App.pondCrittersNear(tx, tz, R) : []) App.dexSee("water:" + (o.k || o.kind || (o.duck ? "duck" : "fish")));
    for (const b of App.birdSpots ? App.birdSpots() : []) if (b.shown && Math.abs(b.x - tx) + Math.abs(b.z - tz) < R * 1.5) App.dexSee("bird:" + b.kind);
    for (const b of App.creatureBodiesNear ? App.creatureBodiesNear(tx, tz, R) : []) { const c = App.CREATURES && App.CREATURES[b.sp]; if (c) App.dexSee((c.monster ? "monster:" : "creature:") + b.sp); }
    for (const m of App.monstersNear ? App.monstersNear(tx, tz, R) : []) App.dexSee("monster:" + m.kind);
    for (const d of App.dragonObjects ? App.dragonObjects.values() : []) if (Math.abs(d.x - tx) + Math.abs(d.z - tz) < R * 2) App.dexSee("dragon:" + d.lair.look);
    if (App.seaBeastNear) { const k = App.seaBeastNear(tx, tz, R * 2); if (k) App.dexSee("sea:" + k); }
    if (App.insideMonsters) for (const mo of App.insideMonsters()) { if (mo.boss && mo.floor != null) App.dexSee("guardian:" + mo.floor); else App.dexSee("monster:" + mo.k); }
    if (st.guardians) for (const f in st.guardians) App.dexSee("guardian:" + f);
  };

  // ---------- the models: a small picture of each, made once ----------
  const thumbs = new Map();
  let R3 = null, scene = null, cam = null;
  function thumb(model) {
    const key = model[0] + ":" + model[1];
    if (thumbs.has(key)) return thumbs.get(key);
    const p = (async () => {
      if (!TB.KIT[model[0]] || !App.kitMesh) return null;
      const mk = await App.kitMesh(model[0], model[1]);
      if (!R3) {
        R3 = new THREE.WebGLRenderer({ canvas: document.createElement("canvas"), antialias: true, alpha: true, preserveDrawingBuffer: true });
        R3.setSize(160, 120); R3.outputEncoding = THREE.sRGBEncoding;
        scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xffffff, 0x556655, 1.0));
        const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3, 6, 4); scene.add(dl);
        cam = new THREE.PerspectiveCamera(30, 4 / 3, 0.05, 500);
      }
      const m = App.centeredMesh(mk.md, mk.geo, false), g = new THREE.Group();
      g.add(m); g.rotation.y = 0.6; scene.add(g);
      const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z);
      cam.position.set(c.x + r * 0.9, c.y + r * 0.55, c.z + r * 1.9); cam.lookAt(c);
      R3.render(scene, cam);
      const url = R3.domElement.toDataURL("image/png");
      scene.remove(g);
      return url;
    })().catch(() => null);
    thumbs.set(key, p);
    return p;
  }

  // ---------- the page ----------
  let cat = "All", open = null;
  App.renderEncyclopedia = () => {
    const el = $("menu-encyclopedia");
    if (!el) return;
    const E = entries(), cats = ["All"].concat([...new Set(E.map((e) => e.cat))]);
    const seenN = E.filter(isSeen).length;
    const list = E.filter((e) => cat === "All" || e.cat === cat);
    let h = '<div class="dex"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><h3 style="margin:0">Encyclopedia</h3><span class="note">' + seenN + " of " + E.length + " entries filled in. Monsters, guardians, dragons and sea beasts are filled in the first time you see them near you.</span></div>";
    h += '<div class="seg dexcats" role="group" aria-label="Encyclopedia sections" style="flex-wrap:wrap">' + cats.map((c) => '<button data-dexcat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + "</button>").join("") + "</div>";
    if (open) {
      const e = E.find((x) => x.id === open), s = isSeen(e);
      h += '<div class="dexentry"><button class="btn" data-dexback="1">\u2190 Back</button><div class="row" style="gap:12px;align-items:flex-start;flex-wrap:wrap;margin-top:8px">' +
        '<img class="dexpic" data-dexpic="' + esc(e.id) + '" alt="" style="width:240px;height:180px;' + (s ? "" : "filter:brightness(0)") + '">' +
        '<div style="flex:1;min-width:220px"><h3 style="margin:0">#' + String(e.no).padStart(3, "0") + " " + (s ? esc(e.name) : "???") + '</h3><p class="note">' + esc(e.cat) + "</p>";
      if (!s) h += "<p>Not seen yet. Go near one to fill in this entry.</p>";
      else {
        h += "<p>" + esc(e.what || "") + "</p><div class=\"kv\">";
        const row = (k, v) => (v == null || v === "" ? "" : '<span class="k">' + esc(k) + "</span><span>" + esc(v) + "</span>");
        h += row("Where", e.where) + row("Health", e.hp) + row("Attack", e.atk) + row("Defence", e.def) + row("Speed", e.spd) + row("Type", e.type) + row("Strong against", e.strong) + row("Weak against", e.weak) + row("Ability", e.ability) + row("Who", e.use) + row("Price", e.price) + row("Drops / gives", e.gives);
        h += "</div>";
      }
      h += "</div></div></div>";
    } else {
      h += '<div class="dexgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:8px">' + list.map((e) => {
        const s = isSeen(e);
        return '<button class="dexcard" data-dexopen="' + esc(e.id) + '" style="display:flex;flex-direction:column;align-items:center;padding:6px;border-radius:10px;border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.08);cursor:pointer">' +
          (e.model ? '<img data-dexpic="' + esc(e.id) + '" alt="" style="width:96px;height:72px;' + (s ? "" : "filter:brightness(0)") + '">' : '<div style="width:96px;height:72px;display:flex;align-items:center;justify-content:center;font-size:28px;opacity:.5">' + (e.colour ? '<span style="color:' + esc(e.colour) + '">\u2726</span>' : "\u25c6") + "</div>") +
          '<span class="note">#' + String(e.no).padStart(3, "0") + "</span><b style=\"font-size:12px;text-align:center\">" + (s ? esc(e.name) : "???") + "</b></button>";
      }).join("") + "</div>";
    }
    h += "</div>";
    el.innerHTML = h;
    // the pictures, as they are made
    for (const img of el.querySelectorAll("[data-dexpic]")) {
      const e = E.find((x) => x.id === img.dataset.dexpic);
      if (e && e.model) thumb(e.model).then((url) => { if (url && img.isConnected) img.src = url; });
    }
  };
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-dexcat],[data-dexopen],[data-dexback]");
    if (!b || !b.closest("#menu-encyclopedia")) return;
    if (b.dataset.dexcat) { cat = b.dataset.dexcat; open = null; }
    else if (b.dataset.dexopen) open = b.dataset.dexopen;
    else open = null;
    App.renderEncyclopedia();
  });
  setInterval(() => { try { App.dexScan(); } catch (e) { /* the world not ready yet */ } }, 2000);
})();
