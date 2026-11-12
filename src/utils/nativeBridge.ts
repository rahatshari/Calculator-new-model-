import { getBnDateTime, toBnNum } from './bengali';
import type { PrintableReport } from '../components/PrintSheet';

declare global {
  interface Window {
    AndroidBridge?: {
      shareText?: (title: string, text: string) => void;
      printPage?: (jobName: string) => void;
      printHtml?: (jobName: string, htmlContent: string) => void;
      setCanGoBack?: (canGoBack: boolean) => void;
    };
    Capacitor?: {
      Plugins?: {
        App?: {
          addListener?: (
            eventName: string,
            listenerFunc: (data?: { canGoBack?: boolean }) => void
          ) => Promise<{ remove: () => void }> | { remove: () => void };
           minimizeApp?: () => Promise<void>;
        };
        NativeTools?: {
          shareText?: (options: { title: string; text: string }) => Promise<void>;
          printPage?: (options: {
            jobName: string;
            htmlContent?: string;
          }) => Promise<void>;
        };
        Share?: {
          share?: (options: {
            title?: string;
            text?: string;
            dialogTitle?: string;
          }) => Promise<void>;
        };
      };
    };
  }
}

/**
 * মোবাইলের ডিফল্ট প্রিন্ট ম্যানেজারের (Android Default Print Manager) জন্য স্বয়ংসম্পূর্ণ প্রিন্ট HTML তৈরি করে।
 */
export function buildStandalonePrintHtml(report: PrintableReport): string {
  const formattedDate = report.dateTime || getBnDateTime();
  const rowsHtml = (report.details || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="border:1.5px solid #000;padding:8px 10px;font-weight:600;color:#000;">${toBnNum(idx + 1)}</td>
        <td style="border:1.5px solid #000;padding:8px 10px;font-weight:600;color:#000;">${item.label}</td>
        <td style="border:1.5px solid #000;padding:8px 10px;text-align:right;font-weight:700;color:#000;">${item.value}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>${report.title} - হিসাব ক্যালকুলেটর</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Noto Sans Bengali', 'Anek Bangla', sans-serif;
      background: #ffffff;
      color: #000000;
      margin: 0;
      padding: 16px;
      font-size: 14px;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .box {
      border: 1.5px solid #000;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 14px;
    }
    th {
      border: 1.5px solid #000;
      padding: 8px 10px;
      background: #f1f5f9;
      text-align: left;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0;font-size:22px;font-weight:800;">হিসাব ক্যালকুলেটর</h1>
      <p style="margin:4px 0 0 0;font-size:14px;font-weight:700;">${report.title} — ${report.subtitle}</p>
    </div>
    <div style="text-align:right;font-size:12px;">
      <strong>তারিখ ও সময়:</strong><br/>${formattedDate}
    </div>
  </div>
  ${
    report.note || report.inputsText
      ? `<div class="box">
          ${report.note ? `<div style="font-weight:700;margin-bottom:4px;">📝 নাম / নোট: ${report.note}</div>` : ''}
          ${report.inputsText ? `<div style="font-size:13px;"><strong>প্রদত্ত মাপসমূহ:</strong> ${report.inputsText}</div>` : ''}
        </div>`
      : ''
  }
  ${
    report.summaryPrimary || report.summarySecondary
      ? `<div class="box" style="border-width:2px;">
          ${report.summaryPrimary ? `<div style="font-size:18px;font-weight:800;">প্রধান ফলাফল: ${report.summaryPrimary}</div>` : ''}
          ${report.summarySecondary ? `<div style="font-size:14px;font-weight:700;margin-top:4px;">${report.summarySecondary}</div>` : ''}
        </div>`
      : ''
  }
  <table>
    <thead>
      <tr>
        <th style="width:50px;">নং</th>
        <th>বিবরণ / একক</th>
        <th style="text-align:right;">পরিমাণ / ফলাফল</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div style="border-top:1px solid #000;padding-top:8px;text-align:center;font-size:12px;font-weight:600;">
    হিসাব ক্যালকুলেটর দ্বারা প্রস্তুতকৃত হিসাব বিবরণী
  </div>
</body>
</html>`;
}

/**
 * মোবাইলের নেটিভ শেয়ার শিট (WhatsApp, Messenger, IMO, SMS, Bluetooth ইত্যাদি) ওপেন করে।
 */
export async function shareContentNative(
  title: string,
  text: string,
  onFallbackNotify?: (msg: string) => void
): Promise<void> {
  // ১. আমাদের কাস্টম Android Native Bridge (MainActivity.java)
  if (typeof window !== 'undefined' && window.AndroidBridge?.shareText) {
    try {
      window.AndroidBridge.shareText(title, text);
      return;
    } catch {
      // continue to next method
    }
  }

  // ২. Capacitor NativeTools Plugin
  if (
    typeof window !== 'undefined' &&
    window.Capacitor?.Plugins?.NativeTools?.shareText
  ) {
    try {
      await window.Capacitor.Plugins.NativeTools.shareText({ title, text });
      return;
    } catch {
      // continue to next method
    }
  }

  // ৩. Capacitor Official Share Plugin (@capacitor/share)
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Share?.share) {
    try {
      await window.Capacitor.Plugins.Share.share({
        title,
        text,
        dialogTitle: title,
      });
      return;
    } catch {
      return;
    }
  }

  // ৪. ওয়েব ব্রাউজারের Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      return;
    }
  }

  // ৫. ফলব্যাক: ক্লিপবোর্ডে কপি
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    onFallbackNotify?.('শেয়ারের জন্য ফলাফল কপি করা হয়েছে!');
  }
}

/**
 * মোবাইলের ডিফল্ট প্রিন্ট ম্যানেজার (Android System PrintManager) সরাসরি ওপেন করে।
 */
export function triggerPrintNative(report: PrintableReport): void {
  const jobTitle = report.title || 'হিসাব_ক্যালকুলেটর_রিপোর্ট';
  const htmlContent = buildStandalonePrintHtml(report);

  // ১. Android Native Bridge দিয়ে সরাসরি ডিফল্ট প্রিন্ট ম্যানেজার ওপেন
  if (typeof window !== 'undefined' && window.AndroidBridge?.printHtml) {
    try {
      window.AndroidBridge.printHtml(jobTitle, htmlContent);
      return;
    } catch {
      // continue
    }
  }

  if (typeof window !== 'undefined' && window.AndroidBridge?.printPage) {
    try {
      window.AndroidBridge.printPage(jobTitle);
      return;
    } catch {
      // continue
    }
  }

  // ২. Capacitor NativeTools Plugin দিয়ে ডিফল্ট প্রিন্ট ম্যানেজার ওপেন
  if (
    typeof window !== 'undefined' &&
    window.Capacitor?.Plugins?.NativeTools?.printPage
  ) {
    try {
      window.Capacitor.Plugins.NativeTools.printPage({
        jobName: jobTitle,
        htmlContent,
      });
      return;
    } catch {
      // continue
    }
  }

  // ৩. ব্রাউজারের ডিফল্ট প্রিন্ট ডায়ালগ
  if (typeof window !== 'undefined') {
    window.print();
  }
}
