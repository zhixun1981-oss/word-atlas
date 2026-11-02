import { useMemo } from "react";
import { dayKey, type Progress } from "../store/store";

/** 学习周报 · 最近 7 天汇总 */
export function WeeklyReport({ progress }: { progress: Progress }) {
  const report = useMemo(() => {
    const today = new Date();
    let totalReviews = 0;
    let totalCorrect = 0;
    let totalNew = 0;
    let activeDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const day = progress.days[k];
      if (day) {
        totalReviews += day.r;
        totalCorrect += day.c;
        totalNew += day.n;
        if (day.r > 0) activeDays++;
      }
    }

    const accuracy = totalReviews ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // 连续天数
    let streak = 0;
    const sd = new Date();
    if (!(progress.days[dayKey(sd)]?.r > 0)) sd.setDate(sd.getDate() - 1);
    while (progress.days[dayKey(sd)]?.r > 0) {
      streak++;
      sd.setDate(sd.getDate() - 1);
    }

    return { activeDays, totalReviews, totalCorrect, totalNew, accuracy, streak };
  }, [progress.days]);

  const items = [
    { label: "学习天数", value: `${report.activeDays}/7 天` },
    { label: "复习次数", value: report.totalReviews.toLocaleString() },
    { label: "新学单词", value: report.totalNew.toLocaleString() },
    { label: "正确率", value: `${report.accuracy}%` },
    { label: "连续打卡", value: `${report.streak} 天` },
  ];

  return (
    <div className="weekly-report">
      <div className="weekly-report-header">
        <b>本周学习报告</b>
        <span className="muted">最近 7 天</span>
      </div>
      <div className="weekly-report-grid">
        {items.map((item, i) => (
          <div key={i} className="weekly-report-item">
            <div className="weekly-report-value">{item.value}</div>
            <div className="weekly-report-label">{item.label}</div>
          </div>
        ))}
      </div>
      <p className="weekly-report-tip muted">
        {report.activeDays >= 6 ? "状态满分！继续保持这个节奏。"
          : report.activeDays >= 4 ? "不错，还差 1-2 天就全勤了。"
          : report.activeDays >= 2 ? "刚开始养成习惯，坚持就是胜利。"
          : "本周有点摸鱼哦，明天开始每天学一点吧。"}
      </p>
    </div>
  );
}
