/* First person: the world through a Tickle's eyes. Any Tickle: ride along with it through its day (a
 * kart race, a regatta, a dive, a night at the casino door...), looking round by dragging. One of your own
 * while you are in control: walk it yourself with WASD (Shift to run, it swims if you take it into the
 * water), turn by dragging or with Z/X and the arrow keys, E to go into the building in front of it, Esc
 * to leave. Its own body is hidden so it does not fill the view, but its arms and whatever they hold
 * are there; under the water the view turns blue and hazy. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const FOV = 72, FOV0 = 40;
  let fp = null; // { id, look, pitch, drive }
  App.fpOn = () => !!fp;
  App.fpId = () => (fp ? fp.id : null);
  App.fpDriving = () => !!(fp && fp.drive);
  const agentOf = (id) => App.pop.agent[id] || null;
  const hud = () => document.getElementById("fpHud");
  function showHud(t) {
    const el = hud();
    if (!el) return;
    el.innerHTML = "<b>" + t.name.replace(/[<>&]/g, "") + "</b> \u00b7 " + (fp.drive ? "WASD to walk, Shift to run \u00b7 drag or Z/X to turn \u00b7 E to go in" + (App.mountOf && App.mountOf(t.id) ? " \u00b7 M to " + (App.mountOf(t.id).fly ? "mount its griffin (Space up, C down)" : "mount its horse") : "") : "riding along: drag to look round") + ' \u00b7 <button class="btn" id="fpLeave">Leave (Esc)</button>';
    el.hidden = false;
  }
  App.enterFP = (id) => {
    const t = agentOf(id);
    if (!t) { App.toast("Get closer first: that Tickle is not in view."); return; }
    if (App.inside && App.leaveInterior) App.leaveInterior();
    if (fp) App.exitFP();
    fp = { id, look: 0, pitch: -0.06, drive: App.canOrder(t) };
    if (fp.drive) { App.endAction(t); t.queue = []; t.action = { kind: "fp", order: true, started: st.T }; }
    App.cam.follow = id; App.cam.fly = null;
    App.camera.fov = FOV; App.camera.updateProjectionMatrix();
    showHud(t);
  };
  App.exitFP = () => {
    if (!fp) return;
    const t = agentOf(fp.id);
    if (t) { t.mesh.visible = true; if (t.tagEl) t.tagEl.style.visibility = ""; if (t.action && t.action.kind === "fp") t.action = null; }
    fp = null;
    App.camera.fov = FOV0; App.camera.updateProjectionMatrix();
    App.cam.radius = 18; App.cam.phi = 0.95;
    if (App.scene.fog) { App.scene.fog.near = App.NO_FOG.near; App.scene.fog.far = App.NO_FOG.far; }
    tint(false);
    const el = hud();
    if (el) el.hidden = true;
  };
  // dragging turns the view: your own Tickle turns with it, a Tickle you ride along with does not
  App.fpLook = (dx, dy) => {
    if (!fp) return;
    const t = agentOf(fp.id);
    if (fp.drive && t) t.heading -= dx * 0.005; else fp.look -= dx * 0.005;
    fp.pitch = Math.max(-1.2, Math.min(1.0, fp.pitch - dy * 0.004));
  };
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
  };
  // the camera at its eyes, looking the way it looks
  const EYE = new THREE.Vector3(), DIR = new THREE.Vector3();
  App.fpCamera = (camera) => {
    const t = fp && agentOf(fp.id);
    if (!t || App.inside) return false;
    t.mesh.visible = false;
    if (t.tagEl) t.tagEl.style.visibility = "hidden";
    t.group.updateMatrixWorld(true);
    t.pivot.localToWorld(EYE.set(0, (t.height || 3) * 0.8, 0.55));
    // under the water the eyes follow the body: a diver lying along the bottom looks down at it
    const under = EYE.y < App.WATER_Y - 0.3, pitch = Math.max(-1.1, fp.pitch - (under ? Math.max(0, t.pivot.rotation.x) * 0.25 : 0));
    // and never with its nose in the sand
    if (under) EYE.y = Math.max(EYE.y, App.columnHeight(Math.floor(EYE.x), Math.floor(EYE.z)) + 1.3);
    const yaw = t.heading + fp.look, cp = Math.cos(pitch);
    DIR.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
    camera.position.copy(EYE);
    camera.lookAt(EYE.x + DIR.x, EYE.y + DIR.y, EYE.z + DIR.z);
    // under the water: blue and hazy
    const fog = App.scene.fog;
    if (fog) {
      if (EYE.y < App.WATER_Y) { fog.color.setHex(0x1b6f8a).convertSRGBToLinear(); App.scene.background = fog.color; fog.near = 0.5; fog.far = 16; }
      else { fog.near = App.NO_FOG.near; fog.far = App.NO_FOG.far; }
    }
    tint(EYE.y < App.WATER_Y);
    return true;
  };
  // the water between the eyes and everything else
  function tint(on) { const el = document.getElementById("uwTint"); if (el && el.hidden === on) el.hidden = !on; }
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
    const run = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const moving = (f || s) && dm > 0;
    // M: into the saddle or out of it (wealth.js keeps the mount under it)
    const mDown = keys.has("KeyM");
    if (mDown && !a.mWas && App.mountOf && App.mountOf(t.id)) { a.ride = !a.ride; if (!a.ride) { a.alt = 0; t.flyY = null; } const el = hud(); if (el && fp) showHud(t); }
    a.mWas = mDown;
    const M = a.ride && App.fpSaddle ? App.fpSaddle(t, true) : null;
    if (!M && a.ride) a.ride = false;
    if (M) t.riding.moving = !!moving;
    if (M && M.fly) {
      // the griffin: up and down with Space and C, and over everything once it is off the ground
      if (keys.has("Space")) a.alt = Math.min(30, (a.alt || 0) + dtReal * 8);
      if (keys.has("KeyC")) a.alt = Math.max(0, (a.alt || 0) - dtReal * 8);
      const ground = Math.max(App.surfaceAt(t.pos.x, t.pos.z).y, App.WATER_Y);
      t.flyY = ground + (a.alt || 0); t.riding.alt = a.alt || 0;
      if (moving && (a.alt || 0) > 1.5) {
        const h = t.heading, len = Math.hypot(f, s), sp = (run ? 18 : 11) * Math.min(dtReal, 0.1);
        t.pos.x += ((Math.sin(h) * f - Math.cos(h) * s) / len) * sp; t.pos.z += ((Math.cos(h) * f + Math.sin(h) * s) / len) * sp;
        App.animateTickle(t, true, dtReal);
        return;
      }
    } else if (t.flyY != null && !M) t.flyY = null;
    if (moving) {
      const h = t.heading, len = Math.hypot(f, s);
      FWD.set((Math.sin(h) * f - Math.cos(h) * s) / len, 0, (Math.cos(h) * f + Math.sin(h) * s) / len);
      const speed = (run ? 7 : 3.6) * (a.water ? 0.55 : 1) * (M ? (M.fly ? 1.6 : M.mul * 0.8) : 1), want = speed * Math.min(dtReal, 0.1);
      // the same rules as any Tickle: no climbing cliffs, round the obstacles
      const keep = t.heading;
      App.walkTo(t, { x: t.pos.x + FWD.x * 2, z: t.pos.z + FWD.z * 2 }, dm, dtReal, true, want / Math.max(1e-6, App.WALK_SPEED * dm));
      t.heading = keep;
      if (run) t.walk += dtReal * 6;
    }
    a.water = !App.isLand(t.pos.x, t.pos.z);
    a.phase = a.water ? "doing" : null;
    App.animateTickle(t, !!moving, dtReal);
  };
  App.fpText = (t) => (t.riding ? (t.riding.fly ? "Flying its griffin, with you at the controls" : "Riding its horse, with you at the controls") : t.action && t.action.water ? "Swimming, with you at the controls" : "Walking, with you at the controls");
  document.addEventListener("click", (e) => { if (e.target.closest("#fpLeave")) App.exitFP(); });
})();
