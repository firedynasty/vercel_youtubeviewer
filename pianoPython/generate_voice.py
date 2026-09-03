#!/usr/bin/env python3
"""
generate_voice.py
-----------------
Reads a lyric:note:beats sequence, generates Kokoro TTS (via kokoro-onnx)
for each lyric token, overlays the real piano WAV samples, and exports a
mixed MP3.

Usage:
    python generate_voice.py input.txt --bpm 100 --out voice.mp3
    python generate_voice.py input.txt --bpm 80 --voice af_bella --piano-vol 0.6
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
import numpy as np

# ── Kokoro model location ────────────────────────────────────────────────────
KOKORO_DIR   = Path("/Users/stanleytan/Documents/technical/python/textToSpeech")
KOKORO_MODEL = KOKORO_DIR / "kokoro-v1.0.onnx"
VOICES_BIN   = KOKORO_DIR / "voices-v1.0.bin"
SAMPLE_RATE  = 24000

# ── Note → WAV filename (matches pianoIndex.html) ────────────────────────────
NOTE_TO_WAV = {
    'C4':'040.wav',  'C':'040.wav',
    'C#4':'041.wav', 'DB4':'041.wav',
    'D4':'042.wav',  'D':'042.wav',
    'D#4':'043.wav', 'EB4':'043.wav',
    'E4':'044.wav',  'E':'044.wav',
    'F4':'045.wav',  'F':'045.wav',
    'F#4':'046.wav', 'GB4':'046.wav',
    'G4':'047.wav',  'G':'047.wav',
    'G#4':'048.wav', 'AB4':'048.wav',
    'A4':'049.wav',  'A':'049.wav',
    'A#4':'050.wav', 'BB4':'050.wav',
    'B4':'051.wav',  'B':'051.wav',
    'C5':'052.wav',
    'C#5':'053.wav', 'DB5':'053.wav',
    'D5':'054.wav',
    'D#5':'055.wav', 'EB5':'055.wav',
    'E5':'056.wav',
}


def parse_sequence(text):
    tokens = []
    flat = ','.join(l.strip() for l in text.splitlines() if l.strip())
    for raw in flat.split(','):
        raw = raw.strip()
        if not raw:
            continue
        parts = raw.split(':')
        if len(parts) >= 3:
            lyric, note, beats = parts[0].strip(), parts[1].strip(), parts[2].strip()
        elif len(parts) == 2:
            lyric, note, beats = '', parts[0].strip(), parts[1].strip()
        else:
            lyric, note, beats = '', parts[0].strip(), '1'
        try:
            beats = float(beats)
        except ValueError:
            beats = 1.0
        tokens.append((lyric, note, beats))
    return tokens


def load_wav(path, target_sr):
    import librosa
    audio, _ = librosa.load(path, sr=target_sr, mono=True)
    return audio.astype(np.float32)


async def _collect_stream(kokoro, text, voice, speed):
    """Collect all audio chunks from kokoro_onnx async stream."""
    chunks = []
    stream = kokoro.create_stream(text, voice=voice, speed=speed, lang="en-us")
    async for samples, _sr in stream:
        chunks.append(samples.astype(np.float32))
    return np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)


def tts_clip(kokoro, text, voice, speed, target_samples):
    import librosa
    try:
        clip = asyncio.run(_collect_stream(kokoro, text, voice, speed))
    except Exception as e:
        print(f" [TTS error: {e}]", end='')
        return np.zeros(target_samples, dtype=np.float32)

    if len(clip) == 0:
        return np.zeros(target_samples, dtype=np.float32)

    # Trim leading/trailing silence — no stretching at all
    clip, _ = librosa.effects.trim(clip, top_db=22)
    if len(clip) < SAMPLE_RATE * 0.05:
        return np.zeros(target_samples, dtype=np.float32)

    # If too long, fade out at the end instead of hard cut
    if len(clip) > target_samples:
        clip = clip[:target_samples]
        fade = min(int(SAMPLE_RATE * 0.05), target_samples // 4)
        clip[-fade:] *= np.linspace(1, 0, fade)
    else:
        # Pad with silence to fill the slot
        clip = np.pad(clip, (0, target_samples - len(clip)))

    return clip


def overlay(buf, clip, offset):
    end = offset + len(clip)
    if end > len(buf):
        buf = np.pad(buf, (0, end - len(buf)))
    buf[offset:end] += clip
    return buf


def generate(input_path, bpm, voice, out_path, speed, piano_vol, voice_vol, sounds_dir):
    try:
        import librosa
    except ImportError:
        sys.exit("librosa not found — pip install librosa")
    try:
        from pydub import AudioSegment
    except ImportError:
        sys.exit("pydub not found — pip install pydub  (also needs ffmpeg: brew install ffmpeg)")
    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        sys.exit("kokoro_onnx not found — pip install kokoro-onnx")

    if not KOKORO_MODEL.exists() or not VOICES_BIN.exists():
        sys.exit(f"Kokoro model files not found in {KOKORO_DIR}\n"
                 f"Expected: {KOKORO_MODEL.name} and {VOICES_BIN.name}")

    with open(input_path, 'r', encoding='utf-8') as f:
        text = f.read()

    tokens = parse_sequence(text)
    if not tokens:
        sys.exit("No tokens found.")

    sec_per_beat = 60.0 / bpm
    print(f"Loading Kokoro from {KOKORO_DIR.name}…")
    kokoro = Kokoro(str(KOKORO_MODEL), str(VOICES_BIN))

    print(f"{len(tokens)} tokens · {bpm} BPM · {sec_per_beat:.3f}s/beat · voice: {voice}")

    wav_cache = {}
    def get_piano(note):
        fname = NOTE_TO_WAV.get(note.upper())
        if not fname:
            return None
        if fname not in wav_cache:
            p = os.path.join(sounds_dir, fname)
            wav_cache[fname] = load_wav(p, SAMPLE_RATE) if os.path.exists(p) else None
        return wav_cache[fname]

    piano_buf = np.zeros(1, dtype=np.float32)
    voice_buf  = np.zeros(1, dtype=np.float32)
    offset = 0

    for i, (lyric, note, beats) in enumerate(tokens):
        target_sec     = beats * sec_per_beat
        target_samples = int(target_sec * SAMPLE_RATE)
        label = f"'{lyric}:{note}'" if lyric else f"'{note}'"
        print(f"  [{i:3d}] {label:22s} {beats}b = {target_sec:.2f}s", end='', flush=True)

        # Piano
        piano = get_piano(note)
        if piano is not None:
            piano_buf = overlay(piano_buf, piano * piano_vol, offset)
            print("  piano✓", end='')
        else:
            print("  piano✗", end='')

        # Voice
        is_rest = (not lyric or lyric == '_' or note == '_')
        if not is_rest:
            tts_text = lyric.lstrip('-').strip()
            if tts_text:
                clip = tts_clip(kokoro, tts_text, voice, speed, target_samples)
                voice_buf = overlay(voice_buf, clip * voice_vol, offset)
                print("  voice✓", end='')

        print()
        offset += target_samples

    # Mix
    total = max(len(piano_buf), len(voice_buf))
    piano_buf = np.pad(piano_buf, (0, total - len(piano_buf)))
    voice_buf  = np.pad(voice_buf,  (0, total - len(voice_buf)))
    mixed = piano_buf + voice_buf
    peak = np.max(np.abs(mixed))
    if peak > 0:
        mixed = mixed / peak * 0.92

    pcm = (mixed * 32767).astype(np.int16)
    seg = AudioSegment(pcm.tobytes(), frame_rate=SAMPLE_RATE, sample_width=2, channels=1)
    seg.export(out_path, format='mp3', bitrate='192k')
    print(f"\nSaved {out_path}  ({total/SAMPLE_RATE:.1f}s)")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    default_sounds = os.path.join(here, 'public', 'sounds')

    p = argparse.ArgumentParser()
    p.add_argument('input')
    p.add_argument('--bpm',        type=float, default=80)
    p.add_argument('--voice',      default='am_michael',
                   help='Kokoro voice (default: am_michael). Others: af_bella, bm_george, bf_emma')
    p.add_argument('--speed',      type=float, default=1.0)
    p.add_argument('--piano-vol',  type=float, default=0.75)
    p.add_argument('--voice-vol',  type=float, default=0.85)
    p.add_argument('--sounds-dir', default=default_sounds)
    p.add_argument('--out',        default='voice.mp3')
    args = p.parse_args()

    generate(args.input, args.bpm, args.voice, args.out,
             args.speed, args.piano_vol, args.voice_vol, args.sounds_dir)


if __name__ == '__main__':
    main()
