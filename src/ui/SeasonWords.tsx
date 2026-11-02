import { useMemo } from "react";
import { CloudSun } from "lucide-react";

const SEASON_WORDS: Record<string, { season: string; words: string[]; emoji: string }> = {
  spring: { season: "春天", words: ["flower", "tree", "warm", "rain", "green", "bird", "park", "picnic"], emoji: "🌸" },
  summer: { season: "夏天", words: ["hot", "sun", "swim", "ice cream", "beach", "vacation", "cold drink", "fan"], emoji: "☀️" },
  autumn: { season: "秋天", words: ["cool", "leaf", "wind", "orange", "harvest", "moon", "festival", "coat"], emoji: "🍂" },
  winter: { season: "冬天", words: ["cold", "snow", "coat", "hot drink", "fire", "Christmas", "warm", "ice"], emoji: "❄️" },
};

/** 季节推荐词汇 · 根据当前月份自动匹配 */
export function SeasonWords() {
  const season = useMemo(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return SEASON_WORDS.spring;
    if (month >= 6 && month <= 8) return SEASON_WORDS.summer;
    if (month >= 9 && month <= 11) return SEASON_WORDS.autumn;
    return SEASON_WORDS.winter;
  }, []);

  return (
    <div className="season-words">
      <div className="season-words-head">
        <CloudSun size={16} />
        <b>{season.emoji} {season.season}词汇推荐</b>
      </div>
      <div className="season-words-list">
        {season.words.map((w) => (
          <span key={w} className="season-tag">{w}</span>
        ))}
      </div>
    </div>
  );
}
