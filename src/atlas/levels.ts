import type { Atlas } from "./types";

/**
 * 词库里真实有词的档位，升序。
 *
 * `atlas.cefr` 是固定的六档标签 ["A1"…"C2"]，但当前语料只覆盖 A1/A2/B1，
 * B2 以上是空的。界面若直接照着 cefr 数组渲染，用户就能选到一个没有词的档位——
 * 选了之后要么今日页的词被兜底逻辑拉回 A1，要么练习池直接为空。
 * 所以凡是「让用户挑档位」「按档位取词」的地方，都以这里为准。
 */
export function usedLevels(atlas: Atlas): number[] {
  const seen = new Set<number>();
  for (const w of atlas.words) seen.add(w.cefr);
  return [...seen].sort((a, b) => a - b);
}

/**
 * 把想要的档位收敛到最近一个真有词的档位。
 *
 * 优先往下取（不超出学习者当前能承受的难度）：想要 B2、库里最高 B1，就给 B1。
 * 没有更低的档位时才退到库里最低的一档。
 */
export function resolveLevel(atlas: Atlas, want: number): number {
  const used = usedLevels(atlas);
  if (!used.length) return want;
  for (let i = used.length - 1; i >= 0; i--) if (used[i] <= want) return used[i];
  return used[0];
}
