/**
 * 抓图收尾三连：① 合并 credits2.jsonl → credits.json ② 点灯/修缩略图/对账
 * ③ 列出仍缺图词（分片错位漏抓的）写 /tmp/still-missing.txt
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const ROOT = "public/atlas";
const MEDIA_IMG = 1;

// —— ① 合并 credits（后写覆盖先写）——
const credits = fs.existsSync(`${ROOT}/credits.json`)
  ? JSON.parse(fs.readFileSync(`${ROOT}/credits.json`, "utf8"))
  : {};
if (fs.existsSync("/tmp/commons-credits2.jsonl")) {
  let n = 0;
  for (const line of fs.readFileSync("/tmp/commons-credits2.jsonl", "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      for (const [k, v] of Object.entries(rec)) { credits[k] = v; n++; }
    } catch {}
  }
  fs.writeFileSync(`${ROOT}/credits.json`, JSON.stringify(credits, null, 1));
  console.log(`credits merged: +${n} entries -> ${Object.keys(credits).length} total`);
}

// —— ② 点灯 + 缩略图补齐 + 对账 ——
const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
const imgSet = new Set(fs.readdirSync(`${ROOT}/img`).filter((f) => f.endsWith(".webp")));
const thumbSet = new Set(fs.readdirSync(`${ROOT}/thumb`).filter((f) => f.endsWith(".webp")));
const chunk = idx.chunk;
const byChunk = new Map();
const getChunk = (cn) => {
  if (!byChunk.has(cn)) byChunk.set(cn, JSON.parse(fs.readFileSync(`${ROOT}/entries/${cn}.json`, "utf8")));
  return byChunk.get(cn);
};
let lit = 0, unlit = 0, thumbFixed = 0;
for (let i = 0; i < idx.words.length; i++) {
  const r = idx.words[i];
  const hasFile = imgSet.has(r[0] + ".webp");
  const hasThumb = thumbSet.has(r[0] + ".webp");
  const bit = (r[6] || 0) & MEDIA_IMG;
  const cn = Math.floor(i / chunk);
  const cp = i % chunk;
  const arr = getChunk(cn);
  const e = arr[cp];
  if (!e || e.id !== r[0]) continue;
  // 缩略图缺失则补
  if (hasFile && !hasThumb) {
    execFileSync("cwebp", ["-q", "88", "-resize", "256", "256", `${ROOT}/img/${r[0]}.webp`, "-o", `${ROOT}/thumb/${r[0]}.webp`], { stdio: "pipe" });
    thumbFixed++;
  }
  if (hasFile && !bit) {
    r[6] = (r[6] || 0) | MEDIA_IMG;
    e.m = (e.m || 0) | MEDIA_IMG;
    lit++;
  } else if (!hasFile && bit) {
    r[6] = (r[6] || 0) & ~MEDIA_IMG;
    e.m = (e.m || 0) & ~MEDIA_IMG;
    unlit++;
  }
}
for (const [cn, arr] of byChunk) fs.writeFileSync(`${ROOT}/entries/${cn}.json`, JSON.stringify(arr));
let ill = 0;
for (const r of idx.words) if (r[6] & MEDIA_IMG) ill++;
idx.illustrated = ill;
fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(idx));
console.log(`bits: lit ${lit}, unlit ${unlit}, thumbFixed ${thumbFixed}, illustrated=${ill}/${idx.words.length}`);

// —— ③ 仍缺图清单 ——
const SKIP_N = new Set([
  "he","she","we","us","them","me","his","mine","ours","yours","its","themselves","himself","itself",
  "noone","eachother","those","the","of","to","for","not","only","then","whether","eventhough",
  "inorderto","incase","ofcourse","infact","intheend","firstofall","bytheway","byaccident","bymistake",
  "onpurpose","byname","onrequest","inhalf","intwo","closeto","intime","outof","infrontof","nextto",
  "insteadof","their","you","could","may","will","do","have","be","cannot","havegotto","usedto",
  "where","what","who","wow","bye","yeah","soso","yes","no","mr","mrs","id","thank",
].map((s) => s.replace(/[-_ ]/g, "")));
const nk = (s) => s.toLowerCase().replace(/[-_ ]/g, "").replace(/\d+$/, "");
const still = idx.words
  .filter((w) => (w[6] & MEDIA_IMG) === 0)
  .map((w) => w[0])
  .filter((id) => !SKIP_N.has(nk(id)));
fs.writeFileSync("/tmp/still-missing.txt", still.join("\n"));
console.log(`still missing (excl. function words): ${still.length} -> /tmp/still-missing.txt`);
