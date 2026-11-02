import { ArrowRight, Check, Clock, GraduationCap, PenLine, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { generateExam, type ExamQuestion } from "../exam/generate";
import { DIALOGUES, type DialogueItem } from "../exam/dialogues";
import { CLOZE_TEXTS, clozeMatch, splitCloze, type ClozeText } from "../exam/opencloze";
import { MATCH_ITEMS, type MatchItem } from "../exam/readingMatch";
import { signsFor, type SignItem } from "../exam/signs";
import { WRITING_BANK, checkWriting, type WritingItem } from "../exam/writing";
import { reviewWriting, type WritingReview } from "../exam/writingReview";
import { pickModel } from "../lib/llm";
import { play } from "../lib/audio";
import { cue } from "../lib/sound";
import { hashSeed, shuffle } from "../lib/text";
import { store, useStore, type ExamRound } from "../store/store";

type Phase = "reading" | "writing" | "listening" | "report";

const SIGN_TONE: Record<SignItem["tone"], string> = {
  red: "禁止类",
  blue: "指示类",
  green: "允许 / 安全",
  amber: "提示类",
  grey: "其他",
};

const KIND_LABEL: Record<ExamQuestion["kind"], string> = {
  cloze: "完形",
  definition: "释义",
  picture: "看图",
  listen: "听力",
};

/** 演示用总限时。真实 KET 阅读写作约 60 分钟、PET 约 90 分钟，这里压缩。 */
const TOTAL_SECONDS = 30 * 60;

type RNode =
  | { kind: "sign"; item: SignItem }
  | { kind: "match"; item: MatchItem }
  | { kind: "choice"; q: ExamQuestion };

/** 成绩单上的能力分块。评卷时逐题打点，报告按块汇总——只给总分等于没说。 */
type Skill = "sign" | "match" | "definition" | "cloze" | "picture" | "opencloze" | "listen";

const SKILLS: { id: Skill; name: string; hint: string; where: string; lesson?: string; href?: string }[] = [
  { id: "sign", name: "标识识别", hint: "同义替换没过关：别逐字翻，先找告示的「目的」", where: "阅读 · Part 1 标识识别", lesson: "read-sign" },
  { id: "match", name: "信息配对", hint: "限定词漏读：三个人各自的时间、价格、喜好要一条条划掉", where: "阅读 · Part 2 信息配对", lesson: "read-match" },
  { id: "definition", name: "释义选词", hint: "词认识但英英释义读不顺：回去补词条的第二义项", where: "练习 · 释义选词", href: "#/practice" },
  { id: "cloze", name: "语境选词", hint: "只看了空格本身：前后半句的搭配词才是线索", where: "练习 · 完形填空", href: "#/practice" },
  { id: "picture", name: "看图选词", hint: "场景词储备不够：去「图鉴」按主题刷一遍图", where: "图鉴 · 按主题浏览", href: "#/atlas" },
  { id: "opencloze", name: "开放填空", hint: "语法小词不稳：冠词、介词、代词、be 动词这四个占八成", where: "阅读 · Part 5 开放填空", lesson: "read-opencloze" },
  { id: "listen", name: "听力选择", hint: "没提前扫选项：先看清三个选项差在哪，再听", where: "听力 · Part 1 图片选择", lesson: "listen-1" },
];

const nodeSkill = (n: RNode): Skill =>
  n.kind === "sign" ? "sign" : n.kind === "match" ? "match" : (n.q.kind as Skill);

/**
 * 全真模拟卷：按 KET/PET 真实卷面结构串成一整卷。
 *
 * Reading（标识识别 → 信息配对 → 速测混合 → 开放填空）→ Writing（写作 + 规则批改）
 * → Listening（听力选择）→ 分项成绩单。
 *
 * 题源为格式同款的「同源模拟题」，非剑桥官方往年真题原文。
 * 口语（Speaking）另走「口语模考」入口，本卷末会提示。
 */
export function MockRound({ level, onExit, onAgain }: { level: "A2" | "B1"; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const cefrIdx = atlas.cefr.indexOf(level);
      // 该级别的词全池随机抽，而不是固定取前 400 个——否则每次模考都是同一批词。
      const ids = shuffle(
        atlas.words.filter((w) => w.cefr === cefrIdx && atlas.byId.has(w.id)).map((w) => w.id),
        hashSeed(String(Date.now())),
      ).slice(0, 400);
      const list = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
      if (alive) {
        setEntries(list);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [atlas, level]);

  const nodes = useMemo<RNode[]>(() => {
    const signs = signsFor(level).slice(0, 5).map((item) => ({ kind: "sign" as const, item }));
    const matches = MATCH_ITEMS.slice(0, 5).map((item) => ({ kind: "match" as const, item }));
    const pool = [
      // 之前只出 3+3+2=8 道选择题，一张「限时模考」十来分钟就完了。
      // 提到 5+5+3=13 道，加上标识/匹配/完形/写作/听力，卷子才像一张卷子。
      ...generateExam(atlas, entries, "definition", 5),
      ...generateExam(atlas, entries, "cloze", 5),
      ...generateExam(atlas, entries, "picture", 3),
    ].map((q) => ({ kind: "choice" as const, q }));
    return [...signs, ...matches, ...pool];
  }, [atlas, entries, level]);

  const cloze = useMemo<ClozeText>(() => CLOZE_TEXTS.find((c) => c.level === level) ?? CLOZE_TEXTS[0], [level]);
  const writing = useMemo<WritingItem>(() => WRITING_BANK.find((w) => w.level === level) ?? WRITING_BANK[0], [level]);
  // 听力用整段对话，不是单句拼接。真实考试考的是「在一段话里抓住某个信息」，
  // 一句一句听写练的是别的东西。
  const dlg = useMemo<DialogueItem[]>(() => {
    const same = DIALOGUES.filter((d) => d.level === level);
    const pool = same.length >= 5 ? same : DIALOGUES;
    return shuffle(pool, hashSeed(String(Date.now()))).slice(0, 5);
  }, [level]);

  const [phase, setPhase] = useState<Phase>("reading");
  const [stage, setStage] = useState<"nodes" | "cloze">("nodes");
  const [ri, setRi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [rCorrect, setRCorrect] = useState(0);

  const clozeParts = useMemo(() => splitCloze(cloze.body), [cloze]);
  const blanks = cloze.answers.length;
  const [vals, setVals] = useState<string[]>(() => Array(cloze.answers.length).fill(""));
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeCorrect, setClozeCorrect] = useState(0);

  const [wText, setWText] = useState("");
  const [wScore, setWScore] = useState<number | null>(null);
  /** 考完再精批作文：限时中不给模型 20 秒的机会，等出成绩单再说。 */
  const [wReview, setWReview] = useState<WritingReview | null>(null);
  const [wReviewing, setWReviewing] = useState(false);
  const [wModel, setWModel] = useState<string | null>(null);

  const [li, setLi] = useState(0);
  const [lpicked, setLpicked] = useState<string | null>(null);
  const [lCorrect, setLCorrect] = useState(0);

  // 逐题打点：{题型, 对错}。成绩单靠它算出「哪块在掉分」。
  const [log, setLog] = useState<{ s: Skill; ok: boolean }[]>([]);
  const mark = (s: Skill, ok: boolean) => setLog((l) => [...l, { s, ok }]);

  const [left, setLeft] = useState(TOTAL_SECONDS);
  useEffect(() => {
    const t = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === 0 && phase !== "report") setPhase("report");
  }, [left, phase]);

  const node = nodes[ri];
  const nodeAnswer =
    node?.kind === "sign"
      ? node.item.answer
      : node?.kind === "match"
        ? node.item.options[node.item.answer]
        : node?.q.answer;
  const nodeOptions = node?.kind === "sign" ? node.item.options : node?.kind === "match" ? node.item.options : node?.q.options ?? [];

  const answerNode = (opt: string) => {
    if (!node || picked !== null) return;
    setPicked(opt);
    const ok = opt === nodeAnswer;
    if (ok) setRCorrect((c) => c + 1);
    mark(nodeSkill(node), ok);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };

  const nextNode = () => {
    setPicked(null);
    if (ri + 1 < nodes.length) setRi(ri + 1);
    else setStage("cloze");
  };

  const checkCloze = () => {
    const ok = vals.filter((v, i) => clozeMatch(v, cloze.answers[i])).length;
    setClozeCorrect(ok);
    setClozeChecked(true);
    // 每个空单独记一笔，别把整段当一个点。
    setLog((l) => [...l, ...vals.map((v, i) => ({ s: "opencloze" as Skill, ok: clozeMatch(v, cloze.answers[i]) }))]);
    if (settings.sfx) void cue(ok === blanks ? "correct" : "wrong");
  };

  const finishWriting = () => {
    const r = checkWriting(wText, writing);
    setWScore(r.score);
    setPhase("listening");
  };

  // 出成绩单后才去找本地模型：限时里等 20 秒会毁掉整卷节奏。
  useEffect(() => {
    if (phase !== "report" || wModel) return;
    let alive = true;
    void pickModel().then((m) => alive && setWModel(m));
    return () => {
      alive = false;
    };
  }, [phase, wModel]);

  const reviewEssay = async () => {
    if (!wText.trim()) return;
    setWReviewing(true);
    try {
      const r = await reviewWriting(wText, writing, { model: wModel ?? undefined });
      setWReview(r);
      // 用四维分取代规则分：规则那套只看字数和要点，语言维度是 0 分的盲区。
      setWScore(r.score);
    } catch {
      /* 模型没起来就保持规则分，不打断成绩单 */
    } finally {
      setWReviewing(false);
    }
  };

  const answerListen = (opt: string) => {
    if (lpicked !== null) return;
    setLpicked(opt);
    const ok = opt === dlg[li].options[dlg[li].answer];
    if (ok) setLCorrect((c) => c + 1);
    mark("listen", ok);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };
  const nextListen = () => {
    setLpicked(null);
    if (li + 1 < dlg.length) setLi(li + 1);
    else setPhase("report");
  };

  const readingTotal = nodes.length + blanks;
  const readingCorrect = rCorrect + clozeCorrect;
  const readingPct = readingTotal ? Math.round((readingCorrect / readingTotal) * 100) : 0;
  const listeningPct = dlg.length ? Math.round((lCorrect / dlg.length) * 100) : 0;
  const writingPct = wScore ?? 0;
  const overall = Math.round((readingPct + writingPct + listeningPct) / 3);
  const scale = Math.round(120 + (overall / 100) * 50);

  // 按题型汇总。只保留真正考到的块，空块不占版面。
  const breakdown = SKILLS.map((sk) => {
    const hits = log.filter((x) => x.s === sk.id);
    const right = hits.filter((x) => x.ok).length;
    return { ...sk, total: hits.length, right, pct: hits.length ? Math.round((right / hits.length) * 100) : -1 };
  })
    .filter((x) => x.total > 0)
    .sort((a, b) => a.pct - b.pct);
  const bleeding = breakdown.filter((x) => x.pct < 60);

  useEffect(() => {
    if (phase !== "report") return;
    const rec: ExamRound = {
      at: Date.now(),
      kind: "mock",
      items: readingTotal + dlg.length + 1,
      correct: readingCorrect + lCorrect,
      score: overall,
    };
    store.progress((p) => ({ ...p, exam: [...p.exam, rec].slice(-500) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const progressPct =
    phase === "reading" ? (stage === "cloze" ? 30 : (ri / Math.max(1, nodes.length)) * 30) : phase === "writing" ? 55 : phase === "listening" ? 80 : 100;

  if (loading)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">正在生成全真模拟卷…</p>
          <p className="lede">按 {level === "A2" ? "KET" : "PET"} 卷面结构加载题目，请稍候。</p>
        </section>
      </div>
    );

  if (phase === "report")
    return (
      <div className="page practice">
        <section className="panel typing-done mock-report">
          <p className="eyebrow">
            <GraduationCap size={14} /> {level === "A2" ? "KET（A2）" : "PET（B1）"} 全真模拟卷 · 成绩单
          </p>
          <h1 className="display">
            {scale}
            <small>分</small>
          </h1>
          <p className="lede">总分 {overall}/100 · 剑桥 170 分制粗估（仅供参考）</p>
          <div className="paper-scores">
            <div>
              <span>Reading</span>
              <b>{readingPct}%</b>
              <small>
                {readingCorrect}/{readingTotal} 题
              </small>
            </div>
            <div>
              <span>Writing</span>
              <b>{writingPct}%</b>
              <small>字数 + 要点批改</small>
            </div>
            <div>
              <span>Listening</span>
              <b>{listeningPct}%</b>
              <small>
                {lCorrect}/{dlg.length} 题
              </small>
            </div>
          </div>
          <p className="paper-note">口语（Speaking）请到「口语模考」里完成，四项合起来才是完整成绩。</p>

          {wText.trim().length > 0 && (
            <section className="mock-write-review">
              {wReview ? (
                <>
                  <h3 className="eyebrow">写作 · 四维精批</h3>
                  <div className="wr-head">
                    <p className="wr-score">
                      <b>{wReview.dims.reduce((n, d) => n + d.score, 0)}</b>
                      <small>/ 20</small>
                    </p>
                    <ul className="wr-dims">
                      {wReview.dims.map((d) => (
                        <li key={d.key}>
                          <span className="wr-dim-name">{d.name}</span>
                          <span className="wr-dim-bar" aria-hidden="true">
                            <i style={{ width: `${(d.score / 5) * 100}%` }} />
                          </span>
                          <b className="wr-dim-num">{d.score}/5</b>
                          {d.note && <small className="wr-dim-note">{d.note}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {wReview.errors.length > 0 && (
                    <ul className="ai-mark-errors">
                      {wReview.errors.map((e, i) => (
                        <li key={i}>
                          <span className="ai-wrong" lang="en">
                            {e.wrong}
                          </span>
                          <span className="ai-arrow">→</span>
                          <span className="ai-right" lang="en">
                            {e.right}
                          </span>
                          {e.why && <small>{e.why}</small>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {wReview.tip && <p className="ai-mark-tip">下次记住：{wReview.tip}</p>}
                </>
              ) : wReviewing ? (
                <p className="muted ai-mark-wait">AI 老师在读这篇作文…（跑在你自己的电脑上，约 10–20 秒）</p>
              ) : wModel ? (
                <button className="btn btn-ghost" onClick={() => void reviewEssay()}>
                  <Sparkles size={15} /> 让 AI 精批这篇作文
                </button>
              ) : (
                <p className="muted">
                  写作分现在只算了字数和要点。想让它连语法和用词一起判，先跑 <code>OLLAMA_ORIGINS="*" ollama serve</code>。
                </p>
              )}
            </section>
          )}

          {breakdown.length > 0 && (
            <section className="mock-weak">
              <h3 className="eyebrow">{bleeding.length ? "哪块在掉分" : "没有明显短板，接着练速度"}</h3>
              <ul className="weak-bars">
                {(bleeding.length ? bleeding : breakdown.slice(0, 3)).slice(0, 4).map((x) => (
                  <li key={x.id} className={x.pct < 60 ? "is-low" : ""}>
                    <div className="wb-head">
                      <span className="wb-name">{x.name}</span>
                      <span className="wb-num">
                        {x.right}/{x.total} · {x.pct}%
                      </span>
                    </div>
                    <div className="wb-bar">
                      <i style={{ width: `${x.pct}%` }} />
                    </div>
                    <p className="wb-hint">
                      {x.hint}
                      {x.lesson ? (
                        <a className="wb-go" href={`#/classroom?lesson=${level === "A2" ? "k" : "p"}-${x.lesson}`}>
                          教室 › {x.where}
                        </a>
                      ) : (
                        <a className="wb-go" href={x.href}>
                          {x.where}
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="wb-foot">
                按正确率从低到高排的。这一卷共 {log.length} 题，其中 {log.filter((x) => x.ok).length} 题对
                {bleeding.length > 4 ? `；除上面四块，还有 ${bleeding.length - 4} 块不到 60%` : ""}。
              </p>
            </section>
          )}
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一套
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice exam">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <span className={`typing-meter mock-timer ${left <= 60 ? "is-low" : ""}`}>
          <Clock size={14} /> {mm}:{ss}
        </span>
      </header>

      {phase === "reading" && stage === "nodes" && node && (
        <section className="exam-stage">
          <p className="eyebrow">
            <GraduationCap size={14} /> Reading ·{" "}
            {node.kind === "sign" ? "Part 1 标识" : node.kind === "match" ? "Part 2 信息配对" : `Part 3 ${KIND_LABEL[node.q.kind]}`} · 第 {ri + 1}/
            {nodes.length}
          </p>

          {node.kind === "sign" && (
            <>
              <p className="exam-hint">看告示牌，选出它在说什么。这是 KET / PET 阅读第一题的同源模拟题。</p>
              <div className={`sign-board tone-${node.item.tone}`} role="img" aria-label={node.item.sign}>
                <span className="sign-tone">{SIGN_TONE[node.item.tone]}</span>
                <span className="sign-text">{node.item.sign}</span>
              </div>
              <p className="sign-question">{node.item.question}</p>
            </>
          )}

          {node.kind === "match" && (
            <>
              <p className="exam-hint">读这个人的需求，选出最匹配的一条告示。</p>
              <div className="reading-need">
                <p lang="en">{node.item.need}</p>
                <p className="muted">{node.item.needZh}</p>
              </div>
            </>
          )}

          {node.kind === "choice" && (
            <>
              <p className="exam-hint">
                {node.q.kind === "cloze"
                  ? "读句子，选出最合适的词。"
                  : node.q.kind === "definition"
                    ? "看英文释义，选出对应的词。"
                    : "看图，选出描述这幅图的词。"}
              </p>
              {node.q.kind === "cloze" && node.q.cloze && (
                <div className="exam-cloze">
                  <p lang="en">
                    {node.q.cloze.before}
                    <span className="exam-gap">____</span>
                    {node.q.cloze.after}
                  </p>
                  {node.q.cloze.zh && <p className="muted">{node.q.cloze.zh}</p>}
                </div>
              )}
              {node.q.kind === "definition" && (
                <div className="exam-def">
                  <span className="pos">{node.q.pos}</span>
                  <p lang="en">{node.q.gloss}</p>
                </div>
              )}
              {node.q.kind === "picture" && node.q.image && (
                <div className="exam-picture">
                  <img src={node.q.image} alt="插画" draggable={false} />
                </div>
              )}
            </>
          )}

          <div className={`exam-options ${nodeOptions.length === 3 ? "is-triple" : ""}`}>
            {nodeOptions.map((opt) => {
              const isAnswer = opt === nodeAnswer;
              const isPicked = picked === opt;
              const cls = picked === null ? "" : isAnswer ? "is-answer" : isPicked ? "is-wrong" : "is-dim";
              return (
                <button key={opt} className={`exam-opt ${cls}`} onClick={() => answerNode(opt)} disabled={picked !== null} aria-pressed={isPicked}>
                  {picked !== null && isAnswer && <Check size={16} />}
                  {picked !== null && isPicked && !isAnswer && <X size={16} />}
                  <b lang={node.kind === "choice" ? "en" : undefined}>{opt}</b>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className={`exam-feedback ${picked === nodeAnswer ? "is-ok" : "is-bad"}`}>
              <p>
                {node.kind === "sign" ? node.item.zh : node.kind === "match" ? node.item.why : <><b lang="en">{node.q.w}</b> {node.q.zh}</>}
              </p>
              <button className="btn btn-primary btn-xl" onClick={nextNode}>
                {ri + 1 >= nodes.length ? "继续填空" : "下一题"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "reading" && stage === "cloze" && (
        <section className="exam-stage">
          <p className="eyebrow">
            <GraduationCap size={14} /> Reading · Part 5 开放填空 · {cloze.level}
          </p>
          <p className="exam-hint">读短文，把每个空填上一个词。挖掉的多是冠词、介词、连词这类虚词。</p>
          <div className="mock-cloze" lang="en">
            {clozeParts.map((part, i) => (
              <Fragment key={i}>
                <span>{part}</span>
                {i < blanks && (
                  <input
                    className={`mock-gap ${clozeChecked ? (clozeMatch(vals[i], cloze.answers[i]) ? "is-ok" : "is-bad") : ""}`}
                    value={vals[i] ?? ""}
                    onChange={(e) => {
                      const n = [...vals];
                      n[i] = e.target.value;
                      setVals(n);
                    }}
                    disabled={clozeChecked}
                    aria-label={`第 ${i + 1} 空`}
                  />
                )}
              </Fragment>
            ))}
          </div>
          {clozeChecked && (
            <div className="mock-cloze-notes">
              <p>
                答对 {clozeCorrect}/{blanks} 空
              </p>
              <ol>
                {cloze.answers.map((a, i) => (
                  <li key={i}>
                    <b lang="en">{a}</b> · {cloze.notes[i]}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className={`exam-feedback ${clozeChecked ? "is-ok" : ""}`} style={{ marginTop: 12 }}>
            {!clozeChecked ? (
              <button className="btn btn-primary btn-xl" onClick={checkCloze} disabled={vals.some((v) => !v.trim())}>
                核对答案
              </button>
            ) : (
              <button className="btn btn-primary btn-xl" onClick={() => setPhase("writing")}>
                进入写作 <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      )}

      {phase === "writing" && (
        <section className="exam-stage">
          <p className="eyebrow">
            <PenLine size={14} /> Writing · {writing.title}
          </p>
          <div className="mock-write-prompt">
            <p lang="en">{writing.prompt}</p>
            <p className="muted">{writing.zh}</p>
            <p className="mock-wordcount">要求 ≥ {writing.minWords} 词</p>
          </div>
          <textarea className="mock-write-box" value={wText} onChange={(e) => setWText(e.target.value)} placeholder="在这里用英文写作…" rows={8} />
          <p className="muted">{wText.trim().split(/\s+/).filter(Boolean).length} 词</p>
          <div className="mock-write-actions">
            <button className="btn btn-primary btn-xl" onClick={finishWriting}>
              提交，进入听力 <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {phase === "listening" && dlg[li] && (
        <section className="exam-stage">
          <p className="eyebrow">
            <Volume2 size={14} /> Listening · 第 {li + 1}/{dlg.length} · {dlg[li].level} 对话
          </p>
          <p className="exam-hint">先听完整段对话，再回答问题。真实考试每段听两遍。</p>
          <div className="mock-listen-bar">
            <button
              className="btn btn-primary btn-xl"
              onClick={() => void play(`${import.meta.env.BASE_URL}${dlg[li].audio}`, "", settings.accent)}
            >
              <Volume2 size={18} /> 听对话
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => void play(`${import.meta.env.BASE_URL}${dlg[li].audio}`, "", settings.accent)}
            >
              <RotateCcw size={15} /> 再听一遍
            </button>
          </div>
          <p className="dialogue-question" lang="en">
            {dlg[li].question}
          </p>
          <div className="exam-options">
            {dlg[li].options.map((opt, idx) => {
              const isAnswer = idx === dlg[li].answer;
              const isPicked = lpicked === opt;
              const cls = lpicked === null ? "" : isAnswer ? "is-answer" : isPicked ? "is-wrong" : "is-dim";
              return (
                <button key={opt} className={`exam-opt ${cls}`} onClick={() => answerListen(opt)} disabled={lpicked !== null} aria-pressed={isPicked}>
                  {lpicked !== null && isAnswer && <Check size={16} />}
                  {lpicked !== null && isPicked && !isAnswer && <X size={16} />}
                  <b lang="en">{opt}</b>
                </button>
              );
            })}
          </div>
          {lpicked !== null && (
            <div className={`exam-feedback ${lpicked === dlg[li].options[dlg[li].answer] ? "is-ok" : "is-bad"}`}>
              <p className="eyebrow">原文</p>
              <div className="dialogue-script">
                {dlg[li].script.map(([sp, text], k) => (
                  <p key={k}>
                    <b>{sp}</b> <span lang="en">{text}</span>
                  </p>
                ))}
              </div>
              <button className="btn btn-primary btn-xl" onClick={nextListen}>
                {li + 1 >= dlg.length ? "看成绩单" : "下一题"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
