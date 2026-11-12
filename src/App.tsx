/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ClipboardList,
  Compass,
  Download,
  Layers,
  Moon,
  Sparkles,
  Sun,
  Trees,
  X,
} from 'lucide-react';
import { toBnNum } from './utils/bengali';
import {
  HistoryRecord,
  AppSettings,
  BENGALI_FONTS,
  loadHistory,
  saveHistory,
  addHistoryRecord,
  updateHistoryNote,
  deleteHistoryRecord,
  clearAllHistory,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { usePWAInstall } from './utils/usePWAInstall';
import { checkGitHubReleaseUpdate, UpdateCheckResult } from './utils/updater';
import { APP_VERSION } from './version';
import { LandCalculatorView } from './components/LandCalculatorView';
import { NolCalculatorView } from './components/NolCalculatorView';
import { SoilCalculatorView } from './components/SoilCalculatorView';
import { TimberCalculatorView } from './components/TimberCalculatorView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { PrintSheet, PrintableReport } from './components/PrintSheet';
import { triggerPrintNative } from './utils/nativeBridge';

type ScreenView = 'home' | 'land' | 'nol' | 'soil' | 'timber' | 'history';

declare global {
  interface Window {
    __handleAndroidBack?: () => boolean;
  }
}

/**
 * নলের হিসাবের জন্য ঐতিহ্যবাহী মাপের লাঠি (বাঁশের নল / কাঠের লাঠি) আইকন চিত্র
 */
const LathiStickIllustration: React.FC = () => (
  <svg
    viewBox="0 0 48 48"
    className="w-9 h-9 drop-shadow-2xs"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="lathiWoodGrad" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="35%" stopColor="#b45309" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
    {/* লাঠির মূল দেহ (কোণাকুণি বাঁশের/কাঠের লাঠি) */}
    <path
      d="M9 39L39 9"
      stroke="url(#lathiWoodGrad)"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    {/* লাঠির উপরের হাইলাইট রেখা */}
    <path
      d="M10.2 37.8L37.8 10.2"
      stroke="#fde68a"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeOpacity="0.65"
    />
    {/* লাঠির দু'পাশের পিতলের বেড় (End Caps) */}
    <path d="M8.5 34.5L13.5 39.5" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M34.5 8.5L39.5 13.5" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" />
    {/* বাঁশের নলের গিট বা হাতের মাপের দাগ (৪টি গিট) */}
    <path d="M15 28L20 33" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M21.5 21.5L26.5 26.5" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M28 15L33 20" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export default function App() {
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => loadHistory());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [printReport, setPrintReport] = useState<PrintableReport | null>(null);

  // ইন-অ্যাপ অটো-আপডেট স্টেট (GitHub Releases APK Updater)
  const [availableUpdate, setAvailableUpdate] = useState<UpdateCheckResult | null>(null);
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);

  const { isInstallable, isInstalled, install: triggerInstall } = usePWAInstall();

  // সর্বশেষ স্টেট রেফারেন্স ও নেটিভ ব্রিজ সিঙ্ক (যাতে ব্যাক বাটন কখনোই ভুল করে অ্যাপ থেকে বের না হয়ে যায়)
  const navStateRef = useRef({
    currentView,
    settingsOpen,
    printReport,
  });
  useEffect(() => {
    navStateRef.current = { currentView, settingsOpen, printReport };
    const canGoBack =
      currentView !== 'home' || settingsOpen || printReport !== null;
    try {
      window.AndroidBridge?.setCanGoBack?.(canGoBack);
    } catch {
      // ignore
    }
  }, [currentView, settingsOpen, printReport]);

  // ভিউ পরিবর্তনের হেল্পার (যাতে ব্রাউজার ও অ্যান্ড্রয়েড WebView হিস্ট্রি পুশ হয়)
  const navigateToView = useCallback((nextView: ScreenView) => {
    if (navStateRef.current.currentView !== nextView) {
      try {
        window.history.pushState({ view: nextView }, '', `#${nextView}`);
      } catch {
        // ignore
      }
    }
    try {
      window.AndroidBridge?.setCanGoBack?.(nextView !== 'home');
    } catch {
      // ignore
    }
    setCurrentView(nextView);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // হোম স্ক্রিনে ফিরে যাওয়ার ব্যাক হ্যান্ডলার
  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
    try {
      window.AndroidBridge?.setCanGoBack?.(false);
      if (window.location.hash && window.location.hash !== '#home') {
        window.history.replaceState({ view: 'home' }, '', '#home');
      }
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // অ্যান্ড্রয়েড হার্ডওয়্যার ব্যাক বাটন, Capacitor backButton ও ব্রাউজার popstate হ্যান্ডলার
  useEffect(() => {
    try {
      window.history.replaceState({ view: 'home' }, '', '#home');
    } catch {
      // ignore
    }

    const handleBackAction = (): boolean => {
      const {
        currentView: activeView,
        settingsOpen: isSettingsOpen,
        printReport: activePrint,
      } = navStateRef.current;

      if (activePrint !== null) {
        setPrintReport(null);
        try {
          window.AndroidBridge?.setCanGoBack?.(isSettingsOpen || activeView !== 'home');
        } catch {
          // ignore
        }
        return true;
      }
      if (isSettingsOpen) {
        setSettingsOpen(false);
        try {
          window.AndroidBridge?.setCanGoBack?.(activeView !== 'home');
        } catch {
          // ignore
        }
        return true;
      }
      if (activeView !== 'home') {
        setCurrentView('home');
        try {
          window.AndroidBridge?.setCanGoBack?.(false);
          window.history.replaceState({ view: 'home' }, '', '#home');
        } catch {
          // ignore
        }
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        return true;
      }
      return false;
    };

    window.__handleAndroidBack = handleBackAction;

    const onPopState = () => {
      const consumed = handleBackAction();
      if (consumed) {
        try {
          window.history.pushState({ view: 'home' }, '', '#home');
        } catch {
          // ignore
        }
      }
    };

    const onCordovaBackButton = (ev: Event) => {
      const consumed = handleBackAction();
      if (consumed) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };

    window.addEventListener('popstate', onPopState);
    document.addEventListener('backbutton', onCordovaBackButton, false);
    window.addEventListener('backbutton', onCordovaBackButton, false);

    let capListenerHandle: { remove: () => void } | null = null;
    try {
      const maybePromise = window.Capacitor?.Plugins?.App?.addListener?.(
        'backButton',
        () => {
          const consumed = handleBackAction();
          if (!consumed) {
            window.Capacitor?.Plugins?.App?.minimizeApp?.();
          }
        }
      );
      if (maybePromise && typeof (maybePromise as Promise<{ remove: () => void }>).then === 'function') {
        (maybePromise as Promise<{ remove: () => void }>)
          .then((h) => {
            capListenerHandle = h;
          })
          .catch(() => {});
      } else if (maybePromise) {
        capListenerHandle = maybePromise as { remove: () => void };
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('backbutton', onCordovaBackButton, false);
      window.removeEventListener('backbutton', onCordovaBackButton, false);
      capListenerHandle?.remove?.();
      delete window.__handleAndroidBack;
    };
  }, []);

  useEffect(() => {
    saveHistory(historyRecords);
  }, [historyRecords]);

  // ফন্ট এবং অ্যামোলেড ব্ল্যাক ডার্ক মোড (AMOLED Dark Mode) সিঙ্ক
  useEffect(() => {
    saveSettings(settings);
    const fontKey = settings.fontFamily || 'anek';
    const fontMeta = BENGALI_FONTS[fontKey] || BENGALI_FONTS.anek;
    document.documentElement.style.setProperty('--app-font', fontMeta.cssFamily);

    if (settings.amoledDark) {
      document.documentElement.classList.add('amoled-dark');
    } else {
      document.documentElement.classList.remove('amoled-dark');
    }
  }, [settings]);

  // অ্যাপ ওপেন হলে স্বয়ংক্রিয়ভাবে গিটহাব রিলিজ থেকে নতুন আপডেট চেক করবে
  useEffect(() => {
    if (!settings.autoUpdate) return;
    let mounted = true;
    checkGitHubReleaseUpdate(settings.githubRepo).then((res) => {
      if (mounted && res.hasUpdate) {
        setAvailableUpdate(res);
      }
    });
    return () => {
      mounted = false;
    };
  }, [settings.autoUpdate, settings.githubRepo]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleToggleAmoledQuick = () => {
    const next = !settings.amoledDark;
    setSettings((prev) => ({
      ...prev,
      amoledDark: next,
    }));
    showToast(
      next
        ? 'অ্যামোলেড ব্ল্যাক ডার্ক মোড চালু হয়েছে'
        : 'লাইট মোড চালু হয়েছে'
    );
  };

  const handleSaveHistory = (
    record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>
  ) => {
    const updated = addHistoryRecord(record);
    setHistoryRecords(updated);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteHistoryRecord(id);
    setHistoryRecords(updated);
    showToast('হিসাবটি মুছে ফেলা হয়েছে।');
  };

  const handleClearAllHistory = () => {
    const updated = clearAllHistory();
    setHistoryRecords(updated);
  };

  const handleUpdateNote = (id: string, note: string) => {
    const updated = updateHistoryNote(id, note);
    setHistoryRecords(updated);
  };

  const handleTriggerPrint = (report: PrintableReport) => {
    setPrintReport(report);
    setTimeout(() => {
      triggerPrintNative(report);
    }, 60);
  };

  const HOME_CARDS: {
    id: ScreenView;
    title: string;
    visual: React.ReactNode;
    icon: React.ReactNode;
    accentBg: string;
    accentText: string;
  }[] = [
    {
      id: 'land',
      title: 'জমির হিসাব',
      visual: (
        <span role="img" aria-hidden="true">
          📐
        </span>
      ),
      icon: <Compass className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#d6e3ff]',
      accentText: 'text-[#001b3d]',
    },
    {
      id: 'nol',
      title: 'নলের হিসাব',
      visual: <LathiStickIllustration />,
      icon: <LathiStickIllustration />,
      accentBg: 'bg-[#d0f4ea]',
      accentText: 'text-[#002119]',
    },
    {
      id: 'soil',
      title: 'মাটির হিসাব',
      visual: (
        <span role="img" aria-hidden="true">
          ⛰️
        </span>
      ),
      icon: <Layers className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#ffdea8]',
      accentText: 'text-[#271900]',
    },
    {
      id: 'timber',
      title: 'গাছ ও কাঠের হিসাব',
      visual: (
        <span role="img" aria-hidden="true">
          🪵
        </span>
      ),
      icon: <Trees className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#ffdcc3]',
      accentText: 'text-[#2e1500]',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#cbd5e1] flex justify-center selection:bg-[#123e6d] selection:text-white">
      {/* ডেডিকেটেড মোবাইল এপিকে শেল (Mobile Frame max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-dvh bg-[#f1f5f9] flex flex-col shadow-2xl relative overflow-x-hidden no-print">
        {/* Material Design 3 Top Bar (#123e6d / AMOLED #050a12) */}
        <header className="sticky top-0 z-30 bg-[#123e6d] text-white px-2.5 h-14 flex items-center justify-between gap-1.5 shadow-md">
          {/* বাম পাশে আধুনিক চ্যাপ্টা বার (Modern Flat Bars) সেটিংস মেনু আইকন */}
          <button
            type="button"
            onClick={() => {
              try {
                window.history.pushState({ modal: 'settings' }, '');
              } catch {
                // ignore
              }
              setSettingsOpen(true);
            }}
            aria-label="সেটিংস মেনু"
            className="relative w-9 h-9 rounded-xl bg-white/12 hover:bg-white/20 active:scale-95 flex flex-col items-start justify-center gap-[4px] px-2 transition-all cursor-pointer shrink-0"
          >
            <span className="w-5 h-[2.5px] rounded-full bg-[#ffffff]" />
            <span className="w-3.5 h-[2.5px] rounded-full bg-amber-300" />
            <span className="w-4.5 h-[2.5px] rounded-full bg-[#ffffff]" />
            {availableUpdate?.hasUpdate && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#123e6d]" />
            )}
          </button>

          {/* মাঝে অ্যাপের লোগো ও শিরোনাম "হিসাব ক্যালকুলেটর" */}
          <div
            onClick={handleBackToHome}
            className="flex items-center gap-1.5 cursor-pointer select-none shrink-0"
          >
            <img
              src="/logo.png"
              alt="হিসাব ক্যালকুলেটর লোগো"
              className="w-7 h-7 rounded-lg border border-white/30 shadow-xs object-cover bg-white/10 shrink-0"
            />
            <h1 className="text-[15px] sm:text-base font-extrabold tracking-tight whitespace-nowrap text-[#ffffff]">
              হিসাব ক্যালকুলেটর
            </h1>
          </div>

          {/* ডান পাশে অ্যামোলেড ডার্ক মোড টগল + "হিস্ট্রি" বাটন */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleAmoledQuick}
              aria-label={
                settings.amoledDark
                  ? 'লাইট মোড চালু করুন'
                  : 'অ্যামোলেড ব্ল্যাক ডার্ক মোড চালু করুন'
              }
              title="অ্যামোলেড ব্ল্যাক ডার্ক মোড"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                settings.amoledDark
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-amber-300'
              }`}
            >
              {settings.amoledDark ? (
                <Sun className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[2.2]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateToView('history')}
              className={`h-8 px-2.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                currentView === 'history'
                  ? 'bg-[#ffffff] text-[#123e6d] shadow-xs'
                  : 'bg-white/15 hover:bg-white/25 text-[#ffffff]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>হিস্ট্রি</span>
              <span
                className={`min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-extrabold inline-flex items-center justify-center ${
                  currentView === 'history'
                    ? 'bg-[#123e6d] text-[#ffffff]'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {toBnNum(historyRecords.length)}
              </span>
            </button>
          </div>
        </header>

        {/* মেইন মোবাইল স্ক্রিন বডি */}
        <main className="flex-1 px-3.5 py-4 flex flex-col">
          {currentView === 'home' && (
            <div className="flex-1 flex flex-col justify-center py-2">
              {/* হোম স্ক্রিনে শুধুমাত্র ৪টি কার্ড (অন্য কোনো বাড়তি লেখা বা বিজ্ঞাপন নেই) */}
              <div className="grid grid-cols-1 gap-3.5">
                {HOME_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => navigateToView(card.id)}
                    className="group w-full bg-white hover:bg-[#f8fafc] active:scale-[0.98] rounded-[26px] p-5 border border-slate-200/90 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-[20px] ${card.accentBg} ${card.accentText} flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        {card.visual}
                      </div>
                      <span className="text-lg font-extrabold text-slate-900 group-hover:text-[#123e6d] transition-colors">
                        {card.title}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#f1f5f9] group-hover:bg-[#123e6d] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentView === 'land' && (
            <LandCalculatorView
              onBack={handleBackToHome}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'nol' && (
            <NolCalculatorView
              onBack={handleBackToHome}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'soil' && (
            <SoilCalculatorView
              onBack={handleBackToHome}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'timber' && (
            <TimberCalculatorView
              onBack={handleBackToHome}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              records={historyRecords}
              onBack={handleBackToHome}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearAllHistory}
              onUpdateNote={handleUpdateNote}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}
        </main>

        {/* ইন-অ্যাপ অটোমেটিক APK আপডেট নোটিফিকেশন ডায়ালগ */}
        {availableUpdate?.hasUpdate && !updateBannerDismissed && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
            <div className="w-full max-w-[380px] bg-white rounded-[28px] p-5 shadow-2xl border border-slate-200 space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="লোগো"
                    className="w-11 h-11 rounded-2xl border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#123e6d] bg-[#d6e3ff] px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> নতুন আপডেট এসেছে!
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      সংস্করণ v{toBnNum(availableUpdate.latestVersion)}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdateBannerDismissed(true)}
                  aria-label="বন্ধ করুন"
                  className="w-8 h-8 rounded-full bg-[#f1f5f9] text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">
                  বর্তমান সংস্করণ: v{toBnNum(APP_VERSION)} → নতুন সংস্করণ: v
                  {toBnNum(availableUpdate.latestVersion)}
                </p>
                <p className="text-slate-600">
                  একই সিগনেচারে তৈরি হওয়ায় পুরাতন অ্যাপ আনইনস্টল না করেই সরাসরি আপডেট করতে পারবেন।
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUpdateBannerDismissed(true)}
                  className="h-11 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  পরে করব
                </button>
                <a
                  href={availableUpdate.apkDownloadUrl}
                  download="hisab-calculator.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setUpdateBannerDismissed(true)}
                  className="col-span-2 h-11 rounded-full bg-[#123e6d] hover:bg-[#0e3157] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" /> এখনই আপডেট করুন
                </a>
              </div>
            </div>
          </div>
        )}

        {/* মোবাইল স্ন্যাকবার / টোস্ট নোটিফিকেশন */}
        {toastMsg && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-3">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* থ্রি-ডট সেটিংস বটম শিট মডাল */}
        <SettingsModal
          isOpen={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onUpdateSettings={setSettings}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstallApp={triggerInstall}
          availableUpdate={availableUpdate}
          onUpdateFound={(res) => setAvailableUpdate(res)}
        />
      </div>

      {/* প্রিন্ট শিট ও ইন-অ্যাপ প্রিন্ট প্রিভিউ মডাল */}
      <PrintSheet
        report={printReport}
        onClose={() => setPrintReport(null)}
        onNotify={showToast}
      />
    </div>
  );
}
