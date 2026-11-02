// 验证「空档位」问题的修复：
//   1. 老设置里存着 startLevel=3(B2)/4(C1) 的用户，今日首词应落到最近的有词档位 B1，而不是 A1；
//   2. 引导页、我的页、学习路线都只列真有词的档位；
//   3. 选过高档位的人，练习池不能是空的。
import { chromium } from "playwright";

const b = await chromium.launch({ channel: "chrome", headless: true });

const seed = async (p, extra = {}) => {
  await p.goto("http://localhost:5188/");
  await p.evaluate((s) => localStorage.setItem("word-atlas:settings", JSON.stringify(s)), {
    onboarded: true, splash: false, theme: "light", dailyNew: 10, ...extra,
  });
};

// ---- 1. 老设置 B2 / C1 的今日首词 ----
for (const lv of [3, 4]) {
  const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await seed(p, { startLevel: lv });
  await p.goto("http://localhost:5188/#/today");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.locator("button", { hasText: "开始今天的旅程" }).first().click().catch(() => {});
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => ({
    word: document.querySelector(".headword")?.textContent?.trim() ?? null,
    level: document.querySelector(".chip-level")?.textContent?.trim() ?? null,
  }));
  console.log(`startLevel=${lv}(${lv === 3 ? "B2" : "C1"}) → 今日首词`, JSON.stringify(r));
  await p.close();
}

// ---- 2. 学习路线只应有 3 站 ----
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await seed(p, { startLevel: 2 });
  await p.goto("http://localhost:5188/#/today");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const route = await p.evaluate(() => ({
    title: document.querySelector(".path-panel .eyebrow")?.textContent?.trim(),
    stations: [...document.querySelectorAll(".route .station b")].map((n) => n.textContent?.trim()),
    counts: [...document.querySelectorAll(".route .station-count")].map((n) => n.textContent?.replace(/\s+/g, "")),
    flag: document.querySelector(".station-flag")?.closest("li")?.querySelector("b")?.textContent?.trim(),
  }));
  console.log("学习路线:", JSON.stringify(route));
  await p.screenshot({ path: "shot-levels-route.png" });
  await p.close();
}

// ---- 3. 我的页档位按钮 ----
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
  await seed(p, { startLevel: 3 });
  await p.goto("http://localhost:5188/#/me");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const segs = await p.evaluate(() =>
    [...document.querySelectorAll(".segmented")].map((s) => [...s.querySelectorAll("button")].map((x) => x.textContent?.trim())),
  );
  console.log("我的页各分段控件:", JSON.stringify(segs.slice(0, 4)));
  await p.close();
}

// ---- 4. 引导页 ----
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("http://localhost:5188/");
  await p.evaluate(() => localStorage.clear());
  await p.goto("http://localhost:5188/#/today");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const chips = await p.evaluate(() => [...document.querySelectorAll(".choice-grid .choice")].map((n) => n.textContent?.replace(/\s+/g, " ").trim()));
  console.log("引导页档位:", JSON.stringify(chips));
  await p.locator(".onboard-card").screenshot({ path: "shot-levels-onboard.png" }).catch(() => {});
  await p.close();
}

// ---- 5. 高档位下练习池是否为空 ----
{
  const p = await b.newPage({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
  await seed(p, { startLevel: 4 });
  await p.goto("http://localhost:5188/#/practice");
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  const dead = await p.evaluate(() => {
    const cards = [...document.querySelectorAll(".mode-card")];
    return { total: cards.length, disabled: cards.filter((c) => c.disabled).length };
  });
  console.log("练习入口:", JSON.stringify(dead), "（disabled 应为 0）");
  await p.close();
}

await b.close();
