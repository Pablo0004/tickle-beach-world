/* The film recorder's audio tap (tools/film.js). Loaded before the game by film.html (tests/serve.js), so that it
 * sees every audio graph the game builds: whatever connects to a context's speakers is also sent to a stream the
 * recorder mixes into the video. Not part of the game. */
(function () {
  "use strict";
  if (!window.AudioNode) return;
  const taps = (window.__filmAudio = { streams: [], onNew: null });
  const byCtx = new Map();
  const connect0 = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    const r = connect0.apply(this, arguments);
    if (dest && window.AudioDestinationNode && dest instanceof AudioDestinationNode) {
      const ctx = this.context;
      let d = byCtx.get(ctx);
      if (!d) { d = ctx.createMediaStreamDestination(); byCtx.set(ctx, d); taps.streams.push(d.stream); if (taps.onNew) taps.onNew(d.stream); }
      try { connect0.call(this, d); } catch (e) { /* already */ }
    }
    return r;
  };
})();
