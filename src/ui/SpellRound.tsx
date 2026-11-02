import { RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { same } from "../lib/typing";
import { store, useStore } from "../store/store";

/** Listen to the word and type its spelling. */
export function SpellRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const e = entries[i];

  useEffect(() => {
    setValue("");
    setRevealed(null);
    input.current?.focus();
    void play(atlas.audio(e, settings.accent), e.w, settings.accent);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);

  const check = () => {
    const ok = same(value.trim(), e.w);
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    setRevealed(ok);
    if (i + 1 >= entries.length) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setI(i + 1);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">本轮完成</p>
          <h1 className="display">
            {correct} <small>/ {entries.length}</small>
          </h1>
          <p className="lede">{correct === entries.length ? "全对，耳朵和手都很稳。" : correct >= entries.length / 2 ? "拼对一大半，继续练。" : "拼写是听力拿分关键，多听几遍。"}</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          拼对 <b>{correct}</b> / {entries.length}
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        <div className="spell-cue">
          <button className="btn btn-primary btn-xl" onClick={() => void play(atlas.audio(e, settings.accent), e.w, settings.accent)}>
            <Volume2 size={18} /> 再听一遍
          </button>
          <p className="muted">听单词，拼出来。可切换英美音。</p>
          <div className="segmented spell-accent">
            {(["uk", "us"] as const).map((a) => (
              <button key={a} className={settings.accent === a ? "is-on" : ""} onClick={() => { store.settings({ accent: a }); void play(atlas.audio(e, a), e.w, a); }}>
                {a === "uk" ? "英音" : "美音"}
              </button>
            ))}
          </div>
        </div>
        <input
          ref={input}
          className={`typing-input spell-input ${revealed === null ? "" : revealed ? "is-ok" : "is-bad"}`}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && revealed === null) check();
            if (ev.key === "Enter" && revealed !== null) next();
          }}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="拼写单词"
          disabled={revealed !== null}
        />
        {revealed !== null && (
          <div className={`exam-feedback ${revealed ? "is-ok" : ""}`}>
            {revealed ? (
              <p>
                <CheckIcon /> 拼对了！
              </p>
            ) : (
              <p>
                正确答案：<b lang="en">{e.w}</b> · {e.senses[0].zh}
              </p>
            )}
            <button className="btn btn-primary" onClick={next} autoFocus>
              下一题
            </button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{entries.length} 项 · 回车核对拼写。</p>
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
