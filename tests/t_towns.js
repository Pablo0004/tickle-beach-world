module.exports = async (pg, log) => {
  const r = await pg.evaluate(() => {
    var besideN = 0; let worst = 0, pairs = 0, over = 0, n = 0, overlaps = 0; const ex = [];
    for (const v of App.villages) if (v.kind === 'town') {
      for (const H of v.houses) { const d = Math.hypot(H.hx - v.x, H.hz - v.z); worst = Math.max(worst, d / v.r); if (d > v.r) { over++; ex.push([v.i, Math.round(d), v.r]); } n++; }
      for (let a = 0; a < v.houses.length; a++) for (let b = a + 1; b < v.houses.length; b++) if (Math.hypot(v.houses[a].hx - v.houses[b].hx, v.houses[a].hz - v.houses[b].hz) < 4.6) overlaps++;
      pairs += v.slots.filter(m => m && m.length >= 5).length; for (let s = 0; s < v.slots.length; s++) if (v.slots[s] && v.slots[s].length >= 5) { const hs = v.houses.filter(H => H.members.some(id => v.slots[s].includes(id))); if (hs.length === 2) { const d = Math.hypot(hs[0].hx - hs[1].hx, hs[0].hz - hs[1].hz); if (d < 6) besideN = (besideN || 0) + 1; } }
    }
    return { besideN: typeof besideN === 'undefined' ? 0 : besideN, worst: worst.toFixed(2), pairs, over, n, overlaps, ex: ex.slice(0, 8) };
  });
  log(JSON.stringify(r));
};
