export interface SpeakingItem {
  q: string;
  zh: string;
  /** Words the answer is expected to contain; used for keyword scoring. */
  hints: string[];
  /** A model answer to show after the user answers. */
  ref: string;
}

export const SPEAKING_BANK: Record<"A2" | "B1", SpeakingItem[]> = {
  A2: [
    { q: "What's your name?", zh: "你叫什么名字？", hints: ["name"], ref: "My name is …" },
    { q: "Where do you come from?", zh: "你来自哪里？", hints: ["from", "live", "come"], ref: "I come from Guangzhou. I live in the city centre." },
    { q: "Do you like sports?", zh: "你喜欢运动吗？", hints: ["like", "sports", "play", "football"], ref: "Yes, I like playing basketball with my friends." },
    { q: "What do you do in your free time?", zh: "空闲时间你做什么？", hints: ["free", "time", "listen", "music", "read", "play"], ref: "In my free time I listen to music and read books." },
    { q: "What's your favourite food?", zh: "你最喜欢的食物是什么？", hints: ["favourite", "food", "like", "rice", "noodles"], ref: "My favourite food is noodles. My mum cooks them for me." },
    { q: "Do you have any pets?", zh: "你有宠物吗？", hints: ["pets", "dog", "cat", "have"], ref: "Yes, I have a small dog. I walk it every day." },
    { q: "What do you study at school?", zh: "你在学校学什么？", hints: ["study", "school", "subjects", "maths", "english"], ref: "I study maths, English and science at school." },
    { q: "Can you tell me about your family?", zh: "能介绍一下你的家人吗？", hints: ["family", "brother", "sister", "parents"], ref: "There are four people in my family: my parents, my brother and me." },
    { q: "What do you want to do in the future?", zh: "将来你想做什么？", hints: ["future", "want", "be", "doctor", "teacher"], ref: "I want to be a doctor and help people." },
    { q: "Do you like watching films?", zh: "你喜欢看电影吗？", hints: ["like", "films", "movies", "watch"], ref: "Yes, I like watching films, especially cartoons." },
  ],
  B1: [
    { q: "What do you like most about your hometown?", zh: "你最喜欢家乡的什么？", hints: ["hometown", "city", "quiet", "beautiful", "food"], ref: "I love the food in my hometown, and it's a quiet, beautiful city." },
    { q: "How often do you use the internet?", zh: "你多久用一次网络？", hints: ["internet", "every", "day", "search", "chat"], ref: "I use the internet every day to search for information and chat with friends." },
    { q: "Tell me about a book you enjoyed.", zh: "讲一本你喜欢的书。", hints: ["book", "read", "story", "interesting"], ref: "I enjoyed a book called Harry Potter. The story is really interesting." },
    { q: "What are you planning to do this weekend?", zh: "这个周末你打算做什么？", hints: ["weekend", "going", "meet", "visit", "stay"], ref: "I'm going to meet my friends and visit a new museum this weekend." },
    { q: "Do you prefer studying alone or with friends?", zh: "你喜欢独自学习还是和朋友一起？", hints: ["alone", "friends", "study", "better"], ref: "I prefer studying alone because it's quieter, but friends help me stay motivated." },
    { q: "What kind of music do you like?", zh: "你喜欢什么音乐？", hints: ["music", "pop", "rock", "listen"], ref: "I like pop music. I listen to it while I do my homework." },
    { q: "How do you usually travel to school?", zh: "你通常怎么去学校？", hints: ["travel", "bus", "bike", "walk"], ref: "I usually walk to school because it's near my home." },
    { q: "What would you like to change about your school?", zh: "你想改变学校的什么？", hints: ["change", "school", "more", "less", "sports"], ref: "I'd like more sports activities after class, and less homework at weekends." },
    { q: "Are you a tidy person?", zh: "你是个整洁的人吗？", hints: ["tidy", "clean", "room"], ref: "Yes, I'm quite tidy. I clean my room every weekend." },
    { q: "What's the best way to learn English?", zh: "学英语最好的方法是什么？", hints: ["english", "practice", "speak", "read"], ref: "The best way is to practice speaking every day and read English books." },
  ],
};

export const SPEAKING_ROUND = 5;

/** Part 2 — picture description: describe the illustration for ~1 minute. */
export interface SpeakingPicture {
  word: string;
  zh: string;
  hints: string[];
  ref: string;
}
export const SPEAKING_PICTURES: Record<"A2" | "B1", SpeakingPicture[]> = {
  A2: [
    { word: "kitchen", zh: "厨房", hints: ["cook", "food", "table", "breakfast", "mum", "help"], ref: "In the picture I can see a kitchen. My mum is cooking food on the table, and I help her with breakfast." },
    { word: "beach", zh: "海滩", hints: ["sea", "sand", "sun", "swim", "ball", "family", "hot"], ref: "This is a beach. The sea is blue, the sand is warm, and people are swimming. My family plays ball on the sand." },
    { word: "market", zh: "市场", hints: ["buy", "fruit", "vegetables", "sell", "people", "cheap"], ref: "The picture shows a market. People buy fruit and vegetables from the sellers. Everything is fresh and cheap." },
    { word: "playground", zh: "操场/游乐场", hints: ["children", "play", "ball", "friends", "run", "happy"], ref: "It's a playground with many children. They run and play ball with their friends. Everyone looks very happy." },
    { word: "garden", zh: "花园", hints: ["flowers", "green", "trees", "grow", "beautiful", "water"], ref: "In the garden there are beautiful flowers and green trees. I grow them and water them every morning." },
    { word: "birthday party", zh: "生日派对", hints: ["cake", "friends", "gifts", "sing", "candles", "happy"], ref: "It's a birthday party. There is a big cake with candles, and my friends sing and give me gifts. I feel very happy." },
  ],
  B1: [
    { word: "kitchen", zh: "厨房", hints: ["ingredients", "recipe", "prepare", "dinner", "family", "together"], ref: "The picture shows a kitchen where the family is preparing dinner together, following a recipe with fresh ingredients." },
    { word: "beach", zh: "海滩", hints: ["coast", "waves", "relax", "holiday", "crowded", "tourists"], ref: "This photo was taken on a beach during the summer holiday. The waves are calm and many tourists come to relax by the coast." },
    { word: "market", zh: "市场", hints: ["customers", "sellers", "bargain", "fresh", "local", "crowd"], ref: "It's a local market. Customers are bargaining with sellers over fresh food, and the crowd makes it lively." },
    { word: "playground", zh: "操场/游乐场", hints: ["equipment", "exercise", "younger", "active", "enjoy", "outdoor"], ref: "The playground has modern equipment. Younger children exercise and enjoy outdoor activities there." },
    { word: "garden", zh: "花园", hints: ["plants", "nature", "peaceful", "care", "environment", "relaxing"], ref: "The garden is full of plants and flowers. It's peaceful and relaxing, and taking care of it connects me to nature." },
    { word: "birthday party", zh: "生日派对", hints: ["celebration", "surprise", "decorations", "guests", "enjoy", "moment"], ref: "It was a celebration with colourful decorations. The guests enjoyed the surprise party and we shared a wonderful moment together." },
  ],
};

/** Part 3 — extended follow-up questions on a topic. */
export const SPEAKING_TOPICS: Record<"A2" | "B1", SpeakingItem[]> = {
  A2: [
    { q: "Tell me more about your best friend.", zh: "再聊聊你最好的朋友。", hints: ["friend", "classmate", "play", "help", "kind"], ref: "My best friend is my classmate. We play together after school, and she is very kind and always helps me." },
    { q: "What do you usually eat for breakfast?", zh: "你早餐通常吃什么？", hints: ["breakfast", "eat", "milk", "bread", "egg"], ref: "I usually have bread, an egg and a glass of milk for breakfast." },
    { q: "Do you help at home? What do you do?", zh: "你在家帮忙吗？做什么？", hints: ["help", "home", "clean", "wash", "tidy"], ref: "Yes, I help at home. I tidy my room and wash the dishes after dinner." },
    { q: "What is your school day like?", zh: "你上学的一天是怎样的？", hints: ["school", "morning", "lessons", "lunch", "homework"], ref: "I go to school in the morning. We have lessons, eat lunch together, and I do my homework in the evening." },
  ],
  B1: [
    { q: "Do you think it's better to study alone or with friends? Why?", zh: "你觉得独自学习好还是和朋友一起好？为什么？", hints: ["alone", "friends", "concentrate", "discuss", "better"], ref: "I think it depends. Studying alone helps me concentrate, but discussing with friends makes difficult ideas easier to understand." },
    { q: "What would you do if you had a free day tomorrow?", zh: "如果明天有一天空闲，你会做什么？", hints: ["free", "day", "visit", "friends", "outdoor"], ref: "If I had a free day, I would visit my friends and spend the afternoon doing something outdoors." },
    { q: "How has technology changed the way you learn?", zh: "科技如何改变了你的学习方式？", hints: ["technology", "internet", "search", "app", "faster"], ref: "Technology helps me learn faster. I search for information on the internet and use learning apps for vocabulary." },
    { q: "What advice would you give someone learning English?", zh: "你会给学英语的人什么建议？", hints: ["advice", "practice", "every day", "speak", "mistakes"], ref: "I would tell them to practice a little every day and not be afraid of making mistakes when they speak." },
  ],
};

/** Keyword-hit score 0..100: how many expected words appear in the answer. */
export function scoreAnswer(transcript: string, hints: string[]): { score: number; hits: string[] } {
  const t = transcript.toLowerCase();
  const hits = hints.filter((h) => t.includes(h));
  return { score: Math.round((hits.length / hints.length) * 100), hits };
}
