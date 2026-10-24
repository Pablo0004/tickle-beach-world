// First person while controlling a Tickle (item 1.1): HUD, compass, crosshair and what it names, walking, a jump,
// the wheel pulling the camera back (third person), the touch stick, a click inspecting what is in front; screenshots
// fp1.png (first person), fp2.png (third person), fp3.png (touch stick).
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.waitForTimeout(6000);
  await pg.waitForFunction(() => App.st.tickles.filter((t) => t.group && !App.isKO(t.id)).length >= 8, null, { timeout: 180000 });
  const id = await pg.evaluate(() => {
    const st = App.st; st.mode = "manual";
    const t = st.tickles.find((t) => !App.isKO(t.id) && t.group.visible && App.isLand(t.pos.x, t.pos.z)) || st.tickles[0];
    st.wallet = App.ownerOf(t.id);
    App.enterFP(t.id);
    return App.fpOn() ? t.id : null;
  });
  log("tickle", id, await pg.evaluate((id) => App.nameOf(id), id));
  await pg.waitForTimeout(2500);
  const hud = () => pg.evaluate(() => ({ drive: App.fpDriving(), cross: !document.getElementById("fpCross").hidden, compass: document.getElementById("fpCompass").firstChild && document.getElementById("fpCompass").firstChild.style.transform, stats: document.getElementById("fpStats").innerText.replace(/\n/g, " | "), aim: document.getElementById("fpAim").hidden ? null : document.getElementById("fpAim").textContent, hud: document.getElementById("fpHud").innerText }));
  log("enter", JSON.stringify(await hud()));
  // walk forward 2 s, then a jump
  const p0 = await pg.evaluate((id) => { const t = App.pop.agent[id]; return [t.pos.x, t.pos.z]; }, id);
  await pg.keyboard.down("KeyW"); await pg.waitForTimeout(8000); await pg.keyboard.up("KeyW");
  const p1 = await pg.evaluate((id) => { const t = App.pop.agent[id]; return [t.pos.x, t.pos.z, App.st.speed]; }, id);
  log("walked", Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2), "blocks, speed", p1[2]);
  await pg.keyboard.press("Space");
  let top = 0;
  for (let i = 0; i < 12; i++) { await pg.waitForTimeout(400); top = Math.max(top, await pg.evaluate((id) => { const a = App.pop.agent[id].action; return a && a.jy || 0; }, id)); }
  log("jump peak", top.toFixed(2));
  // turn with a drag (mouse capture is refused in headless runs, a drag still looks)
  const h0 = await pg.evaluate((id) => App.pop.agent[id].heading, id);
  await pg.mouse.move(400, 360); await pg.mouse.down(); await pg.mouse.move(520, 340, { steps: 6 }); await pg.mouse.up();
  log("turned", (await pg.evaluate((id) => App.pop.agent[id].heading, id)) - h0);
  await pg.waitForTimeout(800);
  log("after turn", JSON.stringify(await hud()));
  await pg.screenshot({ path: "fp1.png", timeout: 180000 });
  // wheel: third person
  await pg.mouse.move(400, 360);
  for (let i = 0; i < 6; i++) await pg.mouse.wheel(0, 200);
  await pg.waitForTimeout(1500);
  log("third", JSON.stringify(await pg.evaluate((id) => ({ visible: App.pop.agent[id].mesh.visible, cam: App.camera.position.toArray().map((v) => +v.toFixed(1)), t: App.pop.agent[id].pos.toArray().map((v) => +v.toFixed(1)) }), id)));
  await pg.screenshot({ path: "fp2.png", timeout: 180000 });
  for (let i = 0; i < 8; i++) await pg.mouse.wheel(0, -300);
  await pg.waitForTimeout(800);
  // click: inspect what is in front (the click in a headless run falls back to inspecting the spot clicked)
  await pg.evaluate(() => App.fpClick());
  await pg.waitForTimeout(600);
  log("inspect open", await pg.evaluate(() => { const w = (document.getElementById("inspClose") || {}).closest && document.getElementById("inspClose").closest("div[id]"); return w ? !w.hidden && w.innerText.slice(0, 80).replace(/\n/g, " | ") : "no window"; }));
  // touch stick
  const touched = await pg.evaluate(async (id) => {
    const el = App.renderer.domElement, r = el.getBoundingClientRect(), t = App.pop.agent[id], x0 = t.pos.x, z0 = t.pos.z;
    const ev = (type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", clientX: x, clientY: y, bubbles: true, isPrimary: true }));
    ev("pointerdown", r.left + 120, r.top + 500); ev("pointermove", r.left + 125, r.top + 440);
    await new Promise((res) => setTimeout(res, 1500));
    const shown = !document.getElementById("fpStick").hidden;
    return { shown, x0, z0, ev: "ok" };
  }, id);
  await pg.screenshot({ path: "fp3.png", timeout: 180000 });
  const moved = await pg.evaluate(([id, x0, z0]) => { const el = App.renderer.domElement, r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 7, pointerType: "touch", clientX: r.left + 125, clientY: r.top + 440, bubbles: true })); const t = App.pop.agent[id]; return [Math.hypot(t.pos.x - x0, t.pos.z - z0).toFixed(2), document.getElementById("fpStick").hidden]; }, [id, touched.x0, touched.z0]);
  log("stick", touched.shown, "moved", moved[0], "hidden after", moved[1]);
  // Esc leaves (the mouse is not captured)
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(300);
  log("after Esc", await pg.evaluate(() => ({ on: App.fpOn(), cross: !document.getElementById("fpCross").hidden, stats: !document.getElementById("fpStats").hidden })));
};
