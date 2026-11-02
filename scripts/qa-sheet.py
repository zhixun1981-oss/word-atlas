#!/usr/bin/env python3
"""把指定词的插画拼成带标签对比图（视觉质检用）。
用法: python3 scripts/qa-sheet.py word1,word2,... out.png [cols]
     python3 scripts/qa-sheet.py --credits out.png   # 按 credits.json 里的词全拼
"""
import json
import os
import sys

from PIL import Image, ImageDraw

ROOT = "public/atlas"
THUMB = os.path.join(ROOT, "thumb")
CELL = 200
LABEL_H = 22


def load_thumb(word):
    p = os.path.join(THUMB, word + ".webp")
    if not os.path.exists(p):
        return None
    try:
        im = Image.open(p).convert("RGB")
        im.thumbnail((CELL, CELL))
        return im
    except Exception:
        return None


def build(words, out_path, cols=5):
    imgs = []
    for w in words:
        im = load_thumb(w)
        imgs.append((w, im))
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * CELL, rows * (CELL + LABEL_H)), (250, 250, 248))
    d = ImageDraw.Draw(sheet)
    for i, (w, im) in enumerate(imgs):
        x = (i % cols) * CELL
        y = (i // cols) * (CELL + LABEL_H)
        if im is not None:
            sheet.paste(im, (x + (CELL - im.width) // 2, y + (CELL - im.height) // 2))
        else:
            d.rectangle([x + 4, y + 4, x + CELL - 4, y + CELL - 4], outline=(200, 60, 60))
            d.text((x + 10, y + CELL // 2), "MISSING", fill=(200, 60, 60))
        label = w if len(w) <= 28 else w[:27] + "…"
        d.rectangle([x, y + CELL, x + CELL, y + CELL + LABEL_H], fill=(40, 40, 40))
        d.text((x + 6, y + CELL + 4), label, fill=(255, 255, 255))
    sheet.save(out_path)
    print(f"{out_path}: {len(imgs)} words, {cols}x{rows}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--credits":
        credits = json.load(open(os.path.join(ROOT, "credits.json")))
        words = sorted(credits.keys())
        out = args[1] if len(args) > 1 else "/tmp/qa-credits.png"
        cols = int(args[2]) if len(args) > 2 else 6
    else:
        words = [w for w in args[0].split(",") if w]
        out = args[1] if len(args) > 1 else "/tmp/qa-sheet.png"
        cols = int(args[2]) if len(args) > 2 else 5
    # 一页最多 30 个，超了拆页
    chunk = 30
    if len(words) > chunk:
        base, ext = os.path.splitext(out)
        for pi in range(0, len(words), chunk):
            build(words[pi : pi + chunk], f"{base}-p{pi // chunk + 1}{ext}", cols)
    else:
        build(words, out, cols)
