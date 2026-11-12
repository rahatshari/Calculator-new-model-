declare global {
  interface Window {
    AndroidBridge?: {
      shareText?: (title: string, text: string) => void;
      printPage?: (jobName: string) => void;
    };
    Capacitor?: {
      Plugins?: {
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
 * মোবাইলের নেটিভ শেয়ার শিট (WhatsApp, Messenger, IMO, SMS, Bluetooth ইত্যাদি) ওপেন করে।
 */
export async function shareContentNative(
  title: string,
  text: string,
  onFallbackNotify?: (msg: string) => void
): Promise<void> {
  // ১. আমাদের কাস্টম Android Native Bridge (APK-এর ভেতর ১০০% কাজ করবে)
  if (typeof window !== 'undefined' && window.AndroidBridge?.shareText) {
    try {
      window.AndroidBridge.shareText(title, text);
      return;
    } catch {
      // fallback to next method
    }
  }

  // ২. Capacitor Share Plugin (যদি যুক্ত থাকে)
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

  // ৩. ওয়েব ব্রাউজারের Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      return;
    }
  }

  // ৪. ফলব্যাক: ক্লিপবোর্ডে কপি
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    onFallbackNotify?.('শেয়ারের জন্য ফলাফল কপি করা হয়েছে!');
  }
}

/**
 * মোবাইলের নেটিভ Android Print / Save as PDF অথবা ওয়েব ব্রাউজারের প্রিন্ট ডায়ালগ ওপেন করে।
 */
export function triggerPrintNative(jobTitle = 'হিসাব_ক্যালকুলেটর_রিপোর্ট'): void {
  if (typeof window !== 'undefined' && window.AndroidBridge?.printPage) {
    try {
      window.AndroidBridge.printPage(jobTitle);
      return;
    } catch {
      // fallback to window.print
    }
  }
  if (typeof window !== 'undefined') {
    window.print();
  }
}
