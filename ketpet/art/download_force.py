#!/usr/bin/env python3
"""Force re-download ALL urls_all.json entries, overwriting existing webp (unified new style)."""
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
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run(["curl", "-sL", "--max-time", "90", "-o", tmp_path, url],
                       check=True, capture_output=True)
        with Image.open(tmp_path) as im:
            im = im.convert("RGB")
            big = im.resize((512, 512), Image.LANCZOS)
            small = im.resize((256, 256), Image.LANCZOS)
            big.save(IMG / f"{ident}.webp", "WEBP", quality=86, method=4)
            small.save(THUMB / f"{ident}.webp", "WEBP", quality=82, method=4)
        return f"ok {ident}"
    except Exception as e:
        return f"FAIL {ident}: {e}"
    finally:
        try:
            os.unlink(tmp_path)
        except FileNotFoundError:
            pass

items = json.loads(sys.stdin.read())
ok = fail = 0
for it in items:
    r = process(it)
    print(r, flush=True)
    if r.startswith("ok"):
        ok += 1
    else:
        fail += 1
print(f"DONE ok={ok} fail={fail} total={len(items)}", flush=True)
