"""Refresh the game's ownership snapshot (js/owners.js) from Ethereum mainnet.

Reads ownerOf(tokenId) for every Tickle (0 to 9,628) from the Tickle Beach contract through a public node, at one
block, and writes js/owners.js in the format the game reads (TB.OWNERS: block, date, holders, index). It also bumps
the cache-buster of owners.js in index.html so browsers load the new file. The map then follows the new owners on
the next load: everyone who still fits keeps their plot (see js/geo.js).

    python tools/update_owners.py            read everything and write js/owners.js
    python tools/update_owners.py --check    read the first 50 tokens only and compare, writing nothing
    python tools/update_owners.py --rpc URL  use another node (default: https://ethereum-rpc.publicnode.com)

Only the Python standard library is needed. No key, no wallet: ownerOf() is a public read.
"""
import base64, datetime, json, os, re, struct, sys, time, urllib.request

CONTRACT = "0x6f4388602c5dd6c593bf7c9cf3128aaa2a3e09ce"   # Tickle Beach (TCKL), Ethereum mainnet
OWNER_OF = "0x6352211e"                                     # ownerOf(uint256)
SUPPLY = 9629
BATCH = 100
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "js", "owners.js")
INDEX = os.path.join(ROOT, "index.html")


def rpc(url, body, tries=8):
    data = json.dumps(body).encode()
    for k in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers={"content-type": "application/json", "user-agent": "tickle-world-owners/1"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except Exception as e:  # a busy node ("429: slow down"): wait longer each time and try again
            if k == tries - 1:
                raise
            time.sleep(1.5 * (k + 1))


def read_owners(url, ids, tag):
    owners = {}
    for a in range(0, len(ids), BATCH):
        chunk = ids[a:a + BATCH]
        body = [{"jsonrpc": "2.0", "id": i, "method": "eth_call", "params": [{"to": CONTRACT, "data": OWNER_OF + format(i, "064x")}, tag]} for i in chunk]
        res = rpc(url, body)
        if isinstance(res, dict):
            res = [res]
        for r in res:
            out = r.get("result")
            owners[r["id"]] = ("0x" + out[-40:]).lower() if out and len(out) >= 66 else None
        print("\r  read %d of %d" % (min(a + BATCH, len(ids)), len(ids)), end="", flush=True)
        time.sleep(0.35)
    print()
    return owners


def current_snapshot():
    """The snapshot that ships with the game, as a list of owners (None where none)."""
    s = open(OUT, encoding="utf-8").read()
    t = s[s.index("TB.OWNERS=") + len("TB.OWNERS="):]
    depth = 0
    for i, ch in enumerate(t):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                break
    O = json.loads(t[:i + 1])
    b = base64.b64decode(O["index"])
    idx = struct.unpack("<%dH" % (len(b) // 2), b)
    return O, [O["holders"][k] if k != 0xFFFF else None for k in idx]


def main():
    url = "https://ethereum-rpc.publicnode.com"
    if "--rpc" in sys.argv:
        url = sys.argv[sys.argv.index("--rpc") + 1]
    check = "--check" in sys.argv
    O, old = current_snapshot()
    head = rpc(url, {"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": []})
    tag = head["result"]
    block = int(tag, 16)
    print("Node %s at block %d (the game's snapshot is at block %d)." % (url, block, O["block"]))
    ids = list(range(50 if check else SUPPLY))
    got = read_owners(url, ids, tag)
    owners = [got.get(i) for i in ids]
    missing = sum(1 for o in owners if o is None)
    changed = sum(1 for i in ids if owners[i] != old[i])
    print("%d tokens read, %d without an owner, %d changed since the game's snapshot." % (len(ids), missing, changed))
    if check:
        return
    if missing > SUPPLY * 0.05:
        sys.exit("Too many answers missing (%d): the node may be refusing; try again later or with --rpc." % missing)
    holders = sorted(set(o for o in owners if o))
    pos = {h: k for k, h in enumerate(holders)}
    index = base64.b64encode(struct.pack("<%dH" % SUPPLY, *[pos[o] if o else 0xFFFF for o in owners])).decode()
    date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    snap = {"block": block, "date": date, "holders": holders, "index": index}
    text = ("/* ownerOf() for every Tickle, read from Ethereum mainnet at block %d (%s UTC). A snapshot: refresh it with "
            "tools/update_owners.py to see later transfers. */\n" % (block, date) +
            "(function(G){const TB=(G.TB=G.TB||{});TB.OWNERS=" + json.dumps(snap, separators=(",", ":")) + ";})(typeof self!=='undefined'?self:this);\n")
    open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    html = open(INDEX, encoding="utf-8").read()
    m = re.search(r"js/owners\.js\?v=(\d+)", html)
    if m:
        html = html.replace(m.group(0), "js/owners.js?v=%d" % (int(m.group(1)) + 1), 1)
        open(INDEX, "w", encoding="utf-8").write(html)
    print("Wrote js/owners.js: %d wallets hold the %d Tickles (block %d, %s)." % (len(holders), SUPPLY - missing, block, date))


if __name__ == "__main__":
    main()
