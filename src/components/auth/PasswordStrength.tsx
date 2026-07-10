"use client";

import { useMemo } from "react";

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Strong" | "Excellent";
  color: string;
  bar: string;
};

/**
 * Computes a 0–4 strength score for a password and renders a 4-bar meter
 * plus a label. Pure-function: no side effects, no network calls.
 */
const computeStrength = (password: string): Strength => {
  if (!password) {
    return {
      score: 0,
      label: "Too weak",
      color: "text-muted-foreground",
      bar: "bg-muted-foreground/40",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Common-pattern penalty: a password that's just a single word or
  // repeats a single character class tops out at "Fair".
  const onlyOneClass =
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password);
  if (password.length < 10 && onlyOneClass) {
    score = Math.min(score, 2);
  }

  // Clamp to 0..4
  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  const map: Record<0 | 1 | 2 | 3 | 4, Omit<Strength, "score">> = {
    0: { label: "Too weak", color: "text-muted-foreground", bar: "bg-muted-foreground/40" },
    1: { label: "Weak", color: "text-red-400", bar: "bg-red-500" },
    2: { label: "Fair", color: "text-amber-400", bar: "bg-amber-500" },
    3: { label: "Strong", color: "text-emerald-400", bar: "bg-emerald-500" },
    4: {
      label: "Excellent",
      color: "text-violet-300",
      bar: "bg-linear-to-r from-violet-500 to-fuchsia-500",
    },
  };

  return { score: clamped, ...map[clamped] };
};

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color, bar } = useMemo(
    () => computeStrength(password),
    [password]
  );

  // Empty password — render a faint placeholder so the layout doesn't jump
  // when the user starts typing.
  if (!password) {
    return (
      <div className="mt-2 space-y-1" aria-hidden="true">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-muted"
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Use 8+ characters with letters, numbers &amp; symbols.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i < score ? bar : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${color}`}>{label}</p>
    </div>
  );
}
