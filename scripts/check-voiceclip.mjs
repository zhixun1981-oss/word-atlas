// 验证口语录音回放：假麦克风灌一段音，走完「录音 → 停下 → 出波形 → 能播」。
import { chromium } from "playwright";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2, permissions: ["microphone"] });
const page = await ctx.newPage();
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

const card = page.locator("button.mode-card", { hasText: "口语问答" }).first();
await card.scrollIntoViewIfNeeded();
await card.click();
await page.waitForTimeout(1200);

const startBtn = page.locator("button", { hasText: /开始回答|开始描述/ }).first();
if (!(await startBtn.count())) {
  console.log("没找到开始按钮，页面文字：", (await page.locator("body").innerText()).slice(0, 300));
  await browser.close();
  process.exit(0);
}
await startBtn.click();
// 让假麦克风录一会儿
await page.waitForTimeout(11000);

const state = await page.evaluate(() => {
  const vc = document.querySelector(".vc");
  return {
    hasClip: !!vc,
    bars: vc ? vc.querySelectorAll(".vc-wave i").length : 0,
    lit: vc ? vc.querySelectorAll(".vc-wave i.is-on").length : 0,
    time: vc?.querySelector(".vc-time")?.textContent ?? null,
    label: vc?.querySelector(".vc-label")?.textContent ?? null,
    phaseHint: document.querySelector(".speaking-listening") ? "listening" : document.querySelector(".speaking-score") ? "graded" : "idle",
    err: document.querySelector(".warn-text")?.textContent ?? null,
  };
});
console.log(JSON.stringify(state, null, 1));

if (state.hasClip) {
  await page.locator(".vc-play").first().click();
  await page.waitForTimeout(900);
  const mid = await page.evaluate(() => {
    const vc = document.querySelector(".vc");
    return { lit: vc.querySelectorAll(".vc-wave i.is-on").length, time: vc.querySelector(".vc-time")?.textContent };
  });
  console.log("播放 0.9 秒后:", JSON.stringify(mid));
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => {
    const vc = document.querySelector(".vc");
    return { lit: vc.querySelectorAll(".vc-wave i.is-on").length, time: vc.querySelector(".vc-time")?.textContent };
  });
  console.log("再 3 秒后:", JSON.stringify(after));
  await page.locator(".vc").first().screenshot({ path: "shot-voiceclip.png" });
}

await browser.close();
