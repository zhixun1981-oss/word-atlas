/**
 * 浏览器朗读（TTS）。微课、口语、单词兜底发音都走这里。
 *
 * 只用 speechSynthesis，离线可用；没有可用语音时静默失败，
 * 由调用方决定要不要提示。
 *
 * 为什么要自己挑语音：macOS 的 en-US 列表里塞了十几个「趣味音效」
 * （Bad News / Bells / Boing / Bubbles / Zarvox…）和早期机器音
 * （Albert / Fred / Ralph），它们在 getVoices() 里排在自然音前面。
 * 直接取第一个，念出来就是那种又闷又怪的老先生音——所以这里按
 * 自然度白名单挑，选不到时才退回列表里的其他英文语音。
 */

export const ttsSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export interface SpeakOpts {
  /** BCP-47，默认 en-US。 */
  lang?: string;
  /** 语速，默认 0.92（略慢，适合跟读）。 */
  rate?: number;
  /** 音高，默认 1。 */
  pitch?: number;
  /** 指定语音名（用户在设置里选的）；空 = 自动挑。 */
  voice?: string;
}

/* 音效音、老人音、机器人音——永远不用。 */
const JUNK = [
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "fred",
  "good news",
  "grandma",
  "grandpa",
  "hysterical",
  "jester",
  "junior",
  "organ",
  "pipe organ",
  "ralph",
  "rocko",
  "superstar",
  "trinoids",
  "whisper",
  "wobble",
  "zarvox",
];

/* 自然度排序：越靠前越像真人（macOS / Windows / Chrome 常见名）。 */
const NATURAL: Record<string, string[]> = {
  "en-us": [
    "ava",
    "allison",
    "samantha",
    "susan",
    "zoe",
    "nicky",
    "aaron",
    "google us english",
    "microsoft aria",
    "microsoft jenny",
    "microsoft guy",
    "microsoft michelle",
    "eddy",
    "flo",
    "reed",
  ],
  "en-gb": [
    "daniel",
    "kate",
    "serena",
    "oliver",
    "arthur",
    "google uk english female",
    "google uk english male",
    "microsoft sonia",
    "microsoft libby",
    "microsoft ryan",
    "microsoft thomas",
    "sonia",
    "libby",
  ],
  "en-au": ["karen", "catherine", "gordon"],
  "en-ie": ["moira"],
  "en-in": ["rishi", "veena", "neerja"],
};

/** 「Eddy (英语（美国）)」→「eddy」。 */
const baseName = (n: string) => n.toLowerCase().replace(/\s*[(（].*$/, "").trim();
const normLang = (l: string) => l.replace("_", "-").toLowerCase();
const isJunk = (name: string) => {
  const b = baseName(name);
  return JUNK.some((j) => b === j || b.includes(j));
};

let cached: SpeechSynthesisVoice[] = [];
let preferred = "";
let preferredLang = "en-US";

/** 缓存一份语音列表；Chrome 首屏常返回空，等 voiceschanged 再补。 */
export function warmUpVoices() {
  if (!ttsSupported()) return;
  const s = window.speechSynthesis;
  const v = s.getVoices();
  if (v.length) cached = v;
  else s.addEventListener("voiceschanged", () => (cached = s.getVoices()), { once: true });
}

/** 当前可选的英文语音（已滤掉音效音），按自然度排序。 */
export function englishVoices(lang = "en-US"): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const s = window.speechSynthesis;
  const all = s.getVoices();
  if (all.length) cached = all;
  const want = normLang(lang);
  return cached
    .filter((v) => /^en/i.test(v.lang) && !isJunk(v.name))
    .map((v) => ({ v, score: scoreOf(v, want) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}

function scoreOf(v: SpeechSynthesisVoice, want: string): number {
  const base = baseName(v.name);
  const lang = normLang(v.lang);
  const list = NATURAL[want] ?? [];
  const rank = list.indexOf(base);
  let s = rank >= 0 ? 1000 - rank * 10 : 100;
  if (/enhanced|premium|neural|natural/i.test(v.name)) s += 300;
  if (lang === want) s += 200;
  else if (lang.slice(0, 2) === want.slice(0, 2)) s += 20;
  return s;
}

/** 用户在设置里指定的语音（"" = 自动）。 */
export function setPreferredVoice(name: string) {
  preferred = name;
}

/** 界面上选了英式/美式时同步过来，朗读默认跟随它。 */
export function setPreferredLang(lang: string) {
  preferredLang = lang;
}

/** 该语种下自动挑的那个语音，可能为 null（列表还没就绪）。 */
export function pickVoice(lang = preferredLang): SpeechSynthesisVoice | null {
  const list = englishVoices(lang);
  if (preferred) {
    const hit = list.find((v) => v.name === preferred) ?? (ttsSupported() ? window.speechSynthesis.getVoices().find((v) => v.name === preferred) : null);
    if (hit) return hit;
  }
  return list[0] ?? null;
}

/** 清掉 markdown 痕迹和破折号，念起来更像人话。 */
function polish(text: string) {
  return text
    .replace(/[*_`#>]+/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

let defaultRate = 0.92;
export function setDefaultRate(r: number) { defaultRate = r; }

/** 打断上一次朗读，念一段新文本。 */
export function speak(text: string, opts: SpeakOpts = {}): boolean {
  if (!ttsSupported()) return false;
  const clean = polish(text);
  if (!clean) return false;
  const { lang = preferredLang, rate = defaultRate, pitch = 1, voice } = opts;

  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;

  const chosen =
    (voice ? englishVoices(lang).find((v) => v.name === voice) : null) ?? pickVoice(lang);
  if (chosen) u.voice = chosen;

  synth.speak(u);
  return true;
}

export function stopSpeak() {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
}

export const isSpeaking = () => ttsSupported() && window.speechSynthesis.speaking;
