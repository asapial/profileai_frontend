'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.padEnd(length, ' ').split('');
    arr[index] = char || ' ';
    const newVal = arr.join('').replace(/ /g, '');
    onChange(newVal.slice(0, length));

    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputs.current[index - 1]?.focus();
        const arr = value.padEnd(length, ' ').split('');
        arr[index - 1] = ' ';
        onChange(arr.join('').trim());
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200',
              'border text-white',
              error
                ? 'border-red-500 bg-red-500/10'
                : value[i]
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 focus:border-purple-500 focus:bg-purple-500/10',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        ))}
      </div>
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  );
}
