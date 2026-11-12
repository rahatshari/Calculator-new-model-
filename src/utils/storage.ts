import { getBnDateTime, toBnNum } from './bengali';
import { TimberItem } from './calculators';
import { APP_VERSION, GITHUB_REPO } from '../version';

export type CalculatorCategory = 'land' | 'nol' | 'soil' | 'timber';

export interface HistoryRecord {
  id: string;
  category: CalculatorCategory;
  categoryLabel: string; // 'জমির হিসাব' | 'নলের হিসাব' | 'মাটির হিসাব' | 'গাছ ও কাঠের হিসাব'
  subTypeLabel: string;
  timestamp: string;     // বাংলা তারিখ ও সময়
  createdAt: number;
  note: string;          // ব্যবহারকারীর নাম/নোট (📝 নোট)
  summaryPrimary: string;
  summarySecondary: string;
  inputsText: string;
  details: Array<{ label: string; value: string }>;
  tableRows?: Array<{
    sl: string;
    desc: string;
    dimensions: string;
    qty: string;
    cft: string;
    price: string;
  }>;
}

export type BengaliFontId = 'anek' | 'noto' | 'baloo' | 'hind' | 'tiro';

export const BENGALI_FONTS: Record<
  BengaliFontId,
  { id: BengaliFontId; nameBn: string; subtitleBn: string; cssFamily: string }
> = {
  anek: {
    id: 'anek',
    nameBn: 'অনেক বাংলা (Anek Bangla)',
    subtitleBn: 'আধুনিক ও ঝকঝকে মোবাইল ফন্ট',
    cssFamily: "'Anek Bangla', 'Noto Sans Bengali', sans-serif",
  },
  noto: {
    id: 'noto',
    nameBn: 'নোটো সান্স (Noto Sans Bengali)',
    subtitleBn: 'গুগল স্ট্যান্ডার্ড ক্লিন ফন্ট',
    cssFamily: "'Noto Sans Bengali', sans-serif",
  },
  baloo: {
    id: 'baloo',
    nameBn: 'বালু দা ২ (Baloo Da 2)',
    subtitleBn: 'রাউন্ডেড ও আধুনিক ডিসপ্লে ফন্ট',
    cssFamily: "'Baloo Da 2', 'Noto Sans Bengali', sans-serif",
  },
  hind: {
    id: 'hind',
    nameBn: 'হিন্দ শিলিগুড়ি (Hind Siliguri)',
    subtitleBn: 'ক্লাসিক কম্প্যাক্ট ইউআই ফন্ট',
    cssFamily: "'Hind Siliguri', sans-serif",
  },
  tiro: {
    id: 'tiro',
    nameBn: 'তিরো বাংলা (Tiro Bangla)',
    subtitleBn: 'ঐতিহ্যবাহী দলিল ও পুস্তক ফন্ট',
    cssFamily: "'Tiro Bangla', serif",
  },
};

export interface AppSettings {
  version: string;
  autoUpdate: boolean;
  autoUpdateCheck?: boolean;
  lastCheckedAt: string;
  fontFamily: BengaliFontId;
  amoledDark?: boolean;
  githubRepo?: string;
}

const HISTORY_STORAGE_KEY = 'hisab_calculator_history_v1';
const SETTINGS_STORAGE_KEY = 'hisab_calculator_settings_v1';
const TIMBER_CART_KEY = 'hisab_calculator_timber_cart_v1';

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function addHistoryRecord(
  record: Omit<HistoryRecord, 'id' | 'timestamp' | 'createdAt'>
): HistoryRecord[] {
  const current = loadHistory();
  const newRecord: HistoryRecord = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: getBnDateTime(new Date()),
    createdAt: Date.now(),
  };
  const updated = [newRecord, ...current].slice(0, 200);
  saveHistory(updated);
  return updated;
}

export function updateHistoryNote(id: string, note: string): HistoryRecord[] {
  const current = loadHistory();
  const updated = current.map((item) => (item.id === id ? { ...item, note } : item));
  saveHistory(updated);
  return updated;
}

export function deleteHistoryRecord(id: string): HistoryRecord[] {
  const current = loadHistory();
  const updated = current.filter((item) => item.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearAllHistory(): HistoryRecord[] {
  saveHistory([]);
  return [];
}

export function loadSettings(): AppSettings {
  const currentBnVer = `v${toBnNum(APP_VERSION)}`;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        version: currentBnVer,
        autoUpdate: true,
        autoUpdateCheck: true,
        lastCheckedAt: getBnDateTime(new Date()),
        fontFamily: 'anek',
        amoledDark: false,
        githubRepo: GITHUB_REPO,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      version: currentBnVer,
      autoUpdate: parsed.autoUpdate ?? parsed.autoUpdateCheck ?? true,
      autoUpdateCheck: parsed.autoUpdate ?? parsed.autoUpdateCheck ?? true,
      lastCheckedAt: parsed.lastCheckedAt || getBnDateTime(new Date()),
      fontFamily:
        parsed.fontFamily && BENGALI_FONTS[parsed.fontFamily as BengaliFontId]
          ? (parsed.fontFamily as BengaliFontId)
          : 'anek',
      amoledDark: Boolean(parsed.amoledDark),
      githubRepo: parsed.githubRepo || GITHUB_REPO,
    };
  } catch {
    return {
      version: currentBnVer,
      autoUpdate: true,
      autoUpdateCheck: true,
      lastCheckedAt: getBnDateTime(new Date()),
      fontFamily: 'anek',
      amoledDark: false,
      githubRepo: GITHUB_REPO,
    };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export const loadAppSettings = loadSettings;
export const saveAppSettings = saveSettings;

export function loadTimberCart(): TimberItem[] {
  try {
    const raw = localStorage.getItem(TIMBER_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTimberCart(items: TimberItem[]): void {
  try {
    localStorage.setItem(TIMBER_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

export function clearTimberCart(): void {
  try {
    localStorage.removeItem(TIMBER_CART_KEY);
  } catch {
    // Ignore
  }
}
