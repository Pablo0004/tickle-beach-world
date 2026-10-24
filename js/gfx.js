/* Graphics quality (Menu > Settings): Normal, High or Ultra, kept in this browser. All keep the block textures;
 * High and Ultra add a third, finer level of detail for the models close to the camera (smaller cubes, made the
 * first time a model comes near, population.js) and the sun's shadows (world.js); Ultra goes finer and further and
 * draws at the screen's full resolution. Normal is the old look, for slower machines. */
(function () {
  "use strict";
  const App = (window.App = window.App || {});
  const LEVELS = {
    // fine: the near models' cube size against their usual one, and how close (in blocks) they use it
    normal: { label: "Normal", fine: null, shadows: 0, pixelRatio: 1.25 },
    high: { label: "High", fine: { k: 0.65, min: 6, near: 26 }, shadows: 2048, pixelRatio: 1.5 },
    ultra: { label: "Ultra", fine: { k: 0.5, min: 5, near: 40 }, shadows: 4096, pixelRatio: 2 },
  };
  App.GFX_LEVELS = LEVELS;
  const pref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const setPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  App.gfx = Object.assign({ quality: "high" }, App.gfx || {});
  const q0 = pref("tbw-gfx", "high");
  App.gfx.quality = LEVELS[q0] ? q0 : "high";
  App.gfxLevel = () => LEVELS[App.gfx.quality] || LEVELS.high;
  // change it: the near models are made again at the new size as they come near, the shadows switch on or off
  App.setQuality = (q) => {
    if (!LEVELS[q] || q === App.gfx.quality) return;
    App.gfx.quality = q;
    setPref("tbw-gfx", q);
    if (App.dropFine) App.dropFine();
    if (App.applyGfx) App.applyGfx();
    App.sceneryDirty = true;
  };
})();
