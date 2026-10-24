# Browser tests

Scripts that open the game in a headless Chromium (Playwright), wait for the world to load, then drive it and
print what they find (and take screenshots). They are scenario checks written while building each feature, not
a pass/fail suite: read the log, look at the PNGs. Each run uses a fresh browser profile, so it never touches a
player's saved game.

## Setup (once)

1. Node 18+ and Playwright with Chromium: `npm i -D playwright && npx playwright install chromium` (or point `PWP`
   at an existing Playwright install, e.g. `PWP=/opt/node-tools/node_modules/playwright`).
2. Optional but recommended: a local copy of three.js r128 at `tests/vendor/three.min.js` (git-ignored), so runs do
   not need the network: `npm pack three@0.128.0 && tar xzf three-0.128.0.tgz && mkdir -p tests/vendor && cp package/build/three.min.js tests/vendor/`.
   Without it the page loads three.js from cdnjs. All other outside requests (music, Ethereum nodes) are blocked.

## Running

```bash
node tests/serve.js            # serves the repository at http://localhost:8765 (args: [root] [port])
cd tests && node run.js t_inspect.js      # in another terminal; screenshots land in the current directory
```

Loading takes about 30 s in software WebGL. Options (environment variables) for `run.js`: `BASE` (page URL,
default `http://localhost:8765/`), `W` and `H` (viewport, default 1100x720), `PAGE` (path after BASE), `PWP`
(Playwright module). Scripts that take their own options say so below. The runner prints `loaded in`, the
script's log, then `ERRORS n` with page errors and console warnings ("Failed to load resource" lines are hidden;
`ERRORS 1` with nothing listed is just that).

Support files: `run.js` (the runner), `serve.js` (static server), `lib.js` (helpers: `closeMenu`, `look(x, z,
radius, theta, phi, wait)` to place the camera, `shot`, `noClouds`, `hidePanels`), `node_kit.js` (the model kit
loaded in Node without a browser: `require('./tests/node_kit').KIT`).

## What each script checks

**General**
- `t_basic.js` — the world loads: time, places by kind; `basic.png`.
- `t_day.js` — two minutes of simulated time near the prison with Tickles listed for sale: agents and where the
  listed ones are, every 10 s (a smoke test of the daily routine).
- `t_soak.js` — 100 s at high speed by the Parliament with listings set, then a save and a reload check.
- `t_measure.js` — counts all scenery by kind (diagnostic).
- `t_dir.js` — the Director makes an event, a mechanic and a remix; its pending proposals reach the Parliament's
  agenda.

**Places by holder (version 49, item 11)**
- `t_forts.js` — lists fortresses, keeps and the biggest places (kind, region, residents).
- `t_castles.js` — top and side screenshots of places by village index (`IDS=0,1,163,206`).
- `t_top.js` — straight-down screenshots of places (`IDS`, `R` radius, `PHI` pitch).
- `t_towns.js` — town houses stay inside the town and do not overlap.
- `t_owners.js` — simulates an ownership change and checks how many places keep their plot and households their
  house.
- `t_guards.js`, `t_guards2.js` — the wall guards of a fortress walking the walls (`VI` village index, default
  163): screenshots, and the guards' "wallwatch" plan steps.
- `t_inside.js` — goes into a castle, a keep, a mansion, medium houses and a townhouse; screenshots of every room
  and the number of beds.
- `t_dorm.js`, `t_dorm2.js` — the castle's tower dormitory: screenshot, and any mesh too big for the room (the
  old "giant planes" bug).
- `t_clouds.js` — views from high above two places, to see that clouds do not hide them.

**Riding, prison, Parliament, Underworld (items 12-16)**
- `t_ride.js` — Tickles given a stag, a ram, a boar or a tamed monster set off on a long trip riding it;
  screenshots of each (`KINDS=deer,sheep,boar,ogre,centaur,spider`).
- `t_prison.js` — 30 Tickles listed for sale go to the prison: where they are, screenshots of the yard and inside.
- `t_parl.js` — the Parliament: building, 333 seats in blocs, a sitting and a vote; screenshots.
- `t_parl2.js`, `t_parl3.js` — how many ministers live near a dock, sit today and are in the chamber at 17:00;
  their day plans (the launch across the lake).
- `t_delve.js` — six days of Underworld parties planned and run off-screen: what the log says.
- `t_under.js` — screenshots of Underworld floors from their teleport gem (`FL=0,2,4,6,8`).
- `t_pool.js` — the same for floors with water or lava pools, from beside a pool.

**Casinos**
- `t_casino.js` — a casino at night: its rooms, tables and players; screenshots of each room.
- `t_tour.js` — one of the player's Tickles entered in the poker tournament, played to the end.
- `t_waiters.js` — the waiters crossing the casino's rooms (positions over 12 s, screenshot).

**Inspect window, notifications, sky (22-23 October)**
- `t_inspect.js` — clicks a Tickle, a pet creature, a farm animal, a tree, the ground, the lake, a cave monster and
  a dragon; then inside a house (furniture, a Tickle, the room) and on an Underworld floor (gem, ore, monster,
  room, guardian with the real mouse). Logs each window's text.
- `t_inspect2.js` — a building still opens its own card; "Full card" selects the Tickle; the health bar follows a
  creature battle live; the window's position inside with the side panel shown.
- `t_inspect3.js` — the windows of rowing boats, private boats, mounts and the paddock's horses and griffin.
- `t_inspect4.js` — starts a sea beast attack and clicks the beast.
- `t_notify.js` — a click dismisses a notification; the Watch button still works; Menu > Settings switches them
  off (answers to the player's keys still show); first person works after zooming out to the sky.
- `t_fp.js` — first person with your own Tickle (item 1.1): the HUD (health, needs, compass, what the crosshair
  names), walking with W, a jump with Space, turning with a drag, the wheel to third person, a click inspecting
  what is in front, the touch stick, Esc; `fp1.png` (first person), `fp2.png` (third person), `fp3.png` (stick).
  Software WebGL runs at about one frame a second, so it waits several seconds for each step.
- `t_fp2.js` — acting from first person: T talks to the Tickle in front, F fights a cave monster until it falls
  (it fights back), A strafes without turning, and every kit of the ability bar (F, Q, G, R as warrior, mage,
  healer, tamer, brawler) against the cave's monsters; `fp_strike.png`, `fp_bar.png`.
- `t_fp3.js` — a game controller (the Gamepad API stubbed): left stick walks, right stick turns, A jumps, X
  strikes, Start leaves.
- `t_tex.js` — block textures and the graphics quality (item 1.2): close views of a village, a beach and the
  horizon (`Q=normal|high|ultra`, `NOTEX=1`); waits for the finer near models; `tex_<Q><n>.png`.
- `t_waves.js` — the sea's breakers built of small cubes: three waves held at building, full and breaking
  (`waves_stages.png`), then the live ones close up (`waves_N.png`).
- `t_manor.js` — a citadel, a keep and an estate up close once their finer copies are made (`Q=`, `KINDS=`);
  `manor_<kind>.png`.
- `t_sky.js` — the view at several heights (`RADII=46,130,400,1000,2600`): frame time, triangles, far-view
  instances, screenshots `sky_N.png`.
- `t_big.js` — lists the biggest scenery models (diagnostic for the far view).
