import { ArrowRight, Bot, Mic, RotateCcw, User, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { KET_TASKS, PART3_TASKS, PART3_SECONDS, PART4_SECONDS, type Part3Task } from "../exam/speakingParts";
import { chatJSON, chatOnce, pickModel } from "../lib/llm";
import { VoiceClip } from "./VoiceClip";
import { listenOnce, speechSupported } from "../lib/speech";
import { recorderSupported, startRecording, type Recorder } from "../lib/recorder";
import { speak as speakEn } from "../lib/tts";
import { ART } from "../lib/art";
import { store, useStore } from "../store/store";
import type { ChatMessage } from "../lib/llm";

interface Report {
  grammar: number;
  vocabulary: number;
  interaction: number;
  overall: number;
  good: string;
  improve: string;
}

type Phase = "intro" | "part3" | "part4" | "report";

const AMY_SYSTEM =
  "You are Amy, an English classmate doing a PET Speaking Part 3 task with a Chinese student (level B1). " +
  "Rules: keep every turn to ONE or TWO short sentences. Give your own opinion about the options, ask what the student thinks, and react naturally to what they say. " +
  "After three exchanges, make a decision and say briefly why. Never write long paragraphs, never correct their grammar, never use Chinese.";

const EXAMINER_SYSTEM =
  "You are a PET Speaking examiner for Part 4. Ask the question given to you, then when the student answers, " +
  "reply with ONE short sentence of natural reaction, and if there is a clear grammar mistake add one line starting with 'Better:' giving the corrected sentence. " +
  "Keep everything short and encouraging. Never use Chinese.";

/** A2（KET）版本：句子更短、词汇更基础，不用 B1 的复杂结构。 */
const AMY_SYSTEM_A2 =
  "You are Amy, an English classmate talking to a Chinese student (level A2, KET). " +
  "Rules: use very simple words and short sentences, ONE sentence per turn. Give your idea about the options, then ask 'What do you think?' " +
  "After three exchanges, choose and say 'Let's do that!' Never write long paragraphs, never correct grammar, never use Chinese.";

const EXAMINER_SYSTEM_A2 =
  "You are a KET Speaking examiner talking to a Chinese student (level A2). Ask the simple question given to you. " +
  "When the student answers, reply with ONE very short friendly sentence, and if there is a clear mistake add one line starting with 'Better:' with the correct simple sentence. " +
  "Use easy words. Never use Chinese.";

/**
 * PET Speaking Part 3（协作任务）+ Part 4（延伸讨论）模拟考官。
 * 本地模型分别扮演「搭档 Amy」和「考官」，全程离线。
 */
export function SpeakingExam({
  onExit,
  onAgain,
  level = "B1",
}: {
  onExit?: (r?: { items: number; score: number }) => void;
  onAgain: () => void;
  level?: "A2" | "B1";
}) {
  const settings = useStore((s) => s.settings);
  const isA2 = level === "A2";
  const amySystem = isA2 ? AMY_SYSTEM_A2 : AMY_SYSTEM;
  const examinerSystem = isA2 ? EXAMINER_SYSTEM_A2 : EXAMINER_SYSTEM;
  const [task] = useState<Part3Task>(() => {
    const bank = isA2 ? KET_TASKS : PART3_TASKS;
    return bank[Math.floor(Math.random() * bank.length)];
  });
  const [phase, setPhase] = useState<Phase>("intro");
  const [model, setModel] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bubbles, setBubbles] = useState<{ who: "ai" | "me"; text: string; label: string }[]>([]);
  const [draft, setDraft] = useState("");
  /** 上一段录音，用来回放。 */
  const [clip, setClip] = useState<Blob | null>(null);
  const [turn, setTurn] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const msgs = useRef<ChatMessage[]>([]);
  const said = useRef<string[]>([]);
  const alive = useRef(true);
  const scroll = useRef<HTMLDivElement>(null);

  const supported = useMemo(() => speechSupported(), []);

  useEffect(() => {
    alive.current = true;
    void pickModel(settings.llmModel || undefined).then((m) => {
      if (!alive.current) return;
      setModel(m);
      setChecking(false);
    });
    return () => {
      alive.current = false;
    };
  }, [settings.llmModel]);

  // 计时器：切阶段时归零
  useEffect(() => {
    if (phase === "intro" || phase === "report") return;
    setSecs(0);
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [bubbles]);

  const speak = (text: string) => {
    if (muted) return;
    speakEn(text, { lang: settings.accent === "uk" ? "en-GB" : "en-US", rate: 0.95, voice: settings.voice });
  };

  const say = (who: "ai" | "me", text: string, label: string) =>
    setBubbles((b) => [...b, { who, text, label }]);

  /** 让模型接话；失败时给出可读的错误。 */
  const askModel = async (): Promise<string | null> => {
    setBusy(true);
    setError("");
    try {
      const text = await chatOnce(msgs.current, { model: model ?? undefined, temperature: 0.8 });
      if (!alive.current) return null;
      msgs.current = [...msgs.current, { role: "assistant", content: text }];
      return text;
    } catch (e) {
      if (!alive.current) return null;
      setError(e instanceof Error && e.message === "no-model" ? "没找到本地模型。" : "连不上本地模型了。检查 Ollama 是不是还在跑。");
      return null;
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const start = async () => {
    setPhase("part3");
    msgs.current = [
      { role: "system", content: amySystem },
      {
        role: "user",
        content: `Task: ${task.situation}\nOptions: ${task.options.map((o) => o.en).join(", ")}.\nStart the discussion with your own opinion in one sentence and ask what I think.`,
      },
    ];
    const first = await askModel();
    if (first) {
      say("ai", first, "Amy · 你的搭档");
      speak(first);
    }
  };

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setDraft("");
    setClip(null);
    said.current = [...said.current, t];
    say("me", t, "你");
    msgs.current = [...msgs.current, { role: "user", content: t }];

    if (phase === "part3") {
      const reply = await askModel();
      if (!reply) return;
      say("ai", reply, "Amy · 你的搭档");
      speak(reply);
      const n = turn + 1;
      setTurn(n);
      if (n >= 3) {
        msgs.current = [
          ...msgs.current,
          { role: "user", content: `Now make the decision: ${task.decision} Say which one you choose and why, in two sentences.` },
        ];
        const dec = await askModel();
        if (dec) {
          say("ai", dec, "Amy · 决定");
          speak(dec);
        }
      }
      return;
    }

    // Part 4
    const reply = await askModel();
    if (!reply) return;
    say("ai", reply, "考官");
    speak(reply);
    const n = qIndex + 1;
    setQIndex(n);
    if (n >= task.followUps.length) {
      await grade();
      return;
    }
    // 下一题由考官提问
    const nextQ = task.followUps[n];
    msgs.current = [
      { role: "system", content: examinerSystem },
      { role: "user", content: `Now ask the student this question exactly: "${nextQ.q}"` },
    ];
    const asked = await askModel();
    if (asked) {
      say("ai", asked, isA2 ? "考官 · 追问" : "考官 · Part 4");
      speak(asked);
      msgs.current = [...msgs.current, { role: "system", content: examinerSystem }];
    }
  };

  const startPart4 = () => {
    setPhase("part4");
    setQIndex(0);
    const q0 = task.followUps[0];
    msgs.current = [
      { role: "system", content: examinerSystem },
      { role: "user", content: `Now ask the student this question exactly: "${q0.q}"` },
    ];
    void (async () => {
      const asked = await askModel();
      if (asked) {
        say("ai", asked, isA2 ? "考官 · 追问" : "考官 · Part 4");
        speak(asked);
        msgs.current = [...msgs.current, { role: "system", content: examinerSystem }];
      }
    })();
  };

  /** 让本地模型按 PET 口语四项标准评分。 */
  const grade = async () => {
    setBusy(true);
    const script = said.current.join(" | ");
    const prompt =
      "You are a PET Speaking examiner grading a B1 student.\n" +
      `Here is everything the student said: "${script}"\n\n` +
      "Give scores 0-100 for grammar, vocabulary, interaction, and an overall score. " +
      "Also write one short sentence 'good' about what they did well, and one short sentence 'improve' with one concrete thing to fix. " +
      "Write BOTH 'good' and 'improve' in Simplified Chinese (简体中文) — the student is a Chinese child. Keep each under 40 Chinese characters. " +
      'Reply with JSON only: {"grammar":70,"vocabulary":65,"interaction":80,"overall":72,"good":"...","improve":"..."}';
    try {
      const r = await chatJSON<Report>([{ role: "user", content: prompt }], { model: model ?? undefined, temperature: 0.3 });
      if (!alive.current) return;
      const safe: Report = {
        grammar: clamp(r?.grammar),
        vocabulary: clamp(r?.vocabulary),
        interaction: clamp(r?.interaction),
        overall: clamp(r?.overall),
        good: typeof r?.good === "string" ? r.good : "能开口把意思表达出来，这就是最重要的一步。",
        improve: typeof r?.improve === "string" ? r.improve : "试着把答案说长一点：加一句原因，比如 because…",
      };
      setReport(safe);
      setPhase("report");
      store.progress((p) => ({
        ...p,
        exam: [...p.exam, { at: Date.now(), kind: "speaking" as const, items: said.current.length, correct: 0, score: safe.overall }].slice(-500),
      }));
    } catch {
      if (!alive.current) return;
      // 模型没给结构化结果时，用答题量兜底，不装假给精确分
      const n = said.current.length;
      const rough = Math.min(95, 40 + n * 6);
      const safe: Report = {
        grammar: rough,
        vocabulary: rough,
        interaction: rough,
        overall: rough,
        good: isA2 ? `一共开口说了 ${n} 次，商量和追问都接住了。` : `一共开口说了 ${n} 次，能撑完 Part 3 和 Part 4。`,
        improve: "本地模型这次没给出细评，再练一轮就能拿到逐项反馈。",
      };
      setReport(safe);
      setPhase("report");
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const mic = async () => {
    setError("");
    setClip(null);
    const rec: Recorder | null = recorderSupported() ? await startRecording().catch(() => null) : null;
    try {
      const t = await listenOnce(settings.accent === "uk" ? "en-GB" : "en-US", 12000);
      setDraft(t);
    } catch (e) {
      setError(
        e instanceof Error && e.message === "not-allowed"
          ? "麦克风权限被拒绝了。点地址栏左侧的麦克风图标 → 允许 → 刷新页面。"
          : "没听清，再试一次，或者直接打字。",
      );
    } finally {
      if (rec) {
        const blob = await rec.stop().catch(() => null);
        if (blob) setClip(blob);
      }
    }
  };

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const limit = phase === "part3" ? PART3_SECONDS : PART4_SECONDS;

  // ---------------- 开场 / 模型未就绪 ----------------
  if (phase === "intro")
    return (
      <div className="page practice">
        <header className="typing-top">
          <button className="btn btn-ghost" onClick={() => onExit?.()}>
            结束
          </button>
          <span className="typing-meter">{isA2 ? "KET Speaking · A2 陪练" : "PET Speaking Part 3 + 4"}</span>
        </header>
        <section className="round-hero">
          <div className="rh-text">
            <h2>{isA2 ? "口语陪练 · A2" : "PET 口语 Part 3 + 4"}</h2>
            <p>
              {isA2
                ? "本地模型当搭档和考官，全程离线。先用简单句商量一件事，再回答两三个基础问题，最后给评分。"
                : "本地模型当搭档和考官，全程离线不联网。Part 3 一起做决定，Part 4 往下聊，最后给评分。"}
            </p>
          </div>
          <img src={ART("dialogue")} alt="" />
        </section>
        <section className="panel spex-intro">
          <p className="eyebrow">
            <Bot size={15} /> 模拟考官
          </p>
          <h2 className="display" style={{ fontSize: 26 }}>
            {isA2 ? "先商量，再回答。" : "Part 3 一起做决定，Part 4 往下聊。"}
          </h2>
          <p className="lede">
            {isA2
              ? "搭档 Amy 会和你商量一件小事（选礼物、周末安排这类 A2 话题），说三句就该做决定了；然后考官问你两个简单问题，看你答不答得出来。答案短一点没关系，说完整句就行。"
              : "Part 3 由本地模型扮演搭档 Amy，跟你就一张图上的 5 个选项讨论，最后一起做决定；Part 4 换成考官，问你 3 个延伸问题。说完给逐项评分。"}
          </p>
          {checking ? (
            <p className="muted">正在找本地模型……</p>
          ) : model ? (
            <>
              <div className="gp-formula">
                <span className="eyebrow">本场任务</span>
                <code>{task.situation}</code>
              </div>
              <p className="muted">{task.zh}</p>
              <div className="spex-options">
                {task.options.map((o) => (
                  <span key={o.en} className="spex-option">
                    <b lang="en">{o.en}</b>
                    <small>{o.zh}</small>
                  </span>
                ))}
              </div>
              <p className="muted">
                {isA2
                  ? `商量建议 ${Math.round(PART3_SECONDS / 60)} 分钟内完成 · 追问每题约 ${PART4_SECONDS} 秒。超时不打断，只是参考。`
                  : `Part 3 建议 ${Math.round(PART3_SECONDS / 60)} 分钟内完成 · Part 4 每题约 ${PART4_SECONDS} 秒。超时不打断，只是参考。`}
              </p>
              <div className="summary-actions">
                <button className="btn btn-primary btn-xl" onClick={() => void start()} autoFocus>
                  <Mic size={18} /> {isA2 ? "开始商量" : "开始 Part 3"}
                </button>
              </div>
            </>
          ) : (
            <div className="ai-down">
              <p className="ai-error">没连上本地模型，这个功能跑不起来。</p>
              <p className="muted">在终端执行：</p>
              <div className="ai-cmd">
                OLLAMA_ORIGINS="*" ollama serve
                <br />
                ollama pull qwen2.5:3b
              </div>
            </div>
          )}
        </section>
      </div>
    );

  // ---------------- 评分报告 ----------------
  if (phase === "report" && report)
    return (
      <div className="page practice">
        <section className="panel typing-done spex-report">
          <p className="eyebrow">{isA2 ? "口语模拟 · A2 完成" : "口语模拟 · Part 3 + 4 完成"}</p>
          <h1 className="display">
            {report.overall}
            <small>分</small>
          </h1>
          <p className="lede">开了 {said.current.length} 次口 · 本地模型按 PET 四项标准评的</p>
          <div className="spex-scores">
            {(
              [
                ["语法 Grammar", report.grammar],
                ["词汇 Vocabulary", report.vocabulary],
                ["互动 Interaction", report.interaction],
              ] as const
            ).map(([label, v]) => (
              <div key={label}>
                <span>{label}</span>
                <div className="spex-bar">
                  <i style={{ width: `${v}%` }} />
                </div>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="gp-trap">
            <b>说得好的地方：</b>
            {report.good}
          </div>
          <div className="ai-mark-better">
            <p className="eyebrow">下一步就改这一处</p>
            <p>{report.improve}</p>
          </div>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={() => onExit?.({ items: said.current.length, score: report.overall })}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再考一场
            </button>
          </div>
        </section>
      </div>
    );

  // ---------------- 对话 ----------------
  return (
    <div className="page practice">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={() => onExit?.()}>
          结束
        </button>
        <span className="typing-meter">
          {phase === "part3"
            ? isA2
              ? "一起商量"
              : "Part 3 · 一起做决定"
            : `${isA2 ? "追问" : "Part 4"} · 第 ${Math.min(qIndex + 1, task.followUps.length)}/${task.followUps.length} 题`}
        </span>
        <span className={`pk-clock ${secs > limit ? "is-urgent" : ""}`}>{clock}</span>
        <button className="btn btn-ghost" onClick={() => setMuted((m) => !m)}>
          {muted ? "已静音" : "朗读中"}
        </button>
      </header>

      {phase === "part3" && (
        <section className="panel spex-task">
          <p className="eyebrow">本场任务</p>
          <p className="muted">{task.zh}</p>
          <div className="spex-options">
            {task.options.map((o) => (
              <span key={o.en} className="spex-option">
                <b lang="en">{o.en}</b>
                <small>{o.zh}</small>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="ai-chat">
        <div className="ai-scroll" ref={scroll}>
          {bubbles.map((b, k) => (
            <div key={k} className={`ai-bubble ${b.who === "me" ? "is-me" : "is-ai"}`}>
              <span className="ai-who">
                {b.who === "me" ? <User size={11} /> : <Bot size={11} />} {b.label}
              </span>
              <p lang="en">{b.text}</p>
              {b.who === "ai" && !muted && (
                <button className="ai-replay" onClick={() => speak(b.text)}>
                  <Volume2 size={12} /> 再听一遍
                </button>
              )}
            </div>
          ))}
          {busy && (
            <div className="ai-bubble is-ai">
              <span className="ai-who">{phase === "part3" ? "Amy 正在想…" : "考官正在想…"}</span>
              <p className="ai-think">
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            </div>
          )}
        </div>

        {error && <p className="ai-error">{error}</p>}

        {phase === "part3" && turn >= 3 && !busy && (
          <div className="summary-actions">
            <button className="btn btn-primary btn-xl" onClick={startPart4}>
              进入{isA2 ? "追问" : " Part 4"} <ArrowRight size={16} />
            </button>
          </div>
        )}

        <div className="ai-compose">
          <input
            className="ai-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim() && !busy) void submit(draft);
            }}
            placeholder={phase === "part3" ? "说出你的看法…（也可以打字）" : "回答考官…"}
            disabled={busy}
          />
          {supported && (
            <button className={`btn btn-ghost ai-mic ${busy ? "" : ""}`} onClick={() => void mic()} disabled={busy} aria-label="用麦克风说">
              <Mic size={17} />
            </button>
          )}
          <button className="btn btn-primary ai-send" onClick={() => void submit(draft)} disabled={busy || !draft.trim()} aria-label="发送">
            <ArrowRight size={17} />
          </button>
        </div>
        {clip && <VoiceClip blob={clip} label="刚说的这段 · 发布前可以重听" />}
        <p className="ai-foot">
          {supported ? "可以点麦克风说，也可以打字。" : "当前浏览器不支持语音识别，用打字的方式练。"}
        </p>
      </section>
    </div>
  );
}

function clamp(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 60;
  return Math.max(0, Math.min(100, n));
}
