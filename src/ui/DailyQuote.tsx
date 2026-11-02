import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { speak } from "../lib/tts";

const QUOTES = [
  { en: "The best time to plant a tree was 20 years ago. The second best time is now.", zh: "种一棵树最好的时间是二十年前，其次是现在。" },
  { en: "Practice makes perfect.", zh: "熟能生巧。" },
  { en: "Slow is smooth, smooth is fast.", zh: "慢就是快，稳就是快。" },
  { en: "A journey of a thousand miles begins with a single step.", zh: "千里之行，始于足下。" },
  { en: "Don't watch the clock; do what it does. Keep going.", zh: "别盯着时钟看，像它一样不停地走。" },
  { en: "Little by little, one travels far.", zh: "积少成多，行稳致远。" },
  { en: "You don't have to be great to start, but you have to start to be great.", zh: "你不需要很厉害才开始，但你需要开始才会很厉害。" },
  { en: "The expert in anything was once a beginner.", zh: "任何领域的专家，都曾是初学者。" },
  { en: "Repetition is the mother of learning.", zh: "重复是学习之母。" },
  { en: "One day or day one. You decide.", zh: "是「总有一天」还是「就今天」？你说了算。" },
  { en: "Small daily improvements are the key to stunning long-term results.", zh: "每天进步一点点，时间会给你惊喜。" },
  { en: "Fall seven times, stand up eight.", zh: "跌倒七次，第八次站起来。" },
  { en: "Language is the road map of a culture.", zh: "语言是文化的地图。" },
  { en: "To have another language is to possess a second soul.", zh: "掌握另一门语言，就等于拥有第二个灵魂。" },
  { en: "Learning is a treasure that will follow its owner everywhere.", zh: "知识是随身带的财富，走到哪带到哪。" },
];

/** 每日一句 · 按日期取当天句子 */
export function DailyQuote() {
  const quote = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <div className="daily-quote" onClick={() => speak(quote.en)}>
      <div className="daily-quote-icon">
        <Sparkles size={16} />
      </div>
      <div className="daily-quote-text">
        <p className="daily-quote-en" lang="en">{quote.en}</p>
        <p className="daily-quote-zh">{quote.zh}</p>
      </div>
    </div>
  );
}
