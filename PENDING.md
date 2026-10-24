# Tickle Beach World — what is pending

Updated 24 October 2026. This repository (`main`) holds version 50: version 49 (published as the game on 24
October, https://claude.ai/artifact/Y2NNeAnZA2GCzhpAS2qC6b) plus first person while controlling a Tickle (item
1.1, done and tested, in a separate preview until the owner approves it,
https://claude.ai/artifact/Q5L8KVvvTrdNaJfVrHzSA2; see section 4). Items are worked in the order agreed with the project owner;
one item is finished before the next one starts. The browser test scripts and what each one checks are in
[tests/README.md](tests/README.md).

---

## 1. Next, in order

### 1.2 More detail in every model and texture (asked 22 October)

"Go through every texture of the game and give all of them a higher level of detail; the cubes may need to be
smaller, if possible; I want the details of a professional game." **The owner insists (24 October): everything
stays made of cubes** — smaller cubes and pixel-style textures per block face, never smooth models; the
reference is the Tickles themselves, which are cubes with a good level of detail: bring the rest of the models
to about their cube size. Notes for the work:
- Kit models (`TB.KIT[kind].voxel = [near, far]`, SDF units, `App.S` = 1/160 world unit) are meshed at load in
  two levels (`App.frag`, `App.fragLo`, `loadFragments` in population.js); the far view (farview.js) adds coarse
  copies and stand-ins. Smaller cubes means smaller `voxel` values: about 8 times the voxels when halved, more
  meshing time at load and more triangles. Measure first (the scene is about 1.6 million triangles at the usual
  distance, 2.4 to 2.8 million pulled back).
- A **graphics quality** setting in Menu > Settings (Normal / High / Ultra) choosing the cube size of the near
  models, the shadows and the textures, so slower machines keep the game fluid.
- **Terrain textures**: today every block face is a flat colour with ambient occlusion and a little jitter
  (world.js `meshChunk`). Add a small procedural texture per block (grass, sand grains, stone, path, farmland
  furrows, planks, logs, leaves), multiplied with the block colour (UVs in the chunk mesh, a texture atlas).
- **Shadows** from the sun (a shadow map round the middle of the view), a sky with a gradient, maybe ambient
  occlusion on the models.
- The Tickles themselves are the on-chain models at their own resolution and stay as they are.

### 1.2b Nothing walks through buildings; doors everywhere (asked 24 October)

"Tickles walk through many structures without using the doors, and many buildings such as some colosseums have no
doors; the walls have few gates too (there must be at least 4 round a wall); no animal or Tickle may go through
the buildings as if they did not exist." To do after 1.2:
- every building model with a footprint that blocks walking (`App.climbOK`, the walking rules in sim.js
  `walkTo`, the route finder `App.route`), so Tickles, animals, monsters and creatures go round it or in by its door;
- doors on every building that is entered or crossed: the arenas / colosseums (at least one gate, better four),
  and at least four gates round every town or fortress wall, on the roads;
- the routes go through the gates; a Tickle that is inside goes out by the door;
- check with a test that counts how many walkers end up inside a building footprint over a simulated day.

### 1.3 An encyclopedia (asked 22-23 October)

"An encyclopedia where weapons, monsters, animals... are recorded; every entry numbered, with all kinds of
specifications of each animal, monster or weapon." Inside the game menu (1.4). Entries, each numbered:
animals (farm, wild, lake, pond, birds), creatures and their types, monsters of the caves and the Underworld,
the 12 guardians, dragons, sea beasts, weapons, shields and their wear, spells, relics, mounts and riding beasts,
boats, ores and Ethernum, places, jobs, guilds, factions, laws, and the units of war (1.5). Each entry: its
model, number, what it is, where it lives or is found, health, attack, defence, speed, type and what it is
strong against, abilities, who can tame or ride or use it, price, what it drops or gives. Possibly "seen /
not seen yet" entries, unlocked as the player meets them.

### 1.4 A professional game menu (asked 23 October)

"Everything must go inside a menu that can be hidden or opened; include in the menu the panel on the right that
cannot be closed; leave it all like the menu of a professional game." The right-hand panel (tabs Tickles,
Holders, Director, Review, Adventure, Library) cannot be closed today; the Menu modal has How it works, Controls,
Sound, Settings and Credits. Plan: one menu that opens and closes (a button and a key), holding the panel's tabs,
the menu's sections, the Directory, the big map and the encyclopedia, with the look of a game menu; the world
full-screen when it is closed. The inspect window, the place cards and the notifications stay over the world.

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

## 2. Open questions

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

## 4. Done in version 50 (preview, not yet in the game)

- **More detail, always in cubes** (item 1.2, in progress): block textures on the terrain (`js/blocktex.js`: a
  16-pixel tile per block face, grey multipliers of the block colour, the grass side in colour; mipmapped,
  anisotropic); merged faces in the voxel mesher (`sdf.js meshVoxels`: faces in full light of one colour become
  rectangles; the scene went from 1.8 to 1.06 million triangles with the same look); Menu > Settings > Graphics
  (`js/gfx.js`: Normal / High / Ultra, kept in the browser): High and Ultra add a third, finer level of detail
  for the models near the camera (`App.fragX`, made in the workers the first time a model comes near: High 0.65 of
  the usual cube within 26 blocks, Ultra 0.5 within 40), the sun's shadows (a shadow map following the view,
  2048 or 4096, none at night) and a higher pixel ratio; all levels have a sky dome with a gradient (its colours
  from the day, night and weather background). Test: `t_tex.js` (`Q=`, `NOTEX=`). Still to look at: colour
  variation inside the models (a leafy tree is one green), the water, interiors.
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
