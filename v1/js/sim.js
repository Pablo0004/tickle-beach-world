/* Simulation: Tickles with needs, smart objects that advertise activities, chats, building,
 * and the Director (the world-managing AI) that designs props, mechanics, structures and events. */
(function () {
  "use strict";
  const App = window.App;
  const S = App.S;
  const NEEDS = (App.NEEDS = ["hunger", "energy", "social", "fun"]);
  const NEED_LABEL = (App.NEED_LABEL = { hunger: "Hunger", energy: "Energy", social: "Social", fun: "Fun" });

  const st = (App.st = {
    T: 8 * 60, mode: "auto", speed: 1, freeWill: true, tickles: [], props: [], assets: [], acts: [], projects: [],
    log: [], uid: 1, director: { next: 9 * 60, runs: 0, lastMech: 0, lastProject: -9999, lastDecor: 0 }, event: null, latest: null,
  });
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

  // ---------- activities ("mechanics") ----------
  // where: home | ground | prop | water | sand | plaza | chat | stroll | self | project
  const CORE = [
    { id: "rest", name: "Rest at home", verb: "is napping at home", needs: { energy: 55 }, capacity: 1, minutes: 70, where: "home" },
    { id: "swim", name: "Swim", verb: "is swimming", needs: { fun: 28, energy: -10 }, capacity: 8, minutes: 20, where: "water" },
    { id: "sunbathe", name: "Sunbathe", verb: "is sunbathing", needs: { energy: 18, fun: 8 }, capacity: 8, minutes: 25, where: "sand" },
    { id: "chat", name: "Chat", verb: "is chatting", needs: { social: 30, fun: 6 }, capacity: 2, minutes: 12, where: "chat" },
    { id: "stroll", name: "Stroll", verb: "is strolling", needs: { fun: 7 }, capacity: 16, minutes: 10, where: "stroll" },
    { id: "build", name: "Build together", verb: "is building", needs: { fun: 30, social: 14, energy: -6 }, capacity: 4, minutes: 20, where: "project" },
  ];
  // Mechanics that come straight from the on-chain "Ground" item of each Tickle's home.
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
    "Surfs Up": ["Wax the board", "is waxing a surfboard", { fun: 24 }, 1, 15],
  };
  const HOLD_ACTS = {
    Chips: ["Eat chips", "is munching chips", { hunger: 22 }, 6], Snacks: ["Eat snacks", "is snacking", { hunger: 24 }, 6],
    Games: ["Play games", "is gaming", { fun: 24, energy: -4 }, 15], Towel: ["Towel off", "is drying off", { energy: 8, fun: 4 }, 5],
    Tube: ["Float on the tube", "is floating", { fun: 18, energy: 6 }, 15], "Wake Board": ["Practice tricks", "is practising tricks", { fun: 22, energy: -8 }, 12],
  };
  App.initActs = () => {
    if (st.acts.length) return;
    CORE.forEach((a) => st.acts.push(Object.assign({ source: "core", status: "core" }, a)));
    for (const k in GROUND_ACTS) {
      const [name, verb, needs, capacity, minutes] = GROUND_ACTS[k];
      st.acts.push({ id: "g_" + k, name, verb, needs, capacity, minutes, where: "ground", ground: k, source: "onchain", status: "core" });
    }
  };
  const ACTIVE = new Set(["core", "starter", "approved", "auto"]);
  App.actActive = (a) => ACTIVE.has(a.status);
  App.actById = (id) => st.acts.find((a) => a.id === id);

  // ---------- Tickles ----------
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  App.addTickle = async (row, plot, saved) => {
    const [id, seed, traits] = row;
    const res = await App.job("tickle", { seed, voxel: 9, homeVoxel: 19 });
    const L = TB.tickleLayers(seed);
    const [ax, ay, az] = res.anchor;
    // home diorama, rotated to face the plaza
    const home = new THREE.Group();
    home.position.set(plot.x, plot.h, plot.z);
    home.rotation.y = Math.atan2(App.plaza.x - plot.x, App.plaza.z - plot.z);
    const hm = App.makeVoxMesh(res.home);
    hm.position.x -= ax * S; hm.position.y -= az * S; hm.position.z -= ay * S;
    home.add(hm);
    App.scene.add(home);
    home.updateMatrixWorld(true);
    // where the on-chain ground item sits
    let gx = 0, gy = 0, gz = 0, gn = 0;
    for (const Ly of L.home) for (const s of Ly.subparts) if (s.partName === "ground" && s.primitive !== "attach") { gx += s.position[0]; gy += s.position[1]; gz += s.position[2]; gn++; }
    let groundSpot = null;
    if (gn) {
      const p = new THREE.Vector3((gx / gn - ax) * S, 0, (gy / gn - ay) * S + 0.7);
      home.localToWorld(p);
      groundSpot = { x: p.x, z: p.z };
    }
    // character
    const group = new THREE.Group(), pivot = new THREE.Group();
    const cm = App.makeVoxMesh(res.character);
    const minY = (res.character.origin[1] + res.character.min[1] * res.character.voxel) * S;
    const maxY = (res.character.origin[1] + res.character.max[1] * res.character.voxel) * S;
    cm.position.x -= ax * S; cm.position.y -= minY; cm.position.z -= ay * S;
    pivot.add(cm); group.add(pivot);
    const blob = App.makeBlob(0.9); blob.position.y = 0.04; group.add(blob);
    App.scene.add(group);
    // swatch colour: the body's most used material
    let big = null, bv = 0;
    for (const Ly of L.character) for (const s of Ly.subparts) if (s.partName === "body" && s.primitive !== "attach" && s.mode === "add") {
      const v = Math.abs(s.size[0] * s.size[1] * s.size[2]) * (s.mirrorX ? 2 : 1);
      if (v > bv) { bv = v; big = s; }
    }
    const swatch = big ? TB.rgbHex(TB.colorOf(big.material)) : "#c08850";
    const h = hashStr(seed);
    const per = (k) => 0.78 + (((h >>> (k * 7)) & 127) / 127) * 0.5;
    const t = {
      id, seed, traits, name: (traits.Character || "Tickle") + " #" + id, plot, home, homeMesh: hm, group, pivot, mesh: cm,
      height: maxY - minY, groundSpot, ground: traits.Ground && traits.Ground !== "None" ? traits.Ground : null,
      holding: traits.Holding && traits.Holding !== "None" ? traits.Holding : null, swatch,
      persona: { appetite: per(0), lazy: per(1), sociable: per(2), playful: per(3) },
      pos: new THREE.Vector3(plot.x + (rnd() - 0.5) * 2, plot.h, plot.z + (rnd() - 0.5) * 2), heading: rnd() * 6.28,
      needs: { hunger: 55 + rnd() * 35, energy: 60 + rnd() * 35, social: 45 + rnd() * 40, fun: 45 + rnd() * 40 },
      rel: {}, fav: {}, cool: {}, action: null, queue: [], bubble: null, walk: 0, verified: null, stuck: 0,
    };
    if (saved) Object.assign(t, { needs: saved.needs, rel: saved.rel || {}, fav: saved.fav || {}, pos: new THREE.Vector3(saved.x, plot.h, saved.z) });
    // live check: our decoded traits vs tokenURI() traits
    const sel = res.traits.sel, ok = [];
    for (const slot of TB.SLOTS) {
      const label = TB.SLOT_LABEL[slot];
      const name = App.MODEL_NAMES[slot + ":" + sel[slot]] || (sel[slot] === undefined ? "None" : "?");
      ok.push({ slot: label, chain: traits[label], decoded: name, match: traits[label] === name });
    }
    t.verified = ok;
    group.position.copy(t.pos);
    plot.used = t;
    st.tickles.push(t);
    return t;
  };

  App.removeTickle = (t) => {
    App.scene.remove(t.group); App.scene.remove(t.home);
    t.plot.used = null;
    st.tickles = st.tickles.filter((x) => x !== t);
    for (const o of st.tickles) { if (o.action && o.action.partner === t) o.action = null; delete o.rel[t.id]; }
    App.terrainDirty = true;
  };

  // ---------- props ----------
  App.assetGeometry = (asset) => {
    if (!asset._geo && asset.md) asset._geo = App.makeVoxMesh(asset.md).geometry;
    return asset._geo;
  };
  App.placeProp = (asset, x, z, rot, saved) => {
    const geo = App.assetGeometry(asset);
    if (!geo) return null;
    const md = asset.md;
    const surf = App.surfaceAt(x, z);
    const g = new THREE.Group();
    const m = new THREE.Mesh(geo, App.voxMaterial);
    m.scale.setScalar(md.voxel * S);
    m.position.set(md.origin[0] * S, md.origin[1] * S, md.origin[2] * S);
    g.add(m);
    const box = App.meshBox(md);
    const rad = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    const blob = App.makeBlob(rad + 0.4); blob.position.y = 0.04; g.add(blob);
    g.position.set(x, surf.y, z);
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

  // free land spot near (x, z)
  App.findSpot = (x, z, clearance) => {
    clearance = clearance || 3.2;
    for (let r = 0; r < 34; r += 0.8) {
      for (let k = 0; k < 10; k++) {
        const a = rnd() * Math.PI * 2;
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        const s = App.surfaceAt(px, pz);
        if (s.water || s.plot) continue;
        const [cx, cz] = App.cellOf(px, pz);
        if (App.heights[cx + cz * App.W] < App.SEA + 1) continue;
        if (App.plots.some((p) => Math.hypot(px - p.x, pz - p.z) < App.PLOT_R + 1.2)) continue;
        if (Math.hypot(px - App.plaza.x, pz - App.plaza.z) < 2.2) continue;
        if (st.props.some((p) => Math.hypot(px - p.x, pz - p.z) < clearance + p.rad)) continue;
        if (st.projects.some((pr) => Math.hypot(px - pr.site.x, pz - pr.site.z) < 5)) continue;
        return { x: px, z: pz };
      }
    }
    return null;
  };

  // shoreline and beach spots for swim/sunbathe
  App.computeSpots = () => {
    const shore = [], sand = [];
    const { W, D, SEA } = App;
    for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) {
      const h = App.heights[x + z * W];
      if (h < SEA) {
        const nb = [App.heights[x + 1 + z * W], App.heights[x - 1 + z * W], App.heights[x + (z + 1) * W], App.heights[x + (z - 1) * W]];
        if (nb.some((v) => v >= SEA)) { const [wx, wz] = App.cellCenter(x, z); shore.push({ x: wx, z: wz }); }
      } else if (h <= SEA + 1 && App.getBlock(x, h - 1, z) === App.BLOCK.SAND) {
        const [wx, wz] = App.cellCenter(x, z);
        if (!App.plots.some((p) => Math.hypot(wx - p.x, wz - p.z) < App.PLOT_R + 0.5)) sand.push({ x: wx, z: wz });
      }
    }
    App.shore = shore; App.sand = sand;
  };

  // ---------- adverts (smart objects) ----------
  const occ = new Map();
  const occKey = (actId, ref) => actId + "|" + ref;
  const occN = (k) => (occ.get(k) || new Set()).size;
  function occAdd(k, t) { if (!occ.has(k)) occ.set(k, new Set()); occ.get(k).add(t.id); }
  function occDel(k, t) { if (occ.has(k)) occ.get(k).delete(t.id); }
  function nearest(list, x, z, n) {
    return list.map((p) => [p, (p.x - x) ** 2 + (p.z - z) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]);
  }
  function adverts(t) {
    const out = [];
    for (const a of st.acts) {
      if (!App.actActive(a)) continue;
      switch (a.where) {
        case "home": out.push({ act: a, ref: "home" + t.id, spot: { x: t.plot.x, z: t.plot.z } }); break;
        case "ground":
          for (const o of st.tickles) if (o.ground === a.ground && o.groundSpot) out.push({ act: a, ref: "g" + o.id, spot: o.groundSpot, host: o });
          break;
        case "prop":
          for (const p of st.props) if (p.assetId === a.assetId) out.push({ act: a, ref: p.uid, spot: { x: p.x, z: p.z }, prop: p });
          break;
        case "water":
          if (App.shore && App.shore.length) for (const s of nearest(App.shore, t.pos.x, t.pos.z, 2)) out.push({ act: a, ref: "w" + Math.round(s.x) + "," + Math.round(s.z), spot: s, water: true });
          break;
        case "sand":
          if (App.sand && App.sand.length) { const s = App.sand[Math.floor(rnd() * App.sand.length)]; out.push({ act: a, ref: "s" + Math.round(s.x) + "," + Math.round(s.z), spot: s }); }
          break;
        case "plaza": out.push({ act: a, ref: "plaza", spot: { x: App.plaza.x, z: App.plaza.z } }); break;
        case "stroll": {
          const ang = rnd() * 6.28, r = 3 + rnd() * 9;
          const x = t.pos.x + Math.cos(ang) * r, z = t.pos.z + Math.sin(ang) * r;
          if (App.isLand(x, z)) out.push({ act: a, ref: "stroll" + t.id, spot: { x, z } });
          break;
        }
        case "project":
          for (const pr of st.projects) if (!pr.done && App.actActive(pr) && a.id === "build") out.push({ act: a, ref: pr.id, spot: pr.site, project: pr });
          break;
        case "projectDone":
          for (const pr of st.projects) if (pr.done && pr.rewardAct === a.id) out.push({ act: a, ref: pr.id + "r", spot: pr.site });
          break;
      }
    }
    if (t.holding && HOLD_ACTS[t.holding] && !(t.cool.hold > st.T)) {
      const [name, verb, needs, minutes] = HOLD_ACTS[t.holding];
      out.push({ act: { id: "hold_" + t.holding, name, verb, needs, capacity: 1, minutes, where: "self", source: "onchain", status: "core" }, ref: "self" + t.id, spot: { x: t.pos.x, z: t.pos.z }, self: true });
    }
    return out;
  }

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

  function choose(t) {
    const night = App.isNight;
    let best = null, second = null;
    for (const ad of adverts(t)) {
      const k = occKey(ad.act.id, ad.ref);
      if (occN(k) >= ad.act.capacity && !(occ.get(k) && occ.get(k).has(t.id))) continue;
      let s = utility(t, ad.act.needs);
      const d = Math.hypot(ad.spot.x - t.pos.x, ad.spot.z - t.pos.z);
      s -= d * 0.012;
      if (ad.act.capacity > 1) s += Math.min(occN(k), 3) * 0.05 * t.persona.sociable;
      s += Math.min(t.fav[ad.act.id] || 0, 10) * 0.012;
      if (ad.host === t) s += 0.08;
      if (night) s *= ad.act.where === "home" ? 2.6 : ad.water ? 0.2 : 0.55;
      else if (ad.act.where === "home" && t.needs.energy > 35) s *= 0.55;
      if (st.event && ad.act.id === st.event.actId) s += 0.25;
      if (ad.project) s += 0.18;
      s += rnd() * 0.12;
      if (!best || s > best.s) { second = best; best = { ad, s }; } else if (!second || s > second.s) second = { ad, s };
    }
    // chat
    const partner = pickPartner(t);
    if (partner) {
      const chatAct = App.actById("chat");
      let s = utility(t, chatAct.needs) + (t.rel[partner.id] || 0) * 0.004 - Math.hypot(partner.pos.x - t.pos.x, partner.pos.z - t.pos.z) * 0.01 + rnd() * 0.12;
      if (night) s *= 0.5;
      if (!best || s > best.s) return startChat(t, partner);
    }
    const pickd = second && rnd() < 0.15 ? second : best;
    if (!pickd || pickd.s < 0.02) { t.action = { kind: "idle", until: st.T + 5 }; return; }
    startDo(t, pickd.ad);
  }
  function pickPartner(t) {
    let best = null, bs = -1e9;
    for (const o of st.tickles) {
      if (o === t || !available(o)) continue;
      const d = Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z);
      if (d > 30) continue;
      const s = (t.rel[o.id] || 0) * 0.02 + (100 - o.needs.social) * 0.02 - d * 0.05 + rnd();
      if (s > bs) { bs = s; best = o; }
    }
    return best;
  }
  function available(o) {
    if (!o.action || o.action.kind === "idle") return true;
    if (o.action.order) return false;
    const a = o.action.act;
    return !!a && (a.where === "stroll" || a.where === "sand") && o.needs.social < 70;
  }
  function startDo(t, ad, order) {
    const spread = ad.self ? 0 : ad.prop ? ad.prop.rad + 0.7 : ad.water ? 0.2 : ad.project ? 2.6 : ad.act.where === "plaza" ? 3 : 0.9;
    let spot = null;
    for (let k = 0; k < 12 && !spot; k++) {
      const ang = rnd() * Math.PI * 2;
      const c = { x: ad.spot.x + Math.cos(ang) * spread, z: ad.spot.z + Math.sin(ang) * spread };
      if (ad.water || ad.self || App.isLand(c.x, c.z)) spot = c;
    }
    if (!spot) spot = { x: ad.spot.x, z: ad.spot.z };
    t.action = { kind: "do", act: ad.act, ref: ad.ref, key: occKey(ad.act.id, ad.ref), spot, center: ad.spot, phase: "walk", started: st.T,
      water: !!ad.water, project: ad.project || null, prop: ad.prop || null, order: !!order, host: ad.host || null };
    occAdd(t.action.key, t);
    if (ad.self) t.cool.hold = st.T + 180;
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
    if (done && a.act) {
      t.fav[a.act.id] = (t.fav[a.act.id] || 0) + 1;
      if (a.act.source === "director" || a.act.source === "claude" || a.act.source === "player") a.act.uses = (a.act.uses || 0) + 1;
    }
    if (a.partner && a.partner.action && a.partner.action.partner === t) { const p = a.partner; p.action = null; }
    t.action = null;
    t.pivot.rotation.set(0, 0, 0); t.pivot.position.set(0, 0, 0);
  }
  App.endAction = endAction;

  // orders from the player
  App.order = (t, what) => {
    endAction(t);
    t.queue = [];
    if (what.kind === "goto") { t.action = { kind: "goto", spot: what.spot, order: true, started: st.T }; return; }
    if (what.kind === "chat") return startChat(t, what.partner, true);
    if (what.kind === "prop") {
      const asset = App.assetById(what.prop.assetId);
      const act = asset && st.acts.find((a) => a.assetId === asset.id && App.actActive(a));
      if (act) return startDo(t, { act, ref: what.prop.uid, spot: { x: what.prop.x, z: what.prop.z }, prop: what.prop }, true);
      t.action = { kind: "goto", spot: { x: what.prop.x + 1.5, z: what.prop.z }, order: true, started: st.T };
      return;
    }
    if (what.kind === "need") { // best activity for a need
      let best = null, bs = -1e9;
      for (const ad of adverts(t)) {
        const g = ad.act.needs[what.need] || 0;
        if (g <= 0) continue;
        const s = g - Math.hypot(ad.spot.x - t.pos.x, ad.spot.z - t.pos.z) * 0.6;
        if (s > bs) { bs = s; best = ad; }
      }
      if (best) startDo(t, best, true);
      else App.toast(t.name + " has nothing on the island for " + NEED_LABEL[what.need].toLowerCase() + ".");
      return;
    }
    if (what.kind === "home") return startDo(t, { act: App.actById("rest"), ref: "home" + t.id, spot: { x: t.plot.x, z: t.plot.z } }, true);
  };

  // ---------- per-frame update ----------
  const DECAY = { hunger: 0.11, energy: 0.075, social: 0.1, fun: 0.11 };
  function say(t, text, mins) { t.bubble = { text, until: st.T + (mins || 3) }; }
  App.say = say;

  function stepTickle(t, dm, dtReal) {
    // needs decay
    const busy = t.action && t.action.phase === "doing" ? t.action.act.needs : {};
    for (const k of NEEDS) {
      let d = DECAY[k] * (k === "hunger" ? t.persona.appetite : k === "energy" ? t.persona.lazy : k === "social" ? t.persona.sociable : t.persona.playful);
      if (k === "energy" && App.isNight && !(t.action && t.action.act && t.action.act.id === "rest")) d *= 1.6;
      if (busy[k]) d = 0;
      t.needs[k] = clamp(t.needs[k] - d * dm, 0, 100);
    }
    let a = t.action;
    if (!a) {
      if (t.queue.length) { App.order(t, t.queue.shift()); a = t.action; }
      else if (st.freeWill || st.mode === "auto") { choose(t); a = t.action; }
      else { t.action = { kind: "idle", until: st.T + 10 }; a = t.action; }
    }
    if (!a) return;
    if (a.kind === "idle") {
      if (st.T >= a.until) t.action = null;
      animate(t, false, dtReal);
      return;
    }
    // walking
    const target = a.chat && a.partner ? a.spot : a.spot;
    let walking = false;
    if (a.kind === "goto" || a.phase === "walk") {
      const dx = target.x - t.pos.x, dz = target.z - t.pos.z, dist = Math.hypot(dx, dz);
      const arriveR = a.chat ? 0.35 : 0.45;
      if (dist > arriveR) {
        walking = true;
        const step = Math.min(dist, 2.1 * dm);
        let dir = Math.atan2(dx, dz);
        let nx = t.pos.x + Math.sin(dir) * step, nz = t.pos.z + Math.cos(dir) * step;
        if (!a.water && !App.isLand(nx, nz) && App.isLand(t.pos.x, t.pos.z)) {
          let ok = false;
          for (const off of [0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.5, -2.5]) {
            const d2 = dir + off, x2 = t.pos.x + Math.sin(d2) * step, z2 = t.pos.z + Math.cos(d2) * step;
            if (App.isLand(x2, z2)) { nx = x2; nz = z2; dir = d2; ok = true; break; }
          }
          if (!ok) { nx = t.pos.x; nz = t.pos.z; t.stuck += dm; }
        }
        t.pos.x = nx; t.pos.z = nz;
        t.heading = turn(t.heading, dir, dtReal * 9);
        t.needs.energy = clamp(t.needs.energy - 0.012 * dm, 0, 100);
        if (st.T - a.started > 150 || t.stuck > 25) { t.stuck = 0; endAction(t); return; }
      } else {
        if (a.kind === "goto") { t.action = { kind: "idle", until: st.T + 20, order: a.order }; animate(t, false, dtReal); return; }
        if (a.chat) {
          const p = a.partner;
          if (!p || !p.action || p.action.partner !== t) { endAction(t); return; }
          if (p.action.phase === "walk" && Math.hypot(p.pos.x - p.action.spot.x, p.pos.z - p.action.spot.z) > 0.5) { animate(t, false, dtReal); faceTo(t, p.pos, dtReal); return; }
          const until = st.T + a.act.minutes * (0.8 + rnd() * 0.5);
          a.phase = "doing"; a.until = until; a.nextLine = st.T;
          p.action.phase = "doing"; p.action.until = until; p.action.nextLine = st.T + 1.5;
        } else {
          a.phase = "doing";
          a.until = st.T + a.act.minutes * (0.85 + rnd() * 0.3);
          a.nextBlock = st.T + 1.5;
          if (a.act.verb && rnd() < 0.5) say(t, verbBubble(a.act), 4);
        }
      }
    }
    if (a.phase === "doing") {
      for (const k in a.act.needs) t.needs[k] = clamp(t.needs[k] + (a.act.needs[k] / a.act.minutes) * dm, 0, 100);
      if (a.chat) {
        faceTo(t, a.partner.pos, dtReal);
        if (st.T >= a.nextLine) {
          const r = rnd;
          say(t, TB.chatLine(r, t, a.partner, { latest: st.latest, night: App.isNight }), 2.4);
          a.nextLine = st.T + 3 + rnd() * 1.5;
          const compat = compatibility(t, a.partner);
          bumpRel(t, a.partner, 0.45 + compat * 0.5);
        }
      } else {
        faceTo(t, a.center, dtReal);
        if (a.project && st.T >= a.nextBlock) { a.nextBlock = st.T + 1.6; buildStep(a.project, t); }
      }
      if (st.T >= a.until) { endAction(t, true); animate(t, false, dtReal); return; }
    }
    animate(t, walking, dtReal);
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
    const before = a.rel[b.id] || 0;
    a.rel[b.id] = Math.min(100, before + v);
    b.rel[a.id] = Math.min(100, (b.rel[a.id] || 0) + v);
    if (before < 30 && a.rel[b.id] >= 30) App.log("social", a.name + " and " + b.name + " are now friends.", "They hit it off over a few chats.", { who: [a.id, b.id] });
    if (before < 60 && a.rel[b.id] >= 60) App.log("social", a.name + " and " + b.name + " are best friends.", "", { who: [a.id, b.id] });
  }
  App.relLabel = (v) => (v >= 60 ? "Best friends" : v >= 30 ? "Friends" : v >= 8 ? "Acquaintances" : "Just met");

  function animate(t, walking, dtReal) {
    // position and height
    const s = App.surfaceAt(t.pos.x, t.pos.z);
    let ty = s.y;
    const swimming = t.action && t.action.water && t.action.phase === "doing";
    if (s.water) ty = App.WATER_Y - (swimming ? 0.95 : 0.7);
    t.pos.y += (ty - t.pos.y) * Math.min(1, dtReal * 10);
    t.group.position.copy(t.pos);
    t.group.rotation.y = t.heading;
    const sleeping = t.action && t.action.act && t.action.act.id === "rest" && t.action.phase === "doing";
    if (walking) {
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

  // light separation so Tickles don't overlap
  function separate() {
    const T = st.tickles;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
      if (d < 1.05 && d > 1e-4) {
        const push = (1.05 - d) * 0.25;
        a.pos.x -= (dx / d) * push; a.pos.z -= (dz / d) * push;
        b.pos.x += (dx / d) * push; b.pos.z += (dz / d) * push;
      }
    }
  }

  App.step = (dtReal) => {
    const dm = Math.min(dtReal, 0.1) * st.speed; // game minutes this frame
    const night0 = App.isNight;
    if (st.speed > 0) {
      st.T += dm;
      for (const t of st.tickles) stepTickle(t, dm, dtReal);
      separate();
      if (st.event && st.T > st.event.until) {
        App.log("event", st.event.name + " is over.", "");
        const a = App.actById(st.event.actId);
        if (a) a.status = "rejected";
        st.event = null;
      }
      if (st.mode === "auto" && st.T >= st.director.next) {
        st.director.next = st.T + 150;
        App.directorRun({ apply: true });
      }
    } else {
      for (const t of st.tickles) animate(t, false, dtReal);
    }
    App.daylight(App.clock(st.T).minute);
    if (night0 !== App.isNight && App.isNight) App.log("world", "Night falls on the island.", "Tickles head home to sleep.");
  };

  // ---------- projects (Minecraft-style building) ----------
  const BLUEPRINTS = {
    "Lookout Tower": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h;
      for (let y = 0; y < 6; y++) for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) b.push([o.x + x, h0 + y, o.z + z, P.STONE]);
      for (let x = -1; x < 3; x++) for (let z = -1; z < 3; z++) b.push([o.x + x, h0 + 6, o.z + z, P.PLANK]);
      for (let x = -1; x < 3; x++) for (let z = -1; z < 3; z++) if (x === -1 || x === 2 || z === -1 || z === 2) if ((x + z) % 2 === 0) b.push([o.x + x, h0 + 7, o.z + z, P.LOG || P.WOOD]);
      b.push([o.x, h0 + 8, o.z, P.RED]);
      return b;
    },
    "Beach Hut": (o) => {
      const b = [], P = App.BLOCK, h0 = o.h;
      for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) b.push([o.x + x, h0, o.z + z, P.PLANK]);
      for (let y = 1; y <= 3; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) {
        const edge = x === 0 || x === 4 || z === 0 || z === 4;
        if (!edge) continue;
        const corner = (x === 0 || x === 4) && (z === 0 || z === 4);
        if (z === 4 && x === 2 && y < 3) continue; // door
        b.push([o.x + x, h0 + y, o.z + z, corner ? P.WOOD : P.PLANK]);
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
    Pier: (o) => {
      const b = [], P = App.BLOCK, dir = o.dir;
      for (let i = 0; i < 9; i++) {
        const x = o.x + dir[0] * i, z = o.z + dir[1] * i;
        b.push([x, App.SEA - 1, z, P.PLANK]);
        b.push([x + dir[1], App.SEA - 1, z + dir[0], P.PLANK]);
        if (i % 3 === 2) for (let y = 0; y < App.SEA - 1; y++) b.push([x, y, z, P.WOOD]);
      }
      return b;
    },
  };
  const REWARDS = {
    "Lookout Tower": ["Enjoy the view", "is enjoying the view", { fun: 22, energy: 10 }, 4, 20],
    "Beach Hut": ["Hang out in the hut", "is hanging out in the hut", { energy: 35, social: 12 }, 4, 30],
    "Flower Garden": ["Tend the garden", "is tending the garden", { fun: 16, social: 8, energy: 6 }, 4, 20],
    Pier: ["Fish off the pier", "is fishing off the pier", { hunger: 30, fun: 12 }, 4, 25],
  };
  App.BLUEPRINTS = BLUEPRINTS;
  function blueprintSite(name) {
    if (name === "Pier") {
      // a shoreline cell whose outward direction is open water
      const cands = [];
      for (const s of App.shore || []) {
        const [cx, cz] = App.cellOf(s.x, s.z);
        const ang = Math.atan2(s.z - App.plaza.z, s.x - App.plaza.x);
        const dir = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? [Math.sign(Math.cos(ang)), 0] : [0, Math.sign(Math.sin(ang))];
        let ok = true;
        for (let i = 1; i < 9; i++) { const h = App.heights[(cx + dir[0] * i) + (cz + dir[1] * i) * App.W]; if (h === undefined || h >= App.SEA) { ok = false; break; } }
        if (ok && !st.props.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 4)) cands.push({ x: cx, z: cz, dir, wx: s.x, wz: s.z });
      }
      if (!cands.length) return null;
      const c = cands[Math.floor(rnd() * cands.length)];
      const [lx, lz] = App.cellCenter(c.x - c.dir[0], c.z - c.dir[1]);
      return { grid: { x: c.x, z: c.z, dir: c.dir }, site: { x: lx, z: lz } };
    }
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd() * 6.28, r = 9 + rnd() * 22;
      const x = App.plaza.x + Math.cos(a) * r, z = App.plaza.z + Math.sin(a) * r;
      const [cx, cz] = App.cellOf(x, z);
      let ok = true, h = null;
      for (let dx = -1; dx < 7 && ok; dx++) for (let dz = -1; dz < 7 && ok; dz++) {
        const hh = App.heights[(cx + dx) + (cz + dz) * App.W];
        if (hh === undefined || hh < App.SEA + 1) ok = false;
        else if (h === null) h = hh; else if (Math.abs(hh - h) > 1) ok = false;
        const [wx, wz] = App.cellCenter(cx + dx, cz + dz);
        if (App.plots.some((p) => Math.hypot(wx - p.x, wz - p.z) < App.PLOT_R + 1)) ok = false;
        if (Math.hypot(wx - App.plaza.x, wz - App.plaza.z) < App.plaza.r) ok = false;
        if (st.props.some((p) => Math.hypot(wx - p.x, wz - p.z) < 2 + p.rad)) ok = false;
        if (st.projects.some((pr) => Math.hypot(wx - pr.site.x, wz - pr.site.z) < 7)) ok = false;
      }
      if (ok) { const [wx, wz] = App.cellCenter(cx + 2, cz + 2); return { grid: { x: cx, z: cz, h }, site: { x: wx, z: wz } }; }
    }
    return null;
  }
  App.makeProject = (name, source, status) => {
    const loc = blueprintSite(name);
    if (!loc) return null;
    const P = App.BLOCK;
    const blocks = BLUEPRINTS[name](Object.assign({ color: [P.RED, P.BLUE, P.YELLOW, P.PINK][Math.floor(rnd() * 4)] }, loc.grid));
    const pr = { id: uid("pr"), name, blocks, next: 0, site: loc.site, done: false, source, status, createdAt: st.T, kind: "structure" };
    st.projects.push(pr);
    return pr;
  };
  function buildStep(pr, t) {
    if (pr.done) return;
    // skip blocks already present
    while (pr.next < pr.blocks.length && App.getBlock(...pr.blocks[pr.next].slice(0, 3)) === pr.blocks[pr.next][3]) pr.next++;
    if (pr.next < pr.blocks.length) {
      const [x, y, z, ty] = pr.blocks[pr.next++];
      App.setBlock(x, y, z, ty);
    }
    if (pr.next >= pr.blocks.length) finishProject(pr, t);
  }
  App.finishProject = finishProject;
  function finishProject(pr, t) {
    pr.done = true;
    const [name, verb, needs, capacity, minutes] = REWARDS[pr.name];
    const act = { id: uid("act"), name, verb, needs, capacity, minutes, where: "projectDone", source: pr.source, status: pr.status === "pending" ? "pending" : pr.status, createdAt: st.T, project: pr.id };
    st.acts.push(act);
    pr.rewardAct = act.id;
    App.computeSpots();
    App.log("build", "The " + pr.name + " is finished" + (t ? " (last block by " + t.name + ")" : "") + ".", "New activity unlocked: " + name + ".");
    for (const o of st.tickles) if (o.action && o.action.project === pr) endAction(o, true);
  }

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
    const score = Math.round((out.filter((c) => c.status === "pass").length + out.filter((c) => c.status === "warn").length * 0.5) / out.length * 100);
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
      status: "checking", createdAt: st.T, brief: design.brief || "",
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
    const n = Math.max(1, st.tickles.length), out = {};
    for (const k of NEEDS) {
      const avg = st.tickles.reduce((s, t) => s + t.needs[k], 0) / n;
      let supply = 0;
      for (const a of st.acts) {
        if (!App.actActive(a) || (a.needs[k] || 0) < 15) continue;
        if (a.where === "home") supply += k === "energy" ? n * 0.5 : 0;
        else if (a.where === "ground") supply += st.tickles.filter((t) => t.ground === a.ground).length * Math.min(a.capacity, 2);
        else if (a.where === "prop") supply += st.props.filter((p) => p.assetId === a.assetId).length * Math.min(a.capacity, 3);
        else if (a.where === "water" || a.where === "sand") supply += 2;
        else if (a.where === "projectDone") supply += Math.min(a.capacity, 3);
        else if (a.where === "plaza") supply += 3;
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
    const [name, verb] = (free.length ? free : ideas)[Math.floor(rnd() * (free.length ? free : ideas).length)];
    // host: an existing prop, an on-chain ground item, the plaza or the beach
    const hosts = [];
    for (const p of st.props) { const as = App.assetById(p.assetId); if (as && as.activity && App.actActive(st.acts.find((a) => a.assetId === as.id) || {})) hosts.push({ where: "prop", assetId: as.id, label: "the " + as.name }); }
    for (const t of st.tickles) if (t.ground) hosts.push({ where: "ground", ground: t.ground, label: t.name + "'s " + t.ground });
    hosts.push({ where: "plaza", label: "the plaza" }, { where: "sand", label: "the beach" });
    const h = hosts[Math.floor(rnd() * hosts.length)];
    const needs = {}; needs[need] = 22 + Math.round(rnd() * 18);
    const other = NEEDS.filter((k) => k !== need)[Math.floor(rnd() * 3)];
    needs[other] = (other === "energy" && rnd() < 0.5 ? -1 : 1) * (4 + Math.round(rnd() * 10));
    const act = { id: uid("act"), name, verb, needs, capacity: 2 + Math.floor(rnd() * 4), minutes: 12 + Math.floor(rnd() * 16),
      where: h.where, assetId: h.assetId, ground: h.ground, hostLabel: h.label, kind: "mechanic", createdAt: st.T };
    const mk = checkMechanic(act);
    act.checks = mk.checks; act.score = mk.score; act.fails = mk.fails;
    return act;
  }

  App.directorRun = async (opts) => {
    opts = opts || {};
    const apply = st.mode === "auto" && opts.apply !== false;
    const diag = App.diagnose();
    const c = App.clock(st.T);
    st.director.runs++;
    const cands = [];
    for (const k of NEEDS) {
      if (diag[k].gap > 0.1) cands.push({ type: "prop", need: k, score: diag[k].gap + 0.12,
        why: NEED_LABEL[k] + " averages " + Math.round(diag[k].avg) + "% and only " + Math.round(diag[k].supply) + " spots help it for " + st.tickles.length + " Tickles." });
    }
    const helpers = {};
    for (const k of NEEDS) helpers[k] = st.assets.filter((a) => a.activity && App.actActive(a) && (a.source === "director" || a.source === "claude") && a.template !== "Coconut Palm" && (a.activity.needs[k] || 0) >= 15).length;
    const thin = NEEDS.filter((k) => helpers[k] < 2).sort((a, b) => diag[a].avg - diag[b].avg)[0];
    if (thin && st.T - (st.director.lastVariety || 0) > 280) cands.push({ type: "prop", need: thin, variety: true, score: 0.27 + diag[thin].gap,
      why: (helpers[thin] ? "Only one designed object helps " : "Nothing designed on the island helps ") + NEED_LABEL[thin].toLowerCase() + " yet (" + Math.round(diag[thin].avg) + "% on average). More choice keeps Tickles from crowding one spot." });
    if (st.T - st.director.lastMech > 1100) {
      const worst = NEEDS.slice().sort((a, b) => diag[a].avg - diag[b].avg)[0];
      cands.push({ type: "mechanic", need: worst === "energy" ? "fun" : worst, score: 0.32, why: "Nothing new to do for most of a day; " + NEED_LABEL[worst].toLowerCase() + " is the lowest need." });
    }
    if (!st.projects.some((p) => !p.done && App.actActive(p)) && st.T - st.director.lastProject > 900) cands.push({ type: "structure", score: 0.3 + diag.fun.gap * 0.3, why: "The Tickles have no shared building project right now." });
    if (st.T - st.director.lastDecor > 700) cands.push({ type: "decor", score: 0.16, why: "Parts of the island look bare." });
    if (c.hh >= 17 && c.hh < 21 && diag.social.avg < 58 && !st.event) cands.push({ type: "event", score: 0.55, why: "Social averages " + Math.round(diag.social.avg) + "% at dusk; a gathering would help." });
    if (opts.force) cands.push(Object.assign({ score: 9 }, opts.force));
    if (!cands.length) {
      if (opts.manualAsk || apply) App.log("director", "Director checked the island: everyone is doing fine.", needsLine(diag));
      return null;
    }
    cands.sort((a, b) => b.score + rnd() * 0.05 - (a.score + rnd() * 0.05));
    const pick = cands[0];
    try { return await perform(pick, apply, diag); }
    catch (e) { console.error(e); App.log("director", "Director hit a problem: " + e.message, ""); return null; }
  };
  function needsLine(diag) { return NEEDS.map((k) => NEED_LABEL[k] + " " + Math.round(diag[k].avg) + "%").join(" \u00b7 "); }
  App.needsLine = needsLine;

  function demandPoint(need) {
    const ts = st.tickles.slice().sort((a, b) => a.needs[need] - b.needs[need]).slice(0, 4);
    if (!ts.length) return { x: 0, z: 0 };
    const x = ts.reduce((s, t) => s + t.pos.x, 0) / ts.length, z = ts.reduce((s, t) => s + t.pos.z, 0) / ts.length;
    return { x: x * 0.6, z: z * 0.6 };
  }

  async function perform(pick, apply, diag) {
    const who = "Director";
    if (pick.type === "prop" || pick.type === "decor") {
      const need = pick.type === "decor" ? "decor" : pick.need;
      const pool = TB.NEED_TEMPLATES[need];
      const counts = {};
      st.assets.forEach((a) => { if (a.status !== "rejected") counts[a.template] = (counts[a.template] || 0) + 1; });
      const ordered = pool.slice().sort((a, b) => (counts[a] || 0) - (counts[b] || 0) + (rnd() - 0.5));
      let asset = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const d = TB.design(ordered[attempt % ordered.length], (Math.random() * 1e9) | 0);
        d.brief = pick.why;
        asset = await App.createAsset(d, "director");
        if (asset.passes) break;
        App.log("director", who + " discarded its own " + asset.name + " (fidelity " + asset.score + "%).", firstProblem(asset));
        App.rejectAsset(asset);
        asset.status = "discarded";
        asset = null;
      }
      if (!asset) return null;
      if (pick.type === "decor") st.director.lastDecor = st.T;
      if (pick.variety) st.director.lastVariety = st.T;
      const target = pick.type === "decor" ? { x: (rnd() - 0.5) * 40, z: (rnd() - 0.5) * 40 } : demandPoint(pick.need);
      asset.suggestAt = target;
      if (apply) {
        const spot = App.findSpot(target.x, target.z);
        if (spot) App.placeProp(asset, spot.x, spot.z);
        App.activateAsset(asset, "auto");
        App.log("design", who + " designed and placed " + asset.name + ".", pick.why + (asset.activity ? " It lets Tickles " + asset.activity.name.toLowerCase() + "." : ""), { asset: asset.id });
        App.toast("New on the island: " + asset.name);
      } else {
        asset.status = "pending";
        App.log("design", who + " proposes " + asset.name + ". Waiting for your review.", pick.why, { asset: asset.id });
      }
      return asset;
    }
    if (pick.type === "mechanic") {
      const act = proposeMechanic(pick.need);
      act.source = "director";
      act.status = apply ? (act.fails ? "rejected" : "auto") : "pending";
      st.acts.push(act);
      st.director.lastMech = st.T;
      if (apply && !act.fails) {
        App.log("mechanic", who + " invented a new activity: " + act.name + " at " + act.hostLabel + ".", pick.why, { act: act.id });
        App.toast("New activity: " + act.name);
        st.latest = act.name;
      } else App.log("mechanic", who + " proposes a new activity: " + act.name + " at " + act.hostLabel + ".", pick.why, { act: act.id });
      return act;
    }
    if (pick.type === "structure") {
      const names = Object.keys(BLUEPRINTS);
      const builtNames = st.projects.map((p) => p.name);
      const order = names.slice().sort((a, b) => builtNames.filter((x) => x === a).length - builtNames.filter((x) => x === b).length + (rnd() - 0.5));
      let pr = null;
      for (const nm of order) { pr = App.makeProject(nm, "director", apply ? "auto" : "pending"); if (pr) break; }
      st.director.lastProject = st.T;
      if (!pr) return null;
      pr.why = pick.why;
      if (apply) { App.log("build", who + " started a building project: " + pr.name + " (" + pr.blocks.length + " blocks).", pick.why + " Tickles who want fun will build it block by block.", { project: pr.id }); App.toast("Building project: " + pr.name); }
      else App.log("build", who + " proposes building a " + pr.name + ".", pick.why, { project: pr.id });
      return pr;
    }
    if (pick.type === "event") {
      const name = pick.name || (rnd() < 0.5 ? "Bonfire Night" : "Sunset Festival");
      const act = { id: uid("act"), name, verb: "is at the " + name.toLowerCase(), needs: { social: 42, fun: 16 }, capacity: 16, minutes: 40, where: "plaza", source: "director", status: apply ? "auto" : "pending", kind: "event", createdAt: st.T };
      const mk = checkMechanic(act); act.checks = mk.checks; act.score = mk.score; act.fails = mk.fails;
      st.acts.push(act);
      if (apply) { startEvent(act); App.log("event", who + " called a " + name + " at the plaza.", pick.why, { act: act.id }); App.toast(name + " at the plaza!"); }
      else App.log("event", who + " proposes a " + name + " at the plaza.", pick.why, { act: act.id });
      return act;
    }
    return null;
  }
  function startEvent(act) { st.event = { name: act.name, actId: act.id, until: st.T + 200 }; }
  App.startEvent = startEvent;
  function firstProblem(asset) {
    const c = (asset.checks || []).concat(asset.actChecks || []).find((x) => x.status === "fail") || (asset.checks || []).find((x) => x.status === "warn");
    return c ? c.label + ": " + c.detail : "";
  }
  App.firstProblem = firstProblem;

  // island growth (environment change the Director or player can trigger)
  App.expandIsland = (n) => {
    const cands = [];
    const { W, D, SEA } = App;
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const h = App.heights[x + z * W];
      if (h >= SEA) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => App.heights[x + dx + (z + dz) * W] >= SEA).length;
      if (nb) cands.push([x, z, nb + rnd()]);
    }
    cands.sort((a, b) => b[2] - a[2]);
    let k = 0;
    for (const [x, z] of cands.slice(0, n)) {
      for (let y = App.heights[x + z * W]; y < SEA; y++) App.setBlock(x, y, z, App.BLOCK.SAND);
      k++;
    }
    App.computeSpots();
    return k;
  };

  // ---------- save / load ----------
  function b64(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  App.serialize = () => ({
    v: 1, T: st.T, mode: st.mode, speed: st.speed, freeWill: st.freeWill, uid: st.uid, director: st.director, latest: st.latest,
    blocks: b64(App.blocks),
    tickles: st.tickles.map((t) => ({ id: t.id, plot: t.plot.i, needs: t.needs, rel: t.rel, fav: t.fav, x: t.pos.x, z: t.pos.z })),
    assets: st.assets.filter((a) => a.status !== "discarded").map((a) => { const o = Object.assign({}, a); delete o.md; delete o._geo; return o; }),
    props: st.props.map((p) => ({ uid: p.uid, assetId: p.assetId, x: p.x, z: p.z, rot: p.rot })),
    acts: st.acts.filter((a) => a.source !== "core" && a.source !== "onchain"),
    projects: st.projects, log: st.log.slice(0, 120), event: st.event,
  });
  App.save = () => {
    if (App.noSave) return false;
    try { localStorage.setItem("tickle-world-v1", JSON.stringify(App.serialize())); return true; } catch (e) { return false; }
  };
  App.loadSaved = () => {
    try { const s = localStorage.getItem("tickle-world-v1"); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  };
  App.clearSave = () => { App.noSave = true; try { localStorage.removeItem("tickle-world-v1"); } catch (e) { /* storage blocked */ } };
  App.restoreBlocks = (s) => {
    const u = unb64(s);
    if (u.length !== App.blocks.length) return false;
    App.blocks.set(u);
    for (let z = 0; z < App.D; z++) for (let x = 0; x < App.W; x++) {
      let h = 0;
      for (let y = App.H - 1; y >= 0; y--) if (App.blocks[(y * App.D + z) * App.W + x]) { h = y + 1; break; }
      App.heights[x + z * App.W] = h;
    }
    App.terrainDirty = true;
    return true;
  };
})();
