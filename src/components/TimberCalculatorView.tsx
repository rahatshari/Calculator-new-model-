import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Box,
  Check,
  CircleDot,
  Copy,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BnInput } from './BnInput';
import { parseBnNum, toBnNum, formatBnCurrency } from '../utils/bengali';
import {
  calculateRoundLogItem,
  calculateSawnTimberItem,
  summarizeTimberCart,
  TimberItem,
  TimberType,
} from '../utils/calculators';
import {
  HistoryRecord,
  loadTimberCart,
  saveTimberCart,
  clearTimberCart,
} from '../utils/storage';
import { shareContentNative } from '../utils/nativeBridge';
import { PrintableReport } from './PrintSheet';

interface TimberCalculatorViewProps {
  onBack: () => void;
  onSaveHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

export const TimberCalculatorView: React.FC<TimberCalculatorViewProps> = ({
  onBack,
  onSaveHistory,
  onPrint,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<TimberType>('round');
  const [note, setNote] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [items, setItems] = useState<TimberItem[]>(() => loadTimberCart());

  // প্রতি সিএফটি (CFT) কাঠের দাম (শুরুতে খালি থাকবে)
  const [ratePerCftInput, setRatePerCftInput] = useState('');

  // গোল কাঠের ইনপুট (শুরুতে সব মাপ খালি থাকবে)
  const [girthFt, setGirthFt] = useState('');
  const [girthIn, setGirthIn] = useState('');
  const [roundLenFt, setRoundLenFt] = useState('');
  const [roundLenIn, setRoundLenIn] = useState('');
  const [roundQty, setRoundQty] = useState('');

  // সাইজ বা চেরাই কাঠের ইনপুট (শুরুতে সব মাপ খালি থাকবে)
  const [widthIn, setWidthIn] = useState('');
  const [thickIn, setThickIn] = useState('');
  const [sawnLenFt, setSawnLenFt] = useState('');
  const [sawnLenIn, setSawnLenIn] = useState('');
  const [sawnQty, setSawnQty] = useState('');

  useEffect(() => {
    saveTimberCart(items);
  }, [items]);

  const currentRate = parseBnNum(ratePerCftInput);
  const summary = summarizeTimberCart(items);
  const totalEffectivePrice =
    summary.totalPrice > 0 ? summary.totalPrice : summary.totalCft * currentRate;

  // সর্বশেষ যে গাছ বা কাঠের মাপ দেওয়া হয়েছে সেটি
  const lastAddedItem = items.length > 0 ? items[items.length - 1] : null;
  const lastAddedItemPrice = lastAddedItem
    ? lastAddedItem.totalPrice ?? lastAddedItem.totalCft * (lastAddedItem.ratePerCft || currentRate)
    : 0;

  const saveCartToHistory = (updatedItems: TimberItem[], lastAddedLabel: string) => {
    if (updatedItems.length === 0) return;
    const sum = summarizeTimberCart(updatedItems);
    const effPrice = sum.totalPrice > 0 ? sum.totalPrice : sum.totalCft * currentRate;

    const details = updatedItems.map((item, idx) => {
      const itemPrice = item.totalPrice ?? item.totalCft * (item.ratePerCft || currentRate);
      return {
        label: `${toBnNum(idx + 1)}. ${item.type === 'round' ? 'গোল কাঠ' : 'সাইজ কাঠ'} (${item.description}) × ${toBnNum(item.quantity)}টি`,
        value: `${toBnNum(item.totalCft, 2)} সিএফটি${itemPrice > 0 ? ` (${formatBnCurrency(itemPrice)})` : ''}`,
      };
    });
    details.push({
      label: 'সর্বমোট কাঠের পরিমাপ',
      value: `${toBnNum(sum.totalCft, 2)} সিএফটি (মোট ${toBnNum(sum.totalPieces)} পিস)`,
    });
    if (effPrice > 0) {
      details.push({
        label: 'সর্বমোট কাঠের মূল্য',
        value: formatBnCurrency(effPrice),
      });
    }

    onSaveHistory({
      category: 'timber',
      categoryLabel: 'গাছ ও কাঠের হিসাব',
      subTypeLabel: lastAddedLabel,
      note: note.trim(),
      summaryPrimary: `${toBnNum(sum.totalCft, 2)} সিএফটি`,
      summarySecondary:
        effPrice > 0
          ? `মোট মূল্য: ${formatBnCurrency(effPrice)} (${toBnNum(sum.totalPieces)} পিস)`
          : `মোট ${toBnNum(updatedItems.length)}টি এন্ট্রি (${toBnNum(sum.totalPieces)} পিস কাঠ)`,
      inputsText: updatedItems
        .map(
          (i, idx) =>
            `${toBnNum(idx + 1)}) ${i.description} × ${toBnNum(i.quantity)}টি = ${toBnNum(i.totalCft, 2)} সিএফটি`
        )
        .join(' | '),
      details,
    });
  };

  const handleAddRoundLog = (e: React.FormEvent) => {
    e.preventDefault();
    const gF = parseBnNum(girthFt);
    const gI = parseBnNum(girthIn);
    const lF = parseBnNum(roundLenFt);
    const lI = parseBnNum(roundLenIn);
    const qty = Math.max(1, Math.round(parseBnNum(roundQty) || 1));
    const rate = parseBnNum(ratePerCftInput);

    if ((gF === 0 && gI === 0) || (lF === 0 && lI === 0)) {
      onNotify('দয়া করে গোল কাঠের বেড় এবং লম্বার মাপ দিন।');
      return;
    }

    const item = calculateRoundLogItem(gF, gI, lF, lI, qty, `timber-${Date.now()}`, rate);
    const updated = [...items, item];
    setItems(updated);
    saveCartToHistory(updated, 'গোল কাঠের তালিকা');
    onNotify(`গোল কাঠ (${toBnNum(item.totalCft, 2)} সিএফটি) তালিকায় যোগ হয়েছে!`);
  };

  const handleAddSawnTimber = (e: React.FormEvent) => {
    e.preventDefault();
    const wI = parseBnNum(widthIn);
    const tI = parseBnNum(thickIn);
    const lF = parseBnNum(sawnLenFt);
    const lI = parseBnNum(sawnLenIn);
    const qty = Math.max(1, Math.round(parseBnNum(sawnQty) || 1));
    const rate = parseBnNum(ratePerCftInput);

    if (wI <= 0 || tI <= 0 || (lF === 0 && lI === 0)) {
      onNotify('দয়া করে সাইজ কাঠের চওড়া, পুরুত্ব এবং লম্বার মাপ দিন।');
      return;
    }

    const item = calculateSawnTimberItem(wI, tI, lF, lI, qty, `timber-${Date.now()}`, rate);
    const updated = [...items, item];
    setItems(updated);
    saveCartToHistory(updated, 'সাইজ কাঠের তালিকা');
    onNotify(`সাইজ কাঠ (${toBnNum(item.totalCft, 2)} সিএফটি) তালিকায় যোগ হয়েছে!`);
  };

  const handleRateChange = (newRateStr: string) => {
    setRatePerCftInput(newRateStr);
    const rate = parseBnNum(newRateStr);
    if (items.length > 0) {
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          ratePerCft: rate,
          totalPrice: it.totalCft * rate,
        }))
      );
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearList = () => {
    setItems([]);
    clearTimberCart();
    onNotify('কাঠের সম্পূর্ণ তালিকা মুছে ফেলা হয়েছে।');
  };

  const formatTimberListText = () => {
    const lines = items.map((item, idx) => {
      const itemPrice = item.totalPrice ?? item.totalCft * currentRate;
      return `${toBnNum(idx + 1)}. ${item.type === 'round' ? 'গোল' : 'সাইজ'} | ${item.description} | ${toBnNum(item.quantity)}টি = ${toBnNum(item.totalCft, 2)} সিএফটি${itemPrice > 0 ? ` (${formatBnCurrency(itemPrice)})` : ''}`;
    });
    return (
      `🪵 গাছ ও কাঠের হিসাব তালিকা\n` +
      (note.trim() ? `নোট: ${note.trim()}\n` : '') +
      `----------------------------\n` +
      lines.join('\n') +
      `\n----------------------------\n` +
      `সর্বমোট কাঠ: ${toBnNum(summary.totalPieces)} পিস\n` +
      `সর্বমোট কাঠের পরিমাপ (CFT): ${toBnNum(summary.totalCft, 2)} ঘনফুট\n` +
      (currentRate > 0 ? `প্রতি সিএফটি দর: ${toBnNum(currentRate, 2)} টাকা\n` : '') +
      `সর্বমোট মূল্য: ${formatBnCurrency(totalEffectivePrice)}`
    );
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">গাছ ও কাঠের হিসাব</h2>
            <p className="text-[11px] text-slate-500">গোল কাঠ ও চেরাই কাঠের সিএফটি ও দাম</p>
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
            id="timber-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ক্রেতার নাম বা কাঠের নোট লিখুন (যেমন: সেগুন কাঠ লট ১)..."
            className="w-full h-10 rounded-xl bg-[#f1f5f9] px-3 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
          />
        </div>
      )}

      {/* Material 3 Segmented Button Bar */}
      <div className="grid grid-cols-2 bg-[#e2e8f0]/90 p-1 rounded-full border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('round')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'round'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'round' ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <CircleDot className="w-3.5 h-3.5" />
          )}
          <span>গোল কাঠ (গাছ)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sawn')}
          className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'sawn'
              ? 'bg-[#123e6d] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {activeTab === 'sawn' ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Box className="w-3.5 h-3.5" />
          )}
          <span>সাইজ কাঠ (চেরাই)</span>
        </button>
      </div>

      {/* ১. গোল কাঠের ইনপুট ফর্ম */}
      {activeTab === 'round' && (
        <form
          onSubmit={handleAddRoundLog}
          className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="space-y-2.5">
            <div>
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">
                গাছের গোল বেড় (মাঝখানের মোটা অংশ)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput
                  id="round-girth-ft"
                  label="বেড় (ফুট)"
                  value={girthFt}
                  onChange={setGirthFt}
                  suffix="ফুট"
                />
                <BnInput
                  id="round-girth-in"
                  label="বেড় (ইঞ্চি)"
                  value={girthIn}
                  onChange={setGirthIn}
                  suffix="ইঞ্চি"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">
                গাছের লম্বা (দৈর্ঘ্য), সংখ্যা ও প্রতি সিএফটি দাম
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput
                  id="round-len-ft"
                  label="লম্বা (ফুট)"
                  value={roundLenFt}
                  onChange={setRoundLenFt}
                  suffix="ফুট"
                />
                <BnInput
                  id="round-len-in"
                  label="লম্বা (ইঞ্চি)"
                  value={roundLenIn}
                  onChange={setRoundLenIn}
                  suffix="ইঞ্চি"
                />
                <BnInput
                  id="round-qty"
                  label="গাছের সংখ্যা (পিস)"
                  value={roundQty}
                  onChange={setRoundQty}
                  suffix="টি"
                />
                <BnInput
                  id="round-rate-cft"
                  label="প্রতি সিএফটি দাম"
                  value={ratePerCftInput}
                  onChange={handleRateChange}
                  suffix="টাকা"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setGirthFt('');
                setGirthIn('');
                setRoundLenFt('');
                setRoundLenIn('');
                setRoundQty('');
              }}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> তালিকায় যোগ করুন
            </button>
          </div>
        </form>
      )}

      {/* ২. সাইজ কাঠের ইনপুট ফর্ম */}
      {activeTab === 'sawn' && (
        <form
          onSubmit={handleAddSawnTimber}
          className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="space-y-2.5">
            <div>
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">
                সাইজ কাঠের চওড়া ও পুরুত্ব (ইঞ্চি)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput
                  id="sawn-width-in"
                  label="চওড়া (ইঞ্চি)"
                  value={widthIn}
                  onChange={setWidthIn}
                  suffix="ইঞ্চি"
                />
                <BnInput
                  id="sawn-thick-in"
                  label="পুরুত্ব (ইঞ্চি)"
                  value={thickIn}
                  onChange={setThickIn}
                  suffix="ইঞ্চি"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-[#123e6d] mb-1.5 px-1">
                কাঠের লম্বা, সংখ্যা ও প্রতি সিএফটি দাম
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BnInput
                  id="sawn-len-ft"
                  label="লম্বা (ফুট)"
                  value={sawnLenFt}
                  onChange={setSawnLenFt}
                  suffix="ফুট"
                />
                <BnInput
                  id="sawn-len-in"
                  label="লম্বা (ইঞ্চি)"
                  value={sawnLenIn}
                  onChange={setSawnLenIn}
                  suffix="ইঞ্চি"
                />
                <BnInput
                  id="sawn-qty"
                  label="কাঠের সংখ্যা (পিস)"
                  value={sawnQty}
                  onChange={setSawnQty}
                  suffix="টি"
                />
                <BnInput
                  id="sawn-rate-cft"
                  label="প্রতি সিএফটি দাম"
                  value={ratePerCftInput}
                  onChange={handleRateChange}
                  suffix="টাকা"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setWidthIn('');
                setThickIn('');
                setSawnLenFt('');
                setSawnLenIn('');
                setSawnQty('');
              }}
              className="h-12 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> মুছুন
            </button>
            <button
              type="submit"
              className="col-span-2 h-12 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.98] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> তালিকায় যোগ করুন
            </button>
          </div>
        </form>
      )}

      {/* ফলাফল ও তালিকা সেকশন:
          ১. উপরে: সর্বশেষ যে গাছের মাপ দেওয়া হয়েছে সেটির হিসাব (Last Added Item)
          ২. মাঝে: প্রত্যেকটি কাঠের হিসাব ক্রমানুসারে নিচে উঠবে
          ৩. একদম নিচে: সর্বমোট কাঠের পরিমাপ (CFT) ও মোট মূল্য */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
        {/* ১. উপরে: সর্বশেষ যুক্ত করা গাছ/কাঠের মাপ ও হিসাব */}
        {lastAddedItem ? (
          <div className="rounded-[20px] bg-[#eef4ff] border border-[#bfd6ff] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#123e6d] bg-white px-2.5 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-3 h-3" />
                সর্বশেষ যুক্ত মাপ (নং #{toBnNum(items.length)})
              </span>
              <span className="text-xs font-bold text-[#123e6d]">
                {lastAddedItem.type === 'round' ? 'গোল কাঠ (গাছ)' : 'সাইজ কাঠ (চেরাই)'} •{' '}
                {toBnNum(lastAddedItem.quantity)} পিস
              </span>
            </div>

            <div className="flex items-end justify-between pt-0.5">
              <div>
                <p className="text-xs font-semibold text-slate-600">প্রদত্ত মাপ:</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {lastAddedItem.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-[#123e6d] leading-none">
                  {toBnNum(lastAddedItem.totalCft, 2)}{' '}
                  <span className="text-xs font-bold">সিএফটি</span>
                </p>
                {lastAddedItemPrice > 0 && (
                  <p className="text-xs font-extrabold text-emerald-700 mt-1">
                    মূল্য: {formatBnCurrency(lastAddedItemPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] bg-[#f8fafc] border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs font-bold text-slate-600">
              সর্বশেষ দেওয়া গাছ বা কাঠের মাপ এখানে দেখাবে
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              উপরে মাপ ও সিএফটি দাম দিয়ে &ldquo;তালিকায় যোগ করুন&rdquo; বাটনে চাপুন।
            </p>
          </div>
        )}

        {/* ২. মাঝে: প্রত্যেকটি কাঠের হিসাব ক্রমানুসারে নিচে উঠবে */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-extrabold text-slate-700">
                প্রত্যেকটি কাঠের হিসাব তালিকা ({toBnNum(items.length)}টি মাপ)
              </p>
              <span className="text-[11px] font-semibold text-slate-500">
                ক্রমানুসারে নিচে যুক্ত হচ্ছে
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[11px] font-bold text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 pl-2.5 pr-1">নং</th>
                    <th className="py-2.5 px-1">বিবরণ ও মাপ</th>
                    <th className="py-2.5 px-1 text-center">পিস</th>
                    <th className="py-2.5 px-1.5 text-right">সিএফটি</th>
                    <th className="py-2.5 px-1.5 text-right">দাম (৳)</th>
                    <th className="py-2.5 pl-0.5 pr-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, idx) => {
                    const itemPrice = item.totalPrice ?? item.totalCft * currentRate;
                    const isLast = idx === items.length - 1;
                    return (
                      <tr
                        key={item.id}
                        className={isLast ? 'bg-[#eef4ff]/60' : 'hover:bg-slate-50/80'}
                      >
                        <td className="py-2.5 pl-2.5 pr-1 font-bold text-slate-500">
                          {toBnNum(idx + 1)}
                        </td>
                        <td className="py-2.5 px-1">
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#d6e3ff] text-[#001b3d] mr-1">
                            {item.type === 'round' ? 'গোল' : 'সাইজ'}
                          </span>
                          <span className="font-semibold text-slate-800">{item.description}</span>
                        </td>
                        <td className="py-2.5 px-1 text-center font-bold text-slate-700">
                          {toBnNum(item.quantity)}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-extrabold text-[#123e6d]">
                          {toBnNum(item.totalCft, 2)}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-bold text-emerald-700">
                          {toBnNum(itemPrice, 0)}
                        </td>
                        <td className="py-2.5 pl-0.5 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="মুছে ফেলুন"
                            className="w-7 h-7 rounded-full hover:bg-red-50 text-red-500 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ৩. একদম নিচে: সর্বমোট কাঠের পরিমাপ (CFT) ও সর্বমোট মূল্য */}
        <div className="rounded-[20px] bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-sky-200">সর্বমোট কাঠের পরিমাপ (CFT)</p>
              <p className="text-3xl font-extrabold tracking-tight mt-0.5">
                {toBnNum(summary.totalCft, 2)}{' '}
                <span className="text-base font-semibold text-sky-100">সিএফটি</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                মোট {toBnNum(summary.totalPieces)} পিস
              </span>
              <p className="text-[11px] text-sky-200 mt-1">{toBnNum(items.length)}টি মাপ যুক্ত</p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between">
            <span className="text-xs text-sky-100">
              সর্বমোট কাঠের মূল্য {currentRate > 0 ? `(দর: ${toBnNum(currentRate)} ৳/সিএফটি)` : ''}:
            </span>
            <span className="text-lg font-extrabold text-amber-300">
              {formatBnCurrency(totalEffectivePrice)}
            </span>
          </div>
        </div>

        {/* ৪টি অ্যাকশন বাটন: কপি, শেয়ার, প্রিন্ট, তালিকা মুছুন */}
        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(formatTimberListText());
                onNotify('কাঠের তালিকা কপি করা হয়েছে!');
              }}
              className="h-10 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> কপি
            </button>
            <button
              type="button"
              onClick={async () => {
                const text = formatTimberListText();
                await shareContentNative('গাছ ও কাঠের হিসাব', text, onNotify);
              }}
              className="h-10 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> শেয়ার
            </button>
            <button
              type="button"
              onClick={() =>
                onPrint({
                  title: 'গাছ ও কাঠের হিসাব তালিকা',
                  subtitle: `মোট ${toBnNum(items.length)}টি মাপ (${toBnNum(summary.totalPieces)} পিস কাঠ)`,
                  note: note.trim() || undefined,
                  inputsText: `গোল কাঠ: ${toBnNum(summary.roundCft, 2)} সিএফটি | সাইজ কাঠ: ${toBnNum(summary.sawnCft, 2)} সিএফটি | দর: ${toBnNum(currentRate)} টাকা/সিএফটি`,
                  summaryPrimary: `সর্বমোট: ${toBnNum(summary.totalCft, 2)} সিএফটি (CFT)`,
                  summarySecondary: `সর্বমোট মূল্য: ${formatBnCurrency(totalEffectivePrice)}`,
                  details: items.map((item, idx) => {
                    const itemPrice = item.totalPrice ?? item.totalCft * currentRate;
                    return {
                      label: `${toBnNum(idx + 1)}. ${item.type === 'round' ? 'গোল কাঠ' : 'সাইজ কাঠ'} (${item.description}) × ${toBnNum(item.quantity)}টি`,
                      value: `${toBnNum(item.totalCft, 2)} সিএফটি (${formatBnCurrency(itemPrice)})`,
                    };
                  }),
                })
              }
              className="h-10 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট
            </button>
            <button
              type="button"
              onClick={handleClearList}
              className="h-10 rounded-full bg-red-50 hover:bg-red-100 active:scale-95 text-xs font-bold text-red-600 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> মুছুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
