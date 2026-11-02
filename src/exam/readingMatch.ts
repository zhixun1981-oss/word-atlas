export interface MatchItem {
  need: string;
  needZh: string;
  options: string[];
  answer: number;
  why: string;
}

/**
 * 信息配对题（KET/PET Reading Part 2/3 风格）：读一个人的需求，从若干告示里选最匹配的一条。
 * 原创模拟题，结构与真卷一致，非剑桥官方真题。
 */
export const MATCH_ITEMS: MatchItem[] = [
  {
    need: "Anna loves swimming and wants to train every day before the competition.",
    needZh: "Anna 喜欢游泳，想在比赛前每天训练。",
    options: [
      "City Pool is open every morning at 6 a.m. for members.",
      "The cinema shows a new film every Friday night.",
      "The library closes early on Mondays.",
    ],
    answer: 0,
    why: "关键信息是每天训练 → 泳池早上 6 点开放，匹配。",
  },
  {
    need: "Tom needs books about history for his school project this week.",
    needZh: "Tom 这周需要历史书做学校项目。",
    options: [
      "Museum: buy your tickets online before your visit.",
      "City Library: history section open until 8 p.m. every day.",
      "Supermarket: fresh bread and milk at low prices.",
    ],
    answer: 1,
    why: "需要历史书 → 图书馆历史区每天开到 8 点，匹配。",
  },
  {
    need: "Mia wants to watch a film with her friends on Saturday night.",
    needZh: "Mia 想周六晚上和朋友看电影。",
    options: [
      "The Sports Centre has a football match every weekend.",
      "Star Cinema: new films every night, tickets from 40 yuan.",
      "The market sells fresh fruit every morning.",
    ],
    answer: 1,
    why: "想看新片 → 影院每晚放新片，票 40 元起，匹配。",
  },
  {
    need: "Leo broke his leg and needs to see a doctor this afternoon.",
    needZh: "Leo 摔伤了腿，今天下午要看医生。",
    options: [
      "City Hospital: doctors available all day, no booking needed.",
      "The bakery opens at 7 a.m. and sells fresh bread.",
      "The travel agency plans holidays for next summer.",
    ],
    answer: 0,
    why: "要看医生 → 医院全天有医生、无需预约，匹配。",
  },
  {
    need: "Sara wants to buy a cheap present for her mother's birthday.",
    needZh: "Sara 想给妈妈买一件便宜的生日礼物。",
    options: [
      "The airport has flights to many cities every day.",
      "Gift Shop: special offers this week, everything under 50 yuan.",
      "The zoo opens at 9 a.m. and closes at 5 p.m.",
    ],
    answer: 1,
    why: "便宜礼物 → 礼品店本周特惠、全部 50 元内，匹配。",
  },
  {
    need: "Jack wants to send a letter to his grandparents in another city.",
    needZh: "Jack 想给外地的爷爷奶奶寄一封信。",
    options: [
      "Post Office: send letters and parcels every day.",
      "The bakery sells cakes and cookies.",
      "The zoo has many animals from Africa.",
    ],
    answer: 0,
    why: "寄信 → 邮局每天收寄信件和包裹，匹配。",
  },
  {
    need: "Emma wants to buy fruit and vegetables for dinner tonight.",
    needZh: "Emma 想买水果和蔬菜做今晚的晚饭。",
    options: [
      "Market: fresh fruit and vegetables every morning.",
      "Cinema: two films at 4 p.m. and 7 p.m.",
      "Library: story time for children on Sundays.",
    ],
    answer: 0,
    why: "水果蔬菜 → 市场每天早上供应新鲜果蔬，匹配。",
  },
];
