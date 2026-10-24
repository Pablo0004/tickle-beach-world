// A game controller in first person (stubbed Gamepad API): left stick forward walks, right stick turns, A jumps,
// X strikes, Start leaves.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.waitForFunction(() => App.st.tickles.filter((t) => t.group && !App.isKO(t.id)).length >= 8, null, { timeout: 180000 });
  const id = await pg.evaluate(() => {
    const st = App.st; st.mode = "manual";
    const t = st.tickles.find((t) => !App.isKO(t.id) && t.group.visible && App.isLand(t.pos.x, t.pos.z));
    st.wallet = App.ownerOf(t.id); App.enterFP(t.id);
    window.__pad = { axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), connected: true, id: "stub" };
    navigator.getGamepads = () => [window.__pad];
    window.__s = [t.pos.x, t.pos.z, t.heading];
    return t.id;
  });
  const set = (axes, btn) => pg.evaluate(([axes, btn]) => { window.__pad.axes = axes; window.__pad.buttons.forEach((b, i) => (b.pressed = i === btn)); }, [axes, btn]);
  await set([0, -1, 0, 0], -1); await pg.waitForTimeout(6000);
  log("walk", await pg.evaluate((id) => { const t = App.pop.agent[id]; return Math.hypot(t.pos.x - __s[0], t.pos.z - __s[1]).toFixed(2); }, id));
  await set([0, 0, 1, 0], -1); await pg.waitForTimeout(3000);
  log("turn", await pg.evaluate((id) => (App.pop.agent[id].heading - __s[2]).toFixed(2), id));
  await set([0, 0, 0, 0], 0); await pg.waitForTimeout(2500);
  log("jumped", await pg.evaluate((id) => { const a = App.pop.agent[id].action; return !!(a && a.vy); }, id));
  await set([0, 0, 0, 0], 2); await pg.waitForTimeout(2500);
  log("X cooldown set", await pg.evaluate((id) => { const a = App.pop.agent[id].action; return !!(a && a.cds && a.cds.F); }, id));
  await set([0, 0, 0, 0], 9); await pg.waitForTimeout(2500);
  log("Start leaves", await pg.evaluate(() => !App.fpOn()));
};
