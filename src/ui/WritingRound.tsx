import { Check, Cpu, Mail, NotebookPen, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { checkWriting, WRITING_BANK, type WritingItem } from "../exam/writing";
import { reviewWriting, type WritingReview } from "../exam/writingReview";
import { pickModel } from "../lib/llm";
import { cue } from "../lib/sound";
import { hashSeed, shuffle } from "../lib/text";
import { useStore } from "../store/store";

export function WritingRound({ onExit }: { onExit?: (result?: { score: number }) => void }) {
  const settings = useStore((s) => s.settings);
  const [item, setItem] = useState<WritingItem>(() => shuffle(WRITING_BANK, hashSeed(String(Date.now())))[0]);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [review, setReview] = useState<WritingReview | null>(null);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const alive = useRef(true);
  const check = checked ? checkWriting(text, item) : null;

  useEffect(() => {
    alive.current = true;
    void pickModel().then((m) => alive.current && setModel(m));
    return () => {
      alive.current = false;
    };
  }, []);

  const run = () => {
    const c = checkWriting(text, item);
    if (settings.sfx) void cue(text.trim().length ? "correct" : "wrong");
    setChecked(true);
    setLastScore(c.score);
    setReview(null);
    setMarkError(null);
  };

  /** 本地模型当考官，按内容/组织/语言/拼写四维打分。 */
  const markWithAI = async () => {
    if (!text.trim()) return;
    setMarking(true);
    setMarkError(null);
    try {
      const r = await reviewWriting(text, item, { model: model ?? undefined });
      if (!alive.current) return;
      setReview(r);
      setLastScore((prev) => (prev == null ? r.score : Math.round((prev + r.score) / 2)));
    } catch {
      if (alive.current) setMarkError("本地模型没批改成功。确认 Ollama 在跑，或先看范文对照。");
    } finally {
      if (alive.current) setMarking(false);
    }
  };

  return (
    <div className="page practice writing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={() => onExit?.(lastScore != null ? { score: lastScore } : undefined)}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${showSample ? 100 : 60}%` }} />
        </div>
        <span className="typing-meter">
          {item.kind === "email" ? <Mail size={14} /> : <NotebookPen size={14} />} {item.title}
        </span>
      </header>
      <section className="writing-stage">
        <div className="writing-prompt">
          <p className="eyebrow">
            {item.kind === "email" ? <Mail size={14} /> : <NotebookPen size={14} />} {item.title} · 至少 {item.minWords} 词
          </p>
          <p lang="en">{item.prompt}</p>
          <p className="muted">{item.zh}</p>
          <p className="writing-points">
            要写到的要点：
            {item.points.map((p) => (
              <span key={p.word} lang="en">
                {p.word} <small>{p.zh}</small>
              </span>
            ))}
          </p>
        </div>

        <textarea
          className="writing-area"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (checked) setChecked(false);
          }}
          placeholder="在这里用英文写作……"
          spellCheck={false}
        />

        <div className="writing-actions">
          <button className="btn btn-primary btn-xl" onClick={run} disabled={checked}>
            检查我的作文
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSample((v) => !v)}>
            {showSample ? "收起" : "看"}范文
          </button>
        </div>

        {check && (
          <div className="writing-check">
            <p>
              字数 <b>{check.words}</b> / {item.minWords} · 要点 <b>{check.points}/{item.points.length}</b>
            </p>
            <p className="writing-score">
              {check.score >= 80 ? (
                <span className="is-ok">
                  <Check size={15} /> {check.score} 分 · 结构完整，要点都写到了！
                </span>
              ) : check.score >= 50 ? (
                <span>
                  {check.score} 分 · 有框架了，再补全要点会更完整。
                </span>
              ) : (
                <span className="is-bad">
                  <X size={15} /> {check.score} 分 · 试着把要点都写进去，并写够字数。
                </span>
              )}
            </p>
            {check.missing.length > 0 && <p className="muted">没写到的要点：{check.missing.join("、")}</p>}
            {check.words < item.minWords && <p className="muted">还差 {item.minWords - check.words} 个词达到目标字数。</p>}
          </div>
        )}

        {check && (
          <div className="ai-mark">
            <div className="ai-mark-head">
              <h4>
                <Sparkles size={15} /> AI 老师批改
              </h4>
              <span className="ai-mark-model">
                <Cpu size={12} /> {model ? `本地模型 · ${model} · 估分仅供参考` : "本地模型未连接"}
              </span>
            </div>

            {!review && !marking && (
              <button className="btn btn-primary" onClick={() => void markWithAI()} disabled={!model}>
                <Sparkles size={16} /> 让 AI 老师读一遍
              </button>
            )}
            {!model && !marking && <p className="muted">先在终端跑 <code>OLLAMA_ORIGINS="*" ollama serve</code> 就能用 AI 批改。</p>}
            {marking && <p className="muted ai-mark-wait">AI 老师正在读你的作文…（跑在你自己的电脑上，约 10–20 秒）</p>}
            {markError && <p className="ai-mark-error">{markError}</p>}

            {review && (
              <div className="ai-mark-body">
                <div className="wr-head">
                  <p className="wr-score">
                    <b>{review.dims.reduce((n, d) => n + d.score, 0)}</b>
                    <small>/ 20</small>
                  </p>
                  <ul className="wr-dims">
                    {review.dims.map((d) => (
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
                {review.praise && <p className="ai-mark-praise">{review.praise}</p>}
                {review.errors.length > 0 && (
                  <ul className="ai-mark-errors">
                    {review.errors.map((e, i) => (
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
                {review.better && (
                  <div className="ai-mark-better">
                    <p className="eyebrow">这句可以写成</p>
                    <p lang="en">{review.better}</p>
                  </div>
                )}
                {review.tip && <p className="ai-mark-tip">下次记住：{review.tip}</p>}
              </div>
            )}
          </div>
        )}

        {showSample && (
          <div className="writing-sample">
            <p className="eyebrow">参考范文</p>
            <p lang="en">{item.sample}</p>
            <p className="muted">{item.sampleZh}</p>
          </div>
        )}

        {check && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              const next = shuffle(WRITING_BANK.filter((w) => w.title !== item.title), hashSeed(String(Date.now())))[0];
              if (!next) return;
              setItem(next);
              setText("");
              setChecked(false);
              setShowSample(false);
            }}
          >
            <RotateCcw size={16} /> 换一题
          </button>
        )}
      </section>
    </div>
  );
}
