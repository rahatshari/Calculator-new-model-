import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Calculator,
  Check,
  ChevronUp,
  Copy,
  FileText,
  Printer,
  RotateCcw,
  Ruler,
  Share2,
} from 'lucide-react';
import { BnInput } from './BnInput';
import { parseBnNum, toBnNum } from '../utils/bengali';
import {
  calculateLandByNol,
  calculateReverseNolLand,
  formatNolPartBn,
  NolSideInput,
  NolLandResult,
  ReverseNolResult,
  LandUnitType,
} from '../utils/calculators';
import { HistoryRecord } from '../utils/storage';
import { shareContentNative } from '../utils/nativeBridge';
import { PrintableReport } from './PrintSheet';

interface NolCalculatorViewProps {
  onBack: () => void;
  onSaveHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

type NolTab = 'area' | 'reverse';

interface SideState {
  nol: string;
  hat: string;
  bighat: string;
  angul: string;
}

const NOL_OPTIONS: { value: string; wordLabel: string; numLabel: string; ftLabel: string }[] = [
  { value: '৪', wordLabel: 'চার হাত', numLabel: '৪ হাত (ডিফল্ট)', ftLabel: '৬ ফুট' },
  { value: '৫', wordLabel: 'পাঁচ হাত', numLabel: '৫ হাত', ftLabel: '৭.৫ ফুট' },
  { value: '৬', wordLabel: 'ছয় হাত', numLabel: '৬ হাত', ftLabel: '৯ ফুট' },
  { value: '৭', wordLabel: 'সাত হাত', numLabel: '৭ হাত', ftLabel: '১০.৫ ফুট' },
  { value: '৮', wordLabel: 'আট হাত', numLabel: '৮ হাত', ftLabel: '১২ ফুট' },
];

const UNIT_OPTIONS: { value: LandUnitType; label: string }[] = [
  { value: 'decimal', label: 'শতক / শতাংশ' },
  { value: 'katha', label: 'কাঠা (৩.৩০ শতক)' },
  { value: 'kura', label: 'কুড়া (২০ কাঠা)' },
  { value: 'standard_katha', label: 'কাঠা (৭২০ বর্গফুট)' },
  { value: 'bigha', label: 'বিঘা' },
  { value: 'acre', label: 'একর' },
  { value: 'gonda', label: 'গণ্ডা' },
  { value: 'sqft', label: 'স্কয়ার ফুট' },
];

const UNIT_LABELS: Record<LandUnitType, string> = {
  decimal: 'শতক / শতাংশ',
  katha: 'কাঠা (৩.৩০ শতক)',
  kura: 'কুড়া (২০ কাঠা)',
  standard_katha: 'কাঠা (৭২০ বর্গফুট)',
  bigha: 'বিঘা',
  acre: 'একর',
  gonda: 'গণ্ডা',
  sqft: 'স্কয়ার ফুট',
};

export const NolCalculatorView: React.FC<NolCalculatorViewProps> = ({
  onBack,
  onSaveHistory,
  onPrint,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<NolTab>('area');
  // ডিফল্ট ৪ হাত (চার হাত)
  const [hatPerNol, setHatPerNol] = useState('৪');
  const [nolMenuOpen, setNolMenuOpen] = useState(false);
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);

  // ১. ক্ষেত্রফল নির্ণয় (শুরুতে সব মাপের ঘর খালি থাকবে)
  const [lengthSide, setLengthSide] = useState<SideState>({
    nol: '',
    hat: '',
    bighat: '',
    angul: '',
  });
  const [widthSide, setWidthSide] = useState<SideState>({
    nol: '',
    hat: '',
    bighat: '',
    angul: '',
  });
  const [nolResult, setNolResult] = useState<NolLandResult | null>(null);

  // ২. সীমানা নির্ণয় (শুরুতে সব মাপের ঘর খালি থাকবে)
  const [targetAmount, setTargetAmount] = useState('');
  const [targetUnit, setTargetUnit] = useState<LandUnitType>('decimal');
  const [knownSide, setKnownSide] = useState<SideState>({
    nol: '',
    hat: '',
    bighat: '',
    angul: '',
  });
  const [revResult, setRevResult] = useState<ReverseNolResult | null>(null);

  const selectedNolMeta =
    NOL_OPTIONS.find((o) => o.value === hatPerNol) || NOL_OPTIONS[0];

  const parseSide = (s: SideState): NolSideInput => ({
    nol: parseBnNum(s.nol),
    hat: parseBnNum(s.hat),
    bighat: parseBnNum(s.bighat),
    angul: parseBnNum(s.angul),
  });

  const handleCalculateNolArea = (e: React.FormEvent) => {
    e.preventDefault();
    const hpn = parseBnNum(hatPerNol);
    if (hpn <= 0) {
      onNotify('সঠিক নলের মান (হাত) নির্বাচন করুন।');
      return;
    }

    const lSide = parseSide(lengthSide);
    const wSide = parseSide(widthSide);

    const res = calculateLandByNol(
      { hat: hpn, bighat: 0, angul: 0 },
      lSide,
      wSide
    );
    if (res.sqFt <= 0) {
      onNotify('দয়া করে দৈর্ঘ্য এবং প্রস্থের মাপ দিন।');
      return;
    }
    setNolResult(res);

    const inputsText = `১ নল = ${selectedNolMeta.wordLabel} (${toBnNum(res.nolLengthFt, 2)} ফুট) | দৈর্ঘ্য: ${formatNolPartBn(lSide)} | প্রস্থ: ${formatNolPartBn(wSide)}`;
    const details = [
      { label: '১ নলের মান', value: `${selectedNolMeta.wordLabel} (${toBnNum(res.nolLengthFt, 2)} ফুট)` },
      { label: 'দৈর্ঘ্য ও প্রস্থ (ফুটে)', value: `${toBnNum(res.lengthFt, 2)}' × ${toBnNum(res.widthFt, 2)}'` },
      { label: 'মোট ক্ষেত্রফল', value: `${toBnNum(res.sqFt, 2)} বর্গফুট (${toBnNum(res.sqNol, 2)} বর্গ নল)` },
      { label: 'মোট শতক / শতাংশ', value: `${toBnNum(res.decimal, 3)} শতক` },
      { label: 'কুড়া / কাঠা / ধুর', value: res.mixedText },
      { label: 'কাঠা (৩.৩০ শতক)', value: `${toBnNum(res.katha, 2)} কাঠা` },
      { label: 'কাঠা (৭২০ বর্গফুট)', value: `${toBnNum(res.standardKatha, 2)} কাঠা` },
      { label: 'বিঘা', value: `${toBnNum(res.bigha, 3)} বিঘা` },
      { label: 'একর', value: `${toBnNum(res.acre, 3)} একর` },
      { label: 'গণ্ডা', value: `${toBnNum(res.gonda, 2)} গণ্ডা` },
    ];

    onSaveHistory({
      category: 'nol',
      categoryLabel: 'নলের হিসাব',
      subTypeLabel: `নল দিয়ে ক্ষেত্রফল (${selectedNolMeta.wordLabel})`,
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.decimal, 3)} শতক`,
      summarySecondary: `${toBnNum(res.sqFt, 2)} বর্গফুট | ${res.mixedText}`,
      inputsText,
      details,
    });
  };

  const handleClearNolArea = () => {
    const empty = { nol: '', hat: '', bighat: '', angul: '' };
    setLengthSide(empty);
    setWidthSide(empty);
    setNolResult(null);
  };

  const handleCalculateReverseNol = (e: React.FormEvent) => {
    e.preventDefault();
    const hpn = parseBnNum(hatPerNol);
    const amt = parseBnNum(targetAmount);
    const kSide = parseSide(knownSide);

    if (hpn <= 0 || amt <= 0) {
      onNotify('দয়া করে জমির পরিমাণ এবং নলের মান দিন।');
      return;
    }

    const res = calculateReverseNolLand(hpn, amt, targetUnit, kSide);
    if (res.knownSideFt <= 0) {
      onNotify('দয়া করে জানা বাহুর মাপ দিন।');
      return;
    }

    setRevResult(res);

    const ansFormatted = `${toBnNum(res.ansNol)} নল ${toBnNum(res.ansHat)} হাত ${toBnNum(res.ansBighat)} বিঘাত ${toBnNum(res.ansAngul, 2)} আঙুল`;
    const inputsText = `১ নল = ${selectedNolMeta.wordLabel} | কাঙ্ক্ষিত জমি: ${toBnNum(amt)} ${UNIT_LABELS[targetUnit]} | জানা বাহু: ${formatNolPartBn(kSide)}`;
    const details = [
      { label: 'অজানা দিকের মাপ (নলে)', value: ansFormatted },
      {
        label: 'অজানা দিকের মাপ (ফুটে)',
        value: `${toBnNum(res.ansFt)} ফুট ${toBnNum(res.ansIn, 2)} ইঞ্চি (${toBnNum(res.requiredOppositeFt, 2)} ফুট)`,
      },
      { label: 'মোট বর্গফুট', value: `${toBnNum(res.landDetails.sqFt, 2)} বর্গফুট` },
      { label: 'মোট শতক', value: `${toBnNum(res.landDetails.decimal, 3)} শতক` },
      { label: 'কুড়া / কাঠা / ধুর', value: res.landDetails.mixedText },
    ];

    onSaveHistory({
      category: 'nol',
      categoryLabel: 'নলের হিসাব',
      subTypeLabel: 'নল দিয়ে সীমানা নির্ণয়',
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.ansNol)} নল ${toBnNum(res.ansHat)} হাত`,
      summarySecondary: `${toBnNum(res.ansFt)} ফুট ${toBnNum(res.ansIn, 2)} ইঞ্চি`,
      inputsText,
      details,
    });
  };

  const handleClearReverseNol = () => {
    setTargetAmount('');
    setKnownSide({ nol: '', hat: '', bighat: '', angul: '' });
    setRevResult(null);
  };

  const renderSideInputGroup = (
    title: string,
    prefix: string,
    state: SideState,
    setState: React.Dispatch<React.SetStateAction<SideState>>
  ) => (
    <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3 space-y-2">
      <p className="text-xs font-bold text-[#123e6d] px-0.5">{title}</p>
      <div className="grid grid-cols-4 gap-1.5">
        <BnInput
          id={`${prefix}-nol`}
          label="নল"
          value={state.nol}
          onChange={(v) => setState((prev) => ({ ...prev, nol: v }))}
          compact
        />
        <BnInput
          id={`${prefix}-hat`}
          label="হাত"
          value={state.hat}
          onChange={(v) => setState((prev) => ({ ...prev, hat: v }))}
          compact
        />
        <BnInput
          id={`${prefix}-bighat`}
          label="বিঘাত"
          value={state.bighat}
          onChange={(v) => setState((prev) => ({ ...prev, bighat: v }))}
          compact
        />
        <BnInput
          id={`${prefix}-angul`}
          label="আঙুল"
          value={state.angul}
          onChange={(v) => setState((prev) => ({ ...prev, angul: v }))}
          compact
        />
      </div>
    </div>
  );

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">নলের হিসাব</h2>
            <p className="text-[11px] text-slate-500">নল, হাত, বিঘাত ও আঙুল পরিমাপ</p>
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
            id="nol-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="হিসাবের নাম বা নোট লিখুন (যেমন: উত্তর পাড়ার জমি)..."
            className="w-full h-10 rounded-xl bg-[#f1f5f9] px-3 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
          />
        </div>
      )}

      {/* নলের মান: চার হাত ডিফল্ট + পাশে ছোট পপ-আপ সিলেক্টর বাটন */}
      <div className="relative bg-white rounded-[22px] px-4 py-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            নির্বাচিত নলের মাপ (ডিফল্ট চার হাত)
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-extrabold text-[#123e6d]">
              ১ নল = {selectedNolMeta.wordLabel} ({selectedNolMeta.value} হাত)
            </span>
            <span className="text-[11px] font-bold text-slate-600 bg-[#f1f5f9] px-2 py-0.5 rounded-full">
              {selectedNolMeta.ftLabel}
            </span>
          </div>
        </div>

        {/* ছোট অপশন বাটন যা ক্লিক করলে সুন্দর পপ-আপ উপরে উঠবে */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNolMenuOpen((prev) => !prev)}
            className="h-9 px-3.5 rounded-full bg-[#d6e3ff] hover:bg-[#c2d6ff] active:scale-95 text-[#001b3d] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span>{selectedNolMeta.wordLabel}</span>
            <ChevronUp
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                nolMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {nolMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNolMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-48 rounded-[22px] bg-white border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
                <p className="text-[10px] font-bold text-slate-400 px-3 pt-1 pb-0.5">
                  নলের মাপ নির্বাচন করুন
                </p>
                {NOL_OPTIONS.map((opt) => {
                  const active = hatPerNol === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setHatPerNol(opt.value);
                        setNolMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'bg-[#123e6d] text-white shadow-2xs'
                          : 'text-slate-800 hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{opt.wordLabel}</span>
                        <span
                          className={`text-[10px] ${
                            active ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          ({opt.value} হাত)
                        </span>
                      </div>
                      {active ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <span className="text-[10px] text-slate-400">{opt.ftLabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Material 3 Segmented Button Bar */}
      <div className="grid grid-cols-2 bg-[#e2e8f0]/90 p-1 rounded-full border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('area')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'area'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'area' ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Ruler className="w-3.5 h-3.5" />
          )}
          <span>ক্ষেত্রফল নির্ণয়</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reverse')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'reverse'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'reverse' ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ArrowLeftRight className="w-3.5 h-3.5" />
          )}
          <span>সীমানা নির্ণয়</span>
        </button>
      </div>

      {/* ১. ক্ষেত্রফল নির্ণয় (দৈর্ঘ্য এক পাশেই এবং প্রস্থ এক পাশেই) */}
      {activeTab === 'area' && (
        <form
          onSubmit={handleCalculateNolArea}
          className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="space-y-2.5">
            {renderSideInputGroup('জমির দৈর্ঘ্য', 'nol-len', lengthSide, setLengthSide)}
            {renderSideInputGroup('জমির প্রস্থ', 'nol-wid', widthSide, setWidthSide)}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearNolArea}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> নলের হিসাব করুন
            </button>
          </div>

          {nolResult && (
            <div className="mt-4 rounded-[24px] bg-[#f8fafc] border border-slate-200/90 p-4 space-y-3.5">
              <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
                  <span>মোট ক্ষেত্রফল: {toBnNum(nolResult.sqFt, 2)} বর্গফুট</span>
                  <span>{toBnNum(nolResult.sqNol, 2)} বর্গ নল</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">
                  {toBnNum(nolResult.decimal, 3)}{' '}
                  <span className="text-lg font-semibold text-sky-100">শতক</span>
                </div>
                <div className="mt-2 inline-flex items-center rounded-xl bg-white/15 px-3 py-1 text-xs font-bold text-white">
                  {nolResult.mixedText}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">কাঠা (৩.৩০ শতক)</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {toBnNum(nolResult.katha, 2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">কাঠা (৭২০ বর্গফুট)</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {toBnNum(nolResult.standardKatha, 2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">বিঘা</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {toBnNum(nolResult.bigha, 3)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">একর</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {toBnNum(nolResult.acre, 3)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const text = `নলের হিসাব (${selectedNolMeta.wordLabel})\nমোট জমি: ${toBnNum(nolResult.decimal, 3)} শতক (${toBnNum(nolResult.sqFt, 2)} বর্গফুট)\n${nolResult.mixedText}`;
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
                    const text = `নলের হিসাব (${selectedNolMeta.wordLabel})\nমোট জমি: ${toBnNum(nolResult.decimal, 3)} শতক (${toBnNum(nolResult.sqFt, 2)} বর্গফুট)\n${nolResult.mixedText}`;
                    await shareContentNative('নলের হিসাব', text, onNotify);
                  }}
                  className="h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> শেয়ার
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPrint({
                      title: 'নলের হিসাব',
                      subtitle: `১ নল = ${selectedNolMeta.wordLabel} (${toBnNum(nolResult.nolLengthFt, 2)} ফুট)`,
                      note: note.trim() || undefined,
                      inputsText: `দৈর্ঘ্য: ${toBnNum(nolResult.lengthFt, 2)} ফুট, প্রস্থ: ${toBnNum(nolResult.widthFt, 2)} ফুট`,
                      summaryPrimary: `${toBnNum(nolResult.decimal, 3)} শতক`,
                      summarySecondary: `${toBnNum(nolResult.sqFt, 2)} বর্গফুট | ${nolResult.mixedText}`,
                      details: [
                        { label: 'মোট বর্গফুট', value: `${toBnNum(nolResult.sqFt, 2)} বর্গফুট` },
                        { label: 'মোট শতক', value: `${toBnNum(nolResult.decimal, 3)} শতক` },
                        { label: 'কুড়া / কাঠা / ধুর', value: nolResult.mixedText },
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
      )}

      {/* ২. সীমানা নির্ণয় */}
      {activeTab === 'reverse' && (
        <form
          onSubmit={handleCalculateReverseNol}
          className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <BnInput
              id="nol-rev-amount"
              label="কাঙ্ক্ষিত জমির পরিমাণ"
              value={targetAmount}
              onChange={setTargetAmount}
            />

            {/* পপ-আপ একক সিলেক্টর */}
            <div className="relative flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 px-3 py-1.5">
              <span className="text-[11px] font-semibold text-slate-500">জমির একক</span>
              <button
                type="button"
                onClick={() => setUnitMenuOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-[#123e6d] mt-0.5 cursor-pointer"
              >
                <span className="truncate">{UNIT_LABELS[targetUnit]}</span>
                <ChevronUp
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    unitMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {unitMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUnitMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-14 z-40 w-52 rounded-[22px] bg-white border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
                    {UNIT_OPTIONS.map((u) => {
                      const active = targetUnit === u.value;
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => {
                            setTargetUnit(u.value);
                            setUnitMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            active
                              ? 'bg-[#123e6d] text-white'
                              : 'text-slate-800 hover:bg-[#f1f5f9]'
                          }`}
                        >
                          <span>{u.label}</span>
                          {active && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {renderSideInputGroup(
            'জানা এক দিকের মাপ (নল / হাত / বিঘাত / আঙুল)',
            'nol-rev-known',
            knownSide,
            setKnownSide
          )}

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearReverseNol}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> সীমানা বের করুন
            </button>
          </div>

          {revResult && (
            <div className="mt-4 rounded-[24px] bg-[#f8fafc] border border-slate-200/90 p-4 space-y-3">
              <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm">
                <p className="text-xs text-sky-200">অজানা দিকের মাপ লাগবে (নলে):</p>
                <p className="text-xl font-extrabold mt-0.5">
                  {toBnNum(revResult.ansNol)} নল {toBnNum(revResult.ansHat)} হাত{' '}
                  {toBnNum(revResult.ansBighat)} বিঘাত {toBnNum(revResult.ansAngul, 2)} আঙুল
                </p>
                <p className="text-xs font-semibold text-sky-100 mt-1.5">
                  ফুটে মাপ: {toBnNum(revResult.ansFt)} ফুট {toBnNum(revResult.ansIn, 2)} ইঞ্চি (
                  {toBnNum(revResult.requiredOppositeFt, 2)} ফুট)
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
