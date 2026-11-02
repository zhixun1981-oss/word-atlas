// 合成听力对话音频：A 用 Flo（英音女），B 用 Daniel（英音男），句间留气口。
// 输出 public/atlas/dialogue/dN.mp3，和 src/exam/dialogues.ts 里的 script 一一对应。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/atlas/dialogue");
const TMP = path.join(ROOT, ".tmp-dialogue");

const VOICE = { A: "Flo (英语（英国）)", B: "Daniel" };
const RATE = "163";
const GAP = 0.34;

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const err = (e.stderr || "").toString().split("\n").filter((l) => /error|Error|Invalid|No such/.test(l)).join("\n");
    throw new Error(`${cmd} ${args.join(" ")}\n---\n${err}`);
  }
};

const say = (text, file, voice) =>
  run("say", ["-v", voice, "--file-format=WAVE", "--data-format=LEI16@22050", "-r", RATE, "-o", file, text]);

const dur = (f) => parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 从 TS 里拿数据：用 tsx 跑一个临时输出
const jsonPath = path.join(TMP, "items.json");
fs.mkdirSync(TMP, { recursive: true });
const probe = path.join(TMP, "dump.ts");
fs.writeFileSync(
  probe,
  `import { DIALOGUES } from ${JSON.stringify(path.join(ROOT, "src/exam/dialogues.ts"))};\nconsole.log(JSON.stringify(DIALOGUES));\n`,
);
const items = JSON.parse(execFileSync("npx", ["tsx", probe], { cwd: ROOT }).toString());
console.log(`共 ${items.length} 段对话`);

// 静音片段只做一次
const gapWav = path.join(TMP, "gap.wav");
run("ffmpeg", ["-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", String(GAP), "-y", gapWav]);

let total = 0;
for (const item of items) {
  const clips = [];
  item.script.forEach(([who, text], k) => {
    const f = path.join(TMP, `${item.id}-${k}.wav`);
    say(text, f, VOICE[who] ?? VOICE.A);
    clips.push(f);
    if (k < item.script.length - 1) clips.push(gapWav);
  });

  const list = path.join(TMP, `${item.id}.txt`);
  fs.writeFileSync(list, clips.map((c) => `file '${c}'`).join("\n"));
  const joined = path.join(TMP, `${item.id}.wav`);
  run("ffmpeg", ["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-y", joined]);

  const mp3 = path.join(OUT, `${item.id}.mp3`);
  run("ffmpeg", ["-i", joined, "-c:a", "libmp3lame", "-b:a", "64k", "-ar", "22050", "-ac", "1", "-y", mp3]);
  const d = dur(mp3);
  total += d;
  console.log(`  ${item.id}  ${item.level}  ${d.toFixed(1)}s  ${item.question.slice(0, 34)}`);
}

const sizes = fs.readdirSync(OUT).filter((f) => f.endsWith(".mp3"));
const bytes = sizes.reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`\n✓ ${sizes.length} 个文件，总时长 ${(total / 60).toFixed(1)} 分钟，${(bytes / 1024 / 1024).toFixed(1)}MB`);
fs.rmSync(TMP, { recursive: true, force: true });
