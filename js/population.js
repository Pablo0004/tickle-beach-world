/* Population: all 9,629 Tickles. Each lives in a village, has a job that comes from its on-chain
 * items and follows a daily plan (sleep, work, lunch, free time, evening with friends) whether or
 * not you are watching. Near the player they are full 3D agents, further away walking figures. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const N = TB.SUPPLY;
  const P = (App.pop = {
    body: new Int8Array(N), floor: new Int8Array(N), ground: new Int8Array(N), gtheme: new Int8Array(N), hand: new Int8Array(N),
    needs: new Float32Array(N * 4), home: new Float32Array(N * 2), village: new Int16Array(N), py: new Float32Array(N), pyx: new Float32Array(N).fill(1e9), pyz: new Float32Array(N),
    agent: new Array(N), pending: new Set(), clan: new Int8Array(N), ko: new Float32Array(N),
  });
  const MAX_FULL = 48;
  const SPEED = (App.WALK_SPEED = 2.1); // cells per game minute

  // ---------- traits for everyone ----------
  App.initPopulation = () => {
    const byFloor = {};
    for (let id = 0; id < N; id++) {
      const tr = TB.pickTraits(TB.seedOf(id));
      P.body[id] = tr.sel.body;
      P.floor[id] = tr.sel.floor;
      P.ground[id] = tr.sel.ground === undefined ? -1 : tr.sel.ground;
      P.gtheme[id] = tr.themeFor.ground === undefined ? -1 : tr.themeFor.ground;
      P.hand[id] = tr.sel.hand === undefined ? -1 : tr.sel.hand;
      (byFloor[tr.sel.floor] = byFloor[tr.sel.floor] || []).push(id);
      P.needs[id * 4] = 55 + App.hash2(id, 77, 3) * 35; P.needs[id * 4 + 1] = 60 + App.hash2(id, 78, 3) * 35;
      P.needs[id * 4 + 2] = 45 + App.hash2(id, 79, 3) * 40; P.needs[id * 4 + 3] = 45 + App.hash2(id, 80, 3) * 40;
    }
    // clan = species: Sabre with Sabre, Koda with Koda...
    const clanIdx = {};
    TB.CLANS.forEach((c, i) => { clanIdx[c.species] = i; });
    for (let id = 0; id < N; id++) { const c = clanIdx[App.MODEL_NAMES["body:" + P.body[id]]]; P.clan[id] = c == null ? 0 : c; }
    App.buildWorld(byFloor, (id) => P.clan[id]);
    App.indexPois();
    for (const v of App.villages) v.residents.forEach((id, k) => {
      P.village[id] = v.i;
      P.home[2 * id] = v.homes[k].x;
      P.home[2 * id + 1] = v.homes[k].z;
    });
    const R = TB.repo();
    App.bodyColor = {};
    R.models.body.forEach((m, idx) => {
      if (!m) return;
      let big = null, bv = 0;
      for (const L of m.the.layers) for (const s of L.subparts) if (s.primitive !== "attach" && s.mode === "add") {
        const v = Math.abs(s.size[0] * s.size[1] * s.size[2]) * (s.mirrorX ? 2 : 1);
        if (v > bv) { bv = v; big = s; }
      }
      App.bodyColor[idx] = big ? TB.colorOf(big.material) : [190, 140, 90];
    });
  };
  const themeName = (t) => (t === undefined ? "None" : TB.THEME_NAMES[t]);
  App.traitsOf = (id) => {
    const tr = TB.pickTraits(TB.seedOf(id)), out = {};
    for (const slot of TB.SLOTS) {
      const label = TB.SLOT_LABEL[slot];
      out[label] = tr.sel[slot] === undefined ? "None" : App.MODEL_NAMES[slot + ":" + tr.sel[slot]] || "?";
      if (slot !== "body") out[label + " Theme"] = themeName(tr.themeFor[slot]);
    }
    return out;
  };
  App.nameOf = (id) => (App.MODEL_NAMES["body:" + P.body[id]] || "Tickle") + " #" + id;
  App.swatchOf = (id) => TB.rgbHex(App.bodyColor[P.body[id]] || [190, 140, 90]);
  App.villageOfToken = (id) => App.villages[P.village[id]];
  App.clanOf = (id) => P.clan[id];
  // personality, from the seed (same formula the 3D agents use)
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  App.personaOf = (id) => {
    const h = hashStr(TB.seedOf(id));
    const per = (k) => 0.78 + (((h >>> (k * 7)) & 127) / 127) * 0.5;
    return { appetite: per(0), lazy: per(1), sociable: per(2), playful: per(3) };
  };

  // ---------- owners ----------
  // The snapshot that ships with the game (js/owners.js), and on top of it a newer one this browser may keep
  // (App.setOwners: only the tokens whose owner has changed since, with the block it was read at). The map follows
  // whichever is newer: geo.js keeps everyone who still fits on their plot.
  const OWN_KEY = "tickle-owners-v1";
  let ownerIdx = null, newer = null;
  try { const o = JSON.parse(localStorage.getItem(OWN_KEY) || "null"); if (o && o.changes && TB.OWNERS && o.block > TB.OWNERS.block) newer = o; } catch (e) { newer = null; }
  App.ownerOf = (id) => {
    if (newer && Object.prototype.hasOwnProperty.call(newer.changes, id)) return newer.changes[id];
    if (!TB.OWNERS) return null;
    if (!ownerIdx) {
      const b = atob(TB.OWNERS.index);
      ownerIdx = new Uint16Array(b.length / 2);
      for (let i = 0; i < ownerIdx.length; i++) ownerIdx[i] = b.charCodeAt(2 * i) | (b.charCodeAt(2 * i + 1) << 8);
    }
    const k = ownerIdx[id];
    return k === 0xffff ? null : TB.OWNERS.holders[k];
  };
  // which snapshot the map follows: its block and date, and whether it came with the game or was read since
  App.ownersInfo = () => (newer ? { block: newer.block, date: newer.date, changed: Object.keys(newer.changes).length, source: "browser" } : { block: TB.OWNERS ? TB.OWNERS.block : 0, date: TB.OWNERS ? TB.OWNERS.date : "", changed: 0, source: "game" });
  // keep a newer reading of ownerOf() in this browser: { block, date, owners: [address or null for every token] };
  // only what differs from the snapshot that ships with the game is stored. The map is rebuilt on the next load.
  App.setOwners = (snap) => {
    if (!snap || !snap.owners || snap.owners.length !== N) return false;
    const keep = newer; newer = null;
    const changes = {};
    for (let id = 0; id < N; id++) { const o = snap.owners[id] ? String(snap.owners[id]).toLowerCase() : null; if (o !== App.ownerOf(id)) changes[id] = o; }
    newer = keep;
    try { localStorage.setItem(OWN_KEY, JSON.stringify({ block: snap.block, date: snap.date, changes })); return true; } catch (e) { return false; }
  };
  App.clearOwners = () => { try { localStorage.removeItem(OWN_KEY); } catch (e) { /* storage blocked */ } };
  // read ownerOf() for every Tickle from Ethereum now, through a public node, and keep it in this browser (where the
  // page may reach the network: the claude.ai viewer does not let it, and then tools/update_owners.py does the same)
  const RPC = "https://ethereum-rpc.publicnode.com", CONTRACT = "0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce";
  App.refreshOwners = async (onProgress) => {
    // (a public node only takes so much at once: a pause between batches, and a longer one when it says "slow down")
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const post = async (body) => {
      for (let k = 0; ; k++) {
        const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (r.ok) return r.json();
        if ((r.status === 429 || r.status >= 500) && k < 7) { await wait(1500 * (k + 1)); continue; }
        throw new Error("the node answered " + r.status);
      }
    };
    const head = await post({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] });
    const tag = head.result, block = parseInt(tag, 16), owners = new Array(N).fill(null);
    for (let a = 0; a < N; a += 100) {
      const batch = [];
      for (let id = a; id < Math.min(N, a + 100); id++) batch.push({ jsonrpc: "2.0", id, method: "eth_call", params: [{ to: CONTRACT, data: "0x6352211e" + id.toString(16).padStart(64, "0") }, tag] });
      let res = await post(batch);
      if (!Array.isArray(res)) res = [res];
      for (const r of res) if (r && typeof r.result === "string" && r.result.length >= 66) owners[r.id] = "0x" + r.result.slice(-40).toLowerCase();
      if (onProgress) onProgress(Math.min(N, a + 100) / N);
      await wait(350);
    }
    const missing = owners.filter((o) => !o).length;
    if (missing > N * 0.05) throw new Error(missing + " answers missing");
    if (block <= (TB.OWNERS ? TB.OWNERS.block : 0)) throw new Error("the node is behind the game's own snapshot");
    let changed = 0;
    for (let id = 0; id < N; id++) if (owners[id] !== App.ownerOf(id)) changed++;
    if (!App.setOwners({ block, date: new Date().toISOString().slice(0, 10), owners })) throw new Error("this browser would not keep it");
    return { block, changed };
  };
  App.tokensOf = (addr) => { addr = (addr || "").toLowerCase(); const out = []; for (let id = 0; id < N; id++) if (App.ownerOf(id) === addr) out.push(id); return out; };
  App.topHolders = (n) => {
    const cnt = new Map();
    for (let id = 0; id < N; id++) { const o = App.ownerOf(id); if (o) cnt.set(o, (cnt.get(o) || 0) + 1); }
    return [...cnt].sort((a, b) => b[1] - a[1]).slice(0, n).map(([addr, count]) => ({ addr, count }));
  };
  App.isMine = (id) => !!st.wallet && App.ownerOf(id) === st.wallet;

  // ---------- jobs ----------
  const GROUND_JOB = { "Fishing Rod": "fisher", "808": "dj", Cooler: "vendor", Chair: "lifeguard", "Surfs Up": "surfer", Beachball: "host", Treasure: "hunter", Workout: "coach", Skateboard: "courier", Skates: "courier" };
  const REGION_JOB = { 16: "ranger", 11: "keeper", 14: "climber", 3: "dockhand", 1: "comber", 4: "farmer" };
  const JOB_INFO = (App.JOB_INFO = {
    fisher: { title: "Fisher", place: ["pier", "pond", "beach"], verb: "is fishing for the village", needs: { fun: 8, hunger: 8, energy: -8 } },
    dj: { title: "DJ", place: "plaza", verb: "is playing music on the square", needs: { fun: 12, social: 10, energy: -8 } },
    vendor: { title: "Snack vendor", place: "plaza", verb: "is selling snacks", needs: { social: 12, hunger: 6, energy: -6 } },
    lifeguard: { title: "Lifeguard", place: ["beach", "pier", "pond"], verb: "is on lifeguard duty", needs: { fun: 6, energy: -8 } },
    surfer: { title: "Surf teacher", place: ["beach", "pier", "pond"], verb: "is teaching surfing", needs: { fun: 12, social: 6, energy: -12 } },
    host: { title: "Games host", place: ["meadow", "camp", "grove"], verb: "is running games", needs: { fun: 10, social: 10, energy: -8 } },
    hunter: { title: "Treasure hunter", place: "far", verb: "is hunting for treasure", needs: { fun: 14, energy: -12 } },
    coach: { title: "Coach", place: "plaza", verb: "is coaching a workout", needs: { social: 10, fun: 6, energy: -12 } },
    courier: { title: "Courier", place: "othervillage", verb: "is delivering parcels", needs: { social: 12, energy: -10 } },
    ranger: { title: "Ranger", place: ["camp", "meadow", "falls"], verb: "is tending the campfire", needs: { fun: 6, social: 6, energy: -6 } },
    keeper: { title: "Duck keeper", place: ["pond", "meadow"], verb: "is looking after the ducks", needs: { fun: 10, energy: -4 } },
    climber: { title: "Climbing guide", place: ["falls", "camp", "meadow"], verb: "is guiding a climb", needs: { fun: 12, energy: -12 } },
    dockhand: { title: "Dockhand", place: ["pier", "beach", "pond"], verb: "is working the docks", needs: { social: 6, energy: -10 } },
    comber: { title: "Beachcomber", place: ["beach", "pier", "pond"], verb: "is combing the beach", needs: { fun: 10, energy: -6 } },
    farmer: { title: "Coconut farmer", place: ["grove", "meadow", "camp"], verb: "is harvesting coconuts", needs: { hunger: 8, energy: -10 } },
  });
  App.jobOf = (id) => {
    const g = P.ground[id] >= 0 ? App.MODEL_NAMES["ground:" + P.ground[id]] : null;
    return (g && GROUND_JOB[g]) || REGION_JOB[P.floor[id]];
  };
  const placeLabel = (p) => { const v = App.nearestVillage(p.x, p.z); return (p.type === "plaza" ? v.name + " square" : "the " + p.name + " near " + v.name); };
  // one of the few closest places of a type (pick spreads people over them)
  function nearestPoi(x, z, type, maxR, region, pick) {
    for (const r of [80, 140, maxR || 200]) {
      const list = App.poisNear(x, z, r, (p) => p.type === type && (region == null || p.region === region));
      if (list.length) {
        list.sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
        return list[pick == null ? 0 : Math.floor(pick * Math.min(3, list.length))];
      }
    }
    return null;
  }
  // a place as a target: its centre plus what is needed to stand around it sensibly
  const atSpot = (p) => p.type === "pier" || p.type === "falls" || p.type === "beach";
  const asPlace = (p) => ({ x: atSpot(p) ? p.spot.x : p.x, z: atSpot(p) ? p.spot.z : p.z, type: p.type, lakeR: p.lake ? p.lake.r : 0, label: placeLabel(p) });
  const plazaOf = (v, label) => ({ x: v.x, z: v.z, type: "plaza", label: label || v.name + " square" });
  // where one Tickle stands at a place: around the square, on the bank of a pond, in a ring round a campfire...
  function standAt(pl, id, salt) {
    const a = App.hash2(id, salt, 31) * 6.28, u = App.hash2(id, salt, 37);
    const R = { plaza: [6, 14], pond: [pl.lakeR + 2, pl.lakeR + 6], camp: [5, 10], pier: [1, 6], falls: [2, 8] }[pl.type] || [2, 12];
    const d = R[0] + u * (R[1] - R[0]);
    return { x: pl.x + Math.cos(a) * d, z: pl.z + Math.sin(a) * d, label: pl.label, type: pl.type, cx: pl.x, cz: pl.z };
  }
  const workCache = new Map();
  // a seat round an arena (an angle from its front), keeping clear of the ramp down to the gate
  App.arenaSeatAngle = (ar, u) => (ar.rot || 0) + 0.55 + u * (6.283 - 1.1);
  App.workplaceOf = (id) => {
    if (workCache.has(id)) return workCache.get(id);
    const job = App.jobOf(id), info = JOB_INFO[job], v = App.villageOfToken(id);
    const hx = P.home[2 * id], hz = P.home[2 * id + 1];
    let w = null;
    if (info.place === "plaza") w = plazaOf(v);
    else if (info.place === "far") {
      const list = App.poisNear(hx, hz, 220, (p) => Math.hypot(p.x - hx, p.z - hz) > 90);
      const p = list[Math.floor(App.hash2(id, 5, 5) * list.length)];
      if (p) w = asPlace(p);
    } else if (Array.isArray(info.place)) {
      // the first kind of place that is within a sensible walk
      for (const type of info.place) {
        const p = nearestPoi(hx, hz, type, 220, null, App.hash2(id, 6, 6));
        if (p) { w = asPlace(p); break; }
      }
      // a job by the water never ends up on the village square: look further, then go to the region's dock on the lake
      const wet = info.place.includes("pier") || info.place.includes("pond");
      if (!w && wet) for (const type of info.place) { const p = nearestPoi(hx, hz, type, 700, null, App.hash2(id, 6, 6)); if (p) { w = asPlace(p); break; } }
      if (!w && wet && App.docks) {
        const D = App.docks.filter((d) => d.region === v.region).sort((a, b) => Math.hypot(a.x - hx, a.z - hz) - Math.hypot(b.x - hx, b.z - hz))[0];
        // a place of its own on the jetty or along the bank, facing the water (boats.js)
        const sp = D && App.dockSpot ? App.dockSpot(id, D) : null;
        if (sp) w = { x: sp.x, z: sp.z, type: "pier", label: D.name + (sp.deck ? " (on the jetty)" : ""), cx: sp.cx, cz: sp.cz, exact: true };
        else if (D) w = { x: D.land.x, z: D.land.z, type: "pier", label: D.name, cx: D.berth.x, cz: D.berth.z };
      }
    }
    if (!w) w = plazaOf(v);
    // a surf teacher works where there are waves: a beach on the open sea
    if (job === "surfer" && App.seaBeach) {
      const b = App.seaBeach(hx, hz, 320);
      if (b) w = { x: b.x, z: b.z, type: "beach", label: "the beach on the open sea near " + App.nearestVillage(b.x, b.z).name, cx: b.cx, cz: b.cz, exact: true };
    }
    // fishers at a pier, a pond or a beach each have their own place on the water's edge (boats.js)
    if (job === "fisher" && !w.exact && (w.type === "pier" || w.type === "pond" || w.type === "beach") && App.shoreSpot) {
      const sp = App.shoreSpot(Math.round(w.x) + ":" + Math.round(w.z), w.x, w.z, id, w.type === "pond");
      if (sp) w = Object.assign({}, w, { x: sp.x, z: sp.z, cx: sp.cx, cz: sp.cz, exact: true });
    }
    workCache.set(id, w);
    return w;
  };

  // ---------- the daily plan ----------
  function rngOf(a, b) { let s = (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const planCache = new Map();
  let planDay = -1;
  App.planOf = (id, day) => {
    if (day !== planDay) { planCache.clear(); planDay = day; }
    let pl = planCache.get(id);
    if (pl) return pl;
    const r = rngOf(id, day);
    const v = App.villageOfToken(id), job = App.jobOf(id), info = JOB_INFO[job];
    const home = App.homeOf ? App.homeOf(id) : { x: P.home[2 * id], z: P.home[2 * id + 1], label: "home in " + v.name };

    let work;
    if (info.place === "othervillage") {
      const others = App.villages.filter((o) => o !== v && Math.hypot(o.x - v.x, o.z - v.z) < 300);
      const o = others[Math.floor(r() * others.length)] || v;
      work = plazaOf(o, o.name + " (deliveries)");
    } else work = App.workplaceOf(id);
    if (job === "fisher" && App.docks) {
      const D = App.docks.find((d) => d.region === v.region);
      if (D && Math.hypot(D.x - home.x, D.z - home.z) < 300 && App.hash2(id, day, 213) < 0.5) work = { x: D.land.x, z: D.land.z, label: D.name + " (fishing out on the lake)", boat: D.i, cx: D.berth.x, cz: D.berth.z };
    }
    const food = r() < 0.55 ? nearestPoi(work.x, work.z, r() < 0.5 ? "grove" : "pier", 90, null, r()) : null;
    const lunch = food && Math.hypot(food.x - work.x, food.z - work.z) < 90 ? asPlace(food) : plazaOf(v);
    let leisure;
    if (r() < 0.1) { // over a bridge to a neighbouring region
      const brs = App.bridges.filter((b) => b.a === v.region || b.b === v.region).sort((a, b) => Math.hypot(a.mx - v.x, a.mz - v.z) - Math.hypot(b.mx - v.x, b.mz - v.z));
      const br = brs[Math.floor(r() * Math.min(2, brs.length))];
      if (br) {
        const far = br.a === v.region ? { x: br.bx, z: br.bz } : { x: br.ax, z: br.az };
        const list = App.poisNear(far.x, far.z, 140, (p) => p.region !== v.region && !(App.lairNear && App.lairNear(p.x, p.z, 70)));
        const p = list[Math.floor(r() * list.length)];
        if (p) leisure = asPlace(p);
      }
    }
    // tamers spend some afternoons out where the wild creatures live
    let taming = false;
    if (!leisure && App.isTamer(id) && App.creaturesOf(id).length < 3 && App.hash2(id, day, 63) < 0.45) {
      const sp = App.tamingSpot(id);
      if (sp) { leisure = sp; taming = true; }
    }
    if (!leisure) {
      // nobody spends their free time on a dragon's ground
      const list = App.poisNear(home.x, home.z, 140, (p) => p.region === v.region && !(App.lairNear && App.lairNear(p.x, p.z, 70)));
      const p = list[Math.floor(r() * list.length)];
      leisure = p ? asPlace(p) : plazaOf(v);
    }
    let evening = plazaOf(v, v.name + " square (dinner by the fire)");
    if (r() < 0.12) {
      // now and then dinner with another village of the same clan
      const o = App.villages.filter((q) => q !== v && q.clan === v.clan && q.region === v.region).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[Math.floor(r() * 2)];
      if (o) evening = plazaOf(o, o.name + " square (visiting)");
    }
    // the on-chain job in the morning, chores for the village in the afternoon, free time, dinner
    // on the square with everyone, then bed
    const wake = 390 + r() * 90, jobS = wake + 25 + r() * 20, jobE = 750 + r() * 40, lunchE = jobE + 50 + r() * 20;
    // a day of rest (the Rest Day Act, parliament.js): no work and no chores, free time from breakfast to dinner
    const rest = App.restDay && App.restDay(day);
    // (a minister on a sitting day has no chores either: it has a Parliament to get to)
    const chores = !rest && !(App.sitsToday && App.sitsToday(id, day)) && App.doesChores(id), choreE = lunchE + 170 + r() * 50;
    const leisS = chores ? choreE : lunchE, leisE = Math.max(leisS + 50, 1080 + r() * 50), homeT = 1290 + r() * 70;
    // up for sale on a marketplace: the day in the prison (prison.js)
    const jail = App.prisonPlan && App.prisonPlan(id, day);
    if (jail) {
      let pv = jail[0].p;
      for (const s of jail) { s.path = App.route(pv.x, pv.z, s.p.x, s.p.z); s.len = App.pathLength(s.path); s.travel = s.len / SPEED; pv = s.p; }
      pl = { id, day, job: "prisoner", steps: jail };
      planCache.set(id, pl);
      return pl;
    }
    const line = App.boatmanLine && App.boatmanLine(id);
    if (line) {
      const D = App.docks[line.a], H = App.ferryHours;
      const bsteps = [{ k: "sleep", s: 0, e: H.open - 50, p: home }, { k: "morning", s: H.open - 50, e: H.open - 25, p: home },
        { k: "boat", s: H.open - 25, e: H.close + 15, p: Object.assign({ label: line.name + " (at the helm)" }, D.land), ferry: line.i }, { k: "evening", s: H.close + 15, e: 1340, p: standAt(plazaOf(v), id, day * 7 + 4) }, { k: "sleep", s: 1340, e: 1440, p: home }];
      let pv = home;
      for (const s of bsteps) { s.path = App.route(pv.x, pv.z, s.p.x, s.p.z); s.len = App.pathLength(s.path); s.travel = s.len / SPEED; pv = s.p; }
      pl = { id, day, job: "boatman", steps: bsteps };
      planCache.set(id, pl);
      return pl;
    }
    let steps = [{ k: "sleep", s: 0, e: wake, p: home }, { k: "morning", s: wake, e: jobS, p: home },
      rest ? { k: "leisure", s: jobS, e: jobE, p: standAt(leisure, id, day * 7 + 5) } : { k: "job", s: jobS, e: jobE, p: work.boat != null || work.exact ? work : standAt(work, id, 1) }, { k: "lunch", s: jobE, e: lunchE, p: standAt(lunch, id, day * 7 + 2) }];
    // a village with something in ruins sends some of its farmers and gatherers to rebuild
    let chore = App.choreOf(id), site = null;
    if (chores && (chore === "farm" || chore === "gather") && App.hash2(id, day, 111) < 0.45 && App.buildSite && (site = App.buildSite(id, day))) chore = "build";
    const mine = chores && App.isMiner && App.isMiner(id) ? App.mineOf(id) : null;
    if (mine) steps.push({ k: "mine", s: lunchE, e: choreE, p: { x: mine.door.x + Math.sin(mine.rot) * 3, z: mine.door.z + Math.cos(mine.rot) * 3, label: mine.name + " (mining)", cx: mine.x, cz: mine.z, mine: mine.i } });
    else if (chores) steps.push({ k: "chore", s: lunchE, e: choreE, p: site || App.chorePlace(id), chore });
    steps.push({ k: "leisure", s: leisS, e: leisE, p: taming ? leisure : standAt(leisure, id, day * 7 + 3), taming }, { k: "evening", s: leisE, e: homeT, p: standAt(evening, id, day * 7 + 4) }, { k: "sleep", s: homeT, e: 1440, p: home });
    // a boat trip in the free time: over on the ferry (or a launch), some time there, and back for dinner
    const trip = (F, near, farLand, farName, dest, stay) => {
      const side = F.a === near.i ? "a" : "b", other = side === "a" ? "b" : "a", dd = day * 1440;
      const iL = steps.findIndex((s) => s.k === "leisure"), E = steps.find((s) => s.k === "evening");
      if (iL < 1 || !E) return false;
      const Ls = steps[iL], prevP = steps[iL - 1].p;
      const walk1 = (Math.hypot(near.land.x - prevP.x, near.land.z - prevP.z) * 1.25) / SPEED;
      const out = App.ferryDeparture(F, side, dd + Ls.s + walk1 + 3);
      if (!out) return false;
      const arr1 = out.arr - dd, walk2 = (Math.hypot(farLand.x - dest.x, farLand.z - dest.z) * 1.25) / SPEED;
      const back = App.ferryDeparture(F, other, dd + Math.max(Ls.e, arr1 + walk2 + 40) + walk2 + 3);
      if (!back || back.arr - dd > E.e - 30) return false;
      const leaveAt = back.dep - dd - walk2 - 5;
      if (App.bookFerry) { App.bookFerry(F, out.dep); App.bookFerry(F, back.dep); }
      steps.splice(iL, 1,
        { k: "ferry", s: Ls.s, e: arr1, from: near.land, p: Object.assign({ label: farName }, farLand), ferry: F.i, side, dep: out.dep - dd, arr: arr1 },
        Object.assign({ s: arr1, e: leaveAt, p: dest }, stay),
        { k: "ferry", s: leaveAt, e: back.arr - dd, from: farLand, p: Object.assign({ label: near.name }, near.land), ferry: F.i, side: other, dep: back.dep - dd, arr: back.arr - dd });
      E.s = back.arr - dd;
      return true;
    };
    const myDock = App.docks && App.docks.find((d) => d.region === v.region);
    const nearDock = myDock && Math.hypot(myDock.x - home.x, myDock.z - home.z) < 340;
    // the devout go on pilgrimage to the Maker's Isle
    let pilgrim = false;
    if (nearDock && myDock.launch != null && !taming && App.prayerOf && App.prayerOf(id, day)) {
      const F = App.ferries[myDock.launch];
      pilgrim = trip(F, myDock, F.isleLand, "the Maker's Isle", App.prayerSpot(id), { k: "pray" });
    }
    // a minister on a sitting day crosses on the launch to its seat in the Parliament (parliament.js)
    if (!pilgrim && nearDock && myDock.launch != null && !taming && App.sitsToday && App.sitsToday(id, day)) {
      const F = App.ferries[myDock.launch];
      pilgrim = trip(F, myDock, F.isleLand, "the Parliament", App.parliamentSeat(id), { k: "parliament" });
    }
    // or a trip to an Ether field to gather crystals
    const ef = !pilgrim && App.etherOf ? App.etherOf(id, day) : null;
    if (ef) { const iL = steps.findIndex((s) => s.k === "leisure"); if (iL > 0) steps[iL] = Object.assign({}, steps[iL], { k: "ether", p: App.etherSpot(id, ef, day) }); }
    // now and then free time across the lake
    if (!pilgrim && !ef && nearDock && myDock.ferry != null && !taming && r() < 0.09) {
      const F = App.ferries[myDock.ferry], far = App.docks[F.a === myDock.i ? F.b : F.a];
      const list = App.poisNear(far.x, far.z, 150, (p) => p.region === far.region && !(App.lairNear && App.lairNear(p.x, p.z, 70)));
      const poi = list[Math.floor(r() * list.length)];
      if (poi) trip(F, myDock, far.land, far.name, standAt(asPlace(poi), id, day * 7 + 3), { k: "leisure", across: true });
    }
    // or a dive at the nearest dive site (diving.js)
    const dv = !pilgrim && !ef && !taming && App.diveOf ? App.diveOf(id, day) : null;
    if (dv) { const iL = steps.findIndex((s) => s.k === "leisure" && !s.across); if (iL > 0) steps[iL] = Object.assign({}, steps[iL], { k: "dive", p: App.diveStep(dv) }); }
    // or free time at its guild's hall
    const gh = !taming && App.guildLeisure ? App.guildLeisure(id, day) : null;
    if (gh) { const iL = steps.findIndex((s) => s.k === "leisure" && !s.across); if (iL > 0) steps[iL] = Object.assign({}, steps[iL], { k: "guildhall", p: { x: gh.door.x, z: gh.door.z, label: App.GUILDS[gh.guild].name + " (at the guild hall)", hall: gh.guild } }); }
    // tonight's raid or dragon, laid over whatever was planned
    const d0 = day * 1440, raid = App.raidOf(id, day), def = App.defendOf(id, day);
    if (raid) {
      const g = App.villages[raid.to].granary;
      steps = overlay(steps, { k: "raid", s: raid.s - d0, e: Math.min(raid.end + 10 - d0, 1410), raid: raid.id,
        p: { x: g.x + (App.hash2(id, 41, 3) - 0.5) * 6, z: g.z + (App.hash2(id, 42, 3) - 0.5) * 6, label: "raiding " + App.villages[raid.to].name, cx: g.x, cz: g.z } });
    }
    // tonight's revival ritual at the village altar
    const rit = App.ritualOf && App.ritualOf(id, day);
    if (rit) steps = overlay(steps, { k: "ritual", s: rit.s - d0 - 10, e: rit.e - d0, p: App.ritualSpot(id) });
    // an afternoon down in the caves with the village's adventurers
    const party = App.partyOf && App.partyOf(id, day);
    if (party) {
      const dg = App.dungeons[party.dungeon];
      steps = overlay(steps, { k: "adventure", s: App.adventureWindow.start, e: App.adventureWindow.end, p: { x: dg.door.x + Math.sin(dg.rot) * 5, z: dg.door.z + Math.cos(dg.rot) * 5, label: dg.name + " (adventuring)" } });
    }
    // tonight's tournament at the region's arena
    const tour = App.arenaOf && App.arenaOf(id, day);
    if (tour) {
      const ar = App.arenas[tour.region], a = App.arenaSeatAngle(ar, App.hash2(id, day, 91));
      const walk = (Math.hypot(ar.x - home.x, ar.z - home.z) * 1.2) / SPEED;
      steps = overlay(steps, { k: "arena", s: Math.max(14 * 60, App.tourneyWindow.start - walk - 15), e: App.tourneyWindow.end + 5, p: { x: ar.x + Math.sin(a) * 7.4, z: ar.z + Math.cos(a) * 7.4, label: ar.name + " (tournament)", cx: ar.x, cz: ar.z } });
    }
    // the factions: dragon hunts, creature training, bets at the tournament, trade runs and the night
    const F = App.factionOf ? App.factionOf(id) : null;
    const walkTo = (x, z) => (Math.hypot(x - home.x, z - home.z) * 1.25) / SPEED;
    const hunt = F === "guild" && App.huntOf(id, day);
    if (hunt) {
      const L = App.lairs[hunt.lair], a = App.hash2(id, day, 173) * 6.28;
      steps = overlay(steps, { k: "hunt", hunt: hunt.key, s: Math.max(jobE, App.huntWindow.start - walkTo(L.x, L.z)), e: App.huntWindow.end, p: { x: L.x + Math.cos(a) * 12, z: L.z + Math.sin(a) * 12, label: L.name + " (dragon hunt)", cx: L.x, cz: L.z } });
    }
    const ses = App.trainingOf && App.trainingOf(id, day);
    if (ses) {
      const ar = App.arenas[ses.region], coach = ses.trainer === id, a = coach ? 0 : (ses.tamers.indexOf(id) + 1) * 2.1, r0 = coach ? 0.6 : 4;
      steps = overlay(steps, { k: "train", s: Math.max(lunchE, (coach ? 900 : 930) - walkTo(ar.x, ar.z)), e: coach ? 1035 : 1010, p: { x: ar.x + Math.cos(a) * r0, z: ar.z + Math.sin(a) * r0, label: ar.name + " (training)", cx: ar.x, cz: ar.z } });
    }
    const bar = F === "gamblers" && App.arenas[v.region];
    if (bar && Math.hypot(bar.x - v.x, bar.z - v.z) < 260 && App.hash2(id, day, 177) < 0.55) {
      const a = App.arenaSeatAngle(bar, App.hash2(id, day, 179)), rr = App.hash2(id, day, 181) < 0.5 ? 9.2 : 11;
      steps = overlay(steps, { k: "bet", s: Math.max(lunchE, App.tourneyWindow.start - walkTo(bar.x, bar.z) - 10), e: App.tourneyWindow.end, p: { x: bar.x + Math.sin(a) * rr, z: bar.z + Math.cos(a) * rr, label: bar.name + " (betting)", cx: bar.x, cz: bar.z } });
    }
    const tr = F === "merchants" && App.tradeOf(id, day);
    if (tr) {
      const ga = App.villages[tr.from].granary, gb = App.villages[tr.to].granary, ox = (App.hash2(id, 181, 3) - 0.5) * 4, oz = (App.hash2(id, 183, 3) - 0.5) * 4;
      steps = overlay(steps, { k: "trade", s: Math.max(lunchE, 840), e: 905, p: { x: ga.x + 3 + ox, z: ga.z + oz, label: App.villages[tr.from].name + " granary (buying food)", cx: ga.x, cz: ga.z } });
      steps = overlay(steps, { k: "trade2", s: 905, e: 990, p: { x: gb.x + 3 + ox, z: gb.z + oz, label: App.villages[tr.to].name + " granary (selling food)", cx: gb.x, cz: gb.z } });
    }
    const nj = (F === "watch" || F === "outlaws") && App.nightJobOf(id, day);
    if (nj && nj.watch) steps = overlay(steps, { k: "watch", s: 1365, e: 1436, p: { x: v.x + (App.hash2(id, day, 185) - 0.5) * 8, z: v.z + (App.hash2(id, day, 187) - 0.5) * 8, label: v.name + " (night watch)", cx: v.x, cz: v.z } });
    else if (nj) {
      const o = App.villages[nj.to], hm = o.homes[nj.house] || o.homes[0];
      steps = overlay(steps, { k: "outlaw", s: Math.max(1230, App.nightWindow.start - walkTo(hm.x, hm.z) - 10), e: App.nightWindow.end, p: { x: hm.x, z: hm.z, label: "somewhere in the dark", cx: hm.hx, cz: hm.hz } });
    }
    // the Warriors' Guild: an afternoon guarding a mine (one at the door, one down inside on its rounds)
    const gp = App.guildPlan && App.guildPlan(id, day);
    if (gp) steps = overlay(steps, gp);
    // a turn on the walls of its fortress (geo.js)
    const ww = App.wallWatch && App.wallWatch(id, day, v);
    if (ww) steps = overlay(steps, ww);
    // a night at the casino (the gamblers often; others now and then; the dealers every night)
    const cv = App.casinoVisit && App.casinoVisit(id, day);
    if (cv) steps = overlay(steps, { k: "casino", s: cv.s, e: cv.e, p: { x: cv.Cs.door.x + (App.hash2(id, 345, 3) - 0.5) * 3, z: cv.Cs.door.z + (App.hash2(id, 347, 3) - 0.5) * 3, label: cv.Cs.name + (cv.staff ? " (dealing at the tables)" : " (a night at the casino)"), casino: cv.Cs.i, staff: !!cv.staff } });
    // the smiths of the Blacksmiths' Guild at their anvils, a shopping trip, an afternoon out sailing (wealth.js)
    const ws = App.wealthStep && App.wealthStep(id, day, steps);
    if (ws) for (const w of ws) steps = overlay(steps, w);
    // today's contest of the region: competing, judging or watching (contests.js)
    const ct = App.contestStep && App.contestStep(id, day);
    if (ct) steps = overlay(steps, ct);
    // a sea beast off a dock or a beach nearby: the armed, the mages and the tamers go down to fight it (seabeasts.js)
    const sb = App.seaDefendStep && App.seaDefendStep(id, day);
    if (sb) steps = overlay(steps, sb);
    // at war: the day's march and battle, the spoils carried home, or indoors while a battle is on (war.js)
    const wr = App.warStep && App.warStep(id, day);
    if (wr) steps = overlay(steps, wr);
    // the weather: shelter at home from a storm (or heavy rain, or a tornado close by), run inland from a tsunami (weather.js)
    const wx = App.weatherStep && App.weatherStep(id, day, steps);
    if (wx) for (const w of wx) steps = overlay(steps, w);
    // only those with arms or a creature go out to fight the dragon; everyone else hides at home
    if (def && App.fighterKind && !App.fighterKind(id)) steps = overlay(steps, { k: "shelter", s: Math.max(0, def.t0 - 20 - d0), e: Math.min(def.t1 + 5 - d0, 1435), p: home });
    else if (def) {
      const o = App.villages[def.to], g = o.granary;
      steps = overlay(steps, { k: "defend", s: Math.max(0, def.t0 - 25 - d0), e: Math.min(def.t1 - d0, 1430), attack: def.id,
        p: standAt({ x: g.x, z: g.z, type: "defend", label: "defending " + o.name + " from the dragon" }, id, 11) });
    }
    let prev = home;
    // a horse makes the long trips quicker; a griffin flies them in a straight line (wealth.js)
    const mt = App.mountOf ? App.mountOf(id) : null;
    for (const s of steps) {
      const to = s.k === "ferry" ? s.from : s.p; // a ferry step walks to the dock, then rides
      s.path = App.route(prev.x, prev.z, to.x, to.z);
      s.len = App.pathLength(s.path);
      if (mt && s.len > 30) {
        if (mt.fly) { s.path = [{ x: prev.x, z: prev.z }, { x: to.x, z: to.z }]; s.len = App.pathLength(s.path); }
        s.spd = SPEED * mt.mul;
      }
      s.travel = s.len / (s.spd || SPEED);
      prev = s.p;
    }
    pl = { id, day, job, steps };
    planCache.set(id, pl);
    return pl;
  };
  // cut a new step into a plan, trimming whatever it overlaps
  function overlay(steps, ins) {
    const out = [];
    for (const s of steps) {
      if (s.e <= ins.s || s.s >= ins.e) { out.push(s); continue; }
      if (s.s < ins.s) out.push(Object.assign({}, s, { e: ins.s }));
      if (s.e > ins.e) out.push(Object.assign({}, s, { s: ins.e }));
    }
    out.push(ins);
    return out.sort((a, b) => a.s - b.s);
  }
  App.invalidatePlan = (id) => planCache.delete(id);
  App.planStep = (id, T) => {
    const day = Math.floor(T / 1440), m = T - day * 1440;
    const pl = App.planOf(id, day);
    for (let i = 0; i < pl.steps.length; i++) if (m < pl.steps[i].e) return { plan: pl, step: pl.steps[i], i, m };
    return { plan: pl, step: pl.steps[pl.steps.length - 1], i: pl.steps.length - 1, m };
  };
  // where a Tickle is when nobody is watching
  App.planPos = (id, T) => {
    if (App.isDead && App.isDead(id)) { const a = App.altarSpot(id); return { x: a.x, z: a.z, moving: false, inside: true }; }
    if (P.ko[id] > T) return { x: P.home[2 * id], z: P.home[2 * id + 1], moving: false, inside: true }; // knocked out: recovering at home
    const { step, m } = App.planStep(id, T);
    const el = m - step.s;
    if (el < step.travel) { const p = App.alongPath(step.path, el * (step.spd || SPEED)); return { x: p.x, z: p.z, moving: true }; }
    if (step.k === "wallwatch" && step.ww && App.wallPos) { const q = App.wallPos(step.ww, el - step.travel); return { x: q.x, z: q.z, moving: true }; }
    if (step.k === "sail" && App.boatPose) { const b = App.boatPose(id, T); if (b && b.out) return { x: b.x, z: b.z, moving: true, boat: true }; }
    if (step.k === "boat" && el >= step.travel) { const f = App.ferryAt(App.ferries[step.ferry], T); return { x: f.x, z: f.z, moving: true, boat: true }; }
    if (step.k === "ferry") {
      if (m < step.dep) return { x: step.from.x, z: step.from.z, moving: false };
      if (m < step.arr) { const f = App.ferryAt(App.ferries[step.ferry], T); return { x: f.x, z: f.z, moving: true, boat: true }; }
    }
    // at home asleep or at breakfast means indoors
    return { x: step.p.x, z: step.p.z, moving: false, inside: step.k === "sleep" || step.k === "morning" || step.k === "shelter" || step.k === "rainshelter" || step.k === "mine" || step.k === "rounds" || step.k === "guildhall" || step.k === "casino" || step.k === "cell" || step.k === "canteen" || step.k === "parliament" };
  };
  const STEP_LABEL = { sleep: "Sleeping", morning: "Breakfast at home", job: "At work", lunch: "Having lunch", chore: "Chores for the village", leisure: "Free time", evening: "Dinner and friends on the square", raid: "Raiding", defend: "Defending against a dragon", arena: "Creature tournament", adventure: "Adventuring in a dungeon", ritual: "Revival ritual",
    hunt: "Dragon hunt with the Guild", train: "Creature training at the arena", bet: "Betting at the tournament", watch: "Night watch", outlaw: "Out in the night", trade: "Buying food to trade", trade2: "Delivering food", shelter: "Hiding at home from the dragon", ferry: "Crossing the lake by ferry", pray: "Praying to the Maker", mine: "Down the mine", guard: "Guarding the mine (Warriors' Guild)", rounds: "On guard down the mine (Warriors' Guild)", guildhall: "At the guild hall", casino: "A night at the casino", contest: "In a contest", contestWatch: "At a contest", dive: "Diving", seadefend: "Fighting a sea beast", ether: "Gathering Ether crystals", boat: "At the helm of the boat", smith: "At the anvil (Blacksmiths' Guild)", rainshelter: "Sheltering at home from the weather", flee: "Running inland from the sea", groom: "Tending the horses (Blacksmiths' Guild)", shop: "Out shopping", sail: "Out sailing its own boat",
    cell: "Locked in its cell (up for sale)", canteen: "In the prison canteen", yard: "Out in the prison yard", pwork: "Breaking rocks in the prison yard", parliament: "In the Parliament (minister)" };
  App.stepLabel = (k) => STEP_LABEL[k];

  // ---------- simplified needs for everyone off-screen ----------
  App.popTick = (mins) => {
    App.economyTick(st.T - mins, st.T);
    for (let id = 0; id < N; id++) {
      if (P.agent[id]) continue;
      const o = id * 4, fed = App.villages[P.village[id]].fed;
      for (let k = 0; k < 4; k++) {
        let v = P.needs[o + k];
        // hunger settles lower in villages whose granary ran dry
        const target = k === 0 ? 40 + 32 * (fed == null ? 1 : fed) : 72;
        v += (target - v) * 0.04 * (mins / 15) + (App.hash2(id, Math.floor(st.T / 15), k) - 0.5) * 3;
        P.needs[o + k] = Math.max(15, Math.min(100, v));
      }
    }
  };

  // ---------- character mesh cache ----------
  const meshCache = new Map();
  function getCharacter(id) {
    const hit = meshCache.get(id);
    if (hit) { meshCache.delete(id); meshCache.set(id, hit); return Promise.resolve(hit); }
    return App.job("character", { token: id, voxel: 10, arms: true, outfit: App.outfitOf ? App.outfitOf(id) : null }).then((res) => {
      const part = (md) => (md ? { md, geo: App.makeVoxMesh(md).geometry } : null);
      const entry = { md: res.mesh, geo: App.makeVoxMesh(res.mesh).geometry, anchor: res.anchor, traits: res.traits, seed: res.seed,
        arm: part(res.arm), itemL: part(res.itemL), itemR: part(res.itemR), shoulder: res.shoulder, paw: res.paw };
      meshCache.set(id, entry);
      while (meshCache.size > 120) {
        const [k, e] = meshCache.entries().next().value;
        if (P.agent[k]) { meshCache.delete(k); meshCache.set(k, e); break; }
        e.geo.dispose(); for (const x of [e.arm, e.itemL, e.itemR]) if (x) x.geo.dispose(); meshCache.delete(k);
      }
      return entry;
    });
  }
  App.characterOf = getCharacter;
  // a change of clothes: the figure is made again (the agent comes back with it a moment later)
  App.refreshLook = (id) => {
    const e = meshCache.get(id);
    if (e) { meshCache.delete(id); if (!P.agent[id]) { e.geo.dispose(); for (const x of [e.arm, e.itemL, e.itemR]) if (x) x.geo.dispose(); } }
    const t = P.agent[id];
    if (t) demote(t);
  };
  async function promote(id) {
    if (P.agent[id] || P.pending.has(id)) return;
    P.pending.add(id);
    try {
      const e = await getCharacter(id);
      if (!P.pending.has(id)) return;
      P.agent[id] = App.makeAgent(id, e, App.planPos(id, st.T));
    } catch (err) { console.warn("promote", id, err); }
    finally { P.pending.delete(id); }
  }
  function demote(t) {
    const id = t.id;
    App.endAction(t);
    for (let k = 0; k < 4; k++) P.needs[id * 4 + k] = t.needs[App.NEEDS[k]];
    App.scene.remove(t.group);
    if (t.tagEl) { t.tagEl.remove(); t.bubEl.remove(); }
    P.agent[id] = null;
    st.tickles = st.tickles.filter((x) => x !== t);
    for (const o of st.tickles) if (o.action && o.action.partner === t) App.endAction(o);
  }
  App.demote = demote;
  App.forcePromote = (id) => { App.pinned = id; return promote(id); };

  // ---------- walking figures further away ----------
  let pawnMesh = null;
  const PAWN_CAP = 3000;
  function makePawns() {
    const body = new THREE.CylinderGeometry(0.42, 0.55, 1.7, 7); body.translate(0, 0.85, 0);
    const head = new THREE.SphereGeometry(0.5, 7, 5); head.translate(0, 2.05, 0);
    const pos = [], nor = [], idx = [];
    let off = 0;
    for (const g of [body, head]) {
      const p = g.attributes.position.array, n = g.attributes.normal.array, ix = g.index.array;
      for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
      for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
      off += p.length / 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    pawnMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), PAWN_CAP);
    pawnMesh.frustumCulled = false; // three r128 culls instanced meshes by the base geometry only
    pawnMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pawnMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PAWN_CAP * 3), 3);
    pawnMesh.count = 0;
    App.scene.add(pawnMesh);
  }
  function heightAt(id, x, z) {
    if (Math.abs(x - P.pyx[id]) + Math.abs(z - P.pyz[id]) > 0.6) {
      const h = App.genHeight(x, z), wd = App.wallDeckY ? App.wallDeckY(x, z) : null;
      P.py[id] = wd != null ? wd : h < App.SEA ? App.WATER_Y - 0.5 : h;
      P.pyx[id] = x; P.pyz[id] = z;
    }
    return P.py[id];
  }
  let pawnIds = [];
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), YAX = new THREE.Vector3(0, 1, 0), COL = new THREE.Color();
  App.updatePawns = () => {
    if (!pawnMesh) return;
    let n = 0;
    for (const id of pawnIds) {
      if (P.agent[id] || n >= PAWN_CAP) continue;
      const p = App.planPos(id, st.T);
      if (p.inside) continue;
      M4.makeTranslation(p.x, heightAt(id, p.x, p.z), p.z);
      pawnMesh.setMatrixAt(n, M4);
      const c = App.bodyColor[P.body[id]];
      COL.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
      pawnMesh.setColorAt(n, COL);
      n++;
    }
    pawnMesh.count = n;
    pawnMesh.instanceMatrix.needsUpdate = true;
    pawnMesh.instanceColor.needsUpdate = true;
  };

  // ---------- personal items (each Tickle's on-chain Ground item lives in its inventory) ----------
  const groundGeo = new Map();
  App.itemMesh = (index, theme) => {
    const k = index + ":" + theme;
    if (!groundGeo.has(k)) groundGeo.set(k, App.job("ground", { index, theme: theme < 0 ? null : theme, voxel: 10 }).then((r) => ({ md: r.mesh, geo: App.makeVoxMesh(r.mesh).geometry })));
    return groundGeo.get(k);
  };
  App.items = new Map(); // kept empty: items are no longer left lying around

  // ---------- scenery cut from the floor models ----------
  App.frag = {}; App.fragLo = {};
  function fragEntry(md, centerBox) {
    const geo = App.makeVoxMesh(md).geometry;
    const box = App.meshBox(md), cb = centerBox || box;
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(md.origin[0] * S - (cb.min.x + cb.max.x) / 2, md.origin[1] * S, md.origin[2] * S - (cb.min.z + cb.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
    return { md, geo, local, box, rad: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2, height: box.max.y - box.min.y };
  }
  App.fragEntry = fragEntry; // for models made later (wealth.js)
  App.loadFragments = async (onEach) => {
    const keys = Object.keys(TB.FRAGMENTS).filter((k) => !TB.FRAGMENTS[k].critter);
    await Promise.all(keys.map(async (key) => {
      const [hi, lo] = await Promise.all([
        App.job("fragment", { key, voxel: key.startsWith("grass") ? 12 : 10 }),
        App.job("fragment", { key, voxel: key.startsWith("grass") ? 30 : 26 }),
      ]);
      App.frag[key] = fragEntry(hi.mesh);
      App.fragLo[key] = fragEntry(lo.mesh, App.frag[key].box);
      if (onEach) onEach(key);
    }));
    // the world kit: trees and village buildings designed in the same stroke format
    await Promise.all(Object.keys(TB.KIT).filter((k) => TB.KIT[k].scenery || TB.KIT[k].group === "Farming").flatMap((kind) => TB.KIT[kind].variants.map(async (v) => {
      const K = TB.KIT[kind], strokes = K.build(v), key = TB.kitKey(kind, v);
      const [hi, lo] = await Promise.all([App.job("compact", { strokes, voxel: K.voxel[0], lip: 1.5 }), App.job("compact", { strokes, voxel: K.voxel[1], lip: 1.5 })]);
      App.frag[key] = fragEntry(hi.mesh);
      App.fragLo[key] = fragEntry(lo.mesh, App.frag[key].box);
    })));
  };
  // ---------- the finest level of detail: smaller cubes for the models close to the camera ----------
  // (Menu > Settings > Graphics, gfx.js.) Made the first time a model comes near, one at a time in the
  // workers, with the same recipe as its usual copy (an on-chain floor model, or a kit model) at a smaller cube.
  App.fragX = {};
  const fineLoading = new Set();
  let fineGen = 0;
  App.dropFine = () => { fineGen++; for (const k in App.fragX) App.fragX[k].geo.dispose(); App.fragX = {}; fineLoading.clear(); };
  function fineVoxel(key) {
    const G = App.gfxLevel && App.gfxLevel().fine;
    if (!G) return 0;
    const F = TB.FRAGMENTS && TB.FRAGMENTS[key], m = key.match(/^(.*)_(\d+)$/), K = !F && m && TB.KIT[m[1]];
    const base = F ? (key.startsWith("grass") ? 12 : 10) : K ? K.voxel[0] : 0;
    // (castles, palaces and citadels are huge: their finest copy stops at a cube that the workers can make in a
    // reasonable time; mansions and everything smaller go all the way)
    return base ? Math.max(G.min, Math.round(base * G.k), base >= 24 ? (G.k < 0.6 ? 16 : 20) : 0) : 0;
  }
  function ensureFine(key) {
    // (only when the workers have nothing else to do: the Tickles coming into view are made first)
    if (App.fragX[key] || fineLoading.has(key) || fineLoading.size >= 1 || !App.frag[key] || (App.jobsPending && App.jobsPending() > 0)) return;
    const voxel = fineVoxel(key);
    if (!voxel) return;
    const F = TB.FRAGMENTS && TB.FRAGMENTS[key], m = key.match(/^(.*)_(\d+)$/), K = !F && m && TB.KIT[m[1]];
    if (!F && !K) return;
    fineLoading.add(key);
    const gen = fineGen;
    (F ? App.job("fragment", { key, voxel }) : App.job("compact", { strokes: K.build(+m[2]), voxel, lip: 1.5 })).then((r) => {
      if (gen !== fineGen) return;
      fineLoading.delete(key);
      App.fragX[key] = fragEntry(r.mesh, App.frag[key].box);
      App.sceneryDirty = true;
    }).catch(() => { if (gen === fineGen) fineLoading.delete(key); });
  }
  // which kit kind a scenery type belongs to ("cottage_3" -> "cottage"), and whether review allows it
  App.kindOf = (type) => type.replace(/_\d+$/, "");
  App.kitOn = (kind) => !st.kit || st.kit[kind] !== "rejected";
  const scnMeshes = {};
  let shadowMesh = null;
  let scnSig = "";
  App.sceneryVisible = [];
  const FRAG_SCALE = { waterfall: 2.3, boulders: 1.7, pier: 1.25, arena_0: 4.2, arena_1: 4.2, arena_2: 4.2, dungeon_0: 2.6, dungeon_1: 2.6, dungeon_2: 2.6, dungeon_3: 2.6, maker_0: 6, mine_0: 1.6, mine_1: 1.6, mine_2: 1.6, mine_3: 1.6 };
  App.FRAG_SCALE = FRAG_SCALE; // (the far view, farview.js)
  const SC = new THREE.Vector3();
  const NEAR_LOD = 70;
  function updateScenery(tx, tz) {
    // rebuild when the view moves on, and also when more models finish loading (trees arrive after the first frame)
    // (with the finest level of detail on, more often: models come into it within a few dozen blocks)
    const G = App.gfxLevel && App.gfxLevel().fine ? 8 : 24;
    const sig = Math.floor(tx / G) + "," + Math.floor(tz / G) + "," + Object.keys(App.frag).length + "," + Object.keys(App.fragLo).length + (App.sceneryFar ? "f" : "");
    if (sig === scnSig && !App.sceneryDirty) return;
    App.sceneryDirty = false;
    scnSig = sig;
    // (high up, the far view's coarse copies stand in for all of it, farview.js)
    const all = App.sceneryFar ? [] : App.gridNear("scenery", tx, tz, App.RANGE.scenery);
    const byType = {};
    App.sceneryVisible = [];
    const fine = App.gfxLevel && App.gfxLevel().fine, XR = fine ? fine.near : 0;
    for (const s of all) {
      const d = Math.hypot(s.x - tx, s.z - tz);
      if (s.gone || d > App.RANGE.scenery || !App.kitOn(App.kindOf(s.type)) || (App.isBroken && App.isBroken(s))) continue;
      // the giant statue is seen from far across the lake: it keeps its detailed model, so it never changes shape
      let L = s.giant || d < (s.tree ? 48 : s.building ? 45 : NEAR_LOD) ? "hi" : "lo";
      // close to the camera, the finest copy once it is made (the usual one until then)
      // (a big building counts from its walls, not its middle)
      const rad = s.building && App.frag[s.type] ? App.frag[s.type].rad * (s.scale || FRAG_SCALE[s.type] || 1) : 0;
      if (d - rad < XR && !s.giant) { if (App.fragX[s.type]) L = "x"; else ensureFine(s.type); }
      if (s.type !== "duck") (byType[s.type + ":" + L] = byType[s.type + ":" + L] || []).push(s); // ducks are alive, see critters.js
      if (d < NEAR_LOD + 30) App.sceneryVisible.push(s);
    }
    if (!shadowMesh) {
      const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
      shadowMesh = new THREE.InstancedMesh(g, App.makeBlob(0.5).material, 6000);
      shadowMesh.frustumCulled = false; shadowMesh.renderOrder = 1;
      App.scene.add(shadowMesh);
    }
    let ns = 0;
    for (const s of all) {
      if (!s.tree || ns >= 6000 || Math.hypot(s.x - tx, s.z - tz) > App.RANGE.scenery || !App.kitOn(App.kindOf(s.type)) || (App.isBroken && App.isBroken(s))) continue;
      if (s.y == null) s.y = App.genHeight(s.x, s.z);
      const w = s.type === "palm" ? 3.2 : s.type.startsWith("bush") ? 2.4 : 4.4;
      M4.compose(V.set(s.x, s.y + 0.05, s.z), Q.identity(), SC.set(w, 1, w));
      shadowMesh.setMatrixAt(ns++, M4);
    }
    shadowMesh.count = ns;
    shadowMesh.instanceMatrix.needsUpdate = true;
    for (const L of ["x", "hi", "lo"]) for (const key in App.frag) {
      const F = (L === "x" ? App.fragX : L === "hi" ? App.frag : App.fragLo)[key];
      const k = key + ":" + L, list = byType[k] || [];
      if (!F) { if (scnMeshes[k]) scnMeshes[k].count = 0; continue; }
      let m = scnMeshes[k];
      if (!m || m.instanceMatrix.count < list.length || m.geometry !== F.geo) {
        if (m) App.scene.remove(m);
        m = new THREE.InstancedMesh(F.geo, App.voxMaterial, Math.max(16, Math.ceil(list.length * 1.5)));
        m.frustumCulled = false; m.userData.lod = L;
        scnMeshes[k] = m;
        App.scene.add(m);
      }
      list.forEach((s, i) => {
        if (s.y == null) s.y = s.water ? App.WATER_Y + (key === "pier" ? 0.55 : -0.12) : App.genHeight(s.x, s.z);
        Q.setFromAxisAngle(YAX, s.rot);
        const k2 = s.scale || FRAG_SCALE[key] || 1;
        M4.compose(V.set(s.x, s.y, s.z), Q, SC.set(k2, k2, k2)).multiply(F.local);
        m.setMatrixAt(i, M4);
      });
      m.count = list.length;
      m.instanceMatrix.needsUpdate = true;
    }
  }

  App.updateScenery = (force) => { if (force) App.sceneryDirty = App.sceneryDirtyFar = true; updateScenery(App.cam.target.x, App.cam.target.z); };
  // ---------- the streaming step ----------
  App.updatePopulation = () => {
    const tx = App.cam.target.x, tz = App.cam.target.z;
    if (!pawnMesh) makePawns();
    updateScenery(tx, tz);
    // everyone whose village is close enough that they might be around
    const near = [];
    for (const v of App.gridNear("village", tx, tz, App.RANGE.pawns + 260)) {
      for (const id of v.residents) {
        const t = P.agent[id];
        const p = t ? t.pos : App.planPos(id, st.T);
        const d = Math.hypot(p.x - tx, p.z - tz);
        if (d < App.RANGE.pawns) near.push([d, id]);
      }
    }
    near.sort((a, b) => a[0] - b[0]);
    const want = new Set();
    for (const [d, id] of near) { if (d > App.RANGE.full || want.size >= MAX_FULL) break; want.add(id); }
    if (App.pinned != null) want.add(App.pinned);
    for (const t of st.tickles.slice()) {
      const d = Math.hypot(t.pos.x - tx, t.pos.z - tz);
      if (!want.has(t.id) && d > App.RANGE.full + 8) demote(t);
    }
    for (const id of P.pending) if (!want.has(id)) P.pending.delete(id);
    let started = 0;
    for (const id of want) if (!P.agent[id] && !P.pending.has(id) && started < 6) { promote(id); started++; }
    pawnIds = near.map((x) => x[1]);
    App.activeVillage = App.villageAt(tx, tz) || App.nearestVillage(tx, tz);
    App.activeRegion = App.regions[App.regionOf(tx, tz)];
    return { full: st.tickles.length, pending: P.pending.size, pawns: pawnIds.length };
  };
})();
