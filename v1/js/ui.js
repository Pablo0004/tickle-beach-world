/* UI: boot, panels, review + preview, library export, Claude designer, tools, overlay, main loop. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NEED_COL = { hunger: "#ffb24a", energy: "#7be08f", social: "#ff8fc0", fun: "#3cc6d8" };
  const ui = (App.ui = { tab: "tickles", sel: null, review: null, tool: "select", block: 1, placeAsset: null, pressing: false, sigReview: "", sigLib: "" });

  // ---------- worker pool ----------
  const NW = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
  const workers = [], pending = new Map();
  let jid = 1, rr = 0, workerError = null;
  for (let i = 0; i < NW; i++) {
    const w = new Worker("js/worker.js");
    w.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok) p.res(e.data.out); else p.rej(new Error(e.data.error));
    };
    w.onerror = (e) => { workerError = e.message || "worker failed to load"; for (const [, p] of pending) p.rej(new Error(workerError)); pending.clear(); };
    workers.push(w);
  }
  App.job = (type, payload) => new Promise((res, rej) => {
    if (workerError) return rej(new Error(workerError));
    const id = jid++;
    pending.set(id, { res, rej });
    workers[rr++ % NW].postMessage(Object.assign({ id, type }, payload));
  });

  // on-chain trait names for every model, read from tokenURI() of the bundled tokens
  App.MODEL_NAMES = {};
  for (const [, seed, traits] of TB.TOKENS) {
    const p = TB.pickTraits(seed);
    for (const slot of TB.SLOTS) if (p.sel[slot] !== undefined) App.MODEL_NAMES[slot + ":" + p.sel[slot]] = traits[TB.SLOT_LABEL[slot]];
  }

  App.toast = (msg) => {
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 4200);
  };

  const clockOf = (T) => App.clock(T);
  const when = (T) => { const c = clockOf(T); return "Day " + c.day + "<br>" + c.short; };
  const statusLabel = { pending: "Needs review", auto: "Unreviewed", approved: "Approved", rejected: "Rejected", starter: "Approved", discarded: "Discarded", core: "Built in" };
  const sourceLabel = { director: "Director", claude: "Claude", player: "You", onchain: "On-chain", core: "Built in" };
  const chip = (status) => '<span class="chip ' + status + '">' + (statusLabel[status] || status) + "</span>";
  const srcChip = (src) => '<span class="chip ' + (src === "claude" ? "claude" : "") + '">' + (sourceLabel[src] || src) + "</span>";

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
    for (const t of ["tickles", "director", "review", "library"]) $("tab-" + t).hidden = t !== tab;
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
      App.log("world", m === "auto" ? "You handed the island to the Director." : "You took control. The Director will only suggest when you ask.", "");
      App.toast(m === "auto" ? "The Director runs the island" : "You're in control");
    }
    refresh(true);
  }
  document.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => setSpeed(+b.dataset.speed)));
  function setSpeed(v) {
    st.speed = v;
    document.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.speed === v)));
  }
  $("freeWill").onchange = (e) => { st.freeWill = e.target.checked; App.log("world", st.freeWill ? "Free will on: Tickles look after themselves." : "Free will off: Tickles only do what you tell them.", ""); };
  $("helpBtn").onclick = () => { $("helpModal").hidden = false; };
  $("helpClose").onclick = () => { $("helpModal").hidden = true; try { localStorage.setItem("tbw-help", "1"); } catch (e) { /* storage blocked */ } };
  $("panel").addEventListener("pointerdown", () => { ui.pressing = true; });
  window.addEventListener("pointerup", () => { ui.pressing = false; });

  // ---------- dock ----------
  document.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
  const HINTS = { select: "Click a Tickle or an object to inspect it.", order: "Select a Tickle, then click the ground to send it, another Tickle to chat, or an object to use it.",
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
    for (const k of [1, 2, 4, 5, 6, 7, 8, 9, 10, 13, 11]) {
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
    const r = App.rayFrom(ndc);
    let hit = null, hd = Infinity;
    for (const t of st.tickles) {
      const box = new THREE.Box3(new THREE.Vector3(t.pos.x - 0.65, t.pos.y, t.pos.z - 0.65), new THREE.Vector3(t.pos.x + 0.65, t.pos.y + t.height, t.pos.z + 0.65));
      if (r.intersectBox(box, tmpV)) { const d = tmpV.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "tickle", t }; } }
    }
    for (const p of st.props) {
      const y = p.group.position.y;
      const box = new THREE.Box3(new THREE.Vector3(p.x - p.rad, y, p.z - p.rad), new THREE.Vector3(p.x + p.rad, y + p.height, p.z + p.rad));
      if (r.intersectBox(box, tmpV)) { const d = tmpV.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "prop", p }; } }
    }
    const v = App.pickVoxel(r);
    if (v) { const d = v.point.distanceTo(r.origin); if (d < hd) { hd = d; hit = { type: "voxel", v }; } }
    if (!hit) { const w = App.pickWater(r); if (w) hit = { type: "water", point: w }; }
    const manual = st.mode === "manual";
    const selT = st.tickles.find((t) => t.id === ui.sel);
    if (manual && ui.tool === "build" && hit && hit.type === "voxel") {
      const { x, y, z, n } = hit.v, nx = x + n[0], ny = y + n[1], nz = z + n[2];
      if (App.getBlock(nx, ny, nz) === 0 && ny < App.H - 1) { App.setBlock(nx, ny, nz, ui.block); scheduleSpots(); }
      return;
    }
    if (manual && ui.tool === "dig" && hit && hit.type === "voxel") {
      if (hit.v.y > 0) { App.setBlock(hit.v.x, hit.v.y, hit.v.z, 0); scheduleSpots(); }
      return;
    }
    if (manual && ui.tool === "place" && hit && (hit.type === "voxel" || hit.type === "prop")) {
      const asset = App.assetById(ui.placeAsset);
      const pt = hit.type === "voxel" ? hit.v.point : new THREE.Vector3(hit.p.x + hit.p.rad + 1.5, 0, hit.p.z);
      if (!asset) { App.toast("Approve an object in Review first."); return; }
      if (!App.isLand(pt.x, pt.z)) { App.toast("Objects need dry land."); return; }
      App.placeProp(asset, pt.x, pt.z);
      App.log("review", "You placed " + asset.name + ".", "");
      return;
    }
    if (manual && ui.tool === "order" && selT && hit) {
      if (hit.type === "tickle" && hit.t !== selT) { App.order(selT, { kind: "chat", partner: hit.t }); App.say(selT, "Hey " + hit.t.traits.Character + "!", 3); return; }
      if (hit.type === "prop") { App.order(selT, { kind: "prop", prop: hit.p }); return; }
      if (hit.type === "voxel") { App.order(selT, { kind: "goto", spot: { x: hit.v.point.x, z: hit.v.point.z } }); App.say(selT, "On my way!", 2); return; }
    }
    if (hit && hit.type === "tickle") { selectTickle(hit.t.id); return; }
    if (hit && hit.type === "prop") {
      const a = App.assetById(hit.p.assetId);
      if (a) { ui.review = "a:" + a.id; setTab("review"); }
      return;
    }
    if (ui.tool === "select") { ui.sel = null; refresh(true); }
  };
  let spotsTimer = 0;
  function scheduleSpots() { clearTimeout(spotsTimer); spotsTimer = setTimeout(() => App.computeSpots(), 400); }
  function selectTickle(id) {
    ui.sel = id;
    if (ui.tab !== "tickles") setTab("tickles"); else refresh(true);
  }

  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
    if (e.code === "Space") { e.preventDefault(); setSpeed(st.speed ? 0 : 1); }
    else if (e.key === "1") setSpeed(1); else if (e.key === "2") setSpeed(4); else if (e.key === "3") setSpeed(12);
    else if (e.key === "f" || e.key === "F") { if (ui.sel) App.cam.follow = ui.sel; }
    else if (e.key === "Escape") { ui.sel = null; App.cam.follow = null; $("onchainModal").hidden = true; $("helpModal").hidden = true; refresh(true); }
  });

  // ---------- overlay ----------
  const overlay = $("overlay");
  let ring = null;
  function updateOverlay() {
    const camPos = App.camera.position;
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
      const vis = !p.behind && dist < 110;
      t.tagEl.hidden = !vis;
      if (vis) {
        t.tagEl.style.left = p.x + "px"; t.tagEl.style.top = p.y + "px";
        t.tagEl.style.opacity = String(Math.max(0.35, Math.min(1, 1.6 - dist / 70)));
        t.tagEl.classList.toggle("sel", t.id === ui.sel);
        const mood = (t.needs.hunger + t.needs.energy + t.needs.social + t.needs.fun) / 4;
        t.tagEl.querySelector(".m").style.background = mood > 60 ? "#7be08f" : mood > 35 ? "#ffd23f" : "#ff7b6b";
      }
      const showB = vis && t.bubble && st.T < t.bubble.until && dist < 75;
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

  // ---------- Tickles tab ----------
  function actionText(t) {
    const a = t.action;
    if (!a) return "Thinking\u2026";
    if (a.kind === "idle") return a.order ? "Waiting for orders" : "Hanging around";
    if (a.kind === "goto") return "Walking where you sent them";
    if (a.chat) return (a.phase === "doing" ? "Chatting with " : "Going to chat with ") + (a.partner ? a.partner.name : "a friend");
    if (a.phase === "walk") return "Heading to: " + a.act.name;
    return a.act.verb ? a.act.verb.replace(/^is /, "").replace(/^./, (c) => c.toUpperCase()) : a.act.name;
  }
  function needsHTML(t) {
    return '<div class="needs">' + App.NEEDS.map((k) => {
      const v = Math.round(t.needs[k]);
      return '<span>' + App.NEED_LABEL[k] + '</span><div class="bar"><i style="width:' + v + "%;background:" + NEED_COL[k] + '"></i></div><span class="num">' + v + "%</span>";
    }).join("") + "</div>";
  }
  function renderTickles(force) {
    const t = st.tickles.find((x) => x.id === ui.sel);
    const det = $("tickleDetail");
    if (t) {
      const ok = t.verified.filter((v) => v.match).length;
      const friends = Object.entries(t.rel).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, v]) => {
        const o = st.tickles.find((x) => x.id === +id);
        return o ? "<div>" + esc(o.name) + ' <span class="note">\u00b7 ' + App.relLabel(v) + "</span></div>" : "";
      }).join("") || '<p class="note">No friends yet.</p>';
      const favId = Object.entries(t.fav).sort((a, b) => b[1] - a[1])[0];
      const fav = favId ? (App.actById(favId[0]) || { name: favId[0].replace(/^hold_/, "") }).name : "\u2014";
      const manual = st.mode === "manual";
      det.innerHTML = '<div class="card">' +
        '<div class="row" style="justify-content:space-between"><div class="row"><span class="sw" style="background:' + t.swatch + '"></span><h2>' + esc(t.name) + "</h2></div>" +
        '<div class="row"><button class="btn" data-act="follow">' + (App.cam.follow === t.id ? "Following" : "Follow") + '</button><button class="btn" data-act="close" aria-label="Close">\u2715</button></div></div>' +
        '<p class="note">Lives at ' + esc(t.traits.Location) + " \u00b7 " + esc(actionText(t)) + "</p>" + needsHTML(t) +
        (manual ? '<h3>Orders</h3><div class="row">' +
          '<button class="btn" data-order="hunger">Eat</button><button class="btn" data-order="energy">Rest</button><button class="btn" data-order="fun">Have fun</button><button class="btn" data-order="social">Socialise</button><button class="btn" data-order="home">Go home</button></div>' +
          '<p class="note">Or choose "Give orders" in the dock and click the world.</p>' : "") +
        "<h3>On-chain identity \u00b7 token #" + t.id + "</h3>" +
        '<div class="traits">' + t.verified.map((v) => '<span class="k">' + esc(v.slot) + "</span><span>" + esc(v.chain) + '</span><span class="' + (v.match ? "ok" : "no") + '">' + (v.match ? "\u2713" : "\u2717") + "</span>").join("") + "</div>" +
        '<p class="note"><span class="' + (ok === 9 ? "ok" : "no") + '">' + ok + " of 9</span> traits decoded from the contract's models match its tokenURI(). Its body and home were voxelized from the same on-chain strokes.</p>" +
        '<div class="row"><button class="btn sea" data-act="onchain">See the on-chain render</button></div>' +
        "<h3>Friends</h3>" + friends +
        '<div class="kv"><span class="k">Favourite</span><span>' + esc(fav) + '</span><span class="k">Holding</span><span>' + esc(t.holding || "Nothing") + '</span><span class="k">Ground item</span><span>' + esc(t.ground || "None") + "</span></div>" +
        "</div>";
    } else det.innerHTML = "";
    $("islandersTitle").textContent = "Islanders (" + st.tickles.length + ")";
    $("tickleList").innerHTML = st.tickles.map((x) => {
      const bars = App.NEEDS.map((k) => '<i style="height:' + Math.max(2, Math.round(x.needs[k] / 100 * 22)) + "px;background:" + NEED_COL[k] + '" title="' + App.NEED_LABEL[k] + " " + Math.round(x.needs[k]) + '%"></i>').join("");
      return '<button class="trow" data-tid="' + x.id + '" aria-current="' + (x.id === ui.sel) + '"><span class="sw" style="background:' + x.swatch + '"></span><span style="min-width:0"><div class="tname">' + esc(x.name) + '</div><div class="tact">' + esc(actionText(x)) + '</div></span><span class="mini">' + bars + "</span></button>";
    }).join("");
    // invite list
    const sel = $("inviteSel");
    if (force || !sel.options.length) {
      const used = new Set(st.tickles.map((x) => x.id));
      const free = TB.TOKENS.filter((r) => !used.has(r[0]));
      sel.innerHTML = free.map((r) => '<option value="' + r[0] + '">' + esc((r[2].Character || "Tickle") + " #" + r[0]) + "</option>").join("");
      $("inviteBtn").disabled = !free.length || !App.plots.some((p) => !p.used);
    }
  }
  $("tab-tickles").addEventListener("click", (e) => {
    const row = e.target.closest("[data-tid]");
    if (row) { selectTickle(+row.dataset.tid); const t = st.tickles.find((x) => x.id === +row.dataset.tid); if (t) { App.cam.target.set(t.pos.x, t.pos.y + 1, t.pos.z); App.cam.radius = Math.min(App.cam.radius, 30); } return; }
    const t = st.tickles.find((x) => x.id === ui.sel);
    const b = e.target.closest("button");
    if (!b || !t) return;
    if (b.dataset.act === "close") { ui.sel = null; App.cam.follow = null; refresh(true); }
    if (b.dataset.act === "follow") { App.cam.follow = App.cam.follow === t.id ? null : t.id; refresh(true); }
    if (b.dataset.act === "onchain") openOnchain(t);
    if (b.dataset.order) { App.order(t, b.dataset.order === "home" ? { kind: "home" } : { kind: "need", need: b.dataset.order }); refresh(true); }
  });
  $("inviteBtn").onclick = async () => {
    const id = +$("inviteSel").value;
    const row = TB.TOKENS.find((r) => r[0] === id);
    const plot = App.plots.find((p) => !p.used);
    if (!row || !plot) return;
    $("inviteBtn").disabled = true;
    App.toast("Building " + (row[2].Character || "Tickle") + " #" + id + " from the chain\u2026");
    try {
      const t = await App.addTickle(row, plot);
      App.log("world", t.name + " moved to the island.", "Invited by you. Home: " + t.traits.Location + ".");
      selectTickle(t.id);
    } catch (e) { App.toast("Could not build that Tickle: " + e.message); }
    refresh(true);
  };
  function openOnchain(t) {
    $("onchainTitle").textContent = "On-chain render \u00b7 " + t.name;
    $("onchainNote").textContent = "This frame runs the exact HTML that htmlForToken() returns from contract " + TB.CONTRACT.slice(0, 6) + "\u2026" + TB.CONTRACT.slice(-4) + ", with token #" + t.id + "'s seed. Drag inside it to orbit. Compare it with the island version.";
    $("onchainModal").hidden = false;
    const frame = $("onchainFrame");
    const load = onchainHTML || fetch("onchain-tickle.html").then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
    onchainHTML = load;
    load.then((html) => {
      // same bytes htmlForToken() returns; only the seed line changes
      frame.removeAttribute("src");
      frame.srcdoc = html.replace(/window\.seed="\d+"/, 'window.seed="' + t.seed + '"');
    }).catch(() => { onchainHTML = null; frame.src = "onchain-tickle.html?seed=" + encodeURIComponent(t.seed); });
  }
  let onchainHTML = null;
  $("onchainClose").onclick = () => { $("onchainModal").hidden = true; const f = $("onchainFrame"); f.removeAttribute("srcdoc"); f.src = "about:blank"; };

  // ---------- Director tab ----------
  function renderDirector() {
    const auto = st.mode === "auto";
    const nextIn = Math.max(0, Math.round(st.director.next - st.T));
    $("dirStatus").innerHTML = "<h2>" + (auto ? "The Director is running the island" : "You're in control") + "</h2><p class=\"note\">" +
      (auto ? "It checks the Tickles' needs every few game hours and designs objects, activities, buildings and events. Next check in " + Math.floor(nextIn / 60) + "h " + (nextIn % 60) + "m of game time."
        : "The Director is paused. Ask it for a suggestion and it lands in Review, waiting for your approval.") + "</p>";
    const d = App.diagnose();
    $("diag").innerHTML = App.NEEDS.map((k) => '<span>' + App.NEED_LABEL[k] + '</span><div class="bar"><i style="width:' + Math.round(d[k].avg) + "%;background:" + NEED_COL[k] + '"></i></div><span class="num">' + Math.round(d[k].avg) + "% \u00b7 " + Math.round(d[k].supply) + " spots</span>").join("");
    $("runDirector").textContent = auto ? "Run the Director now" : "Ask the Director for a suggestion";
    $("growIsland").hidden = !auto && false;
    const items = st.log.slice(0, 70).map((e) => '<div class="entry"><div class="when">' + when(e.t) + '</div><div><div class="kind k-' + e.kind + '">' + esc(e.kind) + "</div><div>" + esc(e.text) + "</div>" + (e.why ? '<div class="why">' + esc(e.why) + "</div>" : "") + "</div></div>").join("");
    $("log").innerHTML = items || '<p class="note">Nothing yet.</p>';
  }
  $("runDirector").onclick = async () => {
    $("runDirector").disabled = true;
    const res = await App.directorRun({ apply: st.mode === "auto", manualAsk: true, force: st.mode === "manual" ? null : null });
    $("runDirector").disabled = false;
    if (res && st.mode === "manual") { ui.review = keyOf(res); App.toast("Suggestion ready in Review"); }
    refresh(true);
  };
  $("growIsland").onclick = () => {
    const n = App.expandIsland(40);
    App.log("world", (st.mode === "auto" ? "Director" : "You") + " grew the island by " + n + " sand blocks.", "More beach for swimming and sunbathing.");
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
    const objects = [...new Set(st.props.map((p) => (App.assetById(p.assetId) || {}).name).filter(Boolean))].join(", ") || "none yet";
    const grounds = [...new Set(st.tickles.map((t) => t.ground).filter(Boolean))].join(", ");
    return [
      "You design objects for Tickle Beach World, a voxel life-sim built on the Tickle Beach NFT collection. Every model in the collection is stored on Ethereum as a list of SDF strokes: signed-distance primitives that are smoothly unioned, carved, or used to repaint colour. Design ONE new beach object for the Tickles in exactly this format, plus the activity it unlocks.",
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
      "TWO REAL ON-CHAIN MODELS IN THIS FORMAT",
      "Cooler (a ground item): " + ex("ground", 1),
      "Chair (a ground item): " + ex("ground", 3),
      "",
      "THE ISLAND RIGHT NOW: " + st.tickles.length + " Tickles. Average needs: " + App.needsLine(d) + ". Objects already here: " + objects + ". Tickles' own ground items: " + grounds + ".",
      "BRIEF: " + (brief || "Design whatever would help the island's lowest need the most."),
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
      const design = { name: data.name, purpose: data.purpose, category: data.category, activity: data.activity, strokes: data.strokes, brief: brief || "Fix the biggest need" };
      const asset = await App.createAsset(design, "claude");
      if (st.mode === "auto" && asset.passes) {
        const spot = App.findSpot((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        if (spot) App.placeProp(asset, spot.x, spot.z);
        App.activateAsset(asset, "auto");
        App.log("claude", "Claude designed " + asset.name + " and it passed the checks (" + asset.score + "%), so it's on the island.", asset.purpose || "");
      } else {
        asset.status = "pending";
        asset.suggestAt = { x: 0, z: 0 };
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
  function keyOf(x) {
    if (!x) return null;
    if (x.strokes) return "a:" + x.id;
    if (x.blocks) return "p:" + x.id;
    return "m:" + x.id;
  }
  function reviewItems() {
    const items = [];
    for (const a of st.assets) if (a.status !== "discarded") items.push({ key: "a:" + a.id, type: "asset", obj: a, name: a.name, status: a.status, source: a.source, t: a.createdAt, sub: (a.activity ? a.activity.name : "Decoration") + " \u00b7 fidelity " + a.score + "%" });
    for (const m of st.acts) if (m.source === "director" || m.source === "claude" || m.source === "player") if (!m.assetId || m.kind === "mechanic") if (!m.project) items.push({ key: "m:" + m.id, type: m.kind === "event" ? "event" : "mechanic", obj: m, name: m.name, status: m.status, source: m.source, t: m.createdAt || 0, sub: (m.kind === "event" ? "Event" : "Activity") + (m.hostLabel ? " at " + m.hostLabel : "") });
    for (const p of st.projects) items.push({ key: "p:" + p.id, type: "project", obj: p, name: p.name, status: p.status, source: p.source, t: p.createdAt, sub: "Building \u00b7 " + (p.done ? "finished" : p.next + "/" + p.blocks.length + " blocks") });
    const rank = { pending: 0, auto: 1, approved: 2, starter: 3, rejected: 4 };
    items.sort((a, b) => (rank[a.status] ?? 5) - (rank[b.status] ?? 5) || b.t - a.t);
    return items;
  }
  function renderReview(force) {
    const items = reviewItems();
    const sig = items.map((i) => i.key + i.status + (i.type === "project" ? i.obj.next : "")).join("|") + ui.review;
    if (!force && sig === ui.sigReview) return;
    ui.sigReview = sig;
    $("reviewList").innerHTML = items.map((i) => '<button class="ritem" data-key="' + i.key + '" aria-current="' + (i.key === ui.review) + '"><span class="t">' + esc(i.name) + "</span><span>" + chip(i.status) + "</span><span class=\"s\">" + esc(sourceLabel[i.source] || i.source) + " \u00b7 " + esc(i.sub) + "</span></button>").join("") || '<p class="note">Nothing yet. The Director starts designing once it spots a need.</p>';
    const cur = items.find((i) => i.key === ui.review) || items.find((i) => i.status === "pending" || i.status === "auto");
    if (cur && !ui.review) ui.review = cur.key;
    $("reviewDetail").innerHTML = cur ? detailHTML(cur) : "";
    const slot = document.getElementById("pvSlot");
    if (slot && cur && cur.type === "asset") { slot.appendChild(preview.canvas); preview.show(cur.obj); } else preview.hide();
  }
  function checksHTML(list) {
    return '<div class="checks">' + (list || []).map((c) => '<div class="check"><span class="dot ' + c.status + '"></span><div><b>' + esc(c.label) + "</b><span>" + esc(c.detail) + "</span></div></div>").join("") + "</div>";
  }
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
  function detailHTML(i) {
    const o = i.obj;
    const head = '<div class="row" style="justify-content:space-between"><h2>' + esc(i.name) + '</h2><div class="row">' + chip(i.status) + srcChip(i.source) + "</div></div>";
    const meta = '<p class="note">Made ' + when(o.createdAt || 0).replace("<br>", " \u00b7 ") + (o.brief || o.why ? " \u00b7 Why: " + esc(o.brief || o.why) : "") + "</p>";
    const explain = i.status === "auto" ? '<p class="note">The Director placed this on its own because it passed the checks. Approve it to add it to the Library, or reject it to remove it.</p>'
      : i.status === "pending" ? '<p class="note">This is not in the world yet. Approving it puts it there.</p>' : "";
    if (i.type === "asset") {
      return '<div class="card">' + head + meta + explain + '<div id="pvSlot"></div>' +
        '<div class="row" style="justify-content:space-between"><div><div class="score">' + o.score + '%</div><div class="note">fidelity to the collection</div></div><div class="note" style="text-align:right">' + o.strokes.length + " strokes<br>" + o.voxels + " voxels</div></div>" +
        "<h3>Model checks</h3>" + checksHTML(o.checks) +
        (o.activity ? "<h3>Activity it unlocks</h3><p><b>" + esc(o.activity.name) + '</b> <span class="note">\u00b7 ' + esc(needsText(o.activity.needs)) + " \u00b7 " + o.activity.capacity + " at once \u00b7 " + o.activity.minutes + " min</span></p>" + checksHTML(o.actChecks) : "") +
        (o.purpose ? '<p class="note">' + esc(o.purpose) + "</p>" : "") +
        actionButtons(i) +
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
    const b = e.target.closest("[data-rv]");
    if (!b) return;
    const item = reviewItems().find((x) => x.key === ui.review);
    if (!item) return;
    reviewAction(item, b.dataset.rv);
    renderReview(true);
  });
  function reviewAction(item, what) {
    const o = item.obj;
    if (what === "show" && item.type === "asset") { const p = st.props.find((x) => x.assetId === o.id); if (p) { App.cam.follow = null; App.cam.target.set(p.x, p.group.position.y + 1, p.z); App.cam.radius = 16; } return; }
    if (what === "showp") { App.cam.follow = null; App.cam.target.set(o.site.x, App.SEA + 3, o.site.z); App.cam.radius = 24; return; }
    if (item.type === "asset") {
      if (what === "approve") {
        const wasPending = o.status === "pending";
        App.activateAsset(o, "approved");
        if (wasPending && !st.props.some((p) => p.assetId === o.id)) {
          const at = o.suggestAt || { x: 0, z: 0 };
          const spot = App.findSpot(at.x, at.z);
          if (spot) App.placeProp(o, spot.x, spot.z);
        }
        App.log("review", "You approved " + o.name + ".", "Added to the Library" + (wasPending ? " and placed on the island." : "."));
      } else if (what === "reject") { App.rejectAsset(o); App.log("review", "You rejected " + o.name + ".", "Removed from the island."); }
      else if (what === "restore") { o.status = "pending"; }
    } else if (item.type === "mechanic" || item.type === "event") {
      if (what === "approve") {
        const was = o.status; o.status = "approved";
        if (item.type === "event" && was === "pending") App.startEvent(o);
        App.log("review", "You approved the " + o.name + (item.type === "event" ? " event." : " activity."), "");
      } else if (what === "reject") { o.status = "rejected"; if (st.event && st.event.actId === o.id) st.event = null; for (const t of st.tickles) if (t.action && t.action.act === o) App.endAction(t); App.log("review", "You rejected " + o.name + ".", ""); }
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
          const md = asset.md, m = new THREE.Mesh(geo, App.voxMaterial);
          m.scale.setScalar(md.voxel * App.S);
          m.position.set(md.origin[0] * App.S, md.origin[1] * App.S, md.origin[2] * App.S);
          const box = App.meshBox(md);
          m.position.x -= (box.min.x + box.max.x) / 2; m.position.z -= (box.min.z + box.max.z) / 2;
          obj.add(m);
          halfW = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
          boxH = box.max.y - box.min.y;
        }
        scene.add(obj);
        const t = st.tickles[0];
        refX = 0;
        if (t) {
          ref = new THREE.Group();
          const m = new THREE.Mesh(t.mesh.geometry, App.voxMaterial);
          m.scale.copy(t.mesh.scale); m.position.copy(t.mesh.position);
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
    const assets = st.assets.filter((a) => a.status === "approved" || a.status === "starter");
    const mechs = st.acts.filter((m) => m.status === "approved" && (m.source === "director" || m.source === "claude" || m.source === "player"));
    return {
      format: "tickle-strokes/0.1",
      generator: "Tickle Beach World prototype",
      coordinates: "SDF units, z up, ground at z = 0, a Tickle is about 480 tall",
      onchain: { contract: TB.CONTRACT, models: ss.models, strokes: ss.strokes, palette: ss.paletteSize, renderer: "htmlForToken(uint256)" },
      palette: TB.paletteList().map((p) => TB.rgbHex(p.rgb)),
      assets: assets.map((a) => ({ id: a.id, name: a.name, category: a.category, activity: a.activity, strokes: a.strokes.map((s) => { const o = Object.assign({}, s); delete o._snapped; return o; }),
        provenance: { source: a.source, created: clockOf(a.createdAt).label, review: a.status === "starter" ? "approved at world creation" : "approved by a person", fidelity: a.score, checks: a.checks.map((c) => c.id + ":" + c.status) } })),
      mechanics: mechs.map((m) => ({ name: m.name, verb: m.verb, needs: m.needs, capacity: m.capacity, minutes: m.minutes, where: m.where, host: m.hostLabel || m.ground || null, source: m.source })),
    };
  }
  function renderLibrary(force) {
    const data = libraryData();
    const sig = data.assets.length + "|" + data.mechanics.length + "|" + st.assets.length;
    if (!force && sig === ui.sigLib) return;
    ui.sigLib = sig;
    const ss = TB.styleStats();
    $("libraryBody").innerHTML =
      '<div class="card"><h2>The verified library</h2><p class="note">Approved objects keep the on-chain stroke format and palette, so any tool that reads Tickle Beach models can render them.</p>' +
      '<div class="kv"><span class="k">On-chain base</span><span>' + ss.models + " models \u00b7 " + ss.strokes.toLocaleString() + " strokes \u00b7 " + ss.paletteSize + ' colours</span><span class="k">Approved objects</span><span>' + data.assets.length +
      '</span><span class="k">Approved activities</span><span>' + data.mechanics.length + '</span><span class="k">Waiting for review</span><span>' + reviewItems().filter((i) => i.status === "pending" || i.status === "auto").length + "</span></div></div>" +
      "<h3>Objects</h3>" + (data.assets.map((a) => '<div class="card"><div class="row" style="justify-content:space-between"><b>' + esc(a.name) + '</b><span class="pix">' + a.provenance.fidelity + "%</span></div><p class=\"note\">" + esc(sourceLabel[a.provenance.source] || a.provenance.source) + " \u00b7 " + a.strokes.length + " strokes" + (a.activity ? " \u00b7 " + esc(a.activity.name) : "") + "</p></div>").join("") || '<p class="note">Nothing approved yet.</p>') +
      "<h3>Activities</h3>" + (data.mechanics.map((m) => '<div class="card"><b>' + esc(m.name) + '</b><p class="note">' + esc(needsText(m.needs)) + (m.host ? " \u00b7 at " + esc(m.host) : "") + "</p></div>").join("") || '<p class="note">No new activities approved yet.</p>') +
      '<div class="card"><h3>Export</h3><p class="note">The collection does not declare a licence on-chain, so confirm reuse rights with its creator before publishing anything built from these models.</p>' +
      '<div class="row"><button class="btn primary" id="copyLib">Copy library JSON</button><button class="btn" id="saveLib" hidden>Save as .json</button></div><p class="note" id="libNote"></p></div>' +
      '<div class="card"><h3>Island</h3><div class="row"><button class="btn" id="saveNow">Save now</button><button class="btn danger" id="resetWorld">Start a new island</button></div><p class="note">Your island saves in this browser every few seconds.</p></div>';
    if (downloads) $("saveLib").hidden = false;
  }
  let downloads = null;
  (async () => { try { if (window.claude && window.claude.use) downloads = await window.claude.use("downloads"); } catch (e) { downloads = null; } if (downloads && $("saveLib")) $("saveLib").hidden = false; })();
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
    if (b.id === "saveNow") { $("libNote") && ($("libNote").textContent = App.save() ? "Saved." : "This browser blocked saving."); }
    if (b.id === "resetWorld") {
      if (b.dataset.confirm) { App.clearSave(); location.reload(); }
      else { b.dataset.confirm = "1"; b.textContent = "Click again to wipe this island"; }
    }
  });

  // ---------- refresh loop ----------
  function refresh(force) {
    if (ui.pressing && !force) return;
    if (ui.tab === "tickles") renderTickles(force);
    else if (ui.tab === "director") renderDirector();
    else if (ui.tab === "review") renderReview(force);
    else if (ui.tab === "library") renderLibrary(force);
    const n = reviewItems().filter((i) => i.status === "pending" || i.status === "auto").length;
    const bdg = $("reviewBadge"); bdg.textContent = n; bdg.dataset.n = n;
  }
  App.refresh = refresh;
  setInterval(() => refresh(false), 700);

  // ---------- boot ----------
  function setLoad(frac, text) { $("loadBar").style.width = Math.round(frac * 100) + "%"; if (text) $("loadList").textContent = text; }
  function defaultRows() {
    const seen = new Set(), out = [];
    for (const r of TB.TOKENS) { const c = r[2].Character; if (!seen.has(c)) { seen.add(c); out.push(r); } if (out.length >= 10) break; }
    return out;
  }
  async function seedIsland() {
    const plan = [["Coconut Palm", 3], ["Flower Bush", 2], ["Lantern", 1]];
    const made = [];
    for (const [name, n] of plan) for (let i = 0; i < n; i++) {
      const d = TB.design(name, 1000 + made.length * 7919, { plain: true });
      d.brief = "Seeded at world creation";
      const a = await App.createAsset(d, "director");
      App.activateAsset(a, "starter");
      const at = name === "Lantern" ? { x: App.plaza.x + 3, z: App.plaza.z + 3 } : { x: (Math.random() - 0.5) * 36, z: (Math.random() - 0.5) * 36 };
      const spot = App.findSpot(at.x, at.z, 2.5);
      if (spot) App.placeProp(a, spot.x, spot.z);
      made.push(a);
    }
    st.latest = null;
    App.log("design", "Director seeded the island with coconut palms, flowers and a lantern.", "Starting kit, built in the collection's stroke format. Hunger is the thinnest need: only the palms and a couple of coolers feed anyone.");
  }
  async function boot(hot) {
    try {
      App.initBlockColors();
      fillSwatches();
      App.initThree($("world"));
      window.addEventListener("resize", App.resize);
      App.generateTerrain(11);
      const saved = hot && hot.v ? hot : App.loadSaved();
      if (saved && saved.blocks) App.restoreBlocks(saved.blocks);
      App.rebuildTerrain();
      App.computeSpots();
      App.initActs();
      if (saved) {
        Object.assign(st, { T: saved.T, speed: saved.speed == null ? 1 : saved.speed, freeWill: saved.freeWill !== false, uid: saved.uid || 1, latest: saved.latest || null, event: saved.event || null });
        Object.assign(st.director, saved.director || {});
        st.log = saved.log || [];
        st.acts.push(...(saved.acts || []));
        st.projects = saved.projects || [];
      }
      const rows = saved && saved.tickles && saved.tickles.length
        ? saved.tickles.map((s) => [TB.TOKENS.find((r) => r[0] === s.id), App.plots[s.plot], s]).filter((x) => x[0] && x[1])
        : defaultRows().map((r, i) => [r, App.plots[(i * 2) % 16 + (i >= 8 ? 1 : 0)], null]);
      let done = 0;
      setLoad(0.04, "Decoding " + TB.styleStats().models + " models and " + TB.styleStats().strokes + " strokes from the contract\u2026");
      await Promise.all(rows.map(async ([row, plot, s]) => {
        const t = await App.addTickle(row, plot, s);
        done++;
        setLoad(0.05 + (done / rows.length) * 0.8, "Built " + t.name + " and their home at " + t.traits.Location + " (" + done + "/" + rows.length + ")");
      }));
      if (saved && saved.assets) {
        setLoad(0.9, "Rebuilding objects\u2026");
        for (const a of saved.assets) {
          const res = await App.job("compact", { strokes: a.strokes, voxel: 8 });
          a.md = res.mesh;
          st.assets.push(a);
        }
        for (const p of saved.props || []) { const a = App.assetById(p.assetId); if (a) App.placeProp(a, p.x, p.z, p.rot, p); }
      } else {
        setLoad(0.9, "The Director is seeding the island\u2026");
        await seedIsland();
        App.log("world", "Day 1. " + rows.length + " Tickles wake up on the island, each next to their on-chain home.", "Every body and home was rebuilt from the strokes stored in the contract.");
      }
      setMode(saved ? saved.mode || "auto" : "auto", true);
      setSpeed(st.speed);
      $("freeWill").checked = st.freeWill;
      setLoad(1, "Ready.");
      $("loading").hidden = true;
      let seen = false;
      try { seen = !!localStorage.getItem("tbw-help"); } catch (e) { /* storage blocked */ }
      if (!seen && !saved) $("helpModal").hidden = false;
      refresh(true);
      requestAnimationFrame(frame);
      setInterval(() => App.save(), 15000);
      document.addEventListener("visibilitychange", () => { if (document.hidden) App.save(); });
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => App.serialize());
    } catch (e) {
      console.error(e);
      setLoad(1, "Could not start the island: " + (e && e.message ? e.message : e));
    }
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    App.step(dt);
    if (App.cam.follow) {
      const t = st.tickles.find((x) => x.id === App.cam.follow);
      if (t) App.cam.target.lerp(new THREE.Vector3(t.pos.x, t.pos.y + 1.2, t.pos.z), Math.min(1, dt * 4));
    }
    App.render();
    updateOverlay();
    preview.frame();
    $("clock").textContent = clockOf(st.T).label + (st.speed === 0 ? " \u00b7 paused" : "");
    if (ui.logDirty && ui.tab === "director" && !ui.pressing) { ui.logDirty = false; renderDirector(); }
    requestAnimationFrame(frame);
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data ? hot.data : null);
})();
