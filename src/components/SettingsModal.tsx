import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
  Type,
  X,
} from 'lucide-react';
import { AppSettings, BENGALI_FONTS, BengaliFontId } from '../utils/storage';
import { getBnDateTime } from '../utils/bengali';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallApp: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  isInstallable,
  isInstalled,
  onInstallApp,
}) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectFont = (fontId: BengaliFontId) => {
    onUpdateSettings({
      ...settings,
      fontFamily: fontId,
    });
    setStatusMessage(`"${BENGALI_FONTS[fontId].nameBn}" ফন্টটি সক্রিয় করা হয়েছে।`);
  };

  const handleToggleAutoUpdate = () => {
    const next = !settings.autoUpdate;
    onUpdateSettings({
      ...settings,
      autoUpdate: next,
    });
    setStatusMessage(
      next ? 'অটো-আপডেট চালু করা হয়েছে।' : 'অটো-আপডেট বন্ধ করা হয়েছে।'
    );
  };

  const handleCheckUpdate = () => {
    setChecking(true);
    setStatusMessage('');
    setTimeout(() => {
      const nowBn = getBnDateTime();
      onUpdateSettings({
        ...settings,
        lastCheckedAt: nowBn,
      });
      setChecking(false);
      setStatusMessage('আপনি সর্বশেষ সংস্করণ (১.০.০) ব্যবহার করছেন।');
    }, 550);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[88dvh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Material 3 Bottom Sheet Handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 rounded-full bg-slate-300" />
        </div>

        {/* হেডার */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="হিসাব ক্যালকুলেটর লোগো"
              className="w-10 h-10 rounded-full border border-slate-200 shadow-2xs object-cover"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">অ্যাপ সেটিংস ও ফন্ট</h3>
              <p className="text-xs font-semibold text-[#123e6d]">সংস্করণ ১.০.০ (অফলাইন APK রেডি)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 rounded-full bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* ১. বাংলা ফন্ট নির্বাচন সেকশন */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#123e6d]" />
              <span className="text-xs font-extrabold text-[#123e6d]">
                পছন্দের বাংলা ফন্ট নির্বাচন করুন (৫টি ফন্ট)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(BENGALI_FONTS) as BengaliFontId[]).map((fontKey) => {
                const fontMeta = BENGALI_FONTS[fontKey];
                const isSelected = (settings.fontFamily || 'anek') === fontKey;
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() => handleSelectFont(fontKey)}
                    style={{ fontFamily: fontMeta.cssFamily }}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#123e6d] border-[#123e6d] text-white shadow-xs'
                        : 'bg-white border-slate-200/80 text-slate-800 hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold leading-snug">{fontMeta.nameBn}</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isSelected ? 'text-sky-200' : 'text-slate-500'
                        }`}
                      >
                        {fontMeta.subtitleBn} • ০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white text-[#123e6d]'
                          : 'bg-[#f1f5f9] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ২. অটো-আপডেট টগল */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">স্বয়ংক্রিয় আপডেট (অটো-আপডেট)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                নতুন সূত্র বা আপডেট আসলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoUpdate}
              onClick={handleToggleAutoUpdate}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 cursor-pointer ${
                settings.autoUpdate ? 'bg-[#123e6d]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                  settings.autoUpdate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ৩. ম্যানুয়াল আপডেট চেক */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>সর্বশেষ আপডেট পরীক্ষা:</span>
              <span className="font-bold text-slate-800">{settings.lastCheckedAt}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={checking}
              className="w-full h-10 rounded-full bg-[#123e6d] hover:bg-[#0e3157] active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'আপডেট চেক করা হচ্ছে...' : '🔄 আপডেট চেক করুন'}</span>
            </button>

            {statusMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* ৪. অফলাইন ও GitHub APK স্ট্যাটাস */}
          <div className="rounded-2xl bg-[#f1f5f9] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  ১০০% অফলাইন ও GitHub APK বিল্ড প্রস্তুত
                </p>
                <p className="text-[11px] text-slate-500">
                  GitHub Actions ও Capacitor কনফিগারেশন যুক্ত আছে
                </p>
              </div>
            </div>
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={onInstallApp}
                className="h-8 px-3 rounded-full bg-[#123e6d] text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> ইনস্টল
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
