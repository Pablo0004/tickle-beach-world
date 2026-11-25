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
  // the film's own soundtrack (asked 25 November: too many changes of song): four calm tracks as the base, through
  // the day, and the lively ones for the battles (the dragon's, which the owner liked, for the kraken and the dragon)
  const SOUNDTRACK = {
    feel_good_island: ["intro", "statue", "parliament", "castle", "town", "dock", "rod", "fortress"],
    sandy_seaside_2nd: ["griffin", "griffinside", "spear", "seacave"], // (the owner's choice, 25 November: the song the game was playing)
    great_boss: ["kraken", "dragon", "rampage"],
    sandy_seaside: ["skate", "surf", "tame"],
    rpg_battle: ["dungeon", "siege", "walls", "arena"],
    mirror_lake: ["casino", "fire", "song", "night"],
  };
  FILM.SOUNDTRACK = SOUNDTRACK;
  function noteMusic(S) {
    const key = Object.keys(SOUNDTRACK).find((k) => SOUNDTRACK[k].includes(S.id)), T = key && App.MUSIC_TRACKS[key.replace(/_2nd$/, "")];
    const now = T ? null : App.musicNow && App.musicNow();
    rec.music.push({ id: S.id, t0: rec.n / FILM.fps, file: T ? "music/" + T.file : now && now.file ? "music/" + now.file : null, gain: T ? (T.gain != null ? T.gain : 1) : now && now.gain != null ? now.gain : 1 });
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
      const busy = (App.jobsPending && App.jobsPending() > 0) || (App.pop.pending && App.pop.pending.size > 0) || (App.landPending || 0) > 0;
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
      // (from the side away from the Parliament, which stands behind the statue and is shown inside later)
      setup: async () => { clock("07:05"); const P = App.parliament, th0 = P ? Math.atan2(-P.x, -P.z) : 0; FILM.statueTh = th0; at(0, 0, 95, 1.0, th0 - 0.55); cam.target.y = App.WATER_Y + 22; await ready(); },
      cam: () => orbit({ x: 0, z: 0, y: App.WATER_Y + 22 }, { r: 95, phi: 1.0, th: FILM.statueTh - 0.55 }, { r: 72, phi: 0.96, th: FILM.statueTh - 0.25 }) },
    { id: "parliament", title: "The Parliament", sub: "The holders' ministers sit every afternoon and vote the laws", secs: 4,
      // (inside, at the vote, the camera on the ministers who are there: asked 25 November, the Parliament is seen
      // from outside once, with the statue, and inside once, here)
      setup: async () => {
        clock("17:28"); const P = App.parliament; at(P.door.x, P.door.z, 40, 1.0, 0); await ready();
        await enter({ kind: "parliament", parliament: P, door: P.door });
        const occ = App.chamberOccupants ? App.chamberOccupants(App.inside.map.rooms[0]) : [];
        // (the camera close on the thickest group of ministers present)
        let best = null; for (const o of occ) { const n = occ.filter((q) => Math.hypot(q.at.x - o.at.x, q.at.z - o.at.z) < 7).length; if (!best || n > best.n) best = { o, n }; }
        const grp = best ? occ.filter((q) => Math.hypot(q.at.x - best.o.at.x, q.at.z - best.o.at.z) < 7) : [];
        const cx = grp.length ? grp.reduce((a, o) => a + o.at.x, 0) / grp.length : 0, cz = grp.length ? grp.reduce((a, o) => a + o.at.z, 0) / grp.length : 0;
        // (the camera in front of them, the way their seats face: their faces, not their backs)
        const fx = grp.reduce((a, o) => a + Math.sin(o.at.rot || 0), 0), fz = grp.reduce((a, o) => a + Math.cos(o.at.rot || 0), 0);
        inFocus(cx, cz); await wait(500); FILM.parlIn = { n: occ.length, grp: grp.length, th: Math.atan2(fx, fz) };
      },
      cam: () => { const th = FILM.parlIn.th; return inOrbit({ r: 17, phi: 1.0, th: th + 0.35 }, { r: 14, phi: 0.95, th: th - 0.2 }); }, after: leave },
    { id: "castle", title: "Inside a holder's castle", sub: "The great hall, the kitchen, the training rooms, the treasury; the bedrooms upstairs", secs: 6,
      // (at breakfast, everyone at the tables: the minute of the morning when most of the castle's household has just
      // sat down, its first half hour)
      setup: async () => {
        const day = Math.floor(st.T / DAY), d = C.fort.hall.door || C.fort.hall, T = App.enterableAt(d.x, d.z);
        if (!T || T.shut) throw new Error("castle door");
        const ids = App.residentsOf(T.sc || C.fort.hall).slice(0, 80);
        let best = 435, bn = -1;
        for (let mm = 380; mm <= 520; mm += 5) { const n = ids.filter((id) => { const S = App.planStep(id, day * DAY + mm); return S.step.k === "morning" && S.m - S.step.s < 25 && S.m - S.step.s > 3; }).length; if (n > bn) { bn = n; best = mm; } }
        clock(String(Math.floor(best / 60)).padStart(2, "0") + ":" + String(best % 60).padStart(2, "0"));
        at(d.x, d.z, 40, 1.0, 0); await ready(); await enter(T); inFocus(0, 2); await wait(600);
      },
      cam: () => inOrbit({ r: 40, phi: 0.98, th: 0.45 }, { r: 30, phi: 0.92, th: -0.3 }), after: leave },
    { id: "town", title: "A town wakes up", sub: "A house for every household, jobs, chores, friends: a whole life, whether you watch or not", secs: 6,
      setup: async () => { clock("07:50"); const v = C.town; at(v.x - 10, v.z + 6, 30, 1.05, 0.6); await ready(); },
      cam: () => { const v = C.town; return move({ x: v.x - 10, z: v.z + 6, r: 30, phi: 1.05, th: 0.6 }, { x: v.x + 8, z: v.z - 4, r: 26, phi: 1.0, th: 1.1 }); } },
    { id: "dock", title: "The great lake", sub: "Ferries to the other islands, rowing boats, fishers, pilgrims' launches", secs: 6,
      setup: async () => { clock("08:40"); const D = C.dock; at(D.x + D.ux * 10, D.z + D.uz * 10, 44, 1.08, Math.atan2(-D.ux, -D.uz) + 0.7); await ready(); },
      cam: () => { const D = C.dock, th = Math.atan2(-D.ux, -D.uz); return move({ x: D.x + D.ux * 10, z: D.z + D.uz * 10, r: 44, phi: 1.08, th: th + 0.7 }, { x: D.x + D.ux * 22, z: D.z + D.uz * 22, r: 38, phi: 1.02, th: th + 1.3 }); } },
    { id: "rod", title: "Fishing", sub: "A fish on the line, food for the granary", noWarm: true, secs: 6,
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
          // (the way to the open water from the fisher's spot: the mean of the directions in which water lies a few
          // blocks off; the camera goes out there and looks back at the fisher)
          S = c.S; p = S.p; let wx = 0, wz = 0; for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.283; for (const r of [4, 7, 10]) if (!App.isLand(p.x + Math.sin(a) * r, p.z + Math.cos(a) * r)) { wx += Math.sin(a); wz += Math.cos(a); } } th = Math.atan2(wx, wz);
          at(p.x, p.z, 13, 1.12, th + 0.45);
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
      // from out over the water, a little above, looking back at the fisher's face, the rod and the line, the shore
      // behind; the camera drifts round a little; it ends when the fish is up
      cam: () => { const R = FILM.rod, t = R.t, y = groundY(t.pos.x, t.pos.z) + 0.8; return move({ x: t.pos.x, z: t.pos.z, y, r: 13, phi: 1.12, th: R.th + 0.45 }, { x: t.pos.x, z: t.pos.z, y, r: 10.5, phi: 1.08, th: R.th + 0.15 }); },
      done: (u) => u > 0.4 && !!(FILM.rod.t.fishGear && FILM.rod.t.fishGear.fish), tail: 1.3 },
    { id: "fortress", title: "A fortress", sub: "Walls and towers, gates that shut at night, an armoury, catapults, griffins on patrol", secs: 6,
      setup: async () => { clock("10:00"); const w = C.fort.walls, Rg = App.regions[C.R], pts = (w.gates || []).map((a) => ({ x: w.x + Math.cos(a) * w.r, z: w.z + Math.sin(a) * w.r })), g = near(pts, Rg.cx, Rg.cz) || w; FILM.gate = { g, th: Math.atan2(g.x - w.x, g.z - w.z) }; at(g.x, g.z, 26, 1.15, FILM.gate.th + 0.3); await ready(); },
      cam: () => { const w = C.fort.walls, G = FILM.gate; return move({ x: G.g.x, z: G.g.z, r: 26, phi: 1.15, th: G.th + 0.3 }, { x: w.x, z: w.z, r: 175, phi: 1.0, th: G.th + 0.05 }); } },
    { id: "griffin", title: "First person", sub: "See through your Tickle's eyes: here, flying its griffin over the castle", noWarm: true, secs: 3.5,
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
        // already up and out between the keep and the wall, flying round the castle (it started on the ground by the
        // keep and flew into it); the eyes are turned down in the shot
        const W0 = v.walls, R0 = W0 ? W0.r * 0.82 : 50, cx = W0 ? W0.x : v.x, cz = W0 ? W0.z : v.z, a0 = Math.atan2(rider.pos.x - cx, rider.pos.z - cz);
        rider.pos.x = cx + Math.sin(a0) * R0; rider.pos.z = cz + Math.cos(a0) * R0; rider.heading = a0 + Math.PI / 2; a.alt = 16;
        App.keys.add("KeyW"); FILM.rider = rider; FILM.riderTurn = { cx, cz, R0 };
        await wait(1200);
      },
      // (the eyes turned well down, so that the castle and the walls pass beneath)
      // (a slow, steady turn round the castle: the heading set once towards it and then turned a little each frame;
      // aimed at the keep every frame it spun on the spot when the rider passed close to it)
      cam: () => { const t = FILM.rider; let looked = false, h = null; return (u, dt) => { if (h == null) h = t.heading; h += (dt || DT) * 0.17; t.heading = h; if (t.action && t.action.kind === "fp") t.action.alt = 16; if (!looked) { App.fpLook(0, 140); looked = true; } }; },
      after: async () => { App.keys.clear(); } },
    // the same rider seen from the side, in third person: the griffin in profile, the castle behind it (asked 14
    // November: a few moments through its eyes, then the griffin itself in the air). The film flies it round the
    // keep itself; the game's own first-person flight ends with the first-person view.
    { id: "griffinside", title: null, noWarm: true, secs: 6,
      setup: async () => {
        const t = FILM.rider; if (!t || App.isKO(t.id)) throw new Error("no rider");
        const W0 = C.fort.walls, v = W0 ? { x: W0.x, z: W0.z } : C.fort, a0 = t.action || {};
        App.keys.clear(); if (App.fpOn && App.fpOn()) App.exitFP();
        // (round the fortress just outside its wall, the camera further out looking in: the griffin in profile, the
        // wall and the castle behind it)
        FILM.fly = { t, v, R0: W0 ? W0.r + 9 : 60, a: Math.atan2(t.pos.x - v.x, t.pos.z - v.z), R: Math.max(40, Math.hypot(t.pos.x - v.x, t.pos.z - v.z)), alt: Math.max(8, a0.alt || 0) };
        FILM.fly.step = (dt) => {
          const F = FILM.fly, T = F.t; F.stepped = true; F.a += dt * 0.22; F.R += (F.R0 - F.R) * Math.min(1, dt * 0.8); F.alt += (12 - F.alt) * Math.min(1, dt * 0.6);
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
      // (the camera set here after the game's own camera code, at the griffin's height: the game keeps the view's
      // target on the ground)
      cam: () => (u, dt) => {
        const F = FILM.fly; if (!F.stepped) F.step(dt || DT); F.stepped = false; cam.follow = null; cam.fly = null;
        const T = F.t.pos; cam.target.set(T.x, T.y + 0.8, T.z); cam.radius = 16; cam.phi = 1.1; cam.theta = F.a + 0.4;
        const c = App.camera; c.position.set(T.x + 16 * Math.sin(1.1) * Math.sin(cam.theta), T.y + 0.8 + 16 * Math.cos(1.1), T.z + 16 * Math.sin(1.1) * Math.cos(cam.theta)); c.lookAt(T.x, T.y + 0.8, T.z);
      },
      after: async () => { const F = FILM.fly; if (F && F.t) { F.t.action = null; F.t.flyY = null; } cam.follow = null; FILM.fly = null; if (FILM.stepFP0) { App.stepFP = FILM.stepFP0; FILM.stepFP0 = null; } if (FILM.range0 != null) { App.RANGE.full = FILM.range0; FILM.range0 = null; } App.MAX_FULL = 96; await leave(); } },
    { id: "spear", title: "Diving and spearfishing", sub: "Down to the reefs, the wrecks and the pearl beds; a harpoon for their fish", noWarm: true, secs: 9,
      setup: async () => {
        clock("11:40");
        // (the reef or wreck whose water is deepest round it: the shallow ones lie along slopes of sand)
        if (!App.diveSites.length) await until(() => App.diveSites.length > 0, 30); // (the dive sites are laid out a little after the world loads)
        const depth = (q) => { let d = 0; for (let k = 0; k < 8; k++) { const a = k * 0.785; d += App.WATER_Y - App.seaFloorY(q.x + Math.sin(a) * 8, q.z + Math.cos(a) * 8); } return d / 8; };
        // (the fish swim only where the sea round the camera is loaded: the sites are tried deepest first until one
        // has schools in deep water near it)
        const deepFish = (x, z) => App.seaFishNear(x, App.WATER_Y - 3, z, 90).filter((f) => App.seaFloorY(f.x, f.z) < App.WATER_Y - 5);
        let reef = null;
        for (const q of App.diveSites.filter((q) => q.kind === "reef" || q.kind === "wreck").sort((a, b) => depth(b) - depth(a)).slice(0, 6)) {
          at(q.x, q.z, 20, 1.0, 0); await ready(6);
          if (deepFish(q.x, q.z).length >= 3) { reef = q; break; }
        }
        if (!reef) throw new Error("no fish in deep water near any reef");
        // (out on the reef nobody is about: a Tickle of the nearest village is brought in)
        let t = st.tickles.find((q) => !App.isKO(q.id) && !q.riding && !(q.action && q.action.kind === "fp") && Math.hypot(q.pos.x - reef.x, q.pos.z - reef.z) < 80);
        if (!t) {
          const v = near(App.villages, reef.x, reef.z), id = v && v.residents.find((q) => !App.isKO(q) && !(App.isDead && App.isDead(q)));
          if (id == null) throw new Error("nobody to spear");
          App.forcePromote(id); await until(() => !!App.pop.agent[id], 12); App.pinned = null; t = App.pop.agent[id];
        }
        if (!t) throw new Error("nobody to spear");
        await leave(); App.endAction(t);
        t.pos.x = reef.x + 2; t.pos.z = reef.z + 2; t.pos.y = App.WATER_Y - 0.7;
        cam.target.set(reef.x, App.WATER_Y, reef.z);
        st.mode = "manual"; await wait(1200); App.enterFP(t.id); await wait(600);
        App.keys.add("KeyC"); await wait(2400); App.keys.delete("KeyC");
        // beside the nearest school, looking at one of its fish
        const ey = () => t.pos.y + (t.height || 3) * 0.8;
        const far = deepFish(t.pos.x, t.pos.z);
        if (!far.length) throw new Error("no fish");
        // (in open water: a fish of a school, the diver five blocks off it at its height, with clear water between
        // them and below; asked 25 November, it was shot against a slope of sand with the fish far off)
        const open = (x, z, y) => !App.isLand(x, z) && App.seaFloorY(x, z) < y - 1.6;
        let pick = null;
        for (const f of far.slice(0, 60)) {
          const school = far.filter((g) => Math.hypot(g.x - f.x, g.z - f.z) < 4).length;
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * 6.283, px = f.x - Math.sin(a) * 5.5, pz = f.z - Math.cos(a) * 5.5, ey0 = f.y + 0.3;
            // (clear water from the diver to the fish and on beyond it: open water behind the fish, not a bank)
            let ok = true; for (let q = 0; q <= 12 && ok; q++) { const u = q / 6; ok = open(px + (f.x - px) * u, pz + (f.z - pz) * u, ey0 + (u > 1 ? 0.8 : 0)); }
            if (ok && open(px, pz, ey0 - 1) && (!pick || school > pick.school)) pick = { f, px, pz, ey0, school };
          }
          if (pick && pick.school >= 4) break;
        }
        if (!pick) throw new Error("no fish in open water");
        const f0 = pick.f;
        // (it starts further off and swims up to the school: four more blocks back along the same clear line)
        const ux = (f0.x - pick.px) / 5.5, uz = (f0.z - pick.pz) / 5.5, bx = pick.px - ux * 4, bz = pick.pz - uz * 4, back = open(bx, bz, pick.ey0) && open(bx, bz, pick.ey0 - 1);
        t.pos.x = back ? bx : pick.px; t.pos.z = back ? bz : pick.pz; t.pos.y = pick.ey0 - (t.height || 3) * 0.8; t.heading = Math.atan2(f0.x - t.pos.x, f0.z - t.pos.z);
        // (in first person the depth is the dive's: set so that the eyes are at the fish's height)
        if (t.action && t.action.kind === "fp") { t.action.water = true; t.action.dive = Math.max(0.7, (App.WATER_Y - 0.95) - t.pos.y); }
        cam.target.set(t.pos.x, t.pos.y, t.pos.z);
        await wait(1200);
        FILM.spear = { t, f0, aim: () => { const q = App.seaFishNear(t.pos.x, ey(), t.pos.z, 14)[0]; if (!q) return null; t.heading = Math.atan2(q.x - t.pos.x, q.z - t.pos.z); const dd = Math.hypot(q.x - t.pos.x, q.z - t.pos.z); return Math.atan2(q.y - ey(), dd); }, thrown: false };
        if (FILM.spear.aim() == null) throw new Error("no fish near");
      },
      // (in third person, from behind and beside the diver, a little above: the Tickle with its harpoon swims up to
      // the school, follows a fish, throws; a couple of seconds after the strike; asked 25 November: in first person
      // it looked stuck and too quick to follow)
      cam: () => { const S = FILM.spear, t = S.t; return (u) => {
        if (!S.thrown) { const p = S.aim(); if (p != null) App.fpLook(0, 0); }
        const q = S.f0 && App.seaFishAt ? App.seaFishAt(S.f0) : null, d = q ? Math.hypot(q.x - t.pos.x, q.z - t.pos.z) : 0;
        if (!S.thrown && d > 5.5 && u < 0.6) App.keys.add("KeyW"); else App.keys.delete("KeyW");
        if (!S.thrown && u > 0.6) { S.thrown = true; App.keys.delete("KeyW"); t.forceHit = true; key("KeyB"); }
        // (the game's own view from behind the Tickle, as the mouse wheel gives it: the diver and its harpoon in sight)
        if (!S.back) { S.back = true; App.fpWheel && App.fpWheel(440); }
      }; },
      done: (u) => !!(FILM.spear && FILM.spear.t.spearCast && FILM.spear.t.spearCast.struck), tail: 2.2,
      after: async () => { App.keys.clear(); await leave(); } },
    { id: "seacave", title: "A sea cave", sub: "Only a diver finds the way in: dark blue stone, torches, treasure", secs: 4,
      setup: async () => { const c = near(App.seaCaves, C.dock.x, C.dock.z); await enter({ kind: "seacave", cave: c, door: c.door, name: c.name }); inFocus(0, 0); await wait(600); },
      cam: () => inOrbit({ r: 28, phi: 1.12, th: 0.4 }, { r: 22, phi: 1.05, th: -0.4 }), after: leave },
    { id: "kraken", title: "Sea beasts", sub: "A Kraken from the open sea, the Lake Serpent from the lake: the villages run to fight them", noWarm: true, secs: 7,
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
    // (in place of the hunt, where a griffin flew through again: Tickles on skateboards and roller skates, something
    // not seen before in the film; asked 25 November)
    { id: "skate", title: "Skateboards and skates", sub: "Every Tickle's on-chain item comes out to play: here, off to the next town on a board", secs: 7,
      setup: async () => {
        clock("16:30");
        // (a Tickle whose on-chain item is a skateboard or skates, and who has no horse or griffin, sent off to the
        // next town: on a trip that long it rides its board along the road, as the game has it; the camera keeps pace
        // beside it; asked 25 November: the skater hopped on the spot instead of going anywhere)
        const v = (C.town && C.town.residents.length >= 40) ? C.town : App.villages.filter((q) => q.residents.length >= 60).sort((a, b) => b.residents.length - a.residents.length)[0];
        const dest = App.villages.filter((q) => q !== v && Math.hypot(q.x - v.x, q.z - v.z) > 45 && Math.hypot(q.x - v.x, q.z - v.z) < 140).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[0];
        if (!dest) throw new Error("no town to skate to");
        at(v.x, v.z, 30, 1.0, 0.5); await ready(8);
        const wheels = (g) => g === "Skateboard" || g === "Skates";
        let t = st.tickles.find((q) => wheels(q.ground) && !(App.mountOf && App.mountOf(q.id)) && !App.isKO(q.id) && q.group.visible && Math.hypot(q.pos.x - v.x, q.pos.z - v.z) < 60);
        if (!t) {
          const id = v.residents.concat(dest.residents).find((q) => { const tr = App.traitsOf && App.traitsOf(q); return tr && wheels(tr.Ground) && !(App.mountOf && App.mountOf(q)) && !App.isKO(q); });
          if (id == null) throw new Error("no skater about");
          App.forcePromote(id); await until(() => !!App.pop.agent[id], 12); App.pinned = null; t = App.pop.agent[id];
        }
        if (!t) throw new Error("no skater about");
        App.endAction(t); t.pos.x = v.x + 2; t.pos.z = v.z + 2; t.pos.y = App.surfaceAt(t.pos.x, t.pos.z).y;
        App.startTravel(t, { x: dest.x, z: dest.z, label: dest.name }, "off to " + dest.name);
        FILM.skate = { t }; at(t.pos.x, t.pos.z, 9, 1.22, t.heading + 1.4); await wait(1500);
      },
      // (low and from the side, keeping pace with the skater)
      cam: () => { const S = FILM.skate; return follow(() => S.t, { r: 9, phi: 1.22, th: S.t.heading + 1.4, dth: 0.05 }); } },
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
    { id: "tame", title: "Taming", sub: "Seven kinds of wild creature, won over with a snack and raised for the arena", secs: 6,
      setup: async () => {
        clock("17:00"); const day = Math.floor(st.T / DAY);
        // (a taming out on dry land, in a meadow, a grove or by the falls, not at a pond, a beach or a pier where
        // others fish; asked 25 November)
        // (and the quietest of them: the fewest other Tickles about, no fire or party next to it)
        const spots = [];
        for (const v of App.villages) for (const id of v.residents) {
          const P = App.planOf(id, day), L = P.steps.find((s) => s.k === "leisure" && s.taming); if (!L) continue;
          const wet = /pond|beach|pier|shore|lake/i.test((L.p.type || "") + " " + (L.p.label || ""));
          let S = spots.find((q) => Math.hypot(q.p.x - L.p.x, q.p.z - L.p.z) < 10); if (!S) spots.push((S = { p: L.p, who: [], wet })); S.who.push(id);
        }
        if (!spots.length) throw new Error("no tamer today");
        const all = []; for (let id = 0; id < TB.SUPPLY; id += 3) { const q = App.planPos(id, st.T); if (!q.inside) all.push([q.x, q.z]); }
        for (const S of spots) S.crowd = all.filter(([x, z]) => Math.hypot(x - S.p.x, z - S.p.z) < 18).length * 3 - S.who.length + (S.wet ? 1000 : 0);
        spots.sort((a, b) => a.crowd - b.crowd);
        const spot = spots[0].p, who = spots[0].who;
        at(spot.x, spot.z, 24, 1.08, 0.5); await ready(6); FILM.tame = { spot, who };
        // (the horses and other mounts waiting about are led out of the shot, back after it)
        FILM.hidden = [];
        for (const t of st.tickles) { const o = App.mountObjOf && App.mountObjOf(t.id); if (o && o.visible && !t.riding && Math.hypot(o.position.x - spot.x, o.position.z - spot.z) < 28) { o.visible = false; FILM.hidden.push(o); } }
      },
      cam: () => { const T = FILM.tame; return follow(() => st.tickles.find((t) => T.who.includes(t.id)) || { pos: T.spot }, { r: 18, phi: 1.08, dth: 0.12 }); },
      after: () => { for (const o of FILM.hidden || []) o.visible = true; FILM.hidden = null; } },
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
    { id: "siege", title: "War between holders", sub: "Armies of fifty, a siege at the gate: the ram, the catapults, the archers on the walls", noWarm: true, secs: 8,
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
      // (wide and from the side, a little above the riders: the attackers' line of griffins over their ranks, the
      // defenders' line out in front of their wall, the walls shooting; asked 25 November)
      cam: () => { const F = FILM.war.front, th = Math.atan2(-F.ux, -F.uz), m = move({ x: F.x - F.ux * 10, z: F.z - F.uz * 10, y: App.surfaceAt(F.x, F.z).y + 7, r: 46, phi: 1.05, th: th + 1.35 }, { x: F.x - F.ux * 4, z: F.z - F.uz * 4, y: App.surfaceAt(F.x, F.z).y + 7, r: 40, phi: 1.0, th: th + 1.0 }); return (u) => { holdGate(); return m(u); }; },
      after: warNormal },
    { id: "arena", title: "The arena", sub: "A creature tournament every evening, the whole island in the stands", secs: 7,
      // (a bout is fought in the ring only when both tamers are in the flesh: the range of full Tickles is widened
      // for the shot, and the shot waits for a bout)
      // (the camera is at the arena before the tournament opens, so that the players are in the flesh when it does:
      // a bout whose tamers are not is decided off screen in an instant)
      setup: async () => {
        clock("17:18");
        // (the most striking creatures fight first: a tamed monster, then a griffin, then a fire creature; and the arena
        // is the one whose tournament has the most striking two; asked 25 November, more striking fights)
        const BASE = new Set(Object.keys(App.CREATURES)), score = (id) => { const c = App.leadCreature(id); if (!c) return 0; return !BASE.has(c.sp) ? 3 : c.sp === "griffin" ? 2 : c.sp === "cinderling" ? 1.5 : 1; };
        const dayK = Math.floor(st.T / DAY);
        const cands = App.arenas.filter(Boolean).map((A) => { const tr = st.tourneys[dayK + ":" + A.region]; const top = tr && tr.alive ? tr.alive.map(score).sort((x, y) => y - x) : []; return { A, v: (top[0] || 0) + (top[1] || 0) }; }).sort((x, y) => y.v - x.v);
        const a = (cands[0] && cands[0].v > 2 ? cands[0].A : C.arena); FILM.arenaA = a;
        FILM.range0 = App.RANGE.full; App.RANGE.full = 90; App.MAX_FULL = 120; at(a.x, a.z, 24, 0.9, a.rot - 0.45); await ready(12);
        const key = dayK + ":" + a.region, tr = st.tourneys[key];
        if (tr && !tr.current && !tr.queue && tr.alive && tr.alive.length > 3) tr.alive = tr.alive.slice().sort((x, y) => score(y) - score(x));
        await until(() => { const q = st.tourneys[key]; return q && q.current; }, 60); await wait(1200);
      },
      cam: () => { const a = FILM.arenaA || C.arena; return orbit({ x: a.x, z: a.z }, { r: 24, phi: 0.9, th: a.rot - 0.45 }, { r: 19, phi: 1.02, th: a.rot + 0.4 }); },
      after: () => { if (FILM.range0 != null) { App.RANGE.full = FILM.range0; FILM.range0 = null; } App.MAX_FULL = 96; } },
    { id: "casino", title: "The casino", sub: "Poker, blackjack, roulette, bingo and the slots, open from seven", secs: 8,
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
        // (one game, then another: the two tables of the room with the most players at them, close up, a cut between
        // them halfway; asked 25 November, instead of a pass through the room)
        const tabs = Object.entries(App.CASINO_LAYOUT.tables).filter(([k, P]) => P.room === ri && (P.kind === "poker" || P.kind === "blackjack"))
          .map(([k, P]) => ({ P, n: App.casinoOccupants(Cs, ri).filter((o) => o.table === k && o.pose === "cards").length })).sort((a, b) => b.n - a.n);
        await enter(T, { floor: ri }); FILM.casino = { ri, A: tabs[0] && tabs[0].P, B: (tabs[1] && tabs[1].n ? tabs[1] : tabs[0]) && (tabs[1] && tabs[1].n ? tabs[1] : tabs[0]).P };
        if (FILM.casino.A) inFocus(FILM.casino.A.x, FILM.casino.A.z); await wait(600);
      },
      cam: () => { const K = FILM.casino; let cut = false; const a = inOrbit({ r: 15, phi: 0.95, th: 0.6 }, { r: 13, phi: 0.9, th: 0.2 }), b = inOrbit({ r: 15, phi: 0.95, th: -0.5 }, { r: 13, phi: 0.9, th: -0.9 });
        return (u) => { if (u < 0.5) return a(u * 2); if (!cut && K.B) { cut = true; inFocus(K.B.x, K.B.z); } return b((u - 0.5) * 2); }; },
      after: leave },
    { id: "fire", title: "Dinner by the fire", sub: "Every evening, the whole place round the square's fire", secs: 6,
      setup: async () => { clock("20:40"); const v = C.keep; at(v.x, v.z, 26, 1.12, 0.4); await ready(); },
      cam: () => { const v = C.keep; return orbit({ x: v.x, z: v.z }, { r: 26, phi: 1.14, th: 0.4 }, { r: 20, phi: 1.06, th: 1.2 }); } },
    { id: "song", title: "The Song Contest", sub: "A song each on the stage; the winning song becomes the island's", secs: 4,
      setup: async () => {
        clock("21:25"); const day = Math.floor(st.T / DAY);
        let c = null; for (const k in st.contests) { const q = st.contests[k]; if (q && q.day === day && q.kind === "music") c = q; }
        if (!c && App.debugContest) { c = App.debugContest("music", C.R); for (let r = 0; !c && r < App.regions.length; r++) c = App.debugContest("music", r); }
        if (!c) throw new Error("no song contest today");
        const Vn = App.contestVenue(c.region, "square"); at(Vn.x, Vn.z, 20, 0.98, Vn.rot); await ready(); FILM.song = Vn;
      },
      // (from out in front of the stage, above the crowd, looking at the singer: the stage's own layout gives where it
      // stands and which way the crowd is; asked 25 November, it was shot from behind)
      cam: () => { const Vn = FILM.song, st0 = Vn.L ? Vn.L(0, -1.5) : Vn, fr = Vn.L ? Vn.L(0, 8) : { x: Vn.x + Math.sin(Vn.rot) * 8, z: Vn.z + Math.cos(Vn.rot) * 8 }, th = Math.atan2(fr.x - st0.x, fr.z - st0.z);
        return orbit({ x: st0.x, z: st0.z, y: App.surfaceAt(st0.x, st0.z).y + 2 }, { r: 20, phi: 0.98, th: th + 0.25 }, { r: 15, phi: 1.02, th: th - 0.2 }); } },
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
    // (a scene starts from the ordinary view: out of first person, the camera following nobody; the griffin's side
    // shot carries on from the first-person one and takes care of that itself)
    if (S.id !== "griffinside") { if (App.fpOn && App.fpOn()) { App.keys.clear(); App.exitFP(); } cam.follow = null; cam.fly = null; }
    try { await S.setup(); } catch (e) { log("skipped " + S.id + ": " + (e && e.message) + (e && e.stack ? " @ " + String(e.stack).split("\n").slice(1, 3).join(" ").replace(/https?:\/\/[^/]+\//g, "") : "")); try { if (S.after) await S.after(); } catch (e2) { /* */ } return false; }
    // (the camera first visits where the shot ends, so that the land and the models there are in before the shot
    // starts; not for the shots whose camera moves a Tickle about)
    if (!S.noWarm && !App.inside && !(App.fpOn && App.fpOn())) {
      const save = { t: cam.target.clone(), r: cam.radius, p: cam.phi, th: cam.theta, f: cam.follow };
      try { const probe = S.cam(); if (typeof probe === "function") { probe(1, 0); await ready(6); } } catch (e) { /* */ }
      cam.target.copy(save.t); cam.radius = save.r; cam.phi = save.p; cam.theta = save.th; cam.follow = save.f; await ready(4);
    }
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
    // (the land is built further out round the camera while the film is made: a low shot looking far over the lake
    // showed a corner not yet built; asked 25 November)
    FILM.chunks0 = App.RANGE.chunks; App.RANGE.chunks = 7;
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
    FILM.manual = false; App.MAX_FULL = null; warNormal(); if (FILM.chunks0 != null) { App.RANGE.chunks = FILM.chunks0; FILM.chunks0 = null; }
    FILM.took = Math.round((performance.now() - t0) / 1000);
    FILM.secs = Math.round(rec.n / FILM.fps);
    FILM.status = stopNow ? "stopped" : "done";
    log("done: " + FILM.done.length + " scenes, " + FILM.skipped.length + " skipped, " + FILM.secs + " s, " + Math.round(FILM.bytes / 1e6) + " MB");
    return FILM.status;
  };
  FILM.preview = async (id) => {
    const S = SCENES.find((s) => s.id === id);
    if (!S) return "no scene " + id;
    C = C || cast(); fix(); looping = true; App.MAX_FULL = App.MAX_FULL || 96; App.RANGE.chunks = Math.max(App.RANGE.chunks, 7);
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
