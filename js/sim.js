/* Simulation: full agents near the player (needs, smart objects, chats, building) and the
 * Director, the world-managing AI that designs objects, mechanics, structures and events. */
(function () {
  "use strict";
  const App = window.App;
  const S = App.S;
  const NEEDS = (App.NEEDS = ["hunger", "energy", "social", "fun"]);
  const NEED_LABEL = (App.NEED_LABEL = { hunger: "Hunger", energy: "Energy", social: "Social", fun: "Fun" });

  const st = (App.st = {
    T: 8 * 60, mode: "auto", speed: 1, freeWill: true, tickles: [], props: [], assets: [], acts: [], projects: [],
    log: [], uid: 1, director: { next: 9 * 60, runs: 0, lastMech: 0, lastProject: -9999, lastDecor: 0, lastVariety: 0 },
    event: null, latest: null, rel: {}, fav: {}, wallet: null, popT: 8 * 60, kit: {}, moved: {},
  });
  // review state of the world kit (designed models): unreviewed until a person approves or rejects
  App.kitStatus = (kind) => st.kit[kind] || "approved"; // the whole world kit is approved for good
  App.kitChecks = {};
  const kitMeshes = new Map();
  // the living (animals, creatures, monsters, mounts) follow the Graphics setting like the buildings do: their usual
  // cube on Normal, a smaller one on High and Ultra (gfx.js fine.k, never below fine.min), so detail never costs
  // more than the setting allows
  const LIVING = /^(minotaur|ogre|goblin|skeleton|spider|troll|cyclops|medusa|hydra|cerberus|harpy|basilisk|chimera|manticore|golem|mummy|werewolf|wraith|centaur|kobold|lich|salamander|goldtickle|gloomslime|shadebat|brutecap|horse|horseleg|griffinmount|griffinwing)$/;
  App.liveVoxel = (kind, base) => {
    const K = TB.KIT[kind], G = App.gfxLevel && App.gfxLevel().fine;
    if (!G || !(LIVING.test(kind) || (K && /^(Animals|Creatures|Dragons)$/.test(K.group)))) return base;
    return Math.max(Math.min(base, G.min), Math.round(base * G.k));
  };
  App.kitMesh = (kind, v) => {
    const key = kind + ":" + v;
    if (!kitMeshes.has(key)) {
      const F = App.frag[TB.kitKey(kind, v)];
      kitMeshes.set(key, F ? Promise.resolve({ md: F.md, geo: F.geo })
        : App.job("compact", { strokes: TB.KIT[kind].build(v), voxel: App.liveVoxel(kind, TB.KIT[kind].voxel[0]), lip: 1.5 }).then((r) => ({ md: r.mesh, geo: App.makeVoxMesh(r.mesh).geometry })));
    }
    return kitMeshes.get(key);
  };
  // the same fidelity checks every designed object goes through
  App.checkKit = async () => {
    for (const kind in TB.KIT) {
      const strokes = TB.KIT[kind].build(TB.KIT[kind].variants[0]);
      try {
        // the big buildings at a voxel in proportion to their size (a castle at 8 would keep a worker busy for minutes)
        const res = await App.job("compact", { strokes, voxel: Math.max(8, Math.round(TB.KIT[kind].voxel[0] * 0.75)), lip: 1.5 });
        const ck = TB.check({ strokes }, res.vox);
        App.kitChecks[kind] = { score: ck.score, checks: ck.checks, fails: ck.fails, voxels: res.vox.count, strokes: strokes.length };
      } catch (e) { console.warn("kit check", kind, e); }
    }
  };
  const uid = (App.uid = (p) => p + (st.uid++).toString(36));
  const pad = (n) => String(n).padStart(2, "0");
  App.clock = (T) => {
    const day = Math.floor(T / 1440) + 1, m = Math.floor(T % 1440), hh = Math.floor(m / 60), mm = m % 60;
    return { day, hh, mm, minute: m, short: pad(hh) + ":" + pad(mm), label: "Day " + day + " \u00b7 " + pad(hh) + ":" + pad(mm) };
  };
  const rnd = Math.random;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  App.log = (kind, text, why, extra) => {
    const e = Object.assign({ t: st.T, kind, text, why: why || "" }, extra || {});
    st.log.unshift(e);
    if (st.log.length > 200) st.log.pop();
    if (App.ui) App.ui.onLog(e);
  };

  // ---------- relationships (kept for everyone, not just agents on screen) ----------
  const rk = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  App.relGet = (a, b) => st.rel[rk(a, b)] || 0;
  App.friendsOf = (id) => {
    const out = [];
    for (const k in st.rel) { const [a, b] = k.split("-").map(Number); if (a === id) out.push([b, st.rel[k]]); else if (b === id) out.push([a, st.rel[k]]); }
    return out.sort((x, y) => y[1] - x[1]);
  };

  // ---------- activities ("mechanics") ----------
  // where: home | ground | scenery | prop | water | sand | plaza | chat | stroll | self | project | projectDone
  const CORE = [
    { id: "rest", name: "Rest at home", verb: "is napping at home", needs: { energy: 55 }, capacity: 1, minutes: 70, where: "home" },
    { id: "swim", name: "Swim", verb: "is swimming", needs: { fun: 28, energy: -10 }, capacity: 8, minutes: 20, where: "water" },
    { id: "sunbathe", name: "Sunbathe", verb: "is sunbathing", needs: { energy: 18, fun: 8 }, capacity: 8, minutes: 25, where: "sand" },
    { id: "chat", name: "Chat", verb: "is chatting", needs: { social: 30, fun: 6 }, capacity: 2, minutes: 12, where: "chat" },
    { id: "stroll", name: "Stroll", verb: "is strolling", needs: { fun: 7 }, capacity: 16, minutes: 10, where: "stroll" },
    { id: "build", name: "Build together", verb: "is building", needs: { fun: 30, social: 14, energy: -6 }, capacity: 4, minutes: 20, where: "project" },
  ];
  // from each Tickle's on-chain Ground item
  const GROUND_ACTS = {
    Cooler: ["Raid the cooler", "is grabbing a cold drink", { hunger: 30, social: 6 }, 3, 12],
    "808": ["Dance to the 808", "is dancing to the 808", { fun: 30, social: 18, energy: -8 }, 5, 20],
    Beachball: ["Bump the beachball", "is bumping the beachball", { fun: 28, social: 8, energy: -6 }, 3, 15],
    Chair: ["Lounge in the chair", "is lounging", { energy: 30 }, 1, 25],
    Skateboard: ["Skate", "is skating", { fun: 32, energy: -12 }, 1, 15],
    Skates: ["Roller skate", "is roller skating", { fun: 30, energy: -12 }, 2, 15],
    "Fishing Rod": ["Go fishing", "is fishing", { hunger: 26, fun: 10 }, 1, 25],
    Workout: ["Work out", "is working out", { fun: 14, energy: -16, social: 4 }, 2, 20],
    Treasure: ["Hunt for treasure", "is digging for treasure", { fun: 34, energy: -8 }, 2, 20],
    "Surfs Up": ["Catch some waves", "is surfing", { fun: 34, energy: -10 }, 1, 40],
  };
  App.GROUND_ACTS = GROUND_ACTS;
  // how each personal item comes out of the inventory: held while walking there, then set down
  // beside its owner (or ridden, for skateboards and skates). Joinable ones let others take part.
  const ITEM_USE = (App.ITEM_USE = {
    "Fishing Rod": { spot: "shore", hold: true }, "Surfs Up": { spot: "shore", hold: true, water: true, surf: true },
    Beachball: { spot: "open", join: true }, "808": { spot: "here", join: true }, Cooler: { spot: "here", join: true },
    Chair: { spot: "here" }, Workout: { spot: "here" }, Treasure: { spot: "open" },
    Skateboard: { spot: "road", ride: true }, Skates: { spot: "road", ride: true },
  });
  // how each Ground item is used once the Tickle gets to it: where the item goes and how the Tickle moves
  const ITEM_POSE = (App.ITEM_POSE = {
    "Fishing Rod": { mode: "paw", scale: 0.42, rot: 2.2, pose: "fish" }, "Surfs Up": { mode: "surf", pose: "surf" },
    Beachball: { mode: "ball", pose: "ball" }, "808": { mode: "place", pose: "dance" }, Cooler: { mode: "place", pose: "drink" },
    Chair: { mode: "sit", pose: "sit" }, Workout: { mode: "paw", scale: 0.6, rot: 0, pose: "lift" }, Treasure: { mode: "place", pose: "dig" },
    Skateboard: { mode: "ride", pose: "trick" }, Skates: { mode: "ride", pose: "skate" },
  });
  // anyone can go fishing, surfing, work out, play ball or skate: the village lends rods, boards, weights,
  // balls and skates to whoever has none of its own (the owners still do it more often)
  const SHARED = (App.SHARED_ITEMS = new Set(["Fishing Rod", "Surfs Up", "Workout", "Beachball", "Skateboard", "Skates"]));
  const GROUND_INDEX = {};
  const groundIndex = (name) => {
    if (GROUND_INDEX[name] == null) { GROUND_INDEX[name] = -1; for (const k in App.MODEL_NAMES) if (k.startsWith("ground:") && App.MODEL_NAMES[k] === name) GROUND_INDEX[name] = +k.slice(7); }
    return GROUND_INDEX[name];
  };
  // the item a Tickle is using right now: its own, or one lent by the village
  const itemOf = (t) => t.useItem || t.ground;
  // what the paws hold (the on-chain Holding): a float, a wake board or a towel is too big to wave about,
  // and for anything that needs both paws, whatever is held is put away for the moment
  const BULKY = new Set(["Tube", "Wake Board", "Towel"]);
  // a float and a wake board are for the water: they stay in the inventory (on the Tickle's on-chain model they are
  // still part of it) and come out only when it is swimming, floating or out on the water
  const WATER_HOLD = (App.WATER_HOLD = new Set(["Tube", "Wake Board"]));
  const towelSpot = (t) => { if (!(t.nwAt > performance.now() - 2000)) { t.nwAt = performance.now(); const s = shoreNear(t.pos.x, t.pos.z); t.nw = !!s && Math.hypot(s.x - t.pos.x, s.z - t.pos.z) < 14; } return t.nw || inWater(t); };
  const inWater = (t) => !!((t.action && t.action.water && t.action.phase === "doing") || (t.detour && t.detour.wet) || (t.action && t.action.surf) || App.surfaceAt(t.pos.x, t.pos.z).water);
  const TWO_HANDED = new Set(["dig", "ball", "dance", "surf", "trick", "skate"]);
  const RIGHT_PAW = new Set(["lift", "fish"]); // one paw at work: only what that paw holds is put away
  const JOB_ITEM = { fisher: "Fishing Rod", dj: "808", vendor: "Cooler", lifeguard: "Chair", surfer: "Surfs Up", host: "Beachball", hunter: "Treasure", coach: "Workout" };
  // from the pieces cut out of the on-chain floors
  const SCENERY_ACTS = {
    palm: ["Pick coconuts", "is cracking a coconut", { hunger: 32, fun: 4 }, 2, 14],
    umbrella: ["Rest in the shade", "is resting in the shade", { energy: 28, fun: 6 }, 2, 25],
    duck: ["Feed the ducks", "is feeding the ducks", { fun: 22, social: 8 }, 3, 12],
    waterfall: ["Splash under the waterfall", "is splashing in the waterfall", { fun: 30, energy: -6 }, 4, 18],
    boulders: ["Climb the rocks", "is climbing rocks", { fun: 24, energy: -10 }, 2, 15],
    pier: ["Fish off the pier", "is fishing off the pier", { hunger: 28, fun: 12 }, 4, 25],
    campfire: ["Gather at the campfire", "is telling stories by the fire", { social: 34, fun: 10, energy: 4 }, 6, 30],
    logseat: ["Sit a while", "is sitting on a log", { energy: 18, social: 10 }, 2, 15],
    tree_leafy_0: ["Rest in the shade", "is resting under a tree", { energy: 22, fun: 4 }, 2, 20], tree_leafy_1: ["Rest in the shade", "is resting under a tree", { energy: 22, fun: 4 }, 2, 20],
    tree_pine_0: ["Rest under a pine", "is resting under a pine", { energy: 20, fun: 4 }, 2, 20], tree_pine_1: ["Rest under a pine", "is resting under a pine", { energy: 20, fun: 4 }, 2, 20],
  };
  App.SCENERY_ACTS = SCENERY_ACTS;
  const HOLD_ACTS = {
    Chips: ["Eat chips", "is munching chips", { hunger: 22 }, 6], Snacks: ["Eat snacks", "is snacking", { hunger: 24 }, 6],
    Games: ["Play games", "is gaming", { fun: 24, energy: -4 }, 15], Towel: ["Towel off", "is drying off", { energy: 8, fun: 4 }, 5],
    Tube: ["Float on the tube", "is floating", { fun: 18, energy: 6 }, 15],
  };
  App.initActs = () => {
    // a saved world keeps its activities, but the built-in ones follow the current rules (how long, what they give)
    for (const a of st.acts) if (a.status === "core" && a.where === "ground" && GROUND_ACTS[a.ground]) { const G = GROUND_ACTS[a.ground]; a.needs = G[2]; a.capacity = G[3]; a.minutes = G[4]; }
    if (st.acts.some((a) => a.status === "core")) return;
    CORE.forEach((a) => st.acts.push(Object.assign({ source: "core", status: "core" }, a)));
    for (const k in GROUND_ACTS) {
      const [name, verb, needs, capacity, minutes] = GROUND_ACTS[k];
      st.acts.push({ id: "g_" + k, name, verb, needs, capacity, minutes, where: "ground", ground: k, source: "onchain", status: "core" });
    }
    for (const k in SCENERY_ACTS) {
      const [name, verb, needs, capacity, minutes] = SCENERY_ACTS[k];
      st.acts.push({ id: "s_" + k, name, verb, needs, capacity, minutes, where: "scenery", scenery: k, source: "onchain", status: "core" });
    }
  };
  const ACTIVE = new Set(["core", "starter", "approved", "auto"]);
  App.actActive = (a) => ACTIVE.has(a.status);
  App.actById = (id) => st.acts.find((a) => a.id === id);

  // ---------- agents (full 3D Tickles near the player) ----------
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // a Tickle's figure: the body, and the arms hanging from the shoulders (the left one is the right one
  // mirrored, and each paw keeps whatever the Tickle is holding); used by agents and inside buildings
  App.buildFigure = (e) => {
    const [ax, ay] = e.anchor;
    const md = e.md;
    const pivot = new THREE.Group();
    const cm = new THREE.Mesh(e.geo, App.voxMaterial);
    cm.scale.setScalar(md.voxel * S);
    const minY = (md.origin[1] + md.min[1] * md.voxel) * S, maxY = (md.origin[1] + md.max[1] * md.voxel) * S;
    cm.position.set(md.origin[0] * S - ax * S, md.origin[1] * S - minY, md.origin[2] * S - ay * S);
    cm.userData.tickle = true;
    pivot.add(cm);
    let arms = null;
    if (e.arm && e.shoulder) {
      const sh = e.shoulder, local = (x, y, z) => new THREE.Vector3((x - ax) * S, z * S - minY, (y - ay) * S);
      const piece = (p, sx) => {
        const m = new THREE.Mesh(p.geo, App.voxMaterial);
        m.scale.setScalar(p.md.voxel * S); m.userData.tickle = true;
        m.position.set((p.md.origin[0] - sx) * S, (p.md.origin[1] - sh[2]) * S, (p.md.origin[2] - sh[1]) * S);
        return m;
      };
      arms = {};
      for (const side of [1, -1]) {
        const g = new THREE.Group();
        g.position.copy(local(sh[0] * side, sh[1], sh[2]));
        if (side > 0) g.add(piece(e.arm, sh[0]));
        else { const mir = new THREE.Group(); mir.scale.x = -1; mir.add(piece(e.arm, sh[0])); g.add(mir); }
        const it = side > 0 ? e.itemR : e.itemL;
        const held = it ? piece(it, sh[0] * side) : null;
        if (held) g.add(held);
        pivot.add(g);
        arms[side > 0 ? "R" : "L"] = g;
        (arms.held = arms.held || {})[side > 0 ? "R" : "L"] = held;
      }
      // where the paw is, seen from the shoulder (for weapons and shields)
      const pw = e.paw || [sh[0] + 30, sh[1] + 15, sh[2] - 45];
      arms.paw = new THREE.Vector3((pw[0] - sh[0]) * S, (pw[2] - sh[2]) * S, (pw[1] - sh[1]) * S);
    }
    return { pivot, mesh: cm, arms, height: maxY - minY };
  };
  App.makeAgent = (id, e, start) => {
    const P = App.pop;
    const traits = App.traitsOf(id);
    const group = new THREE.Group(), F = App.buildFigure(e), pivot = F.pivot, cm = F.mesh, arms = F.arms;
    group.add(pivot);
    const blob = App.makeBlob(0.9); blob.position.y = 0.04; group.add(blob);
    App.scene.add(group);
    const h = hashStr(e.seed);
    const per = (k) => 0.78 + (((h >>> (k * 7)) & 127) / 127) * 0.5;
    const village = App.villageOfToken(id);
    const job = App.jobOf(id);
    const t = {
      id, seed: e.seed, traits, name: (traits.Character || "Tickle") + " #" + id, village, job, jobInfo: App.JOB_INFO[job],
      home: { x: P.home[2 * id], z: P.home[2 * id + 1] }, group, pivot, mesh: cm, arms, height: F.height,
      ground: traits.Ground !== "None" ? traits.Ground : null, holding: traits.Holding !== "None" ? traits.Holding : null,
      swatch: App.swatchOf(id), persona: { appetite: per(0), lazy: per(1), sociable: per(2), playful: per(3) },
      pos: new THREE.Vector3(start.x + (rnd() - 0.5) * 0.6, 0, start.z + (rnd() - 0.5) * 0.6), heading: rnd() * 6.28,
      needs: { hunger: P.needs[id * 4], energy: P.needs[id * 4 + 1], social: P.needs[id * 4 + 2], fun: P.needs[id * 4 + 3] },
      fav: st.fav[id] || (st.fav[id] = {}), cool: {}, action: null, queue: [], bubble: null, walk: 0, stuck: 0,
    };
    if (!App.canFloat(t) && App.pondWater(t.pos.x, t.pos.z)) {
      for (let r = 1; r < 25; r += 1) {
        let done = false;
        for (let a = 0; a < 6.28; a += 0.5) { const x = t.pos.x + Math.cos(a) * r, z = t.pos.z + Math.sin(a) * r; if (App.isLand(x, z)) { t.pos.x = x; t.pos.z = z; done = true; break; } }
        if (done) break;
      }
    }
    t.pos.y = App.surfaceAt(t.pos.x, t.pos.z).y;
    group.position.copy(t.pos);
    const row = TB.TOKENS.find((r) => r[0] === id);
    if (row) t.verified = TB.SLOTS.map((slot) => { const L = TB.SLOT_LABEL[slot]; return { slot: L, chain: row[2][L], decoded: traits[L], match: row[2][L] === traits[L] }; });
    st.tickles.push(t);
    App.makeHalo && App.makeHalo(t);
    return t;
  };

  // ---------- props (designed objects placed in the world) ----------
  App.assetGeometry = (asset) => {
    if (!asset._geo && asset.md) asset._geo = App.makeVoxMesh(asset.md).geometry;
    return asset._geo;
  };
  App.placeProp = (asset, x, z, rot, saved) => {
    const geo = App.assetGeometry(asset);
    if (!geo) return null;
    const md = asset.md;
    const g = new THREE.Group();
    g.add(App.centeredMesh(md, geo, !!asset.keepY));
    const box = App.meshBox(md);
    const rad = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    const blob = App.makeBlob(rad + 0.4); blob.position.y = 0.04; g.add(blob);
    g.position.set(x, App.surfaceAt(x, z).y, z);
    g.rotation.y = rot != null ? rot : rnd() * 6.28;
    App.scene.add(g);
    const p = { uid: (saved && saved.uid) || uid("p"), assetId: asset.id, x, z, rot: g.rotation.y, group: g, rad, height: box.max.y - box.min.y };
    st.props.push(p);
    return p;
  };
  App.removeProp = (p) => {
    App.scene.remove(p.group);
    st.props = st.props.filter((x) => x !== p);
    for (const t of st.tickles) if (t.action && t.action.ref === p.uid) t.action = null;
  };
  App.assetById = (id) => st.assets.find((a) => a.id === id);
  App.cullProps = () => {
    const tx = App.cam.target.x, tz = App.cam.target.z;
    for (const p of st.props) p.group.visible = Math.hypot(p.x - tx, p.z - tz) < App.RANGE.scenery;
  };
  // a free spot on land near (x, z), away from homes, scenery and other props
  // waterside things (umbrellas, lounge chairs) only go within a few steps of the sea or a pond
  const nearWater = (x, z) => {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 6.28;
      for (const d of [2, 4, 6]) if (App.columnHeight(Math.floor(x + Math.cos(a) * d), Math.floor(z + Math.sin(a) * d)) < App.SEA) return true;
    }
    return false;
  };
  App.findSpot = (x, z, clearance, opts) => {
    clearance = clearance || 3;
    const water = opts && opts.nearWater;
    if (water) {
      // look around the closest coast or pond to the target
      const p = App.poisNear(x, z, 260, (q) => q.type === "pond" || q.type === "beach" || q.type === "pier").sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
      if (p) { x = p.type === "pond" ? p.lake.x : p.spot.x; z = p.type === "pond" ? p.lake.z : p.spot.z; }
    }
    const v = App.nearestVillage(x, z);
    for (let r = 0; r < (water ? 30 : 40); r += 0.8) {
      for (let k = 0; k < 10; k++) {
        const a = rnd() * Math.PI * 2;
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        const h = App.columnHeight(Math.floor(px), Math.floor(pz));
        if (h < App.SEA + 1 || h > App.SEA + 12) continue;
        if (water && !nearWater(px, pz)) continue;
        if (v && v.homes.some((s) => Math.hypot(px - s.x, pz - s.z) < 3)) continue;
        if (Math.hypot(px - (v ? v.x : 1e9), pz - (v ? v.z : 1e9)) < 7) continue;
        if (App.sceneryVisible.some((s) => Math.hypot(px - s.x, pz - s.z) < 2.5)) continue;
        if (st.props.some((p) => Math.hypot(px - p.x, pz - p.z) < clearance + p.rad)) continue;
        if (st.projects.some((pr) => Math.hypot(px - pr.site.x, pz - pr.site.z) < 6)) continue;
        return { x: px, z: pz };
      }
    }
    return null;
  };
  // the closest shore (water cell next to land) around a point
  const shoreCache = new Map();
  function shoreNear(x, z) {
    const k = Math.round(x / 16) + "," + Math.round(z / 16);
    if (shoreCache.has(k)) return shoreCache.get(k);
    let best = null;
    for (let r = 2; r < 30 && !best; r += 2) for (let a = 0; a < 6.28 && !best; a += 0.4) {
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const lx = px - Math.cos(a) * 1.5, lz = pz - Math.sin(a) * 1.5;
      if (App.columnHeight(Math.floor(px), Math.floor(pz)) < App.SEA && App.genHeight(lx, lz) >= App.SEA) {
        const pond = App.poisNear(px, pz, 40, (p) => { const W = p.lake || p.pool; return !!W && Math.hypot(W.x - px, W.z - pz) < W.r * 1.25 + 2; }).length > 0;
        best = { x: px, z: pz, lx, lz, pond };
      }
    }
    shoreCache.set(k, best);
    if (shoreCache.size > 400) shoreCache.clear();
    return best;
  }

  // only Tickles with a float (Tube) or a surfboard get into the ponds; everyone else stays on the bank
  App.canFloat = (t) => t.holding === "Tube" || t.ground === "Surfs Up" || t.useItem === "Surfs Up";
  App.pondWater = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) < App.SEA &&
    App.poisNear(x, z, 40, (p) => { const W = p.lake || p.pool; return !!W && Math.hypot(W.x - x, W.z - z) < W.r * 1.25 + 2; }).length > 0;

  // ---------- adverts (smart objects) around a place ----------
  const occ = new Map();
  const occKey = (actId, ref) => actId + "|" + ref;
  const occN = (k) => (occ.get(k) || new Set()).size;
  function occAdd(k, t) { if (!occ.has(k)) occ.set(k, new Set()); occ.get(k).add(t.id); }
  function occDel(k, t) { if (occ.has(k)) occ.get(k).delete(t.id); }
  function adverts(t, cx, cz, R) {
    const out = [];
    const near = (x, z) => Math.hypot(x - cx, z - cz) < R;
    for (const a of st.acts) {
      if (!App.actActive(a)) continue;
      switch (a.where) {
        case "home": if (near(t.home.x, t.home.z)) out.push({ act: a, ref: "home" + t.id, spot: t.home }); break;
        case "ground": {
          // its own item, brought out of the inventory, or one the village lends (rods, boards, weights, balls, skates)
          if (ITEM_USE[a.ground] && (t.ground === a.ground || SHARED.has(a.ground))) {
            const u = ITEM_USE[a.ground];
            let spot = null, water = false;
            if (u.spot === "shore") {
              const sh = shoreNear(cx, cz);
              // fishing happens from dry land at the water's edge; surfing goes out on open water (a pond has no waves)
              // (and only the open sea has waves: no surfing on the lake, a channel or a pond)
              if (sh) { if (u.water) { if (!(u.surf && (sh.pond || (App.seaAt && !App.seaAt(sh.x, sh.z))))) { spot = sh; water = true; } } else spot = { x: sh.lx, z: sh.lz }; }
            }
            else {
              const rr = u.spot === "here" ? 3 : u.spot === "open" ? 9 : 12;
              for (let k = 0; k < 6 && !spot; k++) { const ang = rnd() * 6.28, d = rnd() * rr; const x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d; if (App.isLand(x, z)) spot = { x, z }; }
            }
            if (spot) out.push({ act: a, ref: "item" + t.id, spot, ownItem: true, itemName: a.ground, borrowed: t.ground !== a.ground, water, self: u.spot === "here" });
          }
          // someone else's item that is out right now and open to others
          for (const o of st.tickles) {
            const li = o.liveItem;
            if (!li || o === t || li.name !== a.ground || !near(li.x, li.z)) continue;
            out.push({ act: a, ref: "item" + o.id, spot: { x: li.x, z: li.z }, host: o.id, joinItem: true });
          }
          break;
        }
        case "scenery":
          for (const s of App.sceneryVisible) {
            if (s.type !== a.scenery || !near(s.x, s.z)) continue;
            // the ducks swim about, so feeding happens on the bank of their pond
            const pond = s.pond != null ? App.pois[s.pond].lake : null;
            out.push({ act: a, ref: "sc" + Math.round(s.x) + "," + Math.round(s.z), spot: pond ? { x: pond.x, z: pond.z } : { x: s.x, z: s.z }, scenery: s, pondR: pond ? pond.r : 0 });
          }
          break;
        case "prop":
          for (const p of st.props) if (p.assetId === a.assetId && near(p.x, p.z)) out.push({ act: a, ref: p.uid, spot: { x: p.x, z: p.z }, prop: p });
          break;
        case "water": { const s = shoreNear(cx, cz); if (s && (!s.pond || App.canFloat(t))) out.push({ act: a, ref: "w" + Math.round(s.x) + "," + Math.round(s.z), spot: s, water: true }); break; }
        case "plaza": if (st.event && st.event.village != null) { const v = App.villages[st.event.village]; if (near(v.x, v.z)) out.push({ act: a, ref: "plaza" + v.i, spot: { x: v.x, z: v.z } }); } break;
        case "stroll": {
          const ang = rnd() * 6.28, r = 3 + rnd() * 9;
          const x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
          if (App.isLand(x, z)) out.push({ act: a, ref: "stroll" + t.id, spot: { x, z } });
          break;
        }
        case "project":
          for (const pr of st.projects) if (!pr.done && App.actActive(pr) && near(pr.site.x, pr.site.z)) out.push({ act: a, ref: pr.id, spot: pr.site, project: pr });
          break;
        case "projectDone":
          for (const pr of st.projects) if (pr.done && pr.rewardAct === a.id && near(pr.site.x, pr.site.z)) out.push({ act: a, ref: pr.id + "r", spot: pr.site });
          break;
      }
    }
    if (t.holding && HOLD_ACTS[t.holding] && !(t.cool.hold > st.T)) {
      const [name, verb, needs, minutes] = HOLD_ACTS[t.holding];
      const act = { id: "hold_" + t.holding, name, verb, needs, capacity: 1, minutes, where: "self", source: "onchain", status: "core" };
      if (t.holding === "Tube") { // a float is for the water
        const sh = shoreNear(cx, cz);
        if (sh) out.push({ act, ref: "self" + t.id, spot: { x: sh.x, z: sh.z }, water: true, self: true });
      } else out.push({ act, ref: "self" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true });
    }
    return out;
  }
  App.adverts = adverts;

  function urgency(v) { return Math.pow(clamp((100 - v) / 100, 0, 1), 1.5) * 1.6 + 0.06; }
  function utility(t, needs) {
    let u = 0;
    for (const k in needs) {
      const g = needs[k];
      if (g > 0) {
        const pk = k === "hunger" ? t.persona.appetite : k === "energy" ? t.persona.lazy : k === "social" ? t.persona.sociable : t.persona.playful;
        u += (g / 40) * urgency(t.needs[k]) * pk;
      } else if (g < 0) u += (g / 40) * 0.8 * (1 - t.needs[k] / 100) * 1.5;
    }
    return u;
  }
  App.utility = utility;

  // pick something to do around a place; opts.need narrows it to one need, opts.social allows chats
  function choose(t, cx, cz, R, opts) {
    opts = opts || {};
    let best = null, second = null;
    for (const ad of adverts(t, cx, cz, R)) {
      if (ad.act.where === "home" && !opts.home) continue;
      if (opts.need && !((ad.act.needs[opts.need] || 0) > 0)) continue;
      const k = occKey(ad.act.id, ad.ref);
      if (occN(k) >= ad.act.capacity && !(occ.get(k) && occ.get(k).has(t.id))) continue;
      let s = utility(t, ad.act.needs);
      s -= Math.hypot(ad.spot.x - t.pos.x, ad.spot.z - t.pos.z) * 0.006;
      if (ad.act.capacity > 1) s += Math.min(occN(k), 3) * 0.05 * t.persona.sociable;
      s += Math.min(t.fav[ad.act.id] || 0, 10) * 0.012;
      if (ad.host === t.id) s += 0.06;
      // a lent item is a little less tempting than one's own (a wake-boarder loves a surfboard all the same)
      if (ad.borrowed) s -= ad.act.ground === "Surfs Up" && t.holding === "Wake Board" ? -0.05 : 0.07;
      if (st.event && ad.act.id === st.event.actId) s += 0.3;
      if (ad.project) s += 0.18;
      s += rnd() * 0.12;
      if (!best || s > best.s) { second = best; best = { ad, s }; } else if (!second || s > second.s) second = { ad, s };
    }
    if (opts.social) {
      const partner = pickPartner(t);
      if (partner) {
        const s = utility(t, App.actById("chat").needs) + App.relGet(t.id, partner.id) * 0.004 + rnd() * 0.12 + (opts.social === "evening" ? 0.15 : 0);
        if (!best || s > best.s) { startChat(t, partner); return true; }
      }
    }
    const pickd = second && rnd() < 0.15 ? second : best;
    if (!pickd) return false;
    startDo(t, pickd.ad);
    return true;
  }
  function pickPartner(t) {
    let best = null, bs = -1e9;
    for (const o of st.tickles) {
      if (o === t || !available(o)) continue;
      const d = Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z);
      if (d > 14) continue;
      const s = App.relGet(t.id, o.id) * 0.02 + (100 - o.needs.social) * 0.02 - d * 0.08 + rnd();
      if (s > bs) { bs = s; best = o; }
    }
    return best;
  }
  function available(o) {
    if (!o.action) return true;
    if (o.action.order || o.action.kind === "travel") return false;
    if (o.action.kind === "idle") return true;
    const a = o.action.act;
    return !!a && (a.where === "stroll" || a.where === "self") && o.needs.social < 75;
  }
  const BIG_HOMES = new Set(["citadel", "fortress", "keep", "grand", "medium"]);
  function startDo(t, ad, order, until) {
    // the folk of a castle, a mansion or a shared house go to its door and in: they do not crowd at it (stepDo lets
    // them in from a couple of blocks away, or when the crowd at the door holds them up)
    const bigHome = ad.act && (ad.act.where === "home" || INDOOR.has(ad.act.id)) && (() => { const v = App.villageOfToken(t.id); return !!v && BIG_HOMES.has(v.kind); })();
    const spread = bigHome ? 0 : ad.exact ? 0 : ad.self || ad.ownItem ? 0.3 : ad.joinItem ? 1.6 : ad.prop ? ad.prop.rad + 0.7 : ad.item ? ad.item.rad + 0.6 : ad.pondR ? ad.pondR + 2.5 : ad.scenery ? sceneryReach(ad.scenery) : ad.water ? 0.2 : ad.project ? 2.6 : ad.act.where === "plaza" ? 3.5 : ad.work ? 2.5 : 0.9;
    let spot = null;
    for (let k = 0; k < 14 && !spot; k++) {
      const ang = rnd() * Math.PI * 2;
      const c = { x: ad.spot.x + Math.cos(ang) * spread, z: ad.spot.z + Math.sin(ang) * spread };
      if (ad.water || ad.self || App.isLand(c.x, c.z)) spot = c;
    }
    if (!spot) spot = { x: ad.spot.x, z: ad.spot.z };
    if (!ad.water && !bigHome) spot = App.clearOfBuildings(spot);
    t.action = { kind: "do", indoor: bigHome || undefined, act: ad.act, ref: ad.ref, key: occKey(ad.act.id, ad.ref), spot, center: ad.face || ad.spot, phase: "walk", started: st.T,
      water: !!ad.water, project: ad.project || null, prop: ad.prop || null, order: !!order, host: ad.host, until: until || null, item: !!ad.ownItem,
      itemName: ad.itemName || null, shore: ad.spot && ad.spot.lx != null ? { x: ad.spot.lx, z: ad.spot.lz } : null };
    if (ad.ownItem) { if (t.itemObj || t.fishGear) itemVisual(t, null); t.useItem = ad.itemName || null; }
    occAdd(t.action.key, t);
    if (ad.self) t.cool.hold = st.T + 180;
  }
  function sceneryReach(s) {
    const f = App.frag[s.type];
    if (s.type === "duck") return 5;
    if (s.type === "pier") return 3;
    if (s.type === "waterfall") return 5;
    return f ? Math.min(3.2, f.rad * 0.6 + 0.6) : 1.2;
  }
  function startChat(t, o, order) {
    if (o.action) endAction(o);
    const mid = { x: (t.pos.x + o.pos.x) / 2, z: (t.pos.z + o.pos.z) / 2 };
    if (!App.isLand(mid.x, mid.z)) { mid.x = o.pos.x; mid.z = o.pos.z; }
    const act = App.actById("chat");
    const base = { kind: "do", act, phase: "walk", started: st.T, center: mid, chat: true };
    t.action = Object.assign({}, base, { partner: o, spot: { x: mid.x - 0.7, z: mid.z }, lead: true, order: !!order });
    o.action = Object.assign({}, base, { partner: t, spot: { x: mid.x + 0.7, z: mid.z } });
  }
  App.startChat = startChat;
  function endAction(t, done) {
    const a = t.action;
    if (!a) return;
    if (a.key) occDel(a.key, t);
    if (done && a.act && a.act.id === "loot") {
      const r = t.step && t.step.raid ? App.raidById(t.step.raid) : null;
      if (r && !r.done) { r.looted += 4; r.live = true; t.loots = (t.loots || 0) + 1; say(t, "Got some food!", 3); }
    }
    if (done && a.act) {
      t.fav[a.act.id] = (t.fav[a.act.id] || 0) + 1;
      if (a.act.source === "director" || a.act.source === "claude" || a.act.source === "player") a.act.uses = (a.act.uses || 0) + 1;
    }
    if (a.partner && a.partner.action && a.partner.action.partner === t) a.partner.action = null;
    t.action = null;
    t.pivot.rotation.set(0, 0, 0); t.pivot.position.set(0, 0, 0);
    itemVisual(t, null);
    t.useItem = null;
  }
  App.endAction = endAction;
  // show the owner's item only while it is being used
  function itemVisual(t, mode, at) {
    const nm = itemOf(t);
    if (!nm || !ITEM_USE[nm]) { if (!t.itemObj && !t.fishGear) return; mode = null; }
    if (t.itemMode === mode && (!at || !t.itemObj || mode !== "place")) return;
    if (t.itemObj) { t.itemObj.parent && t.itemObj.parent.remove(t.itemObj); t.itemObj = null; }
    if (t.fishGear) { App.scene.remove(t.fishGear.line, t.fishGear.bob); t.fishGear = null; }
    t.itemMode = mode;
    t.liveItem = null;
    if (!mode) return;
    const P = App.pop;
    if (mode === "place" && at) {
      const u = ITEM_USE[nm];
      if (u.join) t.liveItem = { name: nm, x: at.x, z: at.z };
    }
    const lent = nm !== t.ground, idx = lent ? groundIndex(nm) : P.ground[t.id];
    if (idx < 0) return;
    App.itemMesh(idx, lent ? -1 : P.gtheme[t.id]).then(({ md, geo }) => {
      if (t.itemMode !== mode || t.itemObj || !t.group.parent) return;
      const g = new THREE.Group();
      g.add(App.centeredMesh(md, geo, true));
      const IP = ITEM_POSE[nm] || {};
      if ((mode === "carry" || mode === "paw") && t.arms) {
        // in the right paw: a rod held up and forward, weights gripped, anything else carried along
        g.scale.setScalar(mode === "paw" ? IP.scale : nm === "Fishing Rod" ? 0.38 : nm === "Surfs Up" ? 0.6 : 0.5);
        g.position.copy(t.arms.paw);
        g.rotation.x = mode === "paw" ? IP.rot : nm === "Fishing Rod" ? 0.4 : 0;
        t.arms.R.add(g);
      } else if (mode === "carry" || mode === "paw") { g.scale.setScalar(0.7); g.position.set(0.75, 0.55, 0.15); t.pivot.add(g); }
      else if (mode === "ride") { g.scale.setScalar(0.9); g.position.set(0, 0.02, 0); t.group.add(g); }
      else if (mode === "surf") { g.scale.setScalar(0.9); g.rotation.x = -Math.PI / 2; g.position.set(0, 0.05, 1.3); t.group.add(g); }
      else if (mode === "sit" || mode === "ball") {
        // the chair goes under the Tickle; the ball bounces over its head (see itemPose)
        g.position.set(t.pos.x, App.surfaceAt(t.pos.x, t.pos.z).y, t.pos.z);
        g.rotation.y = t.heading;
        if (mode === "ball") g.scale.setScalar(0.8);
        App.scene.add(g);
      } else {
        const face = faceAngle(t);
        if (face != null) t.heading = face;
        const h = face != null ? face : t.heading;
        const side = 2.1, hx = Math.cos(h), hz = -Math.sin(h);
        const x = t.pos.x + hx * side, z = t.pos.z + hz * side;
        g.position.set(x, App.surfaceAt(x, z).y, z);
        g.rotation.y = h;
        App.scene.add(g);
      }
      t.itemObj = g;
    });
  }
  App.itemVisual = itemVisual;
  // which way to set an item down: towards the middle of where the Tickle is working, or
  // towards the water when it is next to a pond
  function faceAngle(t) {
    const a = t.action, x = t.pos.x, z = t.pos.z;
    let target = a && a.center && Math.hypot(a.center.x - x, a.center.z - z) > 0.6 ? a.center : null;
    if (!target) {
      const pond = App.poisNear(x, z, 40, (p) => p.type === "pond" && Math.hypot(p.lake.x - x, p.lake.z - z) < p.lake.r + 10)[0];
      if (pond) target = { x: pond.lake.x, z: pond.lake.z };
    }
    return target ? Math.atan2(target.x - x, target.z - z) : null;
  }
  // walking somewhere goes through the gate when leaving or entering a fenced pen
  function routeVia(t, place) {
    const from = App.penAt(t.pos.x, t.pos.z), to = App.penAt(place.x, place.z);
    const pre = from && from !== to ? [from.gateIn, from.gateOut] : [], post = to && to !== from ? [to.gateOut, to.gateIn] : [];
    const a = pre.length ? pre[pre.length - 1] : t.pos, b = post.length ? post[0] : place;
    const mid = App.route(a.x, a.z, b.x, b.z).slice(1, post.length ? -1 : undefined);
    return pre.concat(mid, post, post.length ? [{ x: place.x, z: place.z }] : []);
  }
  function startTravel(t, place, label, slow) {
    t.action = { kind: "travel", path: routeVia(t, place), label: label || place.label, started: st.T, slow: slow || 0, stepS: t.step ? t.step.s : null };
  }

  // orders from the player (only your own Tickles when you play as a holder)
  App.canOrder = (t) => st.mode === "manual" && (!st.wallet || App.isMine(t.id));
  App._startDo = (t, ad, order, until) => startDo(t, ad, order, until); // for testing by hand
  App.startDo = startDo; App.startTravel = startTravel; App.walkTo = walkTo; // for the contests, diving and first person
  App.order = (t, what) => {
    endAction(t);
    t.queue = [];
    if (what.kind === "goto") { t.action = { kind: "travel", path: App.route(t.pos.x, t.pos.z, what.spot.x, what.spot.z).slice(1), order: true, started: st.T, label: "where you sent them" }; return; }
    if (what.kind === "chat") return startChat(t, what.partner, true);
    if (what.kind === "prop") {
      const asset = App.assetById(what.prop.assetId);
      const act = asset && st.acts.find((a) => a.assetId === asset.id && App.actActive(a));
      if (act) return startDo(t, { act, ref: what.prop.uid, spot: { x: what.prop.x, z: what.prop.z }, prop: what.prop }, true);
      t.action = { kind: "travel", path: [{ x: what.prop.x + 1.5, z: what.prop.z }], order: true, started: st.T };
      return;
    }
    if (what.kind === "need") {
      if (!choose(t, t.pos.x, t.pos.z, 60, { need: what.need })) App.toast(t.name + " has nothing nearby for " + NEED_LABEL[what.need].toLowerCase() + ".");
      else t.action.order = true;
      return;
    }
    if (what.kind === "home") { startTravel(t, t.home, "home"); t.action.order = true; }
  };

  // ---------- the brain: follow today's plan, look after urgent needs ----------
  const PICNIC = { id: "picnic", name: "Have a snack", verb: "is having a snack", needs: { hunger: 26 }, capacity: 9, minutes: 10, where: "self", source: "core", status: "core" };
  const RECOVER = { id: "recover", name: "Recover", verb: "is recovering at home", needs: { energy: 10 }, capacity: 1, minutes: 60, where: "home", source: "core", status: "core" };
  const LOOT = { id: "loot", name: "Grab food", verb: "is grabbing food from the granary", needs: { hunger: 6 }, capacity: 99, minutes: 6, where: "self", source: "core", status: "core" };
  const CHANT = { id: "chant", name: "Revival ritual", verb: "is chanting round the altar", needs: { social: 14, fun: 4 }, capacity: 99, minutes: 8, where: "self", anim: "chant", source: "core", status: "core" };
  const WATCH_ARENA = { id: "watch_arena", name: "Tournament", verb: "is waiting for a turn in the arena", needs: { fun: 10, social: 6 }, capacity: 99, minutes: 5, where: "self", source: "core", status: "core", anim: "sitWatch" };
  const HOME_EVE = { id: "shelter", name: "An evening at home", verb: "is spending the evening indoors", needs: { social: 4, energy: 6 }, capacity: 99, minutes: 30, where: "home", source: "core", status: "core" };
  const WAR_SHELTER = { id: "shelter", name: "Keep indoors", verb: "is keeping indoors while the battle is on", needs: {}, capacity: 9, minutes: 30, where: "home", source: "core", status: "core" };
  const SHELTER = { id: "shelter", name: "Hide from the dragon", verb: "is hiding at home from the dragon", needs: {}, capacity: 9, minutes: 30, where: "home", source: "core", status: "core" };
  const WATCH = { id: "watch", name: "Keep watch", verb: "is watching the sky for the dragon", needs: {}, capacity: 99, minutes: 4, where: "self", source: "core", status: "core" };
  // meals come out of the village granary; an empty granary means a poor meal
  function meal(t, kind) {
    const has = t.village.food >= 1, g = has ? 40 : 12;
    if (!has && rnd() < 0.6) say(t, "The granary is empty\u2026", 4);
    return kind === "breakfast" ? { id: "breakfast", name: "Breakfast at home", verb: "is having breakfast at home", needs: { hunger: g }, capacity: 1, minutes: 14, where: "self", source: "core", status: "core" }
      : { id: "dinner", name: "Dinner by the fire", verb: "is having dinner with the village", needs: { hunger: g, social: 12 }, capacity: 99, minutes: 25, where: "self", source: "core", status: "core", anim: "sitEat" };
  }
  // where a villager sits for dinner on the square: two to a log round the fire, the rest on the ground in a ring behind
  function dinnerSeat(t) {
    const v = t.village, list = v.residents, i = Math.max(0, list.indexOf(t.id));
    if (v.seats && i < v.seats.length) return { x: v.seats[i].x, z: v.seats[i].z, log: true };
    if (v.seats) { const j = i - v.seats.length, n = Math.max(1, list.length - v.seats.length), big = list.length > 24, a = (j / n) * 6.28 * (big ? 3 : 1) + 0.3, R = big ? 10.5 + (j % 3) * 3.2 : 9.4; return { x: v.x + Math.cos(a) * R, z: v.z + Math.sin(a) * R, log: false }; }
    if (i < 8) {
      const k = i >> 1, a = (k / 4) * 6.28 + 0.4, side = i % 2 ? 0.75 : -0.75, tx = -Math.sin(a), tz = Math.cos(a);
      return { x: v.x + Math.cos(a) * 4.2 + tx * side, z: v.z + Math.sin(a) * 4.2 + tz * side, log: true };
    }
    const n = Math.max(1, list.length - 8), j = i - 8, a = (j / n) * 6.28 + 0.2, R = 6.6 + (j % 3) * 1.9;
    return { x: v.x + Math.cos(a) * R, z: v.z + Math.sin(a) * R, log: false };
  }
  function ateToday(t, k) { const key = Math.floor(st.T / 1440) + k; t.meals = t.meals || {}; if (t.meals[key]) return true; t.meals[key] = 1; return false; }
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function closestFoe(t, ok, R) {
    let best = null, bd = R;
    for (const o of st.tickles) {
      if (o === t || App.isKO(o.id) || !ok(o) || (o.action && (o.action.kind === "fight" || o.action.kind === "ko"))) continue;
      const d = dist2(o.pos, t.pos);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  function startFight(a, b, raid) {
    if (b.action) endAction(b);
    const mid = { x: (a.pos.x + b.pos.x) / 2, z: (a.pos.z + b.pos.z) / 2 };
    if (!App.isLand(mid.x, mid.z)) { mid.x = b.pos.x; mid.z = b.pos.z; }
    const base = { kind: "fight", phase: "walk", started: st.T, raid: raid ? raid.id : null };
    a.action = Object.assign({}, base, { partner: b, spot: { x: mid.x - 0.7, z: mid.z }, lead: true });
    b.action = Object.assign({}, base, { partner: a, spot: { x: mid.x + 0.7, z: mid.z } });
  }
  App.startFight = startFight;
  // a raider: walk to the rival granary, fight whoever stands in the way, grab food twice, go home
  function raidBrain(t, step) {
    const r = App.raidById(step.raid);
    if (!r || r.done || (t.lootRaid === r.id && t.loots >= 2)) return startTravel(t, t.home, "home from the raid");
    const o = App.villages[r.to], g = o.granary;
    if (dist2(g, t.pos) > 7) return startTravel(t, step.p, "raiding " + o.name);
    r.live = true;
    const foe = closestFoe(t, (x) => x.village.i === r.to, 9);
    if (foe) return startFight(t, foe, r);
    if (t.lootRaid !== r.id) { t.lootRaid = r.id; t.loots = 0; }
    if (rnd() < 0.3) say(t, "Grab the food!", 3);
    return startDo(t, { act: LOOT, ref: "loot" + t.id, spot: { x: g.x + (rnd() - 0.5) * 4, z: g.z + (rnd() - 0.5) * 4 }, face: { x: g.x, z: g.z } });
  }
  // against a dragon every clan fights together: gather at the granary, then pelt it with stones
  function defendBrain(t, step) {
    const a = App.attackById(step.attack), o = a ? App.villages[a.to] : t.village;
    if (!a || a.done || st.T >= a.t1) { t.action = { kind: "idle", until: st.T + 4 }; return; }
    const D = App.liveDragon && App.liveDragon(a);
    if (D) {
      const d = Math.hypot(D.x - t.pos.x, D.z - t.pos.z);
      if (d > 30) return startTravel(t, { x: D.x, z: D.z }, "to fight the dragon");
      if (App.joinFight(t, D)) return;
      return App.hideFrom(t, D);
    }
    if (dist2(step.p, t.pos) > 4) return startTravel(t, step.p, "to defend " + o.name);
    if (rnd() < 0.12) say(t, rnd() < 0.5 ? "Where is it?" : "Stay close to the granary!", 3);
    return startDo(t, { act: WATCH, ref: "watch" + t.id, spot: { x: t.pos.x, z: t.pos.z }, face: { x: o.granary.x, z: o.granary.z } });
  }
  // afternoon chores: farming, hunting, herding, gathering, fishing
  function choreBrain(t, step, dayStart) {
    const c = step.chore || App.choreOf(t.id), info = App.CHORE_INFO[c], p = step.p, until = dayStart + step.e;
    if (c === "hunt") {
      const prey = App.preyNear && App.preyNear(t.pos.x, t.pos.z, 40);
      if (prey) { t.action = { kind: "hunt", prey, until: Math.min(until, st.T + 25), started: st.T }; if (rnd() < 0.4) say(t, "Shh\u2026 there's one.", 3); return; }
    }
    if (c === "sheep" && t.village.fold) return shepherdBrain(t, step, until);
    if (c === "build") {
      const act = { id: "chore_build", name: "Rebuilding", verb: ["is hammering planks", "is carrying timber", "is laying stones"][Math.floor(rnd() * 3)], needs: info.needs, capacity: 99, minutes: 15, where: "work", anim: "dig", source: "core", status: "core" };
      return startDo(t, { act, ref: "chore" + t.id, spot: { x: p.x + (rnd() - 0.5) * 2, z: p.z + (rnd() - 0.5) * 2 }, exact: true, face: { x: p.cx, z: p.cz } }, false, Math.min(until, st.T + 15));
    }
    if ((c === "pigs" || c === "chickens") && App.penAt(t.pos.x, t.pos.z) !== (c === "pigs" ? t.village.pen : t.village.yard)) return startTravel(t, p, p.label);
    if (c === "pigs" || c === "chickens") {
      const pen = c === "pigs" ? t.village.pen : t.village.yard, at = c === "pigs" ? pen.trough : pen.coop;
      const spot = { x: at.x + (rnd() - 0.5) * 2.4, z: at.z + (rnd() - 0.5) * 2.4 };
      const act = { id: "chore_" + c, name: info.label, verb: c === "pigs" ? (rnd() < 0.5 ? "is filling the pigs' trough" : "is scrubbing the pigs") : rnd() < 0.5 ? "is collecting eggs" : "is scattering grain for the hens",
        needs: info.needs, capacity: 99, minutes: 15, where: "work", anim: c === "pigs" ? "dig" : "reach", source: "core", status: "core" };
      return startDo(t, { act, ref: "chore" + t.id, spot: App.penAt(spot.x, spot.z) === pen ? spot : { x: pen.x, z: pen.z }, exact: true, face: at }, false, Math.min(until, st.T + 15));
    }
    if (c === "fish") {
      const act = { id: "chore_fish", name: info.label, verb: info.verb, needs: info.needs, capacity: 99, minutes: 240, where: "work", source: "core", status: "core" };
      if (!byWater(t)) act.verb = "is mending fishing nets";
      return startDo(t, { act, ref: "chore" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true, work: true, ownItem: t.ground === "Fishing Rod" && byWater(t), face: p.cx != null ? { x: p.cx, z: p.cz } : null }, false, until);
    }
    const R = c === "farm" ? 2.5 : 7;
    let spot = null;
    for (let k = 0; k < 8 && !spot; k++) { const a = rnd() * 6.28, d = rnd() * R, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (App.isLand(x, z)) spot = { x, z }; }
    spot = spot || { x: t.pos.x, z: t.pos.z };
    const act = { id: "chore_" + c, name: info.label, verb: c === "hunt" ? "is tracking game" : info.verb, needs: info.needs, capacity: 99, minutes: c === "farm" ? 30 : 12, where: "work",
      anim: c === "farm" ? "dig" : c === "gather" ? "reach" : null, source: "core", status: "core" };
    return startDo(t, { act, ref: "chore" + t.id, spot, work: true, face: c === "farm" || c === "hunt" ? null : p.cx != null ? { x: p.cx, z: p.cz } : null }, false, Math.min(until, st.T + act.minutes));
  }
  // a rod only comes out within a cast of the water; away from it a fisher mends nets instead
  const byWater = (t) => {
    // open water right round it (off the side of a jetty, at the edge of the bank)...
    for (const r of [1.5, 2.6]) for (let a = 0; a < 6.28; a += 0.785) { const x = t.pos.x + Math.cos(a) * r, z = t.pos.z + Math.sin(a) * r; if (App.columnHeight(Math.floor(x), Math.floor(z)) < App.SEA && App.deckY(x, z) == null) return true; }
    // ...or a shore within a short walk
    const sh = shoreNear(t.pos.x, t.pos.z); return !!sh && Math.hypot(sh.x - t.pos.x, sh.z - t.pos.z) < 9;
  };
  App.byWater = byWater;
  function doJob(t, step, dayStart) {
    const info = t.jobInfo, p = step.p, rod = t.ground === "Fishing Rod", dry = rod && !byWater(t);
    const act = { id: "job_" + t.job, name: info.title, verb: dry ? "is mending fishing nets" : info.verb, needs: info.needs, capacity: 99, minutes: 240, where: "work", source: "core", status: "core" };
    return startDo(t, { act, ref: "job" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true, work: true, ownItem: JOB_ITEM[t.job] === t.ground && !dry, face: p.cx != null ? { x: p.cx, z: p.cz } : null }, false, dayStart + step.e);
  }
  // the shepherd takes the flock out of the fold to graze and brings it back before the chore ends
  function shepherdBrain(t, step, until) {
    const v = t.village, fold = v.fold, g = v.grazing;
    if (until - st.T < 35) {
      t.leading = false;
      if (Math.hypot(fold.gateOut.x - t.pos.x, fold.gateOut.z - t.pos.z) > 2) return startTravel(t, fold.gateOut, "bringing the flock home", 0.8);
      return startDo(t, { act: { id: "count_sheep", name: "Count the sheep", verb: "is counting the sheep back in", needs: { fun: 4 }, capacity: 9, minutes: 10, where: "self", source: "core", status: "core" }, ref: "count" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: fold.x, z: fold.z } }, false, until);
    }
    // first fetch the flock from the fold, then lead it out
    const day = Math.floor(st.T / 1440);
    if (t.flockDay !== day) {
      if (Math.hypot(fold.gateOut.x - t.pos.x, fold.gateOut.z - t.pos.z) > 2) return startTravel(t, fold.gateOut, "to the sheepfold");
      t.flockDay = day;
    }
    t.leading = true;
    if (Math.hypot(g.x - t.pos.x, g.z - t.pos.z) > 9) return startTravel(t, g, "leading the flock to pasture", 0.75);
    const a = rnd() * 6.28, d = rnd() * 6, spot = { x: g.x + Math.cos(a) * d, z: g.z + Math.sin(a) * d };
    return startDo(t, { act: { id: "chore_sheep", name: "Shepherding", verb: "is watching over the flock", needs: App.CHORE_INFO.sheep.needs, capacity: 99, minutes: 12, where: "work", source: "core", status: "core" }, ref: "chore" + t.id, spot: App.isLand(spot.x, spot.z) ? spot : { x: t.pos.x, z: t.pos.z }, work: true }, false, Math.min(until, st.T + 12));
  }
  function brain(t) {
    t.leading = false;
    const { step } = App.planStep(t.id, st.T);
    t.step = step;
    // fallen: the spirit waits at the village altar for the revival ritual
    if (App.isDead(t.id)) { t.action = { kind: "spirit", spot: App.altarSpot(t.id), started: st.T }; return; }
    const hm = App.homeOf(t.id); t.home.x = hm.x; t.home.z = hm.z;
    // knocked out: home to rest until recovered
    const ko = App.pop.ko[t.id];
    if (ko > st.T) {
      if (Math.hypot(t.home.x - t.pos.x, t.home.z - t.pos.z) > 1.5) return startTravel(t, t.home, "home to recover");
      return startDo(t, { act: RECOVER, ref: "home" + t.id, spot: t.home }, false, ko);
    }
    // a contest: competing, judging or watching (contests.js); a Tickle you entered goes even when you are in control
    if ((step.k === "contest" || step.k === "contestWatch") && App.contestBrain && App.contestBrain(t, step)) return;
    // down to the water to fight a sea beast (seabeasts.js)
    if (step.k === "seadefend" && App.seaBrain && App.seaBrain(t, step)) return;
    // at war: mustering, marching in column, fighting at the front, or carrying the spoils home (war.js)
    if (step.k === "war" && App.warBrain && App.warBrain(t, step)) return;
    const ownTickle = st.wallet && App.isMine(t.id);
    if (st.mode === "manual" && !st.freeWill && (ownTickle || !st.wallet)) { t.action = { kind: "idle", until: st.T + 10 }; return; }
    if (step.k === "dive" && App.diveBrain && App.diveBrain(t, step)) return;
    // the Blacksmiths' Guild's smiths and groom, a shopping trip, out sailing its own boat (wealth.js)
    if (App.wealthBrain && App.wealthBrain(t, step)) return;
    // up for sale: in the prison (prison.js)
    if (App.prisonBrain && App.prisonBrain(t, step)) return;
    // a minister in the Parliament (parliament.js)
    if (App.parliamentBrain && App.parliamentBrain(t, step)) return;
    if (step.k === "raid") return raidBrain(t, step);
    if (step.k === "ritual") {
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 1.2) return startTravel(t, step.p, "to the ritual");
      return startDo(t, { act: CHANT, ref: "ritual" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: step.p.cx, z: step.p.cz } }, false, st.T + 8);
    }
    if (step.k === "adventure") {
      const r = App.adventureBrain(t, step);
      if (r && r.travel) return startTravel(t, r.travel, "to " + r.travel.label);
      if (r && r.set) return;
    }
    if (step.k === "arena") {
      const r = App.arenaBrain(t, step);
      if (r.travel) return startTravel(t, r.travel, "to the arena");
      return startDo(t, { act: WATCH_ARENA, ref: "arena" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: r.face.x, z: r.face.z } }, false, st.T + 5);
    }
    if (step.k === "defend") return defendBrain(t, step);
    if (step.k === "ferry") return ferryBrain(t, step, Math.floor(st.T / 1440) * 1440);
    if (step.k === "boat") {
      // the boatman: to the dock, then at the helm all day
      const F = App.ferries[step.ferry], f = App.ferryAt(F, st.T);
      if (Math.hypot(f.x - t.pos.x, f.z - t.pos.z) > 14 && Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 3) return startTravel(t, step.p, "to the boat");
      endAction(t);
      t.action = { kind: "ride", ferry: F.i, side: "a", captain: true, seat: F.launch ? { r: 0, f: -2.9 } : { r: 0, f: -3.9 }, started: st.T, until: Math.floor(st.T / 1440) * 1440 + step.e }; // at the helm, on the stern
      return;
    }
    if (step.k === "ether") {
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 1.5) return startTravel(t, step.p, "to the Ether field");
      App.gatheredEther(t);
      return startDo(t, { act: App.GATHER_ETHER, ref: "ether" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: step.p.cx, z: step.p.cz } }, false, st.T + 10);
    }
    if (step.k === "mine") {
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 2) return startTravel(t, step.p, "to the mine");
      t.action = { kind: "mining", mine: App.mines[step.p.mine], until: Math.floor(st.T / 1440) * 1440 + step.e, started: st.T };
      if (rnd() < 0.4) say(t, "Down the mine we go!", 2);
      return;
    }
    if (step.k === "casino") {
      // a night at the casino: inside until it is over (what it plays is decided at the tables, casino.js)
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 2) return startTravel(t, step.p, "to the casino");
      const Cs = App.casinos && App.casinos[step.p.casino];
      t.action = { kind: "rounds", until: Math.floor(st.T / 1440) * 1440 + step.e, started: st.T, bye: step.p.staff ? "Another night at the tables done." : ["What a night!", "Next time I win it all.", "My shells!", "Luck was with me tonight!"][Math.floor(rnd() * 4)], what: (step.p.staff ? "Dealing at " : "At ") + (Cs ? Cs.name : "the casino") };
      return;
    }
    if (step.k === "guildhall") {
      // free time at the guild hall: indoors until it is over
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 2) return startTravel(t, step.p, "to the guild hall");
      t.action = { kind: "rounds", until: Math.floor(st.T / 1440) * 1440 + step.e, started: st.T, bye: "Good to catch up at the guild.", what: "At the hall of the " + (App.GUILDS && App.GUILDS[step.p.hall] ? App.GUILDS[step.p.hall].name : "guild") };
      return;
    }
    if (step.k === "wallwatch" && step.ww) {
      // a turn on the walls: in through the gate, up the stairs of its tower, along the top and back
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 2.5 && !(t.action && t.action.kind === "wallwatch")) return startTravel(t, step.p, "to keep watch on the walls");
      t.action = { kind: "wallwatch", ww: step.ww, start: st.T, until: Math.floor(st.T / 1440) * 1440 + step.e, back: { x: step.p.x, z: step.p.z } };
      if (rnd() < 0.4) say(t, "Up on the walls. Nothing gets past us.", 2);
      return;
    }
    if (step.k === "rounds") {
      // the guard who goes down inside: out of sight in the mine until the afternoon is over
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 2) return startTravel(t, step.p, "to guard the mine");
      t.action = { kind: "rounds", until: Math.floor(st.T / 1440) * 1440 + step.e, started: st.T };
      if (rnd() < 0.5) say(t, "Down I go: no goblin touches our miners.", 2);
      return;
    }
    if (step.k === "pray") {
      if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 1.5) return startTravel(t, step.p, "to the statue of the Maker");
      App.prayed(t);
      return startDo(t, { act: App.PRAY, ref: "pray" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: step.p.cx, z: step.p.cz } }, false, st.T + 8);
    }
    if (step.k === "indoors") {
      if (Math.hypot(t.home.x - t.pos.x, t.home.z - t.pos.z) > 1.5) return startTravel(t, t.home, "home for the evening");
      return startDo(t, { act: HOME_EVE, ref: "home" + t.id, spot: t.home }, false, Math.floor(st.T / 1440) * 1440 + step.e);
    }
    if (step.k === "shelter" || step.k === "rainshelter") {
      if (Math.hypot(t.home.x - t.pos.x, t.home.z - t.pos.z) > 1.5) return startTravel(t, t.home, step.warShelter ? "home: there is a battle" : step.k === "rainshelter" ? "home out of the weather" : "home to hide from the dragon");
      return startDo(t, { act: step.warShelter ? WAR_SHELTER : SHELTER, ref: "home" + t.id, spot: t.home }, false, Math.floor(st.T / 1440) * 1440 + step.e);
    }
    if (App.FACTION_STEPS && App.FACTION_STEPS[step.k]) {
      const r = App.factionBrain(t, step);
      if (r && r.set) return;
      if (r && r.travel) return startTravel(t, r.travel, r.why, r.slow);
      if (r && r.act) return startDo(t, { act: r.act, ref: r.act.id + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: r.face }, false, r.until);
    }
    const urgent = NEEDS.filter((k) => k !== "energy" && t.needs[k] < 16).sort((a, b) => t.needs[a] - t.needs[b])[0];
    if (urgent && step.k !== "sleep") {
      if (choose(t, t.pos.x, t.pos.z, 45, { need: urgent })) return;
      if (urgent === "hunger") return startDo(t, { act: PICNIC, ref: "self" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true });
    }
    const p = step.p;
    // a fisher's day on the lake: a rowing boat if one is free at the dock, otherwise its own place on the
    // jetty or along the bank (there are only four boats; nobody waits about in a heap on the bank)
    if (step.k === "job" && p.boat != null && App.dockSpot) {
      const D = App.docks[p.boat], day = Math.floor(st.T / 1440), ds = day * 1440;
      if (t.boatTried !== day) {
        if (Math.hypot(D.land.x - t.pos.x, D.land.z - t.pos.z) > 3) return startTravel(t, p);
        t.boatTried = day;
        if (App.boatJob && App.boatJob(t, step, ds)) return;
      }
      const sp = App.dockSpot(t.id, D);
      if (sp) {
        if (Math.hypot(sp.x - t.pos.x, sp.z - t.pos.z) > 0.8) return startTravel(t, { x: sp.x, z: sp.z, label: D.name }, "to fish from " + D.name);
        return doJob(t, Object.assign({}, step, { p: { x: sp.x, z: sp.z, cx: sp.cx, cz: sp.cz } }), ds);
      }
    }
    const far = Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > (step.k === "sleep" || step.k === "morning" ? 1.5 : 4);
    if (step.k === "sleep") {
      if (far) return startTravel(t, p, "home");
      return startDo(t, { act: App.actById("rest"), ref: "home" + t.id, spot: t.home }, false, st.T + (Math.floor(st.T / 1440) * 1440 + step.e - st.T));
    }
    // the shepherd goes wherever the flock is, so the usual "go to the place first" does not apply
    if (step.k === "chore" && step.chore === "sheep" && t.village.fold) return shepherdBrain(t, step, Math.floor(st.T / 1440) * 1440 + step.e);
    if (far) return startTravel(t, p);
    const dayStart = Math.floor(st.T / 1440) * 1440;
    if (step.k === "morning") {
      if (!ateToday(t, "b")) return startDo(t, { act: meal(t, "breakfast"), ref: "meal" + t.id, spot: { x: t.home.x, z: t.home.z }, exact: true });
      // breakfast done: off to work rather than hanging about at the door
      const js = App.planOf(t.id, Math.floor(st.T / 1440)).steps.find((s) => s.k === "job");
      if (js && Math.hypot(js.p.x - t.pos.x, js.p.z - t.pos.z) > 4) return startTravel(t, js.p, "to work");
      if (js) return doJob(t, js, dayStart);
    }
    if (step.k === "chore") return choreBrain(t, step, dayStart);
    if (step.k === "evening" && !ateToday(t, "d")) {
      // on its own village square: a seat round the fire, facing it
      const v = t.village;
      if (Math.hypot(p.x - v.x, p.z - v.z) < 16) { const seat = dinnerSeat(t); startDo(t, { act: meal(t, "dinner"), ref: "meal" + t.id, spot: { x: seat.x, z: seat.z }, exact: true, face: { x: v.x, z: v.z } }); if (t.action) t.action.seat = seat.log ? "log" : "ground"; return; }
      return startDo(t, { act: meal(t, "dinner"), ref: "meal" + t.id, spot: { x: t.pos.x, z: t.pos.z }, face: p.cx != null ? { x: p.cx, z: p.cz } : null });
    }
    if (step.k === "job" && step.p.boat != null && App.boatJob && App.boatJob(t, step, dayStart)) return;
    if (step.k === "job") return doJob(t, step, dayStart);
    if (step.k === "lunch") {
      if (choose(t, p.x, p.z, 28, { need: "hunger" })) return;
      return startDo(t, { act: PICNIC, ref: "self" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true });
    }
    if (step.k === "leisure" && step.taming && App.tamingBrain(t, step)) return;
    const social = step.k === "evening" ? "evening" : "yes";
    if (choose(t, p.x, p.z, step.k === "morning" ? 16 : 30, { social })) return;
    t.action = { kind: "idle", until: st.T + 6 + rnd() * 6 };
  }

  // ---------- per-frame update ----------
  const DECAY = { hunger: 0.11, energy: 0.075, social: 0.1, fun: 0.11 };
  function say(t, text, mins) { t.bubble = { text, until: st.T + (mins || 3) }; }
  App.say = say;

  // Tickles climb or drop at most two blocks per step; a cliff in the way means a detour round it
  const MAX_STEP = 2;
  const colH = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z));
  App.climbOK = (x0, z0, x1, z1) => {
    const h0 = colH(x0, z0), h1 = colH(x1, z1), S0 = App.SEA;
    if (h0 >= S0 && h1 >= S0) return Math.abs(h1 - h0) <= MAX_STEP;
    if (h0 < S0 && h1 >= S0) return h1 <= S0 + MAX_STEP; // climbing out of the water onto a low bank
    return true;
  };
  // ---------- buildings stand in the way ----------
  // Every building (houses, halls, granaries, mansions, castles, a fortress's walls, the guild halls, the casinos...)
  // is something a Tickle walks round, never through: its footprint is the box of its model, turned with it. A gate
  // leaves its arch open. Only fences, troughs, docks and piers, the Ether fields, the log seats and the fire are
  // walked over or past as before; sheds, stables, roosts, altars, the statue, cave and mine mouths are buildings.
  // A building is gone into and left only by its doors (doorway, below): the middle of its front, or for an arena
  // the gate on each of its four sides.
  const BC = 8, bcells = new Map(), NO_BLOCK = /^(fence|dock|pier|trough|etherfield|logseat|campfire|plotsign)/;
  let bBuilt = -1e9;
  const bkey = (cx, cz) => cx * 100003 + cz;
  function footprintsOf(s0) {
    const F = App.frag[s0.type];
    if (!F || !F.box) return null;
    const k = s0.scale || 1, c = Math.cos(s0.rot || 0), sn = Math.sin(s0.rot || 0);
    if (s0.type.startsWith("gatehouse")) {
      // the two towers either side of the arch
      const off = (380 / 160) * k, hw = (140 / 160) * k, hd = (150 / 160) * k;
      const both = [{ x: s0.x + c * off, z: s0.z - sn * off, c, s: sn, hx: hw, hz: hd, sc: s0 }, { x: s0.x - c * off, z: s0.z + sn * off, c, s: sn, hx: hw, hz: hd, sc: s0 }];
      // the great gate shut fast in a war closes the arch too (war.js)
      if (App.gateShut && App.gateShut(s0)) both.push({ x: s0.x, z: s0.z, c, s: sn, hx: off - hw, hz: 0.6, sc: s0 });
      return both;
    }
    // the base of the building: its cubes in the first two blocks up (so the eaves and the roof do not count, and
    // the walls do, to the edge)
    const G = groundBox(F), pad = s0.wall ? 0.35 : 0; // (a wall's stretches overlap, so there is no gap to slip through)
    const ox = ((G.x0 + G.x1) / 2) * k, oz = ((G.z0 + G.z1) / 2) * k;
    return [{ x: s0.x + ox * c + oz * sn, z: s0.z - ox * sn + oz * c, c, s: sn, hx: ((G.x1 - G.x0) / 2) * k + pad, hz: Math.max(s0.wall ? 0.9 : 0, ((G.z1 - G.z0) / 2) * k), sc: s0 }];
  }
  function groundBox(F) {
    if (F.ground) return F.ground;
    const md = F.md, P = md && md.position, e = F.local.elements, sx = e[0], tx = e[12], ty = e[13], tz = e[14];
    const G = { x0: F.box.min.x - (F.box.min.x + F.box.max.x) / 2, x1: F.box.max.x - (F.box.min.x + F.box.max.x) / 2, z0: F.box.min.z - (F.box.min.z + F.box.max.z) / 2, z1: F.box.max.z - (F.box.min.z + F.box.max.z) / 2 };
    if (P && P.length) {
      let y0 = Infinity;
      for (let i = 1; i < P.length; i += 3) y0 = Math.min(y0, P[i] * sx + ty);
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
      for (let i = 0; i < P.length; i += 3) {
        if (P[i + 1] * sx + ty > y0 + 2) continue;
        const x = P[i] * sx + tx, z = P[i + 2] * sx + tz;
        if (x < a) a = x; if (x > b) b = x; if (z < c) c = z; if (z > d) d = z;
      }
      if (b > a && d > c) { G.x0 = a; G.x1 = b; G.z0 = c; G.z1 = d; }
    }
    return (F.ground = G);
  }
  // (rebuilt every few seconds: buildings are moved by the hand, burn down and go back up, and their models load late)
  function buildBlocks() {
    bcells.clear();
    for (const s0 of App.sceneryAll || []) {
      if (!s0.building || s0.gone || s0.y != null && s0.y > App.genHeight(s0.x, s0.z) + 0.5 || NO_BLOCK.test(s0.type) || (s0.ruined && s0.wall)) continue; // (a wall broken in a war is a gap)
      const fps = footprintsOf(s0);
      if (!fps) continue;
      for (const f of fps) {
        const r = Math.hypot(f.hx, f.hz);
        for (let cx = Math.floor((f.x - r) / BC); cx <= Math.floor((f.x + r) / BC); cx++) for (let cz = Math.floor((f.z - r) / BC); cz <= Math.floor((f.z + r) / BC); cz++) {
          const kk = bkey(cx, cz);
          (bcells.get(kk) || bcells.set(kk, []).get(kk)).push(f);
        }
      }
    }
  }
  const insideF = (f, x, z) => { const dx = x - f.x, dz = z - f.z; return Math.abs(dx * f.c - dz * f.s) < f.hx && Math.abs(dx * f.s + dz * f.c) < f.hz; };
  // the footprint of the building standing at a point, if any
  App.buildingAt = (x, z) => {
    const now = performance.now();
    if (now - bBuilt > 4000) { bBuilt = now; buildBlocks(); }
    const list = bcells.get(bkey(Math.floor(x / BC), Math.floor(z / BC)));
    if (list) for (const f of list) if (insideF(f, x, z)) return f;
    return null;
  };
  // for animals, creatures and monsters: a step from (x0, z0) to (x1, z1) into a building they are not already in
  App.buildingBlocks = (x0, z0, x1, z1) => { const f = App.buildingAt(x1, z1); return !!f && !insideF(f, x0, z0); };
  // in the way of t going from where it stands to target: a building that holds neither of them
  const inTheWay = (x, z, t, a, b) => { const f = App.buildingAt(x, z); return !!f && !insideF(f, t.pos.x, t.pos.z) && !(a && insideF(f, a.x, a.z)) && !(b && insideF(f, b.x, b.z)); };
  // a spot inside a building is moved out to just beside it, through its nearest side
  App.clearOfBuildings = (p) => {
    const f = App.buildingAt(p.x, p.z);
    if (!f) return p;
    const dx = p.x - f.x, dz = p.z - f.z, lx = dx * f.c - dz * f.s, lz = dx * f.s + dz * f.c;
    let nx = lx, nz = lz;
    if (f.hx - Math.abs(lx) < f.hz - Math.abs(lz)) nx = Math.sign(lx || 1) * (f.hx + 0.8); else nz = Math.sign(lz || 1) * (f.hz + 0.8);
    return { x: f.x + nx * f.c + nz * f.s, z: f.z - nx * f.s + nz * f.c };
  };
  // ---------- doors ----------
  // A Tickle whose way goes into a building it is not in walks first to the nearest of its doors, and one leaving a
  // building walks out by the nearest door first; the walls of a fortress are passed through their gates (they are
  // walked round as any building, and the gatehouse's arch is open). The models face +z: the door is in the middle
  // of the front, just outside the base of the model.
  function doorsOf(f) {
    const ez = f.hz + 0.7, ex = f.hx + 0.7;
    const L = (lx, lz) => ({ x: f.x + lx * f.c + lz * f.s, z: f.z - lx * f.s + lz * f.c });
    return /^arena/.test(f.sc.type) ? [L(0, ez), L(0, -ez), L(ex, 0), L(-ex, 0)] : [L(0, ez)];
  }
  App.doorsOf = (s0) => { const f = (footprintsOf(s0) || [])[0]; return f ? doorsOf(f) : []; };
  function doorway(t, target) {
    const fT = App.buildingAt(target.x, target.z), fS = App.buildingAt(t.pos.x, t.pos.z);
    if (fT === fS || (fT && fS && fT.sc === fS.sc)) return null;
    // leaving comes first, then going in
    const f = fS || fT;
    if (f.sc.wall) return null;
    let best = null, bd = 1e9;
    for (const d of doorsOf(f)) { const dd = Math.hypot(d.x - t.pos.x, d.z - t.pos.z) + Math.hypot(d.x - target.x, d.z - target.z) * 0.5; if (dd < bd) { bd = dd; best = d; } }
    if (!best) return null;
    if (f === fS) return best; // (outside its footprint it is out, and on its way)
    return Math.hypot(best.x - t.pos.x, best.z - t.pos.z) > 0.7 ? best : null; // at the door: in it goes
  }
  App.doorway = doorway;
  function walkTo(t, target, dm, dtReal, water, mult) {
    // into a building or out of it: by its door
    const door = doorway(t, target);
    if (door) target = door;
    // follow a planned detour first, if there is one for this target
    if (t.detour && (t.detour.tx !== target.x || t.detour.tz !== target.z)) t.detour = null;
    let goal = target;
    if (t.detour) {
      const pts = t.detour.pts;
      while (pts.length && Math.hypot(pts[0].x - t.pos.x, pts[0].z - t.pos.z) < 0.45) pts.shift();
      if (pts.length) goal = pts[0]; else t.detour = null;
    }
    const dx = goal.x - t.pos.x, dz = goal.z - t.pos.z, dist = Math.hypot(dx, dz);
    const step = Math.min(dist, App.WALK_SPEED * dm * (mult || 1));
    let dir = Math.atan2(dx, dz);
    let nx = t.pos.x + Math.sin(dir) * step, nz = t.pos.z + Math.cos(dir) * step;
    // a way round that crosses water is swum
    const swim = water || !!(t.detour && t.detour.wet);
    const blocked = (x, z) => (!swim && !App.isLand(x, z) && App.isLand(t.pos.x, t.pos.z)) || (!swim && !App.canFloat(t) && App.pondWater(x, z) && !App.pondWater(t.pos.x, t.pos.z)) ||
      !App.climbOK(t.pos.x, t.pos.z, x, z) || acrossBuilding(x, z);
    // (the whole stretch of the step is looked at, not just where it ends: a rider covers more than a wall is thick)
    function acrossBuilding(x, z) {
      const ddx = x - t.pos.x, ddz = z - t.pos.z, n = Math.max(1, Math.ceil(Math.hypot(ddx, ddz) / 0.5));
      for (let i = 1; i <= n; i++) if (inTheWay(t.pos.x + (ddx * i) / n, t.pos.z + (ddz * i) / n, t, target, goal)) return true;
      return false;
    }
    // getting no closer to where it is going (edging from side to side at a river bank, say) counts as stuck too
    const dNow = Math.hypot(target.x - t.pos.x, target.z - t.pos.z);
    if (t.edgeX !== target.x || t.edgeZ !== target.z) { t.edgeX = target.x; t.edgeZ = target.z; t.bestD = dNow; t.edge = 0; }
    else if (dNow < t.bestD - 0.3) { t.bestD = dNow; t.edge = 0; }
    else t.edge += dm;
    let ok = true;
    if (blocked(nx, nz)) {
      ok = false;
      for (const off of [0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.2, -2.2]) {
        const d2 = dir + off, x2 = t.pos.x + Math.sin(d2) * step, z2 = t.pos.z + Math.cos(d2) * step;
        if (!blocked(x2, z2) && (swim || App.isLand(x2, z2) || !App.isLand(t.pos.x, t.pos.z))) { nx = x2; nz = z2; dir = d2; ok = true; break; }
      }
      if (!ok) { nx = t.pos.x; nz = t.pos.z; t.stuck += dm; }
    }
    // properly stuck, or no closer for a while: plan a way round on the block grid; if there is none on foot,
    // swim across (a river or a channel in the way); if it is too far to plan, swim toward it for a stretch
    if (!t.detour && (t.stuck > 0.6 || t.edge > 1.5) && !(t.noPathUntil > st.T)) {
      let pts = App.findPath(t.pos.x, t.pos.z, target.x, target.z, { water, float: App.canFloat(t) }), wet = false;
      if (!pts && !water) { pts = App.findPath(t.pos.x, t.pos.z, target.x, target.z, { water: true, float: true }); wet = !!pts; }
      if (!pts && dNow > 60) {
        const k = 55 / dNow, mx = t.pos.x + (target.x - t.pos.x) * k, mz = t.pos.z + (target.z - t.pos.z) * k;
        pts = App.findPath(t.pos.x, t.pos.z, mx, mz, { water: true, float: true }); wet = !!pts;
      }
      if (pts) { t.detour = { tx: target.x, tz: target.z, pts, wet }; t.stuck = 0; t.edge = 0; } else { t.noPathUntil = st.T + 8; t.edge = 0; }
    }
    t.pos.x = nx; t.pos.z = nz;
    t.heading = turn(t.heading, dir, dtReal * 9);
    t.needs.energy = clamp(t.needs.energy - 0.01 * dm, 0, 100);
    return Math.hypot(target.x - t.pos.x, target.z - t.pos.z);
  }
  // A* on the block grid: land only (or water when allowed), two blocks up or down at most, no
  // cutting corners round a cliff. Returns cell centres to walk through, or null.
  App.findPath = (x0, z0, x1, z1, opts) => {
    opts = opts || {};
    const sx = Math.floor(x0), sz = Math.floor(z0), tx = Math.floor(x1), tz = Math.floor(z1);
    if (Math.abs(tx - sx) + Math.abs(tz - sz) > 160) return null;
    const key = (x, z) => (x + 4096) * 8192 + (z + 4096);
    // (round the buildings too, except the one it starts in or is going into)
    const fromB = App.buildingAt(x0, z0), toB = App.buildingAt(x1, z1);
    const pass = (x, z) => {
      const h = App.columnHeight(x, z);
      if (h < App.SEA && !opts.water) return false;
      if (!opts.float && App.pondWater(x + 0.5, z + 0.5) && !(x === sx && z === sz)) return false;
      const f = App.buildingAt(x + 0.5, z + 0.5);
      return !f || f.sc === (fromB && fromB.sc) || f.sc === (toB && toB.sc) || (x === sx && z === sz) || (x === tx && z === tz);
    };
    const step = (ax, az, bx, bz) => pass(bx, bz) && App.climbOK(ax + 0.5, az + 0.5, bx + 0.5, bz + 0.5);
    const g = new Map(), from = new Map(), heap = [];
    const push = (f, k, x, z) => { heap.push([f, k, x, z]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const hfn = (x, z) => { const dx = Math.abs(x - tx), dz = Math.abs(z - tz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    const k0 = key(sx, sz);
    g.set(k0, 0); push(hfn(sx, sz), k0, sx, sz);
    let n = 0, found = null;
    while (heap.length && n++ < 16000) { // (room enough to find the gate of a fortress)
      const [, k, x, z] = pop();
      if (x === tx && z === tz) { found = k; break; }
      const gk = g.get(k);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        const nx = x + dx, nz = z + dz;
        if (!step(x, z, nx, nz)) continue;
        if (dx && dz && (!step(x, z, x + dx, z) || !step(x, z, x, z + dz))) continue;
        const nk = key(nx, nz), ng = gk + (dx && dz ? 1.414 : 1);
        if (g.has(nk) && g.get(nk) <= ng) continue;
        g.set(nk, ng); from.set(nk, [k, x, z]);
        push(ng + hfn(nx, nz), nk, nx, nz);
      }
    }
    if (found == null) return null;
    const cells = [];
    for (let k = found, x = tx, z = tz; k !== k0;) { cells.unshift({ x: x + 0.5, z: z + 0.5 }); const f = from.get(k); k = f[0]; x = f[1]; z = f[2]; }
    // keep only the turning points
    const out = [];
    for (let i = 0; i < cells.length; i++) {
      const a = out.length ? out[out.length - 1] : { x: sx + 0.5, z: sz + 0.5 }, b = cells[i], c = cells[i + 1];
      if (!c || Math.sign(b.x - a.x) !== Math.sign(c.x - b.x) || Math.sign(b.z - a.z) !== Math.sign(c.z - b.z)) out.push(b);
    }
    out.push({ x: x1, z: z1 });
    return out;
  };
  function stepTickle(t, dm, dtReal) {
    const busy = t.action && t.action.phase === "doing" && t.action.act ? t.action.act.needs : {};
    for (const k of NEEDS) {
      let d = DECAY[k] * (k === "hunger" ? t.persona.appetite : k === "energy" ? t.persona.lazy : k === "social" ? t.persona.sociable : t.persona.playful);
      if (busy[k]) d = 0;
      t.needs[k] = clamp(t.needs[k] - d * dm, 0, 100);
    }
    let a = t.action;
    if (!a) {
      if (t.queue.length) App.order(t, t.queue.shift());
      else brain(t);
      a = t.action;
    }
    if (!a) return;
    // in the hand or in the air: the hand moves it
    if (a.kind === "held" || a.kind === "flying") return;
    if (a.kind === "fall" || a.kind === "spirit") return App.stepSpirit(t, a, dm, dtReal);
    if (a.kind === "ringwait" || a.kind === "box" || a.kind === "cheer") {
      const r = App.stepBoxing(t, a, dm);
      if (r === "walk") { walkTo(t, a.spot, dm, dtReal, false, 1.3); animate(t, true, dtReal); }
      else { t.boxMode = r; animate(t, false, dtReal); }
      return;
    }
    if (a.kind === "cower") {
      // ducking under a dragon in flight, paws over the head
      if (st.T >= a.until) t.action = null;
      animate(t, false, dtReal);
      t.pivot.position.y = -0.25; t.pivot.rotation.x = 0.45; t.pivot.rotation.z = Math.sin(performance.now() / 70) * 0.05;
      return;
    }
    if (a.kind === "dizzy") {
      if (st.T >= a.until) t.action = null;
      t.pivot.rotation.z = Math.sin(performance.now() / 90) * 0.22;
      return;
    }
    if (a.kind === "ko") {
      if (st.T >= a.until) t.action = null;
      else if (!t.bubble || st.T > t.bubble.until) say(t, "KO \u2605", 4);
      animate(t, false, dtReal);
      return;
    }
    if (a.kind === "hunt") {
      const pr = a.prey;
      if (!pr || pr.gone > st.T || st.T > a.until || t.stuck > 20) { t.stuck = 0; t.action = null; animate(t, false, dtReal); return; }
      const left = walkTo(t, pr, dm, dtReal, false, 1.5);
      if (left < 1.3) {
        if (App.catchPrey(pr)) { say(t, "Got one!", 4); t.village.food += 1.5; t.fav.hunt = (t.fav.hunt || 0) + 1; }
        t.action = null;
      }
      animate(t, true, dtReal);
      return;
    }
    if (a.kind === "fight") return stepFight(t, a, dm, dtReal);
    if (a.kind === "tame") {
      const r = App.stepTame(t, a, dm);
      if (typeof r === "string" && r.startsWith("walk")) { walkTo(t, a.target, dm, dtReal, false); animate(t, true, dtReal); }
      else animate(t, false, dtReal);
      return;
    }
    if (a.kind === "brawl" || a.kind === "delve") {
      const r = App.stepDungeonAction(t, a, dm);
      if (r === "walk") { walkTo(t, a.kind === "brawl" ? a.foe : a.spot, dm, dtReal, false, 1.25); animate(t, true, dtReal); }
      else animate(t, false, dtReal);
      return;
    }
    if (a.kind === "duel") {
      if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.4) { walkTo(t, a.spot, dm, dtReal, false, 1.5); animate(t, true, dtReal); }
      else animate(t, false, dtReal);
      if (st.T - a.started > 40) t.action = null;
      return;
    }
    if (a.kind === "throw") return stepThrow(t, a, dm, dtReal);
    if (a.kind === "slay") return stepSlay(t, a, dm, dtReal);
    if (a.kind === "ride") return stepRide(t, a, dm, dtReal);
    if (a.kind === "mining") {
      // down the mine, out of sight, until the shift is over; then up with the haul
      if (st.T >= a.until || App.isKO(t.id)) {
        const got = App.mineHaul(t.id, a.mine, t.village, Math.floor(st.T / 1440));
        t.action = null;
        say(t, got.orichalcum ? "ORICHALCUM!" : got.gold ? "Gold!" : got.iron ? "A good bit of iron." : "Stone, stone, stone...", 3);
      }
      animate(t, false, dtReal);
      if (t.action) t.group.visible = false;
      return;
    }
    if (a.kind === "wallwatch") {
      // walking the top of the wall; at the end of the turn, down the stairs again by the gate
      if (st.T >= a.until || App.isKO(t.id)) { t.pos.x = a.back.x; t.pos.z = a.back.z; t.action = null; if (rnd() < 0.4) say(t, "All quiet out there.", 2); animate(t, false, dtReal); return; }
      const q = App.wallPos(a.ww, st.T - a.start);
      t.pos.x = q.x; t.pos.z = q.z; t.heading = turn(t.heading, q.h, dtReal * 6);
      // a griffin rider keeps its watch in the air, over the top of the wall
      const GM = App.mountOf ? App.mountOf(t.id) : null;
      if (GM && GM.fly && App.mountRide && App.mountRide(t, { path: null }, 100) && t.riding) { t.riding.alt = 4; t.flyY = (App.wallDeckY(t.pos.x, t.pos.z) || App.genHeight(t.pos.x, t.pos.z)) + 4 + Math.sin(st.T * 0.4 + t.id) * 0.8; }
      animate(t, true, dtReal);
      return;
    }
    if (a.kind === "rounds") {
      if (st.T >= a.until || App.isKO(t.id)) { t.action = null; say(t, a.bye || "All quiet down there.", 2); }
      animate(t, false, dtReal);
      if (t.action) t.group.visible = false;
      return;
    }
    if (a.kind === "row") return stepRow(t, a, dm, dtReal);
    if (a.kind === "contest") return App.stepContest(t, a, dm, dtReal);
    if (a.kind === "dive") return App.stepDive(t, a, dm, dtReal);
    if (a.kind === "fp") return App.stepFP(t, a, dm, dtReal);
    if (a.kind === "seafight") return App.stepSeaFight(t, a, dm, dtReal);
    if (a.kind === "warmarch" || a.kind === "warfight") return App.stepWar(t, a, dm, dtReal);
    if (a.kind === "forge") return App.stepForge(t, a, dm, dtReal);
    if (a.kind === "sail") return App.stepSail(t, a, dm, dtReal);
    if (a.kind === "command") return stepCommand(t, a, dm, dtReal);
    if (a.kind === "hide") return stepHide(t, a, dm, dtReal);
    if (a.kind === "idle") {
      if (st.T >= a.until) t.action = null;
      animate(t, false, dtReal);
      return;
    }
    if (a.kind === "travel") {
      // a new part of the day has begun since this walk started: think again
      if (!a.order && a.stepS != null && !(st.T < (a.checkAt || 0))) {
        a.checkAt = st.T + 1;
        if (App.planStep(t.id, st.T).step.s !== a.stepS && !(App.pop.ko[t.id] > st.T)) { t.action = null; animate(t, false, dtReal); return; }
      }
      const wp = a.path[0];
      if (!wp) {
        // sent to dive: into the water at the end of the walk
        if (a.then && a.then.dive != null && App.startDiveAt) { App.startDiveAt(t, a.then.dive, a.then.until); return; }
        t.action = a.order ? { kind: "idle", until: st.T + 30, order: true } : null; animate(t, false, dtReal); return;
      }
      // skaters ride their board on longer trips, everyone else walks
      const remaining = Math.hypot(wp.x - t.pos.x, wp.z - t.pos.z) + (a.path.length > 1 ? App.pathLength(a.path) : 0);
      // ... and those with a horse ride it at a trot, or fly there on their griffin (wealth.js)
      const mt = App.mountRide ? App.mountRide(t, a, remaining) : null;
      const ride = !mt && t.ground && ITEM_USE[t.ground] && ITEM_USE[t.ground].ride && remaining > 18;
      itemVisual(t, ride ? "ride" : null);
      const left = mt && mt.fly ? App.flyStep(t, a, a.path[0], dm, dtReal, mt.mul) : walkTo(t, a.path[0], dm, dtReal, false, (ride ? 1.7 : mt ? mt.mul : a.slow || 1) * (App.tiptoe ? App.tiptoe(t) : 1));
      if (left < 0.4) a.path.shift();
      if (t.stuck > 30) { t.stuck = 0; a.path.shift(); }
      animate(t, true, dtReal);
      return;
    }
    let walking = false;
    if (a.phase === "walk") {
      const dist = Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z);
      // into a castle or a mansion: through the door from a couple of blocks away, or from further when the crowd
      // at the door holds it up; inside, it is at its home (and out of sight, animate)
      const inNow = a.indoor && (dist < 2.2 || (dist < 6 && (t.stuck > 8 || st.T - a.started > 40)));
      if (inNow) { t.pos.x = a.spot.x; t.pos.z = a.spot.z; t.stuck = 0; }
      if (!inNow && dist > (a.chat ? 0.35 : 0.45)) {
        walking = true;
        if (a.item) itemVisual(t, ITEM_USE[itemOf(t)] && ITEM_USE[itemOf(t)].ride ? "ride" : "carry");
        walkTo(t, a.spot, dm, dtReal, a.water);
        if (st.T - a.started > 120 || t.stuck > 25) { t.stuck = 0; endAction(t); return; }
      } else if (a.chat) {
        const p = a.partner;
        if (!p || !p.action || p.action.partner !== t) { endAction(t); return; }
        if (p.action.phase === "walk" && Math.hypot(p.pos.x - p.action.spot.x, p.pos.z - p.action.spot.z) > 0.5) { animate(t, false, dtReal); faceTo(t, p.pos, dtReal); return; }
        const until = st.T + a.act.minutes * (0.8 + rnd() * 0.5);
        a.phase = "doing"; a.until = until; a.nextLine = st.T;
        p.action.phase = "doing"; p.action.until = until; p.action.nextLine = st.T + 1.5;
      } else {
        a.phase = "doing";
        if (a.item) itemVisual(t, (ITEM_POSE[itemOf(t)] || {}).mode || (ITEM_USE[itemOf(t)] && ITEM_USE[itemOf(t)].hold ? "carry" : "place"), { x: t.pos.x, z: t.pos.z });
        if (!a.until) a.until = st.T + a.act.minutes * (0.85 + rnd() * 0.3);
        a.nextBlock = st.T + 1.5;
        if (a.act.verb && rnd() < 0.5) say(t, verbBubble(a.act), 4);
      }
    }
    if (a.phase === "doing") {
      const span = a.act.where === "work" ? Math.max(30, a.until - a.started) : a.act.minutes;
      for (const k in a.act.needs) t.needs[k] = clamp(t.needs[k] + (a.act.needs[k] / span) * dm, 0, 100);
      if (a.chat) {
        faceTo(t, a.partner.pos, dtReal);
        if (st.T >= a.nextLine) {
          say(t, TB.chatLine(rnd, t, a.partner, { latest: st.latest, night: App.isNight }), 2.4);
          a.nextLine = st.T + 3 + rnd() * 1.5;
          bumpRel(t, a.partner, 0.22 + compatibility(t, a.partner) * 0.3);
        }
      } else {
        faceTo(t, a.center, dtReal);
        if (a.project && st.T >= a.nextBlock) { a.nextBlock = st.T + 1.6; buildStep(a.project, t); }
        if (a.act.where === "work" && rnd() < 0.002 * dm * 60) say(t, verbBubble(a.act), 3);
      }
      // urgent needs interrupt long activities like work
      if (a.act.where === "work" && (t.needs.hunger < 14 || t.needs.energy < 8)) { endAction(t, true); return; }
      if (st.T >= a.until) { endAction(t, true); animate(t, false, dtReal); return; }
    }
    animate(t, walking, dtReal);
  }
  function stepFight(t, a, dm, dtReal) {
    const p = a.partner;
    if (!p || !p.action || p.action.kind !== "fight" || p.action.partner !== t || App.isKO(t.id)) { t.action = null; animate(t, false, dtReal); return; }
    if (a.phase === "walk") {
      if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.4) {
        walkTo(t, a.spot, dm, dtReal, false, 1.3);
        animate(t, true, dtReal);
        if (st.T - a.started > 40 || t.stuck > 25) { t.stuck = 0; endAction(t); }
        return;
      }
      a.ready = true;
      if (a.lead && p.action.ready) {
        const until = st.T + 3 + rnd() * 3;
        a.phase = p.action.phase = "doing"; a.until = p.action.until = until; a.nextLine = st.T; p.action.nextLine = st.T + 0.6;
      }
      faceTo(t, p.pos, dtReal);
      animate(t, false, dtReal);
      return;
    }
    faceTo(t, p.pos, dtReal);
    if (st.T >= a.nextLine) { say(t, ["Pow!", "Take that!", "Hiyah!", "Back off!", "Bam!"][Math.floor(rnd() * 5)], 1.2); a.nextLine = st.T + 1 + rnd(); }
    animate(t, false, dtReal);
    if (a.lead && st.T >= a.until) {
      const raid = a.raid ? App.raidById(a.raid) : null;
      const power = (x) => x.needs.energy * 0.4 + x.persona.playful * 25 + rnd() * 45 + App.levelOf(x.id) * 3 + (raid && x.village.i === raid.to ? 8 : 0);
      const win = power(t) >= power(p) ? t : p, lose = win === t ? p : t;
      if (raid) { raid.fights++; raid.kos++; raid.live = true; }
      if (raid) App.maybeKill(lose.id, 0.06, "in a raid on " + App.villages[raid.to].name, 300, "KO!"); else App.knockOut(lose.id, 300, "KO!");
      App.giveXP(win.id, 12); App.giveXP(lose.id, 4);
      win.action = null;
      say(win, win.village.i === (raid && raid.to) ? "And stay out!" : "Ha!", 2.5);
    }
  }
  function stepThrow(t, a, dm, dtReal) {
    const D = a.dragon, on = a.hunt ? D.hunt === a.attack : D.live && D.live.phase === "landed";
    if (!on || a.attack.done || App.isKO(t.id)) { t.action = null; animate(t, false, dtReal); return; }
    if (a.phase === "walk") {
      if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.5) {
        walkTo(t, a.spot, dm, dtReal, false, 1.4);
        animate(t, true, dtReal);
        if (st.T - a.started > 30 || t.stuck > 20) { t.stuck = 0; t.action = null; }
        return;
      }
      a.phase = "doing"; a.until = st.T + 6 + rnd() * 6;
    }
    faceTo(t, { x: D.x, z: D.z }, dtReal);
    if (st.T >= a.next) {
      a.next = st.T + 1.6 + rnd() * 1.4;
      App.throwStone(t, D, a.attack, a.hunt ? 1.5 : 1); // the Guild's hunters throw harder
      t.throwAt = performance.now();
      if (rnd() < 0.25) say(t, (a.hunt ? ["For the Guild!", "Wear it down!", "Aim for the wings!", "Come down from there!"] : ["Go away!", "Leave our food alone!", "Together now!", "Shoo, dragon!"])[Math.floor(rnd() * 4)], 2);
    }
    animate(t, false, dtReal);
    if (st.T >= a.until) t.action = null;
  }
  // sword, axe or spear in hand against a dragon on the rampage: close in round it and strike
  function stepSlay(t, a, dm, dtReal) {
    const D = a.dragon, F = App.dragonFight(D);
    if (!F || F.done || D.dead || App.isKO(t.id) || App.isDead(t.id)) { endAction(t); animate(t, false, dtReal); return; }
    if (!t.weaponObj) App.weaponShow(t, a.weapon, a.armor);
    if (D.held || D.handFlying) { faceTo(t, { x: D.x, z: D.z }, dtReal); animate(t, false, dtReal); return; }
    const reach = a.weapon === "spear" ? 8.6 : 7.2, d = Math.hypot(D.x - t.pos.x, D.z - t.pos.z); // the dragon is big: stay outside its body
    if (a.weapon === "staff") {
      // a mage keeps its distance and casts; a healer mends whoever is hurt
      if (d > 15 || d < 9) { walkTo(t, { x: D.x + Math.cos(a.ang) * 12, z: D.z + Math.sin(a.ang) * 12 }, dm, dtReal, false, 1.5); animate(t, true, dtReal); return; }
      faceTo(t, { x: D.x, z: D.z }, dtReal);
      if (st.T >= a.next) {
        a.next = st.T + 1.8 + rnd() * 0.8; t.swingAt = performance.now();
        const school = App.mageSchool(t.id) || "arcane", from = { x: t.pos.x + Math.sin(t.heading) * 0.8, y: t.pos.y + 2.6, z: t.pos.z + Math.cos(t.heading) * 0.8 };
        const hurt = school === "light" ? st.tickles.filter((o) => o !== t && o.action && o.action.kind === "slay" && o.hpMax && o.hp < o.hpMax * 0.75 && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 16).sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0] : null;
        if (hurt) { const n = Math.round(hurt.hpMax * 0.25); hurt.hp = Math.min(hurt.hpMax, hurt.hp + n); App.FX.bolt(App.scene, from, { x: hurt.pos.x, y: hurt.pos.y + 1.5, z: hurt.pos.z }, "light", () => { App.FX.heal(App.scene, hurt.pos); App.FX.number(App.scene, { x: hurt.pos.x, y: hurt.pos.y + 3.4, z: hurt.pos.z }, "+" + n, "#7be08f"); }); }
        else App.FX.bolt(App.scene, from, { x: D.x, y: D.y + 3, z: D.z }, school, () => App.hitDragon(D, t, App.weaponDamage(t, "staff") * 1.3, App.SPELLS[school].color));
        if (rnd() < 0.1) say(t, App.SPELLS[school].name + "!", 1.6);
      }
      animate(t, false, dtReal);
      return;
    }
    // no way up to it (a dragon on its peak): throw from where it stands
    if (a.ranged && d < 18) {
      faceTo(t, { x: D.x, z: D.z }, dtReal);
      if (st.T >= a.next) { a.next = st.T + 1.6 + rnd() * 0.8; t.swingAt = performance.now(); App.throwStone(t, D, null, 2.5); }
      animate(t, false, dtReal);
      return;
    }
    if (d > reach + 1.2) {
      walkTo(t, { x: D.x + Math.cos(a.ang) * reach, z: D.z + Math.sin(a.ang) * reach }, dm, dtReal, false, 1.5);
      animate(t, true, dtReal);
      if (t.stuck > 15) { t.stuck = 0; a.ang += 0.9; a.tries = (a.tries || 0) + 1; if (a.tries >= 3 && d < 18) a.ranged = true; }
      return;
    }
    faceTo(t, { x: D.x, z: D.z }, dtReal);
    if (st.T >= a.next) {
      a.next = st.T + 1.1 + rnd() * 0.9;
      t.swingAt = performance.now();
      App.hitDragon(D, t, App.weaponDamage(t, a.weapon));
      if (App.FX) App.FX.slash(App.scene, { x: t.pos.x + Math.sin(t.heading) * 1.6, y: t.pos.y + 1.6, z: t.pos.z + Math.cos(t.heading) * 1.6 }, t.heading, a.weapon === "goldsword" ? "#ffd23f" : a.weapon === "orisword" ? "#ff8f6a" : "#ffffff");
      if (rnd() < 0.08) say(t, ["Take that!", "For " + t.village.name + "!", "Hit it again!", "Watch the tail!"][Math.floor(rnd() * 4)], 2);
    }
    animate(t, false, dtReal);
  }
  // ---------- the lake: the ferry and the rowing boats ----------
  const WAIT_FERRY = { id: "wait_ferry", name: "Waiting for the ferry", verb: "is waiting for the ferry", needs: { social: 3 }, capacity: 99, minutes: 4, where: "self", source: "core", status: "core" };
  function ferryBrain(t, step, d0) {
    const F = App.ferries[step.ferry], m = st.T - d0;
    // already out on the lake (it came into view mid-crossing): it is on board
    if (m >= step.dep && m < step.arr) {
      const f = App.ferryAt(F, st.T);
      if (Math.hypot(f.x - t.pos.x, f.z - t.pos.z) < 12) { t.action = { kind: "ride", ferry: F.i, side: step.side, seat: deckSeat(F), started: st.T - 4 }; return; }
    }
    if (Math.hypot(step.from.x - t.pos.x, step.from.z - t.pos.z) > 3) return startTravel(t, step.from, "to the ferry");
    // the ferry is in on this side: all aboard (a spot on the deck)
    if (App.ferryAt(F, st.T).docked === step.side) {
      endAction(t);
      t.action = { kind: "ride", ferry: F.i, side: step.side, seat: deckSeat(F), started: st.T };
      if (rnd() < 0.3) say(t, ["All aboard!", "I love the ferry!", "Off across the lake!"][Math.floor(rnd() * 3)], 3);
      return;
    }
    const berth = step.side === "a" ? F.path[0] : F.path[F.path.length - 1];
    return startDo(t, { act: WAIT_FERRY, ref: "ferry" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: berth }, false, st.T + 2);
  }
  // a place on board: the ferry's open deck in front of its cabin, or along the launch between its gunwales
  // (measured on the boat models: the ferry's deck is 1.0 above its keel, the launch is a rowing boat x1.9)
  const deckSeat = (F) => (F.launch ? { r: (rnd() - 0.5) * 0.8, f: (rnd() - 0.5) * 4.2 } : { r: (rnd() - 0.5) * 2.2, f: -0.6 + rnd() * 4 });
  const deckY = (F) => App.WATER_Y + (F.launch ? -0.6 + 0.1 : -0.55 + 1.0) + Math.sin((performance.now() / 1000) * 1.3 + F.i) * 0.06;
  function stepRide(t, a, dm, dtReal) {
    const F = App.ferries[a.ferry], f = App.ferryAt(F, st.T), other = a.side === "a" ? "b" : "a";
    if (a.captain && st.T >= a.until && f.docked === "a") { const D = App.docks[F.a]; t.pos.x = D.land.x; t.pos.z = D.land.z; t.action = null; animate(t, false, dtReal); return; }
    if (!a.captain && f.docked === other && st.T - a.started > 3) {
      // across: step off onto the dock
      const land = other === "a" ? App.docks[F.a].land : F.launch ? F.isleLand : App.docks[F.b].land;
      t.pos.x = land.x + (rnd() - 0.5) * 2; t.pos.z = land.z + (rnd() - 0.5) * 2;
      t.action = null; animate(t, false, dtReal);
      return;
    }
    const L = F.live || f, c = Math.cos(L.h), s = Math.sin(L.h);
    t.pos.x = L.x + a.seat.r * c + a.seat.f * s; t.pos.z = L.z - a.seat.r * s + a.seat.f * c;
    if (a.captain) t.heading = L.h; // the boatman looks where the boat is going
    animate(t, false, dtReal);
    t.pos.y = deckY(F); t.group.position.copy(t.pos);
    if (rnd() < dm * 0.01) say(t, ["What a view!", "Look, fish!", "The breeze is lovely."][Math.floor(rnd() * 3)], 3);
  }
  // a fisher's day on the lake: climb in, row out, fish, row back before the day's work is done
  function stepRow(t, a, dm, dtReal) {
    const b = a.boat, D = App.docks[b.dock];
    if (App.isKO(t.id)) { b.user = null; b.x = b.home.x; b.z = b.home.z; b.h = b.home.h; t.action = null; return; }
    if (a.phase === "board") { a.phase = "out"; if (rnd() < 0.5) say(t, "Off to fish on the lake!", 3); }
    if (a.phase === "fish" && st.T >= a.until) a.phase = "back";
    const goal = a.phase === "out" ? a.spot : a.phase === "back" ? b.home : null;
    let rowing = false;
    if (goal) {
      const dx = goal.x - b.x, dz = goal.z - b.z, d = Math.hypot(dx, dz), step = Math.min(d, 3 * dm);
      if (d > 0.3) { b.x += (dx / d) * step; b.z += (dz / d) * step; b.h = App.boatTurn(b.h, Math.atan2(dx, dz), dm * 2); rowing = true; }
      else if (a.phase === "out") { a.phase = "fish"; itemVisual(t, "carry"); if (rnd() < 0.6) say(t, "Now, where are the fish...", 3); }
      else {
        // moored again: step out onto the dock
        b.h = b.home.h; b.user = null; itemVisual(t, null);
        t.pos.x = D.land.x; t.pos.z = D.land.z; t.action = null; animate(t, false, dtReal);
        return;
      }
    } else if (a.phase === "fish" && rnd() < dm * 0.03) {
      t.village.food += 0.5;
      say(t, ["Got one!", "A big one!", "Dinner for the village!"][Math.floor(rnd() * 3)], 3);
    }
    animate(t, false, dtReal);
    t.pos.x = b.x; t.pos.z = b.z; t.pos.y = App.WATER_Y - 0.25 + Math.sin((performance.now() / 1000) * 1.7 + b.i) * 0.05; t.heading = b.h; // in the boat, on its floor
    t.group.position.copy(t.pos); t.group.rotation.y = t.heading;
    if (rowing) { t.pivot.rotation.x = Math.sin(performance.now() / 260) * 0.18; t.pivot.position.y = 0; }
  }
  // a tamer stands back and sends its creature in (the creature itself is moved in creatures.js)
  function stepCommand(t, a, dm, dtReal) {
    const D = a.dragon, F = App.dragonFight(D);
    if (!F || F.done || D.dead || App.isKO(t.id) || App.isDead(t.id) || !App.leadCreature(t.id)) { endAction(t); animate(t, false, dtReal); return; }
    const spot = { x: D.x + Math.cos(a.ang) * 13, z: D.z + Math.sin(a.ang) * 13 }, d = Math.hypot(D.x - t.pos.x, D.z - t.pos.z);
    if (Math.hypot(spot.x - t.pos.x, spot.z - t.pos.z) > 1.5 && !(st.T - a.started > 20 && d < 20)) {
      walkTo(t, spot, dm, dtReal, false, 1.4);
      animate(t, true, dtReal);
      if (t.stuck > 15) { t.stuck = 0; a.ang += 0.8; }
      return;
    }
    faceTo(t, { x: D.x, z: D.z }, dtReal);
    if (st.T >= a.next) {
      a.next = st.T + 2.5 + rnd() * 2;
      const c = App.leadCreature(t.id), B = App.CREATURES && App.CREATURES[c.sp];
      t.throwAt = performance.now();
      if (B && rnd() < 0.6) say(t, (c.nick || B.name) + ", " + B.move + "!", 2);
    }
    animate(t, false, dtReal);
  }
  // no arms and no creature: run home and stay inside until the dragon is gone
  App.hideFrom = (t, d) => {
    endAction(t);
    t.action = { kind: "hide", from: d, until: st.T + 120, started: st.T };
    if (rnd() < 0.4) say(t, ["Run! Hide!", "Dragon! Everyone inside!", "Eek!"][Math.floor(rnd() * 3)], 3);
  };
  function stepHide(t, a, dm, dtReal) {
    if (!App.dragonFight(a.from) || st.T >= a.until) { t.action = null; animate(t, false, dtReal); return; }
    if (Math.hypot(t.home.x - t.pos.x, t.home.z - t.pos.z) > 1.2) {
      walkTo(t, t.home, dm, dtReal, false, 1.7);
      animate(t, true, dtReal);
      if (t.stuck > 25) t.stuck = 0;
      return;
    }
    animate(t, false, dtReal);
    t.group.visible = false;
  }
  // raiders at a granary bring its villagers running
  function raidWatch() {
    for (const r of st.raids) {
      if (r.done || st.T < r.arrive - 40 || st.T > r.end) continue;
      const o = App.villages[r.to], g = o.granary;
      const raiders = st.tickles.filter((x) => x.step && x.step.k === "raid" && x.step.raid === r.id && !App.isKO(x.id) && dist2(x.pos, g) < 28);
      if (!raiders.length) continue;
      r.live = true;
      if (!r.alarm) {
        r.alarm = true;
        const v = App.villages[r.from];
        App.log("raid", "Raiders from " + v.name + " are at the granary of " + o.name + "!", "The people of " + o.name + " run out to defend it.", { raid: r.id });
        App.toast("Raid on " + o.name + "!");
      }
      for (const d of st.tickles) {
        if (d.village.i !== r.to || App.isKO(d.id) || dist2(d.pos, g) > 70) continue;
        const ac = d.action;
        if (ac && (ac.kind === "fight" || ac.kind === "ko" || ac.order)) continue;
        if (ac && ac.act && ac.act.id === "rest" && App.hash2(d.id, r.day, 7) < 0.4) continue; // some sleep right through it
        let foe = null, bd = 1e9;
        for (const x of raiders) { if (x.action && x.action.kind === "fight") continue; const dd = dist2(x.pos, d.pos); if (dd < bd) { bd = dd; foe = x; } }
        if (!foe) break;
        endAction(d);
        startFight(d, foe, r);
        say(d, "Raiders! Protect the granary!", 3);
      }
    }
  }
  function verbBubble(act) { return act.verb ? act.verb.replace(/^is /, "").replace(/^./, (c) => c.toUpperCase()) : act.name; }
  function turn(h, target, k) {
    let d = target - h;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return h + d * Math.min(1, k);
  }
  function faceTo(t, p, dtReal) { if (Math.hypot(p.x - t.pos.x, p.z - t.pos.z) > 0.05) t.heading = turn(t.heading, Math.atan2(p.x - t.pos.x, p.z - t.pos.z), dtReal * 6); }
  function compatibility(a, b) {
    let c = 0;
    for (const k of ["Location", "Glasses", "Shirt", "Head", "Shoes", "Ground", "Holding"]) if (a.traits[k] && a.traits[k] === b.traits[k] && a.traits[k] !== "None") c += 0.6;
    for (const k of ["Shirt Theme", "Shoes Theme", "Head Theme"]) if (a.traits[k] && a.traits[k] === b.traits[k] && a.traits[k] !== "None") c += 0.4;
    return Math.min(2, c);
  }
  App.compatibility = compatibility;
  function bumpRel(a, b, v) {
    const k = rk(a.id, b.id), before = st.rel[k] || 0;
    st.rel[k] = Math.min(100, before + v);
    if (before < 30 && st.rel[k] >= 30) App.log("social", a.name + " and " + b.name + " are now friends.", "They hit it off over a few chats.", { who: [a.id, b.id] });
    if (before < 60 && st.rel[k] >= 60) App.log("social", a.name + " and " + b.name + " are best friends.", "", { who: [a.id, b.id] });
  }
  App.bumpRel = bumpRel; // (talking from first person, firstperson.js)
  App.relLabel = (v) => (v >= 60 ? "Best friends" : v >= 30 ? "Friends" : v >= 8 ? "Acquaintances" : "Just met");

  const INDOOR = new Set(["rest", "recover", "breakfast", "shelter"]); // done inside the house
  // the arms: a pose for each kind of action (rotation.x below zero swings an arm forward and up)
  function armPose(t, walking, dtReal) {
    const A = t.arms;
    if (!A) return;
    const now = performance.now(), a = t.action, k = a && a.kind, act = a && a.act, doing = a && a.phase === "doing";
    const since = (at, ms) => Math.max(0, 1 - (now - (at || 0)) / ms);
    let rx = 0, lx = 0, rz = 0, lz = 0;
    const use = a && a.item && doing && itemOf(t) ? (ITEM_POSE[itemOf(t)] || {}).pose : null;
    if (use) {
      const w = now / 1000, ph = t.id * 0.7;
      if (use === "fish") { const c = (w * 0.16 + ph) % 1; rx = c < 0.06 ? 0.6 : c < 0.1 ? -2.0 : -1.2; lx = -0.3; }
      else if (use === "surf" && a.surfMode === "paddle") { rx = -1.6 + Math.sin(w * 4 + ph) * 1.1; lx = -1.6 - Math.sin(w * 4 + ph) * 1.1; }
      else if (use === "surf" && a.surfMode === "wait") { rx = lx = -0.4; rz = 0.3; lz = -0.3; }
      else if (use === "surf") { rz = 1.1 + Math.sin(w * 1.7) * 0.25; lz = -1.1 + Math.sin(w * 1.7) * 0.25; rx = lx = -0.3; }
      else if (use === "ball") { const b = Math.abs(Math.sin(w * 2.2 + ph)); rx = lx = b < 0.25 ? -2.8 : -2.2; rz = 0.25; lz = -0.25; }
      else if (use === "dance") { rx = -1.2 + Math.sin(w * 7 + ph) * 1.2; lx = -1.2 - Math.sin(w * 7 + ph) * 1.2; rz = 0.4; lz = -0.4; }
      else if (use === "drink") { const c = (w * 0.25 + ph) % 1; rx = c < 0.3 ? -2.3 : -0.2; lx = -0.2; }
      else if (use === "sit") { rx = lx = -0.5; rz = 0.25; lz = -0.25; }
      else if (use === "lift") { const b = Math.abs(Math.sin(w * 2.5 + ph)); rx = -0.2 - b * 2.7; lx = -0.1; rz = 0.12 * b; } // the weight is in one paw: only that arm lifts it
      else if (use === "dig") { rx = lx = -0.8 + Math.sin(w * 4.4 + ph) * 0.5; }
      else if (use === "trick" || use === "skate") { rz = 0.9; lz = -0.9; rx = Math.sin(w * 3 + ph) * 0.4; lx = -rx; }
    } else if (k === "fp" && since(t.castAt, 520) > 0) {
      // a spell cast from first person: both paws thrown up and forward
      const s = since(t.castAt, 520); rx = lx = -2.4 + (1 - s) * 0.9; rz = 0.2; lz = -0.2;
    } else if (k === "slay" || (k === "fp" && since(t.swingAt, 340) > 0)) {
      // chop: raised overhead, then down; the shield held up in front (also a blow struck from first person)
      const s = since(t.swingAt, 340);
      rx = s > 0 ? -2.8 + (1 - s) * 2.4 : -0.7; lx = a.armor ? -1.2 : -0.1; lz = a.armor ? -0.2 : 0;
    } else if (k === "box" || k === "ringwait") {
      const p = since(t.punchAt, 240), left = (t.punches || 0) % 2 === 1;
      rx = -1.15 - (left ? 0 : p * 0.5); lx = -1.15 - (left ? p * 0.5 : 0); rz = 0.15; lz = -0.15;
    } else if (k === "throw" || k === "command" && since(t.throwAt, 500) > 0) {
      const q = since(t.throwAt, 420);
      rx = q > 0 ? 1.1 - (1 - q) * 3.0 : -0.3;
    } else if (k === "command") { rx = -1.55; }
    else if (k === "cheer") { const w = Math.sin(now / 110) * 0.25; rx = lx = -2.9 + w; rz = 0.35; lz = -0.35; }
    else if (k === "cower") { rx = lx = -2.7; rz = -0.5; lz = 0.5; }
    else if (k === "brawl" || (k === "fight" && doing)) { const w = Math.sin(now / 85 + t.id); rx = -1.3 + w * 0.5; lx = -1.3 - w * 0.5; }
    else if (k === "hide" || k === "fall") { rx = lx = -2.5; rz = 0.3; lz = -0.3; }
    else if (k === "held" || k === "flying") { const w = Math.sin(now / 70); rx = w * 1.3; lx = -w * 1.3; rz = 0.7; lz = -0.7; }
    else if (k === "row") { rx = lx = -1.0 + Math.sin(now / 260) * 0.5; }
    else if (k === "ride") { rx = lx = Math.sin(now / 700 + t.id) * 0.06; if (t.bubble && st.T < t.bubble.until) rx = -2.4; }
    else if (k === "spirit") { rx = lx = -0.6; rz = 0.9; lz = -0.9; }
    else if (k === "ko" || (act && (act.id === "rest" || act.id === "recover") && doing)) { rz = 0.5; lz = -0.5; }
    else if (act && doing && act.anim === "dig") { rx = lx = -0.8 + Math.sin(now / 220 + t.id) * 0.5; }
    else if (act && doing && act.anim === "sitWatch") { const c = (now / 1700 + t.id * 0.37) % 1; if (c < 0.18) { rx = lx = -2.8; rz = 0.3; lz = -0.3; } else { rx = lx = -0.6; } }
    else if (act && doing && act.anim === "sitEat") { const c = (now / 2600 + t.id * 0.13) % 1; rx = c < 0.22 ? -2.1 : -0.95; lx = -0.95; rz = 0.15; lz = -0.15; }
    else if (act && doing && act.anim === "chant") { rx = lx = -2.3 + Math.sin(now / 420 + t.id * 0.3) * 0.3; rz = 0.4; lz = -0.4; }
    else if (act && doing && act.anim === "reach") { rx = -2.5 + Math.sin(now / 300) * 0.2; }
    else if (a && a.chat && doing) { rx = -0.7 + Math.sin(now / 320 + t.id) * 0.35; lx = -0.2 + Math.sin(now / 410 + t.id) * 0.15; }
    else if (k === "hunt" || k === "tame" || k === "duel") { rx = -1.2; lx = -0.4; }
    else if (k === "forge") { const s = since(t.swingAt, 320); rx = s > 0 ? -0.55 - (1 - s) * 1.5 : -2.05; lx = -0.5; lz = -0.15; } // the hammer comes down, then up again
    else if (t.riding) { rx = lx = -0.85; rz = 0.12; lz = -0.12; } // holding the reins
    else if (walking) { const w = Math.sin(t.walk); rx = t.itemMode === "carry" ? -0.4 : w * 0.65; lx = -w * 0.65; } // an item being carried is held steady
    else { rx = lx = Math.sin(now / 900 + t.id) * 0.05; }
    // someone talking waves now and then
    if (!walking && !k && t.bubble && st.T < t.bubble.until) rx = -2.5 + Math.sin(now / 150) * 0.25;
    // the paws' own things (the on-chain Holding): put away while both paws are busy (lifting, digging, playing
    // ball, dancing, surfing, skating, fighting, rowing); a float, a wake board or a towel stays low at the side
    const HP = A.held;
    if (HP && (HP.R || HP.L)) {
      const busy = TWO_HANDED.has(use) || k === "slay" || k === "box" || k === "ringwait" || k === "brawl" || (k === "fight" && doing) || k === "row" || k === "throw" || k === "held" || k === "flying" || (act && doing && act.anim === "dig");
      // (a towel comes out only by the water; snacks, chips and games go everywhere, indoors too)
      const stowed = (WATER_HOLD.has(t.holding) && !inWater(t)) || (t.holding === "Towel" && !towelSpot(t));
      for (const s of ["R", "L"]) { const away = busy || stowed || (s === "R" && RIGHT_PAW.has(use)); if (HP[s] && HP[s].visible === away) HP[s].visible = !away; }
      if (!busy && !stowed && BULKY.has(t.holding)) {
        if (HP.L) { lx = Math.max(lx, -0.45); lz = Math.max(-0.15, Math.min(lz, 0.15)); }
        if (HP.R) { rx = Math.max(rx, -0.45); rz = Math.max(-0.15, Math.min(rz, 0.15)); }
      }
    }
    const f = Math.min(1, dtReal * 14);
    A.R.rotation.x += (rx - A.R.rotation.x) * f; A.L.rotation.x += (lx - A.L.rotation.x) * f;
    A.R.rotation.z += (rz - A.R.rotation.z) * f; A.L.rotation.z += (lz - A.L.rotation.z) * f;
  }
  App.armPose = armPose;
  App.animateTickle = (t, walking, dtReal) => animate(t, walking, dtReal);
  App.faceTo = (t, p, dtReal) => faceTo(t, p, dtReal);
  // the body while using an item; returns true when it has set the pose
  const TIP = new THREE.Vector3();
  function itemPose(t, dtReal) {
    const use = itemOf(t) && (ITEM_POSE[itemOf(t)] || {}).pose, now = performance.now() / 1000, ph = t.id * 0.7;
    if (!use) return false;
    t.pivot.rotation.z = 0;
    if (use === "sit") {
      // on the chair, leaning back
      t.pos.y = App.surfaceAt(t.pos.x, t.pos.z).y + 0.55; t.group.position.copy(t.pos);
      t.pivot.rotation.x = -0.22; t.pivot.position.y = 0;
      if (t.itemObj) { t.itemObj.position.set(t.pos.x, t.pos.y - 0.55, t.pos.z); t.itemObj.rotation.y = t.heading; }
      return true;
    }
    if (use === "surf" && App.surfPose && t.action && t.action.water) return App.surfPose(t, dtReal);
    if (use === "surf") {
      // standing on the board, riding the swell
      t.pos.y = App.WATER_Y + 0.12 + Math.sin(now * 1.6 + ph) * 0.12; t.group.position.copy(t.pos);
      t.pivot.rotation.x = Math.sin(now * 1.3 + ph) * 0.08; t.pivot.rotation.z = Math.sin(now * 1.7 + ph) * 0.12; t.pivot.position.y = 0;
      return true;
    }
    if (use === "ball" && t.itemObj) {
      // keeping the ball up, over its head
      const b = Math.abs(Math.sin(now * 2.2 + ph));
      t.itemObj.position.set(t.pos.x + Math.sin(t.heading) * 0.6, t.pos.y + t.height + 0.2 + b * 2.4, t.pos.z + Math.cos(t.heading) * 0.6);
      t.itemObj.rotation.y += dtReal * 3;
      t.pivot.position.y = b < 0.25 ? 0.15 : 0; t.pivot.rotation.x = 0;
      return true;
    }
    if (use === "dance") {
      t.pivot.position.y = Math.abs(Math.sin(now * 7 + ph)) * 0.25; t.pivot.rotation.z = Math.sin(now * 3.5 + ph) * 0.15; t.pivot.rotation.x = 0;
      if (t.itemObj && Math.random() < dtReal * 2) App.spawnParticle && App.spawnParticle({ kind: "spark", x: t.itemObj.position.x, y: t.itemObj.position.y + 1.2, z: t.itemObj.position.z, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random(), vz: (Math.random() - 0.5) * 1.5, age: 0, life: 1.2, color: new THREE.Color(["#ffd23f", "#ff8fc0", "#8fd3f4"][Math.floor(Math.random() * 3)]) });
      return true;
    }
    if (use === "lift") { const b = Math.abs(Math.sin(now * 2.5 + ph)); t.pivot.position.y = -0.25 + b * 0.25; t.pivot.rotation.x = 0.05; return true; }
    if (use === "dig") {
      t.pivot.rotation.x = 0.32 + Math.sin(now * 4.4 + ph) * 0.2; t.pivot.position.y = 0;
      if (t.itemObj && Math.random() < dtReal * 1.2) App.spawnParticle && App.spawnParticle({ kind: "spark", x: t.itemObj.position.x, y: t.itemObj.position.y + 0.8, z: t.itemObj.position.z, vx: (Math.random() - 0.5), vy: 2, vz: (Math.random() - 0.5), age: 0, life: 0.8, color: new THREE.Color("#ffd23f") });
      return true;
    }
    if (use === "trick") {
      // an ollie now and then, sometimes with a spin
      const c = (now * 0.3 + ph) % 1, up = c < 0.12 ? Math.sin((c / 0.12) * Math.PI) : 0;
      t.pivot.position.y = 0.28 + up * 0.9; t.pivot.rotation.x = 0;
      if (t.itemObj) t.itemObj.position.y = 0.02 + up * 0.9;
      if (up > 0 && (Math.floor(now * 0.3 + ph) % 3 === 0)) t.group.rotation.y = t.heading + up * Math.PI * 2;
      return true;
    }
    if (use === "skate") { t.pivot.position.y = 0.28; t.pivot.rotation.z = Math.sin(now * 2.2 + ph) * 0.18; t.pivot.rotation.x = 0.1; return true; }
    if (use === "fish" && t.itemObj && t.itemObj.parent) {
      // a line from the tip of the rod to a float on the water
      t.pivot.position.y = 0; t.pivot.rotation.x = 0;
      if (!t.fishGear) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf4f8fc }));
        const bob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: 0xff3b2f }));
        App.scene.add(line, bob); t.fishGear = { line, bob };
      }
      t.group.updateMatrixWorld(true);
      t.itemObj.localToWorld(TIP.set(0, 6.2, 0));
      const fx = t.pos.x + Math.sin(t.heading) * 5, fz = t.pos.z + Math.cos(t.heading) * 5, s = App.surfaceAt(fx, fz);
      const by = (s.water ? App.WATER_Y : s.y) + Math.sin(now * 2.5 + ph) * 0.05;
      t.fishGear.bob.position.set(fx, by, fz);
      const pos = t.fishGear.line.geometry.attributes.position;
      pos.setXYZ(0, TIP.x, TIP.y, TIP.z); pos.setXYZ(1, fx, by, fz); pos.needsUpdate = true;
      return true;
    }
    return false;
  }
  function animate(t, walking, dtReal) {
    armPose(t, walking, dtReal);
    const s = App.surfaceAt(t.pos.x, t.pos.z);
    const swimming = t.action && t.action.water && t.action.phase === "doing";
    let ty = s.y;
    if (s.water) ty = App.WATER_Y - (swimming ? 0.95 : 0.7);
    if (t.flyY != null) ty = t.flyY; // up on a griffin
    // aboard a boat or out on a surfboard the height is set by the boat or the wave (also while the game is paused)
    const aboard = t.action && (t.action.kind === "ride" || t.action.kind === "row" || t.action.kind === "sail" || (t.action.surf && t.action.phase === "doing"));
    if (!aboard) t.pos.y += (ty - t.pos.y) * Math.min(1, dtReal * 10);
    t.group.position.copy(t.pos);
    t.group.rotation.y = t.heading;
    const act0 = t.action && t.action.act;
    const sleeping = act0 && (act0.id === "rest" || act0.id === "recover") && t.action.phase === "doing";
    // asleep (or recovering) means inside the house
    const indoor = act0 && INDOOR.has(act0.id) && t.action.phase === "doing";
    t.group.visible = !(indoor && (t.action.indoor || Math.hypot(t.pos.x - t.home.x, t.pos.z - t.home.z) < 1.6)) && !(t.action && t.action.kind === "delve" && t.action.phase === "inside");
    const now = performance.now();
    if (t.action && (t.action.kind === "box" || t.action.kind === "ringwait") && !walking) {
      const k = Math.max(0, 1 - (now - (t.punchAt || 0)) / 260), hit = Math.max(0, 1 - (now - (t.hitAt || 0)) / 300);
      t.pivot.position.z = k * 0.45 - hit * 0.3; t.pivot.rotation.x = 0.12 + k * 0.2 - hit * 0.25;
      t.pivot.rotation.z = Math.sin(now / 160 + t.id) * 0.08; t.pivot.position.y = Math.abs(Math.sin(now / 180 + t.id)) * 0.08;
      return;
    }
    if ((t.weaponObj || t.shieldObj) && !(t.action && (t.action.kind === "slay" || t.action.kind === "forge" || (t.action.kind === "fp" && performance.now() - (t.action.armedAt || 0) < 8000)))) App.weaponShow(t, null);
    if (t.action && t.action.kind === "command" && !walking) {
      const k = Math.max(0, 1 - (now - (t.throwAt || 0)) / 500);
      t.pivot.rotation.x = -0.25 * k + 0.05; t.pivot.position.y = k * 0.2; t.pivot.rotation.z = Math.sin(now / 200) * 0.05;
      return;
    }
    if (t.action && t.action.kind === "slay" && !walking) {
      const k = Math.max(0, 1 - (now - (t.swingAt || 0)) / 320);
      t.pivot.rotation.x = 0.3 * k; t.pivot.position.y = k * 0.1; t.pivot.rotation.z = 0;
      if (t.weaponObj && !t.arms) t.weaponObj.rotation.x = k > 0 ? -0.7 + (1 - k) * 2.4 : 0.25; // with arms, the arm swings it
      return;
    }
    if (!walking && t.action && t.action.item && t.action.phase === "doing" && itemPose(t, dtReal)) return;
    if (t.action && t.action.kind === "cheer") { t.pivot.position.y = Math.abs(Math.sin(now / 120)) * 0.45; t.pivot.rotation.z = Math.sin(now / 90) * 0.15; return; }
    if (!walking && act0 && t.action.phase === "doing" && act0.anim === "chant") { t.pivot.position.y = Math.abs(Math.sin(now / 420 + t.id * 0.3)) * 0.2; t.pivot.rotation.x = Math.sin(now / 420 + t.id * 0.3) * 0.18; t.pivot.rotation.z = 0; return; }
    t.pivot.position.z = 0;
    if (t.action && t.action.kind === "brawl" && !walking) {
      const k = Math.max(0, 1 - (performance.now() - (t.swingAt || 0)) / 300);
      t.pivot.rotation.x = 0.4 * k - 0.05; t.pivot.position.y = k * 0.1; t.pivot.rotation.z = 0;
      return;
    }
    const time = performance.now() / 1000;
    if (t.action && t.action.kind === "ko") {
      t.pivot.rotation.x += (-1.45 - t.pivot.rotation.x) * Math.min(1, dtReal * 6);
      t.pivot.position.y = 0.35; t.pivot.position.z = 0; t.pivot.rotation.z = 0;
      return;
    }
    if (t.action && t.action.kind === "fight" && t.action.phase === "doing") {
      t.pivot.position.z = Math.max(0, Math.sin(time * 9 + t.id)) * 0.35;
      t.pivot.position.y = Math.abs(Math.sin(time * 9 + t.id)) * 0.12;
      t.pivot.rotation.x = 0.18; t.pivot.rotation.z = Math.sin(time * 7) * 0.06;
      return;
    }
    t.pivot.position.z = 0;
    if (t.action && t.action.kind === "throw" && t.action.phase === "doing") {
      const k = Math.max(0, 1 - (performance.now() - (t.throwAt || 0)) / 400);
      t.pivot.rotation.x = -0.3 * k + 0.05; t.pivot.position.y = k * 0.12; t.pivot.rotation.z = 0;
      return;
    }
    if (!walking && act0 && t.action.phase === "doing" && act0.anim === "sitWatch") {
      // on the stone seats; now and then up on its feet cheering
      const c = (now / 1700 + t.id * 0.37) % 1;
      t.pivot.position.y = c < 0.18 ? Math.abs(Math.sin(now / 110)) * 0.3 : -0.18; t.pivot.rotation.x = c < 0.18 ? 0 : 0.06; t.pivot.rotation.z = 0;
      return;
    }
    if (!walking && act0 && t.action.phase === "doing" && act0.anim === "sitEat") {
      // sitting: up on a log, or down on the ground, leaning in to the fire
      t.pivot.position.y = t.action.seat === "log" ? 0.32 : t.action.seat === "ground" ? -0.3 : 0; t.pivot.rotation.x = 0.08; t.pivot.rotation.z = 0;
      return;
    }
    if (!walking && act0 && t.action.phase === "doing" && act0.anim === "dig") {
      t.pivot.rotation.x = 0.32 + Math.sin(time * 4.5 + t.id) * 0.22; t.pivot.position.y = 0; t.pivot.rotation.z = 0;
      return;
    }
    if (!walking && act0 && t.action.phase === "doing" && act0.anim === "reach") {
      t.pivot.position.y = Math.abs(Math.sin(time * 3.5 + t.id)) * 0.25; t.pivot.rotation.x = -0.12; t.pivot.rotation.z = 0;
      return;
    }
    if (t.riding) {
      // in the saddle: rising and falling with the trot (or the wingbeats)
      t.pivot.position.y = t.riding.seat + (t.riding.bob || 0); t.pivot.rotation.x = t.riding.fly ? 0.1 : 0.04; t.pivot.rotation.z = 0;
    } else if (walking && t.itemMode === "ride") {
      t.pivot.position.y = 0.28; t.pivot.rotation.z = Math.sin(performance.now() / 300 + t.id) * 0.05; t.pivot.rotation.x = 0;
    } else if (walking) {
      t.walk += dtReal * Math.min(3, st.speed) * 9;
      t.pivot.position.y = Math.abs(Math.sin(t.walk)) * 0.16;
      t.pivot.rotation.z = Math.sin(t.walk) * 0.07;
      t.pivot.rotation.x = 0.05;
    } else if (sleeping) {
      t.pivot.rotation.x += (-1.45 - t.pivot.rotation.x) * Math.min(1, dtReal * 4);
      t.pivot.position.y = 0.35;
      t.pivot.rotation.z = 0;
      if (!t.bubble || st.T > t.bubble.until) say(t, "Zzz", 6);
    } else {
      const time = performance.now() / 1000;
      t.pivot.rotation.x += (0 - t.pivot.rotation.x) * Math.min(1, dtReal * 6);
      t.pivot.rotation.z *= 0.8;
      t.pivot.position.y = swimming ? Math.sin(time * 2 + t.id) * 0.06 : 0;
      const act = t.action && t.action.phase === "doing" && t.action.act;
      if (act && act.needs.fun > 20 && !swimming) t.pivot.position.y = Math.abs(Math.sin(time * 6 + t.id)) * 0.12;
    }
  }
  function separate() {
    const T = st.tickles;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      const floaty = (x) => x.action && (x.action.kind === "held" || x.action.kind === "flying" || x.action.kind === "spirit" || x.action.kind === "fall" || x.action.kind === "box" || x.action.kind === "ride" || x.action.kind === "row" || (x.action.kind === "contest" && x.action.fixed) || x.action.kind === "dive" || x.action.kind === "sail" || x.flyY != null || (x.action.indoor && x.action.phase === "doing") || !x.group.visible); // (nor anyone indoors)
      if (floaty(a) || floaty(b)) continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
      if (d < 1.05 && d > 1e-4) {
        const push = (1.05 - d) * 0.25;
        // a nudge never pushes anyone into water they shouldn't be in
        const ok = (t, x, z) => (App.isLand(x, z) || !App.isLand(t.pos.x, t.pos.z)) && (App.canFloat(t) || !App.pondWater(x, z) || App.pondWater(t.pos.x, t.pos.z)) && App.climbOK(t.pos.x, t.pos.z, x, z) && !inTheWay(x, z, t, null, null); // (two Tickles side by side never push each other into a wall)
        const ax = a.pos.x - (dx / d) * push, az = a.pos.z - (dz / d) * push, bx = b.pos.x + (dx / d) * push, bz = b.pos.z + (dz / d) * push;
        if (ok(a, ax, az)) { a.pos.x = ax; a.pos.z = az; }
        if (ok(b, bx, bz)) { b.pos.x = bx; b.pos.z = bz; }
      }
    }
  }

  let raidWatchT = -1;
  App.step = (dtReal) => {
    const dm = Math.min(dtReal, 0.1) * st.speed;
    const night0 = App.isNight;
    if (st.speed > 0) {
      st.T += dm;
      for (const t of st.tickles) stepTickle(t, dm, dtReal);
      App.stepFaith && App.stepFaith(dm);
      separate();
      if (st.T - st.popT >= 15) { App.popTick(st.T - st.popT); st.popT = st.T; }
      App.villageTick();
      App.creatureTick();
      App.dungeonTick();
      App.fateTick();
      App.factionTick && App.factionTick();
      App.rampageTick && App.rampageTick();
      App.lairTick && App.lairTick();
      App.faithTick && App.faithTick();
      App.mineTick && App.mineTick();
      App.guildTick && App.guildTick();
      App.casinoTick && App.casinoTick();
      App.parliamentTick && App.parliamentTick();
      App.contestTick && App.contestTick();
      App.diveTick && App.diveTick();
      App.seaTick && App.seaTick();
      App.warTick && App.warTick();
      App.wealthTick && App.wealthTick();
      App.weatherTick && App.weatherTick();
      App.ferryTick && App.ferryTick();
      if (!(st.T < raidWatchT + 0.5)) { raidWatchT = st.T; raidWatch(); }
      if (st.event && st.T > st.event.until) {
        App.log("event", st.event.name + " is over.", "");
        const a = App.actById(st.event.actId);
        if (a && a.status === "auto") a.status = "rejected";
        st.event = null;
      }
      if (st.mode === "auto" && st.T >= st.director.next) {
        st.director.next = st.T + 150;
        App.directorRun({ apply: true });
      }
    } else for (const t of st.tickles) {
      // paused: everyone keeps still in its pose (a racer in its kart, a singer on the stage...)
      if (t.action && t.action.kind === "contest" && App.stepContest) App.stepContest(t, t.action, 0, dtReal);
      else if (t.action && t.action.kind === "dive" && App.stepDive) App.stepDive(t, t.action, 0, dtReal);
      else animate(t, false, dtReal);
    }
    App.daylight(App.clock(st.T).minute);
    if (night0 !== App.isNight && App.isNight) App.log("world", "Night falls.", "Tickles head home to sleep.");
  };

  // ---------- projects (Minecraft-style building) ----------
  const BLUEPRINTS = {
    "Lookout Tower": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h;
      for (let y = 0; y < 6; y++) for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) b.push([o.x + x, h0 + y, o.z + z, P.STONE]);
      for (let x = -1; x < 3; x++) for (let z = -1; z < 3; z++) b.push([o.x + x, h0 + 6, o.z + z, P.PLANK]);
      for (let x = -1; x < 3; x++) for (let z = -1; z < 3; z++) if ((x === -1 || x === 2 || z === -1 || z === 2) && (x + z) % 2 === 0) b.push([o.x + x, h0 + 7, o.z + z, P.WOOD]);
      b.push([o.x, h0 + 8, o.z, P.RED]);
      return b;
    },
    "Beach Hut": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h;
      for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) b.push([o.x + x, h0, o.z + z, P.PLANK]);
      for (let y = 1; y <= 3; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) {
        if (!(x === 0 || x === 4 || z === 0 || z === 4)) continue;
        if (z === 4 && x === 2 && y < 3) continue;
        b.push([o.x + x, h0 + y, o.z + z, (x === 0 || x === 4) && (z === 0 || z === 4) ? P.WOOD : P.PLANK]);
      }
      const roof = o.color || P.RED;
      for (let x = -1; x < 6; x++) for (let z = -1; z < 6; z++) b.push([o.x + x, h0 + 4, o.z + z, roof]);
      for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) b.push([o.x + x, h0 + 5, o.z + z, roof]);
      for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) b.push([o.x + x, h0 + 6, o.z + z, roof]);
      return b;
    },
    "Flower Garden": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h, cols = [P.PINK, P.YELLOW, P.RED, P.WHITE];
      for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) {
        b.push([o.x + x, h0 - 1, o.z + z, P.GRASS]);
        if ((x + z) % 2 === 0 && x > 0 && z > 0 && x < 5 && z < 5) b.push([o.x + x, h0, o.z + z, cols[(x * 3 + z) % 4]]);
        else if (x === 0 || z === 0 || x === 5 || z === 5) b.push([o.x + x, h0, o.z + z, P.LEAF]);
      }
      return b;
    },
    "Stone Bridge Path": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h;
      for (let i = 0; i < 9; i++) for (let w = 0; w < 2; w++) b.push([o.x + i, h0 - 1, o.z + w, P.PATH]);
      for (let i = 0; i < 9; i += 4) b.push([o.x + i, h0, o.z - 1, P.YELLOW], [o.x + i, h0, o.z + 2, P.YELLOW]);
      return b;
    },
  };
  const REWARDS = {
    "Lookout Tower": ["Enjoy the view", "is enjoying the view", { fun: 22, energy: 10 }, 4, 20],
    "Beach Hut": ["Hang out in the hut", "is hanging out in the hut", { energy: 35, social: 12 }, 4, 30],
    "Flower Garden": ["Tend the garden", "is tending the garden", { fun: 16, social: 8, energy: 6 }, 4, 20],
    "Stone Bridge Path": ["Race down the path", "is racing down the path", { fun: 24, social: 8, energy: -8 }, 4, 12],
  };
  App.BLUEPRINTS = BLUEPRINTS;
  function blueprintSite(v) {
    for (let tries = 0; tries < 90; tries++) {
      const a = rnd() * 6.28, r = v.r + 6 + rnd() * 22;
      const x = Math.floor(v.x + Math.cos(a) * r), z = Math.floor(v.z + Math.sin(a) * r);
      let ok = true, h = null;
      for (let dx = -1; dx < 8 && ok; dx++) for (let dz = -1; dz < 7 && ok; dz++) {
        const hh = App.columnHeight(x + dx, z + dz);
        if (hh < App.SEA + 1 || hh > App.SEA + 12) ok = false;
        else if (h === null) h = hh; else if (Math.abs(hh - h) > 1) ok = false;
        const wx = x + dx + 0.5, wz = z + dz + 0.5;
        if (v.homes.some((s) => Math.hypot(wx - s.x, wz - s.z) < 2.5)) ok = false;
        if (App.sceneryVisible.some((s) => Math.hypot(wx - s.x, wz - s.z) < 2.5)) ok = false;
        if (st.props.some((p) => Math.hypot(wx - p.x, wz - p.z) < 2 + p.rad)) ok = false;
        if (st.projects.some((pr) => Math.hypot(wx - pr.site.x, wz - pr.site.z) < 8)) ok = false;
      }
      if (ok) return { grid: { x, z, h }, site: { x: x + 2.5, z: z + 2.5 } };
    }
    return null;
  }
  App.makeProject = (name, source, status) => {
    const v = App.activeVillage;
    if (!v) return null;
    const loc = blueprintSite(v);
    if (!loc) return null;
    const P = App.BLOCK;
    const blocks = BLUEPRINTS[name](Object.assign({ color: [P.RED, P.BLUE, P.YELLOW, P.PINK][Math.floor(rnd() * 4)] }, loc.grid));
    const pr = { id: uid("pr"), name, blocks, next: 0, site: loc.site, island: v.i, islandName: v.name, done: false, source, status, createdAt: st.T, kind: "structure" };
    st.projects.push(pr);
    return pr;
  };
  function buildStep(pr, t) {
    if (pr.done) return;
    while (pr.next < pr.blocks.length && App.getBlock(pr.blocks[pr.next][0], pr.blocks[pr.next][1], pr.blocks[pr.next][2]) === pr.blocks[pr.next][3]) pr.next++;
    if (pr.next < pr.blocks.length) { const [x, y, z, ty] = pr.blocks[pr.next++]; App.setBlock(x, y, z, ty); }
    if (pr.next >= pr.blocks.length) finishProject(pr, t);
  }
  function finishProject(pr, t) {
    pr.done = true;
    const [name, verb, needs, capacity, minutes] = REWARDS[pr.name];
    const act = { id: uid("act"), name, verb, needs, capacity, minutes, where: "projectDone", source: pr.source, status: pr.status === "pending" ? "pending" : pr.status, createdAt: st.T, project: pr.id };
    st.acts.push(act);
    pr.rewardAct = act.id;
    App.log("build", "The " + pr.name + " on " + pr.islandName + " is finished" + (t ? " (last block by " + t.name + ")" : "") + ".", "New activity unlocked: " + name + ".");
    for (const o of st.tickles) if (o.action && o.action.project === pr) endAction(o, true);
  }
  App.finishProject = finishProject;

  // ---------- assets: design -> voxelize -> verify ----------
  function checkMechanic(a) {
    const out = [];
    const add = (id, label, status, detail) => out.push({ id, label, status, detail });
    if (!a) return { checks: [], score: 100, fails: 0 };
    const vals = NEEDS.map((k) => +(a.needs || {})[k] || 0);
    const pos = vals.filter((v) => v > 0).reduce((x, y) => x + y, 0);
    add("named", "Named and described", a.name && a.verb ? "pass" : "fail", a.name ? '"' + a.name + '"' : "Missing a name");
    add("range", "Need effects in range", vals.every((v) => v >= -30 && v <= 60) ? "pass" : "fail", NEEDS.map((k, i) => NEED_LABEL[k] + " " + (vals[i] > 0 ? "+" : "") + vals[i]).join(", "));
    add("worth", "Worth doing", pos >= 12 && pos <= 95 ? "pass" : pos > 95 ? "fail" : "warn", "Total benefit " + pos + " (core activities give 18\u201355)");
    add("time", "Duration", a.minutes >= 4 && a.minutes <= 60 ? "pass" : "warn", a.minutes + " game minutes");
    add("cap", "Capacity", a.capacity >= 1 && a.capacity <= 8 ? "pass" : "warn", a.capacity + " Tickle" + (a.capacity === 1 ? "" : "s") + " at once");
    const fails = out.filter((c) => c.status === "fail").length;
    const score = Math.round(((out.filter((c) => c.status === "pass").length + out.filter((c) => c.status === "warn").length * 0.5) / out.length) * 100);
    return { checks: out, score, fails };
  }
  App.checkMechanic = checkMechanic;
  function normActivity(a) {
    if (!a) return null;
    const needs = {};
    for (const k of NEEDS) { const v = Math.round(+((a.needs || {})[k]) || 0); if (v) needs[k] = v; }
    return { name: String(a.name || "Use it").slice(0, 40), verb: String(a.verb || "is using it").slice(0, 60), needs,
      capacity: clamp(Math.round(+a.capacity || 2), 1, 12), minutes: clamp(Math.round(+a.minutes || 15), 1, 120) };
  }
  App.createAsset = async (design, source) => {
    const asset = {
      id: uid("a"), name: String(design.name || "Untitled").slice(0, 40), template: design.template || null, category: design.category || "decor",
      purpose: design.purpose || "", strokes: TB.sanitize(design.strokes), activity: normActivity(design.activity), source,
      status: "checking", createdAt: st.T, brief: design.brief || "", basedOn: design.basedOn || null, keepY: !!design.keepY,
      waterside: !!design.waterside || ["Beach Umbrella", "Lounge Chair"].includes(design.template),
    };
    const res = await App.job("compact", { strokes: asset.strokes, voxel: 8 });
    asset.md = res.mesh;
    const ck = TB.check(asset, res.vox);
    asset.checks = ck.checks; asset.score = ck.score; asset.fails = ck.fails;
    asset.voxels = res.vox.count;
    const mk = checkMechanic(asset.activity);
    asset.actChecks = mk.checks; asset.actFails = mk.fails;
    asset.passes = asset.fails === 0 && asset.actFails === 0 && asset.score >= 70;
    st.assets.push(asset);
    return asset;
  };
  App.activateAsset = (asset, status) => {
    asset.status = status;
    if (asset.activity && !st.acts.some((a) => a.assetId === asset.id)) {
      st.acts.push(Object.assign({ id: "act_" + asset.id, where: "prop", assetId: asset.id, source: asset.source, status, createdAt: st.T }, asset.activity));
    }
    for (const a of st.acts) if (a.assetId === asset.id) a.status = status;
    if (asset.activity) st.latest = asset.name;
  };
  App.rejectAsset = (asset) => {
    asset.status = "rejected";
    for (const a of st.acts) if (a.assetId === asset.id) a.status = "rejected";
    for (const p of st.props.slice()) if (p.assetId === asset.id) App.removeProp(p);
  };

  // ---------- Director ----------
  App.diagnose = () => {
    const ts = st.tickles, n = Math.max(1, ts.length), out = {};
    const tx = App.cam.target.x, tz = App.cam.target.z;
    const nearT = (x, z) => Math.hypot(x - tx, z - tz) < App.RANGE.full + 10;
    for (const k of NEEDS) {
      const avg = ts.length ? ts.reduce((s, t) => s + t.needs[k], 0) / n : 70;
      let supply = 0;
      for (const a of st.acts) {
        if (!App.actActive(a) || (a.needs[k] || 0) < 15) continue;
        if (a.where === "home") supply += k === "energy" ? n * 0.5 : 0;
        else if (a.where === "ground") { for (const t of ts) if (t.ground === a.ground) supply += ITEM_USE[a.ground] && ITEM_USE[a.ground].join ? 2 : 1; }
        else if (a.where === "scenery") { for (const s of App.sceneryVisible) if (s.type === a.scenery && nearT(s.x, s.z)) supply += Math.min(a.capacity, 3); }
        else if (a.where === "prop") { for (const p of st.props) if (p.assetId === a.assetId && nearT(p.x, p.z)) supply += Math.min(a.capacity, 3); }
        else if (a.where === "water" || a.where === "sand") supply += 2;
        else if (a.where === "projectDone") supply += Math.min(a.capacity, 3);
      }
      const gap = clamp((72 - avg) / 72, 0, 1) * (1 - Math.min(1, supply / (n * 0.8)));
      out[k] = { avg, supply, gap };
    }
    return out;
  };
  const MECH_IDEAS = {
    fun: [["Duck Race", "is racing rubber ducks"], ["Shell Hunt", "is hunting for shells"], ["Sandcastle Contest", "is judging sandcastles"], ["Limbo", "is doing the limbo"], ["Wave Counting", "is counting waves"], ["Cannonball Contest", "is doing cannonballs"]],
    social: [["Story Circle", "is telling stories"], ["Sunset Karaoke", "is singing karaoke"], ["Gossip Hour", "is gossiping"], ["Dance-off", "is in a dance-off"], ["Talent Show", "is showing off a talent"]],
    hunger: [["Coconut Feast", "is feasting on coconuts"], ["Snack Swap", "is swapping snacks"], ["Fish Fry", "is frying fish"]],
    energy: [["Stargazing", "is stargazing"], ["Cloud Watching", "is watching clouds"], ["Siesta Club", "is at siesta club"]],
  };
  function proposeMechanic(need) {
    const ideas = MECH_IDEAS[need] || MECH_IDEAS.fun;
    const used = new Set(st.acts.map((a) => a.name));
    const free = ideas.filter(([n]) => !used.has(n));
    if (!free.length) return null; // every idea for this need already exists: no second copy of one
    const [name, verb] = free[Math.floor(rnd() * free.length)];
    const hosts = [];
    const sceneryName = (k) => (TB.FRAGMENTS[k] ? TB.FRAGMENTS[k].name : TB.KIT[App.kindOf(k)] ? TB.KIT[App.kindOf(k)].name : k);
    for (const k in SCENERY_ACTS) if (App.sceneryVisible.some((s) => s.type === k)) hosts.push({ where: "scenery", scenery: k, label: "the " + sceneryName(k).toLowerCase() + "s" });
    for (const g of new Set(st.tickles.map((t) => t.ground).filter(Boolean))) hosts.push({ where: "ground", ground: g, label: "anyone with a " + g });
    hosts.push({ where: "sand", label: "the beach" });
    const h = hosts[Math.floor(rnd() * hosts.length)];
    const needs = {}; needs[need] = 22 + Math.round(rnd() * 18);
    const other = NEEDS.filter((k) => k !== need)[Math.floor(rnd() * 3)];
    needs[other] = (other === "energy" && rnd() < 0.5 ? -1 : 1) * (4 + Math.round(rnd() * 10));
    const act = { id: uid("act"), name, verb, needs, capacity: 2 + Math.floor(rnd() * 4), minutes: 12 + Math.floor(rnd() * 16),
      where: h.where, scenery: h.scenery, ground: h.ground, hostLabel: h.label, kind: "mechanic", createdAt: st.T };
    const mk = checkMechanic(act);
    act.checks = mk.checks; act.score = mk.score; act.fails = mk.fails;
    return act;
  }

  App.directorRun = async (opts) => {
    opts = opts || {};
    const apply = st.mode === "auto" && opts.apply !== false;
    if (!st.tickles.length && !opts.force) return null;
    const diag = App.diagnose();
    const c = App.clock(st.T);
    st.director.runs++;
    const isl = App.activeVillage;
    const cands = [];
    for (const k of NEEDS) if (diag[k].gap > 0.1) cands.push({ type: "prop", need: k, score: diag[k].gap + 0.12,
      why: NEED_LABEL[k] + " averages " + Math.round(diag[k].avg) + "% around " + isl.name + " and only " + Math.round(diag[k].supply) + " spots help it for " + st.tickles.length + " Tickles." });
    // new looks for the collection's own items (on-chain themes on on-chain pieces)
    if (st.T - (st.director.lastRemix || -9999) > 600) cands.push({ type: "remix", score: 0.22, why: "A new look for the collection's beach umbrella: the on-chain piece recoloured with one of its 13 themes." });
    const helpers = {};
    for (const k of NEEDS) helpers[k] = st.assets.filter((a) => a.activity && App.actActive(a) && (a.source === "director" || a.source === "claude") && (a.activity.needs[k] || 0) >= 15).length;
    const thin = NEEDS.filter((k) => helpers[k] < 2).sort((a, b) => diag[a].avg - diag[b].avg)[0];
    if (thin && st.T - (st.director.lastVariety || 0) > 280) cands.push({ type: "prop", need: thin, variety: true, score: 0.27 + diag[thin].gap,
      why: (helpers[thin] ? "Only one designed object helps " : "Nothing designed helps ") + NEED_LABEL[thin].toLowerCase() + " yet (" + Math.round(diag[thin].avg) + "% on average). More choice keeps Tickles from crowding one spot." });
    if (st.T - st.director.lastMech > 1100) {
      const worst = NEEDS.slice().sort((a, b) => diag[a].avg - diag[b].avg)[0];
      cands.push({ type: "mechanic", need: worst === "energy" ? "fun" : worst, score: 0.32, why: "Nothing new to do for most of a day; " + NEED_LABEL[worst].toLowerCase() + " is the lowest need." });
    }
    if (!st.projects.some((p) => !p.done && App.actActive(p) && p.island === isl.i) && st.T - st.director.lastProject > 900) cands.push({ type: "structure", score: 0.3 + diag.fun.gap * 0.3, why: isl.name + " has no shared building project right now." });
    if (c.hh >= 17 && c.hh < 21 && diag.social.avg < 58 && !st.event) cands.push({ type: "event", score: 0.55, why: "Social averages " + Math.round(diag.social.avg) + "% at dusk; a gathering would help." });
    if (opts.force) cands.push(Object.assign({ score: 9 }, opts.force));
    if (!cands.length) {
      if (opts.manualAsk || apply) App.log("director", "Director checked " + isl.name + ": everyone is doing fine.", needsLine(diag));
      return null;
    }
    cands.sort((a, b) => b.score + rnd() * 0.05 - (a.score + rnd() * 0.05));
    try { return await perform(cands[0], apply); }
    catch (e) { console.error(e); App.log("director", "Director hit a problem: " + e.message, ""); return null; }
  };
  function needsLine(diag) { return NEEDS.map((k) => NEED_LABEL[k] + " " + Math.round(diag[k].avg) + "%").join(" \u00b7 "); }
  App.needsLine = needsLine;
  function demandPoint(need) {
    const ts = st.tickles.slice().sort((a, b) => a.needs[need] - b.needs[need]).slice(0, 4);
    const isl = App.activeVillage;
    const ang = rnd() * 6.28, out = { x: isl.x + Math.cos(ang) * (isl.r + 6), z: isl.z + Math.sin(ang) * (isl.r + 6) };
    if (!ts.length) return out;
    const x = ts.reduce((s, t) => s + t.pos.x, 0) / ts.length, z = ts.reduce((s, t) => s + t.pos.z, 0) / ts.length;
    return { x: (x + out.x) / 2, z: (z + out.z) / 2 };
  }
  // remix: an on-chain Ground item or floor piece recoloured with an on-chain theme
  // only man-made things get new colours; palms, trees, rocks, logs and fires stay as they are on-chain
  const REMIXABLE = ["umbrella"];
  App.designRemix = (pref) => {
    const R = TB.repo();
    const opts = [];
    for (const k of REMIXABLE) opts.push({ kind: "fragment", key: k, name: TB.FRAGMENTS[k].name });
    const src = pref || opts[Math.floor(rnd() * opts.length)];
    // a colour this piece does not have yet, so the same remix never comes up twice
    const taken = new Set(st.assets.filter((a) => a.status !== "discarded").map((a) => a.name));
    const fresh = TB.THEMES.map((x, i) => i).filter((i) => !taken.has(TB.THEME_NAMES[i] + " " + src.name));
    const theme = fresh.length ? fresh[Math.floor(rnd() * fresh.length)] : Math.floor(rnd() * TB.THEMES.length);
    let layers;
    if (src.kind === "ground") layers = TB.recolor(TB.clone(R.models.ground[src.index].the.layers.filter((L) => L.subparts.length)), theme);
    else layers = TB.recolor(TB.fragmentLayers(src.key), theme);
    const strokes = TB.recenterCompact(TB.toCompact(layers));
    let activity = null;
    if (src.kind === "ground") { const g = App.GROUND_ACTS[src.name]; activity = { name: g[0], verb: g[1], needs: Object.assign({}, g[2]), capacity: g[3], minutes: g[4] }; }
    else { const g = SCENERY_ACTS[src.key]; activity = { name: g[0], verb: g[1], needs: Object.assign({}, g[2]), capacity: g[3], minutes: g[4] }; }
    const cat = Object.entries(activity.needs).sort((a, b) => b[1] - a[1])[0][0];
    return { name: TB.THEME_NAMES[theme] + " " + src.name, template: "remix", category: cat, strokes, activity, keepY: src.kind === "fragment", waterside: src.key === "umbrella",
      basedOn: "On-chain " + src.name + " with the on-chain " + TB.THEME_NAMES[theme] + " theme" };
  };

  async function perform(pick, apply) {
    const who = "Director";
    const isl = App.activeVillage;
    if (pick.type === "prop" || pick.type === "decor" || pick.type === "remix") {
      let asset = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        let d;
        if (pick.type === "remix") d = App.designRemix();
        else {
          const need = pick.type === "decor" ? "decor" : pick.need;
          const pool = TB.NEED_TEMPLATES[need];
          // half the time build on an on-chain piece that serves this need
          const onchain = Object.entries(SCENERY_ACTS).filter(([k, g]) => REMIXABLE.includes(k) && (g[2][need] || 0) >= 15).map(([k]) => ({ kind: "fragment", key: k, name: TB.FRAGMENTS[k].name }))
;
          if (onchain.length && rnd() < 0.5) d = App.designRemix(onchain[Math.floor(rnd() * onchain.length)]);
          else d = TB.design(pool[Math.floor(rnd() * pool.length)], (Math.random() * 1e9) | 0);
        }
        d.brief = pick.why;
        // a design with this name already exists: never a second copy in Review
        const twin = st.assets.find((a) => a.name === String(d.name || "").slice(0, 40) && a.status !== "discarded");
        if (twin) {
          if (twin.status === "rejected") continue; // you said no to it: try something else
          if (twin.status === "pending") return null; // already waiting for your review
          if (!apply) return null;
          const at = pick.need ? demandPoint(pick.need) : { x: isl.x, z: isl.z };
          const spot = App.findSpot(at.x, at.z, 3, { nearWater: twin.waterside });
          if (!spot) return null;
          App.placeProp(twin, spot.x, spot.z);
          App.log("design", who + " placed another " + twin.name + " on " + isl.name + ".", pick.why + " It is the same design as before, so there is nothing new to review.", { asset: twin.id });
          if (pick.variety) st.director.lastVariety = st.T;
          if (pick.type === "remix") st.director.lastRemix = st.T;
          return twin;
        }
        asset = await App.createAsset(d, "director");
        if (asset.passes) break;
        App.log("director", who + " discarded its own " + asset.name + " (fidelity " + asset.score + "%).", firstProblem(asset));
        App.rejectAsset(asset);
        asset.status = "discarded";
        asset = null;
      }
      if (!asset) return null;
      if (pick.variety) st.director.lastVariety = st.T;
      if (pick.type === "remix") st.director.lastRemix = st.T;
      const target = pick.need ? demandPoint(pick.need) : { x: isl.x + (rnd() - 0.5) * isl.r * 2, z: isl.z + (rnd() - 0.5) * isl.r * 2 };
      asset.suggestAt = target;
      if (apply) {
        const spot = App.findSpot(target.x, target.z, 3, { nearWater: asset.waterside });
        if (spot) App.placeProp(asset, spot.x, spot.z);
        App.activateAsset(asset, "auto");
        App.log("design", who + " designed and placed " + asset.name + " on " + isl.name + ".", pick.why + (asset.activity ? " It lets Tickles " + asset.activity.name.toLowerCase() + "." : ""), { asset: asset.id });
        App.toast("New on " + isl.name + ": " + asset.name);
      } else {
        asset.status = "pending";
        App.log("design", who + " proposes " + asset.name + " for " + isl.name + ". Waiting for your review.", pick.why, { asset: asset.id });
      }
      return asset;
    }
    if (pick.type === "mechanic") {
      const act = proposeMechanic(pick.need);
      if (!act) { st.director.lastMech = st.T; return null; }
      act.source = "director";
      act.status = apply ? (act.fails ? "rejected" : "auto") : "pending";
      st.acts.push(act);
      st.director.lastMech = st.T;
      if (apply && !act.fails) { App.log("mechanic", who + " invented a new activity: " + act.name + " at " + act.hostLabel + ".", pick.why, { act: act.id }); App.toast("New activity: " + act.name); st.latest = act.name; }
      else App.log("mechanic", who + " proposes a new activity: " + act.name + " at " + act.hostLabel + ".", pick.why, { act: act.id });
      return act;
    }
    if (pick.type === "structure") {
      const names = Object.keys(BLUEPRINTS);
      const order = names.slice().sort(() => rnd() - 0.5);
      let pr = null;
      for (const nm of order) { pr = App.makeProject(nm, "director", st.projects.some((p) => p.name === nm && p.status === "approved") ? "approved" : apply ? "auto" : "pending"); if (pr) break; }
      st.director.lastProject = st.T;
      if (!pr) return null;
      pr.why = pick.why;
      if (apply) { App.log("build", who + " started a building project on " + isl.name + ": " + pr.name + " (" + pr.blocks.length + " blocks).", pick.why + " Tickles who want fun will build it block by block.", { project: pr.id }); App.toast("Building project: " + pr.name); }
      else App.log("build", who + " proposes building a " + pr.name + " on " + isl.name + ".", pick.why, { project: pr.id });
      return pr;
    }
    if (pick.type === "event") {
      const names = pick.name ? [pick.name] : rnd() < 0.5 ? ["Bonfire Night", "Sunset Festival"] : ["Sunset Festival", "Bonfire Night"];
      const name = names.find((n) => !st.acts.some((a) => a.kind === "event" && a.name === n && a.status === "rejected"));
      if (!name) return null;
      // held before: the same event again, no second copy in Review
      const again = st.acts.find((a) => a.kind === "event" && a.name === name && a.status !== "rejected");
      if (again) {
        if (again.status === "pending" || !apply) return null;
        again.village = isl.i; again.hostLabel = isl.name + " square";
        startEvent(again);
        App.log("event", who + " called another " + name + " on " + isl.name + " square.", pick.why, { act: again.id });
        App.toast(name + " on " + isl.name + "!");
        return again;
      }
      const act = { id: uid("act"), name, verb: "is at the " + name.toLowerCase(), needs: { social: 42, fun: 16 }, capacity: 40, minutes: 40, where: "plaza", source: "director", status: apply ? "auto" : "pending", kind: "event", createdAt: st.T, village: isl.i, hostLabel: isl.name + " square" };
      const mk = checkMechanic(act); act.checks = mk.checks; act.score = mk.score; act.fails = mk.fails;
      st.acts.push(act);
      if (apply) { startEvent(act); App.log("event", who + " called a " + name + " on " + isl.name + " square.", pick.why, { act: act.id }); App.toast(name + " on " + isl.name + "!"); }
      else App.log("event", who + " proposes a " + name + " on " + isl.name + ".", pick.why, { act: act.id });
      return act;
    }
    return null;
  }
  // the same design approved twice is one design: keep the best copy of each name, point its placed
  // copies and its activity at it, and drop the rest. Runs on a saved world before it is rebuilt.
  const KEEP = { starter: 0, approved: 1, auto: 2, pending: 3, rejected: 4, discarded: 5 };
  const better = (a, b) => (KEEP[a.status] ?? 6) - (KEEP[b.status] ?? 6) || (b.score || 0) - (a.score || 0) || (a.createdAt || 0) - (b.createdAt || 0);
  App.dedupeSaved = (saved) => {
    let merged = 0;
    const keep = {}, swap = {};
    for (const a of (saved.assets || []).filter((x) => x.status !== "discarded").sort(better)) {
      if (!keep[a.name]) keep[a.name] = a;
      else { swap[a.id] = keep[a.name].id; merged++; }
    }
    saved.assets = (saved.assets || []).filter((a) => !swap[a.id]);
    for (const p of saved.props || []) if (swap[p.assetId]) p.assetId = swap[p.assetId];
    const acts = (saved.acts || []).filter((a) => !(a.assetId && swap[a.assetId]));
    // invented activities and events: one of each name
    const seen = {}, gone = new Set();
    for (const a of acts.filter((x) => !x.assetId && !x.project && (x.kind === "mechanic" || x.kind === "event")).sort(better)) {
      const k = a.kind + ":" + a.name;
      if (!seen[k]) { seen[k] = a; continue; }
      seen[k].uses = (seen[k].uses || 0) + (a.uses || 0);
      if (saved.event && saved.event.actId === a.id) saved.event.actId = seen[k].id;
      gone.add(a.id); merged++;
    }
    saved.acts = acts.filter((a) => !gone.has(a.id));
    // buildings: each one stays where it was built, but approving one name approves them all
    for (const p of saved.projects || []) if (p.status === "auto" && (saved.projects || []).some((q) => q.name === p.name && q.status === "approved")) {
      p.status = "approved";
      for (const a of saved.acts) if (a.project === p.id && a.status === "auto") a.status = "approved";
    }
    return merged;
  };
  function startEvent(act) { st.event = { name: act.name, actId: act.id, until: st.T + 200, village: act.village }; }
  App.startEvent = startEvent;
  function firstProblem(asset) {
    const c = (asset.checks || []).concat(asset.actChecks || []).find((x) => x.status === "fail") || (asset.checks || []).find((x) => x.status === "warn");
    return c ? c.label + ": " + c.detail : "";
  }
  App.firstProblem = firstProblem;

  // ---------- save / load ----------
  function b64f(f32) { const u8 = new Uint8Array(f32.buffer.slice(0)); let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64f(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); }
  App.serialize = () => {
    for (const t of st.tickles) { for (let k = 0; k < 4; k++) App.pop.needs[t.id * 4 + k] = t.needs[NEEDS[k]]; }
    return {
      v: 3, layout: App.LAYOUT, T: st.T, mode: st.mode, speed: st.speed, freeWill: st.freeWill, uid: st.uid, director: st.director, latest: st.latest, wallet: st.wallet,
      cam: { x: App.cam.target.x, z: App.cam.target.z, r: App.cam.radius, theta: App.cam.theta, phi: App.cam.phi },
      edits: App.exportEdits(), needs: b64f(App.pop.needs), rel: st.rel, fav: st.fav, moved: st.moved,
      assets: st.assets.filter((a) => a.status !== "discarded").map((a) => { const o = Object.assign({}, a); delete o.md; delete o._geo; return o; }),
      props: st.props.map((p) => ({ uid: p.uid, assetId: p.assetId, x: p.x, z: p.z, rot: p.rot })),
      acts: st.acts.filter((a) => a.source !== "core" && a.source !== "onchain"), projects: st.projects, log: st.log.slice(0, 120), event: st.event, kit: st.kit,
      dex: st.dex || {},
      villages: App.saveVillages(), raidDay: st.raidDay, dragonDay: st.dragonDay, shareDay: st.shareDay,
      plots: App.plotsSave ? App.plotsSave() : null,
      creatures: App.saveCreatures(), tourneyDay: st.tourneyDay, creatureDay: st.creatureDay, dungeons: App.saveDungeons(), settleDay: st.settleDay, fate: App.saveFate(), factions: App.saveFactions ? App.saveFactions() : null, rampage: App.saveRampage ? App.saveRampage() : null, lairs: App.saveLairs ? App.saveLairs() : null, faith: App.saveFaith ? App.saveFaith() : null, mines: App.saveMines ? App.saveMines() : null, guilds: App.saveGuilds ? App.saveGuilds() : null, casinos: App.saveCasinos ? App.saveCasinos() : null, parliament: App.saveParliament ? App.saveParliament() : null, contests: App.saveContests ? App.saveContests() : null, diving: App.saveDiving ? App.saveDiving() : null, seabeasts: App.saveSeaBeasts ? App.saveSeaBeasts() : null, war: App.saveWar ? App.saveWar() : null, wealth: App.saveWealth ? App.saveWealth() : null, weather: App.saveWeather ? App.saveWeather() : null,
    };
  };
  App.restoreNeeds = (s) => { try { const f = unb64f(s); if (f.length === App.pop.needs.length) App.pop.needs.set(f); } catch (e) { /* ignore */ } };
  const KEY = "tickle-world-v6"; // v6: the regions' borders wander naturally now (the map changed)
  App.save = () => {
    if (App.noSave) return false;
    try { localStorage.setItem(KEY, JSON.stringify(App.serialize())); return true; } catch (e) { return false; }
  };
  App.loadSaved = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  App.clearSave = () => { App.noSave = true; try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } };
})();
