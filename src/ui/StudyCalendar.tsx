import { useMemo } from "react";
import { dayKey, type Progress } from "../store/store";

/** GitHub 风格学习日历热力图 · 最近一年 */
export function StudyCalendar({ progress }: { progress: Progress }) {
  const weeks = useMemo(() => {
    const result: { date: Date; count: number; level: number }[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // 对齐到周日
    start.setDate(start.getDate() - start.getDay());

    const d = new Date(start);
    let week: { date: Date; count: number; level: number }[] = [];

    while (d <= today) {
      const k = dayKey(d);
      const count = progress.days[k]?.r ?? 0;
      const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
      week.push({ date: new Date(d), count, level });
      if (d.getDay() === 6) {
        result.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length) result.push(week);
    return result;
  }, [progress.days]);

  const totalDays = Object.keys(progress.days).length;
  const totalReviews = Object.values(progress.days).reduce((a, b) => a + b.r, 0);

  return (
    <div className="study-calendar">
      <div className="study-calendar-header">
        <b>学习日历</b>
        <span className="muted">{totalDays} 天有记录 · 共 {totalReviews.toLocaleString()} 次复习</span>
      </div>
      <div className="study-calendar-grid">
        {weeks.map((week, i) => (
          <div key={i} className="study-cal-week">
            {week.map((day, j) => (
              <div
                key={j}
                className={`study-cal-cell level-${day.level}`}
                title={`${dayKey(day.date)} · ${day.count} 次复习`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="study-cal-legend">
        <span>少</span>
        <div className="study-cal-cell level-0" />
        <div className="study-cal-cell level-1" />
        <div className="study-cal-cell level-2" />
        <div className="study-cal-cell level-3" />
        <div className="study-cal-cell level-4" />
        <span>多</span>
      </div>
    </div>
  );
}
