import { ArrowRight, Check, GraduationCap, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { ExamKind, ExamQuestion } from "../exam/generate";
import { cue } from "../lib/sound";
import { store, useStore } from "../store/store";

const KIND_META: Record<ExamKind, { label: string; part: string; hint: string }> = {
  cloze: { label: "Reading · 完形", part: "KET/PET Reading Part", hint: "读句子，选出最合适的词。" },
  definition: { label: "Reading · 释义", part: "KET/PET Reading", hint: "看英文释义，选出对应的词。" },
  picture: { label: "Speaking · 看图", part: "PET Speaking", hint: "看图，选出描述这幅图的词。" },
  listen: { label: "Listening · 听力", part: "KET/PET Listening", hint: "听句子，选出句中的关键词。" },
};

export function ExamRound({
  kind,
  questions,
  onExit,
  onAgain,
}: {
  kind: Exclude<ExamKind, "listen">;
  questions: ExamQuestion[];
  onExit: () => void;
  onAgain: () => void;
}) {
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[i];

  const choose = (opt: string) => {
    if (picked !== null || done) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) setCorrect((c) => c + 1);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };

  const next = () => {
    if (i + 1 >= questions.length) {
      setDone(true);
      store.progress((p) => ({
        ...p,
        exam: [...p.exam, { at: Date.now(), kind, items: questions.length, correct: correct + (picked === q.answer ? 1 : 0) }].slice(-500),
      }));
    } else {
      setPicked(null);
      setI(i + 1);
    }
  };

  const meta = KIND_META[kind];
  const acc = Math.round((correct / questions.length) * 100);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">{meta.label} · 本轮完成</p>
          <h1 className="display">
            {acc}
            <small>% 正确</small>
          </h1>
          <p className="lede">
            答对 {correct}/{questions.length} 题 · 错题已可点「再来一轮」重练
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
          <span style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{correct}</b> 对 · {i + 1}/{questions.length}
        </span>
      </header>
      <section className="exam-stage">
        <p className="eyebrow">
          <GraduationCap size={14} /> {meta.label} · {meta.part}
        </p>
        <p className="exam-hint">{meta.hint}</p>

        {q.kind === "cloze" && q.cloze && (
          <div className="exam-cloze">
            <p lang="en">
              {q.cloze.before}
              <span className="exam-gap">____</span>
              {q.cloze.after}
            </p>
            {q.cloze.zh && <p className="muted">{q.cloze.zh}</p>}
          </div>
        )}

        {q.kind === "definition" && (
          <div className="exam-def">
            <span className="pos">{q.pos}</span>
            <p lang="en">{q.gloss}</p>
          </div>
        )}

        {q.kind === "picture" && q.image && (
          <div className="exam-picture">
            <img src={q.image} alt={`${q.w} 插画`} draggable={false} />
          </div>
        )}

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
                <b lang="en">{opt}</b>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className={`exam-feedback ${picked === q.answer ? "is-ok" : "is-bad"}`}>
            <p lang="en">
              <b>{q.w}</b> {q.zh}
            </p>
            <button className="btn btn-primary btn-xl" onClick={next}>
              {i + 1 >= questions.length ? "看结果" : "下一题"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
