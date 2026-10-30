#!/usr/bin/env python3
"""Builds the soundtrack from the narration clips at the exact moments the page said each line, trims the recording to the
calibration flash, and muxes MP4 (H.264 + AAC). Usage: mux.py recording.webm marks.json audio_dir out.mp4"""
import json, subprocess, sys
import numpy as np, soundfile as sf

webm, marks_f, adir, out = sys.argv[1:5]
M = json.load(open(marks_f)); marks, flash_end = M['marks'], M['flashEnd']
LEAD = 0.12   # speech starts a moment after the caption appears

# 1. when does the calibration flash end in the recording? (first 5 s, 50 fps, tiny gray frames)
FPS = 50
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', webm, '-t', '5', '-vf', f'fps={FPS},scale=32:18,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 32 * 18).mean(axis=1)
bright = np.where(frames > 200)[0]
if not len(bright): sys.exit('calibration flash not found in the recording')
v_fe = (bright[-1] + 1) / FPS
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm], capture_output=True, text=True).stdout)
vid_len = dur - v_fe
print(f'flash ends at {v_fe:.2f}s in the recording; trimmed video is {vid_len:.1f}s')

# 2. place every clip
SR = 24000
buf = np.zeros(int((vid_len + 3) * SR), dtype=np.float32)
prev_end, over = 0.0, 0
for key, t in marks:
    off = (t - flash_end) / 1000 + LEAD
    y, sr = sf.read(f'{adir}/{key}.wav', dtype='float32')
    assert sr == SR, (key, sr)
    if off < prev_end - 0.02: over += 1; print(f'  overlap: {key} starts {prev_end - off:.2f}s before the previous clip ends')
    i = int(off * SR); buf[i:i + len(y)] += y; prev_end = off + len(y) / SR
buf *= 0.92 / max(1e-6, float(np.abs(buf).max()))
sf.write('/tmp/walk-audio.wav', buf, SR)
print(f'{len(marks)} clips placed, {over} overlaps, last clip ends at {prev_end:.1f}s of {vid_len:.1f}s')

# 3. mux
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{v_fe:.3f}', '-i', webm, '-i', '/tmp/walk-audio.wav', '-map', '0:v', '-map', '1:a', '-t', f'{vid_len:.3f}',
                '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], check=True)
print('wrote', out)
