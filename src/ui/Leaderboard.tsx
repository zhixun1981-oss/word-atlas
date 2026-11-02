import { useMemo } from "react";
import { Trophy } from "lucide-react";

/** 排行榜 · 本地模拟好友榜 */
export function Leaderboard({ myWords, myStreak }: { myWords: number; myStreak: number }) {
  const list = useMemo(() => {
    const friends = [
      { name: "小明", words: 3200, streak: 45 },
      { name: "小红", words: 2800, streak: 32 },
      { name: "我", words: myWords, streak: myStreak, isMe: true },
      { name: "阿华", words: 1500, streak: 18 },
      { name: "Lily", words: 800, streak: 7 },
    ];
    return friends.sort((a, b) => b.words - a.words);
  }, [myWords, myStreak]);

  return (
    <div className="leaderboard">
      <div className="leaderboard-head">
        <Trophy size={16} />
        <b>好友排行榜</b>
      </div>
      <div className="leaderboard-list">
        {list.map((f, i) => (
          <div key={f.name} className={`leaderboard-row ${f.isMe ? "is-me" : ""}`}>
            <span className="rank">{i + 1}</span>
            <span className="name">{f.name}</span>
            <span className="words">{f.words.toLocaleString()} 词</span>
            <span className="streak">{f.streak} 天</span>
          </div>
        ))}
      </div>
    </div>
  );
}
