const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  const before = await pg.evaluate(() => {
    const N = TB.SUPPLY, owners = []; for (let id = 0; id < N; id++) owners.push(App.ownerOf(id));
    const plots = {}; for (const v of App.villages) if (v.holder) plots[v.holder] = Math.round(v.x) + ',' + Math.round(v.z) + ':' + v.kind;
    const towns = {}; for (const v of App.villages) if (v.kind === 'town') for (const id of v.residents) towns[App.ownerOf(id)] = Math.round(v.x) + ',' + Math.round(v.z) + '#' + Math.round(v.homes[v.residents.indexOf(id)].hx) + ',' + Math.round(v.homes[v.residents.indexOf(id)].hz);
    return { owners, plots, towns, block: TB.OWNERS.block, nv: App.villages.length, T: App.st.T };
  });
  const big = Object.entries(before.plots).find(([a, k]) => k.endsWith('citadel'))[0];
  const owners = before.owners.slice();
  // 30 of the biggest holder's Tickles go to a newcomer; 6 more change hands between small holders
  let moved = 0; for (let id = 0; id < owners.length && moved < 30; id++) if (owners[id] === big) { owners[id] = '0x1111111111111111111111111111111111111111'; moved++; }
  const smalls = Object.keys(before.towns).filter(Boolean).slice(0, 2);
  let m2 = 0; for (let id = 0; id < owners.length && m2 < 2; id++) if (owners[id] === smalls[0]) { owners[id] = smalls[1]; m2++; }
  log('big', big, 'smalls', smalls.join(' '), 'moved', moved, m2);
  let calls = 0, refused = 0;
  await pg.route('https://ethereum-rpc.publicnode.com/**', async (r) => {
    const body = JSON.parse(r.request().postData());
    calls++;
    if (Array.isArray(body) && refused < 2) { refused++; return r.fulfill({ status: 429, body: 'slow down' }); }
    const one = (q) => q.method === 'eth_blockNumber' ? { jsonrpc: '2.0', id: q.id, result: '0x' + (before.block + 5000).toString(16) } : { jsonrpc: '2.0', id: q.id, result: owners[q.id] ? '0x' + owners[q.id].slice(2).padStart(64, '0') : '0x' };
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.isArray(body) ? body.map(one) : one(body)) });
  });
  await pg.click('#t-holders');
  await pg.waitForTimeout(1500);
  await pg.click('#ownersUpdate');
  await pg.waitForFunction(() => /changed hands|Could not/.test(document.getElementById('ownersNote').textContent), null, { timeout: 300000 });
  log('note:', await pg.evaluate(() => document.getElementById('ownersNote').textContent), 'calls', calls);
  await pg.click('#ownersReload');
  await pg.waitForTimeout(3000);
  await pg.waitForFunction(() => window.App && document.getElementById('loading') && document.getElementById('loading').hidden, null, { timeout: 300000 });
  await pg.waitForTimeout(5000);
  const after = await pg.evaluate(([big]) => {
    const plots = {}; for (const v of App.villages) if (v.holder) plots[v.holder] = Math.round(v.x) + ',' + Math.round(v.z) + ':' + v.kind;
    const towns = {}; for (const v of App.villages) if (v.kind === 'town') for (const id of v.residents) towns[App.ownerOf(id)] = Math.round(v.x) + ',' + Math.round(v.z) + '#' + Math.round(v.homes[v.residents.indexOf(id)].hx) + ',' + Math.round(v.homes[v.residents.indexOf(id)].hz);
    const nb = App.villages.find(v => v.holder === '0x1111111111111111111111111111111111111111');
    return { info: App.ownersInfo(), plots, towns, nv: App.villages.length, T: App.st.T, newcomer: nb ? [nb.i, nb.kind, nb.residents.length, nb.name] : null, big: (() => { const v = App.villages.find(v => v.holder === big); return v ? [v.i, v.kind, v.residents.length] : null; })() };
  }, [big]);
  let same = 0, diff = [];
  for (const a in before.plots) if (after.plots[a] === before.plots[a]) same++; else diff.push(a.slice(0, 8) + ' ' + before.plots[a] + ' -> ' + after.plots[a]);
  let tsame = 0, tdiff = []; for (const a in before.towns) if (after.towns[a] === before.towns[a]) tsame++; else tdiff.push(String(a).slice(0,8) + ' ' + before.towns[a] + ' -> ' + after.towns[a]);
  log(JSON.stringify({ info: after.info, nv: [before.nv, after.nv], T: [before.T, after.T], newcomer: after.newcomer, big: after.big, plotsSame: same, plotsDiff: diff, townsSame: tsame, townsDiff: tdiff }));
};
