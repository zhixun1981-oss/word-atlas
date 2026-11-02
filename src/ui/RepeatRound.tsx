import { Mic, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { stopAudio } from "../lib/audio";

/** Repeat round: listen to an example sentence, imitate it, then compare. */
export function RepeatRound({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [items, setItems] = useState<Entry[] | null>(null);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"listen" | "imitate" | "compare">("listen");
  const [tick, setTick] = useState(20);
  const timer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    const ids = atlas.words.filter((w) => (w.media & 8) !== 0).map((w) => w.id);
    void prefetch(atlas, ids.slice(0, 150)).then((list) => {
      if (!alive) return;
      const withEx = list.filter((e): e is Entry => !!e && e.ex.length > 0 && (e.m & 8) !== 0);
      setItems(withEx.sort(() => Math.random() - 0.5).slice(0, 8));
    });
    return () => {
      alive = false;
      stopAudio();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const play = (e: Entry) => {
    audioRef.current?.pause();
    const el = new Audio(`${import.meta.env.BASE_URL}${atlas.audio(e, "ex")}`);
    audioRef.current = el;
    el.play().catch(() => null);
  };

  const startImitate = () => {
    setPhase("imitate");
    setTick(20);
    timer.current = window.setInterval(() => {
      setTick((t) => {
        if (t <= 1) {
          if (timer.current) window.clearInterval(timer.current);
          setPhase("compare");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const toCompare = () => {
    if (timer.current) window.clearInterval(timer.current);
    setPhase("compare");
  };

  const next = () => {
    setPhase("listen");
    setTick(20);
    setI(i + 1);
  };

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const cur = items?.[i];

  if (!cur)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">正在准备跟读例句…</p>
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
          <p className="muted">
            {cur.ex[0]?.zh}
            <br />
            <span lang="en">{cur.ex[0]?.en}</span>
          </p>
        </div>
        <div className="sound-challenge">
          {phase === "listen" && (
            <div className="summary-actions">
              <button className="btn btn-primary btn-xl" onClick={() => play(cur)}>
                <Volume2 size={18} /> 听示范
              </button>
              <button className="btn btn-ghost" onClick={startImitate}>
                <Mic size={18} /> 听完了，开始模仿
              </button>
            </div>
          )}
          {phase === "imitate" && (
            <div className="summary-actions">
              <span className="repeat-timer">{tick}s</span>
              <button className="btn btn-primary btn-xl" onClick={() => play(cur)}>
                <Volume2 size={18} /> 再听
              </button>
              <button className="btn btn-ghost" onClick={toCompare}>
                读完，对照
              </button>
            </div>
          )}
          {phase === "compare" && (
            <div className="summary-actions">
              <button className="btn btn-primary btn-xl" onClick={() => play(cur)}>
                <Volume2 size={18} /> 再听示范
              </button>
              <button className="btn btn-ghost" onClick={() => play(cur)}>
                慢速再听
              </button>
              {i + 1 < (items?.length ?? 0) ? (
                <button className="btn btn-primary" onClick={next}>下一句</button>
              ) : (
                <button className="btn btn-primary" onClick={onAgain} autoFocus>
                  <RotateCcw size={18} /> 再来一轮
                </button>
              )}
            </div>
          )}
        </div>
        <p className="muted typing-help">第 {i + 1}/{items?.length} 句 · 模仿时注意连读和重读。</p>
      </section>
    </div>
  );
}
