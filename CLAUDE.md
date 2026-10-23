# Notes for Claude

Tickle Beach World: a browser voxel life sim where all 9,629 on-chain Tickle Beach NFTs live (three.js r128, plain
JavaScript, no build step). The owner talks in Spanish: answer in Spanish. Code, comments, `README.md`,
`PENDING.md` and `tests/README.md` are in English; `ESTADO_Y_PENDIENTES.md` (the project log) is in Spanish.

## Where to start

- `PENDING.md`: what is next, in the agreed order, with the plan for each item, the open questions and the
  owner's rules. Work the items in that order, one at a time.
- `ESTADO_Y_PENDIENTES.md`: everything asked, done and pending, in Spanish. Update it (and `PENDING.md`) after
  every item.
- `README.md`: the whole game, controls, technical overview and what each file in `js/` does.
- `tests/README.md`: the browser test scripts (Playwright), how to run them and what each one checks. Use them
  to see a change working before publishing.

## Rules the owner has set

- Do not widen what was asked without asking; finish one item before starting the next.
- The Maker is known only by his initials, P.M.; the creator's name is not used in the game.
- The player's own Tickles are never staff of anything. No animal is one of the nine Tickle species.
- New scenery is always appended at the end of world generation (saved state is keyed by scenery index); a map
  change bumps the layout tag (`App.LAYOUT`, with `App.migrateLayout`).
- The owner's OpenSea API key stays on the owner's machine (`OPENSEA_API_KEY`); never store it.

## Conventions

- JavaScript files are pure ASCII: escape anything else (`·`). The file-writing tool may turn escapes into
  raw characters; check with `grep -P '[^\x00-\x7F]' js/*.js`.
- Every changed script gets its `?v=N` cache-buster bumped in `index.html`.
- Some files use CRLF line endings (`index.html`, `ESTADO_Y_PENDIENTES.md`, several `js/` files): keep them as
  they are (edit with the Edit tool, or Python with `newline=''`).

## Publishing

The game is published as a private claude.ai artifact: the page `index.html` with the `js/` files beside it
(publish with `root` = the repository and `files` = the changed scripts).
- Live game, version 48: https://claude.ai/artifact/DFWbM9YVoEYorTiuTKEBE4 — only update it when the owner
  approves.
- Preview of version 49: https://claude.ai/artifact/TK966ZfpzsFS9aPPxwJNo6 — update it freely for the owner to
  test.
- GitHub: https://github.com/Pablo0004/tickle-beach-world (`main` has version 49). Repository settings (the
  description) cannot be changed from a Claude session; give the owner the text instead.
