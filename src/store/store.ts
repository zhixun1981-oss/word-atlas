import { useRef, useSyncExternalStore } from "react";
import type { Accent } from "../atlas/types";
import type { CardState, Grade } from "./srs";

export type QuizKind = "meaning" | "picture" | "listen" | "spell";
export type Step = { id: string; kind: "intro" } | { id: string; kind: QuizKind; retry?: boolean; options?: string[] };

export interface ActiveSession {
  id: string;
  started: number;
  steps: Step[];
  index: number;
  /** First-attempt grade per word; retries never change it. */
  graded: Record<string, Grade>;
  newIds: string[];
  reviewIds: string[];
  /** Answer shown but not yet continued; survives reload without double counting. */
  pending?: { correct: boolean; value: string };
  finished?: number;
}

export interface DayStat {
  n: number; // new words met
  r: number; // graded reviews (first attempts)
  c: number; // correct first attempts
  t: number; // active seconds
}

export interface TypingRound {
  at: number;
  mode: "word" | "sentence" | "dictation";
  items: number;
  wpm: number;
  accuracy: number;
}

/** 单个语法考点的掌握度：答对数 / 答错数 / 最近一次练习时间。 */
export interface GrammarStat {
  right: number;
  wrong: number;
  at: number;
}

export interface ExamRound {
  at: number;
  kind: "cloze" | "definition" | "picture" | "mock" | "listening" | "speaking" | "writing" | "grammar" | "opencloze" | "gapfill" | "sign";
  items: number;
  correct: number;
  /** 0–100 百分制得分。口语/写作等评分型练习写入此项；其余题型由 correct/items 推算，留空。 */
  score?: number;
}

export interface Progress {
  version: 2;
  datasetId: string;
  cards: Record<string, CardState>;
  bookmarks: string[];
  days: Record<string, DayStat>;
  typing: TypingRound[];
  exam: ExamRound[];
  session: ActiveSession | null;
  /** Rolling list of recent mistakes, newest first. */
  mistakes: string[];
  /** Unlocked badge ids. */
  badges: string[];
  /** 语法考点掌握度，key 为 `exam/syllabus.ts` 里的考点 id。 */
  grammar: Record<string, GrammarStat>;
  /** 每日冲刺打卡：key 为日期(YYYY-MM-DD)，value 为当天已完成的冲刺任务 id 列表。 */
  sprint: Record<string, string[]>;
  /** 教室课时完成记录：key 为 `exam/curriculum.ts` 的课时 id，value 为完成时间戳。 */
  lessons: Record<string, number>;
  /** 单词笔记：key 为单词 id，value 为用户自己写的笔记/例句。 */
  notes: Record<string, string>;
  /** 单词标签：key 为单词 id，value 为标签数组。 */
  tags: Record<string, string[]>;
}

export interface Settings {
  accent: Accent;
  autoplay: boolean;
  dailyNew: number;
  retention: number;
  theme: "system" | "light" | "dark";
  sfx: boolean;
  spell: boolean;
  startLevel: number;
  onboarded: boolean;
  dataset: "open" | "private";
  ambience: "off" | "stars" | "rain" | "sea" | "forest" | "fire" | "voyage" | "cafe";
  ambienceVolume: number;
  splash: boolean;
  /** Exam prep target: 考试类型 + 考试日期 + 考点城市 */
  examLevel: "" | "KET" | "PET" | "FCE" | "IELTS" | "TOEFL" | "CET4" | "CET6" | "KAOYAN";
  examDate?: string;
  examCity?: string;
  /** Daily answered-question goal (0 = off). */
  dailyGoal: number;
  /** Daily word broadcast reminder (browser notification + in-app card). */
  dailyBroadcast: boolean;
  /** Preferred broadcast time as "HH:MM" (24h). */
  broadcastTime: string;
  /** Local LLM endpoint (Ollama compatible). Empty → default http://localhost:11434. */
  llmBase: string;
  /** Local model name for AI 口语陪练 / PK 对战. Empty → auto-pick a small chat model. */
  llmModel: string;
  /** 每日练习计划总天数（0 = 未开启）。开启后从 planStartedAt 起算，到结束日打卡。 */
  planTotal: number;
  /** 每日练习计划开始日期（YYYY-MM-DD），与 planTotal 配套。 */
  planStartedAt: string;
  /** 朗读用的系统语音名（空 = 自动挑最自然的那个）。 */
  voice: string;
  /** 朗读语速：0.75 / 1.0 / 1.25 */
  rate: number;
}

export const defaultSettings: Settings = {
  accent: "uk",
  autoplay: true,
  dailyNew: 10,
  retention: 0.9,
  theme: "dark",
  sfx: true,
  spell: true,
  startLevel: 0,
  onboarded: false,
  dataset: "open",
  ambience: "stars",
  ambienceVolume: 0.45,
  splash: true,
  examLevel: "",
  examCity: "",
  dailyGoal: 40,
  dailyBroadcast: false,
  broadcastTime: "09:00",
  llmBase: "",
  llmModel: "",
  planTotal: 0,
  planStartedAt: "",
  voice: "",
  rate: 0.92,
};

export const emptyProgress = (datasetId: string): Progress => ({
  version: 2,
  datasetId,
  cards: {},
  bookmarks: [],
  days: {},
  typing: [],
  exam: [],
  session: null,
  mistakes: [],
  badges: [],
  grammar: {},
  sprint: {},
  lessons: {},
  notes: {},
  tags: {},
});

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function planAddDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
function planDiffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}
function planFmtMD(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export interface DailyPlanState {
  active: boolean;
  total: number;
  dayNumber: number;
  remaining: number;
  endsOn: string;
  endsOnMD: string;
  doneDays: number;
  streak: number;
  todayDone: boolean;
  finished: boolean;
}

/** 计算「每日练习计划」的进度。未开启或参数非法时返回 active=false。 */
export function dailyPlan(s: Settings, p: Progress): DailyPlanState {
  const total = s.planTotal | 0;
  if (total <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(s.planStartedAt))
    return { active: false, total: 0, dayNumber: 0, remaining: 0, endsOn: "", endsOnMD: "", doneDays: 0, streak: 0, todayDone: false, finished: false };
  const today = dayKey();
  const elapsed = planDiffDays(s.planStartedAt, today); // 0 = 第一天
  const dayNumber = Math.min(total, Math.max(1, elapsed + 1));
  const remaining = Math.max(0, total - dayNumber);
  const endsOn = planAddDays(s.planStartedAt, total - 1);
  const endsOnMD = planFmtMD(endsOn);
  const todayDone = (p.days[today]?.r ?? 0) > 0;
  let doneDays = 0;
  const lastIdx = Math.min(elapsed, total - 1);
  for (let i = 0; i <= lastIdx; i++) if ((p.days[planAddDays(s.planStartedAt, i)]?.r ?? 0) > 0) doneDays++;
  let streak = 0;
  const d = new Date(today + "T00:00:00");
  if (!todayDone) d.setDate(d.getDate() - 1);
  while (true) {
    const k = dayKey(d);
    const idx = planDiffDays(s.planStartedAt, k);
    if (idx < 0 || idx >= total) break;
    if ((p.days[k]?.r ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return { active: true, total, dayNumber, remaining, endsOn, endsOnMD, doneDays, streak, todayDone, finished: elapsed >= total };
}

const SETTINGS_KEY = "word-atlas:settings";
const progressKey = (id: string) => `word-atlas:v2:${id}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---------- validation (backups and stored data are untrusted) ---------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, lo = -Infinity, hi = Infinity) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

function validCard(v: unknown): v is CardState {
  return (
    isObj(v) &&
    num(v.due, 0) &&
    num(v.s, 0) &&
    num(v.d, 0, 11) &&
    num(v.el, 0) &&
    num(v.sd, 0) &&
    num(v.ls, 0) &&
    num(v.reps, 0) &&
    num(v.lapses, 0) &&
    [0, 1, 2, 3].includes(v.st as number) &&
    (v.last === undefined || num(v.last, 0)) &&
    num(v.seen, 0)
  );
}

export function sanitizeProgress(v: unknown, datasetId: string): Progress {
  const out = emptyProgress(datasetId);
  if (!isObj(v) || v.version !== 2) return out;
  if (isObj(v.cards)) for (const [k, c] of Object.entries(v.cards)) if (validCard(c)) out.cards[k] = c;
  if (Array.isArray(v.bookmarks)) out.bookmarks = v.bookmarks.filter((x): x is string => typeof x === "string").slice(0, 20000);
  if (Array.isArray(v.mistakes)) out.mistakes = v.mistakes.filter((x): x is string => typeof x === "string").slice(0, 300);
  if (Array.isArray(v.badges)) out.badges = v.badges.filter((x): x is string => typeof x === "string").slice(0, 200);
  if (isObj(v.days))
    for (const [k, d] of Object.entries(v.days))
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && isObj(d) && num(d.n, 0) && num(d.r, 0) && num(d.c, 0) && num(d.t, 0))
        out.days[k] = { n: d.n as number, r: d.r as number, c: d.c as number, t: d.t as number };
  if (Array.isArray(v.typing))
    out.typing = v.typing
      .filter(
        (t): t is TypingRound =>
          isObj(t) && num(t.at, 0) && ["word", "sentence", "dictation"].includes(t.mode as string) && num(t.items, 0) && num(t.wpm, 0, 400) && num(t.accuracy, 0, 100),
      )
      .slice(-500);
  if (Array.isArray(v.exam))
    out.exam = v.exam
      .filter(
        (t): t is ExamRound =>
          isObj(t) &&
          num(t.at, 0) &&
          ["cloze", "definition", "picture", "mock", "listening", "speaking", "writing", "grammar", "opencloze", "gapfill"].includes(t.kind as string) &&
          num(t.items, 0) &&
          num(t.correct, 0) &&
          (t.score === undefined || num(t.score, 0, 100)),
      )
      .map((t) => ({ at: t.at, kind: t.kind as ExamRound["kind"], items: t.items, correct: t.correct, ...(t.score != null ? { score: t.score } : {}) }))
      .slice(-500);
  if (isObj(v.grammar))
    for (const [k, g] of Object.entries(v.grammar))
      if (/^[a-z0-9-]{1,40}$/.test(k) && isObj(g) && num(g.right, 0) && num(g.wrong, 0) && num(g.at, 0))
        out.grammar[k] = { right: g.right as number, wrong: g.wrong as number, at: g.at as number };
  const SPRINT_IDS = new Set(["quiz", "grammar", "opencloze", "gapfill", "speak", "write"]);
  if (isObj(v.sprint))
    for (const [k, list] of Object.entries(v.sprint))
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(list))
        out.sprint[k] = list.filter((x): x is string => typeof x === "string" && SPRINT_IDS.has(x)).slice(0, 12);
  if (isObj(v.lessons))
    for (const [k, at] of Object.entries(v.lessons))
      if (/^[a-z0-9-]{1,40}$/.test(k) && num(at, 0)) out.lessons[k] = at as number;
  if (isObj(v.notes))
    for (const [k, note] of Object.entries(v.notes))
      if (/^[a-z0-9-]{1,40}$/.test(k) && typeof note === "string" && note.length <= 500) out.notes[k] = note;
  if (isObj(v.tags))
    for (const [k, tags] of Object.entries(v.tags))
      if (/^[a-z0-9-]{1,40}$/.test(k) && Array.isArray(tags)) out.tags[k] = tags.filter((t): t is string => typeof t === "string" && t.length <= 20).slice(0, 5);
  const s = v.session;
  if (isObj(s) && typeof s.id === "string" && Array.isArray(s.steps) && num(s.index, 0) && isObj(s.graded))    out.session = s as unknown as ActiveSession;
  return out;
}

export function sanitizeSettings(v: unknown): Settings {
  const s = { ...defaultSettings };
  if (!isObj(v)) return s;
  if (v.accent === "uk" || v.accent === "us") s.accent = v.accent;
  if (typeof v.autoplay === "boolean") s.autoplay = v.autoplay;
  if (num(v.dailyNew, 0, 100)) s.dailyNew = Math.round(v.dailyNew as number);
  if (num(v.retention, 0.7, 0.97)) s.retention = v.retention as number;
  if (v.theme === "system" || v.theme === "light" || v.theme === "dark") s.theme = v.theme;
  if (typeof v.sfx === "boolean") s.sfx = v.sfx;
  if (typeof v.spell === "boolean") s.spell = v.spell;
  if (num(v.startLevel, 0, 5)) s.startLevel = Math.round(v.startLevel as number);
  if (typeof v.onboarded === "boolean") s.onboarded = v.onboarded;
  if (v.dataset === "open" || v.dataset === "private") s.dataset = v.dataset;
  if (["off", "stars", "rain", "sea", "forest", "fire", "voyage", "cafe"].includes(v.ambience as string)) s.ambience = v.ambience as Settings["ambience"];
  if (num(v.ambienceVolume, 0, 1)) s.ambienceVolume = v.ambienceVolume as number;
  if (typeof v.splash === "boolean") s.splash = v.splash;
  if (["", "KET", "PET", "FCE", "IELTS", "TOEFL", "CET4", "CET6", "KAOYAN"].includes(v.examLevel as string)) s.examLevel = v.examLevel as Settings["examLevel"];
  if (typeof v.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.examDate)) s.examDate = v.examDate;
  if (typeof v.examCity === "string" && v.examCity.length <= 20) s.examCity = v.examCity;
  if (typeof v.dailyGoal === "number" && Number.isFinite(v.dailyGoal) && v.dailyGoal >= 0 && v.dailyGoal <= 200) s.dailyGoal = v.dailyGoal;
  if (typeof v.dailyBroadcast === "boolean") s.dailyBroadcast = v.dailyBroadcast;
  if (typeof v.broadcastTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.broadcastTime)) s.broadcastTime = v.broadcastTime;
  if (typeof v.llmBase === "string" && /^https?:\/\/\S+$/.test(v.llmBase)) s.llmBase = v.llmBase.trim();
  if (typeof v.llmModel === "string" && v.llmModel.trim().length > 0 && v.llmModel.trim().length <= 64) s.llmModel = v.llmModel.trim();
  if (typeof v.planTotal === "number" && Number.isFinite(v.planTotal) && v.planTotal >= 0 && v.planTotal <= 1000) s.planTotal = Math.round(v.planTotal);
  if (typeof v.planStartedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.planStartedAt)) s.planStartedAt = v.planStartedAt;
  if (typeof v.voice === "string" && v.voice.length <= 80) s.voice = v.voice;
  if (num(v.rate, 0.5, 1.5)) s.rate = v.rate as number;
  return s;
}

/* ---------- store ---------- */

interface State {
  progress: Progress;
  settings: Settings;
  saveError: boolean;
}

let state: State = {
  progress: emptyProgress("word-atlas-open"),
  settings: sanitizeSettings(read(SETTINGS_KEY)),
  saveError: false,
};
const listeners = new Set<() => void>();
let saveTimer: number | undefined;
/** Only write when this tab changed something, so idle tabs never clobber newer data. */
let dirty = false;
/** Progress is written only after it has been read from storage for this dataset. */
let loadedId: string | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function scheduleSave() {
  dirty = true;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flush, 250);
}

export function flush() {
  window.clearTimeout(saveTimer);
  if (!dirty) return;
  dirty = false;
  const progressOk = loadedId !== state.progress.datasetId || write(progressKey(state.progress.datasetId), state.progress);
  const ok = progressOk && write(SETTINGS_KEY, state.settings);
  if (ok === state.saveError) {
    state = { ...state, saveError: !ok };
    emit();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  // Another tab saved: adopt its data instead of keeping a stale copy.
  window.addEventListener("storage", (e) => {
    if (!e.newValue) return;
    try {
      if (e.key === SETTINGS_KEY) state = { ...state, settings: sanitizeSettings(JSON.parse(e.newValue)) };
      else if (e.key === progressKey(state.progress.datasetId))
        state = { ...state, progress: sanitizeProgress(JSON.parse(e.newValue), state.progress.datasetId) };
      else return;
      emit();
    } catch {
      /* ignore malformed writes */
    }
  });
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  useDataset(datasetId: string) {
    flush();
    state = { ...state, progress: sanitizeProgress(read(progressKey(datasetId)), datasetId) };
    loadedId = datasetId;
    emit();
  },
  progress(fn: (p: Progress) => Progress) {
    state = { ...state, progress: fn(state.progress) };
    emit();
    scheduleSave();
  },
  settings(patch: Partial<Settings>) {
    state = { ...state, settings: { ...state.settings, ...patch } };
    emit();
    scheduleSave();
  },
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** 浅比较：内容一致时复用旧引用，避免 useSyncExternalStore 因每次新引用无限重渲染。 */
function snapshotStable<T>(prev: T | undefined, next: T): T {
  if (prev === undefined) return next;
  if (Object.is(prev, next)) return prev;
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return next;
    for (let i = 0; i < prev.length; i++) if (!Object.is(prev[i], next[i])) return next;
    return prev;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const pk = Object.keys(prev);
    const nk = Object.keys(next);
    if (pk.length !== nk.length) return next;
    for (const k of pk) if (!Object.is(prev[k], next[k])) return next;
    return prev;
  }
  return next;
}

export function useStore<T>(select: (s: State) => T): T {
  const cache = useRef<T | undefined>(undefined);
  const getSnapshot = () => {
    const next = select(state);
    const stable = snapshotStable(cache.current, next);
    cache.current = stable;
    return stable;
  };
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function bumpDay(p: Progress, patch: Partial<DayStat>): Progress {
  const k = dayKey();
  const d = p.days[k] ?? { n: 0, r: 0, c: 0, t: 0 };
  return {
    ...p,
    days: {
      ...p.days,
      [k]: { n: d.n + (patch.n ?? 0), r: d.r + (patch.r ?? 0), c: d.c + (patch.c ?? 0), t: d.t + (patch.t ?? 0) },
    },
  };
}

export function toggleBookmark(id: string) {
  store.progress((p) => ({
    ...p,
    bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [id, ...p.bookmarks],
  }));
}

/* ---------- backup ---------- */

export function exportBackup() {
  flush();
  const { progress, settings } = state;
  return JSON.stringify({ app: "word-atlas", version: 2, exported: new Date().toISOString(), progress: { ...progress, session: null }, settings }, null, 1);
}

function markDirty() {
  dirty = true;
}

export function importBackup(text: string): { ok: true; cards: number } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "文件不是有效的 JSON。" };
  }
  if (!isObj(data) || data.app !== "word-atlas" || data.version !== 2 || !isObj(data.progress))
    return { ok: false, error: "这不是拾词的学习备份。" };
  const id = state.progress.datasetId;
  if (data.progress.datasetId !== id) return { ok: false, error: "备份来自另一个词库，请先切换到对应词库。" };
  const progress = sanitizeProgress({ ...data.progress, session: null }, id);
  state = { ...state, progress, settings: { ...sanitizeSettings(data.settings), onboarded: true } };
  emit();
  markDirty();
  flush();
  return { ok: true, cards: Object.keys(progress.cards).length };
}

export function resetProgress() {
  state = { ...state, progress: emptyProgress(state.progress.datasetId) };
  emit();
  markDirty();
  flush();
}
