/* Places: click any building or landmark to see what it is. Houses, town halls, granaries, arenas,
 * dungeons, mines, docks, altars, Ether fields and the Maker's statue each get a card with their name,
 * what is going on there now, a little of their story, and a way inside when they have one.
 * The giant statue tells the Tickles' legend of their Maker. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DOT = " &middot; ";

  // how big each kind of place is, for clicking (half width, height)
  function sizeOf(s) {
    const t = s.type;
    if (t === "maker_0") return [8, 30];
    if (t.startsWith("arena_")) return [13, 8];
    if (t.startsWith("dungeon_") || t.startsWith("mine_")) return [6.5, 7];
    if (t.startsWith("guildhall_")) return [4.4, 7];
    if (t.startsWith("casino_")) return [7, 9];
    if (t === "smithy_0") return [6, 9];
    if (t === "paddock_0") return [6, 2.5];
    if (t === "roost_0") return [2.6, 13];
    if (s.house && t.startsWith("manor_")) return [3.6, 8];
    if (s.house && t.startsWith("townhouse_")) return [2.4, 6.5];
    if (t === "dock_0") return [5, 2];
    if (t === "etherfield_0") return [1.8, 4];
    if (t === "altar_0") return [1.4, 1.8];
    if (s.hall) return [3.6, 6.5];
    if (s.granary) return [2.4, 5];
    if (s.house) return [2.3, 4.5];
    return null;
  }
  const B = new THREE.Box3(), P = new THREE.Vector3();
  App.pickPlace = (ray) => {
    let best = null, bd = Infinity;
    for (const s of App.sceneryVisible || []) {
      const sz = sizeOf(s);
      if (!sz || s.gone) continue;
      let cx = s.x, cz = s.z;
      if (s.type === "dock_0" && s.dock != null) { const D = App.docks[s.dock]; cx = D.x + D.ux * 7; cz = D.z + D.uz * 7; }
      const y = App.genHeight(cx, cz);
      B.min.set(cx - sz[0], y - 1, cz - sz[0]); B.max.set(cx + sz[0], y + sz[1], cz + sz[0]);
      if (ray.intersectBox(B, P)) { const d = P.distanceTo(ray.origin); if (d < bd) { bd = d; best = s; } }
    }
    return best ? Object.assign(App.placeInfo(best), { dist: bd }) : null;
  };

  // ---------- what each place says about itself ----------
  const LEGEND = "<p><b>The Legend of the Maker.</b> The Tickles tell that before there were beaches there was only the Chain, endless and dark. The Maker came to it with a pocketful of strokes: spheres and joints, cubes and curves and a box of colours. Stroke by stroke he drew the first Tickle, and he liked it so much that he drew 9,629 of them, every one a little different: a Sabre on a skateboard, a Koda in flippers, a String Cheese in golden glasses.</p>" +
    "<p>He gave them six lands to live in, the Camping, the Duck Pond, the Waterfall, the Pier, Beach Sand and the Palm, and wrote all of it into the Chain so that nothing could ever rub them out. Then, the story goes, he raised his arms to the sky, just like this statue, and let them play.</p>" +
    "<p>Nobody has seen the Maker since, so the Tickles show him the only way they can imagine him: as one of them, golden, arms up. The devout cross the lake to thank him, and his answer comes as Ethernum. The rarest Tickles of all, the ones whose every part matches, carry his blessing; and the few who are the only one of their kind carry all of it.</p>";
  // a building in ruins: how far the rebuilding has got; it cannot be moved or entered until it is standing again
  function ruinText(s) {
    const r = st.ruins && st.ruins[s.idx], pc = r ? Math.min(99, Math.round((r.progress || 0) * 100)) : 0;
    return "In ruins" + (r && r.cause ? " (destroyed " + esc(r.cause) + ")" : "") + ": the villagers are rebuilding it, " + pc + "% done. Until it stands again nobody can go in and it cannot be moved.";
  }
  // what each guild does, and how it ties into the rest of the world
  const GUILD_TEXT = {
    adventurers: "The village parties that go down into the Great Underworld sign up here, and so do the dragon hunters. Every floor cleared and every guardian beaten earns standing, and standing makes a fighter hit harder down below.",
    warriors: "Swords, axes and spears. Two of them guard every mine each afternoon, one at the door and one on its rounds inside, so the goblins cannot raid the miners' stores; they also keep the night watch and stand against dragons.",
    marauders: "Scouts and treasure hunters. A party that takes a marauder along finds its way faster and brings back more; out in the wilds they dig up hidden caches of Ethernum, gems and, now and then, an old relic.",
    miners: "Every shift worked digs a mine a little deeper. Each new level opens more galleries and richer veins (and brings the orichalcum closer), and a miner with standing is luckier at the rock face.",
    merchants: "The traders who buy food from the granaries that have plenty and carry it to the villages that run short; the gold from the mines is sold through them.",
    mages: "Those who study the Ether. They fight from a distance with Fireball, Frost Shard, Lightning and Arcane Missiles, or mend their friends with Healing Light; the more Ethernum a mage carries, the stronger its spells. A party with a mage and a healer goes deeper.",
  };
  App.placeInfo = (s) => {
    const out = { s, name: "", sub: "", text: "", rows: [], enter: null };
    const v = s.village != null ? App.villages[s.village] : null, day = Math.floor(st.T / 1440), m = st.T - day * 1440;
    const doorAt = (x, z) => App.enterableAt(x, z);
    if (s.house) {
      const ids = App.residentsOf(s), id = ids[0];
      const big = s.type.startsWith("manor") ? "manor" : s.type.startsWith("townhouse") ? "townhouse" : null;
      const what = big || (s.type.startsWith("cottage") ? "cottage" : s.ruined && s.orig && /^(manor|townhouse)/.test(s.orig) ? "new house" : "round hut");
      out.name = ids.length > 1 ? "The " + what + " of a household of " + ids.length : (id != null ? App.nameOf(id) + "'s" : "A") + " " + what;
      out.sub = v.name + DOT + App.placeKindText(v);
      if (ids.length > 1) { out.rows.push(["Who lives here", ids.map((x) => esc(App.nameOf(x))).join(", ")]); const o = App.ownerOf(id); if (o) out.rows.push(["Their holder", esc(st.wallet && o === st.wallet ? "you" : App.shortAddr(o))]); }
      else if (id != null) { const step = App.planStep(id, st.T).step; out.rows.push(["Who lives here", esc(App.nameOf(id)) + DOT + esc(App.isDead(id) ? "fallen; its spirit waits at the altar" : App.isKO(id) ? "knocked out, resting inside" : (App.stepLabel(step.k) || step.k).toLowerCase())]); }
      if (s.ruined) out.rows.push(["State", ruinText(s)]);
      out.text = big === "manor" ? "<p>A manor: two floors, a pillared porch, a tower with a flag and a gold vane. Only the richest Tickles have one; the village builders put it up when its owner paid for it. Inside: a great hall, a bedroom upstairs and a strong room.</p>"
        : big === "townhouse" ? "<p>A townhouse: two storeys, timbered upstairs, a balcony over the door and flowers at the windows. Its owner paid the village builders to rebuild its old house bigger.</p>"
        : "<p>Every Tickle has a home of its own: a cottage with a bedroom upstairs or a round hut, its roof in the colour of the clan. Inside: a rug, a stove, a bookshelf and a picture of the Maker on the wall.</p>";
      if (id != null && App.wealthText && App.wealthText(id)) out.rows.push(["Belongings", esc(App.wealthText(id))]);
      if (!s.ruined) out.enter = doorAt(s.x + Math.sin(s.rot) * 2.7, s.z + Math.cos(s.rot) * 2.7);
    } else if (s.hall) {
      const o = App.oreOf ? App.oreOf(v) : null;
      out.name = v.kind === "town" ? v.name + " Town Hall" : v.kind === "estate" ? v.name + ": the Manor" : v.name; out.sub = App.placeKindText(v);
      out.rows.push(["Granary", Math.round(v.food) + " food (" + App.foodWord(v) + ")"]);
      if (o) { const list = Object.keys(App.ORES).filter((k) => o[k] >= 1).map((k) => Math.floor(o[k]) + " " + k); out.rows.push(["Stores", list.length ? list.join(", ") : "nothing from the mine yet"]); }
      out.text = v.kind === "mansion" ? "<p>A mansion: every Tickle of its holder lives here under one roof (the more of them, the bigger it is). A great hall, bedrooms for all of them, a strong room. Its granary, altar and fields are round it.</p>"
        : v.kind === "estate" ? "<p>The holder's manor, in the middle of its estate: every Tickle of the holder has its own house round it. The great hall is where the estate's council meets; Tickles whose houses burned sleep here until theirs is rebuilt.</p>"
        : "<p>The heart of a town of small holders, each household in its own house: the elder's seat, the banners, a long table for the council and a council room upstairs. Tickles whose houses burned sleep here until theirs is rebuilt.</p>";
      if (s.ruined) out.rows.push(["State", ruinText(s)]);
      else out.enter = doorAt(v.hall.door.x, v.hall.door.z);
    } else if (s.granary) {
      out.name = v.name + " Granary"; out.sub = App.placeKindText(v);
      out.rows.push(["In store", Math.round(v.food) + " food for " + v.residents.length + " (" + App.foodWord(v) + ")"]);
      out.text = "<p>Everything the village farms, hunts, fishes and gathers ends up here. Meals come out of it three times a day, and raiders and dragons come for it.</p>";
      if (s.ruined) out.rows.push(["State", ruinText(s)]);
      else out.enter = doorAt(s.x + Math.sin(s.rot) * 3, s.z + Math.cos(s.rot) * 3);
    } else if (s.type.startsWith("arena_")) {
      const ar = (App.arenas || []).find((a) => a && Math.hypot(a.x - s.x, a.z - s.z) < 3);
      out.name = ar ? ar.name : "Creature Arena"; out.sub = "A colosseum sunk into the earth, with three rows of stone seats round the sand";
      const tr = ar && st.tourneys && st.tourneys[day + ":" + ar.region], ch = ar && st.champs && st.champs[ar.region];
      out.rows.push(["Tonight", tr ? (tr.done ? "the tournament is over: " + esc(App.nameOf(tr.champ)) + " won" : tr.players.length + " tamers in the tournament at " + App.clock(day * 1440 + App.tourneyWindow.start).short) : "no tournament"]);
      if (ch) out.rows.push(["Champion", esc(App.nameOf(ch.id)) + (ch.creature ? " with " + esc(ch.creature) : "")]);
      out.text = "<p>Every evening the region's best tamers battle their creatures here, and the Lucky Shells bet on every match. Drop two fighters into its ring with the hand, Tickles, creatures, monsters or farm animals, and it turns into a boxing ring.</p>";
    } else if (s.type.startsWith("dungeon_")) {
      const d = (App.dungeons || []).find((x) => Math.hypot(x.x - s.x, x.z - s.z) < 3);
      out.name = d ? d.name : "Dungeon"; out.sub = "A way into the Great Underworld" + DOT + "36 floors under the whole map";
      if (d) { const parties = Object.values(st.parties || {}).filter((p) => p && p.day === day && p.dungeon === d.i); out.rows.push(["Today", parties.length ? parties.length + " part" + (parties.length > 1 ? "ies" : "y") + " of adventurers" : "nobody is going down"], ["Delves so far", String((st.delves && st.delves[d.i]) || 0)]); }
      out.text = "<p>A way down into the Great Underworld: one dungeon that runs under the whole map, 36 floors deep, and every cave on the map leads into it. Each floor is a labyrinth as wide as all the land above, joined under the channels, with chests at the dead ends, spike traps, bones and cobwebs. Six bands of six floors, each deeper and darker than the last (the Goblin Warrens, the Catacombs, the Serpent Halls, the Labyrinth, the Burning Deep and the Abyss), and on every floor a guardian behind whom an iron gate seals the stairs down: no Tickle goes deeper until it is beaten. From Grubnose the goblin boss on the first, all the way to the bottom of the world, right beneath the Maker's Isle, where every way through meets and the Golden Tickle waits, the strongest of all. Treasure on the way (Ether crystals, silver, gold, gems, orichalcum and relics) makes the adventurers strong enough to go deeper. Every afternoon the parties of adventurers (warriors with blades, mages with spells, healers with light) go down floor by floor; a message tells you when one faces a guardian, with a button to watch the fight.</p>";
      if (d) out.enter = doorAt(d.door.x, d.door.z);
    } else if (s.type.startsWith("mine_")) {
      const M = (App.mines || []).find((x) => x.i === s.mine);
      out.name = M ? M.name : "Mine"; out.sub = M ? "Rich in " + M.rich.join(" and ") + (M.orichalcum ? DOT + "a deep vein of orichalcum" : "") : "";
      if (M) {
        let n = 0; for (const o of App.villages) if (o.region === M.region) for (const id of o.residents) if (App.isMiner(id) && App.mineOf(id) === M) n++;
        out.rows.push(["Miners", n + " from the villages around"]);
        if (App.mineLevel) out.rows.push(["Level", App.mineLevel(M) + " of 5" + (App.mineNextAt(M) ? " (" + Math.round((((st.mineWork && st.mineWork[M.i]) || 0) / App.mineNextAt(M)) * 100) + "% dug toward the next)" : " (as deep as it goes)")]);
        if (App.mineGuards) { const g = App.mineGuards(M, day); out.rows.push(["On guard", g.length ? g.map((id) => esc(App.nameOf(id))).join(" and ") + " (Warriors' Guild), 13:30 to 17:25" : "nobody today: the goblins may raid the stores"]); }
      }
      out.text = "<p>Rails run out of the dark with a loaded cart. Inside, tunnels as deep as the Miners' Guild has dug them (three floors at first, five at the deepest level), the ore veins worked at the dead ends and carts rolling on the main tunnel. Mine goblins sneak in to steal the ore and giant spiders nest in the side tunnels: two warriors of the Warriors' Guild stand guard every afternoon, one at the door and one on its rounds inside. A rock troll guards the deepest vein. Orichalcum, the legendary metal, is found only down there, and only rarely.</p>";
      if (M) out.enter = doorAt(M.door.x, M.door.z);
    } else if (s.smithy != null && App.smithyInfo && App.smithyInfo(s)) {
      const I = App.smithyInfo(s);
      out.name = I.name; out.sub = App.regions[App.smithies[s.smithy].region].name + DOT + "Blacksmiths' Guild";
      out.text = I.text;
    } else if (s.type.startsWith("guildhall_") && s.guild && App.GUILDS) {
      const G = App.GUILDS[s.guild], Bd = App.guildBoard ? App.guildBoard(s.guild, s.region) : null, Q = App.guildQuarters && App.guildQuarters[s.region];
      out.name = G.name; out.sub = Q ? Q.name : App.regions[s.region].name;
      if (Bd) {
        out.rows.push(["Members", Bd.members + " in " + esc(App.regions[s.region].name)]);
        if (Bd.top.length && st.gxp && st.gxp[Bd.top[0]] > 0) out.rows.push(["The best", Bd.top.slice(0, 3).filter((id) => st.gxp[id] > 0).map((id) => esc(App.nameOf(id)) + " (" + App.guildRankName(id) + ")").join(", ")]);
        if (Bd.duty) out.rows.push(["Today", esc(Bd.duty)]);
      }
      out.text = "<p>" + esc(GUILD_TEXT[s.guild] || "") + "</p>";
      out.enter = doorAt(s.x + Math.sin(s.rot) * 4.2, s.z + Math.cos(s.rot) * 4.2);
    } else if (s.type.startsWith("casino_") && App.casinos && App.casinos[s.casino]) {
      const Cs = App.casinos[s.casino], guests = App.casinoGuests ? App.casinoGuests(Cs).filter((g) => !g.staff) : [], bank = (st.casinoBank && st.casinoBank[Cs.i]) || 0;
      out.name = Cs.name; out.sub = "Casino" + DOT + App.regions[Cs.region].name + DOT + "open from 19:00 to 23:30";
      out.rows.push(["Tonight", guests.length + " guests (the Lucky Shells come on many nights)"], ["The house", (bank >= 0 ? "up " : "down ") + Math.abs(Math.round(bank)) + " shells"]);
      if (st.casinoLog && st.casinoLog.best) out.rows.push(["Biggest win", esc(App.nameOf(st.casinoLog.best.id)) + ", " + Math.round(st.casinoLog.best.n) + " shells at " + esc(App.CASINO_GAMES[st.casinoLog.best.game].toLowerCase())]);
      out.text = "<p>Texas Hold'em poker, blackjack, European roulette and 90-ball bingo, with real cards, a real wheel and real balls, all played for shells. Go inside, click a table to watch it, and sit one of your own Tickles down to play with its shells.</p>";
      out.enter = doorAt(Cs.door.x, Cs.door.z);
    } else if (s.type === "dock_0") {
      const D = App.docks[s.dock], F = D && D.ferry != null ? App.ferries[D.ferry] : null, L = D && D.launch != null ? App.ferries[D.launch] : null;
      out.name = D ? D.name : "Dock"; out.sub = "On the great lake";
      if (F) { const o = App.docks[F.a === D.i ? F.b : F.a]; out.rows.push(["Ferry", "to " + esc(o.name) + ", about every " + App.ferryEvery(F) + " minutes, 06:00 to 22:00" + (F.boatman != null ? "; boatman " + esc(App.nameOf(F.boatman)) : "")]); }
      if (L) out.rows.push(["Pilgrims' launch", "to the Maker's Isle, when pilgrims have booked it" + (L.boatman != null ? "; boatman " + esc(App.nameOf(L.boatman)) : "")]);
      out.rows.push(["Rowing boats", "four, for the fishers of the shore villages"]);
      out.text = "<p>A wooden jetty out over the lake, a lamp at its end and the ferry sign by the bank.</p>";
    } else if (s.type === "maker_0") {
      out.name = "The Maker"; out.sub = "The giant statue on the Maker's Isle";
      out.rows.push(["In the stories", "P.M.: all that survives of the Maker's name"], ["Pilgrims", (st.faithLog ? st.faithLog.prayers.toLocaleString() : 0) + " prayers answered so far"]);
      out.text = LEGEND;
    } else if (s.type === "etherfield_0") {
      const f = (App.etherFields || [])[s.ether];
      out.name = f ? f.name : "Ether crystals"; out.sub = "Crystals of Ether growing out of the rock";
      out.text = "<p>Nobody knows why Ether grows here. Some say the Maker spilled a little light when he drew the world, and it took root in the stone. Tamers and the devout come to gather it: Ethernum is the energy their creatures' spells run on.</p>";
    } else if (s.type === "altar_0") {
      const fallen = Object.keys(st.fallen || {}).filter((id) => st.fallen[id].village === v.i).length, r = st.rituals && st.rituals[v.i];
      out.name = v.name + " Revival Altar"; out.sub = App.placeKindText(v);
      out.rows.push(["Waiting", fallen ? fallen + " fallen, their spirits by the altar" + (r && !r.done ? "; the ritual is at " + App.clock(r.s).short : "") : "no one: nobody from the village has fallen"]);
      out.text = "<p>Where the village brings its fallen back. At nightfall the villagers gather round it, pray to the Maker and offer food from the granary, and the spirit waiting beside it comes home.</p>";
    }
    return out;
  };
})();
