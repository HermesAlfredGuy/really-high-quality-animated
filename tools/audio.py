#!/usr/bin/env python3
"""Sound build for THE LITTLE LIGHTHOUSE: licensed music (cut on the bar grid) + VO + SFX.
Output: out/audio.wav  48 kHz stereo, -14 LUFS, -1 dBTP.
Run with /opt/data/scripts/media-python.sh tools/audio.py
"""
import json, math, subprocess, sys
import numpy as np

SR = 48000
DUR = 50.0
N = int(SR * DUR)
rng = np.random.default_rng(20261022)
MUS = '/opt/data/assets/music/norm/playful/playful-02-bright-bouncy-acoustic.mp3'
VO = 'vo/out/vo.wav'
LINES = json.load(open('vo/out/lines.json'))


def decode(path, sr=SR, stereo=True):
    ch = 2 if stereo else 1
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-acodec', 'pcm_f32le',
                          '-ar', str(sr), '-ac', str(ch), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).astype(np.float64)
    return a


def env(n, a=0.005, r=0.02, sr=SR):
    e = np.ones(n)
    na, nr = int(a * sr), int(r * sr)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] = np.linspace(1, 0, nr)
    return e


def place(buf, clip, t, gain=1.0):
    i = int(round(t * SR))
    n = min(len(clip), len(buf) - i)
    if n <= 0: return
    buf[i:i + n] += clip[:n] * gain


try:
    from scipy.signal import lfilter
except Exception:
    lfilter = None


def lp(x, fc):
    # one-pole lowpass
    a = math.exp(-2 * math.pi * fc / SR)
    if lfilter is None:
        y = np.empty_like(x); acc = 0.0
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc
            y[i] = acc
        return y
    return lfilter([1 - a], [1, -a], x)


def hp(x, fc):
    return x - lp(x, fc)


def bp(x, lo, hi):
    return lp(hp(x, lo), hi)


def noise(n):
    return rng.normal(0, 1, n)


def click(strength=1.0, dark=1.0):
    n = int(0.03 * SR)
    x = noise(n) * np.exp(-np.linspace(0, 18, n))
    x = bp(x, 900 / dark, 5200 / dark)
    x += 0.5 * np.sin(2 * np.pi * 1750 * np.arange(n) / SR) * np.exp(-np.linspace(0, 60, n))
    return x * 0.95 * strength


def bonk(f=190, amp=0.4, dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 42) + 0.6 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t * 70)
    x += 0.5 * bp(noise(n), 700, 4200) * np.exp(-t * 90)
    return x * amp


def ping(f=2100, amp=0.18, dur=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * t * (1 - 0.02 * t)) * np.exp(-t * 9)
         + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 16))
    return x * amp


def flutter(dur=0.5, amp=0.05, rate=13):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(noise(n), 1800, 6500)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * rate * t)
    return x * mod * amp


def inhale(dur=0.7, amp=0.16):
    n = int(dur * SR)
    x = noise(n)
    # sweep the lowpass by summing bands with a rising weight
    out = np.zeros(n)
    for k, fc in enumerate([300, 600, 1100, 1900, 3000]):
        w = np.linspace(0, 1, n) ** (1 + k * 0.6)
        out += lp(x, fc) * w
    return out / (np.max(np.abs(out)) + 1e-9) * amp * np.linspace(0.2, 1, n)


def chime(freqs=(523.25, 783.99, 1046.5), dur=2.4, amp=0.07):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, f in enumerate(freqs):
        out += np.sin(2 * np.pi * f * t) * np.exp(-t * (1.6 + k * 0.4)) / (k + 1) ** 0.5
    return out * amp


def whoosh(dur=0.5, amp=0.10):
    n = int(dur * SR)
    x = bp(noise(n), 400, 3000)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * e * amp


# ---------------------------------------------------------------- music bed
mus = decode(MUS)
seg = []
seg.append((0.0, 16.0, mus[int(0.085 * SR):int((0.085 + 16.0) * SR)]))          # intro
seg.append((16.0, 26.0, mus[int(20.083 * SR):int((20.083 + 10.0) * SR)]))       # verse (moth)
seg.append((31.0, 50.0, mus[int(38.081 * SR):int((38.081 + 19.0) * SR)]))       # chorus (moon)
bed = np.zeros((N, 2))
for t0, t1, clip in seg:
    n = int((t1 - t0) * SR)
    c = clip[:n].copy()
    if len(c) < n:
        c = np.pad(c, ((0, n - len(c)), (0, 0)))
    c *= env(n, 0.02, 1.1 if t1 >= 49.9 else 0.06)[:, None]
    place(bed, c, t0)

# musical stop at 26.0: fade the tail of segment B, and the room tone carries the silence
i0, i1 = int(25.9 * SR), int(26.05 * SR)
bed[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None]

# ---------------------------------------------------------------- VO placement
vo = decode(VO, stereo=False)[:, 0]
vo_lines = [
    (0.25, 3.36, 3.95),     # every night ... lighthouse
    (4.31, 5.47, 18.0),     # the moth had other ideas
    (6.42, 10.36, 28.35),   # so the little lighthouse switched itself off
    (11.31, 13.58, 41.0),   # some lights you only have to borrow
]
vob = np.zeros(N)
for s, e, at in vo_lines:
    clip = vo[int(s * SR):int(e * SR)].copy()
    clip *= env(len(clip), 0.004, 0.02)
    place(vob, clip, at, 1.0)

# duck the music under the voice, 250 ms ramps
duck = np.ones(N)
for s, e, at in vo_lines:
    a, b = int((at - 0.28) * SR), int((at + (e - s) + 0.30) * SR)
    a, b = max(0, a), min(N, b)
    duck[a:b] = np.minimum(duck[a:b], 0.42)
k = int(0.14 * SR)
duck = np.convolve(duck, np.hanning(k) / np.hanning(k).sum(), mode='same')
for s0, s1 in ((24.3, 25.6),):
    a, b = int(s0 * SR), min(N, int(s1 * SR))
    duck[a:b] = np.minimum(duck[a:b], 0.55)
k = int(0.10 * SR)
duck = np.convolve(duck, np.hanning(k) / np.hanning(k).sum(), mode='same')
bed *= duck[:, None]

# ---------------------------------------------------------------- SFX
sfx = np.zeros(N)

place(sfx, click(1.0, 1.0), 3.0, 1.35)
place(sfx, bonk(96, 0.5, 0.11), 3.0, 0.5)                     # CLICK ON
# filament warm-up buzz
n = int(0.55 * SR); t = np.arange(n) / SR
buzz = (np.sin(2 * np.pi * 100 * t) * 0.4 + bp(noise(n), 2000, 7000) * 0.5) * np.linspace(0.5, 0, n) ** 1.5
place(sfx, buzz, 3.1, 0.10)

for tb in (16.88, 19.4, 21.15):
    place(sfx, bonk(210, 0.5, 0.08), tb, 0.8)
place(sfx, bonk(150, 0.5, 0.12), 21.5, 0.6)                # thrown off the shade

for a, b in ((15.5, 24.6), (29.0, 29.9), (37.35, 39.62)):
    d = b - a
    t0 = a
    while t0 < b:
        place(sfx, flutter(min(0.5, b - t0), 0.05, 13), t0, 1.0)
        t0 += 0.5

# the blast: riser from 24.35 into 24.94, hard hit on the frame, low bloom under it
n = int(0.62 * SR); tt = np.arange(n) / SR
ris = (bp(noise(n), 900, 5200) * 0.5 + np.sin(2 * np.pi * (420 + 1500 * tt / 0.62) * tt) * 0.22)
ris *= (tt / 0.62) ** 2.2
place(sfx, ris, 24.33, 0.5)
place(sfx, click(1.9, 0.6), 24.94, 2.7)                     # the switch of light itself
place(sfx, bonk(58, 0.5, 0.42), 24.96, 1.4)                  # the body of the hit
place(sfx, ping(3100, 0.13, 0.9), 25.0, 1.0)                 # the filament
n = int(1.1 * SR); tt = np.arange(n) / SR
bloom = (np.sin(2 * np.pi * 74 * tt) * 0.5 + np.sin(2 * np.pi * 111 * tt) * 0.3) * np.exp(-tt * 3.4)
place(sfx, bloom, 24.97, 0.95)                               # the low bloom under the blast

place(sfx, inhale(0.62, 0.13), 26.28, 1.0)                  # the huff
place(sfx, click(1.6, 0.8), 27.0, 1.55)
place(sfx, bonk(82, 0.5, 0.16), 27.0, 0.55)                     # CLICK OFF
place(sfx, ping(2350, 0.30, 0.55), 27.12, 1.0)               # filament ping
place(sfx, ping(1980, 0.05, 0.3), 28.05, 1.0)
place(sfx, chime((523.25, 783.99, 1046.5), 2.6, 0.055), 35.95, 1.0)   # the moon catches the shade
place(sfx, whoosh(0.55, 0.07), 37.5, 1.0)                   # the moth crosses the beam
place(sfx, ping(1560, 0.05, 0.7), 42.6, 1.0)
place(sfx, ping(2470, 0.17, 1.30), 49.12, 1.0)               # the button: filament ping on the cut
place(sfx, bonk(72, 0.5, 0.3), 49.11, 0.42)

# the click's dry switch also gets a tiny mechanical double-tick
place(sfx, click(0.7, 1.3), 3.035, 0.55)

# ---------------------------------------------------------------- room tone
rt = bp(noise(N), 60, 900) * 0.006
rt *= np.linspace(0.6, 1.0, N)
sfx += rt

# ---------------------------------------------------------------- mix
vob2 = np.stack([vob, np.roll(vob, 24) * 0.98], 1)      # a hair of width
sfx2 = np.stack([sfx, sfx], 1)
# an editorial tick on every picture cut, so no cut lands silently
for ct in (2.5, 8.5, 12.5, 14.0, 16.0, 17.5, 19.0, 20.5, 22.0, 23.5, 36.0, 40.0, 47.0):
    place(sfx, click(2.6 + 0.3 * ((ct * 7) % 3), 0.1), ct, 0.20)
    place(sfx, bonk(96, 0.5, 0.09), ct + 0.004, 0.12)

mix = bed * 0.9 + vob2 * 1.7 + sfx2 * 0.9

# gentle bus glue: soft knee limiter
def limit(x, ceiling=0.94):
    a = np.abs(x)
    knee = 0.75
    g = np.ones_like(a)
    over = a > knee
    g[over] = knee + (ceiling - knee) * np.tanh((a[over] - knee) / (ceiling - knee))
    g[over] /= a[over]
    return x * g

mix = limit(mix)
# normalise toward -14 LUFS (iterate once against ffmpeg's measurement below)
peak = np.max(np.abs(mix))
mix *= 0.89 / peak if peak > 0 else 1

out = 'out/audio.wav'
import os
os.makedirs('out', exist_ok=True)
mix.astype(np.float32).tofile('/tmp/mix.f32')
# true-peak safety: a 4x-oversampled limiter, so the AAC encode cannot inter-sample clip
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2',
                '-i', '/tmp/mix.f32',
                '-af', 'aresample=192000,alimiter=limit=0.70:attack=3:release=60:level=false,aresample=48000:resampler=soxr',
                '-c:a', 'pcm_s24le', out], check=True)
print('wrote', out)
