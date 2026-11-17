import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronUp,
  Copy,
  FileText,
  Grid2x2,
  Printer,
  RotateCcw,
  Ruler,
  Save,
  Share2,
} from 'lucide-react';
import { BnInput } from './BnInput';
import { parseBnNum, toBnNum } from '../utils/bengali';
import {
  AREA_UNITS,
  AreaUnitKey,
  LENGTH_UNITS,
  LengthUnitKey,
  convertAreaUnits,
  convertLengthUnits,
} from '../utils/calculators';
import { HistoryRecord } from '../utils/storage';
import { shareContentNative } from '../utils/nativeBridge';
import { PrintableReport } from './PrintSheet';

interface UnitConverterViewProps {
  onBack: () => void;
  onSaveHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

type ConverterTab = 'length' | 'area';

export const UnitConverterView: React.FC<UnitConverterViewProps> = ({
  onBack,
  onSaveHistory,
  onPrint,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<ConverterTab>('length');
  const [note, setNote] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);

  const [lengthInput, setLengthInput] = useState('');
  const [selectedLengthUnit, setSelectedLengthUnit] = useState<LengthUnitKey>('ft');

  const [areaInput, setAreaInput] = useState('');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<AreaUnitKey>('sqft');

  const [unitMenuOpen, setUnitMenuOpen] = useState(false);

  const currentAmountStr = activeTab === 'length' ? lengthInput : areaInput;
  const parsedAmount = parseBnNum(currentAmountStr);

  const items = useMemo(() => {
    if (activeTab === 'length') {
      return convertLengthUnits(parsedAmount, selectedLengthUnit);
    }
    return convertAreaUnits(parsedAmount, selectedAreaUnit);
  }, [activeTab, parsedAmount, selectedLengthUnit, selectedAreaUnit]);

  const activeUnitLabel =
    activeTab === 'length'
      ? LENGTH_UNITS.find((u) => u.key === selectedLengthUnit)?.label ?? 'ফুট'
      : AREA_UNITS.find((u) => u.key === selectedAreaUnit)?.label ?? 'বর্গফুট';

  const handleClear = () => {
    if (activeTab === 'length') setLengthInput('');
    else setAreaInput('');
  };

  const buildShareText = () => {
    const subTitle = activeTab === 'length' ? 'দৈর্ঘ্য একক রূপান্তর' : 'বর্গ একক রূপান্তর';
    return (
      `একক পরিবর্তন (${subTitle})\n` +
      (note.trim() ? `নোট: ${note.trim()}\n` : '') +
      `প্রদত্ত মান: ${toBnNum(parsedAmount)} ${activeUnitLabel}\n` +
      items.map((it) => `• ${it.label}: ${it.formatted}`).join('\n')
    );
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(buildShareText());
    onNotify('একক পরিবর্তনের ফলাফল কপি করা হয়েছে!');
  };

  const handleShareAll = async () => {
    await shareContentNative('একক পরিবর্তন', buildShareText(), onNotify);
  };

  const handlePrintAll = () => {
    onPrint({
      title: 'একক পরিবর্তন',
      subtitle: activeTab === 'length' ? 'দৈর্ঘ্য একক রূপান্তর' : 'বর্গ একক রূপান্তর',
      note: note.trim() || undefined,
      inputsText: `প্রদত্ত মান: ${toBnNum(parsedAmount)} ${activeUnitLabel}`,
      summaryPrimary: `${toBnNum(parsedAmount)} ${activeUnitLabel}`,
      summarySecondary:
        activeTab === 'length' ? 'দৈর্ঘ্যের সকল এককে মান' : 'ক্ষেত্রফলের সকল বর্গ এককে মান',
      details: items.map((it) => ({
        label: it.label,
        value: `${it.formatted} ${it.label}`,
      })),
    });
  };

  const handleSaveToHistory = () => {
    if (parsedAmount <= 0) {
      onNotify('সংরক্ষণ করতে দয়া করে একটি মান লিখুন।');
      return;
    }
    const secondary =
      activeTab === 'length'
        ? `${items[0].formatted} ফুট | ${items[2].formatted} মিটার | ${items[3].formatted} হাত`
        : `${items[0].formatted} বর্গফুট | ${items[1].formatted} শতক | ${items[5].formatted} কাঠা`;

    onSaveHistory({
      category: 'converter',
      categoryLabel: 'একক পরিবর্তন',
      subTypeLabel: activeTab === 'length' ? 'দৈর্ঘ্য একক' : 'বর্গ একক',
      note: note.trim(),
      summaryPrimary: `${toBnNum(parsedAmount)} ${activeUnitLabel}`,
      summarySecondary: secondary,
      inputsText: `ইনপুট: ${toBnNum(parsedAmount)} ${activeUnitLabel}`,
      details: items.map((it) => ({
        label: it.label,
        value: `${it.formatted} ${it.label}`,
      })),
    });
    onNotify('হিস্ট্রিতে সংরক্ষণ করা হয়েছে!');
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">একক পরিবর্তন</h2>
            <p className="text-[11px] text-slate-500">দৈর্ঘ্য একক ও বর্গ একক কনভার্টার</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNoteBox((prev) => !prev)}
          className={`h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            showNoteBox || note.trim()
              ? 'bg-[#d6e3ff] text-[#001b3d]'
              : 'bg-[#f1f5f9] text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {note.trim() ? 'নোট যুক্ত' : 'নোট'}
        </button>
      </div>

      {showNoteBox && (
        <div className="bg-white rounded-[20px] p-3 border border-slate-200/80 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="হিসাবের নাম বা নোট লিখুন..."
            className="w-full h-10 rounded-xl bg-[#f1f5f9] px-3.5 text-sm font-medium text-slate-800 border border-slate-200 focus:bg-white focus:border-[#123e6d] focus:outline-none"
          />
        </div>
      )}

      {/* ২টি সেগমেন্ট ট্যাব: দৈর্ঘ্য একক ও বর্গ একক */}
      <div className="bg-[#e2e8f0]/90 p-1 rounded-full grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('length');
            setUnitMenuOpen(false);
          }}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'length'
              ? 'bg-[#123e6d] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>দৈর্ঘ্য একক</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('area');
            setUnitMenuOpen(false);
          }}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'area'
              ? 'bg-[#123e6d] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Grid2x2 className="w-3.5 h-3.5" />
          <span>বর্গ একক</span>
        </button>
      </div>

      {/* ইনপুট ও একক নির্বাচন কার্ড */}
      <div className="bg-white rounded-[22px] p-3 border border-slate-200/80 shadow-2xs space-y-2.5">
        <p className="text-xs font-bold text-[#123e6d] text-center">
          {activeTab === 'length'
            ? 'দৈর্ঘ্যের পরিমাণ ও একক দিন'
            : 'জমি / ক্ষেত্রফলের পরিমাণ ও একক দিন'}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <BnInput
            id="converter-amount-input"
            label="পরিমাণ"
            value={currentAmountStr}
            onChange={(v) => {
              if (activeTab === 'length') setLengthInput(v);
              else setAreaInput(v);
            }}
          />

          <div className="relative bn-input-box flex flex-col justify-center rounded-2xl bg-[#f1f5f9] border border-slate-200/90 px-3 py-1.5">
            <span className="text-[11px] font-semibold text-slate-500 text-center">
              একক নির্বাচন
            </span>
            <button
              type="button"
              onClick={() => setUnitMenuOpen((prev) => !prev)}
              aria-label="একক পরিবর্তন করুন"
              className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-[#123e6d] mt-0.5 cursor-pointer py-0.5"
            >
              <span className="truncate">{activeUnitLabel}</span>
              <ChevronUp
                className={`w-4 h-4 shrink-0 transition-transform ${
                  unitMenuOpen ? '' : 'rotate-180'
                }`}
              />
            </button>

            {unitMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setUnitMenuOpen(false)}
                />
                <div className="absolute right-0 top-15 z-40 w-48 max-h-72 overflow-y-auto rounded-[22px] bg-white border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {activeTab === 'length'
                    ? LENGTH_UNITS.map((u) => {
                        const active = selectedLengthUnit === u.key;
                        return (
                          <button
                            key={u.key}
                            type="button"
                            onClick={() => {
                              setSelectedLengthUnit(u.key);
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
                      })
                    : AREA_UNITS.map((u) => {
                        const active = selectedAreaUnit === u.key;
                        return (
                          <button
                            key={u.key}
                            type="button"
                            onClick={() => {
                              setSelectedAreaUnit(u.key);
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

        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleClear}
            className="h-10.5 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> মুছুন
          </button>
          <button
            type="button"
            onClick={handleSaveToHistory}
            className="col-span-2 h-10.5 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> সংরক্ষণ করুন
          </button>
        </div>
      </div>

      {/* লাইভ রূপান্তর ফলাফল তালিকা */}
      <div
        data-testid="converter-results-list"
        className="bg-white rounded-[22px] p-3 border border-slate-200/80 shadow-2xs space-y-2"
      >
        <p className="text-xs font-bold text-[#123e6d] text-center pb-0.5">
          {activeTab === 'length'
            ? 'দৈর্ঘ্য একক রূপান্তর ফলাফল'
            : 'বর্গ একক রূপান্তর ফলাফল'}
        </p>

        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                const txt = `${item.formatted} ${item.label}`;
                navigator.clipboard.writeText(txt);
                onNotify(`কপি হয়েছে: ${txt}`);
              }}
              className={`w-full rounded-2xl px-3.5 py-2.5 border flex items-center justify-between gap-2 text-left transition-all active:scale-[0.99] cursor-pointer ${
                item.isSource
                  ? 'bg-[#eef4ff] border-[#123e6d]/60'
                  : 'bg-[#f8fafc] border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <span
                className={`text-base font-extrabold tabular-nums truncate ${
                  item.isSource ? 'text-[#123e6d]' : 'text-red-700'
                }`}
              >
                {item.formatted}
              </span>
              <span
                className={`text-sm font-bold shrink-0 ${
                  item.isSource ? 'text-[#123e6d]' : 'text-slate-800'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* কপি / শেয়ার / প্রিন্ট */}
        <div className="grid grid-cols-3 gap-1.5 pt-1.5">
          <button
            type="button"
            onClick={handleCopyAll}
            className="h-10 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> কপি
          </button>
          <button
            type="button"
            onClick={handleShareAll}
            className="h-10 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> শেয়ার
          </button>
          <button
            type="button"
            onClick={handlePrintAll}
            className="h-10 rounded-full bg-[#123e6d] hover:bg-[#0e3157] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট
          </button>
        </div>
      </div>
    </div>
  );
};
