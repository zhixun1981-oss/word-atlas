import { Award, BookOpen, CalendarCheck, CalendarDays, Check, Crown, Crosshair, Keyboard, Medal, Moon, Sparkles, Star, Target, Trophy, Download, RotateCcw, Upload, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { resolveLevel, usedLevels } from "../atlas/levels";
import { BADGES, badgeStats } from "../lib/badges";
import { englishVoices, pickVoice, speak } from "../lib/tts";
import { isMastered } from "../store/srs";
import { dayKey, exportBackup, importBackup, resetProgress, store, useStore, type Settings } from "../store/store";
import { toast } from "../ui/Toast";
import { ExamForecast } from "../ui/ExamForecast";
import { RadarChart } from "../ui/RadarChart";
import { ProgressOverview } from "../ui/ProgressOverview";
import { StudyHeatmap } from "../ui/StudyHeatmap";
import { AchievementBoard } from "../ui/AchievementBoard";
import { StudyCalendar } from "../ui/StudyCalendar";
import { MistakeAnalytics } from "../ui/MistakeAnalytics";
import { StarredPanel } from "../ui/StarredPanel";
import { ReportCard } from "../ui/ReportCard";
import { getNextExamDate, getExamNote } from "../lib/examDates";
import { streakOf } from "./Today";

const BADGE_ICONS: Record<string, typeof Star> = {
  star: Star,
  sparkles: Sparkles,
  award: Award,
  medal: Medal,
  crown: Crown,
  "calendar-days": CalendarDays,
  "calendar-check": CalendarCheck,
  moon: Moon,
  target: Target,
  trophy: Trophy,
  keyboard: Keyboard,
  crosshair: Crosshair,
};

export function Me({ privateAvailable }: { privateAvailable: boolean }) {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const saveError = useStore((s) => s.saveError);
  const file = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const cards = Object.values(progress.cards);
    const days = Object.values(progress.days);
    const r = days.reduce((n, d) => n + d.r, 0);
    const c = days.reduce((n, d) => n + d.c, 0);
    const t = days.reduce((n, d) => n + d.t, 0);
    const now = Date.now();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() + i);
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      return cards.filter((x) => (i === 0 ? x.due <= end.getTime() : x.due >= start.getTime() && x.due <= end.getTime())).length;
    });
    void now;
    return { learned: cards.length, mastered: cards.filter(isMastered).length, reviews: r, accuracy: r ? Math.round((c / r) * 100) : 0, minutes: Math.round(t / 60), forecast };
  }, [progress]);

  // Auto-unlock badges when their condition is met.
  const badgeSet = useMemo(() => new Set(progress.badges), [progress.badges]);
  const earned = useMemo(() => badgeStats(progress), [progress]);
  useEffect(() => {
    const fresh = BADGES.filter((b) => !badgeSet.has(b.id) && b.check(earned)).map((b) => b.id);
    if (!fresh.length) return;
    store.progress((p) => ({ ...p, badges: [...new Set([...p.badges, ...fresh])] }));
  }, [badgeSet, earned]);

  const set = (patch: Partial<Settings>) => store.settings(patch);
  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const restore = async (f: File) => {
    if (f.size > 30 * 1024 * 1024) return toast("文件太大，不像是学习备份。", "warn");
    const r = importBackup(await f.text());
    toast(r.ok ? `已恢复 ${r.cards} 个词的记忆` : r.error, r.ok ? "ok" : "warn");
  };
  const maxF = Math.max(1, ...stats.forecast);

  // 五维能力雷达图：词汇与阅读取自有记录的练习成绩；听力/口语/写作练习完成后自动点亮。
  const radar = useMemo(() => {
    const exam = progress.exam || [];
    const avg = (kinds: string[]) => {
      const xs = exam.filter((e) => kinds.includes(e.kind) && e.items > 0);
      if (!xs.length) return null;
      const c = xs.reduce((n, e) => n + e.correct, 0);
      const i = xs.reduce((n, e) => n + e.items, 0);
      return i ? Math.round((c / i) * 100) : null;
    };
    const scoreAvg = (kinds: string[]) => {
      const xs = exam.filter((e) => kinds.includes(e.kind) && e.score != null);
      if (!xs.length) return null;
      return Math.round(xs.reduce((n, e) => n + (e.score ?? 0), 0) / xs.length);
    };
    const vocab = stats.accuracy || 0;
    const reading = avg(["cloze", "definition", "picture"]);
    const listening = avg(["listening"]);
    const speaking = scoreAvg(["speaking"]);
    const writing = scoreAvg(["writing"]);
    return [
      { label: "词汇", value: vocab, available: vocab > 0 },
      { label: "听力", value: listening ?? 0, available: listening != null },
      { label: "口语", value: speaking ?? 0, available: speaking != null },
      { label: "阅读", value: reading ?? 0, available: reading != null },
      { label: "写作", value: writing ?? 0, available: writing != null },
    ];
  }, [progress, stats]);

  return (
    <div className="page me">
      <header className="page-head">
        <p className="eyebrow">我的</p>
        <h1 className="display">你的星空</h1>
      </header>

      <section className="me-banner">
        <img className="me-banner-art" src={`${import.meta.env.BASE_URL}atlas/img/star.webp`} alt="" loading="lazy" />
        <div className="me-banner-copy">
          <p className="eyebrow">拾词 · My Space</p>
          <h2>每一颗星，都是记住的词。</h2>
          <div className="me-progress">
            <i style={{ width: `${atlas.count ? (stats.learned / atlas.count) * 100 : 0}%` }} />
          </div>
          <p className="muted">
            已点亮 <b>{stats.learned.toLocaleString()}</b> / {atlas.count.toLocaleString()} 词
            · 长期记住 {stats.mastered.toLocaleString()}
          </p>
        </div>
      </section>

      <section className="panel">
        <h3 className="eyebrow">成绩单分享卡</h3>
        <p className="muted">本周学习小结一键生成，可截图分享给家长或同学。</p>
        <ReportCard progress={progress} stats={stats} settings={settings} />
      </section>

      <section className="stat-strip">
        <div>
          <img className="stat-art" src={`${import.meta.env.BASE_URL}atlas/img/calendar.webp`} alt="" loading="lazy" />
          <dt>连续学习</dt>
          <dd>
            {streakOf(progress.days)}
            <small>天</small>
          </dd>
        </div>
        <div>
          <img className="stat-art" src={`${import.meta.env.BASE_URL}atlas/img/book.webp`} alt="" loading="lazy" />
          <dt>已点亮</dt>
          <dd>{stats.learned.toLocaleString()}</dd>
        </div>
        <div>
          <img className="stat-art" src={`${import.meta.env.BASE_URL}atlas/img/star.webp`} alt="" loading="lazy" />
          <dt>长期记住</dt>
          <dd>{stats.mastered.toLocaleString()}</dd>
        </div>
        <div>
          <img className="stat-art" src={`${import.meta.env.BASE_URL}atlas/img/target.webp`} alt="" loading="lazy" />
          <dt>首次正确率</dt>
          <dd>
            {stats.accuracy}
            <small>%</small>
          </dd>
        </div>
        <div>
          <img className="stat-art" src={`${import.meta.env.BASE_URL}atlas/img/clock.webp`} alt="" loading="lazy" />
          <dt>学习时长</dt>
          <dd>
            {stats.minutes}
            <small>分钟</small>
          </dd>
        </div>
      </section>

      <div className="me-grid">
        <section className="panel">
          <h3 className="eyebrow">备考目标</h3>
          <div className="field">
            <div>
              <b>要考的考试</b>
              <small>设置后今日页会显示倒计时和每日新词建议。</small>
            </div>
            <div className="segmented segmented-wide">
              {(
                [
                  ["", "不备考"],
                  ["KET", "KET"],
                  ["PET", "PET"],
                  ["FCE", "FCE"],
                  ["IELTS", "雅思"],
                  ["TOEFL", "托福"],
                  ["CET4", "四级"],
                  ["CET6", "六级"],
                  ["KAOYAN", "考研"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  className={settings.examLevel === k ? "is-on" : ""}
                  onClick={() => {
                    if (k) {
                      const next = getNextExamDate(k as any);
                      set({ examLevel: k, examDate: next?.date });
                    } else {
                      set({ examLevel: "", examDate: undefined });
                    }
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {settings.examLevel && (
              <p className="exam-date-hint">
                💡 最近一场：{settings.examDate}（{getExamNote(settings.examLevel)}）
              </p>
            )}
          </div>
          <div className="field">
            <div>
              <b>考点城市</b>
              <small>选择你考试的城市。</small>
            </div>
            <select
              className="city-select"
              value={settings.examCity ?? ""}
              onChange={(e) => set({ examCity: e.target.value || undefined })}
            >
              <option value="">请选择城市</option>
              {["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "西安", "重庆"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <div>
              <b>考试日期</b>
              <small>已自动填入最近考期，可手动修改。</small>
            </div>
            <input
              className="date-input"
              type="date"
              min={dayKey()}
              value={settings.examDate ?? ""}
              onChange={(e) => set({ examDate: e.target.value || undefined })}
            />
          </div>
          <ExamGoalSummary level={settings.examLevel === "KET" || settings.examLevel === "PET" ? settings.examLevel : ""} date={settings.examDate} learned={stats.learned} total={atlas.count} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">模拟预测</h3>
          <ExamForecast progress={progress} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">词汇进度总览</h3>
          <ProgressOverview progress={progress} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">学习时长</h3>
          <StudyHeatmap progress={progress} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">学习日历</h3>
          <StudyCalendar progress={progress} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">个人成就榜</h3>
          <AchievementBoard progress={progress} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">错题分析</h3>
          <MistakeAnalytics progress={progress} />
        </section>

        <StarredPanel />

        <section className="panel guide-entry">
          <h3 className="eyebrow">考试百科</h3>
          <p className="muted">KET / PET 试卷结构、评分标准与备考节奏，一页讲清。</p>
          <a className="btn btn-primary" href="#/guide">
            <BookOpen size={17} /> 打开考试百科
          </a>
        </section>

        <WeeklyReport />

        <ActivityHistory days={progress.days} />

        <section className="panel">
          <h3 className="eyebrow">未来 7 天的复习量</h3>
          <ol className="forecast">
            {stats.forecast.map((n, i) => (
              <li key={i}>
                <span style={{ height: `${(n / maxF) * 100}%` }} />
                <b>{n}</b>
                <small>{i === 0 ? "今天" : i === 1 ? "明天" : `+${i}`}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel settings">
          <h3 className="eyebrow">学习设置</h3>
          <Field label="每日新词" hint="复习不设上限，算法只安排快要遗忘的词。">
            <div className="segmented">
              {[5, 10, 15, 20, 30].map((n) => (
                <button key={n} className={settings.dailyNew === n ? "is-on" : ""} onClick={() => set({ dailyNew: n })}>
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="每日打卡目标" hint="今日页进度环的答题目标。选「自动」时按每日新词和复习量智能计算。">
            <div className="segmented">
              {(
                [
                  [0, "自动"],
                  [10, "10"],
                  [20, "20"],
                  [40, "40"],
                  [60, "60"],
                ] as const
              ).map(([n, l]) => (
                <button key={n} className={settings.dailyGoal === n ? "is-on" : ""} onClick={() => set({ dailyGoal: n })}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="从哪个难度开始" hint="跳过已经熟悉的低级别词。">
            <div className="segmented">
              {usedLevels(atlas).map((i) => (
                <button key={atlas.cefr[i]} className={resolveLevel(atlas, settings.startLevel) === i ? "is-on" : ""} onClick={() => set({ startLevel: i })}>
                  {atlas.cefr[i]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="目标记忆率" hint="越高复习越频繁。90% 是大多数人的甜点。">
            <div className="segmented">
              {[0.85, 0.9, 0.95].map((n) => (
                <button key={n} className={settings.retention === n ? "is-on" : ""} onClick={() => set({ retention: n })}>
                  {Math.round(n * 100)}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="发音">
            <div className="segmented">
              <button className={settings.accent === "uk" ? "is-on" : ""} onClick={() => set({ accent: "uk" })}>
                英式
              </button>
              <button className={settings.accent === "us" ? "is-on" : ""} onClick={() => set({ accent: "us" })}>
                美式
              </button>
            </div>
          </Field>
          <Field label="朗读声音" hint="系统里可用的英文语音。挑不准就点「试听」，顺耳的留下——原来的默认可能是机器音。">
            <VoicePicker
              value={settings.voice}
              lang={settings.accent === "uk" ? "en-GB" : "en-US"}
              onChange={(v) => set({ voice: v })}
            />
          </Field>
          <Field label="朗读语速" hint="跟读练习调慢，熟练后调快。">
            <div className="segmented">
              {([
                [0.75, "0.75x 慢速"],
                [0.92, "1.0x 正常"],
                [1.1, "1.25x 快速"],
              ] as const).map(([r, l]) => (
                <button key={r} className={Math.abs(settings.rate - r) < 0.05 ? "is-on" : ""} onClick={() => set({ rate: r })}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="外观">
            <div className="segmented">
              {(
                [
                  ["system", "跟随系统"],
                  ["light", "浅色"],
                  ["dark", "深色"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} className={settings.theme === k ? "is-on" : ""} onClick={() => set({ theme: k })}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Toggle label="自动播放发音" on={settings.autoplay} set={(v) => set({ autoplay: v })} />
          <Toggle label="界面音效" on={settings.sfx} set={(v) => set({ sfx: v })} />
          <Toggle label="开屏动画（每天一次）" on={settings.splash} set={(v) => set({ splash: v })} />
          <Field label="每日单词广播" hint="到设定时间弹出今日磨耳朵卡片，并（授权后）发送系统通知。注意：纯网页版需保持页面打开才能触发。">
            <div className="broadcast-set">
              <Toggle
                label="开启广播"
                on={settings.dailyBroadcast}
                set={(v) => {
                  if (v && typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
                  set({ dailyBroadcast: v });
                }}
              />
              <label className="time-pick">
                <span>时间</span>
                <input
                  type="time"
                  className="time-input"
                  value={settings.broadcastTime}
                  onChange={(e) => set({ broadcastTime: e.target.value })}
                />
              </label>
            </div>
          </Field>
          <Toggle label="复习时加入拼写题" on={settings.spell} set={(v) => set({ spell: v })} />
          {privateAvailable && (
            <Field label="词库" hint="私人词库只在本机开发服务器中可用，不会被打包发布。">
              <div className="segmented">
                <button className={settings.dataset === "open" ? "is-on" : ""} onClick={() => set({ dataset: "open" })}>
                  开放图鉴
                </button>
                <button className={settings.dataset === "private" ? "is-on" : ""} onClick={() => set({ dataset: "private" })}>
                  私人 8000
                </button>
              </div>
            </Field>
          )}
        </section>

        <section className="panel">
          <h3 className="eyebrow">成绩趋势</h3>
          <p className="muted">每轮真题 / 模考 / 听力的得分走势，看自己一点点变强。</p>
          <ScoreTrend exam={progress.exam} />
        </section>

        <section className="panel">
          <h3 className="eyebrow">学习能力雷达图</h3>
          <p className="muted">词汇与阅读取自有记录的练习成绩；听力、口语、写作练习完成后，成绩会自动点亮对应维度。</p>
          <div className="radar-wrap">
            <RadarChart axes={radar} />
          </div>
        </section>

        <section className="panel">
          <h3 className="eyebrow">成就收集册</h3>
          <div className="badge-head-art">
            <p className="muted">学习路上的里程碑。点亮即解锁，达成条件后自动颁发。稀有徽章更难获取，更值得收藏。</p>
            <img src={`${import.meta.env.BASE_URL}atlas/img/medal.webp`} alt="" loading="lazy" />
          </div>
          <div className="badge-progress" aria-hidden="true">
            <i style={{ width: `${BADGES.length ? (badgeSet.size / BADGES.length) * 100 : 0}%` }} />
          </div>
          <p className="muted badge-summary">
            已集齐 <b>{badgeSet.size}</b> / {BADGES.length} 枚 · 其中稀有 <b>{BADGES.filter((b) => b.rare).filter((b) => badgeSet.has(b.id)).length}</b> 枚
          </p>
          <div className="badge-wall">
            {BADGES.map((b) => {
              const on = badgeSet.has(b.id);
              const Icon = BADGE_ICONS[b.icon] ?? Star;
              return (
                <div key={b.id} className={`badge ${on ? "is-on" : ""} ${b.rare ? "is-rare" : ""}`} title={on ? b.desc : `未解锁 · ${b.desc}`}>
                  {b.rare && <span className="badge-rare-tag">稀有</span>}
                  <span className="badge-icon">
                    <Icon size={22} />
                  </span>
                  <b>{b.name}</b>
                  <small>{b.desc}</small>
                  {on ? (
                    <span className="badge-state">
                      <Check size={13} /> 已解锁
                    </span>
                  ) : (
                    <span className="badge-state is-locked">未解锁</span>
                  )}
                </div>
              );
            })}
          </div>
          <AchievementCard
            total={BADGES.length}
            earned={badgeSet.size}
            rares={BADGES.filter((b) => b.rare)}
            got={badgeSet}
            examLevel={settings.examLevel === "KET" || settings.examLevel === "PET" ? settings.examLevel : ""}
          />
        </section>

        <section className="panel">
          <h3 className="eyebrow">数据</h3>
          <p className="muted">进度只存在这台设备的浏览器里：没有账号，没有服务器。换设备时，导出备份再导入即可。</p>
          {saveError && <p className="warn-text">浏览器拒绝保存（可能是隐私模式或空间已满）。请尽快导出备份。</p>}
          <div className="data-actions">
            <button className="btn btn-ghost" onClick={download}>
              <Download size={18} /> 导出备份
            </button>
            <button className="btn btn-ghost" onClick={() => file.current?.click()}>
              <Upload size={18} /> 导入备份
            </button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0]).finally(() => (e.target.value = ""))} />
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                if (confirm("确定清空这个词库的全部学习记录？此操作无法撤销，建议先导出备份。")) {
                  resetProgress();
                  toast("学习记录已清空");
                }
              }}
            >
              <RotateCcw size={18} /> 清空记录
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function VoicePicker({ value, lang, onChange }: { value: string; lang: string; onChange: (v: string) => void }) {
  const [list, setList] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setList(englishVoices(lang));
    load();
    const s = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!s) return;
    s.addEventListener("voiceschanged", load);
    return () => s.removeEventListener("voiceschanged", load);
  }, [lang]);
  const auto = pickVoice(lang);
  const sample = "Hello! This is how I sound when I read the lesson aloud.";
  return (
    <div className="voice-pick">
      <select className="voice-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">自动{auto ? `（${shortVoiceName(auto.name)}）` : ""}</option>
        {list.map((v) => (
          <option key={v.name} value={v.name}>
            {shortVoiceName(v.name)} · {v.lang}
          </option>
        ))}
      </select>
      <button className="btn btn-ghost voice-try" onClick={() => speak(sample, { lang, voice: value })}>
        <Volume2 size={15} /> 试听
      </button>
    </div>
  );
}

/** 「Eddy (英语（美国）)」→「Eddy」。 */
const shortVoiceName = (n: string) => n.replace(/\s*[(（].*$/, "").trim();

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function ExamGoalSummary({ level, date, learned, total }: { level: "" | "KET" | "PET"; date?: string; learned: number; total: number }) {
  if (!level || !date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date + "T00:00:00");
  const left = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (left < 0)
    return (
      <p className="muted exam-goal-note">
        <CalendarDays size={15} /> 考试日期已过。更新日期，或先享受成果。
      </p>
    );
  const remaining = Math.max(0, total - learned);
  const perDay = left === 0 ? remaining : Math.ceil(remaining / left);
  const sprint = left <= 30;
  const plan = [
    { k: "新词", v: `${Math.min(60, perDay)} 个` },
    { k: "薄弱词", v: "复习错词本 10 个" },
    { k: "真题", v: "题型练习 1 轮（10 题）" },
    ...(left % 7 === 0 ? [{ k: "模考", v: "限时模考 1 套" }] : []),
  ] as { k: string; v: string }[];
  return (
    <div className="exam-goal-note">
      <p>
        距 <b>{level === "KET" ? "KET（A2）" : "PET（B1）"}</b> 考试还有 <b>{left}</b> 天
      </p>
      <p>
        还剩 {remaining.toLocaleString()} 个词没学，按现在的节奏，每天建议 <b>{perDay}</b> 个新词。
      </p>
      {sprint && (
        <div className="sprint-plan">
          <p className="sprint-title">最后 {left} 天 · 每日冲刺清单</p>
          <ul>
            {plan.map((p) => (
              <li key={p.k}>
                <b>{p.k}</b>
                <span>{p.v}</span>
              </li>
            ))}
          </ul>
          <p className="muted">每天照这份清单练，考前就能把剩余词和薄弱点全部过一遍。</p>
        </div>
      )}
    </div>
  );
}

function WeeklyReport() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const k = dayKey(d);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const learned = Object.values(progress.cards).filter((c) => c.seen >= start.getTime() && c.seen < end.getTime()).length;
      return { k, label: "日一二三四五六"[d.getDay()], learned, answered: progress.days[k]?.r ?? 0 };
    });
    const max = Math.max(1, ...days.map((d) => Math.max(d.learned, d.answered)));
    return { days, max };
  }, [progress]);
  const topics = useMemo(() => {
    const out = atlas.topics.map(([key, name]) => {
      let total = 0,
        seen = 0,
        mastered = 0;
      for (const w of atlas.words) {
        if (atlas.topics[w.topic]?.[0] !== key) continue;
        total++;
        const c = progress.cards[w.id];
        if (c) {
          seen++;
          if (isMastered(c)) mastered++;
        }
      }
      return { key, name, total, seen, mastered };
    });
    return out.filter((t) => t.total > 0);
  }, [atlas, progress]);
  const totalLearned = Object.keys(progress.cards).length;
  const all = { key: "all", name: "全部", total: atlas.count, seen: totalLearned, mastered: topics.reduce((n, t) => n + t.mastered, 0) };
  const topicRows = [all, ...topics];

  return (
    <section className="panel">
      <h3 className="eyebrow">学习周报 · 近 7 天</h3>
      <div className="week-bars">
        {week.days.map((d) => (
          <div key={d.k} className="week-bar" title={`${d.k}：新学 ${d.learned}，答题 ${d.answered}`}>
            <div className="week-bar-stack">
              <i className="is-new" style={{ height: `${(d.learned / week.max) * 100}%` }} />
              <i className="is-ans" style={{ height: `${(d.answered / week.max) * 100}%` }} />
            </div>
            <b>{d.learned + d.answered}</b>
            <small>{d.label}</small>
          </div>
        ))}
      </div>
      <p className="muted">
        <i className="lg-new" /> 新学 <i className="lg-ans" /> 答题
      </p>
      <h3 className="eyebrow topic-head">话题掌握度</h3>
      <ul className="topic-mastery">
        {topicRows.map((t) => (
          <li key={t.key} title={`${t.name}：${t.seen}/${t.total} 已学，${t.mastered} 掌握`}>
            <span>{t.name}</span>
            <div className="topic-bar">
              <i style={{ width: `${totalLearned ? (t.seen / Math.max(1, t.total)) * 100 : 0}%` }} className="is-seen" />
              <i style={{ width: `${totalLearned ? (t.mastered / Math.max(1, t.total)) * 100 : 0}%` }} className="is-done" />
            </div>
            <small>
              {t.mastered}/{t.total}
            </small>
          </li>
        ))}
      </ul>
      <p className="muted">
        <i className="lg-seen" /> 已学 <i className="lg-done" /> 已掌握
      </p>
    </section>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="field toggle">
      <b>{label}</b>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

function Heatmap({ days }: { days: Record<string, { r: number }> }) {
  const weeks = 20;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
  const cells: { k: string; v: number; future: boolean }[] = [];
  const d = new Date(start);
  for (let i = 0; i < (weeks + 1) * 7; i++) {
    const k = dayKey(d);
    cells.push({ k, v: days[k]?.r ?? 0, future: d > end });
    d.setDate(d.getDate() + 1);
  }
  const lvl = (v: number) => (v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 50 ? 3 : 4);
  return (
    <div className="heatmap" role="img" aria-label="学习热力图">
      {cells.map((c) => (
        <span key={c.k} className={`h${c.future ? "x" : lvl(c.v)}`} title={`${c.k} · ${c.v} 题`} />
      ))}
    </div>
  );
}

/** 学习足迹：热力图（20 周）与月历两个视角，共用一份打卡数据。 */
function ActivityHistory({ days }: { days: Record<string, { r: number }> }) {
  const [view, setView] = useState<"grid" | "month">("grid");
  return (
    <section className="panel">
      <div className="panel-head">
        <h3 className="eyebrow">{view === "grid" ? "过去 20 周" : "学习月历"}</h3>
        <div className="segmented">
          <button className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} aria-pressed={view === "grid"}>
            热力图
          </button>
          <button className={view === "month" ? "is-on" : ""} onClick={() => setView("month")} aria-pressed={view === "month"}>
            月历
          </button>
        </div>
      </div>
      {view === "grid" ? (
        <>
          <Heatmap days={days} />
          <p className="muted">一格是一天，颜色越深，那天答得越多。「长期记住」指记忆稳定度超过 21 天。</p>
        </>
      ) : (
        <MonthCalendar days={days} />
      )}
    </section>
  );
}

/** 日历月视图：一格一天，配色与热力图同档；可翻月。 */
function MonthCalendar({ days }: { days: Record<string, { r: number }> }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const todayKey = dayKey();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startDow = new Date(y, m, 1).getDay();
  const cells: ({ k: string; v: number; d: number; today: boolean } | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  let activeDays = 0;
  let totalR = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dayKey(new Date(y, m, d));
    const v = days[k]?.r ?? 0;
    if (v > 0) {
      activeDays++;
      totalR += v;
    }
    cells.push({ k, v, d, today: k === todayKey });
  }
  const lvl = (v: number) => (v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 50 ? 3 : 4);
  const shift = (n: number) => setCursor(new Date(y, m + n, 1));
  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => shift(-1)} aria-label="上个月">
          ‹
        </button>
        <b className="cal-title">
          {y} 年 {m + 1} 月
        </b>
        <button className="cal-nav" onClick={() => shift(1)} aria-label="下个月">
          ›
        </button>
      </div>
      <div className="cal-grid cal-dow-row" aria-hidden="true">
        {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
          <span key={w} className="cal-dow">
            {w}
          </span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((c, i) =>
          c === null ? (
            <span key={`e${i}`} className="cal-day is-empty" />
          ) : (
            <span key={c.k} className={`cal-day h${lvl(c.v)} ${c.today ? "is-today" : ""}`} title={`${c.k} · ${c.v} 题`}>
              {c.d}
            </span>
          ),
        )}
      </div>
      <p className="muted">
        本月学习 <b>{activeDays}</b> 天 · 答题 <b>{totalR.toLocaleString()}</b> 次
        {activeDays === 0 && " · 还没有记录，做一轮练习就会点亮。"}
      </p>
    </div>
  );
}

/** Line chart of recent exam/mock/listening/speaking/writing scores (0–100). */
function ScoreTrend({ exam }: { exam: { at: number; items: number; correct: number; score?: number }[] }) {
  const points = exam
    .filter((e) => e.items > 0)
    .map((e) => ({ at: e.at, score: e.score != null ? e.score : (e.correct / e.items) * 100 }))
    .sort((a, b) => a.at - b.at)
    .slice(-12);
  if (!points.length)
    return <p className="muted">还没有考试记录。去练习页做一轮真题或模考，成绩会自动画成趋势线。</p>;

  const W = 320;
  const H = 120;
  const PAD = 8;
  const avg = points.reduce((n, p) => n + p.score, 0) / points.length;
  const y = (s: number) => H - PAD - (Math.max(0, Math.min(100, s)) / 100) * (H - PAD * 2);
  const step = (W - PAD * 2) / Math.max(1, points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${PAD + i * step},${y(p.score)}`).join(" ");
  return (
    <>
      <svg className="trend-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="考试成绩趋势折线图">
        <line x1={PAD} x2={W - PAD} y1={y(avg)} y2={y(avg)} stroke="var(--terra)" strokeOpacity="0.35" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const last = i === points.length - 1;
          return (
            <circle key={p.at} cx={PAD + i * step} cy={y(p.score)} r={last ? 4 : 3} fill={last ? "var(--sage)" : "var(--panel)"} stroke="var(--sage)" strokeWidth="2" />
          );
        })}
      </svg>
      <p className="trend-avg">
        平均 <b>{Math.round(avg)}</b> 分 · 最近 {points.length} 轮 · 最后一次 <b>{Math.round(points[points.length - 1].score)}</b> 分
      </p>
    </>
  );
}

function AchievementCard({
  total,
  earned,
  rares,
  got,
  examLevel,
}: {
  total: number;
  earned: number;
  rares: { id: string; name: string; icon: string }[];
  got: Set<string>;
  examLevel: "" | "KET" | "PET";
}) {
  const pct = total ? Math.round((earned / total) * 100) : 0;
  const rareGot = rares.filter((r) => got.has(r.id)).length;
  const note =
    earned >= total
      ? "集齐全部成就，了不起！"
      : earned === 0
        ? "开始学习，点亮第一颗星。"
        : `还差 ${total - earned} 枚就能集齐，继续加油！`;
  return (
    <div className="achv-card">
      <div className="achv-head">
        <b>拾词 · 成就卡</b>
        <span>{examLevel ? `备考 ${examLevel}` : "剑桥 KET/PET"}</span>
      </div>
      <div className="achv-big">
        <span className="achv-num">{earned}</span>
        <span className="achv-of">
          / {total} 枚徽章 · {pct}%
        </span>
      </div>
      <div className="achv-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="achv-rares" title={`稀有徽章 ${rareGot}/${rares.length}`}>
        {rares.map((r) => {
          const on = got.has(r.id);
          const Icon = BADGE_ICONS[r.icon] ?? Star;
          return (
            <div key={r.id} className={`achv-rare ${on ? "is-on" : ""}`} title={r.name}>
              <Icon size={18} />
            </div>
          );
        })}
      </div>
      <p className="achv-note">{note}</p>
    </div>
  );
}
