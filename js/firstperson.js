/* First person: the world through a Tickle's eyes. Any Tickle: ride along with it through its day (a
 * kart race, a regatta, a dive, a night at the casino door...), looking round with the mouse. One of your own
 * while you are in control: walk it yourself with WASD (Shift to run, Space to jump, it swims if you take it
 * into the water), E to go into the building in front of it, Esc to leave. A click captures the mouse (pointer
 * lock) so it looks round as in any first-person game, and Esc frees it again; a crosshair names what is in
 * front, and a click opens the inspect window on it. The mouse wheel pulls the camera back behind the Tickle
 * (third person) and in again. On a touch screen a stick on the left walks and a drag on the right looks.
 * A HUD shows its health, its four needs and a compass. Its own body is hidden so it does not fill the view,
 * but its arms and whatever they hold are there; under the water the view turns blue and hazy. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const FOV = 72, FOV0 = 40, BACK_MAX = 14;
  let fp = null; // { id, look, pitch, drive, back, backT, stick, bobPh, bobAmp, eyeY, aimAt }
  App.fpOn = () => !!fp;
  App.fpId = () => (fp ? fp.id : null);
  App.fpDriving = () => !!(fp && fp.drive);
  const agentOf = (id) => App.pop.agent[id] || null;
  const $ = (id) => document.getElementById(id);
  const canvas = () => App.renderer.domElement;
  const locked = () => !!fp && document.pointerLockElement === canvas();
  App.fpLocked = locked;
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const esc = (s) => String(s).replace(/[<>&]/g, "");
  function showHud(t) {
    const el = $("fpHud");
    if (!el) return;
    const M = App.mountOf && App.mountOf(t.id);
    const mouse = coarse ? "" : locked() ? "Esc frees the mouse \u00b7 click to inspect" : "click to capture the mouse";
    const parts = fp.drive
      ? [coarse ? "stick to walk, drag to look" : "WASD to walk, Shift to run, Space to jump", mouse, "wheel: camera back", "E to go in"]
      : ["riding along", coarse ? "drag to look round" : mouse, "wheel: camera back"];
    if (fp.drive && M) parts.push("M to " + (M.fly ? "mount its griffin (Space up, C down)" : M.kind === "horse" ? "mount its horse" : "ride " + M.name.replace(/^Riding /, "its ").replace(/^Stag$/, "its stag")));
    el.innerHTML = "<span><b>" + esc(t.name) + '</b><span class="fh-keys"> \u00b7 ' + parts.filter(Boolean).join(" \u00b7 ") + '</span></span><button class="btn" id="fpLeave">Leave (Esc)</button>';
    el.hidden = false;
  }
  function show(on) {
    for (const id of ["fpCross", "fpCompass", "fpStats"]) { const el = $(id); if (el) el.hidden = !on; }
    document.body.classList.toggle("fpmode", on);
    if (!on) { const a = $("fpAim"); if (a) a.hidden = true; stickUI(null); }
  }
  App.enterFP = (id) => {
    const t = agentOf(id);
    if (!t) { App.toast("Get closer first: that Tickle is not in view."); return; }
    if (App.inside && App.leaveInterior) App.leaveInterior();
    if (fp) App.exitFP();
    fp = { id, look: 0, pitch: -0.06, drive: App.canOrder(t), back: 0, backT: 0, stick: null, bobPh: 0, bobAmp: 0, eyeY: null, aimAt: 0, lastT: performance.now() };
    if (fp.drive) { App.endAction(t); t.queue = []; t.action = { kind: "fp", order: true, started: st.T }; }
    App.cam.follow = id; App.cam.fly = null;
    App.camera.fov = FOV; App.camera.updateProjectionMatrix();
    buildCompass();
    show(true);
    showHud(t);
    hudStats(t);
  };
  App.exitFP = () => {
    if (!fp) return;
    const t = agentOf(fp.id);
    if (t) { t.mesh.visible = true; if (t.tagEl) t.tagEl.style.visibility = ""; if (t.action && t.action.kind === "fp") t.action = null; }
    fp = null;
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    App.camera.fov = FOV0; App.camera.updateProjectionMatrix();
    App.cam.radius = 18; App.cam.phi = 0.95;
    if (App.scene.fog) { App.scene.fog.near = App.NO_FOG.near; App.scene.fog.far = App.NO_FOG.far; }
    tint(false);
    show(false);
    const el = $("fpHud");
    if (el) el.hidden = true;
  };
  // looking round (a drag, or the mouse once it is captured): your own Tickle turns with it, one you ride along with does not
  App.fpLook = (dx, dy, k) => {
    if (!fp) return;
    k = k || 1;
    const t = agentOf(fp.id);
    if (fp.drive && t) t.heading -= dx * 0.005 * k; else fp.look -= dx * 0.005 * k;
    fp.pitch = Math.max(-1.2, Math.min(1.0, fp.pitch - dy * 0.004 * k));
  };
  // Esc: frees the captured mouse first (the browser does that itself); only an Esc with the mouse free leaves
  let unlockedAt = 0;
  App.fpEscape = () => {
    if (locked()) { document.exitPointerLock(); return true; }
    return performance.now() - unlockedAt < 250;
  };
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement) unlockedAt = performance.now();
    const t = fp && agentOf(fp.id);
    if (t) showHud(t);
    const c = $("fpCross");
    if (c) c.classList.toggle("free", !locked());
  });
  window.addEventListener("keydown", (e) => { if (fp && fp.drive && e.code === "Space" && !e.repeat) fp.jump = true; });
  document.addEventListener("mousemove", (e) => { if (locked()) App.fpLook(e.movementX || 0, e.movementY || 0, 0.7); });
  function lock(onFail) {
    const el = canvas();
    if (!el.requestPointerLock) { onFail(); return; }
    let failed = false;
    const fail = () => { if (!failed) { failed = true; onFail(); } document.removeEventListener("pointerlockerror", fail); };
    document.addEventListener("pointerlockerror", fail);
    try { const p = el.requestPointerLock(); if (p && p.catch) p.catch(fail); } catch (err) { fail(); }
  }
  // the mouse wheel: the camera back behind the Tickle (third person) and in again to its eyes
  App.fpWheel = (dy) => {
    if (!fp) return;
    fp.backT = Math.max(0, Math.min(BACK_MAX, fp.backT + dy * 0.012));
    if (fp.backT < 1) fp.backT = dy > 0 ? 1.6 : 0;
  };
  // ---------- pointers in first person (world.js hands them all here) ----------
  // mouse: a click captures it, a click while captured inspects what is under the crosshair; a drag looks round
  // (if the capture is refused). Touch: a stick on the left third walks your own Tickle, a drag elsewhere looks, a tap
  // inspects what was tapped.
  const ptrs = new Map();
  const ndcOf = (x, y) => { const r = canvas().getBoundingClientRect(); return { x: ((x - r.left) / r.width) * 2 - 1, y: -((y - r.top) / r.height) * 2 + 1 }; };
  App.fpPointer = (type, e) => {
    if (!fp) return;
    if (type === "down") {
      const r = canvas().getBoundingClientRect();
      const kind = locked() ? "aim" : e.pointerType === "touch" && fp.drive && e.clientX < r.left + r.width * 0.38 ? "stick" : "look";
      ptrs.set(e.pointerId, { kind, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false, touch: e.pointerType === "touch" });
      if (kind === "stick") { fp.stick = { f: 0, s: 0 }; stickUI(e.clientX, e.clientY, 0, 0); }
      return;
    }
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (type === "move") {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) p.moved = true;
      if (p.kind === "look" && p.moved) App.fpLook(dx, dy, p.touch ? 1.3 : 1);
      if (p.kind === "stick") {
        let vx = e.clientX - p.sx, vy = e.clientY - p.sy;
        const len = Math.hypot(vx, vy), R = 52;
        if (len > R) { vx *= R / len; vy *= R / len; }
        fp.stick = { f: -vy / R, s: vx / R };
        stickUI(p.sx, p.sy, vx, vy);
      }
      return;
    }
    ptrs.delete(e.pointerId);
    if (p.kind === "stick") { fp.stick = null; stickUI(null); return; }
    if (type !== "up" || p.moved) return;
    if (p.kind === "aim") { App.fpClick(); return; }
    // a click with the mouse free: capture it (or, where the browser will not, inspect what was clicked); a tap inspects
    const at = ndcOf(e.clientX, e.clientY);
    if (p.touch) App.fpClick(at);
    else lock(() => App.fpClick(at));
  };
  // what is under the crosshair (or the tapped spot), in the inspect window or the place card
  App.fpClick = (ndc) => { if (fp && App.onWorldClick) App.onWorldClick(ndc || { x: 0, y: 0 }); };
  function stickUI(x, y, vx, vy) {
    const el = $("fpStick");
    if (!el) return;
    if (x == null) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = x + "px"; el.style.top = y + "px";
    el.firstChild.style.transform = "translate(" + vx + "px," + vy + "px)";
  }
  // ---------- the HUD: health and needs, the compass, the name of what is in front ----------
  function hudStats(t) {
    const el = $("fpStats");
    if (!el) return;
    const max = App.maxHPOf ? Math.round(App.maxHPOf(t.id)) : 100, fight = t.hpMax > 0 && st.T - (t.hpAt || -1e9) <= 120;
    const now = fight ? Math.max(0, t.hp) : max, top = fight ? t.hpMax : max;
    const COL = { hunger: "#ffb24a", energy: "#7be08f", social: "#ff8fc0", fun: "#3cc6d8" };
    const bar = (label, v, col, txt) => '<div class="fs-row"><span>' + label + '</span><i><b style="width:' + Math.round(Math.max(0, Math.min(1, v)) * 100) + "%;background:" + col + '"></b></i><em>' + txt + "</em></div>";
    let h = '<div class="fs-name">' + esc(t.name) + "</div>" + bar("Health", now / top, now / top < 0.3 ? "#e8443a" : "#e86a5a", Math.round(now) + "/" + Math.round(top));
    for (const k of App.NEEDS || []) h += bar((App.NEED_LABEL && App.NEED_LABEL[k]) || k, t.needs[k] / 100, COL[k] || "#9fb", Math.round(t.needs[k]));
    el.innerHTML = h;
  }
  const PX = 2.2; // compass pixels per degree
  function buildCompass() {
    const el = $("fpCompass");
    if (!el || el.firstChild) return;
    const strip = document.createElement("div");
    strip.className = "strip";
    const N = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
    let h = "";
    for (let d = -360; d <= 720; d += 15) {
      const m = ((d % 360) + 360) % 360, L = N[m];
      h += '<span class="' + (L ? (L.length === 1 ? "c" : "ic") : "t") + '" style="left:' + (d + 360) * PX + 'px">' + (L || "") + "</span>";
    }
    strip.innerHTML = h;
    el.appendChild(strip);
  }
  function compass(yaw) {
    const el = $("fpCompass");
    if (!el || !el.firstChild) return;
    // the map's north is towards -z: a Tickle looking that way has a heading of pi
    const bearing = ((((Math.PI - yaw) * 180) / Math.PI) % 360 + 360) % 360;
    el.firstChild.style.transform = "translateX(" + (el.clientWidth / 2 - (bearing + 360) * PX) + "px)";
  }
  function aim() {
    const el = $("fpAim");
    if (!el) return;
    let name = null;
    App.inspectSkip = fp.id;
    try {
      const seen = App.inspectPick ? App.inspectPick({ x: 0, y: 0 }) : null;
      if (seen && seen.d < 36) { const o = seen.fn(); name = o && (o.title || o.name); }
      if (!name && App.pickPlace) { const P = App.pickPlace(App.rayFrom({ x: 0, y: 0 })); if (P && P.name && P.dist < 70) name = P.name; }
    } finally { App.inspectSkip = null; }
    el.textContent = name || "";
    el.hidden = !name;
    const c = $("fpCross");
    if (c) c.classList.toggle("on", !!name);
  }
  // every frame, instead of moving the map: keys turn the view, and the world streams round the Tickle
  App.fpFollow = (dt, keys) => {
    const t = fp && agentOf(fp.id);
    if (!t) { App.exitFP(); return; }
    let turn = 0;
    if (keys.has("KeyZ") || (fp.drive && keys.has("ArrowLeft"))) turn += 1;
    if (keys.has("KeyX") || (fp.drive && keys.has("ArrowRight"))) turn -= 1;
    if (turn) { if (fp.drive) t.heading += turn * dt * 2; else fp.look += turn * dt * 2; }
    App.cam.target.set(t.pos.x, t.pos.y + 1, t.pos.z);
    App.cam.follow = fp.id;
    fp.back += (fp.backT - fp.back) * Math.min(1, dt * 8);
    const now = performance.now();
    if (now - fp.aimAt > 220) { fp.aimAt = now; hudStats(t); aim(); }
  };
  // the camera at its eyes (or behind it, pulled back with the wheel), looking the way it looks
  const EYE = new THREE.Vector3(), DIR = new THREE.Vector3(), POS = new THREE.Vector3();
  App.fpCamera = (camera) => {
    const t = fp && agentOf(fp.id);
    if (!t || App.inside) return false;
    const now = performance.now(), dt = Math.min(0.1, (now - fp.lastT) / 1000);
    fp.lastT = now;
    const third = fp.back > 0.8;
    t.mesh.visible = third;
    if (t.tagEl) t.tagEl.style.visibility = "hidden";
    t.group.updateMatrixWorld(true);
    t.pivot.localToWorld(EYE.set(0, (t.height || 3) * 0.8, 0.55));
    // a steady head: the height eases after the body's own bounce, then a gentle bob while walking
    if (fp.eyeY == null || Math.abs(EYE.y - fp.eyeY) > 2.5) fp.eyeY = EYE.y;
    fp.eyeY += (EYE.y - fp.eyeY) * Math.min(1, dt * 14);
    EYE.y = fp.eyeY + Math.sin(fp.bobPh * 2) * 0.06 * fp.bobAmp;
    const sway = Math.cos(fp.bobPh) * 0.035 * fp.bobAmp;
    // under the water the eyes follow the body: a diver lying along the bottom looks down at it
    const under = EYE.y < App.WATER_Y - 0.3, pitch = Math.max(-1.1, fp.pitch - (under ? Math.max(0, t.pivot.rotation.x) * 0.25 : 0));
    // and never with its nose in the sand
    if (under) EYE.y = Math.max(EYE.y, App.columnHeight(Math.floor(EYE.x), Math.floor(EYE.z)) + 1.3);
    const yaw = t.heading + fp.look, cp = Math.cos(pitch);
    DIR.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
    EYE.x += Math.cos(yaw) * sway; EYE.z -= Math.sin(yaw) * sway;
    if (third) {
      // behind and a little above, looking past its head; never under the ground
      POS.set(EYE.x - DIR.x * fp.back, EYE.y - DIR.y * fp.back + fp.back * 0.22, EYE.z - DIR.z * fp.back);
      const g = App.columnHeight(Math.floor(POS.x), Math.floor(POS.z)) + 0.8;
      if (POS.y < g) POS.y = g;
      camera.position.copy(POS);
      camera.lookAt(EYE.x + DIR.x * 3, EYE.y + DIR.y * 3, EYE.z + DIR.z * 3);
    } else {
      camera.position.copy(EYE);
      camera.lookAt(EYE.x + DIR.x, EYE.y + DIR.y, EYE.z + DIR.z);
    }
    compass(yaw);
    // under the water: blue and hazy
    const wet = camera.position.y < App.WATER_Y, fog = App.scene.fog;
    if (fog) {
      if (wet) { fog.color.setHex(0x1b6f8a).convertSRGBToLinear(); App.scene.background = fog.color; fog.near = 0.5; fog.far = 16; }
      else { fog.near = App.NO_FOG.near; fog.far = App.NO_FOG.far; }
    }
    tint(wet);
    return true;
  };
  // the water between the eyes and everything else
  function tint(on) { const el = $("uwTint"); if (el && el.hidden === on) el.hidden = !on; }
  // your own Tickle, walked by you (sim.js: action kind "fp")
  const FWD = new THREE.Vector3();
  App.stepFP = (t, a, dm, dtReal) => {
    if (!fp || fp.id !== t.id) { t.action = null; return; }
    const keys = App.keys || new Set();
    let f = 0, s = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) f += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) f -= 1;
    if (keys.has("KeyD")) s += 1;
    if (keys.has("KeyA")) s -= 1;
    if (fp.stick) { f += fp.stick.f; s += fp.stick.s; }
    const mag = Math.min(1, Math.hypot(f, s));
    const run = keys.has("ShiftLeft") || keys.has("ShiftRight") || (fp.stick && Math.hypot(fp.stick.f, fp.stick.s) > 0.95);
    const moving = mag > 0.12 && dm > 0;
    // the head bob follows the stride
    fp.bobAmp += ((moving && !a.water && !a.ride ? (run ? 1.3 : 1) : 0) - fp.bobAmp) * Math.min(1, dtReal * 6);
    if (moving) fp.bobPh += dtReal * (run ? 11 : 7.5);
    // M: into the saddle or out of it (wealth.js keeps the mount under it)
    const mDown = keys.has("KeyM");
    if (mDown && !a.mWas && App.mountOf && App.mountOf(t.id)) { a.ride = !a.ride; if (!a.ride) { a.alt = 0; t.flyY = null; } if (fp) showHud(t); }
    a.mWas = mDown;
    const M = a.ride && App.fpSaddle ? App.fpSaddle(t, true) : null;
    if (!M && a.ride) a.ride = false;
    if (M) t.riding.moving = !!moving;
    // Space on foot (and on dry land): a jump
    // (a press is remembered even when it is shorter than a frame)
    if (fp.jump && !M && !a.water && !(a.jy > 0)) { a.vy = 7; a.jy = 0.001; }
    fp.jump = false;
    if (M && M.fly) {
      // the griffin: up and down with Space and C, and over everything once it is off the ground
      if (keys.has("Space")) a.alt = Math.min(30, (a.alt || 0) + dtReal * 8);
      if (keys.has("KeyC")) a.alt = Math.max(0, (a.alt || 0) - dtReal * 8);
      const ground = Math.max(App.surfaceAt(t.pos.x, t.pos.z).y, App.WATER_Y);
      t.flyY = ground + (a.alt || 0); t.riding.alt = a.alt || 0;
      if (moving && (a.alt || 0) > 1.5) {
        const h = t.heading, len = Math.hypot(f, s), spd = (run ? 18 : 11) * mag * Math.min(dtReal, 0.1);
        t.pos.x += ((Math.sin(h) * f - Math.cos(h) * s) / len) * spd; t.pos.z += ((Math.cos(h) * f + Math.sin(h) * s) / len) * spd;
        App.animateTickle(t, true, dtReal);
        return;
      }
    } else if (t.flyY != null && !M) t.flyY = null;
    if (moving) {
      const h = t.heading, len = Math.hypot(f, s);
      FWD.set((Math.sin(h) * f - Math.cos(h) * s) / len, 0, (Math.cos(h) * f + Math.sin(h) * s) / len);
      const speed = (run ? 7 : 3.6) * mag * (a.water ? 0.55 : 1) * (M ? (M.fly ? 1.6 : M.mul * 0.8) : 1), want = speed * Math.min(dtReal, 0.1);
      // the same rules as any Tickle: no climbing cliffs, round the obstacles
      const keep = t.heading;
      App.walkTo(t, { x: t.pos.x + FWD.x * 2, z: t.pos.z + FWD.z * 2 }, dm, dtReal, true, want / Math.max(1e-6, App.WALK_SPEED * dm));
      t.heading = keep;
      if (run) t.walk += dtReal * 6;
    }
    a.water = !App.isLand(t.pos.x, t.pos.z);
    a.phase = a.water ? "doing" : null;
    App.animateTickle(t, !!moving && !(a.jy > 0), dtReal);
    // up in the air: the jump rides on top of where the body stands
    if (a.jy > 0) {
      a.vy -= 22 * Math.min(dtReal, 0.05);
      a.jy += a.vy * Math.min(dtReal, 0.05);
      if (a.jy <= 0) { a.jy = 0; a.vy = 0; } else t.group.position.y += a.jy;
    }
  };
  App.fpText = (t) => (t.riding ? (t.riding.fly ? "Flying its griffin, with you at the controls" : "Riding " + (App.mountOf && App.mountOf(t.id) && App.mountOf(t.id).kind !== "horse" ? App.mountOf(t.id).name.replace(/^Riding /, "its ").replace(/^Stag$/, "its stag") : "its horse") + ", with you at the controls") : t.action && t.action.water ? "Swimming, with you at the controls" : "Walking, with you at the controls");
  document.addEventListener("click", (e) => { if (e.target.closest("#fpLeave")) App.exitFP(); });
})();
