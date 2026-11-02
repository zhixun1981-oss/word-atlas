import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { WordRef } from "../atlas/types";
import { DRILL_LABEL, type DrillKind } from "../exam/curriculum";
import { deckFor, type DeckSlide } from "../exam/lessons";
import { play } from "../lib/audio";
import { speak, stopSpeak, ttsSupported } from "../lib/tts";

/**
 * 站内微课播放器：一页一页讲完一节课，最后随堂回顾 + 去练。
 *
 * 内容来自 `exam/lessons.ts`，不依赖任何外部视频。
 */
export function LessonPlayer({
  lessonId,
  level,
  onExit,
  onDrill,
  onFinish,
}: {
  lessonId: string;
  level: "A2" | "B1";
  onExit: () => void;
  onDrill: (kind: DrillKind) => void;
  onFinish: () => void;
}) {
  const deck = useMemo(() => deckFor(lessonId, level), [lessonId, level]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const total = deck?.slides.length ?? 0;

  // 翻页时停掉正在朗读的内容。
  useEffect(() => {
    stopSpeak();
  }, [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, Math.max(0, total - 1)));
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  useEffect(() => () => stopSpeak(), []);

  if (!deck) return null;
  const lesson = deck.lesson;
  const slide = deck.slides[i];
  const isLast = i === total - 1;

  if (done)
    return (
      <div className="page practice">
        <section className="panel lp-done">
          <p className="eyebrow">
            <Trophy size={15} /> 这节课上完了
          </p>
          <h1 className="display">{lesson.title}</h1>
          <p className="lede">
            {total} 页讲义看完 · {lesson.en}。现在去做配套练习，把刚才听的变成会做的。
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              回教室
            </button>
            {lesson.drills.length > 0 && (
              <button className="btn btn-primary btn-xl" onClick={() => onDrill(lesson.drills[0])} autoFocus>
                去练 {DRILL_LABEL[lesson.drills[0]]} <ArrowRight size={16} />
              </button>
            )}
          </div>
          <p className="lp-done-note">已自动记入课表进度。练完会再打一次勾。</p>
        </section>
      </div>
    );

  const go = (n: number) => setI(Math.max(0, Math.min(total - 1, n)));

  return (
    <div className="page practice lp">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          <ChevronLeft size={15} /> 教室
        </button>
        <div className="learn-progress">
          <span style={{ width: `${((i + 1) / total) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{i + 1}</b> / {total} 页
        </span>
      </header>

      <section className="lp-head">
        <p className="eyebrow">
          <GraduationCap size={14} /> {lesson.en} · {level === "A2" ? "KET" : "PET"}
        </p>
        <h1 className="display">{lesson.title}</h1>
        <p className="lede">{lesson.brief}</p>
      </section>

      <SlideBody slide={slide} picked={picked[i]} onPick={(opt) => setPicked((p) => ({ ...p, [i]: opt }))} />

      <nav className="lp-nav">
        <button className="btn btn-ghost" onClick={() => go(i - 1)} disabled={i === 0}>
          <ChevronLeft size={16} /> 上一页
        </button>
        <div className="lp-dots" aria-hidden="true">
          {deck.slides.map((_, n) => (
            <i key={n} className={`${n === i ? "is-on" : ""} ${n < i ? "is-past" : ""}`} />
          ))}
        </div>
        {isLast ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setDone(true);
              onFinish();
            }}
          >
            <Check size={16} /> 上完这节课
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => go(i + 1)}>
            下一页 <ChevronRight size={16} />
          </button>
        )}
      </nav>
    </div>
  );
}

/** 一页讲义。 */
function SlideBody({
  slide,
  picked,
  onPick,
}: {
  slide: DeckSlide;
  picked?: string;
  onPick: (opt: string) => void;
}) {
  const speakable = speakText(slide);

  return (
    <section className={`panel lp-slide lp-k-${slide.k}`}>
      <div className="lp-slide-head">
        <h2>{slide.head}</h2>
        {speakable && ttsSupported() && (
          <button className="lp-speak" onClick={() => speak(speakable)} title="朗读英文">
            <Volume2 size={15} /> 朗读
          </button>
        )}
      </div>

      {slide.k === "teach" && (
        <>
          {slide.lines.map((l, n) => (
            <p key={n} className="lp-line">
              {l}
            </p>
          ))}
          {slide.formula && (
            <p className="lp-formula">
              <BookOpen size={14} /> {slide.formula}
            </p>
          )}
        </>
      )}

      {slide.k === "examples" && (
        <ul className="lp-examples">
          {slide.items.map((it, n) => (
            <li key={n}>
              <button className="lp-ex-en" onClick={() => speak(it.en)} title="朗读这句">
                {it.en} <Volume2 size={13} />
              </button>
              <small>{it.zh}</small>
            </li>
          ))}
        </ul>
      )}

      {slide.k === "steps" && (
        <ol className="lp-steps">
          {slide.items.map((it, n) => (
            <li key={n}>
              <b>{it.label}</b>
              <span>{it.text}</span>
            </li>
          ))}
        </ol>
      )}

      {slide.k === "contrast" && (
        <ul className="lp-contrast">
          {slide.rows.map((r, n) => (
            <li key={n}>
              <p className="lp-bad">
                <X size={14} /> {r.bad}
              </p>
              <p className="lp-good">
                <Check size={14} /> {r.good}
              </p>
              <small>{r.why}</small>
            </li>
          ))}
        </ul>
      )}

      {slide.k === "trap" && (
        <p className="lp-trap">
          <Lightbulb size={16} /> {slide.text}
        </p>
      )}

      {slide.k === "quiz" && (
        <div className="lp-quiz">
          <p className="lp-quiz-q">{slide.q}</p>
          <div className="lp-quiz-opts">
            {slide.options.map((opt) => {
              const chosen = picked === opt;
              const revealed = !!picked;
              const isAnswer = opt === slide.answer;
              const cls = revealed ? (isAnswer ? "is-right" : chosen ? "is-wrong" : "") : "";
              return (
                <button key={opt} className={cls} onClick={() => !revealed && onPick(opt)} disabled={revealed}>
                  {opt}
                  {revealed && isAnswer && <Check size={14} />}
                  {revealed && chosen && !isAnswer && <X size={14} />}
                </button>
              );
            })}
          </div>
          {picked && (
            <p className={`lp-why ${picked === slide.answer ? "is-ok" : ""}`}>
              {picked === slide.answer ? "对了。" : `不对，答案是 ${slide.answer}。`} {slide.why}
            </p>
          )}
        </div>
      )}

      {slide.k === "breakdown" && (
        <div className="lp-bd">
          <p className="lp-bd-tag">
            <ListChecks size={14} /> {slide.tag}
          </p>
          <p className="lp-bd-stem">{slide.stem}</p>
          {slide.options && (
            <ul className="lp-bd-opts">
              {slide.options.map((o, n) => (
                <li key={n} className={o === slide.answer ? "is-key" : ""}>
                  <span>{o}</span>
                  {o === slide.answer && <Check size={13} />}
                </li>
              ))}
            </ul>
          )}
          <ol className="lp-bd-steps">
            {slide.steps.map((s, n) => (
              <li key={n}>
                <b>{s.label}</b>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {slide.k === "words" && <WordTable topic={slide.topic} cefr={slide.cefr} picks={slide.picks} note={slide.note} />}

      {slide.k === "recap" && (
        <>
          <ul className="lp-recap">
            {slide.points.map((p, n) => (
              <li key={n}>
                <ListChecks size={15} /> {p}
              </li>
            ))}
          </ul>
          <p className="lp-next">下一步：{slide.next}</p>
        </>
      )}
    </section>
  );
}

/** 主题词表：直接从图鉴按 topic 抽词，和词库永远一致。 */
function WordTable({
  topic,
  cefr,
  picks,
  note,
}: {
  topic: number;
  cefr?: "A1" | "A2" | "B1" | "B2";
  picks?: string[];
  note?: string;
}) {
  const atlas = useAtlas();
  const topicName = atlas.topics[topic]?.[1] ?? "";
  const words = useMemo(() => {
    const same = atlas.words.filter((w) => w.topic === topic);
    const ci = cefr ? atlas.cefr.indexOf(cefr) : -1;
    const tier = ci >= 0 ? same.filter((w) => w.cefr === ci) : [];
    const pool = tier.length >= 6 ? tier : same;
    const byWord = new Map(pool.map((w) => [w.word.toLowerCase(), w]));
    // 人工精选优先（按教学价值排），缺的再从同主题补齐。
    // 精选要到「整个主题」里找，不能只在同级别池里找——基础词重新标成 A1 之后，
    // 像 apple / water 这类精选词就不在同级别的池子里了，会被静默丢掉。
    const anyWord = new Map(same.map((w) => [w.word.toLowerCase(), w]));
    const hand = (picks ?? [])
      .map((p) => anyWord.get(p.toLowerCase()) ?? byWord.get(p.toLowerCase()))
      .filter((w): w is WordRef => !!w);
    const rest = pool.filter((w) => !hand.some((h) => h.id === w.id));
    const out = [...hand];
    for (const w of rest) {
      if (out.length >= 12) break;
      out.push(w);
    }
    return out.slice(0, 12);
  }, [atlas, topic, cefr, picks]);

  const say = (w: WordRef) => void play(atlas.audio(w, "uk"), w.word, "uk");

  return (
    <div className="lp-words">
      {note && <p className="lp-words-note">{note}</p>}
      <p className="lp-words-meta">
        从图鉴的「{topicName}」里挑了 {words.length} 个{cefr ? ` ${cefr} ` : ""}高频词，点词听发音。
      </p>
      <ul className="lp-word-grid">
        {words.map((w) => (
          <li key={w.id}>
            <button className="lp-word" onClick={() => say(w)}>
              <b>{w.word}</b>
              <small>{w.ipa}</small>
              <span>{w.zh}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 一页里适合朗读的英文文本（中文页不朗读）。 */
function speakText(s: DeckSlide): string {
  if (s.k === "examples") return s.items.map((i) => i.en).join(" ");
  if (s.k === "contrast") return s.rows.map((r) => r.good).join(" ");
  if (s.k === "quiz") return `${s.q.replace(/___/g, "blank")}. ${s.options.join(". ")}`;
  if (s.k === "breakdown") return `${s.stem.replace(/___/g, "blank")}. ${s.answer}`;
  return "";
}
