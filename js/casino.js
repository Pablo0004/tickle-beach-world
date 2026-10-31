/* Casinos. One in every region, near its arena, open every night from 19:00 to 23:30. Inside there are
 * real games with real rules, played for shells:
 *   Poker      Texas Hold'em, fixed limit (blinds 1/2, bets of 2 then 4), up to six at a table; the cards are
 *              dealt from a shuffled deck, hands are ranked properly and side pots are split as they should be
 *   Blackjack  four decks; the dealer stands on 17; blackjack pays 3 to 2; double down on two cards
 *   Roulette   European wheel, one zero: straight up 35 to 1, dozens and columns 2 to 1, red/black, odd/even
 *              and low/high 1 to 1
 *   Bingo      90 balls, tickets of 3 rows of 5 numbers; a prize for the first line and a bigger one for bingo
 * The Lucky Shells (the gamblers) go on many nights, and others now and then when they have shells to spare.
 * The Tickles play by the same rules as anyone, the player included: sit one of your own Tickles at a table
 * and play with its shells. The house keeps its edge (and a small rake from each poker pot). */
(function (G) {
  "use strict";
  const TB = G.TB;
  // ---------- the casino building and its tables, in the kit's stroke format ----------
  if (TB && TB.kitHelpers) {
    const { C, S, dir } = TB.kitHelpers;
    const ACC = [["#c0262d", "#ffd23f"], ["#6a2fb0", "#ffd23f"], ["#12807a", "#ffe8a0"]];
    function casino(v) {
      const st = [], [acc, gold] = ACC[v || 0].map((c) => C(c)), wall = C("#fff1d6"), stone = C("#b8b0a0"), dark = C("#3a2a1a"), white = C("#ffffff"), bulb = C("#fff6b0");
      // layer 0: the plinth and the walls, with the way in
      st.push(S("cube", [0, 0, 30], [560, 420, 30], { color: stone, round: 0.05 }));
      st.push(S("cube", [0, 0, 280], [520, 380, 250], { color: wall, round: 0.03 }));
      st.push(S("cube", [0, 375, 150], [100, 30, 140], { m: "sub", color: wall }));
      // layer 1: the flat roof with its golden edge, the dome, the columns at the door
      st.push(S("cube", [0, 0, 545], [545, 405, 18], { color: gold, layer: 1 }));
      st.push(S("sphere", [0, 0, 560], [210, 210, 170], { color: acc, layer: 1 }));
      st.push(S("cylinder", [150, 400, 180], [26, 26, 180], { color: white, mirror: true, offsX: 150, layer: 1 }));
      // layer 2: the marquee over the door, with a row of bulbs, and the dark doorway
      st.push(S("cube", [0, 392, 430], [320, 16, 75], { color: acc, layer: 2 }));
      st.push(S("cube", [0, 398, 430], [300, 10, 60], { color: dark, layer: 2 }));
      for (let k = 0; k < 9; k++) st.push(S("sphere", [-280 + k * 70, 404, 512], [14, 14, 14], { color: bulb, layer: 2 }));
      st.push(S("cube", [0, 378, 140], [86, 10, 128], { color: C("#2a1a10"), layer: 2 }));
      // layer 3: on the marquee, two dice and a fan of cards
      st.push(S("cube", [-170, 412, 432], [42, 12, 42], { color: white, round: 0.3, layer: 3 }));
      st.push(S("cube", [170, 412, 432], [42, 12, 42], { color: white, round: 0.3, layer: 3 }));
      for (const [x, z] of [[-185, 447], [-155, 417], [-170, 432], [155, 447], [185, 417]]) st.push(S("sphere", [x, 424, z], [7, 4, 7], { color: dark, layer: 3 }));
      st.push(S("cube", [-30, 410, 432], [30, 6, 44], { color: white, rot: [0, 0.35, 0], layer: 3 }));
      st.push(S("cube", [30, 410, 432], [30, 6, 44], { color: white, rot: [0, -0.35, 0], layer: 3 }));
      st.push(S("cube", [0, 414, 438], [30, 6, 44], { color: white, layer: 3 }));
      st.push(S("sphere", [0, 420, 440], [12, 4, 14], { color: acc, layer: 3 }));
      // layer 4: a star on the dome
      st.push(S("cylinder", [0, 0, 745], [18, 18, 30], { color: gold, layer: 4 }));
      st.push(S("sphere", [0, 0, 790], [34, 34, 34], { color: gold, layer: 4 }));
      return st;
    }
    const wood = C("#7a4a2a"), wood2 = C("#5a3418"), felt = C("#1f7a3e"), felt2 = C("#2a9050"), goldC = C("#ffd23f"), red = C("#c0262d"), black = C("#1c1c1c"), whiteC = C("#ffffff");
    // a poker table: an oval of green felt in a padded rim, on one pedestal
    // (variant 1: the big tournament table, for nine)
    function pokertable(v) {
      const st = [], k = v ? 1.42 : 1;
      st.push(S("cylinder", [0, 0, 8], [90 * k, 90 * k, 8], { color: wood2 }));
      st.push(S("cylinder", [0, 0, 55], [34 * k, 34 * k, 50], { color: wood }));
      st.push(S("cylinder", [0, 0, 104], [250 * k, 170 * k, 10], { color: wood2, layer: 1 }));
      st.push(S("cylinder", [0, 0, 112], [232 * k, 154 * k, 6], { color: felt, layer: 1 }));
      st.push(S("cylinder", [0, 0, 116], [150 * k, 90 * k, 2], { color: felt2, hole: 0.92, layer: 2 }));
      st.push(S("cylinder", [0, -120 * k, 116], [30, 14, 2], { color: goldC, layer: 2 }));
      return st;
    }
    // a blackjack table: a half-moon of felt, the dealer's chip rack on the flat side
    function bjtable() {
      const st = [];
      st.push(S("cylinder", [0, 0, 8], [80, 60, 8], { color: wood2 }));
      st.push(S("cube", [0, 0, 55], [40, 30, 50], { color: wood }));
      st.push(S("cylinder", [0, 20, 104], [220, 130, 10], { color: wood2, layer: 1 }));
      st.push(S("cube", [0, -90, 104], [225, 30, 10], { m: "sub", color: wood2, layer: 1 }));
      st.push(S("cylinder", [0, 20, 112], [205, 116, 6], { color: felt, layer: 2 }));
      st.push(S("cube", [0, -88, 114], [215, 30, 8], { m: "sub", color: felt, layer: 2 }));
      st.push(S("cube", [0, -70, 118], [70, 14, 5], { color: black, layer: 3 }));
      for (let k = 0; k < 5; k++) st.push(S("cylinder", [-52 + k * 26, -70, 124], [9, 9, 3], { color: [red, goldC, whiteC, felt2, black][k], layer: 3 }));
      return st;
    }
    // a roulette table: the betting layout (red and black squares, a green zero), the wheel stands beside it
    function roulettetable() {
      const st = [];
      st.push(S("cube", [200, 0, 55], [20, 70, 50], { color: wood, mirror: true, offsX: 200 }));
      st.push(S("cube", [0, 0, 8], [240, 90, 8], { color: wood2 }));
      st.push(S("cube", [0, 0, 106], [300, 120, 10], { color: wood2, round: 0.15, layer: 1 }));
      st.push(S("cube", [0, 0, 114], [285, 106, 5], { color: felt, layer: 1 }));
      for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) st.push(S("cube", [-200 + c * 36, -50 + r * 50, 120], [15, 20, 2], { color: (c + r) % 2 ? red : black, layer: 2 }));
      st.push(S("cube", [-250, 0, 120], [14, 70, 2], { color: felt2, layer: 2 }));
      st.push(S("cube", [230, 0, 120], [30, 70, 2], { color: whiteC, layer: 3 }));
      st.push(S("cube", [230, 0, 121], [26, 66, 2], { color: felt, layer: 3 }));
      return st;
    }
    // the wheel: a wooden bowl, 37 pockets in the order of a real European wheel, a golden turret in the middle
    const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    function roulettewheel() {
      const st = [];
      st.push(S("cylinder", [0, 0, 20], [95, 95, 20], { color: wood2 }));
      st.push(S("cylinder", [0, 0, 44], [88, 88, 6], { color: wood }));
      WHEEL.forEach((n, k) => { const a = (k / 37) * Math.PI * 2; st.push(S("cube", [Math.cos(a) * 62, Math.sin(a) * 62, 52], [8, 8, 4], { color: n === 0 ? felt2 : REDS.has(n) ? red : black, rot: [0, 0, a], layer: 1 })); });
      st.push(S("cylinder", [0, 0, 56], [40, 40, 6], { color: goldC, layer: 2 }));
      st.push(S("cylinder", [0, 0, 74], [10, 10, 20], { color: goldC, cone: 0.6, layer: 2 }));
      return st;
    }
    // the bingo cage: variant 0 is the stand with its two uprights, variant 1 the drum (built round its own
    // middle, so it turns on its axle) with the balls inside
    function bingocage(v) {
      const st = [];
      if (!v) {
        st.push(S("cube", [0, 0, 10], [70, 50, 10], { color: wood2 }));
        st.push(S("cube", [66, 0, 70], [8, 8, 60], { color: goldC, mirror: true, offsX: 66 }));
        st.push(S("sphere", [66, 0, 128], [10, 10, 10], { color: goldC, mirror: true, offsX: 66, layer: 1 }));
        st.push(S("cube", [0, 0, 22], [60, 40, 4], { color: wood, layer: 1 }));
        return st;
      }
      st.push(S("cylinder", [0, 0, 0], [56, 56, 46], { color: goldC, hole: 0.9, rot: [1.5708, 0, 0] }));
      st.push(S("cylinder", [0, 0, 0], [56, 56, 46], { color: goldC, hole: 0.9, rot: [0, 1.5708, 0] }));
      st.push(S("joint", [0, 0, 0], [5, 5, 64], { color: goldC, rot: [0, 1.5708, 0], layer: 1 }));
      for (let k = 0; k < 7; k++) st.push(S("sphere", [-24 + (k % 4) * 16, (k % 3) * 10 - 10, -26 + Math.floor(k / 4) * 14], [7, 7, 7], { color: [red, whiteC, felt2, goldC][k % 4], layer: 1 }));
      return st;
    }
    // a slot machine against the wall: cabinet, three reels, the lever
    function slotmachine() {
      const st = [];
      st.push(S("cube", [0, 0, 90], [45, 38, 90], { color: red, round: 0.1 }));
      st.push(S("cube", [0, 0, 190], [45, 38, 14], { color: goldC, round: 0.3 }));
      st.push(S("cube", [0, 36, 120], [34, 6, 18], { color: black, layer: 1 }));
      st.push(S("cube", [0, 40, 70], [30, 4, 20], { color: goldC, layer: 1 }));
      for (let k = 0; k < 3; k++) st.push(S("cube", [-20 + k * 20, 41, 120], [7, 3, 12], { color: [goldC, whiteC, red][k], layer: 2 }));
      st.push(S("joint", [55, 0, 140], [6, 6, 40], { color: C("#c8c8c8"), rot: dir(0, 0.2, 1), layer: 2 }));
      st.push(S("sphere", [55, 8, 182], [12, 12, 12], { color: red, layer: 3 }));
      st.push(S("sphere", [55, 0, 100], [9, 9, 9], { color: goldC, layer: 3 }));
      return st;
    }
    // the cocktail bar: a counter with a golden top and a red front, shelves of bottles behind it, tall stools
    function barcounter() {
      const st = [];
      st.push(S("cube", [0, 0, 100], [200, 60, 100], { color: wood2, round: 0.05 }));
      st.push(S("cube", [0, 0, 206], [212, 72, 8], { color: goldC }));
      st.push(S("cube", [0, 62, 104], [190, 4, 78], { color: red, layer: 1 }));
      st.push(S("cube", [0, 70, 26], [196, 6, 6], { color: goldC, layer: 1 }));
      for (let k = 0; k < 4; k++) st.push(S("cylinder", [-120 + k * 80, 10, 226], [9, 9, 14], { color: [whiteC, C("#8fd3f4"), C("#ffb070"), C("#c9a6ff")][k], layer: 2 }));
      st.push(S("cylinder", [150, -10, 222], [14, 14, 10], { color: C("#c8c8c8"), layer: 2 }));
      return st;
    }
    function barshelf() {
      const st = [];
      st.push(S("cube", [0, 0, 170], [200, 16, 170], { color: wood2 }));
      for (const z of [110, 200, 290]) st.push(S("cube", [0, 24, z], [200, 26, 5], { color: wood }));
      const cols = [C("#2e8b3a"), C("#8a3a1a"), C("#ffd23f"), C("#2f5fb0"), C("#c0262d"), C("#e8e0d0")];
      for (const [z, lay] of [[140, 1], [230, 1], [320, 2]]) for (let k = 0; k < 9; k++) st.push(S("cylinder", [-170 + k * 42, 28, z], [9, 9, 26], { color: cols[(k + z) % cols.length], layer: lay }));
      st.push(S("cube", [0, 20, 30], [200, 30, 30], { color: wood, layer: 2 }));
      return st;
    }
    function barstool() {
      const st = [];
      st.push(S("cylinder", [0, 0, 4], [26, 26, 4], { color: goldC }));
      st.push(S("cylinder", [0, 0, 70], [6, 6, 66], { color: C("#c8c8c8") }));
      st.push(S("cylinder", [0, 0, 140], [30, 30, 8], { color: red, layer: 1 }));
      st.push(S("cylinder", [0, 0, 60], [18, 18, 3], { color: goldC, hole: 0.7, layer: 1 }));
      return st;
    }
    TB.KIT.casino = { name: "Casino", group: "Village", variants: [0, 1, 2], build: casino, voxel: [12, 28], scenery: true, variantLabel: (v) => ["red", "purple", "teal"][v] + " marquee" };
    const I = { group: "Interiors" };
    Object.assign(TB.KIT, {
      pokertable: Object.assign({ name: "Poker Table", variants: [0, 1], build: pokertable, voxel: [8], variantLabel: (v) => (v ? "tournament table for nine" : "table for six") }, I),
      bjtable: Object.assign({ name: "Blackjack Table", variants: [0], build: bjtable, voxel: [8] }, I),
      roulettetable: Object.assign({ name: "Roulette Table", variants: [0], build: roulettetable, voxel: [7] }, I),
      roulettewheel: Object.assign({ name: "Roulette Wheel", variants: [0], build: roulettewheel, voxel: [6] }, I),
      bingocage: Object.assign({ name: "Bingo Cage", variants: [0, 1], build: bingocage, voxel: [6], variantLabel: (v) => (v ? "drum" : "stand") }, I),
      slotmachine: Object.assign({ name: "Slot Machine", variants: [0], build: slotmachine, voxel: [7] }, I),
      barcounter: Object.assign({ name: "Bar Counter", variants: [0], build: barcounter, voxel: [8] }, I),
      barshelf: Object.assign({ name: "Bar Shelves", variants: [0], build: barshelf, voxel: [7] }, I),
      barstool: Object.assign({ name: "Bar Stool", variants: [0], build: barstool, voxel: [6] }, I),
    });
    TB.CASINO_WHEEL = WHEEL; TB.CASINO_REDS = REDS;
  }
  if (!G.App) return;
  const App = G.App, st = App.st, hash2 = App.hash2, DAY = 1440, rnd = Math.random;
  const OPEN = 19 * 60, CLOSE = 23 * 60 + 30, WAGE = 8;
  const WHEEL = TB.CASINO_WHEEL, REDS = TB.CASINO_REDS;
  const nm = (id) => App.nameOf(id);
  const sh = (id) => App.shellsOf(id);
  const take = (id, n) => { App.pay(id, -n); };
  const give = (id, n) => { App.pay(id, n); };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const range = (a, b) => { const o = []; for (let k = a; k <= b; k++) o.push(k); return o; };

  // ---------- cards ----------
  const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"], SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
  const cardText = (c) => RANKS[c % 13] + SUITS[Math.floor(c / 13)];
  const isRed = (c) => { const s = Math.floor(c / 13); return s === 1 || s === 2; };
  App.cardText = cardText; App.cardRed = isRed;

  // ---------- poker hands: the best five of seven cards, as one number (bigger is better) ----------
  const HAND = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"];
  const score = (cat, ks) => { let v = cat; for (let k = 0; k < 5; k++) v = v * 13 + (ks[k] || 0); return v; };
  const catOf = (v) => Math.floor(v / 371293); // 13^5
  function straightTop(mask) {
    for (let h = 12; h >= 4; h--) { let ok = true; for (let k = 0; k < 5; k++) if (!(mask & (1 << (h - k)))) { ok = false; break; } if (ok) return h; }
    return mask & (1 << 12) && (mask & 0xf) === 0xf ? 3 : -1; // the wheel: A-2-3-4-5
  }
  function eval7(cards) {
    const cnt = new Array(13).fill(0), suits = [0, 0, 0, 0], sm = [0, 0, 0, 0];
    let mask = 0;
    for (const c of cards) { const r = c % 13, s = Math.floor(c / 13); cnt[r]++; suits[s]++; sm[s] |= 1 << r; mask |= 1 << r; }
    for (let s = 0; s < 4; s++) if (suits[s] >= 5) { const t = straightTop(sm[s]); if (t >= 0) return score(8, [t]); }
    const by = (n) => { const o = []; for (let r = 12; r >= 0; r--) if (cnt[r] === n) o.push(r); return o; };
    const quads = by(4), trips = by(3), pairs = by(2);
    const kick = (ex, n) => { const o = []; for (let r = 12; r >= 0 && o.length < n; r--) if (cnt[r] && !ex.includes(r)) o.push(r); return o; };
    if (quads.length) return score(7, [quads[0]].concat(kick([quads[0]], 1)));
    if (trips.length && (trips.length > 1 || pairs.length)) return score(6, [trips[0], trips.length > 1 ? Math.max(trips[1], pairs[0] == null ? -1 : pairs[0]) : pairs[0]]);
    for (let s = 0; s < 4; s++) if (suits[s] >= 5) { const o = []; for (let r = 12; r >= 0 && o.length < 5; r--) if (sm[s] & (1 << r)) o.push(r); return score(5, o); }
    const t = straightTop(mask);
    if (t >= 0) return score(4, [t]);
    if (trips.length) return score(3, [trips[0]].concat(kick([trips[0]], 2)));
    if (pairs.length >= 2) return score(2, [pairs[0], pairs[1]].concat(kick([pairs[0], pairs[1]], 1)));
    if (pairs.length) return score(1, [pairs[0]].concat(kick([pairs[0]], 3)));
    return score(0, kick([], 5));
  }
  App.pokerEval = eval7; App.pokerHand = (v) => HAND[catOf(v)];
  // how often a hand wins against n others, by dealing out the rest at random a number of times
  function equity(hole, board, nOpp, runs) {
    const used = new Set(hole.concat(board)), rest = range(0, 51).filter((c) => !used.has(c));
    let win = 0;
    for (let k = 0; k < runs; k++) {
      shuffle(rest);
      let p = 0;
      const b = board.concat(rest.slice(p, p + 5 - board.length)); p += 5 - board.length;
      const me = eval7(hole.concat(b));
      let best = 0, tie = 0;
      for (let o = 0; o < nOpp; o++) { const v = eval7([rest[p++], rest[p++]].concat(b)); if (v > best) best = v; }
      if (me > best) win += 1; else if (me === best) win += 0.5;
    }
    return win / runs;
  }

  // ---------- the casinos and their tables ----------
  const GAME_NAME = { poker: "Texas Hold'em", blackjack: "Blackjack", roulette: "Roulette", bingo: "Bingo" };
  App.CASINO_GAMES = GAME_NAME;
  // a lobby with the slot machines, and a room for each game; the poker room has two tables for six and three
  // big tables for nine where the nightly tournament is played
  // (the tables are made 2.4 times the kit's size across and 1.8 times as high, the slot machines 2.6 times:
  // a Tickle is three blocks tall; the rooms are as big as they need to be for them)
  const KT = 2.4, KTY = 1.8, KS = 2.6;
  // the size of each kind of table in the room (measured on the models: a kit unit is 0.0064 of a block), big
  // enough that the players stand right at its edge and the cards lie on its felt
  const K0 = 0.0064;
  App.CASINO_SCALE = { poker: [4.4, 2.1, 4.4], big: [3.95, 2.1, 3.95], blackjack: [4.4, 2.1, 4.4], roulette: [4.0, 2.1, 4.0], wheel: [3.0, 2.1, 3.0], slot: KS, cage: 3.4 };
  const ROOMS = (App.CASINO_ROOMS = [{ name: "The slot machine hall and bar", w: 64, d: 42 }, { name: "The poker room", w: 96, d: 66 }, { name: "The blackjack room", w: 60, d: 39 }, { name: "The roulette room", w: 72, d: 42 }, { name: "The bingo hall", w: 72, d: 54 }]);
  const TABLES = [
    { key: "poker0", kind: "poker", n: 0, room: 1, x: -22.5, z: 18, seats: 6 }, { key: "poker1", kind: "poker", n: 1, room: 1, x: 22.5, z: 18, seats: 6 },
    { key: "tour0", kind: "poker", n: 0, room: 1, x: -33, z: -12, seats: 9, big: true, tour: true }, { key: "tour1", kind: "poker", n: 1, room: 1, x: 0, z: -12, seats: 9, big: true, tour: true }, { key: "tour2", kind: "poker", n: 2, room: 1, x: 33, z: -12, seats: 9, big: true, tour: true },
    { key: "blackjack0", kind: "blackjack", n: 0, room: 2, x: -14.25, z: 1.5, seats: 5 }, { key: "blackjack1", kind: "blackjack", n: 1, room: 2, x: 14.25, z: 1.5, seats: 5 },
    { key: "roulette0", kind: "roulette", n: 0, room: 3, x: -17.25, z: 0, seats: 8 }, { key: "roulette1", kind: "roulette", n: 1, room: 3, x: 17.25, z: 0, seats: 8 },
    { key: "bingo0", kind: "bingo", n: 0, room: 4, x: 0, z: -18, seats: 36 },
  ];
  // the slot machine hall: machines along the right wall and back to back on an island in the middle; the bar
  // along the left wall, with its stools
  const SLOTS = [];
  for (let j = 0; j < 8; j++) SLOTS.push({ x: 29.4, z: -14 + j * 3.5, rot: -Math.PI / 2 });
  // two islands, each two rows back to back, the machines side by side
  for (const [zA, zB] of [[-9.6, -6.4], [6.4, 9.6]]) for (let i = 0; i < 10; i++) { SLOTS.push({ x: -8 + i * 2.8, z: zA, rot: Math.PI }); SLOTS.push({ x: -8 + i * 2.8, z: zB, rot: 0 }); }
  const BAR = { x: -21, z0: -12, z1: 12, stools: [] };
  for (let k = 0; k < 7; k++) BAR.stools.push({ x: -17.8, z: -10 + k * 3.33 });
  const TP = {};
  for (const d of TABLES) TP[d.key] = d;
  function tablesOf(Cs) {
    if (!Cs.tables) Cs.tables = TABLES.map((d) => ({ kind: d.kind, n: d.n, key: d.key, def: d, casino: Cs, seats: new Array(d.seats).fill(null), phase: "idle", next: 0, log: [], round: 0 }));
    return Cs.tables;
  }
  App.casinoTables = tablesOf;
  App.initCasinos = (saved) => {
    st.casinoLog = Object.assign({ rounds: 0, house: 0, best: null, played: 0 }, (saved && saved.casinoLog) || {});
    st.casinoBank = (saved && saved.casinoBank) || {};
    if (saved && saved.refund) for (const [id, n] of saved.refund) give(id, n);
  };
  // whatever is on the tables when the game is saved goes back to its owners next time (the tables are not saved)
  App.saveCasinos = () => {
    const refund = [];
    for (const Cs of App.casinos || []) for (const T of Cs.tables || []) for (const S of T.seats) {
      if (!S) continue;
      const n = (T.kind === "poker" ? S.stack + (S.bet || 0) : 0) + (T.kind === "blackjack" ? S.bet || 0 : 0) + (T.kind === "roulette" ? (S.bets || []).reduce((a, b) => a + b.a, 0) : 0);
      if (n > 0) refund.push([S.id, n]);
    }
    return { casinoLog: st.casinoLog, casinoBank: st.casinoBank, refund };
  };
  const house = (Cs, n) => { st.casinoBank[Cs.i] = (st.casinoBank[Cs.i] || 0) + n; st.casinoLog.house += n; };
  const say = (T, text) => { T.log.unshift(text); if (T.log.length > 9) T.log.length = 9; };
  // a big win is news
  function bigWin(T, id, n) {
    if (n < 25) return;
    if (!st.casinoLog.best || n > st.casinoLog.best.n) st.casinoLog.best = { id, n, game: T.kind, casino: T.casino.i };
    const near = Math.hypot(T.casino.x - App.cam.target.x, T.casino.z - App.cam.target.z) < 600 || (App.isMine && App.isMine(id));
    if (near) App.log("casino", nm(id) + " won " + Math.round(n) + " shells at " + GAME_NAME[T.kind].toLowerCase() + " in " + T.casino.name + "!", "", { who: [id] });
  }

  // ---------- who comes tonight ----------
  function casinoNear(v) {
    if (v._casino !== undefined) return v._casino;
    let best = null, bd = 380;
    for (const Cs of App.casinos || []) if (Cs.region === v.region) { const d = Math.hypot(Cs.x - v.x, Cs.z - v.z); if (d < bd) { bd = d; best = Cs; } }
    return (v._casino = best);
  }
  // the staff: a dealer for each table, from the village nearest the casino; every night
  const STAFF = TABLES.length + 5; // a dealer for each table, two bartenders and three waiters
  App.CASINO_STAFF = { dealers: TABLES.length, bartenders: 2, waiters: 3 };
  function staffOf(Cs) {
    if (Cs.staff && Cs.staffWallet === st.wallet) return Cs.staff;
    const vs = App.villages.filter((o) => o.region === Cs.region).sort((a, b) => Math.hypot(a.x - Cs.x, a.z - Cs.z) - Math.hypot(b.x - Cs.x, b.z - Cs.z)).slice(0, 2);
    const pool = [];
    for (const v of vs) for (const id of v.residents) if (!(App.heroOf && App.heroOf(id)) && !(App.isAdventurer && App.isAdventurer(id)) && !(App.isMine && App.isMine(id))) pool.push(id);
    Cs.staff = pool.sort((a, b) => hash2(a, Cs.i, 337) - hash2(b, Cs.i, 337)).slice(0, STAFF);
    Cs.staffWallet = st.wallet;
    return Cs.staff;
  }
  App.casinoStaff = staffOf;
  // the plan hook (population.js): a night at the casino, for the gamblers and now and then for others
  App.casinoVisit = (id, day) => {
    if (!App.casinos || !App.casinos.length) return null;
    const v = App.villageOfToken(id), Cs = casinoNear(v);
    if (!Cs) return null;
    const walk = Math.min(170, (Math.hypot(v.x - Cs.door.x, v.z - Cs.door.z) * 1.25) / (App.WALK_SPEED || 2.1));
    if (staffOf(Cs).includes(id)) return { Cs, s: Math.max(17 * 60, OPEN - 10 - walk), e: CLOSE, staff: true };
    const F = App.factionOf ? App.factionOf(id) : null, h = hash2(id, day, 331);
    // a gambler who is betting at the arena tonight stays there
    const go = F === "gamblers" ? hash2(id, day, 177) >= 0.55 && h < 0.6 : h < 0.035 && sh(id) >= 25;
    if (!go || (App.heroOf && App.heroOf(id))) return null;
    return { Cs, s: Math.max(17 * 60 + 30, OPEN - walk + hash2(id, day, 333) * 40), e: CLOSE - hash2(id, day, 335) * 60 };
  };
  // tonight's guests of a casino, with when they get there and when they leave
  function guestsOf(Cs, day) {
    if (Cs.guests && Cs.guests.day === day) return Cs.guests.list;
    const list = [];
    for (const v of App.villages) if (v.region === Cs.region && casinoNear(v) === Cs) for (const id of v.residents) {
      const g = App.casinoVisit(id, day);
      if (!g || g.Cs !== Cs) continue;
      const step = App.planOf(id, day).steps.find((s) => s.k === "casino");
      if (step) list.push({ id, arrive: step.s + (step.travel || 0), leave: step.e, staff: !!g.staff });
    }
    Cs.guests = { day, list };
    return list;
  }
  App.casinoGuests = (Cs) => guestsOf(Cs, Math.floor(st.T / DAY));
  // what a guest would rather play (each has its favourite); the gamblers like poker and the wheel
  function prefs(id) {
    // (about one in four would rather sit at a slot machine than at a table)
    const g = ["poker", "blackjack", "roulette", "bingo"], h = hash2(id, 339, 3);
    if (h >= 0.76) return ["slots"];
    const first = h < 0.22 ? "poker" : h < 0.42 ? "blackjack" : h < 0.6 ? "roulette" : "bingo";
    return [first].concat(shuffle(g.filter((k) => k !== first)));
  }
  const seated = (T, id) => T.seats.findIndex((s) => s && s.id === id);
  function seatAt(T, id, player) {
    const k = T.seats.findIndex((s) => !s);
    if (k < 0) return null;
    const S = { id, player: !!player, bet: 0, contrib: 0, cards: [], stack: 0, folded: true, out: false, bets: [], tickets: [] };
    if (T.kind === "poker") { S.stack = Math.min(Math.floor(sh(id)), player ? 120 : 60); take(id, S.stack); if (S.stack < 4) { give(id, S.stack); return null; } }
    T.seats[k] = S;
    return S;
  }
  function stand(T, k) {
    const S = T.seats[k];
    if (!S) return;
    if (T.kind === "poker" && S.stack > 0 && !S.tour) give(S.id, S.stack); // tournament chips are not shells
    T.seats[k] = null;
    if (st.casinoMe && st.casinoMe.id === S.id) st.casinoMe = null;
  }

  // ---------- blackjack ----------
  function bjVal(cards) { let v = 0, aces = 0; for (const c of cards) { const r = c % 13; if (r === 12) { aces++; v += 11; } else v += r >= 8 ? 10 : r + 2; } while (v > 21 && aces) { v -= 10; aces--; } return { v, soft: aces > 0 }; }
  App.bjValue = (cards) => bjVal(cards).v;
  const upVal = (c) => { const r = c % 13; return r === 12 ? 11 : r >= 8 ? 10 : r + 2; };
  // the basic strategy (without splitting): what every Tickle at the table plays
  function bjAI(cards, up) {
    const { v, soft } = bjVal(cards);
    if (cards.length === 2 && !soft && (v === 11 || (v === 10 && up <= 9) || (v === 9 && up >= 3 && up <= 6))) return "double";
    if (soft) { if (v >= 19) return "stand"; if (v === 18) return up >= 9 ? "hit" : "stand"; return "hit"; }
    if (v >= 17) return "stand"; if (v >= 13) return up <= 6 ? "stand" : "hit"; if (v === 12) return up >= 4 && up <= 6 ? "stand" : "hit";
    return "hit";
  }
  function draw(T) { if (!T.shoe || T.shoe.length < 60) { T.shoe = shuffle([].concat(range(0, 51), range(0, 51), range(0, 51), range(0, 51))); say(T, "The dealer shuffles a fresh shoe."); } return T.shoe.pop(); }
  function stepBlackjack(T) {
    const players = () => T.seats.filter((S) => S && S.bet > 0);
    if (T.phase === "idle" || T.phase === "done") {
      for (let k = 0; k < T.seats.length; k++) if (T.seats[k] && T.seats[k].out) stand(T, k);
      if (!T.seats.some(Boolean)) { T.phase = "idle"; T.next = st.T + 1; return; }
      T.phase = "bets"; T.round++; T.dealer = []; T.hide = true; T.next = st.T + 2.5;
      for (const S of T.seats) if (S) { S.cards = []; S.bet = 0; S.done = false; S.result = ""; if (!S.player) { const b = Math.max(1, Math.min(10, Math.round(sh(S.id) * (App.factionOf(S.id) === "gamblers" ? 0.12 : 0.07)))); if (sh(S.id) >= b) { S.bet = b; take(S.id, b); } else S.out = true; } }
      return;
    }
    if (T.phase === "bets") {
      // the player gets a little longer to put its chips down
      const me = T.seats.find((S) => S && S.player);
      if (me && !me.bet && !T.waited && st.T < T.next + 2) { T.waited = true; T.next = st.T + 2; return; }
      T.waited = false;
      if (!players().length) { T.phase = "done"; T.next = st.T + 1; return; }
      for (const S of players()) S.cards = [draw(T), draw(T)];
      T.dealer = [draw(T), draw(T)];
      const dv = bjVal(T.dealer).v === 21;
      if (dv) { T.hide = false; say(T, "The dealer has blackjack."); return settleBJ(T); }
      for (const S of players()) if (bjVal(S.cards).v === 21) { S.done = true; S.result = "Blackjack!"; const w = S.bet * 2.5; give(S.id, w); house(T.casino, S.bet - w); bigWin(T, S.id, w - S.bet); say(T, nm(S.id) + " has blackjack and wins " + (w - S.bet) + " shells."); S.bet = 0; S.paid = true; }
      T.phase = "play"; T.turn = 0; T.next = st.T + 1;
      return;
    }
    if (T.phase === "play") {
      const order = T.seats.map((S, k) => k).filter((k) => T.seats[k] && T.seats[k].bet > 0 && !T.seats[k].done);
      if (!order.length) { T.phase = "dealer"; T.hide = false; T.next = st.T + 1; return; }
      const S = T.seats[order[0]];
      T.turn = order[0];
      if (S.player) { if (S.action) { bjAct(T, S, S.action); S.action = null; } T.next = st.T + 0.2; return; }
      bjAct(T, S, bjAI(S.cards, upVal(T.dealer[0])));
      T.next = st.T + 0.8;
      return;
    }
    if (T.phase === "dealer") {
      if (bjVal(T.dealer).v < 17 && T.seats.some((S) => S && S.bet > 0 && bjVal(S.cards).v <= 21)) { T.dealer.push(draw(T)); T.next = st.T + 0.8; return; }
      return settleBJ(T);
    }
  }
  function bjAct(T, S, a) {
    if (a === "double" && S.cards.length === 2 && sh(S.id) >= S.bet) { take(S.id, S.bet); S.bet *= 2; S.cards.push(draw(T)); S.done = true; say(T, nm(S.id) + " doubles down."); }
    else if (a === "hit" || a === "double") { S.cards.push(draw(T)); if (bjVal(S.cards).v >= 21) S.done = true; }
    else S.done = true;
    if (bjVal(S.cards).v > 21) { S.result = "Bust"; house(T.casino, S.bet); say(T, nm(S.id) + " busts with " + bjVal(S.cards).v + "."); S.bet = 0; }
  }
  function settleBJ(T) {
    const d = bjVal(T.dealer).v;
    for (const S of T.seats) {
      if (!S || !(S.bet > 0)) continue;
      const v = bjVal(S.cards).v, bj = d === 21 && T.dealer.length === 2;
      let w = 0;
      if (v > 21) w = 0; else if (bj) w = S.cards.length === 2 && v === 21 ? S.bet : 0; else if (d > 21 || v > d) w = S.bet * 2; else if (v === d) w = S.bet;
      S.result = w > S.bet ? "Wins " + (w - S.bet) : w === S.bet ? "Push" : "Loses";
      if (w) give(S.id, w);
      house(T.casino, S.bet - w);
      if (w > S.bet) bigWin(T, S.id, w - S.bet);
      S.bet = 0;
    }
    say(T, "Dealer: " + (d > 21 ? "bust with " + d : d) + ".");
    T.phase = "done"; T.next = st.T + 2.5; st.casinoLog.rounds++;
  }

  // ---------- roulette ----------
  const colourOf = (n) => (n === 0 ? "green" : REDS.has(n) ? "red" : "black");
  function betWins(b, n) {
    if (b.t === "n") return b.n === n ? 36 : 0;
    if (n === 0) return 0;
    if (b.t === "red") return REDS.has(n) ? 2 : 0; if (b.t === "black") return !REDS.has(n) ? 2 : 0;
    if (b.t === "even") return n % 2 === 0 ? 2 : 0; if (b.t === "odd") return n % 2 === 1 ? 2 : 0;
    if (b.t === "low") return n <= 18 ? 2 : 0; if (b.t === "high") return n >= 19 ? 2 : 0;
    if (b.t === "dz") return Math.floor((n - 1) / 12) === b.d ? 3 : 0;
    if (b.t === "col") return (n - 1) % 3 === b.c ? 3 : 0;
    return 0;
  }
  const betName = (b) => (b.t === "n" ? "number " + b.n : b.t === "dz" ? ["1st", "2nd", "3rd"][b.d] + " dozen" : b.t === "col" ? ["1st", "2nd", "3rd"][b.c] + " column" : b.t);
  App.rouletteBetName = betName;
  function stepRoulette(T) {
    if (T.phase === "idle" || T.phase === "result") {
      for (let k = 0; k < T.seats.length; k++) if (T.seats[k] && T.seats[k].out) stand(T, k);
      if (!T.seats.some(Boolean)) { T.phase = "idle"; T.next = st.T + 1; return; }
      T.phase = "bets"; T.round++; T.next = st.T + 4;
      for (const S of T.seats) if (S) { S.bets = []; S.result = ""; if (!S.player) {
        const n = 1 + (rnd() < 0.4 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const a = Math.max(1, Math.min(App.factionOf(S.id) === "gamblers" ? 8 : 4, Math.round(sh(S.id) * 0.05)));
          if (sh(S.id) < a) { S.out = true; break; }
          const q = rnd(), b = q < 0.6 ? { t: ["red", "black", "even", "odd", "low", "high"][Math.floor(rnd() * 6)] } : q < 0.85 ? { t: "dz", d: Math.floor(rnd() * 3) } : { t: "n", n: Math.floor(rnd() * 37) };
          b.a = a; take(S.id, a); S.bets.push(b);
        }
      } }
      say(T, "Place your bets!");
      return;
    }
    if (T.phase === "bets") { T.phase = "spin"; T.spinStart = st.T; T.result = Math.floor(rnd() * 37); T.next = st.T + 2; say(T, "No more bets. The ball is spinning..."); return; }
    if (T.phase === "spin") {
      const n = T.result;
      T.last = (T.last || []); T.last.unshift(n); if (T.last.length > 12) T.last.length = 12;
      say(T, n + " " + colourOf(n) + "!");
      for (const S of T.seats) {
        if (!S || !S.bets.length) continue;
        let paid = 0, staked = 0;
        for (const b of S.bets) { staked += b.a; paid += b.a * betWins(b, n); }
        if (paid) give(S.id, paid);
        house(T.casino, staked - paid);
        S.result = paid > staked ? "Wins " + (paid - staked) : paid ? "Gets " + paid + " back" : "Loses " + staked;
        if (paid - staked > 0) { bigWin(T, S.id, paid - staked); if (paid - staked >= 10) say(T, nm(S.id) + " wins " + (paid - staked) + " shells."); }
        S.lastBets = S.bets; S.bets = [];
      }
      T.phase = "result"; T.next = st.T + 2.5; st.casinoLog.rounds++;
    }
  }
  App.rouletteColour = colourOf;

  // ---------- bingo (90 balls) ----------
  function ticket() {
    const cols = Array.from({ length: 9 }, () => []), grid = [new Array(9).fill(null), new Array(9).fill(null), new Array(9).fill(null)];
    for (let r = 0; r < 3; r++) for (const c of shuffle(range(0, 8)).slice(0, 5)) cols[c].push(r);
    for (let c = 0; c < 9; c++) { if (!cols[c].length) continue; const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9; const pool = shuffle(range(lo, hi)).slice(0, cols[c].length).sort((a, b) => a - b); cols[c].sort((a, b) => a - b).forEach((r, k) => (grid[r][c] = pool[k])); }
    return grid;
  }
  const rowDone = (row, drawn) => row.every((n) => n == null || drawn.has(n));
  const PRICE = 2;
  function stepBingo(T) {
    if (T.phase === "idle" || T.phase === "done") {
      for (let k = 0; k < T.seats.length; k++) if (T.seats[k] && T.seats[k].out) stand(T, k);
      if (!T.seats.some(Boolean)) { T.phase = "idle"; T.next = st.T + 1; return; }
      T.phase = "sell"; T.round++; T.next = st.T + 4; T.pot = 0; T.drawn = []; T.drawnSet = new Set(); T.balls = shuffle(range(1, 90)); T.lineWon = false; T.winners = null;
      for (const S of T.seats) if (S) { S.tickets = []; S.result = ""; if (!S.player) { const n = sh(S.id) >= 10 && rnd() < 0.4 ? 2 : 1; for (let k = 0; k < n && sh(S.id) >= PRICE; k++) { take(S.id, PRICE); T.pot += PRICE; S.tickets.push(ticket()); } if (!S.tickets.length) S.out = true; } }
      say(T, "Tickets on sale: " + PRICE + " shells each.");
      return;
    }
    if (T.phase === "sell") {
      if (!T.pot) { T.phase = "done"; T.next = st.T + 2; return; }
      T.phase = "draw"; T.next = st.T + 0.4; say(T, "Eyes down! The pot is " + T.pot + " shells."); return;
    }
    if (T.phase === "draw") {
      const n = T.balls.pop();
      T.drawn.push(n); T.drawnSet.add(n);
      // first line, then bingo (a full ticket)
      if (!T.lineWon) {
        const w = []; for (const S of T.seats) if (S) for (const tk of S.tickets) if (tk.some((row) => rowDone(row, T.drawnSet))) { w.push(S); break; }
        if (w.length) { T.lineWon = true; const prize = Math.floor((T.pot * 0.3) / w.length); T.linePaid = prize * w.length; for (const S of w) { give(S.id, prize); S.result = "Line! +" + prize; } say(T, "LINE! " + w.map((S) => nm(S.id)).join(" and ") + " (+" + prize + " shells)"); }
      }
      const b = []; for (const S of T.seats) if (S) for (const tk of S.tickets) if (tk.every((row) => rowDone(row, T.drawnSet))) { b.push(S); break; }
      if (b.length || !T.balls.length) {
        const prize = b.length ? Math.floor((T.pot * 0.6) / b.length) : 0;
        for (const S of b) { give(S.id, prize); S.result = "BINGO! +" + prize; bigWin(T, S.id, prize); }
        house(T.casino, T.pot - prize * b.length - (T.lineWon ? T.linePaid || 0 : 0));
        T.winners = b.map((S) => S.id);
        say(T, b.length ? "BINGO! " + b.map((S) => nm(S.id)).join(" and ") + " win " + prize + " shells." : "No bingo this time.");
        T.phase = "done"; T.next = st.T + 3; st.casinoLog.rounds++;
        return;
      }
      T.next = st.T + 0.35;
    }
  }

  // ---------- poker (Texas Hold'em, fixed limit) ----------
  const SB = 1, BBL = 2;
  const blinds = (T) => (T.tour ? BLINDS[T.tour.level] : [SB, BBL]);
  const betSize = (T) => (T.street < 2 ? 1 : 2) * blinds(T)[1];
  App.casinoBetSize = betSize;
  const live = (T) => T.seats.map((S, k) => k).filter((k) => T.seats[k] && !T.seats[k].folded);
  const nextSeat = (T, k, f) => { for (let i = 1; i <= T.seats.length; i++) { const j = (k + i) % T.seats.length; if (T.seats[j] && f(T.seats[j])) return j; } return -1; };
  function stepPoker(T) {
    if (T.phase === "idle" || T.phase === "end") {
      if (T.tour) {
        // the tournament: whoever has no chips left is out, in the place it finished
        for (let k = 0; k < T.seats.length; k++) { const S = T.seats[k]; if (S && S.stack <= 0) { T.tour.alive.delete(S.id); T.tour.out.push(S.id); say(T, nm(S.id) + " is knocked out (" + ordinal(T.tour.alive.size + 1) + " place)."); stand(T, k); } }
        if (T.tour.alive.size < 2) { T.phase = "idle"; T.board = []; T.next = st.T + 1; return; }
      } else for (let k = 0; k < T.seats.length; k++) { const S = T.seats[k]; if (S && (S.out || S.stack < BBL)) { if (S.stack < BBL && !S.out) say(T, nm(S.id) + " is out of chips and leaves the table."); stand(T, k); } }
      const n = T.seats.filter(Boolean).length;
      if (n < 2) { T.phase = "idle"; T.board = []; T.next = st.T + 1; return; }
      // a new hand: the button moves, the blinds go in, two cards each
      T.round++; T.deck = shuffle(range(0, 51)); T.board = []; T.pot = 0; T.street = 0; T.raises = 0; T.show = false; T.winners = null;
      for (const S of T.seats) if (S) { S.cards = [T.deck.pop(), T.deck.pop()]; S.folded = false; S.bet = 0; S.contrib = 0; S.acted = false; S.allin = false; S.result = ""; S.hand = ""; }
      T.button = nextSeat(T, T.button == null ? -1 : T.button, () => true);
      const sb = nextSeat(T, T.button, () => true), bb = nextSeat(T, sb, () => true);
      const [b1, b2] = blinds(T);
      put(T, T.seats[sb], b1); put(T, T.seats[bb], b2);
      T.cur = b2; T.toAct = nextSeat(T, bb, (S) => !S.folded && !S.allin);
      T.phase = "bet"; T.next = st.T + 1;
      return;
    }
    if (T.phase === "bet") {
      const S = T.seats[T.toAct];
      if (!S || S.folded || S.allin) { advance(T); return; }
      // the player decides; in the tournament, with its window closed, its Tickle plays on by itself
      if (S.player && !(T.tour && !(win && win.key === T.key))) { if (S.action) { pokerAct(T, S, S.action); S.action = null; advance(T); } T.next = st.T + 0.2; return; }
      pokerAct(T, S, pokerAI(T, S));
      advance(T);
      T.next = st.T + (T.tour ? 0.45 : 0.7);
      return;
    }
    if (T.phase === "show") { T.phase = "end"; T.next = st.T + (T.tour ? 2 : 3); }
  }
  function put(T, S, n) { n = Math.min(n, S.stack); S.stack -= n; S.bet += n; S.contrib += n; if (!S.stack) S.allin = true; }
  function pokerAct(T, S, a) {
    const toCall = T.cur - S.bet;
    if (a === "fold" && toCall > 0) { S.folded = true; say(T, nm(S.id) + " folds."); }
    else if (a === "raise" && T.raises < 3 && S.stack > toCall) { T.cur += betSize(T); put(T, S, T.cur - S.bet); T.raises++; for (const o of T.seats) if (o && o !== S) o.acted = false; say(T, nm(S.id) + (toCall ? " raises to " : " bets ") + T.cur + "."); }
    else if (toCall > 0) { put(T, S, toCall); say(T, nm(S.id) + " calls" + (S.allin ? " (all in)" : "") + "."); }
    else say(T, nm(S.id) + " checks.");
    S.acted = true;
  }
  // a Tickle at the table: how likely its hand is to win, against what it costs to stay in
  function pokerAI(T, S) {
    const opp = live(T).length - 1, toCall = T.cur - S.bet, pot = T.pot + T.seats.reduce((a, o) => a + (o ? o.bet : 0), 0);
    const eq = equity(S.cards, T.board, Math.max(1, opp), 70) + (App.factionOf(S.id) === "gamblers" ? 0.04 : 0) + (rnd() - 0.5) * 0.08;
    const canRaise = T.raises < 3 && S.stack > toCall;
    if (canRaise && eq > 0.6 + T.raises * 0.08 - (opp > 2 ? 0.12 : 0)) return "raise";
    if (toCall === 0) return canRaise && eq > 0.52 && rnd() < 0.5 ? "raise" : "check";
    return eq >= toCall / (pot + toCall) + 0.03 || rnd() < 0.06 ? "call" : "fold";
  }
  function advance(T) {
    const L = live(T);
    if (L.length === 1) return payout(T, L);
    const need = L.filter((k) => !T.seats[k].allin && (!T.seats[k].acted || T.seats[k].bet < T.cur));
    if (need.length) { T.toAct = nextSeat(T, T.toAct, (S) => !S.folded && !S.allin && (!S.acted || S.bet < T.cur)); return; }
    // the street is over: the bets go into the pot and the next cards come out
    for (const S of T.seats) if (S) { T.pot += S.bet; S.bet = 0; S.acted = false; }
    T.cur = 0; T.raises = 0;
    if (T.street === 3) return payout(T, L);
    T.street++;
    if (T.street === 1) T.board.push(T.deck.pop(), T.deck.pop(), T.deck.pop()); else T.board.push(T.deck.pop());
    say(T, ["", "The flop: ", "The turn: ", "The river: "][T.street] + T.board.map(cardText).join(" "));
    const canAct = L.filter((k) => !T.seats[k].allin);
    if (canAct.length < 2) { while (T.board.length < 5) T.board.push(T.deck.pop()); T.street = 3; return payout(T, L); }
    T.toAct = nextSeat(T, T.button, (S) => !S.folded && !S.allin);
  }
  // the showdown: the best hand takes each pot (side pots for those all in), less a small rake for the house
  function payout(T, L) {
    for (const S of T.seats) if (S) { T.pot += S.bet; S.bet = 0; }
    const rake = T.tour ? 0 : Math.min(3, Math.floor(T.pot * 0.05));
    house(T.casino, rake);
    const sc = {};
    if (L.length > 1) { T.show = true; for (const k of L) { sc[k] = eval7(T.seats[k].cards.concat(T.board)); T.seats[k].hand = HAND[catOf(sc[k])]; } }
    const contribs = T.seats.map((S) => (S ? S.contrib || 0 : 0)), levels = [...new Set(contribs.filter((c) => c > 0))].sort((a, b) => a - b);
    const won = {};
    let prev = 0, left = rake;
    for (const lv of levels) {
      let pot = 0;
      for (const c of contribs) pot += Math.max(0, Math.min(c, lv) - prev);
      // (a pot only folded players put in goes to whoever is left)
      const elig = L.filter((k) => contribs[k] >= lv).length ? L.filter((k) => contribs[k] >= lv) : L;
      prev = lv;
      const take2 = Math.min(left, pot); pot -= take2; left -= take2;
      const best = L.length > 1 ? Math.max(...elig.map((k) => sc[k])) : null, win = L.length > 1 ? elig.filter((k) => sc[k] === best) : elig;
      for (const k of win) won[k] = (won[k] || 0) + pot / win.length;
    }
    for (const k in won) { const S = T.seats[k], n = Math.round(won[k]); S.stack += n; S.result = "Wins " + n + (S.hand ? " with " + S.hand.toLowerCase() : ""); bigWin(T, S.id, n - S.contrib); }
    T.winners = Object.keys(won).map(Number);
    if (T.winners.length) say(T, T.winners.map((k) => nm(T.seats[k].id)).join(" and ") + " win" + (T.winners.length === 1 ? "s" : "") + " the pot of " + T.pot + (T.show && T.seats[T.winners[0]].hand ? " (" + T.seats[T.winners[0]].hand.toLowerCase() + ")" : "") + ".");
    T.pot = 0; T.phase = "show"; T.next = st.T + 0.5; st.casinoLog.rounds++;
  }

  const STEP = { poker: stepPoker, blackjack: stepBlackjack, roulette: stepRoulette, bingo: stepBingo };
  // ---------- the poker tournament: every night at 20:30 on the big tables of the poker room ----------
  // Buy-in 10 shells; everyone starts with 80 chips; the blinds go up every eight minutes; tables are merged as
  // players are knocked out, down to a final table, until one has all the chips. The pool (less a tenth for the
  // house) goes 50/30/20 to the first three (65/35 with fewer than nine players, all to the winner with four).
  const TOUR_START = 20 * 60 + 30, BUYIN = 10, LEVEL = 8, CHIPS = 80;
  const BLINDS = [[1, 2], [2, 4], [3, 6], [5, 10], [8, 16], [12, 24], [20, 40], [30, 60], [50, 100], [80, 160], [120, 240], [200, 400]];
  const ordinal = (n) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
  function tourOf(Cs, day) {
    if (!Cs.tour || (Cs.tour.day !== day && (!Cs.tour.started || Cs.tour.done))) Cs.tour = { day, reg: new Set(), pool: 0, started: false, done: false, alive: new Set(), out: [], level: 0 };
    return Cs.tour;
  }
  App.casinoTour = (Cs) => tourOf(Cs, Math.floor(st.T / DAY));
  App.CASINO_TOUR = { start: TOUR_START, buyin: BUYIN, chips: CHIPS, level: LEVEL, blinds: BLINDS };
  function tourTick(Cs, day, m) {
    const R = tourOf(Cs, day), tabs = tablesOf(Cs).filter((t) => t.def.tour);
    if (R.done) return;
    if (!R.started) {
      if (m < TOUR_START) return;
      if (R.reg.size < 4) { for (const id of R.reg) give(id, BUYIN); R.done = true; R.cancelled = true; return; }
      // shuffle up and deal: the players spread over as many tables as they need
      R.started = true; R.t0 = st.T; R.n = R.reg.size;
      const ids = shuffle([...R.reg]), nT = Math.ceil(ids.length / 9);
      ids.forEach((id, k) => {
        const T = tabs[k % nT], j = T.seats.findIndex((x) => !x), me = !!(st.casinoTourMe && st.casinoTourMe.c === Cs.i && st.casinoTourMe.id === id);
        T.seats[j] = { id, player: me, tour: true, bet: 0, contrib: 0, cards: [], stack: CHIPS, folded: true, out: false, bets: [], tickets: [] };
        R.alive.add(id);
        if (me) st.casinoMe = { c: Cs.i, key: T.key, id, tour: true };
      });
      for (const T of tabs) { T.tour = R; T.phase = "idle"; T.next = st.T + 1; T.button = null; T.log = []; if (T.seats.some(Boolean)) say(T, "The tournament begins: " + R.n + " players, " + R.pool + " shells in the prize pool."); }
      return;
    }
    R.level = Math.min(BLINDS.length - 1, Math.floor((st.T - R.t0) / LEVEL));
    // half an hour after closing it is decided on chips: the rest go out from the shortest stack up
    if (R.alive.size > 1 && st.T - R.t0 > CLOSE + 30 - TOUR_START) {
      const stacks = []; for (const T of tabs) T.seats.forEach((S, k) => { if (S) stacks.push([S, T, k]); });
      stacks.sort((a, b) => (a[0].stack + a[0].contrib) - (b[0].stack + b[0].contrib));
      for (const [S, T, k] of stacks.slice(0, -1)) { R.alive.delete(S.id); R.out.push(S.id); stand(T, k); }
      say(stacks[stacks.length - 1][1], "Closing time: the tournament is decided on chips.");
    }
    if (R.alive.size <= 1) return finishTour(Cs, R, tabs);
    // as players go out, the table with the fewest is broken up (between hands) and its players fill the others
    const used = tabs.filter((T) => T.seats.some(Boolean)), need = Math.ceil(R.alive.size / 9);
    if (used.length > need) {
      const brk = used.slice().sort((a, b) => a.seats.filter(Boolean).length - b.seats.filter(Boolean).length)[0];
      if (brk.phase === "idle" || brk.phase === "end") {
        for (let k = 0; k < brk.seats.length; k++) {
          const S = brk.seats[k];
          if (!S) continue;
          const to = used.filter((T) => T !== brk && T.seats.some((x) => !x)).sort((a, b) => a.seats.filter(Boolean).length - b.seats.filter(Boolean).length)[0];
          if (!to) break;
          const j = to.seats.findIndex((x) => !x);
          S.folded = true; S.cards = []; S.bet = 0; S.contrib = 0; S.result = "";
          to.seats[j] = S; brk.seats[k] = null;
          say(to, nm(S.id) + " joins the table with " + S.stack + " chips.");
          if (S.player && st.casinoMe) st.casinoMe.key = to.key;
        }
        brk.phase = "idle"; brk.board = [];
        say(brk, "This table is broken up: its players move to the others" + (need === 1 ? " (the final table!)" : "") + ".");
      }
    }
  }
  function finishTour(Cs, R, tabs) {
    const winner = [...R.alive][0], order = (winner != null ? [winner] : []).concat(R.out.slice().reverse());
    const fee = Math.round(R.pool * 0.1), pool = R.pool - fee, split = R.n >= 9 ? [0.5, 0.3, 0.2] : R.n >= 5 ? [0.65, 0.35] : [1];
    R.places = order.slice(0, split.length).map((id, k) => { const n = Math.floor(pool * split[k]); give(id, n); return { id, n }; });
    house(Cs, R.pool - R.places.reduce((a, q) => a + q.n, 0));
    for (const T of tabs) { T.seats.fill(null); T.tour = null; T.phase = "idle"; T.board = []; say(T, "The tournament is over: " + nm(winner) + " wins it."); }
    R.done = true; R.winner = winner;
    if (st.casinoMe && st.casinoMe.tour) st.casinoMe = null;
    if (!st.casinoLog.best || R.places[0].n - BUYIN > st.casinoLog.best.n) st.casinoLog.best = { id: winner, n: R.places[0].n - BUYIN, game: "poker", casino: Cs.i };
    const mine = R.places.some((q) => App.isMine && App.isMine(q.id)), near = Math.hypot(Cs.x - App.cam.target.x, Cs.z - App.cam.target.z) < 600;
    if (mine || near || R.n >= 12) App.log("casino", nm(winner) + " won tonight's poker tournament at " + Cs.name + "!", R.n + " players. Prizes: " + R.places.map((q, k) => ordinal(k + 1) + " " + nm(q.id) + " (" + q.n + " shells)").join(", ") + ".", { who: R.places.map((q) => q.id) });
  }
  // the player enters one of its Tickles for tonight's tournament
  App.casinoRegister = (Cs, id) => {
    const R = tourOf(Cs, Math.floor(st.T / DAY));
    if (App.isMine && !(App.canUse ? App.canUse(id) : App.isMine(id))) return "You can only enter one of your own Tickles.";
    if (R.started || R.done) return "Tonight's tournament has already started.";
    if (R.reg.size >= 27) return "The tournament is full.";
    if (R.reg.has(id)) return null;
    if (sh(id) < BUYIN) return nm(id) + " has too few shells for the buy-in.";
    if (st.casinoTourMe && st.casinoTourMe.c === Cs.i) return "One of your Tickles is already entered tonight.";
    take(id, BUYIN); R.reg.add(id); R.pool += BUYIN;
    st.casinoTourMe = { c: Cs.i, id, day: R.day };
    return null;
  };
  // ---------- every frame: guests come and go, the tables play on ----------
  App.casinoTick = () => {
    if (!App.casinos) return;
    const day = Math.floor(st.T / DAY), m = st.T - day * DAY, open = m >= OPEN && m < CLOSE;
    for (const Cs of App.casinos) {
      const tables = tablesOf(Cs), me = st.casinoMe && st.casinoMe.c === Cs.i;
      // closing time: the house pays its staff for the night
      if (m >= CLOSE && Cs.paidDay !== day && Cs.staff) { Cs.paidDay = day; for (const id of Cs.staff) { give(id, WAGE); house(Cs, -WAGE); } }
      const R0 = Cs.tour;
      if (!open && !me && !tables.some((T) => T.seats.some(Boolean)) && !(R0 && R0.started && !R0.done)) continue;
      if (Math.floor(st.T) !== Cs.seatT) {
        Cs.seatT = Math.floor(st.T);
        const guests = open ? guestsOf(Cs, day) : [];
        const here = new Set();
        for (const g of guests) if (!g.staff && m >= g.arrive && m < g.leave && !App.isKO(g.id) && !App.isDead(g.id)) here.add(g.id);
        // a drink or two from the bar for each guest when it comes in: the shells go to the house
        if (!Cs.drank || Cs.drank.day !== day) Cs.drank = { day, ids: new Set() };
        for (const id of here) if (!Cs.drank.ids.has(id)) { Cs.drank.ids.add(id); const n = Math.min(Math.floor(sh(id)), 1 + Math.floor(hash2(id, day, 351) * 3)); if (n > 0) { take(id, n); house(Cs, n); st.casinoLog.drinks = (st.casinoLog.drinks || 0) + n; } }
        // those leaving get up after this round; those arriving sit down at their favourite game with a free seat
        for (const T of tables) T.seats.forEach((S) => { if (S && !S.player && !S.tour && !here.has(S.id)) S.out = true; });
        const sat = new Set(); for (const T of tables) for (const S of T.seats) if (S) sat.add(S.id);
        const R = tourOf(Cs, day);
        Cs.spectators = []; Cs.waiting = [];
        for (const id of here) {
          if (sat.has(id)) continue;
          // entered for the tournament: waits in the poker room for it to start
          if (R.reg.has(id) && !R.started) { Cs.waiting.push(id); continue; }
          const pf = prefs(id);
          if ((pf[0] === "poker" || (App.factionOf(id) === "gamblers" && hash2(id, day, 349) < 0.35)) && !R.started && !R.done && R.reg.size < 27 && sh(id) >= 2 * BUYIN && m < TOUR_START) { take(id, BUYIN); R.reg.add(id); R.pool += BUYIN; Cs.waiting.push(id); continue; }
          let done = false;
          for (const kind of pf) { if (kind === "slots") break; if (sh(id) < (kind === "poker" ? 8 : 2)) continue; const T = tables.filter((t) => t.kind === kind && !t.def.tour).sort((a, b) => b.seats.filter(Boolean).length - a.seats.filter(Boolean).length).find((t) => t.seats.some((x) => !x)); if (T && seatAt(T, id)) { done = true; break; } }
          if (!done) Cs.spectators.push(id);
        }
        if (!open && !me) for (const T of tables) T.seats.forEach((S, k) => { if (S && !S.player && !S.tour) S.out = true; });
      }
      tourTick(Cs, day, m);
      slotTick(Cs);
      for (const T of tables) {
        let n = 0;
        try { while (st.T >= T.next && n++ < 30) STEP[T.kind](T); }
        catch (err) {
          // a table that goes wrong is cleared (the shells on it go back) rather than stopping the world
          console.error("casino table " + T.key, err);
          App._casinoErr = { err: String(err && err.stack), snap: JSON.stringify({ phase: T.phase, street: T.street, toAct: T.toAct, cur: T.cur, pot: T.pot, board: T.board, seats: T.seats.map((S) => S && { id: S.id, stack: S.stack, bet: S.bet, contrib: S.contrib, folded: S.folded, allin: S.allin, acted: S.acted }) }) };
          T.seats.forEach((S, k) => { if (S && T.kind === "blackjack" && S.bet > 0) give(S.id, S.bet); if (S && T.kind === "roulette") for (const b of S.bets || []) give(S.id, b.a); if (S && T.kind === "poker") { S.stack += S.bet || 0; S.bet = 0; } });
          T.phase = "idle"; T.next = st.T + 1; T.board = []; T.pot = 0;
        }
      }
    }
  };

  // ---------- the player at a table ----------
  App.casinoSit = (Cs, key, id) => {
    const T = tablesOf(Cs).find((t) => t.key === key);
    if (!T || id == null) return "No such table.";
    if (T.def.tour) return App.casinoRegister(Cs, id);
    if (App.isMine && !(App.canUse ? App.canUse(id) : App.isMine(id))) return "You can only play with one of your own Tickles.";
    if (st.casinoMe) App.casinoLeave();
    for (const t of tablesOf(Cs)) { const k = seated(t, id); if (k >= 0) stand(t, k); }
    if (sh(id) < (T.kind === "poker" ? 8 : 2)) return App.nameOf(id) + " has too few shells for this table.";
    const S = seatAt(T, id, true);
    if (!S) return "The table is full: wait for a seat.";
    st.casinoMe = { c: Cs.i, key, id };
    if (st.speed > 1) App.setSpeed && App.setSpeed(1);
    if (T.phase === "idle") T.next = st.T;
    return null;
  };
  App.casinoLeave = () => {
    const me = st.casinoMe;
    if (!me) return;
    if (me.slot) { st.casinoMe = null; return; } // a slot machine: nothing is left on it
    const T = tablesOf(App.casinos[me.c]).find((t) => t.key === me.key), k = T ? seated(T, me.id) : -1;
    if (k >= 0) {
      const S = T.seats[k];
      // a hand in play is given up (a blackjack bet stays on the table; poker folds)
      // at poker the hand is folded and the chips already in the pot stay there; it gets up when the hand is over
      if (S.tour) return; // in the tournament there is no leaving: closing the window lets the Tickle play on by itself
      if (T.kind === "poker" && T.phase !== "idle" && T.phase !== "end") { const wasTurn = T.toAct === k && T.phase === "bet" && !S.folded; S.folded = true; S.out = true; S.player = false; st.casinoMe = null; if (wasTurn) advance(T); return; }
      // a bet already in play is lost to the house; one not yet played is taken back
      if (T.kind === "blackjack" && S.bet > 0) { if (T.phase === "bets") give(S.id, S.bet); else house(T.casino, S.bet); S.bet = 0; }
      if (T.kind === "roulette" && S.bets.length) { const n = S.bets.reduce((a, b) => a + b.a, 0); if (T.phase === "bets") give(S.id, n); else house(T.casino, n); S.bets = []; }
      stand(T, k);
    }
    st.casinoMe = null;
  };
  // what the player can do right now at its table
  App.casinoMove = (what, arg) => {
    const me = st.casinoMe;
    if (!me) return;
    const T = tablesOf(App.casinos[me.c]).find((t) => t.key === me.key), S = T && T.seats.find((s) => s && s.player);
    if (!S) return;
    const id = S.id;
    if (T.kind === "blackjack") {
      if (what === "bet" && T.phase === "bets") { const n = Math.min(arg, Math.floor(sh(id))); if (n > 0 && S.bet + n <= 50) { take(id, n); S.bet += n; } }
      else if (what === "clear" && T.phase === "bets" && S.bet) { give(id, S.bet); S.bet = 0; }
      else if (T.phase === "play" && T.seats[T.turn] === S) S.action = what;
    } else if (T.kind === "roulette") {
      if (T.phase !== "bets") return;
      if (what === "bet") { const n = Math.min(arg.a, Math.floor(sh(id))); if (n > 0) { take(id, n); const same = S.bets.find((b) => betName(b) === betName(arg)); if (same) same.a += n; else S.bets.push(Object.assign({}, arg, { a: n })); } }
      else if (what === "clear") { for (const b of S.bets) give(id, b.a); S.bets = []; }
    } else if (T.kind === "bingo") {
      if (what === "ticket" && T.phase === "sell" && S.tickets.length < 3 && sh(id) >= PRICE) { take(id, PRICE); T.pot = (T.pot || 0) + PRICE; S.tickets.push(ticket()); }
    } else if (T.kind === "poker") {
      if (T.phase === "bet" && T.seats[T.toAct] === S) S.action = what;
    }
  };
  App.casinoTable = (Cs, key) => tablesOf(Cs).find((t) => t.key === key);
  // who is where in a room of the casino: the players at its tables, the dealers behind them, and those waiting
  // (the tournament players in the poker room before it starts; the others at the slot machines in the lobby)
  App.casinoOccupants = (Cs, room) => {
    const out = [], L = App.CASINO_LAYOUT, day = Math.floor(st.T / DAY), m = st.T - day * DAY, open = m >= OPEN - 10 && m < CLOSE;
    const all = tablesOf(Cs), staff = staffOf(Cs);
    all.forEach((T, ti) => {
      if (T.def.room !== room) return;
      T.seats.forEach((S, k) => { if (S) out.push({ id: S.id, pose: T.kind === "roulette" ? "stand" : "cards", at: L.seat(T.key, k), table: T.key }); });
      const id = staff[ti];
      if (id != null && !App.isKO(id) && (T.seats.some(Boolean) || (open && !T.def.tour))) out.push({ id, pose: "deal", at: L.dealer(T.key), staff: true, table: T.key });
    });
    if (room === 0) {
      // the guests not at a table: at the slot machines first, then on the bar stools; the bar's own staff
      const sp = Cs.spectators || [];
      sp.slice(0, MY_SLOT).forEach((id, k) => out.push({ id, pose: "slots", at: L.slot(k) }));
      sp.slice(MY_SLOT, MY_SLOT + BAR.stools.length).forEach((id, k) => out.push({ id, pose: "drink", at: L.stool(k) }));
      const tabs = all.filter((T) => T.def.room === 0 && TP[T.key]);
      if (tabs.length) sp.slice(MY_SLOT + BAR.stools.length, MY_SLOT + BAR.stools.length + 10).forEach((id, k) => {
        const P = TP[tabs[k % tabs.length].key], a = App.hash2(id, k, 811) * 6.283, r = (P.big ? 14 : 11.5) + App.hash2(id, k, 813) * 1.5, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
        out.push({ id, pose: "look", at: { x, z, rot: Math.atan2(P.x - x, P.z - z) } });
      });
      // the player's Tickle at its own machine
      if (st.casinoMe && st.casinoMe.slot && st.casinoMe.c === Cs.i) out.push({ id: st.casinoMe.id, pose: "slots", at: L.slot(MY_SLOT) });
      if (open) {
        [staff[TABLES.length], staff[TABLES.length + 1]].forEach((id, k) => { if (id != null && !App.isKO(id)) out.push({ id, pose: "deal", at: { x: BAR.x - 3.2, z: k ? 5 : -5, rot: Math.PI / 2 }, staff: true }); });
        [staff[TABLES.length + 2], staff[TABLES.length + 3], staff[TABLES.length + 4]].forEach((id, k) => { if (id != null && !App.isKO(id)) out.push({ id, pose: "serve", at: { x: BAR.x + 4.5, z: -6 + k * 6, rot: Math.PI / 2 }, staff: true, tag: "waiter" }); });
      }
    }
    if (room === 1) (Cs.waiting || []).slice(0, 12).forEach((id, k) => out.push({ id, pose: "chat", at: L.wait(k) }));
    return out;
  };
  App.CASINO_LAYOUT = {
    rooms: ROOMS, tables: TP, slots: SLOTS, bar: BAR,
    seat(key, k) {
      const P = TP[key];
      if (P.kind === "poker") { const rx = P.big ? 11.4 : 9.0, rz = P.big ? 8.85 : 6.9, a = -Math.PI / 2 + ((k + 1) * 2 * Math.PI) / (P.seats + 1), x = P.x + Math.cos(a) * rx, z = P.z + Math.sin(a) * rz; return { x, z, rot: Math.atan2(P.x - x, P.z - z) }; }
      if (P.kind === "blackjack") { const a = Math.PI * (0.12 + 0.19 * k), x = P.x - Math.cos(a) * 8.4, z = P.z + Math.sin(a) * 6.3; return { x, z, rot: Math.atan2(P.x - x, P.z - z) }; }
      if (P.kind === "roulette") { const sp = [[-7.2, 5.85], [-2.4, 5.85], [2.4, 5.85], [7.2, 5.85], [-7.2, -5.85], [-2.4, -5.85], [2.4, -5.85], [-11.1, 0]][k]; const x = P.x + sp[0], z = P.z + sp[1]; return { x, z, rot: Math.atan2(P.x + sp[0] * 0.6 - x, P.z - z) }; }
      // bingo: three rows of twelve facing the board on the back wall
      const row = Math.floor(k / 12), col = k % 12;
      return { x: -28.9 + col * 5.25, z: P.z + 6.6 + row * 5.1, rot: Math.PI };
    },
    dealer(key) {
      const P = TP[key];
      if (P.kind === "poker") return { x: P.x, z: P.z - (P.big ? 9.6 : 7.5), rot: 0 };
      if (P.kind === "blackjack") return { x: P.x, z: P.z - 5.1, rot: 0 };
      if (P.kind === "roulette") return { x: P.x + 5.55, z: P.z - 6.15, rot: 0 };
      return { x: P.x + 6.9, z: P.z - 3.9, rot: 0 };
    },
    // a player in front of a slot machine; a patron on a bar stool; waiting in the poker room for the tournament
    slot(k) { const M = SLOTS[k % SLOTS.length]; return { x: M.x + Math.sin(M.rot) * 2.8, z: M.z + Math.cos(M.rot) * 2.8, rot: M.rot + Math.PI }; },
    stool(k) { const S = BAR.stools[k % BAR.stools.length]; return { x: S.x + 0.3, z: S.z, rot: -Math.PI / 2 }; },
    // how far the seats are from the middle of a table (to find the place on the felt in front of each)
    seatRadii(key) { const P = TP[key]; return P.kind === "poker" ? (P.big ? { rx: 11.4, rz: 8.85 } : { rx: 9.0, rz: 6.9 }) : P.kind === "blackjack" ? { rx: 8.4, rz: 6.3 } : { rx: 7.4, rz: 5.85 }; },
    // waiting for the tournament: in little knots of two or three, talking, not in a queue
    wait(k) {
      const g = Math.floor(k / 3), j = k % 3, cx = -34 + (g % 4) * 22 + (g >= 4 ? 11 : 0), cz = g >= 4 ? 9 : 1, a = j * 2.09 + g;
      const x = cx + Math.cos(a) * 1.6, z = cz + Math.sin(a) * 1.6;
      return { x, z, rot: Math.atan2(cx - x, cz - z) };
    },
  };
  // the waiters: from the end of the bar to a guest with a tray of drinks and back, along the aisles
  App.casinoWaiters = (cur, dt) => {
    const R = cur.map.rooms[cur.ri];
    if (cur.ri !== 0) return;
    const guests = cur.figures.filter((f) => !f.gone && f.F && f.holder && (f.pose === "slots" || f.pose === "drink"));
    for (const f of cur.figures) {
      if (f.tag !== "waiter" || f.gone) continue;
      if (!f.tray) {
        // the tray, held up in front, with a few glasses on it
        const tray = new THREE.Group(), disc = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), new THREE.MeshLambertMaterial({ color: 0xc8c8c8 }));
        tray.add(disc);
        [0xff8fc0, 0x8fd3f4, 0xffd23f].forEach((c, i) => { const g2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.3, 8), new THREE.MeshLambertMaterial({ color: c })); g2.position.set(Math.cos(i * 2.1) * 0.28, 0.17, Math.sin(i * 2.1) * 0.28); tray.add(g2); });
        tray.position.set(0.4, (f.F.height || 3) * 0.72, 0.95); f.holder.add(tray); f.tray = tray;
        f.wx = f.holder.position.x; f.wz = f.holder.position.z; f.route = []; f.pause = 0;
      }
      if (f.pause > 0) { f.pause -= dt; f.pose = "serve"; continue; }
      if (!f.route.length) {
        // back and forth: to a guest (along an aisle), then back to the bar for the next round
        f.toGuest = !f.toGuest;
        const aisle = (z) => (z < -8 ? -15.5 : z > 8 ? 15.5 : 0);
        if (f.toGuest && guests.length) {
          const g = guests[Math.floor(Math.random() * guests.length)], gx = g.holder.position.x, gz = g.holder.position.z, d = Math.hypot(gx - f.wx, gz - f.wz) || 1;
          const tx = gx - ((gx - f.wx) / d) * 1.8, tz = gz - ((gz - f.wz) / d) * 1.8;
          f.route = [{ x: BAR.x + 4.5, z: aisle(tz) }, { x: tx, z: aisle(tz) }, { x: tx, z: tz, serve: g }];
        } else f.route = [{ x: f.wx, z: aisle(f.wz) }, { x: BAR.x + 4.5, z: aisle(f.wz) }, { x: BAR.x + 4.5, z: -6 + Math.random() * 12, bar: true }];
      }
      const P0 = f.route[0], dx = P0.x - f.wx, dz = P0.z - f.wz, d = Math.hypot(dx, dz);
      if (d < 0.2) {
        f.route.shift();
        if (P0.serve) { f.pause = 2.5; f.holder.rotation.y = Math.atan2(P0.serve.holder.position.x - f.wx, P0.serve.holder.position.z - f.wz); }
        else if (P0.bar) { f.pause = 2; f.holder.rotation.y = -Math.PI / 2; }
        continue;
      }
      const sp = Math.min(d, 3.2 * dt);
      f.wx += (dx / d) * sp; f.wz += (dz / d) * sp;
      f.holder.position.set(f.wx, 0, f.wz); f.holder.rotation.y = Math.atan2(dx, dz); f.pose = "walk";
    }
  };

  // ---------- on the tables in the 3D room: cards, chips, the wheel and the ball, the bingo board ----------
  const cardTex = {};
  function texOf(c) {
    const k = c == null ? "back" : c;
    if (cardTex[k]) return cardTex[k];
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 88;
    const x = cv.getContext("2d");
    x.fillStyle = c == null ? "#2f5fb0" : "#ffffff"; x.fillRect(0, 0, 64, 88);
    x.strokeStyle = c == null ? "#ffffff" : "#999999"; x.lineWidth = 3; x.strokeRect(3, 3, 58, 82);
    if (c != null) {
      x.fillStyle = isRed(c) ? "#d0202a" : "#111111"; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = "bold 24px sans-serif"; x.fillText(RANKS[c % 13], 22, 20);
      x.font = "40px sans-serif"; x.fillText(SUITS[Math.floor(c / 13)], 34, 56);
    } else { x.fillStyle = "#ffd23f"; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) x.fillRect(10 + i * 13, 10 + j * 12, 5, 5); }
    const t = new THREE.CanvasTexture(cv);
    return (cardTex[k] = new THREE.MeshBasicMaterial({ map: t }));
  }
  const cardGeo = new THREE.PlaneGeometry(1.0, 1.4), chipGeo = new THREE.CylinderGeometry(0.38, 0.38, 1, 14);
  const chipMat = [0xc0262d, 0x2f5fb0, 0x1f9e4a, 0x111111, 0xffd23f].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const TOP = 0.8 * 2.1; // the height of the felt, until the table's model is in and can be measured
  App.casinoBuild = (cur, g, token) => {
    const Cs = cur.map.target.casino, room = cur.ri, V = (cur.cv = { tables: {}, g, wheels: {} });
    if (room === 0) {
      // a little screen on every slot machine, showing its reels
      V.screens = SLOTS.map((M) => {
        const cv = document.createElement("canvas"); cv.width = 96; cv.height = 40;
        const tex = new THREE.CanvasTexture(cv), pl = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.48), new THREE.MeshBasicMaterial({ map: tex }));
        const d = 42 * K0 * KS + 0.04;
        pl.position.set(M.x + Math.sin(M.rot) * d, 120 * K0 * KS, M.z + Math.cos(M.rot) * d); pl.rotation.y = M.rot; g.add(pl);
        return { cv, tex, sig: "" };
      });
    }
    for (const T of tablesOf(Cs)) {
      if (T.def.room !== room) continue;
      const P = TP[T.key], grp = new THREE.Group();
      grp.position.set(P.x, 0, P.z); g.add(grp);
      V.tables[T.key] = { grp, cards: [], chips: [], sig: "" };
      if (T.kind === "roulette") {
        // the wheel at the end of the table: a pivot at its very middle turns it in place; the ball runs round it
        const W = { grp: new THREE.Group(), pivot: new THREE.Group(), a: 0 };
        const SW = App.CASINO_SCALE.wheel, SR = App.CASINO_SCALE.roulette;
        W.grp.position.set(P.x + 230 * K0 * SR[0], TOP - 0.05, P.z); W.grp.scale.set(SW[0], SW[1], SW[2]); g.add(W.grp); W.grp.add(W.pivot);
        App.kitMesh("roulettewheel", 0).then((mk) => { if (cur.token !== token) return; const m = App.centeredMesh(mk.md, mk.geo, true); m.userData.shared = true; W.pivot.add(m); W.ready = true; });
        W.ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff })); W.ball.position.set(0.4, 0.37, 0); W.grp.add(W.ball);
        V.wheels[T.key] = W;
      }
      if (T.kind === "bingo") {
        // the board on the back wall; the cage on its stand, its drum turning on the axle
        const cv = document.createElement("canvas"); cv.width = 520; cv.height = 300;
        V.board = { cv, tex: new THREE.CanvasTexture(cv), n: -1 };
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(23, 13.3), new THREE.MeshBasicMaterial({ map: V.board.tex }));
        plane.position.set(P.x, 7.4, -ROOMS[room].d / 2 + 0.35); g.add(plane);
        const KC = App.CASINO_SCALE.cage, stand = new THREE.Group(); stand.position.set(P.x, 0, P.z - 4.5); stand.scale.setScalar(KC); g.add(stand);
        V.drum = new THREE.Group(); V.drum.position.set(P.x, 128 * K0 * KC, P.z - 4.5); V.drum.scale.setScalar(KC); g.add(V.drum); // its axle on top of the uprights
        App.kitMesh("bingocage", 0).then((mk) => { if (cur.token !== token) return; const m = App.centeredMesh(mk.md, mk.geo, true); m.userData.shared = true; stand.add(m); });
        App.kitMesh("bingocage", 1).then((mk) => { if (cur.token !== token) return; const m = App.centeredMesh(mk.md, mk.geo, true); m.userData.shared = true; V.drum.add(m); });
      }
    }
  };
  function drawBoard(V, T) {
    const x = V.board.cv.getContext("2d"), drawn = T.drawnSet || new Set(), lastN = T.drawn && T.drawn.length ? T.drawn[T.drawn.length - 1] : null;
    x.fillStyle = "#3a1a10"; x.fillRect(0, 0, 520, 300);
    x.fillStyle = "#ffd23f"; x.font = "bold 26px sans-serif"; x.textAlign = "left"; x.textBaseline = "middle";
    x.fillText("BINGO", 14, 22);
    x.font = "16px sans-serif"; x.fillStyle = "#ffe8a0";
    x.fillText(T.phase === "sell" ? "Tickets on sale!" : T.phase === "draw" ? "Ball " + T.drawn.length + "   Pot " + T.pot : T.phase === "done" ? (T.winners && T.winners.length ? "BINGO! " + T.winners.map(nm).join(", ") : "Game over") : "", 120, 22);
    if (lastN != null) { x.fillStyle = "#ffffff"; x.beginPath(); x.arc(480, 22, 18, 0, 6.283); x.fill(); x.fillStyle = "#c0262d"; x.font = "bold 20px sans-serif"; x.textAlign = "center"; x.fillText(String(lastN), 480, 23); }
    x.textAlign = "center"; x.font = "bold 18px sans-serif";
    for (let n = 1; n <= 90; n++) {
      const c = (n - 1) % 10, r = Math.floor((n - 1) / 10), px = 30 + c * 51, py = 62 + r * 26;
      x.fillStyle = drawn.has(n) ? (n === lastN ? "#ffffff" : "#ffd23f") : "#5a3a2a"; x.fillRect(px - 22, py - 11, 44, 22);
      x.fillStyle = drawn.has(n) ? "#3a1a10" : "#9a7a6a"; x.fillText(String(n), px, py + 1);
    }
    V.board.tex.needsUpdate = true;
  }
  // the table itself as it stands in the room: how big its top is and how high (measured once its model is in)
  const rayDown = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), V3 = new THREE.Vector3();
  function tableOf(V, D, P) {
    if (D.obj) return D.obj;
    for (const o of V.g.children) {
      if (o === D.grp || !o.isGroup || o.children.length !== 1 || !o.children[0].isMesh || Math.abs(o.position.x - P.x) > 0.05 || Math.abs(o.position.z - P.z) > 0.05) continue;
      o.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(o);
      D.obj = o; D.box = { cx: (b.min.x + b.max.x) / 2 - P.x, cz: (b.min.z + b.max.z) / 2 - P.z, hx: (b.max.x - b.min.x) / 2, hz: (b.max.z - b.min.z) / 2, top: b.max.y };
      return o;
    }
    return null;
  }
  // the height of the table's top under a point, so a card lies on the felt and not above it
  function topAt(D, P, x, z) {
    if (!D.obj) return TOP;
    rayDown.set(V3.set(P.x + x, 30, P.z + z), DOWN);
    const h = rayDown.intersectObject(D.obj, true)[0];
    return h ? h.point.y : D.box.top;
  }
  function layTable(V, T) {
    const D = V.tables[T.key], P = TP[T.key];
    tableOf(V, D, P);
    const B = D.box || { cx: 0, cz: 0, hx: 3, hz: 2, top: TOP }, SR = App.CASINO_LAYOUT.seatRadii(T.key);
    for (const m of D.cards) m.visible = false;
    for (const m of D.chips) m.visible = false;
    let ci = 0, hi = 0;
    const card = (c, x, z, rot) => { let m = D.cards[ci++]; if (!m) { m = new THREE.Mesh(cardGeo, texOf(null)); m.rotation.x = -Math.PI / 2; D.grp.add(m); D.cards.push(m); } m.material = texOf(c); m.position.set(x, topAt(D, P, x, z) + 0.02 + ci * 0.002, z); m.rotation.z = rot || 0; m.visible = true; };
    const chips = (n, x, z, col) => { if (!(n > 0)) return; let m = D.chips[hi++]; if (!m) { m = new THREE.Mesh(chipGeo, chipMat[0]); D.grp.add(m); D.chips.push(m); } const h = 0.1 * Math.min(14, Math.max(1, Math.ceil(n / 4))); m.material = chipMat[col % chipMat.length]; m.scale.set(1, h, 1); m.position.set(x, topAt(D, P, x, z) + h / 2 + 0.01, z); m.visible = true; };
    // a place on the felt in front of a seat: f of the way from the middle of the table to its edge
    const spot = (dx, dz, f) => { let ux = dx / SR.rx, uz = dz / SR.rz; const n = Math.hypot(ux, uz) || 1; ux /= n; uz /= n; return { x: B.cx + ux * B.hx * f, z: B.cz + uz * B.hz * f, tx: -uz, tz: ux }; };
    T.seats.forEach((S, k) => {
      if (!S) return;
      const at = App.CASINO_LAYOUT.seat(T.key, k), dx = at.x - P.x, dz = at.z - P.z, rot = Math.atan2(dx, dz);
      if (T.kind === "poker") {
        const show = S.player || (T.show && !S.folded), q = spot(dx, dz, 0.62), st2 = spot(dx, dz, 0.82), bt = spot(dx, dz, 0.42);
        if (!S.folded || T.phase === "idle") (S.cards || []).forEach((c, i) => card(show ? c : null, q.x + q.tx * (i - 0.5) * 1.15, q.z + q.tz * (i - 0.5) * 1.15, rot));
        chips(S.stack, st2.x + st2.tx * 1.4, st2.z + st2.tz * 1.4, k); chips(S.bet, bt.x, bt.z, 4);
      } else if (T.kind === "blackjack") {
        const q = spot(dx, dz, 0.58), bt = spot(dx, dz, 0.3);
        (S.cards || []).forEach((c, i) => card(c, q.x + q.tx * i * 0.5, q.z + q.tz * i * 0.5, rot));
        chips(S.bet, bt.x, bt.z, k);
      } else if (T.kind === "roulette") {
        // a number is on its square of the layout; the other bets in front of the player
        (S.bets || []).forEach((b, i) => {
          if (b.t === "n") { const col = b.n === 0 ? -1.4 : Math.floor((b.n - 1) / 3), row = b.n === 0 ? 1 : (b.n - 1) % 3; chips(b.a, B.cx + B.hx * ((-200 + col * 36) / 300), B.cz + B.hz * ((-50 + row * 50) / 120), k); }
          else { const q = spot(dx, dz, 0.75); chips(b.a, q.x + q.tx * i * 0.8, q.z + q.tz * i * 0.8, k); }
        });
      }
    });
    if (T.kind === "poker") { (T.board || []).forEach((c, i) => card(c, B.cx + (i - 2) * 1.25, B.cz)); chips((T.pot || 0) + T.seats.reduce((a, S) => a + (S ? S.bet || 0 : 0), 0), B.cx, B.cz - B.hz * 0.35, 4); }
    if (T.kind === "blackjack") (T.dealer || []).forEach((c, i) => card(i === 1 && T.hide ? null : c, B.cx + (i - 0.5) * 1.25, B.cz - B.hz * 0.5));
  }
  App.casinoFrame = (cur, dt) => {
    const V = cur.cv, Cs = cur.map.target.casino;
    if (!V) return;
    App.casinoWaiters(cur, dt);
    App.casinoScreens(cur);
    for (const T of tablesOf(Cs)) {
      if (!V.tables[T.key]) continue;
      if (T.kind === "bingo") {
        const n = (T.drawn ? T.drawn.length : 0) * 10 + ["idle", "sell", "draw", "done"].indexOf(T.phase) + T.round * 1000;
        if (n !== V.board.n) { V.board.n = n; drawBoard(V, T); }
        if (V.drum) V.drum.rotation.x += dt * (T.phase === "draw" ? 4 : 0.3);
        continue;
      }
      const D = V.tables[T.key], sig = sigOf(Cs, T.key) + (D.obj ? "" : "?");
      if (sig !== D.sig || !D.obj) { D.sig = sig; layTable(V, T); }
      if (T.kind === "roulette" && D.obj && V.wheels[T.key] && !V.wheels[T.key].placed) { const W0 = V.wheels[T.key]; W0.placed = true; W0.grp.position.y = topAt(D, TP[T.key], W0.grp.position.x - TP[T.key].x, 0) - 0.02; }
      if (T.kind === "roulette") {
        // the wheel turns slowly, and spins hard when the ball is launched; the ball drops into the winning pocket
        const W = V.wheels[T.key], u = T.phase === "spin" ? Math.min(1, (st.T - T.spinStart) / 2) : 1;
        if (!W) continue;
        W.a += dt * (T.phase === "spin" ? 6 * (1 - u) + 0.4 : 0.4);
        W.pivot.rotation.y = W.a;
        const k = WHEEL.indexOf(T.phase !== "spin" && T.last ? T.last[0] : T.result), a = (k / 37) * Math.PI * 2;
        if (W.ready && k >= 0 && (T.phase !== "spin" || u > 0.85)) {
          // in the pocket: where the pocket is now, as the wheel turns
          const pk = new THREE.Vector3(Math.cos(a) * 0.4, 0.37, Math.sin(a) * 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), W.a);
          if (T.phase === "spin") W.ball.position.lerp(pk, Math.min(1, dt * 8)); else W.ball.position.copy(pk);
        } else if (T.phase === "spin") {
          const b = -st.T * (16 * (1 - u) + 2), r = 0.55 - u * 0.14;
          W.ball.position.set(Math.cos(b) * r, 0.42, Math.sin(b) * r);
        }
      }
    }
  };

  // ---------- the table window: what is on the table, and the player's moves ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cardHTML = (c, down) => (down ? '<span class="pcard back"></span>' : '<span class="pcard' + (isRed(c) ? " red" : "") + '">' + esc(cardText(c)) + "</span>");
  let win = null; // { Cs, key, sig, timer }
  function myTickles() {
    if (!st.wallet || !App.tokensOf) return [];
    return App.tokensOf(st.wallet).sort((a, b) => sh(b) - sh(a)).slice(0, 40);
  }
  function seatList(T, fn) {
    return '<div class="ctab-seats">' + T.seats.map((S, k) => S ? '<div class="cseat' + (S.player ? " me" : "") + (T.kind === "poker" && T.toAct === k && T.phase === "bet" ? " turn" : T.kind === "blackjack" && T.turn === k && T.phase === "play" ? " turn" : "") + '"><b>' + esc(nm(S.id)) + "</b>" + fn(S, k) + (S.result ? '<div class="cres">' + esc(S.result) + "</div>" : "") + "</div>" : "").join("") + "</div>";
  }
  function bingoTicket(tk, drawn) {
    return '<table class="bticket">' + tk.map((row) => "<tr>" + row.map((n) => "<td" + (n != null && drawn.has(n) ? ' class="hit"' : n == null ? ' class="blank"' : "") + ">" + (n == null ? "" : n) + "</td>").join("") + "</tr>").join("") + "</table>";
  }
  function render(Cs, key) {
    const T = tablesOf(Cs).find((t) => t.key === key), me = T.seats.find((S) => S && S.player), R = tourOf(Cs, Math.floor(st.T / DAY));
    let h = '<div class="ctab-head"><b>' + (T.def.tour ? "Poker tournament &middot; table " + (T.n + 1) : esc(GAME_NAME[T.kind]) + (T.kind !== "bingo" ? " (table " + (T.n + 1) + ")" : "")) + "</b> &middot; " + esc(Cs.name) + '<button class="btn" id="ctabClose">' + (me && !me.tour ? "Leave the table" : me ? "Close (it plays on)" : "Close") + "</button></div>";
    if (T.def.tour) {
      // the tournament: before, the entries; during, the level and who is left; after, the prizes
      const bl = BLINDS[R.level];
      h += '<div class="ctab-board" style="display:block">' + (R.done ? (R.cancelled ? "Tonight's tournament was called off: fewer than four players (the buy-ins were returned)." : "<b>" + esc(nm(R.winner)) + " won tonight's tournament.</b> Prizes: " + R.places.map((q, k) => ordinal(k + 1) + " " + esc(nm(q.id)) + " " + q.n + " shells").join(", ")) :
        R.started ? "Level " + (R.level + 1) + " &middot; blinds " + bl[0] + "/" + bl[1] + " &middot; " + R.alive.size + " of " + R.n + " left &middot; prize pool " + R.pool + " shells" :
        "Tonight at 20:30 on the big tables: buy-in " + BUYIN + " shells, " + CHIPS + " chips each, the blinds go up every " + LEVEL + " minutes. " + R.reg.size + " entered so far (up to 27) &middot; prize pool " + R.pool + " shells.") + "</div>";
      if (!R.started && !R.done) {
        const mine = myTickles(), mineIn = st.casinoTourMe && st.casinoTourMe.c === Cs.i && st.casinoTourMe.day === R.day && R.reg.has(st.casinoTourMe.id);
        h += '<div class="ctab-moves">' + (mineIn ? "<b>" + esc(nm(st.casinoTourMe.id)) + " is entered.</b> It takes its seat when the tournament starts." : mine.length ? 'Enter <select id="ctabWho">' + mine.map((id) => '<option value="' + id + '">' + esc(nm(id)) + " (" + Math.floor(sh(id)) + " shells)</option>").join("") + '</select> <button class="btn primary" id="ctabSit">Enter (buy-in ' + BUYIN + ")</button>" : '<span class="note">To play, choose your wallet in the Holders tab and enter one of your own Tickles.</span>') + "</div>";
        h += '<div class="ctab-log">' + [...R.reg].slice(0, 27).map((id) => esc(nm(id))).join(", ") + "</div>";
        return h;
      }
    }
    if (T.kind === "poker") {
      h += '<div class="ctab-board">' + (T.board && T.board.length ? T.board.map((c) => cardHTML(c)).join("") : '<span class="note">' + (T.phase === "idle" ? "Waiting for players (two are needed)" : "Pre-flop") + "</span>") + '<span class="note"> &middot; pot ' + ((T.pot || 0) + T.seats.reduce((a, S) => a + (S ? S.bet : 0), 0)) + "</span></div>";
      h += seatList(T, (S, k) => '<div class="ccards">' + (S.cards || []).map((c) => cardHTML(c, !(S.player || (T.show && !S.folded)))).join("") + "</div><div class=\"note\">" + S.stack + " chips" + (S.bet ? " &middot; bet " + S.bet : "") + (S.folded && T.phase !== "idle" ? " &middot; folded" : "") + (S.allin ? " &middot; all in" : "") + (T.button === k ? " &middot; D" : "") + (S.hand ? " &middot; " + esc(S.hand) : "") + "</div>");
      if (me && T.phase === "bet" && T.seats[T.toAct] === me) { const toCall = T.cur - me.bet; h += '<div class="ctab-moves"><b>Your turn</b> <button class="btn" data-cmove="fold">Fold</button><button class="btn primary" data-cmove="call">' + (toCall ? "Call " + Math.min(toCall, me.stack) : "Check") + "</button>" + (T.raises < 3 && me.stack > toCall ? '<button class="btn" data-cmove="raise">' + (toCall ? "Raise to " + (T.cur + betSize(T)) : "Bet " + betSize(T)) + "</button>" : "") + "</div>"; }
      else if (me) h += '<div class="ctab-moves note">Your cards: ' + (me.cards || []).map((c) => cardHTML(c)).join("") + (T.board && T.board.length && me.cards && me.cards.length ? " &middot; " + esc(HAND[catOf(eval7(me.cards.concat(T.board)))]) : "") + "</div>";
    } else if (T.kind === "blackjack") {
      h += '<div class="ctab-board">Dealer: ' + (T.dealer && T.dealer.length ? T.dealer.map((c, i) => cardHTML(c, i === 1 && T.hide)).join("") + (T.hide ? "" : " <b>" + bjVal(T.dealer).v + "</b>") : '<span class="note">waiting for bets</span>') + "</div>";
      h += seatList(T, (S) => '<div class="ccards">' + (S.cards || []).map((c) => cardHTML(c)).join("") + (S.cards && S.cards.length ? " <b>" + bjVal(S.cards).v + "</b>" : "") + '</div><div class="note">' + (S.bet ? "bet " + S.bet : "") + "</div>");
      if (me && T.phase === "bets") h += '<div class="ctab-moves"><b>Your bet: ' + me.bet + '</b> ' + [1, 2, 5, 10].map((n) => '<button class="btn" data-cmove="bet" data-arg="' + n + '">+' + n + "</button>").join("") + '<button class="btn" data-cmove="clear">Clear</button> <span class="note">(the cards come out shortly)</span></div>';
      else if (me && T.phase === "play" && T.seats[T.turn] === me) h += '<div class="ctab-moves"><b>Your turn (' + bjVal(me.cards).v + ')</b> <button class="btn primary" data-cmove="hit">Hit</button><button class="btn" data-cmove="stand">Stand</button>' + (me.cards.length === 2 && sh(me.id) >= me.bet ? '<button class="btn" data-cmove="double">Double</button>' : "") + "</div>";
    } else if (T.kind === "roulette") {
      const n = T.phase === "spin" ? null : T.last && T.last[0];
      h += '<div class="ctab-board">' + (T.phase === "spin" ? "<b>The ball is spinning...</b>" : n != null ? 'Last: <span class="rball ' + colourOf(n) + '">' + n + "</span>" : "") + (T.last && T.last.length > 1 ? ' <span class="note">before: ' + T.last.slice(1, 9).map((x) => '<span class="rball small ' + colourOf(x) + '">' + x + "</span>").join("") + "</span>" : "") + "</div>";
      h += seatList(T, (S) => '<div class="note">' + ((S.bets.length ? S.bets : S.lastBets || []).map((b) => b.a + " on " + betName(b)).join(", ") || "&nbsp;") + "</div>");
      if (me && T.phase === "bets") {
        const chip = win.chip || 1;
        h += '<div class="ctab-moves"><b>Place your bets</b> (chip: ' + [1, 2, 5, 10].map((c) => '<button class="btn' + (c === chip ? " primary" : "") + '" data-cchip="' + c + '">' + c + "</button>").join("") + ')<button class="btn" data-cmove="clear">Clear</button>';
        h += '<div class="rlayout"><button class="rnum green" data-rbet=\'{"t":"n","n":0}\'>0</button><div class="rgrid">';
        for (let r = 2; r >= 0; r--) for (let c = 0; c < 12; c++) { const x = c * 3 + r + 1; h += '<button class="rnum ' + colourOf(x) + '" data-rbet=\'{"t":"n","n":' + x + "}'>" + x + "</button>"; }
        h += '</div></div><div class="rout">' + [["red", "Red"], ["black", "Black"], ["even", "Even"], ["odd", "Odd"], ["low", "1-18"], ["high", "19-36"]].map(([t, l]) => '<button class="btn" data-rbet=\'{"t":"' + t + "\"}'>" + l + "</button>").join("") + [0, 1, 2].map((d) => '<button class="btn" data-rbet=\'{"t":"dz","d":' + d + "}'>" + ["1-12", "13-24", "25-36"][d] + "</button>").join("") + "</div></div>";
      }
    } else {
      const drawn = T.drawnSet || new Set();
      h += '<div class="ctab-board">' + (T.phase === "draw" || T.phase === "done" ? "Ball <b>" + (T.drawn ? T.drawn.length : 0) + "</b>: " + (T.drawn && T.drawn.length ? '<span class="rball bingo">' + T.drawn[T.drawn.length - 1] + "</span>" : "") + ' <span class="note">pot ' + (T.pot || 0) + " shells" + (T.lineWon ? " &middot; the line is won" : " &middot; line pays 30%, bingo 60%") + "</span>" : T.phase === "sell" ? "Tickets on sale (" + PRICE + " shells) &middot; pot " + (T.pot || 0) : '<span class="note">Waiting for players</span>') + "</div>";
      h += '<div class="bboard">' + range(1, 90).map((x) => '<span class="' + (drawn.has(x) ? "on" : "") + '">' + x + "</span>").join("") + "</div>";
      h += seatList(T, (S) => '<div class="note">' + (S.tickets.length ? S.tickets.length + " ticket" + (S.tickets.length > 1 ? "s" : "") : "") + "</div>");
      if (me) h += '<div class="ctab-moves">' + (T.phase === "sell" && me.tickets.length < 3 ? '<button class="btn primary" data-cmove="ticket">Buy a ticket (' + PRICE + " shells)</button> " : "") + me.tickets.map((tk) => bingoTicket(tk, drawn)).join("") + "</div>";
    }
    if (!me && T.def.tour) h += '<div class="note">The tournament is under way: watch it here.</div>';
    else if (!me) {
      const mine = myTickles();
      h += '<div class="ctab-moves">' + (mine.length ? 'Play with <select id="ctabWho">' + mine.map((id) => '<option value="' + id + '">' + esc(nm(id)) + " (" + Math.floor(sh(id)) + " shells)</option>").join("") + '</select> <button class="btn primary" id="ctabSit">Sit down</button>' : '<span class="note">To play, choose your wallet in the Holders tab: then you can sit one of your own Tickles at the table and play with its shells.</span>') + "</div>";
    } else h += '<div class="note">' + esc(nm(me.id)) + " has " + Math.floor(sh(me.id)) + " shells.</div>";
    h += '<div class="ctab-log">' + T.log.map((l) => "<div>" + esc(l) + "</div>").join("") + "</div>";
    return h;
  }
  function sigOf(Cs, key) {
    const T = tablesOf(Cs).find((t) => t.key === key);
    return [T.phase, T.round, T.toAct, T.turn, T.cur, T.pot, (T.board || []).length, (T.dealer || []).length, T.hide, (T.drawn || []).length, T.log[0], win && win.chip, T.seats.map((S) => S ? S.id + ":" + (S.bet || 0) + ":" + (S.stack || 0) + ":" + (S.cards || []).length + ":" + (S.bets || []).length + ":" + (S.tickets || []).length + ":" + S.result + ":" + (S.folded ? 1 : 0) : "-").join(","), st.casinoMe ? st.casinoMe.id : "", st.casinoMe ? Math.floor(sh(st.casinoMe.id)) : ""].join("|");
  }
  App.openCasinoTable = (Cs, key) => {
    let el = document.getElementById("casinoWin");
    if (!el) { el = document.createElement("div"); el.id = "casinoWin"; document.body.appendChild(el); }
    if (win && win.timer) clearInterval(win.timer);
    win = { Cs, key, sig: "", chip: 1 };
    el.hidden = false;
    const draw = () => {
      if (!win) return;
      // the player's tournament table may be broken up: the window follows it to its new table
      if (st.casinoMe && st.casinoMe.tour && st.casinoMe.c === Cs.i && win.key.startsWith("tour") && st.casinoMe.key !== win.key) { win.key = st.casinoMe.key; win.sig = ""; }
      const R = tourOf(Cs, Math.floor(st.T / DAY)), s = sigOf(Cs, win.key) + "|" + R.reg.size + R.started + R.done + R.level + R.alive.size;
      if (s !== win.sig) { win.sig = s; el.innerHTML = render(Cs, win.key); }
    };
    win.draw = draw;
    draw();
    win.timer = setInterval(draw, 250);
  };
  function closeWin() {
    const el = document.getElementById("casinoWin");
    if (el) el.hidden = true;
    if (win && win.timer) clearInterval(win.timer);
    win = null;
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    const open = t.closest("[data-ctable]");
    if (open && App.inside && App.inside.map.target.casino) { App.openCasinoTable(App.inside.map.target.casino, open.dataset.ctable); return; }
    if (!win) return;
    if (t.closest("#ctabClose")) { if (st.casinoMe && !st.casinoMe.tour) App.casinoLeave(); closeWin(); return; }
    if (t.closest("#ctabSit")) { const id = +document.getElementById("ctabWho").value, err = App.casinoSit(win.Cs, win.key, id); if (err) App.toast(err); win.sig = ""; win.draw(); return; }
    const ch = t.closest("[data-cchip]");
    if (ch) { win.chip = +ch.dataset.cchip; win.sig = ""; win.draw(); return; }
    const rb = t.closest("[data-rbet]");
    if (rb) { const b = JSON.parse(rb.dataset.rbet); b.a = win.chip || 1; App.casinoMove("bet", b); win.sig = ""; win.draw(); return; }
    const mv = t.closest("[data-cmove]");
    if (mv) { App.casinoMove(mv.dataset.cmove, mv.dataset.arg != null ? +mv.dataset.arg : null); win.sig = ""; win.draw(); }
  });
  App.casinoWindowOpen = () => !!win;

  // ---------- the slot machines: three reels and a pay line ----------
  // Every reel has the same 32 stops: cherry 7, lemon 7, bell 6, shell 5, star 4, seven 2, crown 1. Three alike on
  // the line pay 5, 8, 12, 20, 40, 120 or 800 times the bet; two cherries on the first two reels pay 3 times, any
  // other pair there twice, and a cherry on the first reel gives the bet back. That returns about 91.5% of what
  // goes in: the house keeps the rest. The guests at the machines play a shell or two a spin until they run short.
  const REEL = [["cherry", 7], ["lemon", 7], ["bell", 6], ["shell", 5], ["star", 4], ["seven", 2], ["crown", 1]];
  const PAY3 = { cherry: 5, lemon: 8, bell: 12, shell: 20, star: 40, seven: 120, crown: 800 };
  const cp = (n) => String.fromCodePoint(n);
  const SYM = (App.SLOT_SYMBOLS = { cherry: cp(0x1f352), lemon: cp(0x1f34b), bell: cp(0x1f514), shell: cp(0x1f41a), star: cp(0x2b50), seven: "7", crown: cp(0x1f451) });
  GAME_NAME.slots = "the slot machines";
  const reel = () => { let r = rnd() * 32; for (const [s, w] of REEL) if ((r -= w) < 0) return s; return "cherry"; };
  function slotPay(res, bet) {
    const [a, b, c] = res;
    if (a === b && b === c) return bet * PAY3[a];
    if (a === "cherry" && b === "cherry") return bet * 3;
    if (a === b) return bet * 2;
    return a === "cherry" ? bet : 0;
  }
  App.slotPay = slotPay;
  const machinesOf = (Cs) => Cs.machines || (Cs.machines = SLOTS.map(() => ({ res: ["seven", "seven", "seven"], win: 0, next: 0, spinAt: 0, id: null })));
  App.casinoMachines = machinesOf;
  const MY_SLOT = SLOTS.length - 1; // the player's machine: the guests leave it free
  function spin(Cs, k, id, bet) {
    const M = machinesOf(Cs)[k], res = [reel(), reel(), reel()], pay = slotPay(res, bet);
    take(id, bet);
    if (pay) give(id, pay);
    house(Cs, bet - pay);
    M.res = res; M.win = pay; M.bet = bet; M.id = id; M.spinAt = performance.now();
    st.casinoLog.spins = (st.casinoLog.spins || 0) + 1;
    if (pay - bet >= 25) bigWin({ kind: "slots", casino: Cs }, id, pay - bet);
    return { res, pay };
  }
  function slotTick(Cs) {
    const sp = Cs.spectators || [], M = machinesOf(Cs);
    for (let k = 0; k < Math.min(sp.length, MY_SLOT); k++) {
      const id = sp[k], m = M[k];
      if (m.id !== id) { m.id = id; m.next = st.T + rnd(); }
      if (st.T < m.next) continue;
      m.next = st.T + 1.2 + rnd() * 0.9;
      const bet = Math.min(Math.floor(sh(id)), App.factionOf(id) === "gamblers" ? 2 : 1);
      if (bet >= 1) spin(Cs, k, id, bet);
    }
  }
  // the player at its machine
  App.casinoSlotSit = (Cs, id) => {
    if (App.isMine && !(App.canUse ? App.canUse(id) : App.isMine(id))) return "You can only play with one of your own Tickles.";
    if (st.casinoMe) App.casinoLeave();
    st.casinoMe = { c: Cs.i, slot: true, id };
    machinesOf(Cs)[MY_SLOT].id = id;
    return null;
  };
  function renderSlot(Cs) {
    const me = st.casinoMe && st.casinoMe.slot && st.casinoMe.c === Cs.i ? st.casinoMe.id : null, M = machinesOf(Cs)[MY_SLOT], bet = win.bet || 1, shown = win.reels || M.res;
    let h = '<div class="ctab-head"><b>Slot machine</b> &middot; ' + esc(Cs.name) + '<button class="btn" id="ctabClose">' + (me ? "Leave the machine" : "Close") + "</button></div>";
    h += '<div class="slotbox">' + shown.map((s) => '<span class="reel' + (s === "seven" ? " seven" : "") + '">' + SYM[s] + "</span>").join("") + "</div>";
    h += '<div class="ctab-moves" style="justify-content:center;min-height:28px">' + (win.msg ? "<b>" + esc(win.msg) + "</b>" : '<span class="note">Line up three alike!</span>') + "</div>";
    if (me) {
      h += '<div class="ctab-moves" style="justify-content:center">Bet ' + [1, 2, 5].map((n) => '<button class="btn' + (n === bet ? " primary" : "") + '" data-sbet="' + n + '">' + n + "</button>").join("") + ' <button class="btn primary" id="ctabSpin"' + (win.spinning ? " disabled" : "") + ' style="font-size:15px;padding:6px 22px">Spin</button></div>';
      h += '<div class="note" style="text-align:center">' + esc(nm(me)) + " has " + Math.floor(sh(me)) + " shells.</div>";
    } else {
      const mine = myTickles();
      h += '<div class="ctab-moves">' + (mine.length ? 'Play with <select id="ctabWho">' + mine.map((id) => '<option value="' + id + '">' + esc(nm(id)) + " (" + Math.floor(sh(id)) + " shells)</option>").join("") + '</select> <button class="btn primary" id="ctabSlotSit">Sit at the machine</button>' : '<span class="note">To play, choose your wallet in the Holders tab: then you can sit one of your own Tickles at a machine and play with its shells.</span>') + "</div>";
    }
    h += '<div class="ctab-log"><b>Pays (times the bet):</b> ' + REEL.map(([s]) => SYM[s] + SYM[s] + SYM[s] + " " + PAY3[s]).join(" &middot; ") + " &middot; " + SYM.cherry + SYM.cherry + " 3 &middot; any pair on the first two reels 2 &middot; " + SYM.cherry + " on the first reel: your bet back.</div>";
    return h;
  }
  App.openCasinoSlot = (Cs) => {
    let el = document.getElementById("casinoWin");
    if (!el) { el = document.createElement("div"); el.id = "casinoWin"; document.body.appendChild(el); }
    if (win && win.timer) clearInterval(win.timer);
    win = { Cs, key: "slot", slot: true, sig: "", bet: 1 };
    el.hidden = false;
    const draw = () => { if (win) el.innerHTML = renderSlot(Cs); };
    win.draw = draw;
    draw();
    win.timer = setInterval(() => { if (!win || win.spinning) return; const s = (st.casinoMe ? st.casinoMe.id + ":" + Math.floor(sh(st.casinoMe.id)) : "-") + win.bet; if (s !== win.sig) { win.sig = s; draw(); } }, 400);
  };
  // the reels roll, and stop one after another
  function playerSpin() {
    if (!win || !win.slot || win.spinning || !st.casinoMe || !st.casinoMe.slot) return;
    const id = st.casinoMe.id, bet = win.bet || 1;
    if (sh(id) < bet) { App.toast(nm(id) + " has too few shells for that bet."); return; }
    const r = spin(win.Cs, MY_SLOT, id, bet);
    win.spinning = true; win.msg = "";
    let n = 0;
    const iv = setInterval(() => {
      if (!win) return clearInterval(iv);
      n++;
      win.reels = n < 12 ? [reel(), reel(), reel()] : n < 16 ? [r.res[0], reel(), reel()] : n < 20 ? [r.res[0], r.res[1], reel()] : r.res;
      if (n >= 20) { clearInterval(iv); win.spinning = false; win.reels = null; win.msg = !r.pay ? "No luck this time." : r.pay === bet ? "Your bet back." : "You win " + r.pay + " shells!"; if (r.pay >= bet * 20) App.toast(nm(id) + " hits the jackpot: " + r.pay + " shells!"); }
      win.draw();
    }, 70);
  }
  document.addEventListener("click", (e) => {
    const t = e.target, so = t.closest("[data-cslot]");
    if (so && App.inside && App.inside.map.target.casino) { App.openCasinoSlot(App.inside.map.target.casino); return; }
    if (!win || !win.slot) return;
    if (t.closest("#ctabSlotSit")) { const err = App.casinoSlotSit(win.Cs, +document.getElementById("ctabWho").value); if (err) App.toast(err); win.draw(); return; }
    const sb = t.closest("[data-sbet]");
    if (sb) { win.bet = +sb.dataset.sbet; win.draw(); return; }
    if (t.closest("#ctabSpin")) playerSpin();
  });
  // the screens of the machines in the hall: what each shows, rolling while it spins
  App.casinoScreens = (cur) => {
    const V = cur.cv;
    if (!V || !V.screens) return;
    const M = machinesOf(cur.map.target.casino), now = performance.now();
    V.screens.forEach((S, k) => {
      const m = M[k], rolling = now - m.spinAt < 900, sig = rolling ? "r" + Math.floor(now / 90) : m.res.join() + (m.win > 0 ? "+" : "");
      if (sig === S.sig) return;
      S.sig = sig;
      const x = S.cv.getContext("2d"), show = rolling ? [reel(), reel(), reel()] : m.res;
      x.fillStyle = m.win > 0 && !rolling ? "#3a2a00" : "#101010"; x.fillRect(0, 0, 96, 40);
      x.strokeStyle = "#ffd23f"; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 93, 37);
      x.font = "24px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      show.forEach((s, i) => { x.fillStyle = s === "seven" ? "#ff3b2f" : "#ffffff"; x.fillText(SYM[s], 18 + i * 30, 21); });
      S.tex.needsUpdate = true;
    });
  };

  // ---------- the Adventure tab ----------
  App.casinosHTML = () => {
    const L = st.casinoLog;
    if (!App.casinos || !App.casinos.length) return "";
    let h = '<div class="card"><h3>Casinos</h3><p class="note">One in every region, near its arena, open every night from 19:00 to 23:30: Texas Hold&#39;em poker, blackjack, roulette and bingo, with real cards, a real wheel and real bingo balls, played for shells. Go inside, open a table and sit one of your own Tickles down to play.</p><div class="kv">';
    for (const Cs of App.casinos) h += '<span class="k"><button class="btn" data-casino="' + Cs.i + '">' + esc(Cs.name) + "</button></span><span>" + esc(App.regions[Cs.region].name) + " &middot; the house is " + (st.casinoBank[Cs.i] >= 0 ? "up " : "down ") + Math.abs(Math.round(st.casinoBank[Cs.i] || 0)) + " shells</span>";
    h += '<span class="k">Played</span><span>' + L.rounds.toLocaleString() + " rounds" + (L.best ? " &middot; biggest win: " + esc(nm(L.best.id)) + ", " + Math.round(L.best.n) + " shells at " + esc(GAME_NAME[L.best.game].toLowerCase()) : "") + "</span></div></div>";
    return h;
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-casino]"); if (b && App.casinos[+b.dataset.casino]) { const Cs = App.casinos[+b.dataset.casino]; App.flyTo(Cs.x, Cs.z, 30); } });
})(typeof self !== "undefined" ? self : this);
