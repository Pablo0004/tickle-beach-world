/* Creatures: seven invented fantasy animals (none of them a Tickle species) that live wild in their
 * habitats. Tamers among the Tickles go out to tame them, keep up to three, walk about with their
 * favourite, and battle with them: type against type, turn by turn, gaining experience and levels.
 * Every region has an arena with a tournament each evening. Off screen the same things happen in a
 * simplified way. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const rnd = Math.random, hash2 = App.hash2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  // ---------- species and types ----------
  const SPECIES = (App.CREATURES = {
    griffin: { name: "Griffin", type: "Air", hp: 46, atk: 12, def: 8, spd: 12, habitats: ["falls"], move: "Gust", nick: ["Talon", "Skye", "Breeze", "Pip"] },
    cinderling: { name: "Cinderling", type: "Fire", hp: 38, atk: 13, def: 6, spd: 11, habitats: ["camp"], move: "Ember Burst", nick: ["Ember", "Sparky", "Ash", "Toasty"] },
    bubblefin: { name: "Bubblefin", type: "Water", hp: 44, atk: 10, def: 9, spd: 8, habitats: ["pond", "beach", "pier"], move: "Bubble Jet", nick: ["Splash", "Puddle", "Bloop", "Wave"] },
    mossling: { name: "Mossling", type: "Nature", hp: 48, atk: 9, def: 10, spd: 6, habitats: ["grove", "meadow"], move: "Leaf Swirl", nick: ["Sprout", "Moss", "Twig", "Clover"] },
    pebblit: { name: "Pebblit", type: "Earth", hp: 54, atk: 10, def: 13, spd: 4, habitats: ["falls", "camp"], move: "Rock Slam", nick: ["Rocky", "Pebble", "Boulder", "Grit"] },
    zapbug: { name: "Zapbug", type: "Spark", hp: 36, atk: 12, def: 6, spd: 14, habitats: ["meadow", "grove"], move: "Zap Bolt", nick: ["Buzz", "Volt", "Zippy", "Fizz"] },
    lumoth: { name: "Lumoth", type: "Mystic", hp: 40, atk: 11, def: 8, spd: 10, habitats: ["grove", "pond"], move: "Moon Dust", nick: ["Luna", "Glim", "Dusk", "Wisp"], hover: 0.7 },
  });
  const KINDS = Object.keys(SPECIES);
  // the monsters of the Great Underworld, the mines and the cave mouths can be tamed too: by a tamer in a party
  // that clears their floor, by a tamer working the mine, or by one out near a cave (never a guardian). Once tamed
  // they are creatures like any other: they follow their tamer about and fight in the arena with their type and move.
  // [name, type, hp, atk, def, spd, move, nicknames, hover]
  const MONSTER_SPECIES = {
    gloomslime: ["Gloomslime", "Water", 44, 9, 9, 7, "Slime Splash", ["Goo", "Blob", "Wobbles", "Ooze"]],
    shadebat: ["Shadebat", "Air", 36, 11, 6, 14, "Shadow Swoop", ["Flap", "Nyx", "Echo", "Squeak"], 1.3],
    brutecap: ["Brutecap", "Nature", 54, 12, 11, 5, "Spore Slam", ["Shroom", "Cap", "Stomp", "Fungo"]],
    goblin: ["Goblin", "Earth", 42, 11, 8, 11, "Club Swing", ["Grub", "Snik", "Nob", "Rusty"]],
    kobold: ["Kobold", "Fire", 40, 12, 7, 12, "Spear Jab", ["Kip", "Scales", "Yip", "Torch"]],
    skeleton: ["Skeleton", "Mystic", 42, 12, 8, 9, "Bone Throw", ["Rattles", "Bones", "Clack", "Femur"]],
    mummy: ["Mummy", "Mystic", 50, 11, 10, 6, "Bandage Wrap", ["Wraps", "Dusty", "Pharaoh", "Linen"]],
    spider: ["Cave Spider", "Nature", 40, 12, 7, 13, "Web Shot", ["Silk", "Webby", "Eight", "Fang"]],
    basilisk: ["Basilisk", "Nature", 52, 14, 10, 9, "Stone Gaze", ["Scaly", "Gaze", "Hiss", "Coil"]],
    harpy: ["Harpy", "Air", 44, 14, 7, 14, "Talon Dive", ["Shriek", "Feather", "Gale", "Plume"]],
    werewolf: ["Werewolf", "Earth", 56, 15, 10, 12, "Howl Slash", ["Moony", "Howl", "Shaggy", "Claw"]],
    centaur: ["Centaur", "Air", 54, 14, 10, 13, "Arrow Volley", ["Hooves", "Archer", "Swift", "Mane"]],
    golem: ["Golem", "Earth", 70, 13, 16, 3, "Boulder Fist", ["Rubble", "Granite", "Slab", "Cobble"]],
    salamander: ["Salamander", "Fire", 48, 15, 8, 12, "Flame Tongue", ["Blaze", "Cinder", "Scorch", "Flick"]],
    troll: ["Troll", "Earth", 72, 16, 13, 5, "Club Smash", ["Grumble", "Mossy", "Bonk", "Lump"]],
    ogre: ["Ogre", "Earth", 74, 16, 12, 4, "Belly Slam", ["Chomp", "Lumpy", "Gronk", "Biggs"]],
    manticore: ["Manticore", "Fire", 60, 17, 11, 12, "Tail Sting", ["Sting", "Roar", "Spike", "Barb"]],
    wraith: ["Wraith", "Mystic", 50, 17, 8, 13, "Soul Chill", ["Wisp", "Shade", "Hush", "Gloom"], 1.0],
    cerberus: ["Cerberus", "Fire", 66, 17, 12, 12, "Triple Bite", ["Spot", "Trio", "Bark", "Ruff"]],
    minotaur: ["Minotaur", "Earth", 70, 18, 13, 8, "Horn Charge", ["Horns", "Maze", "Toro", "Charger"]],
  };
  for (const k in MONSTER_SPECIES) { const [name, type, hp, atk, def, spd, move, nick, hover] = MONSTER_SPECIES[k]; SPECIES[k] = { name, type, hp, atk, def, spd, habitats: [], move, nick, monster: true, hover }; }
  App.MONSTER_TAMABLE = Object.keys(MONSTER_SPECIES);
  // the tamed monsters big enough to carry their tamer on long trips (wealth.js): their size (at heel and under the
  // rider alike), the height of the seat on the back or the shoulders and where along the body it is (SDF units,
  // before scaling), and how much faster than walking they go. The rest come along at a companion's size.
  App.MOUNT_MONSTERS = {
    werewolf: { s: 1.1, back: 466, dz: -68, mul: 2.4, biped: true },
    centaur: { s: 1.15, back: 317, dz: -190, mul: 2.6 },
    golem: { s: 0.85, back: 688, dz: 0, mul: 1.7, biped: true },
    troll: { s: 0.85, back: 678, dz: -40, mul: 1.8, biped: true },
    ogre: { s: 0.75, back: 794, dz: -40, mul: 1.8, biped: true },
    minotaur: { s: 0.75, back: 777, dz: -40, mul: 2.1, biped: true },
    manticore: { s: 0.95, back: 414, dz: 0, mul: 2.5 },
    cerberus: { s: 1.1, back: 351, dz: -40, mul: 2.5 },
    basilisk: { s: 1.7, back: 128, dz: 0, mul: 2.0 },
    salamander: { s: 1.8, back: 178, dz: -100, mul: 2.3 },
    spider: { s: 1.2, back: 305, dz: -100, mul: 2.4 },
  };
  const TYPE_COL = (App.CREATURE_TYPE_COL = { Fire: "#ff7a2f", Water: "#2f8fe0", Nature: "#3cbf6c", Earth: "#9a6b45", Spark: "#ffd23f", Air: "#d9eefc", Mystic: "#c9a6ff" });
  // what each type is strong against (x1.6); the reverse is weak (x0.65)
  const STRONG = (App.CREATURE_STRONG = { Fire: ["Nature", "Spark"], Water: ["Fire", "Earth"], Nature: ["Water", "Earth"], Earth: ["Spark", "Fire"], Spark: ["Water", "Air"], Air: ["Nature", "Mystic"], Mystic: ["Air", "Water"] });
  const typeMult = (a, b) => (STRONG[a].includes(b) ? 1.6 : STRONG[b].includes(a) ? 0.65 : 1);
  App.creatureStats = (c) => { const B = SPECIES[c.sp], k = 1 + (c.lvl - 1) * 0.12, g = c.gem ? 1.15 : 1; return { hp: Math.round(B.hp * k + c.lvl * 4), atk: B.atk * k * g, def: B.def * k * g, spd: B.spd + c.lvl * 0.3 }; }; // a gem collar from the mine makes it stronger
  const xpNeed = (lvl) => 18 + lvl * 12;
  function gainXP(c, xp) {
    c.xp = (c.xp || 0) + xp;
    let up = false;
    while (c.xp >= xpNeed(c.lvl) && c.lvl < 40) { c.xp -= xpNeed(c.lvl); c.lvl++; up = true; }
    return up;
  }
  App.creatureTrain = (c, xp) => gainXP(c, xp);
  App.creatureLabel = (c) => (c.nick ? c.nick + " the " : "") + SPECIES[c.sp].name + " Lv " + c.lvl;

  // ---------- who tames ----------
  App.isTamer = (id) => hash2(id, 61, 3) < 0.3 || !!(st.tamed && st.tamed[id] && st.tamed[id].length > 0);
  App.creaturesOf = (id) => (st.tamed && st.tamed[id]) || [];
  App.leadCreature = (id) => (st.tamed && st.tamed[id] && st.tamed[id][0]) || null;
  let cuid = 1;
  function newCreature(sp, lvl, owner, seed) {
    const B = SPECIES[sp];
    return { uid: "c" + (cuid++).toString(36), sp, lvl, xp: 0, nick: B.nick[Math.floor(hash2(seed, 7, 9) * B.nick.length)], owner, wins: 0, losses: 0, caught: st.T };
  }
  // which species live around a place type
  const bySite = {};
  for (const k of KINDS) for (const h of SPECIES[k].habitats) (bySite[h] = bySite[h] || []).push(k);
  function speciesFor(type, seed) { const list = bySite[type]; return list ? list[Math.floor(hash2(seed, 3, 11) * list.length)] : null; }
  // the closest creature habitat to a Tickle's home
  App.tamingSpot = (id) => {
    const P = App.pop, hx = P.home[2 * id], hz = P.home[2 * id + 1];
    const list = App.poisNear(hx, hz, 180, (p) => !!bySite[p.type] && !(App.lairNear && App.lairNear(p.x, p.z, 70))).sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz));
    const p = list[Math.floor(hash2(id, Math.floor(st.T / 1440), 65) * Math.min(3, list.length))];
    return p ? { x: p.spot ? p.spot.x : p.x, z: p.spot ? p.spot.z : p.z, label: "the " + p.name + " near " + App.nearestVillage(p.x, p.z).name + " (taming creatures)", poi: p.i, type: p.type } : null;
  };

  // ---------- start of the world, saving ----------
  App.initCreatures = (saved) => {
    st.tamed = (saved && saved.tamed) || null;
    st.tourneys = (saved && saved.tourneys) || {};
    st.champs = (saved && saved.champs) || {};
    if (saved && saved.cuid) cuid = saved.cuid;
    if (!st.tamed) {
      // some tamers already have a creature from the wild nearby
      st.tamed = {};
      for (let id = 0; id < TB.SUPPLY; id++) {
        if (hash2(id, 61, 3) >= 0.3 || hash2(id, 62, 3) > 0.45) continue;
        const spot = App.tamingSpot(id);
        const sp = spot ? speciesFor(spot.type, id) : KINDS[id % KINDS.length];
        if (sp) st.tamed[id] = [newCreature(sp, 1 + Math.floor(hash2(id, 63, 3) * 4), id, id)];
      }
    }
  };
  App.saveCreatures = () => ({ tamed: st.tamed, tourneys: st.tourneys, champs: st.champs, cuid });
  // a monster tamed: it goes to the front, so it walks about with its tamer (a tamer keeps three at most)
  App.tameMonster = (id, kind, lvl) => {
    if (!SPECIES[kind] || !SPECIES[kind].monster || !TB.KIT[kind]) return null;
    const list = (st.tamed[id] = st.tamed[id] || []);
    if (list.length >= 3) return null;
    const c = newCreature(kind, Math.max(1, Math.min(40, lvl || 1)), id, id * 31 + Math.floor(st.T));
    list.unshift(c);
    return c;
  };
  App.tamedMonsters = () => { let n = 0; for (const id in st.tamed) for (const c of st.tamed[id]) if (SPECIES[c.sp] && SPECIES[c.sp].monster) n++; return n; };

  // ---------- 3D bodies: wild ones around their habitats, and each tamer's favourite at heel ----------
  const geo = {}, meshes = {}, CAP = 160;
  const wild = new Map(); // poi index -> [bodies]
  const pets = new Map(); // agent id -> body
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  function makeGeo(k, md) {
    const g = App.makeVoxMesh(md).geometry, box = App.meshBox(md), h = box.max.y - box.min.y;
    let local = new THREE.Matrix4().compose(new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - box.min.y, md.origin[2] * S - (box.min.z + box.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
    // a tamed monster comes along at a companion's size, no taller than a Tickle's shoulder; one big enough to ride
    // at the size it carries its tamer
    const s = SPECIES[k].monster ? (App.MOUNT_MONSTERS[k] ? App.MOUNT_MONSTERS[k].s : Math.min(1, 2.3 / Math.max(0.5, h))) : 1;
    if (s < 1) local = new THREE.Matrix4().makeScale(s, s, s).multiply(local);
    geo[k] = { geo: g, local, h: h * s };
    const m = new THREE.InstancedMesh(g, App.voxMaterial, CAP);
    m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
    App.scene.add(m);
    meshes[k] = m;
  }
  App.loadCreatures = async () => {
    await Promise.all(KINDS.map(async (k) => {
      const K = TB.KIT[k];
      const r = await App.job("compact", { strokes: K.build(0), voxel: App.liveVoxel ? App.liveVoxel(k, K.voxel[0]) : K.voxel[0], lip: 1.5 });
      makeGeo(k, r.mesh);
    }));
  };
  // the monsters' bodies are made the first time one is needed
  const loadingGeo = new Set();
  function ensureGeo(k) {
    if (geo[k] || loadingGeo.has(k) || !TB.KIT[k] || !SPECIES[k]) return;
    loadingGeo.add(k);
    const K = TB.KIT[k];
    App.job("compact", { strokes: K.build(K.variants[0]), voxel: App.liveVoxel ? App.liveVoxel(k, K.voxel[0]) : K.voxel[0], lip: 1.5 }).then((r) => makeGeo(k, r.mesh)).catch(() => {});
  }
  function body(sp, x, z, data, isWild) {
    return { sp, x, z, y: App.genHeight(x, z), h: rnd() * 6.28, t: null, wait: rnd() * 3, wob: rnd() * 6, data, wild: isWild, gone: 0, faint: 0, lx: 0, lz: 0 };
  }
  App.updateCreatureSet = () => {
    if (!geo.griffin) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, R = App.RANGE.scenery * 0.7;
    const keep = new Set();
    for (const p of App.poisNear(tx, tz, R, (q) => !!bySite[q.type])) {
      keep.add(p.i);
      if (wild.has(p.i)) continue;
      const list = [], n = 1 + Math.floor(hash2(p.i, 5, 71) * 3);
      for (let k = 0; k < n; k++) {
        const sp = speciesFor(p.type, p.i * 7 + k);
        if (!sp || !App.kitOn(sp)) continue;
        // further from the middle of the map, the wild ones are stronger
        const lvl = 1 + Math.floor(hash2(p.i, k, 73) * 4 + Math.hypot(p.x, p.z) / 260);
        const a = hash2(p.i, k, 75) * 6.28, d = 4 + hash2(p.i, k, 77) * 8;
        const b = body(sp, p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, { sp, lvl, xp: 0, wild: true }, true);
        b.home = { x: p.x, z: p.z, r: p.lake ? p.lake.r + 6 : 12 };
        list.push(b);
      }
      wild.set(p.i, list);
    }
    for (const k of [...wild.keys()]) if (!keep.has(k)) wild.delete(k);
    // pets come with their owners
    for (const t of st.tickles) {
      const c = App.leadCreature(t.id);
      if (!c || !App.kitOn(c.sp)) { pets.delete(t.id); continue; }
      const p = pets.get(t.id);
      if (!p || p.data !== c) pets.set(t.id, Object.assign(body(c.sp, t.pos.x + 1, t.pos.z + 1, c, false), { owner: t.id }));
    }
    for (const id of [...pets.keys()]) if (!App.pop.agent[id]) pets.delete(id);
  };
  App.wildNear = (x, z, R) => {
    let best = null, bd = R;
    for (const list of wild.values()) for (const b of list) {
      if (b.gone > st.T || b.busy || (SPECIES[b.sp].hover && !App.isNight && b.sp === "lumoth" && false)) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  };
  App.petOf = (id) => pets.get(id) || null;
  App._wildDebug = () => [...wild.entries()].map(([k, l]) => [k, App.pois[k].type, l.length, l.map((b) => b.sp + (b.gone > st.T ? "(gone)" : ""))]);
  App.creatureBodiesNear = (x, z, R) => { const out = []; for (const list of wild.values()) for (const b of list) if (b.gone <= st.T && Math.abs(b.x - x) + Math.abs(b.z - z) < R) out.push(b); for (const b of pets.values()) if (Math.abs(b.x - x) + Math.abs(b.z - z) < R) out.push(b); return out; };

  const isLand = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) >= App.SEA;
  function moveTo(b, tx, tz, sp, dm) {
    const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const step = Math.min(d, sp * dm), nx = b.x + (dx / d) * step, nz = b.z + (dz / d) * step;
    // (never into a building, wild or a pet: a pet waits outside while its Tickle is in)
    if (App.buildingBlocks && App.buildingBlocks(b.x, b.z, nx, nz)) { /* stays */ }
    else if (isLand(nx, nz) && App.climbOK(b.x, b.z, nx, nz)) { b.x = nx; b.z = nz; b.wob += step * 6; }
    else if (!b.wild) { b.x = nx; b.z = nz; } // a pet keeps up with its owner whatever the ground
    b.h = turnTo(b.h, Math.atan2(dx, dz), Math.min(1, dm * 6));
    return d - step;
  }
  function turnTo(h, t, k) { let d = t - h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return h + d * k; }
  // wild creatures that hunt game, and how fast they run doing it (cells per game minute)
  const HUNTS = { griffin: 4.2, cinderling: 3.6, zapbug: 3.9 };
  function stepBody(b, dm) {
    if (b.held || b.flying || b.battle) return;
    if (!b.wild) {
      // at heel: behind its owner's right shoulder; by the door while the owner is indoors
      const t = App.pop.agent[b.data.owner];
      if (!t) return;
      // sent in against a dragon: run up to it and strike again and again
      if (t.action && t.action.kind === "command" && App.dragonFight && App.dragonFight(t.action.dragon)) {
        const D = t.action.dragon, ang = Math.atan2(t.pos.z - D.z, t.pos.x - D.x), r = 7.5;
        if (moveTo(b, D.x + Math.cos(ang) * r, D.z + Math.sin(ang) * r, 5, dm) < 0.8) {
          b.h = Math.atan2(D.x - b.x, D.z - b.z);
          if (!(b.nextHit > st.T)) {
            b.nextHit = st.T + 1.2 + rnd() * 0.6;
            const s = App.creatureStats(b.data), B = SPECIES[b.data.sp];
            const spell = App.tryCast && App.tryCast(t.id, 0.25);
            if (spell) { App.say(t, (b.data.nick || B.name) + ", " + App.spellOf(B.type) + "!", 2); for (let k = 0; k < 40; k++) App.spawnParticle({ kind: "spark", x: D.x, y: D.y + 2 + rnd() * 3, z: D.z, vx: (rnd() - 0.5) * 9, vy: 2 + rnd() * 5, vz: (rnd() - 0.5) * 9, age: -k * 0.005, life: 0.9, color: new THREE.Color(TYPE_COL[B.type]) }); }
            App.hitDragon(D, t, s.atk * (0.25 + rnd() * 0.15) * (spell ? 2.5 : 1) * (App.heroPower ? App.heroPower(t.id) : 1), TYPE_COL[B.type]);
          }
        }
        return;
      }
      // drills at the arena: laps round its tamer
      if (t.step && t.step.k === "train" && t.action && t.action.kind === "do" && t.action.phase === "doing") {
        const w = performance.now() / 650 + b.data.owner;
        moveTo(b, t.pos.x + Math.sin(t.heading) * 2.6 + Math.cos(w) * 1.8, t.pos.z + Math.cos(t.heading) * 2.6 + Math.sin(w) * 1.8, 4.5, dm);
        return;
      }
      const inside = !t.group.visible;
      const ox = inside ? t.home.x + 1.2 : t.pos.x - Math.sin(t.heading) * 1.4 + Math.cos(t.heading) * 0.9, oz = inside ? t.home.z + 0.6 : t.pos.z - Math.cos(t.heading) * 1.4 - Math.sin(t.heading) * 0.9;
      const d = Math.hypot(ox - b.x, oz - b.z);
      if (d > 18) { b.x = ox; b.z = oz; }
      else if (d > 0.4) moveTo(b, ox, oz, d > 4 ? 4.2 : 2.2, dm);
      return;
    }
    if (b.busy) return;
    // the hunters among the wild creatures go after deer and boar now and then; a deer can outrun them for a while
    const hs = HUNTS[b.data.sp];
    if (hs && b.prey) {
      const p = b.prey;
      if (p.gone > st.T || p.held || p.flying || Math.hypot(p.x - b.x, p.z - b.z) > 30 || Math.hypot(p.x - b.home.x, p.z - b.home.z) > b.home.r + 40) { p.chasedBy = null; b.prey = null; b.wait = 4; return; }
      p.chasedBy = b;
      if (moveTo(b, p.x, p.z, hs, dm) < 0.9) {
        if (rnd() < 0.55 && App.catchPrey(p)) {
          for (let k = 0; k < 30; k++) App.spawnParticle({ kind: "spark", x: p.x, y: p.y + 0.8, z: p.z, vx: (rnd() - 0.5) * 4, vy: 1 + rnd() * 3, vz: (rnd() - 0.5) * 4, age: -k * 0.01, life: 0.8, color: new THREE.Color(TYPE_COL[SPECIES[b.data.sp].type]) });
          const cam = App.cam.target;
          if (Math.hypot(p.x - cam.x, p.z - cam.z) < 45 && navigator.userActivation && navigator.userActivation.hasBeenActive) App.sfx.animal(b.data.sp, 0.5, "amb");
          b.wait = 25; // eating
        } else b.wait = 3;
        p.chasedBy = null; b.prey = null;
      }
      return;
    }
    if (b.wait > 0) { b.wait -= dm; return; }
    if (hs && rnd() < dm * 0.02) { const p = App.preyNear && App.preyNear(b.x, b.z, 22); if (p && !p.chasedBy) { b.prey = p; return; } }
    if (!b.t) {
      const a = rnd() * 6.28, d = rnd() * b.home.r, x = b.home.x + Math.cos(a) * d, z = b.home.z + Math.sin(a) * d;
      if (isLand(x, z)) b.t = { x, z }; else { b.wait = 2; return; }
    }
    if (moveTo(b, b.t.x, b.t.z, 0.9, dm) < 0.3) { b.t = null; b.wait = 2 + rnd() * 8; }
  }

  // ---------- battles ----------
  const battles = [];
  const layer = () => document.getElementById("overlay");
  function hpEl() {
    const el = document.createElement("div");
    el.className = "hpbar";
    el.innerHTML = '<span class="nm"></span><div class="hb"><i></i></div>';
    layer().appendChild(el);
    return el;
  }
  // sides: { c: creature data, b: 3D body, owner: agent or null }
  App.startBattle = (A, B, kind, onEnd) => {
    const sa = App.creatureStats(A.c), sb = App.creatureStats(B.c);
    const cx = (A.b.x + B.b.x) / 2, cz = (A.b.z + B.b.z) / 2, ang = Math.atan2(B.b.x - A.b.x, B.b.z - A.b.z);
    // a battle on screen lasts long enough to watch, about half a minute: each side can take about nine of the other's blows
    const blow = (att, def, ca, cd) => Math.max(2, (att.atk * 1.4 - def.def * 0.55) * typeMult(SPECIES[ca.sp].type, SPECIES[cd.sp].type));
    const ha = Math.max(sa.hp, blow(sb, sa, B.c, A.c) * 9), hb = Math.max(sb.hp, blow(sa, sb, A.c, B.c) * 9);
    const bt = { A, B, hp: [ha, hb], max: [ha, hb], stats: [sa, sb], turn: sa.spd >= sb.spd ? 0 : 1, next: performance.now() + 1400, kind, onEnd, cx, cz, ang, done: false, els: [hpEl(), hpEl()], lunge: null };
    A.b.battle = bt; B.b.battle = bt;
    battles.push(bt);
    return bt;
  };
  function place(bt) {
    const ux = Math.sin(bt.ang), uz = Math.cos(bt.ang);
    [[bt.A, -1], [bt.B, 1]].forEach(([s, sg], i) => {
      let x = bt.cx + ux * sg * 2.4, z = bt.cz + uz * sg * 2.4;
      if (bt.lunge && bt.lunge.who === i) { const k = Math.sin(Math.min(1, bt.lunge.t / 0.35) * Math.PI); x -= ux * sg * 1.5 * k; z -= uz * sg * 1.5 * k; }
      s.b.x += (x - s.b.x) * 0.25; s.b.z += (z - s.b.z) * 0.25;
      s.b.h = Math.atan2(-ux * sg, -uz * sg);
      if (s.owner && !App.isKO(s.owner.id)) s.owner.heading = Math.atan2(bt.cx - s.owner.pos.x, bt.cz - s.owner.pos.z);
    });
  }
  function hit(bt, from) {
    const att = from === 0 ? bt.A : bt.B, def = from === 0 ? bt.B : bt.A, sa = bt.stats[from], sd = bt.stats[1 - from];
    const ta = SPECIES[att.c.sp].type, td = SPECIES[def.c.sp].type, m = typeMult(ta, td);
    const dmg = Math.max(2, Math.round((sa.atk * 1.4 - sd.def * 0.55) * m * (0.85 + rnd() * 0.3)));
    bt.hp[1 - from] = Math.max(0, bt.hp[1 - from] - dmg);
    return { dmg, m, ta };
  }
  // the same fight, all at once, for battles nobody is watching
  App.simulateBattle = (ca, cb) => {
    const sa = App.creatureStats(ca), sb = App.creatureStats(cb), hp = [sa.hp, sb.hp], S2 = [sa, sb], C2 = [ca, cb];
    let turn = sa.spd >= sb.spd ? 0 : 1;
    for (let r = 0; r < 60 && hp[0] > 0 && hp[1] > 0; r++, turn = 1 - turn) {
      const m = typeMult(SPECIES[C2[turn].sp].type, SPECIES[C2[1 - turn].sp].type);
      const spell = App.tryCast ? App.tryCast(C2[turn].owner, 0.2) : false;
      hp[1 - turn] -= Math.max(2, Math.round((S2[turn].atk * 1.4 - S2[1 - turn].def * 0.55) * m * (0.85 + rnd() * 0.3) * (spell ? 2.2 : 1)));
    }
    return hp[0] > 0 ? 0 : 1;
  };
  function reward(win, lose) {
    win.wins = (win.wins || 0) + 1; lose.losses = (lose.losses || 0) + 1;
    const up = gainXP(win, 8 + lose.lvl * 4);
    gainXP(lose, 3 + win.lvl);
    return up;
  }
  App.creatureReward = reward;
  function stepBattles(dtReal) {
    const now = performance.now(), speed = clamp(st.speed || 1, 1, 2);
    for (let i = battles.length - 1; i >= 0; i--) {
      const bt = battles[i];
      if (bt.lunge) { bt.lunge.t += dtReal * speed; if (bt.lunge.t > 0.4) bt.lunge = null; }
      place(bt);
      // health bars over both creatures
      [bt.A, bt.B].forEach((s, k) => {
        const p = App.project(V.set(s.b.x, s.b.y + (geo[s.c.sp] ? geo[s.c.sp].h : 1) + 0.7, s.b.z)), el = bt.els[k];
        el.hidden = p.behind;
        el.style.left = p.x + "px"; el.style.top = p.y + "px";
        el.querySelector(".nm").textContent = SPECIES[s.c.sp].name + " Lv " + s.c.lvl;
        const f = bt.hp[k] / bt.max[k], bar = el.querySelector("i");
        bar.style.width = Math.round(f * 100) + "%"; bar.style.background = f > 0.5 ? "#7be08f" : f > 0.2 ? "#ffd23f" : "#ff6b5e";
      });
      if (bt.done) { if (now > bt.doneAt) finish(bt, i); continue; }
      if (now < bt.next) continue;
      bt.next = now + 1500 / speed;
      const who = bt.turn, att = who === 0 ? bt.A : bt.B, def = who === 0 ? bt.B : bt.A;
      bt.lunge = { who, t: 0 };
      // the faster creature dodges more often
      if (rnd() < 0.12 + Math.max(0, bt.stats[1 - who].spd - bt.stats[who].spd) * 0.015) {
        if (def.owner) App.say(def.owner, ["Dodge!", "Missed!", "Too slow!", "Nice dodge, " + (def.c.nick || "buddy") + "!"][Math.floor(rnd() * 4)], 1.4);
        bt.turn = 1 - who;
        continue;
      }
      const r = hit(bt, who);
      const cast = att.owner && App.tryCast && App.tryCast(att.owner.id, 0.3);
      if (cast) bt.hp[1 - who] = Math.max(0, bt.hp[1 - who] - Math.round(r.dmg * 1.2));
      if (att.owner) App.say(att.owner, (att.c.nick || SPECIES[att.c.sp].name) + ", " + (cast ? App.spellOf(SPECIES[att.c.sp].type) + "! (1 Ethernum)" : SPECIES[att.c.sp].move + "!"), 1.6);
      if (cast) for (let k = 0; k < 60; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: def.b.x, y: def.b.y + 0.8, z: def.b.z, vx: (rnd() - 0.5) * 10, vy: 3 + rnd() * 6, vz: (rnd() - 0.5) * 10, age: -k * 0.004, life: 0.8 + rnd() * 0.4, color: new THREE.Color(TYPE_COL[r.ta]) });
      const col = new THREE.Color(TYPE_COL[r.ta]);
      for (let k = 0; k < 26; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: def.b.x, y: def.b.y + 0.8, z: def.b.z, vx: (rnd() - 0.5) * 6, vy: 2 + rnd() * 4, vz: (rnd() - 0.5) * 6, age: -k * 0.006, life: 0.6 + rnd() * 0.3, color: col });
      if (r.m > 1 && def.owner) App.say(def.owner, "Oh no, super effective!", 1.6);
      else if (r.m < 1 && att.owner) App.say(att.owner, "Not very effective\u2026", 1.6);
      if (bt.hp[1 - who] <= 0) {
        bt.done = true; bt.doneAt = now + 1600 / speed; bt.winner = who;
        def.b.faint = 1;
      } else bt.turn = 1 - who;
    }
  }
  function finish(bt, i) {
    battles.splice(i, 1);
    bt.els.forEach((e) => e.remove());
    bt.A.b.battle = null; bt.B.b.battle = null;
    bt.A.b.faint = 0; bt.B.b.faint = 0;
    const win = bt.winner === 0 ? bt.A : bt.B, lose = bt.winner === 0 ? bt.B : bt.A;
    if (win.owner) App.say(win.owner, ["We did it!", "Great job, " + (win.c.nick || "buddy") + "!", "Yes!"][Math.floor(rnd() * 3)], 3);
    if (lose.owner) App.say(lose.owner, ["Good try, " + (lose.c.nick || "buddy") + ".", "We'll get them next time.", "Rest up, friend."][Math.floor(rnd() * 3)], 3);
    if (bt.onEnd) bt.onEnd(bt.winner);
  }
  App.battleOf = (t) => battles.find((b) => b.A.owner === t || b.B.owner === t) || null;

  // ---------- taming (on screen) ----------
  // a tamer at a habitat: find a wild one, battle it with the favourite if there is one, then offer a snack
  App.tamingBrain = (t, step) => {
    const mine = App.creaturesOf(t.id);
    if (mine.length >= 3) return false;
    const w = App.wildNear(t.pos.x, t.pos.z, 28);
    if (!w) return false;
    w.busy = true;
    t.action = { kind: "tame", target: w, phase: "approach", started: st.T };
    if (rnd() < 0.5) App.say(t, "Ooh, a wild " + SPECIES[w.sp].name + "!", 3);
    return true;
  };
  App.stepTame = (t, a, dm) => {
    const w = a.target;
    if (!w || w.gone > st.T || st.T - a.started > 60) { if (w) w.busy = false; t.action = null; return "idle"; }
    if (a.phase === "approach") {
      const d = Math.hypot(w.x - t.pos.x, w.z - t.pos.z);
      if (d > 3.2) return "walk:" + w.x + "," + w.z;
      t.heading = Math.atan2(w.x - t.pos.x, w.z - t.pos.z);
      const pet = App.petOf(t.id), lead = App.leadCreature(t.id);
      if (pet && lead && !pet.battle) {
        a.phase = "battle";
        App.say(t, "Go, " + (lead.nick || SPECIES[lead.sp].name) + "!", 2.5);
        App.startBattle({ c: lead, b: pet, owner: t }, { c: w.data, b: w, owner: null }, "wild", (winner) => {
          reward(winner === 0 ? lead : w.data, winner === 0 ? w.data : lead);
          a.phase = "offer"; a.until = st.T + 3; a.bonus = winner === 0 ? 0.4 : -0.1;
        });
      } else { a.phase = "offer"; a.until = st.T + 4; a.bonus = 0; }
      return "stand";
    }
    if (a.phase === "battle") return "stand";
    if (a.phase === "offer") {
      if (!a.said) { App.say(t, "Here, have a snack\u2026", 3); a.said = true; }
      if (st.T < a.until) return "stand";
      const chance = clamp(0.45 + (App.levelOf ? App.levelOf(t.id) * 0.02 : 0) + a.bonus - (w.data.lvl - (App.leadCreature(t.id) ? App.leadCreature(t.id).lvl : 2)) * 0.05 + t.persona.playful * 0.1, 0.08, 0.92);
      w.busy = false;
      if (rnd() < chance) {
        const c = newCreature(w.sp, w.data.lvl, t.id, t.id * 31 + Math.floor(st.T));
        c.xp = w.data.xp || 0;
        (st.tamed[t.id] = st.tamed[t.id] || []).push(c);
        w.gone = st.T + 720;
        App.say(t, "Welcome to the family, " + c.nick + "!", 4);
        App.log("creature", t.name + " tamed a wild " + SPECIES[w.sp].name + " (Lv " + c.lvl + ") and named it " + c.nick + ".", "A " + SPECIES[w.sp].type + "-type creature from " + (t.step && t.step.p && t.step.p.label ? t.step.p.label.replace(/ \(taming creatures\)$/, "") : "the wild") + ".", { who: [t.id] });
        App.sfx && App.sfx.cheer && App.sfx.cheer();
      } else { App.say(t, "Aww, it ran off.", 3); w.gone = st.T + 240; }
      t.action = null;
      return "done";
    }
    return "stand";
  };

  // ---------- arenas and tournaments ----------
  const DAY = 1440, T0 = 17 * 60 + 30, T1 = 21 * 60; // long enough for all seven matches to be fought in front of you
  App.arenaOf = (id, day) => {
    const k = day + ":" + App.villageOfToken(id).region, tr = st.tourneys && st.tourneys[k];
    return tr && tr.players.includes(id) && !tr.done ? tr : null;
  };
  function planTourneys(day) {
    for (const ar of App.arenas || []) {
      if (!ar) continue;
      const k = day + ":" + ar.region;
      if (st.tourneys[k]) continue;
      // the eight strongest tamers of the region who are up and about
      const pool = [];
      // from villages close enough to walk there in time
      for (const v of App.villages) if (v.region === ar.region && Math.hypot(v.x - ar.x, v.z - ar.z) < 260) for (const id of v.residents) {
        const c = App.leadCreature(id);
        if (c && !App.isKO(id)) pool.push([id, c.lvl + hash2(id, day, 81) * 3]);
      }
      pool.sort((a, b) => b[1] - a[1]);
      const players = pool.slice(0, 8).map((x) => x[0]);
      if (players.length < 2) continue;
      st.tourneys[k] = { day, region: ar.region, players, alive: players.slice(), matches: [], done: false, live: false };
      for (const id of players) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && !t.action.order && t.action.kind !== "ko") App.endAction(t); }
    }
    for (const k in st.tourneys) if (st.tourneys[k].day < day - 3) delete st.tourneys[k];
  }
  function finishTourney(tr) {
    // anything not fought in front of the player is settled here
    while (tr.alive.length > 1) {
      const next = [];
      for (let i = 0; i < tr.alive.length; i += 2) {
        const a = tr.alive[i], b = tr.alive[i + 1];
        if (b == null) { next.push(a); continue; }
        const ca = App.leadCreature(a), cb = App.leadCreature(b);
        if (!ca || !cb) { next.push(ca ? a : b); continue; }
        const w = App.simulateBattle(ca, cb);
        reward(w === 0 ? ca : cb, w === 0 ? cb : ca);
        tr.matches.push([a, b, w === 0 ? a : b]);
        next.push(w === 0 ? a : b);
      }
      tr.alive = next;
    }
    tr.done = true;
    const champ = tr.alive[0], c = App.leadCreature(champ), ar = App.arenas[tr.region];
    tr.champ = champ;
    st.champs[tr.region] = { id: champ, day: tr.day, creature: c ? App.creatureLabel(c) : "" };
    const near = Math.hypot(ar.x - App.cam.target.x, ar.z - App.cam.target.z) < 600;
    if (near || tr.live) App.log("creature", App.nameOf(champ) + " and " + (c ? App.creatureLabel(c) : "their creature") + " won tonight's tournament at " + ar.name + ".",
      tr.players.length + " tamers of " + App.regions[tr.region].name + " took part; " + tr.matches.length + " battles in all.", { who: [champ] });
  }
  // a tamer at the arena: wait in the stands until called down for a match
  App.arenaBrain = (t, step) => {
    const ar = App.arenas[App.villageOfToken(t.id).region];
    if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 3) return { travel: step.p };
    return { wait: true, face: ar };
  };
  // the live tournament: matches are fought one after another in the ring
  function runLive(tr, ar) {
    if (tr.current) return;
    if (tr.alive.length < 2) return;
    if (!tr.queue || !tr.queue.length) {
      tr.queue = [];
      for (let i = 0; i < tr.alive.length; i += 2) tr.queue.push([tr.alive[i], tr.alive[i + 1]]);
      tr.nextRound = [];
    }
    const [a, b] = tr.queue.shift();
    const finishPair = (w) => { tr.nextRound.push(w); tr.current = null; if (!tr.queue.length) { tr.alive = tr.nextRound; tr.queue = null; } };
    if (b == null) return finishPair(a);
    const ta = App.pop.agent[a], tb = App.pop.agent[b], pa = App.petOf(a), pb = App.petOf(b), ca = App.leadCreature(a), cb = App.leadCreature(b);
    if (!ta || !tb || !pa || !pb || !ca || !cb || Math.hypot(ta.pos.x - ar.x, ta.pos.z - ar.z) > 14 || Math.hypot(tb.pos.x - ar.x, tb.pos.z - ar.z) > 14) {
      const w = ca && cb ? App.simulateBattle(ca, cb) : ca ? 0 : 1;
      if (ca && cb) reward(w === 0 ? ca : cb, w === 0 ? cb : ca);
      tr.matches.push([a, b, w === 0 ? a : b]);
      return finishPair(w === 0 ? a : b);
    }
    tr.current = [a, b];
    // the two tamers step into the ring
    ta.action = { kind: "duel", spot: { x: ar.x - 4.2, z: ar.z }, started: st.T };
    tb.action = { kind: "duel", spot: { x: ar.x + 4.2, z: ar.z }, started: st.T };
    pa.x = ar.x - 2.6; pa.z = ar.z; pb.x = ar.x + 2.6; pb.z = ar.z;
    App.say(ta, "Let's go, " + (ca.nick || "buddy") + "!", 2.5); App.say(tb, "You're on!", 2.5);
    const bets = App.placeBets ? App.placeBets(ar.x, ar.z, ta.name, tb.name, 0.5 + (ca.lvl - cb.lvl) * 0.06, [ta, tb]) : [];
    App.startBattle({ c: ca, b: pa, owner: ta }, { c: cb, b: pb, owner: tb }, "arena", (w) => {
      App.settleBets && App.settleBets(bets, w);
      reward(w === 0 ? ca : cb, w === 0 ? cb : ca);
      tr.matches.push([a, b, w === 0 ? a : b]);
      ta.action = null; tb.action = null;
      setTimeout(() => finishPair(w === 0 ? a : b), 300);
    });
  }

  // ---------- off screen: a little taming and training every evening ----------
  function dailyLife(day) {
    for (let id = 0; id < TB.SUPPLY; id++) {
      if (App.pop.agent[id] || !App.isTamer(id)) continue;
      const mine = st.tamed[id] || [];
      if (mine.length < 3 && hash2(id, day, 85) < 0.12) {
        const spot = App.tamingSpot(id), sp = spot && speciesFor(spot.type, id * 13 + day);
        if (sp) (st.tamed[id] = mine).push(newCreature(sp, 1 + Math.floor(hash2(id, day, 87) * 4), id, id * 17 + day));
      }
      if (mine[0] && hash2(id, day, 89) < 0.5) gainXP(mine[0], 6);
      if (mine.length < 3 && hash2(id, day, 91) < 0.004) {
        const v = App.villageOfToken(id), cave = (App.dungeons || []).find((d) => Math.hypot(d.x - v.x, d.z - v.z) < 160);
        if (cave) { const k = ["gloomslime", "shadebat", "brutecap"][Math.floor(hash2(id, day, 93) * 3)], c = App.tameMonster(id, k, 2 + Math.floor(hash2(id, day, 95) * 4)); if (c) st.tamed[id] = App.creaturesOf(id); }
      }
    }
  }

  // ---------- the clock ----------
  App.creatureTick = () => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= 6 * 60 && st.tourneyDay !== day) { st.tourneyDay = day; planTourneys(day); }
    if (m >= 20 * 60 + 30 && st.creatureDay !== day) { st.creatureDay = day; dailyLife(day); }
    for (const k in st.tourneys) {
      const tr = st.tourneys[k];
      if (tr.done || tr.day !== day) { if (!tr.done && tr.day < day) finishTourney(tr); continue; }
      const ar = App.arenas[tr.region];
      if (m >= T0 && m < T1 && Math.hypot(ar.x - App.cam.target.x, ar.z - App.cam.target.z) < 90) { tr.live = true; runLive(tr, ar); }
      if (m >= T1 && !tr.current) finishTourney(tr);
    }
  };
  App.tourneyWindow = { start: T0, end: T1 };

  // ---------- per frame ----------
  App.stepCreatures = (dtReal) => {
    if (!geo.griffin) return;
    const dm = Math.min(dtReal, 0.1) * st.speed;
    for (const list of wild.values()) for (const b of list) stepBody(b, dm);
    for (const b of pets.values()) stepBody(b, dm);
    stepBattles(dtReal);
    const n = {};
    for (const k in meshes) n[k] = 0;
    const tx = App.cam.target.x, tz = App.cam.target.z, time = performance.now() / 1000;
    const draw = (b) => {
      if (!meshes[b.sp]) { ensureGeo(b.sp); return; }
      if (b.gone > st.T || n[b.sp] >= CAP || Math.abs(b.x - tx) + Math.abs(b.z - tz) > 110) return;
      if (b.ridden && performance.now() - b.ridden < 250) return; // under its tamer, drawn as its mount (wealth.js)
      if (b.sp === "lumoth" && b.wild && !App.isNight && !b.battle && !b.busy) return; // moths come out at night
      if (!b.held && !b.flying) { const gy = App.surfaceAt(b.x, b.z).y; b.y += (gy - b.y) * Math.min(1, dtReal * 8); }
      const hov = SPECIES[b.sp].hover ? SPECIES[b.sp].hover + Math.sin(time * 2.5 + b.wob) * 0.15 : 0;
      const hop = b.battle ? Math.abs(Math.sin(time * 6 + b.wob)) * 0.12 : Math.abs(Math.sin(b.wob)) * 0.08;
      E.set(0, b.h, b.faint ? 1.4 : 0, "YXZ");
      Q.setFromEuler(E);
      M4.compose(V.set(b.x, b.y + hov + hop, b.z), Q, SC.set(1, 1, 1)).multiply(geo[b.sp].local);
      meshes[b.sp].setMatrixAt(n[b.sp]++, M4);
    };
    for (const list of wild.values()) for (const b of list) draw(b);
    for (const b of pets.values()) draw(b);
    for (const k in meshes) { meshes[k].count = n[k]; meshes[k].instanceMatrix.needsUpdate = true; }
  };

  // ---------- the Arena tab ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let arenaSig = "";
  App.renderArena = (force) => {
    const box = document.getElementById("arenaBody");
    if (!box) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    const all = [];
    for (const id in st.tamed) for (const c of st.tamed[id]) all.push(c);
    const sig = all.length + "|" + Object.keys(st.tourneys).map((k) => k + st.tourneys[k].done + st.tourneys[k].matches.length).join(",") + "|" + Math.floor(m / 30) + "|" + JSON.stringify(st.delves || {}) + "|" + Object.values(st.contests || {}).map((c) => c.key + c.done + c.entrants.length).join(",") + "|" + (st.wallet || "") + "|" + (App.warSig ? App.warSig() : "");
    if (!force && sig === arenaSig) return;
    arenaSig = sig;
    const top = all.slice().sort((a, b) => b.lvl - a.lvl || (b.wins || 0) - (a.wins || 0)).slice(0, 10);
    const count = {};
    for (const c of all) count[c.sp] = (count[c.sp] || 0) + 1;
    const tamers = Object.keys(st.tamed).filter((id) => st.tamed[id].length).length;
    let h = (App.warHTML ? App.warHTML() : "") + (App.faithHTML ? App.faithHTML() : "") + (App.minesHTML ? App.minesHTML() : "") + (App.dungeonsHTML ? App.dungeonsHTML() : "") + (App.guildsHTML ? App.guildsHTML() : "") + (App.wealthHTML ? App.wealthHTML() : "") + (App.weatherHTML ? App.weatherHTML() : "") + (App.parliamentHTML ? App.parliamentHTML() : "") + (App.casinosHTML ? App.casinosHTML() : "") + (App.contestsHTML ? App.contestsHTML() : "") + (App.divingHTML ? App.divingHTML() : "") + (App.seaHTML ? App.seaHTML() : "") + (App.factionsHTML ? App.factionsHTML() : "") + '<div class="card"><h2>Creature Arena</h2><p class="note">Seven fantasy creatures live wild across the map. ' + tamers.toLocaleString() + " tamers have " + all.length.toLocaleString() +
      " of them. Every evening from " + App.clock(day * DAY + T0).short + " each region's eight strongest tamers meet at its arena." + (App.tamedMonsters ? " Tamers also win over monsters in the Great Underworld, the mines and at the cave mouths (never a guardian): " + App.tamedMonsters().toLocaleString() + " tamed so far, walking about with their tamers." : "") + "</p></div>";
    h += '<div class="card"><h3>Tonight\'s tournaments</h3><div class="kv">';
    for (const ar of App.arenas || []) {
      if (!ar) continue;
      const tr = st.tourneys[day + ":" + ar.region];
      const txt = !tr ? "Not enough tamers" : tr.done ? "Won by " + esc(App.nameOf(tr.champ)) : m >= T0 ? (tr.live ? "On now, live" : "On now") + " \u00b7 " + tr.matches.length + " battles" : tr.players.length + " tamers from " + App.clock(day * DAY + T0).short;
      h += '<span class="k"><button class="btn" data-arena="' + ar.region + '">' + esc(ar.name) + "</button></span><span>" + txt + "</span>";
    }
    h += "</div></div>";
    h += '<div class="card"><h3>Strongest creatures</h3>' + top.map((c, i) => '<div class="row" style="justify-content:space-between"><span><span class="clandot" style="background:' + TYPE_COL[SPECIES[c.sp].type] + '"></span>' + (i + 1) + ". " + esc(App.creatureLabel(c)) + '</span><span class="note">' + esc(App.nameOf(c.owner)) + " \u00b7 " + (c.wins || 0) + "W " + (c.losses || 0) + "L</span></div>").join("") + "</div>";
    h += '<div class="card"><h3>Creature guide</h3><div class="kv">' + KINDS.map((k) => { const B = SPECIES[k]; return '<span class="k"><span class="clandot" style="background:' + TYPE_COL[B.type] + '"></span>' + B.name + "</span><span>" + B.type + " \u00b7 strong vs " + STRONG[B.type].join(", ") + " \u00b7 lives at " + B.habitats.join(", ") + (k === "lumoth" ? " (night)" : "") + " \u00b7 " + (count[k] || 0) + " tamed</span>"; }).join("") + "</div></div>";
    box.innerHTML = h;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-arena]");
    if (!b) return;
    const ar = App.arenas[+b.dataset.arena];
    if (ar) App.flyTo(ar.x, ar.z, 40);
  });
})();
