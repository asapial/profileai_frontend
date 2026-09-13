"use client";
import { useId } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

const stops = [0, .16, .4, .56, .82, 1];
// Keep the same three surfaces mounted. They unfold from resume sections into
// evidence cards, then become tracker columns. No renderer, texture or RAF loop.
function Surface({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const x = useTransform(progress, stops, [122, 122, 57, 57, 34 + index * 155, 34 + index * 155]);
  const y = useTransform(progress, stops, [230 + index * 68, 230 + index * 68, 164 + index * 84, 164 + index * 84, 169, 169]);
  const width = useTransform(progress, stops, [274, 274, 405, 405, 142, 142]);
  const height = useTransform(progress, stops, [52, 52, 68, 68, 235, 235]);
  return <motion.rect x={x} y={y} width={width} height={height} rx={12} className="morph-surface" />;
}
export function MorphingCareerScene({ progress }: { progress: MotionValue<number> }) {
  const id = useId().replace(/:/g, "");
  const x = useTransform(progress, stops, [98, 98, 30, 30, 16, 16]);
  const y = useTransform(progress, stops, [42, 42, 72, 72, 76, 76]);
  const width = useTransform(progress, stops, [322, 322, 462, 462, 490, 490]);
  const height = useTransform(progress, stops, [427, 427, 375, 375, 361, 361]);
  const resume = useTransform(progress, [0, .16, .28], [1, 1, 0]);
  const match = useTransform(progress, [.29, .4, .56, .68], [0, 1, 1, 0]);
  const tracker = useTransform(progress, [.69, .82, 1], [0, 1, 1]);
  const rotateY = useTransform(progress, stops, [-19, -19, 12, 12, -10, -10]);
  const rotateX = useTransform(progress, stops, [10, 10, -5, -5, 8, 8]);
  const rotateZ = useTransform(progress, stops, [-5, -5, 2, 2, -2, -2]);
  return <motion.div className="morph-object" style={{ rotateY, rotateX, rotateZ }} aria-hidden="true">
    <svg viewBox="0 0 520 520" className="morph-svg" focusable="false">
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop className="morph-paper-start" /><stop offset=".55" className="morph-paper-mid" /><stop offset="1" className="morph-paper-end" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".95" /><stop offset=".45" stopColor="#c5a7ff" stopOpacity=".2" /><stop offset="1" stopColor="#a786da" stopOpacity=".65" />
        </linearGradient>
      </defs>
      <motion.rect x={x} y={y} width={width} height={height} rx={22} transform="translate(15 20)" className="morph-depth-back" />
      <motion.rect x={x} y={y} width={width} height={height} rx={22} transform="translate(7 10)" className="morph-depth" />
      <motion.rect x={x} y={y} width={width} height={height} rx={22} className="morph-sheet" style={{ fill: `url(#${id}-paper)`, stroke: `url(#${id}-rim)` }} />
      {[0, 1, 2].map(index => <Surface key={index} index={index} progress={progress} />)}
      <motion.g style={{ opacity: resume }}>
        <path d="M 126 91 H 390" className="morph-rule" /><text x="126" y="76" className="morph-eyebrow">PROFILE / YOUR EXPERIENCE</text>
        <path d="M 337 116 l 12 -7 12 7 v 14 l -12 7 -12 -7 z" className="morph-seal" /><text x="349" y="126" textAnchor="middle" className="morph-seal-text">✓</text><circle cx="148" cy="124" r="23" className="morph-accent" /><text x="148" y="129" textAnchor="middle" className="morph-avatar-text">AM</text>
        <text x="125" y="181" className="morph-name">Alex Morgan</text><text x="126" y="203" className="morph-muted">Frontend Engineer</text>
        {[['EXPERIENCE', 'Built a customer dashboard.'], ['SKILLS', 'React · TypeScript · Design systems'], ['PROJECTS', 'Reusable component library.']].map(([label, value], i) => <g key={label}><text x="136" y={249 + i * 68} className="morph-eyebrow">{label}</text><text x="136" y={268 + i * 68} className="morph-small">{value}</text></g>)}
        <text x="127" y="450" className="morph-muted">One story. Built on real work.</text>
      </motion.g>
      <motion.g style={{ opacity: match }}>
        <text x="58" y="105" className="morph-eyebrow">JOB ALIGNMENT / MAKE THE CONNECTION</text><text x="58" y="141" className="morph-heading">Where your experience fits.</text>
        {[["✓", "React experience", "Supported by your dashboard project"], ["?", "Mentoring", "Add a specific example to confirm"], ["+", "Accessibility testing", "No evidence added yet"]].map(([icon, label, value], i) => <g key={label}><circle cx="83" cy={198 + i * 84} r="14" className="morph-accent-soft" /><text x="83" y={203 + i * 84} textAnchor="middle" className="morph-icon">{icon}</text><text x="109" y={192 + i * 84} className="morph-label">{label}</text><text x="109" y={213 + i * 84} className="morph-muted">{value}</text></g>)}
        <text x="59" y="427" className="morph-muted">Evidence coverage. Never a hiring probability.</text>
      </motion.g>
      <motion.g style={{ opacity: tracker }}>
        <text x="36" y="110" className="morph-eyebrow">APPLICATION WORKSPACE / YOUR NEXT MOVE</text><text x="36" y="143" className="morph-heading">A place for every possibility.</text>
        {["PREPARING", "APPLIED", "INTERVIEW"].map((label, i) => <g key={label}><circle cx={50 + i * 155} cy="192" r="3" className="morph-accent" /><text x={61 + i * 155} y="196" className="morph-eyebrow">{label}</text><rect x={44 + i * 155} y="216" width="122" height="104" rx="9" className="morph-job" /><text x={55 + i * 155} y="240" className="morph-small">{["Frontend", "Product", "Design"][i]}</text><text x={55 + i * 155} y="258" className="morph-small">Engineer</text><text x={55 + i * 155} y="287" className="morph-muted">Example Studio</text><text x={55 + i * 155} y="306" className="morph-tiny">{["Review resume", "Awaiting reply", "Prepare story"][i]}</text></g>)}
        <rect x="44" y="333" width="122" height="55" rx="9" className="morph-job" /><text x="55" y="355" className="morph-small">UI Engineer</text><text x="55" y="375" className="morph-tiny">Add your evidence</text><text x="37" y="425" className="morph-muted">Keep the next action in sight.</text>
      </motion.g>
    </svg>
  </motion.div>;
}
