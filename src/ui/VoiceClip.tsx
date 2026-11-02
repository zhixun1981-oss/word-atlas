import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyseClip } from "../lib/recorder";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const x = Math.floor(s % 60);
  return `${m}:${String(x).padStart(2, "0")}`;
};

/**
 * 自己的那段录音：波形 + 播放。口语练完最该听的是自己刚说的，
 * 而不是看识别出来的文字——文字永远是对的，声音才知道哪儿别扭。
 */
export function VoiceClip({ blob, tone = "neutral", label = "你的录音" }: { blob: Blob; tone?: "neutral" | "ok"; label?: string }) {
  const [url, setUrl] = useState("");
  const [peaks, setPeaks] = useState<number[]>(() => Array.from({ length: 44 }, () => 0.3));
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [at, setAt] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    let alive = true;
    void analyseClip(blob).then((r) => {
      if (!alive) return;
      setPeaks(r.peaks);
      // 解码出来的时长更可信；拿不到再退回 audio 元素报的。
      if (r.duration > 0) setDur(r.duration);
    });
    return () => {
      alive = false;
      URL.revokeObjectURL(u);
    };
  }, [blob]);

  const progress = dur > 0 ? at / dur : 0;
  const bars = useMemo(
    () =>
      peaks.map((h, i) => ({
        h: Math.round(6 + h * 26),
        on: i / peaks.length <= progress,
      })),
    [peaks, progress],
  );

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const restart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play();
  };

  return (
    <div className={`vc ${tone === "ok" ? "is-ok" : ""}`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setAt(0);
        }}
      />
      <button className="vc-play" onClick={toggle} aria-label={playing ? "暂停" : "播放我的录音"}>
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="vc-wave" onClick={toggle} role="presentation" aria-hidden="true">
        {bars.map((b, i) => (
          <i key={i} className={b.on ? "is-on" : ""} style={{ height: `${b.h}px` }} />
        ))}
      </div>
      <span className="vc-time">
        {fmt(at)}
        <i>/</i>
        {fmt(dur)}
      </span>
      <button className="vc-again" onClick={restart} aria-label="重听">
        <RotateCcw size={14} />
      </button>
      <small className="vc-label">{label}</small>
    </div>
  );
}
