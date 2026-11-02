import { Check, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { clean, same } from "../lib/typing";

const STOP = new Set(["the","a","an","of","to","in","on","at","for","and","or","but","is","are","was","were","do","does","did","have","has","had","will","would","can","could","should","may","might","it","this","that","these","those","my","your","his","her","our","their","we","you","they","he","she","i","me","him","us","them","with","from","about","as","by","be","been","being","so","if","not","no","yes","there","here","when","where","what","why","how","very","just","then","than","too","also","up","out","over","under","more","most","some","any","one","two","get","got","go","went","come","came","make","made","take","took","see","saw","say","said","tell","told","know","knew","think","thought","want","like","give","gave","find","found","look","looked","put","use","used","day","night","time","week","year","school","home","work","new","old","good","bad","big","small","long","short","much","many"]);

function keywords(en: string): string[] {
  return clean(en).toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3 && !STOP.has(w));
}

/** Listen to a full example sentence and type it out. */
export function DictationRound({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [items, setItems] = useState<Entry[] | null>(null);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    const ids = atlas.words.filter((w) => (w.media & 8) !== 0).map((w) => w.id);
    const picked = ids.slice(0, 200);
    void prefetch(atlas, picked).then((list) => {
      if (!alive) return;
      const withEx = list.filter((e): e is Entry => !!e && e.ex.length > 0 && (e.m & 8) !== 0);
      const chosen = withEx.sort(() => Math.random() - 0.5).slice(0, 10);
      setItems(chosen);
      if (chosen[0]) {
        playEx(chosen[0]);
      }
    });
    return () => {
      alive = false;
      audioRef.current?.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playEx = (e: Entry) => {
    audioRef.current?.pause();
    const el = new Audio(`${import.meta.env.BASE_URL}${atlas.audio(e, "ex")}`);
    audioRef.current = el;
    el.play().catch(() => null);
  };

  const cur = items?.[i];

  const check = () => {
    if (!cur) return;
    const target = cur.ex[0]?.en ?? "";
    const ok = same(value.trim(), target);
    const k = keywords(target);
    const near = k.length ? k.filter((w) => clean(value).toLowerCase().includes(w)).length / k.length >= 0.7 : ok;
    const pass = ok || near;
    setRevealed(pass);
    setCorrect((c) => c + (pass ? 1 : 0));
    if (i + 1 >= (items?.length ?? 0)) window.setTimeout(() => setDone(true), 700);
  };

  const next = () => {
    setValue("");
    setRevealed(null);
    input.current?.focus();
    setI(i + 1);
    if (items?.[i + 1]) playEx(items[i + 1]);
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">听写完成</p>
          <h1 className="display">
            {correct} <small>/ {items?.length ?? 0}</small>
          </h1>
          <p className="lede">{correct === (items?.length ?? 0) ? "全对，耳朵和手都很稳。" : correct >= ((items?.length ?? 0) / 2) ? "记住大半，连读和意群再练练。" : "整句听写要多听几遍，抓动词和名词。"}</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>返回</button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  if (!cur)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">正在准备整句听写…</p>
        </section>
      </div>
    );

  const target = cur.ex[0]?.en ?? "";

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>结束</button>
        <div className="learn-progress">
          <span style={{ width: `${(i / (items?.length ?? 1)) * 100}%` }} />
        </div>
        <span className="typing-meter">
          听对 <b>{correct}</b> / {items?.length ?? 0}
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        <div className="spell-cue">
          <button className="btn btn-primary btn-xl" onClick={() => playEx(cur)}>
            <Volume2 size={18} /> 再听一遍
          </button>
          <p className="muted">听完整例句，把整句默写下来。可多听几遍。</p>
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
          aria-label="默写整句"
          disabled={revealed !== null}
        />
        {revealed !== null && (
          <div className={`exam-feedback ${revealed ? "is-ok" : ""}`}>
            {revealed ? (
              <p>
                <Check size={17} /> 写得很接近，完整句为：
              </p>
            ) : (
              <p>
                完整句：<b lang="en">{target}</b>
              </p>
            )}
            <p className="dictation-zh">{cur.ex[0]?.zh}</p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一句</button>
          </div>
        )}
        <p className="muted typing-help">第 {i + 1}/{items?.length} 句 · 回车核对，连写七八成也算对。</p>
      </section>
    </div>
  );
}
