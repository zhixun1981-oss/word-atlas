import { isMastered, type CardState } from "../store/srs";

export interface BadgeStats {
  learned: number;
  mastered: number;
  streak: number;
  examRounds: number;
  mockBest: number;
  typingRounds: number;
  accuracy: number;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** 稀有徽章：更难获取，在收集册中高亮展示。 */
  rare?: boolean;
  check: (s: BadgeStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first-light", name: "初露锋芒", desc: "点亮第一个词", icon: "star", check: (s) => s.learned >= 1 },
  { id: "star-50", name: "星路起航", desc: "累计点亮 50 个词", icon: "sparkles", check: (s) => s.learned >= 50 },
  { id: "star-100", name: "百词斩将", desc: "累计点亮 100 个词", icon: "award", check: (s) => s.learned >= 100 },
  { id: "star-500", name: "五百星主", desc: "累计点亮 500 个词", icon: "medal", check: (s) => s.learned >= 500 },
  { id: "star-1000", name: "千词领主", desc: "累计点亮 1,000 个词", icon: "crown", rare: true, check: (s) => s.learned >= 1000 },
  { id: "star-2000", name: "词汇大师", desc: "累计点亮 2,000 个词", icon: "gem", rare: true, check: (s) => s.learned >= 2000 },
  { id: "mastered-100", name: "小有所成", desc: "掌握 100 个词（完全记住）", icon: "check-circle", check: (s) => s.mastered >= 100 },
  { id: "mastered-500", name: "胸有成竹", desc: "掌握 500 个词", icon: "book-open", rare: true, check: (s) => s.mastered >= 500 },
  { id: "streak-3", name: "三日之约", desc: "连续学习 3 天", icon: "calendar-days", check: (s) => s.streak >= 3 },
  { id: "streak-7", name: "一周不辍", desc: "连续学习 7 天", icon: "calendar-check", check: (s) => s.streak >= 7 },
  { id: "streak-30", name: "月满星河", desc: "连续学习 30 天", icon: "moon", rare: true, check: (s) => s.streak >= 30 },
  { id: "streak-100", name: "百日筑基", desc: "连续学习 100 天", icon: "flame", rare: true, check: (s) => s.streak >= 100 },
  { id: "exam-first", name: "首战告捷", desc: "完成第一套模考或真题轮", icon: "target", check: (s) => s.examRounds >= 1 },
  { id: "exam-80", name: "模考高手", desc: "限时模考拿到 80 分以上", icon: "trophy", rare: true, check: (s) => s.mockBest >= 80 },
  { id: "exam-100", name: "满分神话", desc: "限时模考拿到满分", icon: "award", rare: true, check: (s) => s.mockBest >= 100 },
  { id: "typing-10", name: "指尖生花", desc: "完成 10 轮打字练习", icon: "keyboard", check: (s) => s.typingRounds >= 10 },
  { id: "typing-50", name: "键盘侠", desc: "完成 50 轮打字练习", icon: "zap", rare: true, check: (s) => s.typingRounds >= 50 },
  { id: "accuracy-90", name: "精准射手", desc: "首次正确率达到 90%", icon: "crosshair", rare: true, check: (s) => s.accuracy >= 90 },
  { id: "accuracy-95", name: "满分机器", desc: "正确率达到 95%", icon: "bullseye", rare: true, check: (s) => s.accuracy >= 95 },
];

export function badgeStats(p: { cards: Record<string, CardState>; days: Record<string, { r: number; c: number }>; exam: { kind: string; items: number; correct: number }[]; typing: unknown[] }): BadgeStats {
  const cards = Object.values(p.cards);
  let streak = 0;
  const d = new Date();
  const k = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (!(p.days[k(d)]?.r > 0)) d.setDate(d.getDate() - 1);
  while (p.days[k(d)]?.r > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  const days = Object.values(p.days);
  const r = days.reduce((n, x) => n + x.r, 0);
  const c = days.reduce((n, x) => n + x.c, 0);
  const mockBest = Math.max(0, ...p.exam.filter((e) => e.kind === "mock").map((e) => Math.round((e.correct / Math.max(1, e.items)) * 100)));
  return {
    learned: cards.length,
    mastered: cards.filter(isMastered).length,
    streak,
    examRounds: p.exam.length,
    mockBest,
    typingRounds: p.typing.length,
    accuracy: r ? Math.round((c / r) * 100) : 0,
  };
}
