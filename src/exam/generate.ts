import type { Atlas, Entry, WordRef } from "../atlas/types";
import { gap, shuffle } from "../lib/text";

export type ExamKind = "cloze" | "definition" | "picture" | "listen";

export interface ExamQuestion {
  id: string;
  kind: ExamKind;
  w: string;
  zh: string;
  cefr: string;
  topic: string;
  /** cloze: the example sentence split around the gap. */
  cloze?: { before: string; after: string; zh: string };
  /** definition: English gloss shown as the prompt. */
  gloss?: string;
  pos?: string;
  /** picture: illustration URL (null when atlas has no image). */
  image: string | null;
  /** listen: the sentence audio and its text (shown after answering). */
  listen?: { en: string; url: string | null; gap?: { before: string; after: string } };
  /** listen: "pick" finds the spoken word among options; "fill" completes a gapped sentence. */
  listenMode?: "pick" | "fill";
  answer: string;
  options: string[];
}

const OPTION_COUNT = 4;

/** Pick up to n distractor headwords, preferring same CEFR then same topic. */
function distractors(atlas: Atlas, e: Entry, n: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>([e.w.toLowerCase()]);
  const want = (w: WordRef) => {
    const key = w.word.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(w.word);
  };
  const cefrIdx = atlas.cefr.indexOf(e.cefr);
  for (const w of atlas.words) if (w.cefr === cefrIdx && w.topic === atlas.topics.findIndex((t) => t[0] === e.topic)) want(w);
  for (const w of atlas.words) if (w.cefr === cefrIdx) want(w);
  for (const w of atlas.words) want(w);
  return out.slice(0, n);
}

function buildOptions(answer: string, dist: string[]): string[] {
  const options = [answer, ...dist.slice(0, OPTION_COUNT - 1)];
  return shuffle(options, answer.length * 7919 + options.length);
}

/** Build one question of the given kind for a headword; null when the prompt can't be made. */
function buildOne(atlas: Atlas, e: Entry, kind: ExamKind): ExamQuestion | null {
  const dist = distractors(atlas, e, OPTION_COUNT - 1);
  if (dist.length < OPTION_COUNT - 1) return null;
  if (kind === "cloze") {
    const g0 = gap(e.ex?.[0]?.en ?? "", e.w);
    const g1 = !g0 ? gap(e.ex?.[1]?.en ?? "", e.w) : undefined;
    const g = g0 ?? g1;
    if (!g) return null;
    const zh = g0 ? e.ex?.[0]?.zh ?? "" : e.ex?.[1]?.zh ?? "";
    return {
      id: e.id,
      kind,
      w: e.w,
      zh: e.senses[0].zh,
      cefr: e.cefr,
      topic: e.topic,
      cloze: { before: g.before, after: g.after, zh },
      image: null,
      answer: e.w,
      options: buildOptions(e.w, dist),
    };
  }
  if (kind === "definition") {
    const s0 = e.senses[0];
    if (!s0?.en) return null;
    return {
      id: e.id,
      kind,
      w: e.w,
      zh: s0.zh,
      cefr: e.cefr,
      topic: e.topic,
      gloss: s0.en,
      pos: s0.pos,
      image: null,
      answer: e.w,
      options: buildOptions(e.w, dist),
    };
  }
  const img = atlas.img(e);
  if (!img) return null;
  return {
    id: e.id,
    kind,
    w: e.w,
    zh: e.senses[0].zh,
    cefr: e.cefr,
    topic: e.topic,
    image: img,
    answer: e.w,
    options: buildOptions(e.w, dist),
  };
}

export function generateExam(atlas: Atlas, entries: Entry[], kind: ExamKind, count = 10): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  for (const e of entries) {
    if (questions.length >= count) break;
    const q = buildOne(atlas, e, kind);
    if (q) questions.push(q);
  }
  return shuffle(questions, 20261030);
}

const MOCK_KINDS: ExamKind[] = ["cloze", "definition", "picture"];

/**
 * A mixed-paper mock exam from already-loaded entries: question kinds are
 * interleaved (cloze → definition → picture → …) like a real paper.
 */
export function generateMockExam(atlas: Atlas, entries: Entry[], count = 20): ExamQuestion[] {
  const listenCount = Math.max(3, Math.round(count * 0.25));
  const questions: ExamQuestion[] = [];
  let li = 0;
  entries.slice(0, count).forEach((e, i) => {
    if (i % 4 === 3 && li < listenCount) {
      const lq = buildListeningOne(atlas, e, li % 2 === 1);
      if (lq) {
        questions.push(lq);
        li++;
        return;
      }
    }
    const q = buildOne(atlas, e, MOCK_KINDS[i % MOCK_KINDS.length]);
    if (q) questions.push(q);
  });
  return questions.slice(0, count);
}

/** Build one listening question; wantFill requests the gap-fill variant. */
function buildListeningOne(atlas: Atlas, e: Entry, wantFill: boolean): ExamQuestion | null {
  const en = e.ex?.[0]?.en ?? "";
  if (!en) return null;
  const dist: string[] = [];
  const seen = new Set([e.w.toLowerCase()]);
  const cefrIdx = atlas.cefr.indexOf(e.cefr);
  for (const w of atlas.words) {
    if (w.cefr !== cefrIdx) continue;
    const key = w.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dist.push(w.word);
    if (dist.length >= OPTION_COUNT - 1) break;
  }
  if (dist.length < OPTION_COUNT - 1) return null;
  let gapInfo: { before: string; after: string } | undefined;
  let mode: "pick" | "fill" = "pick";
  if (wantFill) {
    const g = gap(en, e.w);
    if (g && g.hidden) {
      gapInfo = { before: g.before, after: g.after };
      mode = "fill";
    }
  }
  return {
    id: e.id,
    kind: "listen",
    w: e.w,
    zh: e.senses[0].zh,
    cefr: e.cefr,
    topic: e.topic,
    image: null,
    listen: { en, url: atlas.audio(e, "ex"), gap: gapInfo },
    listenMode: mode,
    answer: e.w,
    options: shuffle([e.w, ...dist], e.w.length * 7919 + dist.length),
  };
}

/**
 * A placement quiz: definition questions from A1 → A2 → B1 in difficulty
 * order, so the report can estimate vocabulary size per level.
 */
export function generatePlacement(atlas: Atlas, entries: Entry[], perTier = 8): ExamQuestion[] {
  const order = (["A1", "A2", "B1"] as const)
    .map((lvl) => entries.filter((e) => e.cefr === lvl))
    .flat();
  const questions: ExamQuestion[] = [];
  for (const e of order) {
    if (questions.length >= perTier * 3) break;
    const q = buildOne(atlas, e, "definition");
    if (q) questions.push(q);
  }
  return questions;
}

/**
 * Listening questions: play the first example sentence, pick the keyword it
 * contains from four options (KET/PET Listening style).
 */
export function generateListening(atlas: Atlas, entries: Entry[], count = 10): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  let fillNext = false;
  for (const e of entries) {
    if (questions.length >= count) break;
    const q = buildListeningOne(atlas, e, fillNext);
    fillNext = !fillNext;
    if (q) questions.push(q);
  }
  return questions;
}
