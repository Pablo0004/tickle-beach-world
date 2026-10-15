/* Weather by zones. Over the whole map lies one weather field that drifts with the wind, so fronts of cloud,
 * rain and storm cross it zone by zone; each region has its own climate on top (the Waterfall is the wettest,
 * Beach Sand the driest, the Palm gets tropical storms). Near you: the sky and the light darken, rain falls,
 * clouds drift over, morning fog lies in damp places, and in a storm lightning strikes (a flash, a bolt, and
 * the thunder a moment later, later the further away); now and then it splits a tree, sets back a house or
 * knocks out a Tickle. Rain and wind can be heard (ambience). Tickles shelter at home from storms (and many
 * from heavy rain), the birds fall quiet. Rarer: a tornado tears across a region in a storm, uprooting trees,
 * wrecking houses and throwing Tickles through the air; and, very rarely, a tsunami: the sea draws back from a
 * coast, the people of the shore run inland, and a great wave breaks over the beach. All of it happens on
 * the clock whether you watch or not (the same everywhere for the same day), and is acted out near you. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const camD = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z);
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  // ---------- the weather field ----------
  const lat = (i, j, k) => hash2(i * 7919 + k * 104729, j * 6271 + k * 130363, 911);
  const sm = (t) => t * t * (3 - 2 * t);
  function noise3(x, y, t) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(t), fx = sm(x - i), fy = sm(y - j), ft = sm(t - k);
    const L = (a, b, c) => a + (b - a) * c;
    const at = (kk) => L(L(lat(i, j, kk), lat(i + 1, j, kk), fx), L(lat(i, j + 1, kk), lat(i + 1, j + 1, kk), fx), fy);
    return L(at(k), at(k + 1), ft);
  }
  const WIND = { x: 0.9, z: 0.45 }; // blocks per game minute: the fronts cross the map in about two days
  // Camping, Duck Pond, Waterfall, The Pier, Beach Sand, The Palm
  const CLIMATE = [0, 0.03, 0.07, 0.01, -0.07, 0.03];
  const R0 = 0.6, STORM = 0.735;
  function field(x, z, T, r) {
    const wx = x - WIND.x * T, wz = z - WIND.z * T;
    const n = 0.62 * noise3(wx / 650, wz / 650, T / 1100) + 0.38 * noise3(wx / 240, wz / 240, T / 500);
    return n + CLIMATE[r == null ? App.regionOf(x, z) : r];
  }
  // the weather at a place and time: how much rain, whether it storms, cloud, fog, and a word for it
  App.weatherAt = (x, z, T, r) => {
    T = T == null ? st.T : T;
    let n = field(x, z, T, r);
    // a tornado brings its storm with it
    const tor = eventsOf(Math.floor(T / DAY)).tornado;
    if (tor && T >= tor.T0 - 40 && T <= tor.T1 + 30) { const p = torPos(tor, clamp(T, tor.T0, tor.T1)); const d = Math.hypot(x - p.x, z - p.z); if (d < 220) n = Math.max(n, STORM + 0.05 * (1 - d / 220)); }
    const rain = clamp((n - R0) / 0.16, 0, 1), storm = n > STORM, cloud = clamp((n - 0.45) / 0.2, 0, 1);
    const m = T - Math.floor(T / DAY) * DAY, morning = m > 300 && m < 600 ? 1 - Math.abs(m - 420) / 180 : 0;
    const fog = rain > 0 ? 0 : clamp(morning * (1 - Math.abs(n - 0.53) / 0.07), 0, 1);
    const kind = storm ? "storm" : rain > 0.12 ? "rain" : fog > 0.35 ? "fog" : cloud > 0.6 ? "cloudy" : "clear";
    return { n, rain, storm, cloud, fog, kind };
  };
  const NAMES = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", storm: "Storm", fog: "Fog" };
  const ICON = { clear: "\u2600", cloudy: "\u26c5", rain: "\ud83c\udf27", storm: "\u26c8", fog: "\ud83c\udf2b" };
  App.weatherName = (k) => NAMES[k] || k;

  // ---------- tornadoes and tsunamis: the same for everyone on a given day ----------
  const evCache = new Map();
  function eventsOf(day) {
    if (evCache.has(day)) return evCache.get(day);
    const out = {};
    if (App.regions && hash2(day, 1, 921) < 0.1) {
      // a tornado: an afternoon in one region, across it from side to side, past its villages
      const r = Math.floor(hash2(day, 2, 921) * App.regions.length), R = App.regions[r];
      const vs = App.villages.filter((v) => v.region === r);
      const v = vs[Math.floor(hash2(day, 3, 921) * vs.length)];
      if (v) {
        const a = hash2(day, 4, 921) * 6.283, L = 150 + hash2(day, 5, 921) * 100;
        const T0 = day * DAY + 14 * 60 + Math.floor(hash2(day, 6, 921) * 240), dur = 40;
        out.tornado = { day, region: r, a: { x: v.x - Math.cos(a) * L / 2, z: v.z - Math.sin(a) * L / 2 }, b: { x: v.x + Math.cos(a) * L / 2, z: v.z + Math.sin(a) * L / 2 }, T0, T1: T0 + dur, near: v.i, name: R.name };
      }
    }
    if (App.regions && App.seaBeach && hash2(day, 7, 921) < 0.06) {
      // a tsunami: one sea coast, warned of a little before the wave comes in
      const r = Math.floor(hash2(day, 8, 921) * App.regions.length), R = App.regions[r];
      const B = App.seaBeach(R.cx || R.x || 0, R.cz || R.z || 0, 900, r);
      if (B) {
        const T0 = day * DAY + 10 * 60 + Math.floor(hash2(day, 9, 921) * 420), dx = B.x - B.cx, dz = B.z - B.cz, d = Math.hypot(dx, dz) || 1;
        out.tsunami = { day, region: r, beach: { x: B.x, z: B.z }, sea: { x: B.cx, z: B.cz }, ux: dx / d, uz: dz / d, T0, warn: T0 - 45, name: R.name };
      }
    }
    evCache.set(day, out);
    if (evCache.size > 6) evCache.delete(evCache.keys().next().value);
    return out;
  }
  App.weatherEvents = (day) => eventsOf(day == null ? Math.floor(st.T / DAY) : day);
  App.weatherDebug = { force: (day, ev) => evCache.set(day, ev) }; // for testing: stage today's events
  function torPos(tor, T) { const u = clamp((T - tor.T0) / (tor.T1 - tor.T0), 0, 1); return { x: tor.a.x + (tor.b.x - tor.a.x) * u, z: tor.a.z + (tor.b.z - tor.a.z) * u, u }; }
  App.tornadoAt = (T) => { const tor = eventsOf(Math.floor((T == null ? st.T : T) / DAY)).tornado; T = T == null ? st.T : T; return tor && T >= tor.T0 && T <= tor.T1 ? Object.assign(torPos(tor, T), { tor }) : null; };

  // ---------- the plan hook (population.js): sheltering from storms, running from the wave ----------
  const SHELTER = new Set(["leisure", "evening"]);
  App.weatherStep = (id, day, steps) => {
    const v = App.villageOfToken(id), out = [];
    const home = App.homeOf ? App.homeOf(id) : null;
    if (!home) return null;
    for (const s of steps) {
      if (!SHELTER.has(s.k) || s.e - s.s < 20) continue;
      // the weather where it would be spending that time
      let worst = null;
      for (const f of [0.15, 0.5, 0.85]) { const W = App.weatherAt(s.p.x, s.p.z, day * DAY + s.s + (s.e - s.s) * f, v.region); if (!worst || W.n > worst.n) worst = W; }
      if (worst.storm || (worst.rain > 0.55 && hash2(id, day, 913) < 0.6)) out.push({ k: "rainshelter", s: s.s, e: s.e, p: home });
    }
    const ev = eventsOf(day);
    // a tornado bearing down: everyone in villages near its path stays inside while it passes
    if (ev.tornado && v.region === ev.tornado.region) {
      const tor = ev.tornado, ax = tor.b.x - tor.a.x, az = tor.b.z - tor.a.z, L2 = ax * ax + az * az;
      const u = clamp(((v.x - tor.a.x) * ax + (v.z - tor.a.z) * az) / L2, 0, 1), px = tor.a.x + ax * u, pz = tor.a.z + az * u;
      if (Math.hypot(v.x - px, v.z - pz) < 140) out.push({ k: "rainshelter", s: tor.T0 - day * DAY - 20, e: tor.T1 - day * DAY + 10, p: home, tornado: true });
    }
    // the sea drawing back: the shore villages run inland
    if (ev.tsunami) {
      const ts = ev.tsunami;
      if (Math.hypot(v.x - ts.beach.x, v.z - ts.beach.z) < 170) {
        const p = { x: ts.beach.x + ts.ux * 65 + (hash2(id, 1, 915) - 0.5) * 20, z: ts.beach.z + ts.uz * 65 + (hash2(id, 2, 915) - 0.5) * 20, label: "high ground away from the sea" };
        if (App.isLand(p.x, p.z)) out.push({ k: "flee", s: ts.warn - day * DAY, e: ts.T0 - day * DAY + 30, p });
      }
    }
    return out.length ? out : null;
  };

  // ---------- what happens: tornado damage, the wave, lightning ----------
  App.initWeather = (saved) => {
    st.wxLog = Object.assign({ tornadoes: 0, tsunamis: 0, strikes: 0, ruined: 0, blown: 0 }, (saved && saved.log) || {});
    st.wxDone = (saved && saved.done) || {};
  };
  App.saveWeather = () => ({ log: st.wxLog, done: st.wxDone });
  const near = (x, z, r) => camD(x, z) < (r || 400);
  function wreck(s, cause) {
    if (!s || s.gone || s.fixed || s.ruined || (App.isBroken && App.isBroken(s))) return false;
    // houses, town halls and granaries come down (fences, pens and the like ride it out)
    if (s.building) { if (!App.ruin || !(s.house || s.hall || s.granary)) return false; App.ruin(s, cause); st.wxLog.ruined++; return true; }
    if (s.tree || s.type === "palm" || s.type === "umbrella") { App.breakScenery(s); return true; }
    return false;
  }
  // a Tickle carried off by the wind (or the wave): through the air, then down and knocked out
  const flung = [];
  function fling(t, vx, vz, vy, why) {
    if (App.endAction) App.endAction(t);
    t.action = { kind: "flying", started: st.T };
    App.say(t, pick(["Aaaaaah!", "Heeeelp!", "Whoooa!"]), 3);
    flung.push({ t, x: t.pos.x, y: t.pos.y, z: t.pos.z, vx, vy, vz, why, spin: 0 });
    if (App.sfx && App.sfx.scream) App.sfx.scream(t.id, 20);
  }
  function tornadoStep(tor) {
    const key = "tor:" + tor.day, done = st.wxDone[key] || 0, now = clamp((st.T - tor.T0) / (tor.T1 - tor.T0), 0, 1);
    if (now <= done) return;
    if (!done) { st.wxLog.tornadoes++; App.log("weather", "A tornado is tearing across " + tor.name + "!", "It came down out of a storm near " + App.villages[tor.near].name + ". Everyone nearby is sheltering indoors.", {}); if (near(tor.a.x, tor.a.z, 600)) App.toast("Tornado in " + tor.name + "!"); }
    // the stretch it has crossed since last time: what stands in its way
    const steps = Math.max(1, Math.ceil(((now - done) * Math.hypot(tor.b.x - tor.a.x, tor.b.z - tor.a.z)) / 3));
    for (let k = 1; k <= steps; k++) {
      const u = done + ((now - done) * k) / steps, x = tor.a.x + (tor.b.x - tor.a.x) * u, z = tor.a.z + (tor.b.z - tor.a.z) * u;
      for (const s of App.gridNear("scenery", x, z, 8)) {
        const d = Math.hypot(s.x - x, s.z - z);
        if (d < (s.building ? 4.5 : 5.5) && hash2(s.idx, tor.day, 931) < (s.building ? 0.7 : 0.85)) wreck(s, "by a tornado");
      }
      // those caught out in the open
      for (const vv of App.gridNear("village", x, z, 120)) for (const id of vv.residents) {
        if (App.isKO(id) || App.isDead(id)) continue;
        const t = App.pop.agent[id], p = t ? t.pos : App.planPos(id, st.T);
        if (p.inside || Math.hypot(p.x - x, p.z - z) > 7) continue;
        st.wxLog.blown++;
        if (t && t.group.visible && !(t.action && t.action.kind === "flying")) { const a = rnd() * 6.283; fling(t, Math.cos(a) * 14, Math.sin(a) * 14, 16, "blown away by a tornado"); }
        else App.knockOut(id, 120, "Blown away by a tornado");
      }
    }
    st.wxDone[key] = now;
    if (now >= 1) App.log("weather", "The tornado over " + tor.name + " has blown itself out.", "The villages will rebuild what it wrecked.", {});
  }
  function tsunamiStep(ts) {
    const key = "tsu:" + ts.day;
    if (st.T >= ts.warn && !st.wxDone[key + ":w"]) {
      st.wxDone[key + ":w"] = 1;
      App.log("weather", "The sea is drawing back from the coast of " + ts.name + "!", "A tsunami is coming: the people of the shore are running for high ground.", {});
      if (near(ts.beach.x, ts.beach.z, 700)) App.toast("Tsunami warning: " + ts.name + "!");
    }
    if (st.T < ts.T0 || st.wxDone[key]) return;
    st.wxDone[key] = 1; st.wxLog.tsunamis++;
    // the wave breaks over the beach: what stands close to the water goes, whoever is still there is swept away
    let ruined = 0, hit = 0;
    for (const s of App.gridNear("scenery", ts.beach.x, ts.beach.z, 80)) {
      const along = (s.x - ts.beach.x) * -ts.uz + (s.z - ts.beach.z) * ts.ux, inland = (s.x - ts.beach.x) * ts.ux + (s.z - ts.beach.z) * ts.uz;
      if (Math.abs(along) < 70 && inland < 16 && inland > -10 && wreck(s, "by the tsunami")) ruined++;
    }
    for (const vv of App.gridNear("village", ts.beach.x, ts.beach.z, 200)) for (const id of vv.residents) {
      if (App.isKO(id) || App.isDead(id)) continue;
      const t = App.pop.agent[id], p = t ? t.pos : App.planPos(id, st.T);
      if (p.inside || Math.hypot(p.x - ts.beach.x, p.z - ts.beach.z) > 30) continue;
      hit++;
      if (t && t.group.visible) fling(t, ts.ux * 12, ts.uz * 12, 8, "swept away by the tsunami");
      else App.knockOut(id, 180, "Swept away by the tsunami");
    }
    App.log("weather", "A tsunami broke over the coast of " + ts.name + ".", (ruined ? ruined + " things near the water were wrecked" : "Nothing near the water was left standing that could fall") + (hit ? "; " + hit + " Tickles who had not got away were swept off their feet" : "; everyone had got away in time") + ".", {});
  }
  App.weatherTick = () => {
    if (!st.wxDone) return;
    const day = Math.floor(st.T / DAY), ev = eventsOf(day);
    if (ev.tornado && st.T >= ev.tornado.T0 && (st.wxDone["tor:" + day] || 0) < 1) tornadoStep(ev.tornado);
    if (ev.tsunami) tsunamiStep(ev.tsunami);
  };

  // ---------- near you: light, rain, clouds, fog, lightning, the funnel, the wave, the sound ----------
  let here = null, hereAt = 0, flash = 0;
  App.weatherHere = () => here;
  // called from App.daylight (world.js): darker and greyer under cloud, closer fog in rain
  App.weatherLight = (scene, hemi, sun, k) => {
    if (App.inside || !here) return;
    const dim = here.cloud * 0.28 + here.rain * 0.18 + (here.storm ? 0.14 : 0);
    hemi.intensity *= 1 - dim; sun.intensity *= 1 - dim * 1.4;
    const grey = new THREE.Color(0.5, 0.54, 0.6).multiplyScalar(0.35 + k * 0.65).convertSRGBToLinear();
    const mix = clamp(here.cloud * 0.5 + here.rain * 0.4 + here.fog * 0.7, 0, 0.92);
    scene.background.lerp(grey, mix); scene.fog.color.lerp(grey, mix);
    if (!(App.fpOn && App.fpOn())) { scene.fog.near = 90 - here.rain * 45 - here.fog * 75; scene.fog.far = 175 - here.rain * 70 - here.fog * 105; }
    if (flash > 0) { hemi.intensity += flash * 1.6; scene.background.lerp(new THREE.Color(0.85, 0.88, 1), flash * 0.6); }
  };
  let rainMesh = null, cloudMesh = null, funnel = null, wave = null, bolt = null;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const RAIN = 1400, CLOUDS = 18, drops = [];
  function makeMeshes() {
    rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 1.1, 0.05), new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.55 }), RAIN);
    rainMesh.frustumCulled = false; rainMesh.count = 0; App.scene.add(rainMesh);
    for (let i = 0; i < RAIN; i++) drops.push({ x: (rnd() - 0.5) * 80, y: rnd() * 40, z: (rnd() - 0.5) * 80, v: 26 + rnd() * 10 });
    cloudMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }), CLOUDS * 3);
    cloudMesh.frustumCulled = false; cloudMesh.count = 0; App.scene.add(cloudMesh);
    // the funnel: grey rings, wide at the top and narrow at the ground, turning
    funnel = new THREE.Group();
    const fm = new THREE.MeshLambertMaterial({ color: 0x6a6e78, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    for (let k = 0; k < 12; k++) { const r0 = 1.4 + k * 0.85, r1 = 1.4 + (k + 1) * 0.85, c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 3.4, 14, 1, true), fm); c.position.y = 1.7 + k * 3.3; c.userData.k = k; funnel.add(c); }
    funnel.visible = false; App.scene.add(funnel);
    // the wave: a long wall of water with a white crest
    wave = new THREE.Group();
    const wb = new THREE.Mesh(new THREE.BoxGeometry(150, 8, 7), new THREE.MeshLambertMaterial({ color: 0x1f7fa8, transparent: true, opacity: 0.88 }));
    const wc = new THREE.Mesh(new THREE.BoxGeometry(152, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0xf4fbff }));
    wb.position.y = 4; wc.position.set(0, 8.4, 1.6); wave.add(wb, wc); wave.visible = false; App.scene.add(wave);
    bolt = new THREE.Group(); bolt.visible = false; App.scene.add(bolt);
  }
  const boltMat = () => new THREE.MeshBasicMaterial({ color: 0xf4f8ff });
  // lightning: a jagged bolt from the cloud to the ground, a flash, and thunder after a moment
  function strike(x, z) {
    const gy = App.surfaceAt(x, z).y;
    while (bolt.children.length) bolt.remove(bolt.children[0]);
    let px = x + (rnd() - 0.5) * 6, py = gy + 55, pz = z + (rnd() - 0.5) * 6;
    const mat = boltMat();
    for (let k = 0; k < 9; k++) {
      const ny = gy + 55 - ((k + 1) / 9) * 55, nx = k === 8 ? x : x + (rnd() - 0.5) * 5, nz = k === 8 ? z : z + (rnd() - 0.5) * 5;
      const len = Math.hypot(nx - px, ny - py, nz - pz), seg = new THREE.Mesh(new THREE.BoxGeometry(0.35, len, 0.35), mat);
      seg.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); seg.lookAt(nx, ny, nz); seg.rotateX(Math.PI / 2); bolt.add(seg);
      px = nx; py = ny; pz = nz;
    }
    bolt.visible = true; bolt.userData.until = performance.now() + 220;
    flash = 1;
    const d = camD(x, z);
    setTimeout(() => { if (App.sfx && App.sfx.animal) App.sfx.animal("thunder", clamp(1 - d / 160, 0.25, 1), "amb"); }, Math.min(3500, d * 14));
    for (let k = 0; k < 20; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x, y: gy + 0.5, z, vx: (rnd() - 0.5) * 6, vy: 2 + rnd() * 4, vz: (rnd() - 0.5) * 6, age: 0, life: 0.5, color: new THREE.Color(rnd() < 0.5 ? "#ffffff" : "#ffd23f") });
    st.wxLog.strikes++;
    // what it hits: a tree split, now and then a house, rarely a Tickle
    const s = App.gridNear("scenery", x, z, 6).filter((o) => Math.hypot(o.x - x, o.z - z) < 3.5).sort((a, b) => (b.tree ? 1 : 0) - (a.tree ? 1 : 0))[0];
    if (s && (s.tree ? rnd() < 0.45 : s.building && rnd() < 0.1)) wreck(s, "by lightning");
    for (const t of st.tickles) if (Math.hypot(t.pos.x - x, t.pos.z - z) < 2 && t.group.visible && rnd() < 0.5) { App.knockOut(t.id, 90, "Struck by lightning!"); App.log("weather", t.name + " was struck by lightning!", "Knocked out; it will be fine after a rest at home.", { who: [t.id] }); }
  }
  // the sound of the rain and the wind (ambience): two noise loops, louder as it pours
  let snd = null;
  function sound(rain, wind) {
    const A = App.sfx && App.sfx.ambient && navigator.userActivation && navigator.userActivation.hasBeenActive ? App.sfx.ambient() : null;
    if (!A) return;
    if (!snd) {
      const { ctx, bus } = A, n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const mk = (type, f, q) => { const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; src.connect(fl).connect(g).connect(bus); src.start(); return { g, fl }; };
      snd = { ctx, rain: mk("bandpass", 2400, 0.6), wind: mk("lowpass", 380, 1.5) };
    }
    const t = snd.ctx.currentTime;
    snd.rain.g.gain.setTargetAtTime(rain * 0.22, t, 0.6);
    snd.wind.g.gain.setTargetAtTime(wind * 0.35, t, 0.8);
    snd.wind.fl.frequency.setTargetAtTime(300 + Math.sin(t * 0.7) * 120, t, 0.5);
  }
  let nextStrike = 0;
  App.updateWeather = (dt) => {
    if (!rainMesh) makeMeshes();
    const now = performance.now(), tx = App.cam.target.x, tz = App.cam.target.z;
    if (now > hereAt) { here = App.weatherAt(tx, tz, st.T); hereAt = now + 500; }
    flash = Math.max(0, flash - dt * 6);
    if (bolt.visible && now > bolt.userData.until) bolt.visible = false;
    const inside = !!App.inside, W = here || { rain: 0, cloud: 0, storm: false, fog: 0 }, sp = st.speed > 0 ? 1 : 0;
    // the rain, falling round the camera (slanting with the wind in a storm)
    const n = inside ? 0 : Math.round(RAIN * W.rain);
    const cy = App.cam.target.y, slant = W.storm ? 0.35 : 0.12;
    E.set(slant, 0, -slant * 0.5); Q.setFromEuler(E);
    for (let i = 0; i < n; i++) {
      const p = drops[i];
      p.y -= p.v * dt * sp; p.x += WIND.x * 6 * dt * sp * (W.storm ? 2 : 1);
      if (p.y < -4) { p.y = 36 + rnd() * 6; p.x = (rnd() - 0.5) * 80; p.z = (rnd() - 0.5) * 80; }
      if (p.x > 40) p.x -= 80;
      M4.compose(V.set(tx + p.x, cy + p.y - 6, tz + p.z), Q, SC.set(1, 1, 1));
      rainMesh.setMatrixAt(i, M4);
    }
    rainMesh.count = n; rainMesh.instanceMatrix.needsUpdate = true;
    // the clouds, drifting over with the wind, darker the heavier the weather
    const nc = inside ? 0 : Math.round(CLOUDS * clamp(W.cloud * 1.2, 0, 1));
    const drift = (st.T * WIND.x * 0.6) % 240;
    let ci = 0;
    for (let k = 0; k < nc; k++) {
      const gx = (hash2(k, 1, 941) - 0.5) * 240, gz = (hash2(k, 2, 941) - 0.5) * 240, x = tx + ((gx + drift + 360) % 240) - 120, z = tz + gz, y = cy + 34 + hash2(k, 3, 941) * 10;
      const w = 18 + hash2(k, 4, 941) * 22, d = 10 + hash2(k, 5, 941) * 14;
      for (const [ox, oz, s, h] of [[0, 0, 1, 3], [w * 0.25, d * 0.2, 0.6, 4.5], [-w * 0.3, -d * 0.15, 0.55, 4]]) {
        M4.compose(V.set(x + ox, y + h * 0.4, z + oz), Q.identity(), SC.set(w * s, h, d * s)); cloudMesh.setMatrixAt(ci++, M4);
      }
    }
    cloudMesh.count = ci; cloudMesh.instanceMatrix.needsUpdate = true;
    const shade = 1 - W.rain * 0.45 - (W.storm ? 0.2 : 0);
    cloudMesh.material.color.setRGB(shade, shade, shade * 1.03);
    // lightning in a storm close by
    if (!inside && W.storm && sp && now > nextStrike) {
      nextStrike = now + 3500 + rnd() * 9000;
      const a = rnd() * 6.283, d = 12 + rnd() * 70, x = tx + Math.cos(a) * d, z = tz + Math.sin(a) * d;
      if (App.isLand(x, z) || rnd() < 0.3) strike(x, z);
    }
    // the tornado's funnel, and the debris spinning round it
    const T = App.tornadoAt();
    if (T && !inside && camD(T.x, T.z) < 450) {
      funnel.visible = true;
      const gy = App.surfaceAt(T.x, T.z).y;
      funnel.position.set(T.x, gy, T.z);
      for (const c of funnel.children) { c.rotation.y += dt * (3 + c.userData.k * 0.25); c.position.x = Math.sin(now / 700 + c.userData.k * 0.5) * c.userData.k * 0.18; }
      if (App.spawnParticle && rnd() < dt * 40) { const a = rnd() * 6.283, r = 2 + rnd() * 4; App.spawnParticle({ kind: "spark", x: T.x + Math.cos(a) * r, y: gy + rnd() * 6, z: T.z + Math.sin(a) * r, vx: -Math.sin(a) * 9, vy: 4 + rnd() * 6, vz: Math.cos(a) * 9, age: 0, life: 1.2, color: new THREE.Color(pick(["#7a4a24", "#2e8b3a", "#9a9a9a", "#c79a62"])) }); }
      const d = camD(T.x, T.z);
      sound(Math.max(W.rain, 0.6), clamp(1 - d / 300, 0.3, 1));
      // live Tickles caught by it
      for (const t of st.tickles) if (t.group.visible && Math.hypot(t.pos.x - T.x, t.pos.z - T.z) < 6 && !(t.action && t.action.kind === "flying") && !App.isKO(t.id)) { const a = rnd() * 6.283; fling(t, Math.cos(a) * 14, Math.sin(a) * 14, 16, "blown away by a tornado"); }
    } else { funnel.visible = false; sound(inside ? 0 : W.rain, inside ? 0 : W.storm ? 0.8 : W.rain * 0.3); }
    // the tsunami's wave, coming in over the last minutes before it breaks
    const ts = App.weatherEvents().tsunami;
    if (ts && !inside && st.T > ts.T0 - 5 && st.T < ts.T0 + 3 && camD(ts.beach.x, ts.beach.z) < 500) {
      const u = clamp((st.T - (ts.T0 - 5)) / 5, 0, 1.4), dist = 160 * (1 - u);
      wave.visible = true;
      wave.position.set(ts.beach.x - ts.ux * dist, App.WATER_Y - 1 + (u > 1 ? -(u - 1) * 18 : Math.sin(u * Math.PI * 0.5) * 2), ts.beach.z - ts.uz * dist);
      wave.rotation.y = Math.atan2(ts.ux, ts.uz);
      if (u > 0.92 && App.spawnParticle) for (let k = 0; k < 6; k++) App.spawnParticle({ kind: "spark", x: wave.position.x + -ts.uz * (rnd() - 0.5) * 140, y: App.WATER_Y + 6, z: wave.position.z + ts.ux * (rnd() - 0.5) * 140, vx: ts.ux * 8, vy: 4 + rnd() * 5, vz: ts.uz * 8, age: 0, life: 1, color: new THREE.Color("#ffffff") });
    } else wave.visible = false;
    // Tickles flying through the air: down again, and knocked out where they land
    for (let i = flung.length - 1; i >= 0; i--) {
      const f = flung[i], t = f.t;
      if (!App.pop.agent[t.id]) { flung.splice(i, 1); continue; }
      const k = Math.min(0.05, dt) * Math.max(1, Math.min(3, st.speed));
      f.vy -= 24 * k; f.x += f.vx * k; f.z += f.vz * k; f.y += f.vy * k; f.spin += k * 12;
      const g = App.surfaceAt(f.x, f.z).y;
      if (f.y <= g && f.vy < 0) { t.pos.set(f.x, g, f.z); t.pivot.rotation.set(0, 0, 0); t.action = null; App.knockOut(t.id, 90, f.why === "swept away by the tsunami" ? "Swept away!" : "Blown away!"); flung.splice(i, 1); continue; }
      t.pos.set(f.x, f.y, f.z); t.group.position.copy(t.pos); t.pivot.rotation.x = -f.spin;
    }
  };
  // a word and a symbol for the clock (ui.js)
  App.weatherIcon = () => {
    if (!here || App.inside) return "";
    if (App.tornadoAt() && camD(App.tornadoAt().x, App.tornadoAt().z) < 500) return "\ud83c\udf2a Tornado!";
    const k = here.kind, night = App.isNight && k === "clear";
    return (night ? "\u263e" : ICON[k]) + " " + NAMES[k];
  };

  // ---------- the panel: the weather in every region, the next hours, warnings ----------
  App.weatherHTML = () => {
    if (!App.regions || !st.wxLog) return "";
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const day = Math.floor(st.T / DAY), ev = eventsOf(day), L = st.wxLog;
    let h = '<div class="card"><h3>Weather</h3><p class="note">Fronts of cloud, rain and storm drift across the map with the wind; every region has its own climate. Tickles shelter at home from storms; lightning splits trees and now and then a roof. Tornadoes come out of storms; very rarely the sea draws back before a tsunami.</p><div class="kv">';
    for (const R of App.regions) {
      const vs = App.villages.filter((v) => v.region === R.i), c = vs.length ? vs.reduce((a, v) => ({ x: a.x + v.x / vs.length, z: a.z + v.z / vs.length }), { x: 0, z: 0 }) : { x: R.cx || 0, z: R.cz || 0 };
      const W = App.weatherAt(c.x, c.z, st.T, R.i), next = [];
      for (let k = 1; k <= 6; k++) next.push(ICON[App.weatherAt(c.x, c.z, st.T + k * 60, R.i).kind]);
      h += '<span class="k">' + esc(R.name) + "</span><span>" + ICON[W.kind] + " " + NAMES[W.kind] + (W.rain > 0 ? " (" + Math.round(W.rain * 100) + "% rain)" : "") + ' <span class="note">next hours: ' + next.join(" ") + "</span></span>";
    }
    h += "</div>";
    const warn = [];
    if (ev.tornado && st.T < ev.tornado.T1 && st.T > ev.tornado.T0 - 120) warn.push((st.T >= ev.tornado.T0 ? "A tornado is crossing " : "Tornado warning for ") + esc(ev.tornado.name) + (st.T < ev.tornado.T0 ? " this afternoon, near " + esc(App.villages[ev.tornado.near].name) : ""));
    if (ev.tsunami && st.T >= ev.tsunami.warn && st.T < ev.tsunami.T0 + 30) warn.push("Tsunami on the coast of " + esc(ev.tsunami.name) + (st.T < ev.tsunami.T0 ? ": the sea is drawing back" : ""));
    if (warn.length) h += '<p class="note"><b>' + warn.join(". ") + ".</b></p>";
    const pl = (n, one, many) => n + " " + (n === 1 ? one : many);
    h += '<p class="note">So far: ' + pl(L.tornadoes, "tornado", "tornadoes") + ", " + pl(L.tsunamis, "tsunami", "tsunamis") + ", " + pl(L.strikes, "lightning strike", "lightning strikes") + " seen, " + pl(L.ruined, "building", "buildings") + " wrecked by the weather, " + pl(L.blown, "Tickle", "Tickles") + " blown off their feet.</p></div>";
    return h;
  };
})();
