/* Spells and blows you can see. Mages cast from a distance (Fireball, Frost Shard, Lightning, Arcane
 * Missiles), healers mend their friends with Healing Light, warriors' blows flash, guardians shake the
 * ground with shockwaves, and every hit shows how much it took off. Works in the open world and down in
 * the Underworld alike: effects live in whichever scene they were cast in, and all are moved on every frame.
 * Everything is bright unlit geometry (no extra lights), so it costs little. */
(function () {
  "use strict";
  const App = window.App;
  const SPELLS = (App.SPELLS = {
    fire: { name: "Fireball", color: "#ff7a2f", core: "#ffd23f", speed: 16, size: 0.42 },
    frost: { name: "Frost Shard", color: "#8fd3f4", core: "#ffffff", speed: 22, size: 0.32 },
    storm: { name: "Lightning", color: "#fff4a0", core: "#ffffff", bolt: true },
    arcane: { name: "Arcane Missiles", color: "#c9a6ff", core: "#ffffff", speed: 15, size: 0.24, count: 3 },
    light: { name: "Healing Light", color: "#7be08f", core: "#ffffff", speed: 14, size: 0.3, heal: true },
    // what the guardians throw back
    venom: { name: "Venom", color: "#7bd34a", core: "#e8ffb0", speed: 13, size: 0.34 },
    dark: { name: "Dark Bolt", color: "#9a5cff", core: "#e0c8ff", speed: 15, size: 0.36 },
    gold: { name: "Golden Ray", color: "#ffd23f", core: "#ffffff", bolt: true },
    stone: { name: "Petrifying Gaze", color: "#d8d0b0", core: "#ffffff", bolt: true },
  });
  const live = [];
  let FX_CONE = 1.22;
  const sphere = new THREE.SphereGeometry(1, 8, 6), box = new THREE.BoxGeometry(1, 1, 1), ringG = new THREE.RingGeometry(0.85, 1, 40), arcG = new THREE.TorusGeometry(1, 0.06, 4, 18, Math.PI * 0.9);
  // the warnings a guardian gives before it strikes: a disc, a cone (70 degrees, pointing along +z) and a strip
  const discG = new THREE.CircleGeometry(1, 36), CONE = (70 * Math.PI) / 180, coneG = new THREE.CircleGeometry(1, 20, -Math.PI / 2 - CONE / 2, CONE), stripG = new THREE.PlaneGeometry(1, 1);
  FX_CONE = CONE;
  const mats = {};
  const glow = (c, op) => { const k = c + ":" + (op || 1); return mats[k] || (mats[k] = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op || 1, depthWrite: false, blending: THREE.AdditiveBlending })); };
  function add(scene, obj, life, update, end) { obj.renderOrder = 5; scene.add(obj); live.push({ scene, obj, t: 0, life, update, end }); return obj; }
  function mesh(geo, color, op, s) { const m = new THREE.Mesh(geo, glow(color, op).clone()); if (s) m.scale.setScalar(s); return m; }
  // the warnings are tinted, not glowing, so they read as danger on a bright floor as well as a dark one
  function tint(geo, color, op) { return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false })); }
  const V = (p) => new THREE.Vector3(p.x, p.y, p.z);
  // a warning on the ground: it fills up over its life, and when it is full the blow lands
  function warning(scene, obj, inner, life) {
    add(scene, obj, life, (e) => { const u = e.t / e.life; inner.scale.setScalar(Math.max(0.02, u)); inner.material.opacity = 0.3 + 0.3 * u; obj.children[0].material.opacity = 0.22 + 0.12 * Math.sin(e.t * 18); });
  }
  const FX = (App.FX = {
    // sparks flying out from a point
    burst(scene, p, color, n, size) {
      for (let k = 0; k < (n || 14); k++) {
        const m = mesh(sphere, k % 3 ? color : "#ffffff", 0.95, (size || 0.12) * (0.6 + Math.random() * 0.8));
        m.position.copy(V(p));
        const v = new THREE.Vector3((Math.random() - 0.5) * 7, 1 + Math.random() * 5, (Math.random() - 0.5) * 7);
        add(scene, m, 0.45 + Math.random() * 0.3, (e, dt) => { m.position.addScaledVector(v, dt); v.y -= 9 * dt; const f = 1 - e.t / e.life; m.material.opacity = 0.95 * f; m.scale.setScalar(m.scale.x * (1 - dt * 1.5)); });
      }
    },
    // a bolt that flies from a to b, leaving a trail, and bursts where it lands
    bolt(scene, a, b, school, onHit) {
      const S = SPELLS[school] || SPELLS.arcane;
      if (S.bolt) return FX.lightning(scene, a, b, S.color, onHit);
      const n = S.count || 1;
      for (let k = 0; k < n; k++) {
        const ball = mesh(sphere, S.color, 0.9, S.size), core = mesh(sphere, S.core, 1, 0.55);
        ball.add(core);
        const from = V(a), to = V(b), curve = new THREE.Vector3((Math.random() - 0.5) * (n > 1 ? 3 : 0.6), 1 + Math.random() * (n > 1 ? 2 : 0.6), (Math.random() - 0.5) * (n > 1 ? 3 : 0.6));
        const dist = from.distanceTo(to), dur = Math.max(0.15, dist / S.speed);
        ball.position.copy(from);
        let trailT = 0;
        add(scene, ball, dur + k * 0.12, (e, dt) => {
          const u = Math.max(0, (e.t - k * 0.12) / dur);
          if (u <= 0) { ball.visible = false; return; }
          ball.visible = true;
          ball.position.lerpVectors(from, to, Math.min(1, u)).addScaledVector(curve, Math.sin(Math.min(1, u) * Math.PI));
          ball.rotation.y += dt * 8;
          trailT += dt;
          if (trailT > 0.03) { trailT = 0; const tr = mesh(sphere, S.color, 0.6, S.size * 0.7); tr.position.copy(ball.position); add(scene, tr, 0.3, (f, d2) => { tr.material.opacity = 0.6 * (1 - f.t / f.life); tr.scale.setScalar(tr.scale.x * (1 - d2 * 2.5)); }); }
        }, () => { FX.burst(scene, b, S.color, 12, S.size * 0.45); if (k === n - 1 && onHit) onHit(); });
      }
    },
    // a jagged bolt of lightning that strikes at once
    lightning(scene, a, b, color, onHit) {
      const g = new THREE.Group(), from = V(a), to = V(b), pts = [from.clone()];
      const steps = 7;
      for (let k = 1; k < steps; k++) { const p = from.clone().lerp(to, k / steps); p.x += (Math.random() - 0.5) * 1.2; p.y += (Math.random() - 0.5) * 1.2; p.z += (Math.random() - 0.5) * 1.2; pts.push(p); }
      pts.push(to.clone());
      for (let k = 0; k < pts.length - 1; k++) {
        const p0 = pts[k], p1 = pts[k + 1], seg = mesh(box, k % 2 ? "#ffffff" : color, 1);
        const len = p0.distanceTo(p1);
        seg.scale.set(0.09, 0.09, len); seg.position.copy(p0).lerp(p1, 0.5); seg.lookAt(p1);
        g.add(seg);
      }
      add(scene, g, 0.28, (e) => { const f = 1 - e.t / e.life; g.children.forEach((s) => (s.material.opacity = f)); g.visible = Math.random() < 0.85; });
      FX.burst(scene, b, color, 18, 0.14);
      if (onHit) onHit();
    },
    // green light rising round a friend
    heal(scene, p) {
      FX.ring(scene, { x: p.x, y: p.y + 0.05, z: p.z }, "#7be08f", 1.6, 0.6);
      for (let k = 0; k < 14; k++) {
        const m = mesh(sphere, k % 2 ? "#7be08f" : "#ffffff", 0.9, 0.1 + Math.random() * 0.08), a = Math.random() * 6.28, r = 0.4 + Math.random() * 0.8;
        m.position.set(p.x + Math.cos(a) * r, p.y + Math.random() * 0.6, p.z + Math.sin(a) * r);
        add(scene, m, 0.9 + Math.random() * 0.4, (e, dt) => { m.position.y += dt * 2.2; m.material.opacity = 0.9 * (1 - e.t / e.life); });
      }
    },
    // a ring on the ground that grows and fades: a shockwave, or the mark of a spell
    ring(scene, p, color, radius, life) {
      const m = mesh(ringG, color, 0.9);
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, p.y + 0.08, p.z); m.scale.setScalar(0.3);
      add(scene, m, life || 0.6, (e) => { const u = e.t / e.life; m.scale.setScalar(0.3 + u * radius); m.material.opacity = 0.9 * (1 - u); });
    },
    // the flash of a blade
    slash(scene, p, heading, color) {
      const m = mesh(arcG, color || "#ffffff", 0.9);
      m.position.set(p.x, p.y, p.z); m.rotation.set(Math.PI / 2, 0, heading - Math.PI / 2);
      m.scale.setScalar(1.1);
      add(scene, m, 0.22, (e) => { const u = e.t / e.life; m.material.opacity = 0.9 * (1 - u); m.rotation.z += 0.25; m.scale.setScalar(1.1 + u * 0.6); });
    },
    // how much a blow took off (or a heal gave), floating up
    number(scene, p, text, color) {
      const c = document.createElement("canvas"); c.width = 96; c.height = 48;
      const x = c.getContext("2d");
      x.font = "bold 34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.lineWidth = 6; x.strokeStyle = "rgba(0,0,0,0.8)"; x.strokeText(text, 48, 24); x.fillStyle = color || "#ffffff"; x.fillText(text, 48, 24);
      const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(1.6, 0.8, 1); sp.position.set(p.x + (Math.random() - 0.5) * 0.6, p.y, p.z);
      add(scene, sp, 0.9, (e, dt) => { sp.position.y += dt * 1.6; sp.material.opacity = 1 - Math.max(0, e.t / e.life - 0.4) / 0.6; }, () => { tex.dispose(); sp.material.dispose(); });
    },
    // the ground where a guardian is about to strike glows red: round it, in a cone in front of it, or along its charge
    warn(scene, p, radius, life, color) {
      const g = new THREE.Group(), edge = tint(discG, color || "#ff3b2f", 0.35), fill = tint(discG, color || "#ff3b2f", 0.3);
      edge.rotation.x = fill.rotation.x = -Math.PI / 2; g.add(edge, fill); g.position.set(p.x, 0.07, p.z); g.scale.setScalar(radius);
      // the fill grows from the middle out
      const inner = { scale: { setScalar: (k) => fill.scale.setScalar(k) }, material: fill.material };
      warning(scene, g, inner, life);
    },
    warnCone(scene, p, heading, radius, life, color) {
      const g = new THREE.Group(), edge = tint(coneG, color || "#ff3b2f", 0.35), fill = tint(coneG, color || "#ff3b2f", 0.3);
      edge.rotation.x = fill.rotation.x = -Math.PI / 2; g.add(edge, fill); g.position.set(p.x, 0.07, p.z); g.rotation.y = heading; g.scale.setScalar(radius);
      warning(scene, g, { scale: { setScalar: (k) => fill.scale.setScalar(k) }, material: fill.material }, life);
    },
    warnLine(scene, a, b, width, life, color) {
      const g = new THREE.Group(), len = Math.hypot(b.x - a.x, b.z - a.z), edge = tint(stripG, color || "#ff3b2f", 0.35), fill = tint(stripG, color || "#ff3b2f", 0.3);
      edge.rotation.x = fill.rotation.x = -Math.PI / 2; edge.scale.set(width, len, 1); fill.scale.set(width, len, 1);
      edge.position.z = fill.position.z = len / 2; g.add(edge, fill); g.position.set(a.x, 0.07, a.z); g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      warning(scene, g, { scale: { setScalar: (k) => { fill.scale.set(width, len * k, 1); fill.position.z = (len * k) / 2; } }, material: fill.material }, life);
    },
    // a name over a guardian's head as it uses an attack ("Fire Breath!")
    label(scene, p, text, color) {
      const c = document.createElement("canvas"); c.width = 320; c.height = 64;
      const x = c.getContext("2d");
      x.font = "900 34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.lineWidth = 7; x.strokeStyle = "rgba(0,0,0,0.85)"; x.strokeText(text, 160, 32); x.fillStyle = color || "#ffd23f"; x.fillText(text, 160, 32);
      const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(5, 1, 1); sp.position.set(p.x, p.y, p.z);
      add(scene, sp, 1.6, (e, dt) => { sp.position.y += dt * 0.5; sp.material.opacity = 1 - Math.max(0, e.t / e.life - 0.6) / 0.4; }, () => { tex.dispose(); sp.material.dispose(); });
    },
    step(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const e = live[i];
        e.t += dt;
        if (e.update) e.update(e, dt);
        if (e.t >= e.life) {
          e.scene.remove(e.obj);
          e.obj.traverse((o) => { if (o.material && o.material !== mats[o.material.uuid]) { if (o.material.dispose && !o.isSprite) o.material.dispose(); } });
          if (e.end) e.end();
          live.splice(i, 1);
        }
      }
    },
    count: () => live.length,
    CONE: () => FX_CONE,
  });
})();
