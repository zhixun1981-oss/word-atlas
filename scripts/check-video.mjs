#!/usr/bin/env node
/** 验证教室的视频入口：按钮出现 → 点开 → video 能加载播放。 */
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5188/");
await page.evaluate(() => {
  localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, theme: "dark", accent: "uk" }));
});
await page.goto("http://localhost:5188/#/classroom");
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".lesson-head");
await page.waitForTimeout(1200);

// 课时默认折叠，先展开有视频的那一节
await page.locator('[data-lesson="k-present-simple"]').scrollIntoViewIfNeeded();
await page.locator('[data-lesson="k-present-simple"]').click();
await page.waitForTimeout(500);

console.log("video buttons:", await page.locator(".lesson-video").count());

const target = page.locator(".lesson-video").first();
await target.scrollIntoViewIfNeeded();
const box = await target.boundingBox();
await page.screenshot({ path: "shot-video-btn.png", clip: { x: Math.max(0, box.x - 260), y: Math.max(0, box.y - 170), width: 900, height: 320 } });

await target.click();
await page.waitForSelector(".video-box video", { timeout: 8000 });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => {
  const v = document.querySelector(".video-box video");
  return { src: v.currentSrc, dur: v.duration, ready: v.readyState, w: v.videoWidth, h: v.videoHeight, paused: v.paused, t: v.currentTime };
});
console.log("video state:", JSON.stringify(state));
await page.screenshot({ path: "shot-video-player.png" });
await browser.close();
