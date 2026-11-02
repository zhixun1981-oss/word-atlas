/**
 * 从 Wikimedia Commons 批量找图补齐词库插画（不生图、零 credits）。
 *
 * 用法：node scripts/fetch-commons-imgs.mjs [--limit N] [--only word1,word2]
 * 幂等：已有 img/{id}.webp 的词自动跳过，可反复重跑接着补。
 *
 * 流程：Commons API 搜索 → 候选打分 → 下载 768 缩略 → 中心裁方 →
 * cwebp 生成 img/{id}.webp + thumb/{id}.webp → 点亮 media 位 →
 * 出处/许可证写 public/atlas/credits.json。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/atlas";
const UA = "WordAtlas/1.0 (local vocabulary learning app; illustration fetch)";
const MEDIA_IMG = 1;

// —— 纯功能词：给它们配图没有意义（占位板反而更合适）——
const SKIP = new Set([
  // 代词
  "he", "she", "we", "us", "them", "me", "his", "mine", "ours", "yours", "its",
  "themselves", "himself", "itself", "no one", "each other", "those",
  // 限定/否定/连接
  "the", "of", "to", "for", "not", "only", "then", "whether", "even though",
  "in order to", "in case", "of course", "in fact", "in the end",
  "first of all", "by the way", "by accident", "by mistake", "on purpose",
  "by name", "on request", "in half", "in two", "close to", "in time",
  "out of", "in front of", "next to", "instead of", "their", "you", "yours", "ours", "mine",
  // 情态/助动
  "could", "may", "will", "do", "have", "be", "cannot", "have got to", "used to",
  // 疑问/感叹
  "where", "what", "who", "wow", "bye", "yeah", "so-so", "yes", "no",
  // 称谓
  "Mr", "Mrs", "ID", "thank",
]);

// —— 歧义词/短语动词：给更好的检索词，别搜出 Go 语言 logo 之类的——
const HINTS = {
  go: "boarding a train departure travel",
  work: "office desk working computer",
  part: "puzzle piece",
  check: "check mark tick",
  past: "antique vintage objects",
  "get up": "waking up bed morning",
  "wake up": "alarm clock morning waking",
  "get dressed": "putting on clothes dressing",
  "look after": "child care babysitting",
  "turn off": "light switch off wall",
  "turn on": "light switch on wall",
  "turn down": "volume knob control",
  "turn up": "volume knob control",
  "turn into": "butterfly metamorphosis caterpillar",
  "pick up": "picking up cardboard box hands",
  "put on": "putting on shoes feet",
  "put away": "toy storage box tidy",
  "put out": "fire extinguisher putting out fire",
  "put off": "wall calendar date",
  "put down": "placing cup on table",
  "put through": "telephone switchboard operator",
  "go out": "leaving house through door",
  "go on": "hiking trail path continuing",
  "go for": "choosing selecting option",
  "go off": "alarm clock ringing",
  "get back": "coming home arrival doorstep",
  "get off": "getting off a bus",
  "get on": "boarding a bus",
  "get in": "getting into a car",
  "get down": "climbing down stairs",
  "get fit": "gym exercise fitness running",
  "take part": "marathon runners race",
  "take up": "yoga class hobby learning",
  "take place": "theatre stage performance",
  "take care of": "nursing care elderly hands",
  "work out": "gym workout weights exercise",
  "write down": "writing notebook pen",
  "fill in": "filling out a form pen",
  "fill up": "fuel pump petrol filling car",
  "find out": "magnifying glass detective searching",
  "break down": "car breakdown roadside hazard",
  "bring back": "returning library books",
  "give back": "handing back library book return",
  "give out": "handing out leaflets flyers",
  "give in": "white flag surrender",
  "give way": "yield traffic sign road",
  "fall over": "person tripping falling down",
  "lie down": "lying down resting bed",
  "tidy up": "cleaning room tidy shelves",
  "wash up": "washing dishes sink kitchen",
  "hang up": "hanging up telephone receiver",
  "hang out": "friends together outdoors talking",
  "ring back": "telephone ringing bell",
  "call in": "radio studio microphone calling",
  "call for": "protest signs crowd demanding",
  "check in": "airport check-in counter",
  "check out": "hotel reception desk counter",
  "hand in": "handing in homework paper",
  "hand out": "handing out flyers hands",
  "hand-held": "handheld game console device",
  "sign up": "signing a form pen paper",
  "wear out": "worn out shoes old",
  "throw away": "trash bin garbage waste",
  "cross out": "crossing out writing pencil paper",
  "cut up": "cutting vegetables knife chopping board",
  "set up": "pitching a tent camping",
  "set out": "hiking backpack trailhead",
  "set off": "fireworks launching sky",
  "carry on": "rolling suitcase airport travel",
  "carry out": "clipboard inspection checklist worker",
  "keep on": "walking forward path endurance",
  "keep up": "running keeping up jogging",
  "pass on": "relay race baton passing",
  "bring up": "parent child raising family",
  "ring up": "cash register checkout counter",
  "look up": "looking up at the sky stars",
  "look like": "twins two similar faces",
  "look forward to": "excited person waiting sunrise",
  "run out": "empty hourglass sand",
  "end up": "finish line flag race",
  "stay behind": "empty classroom desks school",
  "split up": "fork in the road diverging path",
  "make sure": "checklist clipboard checking",
  "keep on": "walking forward path endurance",
  "pass on": "relay race baton passing",
  "ring up": "cash register checkout counter",
  "work out": "gym workout weights exercise",
  "in love": "couple holding hands love",
  "on fire": "campfire flames burning",
  "on foot": "walking hiking boots trail",
  "on sale": "sale discount shop sign window",
  "by hand": "handmade pottery craft hands",
  "by post": "mailbox letters post",
  "on business": "business travel suitcase suit airport",
  "on holiday": "beach vacation sun umbrella",
  "on vacation": "beach vacation palm trees",
  "on board": "airplane cabin seats interior",
  "on time": "clock punctuality railway station",
  "in pencil": "pencil writing paper",
  "in ink": "fountain pen ink writing",
  "out of order": "out of order sign elevator",
  "out of work": "unemployment job centre queue",
  "out of date": "old outdated calendar pages",
  "working hours": "shop opening hours sign door",
  "opening hours": "store hours sign shop door",
  "full stop": "period punctuation mark writing",
  goodbye: "waving goodbye hand gesture",
  "thank you": "thank you greeting card note",
  "good evening": "evening sunset city lights",
  "good afternoon": "afternoon sunshine park",
  daily: "everyday routine calendar",
  safely: "seatbelt safety car buckle",
  relaxed: "hammock relaxing resting",
  underwater: "underwater coral reef fish",
  "face-to-face": "two people talking meeting conversation",
  "part-time": "clock half time work",
  "middle-aged": "middle aged man portrait",
  "extreme sport": "skydiving extreme sport parachute",
  "science fiction": "science fiction spaceship stars",
  "soap opera": "television drama screen",
  "climate change": "drought dry cracked earth",
  "global warming": "melting glacier ice climate",
  "weather forecast": "weather map forecast television",
  "primary school": "elementary school classroom children",
  "long jump": "long jump athletics sand pit",
  "horse-riding": "horse riding equestrian rider",
  "public transport": "city bus public transport",
  "traffic jam": "traffic jam cars highway congestion",
  "central heating": "radiator heater home",
  "ice hockey": "ice hockey match players",
  "ice skates": "ice skates boots blades",
  "ice skating": "ice skating rink skater",
  "table-cloth": "tablecloth table setting dinner",
  "chest of drawers": "dresser chest of drawers furniture",
  "driving licence": "driver license card identity",
  "credit card": "credit card payment terminal",
  "cash machine": "ATM cash machine bank",
  cashpoint: "ATM cash machine bank",
  "pocket money": "coins piggy bank savings",
  "washing machine": "washing machine laundry",
  "digital camera": "digital camera photography",
  "DVD player": "dvd player device black",
  "CD player": "compact disc cd player",
  "cell phone": "mobile phone smartphone hand",
  "text message": "phone texting message hands",
  "social media": "smartphone social media apps",
  "web page": "website browser screen laptop",
  "video game": "video game controller hands",
  "video clip": "video camera recording filming",
  "ID card": "identity card badge name",
  "sports centre": "gym sports centre building",
  "bus station": "bus station terminal",
  "bus stop": "bus stop sign street",
  "police station": "police station building entrance",
  "police car": "police car vehicle",
  "police officer": "police officer uniform",
  policewoman: "policewoman officer uniform",
  "department store": "department store shop interior",
  "shopping centre": "shopping mall interior",
  "petrol station": "gas station fuel pumps",
  "tourist information centre": "tourist information sign office",
  "traffic light": "traffic light signal red",
  footballer: "soccer player football match",
  "football player": "soccer player football match",
  "tennis player": "tennis player racket court",
  goalkeeper: "soccer goalkeeper gloves goal",
  interviewer: "job interview office two people",
  photographer: "photographer camera taking photo",
  superhero: "superhero costume cape",
  grandchild: "grandparent and child family",
  granny: "grandmother elderly woman portrait",
  grandma: "grandmother elderly woman",
  grandpa: "grandfather elderly man",
  girlfriend: "couple holding hands young",
  "business person": "businessman suit walking",
  businesswoman: "businesswoman suit professional",
  schoolchild: "school children uniform walking",
  "shop assistant": "shop assistant store counter",
  "travel agent": "travel agency office maps",
  "film maker": "film director camera set",
  headteacher: "school principal office teacher",
  footballer: "soccer player football match",
  "stomach ache": "stomach pain person holding",
  penfriend: "letters writing pen pals",
  tights: "tights leggings fashion",
  motorbike: "motorcycle motorbike parked",
  headphones: "headphones music listening",
  "polar bear": "polar bear arctic ice",
  "ice cream": "ice cream cone summer",
  camel: "camel desert sand",
  snail: "snail garden shell",
  hippo: "hippopotamus river africa",
  snowboard: "snowboard snow mountain",
  surfboard: "surfboard beach ocean waves",
  "swimming pool": "swimming pool water blue",
  "washing machine": "washing machine laundry",
  "tennis player": "tennis player racket",
  "sports centre": "gym sports centre",
  lemonade: "lemonade glass lemon drink",
  hoodie: "hoodie sweatshirt clothing",
  "main course": "restaurant meal plate dinner",
  "fast food": "fast food burger fries",
  disco: "disco dance floor lights",
  "hip hop": "hip hop dancer breakdance",
  skating: "skateboarding skater park",
  swimsuit: "swimsuit swimming bathing",
  "riding": "horse riding saddle",
  zoo: "zoo animals enclosure",
  snowfall: "snow falling winter snowflakes",
  gale: "stormy wind trees bending",
  leaf: "green leaf plant close",
  farmland: "farmland fields agriculture",
  stripe: "striped pattern fabric",
  sleeveless: "sleeveless shirt dress",
  underpants: "underpants underwear clothing",
  sweatshirt: "sweatshirt clothing casual",
  duvet: "duvet bed bedding",
  saucepan: "saucepan cooking pot kitchen",
  "frying pan": "frying pan cooking kitchen",
  ironing: "ironing clothes iron board",
  hairdryer: "hair dryer hairdressing",
  "seat belt": "seat belt car safety",
  handlebars: "bicycle handlebars close",
  "remote control": "remote control tv hand",
  "fax": "fax machine office",
  cheque: "cheque check bank paper",
  "web page": "website laptop screen",
  "chatroom": "chat bubbles messaging",
  "studying": "studying books desk",
  "singing": "singing microphone stage",
  "working": "working office laptop",
  "burning": "burning flames fire",
  "damaged": "damaged broken wall",
  "reduced": "sale price tag discount",
  "experienced": "experienced craftsman working",
  "confusing": "maze puzzle confusing",
  "uninteresting": "boring dull grey wall",
  "unimportant": "crumpled paper trash",
  "sleeveless": "sleeveless top fashion",
  "refreshments": "refreshments snacks table buffet",
  "cookery": "cooking kitchen chef",
  "prizes": "trophy prizes awards",
  "exams": "exam classroom students writing",
  "facilities": "gym facilities equipment",
  "retirement": "retirement elderly relaxing chair",
  "unemployment": "unemployment office queue",
  "nightclub": "nightclub neon lights dancing",
  "changing room": "changing room clothes shop fitting",
  "waiting room": "waiting room chairs airport",
  "search": "search magnifying glass",
  "server": "server rack data center",
  "sunbathe": "sunbathing beach towel",
  "diver": "scuba diver underwater",
  "photographer": "photographer camera",
  "publisher": "books publishing printing",
  "programmer": "programmer coding computer",
  "examiner": "teacher grading papers desk",
  "interviewer": "job interview",
  "supporter": "football fans cheering crowd",
  "guitarist": "guitarist playing guitar",
  "DJ": "DJ turntables music mixing",
  "shopper": "shopping bags person carrying",
  "businessperson": "businessman suit",
  "photographer": "photographer camera",
  "olympic": "olympic athletics stadium",
  "song": "singing microphone concert",
  "luck": "lucky four leaf clover",
  "feelings": "emotions happy sad faces",
  "details": "close up texture detail",
  "directions": "compass map directions navigation",
  deep: "deep ocean water",
  pence: "british coins penny money",
  "instructions": "instruction manual booklet reading",
  "regards": "greeting card writing letter",
  "pence": "british coins money",
  "working hours": "clock shop hours",
  "stomach ache": "person holding stomach pain",
  "table tennis": "table tennis ping pong",
  "digital camera": "digital camera",
  "good-looking": "portrait beautiful person face",
  "likely": "dice probability chance",
  "seriously": "serious face person thinking",
  "curiously": "curious person looking telescope",
  "somehow": "mystery question marks",
  "luck": "four leaf clover lucky",
  "studies": "studying library books",
  "instead of": "two paths choice fork",
  "while": "hourglass time sand",
  "take part": "marathon runners",
  "no one": null,
  "work out": "gym weights exercise",
  "up to date": "modern smartphone technology",
  "up to": "stairs climbing up",
  "on sale": "sale sign shop",
  "bring up": "parent child",
  "film maker": "film camera director",
  "furthest": "mountain horizon distance",
  "keep up": "jogging running",
  "turn into": "butterfly metamorphosis",
  "used to": "vintage old radio antique",
  "sign up": "registration form signing",
  "put through": "telephone operator",
  "go off": "alarm clock ringing",
  "give in": "white flag",
  "look like": "twins similar",
  "hang out": "friends outdoors",
  "check out": "hotel reception",
  "check-in": "airport check-in counter",
  "on board": "airplane cabin",
  "in order": "organized shelves orderly",
  "by hand": "handmade craft pottery",
  "in ink": "fountain pen writing",
  "in pencil": "pencil writing paper",
  "cross out": "crossing out paper",
  "handlebars": "bicycle handlebars",
  "in half": "scissors cutting paper",
  "in two": "fork diverging road",
  "out of": null,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// id 命名不统一（get-back / good morning 都有），匹配一律走归一化 key
const nk = (s) => s.toLowerCase().replace(/[-_ ]/g, "");
const SKIP_N = new Set([...SKIP].map(nk));
const HINTS_N = {};
for (const [k, v] of Object.entries(HINTS)) if (v) HINTS_N[nk(k)] = v;
const hintFor = (id) => HINTS_N[nk(id)] || null;

const curlOnce = (args) => execFileSync("curl", args, { maxBuffer: 40 * 1024 * 1024 });
const curlJson = (url) => {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const out = curlOnce(["-sL", "--connect-timeout", "4", "--max-time", "12", "-A", UA, url]);
      const txt = out.toString("utf8");
      if (!txt.trim()) throw new Error("empty body");
      return JSON.parse(txt);
    } catch (e) {
      last = e;
      execFileSync("sleep", ["0.4"]);
    }
  }
  throw last;
};

const stripTags = (s) => (s || "").replace(/<[^>]*>/g, "").trim();

function titleTokens(title) {
  return new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function scoreCandidate(p, word, hint) {
  const ii = p.imageinfo?.[0];
  if (!ii) return -99;
  const mime = ii.mime || "";
  if (!/jpe?g|png/.test(mime)) return -99;
  const w = ii.thumbwidth || ii.width || 0;
  const h = ii.thumbheight || ii.height || 0;
  if ((ii.width || 0) < 400 || (ii.height || 0) < 300) return -99;

  const title = (p.title || "").replace(/^File:/i, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ").toLowerCase();
  const wl = word.toLowerCase().replace(/-/g, " ");
  const tt = titleTokens(title);
  let s = 0;
  let titleHit = false;
  const flatT = title.replace(/[^a-z0-9]+/g, "");
  const flatW = wl.replace(/[^a-z0-9]+/g, "");
  if (title === wl) { s += 6; titleHit = true; }
  else if (title.includes(wl) || (flatW.length > 3 && flatT.includes(flatW))) { s += 4; titleHit = true; }
  const toks = wl.split(/\s+/).filter(Boolean);
  if (!titleHit && toks.length > 1) {
    // 必须在标题里连续出现（「dream like feel」不能给 feel like 记命中）
    const titleToks = title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (let i = 0; i + toks.length <= titleToks.length; i++) {
      if (toks.every((t, j) => titleToks[i + j] === t)) { s += 3; titleHit = true; break; }
    }
  }

  // 提示词实词（去掉词本身的 token）在标题里的命中数——多词短语用它把关，单词用它加权
  let hintOverlap = 0;
  if (hint) {
    const wordToks = new Set(wl.split(/\s+/));
    for (const t of hint.toLowerCase().split(/\s+/).filter((x) => x.length > 3)) {
      if (wordToks.has(t)) continue;
      if (tt.has(t)) hintOverlap++;
    }
    s += Math.min(hintOverlap * 3, 6);
  }

  if (/jpe?g/.test(mime)) s += 1;
  const ar = w && h ? w / h : 1;
  if (ar > 0.75 && ar < 1.5) s += 2;
  else if (ar > 0.55 && ar < 1.9) s += 1;
  else s -= 1;
  // 旧书刊/海报/图表/图标类扫描：不是词汇插画
  if (/magazine|journal|\bbook\b|annual|catalog|catalogue|cover|\bvol\.|volume \d|illustration|drawing|engraving|woodcut|lithograph|title.?card|coat.?of.?arms|logo|screenshot|font|typeface|diagram|chart|graph\b|icon\b|\bmap\b/i.test(title)) s -= 5;
  if (/\b1[89]\d\d\b/.test(title)) s -= 8; // 旧书刊扫描系统性不靠谱
  if (/\bmail\b|\becho\b|herald|tribune|gazette|\btimes\b|\bmirror\b|\bpost\b|telegraph|guardian|independent|journalism|timetable|schedule|hubble|galaxy|nebula|telescope|cosmos/i.test(title)) s -= 8;
  if (/deep.?learning|machine.?learning|neural|\bmike\b|president|senator|politician|congress|minister/i.test(title)) s -= 8;
  if (/\bnara\b|library of congress|\barchive\b|demobiliz|\btroops\b|regiment|battalion/i.test(title)) s -= 12; // 军事档案照
  if (/\bpackag|carton|paper box|\bbrand\b|\bproduct\b/i.test(title)) s -= 8; // 商品包装图
  if (/\bmuseum\b|\bexhibit|\bbay\b|\bisland\b|\bpark\b|viewed from|plate money/i.test(title)) s -= 12; // 地名/展陈陷阱
  if (/commons-|wiki|edit|symbol/i.test(title)) s -= 3;
  return { s, titleHit, hintOverlap };
}

async function fetchOne(word) {
  const hint = hintFor(word);
  const plain = word.replace(/-/g, " ");
  // Commons 检索多词是 AND 语义，提示词最多取 3 个实词，否则搜出 0 条
  const hintQ = hint
    ? hint.split(/\s+/).filter((t) => t.length > 2).slice(0, 3).join(" ")
    : null;
  const apiFor = (q) =>
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}` +
    "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=768";

  // 提示词查一遍；不够好再用原词查一遍，合并选优
  const queries = hintQ ? [{ q: hintQ, hint }, { q: plain, hint }] : [{ q: plain, hint: null }];
  const all = [];
  for (const { q, hint: h } of queries) {
    let data;
    try {
      data = curlJson(apiFor(q));
    } catch {
      continue;
    }
    const pages = Object.values(data.query?.pages || {});
    for (const pg of pages) all.push({ p: pg, ...scoreCandidate(pg, word, h), hinted: !!h });
    const good = all.some((x) => x.s >= (x.hinted ? 3 : 1) && (x.titleHit || x.hintOverlap >= 2 || !x.hinted));
    if (good) break;
  }
  if (!all.length) return { word, ok: false, reason: "no-result" };

  const ranked = all.filter((x) => x.s > -50).sort((a, b) => b.s - a.s);
  const multiword = word.includes("-") || word.includes(" ");
  const best = ranked.find((x) => {
    if (x.s < 1) return false;
    // hint 里含词本身 = 名词短语的检索增强（fast food burger fries）→ 宽松
    // hint 是纯释义 = 短语动词/歧义词（look after→child care）→ 必须命中释义实词
    const hintIsLexical = hint && word.split(/[-\s]+/).every((t) => hint.toLowerCase().split(/\s+/).includes(t));
    if (x.hinted && !hintIsLexical) return multiword ? x.hintOverlap >= 2 : x.hintOverlap >= 1;
    return x.titleHit; // 无 hint：必须标题命中，拦「A look inside an iceberg」
    return true;
  });
  if (!best) return { word, ok: false, reason: "no-good-candidate" };

  const ii = best.p.imageinfo[0];
  const src = ii.thumburl || ii.url;
  const safe = word.replace(/[^a-zA-Z0-9]+/g, "_");
  const tmp = `/tmp/commons-dl/${safe}.jpg`;
  const crop = `/tmp/commons-dl/${safe}-crop.jpg`;
  try {
    for (let i = 0; ; i++) {
      try {
        curlOnce(["-sL", "--connect-timeout", "4", "--max-time", "20", "-A", UA, "-o", tmp, src]);
        if (fs.statSync(tmp).size > 0) break;
        throw new Error("empty");
      } catch (e) {
        if (i >= 2) throw e;
        execFileSync("sleep", ["0.6"]);
      }
    }
    const size = fs.statSync(tmp).size;
    if (size < 12 * 1024) return { word, ok: false, reason: "too-small-file" };

    const probe = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", tmp], { encoding: "utf8" });
    const w = Number(/pixelWidth:\s*(\d+)/.exec(probe)?.[1] || 0);
    const h = Number(/pixelHeight:\s*(\d+)/.exec(probe)?.[1] || 0);
    if (w < 300 || h < 220) return { word, ok: false, reason: `tiny ${w}x${h}` };

    const side = Math.min(w, h);
    execFileSync("sips", ["-c", String(side), String(side), tmp, "--out", crop], { stdio: "pipe" });
    execFileSync("cwebp", ["-q", "88", "-resize", "768", "768", crop, "-o", `${ROOT}/img/${word}.webp`], { stdio: "pipe" });
    execFileSync("cwebp", ["-q", "88", "-resize", "256", "256", crop, "-o", `${ROOT}/thumb/${word}.webp`], { stdio: "pipe" });

    const outSize = fs.statSync(`${ROOT}/img/${word}.webp`).size;
    if (outSize < 5 * 1024) {
      fs.rmSync(`${ROOT}/img/${word}.webp`, { force: true });
      fs.rmSync(`${ROOT}/thumb/${word}.webp`, { force: true });
      return { word, ok: false, reason: "webp-too-small" };
    }

    const em = ii.extmetadata || {};
    return {
      word,
      ok: true,
      title: best.p.title,
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.p.title.replace(/ /g, "_"))}`,
      license: stripTags(em.LicenseShortName?.value) || "see Commons",
      artist: stripTags(em.Artist?.value) || "unknown",
      score: best.s,
    };
  } catch (e) {
    return { word, ok: false, reason: "dl-fail " + String(e).slice(0, 80) };
  }
}

function lightBits(ids) {
  const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
  const chunk = idx.chunk;
  const byChunk = new Map();
  let lit = 0;
  for (const id of ids) {
    const i = idx.words.findIndex((r) => r[0] === id);
    if (i < 0) continue;
    const cn = Math.floor(i / chunk);
    const cp = i % chunk;
    if (!byChunk.has(cn)) byChunk.set(cn, JSON.parse(fs.readFileSync(`${ROOT}/entries/${cn}.json`, "utf8")));
    const arr = byChunk.get(cn);
    if (arr[cp] && arr[cp].id === id) {
      arr[cp].m = (arr[cp].m || 0) | MEDIA_IMG;
      idx.words[i][6] = (idx.words[i][6] || 0) | MEDIA_IMG;
      lit++;
    }
  }
  for (const [cn, arr] of byChunk) fs.writeFileSync(`${ROOT}/entries/${cn}.json`, JSON.stringify(arr));
  let ill = 0;
  for (const r of idx.words) if (r[6] & MEDIA_IMG) ill++;
  idx.illustrated = ill;
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(idx));
  return { lit, illustrated: ill };
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;
  const shardIdx = args.indexOf("--shard");
  const noBits = args.includes("--no-bits");
  if (args.includes("--apply")) return applyAll();
  const shard = shardIdx >= 0 ? args[shardIdx + 1].split("/").map(Number) : null;
  const results = [];
  const got = [];
  const credits = {};
  const creditsPath = `${ROOT}/credits.json`;

  fs.mkdirSync("/tmp/commons-dl", { recursive: true });
  const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
  const have = new Set(fs.readdirSync(`${ROOT}/img`).filter((f) => f.endsWith(".webp")));

  let todo = idx.words
    .map((r) => r[0])
    .filter((id) => !have.has(id + ".webp") && !SKIP_N.has(nk(id)) && (!only || only.has(id)));
  if (shard) todo = todo.filter((_, i) => i % shard[1] === shard[0] - 1);
  todo = todo.slice(0, limit);

  console.log(`todo: ${todo.length} words (shard=${shard ? shard.join("/") : "all"}, noBits=${noBits})`);

  for (let n = 0; n < todo.length; n++) {
    const word = todo[n];
    const r = await fetchOne(word);
    results.push(r);
    if (r.ok) {
      got.push(word);
      credits[word] = { title: r.title, page: r.page, license: r.license, artist: r.artist, source: "Wikimedia Commons" };
      console.log(`[OK ${n + 1}/${todo.length}] ${word} <- ${r.title} (${r.license})`);
    } else {
      console.log(`[-- ${n + 1}/${todo.length}] ${word}: ${r.reason}`);
    }
    if (r.ok) fs.appendFileSync("/tmp/commons-credits.jsonl", JSON.stringify({ [word]: credits[word] }) + "\n");
    await sleep(120);
  }

  const okN = results.filter((r) => r.ok).length;
  let illNote = "";
  if (!noBits && got.length) illNote = `, illustrated=${lightBits(got).illustrated}`;
  console.log(`\n=== done: ${okN}/${todo.length} imaged${illNote} ===`);
  const fails = results.filter((r) => !r.ok);
  console.log(`failed ${fails.length}:`, fails.slice(0, 30).map((f) => `${f.word}(${f.reason})`).join(", "));
}

function applyAll() {
  const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
  const credits = fs.existsSync(`${ROOT}/credits.json`)
    ? JSON.parse(fs.readFileSync(`${ROOT}/credits.json`, "utf8"))
    : {};
  if (fs.existsSync("/tmp/commons-credits.jsonl")) {
    for (const line of fs.readFileSync("/tmp/commons-credits.jsonl", "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        for (const [k, v] of Object.entries(rec)) credits[k] = v;
      } catch {}
    }
    fs.writeFileSync(`${ROOT}/credits.json`, JSON.stringify(credits, null, 1));
  }
  const imgSet = new Set(fs.readdirSync(`${ROOT}/img`).filter((f) => f.endsWith(".webp")));
  const thumbSet = new Set(fs.readdirSync(`${ROOT}/thumb`).filter((f) => f.endsWith(".webp")));
  const chunk = idx.chunk;
  const byChunk = new Map();
  const getChunk = (cn) => {
    if (!byChunk.has(cn)) byChunk.set(cn, JSON.parse(fs.readFileSync(`${ROOT}/entries/${cn}.json`, "utf8")));
    return byChunk.get(cn);
  };
  let lit = 0, unlit = 0;
  // 一遍扫：灭（灯亮无图）/点（有图无灯），同一份 idx 上改，最后一次性写回
  for (let i = 0; i < idx.words.length; i++) {
    const r = idx.words[i];
    const hasFile = imgSet.has(r[0] + ".webp");
    const bit = (r[6] || 0) & MEDIA_IMG;
    const cn = Math.floor(i / chunk);
    const cp = i % chunk;
    const arr = getChunk(cn);
    const e = arr[cp];
    if (!e || e.id !== r[0]) continue;
    if (hasFile && !bit) {
      r[6] = (r[6] || 0) | MEDIA_IMG;
      e.m = (e.m || 0) | MEDIA_IMG;
      lit++;
    } else if (!hasFile && bit) {
      r[6] = (r[6] || 0) & ~MEDIA_IMG;
      e.m = (e.m || 0) & ~MEDIA_IMG;
      unlit++;
    } else if (hasFile && bit && !thumbSet.has(r[0] + ".webp")) {
      console.log("WARN: has img but missing thumb:", r[0]);
    }
  }
  for (const [cn, arr] of byChunk) fs.writeFileSync(`${ROOT}/entries/${cn}.json`, JSON.stringify(arr));
  let ill = 0;
  for (const r of idx.words) if (r[6] & MEDIA_IMG) ill++;
  idx.illustrated = ill;
  fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(idx));
  console.log(`applied: credits=${Object.keys(credits).length}, lit ${lit}, unlit ${unlit}, illustrated=${ill}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
