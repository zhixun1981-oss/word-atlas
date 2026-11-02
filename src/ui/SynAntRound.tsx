import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play } from "../lib/audio";
import { shuffle } from "../lib/text";

interface Item {
  e: Entry;
  isSyn: boolean;
  answer: string;
  options: string[];
}

/** Pick the synonym or antonym of the target word (4 options). */
export function SynAntRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const items = useMemo<Item[]>(() => {
    const distractors = shuffle(atlas.words.map((w) => w.word)).filter((w) => w.length > 2);
    let d = 0;
    return entries.map((e) => {
      const isSyn = e.syn.length >= e.ant.length;
      const answer = (isSyn ? e.syn : e.ant)[0] ?? (isSyn ? e.ant[0] : e.syn[0]);
      const opts = new Set<string>([answer]);
      while (opts.size < 4) {
        const cand = distractors[(d++) % distractors.length];
        if (cand !== e.w && cand !== answer) opts.add(cand);
      }
      return { e, isSyn, answer, options: shuffle([...opts]) };
    });
  }, [entries, atlas.words]);

  const cur = items[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = cur.options[idx] === cur.answer;
    const nc = correct + (ok ? 1 : 0);
    setCorrect(nc);
    if (i + 1 >= items.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setPicked(null);
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">配对完成</p>
          <h1 className="display">
            {correct} <small>/ {items.length}</small>
          </h1>
          <p className="lede">{correct === items.length ? "全对，词义关系很清楚。" : correct >= items.length / 2 ? "记住大半，继续。" : "多想想词与词之间的联系。"}</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>返回</button>
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
        <button className="btn btn-ghost" onClick={onExit}>结束</button>
        <div className="learn-progress">
          <span style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {items.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="synant-cue">
          <span className="dialogue-level">{cur.isSyn ? "同义词" : "反义词"} · 选出词义最近的词</span>
          <div className="synant-word">
            <b lang="en">{cur.e.w}</b>
            <em>{atlas.byId.get(cur.e.id)?.ipa ?? ""}</em>
            <button className="btn btn-ghost" onClick={() => void play(atlas.audio(cur.e, "uk"), cur.e.w, "uk")}>
              <Volume2 size={15} /> 听
            </button>
          </div>
          <p className="muted">
            哪个单词与「<b lang="en">{cur.e.w}</b>」是{cur.isSyn ? "同义" : "反义"}？
          </p>
        </div>
        <div className="exam-opts dialogue-opts">
          {cur.options.map((opt, idx) => (
            <button key={opt} className={`exam-opt ${picked !== null ? (opt === cur.answer ? "is-correct" : idx === picked ? "is-wrong" : "") : ""}`} onClick={() => pick(idx)} disabled={picked !== null}>
              <span className="opt-letter">{String.fromCharCode(65 + idx)}</span> <span lang="en">{opt}</span>
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${cur.options[picked] === cur.answer ? "is-ok" : ""}`}>
            <p>
              {cur.options[picked] === cur.answer ? (
                <>
                  <Check size={17} /> 答对了！
                </>
              ) : (
                <>
                  <X size={17} /> 正确答案：<b lang="en">{cur.answer}</b>
                </>
              )}{" "}
              · {cur.e.senses[0].zh}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一题</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{items.length} 项 · 找词义关系，不查词典。</p>
      </section>
    </div>
  );
}
