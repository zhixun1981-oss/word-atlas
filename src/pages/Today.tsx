import { ArrowRight, BookOpen, Check, Flame, Flag, Headphones, Keyboard, Mic, NotebookPen, PenLine, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prefetch, useAtlas, useEntry } from "../atlas/context";
import { resolveLevel } from "../atlas/levels";
import type { Entry } from "../atlas/types";
import { go, openWord } from "../lib/router";
import { cue } from "../lib/sound";
import { hashSeed, shuffle } from "../lib/text";
import { buildSession, forecastDue, masteredCount, todayPlan } from "../store/session";
import { isMastered } from "../store/srs";
import { dailyPlan, dayKey, store, useStore } from "../store/store";
import { ExamChecklist } from "../ui/ExamChecklist";
import { weakWords } from "../lib/weak";
import { generateExam, type ExamQuestion } from "../exam/generate";
import { Galaxy } from "../galaxy/Galaxy";
import { DailyQuote } from "../ui/DailyQuote";
import { DailyReading } from "../ui/DailyReading";
import { DailyFortune } from "../ui/DailyFortune";
import { SeasonWords } from "../ui/SeasonWords";
import { Highlight, Pronounce } from "../ui/EntryView";
import { ExamRound } from "../ui/ExamRound";
import { Illustration } from "../ui/Illustration";
import { Ring } from "../ui/Ring";
import { GrammarClinic } from "../ui/GrammarClinic";
import { OpenClozeRound } from "../ui/OpenClozeRound";
import { GapFillRound } from "../ui/GapFillRound";
import { SpeakingExam } from "../ui/SpeakingExam";
import { WritingRound } from "../ui/WritingRound";

const BRAND = `${import.meta.env.BASE_URL}brand`;

function greeting(h: number) {
  if (h < 5) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function streakOf(days: Record<string, { r: number }>) {
  let n = 0;
  const d = new Date();
  if (!(days[dayKey(d)]?.r > 0)) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]?.r > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function Today() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const plan = useMemo(() => todayPlan(atlas, progress, settings), [atlas, progress, settings]);
  // Warm the first cards of today's journey so the session opens instantly.
  const firstIds = [...plan.due.slice(0, 4), ...plan.fresh.slice(0, 6)].join(",");
  useEffect(() => {
    const ids = firstIds.split(",").filter(Boolean);
    const t = window.setTimeout(() => void prefetch(atlas, ids), 800);
    return () => window.clearTimeout(t);
  }, [atlas, firstIds]);
  const now = new Date();
  const today = progress.days[dayKey()];
  const streak = streakOf(progress.days);
  const active = progress.session && !progress.session.finished ? progress.session : null;
  const total = plan.due.length + plan.fresh.length;
  const goal = settings.dailyGoal > 0 ? settings.dailyGoal : settings.dailyNew + Math.min(plan.due.length, 60);
  const doneToday = today?.r ?? 0;
  const goalHit = goal > 0 && doneToday >= goal;

  const start = (opts?: { reviewOnly?: boolean; extra?: number }) => {
    if (!active) {      const s = buildSession(atlas, progress, opts?.extra ? { ...settings, dailyNew: (today?.n ?? 0) + opts.extra } : settings, { reviewOnly: opts?.reviewOnly });
      if (!s.steps.length) return;
      store.progress((p) => ({ ...p, session: s }));
    }
    if (settings.sfx) void cue("start");
    go({ page: "learn" });
  };

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return { k, label: "日一二三四五六"[d.getDay()], v: progress.days[k]?.r ?? 0, today: i === 6 };
  });

  const learned = Object.keys(progress.cards).length;
  const mastered = masteredCount(progress);
  const teaser = (active ? active.newIds : plan.fresh).slice(0, 5).map((id) => atlas.byId.get(id)!).filter(Boolean);

  // Daily 5-question quiz over today's plan.
  const [quiz, setQuiz] = useState<{ questions: ExamQuestion[]; key: number } | null>(null);
  const startQuiz = async () => {
    const ids = shuffle([...plan.due, ...plan.fresh, ...weakWords(progress, 30).map((w) => w.id)], hashSeed("daily-quiz-" + dayKey())).slice(0, 24);
    const entries = (await prefetch(atlas, ids.filter((id) => atlas.byId.has(id)))).filter((e): e is NonNullable<typeof e> => !!e);
    const kinds = ["definition", "cloze", "definition", "picture", "cloze"] as const;
    const questions: ExamQuestion[] = [];
    for (let i = 0; i < kinds.length && i < entries.length; i++) {
      const q = generateExam(atlas, [entries[i]], kinds[i], 1)[0];
      if (q) questions.push(q);
    }
    if (questions.length) setQuiz({ questions, key: Date.now() });
  };

  // 每日冲刺：整页渲染专项练习（复用 quiz 的整页替换模式，避免页内浮层被顶栏盖住）
  const [sprint, setSprint] = useState<string | null>(null);
  const [sprintQuiz, setSprintQuiz] = useState<{ questions: ExamQuestion[]; key: number } | null>(null);
  const sprintLevel = settings.examLevel === "PET" ? "B1" : "A2";
  const sprintEntries = useMemo<Entry[]>(() => {
    const ids = weakWords(progress, 16).map((w) => w.id).concat(Object.keys(progress.cards).slice(-12));
    const picked = shuffle(ids, hashSeed("sprint-gap-" + dayKey()))
      .map((id) => atlas.peek(id))
      .filter(Boolean)
      .slice(0, 12) as Entry[];
    if (picked.length >= 6) return picked;
    return atlas.words.slice(0, 12).map((w) => atlas.peek(w.id)).filter(Boolean).slice(0, 12) as Entry[];
  }, [atlas, progress]);
  const markSprintDone = (id: string) =>
    store.progress((p) => {
      const k = dayKey();
      const cur = p.sprint[k] ?? [];
      return { ...p, sprint: { ...p.sprint, [k]: cur.includes(id) ? cur : [...cur, id] } };
    });
  const launchSprint = async (id: string) => {
    if (id === "quiz") {
      const ids = shuffle([...weakWords(progress, 30).map((w) => w.id), ...Object.keys(progress.cards).slice(-20)], hashSeed("sprint-quiz-" + dayKey())).slice(0, 24);
      const list = (await prefetch(atlas, ids.filter((i) => atlas.byId.has(i)))).filter((e): e is NonNullable<typeof e> => !!e);
      const kinds = ["definition", "cloze", "definition", "picture", "cloze"] as const;
      const questions: ExamQuestion[] = [];
      for (let i = 0; i < kinds.length && i < list.length; i++) {
        const q = generateExam(atlas, [list[i]], kinds[i], 1)[0];
        if (q) questions.push(q);
      }
      if (questions.length) setSprintQuiz({ questions, key: Date.now() });
      setSprint("quiz");
    } else setSprint(id);
  };
  const closeSprint = () => {
    if (sprint) markSprintDone(sprint);
    setSprint(null);
    setSprintQuiz(null);
  };

  if (quiz)
    return (
      <ExamRound
        key={quiz.key}
        kind="definition"
        questions={quiz.questions}
        onExit={() => setQuiz(null)}
        onAgain={() => void startQuiz()}
      />
    );

  if (sprint) {
    const back = () => closeSprint();
    if (sprint === "quiz")
      return <ExamRound key={sprintQuiz?.key} kind="definition" questions={sprintQuiz?.questions ?? []} onExit={back} onAgain={() => void launchSprint("quiz")} />;
    if (sprint === "grammar") return <GrammarClinic level={sprintLevel} onExit={back} />;
    if (sprint === "opencloze") return <OpenClozeRound level={sprintLevel} onExit={back} />;
    if (sprint === "gapfill") return <GapFillRound entries={sprintEntries} onExit={back} onAgain={back} />;
    if (sprint === "speak") return <SpeakingExam onExit={back} onAgain={back} />;
    if (sprint === "write") return <WritingRound onExit={back} />;
  }

  return (
    <div className="page today">
      <header className="greet">
        <p className="eyebrow">
          {now.getMonth() + 1}月{now.getDate()}日 · 星期{"日一二三四五六"[now.getDay()]}
        </p>
        <h1 className="display">{greeting(now.getHours())}，探索者。</h1>
      </header>

      <DailyQuote />
      <DailyReading />
      <DailyFortune learnedToday={plan.due.length + plan.fresh.length} />
      <SeasonWords />

      <section className={`journey ${total === 0 && !active ? "is-clear" : ""}`}>
        <img className="journey-art" src={`${BRAND}/hero.webp`} alt="" fetchPriority="high" />
        <div className="journey-body">
          {active ? (
            <>
              <p className="eyebrow eyebrow-light">旅程进行中</p>
              <h2>
                还剩 <b>{active.steps.length - active.index}</b> 步
              </h2>
              <p className="journey-lede">进度已保存，随时接着走。</p>
            </>
          ) : total > 0 ? (
            <>
              <p className="eyebrow eyebrow-light">今日旅程</p>
              <h2>
                {plan.due.length > 0 && (
                  <>
                    复习 <b>{plan.due.length}</b>
                  </>
                )}
                {plan.due.length > 0 && plan.fresh.length > 0 && <i> · </i>}
                {plan.fresh.length > 0 && (
                  <>
                    新词 <b>{plan.fresh.length}</b>
                  </>
                )}
              </h2>
              <p className="journey-lede">约 {plan.minutes} 分钟。先温故，再知新。</p>
            </>
          ) : (
            <>
              <p className="eyebrow eyebrow-light">今日已完成</p>
              <h2>今天的星，都亮了。</h2>
              <p className="journey-lede">记忆需要一点留白。想多走一段，也可以。</p>
            </>
          )}
          {teaser.length > 0 && (
            <div className="teaser" aria-label="今天将遇见的新词">
              {teaser.map((w, i) => (
                <Illustration key={w.id} src={atlas.img(w, "thumb")} word={w.word} topic={w.topic} className={`teaser-${i}`} />
              ))}
              <span>今天会遇见它们</span>
            </div>
          )}
          <div className="journey-actions">
            {active || total > 0 ? (
              <button className="btn btn-primary btn-xl" onClick={() => start()}>
                {active ? "继续旅程" : "开始今天的旅程"} <ArrowRight size={20} />
              </button>
            ) : (
              <button className="btn btn-primary btn-xl" onClick={() => start({ extra: 5 })}>
                再认识 5 个新词 <Sparkles size={18} />
              </button>
            )}
            {!active && plan.due.length > 0 && plan.fresh.length > 0 && (
              <button className="btn btn-glass" onClick={() => start({ reviewOnly: true })}>
                只复习
              </button>
            )}
            <button className="btn btn-glass" onClick={() => void startQuiz()}>
              <Sparkles size={18} /> 今日速测 5 题
            </button>
            {!active && total === 0 && (
              <button className="btn btn-glass" onClick={() => go({ page: "practice" })}>
                <Keyboard size={18} /> 打字练习
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="today-grid">
        <DailyPlan onLaunch={(id) => void launchSprint(id)} />
        <ExamCountdown />
        <ExamChecklist days={settings.examDate ? Math.round((new Date(settings.examDate + "T00:00:00").getTime() - Date.now()) / 86400000) : null} />
        <WordOfDay />
        <WeakWords />

        <section className="panel streak-panel">
          <div className="panel-head">
            <h3 className="eyebrow">这一周</h3>
            <span className={`streak ${streak ? "is-on" : ""}`}>
              <Flame size={16} /> 连续 {streak} 天
            </span>
          </div>
          <div className="streak-body">
            <Ring value={goal ? Math.min(1, doneToday / goal) : 0} size={112} stroke={8} tone={goalHit ? "sage" : "terra"}>
              <b>{doneToday}</b>
              <small>{goalHit ? "今日目标达成！" : `今日答题 · 目标 ${goal}`}</small>
            </Ring>
            <ol className="week">
              {week.map((d) => (
                <li key={d.k} className={`${d.v ? "is-on" : ""} ${d.today ? "is-today" : ""}`} title={`${d.k}：${d.v} 题`}>
                  <span style={{ "--h": Math.min(1, d.v / 40) } as React.CSSProperties} />
                  <small>{d.label}</small>
                </li>
              ))}
            </ol>
          </div>
          <dl className="mini-stats">
            <div>
              <dt>已点亮</dt>
              <dd>{learned.toLocaleString()}</dd>
            </div>
            <div>
              <dt>已掌握</dt>
              <dd>{mastered.toLocaleString()}</dd>
            </div>
            <div>
              <dt>全部词汇</dt>
              <dd>{atlas.count.toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <DueForecast />
        <LevelPath />
        <GalaxyPanel learned={learned} total={atlas.count} />
        <Topics />
      </div>
    </div>
  );
}

/**
 * 未来 7 天的复习排期。我的页本来就有这份数据，但埋在页尾看不见；
 * 今日页是每天必经之地，把排期摆在这儿才知道哪天会爆量。
 */
function DueForecast() {
  const progress = useStore((s) => s.progress);
  const days = useMemo(() => forecastDue(progress), [progress]);
  const total = days.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...days);
  const peak = total > 0 ? days.indexOf(Math.max(...days)) : -1;
  const label = (i: number) => (i === 0 ? "今天" : i === 1 ? "明天" : i === 2 ? "后天" : `+${i}`);
  return (
    <section className="panel due-panel">
      <div className="panel-head">
        <h3 className="eyebrow">复习排期</h3>
        <span className="muted">未来 7 天</span>
      </div>
      <ol className="forecast">
        {days.map((n, i) => (
          <li key={i} className={i === peak ? "is-peak" : ""} title={`${label(i)}：${n} 个到期`}>
            <span style={{ height: `${Math.max(2, (n / max) * 100)}%` }} />
            <b>{n}</b>
            <small>{label(i)}</small>
          </li>
        ))}
      </ol>
      <p className="muted">
        {total === 0
          ? "暂时没有排期，可以安心学新词。"
          : `共 ${total.toLocaleString()} 个到期${peak >= 0 ? ` · ${label(peak)}最忙（${days[peak]} 个）` : ""}`}
      </p>
    </section>
  );
}

function ExamCountdown() {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const learned = useStore((s) => Object.keys(s.progress.cards).length);
  if (!settings.examLevel || !settings.examDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(settings.examDate + "T00:00:00");
  const left = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (left < 0) return null;
  const remaining = Math.max(0, atlas.count - learned);
  const perDay = left === 0 ? remaining : Math.ceil(remaining / left);
  return (
    <section className="panel exam-countdown" onClick={() => go({ page: "me" })} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go({ page: "me" })}>
      <div>
        <p className="eyebrow">备考目标 · {settings.examLevel}{settings.examCity ? ` · ${settings.examCity}` : ""}</p>
        <h3>
          距考试还有 <b>{left}</b> 天
        </h3>
        <p className="muted">
          还剩 {remaining.toLocaleString()} 词 · 建议每天 {perDay} 个新词
        </p>
      </div>
      <span className="btn btn-glass">
        调整目标 <ArrowRight size={18} />
      </span>
    </section>
  );
}

function DailyPlan({ onLaunch }: { onLaunch: (id: string) => void }) {
  const settings = useStore((s) => s.settings);
  const examDays = settings.examDate
    ? Math.max(0, Math.round((new Date(settings.examDate + "T00:00:00").getTime() - Date.now()) / 86400000))
    : -1;
  if (settings.examLevel && settings.examDate && examDays >= 0) return <SprintPlan examDays={examDays} onLaunch={onLaunch} />;
  return <PlanPanel />;
}

function PlanPanel() {
  const settings = useStore((s) => s.settings);
  const progress = useStore((s) => s.progress);
  const [custom, setCustom] = useState(false);
  const [customN, setCustomN] = useState(30);
  const plan = useMemo(() => dailyPlan(settings, progress), [settings, progress]);
  const examDays = settings.examDate ? Math.round((new Date(settings.examDate + "T00:00:00").getTime() - Date.now()) / 86400000) : 0;
  const goal = settings.dailyGoal > 0 ? settings.dailyGoal : 40;

  const start = (n: number) => {
    if (!n || n < 1) return;
    store.settings({ planStartedAt: dayKey(), planTotal: Math.min(1000, Math.round(n)) });
  };
  const reset = () => store.settings({ planTotal: 0, planStartedAt: "" });

  if (!plan.active)
    return (
      <section className="panel plan-panel is-start">
        <div className="panel-head">
          <h3 className="eyebrow">
            <Flag size={15} /> 每日练习计划
          </h3>
        </div>
        <h4 className="plan-title">开启一段练习旅程</h4>
        <p className="muted">选一个天数，每天完成「今日练习」就算打卡。坚持到结束那天，就是一段完整的练习。</p>
        <div className="plan-chips">
          {[21, 30, 60, 100].map((n) => (
            <button key={n} className="chip" onClick={() => start(n)}>
              {n} 天
            </button>
          ))}
          {examDays > 0 && examDays <= 1000 && (
            <button className="chip" onClick={() => start(examDays)}>
              到考试日（{examDays} 天）
            </button>
          )}
          <button className={`chip ${custom ? "is-on" : ""}`} onClick={() => setCustom((v) => !v)}>
            自定义
          </button>
        </div>
        {custom && (
          <div className="plan-custom">
            <input
              type="number"
              min={1}
              max={1000}
              value={customN}
              onChange={(e) => setCustomN(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
              aria-label="自定义天数"
            />
            <span>天</span>
            <button className="btn btn-primary btn-sm" onClick={() => start(customN)}>
              开始
            </button>
          </div>
        )}
      </section>
    );

  if (plan.finished)
    return (
      <section className="panel plan-panel is-done">
        <div className="panel-head">
          <h3 className="eyebrow">
            <Flag size={15} /> 每日练习计划
          </h3>
        </div>
        <h4 className="plan-title">计划完成</h4>
        <p>
          你坚持了 <b>{plan.doneDays}</b> 天练习，完成率 <b>{Math.round((plan.doneDays / plan.total) * 100)}%</b>。每段旅程都算数。
        </p>
        <button className="btn btn-primary btn-sm" onClick={reset}>
          <RotateCcw size={16} /> 开启新计划
        </button>
      </section>
    );

  return (
    <section className="panel plan-panel">
      <div className="panel-head">
        <h3 className="eyebrow">
          <Flag size={15} /> 每日练习计划
        </h3>
        <button className="link" onClick={reset}>
          重新规划
        </button>
      </div>
      <div className="plan-top">
        <div className="plan-copy">
          <p className="plan-day">
            第 <b>{plan.dayNumber}</b> 天 <span>/ 共 {plan.total} 天</span>
          </p>
          <p className="plan-end">
            还剩 {plan.remaining} 天 · 预计 {plan.endsOnMD} 结束
          </p>
        </div>
        <Ring value={plan.todayDone ? 1 : 0} size={84} stroke={7} tone={plan.todayDone ? "sage" : "terra"}>
          {plan.todayDone ? <Check size={22} /> : <b>今日</b>}
          <small>{plan.todayDone ? "已打卡" : "待完成"}</small>
        </Ring>
      </div>
      <div className="plan-track" aria-hidden="true">
        <span style={{ width: `${plan.total ? (plan.doneDays / plan.total) * 100 : 0}%` }} />
      </div>
      <dl className="plan-stats">
        <div>
          <dt>已打卡</dt>
          <dd>
            {plan.doneDays} <small>/ {plan.total}</small>
          </dd>
        </div>
        <div>
          <dt>连续</dt>
          <dd>
            {plan.streak} <small>天</small>
          </dd>
        </div>
        <div>
          <dt>今日目标</dt>
          <dd>
            {goal} <small>题</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

const SPRINT_DRILLS: { id: string; label: string; note: string; icon: typeof Zap; level?: boolean }[] = [
  { id: "quiz", label: "速测 5 题", note: "巩固今日词汇", icon: Zap },
  { id: "grammar", label: "语法诊所", note: "攻克 1 个考点", icon: BookOpen, level: true },
  { id: "opencloze", label: "开放填空", note: "Reading Part 5/6", icon: PenLine, level: true },
  { id: "gapfill", label: "听力填空", note: "听音写关键词", icon: Headphones },
  { id: "speak", label: "口语模考", note: "Part 3/4 陪练", icon: Mic },
  { id: "write", label: "写作批改", note: "AI 老师改作文", icon: NotebookPen },
];

function SprintPlan({ examDays, onLaunch }: { examDays: number; onLaunch: (id: string) => void }) {
  const settings = useStore((s) => s.settings);
  const progress = useStore((s) => s.progress);

  const today = dayKey();
  const doneIds = progress.sprint[today] ?? [];
  const total = examDays + 1;
  const sprintDay = total - examDays;
  const remaining = examDays;
  const ed = new Date(settings.examDate + "T00:00:00");
  const endsOnMD = `${ed.getMonth() + 1}月${ed.getDate()}日`;
  const doneCount = doneIds.length;

  const toggle = (id: string) =>
    store.progress((p) => {
      const k = dayKey();
      const cur = p.sprint[k] ?? [];
      return { ...p, sprint: { ...p.sprint, [k]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
    });

  if (examDays <= 0)
    return (
      <section className="panel sprint-panel is-done">
        <div className="panel-head">
          <h3 className="eyebrow">
            <Zap size={15} /> 每日冲刺 · {settings.examLevel}
          </h3>
        </div>
        <h4 className="plan-title">冲刺完成，去考试！</h4>
        <p>你坚持了每日冲刺，今天就是考试日。稳住，把平时的练习发挥出来就好。</p>
      </section>
    );

  return (
    <section className="panel sprint-panel">
      <div className="panel-head">
        <h3 className="eyebrow">
          <Zap size={15} /> 每日冲刺 · {settings.examLevel}
        </h3>
        <span className="legend">距考试 {examDays} 天</span>
      </div>
      <div className="plan-top">
        <div className="plan-copy">
          <p className="plan-day">
            第 <b>{sprintDay}</b> 天 <span>/ 共 {total} 天冲刺</span>
          </p>
          <p className="plan-end">
            还剩 {remaining} 天 · 考试日（{endsOnMD}）结束
          </p>
        </div>
        <Ring value={doneCount / SPRINT_DRILLS.length} size={84} stroke={7} tone={doneCount === SPRINT_DRILLS.length ? "sage" : "terra"}>
          <b>{doneCount}</b>
          <small>/ {SPRINT_DRILLS.length}</small>
        </Ring>
      </div>
      <p className="sprint-tip">每天按顺序刷完这 {SPRINT_DRILLS.length} 项，考试前把各题型都过一遍。</p>
      <ul className="sprint-list">
        {SPRINT_DRILLS.map((d) => {
          const done = doneIds.includes(d.id);
          const Icon = d.icon;
          return (
            <li key={d.id} className={done ? "is-done" : ""}>
              <button className="sprint-check" onClick={() => toggle(d.id)} aria-label={done ? "取消完成" : "标记完成"}>
                {done && <Check size={15} />}
              </button>
              <span className="sprint-info">
                <b>
                  <Icon size={14} /> {d.label}
                </b>
                <small>{d.note}</small>
              </span>
              <button className="sprint-go" onClick={() => void onLaunch(d.id)}>
                {done ? "重做" : "开始"} <ArrowRight size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WeakWords() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const weak = useMemo(() => weakWords(progress, 6), [progress]);
  if (!weak.length) return null;
  const list = weak.map((w) => ({ w, ref: atlas.byId.get(w.id) })).filter((x) => x.ref);
  if (!list.length) return null;
  return (
    <section className="panel weak-panel">
      <div className="panel-head">
        <h3 className="eyebrow">今日薄弱词</h3>
        <span className="legend">优先复习，别让它们生锈</span>
      </div>
      <ol className="weak-list">
        {list.map(({ w, ref }) => (
          <li key={w.id}>
            <button onClick={() => openWord(w.id)} aria-label={`薄弱词：${ref!.word}`}>
              <b lang="en">{ref!.word}</b>
              <small>{ref!.zh}</small>
              <span className="weak-tags">
                {w.tags.map((t) => (
                  <i key={t}>{t}</i>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GalaxyPanel({ learned, total }: { learned: number; total: number }) {
  const today = useStore((s) => s.progress.days[dayKey()]);
  const ids = useStore((s) => s.progress.cards);
  const todayIds = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Object.entries(ids)
      .filter(([, c]) => c.seen >= start.getTime())
      .map(([id]) => id);
  }, [ids]);
  void today;
  return (
    <section className="galaxy-panel" onClick={() => go({ page: "atlas", view: "galaxy" })} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go({ page: "atlas", view: "galaxy" })}>
      <Galaxy mode="mini" highlight={todayIds} />
      <div className="galaxy-panel-copy">
        <p className="eyebrow eyebrow-light">你的词汇星图</p>
        <h3>
          已点亮 <b>{learned.toLocaleString()}</b> 颗星
        </h3>
        <p>{learned ? `还有 ${(total - learned).toLocaleString()} 颗在等你。金色是今天新点亮的。` : `${total.toLocaleString()} 个词是 ${total.toLocaleString()} 颗星。学会一个，就点亮一颗。`}</p>
        <span className="btn btn-glass">
          进入星图 <ArrowRight size={18} />
        </span>
      </div>
    </section>
  );
}

function WordOfDay() {
  const atlas = useAtlas();
  const pick = useMemo(() => {
    const pool = atlas.words.filter((w) => w.cefr >= 2 && w.media & 1);
    const list = pool.length ? pool : atlas.words;
    return list[hashSeed(dayKey()) % list.length];
  }, [atlas]);
  const { entry } = useEntry(pick?.id);
  if (!pick) return null;
  return (
    <section className="panel wotd" onClick={() => openWord(pick.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openWord(pick.id)} aria-label={`今日一词：${pick.word}`}>
      <Illustration src={atlas.img(pick)} word={pick.word} topic={pick.topic} className="wotd-art" />
      <div className="wotd-body">
        <h3 className="eyebrow">今日一词</h3>
        <p className="wotd-word" lang="en">
          {pick.word}
        </p>
        {entry && (
          <div onClick={(e) => e.stopPropagation()}>
            <Pronounce entry={entry} refw={pick} />
          </div>
        )}
        <p className="wotd-zh">{pick.zh}</p>
        {entry?.ex[0] && (
          <p className="wotd-ex" lang="en">
            <Highlight text={entry.ex[0].en} word={entry.w} />
          </p>
        )}
      </div>
    </section>
  );
}

function LevelPath() {
  const atlas = useAtlas();
  const cards = useStore((s) => s.progress.cards);
  const start = useStore((s) => s.settings.startLevel);
  const levels = useMemo(() => {
    const out = atlas.cefr.map((name, li) => ({ li, name, total: 0, seen: 0, mastered: 0 }));
    for (const w of atlas.words) {
      const l = out[w.cefr];
      l.total++;
      const c = cards[w.id];
      if (c) {
        l.seen++;
        if (isMastered(c)) l.mastered++;
      }
    }
    // 只画真有词的档位。B2 以上目前是空的，画出来就是三个永远 0/0 的站。
    return out.filter((l) => l.total > 0);
  }, [atlas, cards]);
  const startAt = resolveLevel(atlas, start);
  const NAMES = ["入门", "基础", "进阶", "中高", "高级", "精通"];
  const span = levels.length ? `${levels[0].name} 到 ${levels[levels.length - 1].name}` : "";
  return (
    <section className="panel path-panel">
      <div className="panel-head">
        <h3 className="eyebrow">学习路线 · {span}</h3>
        <span className="legend">
          <i className="lg-seen" /> 已学 <i className="lg-done" /> 已掌握
        </span>
      </div>
      <ol className="route">
        {levels.map((l) => {
          const seen = l.seen / Math.max(1, l.total);
          const done = l.mastered / Math.max(1, l.total);
          const isStart = l.li === startAt;
          return (
            <li key={l.name} className={`${isStart ? "is-start" : ""} ${l.seen ? "is-on" : ""}`}>
              <button onClick={() => go({ page: "atlas", level: l.name })} aria-label={`${l.name} ${NAMES[l.li]}，已学 ${l.seen} / ${l.total}`}>
                <span className="station" style={{ "--seen": seen, "--done": done } as React.CSSProperties}>
                  <b>{l.name}</b>
                </span>
                <span className="station-name">{NAMES[l.li]}</span>
                <span className="station-count">
                  {l.seen}
                  <small>/{l.total}</small>
                </span>
                {isStart && <span className="station-flag">起点</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Topics() {
  const atlas = useAtlas();
  const counts = useMemo(() => {
    const c = new Array(atlas.topics.length).fill(0);
    atlas.words.forEach((w) => c[w.topic]++);
    return c;
  }, [atlas]);
  return (
    <section className="topics-panel">
      <div className="panel-head">
        <h3 className="eyebrow">按话题探索</h3>
        <button className="link" onClick={() => go({ page: "atlas" })}>
          打开图鉴
        </button>
      </div>
      <ul className="topic-tiles">
        {atlas.topics.map(([key, name], i) => (
          <li key={key}>
            <button onClick={() => go({ page: "atlas", topic: key })}>
              <img src={`${BRAND}/topic-${key}.webp`} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <span>
                <b>{name}</b>
                <small>{counts[i]} 个词</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
