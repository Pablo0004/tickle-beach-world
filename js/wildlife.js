/* Animals and dragons. Farm animals (pigs, chickens, sheep) graze by each village's pasture; deer and
 * boar roam the hunting grounds and run from Tickles; dragons perch on the peaks and fly out to
 * attack. None of the animals is one of the nine Tickle species. Near the player a dragon attack is
 * fought in 3D: it lands, breathes fire on the fields, swipes at defenders, and Tickles throw stones
 * until it flies off. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const rnd = Math.random, hash2 = App.hash2;
  const FARM = ["pig", "chicken", "sheep"], WILD = ["deer", "boar"], KINDS = FARM.concat(WILD);
  const SPEED = { pig: 0.7, chicken: 0.9, sheep: 0.6, deer: 1.2, boar: 1.0 }; // cells per game minute when grazing
  const FLEE = { deer: 3.4, boar: 2.9 };
  const CAP = 500;
  const geo = {}, meshes = {};
  const herds = new Map(); // key -> { animals }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();

  function entryFor(md) {
    const g = App.makeVoxMesh(md).geometry, box = App.meshBox(md);
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - box.min.y, md.origin[2] * S - (box.min.z + box.max.z) / 2),
      new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
    return { geo: g, local, md, box };
  }

  // ---------- particles: dragon fire and thrown stones ----------
  const PCAP = 900;
  let pmesh = null;
  const parts = [];
  const COL = new THREE.Color();
  function makeParticles() {
    pmesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshBasicMaterial({ color: 0xffffff }), PCAP);
    pmesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PCAP * 3), 3);
    pmesh.frustumCulled = false; pmesh.count = 0;
    App.scene.add(pmesh);
  }
  function spawn(p) { if (parts.length < PCAP) parts.push(p); }
  App.spawnParticle = spawn;
  function stepParticles(dt) {
    if (!pmesh) return;
    let n = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age < 0) continue; // fire puffs leave the mouth one after another
      if (p.kind === "stone") {
        const u = Math.min(1, p.age / p.life);
        p.x = p.x0 + (p.x1 - p.x0) * u; p.z = p.z0 + (p.z1 - p.z0) * u; p.y = p.y0 + (p.y1 - p.y0) * u + Math.sin(u * Math.PI) * p.arc;
        if (u >= 1) { if (p.onHit) p.onHit(); parts.splice(i, 1); continue; }
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy += 0.6 * dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
      }
      if (n >= PCAP) continue;
      const k = p.kind === "fire" ? 0.6 + (p.age / p.life) * 1.6 : 0.8;
      M4.compose(V.set(p.x, p.y, p.z), Q.identity(), SC.set(k, k, k));
      pmesh.setMatrixAt(n, M4);
      if (p.kind === "fire") { const u = p.age / p.life; COL.setRGB(1, 0.85 - u * 0.7, 0.25 - u * 0.25); }
      else if (p.color) COL.copy(p.color);
      else COL.setRGB(0.55, 0.55, 0.58);
      pmesh.setColorAt(n, COL);
      n++;
    }
    pmesh.count = n;
    pmesh.instanceMatrix.needsUpdate = true;
    pmesh.instanceColor.needsUpdate = true;
  }

  // ---------- dragons ----------
  const dragonGeo = [];
  const dragons = new Map(); // lair index -> { group, wings, ... }
  async function loadDragons() {
    const D = TB.dragonParts;
    for (const v of TB.KIT.dragon.variants) {
      const [b, w] = await Promise.all([App.job("compact", { strokes: D.body(v), voxel: 12, lip: 1.5 }), App.job("compact", { strokes: D.wing(v), voxel: 12, lip: 1.5 })]);
      dragonGeo[v] = { body: b.mesh, bodyGeo: App.makeVoxMesh(b.mesh).geometry, wing: w.mesh, wingGeo: App.makeVoxMesh(w.mesh).geometry };
    }
  }
  const DSCALE = 2.4;
  function makeDragon(L) {
    const G = dragonGeo[L.look];
    const group = new THREE.Group(), inner = new THREE.Group();
    inner.scale.setScalar(DSCALE);
    group.add(inner);
    const body = App.centeredMesh(G.body, G.bodyGeo, false);
    inner.add(body);
    const box = App.meshBox(G.body), sh = TB.dragonParts.shoulder;
    const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    const wings = [1, -1].map((side) => {
      const piv = new THREE.Group();
      piv.position.set(side * sh[0] * S - cx, sh[2] * S - box.min.y, sh[1] * S - cz);
      piv.scale.x = side;
      piv.userData.side = side;
      const m = App.makeVoxMesh(G.wing);
      piv.add(m);
      inner.add(piv);
      return piv;
    });
    const blob = App.makeBlob(3.2); blob.position.y = 0.05; group.add(blob);
    App.scene.add(group);
    // the mouth, in the dragon's own frame (for fire)
    const mouth = new THREE.Vector3(0, (495 * S - box.min.y) * DSCALE, (470 * S - cz) * DSCALE);
    return { lair: L, group, wings, blob, mouth, flap: rnd() * 6, x: L.x, z: L.z, y: L.h, heading: 0, live: null };
  }
  App.dragonObjects = dragons;
  // the hand let go of a dragon: thrown away from the village it was attacking, it gives up
  App.dragonDropped = (d, hard) => {
    d.held = false; d.handFlying = false;
    if (d.dead) return;
    if (d.hunt && hard) d.hunt.hp -= d.hunt.maxHp * 0.3;
    // set down by another dragon: they fight
    const rival = App.dragonRival && App.dragonRival(d);
    if (rival) { App.startDuel(d, rival); return; }
    // set down among Tickles: they grab their weapons and it fights where it landed, to the end
    if (App.startRampage && App.startRampage(d, hard)) return;
    if (d.rampage) d.rampage = null;
    d.away = true;
    if (!d.live) return;
    const a = d.live.attack, o = App.villages[a.to];
    if (hard) a.hp -= a.maxHp * 0.3;
    if (Math.hypot(d.x - o.granary.x, d.z - o.granary.z) > 35 || a.hp <= 0) {
      d.live = null;
      a.t1 = st.T + 0.01; a.back = a.t1 + Math.hypot(d.lair.x - d.x, d.lair.z - d.z) / 11;
      App.log("dragon", "A giant hand plucked the dragon away from " + o.name + "!", "Dizzy and offended, it flew back to " + d.lair.name + ".", { attack: a.id });
      for (const t of st.tickles) if (Math.hypot(t.pos.x - o.granary.x, t.pos.z - o.granary.z) < 40 && rnd() < 0.5) App.say(t, ["Whoa! Did you see that?", "Hooray!", "Bye bye, dragon!"][Math.floor(rnd() * 3)], 3);
    } else { d.away = false; d.live.phase = "landed"; }
  };
  // the 3D dragon fighting over a village right now, if any
  App.liveDragon = (a) => { for (const d of dragons.values()) if (d.live && d.live.attack === a && d.live.phase === "landed") return d; return null; };

  function updateDragon(d, dm, dtReal) {
    d.asleep = false;
    // in the player's hand or flying from a throw: the hand moves it
    if (d.held || d.handFlying) { pose(d, "fly", dtReal, 0); return; }
    // fighting another dragon, fighting the Tickles where the hand left it, or lying dead
    if (d.duel) return App.stepDuel(d, dm, dtReal);
    if (d.rampage || d.dead) return App.stepRampage(d, dm, dtReal);
    const L = d.lair, s = App.dragonState(L, st.T), a = s.attack;
    // beaten by the Guild: it flies off over the horizon to lick its wounds
    if (s.mode === "hidden") {
      d.hunt = null;
      d.y += 7 * dm; d.x += Math.sin(d.heading) * 10 * dm; d.z += Math.cos(d.heading) * 10 * dm;
      pose(d, "fly", dtReal, 0);
      return;
    }
    // set down somewhere else: it flies back to where it should be
    if (d.away) {
      const dx = s.x - d.x, dz = s.z - d.z, dist = Math.hypot(dx, dz), step = Math.min(dist, dtReal * 16);
      if (dist > 1.5) { d.x += (dx / dist) * step; d.z += (dz / dist) * step; d.y += (Math.max(s.y, App.SEA + 14) - d.y) * Math.min(1, dtReal * 2); d.heading = turn(d.heading, Math.atan2(dx, dz), dtReal * 3); pose(d, "fly", dtReal, 0); return; }
      d.away = false;
    }
    // take over in 3D when an attack happens near the player
    if (a && !a.done && st.T >= a.t0 && st.T < a.t1 && !d.live) {
      const o = App.villages[a.to];
      if (Math.hypot(o.x - App.cam.target.x, o.z - App.cam.target.z) < App.RANGE.full * 2.2) {
        a.live = true;
        a.hp = a.maxHp = Math.round(a.power * 6);
        const g = o.granary, ang = Math.atan2(L.z - g.z, L.x - g.x);
        d.live = { attack: a, phase: "descend", land: { x: g.x + Math.cos(ang) * 9, z: g.z + Math.sin(ang) * 9 }, nextFire: st.T + 2, nextSwipe: st.T + 3, nextRoar: st.T };
        App.toast("A dragon is attacking " + o.name + "!");
        App.log("dragon", "The " + TB.DRAGON_LOOKS[L.look].name.toLowerCase() + " dragon lands at " + o.name + ".", "Everyone nearby, whatever their clan, grabs stones and runs to the granary.", { attack: a.id });
      }
    }
    if (d.live) return liveDragon(d, dm, dtReal);
    // the Guild's hunters have climbed up to the lair: it fights them from its peak
    if (s.mode === "perch" && App.huntOn) {
      if (!d.hunt) {
        const h = App.huntOn(L), day = Math.floor(st.T / 1440), m = st.T - day * 1440;
        if (h && h.day === day && m >= App.huntWindow.start - 30 && m < App.huntWindow.end && st.tickles.some((t) => h.party.includes(t.id) && !App.isKO(t.id) && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 22)) {
          d.hunt = h;
          if (!h.live) {
            h.live = true; h.hp = h.maxHp = 60 + Math.round(hash2(L.i, h.day, 149) * 30);
            App.toast("The Guild is fighting the dragon of " + L.name + "!");
            App.log("hunt", "Hunters of the Adventurers' Guild reach " + L.name + " and the dragon rises to meet them!", "They have until evening to wear it down with stones; its fire can knock them out, or worse.", { who: h.party.slice(0, 6) });
          }
        }
      }
      if (d.hunt && App.lairFight(d, dm, dtReal)) {
        const k = Math.min(1, dtReal * 3);
        d.x += (s.x - d.x) * k; d.z += (s.z - d.z) * k; d.y += (s.y - d.y) * k;
        pose(d, "stand", dtReal, 0);
        return;
      }
    }
    // otherwise follow the schedule (perched, on patrol, flying out, circling, flying home)
    const k = Math.min(1, dtReal * 3);
    d.x += (s.x - d.x) * k; d.z += (s.z - d.z) * k; d.y += (s.y - d.y) * k;
    d.heading = turn(d.heading, s.heading, dtReal * 2);
    // asleep, Tickles on its ground slowly wake it (it lifts its head when it stirs); in the air, they duck
    const stirring = s.mode === "perch" && !d.hunt && App.lairWatch ? App.lairWatch(d, dm) : false;
    if (s.mode !== "perch" && App.overflight) App.overflight(d);
    d.asleep = s.mode === "perch" && !stirring;
    pose(d, s.mode === "perch" ? (stirring ? "stand" : "rest") : "fly", dtReal, s.mode === "circle" ? 0.35 : s.mode === "patrol" ? 0.25 : 0);
  }
  function liveDragon(d, dm, dtReal) {
    const lv = d.live, a = lv.attack, o = App.villages[a.to], g = o.granary;
    if (lv.phase === "descend") {
      const dx = lv.land.x - d.x, dz = lv.land.z - d.z, dist = Math.hypot(dx, dz);
      const step = Math.min(dist, 14 * dm);
      if (dist > 0.3) { d.x += (dx / dist) * step; d.z += (dz / dist) * step; d.heading = turn(d.heading, Math.atan2(dx, dz), dtReal * 3); }
      const gy = App.surfaceAt(d.x, d.z).y;
      d.y += (gy + (dist > 2 ? 4 : 0) - d.y) * Math.min(1, dtReal * 2);
      pose(d, "fly", dtReal, 0);
      if (dist < 0.5 && Math.abs(d.y - gy) < 0.4) { lv.phase = "landed"; d.y = gy; }
      return;
    }
    if (lv.phase === "landed") {
      d.y = App.surfaceAt(d.x, d.z).y;
      // those with arms or creatures come to fight; everyone else runs home
      if (!(lv.nextRally > st.T)) { lv.nextRally = st.T + 1; App.rallyAround(d, 60, !lv.rallied); lv.rallied = true; }
      // face the granary or the closest fighter
      const foes = st.tickles.filter((t) => !App.isKO(t.id) && t.action && (t.action.kind === "slay" || t.action.kind === "command") && t.action.dragon === d && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 16);
      const near = foes.sort((p, q) => Math.hypot(p.pos.x - d.x, p.pos.z - d.z) - Math.hypot(q.pos.x - d.x, q.pos.z - d.z))[0];
      const look = near ? near.pos : g;
      d.heading = turn(d.heading, Math.atan2(look.x - d.x, look.z - d.z), dtReal * 2);
      pose(d, "stand", dtReal, 0);
      if (st.T >= lv.nextRoar) { lv.nextRoar = st.T + 6 + rnd() * 6; lv.roar = 0.6; }
      if (lv.roar > 0) lv.roar -= dtReal;
      // fire: burns a field nearby, or scorches the granary and grabs a sack of food
      if (st.T >= lv.nextFire) {
        lv.nextFire = st.T + 2.5 + rnd() * 1.5;
        const field = o.fields.find((f) => !(f.burnt > st.T) && Math.hypot(f.x - d.x, f.z - d.z) < 30);
        const house = rnd() < 0.3 ? o.homes.map((h) => h.sc).filter((s) => s && !s.ruined && Math.hypot(s.x - d.x, s.z - d.z) < 24).sort((p, q) => Math.hypot(p.x - d.x, p.z - d.z) - Math.hypot(q.x - d.x, q.z - d.z))[0] : null;
        if (house) { breathe(d, house); App.ruin(house, "by the dragon's fire"); return; }
        const tgt = field && rnd() < 0.5 ? { x: field.x, z: field.z } : near && rnd() < 0.5 ? { x: near.pos.x, z: near.pos.z } : { x: g.x, z: g.z };
        breathe(d, tgt);
        // anyone standing where the fire lands may not get up again
        if (near && tgt.x === near.pos.x) for (const t of st.tickles) if (!App.isKO(t.id) && t.group.visible && Math.hypot(t.pos.x - tgt.x, t.pos.z - tgt.z) < 2.8) {
          if (rnd() < 0.35) App.say(t, "Missed me!", 2); else App.hurt(t, 30 + rnd() * 15, "in the dragon's fire at " + o.name, "Too hot! KO!", 0.08);
        }
        if (field && tgt.x === field.x) { field.burnt = st.T + 1440; a.burned++; App.log("dragon", "The dragon set a field of " + o.name + " on fire.", "Its " + field.crop + " is gone until it grows back tomorrow.", { attack: a.id }); }
        else if (tgt.x === g.x) { const take = Math.min(o.food, 3 + rnd() * 3); o.food -= take; a.stolen += take; }
      }
      // tail swipe: knocks out a defender who got too close
      if (st.T >= lv.nextSwipe) {
        lv.nextSwipe = st.T + 2.2 + rnd() * 1.6;
        const victim = foes.find((t) => Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 9.5);
        if (victim) { if (App.hurt(victim, 25 + rnd() * 10, "to the dragon's claws at " + o.name, "Oof! KO!", 0.06)) a.kos++; lv.swipe = 0.5; }
      }
      if (lv.swipe > 0) lv.swipe -= dtReal;
      if (a.hp <= 0 || st.T >= a.t1 - 2) {
        lv.phase = "leave";
        const flight = Math.hypot(d.lair.x - d.x, d.lair.z - d.z) / 11;
        a.t1 = st.T + 0.01; a.back = a.t1 + flight;
        App.say && st.tickles.filter((t) => !App.isKO(t.id) && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 30).forEach((t, i) => { if (i < 8) App.say(t, a.hp <= 0 ? "Hooray! It's leaving!" : "And stay away!", 4); });
      }
      return;
    }
    // leaving: climb and hand back to the schedule
    d.y += 6 * dm;
    d.heading = turn(d.heading, Math.atan2(d.lair.x - d.x, d.lair.z - d.z), dtReal * 2);
    d.x += Math.sin(d.heading) * 8 * dm; d.z += Math.cos(d.heading) * 8 * dm;
    pose(d, "fly", dtReal, 0);
    if (d.y > App.SEA + 18) d.live = null;
  }
  App.breathe = (d, tgt) => breathe(d, tgt);
  function breathe(d, tgt) {
    const c = Math.cos(d.heading), s = Math.sin(d.heading);
    const mx = d.x + s * d.mouth.z, mz = d.z + c * d.mouth.z, my = d.y + d.mouth.y;
    const dx = tgt.x - mx, dz = tgt.z - mz, L = Math.hypot(dx, dz) || 1;
    for (let k = 0; k < 70; k++) {
      const sp = 9 + rnd() * 6, j = 0.18;
      spawn({ kind: "fire", x: mx, y: my, z: mz, vx: (dx / L + (rnd() - 0.5) * j * 2) * sp, vy: -1.5 + (rnd() - 0.5) * 2, vz: (dz / L + (rnd() - 0.5) * j * 2) * sp, age: -k * 0.012, life: 0.9 + rnd() * 0.4 });
    }
  }
  // a defender throws a stone at the dragon; a hit wears it down
  App.throwStone = (t, d, a, mult) => {
    spawn({ kind: "stone", x0: t.pos.x, y0: t.pos.y + 2.2, z0: t.pos.z, x1: d.x + (rnd() - 0.5) * 2, y1: d.y + 3.2, z1: d.z + (rnd() - 0.5) * 2, arc: 2.5 + rnd() * 1.5, age: 0, life: 0.6 + rnd() * 0.3,
      onHit: () => { if (rnd() < 0.8) App.hitDragon(d, t, (1 + rnd() * 1.5) * (1 + App.levelOf(t.id) * 0.06) * (mult || 1)); } });
  };
  App.dragonTurn = (h, target, k) => turn(h, target, k);
  App.dragonPose = (d, mode, dtReal, bank) => pose(d, mode, dtReal, bank);
  function turn(h, target, k) { let df = target - h; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; return h + df * Math.min(1, k); }
  function pose(d, mode, dtReal, bank) {
    d.flap += dtReal * (mode === "fly" ? 7 : 1.2);
    const lv = d.live || d.rampage || (d.duelRoar > 0 ? { roar: d.duelRoar } : null);
    const w = mode === "fly" ? 0.15 + Math.sin(d.flap) * 0.65 : mode === "stand" ? -0.35 + Math.sin(d.flap) * 0.08 + (lv && lv.roar > 0 ? 0.7 : 0) : d.dead ? -0.2 : -0.75;
    for (const p of d.wings) p.rotation.z = w * p.userData.side; // the mirrored wing turns the other way
    d.group.position.set(d.x, d.y + (mode === "fly" ? Math.sin(d.flap) * 0.25 : 0), d.z);
    d.group.rotation.set(0, d.heading, 0);
    d.group.children[0].rotation.z = -bank;
    d.group.children[0].rotation.x = lv && lv.swipe > 0 ? -0.12 : 0;
    const ground = App.surfaceAt(d.x, d.z).y;
    d.blob.position.y = ground - d.y + 0.06;
    d.blob.visible = d.y - ground < 12;
  }

  // ---------- herds ----------
  // farm animals live in their pens: pigs in the pig pen, hens in the hen yard, sheep in the fold
  // (the sheep go out to graze with their shepherd)
  function herdFarm(v) {
    const out = [], r = (k) => hash2(v.i, k, 51);
    const pens = { pig: v.pen, chicken: v.yard, sheep: v.fold };
    const counts = { pig: 3 + Math.floor(r(1) * 2), chicken: 5 + Math.floor(r(2) * 3), sheep: 5 + Math.floor(r(3) * 4) };
    for (const kind of FARM) {
      const pen = pens[kind];
      if (!pen || !App.kitOn(kind)) continue;
      for (let k = 0; k < counts[kind]; k++) {
        const x = pen.x + (r(10 + k) * 2 - 1) * (pen.w - 1), z = pen.z + (r(20 + k) * 2 - 1) * (pen.d - 1);
        const an = animal(kind, x, z, { x: pen.x, z: pen.z, rect: pen }, false);
        an.vi = v.i; an.slot = k;
        out.push(an);
      }
    }
    return out;
  }
  const inRect = (p, x, z, m) => Math.abs(x - p.x) < p.w - (m || 0) && Math.abs(z - p.z) < p.d - (m || 0);
  // who is leading each village's flock right now, and who is feeding the pigs
  const shepherds = new Map(), feeding = new Map();
  function herdWild(p) {
    const out = [], r = (k) => hash2(p.i, k, 53);
    const home = { x: p.x, z: p.z, r: p.hill ? p.hill.r + 14 : 22 };
    const nd = 2 + Math.floor(r(1) * 3), nb = 1 + Math.floor(r(2) * 3);
    const add = (kind, n, s) => { if (App.kitOn(kind)) for (let k = 0; k < n; k++) { const a = r(s + k) * 6.28, dd = home.r * 0.6 + r(s + 20 + k) * home.r * 0.4; out.push(animal(kind, p.x + Math.cos(a) * dd, p.z + Math.sin(a) * dd, home, true)); } };
    add("deer", nd, 10); add("boar", nb, 40);
    return out;
  }
  function animal(kind, x, z, home, wild) {
    return { kind, x, z, y: App.genHeight(x, z), h: rnd() * 6.28, t: null, wait: rnd() * 4, wob: rnd() * 6, home, wild, gone: 0, fleeing: 0 };
  }
  App.updateWildlifeSet = () => {
    if (!geo.pig) return;
    const tx = App.cam.target.x, tz = App.cam.target.z, R = App.RANGE.scenery * 0.85;
    const keep = new Set();
    for (const v of App.gridNear("village", tx, tz, R + 60)) {
      if (Math.hypot(v.x - tx, v.z - tz) > R + 20) continue;
      const k = "v" + v.i; keep.add(k);
      if (!herds.has(k)) herds.set(k, { animals: herdFarm(v) });
    }
    for (const p of App.poisNear(tx, tz, R, (q) => q.type === "meadow" || q.type === "camp" || q.type === "falls")) {
      const k = "p" + p.i; keep.add(k);
      if (!herds.has(k)) herds.set(k, { animals: herdWild(p) });
    }
    for (const k of [...herds.keys()]) if (!keep.has(k)) herds.delete(k);
    // dragons within sight
    for (const L of App.lairs) {
      const s = App.dragonState(L, st.T), d = dragons.get(L.i);
      const corpse = d && d.dead && st.T < d.dead.at + 240;
      const vis = corpse || (d && (d.rampage || d.duel || d.held || d.handFlying)) || ((Math.hypot(s.x - tx, s.z - tz) < 300 || (d && d.live)) && !(s.mode === "hidden" && (!d || d.y > App.SEA + 70)) && s.mode !== "slain" && !(d && d.dead));
      if (vis && !d && dragonGeo[L.look] && App.kitOn("dragon")) { const nd = makeDragon(L); nd.x = s.x; nd.z = s.z; nd.y = s.y; nd.heading = s.heading; dragons.set(L.i, nd); }
      else if ((!vis || !App.kitOn("dragon")) && d) { App.scene.remove(d.group); App.dropDragonBar && App.dropDragonBar(d); dragons.delete(L.i); }
    }
  };

  // ---------- hunting ----------
  App.preyNear = (x, z, R) => {
    let best = null, bd = R;
    for (const h of herds.values()) for (const an of h.animals) {
      if (!an.wild || an.gone > st.T) continue;
      const d = Math.hypot(an.x - x, an.z - z);
      if (d < bd) { bd = d; best = an; }
    }
    return best;
  };
  App.catchPrey = (an) => { if (an.gone > st.T) return false; an.gone = st.T + 600; return true; };
  App.animalsNear = (x, z, R) => { const out = []; for (const h of herds.values()) for (const an of h.animals) if (an.gone <= st.T && Math.abs(an.x - x) + Math.abs(an.z - z) < R) out.push(an); return out; };
  App.herdAnimalsNear = (x, z, R) => { const out = []; for (const h of herds.values()) for (const an of h.animals) if (!an.wild && an.gone <= st.T && Math.hypot(an.x - x, an.z - z) < R) out.push(an); return out; };

  const isLand = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) >= App.SEA;
  function stepAnimal(an, dm) {
    if (an.gone > st.T) return;
    let sp = SPEED[an.kind];
    // game runs from any Tickle that gets close
    if (an.wild) {
      let threat = null, td = 7;
      for (const t of st.tickles) { const d = Math.hypot(t.pos.x - an.x, t.pos.z - an.z); if (d < td) { td = d; threat = t; } }
      // a hunting creature on its tail
      if (an.chasedBy) { const b = an.chasedBy, d = Math.hypot(b.x - an.x, b.z - an.z); if (d < 14) { td = d; threat = { pos: { x: b.x, z: b.z } }; } }
      if (threat) {
        const ax = an.x - threat.pos.x, az = an.z - threat.pos.z, L = Math.hypot(ax, az) || 1;
        an.t = { x: an.x + (ax / L) * 6, z: an.z + (az / L) * 6 };
        an.fleeing = Math.min(1, an.fleeing + dm * 0.08);
        sp = FLEE[an.kind] * (1 - an.fleeing * 0.45); // they tire as the chase goes on
        an.wait = 0;
      } else an.fleeing = Math.max(0, an.fleeing - dm * 0.05);
    }
    // the flock: follow the shepherd out through the gate, or head back into the fold
    if (an.kind === "sheep" && an.home.rect) {
      const fold = an.home.rect, v = App.villages[an.vi], sh = shepherds.get(an.vi), inside = inRect(fold, an.x, an.z, 0.3);
      // the flock only leaves the fold with its shepherd
      const out = sh ? !inRect(fold, sh.pos.x, sh.pos.z) : false;
      if (out) {
        if (inside) { if (!an.wp || !an.wp.length) an.wp = [fold.gateIn, fold.gateOut]; }
        else if (!an.wp || !an.wp.length) {
          const c = sh.pos, a = an.slot * 1.3, d = 2.6 + (an.slot % 3) * 1.1;
          an.t = { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d };
          sp = Math.hypot(an.t.x - an.x, an.t.z - an.z) > 5 ? 2.8 : 0.9;
          an.wait = 0;
        }
      } else if (!inside && (!an.wp || !an.wp.length)) {
        an.wp = [fold.gateOut, fold.gateIn, { x: fold.x + (rnd() - 0.5) * (fold.w - 1.5) * 2, z: fold.z + (rnd() - 0.5) * (fold.d - 1.5) * 2 }];
      }
      if (an.wp && an.wp.length) {
        an.t = an.wp[0]; an.wait = 0; sp = 2.6;
        if (Math.hypot(an.t.x - an.x, an.t.z - an.z) < 0.6) { an.wp.shift(); an.t = an.wp[0] || null; if (!an.t) return; }
      }
    }
    // pigs crowd round the trough when the breeder brings food
    if (an.kind === "pig" && feeding.get(an.vi) && !an.atTrough) {
      const tr = an.home.rect.trough;
      an.t = { x: tr.x + Math.cos(an.slot * 1.9) * 1.6, z: tr.z + Math.sin(an.slot * 1.9) * 1.6 }; an.wait = 0; an.atTrough = true;
    }
    if (an.kind === "pig" && !feeding.get(an.vi)) an.atTrough = false;
    if (an.wait > 0) { an.wait -= dm; return; }
    if (!an.t) {
      if (!an.wild && App.isNight) { an.wait = 10; return; }
      for (let k = 0; k < 6 && !an.t; k++) {
        let x, z;
        if (an.home.rect) { const R = an.home.rect; x = R.x + (rnd() * 2 - 1) * (R.w - 1); z = R.z + (rnd() * 2 - 1) * (R.d - 1); }
        else { const a = rnd() * 6.28, d = rnd() * an.home.r; x = an.home.x + Math.cos(a) * d; z = an.home.z + Math.sin(a) * d; }
        if (isLand(x, z) && !(App.buildingAt && App.buildingAt(x, z))) an.t = { x, z };
      }
      if (!an.t) { an.wait = 2; return; }
    }
    const dx = an.t.x - an.x, dz = an.t.z - an.z, dist = Math.hypot(dx, dz);
    if (dist < 0.3) { an.t = null; an.wait = (an.kind === "chicken" ? 0.5 : 2) + rnd() * (an.wild ? 4 : 8); return; }
    const step = Math.min(dist, sp * dm);
    const nx = an.x + (dx / dist) * step, nz = an.z + (dz / dist) * step;
    // (never into a building: it goes another way)
    if (!isLand(nx, nz) || !App.climbOK(an.x, an.z, nx, nz) || (App.buildingBlocks && App.buildingBlocks(an.x, an.z, nx, nz))) { an.t = null; return; }
    an.x = nx; an.z = nz;
    an.h = turn(an.h, Math.atan2(dx, dz), Math.min(1, dm * 4));
    an.wob += step * 6;
  }

  App.loadWildlife = async () => {
    await Promise.all(KINDS.map(async (k) => {
      const K = TB.KIT[k];
      const r = await App.job("compact", { strokes: K.build(0), voxel: K.voxel[0], lip: 1.5 });
      geo[k] = entryFor(r.mesh);
      const m = new THREE.InstancedMesh(geo[k].geo, App.voxMaterial, CAP);
      m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      App.scene.add(m);
      meshes[k] = m;
    }));
    await loadDragons();
    makeParticles();
  };

  App.stepWildlife = (dtReal) => {
    if (!geo.pig) return;
    const dmAll = Math.min(dtReal, 0.1) * st.speed;
    const sub = Math.max(1, Math.ceil(dmAll / 0.08)), dm = dmAll / sub;
    const n = {};
    for (const k of KINDS) n[k] = 0;
    const tx = App.cam.target.x, tz = App.cam.target.z;
    shepherds.clear(); feeding.clear();
    for (const t of st.tickles) {
      if (t.leading && !App.isKO(t.id)) shepherds.set(t.village.i, t);
      const a = t.action;
      if (a && a.phase === "doing" && a.act && a.act.id === "chore_pigs") feeding.set(t.village.i, true);
    }
    for (const h of herds.values()) for (const an of h.animals) {
      if (!an.held && !an.flying) for (let i = 0; i < sub; i++) stepAnimal(an, dm);
      // they keep living further out, but small animals are only drawn near the player
      if (an.gone > st.T || !App.kitOn(an.kind) || n[an.kind] >= CAP || Math.abs(an.x - tx) + Math.abs(an.z - tz) > 95) continue;
      if (!an.held && !an.flying) { const gy = App.genHeight(an.x, an.z); an.y += (gy - an.y) * Math.min(1, dtReal * 8); }
      const moving = !!an.t && an.wait <= 0;
      const hop = an.kind === "chicken" ? Math.abs(Math.sin(an.wob * 1.6)) * 0.12 : moving ? Math.abs(Math.sin(an.wob)) * 0.06 : 0;
      const peck = an.kind === "chicken" && !moving ? Math.max(0, Math.sin(performance.now() / 260 + an.wob)) * 0.5 : 0;
      E.set(peck + (moving ? Math.sin(an.wob) * 0.05 : 0), an.h, 0, "YXZ");
      Q.setFromEuler(E);
      M4.compose(V.set(an.x, an.y + hop, an.z), Q, SC.set(1, 1, 1)).multiply(geo[an.kind].local);
      meshes[an.kind].setMatrixAt(n[an.kind]++, M4);
    }
    for (const k of KINDS) { meshes[k].count = n[k]; meshes[k].instanceMatrix.needsUpdate = true; }
    for (const d of dragons.values()) updateDragon(d, dmAll, dtReal);
    App.updateCombatBars && App.updateCombatBars();
    stepParticles(dtReal);
  };
})();
