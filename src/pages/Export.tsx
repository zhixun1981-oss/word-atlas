import { ChevronLeft, Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { go } from "../lib/router";
import { weakWords } from "../lib/weak";
import { useStore } from "../store/store";

type Scope = "all" | "a1" | "a2" | "b1" | "learned" | "weak" | "mistakes";
type Detail = "basic" | "ipa" | "ex";

const SCOPES: [Scope, string][] = [
  ["all", "全部"],
  ["a1", "A1"],
  ["a2", "A2"],
  ["b1", "B1"],
  ["learned", "已学"],
  ["weak", "薄弱词"],
  ["mistakes", "错词本"],
];
const DETAILS: [Detail, string, string][] = [
  ["basic", "词 + 释义", "立即生成"],
  ["ipa", "+ 音标", "需加载词条"],
  ["ex", "+ 例句", "含中英文例句"],
];

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function ExportPage() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const [scope, setScope] = useState<Scope>("all");
  const [detail, setDetail] = useState<Detail>("basic");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const ids = useMemo(() => {
    const cefr = (l: string) => atlas.cefr.indexOf(l);
    switch (scope) {
      case "a1":
        return atlas.words.filter((w) => w.cefr === cefr("A1")).map((w) => w.id);
      case "a2":
        return atlas.words.filter((w) => w.cefr === cefr("A2")).map((w) => w.id);
      case "b1":
        return atlas.words.filter((w) => w.cefr === cefr("B1")).map((w) => w.id);
      case "learned":
        return Object.keys(progress.cards);
      case "weak":
        return weakWords(progress, 300).map((w) => w.id);
      case "mistakes":
        return progress.mistakes;
      default:
        return atlas.words.map((w) => w.id);
    }
  }, [atlas, progress, scope]);

  const needEntries = detail !== "basic";
  useEffect(() => {
    if (!needEntries) {
      setEntries(null);
      return;
    }
    let alive = true;
    setLoading(true);
    prefetch(atlas, ids).then((list) => {
      if (!alive) return;
      setEntries(list.filter((e): e is Entry => !!e));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [atlas, ids, needEntries]);

  const rows = useMemo(() => {
    const byId = new Map<string, Entry>();
    if (entries) for (const e of entries) byId.set(e.id, e);
    const out: string[][] = [];
    for (const id of ids) {
      const w = atlas.byId.get(id);
      if (!w) continue;
      const e = byId.get(id);
      const zh = e?.senses[0]?.zh ?? w.zh;
      const pos = e?.senses[0]?.pos ?? "";
      const ipa = w.ipa ?? "";
      const ex = e?.ex?.[0];
      if (detail === "basic") out.push([w.word, zh, atlas.cefr[w.cefr], atlas.topics[w.topic]?.[1] ?? ""]);
      else if (detail === "ipa") out.push([w.word, ipa, pos, zh, atlas.cefr[w.cefr]]);
      else out.push([w.word, ipa, pos, zh, ex?.en ?? "", ex?.zh ?? "", atlas.cefr[w.cefr]]);
    }
    return out;
  }, [atlas, ids, entries, detail]);

  const headers = detail === "basic" ? ["单词", "释义", "级别", "话题"] : detail === "ipa" ? ["单词", "音标", "词性", "释义", "级别"] : ["单词", "音标", "词性", "释义", "例句", "例句翻译", "级别"];

  const download = () => {
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-ketpet-${scope}-${detail}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const downloadAnki = () => {
    const lines = rows.map((r) => {
      const word = r[0];
      const ipa = r[1] ?? "";
      const pos = r[2] ?? "";
      const zh = r[3] ?? "";
      const exEn = r[4] ?? "";
      const exZh = r[5] ?? "";
      const front = word;
      const back = `<div>${ipa ? `<small>${ipa}</small> ` : ""}${pos ? `<i>${pos}</i> ` : ""}<b>${zh}</b></div>${exEn ? `<br><small>${exEn}<br>${exZh}</small>` : ""}`;
      return `${front}\t${back}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-anki-${scope}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const count = ids.length;

  const statsLine = useMemo(() => {
    return `已学 ${Object.keys(progress.cards).length.toLocaleString()} 词 · 错词 ${progress.mistakes.length} · 收藏 ${progress.bookmarks.length} · 连续 ${Object.keys(progress.days).length} 天`;
  }, [progress]);

  const exportJson = () => {
    const payload = {
      app: "拾词 Word Atlas",
      exportedAt: new Date().toISOString(),
      counts: { total: atlas.count, learned: Object.keys(progress.cards).length, mistakes: progress.mistakes.length, bookmarks: progress.bookmarks.length },
      progress,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-records-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const exportCsv = async (kind: "mistakes" | "bookmarks") => {
    const ids = kind === "mistakes" ? progress.mistakes : progress.bookmarks;
    const list = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
    const headers = ["单词", "释义", "级别", "话题", kind === "mistakes" ? "答错次数" : "收藏时间"];
    const byId = new Map(list.map((e) => [e.id, e]));
    const rows: string[][] = ids.map((id) => {
      const e = byId.get(id);
      if (!e) return [id, "", "", "", ""];
      const ref = atlas.words.find((w) => w.id === id);
      return [
        e.w,
        e.senses[0]?.zh ?? "",
        ref ? atlas.cefr[ref.cefr] : "",
        ref ? atlas.topics[ref.topic]?.[1] ?? "" : "",
        kind === "mistakes" ? String(progress.mistakes.filter((m) => m === id).length || 1) : "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `word-atlas-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const scopeCounts = useMemo(() => {
    const cefr = (l: string) => atlas.cefr.indexOf(l);
    return {
      all: atlas.words.length,
      a1: atlas.words.filter((w) => w.cefr === cefr("A1")).length,
      a2: atlas.words.filter((w) => w.cefr === cefr("A2")).length,
      b1: atlas.words.filter((w) => w.cefr === cefr("B1")).length,
      learned: Object.keys(progress.cards).length,
      weak: weakWords(progress, 300).length,
      mistakes: progress.mistakes.length,
    };
  }, [atlas, progress]);

  return (
    <div className="page export">
      <header className="page-head export-head">
        <button className="btn btn-ghost" onClick={() => go({ page: "atlas" })}>
          <ChevronLeft size={16} /> 返回图鉴
        </button>
        <p className="eyebrow">导出 · Word Atlas</p>
        <h1 className="display">把词表带走。</h1>
        <p className="lede">选范围、选内容，导出 CSV 或直接打印成纸面词表（打印时可存为 PDF）。</p>
      </header>

      <div className="export-grid">
        <section className="panel">
          <h3 className="eyebrow">范围</h3>
          <div className="segmented segmented-wide">
            {SCOPES.map(([k, label]) => (
              <button key={k} className={scope === k ? "is-on" : ""} onClick={() => setScope(k)} aria-pressed={scope === k}>
                {label}
                <small>{scopeCounts[k] > 0 ? scopeCounts[k].toLocaleString() : ""}</small>
              </button>
            ))}
          </div>
          <h3 className="eyebrow">内容</h3>
          <div className="segmented segmented-wide">
            {DETAILS.map(([k, label, hint]) => (
              <button key={k} className={detail === k ? "is-on" : ""} onClick={() => setDetail(k)} aria-pressed={detail === k} title={hint}>
                {label}
              </button>
            ))}
          </div>
          <p className="muted">
            {needEntries && loading
              ? `正在加载词条详情（${count.toLocaleString()} 词）…`
              : `共 ${count.toLocaleString()} 个词，${detail === "ex" ? "例句为词库原创例句" : detail === "ipa" ? "音标为英美注音" : "基础列为词头与释义"}`}
          </p>
          <div className="export-actions">
            <button className="btn btn-primary btn-xl" onClick={download} disabled={!count || (needEntries && !!loading && !entries)}>
              <Download size={18} /> 导出 CSV
            </button>
            <button className="btn btn-glass btn-xl" onClick={downloadAnki} disabled={!count || (needEntries && !!loading && !entries)}>
              <Download size={18} /> 导出 Anki
            </button>
            <button className="btn btn-glass btn-xl" onClick={() => window.print()} disabled={!count || (needEntries && !!loading && !entries)}>
              <Printer size={18} /> 打印 / 存 PDF
            </button>
          </div>
        </section>

        <section className="panel export-preview">
          <div className="panel-head">
            <h3 className="eyebrow">预览 · 前 12 行</h3>
            <span className="legend">{detail === "basic" ? "即时数据" : loading ? "加载中" : "已加载"}</span>
          </div>
          <div className="export-scroll">
            <table className="export-table">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 12).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} lang={j === 0 || j === 4 ? "en" : undefined} className={j === 0 ? "is-word" : ""}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel export-records">
        <h3 className="eyebrow">学习记录 · JSON / CSV</h3>
        <p className="muted">备份学习进度、错题与收藏，可迁移或打印。</p>
        <div className="export-actions">
          <button className="btn btn-glass" onClick={exportJson} title="进度、错题、收藏、设置">
            <Download size={18} /> 进度 JSON
          </button>
          <button className="btn btn-glass" onClick={() => void exportCsv("mistakes")} title="错词与答错次数">
            <Download size={18} /> 错题 CSV
          </button>
          <button className="btn btn-glass" onClick={() => void exportCsv("bookmarks")} title="收藏词清单">
            <Download size={18} /> 收藏 CSV
          </button>
        </div>
        <p className="muted">{statsLine}</p>
      </section>

      <section className="print-area">
        <div className="print-head">
          <h1>剑桥 KET/PET 词汇表</h1>
          <p>
            {atlas.count.toLocaleString()} 词 · {scope === "all" ? "全部" : scope === "a1" ? "A1" : scope === "a2" ? "A2" : scope === "b1" ? "B1" : scope === "learned" ? "已学" : scope === "weak" ? "薄弱词" : "错词本"} ·{" "}
            {detail === "basic" ? "词 + 释义" : detail === "ipa" ? "含音标" : "含例句"} · 拾词 Word Atlas
          </p>
        </div>
        <table className="export-table print-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} lang={j === 0 || j === 4 ? "en" : undefined} className={j === 0 ? "is-word" : ""}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
