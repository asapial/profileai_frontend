export function formatDistanceToNow(
  input: Date,
  options: { addSuffix?: boolean } = {},
): string {
  const seconds = Math.round((input.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, divisor] =
    ranges.find(([, size]) => absolute >= size) ?? ranges[ranges.length - 1];
  const value = Math.round(seconds / divisor);
  if (!options.addSuffix) {
    const label = Math.abs(value) === 1 ? unit : `${unit}s`;
    return `${Math.abs(value)} ${label}`;
  }
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    value,
    unit,
  );
}
