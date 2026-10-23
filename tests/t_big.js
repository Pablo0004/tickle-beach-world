module.exports = async (pg, log) => {
  await pg.waitForFunction(() => App.farViewReady && App.farViewReady(), null, { timeout: 240000 });
  const r = await pg.evaluate(() => {
    const out = [];
    const seen = new Set();
    for (const s of App.sceneryAll) {
      if (seen.has(s.type)) continue; seen.add(s.type);
      const F = App.frag[s.type]; if (!F) continue;
      const b = F.box, w = b.max.x - b.min.x, d = b.max.z - b.min.z, h = b.max.y - b.min.y;
      if (w * d > 150) out.push([s.type, Math.round(w), Math.round(h), Math.round(d), !!s.building, !!s.tree, !!s.big, !!s.giant]);
    }
    return out;
  });
  log(JSON.stringify(r));
};
