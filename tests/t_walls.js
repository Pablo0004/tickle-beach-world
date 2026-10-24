// Nothing walks through buildings (item 1.2b): every fortress wall has at least four gates; then, at a town, a
// keep and an arena, time runs fast and every few seconds the visible Tickles, animals and monsters standing inside a
// building's footprint are counted (a Tickle going in or out by the door is near its door; anything else is a bug).
// Screenshot arena_gates.png.
const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  log("gates per wall", JSON.stringify(await pg.evaluate(() => App.villages.filter((v) => v.walls).map((v) => v.walls.gates.length))));
  const spots = await pg.evaluate(() => {
    const out = [];
    const keep = App.villages.find((v) => v.kind === "keep"), town = App.villages.find((v) => v.kind === "town");
    const ar = (App.sceneryAll || []).find((s) => /^arena/.test(s.type));
    if (town) out.push(["town", town.x, town.z]);
    if (keep) out.push(["keep", keep.x, keep.z]);
    if (ar) out.push(["arena", ar.x, ar.z]);
    return out;
  });
  for (const [name, x, z] of spots) {
    await pg.evaluate(([x, z]) => { App.flyTo(x, z, 40); App.setSpeed(12); }, [x, z]);
    await pg.waitForTimeout(6000);
    let worst = { t: 0, a: 0, m: 0, ex: [] }, total = { t: 0, a: 0, m: 0 }, n = 0;
    for (let k = 0; k < 16; k++) {
      await pg.waitForTimeout(2000);
      const r = await pg.evaluate(() => {
        const out = { t: 0, a: 0, m: 0, ex: [] }, tx = App.cam.target.x, tz = App.cam.target.z;
        for (const t of App.st.tickles) {
          if (!t.group.visible) continue;
          const f = App.buildingAt(t.pos.x, t.pos.z);
          if (!f) continue;
          const doors = App.doorsOf(f.sc), nearDoor = doors.some((d) => Math.hypot(d.x - t.pos.x, d.z - t.pos.z) < 1.6);
          if (nearDoor && !/^arena/.test(f.sc.type)) continue;
          if (/^arena/.test(f.sc.type)) continue; // (inside an arena is where the crowd sits)
          out.t++; if (out.ex.length < 4) out.ex.push(App.nameOf(t.id) + " in " + f.sc.type + " (" + (t.action ? t.action.kind + (t.action.act ? ":" + t.action.act.id : "") : "-") + ")");
        }
        for (const an of App.animalsNear(tx, tz, 80)) if (App.buildingAt(an.x, an.z)) { out.a++; if (out.ex.length < 6) out.ex.push(an.kind + " in " + App.buildingAt(an.x, an.z).sc.type); }
        for (const m of App.monstersNear(tx, tz, 80)) if (App.buildingAt(m.x, m.z)) out.m++;
        return out;
      });
      total.t += r.t; total.a += r.a; total.m += r.m; n++;
      if (r.t + r.a > worst.t + worst.a) worst = r;
    }
    log(name, "avg inside: tickles", (total.t / n).toFixed(1), "animals", (total.a / n).toFixed(1), "monsters", (total.m / n).toFixed(1), "worst", JSON.stringify(worst));
    if (name === "arena") { await pg.evaluate(() => App.setSpeed(1)); await L.look(pg, x, z, 34, 0.6, 0.85, 6000); await L.shot(pg, "arena_gates.png"); }
  }
};
