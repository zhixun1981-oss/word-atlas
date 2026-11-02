import { Check, RotateCcw, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PItem {
  id: string;
  zh: string;
  frame: string;
  sample: string;
}

/** PET Speaking Part 2: look at the picture and talk about it for one minute. */
const ITEMS: PItem[] = [
  { id: "park", zh: "公园", frame: "This picture shows… There is/are… In the background…", sample: "This picture shows a sunny park. There are some trees and a picnic blanket under them. In the background I can see people walking along the path. They look happy and relaxed." },
  { id: "beach", zh: "海滩", frame: "This picture shows… On the beach… In the water…", sample: "This picture shows a beach after breakfast. There are smooth stones and shells on the sand. In the water, some people are swimming. It is a quiet and peaceful place." },
  { id: "station", zh: "车站", frame: "This picture shows… People are… In the background…", sample: "This picture shows a busy station. Two people are carrying heavy suitcases and hurrying to the platform. In the background I can see a train and a big clock. Everyone is in a hurry." },
  { id: "market", zh: "集市", frame: "This picture shows… People are buying… On the stalls…", sample: "This picture shows a morning market. People are buying fresh peaches and vegetables from the stalls. In the background there is a small shop with bread. It is colourful and full of life." },
  { id: "library", zh: "图书馆", frame: "This picture shows… A person is… On the shelves…", sample: "This picture shows a quiet library. A student is borrowing three books at the desk. On the shelves behind her there are hundreds of books. It is a good place to study." },
  { id: "mountain", zh: "山", frame: "This picture shows… The weather is… At the top…", sample: "This picture shows a high mountain. Snow covers the mountain even in the middle of summer. At the top there are some clouds. It looks cold but very beautiful." },
];

const ART = (id: string) => `${import.meta.env.BASE_URL}atlas/img/${id}.webp`;

export function PictureTalk({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"prep" | "talk" | "done">("prep");
  const [seconds, setSeconds] = useState(60);
  const [seen, setSeen] = useState(false);
  const timer = useRef<number | null>(null);
  const cur = ITEMS[i];

  useEffect(() => {
    setPhase("prep");
    setSeconds(60);
    setSeen(false);
  }, [i]);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const start = () => {
    setPhase("talk");
    setSeconds(60);
    timer.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) window.clearInterval(timer.current);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    setPhase("done");
  };

  if (phase === "done")
    return (
      <div className="page practice typing">
        <header className="typing-top">
          <button className="btn btn-ghost" onClick={onExit}>结束</button>
          <div className="learn-progress"><span style={{ width: "100%" }} /></div>
          <span className="typing-meter">看图说话</span>
        </header>
        <section className="typing-stage">
          <div className="picture-card">
            <img src={ART(cur.id)} alt={cur.zh} />
          </div>
          <div className="sound-challenge">
            <p className={`dialogue-level ${seconds === 0 ? "is-urgent" : ""}`}>{seconds === 0 ? "时间到！" : "说完了？"}</p>
            <p className="muted">参考描述（Part 2 用 1 分钟说 4–5 句）：</p>
            <p className="talk-sample" lang="en">{cur.sample}</p>
            <div className="summary-actions">
              <button className="btn btn-ghost" onClick={() => setI(i + 1)}>下一张</button>
              <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
                <RotateCcw size={18} /> 重来一轮
              </button>
            </div>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>结束</button>
        <div className="learn-progress">
          <span style={{ width: `${((60 - seconds) / 60) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <Timer size={14} /> {seconds}s
        </span>
      </header>
      <section className="typing-stage">
        <div className="picture-card">
          <img src={ART(cur.id)} alt={cur.zh} />
          <div className="picture-card-meta">
            <span className="dialogue-level">PET Speaking Part 2 · 看图说话</span>
            <p className="muted">图：{cur.zh} · 用 1 分钟描述</p>
          </div>
        </div>
        <div className="sound-challenge">
          <p className="muted">句型框架：{cur.frame}</p>
          {phase === "prep" && (
            <div className="summary-actions">
              <button className="btn btn-primary btn-xl" onClick={start}>
                <Timer size={18} /> 开始 60 秒描述
              </button>
              {!seen && (
                <button className="btn btn-ghost" onClick={() => setSeen(true)}>
                  先看参考
                </button>
              )}
            </div>
          )}
          {phase === "prep" && seen && (
            <p className="talk-sample" lang="en">{cur.sample}</p>
          )}
          {phase === "talk" && (
            <div className="summary-actions">
              <button className="btn btn-primary" onClick={stop}>
                <Check size={18} /> 说完了，看参考
              </button>
            </div>
          )}
        </div>
        <p className="muted typing-help">第 {i + 1}/{ITEMS.length} 张 · 说清「哪里 + 谁 + 在做什么 + 背景」。</p>
      </section>
    </div>
  );
}
