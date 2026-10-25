"use client";

import { useMemo } from "react";

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Strong" | "Excellent";
};

/**
 * Computes a 0–4 strength score for a password and renders a four-segment
 * studio meter. Pure function: no side effects, no network calls.
 */
const computeStrength = (password: string): Strength => {
  if (!password) return { score: 0, label: "Too weak" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Common-pattern penalty: a single-class password tops out at "Fair".
  const onlyOneClass =
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password);
  if (password.length < 10 && onlyOneClass) {
    score = Math.min(score, 2);
  }

  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<0 | 1 | 2 | 3 | 4, Strength["label"]> = {
    0: "Too weak",
    1: "Weak",
    2: "Fair",
    3: "Strong",
    4: "Excellent",
  };

  return { score: clamped, label: labels[clamped] };
};

export function PasswordStrength({ password }: { password: string }) {
  const { score, label } = useMemo(() => computeStrength(password), [password]);
  const tone = score <= 1 ? "weak" : score === 2 ? "fair" : "strong";

  if (!password) {
    return (
      <div className="ax-strength" aria-hidden="true">
        <div className="ax-strength-bars">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="ax-strength-bar" />
          ))}
        </div>
        <p className="ax-strength-note">
          Use 8+ characters with letters, numbers &amp; symbols.
        </p>
      </div>
    );
  }

  return (
    <div className="ax-strength" aria-live="polite">
      <div
        className="ax-strength-bars"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Password strength: ${label}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="ax-strength-bar"
            data-on={i < score || undefined}
            data-tone={tone}
          />
        ))}
      </div>
      <p className="ax-strength-note" data-tone={tone}>
        {label}
      </p>
    </div>
  );
}
