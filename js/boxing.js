/* Boxing: put two Tickles into a creature arena with the hand and the ring becomes a boxing ring.
 * The bell rings, they square up, trade jabs and hooks with a stamina bar each, and the first one
 * down is out (a knock-out, never worse). A Tickle dropped in alone waits for a challenger.
 * Anything else can go in too: a creature (tamed or wild), a dungeon monster, a pig, a sheep, a boar:
 * a beast in the ring waits for a rival, Tickle or beast, and they slug it out the same way. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random;
  const V = new THREE.Vector3();
  App.ringAt = (x, z) => { for (const ar of App.arenas || []) if (ar && Math.hypot(x - ar.x, z - ar.z) < 6.2) return ar; return null; };
  function hpEl() {
    const el = document.createElement("div");
    el.className = "hpbar";
    el.innerHTML = '<span class="nm"></span><div class="hb"><i></i></div>';
    document.getElementById("overlay").appendChild(el);
    return el;
  }
  // a Tickle set down inside a ring
  App.enterRing = (t, ar) => {
    if (ar.waitBeast && st.T < ar.waitBeast.until) return startMixed(ar.waitBeast, fighterOf(t, "tickle"), ar);
    const rival = st.tickles.find((o) => o !== t && o.action && o.action.kind === "ringwait" && o.action.ring === ar && !App.isKO(o.id));
    if (rival) return startBout(rival, t, ar);
    App.endAction(t);
    t.action = { kind: "ringwait", ring: ar, until: st.T + 30, started: st.T };
    App.say(t, ["Who wants a fight?!", "Come on, I'm ready!", "Bring it on!"][Math.floor(rnd() * 3)], 4);
  };
  function startBout(a, b, ar) {
    App.endAction(a); App.endAction(b);
    const ang = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z) || 0;
    const bout = { ring: ar, hp: [100, 100], els: [hpEl(), hpEl()], round: 1, started: st.T, done: false, a };
    bout.bets = App.placeBets ? App.placeBets(ar.x, ar.z, a.name, b.name, 0.5 + (App.levelOf(a.id) - App.levelOf(b.id)) * 0.05, [a, b]) : [];
    const ux = Math.sin(ang), uz = Math.cos(ang);
    a.action = { kind: "box", bout, side: 0, partner: b, spot: { x: ar.x - ux * 1.3, z: ar.z - uz * 1.3 }, next: st.T + 1.2 + rnd() * 0.4, started: st.T };
    b.action = { kind: "box", bout, side: 1, partner: a, spot: { x: ar.x + ux * 1.3, z: ar.z + uz * 1.3 }, next: st.T + 1.5 + rnd() * 0.4, started: st.T };
    App.sfx && App.sfx.bell && App.sfx.bell();
    App.say(a, "Let's go!", 2); App.say(b, "You're going down!", 2);
    for (const o of st.tickles) if (o !== a && o !== b && Math.hypot(o.pos.x - ar.x, o.pos.z - ar.z) < 22 && rnd() < 0.6) App.say(o, ["Fight! Fight!", "Ooooh!", "My money's on " + a.name + "!"][Math.floor(rnd() * 3)], 3);
  }
  function endBout(bout, loser, winner) {
    bout.done = true;
    bout.els.forEach((e) => e.remove());
    App.sfx && App.sfx.bell && App.sfx.bell(3);
    App.settleBets && App.settleBets(bout.bets || [], winner === bout.a ? 0 : 1);
    App.knockOut(loser.id, 40, "KO!");
    winner.action = { kind: "cheer", until: st.T + 4, started: st.T };
    App.say(winner, ["Champion!", "Who's next?!", "Too easy!"][Math.floor(rnd() * 3)], 4);
    App.giveXP(winner.id, 15); App.giveXP(loser.id, 6);
    App.log("box", winner.name + " knocked out " + loser.name + " in the ring at " + bout.ring.name + ".", "A boxing match in round " + bout.round + ". Nobody gets hurt for long: " + loser.name + " is just seeing stars.", { who: [winner.id, loser.id] });
  }
  // returns how to animate: "walk", "guard", "punch", "cheer" or "wait"
  App.stepBoxing = (t, a, dm) => {
    if (a.kind === "cheer") { if (st.T >= a.until) t.action = null; return "cheer"; }
    if (a.kind === "ringwait") {
      if (st.T >= a.until || !App.ringAt(t.pos.x, t.pos.z)) { App.say(t, "Nobody? Fine.", 3); t.action = null; return "wait"; }
      t.heading += dm * 0.6;
      if (rnd() < dm * 0.05) App.say(t, ["Who's next?", "I'm waiting!", "Scared?"][Math.floor(rnd() * 3)], 2);
      return "guard";
    }
    if (a.external) {
      if (a.bout.done) { t.action = null; return "wait"; }
      if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.25) return "walk";
      const o = a.bout.f[1 - a.side].pos();
      t.heading = Math.atan2(o.x - t.pos.x, o.z - t.pos.z);
      return "fight";
    }
    const bout = a.bout, p = a.partner;
    if (bout.done || !p || !p.action || p.action.bout !== bout) { t.action = null; return "wait"; }
    if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.25) return "walk";
    t.heading = Math.atan2(p.pos.x - t.pos.x, p.pos.z - t.pos.z);
    // stamina bars over both fighters
    const el = bout.els[a.side], pr = App.project(V.set(t.pos.x, t.pos.y + t.height + 0.9, t.pos.z));
    el.hidden = pr.behind; el.style.left = pr.x + "px"; el.style.top = pr.y + "px";
    el.querySelector(".nm").textContent = t.name + " \u00b7 Lv " + App.levelOf(t.id);
    const f = Math.max(0, bout.hp[a.side]) / 100, bar = el.querySelector("i");
    bar.style.width = Math.round(f * 100) + "%"; bar.style.background = f > 0.5 ? "#7be08f" : f > 0.2 ? "#ffd23f" : "#ff6b5e";
    if (st.T >= a.next && Math.hypot(p.pos.x - p.action.spot.x, p.pos.z - p.action.spot.z) < 0.4) {
      a.next = st.T + 0.8 + rnd() * 0.7;
      t.punchAt = performance.now(); t.punches = (t.punches || 0) + 1;
      const hit = rnd() < 0.68 + (App.levelOf(t.id) - App.levelOf(p.id)) * 0.02;
      if (hit) {
        const dmg = 0.5 * (7 + rnd() * 8) * (1 + App.levelOf(t.id) * 0.04) * (0.8 + t.needs.energy / 250); // bouts go several rounds
        bout.hp[1 - a.side] -= dmg;
        p.hitAt = performance.now();
        App.say(t, ["Pow!", "Jab!", "Hook!", "Uppercut!", "Bam!"][Math.floor(rnd() * 5)], 1.1);
        App.sfx && App.sfx.punch && App.sfx.punch();
        if (bout.hp[1 - a.side] <= 0) { endBout(bout, p, t); return "punch"; }
      } else App.say(p, ["Whiff!", "Missed me!", "Too slow!"][Math.floor(rnd() * 3)], 1.1);
      if (st.T - bout.started > bout.round * 6) bout.round++;
    }
    return "fight";
  };

  // ---------- beasts in the ring: creatures, monsters, farm and wild animals ----------
  const DOT = " " + String.fromCharCode(183) + " ";
  const ANIMAL_POW = { chicken: 3, pig: 6, sheep: 5, deer: 7, boar: 10 };
  function fighterOf(o, kind) {
    if (kind === "tickle") return { o, kind, name: o.name, lvl: App.levelOf(o.id), pow: () => (7 + rnd() * 8) * (1 + App.levelOf(o.id) * 0.04) * (App.heroPower ? Math.sqrt(App.heroPower(o.id)) : 1), pos: () => o.pos, height: o.height };
    if (kind === "creature") { const B = App.CREATURES[o.data.sp]; return { o, kind, name: (o.data.nick ? o.data.nick + " the " : "") + B.name, lvl: o.data.lvl, pow: () => App.creatureStats(o.data).atk * (0.3 + rnd() * 0.25), pos: () => o, height: 1.4, color: App.CREATURE_TYPE_COL[B.type] }; }
    if (kind === "monster") { const M = App.MONSTERS[o.kind]; return { o, kind, name: M.name, lvl: 1 + Math.round(M.atk / 3), pow: () => M.atk * (0.8 + rnd() * 0.6), pos: () => o, height: 1.6, color: "#c9a6ff" }; }
    return { o, kind, name: o.kind.charAt(0).toUpperCase() + o.kind.slice(1), lvl: 1, pow: () => (ANIMAL_POW[o.kind] || 5) * (0.7 + rnd() * 0.6), pos: () => o, height: 1.2, color: "#ffffff" };
  }
  App.beastKind = (o) => (o.data ? "creature" : App.MONSTERS && App.MONSTERS[o.kind] && o.d ? "monster" : "animal");
  // hold a beast still in the ring, facing a point
  function pin(F, x, z, face) {
    const o = F.o;
    if (F.kind === "tickle") return;
    o.x = x; o.z = z; o.y = App.genHeight(x, z);
    o.h = Math.atan2(face.x - x, face.z - z);
    if (F.kind === "creature") o.battle = o.battle || { ring: true };
    else if (F.kind === "monster") o.foe = { pos: face };
    else o.held = true;
  }
  function release(F) {
    const o = F.o;
    if (F.kind === "creature") { if (o.battle && o.battle.ring) o.battle = null; }
    else if (F.kind === "monster") o.foe = null;
    else if (F.kind === "animal") { o.held = false; o.wait = 1; o.t = null; }
  }
  // a beast set down in a ring (from the hand)
  App.enterRingBeast = (o, ar) => {
    const kind = App.beastKind(o), F = fighterOf(o, kind);
    const t = st.tickles.find((x) => x.action && x.action.kind === "ringwait" && x.action.ring === ar && !App.isKO(x.id));
    if (t) return startMixed(fighterOf(t, "tickle"), F, ar);
    if (ar.waitBeast && st.T < ar.waitBeast.until && ar.waitBeast.o !== o) return startMixed(ar.waitBeast, F, ar);
    F.until = st.T + 30;
    ar.waitBeast = F;
    pin(F, ar.x, ar.z, { x: ar.x, z: ar.z + 3 });
  };
  const mixed = [];
  function startMixed(A, B, ar) {
    ar.waitBeast = null;
    const ang = 0.6, ux = Math.sin(ang), uz = Math.cos(ang);
    const spots = [{ x: ar.x - ux * 1.6, z: ar.z - uz * 1.6 }, { x: ar.x + ux * 1.6, z: ar.z + uz * 1.6 }];
    const bout = { ring: ar, f: [A, B], hp: [100, 100], els: [hpEl(), hpEl()], round: 1, started: st.T, next: [st.T + 1.2, st.T + 1.5], lunge: [0, 0], done: false };
    [A, B].forEach((F, i) => {
      if (F.kind === "tickle") { App.endAction(F.o); F.o.action = { kind: "box", bout, side: i, spot: spots[i], external: true, next: 1e9, started: st.T }; }
      else pin(F, spots[i].x, spots[i].z, spots[1 - i]);
    });
    bout.bets = App.placeBets ? App.placeBets(ar.x, ar.z, A.name, B.name, 0.5 + (A.lvl - B.lvl) * 0.04, [A.o, B.o].filter((x) => x.pos)) : [];
    App.sfx && App.sfx.bell && App.sfx.bell();
    for (const o of st.tickles) if (o !== A.o && o !== B.o && Math.hypot(o.pos.x - ar.x, o.pos.z - ar.z) < 22 && rnd() < 0.5) App.say(o, ["A " + A.name + " against a " + B.name + "?!", "This I have to see!", "Fight! Fight!"][Math.floor(rnd() * 3)], 3);
    mixed.push(bout);
  }
  App.stepRingBeasts = () => {
    const now = performance.now();
    for (let i = mixed.length - 1; i >= 0; i--) {
      const bout = mixed[i];
      if (bout.done) { mixed.splice(i, 1); continue; }
      for (let k = 0; k < 2 && !bout.done; k++) {
        const F = bout.f[k], p = F.pos(), other = bout.f[1 - k].pos();
        // the beasts lunge when they strike
        if (F.kind !== "tickle") {
          const l = Math.max(0, 1 - (now - bout.lunge[k]) / 300), base = k === 0 ? -1 : 1;
          F.o.x = bout.ring.x + Math.sin(0.6) * 1.6 * base * (1 - l * 0.5); F.o.z = bout.ring.z + Math.cos(0.6) * 1.6 * base * (1 - l * 0.5);
          F.o.h = Math.atan2(other.x - F.o.x, other.z - F.o.z);
        }
        const el = bout.els[k], pr = App.project(V.set(p.x, (p.y || 0) + F.height + 0.9, p.z));
        el.hidden = pr.behind; el.style.left = pr.x + "px"; el.style.top = pr.y + "px";
        el.querySelector(".nm").textContent = F.name + DOT + "Lv " + F.lvl;
        const f = Math.max(0, bout.hp[k]) / 100, bar = el.querySelector("i");
        bar.style.width = Math.round(f * 100) + "%"; bar.style.background = f > 0.5 ? "#7be08f" : f > 0.2 ? "#ffd23f" : "#ff6b5e";
        if (st.T < bout.next[k]) continue;
        bout.next[k] = st.T + 0.8 + rnd() * 0.7;
        if (F.kind === "tickle") { F.o.punchAt = now; F.o.punches = (F.o.punches || 0) + 1; } else bout.lunge[k] = now;
        if (rnd() < 0.68) {
          bout.hp[1 - k] -= F.pow() * 0.5;
          App.sfx && App.sfx.punch && App.sfx.punch();
          const c = new THREE.Color(F.color || "#ffffff");
          for (let j = 0; j < 12; j++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: other.x, y: (other.y || 0) + 1, z: other.z, vx: (rnd() - 0.5) * 5, vy: 1 + rnd() * 3, vz: (rnd() - 0.5) * 5, age: 0, life: 0.5, color: c });
          if (F.kind === "tickle") App.say(F.o, ["Pow!", "Jab!", "Hook!", "Take that!"][Math.floor(rnd() * 4)], 1.1);
          if (bout.hp[1 - k] <= 0) endMixed(bout, bout.f[1 - k], F);
        }
      }
      if (!bout.done && st.T - bout.started > bout.round * 6) bout.round++;
    }
    // a beast nobody came to fight gets bored and wanders off
    for (const ar of App.arenas || []) if (ar && ar.waitBeast && st.T >= ar.waitBeast.until) { release(ar.waitBeast); ar.waitBeast = null; }
  };
  function endMixed(bout, loser, winner) {
    bout.done = true;
    bout.els.forEach((e) => e.remove());
    App.sfx && App.sfx.bell && App.sfx.bell(3);
    App.settleBets && App.settleBets(bout.bets || [], winner === bout.f[0] ? 0 : 1);
    for (const F of bout.f) if (F.kind === "tickle" && F.o.action && F.o.action.bout === bout) F.o.action = null;
    // the loser: a Tickle sees stars, a creature faints for a moment, a monster goes poof, an animal staggers off
    if (loser.kind === "tickle") App.knockOut(loser.o.id, 40, "KO!");
    else if (loser.kind === "creature") { loser.o.faint = 1; setTimeout(() => { loser.o.faint = 0; release(loser); }, 2500); }
    else if (loser.kind === "monster") { release(loser); App.monsterDown && App.monsterDown(loser.o); }
    else release(loser);
    if (winner.kind === "tickle") { winner.o.action = { kind: "cheer", until: st.T + 4, started: st.T }; App.say(winner.o, ["Champion!", "Who's next?!", "Too easy!"][Math.floor(rnd() * 3)], 4); App.giveXP(winner.o.id, 15); }
    else { if (winner.kind === "creature" && App.creatureTrain) App.creatureTrain(winner.o.data, 10); setTimeout(() => release(winner), 1500); }
    App.log("box", winner.name + " knocked out " + loser.name + " in the ring at " + bout.ring.name + "!", "A boxing match like no other, in round " + bout.round + ".");
  }
})();
