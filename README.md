# Tickle Beach World

An open-world life simulation that runs entirely in the browser, in which **all 9,629 Tickle Beach NFTs live
together**. Every Tickle is rebuilt in your browser from the 3D models stored on Ethereum, with the
contract's own seed formula — nothing is redrawn by hand or by AI. Each one has a home, a job that comes
from its on-chain items, a daily routine, friends, a purse of shells, a level, and a life that goes on
whether or not you are watching.

The project is meant as the base of a future online game in which every holder plays with their own
Tickles.

> **Status (23 October 2026).** Working prototype. The last published build (version 48) runs as a private
> claude.ai artifact. This repository holds version 49, finished and tested, waiting for the owner's approval
> to be published: every holder has its own place (towns, plots, estates, fortresses), riding beasts and tamed
> monsters, the prison for Tickles up for sale, the Parliament, a 12-floor Underworld, a window that describes
> anything you click, activity notifications you can switch off, and a view that pulls back into the sky. What
> is left to do is in [PENDING.md](PENDING.md).
>
> Unofficial fan project made from the collection's public on-chain data. Not affiliated with the Tickle
> Beach team.

---

## Contents

1. [Built from the chain](#1-built-from-the-chain)
2. [The world](#2-the-world)
3. [Every holder has its own place](#3-every-holder-has-its-own-place)
4. [A day in the life](#4-a-day-in-the-life)
5. [Clans, food, raids, shells and factions](#5-clans-food-raids-shells-and-factions)
6. [Dragons, fate and rebuilding](#6-dragons-fate-and-rebuilding)
7. [Creatures, arenas and boxing](#7-creatures-arenas-and-boxing)
8. [The Great Underworld](#8-the-great-underworld)
9. [Mines, ores and the guilds](#9-mines-ores-and-the-guilds)
10. [The Maker, Ethernum and the blessed](#10-the-maker-ethernum-and-the-blessed)
11. [The great lake and the open sea](#11-the-great-lake-and-the-open-sea)
12. [Contests](#12-contests)
13. [Casinos](#13-casinos)
14. [Wealth: the Blacksmiths' Guild, mounts, boats, houses and arms](#14-wealth-the-blacksmiths-guild-mounts-boats-houses-and-arms)
15. [Weather](#15-weather)
16. [Sound and music](#16-sound-and-music)
17. [Going inside](#17-going-inside)
18. [Playing: modes, holders, the hand and first person](#18-playing-modes-holders-the-hand-and-first-person)
19. [The Director (AI) and the Library](#19-the-director-ai-and-the-library)
20. [Controls](#20-controls)
21. [Technical overview](#21-technical-overview)
22. [Running it locally](#22-running-it-locally)
23. [Credits and data](#23-credits-and-data)

---

## 1. Built from the chain

- **Contract**: Tickle Beach (TCKL), ERC-721, Ethereum mainnet
  `0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce`; `htmlForToken()` / `tokenURI()` are served by the renderer
  `0x1D442C6d1F5b8101784B44aC26512B78042D1714`. Token ids 0 to 9,628.
- **Seed**: `seed(tokenId) = uint256(keccak256(abi.encodePacked(toString(tokenId), randomKey)))` with the
  public `randomKey = "i want to hold your hand"`. `js/keccak.js` implements keccak256 and the formula.
- **Models**: the collection's 58 models (1,139 strokes) are signed-distance-field strokes combined with CSG,
  in nine slots: body (9 species), floor (6 Locations), glasses (7), ground (10), hand (6), head top (7),
  neck (4), shirt (5) and shoes (4), coloured with the 13 on-chain themes. The data is copied verbatim from
  `htmlForToken()` into `js/data.js`.
- `js/tickle-core.js` is a faithful JavaScript port of the on-chain model decoder, the seed-to-traits picker,
  the part assembly and the theme colouring. `js/sdf.js` is a CPU port of the on-chain octree shader
  (`evalScene` + `sdfStroke`) with an adaptive octree voxelizer that reproduces the on-chain voxel look.
  Both run inside a Web Worker (`js/worker.js`) that turns strokes into meshes.
- The nine species: **Sabre** (monkey), **Tessy** (hippo), **Umka** (polar bear), **Urci** (brown bear),
  **String Cheese** (cow), **Roary** (bear with a mohawk), **Bellow** (bull), **Koda** (dog) and **Snort**
  (rabbit). By design, no animal in the world is one of these species.
- **Everything else** in the world is either cut out of the on-chain Location floors (palms, umbrellas,
  ducks, fish, waterfalls, piers, campfires, log seats, rocks, grass) or comes from a **kit** of 159 model
  kinds designed for the game in the same stroke format and palette (trees, houses, town halls, granaries,
  farm animals, crops, dragons, creatures, monsters, interiors, casino furniture, boats, horses...). Every
  kit model can be reviewed in the game and opened in the original on-chain viewer
  (`onchain-tickle.html`). Kit rule: every stroke layer must hold at least two strokes, because the on-chain
  shader skips a layer with a single stroke.
- **Ownership**: `js/owners.js` is an `ownerOf()` snapshot of every token, read from mainnet at block
  26,125,466 (5 October 2026): 1,569 wallets, plus 25 tokens that are burned or unowned.

## 2. The world

- **Six large regions**, one per on-chain Location, laid out as two rows of three around a central lake,
  split by narrow channels and joined by six bridges: **Camping** (floor 16), **Duck Pond** (11),
  **Waterfall** (14), **The Pier** (3), **Beach Sand** (1) and **The Palm** (4). The map spans
  2,960 × 2,080 blocks of land, with the open sea round it. Region borders wander naturally; each region
  has its own relief (Waterfall is hilly, Beach Sand flat) and vegetation (pine and leafy forests, palm
  groves, bushes: about 15,800 trees in all).
- **The great lake** in the middle, with the **Maker's Isle** at its centre (see 10), six docks (one per
  region), three ferry lines and six pilgrims' launches.
- **Places between the settlements** (295): beaches, piers (the on-chain pier, anchored to the bank and
  walkable), palm groves, duck ponds (some fed by a small waterfall), waterfall hills with their pool, camps
  and meadows. **556 roads** join every settlement to its neighbours, the bridges and the docks.
- **Per region**: a creature **arena** (sunk into the ground with three rows of stone seats), two **dungeon
  caves** into the Great Underworld, a **dragon lair** on the highest peak, a **mine**, two **Ether fields**,
  a **Guild Quarter** (six guild halls round a yard), a **casino**, a **Blacksmiths' Guild** (forge, horse
  paddock and griffin roost) and three **dive sites** (18 in all). With the new holder layout two caves and
  four Ether fields currently fail to find room (10 of 12 and 8 of 12 are placed); the fixed-plot layout in
  progress is meant to restore them (see PENDING.md).
- **Farmland**: every settlement has its fields of wheat or cabbage and a farm just outside: a fenced pig pen
  (mud, shed, trough), a hen yard with its hen house and a sheepfold, each with a gate facing the houses.
- **Detail around the camera**: terrain is made of blocks streamed in chunks around the view; Tickles near
  the camera are full 3D agents (up to 46 blocks away), further out they are small walking figures (up to
  210), and beyond that they keep living in a simplified simulation that follows the same plan.

## 3. Every holder has its own place

*(Version 49.)* All of a holder's Tickles live together, on a place that depends on how many it owns:

| Tickles | Where they live |
| --- | --- |
| 1 to 4 | a house for the household (a cottage, a round hut, or a two-storey townhouse for three or four) in a town shared with other small holders |
| 5 to 9 | two medium houses (two-storey townhouses) in such a town |
| 10 to 19 | four medium houses on a small plot of their own |
| 20 to 179 | an estate with one mansion for every 20 Tickles, in the style of its region |
| 180 or more | a fortress: walls round the plot, with round towers and a gate wherever a road comes in, and a great castle (Camping, Duck Pond, Waterfall) or a great palace (The Pier, Beach Sand, The Palm) where all of them live |

- **Mansions by region**: a log lodge in the Camping, a country house by the Duck Pond, a little stone keep at
  the Waterfall, a captain's house on the Pier, a white villa on Beach Sand and a tropical villa under the Palm,
  each with its roof, doors or awnings in the clan's colour. Inside: a great hall, a dormitory with a bed for
  every Tickle living there, and a strong room.
- **Castles and palaces**: a throne (or great) hall with long tables, a dormitory in every tower with 48 beds,
  and a treasury; the biggest holder's castle has eight tower dormitories for its 384 Tickles.
- **Plots that never move**: the land is laid out in plots that do not depend on ownership (in every region one
  fortress plot, 20 estate plots sized by how many mansions they hold, 22 small plots and 13 town plots), so the
  terrain, roads, fields and farms stay the same whoever owns what. Every place has its square with a big
  campfire and rings of log seats, a granary, a revival altar, fields and a farm; towns also have a town hall.
- **Ownership changes**: who lives on each plot is remembered in the save. When the snapshot changes, every holder
  who still fits keeps its plot, its households keep their slots, and only those who grew or shrank past a
  threshold move (taking their granary, friendships and record in the Underworld with them); newcomers take a
  free plot, and empty plots show a "for sale" sign. Tested with a simulated change: 248 of 249 places stayed put.
- **Room for everyone**: if the plots of a kind ever run out, a holder gets an underground warren (a grassy hill
  with a round door, and a cavern inside with a bed for each), with no limit to how many can be dug; the first
  one waiting moves up when a plot comes free.
- With the current snapshot: 4 fortresses, 89 estates (236 mansions in all), 95 small plots and 61 towns, about
  1,600 Tickles in each region; no warren is needed.
- **Every place is its own clan**, with its colour on the roofs (the species is just a trait). The Holders tab
  shows "Your place" and the place of every big holder, with a button that flies you there.
- **Reading the owners again**: the Holders tab has a button that reads `ownerOf()` for every Tickle from a public
  Ethereum node and keeps the result in the browser (`App.setOwners`); `tools/update_owners.py` rebuilds
  `js/owners.js` the same way. Saved games from before the plots keep everything each Tickle owns and has done and
  reset what belonged to the old villages.
- **The prison** (`js/prison.js`): Saltrock Penitentiary, in the Waterfall, mostly underground (a stone blockhouse
  over the stairs, in a walled yard with two watchtowers). While a Tickle is up for sale on a marketplace it lives
  there: a cell, the canteen, the yard, breaking rocks. Sold, it walks free and moves in with its new holder;
  withdrawn, it goes home. Listings come from `js/listings.js`, made by `tools/update_listings.py` with the owner's
  own OpenSea API key (kept on the owner's machine, environment variable `OPENSEA_API_KEY`), or from a list of token
  numbers typed in the Holders tab. Sales from on-chain pools (Sudoswap-style) are not detected yet.
- **The Parliament** (`js/parliament.js`), on the Maker's Isle (the isle is kept clear of other buildings): 333
  seats shared out among the holders by the D'Hondt method, each holder's ministers chosen from its Tickles. It sits
  every day at 16:00 and votes at 17:30 on one law (or the repeal of one in force) and on up to two of the
  Director's proposals, decided as in Review. The laws change the game: the Prize Act (contest prizes doubled), the
  Sea Bounty Act, the Night Watch Act, the Fair Market Act (mounts, beasts and boats a fifth cheaper), the Rest Day
  Act (every seventh day free) and the Shell Tax. The town halls stay as they were.

## 4. A day in the life

- **Time**: at normal speed one game minute passes per real second (a day lasts 24 real minutes); speeds
  are pause, 1x, 4x and 12x. The sky, the light and the music follow the hour.
- **Needs**: hunger, energy, social and fun drive what a Tickle chooses near the camera; its personality
  (appetite, laziness, sociability, playfulness) comes from its seed.
- **Jobs** come from the on-chain **Ground** item (the Fishing Rod makes a fisher, the 808 a DJ, the
  Skateboard a courier...) or else from the region: fisher, DJ, snack vendor, lifeguard, surf teacher,
  games host, treasure hunter, coach, courier, ranger, duck keeper, climbing guide, dockhand, beachcomber and
  coconut farmer. Each job has its places (piers, beaches, ponds, the square, meadows, camps, waterfalls,
  other villages).
- **The daily plan**: breakfast at home, work, lunch, an afternoon of chores for the village, free time,
  dinner round the fire on the square, then home to sleep in its own bed. The plan is deterministic, so the
  same day is lived the same way on screen and off screen.
- **Afternoon chores** fill the granary: farming the fields, hunting deer and boar, keeping pigs, leading the
  sheep out to graze (shepherds), collecting eggs, gathering fruit, fishing. Builders rebuild ruined houses.
- **Personal items**: a Tickle's on-chain Ground item (rod, surfboard, beachball, 808, cooler, chair,
  workout weights, treasure, skateboard, skates) lives in its inventory and only comes out while it is used;
  others can join in with some of them, and skaters ride theirs on long trips. The village lends rods,
  boards, weights, balls and skates to whoever has none. Paw items (Chips, Snacks, Games, Towel, Tube, Wake
  Board) are put away when both paws are needed, and bulky ones are carried at the side.
- **Buildings are in the way**: Tickles walk round houses, halls, mansions, castles, walls and the other
  buildings rather than through them, and in through a fortress's gates; the path-finder plans the way round.
- **Arms move as they should**: lifting a weight or a sword uses one arm and the other paw keeps what it
  holds; both arms only for a shield and a weapon, rowing, dancing, the ball, digging, driving a kart,
  casting spells or celebrating on a podium.
- **Free time** goes to friends, the beach, the ponds, surfing, diving, the casino, the guild halls,
  shopping at the Blacksmiths' Guild, sailing, pilgrimages, crossing the lake by ferry...

## 5. Clans, food, raids, shells and factions

- **Food**: each place's granary rises with its chores (fields, game, fruit and fishing near it make a
  difference) and falls at three meals a day. A hungry place sends everyone out to work.
- **Clans** become allies or rivals through what happens between them (raids, dragons fought side by side).
  Allies send food to each other; a place whose granary runs low may **raid** a richer rival at night.
  Fights end in a knock-out: the Tickle goes home to recover.
- **Shells** are the money: a wage for work, a little spent every day, bets, fees, trade and loot.
- **Six factions** cross the clans: the **Adventurers' Guild** (dungeons and dragon hunts: a beaten dragon
  hides for three days), the **Trainers' League** (coach other tamers' creatures for a fee), **The Lucky
  Shells** (gamblers at tournaments, boxing and the casinos), the **Night Watch** (patrols at night), the
  **Black Sails** (outlaws who steal from purses and set fires at night) and the **Merchants** (carry food
  from places with plenty to hungry ones, for shells).

## 6. Dragons, fate and rebuilding

- **One dragon per region** sleeps on its highest peak. Tickles respect its ground: nobody spends free time
  there and anyone passing tiptoes. Twice a day most dragons fly a patrol and Tickles underneath duck. Some
  evenings a dragon comes down to burn fields and steal food; if its sleep is broken (Tickles lingering,
  something dropped on its peak, a failed hunt) it wakes in a rage and attacks the place it blames.
- **Only the armed fight** (Guild sword and steel shield, Watch spear and wooden shield, the militia) and
  the **tamers**, who send their creature in; everyone else hides at home. Health bars show over the dragon
  and every fighter.
- **A dragon dropped by the hand** among the Tickles fights where it lands, to the end. It can die: its lair
  stays empty for five days until a young dragon moves in, and whoever struck the final blow is remembered
  as a dragon slayer. A dragon dropped on another's lair starts a dragon duel.
- **Fate**: dragon fire and claws, monsters and, now and then, a raid can kill a Tickle — for a while. Its
  spirit waits by its place's altar until the villagers gather at night for a **revival ritual** (a prayer
  to the Maker that costs food from the granary).
- **Ruins**: dragon fire, a tornado, a tsunami, lightning or the hand can bring a house down. The residents
  sleep in the town hall while builders put it back up, from ruins to scaffolding to house. Thrown trees and
  loose pieces break and grow back later.

## 7. Creatures, arenas and boxing

- **Seven fantasy creatures** live wild in their habitats: Griffin, Cinderling, Bubblefin, Mossling,
  Pebblit, Zapbug and the night-flying Lumoth, each with a type that beats some and loses to others. Wild
  griffins, cinderlings and zapbugs hunt deer and boar.
- **Tamers** go out to tame them, battle wild ones with their favourite, keep up to three and level them up.
  A tamer with Ethernum can have its creature cast a spell.
- **Tamed monsters**: tamers also win monsters for themselves (never a guardian): in the Underworld (goblins,
  kobolds, skeletons, mummies, spiders, basilisks, harpies, werewolves, centaurs, golems, salamanders, trolls,
  ogres, manticores, wraiths, hellhounds, minotaurs...), in the mines (goblins and spiders) and at the cave
  mouths (gloomslimes, shadebats, brutecaps). The newest follows its tamer around the map at companion size
  and fights in the tournaments.
- **Tournaments**: every evening the eight strongest tamers of each region fight a tournament at its arena
  (17:30 to 21:00, every match fought live). The Adventure tab shows results, the strongest creatures and a
  type guide.
- **Boxing**: drop two Tickles into an arena with the hand and it becomes a boxing ring (bell, jabs and
  hooks, a stamina bar each, the first one down is out). Creatures, monsters and farm animals can box too.

## 8. The Great Underworld

- Every dungeon cave leads down into **one great dungeon under the whole map, 12 floors deep** (version 49 kept
  the hardest 12 of the old 36). Each floor is a labyrinth as wide as the land above (tunnels under the channels
  join the regions), each kind with its own look: the **Goblin Warrens** (B1F), the **Catacombs** (B2F), the
  **Sunlit Grotto** (B3F-B4F, open to the sky, with daylight and pools of water), the **Forest Maze** (B5F-B6F,
  walls of trees and hedges), the **Ice Caverns** (B7F-B8F), the **Burning Deep** (B9F-B10F, with pools of lava),
  the **Abyss** (B11F) and, at the bottom, **the Heart of the Chain**. Walls are made of rounded rocks like the
  on-chain boulder; only what can be seen is drawn.
- **A guardian on every floor**, with the stairs down sealed behind an iron gate until it is beaten: the Goblin
  King, the Lich, Medusa the Gorgon, the Basilisk King, the Cyclops, the Titan Golem, the Frost Troll Warlord, the
  Chimera, the Fire Wyrm, the Hydra, the Lich King and, right beneath the Maker's Isle, **the Golden Tickle**, the
  strongest of all. Beside every guardian stands a **teleport gem**, the Underworld's save point: a party that has
  beaten that guardian comes back to the gem next time, and from it can go back up.
- **Guardians fight back** with special attacks (Ground Slam, Fire Breath, Venom Spray, Charge, Petrifying
  Gaze, Eye Beam, Lightning Storm, Screech, summoning their kind): the name shows over the guardian and the
  ground glows red where it will land; below a third of its health a guardian is enraged. Every monster
  fights back.
- **Parties**: some afternoons a place sends a party (adventurers and its best-armed): it starts at the
  floor of the last guardian its place has beaten and goes on, up to two floors, as far as its strength
  allows. About a quarter of adventurers are **mages** (Fireball, Frost Shard, Lightning, Arcane Missiles)
  and some are **healers** (Healing Light). Blows show their damage, everyone has a health bar.
- **What you watch is what happens**: each party's afternoon is planned in stages; a message with a Watch
  button appears when a party faces a guardian, and the result on screen is the result.
- **Treasure makes them stronger**: Ethernum (an adventurer can burn a crystal for +15 %), silver, gold,
  gems and orichalcum for the smith, shells, food and relics that each make their bearer stronger (at most six per Tickle). There are 18 relics in all: twelve from the Underworld (from the Lucky Goblin Charm to the Lich's Phylactery), the Heart of the Chain for the first to beat the Golden Tickle, three from the sea and two from the sea beasts. The game is
  **completable**: without relics and orichalcum a party gets stuck around B10F. The Golden Tickle can
  only be beaten by **at least two blessed Tickles** together: some afternoons the strongest blessed of any
  place go down as **the Maker's Chosen**.
- **Levels**: every Tickle has a level; monsters, raids and dragons give experience; a higher level hits
  harder, tames better and is knocked out less. The Adventure tab shows the deepest places, the guardians and
  who beat them first.

## 9. Mines, ores and the guilds

- **A mine in every region**, a timber portal sunk into a cutting with rails and a loaded cart. Each is rich
  in two of the lesser ores. Every shift digs it deeper, up to five levels, with more galleries and richer
  veins; inside are goblins, spiders and a rock troll, moving carts and miners at the rock face.
- **Ores and their uses**: stone (faster rebuilding), coal (feeds the forge), copper (tools: the place
  works faster), iron (weapons and shields, so more can fight a dragon), silver (silver-tipped weapons that
  monsters fear), gems (collars that make creatures stronger), gold (sold for shells and offered to the
  Maker) and, from the deep veins, **orichalcum**, the legendary metal of the **Orichalcum Blade** for the
  best fighter.
- **Six guilds**, each with a hall in every region's Guild Quarter: the **Adventurers'** (the parties), the
  **Warriors'** (two guards at every mine each afternoon, one at the door and one on its rounds inside;
  without guards the goblins raid the stores), the **Marauders'** (scouts who help parties find more and get
  further, and treasure hunters who dig up caches of Ethernum, gems and relics), the **Miners'**, the
  **Merchants'** and the **Mages'**. Deeds earn standing from Novice to Journeyman, Veteran, Master and
  Grandmaster; standing makes a fighter stronger and a miner luckier. Each hall has its board.

## 10. The Maker, Ethernum and the blessed

- The Tickles venerate the one who made them as **the Maker**. His name has been lost: only his initials,
  **P.M.**, survive in the stories they tell. A giant golden statue of a Tickle raising its arms stands on the
  **Maker's Isle** in the middle of the great lake (the Maker himself is never shown); the devout go there on
  pilgrimage on the launches from every dock.
- Prayers are answered in **Ethernum**, the crystals that power creature magic. Ethernum also grows in the
  **Ether fields** (purple on the map), lies in the dungeons and in dragon hoards, and comes up from the
  drowned temples.
- **The blessed**: the rarest Tickles are heroes blessed by the Maker, with a halo of their blessing's
  colour. Every Tickle of Matching Rank 8 carries the blessing of its colour (**Might**, **the Bulwark**,
  **Healing** or **Fortune**), and the 1/1s (the only one of their colour at rank 8, and the only Tickle at
  rank 0) carry the **Total Blessing**. 25 in all. They fight with the Maker's golden blade, and their
  blessings grow stronger when two or more go together.

## 11. The great lake and the open sea

- **Ferries**: three lines cross the lake between the north and south shores on a timetable (06:00 to 22:00,
  ten minutes at each dock); Tickles who spend their free time across the lake ride over and back. Every dock
  also runs a pilgrims' launch to the Maker's Isle. Boatmen stand at every helm.
- **Lake life**: cattails along the shore, lily pads (some in flower) with frogs hopping between them and
  croaking in bouts, herons striking at frogs and fish, swans in pairs, turtles that dive and bask, otters
  chasing koi, and weed swaying under the water. Pond ducks paddle and waddle onto the bank (and swim over to
  anyone feeding them); the on-chain fish swims in its own colours and the collection's themes and jumps now
  and then.
- **Fishing**: every fisher has a spot of its own on the jetty or along the bank; on some days the fishers
  of the shore villages row out in the dock's rowing boats and bring their catch to the granary.
- **The open sea** round the land has the waves: breakers roll in on its beaches, and **surfers** paddle out
  lying on their board, wait for a wave and ride it in. The lake, the channels and the ponds are calm.
- **Diving**: 18 dive sites marked by a float with a red diver's flag (in every region one in the great lake
  and two at sea): a sunken ship, a coral reef, a bed of oysters, or the drowned ruins of a temple of the
  Maker. Those who love the water (a float in their paws, a surfboard, lifeguards, beachcombers, treasure
  hunters, the Marauders) dive in their free time and come up with shells, coral, pearls (now and then a
  black one), old coins, now and then a sea chest, Ethernum from the ruins and, very rarely, a relic of the
  sea (the Mermaid's Comb, the Drowned Bell, the Pearl of the Deep). You can send your own Tickles diving.
- **Sea beasts**: the **Lake Serpent** in the great lake and the **Kraken** at sea rise now and then by a
  dock or a beach in the afternoon, smash the rowing boats in reach and spit at whoever is by the water (a red
  warning marks the ground first). The armed Tickles, mages and tamers of the places round about run down to
  fight. Beaten, the beast sinks and its hoard is shared (30 shells, 2 Ethernum and experience each; the last
  blow wins a relic (the Lake Serpent's Scale or the Kraken's Beak) and 70 shells more); otherwise it goes back
  down and the dock's boats lie on the bottom until morning.

## 12. Contests

Every region holds a contest every day, a different one each day, so in eight days it has had them all:

| Contest | Where | How it is won |
| --- | --- | --- |
| Fishing Derby | the bank by the region's dock | heaviest catch in an hour and a half; the fish go to the granaries |
| Surf Contest | a beach of the open sea | judges score every wave; the best two count |
| Regatta | sailing dinghies round buoys | first round the course |
| Foot Race | a circuit marked with cones, with a start/finish arch | laps |
| Kart Grand Prix | the same circuit | laps |
| Strongest Tickle | the square | a one-paw dumbbell press (a Tickle's arms are too short for a barbell) |
| Fashion Show | a catwalk on the square | judges score the looks; the models keep their new clothes and the winning look becomes the region's fashion |
| Song Contest | a stage on the square | the winning song becomes the tune of every village in the region |

The best of the region compete, three judges score the shows, the neighbours watch, and the top three climb
the podium for 40, 20 and 10 shells. A scoreboard shows the standings while you watch. Results are worked
out in advance, so what happens on screen and off screen agrees. Holders can enter their own Tickles from
the Adventure tab before a contest starts; a Tickle's card shows its medals, today's contest and its outfit
(with a button to go back to its on-chain clothes).

## 13. Casinos

One casino per region near its arena, open every night from 19:00 to 23:30, with real games played for
shells:

- **Texas Hold'em poker**, fixed limit (blinds 1/2, bets of 2 then 4), up to six at a cash table: shuffled
  decks, proper hand ranking and side pots, a small rake. A **nightly tournament** at 20:30 on three 9-seat
  tables (buy-in 10 shells for 80 chips, blinds up every 8 minutes, tables merged as players drop out, prizes
  50/30/20 %).
- **Blackjack**: four decks, the dealer stands on 17, blackjack pays 3 to 2, double down on two cards.
- **European roulette** (one zero): straight up 35 to 1, dozens and columns 2 to 1, even chances 1 to 1.
- **90-ball bingo**: tickets of 3 rows of 5 numbers, a prize for the first line and a bigger one for bingo.
- **Slot hall**: 52 machines in rows; three reels and one line (🍒 5, 🍋 8, 🔔 12, 🐚 20, ⭐ 40, 7 120 and
  👑 800 times the bet; two 🍒 pay 3; any other pair 2; a 🍒 on the first reel returns the bet), about
  91.5 % return.
- **Cocktail bar** with bartenders and waiters carrying trays through the aisles. Staff (dealers, bartenders,
  waiters) are Tickles of the two nearest places and are paid a wage; **the player's own Tickles are never
  staff**.
- Everything is to Tickle scale (tables, chairs, machines), with cards and chips placed by measuring the felt.
- To play, choose your wallet in the Holders tab and sit one of your Tickles down: it plays with its own
  shells. Stakes on the tables when the game is saved are refunded on the next load.

## 14. Wealth: the Blacksmiths' Guild, mounts, boats, houses and arms

- Every region has a **Blacksmiths' Guild** near its Guild Quarter: a forge where two smiths hammer all day
  (sparks, smoke, the sound of the anvil), a **paddock** of horses for sale with its groom, and a **roost**
  with a griffin.
- Tickles with shells to spare go shopping in their free time and buy what they want most (fighters want
  arms first, travellers a mount, those who live by a dock a boat, everyone a better house). A trade-in pays
  half of what they had. Some families were rich from the start. The player's Tickles buy on their own too
  (not while you are in control), and their card has buttons to buy for them. The Wealth card in the
  Adventure tab lists the richest.
- **Mounts**: a pony, a saddle horse, a white charger or a riding griffin. On long trips the owner rides at a
  trot (2 to 3 times walking speed) or flies its griffin straight over everything (4.5 times). The mount
  waits beside its rider and sleeps by its house.
- **Riding beasts** (version 49): a stag, a ram or a boar, by way of life (hunters, shepherds...) or bought at the
  paddock (18, 30 and 45 shells); and a tamer rides the tamed monster at its heel if it is big enough (werewolf,
  centaur, golem, troll, ogre, minotaur, manticore, cerberus, basilisk, salamander, cave spider).
- **Boats** moored in a marina beside every dock: a rowing boat, a sailing boat or a yacht; some afternoons
  the owner takes it out on the lake.
- **Better houses**: the builders rebuild a Tickle's own house as a two-storey **townhouse** (timbered upper
  floor, balcony, flower boxes), then a **manor** (columned porch, tower with a flag); inside, a parlour or
  great hall, a bedroom and, in the manor, a strong room with the family's shells. While it is being built
  the owner sleeps in the town hall.
- **Arms**: fine steel weapons (+25 %), masterwork (+50 %) and steel shields. **Wear**: arms go from new to
  good, worn, very worn and about to break; worn arms hit or protect less, look rusty, and can break. Militia
  arms tend to be old. The guild repairs them and sells new or second-hand arms (cheaper, already worn).

## 15. Weather

- One **weather field** drifts with the wind over the whole map, so fronts of cloud, rain and storm cross it
  zone by zone (it can pour in one region while the sun shines in the next). Each region has its own climate:
  Waterfall is the wettest, Beach Sand the driest, The Palm gets tropical storms. Overall about two thirds of
  the time is clear, about 15 % rain, about 5 % storm, with fog on some mornings.
- **Near the camera**: the sky and the light darken, rain falls (slanting in storms), clouds drift over, fog
  lies in damp places, and lightning strikes (a flash, a bolt and the thunder a moment later, later the further
  away); now and then it splits a tree, damages a roof or knocks out a Tickle. Rain and wind can be heard.
- Tickles **shelter at home** from storms (and many from heavy rain) in their free time and at dinner; the
  birds fall quiet.
- **Tornadoes** (about one every ten days) come down from a storm and cross a region for about 40 minutes,
  uprooting trees, wrecking houses, town halls and granaries in their path and throwing Tickles through the
  air.
- **Tsunamis** (very rare): the sea draws back from a coast about 45 minutes before, the people of the shore
  run inland, and a great wave breaks over the beach.
- The clock shows the weather where you are; the Weather card in the Adventure tab shows every region, the
  next hours and the warnings. Everything happens on the clock whether you watch or not.

## 16. Sound and music

- **Music** (the ♪ button): free CC0 chiptunes from OpenGameArt that follow the camera — each village plays
  its region's town tune (a calmer one at night, muffled indoors), mines and dungeons have uneasy tunes, the
  arenas a battle tune, and the lake, the roads and the Maker's Isle theirs. Danger comes first: a sleeping
  dragon nearby makes it hushed and tense, an awake dragon or monsters bring the danger tune, a dragon fight
  the boss tune. In the Underworld, each band has its tune and guardians their boss tune. A song that wins a
  Song Contest becomes the region's town tune.
- **Ambience**, synthesized live: **songbirds** in the trees near you (sunfinch, meadow warbler, palm robin,
  coral thrush, turtle dove; gulls over the sea; the moon owl at night), all singing in one key (D major
  pentatonic) on one shared pulse so they sound together in harmony, fullest at dawn and silent at dark, each
  seen on its branch and heard from its side; frogs croaking in bouts; the anvils; hooves; rain and wind.
- **Effects**, synthesized: the scream of a Tickle sent flying, crashes, bells, punches, cheers and the cry of
  whatever you throw.
- **Menu → Sound**: music, ambience and effects each with its own volume and switch (remembered in the
  browser).

## 17. Going inside

Interiors work like the old Pokémon games: every house, town hall, manor, mansion, granary, guild hall,
casino, mine and dungeon leads into its own small maps (rooms) drawn apart on black, joined by numbered warps
(doormats, stairs, ladders) that always lead back to the door you came in by.

- **Homes** show their owner's things: its on-chain Ground item, its creature, its trophies, its arms; the
  owner asleep in bed (lying properly on the mattress, head on the pillow) or at breakfast. Mansions have a
  great hall, a dormitory with a bed for every resident and a strong room; shared houses a bed for each member
  of the household.
- **Town halls** have the notice board and, upstairs, the treasury of ores; **granaries** are as full as the
  stores; **guild halls** show their board; **casinos** have their five rooms.
- **Caves** lead into the Great Underworld (a panel moves floor by floor or jumps to any floor; its map shows
  the whole floor); **mines** are levels of tunnels with miners, guards and monsters on patrol.

## 18. Playing: modes, holders, the hand and first person

- **Two modes**: **AI runs it** (the Director acts on its own) or **I'm in control** (the Director stops;
  you give orders, build with blocks, place objects, and nothing the AI makes enters the world until you
  approve it).
- **Holders**: play as a wallet from the ownership snapshot; in "I'm in control" you can only direct that
  wallet's Tickles, enter them in contests, sit them at the casino, send them diving and buy for them.
- **Tickle Directory**: search and filter all 9,629 Tickles, with a short biography, skills and today's
  routine (and an optional story written by Claude when the page runs inside claude.ai).
- **Inspect window** (js/inspect.js): click anything else (a Tickle, a creature, a monster, a dragon, a sea beast, an
  animal, a bird, a boat, a mount, a tree, a placed object, the ground or the water; inside, the Tickles, monsters,
  guardians, furniture, chests, gems and the room itself) for a small window about it that keeps itself up to date: health
  bar, needs, what it is doing, what it can do (role, spells, its attack and type), what it fights with and carries.
- **Place cards**: click any building or landmark for what it is, what is going on there now, a little of
  its story and "Go inside". The giant statue tells the legend of the Maker.
- **The hand**: the same button that drags the map picks things up. Press on a Tickle, an animal, a
  creature, a dragon, a horse or griffin, a sea beast, a boat, an object, a tree or a building and drag to lift
  it; let go to set it down, or let go while moving to throw it. Buildings and trees break when thrown; a sea
  beast thrown hard is hurt and slides back into the water; a boat set down on land goes back to its mooring.
  Places of the game (arenas, caves, mines, the statue, guild halls, casinos, docks) and the ferries stay put.
  Playing as a holder you can only pick up your own Tickles.
- **First person** (V, or the button on a Tickle's card): ride along with any Tickle through its day
  (races, regattas, dives...), or, with one of your own while in control, walk it yourself (it swims in the
  water, goes inside with E, and mounts its horse or griffin with M). Under water the view turns blue and
  hazy. A click captures the mouse to look round as in any first-person game (Esc frees it, a second Esc
  leaves); a crosshair names what is in front and a click opens its inspect window. A HUD shows the Tickle's
  health, its four needs and a compass. Space jumps on foot, the head bobs with the stride, and the mouse wheel
  pulls the camera back behind the Tickle (third person) and in again. On a touch screen a stick on the left
  walks it and a drag on the right looks round; a tap inspects what was tapped. Movement is as in a shooter: W/S
  forward and back, A/D sideways, the mouse turns. With your own Tickle there is an ability bar, as in a MOBA:
  F a basic blow, Q and G two abilities and R the ultimate, each with a cooldown, by what the Tickle is (warrior:
  Strike, Cleave, Shield Wall, Charge; mage: Staff Blow, Bolt of its school, Blink, Nova; healer: Staff Blow,
  Mend, Bless, Sanctuary; tamer: Strike, Sic 'em, Roar, Stampede; anyone else: Punch, Kick, Sprint, Haymaker).
  The cave monsters fight back (a knock-out ends first person). T talks to the Tickle in front (it answers, they
  get on a little better). A game controller works too: left stick to walk (pressed in to run), right stick to
  look, A jump (up on a griffin, LT down), X or RT the basic blow, Y Q, LB G, RB R, B talk, Back to mount, Start
  to leave.

## 19. The Director (AI) and the Library

- The **Director** is the world-managing AI: it watches the Tickles' needs and designs new objects,
  activities, buildings and events in the native stroke format — remixing on-chain items with the 13 on-chain
  themes, procedural designs (`js/procgen.js`) and, inside claude.ai, designs written by Claude ("Ask Claude
  to design"). Its work passes automatic **fidelity checks** against the 58 on-chain models and enters the
  world marked as unreviewed. Duplicate designs are merged.
- **Review** shows every AI-made object and activity with its checks; **Library** holds what you approved,
  ready to export as a reusable stroke library (`tickle-library.json`). Designs baked into
  `js/approved.js` are part of every new world.
- World rules the Director keeps: natural things keep natural colours (only umbrellas are remixed), personal
  items are never placed as props, seats and items face what they serve.

## 20. Controls

| Action | Input |
| --- | --- |
| Move the view | drag the ground, or WASD / arrow keys (Shift for faster) |
| Turn the view | Z / X, the ⟲ ⟳ buttons under the minimap, right-drag or Ctrl-drag, two-finger twist |
| Zoom | mouse wheel or pinch, from a few steps away up into the sky with the whole map in sight |
| Inspect | click anything: a small window about it (health, needs, abilities, arms...) |
| Dismiss a notification | click it; Menu > Settings switches the activity notifications off |
| Graphics quality | Menu > Settings > Graphics: Normal, High (default) or Ultra |
| Travel | click the minimap; M opens the big map |
| Pick up / throw | press on something and drag; release while moving to throw |
| Building or landmark card | click it |
| Go inside / leave | E near a door, cave or mine / Esc |
| Follow a Tickle | select it and press F |
| First person | V (click to capture the mouse and look round, click again to inspect what is under the crosshair; WASD to walk, Shift to run, Space to jump, Z/X or drag to turn, wheel for the camera behind it, E to enter, M to mount, Space/C to climb/descend on a griffin; F/Q/G/R abilities, T talk; Esc frees the mouse, Esc again leaves; touch: stick on the left, drag on the right; a game controller works too) |
| Time | Space pauses; 1, 2, 3 set the speed (1x, 4x, 12x) |

## 21. Technical overview

**Stack**: plain JavaScript (no build step, no framework) and three.js r128 from cdnjs. One page
(`index.html`) loads the scripts in order; a Web Worker voxelizes models. Everything runs client-side; the
only network requests are three.js, the music files and, optionally, ownership refreshes.

**Levels of detail**: every model of the scenery has a usual copy (near) and a coarse one (far); with the
graphics quality at High or Ultra a third, finer copy (smaller cubes) is made in the workers the first time a
model comes within a few dozen blocks (`App.fragX`, population.js). Beyond the streamed scenery the far view
(farview.js) draws coarse copies and stand-ins. The sun casts shadows round the middle of the view at High and
Ultra.

**Simulation tiers**: full agents near the camera (needs, smart objects, chats, building, fights, poses),
walking figures further away, and a clock-driven simulation for everyone else that follows the same
deterministic plans, so off-screen results match what would have been seen.

**Determinism**: layout, plans, contests, weather and events come from seeded hashes (`App.hash2`, seeded
RNGs). Scenery is indexed in generation order, and saved state (moved pieces, ruins, breakages) is keyed by
that index, so **new scenery must always be appended at the end of generation**.

**Saving**: the game saves itself to `localStorage` (key `tickle-world-v6`) every 20 seconds and when the
tab is hidden: time, camera, needs (binary, base64), relations, moved scenery, AI designs and props, places'
food and relations, creatures, levels and relics, fate, factions, mines, guilds, casinos, contests, diving,
sea beasts, wealth and weather. A layout tag (`App.LAYOUT`) lets an old save migrate when the map changes
(`App.migrateLayout`).

**Files** (`js/`):

| File | What it does |
| --- | --- |
| `data.js` | on-chain models and theme data, verbatim from `htmlForToken()` |
| `keccak.js` | keccak256 and the contract's seed formula |
| `tickle-core.js` | port of the on-chain decoder, trait picker, part assembly, theming; arm splitting |
| `sdf.js` | CPU port of the on-chain SDF shader and the octree voxelizer (each octree node looks only at the strokes its parent kept, and cubes are culled by their box: the same voxels as the shader, about three times faster); the voxel mesher (faces in full light of one colour merged into rectangles) |
| `blocktex.js` | the block textures: one 16-pixel tile per block face (grass, sand, dirt, cobbles, bark, planks, leaves, paths, furrows, plaster) in a mipmapped atlas |
| `gfx.js` | graphics quality (Normal / High / Ultra): the finer near models, the shadows, the pixel ratio |
| `worker.js` | voxelization worker: Tickles, on-chain pieces, kit and AI strokes to meshes |
| `owners.js` | `ownerOf()` snapshot (block 26,125,466) |
| `kit.js`, `kit-interior.js`, `kit-monsters.js`, `kit-myth.js`, `kit-wealth.js` | the game's model kit in the on-chain stroke format |
| `farview.js` | the far view: a light heightfield of the whole map, coarse copies and stand-ins of the buildings and trees beyond the streamed ones |
| `inspect.js` | the inspect window: what anything clicked is, its health, needs, abilities and arms |
| `prison.js`, `listings.js` | the prison for Tickles up for sale; the snapshot of marketplace listings |
| `parliament.js` | the Parliament: seats, ministers, sittings, laws and votes |
| `geo.js` | world layout: regions, lake, bridges, places, holders' places, roads, fields, farms, arenas, caves, lairs, mines, Ether fields, guild quarters, casinos, smithies; terrain heights; routes |
| `world.js` | open-world engine: chunked block terrain (textured), meshes, camera, picking, daylight, the sky dome with its gradient, the sun's shadows |
| `population.js` | all 9,629 Tickles: traits, jobs, daily plans, pawns, owners |
| `sim.js` | full agents, needs, smart objects, walking and path-finding (A*, detours, swimming), the Director, save/load |
| `village.js` | clans, granaries, chores, raids, food sharing, layout migration |
| `wildlife.js`, `critters.js`, `lakelife.js`, `birds.js` | farm and wild animals, dragons in flight, pond life, lake life, songbirds |
| `creatures.js`, `boxing.js` | creatures, taming, battles, arena tournaments; boxing |
| `dungeons.js`, `interiors.js`, `fx.js` | parties and the Great Underworld; all interiors; spell and hit effects |
| `mines.js`, `guilds.js`, `factions.js` | ores and forging; the six guilds; shells and factions |
| `lairs.js`, `rampage.js`, `fate.js` | dragon lairs and patrols; dragon fights; death, revival and rebuilding |
| `faith.js` | the Maker, pilgrimages, Ethernum, the blessed |
| `boats.js`, `surf.js`, `diving.js`, `seabeasts.js` | ferries, launches and rowing boats; surfing and breakers; diving; sea beasts |
| `contests.js`, `casino.js` | the eight daily contests; the casinos |
| `wealth.js` | purchases, smithies, mounts and flight, marinas, house upgrades, arms and wear |
| `weather.js` | weather field, climates, rain, lightning, tornadoes, tsunamis |
| `music.js`, `sfx.js` | music by place; synthesized effects and ambience buses |
| `hand.js`, `firstperson.js` | the hand; first-person view and control |
| `places.js`, `directory.js`, `procgen.js`, `approved.js`, `ui.js` | place cards; the Directory; procedural designs and fidelity checks; baked designs; UI, boot and main loop |

Other files: `tests/` (browser test scripts with Playwright, and what each checks: [tests/README.md](tests/README.md)),
`CLAUDE.md` (notes for Claude sessions), `onchain-tickle.html` (the original on-chain viewer, used to open kit models in it),
`dev-*.html` (developer test pages), `reference/` (the decoded on-chain repository and one on-chain token
page), `v1/` (the first single-island version), `music/` (the CC0 tracks), `ESTADO_Y_PENDIENTES.md`
(the project log in Spanish) and [PENDING.md](PENDING.md) (what is left, in English).

**Conventions**: kit coordinates are SDF units with z up, ground at z = 0, front +y, a Tickle about 480
units tall (160 units per block). JavaScript files are kept ASCII (non-ASCII characters escaped). Each
change bumps the `?v=N` cache-buster on the script tags.

## 22. Running it locally

The page needs to be served over HTTP (the worker cannot load from `file://`):

```bash
python -m http.server 8765 --directory tickle-world
```

Then open <http://localhost:8765>. The first load derives all 9,629 seeds and cuts the on-chain pieces,
which takes a little while. A dedicated GPU helps: near a busy village the scene can reach about two million
triangles, and pulled back into the sky about two and a half to three million.

## 23. Credits and data

- **Tickle Beach** collection and its on-chain models: the collection's author (contract
  `0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce`). In the game's lore the Maker is known only by his initials,
  P.M.
- **Music**: CC0 (public domain) tracks from OpenGameArt.org; the composers are named in Menu → Credits.
- **three.js** r128 (MIT licence).
- Kit models, game code and design: made for this project with Claude (Anthropic), in the collection's own
  stroke format.
