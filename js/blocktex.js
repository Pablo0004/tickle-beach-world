/* Block textures: a small pixel texture on every face of the terrain's blocks (grass, sand grains, wet sand,
 * dirt, cobbles, bark and the rings of a cut log, planks, leaves, gravel paths, farmland furrows, plaster), 16
 * pixels to a block so the world stays made of cubes. The textures are drawn here at load into one atlas and
 * multiplied with the block's colour, its ambient occlusion and its shading (world.js meshChunk). Most tiles are
 * shades of grey (so the palette colours stay the block's own); the side of a grass block is drawn in colour, with
 * its ragged fringe of grass over the dirt. Each tile is surrounded by a wrapped copy of itself, so mipmaps do not
 * bleed between tiles. */
(function () {
  "use strict";
  const App = window.App;
  const TS = 16, PITCH = 32, COLS = 4, SIZE = PITCH * COLS;
  const T = { GRASS: 0, GRASS_SIDE: 1, DIRT: 2, SAND: 3, WETSAND: 4, STONE: 5, LOG: 6, LOG_TOP: 7, PLANK: 8, LEAF: 9, PATH: 10, FARM: 11, PLASTER: 12 };
  // a seeded random number per tile, so the textures are the same on every load
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (v) => Math.max(0, Math.min(1, v));
  // each tile: a 16x16 grid of brightness (0..1), or of [r, g, b] for the grass side
  const grid = (f) => { const g = []; for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) g.push(f(x, y)); return g; };
  // little clumps of lighter or darker pixels (pebbles, grains), wrapping round the tile's edges
  function clumps(g, r, n, size, val) {
    for (let k = 0; k < n; k++) {
      const cx = Math.floor(r() * TS), cy = Math.floor(r() * TS);
      for (let j = 0; j < size; j++) { const x = (cx + (j % 2)) % TS, y = (cy + (j >> 1)) % TS; g[y * TS + x] = typeof val === "function" ? val(g[y * TS + x]) : val; }
    }
    return g;
  }
  // cobbles: the nearest of a few stones (the tile wraps), the gaps between them dark
  function cobbles(r, n, gap) {
    const pts = []; for (let k = 0; k < n; k++) pts.push([r() * TS, r() * TS, 0.78 + r() * 0.17]);
    return grid((x, y) => {
      let d1 = 1e9, d2 = 1e9, v = 0.85;
      for (const p of pts) for (let ox = -TS; ox <= TS; ox += TS) for (let oy = -TS; oy <= TS; oy += TS) {
        const d = Math.hypot(x + 0.5 - p[0] - ox, y + 0.5 - p[1] - oy);
        if (d < d1) { d2 = d1; d1 = d; v = p[2]; } else if (d < d2) d2 = d;
      }
      return d2 - d1 < gap ? 0.55 + r() * 0.06 : clamp(v + (r() - 0.5) * 0.07 - (d1 > 3.2 ? 0.04 : 0));
    });
  }
  function draw() {
    const tiles = [];
    let r = rng(11);
    tiles[T.GRASS] = grid(() => { const q = r(); return q < 0.15 ? 0.6 : q > 0.92 ? 1 : 0.76 + r() * 0.16; });
    r = rng(12);
    const dirt = () => clumps(clumps(grid(() => 0.77 + r() * 0.12), r, 7, 3, 0.62), r, 5, 1, 0.97);
    tiles[T.DIRT] = dirt();
    tiles[T.SAND] = (r = rng(13), grid(() => { const q = r(); return q < 0.14 ? 0.68 : q > 0.94 ? 1 : 0.84 + r() * 0.1; }));
    tiles[T.WETSAND] = (r = rng(14), grid((x, y) => { const q = r(); return (q < 0.16 ? 0.7 : q > 0.97 ? 0.98 : 0.84 + r() * 0.07) - ((y + Math.floor(x / 5)) % 6 === 0 ? 0.05 : 0); }));
    tiles[T.STONE] = (r = rng(15), cobbles(r, 6, 0.9));
    r = rng(16);
    const barkCol = []; for (let x = 0; x < TS; x++) barkCol.push(0.7 + r() * 0.2);
    tiles[T.LOG] = grid((x, y) => { const groove = (x * 7 + Math.floor(y / 4) * 3) % 5 === 0; return clamp(barkCol[x] - (groove ? 0.16 : 0) + (r() - 0.5) * 0.08); });
    tiles[T.LOG_TOP] = (r = rng(17), grid((x, y) => { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8); return d > 7 ? 0.62 + r() * 0.08 : clamp(0.86 + Math.sin(d * 2.1) * 0.08 + (r() - 0.5) * 0.05); }));
    r = rng(18);
    const board = []; for (let b = 0; b < 4; b++) board.push(0.82 + r() * 0.13);
    tiles[T.PLANK] = grid((x, y) => {
      const b = y >> 2, within = y & 3, off = (b * 5) % TS;
      if (within === 3) return 0.56; // the gap under each board
      if ((x + off) % TS === 0) return 0.62; // where two boards meet
      if (within === 1 && (x + off) % TS === 2) return 0.6; // a nail
      return clamp(board[b] - (r() < 0.2 ? 0.07 : 0) + (r() - 0.5) * 0.05);
    });
    tiles[T.LEAF] = (r = rng(19), grid(() => { const q = r(); return q < 0.24 ? 0.55 : q > 0.9 ? 1 : 0.78 + r() * 0.14; }));
    tiles[T.PATH] = (r = rng(20), clumps(clumps(grid(() => 0.78 + r() * 0.15), r, 9, 3, 0.6), r, 6, 2, 1));
    tiles[T.FARM] = (r = rng(21), grid((x, y) => { const ridge = (y & 3) < 2; return clamp((ridge ? 0.93 : 0.64) + (r() - 0.5) * 0.1); }));
    tiles[T.PLASTER] = (r = rng(22), grid(() => (r() < 0.06 ? 0.84 : 0.9 + r() * 0.06)));
    // the side of a grass block, in colour: dirt, and a ragged fringe of grass hanging over it from the top
    r = rng(23);
    const G = App.blockLin[App.BLOCK.GRASS] || [0, 0.35, 0.005], D = App.blockLin[App.BLOCK.DIRT] || [0.32, 0.15, 0.06], dside = dirt();
    const fringe = []; for (let x = 0; x < TS; x++) fringe.push(3 + Math.floor(r() * 3) - (x % 5 === 2 ? 1 : 0));
    tiles[T.GRASS_SIDE] = grid((x, y) => { const g = y < fringe[x], k = g ? 0.8 + r() * 0.15 - (y === fringe[x] - 1 ? 0.1 : 0) : dside[y * TS + x]; const c = g ? G : D; return [c[0] * k, c[1] * k, c[2] * k]; });
    // into the atlas: every tile in the middle of its 32-pixel cell, wrapped round into the margin
    const cv = document.createElement("canvas"); cv.width = cv.height = SIZE;
    const cx = cv.getContext("2d"), img = cx.createImageData(SIZE, SIZE);
    tiles.forEach((t, i) => {
      const x0 = (i % COLS) * PITCH, y0 = Math.floor(i / COLS) * PITCH;
      for (let y = 0; y < PITCH; y++) for (let x = 0; x < PITCH; x++) {
        const v = t[((y + TS - 8) % TS) * TS + ((x + TS - 8) % TS)], p = ((y0 + y) * SIZE + x0 + x) * 4;
        const c = Array.isArray(v) ? v : [v, v, v];
        img.data[p] = Math.round(clamp(c[0]) * 255); img.data[p + 1] = Math.round(clamp(c[1]) * 255); img.data[p + 2] = Math.round(clamp(c[2]) * 255); img.data[p + 3] = 255;
      }
    });
    cx.putImageData(img, 0, 0);
    return cv;
  }
  // which tile a block's face shows: its top, its sides and its bottom can differ
  const B = App.BLOCK;
  App.blockTile = (b, ny) => {
    switch (b) {
      case B.GRASS: return ny > 0 ? T.GRASS : ny < 0 ? T.DIRT : T.GRASS_SIDE;
      case B.DIRT: return T.DIRT;
      case B.SAND: return T.SAND;
      case B.WETSAND: return T.WETSAND;
      case B.STONE: return T.STONE;
      case B.WOOD: return ny ? T.LOG_TOP : T.LOG;
      case B.PLANK: return T.PLANK;
      case B.LEAF: return T.LEAF;
      case B.PATH: return ny > 0 ? T.PATH : T.DIRT;
      case B.FARM: return ny > 0 ? T.FARM : T.DIRT;
      default: return T.PLASTER;
    }
  };
  App.TILE_IN_COLOUR = T.GRASS_SIDE; // its colours are in the texture: the face's own colour is left white
  // the corner (u, v in 0..1 across the block's face) of a tile in the atlas
  App.tileUV = (tile, u, v, out) => {
    out[0] = ((tile % COLS) * PITCH + 8 + u * TS) / SIZE;
    out[1] = 1 - (Math.floor(tile / COLS) * PITCH + 8 + (1 - v) * TS) / SIZE;
    return out;
  };
  // the tiles are a little darker than white on average: the block colours are raised by as much to keep the land's brightness
  App.TEX_GAIN = 1.14;
  let mat = null;
  App.terrainMaterial = () => {
    if (mat) return mat;
    const tex = new THREE.CanvasTexture(draw());
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = Math.min(8, App.renderer.capabilities.getMaxAnisotropy());
    mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: tex });
    return mat;
  };
})();
