import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "../atlas/context";
import { store } from "../store/store";

// 从零到 7.5 的阶梯。描述都压到 5 个字以内——一格只有 88px，写长了一句就换行。
// 这只是「文案表」，真正显示哪几档由词库决定：当前语料只覆盖 A1/A2/B1，
// B2 以上的条目会被过滤掉，等哪天词库补上来，这里不用改就会自动出现。
const LEVELS: [string, string, string][] = [
  ["A1", "入门", "从零起步"],
  ["A2", "基础", "日常词不稳"],
  ["B1", "进阶", "目标 5.5–6"],
  ["B2", "中高", "目标 6.5–7"],
  ["C1", "高级", "目标 7.5+"],
];

export function Onboarding() {
  const atlas = useAtlas();
  // 只留词库里真有词的档位。让人选到一个空档，等于选完就把它拉回 A1。
  const available = LEVELS.filter(([code]) => {
    const li = atlas.cefr.indexOf(code);
    return li >= 0 && atlas.words.some((w) => w.cefr === li);
  });
  const [level, setLevel] = useState(() => Math.min(1, Math.max(0, available.length - 1)));
  const [goal, setGoal] = useState(10);
  const finish = () => store.settings({ onboarded: true, startLevel: atlas.cefr.indexOf(available[level][0]), dailyNew: goal });
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="欢迎">
      <div className="onboard-card">
        <img className="onboard-art" src={`${import.meta.env.BASE_URL}brand/hero.webp`} alt="" />
        <div className="onboard-body">
          <p className="eyebrow">欢迎来到拾词</p>
          <h1 className="display">
            {atlas.count.toLocaleString()} 颗星，
            <br />
            等你一颗颗点亮。
          </h1>
          <fieldset>
            <legend>你从哪里出发？</legend>
            <div className="choice-grid">
              {available.map(([code, name, desc], i) => (
                <button key={code} className={`choice ${level === i ? "is-on" : ""}`} onClick={() => setLevel(i)} aria-pressed={level === i}>
                  <span className={`chip chip-level lv-${code}`}>{code}</span>
                  <b>{name}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>每天点亮几颗新星？</legend>
            <div className="segmented segmented-wide">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} className={goal === n ? "is-on" : ""} onClick={() => setGoal(n)} aria-pressed={goal === n}>
                  {n} 颗{n === 10 ? " · 推荐" : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary btn-xl" onClick={finish}>
            出发 <ArrowRight size={20} />
          </button>
          <p className="muted">不用注册。进度只留在这台设备上，随时可以在「我的」里修改。</p>
        </div>
      </div>
    </div>
  );
}
