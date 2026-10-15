# Tickle Beach World — what is pending

Updated 15 October 2026. Published build: version 48 (private claude.ai artifact). This repository is ahead
of it with the unpublished work of item 11. Items are listed in the order agreed with the project owner;
one item is finished before the next one starts.

---

## 1. In progress — item 11: every holder has its own place (version 49)

**Asked for**: instead of villages by species, every holder gets a place where all of its Tickles live; the
more Tickles, the bigger the place (a mansion that grows with each Tickle and, past a certain number, an
estate or village of its own); it must **update when ownership changes**; it needs a generator of houses and
mansions.

**Decided with the owner (15 October 2026)**:
- Clans are now the holders: alliances, rivalries and raids happen between holders' places; the species is
  only a trait.
- Places are spread evenly over the six regions.
- Small holders (1 to 4 Tickles) each get a house for their household in towns shared with other small
  holders.
- "From 20" Tickles: an estate. Read as: 5 to 19 Tickles, a mansion that grows with their number; 20 or
  more, an estate with the holder's manor and a house for each Tickle. *(To be confirmed with the owner.)*

**Done (in this repository, not published)**:
- Generation by holder from the ownership snapshot: 93 estates, 254 mansions and 60 towns (407 places),
  about 1,605 Tickles and 67 to 69 places per region, no overlaps.
- Estates: manor 1.6 times normal size in the middle and a house per Tickle; mansions scaled +3.5 % per
  Tickle over five, with a dormitory holding a bed for each (up to 19); town houses per household (a
  two-storey townhouse for three or four).
- Clans = places (colours, names, allies, rivals, food shared between allies, raids), interiors with a bed
  for every member, Holders tab with "Your place" and a button to fly to every big holder's place, saved
  games migrated (each Tickle keeps everything it owns and has done; what belonged to the old villages is
  reset).
- Tested: generation, views of an estate, a mansion and a town, one simulated day without errors.

**To do — the owner's requirements of 15 October**:

1. **The layout must update smoothly, because ownership changes often.** Design under way (patch drafted,
   not yet applied to `js/geo.js`):
   - **Fixed plots** that never depend on ownership, placed once per region: 18 estate plots with set
     capacities (400, 170, 120, 90, 70, 60, 50, 44, 38, 34, 30, 28, 26, 24, 24, 22, 22, 22 Tickles),
     48 mansion plots and 13 town plots (36 Tickles each). Terrain, roads, fields and farms are laid out for
     every plot, lived on or not, so nothing else in the world moves when ownership changes.
   - **Who lives on each plot** is worked out from the snapshot and **remembered in the save**: when
     ownership changes, every holder who still fits keeps its plot (an estate keeps its plot up to 1.4 times
     the plot's capacity; a town keeps its households); only those who grew or shrank past a threshold
     move; newcomers take a free plot in the region with the fewest Tickles; empty plots go back up for sale
     (a "for sale" sign, nothing else on them).
   - Houses are generated **last** (after every fixed piece of scenery), each household in a **stable
     slot**, so the index of every fixed piece never changes and saved state stays valid.
   - Places are renumbered over the occupied plots only; the save stores the plot of every place and every
     house, and on loading after an ownership change it **carries each place's data over by plot** (food,
     relations, guardians beaten, depth reached, ruins, moved pieces, house upgrades), dropping only what
     belonged to holders who left and short-lived events in progress (raids, parties, hunts, contests).
2. **Room for everyone, however many holders there are** — even underground or under water. Planned:
   - When the surface plots of a kind are full, a holder gets an **underground warren**: a cave mouth on a
     hillside (with its small square: fire, logs, granary, altar) and, inside, a cavern with a bed for every
     resident, sized to their number. There is no limit to how many warrens can be dug; in the coastal
     regions they can be sea grottos.
   - When a surface plot frees up, the first holder waiting in a warren moves up to it.
   - Every holder always has a defined amount of room: an estate plot by capacity, a mansion plot, a house in
     a town, or a warren sized to its Tickles.
3. **Restore what the holder layout squeezed out**: two of the twelve dungeon caves and four of the twelve
   Ether fields currently find no room (10 and 8 are placed); the fixed plan must leave space for all of
   them.
4. **Refreshing the ownership snapshot**:
   - `tools/update_owners.py`: read `ownerOf()` for all 9,629 tokens from a public Ethereum RPC in batches
     (contract `0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce`, selector `0x6352211e`) and rewrite
     `js/owners.js` with the block number and date.
   - An in-game "Update owners" button that reads the same data from a public RPC and keeps it in the
     browser (with a clear message where the page is not allowed to reach the network, as in the artifact).
5. **Checks before publishing version 49**: inside a mansion and a shared house, the migration of a real
   saved game, a changed snapshot keeping most holders on their plots, a day simulated without errors; then
   publish, update `ESTADO_Y_PENDIENTES.md`, and confirm the thresholds (1–4 / 5–19 / 20+) with the owner.

## 2. Next — item 12: ride more animals

Besides horses and griffins, Tickles should be able to ride **deer, sheep, boars and the dungeon monsters
they have tamed** (asked 15 October 2026).

## 3. Open question

- **Waves in the rivers and the lake** (item 8b): the waves at the mouths of the channels were removed (the
  "open sea" no longer includes the channels between regions), and the lake and ponds are calm. If the owner
  meant something else — for example the dark stripes of the stepped riverbed seen through the water — it is
  still to be changed.

## 4. Half-done or to confirm

- **Credits**: Menu → Credits still names the author of the Tickle Beach collection (a real-world credit,
  not lore). Asked whether to remove it; no answer yet.
- **Casinos, not fully checked**: entering one of your own Tickles in the poker tournament from start to
  finish (the Tickles' own tournaments were tested to the end); the cards on the six-seat cash poker tables
  (empty when measured; they use the same system as the tournament tables, which were measured); seeing the
  waiters cross the room with guests inside; the bingo hall after it was enlarged.
- **A meticulous review of the whole game "as a game designer"** (standing request): done alongside
  everything else, never closed.
- **Creature tournament fights** may resolve too fast to be watched comfortably.

## 5. After this list

The owner has a separate list of new requests to hand over once this one is finished.

---

## Rules the owner has set (keep to them)

- Do not widen what was asked without asking; finish one item before starting the next, in this order.
- The creator's name is not used in the game: the Maker is known only by his initials, P.M., in the
  stories (no letters on the statue).
- The player's own Tickles are never staff of anything; only the player directs them.
- No animal in the world is one of the nine Tickle species.
- New scenery is always appended at the end of world generation (saved state is keyed by scenery index).
- Keep the project log (`ESTADO_Y_PENDIENTES.md`, in Spanish) up to date after every item.
