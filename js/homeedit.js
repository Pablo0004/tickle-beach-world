/* Editing homes (item 1.6, agreed with the owner on 28 October 2026): every home, inside and out, but only on one's
 * own land (playing as a holder: its own houses, mansions, castles, palaces, warrens; never another holder's).
 * Inside, "Edit this home" in the room's card: click a piece of furniture to choose it, then click the floor to move
 * it there, or turn it, or take it away; add furniture from the kit; change the colours of the floor and the walls;
 * add a room. Outside: repaint the roof (the colours of the six species), and the extras for the garden (flower
 * beds, hedges, a porch, fences and plants) are placed with the build mode. The changes are kept with the game,
 * laid over the home's rooms every time they are made (interiors.js), so they follow the home whoever lives there. */
(function () {
  "use strict";
  const App = window.App, st = App.st, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const H = () => st.homes || (st.homes = {});
  const keyOf = (T) => (T && T.sc ? T.sc.tkey || "i" + T.sc.idx : null);
  const FLOORS = [["#c79a62", "#b58850"], ["#d8c8a8", "#c8b898"], ["#9a948a", "#8a847a"], ["#e8e0d0", "#d8d0c0"], ["#7a5a3a", "#6a4a2a"], ["#b8d8e8", "#a8c8d8"], ["#e8b8b8", "#d8a8a8"], ["#8fbf8f", "#7faf7f"]];
  const WALLS = ["#fff4d6", "#fff8e8", "#e8e0d0", "#b0aa9e", "#f3d9b0", "#d8e8f0", "#f0d8e0", "#dcefd8", "#8a7a68"];

  // ---------- who may edit ----------
  App.canEditHome = (map) => {
    const T = map && map.target;
    if (!T || !T.sc || (T.kind !== "house" && T.kind !== "hall") || !App.editRight) return false;
    if (App.devMode && App.devMode()) return true; // (developer mode: every home)
    return App.editRight(T.sc.x, T.sc.z).right === "own";
  };

  // ---------- the changes, laid over the rooms as they are made ----------
  App.applyHomeEdits = (map) => {
    const E = H()[keyOf(map.target)];
    map.rooms.forEach((R, ri) => { R.items.forEach((it, i) => { it._i = i; }); });
    if (!E) return;
    // extra rooms first, so their own changes apply too
    for (let n = 0; n < (E.extra || 0); n++) {
      const A = map.rooms[0], idx = map.rooms.length, wid = 300 + n;
      const R = { name: "Room " + (n + 1) + " (added)", w: 16, d: 12, h: 6, floor: ["#c79a62", "#b58850"], wall: "#fff4d6", trim: "#a0703a", dark: false, items: [{ k: "rug", v: 0, x: 0, z: 0, _i: 0 }, { k: "plant", x: -6.5, z: -4.5, _i: 1 }, { k: "mat", x: 0, z: 5, _i: 2 }], warps: [{ id: 0, x: 0, z: 5, kind: "mat", label: "Back", to: { room: 0, warp: wid } }], spots: {}, added: true };
      map.rooms.push(R);
      const x = -A.w / 2 + 2.2 + n * 2.6, z = A.d / 2 - 1.2;
      A.warps.push({ id: wid, x, z, kind: "mat", label: R.name.replace(" (added)", ""), to: { room: idx, warp: 0 } });
      A.items.push({ k: "mat", x, z, _i: -1 });
    }
    for (const ri in E.rooms || {}) {
      const R = map.rooms[+ri], e = E.rooms[ri];
      if (!R) continue;
      R.items = R.items.filter((it) => !(e.rm || []).includes(it._i));
      for (const it of R.items) { const m = e.mv && e.mv[it._i]; if (m) { it.x = m.x; it.z = m.z; it.rot = m.rot; } }
      (e.add || []).forEach((a, j) => R.items.push({ k: a.k, v: a.v, x: a.x, z: a.z, rot: a.rot, _i: "a" + j }));
      if (e.floor) R.floor = e.floor;
      if (e.wall) R.wall = e.wall;
      R._life = null;
    }
  };
  function roomEdit(create) {
    const C = App.inside, k = keyOf(C.map.target), E = H()[k] || (create ? (H()[k] = { rooms: {} }) : null);
    if (!E) return null;
    E.rooms = E.rooms || {};
    return E.rooms[C.ri] || (create ? (E.rooms[C.ri] = {}) : null);
  }
  // after a change: the map made again from the start with all the changes on it, and the room rebuilt
  function refresh() {
    const C = App.inside, T = C.map.target, ri = C.ri, m = App.mapOf(T);
    C.map = m; App.inside = C;
    App.insideRebuild();
    C.ri = ri;
  }

  // ---------- the edit mode ----------
  let editing = false, sel = null, adding = null;
  App.homeEditing = () => editing;
  function panel() {
    let el = $("homeEdit");
    if (!el) {
      el = document.createElement("div"); el.id = "homeEdit"; el.className = "glass";
      el.style.cssText = "position:absolute;right:12px;top:64px;z-index:44;width:min(92vw,300px);padding:10px 12px;border-radius:12px;font-size:13px";
      document.body.appendChild(el);
      el.addEventListener("click", onPanel);
      el.addEventListener("change", (e) => { if (e.target.id === "heAddSel") adding = e.target.value || null; });
    }
    return el;
  }
  const furniture = () => Object.keys(TB.KIT).filter((k) => TB.KIT[k].group === "Interiors" && !/^(stairs|ladder|mat|bunkbed|window|torch)$/.test(k)).sort();
  function draw() {
    const el = panel();
    el.hidden = !editing;
    if (!editing) return;
    const C = App.inside, R = C.map.rooms[C.ri], T = C.map.target, kind = App.kindOf ? App.kindOf(T.sc.type) : "";
    const variants = TB.KIT[kind] && TB.KIT[kind].variants && TB.KIT[kind].variants.length > 1 ? TB.KIT[kind].variants : null;
    el.innerHTML = '<div style="font-weight:800;margin-bottom:4px">Editing ' + esc(R.name) + "</div>" +
      '<div class="note" style="margin-bottom:6px">' + (adding ? "Click the floor to put it down." : sel ? "Chosen: " + esc((TB.KIT[sel.k] || { name: sel.k }).name) + ". Click the floor to move it there." : "Click a piece of furniture to choose it.") + "</div>" +
      (sel ? '<div class="row" style="display:flex;gap:6px;margin-bottom:6px"><button class="btn" data-he="turn">Turn</button><button class="btn" data-he="remove">Take away</button><button class="btn" data-he="unsel">Let go</button></div>' : "") +
      '<div style="margin:4px 0 2px">Add furniture</div><select id="heAddSel" style="width:100%"><option value="">\u2014</option>' + furniture().map((k) => '<option value="' + k + '"' + (adding === k ? " selected" : "") + ">" + esc(TB.KIT[k].name) + "</option>").join("") + "</select>" +
      '<div style="margin:8px 0 2px">Floor</div><div style="display:flex;gap:4px;flex-wrap:wrap">' + FLOORS.map((f, i) => '<button data-he="floor" data-i="' + i + '" title="Floor" style="width:24px;height:24px;border-radius:6px;border:1px solid #0004;background:linear-gradient(135deg,' + f[0] + " 50%," + f[1] + ' 50%)"></button>').join("") + "</div>" +
      '<div style="margin:8px 0 2px">Walls</div><div style="display:flex;gap:4px;flex-wrap:wrap">' + WALLS.map((w, i) => '<button data-he="wall" data-i="' + i + '" title="Walls" style="width:24px;height:24px;border-radius:6px;border:1px solid #0004;background:' + w + '"></button>').join("") + "</div>" +
      (variants ? '<div style="margin:8px 0 2px">Roof outside</div><div style="display:flex;gap:4px;flex-wrap:wrap">' + variants.map((v) => '<button class="btn" data-he="paint" data-i="' + v + '" style="font-size:11px;padding:2px 6px">' + esc(TB.KIT[kind].variantLabel ? TB.KIT[kind].variantLabel(v) : String(v)) + "</button>").join("") + "</div>" : "") +
      '<div class="row" style="display:flex;gap:6px;margin-top:10px"><button class="btn" data-he="room">Add a room</button><span style="flex:1"></span><button class="btn primary" data-he="done">Done</button></div>' +
      '<div class="note" style="margin-top:6px">Garden extras (flower beds, hedges, a porch, fences): outside, in \u201cI\u2019m in control\u201d, Place object.</div>';
  }
  function onPanel(e) {
    const b = e.target.closest("[data-he]");
    if (!b) return;
    const a = b.dataset.he, C = App.inside;
    if (!C) return;
    if (a === "done") { setEditing(false); return; }
    if (a === "unsel") { sel = null; draw(); return; }
    if (a === "turn" && sel) { const e2 = roomEdit(true); if (typeof sel._i === "string") { const j = +sel._i.slice(1); e2.add[j].rot = ((e2.add[j].rot || 0) + Math.PI / 2) % (Math.PI * 2); } else { (e2.mv = e2.mv || {})[sel._i] = { x: sel.x, z: sel.z, rot: ((sel.rot || 0) + Math.PI / 2) % (Math.PI * 2) }; } const keep = sel._i; refresh(); sel = App.inside.map.rooms[App.inside.ri].items.find((it) => it._i === keep) || null; draw(); return; }
    if (a === "remove" && sel) { const e2 = roomEdit(true); if (typeof sel._i === "string") e2.add.splice(+sel._i.slice(1), 1); else (e2.rm = e2.rm || []).push(sel._i); sel = null; refresh(); draw(); return; }
    if (a === "floor") { roomEdit(true).floor = FLOORS[+b.dataset.i]; refresh(); draw(); return; }
    if (a === "wall") { roomEdit(true).wall = WALLS[+b.dataset.i]; refresh(); draw(); return; }
    if (a === "room") { const k = keyOf(C.map.target); H()[k] = H()[k] || { rooms: {} }; if ((H()[k].extra || 0) >= 4) { App.toast("Four added rooms at most."); return; } H()[k].extra = (H()[k].extra || 0) + 1; refresh(); App.toast("A new room: its doormat is by the way out."); draw(); return; }
    if (a === "paint") { paint(C.map.target, +b.dataset.i); draw(); }
  }
  function paint(T, v) {
    const s = T.sc, kind = App.kindOf(s.type), k = keyOf(T);
    H()[k] = H()[k] || { rooms: {} };
    H()[k].paint = v;
    if (!s.ruined) { s.type = kind + "_" + v; App.sceneryDirty = true; }
    App.toast("Repainted: you will see it outside.");
  }
  function setEditing(on) {
    editing = on && !!App.inside && App.canEditHome(App.inside.map);
    sel = null; adding = null;
    draw();
    if (App.inside) App.insideRebuild(); // (the card's button says what it does now)
  }
  // clicks inside while editing (ui.js hands them over first)
  App.homeEditClick = (ndc) => {
    if (!editing || !App.inside) return false;
    const C = App.inside, R = C.map.rooms[C.ri];
    if (adding) {
      const p = App.insideFloorAt(ndc);
      if (!p || Math.abs(p.x) > R.w / 2 - 0.6 || Math.abs(p.z) > R.d / 2 - 0.6) return true;
      const e2 = roomEdit(true); (e2.add = e2.add || []).push({ k: adding, v: 0, x: p.x, z: p.z, rot: 0 });
      // one piece for each choice: the new piece is the one chosen now (to turn it, or move it a little)
      adding = null; refresh();
      sel = App.inside.map.rooms[App.inside.ri].items.find((it) => it._i === "a" + (e2.add.length - 1)) || null;
      draw();
      return true;
    }
    const o = App.insidePick ? App.insidePick(ndc) : null;
    if (o && o.kind === "item" && o.it.k !== "mat" && o.it.k !== "stairs" && o.it.k !== "ladder") { sel = o.it; draw(); return true; }
    if (sel) {
      const p = App.insideFloorAt(ndc);
      if (!p || Math.abs(p.x) > R.w / 2 - 0.6 || Math.abs(p.z) > R.d / 2 - 0.6) return true;
      const e2 = roomEdit(true), keep = sel._i;
      if (typeof keep === "string") { const j = +keep.slice(1); e2.add[j].x = p.x; e2.add[j].z = p.z; }
      else (e2.mv = e2.mv || {})[keep] = { x: p.x, z: p.z, rot: sel.rot || 0 };
      refresh();
      sel = App.inside.map.rooms[App.inside.ri].items.find((it) => it._i === keep) || null;
      draw();
    }
    return true;
  };
  document.addEventListener("click", (e) => { if (e.target.closest("[data-homeedit]")) setEditing(!editing); });
  // leaving the home ends the editing
  setInterval(() => { if (editing && !App.inside) setEditing(false); }, 500);

  // ---------- save, load (the roofs repainted come back outside) ----------
  App.initHomes = (saved) => {
    st.homes = saved || {};
    const byKey = new Map();
    for (const s of App.sceneryAll || []) if (s.tkey) byKey.set(s.tkey, s);
    for (const k in st.homes) {
      const E = st.homes[k], s = k.startsWith("i") ? App.sceneryAll[+k.slice(1)] : byKey.get(k);
      if (s && E.paint != null && !s.ruined && App.kindOf) { s.type = App.kindOf(s.type) + "_" + E.paint; App.sceneryDirty = true; }
    }
  };
  App.saveHomes = () => st.homes || {};
})();
