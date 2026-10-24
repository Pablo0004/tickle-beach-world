// Acting from first person (item 1.1, part 2): T talks to the Tickle in front (both speak, the relationship grows),
// F strikes a cave monster in front until it falls (it fights back; health in the HUD); then every kit of the ability
// bar (warrior, mage, healer, tamer, brawler: F, Q, G, R) against the cave's monsters; A strafes (the heading stays).
// Screenshots fp_strike.png, fp_bar.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.waitForFunction(() => App.st.tickles.filter((t) => t.group && !App.isKO(t.id)).length >= 8, null, { timeout: 180000 });
  const ids = await pg.evaluate(() => {
    const st = App.st; st.mode = "manual";
    const ts = st.tickles.filter((t) => !App.isKO(t.id) && t.group.visible && App.isLand(t.pos.x, t.pos.z));
    const t = ts[0], o = ts[1];
    st.wallet = App.ownerOf(t.id);
    App.enterFP(t.id);
    // stand two blocks in front of the other one, facing it
    t.pos.x = o.pos.x; t.pos.z = o.pos.z - 2; t.heading = 0;
    return [t.id, o.id, App.relGet(t.id, o.id)];
  });
  await pg.waitForTimeout(3000);
  log("aim at tickle:", await pg.evaluate(() => document.getElementById("fpAim").textContent));
  await pg.keyboard.press("KeyT");
  await pg.waitForTimeout(5000);
  log("talk", JSON.stringify(await pg.evaluate(([a, b, r0]) => { const t = App.pop.agent[a], o = App.pop.agent[b]; return { rel: [r0, App.relGet(a, b)], said: t.bubble && t.bubble.text, reply: o && o.bubble && o.bubble.text, fp: App.fpOn() }; }, ids)));
  // to the nearest cave: wait for its monsters, stand in front of one
  await pg.evaluate(([a]) => { const t = App.pop.agent[a], d = App.dungeons[0]; t.pos.x = d.door.x + Math.sin(d.rot) * 9; t.pos.z = d.door.z + Math.cos(d.rot) * 9; App.cam.target.set(t.pos.x, t.pos.y, t.pos.z); }, ids);
  await pg.waitForTimeout(8000);
  const m0 = await pg.evaluate(([a]) => {
    const t = App.pop.agent[a], ms = App.monstersNear(t.pos.x, t.pos.z, 60);
    if (!ms.length) return null;
    const m = ms[0];
    t.pos.x = m.x - Math.sin(0.3) * 2; t.pos.z = m.z - Math.cos(0.3) * 2; t.heading = 0.3;
    App.st.speed = 1;
    return { kind: m.kind, hp: m.hp, n: ms.length, fp: App.fpOn(), act: t.action && t.action.kind };
  }, ids);
  log("monster", JSON.stringify(m0));
  if (!m0) return;
  await pg.waitForTimeout(2000);
  log("aim at monster:", await pg.evaluate(() => document.getElementById("fpAim").textContent));
  for (let i = 0; i < 14; i++) {
    await pg.keyboard.press("KeyF");
    await pg.waitForTimeout(1500);
    const s = await pg.evaluate(([a]) => { const t = App.pop.agent[a]; const m = t && t.action && t.action.foe; return { fp: App.fpOn(), hp: t && Math.round(t.hp || 0), foeHp: m ? Math.round(m.hp) : null, weapon: !!(t && t.weaponObj), act: t && t.action && t.action.kind }; }, ids);
    log("F", i, JSON.stringify(s));
    if (i === 1) await pg.screenshot({ path: "fp_strike.png", timeout: 180000 });
    if (!s.fp || s.foeHp == null && i > 1) break;
  }
  // strafing: A moves sideways, the view does not turn
  const s0 = await pg.evaluate(([a]) => { const t = App.pop.agent[a]; return [t.pos.x, t.pos.z, t.heading]; }, ids);
  await pg.keyboard.down("KeyA"); await pg.waitForTimeout(5000); await pg.keyboard.up("KeyA");
  const s1 = await pg.evaluate(([a]) => { const t = App.pop.agent[a]; return [t.pos.x, t.pos.z, t.heading]; }, ids);
  const h = s0[2], side = (s1[0] - s0[0]) * Math.cos(h) - (s1[1] - s0[1]) * Math.sin(h), fwd = (s1[0] - s0[0]) * Math.sin(h) + (s1[1] - s0[1]) * Math.cos(h);
  log("strafe A: sideways", side.toFixed(2), "forward", fwd.toFixed(2), "heading change", (s1[2] - s0[2]).toFixed(3));
  // every kit
  for (const role of ["warrior", "mage", "healer", "tamer", "brawler"]) {
    const r = await pg.evaluate(async ([a, role]) => {
      const keep = App.combatRole; App.combatRole = () => (role === "brawler" ? null : role);
      const t = App.pop.agent[a], out = { role, bar: [...document.querySelectorAll("#fpBar .ab span")].map((e) => e.textContent).join(",") };
      const ms = App.monstersNear(t.pos.x, t.pos.z, 60).filter((m) => !m.dead);
      if (ms.length) { const m = ms[0]; t.pos.x = m.x; t.pos.z = m.z - 2; t.heading = 0; }
      const hp0 = ms.map((m) => m.hp), x0 = t.pos.x, z0 = t.pos.z;
      t.hp = 20; t.hpMax = 100; t.hpAt = App.st.T;
      for (const k of ["F", "Q", "G", "R"]) {
        window.dispatchEvent(new KeyboardEvent("keydown", { code: "Key" + k, key: k.toLowerCase(), bubbles: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "Key" + k, key: k.toLowerCase(), bubbles: true }));
        await new Promise((res) => setTimeout(res, 2500));
      }
      out.dmg = ms.map((m, i) => Math.round(hp0[i] - m.hp)).join(",");
      out.moved = Math.hypot(t.pos.x - x0, t.pos.z - z0).toFixed(1);
      out.hp = Math.round(t.hp);
      out.cds = Object.keys((t.action && t.action.cds) || {}).join("");
      out.cool = document.querySelectorAll("#fpBar .ab.cool").length;
      App.combatRole = keep;
      return out;
    }, [ids[0], role]);
    log(JSON.stringify(r));
    if (role === "mage") await pg.screenshot({ path: "fp_bar.png", timeout: 180000 });
  }
};
