# Live product demo (3 minutes)

`KALWINGS-Live-Demo.mp4` is a real screen recording of the running app, not mock-ups: a student opens a challenge, reads the brief and rubric, submits work; an employer reviews it against the rubric, shortlists and awards the skill; the student sees the score and the evidence-backed skill on her public profile. Captions and a voiceover (Kokoro, offline) are timed to each action.

| File | Purpose |
| --- | --- |
| `script.json` | The narration, one line per beat (the same text is the on-screen caption) |
| `gen-audio.py` | Synthesises one WAV per beat and `_audio/durations.json` |
| `demo.mjs` | Sets up the scenario off camera (employer posts and admin approves the challenge), then drives the app in real time with Playwright and records it; clips are placed at the exact moment each beat starts using `docs/video/mux.py` |

Rebuild: seed a clean database (`npm run db:seed`), start `npm run dev -- -p 3000` with `ADMIN_EMAILS` empty, run `python3 docs/demo/gen-audio.py MODEL_DIR` (see `docs/video/README.md` for the voice model), then `CHROMIUM_PATH=... node docs/demo/demo.mjs`. `DRY=1` rehearses the flow quickly without narration timing. The take runs in real time (about 3.5 minutes). Demo data only (the "Sample" student and "Sample Co. A"); never use real people. The MP4 is not committed.
