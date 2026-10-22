/* The Tickles listed for sale on the marketplaces, read by tools/update_listings.py (it needs an OpenSea API key).
 * A snapshot: run the tool again to refresh it. While a Tickle is listed it lives in the prison (prison.js). */
(function (G) {
  "use strict";
  const TB = (G.TB = G.TB || {});
  TB.LISTINGS = { date: "", source: "", ids: [] };
})(typeof self !== "undefined" ? self : this);
