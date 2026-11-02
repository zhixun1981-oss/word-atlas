import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

/** PET Writing templates: fill the gaps in model answers with connectors/tenses/phrases. */
interface TItem {
  task: string;
  zh: string;
  en: string;
  options: string[];
  answer: number;
  why: string;
}

const EMAIL_ITEMS: TItem[] = [
  {
    task: "PET Writing Part 1 · 回一封邮件",
    zh: "开头问候（对方叫 Sam）",
    en: "___ Sam, thanks for your email!",
    options: ["Dear", "Hi", "Hello to", "Respected"],
    answer: 1,
    why: "给朋友写邮件用 Hi / Dear + 名字，口语化开头。",
  },
  {
    task: "PET Writing Part 1 · 回一封邮件",
    zh: "表示很高兴收到来信",
    en: "It was great ___ from you.",
    options: ["to hear", "hearing", "hear", "heard"],
    answer: 0,
    why: "It was great to hear from you 是固定搭配。",
  },
  {
    task: "PET Writing Part 1 · 回一封邮件",
    zh: "回答对方的问题：周六可以",
    en: "Saturday is ___ for me, no problem.",
    options: ["bad", "fine", "terrible", "busy"],
    answer: 1,
    why: "fine = 可以、没问题，邮件常用语。",
  },
  {
    task: "PET Writing Part 1 · 回一封邮件",
    zh: "连接词：另外，我们还带吃的吗",
    en: "___ the way, should we bring any food?",
    options: ["By", "On", "In", "At"],
    answer: 0,
    why: "by the way 顺便问一下，口语连接词。",
  },
  {
    task: "PET Writing Part 1 · 回一封邮件",
    zh: "结尾：期待见面",
    en: "I'm looking ___ to seeing you!",
    options: ["forward", "up", "after", "out"],
    answer: 0,
    why: "look forward to doing sth 期待做某事，写作高频。",
  },
];

const STORY_ITEMS: TItem[] = [
  {
    task: "PET Writing Part 2 · 写短故事",
    zh: "故事开头：上周六发生了一件事",
    en: "___ Saturday, something strange happened.",
    options: ["Last", "In", "On the", "Next"],
    answer: 0,
    why: "last Saturday 上周六，故事常用时间状语。",
  },
  {
    task: "PET Writing Part 2 · 写短故事",
    zh: "动作衔接：我正走在路上，这时…",
    en: "I was walking down the road ___ I heard a noise.",
    options: ["when", "because", "so", "but"],
    answer: 0,
    why: "was doing… when… 正在做某事时突然发生，叙事经典句型。",
  },
  {
    task: "PET Writing Part 2 · 写短故事",
    zh: "过去时：一只猫从树上跳下来",
    en: "A cat jumped ___ the tree.",
    options: ["off", "in", "on", "at"],
    answer: 0,
    why: "jump off the tree 从树上跳下来。",
  },
  {
    task: "PET Writing Part 2 · 写短故事",
    zh: "转折：起初我很害怕，但后来…",
    en: "___ first I was scared, but then I laughed.",
    options: ["At", "In", "For", "By"],
    answer: 0,
    why: "at first 起初，故事叙事常用。",
  },
  {
    task: "PET Writing Part 2 · 写短故事",
    zh: "结尾：那天我永远不会忘记",
    en: "I will ___ forget that day.",
    options: ["never", "always", "ever", "often"],
    answer: 0,
    why: "never forget 永远不会忘记，故事收尾句。",
  },
];

/** PET writing template practice: two model structures with gap-filling. */
export function WritingTemplates({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const all = [...EMAIL_ITEMS, ...STORY_ITEMS];
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const cur = all[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    setCorrect((c) => c + (ok ? 1 : 0));
    if (i + 1 >= all.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setPicked(null);
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">模板练习完成</p>
          <h1 className="display">
            {correct} <small>/ {all.length}</small>
          </h1>
          <p className="lede">{correct === all.length ? "全对，写作套路已经上道。" : correct >= all.length / 2 ? "记住大半，连接词和句型再积累。" : "把模板句读熟，写作时直接调用。"}</p>
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
          <span style={{ width: `${(i / all.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {all.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="synant-cue">
          <span className="dialogue-level">{cur.task}</span>
          <p className="muted">{cur.zh}，选一个词填入句子。</p>
          <p className="wordform-sentence">
            <span lang="en">{cur.en.replace("___", " ______ ")}</span>
          </p>
        </div>
        <div className="exam-opts dialogue-opts">
          {cur.options.map((opt, idx) => (
            <button key={opt} className={`exam-opt ${picked !== null ? (idx === cur.answer ? "is-correct" : idx === picked ? "is-wrong" : "") : ""}`} onClick={() => pick(idx)} disabled={picked !== null}>
              <span className="opt-letter">{String.fromCharCode(65 + idx)}</span> <span lang="en">{opt}</span>
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${picked === cur.answer ? "is-ok" : ""}`}>
            <p>
              {picked === cur.answer ? (
                <>
                  <Check size={17} /> 填对了！
                </>
              ) : (
                <>
                  <X size={17} /> 正确答案：<b lang="en">{cur.options[cur.answer]}</b>
                </>
              )}{" "}
              · {cur.why}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一题</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{all.length} 题 · 邮件 5 题 + 短故事 5 题。</p>
      </section>
    </div>
  );
}
