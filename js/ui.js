/* UI: boot, panels, minimap, wallets, review + preview, library export, Claude designer, tools,
 * overlay and the main loop. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NEED_COL = { hunger: "#ffb24a", energy: "#7be08f", social: "#ff8fc0", fun: "#3cc6d8" };
  const BIOME_COL = { 16: "#4bb543", 11: "#3aa0c8", 14: "#8a8f99", 3: "#c08a52", 1: "#f2d38f", 4: "#2fae6a" };
  const ui = (App.ui = { tab: "tickles", sel: null, review: null, tool: "select", block: 1, placeAsset: null, pressing: false, sigReview: "", sigLib: "", keys: new Set() });

  // ---------- worker pool ----------
  const NW = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
  const workers = [], pending = new Map();
  let jid = 1, workerError = null;
  const busy = new Array(NW).fill(0);
  for (let i = 0; i < NW; i++) {
    const w = new Worker("js/worker.js?v=122");
    w.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      busy[p.w]--;
      if (e.data.ok) p.res(e.data.out); else p.rej(new Error(e.data.error));
    };
    w.onerror = (e) => { workerError = e.message || "worker failed to load"; for (const [, p] of pending) p.rej(new Error(workerError)); pending.clear(); };
    workers.push(w);
  }
  App.job = (type, payload) => new Promise((res, rej) => {
    if (workerError) return rej(new Error(workerError));
    const id = jid++;
    let wi = 0;
    for (let i = 1; i < NW; i++) if (busy[i] < busy[wi]) wi = i;
    busy[wi]++;
    pending.set(id, { res, rej, w: wi });
    workers[wi].postMessage(Object.assign({ id, type }, payload));
  });
  App.jobsPending = () => pending.size;

  // on-chain trait names for every model, read from tokenURI() of the bundled tokens
  App.MODEL_NAMES = {};
  for (const [, seed, traits] of TB.TOKENS) {
    const p = TB.pickTraits(seed);
    for (const slot of TB.SLOTS) if (p.sel[slot] !== undefined) App.MODEL_NAMES[slot + ":" + p.sel[slot]] = traits[TB.SLOT_LABEL[slot]];
  }

  // notifications: what is going on in the world can be switched off in Menu > Settings (what answers something you
  // just did still shows), and a click on one takes it away
  const pref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const setPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  let lastInput = -1e9;
  for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, () => { lastInput = performance.now(); }, true);
  App.notifyOn = (on) => { if (on != null) setPref("tbw-notify", on ? "1" : "0"); return pref("tbw-notify", "1") === "1"; };
  const quiet = () => !App.notifyOn() && performance.now() - lastInput > 1500;
  const dismissable = (el) => { el.title = "Click to dismiss"; el.addEventListener("click", () => el.remove()); };
  App.toast = (msg) => {
    if (quiet()) return;
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    dismissable(el);
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 4200);
  };
  // a toast with a button (e.g. "Watch" when a fight worth seeing starts down below)
  App.toastAction = (msg, label, fn) => {
    if (!App.notifyOn()) return;
    const box = $("toasts"), el = document.createElement("div"), b = document.createElement("button");
    el.className = "toast act"; el.textContent = msg + " ";
    dismissable(el);
    b.className = "btn primary"; b.textContent = label;
    b.onclick = (e) => { e.stopPropagation(); el.remove(); fn(); };
    el.appendChild(b); box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 9000);
  };
  const clockOf = (T) => App.clock(T);
  const when = (T) => { const c = clockOf(T); return "Day " + c.day + "<br>" + c.short; };
  const statusLabel = { pending: "Needs review", auto: "Unreviewed", approved: "Approved", rejected: "Rejected", starter: "Approved", discarded: "Discarded", core: "Built in" };
  const sourceLabel = { director: "Director", claude: "Claude", player: "You", onchain: "On-chain", core: "Built in" };
  const chip = (status) => '<span class="chip ' + status + '">' + (statusLabel[status] || status) + "</span>";
  const srcChip = (src) => '<span class="chip ' + (src === "claude" ? "claude" : "") + '">' + (sourceLabel[src] || src) + "</span>";
  const short = (a) => (a ? a.slice(0, 6) + "\u2026" + a.slice(-4) : "");

  // ---------- tabs / mode / speed ----------
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    const panel = $("panel");
    if (window.innerWidth <= 760 && ui.tab === b.dataset.tab) { panel.classList.toggle("collapsed"); return; }
    panel.classList.remove("collapsed");
    setTab(b.dataset.tab);
  }));
  function setTab(tab) {
    ui.tab = tab;
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", String(x.dataset.tab === tab)));
    for (const t of ["tickles", "holders", "director", "review", "arena", "library"]) $("tab-" + t).hidden = t !== tab;
    ui.sigReview = ""; ui.sigLib = "";
    refresh(true);
  }
  App.setTab = setTab;
  $("modeAuto").onclick = () => setMode("auto");
  $("modeManual").onclick = () => setMode("manual");
  function setMode(m, quiet) {
    if (st.mode === m && !quiet) return;
    st.mode = m;
    $("modeAuto").setAttribute("aria-pressed", String(m === "auto"));
    $("modeManual").setAttribute("aria-pressed", String(m === "manual"));
    $("dock").hidden = m !== "manual";
    $("freeWillWrap").hidden = m !== "manual";
    if (m === "auto") { st.director.next = Math.min(st.director.next, st.T + 20); setTool("select"); }
    if (!quiet) {
      App.log("world", m === "auto" ? "You handed the world to the Director." : "You took control. The Director will only suggest when you ask.", "");
      App.toast(m === "auto" ? "The Director runs the world" : "You're in control");
    }
    refresh(true);
  }
  document.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => setSpeed(+b.dataset.speed)));
  App.setSpeed = (v) => setSpeed(v);
  function setSpeed(v) {
    st.speed = v;
    document.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.speed === v)));
  }
  $("freeWill").onchange = (e) => { st.freeWill = e.target.checked; App.log("world", st.freeWill ? "Free will on: Tickles look after themselves." : "Free will off: your Tickles only do what you tell them.", ""); };
  $("helpBtn").onclick = () => { showMenu(ui.menu || "help"); };
  // ---------- the menu: how it works, controls, music and credits ----------
  function showMenu(sec) {
    ui.menu = sec;
    $("helpModal").hidden = false;
    for (const b of document.querySelectorAll("[data-menu]")) b.setAttribute("aria-pressed", String(b.dataset.menu === sec));
    for (const el of document.querySelectorAll(".menusec")) el.hidden = el.id !== "menu-" + sec;
    if (sec === "music") renderMusicMenu();
    if (sec === "credits") renderCredits();
    if (sec === "settings") renderSettings();
  }
  // the Settings section
  function renderSettings() {
    $("menu-settings").innerHTML = '<h3>Notifications</h3><div class="soundrow"><b>Activity</b><label class="row" style="gap:6px"><input type="checkbox" id="set-notify"' + (App.notifyOn() ? " checked" : "") + '> on</label>' +
      '<span class="note">the messages at the bottom of the screen about what is going on (a dragon attacking, a party going down, a sea beast rising...). Off, you still get the answers to what you do yourself, and everything stays in the log. A click on a message takes it away.</span></div>';
    $("set-notify").onchange = (e) => { App.notifyOn(e.target.checked); if (!e.target.checked) $("toasts").innerHTML = ""; };
    // graphics quality (gfx.js)
    const L = App.GFX_LEVELS || {};
    $("menu-settings").insertAdjacentHTML("beforeend", '<h3>Graphics</h3><div class="soundrow"><b>Quality</b><div class="seg" role="group" aria-label="Graphics quality" id="set-gfx">' +
      Object.keys(L).map((k) => '<button data-gfx="' + k + '" aria-pressed="' + (App.gfx.quality === k) + '">' + L[k].label + "</button>").join("") + "</div>" +
      '<span class="note">Normal: the plainer look, for slower computers. High: smaller cubes on everything near you and the sun\'s shadows. Ultra: smaller cubes still, further out, sharper shadows and the screen\'s full resolution. All of them keep the textures on the blocks. If the game stutters, go down a level.</span></div>');
    $("set-gfx").onclick = (e) => { const b = e.target.closest("[data-gfx]"); if (!b) return; App.setQuality(b.dataset.gfx); renderSettings(); };
  }
  App.showMenu = showMenu;
  document.querySelector(".menutabs").addEventListener("click", (e) => { const b = e.target.closest("[data-menu]"); if (b) showMenu(b.dataset.menu); });
  const PLAYS = [["Villages", "town_rpg", "Camping"], ["", "puppy_garden", "Duck Pond"], ["", "exploring_town", "Waterfall"], ["", "happy_town", "The Pier"], ["", "floppy_ears", "Beach Sand"], ["", "heckin_crows", "The Palm"],
    ["Night", "mirror_lake"], ["Roads", "lunar_moth", "inland", "feel_good_island", "by the sea"], ["The great lake", "tropical_fantasy", "", "sandy_seaside"], ["The Maker's Isle", "contemplation"],
    ["Cave mouths", "spooky_dungeon", "", "haunted_castle"], ["The Great Underworld", "cavern", "", "end_dungeon"], ["A floor guardian", "great_boss"], ["Mines", "mine_underground", "", "mine_sunless"], ["Arenas", "porkymon", "", "rins_theme"], ["Tournaments", "rpg_battle"],
    ["A sleeping dragon near", "cavern"], ["Danger", "urgency"], ["A fight", "battle_loop"], ["A dragon fight", "great_boss"]];
  // the Sound section: music, ambience and effects, each with its own volume and its own switch
  function renderMusicMenu() {
    const T = App.MUSIC_TRACKS, n = App.musicNow && App.musicNow(), on = App.musicOn && App.musicOn();
    const name = (id) => (T[id] ? esc(T[id].title) : id);
    const fx = App.sfx, amb = fx ? fx.enabled("amb") : false, eff = fx ? fx.enabled("fx") : false;
    const birds = App.birdsNear ? Object.entries(App.birdsNear()) : [];
    const row = (label, id, onNow, vol, what) => '<div class="soundrow"><b>' + label + '</b><label class="row" style="gap:6px"><input type="checkbox" id="' + id + 'On"' + (onNow ? " checked" : "") + "> on</label>" +
      '<label class="row" style="gap:8px">Volume <input type="range" id="' + id + 'Vol" min="0" max="100" value="' + Math.round(vol * 100) + '"></label><span class="note">' + what + "</span></div>";
    $("menu-music").innerHTML = '<h3>Sound</h3>' +
      row("Music", "snd-music", on, App.musicVolume(), "a tune for every place (below)") +
      row("Ambience", "snd-amb", amb, fx ? fx.volume("amb") : 0, "birdsong, frogs, the smiths' anvils, hooves" + (birds.length ? " \u00b7 singing near you: " + birds.map(([k, c]) => c + " " + esc(k.toLowerCase()) + (c > 1 ? (/(ch|sh|s)$/.test(k) ? "es" : "s") : "")).join(", ") : "")) +
      row("Effects", "snd-fx", eff, fx ? fx.volume("fx") : 0, "screams, crashes, bells, punches, whatever you throw") +
      '<p class="note">' + (on && n ? "Now playing <b>" + esc(n.title) + "</b> by " + esc(n.author) + " \u00b7 " + esc(n.where) : "The music is off.") + "</p>" +
      '<h3>What plays where</h3><div class="musicrows">' + PLAYS.map((r) => "<b>" + esc(r[0]) + "</b><span>" + name(r[1]) + (r[2] ? " (" + esc(r[2]) + ")" : "") + (r[3] ? ", " + name(r[3]) + (r[4] ? " (" + esc(r[4]) + ")" : "") : "") + "</span>").join("") + "</div>" +
      '<p class="note">Danger comes first: when a dragon or monsters are close, their tune takes over wherever you are.</p>';
    $("snd-musicVol").oninput = (e) => App.musicVolume(+e.target.value / 100);
    $("snd-musicOn").onchange = (e) => { if (!!e.target.checked !== !!App.musicOn()) App.toggleMusic(e.target.checked); };
    if (fx) {
      $("snd-ambVol").oninput = (e) => fx.volume("amb", +e.target.value / 100);
      $("snd-fxVol").oninput = (e) => fx.volume("fx", +e.target.value / 100);
      $("snd-ambOn").onchange = (e) => fx.enabled("amb", e.target.checked);
      $("snd-fxOn").onchange = (e) => fx.enabled("fx", e.target.checked);
    }
  }
  function renderCredits() {
    const T = App.MUSIC_TRACKS, seen = new Set();
    const rows = Object.values(T).filter((t) => !seen.has(t.title) && seen.add(t.title)).map((t) => '<li><b>' + esc(t.title) + "</b> by " + esc(t.author) + ' \u00b7 CC0 \u00b7 <a href="' + esc(t.url) + '" target="_blank" rel="noopener">OpenGameArt</a></li>').join("");
    $("menu-credits").innerHTML = '<div class="credits"><h3>The Tickles</h3><p>The Tickle Beach collection by Paul McKellar: every Tickle, its traits and the on-chain models and floors are read from its public data on Ethereum. This is an unofficial fan prototype, not affiliated with the Tickle Beach team.</p>' +
      "<h3>Music</h3><p>All the music is free, released into the public domain (CC0) by its composers on OpenGameArt.org. Thank you!</p><ul>" + rows + "</ul>" +
      "<h3>Sounds</h3><p>The sound effects (animal calls, roars, splashes, bells) are synthesized live in the browser.</p>" +
      '<h3>Made with</h3><p>three.js (MIT licence) for the 3D. The world, its kit of models and its code were made with Claude, by Anthropic.</p></div>';
  }
  App.ui.onMusic = () => { if (!$("helpModal").hidden && ui.menu === "music") renderMusicMenu(); };
  $("camLeft").onclick = () => { App.cam.spin = (App.cam.spin || 0) - Math.PI / 4; };
  $("camRight").onclick = () => { App.cam.spin = (App.cam.spin || 0) + Math.PI / 4; };
  $("helpClose").onclick = () => { $("helpModal").hidden = true; try { localStorage.setItem("tbw-help2", "1"); } catch (e) { /* storage blocked */ } };
  $("panel").addEventListener("pointerdown", () => { ui.pressing = true; });
  window.addEventListener("pointerup", () => { ui.pressing = false; });

  // ---------- dock ----------
  document.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
  const HINTS = { select: "Click a Tickle or an object to inspect it.", order: "Select one of your Tickles, then click the ground to send it, another Tickle to chat, or an object to use it.",
    build: "Click a block face to add a block.", dig: "Click a block to remove it.", place: "Pick an approved object, then click open ground." };
  function setTool(t) {
    ui.tool = t;
    document.querySelectorAll("[data-tool]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.tool === t)));
    $("swatches").hidden = t !== "build";
    $("placeRow").hidden = t !== "place";
    $("toolHint").textContent = HINTS[t];
    if (t === "place") fillPlaceSel();
  }
  function fillSwatches() {
    const box = $("swatches");
    box.innerHTML = "";
    for (const k of [1, 2, 4, 5, 6, 7, 8, 9, 10, 13, 11, 14]) {
      const b = document.createElement("button");
      b.style.background = App.BLOCK_INFO[k].css;
      b.title = App.BLOCK_INFO[k].name;
      b.setAttribute("aria-label", App.BLOCK_INFO[k].name);
      b.setAttribute("aria-pressed", String(ui.block === k));
      b.onclick = () => { ui.block = k; box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
      box.appendChild(b);
    }
  }
  function placeable() { return st.assets.filter((a) => a.status === "approved" || a.status === "starter"); }
  function fillPlaceSel() {
    const sel = $("placeSel"), list = placeable();
    sel.innerHTML = list.length ? list.map((a) => '<option value="' + a.id + '">' + esc(a.name) + "</option>").join("") : "<option value=''>Approve something in Review first</option>";
    ui.placeAsset = list.length ? (list.find((a) => a.id === ui.placeAsset) || list[0]).id : null;
    sel.value = ui.placeAsset || "";
    sel.onchange = () => { ui.placeAsset = sel.value; };
  }

  // ---------- world clicks ----------
  const tmpV = new THREE.Vector3();
  App.onWorldClick = (ndc) => {
    const looking = !ui.tool || ui.tool === "select";
    // inside: whoever or whatever was clicked, in the inspect window (inspect.js)
    if (App.inside) { if (looking && App.inspectPick) { const o = App.inspectPick(ndc); if (o) App.showInspect(o.fn); else App.closeInspect(); } return; }
    const r = App.rayFrom(ndc);
    let hit = null, hd = Infinity;
    for (const t of st.tickles) {
      if (App.fpId && t.id === App.fpId()) continue; // (the eyes we are looking through)
      const box = new THREE.Box3(new THREE.Vector3(t.pos.x - 0.65, t.pos.y, t.pos.z - 0.65), new THREE.Vector3(t.pos.x + 0.65, t.pos.y + t.height, t.pos.z + 0.65));
      if (r.intersectBox(box, tmpV)) { const d = tmpV.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "tickle", t }; } }
    }
    for (const p of st.props) {
      if (!p.group.visible) continue;
      const y = p.group.position.y;
      const box = new THREE.Box3(new THREE.Vector3(p.x - p.rad, y, p.z - p.rad), new THREE.Vector3(p.x + p.rad, y + p.height, p.z + p.rad));
      if (r.intersectBox(box, tmpV)) { const d = tmpV.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "prop", p }; } }
    }
    const v = App.pickVoxel(r);
    if (v) { const d = v.point.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "voxel", v }; } }
    const manual = st.mode === "manual";
    const selT = st.tickles.find((t) => t.id === ui.sel);
    if (manual && ui.tool === "build" && hit && hit.type === "voxel") {
      const { x, y, z, n } = hit.v;
      if (App.getBlock(x + n[0], y + n[1], z + n[2]) === 0) App.setBlock(x + n[0], y + n[1], z + n[2], ui.block);
      return;
    }
    if (manual && ui.tool === "dig" && hit && hit.type === "voxel") { if (hit.v.y > 0) App.setBlock(hit.v.x, hit.v.y, hit.v.z, 0); return; }
    if (manual && ui.tool === "place" && hit && hit.type === "voxel") {
      const asset = App.assetById(ui.placeAsset);
      const pt = hit.v.point;
      if (!asset) { App.toast("Approve an object in Review first."); return; }
      if (!App.isLand(pt.x, pt.z)) { App.toast("Objects need dry land."); return; }
      App.placeProp(asset, pt.x, pt.z);
      App.log("review", "You placed " + asset.name + ".", "");
      return;
    }
    if (manual && ui.tool === "order" && selT && hit) {
      if (!App.canOrder(selT)) { App.toast(selT.name + " belongs to " + short(App.ownerOf(selT.id)) + ". You can only direct your own Tickles."); return; }
      if (hit.type === "tickle" && hit.t !== selT) { App.order(selT, { kind: "chat", partner: hit.t }); App.say(selT, "Hey " + hit.t.traits.Character + "!", 3); return; }
      if (hit.type === "prop") { App.order(selT, { kind: "prop", prop: hit.p }); return; }
      if (hit.type === "voxel") { App.order(selT, { kind: "goto", spot: { x: hit.v.point.x, z: hit.v.point.z } }); App.say(selT, "On my way!", 2); return; }
    }
    // what is under the cursor by how near it looks on the screen (inspect.js): a Tickle, an animal or a boat in front
    // of a building is what was meant
    const seen = looking && App.inspectPick ? App.inspectPick(ndc) : null;
    // a building or landmark under the cursor (closer than anything else): its card
    if (looking && App.pickPlace && !(hit && hit.type === "tickle") && !(seen && seen.live && seen.d < 18)) {
      const P = App.pickPlace(r);
      if (P && P.name && P.dist < hd + 2) { showPlaceCard(P, ndc); return; }
    }
    // a Tickle, a creature, an animal, a monster, a dragon or a boat: the one nearest the cursor on the screen (a pet at
    // its Tickle's feet can be told from it). A Tickle is also selected (V, F and the Tickles tab follow it).
    if (seen && seen.live) {
      if (seen.tickle != null) { ui.sel = seen.tickle; if (ui.tab === "tickles") refresh(true); }
      App.showInspect(seen.fn);
      return;
    }
    if (hit && hit.type === "tickle") {
      if (!App.inspectTickle || !looking) { selectTickle(hit.t.id); return; }
      ui.sel = hit.t.id; if (ui.tab === "tickles") refresh(true);
      App.inspectTickle(hit.t.id);
      return;
    }
    if (hit && hit.type === "voxel" && looking) {
      const T = App.enterableAt(hit.v.point.x, hit.v.point.z);
      if (T) { showDoorChip(T, ndc); return; }
    }
    if (seen) { App.showInspect(seen.fn); return; }
    if (hit && hit.type === "prop") { const a = App.assetById(hit.p.assetId); if (a) { ui.review = "a:" + a.id; setTab("review"); } return; }
    // nothing but the ground or the water
    const g = looking && App.inspectGround ? App.inspectGround(r) : null;
    if (g) App.showInspect(g);
    if (ui.tool === "select") { ui.sel = null; refresh(true); }
  };
  // "Go inside" for the building, cave or mine that was clicked
  function showDoorChip(T, ndc) {
    const el = $("doorChip"), rc = App.renderer.domElement.getBoundingClientRect();
    el.innerHTML = "<b>" + esc(T.name) + '</b><button class="btn primary" id="goInside">Go inside</button>';
    el.style.left = Math.round(((ndc.x + 1) / 2) * rc.width) + "px"; el.style.top = Math.round(((1 - ndc.y) / 2) * rc.height) + "px";
    el.hidden = false;
    ui.doorT = T;
    clearTimeout(ui.doorTimer); ui.doorTimer = setTimeout(() => (el.hidden = true), 6000);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#goInside")) { $("doorChip").hidden = true; $("placeCard").hidden = true; App.enter(ui.doorT); }
    if (e.target.closest("#placeClose")) $("placeCard").hidden = true;
  });
  // the card of a building or landmark: name, what is going on, its story, and a way in
  function showPlaceCard(P, ndc) {
    if (App.inspectYield) App.inspectYield();
    const el = $("placeCard");
    ui.doorT = P.enter;
    el.innerHTML = '<div class="pc-head"><div><div class="pc-name">' + esc(P.name) + '</div><div class="pc-sub">' + P.sub + '</div></div><button class="btn" id="placeClose" aria-label="Close">Close</button></div>' +
      (P.rows.length ? '<div class="kv">' + P.rows.map((r) => '<span class="k">' + esc(r[0]) + "</span><span>" + r[1] + "</span>").join("") + "</div>" : "") +
      '<div class="pc-text">' + P.text + "</div>" + (P.enter ? '<button class="btn primary" id="goInside">Go inside</button>' : "");
    el.hidden = false;
    $("doorChip").hidden = true;
  }
  function selectTickle(id) {
    ui.sel = id;
    if (ui.tab !== "tickles") setTab("tickles"); else refresh(true);
  }
  // (the inspect window's buttons)
  App.selectTickle = selectTickle;
  App.openReview = (aid) => { ui.review = "a:" + aid; setTab("review"); };
  App.goToToken = (id, select) => {
    const P = App.pop;
    const t = P.agent[id];
    const pp = t ? t.pos : App.planPos(id, st.T);
    const x = pp.x, z = pp.z;
    App.flyTo(x, z, 24);
    App.forcePromote(id);
    if (select) { ui.sel = id; setTab("tickles"); }
  };

  App.keys = ui.keys; // first person reads them (firstperson.js)
  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
    if (e.key === "Escape" && App.fpOn && App.fpOn()) { if (!App.fpEscape()) App.exitFP(); return; }
    if ((e.key === "v" || e.key === "V") && App.enterFP) { if (App.fpOn()) App.exitFP(); else if (ui.sel != null) App.enterFP(ui.sel); else App.toast("Pick a Tickle first, then press V to see through its eyes."); return; }
    // driving your own Tickle in first person: M into the saddle, Space and C up and down on a griffin
    if (App.fpDriving && App.fpDriving() && ["KeyM", "Space", "KeyC", "KeyF", "KeyT", "KeyQ", "KeyG", "KeyR"].includes(e.code)) { ui.keys.add(e.code); e.preventDefault(); return; }
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyZ", "KeyX", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) { ui.keys.add(e.code); if (e.code.startsWith("Arrow")) e.preventDefault(); return; }
    if (e.code === "Space") { e.preventDefault(); setSpeed(st.speed ? 0 : 1); }
    else if (e.key === "1") setSpeed(1); else if (e.key === "2") setSpeed(4); else if (e.key === "3") setSpeed(12);
    else if (e.key === "f" || e.key === "F") { if (ui.sel != null) App.cam.follow = ui.sel; }
    else if (e.key === "Escape" && !$("placeCard").hidden) { $("placeCard").hidden = true; }
    else if (e.key === "Escape" && App.inside) { App.leaveInterior(); }
    else if ((e.key === "e" || e.key === "E") && !App.inside) { const T = App.enterableAt(App.cam.target.x, App.cam.target.z); if (T) { if (App.fpOn && App.fpOn()) App.exitFP(); App.enter(T); } else App.toast("Nothing to go into here: move close to a door, a cave or a mine."); }
    else if (e.key === "Escape") { ui.sel = null; App.cam.follow = null; App.pinned = null; $("onchainModal").hidden = true; $("helpModal").hidden = true; $("mapModal").hidden = true; $("mapTip").hidden = true; refresh(true); }
    else if ((e.key === "m" || e.key === "M") && !(e.target && e.target.closest && e.target.closest("input, textarea"))) { if ($("mapModal").hidden) App.openMap(); else $("mapModal").hidden = true; }
  });
  window.addEventListener("keyup", (e) => ui.keys.delete(e.code));
  window.addEventListener("blur", () => ui.keys.clear());

  // ---------- overlay ----------
  const overlay = $("overlay");
  let ring = null;
  function updateOverlay() {
    overlay.style.visibility = App.inside ? "hidden" : "visible";
    if (App.inside) return;
    const camPos = App.camera.position;
    // only the closest few get a name tag, plus the selected one and the wallet's own
    const ranked = st.tickles.map((t) => [t.pos.distanceTo(camPos), t]).sort((a, b) => a[0] - b[0]);
    const tagged = new Set(ranked.slice(0, 12).map((x) => x[1]));
    for (const t of st.tickles) {
      if (!t.tagEl) {
        t.tagEl = document.createElement("div"); t.tagEl.className = "tag";
        t.tagEl.innerHTML = '<span class="m"></span><span class="n"></span>';
        t.tagEl.querySelector(".n").textContent = t.name;
        t.bubEl = document.createElement("div"); t.bubEl.className = "bubble"; t.bubEl.hidden = true;
        overlay.appendChild(t.tagEl); overlay.appendChild(t.bubEl);
      }
      const head = tmpV.set(t.pos.x, t.pos.y + t.height + 0.3, t.pos.z);
      const dist = head.distanceTo(camPos);
      const p = App.project(head);
      // in first person only those close by keep a tag (and never the one whose eyes you look through)
      const fpv = App.fpOn && App.fpOn();
      const vis = !p.behind && dist < (fpv ? 16 : 80) && (tagged.has(t) || t.id === ui.sel || App.isMine(t.id)) && !(fpv && App.fpId() === t.id);
      t.tagEl.hidden = !vis;
      if (vis) {
        t.tagEl.style.left = p.x + "px"; t.tagEl.style.top = p.y + "px";
        t.tagEl.style.opacity = String(Math.max(0.3, Math.min(1, 1.6 - dist / 55)));
        t.tagEl.classList.toggle("sel", t.id === ui.sel);
        t.tagEl.classList.toggle("mine", App.isMine(t.id));
        const mood = (t.needs.hunger + t.needs.energy + t.needs.social + t.needs.fun) / 4;
        t.tagEl.querySelector(".m").style.background = mood > 60 ? "#7be08f" : mood > 35 ? "#ffd23f" : "#ff7b6b";
      }
      const showB = vis && t.bubble && st.T < t.bubble.until && dist < 60;
      t.bubEl.hidden = !showB;
      if (showB) {
        if (t.bubEl.textContent !== t.bubble.text) t.bubEl.textContent = t.bubble.text;
        t.bubEl.style.left = p.x + "px"; t.bubEl.style.top = p.y - 24 + "px";
      }
    }
    const selT = st.tickles.find((t) => t.id === ui.sel);
    if (!ring) { ring = App.makeRing(); App.scene.add(ring); }
    ring.visible = !!selT;
    if (selT) { ring.position.set(selT.pos.x, selT.pos.y + 0.06, selT.pos.z); ring.rotation.y += 0.02; }
  }

  // ---------- maps: the minimap and the big map share one drawing ----------
  const mm = $("minimap"), mctx = mm.getContext("2d");
  const W0 = App.WORLD;
  let mineCache = { wallet: null, ids: [] };
  const lands = new Map();
  // the land as a small picture, made once per size and scaled up when drawn
  function landImage(w, h) {
    const key = w + "x" + h;
    if (lands.has(key)) return lands.get(key);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const img = cv.getContext("2d").createImageData(w, h), sea = [22, 86, 107], col = {};
    for (const k in BIOME_COL) { const n = parseInt(BIOME_COL[k].slice(1), 16); col[k] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const x = W0.minX + ((px + 0.5) / w) * (W0.maxX - W0.minX), z = W0.minZ + ((py + 0.5) / h) * (W0.maxZ - W0.minZ);
      const c = App.genColumn(x, z);
      let rgb = sea;
      if (c.h >= App.SEA) { const r = App.regions[App.regionOf(x, z)]; rgb = col[r.floor]; if (c.h > App.SEA + 7) rgb = rgb.map((v) => Math.min(255, v + 35)); }
      else if (c.h > 0) rgb = [44, 120, 140];
      const o = (py * w + px) * 4;
      img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = 255;
    }
    cv.getContext("2d").putImageData(img, 0, 0);
    lands.set(key, cv);
    return cv;
  }
  function buildLandImage() { landImage(mm.width, mm.height); }
  App.buildLandImage = buildLandImage;
  const toMap = (w, h) => (x, z) => [((x - W0.minX) / (W0.maxX - W0.minX)) * w, ((z - W0.minZ) / (W0.maxZ - W0.minZ)) * h];
  // everything worth a mark, with a name for the tooltip
  function mapMarks() {
    const out = [], day = Math.floor(st.T / 1440);
    const fallenBy = {};
    for (const id in st.fallen || {}) fallenBy[st.fallen[id].village] = (fallenBy[st.fallen[id].village] || 0) + 1;
    for (const v of App.villages) {
      const ru = App.villageRuins(v).length, fa = fallenBy[v.i] || 0;
      out.push({ kind: "village", x: v.x, z: v.z, name: v.name, color: App.clanColor(v.clan),
        sub: App.placeKindText(v) + " \u00b7 granary: " + App.foodWord(v) + (/^(plenty|enough)$/.test(App.foodWord(v)) ? " food" : "") + (ru ? " \u00b7 " + ru + " in ruins" : "") + (fa ? " \u00b7 " + fa + " fallen" : "") });
    }
    for (const b of App.bridges) out.push({ kind: "bridge", x: b.mx, z: b.mz, name: "Bridge", sub: App.regions[b.a].name + " \u2194 " + App.regions[b.b].name });
    for (const D of App.docks || []) {
      const F = D.ferry != null ? App.ferries[D.ferry] : null, o = F ? App.docks[F.a === D.i ? F.b : F.a] : null;
      out.push({ kind: "dock", x: D.x + D.ux * 6, z: D.z + D.uz * 6, name: D.name, sub: o ? "Ferry to " + o.name + " about every " + App.ferryEvery(F) + " minutes, 06:00 to 22:00" : "Rowing boats" });
    }
    for (const f of App.etherFields || []) out.push({ kind: "ether", x: f.x, z: f.z, name: f.name, sub: "Ether crystals grow here; tamers and the devout come to gather Ethernum" });
    if (App.ISLE) out.push({ kind: "isle", x: App.ISLE.x, z: App.ISLE.z, name: "The Maker's Isle", sub: "The giant statue of the Maker; pilgrims come on the launches from every dock" });
    for (const M of App.mines || []) out.push({ kind: "mine", x: M.x, z: M.z, name: M.name, sub: "Mine: stone, iron, gold" + (M.orichalcum ? " and a deep vein of orichalcum" : "") + ". Click it, then Go inside" });
    for (const F of App.ferries || []) { const p = App.ferryAt(F, st.T); out.push({ kind: "ferry", x: p.x, z: p.z, name: F.name, sub: (p.docked ? "at the dock" : "crossing the lake") + (F.launch ? " (to the Maker's Isle)" : "") }); }
    for (const d of App.dungeons || []) out.push({ kind: "cave", x: d.x, z: d.z, name: d.name, sub: "Dungeon cave \u00b7 depth " + d.depth + " \u00b7 Gloomslimes, Shadebats, Brutecaps", ref: d });
    for (const ar of App.arenas || []) {
      if (!ar) continue;
      const tr = st.tourneys && st.tourneys[day + ":" + ar.region], m = st.T - day * 1440;
      const live = tr && !tr.done && m >= App.tourneyWindow.start && m < App.tourneyWindow.end;
      out.push({ kind: "arena", x: ar.x, z: ar.z, name: ar.name, sub: "Creature arena \u00b7 " + (!tr ? "no tournament tonight" : tr.done ? "tonight's champion: " + App.nameOf(tr.champ) : live ? "tournament on now" : "tournament at " + App.clock(day * 1440 + App.tourneyWindow.start).short), live });
    }
    for (const L of App.lairs) {
      const s = App.dragonState(L, st.T);
      out.push({ kind: "lair", x: L.x, z: L.z, name: L.name, sub: "Dragon lair \u00b7 " + TB.DRAGON_LOOKS[L.look].name.toLowerCase() + " dragon" + (s.mode === "slain" ? ": empty, its dragon was slain" : s.mode === "hidden" ? " in hiding (beaten by the Guild)" : App.huntOn && App.huntOn(L) ? " (the Guild is hunting it today)" : s.mode === "perch" ? " asleep" : " out") });
      if (s.mode !== "perch" && s.mode !== "hidden" && s.mode !== "slain") out.push({ kind: "dragon", x: s.x, z: s.z, name: "Dragon in the air", sub: s.attack ? (s.attack.wrath ? "woken and furious, heading for " : "attacking ") + App.villages[s.attack.to].name : s.mode === "patrol" ? "flying a patrol over its land" : "flying home", target: s.attack ? App.villages[s.attack.to] : null });
    }
    return out;
  }
  App.mapMarks = mapMarks;
  function drawMark(ctx, m, x, y, s) {
    ctx.lineWidth = 1.2 * s;
    if (m.kind === "village") { ctx.fillStyle = m.color; ctx.fillRect(x - 1.6 * s, y - 1.6 * s, 3.2 * s, 3.2 * s); if (s > 1) { ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.strokeRect(x - 1.6 * s, y - 1.6 * s, 3.2 * s, 3.2 * s); } }
    else if (m.kind === "bridge") { ctx.fillStyle = "#c79a62"; ctx.fillRect(x - 1.5 * s, y - 1.5 * s, 3 * s, 3 * s); }
    else if (m.kind === "cave") {
      ctx.fillStyle = "#4a4a4a"; ctx.beginPath(); ctx.arc(x, y + 1.5 * s, 4.2 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c9a6ff"; ctx.beginPath(); ctx.arc(x, y + 1.5 * s, 1.8 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
    } else if (m.kind === "arena") {
      const pulse = m.live ? 1 + 0.35 * Math.sin(performance.now() / 180) : 1;
      ctx.strokeStyle = m.live ? "#ff6b5e" : "#ffd23f"; ctx.lineWidth = 1.8 * s;
      ctx.beginPath(); ctx.arc(x, y, 3.6 * s * pulse, 0, 6.283); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, 1.3 * s, 0, 6.283); ctx.fill();
    } else if (m.kind === "lair") {
      ctx.fillStyle = "#3a1a14"; ctx.strokeStyle = "#ff3b2f";
      ctx.beginPath(); ctx.moveTo(x, y - 4 * s); ctx.lineTo(x + 3.6 * s, y + 2.6 * s); ctx.lineTo(x - 3.6 * s, y + 2.6 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (m.kind === "ether") {
      ctx.fillStyle = "#c9a6ff"; ctx.strokeStyle = "#5a3a8a"; ctx.lineWidth = 1 * s; ctx.beginPath();
      ctx.moveTo(x, y - 4.6 * s); ctx.lineTo(x + 2.6 * s, y); ctx.lineTo(x, y + 3.4 * s); ctx.lineTo(x - 2.6 * s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (m.kind === "isle") {
      // a golden star on the isle
      ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = 1 * s; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const r = (k % 2 ? 2.4 : 5.6) * s, a = (k / 10) * 6.283 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (m.kind === "mine") {
      // a pickaxe over a mound
      ctx.fillStyle = "#6b4a2b"; ctx.strokeStyle = "#f0c890"; ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.arc(x, y + 1.6 * s, 4.6 * s, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(x - 3 * s, y - 3.2 * s); ctx.lineTo(x + 2.6 * s, y + 1.2 * s); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - 2.2 * s, y - 2.4 * s, 2.6 * s, 3.6, 5.6); ctx.stroke();
    } else if (m.kind === "dock") {
      ctx.fillStyle = "#7a4a24"; ctx.fillRect(x - 1.2 * s, y - 3 * s, 2.4 * s, 6 * s);
    } else if (m.kind === "ferry") {
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#2f8fe0"; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.ellipse(x, y, 3.4 * s, 1.9 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    } else if (m.kind === "dragon") {
      ctx.fillStyle = "#ff3b2f"; ctx.beginPath(); ctx.arc(x, y, 3.2 * s, 0, 6.283); ctx.fill();
    }
  }
  const ORDER = { village: 0, bridge: 1, dock: 1.5, cave: 2, mine: 2.5, ether: 2.6, isle: 2.7, arena: 3, lair: 4, ferry: 4.5, dragon: 5 };
  function drawMap(ctx, w, h, big) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(big ? landImage(400, Math.round(400 * h / w)) : landImage(w, h), 0, 0, w, h);
    const xy = toMap(w, h), s = big ? Math.max(1.3, w / 620) : 1, f = big ? w / 900 : 1, marks = mapMarks().sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
    if (big) {
      // region names, faint, at the top of each region
      ctx.font = "800 " + Math.round(15 * f) + "px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.42)";
      // the north row's names along the top, the south row's along the bottom, and the lake's in the middle
      for (const R of App.regions) { const [x, y] = xy(R.cx, R.cz < 0 ? R.cz - 470 : R.cz + 500); ctx.fillText(R.name.toUpperCase(), x, y); }
      if (App.LAKE) { ctx.fillStyle = "rgba(255,255,255,0.32)"; const [x, y] = xy(0, 8); ctx.fillText("THE GREAT LAKE", x, y); }
    }
    for (const m of marks) {
      const [x, y] = xy(m.x, m.z);
      drawMark(ctx, m, x, y, s);
      if (m.kind === "dragon" && m.target) { const [tx, ty] = xy(m.target.x, m.target.z); ctx.strokeStyle = "#ff3b2f"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx, ty, 5 * s, 0, 6.283); ctx.stroke(); }
    }
    if (big) {
      // names of the places everyone looks for, each where it fits without covering another
      const fs = Math.round(12 * f), placed = [];
      ctx.font = "700 " + fs + "px system-ui, sans-serif";
      const clash = (r) => r.x0 < 2 || r.x1 > w - 2 || r.y0 < 2 || r.y1 > h - 2 || placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0);
      for (const m of marks) {
        if (m.kind !== "arena" && m.kind !== "cave" && m.kind !== "lair" && m.kind !== "mine" && m.kind !== "isle" && m.kind !== "ether") continue;
        const [x, y] = xy(m.x, m.z), tw = ctx.measureText(m.name).width, g = 6 * s;
        const tries = [[x + g, y + fs * 0.35, "left"], [x - g, y + fs * 0.35, "right"], [x, y - g - 2, "center"], [x, y + g + fs, "center"]];
        for (const [tx, ty, al] of tries) {
          const x0 = al === "left" ? tx : al === "right" ? tx - tw : tx - tw / 2, r = { x0: x0 - 2, x1: x0 + tw + 2, y0: ty - fs, y1: ty + 3 };
          if (clash(r)) continue;
          placed.push(r);
          ctx.textAlign = al;
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.strokeText(m.name, tx, ty);
          ctx.fillStyle = m.kind === "arena" ? "#ffe9a0" : m.kind === "cave" ? "#e4d4ff" : m.kind === "mine" ? "#f0c890" : m.kind === "isle" ? "#ffd23f" : m.kind === "ether" ? "#d9c4ff" : "#ffb3a8"; ctx.fillText(m.name, tx, ty);
          break;
        }
      }
    }
    if (st.wallet) {
      if (mineCache.wallet !== st.wallet) mineCache = { wallet: st.wallet, ids: App.tokensOf(st.wallet) };
      ctx.fillStyle = "#ffd23f";
      for (const id of mineCache.ids) { const p = App.planPos(id, st.T); const [x, y] = xy(p.x, p.z); ctx.fillRect(x - s, y - s, 2 * s, 2 * s); }
    }
    const [cx, cy] = xy(App.cam.target.x, App.cam.target.z), k = w / (W0.maxX - W0.minX);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, App.RANGE.full * k + 1), 0, 6.283); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, 6.283); ctx.fill();
  }
  function drawMinimap() {
    drawMap(mctx, mm.width, mm.height, false);
    const v = App.activeVillage, r = App.activeRegion;
    const inV = v && Math.hypot(v.x - App.cam.target.x, v.z - App.cam.target.z) < v.r + 4;
    $("mapLabel").textContent = (inV ? v.name + " (" + App.clanName(v.clan) + ") \u00b7 " : "") + (r ? r.name : "");
    if (!$("mapModal").hidden) drawBigMap();
  }
  // the mark under the cursor, for the tooltip and for clicks
  function markAt(canvas, e) {
    const r = canvas.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * canvas.width, py = ((e.clientY - r.top) / r.height) * canvas.height;
    const xy = toMap(canvas.width, canvas.height), reach = canvas === mm ? 5 : 9;
    let best = null, bd = reach;
    for (const m of mapMarks()) { const [x, y] = xy(m.x, m.z), d = Math.hypot(x - px, y - py) - (m.kind === "village" ? 1 : 0); if (d < bd) { bd = d; best = m; } }
    return { mark: best, x: W0.minX + (px / canvas.width) * (W0.maxX - W0.minX), z: W0.minZ + (py / canvas.height) * (W0.maxZ - W0.minZ) };
  }
  function showTip(e, m) {
    const tip = $("mapTip");
    if (!m) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.innerHTML = "<b>" + esc(m.name) + "</b><br>" + esc(m.sub);
    tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 12 + "px";
  }
  mm.addEventListener("mousemove", (e) => showTip(e, markAt(mm, e).mark));
  mm.addEventListener("mouseleave", () => { $("mapTip").hidden = true; });
  // the big map
  const bm = $("bigmap"), bctx = bm.getContext("2d");
  function drawBigMap() {
    const box = bm.parentElement, w = Math.min(1100, Math.max(320, box.clientWidth)), h = Math.round(w * (W0.maxZ - W0.minZ) / (W0.maxX - W0.minX));
    if (bm.width !== w) { bm.width = w; bm.height = h; }
    drawMap(bctx, bm.width, bm.height, true);
  }
  App.openMap = () => { $("mapModal").hidden = false; drawBigMap(); };
  $("mapOpen").onclick = () => App.openMap();
  $("mapClose").onclick = () => { $("mapModal").hidden = true; $("mapTip").hidden = true; };
  bm.addEventListener("mousemove", (e) => showTip(e, markAt(bm, e).mark));
  bm.addEventListener("mouseleave", () => { $("mapTip").hidden = true; });
  bm.addEventListener("click", (e) => {
    const { mark, x, z } = markAt(bm, e);
    $("mapModal").hidden = true; $("mapTip").hidden = true;
    if (mark) App.flyTo(mark.x, mark.z, mark.kind === "village" ? 60 : 40); else App.flyTo(x, z);
  });
  mm.addEventListener("click", (e) => {
    const { mark, x, z } = markAt(mm, e);
    if (mark && mark.kind !== "village") App.flyTo(mark.x, mark.z, 40); else App.flyTo(x, z);
  });

  // ---------- Tickles tab ----------
  function actionText(t) {
    const a = t.action;
    if (!a) return "Thinking\u2026";
    if (a.kind === "idle") return a.order ? "Waiting for orders" : "Hanging around";
    if (a.kind === "travel") return (t.riding ? (t.riding.fly ? "Flying its griffin to " : "Riding to ") : "Walking to ") + (a.label || "somewhere");
    if (a.kind === "ko") return "Knocked out!";
    if (a.kind === "held") return "Up in your hand!";
    if (a.kind === "flying") return "Flying through the air!";
    if (a.kind === "dizzy") return "A bit dizzy";
    if (a.kind === "fall") return "Fallen\u2026";
    if (a.kind === "spirit") return "A spirit, waiting at the altar";
    if (a.kind === "ringwait") return "Waiting for a challenger in the ring";
    if (a.kind === "box") return "Boxing " + (a.partner ? a.partner.name : "someone");
    if (a.kind === "cheer") return "Celebrating a win";
    if (a.kind === "tame") return a.phase === "offer" ? "Offering a snack to a wild " + App.CREATURES[a.target.sp].name : a.phase === "battle" ? "Battling a wild " + App.CREATURES[a.target.sp].name : "Sneaking up on a wild " + App.CREATURES[a.target.sp].name;
    if (a.kind === "duel") return "Battling in the arena";
    if (a.kind === "brawl") return "Fighting a " + App.MONSTERS[a.foe.kind].name;
    if (a.kind === "delve") return a.phase === "inside" ? "Deep inside " + a.dungeon.name : "Heading down into " + a.dungeon.name;
    if (a.kind === "fight") return (a.phase === "doing" ? "Fighting " : "Charging at ") + (a.partner ? a.partner.name : "someone");
    if (a.kind === "hunt") return "Chasing a " + (a.prey ? a.prey.kind : "deer");
    if (a.kind === "throw") return a.hunt ? "Hunting the dragon with the Guild" : "Throwing stones at the dragon";
    if (a.kind === "command") return "Sending its creature against the dragon";
    if (a.kind === "hide") return "Hiding from the dragon";
    if (a.kind === "ride") return "On the ferry across the lake";
    if (a.kind === "row") return a.phase === "fish" ? "Fishing from a rowing boat" : "Rowing on the lake";
    if (a.kind === "cower") return "Ducking: a dragon is flying overhead!";
    if (a.kind === "slay") return "Fighting the dragon with " + (a.weapon === "axe" ? "an axe" : "a " + a.weapon);
    if (a.kind === "mining") return "Down " + (a.mine ? a.mine.name : "the mine") + ", working the rock";
    if (a.kind === "rounds") return a.what || "On guard down the mine (Warriors' Guild)";
    if (a.kind === "contest") return App.contestActionText(t);
    if (a.kind === "dive") return App.diveActionText(t);
    if (a.kind === "fp") return App.fpText(t);
    if (a.kind === "seafight") return App.seaActionText(t);
    if (a.kind === "forge") return "Hammering at the anvil (Blacksmiths' Guild)";
    if (a.kind === "sail") return "Out sailing its own boat";
    if (!a.act) return "Busy";
    if (a.chat) return (a.phase === "doing" ? "Chatting with " : "Going to chat with ") + (a.partner ? a.partner.name : "a friend");
    if (a.phase === "walk") return "Heading to: " + a.act.name;
    return a.act.verb ? a.act.verb.replace(/^is /, "").replace(/^./, (c) => c.toUpperCase()) : a.act.name;
  }
  App.actionText = actionText;
  function planText(t) {
    const { step } = App.planStep(t.id, st.T);
    const c = clockOf(Math.floor(st.T / 1440) * 1440 + step.e);
    return App.stepLabel(step.k) + (step.k === "job" ? " (" + t.jobInfo.verb.replace(/^is /, "") + ")" : "") + " at " + (step.p.label || "") + " until " + c.short + " \u00b7 now: " + actionText(t);
  }
  function needsHTML(t) {
    return '<div class="needs">' + App.NEEDS.map((k) => {
      const v = Math.round(t.needs[k]);
      return "<span>" + App.NEED_LABEL[k] + '</span><div class="bar"><i style="width:' + v + "%;background:" + NEED_COL[k] + '"></i></div><span class="num">' + v + "%</span>";
    }).join("") + "</div>";
  }
  function creaturesHTML(t) {
    const list = App.creaturesOf(t.id);
    if (!list.length) return App.isTamer(t.id) ? '<p class="note">A tamer still looking for a first creature.</p>' : "";
    return "<h3>Creatures</h3>" + list.map((c, i) => { const B = App.CREATURES[c.sp]; return '<div class="row" style="justify-content:space-between"><span><span class="clandot" style="background:' + App.CREATURE_TYPE_COL[B.type] + '"></span>' + esc(App.creatureLabel(c)) + (i === 0 ? ' <span class="note">(at heel)</span>' : "") + '</span><span class="note">' + B.type + " \u00b7 " + (c.wins || 0) + "W " + (c.losses || 0) + "L</span></div>"; }).join("");
  }
  function villageHTML(t) {
    const v = t.village, c = v.clan, n = v.residents.length;
    const chore = App.doesChores(t.id) ? App.CHORE_INFO[App.choreOf(t.id)].title : "Afternoons off";
    // its place's closest ally and worst rival among the places round about
    const rel = App.gridNear("village", v.x, v.z, 400).filter((o) => o !== v).map((o) => [o.clan, App.clanRel(c, o.clan)]).sort((a, b) => a[1] - b[1]);
    const rival = rel[0] || [c, 50], ally = rel[rel.length - 1] || [c, 50];
    const dead = App.isDead(t.id) && st.fallen[t.id], rit = dead && st.rituals[v.i];
    const ko = dead ? '<p class="note"><b>Fallen</b> ' + esc(dead.cause) + ". Its spirit waits at the altar" + (rit && !rit.done ? "; the revival ritual is at " + App.clock(rit.s).short + (rit.day > Math.floor(st.T / 1440) ? " tomorrow" : "") : "") + ".</p>"
      : App.isKO(t.id) ? '<p class="note"><b>Knocked out</b>: recovering at home until ' + App.clock(App.pop.ko[t.id]).short + ".</p>" : "";
    const ruinNote = App.homeRuined(t.id) ? '<p class="note">' + (App.homeUpgrading && App.homeUpgrading(t.id) ? "The village builders are building it a bigger house; it sleeps in the town hall until it is done." : "Its house is in ruins; it sleeps in the town hall while the village rebuilds.") + "</p>" : "";
    const att = App.activeAttackAt(v.i);
    return '<div class="kv"><span class="k">Home</span><span><span class="clandot" style="background:' + App.clanColor(c) + '"></span>' + esc(v.name) + " \u00b7 " + esc(App.placeKindText(v)) + "</span>" +
      '<span class="k">Granary</span><span>' + Math.round(v.food) + " food for " + n + " (" + App.foodWord(v) + ")</span>" +
      (App.oreOf ? (() => { const o = App.oreOf(v), list = Object.keys(App.ORES).filter((k) => o[k] >= 1).map((k) => Math.floor(o[k]) + " " + k); return '<span class="k">Stores</span><span>' + (list.length ? list.join(", ") : "nothing from the mine yet") + (o.tools ? " &middot; " + o.tools + " sets of tools" : "") + "</span>"; })() : "") +
      '<span class="k">Chores</span><span>' + esc(chore) + "</span>" +
      '<span class="k">Level</span><span>' + App.levelOf(t.id) + ' <span class="note">(' + Math.round(App.xpOf(t.id)) + "/" + App.xpNeed(App.levelOf(t.id)) + " xp)" + (App.isAdventurer(t.id) ? " \u00b7 adventurer" : "") + "</span></span>" +
      (App.heroOf && App.heroOf(t.id) ? '<span class="k">Blessed</span><span><span class="clandot" style="background:' + App.BLESSINGS[App.blessingOf(t.id)].color + '"></span><b>' + esc(App.BLESSINGS[App.blessingOf(t.id)].name) + "</b>" + (App.heroOf(t.id).one ? " (a 1/1)" : "") + ' <span class="note">' + esc(App.BLESSINGS[App.blessingOf(t.id)].what) + "</span></span>" : "") +
      '<span class="k">Arms</span><span>' + esc(App.gearText(t.id)) + "</span>" +
      '<span class="k">Ethernum</span><span>' + (Math.round(App.ethernumOf(t.id) * 10) / 10) + " crystals" + (App.devout(t.id) ? ' <span class="note">(devout)</span>' : "") + "</span>" +
      (App.underPower ? '<span class="k">Underworld</span><span>strength ' + Math.round(App.underPower(t.id)) + (App.relicsOf(t.id).length ? " \u00b7 " + esc(App.relicsOf(t.id).map((k) => App.relicInfo(k).name).join(", ")) : "") + ' <span class="note">(its village has reached B' + (((st.depth && st.depth[t.village.i]) || 0) + 1) + "F)</span></span>" : "") +
      (App.guildOf ? (() => { const g = App.guildOf(t.id), r = App.combatRole ? App.combatRole(t.id) : null, sch = App.mageSchool ? App.mageSchool(t.id) : null;
        return '<span class="k">Guild</span><span>' + (g ? '<span class="clandot" style="background:' + App.GUILDS[g].color + '"></span>' + esc(App.GUILDS[g].name) + " \u00b7 " + App.guildRankName(t.id) + ' <span class="note">(' + Math.round((st.gxp && st.gxp[t.id]) || 0) + " standing)</span>" : "None") +
          (r ? ' <span class="note">\u00b7 fights as ' + (r === "mage" ? "a mage (" + esc(App.SPELLS[sch].name) + ")" : r === "healer" ? "a healer (Healing Light)" : r === "tamer" ? "a tamer, with its creature" : "a warrior") + "</span>" : "") + "</span>"; })() : "") +
      '<span class="k">Faction</span><span>' + (App.factionOf(t.id) ? '<span class="clandot" style="background:' + App.FACTIONS[App.factionOf(t.id)].color + '"></span>' + esc(App.FACTIONS[App.factionOf(t.id)].name) : "None") + "</span>" +
      '<span class="k">Purse</span><span>' + Math.round(App.shellsOf(t.id)) + " shells</span>" + (App.wealthRowHTML ? App.wealthRowHTML(t.id) : "") + (App.contestRowHTML ? App.contestRowHTML(t.id) : "") +
      (App.slayerOf && App.slayerOf(t.id) ? '<span class="k">Glory</span><span>Dragon slayer: struck the final blow on ' + esc(App.lairs[App.slayerOf(t.id).lair].name) + "</span>" : "") +
      '<span class="k">Ties</span><span>' + (rel.length ? esc(App.relWord(ally[1])) + " with " + esc(App.villages[ally[0]].name) + ", " + esc(App.relWord(rival[1])) + " with " + esc(App.villages[rival[0]].name) : "no neighbours") + "</span></div>" +
      (att ? '<p class="note"><b>A dragon is attacking ' + esc(v.name) + "!</b></p>" : "") + ko + ruinNote + creaturesHTML(t);
  }
  function renderTickles() {
    const t = st.tickles.find((x) => x.id === ui.sel);
    const det = $("tickleDetail");
    if (ui.sel != null && !t) det.innerHTML = '<div class="card"><h2>' + esc(App.nameOf(ui.sel)) + '</h2><p class="note">Coming into view\u2026</p></div>';
    else if (t) {
      const owner = App.ownerOf(t.id);
      const mine = App.isMine(t.id);
      const friends = App.friendsOf(t.id).slice(0, 3).map(([id, v]) => "<div>" + esc(App.nameOf(id)) + ' <span class="note">\u00b7 ' + App.relLabel(v) + "</span></div>").join("") || '<p class="note">No friends yet.</p>';
      const favId = Object.entries(t.fav).sort((a, b) => b[1] - a[1])[0];
      const fav = favId ? (App.actById(favId[0]) || { name: favId[0].replace(/^hold_/, "") }).name : "\u2014";
      const canOrder = App.canOrder(t);
      const traits = TB.SLOTS.map((slot) => { const L = TB.SLOT_LABEL[slot]; const v = t.verified && t.verified.find((x) => x.slot === L); return '<span class="k">' + esc(L) + "</span><span>" + esc(t.traits[L]) + (t.traits[L + " Theme"] && t.traits[L + " Theme"] !== "None" ? ' <span class="note">(' + esc(t.traits[L + " Theme"]) + ")</span>" : "") + "</span>" + (v ? '<span class="' + (v.match ? "ok" : "no") + '">' + (v.match ? "\u2713" : "\u2717") + "</span>" : "<span></span>"); }).join("");
      det.innerHTML = '<div class="card">' +
        '<div class="row" style="justify-content:space-between"><div class="row"><span class="sw" style="background:' + t.swatch + '"></span><h2>' + esc(t.name) + "</h2></div>" +
        '<div class="row"><button class="btn" data-act="fp" title="See through its eyes (V)">' + (App.fpId && App.fpId() === t.id ? "Leave first person" : "First person") + '</button><button class="btn" data-act="follow">' + (App.cam.follow === t.id ? "Following" : "Follow") + '</button><button class="btn" data-act="close" aria-label="Close">\u2715</button></div></div>' +
        '<p class="note">' + esc(t.jobInfo.title) + " from " + esc(t.village.name) + " (" + esc(App.regions[t.village.region].name) + ")</p>" + villageHTML(t) +
        '<p class="note">' + esc(planText(t)) + "</p>" +
        '<p class="note">Owner ' + (mine ? '<b class="ok">you (' + esc(short(owner)) + ")</b>" : esc(short(owner) || "unknown")) + " \u00b7 snapshot " + esc(TB.OWNERS ? TB.OWNERS.date : "") + "</p>" + needsHTML(t) +
        (st.mode === "manual" ? (canOrder ? '<h3>Orders</h3><div class="row"><button class="btn" data-order="hunger">Eat</button><button class="btn" data-order="energy">Rest</button><button class="btn" data-order="fun">Have fun</button><button class="btn" data-order="social">Socialise</button><button class="btn" data-order="home">Go home</button><button class="btn" data-order-dive="' + t.id + '">Go diving</button></div>'
          : '<p class="note">Only its owner can give this Tickle orders. Choose a holder in the Holders tab to play as them.</p>') : "") +
        "<h3>On-chain identity \u00b7 token #" + t.id + "</h3>" +
        '<div class="traits">' + traits + "</div>" +
        '<p class="note">' + (t.verified ? '<span class="ok">' + t.verified.filter((v) => v.match).length + " of 9</span> traits match this token's tokenURI(). " : "") +
        "Seed derived in your browser with the contract's own formula, keccak256(id + randomKey); body voxelized from the on-chain strokes.</p>" +
        '<div class="row"><button class="btn primary" data-act="bio">Biography and routine</button><button class="btn sea" data-act="onchain">See the on-chain render</button></div>' +
        "<h3>Friends</h3>" + friends +
        '<div class="kv"><span class="k">Favourite</span><span>' + esc(fav) + '</span><span class="k">Holding</span><span>' + esc(t.holding || "Nothing") + '</span><span class="k">Inventory</span><span>' + esc(t.ground ? t.ground + (t.itemMode ? " (in use)" : " (put away)") : "Nothing") + "</span></div></div>";
    } else det.innerHTML = "";
    const list = st.tickles.slice().sort((a, b) => Math.hypot(a.pos.x - App.cam.target.x, a.pos.z - App.cam.target.z) - Math.hypot(b.pos.x - App.cam.target.x, b.pos.z - App.cam.target.z));
    $("nearbyTitle").textContent = "Nearby (" + st.tickles.length + (App.pop.pending.size ? ", " + App.pop.pending.size + " arriving" : "") + ")";
    $("tickleList").innerHTML = list.slice(0, 40).map((x) => {
      const bars = App.NEEDS.map((k) => '<i style="height:' + Math.max(2, Math.round((x.needs[k] / 100) * 22)) + "px;background:" + NEED_COL[k] + '"></i>').join("");
      return '<button class="trow" data-tid="' + x.id + '" aria-current="' + (x.id === ui.sel) + '"><span class="sw" style="background:' + x.swatch + '"></span><span style="min-width:0"><div class="tname">' + esc(x.name) + (App.isMine(x.id) ? ' <span class="chip approved">yours</span>' : "") + '</div><div class="tact">' + esc(actionText(x)) + '</div></span><span class="mini">' + bars + "</span></button>";
    }).join("") || '<p class="note">No Tickles in view. Move with WASD or click the map.</p>';
  }
  $("tab-tickles").addEventListener("click", (e) => {
    const row = e.target.closest("[data-tid]");
    if (row) { selectTickle(+row.dataset.tid); const t = st.tickles.find((x) => x.id === +row.dataset.tid); if (t) App.flyTo(t.pos.x, t.pos.z, Math.min(App.cam.radius, 26)); return; }
    const t = st.tickles.find((x) => x.id === ui.sel);
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "findBtn") return findToken();
    if (!t) return;
    if (b.dataset.act === "close") { ui.sel = null; App.cam.follow = null; App.pinned = null; refresh(true); }
    if (b.dataset.act === "fp") { if (App.fpId() === t.id) App.exitFP(); else App.enterFP(t.id); refresh(true); }
    if (b.dataset.act === "follow") { App.cam.follow = App.cam.follow === t.id ? null : t.id; refresh(true); }
    if (b.dataset.act === "onchain") openOnchain(t);
    if (b.dataset.act === "bio") App.openDirectory(t.id);
    if (b.dataset.order) { App.order(t, b.dataset.order === "home" ? { kind: "home" } : { kind: "need", need: b.dataset.order }); refresh(true); }
  });
  function findToken() {
    const v = $("findInput").value.trim().replace(/^#/, "");
    const id = parseInt(v, 10);
    if (!(id >= 0 && id < TB.SUPPLY)) { $("findNote").textContent = "Token ids go from 0 to " + (TB.SUPPLY - 1) + "."; return; }
    $("findNote").textContent = App.nameOf(id) + " lives in " + App.villageOfToken(id).name + ". Flying there\u2026";
    App.goToToken(id, true);
  }
  $("findInput").addEventListener("keydown", (e) => { if (e.key === "Enter") findToken(); });
  let onchainHTML = null;
  function openOnchain(t) {
    $("onchainTitle").textContent = "On-chain render \u00b7 " + t.name;
    $("onchainNote").textContent = "This frame runs the exact HTML that htmlForToken() returns from contract " + TB.CONTRACT.slice(0, 6) + "\u2026" + TB.CONTRACT.slice(-4) + ", with token #" + t.id + "'s seed. Drag inside it to orbit.";
    $("onchainModal").hidden = false;
    const frame = $("onchainFrame");
    const load = onchainHTML || fetch("onchain-tickle.html").then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
    onchainHTML = load;
    load.then((html) => { frame.removeAttribute("src"); frame.srcdoc = html.replace(/window\.seed="\d+"/, 'window.seed="' + t.seed + '"'); })
      .catch(() => { onchainHTML = null; frame.src = "onchain-tickle.html?seed=" + encodeURIComponent(t.seed); });
  }
  // a kit model in the original viewer: the model is appended to the contract's own packed model
  // list and the seed is one that picks it; the viewer's code is not touched.
  async function openOnchainKit(kind, v) {
    const K = TB.KIT[kind];
    $("onchainTitle").textContent = "On-chain viewer \u00b7 " + K.name + (K.variants.length > 1 ? " (" + (K.variantLabel ? K.variantLabel(v) : "version " + (v + 1)) + ")" : "");
    $("onchainNote").textContent = "Packing the model\u2026";
    $("onchainModal").hidden = false;
    const frame = $("onchainFrame");
    try {
      const html = await (onchainHTML || (onchainHTML = fetch("onchain-tickle.html").then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })));
      const layers = TB.fromCompact(K.build(v), "floor");
      // every on-chain floor carries attach points; one pointing at a slot no seed fills keeps the
      // renderer's first colour slot on it, exactly as with the real floors
      layers[0].subparts.push({ primitive: "attach", partName: "floor", attach: { part: "hat", side: "the" }, position: [0, 0, 0], rotation: [0, 0, 0], size: [1, 1, 1], blend: 0, material: 0 });
      const index = 100;
      const models = TB.packWith([{ part: "floor", side: "the", index, layers, bounds: TB.boundsOf(layers) }]);
      const repo = TB.decodeRepo(models), back = repo.models.floor[index] && repo.models.floor[index].the;
      if (!back || back.layers.length !== layers.length) throw new Error("the packed model did not read back");
      const idx = {};
      for (const s of TB.SLOTS) idx[s] = repo.models[s].filter((e) => !!e).map((e) => e.the.index).sort((a, b) => a - b);
      const seed = TB.seedFor("floor", index, idx);
      if (!seed) throw new Error("no seed picked the model");
      frame.removeAttribute("src");
      frame.srcdoc = html.replace(/window\.models="[^"]*"/, () => 'window.models="' + models + '"').replace(/window\.seed="\d+"/, () => 'window.seed="' + seed + '"');
      // switch to the viewer's own wide orbiting camera (its "e-cam" message, camera 0) so the whole model is in view
      frame.onload = () => { for (const ms of [300, 1500, 4000]) setTimeout(() => { try { frame.contentWindow.postMessage({ name: "e-cam", camera: 0 }, "*"); } catch (e) { /* frame gone */ } }, ms); };
      const n = K.build(v).length;
      $("onchainNote").textContent = "This frame runs the exact HTML that htmlForToken() returns from contract " + TB.CONTRACT.slice(0, 6) + "\u2026" + TB.CONTRACT.slice(-4) + ". Only its two data strings differ: the " + K.name.toLowerCase() + " (" + n + " strokes) is packed onto the end of the contract's model list as floor #" + index + ", and the seed is one whose traits pick that floor with no theme. The viewer's own orbit camera circles it.";
    } catch (err) {
      $("onchainNote").textContent = "Could not open the viewer: " + err.message;
    }
  }
  App.openOnchainKit = openOnchainKit;
  $("onchainClose").onclick = () => { $("onchainModal").hidden = true; const f = $("onchainFrame"); f.removeAttribute("srcdoc"); f.src = "about:blank"; };

  // ---------- Holders tab ----------
  function renderHolders(force) {
    if (!force && ui.sigHolders === st.wallet) return;
    ui.sigHolders = st.wallet;
    const O = TB.OWNERS;
    let h = '<div class="card"><h2>Play as a holder</h2><p class="note">Ownership comes from ownerOf() on Ethereum, snapshot of ' + esc(O.date) + " (block " + O.block.toLocaleString() + "). " +
      O.holders.length.toLocaleString() + " wallets hold the " + TB.SUPPLY.toLocaleString() + " Tickles. Playing as a wallet lets you direct its Tickles in \u201cI'm in control\u201d mode; this prototype doesn't ask for a signature, so it is a preview of the online version.</p>" +
      '<label class="note" for="walletInput">Wallet address</label><div class="row"><input id="walletInput" type="text" spellcheck="false" placeholder="0x\u2026" value="' + esc(st.wallet || "") + '" style="flex:1;min-width:0"><button class="btn primary" id="walletBtn">Play as</button></div>' +
      (st.wallet ? '<div class="row"><button class="btn" id="walletClear">Stop playing as ' + esc(short(st.wallet)) + "</button></div>" : "") + "</div>";
    if (st.wallet) {
      const ids = App.tokensOf(st.wallet);
      const byIsl = {};
      for (const id of ids) (byIsl[App.pop.village[id]] = byIsl[App.pop.village[id]] || []).push(id);
      h += '<div class="card"><h3>' + ids.length + " Tickles in this wallet</h3>" + (ids.length ? "" : '<p class="note">None in the snapshot.</p>') +
        Object.entries(byIsl).sort((a, b) => b[1].length - a[1].length).slice(0, 60).map(([i, list]) => '<div class="isl"><button class="btn" data-island="' + i + '">' + esc(App.villages[i].name) + " \u00b7 " + list.length + '</button><span class="note">' + list.slice(0, 12).map((id) => '<a href="#" data-token="' + id + '">#' + id + "</a>").join(" ") + (list.length > 12 ? " \u2026" : "") + "</span></div>").join("") + "</div>";
    }
    // which ownership snapshot the map follows, and reading a newer one from Ethereum
    { const I = App.ownersInfo ? App.ownersInfo() : null;
      if (I) h += '<div class="card"><h3>Who owns what</h3><p class="note">The map follows ' + (I.source === "browser" ? "a newer reading kept in this browser" : "the snapshot that came with the game") + ": block " + I.block.toLocaleString() + " (" + esc(I.date) + ")" + (I.source === "browser" ? ", " + I.changed + " Tickles changed hands since the game's own" : "") + ". When owners change, everyone who still fits keeps their plot; only those who grew or shrank past a size move.</p>" +
        '<div class="row"><button class="btn" id="ownersUpdate">Read the owners from Ethereum now</button>' + (I.source === "browser" ? '<button class="btn" id="ownersClear">Back to the game\'s snapshot</button>' : "") + '</div><p class="note" id="ownersNote">' + (ui.ownersMsg || "") + "</p></div>"; }
    // who is up for sale, and so in the prison (prison.js)
    if (App.prisonHoldersHTML) h += App.prisonHoldersHTML();
    // every holder's place: an estate, a mansion, or a house in a shared town
    const placeOf = (addr) => App.villages.find((v) => v.holder === addr) || (() => { const ids = App.tokensOf(addr); return ids.length ? App.villageOfToken(ids[0]) : null; })();
    if (st.wallet) { const pv = placeOf(st.wallet); if (pv) h += '<div class="card"><h3>Your place</h3><div class="row"><button class="btn primary" data-island="' + pv.i + '">' + esc(pv.name) + '</button><span class="note">' + esc(App.placeKindText(pv)) + "</span></div></div>"; }
    h += '<div class="card"><h3>Biggest holders</h3><p class="note">Every holder has a place of its own: from ' + App.SETTLE.GRAND + " Tickles an estate with a mansion for every " + App.SETTLE.GRAND + ", from " + App.SETTLE.MEDIUM + " a small plot with four houses, from " + App.SETTLE.PAIR + " two houses in a town, and below that a house in a town. Click a place to fly there.</p>" + App.topHolders(12).map((x, i) => { const pv = placeOf(x.addr); return '<div class="row" style="justify-content:space-between"><span class="pix">' + (i + 1) + ". " + esc(short(x.addr)) + (pv ? ' <button class="btn" data-island="' + pv.i + '">' + esc(pv.name) + "</button>" : "") + '</span><span class="row"><span class="note">' + x.count + ' Tickles</span><button class="btn" data-wallet="' + x.addr + '">Play as</button></span></div>'; }).join("") + "</div>";
    $("holdersBody").innerHTML = h;
  }
  $("tab-holders").addEventListener("click", (e) => {
    const b = e.target.closest("button, a");
    if (b && b.id === "ownersUpdate") {
      // (the message is kept, so it survives the tab being drawn again while the owners are read)
      const say = (html) => { ui.ownersMsg = html; const el = $("ownersNote"); if (el) el.innerHTML = html; };
      b.disabled = true; say("Asking an Ethereum node for the owner of every Tickle\u2026");
      App.refreshOwners((f) => say("Reading ownerOf() for every Tickle\u2026 " + Math.round(f * 100) + "%"))
        .then((r) => say(r.changed + " Tickles have changed hands since (block " + r.block.toLocaleString() + "). " + (r.changed ? '<button class="btn primary" id="ownersReload">Rebuild the map now</button>' : "Nothing to move.")))
        .catch((err) => { const el = $("ownersUpdate"); if (el) el.disabled = false; say("Could not read the owners here (" + (err && err.message ? esc(err.message) : "no network") + "). Where the page cannot reach the network, as in the claude.ai viewer, run tools/update_owners.py on a computer and publish the new js/owners.js."); });
      return;
    }
    if (b && b.id === "ownersReload") { App.save(); location.reload(); return; }
    if (b && b.id === "ownersClear") { App.clearOwners(); App.save(); location.reload(); return; }
    if (!b) return;
    if (b.dataset.token) { e.preventDefault(); App.goToToken(+b.dataset.token, true); return; }
    if (b.dataset.island) { const o = App.villages[+b.dataset.island]; App.flyTo(o.x, o.z, 40); return; }
    if (b.dataset.wallet) return setWallet(b.dataset.wallet);
    if (b.id === "walletBtn") return setWallet($("walletInput").value.trim());
    if (b.id === "walletClear") return setWallet(null);
  });
  function setWallet(a) {
    if (a && !/^0x[0-9a-fA-F]{40}$/.test(a)) { App.toast("That isn't a wallet address."); return; }
    st.wallet = a ? a.toLowerCase() : null;
    ui.sigHolders = "x";
    if (st.wallet) {
      const ids = App.tokensOf(st.wallet);
      App.log("world", "You are playing as " + short(st.wallet) + " (" + ids.length + " Tickles).", "Their Tickles show a gold tag and follow your orders in \u201cI'm in control\u201d mode.");
      if (ids.length) App.goToToken(ids[0], false);
    }
    refresh(true);
  }

  // ---------- Director tab ----------
  function renderDirector() {
    const auto = st.mode === "auto";
    const nextIn = Math.max(0, Math.round(st.director.next - st.T));
    const isl = App.activeVillage;
    $("dirStatus").innerHTML = "<h2>" + (auto ? "The Director is running the world" : "You're in control") + "</h2><p class=\"note\">" +
      (auto ? "It looks after the village you are in (" + esc(isl ? isl.name : "") + ") every few game hours: objects, new looks for on-chain items, activities, buildings and events. Next check in " + Math.floor(nextIn / 60) + "h " + (nextIn % 60) + "m of game time."
        : "The Director is paused. Ask it for a suggestion and it lands in Review, waiting for your approval.") + "</p>";
    const d = App.diagnose();
    $("diag").innerHTML = App.NEEDS.map((k) => "<span>" + App.NEED_LABEL[k] + '</span><div class="bar"><i style="width:' + Math.round(d[k].avg) + "%;background:" + NEED_COL[k] + '"></i></div><span class="num">' + Math.round(d[k].avg) + "% \u00b7 " + Math.round(d[k].supply) + " spots</span>").join("");
    $("runDirector").textContent = auto ? "Run the Director now" : "Ask the Director for a suggestion";
    const items = st.log.slice(0, 70).map((e) => '<div class="entry"><div class="when">' + when(e.t) + '</div><div><div class="kind k-' + e.kind + '">' + esc(e.kind) + "</div><div>" + esc(e.text) + "</div>" + (e.why ? '<div class="why">' + esc(e.why) + "</div>" : "") + "</div></div>").join("");
    $("log").innerHTML = items || '<p class="note">Nothing yet.</p>';
  }
  $("runDirector").onclick = async () => {
    $("runDirector").disabled = true;
    const res = await App.directorRun({ apply: st.mode === "auto", manualAsk: true });
    $("runDirector").disabled = false;
    if (res && st.mode === "manual") { ui.review = keyOf(res); App.toast("Suggestion ready in Review"); }
    refresh(true);
  };
  $("remixBtn").onclick = async () => {
    $("remixBtn").disabled = true;
    const res = await App.directorRun({ apply: st.mode === "auto", manualAsk: true, force: { type: "remix", why: "You asked for a new look for an on-chain item." } });
    $("remixBtn").disabled = false;
    if (res) { ui.review = keyOf(res); setTab("review"); }
  };
  App.ui.onLog = () => { if (ui.tab === "director") ui.logDirty = true; };

  // ---------- Claude designer ----------
  let sample = null, ctl = null;
  (async () => {
    try { if (window.claude && window.claude.use) sample = await window.claude.use("sample"); } catch (e) { sample = null; }
    claudeAvailable(!!sample);
  })();
  function claudeAvailable(on, why) {
    $("askClaude").hidden = !on;
    $("brief").disabled = !on;
    if (!on) $("claudeStatus").textContent = why || "Claude designs work when this page is opened inside Claude. The Director's own designer keeps running either way.";
  }
  function claudePrompt(brief) {
    const R = TB.repo(), d = App.diagnose();
    const pal = TB.paletteList().map((p) => p.i + ":" + TB.rgbHex(p.rgb)).join(" ");
    const ex = (part, idx) => JSON.stringify(TB.toCompact(R.models[part][idx].the.layers.filter((L) => L.subparts.length)));
    const isl = App.activeVillage;
    const objects = [...new Set(st.props.map((p) => (App.assetById(p.assetId) || {}).name).filter(Boolean))].slice(0, 20).join(", ") || "none yet";
    return [
      "You design objects for Tickle Beach World, a voxel life-sim built on the Tickle Beach NFT collection. Every model in the collection is stored on Ethereum as a list of SDF strokes: signed-distance primitives that are smoothly unioned, carved, or used to repaint colour. Design ONE new beach object for the Tickles in exactly this format, plus the activity it unlocks. Build on the collection's own style: its models already include beach balls, coolers, chairs, campfires, palm trees, umbrellas and piers.",
      "",
      "COORDINATES: SDF units. z is up and the ground is z = 0. y points to the front, x to the side. A Tickle character is about 480 tall and 150 wide. Make the object 80 to 500 tall, resting on z = 0, and keep it within 600 units wide.",
      "",
      "STROKE FIELDS",
      '- p: "sphere" (ellipsoid; size = [rx, ry, rz] radii), "cube" (box; size = half-extents), "cylinder" (axis = local z; size = [radiusX, radiusY, halfHeight]), "joint" (capsule along local z; size = [radius, radius, halfLength]), "bezier" (an arch in the local x-y plane from (-sx,-sy) up to about (0, sy) and down to (sx,-sy); lw = tube thickness; extruded +-sz along local z).',
      '- m: "add" (smooth union), "sub" (carves away what came before it in the same layer), "rep" (repaints colour onto existing surface within its shape, adds no geometry).',
      "- pos: [x, y, z] centre. rot: [rx, ry, rz] radians applied as Rx*Ry*Rz: rx = 1.57 lays the local z axis along -y, ry = 1.57 lays it along +x, rz spins around the vertical axis.",
      "- blend: smooth-union radius (0 = hard edge, 2 to 12 typical). round, bevel, cone, hole: 0 to 1 shape modifiers (cone tapers toward local +z).",
      "- mirror: true duplicates the stroke mirrored across x = 0; when you use it set offsX equal to pos[0].",
      "- color: an index into the on-chain palette below. layer: integer; strokes in the same layer merge first, layers then merge in order. Never leave a layer with a single stroke (the on-chain shader skips it).",
      "",
      "ON-CHAIN PALETTE (index:hex): " + pal,
      "",
      "REAL ON-CHAIN MODELS IN THIS FORMAT",
      "Cooler (a ground item): " + ex("ground", 1),
      "Chair (a ground item): " + ex("ground", 3),
      "Beach umbrella (cut from the Beach Sand floor): " + JSON.stringify(TB.recenterCompact(TB.toCompact(TB.fragmentLayers("umbrella")))),
      "",
      "WHERE IT GOES: " + (isl ? isl.name + " in the " + App.regions[isl.region].name + " region" : "a village") + ", " + st.tickles.length + " Tickles nearby. Average needs: " + App.needsLine(d) + ". Designed objects already in the world: " + objects + ".",
      "BRIEF: " + (brief || "Design whatever would help the lowest need the most."),
      "",
      "Reply with only this JSON:",
      '{"name": "short name", "purpose": "one sentence", "category": "hunger|fun|social|energy|decor", "activity": {"name": "short verb phrase", "verb": "is <doing it>", "needs": {"hunger": 0, "energy": 0, "social": 0, "fun": 0}, "capacity": 2, "minutes": 15}, "strokes": [8 to 40 stroke objects]}',
      "Need effects range from -20 to 60. Use the palette indices, mirror for symmetric parts, soft blends like the examples, and a few rep strokes for colour detail.",
    ].join("\n");
  }
  App.claudePrompt = claudePrompt;
  $("askClaude").onclick = async () => {
    if (!sample) return;
    const brief = $("brief").value.trim();
    ctl = new AbortController();
    $("askClaude").disabled = true; $("stopClaude").hidden = false;
    $("claudeStatus").textContent = "Claude is thinking\u2026";
    try {
      const data = await sample.json(claudePrompt(brief), {
        signal: ctl.signal, cache: false, modelTier: "default",
        onText: ({ text }) => { $("claudeStatus").textContent = "Claude is writing strokes\u2026 " + text.length + " characters so far"; },
      });
      if (!data || !Array.isArray(data.strokes) || data.strokes.length < 3) throw { code: "shape", message: "no strokes" };
      $("claudeStatus").textContent = "Voxelizing and checking Claude's design\u2026";
      const asset = await App.createAsset({ name: data.name, purpose: data.purpose, category: data.category, activity: data.activity, strokes: data.strokes, brief: brief || "Fix the biggest need" }, "claude");
      const isl = App.activeVillage;
      asset.suggestAt = { x: isl.x, z: isl.z };
      if (st.mode === "auto" && asset.passes) {
        const spot = App.findSpot(isl.x, isl.z, 3, { nearWater: asset.waterside });
        if (spot) App.placeProp(asset, spot.x, spot.z);
        App.activateAsset(asset, "auto");
        App.log("claude", "Claude designed " + asset.name + " and it passed the checks (" + asset.score + "%), so it's on " + isl.name + ".", asset.purpose || "");
      } else {
        asset.status = "pending";
        App.log("claude", "Claude designed " + asset.name + " (fidelity " + asset.score + "%). Waiting for your review.", asset.passes ? asset.purpose || "" : "Flagged: " + App.firstProblem(asset));
      }
      $("claudeStatus").textContent = "Done: " + asset.name + ". Open it in Review.";
      ui.review = "a:" + asset.id;
      setTab("review");
    } catch (e) {
      const code = e && e.code;
      const msg = {
        cancelled: "Stopped.", rate_limited: "Claude is busy right now. Try again in a little while.",
        invalid_json: "Claude's answer wasn't usable JSON. Try again.", refused: "Claude declined that brief. Try different wording.",
        shape: "Claude's answer had no strokes. Try again with a simpler brief.", session_expired: "Sign in to Claude again, then retry.",
      }[code];
      if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) claudeAvailable(false, "Claude designs are turned off for this view.");
      else $("claudeStatus").textContent = msg || "Something went wrong reaching Claude. Try again.";
    } finally {
      $("askClaude").disabled = false; $("stopClaude").hidden = true; ctl = null;
    }
  };
  $("stopClaude").onclick = () => { if (ctl) ctl.abort(); };

  // ---------- Review tab ----------
  function keyOf(x) { if (!x) return null; if (x.strokes) return "a:" + x.id; if (x.blocks) return "p:" + x.id; return "m:" + x.id; }
  function reviewItems() {
    const items = [];
    for (const a of st.assets) if (a.status !== "discarded") items.push({ key: "a:" + a.id, type: "asset", obj: a, name: a.name, status: a.status, source: a.source, t: a.createdAt, sub: (a.basedOn ? "New look \u00b7 " : "") + (a.activity ? a.activity.name : "Decoration") + " \u00b7 fidelity " + a.score + "%" });
    for (const m of st.acts) if ((m.source === "director" || m.source === "claude" || m.source === "player") && (!m.assetId || m.kind === "mechanic") && !m.project) items.push({ key: "m:" + m.id, type: m.kind === "event" ? "event" : "mechanic", obj: m, name: m.name, status: m.status, source: m.source, t: m.createdAt || 0, sub: (m.kind === "event" ? "Event" : "Activity") + (m.hostLabel ? " at " + m.hostLabel : "") });
    for (const p of st.projects) items.push({ key: "p:" + p.id, type: "project", obj: p, name: p.name, status: p.status, source: p.source, t: p.createdAt, sub: "Building near " + p.islandName + " \u00b7 " + (p.done ? "finished" : p.next + "/" + p.blocks.length + " blocks") });
    for (const kind in TB.KIT) {
      const K = TB.KIT[kind], ck = App.kitChecks[kind];
      items.push({ key: "k:" + kind, type: "kit", obj: { kind, createdAt: 0 }, name: K.name, status: App.kitStatus(kind), source: "claude", t: -1,
        sub: "World kit \u00b7 " + K.group + (K.variants.length > 1 ? " \u00b7 " + K.variants.length + " versions" : "") + (ck ? " \u00b7 fidelity " + ck.score + "%" : "") });
    }
    const rank = { pending: 0, auto: 1, approved: 2, starter: 3, rejected: 4 };
    items.sort((a, b) => (rank[a.status] ?? 5) - (rank[b.status] ?? 5) || b.t - a.t);
    // one row per design: copies with the same name are reviewed together, so nothing is approved twice
    const heads = new Map(), out = [];
    for (const i of items) {
      if (i.type === "kit") { out.push(i); continue; }
      const g = (i.type === "event" ? "mechanic" : i.type) + ":" + i.name, h = heads.get(g);
      if (!h) { i.members = [i]; heads.set(g, i); out.push(i); continue; }
      h.members.push(i);
    }
    for (const h of heads.values()) if (h.members.length > 1) h.sub += " \u00b7 " + h.members.length + (h.type === "project" ? " built" : " copies, reviewed as one");
    return out;
  }
  function renderReview(force) {
    const items = reviewItems();
    const sig = items.map((i) => i.key + i.status + (i.type === "project" ? i.obj.next : "") + (i.type === "kit" && App.kitChecks[i.obj.kind] ? "c" : "")).join("|") + ui.review + "|" + JSON.stringify(ui.kitV || {});
    if (!force && sig === ui.sigReview) return;
    ui.sigReview = sig;
    $("reviewList").innerHTML = items.map((i) => '<button class="ritem" data-key="' + i.key + '" aria-current="' + (i.key === ui.review) + '"><span class="t">' + esc(i.name) + "</span><span>" + chip(i.status) + '</span><span class="s">' + esc(sourceLabel[i.source] || i.source) + " \u00b7 " + esc(i.sub) + "</span></button>").join("") || '<p class="note">Nothing yet. The Director starts designing once it spots a need.</p>';
    const cur = items.find((i) => i.key === ui.review) || items.find((i) => i.status === "pending" || i.status === "auto");
    if (cur && !ui.review) ui.review = cur.key;
    $("reviewDetail").innerHTML = cur ? detailHTML(cur) : "";
    const slot = document.getElementById("pvSlot");
    if (slot && cur && cur.type === "asset") { slot.appendChild(preview.canvas); preview.show(cur.obj); }
    else if (slot && cur && cur.type === "kit") {
      slot.appendChild(preview.canvas);
      const kind = cur.obj.kind, v = kitVariant(kind);
      App.kitMesh(kind, v).then((m) => { if (ui.review === cur.key) preview.show({ id: "kit:" + kind + ":" + v, md: m.md, _geo: m.geo }); });
    } else preview.hide();
  }
  function checksHTML(list) { return '<div class="checks">' + (list || []).map((c) => '<div class="check"><span class="dot ' + c.status + '"></span><div><b>' + esc(c.label) + "</b><span>" + esc(c.detail) + "</span></div></div>").join("") + "</div>"; }
  function needsText(n) { return App.NEEDS.filter((k) => n[k]).map((k) => App.NEED_LABEL[k] + " " + (n[k] > 0 ? "+" : "") + n[k]).join(", ") || "none"; }
  function actionButtons(i) {
    const s = i.status;
    let h = '<div class="row">';
    if (s === "pending" || s === "auto") h += '<button class="btn primary" data-rv="approve">Approve</button><button class="btn danger" data-rv="reject">Reject</button>';
    else if (s === "approved" || s === "starter") h += '<button class="btn danger" data-rv="reject">Withdraw</button>';
    else if (s === "rejected") h += '<button class="btn" data-rv="restore">Restore for review</button>';
    if (i.type === "asset" && st.props.some((p) => p.assetId === i.obj.id)) h += '<button class="btn" data-rv="show">Show me</button>';
    if (i.type === "project") h += '<button class="btn" data-rv="showp">Show me</button>';
    return h + "</div>";
  }
  function kitVariant(kind) { const K = TB.KIT[kind]; return K.variants.includes(ui.kitV && ui.kitV[kind]) ? ui.kitV[kind] : K.variants[0]; }
  const KIT_USE = {
    Landscape: "Grows across the map in forests and as lone trees; Tickles rest in the shade of the big ones.",
    Village: "Every village is built from these: a house for each Tickle with its clan's colour on the roof, a town hall flying the clan banner, and a granary that holds the village food.",
    Farming: "The village farm: crops for the fields, and the fences, pig shed, feed trough and hen house of the pens.",
    Animals: "Lives around the villages and in the wild. None of them is one of the nine Tickle species.",
    Dragons: "The common enemy: dragons sleep on the high peaks and raid villages at night, and Tickles of every clan come together to drive them off.",
    Creatures: "Invented fantasy creatures that live wild in their habitats; Tickles tame them, walk with them and battle with them at the region arenas.",
    Dungeons: "The caves where parties of adventurers go down for treasure, and the monsters that guard their mouths.",
  };
  function kitDetail(i) {
    const kind = i.obj.kind, K = TB.KIT[kind], ck = App.kitChecks[kind], v = kitVariant(kind);
    const head = '<div class="row" style="justify-content:space-between"><h2>' + esc(K.name) + '</h2><div class="row">' + chip(i.status) + srcChip("claude") + "</div></div>";
    let h = '<div class="card">' + head + '<p class="note">World kit \u00b7 ' + esc(K.group) + ". Designed by Claude in the collection's stroke format and palette. " + esc(KIT_USE[K.group] || "") + "</p>";
    if (i.status === "auto") h += '<p class="note">It is already in the world. Approve it to keep it, or reject it to take it off the map.</p>';
    if (i.status === "rejected") h += '<p class="note">Rejected: it is off the map until you restore it.</p>';
    if (K.variants.length > 1) h += '<div class="row">' + K.variants.map((x) => '<button class="btn' + (x === v ? " primary" : "") + '" data-kitv="' + x + '">' + esc(K.variantLabel ? K.variantLabel(x) : "Version " + (x + 1)) + "</button>").join("") + "</div>";
    h += '<div id="pvSlot"></div>';
    if (ck) h += '<div class="row" style="justify-content:space-between"><div><div class="score">' + ck.score + '%</div><div class="note">fidelity to the collection</div></div><div class="note" style="text-align:right">' + ck.strokes + " strokes<br>" + ck.voxels + " voxels</div></div><h3>Model checks</h3>" + checksHTML(ck.checks);
    else h += '<p class="note">Running the model checks\u2026</p>';
    h += '<div class="row">';
    if (i.status === "auto") h += '<button class="btn primary" data-rv="approve">Approve</button><button class="btn danger" data-rv="reject">Reject</button>';
    else if (i.status === "approved") h += '<button class="btn danger" data-rv="reject">Withdraw</button>';
    else h += '<button class="btn" data-rv="restore">Restore for review</button>';
    h += '<button class="btn sea" data-rv="onchain">See it in the on-chain viewer</button></div>';
    h += '<details><summary class="note">Stroke data (what would go on-chain)</summary><pre class="json">' + esc(JSON.stringify(K.build(v), null, 0).replace(/\},\{/g, "},\n{")) + "</pre></details></div>";
    return h;
  }
  function detailHTML(i) {
    if (i.type === "kit") return kitDetail(i);
    const o = i.obj;
    const head = '<div class="row" style="justify-content:space-between"><h2>' + esc(i.name) + '</h2><div class="row">' + chip(i.status) + srcChip(i.source) + "</div></div>";
    const meta = '<p class="note">Made ' + when(o.createdAt || 0).replace("<br>", " \u00b7 ") + (o.brief || o.why ? " \u00b7 Why: " + esc(o.brief || o.why) : "") + "</p>";
    const explain = i.status === "auto" ? '<p class="note">The Director placed this on its own because it passed the checks. Approve it to add it to the Library, or reject it to remove it.</p>'
      : i.status === "pending" ? '<p class="note">This is not in the world yet. Approving it puts it there.</p>' : "";
    if (i.type === "asset") {
      return '<div class="card">' + head + meta + (o.basedOn ? '<p class="note"><b>Based on:</b> ' + esc(o.basedOn) + "</p>" : "") + explain + '<div id="pvSlot"></div>' +
        '<div class="row" style="justify-content:space-between"><div><div class="score">' + o.score + '%</div><div class="note">fidelity to the collection</div></div><div class="note" style="text-align:right">' + o.strokes.length + " strokes<br>" + o.voxels + " voxels</div></div>" +
        "<h3>Model checks</h3>" + checksHTML(o.checks) +
        (o.activity ? "<h3>Activity it unlocks</h3><p><b>" + esc(o.activity.name) + '</b> <span class="note">\u00b7 ' + esc(needsText(o.activity.needs)) + " \u00b7 " + o.activity.capacity + " at once \u00b7 " + o.activity.minutes + " min</span></p>" + checksHTML(o.actChecks) : "") +
        (o.purpose ? '<p class="note">' + esc(o.purpose) + "</p>" : "") + actionButtons(i) +
        '<details><summary class="note">Stroke data (what would go on-chain)</summary><pre class="json">' + esc(JSON.stringify(o.strokes.slice(0, 60), null, 0).replace(/\},\{/g, "},\n{")) + "</pre></details></div>";
    }
    if (i.type === "mechanic" || i.type === "event") {
      return '<div class="card">' + head + meta + explain + "<p><b>" + esc(o.name) + '</b> <span class="note">\u00b7 ' + esc(needsText(o.needs)) + " \u00b7 " + o.capacity + " at once \u00b7 " + o.minutes + " min" + (o.hostLabel ? " \u00b7 at " + esc(o.hostLabel) : "") + "</span></p>" +
        "<h3>Balance checks</h3>" + checksHTML(o.checks) + (o.uses ? '<p class="note">Used ' + o.uses + " times so far.</p>" : "") + actionButtons(i) + "</div>";
    }
    return '<div class="card">' + head + meta + explain + "<p>" + o.blocks.length + " blocks \u00b7 " + (o.done ? "finished" : o.next + " placed so far") + "</p>" +
      '<div class="progress"><i style="width:' + Math.round((o.next / o.blocks.length) * 100) + '%"></i></div><p class="note">Tickles who want fun or company come here to place blocks. When it is done it unlocks a new activity.</p>' + actionButtons(i) + "</div>";
  }
  $("tab-review").addEventListener("click", (e) => {
    const it = e.target.closest("[data-key]");
    if (it) { ui.review = it.dataset.key; renderReview(true); return; }
    const kv = e.target.closest("[data-kitv]");
    if (kv) { const item = reviewItems().find((x) => x.key === ui.review); if (item) { ui.kitV = Object.assign({}, ui.kitV, { [item.obj.kind]: +kv.dataset.kitv }); renderReview(true); } return; }
    const b = e.target.closest("[data-rv]");
    if (!b) return;
    const item = reviewItems().find((x) => x.key === ui.review);
    if (!item) return;
    reviewAction(item, b.dataset.rv);
    renderReview(true);
  });
  // a design and every copy of it share one decision; the log tells it once
  function reviewAction(item, what) {
    const ms = item.members || [item];
    reviewOne(ms[0], what);
    if (ms.length < 2 || !["approve", "reject", "restore"].includes(what)) return;
    const log = App.log;
    App.log = () => {};
    try { for (const m of ms.slice(1)) reviewOne(m, what); } finally { App.log = log; }
    App.save();
  }
  App.reviewOne = (item, what) => reviewOne(item, what); // the Parliament decides the Director's proposals too (parliament.js)
  function reviewOne(item, what) {
    const o = item.obj;
    if (item.type === "kit") {
      const K = TB.KIT[o.kind];
      if (what === "onchain") return openOnchainKit(o.kind, kitVariant(o.kind));
      if (what === "approve") { st.kit[o.kind] = "approved"; App.log("review", "You approved the " + K.name + ".", "It stays in the world and goes into the Library."); }
      else if (what === "reject") { st.kit[o.kind] = "rejected"; App.log("review", "You rejected the " + K.name + ".", "It is off the map until you restore it."); }
      else if (what === "restore") st.kit[o.kind] = "auto";
      App.sceneryDirty = true;
      App.save();
      return;
    }
    if (what === "show" && item.type === "asset") { const p = st.props.find((x) => x.assetId === o.id); if (p) App.flyTo(p.x, p.z, 16); return; }
    if (what === "showp") { App.flyTo(o.site.x, o.site.z, 24); return; }
    if (item.type === "asset") {
      if (what === "approve") {
        const wasPending = o.status === "pending";
        App.activateAsset(o, "approved");
        if (wasPending && !st.props.some((p) => p.assetId === o.id)) {
          const at = o.suggestAt || { x: App.cam.target.x, z: App.cam.target.z };
          const spot = App.findSpot(at.x, at.z, 3, { nearWater: o.waterside });
          if (spot) App.placeProp(o, spot.x, spot.z);
        }
        App.log("review", "You approved " + o.name + ".", "Added to the Library" + (wasPending ? " and placed in the world." : "."));
      } else if (what === "reject") { App.rejectAsset(o); App.log("review", "You rejected " + o.name + ".", "Removed from the world."); }
      else if (what === "restore") o.status = "pending";
    } else if (item.type === "mechanic" || item.type === "event") {
      if (what === "approve") { const was = o.status; o.status = "approved"; if (item.type === "event" && was === "pending") App.startEvent(o); App.log("review", "You approved the " + o.name + (item.type === "event" ? " event." : " activity."), ""); }
      else if (what === "reject") { o.status = "rejected"; if (st.event && st.event.actId === o.id) st.event = null; for (const t of st.tickles) if (t.action && t.action.act === o) App.endAction(t); App.log("review", "You rejected " + o.name + ".", ""); }
      else if (what === "restore") o.status = "pending";
    } else if (item.type === "project") {
      if (what === "approve") { o.status = "approved"; for (const a of st.acts) if (a.project === o.id && a.status !== "rejected") a.status = "approved"; App.log("review", "You approved building the " + o.name + ".", o.done ? "" : "Tickles will start building it."); }
      else if (what === "reject") { o.status = "rejected"; for (const a of st.acts) if (a.project === o.id) a.status = "rejected"; for (const t of st.tickles) if (t.action && t.action.project === o) App.endAction(t); App.log("review", "You stopped the " + o.name + ".", "Blocks already placed stay; dig them out if you like."); }
      else if (what === "restore") o.status = "pending";
    }
    App.save();
  }

  // ---------- 3D preview ----------
  const preview = (() => {
    const canvas = document.createElement("canvas");
    canvas.id = "preview";
    let r = null, scene, cam, obj = null, ref = null, cur = null, halfW = 1, boxH = 2, refX = 0, height = 3;
    function init() {
      r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.outputEncoding = THREE.sRGBEncoding;
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x556655, 0.95));
      const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3, 6, 4); scene.add(dl);
      cam = new THREE.PerspectiveCamera(32, 2, 0.05, 100);
      const g = new THREE.CircleGeometry(1, 40); g.rotateX(-Math.PI / 2);
      const disc = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xe9cf98 })); disc.name = "disc"; scene.add(disc);
    }
    return {
      canvas,
      show(asset) {
        if (!r) init();
        if (cur === asset && obj) return;
        cur = asset;
        if (obj) scene.remove(obj);
        if (ref) scene.remove(ref);
        obj = new THREE.Group();
        const geo = App.assetGeometry(asset);
        if (geo) {
          const md = asset.md, m = App.centeredMesh(md, geo, !!asset.keepY);
          obj.add(m);
          const box = App.meshBox(md);
          halfW = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
          boxH = box.max.y - box.min.y;
        }
        scene.add(obj);
        const t = st.tickles[0];
        refX = 0;
        if (t) {
          ref = new THREE.Group();
          const m = t.pivot.clone();
          m.rotation.set(0, 0, 0); m.position.set(0, 0, 0);
          ref.add(m);
          refX = halfW + 1.4;
          ref.position.set(refX, 0, 0);
          scene.add(ref);
        }
        const disc = scene.getObjectByName("disc");
        disc.scale.setScalar(refX / 2 + halfW + 1.2);
        disc.position.x = refX / 2;
        height = Math.max(boxH, t ? t.height : 3);
      },
      hide() { cur = null; },
      frame() {
        if (!r || !cur || !canvas.isConnected || ui.tab !== "review") return;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (canvas.width !== Math.round(w * r.getPixelRatio()) || canvas.height !== Math.round(h * r.getPixelRatio())) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
        const a = 0.25 + Math.sin(performance.now() / 2600) * 0.5;
        const mid = refX / 2, span = Math.max(refX + halfW * 2 + 1, height * 1.6);
        const R = span * 1.25 + 2.5;
        cam.position.set(mid + Math.sin(a) * R, height * 0.75 + 1.2, Math.cos(a) * R);
        cam.lookAt(mid, height * 0.42, 0);
        if (obj) obj.rotation.y = performance.now() / 3000;
        r.render(scene, cam);
      },
    };
  })();

  // ---------- Library tab ----------
  function libraryData() {
    const ss = TB.styleStats();
    const firstOf = (list, key) => { const seen = new Set(); return list.filter((x) => !seen.has(key(x)) && seen.add(key(x))); };
    const assets = firstOf(st.assets.filter((a) => a.status === "approved" || a.status === "starter"), (a) => a.name);
    const mechs = firstOf(st.acts.filter((m) => m.status === "approved" && (m.source === "director" || m.source === "claude" || m.source === "player")), (m) => m.name);
    return {
      format: "tickle-strokes/0.2", generator: "Tickle Beach World prototype",
      coordinates: "SDF units, z up, ground at z = 0, a Tickle is about 480 tall",
      onchain: { contract: TB.CONTRACT, renderer: TB.RENDERER, models: ss.models, strokes: ss.strokes, palette: ss.paletteSize, seed: "keccak256(toString(tokenId) + randomKey)", randomKey: TB.RANDOM_KEY },
      kit: Object.entries(TB.FRAGMENTS).map(([k, f]) => ({ key: k, name: f.name, from: f.from, model: f.part + " #" + f.index, layers: f.pick })),
      palette: TB.paletteList().map((p) => TB.rgbHex(p.rgb)),
      assets: assets.map((a) => ({ id: a.id, name: a.name, category: a.category, basedOn: a.basedOn, activity: a.activity, strokes: a.strokes.map((s) => { const o = Object.assign({}, s); delete o._snapped; return o; }),
        provenance: { source: a.source, created: clockOf(a.createdAt).label, review: a.status === "starter" ? "approved at world creation" : "approved by a person", fidelity: a.score, checks: a.checks.map((c) => c.id + ":" + c.status) } })),
      mechanics: mechs.map((m) => ({ name: m.name, verb: m.verb, needs: m.needs, capacity: m.capacity, minutes: m.minutes, where: m.where, host: m.hostLabel || m.ground || m.scenery || null, source: m.source })),
      worldKit: Object.keys(TB.KIT).filter((k) => App.kitStatus(k) === "approved").map((k) => { const K = TB.KIT[k]; return { kind: k, name: K.name, group: K.group, source: "claude",
        review: "approved by a person", fidelity: App.kitChecks[k] ? App.kitChecks[k].score : null,
        versions: K.variants.map((v) => ({ label: K.variantLabel ? K.variantLabel(v) : "version " + (v + 1), strokes: K.build(v) })) }; }),
    };
  }
  function renderLibrary(force) {
    const data = libraryData();
    const sig = data.assets.length + "|" + data.mechanics.length + "|" + st.assets.length + "|" + Object.keys(TB.KIT).map((k) => App.kitStatus(k)).join(",");
    if (!force && sig === ui.sigLib) return;
    ui.sigLib = sig;
    const ss = TB.styleStats();
    $("libraryBody").innerHTML =
      '<div class="card"><h2>The verified library</h2><p class="note">Everything here keeps the on-chain stroke format and palette, so any tool that reads Tickle Beach models can render it.</p>' +
      '<div class="kv"><span class="k">On-chain base</span><span>' + ss.models + " models \u00b7 " + ss.strokes.toLocaleString() + " strokes \u00b7 " + ss.paletteSize + ' colours</span><span class="k">Approved objects</span><span>' + data.assets.length +
      '</span><span class="k">Approved activities</span><span>' + data.mechanics.length + '</span><span class="k">Waiting for review</span><span>' + reviewItems().filter((i) => i.status === "pending" || i.status === "auto").length + "</span></div></div>" +
      '<div class="card"><h3>On-chain kit</h3><p class="note">Pieces cut from the six floor models (their square slabs are dropped) decorate the map, and the Director gives them new looks with the 13 on-chain themes. The ten Ground items are personal: each Tickle keeps its own in its inventory and only brings it out to use it.</p><div class="kv">' +
      Object.values(TB.FRAGMENTS).map((f) => '<span class="k">' + esc(f.name) + "</span><span>from " + esc(f.from) + "</span>").join("") +
      '<span class="k">Personal items</span><span>' + Object.keys(App.GROUND_ACTS).join(", ") + "</span></div></div>" +
      '<div class="card"><h3>World kit</h3><p class="note">Models Claude designed for the map in the same stroke format and palette. Review each one in Review; only approved ones go into the export.</p><div class="kv">' +
      Object.keys(TB.KIT).map((k) => '<span class="k">' + esc(TB.KIT[k].name) + "</span><span>" + esc(TB.KIT[k].group) + " \u00b7 " + chip(App.kitStatus(k)) + "</span>").join("") + "</div></div>" +
      "<h3>Approved objects</h3>" + (data.assets.map((a) => '<div class="card"><div class="row" style="justify-content:space-between"><b>' + esc(a.name) + '</b><span class="pix">' + a.provenance.fidelity + "%</span></div><p class=\"note\">" + esc(sourceLabel[a.provenance.source] || a.provenance.source) + " \u00b7 " + a.strokes.length + " strokes" + (a.activity ? " \u00b7 " + esc(a.activity.name) : "") + (a.basedOn ? " \u00b7 " + esc(a.basedOn) : "") + "</p></div>").join("") || '<p class="note">Nothing approved yet. Approve designs in Review.</p>') +
      "<h3>Activities</h3>" + (data.mechanics.map((m) => '<div class="card"><b>' + esc(m.name) + '</b><p class="note">' + esc(needsText(m.needs)) + (m.host ? " \u00b7 at " + esc(m.host) : "") + "</p></div>").join("") || '<p class="note">No new activities approved yet.</p>') +
      '<div class="card"><h3>Export</h3><p class="note">The library JSON carries the stroke data, the palette, the on-chain kit recipe and where each piece came from, ready for other creators to build on.</p>' +
      '<div class="row"><button class="btn primary" id="copyLib">Copy library JSON</button><button class="btn" id="saveLib" hidden>Save as .json</button></div><p class="note" id="libNote"></p></div>' +
      '<div class="card"><h3>World</h3><div class="row"><button class="btn" id="saveNow">Save now</button><button class="btn danger" id="resetWorld">Start over</button></div><p class="note">The world saves in this browser every few seconds: your edits, designs, every Tickle\'s needs and friendships.</p></div>';
    if (downloads) $("saveLib").hidden = false;
  }
  let downloads = null;
  (async () => { try { if (window.claude && window.claude.use) downloads = await window.claude.use("downloads"); } catch (e) { downloads = null; } if (downloads && $("saveLib")) $("saveLib").hidden = false; })();
  // approve everything waiting in Review at once
  $("tab-review").addEventListener("click", (e) => {
    if (!e.target.closest("#approveAll")) return;
    const waiting = reviewItems().filter((i) => i.status === "pending" || i.status === "auto");
    for (const i of waiting) { ui.review = i.key; reviewAction(i, "approve"); }
    ui.review = null;
    $("approveNote").textContent = waiting.length ? "Approved " + waiting.length + ". To build them into the game for good (for every player and every new world), save the library in the Library tab and send the file to Claude." : "Nothing was waiting.";
    renderReview(true); refresh(true);
  });
  $("tab-library").addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "copyLib") {
      const txt = JSON.stringify(libraryData(), null, 1);
      try { await navigator.clipboard.writeText(txt); $("libNote").textContent = "Copied " + Math.round(txt.length / 1024) + " KB of JSON."; }
      catch (err) { $("libNote").textContent = "Copy was blocked here. Use Save as .json instead."; }
    }
    if (b.id === "saveLib" && downloads) {
      try { await downloads.save({ filename: "tickle-library.json", data: JSON.stringify(libraryData(), null, 1) }); $("libNote").textContent = "Saved."; }
      catch (err) { $("libNote").textContent = "The download didn't go through."; }
    }
    if (b.id === "saveNow") $("libNote").textContent = App.save() ? "Saved." : "This browser blocked saving.";
    if (b.id === "resetWorld") {
      if (b.dataset.confirm) { App.clearSave(); location.reload(); }
      else { b.dataset.confirm = "1"; b.textContent = "Click again to wipe this world"; }
    }
  });

  // ---------- refresh loop ----------
  function refresh(force) {
    if (ui.pressing && !force) return;
    if (ui.tab === "tickles") renderTickles();
    else if (ui.tab === "holders") renderHolders(force);
    else if (ui.tab === "director") renderDirector();
    else if (ui.tab === "review") renderReview(force);
    else if (ui.tab === "library") renderLibrary(force);
    else if (ui.tab === "arena") App.renderArena(force);
    const n = reviewItems().filter((i) => i.status === "pending" || i.status === "auto").length;
    const bdg = $("reviewBadge"); bdg.textContent = n; bdg.dataset.n = n;
  }
  App.refresh = refresh;

  // ---------- boot ----------
  function setLoad(frac, text) { $("loadBar").style.width = Math.round(frac * 100) + "%"; if (text) $("loadList").textContent = text; }
  const nextFrame = () => new Promise((r) => setTimeout(r, 0));
  async function boot(hot) {
    try {
      App.initBlockColors();
      fillSwatches();
      App.initThree($("world"));
      window.addEventListener("resize", App.resize);
      setLoad(0.05, "Deriving all " + TB.SUPPLY.toLocaleString() + " seeds with the contract's formula and reading their traits\u2026");
      await nextFrame();
      // the save is read first: the map keeps everyone on the plot it had them on (geo.js)
      const saved = hot && hot.v === 3 ? hot : App.loadSaved();
      App.bootSave = saved;
      App.initPopulation();
      App.bootSave = null;
      if (saved && App.migrateLayout) App.migrateLayout(saved);
      if (saved && App.reconcilePlots && App.reconcilePlots(saved)) console.info("Ownership changed since the save: places carried over to their plots");
      App.initActs();
      if (saved) {
        const merged = App.dedupeSaved(saved);
        if (merged) console.info("Review: merged " + merged + " duplicate designs");
        Object.assign(st, { T: saved.T, speed: saved.speed == null ? 1 : saved.speed, freeWill: saved.freeWill !== false, uid: saved.uid || 1, latest: saved.latest || null, event: saved.event || null, rel: saved.rel || {}, fav: saved.fav || {}, wallet: saved.wallet || null, popT: saved.T, kit: saved.kit || {} });
        Object.assign(st.director, saved.director || {});
        st.log = saved.log || [];
        st.acts.push(...(saved.acts || []));
        st.projects = saved.projects || [];
        App.savedEdits = saved.edits || {};
        if (saved.needs) App.restoreNeeds(saved.needs);
        st.raidDay = saved.raidDay; st.dragonDay = saved.dragonDay; st.shareDay = saved.shareDay;
        st.moved = saved.moved || {};
        for (const k in st.moved) { const s = App.sceneryAll[+k]; if (s) App.moveScenery(s, st.moved[k][0], st.moved[k][1]); }
      }
      App.initVillages(saved && saved.villages);
      App.initCreatures(saved && saved.creatures);
      App.initDungeons(saved && saved.dungeons);
      App.initFate(saved && saved.fate);
      App.initFactions(saved && saved.factions);
      App.initRampage(saved && saved.rampage);
      App.initLairs(saved && saved.lairs);
      App.initFaith(saved && saved.faith);
      App.initMines(saved && saved.mines);
      App.initGuilds && App.initGuilds(saved && saved.guilds);
      App.initCasinos && App.initCasinos(saved && saved.casinos);
      App.initParliament && App.initParliament(saved && saved.parliament);
      App.initContests && App.initContests(saved && saved.contests);
      App.initDiving && App.initDiving(saved && saved.diving);
      App.initSeaBeasts && App.initSeaBeasts(saved && saved.seabeasts);
      App.initWealth && App.initWealth(saved && saved.wealth);
      App.initWeather && App.initWeather(saved && saved.weather);
      // buildings moved by hand in an earlier session take their doors (and their residents) with them again
      for (const k in st.moved || {}) { const s = App.sceneryAll[+k]; if (s && s.building && App.syncBuilding) App.syncBuilding(s); }
      if (saved) st.settleDay = saved.settleDay;
      if (saved) { st.tourneyDay = saved.tourneyDay; st.creatureDay = saved.creatureDay; }
      setLoad(0.2, "Cutting the palm, umbrella, duck, waterfall, pier and campfire out of the on-chain floors\u2026");
      let fr = 0;
      await App.loadFragments(() => setLoad(0.2 + (++fr / Object.keys(TB.FRAGMENTS).length) * 0.4));
      setLoad(0.62, "Waking up the ducks and the fish, the farm animals, the deer and the dragons\u2026");
      await App.loadCritters();
      await App.loadWildlife();
      await App.loadBoats();
      await App.loadLakeLife();
      await App.loadCreatures();
      await App.loadMonsters();
      setLoad(0.7, "Laying out the circuits, the regatta courses and the stages for the contests\u2026");
      await nextFrame();
      App.prepareContests && App.prepareContests();
      App.prepareDiving && App.prepareDiving();
      App.prepareWealth && App.prepareWealth();
      // designs approved for good and baked into the game
      for (const a of (TB.APPROVED && TB.APPROVED.assets) || []) {
        if (st.assets.some((x) => x.id === a.id || x.name === a.name) || (saved && (saved.assets || []).some((x) => x.id === a.id || x.name === a.name))) continue;
        const o = Object.assign({}, a, { status: "starter", source: (a.provenance && a.provenance.source) || "director", score: (a.provenance && a.provenance.fidelity) || 100, checks: [], createdAt: 0 });
        const res = await App.job("compact", { strokes: o.strokes, voxel: 8 }); o.md = res.mesh; st.assets.push(o);
      }
      for (const [i, m] of ((TB.APPROVED && TB.APPROVED.mechanics) || []).entries()) {
        if (st.acts.some((x) => x.name === m.name)) continue;
        st.acts.push(Object.assign({ id: "baked" + i, kind: "mechanic", capacity: 6, minutes: 20, where: "self", needs: {} }, m, { status: "approved", source: m.source || "director", createdAt: 0 }));
      }
      if (saved && saved.assets) {
        setLoad(0.65, "Rebuilding designed objects\u2026");
        for (const a of saved.assets) { const res = await App.job("compact", { strokes: a.strokes, voxel: 8 }); a.md = res.mesh; st.assets.push(a); }
        for (const p of saved.props || []) { const a = App.assetById(p.assetId); if (a) App.placeProp(a, p.x, p.z, p.rot, p); }
      }
      // where to start: saved camera, the wallet's first Tickle, or token #1
      let start = null;
      if (saved && saved.cam) { start = saved.cam; Object.assign(App.cam, { radius: saved.cam.r, theta: saved.cam.theta, phi: saved.cam.phi }); }
      else {
        const id = st.wallet ? (App.tokensOf(st.wallet)[0] ?? 1) : 1;
        const v = App.villageOfToken(id);
        start = { x: v.x, z: v.z };
      }
      App.cam.target.set(start.x, App.SEA + 2, start.z);
      setLoad(0.72, "Drawing the map\u2026");
      await nextFrame();
      buildLandImage();
      setLoad(0.8, "Building the terrain around you\u2026");
      for (let i = 0; i < 40 && App.streamTerrain(8) > 0; i++) await nextFrame();
      App.updatePopulation();
      if (!saved) App.log("world", "Day 1. All " + TB.SUPPLY.toLocaleString() + " Tickles wake up in " + App.villages.length + " places across six regions, one per on-chain Location: every holder's Tickles live together, in a town, on a plot, an estate or in a fortress.", "Each Tickle has a job from its on-chain items and a daily plan: work, lunch, free time, evenings on the village square. Bridges join the regions.");
      setMode(saved ? saved.mode || "auto" : "auto", true);
      setSpeed(st.speed);
      $("freeWill").checked = st.freeWill;
      setLoad(1, "Ready.");
      $("loading").hidden = true;
      let seen = false;
      try { seen = !!localStorage.getItem("tbw-help2"); } catch (e) { /* storage blocked */ }
      if (!seen && !saved) $("helpModal").hidden = false;
      refresh(true);
      App.checkKit();
      requestAnimationFrame(frame);
      setInterval(() => refresh(false), 700);
      setInterval(() => App.save(), 20000);
      document.addEventListener("visibilitychange", () => { if (document.hidden) App.save(); });
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => App.serialize());
    } catch (e) {
      console.error(e);
      setLoad(1, "Could not start the world: " + (e && e.message ? e.message : e));
    }
  }
  let last = performance.now(), popTimer = 0, mapTimer = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  // one frame of the world; also callable on its own (App._tick) to run the world while the page is hidden
  function tick(dt) {
    App.moveCamera(dt, ui.keys);
    App.step(dt);
    if (App.cam.follow != null) {
      const t = st.tickles.find((x) => x.id === App.cam.follow);
      if (t) { App.cam.target.x += (t.pos.x - App.cam.target.x) * Math.min(1, dt * 4); App.cam.target.z += (t.pos.z - App.cam.target.z) * Math.min(1, dt * 4); }
    }
    App.streamTerrain(2);
    popTimer += dt; mapTimer += dt;
    if (popTimer > 0.4) { popTimer = 0; App.updatePopulation(); App.cullProps(); App.updateCritterSet(); App.updateWildlifeSet(); App.updateCreatureSet(); App.updateMonsterSet(); App.updateCrops(); }
    App.stepCritters(dt);
    App.stepWildlife(dt);
    App.stepCreatures(dt);
    App.stepMonsters(dt);
    App.stepHand(dt);
    App.updateBoats(dt);
    App.stepRingBeasts && App.stepRingBeasts(dt);
    App.updateLakeLife && App.updateLakeLife(dt);
    if (mapTimer > 0.5) { mapTimer = 0; drawMinimap(); }
    App.FX && App.FX.step(dt); // spells, blows and sparks, in the world and down below
    App.stepSurf && App.stepSurf(); // waves go when nobody rides them
    App.updateContests && App.updateContests(dt); // the stage, the circuit, the podium near you; the scoreboard
    App.updateDiving && App.updateDiving(dt); // what lies on the bottom at the dive sites near you
    App.updateSeaBeasts && App.updateSeaBeasts(); // a sea beast risen near you
    App.updateWealth && App.updateWealth(dt); // mounts, private boats, the Blacksmiths' Guild near you
    App.updateBirds && App.updateBirds(dt); // songbirds in the trees near you
    App.updateWeather && App.updateWeather(dt); // rain, clouds, lightning, a tornado or a tsunami near you
    App.updateFarView && App.updateFarView(); // the land, buildings and trees beyond the streamed ones, when pulled back
    App.render();
    updateOverlay();
    preview.frame();
    $("clock").textContent = clockOf(st.T).label + (st.speed === 0 ? " \u00b7 paused" : "") + (App.weatherIcon && App.weatherIcon() ? " \u00b7 " + App.weatherIcon() : "");
    if (ui.logDirty && ui.tab === "director" && !ui.pressing) { ui.logDirty = false; renderDirector(); }
  }
  App._tick = (secs, step) => { step = step || 1 / 30; for (let t = 0; t < secs; t += step) tick(step); };
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data ? hot.data : null);
})();
