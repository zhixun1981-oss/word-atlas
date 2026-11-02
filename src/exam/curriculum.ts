/**
 * 「教室」课表：KET / PET 两套课，按真实备考顺序排。
 *
 * 设计原则：
 * 1. 课表只负责「学什么、什么顺序、看多久」，不转载任何外部视频；
 *    每节课给一个 B 站检索关键词，视频在 B 站自己看，站内只做配套练习。
 * 2. 每节课都挂到站内已有的专项练习上（drills），学完立刻能练，练完自动打勾。
 * 3. 语法课用 points 关联 `exam/syllabus.ts` 的考点 id，可直接读掌握度。
 */

/** 站内已有的练习入口。 */
export type DrillKind =
  | "grammar"
  | "opencloze"
  | "sign"
  | "reading"
  | "gapfill"
  | "listen"
  | "speak"
  | "write"
  | "mock"
  | "learn";

export interface Lesson {
  id: string;
  /** 中文课题。 */
  title: string;
  /** 英文课题，用作副标题。 */
  en: string;
  /** 一句话说明这节课讲什么。 */
  brief: string;
  /** 预计分钟数（看视频 + 练习）。 */
  min: number;
  /** 课后练习。 */
  drills: DrillKind[];
  /** 关联的语法考点 id（`exam/syllabus.ts`）。 */
  points?: string[];
  /** 在 B 站的检索关键词。 */
  search: string;
}

export interface Unit {
  id: string;
  title: string;
  note: string;
  lessons: Lesson[];
}

export const DRILL_LABEL: Record<DrillKind, string> = {
  grammar: "语法诊所",
  opencloze: "开放填空",
  sign: "标识识别",
  reading: "信息配对",
  gapfill: "听力填空",
  listen: "听力选择",
  speak: "口语模考",
  write: "写作批改",
  mock: "全真模拟卷",
  learn: "闪卡学词",
};

// ---------------------------------------------------------------- KET · A2

const KET_UNITS: Unit[] = [
  {
    id: "k-grammar-1",
    title: "语法地基 · 时态",
    note: "KET 阅读写作 Part 2 / 5 反复考的四组时态。先把「什么时候用哪个」分清楚。",
    lessons: [
      {
        id: "k-present-simple",
        title: "一般现在时",
        en: "Present simple",
        brief: "习惯、事实、时刻表。三单加 -s 是必考点，也是最多人丢分的地方。",
        min: 25,
        drills: ["grammar"],
        points: ["present-simple"],
        search: "KET 一般现在时 语法讲解",
      },
      {
        id: "k-present-continuous",
        title: "现在进行时",
        en: "Present continuous",
        brief: "此刻正在发生 + 近期安排。和一般现在时的区别是 KET 选择题的高频陷阱。",
        min: 25,
        drills: ["grammar"],
        points: ["present-continuous"],
        search: "KET 现在进行时 和一般现在时 区别",
      },
      {
        id: "k-past-simple",
        title: "一般过去时",
        en: "Past simple",
        brief: "不规则动词表是地基。故事类阅读和图片写话全靠它。",
        min: 30,
        drills: ["grammar"],
        points: ["past-simple"],
        search: "KET 一般过去时 不规则动词",
      },
      {
        id: "k-future-forms",
        title: "将来的三种说法",
        en: "will / be going to / 现在进行时",
        brief: "临时决定用 will，计划好的用 be going to，约好用进行时。三种别混。",
        min: 25,
        drills: ["grammar"],
        points: ["future-forms"],
        search: "KET will be going to 区别",
      },
      {
        id: "k-past-continuous",
        title: "过去进行时",
        en: "Past continuous",
        brief: "「当时正在做」。故事题里常和一般过去时配对：长动作进行时，短动作一般过去时。",
        min: 25,
        drills: ["grammar"],
        points: ["past-continuous"],
        search: "KET 过去进行时 was doing while when",
      },
    ],
  },
  {
    id: "k-grammar-2",
    title: "语法地基 · 句子零件",
    note: "冠词、介词、代词这些小词，是 KET 开放填空（Part 6）几乎每空都在考的。",
    lessons: [
      {
        id: "k-articles",
        title: "冠词 a / an / the",
        en: "Articles",
        brief: "第一次提到用 a，双方都知道用 the，泛指复数不加。开放填空必考。",
        min: 20,
        drills: ["grammar", "opencloze"],
        points: ["articles"],
        search: "KET 冠词 a an the 用法",
      },
      {
        id: "k-prepositions",
        title: "介词 in / on / at",
        en: "Prepositions",
        brief: "时间和地点两套规则，加上固定搭配。背搭配比背规则有用。",
        min: 25,
        drills: ["grammar", "opencloze"],
        points: ["prepositions"],
        search: "KET 介词 in on at 时间地点",
      },
      {
        id: "k-pronouns-there",
        title: "代词与 there be",
        en: "Pronouns & there is/are",
        brief: "人称/物主/反身代词一张表，加 there be 的单复数一致。",
        min: 20,
        drills: ["grammar"],
        points: ["pronouns", "there-is"],
        search: "KET 代词 there be 句型",
      },
      {
        id: "k-quantifiers",
        title: "数量词 some / any / much / many",
        en: "Quantifiers",
        brief: "可数不可数决定用哪个。how much / how many 的问句也在这里。",
        min: 20,
        drills: ["grammar"],
        points: ["quantifiers"],
        search: "KET some any much many 区别",
      },
      {
        id: "k-questions",
        title: "疑问句怎么造",
        en: "Questions",
        brief: "一般疑问、特殊疑问、否定疑问。口语 Part 1 全靠它接话。",
        min: 20,
        drills: ["grammar", "speak"],
        points: ["questions"],
        search: "KET 英语疑问句 特殊疑问词",
      },
      {
        id: "k-conjunctions",
        title: "连词与祈使句",
        en: "Conjunctions & imperatives",
        brief: "and / but / so / because 决定句子能不能连起来写够 25 词。",
        min: 20,
        drills: ["grammar", "write"],
        points: ["conjunctions", "imperatives"],
        search: "KET 连词 and but because 写作",
      },
      {
        id: "k-modals",
        title: "情态动词 can / must / should",
        en: "Modal verbs",
        brief: "后面永远跟动词原形。考法几乎都是「语气」：允许、必须、建议。",
        min: 25,
        drills: ["grammar"],
        points: ["modal-verbs"],
        search: "KET 情态动词 can must should 用法",
      },
      {
        id: "k-comparative",
        title: "比较级与最高级",
        en: "Comparatives",
        brief: "短词加 -er，长词加 more，不规则那几个（good/bad/far）必须背。",
        min: 25,
        drills: ["grammar"],
        points: ["comparative"],
        search: "KET 比较级 最高级 不规则",
      },
      {
        id: "k-frequency",
        title: "频度副词",
        en: "Adverbs of frequency",
        brief: "always / usually / often / never 放在哪，是选择题的固定陷阱。",
        min: 20,
        drills: ["grammar"],
        points: ["adverbs-frequency"],
        search: "KET 频度副词 位置 always usually",
      },
      {
        id: "k-verb-patterns",
        title: "动词后接 to do 还是 doing",
        en: "Verb patterns",
        brief: "want to go 但 enjoy going。这组搭配不背，开放填空永远差一分。",
        min: 25,
        drills: ["grammar"],
        points: ["to-do-or-ing"],
        search: "KET 动词后面接 to do 还是 doing",
      },
    ],
  },
  {
    id: "k-vocab",
    title: "话题词汇 · 高频六类",
    note: "KET 的阅读和听力按话题出题：家里的事、学校的事、出门旅行的事。先把这几类词过一遍，做题时就不卡在「这词我见过但想不起来」上。",
    lessons: [
      {
        id: "k-vocab-daily",
        title: "家 · 朋友 · 日常",
        en: "Home, friends & daily life",
        brief: "描述房间、家务、朋友性格、日常作息——写作 Part 6 和口语 Part 1 全靠这批词。",
        min: 25,
        drills: ["learn", "gapfill"],
        search: "KET 家庭 朋友 日常 词汇",
      },
      {
        id: "k-vocab-school",
        title: "学校 · 学习 · 工作",
        en: "School & work",
        brief: "科目、考试、职业、上班。听力 Part 2 的独白十有八九在这几个话题里。",
        min: 25,
        drills: ["learn", "listen"],
        search: "KET 学校 科目 职业 词汇",
      },
      {
        id: "k-vocab-travel",
        title: "旅行 · 交通 · 城市",
        en: "Travel & transport",
        brief: "车票、站台、酒店、问路。KET 听力 Part 1 的图片题几乎年年考这套。",
        min: 25,
        drills: ["learn", "sign"],
        search: "KET 旅行 交通 词汇",
      },
      {
        id: "k-vocab-health",
        title: "健康 · 运动 · 情绪",
        en: "Health, sport & feelings",
        brief: "看病、运动、心情。形容词比名词更重要——fine / tired / worried 决定你能不能答出感受。",
        min: 25,
        drills: ["learn", "speak"],
        search: "KET 健康 运动 情绪 词汇",
      },
    ],
  },
  {
    id: "k-reading",
    title: "阅读 Reading",
    note: "KET 阅读写作共 7 个 Part、60 分钟。先按题型一个个打，再练速度。",
    lessons: [
      {
        id: "k-read-sign",
        title: "Part 1 · 标识识别",
        en: "Signs & notices",
        brief: "看告示牌选同义句。关键词是同义词替换，不是逐字翻译。",
        min: 20,
        drills: ["sign"],
        search: "KET 阅读 Part 1 标识 同义替换",
      },
      {
        id: "k-read-match",
        title: "Part 2 · 信息配对",
        en: "Matching",
        brief: "三个人三条需求，去匹配广告。先划需求里的限定词，再排除。",
        min: 25,
        drills: ["reading"],
        search: "KET 阅读 Part 2 信息匹配 技巧",
      },
      {
        id: "k-read-long",
        title: "Part 3 · 长文选择",
        en: "Long text",
        brief: "一篇 250 词短文配 5 道题。考的不是词汇量，是「这一题在原文哪一句」。",
        min: 30,
        drills: ["reading", "mock"],
        search: "KET 阅读 Part 3 长文 选择题 技巧",
      },
      {
        id: "k-read-cloze",
        title: "Part 4 · 完形选择",
        en: "Multiple-choice cloze",
        brief: "给选项的完形。四个词常是同一个意思的四种搭配，考的是搭配不是翻译。",
        min: 25,
        drills: ["opencloze", "mock"],
        search: "KET 阅读 Part 4 完形填空 搭配",
      },
      {
        id: "k-read-opencloze",
        title: "Part 5 · 开放填空",
        en: "Open cloze",
        brief: "不给选项，自己填一个词。考的几乎全是语法小词——冠词、介词、代词。",
        min: 25,
        drills: ["opencloze"],
        search: "KET 开放填空 Part 5 技巧",
      },
      {
        id: "k-read-speed",
        title: "阅读提速与定位",
        en: "Skimming & scanning",
        brief: "60 分钟做完 7 个 Part，拼的不是读懂，是知道去哪找答案。",
        min: 25,
        drills: ["opencloze", "reading"],
        search: "KET 阅读 时间分配 提速",
      },
    ],
  },
  {
    id: "k-listening",
    title: "听力 Listening",
    note: "约 30 分钟，5 个 Part。KET 听力语速慢，丢分大多是因为没提前看题。",
    lessons: [
      {
        id: "k-listen-1",
        title: "Part 1 · 图片选择",
        en: "Picture choice",
        brief: "先看清三张图的差别在哪，再听。差别往往就是一个介词或数字。",
        min: 20,
        drills: ["gapfill"],
        search: "KET 听力 Part 1 图片选择",
      },
      {
        id: "k-listen-2",
        title: "Part 2 · 独白填空",
        en: "Gap fill",
        brief: "听独白填单词，拼写必须对。数字、时间、价格是常考点。",
        min: 25,
        drills: ["gapfill", "listen"],
        search: "KET 听力 Part 2 填空 拼写 数字",
      },
      {
        id: "k-listen-long",
        title: "Part 3 · 长对话选择",
        en: "Long conversation",
        brief: "一段长对话 5 道题，答案会按顺序出现。听到一题就放下，别回头纠结。",
        min: 25,
        drills: ["listen", "mock"],
        search: "KET 听力 Part 3 长对话 选择题",
      },
      {
        id: "k-listen-short",
        title: "Part 4 · 短对话",
        en: "Short conversations",
        brief: "五段短对话各一问，节奏最快。转折词后面的才是答案。",
        min: 20,
        drills: ["listen"],
        search: "KET 听力 Part 4 短对话 转折",
      },
      {
        id: "k-listen-match",
        title: "Part 5 · 匹配",
        en: "Matching",
        brief: "把人和他们的需求、物品对上。先读完全部选项，再听。",
        min: 20,
        drills: ["listen", "reading"],
        search: "KET 听力 Part 5 匹配 技巧",
      },
      {
        id: "k-listen-3",
        title: "精听训练法",
        en: "Intensive listening",
        brief: "一句一句听写，比泛听十遍有用。这里教你一套每天 15 分钟的做法。",
        min: 20,
        drills: ["gapfill"],
        search: "英语精听 训练方法 听写",
      },
    ],
  },
  {
    id: "k-writing",
    title: "写作 Writing",
    note: "KET 写作只有两个 Part，共 25 分钟。字数少、要求死，模板练熟就能拿分。",
    lessons: [
      {
        id: "k-write-message",
        title: "Part 6 · 短消息 / 邮件",
        en: "Short message",
        brief: "25 词以上，三个提示点必须全写到。少写一个点就丢分。",
        min: 25,
        drills: ["write"],
        search: "KET 写作 邮件 25词 范文",
      },
      {
        id: "k-write-story",
        title: "Part 7 · 图片故事",
        en: "Picture story",
        brief: "看三张图写 35 词故事。用过去时串起来，别写成三句互不相干的话。",
        min: 25,
        drills: ["write"],
        search: "KET 看图写故事 35词 范文",
      },
      {
        id: "k-write-linkers",
        title: "连接词与写作模板",
        en: "Linkers & templates",
        brief: "把 and / but / because / then 用顺，25 词立刻写得像样。",
        min: 20,
        drills: ["write"],
        search: "英语写作 连接词 基础",
      },
    ],
  },
  {
    id: "k-speaking",
    title: "口语 Speaking",
    note: "8-10 分钟，两个考生一起考。丢分常常不是不会说，是不知道流程。",
    lessons: [
      {
        id: "k-speak-1",
        title: "Part 1 · 考官问答",
        en: "Interview",
        brief: "个人信息类问题，答案要「一句半」——别只答一个词。",
        min: 20,
        drills: ["speak"],
        search: "KET 口语 Part 1 常见问题",
      },
      {
        id: "k-speak-2",
        title: "Part 2 · 看图讨论",
        en: "Picture discussion",
        brief: "和搭档一起说一张图。要学会主动开口，别等对方。",
        min: 25,
        drills: ["speak"],
        search: "KET 口语 Part 2 看图讨论",
      },
      {
        id: "k-speak-3",
        title: "发音与流利度",
        en: "Pronunciation",
        brief: "考官打的是「能不能听懂」，不是口音像不像英国人。",
        min: 20,
        drills: ["speak", "gapfill"],
        search: "英语口语 发音 流利度 连读",
      },
    ],
  },
  {
    id: "k-sprint",
    title: "考前冲刺",
    note: "考前一周只做两件事：回炉错题、按真实时间做整卷。",
    lessons: [
      {
        id: "k-sprint-errors",
        title: "错题回炉",
        en: "Error review",
        brief: "把错过的语法点按考点重刷一遍，比做新题有用得多。",
        min: 30,
        drills: ["grammar"],
        search: "KET 考前 错题 复习",
      },
      {
        id: "k-sprint-mock",
        title: "全真模拟卷",
        en: "Full mock paper",
        brief: "阅读 + 写作 + 听力一次做完，按真实时间限制，最后看分项成绩。",
        min: 70,
        drills: ["mock"],
        search: "KET 真题 模拟 时间分配",
      },
    ],
  },
];

// ---------------------------------------------------------------- PET · B1

const PET_UNITS: Unit[] = [
  {
    id: "p-grammar-1",
    title: "时态进阶",
    note: "PET 和 KET 最大的分水岭就在时态——完成时、过去完成时、used to 全都上了。",
    lessons: [
      {
        id: "p-present-perfect",
        title: "现在完成时",
        en: "Present perfect",
        brief: "for / since / ever / never / just。和中文的「已经」不完全对应，要按标志词判断。",
        min: 30,
        drills: ["grammar"],
        points: ["present-perfect"],
        search: "PET 现在完成时 for since 讲解",
      },
      {
        id: "p-perfect-vs-past",
        title: "完成时 vs 过去时",
        en: "Perfect vs past",
        brief: "PET Reading Part 5 的常考对比。重点是「有没有具体过去时间点」。",
        min: 25,
        drills: ["grammar", "opencloze"],
        points: ["perfect-vs-past"],
        search: "现在完成时 一般过去时 区别",
      },
      {
        id: "p-past-perfect",
        title: "过去完成时",
        en: "Past perfect",
        brief: "「过去的过去」。看到 by the time / already 要反应过来。",
        min: 25,
        drills: ["grammar"],
        points: ["past-perfect"],
        search: "PET 过去完成时 讲解",
      },
      {
        id: "p-used-to",
        title: "used to / be used to",
        en: "Used to",
        brief: "三个 used 短语是必考陷阱：过去常做、习惯于、被用来。",
        min: 25,
        drills: ["grammar"],
        points: ["used-to"],
        search: "used to be used to 区别",
      },
    ],
  },
  {
    id: "p-grammar-2",
    title: "句型与语态",
    note: "这五节课决定了你能不能写出 PET 要求的长句，也是阅读长难句的破解工具。",
    lessons: [
      {
        id: "p-passive",
        title: "被动语态",
        en: "Passive voice",
        brief: "什么时候用被动、怎么变、by 短语要不要加。写作里能显著提分。",
        min: 30,
        drills: ["grammar", "opencloze"],
        points: ["passive"],
        search: "PET 被动语态 讲解",
      },
      {
        id: "p-conditionals",
        title: "条件句（0/1/2/3）",
        en: "Conditionals",
        brief: "四种条件句的结构和语气差别。第二个条件句是写作加分项。",
        min: 30,
        drills: ["grammar"],
        points: ["conditionals"],
        search: "英语 条件句 if 虚拟语气 讲解",
      },
      {
        id: "p-relative",
        title: "定语从句",
        en: "Relative clauses",
        brief: "who / which / that / where / whose。写作里用它把两句合成一句。",
        min: 30,
        drills: ["grammar"],
        points: ["relative-clauses"],
        search: "PET 定语从句 who which that",
      },
      {
        id: "p-reported",
        title: "间接引语",
        en: "Reported speech",
        brief: "时态后退一步、人称跟着变。听力里常用来转述别人说的话。",
        min: 30,
        drills: ["grammar"],
        points: ["reported-speech"],
        search: "直接引语 间接引语 时态变化",
      },
      {
        id: "p-deduction",
        title: "情态动词表推测",
        en: "Modal deduction",
        brief: "must / might / can't be 表示「一定 / 可能 / 不可能」。",
        min: 25,
        drills: ["grammar"],
        points: ["modal-deduction", "modal-verbs"],
        search: "情态动词 must might can't 推测",
      },
    ],
  },
  {
    id: "p-grammar-3",
    title: "细节拿分点",
    note: "这几块单独看不难，但都是选择题里「差一点点就错」的地方。",
    lessons: [
      {
        id: "p-comparative",
        title: "比较级与最高级",
        en: "Comparatives",
        brief: "the more…the more、as…as、much + 比较级。写作里很好用。",
        min: 25,
        drills: ["grammar"],
        points: ["comparative"],
        search: "PET 比较级 最高级 特殊形式",
      },
      {
        id: "p-to-do-ing",
        title: "动词后接 to do 还是 doing",
        en: "Verb patterns",
        brief: "remember / stop / try 后面接什么，意思完全不同。",
        min: 25,
        drills: ["grammar"],
        points: ["to-do-or-ing"],
        search: "动词后接 to do 还是 doing 区别",
      },
      {
        id: "p-so-such",
        title: "so / such / too / enough",
        en: "Degree",
        brief: "四个词的搭配和位置，Pet 选择题常驻嘉宾。",
        min: 20,
        drills: ["grammar"],
        points: ["so-such-too-enough"],
        search: "so such too enough 区别",
      },
      {
        id: "p-tags",
        title: "反意疑问句",
        en: "Question tags",
        brief: "前肯后否、前否后肯。口语 Part 1 里用一句就能接住话。",
        min: 20,
        drills: ["grammar"],
        points: ["question-tags"],
        search: "反意疑问句 question tags 讲解",
      },
      {
        id: "p-prepositions",
        title: "介词与固定搭配",
        en: "Prepositions & collocations",
        brief: "depend on / interested in / good at。开放填空里最稳的一分，全靠背搭配。",
        min: 25,
        drills: ["grammar", "opencloze"],
        points: ["prepositions"],
        search: "PET 介词搭配 depend on interested in",
      },
    ],
  },
  {
    id: "p-vocab",
    title: "词汇与构词",
    note: "PET 阅读 Part 3 考构词法，写作评分也看词汇丰富度。这两节是性价比最高的。",
    lessons: [
      {
        id: "p-word-formation",
        title: "构词法",
        en: "Word formation",
        brief: "前缀改意思、后缀改词性。Part 3 就是考这个。",
        min: 30,
        drills: ["grammar", "opencloze"],
        points: ["word-formation"],
        search: "PET 构词法 前缀 后缀 word formation",
      },
      {
        id: "p-phrasal",
        title: "短语动词与固定搭配",
        en: "Phrasal verbs & collocations",
        brief: "take off / give up / look after。口语和写作里用对了立刻显水平。",
        min: 30,
        drills: ["grammar"],
        points: ["phrasal-verbs"],
        search: "PET 短语动词 phrasal verbs 高频",
      },
      {
        id: "p-vocab-work",
        title: "工作 · 学习 · 科技",
        en: "Work, study & technology",
        brief: "简历、面试、网课、手机。PET 阅读 Part 3 和写作 Part 1 的主体话题。",
        min: 25,
        drills: ["learn", "opencloze"],
        search: "PET 工作 学习 科技 词汇",
      },
      {
        id: "p-vocab-feelings",
        title: "情感 · 观点 · 抽象名词",
        en: "Feelings & opinions",
        brief: "B1 的分数主要在「能不能说出态度」：disappointed、confident、it depends。",
        min: 25,
        drills: ["learn", "speak"],
        search: "PET 情感 观点 形容词 词汇",
      },
    ],
  },
  {
    id: "p-reading",
    title: "阅读 Reading",
    note: "PET 阅读 6 个 Part、45 分钟。Part 4/5 是长文和开放填空，最吃时间。",
    lessons: [
      {
        id: "p-read-sign",
        title: "Part 1 · 标识识别",
        en: "Signs & notices",
        brief: "PET 的标识更长、更绕，考的是同义改写而不是表面词。",
        min: 20,
        drills: ["sign"],
        search: "PET 阅读 Part 1 标识 同义改写",
      },
      {
        id: "p-read-match",
        title: "Part 2 · 信息配对",
        en: "Matching",
        brief: "五个人五条需求对八个选项，先排除再匹配。",
        min: 25,
        drills: ["reading"],
        search: "PET 阅读 Part 2 匹配题 技巧",
      },
      {
        id: "p-read-long",
        title: "Part 3 · 长文多选",
        en: "Long text",
        brief: "先看题再回文定位。选项里和原文一模一样的，往往是错的。",
        min: 30,
        drills: ["reading", "opencloze"],
        search: "PET 阅读 Part 3 长文 多选 技巧",
      },
      {
        id: "p-read-gapped",
        title: "Part 4 · 句子插入",
        en: "Gapped text",
        brief: "五个空、七个句子，靠指代词和连接词接回去。this / it / however 全是线索。",
        min: 30,
        drills: ["reading", "mock"],
        search: "PET 阅读 Part 4 句子插入 gapped text",
      },
      {
        id: "p-read-cloze",
        title: "Part 5 · 完形选择",
        en: "Multiple-choice cloze",
        brief: "四个选项词性一样、意思接近，只靠搭配和上下文能选对。",
        min: 25,
        drills: ["opencloze", "mock"],
        search: "PET 阅读 Part 5 完形填空 搭配",
      },
      {
        id: "p-read-opencloze",
        title: "Part 6 · 开放填空",
        en: "Open cloze",
        brief: "一段短文 6 个空，全是语法词。考的是语法地基牢不牢。",
        min: 30,
        drills: ["opencloze"],
        search: "PET 开放填空 Part 6 技巧",
      },
    ],
  },
  {
    id: "p-listening",
    title: "听力 Listening",
    note: "约 30 分钟。PET 语速明显快了，Part 3/4 是长对话和长独白，必须提前扫题。",
    lessons: [
      {
        id: "p-listen-1",
        title: "Part 1 · 图片选择",
        en: "Picture choice",
        brief: "三张图差别很小，差别处就是考点。听清否定词。",
        min: 20,
        drills: ["gapfill"],
        search: "PET 听力 Part 1 图片 技巧",
      },
      {
        id: "p-listen-2",
        title: "Part 2 · 填空",
        en: "Gap fill",
        brief: "听独白填空，拼写必须对。一个字母错就整题没分，这是 PET 最冤的失分点。",
        min: 30,
        drills: ["gapfill", "listen"],
        search: "PET 听力 Part 2 填空 拼写",
      },
      {
        id: "p-listen-3",
        title: "Part 3 · 长对话选择",
        en: "Multiple choice",
        brief: "一段长对话六道题。答案按顺序来，但要听懂「同义转述」才选得对。",
        min: 25,
        drills: ["listen", "gapfill"],
        search: "PET 听力 Part 3 长对话 同义转述",
      },
      {
        id: "p-listen-4",
        title: "Part 4 · 访谈选择",
        en: "Interview",
        brief: "六道题一个人接受采访。先扫题干，抓「谁说的什么态度」。",
        min: 25,
        drills: ["listen", "mock"],
        search: "PET 听力 Part 4 访谈 技巧",
      },
    ],
  },
  {
    id: "p-writing",
    title: "写作 Writing",
    note: "PET 写作两个 Part、45 分钟，各 100 词左右。评分看四件事：内容、结构、词汇、语法。",
    lessons: [
      {
        id: "p-write-email",
        title: "Part 1 · 邮件",
        en: "Email",
        brief: "100 词，四个提示点一个不能少。开头结尾都有固定套路。",
        min: 30,
        drills: ["write"],
        search: "PET 写作 邮件 100词 范文",
      },
      {
        id: "p-write-article",
        title: "Part 2 · 文章或故事",
        en: "Article or story",
        brief: "二选一。文章要有观点，故事要有转折。选你更有话说的那个。",
        min: 30,
        drills: ["write"],
        search: "PET 写作 文章 故事 范文",
      },
      {
        id: "p-write-templates",
        title: "写作模板与高分句型",
        en: "Templates & structures",
        brief: "连接词、被动、条件句、定语从句——把这四样用上，分数就上去了。",
        min: 25,
        drills: ["write"],
        search: "PET 写作 高分句型 连接词",
      },
    ],
  },
  {
    id: "p-speaking",
    title: "口语 Speaking",
    note: "10-12 分钟，四个 Part。Part 3/4 是两个人一起说，互动分占很大比重。",
    lessons: [
      {
        id: "p-speak-1",
        title: "Part 1/2 · 问答与看图",
        en: "Interview & picture",
        brief: "Part 1 答一句半，Part 2 描述一分钟不冷场。",
        min: 25,
        drills: ["speak"],
        search: "PET 口语 Part 1 Part 2 描述图片",
      },
      {
        id: "p-speak-3",
        title: "Part 3 · 搭档讨论",
        en: "Collaborative task",
        brief: "给一个情境和五个选项，两个人讨论出结论。要有来有回。",
        min: 30,
        drills: ["speak"],
        search: "PET 口语 Part 3 协作讨论",
      },
      {
        id: "p-speak-4",
        title: "Part 4 · 延伸讨论",
        en: "Discussion",
        brief: "考官追问观点。要能说「我觉得…因为…」，不能只答 yes/no。",
        min: 25,
        drills: ["speak"],
        search: "PET 口语 Part 4 表达观点",
      },
    ],
  },
  {
    id: "p-sprint",
    title: "考前冲刺",
    note: "考前两周：错题回炉 + 至少两套整卷，按真实时间做，找手感。",
    lessons: [
      {
        id: "p-sprint-errors",
        title: "错题回炉",
        en: "Error review",
        brief: "按考点重刷错题，把「差一点点」的地方补成习惯。",
        min: 30,
        drills: ["grammar"],
        search: "PET 考前 错题 复习",
      },
      {
        id: "p-sprint-mock",
        title: "全真模拟卷",
        en: "Full mock paper",
        brief: "阅读 + 写作 + 听力一次做完，看分项成绩，找出最弱的一块。",
        min: 85,
        drills: ["mock"],
        search: "PET 真题 模拟 时间分配",
      },
    ],
  },
];

export const CURRICULUM: Record<"A2" | "B1", Unit[]> = {
  A2: KET_UNITS,
  B1: PET_UNITS,
};

export const EXAM_NAME: Record<"A2" | "B1", string> = { A2: "KET", B1: "PET" };

/** 全部课时（扁平），用于统计总数。 */
export function allLessons(level: "A2" | "B1"): Lesson[] {
  return CURRICULUM[level].flatMap((u) => u.lessons);
}

/** 按 id 找课时。 */
export function lessonById(id: string): Lesson | undefined {
  for (const level of ["A2", "B1"] as const) {
    const hit = allLessons(level).find((l) => l.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** 这一课属于哪个级别（看 id 前缀，避免遍历）。 */
export function levelOf(lesson: Lesson): "A2" | "B1" {
  return lesson.id.startsWith("k-") ? "A2" : "B1";
}
