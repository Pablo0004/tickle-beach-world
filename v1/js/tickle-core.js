/* Tickle Beach core: a faithful JS port of the on-chain model decoder, seed->traits picker,
 * part assembly and theme colouring found in htmlForToken() of
 * 0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce. Runs in the page and in the worker. */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});

  const SIDES = ["left", "right", "the"];
  const PARTS = ["arm", "leg", "mouth", "eyes", "body", "ground", "glasses", "tat", "shoes", "mustache",
    "headtop", "hand", "floor", "neck", "hat", "shirt"];
  const MODES = ["add", "sub", "int", "rep"];
  const PRIMS = ["attach", "cube", "cylinder", "bezier", "joint", "sphere", "triangle", "polygon"];
  const PARAMS = ["blend", "shell", "hole", "bevel", "round", "cone", "lineWidth", "vertexPosition", "torus",
    "mirrorX", "material", "blink", "star", "vertexCount", "offsX"];
  const USES = { cube: "bshbrc__tmm___o", cylinder: "bsh_rc__tmm___o", bezier: "bsh_rclvtmm___o",
    joint: "bs___c__tmm___o", sphere: "bs_______mmb__o", triangle: "bshbrc_vtmm___o", polygon: "bshbrc____m_sn_" };
  const KIND = "nnnnnnnnbbnbnnn";

  // Colour themes and skies exactly as shipped on-chain.
  const THEMES = [[10001, 10011, 10021], [10031, 10041, 10051], [10061, 10071, 10081], [10091, 10101, 10111],
    [10121, 10131, 10141], [10151, 10161, 10171], [10181, 10191, 10201], [10211, 10221, 10231],
    [10241, 10251, 10261], [10271, 10281, 10291], [10301, 10311, 10321], [10331, 10341, 10351],
    [10391, 10401, 10411]];
  const THEME_NAMES = ["Pink", "Maroon", "Blue", "Green", "Red & Black", "Beige", "Golden", "Purple", "Orange",
    "White, Black", "Yellow & Black", "Light Pink & Blue", "Brown & Blue"];
  const SKIES = [[0.6, 0.805, 1], [0.828, 0.848, 0.942], [0.614, 0.926, 0.998], [0.924, 0.819, 0.949]];
  const SLOTS = ["body", "floor", "glasses", "shirt", "ground", "hand", "headtop", "neck", "shoes"];
  const THEMED = ["floor", "glasses", "ground", "hand", "headtop", "neck", "shirt", "shoes"];
  const OPTIONAL = ["hand", "glasses", "ground", "headtop", "shirt", "neck"];
  const ATTACH_ORDER = ["shoes", "body", "eyes", "mouth", "glasses", "ground", "hand", "tat", "mustache",
    "headtop", "neck", "shirt"];
  // Trait labels used by tokenURI().
  const SLOT_LABEL = { body: "Character", floor: "Location", glasses: "Glasses", shirt: "Shirt", ground: "Ground",
    hand: "Holding", headtop: "Head", neck: "Necklace", shoes: "Shoes" };

  // ---------- decoding ----------
  function unpack(t) {
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+=";
    const e = new Array(t.length);
    for (let i = 0; i < t.length; i++) e[i] = A.indexOf(t[i]);
    const out = [];
    let n = 0;
    for (;;) {
      const v = e[Math.floor(n / 6)];
      if (n % 6 === 0) out.push(15 & v);
      else if (n % 6 === 2) out.push((60 & v) >> 2);
      else { const r = e[Math.floor((n + 4) / 6)]; out.push(((48 & v) >> 4) + ((3 & r) << 2)); }
      n += 4;
      if (Math.floor((n + 2) / 6) >= e.length) break;
    }
    const D = "0123456789+-.,;/";
    let s = "";
    for (let i = 0; i < out.length; i++) s += D[out[i]];
    return s;
  }

  function rd(s) { return { s, i: 0 }; }
  const NUM = /^[+-][\d.]*/;
  function num(r) {
    const m = NUM.exec(r.s.substring(r.i, r.i + 24));
    if (!m) return undefined;
    const t = m[0];
    if (t.length !== 1) { r.i += t.length; return parseFloat(t); }
    if (t[0] === "+") { r.i += 1; return 0; }
    return undefined;
  }
  function bool(r) { const b = r.s[r.i] === "+"; r.i += 1; return b; }

  function subpart(partName, r) {
    const prim = PRIMS[num(r)];
    let u = { primitive: prim };
    PARAMS.forEach((p, i) => { u[p] = KIND[i] === "n" && 0; });
    if (prim === "attach") {
      return { ...u, partName, attach: { part: PARTS[num(r)], side: SIDES[num(r)] },
        position: [num(r), num(r), num(r)], rotation: [0, 0, 0], size: [1, 1, 1], blend: num(r), material: 0 };
    }
    u = { ...u, partName, mode: MODES[num(r)], position: [num(r), num(r), num(r)],
      rotation: [num(r), num(r), num(r)], size: [num(r), num(r), num(r)] };
    PARAMS.forEach((p, i) => { if (USES[prim][i] !== "_") u[p] = KIND[i] === "n" ? num(r) : bool(r); });
    if (u.material < 0) u.material = 1e4 - u.material;
    u.material += 1;
    return u;
  }

  function parseModels(s) {
    const out = {};
    s.split(";").forEach((chunk) => {
      const r = rd(chunk);
      const part = PARTS[num(r)], side = SIDES[num(r)], index = num(r);
      const bounds = [[num(r), num(r), num(r)], [num(r), num(r), num(r)]];
      const layers = r.s.substring(r.i).split(",").map((L) => {
        const lr = rd(L), subs = [];
        while (lr.i < lr.s.length) subs.push(subpart(part, lr));
        return { subparts: subs };
      });
      out[part] = out[part] || [];
      out[part][index] = out[part][index] || {};
      out[part][index][side] = { part, side, index, layers, bounds };
    });
    return out;
  }
  function parseList(s, width) {
    const r = rd(s), out = [];
    while (r.i < r.s.length) { const v = []; for (let k = 0; k < width; k++) v.push(num(r)); out.push(v); }
    return out;
  }

  let REPO = null;
  function decodeRepo(packed) {
    const [m, mats, hard, rnd] = unpack(packed).split("/");
    return { models: parseModels(m), mats: parseList(mats, 2),
      hardcoded: parseList(hard.split(";")[0], 3), randomized: rnd.split(";").map((x) => parseList(x, 3)) };
  }
  function repo() {
    if (!REPO) REPO = decodeRepo(TB.MODELS);
    return REPO;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function repoIndex() {
    const R = repo(), t = {};
    for (const s of SLOTS) t[s] = R.models[s].filter((e) => !!e).map((e) => e.the.index).sort((a, b) => a - b);
    return t;
  }

  // ---------- seed -> traits (port of the on-chain picker) ----------
  function pickTraits(seed) {
    const t = repoIndex();
    const i = [];
    const u = seed + seed + seed + seed + seed;
    for (let e = 0; e < u.length; e += 7) i.push(parseInt(u.substr(e, 7), 16));
    const sel = {}, themeFor = {};
    for (const e of SLOTS) { const o = i.pop(), r = t[e]; sel[e] = r[o % r.length]; }
    const f = i.pop() % THEMES.length;
    for (const e of SLOTS) {
      if (THEMED.indexOf(e) !== -1) {
        const v = (i.pop() % 10) * 10 + (i.pop() % 10);
        if (v < 80) {
          if (v < 50) themeFor[e] = f;
          else themeFor[e] = i.pop() % THEMES.length;
        }
      }
      if (OPTIONAL.indexOf(e) !== -1) {
        if ((i.pop() % 10) * 10 + (i.pop() % 10) < 15) { delete sel[e]; delete themeFor[e]; }
      }
    }
    const sky = i.pop() % SKIES.length;
    return { sel, themeFor, sky };
  }

  // ---------- assembly (port of buildRepo with separate=false) ----------
  function addv(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function assemble(sel, rootPart) {
    const R = repo();
    rootPart = rootPart || "floor";
    if (sel[rootPart] === undefined) return null;
    const root = clone(R.models[rootPart][sel[rootPart]].the);
    const start = ATTACH_ORDER.indexOf(rootPart) + 1; // floor (-1) -> 0: attach everything
    for (const n of ATTACH_ORDER.slice(start)) {
      if (sel[n] === undefined || !R.models[n] || !R.models[n][sel[n]]) continue;
      const c = R.models[n][sel[n]].the;
      let f = 0, b = 0, found = false;
      outer: for (; f < root.layers.length; f++) {
        const L = root.layers[f];
        for (b = 0; b < L.subparts.length; b++) {
          const e = L.subparts[b];
          if (e.primitive === "attach" && e.attach.part === n) { found = true; break outer; }
        }
      }
      if (!found) continue;
      const t = root.layers[f].subparts[b].position;
      const add = c.layers.map((L) => ({ subparts: L.subparts.map((e) => ({ ...clone(e), position: addv(e.position, t) })) }));
      root.layers.splice(f, 0, ...add);
    }
    return root.layers.filter((L) => L.subparts.length > 0);
  }

  // ---------- theme colouring (port of the renderer's material remap) ----------
  function applyThemes(layers, sel, themeFor) {
    const h = {};
    for (const s of SLOTS) h[s] = {};
    for (const L of layers) for (const o of L.subparts) {
      if (o.primitive !== "attach" && o.mode !== "sub" && h[o.partName]) {
        h[o.partName][o.material] = (h[o.partName][o.material] || 0) + 1;
      }
    }
    const p = {};
    for (const s of SLOTS) p[s] = Object.entries(h[s]).sort((a, b) => b[1] - a[1]).map(([m, c]) => [parseInt(m, 10), c]);
    for (const L of layers) {
      const t = L.subparts[0].partName;
      if (!p[t]) continue;
      let o = p[t].map(([m]) => m);
      const r = o.length;
      let special = false, a = [];
      const T = sel;
      if (t === "ground") {
        if (T.ground === 2) { a = [3, 1, 2]; special = true; }
        else if (T.ground === 6) { a = [1, 2, 3]; special = true; }
        else if (T.ground === 7) { a = [0, 1, 3]; special = true; }
        else if (T.ground === 9) { a = [3, 4, 5]; special = true; }
        else if (T.ground === 10 || T.ground === 12) { a = [1, 2, 3]; special = true; }
        else if (T.ground === 15) { a = [0, 1, 3]; special = true; }
      } else if (t === "hand") {
        switch (T.hand) {
          case 1: a = [3, 1, 2]; special = true; break;
          case 4: case 5: a = [0, 1]; special = true; break;
          case 8: a = [4, 5]; special = true; break;
        }
      } else if (t === "floor" && T.floor === 1) { a = [1, 3]; special = true; }
      if (special) o = a.map((e) => (p[t][e] ? p[t][e][0] : -1));
      const th = themeFor[t];
      if (th === undefined) continue;
      const s = THEMES[th] || [];
      if (r <= s.length || special) {
        for (const e of L.subparts) {
          if (o[0] === e.material) e.material = s[0];
          else if (o[1] === e.material) e.material = s[1];
          else if (o[2] === e.material) e.material = s[2];
        }
      }
    }
    return layers;
  }

  // Recolour any set of layers the way the collection themes its parts: the three most used
  // materials take the theme's three colours.
  function recolor(layers, th) {
    const cnt = {};
    for (const L of layers) for (const o of L.subparts) if (o.primitive !== "attach" && o.mode !== "sub") cnt[o.material] = (cnt[o.material] || 0) + 1;
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => +m);
    const s = THEMES[th] || [];
    for (const L of layers) for (const o of L.subparts) {
      const k = top.indexOf(o.material);
      if (k >= 0 && s[k]) o.material = s[k];
    }
    return layers;
  }

  // material id -> sRGB 0..255
  function colorOf(m) {
    const R = repo();
    if (m < 1e4) return R.hardcoded[Math.round((m - 1) / 10)] || R.hardcoded[0];
    return R.randomized[0][Math.round((m - 1e4 - 1) / 10)] || R.hardcoded[0];
  }

  // Full Tickle -> {character layers, home layers}
  const CHAR_PARTS = new Set(["shoes", "body", "eyes", "mouth", "glasses", "hand", "tat", "mustache", "headtop", "neck", "shirt"]);
  function tickleLayers(seed) {
    const tr = pickTraits(String(seed));
    const layers = applyThemes(assemble(tr.sel, "floor"), tr.sel, tr.themeFor);
    const firstPart = (L) => (L.subparts.find((e) => e.primitive !== "attach") || L.subparts[0]).partName;
    const character = layers.filter((L) => CHAR_PARTS.has(firstPart(L)));
    const home = layers.filter((L) => !CHAR_PARTS.has(firstPart(L)));
    // where the shoes sit on the floor: used to centre the character
    let anchor = [0, 0, 0];
    for (const L of layers) for (const e of L.subparts) if (e.primitive === "attach" && e.attach.part === "shoes") anchor = e.position;
    return { traits: tr, character, home, all: layers, anchor };
  }

  // ---------- compiled stroke program (port of strokesToData) ----------
  function eulerInv(rx, ry, rz) {
    const sx = Math.sin(rx), sy = Math.sin(ry), sz = Math.sin(rz);
    const cx = Math.cos(rx), cy = Math.cos(ry), cz = Math.cos(rz);
    // GLSL mat3 columns of rotationMatrixFromEulers; inverse = transpose => rows = those columns
    return [cy * cz, cx * sz + cz * sx * sy, sx * sz - cx * cz * sy,
      -cy * sz, cx * cz - sx * sy * sz, cz * sx + cx * sy * sz,
      sy, -cy * sx, cx * cy];
  }
  function boundRadius(prim, s, lw, round, blend) {
    const ax = Math.abs(s[0]), ay = Math.abs(s[1]), az = Math.abs(s[2]);
    const mn = Math.max(2, Math.min(ax, ay, az));
    switch (prim) {
      case 1: case 2: return Math.hypot(ax, ay, az) + mn + 4;
      case 3: return Math.hypot(ax, 3 * ay, az) + Math.abs(lw) + az + 4;
      case 4: return az + ax + Math.abs(round) + 4;
      default: return Math.max(ax, ay, az) + 4;
    }
  }
  function compile(layers) {
    const out = [];
    for (const L of layers) {
      const sp = L.subparts;
      if (!sp.length) continue;
      const first = sp[0];
      sp.forEach((o, i) => {
        const prim = PRIMS.indexOf(o.primitive);
        const mode = MODES.indexOf(o.mode);
        const pos = o.position, s = o.size;
        const off = o.offsX || 0;
        const st = {
          prim, mode, px: pos[0], py: pos[1], pz: pos[2], R: eulerInv(o.rotation[0], o.rotation[1], o.rotation[2]),
          sx: s[0], sy: s[1], sz: s[2], blend: o.blend || 0, hole: o.hole || 0, bevel: o.bevel || 0,
          round: o.round || 0, cone: o.cone || 0, lw: o.lineWidth || 0, torus: o.torus ? 1 : 0,
          mirror: o.mirrorX ? 1 : 0, mat: o.material || 0, offsX: off,
          layerEnd: i === sp.length - 1 ? 1 : 0, layerMode: MODES.indexOf(first.mode), layerBlend: first.blend || 0,
          part: o.partName || "",
          // bounding spheres for culling (two when mirrored)
          c1x: o.mirrorX ? pos[0] - off + Math.abs(off) : pos[0], c2x: o.mirrorX ? pos[0] - off - Math.abs(off) : pos[0],
          cy: pos[1], cz: pos[2], rad: 0,
        };
        st.rad = boundRadius(prim, s, st.lw, st.round, st.blend);
        out.push(st);
      });
    }
    return out;
  }

  // ---------- compact (AI-facing) format ----------
  // {p:"cube"|"cylinder"|"bezier"|"joint"|"sphere", m:"add"|"sub"|"rep", pos, rot, size, blend, round, bevel,
  //  cone, hole, lw, torus, mirror, offsX, color(palette index), layer}
  function paletteList() {
    const R = repo();
    const list = R.hardcoded.map((c, i) => ({ i, mat: 10 * i + 1, rgb: c }));
    R.randomized[0].forEach((c, j) => list.push({ i: list.length, mat: 1e4 + 10 * j + 1, rgb: c }));
    return list;
  }
  function matToPaletteIndex(m) {
    const R = repo();
    if (m < 1e4) return Math.round((m - 1) / 10);
    return R.hardcoded.length + Math.round((m - 1e4 - 1) / 10);
  }
  function paletteIndexToMat(i) {
    const R = repo();
    i = Math.max(0, Math.min(Math.round(i), R.hardcoded.length + R.randomized[0].length - 1));
    if (i < R.hardcoded.length) return 10 * i + 1;
    return 1e4 + 10 * (i - R.hardcoded.length) + 1;
  }
  const r2 = (v) => Math.round(v * 100) / 100;
  function toCompact(layers) {
    const strokes = [];
    layers.forEach((L, li) => L.subparts.forEach((o) => {
      if (o.primitive === "attach") return;
      const c = { p: o.primitive, m: o.mode, pos: o.position.map(r2), rot: o.rotation.map(r2), size: o.size.map(r2) };
      if (o.blend) c.blend = r2(o.blend);
      if (o.round) c.round = r2(o.round);
      if (o.bevel) c.bevel = r2(o.bevel);
      if (o.cone) c.cone = r2(o.cone);
      if (o.hole) c.hole = r2(o.hole);
      if (o.lineWidth) c.lw = r2(o.lineWidth);
      if (o.torus) c.torus = true;
      if (o.mirrorX) { c.mirror = true; c.offsX = r2(o.offsX || 0); }
      c.color = matToPaletteIndex(o.material);
      c.layer = li;
      strokes.push(c);
    }));
    return strokes;
  }
  const ALLOWED = ["cube", "cylinder", "bezier", "joint", "sphere"];
  function fromCompact(strokes, partName) {
    const byLayer = new Map();
    for (const c of strokes) {
      const prim = ALLOWED.indexOf(c.p) >= 0 ? c.p : "sphere";
      const mode = ["add", "sub", "rep", "int"].indexOf(c.m) >= 0 ? c.m : "add";
      const v3 = (a, d) => (Array.isArray(a) && a.length === 3 ? a.map((x) => (Number.isFinite(+x) ? +x : d)) : [d, d, d]);
      const sub = {
        primitive: prim, mode, partName: partName || "prop",
        position: v3(c.pos, 0), rotation: v3(c.rot, 0), size: v3(c.size, 10).map((x) => Math.max(0.5, Math.abs(x))),
        blend: +c.blend || 0, round: Math.min(1, +c.round || 0), bevel: Math.min(1, +c.bevel || 0),
        cone: Math.min(1, +c.cone || 0), hole: Math.min(1, +c.hole || 0), lineWidth: +c.lw || 0,
        torus: !!c.torus, mirrorX: !!c.mirror, offsX: +c.offsX || 0, material: paletteIndexToMat(+c.color || 0),
      };
      if (prim === "bezier" && !sub.lineWidth) sub.lineWidth = 6;
      const li = Number.isFinite(+c.layer) ? +c.layer : 0;
      if (!byLayer.has(li)) byLayer.set(li, []);
      byLayer.get(li).push(sub);
    }
    return [...byLayer.keys()].sort((a, b) => a - b).map((k) => ({ subparts: byLayer.get(k) }));
  }

  Object.assign(TB, { SIDES, PARTS, MODES, PRIMS, THEMES, THEME_NAMES, SKIES, SLOTS, SLOT_LABEL, ALLOWED,
    unpack, decodeRepo, repo, repoIndex, pickTraits, assemble, applyThemes, recolor, colorOf, tickleLayers, compile,
    paletteList, matToPaletteIndex, paletteIndexToMat, toCompact, fromCompact, clone });
})(typeof self !== "undefined" ? self : this);
