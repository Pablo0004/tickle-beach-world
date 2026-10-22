# Tickle Beach World — what is pending

## Status, 22 October 2026 (evening)

Items 11 to 16 are done and tested in this working copy (layout tag `plots-3`), not yet published as version 49:
a preview is at https://claude.ai/artifact/TK966ZfpzsFS9aPPxwJNo6 (the published game is still version 48).
- **11** places by holder: tested castles by size, wall guards, the "Read the owners from Ethereum now" button
  (mocked node), interiors; fixed town households shifting when a neighbour changed size, broken floor tiles in
  non-integer rooms (giant planes in the tower dormitories), the citadel failing the kit check, a shelf over a bed,
  clouds hiding the view.
- **12** riding: deer, sheep (rams) and boars (by way of life, or bought at the paddock: 18/30/45 shells), and tamed
  monsters big enough to carry their tamer (werewolf, centaur, golem, troll, ogre, minotaur, manticore, cerberus,
  basilisk, salamander, spider). `App.MOUNT_MONSTERS` (creatures.js), `BEASTS` (wealth.js).
- **13/16** the prison (js/prison.js): Saltrock Penitentiary in the Waterfall; listed Tickles live there (cell,
  canteen, rock breaking in the yard). Listings: js/listings.js, refreshed by tools/update_listings.py with the
  owner's OpenSea key (env `OPENSEA_API_KEY`), or typed in the Holders tab. On-chain sale pools not detected.
- **14** the Parliament (js/parliament.js) on the Maker's Isle (isle radius 16 -> 50, kept clear of other
  buildings via `placeDist` in geo.js): 333 seats by D'Hondt, ministers vote in blocs, daily sitting 16:00, vote
  17:30 on a law (or repeal) and up to two Director proposals (decided as in Review). Laws: prizes, bounty, watch,
  market, restday, tax (`App.lawMul`, `App.lawOn`, `App.restDay`).
- **15** the Underworld: 12 floors (the hardest of the old 36, `App.UNDER_OLD`), themed (warrens, catacombs, sunlit
  grotto with water, forest maze, ice caverns, volcanic with lava, abyss, heart); a teleport gem (`warpgem` kit)
  beside every guardian.
- Casino leftovers checked: own Tickle through a whole tournament, 6-seat poker cards, waiters, bingo hall.

Still to do: publish version 49 once the owner approves the preview; push this work to GitHub (the cloud session
had no GitHub access); mansions editable inside and out (later, as asked); the open questions below.

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
- Sizes (replaced on 16 and 22 October 2026): 1–4 a house in a town; 5–9 two medium houses in a town; 10–19 four
  medium houses on a small plot of their own; 20+ one mansion for every 20 Tickles, bigger than four medium houses
  together, in the style of its region; more than eight mansions' worth (180+) a fortress with walls round the plot
  and one great castle or palace for all of them. Mansions to be editable inside and out later.
- Ownership changes often: the layout must update smoothly, and there must always be room for everyone (underground
  or under water if the surface is full).

**Done and tested locally (22 October 2026), not yet published** (layout tag `plots-2`):
- Fixed plots and an assignment remembered in the save; a simulated ownership change kept 248 of 249 places on
  their plots, moved the holder who changed size with its granary, and gave the newcomer a free plot.
- The owner's sizes: 1–4 a house in a town; 5–9 two medium houses in a town; 10–19 four medium houses on a small
  plot; 20+ an estate with a mansion for every 20; 180+ a fortress with walls, towers and gates and a great castle
  or palace for all (throne hall, a 48-bed dormitory per tower, treasury).
- Mansions in one style per region (log lodge, country house, stone keep, captain's house, white villa, tropical
  villa). Castles and first mansions are placed away from the roads.
- Warrens for overflow (not needed with today's snapshot), the "for sale" sign, place cards and interiors.
- All 12 dungeon caves and 12 Ether fields fit again; two days simulated without errors.
- A newer ownership snapshot can be stored in the browser (`App.setOwners` / `App.ownersInfo` / `App.clearOwners`).

**Still to do for item 11**:
1. The in-game "Update owners" button (reading `ownerOf()` from a public RPC where the page may reach the network)
   and `tools/update_owners.py` to rebuild `js/owners.js`.
2. Mansions editable inside and out (later, as the owner asked).
3. Push to GitHub and publish version 49.

Fixed on 22 October: **Tickles no longer walk through buildings**. Houses, halls, granaries, mansions, castles,
the fortress walls, guild halls, casinos and the like are obstacles they walk round (a footprint from each model's
box, turned with it; a gatehouse leaves its arch open; fences, pens, docks, piers, arenas, caves and mines are
walked into as before); the path-finder goes round them and finds a fortress's gate. In a test, about 0.2% of
thousands of positions fell inside a building, all of them passing moments. Distant figures still walk straight.

## 2. Next — item 12: ride more animals

Besides horses and griffins, Tickles should be able to ride **deer, sheep, boars and the dungeon monsters
they have tamed** (asked 15 October 2026).

## 3. Then — item 13: a prison for the Tickles put up for sale

Asked for on 16 October 2026; decided with the owner:
- **One prison, underground**: a penitentiary with its entrance on the surface and the cells below.
- **While a Tickle is listed for sale it lives in the prison**: it leaves its holder's place, sleeps in a cell, goes
  out to the yard and does prison work. If it is sold it walks free and moves in with its new holder; if the
  listing is withdrawn it goes home.
- Listings live on the marketplaces (OpenSea and the like), not on the chain, so a script has to take a snapshot
  of them the way `owners.js` does for ownership. OpenSea's API needs a (free) API key that the owner gets and
  keeps on their own machine.

## 3b. Then — item 14: a great Parliament instead of the town halls

Asked for on 16 October 2026:
- The town halls are replaced by one **huge parliament**.
- **Tickle ministers are elected according to how many Tickles each holder has** (more Tickles, more seats).
- The parliament **approves or rejects changes of every kind to the game**: the game's way of showing democracy
  when everything is put to the vote.
- To decide with the owner when it starts: one parliament for the whole map or more, and where; how many seats
  and which of a holder's Tickles sit; who proposes changes and how what is approved is applied; what happens to
  what the town halls did (notice board, ore treasury, shelter for those who lost their house).

## 3c. Then — item 15: the dungeon's save points and floors of their own kind

Dictated on 16 October 2026:
- **Save points** shown as **great teleport gems**, placed **beside each floor's boss**.
- The **same dungeon rocks used in different ways**: floors that look like **ice**, **volcanic** floors, floors that
  seem **part of the surface, with natural light and water**, and **a floor that is a great labyrinthine forest**.
- **Cut the Underworld to 12 floors**, keeping the hardest.

## 3d. Item 16: checking on the chain who owns each Tickle and which are for sale

- Ownership is read from the chain with `ownerOf()` (a script that rebuilds `js/owners.js`, and an in-game button).
- Listings: most (OpenSea, Blur...) live on the marketplaces, not on the chain; only Tickles placed in automatic
  sale contracts (Sudoswap-style pools) show on the chain, because that contract becomes their owner. The rest need
  the marketplace's API (with the owner's own key).

## 4. Open question

- **Waves in the rivers and the lake** (item 8b): the waves at the mouths of the channels were removed (the
  "open sea" no longer includes the channels between regions), and the lake and ponds are calm. If the owner
  meant something else — for example the dark stripes of the stepped riverbed seen through the water — it is
  still to be changed.

## 5. Half-done or to confirm

- **Credits**: Menu → Credits still names the author of the Tickle Beach collection (a real-world credit,
  not lore). Asked whether to remove it; no answer yet.
- **Casinos, not fully checked**: entering one of your own Tickles in the poker tournament from start to
  finish (the Tickles' own tournaments were tested to the end); the cards on the six-seat cash poker tables
  (empty when measured; they use the same system as the tournament tables, which were measured); seeing the
  waiters cross the room with guests inside; the bingo hall after it was enlarged.
- **A meticulous review of the whole game "as a game designer"** (standing request): done alongside
  everything else, never closed.
- **Creature tournament fights** may resolve too fast to be watched comfortably.

## 6. After this list

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
