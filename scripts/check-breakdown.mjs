// 用状态机推进整卷：每一轮只看当前屏幕有什么可点的，直到出成绩单。
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto("http://localhost:5188/");
await page.evaluate(() => {
  localStorage.setItem(
    "word-atlas:settings",
    JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk", examLevel: "KET" }),
  );
});
await page.goto("http://localhost:5188/#/practice");
await page.reload({ waitUntil: "networkidle" });

const card = page.locator("button.mode-card", { hasText: "KET 限时模考" }).first();
await card.scrollIntoViewIfNeeded();
await card.click();
await page.waitForSelector(".mock-timer", { timeout: 30000 });
await page.waitForTimeout(1600);

let seen = [];
for (let step = 0; step < 80; step++) {
  if (await page.locator(".mock-report").count()) {
    console.log("到达成绩单 @", step);
    break;
  }
  const eyebrow = await page
    .locator(".eyebrow")
    .first()
    .textContent()
    .catch(() => "");
  seen.push((eyebrow || "").trim().slice(0, 20));

  if (/Listening/.test(eyebrow || "") && !globalThis.__shotListening) {
    globalThis.__shotListening = true;
    const info = await page.evaluate(() => ({
      eyebrow: document.querySelector(".exam-stage .eyebrow")?.textContent?.trim(),
      hint: document.querySelector(".exam-hint")?.textContent?.trim(),
      question: document.querySelector(".dialogue-question")?.textContent?.trim(),
      buttons: [...document.querySelectorAll(".mock-listen-bar .btn")].map((b) => b.textContent.trim()),
      options: [...document.querySelectorAll(".exam-options .exam-opt b")].map((b) => b.textContent),
    }));
    console.log("听力首题:", JSON.stringify(info, null, 1));
    await page.screenshot({ path: "shot-listening.png" });
  }

  // 1) 选择题：点第一个选项，再点下一题
  const opt = page.locator(".exam-options button, .sign-options button, .match-options button").first();
  if (await opt.count()) {
    await opt.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(120);
    const next = page.locator(".exam-next, button", { hasText: /下一题|继续|交卷|看成绩单/ }).first();
    if (await next.count()) await next.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(160);
    continue;
  }
  // 2) 开放填空：只填 .mock-gap
  const gaps = page.locator("input.mock-gap");
  const gn = await gaps.count();
  if (gn > 0) {
    for (let i = 0; i < gn; i++) await gaps.nth(i).fill("x").catch(() => {});
    const go = page.locator(".exam-feedback button").first();
    if (await go.count()) await go.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(600);
    const nx = page.locator(".exam-feedback button").first();
    if (await nx.count()) await nx.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(500);
    continue;
  }
  // 3) 写作：写够字数
  const ta = page.locator("textarea");
  if (await ta.count()) {
    await ta
      .fill(
        "Dear Tom, I am writing to tell you about my weekend. Last Saturday I went to the park with my sister. We played football and ate ice cream. It was sunny and we were very happy. Next week I will visit you. Please write back soon. Best wishes, Li Hua.",
      )
      .catch(() => {});
    const done = page.locator("button", { hasText: /提交|下一步|完成/ }).first();
    if (await done.count()) await done.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
    continue;
  }
  await page.waitForTimeout(300);
}

await page.waitForSelector(".mock-report", { timeout: 15000 }).catch(() => console.log("仍未到成绩单"));
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".weak-bars li")].map((li) => ({
    name: li.querySelector(".wb-name")?.textContent?.trim(),
    num: li.querySelector(".wb-num")?.textContent?.trim(),
    hint: li.querySelector(".wb-hint")?.textContent?.trim()?.slice(0, 50),
    low: li.classList.contains("is-low"),
  }));
  return {
    head: document.querySelector(".mock-weak .eyebrow")?.textContent?.trim() ?? null,
    rows,
    foot: document.querySelector(".wb-foot")?.textContent?.trim() ?? null,
    scores: [...document.querySelectorAll(".paper-scores > div")].map((d) => d.textContent.trim().replace(/\s+/g, " ")),
  };
});
console.log(JSON.stringify(info, null, 1));
console.log("轨迹:", [...new Set(seen)].join(" → "));

await page.locator(".mock-report").screenshot({ path: "shot-breakdown.png" });

// 写作精批：点按钮，等四维出来
const aiBtn = page.locator("button", { hasText: "让 AI 精批这篇作文" });
if (await aiBtn.count()) {
  console.log("找到精批按钮，开始跑模型…");
  await aiBtn.click();
  await page.waitForSelector(".wr-head", { timeout: 90000 }).catch(() => console.log("四维没出来"));
  await page.waitForTimeout(800);
  const dims = await page.evaluate(() =>
    [...document.querySelectorAll(".mock-write-review .wr-dims li")].map((li) => ({
      name: li.querySelector(".wr-dim-name")?.textContent,
      num: li.querySelector(".wr-dim-num")?.textContent,
      note: li.querySelector(".wr-dim-note")?.textContent,
    })),
  );
  console.log("四维:", JSON.stringify(dims, null, 1));
  await page.locator(".mock-write-review").screenshot({ path: "shot-writereview.png" });
} else {
  console.log("没有精批按钮（模型未就绪？）");
}

// 验证指路能真的点过去
const firstGo = page.locator(".wb-go").first();
console.log("第一个指路:", await firstGo.textContent(), "→", await firstGo.getAttribute("href"));
await firstGo.click();
await page.waitForTimeout(1400);
const landed = await page.evaluate(() => ({
  hash: location.hash,
  open: document.querySelector(".lesson-list li.is-open .lesson-head")?.getAttribute("data-lesson") ?? null,
  inView: (() => {
    const el = document.querySelector(".lesson-list li.is-open");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.top > -40 && r.top < window.innerHeight - 80;
  })(),
}));
console.log("落地:", JSON.stringify(landed));
await page.screenshot({ path: "shot-deeplink.png" });
await browser.close();
