# Tickle Beach World — what is pending

Updated 24 October 2026 (end of the day). This repository (`main`) holds version 50, published as the game
(https://claude.ai/artifact/Y2NNeAnZA2GCzhpAS2qC6b) once the owner approved it; see section 4. Items are worked in the order agreed with the project owner;
one item is finished before the next one starts. The browser test scripts and what each one checks are in
[tests/README.md](tests/README.md).

---

## 1. Next, in order

Done on 24 October and published as the game (version 50): 1.0, 1.1 (first person), 1.2 (more detail), 1.2b (doors),
1.2c (diving), 1.4 (the menu); see section 4. The owner has not tested yet: `REVISAR.md` is the checklist for when
they do. Next, in this order:

1. ~~1.3 The encyclopedia~~: done 28 October (see below).
2. **1.5 Wars between holders**: agree how they work with the owner first.
3. **1.6 Editing homes and a better build mode**: every home inside and out (houses, mansions, castles...), and the
   build mode with removing and a catalogue of objects to place; agree the details with the owner first.
4. **1.6b Oxygen tanks**: decided with the owner; confirm first whether a tank refills at the surface or only at
   a shop or the dock.
5. **1.7 The smaller things left over from version 50**: ask the owner before widening any of them.

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

### 1.7 Left over from version 50 (smaller; ask the owner before widening any of them)

- More detail: colour variation inside the models (a leafy tree is one green), the water surface, the interiors.
- The far walking figures (pawns) follow straight lines between plan points and can cross buildings. Done 29 October: a far figure whose
  point falls inside a building is drawn just outside it, so it goes round the walls (population.js `updatePawns`).
- First-person abilities against dragons, sea beasts and the Underworld's guardians (first person is not available
  inside); ability levels or choices.
- Under the sea: things for your own Tickle to find or catch (pearls, shells), sea creatures in the sea caves, the
  sea floor seen from above through the water (the surface is nearly opaque from above).

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
  `REVISAR.md`.)
- **Breath under water**: decided (24 October): 1 minute 30 seconds without a tank, 10 more minutes with one (item
  1.6b). Still to confirm: whether the tank refills at the surface or only at a shop or the dock.
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

---

## Rules the owner has set (keep to them)

- Do not widen what was asked without asking; finish one item before starting the next, in this order.
- The creator's name is not used in the game: the Maker is known only by his initials, P.M., in the
  stories (no letters on the statue).
- The player's own Tickles are never staff of anything; only the player directs them.
- No animal in the world is one of the nine Tickle species.
- New scenery is always appended at the end of world generation (saved state is keyed by scenery index).
- Keep the project log (`ESTADO_Y_PENDIENTES.md`, in Spanish) up to date after every item.
