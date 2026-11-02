import { ArrowRight, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { cue } from "../lib/sound";
import { gap } from "../lib/text";
import { same } from "../lib/typing";
import { ART } from "../lib/art";
import { store, useStore } from "../store/store";

interface Item {
  e: Entry;
  before: string;
  after: string;
  zh: string;
}

/**
 * 听力填空（KET Listening Part 2/3 的 gap fill）：
 * 播放例句，把挖掉的那个词写出来。比整句听写更贴近考场——
 * 只考你有没有听出关键词。
 */
export function GapFillRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const e of entries) {
      const src = e.ex.find((x) => gap(x.en, e.w));
      if (!src) continue;
      const g = gap(src.en, e.w);
      if (!g) continue;
      out.push({ e, before: g.before, after: g.after, zh: src.zh });
      if (out.length >= 8) break;
    }
    return out;
  }, [entries]);

  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [plays, setPlays] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const item = items[i];

  const speak = () => {
    if (!item) return;
    void play(atlas.audio(item.e, "ex"), `${item.before}${item.e.w}${item.after}`, settings.accent);
  };

  useEffect(() => {
    setValue("");
    setRevealed(null);
    setPlays(0);
    input.current?.focus();
    if (item && settings.autoplay) speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  useEffect(() => () => stopAudio(), []);

  if (!items.length)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">听力填空</p>
          <p className="lede">这批词暂时凑不出填空题（需要有例句且例句里含该词）。换一批词再来。</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary" onClick={onAgain}>
              换一批
            </button>
          </div>
        </section>
      </div>
    );

  const check = () => {
    if (revealed !== null || !item) return;
    const ok = same(value.trim(), item.e.w);
    const n = correct + (ok ? 1 : 0);
    setCorrect(n);
    setRevealed(ok);
    if (settings.sfx) void cue(ok ? "correct" : "wrong");
    if (i + 1 >= items.length) {
      store.progress((p) => ({
        ...p,
        exam: [...p.exam, { at: Date.now(), kind: "gapfill" as const, items: items.length, correct: n }].slice(-500),
      }));
    }
  };

  const next = () => {
    if (i + 1 >= items.length) setI(-1);
    else setI(i + 1);
  };

  if (i < 0)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">听力填空 · 本轮完成</p>
          <h1 className="display">
            {correct} <small>/ {items.length}</small>
          </h1>
          <p className="lede">
            {correct === items.length
              ? "全对，耳朵抓关键词很准。"
              : correct >= items.length / 2
                ? "听对一大半，再练一轮。"
                : "先放慢速度听，抓句子里的实词，虚词可以猜。"}
          </p>
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

  const ok = revealed === true;
  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          听对 <b>{correct}</b> / {items.length}
        </span>
      </header>
      <section className="round-hero">
        <div className="rh-text">
          <h2>听力填空</h2>
          <p>Listening gap fill · 听句子，写出缺掉的关键词。只考你有没有听出来，不用默写整句。</p>
        </div>
        <img src={ART("microphone")} alt="" />
      </section>
      <section className="typing-stage">
        <p className="eyebrow">听力填空 · Listening gap fill</p>
        <p className="muted">听句子，把缺掉的那个词写出来。只考关键词，不用默写整句。</p>

        <div className="gf-sentence" lang="en">
          {item.before}
          <span className={`gf-blank ${revealed === null ? "" : ok ? "is-ok" : "is-bad"}`}>
            {revealed === null ? value || "……" : item.e.w}
          </span>
          {item.after}
        </div>
        {revealed !== null && !ok && <p className="muted">你写的是：{value || "（空）"}</p>}
        {revealed !== null && <p className="muted">{item.zh}</p>}

        <div className="gf-actions">
          <button className="btn btn-primary btn-xl" onClick={() => { speak(); setPlays((n) => n + 1); }}>
            <Volume2 size={18} /> {plays === 0 ? "播放句子" : "再听一遍"}
          </button>
          <button
            className="link"
            onClick={() => void play(atlas.audio(item.e, settings.accent), item.e.w, settings.accent)}
          >
            只听这个词的发音
          </button>
        </div>

        <input
          ref={input}
          className={`typing-input gf-input ${revealed === null ? "" : ok ? "is-ok" : "is-bad"}`}
          value={revealed === null ? value : ok ? item.e.w : value}
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
          aria-label="写出缺掉的词"
          disabled={revealed !== null}
        />

        {revealed === null ? (
          <button className="btn btn-primary" onClick={check} disabled={!value.trim()}>
            核对
          </button>
        ) : (
          <button className="btn btn-primary btn-xl" onClick={next} autoFocus>
            {i + 1 >= items.length ? "看结果" : "下一题"} <ArrowRight size={16} />
          </button>
        )}

        <p className="muted typing-help">第 {i + 1}/{items.length} 题 · 回车核对。听不清就多点几次「再听一遍」。</p>
      </section>
    </div>
  );
}
