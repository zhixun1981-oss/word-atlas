import { CalendarDays, Flame, Target, Timer } from "lucide-react";
import { useAtlas } from "../atlas/context";
import type { Progress, Settings } from "../store/store";

interface Stats {
  learned: number;
  mastered: number;
  accuracy: number;
  minutes: number;
}

/** 成绩单分享卡：把学习数据合成一张可截图分享的成绩卡。 */
export function ReportCard({ progress, stats, settings }: { progress: Progress; stats: Stats; settings: Settings }) {
  const atlas = useAtlas();
  const ratio = atlas.count ? Math.min(100, Math.round((stats.learned / atlas.count) * 100)) : 0;
  const daysLeft = settings.examDate ? Math.max(0, Math.ceil((new Date(settings.examDate).getTime() - Date.now()) / 86400000)) : null;

  return (
    <section className="report-card" aria-label="成绩单分享卡">
      <div className="report-card-head">
        <img src={`${import.meta.env.BASE_URL}atlas/img/star.webp`} alt="" loading="lazy" />
        <div>
          <p className="eyebrow">拾词成绩单 · Report Card</p>
          <h3>本周学习小结</h3>
        </div>
      </div>
      <div className="report-card-metrics">
        <div>
          <Flame size={16} />
          <b>{progress.days ? Object.keys(progress.days).length : 0}</b>
          <small>连续天数</small>
        </div>
        <div>
          <Target size={16} />
          <b>{stats.learned.toLocaleString()}</b>
          <small>已点亮词</small>
        </div>
        <div>
          <Timer size={16} />
          <b>{stats.minutes}</b>
          <small>分钟</small>
        </div>
        <div>
          <CalendarDays size={16} />
          <b>{ratio}%</b>
          <small>词库进度</small>
        </div>
      </div>
      <div className="report-card-acc">
        <span>首次正确率</span>
        <div className="report-card-bar">
          <i style={{ width: `${stats.accuracy}%` }} />
        </div>
        <b>{stats.accuracy}%</b>
      </div>
      <p className="report-card-foot">
        {daysLeft !== null && daysLeft > 0 ? `距 ${settings.examLevel} 考试还有 ${daysLeft} 天 · ` : ""}
        一词一画，点亮剑桥
      </p>
    </section>
  );
}
