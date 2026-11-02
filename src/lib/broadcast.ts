import { resolveLevel } from "../atlas/levels";
import type { Atlas, Entry } from "../atlas/types";
import type { Progress, Settings } from "../store/store";

const KEY_PREFIX = "word-atlas:broadcast:";

function todayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whether we already fired today's broadcast (persisted so reloads don't re-fire). */
export function hasBroadcastToday(d: Date = new Date()): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + todayKey(d)) === "1";
  } catch {
    return false;
  }
}

export function markBroadcastToday(d: Date = new Date()): void {
  try {
    localStorage.setItem(KEY_PREFIX + todayKey(d), "1");
  } catch {
    /* ignore storage failures */
  }
}

/**
 * True when it's time to broadcast: feature on, current time has reached the
 * preferred time, and we haven't broadcast yet today.
 */
export function shouldBroadcast(settings: Settings, now: Date = new Date()): boolean {
  if (!settings.dailyBroadcast) return false;
  const [bh, bm] = settings.broadcastTime.split(":").map(Number);
  const target = (bh || 0) * 60 + (bm || 0);
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur < target) return false;
  return !hasBroadcastToday(now);
}

/**
 * Today's broadcast playlist: reviewed words first (most overdue first), then
 * new words from the configured start level, capped at `limit`.
 */
export async function getBroadcastEntries(
  atlas: Atlas,
  progress: Progress,
  settings: Settings,
  limit = 24,
): Promise<Entry[]> {
  const ids: string[] = [];
  const dueMap = new Map<string, number>();
  for (const id of Object.keys(progress.cards)) {
    const c = progress.cards[id] as { due?: number; last?: number } | undefined;
    if (!c) continue;
    ids.push(id);
    dueMap.set(id, c.last ?? c.due ?? 0);
  }
  ids.sort((a, b) => (dueMap.get(a) ?? 0) - (dueMap.get(b) ?? 0));
  const pickedIds = ids.slice(0, limit);
  if (pickedIds.length < limit) {
    // startLevel 是难度档位，不是词数组下标——原先是拿它当 words[i] 的起点用的，
    // 档位一高就整体偏移得莫名其妙。这里按档位过滤。
    const from = resolveLevel(atlas, settings.startLevel || 0);
    for (const ref of atlas.words) {
      if (pickedIds.length >= limit) break;
      if (ref.cefr < from || progress.cards[ref.id]) continue;
      pickedIds.push(ref.id);
    }
  }
  const entries = await Promise.all(pickedIds.map((id) => atlas.entry(id).catch(() => undefined)));
  return entries.filter((e): e is Entry => !!e).slice(0, limit);
}
