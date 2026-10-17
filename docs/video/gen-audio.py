#!/usr/bin/env python3
"""Generates the voiceover: one WAV per narrated moment (Kokoro, open model, runs offline) and durations.json.
Keys are shared with video.html, which waits for each clip to finish before moving on.
Usage: python3 docs/video/gen-audio.py [model_dir]   (model_dir holds kokoro-v1.0.onnx and voices-v1.0.bin)"""
import json, os, re, sys
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = sys.argv[1] if len(sys.argv) > 1 else '/tmp/tts'
VOICE, SPEED = os.environ.get('VOICE', 'af_heart'), float(os.environ.get('SPEED', '0.97'))
SAY = [(r'requireActionRole', 'require action role'), (r'zod validate', 'zod validate'), (r'audit\(\)', 'audit'), (r'revalidatePath', 'revalidate path'),
       (r'schema\.prisma', 'schema dot prisma'), (r'migration\.sql', 'migration dot sql'), (r'embed-migrations', 'embed migrations'), (r'docs:db and docs:api', 'docs db and docs api'),
       (r'prisma migrate diff', 'prisma migrate diff'), (r'migrate deploy', 'migrate deploy'), (r'MySQL 8', 'My S Q L eight'), (r'MariaDB', 'Maria D B'), (r'e2e', 'end to end'),
       (r'\bHR\b', 'H R'), (r'\bURL\b', 'U R L'), (r'\.\.\.', '.'), (r'&', 'and')]
def clean(t):
    for a, b in SAY: t = re.sub(a, b, t)
    return t.strip()

sc = json.load(open(f'{HERE}/scenes.json'))
N = {}
for i, s in enumerate(sc):
    ty = s['type']
    if ty == 'title': N[f's{i}'] = s['notes']
    elif ty == 'rules':
        N[f's{i}.intro'] = 'Five rules that never change.'
        for j, (a, b) in enumerate(s['items']): N[f's{i}.r{j}'] = f'{a}. {b}'
    elif ty == 'section': N[f's{i}'] = f"{s['sub']}. {s['title']}." if s['title'].startswith('Part') is False else f"{s['title']}. {s['sub']}."
    elif ty == 'shot':
        N[f's{i}.t'] = re.sub(r'^\d+\.\s*', '', s['title']) + '.'
        for st in s['steps']: N[f's{i}.n{st["n"]}'] = st['cap']
    elif ty == 'flow':
        N[f's{i}.a'] = 'A request travels from the browser to a Next dot js page, then through Prisma to the database.'
        N[f's{i}.b'] = 'On every request the page checks the session cookie and reads the user again from the database.'
        N[f's{i}.c'] = 'So a suspended account, or a changed role, applies on the very next click.'
    elif ty in ('actions', 'migrate'):
        N[f's{i}.t'] = s['title'] + '.'
        for j, (a, b) in enumerate(s['steps']): N[f's{i}.k{j}'] = f'{a}. {b}'
    elif ty == 'quality':
        N[f's{i}.a'] = 'Before every pull request, run lint, typecheck, unit tests, the build, and the end to end suite.'
        N[f's{i}.b'] = 'Continuous integration then repeats the checks on My S Q L eight and Maria D B ten point eleven.'
        N[f's{i}.c'] = 'Merge to main. Hostinger builds, migrations apply on start, and you confirm the health endpoint.'
    elif ty == 'outro': N[f's{i}'] = 'Read the full manual. Every step, with labelled screenshots, is in the P D F.'
json.dump(N, open(f'{HERE}/narration.json', 'w'), indent=1)
out = f'{HERE}/_audio'; os.makedirs(out, exist_ok=True)
k = Kokoro(f'{MODEL}/kokoro-v1.0.onnx', f'{MODEL}/voices-v1.0.bin')
D = {}
for key, text in N.items():
    p = f'{out}/{key}.wav'
    samples, sr = k.create(clean(text), voice=VOICE, speed=SPEED, lang='en-us')
    sf.write(p, samples, sr); D[key] = round(len(samples) / sr, 3)
json.dump(D, open(f'{out}/durations.json', 'w'), indent=1)
print(len(D), 'clips,', round(sum(D.values()), 1), 's of speech')
