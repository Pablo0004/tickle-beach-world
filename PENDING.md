# Tickle Beach World — what is pending

Updated 24 October 2026 (end of the day). This repository (`main`) holds version 50, published as the game
(https://claude.ai/artifact/Y2NNeAnZA2GCzhpAS2qC6b) once the owner approved it; see section 4. Items are worked in the order agreed with the project owner;
one item is finished before the next one starts. The browser test scripts and what each one checks are in
[tests/README.md](tests/README.md).

---

## 1. Next, in order

Done on 24 October and published as the game (version 50): 1.0, 1.1 (first person), 1.2 (more detail), 1.2b (doors),
1.2c (diving), 1.4 (the menu); see section 4. The owner has not tested yet: `REVISAR.md` is the checklist for when
they do. Next, in this order: **1.3 the encyclopedia** (a section of the menu), then 1.5 wars between holders (to
agree with the owner first), then 1.6, then the smaller things left over in 1.7.

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

### 1.6 Later

- Mansions editable inside and out (asked 16 October, for later).

### 1.7 Left over from version 50 (smaller; ask the owner before widening any of them)

- More detail: colour variation inside the models (a leafy tree is one green), the water surface, the interiors.
- The far walking figures (pawns) follow straight lines between plan points and can cross buildings.
- First-person abilities against dragons, sea beasts and the Underworld's guardians (first person is not available
  inside); ability levels or choices.
- Under the sea: things for your own Tickle to find or catch (pearls, shells), sea creatures in the sea caves, the
  sea floor seen from above through the water (the surface is nearly opaque from above).

## 2. Open questions

- **The menu and the clock**: the world keeps running while the menu is open; should it pause? (Asked in
  `REVISAR.md`.)
- **Breath under water**: 45 seconds; right or not? (Asked in `REVISAR.md`.)
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
