#!/usr/bin/env node
/** 列出 Chrome 里实际可用的 speechSynthesis 语音，按语种分组。 */
import { chromium } from "playwright";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.goto("http://localhost:5188/", { waitUntil: "domcontentloaded" });

const voices = await page.evaluate(async () => {
  const s = window.speechSynthesis;
  let v = s.getVoices();
  if (!v.length) {
    await new Promise((r) => {
      const t = setTimeout(r, 2500);
      s.addEventListener("voiceschanged", () => {
        clearTimeout(t);
        r(null);
      }, { once: true });
    });
    v = s.getVoices();
  }
  return {
    total: v.length,
    firstCount: 0,
    list: v.map((x) => ({ name: x.name, lang: x.lang, local: x.localService, def: x.default })),
  };
});

console.log("voices total:", voices.total);
const byLang = {};
for (const v of voices.list) (byLang[v.lang] ??= []).push(v);
for (const lang of Object.keys(byLang).sort()) {
  if (!/^en|^zh/i.test(lang)) continue;
  console.log("\n" + lang);
  for (const v of byLang[lang]) console.log(`  ${v.local ? "L" : "N"} ${v.def ? "*" : " "} ${v.name}`);
}
await browser.close();
