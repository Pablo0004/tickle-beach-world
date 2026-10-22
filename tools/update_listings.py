"""Refresh the list of Tickles up for sale (js/listings.js) from OpenSea.

While a Tickle is listed for sale it lives in the prison (js/prison.js). Listings are not on the chain: they live on
the marketplaces, so this reads OpenSea's API, which needs an API key of your own (free, from OpenSea's developer
portal). The key is read from the environment and is never written anywhere:

    set OPENSEA_API_KEY=...                       (Windows; on macOS or Linux: export OPENSEA_API_KEY=...)
    python tools/update_listings.py               read every active listing and write js/listings.js
    python tools/update_listings.py --check       read them and say how many, writing nothing
    python tools/update_listings.py --slug NAME   the collection's name on OpenSea, if it cannot be found from the contract

It also bumps the cache-buster of listings.js in index.html so browsers load the new file. Only the Python standard
library is needed.
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

CONTRACT = "0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce"   # Tickle Beach (TCKL), Ethereum mainnet
SUPPLY = 9629
API = "https://api.opensea.io/api/v2"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "js", "listings.js")
INDEX = os.path.join(ROOT, "index.html")


def get(path, key, params=None, tries=8):
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"accept": "application/json", "x-api-key": key, "user-agent": "tickle-world-listings/1"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                sys.exit("OpenSea refused the key (%d): check OPENSEA_API_KEY." % e.code)
            if e.code == 404:
                return None
            if k == tries - 1:
                raise
            time.sleep(2 * (k + 1))  # 429 "slow down", or a hiccup: wait longer each time and try again
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(2 * (k + 1))


def slug_of(key):
    c = get("/chain/ethereum/contract/" + CONTRACT, key)
    return c and c.get("collection")


def listed_ids(key, slug):
    ids, nxt, pages = set(), None, 0
    while True:
        params = {"limit": 100}
        if nxt:
            params["next"] = nxt
        res = get("/listings/collection/%s/all" % slug, key, params) or {}
        for L in res.get("listings", []):
            offer = (((L.get("protocol_data") or {}).get("parameters") or {}).get("offer")) or []
            for o in offer:
                if str(o.get("token", "")).lower() == CONTRACT:
                    try:
                        i = int(o.get("identifierOrCriteria"))
                    except (TypeError, ValueError):
                        continue
                    if 0 <= i < SUPPLY:
                        ids.add(i)
        pages += 1
        print("\r  %d pages read, %d Tickles listed so far" % (pages, len(ids)), end="", flush=True)
        nxt = res.get("next")
        if not nxt:
            break
        time.sleep(0.5)
    print()
    return sorted(ids)


def main():
    key = os.environ.get("OPENSEA_API_KEY", "").strip()
    if not key:
        sys.exit("Set OPENSEA_API_KEY to your OpenSea API key first (it is read from the environment, never stored).")
    slug = sys.argv[sys.argv.index("--slug") + 1] if "--slug" in sys.argv else slug_of(key)
    if not slug:
        sys.exit("Could not find the collection on OpenSea from the contract; give its name with --slug.")
    print("Reading the active listings of '%s' on OpenSea..." % slug)
    ids = listed_ids(key, slug)
    print("%d Tickles are listed for sale." % len(ids))
    if "--check" in sys.argv:
        return
    date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    snap = {"date": date, "source": "OpenSea", "ids": ids}
    text = ("/* The Tickles listed for sale on the marketplaces, read by tools/update_listings.py (it needs an OpenSea API key).\n"
            " * A snapshot of %s: run the tool again to refresh it. While a Tickle is listed it lives in the prison (prison.js). */\n" % date +
            "(function (G) {\n  \"use strict\";\n  const TB = (G.TB = G.TB || {});\n  TB.LISTINGS = " + json.dumps(snap, separators=(",", ":")) + ";\n})(typeof self !== \"undefined\" ? self : this);\n")
    open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    html = open(INDEX, encoding="utf-8", newline="").read()
    m = re.search(r"js/listings\.js\?v=(\d+)", html)
    if m:
        html = html.replace(m.group(0), "js/listings.js?v=%d" % (int(m.group(1)) + 1), 1)
        open(INDEX, "w", encoding="utf-8", newline="").write(html)
    print("Wrote js/listings.js: %d Tickles up for sale (%s)." % (len(ids), date))


if __name__ == "__main__":
    main()
