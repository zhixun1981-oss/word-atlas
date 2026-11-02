import { useMemo } from "react";
import { Flame, Target, Trophy, CheckCircle, BookOpen } from "lucide-react";
import { dayKey, type Progress } from "../store/store";

/** 学习成就榜 · 本地个人最佳 */
export function AchievementBoard({ progress }: { progress: Progress }) {
  const stats = useMemo(() => {
    // 连续学习天数
    let streak = 0;
    const d = new Date();
    const k = (x: Date) => dayKey(x);
    if (!(progress.days[k(d)]?.r > 0)) d.setDate(d.getDate() - 1);
    while (progress.days[k(d)]?.r > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // 总复习数 / 正确数 / 正确率
    const days = Object.values(progress.days);
    const totalReviews = days.reduce((n, x) => n + x.r, 0);
    const totalCorrect = days.reduce((n, x) => n + x.c, 0);
    const accuracy = totalReviews ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // 模考最高分
    const mockScores = progress.exam
      .filter((e) => e.kind === "mock")
      .map((e) => Math.round((e.correct / Math.max(1, e.items)) * 100));
    const mockBest = mockScores.length ? Math.max(...mockScores) : 0;

    // 已学单词数
    const learned = Object.keys(progress.cards).length;

    return { streak, totalReviews, totalCorrect, accuracy, mockBest, learned };
  }, [progress]);

  const items = [
    { icon: <Flame size={18} />, label: "连续学习", value: `${stats.streak} 天`, color: "#E74C3C" },
    { icon: <BookOpen size={18} />, label: "已学单词", value: `${stats.learned} 词`, color: "#3498DB" },
    { icon: <CheckCircle size={18} />, label: "总复习次数", value: stats.totalReviews.toLocaleString(), color: "#2ECC71" },
    { icon: <Target size={18} />, label: "正确率", value: `${stats.accuracy}%`, color: "#F39C12" },
    { icon: <Trophy size={18} />, label: "模考最高分", value: stats.mockBest ? `${stats.mockBest} 分` : "未参加", color: "#9B59B6" },
  ];

  return (
    <div className="achievement-board">
      {items.map((item, i) => (
        <div key={i} className="achievement-item">
          <div className="achievement-icon" style={{ background: item.color }}>
            {item.icon}
          </div>
          <div className="achievement-info">
            <span className="achievement-value">{item.value}</span>
            <span className="achievement-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
