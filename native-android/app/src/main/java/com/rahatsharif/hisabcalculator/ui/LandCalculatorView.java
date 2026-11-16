package com.rahatsharif.hisabcalculator.ui;

import android.app.AlertDialog;
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
import com.rahatsharif.hisabcalculator.util.Calculators.HeronResult;
import com.rahatsharif.hisabcalculator.util.Calculators.LandResult;
import com.rahatsharif.hisabcalculator.util.Calculators.LandUnitType;
import com.rahatsharif.hisabcalculator.util.Calculators.ReverseLandResult;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class LandCalculatorView {
    private final AppHost host;
    private int activeTab = 0; // 0=quad, 1=heron, 2=reverse
    private boolean showNote = false;
    private String note = "";
    private LandUnitType targetUnit = LandUnitType.decimal;

    private String qL1F = "", qL1I = "", qL2F = "", qL2I = "";
    private String qW1F = "", qW1I = "", qW2F = "", qW2I = "";
    private String hAF = "", hAI = "", hBF = "", hBI = "", hCF = "", hCI = "";
    private String rAmt = "", rKF = "", rKI = "";

    private LandResult quadResult;
    private String quadInputsText = "";
    private HeronResult heronResult;
    private String heronError = "";
    private String heronInputsText = "";
    private ReverseLandResult reverseResult;
    private String reverseInputsText = "";

    private LinearLayout root;

    public LandCalculatorView(AppHost host) {
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
            ctx, p, "জমির হিসাব", "চতুর্ভুজ, ত্রিভুজ ও সীমানা নির্ণয়",
            !note.trim().isEmpty() || showNote,
            host::goBackHome,
            () -> { showNote = !showNote; render(); }
        ));

        if (showNote) {
            LinearLayout noteCard = BnUi.makeCard(ctx, p, 20, 10);
            EditText noteEt = BnUi.makeNoteInput(ctx, p, note, "হিসাবের নাম বা নোট লিখুন (যেমন: দাগ নং ১০৫)...");
            noteEt.addTextChangedListener(new android.text.TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(android.text.Editable s) { note = s.toString(); }
            });
            noteCard.addView(noteEt);
            root.addView(noteCard, BnUi.marginTop(ctx, 10));
        }

        View seg = BnUi.makeSegmentedBar(ctx, p, new String[]{"চতুর্ভুজ", "ত্রিভুজ", "সীমানা নির্ণয়"}, activeTab, idx -> {
            activeTab = idx;
            render();
        });
        root.addView(seg, BnUi.marginTop(ctx, 10));

        if (activeTab == 0) {
            renderQuadForm(ctx, p);
        } else if (activeTab == 1) {
            renderHeronForm(ctx, p);
        } else {
            renderReverseForm(ctx, p);
        }

        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private void renderQuadForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 10);

        TextView lblLen = new TextView(ctx);
        lblLen.setText("জমির দৈর্ঘ্য (উত্তর ও দক্ষিণ বাহু)");
        lblLen.setTextSize(12);
        lblLen.setTypeface(null, Typeface.BOLD);
        lblLen.setTextColor(p.textBlueAccent);
        lblLen.setGravity(Gravity.CENTER);
        form.addView(lblLen);

        LinearLayout lenRow = new LinearLayout(ctx);
        lenRow.setOrientation(LinearLayout.HORIZONTAL);
        BnFeetInchBox nBox = new BnFeetInchBox(ctx, p, "১ম পাশ (দৈর্ঘ্য)");
        nBox.bind(qL1F, qL1I, v -> qL1F = v, v -> qL1I = v);
        BnFeetInchBox sBox = new BnFeetInchBox(ctx, p, "২য় পাশ (দৈর্ঘ্য)");
        sBox.bind(qL2F, qL2I, v -> qL2F = v, v -> qL2I = v);
        LinearLayout.LayoutParams lpL = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lpL.rightMargin = ThemeManager.dp(ctx, 6);
        lenRow.addView(nBox.box, lpL);
        lenRow.addView(sBox.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(lenRow, BnUi.marginTop(ctx, 6));

        View div = new View(ctx);
        div.setBackgroundColor(p.borderCard);
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, ThemeManager.dp(ctx, 1));
        dlp.topMargin = ThemeManager.dp(ctx, 10);
        dlp.bottomMargin = ThemeManager.dp(ctx, 8);
        form.addView(div, dlp);

        TextView lblWid = new TextView(ctx);
        lblWid.setText("জমির প্রস্থ (পূর্ব ও পশ্চিম বাহু)");
        lblWid.setTextSize(12);
        lblWid.setTypeface(null, Typeface.BOLD);
        lblWid.setTextColor(p.textBlueAccent);
        lblWid.setGravity(Gravity.CENTER);
        form.addView(lblWid);

        LinearLayout widRow = new LinearLayout(ctx);
        widRow.setOrientation(LinearLayout.HORIZONTAL);
        BnFeetInchBox eBox = new BnFeetInchBox(ctx, p, "১ম পাশ (প্রস্থ)");
        eBox.bind(qW1F, qW1I, v -> qW1F = v, v -> qW1I = v);
        BnFeetInchBox wBox = new BnFeetInchBox(ctx, p, "২য় পাশ (প্রস্থ)");
        wBox.bind(qW2F, qW2I, v -> qW2F = v, v -> qW2I = v);
        LinearLayout.LayoutParams lpW = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lpW.rightMargin = ThemeManager.dp(ctx, 6);
        widRow.addView(eBox.box, lpW);
        widRow.addView(wBox.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(widRow, BnUi.marginTop(ctx, 6));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "জমির হিসাব করুন", () -> {
            qL1F = ""; qL1I = ""; qL2F = ""; qL2I = "";
            qW1F = ""; qW1I = ""; qW2F = ""; qW2I = "";
            nBox.clear(); sBox.clear(); eBox.clear(); wBox.clear();
            quadResult = null;
            render();
        }, () -> {
            double l1F = nBox.getFt(), l1I = nBox.getIn();
            double l2F = sBox.getFt(), l2I = sBox.getIn();
            double w1F = eBox.getFt(), w1I = eBox.getIn();
            double w2F = wBox.getFt(), w2I = wBox.getIn();

            LandResult res = Calculators.calculateQuadLand(l1F, l1I, l2F, l2I, w1F, w1I, w2F, w2I);
            if (res.avgLengthFt <= 0 || res.avgWidthFt <= 0 || res.sqFt <= 0) {
                host.notifyUser("দয়া করে দৈর্ঘ্য এবং প্রস্থের মান দিন।");
                return;
            }
            quadResult = res;
            quadInputsText = "দৈর্ঘ্য ১: " + Calculators.formatDimBn(l1F, l1I)
                + ", দৈর্ঘ্য ২: " + Calculators.formatDimBn(l2F, l2I)
                + ", প্রস্থ ১: " + Calculators.formatDimBn(w1F, w1I)
                + ", প্রস্থ ২: " + Calculators.formatDimBn(w2F, w2I)
                + " (গড়: " + BnFormat.toBnNum(res.avgLengthFt, 2) + "' × " + BnFormat.toBnNum(res.avgWidthFt, 2) + "')";

            saveLandHistory("চতুর্ভুজ ও গড় পরিমাপ", res, quadInputsText);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (quadResult != null) {
            form.addView(buildLandResultCard(ctx, p, quadResult, "চতুর্ভুজ ও গড় পরিমাপ", quadInputsText), BnUi.marginTop(ctx, 14));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void renderHeronForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 10);

        TextView lbl = new TextView(ctx);
        lbl.setText("ত্রিভুজাকার জমির ৩টি বাহুর মাপ দিন");
        lbl.setTextSize(12);
        lbl.setTypeface(null, Typeface.BOLD);
        lbl.setTextColor(p.textBlueAccent);
        lbl.setGravity(Gravity.CENTER);
        form.addView(lbl);

        LinearLayout row1 = new LinearLayout(ctx);
        row1.setOrientation(LinearLayout.HORIZONTAL);
        BnFeetInchBox aBox = new BnFeetInchBox(ctx, p, "১ম বাহু");
        aBox.bind(hAF, hAI, v -> hAF = v, v -> hAI = v);
        BnFeetInchBox bBox = new BnFeetInchBox(ctx, p, "২য় বাহু");
        bBox.bind(hBF, hBI, v -> hBF = v, v -> hBI = v);
        LinearLayout.LayoutParams lpA = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lpA.rightMargin = ThemeManager.dp(ctx, 6);
        row1.addView(aBox.box, lpA);
        row1.addView(bBox.box, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        form.addView(row1, BnUi.marginTop(ctx, 8));

        BnFeetInchBox cBox = new BnFeetInchBox(ctx, p, "৩য় বাহু");
        cBox.bind(hCF, hCI, v -> hCF = v, v -> hCI = v);
        form.addView(cBox.box, BnUi.marginTop(ctx, 6));

        if (!heronError.isEmpty()) {
            TextView err = new TextView(ctx);
            err.setText(heronError);
            err.setTextSize(12);
            err.setTypeface(null, Typeface.BOLD);
            err.setTextColor(p.dangerText);
            err.setBackground(ThemeManager.roundRect(ctx, p.dangerBg, 14, 0, 0));
            err.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10));
            form.addView(err, BnUi.marginTop(ctx, 8));
        }

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "ত্রিভুজ জমির হিসাব করুন", () -> {
            hAF = ""; hAI = ""; hBF = ""; hBI = ""; hCF = ""; hCI = "";
            aBox.clear(); bBox.clear(); cBox.clear();
            heronError = "";
            heronResult = null;
            render();
        }, () -> {
            double aF = aBox.getFt(), aI = aBox.getIn();
            double bF = bBox.getFt(), bI = bBox.getIn();
            double cF = cBox.getFt(), cI = cBox.getIn();
            if (aF + aI <= 0 || bF + bI <= 0 || cF + cI <= 0) {
                heronError = "দয়া করে ৩টি বাহুর মান দিন।";
                heronResult = null;
                render();
                return;
            }
            HeronResult res = Calculators.calculateHeronLand(aF, aI, bF, bI, cF, cI);
            if (!res.isValidTriangle) {
                heronError = "পরিমাপগুলো দিয়ে ত্রিভুজ তৈরি সম্ভব নয়। যেকোনো দুই বাহুর যোগফল তৃতীয় বাহু অপেক্ষা বড় হতে হবে।";
                heronResult = null;
                render();
                return;
            }
            heronError = "";
            heronResult = res;
            heronInputsText = "১ম বাহু: " + Calculators.formatDimBn(aF, aI)
                + ", ২য় বাহু: " + Calculators.formatDimBn(bF, bI)
                + ", ৩য় বাহু: " + Calculators.formatDimBn(cF, cI);
            saveLandHistory("ত্রিভুজাকার জমি পরিমাপ", res, heronInputsText);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (heronResult != null) {
            form.addView(buildLandResultCard(ctx, p, heronResult, "ত্রিভুজাকার জমি পরিমাপ", heronInputsText), BnUi.marginTop(ctx, 14));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void renderReverseForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 12);

        TextView lbl = new TextView(ctx);
        lbl.setText("কাঙ্ক্ষিত জমির পরিমাণ ও একক");
        lbl.setTextSize(12);
        lbl.setTypeface(null, Typeface.BOLD);
        lbl.setTextColor(p.textBlueAccent);
        lbl.setGravity(Gravity.CENTER);
        form.addView(lbl);

        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);
        BnSingleInput amtIn = new BnSingleInput(ctx, p, "জমির পরিমাণ", "", false);
        amtIn.bind(rAmt, v -> rAmt = v);
        LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        alp.rightMargin = ThemeManager.dp(ctx, 8);
        row.addView(amtIn.box, alp);

        LinearLayout unitBox = new LinearLayout(ctx);
        unitBox.setOrientation(LinearLayout.VERTICAL);
        unitBox.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 16, p.borderInput, 1));
        unitBox.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 9));
        TextView uLbl = new TextView(ctx);
        uLbl.setText("জমির একক");
        uLbl.setTextSize(11);
        uLbl.setTypeface(null, Typeface.BOLD);
        uLbl.setTextColor(p.textMuted);
        uLbl.setGravity(Gravity.CENTER);
        unitBox.addView(uLbl);

        TextView uVal = new TextView(ctx);
        uVal.setText(targetUnit.label + " ▾");
        uVal.setTextSize(13.5f);
        uVal.setTypeface(null, Typeface.BOLD);
        uVal.setTextColor(p.textBlueAccent);
        uVal.setGravity(Gravity.CENTER);
        uVal.setSingleLine(true);
        LinearLayout.LayoutParams ulp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        ulp.topMargin = ThemeManager.dp(ctx, 4);
        unitBox.addView(uVal, ulp);
        unitBox.setOnClickListener(v -> showUnitPicker(ctx, uVal));
        row.addView(unitBox, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));
        form.addView(row, BnUi.marginTop(ctx, 8));

        BnFeetInchBox knownBox = new BnFeetInchBox(ctx, p, "জানা এক দিকের বাহুর মাপ (ফুট ও ইঞ্চি)");
        knownBox.bind(rKF, rKI, v -> rKF = v, v -> rKI = v);
        form.addView(knownBox.box, BnUi.marginTop(ctx, 8));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "সীমানা বের করুন", () -> {
            rAmt = ""; rKF = ""; rKI = "";
            amtIn.setText(""); knownBox.clear();
            reverseResult = null;
            render();
        }, () -> {
            double amt = amtIn.getValue();
            double kF = knownBox.getFt(), kI = knownBox.getIn();
            if (amt <= 0 || (kF == 0 && kI == 0)) {
                host.notifyUser("দয়া করে জমির পরিমাণ এবং জানা দিকের মান দিন।");
                return;
            }
            ReverseLandResult res = Calculators.calculateReverseLand(amt, targetUnit, kF, kI);
            reverseResult = res;
            reverseInputsText = "টার্গেট জমি: " + BnFormat.toBnNumTrim(amt) + " " + targetUnit.label
                + ", জানা বাহু: " + Calculators.formatDimBn(kF, kI);

            HistoryRecord hr = new HistoryRecord();
            hr.category = "land";
            hr.categoryLabel = "জমির হিসাব";
            hr.subTypeLabel = "সীমানা নির্ণয়";
            hr.note = note.trim();
            hr.summaryPrimary = BnFormat.toBnNum(res.ansFt) + " ফুট " + BnFormat.toBnNum(res.ansIn, 2) + " ইঞ্চি";
            hr.summarySecondary = "টার্গেট জমি: " + BnFormat.toBnNumTrim(amt) + " " + targetUnit.label;
            hr.inputsText = reverseInputsText;
            hr.details.add(new DetailItem("অজানা দিকের মাপ লাগবে", hr.summaryPrimary));
            hr.details.add(new DetailItem("দশমিক ফুটে মাপ", BnFormat.toBnNum(res.requiredOppositeFt, 2) + " ফুট"));
            hr.details.addAll(buildDetailsList(res.landDetails));
            host.saveHistory(hr);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (reverseResult != null) {
            LinearLayout banner = BnUi.makePrimaryGradientBox(ctx);
            TextView t1 = new TextView(ctx);
            t1.setText("অজানা দিকের মাপ লাগবে:");
            t1.setTextSize(12);
            t1.setTextColor(Color.parseColor("#BAE6FD"));
            banner.addView(t1);

            TextView t2 = new TextView(ctx);
            t2.setText(BnFormat.toBnNum(reverseResult.ansFt) + " ফুট " + BnFormat.toBnNum(reverseResult.ansIn, 2) + " ইঞ্চি");
            t2.setTextSize(22);
            t2.setTypeface(null, Typeface.BOLD);
            t2.setTextColor(Color.WHITE);
            banner.addView(t2, BnUi.marginTop(ctx, 3));

            TextView t3 = new TextView(ctx);
            t3.setText("দশমিক ফুটে: " + BnFormat.toBnNum(reverseResult.requiredOppositeFt, 2) + " ফুট | জানা বাহু: " + BnFormat.toBnNum(reverseResult.knownSideFt, 2) + " ফুট");
            t3.setTextSize(12);
            t3.setTextColor(Color.parseColor("#E0F2FE"));
            banner.addView(t3, BnUi.marginTop(ctx, 4));
            form.addView(banner, BnUi.marginTop(ctx, 14));

            form.addView(buildLandResultCard(ctx, p, reverseResult.landDetails, "সীমানা নির্ণয়", reverseInputsText), BnUi.marginTop(ctx, 10));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void showUnitPicker(Context ctx, TextView uVal) {
        LandUnitType[] units = LandUnitType.values();
        String[] labels = new String[units.length];
        for (int i = 0; i < units.length; i++) labels[i] = units[i].label;
        new AlertDialog.Builder(ctx)
            .setTitle("জমির একক নির্বাচন করুন")
            .setItems(labels, (d, which) -> {
                targetUnit = units[which];
                uVal.setText(targetUnit.label + " ▾");
            })
            .show();
    }

    private List<DetailItem> buildDetailsList(LandResult res) {
        List<DetailItem> list = new ArrayList<>();
        list.add(new DetailItem("মোট ক্ষেত্রফল", BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট"));
        list.add(new DetailItem("মোট শতক / শতাংশ", BnFormat.toBnNum(res.decimal, 3) + " শতক"));
        list.add(new DetailItem("কুড়া / কাঠা / ধুর", res.mixedText));
        list.add(new DetailItem("কাঠা (৩.৩০ শতক)", BnFormat.toBnNum(res.katha, 2) + " কাঠা"));
        list.add(new DetailItem("কাঠা (৭২০ বর্গফুট)", BnFormat.toBnNum(res.standardKatha, 2) + " কাঠা"));
        list.add(new DetailItem("বিঘা", BnFormat.toBnNum(res.bigha, 3) + " বিঘা"));
        list.add(new DetailItem("একর", BnFormat.toBnNum(res.acre, 3) + " একর"));
        list.add(new DetailItem("গণ্ডা", BnFormat.toBnNum(res.gonda, 2) + " গণ্ডা"));
        list.add(new DetailItem("বর্গ হাত", BnFormat.toBnNum(res.sqHat, 2) + " বর্গ হাত"));
        return list;
    }

    private void saveLandHistory(String subTitle, LandResult res, String inputsText) {
        HistoryRecord hr = new HistoryRecord();
        hr.category = "land";
        hr.categoryLabel = "জমির হিসাব";
        hr.subTypeLabel = subTitle;
        hr.note = note.trim();
        hr.summaryPrimary = BnFormat.toBnNum(res.decimal, 3) + " শতক";
        hr.summarySecondary = BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট | " + res.mixedText;
        hr.inputsText = inputsText;
        hr.details = buildDetailsList(res);
        host.saveHistory(hr);
    }

    private View buildLandResultCard(Context ctx, Palette p, LandResult res, String subTitle, String inputsText) {
        LinearLayout wrap = new LinearLayout(ctx);
        wrap.setOrientation(LinearLayout.VERTICAL);
        wrap.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 22, p.borderCard, 1));
        wrap.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12));

        LinearLayout hero = BnUi.makePrimaryGradientBox(ctx);
        TextView topMeta = new TextView(ctx);
        topMeta.setText("মোট ক্ষেত্রফল: " + BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট  •  স্বয়ংক্রিয়ভাবে সংরক্ষিত");
        topMeta.setTextSize(11);
        topMeta.setTextColor(Color.parseColor("#BAE6FD"));
        hero.addView(topMeta);

        TextView bigVal = new TextView(ctx);
        bigVal.setText(BnFormat.toBnNum(res.decimal, 3) + " শতক");
        bigVal.setTextSize(28);
        bigVal.setTypeface(null, Typeface.BOLD);
        bigVal.setTextColor(Color.WHITE);
        hero.addView(bigVal, BnUi.marginTop(ctx, 2));

        TextView mixed = new TextView(ctx);
        mixed.setText(res.mixedText);
        mixed.setTextSize(12);
        mixed.setTypeface(null, Typeface.BOLD);
        mixed.setTextColor(Color.WHITE);
        mixed.setBackground(ThemeManager.roundRect(ctx, Color.parseColor("#26FFFFFF"), 10, 0, 0));
        mixed.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5));
        LinearLayout.LayoutParams mlp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        mlp.topMargin = ThemeManager.dp(ctx, 8);
        hero.addView(mixed, mlp);
        wrap.addView(hero);

        String[][] metrics = {
            {"কাঠা (৩.৩০ শতক)", BnFormat.toBnNum(res.katha, 2), "কাঠা (৭২০ বর্গফুট)", BnFormat.toBnNum(res.standardKatha, 2)},
            {"বিঘা", BnFormat.toBnNum(res.bigha, 3), "একর", BnFormat.toBnNum(res.acre, 3)},
            {"গণ্ডা", BnFormat.toBnNum(res.gonda, 2), "বর্গ হাত", BnFormat.toBnNum(res.sqHat, 2)}
        };
        for (String[] pair : metrics) {
            LinearLayout gridRow = new LinearLayout(ctx);
            gridRow.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams g1 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            g1.rightMargin = ThemeManager.dp(ctx, 6);
            gridRow.addView(BnUi.makeGridMetricTile(ctx, p, pair[0], pair[1]), g1);
            gridRow.addView(BnUi.makeGridMetricTile(ctx, p, pair[2], pair[3]), new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
            wrap.addView(gridRow, BnUi.marginTop(ctx, 8));
        }

        List<DetailItem> details = buildDetailsList(res);
        StringBuilder shareText = new StringBuilder();
        shareText.append("জমির হিসাব (").append(subTitle).append(")\n");
        if (!note.trim().isEmpty()) shareText.append("নোট: ").append(note.trim()).append("\n");
        shareText.append(inputsText).append("\n");
        for (DetailItem d : details) shareText.append("• ").append(d.label).append(": ").append(d.value).append("\n");

        wrap.addView(BnUi.makeActionRow3(ctx, p, () -> {
            NativeTools.copyToClipboard(ctx, shareText.toString());
            host.notifyUser("ফলাফল ক্লিপবোর্ডে কপি করা হয়েছে!");
        }, () -> NativeTools.shareText(ctx, "জমির হিসাব ফলাফল", shareText.toString()), () -> {
            PrintableReport r = new PrintableReport();
            r.title = "জমির হিসাব";
            r.subtitle = subTitle;
            r.note = note.trim();
            r.inputsText = inputsText;
            r.summaryPrimary = BnFormat.toBnNum(res.decimal, 3) + " শতক (" + BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট)";
            r.summarySecondary = res.mixedText;
            r.details = details;
            host.printReport(r);
        }), BnUi.marginTop(ctx, 10));

        return wrap;
    }
}
