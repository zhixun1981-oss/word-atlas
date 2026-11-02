// 验证「发音对立对」：数据完整、混淆诊断、自评兜底、成绩单。
import { chromium } from "playwright";

const BASE = "http://localhost:5188";
let ok = true;
const assert = (cond, msg) => {
  console.log((cond ? "✅" : "❌") + " " + msg);
  if (!cond) ok = false;
};

// ---------- 0. 数据完整性（直接跑 TS 编译产物不方便，这里用 node 读源码断言结构） ----------
{
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/exam/minPairs.ts", import.meta.url), "utf8");
  const pairsCount = (src.match(/\["[a-z]+", "[a-z]+"\]/g) ?? []).length;
  assert(pairsCount >= 30, `对立对数据 ≥ 30 对（实际 ${pairsCount}）`);
  const groups = (src.match(/key: "/g) ?? []).length;
  assert(groups >= 8, `音位对立组 ≥ 8 组（实际 ${groups}）`);
  assert(src.includes("confusionOf"), "含混淆诊断函数 confusionOf");
  assert(src.includes("/ɪ/ vs /iː/"), "含 /ɪ/ vs /iː/ 对立");
  assert(src.includes("/θ/ vs /s/"), "含咬舌 /θ/ vs /s/ 对立");
}

// ---------- 1. 浏览器全流程 ----------
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
const boot = async (hash) => {
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 2, theme: "light" })));
  await p.goto(`${BASE}/#${hash}`);
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(900);
};

await boot("/practice");
const entry = await p.evaluate(() => {
  const btn = [...document.querySelectorAll(".mode-card")].find((x) => x.textContent.includes("发音对立对"));
  return { found: !!btn, label: btn?.textContent.trim() ?? "" };
});
assert(entry.found, `练习页有「发音对立对」入口（${entry.label}）`);

// 点进去
await p.evaluate(() => {
  [...document.querySelectorAll(".mode-card")].find((x) => x.textContent.includes("发音对立对"))?.click();
});
await p.waitForTimeout(600);

const round = await p.evaluate(() => {
  const words = [...document.querySelectorAll(".minpair-word")].map((x) => ({
    w: x.querySelector("b")?.textContent.trim() ?? "",
    ipa: x.querySelector("small")?.textContent.trim() ?? "",
    target: x.classList.contains("is-target"),
  }));
  return {
    words,
    contrast: document.querySelector(".panel-head .muted")?.textContent.trim() ?? "",
    tip: document.querySelector(".minpair-tip")?.textContent.trim() ?? "",
    hasSelf: !!document.querySelector(".minpair-self"),
    selfLabels: [...document.querySelectorAll(".minpair-self button")].map((x) => x.textContent.trim()),
    counter: document.querySelector(".panel-head .eyebrow")?.textContent.trim() ?? "",
  };
});
assert(round.words.length === 2, `一对两个词（实际 ${round.words.length}）`);
assert(round.words.filter((w) => w.target).length === 1, "恰好一个目标词高亮");
assert(round.words.every((w) => w.w && /^\/.+\/$/.test(w.ipa)), `两个词都有音标（${round.words.map((w) => w.w + w.ipa).join(" ")}）`);
assert(!!round.contrast && round.contrast.includes("vs"), `显示对立音位（实际「${round.contrast}」）`);
assert(round.tip.length > 10, `有发音要领（${round.tip.slice(0, 24)}…）`);
assert(round.hasSelf, "自评兜底通道存在");
assert(round.selfLabels.some((x) => x.includes("读对了")), `自评按钮（${round.selfLabels.join(" | ")}）`);
assert(/对立对 · 1 \/ 8/.test(round.counter), `计数器「${round.counter}」`);

// 自评读成对立词 → 应出混淆诊断
await p.evaluate(() => {
  [...document.querySelectorAll(".minpair-self button")].find((x) => x.textContent.includes("读成"))?.click();
});
await p.waitForTimeout(500);
const verdict = await p.evaluate(() => {
  const v = document.querySelector(".minpair-verdict");
  return {
    cls: v?.className ?? "",
    text: v?.textContent.trim() ?? "",
    hasDiag: !!document.querySelector(".minpair-diag"),
    score: document.querySelector(".minpair-score")?.textContent.trim() ?? "",
  };
});
assert(verdict.cls.includes("is-confused"), `混淆态样式（${verdict.cls}）`);
assert(verdict.hasDiag, "给出音位混淆诊断（minpair-diag）");
assert(/发成/.test(verdict.text), `诊断文案含「发成」（${verdict.text.slice(0, 40)}…）`);
assert(/^\d+$/.test(verdict.score), `有分数（${verdict.score}）`);

// 自评读对了 → is-ok
await p.evaluate(() => {
  [...document.querySelectorAll(".minpair-actions button")].find((x) => x.textContent.includes("下一个"))?.click();
});
await p.waitForTimeout(400);
await p.evaluate(() => {
  [...document.querySelectorAll(".minpair-self button")].find((x) => x.textContent.includes("读对了"))?.click();
});
await p.waitForTimeout(400);
const okState = await p.evaluate(() => document.querySelector(".minpair-verdict")?.className ?? "");
assert(okState.includes("is-ok"), `读对了给正面反馈（${okState}）`);

// 连点跑完 8 对到成绩单
for (let k = 0; k < 7; k++) {
  const moved = await p.evaluate(() => {
    const nextBtn = [...document.querySelectorAll(".minpair-actions button")].find((x) => /下一个|看成绩单/.test(x.textContent));
    if (!nextBtn) return false;
    nextBtn.click();
    return true;
  });
  await p.waitForTimeout(250);
  if (!moved) break;
  // 每对都补一次自评，否则没有成绩单数据
  await p.evaluate(() => {
    [...document.querySelectorAll(".minpair-self button")].find((x) => x.textContent.includes("读对了"))?.click();
  });
  await p.waitForTimeout(250);
}
await p.evaluate(() => {
  [...document.querySelectorAll("button")].find((x) => x.textContent.includes("看成绩单"))?.click();
});
await p.waitForTimeout(500);
const report = await p.evaluate(() => ({
  hasReport: !!document.querySelector(".minpair-report"),
  items: document.querySelectorAll(".minpair-list li").length,
  title: document.querySelector(".minpair-title")?.textContent.trim() ?? "",
  hasWeak: !!document.querySelector(".minpair-weak"),
  again: [...document.querySelectorAll("button")].some((x) => x.textContent.includes("再来一轮")),
}));
assert(report.hasReport, "跑到成绩单");
assert(report.items > 0, `成绩单列出各对结果（${report.items} 条）`);
assert(/分 · 对 \d+\/\d+/.test(report.title), `标题含得分与对数（「${report.title}」）`);
assert(report.again, "有「再来一轮」");

await b.close();
console.log(ok ? "\n全部通过 ✅" : "\n存在失败 ❌");
process.exit(ok ? 0 : 1);
