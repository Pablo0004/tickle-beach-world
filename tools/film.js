/* The film: a director's script that shows the whole game in under three minutes (asked 11 November, for the
 * TickleBedge account). Not part of the game. Load it in a browser with the game running (film.html, served by
 * tests/serve.py, has the audio tap loaded first):
 *   const s = document.createElement("script"); s.src = "tools/film.js"; document.head.appendChild(s);
 * then FILM.run() records every scene in order, FILM.run(["war", "casino"]) only those, FILM.preview("war") sets a
 * scene up and plays its camera without recording, FILM.stop() stops. FILM.status says where it is.
 * The recording: the game's canvas (nothing of the HUD: no menus, tags, bubbles or controls), 1920x1080 at 30 frames
 * a second, MP4, with a title and fades drawn over it, sent in chunks to the dev server, which writes film/<name>.mp4.
 * The browser pane must stay on view while it records (hidden, the game stops drawing). See tools/FILM.md. */
(function () {
  "use strict";
  const App = window.App, st = App.st, DAY = 1440, cam = App.cam;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const FILM = (window.FILM = { W: 1920, H: 1080, fps: 30, bitrate: 12e6, status: "idle", log: [], scene: null, bytes: 0, name: null, fixed: false });
  const log = (m) => { FILM.log.push(new Date().toISOString().slice(11, 19) + " " + m); if (FILM.log.length > 200) FILM.log.shift(); console.log("[film] " + m); };

  // ---------- the picture: a fixed 1920x1080 whatever the pane's size, the HUD left out ----------
  const out = document.createElement("canvas"); out.width = FILM.W; out.height = FILM.H;
  const ox = out.getContext("2d");
  const resize0 = App.resize;
  function fix() {
    const r = App.renderer;
    r.setPixelRatio(1); r.setSize(FILM.W, FILM.H, false);
    App.camera.aspect = FILM.W / FILM.H; App.camera.updateProjectionMatrix();
    FILM.fixed = true;
  }
  App.resize = () => { if (FILM.fixed) fix(); else resize0(); };
  function unfix() { FILM.fixed = false; resize0(); }
  // what is drawn over the picture: a fade to black, the scene's title, the big titles at the start and the end
  const ov = { black: 0, title: null, sub: null, titleA: 0, big: null, bigA: 0 };
  function drawOverlay() {
    const W = FILM.W, H = FILM.H;
    if (ov.title && ov.titleA > 0.01) {
      ox.save(); ox.globalAlpha = ov.titleA;
      ox.font = "600 40px system-ui, Segoe UI, sans-serif"; ox.textBaseline = "alphabetic";
      const tw = ox.measureText(ov.title).width;
      ox.fillStyle = "rgba(0,0,0,0.45)"; ox.fillRect(64, H - 150, tw + 54, 74);
      ox.fillStyle = "#ffd23f"; ox.fillRect(64, H - 150, 8, 74);
      ox.fillStyle = "#ffffff"; ox.fillText(ov.title, 94, H - 100);
      if (ov.sub) { ox.font = "500 24px system-ui, Segoe UI, sans-serif"; ox.fillStyle = "rgba(255,255,255,0.85)"; ox.fillText(ov.sub, 94, H - 56); }
      ox.restore();
    }
    if (ov.big && ov.bigA > 0.01) {
      ox.save(); ox.globalAlpha = ov.bigA; ox.textAlign = "center";
      ox.shadowColor = "rgba(0,0,0,0.8)"; ox.shadowBlur = 24;
      ox.font = "900 118px system-ui, Segoe UI, sans-serif"; ox.fillStyle = "#ffd23f"; ox.fillText(ov.big[0], W / 2, H / 2 - 10);
      ox.font = "600 40px system-ui, Segoe UI, sans-serif"; ox.fillStyle = "#ffffff"; ox.fillText(ov.big[1], W / 2, H / 2 + 60);
      ox.restore();
    }
    if (ov.black > 0.005) { ox.fillStyle = "rgba(0,0,0," + Math.min(1, ov.black) + ")"; ox.fillRect(0, 0, W, H); }
  }
  let looping = false;
  function loop() {
    if (!looping) return;
    try { ox.drawImage(App.renderer.domElement, 0, 0, FILM.W, FILM.H); drawOverlay(); } catch (e) { /* a frame lost */ }
    requestAnimationFrame(loop);
  }
  async function fadeTo(v, secs) { const a = ov.black, t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { ov.black = a + (v - a) * ((performance.now() - t0) / (secs * 1000)); await sleep(16); } ov.black = v; }
  async function titleTo(v, secs) { const a = ov.titleA, t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { ov.titleA = a + (v - a) * ((performance.now() - t0) / (secs * 1000)); await sleep(16); } ov.titleA = v; }
  async function bigTo(v, secs) { const a = ov.bigA, t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { ov.bigA = a + (v - a) * ((performance.now() - t0) / (secs * 1000)); await sleep(16); } ov.bigA = v; }

  // ---------- the recorder: the picture (and the game's sound, through film-hook.js) to film/<name>.mp4 ----------
  const rec = { mr: null, queue: Promise.resolve(), mix: null };
  function audioTrack() {
    const taps = window.__filmAudio;
    if (!taps) return null;
    const ac = new (window.AudioContext || window.webkitAudioContext)(), dst = ac.createMediaStreamDestination();
    const add = (s) => { try { ac.createMediaStreamSource(s).connect(dst); } catch (e) { log("audio tap: " + e.message); } };
    taps.streams.forEach(add); taps.onNew = add;
    rec.mix = ac;
    return dst.stream.getAudioTracks()[0] || null;
  }
  function startRec(name) {
    FILM.name = name; FILM.bytes = 0;
    const stream = out.captureStream(FILM.fps), au = audioTrack();
    if (au) stream.addTrack(au);
    const mime = ['video/mp4;codecs="avc1.640028,mp4a.40.2"', "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9"].find((m) => MediaRecorder.isTypeSupported(m));
    FILM.mime = mime;
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: FILM.bitrate, audioBitsPerSecond: 160000 });
    mr.ondataavailable = (e) => { if (e.data && e.data.size) upload(e.data); };
    mr.onerror = (e) => log("recorder error " + (e.error && e.error.message));
    mr.start(4000);
    rec.mr = mr;
    return fetch("/film/" + name, { method: "DELETE" }).catch(() => {});
  }
  function upload(blob) {
    rec.queue = rec.queue.then(() => fetch("/film/" + FILM.name, { method: "POST", body: blob }).then((r) => r.json()).then((j) => { FILM.bytes = j.size; })).catch((e) => log("upload: " + e.message));
  }
  async function stopRec() {
    const mr = rec.mr;
    if (!mr) return;
    rec.mr = null;
    if (mr.state !== "inactive") await new Promise((res) => { mr.onstop = res; mr.stop(); });
    await rec.queue;
    if (rec.mix) { try { rec.mix.close(); } catch (e) { /* closed */ } rec.mix = null; }
  }
  const pauseRec = () => { if (rec.mr && rec.mr.state === "recording") rec.mr.pause(); };
  const resumeRec = () => { if (rec.mr && rec.mr.state === "paused") rec.mr.resume(); };

  // ---------- the camera: a controller runs every frame after the game's own camera code ----------
  let ctrl = null;
  const move0 = App.moveCamera;
  App.moveCamera = (dt, keys) => { move0(dt, keys); if (ctrl) { try { ctrl(dt); } catch (e) { log("camera: " + e.message); ctrl = null; } } };
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerpA = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * u; };
  const groundY = (x, z) => Math.max(App.WATER_Y, App.surfaceAt(x, z).y) + 1;
  // the camera put somewhere at once (the world loads round it)
  function at(x, z, r, phi, th) { cam.follow = null; cam.fly = null; cam.target.set(x, groundY(x, z), z); cam.radius = r; cam.phi = phi; cam.theta = th; }
  // a move from A to B over the shot, eased: { x, z, r, phi, th, y? }
  function move(A, B, secs) {
    const t0 = performance.now();
    return () => {
      const u = ease((performance.now() - t0) / 1000 / secs);
      cam.fly = null; cam.follow = null;
      cam.target.x = lerp(A.x, B.x, u); cam.target.z = lerp(A.z, B.z, u);
      if (A.y != null) cam.target.y = lerp(A.y, B.y != null ? B.y : A.y, u);
      cam.radius = lerp(A.r, B.r, u); cam.phi = lerp(A.phi, B.phi, u); cam.theta = lerpA(A.th, B.th, u);
    };
  }
  // round a point, the view turning slowly (dth over the shot), the distance and the height easing from A to B
  function orbit(c, A, B, secs) { return move(Object.assign({ x: c.x, z: c.z, y: c.y }, A), Object.assign({ x: c.x, z: c.z, y: c.y }, B), secs); }
  // behind someone who moves: the target follows it, the view set
  function follow(getT, o) {
    return () => { const t = getT(); if (!t) return; cam.fly = null; cam.follow = null; cam.target.x += (t.pos.x - cam.target.x) * 0.2; cam.target.z += (t.pos.z - cam.target.z) * 0.2; cam.radius = o.r; cam.phi = o.phi; if (o.th != null) cam.theta = o.th; else if (o.dth) cam.theta += o.dth / 60; };
  }
  // inside: room coordinates (interiors.js keeps the view relative to where the world's camera was)
  function inMove(A, B, secs) {
    const t0 = performance.now();
    return () => {
      const I = App.inside; if (!I || !I.worldCam) return;
      const u = ease((performance.now() - t0) / 1000 / secs), w = I.worldCam, f = I.focus || { x: 0, z: 0 };
      cam.fly = null; cam.follow = null;
      cam.target.x = w.x + lerp(A.x, B.x, u) - f.x; cam.target.z = w.z + lerp(A.z, B.z, u) - f.z;
      cam.radius = lerp(A.r, B.r, u); cam.phi = lerp(A.phi, B.phi, u); cam.theta = lerpA(A.th, B.th, u);
    };
  }
  // inside, following whoever the room follows (a party watched): only the distance and the turn
  function inOrbit(A, B, secs) {
    const t0 = performance.now();
    return () => { const u = ease((performance.now() - t0) / 1000 / secs); cam.radius = lerp(A.r, B.r, u); cam.phi = lerp(A.phi, B.phi, u); cam.theta = lerpA(A.th, B.th, u); };
  }

  // ---------- the clock, the weather, the world's readiness ----------
  // today at hh:mm; if that is earlier than now, tomorrow (the day's plans stay whole)
  function clock(hm) {
    const [h, m] = hm.split(":").map(Number), day = Math.floor(st.T / DAY), mm = h * 60 + m, now = st.T - day * DAY;
    st.T = (mm < now - 2 ? day + 1 : day) * DAY + mm;
  }
  const weather0 = App.weatherAt;
  FILM.wx = { n: 0.3, rain: 0, storm: false, cloud: 0.1, fog: 0, kind: "clear" }; // clear skies for the film unless a scene wants its own
  App.weatherAt = (x, z, T, r) => (FILM.wx ? FILM.wx : weather0(x, z, T, r));
  // the land, the models and the people round the view: wait for them (two seconds at least, eight at most)
  async function ready(max) {
    const t0 = performance.now();
    await sleep(1800);
    while (performance.now() - t0 < (max || 8) * 1000) { if ((!App.jobsPending || App.jobsPending() === 0) && (!App.pop.pending || App.pop.pending.size === 0) && performance.now() - t0 > 2500) break; await sleep(150); }
  }
  async function until(fn, max) { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > max * 1000) return false; await sleep(100); } return true; }
  async function leave() { if (App.fpOn && App.fpOn()) { App.keys.clear(); App.exitFP(); } if (App.inside) { App.leaveInterior(); await sleep(800); } }
  function enter(T, opt) { App.enter(T, opt); return sleep(1600); }
  const near = (list, x, z) => list.filter(Boolean).slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const agentsNear = (x, z, R) => st.tickles.filter((t) => Math.hypot(t.pos.x - x, t.pos.z - z) < R);
  const inR = (list, r) => (list || []).find((o) => o && o.region === r) || (list || []).find(Boolean);

  // ---------- the cast: the places the film uses ----------
  function cast() {
    const V = App.villages;
    const fort = V.find((v) => v.walls && v.kind === "citadel" && v.residents.length > 200) || V.find((v) => v.walls);
    const foe = near(V.filter((v) => v !== fort && v.walls && v.holder && v.kind !== "town"), fort.x, fort.z) || near(V.filter((v) => v !== fort && v.holder && v.kind !== "town" && v.residents.length >= 30), fort.x, fort.z);
    const town = near(V.filter((v) => v.kind === "town" && v.residents.length >= 40), fort.x, fort.z);
    const keep = near(V.filter((v) => v !== fort && v.walls && v.residents.length >= 90), fort.x, fort.z) || foe;
    const R = fort.region;
    return { fort, foe, town, keep, R, arena: inR(App.arenas, R), mine: inR(App.mines, R), lair: inR(App.lairs, R), dock: inR(App.docks, R), casino: inR(App.casinos, R), gq: inR(App.guildQuarters, R), smithy: inR(App.smithies, R), ether: inR(App.etherFields, R) };
  }
  let C = null;

  // ---------- the scenes, in the order they are shot (the clock only goes forward through the day) ----------
  // Each: id, title (and sub), secs (the length of the shot, fades included), setup (the world and the camera's start),
  // cam (the controller for the shot), after (optional). A setup that throws skips the scene.
  const SCENES = [
    { id: "intro", title: null, secs: 8, big: ["TICKLE BEACH WORLD", "All 9,629 Tickles, alive on one island"],
      setup: async () => { await leave(); clock("06:50"); at(0, 0, 430, 0.95, -2.3); cam.target.y = App.WATER_Y + 1; await ready(10); },
      cam: () => orbit({ x: 0, z: 0, y: App.WATER_Y + 1 }, { r: 430, phi: 0.95, th: -2.3 }, { r: 330, phi: 1.02, th: -1.75 }, 8) },
    { id: "statue", title: "The Maker's Isle", sub: "The statue of the one who made them, in the middle of the great lake", secs: 5,
      setup: async () => { clock("07:05"); at(0, 0, 34, 1.08, 2.6); await ready(); },
      cam: () => orbit({ x: 0, z: 0 }, { r: 34, phi: 1.08, th: 2.6 }, { r: 26, phi: 1.0, th: 3.4 }, 5) },
    { id: "castle", title: "Inside a holder's castle", sub: "The great hall, the kitchen, the training rooms, the treasury; the bedrooms upstairs", secs: 6,
      setup: async () => { clock("07:15"); const d = C.fort.hall.door || C.fort.hall; at(d.x, d.z, 40, 1.0, 0); await ready(); const T = App.enterableAt(d.x, d.z); if (!T || T.shut) throw new Error("castle door"); await enter(T); await sleep(900); },
      cam: () => { const R = App.inside && App.inside.map.rooms[0]; const w = R ? R.w : 40; return inMove({ x: -w * 0.18, z: 2, r: 28, phi: 0.95, th: 0.35 }, { x: w * 0.18, z: -2, r: 24, phi: 0.9, th: -0.35 }, 6); },
      after: leave },
    { id: "town", title: "A town wakes up", sub: "A house for every household, jobs, chores, friends: a whole life, whether you watch or not", secs: 6,
      setup: async () => { clock("07:50"); const v = C.town; at(v.x, v.z, 30, 1.02, 0.6); await ready(); },
      cam: () => { const v = C.town; return move({ x: v.x - 10, z: v.z + 6, r: 30, phi: 1.02, th: 0.6 }, { x: v.x + 8, z: v.z - 4, r: 26, phi: 0.98, th: 1.1 }, 6); } },
    { id: "dock", title: "The great lake", sub: "Ferries to the other islands, rowing boats, fishers, pilgrims' launches", secs: 6,
      setup: async () => { clock("08:40"); const D = C.dock; at(D.x + D.ux * 10, D.z + D.uz * 10, 44, 1.05, Math.atan2(-D.ux, -D.uz) + 0.7); await ready(); },
      cam: () => { const D = C.dock, th = Math.atan2(-D.ux, -D.uz); return move({ x: D.x + D.ux * 10, z: D.z + D.uz * 10, r: 44, phi: 1.05, th: th + 0.7 }, { x: D.x + D.ux * 22, z: D.z + D.uz * 22, r: 38, phi: 1.0, th: th + 1.3 }, 6); } },
    { id: "rod", title: "Fishing", sub: "A fish on the line, food for the granary", secs: 6,
      setup: async () => {
        clock("09:30");
        // a pier with two to four fishers at their spots and little else about
        const day = Math.floor(st.T / DAY), spots = new Map();
        for (const v of App.villages) for (const id of v.residents) {
          if (App.jobOf(id) !== "fisher" || App.isKO(id)) continue;
          const s = App.planOf(id, day).steps.find((q) => q.k === "job");
          if (!s || !s.p || s.p.boat || !/pier|beach/i.test(s.p.label || "")) continue;
          const p = App.planPos(id, st.T);
          if (Math.hypot(p.x - s.p.x, p.z - s.p.z) > 3) continue;
          const k = s.p.label; if (!spots.has(k)) spots.set(k, { ids: [], p: s.p }); spots.get(k).ids.push(id);
        }
        const all = [];
        for (let id = 0; id < TB.SUPPLY; id += 3) { const p = App.planPos(id, st.T); if (!p.inside) all.push([p.x, p.z]); } // (one in three: enough to tell a crowd)
        let best = null;
        for (const S of spots.values()) {
          if (S.ids.length < 2 || S.ids.length > 4) continue;
          const crowd = all.filter(([x, z]) => Math.hypot(x - S.p.x, z - S.p.z) < 22).length * 3 - S.ids.length;
          if (!best || crowd < best.crowd) best = { S, crowd };
        }
        if (!best) throw new Error("no quiet pier");
        const S = best.S, p = S.p, th = Math.atan2(p.x - (p.cx != null ? p.cx : p.x), p.z - (p.cz != null ? p.cz : p.z));
        FILM.rod = { p, th, ids: S.ids, crowd: best.crowd };
        at(p.x, p.z, 14, 1.12, th + 1.0);
        await ready();
        const t = st.tickles.find((q) => S.ids.includes(q.id) && q.fishGear) || st.tickles.find((q) => S.ids.includes(q.id));
        if (!t) throw new Error("no fisher in view");
        FILM.rod.t = t; t.forceCatch = true;
        // the shot starts a moment before the pull of its rod (sim.js: one cast every 6.25 s, the fish up at 0.07 of it)
        const ph = t.id * 0.7, c = () => (performance.now() / 1000 * 0.16 + ph) % 1;
        await until(() => c() > 0.55 && c() < 0.6, 8);
      },
      cam: () => { const R = FILM.rod, t = R.t; return move({ x: t.pos.x, z: t.pos.z, r: 15, phi: 1.12, th: R.th + 1.1 }, { x: t.pos.x, z: t.pos.z, r: 11, phi: 1.08, th: R.th + 0.75 }, 6); } },
    { id: "fortress", title: "A fortress", sub: "Walls and towers, gates that shut at night, an armoury, catapults, griffins on patrol", secs: 6,
      setup: async () => { clock("10:00"); const v = C.fort, w = v.walls; at(w.x, w.z, 100, 0.95, 0.4); await ready(); },
      cam: () => { const w = C.fort.walls; return orbit({ x: w.x, z: w.z }, { r: 100, phi: 0.95, th: 0.4 }, { r: 72, phi: 1.0, th: 1.1 }, 6); } },
    { id: "smithy", title: "The Guild Quarter and the Blacksmiths' Guild", sub: "Six guilds with ranks, a forge, horses for sale and a griffin roost", secs: 5,
      setup: async () => { clock("10:20"); const s = C.smithy; at(s.x, s.z, 36, 1.0, s.rot + 2.6); await ready(); },
      cam: () => { const s = C.smithy; return orbit({ x: s.x, z: s.z }, { r: 36, phi: 1.0, th: s.rot + 2.6 }, { r: 28, phi: 1.05, th: s.rot + 3.4 }, 5); } },
    { id: "griffin", title: "First person", sub: "See through your Tickle's eyes: here, flying its griffin over the castle", secs: 7,
      setup: async () => {
        clock("10:40"); const v = C.fort; at(v.x, v.z, 40, 1.0, 0); await ready();
        const rider = st.tickles.find((t) => { const M = App.mountOf && App.mountOf(t.id); return M && M.fly && !App.isKO(t.id) && !t.riding && t.group.visible; });
        if (!rider) throw new Error("no griffin rider in view");
        st.mode = "manual"; App.enterFP(rider.id); await sleep(700);
        App.keys.add("KeyM"); await sleep(350); App.keys.delete("KeyM"); await sleep(500);
        const a = rider.action; if (!a || !a.ride) throw new Error("did not mount");
        App.keys.add("Space"); App.keys.add("KeyW"); FILM.rider = rider;
        await sleep(1600);
      },
      cam: () => { const t0 = performance.now(); return () => { App.fpLook(0.9, performance.now() - t0 < 3500 ? -0.25 : 0.2); if (performance.now() - t0 > 4000) App.keys.delete("Space"); }; },
      after: async () => { App.keys.clear(); await leave(); } },
    { id: "dive", title: "Diving", sub: "Down with a diver to the wrecks, the reefs and the pearl beds", secs: 6,
      setup: async () => {
        clock("11:20"); const s = near(App.diveSites.filter((q) => q.kind === "pearls" || q.kind === "wreck"), C.dock.x, C.dock.z) || App.diveSites[0];
        at(s.shore.x, s.shore.z, 22, 1.0, Math.atan2(s.shore.x - s.x, s.shore.z - s.z)); await ready();
        const t = agentsNear(s.shore.x, s.shore.z, 60).filter((q) => !App.isKO(q.id) && !(q.action && q.action.kind === "fp"))[0];
        if (!t) throw new Error("nobody to dive");
        App.endAction(t); t.pos.x = s.shore.x; t.pos.z = s.shore.z; App.startDiveAt(t, s.i, st.T + 60);
        cam.follow = t.id; cam.radius = 13; cam.phi = 0.9; FILM.diver = t;
        await until(() => t.pos.y < App.WATER_Y - 1.2, 40);
      },
      cam: () => () => { cam.follow = FILM.diver.id; cam.theta += 0.004; } },
    { id: "spear", title: "Spearfishing", sub: "A harpoon for the fish of the reefs, in first person", secs: 6,
      setup: async () => {
        clock("11:40");
        const reef = App.diveSites.find((s) => /Painted Reef/.test(s.name)) || App.diveSites.find((s) => s.kind === "reef");
        at(reef.x, reef.z, 20, 1.0, 0); await ready();
        const t = FILM.diver && st.tickles.includes(FILM.diver) ? FILM.diver : st.tickles.find((q) => !App.isKO(q.id));
        if (!t) throw new Error("nobody to spear");
        await leave(); App.endAction(t);
        t.pos.x = reef.x + 2; t.pos.z = reef.z + 2; t.pos.y = App.WATER_Y - 0.7;
        cam.target.set(reef.x, App.WATER_Y, reef.z);
        st.mode = "manual"; await sleep(1200); App.enterFP(t.id); await sleep(600);
        App.keys.add("KeyC"); await sleep(2400); App.keys.delete("KeyC");
        // beside the nearest school, looking at one of its fish
        const ey = () => t.pos.y + (t.height || 3) * 0.8;
        const far = App.seaFishNear(t.pos.x, ey(), t.pos.z, 80);
        if (!far.length) throw new Error("no fish");
        const f0 = far[0], ang = Math.atan2(f0.x - t.pos.x, f0.z - t.pos.z);
        t.pos.x = f0.x - Math.sin(ang) * 6; t.pos.z = f0.z - Math.cos(ang) * 6; t.pos.y = Math.max(App.seaFloorY(t.pos.x, t.pos.z) + 0.7, f0.y - 1.6);
        cam.target.set(t.pos.x, t.pos.y, t.pos.z);
        await sleep(1200);
        FILM.spear = { t, aim: () => { const q = App.seaFishNear(t.pos.x, ey(), t.pos.z, 9)[0]; if (!q) return null; t.heading = Math.atan2(q.x - t.pos.x, q.z - t.pos.z); const dd = Math.hypot(q.x - t.pos.x, q.z - t.pos.z), pitch = Math.atan2(q.y - ey(), dd); App.fpLook(0, 0); return pitch; }, done: false };
        const p = FILM.spear.aim(); if (p == null) throw new Error("no fish near");
        FILM.spear.pitch = p;
      },
      cam: () => {
        const S = FILM.spear, t = S.t, t0 = performance.now(); let thrown = false;
        return () => {
          const u = (performance.now() - t0) / 1000;
          if (!thrown) { const p = S.aim(); if (p != null) { App.fpLook(0, 0); /* heading set by aim */ } }
          if (!thrown && u > 2.2) { thrown = true; t.forceHit = true; window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyB", key: "b" })); }
        };
      },
      after: async () => { App.keys.clear(); await leave(); } },
    { id: "seacave", title: "A sea cave", sub: "Only a diver finds the way in: dark blue stone, torches, treasure", secs: 4,
      setup: async () => { const c = near(App.seaCaves, C.dock.x, C.dock.z); await enter({ kind: "seacave", cave: c, door: c.door, name: c.name }); await sleep(600); },
      cam: () => inMove({ x: 0, z: 6, r: 30, phi: 1.0, th: 0.3 }, { x: 0, z: -4, r: 26, phi: 0.95, th: -0.4 }, 4), after: leave },
    { id: "kraken", title: "Sea beasts", sub: "A Kraken from the open sea, the Lake Serpent from the lake: the villages run to fight them", secs: 7,
      setup: async () => {
        await leave(); clock("12:10");
        const r = 5, v = App.villages.filter((o) => o.region === r).sort((a, b) => b.residents.length - a.residents.length)[0];
        const b = App.seaBeach(v.x, v.z, 520, r) || App.seaBeach(v.x, v.z, 780, r);
        if (!b) throw new Error("no beach");
        const ux = (b.cx - b.x), uz = (b.cz - b.z), L = Math.hypot(ux, uz) || 1, F = { x: b.x + ux / L * 13, z: b.z + uz / L * 13 };
        at(b.x + ux / L * 4, b.z + uz / L * 4, 30, 1.12, Math.atan2(-ux, -uz)); await ready();
        const day = Math.floor(st.T / DAY), def = [];
        for (const q of App.villages) if (Math.hypot(q.x - F.x, q.z - F.z) < 240) for (const id of q.residents) { if (def.length >= 5) break; if (App.isKO(id) || App.isDead(id) || !App.combatRole(id)) continue; def.push(id); }
        const a = { id: "film" + day + Math.floor(st.T), day, kind: "kraken", r, t0: st.T + 1.5, t1: st.T + 70, hp: 1600, max: 1600, def, done: false, live: false, dealt: {} };
        st.seaAttacks.push(a);
        for (const id of def) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && !t.action.order && t.action.kind !== "ko") App.endAction(t); }
        FILM.kraken = { F, th: Math.atan2(-ux, -uz), b: { x: b.x + ux / L * 4, z: b.z + uz / L * 4 } };
        await until(() => a.live, 12); await sleep(3500);
      },
      cam: () => { const K = FILM.kraken; return move({ x: K.b.x, z: K.b.z, r: 30, phi: 1.14, th: K.th - 0.35 }, { x: K.F.x, z: K.F.z, r: 24, phi: 1.1, th: K.th + 0.35 }, 7); } },
    { id: "dragon", title: "Dragons", sub: "Each island's dragon sleeps on its peak and flies a patrol", secs: 5,
      setup: async () => { clock("12:40"); const L = C.lair; at(L.x, L.z, 30, 1.1, 0.5); cam.target.y = L.h + 2; await ready(); },
      cam: () => { const L = C.lair; return orbit({ x: L.x, z: L.z, y: L.h + 2 }, { r: 30, phi: 1.12, th: 0.5 }, { r: 22, phi: 1.05, th: 1.4 }, 5); } },
    { id: "rampage", title: "...and some days it attacks", sub: "Swords, spears, spells and creatures against it, together", secs: 8,
      setup: async () => {
        const L = C.lair, d = App.dragonObjects.get(L.i);
        if (!d) throw new Error("no dragon object");
        const v = near(App.villages.filter((o) => o.residents.length >= 20 && Math.hypot(o.x - L.x, o.z - L.z) < 400), L.x, L.z) || App.nearestVillage(L.x, L.z);
        clock("12:55"); at(v.x, v.z, 36, 1.0, 0.8); await ready();
        d.x = v.x + 6; d.z = v.z + 4; d.y = App.surfaceAt(d.x, d.z).y;
        if (!App.startRampage(d)) throw new Error("rampage refused");
        FILM.rampage = { v, d }; await sleep(2500);
      },
      cam: () => { const R = FILM.rampage; return follow(() => R.d.rampage ? { pos: { x: R.d.x, z: R.d.z } } : null, { r: 34, phi: 1.02, dth: 0.25 }); } },
    { id: "hunt", title: "Hunting", sub: "Deer and boar for the granary", secs: 6,
      setup: async () => {
        clock("14:15");
        let best = null;
        for (const v of App.villages) { if (!v.hunt || v.hunt.poi < 0) continue; const hs = v.residents.filter((id) => App.choreOf(id) === "hunt" && App.doesChores(id) && !App.isKO(id)); if (hs.length >= 2 && (!best || hs.length > best.hs.length)) best = { v, hs }; }
        if (!best) throw new Error("no hunters");
        const g = best.v.hunt; at(g.x, g.z, 26, 1.05, 0.3); await ready(6);
        FILM.hunt = { g, ids: best.hs };
        await until(() => st.tickles.some((t) => FILM.hunt.ids.includes(t.id) && Math.hypot(t.pos.x - g.x, t.pos.z - g.z) < 30), 10);
      },
      cam: () => { const H = FILM.hunt; return follow(() => st.tickles.find((t) => H.ids.includes(t.id)) || { pos: H.g }, { r: 18, phi: 1.08, dth: 0.2 }); } },
    { id: "surf", title: "Contests", sub: "Surfing, karts, foot races, fishing, regattas, strongest Tickle, fashion, song", secs: 6,
      setup: async () => {
        clock("15:25"); const day = Math.floor(st.T / DAY);
        let c = null; for (const k in st.contests) { const q = st.contests[k]; if (q && q.day === day && q.kind === "surf") c = q; }
        if (!c) throw new Error("no surf contest today");
        const Vn = App.contestVenue(c.region, "sea"); if (!Vn) throw new Error("no sea venue");
        const D = Vn.D, th = Math.atan2(-D.ux, -D.uz);
        at(D.x + D.ux * 6, D.z + D.uz * 6, 32, 1.12, th + 0.4); await ready();
        FILM.surf = { D, th };
      },
      cam: () => { const S = FILM.surf, D = S.D; return move({ x: D.x + D.ux * 6, z: D.z + D.uz * 6, r: 32, phi: 1.12, th: S.th + 0.4 }, { x: D.x + D.ux * 10, z: D.z + D.uz * 10, r: 26, phi: 1.08, th: S.th - 0.3 }, 6); } },
    { id: "parliament", title: "The Parliament", sub: "The holders' ministers sit every afternoon and vote the laws", secs: 4,
      setup: async () => { clock("16:20"); const P = App.parliament; at(P.door.x, P.door.z, 40, 1.0, 0); await ready(); await enter({ kind: "parliament", parliament: P, door: P.door }); await sleep(500); },
      cam: () => inMove({ x: -6, z: 8, r: 36, phi: 0.9, th: 0.3 }, { x: 4, z: 2, r: 30, phi: 0.85, th: -0.2 }, 4), after: leave },
    { id: "dungeon", title: "The Great Underworld", sub: "Twelve floors under the whole island, a guardian on each; parties go down for relics", secs: 7,
      setup: async () => {
        clock("15:50");
        const live = App.liveParties();
        const pick = live.find((L) => L.S.kind === "guardian") || live[0];
        if (pick) { App.watchParty(pick.key); await sleep(1800); }
        else { const dg = C.fort ? near(App.dungeons, C.fort.x, C.fort.z) : App.dungeons[0]; await enter({ kind: "dungeon", dg, door: dg.door }); }
        FILM.dungeon = { watched: !!pick };
      },
      cam: () => inOrbit({ r: 26, phi: 0.85, th: 0.4 }, { r: 20, phi: 0.8, th: -0.5 }, 7), after: leave },
    { id: "siege", title: "War between holders", sub: "Armies of fifty, a siege at the gate: the ram, the catapults, the archers on the walls", secs: 8,
      setup: async () => {
        clock("14:30"); await leave();
        const w = App.debugWar(C.foe.i, C.fort.i);
        if (!w) throw new Error("no war");
        FILM.war = w;
        st.T = w.bt.arrive - 1.5;
        const F = w.front, th = Math.atan2(-F.ux, -F.uz);
        at(F.x - F.ux * 4, F.z - F.uz * 4, 40, 1.05, th); await ready(10);
        await sleep(3000);
      },
      cam: () => { const F = FILM.war.front, th = Math.atan2(-F.ux, -F.uz); return move({ x: F.x - F.ux * 6, z: F.z - F.uz * 6, r: 40, phi: 1.06, th: th - 0.5 }, { x: F.x + F.ux * 2, z: F.z + F.uz * 2, r: 30, phi: 1.0, th: th + 0.3 }, 8); } },
    { id: "walls", title: "Griffin riders fly over the walls", sub: "Cavalry, mages, healers, tamers with their creatures; stars decide the spoils", secs: 7,
      setup: async () => { await sleep(300); const w = FILM.war; if (!w || w.status !== "on") throw new Error("war over"); },
      cam: () => { const w = FILM.war; const fly = () => st.tickles.find((t) => t.riding && t.riding.fly && (t.riding.alt || 0) > 1.5 && Math.hypot(t.pos.x - w.front.x, t.pos.z - w.front.z) < 90) || { pos: { x: w.front.gx != null ? w.front.gx : w.front.x, z: w.front.gz != null ? w.front.gz : w.front.z } }; return follow(fly, { r: 20, phi: 1.0, dth: 0.3 }); } },
    { id: "tame", title: "Taming", sub: "Seven kinds of wild creature, won over with a snack and raised for the arena", secs: 6,
      setup: async () => {
        clock("17:00"); const day = Math.floor(st.T / DAY);
        let spot = null, who = [];
        for (const v of App.villages) { for (const id of v.residents) { const P = App.planOf(id, day), L = P.steps.find((s) => s.k === "leisure" && s.taming); if (L) { if (!spot) spot = L.p; if (Math.hypot(L.p.x - spot.x, L.p.z - spot.z) < 10) who.push(id); } } if (who.length >= 2) break; }
        if (!spot) throw new Error("no tamer today");
        at(spot.x, spot.z, 24, 1.05, 0.5); await ready(6); FILM.tame = { spot, who };
      },
      cam: () => { const T = FILM.tame; return follow(() => st.tickles.find((t) => T.who.includes(t.id)) || { pos: T.spot }, { r: 18, phi: 1.06, dth: 0.25 }); } },
    { id: "arena", title: "The arena", sub: "A creature tournament every evening, the whole island in the stands", secs: 7,
      setup: async () => { clock("17:42"); const a = C.arena; at(a.x, a.z, 40, 0.95, a.rot + 2.4); await ready(); await until(() => { const tr = st.tourneys[Math.floor(st.T / DAY) + ":" + a.region]; return tr && tr.current; }, 12); await sleep(1500); },
      cam: () => { const a = C.arena; return orbit({ x: a.x, z: a.z }, { r: 40, phi: 0.95, th: a.rot + 2.4 }, { r: 20, phi: 1.02, th: a.rot + 3.3 }, 7); } },
    { id: "ether", title: "Ether fields", sub: "Crystals that power the creatures' magic", secs: 4,
      setup: async () => { clock("18:50"); const f = C.ether; at(f.x, f.z, 24, 1.1, 0); await ready(); },
      cam: () => { const f = C.ether; return orbit({ x: f.x, z: f.z }, { r: 24, phi: 1.12, th: 0 }, { r: 20, phi: 1.05, th: 0.8 }, 4); } },
    { id: "casino", title: "The casino", sub: "Poker, blackjack, roulette, bingo and the slots, open from seven", secs: 7,
      setup: async () => {
        clock("19:40"); const Cs = C.casino; at(Cs.x, Cs.z, 40, 1.0, 0); await ready();
        const T = { kind: "casino", casino: Cs, door: Cs.door }, map = App.mapOf(T);
        let ri = 0, best = -1;
        map.rooms.forEach((R, i) => { const n = (App.casinoOccupants ? App.casinoOccupants(Cs, i) : []).length; if (i > 0 && n > best) { best = n; ri = i; } });
        await enter(T, { floor: ri }); await sleep(600); FILM.casino = { ri };
      },
      cam: () => inMove({ x: -8, z: 6, r: 30, phi: 0.95, th: 0.5 }, { x: 6, z: -2, r: 24, phi: 0.9, th: -0.3 }, 7), after: leave },
    { id: "fire", title: "Dinner by the fire", sub: "Every evening, the whole place round the square's fire", secs: 6,
      setup: async () => { clock("20:40"); const v = C.keep; at(v.x, v.z, 26, 1.1, 0.4); await ready(); },
      cam: () => { const v = C.keep; return orbit({ x: v.x, z: v.z }, { r: 26, phi: 1.12, th: 0.4 }, { r: 20, phi: 1.05, th: 1.2 }, 6); } },
    { id: "song", title: "The Song Contest", sub: "A song each on the stage; the winning song becomes the island's", secs: 4,
      setup: async () => {
        clock("21:25"); const day = Math.floor(st.T / DAY);
        let c = null; for (const k in st.contests) { const q = st.contests[k]; if (q && q.day === day && q.kind === "music") c = q; }
        if (!c) throw new Error("no song contest today");
        const Vn = App.contestVenue(c.region, "square"); at(Vn.x, Vn.z, 24, 1.05, Vn.rot + Math.PI + 0.4); await ready(); FILM.song = Vn;
      },
      cam: () => { const Vn = FILM.song; return orbit({ x: Vn.x, z: Vn.z }, { r: 24, phi: 1.05, th: Vn.rot + Math.PI + 0.4 }, { r: 19, phi: 1.0, th: Vn.rot + Math.PI - 0.3 }, 4); } },
    { id: "night", title: null, secs: 8, big: ["TICKLE BEACH WORLD", "Built from the on-chain models of Tickle Beach"],
      setup: async () => { clock("22:10"); const w = C.fort.walls; at(w.x, w.z, 90, 1.0, 2.2); await ready(); },
      cam: () => { const w = C.fort.walls; return orbit({ x: w.x, z: w.z }, { r: 90, phi: 1.0, th: 2.2 }, { r: 70, phi: 1.05, th: 2.9 }, 8); } },
  ];
  FILM.scenes = SCENES.map((s) => s.id);

  // ---------- running ----------
  let stopNow = false;
  async function shoot(S, recording) {
    FILM.scene = S.id; log("scene " + S.id);
    ctrl = null; ov.title = null; ov.titleA = 0; ov.big = null; ov.bigA = 0; ov.black = 1;
    if (recording) pauseRec();
    st.speed = 1;
    try { await S.setup(); } catch (e) { log("skipped " + S.id + ": " + (e && e.message)); try { if (S.after) await S.after(); } catch (e2) { /* */ } return false; }
    ctrl = S.cam();
    if (recording) resumeRec();
    const fade = 0.35, hold = Math.max(0.5, S.secs - fade * 2);
    if (S.big) { ov.big = S.big; }
    fadeTo(0, fade);
    if (S.title) { ov.title = S.title; ov.sub = S.sub; setTimeout(() => titleTo(1, 0.5), 300); setTimeout(() => titleTo(0, 0.5), (S.secs - 1.4) * 1000); }
    if (S.big) { setTimeout(() => bigTo(1, 0.8), 400); setTimeout(() => bigTo(0, 0.8), (S.secs - 1.6) * 1000); }
    // the fishing shots end at the catch (the fish out of the water, the harpoon's strike)
    const t0 = performance.now();
    if (S.id === "rod" && FILM.rod && FILM.rod.t) { await until(() => performance.now() - t0 > hold * 1000 || (FILM.rod.t.fishGear && FILM.rod.t.fishGear.fish && performance.now() - t0 > 2500), hold + 4); await sleep(1300); }
    else if (S.id === "spear" && FILM.spear) { await until(() => performance.now() - t0 > hold * 1000 || (FILM.spear.t.spearCast && FILM.spear.t.spearCast.struck), hold + 4); await sleep(450); }
    else await sleep(hold * 1000);
    await fadeTo(1, fade);
    if (recording) pauseRec();
    ctrl = null;
    try { if (S.after) await S.after(); } catch (e) { log("after " + S.id + ": " + e.message); }
    return true;
  }
  FILM.run = async (ids, name) => {
    if (FILM.status === "running") return "already running";
    stopNow = false; FILM.status = "running"; FILM.done = []; FILM.skipped = [];
    C = cast(); fix(); looping = true; loop();
    const list = SCENES.filter((s) => !ids || ids.includes(s.id));
    await startRec(name || "tickle-beach-world.mp4");
    pauseRec();
    const t0 = performance.now();
    for (const S of list) {
      if (stopNow) break;
      const ok = await shoot(S, true);
      (ok ? FILM.done : FILM.skipped).push(S.id);
    }
    await stopRec();
    FILM.took = Math.round((performance.now() - t0) / 1000);
    FILM.status = stopNow ? "stopped" : "done";
    log("done: " + FILM.done.length + " scenes, " + FILM.skipped.length + " skipped, " + Math.round(FILM.bytes / 1e6) + " MB");
    return FILM.status;
  };
  FILM.preview = async (id) => {
    const S = SCENES.find((s) => s.id === id);
    if (!S) return "no scene " + id;
    C = C || cast(); fix(); looping = true; loop();
    FILM.status = "preview";
    const ok = await shoot(S, false);
    ov.black = 0; FILM.status = "idle";
    return ok ? "shown " + id : "skipped " + id + " (see FILM.log)";
  };
  FILM.stop = () => { stopNow = true; };
  FILM.release = () => { looping = false; ctrl = null; unfix(); ov.black = 0; App.weatherAt = weather0; };
  FILM.cast = () => (C = cast());
  log("film loaded: " + SCENES.length + " scenes");
})();
