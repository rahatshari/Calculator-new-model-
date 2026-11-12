import React, { useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Check,
  Copy,
  FileText,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { BnInput } from './BnInput';
import { parseBnNum, toBnNum, formatBnCurrency } from '../utils/bengali';
import {
  calculateMultiSoilPit,
  SoilPriceMode,
  SoilCalculationResult,
} from '../utils/calculators';
import { HistoryRecord } from '../utils/storage';
import { PrintableReport } from './PrintSheet';

interface SoilCalculatorViewProps {
  onBack: () => void;
  onSaveHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

export const SoilCalculatorView: React.FC<SoilCalculatorViewProps> = ({
  onBack,
  onSaveHistory,
  onPrint,
  onNotify,
}) => {
  const [note, setNote] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);

  // দৈর্ঘ্য (ডিফল্ট ২টি মাপ, প্লাস বাটনে ক্লিক করলে মাপ ৩ ও মাপ ৪ আসবে)
  const [len1, setLen1] = useState('৫০');
  const [len2, setLen2] = useState('৫০');
  const [len3, setLen3] = useState('');
  const [len4, setLen4] = useState('');
  const [showExtraLen, setShowExtraLen] = useState(false);

  // প্রস্থ (ডিফল্ট ২টি মাপ, প্লাস বাটনে ক্লিক করলে মাপ ৩ ও মাপ ৪ আসবে)
  const [wid1, setWid1] = useState('৩০');
  const [wid2, setWid2] = useState('৩০');
  const [wid3, setWid3] = useState('');
  const [wid4, setWid4] = useState('');
  const [showExtraWid, setShowExtraWid] = useState(false);

  // উচ্চতা / গভীরতা (ডিফল্ট ২টি মাপ, ১টি দিলেও কাজ করবে, প্লাস বাটনে ক্লিক করলে মাপ ৩ ও মাপ ৪ আসবে)
  const [dep1, setDep1] = useState('৫');
  const [dep2, setDep2] = useState('');
  const [dep3, setDep3] = useState('');
  const [dep4, setDep4] = useState('');
  const [showExtraDep, setShowExtraDep] = useState(false);

  // দাম মোড (ডিফল্ট ১০০০ ফুট মাটির দাম)
  const [priceMode, setPriceMode] = useState<SoilPriceMode>('per_1000_cft');
  const [rateInput, setRateInput] = useState('৪৫০০');
  const [result, setResult] = useState<SoilCalculationResult | null>(null);

  const handleCalculateSoil = (e: React.FormEvent) => {
    e.preventDefault();
    const lengths = showExtraLen
      ? [parseBnNum(len1), parseBnNum(len2), parseBnNum(len3), parseBnNum(len4)]
      : [parseBnNum(len1), parseBnNum(len2)];
    const widths = showExtraWid
      ? [parseBnNum(wid1), parseBnNum(wid2), parseBnNum(wid3), parseBnNum(wid4)]
      : [parseBnNum(wid1), parseBnNum(wid2)];
    const depths = showExtraDep
      ? [parseBnNum(dep1), parseBnNum(dep2), parseBnNum(dep3), parseBnNum(dep4)]
      : [parseBnNum(dep1), parseBnNum(dep2)];
    const rate = parseBnNum(rateInput);

    const res = calculateMultiSoilPit(lengths, widths, depths, priceMode, rate);
    if (res.volumeCft <= 0) {
      onNotify('দয়া করে দৈর্ঘ্য, প্রস্থ এবং উচ্চতা/গভীরতার অন্তত ১টি করে মাপ দিন।');
      return;
    }

    setResult(res);

    const rateLabel =
      priceMode === 'per_1000_cft'
        ? `${toBnNum(rate, 2)} টাকা (প্রতি ১০০০ সিএফটি)`
        : `${toBnNum(rate, 2)} টাকা (প্রতি ১ সিএফটি)`;

    const inputsText = `গড় দৈর্ঘ্য: ${toBnNum(res.avgLengthFt, 2)} ফুট, গড় প্রস্থ: ${toBnNum(res.avgWidthFt, 2)} ফুট, গড় উচ্চতা/গভীরতা: ${toBnNum(res.avgDepthFt, 2)} ফুট | দর: ${rateLabel}`;
    const details = [
      { label: 'গড় দৈর্ঘ্য', value: `${toBnNum(res.avgLengthFt, 2)} ফুট` },
      { label: 'গড় প্রস্থ', value: `${toBnNum(res.avgWidthFt, 2)} ফুট` },
      { label: 'গড় উচ্চতা / গভীরতা', value: `${toBnNum(res.avgDepthFt, 2)} ফুট` },
      { label: 'মোট মাটির পরিমাণ (CFT)', value: `${toBnNum(res.volumeCft, 2)} ঘনফুট` },
      { label: 'মোট মাটির পরিমাণ (ঘনমিটার)', value: `${toBnNum(res.volumeCubicMeter, 2)} ঘনমিটার` },
      { label: 'হিসাবের দর', value: rateLabel },
      { label: 'মোট মাটির মূল্য', value: formatBnCurrency(res.totalCost) },
    ];

    onSaveHistory({
      category: 'soil',
      categoryLabel: 'মাটির হিসাব',
      subTypeLabel: 'পুকুর বা গর্তের মাটি পরিমাপ',
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.volumeCft, 2)} ঘনফুট`,
      summarySecondary: `মোট খরচ: ${formatBnCurrency(res.totalCost)}`,
      inputsText,
      details,
    });
  };

  const handleClear = () => {
    setLen1('');
    setLen2('');
    setLen3('');
    setLen4('');
    setWid1('');
    setWid2('');
    setWid3('');
    setWid4('');
    setDep1('');
    setDep2('');
    setDep3('');
    setDep4('');
    setRateInput('');
    setResult(null);
  };

  return (
    <div className="space-y-3">
      {/* মোবাইল সাব-হেডার */}
      <div className="flex items-center justify-between bg-white rounded-[22px] px-3.5 py-2.5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="হোম স্ক্রিনে ফিরে যান"
            className="w-10 h-10 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">মাটির হিসাব</h2>
            <p className="text-[11px] text-slate-500">গর্ত বা পুকুরের মাটি ও খরচের হিসাব</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNoteBox(!showNoteBox)}
          className={`h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            note.trim() || showNoteBox
              ? 'bg-[#d6e3ff] text-[#001b3d]'
              : 'bg-[#f1f5f9] text-slate-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {note.trim() ? 'নোট যুক্ত' : 'নোট'}
        </button>
      </div>

      {showNoteBox && (
        <div className="bg-white rounded-[20px] p-3 border border-slate-200/80 shadow-2xs">
          <input
            id="soil-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="হিসাবের নাম বা নোট লিখুন (যেমন: নতুন পুকুর খনন)..."
            className="w-full h-10 rounded-xl bg-[#f1f5f9] px-3 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
          />
        </div>
      )}

      <form
        onSubmit={handleCalculateSoil}
        className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3.5"
      >
        {/* ১. দৈর্ঘ্য (ফুট) */}
        <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#123e6d]">দৈর্ঘ্য (ফুট)</span>
            <button
              type="button"
              onClick={() => {
                if (showExtraLen) {
                  setLen3('');
                  setLen4('');
                  setShowExtraLen(false);
                } else {
                  setShowExtraLen(true);
                }
              }}
              aria-label={showExtraLen ? 'মাপ ৩ ও ৪ লুকান' : 'মাপ ৩ ও ৪ যোগ করুন'}
              className={`h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showExtraLen
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-[#d6e3ff] text-[#001b3d] hover:bg-[#c2d6ff]'
              }`}
            >
              {showExtraLen ? (
                <>
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪ বাদ দিন</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BnInput id="soil-l1" label="মাপ ১" value={len1} onChange={setLen1} suffix="ফুট" />
            <BnInput id="soil-l2" label="মাপ ২" value={len2} onChange={setLen2} suffix="ফুট" />
            {showExtraLen && (
              <>
                <BnInput id="soil-l3" label="মাপ ৩" value={len3} onChange={setLen3} suffix="ফুট" />
                <BnInput id="soil-l4" label="মাপ ৪" value={len4} onChange={setLen4} suffix="ফুট" />
              </>
            )}
          </div>
        </div>

        {/* ২. প্রস্থ (ফুট) */}
        <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#123e6d]">প্রস্থ (ফুট)</span>
            <button
              type="button"
              onClick={() => {
                if (showExtraWid) {
                  setWid3('');
                  setWid4('');
                  setShowExtraWid(false);
                } else {
                  setShowExtraWid(true);
                }
              }}
              aria-label={showExtraWid ? 'মাপ ৩ ও ৪ লুকান' : 'মাপ ৩ ও ৪ যোগ করুন'}
              className={`h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showExtraWid
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-[#d6e3ff] text-[#001b3d] hover:bg-[#c2d6ff]'
              }`}
            >
              {showExtraWid ? (
                <>
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪ বাদ দিন</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BnInput id="soil-w1" label="মাপ ১" value={wid1} onChange={setWid1} suffix="ফুট" />
            <BnInput id="soil-w2" label="মাপ ২" value={wid2} onChange={setWid2} suffix="ফুট" />
            {showExtraWid && (
              <>
                <BnInput id="soil-w3" label="মাপ ৩" value={wid3} onChange={setWid3} suffix="ফুট" />
                <BnInput id="soil-w4" label="মাপ ৪" value={wid4} onChange={setWid4} suffix="ফুট" />
              </>
            )}
          </div>
        </div>

        {/* ৩. উচ্চতা বা গভীরতা (ফুট) */}
        <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#123e6d]">উচ্চতা বা গভীরতা (ফুট)</span>
            <button
              type="button"
              onClick={() => {
                if (showExtraDep) {
                  setDep3('');
                  setDep4('');
                  setShowExtraDep(false);
                } else {
                  setShowExtraDep(true);
                }
              }}
              aria-label={showExtraDep ? 'মাপ ৩ ও ৪ লুকান' : 'মাপ ৩ ও ৪ যোগ করুন'}
              className={`h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                showExtraDep
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-[#d6e3ff] text-[#001b3d] hover:bg-[#c2d6ff]'
              }`}
            >
              {showExtraDep ? (
                <>
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪ বাদ দিন</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>মাপ ৩ ও ৪</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BnInput id="soil-d1" label="মাপ ১" value={dep1} onChange={setDep1} suffix="ফুট" />
            <BnInput id="soil-d2" label="মাপ ২" value={dep2} onChange={setDep2} suffix="ফুট" />
            {showExtraDep && (
              <>
                <BnInput id="soil-d3" label="মাপ ৩" value={dep3} onChange={setDep3} suffix="ফুট" />
                <BnInput id="soil-d4" label="মাপ ৪" value={dep4} onChange={setDep4} suffix="ফুট" />
              </>
            )}
          </div>
        </div>

        {/* মাটির কাজের দর (Material 3 Segmented Toggle) */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-[#123e6d] px-1 block">
            মাটি কাটার দর নির্ধারণ (টাকা)
          </span>
          <div className="grid grid-cols-2 bg-[#e2e8f0]/90 p-1 rounded-full border border-slate-200/80">
            <button
              type="button"
              onClick={() => setPriceMode('per_1000_cft')}
              className={`h-9 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                priceMode === 'per_1000_cft'
                  ? 'bg-[#123e6d] text-white shadow-xs'
                  : 'text-slate-700'
              }`}
            >
              {priceMode === 'per_1000_cft' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>১০০০ ফুট মাটির দাম</span>
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('per_1_cft')}
              className={`h-9 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                priceMode === 'per_1_cft'
                  ? 'bg-[#123e6d] text-white shadow-xs'
                  : 'text-slate-700'
              }`}
            >
              {priceMode === 'per_1_cft' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>প্রতি ফুট মাটির দাম</span>
            </button>
          </div>

          <BnInput
            id="soil-rate-input"
            label={
              priceMode === 'per_1000_cft'
                ? 'প্রতি ১০০০ ঘনফুট মাটির দাম (টাকা)'
                : 'প্রতি ১ ঘনফুট মাটির দাম (টাকা)'
            }
            value={rateInput}
            onChange={setRateInput}
            suffix="টাকা"
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> মুছুন
          </button>
          <button
            type="submit"
            className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4" /> মাটির হিসাব করুন
          </button>
        </div>

        {result && (
          <div className="mt-4 rounded-[24px] bg-[#f8fafc] border border-slate-200/90 p-4 space-y-3.5">
            <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
                <span>মোট মাটির পরিমাণ (CFT)</span>
                <span>{toBnNum(result.volumeCubicMeter, 2)} ঘনমিটার</span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {toBnNum(result.volumeCft, 2)}{' '}
                <span className="text-lg font-semibold text-sky-100">ঘনফুট</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between">
                <span className="text-xs text-sky-100">মোট মাটির মূল্য:</span>
                <span className="text-lg font-extrabold text-amber-300">
                  {formatBnCurrency(result.totalCost)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white border border-slate-200/80 p-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-500">গড় দৈর্ঘ্য</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {toBnNum(result.avgLengthFt, 2)}'
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-500">গড় প্রস্থ</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {toBnNum(result.avgWidthFt, 2)}'
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-500">গড় উচ্চতা</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {toBnNum(result.avgDepthFt, 2)}'
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = `মাটির হিসাব\nমোট মাটি: ${toBnNum(result.volumeCft, 2)} ঘনফুট (সিএফটি)\nমোট মূল্য: ${formatBnCurrency(result.totalCost)}`;
                  navigator.clipboard.writeText(text);
                  onNotify('ফলাফল কপি করা হয়েছে!');
                }}
                className="h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> কপি
              </button>
              <button
                type="button"
                onClick={async () => {
                  const text = `মাটির হিসাব\nমোট মাটি: ${toBnNum(result.volumeCft, 2)} ঘনফুট (সিএফটি)\nমোট মূল্য: ${formatBnCurrency(result.totalCost)}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'মাটির হিসাব', text });
                      return;
                    } catch {
                      // ignore
                    }
                  }
                  navigator.clipboard.writeText(text);
                  onNotify('শেয়ারের জন্য কপি করা হয়েছে!');
                }}
                className="h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> শেয়ার
              </button>
              <button
                type="button"
                onClick={() =>
                  onPrint({
                    title: 'মাটির হিসাব',
                    subtitle: 'পুকুর বা গর্তের মাটি পরিমাপ',
                    note: note.trim() || undefined,
                    inputsText: `গড় দৈর্ঘ্য: ${toBnNum(result.avgLengthFt, 2)} ফুট, গড় প্রস্থ: ${toBnNum(result.avgWidthFt, 2)} ফুট, গড় উচ্চতা: ${toBnNum(result.avgDepthFt, 2)} ফুট`,
                    summaryPrimary: `${toBnNum(result.volumeCft, 2)} ঘনফুট (CFT)`,
                    summarySecondary: `মোট খরচ: ${formatBnCurrency(result.totalCost)}`,
                    details: [
                      { label: 'মোট ঘনফুট (CFT)', value: `${toBnNum(result.volumeCft, 2)} ঘনফুট` },
                      { label: 'মোট ঘনমিটার', value: `${toBnNum(result.volumeCubicMeter, 2)} ঘনমিটার` },
                      { label: 'মোট মূল্য', value: formatBnCurrency(result.totalCost) },
                    ],
                  })
                }
                className="h-10 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> প্রিন্ট
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
