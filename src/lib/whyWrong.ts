import type { Entry } from "../atlas/types";
import { levenshtein } from "./speech";

/**
 * 错因分析：这个词为什么容易错。
 *
 * 全部结论都从词条本身的数据推导（拼写形状、多义、词族、形近词），
 * 不凭空编造；推不出来时退回词条自带的 tip，再不行就说实话「没有明显陷阱」。
 */

export interface WhyWrong {
  /** 短标签，展示在错词旁。 */
  tag: string;
  /** 为什么会错。 */
  why: string;
  /** 怎么记住。 */
  tip: string;
}

const SILENT_LETTERS: [RegExp, string][] = [
  [/\bkn/i, "kn 开头 k 不发音"],
  [/\bwr/i, "wr 开头 w 不发音"],
  [/mb\b/i, "词尾 mb 的 b 不发音"],
  [/bt\b/i, "词尾 bt 的 b 不发音"],
  [/ght/i, "gh 不发音"],
  [/\bwh/i, "wh 里 h 有时不发音"],
  [/lk\b|lf\b|lm\b/i, "l 在这类词里不发音"],
  [/\bgn|\bpn|\bps/i, "首辅音不发音"],
  [/stle\b/i, "-tle 里 t 不发音"],
];

const SPELL_TRAPS: [RegExp, string, string][] = [
  [/(\w)\1(ed|ing|er|est)\b/i, "双写", "短元音 + 单辅音结尾，加 -ing/-ed 时要双写最后一个辅音。"],
  [/(tion|sion)\b/i, "名词后缀", "-tion / -sion 是名词后缀，别拼成 -cion / -shon。"],
  [/(able|ible)\b/i, "-able / -ible", "这两个后缀读音几乎一样，只能靠记：comfortable 是 -able。"],
  [/ei|ie/i, "ie 还是 ei", "口诀：i 前 e 后要读 /iː/（believe），除非前面是 c（receive）。"],
  [/(ous|ious|eous)\b/i, "-ous 结尾", "形容词后缀 -ous 元音常脱落：dangerous、famous。"],
  [/(ful|fully)\b/i, "-ful 只有一个 l", "full 加后缀时去掉一个 l：careful、hopefully。"],
  [/(ly)\b/i, "副词 -ly", "形容词 + ly 变副词，原词的 e 一般保留：quick → quickly。"],
  [/(ment|ness|ity)\b/i, "名词后缀", "这类后缀最容易漏字母，拆成 词根 + 后缀 记。"],
  [/(ough|augh)\b/i, "-ough 读音不规则", "though / through / cough / rough 读音各不相同，只能逐个记。"],
];

/**
 * 找出与某个词形近、容易看错的词。
 *
 * 两条过滤：① 派生关系不算混淆（cloud / cloudy 是同一个词，不是看错）；
 * ② 长度相同才允许差 2 个字母，长度不同只能差 1 个 —— 否则 cloud/cold 这类
 * 只因为都是 c 开头就被判成形近，会把真正的拼写坑（如 knife 的 k 不发音）盖掉。
 */
export function lookalikes(word: string, pool: string[]): string[] {
  const w = word.toLowerCase();
  const out: string[] = [];
  for (const c of pool) {
    const k = c.toLowerCase();
    if (k === w) continue;
    if (k.startsWith(w) || w.startsWith(k)) continue; // 派生/词族，不算看错
    const lenDiff = Math.abs(k.length - w.length);
    if (lenDiff > 2) continue;
    const d = levenshtein(w, k);
    const max = lenDiff === 0 ? 2 : 1;
    if (d > 0 && d <= max) out.push(c);
    if (out.length >= 3) break;
  }
  return out;
}

/** 主入口：给出这个词的错因与记法。 */
export function whyWrong(e: Entry, similar: string[] = []): WhyWrong {
  const w = e.w;

  // 1) 词条自带用法警示，优先级最高（那是编者标出来的坑）
  if (e.note) return { tag: "用法提醒", why: e.note, tip: e.tip || "按例句记，别单独背中文。" };

  // 2) 短语类：坑在搭配和语序
  if (w.includes(" ")) {
    return {
      tag: "短语",
      why: "短语的意思不等于字面相加，而且代词宾语要放中间（turn it off）。",
      tip: e.tip || "把它当一个整体背，带上例句一起记。",
    };
  }

  // 3) 不发音字母：听得出、写不出
  for (const [re, why] of SILENT_LETTERS) {
    if (re.test(w)) return { tag: "不发音字母", why, tip: e.tip || "按音节拆开读一遍，再对照拼写写。" };
  }

  // 4) 拼写规则陷阱（双写、-ough、ie/ei、-tion…）
  for (const [re, tag, why] of SPELL_TRAPS) {
    if (re.test(w)) return { tag, why, tip: e.tip || "出声拼一遍，别只在心里默念。" };
  }

  // 5) 形近词混淆：真的一眼看错（排在拼写坑之后，避免盖掉更确定的原因）
  if (similar.length) {
    return {
      tag: "形近混淆",
      why: `和 ${similar.join("、")} 只差一两个字母，看快了就认错。`,
      tip: "把两个词写在一起对比着背，注意中间不同的那一两个字母。",
    };
  }

  // 6) 一词多义：认识但选错义项
  if (e.senses.length > 2) {
    return {
      tag: "一词多义",
      why: `这个词有 ${e.senses.length} 个义项（${e.senses.map((s) => s.zh).slice(0, 3).join("、")}…），考的是你没记的那个。`,
      tip: "把每个义项各配一个例句，别只记第一个意思。",
    };
  }

  // 7) 词族大：考词性转换时容易选错形式
  if (e.fam.length >= 4) {
    return {
      tag: "词族",
      why: `同族词有 ${e.fam.slice(0, 4).join("、")} 等，PET 常考词性转换。`,
      tip: "先判断空格要什么词性（名词/形容词/副词），再选后缀。",
    };
  }

  // 8) 有明确反义/近义，容易张冠李戴
  if (e.ant.length) {
    return {
      tag: "反义干扰",
      why: `常和 ${e.ant.slice(0, 2).join("、")} 这类反义词一起考，一紧张就选反。`,
      tip: "把反义词成对背，记清楚哪个是哪个。",
    };
  }

  return {
    tag: e.tip ? "记忆点" : "多练几遍",
    why: "这个词没有拼写陷阱，也没有形近词和多个义项——错多半是记得还不够牢。",
    tip: e.tip || "用间隔复习多过几遍，隔天再来一次比连着背十遍管用。",
  };
}
