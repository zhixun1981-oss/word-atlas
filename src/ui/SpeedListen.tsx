import { Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { stopAudio } from "../lib/audio";

const SPEEDS = [
  { rate: 0.75, label: "0.75x 慢速", tip: "听清单个单词" },
  { rate: 1, label: "1.0x 常速", tip: "正常语速" },
  { rate: 1.25, label: "1.25x 加速", tip: "练快语速" },
];

/** Speed listening: play example sentences at different speeds. */
export function SpeedListen({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [items, setItems] = useState<Entry[] | null>(null);
  const [i, setI] = useState(0);
  const [rate, setRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    const ids = atlas.words.filter((w) => (w.media & 8) !== 0).map((w) => w.id);
    void prefetch(atlas, ids.slice(0, 200)).then((list) => {
      if (!alive) return;
      const withEx = list.filter((e): e is Entry => !!e && e.ex.length > 0 && (e.m & 8) !== 0);
      setItems(withEx.sort(() => Math.random() - 0.5).slice(0, 8));
    });
    return () => {
      alive = false;
      stopAudio();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const play = () => {
    if (!cur) return;
    audioRef.current?.pause();
    const el = new Audio(`${import.meta.env.BASE_URL}${atlas.audio(cur, "ex")}`);
    el.playbackRate = rate;
    audioRef.current = el;
    el.play().catch(() => null);
  };

  const cur = items?.[i];

  if (!cur)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">正在准备听力素材…</p>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>结束</button>
        <div className="learn-progress">
          <span style={{ width: `${(i / (items?.length ?? 1)) * 100}%` }} />
        </div>
        <span className="typing-meter">
          {i + 1}/{items?.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="spell-cue">
          <b className="repeat-word" lang="en">{cur.w}</b>
          <p className="muted" lang="en">{cur.ex[0]?.en}</p>
          <p className="muted">{cur.ex[0]?.zh}</p>
        </div>
        <div className="speed-bar">
          {SPEEDS.map((s) => (
            <button key={s.rate} className={`speed-chip ${rate === s.rate ? "is-on" : ""}`} onClick={() => setRate(s.rate)}>
              <b>{s.label}</b>
              <small>{s.tip}</small>
            </button>
          ))}
        </div>
        <div className="sound-challenge">
          <button className="btn btn-primary btn-xl" onClick={play}>
            <Play size={18} /> 用 {rate}x 播放
          </button>
          <button className="btn btn-ghost" onClick={onAgain}>
            <RotateCcw size={18} /> 换一批
          </button>
        </div>
        {i + 1 < (items?.length ?? 0) && (
          <button className="btn btn-primary" onClick={() => setI(i + 1)}>下一句</button>
        )}
        <p className="muted typing-help">第 {i + 1}/{items?.length} 句 · 先慢速听清单词，再加速听连读。</p>
      </section>
    </div>
  );
}
