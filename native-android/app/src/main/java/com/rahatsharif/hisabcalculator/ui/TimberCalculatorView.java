package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.data.AppStorage;
import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnFeetInchBox;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnSingleInput;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.Calculators;
import com.rahatsharif.hisabcalculator.util.Calculators.TimberItem;
import com.rahatsharif.hisabcalculator.util.Calculators.TimberSummary;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class TimberCalculatorView {
    private final AppHost host;
    private int activeTab = 0; // 0=round, 1=sawn
    private boolean showNote = false;
    private String note = "";
    private String rateInput = "";
    private String rGirthFt = "", rGirthIn = "", rLenFt = "", rLenIn = "", rQty = "";
    private String sWidthIn = "", sThickIn = "", sLenFt = "", sLenIn = "", sQty = "";
    private List<TimberItem> items;

    private LinearLayout root;
    private LinearLayout summaryContainer;

    public TimberCalculatorView(AppHost host) {
        this.host = host;
        this.items = AppStorage.loadTimberCart(host.getHostContext());
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

    private void persistCart() {
        AppStorage.saveTimberCart(host.getHostContext(), items);
    }

    private void render() {
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        root.removeAllViews();

        root.addView(BnUi.makeSubHeader(
            ctx, p, "গাছ ও কাঠের হিসাব", "গোল কাঠ ও চেরাই কাঠের সিএফটি ও দাম",
            !note.trim().isEmpty() || showNote,
            host::goBackHome,
            () -> { showNote = !showNote; render(); }
        ));

        if (showNote) {
            LinearLayout noteCard = BnUi.makeCard(ctx, p, 20, 10);
            EditText noteEt = BnUi.makeNoteInput(ctx, p, note, "ক্রেতার নাম বা কাঠের নোট লিখুন (যেমন: সেগুন কাঠ লট ১)...");
            noteEt.addTextChangedListener(new android.text.TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(android.text.Editable s) { note = s.toString(); }
            });
            noteCard.addView(noteEt);
            root.addView(noteCard, BnUi.marginTop(ctx, 10));
        }

        root.addView(BnUi.makeSegmentedBar(ctx, p, new String[]{"গোল কাঠ (গাছ)", "সাইজ কাঠ (চেরাই)"}, activeTab, idx -> {
            activeTab = idx;
            render();
        }), BnUi.marginTop(ctx, 10));

        if (activeTab == 0) renderRoundForm(ctx, p);
        else renderSawnForm(ctx, p);

        summaryContainer = new LinearLayout(ctx);
        summaryContainer.setOrientation(LinearLayout.VERTICAL);
        root.addView(summaryContainer);
        renderCartAndSummary(ctx, p);
        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private void renderRoundForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 10);

        TextView lbl = new TextView(ctx);
        lbl.setText("গাছের বেড় ও লম্বা (এক ঘরে ফুট ও ইঞ্চি)");
        lbl.setTextSize(12);
        lbl.setTypeface(null, Typeface.BOLD);
        lbl.setTextColor(p.textBlueAccent);
        lbl.setGravity(Gravity.CENTER);
        form.addView(lbl);

        LinearLayout dimRow = new LinearLayout(ctx);
        dimRow.setOrientation(LinearLayout.HORIZONTAL);
        BnFeetInchBox girthBox = new BnFeetInchBox(ctx, p, "গোল বেড় (মাঝখান)");
        girthBox.bind(rGirthFt, rGirthIn, v -> rGirthFt = v, v -> rGirthIn = v);
        BnFeetInchBox lenBox = new BnFeetInchBox(ctx, p, "গাছের লম্বা (দৈর্ঘ্য)");
        lenBox.bind(rLenFt, rLenIn, v -> rLenFt = v, v -> rLenIn = v);
        LinearLayout.LayoutParams gLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        gLp.rightMargin = ThemeManager.dp(ctx, 6);
        dimRow.addView(girthBox.box, gLp);
        dimRow.addView(lenBox.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(dimRow, BnUi.marginTop(ctx, 6));

        LinearLayout extraRow = new LinearLayout(ctx);
        extraRow.setOrientation(LinearLayout.HORIZONTAL);
        BnSingleInput qtyIn = new BnSingleInput(ctx, p, "গাছের সংখ্যা (পিস)", "টি", false);
        qtyIn.bind(rQty, v -> rQty = v);
        BnSingleInput rateIn = new BnSingleInput(ctx, p, "প্রতি সিএফটি দাম", "টাকা", false);
        rateIn.bind(rateInput, s -> {
            rateInput = s;
            double r = BnFormat.parseBnNum(rateInput);
            for (TimberItem it : items) {
                it.ratePerCft = r;
                it.totalPrice = it.totalCft * r;
            }
            persistCart();
            refreshSummaryOnly();
        });
        LinearLayout.LayoutParams qLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        qLp.rightMargin = ThemeManager.dp(ctx, 6);
        extraRow.addView(qtyIn.box, qLp);
        extraRow.addView(rateIn.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(extraRow, BnUi.marginTop(ctx, 8));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "তালিকায় যোগ করুন", () -> {
            rGirthFt = ""; rGirthIn = ""; rLenFt = ""; rLenIn = ""; rQty = "";
            girthBox.clear(); lenBox.clear(); qtyIn.setText("");
        }, () -> {
            double gF = girthBox.getFt(), gI = girthBox.getIn();
            double lF = lenBox.getFt(), lI = lenBox.getIn();
            int qty = Math.max(1, (int) Math.round(qtyIn.getValue() > 0 ? qtyIn.getValue() : 1));
            double rate = BnFormat.parseBnNum(rateInput);

            if ((gF == 0 && gI == 0) || (lF == 0 && lI == 0)) {
                host.notifyUser("দয়া করে গোল কাঠের বেড় এবং লম্বার মাপ দিন।");
                return;
            }
            TimberItem item = Calculators.calculateRoundLogItem(gF, gI, lF, lI, qty, "t_" + System.currentTimeMillis(), rate);
            items.add(item);
            persistCart();
            saveTimberHistory("গোল কাঠের তালিকা", rate);
            rGirthFt = ""; rGirthIn = ""; rLenFt = ""; rLenIn = ""; rQty = "";
            host.notifyUser("গোল কাঠ (" + BnFormat.toBnNum(item.totalCft, 2) + " সিএফটি) তালিকায় যোগ হয়েছে!");
            render();
        }), BnUi.marginTop(ctx, 12));

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void renderSawnForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 10);

        TextView lbl = new TextView(ctx);
        lbl.setText("সাইজ কাঠের চওড়া, পুরুত্ব ও লম্বা");
        lbl.setTextSize(12);
        lbl.setTypeface(null, Typeface.BOLD);
        lbl.setTextColor(p.textBlueAccent);
        lbl.setGravity(Gravity.CENTER);
        form.addView(lbl);

        LinearLayout wtRow = new LinearLayout(ctx);
        wtRow.setOrientation(LinearLayout.HORIZONTAL);
        BnSingleInput wIn = new BnSingleInput(ctx, p, "চওড়া (ইঞ্চি)", "ইঞ্চি", false);
        wIn.bind(sWidthIn, v -> sWidthIn = v);
        BnSingleInput tIn = new BnSingleInput(ctx, p, "পুরুত্ব (ইঞ্চি)", "ইঞ্চি", false);
        tIn.bind(sThickIn, v -> sThickIn = v);
        LinearLayout.LayoutParams wLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        wLp.rightMargin = ThemeManager.dp(ctx, 6);
        wtRow.addView(wIn.box, wLp);
        wtRow.addView(tIn.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(wtRow, BnUi.marginTop(ctx, 6));

        BnFeetInchBox lenBox = new BnFeetInchBox(ctx, p, "কাঠের লম্বা (ফুট ও ইঞ্চি)");
        lenBox.bind(sLenFt, sLenIn, v -> sLenFt = v, v -> sLenIn = v);
        form.addView(lenBox.box, BnUi.marginTop(ctx, 8));

        LinearLayout extraRow = new LinearLayout(ctx);
        extraRow.setOrientation(LinearLayout.HORIZONTAL);
        BnSingleInput qtyIn = new BnSingleInput(ctx, p, "কাঠের সংখ্যা (পিস)", "টি", false);
        qtyIn.bind(sQty, v -> sQty = v);
        BnSingleInput rateIn = new BnSingleInput(ctx, p, "প্রতি সিএফটি দাম", "টাকা", false);
        rateIn.bind(rateInput, s -> {
            rateInput = s;
            double r = BnFormat.parseBnNum(rateInput);
            for (TimberItem it : items) {
                it.ratePerCft = r;
                it.totalPrice = it.totalCft * r;
            }
            persistCart();
            refreshSummaryOnly();
        });
        LinearLayout.LayoutParams qLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        qLp.rightMargin = ThemeManager.dp(ctx, 6);
        extraRow.addView(qtyIn.box, qLp);
        extraRow.addView(rateIn.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(extraRow, BnUi.marginTop(ctx, 8));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "তালিকায় যোগ করুন", () -> {
            sWidthIn = ""; sThickIn = ""; sLenFt = ""; sLenIn = ""; sQty = "";
            wIn.setText(""); tIn.setText(""); lenBox.clear(); qtyIn.setText("");
        }, () -> {
            double w = wIn.getValue(), t = tIn.getValue();
            double lF = lenBox.getFt(), lI = lenBox.getIn();
            int qty = Math.max(1, (int) Math.round(qtyIn.getValue() > 0 ? qtyIn.getValue() : 1));
            double rate = BnFormat.parseBnNum(rateInput);

            if (w <= 0 || t <= 0 || (lF == 0 && lI == 0)) {
                host.notifyUser("দয়া করে সাইজ কাঠের চওড়া, পুরুত্ব এবং লম্বার মাপ দিন।");
                return;
            }
            TimberItem item = Calculators.calculateSawnTimberItem(w, t, lF, lI, qty, "t_" + System.currentTimeMillis(), rate);
            items.add(item);
            persistCart();
            saveTimberHistory("সাইজ কাঠের তালিকা", rate);
            sWidthIn = ""; sThickIn = ""; sLenFt = ""; sLenIn = ""; sQty = "";
            host.notifyUser("সাইজ কাঠ (" + BnFormat.toBnNum(item.totalCft, 2) + " সিএফটি) তালিকায় যোগ হয়েছে!");
            render();
        }), BnUi.marginTop(ctx, 12));

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void refreshSummaryOnly() {
        if (summaryContainer == null) return;
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        summaryContainer.removeAllViews();
        renderCartAndSummary(ctx, p);
        ThemeManager.applyFontRecursively(summaryContainer, ctx, host.getActiveFontId());
    }

    private void saveTimberHistory(String subTitle, double currentRate) {
        if (items.isEmpty()) return;
        TimberSummary sum = Calculators.summarizeTimberCart(items);
        double effPrice = sum.totalPrice > 0 ? sum.totalPrice : sum.totalCft * currentRate;

        HistoryRecord hr = new HistoryRecord();
        hr.category = "timber";
        hr.categoryLabel = "গাছ ও কাঠের হিসাব";
        hr.subTypeLabel = subTitle;
        hr.note = note.trim();
        hr.summaryPrimary = BnFormat.toBnNum(sum.totalCft, 2) + " সিএফটি";
        hr.summarySecondary = effPrice > 0
            ? "মোট মূল্য: " + BnFormat.formatBnCurrency(effPrice) + " (" + BnFormat.toBnNum(sum.totalPieces) + " পিস)"
            : "মোট " + BnFormat.toBnNum(items.size()) + "টি এন্ট্রি (" + BnFormat.toBnNum(sum.totalPieces) + " পিস কাঠ)";

        StringBuilder inp = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            TimberItem it = items.get(i);
            double ip = it.totalPrice > 0 ? it.totalPrice : it.totalCft * currentRate;
            hr.details.add(new DetailItem(
                BnFormat.toBnNum(i + 1) + ". " + ("round".equals(it.type) ? "গোল কাঠ" : "সাইজ কাঠ")
                    + " (" + it.description + ") × " + BnFormat.toBnNum(it.quantity) + "টি",
                BnFormat.toBnNum(it.totalCft, 2) + " সিএফটি" + (ip > 0 ? " (" + BnFormat.formatBnCurrency(ip) + ")" : "")
            ));
            if (i > 0) inp.append(" | ");
            inp.append(BnFormat.toBnNum(i + 1)).append(") ").append(it.description).append(" × ")
                .append(BnFormat.toBnNum(it.quantity)).append("টি = ").append(BnFormat.toBnNum(it.totalCft, 2)).append(" সিএফটি");
        }
        hr.details.add(new DetailItem("সর্বমোট কাঠের পরিমাপ", BnFormat.toBnNum(sum.totalCft, 2) + " সিএফটি (মোট " + BnFormat.toBnNum(sum.totalPieces) + " পিস)"));
        if (effPrice > 0) hr.details.add(new DetailItem("সর্বমোট কাঠের মূল্য", BnFormat.formatBnCurrency(effPrice)));
        hr.inputsText = inp.toString();
        host.saveHistory(hr);
    }

    private void renderCartAndSummary(Context ctx, Palette p) {
        LinearLayout card = BnUi.makeCard(ctx, p, 24, 14);
        double currentRate = BnFormat.parseBnNum(rateInput);
        TimberSummary sum = Calculators.summarizeTimberCart(items);
        double effPrice = sum.totalPrice > 0 ? sum.totalPrice : sum.totalCft * currentRate;

        // ১. উপরে: সর্বশেষ যুক্ত করা গাছ/কাঠের মাপ
        if (!items.isEmpty()) {
            TimberItem last = items.get(items.size() - 1);
            double lastPrice = last.totalPrice > 0 ? last.totalPrice : last.totalCft * currentRate;

            LinearLayout lastBox = new LinearLayout(ctx);
            lastBox.setOrientation(LinearLayout.VERTICAL);
            lastBox.setBackground(ThemeManager.roundRect(ctx, p.softBlueBg, 18, p.textBlueAccent, 1));
            lastBox.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12));

            TextView badge = new TextView(ctx);
            badge.setText("✨ সর্বশেষ যুক্ত মাপ (নং #" + BnFormat.toBnNum(items.size()) + ") • "
                + ("round".equals(last.type) ? "গোল কাঠ" : "সাইজ কাঠ") + " • " + BnFormat.toBnNum(last.quantity) + " পিস");
            badge.setTextSize(11);
            badge.setTypeface(null, Typeface.BOLD);
            badge.setTextColor(p.softBlueText);
            lastBox.addView(badge);

            LinearLayout row = new LinearLayout(ctx);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            TextView desc = new TextView(ctx);
            desc.setText(last.description);
            desc.setTextSize(14);
            desc.setTypeface(null, Typeface.BOLD);
            desc.setTextColor(p.textPrimary);
            row.addView(desc, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            LinearLayout right = new LinearLayout(ctx);
            right.setOrientation(LinearLayout.VERTICAL);
            right.setGravity(Gravity.END);
            TextView cftTv = new TextView(ctx);
            cftTv.setText(BnFormat.toBnNum(last.totalCft, 2) + " সিএফটি");
            cftTv.setTextSize(20);
            cftTv.setTypeface(null, Typeface.BOLD);
            cftTv.setTextColor(p.textBlueAccent);
            right.addView(cftTv);
            if (lastPrice > 0) {
                TextView pTv = new TextView(ctx);
                pTv.setText("মূল্য: " + BnFormat.formatBnCurrency(lastPrice));
                pTv.setTextSize(11.5f);
                pTv.setTypeface(null, Typeface.BOLD);
                pTv.setTextColor(p.emeraldText);
                right.addView(pTv);
            }
            row.addView(right);
            lastBox.addView(row, BnUi.marginTop(ctx, 6));
            card.addView(lastBox);
        } else {
            LinearLayout empty = new LinearLayout(ctx);
            empty.setOrientation(LinearLayout.VERTICAL);
            empty.setGravity(Gravity.CENTER);
            empty.setBackground(ThemeManager.dashedRoundRect(ctx, p.bgSecondary, 18, p.borderInput));
            empty.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 14));
            TextView t1 = new TextView(ctx);
            t1.setText("সর্বশেষ দেওয়া গাছ বা কাঠের মাপ এখানে দেখাবে");
            t1.setTextSize(12);
            t1.setTypeface(null, Typeface.BOLD);
            t1.setTextColor(p.textSecondary);
            t1.setGravity(Gravity.CENTER);
            empty.addView(t1);
            TextView t2 = new TextView(ctx);
            t2.setText("উপরে মাপ ও সিএফটি দাম দিয়ে \"তালিকায় যোগ করুন\" বাটনে চাপুন।");
            t2.setTextSize(11);
            t2.setTextColor(p.textMuted);
            t2.setGravity(Gravity.CENTER);
            empty.addView(t2, BnUi.marginTop(ctx, 3));
            card.addView(empty);
        }

        // ২. মাঝে: প্রত্যেকটি কাঠের হিসাব ক্রমানুসারে নিচে উঠবে
        if (!items.isEmpty()) {
            TextView listHdr = new TextView(ctx);
            listHdr.setText("প্রত্যেকটি কাঠের হিসাব তালিকা (" + BnFormat.toBnNum(items.size()) + "টি মাপ)");
            listHdr.setTextSize(12);
            listHdr.setTypeface(null, Typeface.BOLD);
            listHdr.setTextColor(p.textSecondary);
            card.addView(listHdr, BnUi.marginTop(ctx, 12));

            LinearLayout tableBox = new LinearLayout(ctx);
            tableBox.setOrientation(LinearLayout.VERTICAL);
            tableBox.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 16, p.borderCard, 1));
            tableBox.setPadding(ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 6), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 6));

            for (int i = 0; i < items.size(); i++) {
                final TimberItem item = items.get(i);
                double ip = item.totalPrice > 0 ? item.totalPrice : item.totalCft * currentRate;

                LinearLayout row = new LinearLayout(ctx);
                row.setOrientation(LinearLayout.HORIZONTAL);
                row.setGravity(Gravity.CENTER_VERTICAL);
                row.setPadding(ThemeManager.dp(ctx, 4), ThemeManager.dp(ctx, 7), ThemeManager.dp(ctx, 4), ThemeManager.dp(ctx, 7));

                TextView idxTv = new TextView(ctx);
                idxTv.setText(BnFormat.toBnNum(i + 1) + ". ");
                idxTv.setTextSize(12);
                idxTv.setTypeface(null, Typeface.BOLD);
                idxTv.setTextColor(p.textMuted);
                row.addView(idxTv);

                LinearLayout mid = new LinearLayout(ctx);
                mid.setOrientation(LinearLayout.VERTICAL);
                TextView dTv = new TextView(ctx);
                dTv.setText(("round".equals(item.type) ? "[গোল] " : "[সাইজ] ") + item.description + " × " + BnFormat.toBnNum(item.quantity) + "টি");
                dTv.setTextSize(12);
                dTv.setTypeface(null, Typeface.BOLD);
                dTv.setTextColor(p.textPrimary);
                mid.addView(dTv);
                row.addView(mid, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

                TextView valTv = new TextView(ctx);
                valTv.setText(BnFormat.toBnNum(item.totalCft, 2) + " সিএফটি" + (ip > 0 ? "\n" + BnFormat.formatBnCurrency(ip) : ""));
                valTv.setTextSize(12);
                valTv.setTypeface(null, Typeface.BOLD);
                valTv.setTextColor(p.textBlueAccent);
                valTv.setGravity(Gravity.END);
                row.addView(valTv);

                TextView delBtn = new TextView(ctx);
                delBtn.setText("✕");
                delBtn.setTextSize(14);
                delBtn.setTypeface(null, Typeface.BOLD);
                delBtn.setTextColor(p.dangerText);
                delBtn.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 28), ThemeManager.dp(ctx, 28));
                dlp.leftMargin = ThemeManager.dp(ctx, 6);
                delBtn.setOnClickListener(v -> {
                    items.remove(item);
                    persistCart();
                    render();
                });
                row.addView(delBtn, dlp);

                tableBox.addView(row);
            }
            card.addView(tableBox, BnUi.marginTop(ctx, 6));
        }

        // ৩. একদম নিচে: সর্বমোট কাঠের পরিমাপ ও মূল্য
        LinearLayout totalBox = BnUi.makePrimaryGradientBox(ctx);
        LinearLayout topRow = new LinearLayout(ctx);
        topRow.setOrientation(LinearLayout.HORIZONTAL);
        topRow.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout leftCol = new LinearLayout(ctx);
        leftCol.setOrientation(LinearLayout.VERTICAL);
        TextView tLbl = new TextView(ctx);
        tLbl.setText("সর্বমোট কাঠের পরিমাপ (CFT)");
        tLbl.setTextSize(12);
        tLbl.setTextColor(Color.parseColor("#BAE6FD"));
        leftCol.addView(tLbl);

        TextView tVal = new TextView(ctx);
        tVal.setText(BnFormat.toBnNum(sum.totalCft, 2) + " সিএফটি");
        tVal.setTextSize(26);
        tVal.setTypeface(null, Typeface.BOLD);
        tVal.setTextColor(Color.WHITE);
        leftCol.addView(tVal);
        topRow.addView(leftCol, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView pcsBadge = new TextView(ctx);
        pcsBadge.setText("মোট " + BnFormat.toBnNum(sum.totalPieces) + " পিস\n" + BnFormat.toBnNum(items.size()) + "টি মাপ");
        pcsBadge.setTextSize(11.5f);
        pcsBadge.setTypeface(null, Typeface.BOLD);
        pcsBadge.setTextColor(Color.WHITE);
        pcsBadge.setGravity(Gravity.END);
        pcsBadge.setBackground(ThemeManager.roundRect(ctx, Color.parseColor("#26FFFFFF"), 12, 0, 0));
        pcsBadge.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 6), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 6));
        topRow.addView(pcsBadge);
        totalBox.addView(topRow);

        LinearLayout pRow = new LinearLayout(ctx);
        pRow.setOrientation(LinearLayout.HORIZONTAL);
        TextView pLbl = new TextView(ctx);
        pLbl.setText("সর্বমোট কাঠের মূল্য:");
        pLbl.setTextSize(12);
        pLbl.setTextColor(Color.parseColor("#E0F2FE"));
        pRow.addView(pLbl, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        TextView pVal = new TextView(ctx);
        pVal.setText(BnFormat.formatBnCurrency(effPrice));
        pVal.setTextSize(18);
        pVal.setTypeface(null, Typeface.BOLD);
        pVal.setTextColor(Color.parseColor("#FCD34D"));
        pRow.addView(pVal);
        totalBox.addView(pRow, BnUi.marginTop(ctx, 10));
        card.addView(totalBox, BnUi.marginTop(ctx, 12));

        if (!items.isEmpty()) {
            final String shareTxt = buildShareListText(sum, effPrice, currentRate);
            LinearLayout actRow = new LinearLayout(ctx);
            actRow.setOrientation(LinearLayout.HORIZONTAL);

            Button bCopy = BnUi.makePillButton(ctx, "কপি", p.bgInput, p.textSecondary, 0, 40);
            bCopy.setOnClickListener(v -> {
                NativeTools.copyToClipboard(ctx, shareTxt);
                host.notifyUser("কাঠের তালিকা কপি করা হয়েছে!");
            });
            Button bShare = BnUi.makePillButton(ctx, "শেয়ার", p.bgInput, p.textSecondary, 0, 40);
            bShare.setOnClickListener(v -> NativeTools.shareText(ctx, "গাছ ও কাঠের হিসাব", shareTxt));
            Button bPrint = BnUi.makePillButton(ctx, "প্রিন্ট", Color.parseColor("#123E6D"), Color.WHITE, 0, 40);
            bPrint.setOnClickListener(v -> {
                PrintableReport r = new PrintableReport();
                r.title = "গাছ ও কাঠের হিসাব তালিকা";
                r.subtitle = "মোট " + BnFormat.toBnNum(items.size()) + "টি মাপ (" + BnFormat.toBnNum(sum.totalPieces) + " পিস কাঠ)";
                r.note = note.trim();
                r.inputsText = "গোল কাঠ: " + BnFormat.toBnNum(sum.roundCft, 2) + " সিএফটি | সাইজ কাঠ: "
                    + BnFormat.toBnNum(sum.sawnCft, 2) + " সিএফটি | দর: " + BnFormat.toBnNumTrim(currentRate) + " টাকা/সিএফটি";
                r.summaryPrimary = "সর্বমোট: " + BnFormat.toBnNum(sum.totalCft, 2) + " সিএফটি (CFT)";
                r.summarySecondary = "সর্বমোট মূল্য: " + BnFormat.formatBnCurrency(effPrice);
                r.details = new ArrayList<>();
                for (int i = 0; i < items.size(); i++) {
                    TimberItem it = items.get(i);
                    double ip = it.totalPrice > 0 ? it.totalPrice : it.totalCft * currentRate;
                    r.details.add(new DetailItem(
                        BnFormat.toBnNum(i + 1) + ". " + ("round".equals(it.type) ? "গোল কাঠ" : "সাইজ কাঠ")
                            + " (" + it.description + ") × " + BnFormat.toBnNum(it.quantity) + "টি",
                        BnFormat.toBnNum(it.totalCft, 2) + " সিএফটি (" + BnFormat.formatBnCurrency(ip) + ")"
                    ));
                }
                host.printReport(r);
            });
            Button bClear = BnUi.makePillButton(ctx, "মুছুন", p.dangerBg, p.dangerText, 0, 40);
            bClear.setOnClickListener(v -> {
                items.clear();
                persistCart();
                host.notifyUser("কাঠের সম্পূর্ণ তালিকা মুছে ফেলা হয়েছে।");
                render();
            });

            Button[] btns = {bCopy, bShare, bPrint, bClear};
            for (int i = 0; i < btns.length; i++) {
                LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 40), 1f);
                if (i < btns.length - 1) blp.rightMargin = ThemeManager.dp(ctx, 5);
                actRow.addView(btns[i], blp);
            }
            card.addView(actRow, BnUi.marginTop(ctx, 10));
        }

        summaryContainer.addView(card, BnUi.marginTop(ctx, 12));
    }

    private String buildShareListText(TimberSummary sum, double effPrice, double rate) {
        StringBuilder sb = new StringBuilder("🪵 গাছ ও কাঠের হিসাব তালিকা\n");
        if (!note.trim().isEmpty()) sb.append("নোট: ").append(note.trim()).append("\n");
        sb.append("----------------------------\n");
        for (int i = 0; i < items.size(); i++) {
            TimberItem it = items.get(i);
            double ip = it.totalPrice > 0 ? it.totalPrice : it.totalCft * rate;
            sb.append(BnFormat.toBnNum(i + 1)).append(". ")
                .append("round".equals(it.type) ? "গোল" : "সাইজ").append(" | ")
                .append(it.description).append(" | ")
                .append(BnFormat.toBnNum(it.quantity)).append("টি = ")
                .append(BnFormat.toBnNum(it.totalCft, 2)).append(" সিএফটি");
            if (ip > 0) sb.append(" (").append(BnFormat.formatBnCurrency(ip)).append(")");
            sb.append("\n");
        }
        sb.append("----------------------------\n");
        sb.append("সর্বমোট কাঠ: ").append(BnFormat.toBnNum(sum.totalPieces)).append(" পিস\n");
        sb.append("সর্বমোট কাঠের পরিমাপ (CFT): ").append(BnFormat.toBnNum(sum.totalCft, 2)).append(" ঘনফুট\n");
        if (rate > 0) sb.append("প্রতি সিএফটি দর: ").append(BnFormat.toBnNum(rate, 2)).append(" টাকা\n");
        sb.append("সর্বমোট মূল্য: ").append(BnFormat.formatBnCurrency(effPrice));
        return sb.toString();
    }
}
