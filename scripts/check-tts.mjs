#!/usr/bin/env node
/**
 * 验证微课朗读实际用的语音：拦截 speechSynthesis.speak，打印 voice 名。
 * 预期不再落到 Albert / 音效音。
 */
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

await page.addInitScript(() => {
  window.__spoken = [];
  const cleanup = () => {
    if (!window.speechSynthesis) return;
    const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => {
      window.__spoken.push({ text: u.text.slice(0, 60), voice: u.voice ? u.voice.name : "(default)", lang: u.lang, rate: u.rate });
      // 不真的念，避免无声卡环境下报错
      void orig;
    };
  };
  setTimeout(cleanup, 0);
  setTimeout(cleanup, 600);
});

await page.goto("http://localhost:5188/");
await page.evaluate(() => {
  localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk" }));
});
await page.goto("http://localhost:5188/#/classroom");
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".lesson-head", { timeout: 15000 });
await page.locator(".lesson-head").first().click();
await page.waitForTimeout(400);
await page.locator(".lesson-actions button", { hasText: "上这节课" }).first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: "lesson-page.png" });
console.log("lp-slide count:", await page.locator(".lp-slide").count());
for (let k = 0; k < 8 && !(await page.locator(".lp-speak").count()); k++) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
}
console.log("speak-btn:", await page.locator(".lp-speak").count());
await page.locator(".lp-speak").first().click();
await page.waitForTimeout(800);

const spoken = await page.evaluate(() => window.__spoken);
console.log("spoken:", JSON.stringify(spoken, null, 1));

// 翻到例句页再点一次
for (let k = 0; k < 6; k++) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  if (await page.locator(".lp-ex-en").count()) break;
}
if (await page.locator(".lp-ex-en").count()) {
  await page.locator(".lp-ex-en").first().click();
  await page.waitForTimeout(400);
}
console.log("all:", JSON.stringify(await page.evaluate(() => window.__spoken), null, 1));
await browser.close();
