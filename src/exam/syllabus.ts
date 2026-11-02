/**
 * KET (A2 Key) / PET (B1 Preliminary) 语法考点大纲。
 *
 * 每条考点都带：考试出处、一句话规则、公式、例句、最容易丢分的陷阱。
 * 题目不放在这里，在 `exam/grammar.ts`，用 `point` 字段关联到这里的 id。
 */

export interface GrammarPoint {
  id: string;
  /** 中文名，例如「一般现在时」。 */
  name: string;
  /** 英文名，用于检索与展示。 */
  en: string;
  /** 归属级别：A2 = KET 必备，B1 = PET 加考。 */
  level: "A2" | "B1";
  /** 在真题里出现的位置。 */
  where: string;
  /** 一句话讲清楚这个考点。 */
  rule: string;
  /** 结构公式。 */
  formula: string;
  /** [英文例句, 中文] */
  examples: [string, string][];
  /** 最容易丢分的地方。 */
  trap: string;
}

export const GRAMMAR_POINTS: GrammarPoint[] = [
  // ---------------- A2 · KET ----------------
  {
    id: "present-simple",
    name: "一般现在时",
    en: "Present simple",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "说习惯、常态和事实。第三人称单数（he/she/it）动词要加 -s。",
    formula: "主语 + 动词原形（三单 +s / +es）｜否定 don't / doesn't + 原形｜疑问 Do / Does + 主语 + 原形",
    examples: [
      ["She goes to school by bus every day.", "她每天坐公交上学。（三单加 -es）"],
      ["They don't like spicy food.", "他们不喜欢辣的食物。"],
      ["Does your brother play football?", "你哥哥踢足球吗？"],
    ],
    trap: "doesn't / doesn't 后面动词必须还原：He doesn't likes it ✗ → He doesn't like it ✓",
  },
  {
    id: "present-continuous",
    name: "现在进行时",
    en: "Present continuous",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "说此刻正在发生的事，或最近一段暂时的安排。",
    formula: "am / is / are + 动词 -ing",
    examples: [
      ["Look! It is snowing outside.", "看！外面正在下雪。"],
      ["I'm staying with my aunt this week.", "这周我住在姑姑家。（近期安排）"],
      ["What are you doing right now?", "你现在在做什么？"],
    ],
    trap: "know / like / want / understand / belong 这类状态动词一般不用进行时：I am knowing ✗",
  },
  {
    id: "past-simple",
    name: "一般过去时",
    en: "Past simple",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "说过去某个时间点发生并结束的动作，常带 yesterday / last week / … ago。",
    formula: "动词过去式（规则 -ed，不规则需背）｜否定 didn't + 原形｜疑问 Did + 主语 + 原形",
    examples: [
      ["We visited the museum last Sunday.", "上周日我们参观了博物馆。"],
      ["I didn't see him at the party.", "我在聚会上没看到他。"],
      ["Did you finish your homework?", "你做完作业了吗？"],
    ],
    trap: "didn't 后用原形：I didn't went ✗ → I didn't go ✓；不规则动词别乱加 -ed：buyed ✗ → bought ✓",
  },
  {
    id: "past-continuous",
    name: "过去进行时",
    en: "Past continuous",
    level: "A2",
    where: "KET R&W Part 2",
    rule: "说过去某个时刻正在做的事，常用来铺背景，被 when 引导的短动作打断。",
    formula: "was / were + 动词 -ing",
    examples: [
      ["I was reading when the phone rang.", "电话响的时候我正在看书。"],
      ["At eight o'clock she was having dinner.", "八点时她正在吃晚饭。"],
      ["They were playing in the garden all afternoon.", "他们整个下午都在花园里玩。"],
    ],
    trap: "长动作用过去进行时，短动作用一般过去时：I was reading when the phone was ringing ✗（第二个改 rang）",
  },
  {
    id: "future-forms",
    name: "将来表达",
    en: "Future forms",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "will 表临时决定和预测；be going to 表已有计划或有迹象；现在进行时可表已约定的安排。",
    formula: "will + 原形 ｜ am/is/are going to + 原形 ｜ am/is/are + -ing（已安排）",
    examples: [
      ["I think it will rain tomorrow.", "我觉得明天会下雨。（预测）"],
      ["We're going to visit Beijing in July.", "我们打算七月去北京。（计划）"],
      ["I'm meeting my teacher at 5 pm.", "我五点和老师见面。（已约好）"],
    ],
    trap: "有明确时间表的安排用现在进行时更自然；临时决定只能用 will（门铃响了 → I'll open it）",
  },
  {
    id: "modal-verbs",
    name: "情态动词",
    en: "Modal verbs",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "can 能、could 过去能/委婉、must 必须、should 应该、have to 不得不。后面一律接动词原形。",
    formula: "can / could / must / should + 动词原形 ｜ have to + 原形（三单 has to）",
    examples: [
      ["You must wear a helmet on a bike.", "骑车必须戴头盔。"],
      ["She has to help her mum every evening.", "她每天晚上都得帮妈妈。"],
      ["You shouldn't eat too much sugar.", "你不该吃太多糖。"],
    ],
    trap: "mustn't（禁止）≠ don't have to（不必）：You mustn't smoke 是「禁止吸烟」，You don't have to come 是「你不用过来」",
  },
  {
    id: "comparative",
    name: "比较级与最高级",
    en: "Comparatives & superlatives",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "短词加 -er / -est，长词用 more / most，几个高频词不规则。",
    formula: "短词：cheap → cheaper → the cheapest ｜ 长词：more useful → the most useful ｜ 不规则：good → better → best",
    examples: [
      ["This bag is cheaper than that one.", "这个包比那个便宜。"],
      ["She is the tallest girl in our class.", "她是我们班最高的女生。"],
      ["Maths is more difficult than English for me.", "对我来说数学比英语难。"],
    ],
    trap: "不能叠用：more cheaper ✗；比较别忘了 than；最高级前要有 the（the best ✓）",
  },
  {
    id: "articles",
    name: "冠词",
    en: "Articles",
    level: "A2",
    where: "KET R&W Part 5 · PET Reading Part 6（开放式填空高频）",
    rule: "a / an 用于首次提到的单数可数名词；the 用于双方都知道或再次提到的特指；泛指复数和不可数名词前不加冠词。",
    formula: "a + 辅音开头 ｜ an + 元音开头 ｜ the + 特指 ｜ 泛指复数/不可数 → 零冠词",
    examples: [
      ["I saw a dog in the street. The dog was black.", "我在街上看到一只狗。那只狗是黑色的。"],
      ["She is an engineer.", "她是一名工程师。"],
      ["I like music and books.", "我喜欢音乐和书。（泛指，无冠词）"],
    ],
    trap: "an hour（h 不发音）✓ 但 a university（u 发 /juː/）✓ —— 看发音不看字母",
  },
  {
    id: "prepositions",
    name: "介词",
    en: "Prepositions",
    level: "A2",
    where: "KET R&W Part 5 · PET Reading Part 6（开放式填空最高频）",
    rule: "时间：at 接点，on 接天，in 接段。地点：at 小地点，in 大范围，on 表面或街道。",
    formula: "at 7 o'clock ｜ on Monday / on 3 May ｜ in July / in 2024 / in the morning ｜ at the station ｜ in Beijing ｜ on the table / on Green Street",
    examples: [
      ["The lesson starts at nine o'clock.", "课九点开始。"],
      ["We have a test on Friday.", "我们周五有测验。"],
      ["My birthday is in October.", "我的生日在十月。"],
    ],
    trap: "in the morning 但 on Monday morning（具体到某天早上就用 on）；arrive in + 城市/国家，arrive at + 车站/机场",
  },
  {
    id: "pronouns",
    name: "代词",
    en: "Pronouns",
    level: "A2",
    where: "KET R&W Part 5 · PET Reading Part 6",
    rule: "主格做主语、宾格做宾语；形容词性物主代词后接名词，名词性物主代词独立使用；反身代词表示「…自己」。",
    formula: "I/me, he/him ｜ my book（后接名词）/ mine（独立）｜ myself, yourself, himself",
    examples: [
      ["This pen isn't mine. It's hers.", "这支笔不是我的，是她的。"],
      ["He taught himself to play the guitar.", "他自学弹吉他。"],
      ["Can you help me with this bag?", "你能帮我拿一下这个包吗？"],
    ],
    trap: "it's = it is，而 its 是「它的」：The cat licked its paws ✓（不是 it's）",
  },
  {
    id: "quantifiers",
    name: "数量词",
    en: "Quantifiers",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "some 多用于肯定句，any 多用于否定和疑问句；many 配可数，much 配不可数；a lot of 两者都行。",
    formula: "some + 可数复数/不可数（肯定）｜ any（否定/疑问）｜ many + 可数 ｜ much + 不可数 ｜ a lot of + 两者",
    examples: [
      ["There isn't any milk in the fridge.", "冰箱里没有牛奶了。"],
      ["How many students are in your class?", "你们班有多少学生？"],
      ["We don't have much time.", "我们没有太多时间。"],
    ],
    trap: "请求和提议里疑问也用 some：Would you like some tea? ✓（期待肯定回答）",
  },
  {
    id: "there-is",
    name: "There is / There are",
    en: "There is / There are",
    level: "A2",
    where: "KET R&W Part 2",
    rule: "表示「某地有某物」。后面是单数或不可数用 is，复数用 are；并列时看最近的那一项（就近原则）。",
    formula: "There is + 单数/不可数 ｜ There are + 复数 ｜ 就近原则：There is a book and two pens",
    examples: [
      ["There are three parks near my house.", "我家附近有三个公园。"],
      ["There isn't any sugar left.", "糖一点都没剩。"],
      ["Is there a cinema in this town?", "这个镇上有电影院吗？"],
    ],
    trap: "There have ✗ —— 永远用 There is / There are 表示存在",
  },
  {
    id: "adverbs-frequency",
    name: "频率副词",
    en: "Adverbs of frequency",
    level: "A2",
    where: "KET R&W Part 2",
    rule: "always / usually / often / sometimes / never 表示频率，位置在 be 动词之后、实义动词之前。",
    formula: "be 之后：He is always late ｜ 实义动词之前：I usually walk to school",
    examples: [
      ["She never eats breakfast before seven.", "她七点前从不吃早饭。"],
      ["Tom is always ready to help.", "汤姆总是乐于帮忙。"],
      ["We sometimes go swimming at weekends.", "我们周末有时去游泳。"],
    ],
    trap: "never 本身就是否定，别再加 don't：I don't never ✗",
  },
  {
    id: "to-do-or-ing",
    name: "不定式与动名词",
    en: "Infinitive or -ing",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "want / decide / hope / promise 后接 to do；enjoy / finish / mind / keep 后接 -ing；like / love / hate 两者皆可。",
    formula: "want to do ｜ enjoy doing ｜ would like to do ｜ be good at doing",
    examples: [
      ["I want to learn Spanish.", "我想学西班牙语。"],
      ["She enjoys reading in the garden.", "她喜欢在花园里看书。"],
      ["He finished doing his homework at nine.", "他九点做完了作业。"],
    ],
    trap: "介词后面一律 -ing：I'm good at draw ✗ → at drawing ✓；I'm interested in learn ✗ → in learning ✓",
  },
  {
    id: "questions",
    name: "疑问句语序",
    en: "Question forms",
    level: "A2",
    where: "KET R&W Part 3 · PET Reading Part 5",
    rule: "特殊疑问句 = 疑问词 + 助动词 + 主语 + 动词；但如果疑问词本身是主语，就按陈述句语序。",
    formula: "Where do you live? ｜ Who lives here?（who 是主语，不加 do）",
    examples: [
      ["Where does your sister work?", "你姐姐在哪儿工作？"],
      ["Who broke the window?", "谁打破了窗户？（who 作主语，不加 did）"],
      ["How often do you visit your grandparents?", "你多久去看一次爷爷奶奶？"],
    ],
    trap: "宾语从句里要用陈述语序：Do you know where is the station? ✗ → where the station is ✓",
  },
  {
    id: "conjunctions",
    name: "连词",
    en: "Conjunctions",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 6",
    rule: "and 并列、but 转折、or 选择、so 结果、because 原因、although 让步。",
    formula: "because + 原因 ｜ so + 结果 ｜ although + 让步（不能和 but 连用）",
    examples: [
      ["I stayed at home because it was raining.", "因为下雨，我待在家里。"],
      ["It was raining, so we took a taxi.", "下雨了，所以我们打了车。"],
      ["Although he is young, he is very clever.", "虽然他年纪小，但很聪明。"],
    ],
    trap: "英语里 because 和 so 不能同时用，although 和 but 也不能同时用（中文「因为…所以」要拆）",
  },
  {
    id: "imperatives",
    name: "祈使句",
    en: "Imperatives",
    level: "A2",
    where: "KET R&W Part 1（标识）",
    rule: "直接用动词原形开头表示命令、请求、指示；否定用 Don't + 原形；Let's 表示提议。",
    formula: "动词原形开头：Open the window. ｜ 否定 Don't + 原形 ｜ Let's + 原形",
    examples: [
      ["Don't touch the paintings.", "请勿触摸画作。"],
      ["Turn off your phone before the film.", "电影开始前请关手机。"],
      ["Let's meet at the school gate.", "我们在校门口见吧。"],
    ],
    trap: "祈使句没有主语 you（You open the door 是喊人，不是通用指示）",
  },
  {
    id: "present-perfect",
    name: "现在完成时",
    en: "Present perfect",
    level: "A2",
    where: "KET R&W Part 2 · PET Reading Part 5",
    rule: "过去发生但与现在有关（经历、结果、持续）。标志词 just / already / yet / ever / never / since / for。",
    formula: "have / has + 过去分词",
    examples: [
      ["I have just finished my lunch.", "我刚吃完午饭。"],
      ["Have you ever been to London?", "你去过伦敦吗？"],
      ["We have lived here for ten years.", "我们在这儿住了十年了。"],
    ],
    trap: "有明确过去时间（yesterday / in 2020）就不能用完成时：I have seen him yesterday ✗ → I saw him ✓",
  },

  // ---------------- B1 · PET ----------------
  {
    id: "perfect-vs-past",
    name: "完成时 vs 过去时",
    en: "Present perfect vs past simple",
    level: "B1",
    where: "PET Reading Part 5 · Writing Part 1",
    rule: "只说过去的事用一般过去时；强调对现在的影响或从过去持续到现在用现在完成时。",
    formula: "I lost my key（过去丢的，现在可能找到了）｜ I have lost my key（现在还没找到）",
    examples: [
      ["I have lost my phone, so I can't call you.", "我把手机弄丢了，所以没法给你打电话。（影响现在）"],
      ["I lost my phone last week, but I found it.", "我上周丢了手机，但找到了。"],
      ["She has worked here since 2019.", "她从 2019 年起就在这里工作。"],
    ],
    trap: "just / already / yet 几乎只配完成时；yesterday / ago / last year 只配过去时",
  },
  {
    id: "used-to",
    name: "used to",
    en: "Used to",
    level: "B1",
    where: "PET Reading Part 5",
    rule: "表示过去经常做、但现在不再做的事或状态。",
    formula: "used to + 动词原形 ｜ 否定 didn't use to（注意没有 d）",
    examples: [
      ["My dad used to smoke, but he stopped.", "我爸爸以前抽烟，后来戒了。"],
      ["Did you use to live in Shanghai?", "你以前住在上海吗？"],
      ["There used to be a cinema here.", "这儿以前有家电影院。"],
    ],
    trap: "否定/疑问里写成 use to（不是 used to）：I didn't used to ✗ → didn't use to ✓；be used to doing 是「习惯于」，意思完全不同",
  },
  {
    id: "passive",
    name: "被动语态",
    en: "Passive voice",
    level: "B1",
    where: "PET Reading Part 5 · Writing Part 2",
    rule: "强调动作的承受者，或不知道/不必说谁做的。",
    formula: "be + 过去分词 ｜ 现在：is/are + done ｜ 过去：was/were + done ｜ 执行者用 by",
    examples: [
      ["The bridge was built in 1990.", "这座桥建于 1990 年。"],
      ["English is spoken in many countries.", "许多国家说英语。"],
      ["The homework has to be finished today.", "作业今天必须做完。"],
    ],
    trap: "只有及物动词才有被动；happen / arrive / belong 没有被动：The accident was happened ✗",
  },
  {
    id: "conditionals",
    name: "条件句",
    en: "Conditionals",
    level: "B1",
    where: "PET Reading Part 5 · Writing Part 2",
    rule: "零条件讲事实，一条件讲可能，二条件讲假设。",
    formula: "0：If + 现在时, 现在时 ｜ 1：If + 现在时, will + 原形 ｜ 2：If + 过去时, would + 原形",
    examples: [
      ["If you heat water, it boils.", "如果你把水加热，它就会沸腾。"],
      ["If it rains tomorrow, we will stay at home.", "如果明天下雨，我们就待在家。"],
      ["If I had more time, I would learn the piano.", "如果我有更多时间，我会学钢琴。"],
    ],
    trap: "if 引导的从句里不用 will：If it will rain ✗ → If it rains ✓；二条件里 be 动词统一用 were（If I were you）",
  },
  {
    id: "relative-clauses",
    name: "关系从句",
    en: "Relative clauses",
    level: "B1",
    where: "PET Reading Part 6（开放式填空高频）",
    rule: "who 指人，which / that 指物，where 指地点，whose 表所属，why 表原因。",
    formula: "the boy who lives next door ｜ the book which I bought ｜ the town where I was born",
    examples: [
      ["That's the girl who won the prize.", "那就是获奖的女孩。"],
      ["This is the shop where I bought my bike.", "这就是我买自行车的那家店。"],
      ["He's the student whose father is a doctor.", "他就是那个父亲是医生的学生。"],
    ],
    trap: "关系词已经替代了宾语，别重复：the book which I bought it ✗（去掉 it）；that 在从句做宾语时可省略",
  },
  {
    id: "reported-speech",
    name: "间接引语",
    en: "Reported speech",
    level: "B1",
    where: "PET Reading Part 5",
    rule: "转述别人的话时，时态往后退一步，人称和时间地点也相应变化。",
    formula: "say → say (that) + 从句 ｜ tell + 人 + (that) ｜ 现在时 → 过去时 ｜ tomorrow → the next day",
    examples: [
      ['She said (that) she was tired.', "她说她累了。"],
      ['He told me he had finished the work.', "他告诉我他已经完成了工作。"],
      ['"I will come tomorrow." → He said he would come the next day.', "他说他第二天会来。"],
    ],
    trap: "said 后不能直接跟人：He said me ✗ → He told me ✓；客观真理时态不变（The teacher said the sun rises in the east）",
  },
  {
    id: "modal-deduction",
    name: "情态推测",
    en: "Modals of deduction",
    level: "B1",
    where: "PET Reading Part 5",
    rule: "对现在的推测：must 一定是（肯定）、might/may 可能是、can't 不可能是。",
    formula: "must / might / may / can't + 动词原形 ｜ 对过去的推测用 + have + 过去分词",
    examples: [
      ["He must be tired after the long journey.", "走了这么久，他一定累了。"],
      ["She can't be at home — her bike is gone.", "她不可能在家，她的自行车不在。"],
      ["You might have left it on the bus.", "你可能把它落在公交车上了。"],
    ],
    trap: "否定推测用 can't（不是 mustn't）：mustn't 是「禁止」，不表示推测",
  },
  {
    id: "past-perfect",
    name: "过去完成时",
    en: "Past perfect",
    level: "B1",
    where: "PET Reading Part 5 · Writing Part 2",
    rule: "表示「过去的过去」：在过去某个动作之前就已经完成的事。",
    formula: "had + 过去分词",
    examples: [
      ["When we arrived, the film had already started.", "我们到的时候电影已经开始了。"],
      ["She had never seen snow before that day.", "那天之前她从没见过雪。"],
      ["I had finished my homework before dinner.", "晚饭前我就做完作业了。"],
    ],
    trap: "没有对比的过去时间就不用完成时：I had seen him yesterday ✗ → I saw him ✓",
  },
  {
    id: "question-tags",
    name: "反义疑问句",
    en: "Question tags",
    level: "B1",
    where: "PET Speaking Part 1 · Writing Part 1",
    rule: "陈述句 + 简短疑问尾句。前肯定后否定，前否定后肯定；助动词要和前面一致。",
    formula: "You like it, don't you? ｜ She isn't here, is she? ｜ Let's go, shall we?",
    examples: [
      ["It's a lovely day, isn't it?", "天气真好，不是吗？"],
      ["You don't eat meat, do you?", "你不吃肉，对吧？"],
      ["They went to Paris, didn't they?", "他们去了巴黎，是吗？"],
    ],
    trap: "I'm late, aren't I?（固定搭配，不是 amn't I）；前句有 never/hardly 算否定，尾句用肯定",
  },
  {
    id: "so-such-too-enough",
    name: "so / such / too / enough",
    en: "So, such, too, enough",
    level: "B1",
    where: "PET Reading Part 5 · Writing Part 2",
    rule: "so + 形容词/副词；such + (a/an) + 形容词 + 名词；too 太（过分）；enough 足够（放形容词后）。",
    formula: "so tired ｜ such a good idea ｜ too heavy（太重，搬不动）｜ old enough（enough 在形容词后）",
    examples: [
      ["The film was so boring that I fell asleep.", "电影太无聊，我睡着了。"],
      ["It was such a difficult exam!", "那场考试真难！"],
      ["He isn't tall enough to reach the shelf.", "他不够高，够不到架子。"],
    ],
    trap: "enough 放名词前（enough money）但放形容词/副词后（cheap enough）；too 表否定意味：too young to drive",
  },
  {
    id: "phrasal-verbs",
    name: "短语动词",
    en: "Phrasal verbs",
    level: "B1",
    where: "PET Reading Part 2/5 · Listening",
    rule: "动词 + 副词/介词构成新含义，往往不能从字面猜。PET 高频：look after, give up, put off, take off, turn up, run out of。",
    formula: "look after = 照顾 ｜ give up = 放弃 ｜ put off = 推迟 ｜ run out of = 用完",
    examples: [
      ["Can you look after my cat this weekend?", "这周末你能帮我照顾猫吗？"],
      ["Don't give up — you're nearly there.", "别放弃，你快成功了。"],
      ["We've run out of milk.", "我们把牛奶喝完了。"],
    ],
    trap: "代词宾语要放中间：turn it off ✓，turn off it ✗（名词则可放两边）",
  },
  {
    id: "word-formation",
    name: "词性转换",
    en: "Word formation",
    level: "B1",
    where: "PET Reading Part 5（Use of English 题型）",
    rule: "用前缀后缀把词改成需要的词性：名词 -tion/-ment/-ness，形容词 -ful/-less/-ive，副词 -ly，否定 un-/in-/dis-。",
    formula: "decide → decision ｜ happy → happiness ｜ care → careful / careless ｜ quick → quickly ｜ happy → unhappy",
    examples: [
      ["His decision surprised everyone.", "他的决定让大家惊讶。"],
      ["She was unhappy about the result.", "她对结果不满意。"],
      ["Please speak quietly in the library.", "在图书馆请小声说话。"],
    ],
    trap: "先判断空格要什么词性（冠词后多名词、be 后多形容词、修饰动词用副词），再决定加哪个后缀",
  },
];

/** 按 id 取考点。 */
export function pointById(id: string): GrammarPoint | undefined {
  return GRAMMAR_POINTS.find((p) => p.id === id);
}

/** 按级别列出考点。 */
export function pointsByLevel(level: "A2" | "B1"): GrammarPoint[] {
  return GRAMMAR_POINTS.filter((p) => p.level === level);
}

/**
 * 短语动词表：PET 听力与阅读高频，也是口语地道表达的关键。
 * 单独成表，因为它更像词汇考点而非语法考点。
 */
export interface PhrasalItem {
  v: string;
  zh: string;
  ex: [string, string];
}

export const PHRASAL_VERBS: PhrasalItem[] = [
  { v: "look after", zh: "照顾", ex: ["She looks after her little brother.", "她照顾弟弟。"] },
  { v: "look for", zh: "寻找", ex: ["I'm looking for my keys.", "我在找钥匙。"] },
  { v: "look forward to", zh: "期待", ex: ["I look forward to hearing from you.", "期待你的回复。"] },
  { v: "give up", zh: "放弃", ex: ["He gave up smoking last year.", "他去年戒烟了。"] },
  { v: "put off", zh: "推迟", ex: ["Don't put off your homework.", "别拖作业。"] },
  { v: "take off", zh: "起飞；脱下", ex: ["The plane takes off at nine.", "飞机九点起飞。"] },
  { v: "turn up", zh: "出现；调大", ex: ["He turned up late again.", "他又迟到了。"] },
  { v: "turn off", zh: "关掉", ex: ["Turn off the lights, please.", "请关灯。"] },
  { v: "run out of", zh: "用完", ex: ["We ran out of bread.", "我们面包吃完了。"] },
  { v: "get on with", zh: "与…相处", ex: ["She gets on well with her classmates.", "她和同学相处得很好。"] },
  { v: "come up with", zh: "想出", ex: ["He came up with a great idea.", "他想出一个好主意。"] },
  { v: "find out", zh: "查明", ex: ["I found out the answer online.", "我在网上查到了答案。"] },
  { v: "set off", zh: "出发", ex: ["We set off early in the morning.", "我们一早就出发了。"] },
  { v: "pick up", zh: "捡起；接人", ex: ["My dad picks me up after school.", "爸爸放学后接我。"] },
  { v: "carry on", zh: "继续", ex: ["Carry on with your work.", "继续做你的事。"] },
  { v: "make up", zh: "编造；化妆", ex: ["She made up a funny story.", "她编了个有趣的故事。"] },
];

/**
 * 固定搭配表：PET 写作与口语拿分的地方（collocations）。
 */
export interface CollocationItem {
  c: string;
  zh: string;
  ex: string;
}

export const COLLOCATIONS: CollocationItem[] = [
  { c: "make a mistake", zh: "犯错", ex: "Don't worry — everyone makes mistakes." },
  { c: "do homework", zh: "做作业", ex: "I do my homework after dinner." },
  { c: "have a good time", zh: "玩得开心", ex: "We had a good time at the party." },
  { c: "take a photo", zh: "拍照", ex: "Let's take a photo in front of the gate." },
  { c: "catch a bus", zh: "赶公交", ex: "I catch the bus at seven." },
  { c: "keep in touch", zh: "保持联系", ex: "Please keep in touch after you move." },
  { c: "pay attention", zh: "集中注意力", ex: "Pay attention to the teacher, please." },
  { c: "tell the truth", zh: "说实话", ex: "He always tells the truth." },
  { c: "save time", zh: "节省时间", ex: "Taking the metro saves a lot of time." },
  { c: "heavy rain", zh: "大雨", ex: "There was heavy rain last night." },
  { c: "strong wind", zh: "大风", ex: "A strong wind blew the door open." },
  { c: "make friends", zh: "交朋友", ex: "It's easy to make friends here." },
  { c: "have a shower", zh: "洗澡", ex: "I have a shower every morning." },
  { c: "go shopping", zh: "去购物", ex: "Mum goes shopping on Saturdays." },
  { c: "get a job", zh: "找到工作", ex: "He got a job at the library." },
  { c: "miss the train", zh: "错过火车", ex: "Hurry up or we'll miss the train." },
];
