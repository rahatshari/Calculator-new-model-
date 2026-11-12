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
}

export const PrintSheet: React.FC<PrintSheetProps> = ({ report }) => {
  if (!report) return null;

  return (
    <div
      id="printable-report-sheet"
      className="hidden print-only p-6 bg-white text-black font-['Anek_Bangla','Noto_Sans_Bengali',sans-serif]"
    >
      {/* প্রিন্ট হেডার */}
      <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">হিসাব ক্যালকুলেটর</h1>
          <p className="text-base font-semibold text-black mt-0.5">
            {report.title} — {report.subtitle}
          </p>
        </div>
        <div className="text-right text-sm text-black">
          <p className="font-semibold">তারিখ ও সময়:</p>
          <p>{report.dateTime || getBnDateTime()}</p>
        </div>
      </div>

      {/* নোট ও ইনপুট বিবরণ */}
      {(report.note || report.inputsText) && (
        <div className="print-box mb-4">
          {report.note && (
            <p className="text-base font-bold text-black mb-1">
              📝 নাম / নোট: {report.note}
            </p>
          )}
          {report.inputsText && (
            <p className="text-sm text-black">
              <span className="font-bold">প্রদত্ত মাপসমূহ:</span> {report.inputsText}
            </p>
          )}
        </div>
      )}

      {/* প্রধান ফলাফল সারাংশ */}
      {(report.summaryPrimary || report.summarySecondary) && (
        <div className="print-box mb-4 flex items-center justify-between">
          {report.summaryPrimary && (
            <div>
              <p className="text-xs font-bold text-black">প্রধান ফলাফল</p>
              <p className="text-xl font-bold text-black">{report.summaryPrimary}</p>
            </div>
          )}
          {report.summarySecondary && (
            <div className="text-right">
              <p className="text-xs font-bold text-black">আনুষঙ্গিক ফলাফল / মূল্য</p>
              <p className="text-xl font-bold text-black">{report.summarySecondary}</p>
            </div>
          )}
        </div>
      )}

      {/* বিস্তারিত ফলাফল টেবিল */}
      {report.details && report.details.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-black mb-2">বিস্তারিত ফলাফল বিবরণী:</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>ক্রমিক</th>
                <th>বিবরণ / একক</th>
                <th>পরিমাণ / ফলাফল</th>
              </tr>
            </thead>
            <tbody>
              {report.details.map((item, idx) => (
                <tr key={idx}>
                  <td>{toBnNum(idx + 1)}</td>
                  <td className="font-semibold">{item.label}</td>
                  <td className="font-bold">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* কাস্টম টেবিল (যেমন: কাঠ বা মাটির একাধিক সারির তালিকা) */}
      {report.tableHeaders && report.tableRows && report.tableRows.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-black mb-2">তালিকাভুক্ত মাপের বিবরণ:</h2>
          <table className="print-table">
            <thead>
              <tr>
                {report.tableHeaders.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.tableRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ফুটার সামারি */}
      {report.footerSummary && report.footerSummary.length > 0 && (
        <div className="print-box mt-4">
          <div className="flex flex-wrap justify-between gap-4">
            {report.footerSummary.map((f, i) => (
              <div key={i}>
                <span className="font-semibold">{f.label}: </span>
                <span className="font-bold text-lg">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-3 border-t border-black text-center text-xs text-black">
        হিসাব ক্যালকুলেটর (অফলাইন সংস্করণ ১.০.০) দ্বারা প্রস্তুতকৃত হিসাব বিবরণী
      </div>
    </div>
  );
};
