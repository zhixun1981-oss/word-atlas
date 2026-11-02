import type { Progress } from "../store/store";

export interface WeakWord {
  id: string;
  score: number;
  tags: string[];
}

const DAY = 86400000;

/**
 * Rank the weakest words from learning data:
 * - recent mistakes (position in the mistakes list),
 * - FSRS lapses (forgotten reviews),
 * - cards stuck in relearning with reps,
 * - low stability despite several reviews,
 * - long-overdue, unreviewed cards.
 */
export function weakWords(progress: Progress, limit = 50): WeakWord[] {
  const out: WeakWord[] = [];
  const mistakeRank = new Map<string, number>();
  progress.mistakes.forEach((id, i) => mistakeRank.set(id, i));
  const now = Date.now();

  for (const [id, c] of Object.entries(progress.cards)) {
    const tags: string[] = [];
    let score = 0;
    const mr = mistakeRank.get(id);
    if (mr !== undefined) {
      score += Math.max(8, 30 - mr * 0.6);
      tags.push(mr < 5 ? "最近总错" : "近期错过");
    }
    if (c.lapses >= 1) {
      score += Math.min(36, c.lapses * 12);
      tags.push("多次遗忘");
    }
    if ((c.st === 0 || c.st === 1) && c.reps >= 1) {
      score += 8;
      tags.push("学而不牢");
    }
    if (c.reps >= 2 && c.s < 3) {
      score += 6;
      tags.push("不太稳定");
    }
    if (c.due < now && (c.last === undefined || now - c.last > 21 * DAY)) {
      score += 5;
      tags.push("久未复习");
    }
    if (score <= 0) continue;
    out.push({ id, score, tags: tags.slice(0, 2) });
  }
  // Mistake words without a card are weak too (should be rare).
  for (const [id, i] of mistakeRank) {
    if (!progress.cards[id]) out.push({ id, score: Math.max(8, 30 - i * 0.6), tags: ["最近总错"] });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
