import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  FileText,
  Printer,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { HistoryRecord, CalculatorCategory } from '../utils/storage';
import { toBnNum } from '../utils/bengali';
import { PrintableReport } from './PrintSheet';

interface HistoryViewProps {
  records: HistoryRecord[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onUpdateNote: (id: string, note: string) => void;
  onPrint: (report: PrintableReport) => void;
  onNotify: (msg: string) => void;
}

const FILTER_TABS: { id: 'all' | CalculatorCategory; label: string }[] = [
  { id: 'all', label: 'সব' },
  { id: 'land', label: 'জমি' },
  { id: 'nol', label: 'নল' },
  { id: 'soil', label: 'মাটি' },
  { id: 'timber', label: 'কাঠ' },
];

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onBack,
  onDelete,
  onClearAll,
  onUpdateNote,
  onPrint,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CalculatorCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredRecords = records.filter((rec) => {
    const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;
    return (
      matchesCategory &&
      (rec.note.toLowerCase().includes(q) ||
        rec.categoryLabel.toLowerCase().includes(q) ||
        rec.subTypeLabel.toLowerCase().includes(q) ||
        rec.summaryPrimary.toLowerCase().includes(q) ||
        rec.inputsText.toLowerCase().includes(q))
    );
  });

  const handleStartEditNote = (rec: HistoryRecord) => {
    setEditingId(rec.id);
    setEditingNoteText(rec.note);
  };

  const handleSaveNote = (id: string) => {
    onUpdateNote(id, editingNoteText.trim());
    setEditingId(null);
    onNotify('হিসাবের নোট সংরক্ষণ করা হয়েছে!');
  };

  const formatRecordText = (rec: HistoryRecord) => {
    return (
      `${rec.categoryLabel} (${rec.subTypeLabel})\n` +
      `সময়: ${rec.timestamp}\n` +
      (rec.note ? `নোট: ${rec.note}\n` : '') +
      `ফলাফল: ${rec.summaryPrimary} (${rec.summarySecondary})\n` +
      `বিবরণ: ${rec.inputsText}\n` +
      rec.details.map((d) => `• ${d.label}: ${d.value}`).join('\n')
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">সংরক্ষিত হিস্ট্রি</h2>
            <p className="text-[11px] text-slate-500">মোট সংরক্ষিত হিসাব: {toBnNum(records.length)}টি</p>
          </div>
        </div>

        {records.length > 0 && (
          <div>
            {confirmClearAll ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClearAll(false);
                    onNotify('সকল হিস্ট্রি মুছে ফেলা হয়েছে।');
                  }}
                  className="h-8 px-2.5 rounded-full bg-red-600 text-white text-xs font-bold cursor-pointer"
                >
                  নিশ্চিত মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="h-9 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> সব মুছুন
              </button>
            )}
          </div>
        )}
      </div>

      {/* সার্চ ও ফিল্টার বার */}
      <div className="bg-white rounded-[22px] p-3 border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নোট বা হিসাবের নাম লিখে খুঁজুন..."
            className="w-full h-10 pl-9 pr-3 rounded-full bg-[#f1f5f9] text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
          />
        </div>

        <div className="grid grid-cols-5 gap-1 bg-[#f1f5f9] p-1 rounded-full">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[#123e6d] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* হিস্ট্রি কার্ড তালিকা */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 text-center border border-slate-200/80">
          <p className="text-sm font-bold text-slate-700">কোনো সংরক্ষিত হিসাব পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500 mt-1">
            যেকোনো ক্যালকুলেটরে হিসাব করলেই তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-[22px] p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#d6e3ff] text-[#001b3d]">
                      {rec.categoryLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{rec.subTypeLabel}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{rec.timestamp}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(rec.id)}
                  aria-label="মুছে ফেলুন"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* প্রধান ফলাফল */}
              <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/70 p-3">
                <p className="text-lg font-extrabold text-[#123e6d]">{rec.summaryPrimary}</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{rec.summarySecondary}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{rec.inputsText}</p>
              </div>

              {/* নোট যুক্ত বা এডিট সেকশন */}
              {editingId === rec.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    placeholder="হিসাবের নোট বা নাম লিখুন..."
                    className="flex-1 h-9 rounded-full bg-[#f1f5f9] px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123e6d]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNote(rec.id)}
                    className="h-9 px-3 rounded-full bg-[#123e6d] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> সেভ
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#f1f5f9]/70 rounded-xl px-3 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-[#123e6d] shrink-0" />
                    <span className="font-medium">
                      {rec.note ? rec.note : 'কোনো নোট যুক্ত করা হয়নি'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartEditNote(rec)}
                    className="text-xs font-bold text-[#123e6d] flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3 h-3" /> নোট
                  </button>
                </div>
              )}

              {/* অ্যাকশন বাটন */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(formatRecordText(rec));
                    onNotify('হিসাবটি কপি করা হয়েছে!');
                  }}
                  className="h-9 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> কপি
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const text = formatRecordText(rec);
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: rec.categoryLabel, text });
                        return;
                      } catch {
                        // ignore
                      }
                    }
                    navigator.clipboard.writeText(text);
                    onNotify('শেয়ারের জন্য কপি করা হয়েছে!');
                  }}
                  className="h-9 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> শেয়ার
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPrint({
                      title: rec.categoryLabel,
                      subtitle: rec.subTypeLabel,
                      note: rec.note || undefined,
                      dateTime: rec.timestamp,
                      inputsText: rec.inputsText,
                      summaryPrimary: rec.summaryPrimary,
                      summarySecondary: rec.summarySecondary,
                      details: rec.details,
                    })
                  }
                  className="h-9 rounded-full bg-[#123e6d] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
