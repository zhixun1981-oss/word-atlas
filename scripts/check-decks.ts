/** 检查每节课都有讲义，且不会落到「讲义正在补充」的兜底页。 */
import { CURRICULUM, allLessons } from "../src/exam/curriculum";
import { deckFor } from "../src/exam/lessons";

let fallback = 0;
let total = 0;
let pages = 0;

for (const level of ["A2", "B1"] as const) {
  const lessons = allLessons(level);
  console.log(`\n=== ${level === "A2" ? "KET" : "PET"} · ${lessons.length} 节 · ${lessons.reduce((n, l) => n + l.min, 0)} 分钟 ===`);
  for (const l of lessons) {
    total++;
    const deck = deckFor(l.id, level);
    if (!deck) {
      console.log(`  ✗ ${l.id} 无讲义`);
      fallback++;
      continue;
    }
    pages += deck.slides.length;
    const isFallback = deck.slides.some((s) => s.k === "recap" && s.points.some((p) => String(p).includes("讲义正在补充")));
    if (isFallback) {
      console.log(`  ✗ ${l.id} 走兜底`);
      fallback++;
    } else if (deck.slides.length < 4) {
      console.log(`  ! ${l.id} 只有 ${deck.slides.length} 页`);
    }
  }
}

console.log(`\n总计 ${total} 节 / ${pages} 页，兜底 ${fallback} 节`);
