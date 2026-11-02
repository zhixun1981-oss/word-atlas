import { BookOpenText, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAtlas } from "../atlas/context";
import { chatJSON } from "../lib/llm";
import { openWord } from "../lib/router";
import { speak } from "../lib/tts";
import { useStore } from "../store/store";

/** 每日晨读微课：本地 AI 把 3 个考纲词编成一小段短文，朗读 + 点词进图鉴。 */

interface ReadingPack {
  en: string;
  zh: string;
  words: { w: string; zh: string }[];
}

const SYSTEM =
  "You are a Cambridge KET/PET teacher writing a short daily reading passage. " +
  "Write 3-4 short natural English sentences (about 25-35 words) for morning reading, " +
  "using the 3 target words given. Keep sentences simple and level-appropriate. " +
  "Reply with ONLY JSON: {\"en\":\"...\",\"zh\":\"整段中文翻译\",\"words\":[{\"w\":\"目标词\",\"zh\":\"中文释义\"}]}.";

function dateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DailyReading() {
  const atlas = useAtlas();
  const accent = useStore((s) => s.settings.accent);
  const [pack, setPack] = useState<ReadingPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cacheKey = `word-atlas:reading:${dateKey()}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const p = JSON.parse(raw) as ReadingPack;
        if (p?.en && p.words?.length) setPack(p);
      }
    } catch {
      /* ignore */
    }
  }, [cacheKey]);

  const gen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      // 随机抽 3 个考纲词（≤B1，覆盖 KET/PET），让 AI 编进短文
      const seeds = [...atlas.words]
        .sort(() => Math.random() - 0.5)
        .filter((w) => w.cefr <= 2)
        .slice(0, 3)
        .map((w) => w.word);
      if (!seeds.length) throw new Error("empty-pool");
      const p = await chatJSON<ReadingPack>(
        [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Target words: ${seeds.join(", ")}. Write the reading passage.` },
        ],
        { temperature: 0.8, maxTokens: 700 },
      );
      if (!p?.en || !p.words?.length) throw new Error("bad-json");
      setPack(p);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(p));
      } catch {
        /* optional */
      }
    } catch {
      setError("生成失败。确认本地 Ollama 在跑，稍后再试。");
    } finally {
      setBusy(false);
    }
  }, [atlas, cacheKey]);

  const open = (w: string) => {
    const hit = atlas.words.find((x) => x.word.toLowerCase() === w.toLowerCase());
    if (hit) openWord(hit.id);
  };

  return (
    <div className="daily-quote daily-reading" onClick={() => pack?.en && speak(pack.en, { lang: accent === "uk" ? "en-GB" : "en-US", rate: 0.85 })}>
      <div className="daily-quote-icon">
        <BookOpenText size={16} />
      </div>
      <div className="daily-quote-text">
        {!pack && !busy && !error && (
          <button
            className="btn btn-ghost btn-sm daily-reading-btn"
            onClick={(e) => {
              e.stopPropagation();
              void gen();
            }}
          >
            <Sparkles size={14} /> 生成今日晨读（3 词短文）
          </button>
        )}
        {busy && (
          <p className="daily-reading-btn">
            <Loader2 className="spin" size={14} /> 正在写晨读短文…
          </p>
        )}
        {error && (
          <p className="daily-reading-btn">
            {error}
            <button className="link" onClick={(e) => { e.stopPropagation(); void gen(); }} disabled={busy}>
              重试
            </button>
          </p>
        )}
        {pack && (
          <>
            <p className="daily-quote-en" lang="en">
              {pack.en}
            </p>
            <p className="daily-quote-zh">{pack.zh}</p>
            <div className="daily-reading-words">
              {pack.words.map((w) => (
                <button
                  key={w.w}
                  className="chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    open(w.w);
                  }}
                  title={`点开 ${w.w} 的图鉴页`}
                >
                  {w.w}
                  <small>{w.zh}</small>
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-sm daily-reading-btn"
              onClick={(e) => {
                e.stopPropagation();
                void gen();
              }}
            >
              <RotateCcw size={13} /> 换一篇
            </button>
          </>
        )}
      </div>
    </div>
  );
}
