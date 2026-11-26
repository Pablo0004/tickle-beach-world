# The film

A video of the whole game in under three minutes, shot by a director's script inside the game (`tools/film.js`).
Nothing of it is part of the game: `index.html` does not load it.

## Recording it

1. Serve the repository with the Python dev server: `python tests/serve.py` (port 8765). It serves `film.html`
   (the game with `tools/film-hook.js` loaded first, stamped so that the browser never keeps a stale copy) and takes
   the recording in chunks (`POST /film/<name>`; a piece the muxer writes back over an earlier place, the size in
   the mdat header at the end, comes with `?at=<offset>` and is written there), under `film/` (ignored by git).
   The encoder needs the mp4-muxer library once, as `tools/vendor/mp4-muxer.min.js` (32 KB, from
   https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.min.js; the folder is ignored by git).
2. Open http://localhost:8765/film.html, let the world load, click once in it (the browser only plays sound after a
   click) and switch the music on if you want it in the video (Menu > Sound).
3. In the browser console:
   ```js
   const s = document.createElement("script"); s.src = "tools/film.js"; document.head.appendChild(s);
   FILM.run();                 // every scene, in order, to film/tickle-beach-world.mp4
   FILM.run(["war", "casino"]) // only some scenes
   FILM.preview("casino")      // one scene set up and played, not recorded
   FILM.status; FILM.log       // where it is, what it skipped and why
   ```
4. `FILM.status` says where it is; it takes about ten minutes. The tab may be hidden: the film is made frame by
   frame (the game stepped by the script, each frame encoded with WebCodecs and muxed into the MP4), so neither the
   screen nor real time matter, and nothing is shot while a place is still loading.

The recording is the game's canvas only (no menus, map, tags, bubbles or controls), 1920x1080 at 30 frames a
second, MP4 (H.264 and AAC), with a title and fades drawn over it; the game's own music for each place is mixed in
at the end (the sounds are not). The clock, the weather (clear) and the camera are the script's;
the scenes are in the order of a day. A scene whose setup fails (no war could be declared, nobody to dive...) is
skipped and the film goes on.

## One scene again, not the whole film

Every scene can be recorded on its own as a take, already encoded, in `film/take-<id>.bin`; the film is then put
together from the takes, with the music mixed in, in a couple of minutes:
```js
FILM.takes();                 // every scene as a take (once)
FILM.takes(["casino"]);       // only these scenes again (one that carries on from the one before it comes too)
FILM.assemble();              // film/tickle-beach-world.mp4 from the takes of every scene
```

## The scenes

Dawn over the island (title), the Maker's statue, inside a castle, a town waking up, the lake and its ferries,
fishing (a fish on the line), a fortress, first person on a griffin and then the griffin itself from the side, diving, spearfishing
in first person, a sea cave, a Kraken, a dragon asleep and one attacking a village, hunting, the surf contest, the
Parliament from outside, a party in the Great Underworld, a siege at the castle gate and the griffin riders over the walls,
taming, the arena's tournament, an Ether field at dusk, the casino, dinner by the fire, the Song Contest, the
fortress at night (end title).
