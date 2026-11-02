// 验证 B2/C1/C2 词层已真正可用：图鉴筛选计数、词条详情渲染、发音退回 TTS。
import { chromium } from "playwright";

const BASE = "http://localhost:5188";
const b = await chromium.launch({ channel: "chrome", headless: true });

const hook = async (p) => {
  await p.addInitScript(() => {
    window.__said = [];
    const install = () => {
      if (!window.speechSynthesis) return;
      const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (u) => {
        window.__said.push({ text: u.text, voice: u.voice ? u.voice.name : "(default)" });
        orig(u);
      };
    };
    setTimeout(install, 0);
    setTimeout(install, 600);
  });
};

let ok = true;
const assert = (cond, msg) => { console.log((cond ? "✅" : "❌") + " " + msg); if (!cond) ok = false; };

// 1. 图鉴筛选：B2/C1/C2 计数应为 48 / 37 / 40
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await hook(p);
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 2, theme: "light" })));
  await p.goto(`${BASE}/#/atlas`);
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForSelector(".chip-btn.lv", { timeout: 15000 });
  await p.waitForTimeout(800);
  const chips = await p.evaluate(() =>
    [...document.querySelectorAll(".chip-btn.lv")].map((n) => {
      const m = /lv-([A-C][12])/.exec(n.className);
      return { lv: m ? m[1] : null, count: Number(n.querySelector(".chip-count")?.textContent?.replace(/,/g, "") || 0) };
    })
  );
  const get = (lv) => chips.find((c) => c.lv === lv)?.count;
  assert(get("B2") === 79, `图鉴 B2 计数 = ${get("B2")} (期望 79)`);
  assert(get("C1") === 65, `图鉴 C1 计数 = ${get("C1")} (期望 65)`);
  assert(get("C2") === 54, `图鉴 C2 计数 = ${get("C2")} (期望 54)`);
  await p.close();
}

// 2. 词条详情：释义+例句+搭配+tip 渲染；发音走 TTS（speechSynthesis 调用>0）
for (const [word, lv] of [["affluent", "B2"], ["alleviate", "C1"], ["ubiquitous", "C2"]]) {
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await hook(p);
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 2, theme: "light" })));
  await p.goto(`${BASE}/#/w/${word}`);
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForSelector(`.entry .headword`, { timeout: 15000 });
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => ({
    lvBadge: document.querySelector(".entry .chip-level")?.textContent?.trim(),
    senses: document.querySelectorAll(".senses li").length,
    ex: document.querySelectorAll(".examples li").length,
    col: document.querySelectorAll(".collocations li").length,
    hasTip: !!document.querySelector(".tip"),
  }));
  assert(info.lvBadge === lv, `[${word}] 级别徽章 = ${info.lvBadge} (期望 ${lv})`);
  assert(info.senses >= 1 && info.ex >= 2, `[${word}] 释义 ${info.senses} / 例句 ${info.ex} (期望 ≥1 / ≥2)`);
  assert(info.col >= 1, `[${word}] 搭配 ${info.col} 条`);
  assert(info.hasTip, `[${word}] 含 tips 块`);
  const before = await p.evaluate(() => window.__said.length);
  await p.locator(".pron .speak").first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const said = await p.evaluate(() => window.__said.length);
  assert(said > before, `[${word}] 点击发音触发系统 TTS (${said - before} 次，证实无音频文件时走兜底)`);
  await p.close();
}

// 3. 选 B2 档的用户，今日学习首词来自 B2
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 3, dailyNew: 10, theme: "light" })));
  await p.goto(`${BASE}/#/today`);
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForSelector("button", { timeout: 15000 });
  await p.waitForTimeout(800);
  await p.locator("button", { hasText: "开始今天的旅程" }).first().click().catch(() => {});
  await p.waitForSelector(".headword", { timeout: 15000 });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({
    word: document.querySelector(".headword")?.textContent?.trim() ?? null,
    level: document.querySelector(".chip-level")?.textContent?.trim() ?? null,
  }));
  assert(r.level === "B2", `选 B2 档今日首词级别 = ${r.level} (期望 B2，词=${r.word})`);
  await p.screenshot({ path: "shot-b2-today.png" });
  await p.close();
}

await b.close();
console.log(ok ? "\n全部通过 ✅" : "\n存在失败 ❌");
process.exit(ok ? 0 : 1);
