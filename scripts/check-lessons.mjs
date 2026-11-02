#!/usr/bin/env node
/** 截图校验：教室新单元、词汇课词表页、语法课考题拆解页。 */
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 1500 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5188/");
await page.evaluate(() => {
  localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk" }));
});
await page.goto("http://localhost:5188/#/classroom");
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".lesson-head", { timeout: 15000 });
await page.waitForTimeout(600);

// 1. 教室概览
await page.screenshot({ path: "shot-classroom.png", fullPage: false });

const stats = await page.evaluate(() => {
  const heads = [...document.querySelectorAll(".lesson-head")];
  const units = [...document.querySelectorAll(".unit-head, .cls-unit h3, h3")].map((h) => h.textContent.trim());
  return { lessons: heads.length, units: units.slice(0, 10), meter: document.querySelector(".classroom-meter, .cls-progress")?.textContent?.trim() };
});
console.log("lessons rendered:", stats.lessons);

// 2. 词汇课：找「家 · 朋友 · 日常」
const vocab = page.locator(".lesson-head", { hasText: "家 · 朋友 · 日常" });
console.log("vocab head count:", await vocab.count());
await vocab.first().scrollIntoViewIfNeeded();
await vocab.first().click();
await page.waitForTimeout(400);
await page.locator(".lesson-actions button", { hasText: "上这节课" }).first().click();
await page.waitForTimeout(800);
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(500);
await page.screenshot({ path: "shot-words.png" });
console.log("word cards:", await page.locator(".lp-word").count());

// 3. 语法课：拆解页
await page.goto("http://localhost:5188/#/classroom");
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".lesson-head");
const gram = page.locator(".lesson-head", { hasText: "一般现在时" }).first();
await gram.scrollIntoViewIfNeeded();
await gram.click();
await page.waitForTimeout(400);
await page.locator(".lesson-actions button", { hasText: "上这节课" }).first().click();
await page.waitForTimeout(800);
const total = await page.locator(".lp-dots i").count();
console.log("grammar pages:", total);
for (let k = 0; k < 8; k++) {
  if (await page.locator(".lp-bd").count()) break;
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
}
console.log("breakdown page found:", await page.locator(".lp-bd").count());
await page.screenshot({ path: "shot-breakdown.png" });

await browser.close();
