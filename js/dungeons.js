/* Dungeons: caves in every region with monsters (Gloomslime, Shadebat, Brutecap) lurking at the
 * mouth. Some afternoons a party of adventurers from one village walks there, fights its way to the
 * entrance, goes down into the cave and comes back up with treasure for the granary. Every Tickle
 * has a level; fighting monsters (and raiding, and defending against dragons) earns experience, and
 * a higher level hits harder, tames better and stands up longer. Off screen the same in short. */
(function () {
  "use strict";
  const App = window.App, st = App.st, S = App.S;
  const rnd = Math.random, hash2 = App.hash2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const DAY = 1440, A0 = 13 * 60 + 50, A1 = 17 * 60 + 10;
  const MONSTERS = (App.MONSTERS = {
    gloomslime: { name: "Gloomslime", hp: 26, atk: 6, xp: 10 },
    shadebat: { name: "Shadebat", hp: 20, atk: 8, xp: 12, hover: 1.3 },
    brutecap: { name: "Brutecap", hp: 48, atk: 11, xp: 22 },
  });
  const MKINDS = Object.keys(MONSTERS);

  // ---------- levels for every Tickle ----------
  let LVL = null, XP = null;
  const xpNeed = (l) => 30 + l * 25;
  App.levelOf = (id) => (LVL ? LVL[id] : 1);
  App.xpOf = (id) => (XP ? XP[id] : 0);
  App.xpNeed = xpNeed;
  App.giveXP = (id, xp) => {
    XP[id] += xp;
    let up = false;
    while (XP[id] >= xpNeed(LVL[id]) && LVL[id] < 50) { XP[id] -= xpNeed(LVL[id]); LVL[id]++; up = true; }
    const t = App.pop.agent[id];
    if (up && t) { App.say(t, "Level " + LVL[id] + "!", 4); App.log("level", t.name + " reached level " + LVL[id] + ".", "Experience from monsters, raids and dragons."); }
    return up;
  };
  App.isAdventurer = (id) => hash2(id, 93, 3) < 0.22;
  App.initDungeons = (saved) => {
    const N = TB.SUPPLY;
    LVL = new Uint8Array(N); XP = new Float32Array(N);
    for (let id = 0; id < N; id++) LVL[id] = 1 + Math.floor(Math.pow(hash2(id, 97, 3), 3) * 5) + (App.isAdventurer(id) ? 1 : 0);
    if (saved && saved.lv) for (const [id, l, x] of saved.lv) { LVL[id] = l; XP[id] = x; }
    st.parties = (saved && saved.parties) || {};
    st.delves = (saved && saved.delves) || {};
    // the Great Underworld: relics carried, guardians beaten, how deep each village has been, what happened lately
    st.relics = (saved && saved.relics) || {};
    st.conquered = (saved && saved.conquered) || {};
    st.depth = (saved && saved.depth) || {};
    st.guardians = (saved && saved.guardians) || {};
    st.uwlog = (saved && saved.uwlog) || [];
    st.chosenConq = (saved && saved.chosenConq) || 0;
    st.chosenDepth = (saved && saved.chosenDepth) || 0;
  };
  App.saveDungeons = () => {
    const lv = [];
    for (let id = 0; id < LVL.length; id++) if (XP[id] > 0 || LVL[id] > 1) lv.push([id, LVL[id], Math.round(XP[id])]);
    return { lv, parties: st.parties, delves: st.delves, relics: st.relics, conquered: st.conquered, depth: st.depth, guardians: st.guardians, uwlog: st.uwlog, chosenConq: st.chosenConq || 0, chosenDepth: st.chosenDepth || 0 };
  };

  // ---------- parties ----------
  // a village sends a party to its nearest cave on some afternoons
  // some afternoons the strongest of the Maker's blessed, from whatever village, go down together as the
  // Maker's Chosen: two or three of them, never one alone (a single blessed Tickle cannot finish the Underworld)
  const nearestCave = (v) => (App.dungeons || []).slice().sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[0];
  let heroIds = null;
  App.chosenParty = (day) => {
    if (!st.parties || !App.dungeons || !App.heroOf) return null;
    const k = "chosen:" + day;
    if (st.parties[k] !== undefined) return st.parties[k];
    let p = null;
    if (!heroIds) { heroIds = []; for (let id = 0; id < TB.SUPPLY; id++) if (App.heroOf(id)) heroIds.push(id); }
    if (hash2(day, 7, 931) < 0.5) {
      const members = heroIds.filter((id) => !App.isKO(id) && !App.isDead(id)).sort((a, b) => App.underPower(b) - App.underPower(a)).slice(0, 3);
      const v = members.length ? App.villageOfToken(members[0]) : null, dg = v && nearestCave(v);
      if (members.length >= 2 && dg) p = { day, chosen: true, village: v.i, dungeon: dg.i, members, done: false, loot: 0, kills: 0, start: App.chosenWaystone() };
    }
    st.parties[k] = p;
    return p;
  };
  App.chosenConquered = () => st.chosenConq || 0;
  App.chosenWaystone = () => Math.max(0, Math.min(FLOORS - 1, App.chosenConquered() - 1));
  App.partyOf = (id, day) => {
    if (!st.parties || !App.dungeons) return null;
    const cp = App.chosenParty(day);
    if (cp && cp.members.includes(id)) return cp.done ? null : cp;
    const v = App.villageOfToken(id), k = day + ":" + v.i;
    let p = st.parties[k];
    if (p === undefined) {
      p = null;
      const dg = (App.dungeons || []).filter((d) => Math.hypot(d.x - v.x, d.z - v.z) < 300).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[0];
      if (dg && hash2(v.i, day, 95) < 0.45) {
        const members = v.residents.filter((r) => (App.isAdventurer(r) || (App.gearOf && App.gearOf(r))) && !App.isKO(r) && !App.isDead(r) && !(cp && cp.members.includes(r)))
          .sort((a, b) => App.underPower(b) * (0.8 + 0.4 * hash2(b, day, 96)) - App.underPower(a) * (0.8 + 0.4 * hash2(a, day, 96))).slice(0, 4);
        // a scout from the Marauders' Guild goes with them if the village has one free
        const scout = App.guildOf ? v.residents.find((r) => App.guildOf(r) === "marauders" && !App.isKO(r) && !App.isDead(r) && !members.includes(r) && !(cp && cp.members.includes(r))) : null;
        if (scout != null && members.length >= 2) { if (members.length >= 4) members[3] = scout; else members.push(scout); }
        if (members.length >= 2) p = { day, village: v.i, dungeon: dg.i, members, done: false, loot: 0, kills: 0, start: App.waystone(v.i) };
      }
      st.parties[k] = p;
    }
    return p && p.members.includes(id) && !p.done ? p : null;
  };
  App.adventureWindow = { start: A0, end: A1 };

  // ---------- monsters at the cave mouths near the player ----------
  const geo = {}, meshes = {}, CAP = 80;
  const lurking = new Map(); // dungeon index -> [monster bodies]
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  App.loadMonsters = async () => {
    await Promise.all(MKINDS.map(async (k) => {
      const K = TB.KIT[k], r = await App.job("compact", { strokes: K.build(0), voxel: K.voxel[0], lip: 1.5 });
      const md = r.mesh, g = App.makeVoxMesh(md).geometry, box = App.meshBox(md);
      const local = new THREE.Matrix4().compose(new THREE.Vector3(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - box.min.y, md.origin[2] * S - (box.min.z + box.max.z) / 2),
        new THREE.Quaternion(), new THREE.Vector3(md.voxel * S, md.voxel * S, md.voxel * S));
      geo[k] = { geo: g, local, h: box.max.y - box.min.y };
      const m = new THREE.InstancedMesh(g, App.voxMaterial, CAP);
      m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      App.scene.add(m);
      meshes[k] = m;
    }));
  };
  const respawn = new Map(); // "dungeon:slot" -> time it comes back
  App.updateMonsterSet = () => {
    if (!geo.gloomslime) return;
    const tx = App.cam.target.x, tz = App.cam.target.z;
    const keep = new Set();
    for (const d of App.dungeons || []) {
      if (Math.hypot(d.x - tx, d.z - tz) > App.RANGE.scenery * 0.8) continue;
      keep.add(d.i);
      if (lurking.has(d.i)) continue;
      const list = [];
      for (let k = 0; k < 5; k++) {
        const kind = MKINDS[Math.floor(hash2(d.i, k, 98) * 3)];
        if (!App.kitOn(kind)) continue;
        const a = d.rot + (hash2(d.i, k, 99) - 0.5) * 2.4, r = 6 + hash2(d.i, k, 100) * 7;
        const x = d.door.x + Math.sin(a) * r, z = d.door.z + Math.cos(a) * r;
        list.push({ kind, slot: k, x, z, y: App.genHeight(x, z), h: rnd() * 6.28, hp: MONSTERS[kind].hp + d.depth * 4, max: MONSTERS[kind].hp + d.depth * 4, t: null, wait: rnd() * 3, wob: rnd() * 6, home: { x: d.door.x + Math.sin(d.rot) * 7, z: d.door.z + Math.cos(d.rot) * 7, r: 9 }, d });
      }
      lurking.set(d.i, list);
    }
    for (const k of [...lurking.keys()]) if (!keep.has(k)) lurking.delete(k);
  };
  App.monsterNear = (x, z, R) => {
    let best = null, bd = R;
    for (const list of lurking.values()) for (const m of list) {
      if (m.dead || (respawn.get(m.d.i + ":" + m.slot) || 0) > st.T) continue;
      const d = Math.hypot(m.x - x, m.z - z);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  };
  App._lurking = lurking;
  App.monstersNear = (x, z, R) => { const out = []; for (const list of lurking.values()) for (const m of list) if (!m.dead && Math.abs(m.x - x) + Math.abs(m.z - z) < R) out.push(m); return out; };
  const isLand = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) >= App.SEA;
  function turnTo(h, t, k) { let d = t - h; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return h + d * k; }
  function stepMonster(m, dm) {
    if (m.dead) { if ((respawn.get(m.d.i + ":" + m.slot) || 0) <= st.T) { m.dead = false; m.hp = m.max; m.x = m.home.x; m.z = m.home.z; } return; }
    if (m.held || m.flying) return;
    if (m.foe) {
      m.h = turnTo(m.h, Math.atan2(m.foe.pos.x - m.x, m.foe.pos.z - m.z), Math.min(1, dm * 5));
      // it lunges at the Tickle fighting it: sparks fly and the Tickle staggers
      m.atk = (m.atk || 0) + dm;
      if (m.atk > 1.15) {
        m.atk = 0; m.lungeAt = performance.now();
        const t = m.foe;
        if (App.FX && t.pos) { App.FX.slash(App.scene, { x: t.pos.x, y: (t.pos.y || m.y) + 1.4, z: t.pos.z }, m.h, "#ff9a7a"); App.FX.burst(App.scene, { x: t.pos.x, y: (t.pos.y || m.y) + 1.2, z: t.pos.z }, "#ff6b5e", 6, 0.1); }
        t.hitAt = performance.now();
      }
      return;
    }
    if (m.wait > 0) { m.wait -= dm; return; }
    if (!m.t) { const a = rnd() * 6.28, d = rnd() * m.home.r, x = m.home.x + Math.cos(a) * d, z = m.home.z + Math.sin(a) * d; if (isLand(x, z)) m.t = { x, z }; else { m.wait = 2; return; } }
    const dx = m.t.x - m.x, dz = m.t.z - m.z, d = Math.hypot(dx, dz);
    if (d < 0.3) { m.t = null; m.wait = 2 + rnd() * 6; return; }
    const step = Math.min(d, 0.8 * dm), nx = m.x + (dx / d) * step, nz = m.z + (dz / d) * step;
    if (!isLand(nx, nz) || !App.climbOK(m.x, m.z, nx, nz)) { m.t = null; return; }
    m.x = nx; m.z = nz; m.wob += step * 6; m.h = turnTo(m.h, Math.atan2(dx, dz), Math.min(1, dm * 4));
  }
  App.monsterDown = (m) => { m.dead = true; m.foe = null; respawn.set(m.d.i + ":" + m.slot, st.T + 150); poof(m); };
  function poof(m) {
    const col = new THREE.Color(m.kind === "brutecap" ? "#ff6b5e" : "#c9a6ff");
    for (let k = 0; k < 40; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: m.x, y: m.y + 0.8, z: m.z, vx: (rnd() - 0.5) * 7, vy: 1 + rnd() * 5, vz: (rnd() - 0.5) * 7, age: -k * 0.004, life: 0.7 + rnd() * 0.4, color: col });
  }

  // ---------- adventurers on screen ----------
  // returns what the brain should do: { travel }, { act } or nothing (already set)
  App.adventureBrain = (t, step) => {
    const p = App.partyOf(t.id, Math.floor(st.T / DAY)), d = p ? App.dungeons[p.dungeon] : null;
    if (!d) return null;
    if (Math.hypot(d.door.x - t.pos.x, d.door.z - t.pos.z) > 14 && !App.monsterNear(t.pos.x, t.pos.z, 10)) return { travel: { x: d.door.x + Math.sin(d.rot) * 5, z: d.door.z + Math.cos(d.rot) * 5, label: d.name } };
    const m = App.monsterNear(t.pos.x, t.pos.z, 16);
    if (m) {
      t.action = { kind: "brawl", foe: m, started: st.T, next: st.T + 0.6, party: p };
      if (rnd() < 0.5) App.say(t, "A " + MONSTERS[m.kind].name + "! Get it!", 2.5);
      return { set: true };
    }
    // the way in is clear: down into the cave
    t.action = { kind: "delve", phase: "walk", spot: { x: d.door.x, z: d.door.z }, started: st.T, party: p, dungeon: d, until: st.T + 25 + rnd() * 20 };
    return { set: true };
  };
  App.stepDungeonAction = (t, a, dm) => {
    if (a.kind === "brawl") {
      const m = a.foe;
      if (!m || m.dead || App.isKO(t.id) || st.T - a.started > 30) { if (m) m.foe = null; t.action = null; return "idle"; }
      const d = Math.hypot(m.x - t.pos.x, m.z - t.pos.z);
      if (d > 1.6) return "walk";
      m.foe = t;
      t.heading = Math.atan2(m.x - t.pos.x, m.z - t.pos.z);
      if (st.T >= a.next) {
        a.next = st.T + 1 + rnd() * 0.6;
        t.swingAt = performance.now();
        const lvl = App.levelOf(t.id);
        const dmg = (4 + lvl * 1.4 + rnd() * 4) * (App.gearOf && App.gearOf(t.id) && App.gearOf(t.id).silver ? 1.5 : 1); // monsters fear silver
        m.hp -= dmg;
        if (App.FX) App.FX.number(App.scene, { x: m.x, y: m.y + 2.2, z: m.z }, String(Math.round(dmg)), "#ffd23f");
        App.say(t, ["Hyah!", "Take that!", "Whack!", "Back to your cave!"][Math.floor(rnd() * 4)], 1.2);
        if (m.hp <= 0) {
          m.dead = true; m.foe = null;
          respawn.set(m.d.i + ":" + m.slot, st.T + 150);
          poof(m);
          if (a.party) a.party.kills++;
          // everyone of the party close by shares the experience
          for (const o of st.tickles) if (o === t || (a.party && a.party.members.includes(o.id) && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 12)) App.giveXP(o.id, MONSTERS[m.kind].xp);
          App.say(t, "Got it!", 2.5);
          t.action = null;
          return "idle";
        }
        // the monster hits back; a strong Tickle shrugs it off
        if (rnd() < clamp(0.045 + MONSTERS[m.kind].atk * 0.003 - lvl * 0.006, 0.01, 0.12)) { m.foe = null; App.maybeKill(t.id, 0.15, "fighting a " + MONSTERS[m.kind].name + " at " + m.d.name, 240, "Ouch\u2026 KO!"); return "idle"; }
      }
      return "fight";
    }
    if (a.kind === "delve") {
      if (a.phase === "walk") {
        if (Math.hypot(a.spot.x - t.pos.x, a.spot.z - t.pos.z) > 0.6) return "walk";
        a.phase = "inside";
        App.say(t, "Into the dark we go!", 2);
        return "hide";
      }
      if (st.T < a.until) {
        // muffled fighting from deep inside now and then
        if (rnd() < dm * 0.08) { const d = a.dungeon; for (let k = 0; k < 14; k++) App.spawnParticle && App.spawnParticle({ kind: "spark", x: d.door.x, y: App.genHeight(d.door.x, d.door.z) + 1.2, z: d.door.z, vx: Math.sin(d.rot) * (2 + rnd() * 3), vy: 1 + rnd() * 2, vz: Math.cos(d.rot) * (2 + rnd() * 3), age: 0, life: 0.6, color: new THREE.Color("#c9a6ff") }); }
        return "hide";
      }
      // back up with whatever was down there
      const lvl = App.levelOf(t.id), d = a.dungeon;
      if (rnd() < clamp(0.18 + d.depth * 0.03 - lvl * 0.015, 0.03, 0.4)) { t.action = null; App.maybeKill(t.id, 0.12, "deep inside " + d.name, 240, "That was rough\u2026"); return "show"; }
      const loot = 2 + Math.round(rnd() * (3 + d.depth));
      t.village.food += loot;
      if (a.party) a.party.loot += loot;
      if (App.addEthernum && rnd() < 0.35) { App.addEthernum(t.id, 1); App.say(t, "An Ethernum crystal!", 3); }
      App.giveXP(t.id, 18 + d.depth * 4);
      App.say(t, ["Treasure!", "Look what I found!", "Food for the granary!"][Math.floor(rnd() * 3)], 3);
      st.delves[d.i] = (st.delves[d.i] || 0) + 1;
      t.action = null;
      return "show";
    }
    return "idle";
  };

  // ---------- the Great Underworld: expeditions, treasure, and getting strong enough to go deeper ----------
  // A village's party takes the shortcut down to the floor of the last guardian its village has beaten,
  // then goes on, up to three floors an afternoon. A floor is cleared if the party is strong enough for
  // its monsters; then its chests are opened and its Ether gathered, and the guardian at the stairs
  // must be beaten to go on. Treasure makes the village stronger: Ethernum for the adventurers,
  // precious metals for the smith (silver tips, gem collars, gold, the Orichalcum Blade), shells, food,
  // and relics that each make their bearer stronger. Deeper floors need far more strength.
  // twelve floors, each as hard as the floor of the old thirty-six it stands for (App.UNDER_OLD, interiors.js)
  const FLOORS = 12, OLD = App.UNDER_OLD || [5, 11, 15, 17, 22, 23, 26, 27, 28, 29, 33, 35], oldOf = (f) => OLD[Math.max(0, Math.min(FLOORS - 1, f))];
  const RELICS = (App.RELICS = {
    charm: { name: "Lucky Goblin Charm", band: 0, bonus: 1.05 }, spearhead: { name: "Kobold Spearhead", band: 0, bonus: 1.06 },
    boneamulet: { name: "Bone Amulet", band: 1, bonus: 1.08 }, scarab: { name: "Pharaoh's Scarab", band: 1, bonus: 1.1 },
    scalemail: { name: "Serpent Scale Mail", band: 2, bonus: 1.12 }, gorgoneye: { name: "Gorgon's Eye", band: 2, bonus: 1.14 },
    horn: { name: "Minotaur Horn", band: 3, bonus: 1.16 }, gauntlet: { name: "Titan's Gauntlet", band: 3, bonus: 1.18 },
    ember: { name: "Phoenix Ember", band: 4, bonus: 1.2 }, fang: { name: "Hydra Fang", band: 4, bonus: 1.22 },
    crown: { name: "Abyssal Crown", band: 5, bonus: 1.28 }, phylactery: { name: "Lich's Phylactery", band: 5, bonus: 1.3 },
    heart: { name: "The Heart of the Chain", band: 9, bonus: 1.25 }, // only from the Golden Tickle
  });
  const relicInfo = (k) => RELICS[k] || (k[0] === "g" ? { name: "Trophy of " + ((App.GUARDIANS && App.GUARDIANS[+k.slice(1)]) || { name: "a guardian" }).name.replace(/,.*$/, ""), bonus: 1.03 + oldOf(+k.slice(1)) * 0.002 } : { name: k, bonus: 1 });
  App.relicInfo = relicInfo;
  App.relicsOf = (id) => (st.relics && st.relics[id]) || [];
  const relicMult = (id) => Math.min(2, App.relicsOf(id).reduce((m, k) => m * relicInfo(k).bonus, 1));
  // a Tickle carries six relics at most: a new one replaces the weakest
  function giveRelic(id, key) {
    const list = (st.relics[id] = st.relics[id] || []);
    if (list.includes(key)) return false;
    list.push(key);
    if (list.length > 6) { list.sort((a, b) => relicInfo(b).bonus - relicInfo(a).bonus); list.length = 6; }
    return list.includes(key);
  }
  const WMULT = { sword: 1.3, axe: 1.35, spear: 1.3, goldsword: 2.6, orisword: 2.4, staff: 1.45 }; // the Maker's golden blade outdoes even orichalcum
  // how much one Tickle counts for down there
  App.underPower = (id) => {
    const g = App.gearOf ? App.gearOf(id) : null;
    const wm = App.armsMul ? App.armsMul(id) : { w: 1, s: 1 }; // worn arms count for less (wealth.js)
    const arms = g ? (1 + ((WMULT[g.weapon] || 1.2) * (g.silver ? 1.15 : 1) * (1 + 0.08 * (g.armor || 0) * wm.s) - 1) * wm.w) : 1;
    const creature = App.leadCreature && App.leadCreature(id) ? 1.15 : 1;
    const ether = g && g.mage && App.ethernumOf ? 1 + Math.min(0.4, App.ethernumOf(id) * 0.02) : 1; // a mage's spells feed on the Ether it carries
    return (4 + App.levelOf(id) * 1.4) * arms * ether * relicMult(id) * creature * (App.heroPower ? Math.sqrt(App.heroPower(id)) : 1) * (App.guildPower ? App.guildPower(id) : 1);
  };
  // the strength a party needs: for a floor's monsters, and more for its guardian; the Golden Tickle at the bottom most of all
  const floorNeed = (f0) => { const f = oldOf(f0); return 30 * Math.pow(1.13, Math.min(f, 20)) * Math.pow(1.09, Math.max(0, f - 20)); }, guardianNeed = (f) => floorNeed(f) * 1.35 * (f === FLOORS - 1 ? 1.25 : 1);
  App.floorNeed = floorNeed; App.guardianNeed = guardianNeed;
  // where a village's parties start: the stairs of the last guardian it has beaten (a shortcut down), one floor above the unknown
  App.conquered = (vi) => (st.conquered && st.conquered[vi]) || 0; // guardians beaten, from the top down
  App.waystone = (vi) => Math.max(0, Math.min(FLOORS - 1, App.conquered(vi) - 1));
  const BAND_LOOT = ["Ether crystals and silver", "Ether crystals, silver and gold", "Ether crystals, gold, silver and gems", "Ether crystals, gold, gems and a little orichalcum", "Ether crystals, gold, gems and orichalcum", "Ether crystals, gems and orichalcum"];
  App.bandLoot = (f) => BAND_LOOT[Math.min(5, Math.floor(oldOf(f) / 6))];
  function expedition(p, day, dry) {
    const v = App.villages[p.village], members = p.members.filter((id) => !App.isDead(id) && !(App.pop.ko[id] > st.T + 1));
    if (!members.length || !st.relics) return null;
    // the plan made at the start of the afternoon decides how it goes (so what you watched is what happened)
    const forced = !dry && p.plan ? p.plan.stages.slice() : null, decide = (natural) => (forced ? (forced.length ? forced.shift().ok : false) : natural);
    const stages = [], scout = App.guildOf ? members.some((id) => App.guildOf(id) === "marauders") : false;
    const R = (k) => hash2((p.chosen ? 7777 : p.village * 31) + k, day, 911);
    const conq = () => (p.chosen ? App.chosenConquered() : App.conquered(v.i)), setConq = (n) => { if (p.chosen) st.chosenConq = n; else st.conquered[v.i] = n; };
    const who = p.chosen ? "The Maker's Chosen (" + members.map(App.nameOf).join(", ") + ")" : "The adventurers of " + v.name;
    // two or more of the Maker's blessed together: their blessings resonate and each grows stronger (one alone gets nothing)
    const blessed = App.heroOf ? members.filter((id) => App.heroOf(id)).length : 0, resonance = blessed >= 2 ? 1 + 0.35 * (blessed - 1) : 1;
    // Ether lights the way: a crystal from each adventurer who has one makes the party stronger
    let power = 0, lit = 0;
    for (const id of members) { let pw = App.underPower(id) * (App.heroOf && App.heroOf(id) ? resonance : 1); if (App.ethernumOf && App.ethernumOf(id) >= 1) { if (!dry) App.addEthernum(id, -1); pw *= 1.15; lit++; } power += pw; }
    const start = p.start != null ? p.start : App.waystone(v.i), loot = { ethernum: 0, silver: 0, gold: 0, gems: 0, orichalcum: 0, coal: 0, shells: 0, food: 0 }, found = [], beaten = [], tamed = [];
    let f = start, cleared = 0, stopped = null;
    for (let n = 0; n < 2 && f < FLOORS; n++) {
      // the floor: its monsters
      // a scout knows the ways: the party gets further and finds more
      const ratio = power / floorNeed(f), okF = decide(!(R(n * 7 + 1) > Math.min(0.97, Math.max(0.03, ratio - 0.3 + (scout ? 0.08 : 0)))));
      stages.push({ f, kind: "floor", ok: okF });
      if (!okF) { stopped = { f, by: "the monsters of B" + (f + 1) + "F" }; break; }
      cleared++;
      // its chests and its Ether
      const b = Math.floor(oldOf(f) / 6), q = (k) => R(n * 13 + k);
      loot.ethernum += 1 + Math.floor(b / 2) + (q(2) < 0.5 ? 1 : 0);
      loot.silver += b <= 3 ? 1 + (q(3) < 0.5 ? 1 : 0) : 0;
      loot.gold += b >= 1 ? b : q(4) < 0.3 ? 1 : 0;
      loot.gems += b >= 2 ? b - 1 : 0;
      loot.orichalcum += b >= 3 && q(5) < 0.06 + 0.04 * (b - 3) ? 1 : 0; // the legendary metal stays rare
      loot.coal += 1;
      loot.shells += 5 * (f + 1);
      loot.food += 2 + b;
      if (!dry && q(6) < 0.03 + 0.01 * b) {
        const pick = Object.keys(RELICS).filter((k) => RELICS[k].band === b), key = pick[Math.floor(q(7) * pick.length)];
        const to = members.slice().sort((a, c) => App.relicsOf(a).length - App.relicsOf(c).length).find((id) => !App.relicsOf(id).includes(key));
        if (to != null && giveRelic(to, key)) found.push([to, key]);
      }
      if (!dry) for (const id of members) { App.giveXP(id, 10 + 4 * (f + 1)); App.guildDeed && App.guildDeed(id, 2); }
      // a tamer in the party may win over one of the floor's monsters (never its guardian)
      if (!dry && App.tameMonster && App.BAND_MONSTERS) {
        const kinds = App.BAND_MONSTERS(f);
        if (kinds.length) members.forEach((id, k) => {
          if (!App.isTamer(id) || App.creaturesOf(id).length >= 3 || q(20 + k) >= 0.07) return;
          const c = App.tameMonster(id, kinds[Math.floor(q(30 + k) * kinds.length)], 2 + Math.floor(f / 2) + Math.floor(q(40 + k) * 3));
          if (c) tamed.push([id, c, f]);
        });
      }
      // the guardian at the stairs
      const G = App.GUARDIANS ? App.GUARDIANS[f] : { name: "the guardian" };
      // the Golden Tickle cannot be beaten by luck: a party needs at least four fifths of the strength it asks for
      const gr = power / guardianNeed(f), chance = f === FLOORS - 1 && gr < 0.8 ? 0 : Math.min(0.95, Math.max(0.03, gr - 0.35));
      const okG = decide(R(n * 7 + 3) < chance);
      stages.push({ f, kind: "guardian", ok: okG });
      if (!okG) { stopped = { f, by: G.name }; break; }
      beaten.push(f);
      if (dry) { f++; continue; }
      for (const id of members) { App.giveXP(id, 15 * (f + 1)); App.guildDeed && App.guildDeed(id, 5); }
      // beaten for the first time by this village: a trophy for its strongest
      if (f + 1 > conq()) {
        setConq(f + 1);
        const best = members.slice().sort((a, c) => App.underPower(c) - App.underPower(a))[0];
        if (giveRelic(best, f === FLOORS - 1 ? "heart" : "g" + f)) found.push([best, f === FLOORS - 1 ? "heart" : "g" + f]);
        if (!st.guardians[f] && f === FLOORS - 1) { st.guardians[f] = { village: v.i, day, by: best, chosen: !!p.chosen }; App.log("dungeon", who + " have beaten the Golden Tickle, deep beneath the Maker's Isle!", "At the bottom of the Great Underworld, where every way through meets, " + App.nameOf(best) + " struck the last blow and took the Heart of the Chain. Nobody had ever gone so deep.", { who: [best] }); App.toast((p.chosen ? "The Maker's Chosen have" : v.name + " has") + " beaten the Golden Tickle!"); }
        else if (!st.guardians[f]) { st.guardians[f] = { village: v.i, day, by: best, chosen: !!p.chosen }; App.log("dungeon", who + " have beaten " + G.name + " on B" + (f + 1) + "F, the first ever to do it!", App.nameOf(best) + " carries its trophy. The way down to B" + (f + 2) + "F is open to them.", { who: [best] }); App.toast((p.chosen ? "The Maker's Chosen" : v.name) + " beat " + G.name + " on B" + (f + 1) + "F!"); }
      }
      f++;
    }
    if (dry) return stages;
    if (scout) for (const k of Object.keys(loot)) loot[k] = Math.round(loot[k] * 1.3);
    if (p.chosen) st.chosenDepth = Math.max(st.chosenDepth || 0, Math.min(FLOORS - 1, f));
    else st.depth[v.i] = Math.max(st.depth[v.i] || 0, Math.min(FLOORS - 1, f));
    // a beaten party comes back hurt; now and then someone falls
    if (stopped) for (const id of members) if (hash2(id, day, 913) < 0.3) { if (hash2(id, day, 914) < 0.1 && App.kill) App.kill(id, "fighting " + stopped.by + " in the Great Underworld"); else App.pop.ko[id] = Math.max(App.pop.ko[id], day * DAY + A1 + 240); }
    // the treasure: metals to the village stores (the smith turns them into arms), food to the granary, the rest shared out
    // (the Chosen share it out among their home villages)
    const homes = p.chosen ? [...new Set(members.map((id) => App.villageOfToken(id)))] : [v];
    for (const hv of homes) {
      const o = App.oreOf ? App.oreOf(hv) : null;
      if (o) for (const k of ["silver", "gold", "gems", "orichalcum", "coal"]) o[k] += loot[k] / homes.length;
      hv.food += loot.food / homes.length;
    }
    members.forEach((id, i) => { if (App.addEthernum) App.addEthernum(id, Math.floor(loot.ethernum / members.length) + (i < loot.ethernum % members.length ? 1 : 0)); if (App.pay) App.pay(id, loot.shells / members.length); });
    p.result = { start, reached: f, cleared, beaten, stopped: stopped && stopped.by, loot, found, lit, power: Math.round(power) };
    const parts = [loot.ethernum + " Ethernum"].concat(["silver", "gold", "gems", "orichalcum"].filter((k) => loot[k]).map((k) => loot[k] + " " + k));
    st.uwlog.unshift({ day, village: p.chosen ? -1 : v.i, names: p.chosen ? members.map(App.nameOf).join(", ") : null, n: members.length, text: "went down from B" + (start + 1) + "F" + (cleared ? " to B" + Math.min(FLOORS, f + (stopped ? 1 : 0)) + "F" : "") + (beaten.length ? ", beat " + beaten.map((x) => App.GUARDIANS[x].name).join(" and ") : "") + (stopped ? " and were turned back by " + stopped.by : "") + "." + (cleared ? " Found " + parts.join(", ") + (found.length ? ", and " + found.map(([id, k]) => relicInfo(k).name + " (" + App.nameOf(id) + ")").join(", ") : "") + "." : "") + (tamed.length ? " " + tamed.map(([id, c, tf]) => App.nameOf(id) + " tamed a " + App.CREATURES[c.sp].name + " on B" + (tf + 1) + "F and named it " + c.nick + ".").join(" ") : "") });
    st.uwlog.length = Math.min(st.uwlog.length, 24);
    if (p.chosen || Math.hypot(v.x - App.cam.target.x, v.z - App.cam.target.z) < 500) App.log("dungeon", (p.chosen ? who + " " : "A party of " + members.length + " from " + v.name + " ") + st.uwlog[0].text, "");
  }
  // ---------- watching: each party's afternoon in stages (a floor, its guardian, the next floor...) ----------
  App.partyPlan = (p) => {
    if (!p || p.done) return p && p.plan;
    if (!p.plan) {
      const stages = expedition(p, p.day, true) || [];
      const t0 = p.day * DAY + A0 + 25, d = (A1 - A0 - 35) / Math.max(1, stages.length);
      p.plan = { stages, t0, d };
    }
    return p.plan;
  };
  // where a party is at time T: before it goes down, on a stage (with how far through it is), or back up
  App.partyStage = (p, T) => {
    const P = App.partyPlan(p);
    if (!P) return null;
    if (T < P.t0) return { pre: true, f: p.start || 0 };
    const i = Math.floor((T - P.t0) / P.d);
    if (i >= P.stages.length) return { done: true };
    const S = P.stages[i];
    return { i, f: S.f, kind: S.kind, ok: S.ok, prog: (T - P.t0 - i * P.d) / P.d, last: i === P.stages.length - 1 };
  };
  App.partyKey = (p) => (p.chosen ? "chosen:" + p.day : p.day + ":" + p.village);
  App.partyName = (p) => (p.chosen ? "The Maker's Chosen" : App.villages[p.village].name + "'s party");
  // every party down there now
  App.liveParties = () => {
    const day = Math.floor(st.T / DAY), out = [];
    for (const k in st.parties) {
      const p = st.parties[k];
      if (!p || p.day !== day || p.done) continue;
      const S = App.partyStage(p, st.T);
      if (S && !S.pre && !S.done) out.push({ key: k, p, S });
    }
    return out.sort((a, b) => (b.S.kind === "guardian") - (a.S.kind === "guardian") || b.S.f - a.S.f);
  };
  // tell the player when a fight worth watching starts: the Chosen, a guardian nobody has beaten, or a party from close by
  function announce() {
    const day = Math.floor(st.T / DAY);
    for (const L of App.liveParties()) {
      const { p, S, key } = L;
      if (p.lastStage === S.i) continue;
      p.lastStage = S.i;
      if (S.kind !== "guardian") continue;
      const v = App.villages[p.village], G = App.GUARDIANS ? App.GUARDIANS[S.f] : { name: "a guardian" };
      // a guardian nobody has beaten yet is announced once a day (the first party to face it), not for every party
      const first = !st.guardians[S.f] && !(st.announced && st.announced.day === day && st.announced.f.includes(S.f));
      if (!(p.chosen || first || Math.hypot(v.x - App.cam.target.x, v.z - App.cam.target.z) < 300)) continue;
      if (first) { if (!st.announced || st.announced.day !== day) st.announced = { day, f: [] }; st.announced.f.push(S.f); }
      const msg = App.partyName(p) + " faces " + G.name + " on B" + (S.f + 1) + "F!";
      if (App.toastAction) App.toastAction(msg, "Watch", () => App.watchParty(key)); else App.toast(msg);
    }
  }
  // ---------- every party comes back at the end of the afternoon ----------
  function settle(day) {
    for (const k in st.parties) {
      const p = st.parties[k];
      if (!p || p.done || p.day !== day) continue;
      p.done = true;
      expedition(p, day);
      // a day of fighting down below wears their arms
      if (App.armsWear) for (const id of p.members) App.armsWear(id, 4 + hash2(id, day, 731) * 8, 2 + hash2(id, day, 733) * 6);
      st.delves[p.dungeon] = (st.delves[p.dungeon] || 0) + p.members.length;
    }
    for (const k in st.parties) if (st.parties[k] && st.parties[k].day < day - 2) delete st.parties[k];
  }
  App.dungeonTick = () => {
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    // at the start of the afternoon every village decides whether it sends a party; once a game minute, who is fighting what
    if (m >= A0 && m < A1 && st.partiesDay !== day) { st.partiesDay = day; if (App.chosenParty) App.chosenParty(day); for (const v of App.villages) App.partyOf(v.residents[0], day); }
    if (m >= A0 && m < A1 + 5 && Math.floor(st.T) !== st.announceT) { st.announceT = Math.floor(st.T); announce(); }
    if (m >= A1 + 5 && st.settleDay !== day) { st.settleDay = day; settle(day); }
  };

  // ---------- per frame ----------
  App.stepMonsters = (dtReal) => {
    if (!geo.gloomslime) return;
    const dm = Math.min(dtReal, 0.1) * st.speed, time = performance.now() / 1000;
    const n = {};
    for (const k of MKINDS) n[k] = 0;
    const tx = App.cam.target.x, tz = App.cam.target.z;
    for (const list of lurking.values()) for (const m of list) {
      stepMonster(m, dm);
      if (m.dead || n[m.kind] >= CAP || Math.abs(m.x - tx) + Math.abs(m.z - tz) > 110) continue;
      if (!m.held && !m.flying) { const gy = App.surfaceAt(m.x, m.z).y; m.y += (gy - m.y) * Math.min(1, dtReal * 8); }
      const hov = MONSTERS[m.kind].hover ? MONSTERS[m.kind].hover + Math.sin(time * 4 + m.wob) * 0.25 : 0;
      const squish = m.kind === "gloomslime" ? 1 + Math.sin(time * 5 + m.wob) * 0.08 : 1;
      E.set(m.foe ? Math.sin(time * 8) * 0.12 : 0, m.h, 0, "YXZ");
      Q.setFromEuler(E);
      const lu = m.lungeAt && performance.now() - m.lungeAt < 300 ? Math.sin(((performance.now() - m.lungeAt) / 300) * Math.PI) * 0.9 : 0;
      M4.compose(V.set(m.x + Math.sin(m.h) * lu, m.y + hov, m.z + Math.cos(m.h) * lu), Q, SC.set(1 / Math.sqrt(squish), squish, 1 / Math.sqrt(squish))).multiply(geo[m.kind].local);
      meshes[m.kind].setMatrixAt(n[m.kind]++, M4);
    }
    for (const k of MKINDS) { meshes[k].count = n[k]; meshes[k].instanceMatrix.needsUpdate = true; }
  };

  // ---------- the Adventure tab adds the caves and the best adventurers ----------
  App.dungeonsHTML = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const day = Math.floor(st.T / DAY);
    for (const v of App.villages) App.partyOf(v.residents[0], day); // settle today's parties everywhere
    const today = Object.values(st.parties).filter((p) => p && p.day === day).length;
    let h = '<div class="card"><h3>The Great Underworld</h3><p class="note">Every cave leads down into one dungeon 12 floors deep under the whole map: the Goblin Warrens, the Catacombs, a Sunlit Grotto, a Forest Maze, the Ice Caverns, the Burning Deep and the Abyss, down to the Heart of the Chain; a teleport gem beside every guardian. Parties set off around ' + App.clock(day * DAY + A0).short + " and are back by " + App.clock(day * DAY + A1).short + ": they take the shortcut down to the floor of the last guardian their village has beaten and go down as far as their strength allows, up to three floors, beating each floor's guardian to go on. " + today + " part" + (today === 1 ? "y" : "ies") + " today.</p>" +
      '<p class="note">Treasure makes them stronger: Ethernum (each adventurer burns a crystal to light the way, +15%), precious metals for the smith (silver tips, gem collars, gold, the Orichalcum Blade), shells, food, and relics that make their bearer stronger. Deeper floors need much more strength.</p>';
    // live now
    const live = App.liveParties();
    h += "<h3>Down there right now</h3>" + (live.length ? live.slice(0, 8).map((L) => '<div class="row" style="justify-content:space-between"><span>' + esc(App.partyName(L.p)) + " \u00b7 B" + (L.S.f + 1) + "F \u00b7 " + (L.S.kind === "guardian" ? "fighting " + esc(App.GUARDIANS[L.S.f].name) : "fighting through the floor") + '</span><button class="btn" data-watch="' + L.key + '">Watch</button></div>').join("") : '<p class="note">Nobody is down in the Underworld now (parties go down between ' + App.clock(day * DAY + A0).short + " and " + App.clock(day * DAY + A1).short + ").</p>");
    // the deepest villages
    const deep = App.villages.filter((v) => (st.depth[v.i] || 0) > 0).sort((a, b) => (st.depth[b.i] || 0) - (st.depth[a.i] || 0) || App.conquered(b.i) - App.conquered(a.i)).slice(0, 8);
    h += "<h3>Deepest villages</h3>" + (deep.map((v, i) => '<div class="row" style="justify-content:space-between"><span>' + (i + 1) + ". " + esc(v.name) + '</span><span class="note">reached B' + ((st.depth[v.i] || 0) + 1) + "F \u00b7 " + App.conquered(v.i) + " guardian" + (App.conquered(v.i) === 1 ? "" : "s") + " beaten \u00b7 starts at B" + (App.waystone(v.i) + 1) + "F</span></div>").join("") || '<p class="note">No party has gone down yet.</p>');
    // the guardians and who beat them first
    const G = App.GUARDIANS || [], next = G.findIndex((g, f) => !st.guardians[f]);
    // the Maker's Chosen
    const heroes = []; for (let id = 0; id < TB.SUPPLY; id++) if (App.heroOf && App.heroOf(id)) heroes.push(id);
    heroes.sort((a, b) => App.underPower(b) - App.underPower(a));
    const cp = App.chosenParty(day);
    h += "<h3>The Maker's Chosen</h3><p class=\"note\">Some afternoons the strongest of the Maker's blessed go down together, whatever their village. Their blessings resonate when two or more go together (each grows stronger), but never one alone: no single Tickle, however blessed, can finish the Great Underworld; it takes at least two of them together (two of the Total Blessing comfortably; two of the lesser blessings only at the very peak of their strength). The Golden Tickle cannot be beaten by luck: a party needs at least four fifths of the strength it asks for.</p>" +
      '<div class="kv"><span class="k">Today</span><span>' + (cp ? esc(cp.members.map(App.nameOf).join(", ")) + " from B" + (cp.start + 1) + "F" : "they stay above") + '</span><span class="k">Their record</span><span>' + App.chosenConquered() + " guardian" + (App.chosenConquered() === 1 ? "" : "s") + " beaten, down to B" + ((st.chosenDepth || 0) + 1) + "F</span></div>" +
      heroes.slice(0, 6).map((id) => '<div class="row" style="justify-content:space-between"><span>' + esc(App.nameOf(id)) + '</span><span class="note">' + esc((App.blessingOf && App.BLESSINGS && App.BLESSINGS[App.blessingOf(id)] ? App.BLESSINGS[App.blessingOf(id)].name : "blessed")) + " \u00b7 strength " + Math.round(App.underPower(id)) + " \u00b7 level " + App.levelOf(id) + "</span></div>").join("");
    h += "<h3>The guardians</h3>" + G.slice(0, Math.max(6, next + 3)).map((g, f) => '<div class="row" style="justify-content:space-between"><span>B' + (f + 1) + "F \u00b7 " + esc(g.name) + '</span><span class="note">' + (st.guardians[f] ? "first beaten by " + (st.guardians[f].chosen ? "the Maker's Chosen" : esc(App.placeName(st.guardians[f].village, st.guardians[f].vname))) + " (" + esc(App.nameOf(st.guardians[f].by)) + ")" : f === next ? "unbeaten: needs a party of about " + Math.round(guardianNeed(f)) + " strength" : "unbeaten") + "</span></div>").join("");
    // the strongest adventurers
    const ids = [];
    for (const v of App.villages) for (const id of v.residents) if (App.relicsOf(id).length || App.levelOf(id) >= 8) ids.push(id);
    ids.sort((a, b) => App.underPower(b) - App.underPower(a));
    h += "<h3>The strongest adventurers</h3>" + (ids.slice(0, 8).map((id, i) => '<div class="row" style="justify-content:space-between"><span>' + (i + 1) + ". " + esc(App.nameOf(id)) + '</span><span class="note">strength ' + Math.round(App.underPower(id)) + " \u00b7 level " + App.levelOf(id) + (App.relicsOf(id).length ? " \u00b7 " + esc(App.relicsOf(id).map((k) => relicInfo(k).name).join(", ")) : "") + "</span></div>").join("") || '<p class="note">Nobody strong enough yet.</p>');
    // what happened lately
    h += "<h3>Lately</h3>" + (st.uwlog.slice(0, 6).map((e) => '<p class="note">Day ' + (e.day + 1) + ": " + (e.village === -1 ? "the Maker's Chosen (" + esc(e.names) + ")" : e.n + " from " + esc(App.placeName(e.village, e.vname))) + " " + esc(e.text) + "</p>").join("") || '<p class="note">Nothing yet.</p>');
    h += '<h3>The caves</h3><div class="kv">' + (App.dungeons || []).map((d) => '<span class="k"><button class="btn" data-dungeon="' + d.i + '">' + esc(d.name) + "</button></span><span>" + App.regions[d.region].name + " \u00b7 " + (st.delves[d.i] || 0) + " adventurers have gone down here</span>").join("") + "</div></div>";
    return h;
  };
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-watch]");
    if (w && App.watchParty) { App.watchParty(w.dataset.watch); return; }
    const b = e.target.closest("[data-dungeon]");
    if (!b) return;
    const d = App.dungeons[+b.dataset.dungeon];
    if (d) App.flyTo(d.x, d.z, 36);
  });
})();
