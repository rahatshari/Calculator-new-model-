package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnFeetInchBox;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnSingleInput;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.Calculators;
import com.rahatsharif.hisabcalculator.util.Calculators.DimReading;
import com.rahatsharif.hisabcalculator.util.Calculators.SoilResult;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class SoilCalculatorView {
    private static class PairState {
        String ft = "";
        String in = "";
    }

    private final AppHost host;
    private boolean showNote = false;
    private String note = "";
    private boolean isPer1000 = true;
    private String rateStr = "";

    private final List<PairState> lengths = createInitial();
    private final List<PairState> widths = createInitial();
    private final List<PairState> depths = createInitial();
    private SoilResult result;

    private LinearLayout root;

    public SoilCalculatorView(AppHost host) {
        this.host = host;
    }

    private static List<PairState> createInitial() {
        List<PairState> l = new ArrayList<>();
        l.add(new PairState());
        l.add(new PairState());
        return l;
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
            ctx, p, "মাটির হিসাব", "গর্ত বা পুকুরের মাটি ও খরচের হিসাব",
            !note.trim().isEmpty() || showNote,
            host::goBackHome,
            () -> { showNote = !showNote; render(); }
        ));

        if (showNote) {
            LinearLayout noteCard = BnUi.makeCard(ctx, p, 20, 10);
            EditText noteEt = BnUi.makeNoteInput(ctx, p, note, "হিসাবের নাম বা নোট লিখুন (যেমন: নতুন পুকুর খনন)...");
            noteEt.addTextChangedListener(new android.text.TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(android.text.Editable s) { note = s.toString(); }
            });
            noteCard.addView(noteEt);
            root.addView(noteCard, BnUi.marginTop(ctx, 10));
        }

        LinearLayout form = BnUi.makeCard(ctx, p, 22, 8);
        form.addView(buildDimensionSection(ctx, p, "দৈর্ঘ্য (ফুট ও ইঞ্চি)", lengths));
        form.addView(buildDimensionSection(ctx, p, "প্রস্থ (ফুট ও ইঞ্চি)", widths), BnUi.marginTop(ctx, 10));
        form.addView(buildDimensionSection(ctx, p, "উচ্চতা বা গভীরতা (ফুট ও ইঞ্চি)", depths), BnUi.marginTop(ctx, 10));

        TextView rateHdr = new TextView(ctx);
        rateHdr.setText("মাটি কাটার দর নির্ধারণ (টাকা)");
        rateHdr.setTextSize(12);
        rateHdr.setTypeface(null, Typeface.BOLD);
        rateHdr.setTextColor(p.textBlueAccent);
        form.addView(rateHdr, BnUi.marginTop(ctx, 12));

        form.addView(BnUi.makeSegmentedBar(ctx, p, new String[]{"১০০০ ফুট মাটির দাম", "প্রতি ফুট মাটির দাম"}, isPer1000 ? 0 : 1, idx -> {
            isPer1000 = (idx == 0);
            render();
        }), BnUi.marginTop(ctx, 6));

        BnSingleInput rateIn = new BnSingleInput(
            ctx, p,
            isPer1000 ? "প্রতি ১০০০ ঘনফুট মাটির দাম (টাকা)" : "প্রতি ১ ঘনফুট মাটির দাম (টাকা)",
            "টাকা", false
        );
        rateIn.setText(rateStr);
        rateIn.editText.addTextChangedListener(new android.text.TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(android.text.Editable s) { rateStr = s.toString(); }
        });
        form.addView(rateIn.box, BnUi.marginTop(ctx, 8));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "মাটির হিসাব করুন", () -> {
            lengths.clear(); lengths.addAll(createInitial());
            widths.clear(); widths.addAll(createInitial());
            depths.clear(); depths.addAll(createInitial());
            rateStr = "";
            result = null;
            render();
        }, () -> {
            List<DimReading> lR = toReadings(lengths);
            List<DimReading> wR = toReadings(widths);
            List<DimReading> dR = toReadings(depths);
            double rate = BnFormat.parseBnNum(rateStr);
            SoilResult res = Calculators.calculateSoil(lR, wR, dR, isPer1000, rate);
            if (res.volumeCft <= 0) {
                host.notifyUser("দয়া করে দৈর্ঘ্য, প্রস্থ এবং উচ্চতা/গভীরতার অন্তত ১টি করে মাপ দিন।");
                return;
            }
            result = res;

            String rateLabel = isPer1000
                ? BnFormat.toBnNum(rate, 2) + " টাকা (প্রতি ১০০০ সিএফটি)"
                : BnFormat.toBnNum(rate, 2) + " টাকা (প্রতি ১ সিএফটি)";
            String inputsText = "গড় দৈর্ঘ্য: " + BnFormat.toBnNum(res.avgLengthFt, 2) + " ফুট, গড় প্রস্থ: "
                + BnFormat.toBnNum(res.avgWidthFt, 2) + " ফুট, গড় উচ্চতা/গভীরতা: " + BnFormat.toBnNum(res.avgDepthFt, 2) + " ফুট | দর: " + rateLabel;

            HistoryRecord hr = new HistoryRecord();
            hr.category = "soil";
            hr.categoryLabel = "মাটির হিসাব";
            hr.subTypeLabel = "পুকুর বা গর্তের মাটি পরিমাপ";
            hr.note = note.trim();
            hr.summaryPrimary = BnFormat.toBnNum(res.volumeCft, 2) + " ঘনফুট";
            hr.summarySecondary = "মোট খরচ: " + BnFormat.formatBnCurrency(res.totalCost);
            hr.inputsText = inputsText;
            hr.details.add(new DetailItem("গড় দৈর্ঘ্য", BnFormat.toBnNum(res.avgLengthFt, 2) + " ফুট"));
            hr.details.add(new DetailItem("গড় প্রস্থ", BnFormat.toBnNum(res.avgWidthFt, 2) + " ফুট"));
            hr.details.add(new DetailItem("গড় উচ্চতা / গভীরতা", BnFormat.toBnNum(res.avgDepthFt, 2) + " ফুট"));
            hr.details.add(new DetailItem("মোট মাটির পরিমাণ (CFT)", BnFormat.toBnNum(res.volumeCft, 2) + " ঘনফুট"));
            hr.details.add(new DetailItem("মোট মাটির পরিমাণ (ঘনমিটার)", BnFormat.toBnNum(res.volumeCubicMeter, 2) + " ঘনমিটার"));
            hr.details.add(new DetailItem("হিসাবের দর", rateLabel));
            hr.details.add(new DetailItem("মোট মাটির মূল্য", BnFormat.formatBnCurrency(res.totalCost)));
            host.saveHistory(hr);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (result != null) {
            form.addView(buildSoilResultCard(ctx, p, result), BnUi.marginTop(ctx, 14));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private List<DimReading> toReadings(List<PairState> pairs) {
        List<DimReading> out = new ArrayList<>();
        for (PairState ps : pairs) {
            out.add(new DimReading(BnFormat.parseBnNum(ps.ft), BnFormat.parseBnNum(ps.in)));
        }
        return out;
    }

    private View buildDimensionSection(Context ctx, Palette p, String title, List<PairState> items) {
        LinearLayout sec = new LinearLayout(ctx);
        sec.setOrientation(LinearLayout.VERTICAL);
        sec.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 18, p.borderCard, 1));
        sec.setPadding(ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8));

        String nextFirst = BnFormat.toBnNum(items.size() + 1);
        String nextSecond = BnFormat.toBnNum(items.size() + 2);

        LinearLayout header = new LinearLayout(ctx);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvTitle = new TextView(ctx);
        tvTitle.setText(title);
        tvTitle.setTextSize(12);
        tvTitle.setTypeface(null, Typeface.BOLD);
        tvTitle.setTextColor(p.textBlueAccent);
        header.addView(tvTitle, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        if (items.size() > 2) {
            TextView minusBtn = new TextView(ctx);
            minusBtn.setText("− ২টি কমান");
            minusBtn.setTextSize(11);
            minusBtn.setTypeface(null, Typeface.BOLD);
            minusBtn.setTextColor(p.textSecondary);
            minusBtn.setBackground(ThemeManager.roundRect(ctx, p.segmentBg, 999, 0, 0));
            minusBtn.setPadding(ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 5), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 5));
            LinearLayout.LayoutParams mlp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            mlp.rightMargin = ThemeManager.dp(ctx, 5);
            minusBtn.setOnClickListener(v -> {
                if (items.size() > 2) {
                    items.remove(items.size() - 1);
                    items.remove(items.size() - 1);
                    render();
                }
            });
            header.addView(minusBtn, mlp);
        }

        TextView addBtn = new TextView(ctx);
        addBtn.setText("+ মাপ " + nextFirst + " ও " + nextSecond);
        addBtn.setTextSize(11);
        addBtn.setTypeface(null, Typeface.BOLD);
        addBtn.setTextColor(p.softBlueText);
        addBtn.setBackground(ThemeManager.roundRect(ctx, p.softBlueBg, 999, 0, 0));
        addBtn.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5));
        addBtn.setOnClickListener(v -> {
            items.add(new PairState());
            items.add(new PairState());
            render();
        });
        header.addView(addBtn);
        sec.addView(header);

        for (int i = 0; i < items.size(); i += 2) {
            LinearLayout row = new LinearLayout(ctx);
            row.setOrientation(LinearLayout.HORIZONTAL);
            for (int col = 0; col < 2 && (i + col) < items.size(); col++) {
                final PairState st = items.get(i + col);
                String numBn = BnFormat.toBnNum(i + col + 1);
                BnFeetInchBox box = new BnFeetInchBox(ctx, p, "মাপ " + numBn);
                box.ftEdit.setText(st.ft);
                box.inEdit.setText(st.in);
                box.ftEdit.addTextChangedListener(new android.text.TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                    @Override public void afterTextChanged(android.text.Editable s) { st.ft = s.toString(); }
                });
                box.inEdit.addTextChangedListener(new android.text.TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                    @Override public void afterTextChanged(android.text.Editable s) { st.in = s.toString(); }
                });
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
                if (col == 0) lp.rightMargin = ThemeManager.dp(ctx, 6);
                row.addView(box.box, lp);
            }
            sec.addView(row, BnUi.marginTop(ctx, 7));
        }

        TextView bottomPlus = new TextView(ctx);
        bottomPlus.setText("+ আরও ২টি মাপ যোগ করুন (মাপ " + nextFirst + " ও " + nextSecond + ")");
        bottomPlus.setTextSize(12);
        bottomPlus.setTypeface(null, Typeface.BOLD);
        bottomPlus.setTextColor(p.textBlueAccent);
        bottomPlus.setGravity(Gravity.CENTER);
        bottomPlus.setBackground(ThemeManager.dashedRoundRect(ctx, p.softBlueBg, 12, p.textBlueAccent));
        bottomPlus.setPadding(ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 8));
        bottomPlus.setOnClickListener(v -> {
            items.add(new PairState());
            items.add(new PairState());
            render();
        });
        sec.addView(bottomPlus, BnUi.marginTop(ctx, 8));

        return sec;
    }

    private View buildSoilResultCard(Context ctx, Palette p, SoilResult res) {
        LinearLayout wrap = new LinearLayout(ctx);
        wrap.setOrientation(LinearLayout.VERTICAL);
        wrap.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 22, p.borderCard, 1));
        wrap.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12));

        LinearLayout hero = BnUi.makePrimaryGradientBox(ctx);
        TextView top = new TextView(ctx);
        top.setText("মোট মাটির পরিমাণ (CFT)  •  " + BnFormat.toBnNum(res.volumeCubicMeter, 2) + " ঘনমিটার");
        top.setTextSize(11);
        top.setTextColor(Color.parseColor("#BAE6FD"));
        hero.addView(top);

        TextView big = new TextView(ctx);
        big.setText(BnFormat.toBnNum(res.volumeCft, 2) + " ঘনফুট");
        big.setTextSize(28);
        big.setTypeface(null, Typeface.BOLD);
        big.setTextColor(Color.WHITE);
        hero.addView(big, BnUi.marginTop(ctx, 2));

        LinearLayout priceRow = new LinearLayout(ctx);
        priceRow.setOrientation(LinearLayout.HORIZONTAL);
        priceRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView pLbl = new TextView(ctx);
        pLbl.setText("মোট মাটির মূল্য:");
        pLbl.setTextSize(12);
        pLbl.setTextColor(Color.parseColor("#E0F2FE"));
        priceRow.addView(pLbl, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        TextView pVal = new TextView(ctx);
        pVal.setText(BnFormat.formatBnCurrency(res.totalCost));
        pVal.setTextSize(18);
        pVal.setTypeface(null, Typeface.BOLD);
        pVal.setTextColor(Color.parseColor("#FCD34D"));
        priceRow.addView(pVal);
        hero.addView(priceRow, BnUi.marginTop(ctx, 8));
        wrap.addView(hero);

        LinearLayout avgRow = new LinearLayout(ctx);
        avgRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams a1 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        a1.rightMargin = ThemeManager.dp(ctx, 5);
        avgRow.addView(BnUi.makeGridMetricTile(ctx, p, "গড় দৈর্ঘ্য", BnFormat.toBnNum(res.avgLengthFt, 2) + "'"), a1);
        LinearLayout.LayoutParams a2 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        a2.rightMargin = ThemeManager.dp(ctx, 5);
        avgRow.addView(BnUi.makeGridMetricTile(ctx, p, "গড় প্রস্থ", BnFormat.toBnNum(res.avgWidthFt, 2) + "'"), a2);
        avgRow.addView(BnUi.makeGridMetricTile(ctx, p, "গড় উচ্চতা", BnFormat.toBnNum(res.avgDepthFt, 2) + "'"),
            new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        wrap.addView(avgRow, BnUi.marginTop(ctx, 8));

        String shareTxt = "মাটির হিসাব\nমোট মাটি: " + BnFormat.toBnNum(res.volumeCft, 2)
            + " ঘনফুট (সিএফটি)\nমোট মূল্য: " + BnFormat.formatBnCurrency(res.totalCost);

        wrap.addView(BnUi.makeActionRow3(ctx, p, () -> {
            NativeTools.copyToClipboard(ctx, shareTxt);
            host.notifyUser("ফলাফল কপি করা হয়েছে!");
        }, () -> NativeTools.shareText(ctx, "মাটির হিসাব", shareTxt), () -> {
            PrintableReport r = new PrintableReport();
            r.title = "মাটির হিসাব";
            r.subtitle = "পুকুর বা গর্তের মাটি পরিমাপ";
            r.note = note.trim();
            r.inputsText = "গড় দৈর্ঘ্য: " + BnFormat.toBnNum(res.avgLengthFt, 2) + " ফুট, গড় প্রস্থ: "
                + BnFormat.toBnNum(res.avgWidthFt, 2) + " ফুট, গড় উচ্চতা: " + BnFormat.toBnNum(res.avgDepthFt, 2) + " ফুট";
            r.summaryPrimary = BnFormat.toBnNum(res.volumeCft, 2) + " ঘনফুট (CFT)";
            r.summarySecondary = "মোট খরচ: " + BnFormat.formatBnCurrency(res.totalCost);
            r.details = new ArrayList<>();
            r.details.add(new DetailItem("মোট ঘনফুট (CFT)", BnFormat.toBnNum(res.volumeCft, 2) + " ঘনফুট"));
            r.details.add(new DetailItem("মোট ঘনমিটার", BnFormat.toBnNum(res.volumeCubicMeter, 2) + " ঘনমিটার"));
            r.details.add(new DetailItem("মোট মূল্য", BnFormat.formatBnCurrency(res.totalCost)));
            host.printReport(r);
        }), BnUi.marginTop(ctx, 10));

        return wrap;
    }
}
