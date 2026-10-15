/* Sea beasts. Now and then something rises from the water near a dock or a beach: the Lake Serpent from
 * the great lake, or a Kraken from the open sea. It smashes the rowing boats it can reach and spits at
 * whoever stands on the jetty or the bank. The armed Tickles of the villages around (warriors, the Night
 * Watch, the Guild), the mages and the tamers with a creature run down to the water and fight it: spears and
 * stones, spells, creatures. A beaten beast dies and sinks, and its hoard is shared out: shells, Ethernum and
 * experience for every defender, and a trophy (a relic) for the one who struck the last blow. If they cannot
 * beat it before it tires of them, it goes back down, leaving the dock's boats on the bottom until morning and
 * a few of its defenders knocked out. Off screen the same is decided by how strong the defenders are. */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the beasts, in the kit's stroke format (every layer has two strokes or more) ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    // the kraken's head: a great dome rising out of the water, with two big eyes
    function kraken() {
      const st = [], skin = C("#b03a6a"), dark = C("#7a2048"), spot = C("#e07aa0"), white = C("#fff4e0"), black = C("#151515");
      st.push(S("sphere", [0, 0, 120], [380, 360, 330], { color: skin }));
      st.push(S("sphere", [0, -40, 420], [260, 250, 200], { color: skin, blend: 30 }));
      for (const [x, y, z] of [[-180, -160, 380], [150, -200, 330], [40, -120, 560], [-90, 120, 420], [200, 60, 300]]) st.push(S("sphere", [x, y, z], [40, 40, 30], { color: spot, layer: 1 }));
      st.push(S("sphere", [150, 300, 260], [80, 60, 80], { color: white, mirror: true, offsX: 150, layer: 2 }));
      st.push(S("cube", [150, 300, 350], [90, 30, 16], { color: dark, rot: [0, 0.25, 0], mirror: true, offsX: 150, layer: 2 }));
      st.push(S("sphere", [150, 350, 260], [36, 20, 50], { color: black, mirror: true, offsX: 150, layer: 3 }));
      st.push(S("sphere", [0, 330, 120], [70, 50, 40], { color: dark, layer: 3 }));
      return st;
    }
    // one of its arms: rising out of the water and curling over, suckers along the inside
    function tentacle() {
      const st = [], skin = C("#b03a6a"), pale = C("#f0b0c8");
      st.push(S("joint", [0, 0, 150], [64, 64, 170], { color: skin, rot: dir(0, 0.15, 1) }));
      st.push(S("joint", [0, 70, 430], [50, 50, 150], { color: skin, rot: dir(0, 0.45, 1) }));
      st.push(S("joint", [0, 190, 650], [38, 38, 120], { color: skin, rot: dir(0, 0.9, 1) }));
      st.push(S("joint", [0, 340, 780], [28, 28, 90], { color: skin, rot: dir(0, 1, 0.2) }));
      st.push(S("sphere", [0, 430, 740], [26, 26, 26], { color: skin }));
      for (const [y, z] of [[40, 200], [80, 330], [140, 470], [220, 590], [300, 700]]) st.push(S("sphere", [0, y + 40, z - 20], [16, 12, 16], { color: pale, layer: 1 }));
      return st;
    }
    // the lake serpent's neck and head, rising tall out of the water
    function serpent() {
      const st = [], skin = C("#3c8a5a"), belly = C("#b8d890"), dark = C("#245a3a"), white = C("#fff4e0"), black = C("#151515");
      st.push(S("joint", [0, 0, 160], [90, 90, 200], { color: skin, rot: dir(0, 0.15, 1) }));
      st.push(S("joint", [0, 90, 500], [76, 76, 190], { color: skin, rot: dir(0, 0.35, 1) }));
      st.push(S("joint", [0, 220, 800], [64, 64, 150], { color: skin, rot: dir(0, 0.8, 1) }));
      st.push(S("sphere", [0, 380, 930], [86, 150, 76], { color: skin, layer: 1 }));
      st.push(S("sphere", [0, 470, 900], [60, 70, 40], { color: belly, layer: 1 }));
      st.push(S("sphere", [50, 360, 990], [24, 20, 22], { color: white, mirror: true, offsX: 50, layer: 2 }));
      st.push(S("sphere", [56, 372, 994], [10, 8, 12], { color: black, mirror: true, offsX: 56, layer: 2 }));
      for (const [y, z] of [[20, 300], [120, 600], [250, 860]]) st.push(S("cube", [0, y - 40, z], [8, 50, 60], { color: dark, layer: 3 }));
      st.push(S("cube", [0, 300, 1010], [8, 40, 40], { color: dark, layer: 3 }));
      return st;
    }
    // a hump of its back breaking the surface behind
    function serpenthump() {
      const st = [], skin = C("#3c8a5a"), dark = C("#245a3a");
      st.push(S("sphere", [0, 0, 40], [110, 300, 170], { color: skin }));
      st.push(S("sphere", [0, 0, 60], [100, 260, 150], { color: skin, blend: 20 }));
      for (const y of [-160, -40, 80, 200]) st.push(S("cube", [0, y, 210], [8, 40, 50], { color: dark, layer: 1 }));
      return st;
    }
    const B = { group: "Lake" };
    Object.assign(TB.KIT, {
      kraken: Object.assign({ name: "Kraken", variants: [0], build: kraken, voxel: [16] }, B),
      tentacle: Object.assign({ name: "Kraken Tentacle", variants: [0], build: tentacle, voxel: [12] }, B),
      serpent: Object.assign({ name: "Lake Serpent", variants: [0], build: serpent, voxel: [14] }, B),
      serpenthump: Object.assign({ name: "Lake Serpent's Back", variants: [0], build: serpenthump, voxel: [14] }, B),
    });
  }
  if (!G.App) return;
  const App = G.App, st = App.st, hash2 = App.hash2, DAY = 1440, rnd = Math.random;
  const nm = (id) => App.nameOf(id);
  const BEASTS = (App.SEA_BEASTS = {
    serpent: { name: "the Lake Serpent", hp: 1200, school: "frost", trophy: "serpentscale" },
    kraken: { name: "the Kraken", hp: 1600, school: "dark", trophy: "krakenbeak" },
  });
  if (App.RELICS) Object.assign(App.RELICS, { serpentscale: { name: "Lake Serpent's Scale", band: 1, bonus: 1.08 }, krakenbeak: { name: "Kraken's Beak", band: 2, bonus: 1.1 } });

  // ---------- where it rises: off a dock on the lake, or off a beach on the open sea ----------
  const fronts = {};
  function frontOf(r, kind) {
    const k = r + ":" + kind;
    if (k in fronts) return fronts[k];
    let F = null;
    if (kind === "serpent") {
      const D = (App.docks || []).find((d) => d.region === r);
      if (D) {
        const spots = [];
        for (const al of [10.6, 8.6, 6.6]) for (const sd of [0.85, -0.85]) spots.push({ x: D.x + D.ux * al + D.uz * sd, z: D.z + D.uz * al - D.ux * sd });
        const bank = App.bankLine ? App.bankLine(D, 0, 10, 2.6) : [];
        F = { kind, r, D, x: D.x + D.ux * 21 + D.uz * 7, z: D.z + D.uz * 21 - D.ux * 7, face: Math.atan2(-D.ux, -D.uz), spots: spots.concat(bank), name: D.name };
      }
    } else if (App.seaBeach) {
      const v = App.villages.filter((o) => o.region === r).sort((a, b) => b.residents.length - a.residents.length)[0];
      const b = v && (App.seaBeach(v.x, v.z, 520, r) || App.seaBeach(v.x, v.z, 780, r));
      if (b) {
        const ux = b.cx - b.x, uz = b.cz - b.z, L = Math.hypot(ux, uz) || 1, D = { x: b.x, z: b.z, ux: ux / L, uz: uz / L, land: { x: b.x, z: b.z } };
        const bank = App.bankLine ? App.bankLine(D, 0, 12, 2.6, (x, z) => App.seaAt(x, z)) : [];
        if (bank.length >= 4) F = { kind, r, D, x: b.x + D.ux * 13, z: b.z + D.uz * 13, face: Math.atan2(-D.ux, -D.uz), spots: bank, name: App.nearestVillage(b.x, b.z, r).name + " Beach" };
      }
    }
    return (fronts[k] = F);
  }

  // ---------- the day's attack: planned in the morning ----------
  const OK_STEPS = new Set(["job", "lunch", "chore", "leisure", "evening", "morning", "guildhall", "ether"]);
  function plan(day) {
    if (hash2(day, 7, 501) > 0.45) return;
    const r = Math.floor(hash2(day, 9, 503) * App.regions.length), kind = hash2(day, 11, 505) < 0.5 ? "serpent" : "kraken";
    const F = frontOf(r, kind) || frontOf(r, kind === "serpent" ? "kraken" : "serpent");
    if (!F) return;
    const t0 = day * DAY + 14 * 60 + Math.floor(hash2(day, 13, 507) * 120), t1 = t0 + 70, B = BEASTS[F.kind];
    // who comes down to the water: the armed, the mages and the tamers of the villages round about
    const def = [];
    for (const v of App.villages) if (Math.hypot(v.x - F.x, v.z - F.z) < 240) for (const id of v.residents) {
      if (def.length >= 8 + Math.floor(hash2(day, 15, 513) * 7)) break; // eight to fourteen of them
      if (App.isKO(id) || App.isDead(id) || (App.isMine && App.isMine(id)) || !App.combatRole || !App.combatRole(id)) continue;
      if (App.planOf(id, day).steps.some((s) => s.e > t0 - day * DAY - 40 && s.s < t1 - day * DAY && !OK_STEPS.has(s.k))) continue;
      def.push(id);
    }
    if (def.length < 3) return;
    const a = { id: "sb" + day, day, kind: F.kind, r: F.r, t0, t1, hp: B.hp, max: B.hp, def, done: false, live: false, dealt: {} };
    st.seaAttacks.push(a);
    for (const id of def) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && !t.action.order && t.action.kind !== "ko") App.endAction(t); }
  }
  const attackOf = (id, day) => { for (const a of st.seaAttacks) if (a.day === day && !a.done && a.def.includes(id)) return a; return null; };
  // the plan hook (population.js): down to the water to fight it
  App.seaDefendStep = (id, day) => {
    if (!st.seaAttacks) return null;
    const a = attackOf(id, day);
    if (!a) return null;
    const F = frontOf(a.r, a.kind), i = a.def.indexOf(id), sp = F.spots[i % F.spots.length], d0 = day * DAY, v = App.villageOfToken(id);
    const walk = Math.min(150, (Math.hypot(v.x - F.x, v.z - F.z) * 1.25) / App.WALK_SPEED);
    return { k: "seadefend", s: Math.max(0, a.t0 - d0 - walk - 4), e: Math.min(1435, a.t1 - d0), p: { x: sp.x, z: sp.z, label: "fighting " + BEASTS[a.kind].name + " at " + F.name, attack: a.id, cx: F.x, cz: F.z } };
  };

  // ---------- the brain and the fight (sim.js) ----------
  App.seaBrain = (t, step) => {
    const a = st.seaAttacks.find((x) => x.id === step.p.attack);
    if (!a || a.done) return false;
    if (Math.hypot(step.p.x - t.pos.x, step.p.z - t.pos.z) > 1.2) { App.startTravel(t, step.p, "to fight " + BEASTS[a.kind].name); return true; }
    if (st.T < a.t0) { App.startDo(t, { act: { id: "sea_wait", name: "Watching the water", verb: "is watching the water", needs: {}, capacity: 99, minutes: 4, where: "self", source: "core", status: "core" }, ref: "sea" + t.id, spot: { x: t.pos.x, z: t.pos.z }, exact: true, face: { x: step.p.cx, z: step.p.cz } }, false, Math.min(a.t0, st.T + 4)); return true; }
    t.action = { kind: "seafight", attack: a.id, next: st.T + rnd() * 1.5, started: st.T };
    if (rnd() < 0.5) App.say(t, ["There it is!", "Protect the boats!", "Everyone to the water!", "Drive it back!"][Math.floor(rnd() * 4)], 2.5);
    return true;
  };
  App.stepSeaFight = (t, a, dm, dtReal) => {
    const A = st.seaAttacks.find((x) => x.id === a.attack), O = A && beastObj;
    if (!A || A.done || App.isKO(t.id) || st.T >= A.t1) { t.action = null; App.animateTickle(t, false, dtReal); return; }
    const F = frontOf(A.r, A.kind);
    App.faceTo(t, { x: F.x, z: F.z }, dtReal);
    if (st.T >= a.next && dm > 0) {
      a.next = st.T + 1.6 + rnd() * 1.0;
      t.throwAt = performance.now();
      const role = App.combatRole(t.id), to = { x: F.x + (rnd() - 0.5) * 2, y: App.WATER_Y + 2.6, z: F.z + (rnd() - 0.5) * 2 }, from = { x: t.pos.x + Math.sin(t.heading) * 0.7, y: t.pos.y + 2.4, z: t.pos.z + Math.cos(t.heading) * 0.7 };
      const g = App.gearOf ? App.gearOf(t.id) : null, dmg = App.weaponDamage(t, role === "mage" || role === "healer" ? "staff" : g ? g.weapon : "spear") * (role === "tamer" ? 0.9 : 1);
      if ((role === "mage" || role === "healer") && App.FX) App.FX.bolt(App.scene, from, to, role === "healer" ? "light" : App.mageSchool(t.id) || "arcane", () => hit(A, t.id, dmg * 1.2));
      else if (role === "tamer" && App.FX) { const c = App.leadCreature(t.id), B = c && App.CREATURES[c.sp]; App.FX.bolt(App.scene, from, to, "arcane", () => hit(A, t.id, dmg)); if (B && rnd() < 0.3) App.say(t, (c.nick || B.name) + ", " + B.move + "!", 2); }
      else App.spawnParticle && App.spawnParticle({ kind: "stone", x0: from.x, y0: from.y, z0: from.z, x1: to.x, y1: to.y, z1: to.z, arc: 2 + rnd() * 1.5, age: 0, life: 0.5 + rnd() * 0.3, onHit: () => hit(A, t.id, dmg) });
      if (rnd() < 0.12) App.say(t, ["Take that!", "Back into the deep!", "For the village!", "Aim for the eyes!"][Math.floor(rnd() * 4)], 1.5);
    }
    App.animateTickle(t, false, dtReal);
    // one arm throws or casts
    const k = Math.max(0, 1 - (performance.now() - (t.throwAt || 0)) / 420);
    if (t.arms) { t.arms.R.rotation.x = k > 0 ? 1.0 - (1 - k) * 3.0 : -0.4; t.arms.L.rotation.x = -0.15; }
    void O;
  };
  function hit(A, id, dmg) {
    if (A.done) return;
    A.hp -= dmg; A.dealt[id] = (A.dealt[id] || 0) + dmg; A.last = id;
    if (App.FX && beastObj && beastObj.A === A && rnd() < 0.5) App.FX.number(App.scene, { x: beastObj.F.x + (rnd() - 0.5) * 3, y: App.WATER_Y + 5, z: beastObj.F.z }, String(Math.round(dmg)), "#ffd23f");
    if (A.hp <= 0) finish(A, true);
  }

  // ---------- the end: dead and sunk, or gone back down ----------
  function finish(A, won) {
    if (A.done) return;
    A.done = true; A.won = won;
    const B = BEASTS[A.kind], F = frontOf(A.r, A.kind), alive = A.def.filter((id) => !App.isKO(id) && !App.isDead(id));
    if (won) {
      const last = A.last != null ? A.last : alive[0];
      for (const id of alive) { App.pay(id, 30); App.giveXP(id, 40); if (App.addEthernum) App.addEthernum(id, 2); }
      if (last != null) {
        App.pay(last, 70);
        st.relics = st.relics || {};
        const list = (st.relics[last] = st.relics[last] || []);
        if (!list.includes(B.trophy)) { list.push(B.trophy); if (list.length > 6) { list.sort((a, b) => App.relicInfo(b).bonus - App.relicInfo(a).bonus); list.length = 6; } }
      }
      st.seaLog.won++;
      App.log("sea", "The defenders of " + F.name + " killed " + B.name + "!", (last != null ? nm(last) + " struck the last blow and keeps the " + App.RELICS[B.trophy].name + ". " : "") + alive.length + " defenders share its hoard: 30 shells, 2 Ethernum and some experience each.", { who: A.def.slice(0, 6) });
      if (beastObj && beastObj.A === A) { beastObj.dying = performance.now(); if (App.FX) App.FX.label(App.scene, { x: F.x, y: App.WATER_Y + 7, z: F.z }, B.name.replace(/^the /, "The ") + " is dead!", "#ffd23f"); App.sfx && App.sfx.cheer && App.sfx.cheer(); }
    } else {
      // it tires of them and goes back down, taking the dock's boats with it
      let sunk = 0;
      if (A.kind === "serpent" && F.D && App.rowboats) for (const b of App.rowboats) if (b.dock === F.D.i && !b.user) { b.sunk = A.day; sunk++; }
      for (const id of A.def) if (hash2(id, A.day, 509) < 0.25) App.knockOut(id, 180, "Ouch...");
      st.seaLog.lost++;
      App.log("sea", B.name.replace(/^the /, "The ") + " went back down off " + F.name + ".", "The defenders could not beat it" + (sunk ? "; it smashed " + sunk + " rowing boats, which lie on the bottom until morning" : "") + ".", { who: A.def.slice(0, 6) });
      if (beastObj && beastObj.A === A) beastObj.leaving = performance.now();
    }
  }
  // off screen it is decided by how strong the defenders are
  function settle(A) {
    if (A.done) return;
    let power = 0;
    if (App.armsWear) for (const id of A.def) App.armsWear(id, 4 + hash2(id, A.day, 739) * 8, 3 + hash2(id, A.day, 741) * 6);
    for (const id of A.def) if (!App.isKO(id)) power += 7 * (1 + App.levelOf(id) * 0.05) * (App.heroPower ? App.heroPower(id) : 1) * ((A.t1 - A.t0) / 2.1) * 0.42; // (as live: some are knocked out, some arrive late)
    if (power * (0.55 + hash2(A.day, A.r, 511) * 0.8) >= A.max) { A.last = A.def.slice().sort((a, b) => App.levelOf(b) - App.levelOf(a))[0]; finish(A, true); }
    else finish(A, false);
  }

  // ---------- the clock (sim.js) ----------
  App.seaTick = () => {
    if (!st.seaAttacks) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    if (m >= 6 * 60 && st.seaDay !== day) { st.seaDay = day; try { plan(day); } catch (e) { console.warn("sea plan", e); } }
    if (st.seaSunk && App.rowboats && App.rowboats.length) { for (const [i, d] of st.seaSunk) if (App.rowboats[i]) App.rowboats[i].sunk = d; st.seaSunk = null; }
    // the boats sunk yesterday are raised again in the morning
    if (App.rowboats) for (const b of App.rowboats) if (b.sunk != null && b.sunk < day) b.sunk = null;
    for (const A of st.seaAttacks) {
      if (A.done) continue;
      const F = frontOf(A.r, A.kind);
      if (!F) { A.done = true; continue; }
      const near = Math.hypot(F.x - App.cam.target.x, F.z - App.cam.target.z) < 130;
      if (st.T >= A.t0 && st.T < A.t1 && near) A.live = true;
      if (st.T >= A.t1) { if (A.live) finish(A, false); else settle(A); }
      else if (st.T >= A.t0 && !A.live && !near && st.T - A.t0 > 1) settle(A);
      // the defenders further off along the shore (drawn only as figures) fight too, at the same pace
      if (A.live && !A.done && st.T >= A.t0) {
        const dt = Math.max(0, st.T - (A.lt || st.T));
        A.lt = st.T;
        for (const id of A.def) {
          if (App.pop.agent[id] || App.isKO(id) || App.isDead(id) || rnd() > dt / 2.1) continue;
          const step = App.planStep(id, st.T).step;
          if (step.k === "seadefend" && st.T - day * DAY >= step.s + (step.travel || 0)) hit(A, id, 7 * (0.7 + rnd() * 0.6) * (1 + App.levelOf(id) * 0.05) * (App.heroPower ? App.heroPower(id) : 1));
        }
      }
      // the beast strikes back, at whoever is in reach
      if (A.live && !A.done && st.T >= A.t0 && st.T >= (A.nextStrike || 0)) {
        A.nextStrike = st.T + 1.8 + rnd() * 1.2;
        const near2 = st.tickles.filter((t) => A.def.includes(t.id) && t.action && t.action.kind === "seafight" && !App.isKO(t.id));
        const t = near2[Math.floor(rnd() * near2.length)];
        if (t && App.FX) {
          const at = { x: t.pos.x, z: t.pos.z }, B = BEASTS[A.kind];
          App.FX.warn(App.scene, { x: at.x, y: t.pos.y, z: at.z }, 2.4, 1.1);
          setTimeout(() => {
            if (A.done) return;
            App.FX.bolt(App.scene, { x: F.x, y: App.WATER_Y + 5.5, z: F.z }, { x: at.x, y: App.WATER_Y + 1.5, z: at.z }, B.school, () => {
              for (const o of st.tickles) if (Math.hypot(o.pos.x - at.x, o.pos.z - at.z) < 2.4 && !App.isKO(o.id)) { if (rnd() < 0.35) App.say(o, "Missed me!", 1.5); else App.hurt(o, 26 + rnd() * 16, "fighting " + B.name, "Splash! KO!", 0.04); }
            });
          }, 1100);
        }
        // and any rowing boat in its reach goes to the bottom
        if (A.kind === "serpent" && F.D && App.rowboats) for (const b of App.rowboats) if (b.dock === F.D.i && !b.user && b.sunk == null && Math.hypot(b.x - F.x, b.z - F.z) < 16 && rnd() < 0.15) { b.sunk = A.day; if (App.FX) App.FX.burst(App.scene, { x: b.x, y: App.WATER_Y + 0.5, z: b.z }, "#a0703a", 16, 0.2); }
      }
    }
    if (st.seaAttacks.length > 12) st.seaAttacks.splice(0, st.seaAttacks.length - 12);
  };

  // ---------- the beast you can see (ui.js, every frame) ----------
  let beastObj = null;
  const bar = () => document.getElementById("beastBar");
  App.updateSeaBeasts = () => {
    if (!st.seaAttacks) return;
    const now = performance.now();
    let A = null;
    for (const x of st.seaAttacks) if (x.live && st.T >= x.t0 - 2 && (!x.done || (beastObj && beastObj.A === x && now - (beastObj.dying || beastObj.leaving || now) < 4000))) A = x;
    if (beastObj && beastObj.A !== A) { App.scene.remove(beastObj.grp); beastObj = null; }
    const el = bar();
    if (!A || App.inside) { if (el && !el.hidden) el.hidden = true; if (beastObj && App.inside) beastObj.grp.visible = false; return; }
    const F = frontOf(A.r, A.kind);
    if (!beastObj) {
      const grp = new THREE.Group(), parts = [];
      grp.position.set(F.x, App.WATER_Y - 6, F.z);
      grp.rotation.y = F.face;
      App.scene.add(grp);
      beastObj = { A, F, grp, parts, born: now };
      const add = (kind, x, z, rot, s) => App.kitMesh(kind, 0).then((g) => {
        if (!beastObj || beastObj.grp !== grp) return;
        const m = new THREE.Group(); m.add(App.centeredMesh(g.md, g.geo, true)); m.position.set(x, 0, z); m.rotation.y = rot || 0; if (s) m.scale.setScalar(s); grp.add(m); parts.push({ kind, m, x, z, ph: parts.length * 1.3 });
      });
      // the arms come up out of the water all round it, curling outwards
      if (A.kind === "kraken") { add("kraken", 0, 0, 0, 1.25); for (let k = 0; k < 8; k++) { const ang = k * 0.785 + 0.39, r = 5.4 + (k % 2) * 0.8; add("tentacle", Math.sin(ang) * r, Math.cos(ang) * r, ang, 1.15 + (k % 3) * 0.08); } }
      else { add("serpent", 0, 0, 0, 1.2); add("serpenthump", 0, -6, 0, 1.2); add("serpenthump", 0.6, -10.5, 0.2, 1.05); add("serpenthump", -0.4, -14.5, -0.15, 0.9); }
    }
    const O = beastObj, t = now / 1000;
    // rising out of the water, sinking when it dies or leaves
    const up = Math.min(1, (now - O.born) / 1800), down = O.dying ? Math.min(1, (now - O.dying) / 3500) : O.leaving ? Math.min(1, (now - O.leaving) / 2500) : 0;
    const swimY = App.WATER_Y - 6 + 6 * up * (1 - down) - (A.kind === "kraken" ? 1.6 : 1.2) + Math.sin(t * 0.9) * 0.15;
    if (O.held) { /* up in the hand: hand.js moves it */ }
    else if (O.back) {
      // thrown: it lies where it fell for a moment, then slides back to where it was fighting
      const k = Math.max(0, Math.min(1, (now - O.back.t0 - 2500) / 3000)), e = k * k * (3 - 2 * k);
      O.grp.position.set(O.back.x + (F.x - O.back.x) * e, O.back.y + (swimY - O.back.y) * e, O.back.z + (F.z - O.back.z) * e);
      if (k >= 1) O.back = null;
    } else { O.grp.position.x = F.x; O.grp.position.z = F.z; O.grp.position.y = swimY; }
    O.grp.visible = true;
    for (const p of O.parts) {
      if (p.kind === "tentacle") { p.m.rotation.x = Math.sin(t * 1.6 + p.ph) * 0.25; p.m.rotation.z = Math.sin(t * 1.1 + p.ph) * 0.2; }
      else if (p.kind === "serpenthump") p.m.position.y = Math.sin(t * 1.4 + p.ph) * 0.45 + 0.75; // arching up out of the water
      else if (p.kind === "serpent") { p.m.rotation.x = Math.sin(t * 0.8) * 0.06; p.m.rotation.z = Math.sin(t * 0.6) * 0.08; }
    }
    if (O.dying && App.spawnParticle && rnd() < 0.4) App.spawnParticle({ kind: "bubble", x: F.x + (rnd() - 0.5) * 6, y: App.WATER_Y, z: F.z + (rnd() - 0.5) * 6, vx: 0, vy: 1.2, vz: 0, age: 0, life: 0.8, color: new THREE.Color("#e8fbff") });
    // its health over its head
    if (el) {
      const p = App.project(new THREE.Vector3(F.x, App.WATER_Y + 7.5, F.z));
      if (p.behind || A.done) { if (!el.hidden) el.hidden = true; }
      else {
        el.hidden = false;
        el.style.left = p.x + "px"; el.style.top = p.y + "px";
        el.innerHTML = '<span>' + BEASTS[A.kind].name.replace(/^the /, "The ") + '</span><i style="width:' + Math.max(0, Math.round((A.hp / A.max) * 100)) + '%"></i>';
      }
    }
  };
  // the hand (hand.js) can lift it out of the water and throw it: a hard landing hurts it
  (App.handThings = App.handThings || []).push(() => {
    const O = beastObj;
    if (!O || O.A.done || O.dying || O.leaving || App.inside) return [];
    const A = O.A, p = O.grp.position;
    const T = { x: p.x, y: p.y, z: p.z, sound: A.kind, lift: 7,
      grab() { O.held = true; O.back = null; },
      set(x, y, z) { O.grp.position.set(x, y, z); },
      land(hard) {
        O.held = false; O.back = { x: T.x, y: T.y, z: T.z, t0: performance.now() };
        if (hard && !A.done) {
          A.hp = Math.max(0, A.hp - A.max * 0.08);
          if (App.FX) App.FX.label(App.scene, { x: T.x, y: T.y + 6, z: T.z }, "-" + Math.round(A.max * 0.08), "#ffd23f");
          if (A.hp <= 0) finish(A, true);
        }
      } };
    return [{ kind: "thing", obj: T, x: p.x, y: p.y + 4, z: p.z, r: 90 }];
  });
  // what to call the action (ui.js)
  App.seaActionText = (t) => { const A = st.seaAttacks.find((x) => x.id === t.action.attack); return A ? "Fighting " + BEASTS[A.kind].name : "Fighting a sea beast"; };
  // the boats on the bottom are not drawn nor taken out (boats.js)
  App.boatSunk = (b) => b.sunk != null;

  // ---------- save, load ----------
  App.initSeaBeasts = (saved) => {
    st.seaAttacks = (saved && saved.attacks) || [];
    st.seaLog = (saved && saved.log) || { won: 0, lost: 0 };
    st.seaDay = saved ? saved.day : undefined;
    st.seaSunk = (saved && saved.sunk) || null;
  };
  App.saveSeaBeasts = () => ({ attacks: st.seaAttacks, log: st.seaLog, day: st.seaDay, sunk: (App.rowboats || []).filter((b) => b.sunk != null).map((b) => [b.i, b.sunk]) });
  App.seaHTML = () => {
    if (!st.seaAttacks) return "";
    const L = st.seaLog, day = Math.floor(st.T / DAY), today = st.seaAttacks.filter((a) => a.day === day);
    let h = '<div class="card"><h3>Sea beasts</h3><p class="note">The Lake Serpent lives in the great lake and the Kraken in the open sea. Now and then one of them rises off a dock or a beach, smashes the rowing boats in its reach and spits at whoever is by the water; the armed Tickles, the mages and the tamers of the villages round about run down to fight it. Beaten, it dies and its hoard is shared out (and the last blow wins a relic); otherwise it goes back down, and the dock\u2019s boats lie on the bottom until morning.</p><div class="kv">';
    for (const a of today) { const F = frontOf(a.r, a.kind); h += '<span class="k"><button class="btn" data-beast="' + a.id + '">' + BEASTS[a.kind].name.replace(/^the /, "The ") + "</button></span><span>" + (F ? F.name : "") + " \u00b7 " + (a.done ? (a.won ? "killed" : "went back down") : st.T >= a.t0 ? "fighting now" : "rising at " + App.clock(a.t0).short) + " \u00b7 " + a.def.length + " defenders</span>"; }
    h += '<span class="k">So far</span><span>' + L.won + " killed, " + L.lost + " got away</span></div></div>";
    return h;
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-beast]"); if (!b) return; const a = st.seaAttacks.find((x) => x.id === b.dataset.beast), F = a && frontOf(a.r, a.kind); if (F) App.flyTo(F.x, F.z, 34); });
})(typeof self !== "undefined" ? self : this);
