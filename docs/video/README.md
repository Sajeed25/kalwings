# Walkthrough video

`KALWINGS-Walkthrough.mp4` (about 6 minutes, 1280x720, animated captions, no voiceover) walks through the staff guide and the developer overview in the manual. `narration.md` is a script to read over it.

How it is made: clean screenshots and the position of every highlighted element are captured from a seeded dev server (`CLEAN=1 node docs/manual/shots.mjs` writes `docs/manual/img-clean/` and `boxes.json`). `video.html` animates them (camera zoom, highlight boxes, cursor and click ripple, captions, diagrams) using `scenes.json`, and `record.mjs` records the page with Playwright and encodes MP4 with ffmpeg.

To change the video, edit `scenes.json` (captions, order) and run `CHROMIUM_PATH=... node docs/video/record.mjs`. The recording runs in real time (about 7 minutes). The MP4 is not committed (size); regenerate it or share the file directly. Demo data only, never real people.
