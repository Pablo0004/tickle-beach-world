/* Little synthesized sounds (no audio files): the scream of a Tickle sent flying, and the noises
 * animals make when thrown. Built with Web Audio when the player does something, so the browser
 * allows them. Two volumes (Menu > Sound): effects (screams, crashes, bells, punches, cheers, what you
 * throw) and ambience (frogs, birdsong, the anvils, hooves); each can be turned off. */
(function () {
  "use strict";
  const App = window.App;
  let ctx = null;
  // the two volumes, remembered in this browser
  const VOL = { fx: 0.8, amb: 0.7 }, ON = { fx: true, amb: true };
  try {
    for (const k of ["fx", "amb"]) { const v = parseFloat(localStorage.getItem("tickle-" + k + "-vol")); if (v >= 0 && v <= 1) VOL[k] = v; if (localStorage.getItem("tickle-" + k + "-on") === "0") ON[k] = false; }
  } catch (e) { /* storage blocked */ }
  const BUS = {};
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC();
      for (const k of ["fx", "amb"]) { BUS[k] = ctx.createGain(); BUS[k].gain.value = ON[k] ? VOL[k] : 0; BUS[k].connect(ctx.destination); }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // where sounds go: effects or ambience, or through a volume set for one call (a distant croak is quieter)
  let DEST = null, BUSNOW = "fx";
  const dest = (c) => DEST || BUS[BUSNOW] || c.destination;
  const setVol = (k) => { if (BUS[k]) BUS[k].gain.setTargetAtTime(ON[k] ? VOL[k] : 0, ctx.currentTime, 0.05); };
  function env(g, t, peak, attack, hold, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }
  // a voice: a buzzy tone through two vowel filters, with vibrato
  function voice(c, t, f0, curve, dur, vowel, vol, vib) {
    const osc = c.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f0 * curve[0], t);
    for (let i = 1; i < curve.length; i++) osc.frequency.exponentialRampToValueAtTime(f0 * curve[i], t + (dur * i) / (curve.length - 1));
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = vib || 6.5; lg.gain.value = f0 * 0.045;
    lfo.connect(lg).connect(osc.frequency);
    const out = c.createGain();
    env(out, t, vol, 0.03, dur * 0.55, dur * 0.42);
    for (const [f, q] of vowel) { const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q; osc.connect(bp).connect(out); }
    out.connect(dest(c));
    osc.start(t); lfo.start(t); osc.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  const AAH = [[820, 5], [1250, 7], [2600, 9]];
  // a burst of filtered noise (crashes, punches)
  function noise(c, t, dur, freq, q, vol) {
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "lowpass"; f.frequency.value = freq; f.Q.value = q || 1; g.gain.value = vol;
    src.connect(f).connect(g).connect(dest(c));
    src.start(t);
  }
  function tone(c, t, f0, dur, vol, type) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = f0;
    env(g, t, vol, 0.005, 0.02, dur);
    o.connect(g).connect(dest(c));
    o.start(t); o.stop(t + dur + 0.05);
  }
  App.sfx = {
    // "Aaaaah!": pitch set by the Tickle, rising with the throw then falling away as it flies off
    scream(id, strength) {
      const c = audio(); if (!c) return;
      const t = c.currentTime + 0.01, f0 = 330 + ((id * 2654435761) >>> 0) % 260, dur = 0.9 + Math.min(0.6, (strength || 1) * 0.02);
      voice(c, t, f0, [1.05, 1.45, 1.3, 0.75], dur, AAH, 0.32, 7.5);
    },
    // an animal's call: an effect (thrown, caught), or ambience (bus "amb": frogs, the forge, hooves)
    animal(kind, vol, bus) {
      const c = audio(); if (!c) return;
      const b = bus === "amb" ? "amb" : "fx";
      if (!ON[b]) return;
      BUSNOW = b;
      if (vol != null && vol !== 1) { DEST = c.createGain(); DEST.gain.value = vol; DEST.connect(BUS[b]); }
      try { this.call(c, kind); } finally { DEST = null; BUSNOW = "fx"; }
    },
    // the volumes (Menu > Sound): kind "fx" or "amb"
    volume(k, v) { if (v == null) return VOL[k]; VOL[k] = Math.max(0, Math.min(1, v)); try { localStorage.setItem("tickle-" + k + "-vol", String(VOL[k])); } catch (e) { /* storage blocked */ } setVol(k); return VOL[k]; },
    enabled(k, on) { if (on == null) return ON[k]; ON[k] = !!on; try { localStorage.setItem("tickle-" + k + "-on", on ? "1" : "0"); } catch (e) { /* storage blocked */ } setVol(k); return ON[k]; },
    // for birdsong (birds.js): the context and the ambience bus, once sound is allowed
    ambient() { const c = audio(); return c && ON.amb ? { ctx: c, bus: BUS.amb } : null; },
    call(c, kind) {
      const t = c.currentTime + 0.01;
      if (kind === "pig") voice(c, t, 520, [1, 1.6, 1.2, 1.7, 0.9], 0.6, [[900, 4], [2200, 6]], 0.3, 11);
      else if (kind === "chicken") for (let k = 0; k < 3; k++) voice(c, t + k * 0.13, 680 + k * 60, [1, 1.3, 0.9], 0.1, [[1400, 3], [2800, 5]], 0.22, 20);
      else if (kind === "sheep" || kind === "deer") voice(c, t, kind === "sheep" ? 300 : 480, [1, 1.05, 1, 0.95], 0.7, [[700, 5], [1500, 6]], 0.26, 17);
      else if (kind === "boar") voice(c, t, 110, [1, 0.8, 1.1, 0.7], 0.45, [[400, 3], [900, 4]], 0.35, 25);
      // the creatures
      else if (kind === "griffin") { voice(c, t, 900, [0.9, 1.5, 1.2, 0.7], 0.55, [[1800, 4], [3200, 6]], 0.28, 9); noise(c, t, 0.3, 4000, 0.7, 0.08); }
      else if (kind === "cinderling") { for (let k = 0; k < 6; k++) noise(c, t + k * 0.05 + Math.random() * 0.03, 0.05, 5000, 2, 0.22); noise(c, t + 0.3, 0.5, 7000, 0.5, 0.1); }
      else if (kind === "bubblefin") for (let k = 0; k < 5; k++) { const o = c.createOscillator(), g = c.createGain(), tt = t + k * 0.09; o.type = "sine"; o.frequency.setValueAtTime(300 + k * 90, tt); o.frequency.exponentialRampToValueAtTime(900 + k * 120, tt + 0.07); env(g, tt, 0.2, 0.005, 0.03, 0.05); o.connect(g).connect(dest(c)); o.start(tt); o.stop(tt + 0.12); }
      else if (kind === "mossling") voice(c, t, 260, [1, 1.15, 1.05, 0.9], 0.7, [[450, 4], [800, 5]], 0.22, 4);
      else if (kind === "pebblit") { voice(c, t, 150, [1, 0.85, 1, 0.8], 0.35, [[500, 3], [1100, 4]], 0.3, 18); for (let k = 0; k < 3; k++) noise(c, t + 0.1 + k * 0.08, 0.06, 1500, 1, 0.3); }
      else if (kind === "zapbug") { const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); o.type = "square"; o.frequency.value = 220; l.frequency.value = 38; lg.gain.value = 120; l.connect(lg).connect(o.frequency); env(g, t, 0.12, 0.01, 0.35, 0.2); o.connect(g).connect(dest(c)); o.start(t); l.start(t); o.stop(t + 0.7); l.stop(t + 0.7); noise(c, t + 0.05, 0.15, 9000, 0.5, 0.2); }
      else if (kind === "lumoth") { const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(1600, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.8); l.frequency.value = 22; lg.gain.value = 0.12; l.connect(lg).connect(g.gain); env(g, t, 0.16, 0.02, 0.5, 0.3); o.connect(g).connect(dest(c)); o.start(t); l.start(t); o.stop(t + 0.9); l.stop(t + 0.9); }
      // the monsters
      else if (kind === "gloomslime") { voice(c, t, 180, [1.2, 0.9, 0.6, 0.5], 0.6, [[300, 2], [700, 3]], 0.32, 3); noise(c, t + 0.05, 0.35, 600, 4, 0.3); }
      else if (kind === "shadebat") for (let k = 0; k < 4; k++) { const tt = t + k * 0.07; const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(3200 - k * 200, tt); o.frequency.exponentialRampToValueAtTime(2200, tt + 0.05); env(g, tt, 0.14, 0.003, 0.02, 0.04); o.connect(g).connect(dest(c)); o.start(tt); o.stop(tt + 0.08); }
      else if (kind === "brutecap") { voice(c, t, 85, [1, 1.2, 0.9, 0.6], 0.8, [[300, 2], [650, 3]], 0.45, 12); noise(c, t, 0.6, 300, 1, 0.3); }
      // the pond and lake animals
      else if (kind === "duck") for (let k = 0; k < 2; k++) voice(c, t + k * 0.2, 430, [1, 0.88, 0.8], 0.18, [[950, 4], [1900, 6]], 0.3, 14);
      else if (kind === "fish" || kind === "koi") { for (let k = 0; k < 3; k++) { const o = c.createOscillator(), g = c.createGain(), tt = t + k * 0.11; o.type = "sine"; o.frequency.setValueAtTime(260 + k * 70, tt); o.frequency.exponentialRampToValueAtTime(700 + k * 90, tt + 0.08); env(g, tt, 0.22, 0.005, 0.03, 0.06); o.connect(g).connect(dest(c)); o.start(tt); o.stop(tt + 0.13); } noise(c, t + 0.3, 0.25, 3000, 0.7, 0.12); }
      else if (kind === "swan") for (let k = 0; k < 2; k++) voice(c, t + k * 0.32, 340, [1, 1.12, 0.94], 0.38, [[720, 3], [1450, 5]], 0.3, 6);
      else if (kind === "frog") for (let k = 0; k < 2; k++) { voice(c, t + k * 0.17, 150, [1, 1.35, 0.85], 0.11, [[480, 6], [1150, 8]], 0.36, 34); noise(c, t + k * 0.17, 0.08, 900, 3, 0.08); }
      else if (kind === "turtle") { noise(c, t, 0.5, 2600, 0.6, 0.16); voice(c, t + 0.1, 115, [1, 0.9, 0.8], 0.3, [[350, 3], [800, 4]], 0.2, 8); }
      else if (kind === "heron") { voice(c, t, 270, [1, 0.82, 0.68], 0.36, [[620, 2], [1500, 3]], 0.36, 42); noise(c, t, 0.3, 1800, 1.5, 0.1); }
      else if (kind === "otter") for (let k = 0; k < 4; k++) { const o = c.createOscillator(), g = c.createGain(), tt = t + k * 0.09; o.type = "triangle"; o.frequency.setValueAtTime(1700 + k * 120, tt); o.frequency.exponentialRampToValueAtTime(2500, tt + 0.06); env(g, tt, 0.16, 0.004, 0.02, 0.05); o.connect(g).connect(dest(c)); o.start(tt); o.stop(tt + 0.09); }
      // the anvil at the Blacksmiths' Guild: a bright ring over a dull thud
      else if (kind === "anvil") { tone(c, t, 1560, 0.5, 0.16, "triangle"); tone(c, t, 2340, 0.35, 0.07); tone(c, t, 3720, 0.22, 0.04); noise(c, t, 0.06, 2500, 1, 0.25); }
      else if (kind === "horse") { voice(c, t, 620, [0.9, 1.5, 1.35, 1.2, 0.8], 0.9, [[1100, 4], [2400, 6]], 0.3, 13); noise(c, t + 0.7, 0.3, 1200, 1, 0.12); }
      else if (kind === "kraken" || kind === "serpent") { voice(c, t, kind === "kraken" ? 60 : 95, [1, 1.3, 0.9, 0.6], 1.3, [[220, 2], [480, 3]], 0.5, 6); noise(c, t, 1.0, 600, 0.7, 0.3); }
      else if (kind === "boat") { noise(c, t, 0.35, 700, 1.2, 0.35); tone(c, t, 140, 0.25, 0.2, "sine"); }
      else if (kind === "thunder") { noise(c, t, 0.25, 3000, 0.8, 0.35); noise(c, t + 0.05, 2.6, 260, 0.8, 0.9); noise(c, t + 0.6, 1.8, 140, 1, 0.6); tone(c, t + 0.1, 48, 1.6, 0.35, "sine"); }
      else if (kind === "hoof") { noise(c, t, 0.04, 900, 2, 0.3); tone(c, t, 240, 0.06, 0.12); }
      else if (kind === "dragon") { voice(c, t, 70, [1, 1.4, 1.1, 0.6], 1.4, [[260, 2], [520, 3], [1200, 4]], 0.5, 9); noise(c, t, 1.2, 800, 0.8, 0.35); }
    },
    // a building or tree coming apart
    crash(scale) {
      const c = audio(); if (!c) return;
      const t = c.currentTime + 0.01, k = scale || 1;
      noise(c, t, 0.9 * k, 900, 0.7, 0.5 * k);
      noise(c, t + 0.08, 0.5 * k, 2600, 0.5, 0.18 * k);
      tone(c, t, 70, 0.5, 0.4 * k, "sine");
    },
    // the boxing bell: one ring to start, three to end
    bell(times) {
      const c = audio(); if (!c) return;
      for (let i = 0; i < (times || 1); i++) { const t = c.currentTime + 0.01 + i * 0.28; tone(c, t, 1180, 1.1, 0.22); tone(c, t, 2950, 0.7, 0.08); tone(c, t, 590, 0.9, 0.06); }
    },
    punch() {
      const c = audio(); if (!c) return;
      const t = c.currentTime + 0.01;
      noise(c, t, 0.12, 700, 1, 0.45);
      tone(c, t, 95, 0.12, 0.35, "sine");
    },
  };
})();
