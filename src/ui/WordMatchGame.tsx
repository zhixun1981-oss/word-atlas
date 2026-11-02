import { useMemo, useState, useEffect } from "react";
import { useAtlas } from "../atlas/context";
import { useStore } from "../store/store";
import { hashSeed, shuffle } from "../lib/text";

/** 单词连连看 · 英文配对中文限时挑战 */
export function WordMatchGame({ onClose }: { onClose: () => void }) {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);

  const GAME_SIZE = 6;
  const TIME_LIMIT = 45;

  const [selected, setSelected] = useState<{ side: "en" | "zh"; idx: number } | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [finished, setFinished] = useState(false);

  const pairs = useMemo(() => {
    // 优先用学过的词
    const learnedIds = Object.keys(progress.cards).filter((id) => atlas.byId.has(id));
    const pool = learnedIds.length >= GAME_SIZE ? learnedIds : atlas.words.map((w) => w.id);
    const ids = shuffle(pool, hashSeed("match-" + Date.now())).slice(0, GAME_SIZE);
    return ids.map((id) => {
      const w = atlas.byId.get(id)!;
      return { id, en: w.word, zh: w.zh };
    });
  }, []);

  const enItems = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.en, pairIdx: i }), Date.now()), 1), [pairs]);
  const zhItems = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.zh, pairIdx: i }), Date.now()), 2), [pairs]);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished]);

  useEffect(() => {
    if (matched.size === GAME_SIZE) setFinished(true);
  }, [matched]);

  const handleClick = (side: "en" | "zh", idx: number, pairIdx: number) => {
    if (matched.has(pairIdx) || finished) return;
    if (!selected) {
      setSelected({ side, idx });
      return;
    }
    if (selected.side === side) {
      setSelected({ side, idx });
      return;
    }
    // 配对判断（直接比较 pairIdx）
    const prevEn = selected.side === "en" ? enItems[selected.idx].pairIdx : -1;
    const prevZh = selected.side === "zh" ? zhItems[selected.idx].pairIdx : -1;
    const current = side === "en" ? pairIdx : pairIdx;
    const prev = side === "en" ? prevZh : prevEn;

    if (prev === current && prev !== -1) {
      setMatched(new Set([...matched, current]));
      setSelected(null);
    } else {
      setWrong((w) => w + 1);
      setSelected(null);
    }
  };

  const score = Math.max(0, matched.size * 10 - wrong * 2 + timeLeft);

  return (
    <div className="match-game-overlay" onClick={onClose}>
      <div className="match-game" onClick={(e) => e.stopPropagation()}>
        <div className="match-game-head">
          <h3>单词连连看</h3>
          <div className="match-game-stats">
            <span className={timeLeft <= 10 ? "is-warn" : ""}>⏱ {timeLeft}s</span>
            <span>✅ {matched.size}/{GAME_SIZE}</span>
            <span>❌ {wrong}</span>
          </div>
        </div>

        {finished ? (
          <div className="match-game-result">
            <h2>{matched.size === GAME_SIZE ? "🎉 全对！" : "⏰ 时间到！"}</h2>
            <p>配对成功 {matched.size}/{GAME_SIZE} 对</p>
            <p className="match-score">得分：{score}</p>
            <button className="btn btn-primary" onClick={onClose}>返回</button>
          </div>
        ) : (
          <div className="match-game-body">
            <div className="match-col">
              {enItems.map((item, i) => (
                <button
                  key={i}
                  className={`match-item ${matched.has(item.pairIdx) ? "is-matched" : ""} ${selected?.side === "en" && selected.idx === i ? "is-selected" : ""}`}
                  onClick={() => handleClick("en", i, item.pairIdx)}
                  disabled={matched.has(item.pairIdx)}
                >
                  {item.text}
                </button>
              ))}
            </div>
            <div className="match-col">
              {zhItems.map((item, i) => (
                <button
                  key={i}
                  className={`match-item ${matched.has(item.pairIdx) ? "is-matched" : ""} ${selected?.side === "zh" && selected.idx === i ? "is-selected" : ""}`}
                  onClick={() => handleClick("zh", i, item.pairIdx)}
                  disabled={matched.has(item.pairIdx)}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
