#!/usr/bin/env python3
"""Download generated illustration URLs and write 512px + 256px WebP into the atlas."""
import json
import subprocess
import sys
import tempfile
import os
from pathlib import Path
from PIL import Image

ROOT = Path("/Users/a12345/Doubao/chats/2026-10-29/new-chat-2/word-atlas")
IMG = ROOT / "public/atlas/img"
THUMB = ROOT / "public/atlas/thumb"


def process(item):
    ident, url = item["id"], item["url"]
    if (IMG / f"{ident}.webp").exists():
        return f"skip {ident}"
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run(
            ["curl", "-sL", "--max-time", "60", "-o", tmp_path, url],
            check=True, capture_output=True,
        )
        with Image.open(tmp_path) as im:
            im = im.convert("RGB")
            big = im.resize((512, 512), Image.LANCZOS)
            small = im.resize((256, 256), Image.LANCZOS)
            big.save(IMG / f"{ident}.webp", "WEBP", quality=86, method=4)
            small.save(THUMB / f"{ident}.webp", "WEBP", quality=82, method=4)
        return f"ok {ident}"
    finally:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass


def main():
    items = json.loads(sys.stdin.read())
    for it in items:
        print(process(it), flush=True)


if __name__ == "__main__":
    main()
