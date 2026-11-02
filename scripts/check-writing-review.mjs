// 直接测四维批改：喂一篇有明显语法错误的作文，看模型给分和改错是否靠谱。
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5188/");

const draft = `Dear Tom, I am write to tell you my holiday. We go to beach last week. The weather is very good and we swim in sea. I very like it. Next day we eat ice cream and we go shop. It is happy. Please write back soon. Li Hua`;

const t0 = Date.now();
const res = await page.evaluate(async (text) => {
  const { reviewWriting } = await import("/src/exam/writingReview.ts");
  const item = {
    kind: "email",
    level: "A2",
    title: "KET Writing Part 6 · 邮件",
    prompt: "Write an email to your English friend about your holiday. Say: where you went; what the weather was like; what you did.",
    zh: "",
    points: [
      { word: "holiday", zh: "假期" },
      { word: "weather", zh: "天气" },
      { word: "ice cream", zh: "冰淇淋" },
    ],
    minWords: 25,
    sample: "",
    sampleZh: "",
  };
  try {
    const r = await reviewWriting(text, item);
    return { ok: true, r };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}, draft);

console.log(`耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (!res.ok) {
  console.log("失败:", res.err);
} else {
  const r = res.r;
  console.log("总分", r.score);
  r.dims.forEach((d) => console.log(`  ${d.name}\t${d.score}/5\t${d.note}`));
  console.log("肯定:", r.praise);
  console.log("改进:", r.tip);
  console.log("改写:", r.better);
  console.log("改错:");
  r.errors.forEach((e) => console.log(`  "${e.wrong}" → "${e.right}"  (${e.why})`));
}

await browser.close();
