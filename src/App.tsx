/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ClipboardList,
  Compass,
  Layers,
  MoreVertical,
  Ruler,
  Trees,
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
import { LandCalculatorView } from './components/LandCalculatorView';
import { NolCalculatorView } from './components/NolCalculatorView';
import { SoilCalculatorView } from './components/SoilCalculatorView';
import { TimberCalculatorView } from './components/TimberCalculatorView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { PrintSheet, PrintableReport } from './components/PrintSheet';

type ScreenView = 'home' | 'land' | 'nol' | 'soil' | 'timber' | 'history';

export default function App() {
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => loadHistory());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [printReport, setPrintReport] = useState<PrintableReport | null>(null);

  const { isInstallable, isInstalled, install: triggerInstall } = usePWAInstall();

  useEffect(() => {
    saveHistory(historyRecords);
  }, [historyRecords]);

  useEffect(() => {
    saveSettings(settings);
    const fontKey = settings.fontFamily || 'anek';
    const fontMeta = BENGALI_FONTS[fontKey] || BENGALI_FONTS.anek;
    document.documentElement.style.setProperty('--app-font', fontMeta.cssFamily);
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
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
      window.print();
    }, 150);
  };

  const HOME_CARDS: {
    id: ScreenView;
    title: string;
    emoji: string;
    icon: React.ReactNode;
    accentBg: string;
    accentText: string;
  }[] = [
    {
      id: 'land',
      title: 'জমির হিসাব',
      emoji: '📐',
      icon: <Compass className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#d6e3ff]',
      accentText: 'text-[#001b3d]',
    },
    {
      id: 'nol',
      title: 'নলের হিসাব',
      emoji: '📏',
      icon: <Ruler className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#d0f4ea]',
      accentText: 'text-[#002119]',
    },
    {
      id: 'soil',
      title: 'মাটির হিসাব',
      emoji: '⛰️',
      icon: <Layers className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#ffdea8]',
      accentText: 'text-[#271900]',
    },
    {
      id: 'timber',
      title: 'গাছ ও কাঠের হিসাব',
      emoji: '🪵',
      icon: <Trees className="w-6 h-6 stroke-[2.2]" />,
      accentBg: 'bg-[#ffdcc3]',
      accentText: 'text-[#2e1500]',
    },
  ];

  return (
    <div className="min-h-dvh bg-[#cbd5e1] flex justify-center selection:bg-[#123e6d] selection:text-white">
      {/* ডেডিকেটেড মোবাইল এপিকে শেল (Mobile Frame max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-dvh bg-[#f1f5f9] flex flex-col shadow-2xl relative overflow-x-hidden no-print">
        {/* Material Design 3 Top Bar (#123e6d) */}
        <header className="sticky top-0 z-30 bg-[#123e6d] text-white px-3.5 h-15 flex items-center justify-between shadow-md">
          {/* বাম পাশে থ্রি-ডট (⋮) সেটিংস আইকন */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="সেটিংস মেনু"
            className="w-10 h-10 rounded-full hover:bg-white/15 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* মাঝে অ্যাপের লোগো ও শিরোনাম "হিসাব ক্যালকুলেটর" */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img
              src="/logo.png"
              alt="হিসাব ক্যালকুলেটর লোগো"
              className="w-8 h-8 rounded-full border border-white/25 shadow-xs object-cover"
            />
            <h1 className="text-lg font-extrabold tracking-tight">
              হিসাব ক্যালকুলেটর
            </h1>
          </div>

          {/* ডান পাশে "📋 হিস্ট্রি" বাটন (সংরক্ষিত হিস্ট্রির ব্যাজ সংখ্যা সহ) */}
          <button
            type="button"
            onClick={() => setCurrentView('history')}
            className={`h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              currentView === 'history'
                ? 'bg-white text-[#123e6d] shadow-xs'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>হিস্ট্রি</span>
            <span
              className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-extrabold inline-flex items-center justify-center ${
                currentView === 'history'
                  ? 'bg-[#123e6d] text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {toBnNum(historyRecords.length)}
            </span>
          </button>
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
                    onClick={() => setCurrentView(card.id)}
                    className="group w-full bg-white hover:bg-[#f8fafc] active:scale-[0.98] rounded-[26px] p-5 border border-slate-200/90 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-[20px] ${card.accentBg} ${card.accentText} flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        <span role="img" aria-hidden="true">
                          {card.emoji}
                        </span>
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
              onBack={() => setCurrentView('home')}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'nol' && (
            <NolCalculatorView
              onBack={() => setCurrentView('home')}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'soil' && (
            <SoilCalculatorView
              onBack={() => setCurrentView('home')}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'timber' && (
            <TimberCalculatorView
              onBack={() => setCurrentView('home')}
              onSaveHistory={handleSaveHistory}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              records={historyRecords}
              onBack={() => setCurrentView('home')}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearAllHistory}
              onUpdateNote={handleUpdateNote}
              onPrint={handleTriggerPrint}
              onNotify={showToast}
            />
          )}
        </main>

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
        />
      </div>

      {/* প্রিন্ট শিট (শুধুমাত্র প্রিন্টের সময় দৃশ্যমান) */}
      <PrintSheet report={printReport} />
    </div>
  );
}
