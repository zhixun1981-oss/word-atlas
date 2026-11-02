// 验证 A1 入门层：不是「加了新词」，而是把地基词从 A2/B1 重新标到 A1。
// 要确认的是四件事：
//   1. 图鉴的等级筛选里 A1 有真实数量，A2 相应减少，总数不变；
//   2. 点 A1 能筛出词，卡片上标的是 A1；
//   3. 深链打开具体词时，词条页的级别标记跟索引一致（不是分块文件里写死的 A2）；
//   4. 重新标级没有把自带资源弄丢——发音仍然走真人录音，没退回系统 TTS。
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.addInitScript(() => {
  window.__said = [];
  window.__played = [];
  const hook = () => {
    if (!window.speechSynthesis) return;
    const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => {
      window.__said.push({ text: u.text, voice: u.voice ? u.voice.name : "(default)" });
      orig(u);
    };
  };
  setTimeout(hook, 0);
  setTimeout(hook, 600);
  // tts.ts 播放 mp3 时 new Audio(...)，元素不进 DOM，只能从构造函数上抓。
  const RealAudio = window.Audio;
  window.Audio = function (src) {
    if (src) window.__played.push(String(src));
    return new RealAudio(src);
  };
});

await page.goto("http://localhost:5188/");
await page.evaluate(() => {
  localStorage.setItem(
    "word-atlas:settings",
    JSON.stringify({ onboarded: true, splash: false, theme: "light", accent: "uk" }),
  );
});

// hash 变化不会触发重载，设置写进去以后必须真的 reload 一次，否则引导弹窗还盖在上面。
await page.goto("http://localhost:5188/#/atlas");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ---- 1. 等级筛选的分布 ----
const chips = await page.evaluate(() =>
  [...document.querySelectorAll(".chip-btn.lv")].map((b) => ({
    // 级别从 class 里读：文本节点里 A1 的数字会被别的地方吃掉。
    lv: (b.className.match(/lv-([A-C][12])/) || [])[1] ?? "?",
    count: Number(b.querySelector(".chip-count")?.textContent?.replace(/,/g, "") || 0),
  })),
);
const allChip = await page.evaluate(() => {
  const b = [...document.querySelectorAll(".chip-btn")].find((x) => x.textContent?.includes("所有难度"));
  return Number(b?.querySelector(".chip-count")?.textContent?.replace(/,/g, "") || 0);
});
console.log("所有难度:", allChip);
console.log("等级分布:", JSON.stringify(chips));
const a1 = chips.find((c) => c.lv === "A1");
console.log("A1 =>", a1 ? a1.count : "缺 chip");
const sum = chips.reduce((n, c) => n + c.count, 0);
console.log("各级合计:", sum, "（应等于所有难度", allChip, "）");

// ---- 2. 点 A1 筛选 ----
if (a1) {
  await page.locator(".chip-btn.lv-A1").first().click();
  await page.waitForTimeout(900);
  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll(".vgrid .tile-word")].slice(0, 10).map((n) => {
      const card = n.closest("button");
      return {
        word: n.textContent?.trim(),
        lv: card?.querySelector(".tile-lv")?.textContent?.trim(),
      };
    }),
  );
  console.log("A1 前 10 张卡片:", JSON.stringify(tiles));
  const lvSet = new Set(tiles.map((t) => t.lv));
  console.log("卡片级别是否全为 A1:", [...lvSet].join(",") === "A1" ? "是" : `否 → ${[...lvSet].join(",")}`);
  await page.screenshot({ path: "shot-a1-filter.png" });
}

// ---- 3. 深链打开 apple ----
await page.goto("http://localhost:5188/#/w/apple", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const entry = await page.evaluate(() => ({
  word: document.querySelector(".headword")?.textContent?.trim(),
  level: document.querySelector(".chip-level")?.textContent?.trim(),
  levelCls: document.querySelector(".chip-level")?.className,
  ipa: document.querySelector(".entry-ipa, .ipa")?.textContent?.trim() ?? null,
  hasImg: !!document.querySelector(".entry-art img"),
  senses: document.querySelector(".senses")?.textContent?.trim().slice(0, 40),
  ex: document.querySelector(".ex-en")?.textContent?.trim(),
}));
console.log("词条 apple:", JSON.stringify(entry, null, 1));
await page.screenshot({ path: "shot-a1-entry.png" });

// ---- 4. 发音还走真人录音吗 ----
const before = await page.evaluate(() => window.__said.length);
await page.locator(".pron .speak").first().click().catch(() => {});
await page.waitForTimeout(1500);
const said = await page.evaluate(() => window.__said);
const played = await page.evaluate(() => window.__played);
console.log("点击发音后 TTS 调用数:", said.length - before, "（0 = 用了真人录音）");
console.log("播放过的音频地址:", JSON.stringify(played.slice(0, 3)));

// ---- 5. 学习进度里 A1 那一行 ----
await page.goto("http://localhost:5188/#/me", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const rows = await page.evaluate(() =>
  [...document.querySelectorAll(".overview-level")].map((n) => n.textContent?.replace(/\s+/g, " ").trim().slice(0, 46)),
);
console.log("进度里的等级行:", JSON.stringify(rows));

// ---- 6. 端到端：选「入门」的新用户，今日页第一张卡应该是 A1 ----
await page.evaluate(() => localStorage.clear());
await page.goto("http://localhost:5188/#/today");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const onboardVisible = await page.locator(".onboard").count();
if (onboardVisible) {
  await page.locator(".choice", { hasText: "入门" }).first().click();
  await page.locator(".onboard button", { hasText: "出发" }).first().click();
  await page.waitForTimeout(1800);
}
const startLevel = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("word-atlas:settings") || "{}");
  return { startLevel: s.startLevel, dailyNew: s.dailyNew, onboarded: s.onboarded };
});
console.log("新手设置:", JSON.stringify(startLevel));

// 进今日页的词卡区域，看首词
await page.locator("button", { hasText: "开始今天的旅程" }).first().click().catch(() => {});
await page.waitForTimeout(2200);
const firstWord = await page.evaluate(() => ({
  word: document.querySelector(".headword")?.textContent?.trim() ?? null,
  level: document.querySelector(".chip-level")?.textContent?.trim() ?? null,
  fallbackCard: document.querySelector(".wotd-word")?.textContent?.trim() ?? null,
}));
console.log("今日首词:", JSON.stringify(firstWord));
await page.screenshot({ path: "shot-a1-today.png" });

// ---- 7. 练习页的等级入口 ----
await page.goto("http://localhost:5188/#/practice", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const prac = await page.evaluate(() =>
  [...document.querySelectorAll(".chip-btn, .mode-card")]
    .map((n) => n.textContent?.replace(/\s+/g, " ").trim().slice(0, 30))
    .filter((t) => t && /A1|入门/.test(t)),
);
console.log("练习页出现 A1/入门 的入口:", JSON.stringify(prac));

await browser.close();
