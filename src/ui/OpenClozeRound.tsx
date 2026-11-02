import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CLOZE_TEXTS, clozeMatch, splitCloze, type ClozeText } from "../exam/opencloze";
import { cue } from "../lib/sound";
import { ART } from "../lib/art";
import { store, useStore } from "../store/store";

/**
 * 开放式填空（KET R&W Part 5 / PET Reading Part 6）。
 * 不给选项，自己写词 —— 挖掉的几乎全是冠词、介词、连词这类虚词，
 * 是背单词背不到、考场丢分最集中的题型，所以要单独练。
 */
export function OpenClozeRound({ level, onExit }: { level?: "A2" | "B1"; onExit: () => void }) {
  const settings = useStore((s) => s.settings);
  const [text, setText] = useState<ClozeText>(() => {
    const pool = level ? CLOZE_TEXTS.filter((t) => t.level === level) : CLOZE_TEXTS;
    const list = pool.length ? pool : CLOZE_TEXTS;
    return list[Math.floor(Math.random() * list.length)];
  });
  const parts = useMemo(() => splitCloze(text.body), [text]);
  const [vals, setVals] = useState<string[]>(() => Array(text.answers.length).fill(""));
  const [checked, setChecked] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const marks = text.answers.map((a, k) => clozeMatch(vals[k] ?? "", a));
  const right = marks.filter(Boolean).length;
  const total = text.answers.length;

  const check = () => {
    setChecked(true);
    if (settings.sfx) void cue(right / total >= 0.6 ? "correct" : "wrong");
    store.progress((p) => ({
      ...p,
      exam: [...p.exam, { at: Date.now(), kind: "opencloze" as const, items: total, correct: right }].slice(-500),
    }));
  };

  const again = () => {
    const pool = level ? CLOZE_TEXTS.filter((t) => t.level === level) : CLOZE_TEXTS;
    const list = pool.length ? pool : CLOZE_TEXTS;
    const next = list[Math.floor(Math.random() * list.length)];
    setText(next);
    setVals(Array(next.answers.length).fill(""));
    setChecked(false);
  };

  const setVal = (k: number, v: string) => {
    setVals((cur) => {
      const n = [...cur];
      n[k] = v;
      return n;
    });
  };

  const jump = (k: number) => {
    if (k < total - 1) inputs.current[k + 1]?.focus();
  };

  return (
    <div className="page practice">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          <ArrowLeft size={16} /> 结束
        </button>
        <span className="typing-meter">
          {text.level} · 开放式填空 {checked ? `${right}/${total}` : `${total} 空`}
        </span>
      </header>
      <section className="round-hero">
        <div className="rh-text">
          <h2>开放式填空</h2>
          <p>Open Cloze · KET/PET 阅读高频丢分题——不给选项，自己写词。多填冠词、介词、连词这类「小词」。</p>
        </div>
        <img src={ART("pen")} alt="" />
      </section>
      <section className="panel oc-panel">
        <p className="eyebrow">Open Cloze · 不给选项，自己写词</p>
        <h2 className="oc-title">{text.title}</h2>
        <p className="muted">读一遍全文，把每个空补上。多数空填的是冠词、介词、连词、助动词这类「小词」。</p>

        <div className="oc-text" lang="en">
          {parts.map((chunk, k) => (
            <span key={k}>
              {chunk}
              {k < parts.length - 1 && (
                <span className={`oc-slot ${checked ? (marks[k] ? "is-ok" : "is-bad") : ""}`}>
                  <input
                    ref={(el) => {
                      inputs.current[k] = el;
                    }}
                    className="oc-input"
                    value={vals[k] ?? ""}
                    onChange={(e) => setVal(k, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") jump(k);
                    }}
                    readOnly={checked}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={`第 ${k + 1} 空`}
                  />
                  {checked && !marks[k] && (
                    <b className="oc-answer">{text.answers[k].split("|")[0]}</b>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>

        {!checked ? (
          <div className="summary-actions">
            <button className="btn btn-primary btn-xl" onClick={check} disabled={vals.every((v) => !v.trim())}>
              <Check size={18} /> 核对答案
            </button>
          </div>
        ) : (
          <>
            <div className={`exam-feedback ${right / total >= 0.6 ? "is-ok" : "is-bad"}`}>
              <p>
                答对 <b>{right}</b> / {total} 空 ·{" "}
                {right === total ? "全对！这篇的虚词你都拿下了。" : right / total >= 0.6 ? "不错，看看下面错的几个。" : "虚词是丢分大户，把讲解读完再来一篇。"}
              </p>
            </div>
            <div className="oc-notes">
              <span className="eyebrow">逐个空讲解</span>
              {text.answers.map((a, k) => (
                <p key={k} className={marks[k] ? "is-ok" : "is-bad"}>
                  <span className="oc-no">{k + 1}</span>
                  {marks[k] ? <Check size={14} /> : <X size={14} />}
                  <b lang="en">{a.split("|")[0]}</b>
                  <span>{text.notes[k]}</span>
                </p>
              ))}
            </div>
            <p className="muted oc-zh">全文大意：{text.zh}</p>
            <div className="summary-actions">
              <button className="btn btn-ghost" onClick={onExit}>
                返回
              </button>
              <button className="btn btn-primary btn-xl" onClick={again} autoFocus>
                <RotateCcw size={18} /> 换一篇
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
