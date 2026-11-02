import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { MATCH_ITEMS } from "../exam/readingMatch";

/** KET/PET Reading Part 2/3: read the person's needs and choose the best notice. */
export function ReadingMatch({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const cur = MATCH_ITEMS[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    setCorrect((c) => c + (ok ? 1 : 0));
    if (i + 1 >= MATCH_ITEMS.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setPicked(null);
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">匹配完成</p>
          <h1 className="display">
            {correct} <small>/ {MATCH_ITEMS.length}</small>
          </h1>
          <p className="lede">
            {correct === MATCH_ITEMS.length
              ? "全对，抓关键信息的本事很稳。"
              : correct >= MATCH_ITEMS.length / 2
                ? "记住大半，先划需求句里的关键词。"
                : "先读需求，再逐个排除选项。"}
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
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / MATCH_ITEMS.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {MATCH_ITEMS.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="reading-need">
          <span className="dialogue-level">Reading · 信息匹配</span>
          <p lang="en">{cur.need}</p>
          <p className="muted">{cur.needZh}</p>
        </div>
        <div className="exam-opts reading-opts">
          {cur.options.map((opt, idx) => (
            <button
              key={idx}
              className={`exam-opt ${picked !== null ? (idx === cur.answer ? "is-correct" : idx === picked ? "is-wrong" : "") : ""}`}
              onClick={() => pick(idx)}
              disabled={picked !== null}
            >
              <span className="opt-letter">{String.fromCharCode(65 + idx)}</span> <span lang="en">{opt}</span>
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${picked === cur.answer ? "is-ok" : ""}`}>
            <p>
              {picked === cur.answer ? (
                <>
                  <Check size={17} /> 匹配对了！
                </>
              ) : (
                <>
                  <X size={17} /> 正确选项：<b>{String.fromCharCode(65 + cur.answer)}</b>
                </>
              )}{" "}
              · {cur.why}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>
              下一题
            </button>
          </div>
        )}
        <p className="muted typing-help">
          第 {i + 1}/{MATCH_ITEMS.length} 题 · 先找需求句的关键词再匹配。
        </p>
      </section>
    </div>
  );
}
