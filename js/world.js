/* Open world engine: chunked block terrain streamed around the player (layout lives in geo.js),
 * voxel meshes, orbit camera, picking, daylight. */
(function () {
  "use strict";
  const App = (window.App = window.App || {});
  const S = (App.S = 1 / 160); // world units per SDF unit (a Tickle is ~3 blocks tall)
  const CH = (App.CH = 32), H = (App.H = 28), SEA = (App.SEA = 7);
  const WATER_Y = (App.WATER_Y = SEA - 0.22);
  const RANGE = (App.RANGE = { chunks: 4, scenery: 150, full: 46, pawns: 210, items: 50 });

  // ---------- blocks ----------
  const B = (App.BLOCK = { AIR: 0, SAND: 1, GRASS: 2, DIRT: 3, STONE: 4, WOOD: 5, PLANK: 6, WHITE: 7, RED: 8, BLUE: 9, YELLOW: 10, LEAF: 11, WETSAND: 12, PINK: 13, PATH: 14, FARM: 15 });
  const BLOCK_INFO = (App.BLOCK_INFO = {
    1: { name: "Sand", hex: "#ffe1a9" }, 2: { name: "Grass", hex: "#00a110" }, 3: { name: "Dirt", hex: "#9a6b45" },
    4: { name: "Stone", hex: "#9a9a9a" }, 5: { name: "Log", hex: "#7a5132" }, 6: { name: "Plank", hex: "#c79a62" },
    7: { name: "White", hex: "#f4f4f4" }, 8: { name: "Red", hex: "#e8443a" }, 9: { name: "Blue", hex: "#2f8fe0" },
    10: { name: "Yellow", hex: "#ffd23f" }, 11: { name: "Leaves", hex: "#00751f" }, 12: { name: "Wet sand", hex: "#d1b88a" },
    13: { name: "Pink", hex: "#ff8fc0" }, 14: { name: "Path", hex: "#f1a85f" }, 15: { name: "Farmland", hex: "#6b4a2a" },
  });
  const blockLin = (App.blockLin = {});
  App.initBlockColors = () => {
    const pal = TB.paletteList();
    for (const k in BLOCK_INFO) {
      const idx = TB.nearest(BLOCK_INFO[k].hex);
      const rgb = pal[idx].rgb;
      BLOCK_INFO[k].palette = idx;
      BLOCK_INFO[k].css = TB.rgbHex(rgb);
      blockLin[k] = rgb.map((v) => Math.pow(v / 255, 2.2));
    }
  };

  // ---------- noise ----------
  function hash2(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  App.hash2 = hash2;
  function vnoise(x, y, s) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15; }
  App.fbm = fbm;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // ---------- chunks ----------
  const chunks = (App.chunks = new Map());
  const ckey = (cx, cz) => cx + "," + cz;
  const li = (lx, y, lz) => (y * CH + lz) * CH + lx;
  function genChunk(cx, cz) {
    const data = new Uint8Array(CH * H * CH), hm = new Uint8Array(CH * CH);
    for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
      const gx = cx * CH + lx, gz = cz * CH + lz;
      const col = App.genColumn(gx + 0.5, gz + 0.5);
      let h = col.h;
      const top = col.top;
      const beach = top === B.SAND || top === B.WETSAND || top === B.PATH;
      for (let y = Math.max(0, h - 5); y < h; y++) {
        let t;
        if (y === h - 1) t = top;
        else if (y >= h - 3) t = beach ? B.SAND : top === B.STONE ? B.STONE : B.DIRT;
        else t = B.STONE;
        data[li(lx, y, lz)] = t;
      }
      const br = h <= SEA ? App.bridgeBlock(gx + 0.5, gz + 0.5) : null;
      if (br === "deck") { data[li(lx, SEA, lz)] = B.PLANK; if ((gx + gz) % 6 === 0) for (let y = Math.max(0, h); y < SEA; y++) data[li(lx, y, lz)] = B.WOOD; h = SEA + 1; }
      else if (br === "post" || br === "rail") { data[li(lx, SEA, lz)] = B.WOOD; if (br === "post") data[li(lx, SEA + 1, lz)] = B.WOOD; h = br === "post" ? SEA + 2 : SEA + 1; }
      hm[lx + lz * CH] = h;
    }
    return { cx, cz, data, hm, edits: null, mesh: null, dirty: true };
  }
  function chunk(cx, cz) {
    const k = ckey(cx, cz);
    let c = chunks.get(k);
    if (!c) {
      c = genChunk(cx, cz);
      const ed = App.savedEdits && App.savedEdits[k];
      if (ed) for (const [lx, y, lz, t] of ed) applyLocal(c, lx, y, lz, t, true);
      chunks.set(k, c);
    }
    return c;
  }
  App.chunk = chunk;
  function recomputeColumn(c, lx, lz) {
    let h = 0;
    for (let y = H - 1; y >= 0; y--) if (c.data[li(lx, y, lz)]) { h = y + 1; break; }
    c.hm[lx + lz * CH] = h;
  }
  function applyLocal(c, lx, y, lz, t, quiet) {
    c.data[li(lx, y, lz)] = t;
    recomputeColumn(c, lx, lz);
    if (!c.edits) c.edits = new Map();
    c.edits.set(lx + "," + y + "," + lz, t);
    c.dirty = true;
    if (!quiet) App.terrainEdited = true;
  }
  const fdiv = (a) => Math.floor(a / CH), fmod = (a) => ((a % CH) + CH) % CH;
  App.getBlock = (x, y, z) => {
    if (y < 0) return 1;
    if (y >= H) return 0;
    const c = chunk(fdiv(x), fdiv(z));
    return c.data[li(fmod(x), y, fmod(z))];
  };
  App.setBlock = (x, y, z, t) => {
    if (y < 0 || y >= H - 1) return false;
    const cx = fdiv(x), cz = fdiv(z), lx = fmod(x), lz = fmod(z);
    applyLocal(chunk(cx, cz), lx, y, lz, t);
    if (lx === 0) chunk(cx - 1, cz).dirty = true;
    if (lx === CH - 1) chunk(cx + 1, cz).dirty = true;
    if (lz === 0) chunk(cx, cz - 1).dirty = true;
    if (lz === CH - 1) chunk(cx, cz + 1).dirty = true;
    return true;
  };
  App.columnHeight = (x, z) => {
    const c = chunk(fdiv(x), fdiv(z));
    return c.hm[fmod(x) + fmod(z) * CH];
  };
  App.exportEdits = () => {
    const out = {};
    for (const [k, c] of chunks) if (c.edits && c.edits.size) out[k] = [...c.edits].map(([kk, t]) => kk.split(",").map(Number).concat(t));
    return Object.assign({}, App.savedEdits || {}, out);
  };

  // the jetty of every dock is walked on like land: its boards are level with the low bank
  const JETTY = (App.JETTY = { mid: 6.5, from: 1.5, to: 11.55, half: 1.3 });
  App.deckY = (x, z) => {
    // the on-chain piers by the shore (geo.js): walked on like the jetties
    const P = App.pierDecks;
    if (P) for (let i = 0; i < P.length; i++) {
      const p = P[i], dx = x - p.x, dz = z - p.z;
      if (dx > 5 || dx < -5 || dz > 5 || dz < -5) continue;
      const al = dx * p.ux + dz * p.uz, sd = dx * p.uz - dz * p.ux;
      if (al > -p.hl && al < p.hl && sd > -p.hw && sd < p.hw) return p.y;
    }
    const ds = App.docks;
    if (!ds) return null;
    for (let i = 0; i < ds.length; i++) {
      const D = ds[i], dx = x - D.x, dz = z - D.z;
      if (dx > 13 || dx < -13 || dz > 13 || dz < -13) continue;
      const along = dx * D.ux + dz * D.uz, side = dx * D.uz - dz * D.ux;
      if (along > JETTY.from && along < JETTY.to && side > -JETTY.half && side < JETTY.half) return WATER_Y + 0.22;
    }
    return null;
  };
  App.surfaceAt = (x, z) => {
    // (the walk along the top of a fortress's walls, geo.js)
    const wd = App.wallDeckY ? App.wallDeckY(x, z) : null;
    if (wd != null) return { y: wd, water: false, deck: true };
    const h = App.columnHeight(Math.floor(x), Math.floor(z));
    if (h < SEA) { const d = App.deckY(x, z); return d != null ? { y: d, water: false, deck: true } : { y: WATER_Y - 0.45, water: true, floor: h }; }
    return { y: h, water: false };
  };
  App.isLand = (x, z) => App.columnHeight(Math.floor(x), Math.floor(z)) >= SEA || App.deckY(x, z) != null;

  // ---------- three setup ----------
  let renderer, scene, camera, hemi, sun, water, seabed;
  App.initThree = (canvas) => {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 700);
    hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a5a, 0.9);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff1dc, 0.7);
    sun.position.set(30, 50, 20);
    scene.add(sun);
    scene.fog = new THREE.Fog(0x9cd0ff, 90, 175);
    const wg = new THREE.PlaneGeometry(900, 900, 1, 1); wg.rotateX(-Math.PI / 2);
    water = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: 0x2aa7c9, transparent: true, opacity: 0.68, depthWrite: false, side: THREE.DoubleSide }));
    water.position.y = WATER_Y; water.renderOrder = 2; scene.add(water);
    const sg = new THREE.PlaneGeometry(900, 900, 1, 1); sg.rotateX(-Math.PI / 2);
    seabed = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0x17657c }));
    seabed.position.y = 1; scene.add(seabed);
    App.scene = scene; App.camera = camera; App.renderer = renderer;
    App.voxMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
    makeSky();
    App.applyGfx();
    App.resize();
    initControls(canvas);
  };
  App.resize = () => {
    const c = renderer.domElement, w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // ---------- chunk meshing (culled faces + vertex AO) ----------
  const FACES = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], b: [1, 0, 0], shade: 0.86 },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], b: [0, 0, 0], shade: 0.86 },
    { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], b: [0, 1, 0], shade: 1 },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], b: [0, 0, 0], shade: 0.6 },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], b: [0, 0, 1], shade: 0.92 },
    { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0], b: [0, 0, 0], shade: 0.92 },
  ];
  const AO = [0.55, 0.72, 0.87, 1];
  const WHITE = [1, 1, 1];
  const UV = [0, 0];
  function meshChunk(c) {
    const pos = [], nor = [], col = [], idx = [], uvs = [];
    // the block textures (blocktex.js), unless the graphics settings turn them off
    const tex = App.blockTile && !(App.gfx && App.gfx.flatBlocks);
    let vc = 0;
    const ox = c.cx * CH, oz = c.cz * CH;
    const solid = (x, y, z) => {
      if (y < 0) return 1;
      if (y >= H) return 0;
      if (x >= 0 && x < CH && z >= 0 && z < CH) return c.data[li(x, y, z)] ? 1 : 0;
      return App.getBlock(ox + x, y, oz + z) ? 1 : 0;
    };
    for (let y = 0; y < H; y++) for (let z = 0; z < CH; z++) for (let x = 0; x < CH; x++) {
      const t = c.data[li(x, y, z)];
      if (!t) continue;
      const base = blockLin[t] || [1, 0, 1];
      const jit = 0.94 + hash2(ox + x * 7 + y, oz + z * 13 - y, 5) * 0.1;
      for (const f of FACES) {
        const fx = x + f.n[0], fy = y + f.n[1], fz = z + f.n[2];
        if (fy < 0 || solid(fx, fy, fz)) continue;
        const sideTint = t === B.GRASS && f.n[1] !== 1 ? blockLin[B.DIRT] : base;
        const tile = tex ? App.blockTile(t, f.n[1]) : -1, white = tile === App.TILE_IN_COLOUR, gain = tex ? App.TEX_GAIN : 1;
        const ao = [];
        for (let k = 0; k < 4; k++) {
          const a = k === 1 || k === 2 ? 1 : -1, bb = k >= 2 ? 1 : -1;
          const s1 = solid(fx + f.u[0] * a, fy + f.u[1] * a, fz + f.u[2] * a);
          const s2 = solid(fx + f.v[0] * bb, fy + f.v[1] * bb, fz + f.v[2] * bb);
          const cr = solid(fx + f.u[0] * a + f.v[0] * bb, fy + f.u[1] * a + f.v[1] * bb, fz + f.u[2] * a + f.v[2] * bb);
          ao.push(s1 && s2 ? 0 : 3 - (s1 + s2 + cr));
        }
        for (let k = 0; k < 4; k++) {
          const a = k === 1 || k === 2 ? 1 : 0, bb = k >= 2 ? 1 : 0;
          const px = x + f.b[0] + f.u[0] * a + f.v[0] * bb, py = y + f.b[1] + f.u[1] * a + f.v[1] * bb, pz = z + f.b[2] + f.u[2] * a + f.v[2] * bb;
          const tint = white ? WHITE : t === B.GRASS && f.n[1] === 0 && py > y + 0.5 ? base : sideTint;
          pos.push(px + ox, py, pz + oz);
          nor.push(f.n[0], f.n[1], f.n[2]);
          const kk = AO[ao[k]] * jit * f.shade * gain;
          col.push(tint[0] * kk, tint[1] * kk, tint[2] * kk);
          // where this corner falls on the block's face: across it (u) and up it (v; on the top, along z)
          if (tex) {
            const lx = px - x, ly = py - y, lz = pz - z;
            App.tileUV(tile, f.n[0] ? (f.n[0] > 0 ? 1 - lz : lz) : f.n[2] ? (f.n[2] > 0 ? lx : 1 - lx) : lx, f.n[1] ? lz : ly, UV);
            uvs.push(UV[0], UV[1]);
          }
        }
        if (ao[0] + ao[2] >= ao[1] + ao[3]) idx.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
        else idx.push(vc + 1, vc + 2, vc + 3, vc + 1, vc + 3, vc);
        vc += 4;
      }
    }
    if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
    c.dirty = false;
    if (!vc) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Int8BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    if (tex) g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(vc > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    c.mesh = new THREE.Mesh(g, tex ? App.terrainMaterial() : App.voxMaterial);
    scene.add(c.mesh);
  }
  // keep chunk meshes alive around the camera target
  App.streamTerrain = (budget) => {
    const tx = fdiv(Math.floor(cam.target.x)), tz = fdiv(Math.floor(cam.target.z));
    const R = RANGE.chunks + (cam.radius > 85 ? 1 : 0); // a ring more when zoomed far out, so the land fills the screen
    const want = [];
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dz * dz > (R + 0.5) * (R + 0.5)) continue;
      const c = chunk(tx + dx, tz + dz);
      if (!c.mesh || c.dirty) want.push([dx * dx + dz * dz, c]);
    }
    want.sort((a, b) => a[0] - b[0]);
    let n = 0;
    for (const [, c] of want) { meshChunk(c); if (++n >= (budget || 3)) break; }
    for (const [k, c] of chunks) {
      const d = Math.max(Math.abs(c.cx - tx), Math.abs(c.cz - tz));
      if (d > R + 1 && c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; c.dirty = true; }
      if (d > R + 4 && !c.edits) chunks.delete(k);
    }
    water.position.x = seabed.position.x = cam.target.x;
    water.position.z = seabed.position.z = cam.target.z;
    return want.length - n;
  };

  // ---------- voxel meshes from the worker ----------
  App.makeVoxMesh = (md) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(md.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(md.normal, 3, false));
    g.setAttribute("color", new THREE.BufferAttribute(md.color, 3, md.color instanceof Uint8Array));
    g.setIndex(new THREE.BufferAttribute(md.index, 1));
    const m = new THREE.Mesh(g, App.voxMaterial);
    m.scale.setScalar(md.voxel * S);
    m.position.set(md.origin[0] * S, md.origin[1] * S, md.origin[2] * S);
    return m;
  };
  App.meshBox = (md) => {
    const k = md.voxel * S;
    return new THREE.Box3(
      new THREE.Vector3(md.origin[0] * S + md.min[0] * k, md.origin[1] * S + md.min[1] * k, md.origin[2] * S + md.min[2] * k),
      new THREE.Vector3(md.origin[0] * S + md.max[0] * k, md.origin[1] * S + md.max[1] * k, md.origin[2] * S + md.max[2] * k));
  };
  // a mesh recentred so its footprint centre sits at the group origin and its base at y = 0
  App.centeredMesh = (md, geometry, keepY) => {
    const m = new THREE.Mesh(geometry, App.voxMaterial);
    m.scale.setScalar(md.voxel * S);
    const box = App.meshBox(md);
    m.position.set(md.origin[0] * S - (box.min.x + box.max.x) / 2, md.origin[1] * S - (keepY ? 0 : box.min.y), md.origin[2] * S - (box.min.z + box.max.z) / 2);
    return m;
  };
  const blobTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, "rgba(0,0,0,0.45)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  App.makeBlob = (r) => {
    const g = new THREE.PlaneGeometry(r * 2, r * 2); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    m.renderOrder = 1;
    return m;
  };
  App.makeRing = (color) => {
    const g = new THREE.RingGeometry(0.85, 1.05, 32); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color || 0xffd23f, transparent: true, opacity: 0.95, depthWrite: false }));
    m.renderOrder = 3;
    return m;
  };

  // ---------- camera ----------
  const cam = (App.cam = { target: new THREE.Vector3(0, SEA + 1, 0), theta: 0.75, phi: 0.92, radius: 46, follow: null, fly: null });
  // the view can pull back into the sky, the whole map in sight (the far view, farview.js, fills in what the
  // streamed chunks and scenery do not reach); the depth range and the water follow it out
  App.MAX_ZOOM = 2600;
  let depthR = 0;
  function depthFor(r) {
    if (Math.abs(r - depthR) < depthR * 0.05) return;
    depthR = r;
    camera.near = r > 150 ? r / 1500 : 0.1;
    camera.far = Math.max(700, r * 3.2 + 900);
    camera.updateProjectionMatrix();
    const k = Math.max(1, (r * 4.5 + 700) / 900);
    water.scale.set(k, 1, k); seabed.scale.set(k, 1, k);
  }
  function applyCamera() {
    if (App.fpCamera && App.fpCamera(camera)) { depthFor(46); return; } // first person (firstperson.js)
    depthFor(cam.radius);
    const { target, theta, phi, radius } = cam;
    camera.position.set(target.x + radius * Math.sin(phi) * Math.sin(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(target);
  }
  App.applyCamera = applyCamera;
  App.flyTo = (x, z, radius) => { cam.follow = null; cam.fly = { x, z, r: radius || Math.min(cam.radius, 40) }; };
  App.moveCamera = (dt, keys) => {
    if (App.fpOn && App.fpOn()) { App.fpFollow(dt, keys); return; }
    let mx = 0, mz = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) mz -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) mz += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
    if (mx || mz) {
      cam.follow = null; cam.fly = null;
      const sp = (12 + cam.radius * 0.9) * dt * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 3 : 1);
      const fx = Math.sin(cam.theta), fz = Math.cos(cam.theta);
      cam.target.x += (mx * fz + mz * fx) * sp;
      cam.target.z += (-mx * fx + mz * fz) * sp;
    }
    // turning the view: Z and X, or a smooth eighth of a turn from the buttons
    if (keys.has("KeyZ")) cam.theta -= dt * 1.7;
    if (keys.has("KeyX")) cam.theta += dt * 1.7;
    if (cam.spin) { const s = cam.spin * Math.min(1, dt * 7); cam.theta += s; cam.spin -= s; if (Math.abs(cam.spin) < 0.002) { cam.theta += cam.spin; cam.spin = 0; } }
    if (cam.fly) {
      const k = Math.min(1, dt * 3);
      cam.target.x += (cam.fly.x - cam.target.x) * k;
      cam.target.z += (cam.fly.z - cam.target.z) * k;
      cam.radius += (cam.fly.r - cam.radius) * k;
      if (Math.hypot(cam.fly.x - cam.target.x, cam.fly.z - cam.target.z) < 0.3) cam.fly = null;
    }
    const OB = App.OCEAN || App.WORLD;
    cam.target.x = Math.max(OB.minX, Math.min(OB.maxX, cam.target.x));
    cam.target.z = Math.max(OB.minZ, Math.min(OB.maxZ, cam.target.z));
    const s = App.surfaceAt(cam.target.x, cam.target.z);
    // following a Tickle up on its griffin: the camera goes up with it
    const fl = cam.follow != null && App.pop && App.pop.agent[cam.follow];
    const up = fl && fl.flyY != null ? Math.max(0, fl.pos.y - Math.max(WATER_Y, s.y)) : 0;
    cam.target.y += (Math.max(WATER_Y, s.y) + 1 + up - cam.target.y) * Math.min(1, dt * 4);
  };
  function initControls(el) {
    const pts = new Map();
    let mode = null, sx = 0, sy = 0, moved = false, lastPinch = 0, lastMid = null, lastAng = null;
    // left-drag grabs the ground under the cursor and slides the map so that spot stays under the cursor
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    let grab = null;
    const ndcOf = (x, y) => { const r = el.getBoundingClientRect(); return { x: ((x - r.left) / r.width) * 2 - 1, y: -((y - r.top) / r.height) * 2 + 1 }; };
    const groundUnder = (x, y) => {
      applyCamera(); camera.updateMatrixWorld();
      const r = App.rayFrom(ndcOf(x, y));
      const p = r.intersectPlane(plane, hit);
      return p && p.distanceTo(camera.position) < 700 ? p : null;
    };
    const startGrab = (x, y) => {
      const r = App.rayFrom(ndcOf(x, y));
      const v = App.pickVoxel(r), w = App.pickWater(r);
      plane.constant = -(v ? v.point.y : w ? w.y : cam.target.y);
      const p = groundUnder(x, y);
      grab = p ? p.clone() : null;
    };
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("pointerdown", (e) => {
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already released pointer */ }
      // in first person every pointer goes to firstperson.js (mouse capture, looking round, the touch stick)
      if (App.fpOn && App.fpOn()) { App.fpPointer("down", e); return; }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      sx = e.clientX; sy = e.clientY; moved = false;
      mode = e.button === 2 || e.button === 1 || e.ctrlKey || e.altKey ? "rot" : "pan";
      // pressing on a Tickle, an animal or a loose object picks it up instead of dragging the map
      if (mode === "pan" && pts.size === 1 && App.handPress && App.handPress(e)) mode = "hand";
      if (mode === "pan") startGrab(e.clientX, e.clientY);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; lastAng = Math.atan2(b.y - a.y, b.x - a.x); mode = "pinch"; }
    });
    el.addEventListener("pointermove", (e) => {
      if (App.fpOn && App.fpOn()) { App.fpPointer("move", e); return; }
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
      if (!moved) return;
      if (mode === "hand") {
        if (!App.handHolding()) App.handGrab();
        el.style.cursor = "grabbing";
        App.handMove(ndcOf(e.clientX, e.clientY));
        return;
      }
      if (mode === "pinch" && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        if (lastPinch) cam.radius = Math.max(8, Math.min(App.MAX_ZOOM, cam.radius * (lastPinch / d)));
        if (lastMid) pan(mid.x - lastMid.x, mid.y - lastMid.y);
        if (lastAng != null) { let da = ang - lastAng; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; cam.theta -= da; }
        lastPinch = d; lastMid = mid; lastAng = ang;
      } else if (mode === "rot") {
        cam.theta -= dx * 0.006;
        cam.phi = Math.max(0.25, Math.min(1.42, cam.phi - dy * 0.005));
      } else if (mode === "pan") {
        el.style.cursor = "grabbing";
        const p = grab && groundUnder(e.clientX, e.clientY);
        if (p) {
          cam.follow = null; cam.fly = null;
          const ddx = grab.x - p.x, ddz = grab.z - p.z, lim = cam.radius * 1.5, len = Math.hypot(ddx, ddz);
          const k = len > lim ? lim / len : 1;
          cam.target.x += ddx * k; cam.target.z += ddz * k;
        } else pan(dx, dy);
      }
    });
    el.addEventListener("pointerup", (e) => {
      if (App.fpOn && App.fpOn()) { App.fpPointer("up", e); pts.delete(e.pointerId); return; }
      const wasClick = !moved && pts.size === 1;
      if (mode === "hand") { App.handRelease(); mode = null; }
      pts.delete(e.pointerId);
      if (pts.size < 2) { lastPinch = 0; lastMid = null; lastAng = null; }
      if (pts.size === 1) { const [q] = [...pts.values()]; mode = "pan"; startGrab(q.x, q.y); }
      if (!pts.size) { grab = null; el.style.cursor = ""; }
      if (wasClick && App.onWorldClick) {
        const r = el.getBoundingClientRect();
        App.onWorldClick({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, e);
      }
    });
    el.addEventListener("pointercancel", (e) => { if (App.fpPointer) App.fpPointer("cancel", e); pts.delete(e.pointerId); if (!pts.size) { grab = null; el.style.cursor = ""; } });
    el.addEventListener("wheel", (e) => { e.preventDefault(); if (App.fpOn && App.fpOn()) { App.fpWheel(e.deltaY); return; } cam.radius = Math.max(8, Math.min(App.MAX_ZOOM, cam.radius * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
    function pan(dx, dy) {
      cam.follow = null; cam.fly = null;
      const k = cam.radius * 0.0016;
      const fx = Math.sin(cam.theta), fz = Math.cos(cam.theta);
      cam.target.x += (-dx * fz - dy * fx) * k;
      cam.target.z += (dx * fx - dy * fz) * k;
    }
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster();
  App.rayFrom = (ndc) => { ray.setFromCamera(ndc, camera); return ray.ray; };
  App.pickVoxel = (r) => {
    const o = r.origin, d = r.direction;
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
    let tx = (sx > 0 ? x + 1 - o.x : o.x - x) * tdx, ty = (sy > 0 ? y + 1 - o.y : o.y - y) * tdy, tz = (sz > 0 ? z + 1 - o.z : o.z - z) * tdz;
    let n = [0, 0, 0], t = 0;
    for (let i = 0; i < 500; i++) {
      if (y >= 0 && y < H && App.getBlock(x, y, z)) return { x, y, z, n, point: o.clone().addScaledVector(d, t) };
      if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; n = [-sx, 0, 0]; }
      else if (ty < tz) { y += sy; t = ty; ty += tdy; n = [0, -sy, 0]; }
      else { z += sz; t = tz; tz += tdz; n = [0, 0, -sz]; }
      if (y < -1 || t > 400) break;
    }
    return null;
  };
  App.pickWater = (r) => {
    if (Math.abs(r.direction.y) < 1e-6) return null;
    const t = (WATER_Y - r.origin.y) / r.direction.y;
    return t > 0 ? r.origin.clone().addScaledVector(r.direction, t) : null;
  };
  const v3 = new THREE.Vector3();
  App.project = (p) => {
    v3.copy(p).project(camera);
    const el = renderer.domElement;
    return { x: (v3.x * 0.5 + 0.5) * el.clientWidth, y: (-v3.y * 0.5 + 0.5) * el.clientHeight, behind: v3.z > 1 };
  };

  // ---------- daylight ----------
  const C = (r, g, b) => new THREE.Color(r, g, b);
  // no haze over the land: everything on the screen is shown clear (the fog object stays only for the blue
  // under the water in first person, firstperson.js)
  App.NO_FOG = { near: 1e5, far: 2e5 };
  App.fogRange = () => App.NO_FOG;
  App.daylight = (minuteOfDay) => {
    const h = minuteOfDay / 60;
    const sky = TB.SKIES[0];
    const day = C(sky[0], sky[1], sky[2]), dusk = C(0.98, 0.7, 0.52), night = C(0.06, 0.1, 0.2);
    let col, k;
    if (h < 5) { col = night; k = 0.15; }
    else if (h < 7) { const t = (h - 5) / 2; col = night.clone().lerp(dusk, Math.min(1, t * 1.6)).lerp(day, Math.max(0, t * 2 - 1)); k = 0.15 + t * 0.85; }
    else if (h < 18) { col = day; k = 1; }
    else if (h < 20.5) { const t = (h - 18) / 2.5; col = day.clone().lerp(dusk, Math.min(1, t * 1.7)).lerp(night, Math.max(0, t * 2 - 1)); k = 1 - t * 0.85; }
    else { col = night; k = 0.15; }
    const lin = col.clone().convertSRGBToLinear();
    scene.background = lin;
    scene.fog.color.copy(lin);
    hemi.intensity = 0.38 + k * 0.55;
    hemi.color.copy(C(1, 1, 1).lerp(C(0.6, 0.7, 1), 1 - k));
    sun.intensity = 0.12 + k * 0.62;
    const a = ((h - 6) / 12) * Math.PI;
    sun.position.set(Math.cos(a) * 40, Math.max(8, Math.sin(a) * 55), 25);
    water.material.color.setHex(k > 0.5 ? 0x2aa7c9 : 0x1b5f7a);
    App.isNight = k < 0.4;
    if (!(App.fpOn && App.fpOn())) { const f = App.fogRange(); scene.fog.near = f.near; scene.fog.far = f.far; }
    if (App.weatherLight) App.weatherLight(scene, hemi, sun, k); // cloud, rain, fog and lightning (weather.js)
    return k;
  };

  // ---------- the sky: a dome round the camera, deeper blue overhead and paler at the horizon ----------
  // (its colours follow the background colour the day, the night and the weather give the sky)
  let sky = null;
  function makeSky() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, ground: { value: new THREE.Color() } },
      vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; varying vec3 vDir; void main() { float h = vDir.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(min(1.0, h * 1.6), 0.7)) : mix(horizon, ground, min(1.0, -h * 6.0)); gl_FragColor = vec4(c, 1.0); }",
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat);
    sky.renderOrder = -10; sky.frustumCulled = false;
    scene.add(sky);
  }
  const SKY_DEEP = new THREE.Color(0.08, 0.26, 0.85);
  function updateSky() {
    if (!sky) return;
    const bg = scene.background && scene.background.isColor ? scene.background : null;
    sky.visible = !!bg;
    if (!bg) return;
    const U = sky.material.uniforms;
    U.horizon.value.copy(bg).lerp(new THREE.Color(1, 1, 1), 0.12);
    // overhead: a deeper blue by day; at night, dusk or under grey cloud it only darkens a little
    const blue = bg.b > bg.r * 1.4 ? 0.4 : 0.1;
    U.top.value.copy(bg).lerp(SKY_DEEP, blue).multiplyScalar(0.85);
    U.ground.value.copy(bg).multiplyScalar(0.8);
    sky.position.copy(camera.position);
    sky.scale.setScalar(camera.far * 0.9);
  }

  // ---------- the sun's shadows (Menu > Settings > Graphics: High and Ultra) ----------
  // A shadow map round the middle of the view, moved in whole texels so the shadows do not shimmer. The terrain,
  // the Tickles and the near copies of the scenery cast and receive them; at night the sun casts none.
  App.applyGfx = () => {
    const G = App.gfxLevel ? App.gfxLevel() : { shadows: 0, pixelRatio: 1.5 };
    renderer.setPixelRatio(Math.min(G.pixelRatio, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = !!G.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = !!G.shadows;
    if (G.shadows) {
      sun.shadow.mapSize.set(G.shadows, G.shadows);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      const R = G.shadows > 2048 ? 60 : 40, C = sun.shadow.camera;
      C.left = C.bottom = -R; C.right = C.top = R; C.near = 1; C.far = 400; C.updateProjectionMatrix();
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
      if (!sun.target.parent) scene.add(sun.target);
    }
    shadowStamp = 0;
    for (const o of scene.children) if (o.material) o.material.needsUpdate = true;
    if (App.resize) App.resize();
  };
  let shadowStamp = 0;
  const SUN = new THREE.Vector3();
  function updateShadows() {
    if (!renderer.shadowMap.enabled) return;
    const day = sun.intensity > 0.3 && !App.inside;
    sun.castShadow = day;
    if (!day) return;
    // the light looks from the sun's side at the middle of the view, snapped to the shadow map's texels
    SUN.copy(sun.position).normalize();
    const R = sun.shadow.camera.right, step = (2 * R) / sun.shadow.mapSize.x;
    const tx = Math.round(cam.target.x / step) * step, tz = Math.round(cam.target.z / step) * step, ty = Math.round(cam.target.y);
    sun.target.position.set(tx, ty, tz);
    sun.position.set(tx + SUN.x * 150, ty + SUN.y * 150, tz + SUN.z * 150);
    sun.target.updateMatrixWorld();
    // now and then, everything solid near enough casts and receives (new Tickles, new scenery copies, new chunks)
    const now = performance.now();
    if (now - shadowStamp > 1000) {
      shadowStamp = now;
      scene.traverse((o) => {
        if (!o.isMesh || o === sky || o === water || o === seabed) return;
        const m = o.material, solid = m && !m.transparent && !(m.isShaderMaterial) && !(m.isSpriteMaterial);
        const far = o.isInstancedMesh && o.userData.lod === "lo";
        o.castShadow = solid && !far; o.receiveShadow = solid;
      });
    }
  }
  App.render = () => {
    applyCamera();
    if (App.inside && App.renderInside) { App.renderInside(renderer, camera); return; }
    updateSky(); updateShadows();
    renderer.render(scene, camera);
  };
})();
