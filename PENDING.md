# Tickle Beach World — what is pending

Updated 30 October 2026. This repository (`main`) is ahead of version 50, the game published on 24 October
(https://claude.ai/artifact/Y2NNeAnZA2GCzhpAS2qC6b); nothing since has been published yet. Items are worked in the order
agreed with the project owner; one item is finished before the next one starts. The browser test scripts and what
each one checks are in [tests/README.md](tests/README.md); `CHECKLIST.md` is the owner's list of things to test.
This file is the one record of the project: what is pending, what was done and when.

---

## 1. Next, in order

Done since version 50 (details in each item below): 1.3 the encyclopedia, 1.5 wars (with Clash of Clans' stars and
Imperium's fortresses), 1.5b connected floors, 1.5d result cards, 1.5e stables, 1.5f griffins, 1.5g the evening in
big places, 1.6 editing homes and the build mode, 1.6b oxygen tanks, 1.8 controls in the menu and dark sea caves, 1.8b
birds' wings, first person inside buildings. Still to do, in this order:

1. **1.7 What is left over**: first person able to do everything a Tickle does (dive, tame, hunt, attack, ride,
   fish...), improving skills and experience (started 5 November: B uses what is in front: tames a wild creature,
   hunts a wild animal, fishes at the water's edge; skills Taming, Hunting, Fishing, Fighting, Diving and Riding grow
   by doing, up to 50, and make things likelier to go well; shown in the Tickle's window; a tamed griffin (the
   wild creature) is now a flying mount for its tamer: M to get on, Space up and C down, in first person or, with
   the wheel pulled back, in third (done 5 November)); under the sea, B searches the bottom (once every 4 seconds): at a dive site
   what that site gives (pearls, coins, coral, Ethernum, now and then a chest or an old tank), elsewhere now and then
   a shell; the diving skill helps (done 5 November); things for your own Tickle to find or catch under the sea; more detail
   on the water surface and in the interiors.
2. ~~1.8 Open caves and mines~~ (done 5 November).
3. Smaller ends: the guided tour to redo (1.5h, on hold); the other things held in the paws (1.5c); extras attached
   to a house and more outside colours (1.6). (Done 5 November: in a sea cave your own Tickle in first person opens
   a chest with E, once a day each: 10 to 40 shells, and one time in seven an old oxygen tank, sold for 25 shells if
   it has one already; the opened chests are remembered for the session only.)
4. **1.9 The arenas (asked 5 November)**: (a) the stands: the Tickles crowded the sand in the middle; only those who
   fight belong there, and no creature or animal goes in unless it is to fight. Done 5 November (`App.arenaWay`,
   population.js): the tamers waiting for their turn and the bettors walk to their seat round the steps (never
   across the sand) and sit there; a creature not fighting, and a horse or griffin, waits outside behind its
   Tickle's seat; in the middle only the two tamers of the match and their creatures (and a training session's).
   (b) Bigger arenas. Done 5 November: half as big again (`App.ARENA`, population.js: a sand floor of 9.5, four
   rows of seats, the model at 6.4); the layout tag is now `plots-4` (village.js; from plots-3 only the things moved
   by hand go back); placed clear of villages, roads, fields and orchards (a grid search for a crowded region, as
   Duck Pond). The third on-chain arena model (`arena_1`) is walled all round with no way in, so the arenas use
   `arena_0` (a gate on every side) and `arena_2` (open at the front). Nobody walks through an arena's wall any
   more: the wall and its openings are measured from the model itself (sim.js `arenaShape`), a Tickle (and your own
   in first person) is stopped by it, and the ways in and out go round the steps or the outside to an opening; the
   ramp at the front is used only from the sand. Spectators sit in the three lower rows.
   **Left (stopped by the owner on 5 November):** in a test of 192 ways in and out, 4 still get stuck by the ramp
   (leaving the sand up the ramp towards a side gate); not yet watched live with the pane showing.
   (c) Better attacks in the battles: today they are very basic. Not started.
   (d) No wall, wall of a building or rock anywhere may be walked through (the owner saw it at the arena; check the
   rest of the world too). Not started beyond the arenas.
   (Done 6 November: the six casinos are on the maps, a magenta chip with its name on the big map, in the legends; they
   were on no map before. Click it to go there.)
   (Done 6 November: the on-chain Surfs Up stands on legs; in use only its first six strokes are drawn, the board and
   its fins with its own colours, without the stand (`keep` in the worker's ground job). Left: on a wave the surfer
   and the board sit inside the water and the foam; raising them, and a bigger board, were offered to the owner.)
9. **Music in normal play (asked 14 November, to talk about later)**: the owner loved the music of the film (the battle
   scenes among others) and wants it in the game's normal play, not only in the video. (It is the game's own music,
   music/, chosen by place: Menu > Sound > Music switches it on; it was off in the owner's game.) To settle later:
   on by default, or a notice that it exists.
11. **1.16 More mounts and creatures (asked 22 November, pending)**: flying is not only for griffins: add pegasi
    (horses with wings) and winged unicorns as mounts, and in general many more creatures, monsters and animals of
    every kind (all as strokes, like the rest). Decided 25 November: every one of them can be tamed, and every one
    with wings can fly. Still to decide: which ones, and where each lives.
12b. **1.17b The film, third pass (owner's notes on the second version, 25 November)**: much better; still:
    a. At 0:26 (the great lake) a corner of the land is not loaded yet.
    b. The first-person spearfishing still looks wrong: pull the camera back to see the Tickle with its harpoon;
       the figure seems stuck (it does not swim); it is too quick to see what happens.
    c. Skating: the skater does not move from place to place; it hops on the spot.
    d. Taming at a pond: two creatures fighting in it, with the donkey, horses and other animals about: clear the
       horses away. And Tickles should not walk through the water where others are fishing (in the game too).
    e. The war between holders: the griffin riders still get stuck; they are to keep a formation like the rest,
       attacking and defending; the defenders' may fly out beyond the wall to attack (see 1:57-1:58).
    f. The Parliament's inside is to come at the start, with its outside (not after the casino).
    g. 2:29, the Song Contest: shot from behind the stage; it should be from the front.
13. **1.18 Chat between holders (asked 25 November, pending)**: a chat so that holders can talk to each other, from
    one of their Tickles to another's.
14. **1.19 Sorties from enemy fortresses (asked 25 November, pending)**: by default, when a Tickle or a group of
    Tickles passes close to an enemy fortress, Tickles come out of it (over or through the wall) to attack the ones
    coming near, as in Imperium.
12. **1.17 The film, second pass (owner's notes on the final cut, 25 November)**, in this order:
    a. Inside the castle: the Tickles stood in one straight line, through walls and away from any table; they are
       to sit on the chairs, round the tables.
    b. Animals cross the lake without a boat (in the game too): they must not.
    c. Fishing: a much prettier angle.
    d. The fortress shot: a Tickle glitches on top of the wall and falls.
    e. First person on the griffin: the griffin spins fast on itself.
    f. Music: too many changes. Three or four calm tracks as the base, spread through the film; the livelier ones
       for battles and busy moments (the dragon's battle music is good).
    g. Diving (third and first person) looks bad: shoot it again from other angles; in first person show the
       spearfishing, something pleasant to watch.
    h. After the dragon, the short walk of several Tickles: drop it, or at least the griffin flying in it (already
       shown); at most Tickles on scooters or skateboards, something not seen before.
    i. A horse right in the sea (the surf shot): it should not be.
    j. The Parliament is shown twice from outside and never inside: order it (outside once, inside once).
       Found 25 November: of the ministers who sit on a day (about 256 of 333) only some 20 to 40 reach the chamber:
       186 live more than 340 blocks from their region's dock, the limit for an afternoon trip on the launch
       (population.js `trip`). To decide with the owner how the far ones get there (set out earlier, ride, or a
       launch from a nearer shore); meanwhile the film shoots the chamber at the vote, on the ministers present.
    k. The dungeon fight: the Dark Skull skeleton is poorly made; remodel it (not another monster).
    l. The war: the Tickles on the walls do not defend (they should shoot spears, arrows, spells); the griffin
       riders bunch on one spot instead of spreading out, attacking or defending the wall.
    m. The arena: the red and white dais makes the fighters sink into it: remove it or put it level with the
       ground; show different fights, with more striking creatures.
    n. Ether fields: drop the shot, lengthen another.
    o. The casino: instead of a pass through a room, stay on one game, then another.
    Progress 25 November (stopped at 30% of the session): done and seen in snapshots: a (seated at breakfast), c
    (from the water), e (no spin; high, round the castle; side shot outside the wall with the castle behind), m (the
    dais laid flat), n (dropped), o (one table close up). Done in code, not yet seen: b (pets and mounts wait on the
    shore), d (walkers stay off the wall top), f (fixed soundtrack), g (third-person dive dropped; spearfishing in
    open water), h (skating in place of the hunt, staged if nobody skates), i (follows from b), j (statue framed
    without the Parliament; inside at the vote on the largest group: still sparse, see the attendance finding), k
    (the Lich remodelled), l (spears on the walls, longer reach, griffin riders spread and defending). Still to do:
    m's "different, more striking creature fights"; check all of the above in snapshots; record the film again.
    Second sitting, 25 November (to 40% of the session): war.js had been pushed broken (a comment swallowed the end
    of the riders' height line, so no war loaded) and is fixed; the Parliament is shown outside once (with the
    statue) and inside once, from the Speaker's side, on its largest group; the Lich builds (60 strokes, fidelity
    check 89, no fails); skating is staged from up to fifty blocks round the square (the game's own skate action,
    checked). Still wrong: the spearfishing shot still looks at a slope of sand and the strike ends it at once (the
    Painted Reef lies along a shallow slope: try another reef, or the open-water search must also want the floor
    well below the diver all round); the siege and wall shots with the new defence are not yet seen.
    Third sitting, 25 November: all seen in snapshots now. The skaters (staged when needed), the siege (the wall
    defenders shoot arrows, throw spears and cast; the attackers' griffin riders spread over the four nearest
    defences and strike them from the air), the walls, the Parliament inside facing its ministers, the arena (the
    film picks the arena whose tournament has the most striking creatures and puts them first: a griffin against a
    fire salamander), the surf with no horse in the sea, the fortress with nobody on the wall, the Lich close up
    (robes a little lighter), the spearfishing over a deep, colourful reef (the sites are tried deepest first until
    one has fish in deep water: fish swim only in the loaded sea round the camera).
    Recorded again and given to the owner 25 November: 26 scenes, none skipped, 160 s, 1920x1080, H.264 + AAC with
    the fixed soundtrack (no errors in the mix). Waiting for the owner's notes. Open, for the owner to decide: how
    the far ministers reach the Parliament (see j).
10. **1.15 Stables for the tamed (asked 15 November, pending)**: inside a fortress, a tamed animal, creature or
    monster that is not being used (not ridden, not fighting, not out with its tamer) stays in the stables, not
    loose in the square; the stables are to be made bigger and set against the wall, on its inner side. To decide
    first: whether every fortress gets one stable block or one per holder, and where the horses for sale go.
9. **1.14 Chairs at the card tables and the bingo (asked 14 and 15 November, done)**: every seat of the poker and
   blackjack tables and of the bingo rows has a chair (casino.js `casinoBuild`), and the players sit on them (the
   `cards` pose is seated, interiors.js); the dealers stand, as do the roulette players.
   **1.14b The griffin remodelled (asked 15 November: it read as a big hen; done)**: the riding griffin
   (kit-wealth.js `griffinmount`, `griffinwing`) and the wild one (kit.js `griffin`, the same beast at a little
   more than half the size with its wings half open): a lion's body and haunches, an eagle's feathered breast, a
   short neck and a long eagle head with a hooked two-tone beak, a brow, ear tufts and amber eyes; eagle forelegs with
   talons, lion hind legs with paws, a long tail trailing behind with a tuft; the wings a thin leading edge, coverts
   and six fanned primaries with white tips. Strokes only, as everything else.
8. **1.13 Elbow room and battle lines (asked 12 November, for the film and the game)**: Tickles keep a step apart
   from each other, as they do when they talk, instead of piling up on one spot; in the wars between holders the
   armies form up as in Imperium. Done 12 November: outdoors, two Tickles standing or walking within 1.1 blocks are
   nudged apart a little every frame (`elbowRoom`, sim.js: not seats, slots, contest lines, fights, rides, first
   person, the water); the battle lines of a war have more room between files (1.5) and ranks (1.8) and stand a
   little further from the gate (3.5), the defenders behind it likewise (war.js `slotOf`; the ranks were already by
   unit: cavalry in front, then swords, spears, archers, tamers, mages, healers). Watched in a siege on 14 November
   and widened: three blocks between files and between ranks in the field (2.2/2.4 behind the gate), the first rank four
   blocks from the gate; the nudge leaves the battle lines alone (`warfight`, `warmarch` in `KEEP_PUT`: it was
   turning the ranks into a crowd). While the gate stands, only the ram's crew (one in five of the foot) goes to it;
   the rest hold their ranks and the archers and mages shoot over the wall from where they stand (war.js
   `stepWar`). The defenders' archers, mages, tamers and healers stand on top of the wall either side of the gate
   (already so; it needs the gate whole: a ruined gate makes the war an open battle at the hall door).
7. **1.12 Spearfishing (asked 11 November, done 12 November)**: diving in first person, B throws a harpoon at a fish
   ahead (one of the schools of the open sea, sea.js, within eight blocks and in the line of sight): it flies to the
   fish, following it, strikes or misses, and comes back on its cord with the fish on the point; a struck fish is
   food for the granary (a parrotfish three, a sardine one, the others two) and three shells, grows the fishing skill,
   and is gone from its school for four hours. The harpoon is a kit model (`harpoon`, group Diving; in the
   encyclopedia under Arms). Looking at the sand with no fish ahead, B still searches the bottom. Nothing like the rod
   fishing from the shore. Not done, asked once in the same breath and then interrupted: metal fish (mithril and the
   game's precious metals) as a resource for arms and shields, with rarity rates; ask before doing it.
   **Pending (asked 12 November): rates everywhere.** Everything that appears must have an appearance rate, and the
   fish a rate of being caught (by kind: a sardine common and easy, a parrotfish rarer and harder, and the metal fish
   above rarer still), so that it plays like a game and nothing is predictable. Today the harpoon strikes 50% of the
   time plus the skill, whatever the fish, and the schools are always the same; the rod catches one cast in three.
   Also 12 November: a fish on the rod's line. Rod fishers (the Fishing Rod job) now bring a fish up out of the
   water at the pull of the rod now and then (about one cast in three; `t.forceCatch` makes the next one sure, for
   the film): up the line to the tip, then gone into the basket, "Got one!", food for the granary.
6. **1.11 A film of the whole game (asked 11 November, for the TickleBedge account)**: a video showing everything the
   Shots settled on 14 November (owner's notes): the siege from high up and from the side, as Imperium shows its
   armies; the griffin a few moments in first person (eyes well down, so no unloaded land on the horizon), then the
   griffin itself from the side with the castle behind; the Parliament from outside (a dozen ministers in 333 seats
   look empty); the Guild Quarter scene dropped (its plaza is empty at any hour). A test war for the film needs the
   gate whole, the two armouries stocked and the old wars over (film.js does all that for the shot only).
   First full recording 20 November (28 scenes, 165 s, 1920x1080, H.264 + AAC): the muxer's header patch had been
   appended at the end and the music mix had failed in the audio tap; both fixed (the server writes `?at=`, the tap
   leaves offline contexts alone) and the film recorded again (28 scenes, 168 s, sound checked); given to the owner
   24 November. File: `film/tickle-beach-world.mp4` (not in git).
   game has, each thing from its best camera angle (fishing, taming, hunting, wars between holders, the Underworld,
   the casino, the arena, the sea beasts, surfing, diving, dragons, the contests, the Parliament, the mines, first
   person...). Harpoon fishing does not exist in the game (asked once, then interrupted): the film shows the fishing
   there is. Plan, under way: a director's script `tools/film.js` (not part of the game) that moves the camera from
   scene to scene (the clock set for each: dawn, the siege at the gate, the tournament at 17:40, the casino at night...)
   and records the canvas with MediaRecorder (MP4, 1920x1080, titles and fades drawn over it, the HUD left out),
   sending it in chunks to the dev server, which writes it under `film/`. Done so far (12 November): `tests/serve.js`
   takes `POST /film/<name>` (appends) and serves `film.html` (the game with `tools/film-hook.js` loaded first, an audio
   tap so the music and sounds go into the video); `film/` is ignored by git. Next: write `tools/film.js` (the scenes),
   test each scene with the pane showing, record, check the MP4 plays, hand it over.
   **12 November, later:** `tools/film.js` written (28 scenes, about 2 min 55 s in all; `tools/FILM.md` says how it is
   run); `tests/serve.py` is the dev server now (no Node on this machine: the preview runs `python tests/serve.py`).
   The owner's rules for it: **three minutes at most**; the fishing scenes (rod and harpoon) **must show the catch**
   (the fish out of the water, the harpoon striking the fish) and may end right there; **three or four fishers at
   most** in those scenes and nothing in the way of the view; **no controls or HUD** in first person (nothing of the
   HUD is recorded anyway: only the canvas); **never a shot with the land or the models still loading**: the
   recorder is paused while each scene is set up and waits for the world to load (`ready()`), so the film is one
   file made of finished parts; the owner expects it to be shot in parts and joined, which this does. Tested so far:
   the intro aerial needs the far view built (`App.farViewReady()`, a minute or two after the page loads: wait for it
   before `FILM.run()`); a wide shot of the fortress at a radius of 230 looks complete after ten seconds. Next: make
   `ready()` stricter (no jobs pending for a second and a half running, and the fine models loaded), preview every
   scene (`FILM.preview(id)`) and fix what each needs, then record with the pane on view and check the MP4.
5. **1.10 Animals off the walls (asked 5 November)**: horses and other animals cannot patrol the wall walks; at most
   those that fly can fly over them.

### 1.3 An encyclopedia (asked 22-23 October)

"An encyclopedia where weapons, monsters, animals... are recorded; every entry numbered, with all kinds of
specifications of each animal, monster or weapon." Inside the game menu (1.4). Entries, each numbered:
animals (farm, wild, lake, pond, birds), creatures and their types, monsters of the caves and the Underworld,
the 12 guardians, dragons, sea beasts, weapons, shields and their wear, spells, relics, mounts and riding beasts,
boats, ores and Ethernum, places, jobs, guilds, factions, laws, and the units of war (1.5). Each entry: its
model, number, what it is, where it lives or is found, health, attack, defence, speed, type and what it is
strong against, abilities, who can tame or ride or use it, price, what it drops or gives. Possibly "seen /
not seen yet" entries, unlocked as the player meets them.

### 1.5 Wars between holders, inspired by Imperium (asked 23 October)

"I want wars to be organised between the holders (addresses), which is also why the fortresses and the patrols
on the walls make sense. Inspired by the game Imperium." Ideas to agree on with the owner before building:
- who declares war: rivalries between places (they exist: raids, alliances), the Director, the Parliament, or
  the player for its own holder;
- the armies: the armed Tickles of a holder as units (swords, spears, mages, healers, tamers with their
  creatures, cavalry on horses and riding beasts, griffin riders), marching in formation along the roads;
- sieges: the fortresses' walls, towers and gates defended by the wall guards, gates to break, the castle to
  take; open battles for places without walls;
- the outcome: tribute in shells and food, prestige, a truce; knocked-out Tickles recover (no permanent deaths
  unless decided otherwise);
- a war panel (who is at war, armies, sieges, with Watch), and the war in the inspect window and the
  encyclopedia.

- **Agreed with the owner (28 October)**:
  - **Who declares war**: the rivalries between places (raids, thefts) end in war on their own.
  - **The fallen**: they do not recover until the war is over and the supplies have been moved; after a war, at
    least 3 days before the same holder can be attacked again, unless an ally who has not fought that holder
    attacks it (the ally's right to battle is used).
  - **The winner takes everything** (confirmed 28 October: shells, the granary's food, the ores in store, arms, and
    the loser's houses and plot too; in the game only, never the real tokens).
  - **Battles**: armies in formation along the roads (infantry, spears, mages, healers, tamers, cavalry, griffin
    riders); sieges where there are walls, open battle where not. **Walls, castles, mansions and houses can be
    destroyed** (buildings have health).
  - **Fortresses more like Imperium**: guards patrolling on the walls (already), armouries inside the walls,
    catapults, and health for every building.

- **Built so far (28 October, js/war.js)**: health for every building (inspect window), armouries (93: fortresses and
  great estates) and catapults (60, inside the fortress walls; the arm swings and the stones knock out), bigger
  castle gates whose two leaves open by day, shut at night (they open for the household) and shut fast in a war
  (they block the way until broken); declaration from rivalries (relation 15 or less), the ally's right to battle,
  allies joining, armies of up to 50 with a general, units and formations (column, line, cavalry in the centre,
  square, on the walls), the march in column along the roads, siege (ram and the attacker's catapults against
  the gate, then the castle) and open battle (houses burn, the hall is taken), the fallen out until the convoy
  of supplies arrives, loot (food, ores, shells, arms to the armoury, the place held with daily tribute, a war
  of liberation), truce after 5 days, 3 days of peace, the war panel (Menu > World), the War section of the
  encyclopedia. Test hook: `App.debugWar(a, b)`.
- **Clash of Clans, merged in (asked 28 October: "incorporate all of it with what we have")**: every unit goes for
  what it prefers (cavalry, griffin riders and mages the defences: catapults, wall towers, the armoury; swords,
  spears, archers and tamers the nearest building; griffins fly over the walls), defences fire on their own
  (catapults, the archers of the wall towers), traps behind the gate, destruction % (every building but the
  stretches of wall) and stars (half, the castle or hall, all of it). Three stars win at once, two at the end of a
  day of battle, after five days one star still wins. Loot by stars: three, everything and the place; two,
  everything but the place; one, half the granary, ores and shells; defenders who beat the attack off take half
  the attackers' granary and ores and the arms of the attackers who fell. Nothing is rebuilt during the war.
- **Archers (asked 28 October)**: about a third of the foot soldiers carry bows; in a siege the defenders' archers,
  mages and tamers go up on the walls either side of the gate and shoot from the top (the wall walk is about 2.6
  cells wide; widen it if they look cramped). Armies are only the holder's own Tickles, and allies' when there is an
  alliance (asked 28 October; it already worked that way).

### 1.5b Interiors: connected floors (asked 28 October)
"Moving between the rooms is not practical; make bigger and more varied spaces" (a castle, and likely the
mansions and big houses). Fixed the same day: rooms 99 and 200+ could not be entered; the ways out are numbered
1, 2, 3... Done 28 October: in mansions and castles the rooms off the great hall (kitchen, training rooms,
lounge, strong room or treasury) are built into one ground floor, in a column either side, behind low walls with a
doorway into each (cut away like a doll's house): all seen at once and walked between; the stairs still go up to
the bedrooms. Still to do: the same for the other big interiors, and more varied rooms.
- **Life indoors like the people of a Pokemon town (asked 28 October, for every interior: houses, castles,
  mansions, casinos, the Parliament...)**: done for houses, mansions and castles: awake and not controlled, each
  Tickle takes a place of its own (one per chair, sofa seat or throne; the stove, counter or cauldron; a shelf to
  read at; a window or picture; a training dummy; chats two by two; the rest stroll up and down), changing every
  hour; lunch and breakfast still round the table; two who chat stand a good step apart (2.4). Also done: the guild halls (each member in a place of its own instead of two rows), the casino (one per seat at the tables, the machines and the stools as before; the other guests stand round the tables watching; those waiting for the tournament in little knots, talking, not in a queue). The Parliament already seats each minister in its own seat.

### 1.5h A guided tour of everything (asked 29 October; taken out the same day, to be redone later)
A tour for showing the game to someone was built (a "Tour" button, 23 stops) and taken out at the owner's request
("it is badly done; we will see to it another time"). Weak points seen: slow stops (a dive takes half a minute,
the tournament means waiting for 17:30), tricks (moving the clock on, a sea cave entered without diving), most
stops show a quiet place rather than something happening, long captions, the card over the minimap. To be
redone with the owner when the time comes (perhaps a "see it now" list with buttons). The removed code is in the
git history (js/tour.js, commit 24a704d).

### 1.5g The evening in the big places (asked 28 October)
"At the fire of a mansion or a castle they are too crowded: spread them, or not all of them: some patrolling the
walls, some in the stable, some indoors, the rest round the fire, more spread out." Done the same day for places of
more than 24: about 15% keep an evening watch on the walls (fortresses), about 35% spend the evening indoors (seen
inside, each in a place of its own), about 12% at the armoury, the rest
round the fire in wider rings. Also: snacks and chips stay in the paws everywhere (indoors too); the towel only
near the water; a griffin takes off even for a short hop, so its rider flies over the walls, never through the
gate.

### 1.5d Clearer results in every kind of fight (asked 28 October)
Wars, the arenas' tournaments, the dungeons, the duels, sea beasts and dragons: say plainly who won, by how much
and what it brought (stars, scores, loot), where you see it and in the log. Done 28 October: a result card (App.resultCard, ui.js) for the
fights near you or the ones you watch: wars (stars, % destroyed, who is left standing, the spoils), the spoils
arriving, truces, raids, dragon attacks, sea beasts, the arena tournaments, the Great Underworld (floors reached,
guardians beaten, loot). Still to do if wanted: duels and contests (contests already show a podium).

### 1.5e Stables for tamed creatures (asked 28 October)
Tamed creatures stay waiting at the door while their Tickles sleep: build stables in the villages' grounds and
inside the fortresses, where they spend the night. Done 28 October: a stable (strokes: a timber barn, open front, hay, a trough) in every
lived-in place (249), inside the walls of a fortress; while its Tickle is indoors a tamed creature waits at the
front of its place's stable or in the yard before it. Changed 29 October (asked): the pets are not taken to the evening gathering
at the fire (they take up too much room): they wait at the stable and are fetched when it is over; the stable is
half as big again and well away from the fire (22 to about 50 cells, 35 on average).

### 1.5f More griffins (asked 28 October)
"I love seeing Tickles flying on them": more griffin riders, and they attack and defend mounted on them (in a war
they already fly over the walls and strike the defences; to grow: more of them, and a part in other fights). Done 28 October: the fortresses and the
great estates keep griffins in their roosts: about a fifth of their armed Tickles ride one (339 griffin riders in
all, from 62); they fly in war (griffin riders) and keep their watch on the walls in the air, over the top.

### 1.5c Carried things in the inventory (asked 28 October)
The rings, boards, balls and other things a Tickle holds make no sense most of the time (training with a swim
ring in hand). They belong in its inventory with its arms and belongings, and come out only when they are used
(the swim ring or the board when swimming or surfing). Done 28 October for the float (Tube) and the wake board: put away on land and
indoors, out in the water (the on-chain model keeps them; only the world hides them). To look at with the owner:
the other things held (towel, snacks, chips, games) and the Ground items.

### 1.6 Editing homes and a better build mode (asked 16 and 24 October)

"Not only the mansions: mansions, castles, houses... I also want to improve the option to build in the mode that
allows it, to be able to remove things and to have a variety of objects to place." To agree the details with the
owner before building:
- **Edit every home, inside and out**: houses, townhouses, manors, mansions of every region, castles, palaces and
  the warrens. Inside (interiors.js rooms): move, add and remove furniture, change floors and walls. Outside: paint
  colours (walls, roof, shutters), extras (porch, balcony, chimney, garden, fence, flowers), maybe extend it. Who
  may edit: only the holder's own homes when playing as a holder; anything in "I'm in control" mode.
- **A better build mode** ("I'm in control", the dock: Select, Give orders, Build, Dig, Place object): today Build and
  Dig set single blocks and Place object only puts down objects approved in Review (sim.js `App.placeProp`). Wanted:
  - **removing** what was placed (`App.removeProp` exists but has no tool) and undo;
  - a **catalogue of objects** to place, in groups (furniture, garden, lights, decoration, market stalls, fences and
    walls, statues, trees and plants, play...), from the kit and the approved designs, with a preview, turning
    them before placing (and moving them afterwards);
  - better block building: more block types, filling and clearing an area, lines and walls, a ghost of the block
    before it goes down.

- **Agreed with the owner (28 October)**:
  - **Who edits where**: playing as a holder, only its own homes, and only on its own plot (land); never on
    another holder's plot. Any edit on neutral land (no holder's plot) is provisional: it lasts only if the
    Parliament approves it (it goes on its agenda; rejected, it is taken away). Reading of "I'm in control" with no
    holder chosen: it has no plot of its own, so it may only make provisional edits on neutral land (to confirm
    with the owner when it is built).
  - **What**: everything: furniture inside (move, add, remove), floors and walls, colours outside (walls, roof,
    shutters), extras (porch, balcony, chimney, garden, fence, flowers) and enlarging.
  - **Build mode**: all of it: remove and undo, the catalogue of objects in groups with a preview, turning and
    moving, more block types, fill and clear an area, lines and walls, a ghost of the block before it goes down.
  - **Oxygen (1.6b)**: the tank refills on its own at the surface, like the breath.
- **Built so far (28 October, js/build.js)**: the build mode's half. Who may build where (`App.editRight`: own plot,
  another holder's plot refused, neutral land provisional until the Parliament votes on it: `App.pendingEdits`,
  `App.decideEdit`, on the Parliament's agenda as "the works on neutral land"); Build in five modes (one block, a
  line, a wall of a chosen height, fill an area, clear an area; two clicks for all but one, 30 by 30 at most) with a
  green ghost (red where it is not allowed); every block type in the swatches; Place object from a catalogue in
  groups (the kit's furniture, village things and fences, stalls, dungeon and mine things, contest and diving
  things, the sea, farming, landscape; and the approved designs), a ghost of the model, R turns it; Move (pick an
  object up, set it down, R turns it); Remove; Undo (button and Ctrl+Z) for all of it. Kit objects are saved with
  the game (props with `kit`).
- **Editing homes (29 October, js/homeedit.js)**: inside a home on one's own land, "Edit this home" in the room's
  card opens a panel: click a piece of furniture to choose it, click the floor to move it, Turn, Take away; Add
  furniture (the kit's Interiors pieces; the new piece comes chosen); floor colours (8) and wall colours (9); Add a
  room (up to 4, reached by a doormat by the way out); Roof outside: repaint in any of the six species' colours.
  Garden extras for the build mode's catalogue ("Garden and extras"): flower beds, hedges, a porch (and the fences
  and plants that were there). Kept with the game (`st.homes`, by the home's key), laid over its rooms each time
  they are made. Item 1.6 is done; what the owner may still want: more extras attached to the house itself
  (balcony, chimney) and other colours than the roof outside.

### Developer mode (asked 31 October, done)
Until the game is published and holders' wallets can be verified (Vulcan, on Discord), every Tickle can be used:
orders and first person ("I'm in control"), the hand, contests and the casino, buying for them, and building and
editing homes anywhere with no Parliament vote. On by default; Menu > Settings > Developer mode turns it off, and
then the holder rules apply again (`App.devMode`, `App.canUse` in ui.js). To be switched off (or removed) when the
verified wallets arrive.

### Note: where the game will live first (said by the owner on 29 October)
At first the game will be for Discord, where holders' addresses are verified through Vulcan (a verification bot);
if it grows it will move elsewhere. To keep in mind: playing as a holder (st.wallet) should come from that verified
address; nothing to build for it yet unless the owner asks.

### 1.6b Oxygen tanks (asked 24 October, decided with the owner; built 29 October)

Built: the breath is now a minute and a half; a tank gives ten more minutes, used first, and both fill again at
the surface (a "Tank" bar in first person); bought for 40 shells (wished for by those who love the water, more by
the water jobs and divers; on the Tickle's card; old families may own one), found now and then on a wreck (kept,
or sold for 25 shells if it has one); divers with a tank find a little more; the tank (strokes, `oxytank`) on the
back while diving or in the water in first person; in the encyclopedia (Arms) and the Tickle's belongings. Not
done: a chance in the sea caves' chests (left out: the caves' chests have no loot of their own yet). Not seen yet in
the browser (the pane was hidden): the tank on a diver's back and the bar.

Original plan:

Without a tank a Tickle holds its breath for **1 minute 30 seconds** under the water (today 45 seconds,
firstperson.js `a.air`, `dtReal / 45`). With an **oxygen tank** it has **10 more minutes** of air. Decided with the
owner: a tank can be **bought and found**, both. Plan:
- the catalogue (wealth.js `CAT`): `tank: [null, { name: "an oxygen tank", short: "Oxygen tank", price: 40 }]`, owned
  as `st.own[id].ox`; offered on the Tickle's card (`allNext`, `App.buyFor`) and wished for by Tickles who love the
  water (`wishes`, a little more by fishers and divers), with its own lines in `line()` and `LABEL`;
- found: a rare dive find (diving.js `FINDS`/`ITEM`/`credit`: "an old oxygen tank, still sound"; kept if it has
  none, sold for shells if it has one), and a chance in the sea caves' chests (interiors.js `seaCaveMap`);
- in first person: the tank's air is used first, then the breath; a second bar ("Tank") in the HUD when it has one;
  the breath and the tank fill again at the surface (confirmed with the owner, 28 October);
- a tank on its back in the model while diving (a small kit model on the pivot, like the weapons in rampage.js
  `weaponShow`), and in the inspect window and the encyclopedia (1.3);
- NPC divers: with a tank they stay down longer per dive (diving.js `CYCLE`) and find a little more.

### 1.8 Controls in the menu, open caves and mines, dark sea caves (asked 30 October)
- **Controls**: a "Controls" section in the menu with everything for keyboard and gamepad (and touch), so that no
  help about controls takes up the screen while playing. Done 30 October: Menu > Controls rewritten as tables (around the
  world, first person with keyboard, controller and touch, the build tools, inside); off the screen: the keys line
  in first person (only the name and Leave), the dock's hint line, the "drag to look" note inside, the long
  controller toast.
- **Descriptions folded (asked 30 October)**: the long description of every place is folded away, opened only if
  wanted: inside, in the room's card ("About this place"; the treasure of a floor in "Treasure on this floor");
  outside, in the card of a building or a landmark ("About this place") and in the inspect window ("About it"), which
  keeps it open while it refreshes. Done.
- **First person inside buildings (asked 30 October)**: going into buildings in first person; and a Tickle in first
  person does not get the buttons to go up, down or out until it reaches the door or the stairs that lead there. Done
  30 October (interiors.js, "first person inside"): walking one of your Tickles in first person, E at a door takes
  it in and you keep walking it: WASD (Shift to run), the mouse (click to capture) or the arrow keys to look,
  through its own eyes (the Tickle itself is never seen in first person: the owner's rule); it goes round the walls, the low walls of a floor plan, the passages of a cave and the big
  furniture; the ways on show in the room's card only when it stands at them ("... (E)"), E takes them (up, down,
  out); out of the door it is still yours in first person outside; Esc gives the room view back.
- **Open caves and mines**: only the dungeons (the Great Underworld) stay labyrinths; the other caves and the mines
  become open spaces, like the rooms worked on lately (the merged floors). Done 5 November (interiors.js, `openCave`): the mines and
  the sea caves are open caverns: the corners of the rock rounded off, the walls inside taken down but for a few
  outcrops of rock (short slabs, never one that cuts a part off); what lay in the dead ends (ore veins, treasure) now
  lies in the nooks (the corners and the lee of an outcrop). The Great Underworld is still a labyrinth.
  **Changed 5 November (the owner: "neither exact labyrinths nor plain open spaces", like the caves of the Pokemon
  games, though a few caves can be open):** the mines and the sea grotto are now passages with halls big and small
  on them (`o.poke` in `mazeFloor`), more than one way round, rope bridges over chasms (first person keeps to the
  bridge), and ways shut by a fallen rock, a flooded stretch or a bare chasm, never on the only way to the stairs or
  out, mostly closing a side passage with a chest at its end (30 to 60 shells; a vein of gold in a mine). Your own
  Tickle in first person opens them with E using what it can do: a rock, a mage's spell, a warrior's strength or a
  tamed Earth creature pushing it; water, a fire mage dries it, a frost mage freezes it, a flying creature (or its
  griffin) carries it over, a water creature swims it across, or an oxygen tank; a chasm, a flying creature or a
  mage's blink, and a rope bridge is tied across. The pearl chamber of a sea cave stays one open cave. The mines are
  a little bigger (10 by 7 cells at the top). The Great Underworld is unchanged.
- **Sea caves**: walls of dark blue stone, as dark as it should be down there, lit only in spots by torches. Done 30 October:
  dark blue stone walls and floor, very little light but the torches (warm pools), and sea creatures going up and
  down the passages (crabs, jellyfish, a turtle, a manta) (1.7's "sea creatures in the sea caves" too).

### 1.8b Birds spread their wings (asked 30 October, done)
The songbirds and gulls flew with their wings folded. Now each has two wings (strokes, `birdwing`, the colours of its
kind) hung from the shoulders: spread and beating while it flies (a gull glides between beats), hidden while it sits
(birds.js).

### 1.7 Left over from version 50 (smaller; ask the owner before widening any of them)

- More detail: colour variation inside the models (a leafy tree is one green), the water surface, the interiors. Done 30 October for
  the trees and bushes: the leafy crown lighter on top and darker underneath, the pine darker at the bottom tier and
  lighter at the top, bushes in two greens (all from the on-chain palette, procgen.js `TREES`).
- The far walking figures (pawns) follow straight lines between plan points and can cross buildings. Done 29 October: a far figure whose
  point falls inside a building is drawn just outside it, so it goes round the walls (population.js `updatePawns`).
- First-person abilities against dragons, sea beasts and the Underworld's guardians (first person is not available
  inside); ability levels or choices.
  **Widened by the owner (30 October)**: in first person a Tickle must be able to do everything a Tickle not in
  first person does: dive, tame, hunt, attack, ride animals, fish, and the rest; and every one of them improves its
  skills and experience.
- Under the sea: things for your own Tickle to find or catch (pearls, shells), sea creatures in the sea caves, the
  sea floor seen from above through the water (the surface is nearly opaque from above). Done 30 October: close up
  (camera nearer than 60) the water is clear enough to see the bottom, its reefs, weed, rocks and fish; it fades back
  to the sea's colour by 120 (world.js `daylight`).

- **More detail and more life in the living (28 October, local, not published)**: dragons were the coarsest thing in
  the world (cube 12 scaled 2.4 times); now cube 8 on Normal and smaller with the Graphics setting. Monsters,
  creatures, animals and mounts follow the Graphics setting like the buildings (`App.liveVoxel` in sim.js: Normal as
  before, High x0.65, Ultra x0.5, never below `fine.min`), keeping the agreed proportion (a town view: about 1.2
  million triangles, 9 ms a frame on High). Dragons asleep on their peak fold their wings back along the body, lie
  down on the rock with the head bowed, breathe slowly and puff smoke now and then, with smooth changes between
  poses (wildlife.js `pose`). Dungeon monsters sway and bob as they walk, breathe when still, lunge into a blow and
  fliers flap (interiors.js, a pivot under each monster). The owner's rule: everything must stay convertible to
  on-chain stroke models (in CLAUDE.md).

- **The encyclopedia (item 1.3, done 28 October, local, not published)**: Menu > Encyclopedia (`js/encyclopedia.js`),
  Pokedex-style as the owner chose: 143 numbered entries in 15 sections. Beings (animals, water life, birds,
  creatures, monsters, guardians, dragons, sea beasts) show a dark shape and "???" until first seen near the view
  (`App.dexScan` every 2 s: animals, lake and pond life, birds, creatures, cave monsters, dragons; inside, the
  monsters of the room, `App.insideMonsters`; a guardian also when its floor is beaten); a toast announces each new
  entry. Knowledge (arms, spells, relics, mounts, boats, ores, jobs, guilds, factions) is open from the start. Each
  entry: a 3D picture of its model (made once, offscreen), number, what it is, where, health, attack, defence, speed,
  type, strong and weak against, ability, who can tame or use it, price, what it gives. Kept in the save (`st.dex`).
  Left for later: the units of war (item 1.5) and laws, when they exist; sea beasts have no picture yet.

## 2. Open questions

- **The menu and the clock**: the world keeps running while the menu is open; should it pause? (Asked in
  `CHECKLIST.md`.)
- **Breath under water**: decided and built (1.6b): 1 minute 30 seconds without a tank, 10 more minutes with one,
  refilled at the surface.
- **Waves in the rivers and the lake** (item 8b): the waves at the mouths of the channels were removed (the
  "open sea" no longer includes the channels between regions), and the lake and ponds are calm. If the owner
  meant something else — for example the dark stripes of the stepped riverbed seen through the water — it is
  still to be changed.
- **Credits**: Menu → Credits still names the author of the Tickle Beach collection (a real-world credit, not
  lore). Asked whether to remove it; no answer yet.
- **Listings**: the owner's OpenSea API key stays on the owner's machine; `tools/update_listings.py` reads it from
  `OPENSEA_API_KEY`. Sales from on-chain pools are not detected yet.

## 3. To keep an eye on

- **A meticulous review of the whole game "as a game designer"** (standing request): done alongside everything
  else, never closed.
- **Creature tournament fights** may resolve too fast to be watched comfortably.
- **A crowd at the castle door** in the morning, when hundreds of Tickles leave by one door (more ways out could be
  given); check whether it still happens now that the residents go in and out by the castle's door.

## 4. Done in version 50 (approved by the owner and published as the game on 24 October)

- **The game menu** (item 1.4, asked 23 October; `js/menu.js`): the right-hand panel that could not be closed, the
  Directory, the big map and the old Menu's sections now live in one menu that opens over the world (the Menu
  button or Esc) and closes again (Esc, "Back to the world"); with it closed the world is full-screen. Sections:
  Play (Tickles, Holders, Adventure, Map, Directory), World (Director, Review, Library), Options (How it works,
  Controls, Sound, Settings, Credits). The pages are the same elements as before, moved into the menu, so all their
  code works unchanged; `App.openMenu(page)`, `App.closeMenu()`, `App.toggleMenu(page)`, `App.gameMenuOpen(page)`;
  the old openers (`App.setTab`, `App.showMenu`, `App.openMap`, `App.openDirectory`, `App.selectTickle`,
  `App.openReview`) open the menu at their page, and `App.flyTo`, `App.goToToken`, `App.enter`, `App.enterFP` close
  it. The world keeps running while the menu is open. Test: `t_menu.js` (desktop and `W=400 H=800`). The
  encyclopedia (1.3) goes into it as a section of its own when it is made.

- **Diving, the sea floor and the sea caves** (item 1.2c, asked 24 October; `js/sea.js`, firstperson.js,
  interiors.js `seaCaveMap`, world.js): the open sea's floor with kelp, seagrass, coral, anemones, sponges, sea
  stars, urchins, rocks and shells, and fish schools, turtles, mantas, jellyfish and crabs (14 new models in the
  kit, group "Sea"; streamed in cells of 24 blocks within 40 of the view; plants sway in a vertex shader); the
  underwater look whenever the view is under the surface (blue-green haze by depth, shafts of light, bubbles, the
  sea bed sand-coloured) or following a diver from above with the surface hidden, as in Pokemon Emerald's diving
  (`App.diveView`); diving in first person (C down, Space up, the breaststroke, breath with a HUD bar); twelve
  sea caves (two per region, `App.seaCaves`) entered only from down at the mouth, each a two-floor grotto with
  treasure. Tests: `t_sea.js`, `t_dive.js`, `t_uw.js`. To consider later: things to find or catch down there for
  your own Tickle (pearls, shells), sea creatures in the caves, the sea floor seen from above through the water.

- **Nothing walks through buildings; doors and gates** (item 1.2b, asked 24 October): a building's footprint is
  now the base of its model (its cubes in the first two blocks up, sim.js `groundBox`), no longer the whole box
  shrunk by an eighth, so its walls block to their edge; every building is gone into and left only by its doors
  (sim.js `doorsOf`, `doorway`, used by `walkTo`: the middle of the front, the models face +z; an arena has a gate
  on each side); sheds, stables, roosts, altars, the statue and cave and mine mouths now block as buildings (only
  fences, troughs, docks and piers, Ether fields, log seats and the fire do not); the arenas got four gates cut
  through their ring with a pair of towers at each (kit.js `arena`); every fortress wall has at least four gates
  (geo.js: more in the middle of the widest stretches); farm and wild animals, creatures (pets wait outside) and
  cave monsters never step into a building (`App.buildingBlocks`). Tests: `t_walls.js`, `t_clip.js`, `t_arena.js`.
  Still to watch: the far walking figures (pawns) follow straight lines between plan points.
- Fine models are made only when the workers are idle, so the Tickles coming into view are never held up.

- **Residents go inside their castle or mansion** (asked 24 October): they used to crowd and sleep at the door.
  Now, for the shared homes (citadel, fortress, keep, estate, plot), they walk to the door and go in from a couple
  of blocks away (or from further when the crowd holds them up), out of sight, and nobody pushes them back out
  (sim.js `startDo` `indoor`, `separate`). Test: `t_night.js`. The ones left outside at night are wall guards on
  patrol and those still on their way home.
- **Log seats lengthwise round the fire** (asked 24 October; geo.js: the log model is long along its z).

- **More detail, always in cubes** (item 1.2, in progress): block textures on the terrain (`js/blocktex.js`: a
  16-pixel tile per block face, grey multipliers of the block colour, the grass side in colour; mipmapped,
  anisotropic); merged faces in the voxel mesher (`sdf.js meshVoxels`: faces in full light of one colour become
  rectangles; the scene went from 1.8 to 1.06 million triangles with the same look); Menu > Settings > Graphics
  (`js/gfx.js`: Normal / High / Ultra, kept in the browser): High and Ultra add a third, finer level of detail
  for the models near the camera (`App.fragX`, made in the workers the first time a model comes near: High 0.65 of
  the usual cube within 26 blocks, Ultra 0.5 within 40), the sun's shadows (a shadow map following the view,
  2048 or 4096, none at night) and a higher pixel ratio; all levels have a sky dome with a gradient (its colours
  from the day, night and weather background). Test: `t_tex.js` (`Q=`, `NOTEX=`). Also done (24 October): the sea's
  breakers built of small cubes (surf.js: a fifth of a block, deep blue to pale crest, a darker face, a foam lip,
  loose foam cubes; ready-made heights so the cubes keep their size; half again as tall); the castles and
  mansions in more detail (kit-wealth.js `adorn`: every window framed with glazing bars and a sill, every door
  framed with a step, courses of darker stone on castle walls and towers; their finest copy goes down to a cube of
  16 (Ultra) or 20 (High) for castles and palaces, all the way for mansions); the voxelizer about three times
  faster with identical output (checked model by model: `sdf.js` evalList, box culling of cubes), which also
  shortens loading. Still open: colour variation inside the models (a leafy tree is one green), the water
  surface, the interiors.
- **First person while controlling a Tickle** (item 1.1, asked 22 October; `js/firstperson.js`): a click captures
  the mouse (pointer lock) to look round, Esc frees it and a second Esc leaves; a crosshair and the name of what
  is in front (the inspect picker at the centre, or the building's name), a click opens its inspect window; a HUD
  with the health bar, the four needs and a compass (N/E/S/W); Space jumps on foot; a head bob with the stride and
  a steadied eye height; the mouse wheel pulls the camera back behind the Tickle (third person, up to 14 blocks)
  and in again; on touch screens a stick on the left third walks (pushed to the edge it runs) and a drag
  elsewhere looks, a tap inspects. In first person every pointer goes to `App.fpPointer` (world.js hands them
  over). On phones the minimap hides in first person and the key hints shrink to the name and Leave. Test:
  `tests/t_fp.js`.
- **Acting from first person** (agreed 24 October): movement as in Counter-Strike (W/S, A/D sideways, the mouse
  turns); an ability bar as in League of Legends (the owner's idea): F basic, Q, G, R ultimate, with cooldowns,
  by role (`App.combatRole`: warrior, mage, healer, tamer, brawler; `KITS` in firstperson.js); the cave monsters
  fight back (`App.hurt`; Shield Wall takes 60% off; a knock-out ends first person); T talks to the Tickle in
  front (`App.bumpRel`). A game controller (Gamepad API). Tests: `t_fp2.js`, `t_fp3.js`. Not yet: abilities
  against dragons, sea beasts and the Underworld's guardians (first person is not available inside), levels or
  choices of abilities.

## 5. Done in version 49 (published 24 October)

- **Every holder has its own place** (item 11): towns, plots, estates and fortresses by the number of Tickles, fixed
  plots that survive ownership changes, mansions by region, castles and palaces, warrens for overflow, Tickles
  walk round buildings, the "Read the owners from Ethereum now" button and `tools/update_owners.py`.
- **Riding** (item 12): stags, rams and boars, and tamed monsters big enough to carry their tamer.
- **The prison** (items 13 and 16) for Tickles up for sale, with `js/listings.js` and `tools/update_listings.py`.
- **The Parliament** (item 14) on the Maker's Isle: 333 seats by D'Hondt, daily votes on laws and the Director's
  proposals.
- **The Underworld** (item 15): 12 themed floors, a teleport gem beside every guardian.
- **The inspect window** (22 October): click anything for a small window about it, kept up to date.
- **Notifications** (23 October): Menu > Settings switches the activity notifications off (the answers to what you
  do still show); a click on a notification takes it away.
- **The view pulls back into the sky** (23 October): zoom out to 2,600 blocks with the whole map in sight
  (`js/farview.js`: a heightfield of the whole map, coarse copies and stand-ins of the buildings and trees; the
  depth range and the water follow the camera).

## 6. Earlier versions (summary)

- **v48 (weather by zones)**: one weather field carried by the wind over the map: fronts of cloud, rain and storm
  (rain in one region, sun in the next); lightning, fog on damp mornings; Tickles shelter from storms; tornadoes
  (about one every 10 days) and very rare tsunamis; the weather card in Adventure.
- **v47 (sound)**: frogs croak in turns; songbirds in the trees near the view (finch, warbler, robin, thrush, dove;
  owls at night); Menu > Sound with music, ambience and effects apart.
- **v46 (fixes)**: the statue's plaque without initials (P.M. only in the stories); Tickles lie properly in bed; no
  waves in the channels; jetties anchored to the shore; the hand picks up horses, griffins and sea beasts too.
- **v45 (wealth you can see)**: the Blacksmiths' Guild in every region (forge, paddock, griffin roost); better houses
  (townhouse, manor); boats of one's own; mounts (pony, saddle horse, white charger, griffin); finer weapons and
  steel shields; arms that wear and can break; Tickles buy what they want most; the Wealth card.
- **v44 (sea beasts)**: the Lake Serpent and the Kraken rise some afternoons by a dock or a beach; the armed, the
  mages and the tamers fight them.
- **v43 (the open sea)**: the lake, channels and ponds calm; waves break on the beaches of the open sea.
- **v42 (arms)**: one-handed lifting; the other paw keeps what it holds; a sword arm and a shield arm.
- **v41 (tamed monsters)**: tamers win monsters of their own (never a guardian) in the Underworld and the mines.
- **v40 (rock walls)**: mine and dungeon walls of rounded rocks like the on-chain boulder.
- **v39 (fishing from the jetty)**: no more crowds waiting for the four boats of a dock.
- **v38 (first person, first version)**: "First person" on any Tickle's card (V); walk your own Tickle yourself.
- **v37 (diving)**: 18 dive sites with a float and a diver's flag (wrecks, reefs, oyster beds, the drowned temples);
  water lovers dive in their free time; the Diving card.
- **v36 (contests of everything)**: a contest a day in every region (fishing derby, surf, regatta, foot race, kart
  grand prix, strongest Tickle, fashion show, song contest), judges, a podium, entries from the Adventure tab.
- **v35 (slot machines you can play)**: three reels, one line, pay table; one guest in four prefers the machines.
- **v32 to v34 (the casino to scale)**: casino rooms, 52 slot machines, the bar with its barmen and waiters (never
  the player's Tickles as staff), tables at true size with cards and chips.
- **v31 (casino and statue)**: the creator's name out of the lore (only "P.M."); casinos in all six regions with
  real poker, blackjack, roulette and bingo; a nightly poker tournament.
- **v29 to v30 (things in the paws and boats)**: what the paws hold is put away for two-handed work; the village
  lends rods, boards, weights, balls and skates; surfing on the waves; ferrymen and passengers aboard.
- **v28 (fights and guilds)**: fights you can watch; mages, healers and warriors; six guilds with halls and ranks;
  mines with levels, guards, carts and goblin thieves; guardians' special attacks with warnings on the ground.
- **v22 to v27 (dungeons and the world)**: free music by place, with credits; camera turning; richer interiors;
  hunting animals; frogs and creatures you can pick up and throw; maze dungeons with monsters; a bigger arena; the
  Great Underworld under the whole map with a guardian per floor, treasures, Ether crystals and relics; the Golden
  Tickle at the bottom under the statue.

---

## Rules the owner has set (keep to them)

- Do not widen what was asked without asking; finish one item before starting the next, in this order.
- The creator's name is not used in the game: the Maker is known only by his initials, P.M., in the
  stories (no letters on the statue).
- The player's own Tickles are never staff of anything; only the player directs them.
- No animal in the world is one of the nine Tickle species.
- New scenery is always appended at the end of world generation (saved state is keyed by scenery index).
- Keep this file and `CHECKLIST.md` up to date after every item.
