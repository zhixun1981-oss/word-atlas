import { ArrowRight, Check, Headphones, RotateCcw, Volume2, X } from "lucide-react";
import { useState } from "react";
import type { ExamQuestion } from "../exam/generate";
import { play } from "../lib/audio";
import { cue } from "../lib/sound";
import { useStore } from "../store/store";

export function ListeningRound({
  questions,
  onExit,
  onAgain,
}: {
  questions: ExamQuestion[];
  onExit?: (result?: { items: number; correct: number }) => void;
  onAgain: () => void;
}) {
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[i];

  const playAudio = () => {
    if (q.listen?.url) void play(q.listen.url, q.listen.en, settings.accent);
  };

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
    } else {
      setPicked(null);
      setI(i + 1);
    }
  };

  const acc = Math.round((correct / questions.length) * 100);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">听力练习 · 本轮完成</p>
          <h1 className="display">
            {acc}
            <small>% 正确</small>
          </h1>
          <p className="lede">
            答对 {correct}/{questions.length} 题 · 多听几遍，耳朵会越来越灵
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={() => onExit?.({ items: questions.length, correct })}>
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
        <button className="btn btn-ghost" onClick={() => onExit?.()}>
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
          <Headphones size={14} /> Listening · 第 {i + 1}/{questions.length} 题
        </p>
        <p className="exam-hint">{q.listenMode === "fill" ? "先听句子，再补全句子里缺的那个词。" : "先听句子，再选出句子里出现的那个词。"}</p>

        <div className="exam-listen">
          <button className="btn btn-primary btn-xl" onClick={() => void playAudio()}>
            <Volume2 size={18} /> 听一遍
          </button>
          {q.listenMode === "fill" && q.listen?.gap && (
            <p className="exam-gap" lang="en">
              {q.listen.gap.before}
              <b>＿＿＿</b>
              {q.listen.gap.after}
            </p>
          )}
          {picked !== null && q.listen && <p className="muted" lang="en">{q.listen.en}</p>}
        </div>

        <div className="exam-options">
          {q.options.map((opt) => {
            const isAnswer = opt === q.answer;
            const isPicked = picked === opt;
            const cls = picked === null ? "" : isAnswer ? "is-answer" : isPicked ? "is-wrong" : "is-dim";
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
