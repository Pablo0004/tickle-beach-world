/* First person: the world through a Tickle's eyes. Any Tickle: ride along with it through its day (a
 * kart race, a regatta, a dive, a night at the casino door...), looking round with the mouse. One of your own
 * while you are in control: walk it yourself with WASD (Shift to run, Space to jump, it swims if you take it
 * into the water), E to go into the building in front of it, Esc to leave. A click captures the mouse (pointer
 * lock) so it looks round as in any first-person game, and Esc frees it again; a crosshair names what is in
 * front, and a click opens the inspect window on it. The mouse wheel pulls the camera back behind the Tickle
 * (third person) and in again. On a touch screen a stick on the left walks and a drag on the right looks.
 * A HUD shows its health, its four needs and a compass. Your own Tickle fights with an ability bar, as in a
 * MOBA: F a basic blow, Q and G two abilities and R the ultimate, each with its cooldown; which ones depends on
 * what it is (warrior, mage of its school, healer, tamer, or a plain brawler). The cave monsters fight back.
 * T talks to the Tickle in front. On a touch screen the bar's buttons are tapped. A game controller works too
 * (standard layout): left stick to walk (pressed in to run), right stick to look, A jump (and up on a griffin, LT
 * down), X or RT the basic blow, Y Q, LB G, RB R, B talk, Back to mount, Start to leave.
 * In the water your own Tickle dives: C (or LT) to go down, Space (or A) to come up, swimming along the bottom with
 * the breaststroke; its breath runs out under the water (a bar in the HUD) and comes back at the surface; with no
 * breath left it loses health. Down at the mouth of a sea cave, E goes in (sea.js, interiors.js). Its own body is
 * hidden so it does not fill the view, but its arms and whatever they hold are there; under the water the view
 * turns blue-green and hazy (sea.js). */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const FOV = 72, FOV0 = 40, BACK_MAX = 14;
  let fp = null; // { id, look, pitch, drive, back, backT, stick, bobPh, bobAmp, eyeY, aimAt }
  App.fpOn = () => !!fp;
  // how high your own Tickle in first person is (a sea cave can only be gone into from down at its mouth)
  App.diverY = () => { const t = fp && fp.drive && agentOf(fp.id); return t ? t.pos.y : 99; };
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
      ? [coarse ? "stick to walk, drag to look" : "WASD to walk, Shift to run, Space to jump", mouse, coarse ? "" : "F, Q, G, R to fight, T to talk", coarse ? "" : "in the water C dives, Space comes up", "wheel: camera back", "E to go in"]
      : ["riding along", coarse ? "drag to look round" : mouse, "wheel: camera back"];
    if (fp.drive && M) parts.push("M to " + (M.fly ? "mount its griffin (Space up, C down)" : M.kind === "horse" ? "mount its horse" : "ride " + M.name.replace(/^Riding /, "its ").replace(/^Stag$/, "its stag")));
    // (only its name: the keys are in Menu > Controls, so they do not take up the screen)
    void parts;
    el.innerHTML = "<span><b>" + esc(t.name) + '</b></span><button class="btn" id="fpLeave">Leave</button>';
    el.hidden = false;
  }
  function show(on) {
    for (const id of ["fpCross", "fpCompass", "fpStats"]) { const el = $(id); if (el) el.hidden = !on; }
    const bar = $("fpBar");
    if (bar) bar.hidden = !(on && fp && fp.drive);
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
    if (fp.drive) buildBar(t);
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
  window.addEventListener("keydown", (e) => {
    if (!fp || !fp.drive || e.repeat) return;
    if (e.code === "Space") fp.jump = true;
    else if (SLOT_KEYS[e.code]) fp.act = SLOT_KEYS[e.code];
    else if (e.code === "KeyT") fp.act = "talk";
  });
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("#fpBar button"); if (b && fp && fp.drive) fp.act = b.dataset.act; });
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
  // ---------- a game controller (the browser's Gamepad API, standard layout) ----------
  const PAD_BTN = { 0: "jump", 1: "talk", 2: "F", 7: "F", 3: "Q", 4: "G", 5: "R" };
  const padWas = {};
  let padSeen = false;
  function pad(dt) {
    let gp = null;
    try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected) { gp = g; break; } } catch (err) { return; }
    if (!gp) { fp.pad = null; return; }
    const B = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), dz = (v) => (Math.abs(v || 0) < 0.15 ? 0 : v);
    const lx = dz(gp.axes[0]), ly = dz(gp.axes[1]), rx = dz(gp.axes[2]), ry = dz(gp.axes[3]);
    fp.pad = { f: -ly, s: lx, run: B(10), up: B(0), down: B(6), mount: B(8) };
    if (rx || ry) App.fpLook(rx * dt * 520, ry * dt * 420);
    if (fp.drive) for (const i in PAD_BTN) { const on = B(i); if (on && !padWas[i]) { if (PAD_BTN[i] === "jump") fp.jump = true; else fp.act = PAD_BTN[i]; } padWas[i] = on; }
    const start = B(9), leave = start && !padWas[9];
    padWas[9] = start;
    if (leave) App.exitFP();
  }
  window.addEventListener("gamepadconnected", () => { if (!padSeen) { padSeen = true; App.toast("Controller connected (its buttons: Menu > Controls)."); } });
  // ---------- the HUD: health and needs, the compass, the name of what is in front ----------
  function hudStats(t) {
    const el = $("fpStats");
    if (!el) return;
    const max = App.maxHPOf ? Math.round(App.maxHPOf(t.id)) : 100, fight = t.hpMax > 0 && st.T - (t.hpAt || -1e9) <= 120;
    const now = fight ? Math.max(0, t.hp) : max, top = fight ? t.hpMax : max;
    const COL = { hunger: "#ffb24a", energy: "#7be08f", social: "#ff8fc0", fun: "#3cc6d8" };
    const bar = (label, v, col, txt) => '<div class="fs-row"><span>' + label + '</span><i><b style="width:' + Math.round(Math.max(0, Math.min(1, v)) * 100) + "%;background:" + col + '"></b></i><em>' + txt + "</em></div>";
    let h = '<div class="fs-name">' + esc(t.name) + "</div>" + bar("Health", now / top, now / top < 0.3 ? "#e8443a" : "#e86a5a", Math.round(now) + "/" + Math.round(top));
    const a = t.action;
    if (a && a.kind === "fp" && (a.water || (a.tank != null && a.tank < 1)) && App.hasTank && App.hasTank(t.id)) h += bar("Tank", a.tank == null ? 1 : a.tank, a.tank < 0.2 ? "#ff6b5e" : "#ffd23f", Math.round((a.tank == null ? 1 : a.tank) * 10) + " min");
    if (a && a.kind === "fp" && (a.water || (a.air != null && a.air < 1))) h += bar("Breath", a.air == null ? 1 : a.air, a.air < 0.25 ? "#ff6b5e" : "#8fd3f4", Math.round((a.air == null ? 1 : a.air) * 100) + "%");
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
    let name = null, foe = false;
    const t = agentOf(fp.id), near = t && fp.drive ? inFront(t) : {};
    if (near.mon) { const M = (App.MONSTERS || {})[near.mon.kind] || {}; name = (M.name || "Monster") + " " + Math.max(0, Math.round(near.mon.hp)) + "/" + near.mon.max; foe = true; }
    else if (near.tk) name = near.tk.name + " \u00b7 " + App.relLabel(App.relGet(t.id, near.tk.id)) + (coarse ? "" : " \u00b7 T to talk");
    if (!name) App.inspectSkip = fp.id;
    if (!name) try {
      const seen = App.inspectPick ? App.inspectPick({ x: 0, y: 0 }) : null;
      if (seen && seen.d < 36) { const o = seen.fn(); name = o && (o.title || o.name); }
      if (!name && App.pickPlace) { const P = App.pickPlace(App.rayFrom({ x: 0, y: 0 })); if (P && P.name && P.dist < 70) name = P.name; }
    } finally { App.inspectSkip = null; }
    el.textContent = name || "";
    el.hidden = !name;
    const c = $("fpCross");
    if (c) { c.classList.toggle("on", !!name && !foe); c.classList.toggle("foe", foe); }
  }
  // ---------- acting from first person ----------
  // what is within reach in front of it: a cave monster to strike, a Tickle to talk to
  const REACH = 3.2, TALK = 4.8;
  function inFront(t) {
    const yaw = t.heading + fp.look;
    const ahead = (x, z, r) => {
      const dx = x - t.pos.x, dz = z - t.pos.z, d = Math.hypot(dx, dz);
      if (d > r) return -1;
      let da = Math.atan2(dx, dz) - yaw;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      return d < 1 || Math.abs(da) < 0.7 ? d : -1;
    };
    let mon = null, md = 1e9, tk = null, td = 1e9;
    for (const m of App.monstersNear ? App.monstersNear(t.pos.x, t.pos.z, REACH + 4) : []) { const d = ahead(m.x, m.z, REACH); if (d >= 0 && d < md) { md = d; mon = m; } }
    for (const o of st.tickles) {
      if (o === t || !o.group.visible || App.isKO(o.id) || App.isDead(o.id)) continue;
      const d = ahead(o.pos.x, o.pos.z, TALK);
      if (d >= 0 && d < td) { td = d; tk = o; }
    }
    return { mon, tk };
  }
  // ---------- the ability bar: F a basic blow, Q and G two abilities, R the ultimate ----------
  // Which abilities depends on what the Tickle is (guilds.js App.combatRole): a warrior, a mage of its school, a
  // healer, a tamer with its creature, or a plain brawler. Cooldowns are in real seconds.
  const SLOT_KEYS = { KeyF: "F", KeyQ: "Q", KeyG: "G", KeyR: "R" };
  const SLOTS = ["F", "Q", "G", "R"];
  const KITS = {
    warrior: {
      F: { name: "Strike", cd: 0.45, info: "A blow with its weapon at the monster in front." },
      Q: { name: "Cleave", cd: 6, info: "A wide swing that hits every monster in front." },
      G: { name: "Shield Wall", cd: 14, info: "For 5 seconds it takes less than half the damage." },
      R: { name: "Charge", cd: 30, info: "Rushes 9 blocks ahead and slams every monster on the way (triple damage)." },
    },
    mage: {
      F: { name: "Staff Blow", cd: 0.5, info: "A knock with the staff at the monster in front." },
      Q: { name: "Bolt", cd: 2.5, info: "Its school's spell at the monster it looks at, up to 16 blocks away." },
      G: { name: "Blink", cd: 10, info: "A jump through the air to 7 blocks ahead." },
      R: { name: "Nova", cd: 35, info: "A burst of its magic hitting every monster within 7 blocks (triple damage)." },
    },
    healer: {
      F: { name: "Staff Blow", cd: 0.5, info: "A knock with the staff at the monster in front." },
      Q: { name: "Mend", cd: 8, info: "Heals itself a third of its health." },
      G: { name: "Bless", cd: 10, info: "Heals the Tickle in front and lifts its spirits." },
      R: { name: "Sanctuary", cd: 45, info: "Heals itself and every Tickle within 8 blocks fully; the light burns monsters near." },
    },
    tamer: {
      F: { name: "Strike", cd: 0.45, info: "A blow at the monster in front." },
      Q: { name: "Sic 'em", cd: 4, info: "Its creature attacks the monster it looks at, up to 10 blocks away." },
      G: { name: "Roar", cd: 12, info: "Its creature roars: monsters within 6 blocks are stunned for a few seconds." },
      R: { name: "Stampede", cd: 30, info: "Its creature charges through everything in front up to 8 blocks (double and a half)." },
    },
    brawler: {
      F: { name: "Punch", cd: 0.45, info: "A punch at the monster in front." },
      Q: { name: "Kick", cd: 5, info: "A strong kick that pushes the monster back." },
      G: { name: "Sprint", cd: 12, info: "Runs almost twice as fast for 4 seconds." },
      R: { name: "Haymaker", cd: 25, info: "A huge blow at the monster in front (four times the damage)." },
    },
  };
  const roleOf = (t) => (App.combatRole && App.combatRole(t.id)) || "brawler";
  const kitOf = (t) => KITS[roleOf(t)] || KITS.brawler;
  App.fpKit = (id) => { const t = agentOf(id); return t ? { role: roleOf(t), kit: kitOf(t) } : null; };
  function buildBar(t) {
    const el = $("fpBar");
    if (!el) return;
    const K = kitOf(t);
    el.innerHTML = SLOTS.map((k) => '<button class="ab' + (k === "R" ? " ult" : "") + '" data-act="' + k + '" title="' + esc(K[k].name + ": " + K[k].info) + '"><kbd>' + k + "</kbd><span>" + esc(K[k].name) + "</span><i></i></button>").join("") +
      '<button class="ab talk" data-act="talk" title="Talk: a few words with the Tickle in front"><kbd>T</kbd><span>Talk</span><i></i></button>';
    fp.barRole = roleOf(t);
  }
  // the cooldowns drawn on the bar: the dark part shrinks as the ability comes back
  function drawBar(t, a) {
    const el = $("fpBar");
    if (!el || el.hidden) return;
    if (fp.barRole !== roleOf(t)) buildBar(t);
    const K = kitOf(t), now = performance.now(), cds = (a && a.cds) || {};
    for (const b of el.children) {
      const k = b.dataset.act, cd = K[k] ? K[k].cd * 1000 : 2500, left = Math.max(0, (k === "talk" ? (a && a.talkAt) || 0 : cds[k] || 0) + cd - now);
      const i = b.lastChild, h = Math.round((left / cd) * 100) + "%";
      if (i.style.height !== h) i.style.height = h;
      b.classList.toggle("cool", left > 0);
    }
  }
  const baseDmg = (t) => { const g = (App.gearOf && App.gearOf(t.id)) || {}; return (4 + App.levelOf(t.id) * 1.4 + Math.random() * 4) * (g.weapon ? 1.4 : 1) * (g.silver ? 1.5 : 1); }; // monsters fear silver
  const MCOL = { fire: "#ff7a2f", frost: "#8fd3f4", storm: "#fff4a0", arcane: "#c9a6ff", light: "#7be08f" };
  // a blow lands on a monster: it turns on the Tickle; at zero it falls and the Tickle gets its experience
  function hitMonster(t, a, m, dmg, col) {
    if (!m || m.dead) return;
    m.hp -= dmg; m.foe = t; a.foe = m;
    if (App.FX) { App.FX.number(App.scene, { x: m.x, y: (m.y || 0) + 2.2, z: m.z }, String(Math.round(dmg)), col || "#ffd23f"); App.FX.burst(App.scene, { x: m.x, y: (m.y || 0) + 1, z: m.z }, col || "#ffd23f", 6, 0.1); }
    if (m.hp <= 0) {
      const M = (App.MONSTERS || {})[m.kind] || { name: "monster", xp: 10 };
      App.monsterDown(m); if (a.foe === m) a.foe = null;
      if (App.giveXP) App.giveXP(t.id, M.xp);
      App.say(t, "Got it!", 2);
      App.toast(t.name + " beat a " + M.name + " (+" + M.xp + " xp).");
    }
  }
  const yawOf = (t) => t.heading + fp.look;
  // the monsters round it: within r, and (with a cone) in front
  function monstersAround(t, r, cone) {
    const yaw = yawOf(t), out = [];
    for (const m of App.monstersNear ? App.monstersNear(t.pos.x, t.pos.z, r + 4) : []) {
      if (m.dead) continue;
      const dx = m.x - t.pos.x, dz = m.z - t.pos.z, d = Math.hypot(dx, dz);
      if (d > r) continue;
      let da = Math.atan2(dx, dz) - yaw;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      if (!cone || d < 1 || Math.abs(da) < cone) out.push(m);
    }
    return out;
  }
  const nearestAhead = (t, r) => monstersAround(t, r, 0.45).sort((p, q) => Math.hypot(p.x - t.pos.x, p.z - t.pos.z) - Math.hypot(q.x - t.pos.x, q.z - t.pos.z))[0] || null;
  // a step straight ahead, stopping before water or a cliff
  function rush(t, dist) {
    const yaw = yawOf(t), dx = Math.sin(yaw), dz = Math.cos(yaw);
    let x = t.pos.x, z = t.pos.z, went = 0;
    for (let k = 0; k < dist * 2; k++) {
      const nx = x + dx * 0.5, nz = z + dz * 0.5;
      if (!App.isLand(nx, nz) || (App.climbOK && !App.climbOK(x, z, nx, nz))) break;
      x = nx; z = nz; went += 0.5;
    }
    const from = { x: t.pos.x, y: t.pos.y + 1, z: t.pos.z };
    t.pos.x = x; t.pos.z = z;
    return { from, went };
  }
  function cast(t, a, k) {
    const K = kitOf(t), A = K[k], now = performance.now();
    if (!A) return;
    a.cds = a.cds || {};
    if (now - (a.cds[k] || -1e9) < A.cd * 1000) { if (k !== "F") App.say(t, A.name + " is not ready yet", 1); return; }
    a.cds[k] = now;
    const role = roleOf(t), g = (App.gearOf && App.gearOf(t.id)) || {}, school = (App.mageSchool && App.mageSchool(t.id)) || "arcane";
    const P = { x: t.pos.x, y: t.pos.y + 1.2, z: t.pos.z }, FX = App.FX, sc = App.scene;
    const melee = () => { t.swingAt = now; a.armedAt = now; if (g.weapon && !t.weaponObj) App.weaponShow(t, g.weapon, g.armor); };
    const spell = () => { t.castAt = now; };
    if (k === "F") { melee(); hitMonster(t, a, nearestAhead(t, 3.2), baseDmg(t)); if (FX) FX.slash(sc, { x: P.x + Math.sin(yawOf(t)) * 1.2, y: P.y, z: P.z + Math.cos(yawOf(t)) * 1.2 }, yawOf(t), "#ffffff"); return; }
    if (role === "warrior") {
      if (k === "Q") { melee(); if (FX) { FX.slash(sc, P, yawOf(t) - 0.5, "#ffd23f"); FX.slash(sc, P, yawOf(t) + 0.5, "#ffd23f"); } for (const m of monstersAround(t, 3.8, 1.05)) hitMonster(t, a, m, baseDmg(t) * 1.3); }
      else if (k === "G") { a.guardUntil = now + 5000; App.say(t, "Shields up!", 1.5); if (FX) FX.ring(sc, P, "#8fd3f4", 2.2, 0.8); }
      else if (k === "R") { melee(); const r = rush(t, 9); if (FX) FX.ring(sc, r.from, "#ffd23f", 2, 0.5); for (const m of monstersAround(t, 3, 0).concat(monstersAround({ pos: r.from, heading: yawOf(t) }, r.went + 1.5, 0.35))) hitMonster(t, a, m, baseDmg(t) * 3); App.say(t, "Chaaarge!", 1.5); }
    } else if (role === "mage") {
      if (k === "Q") { spell(); const m = nearestAhead(t, 16); const to = m ? { x: m.x, y: (m.y || 0) + 1, z: m.z } : { x: P.x + Math.sin(yawOf(t)) * 12, y: P.y, z: P.z + Math.cos(yawOf(t)) * 12 }; if (FX) FX.bolt(sc, P, to, school, () => hitMonster(t, a, m, baseDmg(t) * 1.6, MCOL[school])); else hitMonster(t, a, m, baseDmg(t) * 1.6); }
      else if (k === "G") { spell(); const r = rush(t, 7); if (FX) { FX.burst(sc, r.from, MCOL[school] || "#c9a6ff", 16, 0.14); FX.burst(sc, { x: t.pos.x, y: t.pos.y + 1, z: t.pos.z }, MCOL[school] || "#c9a6ff", 16, 0.14); } }
      else if (k === "R") { spell(); if (FX) { FX.ring(sc, P, MCOL[school] || "#c9a6ff", 7, 0.9); FX.burst(sc, P, MCOL[school] || "#c9a6ff", 30, 0.18); } for (const m of monstersAround(t, 7, 0)) hitMonster(t, a, m, baseDmg(t) * 3, MCOL[school]); App.say(t, "Nova!", 1.5); }
    } else if (role === "healer") {
      const healT = (o, n) => { if (!(o.hpMax > 0)) { o.hpMax = App.maxHPOf ? App.maxHPOf(o.id) : 100; o.hp = o.hpMax; } o.hpAt = st.T; const got = Math.min(o.hpMax - o.hp, n); o.hp += got; if (FX) { FX.heal(sc, o.pos); FX.number(sc, { x: o.pos.x, y: o.pos.y + 3.2, z: o.pos.z }, "+" + Math.round(got), "#7be08f"); } };
      if (k === "Q") { spell(); healT(t, (t.hpMax || (App.maxHPOf ? App.maxHPOf(t.id) : 100)) / 3); }
      else if (k === "G") { spell(); const o = inFront(t).tk; if (!o) { App.say(t, "Nobody to bless here", 1.5); a.cds.G = 0; return; } healT(o, (o.hpMax || 100) / 2); o.needs.fun = Math.min(100, o.needs.fun + 10); if (App.bumpRel) App.bumpRel(t, o, 3); App.say(o, "Thank you!", 2); }
      else if (k === "R") { spell(); if (FX) FX.ring(sc, P, "#7be08f", 8, 1.1); healT(t, 1e6); for (const o of st.tickles) if (o !== t && !App.isKO(o.id) && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 8) healT(o, 1e6); for (const m of monstersAround(t, 6, 0)) hitMonster(t, a, m, baseDmg(t) * 1.5, "#7be08f"); App.say(t, "Be healed!", 1.5); }
    } else if (role === "tamer") {
      const c = App.leadCreature ? App.leadCreature(t.id) : null, cn = (c && c.name) || "its creature";
      if (k === "Q") { spell(); const m = nearestAhead(t, 10); if (FX) FX.bolt(sc, P, m ? { x: m.x, y: (m.y || 0) + 1, z: m.z } : { x: P.x + Math.sin(yawOf(t)) * 8, y: P.y, z: P.z + Math.cos(yawOf(t)) * 8 }, "venom", () => hitMonster(t, a, m, baseDmg(t) * 1.8, "#7bd34a")); App.say(t, "Get it, " + cn + "!", 1.5); }
      else if (k === "G") { spell(); if (FX) FX.ring(sc, P, "#ffb24a", 6, 0.8); for (const m of monstersAround(t, 6, 0)) { m.atk = -3; m.wait = 3; if (FX) FX.number(sc, { x: m.x, y: (m.y || 0) + 2.4, z: m.z }, "stunned", "#ffb24a"); } }
      else if (k === "R") { spell(); if (FX) FX.ring(sc, P, "#ffb24a", 8, 0.8); for (const m of monstersAround(t, 8, 0.6)) hitMonster(t, a, m, baseDmg(t) * 2.5, "#ffb24a"); App.say(t, "Stampede!", 1.5); }
    } else {
      if (k === "Q") { melee(); const m = nearestAhead(t, 3.2); hitMonster(t, a, m, baseDmg(t) * 1.6); if (m && !m.dead) { const yaw = yawOf(t), nx = m.x + Math.sin(yaw) * 2, nz = m.z + Math.cos(yaw) * 2; if (App.isLand(nx, nz)) { m.x = nx; m.z = nz; } m.atk = -1; } }
      else if (k === "G") { a.sprintUntil = now + 4000; App.say(t, "Go go go!", 1.2); if (FX) FX.burst(sc, { x: t.pos.x, y: t.pos.y + 0.3, z: t.pos.z }, "#ffffff", 10, 0.1); }
      else if (k === "R") { melee(); hitMonster(t, a, nearestAhead(t, 3.2), baseDmg(t) * 4, "#ff6b5e"); if (FX) FX.ring(sc, P, "#ff6b5e", 2.5, 0.5); App.say(t, "HAYMAKER!", 1.5); }
    }
  }
  // the monster it is fighting lunges back: every lunge is a blow (a shield takes some of it); at zero health, knocked out
  function foeBack(t, a) {
    const m = a.foe;
    if (!m) return false;
    if (m.dead || Math.hypot(m.x - t.pos.x, m.z - t.pos.z) > 6) { if (m.foe === t) m.foe = null; a.foe = null; return false; }
    if (m.lungeAt && m.lungeAt !== a.lunge) {
      a.lunge = m.lungeAt;
      const M = (App.MONSTERS || {})[m.kind] || { name: "monster", atk: 6 };
      const guard = performance.now() < (a.guardUntil || 0) ? 0.4 : 1;
      if (App.hurt && App.hurt(t, M.atk * (0.6 + Math.random() * 0.6) * guard, "fighting a " + M.name + (m.d ? " at " + m.d.name : ""), "Ouch\u2026 KO!", 0.02)) { m.foe = null; return true; }
    }
    return false;
  }
  // T: a few words with the Tickle in front; it turns to answer. They get on a little better, and both feel less lonely
  const HELLO = ["Hi there, ", "Nice day, isn't it, ", "How's it going, ", "Good to see you, ", "Fancy meeting you here, "];
  const REPLY = [["Oh! Hello.", "Do I know you?", "Hi\u2026 nice hat."], ["Hey! All good here.", "Not bad, you?", "Lovely day for it!"], ["My friend! Come here!", "There you are!", "Always a pleasure!"]];
  function talk(t, a) {
    const now = performance.now();
    if (now - (a.talkAt || 0) < 2500) return;
    a.talkAt = now;
    const o = inFront(t).tk;
    if (!o) { App.say(t, "Hello? Anyone?", 1.6); return; }
    o.heading = Math.atan2(t.pos.x - o.pos.x, t.pos.z - o.pos.z);
    App.say(t, HELLO[Math.floor(Math.random() * HELLO.length)] + (o.traits && o.traits.Character ? o.traits.Character : o.name) + "!", 3);
    const r = App.relGet(t.id, o.id), set = REPLY[r >= 30 ? 2 : r >= 8 ? 1 : 0];
    setTimeout(() => { if (o.group) App.say(o, set[Math.floor(Math.random() * set.length)], 3); }, 900);
    t.needs.social = Math.min(100, t.needs.social + 6);
    o.needs.social = Math.min(100, o.needs.social + 4);
    if (App.bumpRel) App.bumpRel(t, o, 1.5 + (App.compatibility ? App.compatibility(t, o) : 0));
  }
  // every frame, instead of moving the map: keys turn the view, and the world streams round the Tickle
  App.fpFollow = (dt, keys) => {
    const t = fp && agentOf(fp.id);
    if (!t) { App.exitFP(); return; }
    if (fp.drive && !(t.action && t.action.kind === "fp")) {
      const ko = App.isKO(t.id) || App.isDead(t.id);
      App.exitFP();
      if (ko) App.toast(t.name + " was knocked out: first person ends here.");
      return;
    }
    pad(dt);
    if (!fp) return;
    let turn = 0;
    if (keys.has("KeyZ") || (fp.drive && keys.has("ArrowLeft"))) turn += 1;
    if (keys.has("KeyX") || (fp.drive && keys.has("ArrowRight"))) turn -= 1;
    if (turn) { if (fp.drive) t.heading += turn * dt * 2; else fp.look += turn * dt * 2; }
    App.cam.target.set(t.pos.x, t.pos.y + 1, t.pos.z);
    App.cam.follow = fp.id;
    fp.back += (fp.backT - fp.back) * Math.min(1, dt * 8);
    const now = performance.now();
    if (now - fp.aimAt > 220) { fp.aimAt = now; hudStats(t); aim(); }
    if (fp.drive) drawBar(t, t.action);
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
    // (under the water the view turns blue-green and hazy: sea.js, for every view)
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
    const P = fp.pad;
    if (P) { f += P.f; s += P.s; }
    const mag = Math.min(1, Math.hypot(f, s));
    const run = keys.has("ShiftLeft") || keys.has("ShiftRight") || (fp.stick && Math.hypot(fp.stick.f, fp.stick.s) > 0.95) || (P && P.run);
    const moving = mag > 0.12 && dm > 0;
    // the head bob follows the stride
    fp.bobAmp += ((moving && !a.water && !a.ride ? (run ? 1.3 : 1) : 0) - fp.bobAmp) * Math.min(1, dtReal * 6);
    if (moving) fp.bobPh += dtReal * (run ? 11 : 7.5);
    // M: into the saddle or out of it (wealth.js keeps the mount under it)
    const mDown = keys.has("KeyM") || !!(P && P.mount);
    if (mDown && !a.mWas && App.mountOf && App.mountOf(t.id)) { a.ride = !a.ride; if (!a.ride) { a.alt = 0; t.flyY = null; } if (fp) showHud(t); }
    a.mWas = mDown;
    const M = a.ride && App.fpSaddle ? App.fpSaddle(t, true) : null;
    if (!M && a.ride) a.ride = false;
    if (M) t.riding.moving = !!moving;
    // Space on foot (and on dry land): a jump
    // (a press is remembered even when it is shorter than a frame)
    if (fp.jump && !M && !a.water && !(a.jy > 0)) { a.vy = 7; a.jy = 0.001; }
    fp.jump = false;
    // F and T (or the touch buttons): a blow at the monster in front, a word with the Tickle in front
    if (fp.act === "talk") talk(t, a); else if (fp.act) cast(t, a, fp.act);
    fp.act = null;
    if (foeBack(t, a)) return;
    // in the water: down with C, up with Space; its breath runs out down there
    if (a.water && !M) {
      const floor = (App.seaFloorY ? App.seaFloorY(t.pos.x, t.pos.z) : App.columnHeight(Math.floor(t.pos.x), Math.floor(t.pos.z))) + 0.55, surf = App.WATER_Y - 0.95;
      const room = Math.max(0, surf - floor);
      if (keys.has("KeyC") || (P && P.down)) a.dive = Math.min(room, (a.dive || 0) + dtReal * 2.2);
      if (keys.has("Space") || (P && P.up)) a.dive = Math.max(0, (a.dive || 0) - dtReal * 2.6);
      a.dive = Math.min(a.dive || 0, room);
      t.flyY = a.dive > 0.05 ? surf - a.dive : null;
      const under = a.dive > 0.6;
      // a minute and a half of breath; with an oxygen tank, ten more minutes first; both fill again at the surface
      const tank = App.hasTank && App.hasTank(t.id);
      if (tank && a.tank == null) a.tank = 1;
      if (under && tank && a.tank > 0) a.tank = Math.max(0, a.tank - dtReal / 600);
      else a.air = Math.max(0, Math.min(1, (a.air == null ? 1 : a.air) + (under ? -dtReal / 90 : dtReal / 3)));
      if (!under && tank) a.tank = Math.min(1, (a.tank || 0) + dtReal / 4);
      if (under && a.air <= 0 && performance.now() - (a.drownAt || 0) > 1500) {
        a.drownAt = performance.now();
        if (App.hurt && App.hurt(t, 6, "out of breath under the sea", "Out of breath\u2026 KO!", 0)) return;
        App.say(t, "Air!", 1);
      }
    } else if (!M) { a.dive = 0; a.air = Math.min(1, (a.air == null ? 1 : a.air) + dtReal / 3); if (t.flyY != null && !(t.riding && t.riding.fly)) t.flyY = null; }
    if (M && M.fly) {
      // the griffin: up and down with Space and C, and over everything once it is off the ground
      if (keys.has("Space") || (P && P.up)) a.alt = Math.min(30, (a.alt || 0) + dtReal * 8);
      if (keys.has("KeyC") || (P && P.down)) a.alt = Math.max(0, (a.alt || 0) - dtReal * 8);
      const ground = Math.max(App.surfaceAt(t.pos.x, t.pos.z).y, App.WATER_Y);
      t.flyY = ground + (a.alt || 0); t.riding.alt = a.alt || 0;
      if (moving && (a.alt || 0) > 1.5) {
        const h = t.heading, len = Math.hypot(f, s), spd = (run ? 18 : 11) * mag * Math.min(dtReal, 0.1);
        t.pos.x += ((Math.sin(h) * f - Math.cos(h) * s) / len) * spd; t.pos.z += ((Math.cos(h) * f + Math.sin(h) * s) / len) * spd;
        App.animateTickle(t, true, dtReal);
        return;
      }
    }
    if (moving) {
      const h = t.heading, len = Math.hypot(f, s);
      FWD.set((Math.sin(h) * f - Math.cos(h) * s) / len, 0, (Math.cos(h) * f + Math.sin(h) * s) / len);
      const speed = (run ? 7 : 3.6) * mag * (performance.now() < (a.sprintUntil || 0) ? 1.8 : 1) * (a.water ? 0.55 : 1) * (M ? (M.fly ? 1.6 : M.mul * 0.8) : 1), want = speed * Math.min(dtReal, 0.1);
      // the same rules as any Tickle: no climbing cliffs, round the obstacles
      const keep = t.heading;
      App.walkTo(t, { x: t.pos.x + FWD.x * 2, z: t.pos.z + FWD.z * 2 }, dm, dtReal, true, want / Math.max(1e-6, App.WALK_SPEED * dm));
      t.heading = keep;
      if (run) t.walk += dtReal * 6;
    }
    a.water = !App.isLand(t.pos.x, t.pos.z);
    a.phase = a.water ? "doing" : null;
    App.animateTickle(t, !!moving && !(a.jy > 0), dtReal);
    // under the water: lying along it, the breaststroke with both paws
    if (a.water && (a.dive || 0) > 0.6) {
      const w = performance.now() / 1000 * (moving ? 3.4 : 1.2) + t.id;
      t.pivot.rotation.set(1.2, 0, 0); t.pivot.position.set(0, 0.45, -1.0);
      if (t.arms) { const A = t.arms; A.R.rotation.x = A.L.rotation.x = -1.7 + Math.sin(w) * 0.9; A.R.rotation.z = 0.55 + Math.cos(w) * 0.35; A.L.rotation.z = -0.55 - Math.cos(w) * 0.35; }
    }
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
