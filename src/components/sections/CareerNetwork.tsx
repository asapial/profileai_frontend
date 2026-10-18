"use client";

import { useId } from "react";
import { Award, BriefcaseBusiness, Code2, FolderKanban, GraduationCap, Trophy, UserRound } from "lucide-react";
import styles from "./CareerSceneDeck.module.css";

const hubs = [
  ["Skills", Code2, 44, 12], ["Projects", FolderKanban, 78, 26],
  ["Achievements", Trophy, 85, 62], ["Certifications", Award, 61, 88],
  ["Education", GraduationCap, 24, 83], ["Experience", BriefcaseBusiness, 13, 39],
] as const;
const tones = ["#b9a1df", "#c5a386", "#c998b6", "#91bfb2", "#a99bd7", "#94b7d2"];
const round = (value: number) => Number(value.toFixed(3));

// A local-neighbour mesh, not a starburst: each neuron has its own connections.
const neurons = Array.from({ length: 84 }, (_, index) => {
  const angle = index * 2.3999632297;
  const radius = Math.sqrt((index + 8) / 92);
  return {
    x: round(300 + Math.cos(angle) * radius * 230),
    y: round(225 + Math.sin(angle) * radius * 171),
    depth: round((Math.sin(index * 1.73) + 1) / 2),
    tone: index % tones.length,
  };
});
const edges = neurons.flatMap((point, index) => neurons
  .map((other, target) => ({ target, distance: Math.hypot(point.x - other.x, point.y - other.y) }))
  .filter(({ target, distance }) => target !== index && distance < 105)
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 3)
  .filter(({ target }) => target > index)
  .map(({ target }) => ({ from: point, to: neurons[target], key: `${index}-${target}` })));

export function CareerNetwork() {
  const gradient = useId().replace(/:/g, "");
  return (
    <div className={styles.network} role="img" aria-label="Your career network: 84 connected evidence neurons grouped into skills, projects, achievements, certifications, education and experience.">
      <div className={styles.networkAtmosphere} aria-hidden="true" />
      <svg className={styles.graph} viewBox="0 0 600 450" aria-hidden="true">
        <defs>
          <radialGradient id={gradient} cx="30%" cy="25%">
            <stop offset="0" stopColor="#fff7ff" /><stop offset=".35" stopColor="#c5b2e3" /><stop offset="1" stopColor="#755494" />
          </radialGradient>
        </defs>
        <ellipse className={styles.networkOrbit} cx="300" cy="225" rx="245" ry="177" />
        <g className={styles.neuralMesh}>
          {edges.map(({ from, to, key }) => <path key={key} d={`M${from.x} ${from.y} Q${round((from.x + to.x) / 2 + (from.y - to.y) * .08)} ${round((from.y + to.y) / 2)} ${to.x} ${to.y}`} pathLength="1" style={{ opacity: .45 + from.depth * .45 }} />)}
        </g>
        {hubs.map(([label, , x, y], index) => {
          const path = `M300 225 C${300 + (x * 6 - 300) * .35} ${y * 4.5} ${x * 6} 225 ${x * 6} ${y * 4.5}`;
          return <g key={label} style={{ color: tones[index] }}><path className={styles.neuralBranch} d={path} pathLength="1" /><path className={styles.neuralPacket} d={path} pathLength="100" style={{ animationDelay: `${index * -.8}s` }} /></g>;
        })}
        {neurons.map((point, index) => <g key={index} className={styles.neuron} style={{ animationDelay: `${index * -.16}s` }}>
          {point.depth > .65 && <circle className={styles.neuronHalo} cx={point.x} cy={point.y} r={round(5 + point.depth * 3)} style={{ fill: tones[point.tone] }} />}
          <circle className={styles.neuronBody} cx={point.x} cy={point.y} r={round(1.7 + point.depth * 2.2)} fill={`url(#${gradient})`} />
        </g>)}
      </svg>
      <div className={`${styles.node} ${styles.centerNode}`}><UserRound /><strong>You</strong><small>CAREER CORE</small></div>
      {hubs.map(([label, Icon, x, y], index) => <div key={label} className={`${styles.node} ${styles[`nodeTone${index}`]}`} style={{ left: `${x}%`, top: `${y}%` }}><Icon /><strong>{label}</strong></div>)}
      <div className={styles.networkLegend}><span /><span>Evidence nodes</span><i /><span>Source connections</span></div>
    </div>
  );
}
