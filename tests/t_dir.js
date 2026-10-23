module.exports = async (pg, log) => {
  await pg.waitForFunction(() => App.st.tickles.length > 5, null, { timeout: 60000 });
  const r = await pg.evaluate(async () => {
    const out = [];
    for (const f of [{ type: 'event', name: 'Bonfire Night', why: 't' }, { type: 'mechanic', need: 'fun', why: 't' }, { type: 'remix', why: 't' }]) { try { const x = await App.directorRun({ force: f }); out.push(x ? (x.name || x.id) : null); } catch (e) { out.push('ERR ' + e.message); } }
    const pend = (App.st.assets || []).filter(a => a.source === 'director').map(a => a.name + ':' + a.status).concat((App.st.acts || []).filter(a => a.source === 'director').map(a => a.name + ':' + a.status)).concat((App.st.projects || []).filter(p => p.source === 'director').map(p => p.name + ':' + p.status));
    const d = Math.floor(App.st.T / 1440) + 1;
    App.st.T = d * 1440 + 961; App.parliamentTick();
    const ag = App.st.parl.agenda.items.map(i => i.kind + ':' + (i.name || i.law));
    App.st.T = d * 1440 + 1051; App.parliamentTick();
    const after = (App.st.assets || []).filter(a => a.source === 'director').map(a => a.name + ':' + a.status).concat((App.st.acts || []).filter(a => a.source === 'director').map(a => a.name + ':' + a.status)).concat((App.st.projects || []).filter(p => p.source === 'director').map(p => p.name + ':' + p.status));
    return { out, pend, ag, log: App.st.parl.log.slice(0, 3).map(L => L.name + ' ' + (L.passed ? 'PASS' : 'fail') + ' ' + L.yes + '-' + L.no), after, mode: App.st.mode };
  });
  log(JSON.stringify(r, null, 1));
};
