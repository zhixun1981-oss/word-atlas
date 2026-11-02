import { useState } from "react";
import { NotebookPen, X } from "lucide-react";
import { store, useStore } from "../store/store";

/** 模块级常量：避免 useStore selector 每次返回新数组引用触发 useSyncExternalStore 无限循环。 */
const NO_TAGS: string[] = [];

/** 用户自定义笔记 · 可编辑 */
export function UserNote({ wordId }: { wordId: string }) {
  const note = useStore((s) => s.progress.notes[wordId] ?? "");
  const tags = useStore((s) => s.progress.tags[wordId] ?? NO_TAGS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const [tagInput, setTagInput] = useState("");

  const save = () => {
    store.progress((p) => ({
      ...p,
      notes: { ...p.notes, [wordId]: draft.trim() },
    }));
    setEditing(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    store.progress((p) => {
      const existing = p.tags[wordId] ?? [];
      if (existing.includes(t)) return p;
      return {
        ...p,
        tags: { ...p.tags, [wordId]: [...existing, t].slice(0, 5) },
      };
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    store.progress((p) => ({
      ...p,
      tags: { ...p.tags, [wordId]: (p.tags[wordId] ?? []).filter((t) => t !== tag) },
    }));
  };

  const PRESET_TAGS = ["写作能用", "听力常考", "老忘", "高频", "难词"];

  return (
    <section className="block user-note-block">
      <h3 className="eyebrow">
        <NotebookPen size={14} style={{ marginRight: 4 }} />
        我的笔记
      </h3>

      {editing ? (
        <div className="note-editor">
          <textarea
            className="note-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="写个自己的例句，或者记点易错点……"
            rows={3}
            autoFocus
          />
          <div className="note-editor-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(note); setEditing(false); }}>取消</button>
            <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
          </div>
        </div>
      ) : (
        <div className="note-display" onClick={() => { setDraft(note); setEditing(true); }}>
          {note ? <p>{note}</p> : <p className="muted">点这里写笔记……</p>}
        </div>
      )}

      <div className="note-tags">
        {tags.map((t) => (
          <span key={t} className="note-tag">
            {t}
            <button onClick={() => removeTag(t)} aria-label={`删除标签 ${t}`}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          className="note-tag-input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
          placeholder="+ 标签"
        />
      </div>
      {tags.length === 0 && (
        <div className="note-tag-presets">
          {PRESET_TAGS.map((t) => (
            <button key={t} className="btn btn-ghost btn-sm note-preset" onClick={() => {
              store.progress((p) => {
                const existing = p.tags[wordId] ?? [];
                if (existing.includes(t)) return p;
                return { ...p, tags: { ...p.tags, [wordId]: [...existing, t].slice(0, 5) } };
              });
            }}>
              {t}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
