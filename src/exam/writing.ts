export interface WritingItem {
  kind: "email" | "story";
  level: "A2" | "B1";
  title: string;
  prompt: string;
  zh: string;
  /** Expected content points; scoring checks which words appear. */
  points: { word: string; zh: string }[];
  minWords: number;
  sample: string;
  sampleZh: string;
}

export const WRITING_BANK: WritingItem[] = [
  // ---------- A2 / KET ----------
  {
    kind: "email",
    level: "A2",
    title: "KET Writing Part 6 · 邮件",
    prompt: "You are on holiday with your family. Write a postcard to your English friend. Say: where you are; what the weather is like; what you did yesterday.",
    zh: "你和家人正在度假。给英国朋友写明信片：你在哪里、天气怎样、昨天做了什么。",
    points: [
      { word: "beach", zh: "海滩" },
      { word: "sunny", zh: "晴朗" },
      { word: "swam", zh: "游泳" },
    ],
    minWords: 25,
    sample: "Hi Tom! We are at the beach. The weather is sunny and warm. Yesterday we swam in the sea and ate ice cream. It is great! See you soon. Ben",
    sampleZh: "嗨 Tom！我们在海滩。天气晴朗温暖。昨天我们在海里游泳、吃了冰淇淋。太棒了！很快见。Ben",
  },
  {
    kind: "story",
    level: "A2",
    title: "KET Writing Part 7 · 故事",
    prompt: "Your teacher asked you to write a story. Your story must begin with this sentence: It was a sunny day and I was at the park.",
    zh: "老师让你写一个故事，必须以这句话开头：那是个晴天，我在公园里。",
    points: [
      { word: "park", zh: "公园" },
      { word: "dog", zh: "狗" },
      { word: "happy", zh: "开心" },
    ],
    minWords: 35,
    sample: "It was a sunny day and I was at the park. I saw a small dog near the trees. I played with it and gave it some water. My mum laughed and took a photo. I was very happy that day.",
    sampleZh: "那是个晴天，我在公园里。我看见树旁有只小狗。我陪它玩、给它水喝。妈妈笑了还拍了照。那天我特别开心。",
  },
  // ---------- B1 / PET ----------
  {
    kind: "email",
    level: "B1",
    title: "PET Writing Part 1 · 邮件",
    prompt: "You are going to spend a weekend with your English friend. Write an email to your friend. Say: where and when you want to meet; what sport or games you would like to do; what food you want to eat.",
    zh: "你要和英国朋友共度周末。写一封邮件：约定见面的时间和地点、想做的运动或游戏、想吃的食物。",
    points: [
      { word: "meet", zh: "见面" },
      { word: "sport", zh: "运动" },
      { word: "food", zh: "食物" },
    ],
    minWords: 50,
    sample: "Dear Sam, I'm really looking forward to our weekend together. Let's meet at the station at ten on Saturday. We can play football in the park after lunch, and in the evening I'd like to cook some pizza for us. What do you think? Write back soon. Love, Li Ming",
    sampleZh: "亲爱的 Sam：我很期待我们的周末。周六十点在车站见面吧。午饭后我们可以去公园踢足球，晚上我想给你做披萨。你觉得怎么样？快回信吧。爱你的李明",
  },
  {
    kind: "email",
    level: "B1",
    title: "PET Writing Part 1 · 邮件",
    prompt: "Your English friend has invited you to a birthday party. Write an email to your friend. Say: thank him/her for the invitation; say yes or no; say what you will bring; say how you will get there.",
    zh: "英国朋友邀请你参加生日派对。写一封邮件：感谢邀请、回复是否参加、说你会带什么、怎么过去。",
    points: [
      { word: "thank", zh: "感谢" },
      { word: "party", zh: "派对" },
      { word: "bring", zh: "带" },
    ],
    minWords: 50,
    sample: "Dear Anna, Thank you very much for inviting me to your birthday party on Saturday. I'd love to come! I'll bring a chocolate cake and a small gift for you. My mum will drive me there, so I can arrive at four o'clock. See you soon! Best wishes, Wei",
    sampleZh: "亲爱的 Anna：非常感谢你邀请我参加周六的生日派对。我很乐意去！我会带一个巧克力蛋糕和一份小礼物。妈妈会开车送我，四点能到。到时见！韦",
  },
  {
    kind: "story",
    level: "B1",
    title: "PET Writing Part 2 · 短故事",
    prompt: "Your teacher has asked you to write a story for an international magazine. Your story must begin with this sentence: Last Saturday, I went to a new place with my family.",
    zh: "老师让你为国际杂志写一个故事，必须以这句话开头：上周六，我和家人去了一个新地方。",
    points: [
      { word: "went", zh: "去了" },
      { word: "family", zh: "家人" },
      { word: "happy", zh: "开心" },
    ],
    minWords: 80,
    sample: "Last Saturday, I went to a new place with my family. It was the science museum in the city centre. My little brother loved the robot show, and my parents enjoyed the old photos of our town. We had lunch in a small café nearby. I felt really happy because we don't often go out together. It was a wonderful day.",
    sampleZh: "上周六，我和家人去了一个新地方——市中心的科技馆。弟弟最喜欢机器人表演，父母喜欢老照片展。我们在附近小咖啡馆吃了午饭。我很开心，因为我们很少一起出门。真是美好的一天。",
  },
];

/** Rule-based writing check: word count + expected points coverage. */
export function checkWriting(text: string, item: WritingItem): { words: number; points: number; score: number; missing: string[] } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const low = text.toLowerCase();
  const hits = item.points.filter((p) => low.includes(p.word));
  const missing = item.points.filter((p) => !low.includes(p.word)).map((p) => p.zh);
  const lengthOk = words >= item.minWords;
  const pointsOk = hits.length / item.points.length;
  let score = 0;
  if (lengthOk) score += 40;
  else score += Math.max(0, Math.round((words / item.minWords) * 30));
  score += Math.round(pointsOk * 60);
  return { words, points: hits.length, score, missing };
}
