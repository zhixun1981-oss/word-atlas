import { openWord } from "../lib/router";

const clean = (s: string) => s.replace(/\s*\(.*\)\s*$/, "").trim();
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

interface Node {
  label: string;
  id?: string;
  group: "fam" | "syn" | "ant";
}

const COLORS: Record<Node["group"], string> = { fam: "var(--sage)", syn: "var(--sky)", ant: "var(--terra)" };
const R = 62;
const CX = 100;
const CY = 100;

export function WordGraph({ word, fam, syn, ant }: { word: string; fam: { label: string; id?: string }[]; syn: string[]; ant: string[] }) {
  const nodes: Node[] = [
    ...fam.map((f) => ({ label: f.label, id: f.id, group: "fam" as const })),
    ...syn.map((s) => ({ label: s, id: undefined, group: "syn" as const })),
    ...ant.map((a) => ({ label: a, id: undefined, group: "ant" as const })),
  ];
  if (!nodes.length) return null;
  const rad = (i: number) => ((-90 + (360 / nodes.length) * i) * Math.PI) / 180;
  return (
    <svg className="word-graph" viewBox="0 0 200 200" role="img" aria-label={`${word} 的词族、近义与反义关系图谱`}>
      {nodes.map((nd, i) => {
        const x = CX + R * Math.cos(rad(i));
        const y = CY + R * Math.sin(rad(i));
        const color = COLORS[nd.group];
        return (
          <g key={`${nd.group}-${nd.label}`}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke={color} strokeOpacity="0.3" strokeWidth="1.2" />
            <g className="graph-node" onClick={nd.id ? () => openWord(nd.id!) : undefined} role={nd.id ? "button" : undefined} tabIndex={nd.id ? 0 : undefined} aria-label={nd.id ? `${nd.label}（跳转）` : nd.label}>
              <circle cx={x} cy={y} r={19} fill={color} fillOpacity="0.14" stroke={color} strokeWidth="1.4" />
              <text x={x} y={y + 2.6} textAnchor="middle" fontSize="7.5" fill="currentColor">
                {trunc(clean(nd.label), 9)}
              </text>
            </g>
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={24} fill="var(--terra)" fillOpacity="0.14" stroke="var(--terra)" strokeWidth="1.6" />
      <text x={CX} y={CY + 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor">
        {trunc(clean(word), 9)}
      </text>
    </svg>
  );
}
