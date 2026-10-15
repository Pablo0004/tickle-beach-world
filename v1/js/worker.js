/* Voxelization worker: turns on-chain Tickles and AI/procedural stroke models into meshes. */
importScripts("data.js", "tickle-core.js", "sdf.js");

const cache = new Map();

function meshOf(vox, transfer) {
  const m = TB.meshVoxels(vox);
  transfer.push(m.position.buffer, m.normal.buffer, m.color.buffer, m.index.buffer);
  return m;
}

self.onmessage = (ev) => {
  const { id, type } = ev.data;
  const t0 = Date.now();
  const transfer = [];
  try {
    let out;
    if (type === "tickle") {
      const { seed, voxel, homeVoxel } = ev.data;
      let T = cache.get(seed);
      if (!T) { T = TB.tickleLayers(seed); cache.set(seed, T); }
      const ch = TB.voxelize(TB.compile(T.character), { voxel, colors: TB.colorOf });
      const hm = TB.voxelize(TB.compile(T.home), { voxel: homeVoxel || voxel * 2, colors: TB.colorOf });
      out = { character: meshOf(ch, transfer), home: meshOf(hm, transfer), traits: T.traits, anchor: T.anchor };
    } else if (type === "compact") {
      const layers = TB.fromCompact(ev.data.strokes, ev.data.part || "prop");
      const vox = TB.voxelize(TB.compile(layers), { voxel: ev.data.voxel || 8, colors: TB.colorOf });
      const mesh = meshOf(vox, transfer);
      // keep the voxel list for the fidelity checks
      out = { mesh, vox: { count: vox.count, positions: vox.positions, voxel: vox.voxel, origin: vox.origin } };
      transfer.push(vox.positions.buffer);
    } else if (type === "fragment") {
      // some layers of one on-chain model, optionally recoloured with an on-chain theme
      const m = TB.repo().models[ev.data.part][ev.data.index].the;
      const layers = TB.clone(m.layers.filter((L, i) => ev.data.layers.indexOf(i) >= 0 && L.subparts.length));
      if (ev.data.theme != null) TB.recolor(layers, ev.data.theme);
      const vox = TB.voxelize(TB.compile(layers), { voxel: ev.data.voxel || 9, colors: TB.colorOf });
      out = { mesh: meshOf(vox, transfer), count: vox.count };
    } else if (type === "canonical") {
      const m = TB.repo().models[ev.data.part][ev.data.index].the;
      const vox = TB.voxelize(TB.compile(m.layers.filter((L) => L.subparts.length)), { voxel: ev.data.voxel || 8, colors: TB.colorOf });
      out = { mesh: meshOf(vox, transfer) };
    } else throw new Error("unknown job " + type);
    self.postMessage({ id, ok: true, out, ms: Date.now() - t0 }, transfer);
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.stack) || e) });
  }
};
