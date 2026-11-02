import { store } from "../store/store";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_BASE = "http://localhost:11434";
/** Small, fast instruct models we prefer for interactive use. */
const PREFERRED = ["qwen2.5:3b", "qwen2.5:1.5b", "llama3.2:3b", "gemma2:2b", "qwen2.5:7b", "llama3.1:8b"];

export function llmBase(): string {
  return store.get().settings.llmBase?.trim() || DEFAULT_BASE;
}

/** List models the local Ollama server currently has. Empty on any error. */
export async function listModels(base = llmBase()): Promise<string[]> {
  try {
    const res = await fetch(`${base}/api/tags`, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

/** Pick a usable model: the user's choice if present, else a small fast chat model, else whatever is loaded. */
export async function pickModel(prefer?: string, base = llmBase()): Promise<string | null> {
  const models = await listModels(base);
  if (!models.length) return null;
  const want = (prefer ?? store.get().settings.llmModel?.trim()) || "";
  if (want && models.includes(want)) return want;
  for (const f of PREFERRED) if (models.includes(f)) return f;
  // Any qwen/llama/gemma 2.x–3.x non-reasoning model beats a heavy reasoning one.
  const small = models.filter((m) => !/r1|deepseek-reasoner|think/i.test(m)).sort((a, b) => a.localeCompare(b))[0];
  return small ?? models[0];
}

export function isReasoningModel(model: string): boolean {
  return /r1|reasoner|think/i.test(model);
}

/** Non-streaming completion. Returns the assistant text. Throws on transport/model errors. */
export async function chatOnce(
  messages: ChatMessage[],
  opts: { model?: string; signal?: AbortSignal; temperature?: number; base?: string; maxTokens?: number } = {},
): Promise<string> {
  const base = opts.base ?? llmBase();
  const model = opts.model ?? (await pickModel(undefined, base));
  if (!model) throw new Error("no-model");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: opts.temperature ?? 0.7, num_predict: opts.maxTokens ?? 400 },
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

/**
 * Streaming completion. Calls `onToken` with each incremental chunk and resolves with the
 * full text. The `thinking` field (reasoning models) is reported via `onThinking` but never
 * counted as the answer.
 */
export async function chatStream(
  messages: ChatMessage[],
  opts: {
    model?: string;
    signal?: AbortSignal;
    temperature?: number;
    onToken?: (chunk: string) => void;
    onThinking?: (chunk: string) => void;
    base?: string;
  } = {},
): Promise<string> {
  const base = opts.base ?? llmBase();
  const model = opts.model ?? (await pickModel(undefined, base));
  if (!model) throw new Error("no-model");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature: opts.temperature ?? 0.8, num_predict: 400 },
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line) as { message?: { content?: string; thinking?: string }; done?: boolean };
        if (obj.message?.thinking) opts.onThinking?.(obj.message.thinking);
        if (obj.message?.content) {
          full += obj.message.content;
          opts.onToken?.(obj.message.content);
        }
        if (obj.done) break;
      } catch {
        /* ignore malformed keep-alive lines */
      }
    }
  }
  return full;
}

/** Ask the model for a JSON object; tolerant of code fences and trailing prose. */
export async function chatJSON<T = unknown>(
  messages: ChatMessage[],
  opts: { model?: string; signal?: AbortSignal; temperature?: number; base?: string; maxTokens?: number } = {},
): Promise<T> {
  const text = await chatOnce(messages, opts);
  return extractJSON<T>(text);
}

export function extractJSON<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start < 0) throw new Error("no-json");
  const tail = candidate.slice(start);
  try {
    return JSON.parse(tail) as T;
  } catch {
    // try to cut at the last balanced bracket
    const end = Math.max(tail.lastIndexOf("}"), tail.lastIndexOf("]"));
    if (end > 0) return JSON.parse(tail.slice(0, end + 1)) as T;
    throw new Error("bad-json");
  }
}
