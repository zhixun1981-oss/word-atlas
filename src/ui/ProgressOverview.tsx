import { useAtlas } from "../atlas/context";
import { isMastered } from "../store/srs";
import type { Progress } from "../store/store";

/** A1 / A2 / B1 coverage and per-topic mastery bars for the Me page. */
export function ProgressOverview({ progress }: { progress: Progress }) {
  const atlas = useAtlas();

  const levels = atlas.cefr
    .map((lv, li) => {
      const words = atlas.words.filter((w) => w.cefr === li);
      let mastered = 0;
      let learning = 0;
      for (const w of words) {
        const c = progress.cards[w.id];
        if (c && isMastered(c)) mastered += 1;
        else if (c) learning += 1;
      }
      return { lv, total: words.length, mastered, learning, fresh: words.length - mastered - learning };
    })
    .filter((p) => p.total > 0);

  const topics = atlas.topics
    .map(([en, zh], i) => {
      const words = atlas.words.filter((w) => w.topic === i);
      const learned = words.filter((w) => progress.cards[w.id]).length;
      return { en, zh, total: words.length, learned, pct: words.length ? Math.round((learned / words.length) * 100) : 0 };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.learned - a.learned)
    .slice(0, 10);

  return (
    <div className="overview">
      {levels.map((lv) => (
        <div key={lv.lv} className="overview-level">
          <div className="overview-label">
            <b>{lv.lv}</b>
            <span>{lv.total} 词</span>
          </div>
          <div className="overview-bar">
            <i className="is-mastered" style={{ width: `${(lv.mastered / lv.total) * 100}%` }} />
            <i className="is-learning" style={{ width: `${(lv.learning / lv.total) * 100}%` }} />
          </div>
          <div className="overview-legend">
            <span>已掌握 {lv.mastered}</span>
            <span>在学 {lv.learning}</span>
            <span>未学 {lv.fresh}</span>
          </div>
        </div>
      ))}
      <h4>话题掌握（学过 / 总数）</h4>
      <div className="overview-topics">
        {topics.map((t) => (
          <div key={t.en} className="overview-topic" title={`${t.zh} · ${t.pct}%`}>
            <span className="overview-topic-name">
              {t.en}
            </span>
            <div className="overview-topic-bar">
              <i style={{ width: `${t.pct}%` }} />
            </div>
            <b>{t.learned}/{t.total}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
