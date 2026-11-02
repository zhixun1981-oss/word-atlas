import { Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DIALOGUES, type DialogueItem } from "../exam/dialogues";
import { stopAudio } from "../lib/audio";

/** KET/PET-style listening: play a short dialogue, answer one multiple-choice question. */
export function DialogueRound({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const items = useRef<DialogueItem[]>(shuffle(DIALOGUES)).current;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const d = items[i];

  useEffect(() => () => stopAudio(), []);

  const playDialogue = () => {
    const el = new Audio(`${import.meta.env.BASE_URL}${d.audio}`);
    audioRef.current?.pause();
    audioRef.current = el;
    el.play().catch(() => null);
  };

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === d.answer;
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
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
          <p className="eyebrow">听力完成</p>
          <h1 className="display">
            {correct} <small>/ {items.length}</small>
          </h1>
          <p className="lede">{correct === items.length ? "全对，耳朵很灵。" : correct >= items.length / 2 ? "听懂大半，继续磨耳朵。" : "多听几遍，抓关键词是关键。"}</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再听一轮
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
          <span style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {items.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="dialogue-cue">
          <span className="dialogue-level">{d.level} · 对话听力</span>
          <button className="btn btn-primary btn-xl" onClick={playDialogue}>
            <Play size={18} /> 听对话
          </button>
          <button className="btn btn-ghost" onClick={playDialogue}>
            <Volume2 size={15} /> 再听一遍
          </button>
          <p className="muted">听两遍，选出正确答案。答完再看原文。</p>
        </div>
        <p className="dialogue-question">{d.question}</p>
        <div className="exam-opts dialogue-opts">
          {d.options.map((opt, idx) => (
            <button key={opt} className={`exam-opt ${picked !== null ? (idx === d.answer ? "is-correct" : idx === picked ? "is-wrong" : "") : ""}`} onClick={() => pick(idx)} disabled={picked !== null}>
              <span className="opt-letter">{String.fromCharCode(65 + idx)}</span> {opt}
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${picked === d.answer ? "is-ok" : ""}`}>
            <p>{picked === d.answer ? `答对了！${d.options[d.answer]}` : `正确答案：${d.options[d.answer]}`}</p>
            <div className="dialogue-script">
              {d.script.map(([sp, text], k) => (
                <p key={k}>
                  <b>{sp}</b> <span lang="en">{text}</span>
                </p>
              ))}
            </div>
            <button className="btn btn-primary" onClick={next} autoFocus>
              下一题
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}
