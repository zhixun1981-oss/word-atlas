import { RotateCcw, Trophy, Volume2, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { chatJSON, chatOnce, pickModel } from "../lib/llm";
import { hashSeed, shuffle } from "../lib/text";
import { useStore } from "../store/store";

const ROUNDS = 7;
const LIMIT_MS = 12_000;
/** The opponent can never answer faster than this, so it never feels unfair. */
const AI_FLOOR_MS = 1100;

interface Q {
  e: Entry;
  options: string[];
  answer: number;
}

function buildQuestions(entries: Entry[]): Q[] {
  const pool = entries.filter((e) => e.senses[0]?.zh);
  const out: Q[] = [];
  for (const e of pool.slice(0, ROUNDS)) {
    const correct = e.senses[0].zh;
    const others = shuffle(
      pool.filter((x) => x.id !== e.id).map((x) => x.senses[0].zh),
      hashSeed(e.id),
    );
    const picks: string[] = [];
    for (const s of others) {
      if (picks.length >= 3) break;
      if (s && s !== correct && !picks.includes(s)) picks.push(s);
    }
    if (picks.length < 3) continue;
    const options = shuffle([correct, ...picks], hashSeed(e.id + "o"));
    out.push({ e, options, answer: options.indexOf(correct) });
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Used when the local model is unreachable: mostly right, occasionally slips. */
function fallbackPick(q: Q): number {
  if (Math.random() < 0.78) return q.answer;
  const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer);
  return wrong[Math.floor(Math.random() * wrong.length)] ?? q.answer;
}

export function PKRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const questions = useMemo(() => buildQuestions(entries), [entries]);
  const [model, setModel] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [me, setMe] = useState(0);
  const [ai, setAi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [aiPick, setAiPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [aiBusy, setAiBusy] = useState(true);
  const [taunt, setTaunt] = useState("");
  const [verdict, setVerdict] = useState("");
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(LIMIT_MS / 1000);
  const startRef = useRef(0);
  const myMs = useRef(0);
  const aiMs = useRef(0);
  const aiJob = useRef<Promise<{ pick: number; ms: number }> | null>(null);

  useEffect(() => {
    let alive = true;
    void pickModel().then((m) => alive && setModel(m));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => stopAudio(), []);

  const q = questions[i];

  /** The opponent's move: one real call to the local model, timed. */
  const askAI = useCallback(
    async (question: Q): Promise<{ pick: number; ms: number }> => {
      const t0 = performance.now();
      if (!model) {
        await sleep(1200 + Math.random() * 1800);
        return { pick: fallbackPick(question), ms: performance.now() - t0 };
      }
      const opts = question.options.map((o, k) => `${k}. ${o}`).join("\n");
      try {
        const res = await chatJSON<{ answer: number }>(
          [
            {
              role: "user",
              content: `You are the opponent in an English vocabulary quiz.\nWord: "${question.e.w}"\nOptions:\n${opts}\nWhich option number is the correct Chinese meaning? Reply with JSON only, like {"answer": 2}.`,
            },
          ],
          { model, temperature: 0.1 },
        );
        const n = Number(res?.answer);
        if (Number.isInteger(n) && n >= 0 && n < question.options.length) return { pick: n, ms: performance.now() - t0 };
      } catch {
        /* fall through to the heuristic */
      }
      return { pick: fallbackPick(question), ms: performance.now() - t0 };
    },
    [model],
  );

  // Kick off the opponent as soon as the round opens.
  useEffect(() => {
    if (!q || done) return;
    startRef.current = performance.now();
    setAiBusy(true);
    setTaunt("");
    setLeft(LIMIT_MS / 1000);
    aiJob.current = askAI(q);
    void aiJob.current.then(() => setAiBusy(false));
  }, [i, q, done, askAI]);

  // Countdown: running out counts as a missed answer.
  useEffect(() => {
    if (!q || revealed || done) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, +(s - 0.1).toFixed(1))), 100);
    return () => window.clearInterval(id);
  }, [q, revealed, done]);

  useEffect(() => {
    if (!q || revealed || done || left > 0) return;
    void commit(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, revealed, done, q]);

  async function commit(myIdx: number) {
    if (pick !== null || revealed || !q) return;
    const mine = myIdx >= 0 ? performance.now() - startRef.current : LIMIT_MS;
    setPick(myIdx);
    myMs.current = mine;
    const job = aiJob.current ?? askAI(q);
    const res = await job;
    const theirs = Math.max(AI_FLOOR_MS, res.ms);
    if (theirs > mine) await sleep(theirs - mine);
    setAiPick(res.pick);
    aiMs.current = theirs;
    setRevealed(true);

    const meOk = myIdx === q.answer;
    const aiOk = res.pick === q.answer;
    let my = me;
    let their = ai;
    if (meOk && !aiOk) my += 1;
    else if (aiOk && !meOk) their += 1;
    else if (meOk && aiOk) {
      if (mine <= theirs) my += 1;
      else their += 1;
    }
    setMe(my);
    setAi(their);

    // Flavor text from the same local model; never blocks the next round.
    void (async () => {
      const line = myIdx < 0 ? "你没来得及答，这题归我啦！" : meOk === aiOk ? (mine <= theirs ? "手真快，算你赢！" : "哈哈，我抢到了！") : meOk ? "这题你赢了，好样的！" : "这题归我，下一题加油！";
      if (!model) {
        setTaunt(line);
        return;
      }
      try {
        const said = await chatOnce(
          [
            {
              role: "user",
              content: `We are playing an English vocabulary PK game. This round: the child ${meOk ? "got it right" : "missed it"}, you ${aiOk ? "got it right" : "missed it"}. Say ONE short playful sentence in Chinese (max 18 characters, no quotes).`,
            },
          ],
          { model, temperature: 0.9 },
        );
        setTaunt(said.replace(/["“”]/g, "").trim().slice(0, 30) || line);
      } catch {
        setTaunt(line);
      }
    })();
  }

  function next() {
    if (i + 1 >= questions.length) {
      setDone(true);
      void (async () => {
        const line = me > ai ? `你 ${me}:${ai} 赢了小拾！` : me < ai ? `小拾 ${ai}:${me} 险胜，再来一局？` : `${me}:${ai} 打平，握手言和。`;
        if (!model) {
          setVerdict(line);
          return;
        }
        try {
          const said = await chatOnce(
            [
              {
                role: "user",
                content: `A child just finished an English vocabulary PK game against you. Final score: child ${me}, you ${ai}. Say ONE short encouraging sentence in Chinese (max 24 characters, no quotes).`,
              },
            ],
            { model, temperature: 0.9 },
          );
          setVerdict(said.replace(/["“”]/g, "").trim().slice(0, 40) || line);
        } catch {
          setVerdict(line);
        }
      })();
      return;
    }
    setPick(null);
    setAiPick(null);
    setRevealed(false);
    setI(i + 1);
  }

  const restart = () => {
    setDone(false);
    setMe(0);
    setAi(0);
    setPick(null);
    setAiPick(null);
    setRevealed(false);
    setVerdict("");
    setTaunt("");
    setI(0);
  };

  if (!questions.length)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">词不够，先去学几个再来 PK。</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
          </div>
        </section>
      </div>
    );

  if (done)
    return (
      <div className="page practice">
        <section className="panel pk-done">
          <p className="eyebrow">本局结束</p>
          <h1 className="display pk-score">
            <span className={me > ai ? "is-win" : ""}>{me}</span>
            <small>:</small>
            <span className={ai > me ? "is-win" : ""}>{ai}</span>
          </h1>
          <p className="lede">{verdict || (me > ai ? "你赢了！" : me < ai ? "小拾险胜，再来一局？" : "打平了。")}</p>
          <p className="muted">对手由本地模型 {model ?? "（离线兜底）"} 驱动 · 全程离线</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain}>
              <RotateCcw size={18} /> 换一批词再来
            </button>
            <button className="btn btn-primary btn-xl" onClick={restart} autoFocus>
              <Zap size={18} /> 再战一局
            </button>
          </div>
        </section>
      </div>
    );

  const playWord = () => void play(atlas.audio(q.e, settings.accent), q.e.w, settings.accent);
  const urgent = left <= 3;

  return (
    <div className="page practice pk">
      <header className="typing-top pk-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="pk-board">
          <span className="pk-side">
            我 <b>{me}</b>
          </span>
          <span className="pk-colon">:</span>
          <span className="pk-side">
            <b>{ai}</b> 小拾
          </span>
        </div>
        <span className={`pk-clock ${urgent ? "is-urgent" : ""}`}>{left.toFixed(1)}s</span>
      </header>

      <section className="panel pk-stage">
        <p className="eyebrow">
          第 {i + 1} / {questions.length} 题 · 选出中文意思
        </p>
        <div className="pk-word">
          <h2 lang="en">{q.e.w}</h2>
          <button className="btn btn-ghost" onClick={playWord} aria-label="听发音">
            <Volume2 size={16} /> 听
          </button>
        </div>
        <div className="pk-options">
          {q.options.map((o, k) => {
            const isAnswer = revealed && k === q.answer;
            const mine = pick === k;
            const theirs = revealed && aiPick === k;
            const cls = [revealed && isAnswer ? "is-answer" : "", mine ? (revealed ? (k === q.answer ? "is-mine-ok" : "is-mine-bad") : "is-mine") : "", theirs && !isAnswer ? "is-theirs-bad" : ""].join(" ");
            return (
              <button key={`${i}-${k}`} className={`pk-option ${cls}`} onClick={() => void commit(k)} disabled={revealed}>
                <span className="pk-index">{k + 1}</span>
                <span>{o}</span>
                {revealed && k === q.answer && <span className="pk-flag">✓</span>}
                {mine && <span className="pk-flag is-me">你</span>}
                {theirs && !isAnswer && <span className="pk-flag is-ai">对手</span>}
              </button>
            );
          })}
        </div>

        {!revealed && (
          <p className="muted pk-hint">{aiBusy ? "对手（本地模型）正在思考…" : "对手已经答好了，快选！"}</p>
        )}

        {revealed && (
          <div className="pk-reveal">
            <p>
              {pick === q.answer ? "你答对了。" : pick === null ? "你没来得及答。" : "你答错了。"}
              {aiPick === q.answer ? " 对手也答对了。" : " 对手答错了。"}
              <span className="pk-times">
                （你 {(myMs.current / 1000).toFixed(1)}s · 对手 {(aiMs.current / 1000).toFixed(1)}s）
              </span>
            </p>
            {taunt && <p className="pk-taunt">“{taunt}”</p>}
            <button className="btn btn-primary btn-xl" onClick={next} autoFocus>
              {i + 1 >= questions.length ? "看结果" : "下一题"}
            </button>
          </div>
        )}
      </section>

      <p className="muted pk-foot">
        <Trophy size={13} /> 对手是本机 Ollama{model ? `（${model}）` : "（未连接，用兜底策略）"}，不联网、不上传。
      </p>
    </div>
  );
}
