/* The build mode ("I'm in control", the dock), item 1.6, agreed with the owner on 28 October 2026.
 * Who may build where: playing as a holder, only on its own plot (its estate, its fortress, its lodge; in a town,
 * only where its own household lives), never on another holder's plot. Anything done on neutral land (no holder's
 * plot) is provisional: it goes before the Parliament (parliament.js), and lasts only if the chamber passes it;
 * thrown out, it is taken away again. With no holder chosen there is no plot of one's own, so only neutral land.
 * The tools: Build (one block, a line, a wall, filling an area, clearing an area, with a ghost of what goes down),
 * Dig, Place object (a catalogue in groups: the kit's furniture, garden, lights, decoration, stalls, fences,
 * statues, plants, play, and the designs approved in Review; a ghost to place it, R to turn it), Move (pick a
 * placed object up and set it down elsewhere) and Remove; and Undo (Ctrl+Z) for all of it. Everything placed is
 * a model of the kit or an approved design: strokes, as the rest of the world. */
(function () {
  "use strict";
  const App = window.App, st = App.st, $ = (id) => document.getElementById(id), DAY = 1440;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const B = () => st.build || (st.build = { pending: [], seq: 0 });

  // ---------- who may build where ----------
  App.editRight = (x, z) => {
    for (const v of App.gridNear ? App.gridNear("lot", x, z, 140) : []) {
      if (Math.hypot(v.x - x, v.z - z) > (v.r || 20) + 3) continue;
      if (v.vacant || (!v.holder && v.kind !== "town")) return { right: "neutral", place: v };
      if (v.kind === "town") return { right: st.wallet && (v.households || []).includes(st.wallet) ? "own" : "no", place: v };
      return { right: st.wallet && v.holder === st.wallet ? "own" : "no", place: v };
    }
    return { right: "neutral", place: null };
  };
  const RIGHT_TEXT = { no: "That is another holder's land: you may only build on your own plot.", neutral: "Neutral land: this goes before the Parliament, and stays only if it is passed." };

  // ---------- undo, and what waits for the Parliament ----------
  const undo = [];
  function record(op, right) {
    undo.push(op); if (undo.length > 60) undo.shift();
    if (right === "neutral") {
      const day = Math.floor(st.T / DAY), b = B();
      let E = b.pending.find((e) => e.day === day && !e.voted);
      if (!E) { E = { id: "edit" + day + "_" + b.seq++, day, ops: [], what: "" }; b.pending.push(E); }
      E.ops.push(op);
      E.what = "the works on neutral land (" + E.ops.length + " change" + (E.ops.length > 1 ? "s" : "") + ")";
      op.pending = E.id;
    }
  }
  function revert(op) {
    if (op.kind === "blocks") for (const [x, y, z, prev] of op.list.slice().reverse()) App.setBlock(x, y, z, prev);
    else if (op.kind === "add") { const p = st.props.find((q) => q.uid === op.uid); if (p) App.removeProp(p); }
    else if (op.kind === "remove") restoreProp(op.saved);
    else if (op.kind === "move") { const p = st.props.find((q) => q.uid === op.uid); if (p) setPropAt(p, op.from.x, op.from.z, op.from.rot); }
  }
  App.buildUndo = () => {
    const op = undo.pop();
    if (!op) { App.toast("Nothing to undo."); return; }
    revert(op);
    if (op.pending) { const E = B().pending.find((e) => e.id === op.pending); if (E) { E.ops = E.ops.filter((o) => o !== op); if (!E.ops.length) B().pending = B().pending.filter((e) => e !== E); } }
    App.toast("Undone.");
  };
  // the Parliament's agenda (parliament.js): the oldest works on neutral land not voted on yet
  App.pendingEdits = () => B().pending.filter((e) => !e.voted && e.ops.length);
  App.decideEdit = (id, passed) => {
    const b = B(), E = b.pending.find((e) => e.id === id);
    if (!E) return;
    E.voted = true;
    if (!passed) for (const op of E.ops.slice().reverse()) revert(op);
    for (const op of E.ops) { delete op.pending; const k = undo.indexOf(op); if (k >= 0 && !passed) undo.splice(k, 1); }
    b.pending = b.pending.filter((e) => e !== E);
    App.log("parliament", passed ? "Your works on neutral land will stay." : "Your works on neutral land have been taken away.", passed ? "The Parliament passed them." : "The Parliament threw them out.");
  };

  // ---------- blocks: one, a line, a wall, an area filled or cleared ----------
  const MODES = { one: "One block", line: "A line", wall: "A wall", fill: "Fill an area", clear: "Clear an area" };
  let anchor = null;
  function cellsBetween(a, b, mode, h) {
    const out = [];
    if (mode === "line" || mode === "wall") {
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z));
      for (let k = 0; k <= n; k++) { const x = Math.round(a.x + ((b.x - a.x) * k) / (n || 1)), z = Math.round(a.z + ((b.z - a.z) * k) / (n || 1)); for (let j = 0; j < (mode === "wall" ? h : 1); j++) out.push([x, a.y + j, z]); }
    } else {
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z);
      if ((x1 - x0 + 1) * (z1 - z0 + 1) > 900) return null; // (30 by 30 at most)
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        if (mode === "fill") out.push([x, a.y, z]);
        else for (let y = Math.max(1, Math.min(a.y, b.y)); y <= Math.max(a.y, b.y) + 6; y++) out.push([x, y, z]);
      }
    }
    return out;
  }
  function setBlocks(cells, type) {
    const own = [], neutral = [];
    let refused = 0;
    for (const [x, y, z] of cells) {
      const prev = App.getBlock(x, y, z);
      if ((type ? prev !== 0 : prev === 0) || y <= 0) continue;
      const R = App.editRight(x + 0.5, z + 0.5).right;
      if (R === "no") { refused++; continue; }
      App.setBlock(x, y, z, type);
      (R === "own" ? own : neutral).push([x, y, z, prev]);
    }
    if (own.length) record({ kind: "blocks", list: own }, "own");
    if (neutral.length) { record({ kind: "blocks", list: neutral }, "neutral"); App.toast(RIGHT_TEXT.neutral); }
    if (refused) App.toast(RIGHT_TEXT.no);
  }

  // ---------- placed objects: the kit's models and the approved designs ----------
  // the catalogue, in groups (the kit's own groups, shown under plain names); living things and whole buildings are left out
  const SKIP = /^(castle|castle2|castle3|palace|wall|walltower|gatehouse|gateleaf|catapultarm|mlodge|mfarm|mkeep|mcaptain|mvilla|mtropic|warren|townhouse|manor|horseleg|griffinwing|tentacle|serpenthump)$/;
  const LIVING = /^(Animals|Creatures|Dragons|Monsters|Lake|Myth|Wildlife)$/;
  const GROUP_NAME = { Interiors: "Furniture", Village: "Village and fences", Wealth: "Stalls, mounts and boats", Scenery: "Garden and plants", Props: "Decoration", Lights: "Lights", Play: "Play" };
  let catalogue = null;
  function buildCatalogue() {
    const G = new Map();
    for (const k in (window.TB && TB.KIT) || {}) {
      const K = TB.KIT[k];
      if (!K || SKIP.test(k) || LIVING.test(K.group || "")) continue;
      const g = GROUP_NAME[K.group] || K.group || "Other";
      if (!G.has(g)) G.set(g, []);
      for (const v of (K.variants || [0]).slice(0, 6)) G.get(g).push({ key: "kit:" + k + ":" + v, kit: k, v, name: K.name + (K.variants && K.variants.length > 1 && K.variantLabel ? " (" + K.variantLabel(v) + ")" : "") });
    }
    const designs = (st.assets || []).filter((a) => a.status === "approved" || a.status === "starter").map((a) => ({ key: "asset:" + a.id, asset: a.id, name: a.name }));
    const out = [];
    if (designs.length) out.push(["Approved designs", designs]);
    for (const [g, list] of G) out.push([g, list]);
    return out;
  }
  App.buildCatalogue = () => (catalogue = buildCatalogue());
  App.placeKitProp = (k, v, x, z, rot, saved) => {
    const g = new THREE.Group();
    g.position.set(x, App.surfaceAt(x, z).y, z);
    g.rotation.y = rot != null ? rot : 0;
    App.scene.add(g);
    const p = { uid: (saved && saved.uid) || App.uid("p"), kit: { k, v }, x, z, rot: g.rotation.y, group: g, rad: 1, height: 2 };
    st.props.push(p);
    App.kitMesh(k, v).then((r) => {
      const m = App.centeredMesh(r.md, r.geo, true); g.add(m);
      const bx = new THREE.Box3().setFromObject(m); p.rad = Math.max(0.6, Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2); p.height = bx.max.y - bx.min.y;
    });
    return p;
  };
  function setPropAt(p, x, z, rot) { p.x = x; p.z = z; if (rot != null) p.rot = rot; p.group.position.set(x, App.surfaceAt(x, z).y, z); p.group.rotation.y = p.rot; }
  const propSave = (p) => ({ uid: p.uid, assetId: p.assetId, kit: p.kit, x: p.x, z: p.z, rot: p.rot });
  function restoreProp(sv) {
    if (sv.kit) return App.placeKitProp(sv.kit.k, sv.kit.v, sv.x, sv.z, sv.rot, sv);
    const a = App.assetById(sv.assetId);
    return a ? App.placeProp(a, sv.x, sv.z, sv.rot, sv) : null;
  }
  App.restoreProp = restoreProp;

  // ---------- the ghost: what goes down, before it goes down ----------
  let ghost = null, ghostKey = "", hover = null, carrying = null;
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x7be08f, transparent: true, opacity: 0.35, depthWrite: false });
  const badMat = new THREE.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: 0.35, depthWrite: false });
  function setGhost(key, make) {
    if (ghostKey === key && ghost) return ghost;
    if (ghost) App.scene.remove(ghost);
    ghost = null; ghostKey = key;
    if (!make) return null;
    ghost = new THREE.Group(); App.scene.add(ghost);
    make(ghost);
    return ghost;
  }
  function tint(g, ok) { g.traverse((o) => { if (o.isMesh) o.material = ok ? ghostMat : badMat; }); }
  function modelGhost(item, g) {
    const done = (r) => { if (ghost !== g) return; const m = App.centeredMesh(r.md, r.geo, true); g.add(m); tint(g, true); };
    if (item.kit) App.kitMesh(item.kit, item.v).then(done);
    else { const a = App.assetById(item.asset), geo = a && App.assetGeometry(a); if (geo) done({ md: a.md, geo }); }
  }
  App.ui = App.ui || {};
  App.buildHover = (ndc) => {
    const ui = App.ui, tool = ui.tool;
    if (st.mode !== "manual" || App.inside || !["build", "dig", "place", "move"].includes(tool)) { setGhost("", null); return; }
    const r = App.rayFrom(ndc), v = App.pickVoxel(r);
    hover = v;
    if (!v) { if (ghost) ghost.visible = false; return; }
    if (tool === "build" || tool === "dig") {
      const g = setGhost("cube", (g) => g.add(new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.04, 1.04), ghostMat)));
      const c = tool === "build" ? { x: v.x + v.n[0], y: v.y + v.n[1], z: v.z + v.n[2] } : { x: v.x, y: v.y, z: v.z };
      g.visible = true; g.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5);
      tint(g, App.editRight(c.x + 0.5, c.z + 0.5).right !== "no");
      return;
    }
    const item = tool === "move" ? carrying && { kit: carrying.kit && carrying.kit.k, v: carrying.kit && carrying.kit.v, asset: carrying.assetId } : currentItem();
    if (!item) { if (ghost) ghost.visible = false; return; }
    const g = setGhost("m:" + (item.kit ? item.kit + item.v : item.asset), (g) => modelGhost(item, g));
    g.visible = true; g.position.set(v.point.x, App.surfaceAt(v.point.x, v.point.z).y, v.point.z); g.rotation.y = ui.placeRot || 0;
    tint(g, App.editRight(v.point.x, v.point.z).right !== "no" && App.isLand(v.point.x, v.point.z));
  };
  function currentItem() {
    const ui = App.ui, key = ui.placeKey;
    for (const [, list] of catalogue || App.buildCatalogue()) for (const it of list) if (it.key === key) return it;
    return null;
  }

  // ---------- clicks (ui.js hands them over) ----------
  App.buildClick = (hit) => {
    const ui = App.ui, tool = ui.tool, mode = ui.bmode || "one";
    if (tool === "build" || tool === "dig") {
      if (!hit || hit.type !== "voxel") return true;
      const v = hit.v, c = tool === "build" ? { x: v.x + v.n[0], y: v.y + v.n[1], z: v.z + v.n[2] } : { x: v.x, y: v.y, z: v.z };
      if (mode === "one" || (tool === "dig" && mode !== "clear")) { setBlocks([[c.x, c.y, c.z]], tool === "build" ? ui.block : 0); return true; }
      if (!anchor) { anchor = c; App.toast(MODES[mode] + ": now click where it ends."); return true; }
      const cells = cellsBetween(anchor, c, mode, ui.wallH || 3);
      anchor = null;
      if (!cells) { App.toast("That area is too big: 30 by 30 at most."); return true; }
      setBlocks(cells, mode === "clear" || tool === "dig" ? 0 : ui.block);
      return true;
    }
    if (tool === "place") {
      if (!hit || hit.type !== "voxel") return true;
      const it = currentItem(), pt = hit.v.point;
      if (!it) { App.toast("Choose something to place."); return true; }
      if (!App.isLand(pt.x, pt.z)) { App.toast("Objects need dry land."); return true; }
      const R = App.editRight(pt.x, pt.z).right;
      if (R === "no") { App.toast(RIGHT_TEXT.no); return true; }
      const p = it.kit ? App.placeKitProp(it.kit, it.v, pt.x, pt.z, ui.placeRot || 0) : App.placeProp(App.assetById(it.asset), pt.x, pt.z, ui.placeRot || 0);
      if (p) { record({ kind: "add", uid: p.uid }, R); if (R === "neutral") App.toast(RIGHT_TEXT.neutral); }
      return true;
    }
    if (tool === "remove") {
      if (!hit || hit.type !== "prop") { App.toast("Click an object you placed to take it away."); return true; }
      const R = App.editRight(hit.p.x, hit.p.z).right;
      if (R === "no") { App.toast(RIGHT_TEXT.no); return true; }
      const sv = propSave(hit.p); App.removeProp(hit.p); record({ kind: "remove", saved: sv }, R);
      return true;
    }
    if (tool === "move") {
      if (!carrying) {
        if (!hit || hit.type !== "prop") { App.toast("Click an object to pick it up."); return true; }
        if (App.editRight(hit.p.x, hit.p.z).right === "no") { App.toast(RIGHT_TEXT.no); return true; }
        carrying = hit.p; carrying.group.visible = false; ui.placeRot = carrying.rot;
        App.toast("Now click where it goes (R turns it).");
        return true;
      }
      const pt = hit && hit.type === "voxel" ? hit.v.point : null;
      if (!pt || !App.isLand(pt.x, pt.z)) { App.toast("Somewhere on dry land."); return true; }
      const R = App.editRight(pt.x, pt.z).right;
      if (R === "no") { App.toast(RIGHT_TEXT.no); return true; }
      const from = { x: carrying.x, z: carrying.z, rot: carrying.rot };
      setPropAt(carrying, pt.x, pt.z, ui.placeRot || 0); carrying.group.visible = true;
      record({ kind: "move", uid: carrying.uid, from }, R);
      carrying = null; setGhost("", null);
      return true;
    }
    return false;
  };
  App.buildToolChanged = (t) => {
    anchor = null;
    if (carrying && t !== "move") { carrying.group.visible = true; carrying = null; }
    setGhost("", null);
    $("buildRow").hidden = t !== "build" && t !== "dig";
    if (t === "place") fillCatalogue();
  };

  // ---------- the dock's rows ----------
  function fillCatalogue() {
    const ui = App.ui, gs = $("placeGroup"), sel = $("placeSel"), cat = App.buildCatalogue();
    if (!cat.length) return;
    if (!ui.placeGroup || !cat.some(([g]) => g === ui.placeGroup)) ui.placeGroup = cat[0][0];
    gs.innerHTML = cat.map(([g, list]) => '<option value="' + esc(g) + '">' + esc(g) + " (" + list.length + ")</option>").join("");
    gs.value = ui.placeGroup;
    const list = cat.find(([g]) => g === ui.placeGroup)[1];
    sel.innerHTML = list.map((it) => '<option value="' + esc(it.key) + '">' + esc(it.name) + "</option>").join("");
    if (!list.some((it) => it.key === ui.placeKey)) ui.placeKey = list[0].key;
    sel.value = ui.placeKey;
    gs.onchange = () => { ui.placeGroup = gs.value; ui.placeKey = null; fillCatalogue(); };
    sel.onchange = () => { ui.placeKey = sel.value; };
  }
  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") setTimeout(init, 0);
  let inited = false;
  function init() {
    if (inited || !$("buildRow")) return;
    inited = true;
    const ui = App.ui;
    ui.bmode = ui.bmode || "one"; ui.wallH = ui.wallH || 3;
    $("buildMode").innerHTML = Object.keys(MODES).map((k) => '<option value="' + k + '">' + MODES[k] + "</option>").join("");
    $("buildMode").onchange = (e) => { ui.bmode = e.target.value; anchor = null; };
    $("wallH").onchange = (e) => { ui.wallH = Math.max(1, Math.min(8, +e.target.value || 3)); };
    $("undoBtn").onclick = () => App.buildUndo();
    const cv = $("world");
    cv.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      App.buildHover({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 });
    });
    window.addEventListener("keydown", (e) => {
      if (st.mode !== "manual" || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) return;
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); App.buildUndo(); }
      else if ((e.key === "r" || e.key === "R") && (ui.tool === "place" || ui.tool === "move")) { ui.placeRot = ((ui.placeRot || 0) + Math.PI / 4) % (Math.PI * 2); if (ghost) ghost.rotation.y = ui.placeRot; }
    });
  }

  // ---------- save, load ----------
  App.initBuild = (saved) => { st.build = { pending: (saved && saved.pending) || [], seq: (saved && saved.seq) || 0 }; };
  App.saveBuild = () => st.build;
})();
