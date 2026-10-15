/* keccak256 (Ethereum flavour) and the contract's seed formula:
 * seed(tokenId) = uint256(keccak256(abi.encodePacked(toString(tokenId), randomKey)))
 * with randomKey = "i want to hold your hand" (public on the renderer 0x1D44...1714). */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});
  const RC = [
    [0x00000001, 0x00000000], [0x00008082, 0x00000000], [0x0000808a, 0x80000000], [0x80008000, 0x80000000],
    [0x0000808b, 0x00000000], [0x80000001, 0x00000000], [0x80008081, 0x80000000], [0x00008009, 0x80000000],
    [0x0000008a, 0x00000000], [0x00000088, 0x00000000], [0x80008009, 0x00000000], [0x8000000a, 0x00000000],
    [0x8000808b, 0x00000000], [0x0000008b, 0x80000000], [0x00008089, 0x80000000], [0x00008003, 0x80000000],
    [0x00008002, 0x80000000], [0x00000080, 0x80000000], [0x0000800a, 0x00000000], [0x8000000a, 0x80000000],
    [0x80008081, 0x80000000], [0x00008080, 0x80000000], [0x80000001, 0x00000000], [0x80008008, 0x80000000],
  ];
  // rotation offsets r[x][y]
  const ROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
  function rot(lo, hi, n, out) {
    if (n === 0) { out[0] = lo; out[1] = hi; return; }
    if (n === 32) { out[0] = hi; out[1] = lo; return; }
    if (n < 32) { out[0] = (lo << n) | (hi >>> (32 - n)); out[1] = (hi << n) | (lo >>> (32 - n)); }
    else { n -= 32; out[0] = (hi << n) | (lo >>> (32 - n)); out[1] = (lo << n) | (hi >>> (32 - n)); }
  }
  const C = new Uint32Array(10), Dd = new Uint32Array(10), B = new Uint32Array(50), t = [0, 0];
  function keccakF(s) {
    for (let r = 0; r < 24; r++) {
      for (let x = 0; x < 5; x++) {
        C[2 * x] = s[2 * x] ^ s[2 * x + 10] ^ s[2 * x + 20] ^ s[2 * x + 30] ^ s[2 * x + 40];
        C[2 * x + 1] = s[2 * x + 1] ^ s[2 * x + 11] ^ s[2 * x + 21] ^ s[2 * x + 31] ^ s[2 * x + 41];
      }
      for (let x = 0; x < 5; x++) {
        const p = (x + 4) % 5, q = (x + 1) % 5;
        rot(C[2 * q], C[2 * q + 1], 1, t);
        Dd[2 * x] = C[2 * p] ^ t[0]; Dd[2 * x + 1] = C[2 * p + 1] ^ t[1];
      }
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const i = 2 * (x + 5 * y);
        s[i] ^= Dd[2 * x]; s[i + 1] ^= Dd[2 * x + 1];
      }
      for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
        const i = 2 * (x + 5 * y);
        rot(s[i], s[i + 1], ROT[x][y], t);
        const X = y, Y = (2 * x + 3 * y) % 5, j = 2 * (X + 5 * Y);
        B[j] = t[0]; B[j + 1] = t[1];
      }
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const i = 2 * (x + 5 * y), a = 2 * (((x + 1) % 5) + 5 * y), b = 2 * (((x + 2) % 5) + 5 * y);
        s[i] = B[i] ^ (~B[a] & B[b]);
        s[i + 1] = B[i + 1] ^ (~B[a + 1] & B[b + 1]);
      }
      s[0] ^= RC[r][0]; s[1] ^= RC[r][1];
    }
  }
  function keccak256(bytes) {
    const rate = 136, s = new Uint32Array(50);
    const n = bytes.length, blocks = Math.floor(n / rate) + 1;
    const padded = new Uint8Array(blocks * rate);
    padded.set(bytes);
    padded[n] ^= 0x01;
    padded[padded.length - 1] ^= 0x80;
    for (let b = 0; b < blocks; b++) {
      for (let i = 0; i < rate / 4; i++) {
        const o = b * rate + i * 4;
        s[i] ^= padded[o] | (padded[o + 1] << 8) | (padded[o + 2] << 16) | (padded[o + 3] << 24);
      }
      keccakF(s);
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) { const v = s[i]; out[4 * i] = v & 255; out[4 * i + 1] = (v >>> 8) & 255; out[4 * i + 2] = (v >>> 16) & 255; out[4 * i + 3] = (v >>> 24) & 255; }
    return out;
  }
  const enc = (str) => { const a = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 255; return a; };
  TB.RANDOM_KEY = "i want to hold your hand";
  TB.RENDERER = "0x1D442C6d1F5b8101784B44aC26512B78042D1714";
  TB.SUPPLY = 9629; // token ids 0..9628
  TB.keccak256 = keccak256;
  const seedCache = new Map();
  TB.seedOf = (id) => {
    let s = seedCache.get(id);
    if (!s) {
      const h = keccak256(enc(String(id) + TB.RANDOM_KEY));
      let hex = "";
      for (const b of h) hex += b.toString(16).padStart(2, "0");
      s = BigInt("0x" + hex).toString();
      seedCache.set(id, s);
    }
    return s;
  };
})(typeof self !== "undefined" ? self : this);
