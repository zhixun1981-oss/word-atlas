// 验证「题量放开」与「学习月历」两块改动：
// 1. 练习页：每轮题量选择器（10/20/30/50）存在，词池计数不再被 slice(0,400) 掐死
// 2. 我的页：热力图/月历可切换，月历能翻月、格子数正确
import { chromium } from "playwright";

const BASE = "http://localhost:5188";
const b = await chromium.launch({ channel: "chrome", headless: true });
let ok = true;
const assert = (cond, msg) => {
  console.log((cond ? "✅" : "❌") + " " + msg);
  if (!cond) ok = false;
};

const boot = async (p, hash) => {
  await p.goto(`${BASE}/`);
  await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 2, theme: "light" })));
  await p.goto(`${BASE}/#${hash}`);
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(900);
};

// ---------- 1. 练习页：每轮题量 ----------
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await boot(p, "/practice");
  const r = await p.evaluate(() => {
    const heads = [...document.querySelectorAll(".eyebrow")].map((h) => h.textContent.trim());
    const segs = [...document.querySelectorAll(".segmented")].map((s) => [...s.querySelectorAll("button")].map((x) => x.textContent.trim()));
    const hint = [...document.querySelectorAll("p.muted")].map((x) => x.textContent.trim()).find((t) => t.includes("可练") || t.includes("随机"));
    return { heads, segs, hint };
  });
  assert(r.heads.includes("每轮题量"), `练习页有「每轮题量」标题（实际 heads=${JSON.stringify(r.heads)}）`);
  const sizeSeg = r.segs.find((s) => s.join(",") === "10,20,30,50");
  assert(!!sizeSeg, `题量选项 = 10/20/30/50（实际 ${JSON.stringify(r.segs)}）`);
  assert(!!r.hint && /(可练|从学习路线的)\s*[\d,]+\s*个词/.test(r.hint), `词池提示显示池子计数（实际「${r.hint}」）`);
  // 提示文本两种来源各一种格式：「可练 N 个词」/「从学习路线的 N 个词」
  const poolN = r.hint ? Number((r.hint.match(/(?:可练|从学习路线的)\s*([\d,]+)/)?.[1] ?? "0").replace(/,/g, "")) : 0;
  assert(poolN > 400, `词池 > 400（实际 ${poolN}）——slice(0,400) 已放开`);
  assert(!!r.hint && /随机抽?\s*20\s*个/.test(r.hint), `默认每轮 20 题（实际「${r.hint}」）`);
  // 切到 30 题，提示应跟着变（按「每轮题量」标题定位它后面的分段控件）
  await p.evaluate(() => {
    const h = [...document.querySelectorAll(".eyebrow")].find((x) => x.textContent.trim() === "每轮题量");
    const seg = h?.nextElementSibling;
    [...(seg?.querySelectorAll("button") ?? [])].find((x) => x.textContent.trim() === "30")?.click();
  });
  await p.waitForTimeout(250);
  const hint30 = await p.evaluate(() =>
    [...document.querySelectorAll("p.muted")].map((x) => x.textContent.trim()).find((t) => t.includes("随机")) ?? "",
  );
  assert(/随机抽?\s*30\s*个/.test(hint30), `切到 30 题后提示更新（实际「${hint30}」）`);
  await p.close();
}

// ---------- 2. 我的页：学习月历 ----------
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await boot(p, "/me");
  const found = await p.evaluate(() => {
    const h = [...document.querySelectorAll(".eyebrow")].map((x) => x.textContent.trim());
    return { hasWeek: h.includes("过去 20 周"), hasToggle: !!document.querySelector(".panel-head .segmented") };
  });
  assert(found.hasWeek && found.hasToggle, `我的页有热力图面板 + 切换控件（hasWeek=${found.hasWeek}）`);

  // 切到月历
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".panel-head .segmented button")].find((x) => x.textContent.trim() === "月历");
    btn?.click();
  });
  await p.waitForTimeout(400);
  const cal = await p.evaluate(() => {
    const grid = document.querySelector(".cal-grid:not(.cal-dow-row)");
    const days = grid ? [...grid.querySelectorAll(".cal-day")].filter((x) => !x.classList.contains("is-empty")).length : 0;
    const title = document.querySelector(".cal-title")?.textContent.trim() ?? "";
    const dows = [...document.querySelectorAll(".cal-dow")].map((x) => x.textContent.trim());
    return { days, title, dows, hasCal: !!grid };
  });
  assert(cal.hasCal, "月历网格已渲染");
  assert(cal.days >= 28 && cal.days <= 31, `当月格子数 28–31（实际 ${cal.days}）`);
  assert(/\d{4} 年 \d{1,2} 月/.test(cal.title), `月标题为「YYYY 年 M 月」（实际「${cal.title}」）`);
  assert(cal.dows.join("") === "日一二三四五六", `星期表头（实际 ${cal.dows.join("")}）`);

  // 翻月
  const before = cal.title;
  await p.evaluate(() => document.querySelector(".cal-nav[aria-label='下个月']")?.click());
  await p.waitForTimeout(300);
  const after = await p.evaluate(() => document.querySelector(".cal-title")?.textContent.trim() ?? "");
  assert(after && after !== before, `翻到下个月（${before} → ${after}）`);
  await p.evaluate(() => document.querySelector(".cal-nav[aria-label='上个月']")?.click());
  await p.waitForTimeout(300);
  const back = await p.evaluate(() => document.querySelector(".cal-title")?.textContent.trim() ?? "");
  assert(back === before, `翻回本月（${back}）`);
  await p.close();
}

// ---------- 3. 回归：翻回热力图仍在 ----------
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await boot(p, "/me");
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".panel-head .segmented button")].find((x) => x.textContent.trim() === "月历");
    btn?.click();
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".panel-head .segmented button")].find((x) => x.textContent.trim() === "热力图");
    btn?.click();
  });
  await p.waitForTimeout(300);
  const back = await p.evaluate(() => ({
    grid: !!document.querySelector(".heatmap"),
    cells: document.querySelectorAll(".heatmap span").length,
  }));
  assert(back.grid && back.cells > 0, `切回热力图仍正常（${back.cells} 格）`);
  await p.close();
}

// ---------- 4. 今日页：复习排期面板 ----------
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
  await boot(p, "/");
  const r = await p.evaluate(() => {
    const panel = [...document.querySelectorAll(".panel")].find((x) => x.querySelector(".eyebrow")?.textContent.trim() === "复习排期");
    if (!panel) return { found: false };
    const bars = panel.querySelectorAll(".forecast li").length;
    const labels = [...panel.querySelectorAll(".forecast small")].map((x) => x.textContent.trim());
    const counts = [...panel.querySelectorAll(".forecast b")].map((x) => x.textContent.trim());
    const hint = panel.querySelector("p.muted")?.textContent.trim() ?? "";
    return { found: true, bars, labels, counts, hint };
  });
  assert(r.found, "今日页有「复习排期」面板");
  assert(r.bars === 7, `7 根排期柱（实际 ${r.bars}）`);
  assert(r.labels[0] === "今天" && r.labels[1] === "明天" && r.labels[2] === "后天", `日期标签（实际 ${r.labels.join("/")}）`);
  assert(r.counts.every((c) => /^\d+$/.test(c)), `柱顶计数为数字（实际 ${r.counts.join(",")}）`);
  assert(/共\s*[\d,]+\s*个到期|暂时没有排期/.test(r.hint), `汇总文案（实际「${r.hint}」）`);
  await p.close();
}

await b.close();
console.log(ok ? "\n全部通过 ✅" : "\n存在失败 ❌");
process.exit(ok ? 0 : 1);
