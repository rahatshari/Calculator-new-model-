package com.rahatsharif.hisabcalculator.ui;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class HistoryView {
    private final AppHost host;
    private List<HistoryRecord> records = new ArrayList<>();
    private String searchQuery = "";
    private String activeFilter = "all"; // all, land, nol, soil, timber
    private String editingId = null;
    private String editingNoteDraft = "";

    private LinearLayout root;
    private LinearLayout listContainer;
    private LinearLayout filterContainer;
    private TextView countSubtitle;

    public HistoryView(AppHost host) {
        this.host = host;
    }

    public void setRecords(List<HistoryRecord> records) {
        this.records = records != null ? records : new ArrayList<>();
        if (root != null) {
            renderListAndFilters();
        }
    }

    public View build(List<HistoryRecord> records) {
        this.records = records != null ? records : new ArrayList<>();
        root = new LinearLayout(host.getHostContext());
        root.setOrientation(LinearLayout.VERTICAL);
        renderFull();
        return root;
    }

    public void refreshTheme() {
        if (root != null) renderFull();
    }

    private void renderFull() {
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        root.removeAllViews();

        // Top header bar with Back button + Clear All button
        LinearLayout hdr = new LinearLayout(ctx);
        hdr.setOrientation(LinearLayout.HORIZONTAL);
        hdr.setGravity(Gravity.CENTER_VERTICAL);
        hdr.setBackground(ThemeManager.roundRect(ctx, p.bgCard, 22, p.borderCard, 1));
        hdr.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10));

        TextView backBtn = new TextView(ctx);
        backBtn.setText("←");
        backBtn.setTextSize(20);
        backBtn.setTypeface(null, Typeface.BOLD);
        backBtn.setTextColor(p.textPrimary);
        backBtn.setGravity(Gravity.CENTER);
        backBtn.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 999, 0, 0));
        backBtn.setOnClickListener(v -> host.goBackHome());
        hdr.addView(backBtn, new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 40), ThemeManager.dp(ctx, 40)));

        LinearLayout titles = new LinearLayout(ctx);
        titles.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        tlp.leftMargin = ThemeManager.dp(ctx, 10);

        TextView tvT = new TextView(ctx);
        tvT.setText("হিসাব হিস্ট্রি");
        tvT.setTextSize(16);
        tvT.setTypeface(null, Typeface.BOLD);
        tvT.setTextColor(p.textPrimary);
        titles.addView(tvT);

        countSubtitle = new TextView(ctx);
        countSubtitle.setText("সর্বমোট " + BnFormat.toBnNum(records.size()) + "টি সংরক্ষিত হিসাব");
        countSubtitle.setTextSize(11);
        countSubtitle.setTextColor(p.textMuted);
        titles.addView(countSubtitle);
        hdr.addView(titles, tlp);

        if (!records.isEmpty()) {
            TextView clearAllBtn = new TextView(ctx);
            clearAllBtn.setText("সব মুছুন");
            clearAllBtn.setTextSize(12);
            clearAllBtn.setTypeface(null, Typeface.BOLD);
            clearAllBtn.setTextColor(p.dangerText);
            clearAllBtn.setBackground(ThemeManager.roundRect(ctx, p.dangerBg, 999, 0, 0));
            clearAllBtn.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 7), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 7));
            clearAllBtn.setOnClickListener(v -> new AlertDialog.Builder(ctx)
                .setTitle("সব হিস্ট্রি মুছবেন?")
                .setMessage("আপনি কি সব সংরক্ষিত হিসাব স্থায়ীভাবে মুছে ফেলতে চান?")
                .setPositiveButton("হ্যাঁ, মুছুন", (d, w) -> {
                    host.clearAllHistory();
                    host.notifyUser("সব হিস্ট্রি মুছে ফেলা হয়েছে।");
                })
                .setNegativeButton("বাতিল", null)
                .show());
            hdr.addView(clearAllBtn);
        }
        root.addView(hdr);

        // Search input box
        LinearLayout searchCard = BnUi.makeCard(ctx, p, 18, 8);
        EditText searchEt = BnUi.makeNoteInput(ctx, p, searchQuery, "🔍 নোট, মাপ বা হিসাবের ধরন দিয়ে খুঁজুন...");
        searchEt.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                searchQuery = s.toString();
                renderListOnly();
            }
        });
        searchCard.addView(searchEt);
        root.addView(searchCard, BnUi.marginTop(ctx, 10));

        // Filter row
        HorizontalScrollView hsv = new HorizontalScrollView(ctx);
        hsv.setHorizontalScrollBarEnabled(false);
        filterContainer = new LinearLayout(ctx);
        filterContainer.setOrientation(LinearLayout.HORIZONTAL);
        hsv.addView(filterContainer);
        root.addView(hsv, BnUi.marginTop(ctx, 10));

        // List container
        listContainer = new LinearLayout(ctx);
        listContainer.setOrientation(LinearLayout.VERTICAL);
        root.addView(listContainer, BnUi.marginTop(ctx, 10));

        renderListAndFilters();
        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private void renderListAndFilters() {
        if (countSubtitle != null) {
            countSubtitle.setText("সর্বমোট " + BnFormat.toBnNum(records.size()) + "টি সংরক্ষিত হিসাব");
        }
        renderFilters();
        renderListOnly();
    }

    private void renderFilters() {
        if (filterContainer == null) return;
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        filterContainer.removeAllViews();

        String[][] cats = {
            {"all", "সব"},
            {"land", "জমির হিসাব"},
            {"nol", "নলের হিসাব"},
            {"soil", "মাটির হিসাব"},
            {"timber", "গাছ ও কাঠ"},
            {"converter", "একক পরিবর্তন"}
        };

        for (int i = 0; i < cats.length; i++) {
            final String id = cats[i][0];
            String label = cats[i][1];
            boolean active = id.equals(activeFilter);

            TextView chip = new TextView(ctx);
            chip.setText(label);
            chip.setTextSize(12);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setTextColor(active ? Color.WHITE : p.textSecondary);
            chip.setBackground(ThemeManager.roundRect(
                ctx,
                active ? Color.parseColor("#123E6D") : p.bgCard,
                999,
                active ? 0 : p.borderCard,
                active ? 0 : 1
            ));
            chip.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 8));
            chip.setOnClickListener(v -> {
                activeFilter = id;
                renderListAndFilters();
            });
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            if (i < cats.length - 1) lp.rightMargin = ThemeManager.dp(ctx, 6);
            filterContainer.addView(chip, lp);
        }
        ThemeManager.applyFontRecursively(filterContainer, ctx, host.getActiveFontId());
    }

    private void renderListOnly() {
        if (listContainer == null) return;
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        listContainer.removeAllViews();

        String q = searchQuery != null ? searchQuery.trim().toLowerCase(Locale.ROOT) : "";
        List<HistoryRecord> filtered = new ArrayList<>();
        for (HistoryRecord r : records) {
            if (!"all".equals(activeFilter) && !activeFilter.equals(r.category)) continue;
            if (!q.isEmpty()) {
                String hay = (safe(r.categoryLabel) + " " + safe(r.subTypeLabel) + " " + safe(r.note)
                    + " " + safe(r.summaryPrimary) + " " + safe(r.summarySecondary) + " " + safe(r.inputsText))
                    .toLowerCase(Locale.ROOT);
                if (!hay.contains(q)) continue;
            }
            filtered.add(r);
        }

        if (filtered.isEmpty()) {
            LinearLayout empty = BnUi.makeCard(ctx, p, 22, 24);
            empty.setGravity(Gravity.CENTER);
            TextView icon = new TextView(ctx);
            icon.setText("📋");
            icon.setTextSize(32);
            icon.setGravity(Gravity.CENTER);
            empty.addView(icon);

            TextView msg = new TextView(ctx);
            msg.setText(records.isEmpty()
                ? "এখনো কোনো হিসাব সংরক্ষিত হয়নি।\nহিসাব করলেই এখানে স্বয়ংক্রিয়ভাবে জমা হবে।"
                : "এই ফিল্টার বা সার্চে কোনো হিসাব পাওয়া যায়নি।");
            msg.setTextSize(13);
            msg.setTextColor(p.textMuted);
            msg.setGravity(Gravity.CENTER);
            empty.addView(msg, BnUi.marginTop(ctx, 8));
            listContainer.addView(empty);
            ThemeManager.applyFontRecursively(listContainer, ctx, host.getActiveFontId());
            return;
        }

        for (int i = 0; i < filtered.size(); i++) {
            final HistoryRecord rec = filtered.get(i);
            LinearLayout card = BnUi.makeCard(ctx, p, 20, 12);

            // Top badge + date + single delete
            LinearLayout topRow = new LinearLayout(ctx);
            topRow.setOrientation(LinearLayout.HORIZONTAL);
            topRow.setGravity(Gravity.CENTER_VERTICAL);

            int badgeBg;
            int badgeTxt;
            if ("nol".equals(rec.category)) {
                badgeBg = p.emeraldBg;
                badgeTxt = p.emeraldText;
            } else if ("soil".equals(rec.category)) {
                badgeBg = p.isDark ? Color.parseColor("#362204") : Color.parseColor("#FFDEA8");
                badgeTxt = p.isDark ? Color.parseColor("#FCD34D") : Color.parseColor("#78350F");
            } else if ("timber".equals(rec.category)) {
                badgeBg = p.isDark ? Color.parseColor("#381A05") : Color.parseColor("#FFDCC3");
                badgeTxt = p.isDark ? Color.parseColor("#FDBA74") : Color.parseColor("#7C2D12");
            } else if ("converter".equals(rec.category)) {
                badgeBg = p.isDark ? Color.parseColor("#042F2E") : Color.parseColor("#CCFBF1");
                badgeTxt = p.isDark ? Color.parseColor("#5EEAD4") : Color.parseColor("#115E59");
            } else {
                badgeBg = p.softBlueBg;
                badgeTxt = p.softBlueText;
            }

            TextView badge = new TextView(ctx);
            badge.setText(safe(rec.categoryLabel));
            badge.setTextSize(11);
            badge.setTypeface(null, Typeface.BOLD);
            badge.setTextColor(badgeTxt);
            badge.setBackground(ThemeManager.roundRect(ctx, badgeBg, 999, 0, 0));
            badge.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 4), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 4));
            topRow.addView(badge);

            TextView ts = new TextView(ctx);
            ts.setText(safe(rec.timestamp));
            ts.setTextSize(10.5f);
            ts.setTextColor(p.textMuted);
            ts.setGravity(Gravity.END);
            LinearLayout.LayoutParams tslp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            tslp.leftMargin = ThemeManager.dp(ctx, 8);
            topRow.addView(ts, tslp);

            TextView del = new TextView(ctx);
            del.setText("🗑");
            del.setTextSize(14);
            del.setGravity(Gravity.CENTER);
            del.setBackground(ThemeManager.roundRect(ctx, p.dangerBg, 999, 0, 0));
            LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 30), ThemeManager.dp(ctx, 30));
            dlp.leftMargin = ThemeManager.dp(ctx, 8);
            del.setOnClickListener(v -> {
                host.deleteHistoryItem(rec.id);
                host.notifyUser("হিসাবটি মুছে ফেলা হয়েছে।");
            });
            topRow.addView(del, dlp);
            card.addView(topRow);

            if (!safe(rec.subTypeLabel).isEmpty()) {
                TextView sub = new TextView(ctx);
                sub.setText(rec.subTypeLabel);
                sub.setTextSize(11.5f);
                sub.setTypeface(null, Typeface.BOLD);
                sub.setTextColor(p.textSecondary);
                card.addView(sub, BnUi.marginTop(ctx, 6));
            }

            // Summary block
            LinearLayout sumBox = new LinearLayout(ctx);
            sumBox.setOrientation(LinearLayout.VERTICAL);
            sumBox.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 14, p.borderCard, 1));
            sumBox.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9));

            TextView pSum = new TextView(ctx);
            pSum.setText(safe(rec.summaryPrimary));
            pSum.setTextSize(18);
            pSum.setTypeface(null, Typeface.BOLD);
            pSum.setTextColor(p.textBlueAccent);
            sumBox.addView(pSum);

            if (!safe(rec.summarySecondary).isEmpty()) {
                TextView sSum = new TextView(ctx);
                sSum.setText(rec.summarySecondary);
                sSum.setTextSize(12);
                sSum.setTypeface(null, Typeface.BOLD);
                sSum.setTextColor(p.textSecondary);
                sumBox.addView(sSum, BnUi.marginTop(ctx, 2));
            }
            card.addView(sumBox, BnUi.marginTop(ctx, 8));

            if (!safe(rec.inputsText).isEmpty()) {
                TextView inpTv = new TextView(ctx);
                inpTv.setText("মাপসমূহ: " + rec.inputsText);
                inpTv.setTextSize(11.5f);
                inpTv.setTextColor(p.textMuted);
                card.addView(inpTv, BnUi.marginTop(ctx, 7));
            }

            // Note / Inline Edit
            if (rec.id != null && rec.id.equals(editingId)) {
                LinearLayout editBox = new LinearLayout(ctx);
                editBox.setOrientation(LinearLayout.VERTICAL);
                EditText noteEt = BnUi.makeNoteInput(ctx, p, editingNoteDraft, "নোট বা বিবরণ লিখুন...");
                noteEt.addTextChangedListener(new TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                    @Override public void afterTextChanged(Editable s) { editingNoteDraft = s.toString(); }
                });
                editBox.addView(noteEt);

                LinearLayout btnRow = new LinearLayout(ctx);
                btnRow.setOrientation(LinearLayout.HORIZONTAL);
                Button saveBtn = BnUi.makePillButton(ctx, "সংরক্ষণ করুন", Color.parseColor("#123E6D"), Color.WHITE, 0, 36);
                saveBtn.setOnClickListener(v -> {
                    host.updateHistoryNote(rec.id, editingNoteDraft.trim());
                    editingId = null;
                    host.notifyUser("নোট সংরক্ষণ করা হয়েছে!");
                });
                Button cancelBtn = BnUi.makePillButton(ctx, "বাতিল", p.bgInput, p.textSecondary, 0, 36);
                cancelBtn.setOnClickListener(v -> {
                    editingId = null;
                    renderListOnly();
                });
                LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 36), 1f);
                slp.rightMargin = ThemeManager.dp(ctx, 6);
                btnRow.addView(saveBtn, slp);
                btnRow.addView(cancelBtn, new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 36), 1f));
                editBox.addView(btnRow, BnUi.marginTop(ctx, 6));
                card.addView(editBox, BnUi.marginTop(ctx, 8));
            } else {
                LinearLayout noteRow = new LinearLayout(ctx);
                noteRow.setOrientation(LinearLayout.HORIZONTAL);
                noteRow.setGravity(Gravity.CENTER_VERTICAL);
                TextView noteTv = new TextView(ctx);
                boolean hasN = !safe(rec.note).trim().isEmpty();
                noteTv.setText(hasN ? "📝 " + rec.note : "📝 নোট যোগ করুন...");
                noteTv.setTextSize(12);
                noteTv.setTypeface(null, hasN ? Typeface.BOLD : Typeface.NORMAL);
                noteTv.setTextColor(hasN ? p.textPrimary : p.textMuted);
                noteTv.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 12, 0, 0));
                noteTv.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 7), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 7));
                noteTv.setOnClickListener(v -> {
                    editingId = rec.id;
                    editingNoteDraft = safe(rec.note);
                    renderListOnly();
                });
                card.addView(noteTv, BnUi.marginTop(ctx, 8));
            }

            // Copy / Share / Print
            final String shareTxt = buildShareText(rec);
            card.addView(BnUi.makeActionRow3(ctx, p, () -> {
                NativeTools.copyToClipboard(ctx, shareTxt);
                host.notifyUser("হিসাব কপি করা হয়েছে!");
            }, () -> NativeTools.shareText(ctx, safe(rec.categoryLabel), shareTxt), () -> {
                PrintableReport r = new PrintableReport();
                r.title = safe(rec.categoryLabel);
                r.subtitle = safe(rec.subTypeLabel);
                r.dateTime = safe(rec.timestamp);
                r.note = safe(rec.note);
                r.inputsText = safe(rec.inputsText);
                r.summaryPrimary = safe(rec.summaryPrimary);
                r.summarySecondary = safe(rec.summarySecondary);
                r.details = rec.details;
                host.printReport(r);
            }), BnUi.marginTop(ctx, 10));

            LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            if (i > 0) clp.topMargin = ThemeManager.dp(ctx, 10);
            listContainer.addView(card, clp);
        }

        ThemeManager.applyFontRecursively(listContainer, ctx, host.getActiveFontId());
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private static String buildShareText(HistoryRecord rec) {
        StringBuilder sb = new StringBuilder();
        sb.append(safe(rec.categoryLabel));
        if (!safe(rec.subTypeLabel).isEmpty()) sb.append(" (").append(rec.subTypeLabel).append(")");
        sb.append("\n");
        if (!safe(rec.note).trim().isEmpty()) sb.append("নোট: ").append(rec.note.trim()).append("\n");
        sb.append("ফলাফল: ").append(safe(rec.summaryPrimary)).append("\n");
        if (!safe(rec.summarySecondary).isEmpty()) sb.append(rec.summarySecondary).append("\n");
        if (!safe(rec.inputsText).isEmpty()) sb.append("মাপ: ").append(rec.inputsText).append("\n");
        if (rec.details != null) {
            for (DetailItem d : rec.details) {
                sb.append("• ").append(d.label).append(": ").append(d.value).append("\n");
            }
        }
        return sb.toString();
    }
}
