import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  X,
} from 'lucide-react';
import { AppSettings, BENGALI_FONTS, BengaliFontId } from '../utils/storage';
import { getBnDateTime, toBnNum } from '../utils/bengali';
import { APP_BUILD_NUMBER, APP_VERSION } from '../version';
import { checkGitHubReleaseUpdate, UpdateCheckResult } from '../utils/updater';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallApp: () => void;
  availableUpdate: UpdateCheckResult | null;
  onUpdateFound: (res: UpdateCheckResult) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  isInstallable,
  isInstalled,
  onInstallApp,
  availableUpdate,
  onUpdateFound,
}) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showFontList, setShowFontList] = useState(false);

  if (!isOpen) return null;

  const activeFontMeta =
    BENGALI_FONTS[settings.fontFamily || 'anek'] || BENGALI_FONTS.anek;

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
      next
        ? 'অটো-আপডেট নোটিফিকেশন চালু করা হয়েছে।'
        : 'অটো-আপডেট নোটিফিকেশন বন্ধ করা হয়েছে।'
    );
  };

  const handleToggleAmoledDark = () => {
    const next = !settings.amoledDark;
    onUpdateSettings({
      ...settings,
      amoledDark: next,
    });
    setStatusMessage(
      next
        ? 'অ্যামোলেড ব্ল্যাক ডার্ক মোড চালু করা হয়েছে।'
        : 'লাইট মোড চালু করা হয়েছে।'
    );
  };

  const handleCheckUpdate = async () => {
    setChecking(true);
    setStatusMessage('');
    const res = await checkGitHubReleaseUpdate(settings.githubRepo);
    const nowBn = getBnDateTime();
    onUpdateSettings({
      ...settings,
      lastCheckedAt: nowBn,
    });
    setChecking(false);

    if (res.hasUpdate) {
      onUpdateFound(res);
      setStatusMessage(
        `নতুন সংস্করণ (v${toBnNum(res.latestVersion)}) পাওয়া গেছে! নিচে ক্লিক করে আপডেট করুন।`
      );
    } else {
      setStatusMessage(
        `আপনি সর্বশেষ সংস্করণ (v${toBnNum(APP_VERSION)}) ব্যবহার করছেন।`
      );
    }
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
              className="w-10 h-10 rounded-2xl border border-slate-200 shadow-2xs object-cover"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">অ্যাপ সেটিংস ও মেনু</h3>
              <p className="text-xs font-semibold text-[#123e6d]">
                সংস্করণ v{toBnNum(APP_VERSION)} • বিল্ড #{toBnNum(APP_BUILD_NUMBER)}
              </p>
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
          {/* যদি নতুন APK আপডেট পাওয়া যায় তবে সরাসরি ইনস্টল কার্ড */}
          {availableUpdate?.hasUpdate && (
            <div className="rounded-2xl bg-gradient-to-br from-[#123e6d] to-[#1b528c] text-white p-4 shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> নতুন আপডেট উপলব্ধ!
                </span>
                <span className="text-xs font-bold text-sky-200">
                  v{toBnNum(availableUpdate.latestVersion)}
                </span>
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                একই সিগনেচারে তৈরি নতুন আপডেট পাওয়া গেছে। আপনার সংরক্ষিত কোনো হিস্ট্রি মুছবে না।
              </p>
              <a
                href={availableUpdate.apkDownloadUrl}
                download="hisab-calculator.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>এখনই নতুন APK ডাউনলোড ও আপডেট করুন</span>
              </a>
            </div>
          )}

          {/* ১. বাংলা ফন্ট পরিবর্তন বাটন (ক্লিক করলে ফন্টগুলোর তালিকা খুলবে) */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFontList((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#d6e3ff] text-[#001b3d] flex items-center justify-center shrink-0">
                  <Type className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    ফন্ট পরিবর্তন করুন
                  </p>
                  <p className="text-xs font-semibold text-[#123e6d] mt-0.5">
                    বর্তমান ফন্ট: {activeFontMeta.nameBn}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#123e6d] bg-[#d6e3ff]/70 px-2.5 py-1 rounded-full">
                  {showFontList ? 'বন্ধ করুন' : 'পরিবর্তন'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#123e6d] transition-transform duration-200 ${
                    showFontList ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {showFontList && (
              <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 grid grid-cols-1 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
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
            )}
          </div>

          {/* ২. অ্যামোলেড ব্ল্যাক ডার্ক মোড (AMOLED Black Dark Mode) টগল */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center shrink-0 border border-slate-700">
                {settings.amoledDark ? (
                  <Moon className="w-4 h-4 fill-amber-300 text-amber-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  অ্যামোলেড ব্ল্যাক ডার্ক মোড
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  চোখের আরাম ও ব্যাটারি সাশ্রয়ে পিওর ব্ল্যাক (#000000) থিম
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="অ্যামোলেড ব্ল্যাক ডার্ক মোড টগল"
              aria-checked={Boolean(settings.amoledDark)}
              onClick={handleToggleAmoledDark}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                settings.amoledDark ? 'bg-sky-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-[#ffffff] shadow-xs transition-transform ${
                  settings.amoledDark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ৩. অটো-আপডেট টগল */}
          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200/80 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                স্বয়ংক্রিয় আপডেট নোটিফিকেশন
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                গিটহাবে নতুন রিলিজ আসলে অ্যাপের ভেতরেই নোটিফিকেশন আসবে
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoUpdate}
              onClick={handleToggleAutoUpdate}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                settings.autoUpdate ? 'bg-[#123e6d]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-[#ffffff] shadow-xs transition-transform ${
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
              <span>
                {checking ? 'গিটহাব রিলিজ চেক করা হচ্ছে...' : '🔄 আপডেট চেক করুন'}
              </span>
            </button>

            {statusMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* ৪. স্থায়ী সিগনেচার ও অফলাইন স্ট্যাটাস */}
          <div className="rounded-2xl bg-[#f1f5f9] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  স্থায়ী সিগনেচার (Same Signature) ও অটো-ভার্সন সক্রিয়
                </p>
                <p className="text-[11px] text-slate-500">
                  পুরাতন অ্যাপ আনইনস্টল না করেই সরাসরি নতুন আপডেট ইনস্টল হবে
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
