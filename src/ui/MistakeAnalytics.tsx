import { useMemo } from "react";
import { useAtlas } from "../atlas/context";
import type { Progress } from "../store/store";

/** 错题分析 · 按级别/话题分布 */
export function MistakeAnalytics({ progress }: { progress: Progress }) {
  const atlas = useAtlas();

  const stats = useMemo(() => {
    const mistakes = progress.mistakes;
    if (!mistakes.length) return null;

    // 按级别统计
    const byLevel: Record<string, number> = {};
    // 按话题统计
    const byTopic: Record<string, number> = {};

    for (const id of mistakes) {
      const w = atlas.byId.get(id);
      if (!w) continue;
      const lv = atlas.cefr[w.cefr] ?? "?";
      byLevel[lv] = (byLevel[lv] ?? 0) + 1;
      const topic = atlas.topics[w.topic]?.[1] ?? "其他";
      byTopic[topic] = (byTopic[topic] ?? 0) + 1;
    }

    const levelArr = Object.entries(byLevel).sort((a, b) => b[1] - a[1]);
    const topicArr = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxLevel = levelArr.length ? levelArr[0][1] : 1;
    const maxTopic = topicArr.length ? topicArr[0][1] : 1;

    return { total: mistakes.length, levelArr, topicArr, maxLevel, maxTopic };
  }, [progress.mistakes, atlas]);

  if (!stats) {
    return <p className="muted">还没有错题记录。做题时答错会自动收录到这里。</p>;
  }

  return (
    <div className="mistake-analytics">
      <p className="muted" style={{ marginBottom: 12 }}>
        共 <b>{stats.total}</b> 个错题 · 按分布找薄弱点
      </p>
      <div className="analytics-section">
        <h4 className="analytics-title">按级别分布</h4>
        {stats.levelArr.map(([lv, count]) => (
          <div key={lv} className="analytics-row">
            <span className="analytics-label">{lv}</span>
            <div className="analytics-bar">
              <div className="analytics-bar-fill" style={{ width: `${(count / stats.maxLevel) * 100}%` }} />
            </div>
            <span className="analytics-count">{count}</span>
          </div>
        ))}
      </div>
      <div className="analytics-section">
        <h4 className="analytics-title">最薄弱话题 TOP 6</h4>
        {stats.topicArr.map(([topic, count]) => (
          <div key={topic} className="analytics-row">
            <span className="analytics-label">{topic}</span>
            <div className="analytics-bar">
              <div className="analytics-bar-fill is-warm" style={{ width: `${(count / stats.maxTopic) * 100}%` }} />
            </div>
            <span className="analytics-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
