import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1180, height: 1100 } });
await p.goto("http://localhost:5188/");
await p.evaluate(() => localStorage.setItem("word-atlas:settings", JSON.stringify({ onboarded: true, splash: false, startLevel: 2, theme: "light" })));
await p.goto("http://localhost:5188/#/atlas");
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".chip-btn.lv", { timeout: 15000 });
await p.waitForTimeout(1000);
const raw = await p.evaluate(() =>
  [...document.querySelectorAll(".chip-btn.lv")].map((n) => ({ cls: n.className, text: JSON.stringify(n.textContent), count: n.querySelector(".chip-count")?.textContent }))
);
console.log(JSON.stringify(raw, null, 1));
await b.close();
