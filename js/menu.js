/* The game menu (item 1.4). One menu over the world that opens and closes (the Menu button, or Esc when there is
 * nothing else to close) and holds everything that used to sit beside the world: the panel's tabs (Tickles, Holders,
 * Director, Review, Adventure, Library), the Directory, the big map and the old Menu's sections (How it works,
 * Controls, Sound, Settings, Credits). With the menu closed the world fills the screen; the inspect window, the place
 * cards, the notifications, the minimap and the first-person HUD stay over it.
 * The pages are the same elements as before, moved into the menu (so everything they do still works): opening one of
 * them from anywhere (a Tickle's full card, Review, the Directory, the map with M) opens the menu at that page, and
 * anything that sends the view somewhere in the world (travel from the map, Go to a Tickle, Watch, going inside, first
 * person) closes it. */
(function () {
  "use strict";
  const App = window.App, ui = App.ui;
  const $ = (id) => document.getElementById(id);
  const menu = $("gameMenu"), body = $("gmBody");
  if (!menu || !body) return;
  // the pages: the old panel, the Directory, the big map, the old Menu
  const panel = $("panel"), dir = $("dirModal"), map = $("mapModal"), help = $("helpModal");
  for (const el of [panel, dir, map, help]) { body.appendChild(el); el.classList.add("in-menu"); }
  panel.hidden = true;
  const TABS = { tickles: 1, holders: 1, director: 1, review: 1, arena: 1, library: 1 };
  const SECS = { help: 1, controls: 1, music: 1, settings: 1, credits: 1, encyclopedia: 1 };
  let page = null, lastPage = "tickles", returnFocus = null;
  const show = (el) => { for (const x of [panel, dir, map, help]) x.hidden = x !== el; };
  App.gameMenuOpen = (p) => !menu.hidden && (p == null || page === p);
  // open the menu at a page; run (optional) does the page's own opening
  App.openMenu = (p, run) => {
    p = p || lastPage;
    if (menu.hidden) { returnFocus = document.activeElement; menu.hidden = false; document.body.classList.add("menu-open"); }
    page = p; lastPage = p;
    for (const b of menu.querySelectorAll("[data-gm]")) b.setAttribute("aria-current", String(b.dataset.gm === p));
    if (TABS[p]) { show(panel); setTabRaw(p); }
    else if (SECS[p]) { show(help); showMenuRaw(p); }
    else if (p === "directory") { show(dir); if (run) run(); else openDirRaw(); }
    else if (p === "map") { show(map); openMapRaw(); }
    if (run && p !== "directory") run();
    const cur = menu.querySelector('[data-gm][aria-current="true"]');
    if (cur && !menu.contains(document.activeElement)) cur.focus({ preventScroll: true });
  };
  App.closeMenu = () => {
    if (menu.hidden) return;
    menu.hidden = true; page = null;
    document.body.classList.remove("menu-open");
    $("mapTip").hidden = true;
    if (returnFocus && returnFocus.focus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  };
  App.toggleMenu = (p) => (App.gameMenuOpen(p) ? App.closeMenu() : App.openMenu(p));
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-gm]");
    if (!b) { if (e.target === menu) App.closeMenu(); return; }
    if (b.dataset.gm === "resume") App.closeMenu(); else App.openMenu(b.dataset.gm);
  });
  // ---------- the old ways in, now into the menu ----------
  const setTabRaw = App.setTab, showMenuRaw = App.showMenu, openMapRaw = App.openMap, openDirRaw = App.openDirectory;
  App.setTab = (t) => App.openMenu(t);
  App.showMenu = (s) => App.openMenu(s);
  App.openMap = () => App.openMenu("map");
  App.openDirectory = (id) => App.openMenu("directory", () => openDirRaw(id));
  const selRaw = App.selectTickle, reviewRaw = App.openReview;
  App.selectTickle = (id) => { selRaw(id); App.openMenu("tickles"); };
  App.openReview = (aid) => { reviewRaw(aid); App.openMenu("review"); };
  // things that send the view into the world close the menu
  for (const k of ["flyTo", "goToToken", "enter", "enterFP"]) {
    const f = App[k];
    if (typeof f === "function") App[k] = function () { App.closeMenu(); return f.apply(this, arguments); };
  }
  // the pages' own Close buttons close the menu
  for (const id of ["helpClose", "dirClose", "mapClose"]) { const b = $(id); if (b) b.addEventListener("click", () => App.closeMenu()); }
  $("helpBtn").onclick = () => App.toggleMenu();
  // ---------- Esc ----------
  // with the menu open it closes it; with nothing else to close (first person, a card, a selection, inside) it opens it
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && menu.hidden)) return;
    if (!menu.hidden) { e.preventDefault(); e.stopImmediatePropagation(); App.closeMenu(); return; }
    const busy = (App.fpOn && App.fpOn()) || App.inside || !$("placeCard").hidden || ui.sel != null || App.cam.follow != null || !$("onchainModal").hidden;
    if (!busy) { e.preventDefault(); e.stopImmediatePropagation(); App.openMenu(); }
  }, true);
  // keep the review count on the menu's Review button too
  const badge = $("reviewBadge"), gmBadge = $("gmReviewBadge");
  if (badge && gmBadge) new MutationObserver(() => { gmBadge.dataset.n = badge.dataset.n; gmBadge.textContent = badge.textContent; }).observe(badge, { attributes: true, childList: true, characterData: true, subtree: true });
})();
