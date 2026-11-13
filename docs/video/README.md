# Video assets

`mnemosyne-demo-reel-30s.mp4` is the 9:16 narrated reel with an original synthesized score. `reel-narration.md`, `reel-storyboard.md`, and `reel-music-license.txt` document its narration, cuts, and music provenance. The separately available `mnemosyne-demo-30-minute-walkthrough.mp4` is a 16:9 narrated walkthrough with the transcript in `narration.md` and chapter guide in `storyboard.md`.

To regenerate the reel, run `build-reel-voice.ps1` and `node build-reel.mjs` from this directory. The voice builder uses the installed Microsoft Zira Desktop voice. The reel builder uses the repository's `sharp` dependency. FFmpeg must be available on `PATH`, or set the `FFMPEG_BIN` environment variable to its executable. To regenerate the long version, run `build-voice.ps1`, `node build-slides.mjs`, and `node assemble-video.mjs` in that order.
