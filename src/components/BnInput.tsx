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
        className={`bn-input-box relative flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 focus-within:bg-white focus-within:border-[#123e6d] focus-within:ring-2 focus-within:ring-[#123e6d]/15 transition-all ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
        }`}
      >
        <label
          htmlFor={inputId}
          className={`text-[11px] font-semibold text-slate-500 leading-tight select-none ${!suffix ? 'text-center' : ''}`}
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
              !suffix ? 'text-center' : ''
            } ${compact ? 'text-sm' : 'text-base'}`}
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

interface BnFeetInchInputProps {
  idPrefix: string;
  label: string;
  ftValue: string;
  inValue: string;
  onFtChange: (bnValue: string) => void;
  onInChange: (bnValue: string) => void;
  ftPlaceholder?: string;
  inPlaceholder?: string;
  className?: string;
}

/**
 * এক ঘরের ভেতরেই পাশাপাশি 'ফুট' ও 'ইঞ্চি' ইনপুট নেওয়ার বড় ও প্রশস্ত বক্স (সব লেখা ও সংখ্যা মাঝ বরাবর)
 */
export const BnFeetInchInput: React.FC<BnFeetInchInputProps> = ({
  idPrefix,
  label,
  ftValue,
  inValue,
  onFtChange,
  onInChange,
  ftPlaceholder = '০',
  inPlaceholder = '০',
  className = '',
}) => {
  const ftId = `${idPrefix}-ft`;
  const inId = `${idPrefix}-in`;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="bn-input-box relative flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 focus-within:bg-white focus-within:border-[#123e6d] focus-within:ring-2 focus-within:ring-[#123e6d]/15 px-3 py-2.5 transition-all">
        <span className="text-[11.5px] font-extrabold text-[#123e6d] leading-tight select-none mb-1.5 truncate text-center">
          {label}
        </span>
        <div className="grid grid-cols-[1fr_1px_1fr] items-stretch gap-2">
          <label
            htmlFor={ftId}
            className="flex flex-col items-center cursor-text min-w-0"
          >
            <span className="text-[11px] font-bold text-slate-500 leading-none mb-1 select-none text-center">
              ফুট
            </span>
            <input
              id={ftId}
              type="text"
              inputMode="decimal"
              aria-label={`${label} (ফুট)`}
              value={ftValue}
              onChange={(e) => onFtChange(normalizeToBnInput(e.target.value))}
              placeholder={ftPlaceholder}
              className="w-full min-w-0 bg-transparent text-lg font-extrabold text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums leading-tight text-center"
            />
          </label>

          <div
            aria-hidden="true"
            className="bn-input-divider w-px bg-slate-300/90 my-0.5 justify-self-center"
          />

          <label
            htmlFor={inId}
            className="flex flex-col items-center cursor-text min-w-0"
          >
            <span className="text-[11px] font-bold text-slate-500 leading-none mb-1 select-none text-center">
              ইঞ্চি
            </span>
            <input
              id={inId}
              type="text"
              inputMode="decimal"
              aria-label={`${label} (ইঞ্চি)`}
              value={inValue}
              onChange={(e) => onInChange(normalizeToBnInput(e.target.value))}
              placeholder={inPlaceholder}
              className="w-full min-w-0 bg-transparent text-lg font-extrabold text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums leading-tight text-center"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

