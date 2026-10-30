# Walkthrough video

`KALWINGS-Walkthrough.mp4` (about 7.5 minutes, 1280x720, animated captions and a voiceover) walks through the staff guide and the developer overview in the manual. `narration.md` is the script that is spoken in it.

How it is made: clean screenshots and the position of every highlighted element are captured from a seeded dev server (`CLEAN=1 node docs/manual/shots.mjs` writes `docs/manual/img-clean/` and `boxes.json`). `video.html` animates them (camera zoom, highlight boxes, cursor and click ripple, captions, diagrams) using `scenes.json`, and `record.mjs` records the page with Playwright and encodes MP4 with ffmpeg.

Voiceover: `python3 docs/video/gen-audio.py MODEL_DIR` writes `narration.json` and one WAV per narrated moment (Kokoro open model, offline; MODEL_DIR holds `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx GitHub release `model-files-v1.0`; `pip install kokoro-onnx soundfile`; needs espeak-ng). `video.html` waits for each clip to finish and logs the exact page time each line starts; `mux.py` places every clip at that time (calibrated against a one-frame flash at the start of the recording) and muxes AAC audio with the H.264 video, so nothing drifts.

To change the video, edit `scenes.json` (captions, order), re-run `gen-audio.py`, then `CHROMIUM_PATH=... node docs/video/record.mjs`. The recording runs in real time (about 10 minutes). Playwright's recorder needs an ffmpeg binary at the path it prints if missing (a symlink to the system ffmpeg works). The MP4 is not committed (size); regenerate it or share the file directly. Demo data only, never real people.
