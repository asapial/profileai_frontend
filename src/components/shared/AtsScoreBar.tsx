type AtsScoreBarProps = {
  score: number;
  label?: string;
};

export function AtsScoreBar({ score, label = "ATS score" }: AtsScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-[--color-text-body]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[--color-badge-bg]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: "var(--grad-bar)" }}
        />
      </div>
      <span className="w-11 text-right text-sm font-medium text-[--color-accent-hover]">{score}%</span>
    </div>
  );
}
