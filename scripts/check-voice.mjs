#!/usr/bin/env node
/** 验证「朗读声音」设置项：显示哪些候选、自动挑的是谁。 */
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5188/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem(
    "word-atlas:settings",
    JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk", sfx: false }),
  );
});
await page.goto("http://localhost:5188/#/me", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".voice-select", { timeout: 15000 });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const sel = document.querySelector(".voice-select");
  const opts = [...sel.querySelectorAll("option")].map((o) => o.textContent.trim());
  return { value: sel.value, opts };
});
console.log("selected:", JSON.stringify(info.value));
console.log("auto label:", info.opts[0]);
console.log("voice options:", info.opts.length);
console.log(info.opts.slice(0, 12).join("\n"));

const box = await page.locator(".voice-pick").boundingBox();
await page.locator(".voice-pick").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const b2 = await page.locator(".voice-pick").boundingBox();
await page.screenshot({
  path: "voice-setting.png",
  clip: { x: Math.max(0, b2.x - 180), y: Math.max(0, b2.y - 90), width: 640, height: 220 },
});
console.log("shot:", box ? "ok" : "no-box");
await browser.close();
