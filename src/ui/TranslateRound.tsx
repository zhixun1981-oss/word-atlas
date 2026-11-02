import { Check, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Entry } from "../atlas/types";
import { clean, same } from "../lib/typing";

const STOP = new Set(["the", "a", "an", "of", "to", "in", "on", "at", "for", "and", "or", "but", "is", "are", "was", "were", "do", "does", "did", "have", "has", "had", "will", "would", "can", "could", "should", "may", "might", "it", "this", "that", "these", "those", "my", "your", "his", "her", "our", "their", "we", "you", "they", "he", "she", "i", "me", "him", "us", "them", "with", "from", "about", "as", "by", "be", "been", "being", "so", "if", "not", "no", "yes", "there", "here", "when", "where", "what", "why", "how", "very", "just", "then", "than", "too", "also", "up", "out", "over", "under", "more", "most", "some", "any", "one", "two", "get", "got", "go", "went", "come", "came", "make", "made", "take", "took", "see", "saw", "say", "said", "tell", "told", "know", "knew", "think", "thought", "want", "like", "give", "gave", "find", "found", "look", "looked", "put", "use", "used", "day", "night", "time", "week", "year", "school", "home", "work", "new", "old", "good", "bad", "big", "small", "long", "short", "much", "many"]);

function keywords(en: string): string[] {
  return clean(en)
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** Translate the Chinese hint into English; accept close keyword matches. */
export function TranslateRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const e = entries[i];
  const target = e.ex?.[0]?.en ?? "";

  const score = useMemo(() => {
    if (!value.trim()) return 0;
    if (same(value.trim(), target)) return 1;
    const k = keywords(target);
    if (!k.length) return same(value.trim().toLowerCase(), target.toLowerCase()) ? 1 : 0;
    const hits = k.filter((w) => clean(value).toLowerCase().includes(w)).length;
    return hits / k.length;
  }, [value, target]);

  const check = () => {
    const ok = score >= 0.55;
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    setRevealed(ok);
    if (i + 1 >= entries.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setValue("");
    setRevealed(null);
    input.current?.focus();
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">本轮完成</p>
          <h1 className="display">
            {correct} <small>/ {entries.length}</small>
          </h1>
          <p className="lede">{correct === entries.length ? "句句到位，翻译很顺。" : correct >= entries.length / 2 ? "大半接近参考答案，继续。" : "翻译靠积累，把例句读熟再看一遍。"}</p>
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
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          过关 <b>{correct}</b> / {entries.length}
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        <p className="typing-zh">
          <span className="pos">{e.senses[0].pos}</span> {e.senses[0].zh}
        </p>
        <p className="translate-hint" lang="zh">
          {e.ex?.[0]?.zh ?? e.senses[0].zh}
        </p>
        <input
          ref={input}
          className={`typing-input spell-input ${revealed === null ? "" : revealed ? "is-ok" : "is-bad"}`}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && revealed === null) check();
            if (ev.key === "Enter" && revealed !== null) next();
          }}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="写出英文句子"
          disabled={revealed !== null}
        />
        {revealed !== null && (
          <div className={`exam-feedback ${revealed ? "is-ok" : ""}`}>
            {revealed ? (
              <p>
                <Check size={17} /> 写得很接近，语法通顺就好。
              </p>
            ) : (
              <p>
                参考答案：<b lang="en">{target}</b>
              </p>
            )}
            <button className="btn btn-primary" onClick={next} autoFocus>
              下一题
            </button>
          </div>
        )}
        <p className="muted typing-help">
          第 {i + 1}/{entries.length} 项 · 对着中文写出英文，回车核对。相近表达也算过关。
        </p>
      </section>
    </div>
  );
}
