import { Check, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";
import { clean } from "../lib/typing";

interface PItem {
  id: string;
  zh: string;
  prompts: string[];
  sample: string;
  sampleZh: string;
}

/** KET Writing Part 7: look at the picture and write two sentences. */
const ITEMS: PItem[] = [
  { id: "park", zh: "公园", prompts: ["谁", "在哪里", "做什么"], sample: "We shared a picnic under the trees in the park.", sampleZh: "我们在公园的树下野餐。" },
  { id: "restaurant", zh: "餐厅", prompts: ["地点", "人物", "食物/事情"], sample: "We found a quiet restaurant beside the river.", sampleZh: "我们在河边找到一家安静的餐厅。" },
  { id: "station", zh: "车站", prompts: ["人物", "行李", "动作"], sample: "We hurried to the station with our heavy suitcases.", sampleZh: "我们拖着沉重的行李箱匆匆赶往车站。" },
  { id: "library", zh: "图书馆", prompts: ["地点", "人物", "做什么"], sample: "I borrowed three books from the library after school.", sampleZh: "放学后我从图书馆借了三本书。" },
  { id: "mountain", zh: "山", prompts: ["天气", "景物", "季节"], sample: "Snow covered the mountain even in the middle of summer.", sampleZh: "即使在盛夏，雪也覆盖着那座山。" },
  { id: "birthday", zh: "生日", prompts: ["谁", "做了什么", "在哪里"], sample: "My sister baked a lemon cake for my birthday.", sampleZh: "我姐姐为我的生日烤了一个柠檬蛋糕。" },
];

const ART = (id: string) => `${import.meta.env.BASE_URL}atlas/img/${id}.webp`;

export function PictureWrite({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cur = ITEMS[i];

  const check = () => {
    const v = value.trim();
    if (!v) return;
    const k = clean(cur.sample).toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3);
    const hits = k.filter((w) => clean(v).toLowerCase().includes(w)).length;
    const pass = hits / k.length >= 0.5;
    setRevealed(pass);
    setCorrect((c) => c + (pass ? 1 : 0));
    if (i + 1 >= ITEMS.length) window.setTimeout(() => setDone(true), 700);
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
          <p className="eyebrow">写话完成</p>
          <h1 className="display">
            {correct} <small>/ {ITEMS.length}</small>
          </h1>
          <p className="lede">{correct === ITEMS.length ? "全对，看图写话很有感觉。" : correct >= ITEMS.length / 2 ? "记住大半，写句注意谁+在哪+做什么。" : "多看看参考答案的句式。"}</p>
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
          写对 <b>{correct}</b> / {ITEMS.length}
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        <div className="picture-card">
          <img src={ART(cur.id)} alt={cur.zh} />
          <div className="picture-card-meta">
            <span className="dialogue-level">KET Writing Part 7 · 看图写话</span>
            <p className="muted">
              图：{cur.zh} · 提示：{cur.prompts.join(" / ")}
            </p>
          </div>
        </div>
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
          autoCapitalize="on"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="看图写两句"
          disabled={revealed !== null}
          placeholder="写 1–2 句英文，回车核对"
        />
        {revealed !== null && (
          <div className={`exam-feedback ${revealed ? "is-ok" : ""}`}>
            {revealed ? (
              <p>
                <Check size={17} /> 写得很接近！
              </p>
            ) : (
              <p>
                <X size={17} /> 参考句：<b lang="en">{cur.sample}</b>
              </p>
            )}
            <p className="dictation-zh">{cur.sampleZh}</p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一题</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{ITEMS.length} 题 · 关键词覆盖一半以上即算对。</p>
      </section>
    </div>
  );
}
