import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { store } from "../store/store";
import { getBroadcastEntries } from "../lib/broadcast";
import type { Entry } from "../atlas/types";
import { RadioPlayer } from "./RadioPlayer";

/**
 * In-app daily broadcast card: fires at the preferred time, plays today's
 * word playlist hands-free via the existing RadioPlayer.
 */
export function DailyBroadcast({ onClose }: { onClose: () => void }) {
  const atlas = useAtlas();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let alive = true;
    const { progress, settings } = store.get();
    getBroadcastEntries(atlas, progress, settings).then((es) => {
      if (alive) setEntries(es);
    });
    return () => {
      alive = false;
    };
  }, [atlas]);

  return (
    <div className="broadcast-overlay" role="dialog" aria-modal="true" aria-label="每日单词广播">
      <div className="broadcast-card">
        <button className="broadcast-close icon-btn" onClick={onClose} aria-label="关闭广播">
          <X size={18} />
        </button>
        <p className="eyebrow">每日单词广播</p>
        <h3 className="broadcast-title">📻 今天，也来磨磨耳朵</h3>
        <p className="muted broadcast-sub">
          为你挑了 {(entries ?? []).length} 个词，英音 → 美音 → 例句自动连播。关掉也能在「练习」里找到电台。
        </p>
        {entries ? <RadioPlayer title="每日广播" entries={entries} /> : <p className="muted">准备播放列表…</p>}
      </div>
    </div>
  );
}
