import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

/** PET-style word formation: choose the correct derived form of the root word. */
interface Item {
  en: string;
  zh: string;
  root: string;
  options: string[];
  answer: number;
  note: string;
}

const ITEMS: Item[] = [
  { en: "She felt very ___ when she heard the bad news.", zh: "听到坏消息她很不开心。", root: "happy", options: ["happily", "unhappy", "happiness", "happier"], answer: 1, note: "un- 加在形容词前 = 不…" },
  { en: "He speaks English ___ every day.", zh: "他每天流利地说英语。", root: "fluent", options: ["fluently", "fluency", "fluent", "unfluent"], answer: 0, note: "-ly 把形容词变成副词" },
  { en: "The box was too heavy, so the bag was ___.", zh: "箱子太重，所以袋子没什么用。", root: "use", options: ["useful", "useless", "used", "user"], answer: 1, note: "-less 在名词后 = 没有…的" },
  { en: "My sister wants to be a famous ___ one day.", zh: "我姐姐想成为一名著名的歌手。", root: "sing", options: ["singing", "singer", "song", "sung"], answer: 1, note: "-er 表示做这件事的人" },
  { en: "It's ___ to finish all the homework tonight.", zh: "今晚做完所有作业是不可能的。", root: "possible", options: ["impossible", "possibility", "possibly", "unpossible"], answer: 0, note: "im- 加在以 p/m/b 开头的词前 = 不…" },
  { en: "Thank you for your ___ to the party.", zh: "谢谢你邀请我去聚会。", root: "invite", options: ["invitation", "inviting", "invited", "inviter"], answer: 0, note: "-tion 把动词变成名词" },
  { en: "The ___ between the two cities is 300 km.", zh: "两座城市之间的距离是 300 公里。", root: "distant", options: ["distance", "distant", "distantly", "distan"], answer: 0, note: "-ance 把形容词变成名词" },
  { en: "Please be ___ when you cross the road.", zh: "过马路时请小心。", root: "care", options: ["careless", "careful", "carefully", "cared"], answer: 1, note: "-ful 加在名词后 = 充满…的" },
  { en: "The exam was easy, so I finished ___.", zh: "考试很容易，所以我很快就完成了。", root: "quick", options: ["quickly", "quicker", "quickest", "quickness"], answer: 0, note: "-ly 副词修饰动词" },
  { en: "I don't agree with you. I have a ___ opinion.", zh: "我不同意你，我有不同意见。", root: "agree", options: ["agreement", "agreeing", "disagree", "agreeable"], answer: 2, note: "dis- 加在动词前 = 相反动作" },
];

/** 构词法小课：PET Writing/Use of English 常见词形变化。 */
export function WordBuilding({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const cur = ITEMS[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    setCorrect((c) => c + (ok ? 1 : 0));
    if (i + 1 >= ITEMS.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setPicked(null);
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">小课完成</p>
          <h1 className="display">
            {correct} <small>/ {ITEMS.length}</small>
          </h1>
          <p className="lede">{correct === ITEMS.length ? "全对，构词规律掌握得很好。" : correct >= ITEMS.length / 2 ? "记住大半，前后缀规律再熟悉些。" : "前后缀是猜词和写作的利器，再练一次。"}</p>
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
          <span style={{ width: `${(i / ITEMS.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {ITEMS.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="synant-cue">
          <span className="dialogue-level">构词法 · {cur.note}</span>
          <p className="wordform-sentence">
            <span lang="en">{cur.en.replace("___", " ______ ")}</span>
          </p>
          <p className="muted">{cur.zh} 括号里用 {cur.root} 的适当形式填空。</p>
        </div>
        <div className="wordform-root">
          词根 <b lang="en">{cur.root}</b>
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
                  <Check size={17} /> 答对了！
                </>
              ) : (
                <>
                  <X size={17} /> 正确答案：<b lang="en">{cur.options[cur.answer]}</b>
                </>
              )}{" "}
              · {cur.note}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一题</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{ITEMS.length} 项 · 想清楚前后缀再选。</p>
      </section>
    </div>
  );
}
