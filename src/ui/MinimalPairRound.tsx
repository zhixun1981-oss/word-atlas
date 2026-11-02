import { Check, Mic, RotateCcw, Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { play } from "../lib/audio";
import { cue } from "../lib/sound";
import { gradeSpeech, listenOnce, speechSupported, type SpeechResult } from "../lib/speech";
import { confusionOf, type MinPair, type MinPairWord } from "../exam/minPairs";
import { useStore } from "../store/store";

type Phase = "ask" | "listening" | "result" | "report";

interface Attempt {
  pair: MinPair;
  target: MinPairWord;
  result: SpeechResult;
  /** 识别成了对立词 → 音位混淆 */
  confusedWith: MinPairWord | null;
}

/**
 * 最小对立对练习。
 *
 * 打分只是一半；另一半是**混淆诊断**——识别结果正好是对立词时，
 * 直接告诉学习者「你把 /ɪ/ 发成 /iː/ 了」，这才是练对立对的意义。
 */
export function MinimalPairRound({ pairs, onExit, onAgain }: { pairs: MinPair[]; onExit: (r?: { items: number; correct: number; score: number }) => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [cur, setCur] = useState<Attempt | null>(null);
  const [listening, setListening] = useState(false);
  const canSpeech = useMemo(() => speechSupported(), []);
  const sfx = useStore((s) => s.settings.sfx);
  const beep = (name: "tap" | "correct" | "wrong" | "complete") => {
    if (sfx) void cue(name);
  };
  const pair = pairs[i];
  // 每次进新一对词随机指定读哪个，别让学习者背下来。
  const target = useMemo<MinPairWord>(() => {
    const r = Math.abs(hashStr(pair.id)) % 2;
    return r === 0 ? pair.a : pair.b;
  }, [pair]);
  const other = target === pair.a ? pair.b : pair.a;

  const startListen = async () => {
    if (listening) return;
    setListening(true);
    setPhase("listening");
    beep("tap");
    try {
      const transcript = await listenOnce("en-GB", 7000);
      const result = gradeSpeech(transcript, target.w);
      const hit = confusionOf(pair, transcript);
      const confusedWith = hit && hit.w.toLowerCase() !== target.w.toLowerCase() ? hit : null;
      const attempt: Attempt = { pair, target, result, confusedWith };
      setCur(attempt);
      setAttempts((a) => [...a, attempt]);
      beep(confusedWith || result.score < 78 ? "wrong" : "correct");
      setPhase("result");
    } catch {
      // 麦克风被拒 / 引擎出错：退回自评，别卡死在 listening。
      setPhase("ask");
    } finally {
      setListening(false);
    }
  };

  /** 没有语音识别时的自评通道，也算一次记录。 */
  const selfRate = (ok: boolean) => {
    const result: SpeechResult = {
      transcript: ok ? "（自评读对）" : `（自评读成 ${other.w}）`,
      score: ok ? 100 : 40,
      grade: ok ? "great" : "try",
      distance: ok ? 0 : 1,
    };
    const attempt: Attempt = { pair, target, result, confusedWith: ok ? null : other };
    setCur(attempt);
    setAttempts((a) => [...a, attempt]);
    beep(ok ? "correct" : "wrong");
    setPhase("result");
  };

  const next = () => {
    if (i + 1 >= pairs.length) {
      beep("complete");
      setPhase("report");
    } else {
      setI(i + 1);
      setPhase("ask");
      setCur(null);
    }
  };

  if (phase === "report") {
    const total = attempts.length;
    const right = attempts.filter((a) => !a.confusedWith && a.result.score >= 78).length;
    const avg = total ? Math.round(attempts.reduce((n, a) => n + a.result.score, 0) / total) : 0;
    const byGroup = new Map<string, { n: number; bad: number }>();
    for (const a of attempts) {
      const g = byGroup.get(a.pair.group) ?? { n: 0, bad: 0 };
      g.n++;
      if (a.confusedWith || a.result.score < 78) g.bad++;
      byGroup.set(a.pair.group, g);
    }
    const weak = [...byGroup.entries()].filter(([, g]) => g.bad > 0).sort((a, b) => b[1].bad - a[1].bad);
    return (
      <div className="panel minpair-report">
        <p className="eyebrow">对立对 · 本轮完成</p>
        <h2 className="minpair-title">
          <b>{avg}</b> 分 · 对 {right}/{total}
        </h2>
        <ul className="minpair-list">
          {attempts.map((a, k) => (
            <li key={k} className={a.confusedWith ? "is-confused" : a.result.score >= 78 ? "is-ok" : ""}>
              <span className="minpair-pair">
                <b>{a.target.w}</b>
                {a.confusedWith && (
                  <>
                    {" "}
                    → <em>{a.confusedWith.w}</em>
                  </>
                )}
              </span>
              <small>
                {a.pair.contrast} · {a.result.score} 分
              </small>
            </li>
          ))}
        </ul>
        {weak.length > 0 && (
          <div className="minpair-weak">
            <p className="eyebrow">最弱的音位</p>
            {weak.map(([name, g]) => (
              <p key={name} className="muted">
                <b>{name}</b>：{g.bad}/{g.n} 对混淆
              </p>
            ))}
            <p className="muted">{pairs.find((p) => p.group === weak[0][0])?.tip}</p>
          </div>
        )}
        <div className="minpair-actions">
          <button className="btn btn-primary" onClick={onAgain}>
            <RotateCcw size={17} /> 再来一轮
          </button>
          <button className="btn btn-ghost" onClick={() => onExit({ items: total, correct: right, score: avg })}>
            返回练习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel minpair-round">
      <div className="panel-head">
        <p className="eyebrow">
          对立对 · {i + 1} / {pairs.length}
        </p>
        <span className="muted">{pair.contrast}</span>
      </div>

      <div className="minpair-stage">
        {[pair.a, pair.b].map((w) => (
          <button
            key={w.w}
            className={`minpair-word ${w.w === target.w ? "is-target" : ""}`}
            onClick={() => void play(null, w.w, "uk")}
            title="点一下听发音"
          >
            <b>{w.w}</b>
            <small>{w.ipa}</small>
            {w.w === target.w && <em>请读这个词</em>}
            <Volume2 size={16} />
          </button>
        ))}
      </div>
      <p className="muted minpair-tip">{pair.tip}</p>

      {phase === "ask" && (
        <>
          {canSpeech ? (
            <button className="btn btn-primary btn-xl" onClick={() => void startListen()} disabled={listening}>
              <Mic size={18} /> 录音评分
            </button>
          ) : (
            <p className="warn-text">这台浏览器不支持语音识别，下面用自评。</p>
          )}
          {/* 自评永远在：麦克风被拒、识别引擎出错时不会把人卡死在这一步。 */}
          <div className="minpair-actions minpair-self">
            <span className="muted">自评：</span>
            <button className="btn btn-ghost" onClick={() => selfRate(true)}>
              <Check size={16} /> 读对了
            </button>
            <button className="btn btn-ghost" onClick={() => selfRate(false)}>
              <X size={16} /> 读成 {other.w} 了
            </button>
          </div>
        </>
      )}

      {phase === "listening" && (
        <button className="btn btn-primary btn-xl is-live" disabled>
          <Mic size={18} /> 正在听…… 读出「{target.w}」
        </button>
      )}

      {phase === "result" && cur && (
        <>
          <div className={`minpair-verdict ${cur.confusedWith ? "is-confused" : cur.result.score >= 78 ? "is-ok" : "is-meh"}`}>
            <h3>
              {cur.confusedWith ? (
                <>
                  发成 <em>{cur.confusedWith.w}</em> 了
                </>
              ) : cur.result.score >= 78 ? (
                "读对了"
              ) : (
                "再试一次"
              )}
              <span className="minpair-score">{cur.result.score}</span>
            </h3>
            <p className="muted">
              识别结果：<b>{cur.result.transcript || "（没听清）"}</b>
            </p>
            {cur.confusedWith && (
              <p className="minpair-diag">
                这正是 <b>{cur.pair.contrast}</b> 的混淆点。{cur.pair.tip}
              </p>
            )}
          </div>
          <div className="minpair-actions">
            <button className="btn btn-primary" onClick={next}>
              {i + 1 >= pairs.length ? "看成绩单" : "下一个"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                void play(null, target.w, "uk", 0.75);
              }}
            >
              <Volume2 size={16} /> 慢速再听
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** 轻量字符串散列，用来给每对词稳定地随机挑读哪个。 */
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
