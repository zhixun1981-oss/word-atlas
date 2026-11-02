import { Target } from "lucide-react";
import type { Progress } from "../store/store";

/** Mock-exam based pass likelihood, mapped to the official score bands (rough guidance). */
export function ExamForecast({ progress }: { progress: Progress }) {
  const mocks = progress.exam.filter((e) => e.kind === "mock").slice(-8);
  if (!mocks.length)
    return (
      <p className="muted">
        还没有模考记录。做一套 KET / PET 限时模考，这里会按正确率估算你的通过把握。
      </p>
    );

  const total = mocks.reduce((s, e) => s + e.items, 0);
  const correct = mocks.reduce((s, e) => s + e.correct, 0);
  const acc = total ? correct / total : 0;
  const verdict =
    acc >= 0.75
      ? { text: "通过把握较高", cls: "is-strong", note: "正确率在 75% 以上，按剑桥分数段大致落在 Pass 线以上。保持节奏，冲更高分。" }
      : acc >= 0.6
        ? { text: "有希望通过", cls: "is-mid", note: "正确率 60–75%，离通过线不远。重点补薄弱词和易混词。" }
        : { text: "需要加强", cls: "is-weak", note: "正确率不足 60%。建议先用「摸底测试」定位级别，再回到词库系统学一遍。" };

  const latest = mocks[mocks.length - 1];

  return (
    <div className="forecast-card">
      <div className={`forecast-gauge ${verdict.cls}`}>
        <b>{Math.round(acc * 100)}%</b>
        <span>平均正确率</span>
      </div>
      <p className="forecast-verdict">
        <Target size={15} /> 最近模考：{verdict.text}
      </p>
      <p className="muted">{verdict.note}</p>
      <ul className="forecast-history">
        {[...mocks].reverse().map((e, i) => (
          <li key={`${e.at}-${i}`}>
            <span>{new Date(e.at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
            <span>
              {e.correct}/{e.items} 题
            </span>
            <b>{Math.round((e.correct / e.items) * 100)}%</b>
          </li>
        ))}
      </ul>
      <p className="muted">最近一次：{new Date(latest.at).toLocaleDateString("zh-CN")}。</p>
      <p className="muted">估算仅供参考：剑桥分数按分项加权换算，正确率不直接等于分数。</p>
    </div>
  );
}
