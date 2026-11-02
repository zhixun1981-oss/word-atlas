/**
 * 站内微课讲义（自建内容，不转载任何外部课程）。
 *
 * 两类课时走不同路子：
 * 1. 语法课时（有 points）——从 `exam/syllabus.ts` 的规则/公式/例句/陷阱
 *    自动装配成讲义，随堂小测直接从 `exam/grammar.ts` 按考点抽题，
 *    所以讲义和题库永远一致，不会出现「课讲 A、题考 B」。
 * 2. 技能课时（阅读/听力/写作/口语/冲刺）——讲义在这里手写。
 *
 * 每节课 4–7 页，一页只讲一件事，最后一定有自测和回顾。
 */

import { allLessons, DRILL_LABEL, type DrillKind, type Lesson } from "./curriculum";
import { drillsByPoint } from "./grammar";
import { pointById } from "./syllabus";

export type DeckSlide =
  | { k: "teach"; head: string; lines: string[]; formula?: string; where?: string }
  | { k: "examples"; head: string; items: { en: string; zh: string }[] }
  | { k: "steps"; head: string; items: { label: string; text: string }[] }
  | { k: "contrast"; head: string; rows: { bad: string; good: string; why: string }[] }
  | { k: "trap"; head: string; text: string }
  | { k: "quiz"; head: string; q: string; options: string[]; answer: string; why: string }
  /**
   * 考题拆解：一道同源样题 + 三步怎么想。
   * 不转载剑桥真题，题干来自站内题库（原创仿题）。
   */
  | {
      k: "breakdown";
      head: string;
      /** 题型标签，如「KET 阅读 Part 5 · 开放填空」。 */
      tag: string;
      stem: string;
      options?: string[];
      answer: string;
      steps: { label: string; text: string }[];
    }
  /** 主题词表：运行时从图鉴按 topic 抽词，和词库始终一致。 */
  | {
      k: "words";
      head: string;
      topic: number;
      cefr?: "A1" | "A2" | "B1" | "B2";
      /** 人工精选的词（按教学价值挑），匹配不到时自动用同主题补足。 */
      picks?: string[];
      note?: string;
    }
  | { k: "recap"; head: string; points: string[]; next: string };

export interface Deck {
  lesson: Lesson;
  slides: DeckSlide[];
}

// ------------------------------------------------------------ 语法课时装配

/** 把考点（最多两个）装配成讲义页。 */
function grammarSlides(points: string[]): DeckSlide[] {
  const pids = points.slice(0, 2);
  const slides: DeckSlide[] = [];

  for (const id of pids) {
    const p = pointById(id);
    if (!p) continue;
    slides.push({
      k: "teach",
      head: p.name,
      lines: [p.rule, p.where.includes("·") ? `考在：${p.where}` : `出现在：${p.where}`],
      formula: p.formula,
    });
    slides.push({
      k: "examples",
      head: `${p.name} · 三句读懂`,
      items: p.examples.map(([en, zh]) => ({ en, zh })),
    });
    slides.push({ k: "trap", head: `${p.name} · 最容易丢分的地方`, text: p.trap });

    // 考题拆解：从该考点的题库里抽一道，按「定位 → 排雷 → 定案」走一遍。
    const sample = drillsByPoint(id).filter((d) => d.options.length > 0)[0];
    if (sample)
      slides.push({
        k: "breakdown",
        head: `${p.name} · 考题拆解`,
        tag: `同源样题 · ${p.where.includes("·") ? p.where : "单选题"}`,
        stem: sample.q,
        options: sample.options,
        answer: sample.answer,
        steps: [
          { label: "定位", text: `先看空前后：${p.formula || p.rule}` },
          { label: "排雷", text: `这个考点最常见的错法——${p.trap}` },
          { label: "定案", text: `选 ${sample.answer}。${sample.why}` },
        ],
      });
  }

  const drills = pids.flatMap((id) => drillsByPoint(id)).filter((d) => d.options.length > 0).slice(0, 2);
  for (const d of drills) {
    slides.push({ k: "quiz", head: "随堂一测", q: d.q, options: d.options, answer: d.answer, why: d.why });
  }

  const names = pids.map((id) => pointById(id)?.name).filter(Boolean) as string[];
  slides.push({
    k: "recap",
    head: "这节课记住三件事",
    points: [
      ...pids.map((id) => pointById(id)?.rule ?? "").filter(Boolean),
      "做到「先判断考什么，再动手填」——KET/PET 的语法题几乎都能靠一句话规则解决。",
    ],
    next: names.length ? `去「语法诊所」把 ${names.join(" / ")} 刷到全对` : "去语法诊所刷本节考点",
  });

  return slides;
}

// ------------------------------------------------------------ KET 技能课讲义

const KET_SKILL: Record<string, DeckSlide[]> = {
  "k-read-sign": [
    {
      k: "teach",
      head: "Part 1 考什么",
      lines: [
        "三块短告示（标志、便条、短信），每块下面三个句子，选出和告示意思相同的那句。",
        "它考的不是翻译，是**同义替换**：告示写 NO FOOD，选项写 You can't eat here.",
        "每块只值一道题，但一共 5 题——读得快的人 3 分钟能拿满。",
      ],
    },
    {
      k: "steps",
      head: "四步读法",
      items: [
        { label: "1", text: "先把告示上「硬信息」圈出来：是禁止、允许，还是提条件（时间/地点/人物）。" },
        { label: "2", text: "再找限定词：ALL / ONLY / NOT / students / under 12 这类词决定了范围，最容易被漏掉。" },
        { label: "3", text: "逐项排除——选项里如果冒出告示上没有的限定词（时间、地点、人），基本就是错的。" },
        { label: "4", text: "最后确认剩下那句是「意思相等」，而不是「词长得像」。" },
      ],
    },
    {
      k: "contrast",
      head: "三组典型错法",
      rows: [
        { bad: "告示 NO PARKING → 选 You can park here for one hour.", good: "选 You must not leave your car here.", why: "禁止类告示不能推出「可以停一会儿」。" },
        { bad: "告示 CLOSED ON MONDAYS → 选 It is open every day.", good: "选 It is not open at the start of the week.", why: "Monday 是 week 的开头，考的就是这层同义。" },
        { bad: "告示 STAFF ONLY → 选 All visitors can use this door.", good: "选 This door is only for people who work here.", why: "ONLY 一出，范围就被限死了。" },
      ],
    },
    {
      k: "trap",
      head: "最容易上当的一类",
      text: "选项里出现和告示**完全一样的词**——很多人靠眼熟就选了。恰恰相反：正确答案常常一个原词都不带，全是改写。看到原词重复最多的那个选项，先怀疑它。",
    },
    {
      k: "quiz",
      head: "试一试",
      q: "告示：NO FOOD OR DRINK IN THE LIBRARY。哪句意思相同？",
      options: ["You can buy food in the library.", "You must not eat or drink here.", "The library sells drinks."],
      answer: "You must not eat or drink here.",
      why: "NO + 名词 = 禁止，等价于 must not；另外两个都把「禁止」读成了「提供」。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: [
        "标识题考同义替换，不考逐字翻译。",
        "限定词（ALL / ONLY / NOT / 时间 / 地点）是判分点。",
        "选项里原词重复最多的，往往是陷阱。",
      ],
      next: "去「标识识别」刷 12 道真标识，练到 10 秒一道",
    },
  ],

  "k-read-match": [
    {
      k: "teach",
      head: "Part 2 考什么",
      lines: [
        "三个人各有需求（想找什么、什么时间、多少钱），下面八条广告，一对一匹配。",
        "难点不是读不懂，是**信息多、时间少**。所以顺序很关键：先读需求，再扫广告。",
      ],
    },
    {
      k: "steps",
      head: "配对四步",
      items: [
        { label: "1", text: "先读三个人的需求，用笔划出四个限定：要什么、什么时候、多少钱、在哪里。" },
        { label: "2", text: "八条广告只扫「标题 + 数字 + 时间」，不要逐句读。" },
        { label: "3", text: "先做最独特的那一个——比如某人要求「周日免费」，这种条件在广告里一眼能认出来。" },
        { label: "4", text: "剩下的用排除：只要有一条限定不合，整条广告就出局。" },
      ],
    },
    {
      k: "contrast",
      head: "限定词决定生死",
      rows: [
        { bad: "需求写「under £20」，广告写 £25，仍然选它", good: "£25 超预算，直接排除", why: "价格是最硬的限定，超了就是错，别抱侥幸。" },
        { bad: "需求写「on Sunday」，广告写「weekdays only」还选它", good: "weekdays only 已经排除周日", why: "only 一出，范围就封死了。" },
        { bad: "看到广告里有需求的原词就选", good: "核对四个限定是否全部满足", why: "原词命中只说明话题相关，不代表条件合适。" },
      ],
    },
    {
      k: "trap",
      head: "两个不能省的动作",
      text: "① 每匹配完一个就划掉那条广告，避免重复使用；② 最后一定回头核一遍四要素——配对题丢分极少是因为读不懂，几乎都是漏了一个数字或一个 only。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: [
        "先需求后广告，别倒过来。",
        "价格、时间、only 是硬限定，一条不合就排除。",
        "配完立刻划掉，最后回查四要素。",
      ],
      next: "去「信息配对」做一轮，用四步法计时",
    },
  ],

  "k-read-opencloze": [
    {
      k: "teach",
      head: "Part 6 考什么",
      lines: [
        "一篇小短文，六个空，**不给选项**，自己填一个词。",
        "填的几乎全是语法小词：冠词、介词、代词、连词、助动词、比较级。",
        "所以这题不是阅读题，是语法题穿了阅读的外衣——语法地基牢，这题就是送分。",
      ],
    },
    {
      k: "steps",
      head: "填空四步",
      items: [
        { label: "1", text: "先通读一遍全文（不填），知道讲的是什么事、什么时态。" },
        { label: "2", text: "看空的前后各一个词，判断这里缺什么词性：名词前缺冠词/限定词，动词前缺助动词或主语。" },
        { label: "3", text: "套规则：固定搭配优先（in the morning / at night / listen to），其次才是语法推理。" },
        { label: "4", text: "六个空填完再通读一遍，检查时态是否统一、单复数是否一致。" },
      ],
    },
    {
      k: "contrast",
      head: "高频六类空",
      rows: [
        { bad: "I go to school ___ bus.", good: "by bus（交通方式用 by，不加冠词）", why: "固定搭配，背下来比推快。" },
        { bad: "She is good ___ maths.", good: "good at（形容词 + 介词搭配）", why: "good at / interested in / afraid of 是一组。" },
        { bad: "___ old man was walking slowly.", good: "An（元音音素前用 an）", why: "看发音不看字母：an hour，a university。" },
      ],
    },
    {
      k: "trap",
      head: "丢分最多的不是填错，是拼写",
      text: "空里填对了词但拼错（becouse / allways / tomorow），一律不给分。这题没有选项提示拼写，所以平时的单词拼写必须过关——每天的打字练习就是在为这题攒分。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: [
        "开放填空 = 语法小词，不是阅读理解。",
        "先判断词性，再套固定搭配。",
        "拼写错等于没填，白丢分。",
      ],
      next: "去「开放填空」做一篇，对着解析看每个空为什么是那个词",
    },
  ],

  "k-read-speed": [
    {
      k: "teach",
      head: "60 分钟怎么分",
      lines: [
        "KET 阅读写作一共 60 分钟、7 个 Part，还要写两篇作文。时间不够是常态。",
        "参考分配：Part 1–5（阅读选择）25 分钟，Part 6 短消息 10 分钟，Part 7 故事 15 分钟，剩下 10 分钟检查。",
        "先把作文的时间扣出来——很多人死在阅读上，最后作文没写完，那才是真亏。",
      ],
    },
    {
      k: "steps",
      head: "定位三招",
      items: [
        { label: "1", text: "先看题再回文：题目里的名字、数字、大写词就是定位词，扫到再读那一段。" },
        { label: "2", text: "不要逐词读。眼睛找「名词 + 数字 + 转折词（but / however）」这三类，信息密度最高。" },
        { label: "3", text: "一题超过 90 秒就标记跳过，全部做完再回来。卡住一题换三题的时间，不划算。" },
      ],
    },
    {
      k: "trap",
      head: "两个时间黑洞",
      text: "① 在 Part 1 的五道标识题上反复纠结——它们每题只值 1 分，性价比最低，快速过。② 反复读同一段找答案——读完两遍还没找到，说明定位词选错了，换段落而不是重读。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先扣作文时间，再分阅读时间。", "定位词 = 名字 / 数字 / 大写词。", "一题 90 秒没进展就先跳过。"],
      next: "去「全真模拟卷」按真实时间做一遍，看哪一块超时",
    },
  ],

  "k-listen-1": [
    {
      k: "teach",
      head: "Part 1 图片选择",
      lines: [
        "每题三张图，听一段短对话，选符合的那张。录音放两遍。",
        "关键动作在**听之前**：先看清三张图差在哪里——通常差一个人物动作、一个地点、或一个数字。",
        "差别处就是考点。听的时候只盯那个差别。",
      ],
    },
    {
      k: "steps",
      head: "听前三秒做什么",
      items: [
        { label: "1", text: "扫三张图，把不同点在心里说一遍：「这张在室内，那张在室外」「这张是 8 点，那张是 8 点半」。" },
        { label: "2", text: "预判会听到的词：室内可能听到 cold / outside，时间题一定听到两个数字。" },
        { label: "3", text: "听的时候先别选，等否定词——很多题是「本来想 A，但是不行，所以 B」。" },
      ],
    },
    {
      k: "contrast",
      head: "三个经典陷阱",
      rows: [
        { bad: "听到 eight 就选 8 点", good: "听到 half past eight 才是答案", why: "录音常先否定一个数字，再说真正的。" },
        { bad: "听到 museum 就选博物馆那张", good: "听 I'd rather go to the park，博物馆是被否掉的", why: "rather / actually / but 后面才是真实意图。" },
        { bad: "听到 open 就选开门的图", good: "听 it's closed today，open 是陷阱词", why: "否定词常紧贴在关键词前面。" },
      ],
    },
    {
      k: "trap",
      head: "别在第一遍就锁定答案",
      text: "第一遍只求「听出话题和方向」，第二遍再确认细节。第一遍就选定的人，第二遍往往听见反证也舍不得改——这是图片题最典型的丢分方式。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["听之前先找出三张图的差别。", "否定词和 but / actually 后面才是答案。", "第一遍定方向，第二遍定答案。"],
      next: "去「听力填空」练耳朵，短句听清是基础",
    },
  ],

  "k-listen-2": [
    {
      k: "teach",
      head: "Part 2 / 3 填空与匹配",
      lines: [
        "Part 2 听一段独白填单词；Part 3 是选择题或配对。",
        "填空的评分标准很硬：**拼写必须完全正确**，大小写错也算错。",
        "所以这题真正考的是「听清 + 拼对」，两个能力缺一不可。",
      ],
    },
    {
      k: "steps",
      head: "填空题流程",
      items: [
        { label: "1", text: "读题时先预判词性：空前面是 the，多半填名词；是 at，多半填时间或地点。" },
        { label: "2", text: "第一遍听到就写，哪怕只写前三个字母——别停下来想拼写，会漏掉后面的。" },
        { label: "3", text: "第二遍补齐拼写并检查单复数：听到 books 写 book 是错的。" },
        { label: "4", text: "数字、时间、价格一律写阿拉伯数字，省时间也不容易拼错。" },
      ],
    },
    {
      k: "contrast",
      head: "常考的四类信息",
      rows: [
        { bad: "eight thirty 写成 8:13", good: "8:30", why: "thirty / thirteen 是最容易听混的一对。" },
        { bad: "£4.50 写成 4.15", good: "£4.50", why: "fifty / fifteen 同理，注意 -teen 重音在后。" },
        { bad: "Tuesday 写成 Thursday", good: "Tuesday", why: "Tues- 和 Thurs- 开头都是 T，靠音节数分。" },
      ],
    },
    {
      k: "trap",
      head: "一个空只填一个词时别画蛇添足",
      text: "题目写 ONE WORD ONLY，你填了 two words（比如 very cold）就零分。看到字数限制，先数清楚再落笔——这是白白送掉的分数。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["填空先预判词性。", "第一遍听写、第二遍补拼写和单复数。", "字数限制写在题上，别超。"],
      next: "去「听力填空」做 8 题，重点看拼写错在哪",
    },
  ],

  "k-listen-3": [
    {
      k: "teach",
      head: "为什么泛听没用",
      lines: [
        "把一段录音听十遍，你还是听不懂那几个词——因为大脑会自动跳过听不懂的地方，用上下文「猜」过去。",
        "精听不一样：一句一句停下来写，写不出来的地方就是你的真实漏洞。",
        "每天 15 分钟精听，效果大于一小时泛听。",
      ],
    },
    {
      k: "steps",
      head: "15 分钟精听流程",
      items: [
        { label: "1", text: "盲听一遍（2 分钟）：只听大意，不写。" },
        { label: "2", text: "逐句听写（8 分钟）：一句暂停一次，写下来，写不出就留空，别倒回去反复听。" },
        { label: "3", text: "对照原文（3 分钟）：把空的地方补上，标出「是词不认识」还是「是音没听出来」——这两类问题解法完全不同。" },
        { label: "4", text: "跟读两遍（2 分钟）：照着原文读，模仿语调。听不出的音，多半是自己也读不对的音。" },
      ],
    },
    {
      k: "contrast",
      head: "两类错误分开处理",
      rows: [
        { bad: "听不出 comfortable，因为不认识这个词", good: "抄进生词本，按音节读熟：COM-for-ta-ble", why: "词汇问题要背，光听一百遍也不会。" },
        { bad: "认识 going to 却听成 gonna", good: "专门记连读：gonna / wanna / kinda", why: "这是语音问题，要靠跟读解决。" },
        { bad: "把 a lot of 听成 a lotta", good: "同上，记口语弱读形式", why: "考试录音是自然语速，弱读一定会出现。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["精听 = 逐句听写 + 对照原文。", "把「不认识」和「听不出」分开记。", "每天 15 分钟，比周末听两小时有用。"],
      next: "去「听力填空」找一段做精听，把写不出的词记下来",
    },
  ],

  "k-write-message": [
    {
      k: "teach",
      head: "Part 6 短消息 / 邮件",
      lines: [
        "给一个情境和三个提示点，写 25 词以上的短信或邮件。",
        "评分只看两件事：**三个点是否都写到**，以及句子能不能看懂。",
        "不需要华丽，需要完整。少写一个点，直接掉一档。",
      ],
    },
    {
      k: "steps",
      head: "写作流程",
      items: [
        { label: "1", text: "先把三个提示点在草稿上标 ①②③，写完一个划一个——这是最有效的防漏方法。" },
        { label: "2", text: "开头一句打招呼 + 说明目的：Hi Sam, I'm writing about the school trip." },
        { label: "3", text: "中间按 ①②③ 各写一句，用 and / but / because 连起来。" },
        { label: "4", text: "结尾一句收尾 + 署名：See you soon, + 你的名字。最后数字数。" },
      ],
    },
    {
      k: "contrast",
      head: "同一题，及格版 vs 高分版",
      rows: [
        { bad: "I can come. I will bring a cake.", good: "Hi Anna, thanks for your message. I can come on Saturday, and I'll bring a chocolate cake because you said you like it. See you then, Li Hua.", why: "高分版三句话把三个点都写到了，还有连接词和原因。" },
        { bad: "Yes. OK. Bye.", good: "以上", why: "词数不够 25，直接判不合格。" },
      ],
    },
    {
      k: "trap",
      head: "两个白丢分的地方",
      text: "① 漏点：三个提示点里只写了两个——写完必须回头逐条核对。② 词数不够：25 词是很低的下限，但很多人真写不到，因为答案写成了「短语」而不是「句子」。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["三个提示点必须全部写到。", "用完整句子，不用短语堆。", "开头结尾有固定套路，套上去就稳。"],
      next: "去「写作批改」写一篇，AI 会指出你漏了哪个点",
    },
  ],

  "k-write-story": [
    {
      k: "teach",
      head: "Part 7 图片故事",
      lines: [
        "三张图讲一个故事，写 35 词以上。",
        "评分看三件事：三张图都写到、时态统一用过去时、句子能连起来。",
        "最常见的失败不是语法错，而是写成三句互不相干的话。",
      ],
    },
    {
      k: "steps",
      head: "三步成文",
      items: [
        { label: "1", text: "先给人物起个名字，再给三张图各写一句：谁 + 在哪 + 做什么。" },
        { label: "2", text: "用时间词把三句串起来：First… Then… After that… Finally…" },
        { label: "3", text: "加一句结果或感受收尾：In the end, they were very happy." },
      ],
    },
    {
      k: "contrast",
      head: "串起来 vs 不串",
      rows: [
        { bad: "A boy is in the park. He has a dog. The dog runs away. He is sad.", good: "Last Sunday, Tom took his dog to the park. Suddenly the dog ran away, so Tom looked for it everywhere. Luckily, a man found it near the gate, and Tom was very happy.", why: "后者三张图都覆盖，时态统一过去时，还有 so / luckily 这类连接。" },
      ],
    },
    {
      k: "trap",
      head: "时态是这题的命门",
      text: "故事必须用过去时。一旦混进 is / runs 现在时，整篇的档次就掉了。写完专门扫一遍所有动词，看是不是都是过去式——这个动作只要 30 秒，能救回好几分。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["三张图一句一张，别漏。", "First / Then / Finally 串成故事。", "通篇过去时，写完专门检查动词。"],
      next: "去「写作批改」写一篇三图故事",
    },
  ],

  "k-write-linkers": [
    {
      k: "teach",
      head: "连接词就是分数",
      lines: [
        "同样两个句子，加了 and / but / because，评分里「组织连贯」这一项就上去了。",
        "KET 不需要复杂连接词，把这六个用熟就够：and、but、so、because、then、also。",
      ],
    },
    {
      k: "steps",
      head: "六个词的分工",
      items: [
        { label: "and", text: "并列补充：I like football and swimming." },
        { label: "but", text: "转折：I wanted to go, but it rained." },
        { label: "so", text: "结果：It was late, so we went home." },
        { label: "because", text: "原因：I was tired because I got up early." },
        { label: "then", text: "顺序：We had lunch. Then we went shopping." },
        { label: "also", text: "递加：She speaks English and also French." },
      ],
    },
    {
      k: "contrast",
      head: "中式连接词要少用",
      rows: [
        { bad: "Although it rained, but we went out.", good: "Although it rained, we went out.", why: "although 和 but 不能同时用，这是中国学生最高频的错误。" },
        { bad: "Because it rained, so we stayed home.", good: "Because it rained, we stayed home.", why: "because 和 so 同样不能连用。" },
        { bad: "And then and then we go home.", good: "After that, we went home.", why: "and then 重复堆叠会显得语言能力很弱。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["六个连接词：and / but / so / because / then / also。", "although 和 but 不能同用，because 和 so 不能同用。", "每篇作文至少用两个连接词。"],
      next: "去「写作批改」写一篇，看它有没有指出连接问题",
    },
  ],

  "k-speak-1": [
    {
      k: "teach",
      head: "Part 1 考官问答",
      lines: [
        "考官问你的名字、年龄、学校、爱好这类个人信息。",
        "评分看的不是答案多精彩，是**能不能接着说下去**。",
        "所以核心技巧只有一条：一句半。给一个答案 + 一个理由或细节。",
      ],
    },
    {
      k: "steps",
      head: "一句半怎么造",
      items: [
        { label: "1", text: "第一句回答：直接给答案，别绕。" },
        { label: "2", text: "半句补充：because… / for example… / I usually… 加一个理由或细节。" },
        { label: "3", text: "别背长段落——考官一听就知道是背的，反而会追问。" },
      ],
    },
    {
      k: "contrast",
      head: "同一个问题，两种答法",
      rows: [
        { bad: "Do you like sport? — Yes.", good: "Yes, I do. I play basketball with my friends every weekend, because it's fun and I can relax.", why: "只答 Yes 是零展开，考官没法给你语言分的证据。" },
        { bad: "Where are you from? — China.", good: "I'm from Nanjing, a big city in the east of China. I've lived there all my life.", why: "补充地理位置和个人经历，语言量立刻翻倍。" },
      ],
    },
    {
      k: "trap",
      head: "听到不熟的问题别沉默",
      text: "沉默 5 秒以上，考官会扣流利度。不会答就用缓冲句拖时间：That's a good question… Let me think… 然后随便说一个相关的句子。开口比正确重要。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["一句半：答案 + 理由/细节。", "不要背整段，会被追问。", "不会答也要开口，用缓冲句拖时间。"],
      next: "去「口语模考」跟本地模型对练，它会追问你",
    },
  ],

  "k-speak-2": [
    {
      k: "teach",
      head: "Part 2 看图讨论",
      lines: [
        "你和搭档看一张图，图上有几样东西，一起商量选哪个。",
        "这题考的其实是「互动」：你有没有主动开口、有没有回应对方。",
        "搭档可能很安静——那你就得多说，别一起沉默。",
      ],
    },
    {
      k: "steps",
      head: "开口四个万能句",
      items: [
        { label: "提议", text: "What about the…? / How about going to…?" },
        { label: "赞同", text: "Good idea. I like that because…" },
        { label: "反对", text: "I'm not sure. It's a bit expensive, don't you think?" },
        { label: "做决定", text: "OK, let's choose this one then." },
      ],
    },
    {
      k: "contrast",
      head: "互动 vs 独白",
      rows: [
        { bad: "I like this one. It is good.", good: "I like this one because it's cheap. What do you think?", why: "加一个问句把搭档拉进来，才是讨论。" },
        { bad: "（等搭档先说）", good: "Shall we start with this one? What about you?", why: "沉默超过 3 秒，考官会认为互动失败。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["提议、赞同、反对、做决定，四句话背熟。", "每说完一句尽量带一个问句。", "搭档不说话，你就多说。"],
      next: "去「口语模考」，搭档是本地模型，练来回",
    },
  ],

  "k-speak-3": [
    {
      k: "teach",
      head: "考官到底在听什么",
      lines: [
        "不是听你口音像不像英国人，是听**能不能听懂**。",
        "评分四项里，发音只占一项，而且要求是「清晰可懂」，不是「标准英音」。",
        "真正拉开差距的是流利度：能不能不停顿地把话说完。",
      ],
    },
    {
      k: "steps",
      head: "三个见效最快的练习",
      items: [
        { label: "1", text: "单词重音：每个多音节词只重读一个音节，RE-cord（名词）/ re-CORD（动词）。重音错比发音错更影响理解。" },
        { label: "2", text: "句尾降调：陈述句句尾降下来，疑问句句尾升上去。语调平会显得没说完。" },
        { label: "3", text: "填充词替换：把「呃…」换成 Well… / I mean… / Let me see…，听起来流利得多。" },
      ],
    },
    {
      k: "contrast",
      head: "听起来差在哪",
      rows: [
        { bad: "I… go… to… school… by… bus.（一词一顿）", good: "I go to school by bus.（意群连着说）", why: "按意群停顿，中间不停，流利度分数立刻不一样。" },
        { bad: "be-CAUSE（重音在第二音节）", good: "be-CAUSE ✓（这个是对的；错的是 CAUSE-be 式乱重音）", why: "重音位置错，考官要猜你在说什么。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["清晰可懂 > 口音标准。", "重音和意群停顿比单个音更影响理解。", "用 Well / I mean 替代「呃」。"],
      next: "去「口语模考」录一段，回听自己的停顿",
    },
  ],

  "k-sprint-errors": [
    {
      k: "teach",
      head: "为什么错题比新题值钱",
      lines: [
        "做 100 道新题，错的还是那几类；把错过的 20 道吃透，直接补掉真实漏洞。",
        "错题的价值不在「正确答案是什么」，而在「我当时为什么会选错」。",
        "这一节教你把错题变成不再错的题。",
      ],
    },
    {
      k: "steps",
      head: "错题回炉三步",
      items: [
        { label: "1", text: "按考点归类：错题本里每道题都有错因标签，先看哪个考点错得最多——那就是你的主攻方向。" },
        { label: "2", text: "只看考点规则，不做题：把那个考点的公式和陷阱重读一遍，再回头看错题，往往自己就笑了。" },
        { label: "3", text: "隔一天再刷同一考点的新题：当场做对不算会，隔天做对才算。" },
      ],
    },
    {
      k: "trap",
      head: "一个自我欺骗的陷阱",
      text: "看完解析立刻重做，全对——这是短期记忆，不是掌握。真正有效的检验是隔 24 小时再做同考点的新题。间隔复习之所以有效，就是因为它让你在「快忘了」的时候重新想起来。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["按考点归类，先攻错得最多的那类。", "先看规则再看错题。", "隔天做新题才算真会。"],
      next: "去「语法诊所」按错得最多的考点刷一轮",
    },
  ],

  "k-sprint-mock": [
    {
      k: "teach",
      head: "模考的意义",
      lines: [
        "平时练习是「会不会」，模考是「来不来得及」。",
        "很多人知识点都会，一到整卷就崩——因为没练过连续 60 分钟的注意力。",
        "模考至少做三次，一次比一次接近真实状态。",
      ],
    },
    {
      k: "steps",
      head: "模考五条规矩",
      items: [
        { label: "1", text: "一次做完，不查单词、不暂停、不看解析——中途查一次，模考就失去意义。" },
        { label: "2", text: "手机放远，计时器开着，按真实时间走。" },
        { label: "3", text: "做完先别对答案，先写下「哪一部分最卡」——这个感受比对错更准。" },
        { label: "4", text: "对答案时只统计三类：知识不会、看错题、时间不够。" },
        { label: "5", text: "针对最弱的那一块，安排下一周的练习重点。" },
      ],
    },
    {
      k: "contrast",
      head: "模考后两种做法",
      rows: [
        { bad: "看完分数就关掉，明天继续做新卷", good: "统计三类错误，找出最弱一块，针对性练三天", why: "分数只说明现状，分类才给出行动。" },
        { bad: "一套卷分三天做完", good: "一次连续做完", why: "拆开做练不到耐力，而耐力正是考场最容易崩的部分。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["模考考的是节奏和耐力。", "一次做完，中途不查不暂停。", "考后分类错误，据此安排下一周。"],
      next: "去「全真模拟卷」按真实时间做一整卷",
    },
  ],

  // ---- 话题词汇（图片词表由图鉴实时提供）----

  "k-vocab-daily": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "日常类词汇从来不单独考，它藏在三处：阅读 Part 1 的便条、听力 Part 1 的图片、口语 Part 1 的自我介绍。",
        "这三处有个共同点——**都要求你当场说/读出来**，所以「认得」不够，得「想得起来」。",
        "下面的词表按图鉴里「生活」这个主题抽的，点词能听发音。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 14,
      picks: ["bedroom", "wardrobe", "cupboard", "armchair", "pillow", "blanket", "tidy up", "washing-up", "look after", "get dressed", "helpful", "comfortable"],
      cefr: "A2", note: "先听一遍发音，再遮住中文自测。想不起来的抄进生词本——这一批是写作 Part 6 的主料。" },
    {
      k: "breakdown",
      head: "便条题怎么被单词卡住",
      tag: "同源样题 · 阅读 Part 1",
      stem: "Mum: I've gone to the shops. Could you put the dishes away before I get back? I'll be home around six.",
      options: ["Wash the plates.", "Put the plates in the cupboard.", "Buy some plates."],
      answer: "Put the plates in the cupboard.",
      steps: [
        { label: "定位", text: "put the dishes away 里的 away 是「收起来」，不是「洗掉」。" },
        { label: "排雷", text: "wash 和 put away 都涉及碗碟，但一个洗一个收，方向完全不同。" },
        { label: "定案", text: "away = 放到该放的地方，所以是「放进柜子」。这类题丢分几乎都在动词短语上。" },
      ],
    },
    {
      k: "contrast",
      head: "同一个意思，说得好一点",
      rows: [
        { bad: "I like my room very much.", good: "I'm really into my room — it's got a big window and lots of light.", why: "be into 比 like 自然，再加一个具体细节就够口语 Part 1 的分。" },
        { bad: "My friend is good.", good: "My best friend is easy to talk to and always helps me with maths.", why: "形容词 + 具体行为，考官才知道你真会这个词。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["日常词要「能主动想起来」，不是「看着眼熟」。", "动词短语（put away / tidy up / look after）是阅读 Part 1 的命脉。", "口语描述房间、朋友时，一定加一个具体细节。"],
      next: "去「闪卡学词」把生活类词过一轮",
    },
  ],

  "k-vocab-school": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "学校类词最常出现在听力 Part 2 的独白：通知、课程变更、活动安排。",
        "这类独白的关键不是名词，是**时间和地点**：at the library / on Monday / in Room 12。",
        "先把名词认全，再去听介词和数字。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 0,
      picks: ["timetable", "textbook", "notebook", "playground", "classmate", "subject", "homework", "spell", "practise", "headteacher", "grade", "term"],
      cefr: "A2", note: "重点看科目名和校园场所——听力里它们几乎不做同义替换，听到什么就是什么。" },
    {
      k: "breakdown",
      head: "一条通知题",
      tag: "同源样题 · 听力 Part 2",
      stem: "The art class will now start at 4:15, not 3:30, and it's in Room 8 instead of the art room.",
      options: ["In the art room at 3:30.", "In Room 8 at 4:15.", "In Room 8 at 3:30."],
      answer: "In Room 8 at 4:15.",
      steps: [
        { label: "定位", text: "听到 now / instead of 就知道有改动，改动后的才是答案。" },
        { label: "排雷", text: "3:30 和 art room 都是「原计划」，出题人专门留着骗你。" },
        { label: "定案", text: "改后的时间 + 改后的地点 = 4:15 + Room 8。" },
      ],
    },
    {
      k: "trap",
      head: "最容易听错的地方",
      text: "数字连读：4:15 常被听成 4:50，13 和 30 也分不清。考前练 20 组数字听写，比刷十套题有用。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["校园词以名词为主，认得就能得分。", "听到 now / instead of / change 就是有改动，答案在后面。", "数字和介词单独练，别混在整句里练。"],
      next: "去「听力填空」练一组数字与拼写",
    },
  ],

  "k-vocab-travel": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "旅行类是 KET 出现频率最高的话题，没有之一：阅读 Part 1 的车站告示、听力 Part 1 的图片、写作 Part 6 的约人短信都在这里。",
        "最值得背的不是名词（train / bus），是**方向和位置**：platform / exit / opposite / next to。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 11,
      picks: ["platform", "ticket", "luggage", "suitcase", "passport", "delayed", "get off", "passenger", "journey", "accommodation", "harbour", "sightseeing"],
      cefr: "A2", note: "把「交通方式 + 地点 + 方向」分开记，考场上就能直接调出来。" },
    {
      k: "breakdown",
      head: "告示题：同义替换最狠的一类",
      tag: "同源样题 · 阅读 Part 1",
      stem: "PLATFORM 3 CLOSED — all trains to the airport leave from platform 5 today.",
      options: ["Airport trains are cancelled today.", "You should go to platform 5 for the airport.", "Platform 5 is closed today."],
      answer: "You should go to platform 5 for the airport.",
      steps: [
        { label: "定位", text: "CLOSED 后面跟着 from platform 5——被关的是 3 号，改到 5 号。" },
        { label: "排雷", text: "选项里出现 closed 的那句（Platform 5 is closed）正好反了，是标准陷阱。" },
        { label: "定案", text: "改到 5 号台 + 目的地还是机场，选 B。" },
      ],
    },
    {
      k: "contrast",
      head: "问路的两版说法",
      rows: [
        { bad: "Where is the station?", good: "Excuse me, how do I get to the station from here?", why: "加上 from here，对方才知道从哪儿开始指。" },
        { bad: "It's near.", good: "It's about five minutes' walk, just past the bank.", why: "时间 + 参照物，这是口语 Part 2 看图说话的加分句。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["旅行话题在四个 Part 都会出现，是投入产出比最高的一组词。", "方向词（opposite / past / next to）比交通名词更常考。", "看到告示里有 closed / changed，先找「改成了什么」。"],
      next: "去「标识识别」刷一轮旅行类告示",
    },
  ],

  "k-vocab-health": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "健康与情绪类词在口语里最关键：考官问 How are you feeling? / What do you do at weekends? 你得答得出状态。",
        "阅读里它常出现在「请假条」「医生预约」这类短文本。",
        "重点不是病名，是**形容词**：tired / worried / better / hurts。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 5,
      picks: ["appointment", "dentist", "pharmacy", "medicine", "headache", "toothache", "stomach ache", "hurt", "tired", "exercise", "healthy", "thirsty"],
      cefr: "A2", note: "情绪形容词是 B1 的门槛，KET 阶段先做到「说得出、拼得对」。" },
    {
      k: "breakdown",
      head: "请假条题",
      tag: "同源样题 · 阅读 Part 1",
      stem: "Hi Mr Lee, I can't come to football practice today — my ankle still hurts from Saturday. I'll be back on Thursday.",
      options: ["He is ill and will miss school.", "He hurt his ankle and will miss one practice.", "He wants to change the practice time."],
      answer: "He hurt his ankle and will miss one practice.",
      steps: [
        { label: "定位", text: "can't come to football practice today 只影响一次练习，不是长期缺席。" },
        { label: "排雷", text: "ill 在这句没出现，hurts 说的是脚踝；换时间也没提。" },
        { label: "定案", text: "伤在脚踝 + 只缺今天这一次 = B。" },
      ],
    },
    {
      k: "trap",
      head: "最容易丢分的地方",
      text: "hurt 的用法：My leg hurts.（不及物） / I hurt my leg.（及物）。写成 My leg is hurt 在 KET 里算错。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["健康类重点在形容词和 hurt 的用法。", "请假条题只关心「缺几次、什么时候回来」。", "口语里答感受要带原因：I'm tired because I got up early."],
      next: "去「口语模考」练 Part 1 的日常问答",
    },
  ],

  // ---- 阅读新增 Part ----

  "k-read-long": [
    {
      k: "teach",
      head: "Part 3 到底考什么",
      lines: [
        "一篇 250 词左右的短文（故事、通知、人物介绍），后面 5 道三选一。",
        "五道题的顺序**和原文顺序一致**——这是 KET 阅读最有用的一个事实，意味着你不需要来回翻。",
        "它考的不是「读懂全文」，是「这句话对应哪一题」。",
      ],
    },
    {
      k: "steps",
      head: "四步做题法",
      items: [
        { label: "1", text: "先扫题干，圈出人名、时间、地点这类「可定位词」，别读选项。" },
        { label: "2", text: "从第一段开始读，读到定位词就停下来找对应句。" },
        { label: "3", text: "找到的那一句往往只差一个同义词——答案就是它的改写。" },
        { label: "4", text: "某题卡住超过 40 秒，标记后跳过，别让一题吃掉后面四题的时间。" },
      ],
    },
    {
      k: "breakdown",
      head: "同义替换长什么样",
      tag: "同源样题 · 阅读 Part 3",
      stem: "原文：Anna had planned to study medicine, but after a summer job in a hotel she changed her mind and decided to train as a chef.\n题干：What did Anna decide to do?",
      options: ["Work in a hotel.", "Study medicine.", "Become a chef."],
      answer: "Become a chef.",
      steps: [
        { label: "定位", text: "changed her mind and decided to… 后面才是结论。" },
        { label: "排雷", text: "hotel 和 medicine 都在原文出现过，但都是「以前的打算」。" },
        { label: "定案", text: "train as a chef = become a chef，同义改写，选 C。" },
      ],
    },
    {
      k: "trap",
      head: "三个固定陷阱",
      text: "① 原文原句照搬的选项多半是错的；② but / however 后面才是作者真正要说的；③ 时间题要看清 before / after，两个动作谁在前。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["题目顺序 = 原文顺序，不用来回找。", "答案永远是改写，不是原文照抄。", "一题 40 秒，超时就跳。"],
      next: "去「信息配对」和「全真模拟卷」各练一轮",
    },
  ],

  "k-read-cloze": [
    {
      k: "teach",
      head: "Part 4 和 Part 5 的区别",
      lines: [
        "Part 4 给四个选项，Part 5 什么都不给——但两者考的是同一件事：语法小词和固定搭配。",
        "Part 4 的四个选项常常**词性相同、意思接近**，只有搭配是对的：interested **in**、good **at**、depend **on**。",
        "所以做 Part 4 不要翻译，要问「这个词跟谁搭配」。",
      ],
    },
    {
      k: "steps",
      head: "三步定答案",
      items: [
        { label: "1", text: "先看空后面那个词是什么——介词题看动词，冠词题看名词。" },
        { label: "2", text: "四个选项里能跟它搭配的通常只剩一个，剩下三个是「意思对但搭配错」。" },
        { label: "3", text: "实在选不出，选最常见那个（the / to / of），别选生僻的。" },
      ],
    },
    {
      k: "breakdown",
      head: "搭配型完形",
      tag: "同源样题 · 阅读 Part 4",
      stem: "My brother is really good ___ drawing, but he hates showing his work to other people.",
      options: ["at", "in", "on"],
      answer: "at",
      steps: [
        { label: "定位", text: "good 后面接能力，固定搭配是 be good at doing sth。" },
        { label: "排雷", text: "in 也有「在……方面」的意思，但 good in 不是英语搭配；on 完全不搭。" },
        { label: "定案", text: "be good at + 名词/动名词，选 at。" },
      ],
    },
    {
      k: "contrast",
      head: "常考搭配三组",
      rows: [
        { bad: "I am interested on music.", good: "I am interested in music.", why: "interested 只跟 in。" },
        { bad: "It depends of the weather.", good: "It depends on the weather.", why: "depend 只跟 on。" },
        { bad: "She is afraid from dogs.", good: "She is afraid of dogs.", why: "afraid 只跟 of。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["完形考搭配，不考翻译。", "先看空后面那个词，再选。", "三组高频搭配：good at / interested in / depend on。"],
      next: "去「开放填空」练一轮小词",
    },
  ],

  // ---- 听力新增 Part ----

  "k-listen-long": [
    {
      k: "teach",
      head: "Part 3 的节奏",
      lines: [
        "一段长对话（通常两人商量事情），配 5 道三选一，题目顺序同样跟录音顺序一致。",
        "它最难的地方不是听不懂，是**跟不上**：一题没听清，后面全乱。",
        "解法只有一个：提前把 5 道题干扫完，知道每题在等什么词。",
      ],
    },
    {
      k: "steps",
      head: "听之前的 60 秒",
      items: [
        { label: "1", text: "扫题干，圈疑问词：when / where / how much / why——它决定你听什么。" },
        { label: "2", text: "看选项的共同点：三个都是时间，就专心听数字。" },
        { label: "3", text: "听到一题的答案就在卷上打勾，立刻把注意力交给下一题。" },
        { label: "4", text: "某题彻底没听到，猜一个继续，绝不停留。" },
      ],
    },
    {
      k: "breakdown",
      head: "转折词后面的才是答案",
      tag: "同源样题 · 听力 Part 3",
      stem: "录音：I thought the trip was on Saturday, but the teacher said it's Sunday now.\n题干：When is the trip?",
      options: ["Saturday.", "Sunday.", "Monday."],
      answer: "Sunday.",
      steps: [
        { label: "定位", text: "I thought… but… 是典型结构：前半是「以为」，后半是「事实」。" },
        { label: "排雷", text: "Saturday 先出现，很多人一听就选了，这正是出题点。" },
        { label: "定案", text: "but 之后 + now，说明改成了 Sunday。" },
      ],
    },
    {
      k: "trap",
      head: "别做的一件事",
      text: "不要一边听一边在三个选项之间反复比较。KET 语速慢，但选项长；先记住你听到的词，等录音播完那一段再选。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["题目顺序 = 录音顺序，一题一题往前走。", "but / actually / instead 后面是答案。", "没听清就猜，别回头。"],
      next: "去「听力选择」练一轮长对话",
    },
  ],

  "k-listen-short": [
    {
      k: "teach",
      head: "Part 4 的节奏",
      lines: [
        "五段互不相关的短对话，每段一个问题。整段只有两三句，节奏是听力五个 Part 里最快的。",
        "它考的是**抓关键信息**：价格、时间、地点、人物关系。",
        "每段之间有停顿，但很短——你必须听完就选。",
      ],
    },
    {
      k: "breakdown",
      head: "改口的那些词",
      tag: "同源样题 · 听力 Part 4",
      stem: "录音：Two tickets, please. — That's eight pounds… oh wait, students get a discount, so six fifty.\n题干：How much will the speaker pay?",
      options: ["£6.50", "£8.00", "£13.00"],
      answer: "£6.50",
      steps: [
        { label: "定位", text: "oh wait 一出现，前面的数字就作废了。" },
        { label: "排雷", text: "£8 是原价，£13 是「两倍」的干扰（听清 two tickets）。" },
        { label: "定案", text: "重算后的 6.50 才是要付的钱。" },
      ],
    },
    {
      k: "steps",
      head: "短对话的听法",
      items: [
        { label: "1", text: "每段开始前先看题干问什么（who / how much / where）。" },
        { label: "2", text: "听到数字先记下来，但不要立刻选，等句子说完。" },
        { label: "3", text: "注意语气词：oh wait / actually / sorry 后面常改口。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["短对话只抓一个信息点。", "改口词后面才是真的。", "听完再选，别抢答。"],
      next: "去「听力选择」连做两组",
    },
  ],

  "k-listen-match": [
    {
      k: "teach",
      head: "Part 5 怎么考",
      lines: [
        "一段独白，五个人各自的需求或喜好，配八个选项做匹配（有剩余）。",
        "难点是**干扰项**：每个选项都会在录音里被提到，但只有一个真正属于那个人。",
        "关键在限定词：only / not / already / prefer——它们决定了「这个人不行」。",
      ],
    },
    {
      k: "steps",
      head: "匹配三步",
      items: [
        { label: "1", text: "听之前把八个人的名字和需求各扫一遍，在心里分组（喜欢户外的 / 喜欢室内的）。" },
        { label: "2", text: "听到名字就在那行旁边记关键词，不要急着连线。" },
        { label: "3", text: "一个人说了否定（I don't like… / I've already…），就把他从候选里划掉。" },
      ],
    },
    {
      k: "breakdown",
      head: "否定词决定结果",
      tag: "同源样题 · 听力 Part 5",
      stem: "录音：Tom wants a sports class, but he's already done swimming, so he'd prefer something he can do indoors.\n题干：Which class should Tom choose?",
      options: ["Swimming", "Indoor climbing", "Football"],
      answer: "Indoor climbing",
      steps: [
        { label: "定位", text: "already done swimming → 游泳排除；indoor 是关键词。" },
        { label: "排雷", text: "Football 符合 sports，但不符合 indoors。" },
        { label: "定案", text: "同时满足「运动」和「室内」的只有攀岩。" },
      ],
    },
    {
      k: "trap",
      head: "最容易丢分的地方",
      text: "八个选项里有两个永远用不上——不要为了「都用完」而硬匹配，看到最后一个只剩一个空是常态。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["每人一个空，选项有剩余。", "already / don't like 直接排除该人该选项。", "边听边记关键词，最后统一连线。"],
      next: "去「信息配对」练同类题型",
    },
  ],
};

// ------------------------------------------------------------ PET 技能课讲义

const PET_SKILL: Record<string, DeckSlide[]> = {
  "p-read-sign": [
    {
      k: "teach",
      head: "Part 1 的难度在哪",
      lines: [
        "形式还是「五块告示，各选一句同义句」，但 PET 的告示更长、句子更绕。",
        "KET 考「禁止 / 允许」，PET 还考**条件**和**隐含意思**：不退不换、逾期作废、仅限持卡人。",
        "所以关键动作从「找关键词」升级成「还原这句话对读者意味着什么」。",
      ],
    },
    {
      k: "steps",
      head: "四步读法（PET 版）",
      items: [
        { label: "1", text: "先判断语气：是禁令（must not）、许可（may）、还是条件（only if / unless）。" },
        { label: "2", text: "抓条件从句：if / unless / provided that 后面那半句，往往才是判分点。" },
        { label: "3", text: "把告示翻译成一句大白话：「所以我到底能做什么、不能做什么」。" },
        { label: "4", text: "用这句大白话去对选项，不要用原词去对。" },
      ],
    },
    {
      k: "contrast",
      head: "条件类告示怎么读",
      rows: [
        { bad: "Refunds only with receipt → 选 You can always get your money back.", good: "选 You need a receipt to get a refund.", why: "only with 是硬条件，不是无条件退。" },
        { bad: "Tickets valid for one month → 选 The ticket never expires.", good: "选 You can use the ticket for four weeks.", why: "one month ≈ four weeks，考的就是这个换算。" },
        { bad: "Members may bring one guest → 选 Anyone can come in.", good: "选 Only members can bring another person.", why: "may 是许可，但主语限定在 members。" },
      ],
    },
    {
      k: "trap",
      head: "最常见的一种改写",
      text: "把否定绕一圈说：告示写「Please keep your belongings with you at all times」，正确选项是「Do not leave your bags unattended」。字面差很远，意思完全一样。所以看不出对应关系时，先问自己：「这句话是在提醒我别做什么？」",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先判断是禁令、许可还是条件。", "把告示翻成一句大白话再对选项。", "否定绕圈说是 PET 最爱的改写手法。"],
      next: "去「标识识别」刷 B1 组，注意条件类告示",
    },
  ],

  "p-read-match": [
    {
      k: "teach",
      head: "Part 2 的规模",
      lines: [
        "五个人五条需求，八个选项里挑五个，三个是干扰项。",
        "信息量比 KET 大一倍，纯读会超时。",
        "所以这题是**筛选题**，不是阅读题：靠排除法把它做小。",
      ],
    },
    {
      k: "steps",
      head: "排除法五步",
      items: [
        { label: "1", text: "先只读五个人的需求，每人写下两个最硬的限定（通常是价格、时间、地点、经验要求）。" },
        { label: "2", text: "扫八个选项的第一句，用最硬的限定先砍掉一半。" },
        { label: "3", text: "剩下的人对剩下的选项做精确匹配——这一步才需要读细节。" },
        { label: "4", text: "三个干扰项通常长得很像正确答案，差别在一个数字或一个 only。" },
        { label: "5", text: "全部配完回头查：有没有人配了同一个选项（一定错）。" },
      ],
    },
    {
      k: "contrast",
      head: "干扰项的三个套路",
      rows: [
        { bad: "文中说「适合初学者」，选项说「for experienced players」", good: "方向反了，立刻排除", why: "反义改写是最高频的干扰。" },
        { bad: "文中说「周末开班」，选项说「every day」", good: "every day 包含了周末，但超出范围", why: "范围扩大也是错。" },
        { bad: "文中说「免费」，选项说「small charge」", good: "免费 ≠ 少量收费", why: "价格类限定不许模糊处理。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先写硬限定，再扫选项第一句。", "干扰项常靠反义、扩大范围、价格模糊来骗人。", "出现重复配对一定错，最后必查。"],
      next: "去「信息配对」做一轮，用排除法计时",
    },
  ],

  "p-read-long": [
    {
      k: "teach",
      head: "Part 4 长文多选",
      lines: [
        "一篇长文 + 五道四选一，考的是细节理解和作者态度。",
        "这题的选项有个规律：**和原文一模一样的表述，通常是错的**。",
        "正确的选项一定经过了改写（换词、换句式、换语序）。",
      ],
    },
    {
      k: "steps",
      head: "做题顺序",
      items: [
        { label: "1", text: "先读题干，圈出定位词（人名、时间、大写词），不读选项。" },
        { label: "2", text: "回到原文找定位句，把定位句读懂再回来看选项。" },
        { label: "3", text: "四个选项逐一判：哪个是改写、哪个是原词照抄、哪个是过度推断。" },
        { label: "4", text: "态度题看形容词和转折词：however / although 后面往往是作者真观点。" },
      ],
    },
    {
      k: "contrast",
      head: "选项的三种身份",
      rows: [
        { bad: "原文 the scheme was widely criticised", good: "选项 It was not popular.（改写，正确）", why: "criticised ≈ not popular，同义替换。" },
        { bad: "选项 Most people supported the scheme.（与原文相反）", good: "同上", why: "把否定读成肯定，是最常见的失分。" },
        { bad: "选项 The writer believes it should be banned.（原文没说）", good: "原文只说有争议", why: "过度推断，比原文多走了一步。" },
      ],
    },
    {
      k: "trap",
      head: "原词照抄是陷阱",
      text: "出题人把原文的原词堆进错误选项，让你眼熟就选。凡是「读起来特别顺、词都见过」的选项，反而要多想一秒：它有没有偷偷改了主语、改了范围、改了时态？",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先题干后选项，定位句读懂再选。", "原词照抄的选项往往是错的。", "态度看 however / although 后面。"],
      next: "去「信息配对」和「开放填空」交替练，练定位速度",
    },
  ],

  "p-read-opencloze": [
    {
      k: "teach",
      head: "Part 5 开放填空",
      lines: [
        "短文六个空，不给选项，填一个词。",
        "和 KET Part 6 同源，但句子更长、语法点更深：完成时、被动、非谓语都会出现。",
        "这题是纯语法题——考的不是读懂，是「这个位置必须是什么」。",
      ],
    },
    {
      k: "steps",
      head: "五步填空",
      items: [
        { label: "1", text: "通读全文，确定时态基调（讲过去的事还是现在的常态）。" },
        { label: "2", text: "每个空先判断词性：名词前缺限定词，动词前缺助动词/主语，句首缺连词。" },
        { label: "3", text: "再判断语法形式：完成时缺 have/has，被动缺 be，比较缺 than。" },
        { label: "4", text: "固定搭配优先于推理：depend on / interested in / look forward to。" },
        { label: "5", text: "填完通读，检查时态一致、单复数一致、冠词有无。" },
      ],
    },
    {
      k: "contrast",
      head: "PET 常见六类空",
      rows: [
        { bad: "He has lived here ___ 2010.", good: "since（时间点用 since，时间段用 for）", why: "since + 时间点，for + 时间段，年年考。" },
        { bad: "The bridge ___ built in 1900.", good: "was（被动 + 过去时）", why: "桥不会自己建，必须被动。" },
        { bad: "I'm looking forward to ___ you.", good: "seeing（to 是介词，后面接 -ing）", why: "look forward to doing，不是 to do。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先定时态基调，再逐空判词性。", "since/for、被动、look forward to doing 是必考三件套。", "填完必通读，检查一致性。"],
      next: "去「开放填空」做 B1 篇，重点看完成时和被动",
    },
  ],

  "p-listen-1": [
    {
      k: "teach",
      head: "Part 1 图片选择（B1）",
      lines: [
        "还是三图选一，但三张图的差别更细：可能只差一个人在做的事、或一个很小的物件。",
        "PET 的录音更长、语速更快，还常有「先肯定后否定」的结构。",
        "听之前那几秒的读图，决定了一半的分数。",
      ],
    },
    {
      k: "steps",
      head: "听前读图三件事",
      items: [
        { label: "1", text: "找出三张图的唯一差别，用一句话说出来：差别在「谁做」「在哪」「多少钱」。" },
        { label: "2", text: "预判可能出现的否定结构：not… but…、instead、rather。" },
        { label: "3", text: "听的时候先记「方向」，第二遍才定答案。" },
      ],
    },
    {
      k: "contrast",
      head: "B1 的三种绕法",
      rows: [
        { bad: "听到 I was going to take the train 就选火车", good: "继续听 but the line was closed, so I drove", why: "was going to 表示「本来打算」，后面一定有转折。" },
        { bad: "听到 £30 就选 30", good: "听到 it was £30, but I got it for £20", why: "but 后面才是实际价格。" },
        { bad: "听到 she suggested the museum 就选博物馆", good: "听 but we decided on the castle", why: "suggest 不等于最终决定。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["读图时用一句话说出三图差别。", "was going to / but / instead 后面才是真相。", "第一遍定方向，第二遍定答案。"],
      next: "去「听力填空」练短句，再回来做图片题",
    },
  ],

  "p-listen-2": [
    {
      k: "teach",
      head: "Part 2 / 3 填空与选择",
      lines: [
        "Part 2 是听一段独白填六个空；Part 3 是六道三选一。",
        "填空依然要求拼写完全正确；选择题的难点是同义转述——你听到的词和选项里的词不一样。",
        "两条能力线：拼写准确、识别改写。",
      ],
    },
    {
      k: "steps",
      head: "两条线分开练",
      items: [
        { label: "填空", text: "预判词性 → 第一遍听写 → 第二遍补拼写和单复数 → 检查字数限制。" },
        { label: "选择", text: "先读题干定位（问的是谁、什么时候）→ 听的时候只找和题干相关的那句 → 用同义对应选，不用原词对应。" },
        { label: "共同", text: "两道题都在录音开始前有几秒读题时间，这几秒比后面 30 秒值钱。" },
      ],
    },
    {
      k: "contrast",
      head: "选择题的同义转述",
      rows: [
        { bad: "录音说 it's a bit out of the way，选项写 It is far from the centre.（正确）", good: "这是改写，选它", why: "out of the way ≈ 偏远，考的就是这个。" },
        { bad: "录音说 the course fills up quickly，选项写 The course is expensive.", good: "排除——说的是名额，不是价格", why: "听起来都像「有问题」，但方向不同。" },
        { bad: "录音说 I'd rather not, 选项写 She refused.（正确）", good: "选它", why: "I'd rather not 是委婉拒绝。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["填空拼写必须全对，注意单复数。", "选择题找同义，不找原词。", "录音前的读题几秒最重要。"],
      next: "去「听力填空」做 8 题，看拼写错在哪类词",
    },
  ],

  "p-listen-3": [
    {
      k: "teach",
      head: "Part 4 长独白",
      lines: [
        "一个人讲 2–3 分钟，六道题顺着讲下来，题序和内容顺序一致。",
        "难点是「不能回头」：讲过去了就没了。",
        "所以这题考的是**边听边记关键词**，不是记忆力。",
      ],
    },
    {
      k: "steps",
      head: "边听边记的方法",
      items: [
        { label: "1", text: "读题时把六道题的定位词按顺序标好，心里有一条题号进度线。" },
        { label: "2", text: "只记名词、数字、形容词，不写完整句子——一行三个词就够。" },
        { label: "3", text: "听到某题的定位词就立刻看那题，别等讲完再看。" },
        { label: "4", text: "错过一题立刻放弃，跟住下一题——追上一题会连丢两题。" },
      ],
    },
    {
      k: "contrast",
      head: "笔记记什么",
      rows: [
        { bad: "完整抄写：The speaker said the museum was opened in 1998 by a local family", good: "museum / 1998 / local family", why: "考场没有时间写完整句，只记锚点词。" },
        { bad: "错过一题回头想，结果第二题也漏了", good: "立刻跳到下一题", why: "长独白是单向流，追不回来的。" },
      ],
    },
    {
      k: "trap",
      head: "题序一定跟着内容走",
      text: "如果听到第三题的内容，说明第二题已经过去了，立刻放弃第二题。很多人卡住是因为死等第二题的答案，结果连丢两题——这是长独白最典型的失分方式。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["六题定位词按顺序标好。", "只记名词、数字、形容词。", "错过就放弃，跟住下一题。"],
      next: "去「听力选择」做一轮长独白",
    },
  ],

  "p-write-email": [
    {
      k: "teach",
      head: "Part 1 邮件（100 词）",
      lines: [
        "给一个情境和四个提示点，写一封 100 词左右的邮件。",
        "四个点一个都不能少——这是硬性评分项，漏一个直接掉档。",
        "格式有套路：称呼、开头说明目的、逐点回应、结尾、署名。",
      ],
    },
    {
      k: "steps",
      head: "五段式模板",
      items: [
        { label: "称呼", text: "Dear Alex, / Hi Sam,（题目给的写信对象照抄）" },
        { label: "开头", text: "Thanks for your email. / I'm writing to tell you about…" },
        { label: "主体", text: "四个提示点各一到两句，用 First / Also / However / Finally 分段。" },
        { label: "结尾", text: "Hope to hear from you soon. / Let me know what you think." },
        { label: "署名", text: "Best wishes, / See you soon, + 名字（题目要求的名）" },
      ],
    },
    {
      k: "contrast",
      head: "同一段，两种水平",
      rows: [
        { bad: "I like the hotel. It is good. The food is good.", good: "The hotel was right in the centre, which made it easy to get around, though the food wasn't as good as I expected.", why: "B1 的分数来自句式变化和让步，不是形容词堆叠。" },
        { bad: "（只写了三个提示点）", good: "四点全覆盖，哪怕每点一句", why: "漏点是硬伤，写得多漂亮也补不回来。" },
      ],
    },
    {
      k: "trap",
      head: "别写超太多",
      text: "题目说 about 100 words，写到 180 词不会加分，只会多出错、多花时间。控制在 90–120 词，把时间留给检查语法和拼写。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["四个提示点全部写到。", "五段式套路上手就稳。", "控制在 90–120 词，留时间检查。"],
      next: "去「写作批改」写一封，让 AI 指出漏点",
    },
  ],

  "p-write-article": [
    {
      k: "teach",
      head: "Part 2 文章或故事",
      lines: [
        "二选一：写一篇文章（谈看法）或一个故事。大约 100 词。",
        "选择原则很简单：**选你更有话说的那个**，不是选看起来简单的。",
        "文章要有观点和理由，故事要有转折和高潮。",
      ],
    },
    {
      k: "steps",
      head: "两种体裁的骨架",
      items: [
        { label: "文章", text: "第一段：引出话题 + 你的观点（In my opinion…）→ 第二段：两个理由各带一个例子 → 结尾：重申观点（That's why I think…）。" },
        { label: "故事", text: "第一段：设定人物和场景 → 第二段：出现问题（Suddenly…）→ 第三段：解决或反转（In the end…）。" },
        { label: "共同", text: "用上至少两个高级结构：一个被动、一个条件句或定语从句。" },
      ],
    },
    {
      k: "contrast",
      head: "文章的高分动作",
      rows: [
        { bad: "I think sport is good. Sport is good for health.", good: "I believe sport should be part of every school day, mainly because it helps students stay healthy and concentrate better in class.", why: "观点 + 理由 + 具体效果，才是 B1 的论证。" },
        { bad: "故事：A boy was sad. Then he was happy.", good: "故事：Tom had practised for months, but on the day of the race he fell. Although he didn't win, the crowd still cheered—and that made him want to try again.", why: "有转折 although 才有故事味。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["选更有话说的那个题。", "文章要观点+理由+例子，故事要转折。", "至少塞一个被动或条件句。"],
      next: "去「写作批改」写一篇，看句式是否够 B1",
    },
  ],

  "p-write-templates": [
    {
      k: "teach",
      head: "四样东西让分数上去",
      lines: [
        "B1 写作上 15 分档，靠的不是长难句堆砌，是四样结构各用一次。",
        "被动语态、条件句、定语从句、连接词——每样一次，句式分就稳了。",
        "关键是「用得对」，用错反而扣分。",
      ],
    },
    {
      k: "steps",
      head: "四样结构怎么塞",
      items: [
        { label: "被动", text: "The new library was built last year.（避免总用 people / they 开头）" },
        { label: "条件句", text: "If schools gave less homework, students would have more time to read.（第二条件句是加分项）" },
        { label: "定语从句", text: "I'd like to join a club which meets after school." },
        { label: "连接词", text: "However / Although / Therefore / In addition——每段开头一个，别重复同一个。" },
      ],
    },
    {
      k: "contrast",
      head: "用了 vs 用错",
      rows: [
        { bad: "If I will have time, I will go.", good: "If I have time, I will go.", why: "条件句主将从现，if 从句不用 will。" },
        { bad: "The book who I read was good.", good: "The book which I read was good.", why: "先行词是物用 which/that，不是 who。" },
        { bad: "The homework was did by me.", good: "The homework was done by me.", why: "被动是 be + 过去分词。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["被动、条件句、定语从句、连接词，各用一次。", "主将从现：if 从句不用 will。", "用对才加分，拿不准就用简单句。"],
      next: "去「写作批改」写一篇，看四个结构用对了几个",
    },
  ],

  "p-speak-1": [
    {
      k: "teach",
      head: "Part 1 / 2 问答与看图",
      lines: [
        "Part 1 是个人信息问答；Part 2 是描述一张照片，讲一分钟。",
        "Part 1 还是「一句半」原则，但 B1 要求更长的展开：给理由、给例子、给对比。",
        "Part 2 要能讲满一分钟不冷场——这需要一套描述框架，不是靠临场想。",
      ],
    },
    {
      k: "steps",
      head: "Part 2 描述框架",
      items: [
        { label: "1", text: "整体：This photo shows… / In this picture I can see…" },
        { label: "2", text: "位置：In the foreground / In the background / On the left…" },
        { label: "3", text: "细节：人物在做什么、穿什么、表情如何（looks happy / seems tired）。" },
        { label: "4", text: "推测：They might be… / It looks as if…（这一步最加分）" },
        { label: "5", text: "感受：It reminds me of… / I'd like to be there because…" },
      ],
    },
    {
      k: "contrast",
      head: "一分钟怎么撑满",
      rows: [
        { bad: "There is a man. He is in a park. He has a dog.", good: "In the foreground there's a man walking his dog in the park. He seems relaxed—maybe it's his daily routine. In the background I can see children playing, so it's probably a weekend afternoon.", why: "位置 + 细节 + 推测 + 环境，一分钟轻松讲满。" },
        { bad: "（沉默想词）", good: "Well, let me see… there's a…", why: "填充词能撑住流利度，沉默不能。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["Part 1 一句半：答案 + 理由。", "Part 2 按「整体-位置-细节-推测-感受」讲。", "推测句（might be / looks as if）最加分。"],
      next: "去「口语模考」练一轮问答",
    },
  ],

  "p-speak-3": [
    {
      k: "teach",
      head: "Part 3 搭档讨论",
      lines: [
        "给一个情境和五个选项，你和搭档讨论两分钟，最后一起做决定。",
        "评分核心是**互动质量**：有没有提议、回应、反驳、达成一致。",
        "光自己说满两分钟反而分低——因为没在「讨论」。",
      ],
    },
    {
      k: "steps",
      head: "讨论的四个动作",
      items: [
        { label: "提议", text: "Shall we start with…? / What do you think about…?" },
        { label: "回应", text: "That's a good point, but… / I see what you mean. However…" },
        { label: "反驳", text: "I'm not sure about that, because…" },
        { label: "收口", text: "So shall we go for this one? / OK, let's agree on…" },
      ],
    },
    {
      k: "contrast",
      head: "讨论 vs 各说各的",
      rows: [
        { bad: "A: I like the beach. B: I like the mountains.", good: "A: I'd go for the beach—I love swimming. What about you? B: I prefer the mountains, actually, because it's cooler. But the beach is cheaper, so maybe that's better.", why: "后者有回应、有理由、有让步，最后一起收敛。" },
        { bad: "两分钟一个人讲完", good: "四个来回，每个来回两三句", why: "互动分来自来回，不是总时长。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["提议、回应、反驳、收口，四个动作都要有。", "有来有回比说得多重要。", "最后一定要说出「我们选哪个」。"],
      next: "去「口语模考」跟模型搭档，练来回",
    },
  ],

  "p-speak-4": [
    {
      k: "teach",
      head: "Part 4 延伸讨论",
      lines: [
        "考官就 Part 3 的话题追问观点，比如「你觉得学校该不该教做饭」。",
        "最弱的答案是 yes / no 就完了。",
        "B1 要求：观点 + 理由 + 例子 + （最好）一个让步。",
      ],
    },
    {
      k: "steps",
      head: "观点四步",
      items: [
        { label: "1", text: "表态：Personally, I think… / In my opinion…" },
        { label: "2", text: "理由：mainly because… / the main reason is…" },
        { label: "3", text: "举例：For example, in my school…" },
        { label: "4", text: "让步：I know some people say…, but I still think…（这一步直接拉开档次）" },
      ],
    },
    {
      k: "contrast",
      head: "同一问的两种答法",
      rows: [
        { bad: "Should schools teach cooking? — Yes, I think so.", good: "Yes, I do. Cooking is a basic life skill, and many students eat fast food simply because they can't cook. Of course, some parents say it's their job, but I'd argue schools can reach everyone equally.", why: "表态 + 理由 + 例子 + 让步，四项齐全。" },
        { bad: "Is it better to live in a city? — No.", good: "I'd say it depends. Cities offer more jobs and facilities, but they're expensive and noisy. For a young person I'd choose the city; for a family, maybe not.", why: "会分情况讨论，是 B1 到 B2 的关键跃迁。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["表态 + 理由 + 例子 + 让步。", "「看情况」比一刀切更像成熟表达。", "不要只答一个词。"],
      next: "去「口语模考」练追问环节",
    },
  ],

  "p-sprint-errors": [
    {
      k: "teach",
      head: "错题的三种类型",
      lines: [
        "错题分三类，处理方式完全不同：知识不会（要补规则）、看错题（要改习惯）、时间不够（要练速度）。",
        "混在一起重刷，等于用同一种方式对付三种问题，效率极低。",
        "先分类，再决定练什么。",
      ],
    },
    {
      k: "steps",
      head: "分类练习题",
      items: [
        { label: "知识型", text: "同一个考点连续错三次 → 回到讲义重看规则，做该考点的专项，直到连对 10 题。" },
        { label: "习惯型", text: "会做但看错（漏了 not、选错题号、拼错词）→ 练「做完必回看题干」这一个动作，做 20 题只练这个。" },
        { label: "速度型", text: "会做但来不及 → 限时练，从每题 90 秒压到 60 秒，先保正确率再提速。" },
      ],
    },
    {
      k: "contrast",
      head: "错题本怎么记才有用",
      rows: [
        { bad: "抄一遍题目和正确答案", good: "写一行：我为什么选错", why: "答案书上有，错因只有你自己知道。" },
        { bad: "记 200 道错题", good: "只记同一考点错三次以上的", why: "偶发错误不值得占篇幅。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["错题先分三类：知识、习惯、速度。", "错题本记错因，不记答案。", "同一考点专项练到连对 10 题。"],
      next: "去「语法诊所」按最弱考点刷一轮",
    },
  ],

  "p-sprint-mock": [
    {
      k: "teach",
      head: "PET 模考的节奏",
      lines: [
        "阅读 45 分钟 + 写作 45 分钟 + 听力 30 分钟，一口气考下来接近两小时。",
        "所以模考要练的不只是题，是**两小时的注意力**。",
        "第一次模考大概率会崩在最后 20 分钟——这是正常的，练三次就稳了。",
      ],
    },
    {
      k: "steps",
      head: "模考怎么安排",
      items: [
        { label: "1", text: "按真实顺序：阅读 → 写作 → 听力，中间只休息 5 分钟。" },
        { label: "2", text: "严格计时，阅读到 45 分钟就停笔，哪怕没做完。" },
        { label: "3", text: "写作先花 2 分钟列提纲，别直接下笔。" },
        { label: "4", text: "考完当天不对答案，第二天再对——避免情绪影响判断。" },
        { label: "5", text: "统计三类错误，写下一周的三条行动。" },
      ],
    },
    {
      k: "contrast",
      head: "模考后做什么",
      rows: [
        { bad: "分数低就再做一套", good: "先找出是时间问题还是知识问题", why: "时间问题靠做新卷解决不了。" },
        { bad: "只对答案不统计", good: "按题型统计正确率，找出最弱 Part", why: "Part 级别的问题才有对应练法。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["按真实顺序和真实时长做。", "阅读到点就停，练取舍。", "考后统计到 Part 级别，再定行动。"],
      next: "去「全真模拟卷」按两小时流程走一遍",
    },
  ],

  "p-read-gapped": [
    {
      k: "teach",
      head: "句子插入考什么",
      lines: [
        "一篇长文挖掉五个句子，给你七个候选，选五个填回去（有两个多余）。",
        "官方考的是「语篇衔接」——说人话就是：**这句话跟前后怎么连上的**。",
        "所以答案几乎都能靠三样东西推出来：指代词、连接词、重复词。",
      ],
    },
    {
      k: "steps",
      head: "三步推答案",
      items: [
        { label: "1", text: "先读候选句，圈出里面的人称代词（he / they / this / it）——它必须能在前文找到主人。" },
        { label: "2", text: "再看空前后：空前面是问句，空后面很可能就是回答；空后面有 however，说明空里的内容跟下句相反。" },
        { label: "3", text: "最后用重复词验证：候选句里的名词，通常在前一段出现过。" },
      ],
    },
    {
      k: "breakdown",
      head: "代词是最硬的线索",
      tag: "同源样题 · 阅读 Part 4",
      stem: "前文：My grandfather kept every letter he ever received.\n空：___\n后文：He finally gave them to the city library last year.",
      options: ["They were stored in a wooden box under his bed.", "He never learned to write.", "The library was built in 1930."],
      answer: "They were stored in a wooden box under his bed.",
      steps: [
        { label: "定位", text: "后文 He finally gave them…，them 必须指复数东西——前文的 letters。" },
        { label: "排雷", text: "选项 B 说的是「不会写字」，跟后文给信无关；选项 C 突然跳到图书馆历史，接不上 them。" },
        { label: "定案", text: "选项 A 的 They = letters，且「放在床下」自然引出「后来捐给图书馆」。" },
      ],
    },
    {
      k: "trap",
      head: "两个多余的句子长什么样",
      text: "多余项通常「内容正确但位置不对」——它描述的事在文章里存在，只是不该插在这个空。判断标准只有一条：它跟这个空的前后句连不连得上。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["先找代词的主人，再谈意思。", "连接词（however / therefore / instead）提示方向。", "连不上就是错位，跟内容对不对无关。"],
      next: "去「信息配对」练衔接感，再去模拟卷做整篇",
    },
  ],

  "p-read-cloze": [
    {
      k: "teach",
      head: "Part 5 的四个选项",
      lines: [
        "一段短文挖六个空，每空四选一。四个选项**词性相同、意思接近**，这是刻意的。",
        "它考的不是「这个词什么意思」，而是「这个词跟谁搭配、语气合不合适」。",
        "常考四类：动词搭配、介词搭配、近义词辨析、固定短语。",
      ],
    },
    {
      k: "breakdown",
      head: "近义词辨析",
      tag: "同源样题 · 阅读 Part 5",
      stem: "The council has decided to ___ the old theatre rather than knock it down.",
      options: ["repair", "restore", "rebuild"],
      answer: "restore",
      steps: [
        { label: "定位", text: "rather than knock it down —— 不拆，说明是「修复到原来的样子」。" },
        { label: "排雷", text: "repair 只是修好坏的部分；rebuild 是拆了重建，和 knock down 相反。" },
        { label: "定案", text: "restore 指「修复如旧」，正好对应老剧院的语境。" },
      ],
    },
    {
      k: "contrast",
      head: "三组最容易混的词",
      rows: [
        { bad: "He did a big mistake.", good: "He made a big mistake.", why: "make a mistake 是固定搭配，do 不行。" },
        { bad: "I'm boring in this film.", good: "I'm bored with this film.", why: "-ing 修饰事物，-ed 修饰人的感受。" },
        { bad: "She suggested to go home.", good: "She suggested going home.", why: "suggest 后接动名词，不接 to do。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["四个选项意思接近时，选搭配对的那个。", "先看空后面的名词或介词，再定词。", "-ed / -ing 形容词看「谁有感受」。"],
      next: "去「开放填空」练无选项版本",
    },
  ],

  "p-listen-4": [
    {
      k: "teach",
      head: "Part 4 访谈怎么听",
      lines: [
        "一个人接受采访，六个三选一。语速是听力里最快的，而且会有口音。",
        "考的不是细节数字，是**观点和态度**：他觉得怎么样、为什么这么想。",
        "所以候选答案里常出现同义情绪词：worried ≈ concerned，surprised ≈ didn't expect。",
      ],
    },
    {
      k: "steps",
      head: "听前三件事",
      items: [
        { label: "1", text: "先扫六道题干，认出每道题问的是「事实」还是「看法」。" },
        { label: "2", text: "看到 Why…? 就在心里准备听 because / the reason is。" },
        { label: "3", text: "听到 but / although 立刻提高注意力——转折后面常是真实态度。" },
      ],
    },
    {
      k: "breakdown",
      head: "态度题怎么定位",
      tag: "同源样题 · 听力 Part 4",
      stem: "录音：I was quite nervous before the race, but once it started I actually enjoyed it — I'd do it again next year.\n题干：How did the speaker feel about the race?",
      options: ["Nervous all the way through.", "It was better than expected.", "He would not do it again."],
      answer: "It was better than expected.",
      steps: [
        { label: "定位", text: "before 是紧张，once it started 之后变成享受——时间点变了。" },
        { label: "排雷", text: "A 把「赛前紧张」说成「全程紧张」，恰好反了；C 与 I'd do it again 相反。" },
        { label: "定案", text: "实际体验好于预期 = better than expected。" },
      ],
    },
    {
      k: "trap",
      head: "口音与连读",
      text: "PET 录音里会出现苏格兰、爱尔兰、澳洲口音。考前至少听三种口音各一段——不是练听懂每个词，是练「不慌」。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["访谈题考态度，不考数字。", "but / although 后面是真实观点。", "考前熟悉三种口音，减少第一句就懵。"],
      next: "去「全真模拟卷」做完整听力部分",
    },
  ],

  "p-vocab-work": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "工作与学习类词是 PET 阅读 Part 3 和写作 Part 1（邮件）的主体话题。",
        "写作里最常考的场景：申请、请假、抱怨、约时间——每个场景都有固定的一小撮词。",
        "先把名词（application / interview / deadline）和动词（apply / arrange / attend）配对记。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 1,
      picks: ["application", "interview", "qualification", "salary", "contract", "employer", "employee", "profession", "responsible", "experienced", "organise", "retirement"],
      cefr: "B1", note: "这批词在写作里「用对一个」比「用对十个」值钱，先挑 5 个自己能说顺的。" },
    {
      k: "breakdown",
      head: "邮件题里的词",
      tag: "同源样题 · 写作 Part 1",
      stem: "题目：Write an email to your manager. You cannot attend the meeting on Friday. Say why and suggest another time.",
      options: ["I can't come Friday, sorry.", "I'm afraid I won't be able to attend Friday's meeting as I have a doctor's appointment. Could we move it to Monday morning?"],
      answer: "I'm afraid I won't be able to attend Friday's meeting as I have a doctor's appointment. Could we move it to Monday morning?",
      steps: [
        { label: "定位", text: "题目要求三件事：不能去、说原因、提新时间——三件都要写到。" },
        { label: "排雷", text: "第一版只写了「不能去」，两条要求直接漏掉，内容分先扣一半。" },
        { label: "定案", text: "be able to attend / appointment / move it to 是这一场景的三个关键词组。" },
      ],
    },
    {
      k: "contrast",
      head: "邮件语气的两档",
      rows: [
        { bad: "I want a day off next week.", good: "I'd like to ask for a day off next week, if that's possible.", why: "I'd like to + if that's possible，礼貌度立刻上一档。" },
        { bad: "Send me the form.", good: "Could you possibly send me the form?", why: "Could you possibly… 是 B1 邮件的高分句式。" },
      ],
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["工作类词按场景记，不按字母表记。", "邮件题先数清题目要求了几件事。", "礼貌句式三件套：I'd like to / I'm afraid / Could you possibly。"],
      next: "去「闪卡学词」过一轮职场词",
    },
  ],

  "p-vocab-feelings": [
    {
      k: "teach",
      head: "这组词考在哪",
      lines: [
        "情感与观点词是 B1 和 A2 的分界线：能不能说「我觉得」以及「为什么这么觉得」。",
        "口语 Part 4 的延伸讨论全靠它：I'd say… / It depends… / I'm not sure I agree。",
        "形容词要成对记：excited / exciting、bored / boring、worried / worrying。",
      ],
    },
    { k: "words", head: "高频 12 词", topic: 15,
      picks: ["disappointed", "confident", "anxious", "relieved", "grateful", "embarrassed", "jealous", "proud", "stressful", "look forward to", "annoy", "cheerful"],
      cefr: "B1", note: "自测方法：造一句带 because 的句子，说得出来才算会。" },
    {
      k: "breakdown",
      head: "观点题怎么答才够 B1",
      tag: "同源样题 · 口语 Part 4",
      stem: "考官：Do you think students should wear uniforms?",
      options: ["Yes, I think so.", "Yes — uniforms save time in the morning, though I know some students say they're boring."],
      answer: "Yes — uniforms save time in the morning, though I know some students say they're boring.",
      steps: [
        { label: "定位", text: "B1 要求：表态 + 理由，最好再加一句让步。" },
        { label: "排雷", text: "只答 Yes, I think so 会被判「无法展开」，分数直接压在 A2。" },
        { label: "定案", text: "though I know… 这一句是加分点，说明你能站在对方角度想。" },
      ],
    },
    {
      k: "trap",
      head: "-ed 和 -ing 别弄反",
      text: "I'm boring = 我是个无聊的人。要说「我觉得无聊」是 I'm bored。这条错在口语里非常刺耳，考官会直接记住。",
    },
    {
      k: "recap",
      head: "这节课记住三件事",
      points: ["态度题必须给理由，一句表态拿不到 B1。", "加一句让步（though / I know some people…）立刻显水平。", "-ed 说人，-ing 说事。"],
      next: "去「口语模考」练 Part 4 延伸讨论",
    },
  ],
};

// ------------------------------------------------------------ 对外接口

/** 取一节课的讲义。技能课查表，语法课自动装配，都没有时给一页兜底。 */
export function deckFor(lessonId: string, level: "A2" | "B1"): Deck | null {
  const lesson = allLessons(level).find((l) => l.id === lessonId);
  if (!lesson) return null;

  const hand = SKILL_DECKS[lessonId];
  if (hand) return { lesson, slides: hand };

  if (lesson.points && lesson.points.length) {
    const slides = grammarSlides(lesson.points);
    if (slides.length) return { lesson, slides };
  }

  // 兜底：只有一张导语 + 回顾，保证任何课时都能打开。
  return {
    lesson,
    slides: [
      { k: "teach", head: lesson.title, lines: [lesson.brief] },
      {
        k: "recap",
        head: "这节课怎么上",
        points: [lesson.brief, "讲义正在补充，先把配套练习做一轮，边做边总结规律。"],
        next: lesson.drills.length ? `去做「${DRILL_LABEL[lesson.drills[0] as DrillKind]}」` : "回到教室继续",
      },
    ],
  };
}

const SKILL_DECKS: Record<string, DeckSlide[]> = {
  ...KET_SKILL,
  ...PET_SKILL,
};
