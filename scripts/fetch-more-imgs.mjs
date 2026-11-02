/**
 * 第二代补图：Commons 分类直取 + Commons 语料页头图 + 关键词搜索，三源合并。
 * 目标：上一轮 217 个「搜不到/被质检毙掉」的词，用分类与隐喻提示词再抓一遍。
 *
 * 用法：node scripts/fetch-more-imgs.mjs [--only w1,w2] [--shard i/n] [--limit N]
 * 幂等：已有 img/{id}.webp 的跳过。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = "public/atlas";
const UA = "WordAtlas/1.0 (local vocabulary learning app; illustration fetch)";
const MEDIA_IMG = 1;

// —— 功能词：占位板比配图合适 ——
const SKIP = new Set([
  "he", "she", "we", "us", "them", "me", "his", "mine", "ours", "yours", "its",
  "themselves", "himself", "itself", "no one", "each other", "those",
  "the", "of", "to", "for", "not", "only", "then", "whether", "even though",
  "in order to", "in case", "of course", "in fact", "in the end",
  "first of all", "by the way", "by accident", "by mistake", "on purpose",
  "by name", "on request", "in half", "in two", "close to", "in time",
  "out of", "in front of", "next to", "instead of", "their", "you",
  "could", "may", "will", "do", "have", "be", "cannot", "have got to", "used to",
  "where", "what", "who", "wow", "bye", "yeah", "so-so", "yes", "no",
  "Mr", "Mrs", "ID", "thank",
]);

// —— 检索提示词（含上一轮缺的 97 个：实物直给、抽象词给经典隐喻）——
const HINTS = {
  // ==== 上一轮已有（保留，修正 -2 后缀匹配在 nk 里处理）====
  go: "boarding a train departure travel",
  work: "office desk working computer",
  part: "puzzle piece",
  "get up": "waking up bed morning",
  "get dressed": "putting on clothes dressing",
  "look after": "child care babysitting",
  "turn off": "light switch off wall",
  "turn on": "light switch on wall",
  "turn into": "butterfly metamorphosis caterpillar",
  "pick up": "picking up cardboard box hands",
  "put on": "putting on shoes feet",
  "put away": "toy storage box tidy",
  "put down": "placing cup on table",
  "get back": "suitcase arriving home front door doorstep",
  "get off": "getting off a bus",
  "get on": "boarding a bus",
  "get in": "getting into a car",
  "take up": "yoga class hobby learning",
  "take care of": "nursing care elderly hands",
  "work out": "gym workout weights exercise",
  "write down": "writing notebook pen",
  "find out": "magnifying glass detective searching",
  "break down": "car breakdown roadside hazard",
  "give back": "handing back library book return",
  "give out": "handing out leaflets flyers",
  "give in": "white flag surrender",
  "fall over": "person tripping falling down",
  "hang up": "hanging up telephone receiver",
  "hang out": "friends together outdoors talking",
  "ring back": "telephone ringing bell",
  "check in": "airport check-in counter",
  "hand in": "handing in homework paper",
  "hand out": "handing out flyers hands",
  "sign up": "signing a form pen paper",
  "throw away": "trash bin garbage waste",
  "cross out": "crossing out writing pencil paper",
  "set up": "pitching a tent camping",
  "set out": "hiking backpack trailhead",
  "set off": "fireworks launching sky",
  "carry on": "luggage suitcase airport terminal",
  "carry out": "takeaway food bag restaurant",
  "keep on": "walking forward path endurance",
  "pass on": "relay race baton passing",
  "bring up": "parent child raising family",
  "look up": "looking up at the sky stars",
  "look like": "twins two similar faces",
  "look forward to": "excited person waiting sunrise",
  "run out": "empty hourglass sand",
  "end up": "finish line flag race",
  "stay behind": "empty classroom desks school",
  "split up": "fork in the road diverging path",
  "make sure": "checklist clipboard checking",
  "by post": "mailbox letters post",
  "on business": "business travel suitcase suit airport",
  "on board": "airplane cabin seats interior",
  "on time": "clock punctuality railway station",
  "in pencil": "pencil writing paper",
  "out of work": "unemployment job centre queue",
  "out of date": "old outdated calendar pages",
  "full stop": "period punctuation mark writing",
  "good afternoon": "afternoon sunshine park",
  daily: "everyday routine calendar",
  relaxed: "hammock relaxing resting",
  underwater: "underwater coral reef fish",
  "face-to-face": "two people talking meeting conversation",
  "part-time": "clock half time work",
  "extreme sport": "skydiving extreme sport parachute",
  "soap opera": "television drama screen",
  "climate change": "drought dry cracked earth",
  "global warming": "melting glacier ice climate",
  "weather forecast": "weather map forecast television",
  "central heating": "radiator heater home",
  "cash machine": "ATM cash machine bank",
  "text message": "phone texting message hands",
  "web page": "website browser screen laptop",
  "video clip": "video camera recording filming",
  "tourist information centre": "tourist information sign office",
  interviewer: "job interview office two people",
  superhero: "superhero costume cape",
  grandpa: "grandfather elderly man",
  businesswoman: "businesswoman suit professional",
  "travel agent": "travel agent holiday booking vacation",
  "film maker": "film director camera set",
  headteacher: "school principal office teacher",
  "stomach ache": "stomach pain person holding",
  penfriend: "pen pals letters friendship",
  lemonade: "lemonade glass lemon drink",
  "fast food": "fast food burger fries",
  skating: "skateboarding skater park",
  gale: "stormy wind trees bending",
  stripe: "striped pattern fabric",
  sleeveless: "sleeveless shirt dress",
  sweatshirt: "sweatshirt hoodie casual clothing",
  saucepan: "saucepan cooking pot kitchen",
  "frying pan": "frying pan cooking kitchen",
  "remote control": "remote control tv hand",
  chatroom: "chat bubbles messaging",
  studies: "studying books desk",
  damaged: "damaged broken wall",
  experienced: "experienced craftsman working",
  confusing: "maze puzzle confusing",
  uninteresting: "boring dull grey wall",
  prizes: "trophy prizes awards",
  search: "search magnifying glass",
  sunbathe: "sunbathing beach towel",
  publisher: "books publishing printing",
  programmer: "programmer coding computer",
  examiner: "teacher grading papers desk",
  guitarist: "guitarist playing guitar",
  olympic: "olympic athletics stadium",
  details: "close up texture detail",
  instructions: "instruction manual booklet reading",
  deep: "deep ocean water",
  likely: "dice probability chance",
  curiously: "curious person looking telescope",
  somehow: "mystery question marks",
  furthest: "mountain horizon distance",
  "up to date": "modern smartphone technology",
  "up to": "stairs climbing up",
  "in order": "organized shelves orderly",
  "show up": "person arriving doorway appearing",

  // ==== 本轮新增：上一轮 97 个裸奔词 ====
  "look at": "person looking at painting gallery",
  dressed: "man in suit formal clothes",
  sad: "crying child tears sad face",
  "sitting room": "living room sofa interior",
  fry: "frying food pan cooking stove",
  "come on": "cheering encouragement sports crowd",
  mum: "mother child hug family",
  unsure: "shrugging shoulders doubt person",
  particularly: "spotlight single highlight focus",
  "how much": "price tag question shopping",
  "well-known": "Eiffel Tower famous landmark",
  "dial up": "dial-up modem telephone connection",
  keeper: "soccer goalkeeper gloves diving save",
  "break in": "burglar breaking door forced entry",
  rider: "horse rider equestrian jumping",
  "navy blue": "navy blue suit uniform fabric",
  quit: "resignation letter quitting job desk",
  // —— B2 隐喻 ——
  affluent: "luxury villa wealthy mansion rich",
  breach: "broken padlock chain security breach",
  converge: "converging railway tracks perspective roads",
  deduce: "puzzle pieces logic thinking brain",
  delegate: "delegation conference badges meeting",
  ideological: "political demonstration banners protest",
  accumulate: "stacking coins pile savings growing",
  adaptive: "chameleon camouflage adaptation animal",
  anticipate: "countdown calendar expectation waiting",
  avert: "avoiding danger warning sign turn away",
  bolster: "reinforcing support pillar brick wall",
  comply: "rules sign obey checklist compliance",
  defer: "calendar postponed delay date pin",
  eligible: "approved checkmark qualification badge",
  emanate: "light rays sun beams emanating",
  engender: "seed sprout growing cause soil",
  invoke: "magic wand sparkle spell casting",
  // —— C1 隐喻 ——
  autonomous: "self-driving car autonomous robot",
  bereaved: "funeral flowers mourning wreath black",
  complacent: "satisfied person leaning back smug",
  correlate: "interlocking gears connection meshing",
  detrimental: "withered dying plant harm poison",
  disseminate: "dandelion seeds spreading wind",
  diverge: "fork in the road diverging paths",
  elucidate: "light bulb idea clarity explanation",
  endorse: "signing document approval pen stamp",
  equivocal: "signpost two directions ambiguity",
  erratic: "zigzag erratic lightning path",
  exacerbate: "pouring gasoline fire worsening flames",
  acquiesce: "nodding silent agreement person",
  amenable: "open door welcoming warm light",
  benign: "gentle dove peace garden sunshine",
  brevity: "stopwatch brief seconds time minimal",
  brusque: "slamming door rude impatient gesture",
  conducive: "seedling sprouting fertile soil growth",
  deference: "medal ribbon honor respect bow",
  erstwhile: "faded vintage photograph old sepia",
  fractious: "hissing cat angry grumpy",
  hackneyed: "cheesy sunset postcard cliché",
  ingratiate: "gift box offering chocolate flattering",
  insidious: "snake hidden in grass danger",
  intractable: "tangled knot rope difficult problem",
  ire: "fire flames anger red hot",
  morose: "rainy window gloomy grey alone",
  obsequious: "fawning puppy begging obedient eager",
  oligarchy: "boardroom suits powerful meeting table",
  pellucid: "crystal clear water transparency pool",
  // —— C2 隐喻 ——
  abstruse: "blackboard equations complex abstract chalk",
  acrimonious: "bitter lemon sour thorns rose",
  ascertain: "magnifying glass investigating verify evidence",
  cogent: "debate podium argument logic strong",
  commensurate: "balanced scales equality justice brass",
  corroborate: "two documents matching verification stamp",
  deleterious: "toxic waste pollution hazard barrels",
  delineate: "drawing boundary chalk lines map survey",
  ephemeral: "cherry blossom falling petals",
  erudite: "old books library scholar reading stack",
  explicate: "annotated text highlight explanation diagram",
  flagrant: "red flag warning violation obvious",
  fortuitous: "four leaf clover lucky chance find",
  germane: "puzzle piece fitting relevant connection",
  immutable: "stone tablet carving ancient law",
  incumbent: "official desk nameplate office sitting",
  ineffable: "starry night awe wonder speechless sky",
  obfuscate: "foggy window obscured blur confusion",
  perfidious: "hidden dagger betrayal treachery knife",
  perspicacious: "owl keen eyes sharp vision wisdom",
  salient: "mountain peak prominent highlight arrow",
  ubiquitous: "crowd smartphones everywhere city people",
  visceral: "beating heart raw emotion powerful",
  vitriolic: "sulfuric acid bottle burning corrosive",
  adumbrate: "pencil sketch outline shadow foreshadow",
  chimerical: "mirage desert illusion fantasy castle",
  circumlocution: "tangled speech bubbles spiral long talk",
  diaphanous: "sheer gauze curtain transparent light fabric",
  ebullient: "bubbling champagne celebration joy sparkling",
  garrulous: "parrot talking chatter colorful bird",
  hubris: "peacock pride displaying feathers proud",
  iconoclast: "breaking statue hammer smashing idol",
};

// —— Commons 分类直取：分类里全是该实物，比关键词搜准一个量级 ——
const CATS = {
  fryingpan: ["Frying pans"],
  saucepan: ["Saucepans"],
  sweatshirt: ["Sweatshirts", "Sweatshirt"],
  guitarist: ["Guitarists"],
  sunbathe: ["Sunbathing"],
  lemonade: ["Lemonade"],
  fastfood: ["Fast food"],
  sittingroom: ["Living rooms", "Sitting rooms"],
  businesswoman: ["Businesswomen"],
  grandpa: ["Grandfathers"],
  mum: ["Mothers", "Mother"],
  filmmaker: ["Film directors", "Filmmakers"],
  travelagent: ["Travel agencies"],
  touristinformationcentre: ["Tourist information"],
  publisher: ["Book publishing"],
  programmer: ["Programmers", "Computer programmers"],
  keeper: ["Goalkeepers", "Association football goalkeepers"],
  rider: ["Horse riders", "Equestrians"],
  prizes: ["Trophies", "Trophy cups"],
  remotecontrol: ["Remote controls"],
  cashmachine: ["Automated teller machines"],
  textmessage: ["Text messaging"],
  chatroom: ["Online chat", "Chat rooms"],
  centralheating: ["Radiators"],
  dialup: ["Dial-up modems", "Modems"],
  weatherforecast: ["Weather forecasting", "Weather maps"],
  extremesport: ["Extreme sports"],
  search: ["Magnifying glasses"],
  instructions: [],
  studies: ["Studying"],
  skating: ["Skateboarding", "Ice skating"],
  stripe: ["Stripes", "Striped patterns", "Striped textiles"],
  sleeveless: ["Sleeveless shirts"],
  fry: ["Fried food", "Frying"],
  gale: ["Gales"],
  part: ["Puzzle pieces"],
  turnoff: ["Light switches"],
  turnon: ["Light switches"],
  interviewer: ["Job interviews", "Employment interviews"],
  headteacher: ["Head teachers", "School principals"],
  superhero: ["Superhero costumes", "Cosplay"],
  penfriend: ["Pen pals"],
  underwater: ["Underwater photography"],
  damaged: ["Damage"],
  commensurate: ["Balance scales", "Scales of justice"],
  erudite: ["Libraries", "Old books"],
  episodicskip: [],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// —— 按词否决：标题命中即重罚（词面碰瓷专用）——
const HINT_DENY = {
  "stomach-ache": /back/i,               // 背痛图≠胃痛
  sad: /novi|city|town|municipal/i,      // Novi Sad 城市照
  ascertain: /trump|tweet|politician/i,
  keeper: /\(actress\)|\(actor\)|\(singer\)|\(born/i,
  go: /\bgolang|gopher|baduk|weiqi/i,   // Go 语言/围棋
  part: /\bpart of speech|parts? of\b/i,
  daily: /routine life/i,                // 含糊 Flickr 标题
  details: /spray bottle|product/i,
  "give-back": /library|cottage|store/i,
  skating: /figure of|portrait|victorian/i,
  mum: /monkey|macaque|ape|chimpanzee/i, // 猴妈妈≠妈妈
  "travel-agent": /statistics|real estate|estate|news agency|employment/i, // 统计局/房产/新闻社 ≠ 旅行社
  stripe: /white stripes|album|band|record|music/i, // 乐队名 pun
  "carry-on": /marathon|running|wheelchair|race/i,
  "carry-out": /clipboard|inspection|checklist|register/i,
  penfriend: /meitei|bengali|writing systems|specimen/i,
};
// 归一化 key：连字符/下划线/空格折掉，尾部序号（face-to-face-2）也折掉
const nk = (s) => s.toLowerCase().replace(/[-_ ]/g, "").replace(/\d+$/, "");
const SKIP_N = new Set([...SKIP].map(nk));
const HINTS_N = {};
for (const [k, v] of Object.entries(HINTS)) if (v) HINTS_N[nk(k)] = v;
const hintFor = (id) => HINTS_N[nk(id)] || null;
const catsFor = (id) => CATS[nk(id)] || [];
const DENY_N = {};
for (const [k, v] of Object.entries(HINT_DENY)) DENY_N[nk(k)] = v;
const denyFor = (id) => DENY_N[nk(id)] || null;

const curlOnce = (args) => execFileSync("curl", args, { maxBuffer: 40 * 1024 * 1024 });
const curlJson = (url) => {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const out = curlOnce(["-sL", "--connect-timeout", "5", "--max-time", "15", "-A", UA, url]);
      const txt = out.toString("utf8");
      if (!txt.trim()) throw new Error("empty body");
      return JSON.parse(txt);
    } catch (e) {
      last = e;
      execFileSync("sleep", [String(Math.min(0.8 * Math.pow(2, i), 6))]);
    }
  }
  throw last;
};

const stripTags = (s) => (s || "").replace(/<[^>]*>/g, "").trim();

function titleTokens(title) {
  return new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function scoreCandidate(p, word, hint, extra = {}) {
  const ii = p.imageinfo?.[0];
  if (!ii) return { s: -99 };
  const mime = ii.mime || "";
  if (!/jpe?g|png/.test(mime)) return { s: -99 };
  const w = ii.thumbwidth || ii.width || 0;
  const h = ii.thumbheight || ii.height || 0;
  if ((ii.width || 0) < 400 || (ii.height || 0) < 300) return { s: -99 };

  const title = (p.title || "").replace(/^File:/i, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ").toLowerCase();
  const titleFlat = title.replace(/[^a-z0-9]+/g, "").replace(/\d+$/, ""); // saucepan2 → saucepan
  const wl = word.toLowerCase().replace(/-/g, " ");
  const tt = titleTokens(title);
  let s = 0;
  let titleHit = false;
  const flatT = title.replace(/[^a-z0-9]+/g, "");
  const flatW = wl.replace(/[^a-z0-9]+/g, "");
  if (titleFlat === flatW) { s += 8; titleHit = true; } // 标题正好是这个词
  else if (title === wl) { s += 6; titleHit = true; }
  else if (title.includes(wl) || (flatW.length > 3 && flatT.includes(flatW))) { s += 4; titleHit = true; }
  const toks = wl.split(/\s+/).filter(Boolean);
  if (!titleHit && toks.length > 1) {
    const titleToks = title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (let i = 0; i + toks.length <= titleToks.length; i++) {
      if (toks.every((t, j) => titleToks[i + j] === t)) { s += 3; titleHit = true; break; }
    }
  }

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

  // —— 垃圾罚分（沿用 v10）——
  if (/magazine|journal|\bbook\b|annual|catalog|catalogue|cover|\bvol\.|volume \d|illustration|drawing|engraving|woodcut|lithograph|title.?card|coat.?of.?arms|logo|screenshot|font|typeface|diagram|chart|graph\b|icon\b|\bmap\b/i.test(title)) s -= 5;
  if (/muybridge|motion stud|figure study|costume|\brbm-|dpla|nude|study of a (man|woman)|maintenance manual|repair manual|driver'?s handbook|spectrophotometer/i.test(title)) s -= 12; // 图版/档案扫描/裸体艺术照
  if (/\b1[89]\d\d\b/.test(title)) s -= 8;
  if (/\bmail\b|\becho\b|herald|tribune|gazette|\btimes\b|\bmirror\b|\bpost\b|telegraph|guardian|independent|journalism|timetable|schedule|hubble|galaxy|nebula|telescope|cosmos/i.test(title)) s -= 8;
  if (/deep.?learning|machine.?learning|neural|\bmike\b|president|senator|politician|congress|minister/i.test(title)) s -= 8;
  if (/\bnara\b|library of congress|\barchive\b|demobiliz|\btroops\b|regiment|battalion|wartime|poster/i.test(title)) s -= 12;
  if (/military|soldier|marine|usmc|M-DX|\barmy\b|\bnavy\b(?! blue)|helmet|camouflage|homecoming|battlefield|war\b|19[34]\d|berlin/i.test(title)) s -= 10; // 战争/历史档案照
  if (/\bpackag|carton|paper box|\bbrand\b|\bproduct\b/i.test(title)) s -= 8;
  if (/\bmuseum\b|\bexhibit|\bbay\b|\bisland\b|\bpark\b|viewed from|plate money/i.test(title)) s -= 12;
  if (/commons-|wiki|edit|symbol/i.test(title)) s -= 3;
  if (extra.deny && extra.deny.test(title)) s -= 15; // 按词否决（词面碰瓷）
  // 人名陷阱：标题是「人名 (guitarist)」这类传记照不算词义图
  if (/\([a-z ]*(guitarist|keeper|writer|singer|actor|actress|player|director|politician|born|died)\)/i.test(title)) s -= 10;
  if (/\b(19|20)\d\d\b.*\b(born|died|portrait|biography)\b/i.test(title)) s -= 8;

  return { s, titleHit, hintOverlap, vouched: !!extra.vouched };
}

// —— 分类成员直取 ——
function catFileTitles(catName) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers" +
    `&cmtitle=${encodeURIComponent("Category:" + catName)}&cmtype=file&cmlimit=50`;
  try {
    const data = curlJson(url);
    return (data.query?.categorymembers || []).map((m) => m.title);
  } catch {
    return [];
  }
}

// —— 批量取 imageinfo（每 40 个标题一查）——
function batchImageInfo(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 20) {
    const part = titles.slice(i, i + 20);
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
      `&titles=${encodeURIComponent(part.join("|"))}` +
      "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=768";
    try {
      const data = curlJson(url);
      for (const pg of Object.values(data.query?.pages || {})) {
        if (pg.imageinfo) out.push(pg);
      }
    } catch (e) {
      console.log(`  [warn] batchImageInfo chunk failed: ${String(e).slice(0, 60)}`);
    }
    if (i + 20 < titles.length) execFileSync("sleep", ["0.35"]);
  }
  return out;
}

// —— api.wikimedia.org 语料页头图（Commons gallery 页的 lead image）——
function galleryCandidates(word) {
  const q = word.replace(/-/g, " ");
  const url = `https://api.wikimedia.org/core/v1/commons/search/page?q=${encodeURIComponent(q)}&limit=6`;
  let data;
  try {
    data = curlJson(url);
  } catch {
    return [];
  }
  const out = [];
  for (const pg of data.pages || []) {
    const key = pg.key || "";
    if (/^(File|Category|Template|Module):/i.test(key)) continue;
    const th = pg.thumbnail;
    if (!th || !/image\/(jpe?g|png)/.test(th.mimetype || "")) continue;
    // 60px 缩略 → 768px
    const src = th.url.replace(/\/\d+px-/, "/768px-");
    out.push({
      title: key,
      thumburl: src,
      url: src,
      width: 0,
      height: 0,
      mime: th.mimetype,
      extmetadata: {},
      _gallery: true,
    });
  }
  return out;
}

function rankAccept(all, word, hint) {
  const multiword = word.includes("-") || word.includes(" ");
  const ranked = all.filter((x) => x.s > -50).sort((a, b) => b.s - a.s);
  const best = ranked.find((x) => {
    if (x.s < 1) return false;
    // 分类/语料页背书：仍须标题命中或提示词命中——防「Category:Lemonade 里的开胃菜拼盘」
    if (x.vouched) return x.titleHit || x.hintOverlap >= 1;
    const hintIsLexical = hint && word.split(/[-\s]+/).every((t) => hint.toLowerCase().split(/\s+/).includes(t));
    if (x.hinted && !hintIsLexical) return multiword ? x.hintOverlap >= 2 : x.hintOverlap >= 1;
    return x.titleHit;
  });
  return best || null;
}

async function fetchOne(word) {
  const hint = hintFor(word);
  const deny = denyFor(word);
  const plain = word.replace(/-/g, " ");
  const all = [];

  // —— 源 1：分类直取 ——
  const cats = catsFor(word);
  for (const cat of cats) {
    const titles = catFileTitles(cat);
    if (!titles.length) continue;
    execFileSync("sleep", ["0.25"]);
    const pages = batchImageInfo(titles);
    // 分类名与词互含 → 背书
    const catN = nk(cat);
    const wordN = nk(word);
    const vouched = catN.includes(wordN) || wordN.includes(catN) || catN.includes(wordN + "s") || catN.includes(wordN.replace(/s$/, ""));
    for (const pg of pages) {
      const sc = scoreCandidate(pg, word, hint, { vouched, deny });
      all.push({ p: pg, ...sc, hinted: !!hint, src: "cat:" + cat });
    }
    const good = all.some((x) => x.vouched && x.s >= 1 && (x.titleHit || x.hintOverlap >= 1));
    if (good) break;
  }

  // —— 源 2：语料页头图（key 与词完全一致才背书）——
  if (!all.some((x) => x.s >= 3)) {
    const gcs = galleryCandidates(word);
    for (const pg of gcs) {
      const keyN = nk(pg.title);
      const wordN = nk(word);
      const vouched = keyN === wordN;
      const fake = { title: `File:${pg.title}.jpg`, imageinfo: [pg] };
      const sc = scoreCandidate(fake, word, hint, { vouched, deny });
      all.push({ p: fake, s: sc.s + (vouched ? 4 : 0), titleHit: sc.titleHit, hintOverlap: sc.hintOverlap, hinted: !!hint, vouched, src: "gal" });
    }
    execFileSync("sleep", ["0.25"]);
  }

  // —— 源 3：关键词搜索（hint 查询 + 裸词查询）——
  // Commons 检索是 AND 语义：3 词常常 0 结果，拆成 3 词→2 词两档
  const hintWords = hint ? hint.split(/\s+/).filter((t) => t.length > 2) : [];
  const wordToks = new Set(plain.split(/\s+/));
  const hintToks = hintWords.filter((t) => !wordToks.has(t));
  const apiFor = (q) =>
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}` +
    "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=768";
  const queries = [];
  if (hintToks.length >= 3) queries.push({ q: hintToks.slice(0, 3).join(" "), hint });
  if (hintToks.length >= 2) queries.push({ q: hintToks.slice(0, 2).join(" "), hint });
  queries.push({ q: plain, hint: hintToks.length ? hint : null });
  for (const { q, hint: h } of queries) {
    let data;
    try {
      data = curlJson(apiFor(q));
    } catch {
      continue;
    }
    const pages = Object.values(data.query?.pages || {});
    for (const pg of pages) all.push({ p: pg, ...scoreCandidate(pg, word, h, { deny }), hinted: !!h && hintToks.length > 0, src: "search" });
    const good = all.some((x) => x.s >= (x.hinted ? 3 : 1) && (x.titleHit || x.hintOverlap >= 2 || !x.hinted));
    if (good) break;
    execFileSync("sleep", ["0.2"]);
  }

  if (!all.length) return { word, ok: false, reason: "no-result" };

  const best = rankAccept(all, word, hint);
  if (!best) return { word, ok: false, reason: "no-good-candidate" };

  const ii = best.p.imageinfo[0];
  const src = ii.thumburl || ii.url;
  const safe = word.replace(/[^a-zA-Z0-9]+/g, "_");
  const tmp = `/tmp/commons-dl2/${safe}.jpg`;
  const crop = `/tmp/commons-dl2/${safe}-crop.jpg`;
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
    const sourceName = best.src.startsWith("cat:") ? "Wikimedia Commons (category " + best.src.slice(4) + ")"
      : best.src === "gal" ? "Wikimedia Commons (gallery page)" : "Wikimedia Commons";
    return {
      word,
      ok: true,
      title: best.p.title,
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.p.title.replace(/^File:/i, "File:").replace(/ /g, "_"))}`,
      license: stripTags(em.LicenseShortName?.value) || "see Commons",
      artist: stripTags(em.Artist?.value) || "unknown",
      source: sourceName,
      score: best.s,
    };
  } catch (e) {
    return { word, ok: false, reason: "dl-fail " + String(e).slice(0, 220) };
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
  const shard = shardIdx >= 0 ? args[shardIdx + 1].split("/").map(Number) : null;

  fs.mkdirSync("/tmp/commons-dl2", { recursive: true });
  const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
  const have = new Set(fs.readdirSync(`${ROOT}/img`).filter((f) => f.endsWith(".webp")));

  let todo = idx.words
    .map((r) => r[0])
    .filter((id) => !have.has(id + ".webp") && !SKIP_N.has(nk(id)) && (!only || only.has(id)));
  if (shard) todo = todo.filter((_, i) => i % shard[1] === shard[0] - 1);
  todo = todo.slice(0, limit);

  console.log(`todo: ${todo.length} words (shard=${shard ? shard.join("/") : "all"})`);

  const results = [];
  const got = [];
  for (let n = 0; n < todo.length; n++) {
    const word = todo[n];
    const r = await fetchOne(word);
    results.push(r);
    if (r.ok) {
      got.push(word);
      const rec = { [word]: { title: r.title, page: r.page, license: r.license, artist: r.artist, source: r.source || "Wikimedia Commons" } };
      fs.appendFileSync("/tmp/commons-credits2.jsonl", JSON.stringify(rec) + "\n");
      console.log(`[OK ${n + 1}/${todo.length}] ${word} <- ${r.title} (${r.license})`);
    } else {
      console.log(`[-- ${n + 1}/${todo.length}] ${word}: ${r.reason}`);
    }
    await sleep(100);
  }

  const okN = results.filter((r) => r.ok).length;
  let illNote = "";
  if (got.length) illNote = `, illustrated=${lightBits(got).illustrated}`;
  console.log(`\n=== done: ${okN}/${todo.length} imaged${illNote} ===`);
  const fails = results.filter((r) => !r.ok);
  console.log(`failed ${fails.length}:`, fails.map((f) => `${f.word}(${f.reason})`).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
