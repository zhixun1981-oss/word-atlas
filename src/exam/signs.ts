/**
 * 标识识别（KET Reading Part 1 / PET Reading Part 1）同源模拟题库。
 *
 * 真实考试里这部分是看一张“标识 / 通知 / 告示”的图片，选它在说什么。
 * 这里用文字 + 配色还原标识的样子（红=禁止、蓝=指示、绿=允许/出口等）。
 *
 * ⚠️ 重要：以下全部为**原创模拟练习**，格式、话题、难度对齐真题，
 * 但不是剑桥官方往年真题的原文照搬（官方真题受版权保护，且无法逐字获取）。
 * 真要刷真题请购买剑桥《Official Exam Papers》出版物。
 */

export type SignTone = "red" | "blue" | "green" | "amber" | "grey";

export interface SignItem {
  id: string;
  level: "A2" | "B1";
  /** 标识上的大字。 */
  sign: string;
  /** 配色，用于渲染成“告示牌”的样子。 */
  tone: SignTone;
  /** 题干（中文，给孩子看）。 */
  question: string;
  /** 三个选项，顺序已打乱，第一个即答案的请别信——答案以 `answer` 为准。 */
  options: string[];
  /** 正确选项，必须与 options 中某一项完全一致。 */
  answer: string;
  /** 答完后展示的讲解。 */
  zh: string;
}

export const SIGNS: SignItem[] = [
  {
    id: "s-open",
    level: "A2",
    sign: "OPEN",
    tone: "green",
    question: "这个标识在说什么？",
    options: ["现在关门了", "现在营业 / 开着", "只接预订"],
    answer: "现在营业 / 开着",
    zh: "OPEN 表示“营业中、开着”，看到它就能进去。反义词是 CLOSED（关门）。",
  },
  {
    id: "s-closed",
    level: "A2",
    sign: "CLOSED",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["现在营业中", "今天不开门", "请排队"],
    answer: "今天不开门",
    zh: "CLOSED 表示“关门、不营业”。常出现在商店或景点门口。",
  },
  {
    id: "s-no-smoking",
    level: "A2",
    sign: "NO SMOKING",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["这里可以抽烟", "禁止吸烟", "吸烟区在这边"],
    answer: "禁止吸烟",
    zh: "NO + 动作 = 禁止做这件事。NO SMOKING = 禁止吸烟，常见于餐厅、车站。",
  },
  {
    id: "s-no-parking",
    level: "A2",
    sign: "NO PARKING",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["可以免费停车", "禁止停车", "停车场在楼上"],
    answer: "禁止停车",
    zh: "NO PARKING = 禁止停车。PARK 这里是“停放（车）”的意思。",
  },
  {
    id: "s-exit",
    level: "A2",
    sign: "EXIT",
    tone: "green",
    question: "这个标识在说什么？",
    options: ["入口在这", "出口 / 安全出口", "电梯"],
    answer: "出口 / 安全出口",
    zh: "EXIT = 出口。紧急情况（如火灾）要找绿色 EXIT 标志撤离。",
  },
  {
    id: "s-entrance",
    level: "A2",
    sign: "ENTRANCE",
    tone: "blue",
    question: "这个标识在说什么？",
    options: ["出口", "入口 / 进场处", "洗手间"],
    answer: "入口 / 进场处",
    zh: "ENTRANCE = 入口。和 EXIT（出口）是一对，注意别看反。",
  },
  {
    id: "s-push",
    level: "A2",
    sign: "PUSH",
    tone: "blue",
    question: "门上的这个标识在说什么？",
    options: ["拉", "推", "锁着"],
    answer: "推",
    zh: "PUSH = 推。相对的是 PULL = 拉。过玻璃门先看这个字。",
  },
  {
    id: "s-pull",
    level: "A2",
    sign: "PULL",
    tone: "blue",
    question: "门上的这个标识在说什么？",
    options: ["推", "拉", "请敲门"],
    answer: "拉",
    zh: "PULL = 拉。PUSH（推）和 PULL（拉）是开门必认的一组词。",
  },
  {
    id: "s-wet-floor",
    level: "A2",
    sign: "WET FLOOR",
    tone: "amber",
    question: "这个标识在说什么？",
    options: ["地面刚拖过，小心地滑", "可以滑冰", "地板很干净"],
    answer: "地面刚拖过，小心地滑",
    zh: "WET FLOOR = 地面湿滑，常见于超市、卫生间门口，提示“小心别摔”。",
  },
  {
    id: "s-quiet",
    level: "A2",
    sign: "QUIET PLEASE",
    tone: "grey",
    question: "这个标识在说什么？",
    options: ["请大声说话", "请保持安静", "可以播放音乐"],
    answer: "请保持安静",
    zh: "QUIET = 安静的。图书馆、医院常见 QUIET PLEASE（请安静）。",
  },
  {
    id: "s-no-photo",
    level: "B1",
    sign: "NO PHOTOS",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["欢迎拍照", "禁止拍照", "相机可以借"],
    answer: "禁止拍照",
    zh: "NO PHOTOS = 禁止拍照。博物馆、演出场所常见。PHOTO 的复数是 PHOTOS。",
  },
  {
    id: "s-keep-out",
    level: "B1",
    sign: "KEEP OUT",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["欢迎进入", "请勿入内 / 禁止进入", "请排队等候"],
    answer: "请勿入内 / 禁止进入",
    zh: "KEEP OUT = 别进来、禁止入内。工地、机房等危险区域常见。",
  },
  {
    id: "s-turn-off",
    level: "B1",
    sign: "TURN OFF YOUR PHONE",
    tone: "red",
    question: "这个标识在说什么？",
    options: ["可以打电话", "请关机 / 关掉手机", "手机要充电"],
    answer: "请关机 / 关掉手机",
    zh: "TURN OFF = 关掉。TURN OFF YOUR PHONE = 请关手机，电影院、音乐厅常见。",
  },
  {
    id: "s-toilets",
    level: "A2",
    sign: "TOILETS",
    tone: "blue",
    question: "这个标识在说什么？",
    options: ["洗手间 / 厕所", "饮水处", "售票处"],
    answer: "洗手间 / 厕所",
    zh: "TOILETS = 洗手间（英式说法）。美式常用 RESTROOM / BATHROOM。",
  },
  {
    id: "s-info",
    level: "A2",
    sign: "INFORMATION",
    tone: "blue",
    question: "这个标识在说什么？",
    options: ["问询处 / 服务台", "出口", "禁止入内"],
    answer: "问询处 / 服务台",
    zh: "INFORMATION = 信息、问询处。车站、景区找不到路就去这里问。",
  },
  {
    id: "s-first-aid",
    level: "B1",
    sign: "FIRST AID",
    tone: "green",
    question: "这个标识在说什么？",
    options: ["急救站 / 医务室", "餐厅", "失物招领"],
    answer: "急救站 / 医务室",
    zh: "FIRST AID = 急救。受伤或不适时找这个绿色标志。aid = 帮助、救助。",
  },
];

export function signsFor(level?: "A2" | "B1"): SignItem[] {
  if (!level) return SIGNS;
  return SIGNS.filter((s) => s.level === level);
}
