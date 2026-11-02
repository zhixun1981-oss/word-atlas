import { useRef, useState, useEffect } from "react";
import { useAtlas } from "../atlas/context";
import { Download } from "lucide-react";

/** 单词壁纸生成器 · 用 canvas 生成带单词的壁纸 */
export function WallpaperGenerator({ onClose }: { onClose: () => void }) {
  const atlas = useAtlas();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState(atlas.words[0]);

  useEffect(() => {
    // 随机选一个词
    const randomWord = atlas.words[Math.floor(Math.random() * atlas.words.length)];
    setWord(randomWord);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !word) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 装饰圆
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.arc(80, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(300, 400, 80, 0, Math.PI * 2);
    ctx.fill();

    // 单词
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.fillText(word.word, canvas.width / 2, canvas.height / 2 - 20);

    // 音标
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(word.ipa ?? "", canvas.width / 2, canvas.height / 2 + 20);

    // 中文意思
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(word.zh, canvas.width / 2, canvas.height / 2 + 60);

    // 底部小字
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("拾词 Word Atlas", canvas.width / 2, canvas.height - 30);
  }, [word]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `word-${word.word}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const randomize = () => {
    const randomWord = atlas.words[Math.floor(Math.random() * atlas.words.length)];
    setWord(randomWord);
  };

  return (
    <div className="match-game-overlay" onClick={onClose}>
      <div className="match-game" onClick={(e) => e.stopPropagation()}>
        <h3>单词壁纸生成器</h3>
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          style={{ maxWidth: "100%", borderRadius: 12, margin: "16px 0" }}
        />
        <div className="guess-buttons">
          <button className="btn" onClick={randomize}>换一个词</button>
          <button className="btn btn-primary" onClick={download}>
            <Download size={16} /> 下载壁纸
          </button>
        </div>
      </div>
    </div>
  );
}
