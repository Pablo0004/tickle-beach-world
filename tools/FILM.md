# The film

A video of the whole game in under three minutes, shot by a director's script inside the game (`tools/film.js`).
Nothing of it is part of the game: `index.html` does not load it.

## Recording it

1. Serve the repository with the Python dev server: `python tests/serve.py` (port 8765). It serves `film.html`,
   the game with `tools/film-hook.js` loaded first (an audio tap, so the music and the sounds go into the video),
   and takes the recording in chunks (`POST /film/<name>`), written under `film/` (ignored by git).
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
4. Keep the browser tab on view until `FILM.status` is `done` (hidden, the game stops drawing and so does the
   recording). It takes about eight minutes: a scene is set up with the recorder paused, then shot.

The recording is the game's canvas only (no menus, tags, bubbles or controls), 1920x1080 at 30 frames a second,
MP4 (H.264), with a title and fades drawn over it. The clock, the weather (clear) and the camera are the script's;
the scenes are in the order of a day. A scene whose setup fails (no war could be declared, nobody to dive...) is
skipped and the film goes on.

## The scenes

Dawn over the island (title), the Maker's statue, inside a castle, a town waking up, the lake and its ferries,
fishing (a fish on the line), a fortress, the Blacksmiths' Guild, first person on a griffin, diving, spearfishing
in first person, a sea cave, a Kraken, a dragon asleep and one attacking a village, hunting, the surf contest, the
Parliament, a party in the Great Underworld, a siege at the castle gate and the griffin riders over the walls,
taming, the arena's tournament, an Ether field at dusk, the casino, dinner by the fire, the Song Contest, the
fortress at night (end title).
