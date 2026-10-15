/* Music: free chiptunes in the spirit of the old handheld games, all CC0 (public domain) from
 * OpenGameArt.org, by the composers named in Menu > Credits. The music follows the camera (and the
 * Tickle it follows): every village plays its region's town tune (a calmer one at night, muffled
 * indoors), every mine and dungeon its own uneasy tune (deeper ones inside), the arenas a battle tune,
 * the lake, the roads and the Maker's Isle theirs. Danger comes first: a sleeping dragon nearby turns it
 * hushed and tense, an awake dragon or a monster close by brings the danger tune, and a fight with a
 * dragon the boss tune. Each tune streams only while it plays. The music button turns it on and off. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const OGA = "https://opengameart.org/content/";
  // gain evens out how loud each recording is
  const TRACKS = (App.MUSIC_TRACKS = {
    town_rpg: { file: "town_rpg.mp3", title: "Town Theme RPG", author: "cynicmusic", page: "town-theme-rpg", gain: 0.73 },
    happy_town: { file: "happy_town.mp3", title: "Happy Town", author: "Guy G. Gamerson", page: "happy-town", gain: 1.03 },
    exploring_town: { file: "exploring_town.ogg", title: "Exploring Town", author: "Spring Spring", page: "exploring-town", gain: 0.43 },
    puppy_garden: { file: "puppy_garden.ogg", title: "Puppy Playing in the Garden", author: "Spring Spring", page: "puppy-playing-in-the-garden", gain: 1.29 },
    floppy_ears: { file: "floppy_ears.ogg", title: "Doggy's Floppy Ears", author: "Spring Spring", page: "doggys-floppy-ears", gain: 2.5 },
    heckin_crows: { file: "heckin_crows.ogg", title: "Heckin' Crows", author: "congusbongus", page: "heckin-crows", gain: 0.85 },
    feel_good_island: { file: "feel_good_island.ogg", title: "Feel Good Island", author: "Brandon Morris, loop by AntumDeluge", page: "feel-good-island-loop", gain: 0.7 },
    tropical_fantasy: { file: "tropical_fantasy.ogg", title: "Tropical Fantasy", author: "Spring Spring", page: "tropical-fantasy", gain: 0.79 },
    sandy_seaside: { file: "sandy_seaside.ogg", title: "Sandy Seaside 2", author: "Spring Spring", page: "sandy-seaside-2", gain: 0.73 },
    mirror_lake: { file: "mirror_lake.mp3", title: "Mirror Lake", author: "Joth", page: "mirror-lake", gain: 0.72 },
    lunar_moth: { file: "lunar_moth.mp3", title: "Lunar Moth", author: "Locomule", page: "lunar-moth", gain: 1.83 },
    contemplation: { file: "contemplation.mp3", title: "Contemplation", author: "Joth", page: "contemplation-0", gain: 2.1 },
    spooky_dungeon: { file: "spooky_dungeon.ogg", title: "Spooky Dungeon", author: "Memoraphile (You're Perfect Studio)", page: "spooky-dungeon", gain: 2.1 },
    haunted_castle: { file: "haunted_castle.mp3", title: "8-bit Haunted House Theme", author: "Wolfgang_", page: "8-bit-haunted-house-theme", gain: 1.1 },
    cavern: { file: "cavern.mp3", title: "Cavern", author: "Alex McCulloch (Pro Sensory)", page: "cavern-0", gain: 0.75 },
    end_dungeon: { file: "end_dungeon.mp3", title: "JRPG - End Dungeon", author: "HydroGene", page: "jrpg-end-dungeon", gain: 0.55 },
    mine_underground: { file: "mine_underground.ogg", title: "Underground (Chiptune Loops)", author: "MatiasVME", page: "chiptune-loops-0", gain: 0.96 },
    mine_sunless: { file: "mine_sunless.ogg", title: "Sunless (Chiptune Loops)", author: "MatiasVME", page: "chiptune-loops-0", gain: 0.99 },
    porkymon: { file: "porkymon_main.mp3", intro: "porkymon_start.mp3", title: "Porkymon Battle Theme", author: "Joth", page: "porkymon-battle-theme", gain: 0.69 },
    rins_theme: { file: "rins_theme.ogg", title: "Rin's Theme", author: "request", page: "rins-theme-loopable-chiptune-adventurebattle-bgm", gain: 1.28 },
    rpg_battle: { file: "rpg_battle.ogg", title: "8-Bit RPG Battle/Encounter Theme", author: "Wolfgang_", page: "8-bit-rpg-battleencounter-theme", gain: 1.11 },
    battle_loop: { file: "battle_loop.ogg", title: "8-Bit Battle Loop", author: "Wolfgang_", page: "8-bit-battle-loop", gain: 1.14 },
    urgency: { file: "urgency.ogg", title: "Chipped Urgency", author: "Centurion_of_war", page: "chipped-urgency", gain: 0.42 },
    great_boss: { file: "great_boss.ogg", title: "Great Boss", author: "Spring Spring", page: "great-boss", gain: 0.44 },
  });
  for (const k in TRACKS) TRACKS[k].url = OGA + TRACKS[k].page;

  // ---------- what plays where ----------
  // regions: Camping, Duck Pond, Waterfall, The Pier, Beach Sand, The Palm
  const TOWN = ["town_rpg", "puppy_garden", "exploring_town", "happy_town", "floppy_ears", "heckin_crows"];
  const ROUTE = ["lunar_moth", "lunar_moth", "lunar_moth", "feel_good_island", "feel_good_island", "feel_good_island"];
  const LAKE = ["tropical_fantasy", "sandy_seaside"], DUNGEON = ["spooky_dungeon", "haunted_castle"], DEEP = ["cavern", "end_dungeon"];
  const MINE = ["mine_underground", "mine_sunless"], ARENA = ["porkymon", "rins_theme"];
  const at = (list, i) => list[((i % list.length) + list.length) % list.length];
  const vill = (i) => App.villages[i];
  const dungeon = (i) => (App.dungeons || []).find((d) => d.i === i);
  const mine = (i) => (App.mines || []).find((m) => m.i === i);
  const arena = (r) => (App.arenas || [])[r];
  // a place key -> [track, where it is, muffled?]
  function resolve(key) {
    const [kind, arg] = key.split(":"), i = +arg;
    switch (kind) {
      case "village": return [(App.regionTune && App.regionTune(vill(i).region)) || at(TOWN, vill(i).region), vill(i).name];
      case "villageN": return ["mirror_lake", vill(i).name + " at night"];
      case "home": return [(App.regionTune && App.regionTune(vill(i).region)) || at(TOWN, vill(i).region), "indoors at " + vill(i).name, true];
      case "contest": return [TRACKS[arg] ? arg : "happy_town", "the Song Contest"];
      case "dungeon": return [at(DUNGEON, i), (dungeon(i) || {}).name || "a dungeon"];
      case "dungeonIn": return [at(DEEP, i), "the Great Underworld" + (App.inside ? ", floor B" + (App.inside.ri + 1) + "F" : "")];
      case "mine": return [at(MINE, i), (mine(i) || {}).name || "a mine"];
      case "mineIn": return [at(MINE, i), "inside " + ((mine(i) || {}).name || "a mine"), true];
      case "arena": return [at(ARENA, i), (arena(i) || {}).name || "the arena"];
      case "arenaT": return ["rpg_battle", "tournament at " + ((arena(i) || {}).name || "the arena")];
      case "route": return [at(ROUTE, i), "the roads of " + App.regions[i].name];
      case "lake": return [at(LAKE, i), "the great lake"];
      case "lakeN": return ["mirror_lake", "the great lake at night"];
      case "night": return ["mirror_lake", "the wilds at night"];
      case "shrine": return ["contemplation", "the Maker's Isle"];
      case "lair": return ["cavern", "near a sleeping dragon"];
      case "danger": return ["urgency", arg === "dragon" ? "a dragon is close!" : "monsters close by!"];
      case "battle": return ["battle_loop", "a fight nearby"];
      case "boss": return ["great_boss", App.inside ? "face to face with the guardian of this floor!" : "fighting a dragon!"];
    }
    return ["lunar_moth", ""];
  }

  // ---------- where you are, and what is near ----------
  let place = null, threat = null, threatUntil = 0;
  function threatAt(x, z) {
    let found = null;
    const rank = { lair: 1, "danger:monster": 2, "danger:dragon": 3, battle: 4, boss: 5 };
    const up = (k) => { if (!found || rank[k] > rank[found]) found = k; };
    for (const d of App.dragonObjects ? App.dragonObjects.values() : []) {
      if (d.dead) continue;
      const dist = Math.hypot(d.x - x, d.z - z);
      if (App.dragonFight && dist < 120 && App.dragonFight(d)) up("boss");
      else if (d.held || d.handFlying) up("danger:dragon");
      else if (!d.asleep && dist < 80) up("danger:dragon");
      else if (d.asleep && dist < 50) up("lair");
    }
    for (const m of App.monstersNear ? App.monstersNear(x, z, 40) : []) {
      if (m.foe) up("battle");
      else if (Math.hypot(m.x - x, m.z - z) < 18) up("danger:monster");
    }
    for (const b of App.creatureBodiesNear ? App.creatureBodiesNear(x, z, 40) : []) if (b.battle) up("battle");
    return found;
  }
  // the nearest place; you stay "in" a place until you are well clear of it, so the music does not flicker at its edge
  function placeAt(x, z) {
    const night = App.isNight, day = Math.floor(st.T / 1440), m = st.T - day * 1440;
    const tourney = App.tourneyWindow && m >= App.tourneyWindow.start && m < App.tourneyWindow.end;
    const cands = [];
    const add = (id, key, px, pz, r) => { const d = Math.hypot(px - x, pz - z); if (d < r * 1.3) cands.push({ id, key, d: d / r }); };
    for (const d of App.dungeons || []) add("d" + d.i, "dungeon:" + d.i, d.x, d.z, 55);
    for (const M of App.mines || []) add("m" + M.i, "mine:" + M.i, M.x, M.z, 50);
    for (const a of App.arenas || []) if (a) add("a" + a.region, (tourney ? "arenaT:" : "arena:") + a.region, a.x, a.z, 60);
    for (const v of App.villages) add("v" + v.i, (night ? "villageN:" : "village:") + v.i, v.x, v.z, (v.r || 30) + 30);
    if (App.ISLE) add("isle", "shrine", App.ISLE.x, App.ISLE.z, 55);
    const keep = place && cands.find((c) => c.id === place.id);
    if (keep) return keep;
    const best = cands.filter((c) => c.d < 1).sort((a, b) => a.d - b.d)[0];
    if (best) return best;
    if (App.lakeSd && App.lakeSd(x, z) < 30) return { id: "lake", key: night ? "lakeN:0" : "lake:" + (x < 0 ? 0 : 1) };
    const r = App.regionOf(x, z);
    return { id: "r" + r, key: night ? "night" : "route:" + r };
  }
  function moodNow() {
    if (App.inside) {
      const T = App.inside.map.target;
      if (T.kind === "dungeon") {
        // face to face with a floor's guardian: the boss tune; otherwise the deep tune of this band of floors
        const I = App.inside, v = I.view, B = v && (I.mons || []).find((m) => m.mo.boss && !m.dead);
        if (B && Math.hypot(B.x - v.x, B.z - v.z) < 26) return "boss";
        // a party fighting right where you are looking: the battle tune
        if (v && (I.figures || []).some((f) => (f.pose === "melee" || f.pose === "cast") && Math.hypot(f.x - v.x, f.z - v.z) < 30)) return "battle";
        return "dungeonIn:" + Math.floor(I.ri / 6);
      }
      if (T.kind === "mine") return "mineIn:" + T.mine.i;
      if (T.kind === "casino") return "arena:" + T.casino.region; // a lively tune at the tables
      if (T.kind === "guild") { const gv = App.villages.find((q) => q.region === T.hall.region); return "home:" + (gv ? gv.i : 0); }
      return "home:" + T.sc.village;
    }
    const x = App.cam.target.x, z = App.cam.target.z, now = performance.now();
    const th = threatAt(x, z);
    // danger lingers a few seconds so it does not stop and start
    if (th) { threat = th; threatUntil = now + 6000; return th; }
    if (threat && now < threatUntil) return threat;
    threat = null;
    // a singer on the stage of the Song Contest, close by: its song
    const sung = App.contestTune && App.contestTune();
    if (sung) return "contest:" + sung;
    place = placeAt(x, z);
    return place.key;
  }

  // ---------- playing: one streamed track at a time, crossfaded ----------
  let ctx = null, master = null, enabled = false, cur = null, wantKey = null;
  let volume = 0.6;
  try { const v = parseFloat(localStorage.getItem("tickle-music-vol")); if (v >= 0 && v <= 1) volume = v; } catch (e) { /* storage blocked */ }
  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
    return ctx;
  }
  function stop(c, secs) {
    if (!c) return;
    const t = ctx.currentTime;
    c.gain.gain.cancelScheduledValues(t); c.gain.gain.setValueAtTime(Math.max(0.0001, c.gain.gain.value), t);
    c.gain.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    setTimeout(() => { c.el.pause(); c.el.removeAttribute("src"); c.el.load(); try { c.src.disconnect(); } catch (e) { /* gone */ } }, secs * 1000 + 100);
  }
  function play(key) {
    wantKey = key;
    const [id, , muffled] = resolve(key), T = TRACKS[id];
    if (cur && cur.id === id && !!cur.muffled === !!muffled) { cur.key = key; return; }
    stop(cur, 1.4);
    const el = new Audio();
    el.preload = "auto";
    const src = ctx.createMediaElementSource(el), g = ctx.createGain();
    g.gain.value = 0.0001;
    let node = src;
    if (muffled) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 850; node.connect(f); node = f; }
    node.connect(g).connect(master);
    const c = (cur = { id, key, el, src, gain: g, muffled: !!muffled });
    const fadeIn = () => {
      if (cur !== c) return;
      const t = ctx.currentTime, to = T.gain * (muffled ? 0.55 : 1);
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(to, t + 1.6);
    };
    if (T.intro) {
      // the opening plays once, then the main part loops
      el.src = "music/" + T.intro; el.loop = false;
      el.addEventListener("ended", () => { if (cur !== c) return; el.src = "music/" + T.file; el.loop = true; el.play().catch(() => {}); }, { once: true });
    } else { el.src = "music/" + T.file; el.loop = true; }
    el.addEventListener("playing", fadeIn, { once: true });
    el.play().catch(() => {});
    App.ui && App.ui.onMusic && App.ui.onMusic();
  }
  App.musicOn = () => enabled;
  App.musicNow = () => { if (!wantKey) return null; const [id, where] = resolve(wantKey); return Object.assign({ where, key: wantKey, id }, TRACKS[id]); };
  App.musicVolume = (v) => {
    if (v == null) return volume;
    volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem("tickle-music-vol", String(volume)); } catch (e) { /* storage blocked */ }
    if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    return volume;
  };
  App.toggleMusic = (on) => {
    enabled = on == null ? !enabled : on;
    try { localStorage.setItem("tickle-music", enabled ? "1" : "0"); } catch (e) { /* storage blocked */ }
    if (enabled) {
      if (!audio()) return;
      if (ctx.state === "suspended") ctx.resume();
      play(moodNow());
    } else if (ctx && cur) { stop(cur, 0.5); cur = null; wantKey = null; }
    const b = document.getElementById("musicBtn");
    if (b) { b.setAttribute("aria-pressed", enabled ? "true" : "false"); b.textContent = enabled ? "\u266a on" : "\u266a off"; }
    App.ui && App.ui.onMusic && App.ui.onMusic();
  };
  // every second: does the tune still fit where the camera is?
  setInterval(() => {
    if (!enabled || !ctx) return;
    const k = moodNow();
    if (k !== wantKey) play(k);
    const b = document.getElementById("musicBtn"), n = App.musicNow();
    if (b && n) b.title = "Now playing: " + n.title + " by " + n.author + " (" + n.where + ")";
  }, 1000);
  // remembered from last time, but the browser only lets it start after a click or a key
  let wanted = false;
  try { wanted = localStorage.getItem("tickle-music") === "1"; } catch (e) { wanted = false; }
  const kick = (e) => {
    if (e && e.target && e.target.closest && e.target.closest("#musicBtn, #menuMusicToggle")) return; // those buttons decide
    window.removeEventListener("pointerdown", kick); window.removeEventListener("keydown", kick);
    if (wanted && !enabled) App.toggleMusic(true);
  };
  window.addEventListener("pointerdown", kick); window.addEventListener("keydown", kick);
  document.addEventListener("click", (e) => { if (e.target.closest("#musicBtn, #menuMusicToggle")) { wanted = false; App.toggleMusic(); } });
})();
