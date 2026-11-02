import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  GraduationCap,
  RotateCcw,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { CURRICULUM, DRILL_LABEL, EXAM_NAME, allLessons, type DrillKind, type Unit } from "../exam/curriculum";
import { generateListening, type ExamQuestion } from "../exam/generate";
import { pointById } from "../exam/syllabus";
import { useLocation } from "../lib/router";
import { hashSeed, shuffle } from "../lib/text";
import { store, useStore } from "../store/store";
import { GapFillRound } from "../ui/GapFillRound";
import { GrammarClinic } from "../ui/GrammarClinic";
import { ListeningRound } from "../ui/ListeningRound";
import { LessonPlayer } from "../ui/LessonPlayer";
import { MockRound } from "../ui/MockRound";
import { OpenClozeRound } from "../ui/OpenClozeRound";
import { ReadingMatch } from "../ui/ReadingMatch";
import { SignRound } from "../ui/SignRound";
import { SpeakingExam } from "../ui/SpeakingExam";
import { WritingRound } from "../ui/WritingRound";

type Level = "A2" | "B1";

interface Run {
  kind: DrillKind;
  key: number;
  level: Level;
  /** 完成后要打勾的课时 id。 */
  lesson: string;
  entries?: Entry[];
  questions?: ExamQuestion[];
}

/** B 站检索页——只做外链跳转，不转载视频。 */
const bili = (q: string) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`;


/** 已导出的课件视频：读 public/lessons/index.json，没有就当没有视频。 */
const BASE = import.meta.env.BASE_URL;
let videoCache: Record<string, number> | null = null;
let videoLoading: Promise<Record<string, number>> | null = null;

function useLessonVideos() {
  const [map, setMap] = useState<Record<string, number>>(videoCache ?? {});
  useEffect(() => {
    if (videoCache) {
      setMap(videoCache);
      return;
    }
    videoLoading ??= fetch(`${BASE}lessons/index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { id: string; dur: number }[]) => Object.fromEntries(rows.map((r) => [r.id, r.dur])))
      .catch(() => ({}));
    let alive = true;
    void videoLoading.then((m) => {
      videoCache = m;
      if (alive) setMap(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}

export function Classroom() {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const progress = useStore((s) => s.progress);
  // 可以从别处深链进来（比如模考成绩单指路）：#/classroom?lesson=k-read-sign
  const deepLesson = useLocation().route.page === "classroom" ? (useLocation().route as { lesson?: string }).lesson : undefined;
  const [level, setLevel] = useState<Level>(
    deepLesson ? (deepLesson.startsWith("p-") ? "B1" : "A2") : settings.examLevel === "PET" ? "B1" : "A2",
  );
  const [openId, setOpenId] = useState<string | null>(deepLesson ?? null);
  const [run, setRun] = useState<Run | null>(null);
  /** 正在上的站内微课（课时 id）。 */
  const [study, setStudy] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const videos = useLessonVideos();
  const [video, setVideo] = useState<string | null>(null);

  // 深链进来时把目标课时滚到中间，别让人自己找。
  useEffect(() => {
    if (!deepLesson) return;
    const t = window.setTimeout(() => {
      document.querySelector(`[data-lesson="${deepLesson}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 280);
    return () => window.clearTimeout(t);
  }, [deepLesson]);

  const units = CURRICULUM[level];
  const lessons = useMemo(() => allLessons(level), [level]);
  const doneCount = lessons.filter((l) => progress.lessons[l.id]).length;
  const totalMin = lessons.reduce((n, l) => n + l.min, 0);
  const leftMin = lessons.filter((l) => !progress.lessons[l.id]).reduce((n, l) => n + l.min, 0);

  /** 取一批同级别、带例句的词条（听力/填空要有例句才能出题）。 */
  const pickEntries = async (n = 20) => {
    const cefr = atlas.cefr.indexOf(level);
    const same = atlas.words.filter((w) => w.cefr === cefr && atlas.byId.has(w.id)).map((w) => w.id);
    const ids = shuffle(same.length >= n * 2 ? same : atlas.words.map((w) => w.id), hashSeed(String(Date.now()))).slice(0, n * 3);
    const list = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e && e.ex.length > 0);
    return list.slice(0, n);
  };

  const launch = async (lessonId: string, kind: DrillKind) => {
    const base = { kind, level, lesson: lessonId, key: Date.now() };
    // 词汇课直接去闪卡页，不走专项浮层。
    if (kind === "learn") {
      location.hash = "#/learn";
      return;
    }
    if (kind === "gapfill") {
      setBusy(lessonId);
      const entries = await pickEntries(20);
      setBusy(null);
      if (entries.length) setRun({ ...base, entries });
      return;
    }
    if (kind === "listen") {
      setBusy(lessonId);
      const entries = await pickEntries(40);
      const questions = generateListening(atlas, entries, 8);
      setBusy(null);
      if (questions.length) setRun({ ...base, questions });
      return;
    }
    setRun(base);
  };

  const markDone = (id: string) =>
    store.progress((p) => ({ ...p, lessons: { ...p.lessons, [id]: Date.now() } }));
  const toggleDone = (id: string) =>
    store.progress((p) => {
      const next = { ...p.lessons };
      if (next[id]) delete next[id];
      else next[id] = Date.now();
      return { ...p, lessons: next };
    });

  /** 专项结束：打勾 + 回到教室。 */
  const finish = () => {
    if (run) markDone(run.lesson);
    setRun(null);
  };

  // ---- 站内微课（自建讲义，整页打开）----
  if (study)
    return (
      <LessonPlayer
        key={study}
        lessonId={study}
        level={level}
        onExit={() => setStudy(null)}
        onFinish={() => markDone(study)}
        onDrill={(kind) => {
          const id = study;
          setStudy(null);
          void launch(id, kind);
        }}
      />
    );

  // ---- 整页渲染专项（与练习页一致，避免页内浮层被顶栏压住）----
  if (run) {
    if (run.kind === "grammar") return <GrammarClinic key={run.key} level={run.level} onExit={finish} />;
    if (run.kind === "opencloze") return <OpenClozeRound key={run.key} level={run.level} onExit={finish} />;
    if (run.kind === "sign")
      return <SignRound key={run.key} level={run.level} onExit={finish} onAgain={() => setRun({ ...run, key: Date.now() })} />;
    if (run.kind === "reading")
      return <ReadingMatch key={run.key} onExit={finish} onAgain={() => setRun({ ...run, key: Date.now() })} />;
    if (run.kind === "gapfill" && run.entries)
      return (
        <GapFillRound
          key={run.key}
          entries={run.entries}
          onExit={finish}
          onAgain={() => void launch(run.lesson, "gapfill")}
        />
      );
    if (run.kind === "listen" && run.questions)
      return (
        <ListeningRound
          key={run.key}
          questions={run.questions}
          onExit={finish}
          onAgain={() => void launch(run.lesson, "listen")}
        />
      );
    if (run.kind === "speak")
      return <SpeakingExam key={run.key} level={run.level} onExit={finish} onAgain={() => setRun({ ...run, key: Date.now() })} />;
    if (run.kind === "write") return <WritingRound key={run.key} onExit={finish} />;
    if (run.kind === "mock")
      return <MockRound key={run.key} level={run.level} onExit={finish} onAgain={() => setRun({ ...run, key: Date.now() })} />;
  }

  return (
    <div className="page classroom">
      <header className="page-head">
        <p className="eyebrow">教室 · Classroom</p>
        <h1 className="display">一节课，一个考点，一次练习。</h1>
        <p className="lede">
          课表按真实备考顺序排好了。点「上这节课」直接在站内上课——讲义、例句、朗读、随堂小测都在里面，上完立刻做配套练习，做完自动打勾。
        </p>
      </header>

      <section className="panel class-overview">
        <div className="class-switch" role="tablist" aria-label="选择考试">
          {(["A2", "B1"] as Level[]).map((lv) => (
            <button
              key={lv}
              role="tab"
              aria-selected={level === lv}
              className={level === lv ? "is-on" : ""}
              onClick={() => {
                setLevel(lv);
                setOpenId(null);
              }}
            >
              <b>{EXAM_NAME[lv]}</b>
              <small>{lv === "A2" ? "A2 Key" : "B1 Preliminary"}</small>
            </button>
          ))}
        </div>

        <div className="class-progress">
          <div className="class-row">
            <p className="class-count">
              <GraduationCap size={18} />
              已上 <b>{doneCount}</b> / {lessons.length} 节
            </p>
            <span className="class-hours">
              <Clock size={14} /> 总约 {Math.round(totalMin / 60)} 小时
            </span>
          </div>
          <div className="class-bar" aria-hidden="true">
            <i style={{ width: `${lessons.length ? (doneCount / lessons.length) * 100 : 0}%` }} />
          </div>
          <p className="class-hint">
            {doneCount === 0
              ? "从头开始，第一节先搞定时态——后面所有题型都靠它。"
              : doneCount === lessons.length
                ? "全部上完。剩下的就是按真实时间做整卷，保持手感。"
                : `还剩 ${lessons.length - doneCount} 节 · 约 ${Math.round(leftMin / 60)} 小时。接着上次的往下走。`}
          </p>
        </div>
      </section>

      {units.map((unit) => (
        <UnitBlock
          key={unit.id}
          unit={unit}
          done={progress.lessons}
          grammar={progress.grammar}
          openId={openId}
          busy={busy}
          onToggleOpen={(id) => setOpenId((cur) => (cur === id ? null : id))}
          onLaunch={launch}
          onStudy={setStudy}
          onToggleDone={toggleDone}
          videos={videos}
          onPlayVideo={setVideo}
        />
      ))}

      {video &&
        createPortal(
          <div className="video-modal" role="dialog" aria-label="课件视频" onClick={() => setVideo(null)}>
            <div className="video-box" onClick={(e) => e.stopPropagation()}>
              <video src={`${BASE}lessons/${video}.mp4`} controls autoPlay playsInline />
              <div className="video-bar">
                <span>课件视频 · 旁白由系统语音生成</span>
                <button className="btn btn-ghost" onClick={() => setVideo(null)}>
                  关闭
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <p className="class-disclaimer">
        说明：讲义、例句、随堂测与配套练习全部为本应用自建原创内容，不转载任何外部课程；课时底部的 B 站链接只是「想看视频版」的可选出口。课表顺序按剑桥 KET / PET 公开的考试结构整理。
      </p>
    </div>
  );
}

function UnitBlock({
  unit,
  done,
  grammar,
  openId,
  busy,
  onToggleOpen,
  onLaunch,
  onStudy,
  onToggleDone,
  videos,
  onPlayVideo,
}: {
  unit: Unit;
  done: Record<string, number>;
  grammar: Record<string, { right: number; wrong: number; at: number }>;
  openId: string | null;
  busy: string | null;
  onToggleOpen: (id: string) => void;
  onLaunch: (lessonId: string, kind: DrillKind) => void;
  onStudy: (lessonId: string) => void;
  onToggleDone: (id: string) => void;
  videos: Record<string, number>;
  onPlayVideo: (id: string) => void;
}) {
  const unitDone = unit.lessons.filter((l) => done[l.id]).length;
  return (
    <section className="panel class-unit">
      <div className="panel-head">
        <h3 className="eyebrow">{unit.title}</h3>
        <span className="legend">
          {unitDone} / {unit.lessons.length}
        </span>
      </div>
      <p className="class-note">{unit.note}</p>
      <ul className="lesson-list">
        {unit.lessons.map((lesson, i) => {
          const isDone = !!done[lesson.id];
          const isOpen = openId === lesson.id;
          const mastered = lesson.points
            ?.map((id) => grammar[id])
            .filter(Boolean)
            .reduce((n, g) => n + (g ? g.right : 0), 0);
          return (
            <li key={lesson.id} className={`${isDone ? "is-done" : ""} ${isOpen ? "is-open" : ""}`}>
              <button
                className="lesson-head"
                data-lesson={lesson.id}
                onClick={() => onToggleOpen(lesson.id)}
                aria-expanded={isOpen}
              >
                <span className="lesson-no">{isDone ? <Check size={15} /> : String(i + 1).padStart(2, "0")}</span>
                <span className="lesson-copy">
                  <b>{lesson.title}</b>
                  <small>{lesson.en}</small>
                </span>
                <span className="lesson-meta">
                  {videos[lesson.id] ? <span className="lesson-vtag" title="有课件视频"><Video size={13} /></span> : null}
                  <Clock size={13} /> {lesson.min} 分钟
                </span>
                <ChevronDown size={17} className="lesson-caret" />
              </button>

              {isOpen && (
                <div className="lesson-body">
                  <p className="lesson-brief">{lesson.brief}</p>
                  {lesson.points && lesson.points.length > 0 && (
                    <p className="lesson-points">
                      {lesson.points.map((id) => {
                        const p = pointById(id);
                        const stat = grammar[id];
                        return (
                          <span key={id} className={stat && stat.right > 0 ? "is-trained" : ""}>
                            {p ? p.name : id}
                            {stat && stat.right > 0 ? ` · 已对 ${stat.right} 题` : ""}
                          </span>
                        );
                      })}
                    </p>
                  )}
                  <div className="lesson-actions">
                    <button className="btn lesson-study" onClick={() => onStudy(lesson.id)}>
                      <BookOpen size={16} /> 上这节课
                    </button>
                    {videos[lesson.id] ? (
                      <button className="btn lesson-video" onClick={() => onPlayVideo(lesson.id)}>
                        <Video size={15} /> 看视频 · {Math.round(videos[lesson.id] / 60)} 分
                      </button>
                    ) : null}
                    {lesson.drills.map((d) => (
                      <button
                        key={d}
                        className="btn lesson-drill"
                        disabled={busy === lesson.id}
                        onClick={() => void onLaunch(lesson.id, d)}
                      >
                        {busy === lesson.id ? "准备中…" : `练 ${DRILL_LABEL[d]}`} <ArrowRight size={14} />
                      </button>
                    ))}
                    <button className="lesson-check" onClick={() => onToggleDone(lesson.id)}>
                      {isDone ? (
                        <>
                          <RotateCcw size={14} /> 已上完，撤销
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> 标记上完
                        </>
                      )}
                    </button>
                  </div>
                  <a className="lesson-ref" href={bili(lesson.search)} target="_blank" rel="noreferrer">
                    <ExternalLink size={12} /> 想再看视频版？去 B 站搜「{lesson.search}」
                  </a>
                  {mastered !== undefined && mastered > 0 && (
                    <p className="lesson-tip">这个考点你已经答对过 {mastered} 题，再刷一轮就能稳住。</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
