import { Check, Play, RotateCcw, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { stopAudio } from "../lib/audio";
import { shuffle } from "../lib/text";

interface SoundPair {
  name: string;
  tip: string;
  zh: string;
  a: string;
  b: string;
}

const PAIRS: SoundPair[] = [
  { name: "th：/θ/ vs /ð/", tip: "舌尖轻贴上齿缝，不震动是 /θ/（think），震动是 /ð/（this）。", zh: "think 与 this 的 th 音不同", a: "think", b: "this" },
  { name: "长 i: vs 短 ɪ", tip: "/i:/ 拉长（sheep），/ɪ/ 短促（ship），长度决定词义。", zh: "sheep 与 ship 靠音长区分", a: "sheep", b: "ship" },
  { name: "æ vs e", tip: "/æ/ 张大嘴（bad），/e/ 半开口（bed）。", zh: "bad 与 bed 的元音不同", a: "bad", b: "bed" },
  { name: "ʊ vs u:", tip: "/ʊ/ 短促（full），/u:/ 拉长（fool）。", zh: "full 与 fool 音长不同", a: "full", b: "fool" },
  { name: "词首 r", tip: "词首 /r/ 要卷舌（road），词尾 r 英音不卷舌。", zh: "red 与 road 的 r 发音", a: "red", b: "road" },
  { name: "v vs w", tip: "/v/ 上齿咬下唇（very），/w/ 双唇圆撮（well）。", zh: "very 与 well 口型不同", a: "very", b: "well" },
];

interface Q {
  pair: SoundPair;
  a: Entry;
  b: Entry;
  side: "a" | "b";
}

/** Sound clinic: learn a confusable phoneme pair, then listen and tell which word you heard. */
export function SoundClinic({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [qs, setQs] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [played, setPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    const ids = PAIRS.flatMap((p) => [p.a, p.b]);
    void prefetch(atlas, ids).then((list) => {
      if (!alive) return;
      const map = new Map(list.filter((e): e is Entry => !!e).map((e) => [e.id, e]));
      const qs: Q[] = [];
      for (const p of PAIRS) {
        const a = map.get(p.a);
        const b = map.get(p.b);
        if (a && b) qs.push({ pair: p, a, b, side: Math.random() < 0.5 ? "a" : "b" });
      }
      setQs(shuffle(qs));
    });
    return () => {
      alive = false;
      stopAudio();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = qs?.[i];

  const playSide = (side: "a" | "b") => {
    if (!cur) return;
    const e = side === "a" ? cur.a : cur.b;
    audioRef.current?.pause();
    const el = new Audio(`${import.meta.env.BASE_URL}${atlas.audio(e, "uk")}`);
    audioRef.current = el;
    el.play().catch(() => null);
  };

  const playChallenge = () => {
    if (!cur) return;
    playSide(cur.side);
    setPlayed(true);
  };

  const pick = (side: "a" | "b") => {
    if (picked !== null || !cur) return;
    setPicked(side);
    const ok = side === cur.side;
    setCorrect((c) => c + (ok ? 1 : 0));
    if (i + 1 >= (qs?.length ?? 0)) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setPicked(null);
    setPlayed(false);
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">诊室完成</p>
          <h1 className="display">
            {correct} <small>/ {qs?.length ?? 0}</small>
          </h1>
          <p className="lede">{correct === (qs?.length ?? 0) ? "耳朵很准，易混音位基本拿下。" : correct >= ((qs?.length ?? 0) / 2) ? "记住大半，再磨几遍。" : "先听示范，再比较两个词的差别。"}</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>返回</button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  if (!cur)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">正在准备发音诊室…</p>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>结束</button>
        <div className="learn-progress">
          <span style={{ width: `${(i / (qs?.length ?? 1)) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {qs?.length ?? 0}
        </span>
      </header>
      <section className="typing-stage">
        <div className="sound-pair">
          <span className="dialogue-level">{cur.pair.name}</span>
          <p className="muted">{cur.pair.tip}</p>
          <div className="sound-two">
            <button className="sound-card" onClick={() => playSide("a")}>
              <Volume2 size={16} />
              <b lang="en">{cur.a.w}</b>
              <em>{atlas.byId.get(cur.a.id)?.ipa ?? ""}</em>
              <small>A · 点我听示范</small>
            </button>
            <button className="sound-card" onClick={() => playSide("b")}>
              <Volume2 size={16} />
              <b lang="en">{cur.b.w}</b>
              <em>{atlas.byId.get(cur.b.id)?.ipa ?? ""}</em>
              <small>B · 点我听示范</small>
            </button>
          </div>
          <p className="muted">{cur.pair.zh}</p>
        </div>
        <div className="sound-challenge">
          <button className="btn btn-primary btn-xl" onClick={playChallenge}>
            <Play size={18} /> 听辨挑战
          </button>
          {played && <p className="muted">刚才听到的是 A 还是 B？</p>}
        </div>
        <div className="exam-opts dialogue-opts sound-opts">
          <button className={`exam-opt ${picked !== null ? (cur.side === "a" ? "is-correct" : picked === "a" ? "is-wrong" : "") : ""}`} onClick={() => pick("a")} disabled={picked !== null}>
            <span className="opt-letter">A</span> <span lang="en">{cur.a.w}</span>
          </button>
          <button className={`exam-opt ${picked !== null ? (cur.side === "b" ? "is-correct" : picked === "b" ? "is-wrong" : "") : ""}`} onClick={() => pick("b")} disabled={picked !== null}>
            <span className="opt-letter">B</span> <span lang="en">{cur.b.w}</span>
          </button>
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${picked === cur.side ? "is-ok" : ""}`}>
            <p>
              {picked === cur.side ? (
                <>
                  <Check size={17} /> 听对了！
                </>
              ) : (
                <>
                  <X size={17} /> 听到的是 <b lang="en">{cur.side === "a" ? cur.a.w : cur.b.w}</b>
                </>
              )}{" "}
              · {cur.pair.tip}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一组</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{qs?.length} 组 · 先听示范再挑战。</p>
      </section>
    </div>
  );
}
