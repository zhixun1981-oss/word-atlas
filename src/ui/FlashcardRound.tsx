import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { Illustration } from "./Illustration";

/** Flashcard sprint: front = word + sound, back = illustration + meaning. */
export function FlashcardRound({ entries, onExit, onAgain }: { entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const e = entries[i];

  useEffect(() => () => stopAudio(), []);

  const rate = (k: boolean) => {
    const nextKnown = known + (k ? 1 : 0);
    setKnown(nextKnown);
    if (i + 1 >= entries.length) {
      setDone(true);
      setFlipped(false);
    } else {
      setFlipped(false);
      setI(i + 1);
    }
  };

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">本轮完成</p>
          <h1 className="display">
            {known} <small>/ {entries.length}</small>
          </h1>
          <p className="lede">{known === entries.length ? "全部认识，这组词已经很熟了。" : known >= entries.length / 2 ? "记住大半，很不错。" : "别灰心，再看一遍卡片。"}</p>
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
    <div className="page practice">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="learn-progress">
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          认识 <b>{known}</b> / {entries.length}
        </span>
      </header>
      <section className="flash-stage">
        <button
          className={`flash-card ${flipped ? "is-flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "翻回正面" : "翻到背面看释义"}
        >
          <span className="flash-inner">
            <span className="flash-face flash-front">
              <small>第 {i + 1} / {entries.length} 张 · 点卡片翻面</small>
              <b lang="en">{e.w}</b>
              <em>{atlas.byId.get(e.id)?.ipa ?? e.w}</em>
              <span className="flash-sound">
                <i role="button" aria-label="听英音" onClick={(ev) => { ev.stopPropagation(); void play(atlas.audio(e, "uk"), e.w, "uk"); }}>
                  <Volume2 size={16} /> 英音
                </i>
                <i role="button" aria-label="听美音" onClick={(ev) => { ev.stopPropagation(); void play(atlas.audio(e, "us"), e.w, "us"); }}>
                  <Volume2 size={16} /> 美音
                </i>
              </span>
            </span>
            <span className="flash-face flash-back">
              <Illustration src={atlas.img(e, "thumb")} word={e.w} topic={atlas.topics.findIndex((t) => t[0] === e.topic)} eager />
              <b>{e.senses[0].zh}</b>
              <em lang="en">{e.ex?.[0]?.en}</em>
            </span>
          </span>
        </button>
        <div className="flash-actions">
          <button className="btn btn-ghost" onClick={() => rate(false)}>
            <X size={17} /> 不认识
          </button>
          <button className="btn btn-primary" onClick={() => rate(true)}>
            <Check size={17} /> 认识
          </button>
        </div>
        <p className="muted flash-hint">点卡片翻面；认识的词会记入结果。</p>
      </section>
    </div>
  );
}
