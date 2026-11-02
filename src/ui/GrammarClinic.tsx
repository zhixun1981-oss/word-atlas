import { ArrowLeft, ArrowRight, BookOpen, Check, Lightbulb, RotateCcw, Target, X } from "lucide-react";
import { useMemo, useState } from "react";
import { GRAMMAR_POINTS, type GrammarPoint } from "../exam/syllabus";
import { drillsByPoint, drillsFor, type GrammarDrill } from "../exam/grammar";
import { cue } from "../lib/sound";
import { ART } from "../lib/art";
import { store, useStore } from "../store/store";

type View = "map" | "detail" | "drill" | "done";

/** 考点地图 → 讲解 → 闯关。掌握度记在 progress.grammar。 */
export function GrammarClinic({ level, onExit }: { level?: "A2" | "B1"; onExit: () => void }) {
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const [view, setView] = useState<View>("map");
  const [point, setPoint] = useState<GrammarPoint | null>(null);
  const [queue, setQueue] = useState<GrammarDrill[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  /** 每题对错，按 queue 下标存放。 */
  const [log, setLog] = useState<boolean[]>([]);

  const points = useMemo(() => (level ? GRAMMAR_POINTS.filter((p) => p.level === level) : GRAMMAR_POINTS), [level]);
  const groups: ["A2" | "B1", string][] = [
    ["A2", "KET · A2 必备"],
    ["B1", "PET · B1 加考"],
  ];

  const correctCount = log.filter(Boolean).length;

  const mastery = (id: string) => {
    const g = progress.grammar[id];
    if (!g || g.right + g.wrong === 0) return null;
    return Math.round((g.right / (g.right + g.wrong)) * 100);
  };

  const startDrill = (p?: GrammarPoint) => {
    const q = p ? drillsByPoint(p.id) : drillsFor(points.map((x) => x.id), 10);
    if (!q.length) return;
    setQueue(q);
    setI(0);
    setPicked(null);
    setLog([]);
    setView("drill");
  };

  /** 写入掌握度并跳到结算页。 */
  const finish = (finalLog: boolean[], qs: GrammarDrill[]) => {
    const tally: Record<string, { right: number; wrong: number }> = {};
    qs.forEach((q, k) => {
      const t = (tally[q.point] ??= { right: 0, wrong: 0 });
      if (finalLog[k]) t.right += 1;
      else t.wrong += 1;
    });
    const right = finalLog.filter(Boolean).length;
    store.progress((p) => {
      const g = { ...p.grammar };
      for (const [id, t] of Object.entries(tally)) {
        const cur = g[id] ?? { right: 0, wrong: 0, at: 0 };
        g[id] = { right: cur.right + t.right, wrong: cur.wrong + t.wrong, at: Date.now() };
      }
      return {
        ...p,
        grammar: g,
        exam: [...p.exam, { at: Date.now(), kind: "grammar" as const, items: qs.length, correct: right }].slice(-500),
      };
    });
    setView("done");
  };

  const choose = (opt: string) => {
    if (picked !== null || !queue[i]) return;
    const ok = opt === queue[i].answer;
    const nextLog = [...log];
    nextLog[i] = ok;
    setLog(nextLog);
    setPicked(opt);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };

  const next = () => {
    if (i + 1 >= queue.length) finish(log, queue);
    else {
      setPicked(null);
      setI(i + 1);
    }
  };

  // ---------------- 考点地图 ----------------
  if (view === "map")
    return (
      <div className="page practice">
        <header className="typing-top">
          <button className="btn btn-ghost" onClick={onExit}>
            <ArrowLeft size={16} /> 结束
          </button>
          <span className="typing-meter">语法考点 · {points.length} 个</span>
        </header>
        <header className="page-head">
          <p className="eyebrow">语法考点地图</p>
          <h1 className="display">把考点一个个吃掉。</h1>
          <p className="lede">KET / PET 考纲里的语法点全在这儿：先看懂规则，再做题，错的会自动记进掌握度。</p>
        </header>
        <section className="round-hero">
          <div className="rh-text">
            <h2>30 个语法考点</h2>
            <p>KET/PET 考纲全覆盖：先看规则，再做题，掌握度自动累计。</p>
          </div>
          <img src={ART("school")} alt="" />
        </section>
        <section className="panel">
          <button className="btn btn-primary btn-xl" onClick={() => startDrill()}>
            <Target size={18} /> 综合闯关 · 随机 10 题
          </button>
          <p className="muted">不确定自己缺什么就先来这个，它会从所有考点里抽题。</p>
        </section>
        {groups.map(([lv, label]) => {
          const list = points.filter((p) => p.level === lv);
          if (!list.length) return null;
          return (
            <section className="panel" key={lv}>
              <h3 className="eyebrow">{label}</h3>
              <div className="gp-grid">
                {list.map((p) => {
                  const m = mastery(p.id);
                  return (
                    <button key={p.id} className="gp-card" onClick={() => { setPoint(p); setView("detail"); }}>
                      <b>{p.name}</b>
                      <span className="gp-en" lang="en">
                        {p.en}
                      </span>
                      <small>{p.where}</small>
                      <span className={`gp-bar ${m === null ? "is-new" : m >= 80 ? "is-ok" : m >= 50 ? "is-mid" : "is-bad"}`}>
                        {m === null ? "还没练" : `${m}% 掌握`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );

  // ---------------- 考点讲解 ----------------
  if (view === "detail" && point)
    return (
      <div className="page practice">
        <header className="typing-top">
          <button className="btn btn-ghost" onClick={() => setView("map")}>
            <ArrowLeft size={16} /> 返回考点地图
          </button>
          <span className="typing-meter">{point.level}</span>
        </header>
        <section className="panel gp-detail">
          <p className="eyebrow">
            {point.name} · <span lang="en">{point.en}</span>
          </p>
          <p className="gp-where">考在哪：{point.where}</p>
          <p className="gp-rule">{point.rule}</p>
          <div className="gp-formula">
            <span className="eyebrow">结构</span>
            <code lang="en">{point.formula}</code>
          </div>
          <div className="gp-examples">
            <span className="eyebrow">例句</span>
            {point.examples.map(([en, zh]) => (
              <p key={en}>
                <b lang="en">{en}</b>
                <span className="muted">{zh}</span>
              </p>
            ))}
          </div>
          <div className="gp-trap">
            <Lightbulb size={15} />{" "}
            <span>
              <b>最容易丢分的地方：</b>
              {point.trap}
            </span>
          </div>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={() => setView("map")}>
              再看看别的
            </button>
            <button className="btn btn-primary btn-xl" onClick={() => startDrill(point)} autoFocus>
              <Target size={18} /> 练这个考点（{drillsByPoint(point.id).length} 题）
            </button>
          </div>
        </section>
      </div>
    );

  // ---------------- 结算 ----------------
  if (view === "done") {
    const total = queue.length;
    const right = log.filter(Boolean).length;
    const acc = total ? Math.round((right / total) * 100) : 0;
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">{point ? `${point.name} · 本轮完成` : "综合闯关 · 本轮完成"}</p>
          <h1 className="display">
            {acc}
            <small>% 正确</small>
          </h1>
          <p className="lede">
            答对 {right}/{total} 题 · {acc >= 80 ? "这个考点稳了。" : acc >= 50 ? "再来一轮就能拿下。" : "建议先回到讲解再看一遍。"}
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              结束
            </button>
            {point && (
              <button className="btn btn-ghost" onClick={() => setView("detail")}>
                <BookOpen size={16} /> 看讲解
              </button>
            )}
            <button className="btn btn-primary btn-xl" onClick={() => startDrill(point ?? undefined)} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ---------------- 答题 ----------------
  const d = queue[i];
  if (!d) return null;
  const ok = picked === d.answer;
  return (
    <div className="page practice exam">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={() => setView(point ? "detail" : "map")}>
          <ArrowLeft size={16} /> 退出
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / queue.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{correctCount}</b> 对 · {i + 1}/{queue.length}
        </span>
      </header>
      <section className="exam-stage">
        <p className="eyebrow">{point ? point.name : "综合闯关"}</p>
        <p className="exam-hint">{d.zh}</p>
        <div className="gp-question">
          <p lang="en">{d.q.replace("___", "________")}</p>
        </div>
        <div className="exam-options">
          {d.options.map((opt) => {
            const isAnswer = opt === d.answer;
            const isPicked = picked === opt;
            const cls = picked === null ? "" : isAnswer ? "is-answer" : isPicked ? "is-wrong" : "is-dim";
            return (
              <button key={opt} className={`exam-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null} aria-pressed={isPicked}>
                {picked !== null && isAnswer && <Check size={16} />}
                {picked !== null && isPicked && !isAnswer && <X size={16} />}
                <b lang="en">{opt}</b>
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${ok ? "is-ok" : "is-bad"}`}>
            <p>
              {ok ? (
                "答对了。"
              ) : (
                <>
                  正确答案：<b lang="en">{d.answer}</b>
                </>
              )}
            </p>
            <p className="muted">{d.why}</p>
            <button className="btn btn-primary btn-xl" onClick={next} autoFocus>
              {i + 1 >= queue.length ? "看结果" : "下一题"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
