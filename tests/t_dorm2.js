const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  await pg.evaluate(() => { const cit = App.villages.find(v => v.kind === 'citadel'); const H = cit.houses[0]; App.enter(App.enterableAt(H.x, H.z), { floor: 1 }); });
  await pg.waitForTimeout(7000);
  const r = await pg.evaluate(() => {
    const out = []; const B = new THREE.Box3();
    App.inside.group.updateMatrixWorld(true);
    App.inside.group.traverse(o => { if (!o.isMesh) return; B.setFromObject(o); const s = B.getSize(new THREE.Vector3()); if (s.x > 20 || s.y > 8 || s.z > 30 || !isFinite(s.x)) out.push({ name: o.name, ud: JSON.stringify(o.userData).slice(0, 80), size: [s.x, s.y, s.z].map(v => +v.toFixed(1)), pos: [o.position.x, o.position.y, o.position.z].map(v => +v.toFixed(1)), scale: [o.scale.x, o.scale.y, o.scale.z].map(v => +v.toFixed(2)), parentScale: o.parent && o.parent.scale.x, verts: o.geometry.attributes.position.count, inst: !!o.isInstancedMesh }); });
    return out;
  });
  for (const x of r) log(JSON.stringify(x));
};
