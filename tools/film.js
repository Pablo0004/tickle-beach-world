/* The film: a director's script that shows the whole game in under three minutes (asked 11 November, for the
 * TickleBedge account). Not part of the game. Load it in a browser with the game running (film.html, served by
 * tests/serve.py, has the audio tap loaded first):
 *   const s = document.createElement("script"); s.src = "tools/film.js"; document.head.appendChild(s);
 * then FILM.run() records every scene in order, FILM.run(["siege", "casino"]) only those, FILM.preview("siege") sets a
 * scene up and plays its camera without recording, FILM.snap("siege") keeps two frames of it as film/snap-siege.jpg,
 * FILM.stop() stops. FILM.status says where it is, FILM.log what happened.
 * The recording: the game's canvas (nothing of the HUD: no menus, tags, bubbles or controls), 1920x1080 at 30 frames
 * a second, MP4, with a title and fades drawn over it, sent in chunks to the dev server, which writes film/<name>.mp4.
 * The browser pane must stay on view while it records (hidden, the game stops drawing). A preview or a snap works
 * with the pane hidden too: then the script steps the game itself, frame by frame. See tools/FILM.md. */
(function () {
  "use strict";
  const App = window.App, st = App.st, DAY = 1440, cam = App.cam;
  const FILM = (window.FILM = { W: 1920, H: 1080, fps: 30, bitrate: 12e6, status: "idle", log: [], scene: null, bytes: 0, name: null, fixed: false, manual: false, u: 0 });
  const log = (m) => { FILM.log.push(new Date().toISOString().slice(11, 19) + " " + m); if (FILM.log.length > 300) FILM.log.shift(); console.log("[film] " + m); };

  // ---------- time: real frames with the pane on view, the game stepped by hand when it is hidden ----------
  const DT = 1 / FILM.fps;
  const yieldEL = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); }); // (timers crawl in a hidden tab)
  const timer = (ms) => new Promise((r) => setTimeout(r, ms));
  // (a pane not on view gets no animation frames even when the document is not "hidden": a frame that does not
  // come within half a second is stepped by hand instead)
  let lastRaf = performance.now();
  (function beat() { lastRaf = performance.now(); requestAnimationFrame(beat); })();
  const manual = () => FILM.manual || document.hidden || performance.now() - lastRaf > 500;
  let frameNo = 0;
  async function nextFrame() {
    if (manual()) { try { App._tick(DT, DT); } catch (e) { if (!FILM.tickErr) log("tick: " + e.message + " @ " + String(e.stack || "").split("\n").slice(1, 3).join(" ").replace(/https?:\/\/[^/]+\//g, "")); FILM.tickErr = true; } if (++frameNo % 2 === 0) await yieldEL(); }
    else await new Promise((r) => { const to = setTimeout(() => r(), 500); requestAnimationFrame(() => { clearTimeout(to); r(); }); });
  }
  // so much time passing in the world (the game stepped by hand when the pane is hidden)
  async function wait(ms) {
    if (!manual()) return timer(ms);
    for (let n = Math.ceil(ms / 1000 / DT); n > 0; n--) await nextFrame();
  }
  async function until(fn, maxS) { const n0 = frameNo, t0 = performance.now(); while (!fn()) { if (manual() ? (frameNo - n0) * DT > maxS : performance.now() - t0 > maxS * 1000) return false; await wait(100); } return true; }

  // ---------- the picture: a fixed 1920x1080 whatever the pane's size, the HUD left out ----------
  const out = document.createElement("canvas"); out.width = FILM.W; out.height = FILM.H;
  const ox = out.getContext("2d");
  const resize0 = App.resize;
  // (the game's own resize reads the canvas's CSS size, so that is what is fixed: the canvas is 1920x1080 on the
  // page, whatever the pane shows of it)
  function fix() {
    const r = App.renderer, c = r.domElement;
    c.style.width = FILM.W + "px"; c.style.height = FILM.H + "px"; c.style.maxWidth = "none"; c.style.maxHeight = "none";
    r.setPixelRatio(1); r.setSize(FILM.W, FILM.H, false);
    App.camera.aspect = FILM.W / FILM.H; App.camera.updateProjectionMatrix();
    FILM.fixed = true;
  }
  App.resize = () => { if (FILM.fixed) fix(); else resize0(); };
  function unfix() { FILM.fixed = false; const c = App.renderer.domElement; c.style.width = c.style.height = c.style.maxWidth = c.style.maxHeight = ""; resize0(); }
  // what is drawn over the picture: a fade to black, the scene's title, the big titles at the start and the end
  const ov = { black: 1, title: null, sub: null, titleA: 0, big: null, bigA: 0 };
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
  // the picture is copied right after the game draws each frame (App.render)
  let looping = false;
  const render0 = App.render;
  App.render = () => { render0(); if (looping) { try { ox.drawImage(App.renderer.domElement, 0, 0, FILM.W, FILM.H); drawOverlay(); } catch (e) { /* a frame lost */ } } };
  const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

  // ---------- the encoder: frame by frame, through WebCodecs and mp4-muxer (exact 30 frames a second, the pane
  // need not be on view, no pauses to go wrong), the file sent in chunks to the dev server as film/<name>.mp4;
  // the music of each place mixed in afterwards (the game's own tracks, music/), with a short crossfade ----------
  const rec = { enc: null, mux: null, n: 0, queue: Promise.resolve(), music: [], t: 0 };
  async function loadMuxer() {
    if (window.Mp4Muxer) return window.Mp4Muxer;
    await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "tools/vendor/mp4-muxer.min.js"; s.onload = res; s.onerror = () => rej(new Error("tools/vendor/mp4-muxer.min.js is missing (see tools/FILM.md)")); document.head.appendChild(s); });
    return window.Mp4Muxer;
  }
  // (each piece is sent in order; one that the muxer writes back over an earlier place, as the size in the mdat
  // header at the end, is written at that place: ?at=)
  function upload(buf, at) {
    const url = "/film/" + FILM.name + (at != null ? "?at=" + at : "");
    rec.queue = rec.queue.then(() => fetch(url, { method: "POST", body: buf }).then((r) => r.json()).then((j) => { FILM.bytes = j.size; })).catch((e) => log("upload: " + e.message));
  }
  async function startRec(name) {
    const M = await loadMuxer();
    FILM.name = name; FILM.bytes = 0; rec.n = 0; rec.music = []; rec.t = 0;
    await fetch("/film/" + name, { method: "DELETE" }).catch(() => {});
    // the file: written in order as it is made (the index at the end)
    const pending = []; let last = 0;
    let end = 0;
    const target = new M.StreamTarget({ onData: (data, pos) => { const buf = data.slice ? data.slice() : new Uint8Array(data); if (pos === end) { upload(buf); end += buf.byteLength; } else upload(buf, pos); last = pos + buf.byteLength; }, chunked: true, chunkSize: 2 * 1024 * 1024 });
    rec.mux = new M.Muxer({ target, video: { codec: "avc", width: FILM.W, height: FILM.H, frameRate: FILM.fps }, audio: { codec: "aac", sampleRate: 48000, numberOfChannels: 2 }, fastStart: false, firstTimestampBehavior: "offset" });
    rec.enc = new VideoEncoder({ output: (chunk, meta) => rec.mux.addVideoChunk(chunk, meta), error: (e) => log("encoder: " + e.message) });
    rec.enc.configure({ codec: "avc1.640028", width: FILM.W, height: FILM.H, bitrate: FILM.bitrate, framerate: FILM.fps, latencyMode: "quality", avc: { format: "avc" } });
    void pending;
  }
  // one frame of the picture into the film (called after each frame of a shot)
  async function encodeFrame() {
    if (!rec.enc) return;
    while (rec.enc.encodeQueueSize > 6) await new Promise((r) => rec.enc.addEventListener("dequeue", r, { once: true }));
    const f = new VideoFrame(out, { timestamp: Math.round((rec.n * 1e6) / FILM.fps), duration: Math.round(1e6 / FILM.fps) });
    rec.enc.encode(f, { keyFrame: rec.n % (FILM.fps * 2) === 0 });
    f.close();
    rec.n++;
  }
  // the music: the track the game plays at the place of each scene, noted as the scene starts
  function noteMusic(S) {
    const now = App.musicNow && App.musicNow();
    rec.music.push({ id: S.id, t0: rec.n / FILM.fps, file: now && now.file ? "music/" + now.file : null, gain: now && now.gain != null ? now.gain : 1 });
  }
  async function mixMusic() {
    const total = rec.n / FILM.fps;
    if (!total) return;
    const SR = 48000, octx = new OfflineAudioContext(2, Math.ceil(total * SR), SR), cache = new Map();
    const decode = async (file) => { if (cache.has(file)) return cache.get(file); const p = fetch(file).then((r) => r.arrayBuffer()).then((b) => octx.decodeAudioData(b)).catch((e) => { log("music " + file + ": " + e.message); return null; }); cache.set(file, p); return p; };
    // stretches of one track: consecutive scenes with the same file keep it going
    const runs = [];
    for (const m of rec.music) { const r = runs[runs.length - 1]; if (r && r.file === m.file) continue; runs.push({ file: m.file, gain: m.gain, t0: m.t0 }); }
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i], t1 = i + 1 < runs.length ? runs[i + 1].t0 : total;
      if (!r.file) continue;
      const buf = await decode(r.file);
      if (!buf) continue;
      const src = octx.createBufferSource(), g = octx.createGain();
      src.buffer = buf; src.loop = true;
      const v = 0.55 * (r.gain || 1), fade = Math.min(1.2, (t1 - r.t0) / 3);
      g.gain.setValueAtTime(0.0001, r.t0); g.gain.exponentialRampToValueAtTime(v, r.t0 + fade);
      g.gain.setValueAtTime(v, Math.max(r.t0 + fade, t1 - fade)); g.gain.exponentialRampToValueAtTime(0.0001, t1);
      src.connect(g).connect(octx.destination);
      src.start(r.t0, 0); src.stop(t1 + 0.05);
    }
    const mixed = await octx.startRendering();
    // encoded to AAC, a thousand frames at a time
    const aenc = new AudioEncoder({ output: (chunk, meta) => rec.mux.addAudioChunk(chunk, meta), error: (e) => log("audio encoder: " + e.message) });
    aenc.configure({ codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 160000 });
    const L = mixed.getChannelData(0), R = mixed.getChannelData(1), N = 1024;
    for (let i = 0; i < mixed.length; i += N) {
      const n = Math.min(N, mixed.length - i), data = new Float32Array(n * 2);
      data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
      aenc.encode(new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i * 1e6) / SR), data }));
      if (aenc.encodeQueueSize > 20) await new Promise((r) => aenc.addEventListener("dequeue", r, { once: true }));
    }
    await aenc.flush(); aenc.close();
  }
  async function stopRec() {
    if (!rec.enc) return;
    await rec.enc.flush(); rec.enc.close(); rec.enc = null;
    try { await mixMusic(); } catch (e) { log("music: " + e.message); }
    rec.mux.finalize(); rec.mux = null;
    await rec.queue;
  }
  const pauseRec = () => {};
  const resumeRec = () => {};

  // ---------- the camera: a controller runs every frame after the game's own camera code, with the shot's progress ----------
  let ctrl = null;
  const move0 = App.moveCamera;
  App.moveCamera = (dt, keys) => { move0(dt, keys); if (ctrl) { try { ctrl(FILM.u, dt); } catch (e) { log("camera: " + e.message); ctrl = null; } } };
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerpA = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * u; };
  const groundY = (x, z) => Math.max(App.WATER_Y, App.surfaceAt(x, z).y) + 1;
  // the camera put somewhere at once (the world loads round it)
  function at(x, z, r, phi, th) { cam.follow = null; cam.fly = null; cam.target.set(x, groundY(x, z), z); cam.radius = r; cam.phi = phi; cam.theta = th; }
  // a move from A to B over the shot, eased: { x, z, r, phi, th, y? }
  function move(A, B) {
    return (u0) => {
      const u = ease(u0);
      cam.fly = null; cam.follow = null;
      cam.target.x = lerp(A.x, B.x, u); cam.target.z = lerp(A.z, B.z, u);
      if (A.y != null) cam.target.y = lerp(A.y, B.y != null ? B.y : A.y, u);
      cam.radius = lerp(A.r, B.r, u); cam.phi = lerp(A.phi, B.phi, u); cam.theta = lerpA(A.th, B.th, u);
    };
  }
  // round a point, the view turning slowly, the distance and the height easing from A to B
  function orbit(c, A, B) { return move(Object.assign({ x: c.x, z: c.z, y: c.y }, A), Object.assign({ x: c.x, z: c.z, y: c.y }, B)); }
  // behind someone who moves: the target follows it; the view turns slowly (dth a turn per second)
  function follow(getT, o) {
    let th = null;
    return (u, dt) => { const t = getT(); if (!t) return; cam.fly = null; cam.follow = t.id != null && t.flyY != null ? t.id : null; cam.target.x += (t.pos.x - cam.target.x) * 0.2; cam.target.z += (t.pos.z - cam.target.z) * 0.2; cam.radius = o.r; cam.phi = o.phi; if (th == null) th = o.th != null ? o.th : cam.theta; th += (o.dth || 0) * dt; cam.theta = th; };
  }
  // inside, round the point the room looks at: only the distance, the height and the turn
  function inOrbit(A, B) {
    return (u0) => { const u = ease(u0); cam.radius = lerp(A.r, B.r, u); cam.phi = lerp(A.phi, B.phi, u); cam.theta = lerpA(A.th, B.th, u); };
  }
  // inside: look at a point of the room (room coordinates; interiors.js keeps the view relative to the world's camera)
  function inFocus(x, z) { const I = App.inside; if (!I || !I.worldCam) return; I.focus = { x, z }; cam.target.x = I.worldCam.x; cam.target.z = I.worldCam.z; I.lastT = null; }

  // ---------- the clock, the weather, the world's readiness ----------
  // today at hh:mm; if that is earlier than now, tomorrow (the day's plans stay whole)
  function clock(hm) {
    const [h, m] = hm.split(":").map(Number), day = Math.floor(st.T / DAY), mm = h * 60 + m, now = st.T - day * DAY;
    st.T = (mm < now - 2 ? day + 1 : day) * DAY + mm;
  }
  const weather0 = App.weatherAt;
  FILM.wx = { n: 0.3, rain: 0, storm: false, cloud: 0.1, fog: 0, kind: "clear" }; // clear skies for the film unless a scene wants its own
  App.weatherAt = (x, z, T, r) => (FILM.wx ? FILM.wx : weather0(x, z, T, r));
  // nothing is shot while the land, the models or the people are still loading: no job pending for two seconds
  // running, and three seconds at least; twelve at most
  async function ready(max) {
    const t0 = performance.now(); let quiet = 0;
    await wait(manual() ? 900 : 1500);
    while (performance.now() - t0 < (max || 14) * 1000) {
      const busy = (App.jobsPending && App.jobsPending() > 0) || (App.pop.pending && App.pop.pending.size > 0);
      quiet = busy ? 0 : quiet + 1;
      if (quiet >= 20 && performance.now() - t0 > 4000) break;
      if (manual()) { for (let k = 0; k < 3; k++) App._tick(DT, DT); await yieldEL(); await timer(40); } else await timer(100);
    }
  }
  // the war shots: the gate stands through them, and the clock, the range and the cap go back to normal after
  function holdGate() {
    const w = FILM.war, g = w && w.gate != null && App.sceneryAll[w.gate], r = g && st.ruins && st.ruins[w.gate];
    if (g && g.ruined && r) { g.type = r.orig; g.ruined = false; delete st.ruins[w.gate]; App.sceneryDirty = true; }
    if (!w || w.status !== "on" || !FILM.warIds) return;
    // (the clock jumped to the battle: a soldier who turns up in the flesh far from its post is put at it, and the
    // people of the fortress caught outside by the jump go indoors instead of walking home through the lines)
    for (const t of st.tickles.slice()) {
      const S0 = App.planStep(t.id, st.T).step;
      if (FILM.warIds.has(t.id)) {
        if (S0.k === "war" && t.action && t.action.kind === "travel" && Math.hypot(S0.p.x - t.pos.x, S0.p.z - t.pos.z) > 6) { App.endAction(t); t.pos.x = S0.p.x; t.pos.z = S0.p.z; t.pos.y = App.surfaceAt(S0.p.x, S0.p.z).y; }
      } else if (S0.k === "shelter" && t.action && t.action.kind === "travel" && (t.village === C.fort || t.village === C.foe)) App.demote(t);
    }
  }
  function warNormal() {
    FILM.warIds = null;
    if (FILM.range0 != null) { App.RANGE.full = FILM.range0; FILM.range0 = null; }
    if (FILM.speed0 != null) { st.speed = FILM.speed0; FILM.speed0 = null; }
    App.MAX_FULL = FILM.status === "idle" ? null : 96;
  }
  async function leave() { if (App.fpOn && App.fpOn()) { App.keys.clear(); App.exitFP(); } if (App.inside) { App.leaveInterior(); await wait(800); } }
  // (a room is black until its models arrive from the workers: wait for them)
  async function enter(T, opt) { App.enter(T, opt); await wait(900); await until(() => App.inside && App.inside.group && App.inside.group.children.length > 8, 8); await ready(8); }
  const near = (list, x, z) => list.filter(Boolean).slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const agentsNear = (x, z, R) => st.tickles.filter((t) => Math.hypot(t.pos.x - x, t.pos.z - z) < R);
  const inR = (list, r) => (list || []).find((o) => o && o.region === r) || (list || []).find(Boolean);
  const key = (code) => window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code.replace("Key", "").toLowerCase() }));

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
  // cam (the controller for the shot: (u, dt), u the shot's progress), done (optional: ends the shot early, after
  // the thing it waits for), after (optional). A setup that throws skips the scene.
  const SCENES = [
    { id: "intro", title: null, secs: 8, big: ["TICKLE BEACH WORLD", "All 9,629 Tickles, alive on one island"],
      setup: async () => { await leave(); clock("06:50"); await until(() => App.farViewReady && App.farViewReady(), 240); at(0, 0, 1250, 0.88, -2.3); cam.target.y = App.WATER_Y + 1; await ready(10); },
      cam: () => orbit({ x: 0, z: 0, y: App.WATER_Y + 1 }, { r: 1250, phi: 0.88, th: -2.3 }, { r: 950, phi: 0.95, th: -1.9 }) },
    { id: "statue", title: "The Maker's Isle", sub: "The statue of the one who made them, in the middle of the great lake", secs: 5,
      setup: async () => { clock("07:05"); at(0, 0, 95, 1.0, 2.6); cam.target.y = App.WATER_Y + 22; await ready(); },
      cam: () => orbit({ x: 0, z: 0, y: App.WATER_Y + 22 }, { r: 95, phi: 1.0, th: 2.6 }, { r: 72, phi: 0.96, th: 3.4 }) },
    { id: "castle", title: "Inside a holder's castle", sub: "The great hall, the kitchen, the training rooms, the treasury; the bedrooms upstairs", secs: 6,
      setup: async () => { clock("07:15"); const d = C.fort.hall.door || C.fort.hall; at(d.x, d.z, 40, 1.0, 0); await ready(); const T = App.enterableAt(d.x, d.z); if (!T || T.shut) throw new Error("castle door"); await enter(T); inFocus(0, 2); await wait(600); },
      cam: () => inOrbit({ r: 40, phi: 0.98, th: 0.45 }, { r: 30, phi: 0.92, th: -0.3 }), after: leave },
    { id: "town", title: "A town wakes up", sub: "A house for every household, jobs, chores, friends: a whole life, whether you watch or not", secs: 6,
      setup: async () => { clock("07:50"); const v = C.town; at(v.x - 10, v.z + 6, 30, 1.05, 0.6); await ready(); },
      cam: () => { const v = C.town; return move({ x: v.x - 10, z: v.z + 6, r: 30, phi: 1.05, th: 0.6 }, { x: v.x + 8, z: v.z - 4, r: 26, phi: 1.0, th: 1.1 }); } },
    { id: "dock", title: "The great lake", sub: "Ferries to the other islands, rowing boats, fishers, pilgrims' launches", secs: 6,
      setup: async () => { clock("08:40"); const D = C.dock; at(D.x + D.ux * 10, D.z + D.uz * 10, 44, 1.08, Math.atan2(-D.ux, -D.uz) + 0.7); await ready(); },
      cam: () => { const D = C.dock, th = Math.atan2(-D.ux, -D.uz); return move({ x: D.x + D.ux * 10, z: D.z + D.uz * 10, r: 44, phi: 1.08, th: th + 0.7 }, { x: D.x + D.ux * 22, z: D.z + D.uz * 22, r: 38, phi: 1.02, th: th + 1.3 }); } },
    { id: "rod", title: "Fishing", sub: "A fish on the line, food for the granary", secs: 6,
      setup: async () => {
        clock("09:30");
        // a pier with two to four fishers at their spots, their rods out, and little else about
        const day = Math.floor(st.T / DAY), spots = new Map();
        for (const v of App.villages) for (const id of v.residents) {
          if (App.jobOf(id) !== "fisher" || App.isKO(id)) continue;
          const s = App.planOf(id, day).steps.find((q) => q.k === "job");
          if (!s || !s.p || s.p.boat || !/pier/i.test(s.p.label || "")) continue;
          const p = App.planPos(id, st.T);
          if (Math.hypot(p.x - s.p.x, p.z - s.p.z) > 3) continue;
          const k = s.p.label; if (!spots.has(k)) spots.set(k, { ids: [], p: s.p }); spots.get(k).ids.push(id);
        }
        const all = [];
        for (let id = 0; id < TB.SUPPLY; id += 3) { const p = App.planPos(id, st.T); if (!p.inside) all.push([p.x, p.z]); } // (one in three: enough to tell a crowd)
        const cands = [];
        for (const S of spots.values()) {
          if (S.ids.length < 2 || S.ids.length > 4) continue;
          cands.push({ S, crowd: all.filter(([x, z]) => Math.hypot(x - S.p.x, z - S.p.z) < 22).length * 3 - S.ids.length });
        }
        cands.sort((a, b) => a.crowd - b.crowd);
        if (!cands.length) throw new Error("no quiet pier");
        let t = null, S = null, p = null, th = 0;
        for (const c of cands.slice(0, 3)) {
          S = c.S; p = S.p; th = Math.atan2((p.cx != null ? p.cx : p.x) - p.x, (p.cz != null ? p.cz : p.z) - p.z); // (towards the water)
          at(p.x, p.z, 10, 1.22, th + 0.35);
          await ready();
          await until(() => st.tickles.some((q) => S.ids.includes(q.id) && q.fishGear), 4);
          t = st.tickles.find((q) => S.ids.includes(q.id) && q.fishGear);
          FILM.rod = { p, th, ids: S.ids, crowd: c.crowd };
          if (t) break;
        }
        if (!t) throw new Error("no fisher with a rod out");
        FILM.rod.t = t; t.forceCatch = true;
        // the shot starts a moment before the pull of its rod (sim.js: one cast every 6.25 s, the fish up at 0.07 of it)
        const ph = t.id * 0.7, c = () => ((performance.now() / 1000) * 0.16 + ph) % 1;
        await until(() => c() > 0.55 && c() < 0.62, 8);
      },
      // from over the water, low, looking at the fisher's face and the line; it ends when the fish is up
      cam: () => { const R = FILM.rod, t = R.t, y = groundY(t.pos.x, t.pos.z) + 0.8; return move({ x: t.pos.x, z: t.pos.z, y, r: 10, phi: 1.22, th: R.th + 0.35 }, { x: t.pos.x, z: t.pos.z, y, r: 8.5, phi: 1.16, th: R.th + 0.1 }); },
      done: (u) => u > 0.4 && !!(FILM.rod.t.fishGear && FILM.rod.t.fishGear.fish), tail: 1.3 },
    { id: "fortress", title: "A fortress", sub: "Walls and towers, gates that shut at night, an armoury, catapults, griffins on patrol", secs: 6,
      setup: async () => { clock("10:00"); const w = C.fort.walls, Rg = App.regions[C.R], pts = (w.gates || []).map((a) => ({ x: w.x + Math.cos(a) * w.r, z: w.z + Math.sin(a) * w.r })), g = near(pts, Rg.cx, Rg.cz) || w; FILM.gate = { g, th: Math.atan2(g.x - w.x, g.z - w.z) }; at(g.x, g.z, 26, 1.15, FILM.gate.th + 0.3); await ready(); },
      cam: () => { const w = C.fort.walls, G = FILM.gate; return move({ x: G.g.x, z: G.g.z, r: 26, phi: 1.15, th: G.th + 0.3 }, { x: w.x, z: w.z, r: 175, phi: 1.0, th: G.th + 0.05 }); } },
    { id: "griffin", title: "First person", sub: "See through your Tickle's eyes: here, flying its griffin over the castle", secs: 3.5,
      setup: async () => {
        clock("10:40"); const v = C.fort; FILM.range0 = App.RANGE.full; App.RANGE.full = 90; App.MAX_FULL = 120; at(v.x, v.z, 40, 1.0, 0); await ready();
        const find = () => st.tickles.find((t) => { const M = App.mountOf && App.mountOf(t.id); return M && M.fly && !App.isKO(t.id) && !t.riding && t.group.visible && Math.hypot(t.pos.x - v.x, t.pos.z - v.z) < 60; });
        let rider = find(); if (!rider) { await until(find, 15); rider = find(); }
        // (nobody with a griffin in the flesh: one of the fortress's griffin owners is brought in and set by the keep)
        if (!rider) {
          const own = v.residents.find((id) => { const M = App.mountOf && App.mountOf(id); return M && M.fly && !App.isKO(id); });
          if (own == null) throw new Error("no griffin owner");
          App.forcePromote(own); await until(() => !!App.pop.agent[own], 12); App.pinned = null;
          rider = App.pop.agent[own]; if (!rider) throw new Error("no griffin rider in view");
          App.endAction(rider); rider.pos.x = v.x + 14; rider.pos.z = v.z + 6; rider.pos.y = App.surfaceAt(rider.pos.x, rider.pos.z).y; await wait(2500);
        }
        st.mode = "manual"; App.enterFP(rider.id); await wait(700);
        // into the saddle (what the M key does in first person; set directly, so that a key or a click in the window
        // cannot undo it)
        if (rider.action && rider.action.kind === "fp") { rider.action.ride = true; rider.action.mWas = true; }
        await wait(500);
        const a = rider.action; if (!a || !a.ride) throw new Error("did not mount (" + (a ? a.kind : "no action") + ")");
        App.keys.add("Space"); App.keys.add("KeyW"); FILM.rider = rider;
        await wait(1600);
      },
      // (the eyes turned well down, so that the castle and the walls pass beneath)
      cam: () => { const t = FILM.rider, v = C.fort; let looked = false; return (u) => { t.heading = Math.atan2(v.x - t.pos.x, v.z - t.pos.z) + 0.75; if (!looked) { App.fpLook(0, 140); looked = true; } if (u > 0.6) App.keys.delete("Space"); }; },
      after: async () => { App.keys.clear(); } },
    // the same rider seen from the side, in third person: the griffin in profile, the castle behind it (asked 14
    // November: a few moments through its eyes, then the griffin itself in the air). The film flies it round the
    // keep itself; the game's own first-person flight ends with the first-person view.
    { id: "griffinside", title: null, secs: 6,
      setup: async () => {
        const t = FILM.rider; if (!t || App.isKO(t.id)) throw new Error("no rider");
        const W0 = C.fort.walls, v = W0 ? { x: W0.x, z: W0.z } : C.fort, a0 = t.action || {};
        App.keys.clear(); if (App.fpOn && App.fpOn()) App.exitFP();
        // (round the ring between the keep and the wall, the camera outside the wall looking in: the griffin in
        // profile, the castle behind it, and it never crosses the keep)
        FILM.fly = { t, v, R0: W0 ? W0.r * 0.8 : 52, a: Math.atan2(t.pos.x - v.x, t.pos.z - v.z), R: Math.max(40, Math.hypot(t.pos.x - v.x, t.pos.z - v.z)), alt: Math.max(8, a0.alt || 0) };
        FILM.fly.step = (dt) => {
          const F = FILM.fly, T = F.t; F.a += dt * 0.22; F.R += (F.R0 - F.R) * Math.min(1, dt * 0.8); F.alt += (13 - F.alt) * Math.min(1, dt * 0.6);
          if (!T.action || !T.action.film) T.action = { kind: "fp", ride: true, alt: F.alt, started: st.T, film: true }; // (the film's own flight: see stepFP below)
          T.action.alt = F.alt;
          T.pos.x = F.v.x + Math.sin(F.a) * F.R; T.pos.z = F.v.z + Math.cos(F.a) * F.R; T.heading = F.a + Math.PI / 2;
          App.mountRide(T, { slow: false, path: null }, 100);
          const ground = Math.max(App.surfaceAt(T.pos.x, T.pos.z).y, App.WATER_Y);
          T.flyY = ground + F.alt; if (T.riding) T.riding.alt = F.alt; T.pos.y = T.flyY;
          App.animateTickle(T, true, dt);
        };
        // (the game steps a first-person action through App.stepFP, which drops it when nobody is in first person: the
        // film's flight is stepped there instead, after the game's own frame, so the rider stays in the air)
        if (!FILM.stepFP0) { FILM.stepFP0 = App.stepFP; App.stepFP = (T, a, dm, dtReal) => (a && a.film && FILM.fly && FILM.fly.t === T ? FILM.fly.step(dtReal || DT) : FILM.stepFP0(T, a, dm, dtReal)); }
        FILM.fly.step(0.03); cam.follow = t.id; at(t.pos.x, t.pos.z, 16, 1.1, FILM.fly.a + 0.4); await wait(1500); // (the griffin's model back on it after first person)
      },
      cam: () => (u, dt) => { const F = FILM.fly; cam.follow = F.t.id; cam.fly = null; cam.target.x += (F.t.pos.x - cam.target.x) * 0.25; cam.target.z += (F.t.pos.z - cam.target.z) * 0.25; cam.radius = 16; cam.phi = 1.1; cam.theta = F.a + 0.4; },
      after: async () => { const F = FILM.fly; if (F && F.t) { F.t.action = null; F.t.flyY = null; } cam.follow = null; FILM.fly = null; if (FILM.stepFP0) { App.stepFP = FILM.stepFP0; FILM.stepFP0 = null; } if (FILM.range0 != null) { App.RANGE.full = FILM.range0; FILM.range0 = null; } App.MAX_FULL = 96; await leave(); } },
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
      cam: () => (u, dt) => { cam.follow = FILM.diver.id; cam.theta += 0.12 * dt; } },
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
        st.mode = "manual"; await wait(1200); App.enterFP(t.id); await wait(600);
        App.keys.add("KeyC"); await wait(2400); App.keys.delete("KeyC");
        // beside the nearest school, looking at one of its fish
        const ey = () => t.pos.y + (t.height || 3) * 0.8;
        const far = App.seaFishNear(t.pos.x, ey(), t.pos.z, 80);
        if (!far.length) throw new Error("no fish");
        const f0 = far[0], ang = Math.atan2(f0.x - t.pos.x, f0.z - t.pos.z);
        t.pos.x = f0.x - Math.sin(ang) * 6; t.pos.z = f0.z - Math.cos(ang) * 6; t.pos.y = Math.max(App.seaFloorY(t.pos.x, t.pos.z) + 0.7, f0.y - 1.6);
        cam.target.set(t.pos.x, t.pos.y, t.pos.z);
        await wait(1200);
        FILM.spear = { t, aim: () => { const q = App.seaFishNear(t.pos.x, ey(), t.pos.z, 9)[0]; if (!q) return null; t.heading = Math.atan2(q.x - t.pos.x, q.z - t.pos.z); const dd = Math.hypot(q.x - t.pos.x, q.z - t.pos.z); return Math.atan2(q.y - ey(), dd); }, thrown: false };
        if (FILM.spear.aim() == null) throw new Error("no fish near");
      },
      // it follows a fish with its eyes, then throws; the shot ends at the strike
      cam: () => { const S = FILM.spear, t = S.t; return (u) => { if (!S.thrown) { const p = S.aim(); if (p != null) App.fpLook(0, 0); } if (!S.thrown && u > 0.35) { S.thrown = true; t.forceHit = true; key("KeyB"); } }; },
      done: (u) => !!(FILM.spear && FILM.spear.t.spearCast && FILM.spear.t.spearCast.struck), tail: 0.5,
      after: async () => { App.keys.clear(); await leave(); } },
    { id: "seacave", title: "A sea cave", sub: "Only a diver finds the way in: dark blue stone, torches, treasure", secs: 4,
      setup: async () => { const c = near(App.seaCaves, C.dock.x, C.dock.z); await enter({ kind: "seacave", cave: c, door: c.door, name: c.name }); inFocus(0, 0); await wait(600); },
      cam: () => inOrbit({ r: 28, phi: 1.12, th: 0.4 }, { r: 22, phi: 1.05, th: -0.4 }), after: leave },
    { id: "kraken", title: "Sea beasts", sub: "A Kraken from the open sea, the Lake Serpent from the lake: the villages run to fight them", secs: 7,
      setup: async () => {
        await leave(); clock("12:10");
        const r = 5, v = App.villages.filter((o) => o.region === r).sort((a, b) => b.residents.length - a.residents.length)[0];
        const b = App.seaBeach(v.x, v.z, 520, r) || App.seaBeach(v.x, v.z, 780, r);
        if (!b) throw new Error("no beach");
        const ux = (b.cx - b.x), uz = (b.cz - b.z), L = Math.hypot(ux, uz) || 1, F = { x: b.x + ux / L * 13, z: b.z + uz / L * 13 };
        at(b.x + ux / L * 4, b.z + uz / L * 4, 30, 1.14, Math.atan2(-ux, -uz)); await ready();
        const day = Math.floor(st.T / DAY), def = [];
        for (const q of App.villages) if (Math.hypot(q.x - F.x, q.z - F.z) < 240) for (const id of q.residents) { if (def.length >= 5) break; if (App.isKO(id) || App.isDead(id) || !App.combatRole(id)) continue; def.push(id); }
        const a = { id: "film" + day + Math.floor(st.T), day, kind: "kraken", r, t0: st.T + 1.5, t1: st.T + 70, hp: 1600, max: 1600, def, done: false, live: false, dealt: {} };
        st.seaAttacks.push(a);
        for (const id of def) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && !t.action.order && t.action.kind !== "ko") App.endAction(t); }
        FILM.kraken = { F, th: Math.atan2(-ux, -uz), b: { x: b.x + ux / L * 4, z: b.z + uz / L * 4 } };
        await until(() => a.live, 12); await wait(3500);
      },
      cam: () => { const K = FILM.kraken; return move({ x: K.b.x, z: K.b.z, r: 30, phi: 1.14, th: K.th - 0.35 }, { x: K.F.x, z: K.F.z, r: 24, phi: 1.1, th: K.th + 0.35 }); } },
    { id: "dragon", title: "Dragons", sub: "Each island's dragon sleeps on its peak and flies a patrol", secs: 5,
      setup: async () => { clock("12:40"); const L = C.lair; at(L.x, L.z, 30, 1.12, 0.5); cam.target.y = L.h + 2; await ready(); },
      cam: () => { const L = C.lair; return orbit({ x: L.x, z: L.z, y: L.h + 2 }, { r: 30, phi: 1.12, th: 0.5 }, { r: 22, phi: 1.05, th: 1.4 }); } },
    { id: "rampage", title: "...and some days it attacks", sub: "Swords, spears, spells and creatures against it, together", secs: 8,
      setup: async () => {
        const L = C.lair, d = App.dragonObjects.get(L.i);
        if (!d) throw new Error("no dragon object");
        const v = near(App.villages.filter((o) => o.residents.length >= 20 && Math.hypot(o.x - L.x, o.z - L.z) < 400), L.x, L.z) || App.nearestVillage(L.x, L.z);
        clock("12:55"); at(v.x, v.z, 36, 1.02, 0.8); await ready();
        d.x = v.x + 6; d.z = v.z + 4; d.y = App.surfaceAt(d.x, d.z).y;
        if (!App.startRampage(d)) throw new Error("rampage refused");
        FILM.rampage = { v, d }; await wait(2500);
      },
      cam: () => { const R = FILM.rampage; return follow(() => (R.d.rampage ? { pos: { x: R.d.x, z: R.d.z } } : null), { r: 34, phi: 1.04, dth: 0.12 }); } },
    { id: "hunt", title: "Hunting", sub: "Deer and boar for the granary", secs: 6,
      setup: async () => {
        clock("14:15");
        let best = null;
        // (a hunting ground out in the woods, away from the farms and the square, with two hunters at least)
        for (const v of App.villages) { if (!v.hunt || v.hunt.poi < 0) continue; const hs = v.residents.filter((id) => App.choreOf(id) === "hunt" && App.doesChores(id) && !App.isKO(id)); const far = Math.hypot(v.hunt.x - v.x, v.hunt.z - v.z); const score = (hs.length >= 2 ? 1000 : 0) + Math.min(far, 80) + Math.min(hs.length, 4) * 5; if (!best || score > best.score) best = { v, hs, score }; }
        if (!best || best.hs.length < 2) throw new Error("no hunters");
        const g = best.v.hunt; at(g.x, g.z, 24, 1.02, 0.3); await ready(6);
        FILM.hunt = { g, ids: best.hs };
        await until(() => st.tickles.some((t) => FILM.hunt.ids.includes(t.id) && Math.hypot(t.pos.x - g.x, t.pos.z - g.z) < 30), 10);
      },
      cam: () => { const H = FILM.hunt; return follow(() => st.tickles.find((t) => H.ids.includes(t.id)) || { pos: H.g }, { r: 18, phi: 1.1, dth: 0.1 }); } },
    { id: "surf", title: "Contests", sub: "Surfing, karts, foot races, fishing, regattas, strongest Tickle, fashion, song", secs: 6,
      setup: async () => {
        clock("15:25"); const day = Math.floor(st.T / DAY);
        let c = null; for (const k in st.contests) { const q = st.contests[k]; if (q && q.day === day && q.kind === "surf") c = q; }
        // (no surf contest on the film's day: one is held in the cast's region, or wherever there is a beach)
        if (!c && App.debugContest) { c = App.debugContest("surf", C.R); for (let r = 0; !c && r < App.regions.length; r++) c = App.debugContest("surf", r); }
        if (!c) throw new Error("no surf contest today");
        const Vn = App.contestVenue(c.region, "sea"); if (!Vn) throw new Error("no sea venue");
        const D = Vn.D, th = Math.atan2(-D.ux, -D.uz);
        // (from over the water and a little above, along the beach: the surfers on their boards, the crowd on the
        // sand behind them and not in front of the camera)
        at(D.x + D.ux * 12, D.z + D.uz * 12, 26, 1.08, th + 0.95); await ready();
        FILM.surf = { D, th };
      },
      cam: () => { const S = FILM.surf, D = S.D; return move({ x: D.x + D.ux * 12, z: D.z + D.uz * 12, r: 26, phi: 1.08, th: S.th + 0.95 }, { x: D.x + D.ux * 16, z: D.z + D.uz * 16, r: 22, phi: 1.1, th: S.th + 0.4 }); } },
    { id: "parliament", title: "The Parliament", sub: "The holders' ministers sit every afternoon and vote the laws", secs: 4,
      // (from outside: the hall on the Maker's Isle, its columns and dome, the ministers at its door; inside, 333
      // seats with a dozen ministers in them look empty on film)
      setup: async () => { clock("15:55"); const P = App.parliament; FILM.parl = { x: P.x, z: P.z, th: Math.atan2(P.door.x - P.x, P.door.z - P.z) }; at(P.x, P.z, 72, 0.92, FILM.parl.th + 1.2); cam.target.y += 4; await ready(); },
      cam: () => { const Q = FILM.parl; return orbit({ x: Q.x, z: Q.z, y: App.WATER_Y + 6 }, { r: 72, phi: 0.92, th: Q.th + 1.2 }, { r: 56, phi: 0.98, th: Q.th + 0.45 }); } },
    { id: "dungeon", title: "The Great Underworld", sub: "Twelve floors under the whole island, a guardian on each; parties go down for relics", secs: 7,
      setup: async () => {
        clock("15:50");
        if (!App.liveParties().length) await until(() => App.liveParties().length > 0, 20);
        const live = App.liveParties();
        const pick = live.find((L) => L.S.kind === "guardian") || live[0];
        if (pick) { App.watchParty(pick.key); await wait(1800); }
        else { const dg = C.fort ? near(App.dungeons, C.fort.x, C.fort.z) : App.dungeons[0]; await enter({ kind: "dungeon", dg, door: dg.door }); }
        FILM.dungeon = { watched: !!pick };
      },
      cam: () => inOrbit({ r: 16, phi: 1.0, th: 0.4 }, { r: 13, phi: 0.95, th: -0.5 }), after: leave },
    { id: "siege", title: "War between holders", sub: "Armies of fifty, a siege at the gate: the ram, the catapults, the archers on the walls", secs: 8,
      setup: async () => {
        clock("14:30"); await leave();
        // a world played for long has its castle gate in ruins from earlier wars and many knocked out: for the shot
        // the fortress is rebuilt (so that it is a siege, with the gate shut and the archers on the walls) and
        // everyone is on their feet (a war of eight is no war)
        if (st.ruins) for (const k in st.ruins) { const r = st.ruins[k], b = App.sceneryAll[k]; if (b && (r.village === C.fort.i || r.village === C.foe.i)) { b.type = r.orig; b.ruined = false; delete st.ruins[k]; App.sceneryDirty = true; } }
        for (const vi of [C.foe.i, C.fort.i]) for (const id of App.villages[vi].residents) if (App.pop.ko[id]) App.pop.ko[id] = 0;
        // and both armouries hold weapons from earlier wars, so that there are swords, spears and bows in the ranks
        // and not only the mages and the tamers (the armoury arms as many as it holds)
        if (st.war) { st.war.stock = st.war.stock || {}; st.war.stock[C.foe.ident] = Math.max(st.war.stock[C.foe.ident] || 0, 36); st.war.stock[C.fort.ident] = Math.max(st.war.stock[C.fort.ident] || 0, 24); }
        if (st.war) for (const x of st.war.wars) if (x.status !== "over") x.status = "over"; // (no earlier test war still carrying its spoils)
        const w = App.debugWar(C.foe.i, C.fort.i);
        if (!w) throw new Error("no war");
        FILM.war = w;
        // a battle is over in a few minutes of the clock and the ram has the gate down in two: for the two shots the
        // clock runs at a little more than half its pace and the gate holds (both back to normal after)
        FILM.speed0 = st.speed; st.speed = 0.6;
        // both armies in the flesh: the range of full Tickles reaches the ranks and the walls (back to normal after)
        FILM.range0 = App.RANGE.full; App.RANGE.full = 90; App.MAX_FULL = 120;
        st.T = w.bt.arrive - 1.5;
        // the clock jumped to the arrival: whoever is already in the flesh stands where their day has them now (in
        // the ranks, on the walls), instead of walking there from wherever they were
        const ids = (FILM.warIds = new Set([].concat(...w.A.map((c) => c.ids), ...w.B.map((c) => c.ids))));
        for (const t of st.tickles) if (ids.has(t.id)) { const S0 = App.planStep(t.id, st.T).step; if (S0.k !== "war") continue; App.endAction(t); const q = S0.p; t.pos.x = q.x; t.pos.z = q.z; t.pos.y = App.surfaceAt(q.x, q.z).y; }
        const F = w.front, th = Math.atan2(-F.ux, -F.uz);
        at(F.x - F.ux * 7, F.z - F.uz * 7, 58, 0.6, th + 1.25); await ready(12);
        await wait(3000);
      },
      // from high up and from the side, as Imperium shows its armies: the ranks read as lines, the gate and the walls
      // beyond them; the camera comes down and round towards the gate
      cam: () => { const F = FILM.war.front, th = Math.atan2(-F.ux, -F.uz), f = move({ x: F.x - F.ux * 7, z: F.z - F.uz * 7, r: 58, phi: 0.6, th: th + 1.25 }, { x: F.x - F.ux * 1, z: F.z - F.uz * 1, r: 44, phi: 0.72, th: th + 0.75 }); return (u) => { holdGate(); return f(u); }; } },
    { id: "walls", title: "Griffin riders fly over the walls", sub: "Cavalry, mages, healers, tamers with their creatures; stars decide the spoils", secs: 7,
      setup: async () => {
        await wait(300); const w = FILM.war; if (!w || w.status !== "on") throw new Error("war over");
        // one griffin rider, kept for the whole shot (switching between them made the camera spin)
        const near0 = (t) => Math.hypot(t.pos.x - w.front.x, t.pos.z - w.front.z) < 90;
        FILM.flyer = st.tickles.find((t) => t.riding && t.riding.fly && (t.riding.alt || 0) > 1.5 && near0(t)) || st.tickles.find((t) => t.riding && t.riding.fly && near0(t)) || null;
        FILM.gatePt = { x: w.front.gx != null ? w.front.gx : w.front.x, z: w.front.gz != null ? w.front.gz : w.front.z };
      },
      // (if the rider is knocked out, the next griffin in the air takes over; the camera keeps its turn, so no spin)
      cam: () => { const w = FILM.war, flying = (t) => t.riding && t.riding.fly && !App.isKO(t.id) && Math.hypot(t.pos.x - w.front.x, t.pos.z - w.front.z) < 90;
        const pick = () => { if (!FILM.flyer || !flying(FILM.flyer)) FILM.flyer = st.tickles.find(flying) || null; return FILM.flyer || { pos: FILM.gatePt }; };
        // (from outside the wall, a little above the rider: the griffin crosses the wall with the fortress beyond it)
        const g = follow(pick, { r: 17, phi: 0.82, th: Math.atan2(-w.front.ux, -w.front.uz) + 0.35, dth: 0.05 }); return (u, dt) => { holdGate(); return g(u, dt); }; },
      after: warNormal },
    { id: "tame", title: "Taming", sub: "Seven kinds of wild creature, won over with a snack and raised for the arena", secs: 6,
      setup: async () => {
        clock("17:00"); const day = Math.floor(st.T / DAY);
        let spot = null, who = [];
        for (const v of App.villages) { for (const id of v.residents) { const P = App.planOf(id, day), L = P.steps.find((s) => s.k === "leisure" && s.taming); if (L) { if (!spot) spot = L.p; if (Math.hypot(L.p.x - spot.x, L.p.z - spot.z) < 10) who.push(id); } } if (who.length >= 2) break; }
        if (!spot) throw new Error("no tamer today");
        at(spot.x, spot.z, 24, 1.08, 0.5); await ready(6); FILM.tame = { spot, who };
      },
      cam: () => { const T = FILM.tame; return follow(() => st.tickles.find((t) => T.who.includes(t.id)) || { pos: T.spot }, { r: 18, phi: 1.08, dth: 0.12 }); } },
    { id: "arena", title: "The arena", sub: "A creature tournament every evening, the whole island in the stands", secs: 7,
      // (a bout is fought in the ring only when both tamers are in the flesh: the range of full Tickles is widened
      // for the shot, and the shot waits for a bout)
      // (the camera is at the arena before the tournament opens, so that the players are in the flesh when it does:
      // a bout whose tamers are not is decided off screen in an instant)
      setup: async () => { clock("17:18"); const a = C.arena; FILM.range0 = App.RANGE.full; App.RANGE.full = 90; App.MAX_FULL = 120; at(a.x, a.z, 24, 0.9, a.rot - 0.45); await ready(12); await until(() => { const tr = st.tourneys[Math.floor(st.T / DAY) + ":" + a.region]; return tr && tr.current; }, 60); await wait(1200); },
      cam: () => { const a = C.arena; return orbit({ x: a.x, z: a.z }, { r: 24, phi: 0.9, th: a.rot - 0.45 }, { r: 19, phi: 1.02, th: a.rot + 0.4 }); },
      after: () => { if (FILM.range0 != null) { App.RANGE.full = FILM.range0; FILM.range0 = null; } App.MAX_FULL = 96; } },
    { id: "ether", title: "Ether fields", sub: "Crystals that power the creatures' magic", secs: 4,
      setup: async () => { clock("18:50"); const f = C.ether; at(f.x, f.z, 24, 1.12, 0); await ready(); },
      cam: () => { const f = C.ether; return orbit({ x: f.x, z: f.z }, { r: 24, phi: 1.14, th: 0 }, { r: 20, phi: 1.06, th: 0.8 }); } },
    { id: "casino", title: "The casino", sub: "Poker, blackjack, roulette, bingo and the slots, open from seven", secs: 7,
      setup: async () => {
        clock("20:10"); const Cs = C.casino; at(Cs.x, Cs.z, 40, 1.0, 0); await ready(); // (an hour after opening the tables are full)
        const T = { kind: "casino", casino: Cs, door: Cs.door }, map = App.mapOf(T);
        // (the guests take their seats after opening: wait for a card table with three or more at it)
        // (the card rooms, with the players in their chairs; the shot waits for three or more at the tables)
        const cardRooms = new Set(Object.values(App.CASINO_LAYOUT.tables).filter((P) => P.kind === "poker" || P.kind === "blackjack").map((P) => P.room));
        const cards = (i) => (cardRooms.has(i) && App.casinoOccupants ? App.casinoOccupants(Cs, i) : []).filter((o) => o.pose === "cards").length;
        const seated = () => map.rooms.some((R, i) => i > 0 && cards(i) >= 3);
        if (!seated()) await until(seated, 40);
        let ri = 1, best = -1;
        map.rooms.forEach((R, i) => { const n = cards(i); if (i > 0 && n > best) { best = n; ri = i; } });
        await enter(T, { floor: ri }); inFocus(0, 0); await wait(600); FILM.casino = { ri };
      },
      cam: () => inOrbit({ r: 26, phi: 0.98, th: 0.5 }, { r: 20, phi: 0.9, th: -0.35 }), after: leave },
    { id: "fire", title: "Dinner by the fire", sub: "Every evening, the whole place round the square's fire", secs: 6,
      setup: async () => { clock("20:40"); const v = C.keep; at(v.x, v.z, 26, 1.12, 0.4); await ready(); },
      cam: () => { const v = C.keep; return orbit({ x: v.x, z: v.z }, { r: 26, phi: 1.14, th: 0.4 }, { r: 20, phi: 1.06, th: 1.2 }); } },
    { id: "song", title: "The Song Contest", sub: "A song each on the stage; the winning song becomes the island's", secs: 4,
      setup: async () => {
        clock("21:25"); const day = Math.floor(st.T / DAY);
        let c = null; for (const k in st.contests) { const q = st.contests[k]; if (q && q.day === day && q.kind === "music") c = q; }
        if (!c && App.debugContest) { c = App.debugContest("music", C.R); for (let r = 0; !c && r < App.regions.length; r++) c = App.debugContest("music", r); }
        if (!c) throw new Error("no song contest today");
        const Vn = App.contestVenue(c.region, "square"); at(Vn.x, Vn.z, 28, 0.86, Vn.rot + Math.PI + 0.4); await ready(); FILM.song = Vn;
      },
      cam: () => { const Vn = FILM.song; return orbit({ x: Vn.x, z: Vn.z }, { r: 28, phi: 0.86, th: Vn.rot + Math.PI + 0.4 }, { r: 22, phi: 0.95, th: Vn.rot + Math.PI - 0.3 }); } },
    { id: "night", title: null, secs: 8, big: ["TICKLE BEACH WORLD", "Built from the on-chain models of Tickle Beach"],
      setup: async () => { clock("22:10"); const w = C.fort.walls; at(w.x, w.z, 210, 1.0, 2.2); await ready(); },
      cam: () => { const w = C.fort.walls; return orbit({ x: w.x, z: w.z }, { r: 210, phi: 1.0, th: 2.2 }, { r: 150, phi: 1.06, th: 2.8 }); } },
  ];
  FILM.scenes = SCENES.map((s) => s.id);

  // ---------- running ----------
  let stopNow = false;
  async function shoot(S, recording) {
    FILM.scene = S.id; log("scene " + S.id + (manual() ? " (stepped by hand)" : ""));
    ctrl = null; ov.title = null; ov.titleA = 0; ov.big = null; ov.bigA = 0; ov.black = 1;
    if (recording) pauseRec();
    st.speed = 1;
    try { await S.setup(); } catch (e) { log("skipped " + S.id + ": " + (e && e.message)); try { if (S.after) await S.after(); } catch (e2) { /* */ } return false; }
    ctrl = S.cam();
    if (FILM.onShot) { try { FILM.onShot(S); } catch (e) { /* */ } }
    if (recording) noteMusic(S);
    const fade = 0.35, N = Math.round(S.secs * FILM.fps);
    if (S.title) { ov.title = S.title; ov.sub = S.sub; }
    if (S.big) ov.big = S.big;
    let n = 0, end = N;
    for (; n < end; n++) {
      const t = n / FILM.fps, left = (end - n) / FILM.fps;
      FILM.u = n / N;
      ov.black = Math.max(1 - ramp(t, 0, fade), 1 - ramp(left, 0, fade));
      ov.titleA = Math.min(ramp(t, 0.3, 0.8), ramp(left, 0.6, 1.1));
      ov.bigA = Math.min(ramp(t, 0.4, 1.2), ramp(left, 0.8, 1.6));
      // a shot that ends when its thing has happened (the fish up, the harpoon's strike): a moment more, then out
      if (S.done && end === N && S.done(FILM.u)) end = Math.min(N, n + Math.round((S.tail || 1) * FILM.fps) + Math.round(fade * FILM.fps));
      if (FILM.frameHook) FILM.frameHook(n, N);
      await nextFrame();
      if (recording) await encodeFrame();
      if (stopNow) break;
    }
    ov.black = 1; await nextFrame();
    if (recording) await encodeFrame();
    ctrl = null;
    try { if (S.after) await S.after(); } catch (e) { log("after " + S.id + ": " + e.message); }
    return true;
  }
  FILM.run = async (ids, name) => {
    if (FILM.status === "running") return "already running";
    stopNow = false; FILM.status = "running"; FILM.done = []; FILM.skipped = [];
    C = cast(); fix(); looping = true; FILM.manual = true;
    App.MAX_FULL = 96; // (both armies of a siege in view)
    const vol0 = App.musicVolume ? App.musicVolume() : null;
    if (App.toggleMusic && App.musicOn && !App.musicOn()) { try { App.toggleMusic(true); } catch (e) { log("music: " + e.message); } }
    if (App.musicVolume) App.musicVolume(0); // (silent while it is made: the tracks are mixed in at the end)
    FILM.vol0 = vol0;
    log("waiting for the far view"); await until(() => App.farViewReady && App.farViewReady(), 300);
    const list = SCENES.filter((s) => !ids || ids.includes(s.id));
    try { await startRec(name || "tickle-beach-world.mp4"); } catch (e) { FILM.status = "idle"; return "no recorder: " + e.message; }
    const t0 = performance.now();
    for (const S of list) {
      if (stopNow) break;
      const ok = await shoot(S, true);
      (ok ? FILM.done : FILM.skipped).push(S.id);
    }
    await stopRec();
    if (App.musicVolume && FILM.vol0 != null) App.musicVolume(FILM.vol0);
    FILM.manual = false; App.MAX_FULL = null; warNormal();
    FILM.took = Math.round((performance.now() - t0) / 1000);
    FILM.secs = Math.round(rec.n / FILM.fps);
    FILM.status = stopNow ? "stopped" : "done";
    log("done: " + FILM.done.length + " scenes, " + FILM.skipped.length + " skipped, " + FILM.secs + " s, " + Math.round(FILM.bytes / 1e6) + " MB");
    return FILM.status;
  };
  FILM.preview = async (id) => {
    const S = SCENES.find((s) => s.id === id);
    if (!S) return "no scene " + id;
    C = C || cast(); fix(); looping = true; App.MAX_FULL = App.MAX_FULL || 96;
    FILM.status = "preview"; stopNow = false;
    const man0 = FILM.manual; FILM.manual = true; // (stepped by hand, as the film is: real time never matters)
    const ok = await shoot(S, false);
    ov.black = 0; FILM.status = "idle"; FILM.manual = man0;
    return ok ? "shown " + id : "skipped " + id + " (see FILM.log)";
  };
  // a look at a scene: two frames of the shot (at a third and at three quarters) side by side, kept as film/snap-<id>.jpg
  FILM.snap = async (id) => {
    const frames = [];
    const take = () => { const c = document.createElement("canvas"); c.width = 960; c.height = 540; c.getContext("2d").drawImage(out, 0, 0, 960, 540); frames.push(c); };
    FILM.frameHook = (n, N) => { if (n === Math.round(N * 0.33) || n === Math.round(N * 0.75)) take(); };
    const r = await FILM.preview(id);
    FILM.frameHook = null;
    const c = document.createElement("canvas"); c.width = 1920; c.height = 540;
    const x = c.getContext("2d"); frames.forEach((f, i) => x.drawImage(f, i * 960, 0));
    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
    await fetch("/film/snap-" + id + ".jpg", { method: "DELETE" }).catch(() => {});
    await fetch("/film/snap-" + id + ".jpg", { method: "POST", body: blob }).catch(() => {});
    return r + " (" + frames.length + " frames)";
  };
  // one frame of the picture as it is now (the game stepped once), kept as film/frame-<name>.jpg
  FILM.frame = async (name) => {
    fix(); looping = true; ov.black = 0;
    await nextFrame();
    const c = document.createElement("canvas"); c.width = 960; c.height = 540; c.getContext("2d").drawImage(out, 0, 0, 960, 540);
    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
    await fetch("/film/frame-" + name + ".jpg", { method: "DELETE" }).catch(() => {});
    await fetch("/film/frame-" + name + ".jpg", { method: "POST", body: blob }).catch(() => {});
    return "frame-" + name;
  };
  FILM.stop = () => { stopNow = true; };
  FILM.release = () => { looping = false; ctrl = null; unfix(); ov.black = 0; App.weatherAt = weather0; };
  FILM.cast = () => (C = cast());
  FILM.wait = wait; FILM.ov = ov;
  log("film loaded: " + SCENES.length + " scenes");
})();
