// Independent check for walking through buildings: visible Tickles standing inside the full box of a building's
// model (its whole base, turned with it), more than two blocks from the middle of its front. Town and keep, time fast.
const L = require('/home/user/tickle-beach-world/tests/lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  for (const kind of ["town", "keep", "grand"]) {
    await pg.evaluate((kind) => { const v = App.villages.find((v) => v.kind === kind); App.flyTo(v.x, v.z, 40); App.setSpeed(12); }, kind);
    await pg.waitForTimeout(6000);
    let tot = 0, n = 0, ex = [];
    for (let k = 0; k < 16; k++) {
      await pg.waitForTimeout(2000);
      const r = await pg.evaluate(() => {
        let c = 0; const ex = [];
        const near = App.sceneryAll.filter((s) => s.building && !s.wall && !/^(fence|dock|pier|arena|dungeon|mine|trough|sty|coop|etherfield|altar|logseat|campfire|plotsign|paddock|roost|maker|gatehouse)/.test(s.type) && Math.hypot(s.x - App.cam.target.x, s.z - App.cam.target.z) < 60);
        for (const t of App.st.tickles) {
          if (!t.group.visible) continue;
          for (const s of near) {
            const F = App.frag[s.type]; if (!F) continue;
            const k = s.scale || 1, co = Math.cos(s.rot || 0), si = Math.sin(s.rot || 0), dx = t.pos.x - s.x, dz = t.pos.z - s.z;
            const lx = dx * co - dz * si, lz = dx * si + dz * co, hx = ((F.box.max.x - F.box.min.x) / 2) * k * 0.97, hz = ((F.box.max.z - F.box.min.z) / 2) * k * 0.97;
            if (Math.abs(lx) < hx && Math.abs(lz) < hz && !(lz > hz - 2.2 && Math.abs(lx) < 2)) { c++; if (ex.length < 3) ex.push(s.type + " " + (t.action ? t.action.kind + (t.action.act ? ":" + t.action.act.id : "") : "-")); break; }
          }
        }
        return { c, ex };
      });
      tot += r.c; n++; ex = ex.concat(r.ex).slice(0, 6);
    }
    log(kind, "avg clipping", (tot / n).toFixed(2), JSON.stringify(ex));
  }
};
