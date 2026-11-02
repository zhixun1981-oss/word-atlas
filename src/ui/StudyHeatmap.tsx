import { useMemo } from "react";
import { dayKey, type Progress } from "../store/store";

/** 最近 N 天学习时长柱状图 */
export function StudyHeatmap({ progress, days = 30 }: { progress: Progress; days?: number }) {
  const data = useMemo(() => {
    const result: { label: string; minutes: number; isToday: boolean }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const t = progress.days[k]?.t ?? 0;
      result.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        minutes: Math.round(t / 60),
        isToday: i === 0,
      });
    }
    return result;
  }, [progress.days, days]);

  const max = Math.max(1, ...data.map((d) => d.minutes));
  const total = data.reduce((a, b) => a + b.minutes, 0);
  const avg = Math.round(total / days);

  return (
    <div className="study-heatmap">
      <div className="study-heatmap-header">
        <div>
          <b>学习时长</b>
          <span className="muted">最近 {days} 天</span>
        </div>
        <div className="study-heatmap-total">
          <b>{total}</b> 分钟
          <span className="muted">日均 {avg}</span>
        </div>
      </div>
      <div className="study-heatmap-bars">
        {data.map((d, i) => (
          <div key={i} className={`study-bar ${d.isToday ? "is-today" : ""}`} title={`${d.label}: ${d.minutes} 分钟`}>
            <div
              className="study-bar-fill"
              style={{ height: `${(d.minutes / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
