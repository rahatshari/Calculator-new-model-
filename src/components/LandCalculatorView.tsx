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
  Share2,
  Square,
  Triangle,
} from 'lucide-react';
import { BnInput } from './BnInput';
import { parseBnNum, toBnNum } from '../utils/bengali';
import {
  calculateQuadLand,
  calculateHeronLand,
  calculateReverseLand,
  formatDimBn,
  LandResult,
  HeronResult,
  ReverseLandResult,
  LandUnitType,
} from '../utils/calculators';
import { HistoryRecord } from '../utils/storage';
import { shareContentNative } from '../utils/nativeBridge';
import { PrintableReport } from './PrintSheet';

interface LandCalculatorViewProps {
  onBack: () => void;
  onSaveHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

type LandTab = 'quad' | 'heron' | 'reverse';

const UNIT_LABELS: Record<LandUnitType, string> = {
  decimal: 'শতক / শতাংশ',
  katha: 'কাঠা (৩.৩০ শতক)',
  kura: 'কুড়া (২০ কাঠা / ৬৬ শতক)',
  standard_katha: 'প্রচলিত কাঠা (৭২০ বর্গফুট)',
  bigha: 'বিঘা',
  acre: 'একর',
  gonda: 'গণ্ডা',
  sqft: 'স্কয়ার ফুট (বর্গফুট)',
};

export const LandCalculatorView: React.FC<LandCalculatorViewProps> = ({
  onBack,
  onSaveHistory,
  onPrint,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<LandTab>('quad');
  const [note, setNote] = useState<string>('');
  const [showNoteBox, setShowNoteBox] = useState<boolean>(false);

  // চতুর্ভুজ ও গড় নিয়ম (শুরুতে সব ঘর খালি থাকবে)
  const [northFt, setNorthFt] = useState('');
  const [northIn, setNorthIn] = useState('');
  const [southFt, setSouthFt] = useState('');
  const [southIn, setSouthIn] = useState('');
  const [eastFt, setEastFt] = useState('');
  const [eastIn, setEastIn] = useState('');
  const [westFt, setWestFt] = useState('');
  const [westIn, setWestIn] = useState('');
  const [quadResult, setQuadResult] = useState<LandResult | null>(null);

  // বিষমবাহু ও ত্রিভুজ নিয়ম (শুরুতে সব ঘর খালি থাকবে)
  const [sideAFt, setSideAFt] = useState('');
  const [sideAIn, setSideAIn] = useState('');
  const [sideBFt, setSideBFt] = useState('');
  const [sideBIn, setSideBIn] = useState('');
  const [sideCFt, setSideCFt] = useState('');
  const [sideCIn, setSideCIn] = useState('');
  const [heronResult, setHeronResult] = useState<HeronResult | null>(null);
  const [heronError, setHeronError] = useState<string>('');

  // বিপরীত সীমানা নির্ণয় (শুরুতে সব ঘর খালি থাকবে)
  const [targetAmount, setTargetAmount] = useState('');
  const [targetUnit, setTargetUnit] = useState<LandUnitType>('decimal');
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const [knownFt, setKnownFt] = useState('');
  const [knownIn, setKnownIn] = useState('');
  const [reverseResult, setReverseResult] = useState<ReverseLandResult | null>(null);

  const buildLandDetailsList = (res: LandResult) => [
    { label: 'মোট ক্ষেত্রফল', value: `${toBnNum(res.sqFt, 2)} বর্গফুট` },
    { label: 'মোট শতক / শতাংশ', value: `${toBnNum(res.decimal, 3)} শতক` },
    { label: 'কুড়া / কাঠা / ধুর', value: res.mixedText },
    { label: 'কাঠা (৩.৩০ শতক)', value: `${toBnNum(res.katha, 2)} কাঠা` },
    { label: 'কাঠা (৭২০ বর্গফুট)', value: `${toBnNum(res.standardKatha, 2)} কাঠা` },
    { label: 'বিঘা', value: `${toBnNum(res.bigha, 3)} বিঘা` },
    { label: 'একর', value: `${toBnNum(res.acre, 3)} একর` },
    { label: 'গণ্ডা', value: `${toBnNum(res.gonda, 2)} গণ্ডা` },
    { label: 'বর্গ হাত', value: `${toBnNum(res.sqHat, 2)} বর্গ হাত` },
  ];

  const handleCalculateQuad = (e: React.FormEvent) => {
    e.preventDefault();
    const l1F = parseBnNum(northFt);
    const l1I = parseBnNum(northIn);
    const l2F = parseBnNum(southFt);
    const l2I = parseBnNum(southIn);
    const w1F = parseBnNum(eastFt);
    const w1I = parseBnNum(eastIn);
    const w2F = parseBnNum(westFt);
    const w2I = parseBnNum(westIn);

    const res = calculateQuadLand(l1F, l1I, l2F, l2I, w1F, w1I, w2F, w2I);
    if (!res.avgLengthFt || !res.avgWidthFt || res.sqFt <= 0) {
      onNotify('দয়া করে দৈর্ঘ্য এবং প্রস্থের মান দিন।');
      return;
    }

    setQuadResult(res);

    const inputsText = `দৈর্ঘ্য ১: ${formatDimBn(l1F, l1I)}, দৈর্ঘ্য ২: ${formatDimBn(l2F, l2I)}, প্রস্থ ১: ${formatDimBn(w1F, w1I)}, প্রস্থ ২: ${formatDimBn(w2F, w2I)} (গড়: ${toBnNum(res.avgLengthFt, 2)}' × ${toBnNum(res.avgWidthFt, 2)}')`;
    onSaveHistory({
      category: 'land',
      categoryLabel: 'জমির হিসাব',
      subTypeLabel: 'চতুর্ভুজ ও গড় পরিমাপ',
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.decimal, 3)} শতক`,
      summarySecondary: `${toBnNum(res.sqFt, 2)} বর্গফুট | ${res.mixedText}`,
      inputsText,
      details: buildLandDetailsList(res),
    });
  };

  const handleClearQuad = () => {
    setNorthFt('');
    setNorthIn('');
    setSouthFt('');
    setSouthIn('');
    setEastFt('');
    setEastIn('');
    setWestFt('');
    setWestIn('');
    setQuadResult(null);
  };

  const handleCalculateHeron = (e: React.FormEvent) => {
    e.preventDefault();
    const aF = parseBnNum(sideAFt);
    const aI = parseBnNum(sideAIn);
    const bF = parseBnNum(sideBFt);
    const bI = parseBnNum(sideBIn);
    const cF = parseBnNum(sideCFt);
    const cI = parseBnNum(sideCIn);

    if (aF + aI <= 0 || bF + bI <= 0 || cF + cI <= 0) {
      setHeronError('দয়া করে ৩টি বাহুর মান দিন।');
      setHeronResult(null);
      return;
    }

    const res = calculateHeronLand(aF, aI, bF, bI, cF, cI);
    if (!res.isValidTriangle) {
      setHeronError('পরিমাপগুলো দিয়ে ত্রিভুজ তৈরি সম্ভব নয়। যেকোনো দুই বাহুর যোগফল তৃতীয় বাহু অপেক্ষা বড় হতে হবে।');
      setHeronResult(null);
      return;
    }
    setHeronError('');
    setHeronResult(res);

    const inputsText = `১ম বাহু: ${formatDimBn(aF, aI)}, ২য় বাহু: ${formatDimBn(bF, bI)}, ৩য় বাহু: ${formatDimBn(cF, cI)}`;
    onSaveHistory({
      category: 'land',
      categoryLabel: 'জমির হিসাব',
      subTypeLabel: 'ত্রিভুজাকার জমি পরিমাপ',
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.decimal, 3)} শতক`,
      summarySecondary: `${toBnNum(res.sqFt, 2)} বর্গফুট | ${res.mixedText}`,
      inputsText,
      details: buildLandDetailsList(res),
    });
  };

  const handleClearHeron = () => {
    setSideAFt('');
    setSideAIn('');
    setSideBFt('');
    setSideBIn('');
    setSideCFt('');
    setSideCIn('');
    setHeronError('');
    setHeronResult(null);
  };

  const handleCalculateReverse = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseBnNum(targetAmount);
    const kF = parseBnNum(knownFt);
    const kI = parseBnNum(knownIn);

    if (amt <= 0 || (kF === 0 && kI === 0)) {
      onNotify('দয়া করে জমির পরিমাণ এবং জানা দিকের মান দিন।');
      return;
    }

    const res = calculateReverseLand(amt, targetUnit, kF, kI);
    setReverseResult(res);

    const inputsText = `টার্গেট জমি: ${toBnNum(amt)} ${UNIT_LABELS[targetUnit]}, জানা বাহু: ${formatDimBn(kF, kI)}`;
    const details = [
      {
        label: 'অজানা দিকের মাপ লাগবে',
        value: `${toBnNum(res.ansFt)} ফুট ${toBnNum(res.ansIn, 2)} ইঞ্চি`,
      },
      {
        label: 'দশমিক ফুটে মাপ',
        value: `${toBnNum(res.requiredOppositeFt, 2)} ফুট`,
      },
      ...buildLandDetailsList(res.landDetails),
    ];

    onSaveHistory({
      category: 'land',
      categoryLabel: 'জমির হিসাব',
      subTypeLabel: 'সীমানা নির্ণয়',
      note: note.trim(),
      summaryPrimary: `${toBnNum(res.ansFt)} ফুট ${toBnNum(res.ansIn, 2)} ইঞ্চি`,
      summarySecondary: `টার্গেট জমি: ${toBnNum(amt)} ${UNIT_LABELS[targetUnit]}`,
      inputsText,
      details,
    });
  };

  const handleClearReverse = () => {
    setTargetAmount('');
    setKnownFt('');
    setKnownIn('');
    setReverseResult(null);
  };

  const renderResultCard = (res: LandResult, subTitle: string, inputsText: string) => {
    const details = buildLandDetailsList(res);

    const handleCopy = () => {
      const text =
        `জমির হিসাব (${subTitle})\n${note ? `নোট: ${note}\n` : ''}${inputsText}\n` +
        details.map((d) => `• ${d.label}: ${d.value}`).join('\n');
      navigator.clipboard.writeText(text);
      onNotify('ফলাফল ক্লিপবোর্ডে কপি করা হয়েছে!');
    };

    const handleShare = async () => {
      const text =
        `জমির হিসাব (${subTitle})\n${note ? `নোট: ${note}\n` : ''}${inputsText}\n` +
        details.map((d) => `• ${d.label}: ${d.value}`).join('\n');
      await shareContentNative('জমির হিসাব ফলাফল', text, onNotify);
    };

    const handlePrintReport = () => {
      onPrint({
        title: 'জমির হিসাব',
        subtitle: subTitle,
        note: note.trim() || undefined,
        inputsText,
        summaryPrimary: `${toBnNum(res.decimal, 3)} শতক (${toBnNum(res.sqFt, 2)} বর্গফুট)`,
        summarySecondary: res.mixedText,
        details,
      });
    };

    return (
      <div className="mt-4 rounded-[24px] bg-[#f8fafc] border border-slate-200/90 p-4 space-y-3.5">
        {/* প্রাইমারি হাইলাইট বক্স (Material 3 Primary Container) */}
        <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
            <span>মোট ক্ষেত্রফল: {toBnNum(res.sqFt, 2)} বর্গফুট</span>
            <span>স্বয়ংক্রিয়ভাবে সংরক্ষিত</span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {toBnNum(res.decimal, 3)} <span className="text-lg font-semibold text-sky-100">শতক</span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-xl bg-white/15 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white">
            {res.mixedText}
          </div>
        </div>

        {/* অন্যান্য একক গ্রিড */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">কাঠা (৩.৩০ শতক)</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.katha, 2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">কাঠা (৭২০ বর্গফুট)</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.standardKatha, 2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">বিঘা</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.bigha, 3)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">একর</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.acre, 3)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">গণ্ডা</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.gonda, 2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3">
            <p className="text-[11px] font-semibold text-slate-500">বর্গ হাত</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{toBnNum(res.sqHat, 2)}</p>
          </div>
        </div>

        {/* অ্যাকশন বাটন বার */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> কপি
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> শেয়ার
          </button>
          <button
            type="button"
            onClick={handlePrintReport}
            className="h-10 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* মোবাইল স্ক্রিন সাব-বার */}
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">জমির হিসাব</h2>
            <p className="text-[11px] text-slate-500">চতুর্ভুজ, ত্রিভুজ ও সীমানা নির্ণয়</p>
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

      {/* নোট ইনপুট ড্রয়ার */}
      {showNoteBox && (
        <div className="bg-white rounded-[20px] p-3 border border-slate-200/80 shadow-2xs">
          <input
            id="land-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="হিসাবের নাম বা নোট লিখুন (যেমন: দাগ নং ১০৫)..."
            className="w-full h-10 rounded-xl bg-[#f1f5f9] px-3 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
          />
        </div>
      )}

      {/* Material 3 Segmented Button Bar (কোনো ক, খ, গ ছাড়া আধুনিক আইকন ট্যাব) */}
      <div className="grid grid-cols-3 bg-[#e2e8f0]/90 p-1 rounded-full border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('quad')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'quad'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'quad' ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Square className="w-3.5 h-3.5" />}
          <span>চতুর্ভুজ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('heron')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'heron'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'heron' ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Triangle className="w-3.5 h-3.5" />}
          <span>ত্রিভুজ</span>
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
          {activeTab === 'reverse' ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
          <span>সীমানা নির্ণয়</span>
        </button>
      </div>

      {/* ১. চতুর্ভুজ ফর্ম */}
      {activeTab === 'quad' && (
        <form onSubmit={handleCalculateQuad} className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="space-y-2.5">
            {/* দৈর্ঘ্য */}
            <div>
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">জমির দৈর্ঘ্য (উত্তর ও দক্ষিণ বাহু)</p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput id="quad-n-ft" label="১ম পাশ (ফুট)" value={northFt} onChange={setNorthFt} suffix="ফুট" />
                <BnInput id="quad-n-in" label="১ম পাশ (ইঞ্চি)" value={northIn} onChange={setNorthIn} suffix="ইঞ্চি" />
                <BnInput id="quad-s-ft" label="২য় পাশ (ফুট)" value={southFt} onChange={setSouthFt} suffix="ফুট" />
                <BnInput id="quad-s-in" label="২য় পাশ (ইঞ্চি)" value={southIn} onChange={setSouthIn} suffix="ইঞ্চি" />
              </div>
            </div>

            {/* প্রস্থ */}
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">জমির প্রস্থ (পূর্ব ও পশ্চিম বাহু)</p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput id="quad-e-ft" label="১ম পাশ (ফুট)" value={eastFt} onChange={setEastFt} suffix="ফুট" />
                <BnInput id="quad-e-in" label="১ম পাশ (ইঞ্চি)" value={eastIn} onChange={setEastIn} suffix="ইঞ্চি" />
                <BnInput id="quad-w-ft" label="২য় পাশ (ফুট)" value={westFt} onChange={setWestFt} suffix="ফুট" />
                <BnInput id="quad-w-in" label="২য় পাশ (ইঞ্চি)" value={westIn} onChange={setWestIn} suffix="ইঞ্চি" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearQuad}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> জমির হিসাব করুন
            </button>
          </div>

          {quadResult &&
            renderResultCard(
              quadResult,
              'চতুর্ভুজ ও গড় পরিমাপ',
              `দৈর্ঘ্য ১: ${formatDimBn(parseBnNum(northFt), parseBnNum(northIn))}, দৈর্ঘ্য ২: ${formatDimBn(parseBnNum(southFt), parseBnNum(southIn))}, প্রস্থ ১: ${formatDimBn(parseBnNum(eastFt), parseBnNum(eastIn))}, প্রস্থ ২: ${formatDimBn(parseBnNum(westFt), parseBnNum(westIn))}`
            )}
        </form>
      )}

      {/* ২. ত্রিভুজ ফর্ম */}
      {activeTab === 'heron' && (
        <form onSubmit={handleCalculateHeron} className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <p className="text-xs font-bold text-[#123e6d] px-1">ত্রিভুজাকার জমির ৩টি বাহুর মাপ দিন</p>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <BnInput id="heron-a-ft" label="১ম বাহু (ফুট)" value={sideAFt} onChange={setSideAFt} suffix="ফুট" />
              <BnInput id="heron-a-in" label="১ম বাহু (ইঞ্চি)" value={sideAIn} onChange={setSideAIn} suffix="ইঞ্চি" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <BnInput id="heron-b-ft" label="২য় বাহু (ফুট)" value={sideBFt} onChange={setSideBFt} suffix="ফুট" />
              <BnInput id="heron-b-in" label="২য় বাহু (ইঞ্চি)" value={sideBIn} onChange={setSideBIn} suffix="ইঞ্চি" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <BnInput id="heron-c-ft" label="৩য় বাহু (ফুট)" value={sideCFt} onChange={setSideCFt} suffix="ফুট" />
              <BnInput id="heron-c-in" label="৩য় বাহু (ইঞ্চি)" value={sideCIn} onChange={setSideCIn} suffix="ইঞ্চি" />
            </div>
          </div>

          {heronError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {heronError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearHeron}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> ত্রিভুজ জমির হিসাব করুন
            </button>
          </div>

          {heronResult &&
            renderResultCard(
              heronResult,
              'ত্রিভুজাকার জমি পরিমাপ',
              `১ম বাহু: ${formatDimBn(parseBnNum(sideAFt), parseBnNum(sideAIn))}, ২য় বাহু: ${formatDimBn(parseBnNum(sideBFt), parseBnNum(sideBIn))}, ৩য় বাহু: ${formatDimBn(parseBnNum(sideCFt), parseBnNum(sideCIn))}`
            )}
        </form>
      )}

      {/* ৩. সীমানা নির্ণয় ফর্ম */}
      {activeTab === 'reverse' && (
        <form onSubmit={handleCalculateReverse} className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-[#123e6d] px-1">কাঙ্ক্ষিত জমির পরিমাণ ও একক</p>
            <div className="grid grid-cols-2 gap-2">
              <BnInput
                id="rev-land-amount"
                label="জমির পরিমাণ"
                value={targetAmount}
                onChange={setTargetAmount}
              />
              <div className="relative flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 px-3 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  জমির একক
                </span>
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
                    <div className="absolute right-0 top-14 z-40 w-56 rounded-[22px] bg-white border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
                      {(Object.keys(UNIT_LABELS) as LandUnitType[]).map((uKey) => {
                        const active = targetUnit === uKey;
                        return (
                          <button
                            key={uKey}
                            type="button"
                            onClick={() => {
                              setTargetUnit(uKey);
                              setUnitMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                              active
                                ? 'bg-[#123e6d] text-white'
                                : 'text-slate-800 hover:bg-[#f1f5f9]'
                            }`}
                          >
                            <span>{UNIT_LABELS[uKey]}</span>
                            {active && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs font-bold text-[#123e6d] px-1 pt-1">জানা এক দিকের বাহুর মাপ</p>
            <div className="grid grid-cols-2 gap-2">
              <BnInput id="rev-known-ft" label="ফুট" value={knownFt} onChange={setKnownFt} suffix="ফুট" />
              <BnInput id="rev-known-in" label="ইঞ্চি" value={knownIn} onChange={setKnownIn} suffix="ইঞ্চি" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClearReverse}
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

          {reverseResult && (
            <div className="mt-4 space-y-3">
              <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm">
                <p className="text-xs text-sky-200">অজানা দিকের মাপ লাগবে:</p>
                <p className="text-2xl font-extrabold mt-0.5">
                  {toBnNum(reverseResult.ansFt)} ফুট {toBnNum(reverseResult.ansIn, 2)} ইঞ্চি
                </p>
                <p className="text-xs text-sky-100 mt-1">
                  দশমিক ফুটে: {toBnNum(reverseResult.requiredOppositeFt, 2)} ফুট | জানা বাহু:{' '}
                  {toBnNum(reverseResult.knownSideFt, 2)} ফুট
                </p>
              </div>

              {renderResultCard(
                reverseResult.landDetails,
                'সীমানা নির্ণয়',
                `টার্গেট জমি: ${targetAmount} ${UNIT_LABELS[targetUnit]}, জানা বাহু: ${formatDimBn(parseBnNum(knownFt), parseBnNum(knownIn))}`
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};
