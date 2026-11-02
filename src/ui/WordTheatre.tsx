import { Clapperboard, Pause, Play, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Accent, Example } from "../atlas/types";
import { speak, stopSpeak, ttsSupported } from "../lib/tts";
import { useStore } from "../store/store";

/** 例句「词音剧场」：逐词高亮 + 双音朗读 + 逐词点读（Memrise 句子学习法）。 */

interface Span {
  w: string;
  start: number; // charIndex in the raw sentence
  isWord: boolean;
}

/** 把句子切成词/标点片段，保留原文 char 偏移。 */
function tokenize(s: string): Span[] {
  const out: Span[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
      out.push({ w: s.slice(i, j), start: i, isWord: true });
      i = j;
    } else {
      let j = i;
      while (j < s.length && !/[A-Za-z]/.test(s[j])) j++;
      out.push({ w: s.slice(i, j), start: i, isWord: false });
      i = j;
    }
  }
  return out;
}

export function WordTheatre({
  ex,
  onClose,
}: {
  ex: Example;
  onClose: () => void;
}) {
  const accent = useStore((s) => s.settings.accent);
  const [acc, setAcc] = useState<Accent>(accent);
  const [rate, setRate] = useState(0.85);
  const [active, setActive] = useState(-1); // active span index (words only)
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const spans = useMemo(() => tokenize(ex.en), [ex.en]);
  const wordIdx = useMemo(() => {
    const map = new Map<number, number>();
    let k = 0;
    spans.forEach((sp) => {
      if (sp.isWord) map.set(sp.start, k++);
    });
    return map;
  }, [spans]);

  const playAll = useCallback(() => {
    if (!ttsSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(ex.en);
    u.lang = acc === "uk" ? "en-GB" : "en-US";
    u.rate = rate;
    u.pitch = 1;
    setActive(-1);
    setPlaying(true);
    setPaused(false);
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== "word") return;
      const k = wordIdx.get(e.charIndex);
      if (k !== undefined) setActive(k);
    };
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
      setActive(-1);
    };
    u.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    synth.speak(u);
  }, [ex.en, acc, rate, wordIdx]);

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (playing && !paused) {
      synth.pause();
      setPaused(true);
    } else if (playing && paused) {
      synth.resume();
      setPaused(false);
    } else {
      playAll();
    }
  };

  useEffect(() => {
    // stop when the overlay unmounts
    return () => {
      if (ttsSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  // 重新选择口音/语速时若正在播放则重放
  useEffect(() => {
    if (playing && !paused) playAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acc, rate]);

  const readWord = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    const sp = spans[i];
    if (!sp?.isWord) return;
    if (playing) window.speechSynthesis.cancel();
    speak(sp.w, { lang: acc === "uk" ? "en-GB" : "en-US", rate: 0.75 });
    setActive(i);
    setPlaying(false);
    setPaused(false);
  };

  const support = ttsSupported();

  return (
    <div className="match-game-overlay theatre-overlay" onClick={onClose}>
      <div className="match-game theatre" onClick={(e) => e.stopPropagation()}>
        <div className="theatre-head">
          <h3>
            <Clapperboard size={18} />
            词音剧场
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="关闭剧场" title="关闭">
            <X size={18} />
          </button>
        </div>

        <p className="theatre-caption">听整句时逐词高亮，点击任意单词单独跟读</p>

        <div className={`theatre-stage ${playing ? "is-playing" : ""}`} aria-live="polite">
          {spans.map((sp, i) =>
            sp.isWord ? (
              <button
                key={i}
                type="button"
                className={`theatre-word ${i === active ? "is-active" : ""} ${playing ? "is-playing" : ""}`}
                onClick={(e) => readWord(e, i)}
                lang="en"
                title="点击跟读"
              >
                {sp.w}
              </button>
            ) : (
              <span key={i} className="theatre-raw">
                {sp.w}
              </span>
            ),
          )}
        </div>

        <p className="theatre-zh">{ex.zh}</p>

        <div className="theatre-controls">
          <div className="segmented" role="group" aria-label="口音">
            <button className={acc === "uk" ? "is-on" : ""} onClick={() => setAcc("uk")}>
              英式
            </button>
            <button className={acc === "us" ? "is-on" : ""} onClick={() => setAcc("us")}>
              美式
            </button>
          </div>
          <div className="segmented" role="group" aria-label="语速">
            <button className={rate === 0.7 ? "is-on" : ""} onClick={() => setRate(0.7)}>
              慢
            </button>
            <button className={rate === 0.85 ? "is-on" : ""} onClick={() => setRate(0.85)}>
              常
            </button>
            <button className={rate === 1 ? "is-on" : ""} onClick={() => setRate(1)}>
              快
            </button>
          </div>
          <div className="theatre-play">
            <button className="btn btn-primary" onClick={toggle} disabled={!support} title={playing ? (paused ? "继续" : "暂停") : "朗读整句"}>
              {playing && !paused ? <Pause size={16} /> : <Play size={16} />}
              {playing ? (paused ? "继续" : "暂停") : "播放整句"}
            </button>
            <button className="btn btn-glass" onClick={() => { stopSpeak(); setPlaying(false); setPaused(false); setActive(-1); playAll(); }} disabled={!support} title="重新播放">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {!support && <p className="ai-error">当前浏览器不支持朗读。请换 Chrome / Edge / Safari。</p>}
      </div>
    </div>
  );
}

/** 例句旁的剧场入口小按钮。 */
export function TheatreTrigger({ onOpen, active }: { onOpen: () => void; active: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn theatre-trigger ${active ? "is-on" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      aria-label="词音剧场"
      title="词音剧场 · 逐词高亮朗读"
    >
      <Clapperboard size={16} />
    </button>
  );
}
