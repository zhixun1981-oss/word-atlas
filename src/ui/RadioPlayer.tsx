import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Entry } from "../atlas/types";
import { useAtlas } from "../atlas/context";
import { stopAudio } from "../lib/audio";
import { Illustration } from "./Illustration";

type Seg = "uk" | "us" | "ex";
const SEG_ORDER: Seg[] = ["uk", "us", "ex"];
const SEG_LABEL: Record<Seg, string> = { uk: "英音", us: "美音", ex: "例句" };

/**
 * A hands-free word radio: play word audio → US audio → example sentence,
 * auto-advancing. Uses plain <audio> so it depends only on the bundled mp3s.
 */
export function RadioPlayer({ title, entries }: { title: string; entries: Entry[] }) {
  const atlas = useAtlas();
  const [pos, setPos] = useState(0); // current entry index
  const [segIdx, setSegIdx] = useState(0); // segment within the entry
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const guardRef = useRef(0);

  const e = entries[Math.min(pos, entries.length - 1)];
  const seg = SEG_ORDER[segIdx];
  const segUrl = (en: Entry, s: Seg) =>
    s === "ex" ? { url: atlas.audio(en, "ex"), text: en.ex?.[0]?.en ?? "" } : { url: atlas.audio(en, s as "uk"), text: en.w };

  const advance = () => {
    if (segIdx + 1 < SEG_ORDER.length) setSegIdx(segIdx + 1);
    else if (pos + 1 < entries.length) {
      setPos(pos + 1);
      setSegIdx(0);
    } else setPlaying(false);
  };

  useEffect(() => {
    if (!playing || !e) return;
    const { url } = segUrl(e, seg);
    const el = new Audio();
    audioRef.current = el;
    // Guard against a stalled recording so the queue never deadlocks.
    guardRef.current = window.setTimeout(advance, 8000);
    el.onended = () => advance();
    el.onerror = () => advance();
    if (url) {
      el.src = url;
      el.play().catch(() => advance());
    } else {
      // No recording: skip this segment quickly.
      advance();
    }
    return () => {
      window.clearTimeout(guardRef.current);
      el.onended = null;
      el.onerror = null;
      el.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, pos, segIdx]);

  useEffect(() => () => stopAudio(), []);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  };

  const prev = () => {
    if (segIdx > 0) setSegIdx(segIdx - 1);
    else if (pos > 0) {
      setPos(pos - 1);
      setSegIdx(SEG_ORDER.length - 1);
    }
  };

  if (!e) return <p className="muted">这个列表还没有词，先学几个再来。</p>;

  return (
    <div className="radio">
      <div className="radio-art">
        <Illustration src={atlas.img(e, "thumb")} word={e.w} topic={atlas.topics.findIndex((t) => t[0] === e.topic)} />
        <span className="radio-seg">{SEG_LABEL[seg]}</span>
      </div>
      <h3 lang="en">{e.w}</h3>
      <p className="muted">{e.senses[0].zh}</p>
      <p className="radio-sentence" lang="en">
        {seg === "ex" && e.ex?.[0]?.en}
      </p>
      <div className="radio-controls">
        <button className="btn btn-ghost" onClick={prev} aria-label="上一个词">
          <SkipBack size={18} />
        </button>
        <button className={`btn btn-primary radio-play ${playing ? "is-on" : ""}`} onClick={toggle} aria-label={playing ? "暂停" : "播放"}>
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button className="btn btn-ghost" onClick={() => { setPos(pos + 1); setSegIdx(0); }} aria-label="下一个词">
          <SkipForward size={18} />
        </button>
        <button className="btn btn-ghost" onClick={() => { setPos(0); setSegIdx(0); }} aria-label="从头播放">
          <RotateCcw size={16} />
        </button>
      </div>
      <p className="muted radio-meta">
        {title} · {pos + 1}/{entries.length} · 播放顺序：英音 → 美音 → 例句
      </p>
      {!playing && (
        <p className="muted">
          <Volume2 size={13} /> 点击播放开始自动连播，磨耳朵时间到。
        </p>
      )}
    </div>
  );
}
