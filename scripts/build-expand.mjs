// 第二轮扩词：在已有的 3222 + 第一轮 125 词基础上，再追加一批不重复的精选高阶词。
// 复用 build-b2c1c1c2 的“全量重写分块”逻辑，保证 index 与 entries 顺序严格一致。
// 用法：node scripts/build-expand.mjs
// 安全策略：
//  - 只“追加”，不改动既有词条内容；
//  - 新词 media=0（无音频/插画），App 自动退回系统 TTS，绝不产生 404 死链；
//  - 构建前用 seen 集合按 word 小写去重，重复自动跳过；
//  - 写完整体重新分块，并校验 条目顺序 与 index.words 顺序一致，不一致立即中止。
import fs from "fs";

const ROOT = "public/atlas";
const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, "utf8"));
const existing = new Set(idx.words.map((r) => String(r[1]).toLowerCase()));
const TOPIC = Object.fromEntries(idx.topics.map((t, i) => [t[0], i]));
const CEFR = Object.fromEntries(idx.cefr.map((c, i) => [c, i]));

// 每条：w 词形 / uk,us 音标 / cefr,topic 字符串 /
// senses 释义数组 / ex 例句(2) / col 搭配(3) / fam 词族 / syn 近义 / ant 反义 / tip 提示
const WORDS = [
  // ===================== B2 =====================
  { w: "abundant", pos: "adj.", zh: "丰富的；充裕的", uk: "/əˈbʌndənt/", us: "/əˈbʌndənt/", cefr: "B2", topic: "nature",
    senses: [{ pos: "adj.", zh: "丰富的；充裕的", en: "existing or available in large quantities" }],
    ex: [{ en: "The region has abundant supplies of fresh water.", zh: "该地区有充裕的淡水供应。" },
         { en: "Evidence for this view is abundant but not conclusive.", zh: "支持此观点的证据很多，但并不确凿。" }],
    col: ["abundant in｜富含……", "abundant evidence｜大量证据", "abundant resources｜丰富资源"],
    fam: ["abundance (n.)"], syn: ["plentiful", "ample"], ant: ["scarce", "sparse"],
    tip: "形容“多到用不完”；形容人“富裕”用 affluent。" },

  { w: "accumulate", pos: "v.", zh: "积累；积聚", uk: "/əˈkjuːmjəleɪt/", us: "/əˈkjuːmjəleɪt/", cefr: "B2", topic: "science",
    senses: [{ pos: "v.", zh: "积累；积聚", en: "to gradually collect or grow into a larger amount" }],
    ex: [{ en: "He accumulated a fortune through years of saving.", zh: "他靠多年攒钱积累了一笔财富。" },
         { en: "Dust accumulates quickly if you don't clean.", zh: "不打扫的话灰尘会很快积起来。" }],
    col: ["accumulate wealth｜积累财富", "accumulate evidence｜汇集证据", "gradually accumulate｜逐渐积累"],
    fam: ["accumulation (n.)"], syn: ["amass", "build up"], ant: ["dissipate", "disperse"],
    tip: "名词 accumulation 表“累积物/量”。" },

  { w: "adaptive", pos: "adj.", zh: "适应的；有适应力的", uk: "/əˈdæptɪv/", us: "/əˈdæptɪv/", cefr: "B2", topic: "science",
    senses: [{ pos: "adj.", zh: "适应的；有适应力的", en: "able to change to suit new conditions" }],
    ex: [{ en: "Children are highly adaptive to new environments.", zh: "孩子对陌生环境的适应能力很强。" },
         { en: "The software uses an adaptive interface for each user.", zh: "这款软件为每位用户采用自适应界面。" }],
    col: ["adaptive system｜自适应系统", "highly adaptive｜适应性极强", "adaptive behaviour｜适应性行为"],
    fam: ["adapt (v.)", "adaptation (n.)"], syn: ["flexible", "adjustable"], ant: ["rigid", "inflexible"],
    tip: "来自 adapt（适应）；adaptive 强调“能随机应变”。" },

  { w: "adjacent", pos: "adj.", zh: "相邻的；毗邻的", uk: "/əˈdʒeɪsnt/", us: "/əˈdʒeɪsnt/", cefr: "B2", topic: "city",
    senses: [{ pos: "adj.", zh: "相邻的；毗邻的", en: "next to or very near something" }],
    ex: [{ en: "The library is adjacent to the main building.", zh: "图书馆紧挨着主楼。" },
         { en: "We bought the adjacent plot of land.", zh: "我们买下了旁边那块地。" }],
    col: ["adjacent to｜与……相邻", "adjacent room｜隔壁房间", "immediately adjacent｜紧邻的"],
    fam: ["adjacency (n.)"], syn: ["neighbouring", "next to"], ant: ["distant", "remote"],
    tip: "几乎总与 to 连用：adjacent to。" },

  { w: "advocate", pos: "v.", zh: "提倡；拥护", uk: "/ˈædvəkeɪt/", us: "/ˈædvəkeɪt/", cefr: "B2", topic: "society",
    senses: [{ pos: "v.", zh: "提倡；拥护", en: "to publicly support or recommend a policy or cause" },
             { pos: "n.", zh: "拥护者；辩护者", en: "a person who supports a cause" }],
    ex: [{ en: "They advocate a ban on single-use plastic.", zh: "他们主张禁用一次性塑料。" },
         { en: "She is a strong advocate for children's rights.", zh: "她是儿童权利的坚定拥护者。" }],
    col: ["advocate for｜拥护……", "advocate change｜提倡变革", "a vocal advocate｜直言的倡导者"],
    fam: ["advocacy (n.)"], syn: ["champion", "support"], ant: ["oppose", "reject"],
    tip: "动词重音在前，名词 /ˈædvəkət/ 也在前；注意与 advertise 区分。" },

  { w: "aggregate", pos: "n.", zh: "合计；集合体", uk: "/ˈæɡrɪɡət/", us: "/ˈæɡrɪɡət/", cefr: "B2", topic: "economy",
    senses: [{ pos: "n.", zh: "合计；集合体", en: "a total formed by combining several parts" },
             { pos: "v.", zh: "合计；聚集", en: "to collect or amount to a total" }],
    ex: [{ en: "The aggregate of all votes was surprisingly close.", zh: "所有选票的总和出乎意料地接近。" },
         { en: "Small savings aggregate into a large sum.", zh: "零碎的储蓄聚起来就是一大笔。" }],
    col: ["in the aggregate｜总计", "aggregate demand｜总需求", "aggregate score｜总分"],
    fam: ["aggregation (n.)"], syn: ["total", "sum"], ant: ["part", "component"],
    tip: "经济/数据里常指“总量、汇总”。" },

  { w: "allocate", pos: "v.", zh: "分配；拨出", uk: "/ˈæləkeɪt/", us: "/ˈæləkeɪt/", cefr: "B2", topic: "work",
    senses: [{ pos: "v.", zh: "分配；拨出", en: "to distribute or assign for a particular purpose" }],
    ex: [{ en: "The budget allocates funds to public health.", zh: "预算把资金拨给了公共卫生。" },
         { en: "Each team was allocated a specific task.", zh: "每个小组都被分配了一项具体任务。" }],
    col: ["allocate resources｜分配资源", "allocate to｜分配给……", "fairly allocate｜公平分配"],
    fam: ["allocation (n.)"], syn: ["assign", "distribute"], ant: ["withhold", "keep"],
    tip: "搭配 allocate sth to sb/sth。" },

  { w: "anticipate", pos: "v.", zh: "预期；预料", uk: "/ænˈtɪsɪpeɪt/", us: "/ænˈtɪsɪpeɪt/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "v.", zh: "预期；预料", en: "to expect or look forward to something" }],
    ex: [{ en: "We anticipate a rise in demand next quarter.", zh: "我们预计下季度需求会上升。" },
         { en: "The system anticipates user needs automatically.", zh: "这个系统会自动预判用户需求。" }],
    col: ["anticipate change｜预见变化", "anticipate a problem｜预料到问题", "widely anticipated｜普遍预期"],
    fam: ["anticipation (n.)", "anticipatory (adj.)"], syn: ["expect", "foresee"], ant: ["ignore", "overlook"],
    tip: "比 expect 正式，常含“提前准备”意味。" },

  { w: "appraise", pos: "v.", zh: "评估；估价", uk: "/əˈpreɪz/", us: "/əˈpreɪz/", cefr: "B2", topic: "work",
    senses: [{ pos: "v.", zh: "评估；估价", en: "to assess the value or quality of something" }],
    ex: [{ en: "The bank appraised the house before the loan.", zh: "银行放贷前对房子作了估价。" },
         { en: "Managers appraise staff performance annually.", zh: "经理每年评估员工表现。" }],
    col: ["appraise the value｜评估价值", "appraise performance｜考核表现", "independently appraise｜独立评估"],
    fam: ["appraisal (n.)", "appraiser (n.)"], syn: ["evaluate", "assess"], ant: [],
    tip: "名词 appraisal（评估/考核）更常用。" },

  { w: "assert", pos: "v.", zh: "断言；坚持", uk: "/əˈsɜːt/", us: "/əˈsɜːrt/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "v.", zh: "断言；坚持", en: "to state firmly; to insist on one's rights" }],
    ex: [{ en: "He asserted that the data was reliable.", zh: "他断言那些数据是可靠的。" },
         { en: "You should assert your right to be heard.", zh: "你应该坚持自己被倾听的权利。" }],
    col: ["assert that｜断言……", "assert oneself｜坚持己见", "firmly assert｜坚定主张"],
    fam: ["assertion (n.)", "assertive (adj.)"], syn: ["declare", "insist"], ant: ["deny", "retract"],
    tip: "形容“自信表达”用 assertive（果断的）。" },

  { w: "assimilate", pos: "v.", zh: "吸收；同化", uk: "/əˈsɪmɪleɪt/", us: "/əˈsɪmɪleɪt/", cefr: "B2", topic: "society",
    senses: [{ pos: "v.", zh: "吸收；同化", en: "to absorb and integrate; to become part of a group" }],
    ex: [{ en: "The body assimilates nutrients from food.", zh: "身体从食物中吸收营养。" },
         { en: "Immigrants gradually assimilated into the culture.", zh: "移民逐渐融入了当地文化。" }],
    col: ["assimilate information｜吸收信息", "assimilate into｜融入……", "readily assimilate｜易于吸收"],
    fam: ["assimilation (n.)"], syn: ["absorb", "integrate"], ant: ["reject", "exclude"],
    tip: "既可指“消化吸收”，也可指“文化同化”。" },

  { w: "avert", pos: "v.", zh: "避免；转移", uk: "/əˈvɜːt/", us: "/əˈvɜːrt/", cefr: "B2", topic: "society",
    senses: [{ pos: "v.", zh: "避免；转移", en: "to prevent something bad; to turn away" }],
    ex: [{ en: "Quick action averted a major disaster.", zh: "迅速行动避免了一场大灾难。" },
         { en: "She averted her eyes from the scene.", zh: "她把目光从那一幕移开。" }],
    col: ["avert a crisis｜避免危机", "avert one's gaze｜移开目光", "narrowly avert｜勉强避免"],
    fam: ["aversion (n.)"], syn: ["prevent", "avoid"], ant: ["cause", "invite"],
    tip: "avert disaster/crisis（避免灾祸）是固定搭配。" },

  { w: "bolster", pos: "v.", zh: "支撑；增强", uk: "/ˈbəʊlstə(r)/", us: "/ˈboʊlstər/", cefr: "B2", topic: "economy",
    senses: [{ pos: "v.", zh: "支撑；增强", en: "to support or strengthen" }],
    ex: [{ en: "The policy bolstered public confidence.", zh: "这项政策增强了公众信心。" },
         { en: "Extra funds bolstered the struggling project.", zh: "额外资金支撑了那个举步维艰的项目。" }],
    col: ["bolster confidence｜增强信心", "bolster support｜加强支持", "bolster the economy｜提振经济"],
    fam: [], syn: ["strengthen", "boost"], ant: ["undermine", "weaken"],
    tip: "宾语多为 confidence / support / economy 类抽象词。" },

  { w: "compatible", pos: "adj.", zh: "兼容的；合得来的", uk: "/kəmˈpætəbl/", us: "/kəmˈpætəbl/", cefr: "B2", topic: "technology",
    senses: [{ pos: "adj.", zh: "兼容的；合得来的", en: "able to exist or work with something else" }],
    ex: [{ en: "The new software is compatible with old systems.", zh: "新软件与旧系统兼容。" },
         { en: "The two partners proved highly compatible.", zh: "两位合伙人证明非常合拍。" }],
    col: ["compatible with｜与……兼容", "mutually compatible｜彼此相容", "fully compatible｜完全兼容"],
    fam: ["compatibility (n.)"], syn: ["consistent", "suited"], ant: ["incompatible", "conflicting"],
    tip: "反义词 incompatible（不兼容/合不来）。" },

  { w: "comply", pos: "v.", zh: "遵从；服从", uk: "/kəmˈplaɪ/", us: "/kəmˈplaɪ/", cefr: "B2", topic: "government",
    senses: [{ pos: "v.", zh: "遵从；服从", en: "to act according to a rule or request" }],
    ex: [{ en: "All staff must comply with safety rules.", zh: "所有员工必须遵守安全规定。" },
         { en: "The factory failed to comply with the order.", zh: "那家工厂没有遵从指令。" }],
    col: ["comply with｜遵守……", "fail to comply｜未遵守", "fully comply｜完全遵从"],
    fam: ["compliance (n.)", "compliant (adj.)"], syn: ["obey", "conform"], ant: ["defy", "violate"],
    tip: "搭配 comply with；名词 compliance（合规）。" },

  { w: "contradict", pos: "v.", zh: "反驳；与…矛盾", uk: "/ˌkɒntrəˈdɪkt/", us: "/ˌkɑːntrəˈdɪkt/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "v.", zh: "反驳；与…矛盾", en: "to deny or be opposite to a statement" }],
    ex: [{ en: "His story contradicts the official report.", zh: "他的说法与官方报告矛盾。" },
         { en: "She hated to contradict her boss in public.", zh: "她不愿在公开场合反驳老板。" }],
    col: ["contradict oneself｜自相矛盾", "directly contradict｜直接反驳", "flatly contradict｜断然反驳"],
    fam: ["contradiction (n.)", "contradictory (adj.)"], syn: ["oppose", "deny"], ant: ["confirm", "corroborate"],
    tip: "名词 contradiction（矛盾）高频。" },

  { w: "defer", pos: "v.", zh: "推迟；遵从", uk: "/dɪˈfɜː(r)/", us: "/dɪˈfɜːr/", cefr: "B2", topic: "work",
    senses: [{ pos: "v.", zh: "推迟；遵从", en: "to postpone; to yield to another's wishes" }],
    ex: [{ en: "The decision was deferred until next month.", zh: "决定被推迟到了下个月。" },
         { en: "He deferred to the expert's judgement.", zh: "他遵从了专家的判断。" }],
    col: ["defer a decision｜推迟决定", "defer to｜遵从……", "defer payment｜延期付款"],
    fam: ["deference (n.)", "deferred (adj.)"], syn: ["postpone", "yield"], ant: ["expedite", "advance"],
    tip: "defer to sb（听从某人）；defer sth（推迟某事）。" },

  { w: "degrade", pos: "v.", zh: "降解；使恶化", uk: "/dɪˈɡreɪd/", us: "/dɪˈɡreɪd/", cefr: "B2", topic: "environment",
    senses: [{ pos: "v.", zh: "降解；使恶化", en: "to break down; to make worse in quality" }],
    ex: [{ en: "Plastic degrades very slowly in the ocean.", zh: "塑料在海洋中降解得非常慢。" },
         { en: "The scandal degraded public trust in the bank.", zh: "这桩丑闻损害了公众对该银行的信任。" }],
    col: ["degrade over time｜随时间退化", "biologically degrade｜生物降解", "degrade trust｜损害信任"],
    fam: ["degradation (n.)"], syn: ["deteriorate", "break down"], ant: ["improve", "enhance"],
    tip: "环保语境常指“降解/退化”。" },

  { w: "dwell", pos: "v.", zh: "居住；详述", uk: "/dwel/", us: "/dwel/", cefr: "B2", topic: "daily",
    senses: [{ pos: "v.", zh: "居住；详述", en: "to live in a place; to think or speak at length" }],
    ex: [{ en: "They dwell in a small village by the lake.", zh: "他们住在湖边一个小村里。" },
         { en: "Don't dwell on past mistakes.", zh: "别老纠结过去的错误。" }],
    col: ["dwell on｜详述/纠结于", "dwell in｜居住在……", "dwell upon｜沉思于"],
    fam: ["dwelling (n.)"], syn: ["reside", "linger"], ant: ["ignore", "skip"],
    tip: "dwell on/upon 表“反复想/说某事”，常带负面。" },

  { w: "eligible", pos: "adj.", zh: "有资格的；合格的", uk: "/ˈelɪdʒəbl/", us: "/ˈelɪdʒəbl/", cefr: "B2", topic: "work",
    senses: [{ pos: "adj.", zh: "有资格的；合格的", en: "having the right to do or receive something" }],
    ex: [{ en: "Only members are eligible for the discount.", zh: "只有会员才有资格享受折扣。" },
         { en: "She is eligible to apply for the grant.", zh: "她符合申请这笔资助的资格。" }],
    col: ["eligible for｜有资格获得", "eligible to｜有资格做", "make eligible｜使合格"],
    fam: ["eligibility (n.)"], syn: ["qualified", "entitled"], ant: ["ineligible", "unqualified"],
    tip: "搭配 be eligible for / to do。" },

  { w: "emanate", pos: "v.", zh: "散发；发源", uk: "/ˈeməneɪt/", us: "/ˈeməneɪt/", cefr: "B2", topic: "science",
    senses: [{ pos: "v.", zh: "散发；发源", en: "to come out from a source" }],
    ex: [{ en: "A warm light emanated from the window.", zh: "温暖的光从窗口透出来。" },
         { en: "The policy emanated from the finance ministry.", zh: "这项政策源自财政部。" }],
    col: ["emanate from｜源自……", "light emanates｜光散发", "emanate confidence｜流露自信"],
    fam: ["emanation (n.)"], syn: ["originate", "radiate"], ant: [],
    tip: "几乎总与 from 连用。" },

  { w: "engender", pos: "v.", zh: "产生；引起", uk: "/ɪnˈdʒendə(r)/", us: "/ɪnˈdʒendər/", cefr: "B2", topic: "society",
    senses: [{ pos: "v.", zh: "产生；引起", en: "to cause or give rise to a feeling or situation" }],
    ex: [{ en: "Open communication engenders trust.", zh: "坦诚沟通能带来信任。" },
         { en: "The reform engendered fierce debate.", zh: "这项改革引发了激烈争论。" }],
    col: ["engender trust｜唤起信任", "engender support｜赢得支持", "engender conflict｜引发冲突"],
    fam: [], syn: ["generate", "provoke"], ant: ["quell", "suppress"],
    tip: "比 cause 正式，宾语多为抽象事物。" },

  { w: "entail", pos: "v.", zh: "必然带来；需要", uk: "/ɪnˈteɪl/", us: "/ɪnˈteɪl/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "v.", zh: "必然带来；需要", en: "to involve something as a necessary part" }],
    ex: [{ en: "The job entails long working hours.", zh: "这份工作必然意味着长时间加班。" },
         { en: "Moving abroad entails many changes.", zh: "移居国外必然带来许多改变。" }],
    col: ["entail risks｜带来风险", "entail costs｜产生费用", "necessarily entail｜必然导致"],
    fam: [], syn: ["involve", "require"], ant: [],
    tip: "宾语是“伴随而来的代价/步骤”，不是主语本身。" },

  { w: "extract", pos: "v.", zh: "提取；摘录", uk: "/ɪkˈstrækt/", us: "/ɪkˈstrækt/", cefr: "B2", topic: "science",
    senses: [{ pos: "v.", zh: "提取；摘录", en: "to remove or obtain from a source" }],
    ex: [{ en: "Engineers extracted data from the damaged drive.", zh: "工程师从损坏的硬盘里提取了数据。" },
         { en: "You can extract the key point from her speech.", zh: "你可以从她的演讲中提炼出要点。" }],
    col: ["extract from｜从……提取", "extract data｜提取数据", "extract a tooth｜拔牙"],
    fam: ["extraction (n.)"], syn: ["remove", "derive"], ant: ["insert", "inject"],
    tip: "名词 extract（摘录/提取物）读作 /ˈekstrækt/。" },

  { w: "hamper", pos: "v.", zh: "妨碍；束缚", uk: "/ˈhæmpə(r)/", us: "/ˈhæmpər/", cefr: "B2", topic: "work",
    senses: [{ pos: "v.", zh: "妨碍；束缚", en: "to make difficult or slow" }],
    ex: [{ en: "Bad weather hampered the rescue effort.", zh: "恶劣天气妨碍了救援工作。" },
         { en: "Strict rules hampered creative work.", zh: "严苛的规则束缚了创造性工作。" }],
    col: ["hamper progress｜阻碍进展", "hamper efforts｜妨碍努力", "severely hamper｜严重妨碍"],
    fam: [], syn: ["hinder", "impede"], ant: ["aid", "facilitate"],
    tip: "比 prevent 轻，指“拖慢/添乱”而非完全阻止。" },

  { w: "impartial", pos: "adj.", zh: "公正的；不偏不倚的", uk: "/ɪmˈpɑːʃl/", us: "/ɪmˈpɑːrʃl/", cefr: "B2", topic: "society",
    senses: [{ pos: "adj.", zh: "公正的；不偏不倚的", en: "treating all sides equally; fair" }],
    ex: [{ en: "The judge must remain impartial at all times.", zh: "法官必须始终保持公正。" },
         { en: "We need an impartial observer for the test.", zh: "我们需要一位不偏不倚的观察员来测试。" }],
    col: ["impartial judge｜公正的法官", "remain impartial｜保持中立", "perfectly impartial｜完全公正"],
    fam: ["impartiality (n.)"], syn: ["neutral", "unbiased"], ant: ["biased", "partial"],
    tip: "反义词 biased（有偏见的）。" },

  { w: "inherent", pos: "adj.", zh: "固有的；内在的", uk: "/ɪnˈhɪərənt/", us: "/ɪnˈhɪrənt/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "adj.", zh: "固有的；内在的", en: "existing as a natural and permanent part" }],
    ex: [{ en: "Every system has some inherent risk.", zh: "任何系统都有一些固有风险。" },
         { en: "He has an inherent sense of fairness.", zh: "他有一种天生的公平感。" }],
    col: ["inherent risk｜固有风险", "inherent in｜……固有的", "inherent weakness｜内在缺陷"],
    fam: ["inherently (adv.)"], syn: ["intrinsic", "built-in"], ant: ["external", "acquired"],
    tip: "搭配 inherent in sth；副词 inherently 很常用。" },

  { w: "instigate", pos: "v.", zh: "煽动；发起", uk: "/ˈɪnstɪɡeɪt/", us: "/ˈɪnstɪɡeɪt/", cefr: "B2", topic: "society",
    senses: [{ pos: "v.", zh: "煽动；发起", en: "to cause an event or action to begin" }],
    ex: [{ en: "He instigated the protest against the plant.", zh: "他发起了对那家工厂的抗议。" },
         { en: "Who instigated the fight remains unclear.", zh: "是谁挑起这场斗殴仍不清楚。" }],
    col: ["instigate a strike｜煽动罢工", "instigate change｜推动变革", "instigate violence｜挑起暴力"],
    fam: ["instigation (n.)", "instigator (n.)"], syn: ["provoke", "initiate"], ant: ["quell", "halt"],
    tip: "常带贬义（煽动坏事），也可中性（发起）。" },

  { w: "intrinsic", pos: "adj.", zh: "内在的；本质的", uk: "/ɪnˈtrɪnzɪk/", us: "/ɪnˈtrɪnzɪk/", cefr: "B2", topic: "thinking",
    senses: [{ pos: "adj.", zh: "内在的；本质的", en: "belonging to the essential nature of something" }],
    ex: [{ en: "The intrinsic value of art is hard to price.", zh: "艺术的内在价值很难定价。" },
         { en: "Motivation should be intrinsic, not forced.", zh: "动力应当是发自内在的，而非被强迫。" }],
    col: ["intrinsic value｜内在价值", "intrinsic worth｜本质价值", "intrinsically motivated｜内在驱动的"],
    fam: ["intrinsically (adv.)"], syn: ["inherent", "essential"], ant: ["extrinsic", "superficial"],
    tip: "与 inherent 近义，强调“本质就有”。" },

  { w: "invoke", pos: "v.", zh: "援引；调用", uk: "/ɪnˈvəʊk/", us: "/ɪnˈvoʊk/", cefr: "B2", topic: "government",
    senses: [{ pos: "v.", zh: "援引；调用", en: "to call upon a law or power; to use in speech" }],
    ex: [{ en: "The court invoked an old statute in the case.", zh: "法庭在本案中援引了一条旧法规。" },
         { en: "The function invokes a remote service.", zh: "这个函数调用了一个远程服务。" }],
    col: ["invoke a law｜援引法律", "invoke support｜请求支持", "invoke memory｜唤起记忆"],
    fam: ["invocation (n.)"], syn: ["cite", "summon"], ant: [],
    tip: "法律/技术语境都常用：援引条款、调用函数。" },

  { w: "liable", pos: "adj.", zh: "有责任的；易…的", uk: "/ˈlaɪəbl/", us: "/ˈlaɪəbl/", cefr: "B2", topic: "government",
    senses: [{ pos: "adj.", zh: "有责任的；易…的", en: "legally responsible; likely to do or suffer something" }],
    ex: [{ en: "The firm is liable for the damage caused.", zh: "该公司对造成的损害负有责任。" },
         { en: "Old wiring is liable to cause fires.", zh: "老化的线路容易引发火灾。" }],
    col: ["liable for｜对……负责", "liable to｜易于……", "held liable｜被认定有责"],
    fam: ["liability (n.)"], syn: ["responsible", "apt"], ant: ["exempt", "immune"],
    tip: "liable for（负责）/ liable to（易于）；名词 liability（责任/负债）。" },

  // ===================== C1 =====================
  { w: "acquiesce", pos: "v.", zh: "默许；勉强同意", uk: "/ˌækwiˈes/", us: "/ˌækwiˈes/", cefr: "C1", topic: "society",
    senses: [{ pos: "v.", zh: "默许；勉强同意", en: "to accept or agree without protest" }],
    ex: [{ en: "The board acquiesced in the CEO's plan.", zh: "董事会默许了CEO的计划。" },
         { en: "She acquiesced to the demand reluctantly.", zh: "她不情愿地答应了那项要求。" }],
    col: ["acquiesce in｜默许……", "acquiesce to｜顺从……", "quietly acquiesce｜默默同意"],
    fam: ["acquiescence (n.)"], syn: ["consent", "yield"], ant: ["resist", "object"],
    tip: "比 agree 正式，含“不情愿、不抗议”的意味。" },

  { w: "amenable", pos: "adj.", zh: "顺从的；愿接受的", uk: "/əˈmiːnəbl/", us: "/əˈmiːnəbl/", cefr: "C1", topic: "society",
    senses: [{ pos: "adj.", zh: "顺从的；愿接受的", en: "willing to be influenced or controlled" }],
    ex: [{ en: "The committee was amenable to the proposal.", zh: "委员会愿意接受这个提议。" },
         { en: "He is amenable to reason and advice.", zh: "他乐于接受道理和劝告。" }],
    col: ["amenable to｜愿意接受……", "amenable child｜听话的孩子", "remain amenable｜依旧顺从"],
    fam: ["amenability (n.)"], syn: ["cooperative", "open"], ant: ["stubborn", "resistant"],
    tip: "搭配 be amenable to sth。" },

  { w: "amicable", pos: "adj.", zh: "友善的；和睦的", uk: "/ˈæmɪkəbl/", us: "/ˈæmɪkəbl/", cefr: "C1", topic: "society",
    senses: [{ pos: "adj.", zh: "友善的；和睦的", en: "characterised by friendliness and agreement" }],
    ex: [{ en: "They reached an amicable settlement out of court.", zh: "他们在庭外达成了和睦的和解。" },
         { en: "Despite the split, their parting was amicable.", zh: "尽管分开了，他们的离别是平和的。" }],
    col: ["amicable split｜平和分手", "amicable deal｜友好协议", "remain amicable｜保持和睦"],
    fam: ["amicably (adv.)"], syn: ["friendly", "cordial"], ant: ["hostile", "bitter"],
    tip: "常用于分手/离婚/解散等“好聚好散”场景。" },

  { w: "anomaly", pos: "n.", zh: "异常；反常", uk: "/əˈnɒməli/", us: "/əˈnɑːməli/", cefr: "C1", topic: "science",
    senses: [{ pos: "n.", zh: "异常；反常", en: "something that deviates from what is normal" }],
    ex: [{ en: "The spike in sales was an anomaly, not a trend.", zh: "销量飙升是个异常，不是趋势。" },
         { en: "Scientists studied the magnetic anomaly.", zh: "科学家研究了那个磁场异常。" }],
    col: ["statistical anomaly｜统计异常", "an anomaly in｜……中的异常", "apparent anomaly｜明显反常"],
    fam: ["anomalous (adj.)"], syn: ["abnormality", "oddity"], ant: ["norm", "regularity"],
    tip: "形容词 anomalous（反常的）。" },

  { w: "apprehensive", pos: "adj.", zh: "忧虑的；不安的", uk: "/ˌæprɪˈhensɪv/", us: "/ˌæprɪˈhensɪv/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "忧虑的；不安的", en: "anxious or fearful about the future" }],
    ex: [{ en: "She felt apprehensive about the interview.", zh: "她对这次面试感到忐忑。" },
         { en: "Parents are apprehensive of rising costs.", zh: "家长对上涨的开支感到担忧。" }],
    col: ["apprehensive about｜对……不安", "apprehensive of｜担心……", "increasingly apprehensive｜愈发忧虑"],
    fam: ["apprehension (n.)"], syn: ["anxious", "uneasy"], ant: ["confident", "reassured"],
    tip: "搭配 about / of；名词 apprehension（忧虑）。" },

  { w: "austerity", pos: "n.", zh: "紧缩；简朴", uk: "/ɔːˈsterəti/", us: "/ɔːˈsterəti/", cefr: "C1", topic: "economy",
    senses: [{ pos: "n.", zh: "紧缩；简朴", en: "strict economy; severe simplicity" }],
    ex: [{ en: "The government imposed years of austerity.", zh: "政府实施了多年的财政紧缩。" },
         { en: "Monks live a life of austerity.", zh: "僧侣过着简朴的生活。" }],
    col: ["austerity measures｜紧缩措施", "period of austerity｜紧缩时期", "economic austerity｜经济紧缩"],
    fam: ["austere (adj.)"], syn: ["frugality", "thrift"], ant: ["extravagance", "luxury"],
    tip: "形容词 austere（简朴的/严厉的）。" },

  { w: "benign", pos: "adj.", zh: "良性的；温和的", uk: "/bɪˈnaɪn/", us: "/bɪˈnaɪn/", cefr: "C1", topic: "health",
    senses: [{ pos: "adj.", zh: "良性的；温和的", en: "harmless; gentle and kind" }],
    ex: [{ en: "The tumour turned out to be benign.", zh: "那个肿瘤结果竟是良性的。" },
         { en: "A benign climate suits the crops.", zh: "温和的气候适合这些作物。" }],
    col: ["benign tumour｜良性肿瘤", "benign climate｜温和气候", "benign neglect｜善意的放任"],
    fam: [], syn: ["harmless", "mild"], ant: ["malignant", "harmful"],
    tip: "医学里反义词 malignant（恶性的）。" },

  { w: "brevity", pos: "n.", zh: "简洁；短暂", uk: "/ˈbrevəti/", us: "/ˈbrevəti/", cefr: "C1", topic: "thinking",
    senses: [{ pos: "n.", zh: "简洁；短暂", en: "the quality of being short or concise" }],
    ex: [{ en: "The brevity of her reply was telling.", zh: "她回答之简短很说明问题。" },
         { en: "Brevity is valued in news headlines.", zh: "新闻标题贵在简练。" }],
    col: ["for brevity｜为简洁起见", "remarkable brevity｜惊人的简洁", "brevity of life｜生命短暂"],
    fam: ["brief (adj.)"], syn: ["conciseness", "shortness"], ant: ["verbosity", "length"],
    tip: "形容词 brief（简短的）；brevity 强调“短而好”。" },

  { w: "brusque", pos: "adj.", zh: "粗鲁的；生硬的", uk: "/brʊsk/", us: "/brʌsk/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "粗鲁的；生硬的", en: "rudely abrupt in speech or manner" }],
    ex: [{ en: "His brusque manner annoyed the guests.", zh: "他生硬的态度惹恼了客人。" },
         { en: "She gave a brusque reply and left.", zh: "她生硬地回了一句就走了。" }],
    col: ["brusque manner｜生硬的态度", "brusque reply｜唐突的回答", "rather brusque｜颇不耐烦的"],
    fam: ["brusquely (adv.)"], syn: ["abrupt", "curt"], ant: ["polite", "gentle"],
    tip: "比 rude 更具体，指“突兀、没耐心的直”。" },

  { w: "conducive", pos: "adj.", zh: "有助于…的；有益的", uk: "/kənˈdjuːsɪv/", us: "/kənˈduːsɪv/", cefr: "C1", topic: "thinking",
    senses: [{ pos: "adj.", zh: "有助于…的；有益的", en: "making a situation likely to be successful" }],
    ex: [{ en: "A quiet room is conducive to study.", zh: "安静的房间有利于学习。" },
         { en: "The climate is conducive to outdoor life.", zh: "这种气候适合户外生活。" }],
    col: ["conducive to｜有助于……", "conducive environment｜有利环境", "hardly conducive｜无益于"],
    fam: [], syn: ["favourable", "helpful"], ant: ["hindering", "unfavourable"],
    tip: "几乎总与 to 连用：conducive to sth。" },

  { w: "conjecture", pos: "n.", zh: "推测；猜想", uk: "/kənˈdʒektʃə(r)/", us: "/kənˈdʒektʃər/", cefr: "C1", topic: "thinking",
    senses: [{ pos: "n.", zh: "推测；猜想", en: "an opinion formed by guessing" },
             { pos: "v.", zh: "推测", en: "to guess on the basis of incomplete evidence" }],
    ex: [{ en: "Her explanation was pure conjecture.", zh: "她的解释纯属猜测。" },
         { en: "Experts conjecture about the cause.", zh: "专家对原因进行推测。" }],
    col: ["mere conjecture｜纯属臆测", "conjecture that｜猜测……", "wild conjecture｜胡乱猜测"],
    fam: ["conjectural (adj.)"], syn: ["guess", "speculation"], ant: ["fact", "certainty"],
    tip: "比 guess 正式，含“基于蛛丝马迹的推断”。" },

  { w: "decry", pos: "v.", zh: "谴责；贬低", uk: "/dɪˈkraɪ/", us: "/dɪˈkraɪ/", cefr: "C1", topic: "society",
    senses: [{ pos: "v.", zh: "谴责；贬低", en: "to publicly condemn or belittle" }],
    ex: [{ en: "Critics decried the plan as reckless.", zh: "评论家谴责该计划鲁莽草率。" },
         { en: "He decried the decline of civic virtues.", zh: "他痛斥公民美德的衰退。" }],
    col: ["decry as｜谴责为……", "publicly decry｜公开谴责", "decry the trend｜抨击趋势"],
    fam: [], syn: ["condemn", "denounce"], ant: ["praise", "applaud"],
    tip: "比 criticise 重，带“公开声讨”味。" },

  { w: "deference", pos: "n.", zh: "尊重；顺从", uk: "/ˈdefərəns/", us: "/ˈdefərəns/", cefr: "C1", topic: "society",
    senses: [{ pos: "n.", zh: "尊重；顺从", en: "polite respect shown towards another" }],
    ex: [{ en: "We listened with deference to the elder.", zh: "我们恭敬地听那位长者讲话。" },
         { en: "Out of deference, she withdrew the idea.", zh: "出于尊重，她收回了那个想法。" }],
    col: ["in deference to｜出于对……的尊重", "show deference｜表示敬意", "deference to elders｜敬重长辈"],
    fam: ["deferential (adj.)"], syn: ["respect", "regard"], ant: ["disrespect", "contempt"],
    tip: "常用 in deference to（看在……面子上）。" },

  { w: "erstwhile", pos: "adj.", zh: "以前的；曾经的", uk: "/ˈɜːstwaɪz/", us: "/ˈɜːrstwaɪz/", cefr: "C1", topic: "history",
    senses: [{ pos: "adj.", zh: "以前的；曾经的", en: "former; previous" }],
    ex: [{ en: "Her erstwhile partner now runs a rival firm.", zh: "她从前的搭档如今经营一家对手公司。" },
         { en: "The erstwhile capital fell into decline.", zh: "那座旧都逐渐衰落了。" }],
    col: ["erstwhile friend｜旧友", "erstwhile capital｜旧都", "erstwhile rival｜昔日的对手"],
    fam: [], syn: ["former", "previous"], ant: ["current", "present"],
    tip: "书面/文学用语，等于 former。" },

  { w: "fervent", pos: "adj.", zh: "热烈的；炽热的", uk: "/ˈfɜːvənt/", us: "/ˈfɜːrvənt/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "热烈的；炽热的", en: "having or showing intense feeling" }],
    ex: [{ en: "She is a fervent supporter of the arts.", zh: "她是艺术的热烈支持者。" },
         { en: "He made a fervent appeal for peace.", zh: "他发出了炽热的和平呼吁。" }],
    col: ["fervent hope｜热切的希望", "fervent supporter｜狂热支持者", "fervent belief｜笃信"],
    fam: ["fervently (adv.)", "fervour (n.)"], syn: ["passionate", "ardent"], ant: ["indifferent", "lukewarm"],
    tip: "名词 fervour（热情）英式拼写，美式 fervor。" },

  { w: "fractious", pos: "adj.", zh: "易怒的；难管的", uk: "/ˈfrækʃəs/", us: "/ˈfrækʃəs/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "易怒的；难管的", en: "irritable and hard to control" }],
    ex: [{ en: "The fractious crowd tested the police.", zh: "那群易怒的人考验了警力。" },
         { en: "A fractious child needs patience.", zh: "难管的孩子需要耐心。" }],
    col: ["fractious mood｜烦躁情绪", "fractious debate｜激烈的争论", "increasingly fractious｜愈发难缠"],
    fam: [], syn: ["irritable", "unruly"], ant: ["docile", "calm"],
    tip: "形容人“一点就着”或局面“难控制”。" },

  { w: "hackneyed", pos: "adj.", zh: "陈腐的；老套的", uk: "/ˈhækniːd/", us: "/ˈhækniːd/", cefr: "C1", topic: "arts",
    senses: [{ pos: "adj.", zh: "陈腐的；老套的", en: "overused and no longer effective" }],
    ex: [{ en: "The speech was full of hackneyed phrases.", zh: "那篇演讲满是陈词滥调。" },
         { en: "Avoid hackneyed metaphors in your essay.", zh: "作文里要避开老套的比喻。" }],
    col: ["hackneyed phrase｜陈词滥调", "hackneyed image｜俗套意象", "rather hackneyed｜颇为老套"],
    fam: [], syn: ["clichéd", "trite"], ant: ["original", "fresh"],
    tip: "与 cliché（陈词）近义，指“用烂了”。" },

  { w: "incisive", pos: "adj.", zh: "犀利的；敏锐的", uk: "/ɪnˈsaɪsɪv/", us: "/ɪnˈsaɪsɪv/", cefr: "C1", topic: "thinking",
    senses: [{ pos: "adj.", zh: "犀利的；敏锐的", en: "clear, direct, and mentally sharp" }],
    ex: [{ en: "She asked an incisive question that cut to the core.", zh: "她问了一个直击核心的犀利问题。" },
         { en: "His incisive analysis won praise.", zh: "他敏锐的分析赢得了赞许。" }],
    col: ["incisive mind｜敏锐的头脑", "incisive analysis｜精辟分析", "incisive comment｜一针见血的点评"],
    fam: ["incisively (adv.)"], syn: ["penetrating", "sharp"], ant: ["vague", "superficial"],
    tip: "形容分析/提问“切中要害”。" },

  { w: "ingratiate", pos: "v.", zh: "讨好；迎合", uk: "/ɪnˈɡreɪʃieɪt/", us: "/ɪnˈɡreɪʃieɪt/", cefr: "C1", topic: "society",
    senses: [{ pos: "v.", zh: "讨好；迎合", en: "to bring oneself into favour with someone" }],
    ex: [{ en: "He tried to ingratiate himself with the boss.", zh: "他试图讨好老板。" },
         { en: "She never ingratiates; she earns respect.", zh: "她从不逢迎，而是赢得尊重。" }],
    col: ["ingratiate oneself｜讨好别人", "ingratiate with｜迎合……", "blatantly ingratiate｜公然巴结"],
    fam: ["ingratiating (adj.)"], syn: ["court", "flatter"], ant: ["alienate", "offend"],
    tip: "常带轻微贬义（刻意讨好）。" },

  { w: "insidious", pos: "adj.", zh: "暗中为害的；潜伏的", uk: "/ɪnˈsɪdiəs/", us: "/ɪnˈsɪdiəs/", cefr: "C1", topic: "health",
    senses: [{ pos: "adj.", zh: "暗中为害的；潜伏的", en: "proceeding harmfully in a subtle way" }],
    ex: [{ en: "Diabetes is an insidious disease.", zh: "糖尿病是一种潜伏性的疾病。" },
         { en: "The insidious spread of misinformation worries us.", zh: "错误信息的暗中蔓延让我们担忧。" }],
    col: ["insidious threat｜隐性威胁", "insidious effect｜潜在危害", "insidious decline｜不知不觉的衰退"],
    fam: ["insidiously (adv.)"], syn: ["subtle", "creeping"], ant: ["obvious", "blatant"],
    tip: "强调“悄悄变坏，发现时已晚”。" },

  { w: "intractable", pos: "adj.", zh: "难对付的；倔强的", uk: "/ɪnˈtræktəbl/", us: "/ɪnˈtræktəbl/", cefr: "C1", topic: "thinking",
    senses: [{ pos: "adj.", zh: "难对付的；倔强的", en: "hard to control or solve" }],
    ex: [{ en: "The conflict proved intractable.", zh: "这场冲突证明难以化解。" },
         { en: "He is an intractable negotiator.", zh: "他是个难缠的谈判者。" }],
    col: ["intractable problem｜棘手问题", "intractable pain｜难治的痛", "politically intractable｜政治上难解"],
    fam: [], syn: ["stubborn", "unmanageable"], ant: ["tractable", "docile"],
    tip: "反义词 tractable（易处理的）。" },

  { w: "ire", pos: "n.", zh: "愤怒；怒火", uk: "/ˈaɪə(r)/", us: "/ˈaɪər/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "n.", zh: "愤怒；怒火", en: "anger or rage" }],
    ex: [{ en: "The decision drew the ire of voters.", zh: "这项决定招致了选民的怒火。" },
         { en: "He incurred her ire by arriving late.", zh: "他因为迟到惹恼了她。" }],
    col: ["draw sb's ire｜招致某人愤怒", "incur ire｜惹怒", "provoke ire｜激起怒火"],
    fam: [], syn: ["wrath", "anger"], ant: ["calm", "delight"],
    tip: "书面/文学用语，等于 anger。" },

  { w: "laconic", pos: "adj.", zh: "简洁的；惜字的", uk: "/ləˈkɒnɪk/", us: "/ləˈkɑːnɪk/", cefr: "C1", topic: "arts",
    senses: [{ pos: "adj.", zh: "简洁的；惜字的", en: "using very few words" }],
    ex: [{ en: "His laconic reply ended the conversation.", zh: "他惜字如金的回答结束了对话。" },
         { en: "The general was famous for laconic orders.", zh: "那位将军以简练的命令行事著称。" }],
    col: ["laconic reply｜简短的答复", "laconic style｜洗练风格", "characteristically laconic｜一贯惜字"],
    fam: ["laconically (adv.)"], syn: ["terse", "brief"], ant: ["verbose", "wordy"],
    tip: "比 brief 更文雅，指“言简意赅到冷淡”。" },

  { w: "magnanimous", pos: "adj.", zh: "宽宏大量的", uk: "/mæɡˈnænɪməs/", us: "/mæɡˈnænɪməs/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "宽宏大量的", en: "generous and forgiving, especially to a rival" }],
    ex: [{ en: "The winner was magnanimous in victory.", zh: "获胜者胜得大度。" },
         { en: "She made a magnanimous gesture of peace.", zh: "她做出了一个宽宏的和平姿态。" }],
    col: ["magnanimous gesture｜大度的姿态", "magnanimous leader｜宽宏的领袖", "truly magnanimous｜真正大度"],
    fam: ["magnanimity (n.)"], syn: ["generous", "forgiving"], ant: ["petty", "spiteful"],
    tip: "名词 magnanimity（宽宏）。" },

  { w: "morose", pos: "adj.", zh: "忧郁的；阴郁的", uk: "/məˈrəʊs/", us: "/məˈroʊs/", cefr: "C1", topic: "emotion",
    senses: [{ pos: "adj.", zh: "忧郁的；阴郁的", en: "sullen and gloomy in mood" }],
    ex: [{ en: "He became morose after the loss.", zh: "失败后他变得郁郁寡欢。" },
         { en: "A morose silence fell over the room.", zh: "屋里笼罩着一阵阴郁的沉默。" }],
    col: ["morose mood｜阴郁情绪", "morose silence｜沉闷的沉默", "gloomy and morose｜忧郁消沉"],
    fam: ["morosely (adv.)"], syn: ["gloomy", "sullen"], ant: ["cheerful", "genial"],
    tip: "形容“闷闷不乐、不爱搭理人”。" },

  { w: "obsequious", pos: "adj.", zh: "谄媚的；过分恭顺的", uk: "/əbˈsiːkwiəs/", us: "/əbˈsiːkwiəs/", cefr: "C1", topic: "society",
    senses: [{ pos: "adj.", zh: "谄媚的；过分恭顺的", en: "excessively eager to please" }],
    ex: [{ en: "The obsequious clerk flattered every customer.", zh: "那个谄媚的店员对每位顾客都奉承。" },
         { en: "His obsequious tone annoyed the manager.", zh: "他过分恭顺的语气惹烦了经理。" }],
    col: ["obsequious manner｜谄媚态度", "obsequious smile｜讨好的笑", "fawningly obsequious｜奴颜婢膝"],
    fam: ["obsequiously (adv.)"], syn: ["sycophantic", "servile"], ant: ["assertive", "dignified"],
    tip: "贬义，形容“卑躬屈膝地讨好”。" },

  { w: "oligarchy", pos: "n.", zh: "寡头统治", uk: "/ˈɒlɪɡɑːki/", us: "/ˈɑːlɪɡɑːrki/", cefr: "C1", topic: "government",
    senses: [{ pos: "n.", zh: "寡头统治", en: "rule by a small group of people" }],
    ex: [{ en: "Critics called the regime an oligarchy.", zh: "批评者称该政权为寡头统治。" },
         { en: "The firm ran like an oligarchy of founders.", zh: "这家公司像创始人寡头般运作。" }],
    col: ["rule by oligarchy｜寡头执政", "corporate oligarchy｜企业寡头", "entrenched oligarchy｜根深蒂固的寡头"],
    fam: ["oligarch (n.)"], syn: ["plutocracy", "elite rule"], ant: ["democracy"],
    tip: "oligarch（寡头/富豪）常见于新闻。" },

  { w: "pellucid", pos: "adj.", zh: "清澈的；清晰的", uk: "/pəˈluːsɪd/", us: "/pəˈluːsɪd/", cefr: "C1", topic: "nature",
    senses: [{ pos: "adj.", zh: "清澈的；清晰的", en: "transparently clear, in water or in meaning" }],
    ex: [{ en: "The lake was pellucid and still.", zh: "湖水清澈而平静。" },
         { en: "She wrote in a pellucid prose style.", zh: "她的散文风格清晰明了。" }],
    col: ["pellucid water｜清澈的水", "pellucid prose｜晓畅的散文", "pellucid logic｜清晰的逻辑"],
    fam: [], syn: ["limpid", "clear"], ant: ["murky", "obscure"],
    tip: "既可形容水质清，也可形容文字/思路清。" },

  // ===================== C2 =====================
  { w: "adumbrate", pos: "v.", zh: "勾勒；预示", uk: "/ˈædəmbreɪt/", us: "/ˈædəmbreɪt/", cefr: "C2", topic: "thinking",
    senses: [{ pos: "v.", zh: "勾勒；预示", en: "to outline faintly; to foreshadow" }],
    ex: [{ en: "The report adumbrates a shift in policy.", zh: "报告隐约勾勒出政策的转向。" },
         { en: "His words adumbrated the coming crisis.", zh: "他的话预示了即将到来的危机。" }],
    col: ["adumbrate a plan｜勾勒计划", "adumbrate change｜预示变化", "faintly adumbrate｜隐约勾勒"],
    fam: ["adumbration (n.)"], syn: ["sketch", "foreshadow"], ant: ["conceal", "obscure"],
    tip: "偏文学，指“淡淡地描出轮廓或先兆”。" },

  { w: "apotheosis", pos: "n.", zh: "顶峰；神化", uk: "/əˌpɒθiˈəʊsɪs/", us: "/əˌpɑːθiˈoʊsɪs/", cefr: "C2", topic: "arts",
    senses: [{ pos: "n.", zh: "顶峰；神化", en: "the highest point or ideal form of something" }],
    ex: [{ en: "The film is the apotheosis of the genre.", zh: "这部电影是该类型的巅峰之作。" },
         { en: "His career reached its apotheosis that night.", zh: "那晚他的事业登峰造极。" }],
    col: ["apotheosis of｜……的极致", "reach apotheosis｜达到顶峰", "the apotheosis of style｜风格的极致"],
    fam: [], syn: ["pinnacle", "epitome"], ant: ["nadir", "low point"],
    tip: "比 peak 更宏大，带“封神/登顶”意味。" },

  { w: "cacophony", pos: "n.", zh: "刺耳的嘈杂声", uk: "/kəˈkɒfəni/", us: "/kəˈkɑːfəni/", cefr: "C2", topic: "arts",
    senses: [{ pos: "n.", zh: "刺耳的嘈杂声", en: "a harsh, discordant mixture of sounds" }],
    ex: [{ en: "A cacophony of car horns filled the street.", zh: "街上一片刺耳的汽车喇叭声。" },
         { en: "The debate dissolved into cacophony.", zh: "那场辩论最终沦为一片吵嚷。" }],
    col: ["a cacophony of｜一片……的嘈杂", "utter cacophony｜全然的喧闹", "cacophony of voices｜人声鼎沸"],
    fam: ["cacophonous (adj.)"], syn: ["discord", "clamour"], ant: ["harmony", "silence"],
    tip: "形容词 cacophonous（刺耳的）。" },

  { w: "calumny", pos: "n.", zh: "诽谤；诬蔑", uk: "/ˈkæləmni/", us: "/ˈkæləmni/", cefr: "C2", topic: "society",
    senses: [{ pos: "n.", zh: "诽谤；诬蔑", en: "a false statement meant to injure reputation" }],
    ex: [{ en: "He sued the paper for calumny.", zh: "他起诉那家报纸诽谤。" },
         { en: "The speech was a tissue of calumny.", zh: "那篇讲话通篇都是诬蔑。" }],
    col: ["utter calumny｜公然诽谤", "a vicious calumny｜恶毒诽谤", "subject to calumny｜遭诽谤"],
    fam: ["calumniate (v.)"], syn: ["slander", "libel"], ant: ["praise", "truth"],
    tip: "比 slander 更书面，指“蓄意诬陷”。" },

  { w: "chimerical", pos: "adj.", zh: "空想的；虚幻的", uk: "/kaɪˈmerɪkl/", us: "/kaɪˈmerɪkl/", cefr: "C2", topic: "thinking",
    senses: [{ pos: "adj.", zh: "空想的；虚幻的", en: "wildly fanciful and impossible" }],
    ex: [{ en: "The plan proved chimerical and was dropped.", zh: "这个计划被证明是空想，于是被放弃。" },
         { en: "He chased a chimerical dream of wealth.", zh: "他追逐着一个虚幻的致富梦。" }],
    col: ["chimerical hope｜虚幻的希望", "chimerical scheme｜空想的计划", "utterly chimerical｜全然不切实际"],
    fam: ["chimera (n.)"], syn: ["fantastic", "illusory"], ant: ["realistic", "practical"],
    tip: "源自 Chimera（希腊神话异兽），指“不可能实现的”。" },

  { w: "circumlocution", pos: "n.", zh: "迂回说法；赘语", uk: "/ˌsɜːkəmləˈkjuːʃn/", us: "/ˌsɜːrkəmləˈkjuːʃn/", cefr: "C2", topic: "thinking",
    senses: [{ pos: "n.", zh: "迂回说法；赘语", en: "the use of many words where few would do" }],
    ex: [{ en: "His answer was a masterpiece of circumlocution.", zh: "他的回答堪称迂回绕弯的典范。" },
         { en: "Bureaucrats favour circumlocution.", zh: "官僚们偏爱转弯抹角的说法。" }],
    col: ["a bout of circumlocution｜一阵绕弯子", "needless circumlocution｜多余的赘语", "avoid circumlocution｜避免绕弯"],
    fam: ["circumlocutory (adj.)"], syn: ["verbosity", "euphemism"], ant: ["brevity", "directness"],
    tip: "动词短语 beat about the bush 是口语版“绕弯子”。" },

  { w: "diaphanous", pos: "adj.", zh: "透明的；轻薄透明的", uk: "/daɪˈæfənəs/", us: "/daɪˈæfənəs/", cefr: "C2", topic: "arts",
    senses: [{ pos: "adj.", zh: "透明的；轻薄透明的", en: "light, delicate, and almost transparent" }],
    ex: [{ en: "She wore a diaphanous silk gown.", zh: "她穿了一件轻薄透明的丝绸礼服。" },
         { en: "Diaphanous clouds drifted at dawn.", zh: "黎明清薄的云缓缓飘过。" }],
    col: ["diaphanous fabric｜轻透面料", "diaphanous curtain｜薄纱窗帘", "diaphanous wings｜透明的翅膀"],
    fam: [], syn: ["sheer", "translucent"], ant: ["opaque", "dense"],
    tip: "形容布料/云/翅膀“薄到透光”。" },

  { w: "ebullient", pos: "adj.", zh: "热情奔放的；沸腾的", uk: "/ɪˈbʌliənt/", us: "/ɪˈbʌliənt/", cefr: "C2", topic: "emotion",
    senses: [{ pos: "adj.", zh: "热情奔放的；沸腾的", en: "cheerful, energetic, and enthusiastic" }],
    ex: [{ en: "The ebullient crowd greeted the hero.", zh: "热情奔放的人群迎接了这位英雄。" },
         { en: "Her ebullient personality lights up rooms.", zh: "她奔放的性格能让整个房间亮起来。" }],
    col: ["ebullient mood｜雀跃的情绪", "ebullient fan｜狂热的粉丝", "characteristically ebullient｜一贯热情"],
    fam: ["ebullience (n.)"], syn: ["exuberant", "buoyant"], ant: ["morose", "subdued"],
    tip: "名词 ebullience（奔放/沸腾般的热情）。" },

  { w: "equanimity", pos: "n.", zh: "平静；镇定", uk: "/ˌekwəˈnɪməti/", us: "/ˌekwəˈnɪməti/", cefr: "C2", topic: "emotion",
    senses: [{ pos: "n.", zh: "平静；镇定", en: "calmness and composure, especially under stress" }],
    ex: [{ en: "She faced the crisis with equanimity.", zh: "她镇定地面对这场危机。" },
         { en: "He lost his equanimity at the news.", zh: "听到消息他失去了平静。" }],
    col: ["with equanimity｜镇定地", "maintain equanimity｜保持镇定", "lose one's equanimity｜方寸大乱"],
    fam: ["equanimous (adj.)"], syn: ["composure", "serenity"], ant: ["agitation", "panic"],
    tip: "正式用语，指“泰山崩于前而色不变”。" },

  { w: "fatuous", pos: "adj.", zh: "愚蠢的；自满的", uk: "/ˈfætʃuəs/", us: "/ˈfætʃuəs/", cefr: "C2", topic: "thinking",
    senses: [{ pos: "adj.", zh: "愚蠢的；自满的", en: "silly and self-satisfied" }],
    ex: [{ en: "He gave a fatuous grin and said nothing.", zh: "他傻笑了一下，什么也没说。" },
         { en: "The fatuous optimism annoyed everyone.", zh: "那种愚蠢的乐观惹恼了所有人。" }],
    col: ["fatuous smile｜傻笑", "fatuous remark｜蠢话", "fatuous optimism｜盲目的乐观"],
    fam: ["fatuity (n.)"], syn: ["inane", "vacuous"], ant: ["wise", "sensible"],
    tip: "比 stupid 文雅，强调“茫然自得的蠢”。" },

  { w: "garrulous", pos: "adj.", zh: "喋喋不休的", uk: "/ˈɡærələs/", us: "/ˈɡærələs/", cefr: "C2", topic: "emotion",
    senses: [{ pos: "adj.", zh: "喋喋不休的", en: "excessively talkative, especially about trivial things" }],
    ex: [{ en: "The garrulous neighbour never stopped talking.", zh: "那个喋喋不休的邻居说个不停。" },
         { en: "His garrulous letters rambled for pages.", zh: "他啰嗦的信写了好几页。" }],
    col: ["garrulous old man｜絮叨的老人", "garrulous tone｜唠叨的语气", "naturally garrulous｜天生话多"],
    fam: ["garrulity (n.)"], syn: ["loquacious", "talkative"], ant: ["taciturn", "reticent"],
    tip: "反义词 taciturn（沉默寡言的）。" },

  { w: "halcyon", pos: "adj.", zh: "宁静美好的；往昔的", uk: "/ˈhælsiən/", us: "/ˈhælsiən/", cefr: "C2", topic: "emotion",
    senses: [{ pos: "adj.", zh: "宁静美好的；往昔的", en: "peaceful and happy, often of a past time" }],
    ex: [{ en: "He recalled the halcyon days of youth.", zh: "他回忆起青春里那段宁静美好的日子。" },
         { en: "They spent a halcyon summer by the sea.", zh: "他们在海边度过了一个安恬的夏天。" }],
    col: ["halcyon days｜太平岁月", "halcyon summer｜宁静的夏天", "halcyon past｜美好的往昔"],
    fam: [], syn: ["serene", "idyllic"], ant: ["turbulent", "stormy"],
    tip: "几乎总用于回忆“过去的好时光”。" },

  { w: "hubris", pos: "n.", zh: "傲慢；狂妄", uk: "/ˈhjuːbrɪs/", us: "/ˈhjuːbrɪs/", cefr: "C2", topic: "thinking",
    senses: [{ pos: "n.", zh: "傲慢；狂妄", en: "excessive pride that leads to downfall" }],
    ex: [{ en: "His hubris blinded him to the risks.", zh: "他的狂妄让他对风险视而不见。" },
         { en: "The firm's collapse was a tale of hubris.", zh: "那家公司的溃败是一则傲慢致败的故事。" }],
    col: ["act out of hubris｜出于狂妄行事", "sheer hubris｜纯粹的狂妄", "hubris leads to ruin｜骄者必败"],
    fam: [], syn: ["arrogance", "pride"], ant: ["humility", "modesty"],
    tip: "希腊悲剧概念，指“过分自大终致灾祸”。" },

  { w: "iconoclast", pos: "n.", zh: "反传统者；打破陈规的人", uk: "/aɪˈkɒnəklæst/", us: "/aɪˈkɑːnəklæst/", cefr: "C2", topic: "arts",
    senses: [{ pos: "n.", zh: "反传统者；打破陈规的人", en: "one who attacks established beliefs or practices" }],
    ex: [{ en: "The director was an iconoclast in cinema.", zh: "那位导演是电影界的反传统者。" },
         { en: "As an iconoclast, she challenged every norm.", zh: "作为打破陈规的人，她挑战每一条规范。" }],
    col: ["cultural iconoclast｜文化反叛者", "an iconoclast at heart｜骨子里的反叛者", "noted iconoclast｜著名的反传统者"],
    fam: ["iconoclastic (adj.)"], syn: ["rebel", "maverick"], ant: ["traditionalist", "conformist"],
    tip: "形容词 iconoclastic（反传统的）。" },
];

// 去掉隐藏占位项
const CLEAN = WORDS.filter((w) => !w.hidden);

// ---- 构建 ----
const newRows = [];
const newEntries = [];
const skipped = [];
const seen = new Set(existing);
for (const w of CLEAN) {
  const base = String(w.w).toLowerCase().replace(/[^a-z]/g, "");
  if (seen.has(base)) { skipped.push(w.w + "(dup)"); continue; }
  const cefrIdx = CEFR[w.cefr];
  const topicIdx = TOPIC[w.topic];
  if (cefrIdx === undefined) { skipped.push(w.w + "(no-cefr)"); continue; }
  if (topicIdx === undefined) { skipped.push(w.w + "(no-topic:" + w.topic + ")"); continue; }
  const head = w.senses[0];
  const zh = `${head.pos} ${head.zh}`;
  const id = base;
  newRows.push([id, w.w, zh, w.uk, cefrIdx, topicIdx, 0]);
  newEntries.push({
    w: w.w, uk: w.uk, us: w.us,
    senses: w.senses, ex: w.ex, col: w.col,
    fam: w.fam || [], syn: w.syn || [], ant: w.ant || [],
    tip: w.tip, cefr: w.cefr, topic: w.topic, id, m: 0,
  });
  seen.add(base);
}

idx.words.push(...newRows);
idx.count = idx.words.length;
idx.examples = (idx.examples || 0) + newEntries.reduce((n, e) => n + e.ex.length, 0);
fs.writeFileSync(`${ROOT}/index.json`, JSON.stringify(idx));

const chunk = idx.chunk;
const oldCount = Math.ceil((idx.count - newEntries.length) / chunk);
const oldAll = [];
for (let n = 0; n < oldCount; n++) {
  const arr = JSON.parse(fs.readFileSync(`${ROOT}/entries/${n}.json`, "utf8"));
  oldAll.push(...arr);
}
const combined = [...oldAll, ...newEntries];

for (let i = 0; i < combined.length; i++) {
  if (combined[i].w !== idx.words[i][1]) {
    console.error(`顺序校验失败 @${i}: entry=${combined[i].w} vs index=${idx.words[i][1]}`);
    process.exit(1);
  }
}

const total = combined.length;
for (let n = 0; n * chunk < total; n++) {
  const slice = combined.slice(n * chunk, (n + 1) * chunk);
  fs.writeFileSync(`${ROOT}/entries/${n}.json`, JSON.stringify(slice));
}

const byLevel = {};
for (const e of newEntries) byLevel[e.cefr] = (byLevel[e.cefr] || 0) + 1;

console.log("✅ 新增词条:", newEntries.length);
console.log("   分级分布:", JSON.stringify(byLevel));
console.log("   跳过(重复/缺字段):", skipped.length, skipped.slice(0, 20).join(", "));
console.log("   现有分块数:", oldCount, "→ 新分块数:", Math.ceil(total / chunk));
console.log("   词库总数:", total);
