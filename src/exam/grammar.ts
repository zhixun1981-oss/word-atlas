/**
 * 语法考点题库。每条题用 `point` 关联到 `syllabus.ts` 里的考点 id。
 *
 * `q` 里用 `___` 表示空格。options 为空时表示开放式输入（自己写词）。
 */
export interface GrammarDrill {
  id: string;
  /** 关联 `syllabus.ts` 的考点 id。 */
  point: string;
  /** 题干，`___` 表示空格。 */
  q: string;
  /** 选项；为空数组表示开放式输入。 */
  options: string[];
  answer: string;
  /** 部分题有多个答案，用 ` / ` 分隔（如 "a / The"）。 */
  zh: string;
  why: string;
}

export const GRAMMAR_DRILLS: GrammarDrill[] = [
  // ---------- present-simple ----------
  { id: "ps1", point: "present-simple", q: "She ___ to school by bus every day.", options: ["go", "goes", "going", "gone"], answer: "goes", zh: "她每天坐公交上学。", why: "主语 she 是第三人称单数，一般现在时动词加 -es（go → goes）。" },
  { id: "ps2", point: "present-simple", q: "My brothers ___ like spicy food.", options: ["don't", "doesn't", "aren't", "not"], answer: "don't", zh: "我兄弟们不喜欢辣的食物。", why: "主语 brothers 是复数，否定用 don't；只有三单才用 doesn't。" },
  { id: "ps3", point: "present-simple", q: "___ your sister play the piano?", options: ["Do", "Does", "Is", "Are"], answer: "Does", zh: "你姐姐弹钢琴吗？", why: "第三人称单数的一般疑问句用 Does 开头，后面的动词用原形。" },
  { id: "ps4", point: "present-simple", q: "He ___ his teeth twice a day.", options: ["brush", "brushes", "brushing", "brushs"], answer: "brushes", zh: "他每天刷两次牙。", why: "以 -sh 结尾的动词，三单加 -es（brush → brushes），不是 brushs。" },
  { id: "ps5", point: "present-simple", q: "The shop ___ at eight o'clock in the morning.", options: ["open", "opens", "opening", "is open"], answer: "opens", zh: "商店早上八点开门。", why: "常态事实，第三人称单数 opens。" },
  { id: "ps6", point: "present-simple", q: "They don't ___ TV before school.", options: ["watch", "watches", "watching", "watched"], answer: "watch", zh: "他们上学前不看电视。", why: "don't / doesn't 后面必须接动词原形。" },

  // ---------- present-continuous ----------
  { id: "pc1", point: "present-continuous", q: "Look! It ___ outside.", options: ["snows", "is snowing", "snowed", "snow"], answer: "is snowing", zh: "看！外面在下雪。", why: "Look! 提示此刻正在发生，用现在进行时 is + -ing。" },
  { id: "pc2", point: "present-continuous", q: "What ___ you doing right now?", options: ["do", "are", "is", "were"], answer: "are", zh: "你现在在做什么？", why: "现在进行时结构是 am/is/are + -ing，主语 you 配 are。" },
  { id: "pc3", point: "present-continuous", q: "I ___ with my aunt this week.", options: ["stay", "am staying", "stays", "stayed"], answer: "am staying", zh: "这周我住在姑姑家。", why: "this week 表示近期暂时的安排，用现在进行时。" },
  { id: "pc4", point: "present-continuous", q: "Be quiet — the baby ___.", options: ["sleeps", "is sleeping", "slept", "sleep"], answer: "is sleeping", zh: "安静点，宝宝在睡觉。", why: "说话此刻正在进行的动作，用现在进行时。" },
  { id: "pc5", point: "present-continuous", q: "Which sentence is NOT natural?", options: ["I am knowing the answer.", "She is reading a book.", "They are playing football.", "He is wearing a coat."], answer: "I am knowing the answer.", zh: "哪一句不自然？", why: "know 是状态动词，一般不用进行时，应该说 I know the answer." },
  { id: "pc6", point: "present-continuous", q: "We ___ for the bus at the moment.", options: ["wait", "waits", "are waiting", "waited"], answer: "are waiting", zh: "我们这会儿正在等公交。", why: "at the moment 是现在进行时的标志词。" },

  // ---------- past-simple ----------
  { id: "pt1", point: "past-simple", q: "We ___ the museum last Sunday.", options: ["visit", "visited", "visiting", "have visited"], answer: "visited", zh: "上周日我们参观了博物馆。", why: "last Sunday 是明确的过去时间，用一般过去时。" },
  { id: "pt2", point: "past-simple", q: "I didn't ___ him at the party.", options: ["saw", "see", "seen", "seeing"], answer: "see", zh: "我在聚会上没看到他。", why: "didn't 后面必须接动词原形。" },
  { id: "pt3", point: "past-simple", q: "She ___ a new bike for her birthday.", options: ["buyed", "bought", "buys", "buying"], answer: "bought", zh: "她生日买了一辆新自行车。", why: "buy 是不规则动词，过去式是 bought，不能加 -ed。" },
  { id: "pt4", point: "past-simple", q: "___ you finish your homework yesterday?", options: ["Do", "Does", "Did", "Were"], answer: "Did", zh: "你昨天做完作业了吗？", why: "一般过去时的疑问句用 Did 开头，后面动词用原形。" },
  { id: "pt5", point: "past-simple", q: "They ___ to the cinema two days ago.", options: ["go", "goes", "went", "gone"], answer: "went", zh: "他们两天前去看电影了。", why: "go 是不规则动词，过去式 went；ago 提示一般过去时。" },
  { id: "pt6", point: "past-simple", q: "He ___ his keys on the kitchen table.", options: ["leave", "left", "leaved", "leaving"], answer: "left", zh: "他把钥匙落在厨房桌上了。", why: "leave 是不规则动词，过去式 left，不是 leaved。" },

  // ---------- past-continuous ----------
  { id: "pct1", point: "past-continuous", q: "I ___ when the phone rang.", options: ["read", "was reading", "am reading", "reads"], answer: "was reading", zh: "电话响的时候我正在看书。", why: "过去某时刻正在做的长动作，用过去进行时 was + -ing。" },
  { id: "pct2", point: "past-continuous", q: "At eight o'clock she ___ dinner.", options: ["had", "was having", "has", "is having"], answer: "was having", zh: "八点时她正在吃晚饭。", why: "过去的具体时刻正在进行，用过去进行时。" },
  { id: "pct3", point: "past-continuous", q: "They ___ in the garden all afternoon.", options: ["play", "played", "were playing", "are playing"], answer: "were playing", zh: "他们整个下午都在花园里玩。", why: "过去持续进行的动作，复数主语配 were + -ing。" },
  { id: "pct4", point: "past-continuous", q: "While I ___ home, I met my old teacher.", options: ["walk", "walked", "was walking", "am walking"], answer: "was walking", zh: "我走路回家时遇到了以前的老师。", why: "while 引导的背景动作用过去进行时。" },
  { id: "pct5", point: "past-continuous", q: "Which is correct?", options: ["I was reading when the phone was ringing.", "I was reading when the phone rang.", "I read when the phone was ringing.", "I were reading when the phone rang."], answer: "I was reading when the phone rang.", zh: "哪一句正确？", why: "长动作（读书）用进行时，打断它的短动作（响铃）用一般过去时。" },
  { id: "pct6", point: "past-continuous", q: "It ___ all night yesterday.", options: ["rains", "rained", "was raining", "is raining"], answer: "was raining", zh: "昨天整晚都在下雨。", why: "强调过去持续进行的过程，用过去进行时。" },

  // ---------- future-forms ----------
  { id: "fu1", point: "future-forms", q: "I think it ___ tomorrow.", options: ["rains", "will rain", "rained", "is rain"], answer: "will rain", zh: "我觉得明天会下雨。", why: "I think 后的预测用 will + 动词原形。" },
  { id: "fu2", point: "future-forms", q: "We ___ visit Beijing in July — we've booked the tickets.", options: ["will", "are going to", "went", "go"], answer: "are going to", zh: "我们打算七月去北京，票都订好了。", why: "已有计划（票都买了）用 be going to。" },
  { id: "fu3", point: "future-forms", q: "I ___ my teacher at 5 pm. It's in my diary.", options: ["meet", "am meeting", "will meeting", "met"], answer: "am meeting", zh: "我五点和老师见面，日程本上写着。", why: "已约定的安排可用现在进行时表将来。" },
  { id: "fu4", point: "future-forms", q: "That's the doorbell — I ___ it.", options: ["open", "am opening", "will open", "opened"], answer: "will open", zh: "门铃响了，我去开。", why: "说话当下才做的临时决定，只能用 will。" },
  { id: "fu5", point: "future-forms", q: "Look at those clouds! It ___ rain in a minute.", options: ["will", "is going to", "shall", "rains"], answer: "is going to", zh: "看那些云！马上要下雨了。", why: "有迹象表明即将发生，用 be going to。" },
  { id: "fu6", point: "future-forms", q: "She ___ be twelve next month.", options: ["will", "is going to", "shall", "is"], answer: "will", zh: "她下个月就十二岁了。", why: "单纯的未来事实（年龄、日期）用 will。" },

  // ---------- modal-verbs ----------
  { id: "mv1", point: "modal-verbs", q: "You ___ wear a helmet when you ride a bike.", options: ["must", "must to", "musts", "musting"], answer: "must", zh: "骑车时必须戴头盔。", why: "情态动词后直接接动词原形，不加 to，也没有人称变化。" },
  { id: "mv2", point: "modal-verbs", q: "She ___ help her mum every evening.", options: ["have to", "has to", "must to", "having to"], answer: "has to", zh: "她每天晚上都得帮妈妈。", why: "have to 有第三人称变化：she has to。" },
  { id: "mv3", point: "modal-verbs", q: "You ___ smoke here — it's forbidden.", options: ["don't have to", "mustn't", "mustn't to", "haven't to"], answer: "mustn't", zh: "这里禁止吸烟。", why: "mustn't = 禁止；don't have to = 不必，意思完全不同。" },
  { id: "mv4", point: "modal-verbs", q: "You ___ come if you're busy. It's optional.", options: ["mustn't", "don't have to", "must", "shouldn't"], answer: "don't have to", zh: "你忙的话就不用来了，不是必须的。", why: "optional 表示不是必须，用 don't have to（不必），不能用 mustn't（禁止）。" },
  { id: "mv5", point: "modal-verbs", q: "You ___ eat so much sugar. It's bad for you.", options: ["shouldn't", "shouldn't to", "don't should", "not should"], answer: "shouldn't", zh: "你不该吃那么多糖。", why: "建议不该做某事用 shouldn't + 原形。" },
  { id: "mv6", point: "modal-verbs", q: "___ I borrow your pen, please?", options: ["Must", "Should", "Could", "Need"], answer: "Could", zh: "我能借一下你的笔吗？", why: "礼貌请求用 Could I…? / Can I…?" },

  // ---------- comparative ----------
  { id: "cp1", point: "comparative", q: "This bag is ___ than that one.", options: ["cheap", "cheaper", "cheapest", "more cheap"], answer: "cheaper", zh: "这个包比那个便宜。", why: "than 提示比较级；cheap 是短词，直接加 -er。" },
  { id: "cp2", point: "comparative", q: "She is ___ girl in our class.", options: ["the tallest", "the taller", "tallest", "most tall"], answer: "the tallest", zh: "她是我们班最高的女生。", why: "三者以上比较用最高级，前面要加 the。" },
  { id: "cp3", point: "comparative", q: "Maths is ___ than English for me.", options: ["difficult", "more difficult", "difficulter", "most difficult"], answer: "more difficult", zh: "对我来说数学比英语难。", why: "difficult 是长词，比较级用 more + 原级。" },
  { id: "cp4", point: "comparative", q: "This is ___ film I've ever seen.", options: ["the best", "the better", "best", "the goodest"], answer: "the best", zh: "这是我看过最好的电影。", why: "good 的比较级最高级不规则：better / best。" },
  { id: "cp5", point: "comparative", q: "Which is wrong?", options: ["more cheaper", "more expensive", "bigger", "the worst"], answer: "more cheaper", zh: "哪一个是错的？", why: "-er 和 more 不能叠用，cheap 的比较级就是 cheaper。" },
  { id: "cp6", point: "comparative", q: "My bag is ___ yours.", options: ["heavy than", "heavier than", "more heavy than", "heaviest than"], answer: "heavier than", zh: "我的包比你的重。", why: "辅音+y 结尾变 y 为 i 加 -er：heavy → heavier，然后接 than。" },

  // ---------- articles ----------
  { id: "ar1", point: "articles", q: "I saw ___ dog in the street. ___ dog was black.", options: ["a / The", "the / A", "a / A", "the / The"], answer: "a / The", zh: "我在街上看到一只狗，那只狗是黑色的。", why: "第一次提到用 a，再次提到（已特指）用 the。" },
  { id: "ar2", point: "articles", q: "She is ___ engineer.", options: ["a", "an", "the", "—"], answer: "an", zh: "她是一名工程师。", why: "engineer 以元音开头，用 an。" },
  { id: "ar3", point: "articles", q: "We waited for ___ hour.", options: ["a", "an", "the", "—"], answer: "an", zh: "我们等了一个小时。", why: "hour 的 h 不发音，开头是元音 /aʊ/，所以用 an。" },
  { id: "ar4", point: "articles", q: "He studies at ___ university in Beijing.", options: ["a", "an", "the", "—"], answer: "a", zh: "他在北京的一所大学读书。", why: "university 开头发音是 /juː/（辅音），所以用 a —— 看发音不看字母。" },
  { id: "ar5", point: "articles", q: "I like ___ music and ___ books.", options: ["the / the", "— / —", "a / a", "the / —"], answer: "— / —", zh: "我喜欢音乐和书。", why: "泛指的不可数名词和复数名词前不加冠词。" },
  { id: "ar6", point: "articles", q: "___ sun is very hot today.", options: ["A", "An", "The", "—"], answer: "The", zh: "今天太阳很晒。", why: "独一无二的事物（太阳、月亮、地球）前用 the。" },

  // ---------- prepositions ----------
  { id: "pp1", point: "prepositions", q: "The lesson starts ___ nine o'clock.", options: ["in", "on", "at", "for"], answer: "at", zh: "课九点开始。", why: "具体时刻用 at。" },
  { id: "pp2", point: "prepositions", q: "We have a test ___ Friday.", options: ["in", "on", "at", "of"], answer: "on", zh: "我们周五有测验。", why: "星期几用 on。" },
  { id: "pp3", point: "prepositions", q: "My birthday is ___ October.", options: ["in", "on", "at", "by"], answer: "in", zh: "我的生日在十月。", why: "月份用 in。" },
  { id: "pp4", point: "prepositions", q: "I usually get up early ___ the morning.", options: ["in", "on", "at", "during"], answer: "in", zh: "我通常早上起得早。", why: "in the morning 是固定搭配。" },
  { id: "pp5", point: "prepositions", q: "See you ___ Monday morning!", options: ["in", "on", "at", "for"], answer: "on", zh: "周一早上见！", why: "具体到某天的早上用 on：on Monday morning（但 in the morning）。" },
  { id: "pp6", point: "prepositions", q: "We arrived ___ the airport an hour early.", options: ["in", "on", "at", "to"], answer: "at", zh: "我们提前一小时到了机场。", why: "arrive at + 小地点（机场/车站），arrive in + 城市/国家。" },
  { id: "pp7", point: "prepositions", q: "The book is ___ the table.", options: ["in", "on", "at", "of"], answer: "on", zh: "书在桌子上。", why: "在表面之上用 on。" },

  // ---------- pronouns ----------
  { id: "pr1", point: "pronouns", q: "This pen isn't ___. It's hers.", options: ["my", "mine", "me", "myself"], answer: "mine", zh: "这支笔不是我的，是她的。", why: "后面不接名词，用名词性物主代词 mine（my 后面必须接名词）。" },
  { id: "pr2", point: "pronouns", q: "Can you help ___ with this bag?", options: ["I", "my", "me", "mine"], answer: "me", zh: "你能帮我拿一下这个包吗？", why: "作动词宾语用宾格 me。" },
  { id: "pr3", point: "pronouns", q: "He taught ___ to play the guitar.", options: ["him", "his", "himself", "he"], answer: "himself", zh: "他自学弹吉他。", why: "主语和宾语是同一个人，用反身代词 himself。" },
  { id: "pr4", point: "pronouns", q: "The cat licked ___ paws.", options: ["it's", "its", "his", "her"], answer: "its", zh: "猫舔了舔它的爪子。", why: "its 是「它的」；it's = it is，意思完全不同。" },
  { id: "pr5", point: "pronouns", q: "___ and my brother go to the same school.", options: ["Me", "I", "Mine", "Myself"], answer: "I", zh: "我和我哥哥上同一所学校。", why: "作主语用主格 I。" },
  { id: "pr6", point: "pronouns", q: "Help ___ to some cake, everyone!", options: ["you", "your", "yours", "yourselves"], answer: "yourselves", zh: "大家随便吃点蛋糕！", why: "help oneself 是固定用法；对多人说用 yourselves。" },

  // ---------- quantifiers ----------
  { id: "qt1", point: "quantifiers", q: "There isn't ___ milk in the fridge.", options: ["some", "any", "a", "many"], answer: "any", zh: "冰箱里没有牛奶了。", why: "否定句用 any（肯定句才用 some）。" },
  { id: "qt2", point: "quantifiers", q: "How ___ students are in your class?", options: ["much", "many", "long", "often"], answer: "many", zh: "你们班有多少学生？", why: "students 是可数名词复数，用 many。" },
  { id: "qt3", point: "quantifiers", q: "We don't have ___ time before the train leaves.", options: ["many", "much", "some", "few"], answer: "much", zh: "火车开之前我们没多少时间了。", why: "time 是不可数名词，用 much。" },
  { id: "qt4", point: "quantifiers", q: "Would you like ___ tea?", options: ["any", "some", "many", "a lot"], answer: "some", zh: "要喝点茶吗？", why: "提议和请求里用 some（期待肯定回答），这是特殊情况。" },
  { id: "qt5", point: "quantifiers", q: "There are ___ of people at the market today.", options: ["much", "a lot", "many", "lot"], answer: "a lot", zh: "今天市场上有好多人。", why: "a lot of 既可接可数也可接不可数。" },
  { id: "qt6", point: "quantifiers", q: "I have ___ friends in this city.", options: ["a little", "a few", "much", "little"], answer: "a few", zh: "我在这座城市有几个朋友。", why: "friends 可数，肯定含义用 a few（a little 配不可数）。" },

  // ---------- there-is ----------
  { id: "ti1", point: "there-is", q: "___ three parks near my house.", options: ["There is", "There are", "There have", "It is"], answer: "There are", zh: "我家附近有三个公园。", why: "后面是复数 parks，用 There are。" },
  { id: "ti2", point: "there-is", q: "There isn't ___ sugar left.", options: ["some", "any", "a", "many"], answer: "any", zh: "糖一点都没剩。", why: "否定句用 any；sugar 不可数。" },
  { id: "ti3", point: "there-is", q: "___ a cinema in this town?", options: ["Is there", "Are there", "There is", "Has there"], answer: "Is there", zh: "这个镇上有电影院吗？", why: "单数 a cinema，疑问句把 is 提前：Is there…?" },
  { id: "ti4", point: "there-is", q: "There ___ a book and two pens on the desk.", options: ["is", "are", "have", "be"], answer: "is", zh: "桌上有一本书和两支笔。", why: "并列主语时看最近的那个（就近原则），a book 是单数，用 is。" },
  { id: "ti5", point: "there-is", q: "Which is wrong?", options: ["There have many cars.", "There are many cars.", "There is a car.", "Are there any cars?"], answer: "There have many cars.", zh: "哪一句是错的？", why: "表示「存在」永远用 There is / There are，不能用 There have。" },

  // ---------- adverbs-frequency ----------
  { id: "af1", point: "adverbs-frequency", q: "She ___ eats breakfast before seven.", options: ["never", "ever", "no", "doesn't never"], answer: "never", zh: "她七点前从不吃早饭。", why: "never 本身是否定，不能再用 doesn't。" },
  { id: "af2", point: "adverbs-frequency", q: "Tom ___ late for school.", options: ["is always", "always is", "always be", "be always"], answer: "is always", zh: "汤姆上学总是迟到。", why: "频率副词放在 be 动词之后。" },
  { id: "af3", point: "adverbs-frequency", q: "We ___ go swimming at weekends.", options: ["sometimes", "some times", "sometime", "some time"], answer: "sometimes", zh: "我们周末有时去游泳。", why: "sometimes（有时）是一个词；some times 是「几次」，意思不同。" },
  { id: "af4", point: "adverbs-frequency", q: "I ___ walk to school. It's only five minutes.", options: ["usually", "never", "rarely no", "am usually"], answer: "usually", zh: "我通常走路去学校，只有五分钟。", why: "频率副词放在实义动词之前。" },
  { id: "af5", point: "adverbs-frequency", q: "Have you ___ tried sushi?", options: ["ever", "never", "always", "often"], answer: "ever", zh: "你吃过寿司吗？", why: "ever 用于疑问句表示「曾经」。" },

  // ---------- to-do-or-ing ----------
  { id: "ti6", point: "to-do-or-ing", q: "I want ___ Spanish.", options: ["learn", "learning", "to learn", "learned"], answer: "to learn", zh: "我想学西班牙语。", why: "want 后接 to + 动词原形。" },
  { id: "ti7", point: "to-do-or-ing", q: "She enjoys ___ in the garden.", options: ["read", "to read", "reading", "reads"], answer: "reading", zh: "她喜欢在花园里看书。", why: "enjoy 后接 -ing。" },
  { id: "ti8", point: "to-do-or-ing", q: "He finished ___ his homework at nine.", options: ["do", "to do", "doing", "did"], answer: "doing", zh: "他九点做完了作业。", why: "finish 后接 -ing。" },
  { id: "ti9", point: "to-do-or-ing", q: "I'm good at ___.", options: ["draw", "to draw", "drawing", "drew"], answer: "drawing", zh: "我擅长画画。", why: "介词 at 后面一律接 -ing。" },
  { id: "tia", point: "to-do-or-ing", q: "We decided ___ for the exam together.", options: ["study", "studying", "to study", "studied"], answer: "to study", zh: "我们决定一起复习备考。", why: "decide 后接 to + 原形。" },
  { id: "tib", point: "to-do-or-ing", q: "I'm interested in ___ more about space.", options: ["learn", "to learn", "learning", "learns"], answer: "learning", zh: "我对了解更多太空知识感兴趣。", why: "interested in 后面接 -ing。" },

  // ---------- questions ----------
  { id: "qs1", point: "questions", q: "Where ___ your sister work?", options: ["do", "does", "is", "are"], answer: "does", zh: "你姐姐在哪儿工作？", why: "三单主语用 does，后面动词用原形 work。" },
  { id: "qs2", point: "questions", q: "Who ___ the window?", options: ["did break", "broke", "breaks", "was break"], answer: "broke", zh: "谁打破了窗户？", why: "who 本身是主语时按陈述语序，不加 did。" },
  { id: "qs3", point: "questions", q: "Do you know where ___?", options: ["is the station", "the station is", "the station", "does the station"], answer: "the station is", zh: "你知道车站在哪儿吗？", why: "宾语从句用陈述语序，不倒装。" },
  { id: "qs4", point: "questions", q: "How ___ do you visit your grandparents?", options: ["long", "often", "much", "many"], answer: "often", zh: "你多久去看一次爷爷奶奶？", why: "问频率用 how often。" },
  { id: "qs5", point: "questions", q: "___ did you do that for?", options: ["Why", "What", "How", "When"], answer: "What", zh: "你为什么那么做？", why: "What…for? = Why?；介词 for 结尾时用 What。" },
  { id: "qs6", point: "questions", q: "___ you like to come with us?", options: ["Do", "Would", "Are", "Will"], answer: "Would", zh: "你想和我们一起去吗？", why: "礼貌邀请用 Would you like…?" },

  // ---------- conjunctions ----------
  { id: "cj1", point: "conjunctions", q: "I stayed at home ___ it was raining.", options: ["so", "because", "but", "although"], answer: "because", zh: "因为下雨，我待在家里。", why: "because 引出原因。" },
  { id: "cj2", point: "conjunctions", q: "It was raining, ___ we took a taxi.", options: ["because", "so", "but", "or"], answer: "so", zh: "下雨了，所以我们打了车。", why: "so 引出结果。" },
  { id: "cj3", point: "conjunctions", q: "___ he is young, he is very clever.", options: ["But", "Although", "Because", "So"], answer: "Although", zh: "虽然他年纪小，但很聪明。", why: "although 表让步，且不能和 but 连用。" },
  { id: "cj4", point: "conjunctions", q: "Which sentence is wrong?", options: ["Because it was late, so we went home.", "It was late, so we went home.", "We went home because it was late.", "Because it was late, we went home."], answer: "Because it was late, so we went home.", zh: "哪一句是错的？", why: "英语里 because 和 so 不能同时出现，中文的「因为…所以」要拆开。" },
  { id: "cj5", point: "conjunctions", q: "Hurry up ___ you'll miss the bus.", options: ["and", "or", "but", "so"], answer: "or", zh: "快点，否则你会错过公交。", why: "or 在这里表示「否则」。" },
  { id: "cj6", point: "conjunctions", q: "I like tea ___ my sister prefers coffee.", options: ["and", "but", "so", "because"], answer: "but", zh: "我喜欢茶，但我姐姐更喜欢咖啡。", why: "转折关系用 but。" },

  // ---------- imperatives ----------
  { id: "im1", point: "imperatives", q: "___ touch the paintings.", options: ["Not", "Don't", "No", "Doesn't"], answer: "Don't", zh: "请勿触摸画作。", why: "祈使句否定用 Don't + 动词原形。" },
  { id: "im2", point: "imperatives", q: "___ off your phone before the film.", options: ["Turn", "Turning", "To turn", "Turns"], answer: "Turn", zh: "电影开始前请关手机。", why: "祈使句用动词原形开头。" },
  { id: "im3", point: "imperatives", q: "___ meet at the school gate.", options: ["Let's", "Let", "Let we", "Lets"], answer: "Let's", zh: "我们在校门口见吧。", why: "提议用 Let's + 动词原形（Let us 的缩写）。" },
  { id: "im4", point: "imperatives", q: "Which is a natural notice?", options: ["You keep off the grass.", "Keep off the grass.", "Keeping off the grass.", "To keep off the grass."], answer: "Keep off the grass.", zh: "哪一句是自然的告示？", why: "公共标识用祈使句，不加 you。" },

  // ---------- present-perfect ----------
  { id: "pf1", point: "present-perfect", q: "I have ___ finished my lunch.", options: ["yet", "just", "ago", "yesterday"], answer: "just", zh: "我刚吃完午饭。", why: "just（刚刚）配现在完成时，放在 have 和过去分词之间。" },
  { id: "pf2", point: "present-perfect", q: "Have you ___ been to London?", options: ["ever", "never", "yet", "ago"], answer: "ever", zh: "你去过伦敦吗？", why: "ever 用于完成时疑问句，表示「曾经」。" },
  { id: "pf3", point: "present-perfect", q: "We ___ here for ten years.", options: ["live", "lived", "have lived", "are living"], answer: "have lived", zh: "我们在这儿住了十年了。", why: "for + 一段时间表示从过去持续到现在，用现在完成时。" },
  { id: "pf4", point: "present-perfect", q: "She hasn't called me ___.", options: ["yet", "just", "already", "ever"], answer: "yet", zh: "她还没给我打电话。", why: "yet（还）用于完成时否定句和疑问句，通常放句末。" },
  { id: "pf5", point: "present-perfect", q: "Which is wrong?", options: ["I have seen him yesterday.", "I saw him yesterday.", "I have just seen him.", "I have never seen him."], answer: "I have seen him yesterday.", zh: "哪一句是错的？", why: "yesterday 是明确的过去时间，只能用一般过去时 saw。" },
  { id: "pf6", point: "present-perfect", q: "He ___ his homework already.", options: ["finish", "finished", "has finished", "is finishing"], answer: "has finished", zh: "他已经做完作业了。", why: "already 是现在完成时的标志词。" },

  // ---------- perfect-vs-past ----------
  { id: "pv1", point: "perfect-vs-past", q: "I ___ my phone, so I can't call you now.", options: ["lost", "have lost", "lose", "am losing"], answer: "have lost", zh: "我把手机弄丢了，所以现在没法给你打电话。", why: "强调对现在的影响（现在没法打电话），用现在完成时。" },
  { id: "pv2", point: "perfect-vs-past", q: "I ___ my phone last week, but I found it again.", options: ["lost", "have lost", "had lost", "lose"], answer: "lost", zh: "我上周丢了手机，但后来找到了。", why: "last week 是明确的过去时间，用一般过去时。" },
  { id: "pv3", point: "perfect-vs-past", q: "She ___ here since 2019.", options: ["works", "worked", "has worked", "is working"], answer: "has worked", zh: "她从 2019 年起就在这里工作。", why: "since + 起点时间，表示持续到现在，用现在完成时。" },
  { id: "pv4", point: "perfect-vs-past", q: "___ you ever eaten Chinese hot pot?", options: ["Did", "Have", "Do", "Were"], answer: "Have", zh: "你吃过中国火锅吗？", why: "ever 询问人生经历，用现在完成时。" },
  { id: "pv5", point: "perfect-vs-past", q: "We ___ that film three years ago.", options: ["have seen", "saw", "see", "had saw"], answer: "saw", zh: "我们三年前看过那部电影。", why: "ago 表示已结束的过去时间，用一般过去时。" },
  { id: "pv6", point: "perfect-vs-past", q: "I can't find my keys. ___ you ___ them?", options: ["Did / see", "Have / seen", "Do / see", "Are / seeing"], answer: "Have / seen", zh: "我找不到钥匙了，你看到了吗？", why: "关注「现在找不找得到」，用现在完成时。" },

  // ---------- used-to ----------
  { id: "ut1", point: "used-to", q: "My dad ___ smoke, but he stopped last year.", options: ["used to", "use to", "is used to", "uses to"], answer: "used to", zh: "我爸爸以前抽烟，去年戒了。", why: "肯定句用 used to + 原形，表示过去常常、现在不了。" },
  { id: "ut2", point: "used-to", q: "Did you ___ live in Shanghai?", options: ["used to", "use to", "used", "using to"], answer: "use to", zh: "你以前住在上海吗？", why: "疑问和否定形式里写 use to（前面已有 did，不再用过去式）。" },
  { id: "ut3", point: "used-to", q: "There ___ a cinema here, but it closed.", options: ["used to be", "used to have", "use to be", "was used to be"], answer: "used to be", zh: "这儿以前有家电影院，后来关了。", why: "There used to be 是固定说法，表示「以前有」。" },
  { id: "ut4", point: "used-to", q: "I ___ getting up early now — it's my job.", options: ["used to", "am used to", "use to", "was used"], answer: "am used to", zh: "我现在习惯早起了，工作需要。", why: "be used to + -ing 是「习惯于」，和 used to do（过去常常）完全不同。" },
  { id: "ut5", point: "used-to", q: "I didn't ___ like vegetables, but now I love them.", options: ["used to", "use to", "used", "using"], answer: "use to", zh: "我以前不喜欢蔬菜，现在很爱吃。", why: "否定形式是 didn't use to（没有 d）。" },

  // ---------- passive ----------
  { id: "pv7", point: "passive", q: "The bridge ___ in 1990.", options: ["built", "was built", "has built", "is building"], answer: "was built", zh: "这座桥建于 1990 年。", why: "桥是被建的，用被动 was + 过去分词。" },
  { id: "pv8", point: "passive", q: "English ___ in many countries.", options: ["speaks", "is spoken", "is speaking", "spoke"], answer: "is spoken", zh: "许多国家说英语。", why: "英语是「被说」的，用一般现在时被动 is + spoken。" },
  { id: "pv9", point: "passive", q: "The homework has to ___ today.", options: ["finish", "be finished", "finished", "finishing"], answer: "be finished", zh: "作业今天必须做完。", why: "情态后的被动用 be + 过去分词。" },
  { id: "pa1", point: "passive", q: "This photo ___ by my grandfather.", options: ["took", "was taken", "has taken", "is taking"], answer: "was taken", zh: "这张照片是我爷爷拍的。", why: "被动句里执行者用 by 引出。" },
  { id: "pa2", point: "passive", q: "Which is wrong?", options: ["The accident was happened yesterday.", "The window was broken.", "The letter was written by Tom.", "The food is served hot."], answer: "The accident was happened yesterday.", zh: "哪一句是错的？", why: "happen 是不及物动词，没有被动语态，应该说 The accident happened." },

  // ---------- conditionals ----------
  { id: "cd1", point: "conditionals", q: "If you ___ water, it boils.", options: ["heat", "will heat", "heated", "would heat"], answer: "heat", zh: "如果你把水加热，它就会沸腾。", why: "零条件句讲客观事实，主从句都用一般现在时。" },
  { id: "cd2", point: "conditionals", q: "If it rains tomorrow, we ___ at home.", options: ["stay", "stayed", "will stay", "would stay"], answer: "will stay", zh: "如果明天下雨，我们就待在家。", why: "一条件句：If + 现在时，主句用 will + 原形。" },
  { id: "cd3", point: "conditionals", q: "If I ___ more time, I would learn the piano.", options: ["have", "had", "has", "will have"], answer: "had", zh: "如果我有更多时间，我会学钢琴。", why: "二条件句讲假设，if 从句用过去式，主句用 would + 原形。" },
  { id: "cd4", point: "conditionals", q: "Which is wrong?", options: ["If it will rain, we will stay in.", "If it rains, we will stay in.", "If it rained, we would stay in.", "If it rains, we stay in."], answer: "If it will rain, we will stay in.", zh: "哪一句是错的？", why: "if 从句里不用 will，用一般现在时表将来。" },
  { id: "cd5", point: "conditionals", q: "If I ___ you, I would talk to the teacher.", options: ["am", "was", "were", "be"], answer: "were", zh: "如果我是你，我会去找老师谈。", why: "二条件句里 be 动词统一用 were（If I were you 是固定说法）。" },
  { id: "cd6", point: "conditionals", q: "You'll miss the bus ___ you hurry.", options: ["if", "unless", "when", "because"], answer: "unless", zh: "除非你快点，否则会错过公交。", why: "unless = if…not（如果不）。" },

  // ---------- relative-clauses ----------
  { id: "rc1", point: "relative-clauses", q: "That's the girl ___ won the prize.", options: ["which", "who", "whose", "where"], answer: "who", zh: "那就是获奖的女孩。", why: "先行词是人（the girl），用 who。" },
  { id: "rc2", point: "relative-clauses", q: "This is the shop ___ I bought my bike.", options: ["who", "which", "where", "whose"], answer: "where", zh: "这就是我买自行车的那家店。", why: "先行词是地点且从句不缺主语宾语，用 where。" },
  { id: "rc3", point: "relative-clauses", q: "He's the student ___ father is a doctor.", options: ["who", "which", "whose", "that"], answer: "whose", zh: "他就是那个父亲是医生的学生。", why: "表示所属关系用 whose。" },
  { id: "rc4", point: "relative-clauses", q: "The book ___ I bought yesterday is great.", options: ["which", "who", "whose", "where"], answer: "which", zh: "我昨天买的那本书很棒。", why: "先行词是物，用 which 或 that。" },
  { id: "rc5", point: "relative-clauses", q: "Which is wrong?", options: ["the book which I bought it", "the book which I bought", "the book I bought", "the book that I bought"], answer: "the book which I bought it", zh: "哪一句是错的？", why: "关系词 which 已经替代了宾语，不能再加 it。" },
  { id: "rc6", point: "relative-clauses", q: "That's the reason ___ I was late.", options: ["which", "why", "who", "where"], answer: "why", zh: "那就是我迟到的原因。", why: "先行词是 reason，用 why 引导。" },

  // ---------- reported-speech ----------
  { id: "rs1", point: "reported-speech", q: '"I am tired." → She said she ___ tired.', options: ["is", "was", "has been", "were"], answer: "was", zh: "她说她累了。", why: "间接引语时态后退一步：一般现在时 → 一般过去时。" },
  { id: "rs2", point: "reported-speech", q: "He told me he ___ finished the work.", options: ["has", "had", "have", "was"], answer: "had", zh: "他告诉我他已经完成了工作。", why: "现在完成时 → 过去完成时（had + 过去分词）。" },
  { id: "rs3", point: "reported-speech", q: '"I will come tomorrow." → He said he would come ___.', options: ["tomorrow", "the next day", "yesterday", "today"], answer: "the next day", zh: "他说他第二天会来。", why: "时间状语要变：tomorrow → the next day / the following day。" },
  { id: "rs4", point: "reported-speech", q: "She ___ me that she was leaving.", options: ["said", "told", "said to me", "tells"], answer: "told", zh: "她告诉我她要走了。", why: "tell + 人；say 后面不能直接跟人（He said me ✗）。" },
  { id: "rs5", point: "reported-speech", q: 'The teacher said the sun ___ in the east.', options: ["rose", "rises", "rise", "is rising"], answer: "rises", zh: "老师说太阳从东方升起。", why: "客观真理时态不变，仍用一般现在时。" },
  { id: "rs6", point: "reported-speech", q: '"Did you see the film?" → She asked ___ I had seen the film.', options: ["that", "if", "what", "whether or not"], answer: "if", zh: "她问我有没有看那部电影。", why: "一般疑问句转间接引语用 if / whether 引导。" },

  // ---------- modal-deduction ----------
  { id: "md1", point: "modal-deduction", q: "He ___ be tired after such a long journey.", options: ["must", "mustn't", "can", "need"], answer: "must", zh: "走了这么久，他一定累了。", why: "肯定的推测用 must + 原形（一定）。" },
  { id: "md2", point: "modal-deduction", q: "She ___ be at home — her bike is gone.", options: ["must", "might", "can't", "mustn't"], answer: "can't", zh: "她不可能在家，她的自行车不在了。", why: "否定的推测用 can't（不可能），不用 mustn't。" },
  { id: "md3", point: "modal-deduction", q: "You ___ have left it on the bus.", options: ["might", "mustn't", "can't to", "should to"], answer: "might", zh: "你可能把它落在公交车上了。", why: "对过去的推测用 might/may/must + have + 过去分词。" },
  { id: "md4", point: "modal-deduction", q: "Which means 「禁止」?", options: ["You mustn't park here.", "You can't be serious.", "You don't have to pay.", "You might be right."], answer: "You mustn't park here.", zh: "哪一句表示「禁止」？", why: "mustn't = 禁止；can't 用于推测「不可能」；don't have to = 不必。" },

  // ---------- past-perfect ----------
  { id: "pp8", point: "past-perfect", q: "When we arrived, the film ___ already started.", options: ["has", "had", "was", "did"], answer: "had", zh: "我们到的时候电影已经开始了。", why: "「到达」是过去，「开始」在到达之前，用过去完成时 had + 过去分词。" },
  { id: "pp9", point: "past-perfect", q: "She ___ never seen snow before that day.", options: ["has", "had", "was", "have"], answer: "had", zh: "那天之前她从没见过雪。", why: "过去的过去，用过去完成时。" },
  { id: "pa3", point: "past-perfect", q: "I ___ my homework before dinner.", options: ["finish", "finished", "had finished", "have finished"], answer: "had finished", zh: "晚饭前我就做完作业了。", why: "before 引出的过去时间之前已完成，用过去完成时。" },
  { id: "pa4", point: "past-perfect", q: "Which is wrong?", options: ["I had seen him yesterday.", "I saw him yesterday.", "I had never met her before.", "The train had left when we got there."], answer: "I had seen him yesterday.", zh: "哪一句是错的？", why: "没有「过去的过去」作对比时不用完成时，yesterday 配一般过去时。" },

  // ---------- question-tags ----------
  { id: "qt7", point: "question-tags", q: "It's a lovely day, ___?", options: ["isn't it", "is it", "doesn't it", "wasn't it"], answer: "isn't it", zh: "天气真好，不是吗？", why: "前肯定后否定；前面是 is，尾句用 isn't it。" },
  { id: "qt8", point: "question-tags", q: "You don't eat meat, ___?", options: ["do you", "don't you", "are you", "aren't you"], answer: "do you", zh: "你不吃肉，对吧？", why: "前否定后肯定；助动词与前面一致（do）。" },
  { id: "qt9", point: "question-tags", q: "They went to Paris, ___?", options: ["didn't they", "did they", "don't they", "weren't they"], answer: "didn't they", zh: "他们去了巴黎，是吗？", why: "一般过去时用 did，前肯定后否定：didn't they。" },
  { id: "qa1", point: "question-tags", q: "I'm late, ___?", options: ["amn't I", "aren't I", "am I", "isn't I"], answer: "aren't I", zh: "我迟到了，是吧？", why: "I'm… 的反义疑问固定用 aren't I（没有 amn't I 这个写法）。" },
  { id: "qa2", point: "question-tags", q: "She never eats breakfast, ___ she?", options: ["does", "doesn't", "is", "isn't"], answer: "does", zh: "她从不吃早饭，是吗？", why: "never 算否定，尾句要用肯定形式。" },
  { id: "qa3", point: "question-tags", q: "Let's go now, ___?", options: ["shall we", "will we", "don't we", "are we"], answer: "shall we", zh: "我们走吧，好吗？", why: "Let's 开头的祈使句尾句固定用 shall we。" },

  // ---------- so-such-too-enough ----------
  { id: "se1", point: "so-such-too-enough", q: "The film was ___ boring that I fell asleep.", options: ["so", "such", "too", "very"], answer: "so", zh: "电影太无聊，我睡着了。", why: "so + 形容词 + that 从句。" },
  { id: "se2", point: "so-such-too-enough", q: "It was ___ a difficult exam!", options: ["so", "such", "too", "enough"], answer: "such", zh: "那场考试真难！", why: "such + a/an + 形容词 + 名词。" },
  { id: "se3", point: "so-such-too-enough", q: "He isn't tall ___ to reach the shelf.", options: ["too", "enough", "so", "such"], answer: "enough", zh: "他不够高，够不到架子。", why: "enough 放在形容词之后。" },
  { id: "se4", point: "so-such-too-enough", q: "We have ___ money to buy the tickets.", options: ["enough", "too", "so", "such"], answer: "enough", zh: "我们有足够的钱买票。", why: "enough 放在名词之前（enough money）。" },
  { id: "se5", point: "so-such-too-enough", q: "This box is ___ heavy for me to carry.", options: ["too", "enough", "so", "very"], answer: "too", zh: "这箱子太重，我搬不动。", why: "too + 形容词 + (for someone) to do 表示「太…以至于不能」。" },
  { id: "se6", point: "so-such-too-enough", q: "She speaks ___ quickly that I can't follow her.", options: ["so", "such", "too", "such a"], answer: "so", zh: "她讲得太快，我跟不上。", why: "so 也可修饰副词（quickly）。" },

  // ---------- phrasal-verbs ----------
  { id: "ph1", point: "phrasal-verbs", q: "Can you ___ my cat while I'm away?", options: ["look after", "look for", "look up", "look into"], answer: "look after", zh: "我不在的时候你能帮我照顾猫吗？", why: "look after = 照顾；look for = 寻找。" },
  { id: "ph2", point: "phrasal-verbs", q: "Don't ___ ! You're nearly there.", options: ["give up", "give in", "give off", "give away"], answer: "give up", zh: "别放弃，你快成功了。", why: "give up = 放弃。" },
  { id: "ph3", point: "phrasal-verbs", q: "We've ___ milk — can you buy some?", options: ["run out of", "run into", "run over", "run after"], answer: "run out of", zh: "我们牛奶喝完了，你能买点吗？", why: "run out of = 用完、耗尽。" },
  { id: "ph4", point: "phrasal-verbs", q: "The light is too bright. Please turn ___.", options: ["it off", "off it", "it down off", "down it off"], answer: "it off", zh: "灯太亮了，请关掉。", why: "代词宾语必须放在动词和副词中间：turn it off ✓，turn off it ✗。" },
  { id: "ph5", point: "phrasal-verbs", q: "The plane ___ at nine, so we must hurry.", options: ["takes off", "takes up", "takes after", "takes in"], answer: "takes off", zh: "飞机九点起飞，我们得快点。", why: "take off = 起飞；take after = 长得像（长辈）。" },
  { id: "ph6", point: "phrasal-verbs", q: "He ___ a great idea during the meeting.", options: ["came up with", "came across", "came in", "came on"], answer: "came up with", zh: "他在会上想出一个好主意。", why: "come up with = 想出；come across = 偶然遇到。" },
  { id: "ph7", point: "phrasal-verbs", q: "My dad ___ me ___ after school every day.", options: ["picks / up", "picks up / me", "pick / up me", "picks / up me"], answer: "picks / up", zh: "爸爸每天放学后接我。", why: "pick sb up = 接某人；代词 me 放在中间。" },

  // ---------- word-formation ----------
  { id: "wf1", point: "word-formation", q: "His ___ surprised everyone. (decide)", options: ["decide", "decision", "deciding", "decisive"], answer: "decision", zh: "他的决定让大家惊讶。", why: "形容词性物主代词 his 后面要名词，decide → decision。" },
  { id: "wf2", point: "word-formation", q: "She was ___ about the result. (unhappy)", options: ["unhappiness", "unhappy", "unhappily", "happiness"], answer: "unhappy", zh: "她对结果不满意。", why: "be 动词后要形容词；否定前缀 un- + happy。" },
  { id: "wf3", point: "word-formation", q: "Please speak ___ in the library. (quiet)", options: ["quiet", "quietly", "quietness", "quieten"], answer: "quietly", zh: "在图书馆请小声说话。", why: "修饰动词 speak 要用副词，形容词 + -ly。" },
  { id: "wf4", point: "word-formation", q: "Be ___ — the floor is wet. (care)", options: ["care", "careful", "carefully", "careless"], answer: "careful", zh: "小心，地板是湿的。", why: "be 后要形容词；care + -ful = 小心的（-less 是「粗心的」，意思相反）。" },
  { id: "wf5", point: "word-formation", q: "The ___ of the meeting is at three. (arrive)", options: ["arrive", "arrival", "arriving", "arrived"], answer: "arrival", zh: "会议到达时间是三点。", why: "the … of 中间要名词，arrive → arrival。" },
  { id: "wf6", point: "word-formation", q: "It's ___ to run near the pool. (danger)", options: ["danger", "dangerous", "dangerously", "endanger"], answer: "dangerous", zh: "在泳池边跑很危险。", why: "It's + 形容词 + to do 结构，danger → dangerous。" },
];

/** 按考点 id 取题目。 */
export function drillsByPoint(point: string): GrammarDrill[] {
  return GRAMMAR_DRILLS.filter((d) => d.point === point);
}

/** 取若干考点的题目并打乱；count 为 0 表示不限。 */
export function drillsFor(points: string[], count = 0): GrammarDrill[] {
  const all = GRAMMAR_DRILLS.filter((d) => points.includes(d.point));
  const out = [...all];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return count > 0 ? out.slice(0, count) : out;
}
