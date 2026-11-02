import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

interface FItem {
  base: string;
  kind: string;
  zh: string;
  options: string[];
  answer: number;
  why: string;
}

/** Word form battle: past tense / plurals / comparatives / third person -s. */
const ITEMS: FItem[] = [
  { base: "go", kind: "过去式", zh: "我们昨天去了公园。", options: ["goed", "went", "gone", "going"], answer: 1, why: "go 的过去式是不规则变化 went。" },
  { base: "child", kind: "复数", zh: "操场上有许多孩子。", options: ["childs", "children", "childrens", "childes"], answer: 1, why: "child 的复数是不规则变化 children。" },
  { base: "good", kind: "比较级", zh: "这本新书比旧书更好。", options: ["gooder", "better", "bester", "more good"], answer: 1, why: "good 的比较级是 better，最高级是 best。" },
  { base: "study", kind: "三单", zh: "我妹妹每天晚上学习。", options: ["studys", "studies", "studyies", "study"], answer: 1, why: "辅音+y 结尾，变 y 为 i 加 -es。" },
  { base: "big", kind: "比较级", zh: "这棵树比那棵大。", options: ["biger", "bigger", "more big", "biggest"], answer: 1, why: "重读闭音节双写末尾字母加 -er。" },
  { base: "run", kind: "过去式", zh: "他跑得很快。", options: ["runned", "ran", "run", "runs"], answer: 1, why: "run 的过去式是不规则变化 ran。" },
  { base: "box", kind: "复数", zh: "桌上有很多盒子。", options: ["boxs", "boxes", "boxies", "box"], answer: 1, why: "以 x 结尾加 -es。" },
  { base: "have", kind: "三单", zh: "她有一个蓝色书包。", options: ["haves", "has", "havies", "have"], answer: 1, why: "have 的第三人称单数是 has。" },
  { base: "eat", kind: "过去式", zh: "我们昨晚吃了披萨。", options: ["eated", "ate", "eat", "eats"], answer: 1, why: "eat 的过去式是不规则变化 ate。" },
  { base: "busy", kind: "比较级", zh: "市中心比郊区更繁忙。", options: ["busyer", "busier", "more busier", "busiest"], answer: 1, why: "辅音+y 结尾，变 y 为 i 加 -er。" },
];

/** Word form battle: common grammar changes tested in KET/PET. */
export function WordForms({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
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
          <p className="eyebrow">擂台完成</p>
          <h1 className="display">
            {correct} <small>/ {ITEMS.length}</small>
          </h1>
          <p className="lede">{correct === ITEMS.length ? "全对，变形规则很扎实。" : correct >= ITEMS.length / 2 ? "记住大半，不规则动词表再过一遍。" : "多练不规则变化，写作里很常用。"}</p>
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
          <span className="dialogue-level">单词变形 · {cur.kind}</span>
          <div className="wordform-root">
            原形 <b lang="en">{cur.base}</b> → {cur.kind}
          </div>
          <p className="muted">{cur.zh}</p>
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
                  <Check size={17} /> 变对了！
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
        <p className="muted typing-help">第 {i + 1}/{ITEMS.length} 题 · 不规则变化 + 规则变化。</p>
      </section>
    </div>
  );
}
