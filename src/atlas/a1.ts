/**
 * A1 入门层。
 *
 * 原先担心的是「词库里没有 A1 的词」，实际盘点后发现不是——
 * 3097 个词里 1635 个标 A2、1462 个标 B1，A1 是 0，
 * 但 `apple`、`water`、`mother`、`run` 这些词本身全都在库里，只是被标成了 A2。
 * 也就是说缺的是分级，不是词。
 *
 * 所以这里不做「新增词条」，只做「重新标级」：把下面这批地基词从 A2/B1 挪到 A1。
 * 这样做有三个好处，也是当初走错路之后才想明白的：
 *   1. 不产生重复词条（`apple` 只有一条，不会出现 a1-apple 和 another-apple 打架）；
 *   2. 不会破坏分块加载（`entry()` 用 order 算分块号，凭空追加会算出越界的分块）；
 *   3. 这些词自带的音标、插画、真人录音、例句全部保留，不用退回系统 TTS 兜底。
 *
 * 选词依据：剑桥 Pre-A1/A1 阶段的核心话题域（数字与时间、颜色、家庭、身体、
 * 饮食、动物、学校、住家、衣物、出行、天气、人物、高频动词、形容词、功能词、问候）。
 * 这是按话题域整理的教学分级，不是官方 A1 词表的逐条导入——官方词表没有本地副本，
 * 与其假装是，不如说清楚。
 *
 * 只收录词库中确实存在的拼写（小写比对）。数字 two~twenty 之类在词库里写作阿拉伯数字，
 * 不在此列。
 */

export const A1_LEVEL = 0;

/** 话题分组只为可读性，运行时拍平成一个集合。 */
const GROUPS: Record<string, string> = {
  数字时间:
    "one first second monday tuesday wednesday thursday friday saturday sunday " +
    "january february march april may june july august september october november december " +
    "morning afternoon evening night today tomorrow yesterday week month year day hour minute " +
    "o'clock time now early late birthday holiday",
  颜色: "red blue green yellow black white orange pink brown purple colour",
  家庭:
    "family mother father mum dad sister brother grandmother grandfather grandma grandpa " +
    "aunt uncle cousin son daughter baby child parent",
  身体: "head hair eye ear nose mouth tooth face arm hand finger leg foot knee back stomach",
  饮食:
    "bread milk water rice egg apple banana orange meat fish cake tea coffee juice sugar salt " +
    "cheese chicken soup salad sandwich potato tomato fruit vegetable breakfast lunch dinner " +
    "hungry thirsty eat drink",
  动物: "dog cat bird horse cow rabbit mouse sheep duck elephant monkey lion tiger bear",
  学校: "school class teacher student book pen pencil ruler bag desk chair lesson homework music art",
  住家: "house home room bedroom kitchen bathroom door window bed table sofa lamp garden",
  衣物: "clothes shirt dress skirt trousers sock hat coat jacket sweater",
  出行:
    "bus car bike train plane boat shop market park hospital cinema bank station library " +
    "restaurant hotel street road city town village beach",
  天气: "sun sunny rain hot cold warm cool wind snow cloud",
  人物: "boy girl man woman friend people name",
  动词:
    "be have do go come get make take give see look watch listen hear speak say tell read write " +
    "learn play run walk sit stand open close buy sell sleep wake live like love want need know " +
    "think help work study swim sing dance draw paint cook wash clean carry put find lose start " +
    "stop finish wait ask answer",
  形容词: "big small long short tall good bad new old young happy sad fast slow easy difficult beautiful nice",
  虚词:
    "this that these those here there what who where when why how and but or because in on at to " +
    "from with under near behind between not very too",
  问候: "hello hi goodbye bye please thank sorry yes no",
};

const WORDS = new Set(
  Object.values(GROUPS)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean),
);

/** 这份名单里有几个词，仅用于自检脚本。 */
export const A1_LISTED = WORDS.size;

export function isA1(word: string): boolean {
  return WORDS.has(word.trim().toLowerCase());
}
