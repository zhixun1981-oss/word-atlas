import type { ReactNode } from "react";

export interface RadarAxis {
  label: string;
  /** 0–100 */
  value: number;
  /** false = 该维度暂无练习记录，虚化显示 */
  available?: boolean;
}

/**
 * 零依赖的 N 维雷达图（默认五维）。主题色跟随 CSS 变量，
 * 未 available 的维度点收拢到中心并标注「待积累」。
 */
export function RadarChart({
  axes,
  size = 248,
  max = 100,
}: {
  axes: RadarAxis[];
  size?: number;
  max?: number;
}): ReactNode {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40; // 留出标签空间
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, rr: number): [number, number] => [
    cx + rr * Math.cos(angle(i)),
    cy + rr * Math.sin(angle(i)),
  ];
  const rings = [0.25, 0.5, 0.75, 1];
  const grid = rings.map((f) => axes.map((_, i) => point(i, r * f).join(",")).join(" "));
  const dataPts = axes.map((a, i) => point(i, r * Math.min(1, (a.value || 0) / max)));
  const dataPath = dataPts.map((p) => p.join(",")).join(" ");
  const labels = axes.map((a, i) => {
    const [x, y] = point(i, r + 20);
    const anchor: "start" | "middle" | "end" = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
    return { x, y, anchor, a };
  });

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="学习能力雷达图">
      {grid.map((g, gi) => (
        <polygon key={gi} className="radar-grid" points={g} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, r);
        return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className="radar-area" points={dataPath} />
      {dataPts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3.4}
          className={axes[i].available === false ? "radar-dot is-empty" : "radar-dot"}
        />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          className={l.a.available === false ? "radar-label is-empty" : "radar-label"}
          textAnchor={l.anchor}
          dominantBaseline="middle"
        >
          {l.a.label}
          {l.a.available === false && "·待积累"}
        </text>
      ))}
    </svg>
  );
}
