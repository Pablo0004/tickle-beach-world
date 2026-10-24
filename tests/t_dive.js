// Diving (item 1.2c): the sea caves; your own Tickle diving in first person (C down, breath running out), going into a
// sea cave from its mouth (and not from the surface); the third-person view following a diver down. Screenshots
// dive_fp.png, dive_cave.png, dive_follow.png, dive_floor.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  log("caves", JSON.stringify(await pg.evaluate(() => App.seaCaves.map((c) => [c.name, Math.round(c.x), Math.round(c.z), +(App.WATER_Y - c.y).toFixed(1)]))));
  await pg.waitForFunction(() => App.st.tickles.filter((t) => t.group && !App.isKO(t.id)).length >= 4, null, { timeout: 180000 });
  // to a cave, in first person, on the surface above its mouth
  const id = await pg.evaluate(() => {
    const c = App.seaCaves[0], st = App.st, t = st.tickles.find((t) => !App.isKO(t.id));
    st.mode = "manual"; st.wallet = App.ownerOf(t.id);
    App.endAction(t); t.pos.x = c.door.x + Math.sin(c.rot) * 2; t.pos.z = c.door.z + Math.cos(c.rot) * 2; t.heading = c.rot + Math.PI;
    App.cam.target.set(t.pos.x, App.WATER_Y, t.pos.z);
    App.enterFP(t.id);
    return t.id;
  });
  await pg.waitForTimeout(6000);
  log("surface: E says", await pg.evaluate(() => { const T = App.enterableAt(App.cam.target.x, App.cam.target.z); return T ? (T.shut || "open " + T.kind) : "nothing"; }));
  await pg.keyboard.down("KeyC"); await pg.waitForTimeout(9000); await pg.keyboard.up("KeyC");
  log("dived", JSON.stringify(await pg.evaluate((id) => { const t = App.pop.agent[id], a = t.action; return { y: +t.pos.y.toFixed(2), water: App.WATER_Y, dive: a && +(a.dive || 0).toFixed(2), air: a && +(a.air || 0).toFixed(2), stats: document.getElementById("fpStats").innerText.split("\n").slice(0, 4).join(" | "), tint: !document.getElementById("uwTint").hidden }; }, id)));
  await L.shot(pg, "dive_fp.png");
  await pg.evaluate(() => { const fp = document.getElementById("fpHud"); }); 
  log("down at the mouth: E says", await pg.evaluate(() => { const T = App.enterableAt(App.cam.target.x, App.cam.target.z); return T ? (T.shut || "open " + T.kind + " " + T.name) : "nothing"; }));
  await pg.keyboard.press("KeyE");
  await pg.waitForTimeout(6000);
  log("inside", JSON.stringify(await pg.evaluate(() => App.inside ? { title: App.inside.map.title, rooms: App.inside.map.rooms.length, items: App.inside.map.rooms[0].items.length } : null)));
  await L.shot(pg, "dive_cave.png");
  await pg.evaluate(() => App.leaveInterior()); await pg.waitForTimeout(3000);
  // a diver at a dive site, followed: the view goes down with it
  await pg.evaluate(() => { App.exitFP && App.exitFP(); const s = App.diveSites[0]; App.cam.follow = null; App.cam.target.set(s.shore.x, 7, s.shore.z); });
  await pg.waitForFunction(() => App.st.tickles.filter((t) => !App.isKO(t.id)).length >= 2, null, { timeout: 180000 });
  const d = await pg.evaluate(() => {
    const st = App.st, t = st.tickles.find((t) => !App.isKO(t.id)), s = App.diveSites[0];
    st.mode = "auto";
    App.endAction(t); t.pos.x = s.x + 1; t.pos.z = s.z + 1;
    App.startDiveAt(t, s.i, st.T + 120);
    App.cam.follow = t.id; App.cam.radius = 9;
    return { id: t.id, site: s.name };
  });
  log("diver", JSON.stringify(d));
  let seen = null;
  for (let k = 0; k < 30 && !seen; k++) { await pg.waitForTimeout(2000); seen = await pg.evaluate((id) => { const t = App.pop.agent[id]; return t && t.pos.y < App.WATER_Y - 1 && App.diveView ? { y: +t.pos.y.toFixed(1), cam: +App.camera.position.y.toFixed(1), phase: t.action && t.action.phase } : null; }, d.id); }
  log("followed under", JSON.stringify(seen));
  await L.hidePanels(pg);
  await L.shot(pg, "dive_follow.png");
  // the sea floor near a cave, from just under the surface
  await pg.evaluate(() => { const c = App.seaCaves[1] || App.seaCaves[0]; App.cam.follow = null; App.cam.target.set(c.x + 7, c.y + 1, c.z + 7); App.cam.radius = 4; App.cam.phi = 1.3; App.cam.theta = 0.8; });
  await pg.waitForTimeout(8000);
  log("sea life", JSON.stringify(await pg.evaluate(() => App.seaLifeCounts())), "tris", await pg.evaluate(() => App.renderer.info.render.triangles));
  await L.shot(pg, "dive_floor.png");
};
