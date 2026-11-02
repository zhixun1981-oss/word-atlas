import { useMemo, useState, useEffect } from "react";
import { useAtlas } from "../atlas/context";
import { hashSeed, shuffle } from "../lib/text";

/** 单词猜谜 · 看中文猜英文，限时挑战 */
export function WordGuessGame({ onClose }: { onClose: () => void }) {
  const atlas = useAtlas();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [finished, setFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const words = useMemo(() => {
    const pool = atlas.words.slice(0, 500);
    return shuffle(pool, hashSeed("guess-" + Date.now())).slice(0, 10);
  }, []);

  const word = words[current];

  useEffect(() => {
    if (finished || showAnswer) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished, showAnswer]);

  const check = () => {
    if (input.trim().toLowerCase() === word.word.toLowerCase()) {
      setScore((s) => s + Math.max(10, timeLeft));
    } else {
      setWrong((w) => w + 1);
    }
    next();
  };

  const next = () => {
    setShowAnswer(false);
    setInput("");
    setTimeLeft(10);
    if (current + 1 >= words.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (finished) {
    return (
      <div className="match-game-overlay" onClick={onClose}>
        <div className="match-game" onClick={(e) => e.stopPropagation()}>
          <h2>🎉 猜谜结束！</h2>
          <p>得分：{score}</p>
          <p>答错：{wrong} 题</p>
          <button className="btn btn-primary" onClick={onClose}>返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="match-game-overlay" onClick={onClose}>
      <div className="match-game" onClick={(e) => e.stopPropagation()}>
        <div className="match-game-head">
          <h3>单词猜谜 {current + 1}/{words.length}</h3>
          <div className="match-game-stats">
            <span className={timeLeft <= 3 ? "is-warn" : ""}>⏱ {timeLeft}s</span>
            <span>得分 {score}</span>
          </div>
        </div>

        <div className="guess-game-body">
          <p className="guess-zh">{word.zh}</p>
          <p className="guess-hint">输入对应的英文单词：</p>
          <input
            className="guess-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            autoFocus
            placeholder="输入英文单词..."
          />
          {showAnswer && (
            <p className="guess-answer">正确答案：<b>{word.word}</b></p>
          )}
          <div className="guess-buttons">
            <button className="btn btn-primary" onClick={check}>确认</button>
            <button className="btn" onClick={next}>跳过</button>
          </div>
        </div>
      </div>
    </div>
  );
}
