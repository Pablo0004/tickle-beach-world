/* Tickle Directory: search and filter all 9,629 Tickles, with a short biography, skills and
 * today's routine for each one. Everything is derived from on-chain traits and the simulation. */
(function () {
  "use strict";
  const App = window.App, st = App.st;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const short = (a) => (a ? a.slice(0, 6) + "\u2026" + a.slice(-4) : "");
  const D = { index: null, filtered: [], shown: 80, sel: null, filters: {}, q: "", sort: "id", mine: false };

  const FILTERS = [
    ["Character", "Clan (species)"], ["region", "Region"], ["jobTitle", "Job"], ["chore", "Village chore"], ["Ground", "Inventory item"], ["Holding", "Holding"],
    ["Head", "Head"], ["Glasses", "Glasses"], ["Shirt", "Shirt"], ["Necklace", "Necklace"], ["Shoes", "Shoes"],
  ];

  function buildIndex() {
    const out = [];
    for (let id = 0; id < TB.SUPPLY; id++) {
      const tr = App.traitsOf(id), v = App.villageOfToken(id), job = App.jobOf(id);
      out.push(Object.assign({ id, name: (tr.Character || "Tickle") + " #" + id, region: App.regions[v.region].name, village: v.name, villageIdx: v.i,
        job, jobTitle: App.JOB_INFO[job].title, chore: App.doesChores(id) ? App.CHORE_INFO[App.choreOf(id)].title : "None", owner: App.ownerOf(id) || "" }, tr));
    }
    D.index = out;
    D.options = {};
    for (const [k] of FILTERS) {
      const cnt = {};
      for (const r of out) cnt[r[k]] = (cnt[r[k]] || 0) + 1;
      D.options[k] = Object.entries(cnt).sort((a, b) => (a[0] === "None") - (b[0] === "None") || a[0].localeCompare(b[0]));
    }
  }

  // ---------- skills ----------
  const SKILLS = ["Fishing", "Music", "Cooking", "Surfing", "Climbing", "Sports", "Charm", "Exploring", "Nature"];
  App.skillsOf = (id) => {
    const tr = App.traitsOf(id), job = App.jobOf(id), per = App.personaOf(id), v = App.villageOfToken(id), fl = App.regions[v.region].floor;
    const s = {};
    for (const k of SKILLS) s[k] = 2 + App.hash2(id, SKILLS.indexOf(k), 71) * 2;
    const add = (k, n) => (s[k] += n);
    const g = tr.Ground, hnd = tr.Holding;
    if (g === "Fishing Rod") add("Fishing", 4); if (g === "808") add("Music", 4); if (g === "Cooler") add("Cooking", 3);
    if (g === "Surfs Up") add("Surfing", 4); if (g === "Beachball") add("Sports", 3); if (g === "Workout") { add("Sports", 3); add("Climbing", 1); }
    if (g === "Treasure") add("Exploring", 4); if (g === "Skateboard" || g === "Skates") { add("Sports", 2); add("Exploring", 2); } if (g === "Chair") add("Charm", 1);
    if (hnd === "Chips" || hnd === "Snacks") add("Cooking", 2); if (hnd === "Games") add("Charm", 1); if (hnd === "Tube") add("Surfing", 1); if (hnd === "Wake Board") add("Surfing", 2); if (hnd === "Towel") add("Surfing", 1);
    const J = { fisher: ["Fishing", 3], dj: ["Music", 3], vendor: ["Cooking", 3], lifeguard: ["Surfing", 2], surfer: ["Surfing", 3], host: ["Charm", 2], hunter: ["Exploring", 3],
      coach: ["Sports", 3], courier: ["Exploring", 2], ranger: ["Nature", 3], keeper: ["Nature", 3], climber: ["Climbing", 3], dockhand: ["Fishing", 2], comber: ["Exploring", 2], farmer: ["Nature", 2] }[job];
    if (J) add(J[0], J[1]);
    if (fl === 14) add("Climbing", 2); if (fl === 11) add("Nature", 1); if (fl === 3) add("Fishing", 1); if (fl === 1) add("Surfing", 1); if (fl === 4) add("Nature", 1); if (fl === 16) add("Cooking", 1);
    add("Charm", (per.sociable - 1) * 6); add("Sports", (per.playful - 1) * 4); add("Exploring", (per.playful - 1) * 3); add("Cooking", (per.appetite - 1) * 3);
    return SKILLS.map((k) => ({ name: k, v: Math.max(1, Math.min(10, Math.round(s[k]))) })).sort((a, b) => b.v - a.v);
  };

  // ---------- biography ----------
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  function personality(per) {
    const tr = [];
    if (per.sociable > 1.12) tr.push("loves company"); else if (per.sociable < 0.9) tr.push("enjoys quiet time");
    if (per.playful > 1.12) tr.push("is always up for a game"); else if (per.playful < 0.9) tr.push("takes life slowly");
    if (per.appetite > 1.12) tr.push("is never far from a snack");
    if (per.lazy > 1.12) tr.push("treasures a long nap");
    return tr.length ? tr.slice(0, 2).join(" and ") : "is easygoing and steady";
  }
  App.bioOf = (id) => {
    const r = D.index ? D.index[id] : Object.assign({ name: App.nameOf(id) }, App.traitsOf(id));
    const v = App.villageOfToken(id), region = App.regions[v.region].name, job = App.jobOf(id), info = App.JOB_INFO[job];
    const first = (r.Character || "Tickle") + " #" + id;
    const day = Math.floor(st.T / 1440), plan = App.planOf(id, day);
    const work = plan.steps.find((s) => s.k === "job"), eve = plan.steps.find((s) => s.k === "evening"), leis = plan.steps.find((s) => s.k === "leisure");
    const per = App.personaOf(id);
    const parts = [];
    parts.push(first + " is " + (/^[AEIOU]/.test(info.title) ? "an " : "a ") + lower(info.title) + " from " + v.name + ", " + App.placeKindText(v) + " in the " + region + " region.");
    parts.push("Most days start at " + (work.p.label || "work") + ", where " + first.split(" ")[0] + " " + info.verb.replace(/^is /, "is ") + ".");
    if (App.doesChores(id)) { const c = App.CHORE_INFO[App.choreOf(id)]; parts.push("In the afternoons it's chores for the village: " + first.split(" ")[0] + " " + c.verb.replace(/^is /, "is ") + " to keep the granary full."); }
    const look = [];
    if (r.Head && r.Head !== "None") look.push("the " + r.Head);
    if (r.Glasses && r.Glasses !== "None") look.push(r.Glasses + (/glasses/i.test(r.Glasses) ? "" : " glasses"));
    if (r.Necklace && r.Necklace !== "None") look.push("a " + r.Necklace + (/necklace/i.test(r.Necklace) ? "" : " necklace"));
    const lookTxt = look.length > 1 ? look.slice(0, -1).join(", ") + " and " + look[look.length - 1] : look[0];
    const plural = /s$/i.test(r.Holding || "");
    const hold = r.Holding && r.Holding !== "None" ? (plural ? "some " : "a ") + r.Holding.toLowerCase() : "";
    if (lookTxt || hold) parts.push("Easy to spot" + (lookTxt ? " in " + lookTxt : "") + (hold ? (lookTxt ? ", usually carrying " : ", usually carrying ") + hold : "") + ".");
    parts.push("Everyone in " + v.name + " knows this one " + personality(per) + ".");
    if (r.Ground && r.Ground !== "None" && App.ITEM_USE[r.Ground]) {
      const u = App.ITEM_USE[r.Ground], g = App.GROUND_ACTS[r.Ground];
      parts.push("In the bag: " + (/s$/i.test(r.Ground) ? "" : "a ") + r.Ground + (u.ride ? ", for getting around faster on long trips" : ", brought out to " + lower(g[0])) + (u.join ? " (others are welcome to join)" : "") + ".");
    }
    if (leis) parts.push("Free time today goes to " + leis.p.label + (eve && eve.p.label.indexOf(v.name) < 0 ? ", and the evening to " + eve.p.label + "." : ", before the evening gathering on the square."));
    const friends = App.friendsOf(id).slice(0, 2);
    if (friends.length) parts.push("Closest friends: " + friends.map(([o, val]) => App.nameOf(o) + " (" + App.relLabel(val).toLowerCase() + ")").join(" and ") + ".");
    const fav = Object.entries(st.fav[id] || {}).sort((a, b) => b[1] - a[1])[0];
    if (fav) { const a = App.actById(fav[0]); if (a) parts.push("Favourite thing to do so far: " + lower(a.name) + "."); }
    return parts.join(" ");
  };

  // ---------- rendering ----------
  function applyFilters() {
    const q = D.q.trim().toLowerCase().replace(/^#/, "");
    const isNum = /^\d+$/.test(q);
    D.filtered = D.index.filter((r) => {
      for (const k in D.filters) if (D.filters[k] && r[k] !== D.filters[k]) return false;
      if (D.mine && (!st.wallet || r.owner !== st.wallet)) return false;
      if (!q) return true;
      if (isNum) return String(r.id).startsWith(q);
      return r.name.toLowerCase().includes(q) || r.village.toLowerCase().includes(q) || r.jobTitle.toLowerCase().includes(q) || (q.startsWith("0x") && r.owner.startsWith(q));
    });
    const by = D.sort;
    if (by === "name") D.filtered.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    else if (by === "village") D.filtered.sort((a, b) => a.village.localeCompare(b.village) || a.id - b.id);
    else if (by === "job") D.filtered.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle) || a.id - b.id);
    D.shown = 80;
  }
  function renderList() {
    $("dirCount").textContent = "Showing " + Math.min(D.shown, D.filtered.length).toLocaleString() + " of " + D.filtered.length.toLocaleString() + " matching \u00b7 " + TB.SUPPLY.toLocaleString() + " in all";
    $("dirList").innerHTML = D.filtered.slice(0, D.shown).map((r) =>
      '<button class="drow" data-id="' + r.id + '" aria-current="' + (r.id === D.sel) + '"><span class="sw" style="background:' + App.swatchOf(r.id) + '"></span>' +
      '<span style="min-width:0"><span class="tname">' + esc(r.name) + (st.wallet && r.owner === st.wallet ? ' <span class="chip approved">yours</span>' : "") + '</span><span class="tact">' + esc(r.jobTitle) + " \u00b7 " + esc(r.village) + " \u00b7 " + esc(r.region) + "</span></span>" +
      '<span class="dtag">' + esc(r.Ground !== "None" ? r.Ground : r.Holding !== "None" ? r.Holding : "") + "</span></button>").join("") +
      (D.filtered.length > D.shown ? '<button class="btn" id="dirMore">Show 80 more</button>' : "") +
      (!D.filtered.length ? '<p class="note">No Tickle matches. Try removing a filter.</p>' : "");
  }
  function routineHTML(id) {
    const day = Math.floor(st.T / 1440), plan = App.planOf(id, day), now = st.T - day * 1440;
    const fmt = (m) => App.clock(day * 1440 + m).short;
    const info = App.JOB_INFO[plan.job];
    const chore = App.CHORE_INFO[App.choreOf(id)];
    const label = { sleep: "Sleeps at home", morning: "Breakfast at home", job: "Works as " + info.title.toLowerCase(), lunch: "Lunch", chore: "Chores: " + chore.label.toLowerCase(), leisure: "Free time", evening: "Dinner by the fire, then friends",
      raid: "Joins a raid", defend: "Defends against a dragon" };
    return '<ol class="routine">' + plan.steps.filter((s, i) => !(s.k === "sleep" && i === 0)).map((s) =>
      '<li class="' + (now >= s.s && now < s.e ? "now" : now >= s.e ? "past" : "") + '"><span class="pix">' + fmt(s.s) + "</span><span><b>" + esc(label[s.k]) + "</b>" +
      (s.k === "sleep" || s.k === "morning" ? "" : " at " + esc(s.p.label || "")) + (s.travel > 8 ? ' <span class="note">(' + Math.round(s.travel) + " min walk" + (s.path.length > 2 ? ", over a bridge" : "") + ")</span>" : "") + "</span></li>").join("") + "</ol>";
  }
  function renderDetail() {
    const id = D.sel, box = $("dirDetail");
    if (id == null) { box.innerHTML = '<div class="card"><h2>Pick a Tickle</h2><p class="note">Search by number, name, village, job or owner wallet, or narrow the list with the filters. Each profile has a short biography, skills and today\'s routine.</p></div>'; return; }
    const r = D.index[id], v = App.villageOfToken(id);
    const skills = App.skillsOf(id);
    const agent = App.pop.agent[id];
    const needs = agent ? agent.needs : { hunger: App.pop.needs[id * 4], energy: App.pop.needs[id * 4 + 1], social: App.pop.needs[id * 4 + 2], fun: App.pop.needs[id * 4 + 3] };
    const traits = TB.SLOTS.map((slot) => { const L = TB.SLOT_LABEL[slot]; return '<span class="k">' + esc(L) + "</span><span>" + esc(r[L]) + (r[L + " Theme"] && r[L + " Theme"] !== "None" ? ' <span class="note">(' + esc(r[L + " Theme"]) + ")</span>" : "") + "</span>"; }).join("");
    box.innerHTML = '<div class="card">' +
      '<div class="row" style="justify-content:space-between"><div class="row"><span class="sw big" style="background:' + App.swatchOf(id) + '"></span><div><h2>' + esc(r.name) + '</h2><p class="note">' + esc(r.jobTitle) + " \u00b7 " + esc(v.name) + " \u00b7 " + esc(r.region) + "</p></div></div>" +
      '<div class="row"><button class="btn primary" data-dact="go">Go there</button><button class="btn" data-dact="follow">Follow</button></div></div>' +
      '<p class="bio" id="dirBio">' + esc(App.bioOf(id)) + "</p>" +
      '<div class="row"><button class="btn sea" data-dact="story" ' + (App.sampleReady ? "" : "hidden") + '>Write a longer story with Claude</button><span class="note" id="dirStoryNote"></span></div>' +
      "<h3>Skills</h3><div class=\"skills\">" + skills.map((s) => '<span>' + s.name + '</span><div class="bar"><i style="width:' + s.v * 10 + '%"></i></div><span class="num">' + s.v + "</span>").join("") + "</div>" +
      "<h3>Today's routine</h3>" + routineHTML(id) +
      "<h3>Right now</h3>" + '<div class="needs">' + App.NEEDS.map((k) => "<span>" + App.NEED_LABEL[k] + '</span><div class="bar"><i style="width:' + Math.round(needs[k]) + '%;background:var(--sea)"></i></div><span class="num">' + Math.round(needs[k]) + "%</span>").join("") + "</div>" +
      "<h3>On-chain traits \u00b7 token #" + id + '</h3><div class="kv">' + traits + "</div>" +
      '<p class="note">Owner ' + (r.owner ? esc(short(r.owner)) + (st.wallet === r.owner ? " (the wallet you play as)" : "") : "unknown") + " \u00b7 ownership snapshot " + esc(TB.OWNERS.date) + "</p></div>";
  }
  function renderFilters() {
    $("dirFilters").innerHTML = FILTERS.map(([k, label]) => '<label class="fsel"><span>' + label + '</span><select data-f="' + k + '"><option value="">Any</option>' +
      D.options[k].map(([val, n]) => '<option value="' + esc(val) + '"' + (D.filters[k] === val ? " selected" : "") + ">" + esc(val) + " (" + n.toLocaleString() + ")</option>").join("") + "</select></label>").join("") +
      '<label class="fsel"><span>Sort by</span><select id="dirSort"><option value="id">Token number</option><option value="name">Name</option><option value="village">Village</option><option value="job">Job</option></select></label>' +
      '<label class="toggle"><input type="checkbox" id="dirMine"' + (D.mine ? " checked" : "") + (st.wallet ? "" : " disabled") + "> Only the wallet I play as</label>" +
      '<button class="btn" id="dirClear">Clear filters</button>';
    $("dirSort").value = D.sort;
  }
  function refreshAll() { applyFilters(); renderList(); renderDetail(); }

  App.openDirectory = (id) => {
    $("dirModal").hidden = false;
    if (!D.index) {
      $("dirList").innerHTML = '<p class="note">Reading the traits of all ' + TB.SUPPLY.toLocaleString() + " Tickles\u2026</p>";
      setTimeout(() => { buildIndex(); renderFilters(); if (id != null) D.sel = id; refreshAll(); }, 30);
      return;
    }
    renderFilters();
    if (id != null) D.sel = id;
    refreshAll();
  };
  $("dirOpen").onclick = () => App.openDirectory();
  $("dirClose").onclick = () => { $("dirModal").hidden = true; };
  $("dirSearch").addEventListener("input", (e) => { D.q = e.target.value; applyFilters(); renderList(); });
  $("dirModal").addEventListener("change", (e) => {
    if (e.target.dataset.f) { D.filters[e.target.dataset.f] = e.target.value; applyFilters(); renderList(); }
    if (e.target.id === "dirSort") { D.sort = e.target.value; applyFilters(); renderList(); }
    if (e.target.id === "dirMine") { D.mine = e.target.checked; applyFilters(); renderList(); }
  });
  $("dirModal").addEventListener("click", async (e) => {
    const row = e.target.closest("[data-id]");
    if (row) { D.sel = +row.dataset.id; renderList(); renderDetail(); if (window.innerWidth < 760) $("dirDetail").scrollIntoView({ behavior: "smooth" }); return; }
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "dirMore") { D.shown += 80; renderList(); }
    if (b.id === "dirClear") { D.filters = {}; D.q = ""; D.mine = false; $("dirSearch").value = ""; renderFilters(); refreshAll(); }
    if (b.dataset.dact === "go" || b.dataset.dact === "follow") {
      const id = D.sel;
      $("dirModal").hidden = true;
      App.goToToken(id, true);
      if (b.dataset.dact === "follow") App.cam.follow = id;
    }
    if (b.dataset.dact === "story") writeStory(D.sel);
  });

  // ---------- optional: a longer story written by Claude ----------
  let sample = null;
  (async () => { try { if (window.claude && window.claude.use) sample = await window.claude.use("sample"); } catch (e) { sample = null; } App.sampleReady = !!sample; })();
  async function writeStory(id) {
    if (!sample) return;
    const r = D.index[id], note = $("dirStoryNote");
    note.textContent = "Claude is writing\u2026";
    const day = Math.floor(st.T / 1440), plan = App.planOf(id, day);
    const facts = {
      name: r.name, job: r.jobTitle, clan: App.clanName(App.villageOfToken(id).clan), afternoonChore: r.chore, village: r.village, region: r.region, traits: TB.SLOTS.map((s) => TB.SLOT_LABEL[s] + ": " + r[TB.SLOT_LABEL[s]]).join(", "),
      skills: App.skillsOf(id).slice(0, 4).map((s) => s.name + " " + s.v + "/10").join(", "),
      routine: plan.steps.filter((s) => s.k !== "sleep").map((s) => App.clock(day * 1440 + s.s).short + " " + s.k + " at " + (s.p.label || "home")).join("; "),
      friends: App.friendsOf(id).slice(0, 3).map(([o, v]) => App.nameOf(o) + " (" + App.relLabel(v) + ")").join(", ") || "none yet",
    };
    try {
      const { text } = await sample("Write a warm, playful 110-word biography of a character in Tickle Beach World, a cosy voxel beach life-sim. Use only these facts, do not invent owners or prices, refer to the character by name (no gendered pronouns), and end with one line about what they dream of doing next.\n\n" + JSON.stringify(facts), { modelTier: "quick", cache: false, onText: ({ text }) => { const el = $("dirBio"); if (el && D.sel === id) el.textContent = text; } });
      if (D.sel === id) $("dirBio").textContent = text;
      note.textContent = "Written by Claude from this Tickle's traits, job and routine.";
    } catch (e) {
      note.textContent = e && e.code === "not_granted" ? "Claude isn't allowed for this page." : "Claude couldn't write it right now.";
    }
  }
})();
