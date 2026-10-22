/* Fighting dragons. Only Tickles who are ready for it fight: those with arms (the Adventurers' Guild,
 * the Night Watch and each village's militia carry a weapon, and some a shield), and tamers, who
 * send their creature in. Everyone else runs home and hides. Fighters have health that the dragon's
 * fire and tail wear down (a shield takes some of it); at zero they are knocked out, or worse.
 * Health bars show over the dragon and over every fighter.
 * A dragon set down among the Tickles by the hand does not fly home: it fights where it lands, to
 * the end. It has a great deal of life, but it can die; its lair then stands empty for five days,
 * until a young dragon moves in. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, DAY = 1440;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const V = new THREE.Vector3();

  App.initRampage = (saved) => { st.slain = (saved && saved.slain) || {}; st.slayers = (saved && saved.slayers) || []; st.gear = (saved && saved.gear) || {}; };
  App.saveRampage = () => ({ slain: st.slain, slayers: st.slayers.slice(0, 40), gear: st.gear });
  App.dragonSlain = (L) => !!(st.slain && st.slain[L.i] > st.T);
  App.slayerOf = (id) => (st.slayers || []).find((s) => s.id === id) || null;

  // ---------- who is ready to fight ----------
  const WEAPONS = ["sword", "axe", "spear"];
  App.gearOf = (id) => {
    if (App.heroOf && App.heroOf(id)) return { weapon: "goldsword", armor: 2, blessed: true }; // the Maker's blessed
    if (st.gear && st.gear[id]) return st.gear[id].none ? null : st.gear[id]; // forged, found or bought (or broken: none left)
    if (App.mageSchool && App.mageSchool(id)) return { weapon: "staff", armor: 0, mage: true }; // a mage fights with a staff and spells
    const f = App.factionOf ? App.factionOf(id) : null;
    if (f === "guild") return { weapon: "sword", armor: 2 };
    if (f === "watch") return { weapon: "spear", armor: 1 };
    // the village militia: about one in ten keeps a weapon by the door
    if (App.hash2(id, 197, 3) < 0.1) return { weapon: WEAPONS[Math.floor(App.hash2(id, 191, 3) * 3)], armor: App.hash2(id, 199, 3) < 0.4 ? 1 : 0 };
    return null;
  };
  App.fighterKind = (id) => (App.gearOf(id) ? "arms" : App.leadCreature && App.leadCreature(id) ? "creature" : null);
  App.gearText = (id) => {
    const g = App.gearOf(id);
    if (g && g.blessed) return "The Maker's golden blade and a steel shield";
    if (g && g.legendary) return "The Orichalcum Blade (legendary) and a steel shield";
    if (g && g.weapon === "staff") return "A mage's staff" + (g.silver ? " capped with silver" : "") + " \u00b7 casts " + (App.SPELLS && App.mageSchool(id) ? App.SPELLS[App.mageSchool(id)].name : "spells");
    const wn = g ? (g.q === 2 ? "masterwork " : g.q === 1 ? "fine steel " : "") + g.weapon : "";
    // and how worn they are
    const c = g && App.armsCond ? App.armsCond(id) : null, cw = c ? " (" + App.condWord(c.w) + ")" : "", cs = c && c.s != null ? " (" + App.condWord(c.s) + ")" : "";
    const sh = g ? (g.armor === 2 ? " and a steel shield" + cs : g.armor === 1 ? " and a wooden shield" + cs : "") : "";
    if (g && g.silver) return "A silver-tipped " + wn + cw + sh;
    if (g) return "A" + (/^[aeiou]/.test(wn) ? "n " : " ") + wn + cw + sh;
    if (st.gear && st.gear[id] && st.gear[id].none) return "None: its " + st.gear[id].was + " broke" + (App.leadCreature && App.leadCreature(id) ? "; fights with its creature" : "; hides when a dragon comes");
    return App.leadCreature && App.leadCreature(id) ? "No weapon: fights with its creature" : "None: hides when a dragon comes";
  };

  // ---------- weapons and shields in their paws ----------
  const mats = {};
  const mat = (c) => mats[c] || (mats[c] = new THREE.MeshLambertMaterial({ color: c }));
  const templates = {};
  // a rusty copy of a weapon or shield: every part's colour dulled toward rust
  const rust = (c) => { const k = new THREE.Color(c), r = new THREE.Color("#7a4a2a"); k.lerp(r, 0.5).multiplyScalar(0.8); return "#" + k.getHexString(); };
  function template(kind) {
    if (templates[kind]) return templates[kind];
    if (kind.endsWith("~")) {
      const g = template(kind.slice(0, -1)).clone();
      g.traverse((m) => { if (m.material && m.material.color) m.material = mat(rust("#" + m.material.color.getHexString())); });
      return (templates[kind] = g);
    }
    const g = new THREE.Group();
    const box = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); g.add(m); };
    if (kind === "sword") { box(0.08, 0.26, 0.08, "#6b4a2b", 0, 0.05, 0); box(0.09, 0.07, 0.36, "#ffd23f", 0, 0.21, 0); box(0.05, 0.9, 0.15, "#e8eef4", 0, 0.68, 0); }
    else if (kind === "orisword") { box(0.08, 0.26, 0.08, "#6b4a2b", 0, 0.05, 0); box(0.1, 0.08, 0.42, "#c9a6ff", 0, 0.21, 0); box(0.07, 1.1, 0.18, "#ff8f6a", 0, 0.78, 0); box(0.03, 1.0, 0.06, "#ffd23f", 0, 0.78, 0.07); }
    else if (kind === "goldsword") { box(0.08, 0.26, 0.08, "#ffffff", 0, 0.05, 0); box(0.1, 0.08, 0.44, "#ffb020", 0, 0.21, 0); box(0.06, 1.05, 0.17, "#ffd23f", 0, 0.76, 0); box(0.07, 0.12, 0.12, "#8fd3f4", 0, 0.21, 0.0); }
    else if (kind.startsWith("staff")) {
      // a wooden staff with a glowing orb in the colour of the mage's school
      const col = { fire: "#ff7a2f", frost: "#8fd3f4", storm: "#fff4a0", arcane: "#c9a6ff", light: "#7be08f" }[kind.split(":")[1]] || "#c9a6ff";
      box(0.07, 1.6, 0.07, "#6b4a2b", 0, 0.62, 0); box(0.16, 0.08, 0.16, "#ffd23f", 0, 1.38, 0);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: col })); orb.position.set(0, 1.55, 0); g.add(orb);
    } else if (kind === "hat") {
      // the pointed hat of a mage
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 10), mat("#2f3f8f")); c.position.y = 0.55; c.rotation.z = 0.12; g.add(c);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 14), mat("#2f3f8f")); g.add(b);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.1, 12), mat("#ffd23f")); s.position.y = 0.08; g.add(s);
    }
    // bought at the Blacksmiths' Guild: fine steel (+1) and masterwork (+2)
    else if (kind === "sword+1") { box(0.08, 0.26, 0.08, "#3a2a1a", 0, 0.05, 0); box(0.09, 0.07, 0.4, "#8fb8ff", 0, 0.21, 0); box(0.05, 0.98, 0.16, "#f4f8ff", 0, 0.72, 0); box(0.02, 0.8, 0.04, "#9ab0c8", 0, 0.7, 0.07); }
    else if (kind === "sword+2") { box(0.08, 0.26, 0.08, "#3a2a1a", 0, 0.05, 0); box(0.1, 0.1, 0.1, "#ffd23f", 0, -0.1, 0); box(0.1, 0.08, 0.48, "#ffd23f", 0, 0.21, 0); box(0.08, 0.1, 0.1, "#2f8fe0", 0, 0.21, 0.06); box(0.05, 1.08, 0.17, "#ffffff", 0, 0.78, 0); box(0.02, 0.9, 0.04, "#ffd23f", 0, 0.76, 0.07); }
    else if (kind === "axe+1") { box(0.08, 1.05, 0.08, "#5a3a1a", 0, 0.44, 0); box(0.07, 0.38, 0.4, "#f4f8ff", 0, 0.82, 0.16); box(0.08, 0.06, 0.1, "#8fb8ff", 0, 0.62, 0); }
    else if (kind === "axe+2") { box(0.08, 1.1, 0.08, "#3a2a1a", 0, 0.46, 0); box(0.07, 0.4, 0.38, "#ffffff", 0, 0.86, 0.17); box(0.07, 0.34, 0.3, "#ffffff", 0, 0.86, -0.15); box(0.09, 0.44, 0.06, "#ffd23f", 0, 0.86, 0); }
    else if (kind === "spear+1" || kind === "spear+2") {
      const gold = kind === "spear+2";
      box(0.06, 1.75, 0.06, gold ? "#3a2a1a" : "#5a3a1a", 0, 0.66, 0);
      if (gold) { box(0.08, 0.06, 0.08, "#ffd23f", 0, 0.3, 0); box(0.08, 0.06, 0.08, "#ffd23f", 0, 1.0, 0); }
      box(0.09, 0.1, 0.09, gold ? "#ffd23f" : "#e8443a", 0, 1.48, 0);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(gold ? 0.12 : 0.1, gold ? 0.5 : 0.4, 6), mat(gold ? "#ffffff" : "#f4f8ff")); tip.position.set(0, gold ? 1.78 : 1.72, 0); g.add(tip);
    }
    else if (kind === "hammer") { box(0.07, 0.75, 0.07, "#8a5a2b", 0, 0.3, 0); box(0.16, 0.16, 0.34, "#4a4a4a", 0, 0.68, 0); }
    else if (kind === "axe") { box(0.08, 1.0, 0.08, "#8a5a2b", 0, 0.42, 0); box(0.07, 0.32, 0.34, "#c9d1d9", 0, 0.8, 0.13); }
    else if (kind === "spear") {
      box(0.06, 1.6, 0.06, "#8a5a2b", 0, 0.6, 0);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 6), mat("#e8eef4")); tip.position.set(0, 1.55, 0); g.add(tip);
    } else {
      // a round shield, face outwards
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14), mat(kind === "shield2" ? "#c9d1d9" : "#9a6b45"));
      s.rotation.z = Math.PI / 2; g.add(s);
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), mat("#ffd23f"));
      boss.rotation.z = Math.PI / 2; boss.position.x = -0.05; g.add(boss);
    }
    return (templates[kind] = g);
  }
  App.weaponTemplate = (kind) => template(kind);
  App.weaponShow = (t, kind, armor) => {
    for (const k of ["weaponObj", "shieldObj", "hatObj"]) if (t[k]) { if (t[k].parent) t[k].parent.remove(t[k]); t[k] = null; }
    if (!kind || !t.pivot) return;
    // a weapon bought at the Blacksmiths' Guild looks finer
    const q = (kind === "sword" || kind === "axe" || kind === "spear") && App.gearOf(t.id) ? App.gearOf(t.id).q : 0;
    if (q) kind = kind + "+" + q;
    if (kind === "staff") { kind = "staff:" + (App.mageSchool(t.id) || "arcane"); const h = template("hat").clone(); h.position.y = (t.height || 3) - 0.15; t.pivot.add(h); t.hatObj = h; }
    // Tickles are about three cells tall: the weapon sits in the right paw, the shield on the left
    // badly worn arms look it: dull and rusty
    const cond = App.armsCond && t.id != null ? App.armsCond(t.id) : null;
    if (cond && cond.w < 40 && /^(sword|axe|spear)/.test(kind)) kind += "~";
    const g = template(kind).clone(), A = t.arms;
    if (A) {
      // gripped in the right paw, pointing forward while the arm hangs down
      g.scale.setScalar(1.6); g.position.copy(A.paw); g.rotation.x = Math.PI / 2 - 0.2;
      A.R.add(g);
    } else { g.scale.setScalar(1.9); g.position.set(1.65, 1.0, 0.5); g.rotation.x = 0.25; t.pivot.add(g); }
    t.weaponObj = g;
    if (armor) {
      const s = template((armor === 2 ? "shield2" : "shield1") + (cond && cond.s != null && cond.s < 40 ? "~" : "")).clone();
      if (A) { s.scale.setScalar(1.7); s.position.set(-A.paw.x - 0.25, A.paw.y + 0.1, A.paw.z); A.L.add(s); }
      else { s.scale.setScalar(1.9); s.position.set(-1.7, 1.2, 0.35); t.pivot.add(s); }
      t.shieldObj = s;
    }
  };

  // ---------- health ----------
  const maxHP = (id) => (60 + App.levelOf(id) * 6 + (((App.gearOf(id) || {}).armor || 0) * 25) * (App.armsMul ? App.armsMul(id).s : 1)) * (App.heroHP ? App.heroHP(id) : 1);
  App.maxHPOf = maxHP; // (the inspect window)
  function initHP(t) {
    if (!(t.hpMax > 0) || !(t.hp > 0) || st.T - (t.hpAt || -1e9) > 120) { t.hpMax = maxHP(t.id); t.hp = t.hpMax; }
    t.hpAt = st.T;
  }
  // a blow from the dragon: a shield takes some of it; at zero, knocked out (and now and then worse)
  App.hurt = (t, dmg, cause, text, death) => {
    initHP(t);
    const armor = ((App.gearOf(t.id) || {}).armor || 0) * (App.armsMul ? App.armsMul(t.id).s : 1); // a worn shield stops less
    t.hp -= dmg * (1 - armor * 0.15) * (App.heroGuard ? App.heroGuard(t.id) : 1);
    if (armor && App.armsWear) App.armsWear(t.id, 0, 0.6); // and every blow it takes wears it
    t.hurtAt = performance.now();
    if (t.hp > 0) return false;
    t.hp = 0;
    App.maybeKill(t.id, death == null ? 0.05 : death, cause, 120, text || "KO!");
    return true;
  };

  // ---------- joining in, or running to hide ----------
  const BUSY = new Set(["held", "flying", "fall", "spirit", "ko", "box", "ringwait", "duel", "tame", "delve", "dizzy", "slay", "command", "hide"]);
  const free = (t) => !App.isKO(t.id) && !App.isDead(t.id) && !(t.action && BUSY.has(t.action.kind));
  App.joinFight = (t, d) => {
    const k = App.fighterKind(t.id);
    if (!k || App.isKO(t.id) || App.isDead(t.id)) return false;
    App.endAction(t);
    const ang = Math.atan2(t.pos.z - d.z, t.pos.x - d.x) + (rnd() - 0.5) * 0.6;
    if (k === "arms") { const g = App.gearOf(t.id); t.action = { kind: "slay", dragon: d, ang, weapon: g.weapon, armor: g.armor, next: st.T + 0.8 + rnd() * 1.2, started: st.T }; }
    else t.action = { kind: "command", dragon: d, ang, next: st.T + 1, started: st.T };
    initHP(t);
    return true;
  };
  // fighters close by join in; everyone else in the open runs home
  App.rallyAround = (d, R, first) => {
    for (const t of st.tickles) {
      if (!free(t) || Math.hypot(t.pos.x - d.x, t.pos.z - d.z) > R) continue;
      if (App.joinFight(t, d)) { if (rnd() < (first ? 0.5 : 0.25)) App.say(t, pick(t.action.kind === "command" ? ["Go get it, buddy!", "Show it your power!", "Together, partner!"] : ["To arms!", "Shields up!", "Protect the village!", "Charge!"]), 3); }
      else if (t.group.visible && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < R * 0.8 && App.hideFrom) App.hideFrom(t, d);
    }
  };
  App.dragonFight = (d) => !d ? null : d.duel ? (d.duel.a === d ? d.duel.fa : d.duel.fb) : d.rampage || (d.hunt && !d.hunt.done ? d.hunt : null) || (d.live && d.live.phase === "landed" && !d.live.attack.done ? d.live.attack : null);

  // ---------- blows against the dragon ----------
  const DMG = { sword: 6, axe: 7, spear: 5, goldsword: 8, orisword: 11, staff: 7 };
  App.weaponDamage = (t, weapon) => {
    // a worn weapon hits softer, and every blow wears it a little more (wealth.js)
    const worn = weapon !== "staff" && App.armsMul ? App.armsMul(t.id).w : 1;
    const d = worn * weaponDamage0(t, weapon);
    if (weapon !== "staff" && App.armsWear) App.armsWear(t.id, 0.35, 0);
    return d;
  };
  const weaponDamage0 = (t, weapon) => (DMG[weapon] || 5) * (App.gearOf(t.id) && App.gearOf(t.id).silver ? 1.25 : 1) * (App.gearOf(t.id) && App.gearOf(t.id).q && weapon !== "staff" ? 1 + 0.25 * App.gearOf(t.id).q : 1) * (0.7 + rnd() * 0.6) * (1 + App.levelOf(t.id) * 0.05) * (App.heroPower ? App.heroPower(t.id) : 1);
  App.hitDragon = (d, t, dmg, color) => {
    const F = App.dragonFight(d);
    if (!F || F.done || d.dead) return;
    F.hp -= dmg; F.hits = (F.hits || 0) + 1; F.last = t.id;
    (F.dealt || (F.dealt = {}))[t.id] = (F.dealt[t.id] || 0) + dmg;
    App.giveXP(t.id, 1);
    if (App.FX && rnd() < 0.6) App.FX.number(App.scene, { x: d.x + (rnd() - 0.5) * 2, y: d.y + 5.5, z: d.z }, String(Math.round(dmg)), color || "#ffd23f");
    const c = new THREE.Color(color || (rnd() < 0.5 ? "#ffffff" : "#ff6b5e"));
    for (let k = 0; k < 8; k++) App.spawnParticle({ kind: "spark", x: d.x + (t.pos.x - d.x) * 0.4, y: d.y + 1.5 + rnd() * 2, z: d.z + (t.pos.z - d.z) * 0.4, vx: (rnd() - 0.5) * 5, vy: 1 + rnd() * 3, vz: (rnd() - 0.5) * 5, age: 0, life: 0.4 + rnd() * 0.2, color: c });
    if (F === d.rampage && F.hp <= 0) slay(d);
  };

  // ---------- the hand sets a dragon down among the Tickles ----------
  App.startRampage = (d, hard) => {
    if (d.dead || !App.isLand(d.x, d.z)) return false;
    if (!st.tickles.some((t) => !App.isKO(t.id) && !App.isDead(t.id) && Math.hypot(t.pos.x - d.x, t.pos.z - d.z) < 45)) return false;
    const L = d.lair;
    // whatever it was doing, it has forgotten about it
    if (d.live) { const a = d.live.attack; a.t1 = st.T + 0.01; a.back = a.t1 + 0.02; d.live = null; }
    d.hunt = null; d.away = false;
    if (!d.rampage) {
      const max = 1900 + Math.round(App.hash2(L.i, Math.floor(st.T / DAY), 193) * 600);
      d.rampage = { hp: max, maxHp: max, done: false, hits: 0, dealt: {}, last: null, nextFire: st.T + 2, nextSwipe: st.T + 3, nextRoar: st.T, nextRally: 0, lastFoe: st.T, roar: 0, swipe: 0 };
      const v = App.nearestVillage(d.x, d.z);
      App.log("dragon", "The " + TB.DRAGON_LOOKS[L.look].name.toLowerCase() + " dragon of " + L.name + " crashes down near " + v.name + " and turns on the Tickles!", "Those with arms take up their swords, axes and spears, and the tamers send in their creatures; everyone else runs to hide. It will not fly away this time: it is a fight to the end.");
      App.toast("The dragon is loose! To arms!");
    }
    if (hard) d.rampage.hp -= d.rampage.maxHp * 0.05;
    d.y = App.surfaceAt(d.x, d.z).y;
    App.rallyAround(d, 55, true);
    return true;
  };
  function endFighters(d) { for (const t of st.tickles) if (t.action && (t.action.kind === "slay" || t.action.kind === "command") && t.action.dragon === d) App.endAction(t); }
  function endRampage(d, why) {
    d.rampage = null; d.away = true;
    endFighters(d);
    if (why) App.log("dragon", why, "Its wounds will heal on its peak.");
  }
  function slay(d) {
    const R = d.rampage, L = d.lair;
    d.rampage = null;
    d.dead = { at: st.T };
    st.slain[L.i] = st.T + 5 * DAY;
    const ids = Object.keys(R.dealt).map(Number).sort((a, b) => R.dealt[b] - R.dealt[a]);
    for (const id of ids) { App.giveXP(id, 40 + Math.round(R.dealt[id] / 4)); if (App.pay) App.pay(id, 15); }
    const top = ids[0], last = R.last;
    st.slayers.unshift({ id: last, top, lair: L.i, day: Math.floor(st.T / DAY), n: ids.length });
    for (const t of st.tickles) {
      if (t.action && (t.action.kind === "slay" || t.action.kind === "command") && t.action.dragon === d) {
        App.endAction(t);
        t.action = { kind: "cheer", until: st.T + 5, started: st.T };
        if (rnd() < 0.5) App.say(t, pick(["We did it!", "The dragon is dead!", "Hooray!", "Long live " + App.nameOf(last) + "!"]), 4);
      }
    }
    App.sfx && App.sfx.crash && App.sfx.crash(3);
    App.toast("The dragon is slain!");
    App.log("dragon", App.nameOf(last) + " struck the final blow: the dragon of " + L.name + " is dead!", ids.length + " Tickles fought it" + (top !== last ? "; " + App.nameOf(top) + " dealt the most damage" : "") + ". Its lair stands empty until another dragon claims it.", { who: [last, top] });
  }

  // ---------- every frame, for a dragon on the rampage (or lying dead) ----------
  App.stepRampage = (d, dm, dtReal) => {
    const pose = App.dragonPose, turn = App.dragonTurn;
    if (d.dead) {
      // face down, wings spread on the ground, head low
      d.y = App.surfaceAt(d.x, d.z).y - 0.5;
      pose(d, "rest", dtReal, 0);
      d.group.children[0].rotation.x = 0.16;
      return;
    }
    const R = d.rampage, L = d.lair;
    d.y = App.surfaceAt(d.x, d.z).y;
    // too far from the player to watch: it gives up and flies home
    if (Math.hypot(d.x - App.cam.target.x, d.z - App.cam.target.z) > 450) return endRampage(d, null);
    if (!(R.nextRally > st.T)) { R.nextRally = st.T + 1; App.rallyAround(d, 55, false); }
    const foes = st.tickles.filter((t) => t.action && (t.action.kind === "slay" || t.action.kind === "command") && t.action.dragon === d && !App.isKO(t.id));
    if (foes.length) R.lastFoe = st.T;
    else if (st.T - R.lastFoe > 10) return endRampage(d, "With nobody left standing to fight it, the dragon of " + L.name + " flew back to its peak.");
    const dist = (t) => Math.hypot(t.pos.x - d.x, t.pos.z - d.z);
    const near = foes.slice().sort((p, q) => dist(p) - dist(q))[0];
    if (near) d.heading = turn(d.heading, Math.atan2(near.pos.x - d.x, near.pos.z - d.z), dtReal * 2.5);
    if (st.T >= R.nextRoar) { R.nextRoar = st.T + 6 + rnd() * 5; R.roar = 0.6; }
    if (R.roar > 0) R.roar -= dtReal;
    // fire: at a knot of fighters, or at a house
    if (st.T >= R.nextFire && foes.length) {
      R.nextFire = st.T + 2.5 + rnd() * 1;
      const house = rnd() < 0.25 ? App.sceneryAll.filter((s) => s.building && !s.ruined && !s.fixed && Math.hypot(s.x - d.x, s.z - d.z) < 22).sort((p, q) => Math.hypot(p.x - d.x, p.z - d.z) - Math.hypot(q.x - d.x, q.z - d.z))[0] : null;
      if (house && !house.hall && !house.granary) { App.breathe(d, house); App.ruin(house, "by the rampaging dragon of " + L.name); }
      else {
        const tgt = foes[Math.floor(rnd() * foes.length)], at = { x: tgt.pos.x, z: tgt.pos.z };
        App.breathe(d, at);
        for (const f of foes) if (Math.hypot(f.pos.x - at.x, f.pos.z - at.z) < 3.4) {
          if (rnd() < 0.3) App.say(f, pick(["Missed me!", "Hot, hot!", "Shield up!"]), 2);
          else App.hurt(f, 45 + rnd() * 20, "fighting the dragon of " + L.name, "Too hot! KO!", 0.06);
        }
      }
    }
    // the tail: up to three fighters in reach
    if (st.T >= R.nextSwipe) {
      R.nextSwipe = st.T + 2.2 + rnd() * 1.2;
      const inReach = foes.filter((f) => dist(f) < 9.5).sort(() => rnd() - 0.5).slice(0, 3);
      for (const f of inReach) App.hurt(f, 35 + rnd() * 15, "to the tail of the dragon of " + L.name, "Oof! KO!", 0.04);
      if (inReach.length) R.swipe = 0.5;
    }
    if (R.swipe > 0) R.swipe -= dtReal;
    pose(d, "stand", dtReal, 0);
  };

  // ---------- health bars: the dragon in any fight, and every fighter ----------
  function bar(cls) {
    const el = document.createElement("div");
    el.className = "hpbar " + cls;
    el.innerHTML = '<span class="nm"></span><div class="hb"><i></i></div>';
    document.getElementById("overlay").appendChild(el);
    return el;
  }
  function place(el, x, y, z, f, name) {
    const p = App.project(V.set(x, y, z));
    el.hidden = p.behind;
    el.style.left = p.x + "px"; el.style.top = p.y + "px";
    if (name != null) { const nm = el.querySelector(".nm"); if (nm.textContent !== name) nm.textContent = name; }
    const i = el.querySelector("i");
    i.style.width = Math.round(Math.max(0, f) * 100) + "%"; i.style.background = f > 0.5 ? "#7be08f" : f > 0.2 ? "#ffd23f" : "#ff6b5e";
  }
  App.updateCombatBars = () => {
    for (const d of App.dragonObjects.values()) {
      const F = App.dragonFight(d);
      if (F && F.maxHp > 0 && !d.held) {
        d.bar = d.bar || bar("dragonbar");
        place(d.bar, d.x, d.y + 8, d.z, F.hp / F.maxHp, TB.DRAGON_LOOKS[d.lair.look].name + " dragon of " + d.lair.name);
      } else if (d.bar) { d.bar.remove(); d.bar = null; }
    }
    for (const t of st.tickles) {
      const on = t.action && (t.action.kind === "slay" || t.action.kind === "command") && t.group.visible && t.hpMax > 0;
      if (on) { t.hpBar = t.hpBar || bar("tbar"); place(t.hpBar, t.pos.x, t.pos.y + 3.9, t.pos.z, t.hp / t.hpMax, null); }
      else if (t.hpBar) { t.hpBar.remove(); t.hpBar = null; }
    }
  };
  App.dropDragonBar = (d) => { if (d.bar) { d.bar.remove(); d.bar = null; } };

  // ---------- dragon against dragon ----------
  // a dragon set down by the hand close to another: they fight; the loser flies off to hide for two days
  App.dragonRival = (d) => {
    for (const o of App.dragonObjects.values()) if (o !== d && !o.dead && !o.held && !o.handFlying && !o.duel && Math.hypot(o.x - d.x, o.z - d.z) < 45) return o;
    return null;
  };
  App.startDuel = (d, o) => {
    for (const x of [d, o]) {
      if (x.live) { const a = x.live.attack; a.t1 = st.T + 0.01; a.back = a.t1 + 0.02; x.live = null; }
      if (x.rampage) { x.rampage = null; endFighters(x); }
      x.hunt = null; x.away = false;
    }
    const hp = (x) => 1400 + Math.round(App.hash2(x.lair.i, Math.floor(st.T / DAY), 195) * 600);
    const D = { a: d, b: o, fa: { hp: hp(d), maxHp: 0, done: false }, fb: { hp: hp(o), maxHp: 0, done: false }, started: st.T, done: false };
    D.fa.maxHp = D.fa.hp; D.fb.maxHp = D.fb.hp;
    d.duel = o.duel = D;
    for (const x of [d, o]) { x.duelNext = { fire: st.T + 1 + rnd() * 2, swipe: st.T + 2 + rnd() * 2 }; x.duelRoar = 0; }
    const name = (x) => "the " + TB.DRAGON_LOOKS[x.lair.look].name.toLowerCase() + " dragon of " + x.lair.name;
    App.toast("Dragon fight!");
    App.log("dragon", "A giant hand dropped " + name(d) + " right by " + name(o) + ": they fight!", "Fire against fire. The loser will fly off to lick its wounds for two days.");
    for (const t of st.tickles) if (Math.hypot(t.pos.x - o.x, t.pos.z - o.z) < 60 && t.group.visible && rnd() < 0.5) App.say(t, pick(["Two dragons?!", "Run!", "Look at them go!"]), 3);
  };
  App.stepDuel = (d, dm, dtReal) => {
    const D = d.duel, pose = App.dragonPose, turn = App.dragonTurn;
    if (D.done) { d.duel = null; d.away = true; return; }
    const foe = D.a === d ? D.b : D.a, mine = D.a === d ? D.fa : D.fb, theirs = D.a === d ? D.fb : D.fa;
    if (!App.dragonObjects.has(foe.lair.i) || foe.dead) { D.done = true; d.duel = null; d.away = true; return; }
    const dx = foe.x - d.x, dz = foe.z - d.z, dist = Math.hypot(dx, dz) || 1;
    d.heading = turn(d.heading, Math.atan2(dx, dz), dtReal * 2.5);
    if (foe.held || foe.handFlying) { pose(d, "stand", dtReal, 0); return; }
    // close in, low over the ground, to fighting distance
    const gy = App.surfaceAt(d.x, d.z).y;
    if (dist > 16) { const step = Math.min(dist - 15, 8 * dm); d.x += (dx / dist) * step; d.z += (dz / dist) * step; d.y += (gy + 3 - d.y) * Math.min(1, dtReal * 3); pose(d, "fly", dtReal, 0); return; }
    d.y += (gy - d.y) * Math.min(1, dtReal * 4);
    if (d.duelRoar > 0) d.duelRoar -= dtReal;
    if (st.T >= d.duelNext.fire) {
      d.duelNext.fire = st.T + 2.5 + rnd() * 1.5;
      App.breathe(d, { x: foe.x, z: foe.z });
      theirs.hp -= 80 + rnd() * 60;
      d.duelRoar = 0.6;
    }
    if (st.T >= d.duelNext.swipe && dist < 19) {
      d.duelNext.swipe = st.T + 2 + rnd() * 1.2;
      theirs.hp -= 50 + rnd() * 40;
      const c = new THREE.Color("#ffffff");
      for (let k = 0; k < 20; k++) App.spawnParticle({ kind: "spark", x: foe.x, y: foe.y + 2 + rnd() * 2, z: foe.z, vx: (rnd() - 0.5) * 6, vy: 1 + rnd() * 3, vz: (rnd() - 0.5) * 6, age: 0, life: 0.5, color: c });
    }
    d.live = null;
    pose(d, "stand", dtReal, 0);
    if (theirs.hp <= 0) {
      D.done = true; d.duel = null; foe.duel = null; d.away = true; foe.away = true;
      if (st.hiding) st.hiding[foe.lair.i] = st.T + 2 * DAY;
      const nm = (x) => "the " + TB.DRAGON_LOOKS[x.lair.look].name.toLowerCase() + " dragon of " + x.lair.name;
      App.log("dragon", nm(d).charAt(0).toUpperCase() + nm(d).slice(1) + " beat " + nm(foe) + "!", "The loser has flown off to hide and lick its wounds for two days; the winner goes back to its peak.");
      App.toast("The dragon of " + d.lair.name + " wins!");
    }
  };

  // ---------- the empty lair fills again ----------
  App.rampageTick = () => {
    if (!st.slain) return;
    for (const L of App.lairs) {
      const until = st.slain[L.i];
      if (until && st.T >= until) {
        delete st.slain[L.i];
        App.log("dragon", "A young " + TB.DRAGON_LOOKS[L.look].name.toLowerCase() + " dragon has claimed the empty lair on " + L.name + ".", "The Tickles of " + App.regions[App.regionOf(L.x, L.z)].name + " had five quiet days. Now it begins again.");
      }
    }
  };
})();
