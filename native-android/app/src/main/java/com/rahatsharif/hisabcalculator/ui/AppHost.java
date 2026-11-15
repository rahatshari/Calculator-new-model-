package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;

import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

public interface AppHost {
    Context getHostContext();
    Palette getPalette();
    String getActiveFontId();
    void navigateTo(String screen);
    void goBackHome();
    void saveHistory(HistoryRecord record);
    void deleteHistoryItem(String id);
    void updateHistoryNote(String id, String note);
    void clearAllHistory();
    void printReport(PrintableReport report);
    void notifyUser(String msg);
}
