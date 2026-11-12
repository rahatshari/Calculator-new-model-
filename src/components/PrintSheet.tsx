import React from 'react';
import { Printer, Share2, X } from 'lucide-react';
import { getBnDateTime, toBnNum } from '../utils/bengali';
import { shareContentNative, triggerPrintNative } from '../utils/nativeBridge';

export interface PrintableReport {
  title: string;
  subtitle: string;
  dateTime?: string;
  note?: string;
  inputsText?: string;
  summaryPrimary?: string;
  summarySecondary?: string;
  details: Array<{ label: string; value: string }>;
  tableHeaders?: string[];
  tableRows?: Array<string[]>;
  footerSummary?: Array<{ label: string; value: string }>;
}

interface PrintSheetProps {
  report: PrintableReport | null;
  onClose?: () => void;
  onNotify?: (msg: string) => void;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  report,
  onClose,
  onNotify,
}) => {
  if (!report) return null;

  const formattedDate = report.dateTime || getBnDateTime();

  const buildShareText = () => {
    const lines = [
      `📋 ${report.title} (${report.subtitle})`,
      `তারিখ: ${formattedDate}`,
      report.note ? `নোট: ${report.note}` : '',
      report.inputsText ? `মাপসমূহ: ${report.inputsText}` : '',
      report.summaryPrimary ? `প্রধান ফলাফল: ${report.summaryPrimary}` : '',
      report.summarySecondary ? `${report.summarySecondary}` : '',
      '------------------------',
      ...report.details.map((d, i) => `${toBnNum(i + 1)}. ${d.label}: ${d.value}`),
    ].filter(Boolean);
    return lines.join('\n');
  };

  const renderReportContent = () => (
    <div className="bg-white text-black p-5 rounded-2xl border border-slate-300 space-y-4">
      {/* প্রিন্ট হেডার */}
      <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="লোগো"
            className="w-10 h-10 rounded-xl object-cover border border-slate-300"
          />
          <div>
            <h1 className="text-xl font-extrabold text-black leading-tight">
              হিসাব ক্যালকুলেটর
            </h1>
            <p className="text-xs font-bold text-slate-800">
              {report.title} — {report.subtitle}
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-black">
          <p className="font-bold">তারিখ ও সময়:</p>
          <p>{formattedDate}</p>
        </div>
      </div>

      {/* নোট ও ইনপুট বিবরণ */}
      {(report.note || report.inputsText) && (
        <div className="border border-black rounded-xl p-3 bg-slate-50/60 space-y-1">
          {report.note && (
            <p className="text-sm font-bold text-black">
              📝 নাম / নোট: {report.note}
            </p>
          )}
          {report.inputsText && (
            <p className="text-xs text-black leading-relaxed">
              <span className="font-bold">প্রদত্ত মাপসমূহ:</span> {report.inputsText}
            </p>
          )}
        </div>
      )}

      {/* প্রধান ফলাফল সারাংশ */}
      {(report.summaryPrimary || report.summarySecondary) && (
        <div className="border-2 border-black rounded-xl p-3.5 flex items-center justify-between gap-2 bg-white">
          {report.summaryPrimary && (
            <div>
              <p className="text-[11px] font-bold text-slate-700">প্রধান ফলাফল</p>
              <p className="text-lg font-extrabold text-black">{report.summaryPrimary}</p>
            </div>
          )}
          {report.summarySecondary && (
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-700">আনুষঙ্গিক ফলাফল / মূল্য</p>
              <p className="text-sm font-bold text-black">{report.summarySecondary}</p>
            </div>
          )}
        </div>
      )}

      {/* বিস্তারিত ফলাফল টেবিল */}
      {report.details && report.details.length > 0 && (
        <div>
          <h2 className="text-xs font-extrabold text-black mb-1.5">
            বিস্তারিত ফলাফল বিবরণী:
          </h2>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-1.5 px-2 text-left font-bold text-black">
                  নং
                </th>
                <th className="border border-black py-1.5 px-2 text-left font-bold text-black">
                  বিবরণ / একক
                </th>
                <th className="border border-black py-1.5 px-2 text-right font-bold text-black">
                  পরিমাণ / ফলাফল
                </th>
              </tr>
            </thead>
            <tbody>
              {report.details.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black py-1.5 px-2 font-semibold text-black">
                    {toBnNum(idx + 1)}
                  </td>
                  <td className="border border-black py-1.5 px-2 font-semibold text-black">
                    {item.label}
                  </td>
                  <td className="border border-black py-1.5 px-2 text-right font-bold text-black">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-2 border-t border-black text-center text-[11px] font-semibold text-black">
        হিসাব ক্যালকুলেটর দ্বারা প্রস্তুতকৃত হিসাব বিবরণী
      </div>
    </div>
  );

  return (
    <>
      {/* ১. মোবাইল ও APK-এর জন্য ইন-অ্যাপ প্রিন্ট ও পিডিএফ প্রিভিউ মডাল */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[430px] max-h-[92dvh] bg-[#f1f5f9] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#123e6d] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-extrabold">প্রিন্ট ও পিডিএফ প্রিভিউ</h3>
              <p className="text-[11px] text-sky-200">
                প্রিন্ট করুন অথবা পিডিএফ (PDF) হিসেবে ফোনে সেভ করুন
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 overflow-y-auto flex-1">{renderReportContent()}</div>

          <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                shareContentNative(report.title, buildShareText(), onNotify)
              }
              className="h-11 rounded-full bg-[#f1f5f9] hover:bg-slate-200 active:scale-95 text-xs font-extrabold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> শেয়ার
            </button>
            <button
              type="button"
              onClick={() => triggerPrintNative(report.title)}
              className="col-span-2 h-11 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-95 text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট / PDF সেভ করুন
            </button>
          </div>
        </div>
      </div>

      {/* ২. সরাসরি কাগজে বা পিডিএফ প্রিন্ট শিট (@media print) */}
      <div
        id="printable-report-sheet"
        className="hidden print-only p-4 bg-white text-black"
      >
        {renderReportContent()}
      </div>
    </>
  );
};
