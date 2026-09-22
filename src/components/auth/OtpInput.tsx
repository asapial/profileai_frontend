"use client";

import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

interface OtpInputProps {
  /** Called with the full 6-char string whenever any digit changes */
  onChange: (value: string) => void;
  /** If true, show a red ring on all boxes */
  hasError?: boolean;
  /** Allow parent to reset: pass a new key to re-mount */
  disabled?: boolean;
  /** Aria label for the group */
  label?: string;
}

/**
 * Animated 6-digit OTP input group.
 * Features: auto-advance, backspace retreat, paste support, pop animation on fill.
 */
export function OtpInput({ onChange, hasError, disabled, label }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const update = useCallback(
    (next: string[]) => {
      setDigits(next);
      onChange(next.join(""));
    },
    [onChange]
  );

  const triggerPop = (index: number) => {
    setPopIndex(index);
    setTimeout(() => setPopIndex(null), 300);
  };

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const char = raw.slice(-1);
    const next = [...digits];
    if (char) {
      next[index] = char;
      update(next);
      triggerPop(index);
      if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    } else {
      next[index] = "";
      update(next);
    }
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < Math.min(text.length, OTP_LENGTH); i++) {
      next[i] = text[i]!;
    }
    update(next);
    const lastFill = Math.min(text.length, OTP_LENGTH) - 1;
    inputRefs.current[Math.min(lastFill + 1, OTP_LENGTH - 1)]?.focus();
    // Pop all filled
    next.forEach((d, i) => { if (d) { setTimeout(() => { setPopIndex(i); setTimeout(() => setPopIndex(null), 300); }, i * 40); } });
  };

  const allFilled = digits.every(Boolean);

  return (
    <div
      role="group"
      aria-label={label ?? "Six-digit verification code"}
      className="flex gap-2 sm:justify-between"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-xl border text-center text-xl font-bold transition-all duration-150 sm:h-14 sm:max-w-12",
            "focus-visible:outline-none",
            popIndex === index && "animate-auth-otp-pop",
            digit
              ? allFilled && !hasError
                ? "border-violet-500/60 bg-violet-500/10 text-violet-300 shadow-[0_0_0_3px_rgba(139,92,246,0.18)]"
                : "border-violet-400/40 bg-violet-500/5 text-foreground"
              : "border-border bg-background/50 text-foreground",
            hasError && "border-destructive/60 bg-destructive/5 text-destructive",
            "focus:border-violet-400/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)] focus:bg-violet-500/5"
          )}
        />
      ))}
    </div>
  );
}

/** Returns the current value from an OtpInput ref */
export { OTP_LENGTH };
