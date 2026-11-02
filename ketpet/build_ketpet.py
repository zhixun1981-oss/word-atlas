"""Build the KET/PET edition of Word Atlas.

Merges:
  - full entries reused from the original 7298-word atlas (overlapping words)
  - 490 newly written entries for missing KET/PET words (in ketpet/new-entries/)

Outputs (same layout as scripts/atlas/build_atlas.py):
  public/atlas/index.json, public/atlas/entries/<n>.json
  data/word-atlas.json, data/word-atlas.csv

CEFR rule: word listed in KET(A2 Key) -> A2; PET-only -> B1.
"""
import csv
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUB = ROOT / "public" / "atlas"
DATA = ROOT / "data"
NEW = ROOT / "ketpet" / "new-entries"
TMP = pathlib.Path("/tmp/ketpet")

TOPICS = [
    ("education", "教育"), ("work", "职场"), ("technology", "科技"), ("science", "科学"),
    ("environment", "环境"), ("health", "健康"), ("society", "社会"), ("government", "政法"),
    ("economy", "经济"), ("media", "媒体"), ("arts", "艺术"), ("travel", "旅行"),
    ("city", "城市"), ("nature", "自然"), ("daily", "生活"), ("emotion", "情感"),
    ("thinking", "思维"), ("sport", "运动"), ("history", "历史"),
]
TOPIC_INDEX = {k: i for i, (k, _) in enumerate(TOPICS)}
CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"]


def slugify(word):
    s = word.strip().lower().replace("’", "'")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"


def norm(word):
    """Normalise a headword from the official PDFs: lowercase, unify apostrophes,
    drop trailing punctuation that came from PDF layout."""
    s = word.strip().lower().replace("’", "'")
    s = s.rstrip(".").strip()
    return s


# PDF extraction noise rows (multi-column topic lists merged on one line)
NOISE = {
    "ambulance dangerous hand rest", "article exhibition newspaper rock",
    "aunt girl group mum", "bedroom dining room heating safe",
    "bike member skiing throw", "biscuit cooker juice roast",
    "board game festival opera screen", "boat garage petrol station tour",
    "book form newspaper text", "boot hat shirt try on",
    "bread dessert main course slice", "cafeteria fish mineral water sweet",
    "classroom instructions pupil test", "competition prize stadium walk",
    "cycling racket surfboard win", "engine move stop way", "of the school",
}
# obvious typos in the official PDFs
CORRECTIONS = {"suprising": "surprising"}


def load_original():
    """Load every entry from data/word-atlas.csv into clean-entry dicts."""
    entries = {}
    with open(DATA / "word-atlas.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            zhs = [x.strip() for x in (row["meanings_zh"] or "").split("|")]
            ens = [x.strip() for x in (row["definition_en"] or "").split("|")]
            senses = []
            for i, zh in enumerate(zhs):
                m = re.match(r"^([a-z]+\.)\s*(.*)$", zh)
                pos = m.group(1) if m else ""
                zhc = m.group(2) if m else zh
                en = ens[i] if i < len(ens) else ""
                if zhc:
                    senses.append({"pos": pos, "zh": zhc, "en": en})
            ex = [{"en": row["example1_en"], "zh": row["example1_zh"]},
                  {"en": row["example2_en"], "zh": row["example2_zh"]}]
            ex = [x for x in ex if x["en"].strip()]
            split = lambda xs: [x.strip() for x in (xs or "").split(";") if x.strip()]
            entries[row["word"].strip().lower()] = {
                "w": row["word"].strip(),
                "uk": row["ipa_uk"].strip(),
                "us": row["ipa_us"].strip(),
                "senses": senses[:3],
                "ex": ex[:2],
                "col": split(row["collocations"])[:4],
                "fam": split(row["word_family"])[:4],
                "syn": split(row["synonyms"])[:3],
                "ant": split(row["antonyms"])[:2],
                "tip": row["tip_zh"].strip(),
                "cefr": row["cefr"].strip() if row["cefr"].strip() in CEFR else "B2",
                "topic": row["topic"].strip() if row["topic"].strip() in TOPIC_INDEX else "thinking",
            }
    return entries


def main():
    original = load_original()

    # KET / PET word sets
    ket = set(json.loads((TMP / "ket_uniq.json").read_text()))
    pet = set(json.loads((TMP / "pet_uniq.json").read_text()))
    todo = json.loads((TMP / "todo_clean.json").read_text())
    todo_a2, todo_b1 = set(todo["a2"]), set(todo["b1"])

    # newly written entries (490)
    new_entries = {}
    for p in sorted(NEW.glob("*.json")):
        for e in json.loads(p.read_text()):
            new_entries[norm(e["w"])] = e

    # target = KET ∪ PET, cleaned of extraction noise and typos
    target = set()
    for w in ket | pet:
        n = norm(w)
        if n in NOISE or not n:
            continue
        n = CORRECTIONS.get(n, n)
        target.add(n)

    # CEFR sets, normalised the same way
    a2_set = {norm(w) for w in todo_a2} | {norm(w) for w in ket}
    used = set()
    seen_slugs = set()
    entries = []
    for word in sorted(target):
        if word in new_entries:
            e = dict(new_entries[word])
        elif word in original:
            e = dict(original[word])
        else:
            print("!! missing entry for", word)
            continue
        used.add(word)
        # CEFR: KET -> A2, PET-only -> B1
        e["cefr"] = "A2" if word in a2_set else "B1"
        # id (deduplicate slugs like well known / well-known)
        slug = slugify(e["w"])
        if slug in seen_slugs:
            n = 2
            while f"{slug}-{n}" in seen_slugs:
                n += 1
            slug = f"{slug}-{n}"
        seen_slugs.add(slug)
        e["id"] = slug
        entries.append(e)

    print("total entries:", len(entries), "| reused:", len(used & set(original)), "| new:", len(used & set(new_entries)))

    # Learning path: easier levels first, deterministic shuffle inside each level
    entries.sort(key=lambda c: (CEFR.index(c["cefr"]), hashlib.sha1(c["id"].encode()).hexdigest()))

    # media bit flags by checking existing files in public/atlas
    flags = []
    for e in entries:
        slug = e["id"]
        m = 0
        if (PUB / "img" / f"{slug}.webp").exists():
            m |= 1
        if (PUB / "audio" / "uk" / f"{slug}.mp3").exists():
            m |= 2
        if (PUB / "audio" / "us" / f"{slug}.mp3").exists():
            m |= 4
        if (PUB / "audio" / "ex" / f"{slug}.mp3").exists():
            m |= 8
        if (PUB / "audio" / "ex2" / f"{slug}.mp3").exists():
            m |= 16
        flags.append(m)

    # remove stale entry chunks
    for p in (PUB / "entries").glob("*.json"):
        p.unlink()

    index = []
    for i, (c, m) in enumerate(zip(entries, flags)):
        c["m"] = m
        s0 = c["senses"][0]
        zh = f'{s0["pos"]} {s0["zh"]}'.strip()
        index.append([c["id"], c["w"], zh, c["uk"] or c["us"], CEFR.index(c["cefr"]), TOPIC_INDEX[c["topic"]], m])

    (PUB / "entries").mkdir(parents=True, exist_ok=True)
    for n in range(0, len(entries), 100):
        chunk = [{k: v for k, v in c.items() if not k.startswith("_")} for c in entries[n:n + 100]]
        (PUB / "entries" / f"{n // 100}.json").write_text(json.dumps(chunk, ensure_ascii=False, separators=(",", ":")))

    meta = {
        "id": "word-atlas-ketpet",
        "version": 1,
        "name": "Word Atlas KET/PET",
        "license": "CC BY 4.0",
        "count": len(index),
        "examples": sum(len(c["ex"]) for c in entries),
        "illustrated": sum(1 for m in flags if m & 1),
        "voiced": sum(1 for m in flags if m & 2),
        "chunk": 100,
        "topics": TOPICS,
        "cefr": CEFR,
        "fields": ["id", "word", "zh", "ipa", "cefr", "topic", "media"],
        "words": index,
    }
    (PUB / "index.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")))

    DATA.mkdir(exist_ok=True)
    public = [{k: v for k, v in c.items() if k != "m"} for c in entries]
    (DATA / "word-atlas.json").write_text(json.dumps(public, ensure_ascii=False, indent=1))
    with open(DATA / "word-atlas.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "word", "ipa_uk", "ipa_us", "cefr", "topic", "meanings_zh", "definition_en",
                    "example1_en", "example1_zh", "example2_en", "example2_zh", "collocations", "word_family",
                    "synonyms", "antonyms", "tip_zh"])
        for c in public:
            ex = c["ex"] + [{"en": "", "zh": ""}] * (2 - len(c["ex"]))
            w.writerow([c["id"], c["w"], c["uk"], c["us"], c["cefr"], c["topic"],
                        " | ".join(f'{s["pos"]} {s["zh"]}' for s in c["senses"]),
                        " | ".join(s["en"] for s in c["senses"]),
                        ex[0]["en"], ex[0]["zh"], ex[1]["en"], ex[1]["zh"],
                        " ; ".join(c["col"]), " ; ".join(c["fam"]), ", ".join(c["syn"]), ", ".join(c["ant"]), c["tip"]])
    print(json.dumps({k: meta[k] for k in ("count", "examples", "illustrated", "voiced")}))


if __name__ == "__main__":
    main()
