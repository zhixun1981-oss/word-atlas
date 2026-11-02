import { ArrowRight, Check, GraduationCap, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ExamQuestion } from "../exam/generate";
import { cue } from "../lib/sound";
import { useStore } from "../store/store";

const TIER_ORDER: { lvl: string; label: string; count: number }[] = [
  { lvl: "A1", label: "A1 入门", count: 8 },
  { lvl: "A2", label: "A2 基础", count: 8 },
  { lvl: "B1", label: "B1 进阶", count: 8 },
];

/** Estimated vocabulary size per CEFR tier (Cambridge-style calibration). */
const SIZE: Record<string, number> = { A1: 800, A2: 2000, B1: 3000 };

export function PlacementRound({ questions, onExit, onAgain }: { questions: ExamQuestion[]; onExit: () => void; onAgain: () => void }) {
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ q: ExamQuestion; ok: boolean }[]>([]);
  const q = questions[i];

  const choose = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
  };

  const next = () => {
    const cur = [...answers, { q, ok: picked === q.answer }];
    setAnswers(cur);
    setPicked(null);
    if (cur.length >= questions.length) return;
    setI(i + 1);
  };

  const done = answers.length >= questions.length;
  const report = useMemo(() => {
    const tiers = TIER_ORDER.map((t) => {
      const qs = answers.filter((a) => a.q.cefr === t.lvl);
      return { ...t, ok: qs.filter((a) => a.ok).length, n: qs.length };
    });
    const a1 = tiers[0],
      a2 = tiers[1],
      b1 = tiers[2];
    const okA1 = a1.n ? a1.ok / a1.n : 0;
    const okA2 = a2.n ? a2.ok / a2.n : 0;
    const okB1 = b1.n ? b1.ok / b1.n : 0;
    let level: string, size: number, advice: string;
    if (okA1 < 0.6) {
      level = "未达 KET";
      size = Math.round(SIZE.A1 * okA1);
      advice = "基础还没打牢。先把 A1 词汇系统过一遍，再回来测一次。";
    } else if (okB1 >= 0.85) {
      level = "PET 冲高分";
      size = SIZE.B1;
      advice = "词汇量扎实，可以直接备考 PET，甚至可以挑战更高目标。";
    } else if (okB1 >= 0.6) {
      level = "PET（B1）";
      size = SIZE.B1;
      advice = "词汇量约 3,000，符合 PET 的词汇要求，可以按 PET 备考。";
    } else if (okA2 >= 0.6) {
      level = "KET（A2）";
      size = SIZE.A2;
      advice = "词汇量约 2,000，达到 KET 词汇门槛，先把 KET 考扎实再冲 PET。";
    } else {
      level = "KET 备考中";
      size = Math.round(SIZE.A2 * okA2);
      advice = "接近 KET 门槛但还差一点，把 A2 词汇补齐后就能备考 KET。";
    }
    const wrong = answers.filter((a) => !a.ok);
    const topicCount = new Map<string, number>();
    for (const a of wrong) topicCount.set(a.q.topic, (topicCount.get(a.q.topic) ?? 0) + 1);
    const weak = [...topicCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { tiers, level, size, advice, weak, total: answers.length, correct: answers.filter((a) => a.ok).length };
  }, [answers]);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done placement-report">
          <p className="eyebrow">
            <GraduationCap size={14} /> 摸底测试 · 结果
          </p>
          <h1 className="display">
            {report.size.toLocaleString()}
            <small>词汇量（估）</small>
          </h1>
          <p className="lede">
            建议报考：<b className="is-ok">{report.level}</b>
          </p>
          <p className="muted">答对 {report.correct}/{report.total} 题 · {report.advice}</p>
          <div className="mock-kind">
            {report.tiers.map((t) => (
              <span key={t.lvl}>
                {t.label} <b>{t.ok}/{t.n}</b>
              </span>
            ))}
          </div>
          {report.weak.length > 0 && (
            <p className="muted placement-weak">
              薄弱话题：{report.weak.map(([t, n]) => `${t} ×${n}`).join("、")}
            </p>
          )}
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再测一次
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
          <span style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{i + 1}</b>/{questions.length}
        </span>
      </header>
      <section className="exam-stage">
        <p className="eyebrow">
          <GraduationCap size={14} /> 摸底测试 · 第 {i + 1} 题 · {q.cefr} 级
        </p>
        <p className="exam-hint">看英文释义，选出对应的词。难度会逐渐上升。</p>
        <div className="exam-def">
          <span className="pos">{q.pos}</span>
          <p lang="en">{q.gloss}</p>
        </div>
        <div className="exam-options">
          {q.options.map((opt) => {
            const isAnswer = opt === q.answer;
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
          <div className={`exam-feedback ${picked === q.answer ? "is-ok" : "is-bad"}`}>
            <p lang="en">
              <b>{q.w}</b> {q.zh}
            </p>
            <button className="btn btn-primary btn-xl" onClick={next}>
              {answers.length + 1 >= questions.length ? "看结果" : "下一题"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
