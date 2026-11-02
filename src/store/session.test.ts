import assert from "node:assert/strict";
import { test } from "node:test";
import { nextNew } from "./session";
import { defaultSettings, emptyProgress } from "./store";
import { resolveLevel, usedLevels } from "../atlas/levels";
import type { Atlas, WordRef } from "../atlas/types";

/** 只够跑 nextNew 的假图鉴：每个档位放几个词，B2 以上留空。 */
function fakeAtlas(levels: number[]): Atlas {
  const words: WordRef[] = levels.map((cefr, i) => ({
    id: `w${i}`,
    word: `w${i}`,
    zh: "",
    ipa: "",
    cefr,
    topic: 0,
    media: 0,
    order: i,
  }));
  return {
    id: "t",
    name: "t",
    kind: "open",
    count: words.length,
    examples: 0,
    illustrated: 0,
    topics: [["daily", "日常"]],
    cefr: ["A1", "A2", "B1", "B2", "C1", "C2"],
    words,
    byId: new Map(words.map((w) => [w.id, w])),
    entry: async () => {
      throw new Error("unused");
    },
    peek: () => undefined,
    img: () => null,
    audio: () => null,
  };
}

test("usedLevels only reports levels that actually have words", () => {
  assert.deepEqual(usedLevels(fakeAtlas([0, 0, 1, 2, 2])), [0, 1, 2]);
});

test("resolveLevel falls back to the nearest lower level that has words", () => {
  const atlas = fakeAtlas([0, 1, 2]);
  assert.equal(resolveLevel(atlas, 2), 2, "B1 保持不变");
  assert.equal(resolveLevel(atlas, 3), 2, "B2 空 → 降到 B1");
  assert.equal(resolveLevel(atlas, 5), 2, "C1 空 → 降到 B1");
  assert.equal(resolveLevel(atlas, 0), 0, "A1 保持不变");
});

test("asking for an empty level starts at the nearest one below, not at A1", () => {
  const atlas = fakeAtlas([0, 0, 1, 1, 2, 2]);
  const p = emptyProgress("t");
  // 老设置里存着 startLevel=3(B2)：修复前这里会返回 A1 的词。
  const picked = nextNew(atlas, p, { ...defaultSettings, startLevel: 3 }, 2);
  assert.equal(picked.length, 2);
  for (const id of picked) assert.equal(atlas.byId.get(id)?.cefr, 2, `${id} 应该是 B1`);
});

test("finishing a level moves down one step at a time, not straight to A1", () => {
  const atlas = fakeAtlas([0, 0, 1, 1, 2, 2]);
  const p = emptyProgress("t");
  // 把 B1 两个词都标成学过，下一个该是 A2，而不是 A1。
  p.cards["w4"] = { due: 0 } as never;
  p.cards["w5"] = { due: 0 } as never;
  const picked = nextNew(atlas, p, { ...defaultSettings, startLevel: 2 }, 2);
  assert.equal(picked.length, 2);
  for (const id of picked) assert.equal(atlas.byId.get(id)?.cefr, 1, `${id} 应该是 A2`);
});

test("an empty atlas returns nothing rather than crashing", () => {
  const atlas = fakeAtlas([]);
  assert.deepEqual(usedLevels(atlas), []);
  assert.deepEqual(nextNew(atlas, emptyProgress("t"), defaultSettings, 5), []);
});
