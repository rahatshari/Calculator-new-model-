package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnSingleInput;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.Calculators;
import com.rahatsharif.hisabcalculator.util.Calculators.AreaUnit;
import com.rahatsharif.hisabcalculator.util.Calculators.ConvertedItem;
import com.rahatsharif.hisabcalculator.util.Calculators.LengthUnit;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class UnitConverterView {
    private final AppHost host;
    private int activeTab = 0; // 0 = দৈর্ঘ্য একক, 1 = বর্গ একক
    private boolean showNote = false;
    private String note = "";

    private LengthUnit selectedLengthUnit = LengthUnit.ft;
    private AreaUnit selectedAreaUnit = AreaUnit.sqft;
    private String lengthInput = "";
    private String areaInput = "";

    private LinearLayout root;
    private LinearLayout resultsContainer;
    private TextView activeUnitLabelView;
    private BnSingleInput activeAmountInput;

    public UnitConverterView(AppHost host) {
        this.host = host;
    }

    public View build() {
        root = new LinearLayout(host.getHostContext());
        root.setOrientation(LinearLayout.VERTICAL);
        render();
        return root;
    }

    public void refreshTheme() {
        render();
    }

    private void render() {
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        root.removeAllViews();

        root.addView(BnUi.makeSubHeader(
            ctx, p, "একক পরিবর্তন", "দৈর্ঘ্য একক ও বর্গ একক কনভার্টার",
            !note.trim().isEmpty() || showNote,
            host::goBackHome,
            () -> { showNote = !showNote; render(); }
        ));

        if (showNote) {
            LinearLayout noteCard = BnUi.makeCard(ctx, p, 20, 10);
            EditText noteEt = BnUi.makeNoteInput(ctx, p, note, "হিসাবের নাম বা নোট লিখুন...");
            noteEt.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(Editable s) { note = s.toString(); }
            });
            noteCard.addView(noteEt);
            root.addView(noteCard, BnUi.marginTop(ctx, 10));
        }

        View seg = BnUi.makeSegmentedBar(ctx, p, new String[]{"📏 দৈর্ঘ্য একক", "⊞ বর্গ একক"}, activeTab, false, idx -> {
            activeTab = idx;
            render();
        });
        root.addView(seg, BnUi.marginTop(ctx, 10));

        // ইনপুট ও একক নির্বাচন কার্ড
        LinearLayout inputCard = BnUi.makeCard(ctx, p, 22, 12);

        TextView topLbl = new TextView(ctx);
        topLbl.setText(activeTab == 0 ? "দৈর্ঘ্যের পরিমাণ ও একক দিন" : "জমি / ক্ষেত্রফলের পরিমাণ ও একক দিন");
        topLbl.setTextSize(12);
        topLbl.setTypeface(null, Typeface.BOLD);
        topLbl.setTextColor(p.textBlueAccent);
        topLbl.setGravity(Gravity.CENTER);
        inputCard.addView(topLbl);

        LinearLayout inputRow = new LinearLayout(ctx);
        inputRow.setOrientation(LinearLayout.HORIZONTAL);

        activeAmountInput = new BnSingleInput(ctx, p, "পরিমাণ", "", false);
        String currentVal = activeTab == 0 ? lengthInput : areaInput;
        if (!currentVal.isEmpty()) {
            activeAmountInput.setText(BnFormat.normalizeBnInput(currentVal));
        }
        activeAmountInput.editText.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                String raw = s.toString();
                if (activeTab == 0) lengthInput = raw;
                else areaInput = raw;
                updateResultsOnly();
            }
        });

        LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.1f);
        alp.rightMargin = ThemeManager.dp(ctx, 8);
        inputRow.addView(activeAmountInput.box, alp);

        // একক ড্রপডাউন বক্স
        LinearLayout unitBox = new LinearLayout(ctx);
        unitBox.setOrientation(LinearLayout.VERTICAL);
        unitBox.setGravity(Gravity.CENTER);
        unitBox.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 16, p.borderInput, 1));
        unitBox.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9));

        TextView uLbl = new TextView(ctx);
        uLbl.setText("একক নির্বাচন");
        uLbl.setTextSize(11);
        uLbl.setTypeface(null, Typeface.BOLD);
        uLbl.setTextColor(p.textMuted);
        uLbl.setGravity(Gravity.CENTER);
        unitBox.addView(uLbl);

        activeUnitLabelView = new TextView(ctx);
        activeUnitLabelView.setText((activeTab == 0 ? selectedLengthUnit.label : selectedAreaUnit.label) + " ▾");
        activeUnitLabelView.setTextSize(14.5f);
        activeUnitLabelView.setTypeface(null, Typeface.BOLD);
        activeUnitLabelView.setTextColor(p.textBlueAccent);
        activeUnitLabelView.setGravity(Gravity.CENTER);
        activeUnitLabelView.setSingleLine(true);
        LinearLayout.LayoutParams ulp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        ulp.topMargin = ThemeManager.dp(ctx, 3);
        unitBox.addView(activeUnitLabelView, ulp);
        unitBox.setOnClickListener(v -> showUnitPickerDialog(ctx, p, unitBox));

        inputRow.addView(unitBox, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));
        inputCard.addView(inputRow, BnUi.marginTop(ctx, 8));

        // মুছুন ও হিস্ট্রিতে সংরক্ষণ বাটন সারি
        LinearLayout quickBtns = new LinearLayout(ctx);
        quickBtns.setOrientation(LinearLayout.HORIZONTAL);

        Button clearBtn = BnUi.makePillButton(ctx, "↺ মুছুন", p.bgInput, p.textSecondary, 0, 42);
        clearBtn.setOnClickListener(v -> {
            if (activeTab == 0) lengthInput = "";
            else areaInput = "";
            if (activeAmountInput != null) activeAmountInput.setText("");
            updateResultsOnly();
        });
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 42), 1f);
        clp.rightMargin = ThemeManager.dp(ctx, 8);
        quickBtns.addView(clearBtn, clp);

        Button saveHistBtn = BnUi.makePillButton(ctx, "💾 সংরক্ষণ করুন", Color.parseColor("#123E6D"), Color.WHITE, 0, 42);
        saveHistBtn.setOnClickListener(v -> saveCurrentToHistory());
        quickBtns.addView(saveHistBtn, new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 42), 1.6f));
        inputCard.addView(quickBtns, BnUi.marginTop(ctx, 10));

        root.addView(inputCard, BnUi.marginTop(ctx, 10));

        // ফলাফলের তালিকা কন্টেইনার (ইনপুট ফোকাস ঠিক রেখে লাইভ আপডেট হবে)
        resultsContainer = new LinearLayout(ctx);
        resultsContainer.setOrientation(LinearLayout.VERTICAL);
        root.addView(resultsContainer, BnUi.marginTop(ctx, 10));

        updateResultsOnly();
        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private void showUnitPickerDialog(Context ctx, Palette p, View anchor) {
        if (activeTab == 0) {
            LengthUnit[] units = LengthUnit.values();
            String[] labels = new String[units.length];
            int sel = 0;
            for (int i = 0; i < units.length; i++) {
                labels[i] = units[i].label;
                if (units[i] == selectedLengthUnit) sel = i;
            }
            BnUi.showAnchoredDropdown(ctx, p, host.getActiveFontId(), anchor, labels, sel, which -> {
                selectedLengthUnit = units[which];
                if (activeUnitLabelView != null) {
                    activeUnitLabelView.setText(selectedLengthUnit.label + " ▾");
                }
                updateResultsOnly();
            });
        } else {
            AreaUnit[] units = AreaUnit.values();
            String[] labels = new String[units.length];
            int sel = 0;
            for (int i = 0; i < units.length; i++) {
                labels[i] = units[i].label;
                if (units[i] == selectedAreaUnit) sel = i;
            }
            BnUi.showAnchoredDropdown(ctx, p, host.getActiveFontId(), anchor, labels, sel, which -> {
                selectedAreaUnit = units[which];
                if (activeUnitLabelView != null) {
                    activeUnitLabelView.setText(selectedAreaUnit.label + " ▾");
                }
                updateResultsOnly();
            });
        }
    }

    private List<ConvertedItem> computeCurrentItems() {
        if (activeTab == 0) {
            double amt = BnFormat.parseBnNum(lengthInput);
            return Calculators.convertLength(amt, selectedLengthUnit);
        } else {
            double amt = BnFormat.parseBnNum(areaInput);
            return Calculators.convertArea(amt, selectedAreaUnit);
        }
    }

    private void updateResultsOnly() {
        if (resultsContainer == null) return;
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        resultsContainer.removeAllViews();

        List<ConvertedItem> items = computeCurrentItems();
        LinearLayout listCard = BnUi.makeCard(ctx, p, 22, 10);

        TextView listTitle = new TextView(ctx);
        listTitle.setText(activeTab == 0 ? "দৈর্ঘ্য একক রূপান্তর ফলাফল" : "বর্গ একক রূপান্তর ফলাফল");
        listTitle.setTextSize(12);
        listTitle.setTypeface(null, Typeface.BOLD);
        listTitle.setTextColor(p.textBlueAccent);
        listTitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleLp.bottomMargin = ThemeManager.dp(ctx, 8);
        listCard.addView(listTitle, titleLp);

        for (int i = 0; i < items.size(); i++) {
            final ConvertedItem item = items.get(i);
            LinearLayout row = new LinearLayout(ctx);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);

            int bg = item.isSource
                ? (p.isDark ? p.softBlueBg : Color.parseColor("#EEF4FF"))
                : p.bgSecondary;
            int border = item.isSource
                ? (p.isDark ? Color.parseColor("#38BDF8") : Color.parseColor("#6E88A6"))
                : p.borderCard;
            row.setBackground(ThemeManager.roundRect(ctx, bg, 16, border, item.isSource ? 1.2f : 1f));
            row.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 10));

            TextView valTv = new TextView(ctx);
            valTv.setText(item.formatted);
            valTv.setTextSize(16.5f);
            valTv.setTypeface(null, Typeface.BOLD);
            valTv.setTextColor(item.isSource ? p.textBlueAccent : (p.isDark ? Color.parseColor("#F87171") : Color.parseColor("#B91C1C")));
            valTv.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams vlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.3f);
            row.addView(valTv, vlp);

            TextView unitTv = new TextView(ctx);
            unitTv.setText(item.label);
            unitTv.setTextSize(14.5f);
            unitTv.setTypeface(null, Typeface.BOLD);
            unitTv.setTextColor(item.isSource ? p.softBlueText : p.textPrimary);
            unitTv.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams unlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            unlp.leftMargin = ThemeManager.dp(ctx, 8);
            row.addView(unitTv, unlp);

            row.setOnClickListener(v -> {
                String txt = item.formatted + " " + item.label;
                NativeTools.copyToClipboard(ctx, txt);
                host.notifyUser("কপি হয়েছে: " + txt);
            });

            LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            if (i > 0) rlp.topMargin = ThemeManager.dp(ctx, 6);
            listCard.addView(row, rlp);
        }

        // কপি / শেয়ার / প্রিন্ট বাটন সারি
        listCard.addView(BnUi.makeActionRow3(ctx, p, () -> {
            NativeTools.copyToClipboard(ctx, buildShareText(items));
            host.notifyUser("একক পরিবর্তনের ফলাফল কপি করা হয়েছে!");
        }, () -> NativeTools.shareText(ctx, "একক পরিবর্তন ফলাফল", buildShareText(items)), () -> {
            double amt = BnFormat.parseBnNum(activeTab == 0 ? lengthInput : areaInput);
            String srcLabel = activeTab == 0 ? selectedLengthUnit.label : selectedAreaUnit.label;
            PrintableReport r = new PrintableReport();
            r.title = "একক পরিবর্তন";
            r.subtitle = activeTab == 0 ? "দৈর্ঘ্য একক রূপান্তর" : "বর্গ একক রূপান্তর";
            r.note = note.trim();
            r.inputsText = "প্রদত্ত মান: " + BnFormat.toBnNumTrim(amt) + " " + srcLabel;
            r.summaryPrimary = BnFormat.toBnNumTrim(amt) + " " + srcLabel;
            r.summarySecondary = activeTab == 0 ? "দৈর্ঘ্যের সকল এককে মান" : "ক্ষেত্রফলের সকল বর্গ এককে মান";
            r.details = toDetailItems(items);
            host.printReport(r);
        }), BnUi.marginTop(ctx, 12));

        resultsContainer.addView(listCard);
        ThemeManager.applyFontRecursively(resultsContainer, ctx, host.getActiveFontId());
    }

    private List<DetailItem> toDetailItems(List<ConvertedItem> items) {
        List<DetailItem> details = new ArrayList<>();
        for (ConvertedItem item : items) {
            details.add(new DetailItem(item.label, item.formatted + " " + item.label));
        }
        return details;
    }

    private String buildShareText(List<ConvertedItem> items) {
        double amt = BnFormat.parseBnNum(activeTab == 0 ? lengthInput : areaInput);
        String srcLabel = activeTab == 0 ? selectedLengthUnit.label : selectedAreaUnit.label;
        String subTitle = activeTab == 0 ? "দৈর্ঘ্য একক রূপান্তর" : "বর্গ একক রূপান্তর";

        StringBuilder sb = new StringBuilder();
        sb.append("একক পরিবর্তন (").append(subTitle).append(")\n");
        if (!note.trim().isEmpty()) sb.append("নোট: ").append(note.trim()).append("\n");
        sb.append("প্রদত্ত মান: ").append(BnFormat.toBnNumTrim(amt)).append(" ").append(srcLabel).append("\n");
        for (ConvertedItem item : items) {
            sb.append("• ").append(item.label).append(": ").append(item.formatted).append("\n");
        }
        return sb.toString();
    }

    private void saveCurrentToHistory() {
        double amt = BnFormat.parseBnNum(activeTab == 0 ? lengthInput : areaInput);
        if (amt <= 0) {
            host.notifyUser("সংরক্ষণ করতে দয়া করে একটি মান লিখুন।");
            return;
        }
        List<ConvertedItem> items = computeCurrentItems();
        String srcLabel = activeTab == 0 ? selectedLengthUnit.label : selectedAreaUnit.label;
        String subTitle = activeTab == 0 ? "দৈর্ঘ্য একক" : "বর্গ একক";

        String secondary;
        if (activeTab == 0) {
            secondary = items.get(0).formatted + " ফুট | " + items.get(2).formatted + " মিটার | " + items.get(3).formatted + " হাত";
        } else {
            secondary = items.get(0).formatted + " বর্গফুট | " + items.get(1).formatted + " শতক | " + items.get(5).formatted + " কাঠা";
        }

        HistoryRecord hr = new HistoryRecord();
        hr.category = "converter";
        hr.categoryLabel = "একক পরিবর্তন";
        hr.subTypeLabel = subTitle;
        hr.note = note.trim();
        hr.summaryPrimary = BnFormat.toBnNumTrim(amt) + " " + srcLabel;
        hr.summarySecondary = secondary;
        hr.inputsText = "ইনপুট: " + BnFormat.toBnNumTrim(amt) + " " + srcLabel;
        hr.details = toDetailItems(items);
        host.saveHistory(hr);
        host.notifyUser("হিস্ট্রিতে সংরক্ষণ করা হয়েছে!");
    }
}
