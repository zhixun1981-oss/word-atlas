import { ArrowRight, Check, GraduationCap, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SIGNS, signsFor, type SignItem } from "../exam/signs";
import { cue } from "../lib/sound";
import { store, useStore } from "../store/store";

const TONE_LABEL: Record<SignItem["tone"], string> = {
  red: "禁止类",
  blue: "指示类",
  green: "安全 / 允许",
  amber: "提醒类",
  grey: "提示类",
};

export function SignRound({
  level,
  onExit,
  onAgain,
}: {
  level?: "A2" | "B1";
  onExit: () => void;
  onAgain: () => void;
}) {
  const settings = useStore((s) => s.settings);
  const items = useMemo<SignItem[]>(() => {
    const pool = (level ? signsFor(level) : SIGNS).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, [level]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = items[i];

  const choose = (opt: string) => {
    if (picked !== null || done) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) setCorrect((c) => c + 1);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };

  const next = () => {
    if (i + 1 >= items.length) {
      setDone(true);
      store.progress((p) => ({
        ...p,
        exam: [...p.exam, { at: Date.now(), kind: "sign" as const, items: items.length, correct: correct + (picked === q.answer ? 1 : 0) }].slice(-500),
      }));
    } else {
      setPicked(null);
      setI(i + 1);
    }
  };

  const acc = Math.round((correct / items.length) * 100);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">Reading · 标识识别 · 本轮完成</p>
          <h1 className="display">
            {acc}
            <small>% 正确</small>
          </h1>
          <p className="lede">
            答对 {correct}/{items.length} 题 · 错题可点「再来一轮」重练
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice exam">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{correct}</b> 对 · {i + 1}/{items.length}
        </span>
      </header>
      <section className="exam-stage">
        <p className="eyebrow">
          <GraduationCap size={14} /> Reading · 标识识别 · {q.level}
        </p>
        <p className="exam-hint">看下面的告示牌，选出它在说什么。这是 KET / PET 阅读第一题的同源模拟题。</p>

        <div className={`sign-board tone-${q.tone}`} role="img" aria-label={q.sign}>
          <span className="sign-tone">{TONE_LABEL[q.tone]}</span>
          <span className="sign-text">{q.sign}</span>
        </div>

        <p className="sign-question">{q.question}</p>

        <div className="exam-options">
          {q.options.map((opt) => {
            const isAnswer = opt === q.answer;
            const isPicked = picked === opt;
            const cls =
              picked === null
                ? ""
                : isAnswer
                  ? "is-answer"
                  : isPicked
                    ? "is-wrong"
                    : "is-dim";
            return (
              <button key={opt} className={`exam-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null} aria-pressed={isPicked}>
                {picked !== null && isAnswer && <Check size={16} />}
                {picked !== null && isPicked && !isAnswer && <X size={16} />}
                <b>{opt}</b>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className={`exam-feedback ${picked === q.answer ? "is-ok" : "is-bad"}`}>
            <p>{q.zh}</p>
            <button className="btn btn-primary btn-xl" onClick={next}>
              {i + 1 >= items.length ? "看结果" : "下一题"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
