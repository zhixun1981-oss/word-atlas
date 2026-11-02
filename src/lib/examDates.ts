/**
 * 各考试常见考期参考表
 * 数据基于近年规律整理，具体以官方通知为准
 */

export type ExamLevel = "" | "KET" | "PET" | "FCE" | "IELTS" | "TOEFL" | "CET4" | "CET6" | "KAOYAN";

/** 每个考试的考期参考：按月分布，[month, day] 列表 */
const EXAM_DATES: Record<Exclude<ExamLevel, "">, { months: number[]; note: string }> = {
  KET: {
    months: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12], // 机考几乎每月都有
    note: "机考每月都有，提前 1-2 个月报名",
  },
  PET: {
    months: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
    note: "机考每月都有，提前 1-2 个月报名",
  },
  FCE: {
    months: [3, 5, 6, 11, 12],
    note: "每年 5-6 次，机考/纸考都有",
  },
  IELTS: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 几乎每周都有
    note: "几乎每周都有，提前 1-2 周报名即可",
  },
  TOEFL: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 每周都有
    note: "每周都有考试，提前 1 周报名",
  },
  CET4: {
    months: [6, 12], // 每年 6 月和 12 月
    note: "每年 6 月、12 月各一次，在校生才能考",
  },
  CET6: {
    months: [6, 12],
    note: "每年 6 月、12 月各一次，四级过了才能报",
  },
  KAOYAN: {
    months: [12], // 每年 12 月底
    note: "每年 12 月底（倒数第二个周末）",
  },
};

/**
 * 获取最近一场考试的日期
 * @param level 考试类型
 * @param fromDate 从哪天开始算（默认今天）
 * @returns 最近的考试日期（YYYY-MM-DD）和说明
 */
export function getNextExamDate(level: Exclude<ExamLevel, "">, fromDate?: Date): { date: string; note: string } | null {
  const info = EXAM_DATES[level];
  if (!info) return null;

  const now = fromDate ?? new Date();
  const currentYear = now.getFullYear();

  // 找今年剩下的月份里最近的一个
  for (let month = now.getMonth() + 1; month <= 12; month++) {
    if (info.months.includes(month)) {
      // 默认取当月 15 号左右作为考期参考
      const day = level === "CET4" || level === "CET6" ? 15 : level === "KAOYAN" ? 25 : 15;
      const date = new Date(currentYear, month - 1, day);
      if (date >= now) {
        return {
          date: `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          note: info.note,
        };
      }
    }
  }

  // 今年没有了，找明年的第一个月
  if (info.months.length > 0) {
    const firstMonth = Math.min(...info.months);
    const day = level === "CET4" || level === "CET6" ? 15 : level === "KAOYAN" ? 25 : 15;
    return {
      date: `${currentYear + 1}-${String(firstMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      note: info.note,
    };
  }

  return null;
}

/** 获取所有考试的考期说明 */
export function getExamNote(level: ExamLevel): string {
  if (!level) return "";
  return EXAM_DATES[level as Exclude<ExamLevel, "">]?.note ?? "";
}
