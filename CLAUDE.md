# Notes for Claude

Tickle Beach World: a browser voxel life sim where all 9,629 on-chain Tickle Beach NFTs live (three.js r128, plain
JavaScript, no build step). The owner talks in Spanish: answer in Spanish. Everything in the repository is in
English (code, comments and every document): the repository is shared with the collection's creator.

## Where to start

- `PENDING.md`: what is next, in the agreed order, with the plan for each item, the open questions and the
  owner's rules. Work the items in that order, one at a time.
  It is the one record of the project (what is pending, what was done and when); update it after every item.
- `README.md`: the whole game, controls, technical overview and what each file in `js/` does.
- `CHECKLIST.md`: the checklist the owner goes through at the end, when they test everything; add to it after every
  item (the owner does not want to test until the work is finished).
- `tests/README.md`: the browser test scripts (Playwright), how to run them and what each one checks. Use them
  to see a change working before publishing.

## Rules the owner has set

- Do not widen what was asked without asking; finish one item before starting the next.
- The Maker is known only by his initials, P.M.; the creator's name is not used in the game.
- The player's own Tickles are never staff of anything. No animal is one of the nine Tickle species.
- New scenery is always appended at the end of world generation (saved state is keyed by scenery index); a map
  change bumps the layout tag (`App.LAYOUT`, with `App.migrateLayout`).
- The owner's OpenSea API key stays on the owner's machine (`OPENSEA_API_KEY`); never store it.

- In first person the Tickle itself is never seen: the view is through its own eyes (said 30 October 2026).
- Everything must stay convertible to on-chain vector models like the Tickles (the SDF stroke format of the kit), in
  case the whole game is ever put on the chain: new models are strokes, never meshes or images; finer cubes are only
  a rendering resolution, and textures must be reproducible from strokes and colours (asked 28 October 2026).

## Conventions

- JavaScript files are pure ASCII: escape anything else (write `\u00b7`, not the character itself). The file-writing tool may turn escapes into
  raw characters; check with `grep -P '[^\x00-\x7F]' js/*.js`.
- Every changed script gets its `?v=N` cache-buster bumped in `index.html`.
- Some files use CRLF line endings (`index.html`, several `js/` files): keep them as
  they are (edit with the Edit tool, or Python with `newline=''`).

## Publishing

The game is published as a private claude.ai artifact: the page `index.html` with every file of `js/`, every file
of `music/` and `onchain-tickle.html` beside it (publish with `root` = the repository and those files in `files`,
about 80; on an update, only the changed ones). The game the owner plays (version 50, approved and published 24 October 2026):
https://claude.ai/artifact/Y2NNeAnZA2GCzhpAS2qC6b. Keep a preview separate from the game the owner plays (a
second artifact), and only update the game when the owner approves. Saved games live in the browser per
artifact, so a new artifact starts a new world.

The preview artifact for what comes next (it held version 50 before the owner approved it; reuse it for version
51): https://claude.ai/artifact/Q5L8KVvvTrdNaJfVrHzSA2. From a session on the owner's own computer (not the cloud), the
same Artifact tool publishes; a new session can update that preview by passing its URL (read it first).

## Working locally

No build step: serve the repository (`node tests/serve.js`, http://localhost:8765) and open it in a browser. The
browser tests need Node 18+ and Playwright with Chromium; see `tests/README.md` (optional local three.js in
`tests/vendor/`). Software WebGL in a headless browser runs at about one frame a second, so the tests wait long.

GitHub: https://github.com/Pablo0004/tickle-beach-world (`main` has version 50). Repository settings (the
description) cannot be changed from a Claude session; give the owner the text instead.
