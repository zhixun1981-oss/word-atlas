import { Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { chatJSON } from "../lib/llm";

/** AI 无限题库：本地 LLM 按考纲动态出题（完形 / 释义），作答即评。 */

interface AiQ {
  prompt: string;
  options: string[];
  answer: number;
  why: string;
}

interface AiQuizPack {
  questions: AiQ[];
}

const SYSTEM =
  "You are a Cambridge KET/PET vocabulary test writer. Output ONLY JSON: " +
  '{"questions":[{"prompt":"...","options":["choice1","choice2","choice3","choice4"],"answer":0,"why":"中文解析"}]}. ' +
  "options must be 4 REAL English words or phrases. NEVER use placeholders like a, b, c, d. " +
  "Each option must be a DIFFERENT word from the others. " +
  "answer is the index of the correct option. why is 简体中文, under 15 characters.";

export function AiQuiz({ onExit }: { onExit: () => void }) {
  const [level, setLevel] = useState<"ket" | "pet">("ket");
  const [kind, setKind] = useState<"cloze" | "definition">("cloze");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qs, setQs] = useState<AiQ[]>([]);
  const [picked, setPicked] = useState<number[]>([]);

  const gen = useCallback(async () => {
    setBusy(true);
    setError("");
    setPicked([]);
    try {
      const lvl = level === "ket" ? "A2 (KET)" : "B1 (PET)";
      const kindDesc =
        kind === "cloze"
          ? "a cloze question: one natural English sentence with ONE word missing (write the sentence with ____ in place of the missing word), 4 options, only one fits the sentence grammatically and naturally"
          : "a definition question: an English definition written in simple words (NOT using the target word itself), 4 word options, pick the word that matches the definition";
      const p = await chatJSON<AiQuizPack>(
        [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `Level: ${lvl}. Kind: ${kindDesc}. ` +
              `Write 4 questions. The words should be common Cambridge ${level === "ket" ? "A1-A2" : "B1"} vocabulary. ` +
              `Shuffle options so the correct one is NOT always first.`,
          },
        ],
        { temperature: 0.6, maxTokens: 900 },
      );
      if (!p?.questions?.length) throw new Error("bad-json");
      setQs(p.questions.slice(0, 4));
    } catch {
      setError("出题失败。确认本地 Ollama 在跑，或换一档难度再试。");
    } finally {
      setBusy(false);
    }
  }, [level, kind]);

  const answered = picked.filter((p) => p >= 0).length;
  const correct = picked.filter((p, i) => p === qs[i]?.answer).length;

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${qs.length ? ((answered / qs.length) * 100).toFixed(0) : 0}%` }} />
        </div>
        <span className="typing-meter">
          <Sparkles size={14} /> AI 出题
        </span>
      </header>

      <section className="typing-stage">
        <div className="ai-quiz-head">
          <p className="eyebrow">
            <Sparkles size={14} /> AI 随堂测 · 本地生成，永不重题
          </p>
          <div className="segmented" role="group" aria-label="考纲">
            <button className={level === "ket" ? "is-on" : ""} onClick={() => setLevel("ket")}>
              KET 考纲
            </button>
            <button className={level === "pet" ? "is-on" : ""} onClick={() => setLevel("pet")}>
              PET 考纲
            </button>
          </div>
          <div className="segmented" role="group" aria-label="题型">
            <button className={kind === "cloze" ? "is-on" : ""} onClick={() => setKind("cloze")}>
              完形填空
            </button>
            <button className={kind === "definition" ? "is-on" : ""} onClick={() => setKind("definition")}>
              释义选词
            </button>
          </div>
          <div className="summary-actions">
            <button className="btn btn-primary btn-xl" onClick={() => void gen()} disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {busy ? "正在出题…" : qs.length ? "换一批题" : "生成 4 道题"}
            </button>
          </div>
          {error && <p className="ai-error">{error}</p>}
          {busy && <p className="muted ai-mark-wait">本地模型正在出题…（约 10–20 秒）</p>}
        </div>

        {qs.length > 0 && (
          <div className="ai-quiz-list">
            {qs.map((q, i) => {
              const has = picked[i] >= 0;
              const right = has && picked[i] === q.answer;
              return (
                <div key={i} className={`ai-q ${has ? (right ? "is-right" : "is-wrong") : ""}`}>
                  <p className="ai-q-prompt" lang="en">
                    <b>{i + 1}.</b> {q.prompt}
                  </p>
                  <div className="ai-q-opts">
                    {q.options.map((o, oi) => {
                      const isAns = oi === q.answer;
                      const isPick = picked[i] === oi;
                      const cls = !has
                        ? ""
                        : isAns
                          ? "is-ans"
                          : isPick
                            ? "is-pick"
                            : "";
                      return (
                        <button
                          key={oi}
                          className={`ai-q-opt ${cls}`}
                          onClick={() => {
                            if (has) return;
                            setPicked((prev) => {
                              const next = [...prev];
                              next[i] = oi;
                              return next;
                            });
                          }}
                          disabled={has}
                          lang="en"
                        >
                          {has && isAns && <Check size={14} />}
                          {has && isPick && !isAns && <X size={14} />}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {has && (
                    <p className="ai-q-why">
                      {right ? <Check size={13} /> : <X size={13} />}
                      {q.why}
                    </p>
                  )}
                </div>
              );
            })}

            {answered === qs.length && (
              <div className="ai-quiz-score">
                <b>{correct}</b> / {qs.length} 正确
                {correct >= 4 ? " · 太强了，本地模型都要被你考倒" : correct >= 2 ? " · 有基础了，再刷一批巩固" : " · 这套词不熟，换一批再练"}
                <div className="summary-actions">
                  <button className="btn btn-ghost" onClick={() => void gen()}>
                    <RotateCcw size={15} /> 换一批题
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
