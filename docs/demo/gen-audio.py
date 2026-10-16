#!/usr/bin/env python3
"""Voiceover for the live demo: one WAV per beat (Kokoro, offline) + durations.json. Usage: gen-audio.py [model_dir]"""
import json, os, re, sys
import soundfile as sf
from kokoro_onnx import Kokoro
HERE = os.path.dirname(os.path.abspath(__file__)); MODEL = sys.argv[1] if len(sys.argv) > 1 else '/tmp/tts'
VOICE, SPEED = os.environ.get('VOICE', 'af_heart'), float(os.environ.get('SPEED', '1.0'))
SAY = [(r'Sample Co A', 'Sample Co A'), (r'\bCV\b', 'C V')]
def clean(t):
    for a, b in SAY: t = re.sub(a, b, t)
    return t
beats = json.load(open(f'{HERE}/script.json'))['beats']
out = f'{HERE}/_audio'; os.makedirs(out, exist_ok=True)
k = Kokoro(f'{MODEL}/kokoro-v1.0.onnx', f'{MODEL}/voices-v1.0.bin'); D = {}
for b in beats:
    s, sr = k.create(clean(b['text']), voice=VOICE, speed=SPEED, lang='en-us'); sf.write(f"{out}/{b['key']}.wav", s, sr); D[b['key']] = round(len(s) / sr, 3)
json.dump(D, open(f'{out}/durations.json', 'w'), indent=1)
print(len(D), 'clips,', round(sum(D.values()), 1), 's of speech')
