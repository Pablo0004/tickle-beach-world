/* The far view. The camera can pull back up into the sky, with the whole map in sight; the streamed terrain chunks
 * and the scenery only reach so far round the middle of the view, so beyond them:
 *  - the land is one light heightfield of the whole map (a vertex every few blocks, coloured by its top block),
 *    sunk a little so the detailed chunks always cover it where they are;
 *  - the buildings and the trees: out to a middle distance coarse copies of the buildings' models, beyond that
 *    stand-ins of two boxes (walls and roof, trunk and canopy) in the model's own colours; the few big ones
 *    (castles, palaces, mansions, the statue) always keep their shape, in coarse cubes.
 * The land is built a little at a time after loading; all of it is only drawn while the camera is pulled back. */
(function () {
  "use strict";
  const App = window.App;
  const CELL = 6, SINK = 1.3;
  const ON_LAND = 80, ON_SCENERY = 100, ALL_FAR = 340; // camera distances from which each is drawn, and from which only the far copies are
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0);

  // ---------- the land ----------
  let land = null;
  function startLand() {
    const W = App.WORLD, nx = Math.ceil((W.maxX - W.minX) / CELL) + 1, nz = Math.ceil((W.maxZ - W.minZ) / CELL) + 1;
    land = { nx, nz, row: 0, pos: new Float32Array(nx * nz * 3), col: new Float32Array(nx * nz * 3), mesh: null, x0: W.minX, z0: W.minZ };
  }
  // a few rows each frame, about 4 ms
  function growLand() {
    const L = land, t0 = performance.now(), B = App.blockLin, S = App.SEA;
    while (L.row < L.nz && performance.now() - t0 < 4) {
      const z = L.z0 + L.row * CELL;
      for (let i = 0; i < L.nx; i++) {
        const x = L.x0 + i * CELL, c = App.genColumn(x + 0.5, z + 0.5), o = (L.row * L.nx + i) * 3;
        // under water the bed; the coast keeps its sand
        L.pos[o] = x; L.pos[o + 1] = c.h - SINK; L.pos[o + 2] = z;
        const rgb = B[c.top] || B[1] || [0.5, 0.5, 0.5], j = 0.93 + App.hash2(i, L.row, 931) * 0.1, wet = c.h < S ? 0.7 : 1;
        L.col[o] = rgb[0] * j * wet; L.col[o + 1] = rgb[1] * j * wet; L.col[o + 2] = rgb[2] * j * wet;
      }
      L.row++;
    }
    if (L.row < L.nz) return;
    const idx = new Uint32Array((L.nx - 1) * (L.nz - 1) * 6);
    let k = 0;
    for (let r = 0; r < L.nz - 1; r++) for (let i = 0; i < L.nx - 1; i++) {
      const a = r * L.nx + i, b = a + 1, c = a + L.nx, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(L.pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(L.col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    L.mesh = new THREE.Mesh(g, App.voxMaterial);
    L.mesh.visible = false;
    App.scene.add(L.mesh);
  }

  // ---------- the buildings and the trees ----------
  const farGeo = {}, meshes = {};
  let list = null, sig = "";
  const SKIP = /^(fence|logseat|grass|trough|plotsign|campfire|duck|cattail|lilypad|seaweed|umbrella)/;
  // a stand-in made of two boxes in the model's own space: what is below (walls, a trunk) and what is above (a roof,
  // a canopy), each as wide as that part of the model and in its average colour
  const BOX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function standIn(md) {
    const P = md.position, C = md.color, norm = C instanceof Uint8Array ? 1 / 255 : 1, n = P.length / 3;
    let y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < n; i++) { const y = P[i * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const split = y0 + (y1 - y0) * 0.45, parts = [0, 1].map(() => ({ x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9, r: 0, g: 0, b: 0, w: 0 }));
    for (let i = 0; i < n; i++) {
      const y = P[i * 3 + 1], q = parts[y < split ? 0 : 1], x = P[i * 3], z = P[i * 3 + 2];
      if (x < q.x0) q.x0 = x; if (x > q.x1) q.x1 = x; if (z < q.z0) q.z0 = z; if (z > q.z1) q.z1 = z;
      q.r += C[i * 3] * norm; q.g += C[i * 3 + 1] * norm; q.b += C[i * 3 + 2] * norm; q.w++;
    }
    const pos = [], nor = [], col = [], idx = [];
    const box = (q, ya, yb) => {
      if (!q.w) return;
      const c = [q.r / q.w, q.g / q.w, q.b / q.w], lo = [q.x0, ya, q.z0], hi = [q.x1, yb, q.z1];
      for (const nv of BOX) {
        const ax = nv.findIndex((v) => v !== 0), sgn = nv[ax], u = (ax + 1) % 3, v = (ax + 2) % 3, base = pos.length / 3;
        for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
          const p = [0, 0, 0];
          p[ax] = sgn > 0 ? hi[ax] : lo[ax]; p[u] = a ? hi[u] : lo[u]; p[v] = b ? hi[v] : lo[v];
          pos.push(p[0], p[1], p[2]); nor.push(nv[0], nv[1], nv[2]); col.push(c[0], c[1], c[2]);
        }
        if (sgn > 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3); else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
    };
    box(parts[0], y0, split); box(parts[1], parts[0].w ? split : y0, y1);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }
  const landmark = {}, midGeo = {}, FRAG_SCALE = App.FRAG_SCALE || {};
  // a coarse copy of a model, about so many cubes across its longest side
  function coarse(key, cells) {
    const hi = App.frag[key], b = hi.box, dim = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    const F = TB.FRAGMENTS && TB.FRAGMENTS[key], m = key.match(/^(.*)_(\d+)$/), K = !F && m && TB.KIT[m[1]];
    const voxel = Math.max(K ? K.voxel[1] || 30 : 30, Math.round(dim / cells / App.S));
    const job = F ? App.job("fragment", { key, voxel }) : K ? App.job("compact", { strokes: K.build(+m[2]), voxel, lip: 1.5 }) : null;
    return job ? job.then((r) => App.fragEntry(r.mesh, hi.box)).catch(() => null) : Promise.resolve(null);
  }
  function startScenery() {
    list = (App.sceneryAll || []).filter((s) => (s.building || s.tree || s.giant || s.big) && !SKIP.test(s.type));
    const count = {}, tree = {};
    for (const s of list) { count[s.type] = (count[s.type] || 0) + 1; if (s.tree) tree[s.type] = true; }
    for (const key in count) {
      const hi = App.frag[key];
      if (!hi) continue;
      const b = hi.box, dim = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
      // the few big ones (castles, palaces, mansions, the statue, arenas) always keep their shape, in coarse cubes;
      // the rest stand in, and the buildings get a coarse copy for the middle distance
      landmark[key] = dim * (FRAG_SCALE[key] || 1) > 12 && count[key] <= 80;
      farGeo[key] = { geo: standIn(hi.md), local: hi.local };
      if (landmark[key]) coarse(key, dim > 24 ? 22 : 16).then((e) => { if (e) { farGeo[key] = e; sig = ""; } });
      else if (!tree[key] && !/^wall/.test(key)) coarse(key, 11).then((e) => { if (e) { midGeo[key] = e; sig = ""; } });
    }
  }
  function placeScenery(tx, tz, radius) {
    // high up even the middle of the view is far away: the far copies take over everywhere. Out to a middle distance
    // the buildings are coarse copies of their models, beyond that the stand-ins
    const near = App.sceneryFar ? 0 : App.RANGE.scenery, mid = radius < 600 ? 280 : 0, far = 300 + radius * 4, byType = {};
    for (const s of list) {
      if (s.gone || !App.kitOn(App.kindOf(s.type)) || (App.isBroken && App.isBroken(s))) continue;
      const d = Math.hypot(s.x - tx, s.z - tz);
      if (d <= near || d > far || !farGeo[s.type]) continue;
      const k = s.type + (d <= mid && midGeo[s.type] ? ":mid" : ":far");
      (byType[k] = byType[k] || []).push(s);
    }
    for (const k0 in farGeo) for (const tier of [":mid", ":far"]) {
      const key = k0, F = tier === ":mid" ? midGeo[key] : farGeo[key], items = byType[key + tier] || [];
      if (!F) continue;
      let m = meshes[key + tier];
      if (!m && !items.length) continue;
      if (!m || m.instanceMatrix.count < items.length || m.geometry !== F.geo) {
        if (m) App.scene.remove(m);
        m = meshes[key + tier] = new THREE.InstancedMesh(F.geo, App.voxMaterial, Math.max(16, Math.ceil(items.length * 1.5)));
        m.frustumCulled = false;
        App.scene.add(m);
      }
      items.forEach((s, i) => {
        if (s.y == null) s.y = s.water ? App.WATER_Y : App.genHeight(s.x, s.z);
        Q.setFromAxisAngle(YAX, s.rot || 0);
        const k = s.scale || FRAG_SCALE[key] || 1;
        M4.compose(V.set(s.x, s.y, s.z), Q, SC.set(k, k, k)).multiply(F.local);
        m.setMatrixAt(i, M4);
      });
      m.count = items.length;
      m.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------- each frame ----------
  let started = false, shown = null;
  App.updateFarView = () => {
    if (!App.scene || !App.sceneryAll) return;
    if (!started) { started = true; startLand(); }
    if (land && !land.mesh) growLand();
    else if (!list) startScenery();
    const r = App.cam.radius, inside = !!App.inside || !!(App.fpOn && App.fpOn());
    if (land && land.mesh) land.mesh.visible = !inside && r > ON_LAND;
    const on = !inside && r > ON_SCENERY && !!list;
    const wasFar = !!App.sceneryFar;
    App.sceneryFar = on && r > ALL_FAR && Object.keys(farGeo).length > 0;
    if (wasFar !== App.sceneryFar && App.updateScenery) App.updateScenery(true);
    if (on) {
      const tx = App.cam.target.x, tz = App.cam.target.z, s = Math.floor(tx / 24) + "," + Math.floor(tz / 24) + "," + Math.round(Math.log(r) * 6) + "," + Object.keys(farGeo).length + "," + (App.sceneryDirtyFar ? 1 : 0) + (App.sceneryFar ? "f" : "");
      if (s !== sig) { sig = s; App.sceneryDirtyFar = false; placeScenery(tx, tz, r); }
    }
    if (on !== shown) { shown = on; for (const k in meshes) meshes[k].visible = on; }
  };
  App.farViewReady = () => !!(land && land.mesh && list);
  App.farStats = () => Object.keys(meshes).map((k) => [k, meshes[k].geometry.index ? meshes[k].geometry.index.count / 3 : 0, meshes[k].visible ? meshes[k].count : 0]);
})();
