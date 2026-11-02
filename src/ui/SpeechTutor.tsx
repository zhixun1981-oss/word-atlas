import { Mic, RotateCcw, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { play } from "../lib/audio";
import { gradeSpeech, listenOnce, speechSupported, type SpeechResult } from "../lib/speech";
import { useStore } from "../store/store";

const GRADE_UI: Record<SpeechResult["grade"], { text: string; tone: string }> = {
  great: { text: "发音很棒！", tone: "is-great" },
  good: { text: "很接近了，再顺一遍更准。", tone: "is-good" },
  ok: { text: "有几个音不太对，再练练。", tone: "is-ok" },
  try: { text: "先听参考音，再慢慢读一遍。", tone: "is-try" },
};

export function SpeechTutor({ word, url }: { word: string; url: string | null }) {
  const settings = useStore((s) => s.settings);
  const [state, setState] = useState<"idle" | "listening" | "scored">("idle");
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listening = useRef(false);

  if (!speechSupported())
    return (
      <div className="speech-tutor is-unsupported">
        <Mic size={16} />
        <span>当前浏览器不支持语音识别，换 Chrome 或 Safari 再试试。</span>
      </div>
    );

  const start = async () => {
    if (listening.current) return;
    listening.current = true;
    setState("listening");
    setError(null);
    // Play the reference pronunciation first, then start listening.
    if (url) void play(url, word, settings.accent);
    const lang = settings.accent === "uk" ? "en-GB" : "en-US";
    try {
      const heard = await listenOnce(lang);
      const g = gradeSpeech(heard, word);
      setResult(g);
      setState("scored");
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(
        code === "not-allowed"
          ? "麦克风权限被拒绝了。点地址栏左侧的麦克风图标 → 选「允许」→ 刷新页面后重试。"
          : code === "no-speech"
            ? "没听到声音，对着麦克风再试一次。"
            : "识别失败，再试一次。",
      );
      setState("idle");
    } finally {
      listening.current = false;
    }
  };

  const retry = () => {
    setResult(null);
    setState("idle");
  };

  const meta = result ? GRADE_UI[result.grade] : null;

  return (
    <div className="speech-tutor">
      <div className="speech-head">
        <h3 className="eyebrow">跟读 · 发音对比</h3>
        {result && (
          <span className={`speech-score ${meta!.tone}`}>
            <b>{result.score}</b> 分
          </span>
        )}
      </div>

      {state === "listening" && (
        <div className="speech-listening">
          <span className="speech-pulse" aria-hidden="true" />
          <p>正在听，跟着读一遍「{word}」…</p>
        </div>
      )}

      {state === "idle" && !error && (
        <div className="speech-actions">
          <button className="btn btn-primary" onClick={() => void start()}>
            <Mic size={16} /> 开始跟读
          </button>
          {url && (
            <button className="btn btn-ghost" onClick={() => url && play(url, word, settings.accent)}>
              <Volume2 size={16} /> 先听参考音
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="speech-error">
          <p>{error}</p>
          <div className="speech-actions">
            <button className="btn btn-primary" onClick={() => setError(null)}>
              <Mic size={16} /> 重试
            </button>
          </div>
        </div>
      )}

      {state === "scored" && result && meta && (
        <div className="speech-result">
          <p className={`speech-verdict ${meta.tone}`}>{meta.text}</p>
          <p className="speech-heard">
            识别到：<b lang="en">{result.transcript || "…"}</b>
          </p>
          <div className="speech-actions">
            <button className="btn btn-primary" onClick={() => void start()}>
              <Mic size={16} /> 再读一次
            </button>
            {url && (
              <button className="btn btn-ghost" onClick={() => url && play(url, word, settings.accent)}>
                <Volume2 size={16} /> 对比参考音
              </button>
            )}
            <button className="btn btn-ghost" onClick={retry} aria-label="重置">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
