import { ArrowRight, Check, Mic, RotateCcw, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import { scoreAnswer, SPEAKING_BANK, SPEAKING_PICTURES, SPEAKING_ROUND, SPEAKING_TOPICS, type SpeakingItem, type SpeakingPicture } from "../exam/speaking";
import { cue } from "../lib/sound";
import { listenOnce, speechSupported } from "../lib/speech";
import { recorderSupported, startRecording, type Recorder } from "../lib/recorder";
import { speak as say } from "../lib/tts";
import { hashSeed, shuffle } from "../lib/text";
import { useStore } from "../store/store";
import { Illustration } from "./Illustration";
import { VoiceClip } from "./VoiceClip";

interface Step {
  part: 1 | 2 | 3;
  item?: SpeakingItem;
  pic?: SpeakingPicture;
}

const PART_TITLE: Record<1 | 2 | 3, string> = {
  1: "考官问答 · Speaking Part 1",
  2: "看图描述 · Speaking Part 2",
  3: "话题扩展 · Speaking Part 3",
};

export function SpeakingRound({ level, onExit, onAgain }: { level: "A2" | "B1"; onExit?: (result?: { items: number; score: number }) => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const [steps] = useState<Step[]>(() => {
    const seed = String(Date.now());
    const p1: Step[] = shuffle(SPEAKING_BANK[level], hashSeed(seed + "1")).slice(0, SPEAKING_ROUND).map((item) => ({ part: 1, item }));
    const p2: Step[] = shuffle(SPEAKING_PICTURES[level], hashSeed(seed + "2")).slice(0, 1).map((pic) => ({ part: 2, pic }));
    const p3: Step[] = shuffle(SPEAKING_TOPICS[level], hashSeed(seed + "3")).slice(0, 2).map((item) => ({ part: 3, item }));
    return [...p1, ...p2, ...p3];
  });
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"idle" | "listening" | "graded">("idle");
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ score: number; hits: string[] }[]>([]);
  const [error, setError] = useState("");
  const [picUrl, setPicUrl] = useState<string | null>(null);
  /** 这一题的录音；回放用。识别失败也留着，能听自己刚才说了什么。 */
  const [clip, setClip] = useState<Blob | null>(null);
  const supported = useMemo(() => speechSupported(), []);
  const step: Step = steps[i];
  const item: SpeakingItem | undefined = step.item;
  const pic: SpeakingPicture | undefined = step.pic;

  // Load the illustration for Part 2.
  useEffect(() => {
    if (step.part !== 2 || !step.pic) return;
    let alive = true;
    void prefetch(atlas, [step.pic.word]).then((entries) => {
      const e = entries[0];
      if (alive && e) setPicUrl(atlas.img(e, "full"));
    });
    return () => {
      alive = false;
    };
  }, [atlas, step]);

  const speak = (text: string) => {
    say(text, { lang: settings.accent === "uk" ? "en-GB" : "en-US", rate: 0.95, voice: settings.voice });
  };

  const hints = item ? item.hints : pic ? pic.hints : [];

  const listen = async () => {
    if (!step) return;
    setError("");
    setPhase("listening");
    setTranscript("");
    setClip(null);
    // 另起一路录音：识别只给文字，回放要的是音轨。拿不到就只是没有回放，不影响判分。
    const rec: Recorder | null = recorderSupported() ? await startRecording().catch(() => null) : null;
    try {
      const t = await listenOnce(settings.accent === "uk" ? "en-GB" : "en-US");
      setTranscript(t);
      const r = scoreAnswer(t, hints);
      if (settings.sfx) void cue(r.score >= 50 ? "correct" : "wrong");
      setResults((cur) => [...cur, r]);
      setPhase("graded");
    } catch (e) {
      setPhase("idle");
      setError(
        e instanceof Error && e.message === "not-allowed"
          ? "麦克风权限被拒绝了。点地址栏左侧的麦克风图标 → 选「允许」→ 刷新页面后重试。"
          : "没听清，或当前浏览器不支持语音识别。再试一次，或直接跳过这题。",
      );
    } finally {
      if (rec) {
        const blob = await rec.stop().catch(() => null);
        if (blob) setClip(blob);
      }
    }
  };

  const next = () => {
    setTranscript("");
    setClip(null);
    setPhase("idle");
    if (i + 1 >= steps.length) return;
    setI(i + 1);
  };

  const skip = () => {
    if (!step) return;
    const r = scoreAnswer("", hints);
    setResults((cur) => [...cur, r]);
    setTranscript("");
    setPhase("graded");
  };

  const done = i + 1 >= steps.length && phase === "graded";
  const avg = results.length ? Math.round(results.reduce((n, r) => n + r.score, 0) / results.length) : 0;
  const verdict = avg >= 80 ? "稳定输出，口试状态很好，继续保持！" : avg >= 50 ? "能表达清楚，多开口就能更流畅。" : "回答再完整一些，把关键词连成整句会更好。";

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done speaking-done">
          <p className="eyebrow">口语模拟 · Part 1 + 2 + 3 完成</p>
          <h1 className="display">
            {avg}
            <small>分</small>
          </h1>
          <p className="lede">
            回答了 {results.length}/{steps.length} 步（问答 {steps.filter((s) => s.part !== 2).length} · 看图 1 步） · {verdict}
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={() => onExit?.({ items: results.length, score: avg })}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再练一轮
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice speaking">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={() => onExit?.()}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / steps.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{i + 1}</b>/{steps.length}
        </span>
      </header>
      <section className="speaking-stage">
        {!supported ? (
          <div className="speaking-card">
            <p className="muted">当前浏览器不支持语音识别，换用 Chrome 或 Edge 再来练口语。</p>
              <button className="btn btn-ghost" onClick={() => onExit?.()}>
                返回
              </button>
          </div>
        ) : (
          step && (
            <>
              {step.part === 2 && pic && (
                <div className="speaking-picture">
                  {picUrl ? (
                    <Illustration src={picUrl} word={pic.word} topic={atlas.topics.findIndex((t) => t[0] === (atlas.byId.get(pic.word)?.topic ?? ""))} />
                  ) : (
                    <div className="illo speaking-loading" />
                  )}
                </div>
              )}
              <div className="speaking-card">
                <p className="eyebrow">{PART_TITLE[step.part]}</p>
                {step.part === 2 && pic ? (
                  <>
                    <p className="speaking-q" lang="en">
                      Look at the picture and describe it.
                    </p>
                    <p className="muted">看这张图，用英语描述它：里面有什么、人们在做什么、你觉得怎么样。至少说 3 句。</p>
                    <button className="link" onClick={() => speak("Look at the picture and describe what you can see.")}>
                      <Volume2 size={15} /> 听考官再读一遍题
                    </button>
                  </>
                ) : (
                  <>
                    <p className="speaking-q" lang="en">
                      {item!.q}
                    </p>
                    <p className="muted">{item!.zh}</p>
                    <button className="link" onClick={() => speak(item!.q)}>
                      <Volume2 size={15} /> 听考官再问一遍
                    </button>
                  </>
                )}
              </div>

              {phase === "idle" && (
                <div className="speaking-actions">
                  <button className="btn btn-primary btn-xl" onClick={() => void listen()}>
                    <Mic size={18} /> {step.part === 2 ? "开始描述" : "开始回答"}
                  </button>
                  <button className="btn btn-ghost" onClick={skip}>
                    跳过此题
                  </button>
                  {clip && <VoiceClip blob={clip} label="识别没成功，但这段话录下来了" />}
                  {error && <p className="warn-text">{error}</p>}
                </div>
              )}

              {phase === "listening" && (
                <div className="speaking-listening">
                  <span className="pulse-dot" /> 我在听，请用英文{step.part === 2 ? "描述" : "回答"}……
                </div>
              )}

              {phase === "graded" && (
                <div className="speaking-card">
                  <p className="eyebrow">
                    你的回答 {transcript ? "· 已识别" : "（没识别到语音）"}
                  </p>
                  {transcript && (
                    <p className="speaking-you" lang="en">
                      “{transcript}”
                    </p>
                  )}
                  {clip && <VoiceClip blob={clip} tone={results[results.length - 1]?.score >= 50 ? "ok" : "neutral"} label="听听你刚说的" />}
                  {results[results.length - 1] && (
                    <p className="speaking-score">
                      {results[results.length - 1].hits.length > 0 ? (
                        <>
                          命中关键词：<b lang="en">{results[results.length - 1].hits.join("、")}</b>
                          <span className="is-ok">
                            <Check size={14} /> {results[results.length - 1].score} 分
                          </span>
                        </>
                      ) : (
                        <span className="is-bad">
                          <X size={14} /> 没命中关键词
                        </span>
                      )}
                    </p>
                  )}
                  <p className="muted">
                    参考回答：<span lang="en">{(item ?? pic)!.ref}</span>
                  </p>
                  <button className="btn btn-primary btn-xl" onClick={next}>
                    {i + 1 >= steps.length ? "看小结" : "下一步"} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}
