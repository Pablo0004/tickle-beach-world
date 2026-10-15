/* Dragon lairs: the ground round a sleeping dragon, and what happens when someone disturbs it.
 * Tickles give a lair a wide berth: they never plan their free time near one, and anyone who has to
 * pass tiptoes. A dragon flies a patrol over its land now and then, and Tickles caught underneath
 * duck. And a dragon whose sleep is broken -- by Tickles lingering on its ground, by something the
 * hand drops on its peak, by a Guild hunt that failed -- wakes in a rage and flies straight at the
 * village to blame, like in the old tales. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const rnd = Math.random, hash2 = App.hash2, DAY = 1440;
  const GROUND = 45; // the dragon's ground round its peak
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  App.initLairs = (saved) => { st.anger = (saved && saved.anger) || {}; st.wakeDay = (saved && saved.wakeDay) || {}; };
  App.saveLairs = () => ({ anger: st.anger, wakeDay: st.wakeDay });
  App.DRAGON_GROUND = GROUND;
  const asleep = (L) => App.dragonState(L, st.T).mode === "perch";
  App.lairNear = (x, z, r) => { for (const L of App.lairs) if (Math.hypot(L.x - x, L.z - z) < (r || GROUND)) return L; return null; };
  App.sleepingDragonNear = (x, z) => { const L = App.lairNear(x, z, GROUND); return L && asleep(L) ? L : null; };

  // ---------- its sleep ----------
  const moodOf = (L) => st.anger[L.i] || (st.anger[L.i] = { v: 0, by: null, stir: false });
  App.dragonStirring = (L) => !!(st.anger && st.anger[L.i] && st.anger[L.i].v >= 0.5);
  // something disturbed it: vi is the village it will blame
  App.disturbDragon = (L, amount, vi, why) => {
    if (!asleep(L) || !App.dragonWrath) return;
    const A = moodOf(L);
    A.v += amount;
    if (vi != null) A.by = vi;
    if (why) A.why = why;
    if (A.v >= 0.5 && !A.stir) {
      A.stir = true;
      for (const t of st.tickles) if (Math.hypot(t.pos.x - L.x, t.pos.z - L.z) < 60 && rnd() < 0.5) App.say(t, pick(["The dragon is stirring!", "Shh! Back away slowly...", "Did it just open an eye?"]), 3);
      if (Math.hypot(L.x - App.cam.target.x, L.z - App.cam.target.z) < 400) App.log("dragon", "The dragon of " + L.name + " stirs in its sleep...", "Whoever is near its peak had better tiptoe away.");
    }
    if (A.v >= 1) {
      const o = App.villages[A.by != null ? A.by : App.nearestVillage(L.x, L.z).i];
      const reason = A.why || "Someone woke the dragon of " + L.name + "!";
      A.v = 0; A.stir = false; A.by = null; A.why = null;
      App.dragonWrath(L, o.i, reason);
    }
  };
  // the hand dropped or threw something on its ground
  App.disturbAt = (x, z, hard) => {
    const L = App.lairNear(x, z, GROUND + 10);
    if (!L) return;
    const o = App.nearestVillage(L.x, L.z);
    App.disturbDragon(L, hard ? 1 : 0.6, o.i, "A crash on its peak woke the dragon of " + L.name + "! It blames " + o.name + ".");
  };
  // every frame for a sleeping dragon near the player: Tickles on its ground wake it bit by bit
  App.lairWatch = (d, dm) => {
    const L = d.lair, h = App.huntOn && App.huntOn(L);
    let n = 0, who = null;
    for (const t of st.tickles) {
      if (App.isKO(t.id) || App.isDead(t.id) || (h && h.party.includes(t.id)) || (t.action && (t.action.kind === "held" || t.action.kind === "flying"))) continue;
      if (Math.hypot(t.pos.x - L.x, t.pos.z - L.z) > 30) continue;
      n++;
      if (!who) who = t;
    }
    if (n) App.disturbDragon(L, dm * 0.006 * n, who.village.i, (n > 1 ? who.name + " and others from " : "A Tickle from ") + who.village.name + " lingered on the dragon's ground and woke the dragon of " + L.name + "!");
    else { const A = st.anger[L.i]; if (A && A.v > 0) { A.v = Math.max(0, A.v - dm * 0.002); if (A.v < 0.4) A.stir = false; } }
    return App.dragonStirring(L);
  };
  // passing by: a Tickle walking across a sleeping dragon's ground tiptoes
  App.tiptoe = (t) => {
    const L = App.sleepingDragonNear(t.pos.x, t.pos.z);
    if (!L) { t.tiptoe = null; return 1; }
    if (t.tiptoe !== L.i) { t.tiptoe = L.i; if (rnd() < 0.6) App.say(t, pick(["Shh... the dragon is sleeping.", "Tiptoe, tiptoe...", "Don't wake it, don't wake it..."]), 3); }
    return 0.55;
  };

  // ---------- patrol flights ----------
  // twice a day, most days, a dragon circles over its land: morning and afternoon
  const PATROLS = [[430, 462], [920, 952]];
  App.patrolOf = (L, T) => {
    const day = Math.floor(T / DAY), m = T - day * DAY;
    for (let k = 0; k < PATROLS.length; k++) {
      const [s, e] = PATROLS[k];
      if (m < s || m >= e || hash2(L.i, day * 2 + k, 205) > 0.55) continue;
      const sg = hash2(L.i, day, 207) < 0.5 ? 1 : -1, p = (m - s) / (e - s), ramp = Math.min(1, p * 7, (1 - p) * 7), a = p * 6.283 * sg + hash2(L.i, day * 2 + k, 209) * 6.283;
      const R = 110 * ramp, sky = App.SEA + 30;
      // heading along the circle (atan2 of the x and z of the direction of travel)
      return { x: L.x + Math.cos(a) * R, z: L.z + Math.sin(a) * R, y: L.h + 0.1 + (sky - L.h) * Math.min(1, ramp * 1.5), heading: Math.atan2(-Math.sin(a) * sg, Math.cos(a) * sg) };
    }
    return null;
  };
  // Tickles caught under a dragon in flight duck and cover their heads
  const FREE = new Set(["held", "flying", "fall", "spirit", "ko", "box", "ringwait", "duel", "tame", "delve", "dizzy", "slay", "throw", "fight", "cower", "brawl"]);
  App.overflight = (d) => {
    if (!(d.nextDuck > st.T)) d.nextDuck = st.T + 0.5; else return;
    for (const t of st.tickles) {
      if (App.isKO(t.id) || (t.action && FREE.has(t.action.kind)) || !t.group.visible) continue;
      if (Math.hypot(t.pos.x - d.x, t.pos.z - d.z) > 22) continue;
      App.endAction(t);
      t.action = { kind: "cower", until: st.T + 2 + rnd() * 2, started: st.T, look: d };
      if (rnd() < 0.5) App.say(t, pick(["Dragon! Get down!", "Eek! Overhead!", "Don't look up, don't look up..."]), 3);
    }
  };

  // ---------- off screen: now and then someone strays too close ----------
  App.lairTick = () => {
    if (!st.anger) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY;
    for (const L of App.lairs) {
      if (st.wakeDay[L.i] === day || hash2(L.i, day, 203) > 0.15) continue;
      if (m < 9 * 60 + hash2(L.i, day, 201) * 480) continue;
      st.wakeDay[L.i] = day;
      if (!asleep(L) || Math.hypot(L.x - App.cam.target.x, L.z - App.cam.target.z) < 300) continue; // near the player it happens for real
      const around = App.villages.filter((v) => v.region === App.regionOf(L.x, L.z) && Math.hypot(v.x - L.x, v.z - L.z) < 260);
      const o = around[Math.floor(hash2(L.i, day, 211) * around.length)];
      if (o) App.disturbDragon(L, 1, o.i, pick(["Mushroom pickers from ", "Children playing hide-and-seek from ", "A lost shepherd from ", "Treasure seekers from "]) + o.name + " strayed onto the dragon's ground and woke the dragon of " + L.name + "!");
    }
    for (const k in st.wakeDay) if (st.wakeDay[k] < day - 1) delete st.wakeDay[k];
  };
})();
