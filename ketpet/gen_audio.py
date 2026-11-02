#!/usr/bin/env python3
"""Generate missing TTS audio (UK/US word, sentence ex/ex2) for new KET/PET entries
using macOS `say` + ffmpeg, in parallel."""
import json
import subprocess
import tempfile
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path("/Users/a12345/Doubao/chats/2026-10-29/new-chat-2/word-atlas")
DATA = json.loads((ROOT / "data/word-atlas.json").read_text(encoding="utf-8"))
AUDIO = ROOT / "public/atlas/audio"

UK_VOICE = "Daniel"      # en-GB
US_VOICE = "Samantha"    # en-US
WORD_RATE = 170
SENT_RATE = 160


def synth(text: str, voice: str, rate: int, out_mp3: Path) -> None:
    """say -> aiff -> ffmpeg mp3"""
    with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
        aiff = tmp.name
    try:
        subprocess.run(
            ["say", "-v", voice, "-r", str(rate), "-o", aiff, text],
            check=True, capture_output=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", aiff,
             "-codec:a", "libmp3lame", "-b:a", "128k", str(out_mp3)],
            check=True, capture_output=True,
        )
    finally:
        try:
            os.unlink(aiff)
        except FileNotFoundError:
            pass


def jobs():
    for e in DATA:
        slug = e["id"]
        if (AUDIO / "uk" / f"{slug}.mp3").exists():
            continue  # already voiced (reused from original library)
        yield ("uk", slug, e["w"], UK_VOICE, WORD_RATE)
        yield ("us", slug, e["w"], US_VOICE, WORD_RATE)
        ex = e.get("ex") or []
        if len(ex) > 0 and ex[0].get("en"):
            yield ("ex", slug, ex[0]["en"], UK_VOICE, SENT_RATE)
        if len(ex) > 1 and ex[1].get("en"):
            yield ("ex2", slug, ex[1]["en"], UK_VOICE, SENT_RATE)


def run(job):
    kind, slug, text, voice, rate = job
    out = AUDIO / kind / f"{slug}.mp3"
    if out.exists():
        return f"skip {kind}/{slug}"
    synth(text, voice, rate, out)
    return f"ok {kind}/{slug}"


def main():
    todo = list(jobs())
    print("total audio jobs:", len(todo))
    done = 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(run, j) for j in todo]
        for fut in as_completed(futures):
            res = fut.result()
            done += 1
            if done % 100 == 0:
                print(f"progress {done}/{len(todo)}")
    print("done:", len(todo))


if __name__ == "__main__":
    main()
