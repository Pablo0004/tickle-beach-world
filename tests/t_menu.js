// The game menu (item 1.4): the world full-screen with the menu closed; the Menu button and Esc open it; every section;
// M opens the map in it; a Tickle's full card opens it at Tickles; travelling from it closes it; Esc closes it.
// Screenshots menu_world.png, menu_<page>.png. Run with W=400 H=800 for a phone.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.evaluate(() => App.closeMenu && App.closeMenu());
  await pg.waitForTimeout(3000);
  const state = () => pg.evaluate(() => ({ open: App.gameMenuOpen(), page: [...document.querySelectorAll("[data-gm][aria-current=true]")].map((b) => b.dataset.gm).join(), panelShown: !document.getElementById("panel").hidden && document.getElementById("panel").offsetWidth, w: innerWidth }));
  log("start", JSON.stringify(await state()));
  await pg.screenshot({ path: "menu_world.png", timeout: 180000 });
  await pg.click("#helpBtn");
  await pg.waitForTimeout(800);
  log("button", JSON.stringify(await state()));
  for (const p of ["tickles", "holders", "arena", "map", "directory", "director", "review", "library", "help", "controls", "music", "settings", "credits"]) {
    await pg.click('[data-gm="' + p + '"]');
    await pg.waitForTimeout(p === "directory" ? 2500 : 900);
    const r = await pg.evaluate(() => { const vis = [...document.querySelectorAll("#gmBody > *")].filter((e) => !e.hidden).map((e) => e.id + ":" + e.offsetWidth + "x" + e.offsetHeight); return vis; });
    log(p, JSON.stringify(r));
    if (["tickles", "map", "directory", "settings", "arena"].includes(p)) await pg.screenshot({ path: "menu_" + p + ".png", timeout: 180000 });
  }
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(500);
  log("Esc closes", JSON.stringify(await state()));
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(500);
  log("Esc opens", JSON.stringify(await state()));
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(300);
  await pg.keyboard.press("KeyM"); await pg.waitForTimeout(800);
  log("M", JSON.stringify(await state()));
  await pg.keyboard.press("KeyM"); await pg.waitForTimeout(500);
  log("M again", JSON.stringify(await state()));
  await pg.evaluate(() => { const t = App.st.tickles[0]; if (t) App.selectTickle(t.id); });
  await pg.waitForTimeout(800);
  log("full card", JSON.stringify(await state()));
  await pg.evaluate(() => App.flyTo(App.cam.target.x + 30, App.cam.target.z, 30));
  await pg.waitForTimeout(500);
  log("travel", JSON.stringify(await state()));
};
