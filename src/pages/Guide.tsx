import { BookOpen, CalendarCheck, Clock, Ear, GraduationCap, Lightbulb, MessageCircle, PenLine, Trophy } from "lucide-react";

const EXAMS = [
  {
    id: "KET",
    name: "A2 Key（剑桥通用英语第一级）",
    target: "能进行日常交流：购物、点餐、问路、介绍自己",
    vocab: "官方词表约 1,500–1,800 词，对应本应用 A2 词库",
    level: "A2 初级",
    register: {
      time: "机考每月都有，提前 1-2 个月报名",
      way: "剑桥英语官网 / 教育部考试中心官网",
      fee: "约 500-600 元",
    },
    tips: ["词汇先过 A2 全级，1500 词是底线", "写作小作文控制在 25 词以上，要点写全", "口语 Part 2 一定要跟搭档互动，别自己说自己的"],
    sampleUrl: "https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/preparation/",
    structure: [
      { part: "Reading & Writing", time: "60 分钟", items: "7 部分 · 52 题", icon: BookOpen, note: "阅读 30 题 + 写作 2 题（短信息 / 短文）" },
      { part: "Listening", time: "约 30 分钟", items: "5 部分 · 25 题", icon: Ear, note: "短对话、独白、公告，听两遍" },
      { part: "Speaking", time: "8–10 分钟", items: "2 部分", icon: MessageCircle, note: "Part 1 自我介绍问答，Part 2 看图讨论（两人一组）" },
    ],
    scores: [
      { band: "140–150", result: "Pass with Distinction（卓越）", level: "对应 B1 水平" },
      { band: "120–139", result: "Pass（通过）", level: "达到 A2 水平" },
      { band: "100–119", result: "Level A1（低于通过线）", level: "获 A1 证书" },
    ],
  },
  {
    id: "PET",
    name: "B1 Preliminary（剑桥通用英语第二级）",
    target: "能应对工作、学习中的日常话题，出国旅行与基础邮件往来",
    vocab: "官方词表约 3,500 词，对应本应用 A2 + B1 词库",
    level: "B1 中级",
    register: {
      time: "机考每月都有，提前 1-2 个月报名",
      way: "剑桥英语官网 / 教育部考试中心官网",
      fee: "约 600-700 元",
    },
    tips: ["阅读 45 分钟 32 题，时间紧，先做容易的", "写作大作文一定要分段，观点+原因+例子", "听力 Part 4 是长对话，提前读题干划关键词"],
    sampleUrl: "https://www.cambridgeenglish.org/exams-and-tests/qualifications/preliminary/preparation/",
    structure: [
      { part: "Reading", time: "45 分钟", items: "6 部分 · 32 题", icon: BookOpen, note: "通知、短文理解、长文细节与态度题" },
      { part: "Writing", time: "45 分钟", items: "2 部分", icon: PenLine, note: "短信 / 邮件 + 短文或故事" },
      { part: "Listening", time: "约 30 分钟", items: "4 部分 · 25 题", icon: Ear, note: "广播、对话、访谈，听两遍" },
      { part: "Speaking", time: "10–12 分钟", items: "4 部分", icon: MessageCircle, note: "问答、看图轮流描述、双人协作任务、个人观点" },
    ],
    scores: [
      { band: "160–170", result: "Pass with Distinction（卓越）", level: "对应 B2 水平" },
      { band: "153–159", result: "Pass with Merit（优秀）", level: "高于通过线" },
      { band: "140–152", result: "Pass（通过）", level: "达到 B1 水平" },
      { band: "120–139", result: "Level A2（低于通过线）", level: "获 A2 证书" },
    ],
  },
  {
    id: "FCE",
    name: "B2 First（剑桥通用英语第三级）",
    target: "能流利使用英语工作、学习，留学本科入学水平",
    vocab: "官方词表约 5,000–6,000 词，对应本应用 B2 词库",
    level: "B2 中高级",
    register: {
      time: "每年 3/5/6/11/12 月，提前 2 个月报名",
      way: "剑桥英语官网",
      fee: "约 800-1000 元",
    },
    tips: ["Use of English 语法题占比大，专门刷语法词汇", "写作二选一选自己熟的题型，别选难的", "口语 Part 3 协作任务要主动引导话题"],
    sampleUrl: "https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/preparation/",
    structure: [
      { part: "Reading & UoE", time: "75 分钟", items: "8 部分 · 56 题", icon: BookOpen, note: "阅读理解 + 语法词汇选择题" },
      { part: "Writing", time: "80 分钟", items: "2 部分", icon: PenLine, note: "必选作文 + 二选一（文章/报告/评论/书信）" },
      { part: "Listening", time: "约 40 分钟", items: "4 部分 · 30 题", icon: Ear, note: "对话、独白、采访，听两遍" },
      { part: "Speaking", time: "14 分钟", items: "4 部分", icon: MessageCircle, note: "双人面试：问答、图片描述、协作讨论、深入话题" },
    ],
    scores: [
      { band: "180–190", result: "Grade A（卓越）", level: "对应 C1 水平" },
      { band: "173–179", result: "Grade B（优秀）", level: "稳过 B2" },
      { band: "160–172", result: "Grade C（通过）", level: "达到 B2 水平" },
      { band: "140–159", result: "Level B1（低于通过线）", level: "获 B1 证书" },
    ],
  },
  {
    id: "IELTS",
    name: "雅思 IELTS（国际英语语言测试系统）",
    target: "英联邦国家留学、移民、工作签证必备",
    vocab: "要求 6,000–8,000 词汇量，听说读写四项独立评分",
    level: "留学/移民",
    register: {
      time: "几乎每周都有，提前 1-2 周报名",
      way: "雅思官网 / 教育部考试中心",
      fee: "约 2170 元",
    },
    tips: ["听力地图题、匹配题是难点，专门练", "阅读时间最紧，先做判断题再做填空题", "写作 Task 2 占分高，一定要写完", "口语 Part 2 卡片题准备 10 个万能素材"],
    sampleUrl: "https://www.ielts.org/for-test-takers/see-sample-test-questions",
    structure: [
      { part: "Listening", time: "约 30 分钟", items: "4 部分 · 40 题", icon: Ear, note: "社交 + 学术场景，听一遍" },
      { part: "Reading", time: "60 分钟", items: "3 篇 · 40 题", icon: BookOpen, note: "学术类/培训类，文章更长更难" },
      { part: "Writing", time: "60 分钟", items: "2 篇", icon: PenLine, note: "Task 1 图表/书信 + Task 2 大作文" },
      { part: "Speaking", time: "11–14 分钟", items: "3 部分", icon: MessageCircle, note: "面对面：问答 → 卡片话题 → 深入讨论" },
    ],
    scores: [
      { band: "8.0–9.0", result: "Expert（专家水平）", level: "顶尖院校/移民加分" },
      { band: "7.0–7.5", result: "Good User（良好）", level: "绝大多数研究生项目要求" },
      { band: "6.0–6.5", result: "Competent（合格）", level: "本科入学常见要求" },
      { band: "5.0–5.5", result: "Modest（基础）", level: "语言班/预科水平" },
    ],
  },
  {
    id: "TOEFL",
    name: "托福 TOEFL iBT（托福网考）",
    target: "北美院校留学申请主流考试，美国大学认可",
    vocab: "要求 8,000–10,000 词汇量，全机考",
    level: "北美留学",
    register: {
      time: "每周都有考试，提前 1 周报名",
      way: "托福官网",
      fee: "约 2100 元",
    },
    tips: ["听力讲座是难点，练笔记速记", "阅读词汇题占比大，背学术词汇", "口语综合题先读再听再说，记要点", "写作综合写作模板要熟"],
    sampleUrl: "https://www.ets.org/toefl/ibt/prepare/sample-questions",
    structure: [
      { part: "Reading", time: "35–54 分钟", items: "3–4 篇 · 30–40 题", icon: BookOpen, note: "学术文章，理解主旨+细节+推断" },
      { part: "Listening", time: "41–57 分钟", items: "2–3 段对话 + 3–4 段讲座", icon: Ear, note: "校园对话 + 课堂讲座笔记题" },
      { part: "Speaking", time: "17 分钟", items: "4 道题", icon: MessageCircle, note: "机考录音：独立口语 + 综合口语（读听后说）" },
      { part: "Writing", time: "50 分钟", items: "2 篇", icon: PenLine, note: "综合写作（读听后写）+ 学术讨论写作" },
    ],
    scores: [
      { band: "110–120", result: "顶尖水平", level: "藤校/Top 10 有竞争力" },
      { band: "90–109", result: "良好水平", level: "多数研究生项目要求" },
      { band: "70–89", result: "合格水平", level: "本科/双录取常见线" },
      { band: "0–69", result: "未达标", level: "需继续提升" },
    ],
  },
  {
    id: "CET4",
    name: "大学英语四级 CET-4",
    target: "本科毕业基本要求，校内英语水平测试",
    vocab: "大纲约 4,500 词，在校生才能考",
    level: "国内大学",
    register: {
      time: "每年 6 月、12 月各一次，提前 1-2 个月报名",
      way: "全国大学英语四六级考试官网",
      fee: "约 30 元",
    },
    tips: ["听力短篇新闻是难点，多听 BBC 新闻", "阅读选词填空分值低，最后做", "翻译考中国文化，背常用词汇", "写作背模板，字迹工整"],
    sampleUrl: "http://www.cet.edu.cn/sylm.htm",
    structure: [
      { part: "Writing", time: "30 分钟", items: "1 篇", icon: PenLine, note: "话题作文，120–180 词" },
      { part: "Listening", time: "25 分钟", items: "短篇新闻 + 长对话 + 篇章", icon: Ear, note: "短篇新闻 7 题 + 长对话 8 题 + 听力篇章 10 题" },
      { part: "Reading", time: "40 分钟", items: "词汇理解 + 长篇阅读 + 仔细阅读", icon: BookOpen, note: "选词填空 + 匹配 + 仔细阅读 2 篇" },
      { part: "Translation", time: "30 分钟", items: "1 段汉译英", icon: PenLine, note: "中国文化/社会热点话题段落翻译" },
    ],
    scores: [
      { band: "550+", result: "优秀", level: "可以考口语/保研加分" },
      { band: "425–549", result: "通过", level: "及格线 425 分" },
      { band: "< 425", result: "未通过", level: "下次再考" },
    ],
  },
  {
    id: "CET6",
    name: "大学英语六级 CET-6",
    target: "四级通过后可考，研究生/好简历加分项",
    vocab: "大纲约 6,000 词，比四级难一档",
    level: "国内大学进阶",
    register: {
      time: "每年 6 月、12 月各一次，四级过了才能报",
      way: "全国大学英语四六级考试官网",
      fee: "约 35 元",
    },
    tips: ["听力讲座/讲话是难点，占 20 题", "仔细阅读分值最高，先做仔细阅读", "翻译考中国社会/经济话题，背常用表达", "大作文写议论文，三段式最稳"],
    sampleUrl: "http://www.cet.edu.cn/sylm.htm",
    structure: [
      { part: "Writing", time: "30 分钟", items: "1 篇", icon: PenLine, note: "话题作文，150–200 词" },
      { part: "Listening", time: "30 分钟", items: "长对话 + 听力篇章 + 讲座/讲话", icon: Ear, note: "长对话 8 题 + 篇章 7 题 + 讲座 10 题" },
      { part: "Reading", time: "40 分钟", items: "词汇理解 + 长篇阅读 + 仔细阅读", icon: BookOpen, note: "文章更长，推理题更多" },
      { part: "Translation", time: "30 分钟", items: "1 段汉译英", icon: PenLine, note: "中国文化/经济/社会话题" },
    ],
    scores: [
      { band: "550+", result: "优秀", level: "口语考试资格/求职硬通货" },
      { band: "425–549", result: "通过", level: "及格线 425 分" },
      { band: "< 425", result: "未通过", level: "下次再考" },
    ],
  },
  {
    id: "考研",
    name: "考研英语（一/二）",
    target: "全国硕士研究生招生考试公共课",
    vocab: "大纲约 5,500 词，英语一难于英语二",
    level: "国内考研",
    register: {
      time: "每年 12 月底（倒数第二个周末），9-10 月报名",
      way: "研招网",
      fee: "约 100-200 元（各省不同）",
    },
    tips: ["阅读占 40 分，得阅读者得天下", "作文背模板+自己改，别直接用万能模板", "翻译是长难句，拆句子主谓宾", "新题型（排序/匹配）专门练，分值高"],
    sampleUrl: "https://yz.chsi.com.cn/kyzx/kydt/",
    structure: [
      { part: "Use of English", time: "英语一 1 完形 20 题", items: "10 分", icon: BookOpen, note: " Cloze 完形填空" },
      { part: "Reading", time: "60 分钟", items: "4 篇阅读 + 新题型", icon: BookOpen, note: "传统阅读 20 题 + 新题型 5 题" },
      { part: "Translation", time: "20 分钟", items: "英译汉 5 句 / 段落", icon: PenLine, note: "英语一翻译划线句，英语二翻译段落" },
      { part: "Writing", time: "50 分钟", items: "小作文 + 大作文", icon: PenLine, note: "应用文 10 分 + 大作文 20 分（图画/图表）" },
    ],
    scores: [
      { band: "70+", result: "高分", level: "985/211 有竞争力" },
      { band: "55–69", result: "中等", level: "过国家线基本没问题" },
      { band: "< 45", result: "危险", level: "可能卡国家线" },
    ],
  },
];

const EXAM_CENTERS = [
  { city: "北京", exams: "KET/PET/FCE/雅思/托福/CET/考研", centers: "北大、清华、北外、首师大等 20+ 考点" },
  { city: "上海", exams: "KET/PET/FCE/雅思/托福/CET/考研", centers: "上外、交大、复旦、上海大学等 15+ 考点" },
  { city: "广州", exams: "KET/PET/FCE/雅思/托福/CET/考研", centers: "广外、中大、华师、广工等 10+ 考点" },
  { city: "深圳", exams: "KET/PET/FCE/雅思/托福/CET", centers: "深大、深国际交流院、赛格人才等" },
  { city: "杭州", exams: "KET/PET/雅思/托福/CET/考研", centers: "浙大、杭师大、浙江工商等" },
  { city: "成都", exams: "KET/PET/雅思/托福/CET/考研", centers: "川大、电子科大、四川师大等" },
  { city: "武汉", exams: "KET/PET/雅思/托福/CET/考研", centers: "武大、华科、华中师大等" },
  { city: "南京", exams: "KET/PET/FCE/雅思/托福/CET/考研", centers: "南大、东南、南师大等" },
  { city: "西安", exams: "KET/PET/雅思/托福/CET/考研", centers: "西外、交大、陕师大等" },
  { city: "重庆", exams: "KET/PET/雅思/托福/CET/考研", centers: "川外、重大、西南大学等" },
];

const TIPS: [string, string][] = [
  ["阅读先扫题干", "每道题先读题干和选项，带着问题回原文定位，比通读全文更快更准。"],
  ["听力利用两遍", "第一遍抓大意和关键词，第二遍核对细节。没听清就果断听下一题，别纠结。"],
  ["写作分点写", "邮件 / 短信用 3 段：开头问候 → 正文要点 → 结尾期待回复。字数达标、覆盖全部要点最重要。"],
  ["口语敢说就行", "考官看的是能否完成交流任务，不是完美语法。答不上来就用学过的词绕过去，别沉默。"],
  ["拼写决定成败", "听力、写作都会因拼写扣分。本应用的「听音拼写」和「打字练习」专攻这点。"],
];

export function Guide() {
  return (
    <div className="page guide">
      <header className="page-head">
        <p className="eyebrow">考试百科 · Exam Guide</p>
        <h1 className="display">把考试看明白，再启程。</h1>
        <p className="lede">KET / PET 的结构、题型、评分与备考节奏，一页讲清。官方信息整理，具体以剑桥官网为准。</p>
        <p className="guide-note">
          本应用里的所有练习题（完形、开放填空、听力、口语、写作、标识识别等）都是<strong>格式同款的同源模拟题</strong>，
          由我们按真题的题型、话题与难度原创编写，方便日常刷练；它们<strong>不是剑桥官方往年真题的原文</strong>。
          要刷真卷请购买剑桥《Official Exam Papers》正版出版物。
        </p>
      </header>

      {EXAMS.map((ex) => (
        <section key={ex.id} className="panel guide-exam">
          <div className="guide-head">
            <div>
              <h3 className="eyebrow">{ex.id}</h3>
              <h2>{ex.name}</h2>
            </div>
            <span className="guide-target">{ex.target}</span>
          </div>
          <p className="muted">{ex.vocab}</p>

          {ex.register && (
            <>
              <h4><CalendarCheck size={15} /> 报名信息</h4>
              <div className="guide-register">
                <div><b>报名时间：</b>{ex.register.time}</div>
                <div><b>报名入口：</b>{ex.register.way}</div>
                <div><b>考试费用：</b>{ex.register.fee}</div>
              </div>
            </>
          )}

          <h4>试卷结构</h4>
          <div className="guide-structure">
            {ex.structure.map((s) => (
              <div key={s.part} className="guide-row">
                <s.icon size={18} />
                <b>{s.part}</b>
                <span>{s.time}</span>
                <span>{s.items}</span>
                <small>{s.note}</small>
              </div>
            ))}
          </div>
          <h4>评分标准（满分 170）</h4>
          <div className="guide-scores">
            {ex.scores.map((s) => (
              <div key={s.band} className="guide-score">
                <Trophy size={16} />
                <b>{s.band}</b>
                <span>{s.result}</span>
                <small>{s.level}</small>
              </div>
            ))}
          </div>

          {ex.tips && (
            <>
              <h4><Lightbulb size={15} /> 备考要点</h4>
              <ul className="guide-tips-list">
                {ex.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </>
          )}

          <div className="guide-actions">
            <a className="guide-cta" href="#/classroom">
              去教室按课表学 →
            </a>
            <a className="guide-cta is-quiet" href="#/practice">
              直接练题型 →
            </a>
            <a
              className="guide-cta sample-btn"
              href={ex.sampleUrl ?? "https://www.cambridgeenglish.org/exams-and-tests/qualifications/"}
              target="_blank"
              rel="noopener noreferrer"
            >
              🎯 在线做官方样题 ↗
            </a>
          </div>
        </section>
      ))}

      <section className="panel">
        <h3 className="eyebrow">
          <Trophy size={15} /> 各级别对应关系
        </h3>
        <div className="guide-level-table">
          <table>
            <thead>
              <tr><th>CEFR</th><th>剑桥考试</th><th>雅思</th><th>托福</th><th>国内对应</th></tr>
            </thead>
            <tbody>
              <tr><td>A1</td><td>Starters/Movers</td><td>2.0-3.0</td><td>-</td><td>-</td></tr>
              <tr><td>A2</td><td><b>KET</b></td><td>3.5-4.5</td><td>-</td><td>-</td></tr>
              <tr><td>B1</td><td><b>PET</b></td><td>4.5-5.0</td><td>42-54</td><td>-</td></tr>
              <tr><td>B2</td><td><b>FCE</b></td><td>5.5-6.5</td><td>72-94</td><td>四级 550+</td></tr>
              <tr><td>C1</td><td>CAE</td><td>7.0-8.0</td><td>95-119</td><td>六级 550+</td></tr>
              <tr><td>C2</td><td>CPE</td><td>8.5-9.0</td><td>120</td><td>-</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          💡 成绩有效期：雅思/托福 <b>2 年</b>，剑桥终身有效，四六级 <b>6 年</b>，考研英语当年有效。
        </p>
      </section>

      <section className="panel">
        <h3 className="eyebrow">
          <CalendarCheck size={15} /> 考场注意事项
        </h3>
        <ul className="guide-tips-list">
          <li><b>必带证件：</b>准考证 + 身份证（或护照），电子准考证要打印出来</li>
          <li><b>到达时间：</b>提前 30 分钟到，迟到 15 分钟以上禁止入场</li>
          <li><b>不能带：</b>手机（关机放包里）、智能手表、草稿纸、修正液</li>
          <li><b>可以带：</b>透明水杯（无标签）、橡皮、黑色签字笔（2 支以上）</li>
          <li><b>口语考试：</b>剑桥/雅思是面对面，提前 10 分钟候考；托福是机考录音</li>
          <li><b>听力：</b>大部分考点用耳机，部分用外放，提前试音</li>
        </ul>
      </section>

      <section className="panel">
        <h3 className="eyebrow">
          <Lightbulb size={15} /> 常见问题 FAQ
        </h3>
        <div className="guide-faq">
          <details>
            <summary>KET 和剑桥少儿英语有什么区别？</summary>
            <p>少儿英语（Starters/Movers/Flyers）是给 7-12 岁小孩的，KET 是第一级正式证书，难度比 Flyers 高一档，小学高年级到初中考合适。</p>
          </details>
          <details>
            <summary>四六级证书丢了能补吗？</summary>
            <p>不能补办原件，但可以登录四六级官网申请"成绩证明"，效力等同于原件，一般 1-2 周出。</p>
          </details>
          <details>
            <summary>雅思 A 类和 G 类有什么区别？</summary>
            <p>A 类（学术类）是留学用的，G 类（培训类）是移民/工作用的。听力口语一样，阅读写作不一样，G 类简单一点。</p>
          </details>
          <details>
            <summary>考研英语一和英语二怎么选？</summary>
            <p>学硕基本考英语一（难），专硕很多考英语二（简单）。具体看你报考学校的专业目录。</p>
          </details>
          <details>
            <summary>剑桥证书终身有效是什么意思？</summary>
            <p>剑桥通用英语证书（KET/PET/FCE 等）没有有效期，一辈子有效。雅思托福只有 2 年，因为语言能力会退化。</p>
          </details>
        </div>
      </section>

      <section className="panel">
        <h3 className="eyebrow">
          <GraduationCap size={15} /> 备考节奏建议
        </h3>
        <ol className="guide-timeline">
          <li>
            <b>考前 3 个月 · 打基础</b>每天 20 个新词 + 复习，用「今日旅程」跟节奏；每周 1 次摸底测试，确认 A2 / B1 目标。
          </li>
          <li>
            <b>考前 1 个月 · 上题型</b>真题三题型 + 易混词辨析 + 对话听力轮着练，写作每周 2 篇，口语每天说 5 分钟。
          </li>
          <li>
            <b>考前 1 周 · 仿真</b>每两天做一套完整仿真卷，限时；错题本清空一轮，薄弱词过一遍。
          </li>
        </ol>
      </section>

      <section className="panel">
        <h3 className="eyebrow">
          <Clock size={15} /> 题型小抄
        </h3>
        <div className="guide-tips">
          {TIPS.map(([t, d]) => (
            <div key={t} className="guide-tip">
              <b>{t}</b>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="eyebrow">
          <GraduationCap size={15} /> 全国主要考点城市
        </h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          以下城市均有 KET/PET/FCE/雅思/托福等主流英语考试考点，具体报名入口和最新考期请以官方网站为准。
        </p>
        <div className="guide-centers">
          {EXAM_CENTERS.map((c) => (
            <div key={c.city} className="guide-center">
              <b className="guide-center-city">{c.city}</b>
              <span className="guide-center-exams">{c.exams}</span>
              <small className="guide-center-detail">{c.centers}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
