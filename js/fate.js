/* Fate: Tickles can fall in attacks (dragon fire and claws, monsters, now and then a raid). A fallen
 * Tickle's spirit waits at its village altar until the village gathers at night for a revival ritual,
 * which costs food from the granary; then it is back. Houses can be destroyed (dragon fire, or thrown
 * by the hand): the residents sleep in the town hall while builders put it back up, from ruins to
 * scaffolding to house. Trees and other loose pieces that are thrown break and grow back later. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2;
  const DAY = 1440, R0 = 20 * 60 + 15, R1 = 21 * 60 + 15;
  const near = (x, z) => Math.hypot(x - App.cam.target.x, z - App.cam.target.z) < 520;
  let particles = (p) => App.spawnParticle && App.spawnParticle(p);

  // ---------- state ----------
  App.initFate = (saved) => {
    st.fallen = (saved && saved.fallen) || {};
    st.rituals = (saved && saved.rituals) || {};
    st.ruins = (saved && saved.ruins) || {};
    st.broken = (saved && saved.broken) || {};
    for (const id in st.fallen) App.pop.ko[id] = 1e9;
    for (const k in st.ruins) { const s = App.sceneryAll[+k]; if (s) { s.orig = st.ruins[k].orig; s.ruined = true; s.type = st.ruins[k].progress >= 0.5 ? "scaffold_0" : "ruins_0"; } }
    // houses that were moved by hand take their residents' doors with them
    for (const k in st.moved || {}) { const s = App.sceneryAll[+k]; if (s && s.building) App.syncBuilding(s); }
  };
  App.saveFate = () => ({ fallen: st.fallen, rituals: st.rituals, ruins: st.ruins, broken: st.broken });

  // ---------- death and spirits ----------
  App.isDead = (id) => !!(st.fallen && st.fallen[id]);
  App.altarSpot = (id) => {
    const v = App.villageOfToken(id), a = hash2(id, 121, 3) * 6.283, r = 1.4 + hash2(id, 122, 3) * 1.2;
    return { x: v.altar.x + Math.cos(a) * r, z: v.altar.z + Math.sin(a) * r };
  };
  App.kill = (id, cause) => {
    if (App.isDead(id) || !st.fallen) return;
    const v = App.villageOfToken(id);
    st.fallen[id] = { t: st.T, cause, village: v.i };
    App.pop.ko[id] = 1e9;
    const t = App.pop.agent[id];
    if (t) { App.endAction(t); t.action = { kind: "fall", until: st.T + 5, started: st.T }; App.say(t, "Ugh\u2026", 4); }
    ensureRitual(v);
    if (near(v.x, v.z) || t) App.log("death", App.nameOf(id) + " has fallen " + cause + ".", "Its spirit waits by the altar of " + v.name + ". The village can bring it back with a ritual at " + App.clock(st.rituals[v.i].s).short + ".", { who: [id] });
  };
  // a death from an attack, or just a knock-out
  App.maybeKill = (id, chance, cause, koMins, koText) => {
    if (rnd() < chance) { App.kill(id, cause); return true; }
    App.knockOut(id, koMins || 240, koText || "KO!");
    return false;
  };
  const ghostMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false, emissive: 0x6a7dff, emissiveIntensity: 0.35 });
  function ghost(t, on) { if (!t.mesh) return; t.pivot.traverse((m) => { if (m.isMesh && m.userData.tickle) m.material = on ? ghostMat : App.voxMaterial; }); t.ghost = on; }
  // a spirit floats round the altar of its village
  App.stepSpirit = (t, a, dm, dtReal) => {
    if (!App.isDead(t.id)) { ghost(t, false); t.action = null; return; }
    if (a.kind === "fall") {
      t.pivot.rotation.x += (-1.45 - t.pivot.rotation.x) * Math.min(1, dtReal * 6);
      t.pivot.position.y = 0.35;
      if (st.T >= a.until) {
        ghost(t, true);
        for (let k = 0; k < 30; k++) particles({ kind: "spark", x: t.pos.x, y: t.pos.y + 1, z: t.pos.z, vx: (rnd() - 0.5) * 1.5, vy: 2 + rnd() * 3, vz: (rnd() - 0.5) * 1.5, age: -k * 0.01, life: 1.2, color: new THREE.Color("#c9d4ff") });
        t.action = { kind: "spirit", spot: App.altarSpot(t.id), started: st.T };
        t.pivot.rotation.set(0, 0, 0); t.pivot.position.set(0, 0, 0);
      }
      return;
    }
    ghost(t, true);
    const s = a.spot, dx = s.x - t.pos.x, dz = s.z - t.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.2) { const step = Math.min(d, 3.5 * dm); t.pos.x += (dx / d) * step; t.pos.z += (dz / d) * step; t.heading = Math.atan2(dx, dz); }
    const time = performance.now() / 1000;
    t.pos.y = App.surfaceAt(t.pos.x, t.pos.z).y + 0.7 + Math.sin(time * 1.6 + t.id) * 0.25;
    t.group.position.copy(t.pos); t.group.rotation.y = t.heading;
    t.group.visible = true;
    t.pivot.rotation.set(0, 0, Math.sin(time * 1.1 + t.id) * 0.08);
    const r = st.rituals[t.village.i];
    ghostMat.emissiveIntensity = r && r.live ? 0.5 + Math.sin(time * 4) * 0.3 : 0.35;
    if (!t.bubble || st.T > t.bubble.until) if (rnd() < dm * 0.02) App.say(t, "\u2026", 2);
  };
  App.unghost = (t) => ghost(t, false);

  // ---------- the revival ritual ----------
  function ensureRitual(v) {
    if (st.rituals[v.i] && !st.rituals[v.i].done) return st.rituals[v.i];
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    // tonight if there is still time to gather, otherwise tomorrow night
    const rd = m < R0 - 30 ? day : day + 1;
    const r = { village: v.i, day: rd, s: rd * DAY + R0, e: rd * DAY + R1, done: false, live: false };
    st.rituals[v.i] = r;
    for (const id of v.residents) App.invalidatePlan(id);
    return r;
  }
  App.ritualOf = (id, day) => {
    if (!st.rituals) return null;
    const r = st.rituals[App.villageOfToken(id).i];
    return r && !r.done && r.day === day && !App.isDead(id) ? r : null;
  };
  App.ritualWindow = { start: R0, end: R1 };
  function resolveRitual(r) {
    const v = App.villages[r.village];
    const fallen = Object.keys(st.fallen).filter((id) => st.fallen[id].village === v.i).map(Number);
    r.done = true;
    if (!fallen.length) return;
    // a village with a healer among the Maker's blessed offers half as much
    const healer = App.hasBlessing && v.residents.some((id) => App.hasBlessing(id, "healing") && !App.isKO(id) && !App.isDead(id));
    const there = v.residents.filter((id) => !App.isKO(id)).length, cost = fallen.length * (healer ? 2 : 4);
    if (there < 4 || v.food < cost) {
      // not enough hands or food: try again tomorrow
      const nr = { village: v.i, day: r.day + 1, s: r.s + DAY, e: r.e + DAY, done: false, live: false };
      st.rituals[v.i] = nr;
      for (const id of v.residents) App.invalidatePlan(id);
      if (near(v.x, v.z) || r.live) App.log("ritual", "The ritual at " + v.name + " could not be held.", (v.food < cost ? "The granary is short of the " + cost + " food the offering needs." : "Too few villagers were on their feet.") + " They will try again tomorrow night.");
      return;
    }
    v.food -= cost;
    for (const id of fallen) {
      delete st.fallen[id];
      App.pop.ko[id] = st.T + 30;
      const t = App.pop.agent[id];
      if (t) {
        ghost(t, false); t.action = null;
        App.say(t, ["I'm back!", "Thank you, everyone!", "What did I miss?"][Math.floor(rnd() * 3)], 5);
        for (let k = 0; k < 50; k++) particles({ kind: "spark", x: t.pos.x, y: t.pos.y + 0.5, z: t.pos.z, vx: (rnd() - 0.5) * 4, vy: 2 + rnd() * 5, vz: (rnd() - 0.5) * 4, age: -k * 0.006, life: 1, color: new THREE.Color("#ffd23f") });
      }
    }
    if (near(v.x, v.z) || r.live) App.log("ritual", "The ritual at " + v.name + " brought " + fallen.map(App.nameOf).join(", ") + " back.", there + " villagers gathered round the altar, prayed to the Maker and offered " + cost + " food from the granary" + (healer ? " (a healer among the Maker's blessed eased the offering)" : "") + ".", { who: fallen });
  }
  // a villager at the ritual: a place in the circle round the altar, then chanting
  App.ritualSpot = (id) => {
    const v = App.villageOfToken(id), a = hash2(id, 123, 3) * 6.283, r = 3.6 + hash2(id, 124, 3) * 2.4;
    return { x: v.altar.x + Math.cos(a) * r, z: v.altar.z + Math.sin(a) * r, label: "the revival ritual at the altar of " + v.name, cx: v.altar.x, cz: v.altar.z };
  };

  // ---------- ruins and rebuilding ----------
  App.isRuined = (s) => !!(s && s.ruined);
  App.ruin = (s, cause) => {
    if (!s || s.ruined || !s.building || !st.ruins || s.warren || s.castle || s.wall) return; // a warren is a hill, a castle and its walls are stone: nothing to burn down
    s.orig = s.type; s.ruined = true; s.type = "ruins_0";
    st.ruins[s.idx] = { orig: s.orig, progress: 0, since: st.T, village: s.village != null ? s.village : App.nearestVillage(s.x, s.z).i, cause };
    App.sceneryDirty = true;
    const y = App.genHeight(s.x, s.z);
    for (let k = 0; k < 60; k++) particles({ kind: "spark", x: s.x + (rnd() - 0.5) * 3, y: y + 1 + rnd() * 2, z: s.z + (rnd() - 0.5) * 3, vx: (rnd() - 0.5) * 6, vy: 2 + rnd() * 5, vz: (rnd() - 0.5) * 6, age: -k * 0.005, life: 1 + rnd() * 0.5, color: new THREE.Color(rnd() < 0.5 ? "#c79a62" : "#9a9a9a") });
    App.sfx && App.sfx.crash && App.sfx.crash();
    if (s.house) for (const id of App.residentsOf(s)) { App.invalidatePlan(id); const t = App.pop.agent[id]; if (t && t.action && t.action.act && t.action.act.id === "rest") App.endAction(t); }
    const v = App.villages[st.ruins[s.idx].village];
    if (near(s.x, s.z)) App.log("ruin", (s.house ? App.residentsOf(s).map(App.nameOf).join(" and ") + "'s house" : "The " + (TB.KIT[App.kindOf(s.orig)] ? TB.KIT[App.kindOf(s.orig)].name.toLowerCase() : "building")) + " in " + v.name + " was destroyed " + cause + ".",
      s.house ? "They will sleep in the town hall while the village rebuilds it." : "The village will rebuild it.");
  };
  // who lives in a building: a house's household, everyone in a mansion
  App.residentsOf = (s) => (s.village == null ? [] : s.house ? (s.members || [App.villages[s.village].residents[s.slot]]) : s.mansion ? App.villages[s.village].residents : []);
  App.villageRuins = (v) => Object.keys(st.ruins || {}).map(Number).filter((k) => st.ruins[k].village === v.i).sort((a, b) => st.ruins[a].since - st.ruins[b].since);
  App.homeRuined = (id) => { const v = App.villageOfToken(id), h = v.homes[v.residents.indexOf(id)]; return !!(h && h.sc && h.sc.ruined); };
  // where a Tickle sleeps: its house, or the town hall while the house is down
  App.homeOf = (id) => {
    const v = App.villageOfToken(id);
    if (App.homeRuined(id)) return { x: v.hall.door.x, z: v.hall.door.z, label: "the town hall of " + v.name + (App.homeUpgrading && App.homeUpgrading(id) ? " (its new house is being built)" : " (house in ruins)") };
    return { x: App.pop.home[2 * id], z: App.pop.home[2 * id + 1], label: "home in " + v.name };
  };
  // builders work through the afternoon; a house takes about fourteen worker-hours
  const overlap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  App.rebuildTick = (T0, T1) => {
    if (!st.ruins) return;
    const byV = {};
    for (const k in st.ruins) (byV[st.ruins[k].village] = byV[st.ruins[k].village] || []).push(+k);
    for (const vi in byV) {
      const v = App.villages[vi], list = byV[vi].sort((a, b) => st.ruins[a].since - st.ruins[b].since);
      const day = Math.floor(T1 / DAY), hrs = overlap(T0, T1, day * DAY + 14 * 60, day * DAY + 17 * 60 + 30) / 60;
      if (!hrs) continue;
      const crew = Math.max(2, Math.round(((v.crew ? v.crew.farm + v.crew.gather : 8)) * 0.45));
      let work = ((hrs * crew) / 14) * (App.stoneBoost ? App.stoneBoost(v) : 1); // a house is about fourteen worker-hours; stone from the mine helps
      for (const k of list) {
        if (work <= 0) break;
        const r = st.ruins[k], s = App.sceneryAll[k], use = Math.min(work, 1 - r.progress);
        r.progress += use; work -= use;
        if (r.progress >= 0.5 && s.type === "ruins_0") { s.type = "scaffold_0"; App.sceneryDirty = true; }
        if (r.progress >= 0.999) {
          s.type = r.orig; s.ruined = false; delete st.ruins[k]; App.sceneryDirty = true;
          if (s.house) for (const id of App.residentsOf(s)) App.invalidatePlan(id);
          if (r.upgrade) { if (near(s.x, s.z) || App.residentsOf(s).some((x) => App.isMine && App.isMine(x))) App.log("build", "The people of " + v.name + " finished " + App.residentsOf(s).map(App.nameOf).join(" and ") + "'s new " + (r.upgrade === 2 ? "manor" : "townhouse") + ".", "Paid for out of its own purse; the whole village lent a hand in the afternoons."); }
          else if (near(s.x, s.z)) App.log("build", "The people of " + v.name + " finished rebuilding " + (s.house ? App.residentsOf(s).map(App.nameOf).join(" and ") + "'s house" : "their " + (TB.KIT[App.kindOf(r.orig)] ? TB.KIT[App.kindOf(r.orig)].name.toLowerCase() : "building")) + ".", "Everyone lent a hand in the afternoons.");
        }
      }
    }
  };
  // a builder's place for today, if the village has something to put back up
  App.buildSite = (id, day) => {
    const v = App.villageOfToken(id), list = App.villageRuins(v);
    if (!list.length) return null;
    const k = list[Math.floor(hash2(id, day, 113) * Math.min(2, list.length))], s = App.sceneryAll[k], a = hash2(id, day, 114) * 6.283;
    // builders stand round the outside of the footprint (a town hall is much bigger than a house), never inside the walls
    const R = s.hall ? 5.4 : /^(palace|castle|mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic)_/.test(s.type) || (s.orig && /^(palace|castle|mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic)_/.test(s.orig)) ? 8 : s.granary ? 3.8 : st.ruins[k] && st.ruins[k].upgrade === 2 ? 4.8 : 3.3;
    return { x: s.x + Math.cos(a) * R, z: s.z + Math.sin(a) * R, type: "build", label: "rebuilding in " + v.name, cx: s.x, cz: s.z };
  };

  // ---------- buildings moved by hand carry their residents' doors with them ----------
  App.syncBuilding = (s) => {
    if (s.village == null) return;
    const v = App.villages[s.village];
    const door = (d) => ({ x: s.x + Math.sin(s.rot) * d, z: s.z + Math.cos(s.rot) * d });
    if (s.house) {
      const h = (v.houses && v.houses[s.slot]) || v.homes[s.slot], dr = door(2.7);
      h.hx = s.x; h.hz = s.z; h.x = dr.x; h.z = dr.z;
      for (const id of App.residentsOf(s)) { App.pop.home[2 * id] = dr.x; App.pop.home[2 * id + 1] = dr.z; const t = App.pop.agent[id]; if (t) { t.home.x = dr.x; t.home.z = dr.z; } }
      const id = App.residentsOf(s)[0], t = App.pop.agent[id];
      if (t) { t.home.x = dr.x; t.home.z = dr.z; }
      App.invalidatePlan(id);
    } else if (s.hall) { v.hall.x = s.x; v.hall.z = s.z; v.hall.door = door(4); }
    else if (s.granary) { v.granary.x = s.x; v.granary.z = s.z; }
  };
  // something thrown hard breaks where it lands
  App.breakScenery = (s) => {
    if (s.building) { App.ruin(s, "when it was thrown"); return; }
    st.broken[s.idx] = st.T + 2 * DAY;
    const y = App.genHeight(s.x, s.z);
    for (let k = 0; k < 50; k++) particles({ kind: "spark", x: s.x + (rnd() - 0.5) * 2, y: y + 1 + rnd() * 2, z: s.z + (rnd() - 0.5) * 2, vx: (rnd() - 0.5) * 6, vy: 2 + rnd() * 4, vz: (rnd() - 0.5) * 6, age: -k * 0.005, life: 1, color: new THREE.Color(s.tree ? (rnd() < 0.6 ? "#2e8b3a" : "#7a4a24") : "#c79a62") });
    App.sfx && App.sfx.crash && App.sfx.crash(0.6);
    App.sceneryDirty = true;
  };
  App.isBroken = (s) => !!(st.broken && st.broken[s.idx] > st.T);

  // ---------- the clock ----------
  App.fateTick = () => {
    if (!st.rituals) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    for (const k in st.rituals) {
      const r = st.rituals[k];
      if (r.done) { if (r.day < day - 2) delete st.rituals[k]; continue; }
      const v = App.villages[r.village];
      r.live = st.T >= r.s && st.T < r.e && near(v.x, v.z) && Math.hypot(v.x - App.cam.target.x, v.z - App.cam.target.z) < 90;
      if (r.live && rnd() < 0.25) for (let j = 0; j < 6; j++) particles({ kind: "spark", x: v.altar.x + (rnd() - 0.5), y: App.genHeight(v.altar.x, v.altar.z) + 1.4, z: v.altar.z + (rnd() - 0.5), vx: (rnd() - 0.5) * 0.8, vy: 2 + rnd() * 2, vz: (rnd() - 0.5) * 0.8, age: 0, life: 1.4, color: new THREE.Color("#ffd23f") });
      if (st.T >= r.e) resolveRitual(r);
    }
    for (const k in st.broken) if (st.broken[k] <= st.T) { delete st.broken[k]; App.sceneryDirty = true; }
    // nobody stays fallen with no ritual coming
    if (!(st.T < (st.fateCheck || 0))) {
      st.fateCheck = st.T + 60;
      for (const id in st.fallen) { const v = App.villages[st.fallen[id].village]; if (!st.rituals[v.i] || st.rituals[v.i].done) ensureRitual(v); }
    }
  };
})();
