import React from 'react';
import { BENGALI_DIGITS, ENGLISH_DIGITS } from '../utils/bengali';

interface BnInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (bnValue: string) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Converts any mixed English/Bengali numeric input string into clean Bengali digits (০-৯) with at most one decimal point.
 */
export function normalizeToBnInput(raw: string): string {
  if (!raw) return '';
  let out = '';
  let hasDot = false;

  for (const ch of raw) {
    const enIdx = ENGLISH_DIGITS.indexOf(ch);
    if (enIdx !== -1) {
      out += BENGALI_DIGITS[enIdx];
      continue;
    }
    const bnIdx = BENGALI_DIGITS.indexOf(ch);
    if (bnIdx !== -1) {
      out += ch;
      continue;
    }
    if ((ch === '.' || ch === '।') && !hasDot) {
      out += '.';
      hasDot = true;
    }
  }
  return out;
}

export const BnInput: React.FC<BnInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '০',
  suffix,
  compact = false,
  className = '',
}) => {
  const inputId = id || `bn-input-${label.replace(/\s+/g, '-')}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeToBnInput(e.target.value);
    onChange(normalized);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className={`relative flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 focus-within:bg-white focus-within:border-[#123e6d] focus-within:ring-2 focus-within:ring-[#123e6d]/15 transition-all ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
        }`}
      >
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold text-slate-500 leading-tight select-none"
        >
          {label}
        </label>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full bg-transparent font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none ${
              compact ? 'text-sm' : 'text-base'
            }`}
          />
          {suffix && (
            <span className="pointer-events-none shrink-0 text-[11px] font-bold text-[#123e6d] bg-[#d6e3ff]/70 px-2 py-0.5 rounded-full">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
