/* World: three.js scene, block terrain, voxel meshes, orbit camera, picking, overlays, daylight. */
(function () {
  "use strict";
  const App = (window.App = window.App || {});
  const S = (App.S = 1 / 160); // world units per SDF unit (a Tickle is ~3 blocks tall)
  const W = (App.W = 88), H = (App.H = 22), D = (App.D = 88), SEA = (App.SEA = 4);
  const WATER_Y = (App.WATER_Y = SEA - 0.22);

  // ---------- blocks ----------
  const B = (App.BLOCK = { AIR: 0, SAND: 1, GRASS: 2, DIRT: 3, STONE: 4, WOOD: 5, PLANK: 6, WHITE: 7, RED: 8, BLUE: 9, YELLOW: 10, LEAF: 11, WETSAND: 12, PINK: 13 });
  const BLOCK_INFO = (App.BLOCK_INFO = {
    1: { name: "Sand", hex: "#ecd29a" }, 2: { name: "Grass", hex: "#00a110" }, 3: { name: "Dirt", hex: "#9a6b45" },
    4: { name: "Stone", hex: "#9a9a9a" }, 5: { name: "Log", hex: "#7a5132" }, 6: { name: "Plank", hex: "#c79a62" },
    7: { name: "White", hex: "#f4f4f4" }, 8: { name: "Red", hex: "#e8443a" }, 9: { name: "Blue", hex: "#2f8fe0" },
    10: { name: "Yellow", hex: "#ffd23f" }, 11: { name: "Leaves", hex: "#00751f" }, 12: { name: "Wet sand", hex: "#d1b88a" },
    13: { name: "Pink", hex: "#ff8fc0" },
  });
  const blocks = (App.blocks = new Uint8Array(W * H * D));
  const heights = (App.heights = new Uint8Array(W * D));
  const bi = (x, y, z) => (y * D + z) * W + x;
  App.getBlock = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D ? 0 : blocks[bi(x, y, z)]);
  App.setBlock = (x, y, z, t) => {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return false;
    blocks[bi(x, y, z)] = t;
    let h = 0;
    for (let yy = H - 1; yy >= 0; yy--) if (blocks[bi(x, yy, z)]) { h = yy + 1; break; }
    heights[x + z * W] = h;
    App.terrainDirty = true;
    return true;
  };
  App.cellOf = (x, z) => [Math.floor(x + W / 2), Math.floor(z + D / 2)];
  App.cellCenter = (cx, cz) => [cx - W / 2 + 0.5, cz - D / 2 + 0.5];

  // palette-snapped block colours (linear), so blocks share the collection's colours
  const blockLin = {};
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
  function hash2(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15; }

  // ---------- plots ----------
  App.PLOT_R = 4.7;
  App.plots = [];
  function makePlots() {
    const n = 16, R = 23;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const rr = R + (i % 2 ? 2.5 : -1);
      App.plots.push({ i, x: Math.round(Math.cos(a) * rr) + 0.5, z: Math.round(Math.sin(a) * rr) + 0.5, h: SEA + 2, used: null });
    }
    App.plaza = { x: 0.5, z: 0.5, r: 6.5, h: SEA + 2 };
  }

  App.generateTerrain = (seed) => {
    blocks.fill(0);
    makePlots();
    const cx = W / 2, cz = D / 2, R0 = 36;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dz = z + 0.5 - cz;
      const r = Math.hypot(dx, dz) / R0 + (fbm(x * 0.05, z * 0.05, seed) - 0.5) * 0.42;
      let h;
      if (r < 1) h = SEA + Math.floor((1 - Math.pow(r, 1.7)) * 6 + (fbm(x * 0.11, z * 0.11, seed + 3) - 0.5) * 3.2);
      else h = Math.max(1, Math.floor(SEA - 1 - (r - 1) * 5));
      // flatten plaza and plots
      const wx = x + 0.5 - cx, wz = z + 0.5 - cz;
      const dp = Math.hypot(wx - App.plaza.x, wz - App.plaza.z);
      if (dp < App.plaza.r) h = App.plaza.h;
      else if (dp < App.plaza.r + 3) h = Math.round(h + (App.plaza.h - h) * (1 - (dp - App.plaza.r) / 3));
      for (const p of App.plots) {
        const d = Math.hypot(wx - p.x, wz - p.z);
        if (d < App.PLOT_R) h = p.h - 1;
        else if (d < App.PLOT_R + 2.5) h = Math.max(Math.min(h, p.h + 1), Math.round(h + (p.h - 1 - h) * (1 - (d - App.PLOT_R) / 2.5)));
      }
      h = Math.max(1, Math.min(H - 6, h));
      const beach = h <= SEA + 1;
      for (let y = 0; y < h; y++) {
        let t;
        if (y === h - 1) t = beach ? (h <= SEA - 1 ? B.WETSAND : B.SAND) : B.GRASS;
        else if (y >= h - 3) t = beach ? B.SAND : B.DIRT;
        else t = B.STONE;
        blocks[bi(x, y, z)] = t;
      }
      heights[x + z * W] = h;
    }
    App.terrainDirty = true;
  };

  App.surfaceAt = (x, z) => {
    for (const p of App.plots) if (p.used && Math.hypot(x - p.x, z - p.z) < App.PLOT_R - 0.6) return { y: p.h, water: false, plot: p };
    const [cx, cz] = App.cellOf(x, z);
    if (cx < 0 || cz < 0 || cx >= W || cz >= D) return { y: WATER_Y - 0.4, water: true };
    const h = heights[cx + cz * W];
    if (h < SEA) return { y: WATER_Y - 0.45, water: true, floor: h };
    return { y: h, water: false };
  };
  App.isLand = (x, z) => !App.surfaceAt(x, z).water;

  // ---------- three setup ----------
  let renderer, scene, camera, hemi, sun, water, seabed, terrainMesh;
  const voxMat = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  App.initThree = (canvas) => {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
    hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a5a, 0.9);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff1dc, 0.7);
    sun.position.set(30, 50, 20);
    scene.add(sun);
    scene.fog = new THREE.Fog(0x9cd0ff, 90, 260);
    const wg = new THREE.PlaneGeometry(700, 700, 1, 1);
    wg.rotateX(-Math.PI / 2);
    water = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: 0x2aa7c9, transparent: true, opacity: 0.78, depthWrite: false }));
    water.position.y = WATER_Y;
    water.renderOrder = 2;
    scene.add(water);
    const sg = new THREE.PlaneGeometry(700, 700, 1, 1);
    sg.rotateX(-Math.PI / 2);
    seabed = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0x1a6f86 }));
    seabed.position.y = 0.6;
    scene.add(seabed);
    App.scene = scene; App.camera = camera; App.renderer = renderer;
    App.voxMaterial = voxMat();
    App.resize();
    initControls(canvas);
  };
  App.resize = () => {
    const c = renderer.domElement, w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // ---------- terrain mesh ----------
  const FACES = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], b: [1, 0, 0], shade: 0.86 },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], b: [0, 0, 0], shade: 0.86 },
    { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], b: [0, 1, 0], shade: 1 },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], b: [0, 0, 0], shade: 0.6 },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], b: [0, 0, 1], shade: 0.92 },
    { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0], b: [0, 0, 0], shade: 0.92 },
  ];
  const AO = [0.55, 0.72, 0.87, 1];
  App.rebuildTerrain = () => {
    const pos = [], nor = [], col = [], idx = [];
    let vc = 0;
    const solid = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : y < 0 ? 1 : y >= H ? 0 : blocks[bi(x, y, z)] ? 1 : 0);
    const ox = -W / 2, oz = -D / 2;
    for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const t = blocks[bi(x, y, z)];
      if (!t) continue;
      const base = blockLin[t] || [1, 0, 1];
      const jit = 0.94 + hash2(x * 7 + y, z * 13 - y, 5) * 0.1;
      for (const f of FACES) {
        const fx = x + f.n[0], fy = y + f.n[1], fz = z + f.n[2];
        if (solid(fx, fy, fz)) continue;
        if (fy < 0) continue;
        let topTint = base;
        if (t === B.GRASS && f.n[1] !== 1) topTint = blockLin[B.DIRT];
        const ao = [];
        for (let c = 0; c < 4; c++) {
          const a = c === 1 || c === 2 ? 1 : -1, bb = c >= 2 ? 1 : -1;
          const s1 = solid(fx + f.u[0] * a, fy + f.u[1] * a, fz + f.u[2] * a);
          const s2 = solid(fx + f.v[0] * bb, fy + f.v[1] * bb, fz + f.v[2] * bb);
          const cr = solid(fx + f.u[0] * a + f.v[0] * bb, fy + f.u[1] * a + f.v[1] * bb, fz + f.u[2] * a + f.v[2] * bb);
          ao.push(s1 && s2 ? 0 : 3 - (s1 + s2 + cr));
        }
        for (let c = 0; c < 4; c++) {
          const a = c === 1 || c === 2 ? 1 : 0, bb = c >= 2 ? 1 : 0;
          let px = x + f.b[0] + f.u[0] * a + f.v[0] * bb, py = y + f.b[1] + f.u[1] * a + f.v[1] * bb, pz = z + f.b[2] + f.u[2] * a + f.v[2] * bb;
          // grass sides: top quarter stays green
          let tint = topTint;
          if (t === B.GRASS && f.n[1] === 0 && py > y + 0.5) tint = base;
          pos.push(px + ox, py, pz + oz);
          nor.push(f.n[0], f.n[1], f.n[2]);
          const k = AO[ao[c]] * jit * f.shade;
          col.push(tint[0] * k, tint[1] * k, tint[2] * k);
        }
        if (ao[0] + ao[2] >= ao[1] + ao[3]) idx.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
        else idx.push(vc + 1, vc + 2, vc + 3, vc + 1, vc + 3, vc);
        vc += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(vc > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    if (terrainMesh) { scene.remove(terrainMesh); terrainMesh.geometry.dispose(); }
    terrainMesh = new THREE.Mesh(g, App.voxMaterial);
    scene.add(terrainMesh);
    App.terrainDirty = false;
    App.terrainVerts = vc;
  };

  // ---------- voxel meshes from the worker ----------
  App.makeVoxMesh = (md) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(md.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(md.normal, 3, false));
    g.setAttribute("color", new THREE.BufferAttribute(md.color, 3));
    g.setIndex(new THREE.BufferAttribute(md.index, 1));
    const m = new THREE.Mesh(g, App.voxMaterial);
    m.scale.setScalar(md.voxel * S);
    m.position.set(md.origin[0] * S, md.origin[1] * S, md.origin[2] * S);
    return m;
  };
  // local-space box (world units) of a mesh made by makeVoxMesh
  App.meshBox = (md) => {
    const k = md.voxel * S;
    return new THREE.Box3(
      new THREE.Vector3(md.origin[0] * S + md.min[0] * k, md.origin[1] * S + md.min[1] * k, md.origin[2] * S + md.min[2] * k),
      new THREE.Vector3(md.origin[0] * S + md.max[0] * k, md.origin[1] * S + md.max[1] * k, md.origin[2] * S + md.max[2] * k));
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
  App.makeRing = () => {
    const g = new THREE.RingGeometry(0.85, 1.05, 32); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95, depthWrite: false }));
    m.renderOrder = 3;
    return m;
  };

  // ---------- camera controls ----------
  const cam = (App.cam = { target: new THREE.Vector3(0, SEA + 1, 0), theta: 0.75, phi: 0.92, radius: 62, follow: null });
  function applyCamera() {
    const { target, theta, phi, radius } = cam;
    camera.position.set(target.x + radius * Math.sin(phi) * Math.sin(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(target);
  }
  App.applyCamera = applyCamera;
  function initControls(el) {
    const pts = new Map();
    let mode = null, sx = 0, sy = 0, moved = false, lastPinch = 0, lastMid = null;
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      sx = e.clientX; sy = e.clientY; moved = false;
      mode = e.button === 2 || e.shiftKey ? "pan" : "rot";
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        lastPinch = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; mode = "pinch";
      }
    });
    el.addEventListener("pointermove", (e) => {
      const p = pts.get(e.pointerId);
      App.hoverNdc = { x: (e.clientX / el.clientWidth) * 2 - 1, y: -(e.clientY / el.clientHeight) * 2 + 1 };
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
      if (!moved) return;
      if (mode === "pinch" && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (lastPinch) cam.radius = Math.max(8, Math.min(120, cam.radius * (lastPinch / d)));
        if (lastMid) pan(mid.x - lastMid.x, mid.y - lastMid.y);
        lastPinch = d; lastMid = mid;
      } else if (mode === "rot") {
        cam.theta -= dx * 0.006;
        cam.phi = Math.max(0.25, Math.min(1.42, cam.phi - dy * 0.005));
      } else if (mode === "pan") pan(dx, dy);
    });
    const up = (e) => {
      const wasClick = !moved && pts.size === 1;
      pts.delete(e.pointerId);
      if (pts.size < 2) { lastPinch = 0; lastMid = null; }
      if (wasClick && App.onWorldClick) {
        const r = el.getBoundingClientRect();
        App.onWorldClick({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, e);
      }
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", (e) => { pts.delete(e.pointerId); });
    el.addEventListener("wheel", (e) => { e.preventDefault(); cam.radius = Math.max(8, Math.min(120, cam.radius * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
    function pan(dx, dy) {
      cam.follow = null;
      const k = cam.radius * 0.0016;
      const fx = Math.sin(cam.theta), fz = Math.cos(cam.theta);
      cam.target.x += (-dx * fz - dy * fx) * k;
      cam.target.z += (dx * fx - dy * fz) * k;
      cam.target.x = Math.max(-W / 2, Math.min(W / 2, cam.target.x));
      cam.target.z = Math.max(-D / 2, Math.min(D / 2, cam.target.z));
    }
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster();
  App.rayFrom = (ndc) => { ray.setFromCamera(ndc, camera); return ray.ray; };
  App.pickVoxel = (r) => { // Amanatides\u2013Woo through the block grid
    const o = r.origin.clone().add(new THREE.Vector3(W / 2, 0, D / 2)), d = r.direction;
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
    let tx = (sx > 0 ? x + 1 - o.x : o.x - x) * tdx, ty = (sy > 0 ? y + 1 - o.y : o.y - y) * tdy, tz = (sz > 0 ? z + 1 - o.z : o.z - z) * tdz;
    let n = [0, 0, 0], t = 0;
    for (let i = 0; i < 400; i++) {
      if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H && blocks[bi(x, y, z)]) {
        return { x, y, z, n, point: r.origin.clone().addScaledVector(d, t) };
      }
      if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; n = [-sx, 0, 0]; }
      else if (ty < tz) { y += sy; t = ty; ty += tdy; n = [0, -sy, 0]; }
      else { z += sz; t = tz; tz += tdz; n = [0, 0, -sz]; }
      if (y < -1 || y > H + 30) break;
    }
    return null;
  };
  App.pickWater = (r) => {
    if (Math.abs(r.direction.y) < 1e-6) return null;
    const t = (WATER_Y - r.origin.y) / r.direction.y;
    return t > 0 ? r.origin.clone().addScaledVector(r.direction, t) : null;
  };

  // ---------- overlay (name tags and speech bubbles) ----------
  const v3 = new THREE.Vector3();
  App.project = (p) => {
    v3.copy(p).project(camera);
    const el = renderer.domElement;
    return { x: (v3.x * 0.5 + 0.5) * el.clientWidth, y: (-v3.y * 0.5 + 0.5) * el.clientHeight, behind: v3.z > 1 };
  };

  // ---------- daylight ----------
  const C = (r, g, b) => new THREE.Color(r, g, b);
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
    return k;
  };

  App.render = () => {
    if (App.terrainDirty) App.rebuildTerrain();
    applyCamera();
    renderer.render(scene, camera);
  };
})();
