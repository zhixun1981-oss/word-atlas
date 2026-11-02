/** Normalize speech text for fuzzy matching (case, punctuation, spaces). */
export const normalizeSpeech = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:，。！？；：]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Levenshtein distance, used to grade pronunciation against the target. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array<number>(n + 1);
  let cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

export type SpeechGrade = "great" | "good" | "ok" | "try";

export interface SpeechResult {
  transcript: string;
  score: number; // 0..100
  grade: SpeechGrade;
  distance: number;
}

/**
 * Grade a spoken transcript against the target word.
 * Same word (or the target contained in the phrase) is a perfect score.
 */
export function gradeSpeech(transcript: string, target: string): SpeechResult {
  const t = normalizeSpeech(target);
  const r = normalizeSpeech(transcript);
  if (!r) return { transcript, score: 0, grade: "try", distance: t.length };
  if (r === t || r.includes(t) || t.includes(r)) return { transcript, score: 100, grade: "great", distance: 0 };
  // Compare against the longest word of the target (handles phrases loosely).
  const targetWords = t.split(" ");
  const best = targetWords.reduce(
    (best, w) => {
      const d = levenshtein(r, w);
      return d < best.d ? { d, w } : best;
    },
    { d: Infinity, w: targetWords[0] },
  );
  const d = best.d;
  const len = Math.max(1, Math.max(best.w.length, r.length));
  const ratio = 1 - d / len;
  const score = Math.round(100 * ratio);
  const grade: SpeechGrade = score >= 92 ? "great" : score >= 78 ? "good" : score >= 55 ? "ok" : "try";
  return { transcript, score, grade, distance: d };
}

type Rec = {
  start: () => void;
  stop: () => void;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
};

type Ctor = new () => Rec;

function recognizerCtor(): Ctor | null {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => typeof window !== "undefined" && !!recognizerCtor();

/** One-shot listen: resolves with the final transcript, rejects on error/unavailable. */
export function listenOnce(lang: string, timeoutMs = 8000): Promise<string> {
  const Ctor = recognizerCtor();
  if (!Ctor) return Promise.reject(new Error("unsupported"));
  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let transcript = "";
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        rec.stop();
        resolve(transcript.trim());
      }
    }, timeoutMs);
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) transcript += ev.results[i][0].transcript;
      }
    };
    rec.onerror = (ev) => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        reject(new Error(ev.error));
      }
    };
    rec.onend = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve(transcript.trim());
      }
    };
    rec.start();
  });
}
