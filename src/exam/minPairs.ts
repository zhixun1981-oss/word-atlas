/**
 * 最小对立对（Minimal Pairs）——只差一个音位的两个词。
 *
 * 对立对练习的价值不在「读对了没」，而在**定位混淆的到底是哪一对音**：
 * 识别器听到 sheep 而目标是 ship，就能直接说「/ɪ/ 发成 /iː/ 了」，
 * 这比一个笼统的分数有用得多。
 *
 * 音标取通用英式（DJ），只用于展示对立点，不做逐音素对齐。
 */

export interface MinPairWord {
  w: string;
  ipa: string;
}

export interface MinPair {
  id: string;
  a: MinPairWord;
  b: MinPairWord;
  /** 对立的音位，如 "/ɪ/ vs /iː/" */
  contrast: string;
  /** 组名，汇总时按组看哪类音位最弱 */
  group: string;
  /** 为什么会混、怎么分开 */
  tip: string;
}

/** 一个音位对立组：标题 + 说明 + 若干对。 */
export interface MinPairGroup {
  key: string;
  name: string;
  contrast: string;
  tip: string;
  pairs: [string, string][]; // [词A, 词B]
  ipa: Record<string, string>;
}

const GROUPS: MinPairGroup[] = [
  {
    key: "i",
    name: "短元音 vs 长元音",
    contrast: "/ɪ/ vs /iː/",
    tip: "/ɪ/ 短而松，下巴只开一条缝；/iː/ 长而紧，嘴角往两边拉。读 sheep 时把音拖长一点试试。",
    pairs: [
      ["ship", "sheep"],
      ["sit", "seat"],
      ["fill", "feel"],
      ["live", "leave"],
      ["bit", "beat"],
      ["rich", "reach"],
    ],
    ipa: {
      ship: "/ʃɪp/", sheep: "/ʃiːp/", sit: "/sɪt/", seat: "/siːt/",
      fill: "/fɪl/", feel: "/fiːl/", live: "/lɪv/", leave: "/liːv/",
      bit: "/bɪt/", beat: "/biːt/", rich: "/rɪtʃ/", reach: "/riːtʃ/",
    },
  },
  {
    key: "ae",
    name: "大口 a vs 小口 e",
    contrast: "/æ/ vs /e/",
    tip: "/æ/ 嘴张大、舌压低（像看牙医说「啊」）；/e/ 嘴半开、舌位中等。bad 张大嘴，bed 收着点。",
    pairs: [
      ["bad", "bed"],
      ["man", "men"],
      ["sat", "set"],
      ["bag", "beg"],
      ["had", "head"],
    ],
    ipa: {
      bad: "/bæd/", bed: "/bed/", man: "/mæn/", men: "/men/",
      sat: "/sæt/", set: "/set/", bag: "/bæɡ/", beg: "/beɡ/",
      had: "/hæd/", head: "/hed/",
    },
  },
  {
    key: "theta",
    name: "咬舌 vs 平舌",
    contrast: "/θ/ vs /s/",
    tip: "/θ/ 舌尖要伸到上下齿之间轻吹气（看得见舌头）；/s/ 舌尖抵下齿背，气从齿缝走。think 要露舌尖。",
    pairs: [
      ["think", "sink"],
      ["thick", "sick"],
      ["thin", "sin"],
      ["mouth", "mouse"],
      ["path", "pass"],
    ],
    ipa: {
      think: "/θɪŋk/", sink: "/sɪŋk/", thick: "/θɪk/", sick: "/sɪk/",
      thin: "/θɪn/", sin: "/sɪn/", mouth: "/maʊθ/", mouse: "/maʊs/",
      path: "/pɑːθ/", pass: "/pɑːs/",
    },
  },
  {
    key: "eth",
    name: "咬舌浊音 vs d",
    contrast: "/ð/ vs /d/",
    tip: "/ð/ 同样露舌尖但声带振动（手放喉咙能感到麻）；/d/ 舌尖抵上齿龈弹开。they 的开头要能看见舌头。",
    pairs: [
      ["they", "day"],
      ["there", "dare"],
      ["then", "den"],
      ["those", "doze"],
    ],
    ipa: {
      they: "/ðeɪ/", day: "/deɪ/", there: "/ðeə/", dare: "/deə/",
      then: "/ðen/", den: "/den/", those: "/ðəʊz/", doze: "/dəʊz/",
    },
  },
  {
    key: "lr",
    name: "舌侧 l vs 卷舌 r",
    contrast: "/l/ vs /r/",
    tip: "/l/ 舌尖抵上齿龈，气从舌头两侧走；/r/ 舌尖卷起悬空，不碰任何地方。light 的 l 要顶到牙龈。",
    pairs: [
      ["light", "right"],
      ["lead", "read"],
      ["lot", "rot"],
      ["fly", "fry"],
      ["play", "pray"],
    ],
    ipa: {
      light: "/laɪt/", right: "/raɪt/", lead: "/liːd/", read: "/riːd/",
      lot: "/lɒt/", rot: "/rɒt/", fly: "/flaɪ/", fry: "/fraɪ/",
      play: "/pleɪ/", pray: "/preɪ/",
    },
  },
  {
    key: "bp",
    name: "浊双唇 vs 清双唇",
    contrast: "/b/ vs /p/",
    tip: "两个都双唇紧闭再弹开。/b/ 声带先振、不送气（手放嘴前几乎没风）；/p/ 送气（有明显一股气）。pat 的 p 要喷气。",
    pairs: [
      ["bat", "pat"],
      ["big", "pig"],
      ["back", "pack"],
      ["rope", "robe"],
      ["cab", "cap"],
    ],
    ipa: {
      bat: "/bæt/", pat: "/pæt/", big: "/bɪɡ/", pig: "/pɪɡ/",
      back: "/bæk/", pack: "/pæk/", rope: "/rəʊp/", robe: "/rəʊb/",
      cab: "/kæb/", cap: "/kæp/",
    },
  },
  {
    key: "vw",
    name: "唇齿 v vs 圆唇 w",
    contrast: "/v/ vs /w/",
    tip: "/v/ 上齿咬下唇，能感到牙碰到唇；/w/ 双唇收圆突出，牙齿不碰唇。vet 咬唇，wet 圆唇。",
    pairs: [
      ["vet", "wet"],
      ["vine", "wine"],
      ["vest", "west"],
    ],
    ipa: {
      vet: "/vet/", wet: "/wet/", vine: "/vaɪn/", wine: "/waɪn/",
      vest: "/vest/", west: "/west/",
    },
  },
  {
    key: "ng",
    name: "舌尖鼻 n vs 舌根鼻 ŋ",
    contrast: "/n/ vs /ŋ/",
    tip: "/n/ 舌尖抵上齿龈出气（鼻尖有感）；/ŋ/ 舌根抬起抵软腭，只在鼻腔出声，舌尖不碰牙龈。thing 的结尾舌根要顶住。",
    pairs: [
      ["thin", "thing"],
      ["sin", "sing"],
      ["win", "wing"],
      ["ran", "rang"],
    ],
    ipa: {
      thin: "/θɪn/", thing: "/θɪŋ/", sin: "/sɪn/", sing: "/sɪŋ/",
      win: "/wɪn/", wing: "/wɪŋ/", ran: "/ræn/", rang: "/ræŋ/",
    },
  },
];

/** 展平成可练的对列表。 */
export const MIN_PAIRS: MinPair[] = GROUPS.flatMap((g) =>
  g.pairs.map(([aw, bw], i) => ({
    id: `${g.key}-${i}-${aw}-${bw}`,
    a: { w: aw, ipa: g.ipa[aw] ?? "" },
    b: { w: bw, ipa: g.ipa[bw] ?? "" },
    contrast: g.contrast,
    group: g.name,
    tip: g.tip,
  })),
);

export const MIN_PAIR_GROUPS = GROUPS.map((g) => ({
  key: g.key,
  name: g.name,
  contrast: g.contrast,
  tip: g.tip,
  count: g.pairs.length,
}));

/**
 * 反向诊断：识别结果正好是这对里的**另一个**词时，
 * 说明混淆的就是这对音位本身——这比分数更能说明问题。
 */
export function confusionOf(pair: MinPair, transcript: string): MinPairWord | null {
  const r = transcript
    .normalize("NFKC")
    .replace(/[.,!?;:，。！？；：]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!r) return null;
  const hit = (w: string) => r === w.toLowerCase() || r.split(" ").includes(w.toLowerCase());
  if (hit(pair.a.w)) return pair.a;
  if (hit(pair.b.w)) return pair.b;
  return null;
}
