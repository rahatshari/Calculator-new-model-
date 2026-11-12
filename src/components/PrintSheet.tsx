import React from 'react';
import { getBnDateTime, toBnNum } from '../utils/bengali';

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

/**
 * শুধুমাত্র প্রিন্টার ও ডিফল্ট প্রিন্ট ম্যানেজারের জন্য প্রিন্ট শিট (@media print)।
 * প্রিন্ট বাটনে চাপ দিলে কোনো পপআপ প্রিভিউ ছাড়াই সরাসরি ফোনের ডিফল্ট প্রিন্ট ম্যানেজার ওপেন হবে।
 */
export const PrintSheet: React.FC<PrintSheetProps> = ({ report }) => {
  if (!report) return null;

  const formattedDate = report.dateTime || getBnDateTime();

  return (
    <div
      id="printable-report-sheet"
      className="hidden print-only p-4 bg-white text-black"
    >
      <div className="bg-white text-black p-5 rounded-2xl border border-black space-y-4">
        {/* প্রিন্ট হেডার */}
        <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="লোগো"
              className="w-10 h-10 rounded-xl object-cover border border-black"
            />
            <div>
              <h1 className="text-xl font-extrabold text-black leading-tight">
                হিসাব ক্যালকুলেটর
              </h1>
              <p className="text-xs font-bold text-black">
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
          <div className="border border-black rounded-xl p-3 bg-white space-y-1">
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
                <p className="text-[11px] font-bold text-black">প্রধান ফলাফল</p>
                <p className="text-lg font-extrabold text-black">
                  {report.summaryPrimary}
                </p>
              </div>
            )}
            {report.summarySecondary && (
              <div className="text-right">
                <p className="text-[11px] font-bold text-black">
                  আনুষঙ্গিক ফলাফল / মূল্য
                </p>
                <p className="text-sm font-bold text-black">
                  {report.summarySecondary}
                </p>
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
            <table className="print-table w-full border-collapse border border-black text-xs">
              <thead>
                <tr>
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
    </div>
  );
};
