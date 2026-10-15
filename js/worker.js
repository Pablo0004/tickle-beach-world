/* Voxelization worker: turns on-chain Tickles, on-chain pieces and AI/procedural strokes into meshes. */
importScripts("data.js?v=103", "keccak.js?v=103", "tickle-core.js?v=169", "sdf.js?v=103");

// keep only the voxels on one side of x = 0 (SDF units), e.g. the right arm out of a mirrored pair
function keepX(vox, pred) {
  const P = vox.positions, C = vox.colors, v = vox.voxel, ox = vox.origin[0];
  const pos = [], col = [];
  for (let i = 0; i < vox.count; i++) if (pred(ox + (P[3 * i] + 0.5) * v)) { pos.push(P[3 * i], P[3 * i + 1], P[3 * i + 2]); col.push(C[3 * i], C[3 * i + 1], C[3 * i + 2]); }
  const inner = [], IN = vox.inner || [];
  for (let i = 0; i < IN.length; i += 4) if (pred(ox + (IN[i] + IN[i + 3] / 2) * v)) inner.push(IN[i], IN[i + 1], IN[i + 2], IN[i + 3]);
  return Object.assign({}, vox, { count: pos.length / 3, positions: Int16Array.from(pos), colors: Float32Array.from(col), inner: Int16Array.from(inner) });
}

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
    if (type === "character") {
      const seed = TB.seedOf(ev.data.token);
      const T = TB.tickleLayers(seed, ev.data.outfit), opt = { voxel: ev.data.voxel || 10, colors: TB.colorOf };
      const sp = ev.data.arms ? TB.splitArms(T.character) : null;
      if (sp && sp.arm.length && sp.shoulder) {
        // body, right arm (the left is drawn as its mirror image) and what each paw holds
        const right = keepX(TB.voxelize(TB.compile(sp.arm), opt), (x) => x >= 0);
        out = { mesh: meshOf(TB.voxelize(TB.compile(sp.body), opt), transfer), arm: right.count ? meshOf(right, transfer) : null,
          shoulder: sp.shoulder, paw: sp.paw, traits: T.traits, anchor: T.anchor, seed };
        if (sp.item.length) {
          const it = TB.voxelize(TB.compile(sp.item), opt), L = keepX(it, (x) => x < 0), R = keepX(it, (x) => x >= 0);
          out.itemL = L.count ? meshOf(L, transfer) : null; out.itemR = R.count ? meshOf(R, transfer) : null;
        }
      } else {
        const vox = TB.voxelize(TB.compile(T.character), opt);
        out = { mesh: meshOf(vox, transfer), traits: T.traits, anchor: T.anchor, seed };
      }
    } else if (type === "ground") {
      const vox = TB.voxelize(TB.compile(TB.groundLayers(ev.data.index, ev.data.theme)), { voxel: ev.data.voxel || 10, colors: TB.colorOf });
      out = { mesh: meshOf(vox, transfer) };
    } else if (type === "fragment") {
      const layers = TB.fragmentLayers(ev.data.key);
      if (ev.data.theme != null) TB.recolor(layers, ev.data.theme);
      const vox = TB.voxelize(TB.compile(layers), { voxel: ev.data.voxel || 10, colors: TB.colorOf });
      out = { mesh: meshOf(vox, transfer), count: vox.count };
    } else if (type === "compact") {
      const layers = TB.fromCompact(ev.data.strokes, ev.data.part || "prop");
      const vox = TB.voxelize(TB.compile(layers), { voxel: ev.data.voxel || 8, colors: TB.colorOf, lip: ev.data.lip });
      const mesh = meshOf(vox, transfer);
      out = { mesh, vox: { count: vox.count, positions: vox.positions, voxel: vox.voxel, origin: vox.origin } };
      transfer.push(vox.positions.buffer);
    } else throw new Error("unknown job " + type);
    self.postMessage({ id, ok: true, out, ms: Date.now() - t0 }, transfer);
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.stack) || e) });
  }
};
