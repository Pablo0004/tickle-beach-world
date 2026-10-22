/* Tickle SDF engine: CPU port of the on-chain octree shader (evalScene + sdfStroke) and an
 * adaptive octree voxelizer that mimics the on-chain voxel look. Runs in the worker. */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});
  const SQ3 = Math.sqrt(3);
  const FAR = 1e6;

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const mix = (a, b, t) => a + (b - a) * t;
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  function extrude(pz, sdf, h) {
    const wx = sdf, wy = Math.abs(pz) - h;
    const ox = wx > 0 ? wx : 0, oy = wy > 0 ? wy : 0;
    return Math.min(Math.max(wx, wy), 0) + Math.sqrt(ox * ox + oy * oy);
  }
  function box2(px, py, bx, by) {
    const dx = Math.abs(px) - bx, dy = Math.abs(py) - by;
    const ox = dx > 0 ? dx : 0, oy = dy > 0 ? dy : 0;
    return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(dx, dy), 0);
  }
  function roundBox2(px, py, bx, by, r) {
    const qx = Math.abs(px) - bx + r, qy = Math.abs(py) - by + r;
    const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0;
    return Math.min(Math.max(qx, qy), 0) + Math.sqrt(ox * ox + oy * oy) - r;
  }
  function roundBox3(px, py, pz, bx, by, bz, r) {
    const qx = Math.abs(px) - bx, qy = Math.abs(py) - by, qz = Math.abs(pz) - bz;
    const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
  }
  function ellipsoid(px, py, pz, rx, ry, rz) {
    const ax = px / rx, ay = py / ry, az = pz / rz;
    const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
    const bx = ax / rx, by = ay / ry, bz = az / rz;
    const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
    if (k1 < 1e-12) return -Math.min(rx, ry, rz);
    return (k0 * (k0 - 1)) / k1;
  }
  function ellipse2(px, py, ax, ay) {
    if (Math.abs(ax - ay) < 1e-6) return Math.sqrt(px * px + py * py) - ax;
    px = Math.abs(px); py = Math.abs(py);
    if (px > py) { let t = px; px = py; py = t; t = ax; ax = ay; ay = t; }
    const l = ay * ay - ax * ax;
    const m = (ax * px) / l, m2 = m * m;
    const n = (ay * py) / l, n2 = n * n;
    const c = (m2 + n2 - 1) / 3, c3 = c * c * c;
    const q = c3 + m2 * n2 * 2;
    const d = c3 + m2 * n2;
    const g = m + m * n2;
    let co;
    if (d < 0) {
      const h = Math.acos(q / c3) / 3;
      const s = Math.cos(h), t = Math.sin(h) * SQ3;
      const rx = Math.sqrt(-c * (s + t + 2) + m2);
      const ry = Math.sqrt(-c * (s - t + 2) + m2);
      co = (ry + sign(l) * rx + Math.abs(g) / (rx * ry) - m) / 2;
    } else {
      const h = 2 * m * n * Math.sqrt(d);
      const s = sign(q + h) * Math.pow(Math.abs(q + h), 1 / 3);
      const u = sign(q - h) * Math.pow(Math.abs(q - h), 1 / 3);
      const rx = -s - u - c * 4 + 2 * m2;
      const ry = (s - u) * SQ3;
      const rm = Math.sqrt(rx * rx + ry * ry);
      co = (ry / Math.sqrt(rm - rx) + (2 * g) / rm - m) / 2;
    }
    const X = ax * co, Y = ay * Math.sqrt(1 - co * co);
    const r = Math.sqrt((X - px) * (X - px) + (Y - py) * (Y - py)) * sign(py - Y);
    if (r === r) return r;
    // numeric fallback (GPU would give garbage here too)
    const k = Math.sqrt((px * px) / (ax * ax) + (py * py) / (ay * ay));
    return (k - 1) * Math.min(ax, ay);
  }
  function dot2(x, y) { return x * x + y * y; }
  function bezier2(px, py, Ax, Ay, Bx, By, Cx, Cy) {
    const ax = Bx - Ax, ay = By - Ay;
    const bx = Ax - 2 * Bx + Cx, by = Ay - 2 * By + Cy;
    const cx = ax * 2, cy = ay * 2;
    const dx = Ax - px, dy = Ay - py;
    const bb = bx * bx + by * by;
    if (bb < 1e-12) { // straight line fallback
      const vx = Cx - Ax, vy = Cy - Ay, L = vx * vx + vy * vy || 1;
      const t = clamp(((px - Ax) * vx + (py - Ay) * vy) / L, 0, 1);
      return Math.sqrt(dot2(Ax + vx * t - px, Ay + vy * t - py));
    }
    const kk = 1 / bb;
    const kx = kk * (ax * bx + ay * by);
    const ky = (kk * (2 * (ax * ax + ay * ay) + (dx * bx + dy * by))) / 3;
    const kz = kk * (dx * ax + dy * ay);
    const p = ky - kx * kx, p3 = p * p * p;
    const q = kx * (2 * kx * kx - 3 * ky) + kz;
    let h = q * q + 4 * p3, res;
    if (h >= 0) {
      h = Math.sqrt(h);
      const x0 = (h - q) / 2, x1 = (-h - q) / 2;
      const u0 = sign(x0) * Math.pow(Math.abs(x0), 1 / 3), u1 = sign(x1) * Math.pow(Math.abs(x1), 1 / 3);
      const t = clamp(u0 + u1 - kx, 0, 1);
      res = dot2(dx + (cx + bx * t) * t, dy + (cy + by * t) * t);
    } else {
      const z = Math.sqrt(-p);
      const v = Math.acos(q / (p * z * 2)) / 3;
      const m = Math.cos(v), n = Math.sin(v) * 1.732050808;
      const t0 = clamp((m + m) * z - kx, 0, 1), t1 = clamp((-n - m) * z - kx, 0, 1);
      res = Math.min(dot2(dx + (cx + bx * t0) * t0, dy + (cy + by * t0) * t0),
        dot2(dx + (cx + bx * t1) * t1, dy + (cy + by * t1) * t1));
    }
    return Math.sqrt(res);
  }

  function modCube(px, py, pz, sx, sy, sz, round, hole, bevel, cone) {
    let d;
    round = Math.min(0.99, round);
    const rDim = round * Math.min(sx, sy, sz);
    if (hole > 0) {
      if (bevel > 0) {
        const holeRadius = Math.max(0, (1 - hole) * Math.min(sx, sy));
        round = round * Math.max(2, Math.min(holeRadius, sz));
        const bev = bevel * Math.min(sx - round, sy - round);
        const cs = cone > 0 ? ((cone * (pz + sz - round)) / (sz - round)) * 2 : 0;
        const boxW = mix(sz - round, round, cs), boxH = mix(sy - round, round, cs);
        d = roundBox2(px, py, boxW, boxH, mix(bev, 0, cs));
        d = extrude(pz, d, sz - round);
      } else {
        d = extrude(pz, Math.abs(box2(px, py, sx, sy)) - 1, sz);
      }
    } else if (bevel > 0 || round > 0 || cone > 0) {
      round = round * Math.max(2, Math.min(Math.min(sx, sy), sz));
      bevel = bevel * Math.min(sx - round, sy - round);
      const cs = cone > 0 ? (Math.abs(sz - round) > 1e-6 ? cone * clamp((pz + sz - round) / ((sz - round) * 2), 0, 1) : 0) : 0;
      const minW = Math.max(0, sx - sy), minH = Math.max(0, sy - sx);
      d = roundBox2(px, py, mix(sx - round, minW, cs), mix(sy - round, minH, cs), mix(bevel, 0, cs));
      d = extrude(pz, d, sz - round);
    } else {
      d = roundBox3(px, py, pz, sx - rDim, sy - rDim, sz - rDim, rDim);
    }
    return d - round;
  }
  function modCylinder(px, py, pz, sx, sy, sz, hole, cone, round) {
    const big = Math.abs(sz) > 1e-6;
    const r0 = big ? sx - (cone * sx * (pz + sz / 2)) / sz : sx;
    const r1 = big ? sy - (cone * sy * (pz + sz / 2)) / sz : sy;
    const hasRound = round > 0.1;
    round = hasRound ? Math.min(0.99, round) : 0;
    round = round * Math.min(sx, sy, sz);
    const circle = Math.abs(cone) < 1e-6 && Math.abs(sx - sy) < 1e-6;
    const ra = Math.max(2, r0 - round), rb = Math.max(2, r1 - round);
    const rDepth = Math.max(2, sz - round);
    let d;
    if (hole > 0) {
      const holeRadius = Math.max(0, (1 - hole) * Math.min(sx, sy, sz));
      d = circle ? Math.sqrt(px * px + py * py) - ra : ellipse2(px, py, ra, rb);
      d = extrude(pz, Math.abs(d - holeRadius), rDepth);
    } else {
      d = extrude(pz, circle ? Math.sqrt(px * px + py * py) - ra : ellipse2(px, py, ra, rb), rDepth);
    }
    return hasRound ? d - round : d;
  }
  function modBezier(px, py, pz, sx, sy, sz, mode, round, lw, torus) {
    round = Math.min(0.99, round) * Math.min(lw, sz);
    let d = bezier2(px, py, -sx, -sy, 0, sy * 3, sx, -sy) - (lw - round);
    if (mode === 1) {
      d = extrude(pz, d, Math.max(0, torus > 0 ? 0 : sz - lw)) - lw;
    } else if (torus > 0) {
      d = extrude(pz, Math.abs(d - Math.max(0, lw - 2)), Math.max(0, sz - lw)) - sz;
    } else {
      d = extrude(pz, d, sz - round);
      if (round > 0.1) d -= round;
    }
    return d;
  }
  function modJoint(px, py, pz, sx, sy, sz, cone, round) {
    const radius = cone > 0 ? sx - (cone * sx * (pz + sx * 2)) / (sz + sx * 2) : sx;
    const z = pz - clamp(pz, -sz, sz);
    let d = Math.sqrt(px * px + py * py + z * z) - radius;
    if (round > 0.1) d -= round;
    return d;
  }

  function strokeDist(s, x, y, z) {
    let qx, qy = y - s.py, qz = z - s.pz;
    if (s.mirror === 1) qx = Math.abs(x - (s.px - s.offsX)) - Math.abs(s.offsX);
    else qx = x - s.px;
    const R = s.R;
    const lx = R[0] * qx + R[1] * qy + R[2] * qz;
    const ly = R[3] * qx + R[4] * qy + R[5] * qz;
    const lz = R[6] * qx + R[7] * qy + R[8] * qz;
    switch (s.prim) {
      case 1: return modCube(lx, ly, lz, s.sx, s.sy, s.sz, s.round, s.hole, s.bevel, s.cone);
      case 2: return modCylinder(lx, ly, lz, s.sx, s.sy, s.sz, s.hole, s.cone, s.round);
      case 3: return modBezier(lx, ly, lz, s.sx, s.sy, s.sz, s.mode, s.round, s.lw, s.torus);
      case 4: return modJoint(lx, ly, lz, s.sx, s.sy, s.sz, s.cone, s.round);
      default: return ellipsoid(lx, ly, lz, s.sx, s.sy, s.sz);
    }
  }

  // ---- Result algebra (Result = {d, m1, m2, b, k}) ----
  function R(d, m1, m2, b, k) { return { d, m1, m2, b, k }; }
  function getBlend(d1, d2, bs) { return clamp((-Math.abs(d1 - d2) / bs + 1) * 0.5, 0, 1); }
  function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0); return Math.min(a, b) - (h * h * 0.25) / k; }
  function smoothUnion(f1, f2, k) {
    k = k / 2;
    const diff = f1.d > f2.d;
    const C = diff ? f2 : f1, F = diff ? f1 : f2;
    const mf1 = C.b < 0.5 ? C.m1 : C.m2;
    const mf2 = F.b < 0.5 ? F.m1 : F.m2;
    const ok = k > 0;
    const t = ok ? smin(f1.d, f2.d, k) : Math.min(f1.d, f2.d);
    const bnew = ok ? getBlend(f1.d, f2.d, k) : 0;
    const b = Math.max(C.b, bnew);
    const hi = b > bnew;
    return R(t, hi ? C.m1 : mf1, hi ? C.m2 : mf2, b, 0);
  }
  function union(a, b) { return a.d < b.d ? a : b; }
  function subtract(b, a) { return a.d > -b.d ? a : R(-b.d, a.m1, a.m2, a.b, 0); }
  function smoothSub(a, b, k) {
    if (!(k > 0)) return subtract(a, b);
    const h = Math.max(k - Math.abs(-a.d - b.d), 0);
    return R(Math.max(-a.d, b.d) + (h * h * 0.25) / k, b.m1, b.m2, b.b, 0);
  }
  function intersect(a, b) { return R(Math.max(b.d, a.d), b.m1, b.m2, b.b, b.k); }
  function replace(a, b) { const r = smoothUnion(a, b, a.k); return R(b.d, r.m1, r.m2, r.b, r.k); }

  // Port of evalScene(). mask (optional) marks strokes that may matter here; others count as far away.
  function evalScene(P, x, y, z, mask) {
    let res = R(9999, 0, 0, 0, 0), layerRes = null, layerCount = 0;
    for (let i = 0, n = P.length; i < n; i++) {
      const s = P[i], mode = s.mode;
      let d;
      if (mode < 0 || s.prim === 0 || (mask && !mask[i])) d = FAR;
      else d = strokeDist(s, x, y, z);
      const r = R(d, s.mat, 0, 0, s.blend);
      if (layerCount === 0) layerRes = R(9999, 0, 0, 0, 0);
      layerCount++;
      if (mode === 0) layerRes = r.k > 0 ? smoothUnion(r, layerRes, r.k) : union(r, layerRes);
      else if (mode === 1) layerRes = r.k > 0 ? smoothSub(r, layerRes, r.k) : subtract(r, layerRes);
      else if (mode === 2) layerRes = intersect(r, layerRes);
      else if (mode === 3) layerRes = replace(r, layerRes);
      if (s.layerEnd === 1) {
        if (layerCount > 1) {
          const lm = s.layerMode, lb = s.layerBlend;
          if (lm === 0) res = lb > 0 ? smoothUnion(layerRes, res, lb) : union(layerRes, res);
          else if (mode === 1) res = r.k > 0 ? smoothSub(layerRes, res, lb) : subtract(layerRes, res);
          else if (mode === 3) res = replace(layerRes, res);
        }
        layerCount = 0;
      }
    }
    return res;
  }

  // ---- voxelizer ----
  // opts: {voxel: SDF units per voxel, shell: fraction of a voxel kept outside the surface, colors: fn(mat)->[r,g,b] 0..255}
  function voxelize(P, opts) {
    const voxel = opts.voxel || 9;
    const shell = opts.shell == null ? 0.55 : opts.shell;
    // lip > 1 treats distances as possibly overestimated (steep cones), so no surface cell is skipped
    const lip = opts.lip || 1;
    const n = P.length;
    // bounds from additive strokes
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (const s of P) {
      if (s.mode !== 0 || s.prim === 0) continue;
      const r = s.rad;
      mnx = Math.min(mnx, s.c1x - r, s.c2x - r); mxx = Math.max(mxx, s.c1x + r, s.c2x + r);
      mny = Math.min(mny, s.cy - r); mxy = Math.max(mxy, s.cy + r);
      mnz = Math.min(mnz, s.cz - r); mxz = Math.max(mxz, s.cz + r);
    }
    if (!isFinite(mnx)) return { count: 0, positions: new Int16Array(0), colors: new Float32Array(0), voxel };
    const ext = Math.max(mxx - mnx, mxy - mny, mxz - mnz);
    const D = Math.max(1, Math.ceil(Math.log2(ext / voxel)));
    const side = voxel * Math.pow(2, D);
    const ox = (mnx + mxx) / 2 - side / 2, oy = (mny + mxy) / 2 - side / 2, oz = (mnz + mxz) / 2 - side / 2;
    const masks = [];
    for (let k = 0; k <= D; k++) masks.push(new Uint8Array(n));
    const all = new Uint8Array(n).fill(1);
    const pos = [], col = [], inner = [];
    const lin = new Map();
    const linOf = (m) => {
      let v = lin.get(m);
      if (!v) { const c = opts.colors(m); v = c.map((x) => Math.pow(x / 255, 2.2)); lin.set(m, v); }
      return v;
    };
    let evals = 0;
    function rec(cx, cy, cz, half, depth, parent) {
      const hd = half * SQ3;
      const mask = masks[depth];
      for (let i = 0; i < n; i++) {
        if (!parent[i]) { mask[i] = 0; continue; }
        const s = P[i];
        if (s.mode < 0 || s.prim === 0) { mask[i] = 0; continue; }
        if (s.mode === 2) { mask[i] = 1; continue; }
        const dy = cy - s.cy, dz = cz - s.cz;
        const ax = cx - s.c1x, bx = cx - s.c2x;
        const dd = Math.sqrt(Math.min(ax * ax, bx * bx) + dy * dy + dz * dz);
        mask[i] = dd - s.rad < hd + s.blend + 2 ? 1 : 0;
      }
      const r = evalScene(P, cx, cy, cz, mask);
      evals++;
      if (depth === D) {
        if (r.d < shell * voxel * lip) {
          pos.push(Math.round((cx - ox) / voxel - 0.5), Math.round((cy - oy) / voxel - 0.5), Math.round((cz - oz) / voxel - 0.5));
          const c1 = linOf(r.m1);
          if (r.m2 !== 0 && r.b > 0) {
            const c2 = linOf(r.m2);
            col.push(mix(c1[0], c2[0], r.b), mix(c1[1], c2[1], r.b), mix(c1[2], c2[2], r.b));
          } else col.push(c1[0], c1[1], c1[2]);
        }
        return;
      }
      if (r.d <= -hd * lip) { // fully inside: remember it so the mesher can hide inward faces
        inner.push(Math.round((cx - half - ox) / voxel), Math.round((cy - half - oy) / voxel), Math.round((cz - half - oz) / voxel), Math.round((2 * half) / voxel));
        return;
      }
      if (Math.abs(r.d) < hd * lip) {
        const q = half / 2;
        for (let o = 0; o < 8; o++) {
          rec(cx + (o & 1 ? q : -q), cy + (o & 2 ? q : -q), cz + (o & 4 ? q : -q), q, depth + 1, mask);
        }
      }
    }
    rec(ox + side / 2, oy + side / 2, oz + side / 2, side / 2, 0, all);
    return { count: pos.length / 3, positions: Int16Array.from(pos), colors: Float32Array.from(col),
      inner: Int16Array.from(inner), voxel, origin: [ox, oy, oz], depth: D, evals };
  }

  // ---- culled-face mesher with Minecraft-style vertex AO ----
  // Grid is remapped from SDF (x, y, z-up) to three.js (X = x, Y = z, Z = y), which matches the
  // on-chain camera (its screen-right is +x). Faces are built in three space, so winding is correct.
  const FACES = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], b: [1, 0, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], b: [0, 0, 0] },
    { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], b: [0, 1, 0] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], b: [0, 0, 0] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], b: [0, 0, 1] },
    { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0], b: [0, 0, 0] },
  ];
  const AO = [0.52, 0.7, 0.86, 1];
  function meshVoxels(vox) {
    const n = vox.count, P = vox.positions, C = vox.colors;
    const key = (X, Y, Z) => ((X + 1024) * 2048 + (Y + 1024)) * 2048 + (Z + 1024);
    const occ = new Set();
    for (let i = 0; i < n; i++) occ.add(key(P[3 * i], P[3 * i + 2], P[3 * i + 1]));
    // the solid inside comes as octree boxes; they are looked up by coarse cell rather than filled in voxel by voxel
    // (a big model's inside holds more voxels than a Set can)
    const IN = vox.inner || [], CELL = 16, cells = new Map();
    const ck = (X, Y, Z) => key(Math.floor(X / CELL), Math.floor(Y / CELL), Math.floor(Z / CELL));
    for (let i = 0; i < IN.length; i += 4) {
      const x0 = IN[i], y0 = IN[i + 2], z0 = IN[i + 1], sz = IN[i + 3]; // (in the mesh's axes: y and z swapped)
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + sz - 1) / CELL); cx++)
        for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y0 + sz - 1) / CELL); cy++)
          for (let cz = Math.floor(z0 / CELL); cz <= Math.floor((z0 + sz - 1) / CELL); cz++) { const k = key(cx, cy, cz); (cells.get(k) || cells.set(k, []).get(k)).push(i); }
    }
    const inside = (X, Y, Z) => {
      const L = cells.get(ck(X, Y, Z));
      if (L) for (const i of L) { const sz = IN[i + 3]; if (X >= IN[i] && X < IN[i] + sz && Y >= IN[i + 2] && Y < IN[i + 2] + sz && Z >= IN[i + 1] && Z < IN[i + 1] + sz) return true; }
      return false;
    };
    const has = (X, Y, Z) => (occ.has(key(X, Y, Z)) || inside(X, Y, Z) ? 1 : 0);
    const pos = [], nor = [], col = [], idx = [];
    let vc = 0;
    for (let i = 0; i < n; i++) {
      const X = P[3 * i], Y = P[3 * i + 2], Z = P[3 * i + 1];
      const r = C[3 * i], g = C[3 * i + 1], b = C[3 * i + 2];
      for (const f of FACES) {
        const fx = X + f.n[0], fy = Y + f.n[1], fz = Z + f.n[2];
        if (has(fx, fy, fz)) continue;
        const ao = [];
        for (let c = 0; c < 4; c++) {
          const a = c === 1 || c === 2 ? 1 : -1, bb = c >= 2 ? 1 : -1;
          const s1 = has(fx + f.u[0] * a, fy + f.u[1] * a, fz + f.u[2] * a);
          const s2 = has(fx + f.v[0] * bb, fy + f.v[1] * bb, fz + f.v[2] * bb);
          const cr = has(fx + f.u[0] * a + f.v[0] * bb, fy + f.u[1] * a + f.v[1] * bb, fz + f.u[2] * a + f.v[2] * bb);
          ao.push(s1 && s2 ? 0 : 3 - (s1 + s2 + cr));
        }
        for (let c = 0; c < 4; c++) {
          const a = c === 1 || c === 2 ? 1 : 0, bb = c >= 2 ? 1 : 0;
          pos.push(X + f.b[0] + f.u[0] * a + f.v[0] * bb, Y + f.b[1] + f.u[1] * a + f.v[1] * bb, Z + f.b[2] + f.u[2] * a + f.v[2] * bb);
          nor.push(f.n[0], f.n[1], f.n[2]);
          const k = AO[ao[c]];
          col.push(r * k, g * k, b * k);
        }
        if (ao[0] + ao[2] >= ao[1] + ao[3]) idx.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
        else idx.push(vc + 1, vc + 2, vc + 3, vc + 1, vc + 3, vc);
        vc += 4;
      }
    }
    // bounds in three grid units
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < n; i++) {
      const X = P[3 * i], Y = P[3 * i + 2], Z = P[3 * i + 1];
      if (X < mn[0]) mn[0] = X; if (Y < mn[1]) mn[1] = Y; if (Z < mn[2]) mn[2] = Z;
      if (X + 1 > mx[0]) mx[0] = X + 1; if (Y + 1 > mx[1]) mx[1] = Y + 1; if (Z + 1 > mx[2]) mx[2] = Z + 1;
    }
    const col8 = new Uint8Array(col.length);
    for (let i = 0; i < col.length; i++) col8[i] = Math.max(0, Math.min(255, Math.round(col[i] * 255)));
    return { position: Int16Array.from(pos), normal: Int8Array.from(nor), color: col8,
      index: vc > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx), verts: vc, voxels: n,
      // world placement (SDF units): three origin = (ox, oz, oy), scale = voxel
      origin: vox.origin ? [vox.origin[0], vox.origin[2], vox.origin[1]] : [0, 0, 0], voxel: vox.voxel,
      min: n ? mn : [0, 0, 0], max: n ? mx : [0, 0, 0] };
  }

  Object.assign(TB, { evalScene, voxelize, strokeDist, meshVoxels });
})(typeof self !== "undefined" ? self : this);
