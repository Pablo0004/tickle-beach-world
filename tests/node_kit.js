// The game's model kit loaded in Node (no browser): const TB = require('./tests/node_kit'); TB.KIT[kind].build(v) gives
// a model's strokes. EXTRA=file.js,... loads more files from js/ after the kit.
const vm = require('vm'), fs = require('fs'), path = require('path'), root = path.join(__dirname, '..', 'js') + path.sep;
const ctx = { console, Math, Date, Set, Map, Float32Array, Int16Array, Int32Array, Uint8Array, Uint32Array, Uint16Array, Array, Object, BigInt, String, Number, JSON, performance };
ctx.self = ctx; vm.createContext(ctx);
for (const f of ['data.js', 'keccak.js', 'tickle-core.js', 'sdf.js', 'procgen.js', 'kit.js', 'kit-interior.js', 'kit-monsters.js', 'kit-myth.js', 'kit-wealth.js', ...(process.env.EXTRA ? process.env.EXTRA.split(',') : [])]) vm.runInContext(fs.readFileSync(root + f, 'utf8'), ctx, { filename: f });
module.exports = ctx.TB;
if (require.main === module) {
  const TB = ctx.TB, kind = process.argv[2], voxel = +process.argv[3] || 8;
  const t0 = Date.now();
  const layers = TB.fromCompact(TB.KIT[kind].build(TB.KIT[kind].variants[0]), 'prop');
  const vox = TB.voxelize(TB.compile(layers), { voxel, colors: TB.colorOf, lip: 1.5 });
  const m = TB.meshVoxels(vox);
  console.log(kind, 'voxel', voxel, 'count', vox.count, 'inner boxes', (vox.inner || []).length / 4, 'tris', m.index.length / 3, 'ms', Date.now() - t0);
}
