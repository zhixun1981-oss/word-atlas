import { Check, Mic, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry } from "../atlas/types";
import { useAtlas } from "../atlas/context";
import { recorderSupported, startRecording, type Recorder } from "../lib/recorder";
import { listenOnce, normalizeSpeech, speechSupported } from "../lib/speech";
import { speak } from "../lib/tts";
import { useStore } from "../store/store";

/** 任意词卡看图描述 + 录音评分（PET Speaking Part 2 无限题库版）。 */

const STOPS = new Set([
  "the","a","an","is","are","was","were","i","you","he","she","it","we","they","my","your",
  "to","of","in","on","at","for","with","and","but","or","so","this","that","there","here",
  "have","has","had","do","does","did","be","am","can","will","would","should","not","no",
  "yes","from","by","as","up","down","about","into","out","over","under","than","then","its",
]);

function keywordsOf(en: string): string[] {
  const words = en
    .toLowerCase()
    .replace(/[^a-z' ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPS.has(w));
  return [...new Set(words)].slice(0, 5);
}

export interface PictureWordReport {
  core: boolean;
  keywords: { w: string; hit: boolean }[];
  length: number;
  duration: number;
  score: number;
  grade: "great" | "good" | "ok" | "try";
  transcript: string;
  recognized: boolean;
}

const GRADE = (s: number): "great" | "good" | "ok" | "try" =>
  s >= 85 ? "great" : s >= 68 ? "good" : s >= 48 ? "ok" : "try";

export function PictureTalkWord({
  entry,
  onExit,
  onAgain,
}: {
  entry: Entry;
  onExit: () => void;
  onAgain: () => void;
}) {
  const atlas = useAtlas();
  const accent = useStore((s) => s.settings.accent);
  const img = atlas.img(entry) ?? null;
  const [phase, setPhase] = useState<"prep" | "talk" | "done">("prep");
  const [seconds, setSeconds] = useState(60);
  const [seen, setSeen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognized, setRecognized] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const timer = useRef<number | null>(null);
  const rec = useRef<Recorder | null>(null);
  const canRecord = recorderSupported();
  const canListen = speechSupported();

  const kw = useMemo(() => {
    const src = entry.ex.map((x) => x.en).join(" ") || entry.senses.map((s) => s.en).join(" ") || entry.w;
    return keywordsOf(src);
  }, [entry]);

  const sample = useMemo(() => {
    const lead = entry.ex[0]?.en ?? "";
    const parts = [entry.ex[0]?.en, entry.ex[1]?.en].filter(Boolean);
    const frame = parts.length
      ? `This picture shows ${entry.w}... Here ${parts.join(" ")}`
      : `This picture shows a ${entry.w}. I can see it clearly. In the picture it looks ${entry.senses[0]?.en ?? "nice"}.`;
    return { frame, body: parts.join(" ") || lead };
  }, [entry]);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      rec.current?.cancel();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  const start = async () => {
    setPhase("talk");
    setSeconds(60);
    setTranscript("");
    setAudioUrl(null);
    setRecordMs(0);
    try {
      rec.current = canRecord ? await startRecording() : null;
    } catch {
      rec.current = null;
    }
    timer.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) window.clearInterval(timer.current);
          void finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const finish = async () => {
    if (timer.current) window.clearInterval(timer.current);
    const r = rec.current;
    rec.current = null;
    let blob: Blob | null = null;
    let ms = 0;
    if (r) {
      ms = r.elapsed();
      blob = await r.stop().catch(() => null);
      setRecordMs(ms);
      if (blob) setAudioUrl(URL.createObjectURL(blob));
    }
    let t = "";
    let ok = false;
    if (canListen) {
      try {
        t = await listenOnce(accent === "uk" ? "en-GB" : "en-US", 9000);
        ok = true;
      } catch {
        ok = false;
      }
    }
    setTranscript(t);
    setRecognized(ok);
    setPhase("done");
  };

  const stop = () => {
    void finish();
  };

  const report = useMemo<PictureWordReport>(() => {
    const core = transcript.trim() ? normalizeSpeech(transcript).includes(normalizeSpeech(entry.w)) : false;
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const hits = kw.map((w) => ({ w, hit: normalizeSpeech(transcript).includes(w) }));
    const hitRatio = hits.length ? hits.filter((h) => h.hit).length / hits.length : 0;
    const lengthScore = Math.min(1, words / 18);
    const score = Math.round(40 * hitRatio + 35 * (core ? 1 : 0) + 25 * lengthScore);
    return {
      core,
      keywords: hits,
      length: words,
      duration: Math.round(recordMs / 1000),
      score,
      grade: GRADE(score),
      transcript,
      recognized,
    };
  }, [transcript, kw, entry.w, recordMs, recognized]);

  const close = () => {
    if (timer.current) window.clearInterval(timer.current);
    rec.current?.cancel();
    onExit();
  };

  const again = () => {
    if (timer.current) window.clearInterval(timer.current);
    rec.current?.cancel();
    onAgain();
  };

  return (
    <div className="match-game-overlay pictalk-overlay" onClick={close}>
      <div className="match-game pictalk" onClick={(e) => e.stopPropagation()}>
        <div className="theatre-head">
          <h3>
            <Mic size={17} />
            看图描述 · {entry.w}
            <span className="ai-badge">PET Part 2</span>
          </h3>
          <button className="icon-btn" onClick={close} aria-label="关闭" title="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="pictalk-stage">
          {img ? (
            <img className="pictalk-art" src={img} alt={entry.w} />
          ) : (
            <div className="pictalk-art pictalk-art-empty">这幅插画正在生成中…</div>
          )}
          <div className="pictalk-panel">
            {phase === "prep" && (
              <>
                <p className="muted">看着这幅画，用英语描述 60 秒。试着用上这些词：</p>
                <div className="pictalk-kws">
                  {kw.map((k) => (
                    <span key={k} className="chip" lang="en">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="summary-actions">
                  <button className="btn btn-primary btn-xl" onClick={() => void start()}>
                    <Timer size={18} /> 开始 60 秒描述
                  </button>
                  {!seen && (
                    <button className="btn btn-ghost" onClick={() => setSeen(true)}>
                      先看参考
                    </button>
                  )}
                </div>
                {seen && (
                  <div className="pictalk-sample">
                    <p className="muted">句型框架：{sample.frame}</p>
                    <p className="talk-sample" lang="en">
                      {sample.body}
                      <button className="icon-btn" onClick={() => speak(sample.body, { lang: accent === "uk" ? "en-GB" : "en-US", rate: 0.85 })} title="朗读参考" aria-label="朗读参考">
                        <span className="speak-icon">
                          <Mic size={14} />
                        </span>
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
            {phase === "talk" && (
              <>
                <p className={`dialogue-level ${seconds <= 10 ? "is-urgent" : ""}`}>
                  <Timer size={15} /> {seconds}s
                </p>
                <p className="muted">{canRecord ? "正在录音并识别…" : "计时中（当前浏览器不支持录音，只说即可）"}</p>
                <div className="summary-actions">
                  <button className="btn btn-primary" onClick={stop}>
                    <Check size={18} /> 说完了
                  </button>
                </div>
              </>
            )}
            {phase === "done" && (
              <div className="pictalk-report">
                <div className={`pictalk-score g-${report.grade}`}>
                  <b>{report.score}</b>
                  <span>{report.grade === "great" ? "说得真好" : report.grade === "good" ? "很不错" : report.grade === "ok" ? "继续加油" : "再试一次"}</span>
                </div>
                <div className="pictalk-metrics">
                  <div>
                    <span>核心词 <em>{entry.w}</em></span>
                    <i className={report.core ? "is-hit" : ""} style={{ width: report.core ? "100%" : "0%" }} />
                  </div>
                  <div>
                    <span>关键词命中 {report.keywords.filter((k) => k.hit).length}/{report.keywords.length}</span>
                    <i className={report.keywords.length ? "is-hit" : ""} style={{ width: `${(report.keywords.filter((k) => k.hit).length / Math.max(1, report.keywords.length)) * 100}%` }} />
                  </div>
                  <div>
                    <span>描述长度 {report.length} 词{report.duration ? ` · 说了 ${report.duration}s` : ""}</span>
                    <i className="is-hit" style={{ width: `${Math.min(100, (report.length / 18) * 100)}%` }} />
                  </div>
                </div>
                {report.transcript.trim() ? (
                  <>
                    <p className="pictalk-you" lang="en">
                      你说了：{report.transcript}
                    </p>
                    <div className="pictalk-kws">
                      {report.keywords.map((k) => (
                        <span key={k.w} className={`chip ${k.hit ? "is-hit" : ""}`} lang="en">
                          {k.hit ? "✓ " : "✗ "}
                          {k.w}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="muted">{recognized ? "没有识别到内容，麦克风没声音？" : "当前浏览器不支持语音识别，无法评分。"}</p>
                )}
                {audioUrl && (
                  <audio className="pictalk-audio" controls src={audioUrl} preload="metadata">
                    你的描述录音
                  </audio>
                )}
                <div className="summary-actions">
                  <button className="btn btn-ghost" onClick={again}>
                    <RotateCcw size={15} /> 重来一轮
                  </button>
                  <button className="btn btn-primary" onClick={close}>
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
