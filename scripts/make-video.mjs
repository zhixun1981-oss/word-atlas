#!/usr/bin/env node
/**
 * 把一节站内微课渲染成 mp4（有声课件视频）。
 *
 *   node scripts/make-video.mjs --lesson k-present-simple [--level A2] [--out out/demo.mp4]
 *
 * 做法：playwright 逐页截讲义卡片 → 每页文本切成中/英句，分别用
 * Tingting（中文讲解）和 Daniel（英文例句）合成音轨 → ffmpeg 按音频
 * 时长把静帧拼成 1080p 视频。没有真人出镜，但内容、发音、节奏都是真的。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};

const lessonId = arg("lesson", "k-present-simple");
const level = arg("level", lessonId.startsWith("p-") ? "B1" : "A2");
const outFile = path.resolve(arg("out", `out/${lessonId}.mp4`));
const work = fs.mkdtempSync(path.join(os.tmpdir(), "lp-video-"));
const APP = arg("app", "http://localhost:5188/");
const CN_VOICE = arg("cn", "Tingting");
const EN_VOICE = arg("en", "Daniel");
const bg = "0x0D1120";

const run = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
  } catch (e) {
    const err = (e.stderr || "").toString().split("\n").filter((l) => /error|Error|Invalid|No such|not found/.test(l)).join("\n");
    throw new Error(`${cmd} ${args.join(" ")}\n---\n${err}`);
  }
};
const say = (text, file, voice, rate = "170") =>
  run("say", ["-v", voice, "-r", rate, "--file-format=WAVE", "--data-format=LEI16@22050", "-o", file, text]);
const duration = (file) =>
  parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1024, height: 820 }, deviceScaleFactor: 2 });
await page.goto(APP);
await page.evaluate(() => {
  localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk" }));
});
await page.goto(`${APP}#/classroom`);
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(`[data-lesson="${lessonId}"]`, { timeout: 15000 });
await page.locator(`[data-lesson="${lessonId}"]`).click();
await page.waitForTimeout(350);
await page.locator(".lesson-actions button", { hasText: "上这节课" }).first().click();
await page.waitForSelector(".lp-slide", { timeout: 10000 });
await page.waitForTimeout(600);

// 视频里只要讲义：去掉顶栏/底栏/翻页/返回按钮，重排成幻灯片版式。
await page.addStyleTag({
  content: `
    .topbar,.tabbar,.footer,.lp-nav,.lp-dots,.typing-meter,.lp-speak,.typing-top{display:none!important}
    .main{padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;min-height:100vh!important}
    .page.practice{width:100%!important;max-width:940px!important;margin:0 auto!important;padding:16px!important;
      background:transparent!important;border:0!important;box-shadow:none!important;
      display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:auto!important}
    .lp-head{margin-bottom:18px!important}
    .lp-head h1{font-size:50px!important;line-height:1.12!important}
    .lp-head .lede{font-size:15.5px!important}
    .lp-slide{min-height:auto!important;padding:32px 34px!important;font-size:17.5px!important}
    .lp-slide h2{font-size:27px!important}
    .lp-slide .lp-line,.lp-slide li,.lp-slide p{font-size:16.5px!important;line-height:1.95!important}
    .lp-ex-en svg,.lp-quiz-opts svg,.lp-bd-opts svg{display:none!important}
    html,body,.app,.main,.page.practice{background:#0d1120!important}
    body{overflow:hidden}
    ::-webkit-scrollbar{display:none}
    *{cursor:none!important}
  `,
});

// 逐句高亮：念到哪句，哪句亮起来，其余淡化——比静态整页像讲解视频。
await page.addStyleTag({
  content: `
    .lp-slide [data-say]{transition:none!important}
    .lp-slide.has-focus [data-say]:not(.is-say){opacity:0.34}
    .lp-slide [data-say].is-say{
      position:relative;
      opacity:1!important;
      background:color-mix(in oklab,var(--terra) 14%,transparent);
      border-radius:8px;
      box-shadow:0 0 0 6px color-mix(in oklab,var(--terra) 14%,transparent);
    }
    .lp-slide [data-say].is-say::before{
      content:"";position:absolute;left:-14px;top:6px;bottom:6px;width:3px;
      border-radius:2px;background:var(--terra);
    }
  `,
});

const total = await page.locator(".lp-dots i").count();
console.log(`lesson ${lessonId}: ${total} 页`);

const LEAD = 1.0;
const GAP = 0.3;
const TAIL = 0.7;
const segs = [];
const dims = [];

for (let i = 0; i < total; i++) {
  if (i > 0) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(380);
  }
  // 给这一页的每段文字打标记
  const items = await page.evaluate(() => {
    const el = document.querySelector(".lp-slide");
    if (!el) return [];
    el.classList.remove("has-focus");
    const nodes = [...el.querySelectorAll("h2,p,li,button")].filter(
      (n) =>
        !n.querySelector("p,li,h2") &&
        !/^(朗读|上一页|下一页|上完这节课)$/.test(n.innerText.trim()) &&
        n.innerText.trim().length >= 4,
    );
    nodes.forEach((n, k) => n.setAttribute("data-say", String(k)));
    return nodes.map((n, k) => {
      const text = n.innerText.replace(/\s+/g, " ").trim();
      const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const en = (text.match(/[a-zA-Z]/g) || []).length;
      return { idx: k, text: text.slice(0, 150), cn: cjk >= 4 || (cjk > 0 && en < cjk) };
    });
  });

  // 页首：整页停留一下（不高亮），让人先看清这页讲什么
  const intro = path.join(work, `p${i}-intro.png`);
  await page.locator(".page.practice.lp").screenshot({ path: intro });
  dims.push({ img: intro, secs: LEAD, audio: null });

  const spoken = items.filter((it) => (it.cn ? it.text.length >= 4 : (it.text.match(/[a-zA-Z]/g) || []).length >= 12));
  await page.evaluate(() => document.querySelector(".lp-slide")?.classList.add("has-focus"));

  let n = 0;
  for (const it of spoken) {
    await page.evaluate((idx) => {
      document.querySelectorAll(".lp-slide .is-say").forEach((e) => e.classList.remove("is-say"));
      document.querySelector(`.lp-slide [data-say="${idx}"]`)?.classList.add("is-say");
    }, it.idx);
    const img = path.join(work, `p${i}-s${n}.png`);
    await page.locator(".page.practice.lp").screenshot({ path: img });
    const audio = path.join(work, `p${i}-s${n}.wav`);
    say(it.text, audio, it.cn ? CN_VOICE : EN_VOICE, it.cn ? "160" : "170");
    dims.push({ img, secs: duration(audio) + GAP, audio });
    n++;
  }
  await page.evaluate(() => {
    document.querySelectorAll(".lp-slide .is-say").forEach((e) => e.classList.remove("is-say"));
    document.querySelector(".lp-slide")?.classList.remove("has-focus");
  });
  console.log(`  第 ${i + 1} 页 · ${n} 句`);
}

await browser.close();

// 每句一段：静帧 + 对应音频，轻微推镜避免死画面
const gapWav = path.join(work, "gap.wav");
run("ffmpeg", ["-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", String(GAP), "-y", gapWav]);

for (let k = 0; k < dims.length; k++) {
  const d = dims[k];
  const secs = d.secs + (d.audio ? 0 : 0);
  const seg = path.join(work, `seg-${String(k).padStart(3, "0")}.mp4`);
  const vf = [
    "scale=1728:972:force_original_aspect_ratio=decrease",
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0d1120",
    "format=yuv420p",
    "fade=t=in:st=0:d=0.16",
  ].join(",");
  const args = ["-loop", "1", "-framerate", "30", "-t", secs.toFixed(2), "-i", d.img];
  if (d.audio) args.push("-i", d.audio);
  else args.push("-f", "lavfi", "-i", `anullsrc=r=22050:cl=mono:duration=${secs.toFixed(2)}`);
  args.push(
    "-vf", vf,
    "-af", `apad=pad_dur=0.1`,
    "-t", secs.toFixed(2),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "1",
    "-y", seg,
  );
  run("ffmpeg", args, work);
  segs.push(seg);
  if (k % 8 === 7) console.log(`  合成 ${k + 1}/${dims.length} 段`);
}

// 页尾留白：每页最后补一口气（拼到该页最后一段的时长里已含 TAIL）
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const concatList = path.join(work, "concat.txt");
fs.writeFileSync(concatList, segs.map((x) => `file '${x}'`).join("\n"));
run("ffmpeg", ["-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", "-movflags", "+faststart", "-y", outFile], work);

const size = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1);
console.log(`\n✓ ${outFile}  ${size}MB  ${duration(outFile).toFixed(1)}s  ${dims.length} 个镜头`);
