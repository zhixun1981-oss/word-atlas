import { useMemo } from "react";
import { Sparkles } from "lucide-react";

const FORTUNES = [
  { level: "大吉", text: "今天记忆力超群，适合背长难词和语法点。", color: "#E74C3C" },
  { level: "中吉", text: "状态平稳，按计划复习就好，别贪多。", color: "#F39C12" },
  { level: "小吉", text: "听力运势不错，适合多磨耳朵。", color: "#2ECC71" },
  { level: "平", text: "今天容易忘词，多复习少学新的。", color: "#95A5A6" },
  { level: "末吉", text: "写作手感好，适合写两篇练练手。", color: "#3498DB" },
];

/** 每日词汇运势 · 按日期+学习量算 */
export function DailyFortune({ learnedToday }: { learnedToday: number }) {
  const fortune = useMemo(() => {
    const now = new Date();
    const dayNum = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    // 学的词越多，运势越好
    const index = (dayNum + learnedToday) % FORTUNES.length;
    return FORTUNES[index];
  }, [learnedToday]);

  return (
    <div className="daily-fortune" style={{ borderLeftColor: fortune.color }}>
      <Sparkles size={16} style={{ color: fortune.color }} />
      <div>
        <b style={{ color: fortune.color }}>今日运势 · {fortune.level}</b>
        <p className="muted">{fortune.text}</p>
      </div>
    </div>
  );
}
