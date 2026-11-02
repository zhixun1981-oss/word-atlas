import { AlarmClock, Check, ClipboardList } from "lucide-react";
import { useState } from "react";

const CHECKLIST = [
  "准考证与身份证 / 护照（按考点要求）",
  "黑色水笔、2B 铅笔与橡皮",
  "提前查好路线，按建议时间到场",
  "听力用耳机设备检查（如考点要求自带）",
  "前一晚早睡，早餐吃饱",
];

const KEY = "word-atlas:exam-checklist";

/** 考前 24h Checklist：临近考试时在今日页出现，勾选后本地保存。 */
export function ExamChecklist({ days }: { days: number | null }) {
  const [done, setDone] = useState<Set<number>>(() => new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as number[]));
  if (days === null || days < 0 || days > 7) return null;
  const toggle = (idx: number) => {
    const next = new Set(done);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setDone(next);
    localStorage.setItem(KEY, JSON.stringify([...next]));
  };

  const urgent = days <= 1;
  return (
    <section className="panel checklist-panel">
      <h3 className="eyebrow">{urgent ? "明天就考试！" : `距考试还有 ${days} 天`}</h3>
      <div className="checklist-head">
        <ClipboardList size={18} />
        <b>考前 24h 清单</b>
        {urgent && <span className="checklist-urgent">务必逐项确认</span>}
      </div>
      <ul className="checklist">
        {CHECKLIST.map((item, idx) => (
          <li key={item} className={done.has(idx) ? "is-done" : ""}>
            <button className="checklist-toggle" onClick={() => toggle(idx)} aria-label={done.has(idx) ? "取消勾选" : "勾选"}>
              {done.has(idx) ? <Check size={15} /> : null}
            </button>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        <AlarmClock size={13} /> 建议提前一天全部确认，考试当天只专注答题。
      </p>
    </section>
  );
}
