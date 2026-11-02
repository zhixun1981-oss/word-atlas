import { Bot, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Entry } from "../atlas/types";
import { chatJSON } from "../lib/llm";
import { useStore } from "../store/store";
import { Speak } from "./Speak";

/** AI 生成的三条例句 + 一个三句迷你故事（本地 Ollama，纯离线）。 */
export interface AiPack {
  examples: { en: string; zh: string }[];
  story: { en: string; zh: string };
}

const cacheKey = (id: string) => `word-atlas:ai-ex:${id}`;

const SYSTEM =
  "You are a Cambridge KET/PET English teacher. Write natural, everyday example " +
  "sentences and a tiny story for a learner, using their target word each time. " +
  "Sentences must be short, simple and match the learner's CEFR level. " +
  "Reply with ONLY a JSON object, no markdown, no extra text: " +
  '{"examples":[{"en":"English sentence","zh":"简体中文翻译"}],"story":{"en":"Three short English sentences joined with spaces.","zh":"整段简体中文翻译"}}. ' +
  "The story must be exactly three sentences and use the target word in every sentence.";

export function AiExamples({ entry }: { entry: Entry }) {
  const accent = useStore((s) => s.settings.accent);
  const [pack, setPack] = useState<AiPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey(entry.id));
      if (raw) {
        const p = JSON.parse(raw) as AiPack;
        if (p?.examples?.length && p?.story?.en) {
          setPack(p);
          setFromCache(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, [entry.id]);

  const gen = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const meanings = entry.senses.map((s) => s.zh).filter(Boolean).slice(0, 2).join(", ");
      const p = await chatJSON<AiPack>(
        [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `Target word: "${entry.w}" (${meanings}), CEFR ${entry.cefr}. ` +
              `Write 3 example sentences and the 3-sentence mini story using "${entry.w}".`,
          },
        ],
        { temperature: 0.6, maxTokens: 900 },
      );
      if (!p?.examples?.length || !p.story?.en) throw new Error("bad-json");
      setPack({ examples: p.examples.slice(0, 3), story: p.story });
      setFromCache(false);
      try {
        localStorage.setItem(cacheKey(entry.id), JSON.stringify({ examples: p.examples.slice(0, 3), story: p.story }));
      } catch {
        /* optional */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg === "no-model" ? "本地模型未连接。请先在「我的 → 设置」里配置 Ollama 地址。" : "生成失败，请稍后再试。");
    } finally {
      setBusy(false);
    }
  }, [entry]);

  const storyLines = pack?.story.en
    ? pack.story.en.split(/(?<=[.!?])\s+/).filter(Boolean)
    : [];

  return (
    <section className="block ai-examples">
      <h3 className="eyebrow">
        AI 例句 · 迷你故事
        <span className="ai-badge">
          <Bot size={12} />
          本地生成
        </span>
      </h3>

      {!pack && !busy && !error && (
        <button className="btn btn-glass" onClick={gen} disabled={busy}>
          <Sparkles size={15} /> 用 AI 生成例句与小故事
        </button>
      )}

      {busy && (
        <p className="ai-loading">
          <Loader2 className="spin" size={15} /> 正在生成，本地模型稍等几秒…
        </p>
      )}

      {error && (
        <p className="ai-error">
          {error}
          <button className="link" onClick={gen} disabled={busy}>
            重试
          </button>
        </p>
      )}

      {pack && !busy && (
        <div className="ai-pack">
          {fromCache && <p className="ai-cache-note">已缓存，可点「换一批」重新生成</p>}
          <ul className="examples">
            {pack.examples.map((x, i) => (
              <li key={i}>
                <span className="ex-tag is-ai">AI</span>
                <p className="ex-en" lang="en">
                  {x.en}
                  <Speak url={null} text={x.en} accent={accent} size="sm" className="ex-speak" />
                </p>
                <p className="ex-zh">{x.zh}</p>
              </li>
            ))}
          </ul>
          {pack.story.en && (
            <div className="ai-story">
              <h4>
                迷你故事
                <Speak url={null} text={pack.story.en} accent={accent} size="sm" />
              </h4>
              <ol className="ai-story-lines">
                {storyLines.map((line, i) => (
                  <li key={i} lang="en">
                    {line}
                  </li>
                ))}
              </ol>
              <p className="ex-zh">{pack.story.zh}</p>
            </div>
          )}
          <div className="ai-actions">
            <button className="btn btn-glass" onClick={gen} disabled={busy}>
              <RefreshCcw size={14} /> 换一批
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
