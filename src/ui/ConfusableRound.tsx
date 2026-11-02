import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { CONFUSABLES, type ConfusableItem } from "../exam/confusable";
import { cue } from "../lib/sound";
import { useStore } from "../store/store";

export function ConfusableRound({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q: ConfusableItem = CONFUSABLES[i];

  const choose = (opt: "a" | "b") => {
    if (picked !== null || done) return;
    setPicked(opt);
    if (opt === q.answer) {
      setCorrect((c) => c + 1);
      if (settings.sfx) void cue("correct");
    } else if (settings.sfx) {
      void cue("wrong");
    }
  };

  const next = () => {
    if (i + 1 >= CONFUSABLES.length) setDone(true);
    else {
      setPicked(null);
      setI(i + 1);
    }
  };

  const acc = Math.round((correct / CONFUSABLES.length) * 100);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">易混词辨析 · 本轮完成</p>
          <h1 className="display">
            {acc}
            <small>% 正确</small>
          </h1>
          <p className="lede">
            答对 {correct}/{CONFUSABLES.length} 题 · 分清一组，考试少丢一分
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
          <span style={{ width: `${(i / CONFUSABLES.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{correct}</b> 对 · {i + 1}/{CONFUSABLES.length}
        </span>
      </header>
      <section className="exam-stage">
        <p className="eyebrow">易混词辨析 · {q.a} / {q.b}</p>
        <p className="exam-hint">这两个词常被混用。读句子，选出正确的那个。</p>

        <div className="exam-cloze confusable-sentence">
          <p lang="en">{q.sentence}</p>
          <p className="muted">{q.zh}</p>
        </div>

        <div className="exam-options confusable-opts">
          {(["a", "b"] as const).map((opt) => {
            const word = opt === "a" ? q.a : q.b;
            const isAnswer = opt === q.answer;
            const isPicked = picked === opt;
            const cls = picked === null ? "" : isAnswer ? "is-answer" : isPicked ? "is-wrong" : "is-dim";
            return (
              <button key={opt} className={`exam-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null} aria-pressed={isPicked}>
                {picked !== null && isAnswer && <Check size={16} />}
                {picked !== null && isPicked && !isAnswer && <X size={16} />}
                <b lang="en">{word}</b>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className={`exam-feedback ${picked === q.answer ? "is-ok" : "is-bad"}`}>
            <p lang="en">
              正确答案：<b>{q.answer === "a" ? q.a : q.b}</b>
            </p>
            <p className="muted">{q.why}</p>
            <button className="btn btn-primary btn-xl" onClick={next}>
              {i + 1 >= CONFUSABLES.length ? "看结果" : "下一题"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
