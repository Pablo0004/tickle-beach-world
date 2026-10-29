/* The guided tour (the "Tour" button in the top bar, or T): the camera goes from one thing to the next, the whole
 * game in a few minutes, each stop with a short caption: the island, a town, a fortress and its castle inside, an
 * estate, the Guild Quarter, the arena, the Great Underworld, a mine, a dragon's peak, the lake and its ferries, a
 * dive site, the casino, the Parliament, the prison, the Ether fields, a war (a demo one can be started), the
 * encyclopedia and the build mode. Back, Next, Play (on by itself every 14 seconds) and Close. */
(function () {
  "use strict";
  const App = window.App, st = App.st, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const near = (list, x, z) => list.slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
  const fly = (x, z, r) => { if (App.inside && App.leaveInterior) App.leaveInterior(); setTimeout(() => App.flyTo(x, z, r), App.inside ? 700 : 0); };
  const inside = (x, z) => { const go = () => { const T = App.enterableAt && App.enterableAt(x, z); if (T && !T.shut) App.enter(T); }; if (App.inside && App.leaveInterior) { App.leaveInterior(); setTimeout(go, 900); } else { App.flyTo(x, z, 30); setTimeout(go, 1600); } };

  function stops() {
    const V = App.villages, fort = V.find((v) => v.walls && v.stable && v.armoury) || V.find((v) => v.walls), town = near(V.filter((v) => v.kind === "town"), fort.x, fort.z);
    const grand = near(V.filter((v) => v.kind === "grand" && v.residents.length > 20), fort.x, fort.z), R = fort.region;
    const inR = (list) => (list || []).find((o) => o && o.region === R) || (list || []).find(Boolean);
    const arena = inR(App.arenas), dg = inR(App.dungeons), mine = inR(App.mines), lair = inR(App.lairs), dock = inR(App.docks), dive = inR(App.diveSites), casino = inR(App.casinos), gq = inR(App.guildQuarters), ether = inR(App.etherFields);
    const P = App.parliament, pr = App.prison;
    const war = st.war && st.war.wars.find((w) => w.status === "on");
    const S = [
      { t: "Tickle Beach World", x: 0, z: 0, r: 520, text: "All 9,629 Tickle Beach NFTs, built from the contract's own on-chain models, live on six islands round a great lake, one island for each floor of the collection. Each holder has a place of its own: a house in a town, a lodge, an estate or a fortress, by how many Tickles it holds." },
      { t: "A town", v: town, r: 60, text: "Small holders share a town: a house for each household, the granary, the fields, pens and the fire in the square. Each Tickle has a job, chores in the afternoon, friends, needs and moods, and plans its own day. Raids, parties, trades and rivalries happen between places." },
      { t: "A fortress", v: fort, r: 95, text: "The biggest holders build a fortress: walls with towers, great gates that open by day and shut at night, guards walking the walls (griffin riders patrol over them), catapults, an armoury and a stable for the tamed creatures. Every building has health." },
      { t: "Inside the castle", inside: fort.hall.door, text: "One ground floor: the throne hall with the kitchen, the training rooms, the lounge and the treasury round it, and the dormitories up the stairs, in bunks. Awake, each Tickle takes a place of its own (a chair, the stove, a shelf, a window, a training dummy, a chat), like the people of a Pokemon town." },
      grand && { t: "An estate", v: grand, r: 55, text: "Middling holders get an estate: a mansion in the style of its island for all their Tickles, its own fields and fire. In the evening some stay indoors, some keep the armoury, the rest sit round the fire; the pets wait at the stable." },
      gq && { t: "The Guild Quarter", x: gq.x, z: gq.z, r: 55, text: "Six guilds (warriors, mages, merchants, miners, marauders, adventurers) with ranks from Novice to Grandmaster, and the Blacksmiths' Guild with its forge, horse paddock and griffin roost: shells buy arms, mounts, boats and better houses." },
      arena && { t: arena.name, x: arena.x, z: arena.z, r: 45, text: "Tamers catch the wild creatures (seven types, strong and weak against each other), raise them and fight in the arena's tournament every evening from 17:30. Contests of every kind are held in each island too." },
      arena && { t: "A battle in the arena", x: arena.x, z: arena.z, r: 28, arena: true, text: "Every evening from 17:30 the eight strongest tamers of the island fight it out, creature against creature, type against type, until one is champion; the result comes in a card. \u201cSkip to tonight's tournament\u201d moves the clock on to it." },
      dg && { t: "The Great Underworld", x: dg.x, z: dg.z, r: 40, text: "Every cave leads down into one dungeon under the whole map, twelve floors deep, each with a guardian. Village parties go down in the afternoon for relics, Ethernum and treasure; you can go in and watch them fight." },
      dg && { t: "Down below", inside: dg.door || dg, text: "A floor of the Great Underworld: corridors, chambers, monsters on patrol, chests and the guardian at the stairs. Results come in a card: floors reached, guardians beaten, loot." },
      mine && { t: mine.name, x: mine.x, z: mine.z, r: 40, text: "The miners dig stone, coal, copper, iron, silver, gold, gems and orichalcum; the smiths turn them into tools and arms. The Warriors' Guild guards the mines." },
      lair && { t: lair.name, x: lair.x, z: lair.z, r: 70, text: "Each island's dragon sleeps on its highest peak, wings folded, and flies a patrol. Some nights it attacks a village and the places round about fight it together; heroes can slay it." },
      dock && { t: "The great lake", x: dock.x, z: dock.z, r: 70, text: "Ferries cross the lake to the other islands; fishers row out; swans, turtles, otters and koi live in it. The Lake Serpent rises some afternoons, and the Kraken from the open sea." },
      dive && { t: dive.name.charAt(0).toUpperCase() + dive.name.slice(1), x: dive.x, z: dive.z, r: 45, text: "Divers go down to wrecks and reefs for treasure; a float or a wake board only comes out in the water." },
      dive && { t: "Under the water", dive, text: "Down with a diver: the surface closes overhead, fish and sea life all round, the wreck or the reef below, and what it finds (pearls, coins, old treasure). In first person you can dive yourself, holding your breath." },
      App.seaCaves && App.seaCaves.length && { t: "A sea cave", cave: near(App.seaCaves, fort.x, fort.z), text: "Deep under the open sea, a few caves go down into the rock: only a diver can find the way in, and inside there are monsters, crystals and old chests." },
      casino && { t: casino.name, inside: casino.door, text: "Each island has a casino, open from 19:00: poker (with a nightly tournament), blackjack, roulette, bingo, the slot machines and the bar, with its dealers and waiters." },
      P && { t: P.name || "The Parliament", inside: P.door || P, text: "On the Maker's Isle the holders' ministers sit every afternoon, seats shared by how many Tickles each holds, and vote laws, the Director's designs, and the works done on neutral land." },
      pr && { t: pr.name || "The prison", x: pr.x, z: pr.z, r: 50, text: "A Tickle listed for sale on the marketplace lives here until it is sold (a joke, read from OpenSea's listings)." },
      ether && { t: ether.name, x: ether.x, z: ether.z, r: 40, text: "Ether crystals grow in the Ether fields: Ethernum powers creature magic and lights the way down below." },
      { t: "Wars", war: true, text: war ? "A war is on now: armies of up to fifty in formation, a siege at the gate (the ram, catapults, archers on the walls) or an open battle, scored in stars as in Clash of Clans; the winner takes the spoils." : "Bitter rivals go to war: armies of up to fifty with a general (infantry, spears, archers, mages, healers, tamers, cavalry, griffin riders) march in column along the roads; sieges at the gates, open battles elsewhere; stars as in Clash of Clans, and the winner takes the spoils. Press \u201cWatch a demo war\u201d to see one now." },
      { t: "The encyclopedia", menu: "encyclopedia", text: "Menu > Encyclopedia: every creature, monster, guardian, dragon and sea beast, filled in the first time you see it, Pokedex style; arms, spells, relics, mounts, guilds, factions and the units of war." },
      { t: "Your turn", text: "\u201cAI runs it\u201d lets the island live by itself; \u201cI'm in control\u201d gives you the tools: give orders to your own Tickles, build with blocks (lines, walls, areas), place objects from the catalogue, move and remove them, undo. Choose a holder to play as its Tickles. Click anything to inspect it." },
    ];
    return S.filter(Boolean);
  }

  // ---------- the caption ----------
  let list = null, i = 0, timer = null;
  function box() {
    let el = $("tourBox");
    if (el) return el;
    el = document.createElement("div"); el.id = "tourBox"; el.className = "glass";
    el.style.cssText = "position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);z-index:45;width:min(92vw,560px);padding:12px 16px;border-radius:14px";
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tour]"); if (!b) return;
      const a = b.dataset.tour;
      if (a === "next") go(i + 1); else if (a === "back") go(i - 1); else if (a === "close") App.endTour();
      else if (a === "play") { if (timer) { clearInterval(timer); timer = null; } else timer = setInterval(() => go(i + 1 < list.length ? i + 1 : 0), 14000); show(); }
      else if (a === "demo") demoWar();
      else if (a === "tourney") skipToTourney(list[i]);
      else if (a === "menu") { const s = list[i]; const btn = document.querySelector('[data-gm="' + s.menu + '"]'); if (btn) btn.click(); }
    });
    return el;
  }
  function show() {
    const s = list[i], el = box();
    el.hidden = false;
    el.innerHTML = '<div style="font-size:11.5px;opacity:.7;letter-spacing:.1em;text-transform:uppercase">Tour \u00b7 ' + (i + 1) + " of " + list.length + "</div>" +
      '<div style="font-size:19px;font-weight:800;margin:2px 0 4px">' + esc(s.t) + "</div><div style=\"font-size:13.5px;line-height:1.4\">" + esc(s.text) + "</div>" +
      '<div class="row" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn" data-tour="back"' + (i ? "" : " disabled") + ">Back</button>" +
      '<button class="btn primary" data-tour="next">' + (i + 1 < list.length ? "Next" : "Finish") + "</button>" +
      '<button class="btn" data-tour="play">' + (timer ? "Pause" : "Play") + "</button>" +
      (s.war ? '<button class="btn" data-tour="demo">Watch a demo war</button>' : "") +
      (s.arena ? '<button class="btn" data-tour="tourney">Skip to tonight\u2019s tournament</button>' : "") +
      (s.menu ? '<button class="btn" data-tour="menu">Open it</button>' : "") +
      '<span style="flex:1"></span><button class="btn" data-tour="close">Close</button></div>';
  }
  function go(k) {
    if (k >= list.length) return App.endTour();
    i = Math.max(0, k);
    const s = list[i];
    if (s.inside) inside(s.inside.x, s.inside.z);
    else if (s.cave) { const c = s.cave, go2 = () => App.enter({ kind: "seacave", cave: c, door: c.door, name: c.name }); if (App.inside && App.leaveInterior) { App.leaveInterior(); setTimeout(go2, 900); } else { App.flyTo(c.x, c.z, 30); setTimeout(go2, 1600); } }
    else if (s.dive) diveDemo(s.dive);
    else if (s.v) fly(s.v.walls ? s.v.walls.x : s.v.x, s.v.walls ? s.v.walls.z : s.v.z, s.r);
    else if (s.war) { const w = st.war && st.war.wars.find((x) => x.status === "on"); if (w) fly(w.front.x, w.front.z, 55); else if (App.inside && App.leaveInterior) App.leaveInterior(); }
    else if (s.x != null) fly(s.x, s.z, s.r);
    else if (App.inside && App.leaveInterior) App.leaveInterior();
    show();
  }
  // down with a diver: a Tickle near the site dives, and the view follows it under the water
  function diveDemo(site) {
    fly(site.x, site.z, 26);
    setTimeout(() => {
      const t = st.tickles.filter((x) => !App.isKO(x.id) && !(x.action && x.action.kind === "fp")).sort((a, b) => Math.hypot(a.pos.x - site.x, a.pos.z - site.z) - Math.hypot(b.pos.x - site.x, b.pos.z - site.z))[0];
      if (!t || !App.startDiveAt) return;
      if (App.endAction) App.endAction(t);
      if (site.shore) { t.pos.x = site.shore.x; t.pos.z = site.shore.z; } // (straight to the water's edge, for the tour)
      App.startDiveAt(t, site.i, st.T + 40);
      App.cam.follow = t.id;
    }, 2200);
  }
  // the clock moved on to this evening's tournament (or tomorrow's, if tonight's is over)
  function skipToTourney(s) {
    const DAY = 1440, day = Math.floor(st.T / DAY), m = st.T - day * DAY, T0 = 17 * 60 + 25;
    if (m < T0) st.T = day * DAY + T0; else if (m > 21 * 60) st.T = (day + 1) * DAY + T0;
    App.flyTo(s.x, s.z, 30);
    App.toast("It is " + App.clock(st.T).short + ": the tournament starts at 17:30.");
  }
  // a demo war: the nearest strong place against a fortress near the view, marching at once
  function demoWar() {
    if (!App.debugWar) return;
    const busy = new Set((st.war ? st.war.wars : []).filter((w) => w.status !== "over").flatMap((w) => [w.a, w.b]));
    let best = null;
    for (const b of App.villages.filter((v) => v.walls && !busy.has(v.i))) for (const a of App.villages) {
      if (a === b || busy.has(a.i) || !a.holder || a.kind === "town" || a.residents.length < 30) continue;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < 200 && (!best || d < best.d)) best = { a, b, d };
    }
    const w = best && App.debugWar(best.a.i, best.b.i);
    if (!w) { App.toast("No war could be started right now."); return; }
    App.toast(App.villages[w.a].name + " marches on " + App.villages[w.b].name + ": at the gate around " + App.clock(w.bt.arrive).short + ". Speed the clock up to see it sooner.");
    fly(w.front.gx != null ? w.front.gx : w.front.x, w.front.gz != null ? w.front.gz : w.front.z, 60);
  }
  App.startTour = () => { if (!App.villages || !App.villages.length) return; list = stops(); go(0); };
  App.endTour = () => { if (timer) { clearInterval(timer); timer = null; } const el = $("tourBox"); if (el) el.hidden = true; list = null; };
  document.addEventListener("click", (e) => { if (e.target.closest("#tourOpen")) App.startTour(); });
  window.addEventListener("keydown", (e) => {
    if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "") && !(App.fpOn && App.fpOn())) { if (list) App.endTour(); else App.startTour(); }
  });
})();
