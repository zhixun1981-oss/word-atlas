import { Check, Lock, RotateCcw, Star, X } from "lucide-react";
import { useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { hashSeed, shuffle } from "../lib/text";

interface QuestEntry {
  e: Entry;
  options: Entry[];
}

const TOPIC_ART = new Set(["education","technology","science","environment","health","society","government","economy","media","arts","travel","city","nature","emotion","sport","history"]);

/** Topic quest: 10 words per topic; perfect score unlocks the next topic. */
export function TopicQuest({ onExit }: { onExit: () => void }) {
  const atlas = useAtlas();
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("word-atlas:quest") ?? "[]") as string[]));
  const [mode, setMode] = useState<"pick" | "play">("pick");
  const [topic, setTopic] = useState<string | null>(null);
  const [items, setItems] = useState<QuestEntry[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = (next: Set<string>) => {
    setUnlocked(new Set(next));
    localStorage.setItem("word-atlas:quest", JSON.stringify([...next]));
  };

  const start = async (t: string) => {
    setTopic(t);
    setLoading(true);
    const tIdx = atlas.topics.findIndex(([id]) => id === t);
    const topicIds = shuffle(atlas.words.filter((w) => w.topic === tIdx).map((w) => w.id), hashSeed(String(Date.now()))).slice(0, 10);
    const distractorIds = shuffle(atlas.words.filter((w) => w.topic !== tIdx).map((w) => w.id), hashSeed("d" + Date.now())).slice(0, 30);
    const list = (await prefetch(atlas, [...topicIds, ...distractorIds])).filter((e): e is Entry => !!e && e.ex.length > 0);
    const targets = list.filter((e) => topicIds.includes(e.id)).slice(0, 10);
    const distractors = list.filter((e) => !topicIds.includes(e.id));
    const quest: QuestEntry[] = targets.map((e, k) => {
      const opts = new Map<string, Entry>([[e.id, e]]);
      let d = k * 3;
      while (opts.size < 4) {
        const cand = distractors[(d++) % distractors.length];
        if (cand.id !== e.id && !opts.has(cand.id)) opts.set(cand.id, cand);
      }
      return { e, options: shuffle([...opts.values()]) };
    });
    setItems(quest);
    setI(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
    setMode("play");
    setLoading(false);
  };

  const cur = items[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = cur.options[idx].id === cur.e.id;
    const nc = correct + (ok ? 1 : 0);
    setCorrect(nc);
    if (i + 1 >= items.length) {
      window.setTimeout(() => {
        setDone(true);
        if (nc === items.length) {
          const idx = atlas.topics.findIndex(([id]) => id === topic);
          const nextId = atlas.topics[idx + 1]?.[0];
          if (nextId) save(new Set([...unlocked, nextId]));
        }
      }, 700);
    }
  };

  const next = () => {
    setPicked(null);
    setI(i + 1);
  };

  const again = () => {
    if (topic) void start(topic);
  };

  if (mode === "pick")
    return (
      <div className="page practice">
        <header className="typing-top">
          <button className="btn btn-ghost" onClick={onExit}>返回</button>
          <div className="learn-progress"><span style={{ width: "100%" }} /></div>
          <span className="typing-meter">话题闯关</span>
        </header>
        <section className="panel">
          <p className="eyebrow">话题闯关 · Topic Quest</p>
          <h1 className="display">10 词全对，解锁下一个话题。</h1>
          <p className="muted">每关 10 个词，按英文释义选词。第一关「教育」已开放，通关后逐话题解锁。</p>
          <div className="quest-grid">
            {atlas.topics.map(([id, zh], k) => {
              const isUnlocked = k === 0 || unlocked.has(id);
              const hasArt = TOPIC_ART.has(id);
              return (
                <button key={id} className={`quest-card ${isUnlocked ? "" : "is-locked"}`} onClick={() => isUnlocked && void start(id)} disabled={!isUnlocked}>
                  {hasArt ? (
                    <img className="quest-art" src={`${import.meta.env.BASE_URL}atlas/img/${id}.webp`} alt="" loading="lazy" />
                  ) : (
                    <span className="quest-art quest-art-fallback">{zh.slice(0, 1)}</span>
                  )}
                  <b>{zh}</b>
                  <small>
                    {unlocked.has(id) ? (
                      <>
                        <Star size={12} /> 已通关
                      </>
                    ) : isUnlocked ? (
                      "可挑战"
                    ) : (
                      <>
                        <Lock size={12} /> 未解锁
                      </>
                    )}
                  </small>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">{topic ? atlas.topics.find(([id]) => id === topic)?.[1] : ""} · 本关完成</p>
          <h1 className="display">
            {correct} <small>/ {items.length}</small>
          </h1>
          <p className="lede">
            {correct === items.length
              ? "全对通关！下一话题已解锁。"
              : correct >= items.length / 2
                ? "差一点通关，再来一次就能解锁下一话题。"
                : "多过几遍词表，再挑战这一关。"}
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={() => setMode("pick")}>返回话题</button>
            <button className="btn btn-primary btn-xl" onClick={again} autoFocus>
              <RotateCcw size={18} /> 再闯一次
            </button>
          </div>
        </section>
      </div>
    );

  if (loading || !cur)
    return (
      <div className="page practice">
        <section className="panel">
          <p className="muted">正在准备本话题的题目…</p>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={() => setMode("pick")}>退出</button>
        <div className="learn-progress">
          <span style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          答对 <b>{correct}</b> / {items.length}
        </span>
      </header>
      <section className="typing-stage">
        <div className="synant-cue">
          <span className="dialogue-level">
            {atlas.topics.find(([id]) => id === topic)?.[1]} · 第 {i + 1}/{items.length} 题
          </span>
          <p className="quest-def" lang="en">
            {cur.e.senses[0].en}
          </p>
          <p className="muted">选与释义对应的单词。</p>
        </div>
        <div className="exam-opts dialogue-opts">
          {cur.options.map((opt, idx) => (
            <button key={opt.id} className={`exam-opt ${picked !== null ? (opt.id === cur.e.id ? "is-correct" : idx === picked ? "is-wrong" : "") : ""}`} onClick={() => pick(idx)} disabled={picked !== null}>
              <span className="opt-letter">{String.fromCharCode(65 + idx)}</span> <span lang="en">{opt.w}</span>
            </button>
          ))}
        </div>
        {picked !== null && (
          <div className={`exam-feedback ${cur.options[picked].id === cur.e.id ? "is-ok" : ""}`}>
            <p>
              {cur.options[picked].id === cur.e.id ? (
                <>
                  <Check size={17} /> 答对了！
                </>
              ) : (
                <>
                  <X size={17} /> 正确答案：<b lang="en">{cur.e.w}</b>
                </>
              )}{" "}
              · {cur.e.senses[0].zh}
            </p>
            <button className="btn btn-primary" onClick={next} autoFocus>下一题</button>
          </div>
        )}
        <p className="muted typing-help">全对通关解锁下一话题 · 释义选词练 Reading。</p>
      </section>
    </div>
  );
}
