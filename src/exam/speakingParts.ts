/**
 * PET Speaking Part 3（协作任务）+ Part 4（延伸讨论）题库。
 *
 * Part 3 真题是：给考生一张图，上面有 5 个选项，两人要讨论并做出决定。
 * 这里把「和一个真人搭档讨论」换成本地模型扮演搭档，照样能练
 * 「提出看法 → 回应对方 → 一起做决定」这条能力链。
 */

export interface Part3Task {
  id: string;
  /** 情境描述（英文，直接给孩子看/听）。 */
  situation: string;
  zh: string;
  /** 5 个待选项。 */
  options: { en: string; zh: string }[];
  /** Part 3 结束时必须做出的决定。 */
  decision: string;
  /** Part 4 延伸问题。 */
  followUps: { q: string; zh: string }[];
}

export const PART3_TASKS: Part3Task[] = [
  {
    id: "gift",
    situation: "Your English friend Sam's birthday is next week. Here are some presents you could give him. Talk together and choose ONE.",
    zh: "你的英国朋友 Sam 下周生日。这里有几种礼物可以送他。一起讨论，选出一种。",
    options: [
      { en: "a book", zh: "一本书" },
      { en: "headphones", zh: "耳机" },
      { en: "a football", zh: "一个足球" },
      { en: "cinema tickets", zh: "电影票" },
      { en: "a box of chocolates", zh: "一盒巧克力" },
    ],
    decision: "Choose the best present for Sam.",
    followUps: [
      { q: "Do you like giving presents to your friends? Why?", zh: "你喜欢送朋友礼物吗？为什么？" },
      { q: "Is an expensive present always a better present?", zh: "贵的礼物就一定更好吗？" },
      { q: "What's the best present you have ever received?", zh: "你收到过最好的礼物是什么？" },
    ],
  },
  {
    id: "weekend",
    situation: "You and a friend have one free day at the weekend. Here are some things you could do. Talk together and choose ONE.",
    zh: "你和朋友周末有一天空闲。这里有几种安排。一起讨论，选出一种。",
    options: [
      { en: "a picnic in the park", zh: "公园野餐" },
      { en: "going to the cinema", zh: "看电影" },
      { en: "visiting a museum", zh: "参观博物馆" },
      { en: "playing basketball", zh: "打篮球" },
      { en: "staying at home and relaxing", zh: "待在家休息" },
    ],
    decision: "Choose the best way to spend the free day.",
    followUps: [
      { q: "How do you usually spend your weekends?", zh: "你周末通常怎么过？" },
      { q: "Do you prefer staying at home or going out? Why?", zh: "你更喜欢待在家还是出门？为什么？" },
      { q: "Is it important to have free time? Why?", zh: "有空闲时间重要吗？为什么？" },
    ],
  },
  {
    id: "trip",
    situation: "Your class is going on a school trip next month. Here are some places you could visit. Talk together and choose ONE.",
    zh: "你们班下个月要去学校旅行。这里有几个地方。一起讨论，选出一个。",
    options: [
      { en: "a farm", zh: "农场" },
      { en: "a science museum", zh: "科技馆" },
      { en: "the beach", zh: "海边" },
      { en: "an old town", zh: "古镇" },
      { en: "a zoo", zh: "动物园" },
    ],
    decision: "Choose the best place for the school trip.",
    followUps: [
      { q: "Do you enjoy school trips? Why?", zh: "你喜欢学校旅行吗？为什么？" },
      { q: "Which is better to visit: a museum or a park?", zh: "参观博物馆和公园，哪个更好？" },
      { q: "What do you usually learn from travelling?", zh: "你通常从旅行中学到什么？" },
    ],
  },
  {
    id: "club",
    situation: "Your school wants to start an English club. Here are some activities it could do. Talk together and choose ONE to start with.",
    zh: "你们学校想办一个英语俱乐部。这里有几种活动。一起讨论，选出先做哪一种。",
    options: [
      { en: "watching English films", zh: "看英文电影" },
      { en: "an English corner", zh: "英语角" },
      { en: "singing English songs", zh: "唱英文歌" },
      { en: "a reading group", zh: "读书会" },
      { en: "acting in short plays", zh: "演短剧" },
    ],
    decision: "Choose the best activity to start the club with.",
    followUps: [
      { q: "Are school clubs useful? Why?", zh: "学校社团有用吗？为什么？" },
      { q: "What clubs would you like to join?", zh: "你想参加什么社团？" },
      { q: "Do you think learning English can be fun?", zh: "你觉得学英语可以很有趣吗？" },
    ],
  },
  {
    id: "welcome",
    situation: "A new student is joining your class tomorrow. Here are some things you could do for them. Talk together and choose ONE.",
    zh: "明天有一位新同学要加入你们班。这里有几件可以为他做的事。一起讨论，选出一件。",
    options: [
      { en: "making a welcome card", zh: "做欢迎卡片" },
      { en: "showing them around the school", zh: "带他参观校园" },
      { en: "having lunch together", zh: "一起吃午饭" },
      { en: "giving a small gift", zh: "送一份小礼物" },
      { en: "having a class party", zh: "办班级派对" },
    ],
    decision: "Choose the best way to welcome the new student.",
    followUps: [
      { q: "Is it easy or difficult to make new friends? Why?", zh: "交新朋友容易还是难？为什么？" },
      { q: "What makes a good classmate?", zh: "什么样的同学算好同学？" },
      { q: "Have you ever been new to a school? How did you feel?", zh: "你有过转学的经历吗？感觉如何？" },
    ],
  },
  {
    id: "project",
    situation: "Your teacher has asked you to make a class project about the environment. Here are some ideas. Talk together and choose ONE.",
    zh: "老师让你们做一个关于环境的班级项目。这里有几个想法。一起讨论，选出一个。",
    options: [
      { en: "a poster about saving water", zh: "节约用水海报" },
      { en: "a class clean-up day", zh: "班级清洁日" },
      { en: "a video about recycling", zh: "回收主题视频" },
      { en: "planting trees near the school", zh: "在校园旁种树" },
      { en: "a talk by an expert", zh: "请专家来做讲座" },
    ],
    decision: "Choose the best project about the environment.",
    followUps: [
      { q: "Do you think young people can help the environment?", zh: "你觉得年轻人能帮到环境吗？" },
      { q: "What do you do to protect the environment?", zh: "你为保护环境做过什么？" },
      { q: "Should schools teach more about the environment?", zh: "学校应该多教环境知识吗？" },
    ],
  },
];

/** Part 3 建议用时（秒），与真实考试接近。 */
export const PART3_SECONDS = 180;
/** Part 4 每题建议用时（秒）。 */
export const PART4_SECONDS = 60;

/**
 * A2（KET）口语陪练任务。
 *
 * KET 真实口语是 Part 1 考官问答 + Part 2 看图讨论，没有 Part 3/4。
 * 这里不硬套 PET 的 Part 编号，而是借同一种「搭档商量 → 考官追问」的形式，
 * 用 A2 的话题和词汇练基础问答与简单描述——形式一样，难度降下来。
 */
export const KET_TASKS: Part3Task[] = [
  {
    id: "a2-party",
    situation: "Your class is having a party. Here are some things you can bring. Talk together and choose TWO.",
    zh: "你们班要开派对。这里有几样东西可以带。一起商量，选两样。",
    options: [
      { en: "some fruit", zh: "一些水果" },
      { en: "some juice", zh: "一些果汁" },
      { en: "a cake", zh: "一个蛋糕" },
      { en: "some music", zh: "一些音乐" },
    ],
    decision: "Choose two things to bring to the party.",
    followUps: [
      { q: "Do you like class parties? Why?", zh: "你喜欢班级派对吗？为什么？" },
      { q: "What do you usually eat at a party?", zh: "你在派对上通常吃什么？" },
    ],
  },
  {
    id: "a2-saturday",
    situation: "It is Saturday. You and your friend have nothing to do. Talk together and choose ONE thing to do.",
    zh: "今天是星期六。你和朋友没事做。一起商量，选一件事做。",
    options: [
      { en: "go to the park", zh: "去公园" },
      { en: "watch a film at home", zh: "在家看电影" },
      { en: "go shopping", zh: "去购物" },
      { en: "play games", zh: "玩游戏" },
    ],
    decision: "Choose one thing to do on Saturday.",
    followUps: [
      { q: "What do you usually do on Saturday?", zh: "你星期六通常做什么？" },
      { q: "Do you like going out with your friends?", zh: "你喜欢和朋友出去玩吗？" },
    ],
  },
  {
    id: "a2-gift",
    situation: "It is your mother's birthday. Here are some presents you can buy. Talk together and choose ONE.",
    zh: "今天是妈妈的生日。这里有几样礼物可以买。一起商量，选一样。",
    options: [
      { en: "some flowers", zh: "一些花" },
      { en: "a book", zh: "一本书" },
      { en: "a new bag", zh: "一个新包" },
      { en: "a nice dinner", zh: "一顿好吃的晚饭" },
    ],
    decision: "Choose the best present for your mother.",
    followUps: [
      { q: "What do you usually give your family for their birthday?", zh: "家人过生日你通常送什么？" },
      { q: "Is a card important? Why?", zh: "贺卡重要吗？为什么？" },
    ],
  },
  {
    id: "a2-newstudent",
    situation: "A new student is coming to your class. Here are some things you can do for him. Talk together and choose TWO.",
    zh: "有位新同学要来你们班。这里有几件事可以为他做。一起商量，选两件。",
    options: [
      { en: "show him the school", zh: "带他参观学校" },
      { en: "sit with him at lunch", zh: "午饭时和他坐一起" },
      { en: "help him with English", zh: "帮他学英语" },
      { en: "introduce him to your friends", zh: "把他介绍给你的朋友" },
    ],
    decision: "Choose two things to do for the new student.",
    followUps: [
      { q: "How do you feel on your first day at a new school?", zh: "到新学校第一天你感觉怎么样？" },
      { q: "What makes a good classmate?", zh: "什么样的同学是好同学？" },
    ],
  },
];
