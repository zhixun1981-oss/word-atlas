import { Bookmark, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { toggleBookmark, useStore } from "../store/store";

/** Starred words panel: browse and review bookmarked words. */
export function StarredPanel() {
  const atlas = useAtlas();
  const bookmarks = useStore((s) => s.progress.bookmarks);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setEntries(null);
    void prefetch(atlas, bookmarks).then((list) => {
      if (!alive) return;
      setEntries(list.filter((e): e is Entry => !!e));
    });
    return () => {
      alive = false;
    };
  }, [bookmarks.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bookmarks.length)
    return (
      <section className="panel">
        <h3 className="eyebrow">生词收藏夹</h3>
        <p className="muted">还没有收藏的词。在图鉴里打开任意词条，点右上角的收藏按钮，就会出现在这里。</p>
      </section>
    );

  const openEntry = entries?.find((e) => e.id === open);

  return (
    <section className="panel">
      <div className="panel-head">
        <h3 className="eyebrow">
          生词收藏夹 · {bookmarks.length} 词
        </h3>
        <span className="muted">点开复习 · 再点取消收藏</span>
      </div>
      <div className="starred-grid">
        {entries?.map((e) => {
          const ref = atlas.words.find((w) => w.id === e.id);
          return (
            <button key={e.id} className={`starred-card ${open === e.id ? "is-open" : ""}`} onClick={() => setOpen(open === e.id ? null : e.id)}>
              <img src={`${import.meta.env.BASE_URL}atlas/img/${e.id}.webp`} alt="" loading="lazy" onError={(ev) => (ev.currentTarget.style.display = "none")} />
              <div className="starred-card-copy">
                <b lang="en">{e.w}</b>
                <small>{e.senses[0]?.zh}</small>
                {ref && <em>{atlas.cefr[ref.cefr]} · {atlas.topics[ref.topic]?.[1]}</em>}
              </div>
              <span className="starred-x" onClick={(ev) => { ev.stopPropagation(); toggleBookmark(e.id); }} aria-label="取消收藏">
                <Bookmark size={14} />
              </span>
            </button>
          );
        })}
      </div>
      {openEntry && (
        <div className="starred-open">
          <p className="muted">例句 · <span lang="en">{openEntry.ex[0]?.en}</span></p>
          <p className="dictation-zh">{openEntry.ex[0]?.zh}</p>
          <button className="btn btn-glass" onClick={() => { const el = new Audio(`${import.meta.env.BASE_URL}${atlas.audio(openEntry, "uk")}`); el.play().catch(() => null); }}>
            <Volume2 size={15} /> 听发音
          </button>
        </div>
      )}
    </section>
  );
}
