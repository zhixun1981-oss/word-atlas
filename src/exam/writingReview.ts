import { chatJSON } from "../lib/llm";
import type { WritingItem } from "./writing";

export interface ReviewDim {
  key: "content" | "org" | "lang" | "spell";
  name: string;
  /** 0–5。剑桥写作就是四维五分制，别用百分制——模型对百分制最爱瞎给 85。 */
  score: number;
  note: string;
}

export interface ReviewError {
  wrong: string;
  right: string;
  why: string;
}

export interface WritingReview {
  /** 0–100，由四维折算。 */
  score: number;
  dims: ReviewDim[];
  praise: string;
  tip: string;
  better: string;
  errors: ReviewError[];
}

const DIMS: { key: ReviewDim["key"]; name: string }[] = [
  { key: "content", name: "内容" },
  { key: "org", name: "组织" },
  { key: "lang", name: "语言" },
  { key: "spell", name: "拼写与标点" },
];

const clamp5 = (v: unknown) => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 3;
  return Math.max(0, Math.min(5, n));
};

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * 让本地模型按剑桥四维（内容/组织/语言/拼写）批一篇作文。
 *
 * 和规则批改（`checkWriting`）是互补关系：规则那套只数字数和要点，
 * 一个全是病句但要点齐全的作文能拿满分；这里补的是语言那一维。
 * 模型不可用时调用方负责降级，这里只抛错。
 */
export async function reviewWriting(
  text: string,
  item: WritingItem,
  opts: { model?: string; signal?: AbortSignal } = {},
): Promise<WritingReview> {
  const level = item.level === "B1" ? "PET (B1)" : "KET (A2)";
  const points = item.points.map((p) => `${p.word}（${p.zh}）`).join("；");

  const prompt = `You are an experienced Cambridge ${level} writing examiner. Grade the student's writing.

Task: ${item.title}
Question: ${item.prompt}
Required content points: ${points}
Minimum words: ${item.minWords}

The student wrote:
"""
${text.slice(0, 2000)}
"""

Score these FOUR dimensions, each 0-5 (0 = not attempted, 3 = adequate for ${level}, 5 = excellent):
1. content — did they cover every required point?
2. org — is it organised like a real email/story (greeting, linking words, order)?
3. lang — grammar and vocabulary range. THIS IS WHERE MOST STUDENTS LOSE MARKS.
4. spell — spelling and punctuation.

Reply with JSON ONLY. Every note/praise/tip/why value MUST be written in Simplified Chinese (中文), never in English:
{
  "content": <0-5>,
  "org": <0-5>,
  "lang": <0-5>,
  "spell": <0-5>,
  "notes": {
    "content": "一句中文，说明为什么给这个分",
    "org": "一句中文",
    "lang": "一句中文",
    "spell": "一句中文"
  },
  "praise": "一句中文，指出这篇作文里具体好在哪",
  "tip": "一句中文，下次最该改的一件事",
  "better": "<rewrite ONE weak sentence of theirs into correct natural English>",
  "errors": [{"wrong": "<their exact words>", "right": "<corrected>", "why": "一句中文，说清错在哪"}]
}

Rules:
- At most 3 errors, only real ones that appear verbatim in their text. NEVER invent an error.
- For each error, quote a WHOLE PHRASE or SENTENCE (at least 3 words), not a single word. A bare word loses the context and you will give the wrong fix.
- British and American spellings are both correct (colour/color, favourite/favorite, theatre/theater). Never flag them.
- Ignore trivial punctuation unless it changes meaning.
- If it is too short or misses a point, lower "content" and say so in that note — do not make up grammar errors to compensate.
- Be strict on "lang" when the sentences are broken, even if the meaning is guessable.
- "better" must be ONE sentence taken from their own writing, rewritten correctly. Do not write a new paragraph.
- Keep every string short.

Correct style of an error entry:
  their text: "Yesterday I go to park with my friend and we eat ice cream."
  good: {"wrong": "Yesterday I go to park with my friend", "right": "Yesterday I went to the park with my friend", "why": "过去的事要用过去式；park 前面加 the"}
Bad (do NOT do this): {"wrong": "go", "right": "went"}  — too short, loses context`;

  const raw = await chatJSON<Record<string, unknown>>(
    [
      {
        role: "system",
        content:
          "你是剑桥 KET/PET 写作考官。你只输出 JSON，不输出任何其他文字。所有给学生看的说明文字（notes 里四句、praise、tip、errors 里的 why）一律用简体中文，绝不能写英文句子。JSON 的键名保持英文，值里的说明用中文。",
      },
      { role: "user", content: prompt },
    ],
    {
      model: opts.model,
      signal: opts.signal,
      temperature: 0.3,
      // 四维 + 四句理由 + 四条改错，400 token 一定截断，截断的 JSON 修不回来。
      maxTokens: 900,
    },
  );

  const notes = (raw.notes ?? {}) as Record<string, unknown>;
  const dims: ReviewDim[] = DIMS.map((d) => ({
    ...d,
    score: clamp5(raw[d.key]),
    note: str(notes[d.key], 60),
  }));

  // 「内容」不用模型判——这个规则算得比它准。小模型经常说「没写冰淇淋」，
  // 而冰淇淋就明明白白在作文里。要点命中率 + 字数达标，是确定的事实。
  const covered = item.points.filter((p) => text.toLowerCase().includes(p.word));
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const contentDim = dims.find((d) => d.key === "content")!;
  const ratio = covered.length / Math.max(1, item.points.length);
  contentDim.score = Math.max(0, Math.min(5, Math.round(ratio * 5) - (words >= item.minWords ? 0 : 1)));
  const missed = item.points.filter((p) => !covered.includes(p)).map((p) => p.zh);
  contentDim.note =
    missed.length > 0
      ? `要点写到 ${covered.length}/${item.points.length} 个，还差：${missed.join("、")}`
      : words >= item.minWords
        ? "要点都写到了，字数也够"
        : `要点都写到了，但字数还差 ${item.minWords - words} 个`;

  // 「拼写与标点」同样不用模型——3b 会写出「'write' 应为 'write'」这种自指笑话。
  // 这里查的是能确定的东西：句首大写、连续重复词、结尾标点。
  const spellDim = dims.find((d) => d.key === "spell")!;
  const sents = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const noCap = sents.filter((s) => /^[a-z]/.test(s)).length;
  const dup = text.match(/\b(\w+)\s+\1\b/gi) ?? [];
  const endsBad = text.trim().length > 0 && !/[.!?]/.test(text.trim().slice(-1));
  const issues: string[] = [];
  if (noCap) issues.push(`${noCap} 句开头没大写`);
  if (dup.length) issues.push(`重复词 ${dup.slice(0, 2).join("、")}`);
  if (endsBad) issues.push("结尾漏了句号");
  spellDim.score = Math.max(1, 5 - Math.min(2, noCap) - (dup.length ? 1 : 0) - (endsBad ? 1 : 0));
  spellDim.note = issues.length ? issues.join("；") : "句首大写、标点、重复词都没问题";

  // 小模型爱重复；同一条改写留一次。还要滤掉「改了等于没改」的。
  // 另外砍掉只有一个词的条目：脱离上下文时它给的修正基本是错的（write→writing 这种）。
  const seen = new Set<string>();
  const errors = (Array.isArray(raw.errors) ? raw.errors : [])
    .map((e) => e as Record<string, unknown>)
    .map((e) => ({ wrong: str(e.wrong, 160), right: str(e.right, 160), why: str(e.why, 60) }))
    .filter((e) => e.wrong && e.right && e.wrong.toLowerCase() !== e.right.toLowerCase())
    .filter((e) => e.wrong.trim().split(/\s+/).length >= 2)
    // 只在尾巴上补个 and / 逗号的「修正」不是修正，是小模型的幻觉。
    .filter((e) => {
      const w = e.wrong.toLowerCase().trim();
      const r = e.right.toLowerCase().trim();
      if (!r.startsWith(w)) return true;
      const suffix = r.slice(w.length).trim();
      return !/^(and|but|so|or|,|\.|;)?$/.test(suffix);
    })
    // 「文章没提到游泳，需要补充」——这不是改错，是内容建议，混进来只会让人以为语法错了。
    .filter((e) => !/缺少|没有提到|未提到|补充|需要添加|建议加|内容不够/.test(e.why))
    .filter((e) => {
      const k = e.wrong.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3);

  const avg = dims.reduce((n, d) => n + d.score, 0) / dims.length;

  // 小模型经常把「肯定」写成「提到了 A，但没有提到 B」——那是评价不是表扬，
  // 而且会和上面内容维度的结论打架。带转折的直接不要。
  const praiseRaw = str(raw.praise, 90);
  const praise = /没有|但|不够|缺少|漏|未|should|could/.test(praiseRaw) ? "" : praiseRaw;

  return {
    score: Math.round((avg / 5) * 100),
    dims,
    praise,
    tip: str(raw.tip, 90),
    better: str(raw.better, 240),
    errors,
  };
}
