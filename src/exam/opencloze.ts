/**
 * 开放式填空（Open Cloze）—— KET R&W Part 5 / PET Reading Part 6。
 *
 * 这个题型不给选项，要自己写词。挖掉的几乎全是「虚词」：
 * 冠词、介词、连词、助动词、代词、关系词 —— 也就是背单词背不到的地方，
 * 所以它是考生丢分最集中的一题，必须专项练。
 */

export interface ClozeText {
  id: string;
  title: string;
  level: "A2" | "B1";
  /** 正文，`___` 表示空，按出现顺序对应 answers。 */
  body: string;
  /** 每个空的答案，可能有多个可接受写法（用 `|` 分隔）。 */
  answers: string[];
  /** 整篇大意，用于答完后对照理解。 */
  zh: string;
  /** 每个空的讲解，顺序与 answers 一致。 */
  notes: string[];
}

export const CLOZE_TEXTS: ClozeText[] = [
  {
    id: "oc1",
    title: "A letter from summer camp",
    level: "A2",
    body: `Dear Mum and Dad,

I'm having ___ great time at summer camp. I arrived ___ Sunday and I've already made three new friends.

Yesterday we went ___ a long walk in the forest. We saw ___ deer and lots of birds. In the evening we sat around the fire ___ sang songs.

The food here is good, ___ I miss your cooking! Please write ___ soon.

Love,
Amy`,
    answers: ["a", "on", "for", "a", "and", "but", "to"],
    zh: "夏令营写给爸妈的信：很开心、周日到的、交了新朋友、昨天去森林散步看到鹿、晚上围着火唱歌、想念家里的菜。",
    notes: [
      "have a great time 是固定搭配，泛指单数可数名词前加 a。",
      "星期几前面用 on。",
      "go for a walk 是固定搭配（去散步）。",
      "deer 单复数同形，这里指「一只鹿」，泛指用 a。",
      "sat 和 sang 两个并列动作，用 and 连接。",
      "前面说伙食好，后面说想念，是转折，用 but。",
      "write to someone 是固定搭配（给某人写信）。",
    ],
  },
  {
    id: "oc2",
    title: "My new school",
    level: "A2",
    body: `My new school is bigger ___ my old one. There ___ about 900 students here, and the teachers are very kind.

I was nervous ___ the first day, but everyone helped ___. My favourite subject is science because we do lots of experiments.

The library is my favourite place. It's quiet, ___ I can concentrate there. I usually stay ___ two hours after school.`,
    answers: ["than", "are", "on", "me", "so", "for"],
    zh: "新学校比旧学校大、约 900 名学生、老师很好、第一天紧张但大家帮我、最爱科学课因为做实验、最爱图书馆因为安静。",
    notes: [
      "bigger 是比较级，后面接 than（比…）。",
      "There be 句型，后面 900 students 是复数，用 are。",
      "具体到某一天用 on the first day。",
      "help 是动词，后面接宾格 me。",
      "前因后果：安静，所以我能专心 —— 用 so（结果）。",
      "for + 一段时间，表示动作持续多久。",
    ],
  },
  {
    id: "oc3",
    title: "How to make a banana smoothie",
    level: "A2",
    body: `This is ___ easiest drink you can make, and it only takes two minutes.

First, peel a banana and put ___ in a bowl. Then pour ___ some milk — about 200 ml. ___ that, mix everything together with a spoon.

If you want it sweeter, you can add ___ honey. Don't put in too ___, or it will be too sweet!`,
    answers: ["the", "it", "in", "After", "some", "much"],
    zh: "香蕉奶昔做法：两分钟就好。香蕉剥皮放碗里，倒约 200 毫升牛奶，然后搅匀。想甜一点可加蜂蜜，别加太多。",
    notes: [
      "easiest 是最高级，前面必须加 the。",
      "指代前面提到的 the banana，用 it（单数）。",
      "pour in = 倒进去，是短语动词。",
      "表示顺序「在那之后」，用 After。",
      "honey 是不可数名词，泛指用 some。",
      "honey 不可数，用 much（too much）；可数才用 many。",
    ],
  },
  {
    id: "oc4",
    title: "The town where I grew up",
    level: "B1",
    body: `I grew ___ in a small town in the north of China. It's the kind of place ___ everybody knows everybody else.

When I was a child, there ___ only one shop and no cinema at all. Now the town has changed a lot — new roads have ___ built, and a big supermarket opened last year.

I still go back every summer, ___ I don't think I could live there again. It's ___ quiet for me now.`,
    answers: ["up", "where", "was", "been", "but", "too"],
    zh: "我在北方小镇长大，那里人人都互相认识。小时候只有一家商店、没有电影院。现在修了新路、开了大超市。我每年夏天都回去，但不会再住那儿了，现在对我来说太安静了。",
    notes: [
      "grow up = 长大，固定短语动词。",
      "先行词 place 是地点，从句不缺主语宾语，用关系副词 where。",
      "There be 句型，后面 only one shop 是单数，且讲过去，用 was。",
      "路是「被修」的，用现在完成时被动 have been + built。",
      "前后是转折：每年回去，但不会再住 —— 用 but。",
      "too + 形容词 + for someone = 对某人来说太…（这儿是「对我来说太安静了」）。",
    ],
  },
  {
    id: "oc5",
    title: "Learning to play the guitar",
    level: "B1",
    body: `I've always wanted ___ play the guitar, so last January I finally bought ___.

At first it was really difficult. My fingers hurt and I couldn't play ___ songs at all. I nearly gave ___ twice.

But I kept practising, and now I can play about ten songs. If I ___ given up, I would never have got this far. My advice is: find a song you love and play ___ until you know it perfectly.`,
    answers: ["to", "one", "any", "up", "had", "it"],
    zh: "我一直想学吉他，去年一月终于买了一把。开始很难，手指疼、一首歌都弹不了，差点放弃两次。但坚持下来现在会十首了。建议：找一首喜欢的歌练到滚瓜烂熟。",
    notes: [
      "want 后面接 to + 动词原形。",
      "指代前面提到的吉他（同类中的一个），用 one 避免重复。",
      "couldn't 是否定句，用 any（否定句不用 some）。",
      "give up = 放弃，固定短语动词。",
      "这是第三条件句（对过去的假设）：If + had + 过去分词, would have + 过去分词。",
      "指代前面的 a song，用 it（单数）。",
    ],
  },
  {
    id: "oc6",
    title: "A message to a friend",
    level: "A2",
    body: `Hi Tom,

Thanks ___ your message. I'm sorry I didn't answer sooner — I've ___ very busy this week.

Are you free ___ Saturday afternoon? I thought we ___ go to the new sports centre. It has a swimming pool and a climbing wall.

Let me know ___ you can come. I hope ___ see you soon!

Ben`,
    answers: ["for", "been", "on", "could", "if", "to"],
    zh: "给朋友的回信：谢谢留言、这周很忙所以回晚了、约周六下午去新体育中心（有泳池和攀岩墙）、问能不能来。",
    notes: [
      "thanks for something = 因某事而感谢。",
      "I've been busy 是现在完成时，be 的过去分词是 been。",
      "星期几的下午用 on Saturday afternoon。",
      "提建议的委婉说法：we could go（我们可以去…）。",
      "let me know 后接 whether / if 引导的从句（是否）。",
      "hope 后接 to + 动词原形（hope to see you）。",
    ],
  },
  {
    id: "oc7",
    title: "Why I love the library",
    level: "B1",
    body: `Some people prefer reading ___ home, but I always go to the library. It's the only place ___ I can really concentrate.

I usually spend two hours there ___ Saturday mornings. Nobody talks, and ___ is no noise from phones or traffic.

What I like most is ___ you can borrow five books at a time. That means I never run ___ of things to read.`,
    answers: ["at", "where", "on", "there", "that", "out"],
    zh: "有人喜欢在家看书，但我总去图书馆，那是唯一能让我专心的地方。周六上午待两小时，没人说话、没有手机和车流的噪音。最喜欢一次能借五本书，所以永远不会没书看。",
    notes: [
      "at home 是固定搭配（在家），不用 in home。",
      "先行词 place 是地点，从句不缺主语宾语，用 where。",
      "具体到某天的上午用 on Saturday mornings。",
      "表示「没有噪音」用 There is no noise（存在句）。",
      "What I like most is that… —— that 引导表语从句。",
      "run out of = 用完、耗尽，固定短语动词。",
    ],
  },
  {
    id: "oc8",
    title: "A day at the beach",
    level: "A2",
    body: `Last weekend my family and I went to ___ beach. The weather was perfect — sunny but not ___ hot.

My little brother built a huge sandcastle while I swam in ___ sea. The water was cold at first, but I soon got used ___ it.

We stayed ___ sunset and then drove home. I was so tired ___ I fell asleep in the car!`,
    answers: ["the", "too", "the", "to", "until", "that"],
    zh: "上周末一家去海滩，天气很好，晴但不算太热。弟弟堆沙堡，我在海里游泳，水开始冷但很快习惯了。待到日落才开车回家，累得在车里睡着了。",
    notes: [
      "go to the beach 是固定搭配（去海滩），常用 the。",
      "not too hot = 不太热；too 表示「过于」。",
      "sea 是独一无二的事物，用 the。",
      "get used to something = 习惯于某事，to 是介词。",
      "until = 直到（我们一直待到日落）。",
      "so + 形容词 + that 从句：累到在车里睡着了。",
    ],
  },
  {
    id: "oc9",
    title: "My first day at work",
    level: "B1",
    body: `My first day at the café was ___ nervous than I expected. I had ___ arrive at seven in the morning, before the shop opened.

The manager showed me ___ to use the coffee machine. It looked complicated, ___ I wrote everything down in a notebook.

By the end of the day I ___ made over fifty cups of coffee. I was exhausted, but I ___ already learned a lot.`,
    answers: ["less", "to", "how", "so", "had", "had"],
    zh: "在咖啡馆第一天上班没想象中那么紧张。七点到，经理教我怎么用咖啡机，看着复杂所以都记在笔记本上。一天下来做了五十多杯咖啡，很累但已经学到很多。",
    notes: [
      "nervous 是长形容词，比较级用 less nervous（没那么紧张）。",
      "have to + 动词原形（had to arrive）；have 后接 to。",
      "show someone how to do something = 教某人怎么做。",
      "前因后果：看着复杂，所以我记下来 —— 用 so。",
      "「到那天结束时已经做了五十多杯」，过去的过去，用过去完成时 had made。",
      "同样是过去的过去：到那时已经学到很多，用 had learned。",
    ],
  },
  {
    id: "oc10",
    title: "Staying healthy",
    level: "B1",
    body: `Doctors say we ___ all do more exercise, but many people find it hard to start.

You don't have ___ join an expensive gym. Walking for thirty minutes ___ day is enough, and it costs nothing.

The important thing is to choose ___ activity you actually enjoy. If you hate running, ___ try swimming or cycling instead.

And remember: ___ you exercise regularly, you'll sleep better and feel happier too.`,
    answers: ["should", "to", "a", "an", "try", "if"],
    zh: "医生说我们都该多运动，但很多人难以开始。不必去贵健身房，每天走三十分钟就够。关键是选一项你真正喜欢的活动，讨厌跑步就试试游泳或骑车。坚持运动会睡得更好、更开心。",
    notes: [
      "提建议用 should + 动词原形（应该）。",
      "don't have to = 不必，后接 to + 原形。",
      "a day 表示「每天」，等于 per day / every day。",
      "activity 以元音开头，用 an。",
      "祈使句提建议用动词原形 try（试试游泳或骑车）。",
      "if 引导条件句：如果经常锻炼，就会睡得更好。",
    ],
  },
];

/** 判断一个空是否答对（支持多个可接受的写法）。 */
export function clozeMatch(input: string, answer: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
  const got = norm(input);
  if (!got) return false;
  return answer.split("|").some((a) => norm(a) === got);
}

/** 把短文按空切成片段，便于渲染成带输入框的段落。 */
export function splitCloze(body: string): string[] {
  return body.split("___");
}
