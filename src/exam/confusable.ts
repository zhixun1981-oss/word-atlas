export interface ConfusableItem {
  a: string;
  b: string;
  /** Example sentence with the correct word, using ____ as the gap. */
  sentence: string;
  zh: string;
  answer: "a" | "b";
  /** One-line explanation shown after answering. */
  why: string;
}

/** Common KET/PET confusable pairs with hand-written simple example sentences. */
export const CONFUSABLES: ConfusableItem[] = [
  { a: "borrow", b: "lend", sentence: "Can I ____ your pen for a minute?", zh: "我能借你的笔用一下吗？", answer: "a", why: "borrow 是「借入」（向别人借），lend 是「借出」（借给别人）。" },
  { a: "hear", b: "listen", sentence: "I like to ____ to music on the bus.", zh: "我喜欢在公交车上听音乐。", answer: "b", why: "listen 是不及物动词，要说 listen to；hear 强调「听到」这个结果。" },
  { a: "watch", b: "see", sentence: "We watched TV and then ____ a film at the cinema.", zh: "我们先看电视，然后去电影院看电影。", answer: "b", why: "看电视用 watch TV；去电影院「看电影」用 see a film。" },
  { a: "bring", b: "take", sentence: "Please ____ your dictionary to school tomorrow.", zh: "明天请把你的词典带到学校来。", answer: "a", why: "bring 是「带来」（朝说话者方向），take 是「带走、拿去别处」。" },
  { a: "say", b: "tell", sentence: "Can you ____ me the way to the station?", zh: "你能告诉我去车站的路吗？", answer: "b", why: "tell 后接人（tell me / tell us）；say 后接说的话（say hello）。" },
  { a: "make", b: "do", sentence: "I always ____ my homework after dinner.", zh: "我总是在晚饭后做作业。", answer: "b", why: "做作业用 do homework；make 强调「制作、制造」（make a cake）。" },
  { a: "learn", b: "study", sentence: "I want to ____ to swim this summer.", zh: "今年夏天我想学游泳。", answer: "a", why: "learn 强调学会一项技能（learn to do）；study 强调「学习、研究」这个动作。" },
  { a: "travel", b: "trip", sentence: "We are going on a school ____ to London next month.", zh: "下个月我们要去伦敦进行学校旅行。", answer: "b", why: "trip 是可数名词（a trip）；travel 常用作动词或泛指「旅行」。" },
  { a: "look", b: "see", sentence: "____ at the picture on the wall. It's beautiful!", zh: "看看墙上的那幅画，真漂亮！", answer: "a", why: "look at 是「看」这个动作；see 是「看见」的结果。" },
  { a: "big", b: "large", sentence: "This bag is too ____ to fit in my cupboard.", zh: "这个包太大了，放不进我的柜子。", answer: "a", why: "两个词都表示「大」，big 更口语常用；形容尺寸规格时常用 large。" },
  { a: "start", b: "begin", sentence: "The film will ____ at seven o'clock.", zh: "电影七点开始。", answer: "a", why: "start/begin 都表示「开始」，start 更口语常用；start 还可表示「启动机器」。" },
  { a: "buy", b: "pay", sentence: "I want to ____ a present for my mum.", zh: "我想给妈妈买一份礼物。", answer: "a", why: "buy 是「买」东西；pay 是「付钱」（pay for something）。" },
  { a: "speak", b: "talk", sentence: "Can you ____ more slowly, please?", zh: "你能说得慢一点吗？", answer: "a", why: "speak 侧重「说」某种语言或开口说话；talk 侧重「交谈」（talk to sb）。" },
  { a: "remember", b: "remind", sentence: "Please ____ me to call my grandmother tonight.", zh: "请提醒我今晚给奶奶打电话。", answer: "b", why: "remember 是「记得」；remind 是「提醒别人」（remind sb to do）。" },
  { a: "arrive", b: "reach", sentence: "What time will we ____ at the airport?", zh: "我们几点到机场？", answer: "a", why: "arrive 后接 at/in + 地点；reach 是及物动词，直接接地点（reach the airport）。" },
  { a: "win", b: "beat", sentence: "Our team won the match and ____ the other school.", zh: "我们队赢了比赛，击败了另一所学校。", answer: "b", why: "win 后接比赛/奖品（win a match）；beat 后接对手（beat the other team）。" },
];

export const CONFUSABLE_ROUND = CONFUSABLES.length;
