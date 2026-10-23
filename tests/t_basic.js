module.exports = async (pg, log) => {
  await pg.waitForTimeout(8000);
  const r = await pg.evaluate(() => { const A = App; return { T: A.st.T, tickles: A.st.tickles.length, villages: A.villages.length, layout: A.layoutTag || null, kinds: A.villages.reduce((m, v) => (m[v.kind || v.type || '?'] = (m[v.kind || v.type || '?'] || 0) + 1, m), {}) }; });
  log(JSON.stringify(r));
  await pg.screenshot({ path: 'basic.png' });
};
