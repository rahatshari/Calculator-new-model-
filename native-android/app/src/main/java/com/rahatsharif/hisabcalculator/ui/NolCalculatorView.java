package com.rahatsharif.hisabcalculator.ui;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.ui.BnUi.BnSingleInput;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.Calculators;
import com.rahatsharif.hisabcalculator.util.Calculators.LandUnitType;
import com.rahatsharif.hisabcalculator.util.Calculators.NolLandResult;
import com.rahatsharif.hisabcalculator.util.Calculators.NolSideInput;
import com.rahatsharif.hisabcalculator.util.Calculators.ReverseNolResult;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class NolCalculatorView {
    private final AppHost host;
    private int activeTab = 0; // 0=area, 1=reverse
    private int nolOptionIdx = 0; // default ৪ হাত
    private LandUnitType targetUnit = LandUnitType.decimal;
    private boolean showNote = false;
    private String note = "";

    private static class SideState {
        String nol = "", hat = "", bighat = "", angul = "";
        void clear() { nol = ""; hat = ""; bighat = ""; angul = ""; }
    }

    private final SideState lenState = new SideState();
    private final SideState widState = new SideState();
    private final SideState knownState = new SideState();
    private String revAmtStr = "";

    private NolLandResult areaResult;
    private ReverseNolResult revResult;
    private LinearLayout root;

    private static final double[] NOL_HATS = {4, 5, 6, 7, 8};
    private static final String[] NOL_WORDS = {"চার হাত", "পাঁচ হাত", "ছয় হাত", "সাত হাত", "আট হাত"};
    private static final String[] NOL_LABELS = {
        "চার হাত (৪ হাত = ৬ ফুট)",
        "পাঁচ হাত (৫ হাত = ৭.৫ ফুট)",
        "ছয় হাত (৬ হাত = ৯ ফুট)",
        "সাত হাত (৭ হাত = ১০.৫ ফুট)",
        "আট হাত (৮ হাত = ১২ ফুট)"
    };

    public NolCalculatorView(AppHost host) {
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

    private static class SideBoxGroup {
        BnSingleInput nol, hat, bighat, angul;
        LinearLayout container;

        SideBoxGroup(Context ctx, Palette p, String title, SideState st) {
            container = new LinearLayout(ctx);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 18, p.borderCard, 1));
            container.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 10));

            TextView tv = new TextView(ctx);
            tv.setText(title);
            tv.setTextSize(12);
            tv.setTypeface(null, Typeface.BOLD);
            tv.setTextColor(p.textBlueAccent);
            container.addView(tv);

            LinearLayout row = new LinearLayout(ctx);
            row.setOrientation(LinearLayout.HORIZONTAL);
            nol = new BnSingleInput(ctx, p, "নল", "", true);
            nol.bind(st.nol, v -> st.nol = v);
            hat = new BnSingleInput(ctx, p, "হাত", "", true);
            hat.bind(st.hat, v -> st.hat = v);
            bighat = new BnSingleInput(ctx, p, "বিঘাত", "", true);
            bighat.bind(st.bighat, v -> st.bighat = v);
            angul = new BnSingleInput(ctx, p, "আঙুল", "", true);
            angul.bind(st.angul, v -> st.angul = v);

            BnSingleInput[] arr = {nol, hat, bighat, angul};
            for (int i = 0; i < arr.length; i++) {
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
                if (i < arr.length - 1) lp.rightMargin = ThemeManager.dp(ctx, 5);
                row.addView(arr[i].box, lp);
            }
            container.addView(row, BnUi.marginTop(ctx, 6));
        }

        NolSideInput parse() {
            return new NolSideInput(nol.getValue(), hat.getValue(), bighat.getValue(), angul.getValue());
        }

        void clear() {
            nol.setText(""); hat.setText(""); bighat.setText(""); angul.setText("");
        }
    }

    private void render() {
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();
        root.removeAllViews();

        root.addView(BnUi.makeSubHeader(
            ctx, p, "নলের হিসাব", "নল, হাত, বিঘাত ও আঙুল পরিমাপ",
            !note.trim().isEmpty() || showNote,
            host::goBackHome,
            () -> { showNote = !showNote; render(); }
        ));

        if (showNote) {
            LinearLayout noteCard = BnUi.makeCard(ctx, p, 20, 10);
            EditText noteEt = BnUi.makeNoteInput(ctx, p, note, "হিসাবের নাম বা নোট লিখুন (যেমন: উত্তর পাড়ার জমি)...");
            noteEt.addTextChangedListener(new android.text.TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(android.text.Editable s) { note = s.toString(); }
            });
            noteCard.addView(noteEt);
            root.addView(noteCard, BnUi.marginTop(ctx, 10));
        }

        // Nol selector card
        LinearLayout nolBar = BnUi.makeCard(ctx, p, 22, 12);
        nolBar.setOrientation(LinearLayout.HORIZONTAL);
        nolBar.setGravity(android.view.Gravity.CENTER_VERTICAL);

        LinearLayout leftCol = new LinearLayout(ctx);
        leftCol.setOrientation(LinearLayout.VERTICAL);
        TextView lbl = new TextView(ctx);
        lbl.setText("নির্বাচিত নলের মাপ (ডিফল্ট চার হাত)");
        lbl.setTextSize(11);
        lbl.setTextColor(p.textMuted);
        leftCol.addView(lbl);

        TextView val = new TextView(ctx);
        double ftLen = NOL_HATS[nolOptionIdx] * 1.5;
        val.setText("১ নল = " + NOL_WORDS[nolOptionIdx] + " (" + BnFormat.toBnNumTrim(ftLen) + " ফুট)");
        val.setTextSize(14);
        val.setTypeface(null, Typeface.BOLD);
        val.setTextColor(p.textBlueAccent);
        leftCol.addView(val, BnUi.marginTop(ctx, 2));
        nolBar.addView(leftCol, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView pickBtn = new TextView(ctx);
        pickBtn.setText(NOL_WORDS[nolOptionIdx] + " ▾");
        pickBtn.setTextSize(12);
        pickBtn.setTypeface(null, Typeface.BOLD);
        pickBtn.setTextColor(p.softBlueText);
        pickBtn.setBackground(ThemeManager.roundRect(ctx, p.softBlueBg, 999, 0, 0));
        pickBtn.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 8));
        pickBtn.setOnClickListener(v -> new AlertDialog.Builder(ctx)
            .setTitle("নলের মাপ নির্বাচন করুন")
            .setItems(NOL_LABELS, (d, which) -> {
                nolOptionIdx = which;
                render();
            })
            .show());
        nolBar.addView(pickBtn);
        root.addView(nolBar, BnUi.marginTop(ctx, 10));

        root.addView(BnUi.makeSegmentedBar(ctx, p, new String[]{"ক্ষেত্রফল নির্ণয়", "সীমানা নির্ণয়"}, activeTab, idx -> {
            activeTab = idx;
            render();
        }), BnUi.marginTop(ctx, 10));

        if (activeTab == 0) renderAreaForm(ctx, p);
        else renderReverseForm(ctx, p);

        ThemeManager.applyFontRecursively(root, ctx, host.getActiveFontId());
    }

    private void renderAreaForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 12);
        SideBoxGroup lenGroup = new SideBoxGroup(ctx, p, "জমির দৈর্ঘ্য", lenState);
        SideBoxGroup widGroup = new SideBoxGroup(ctx, p, "জমির প্রস্থ", widState);
        form.addView(lenGroup.container);
        form.addView(widGroup.container, BnUi.marginTop(ctx, 10));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "নলের হিসাব করুন", () -> {
            lenState.clear(); widState.clear();
            lenGroup.clear(); widGroup.clear();
            areaResult = null;
            render();
        }, () -> {
            double hpn = NOL_HATS[nolOptionIdx];
            NolSideInput lSide = lenGroup.parse();
            NolSideInput wSide = widGroup.parse();
            NolLandResult res = Calculators.calculateLandByNol(hpn, lSide, wSide);
            if (res.sqFt <= 0) {
                host.notifyUser("দয়া করে দৈর্ঘ্য এবং প্রস্থের মাপ দিন।");
                return;
            }
            areaResult = res;
            String inputsText = "১ নল = " + NOL_WORDS[nolOptionIdx] + " (" + BnFormat.toBnNum(res.nolLengthFt, 2) + " ফুট) | দৈর্ঘ্য: "
                + Calculators.formatNolPartBn(lSide) + " | প্রস্থ: " + Calculators.formatNolPartBn(wSide);

            List<DetailItem> details = new ArrayList<>();
            details.add(new DetailItem("১ নলের মান", NOL_WORDS[nolOptionIdx] + " (" + BnFormat.toBnNum(res.nolLengthFt, 2) + " ফুট)"));
            details.add(new DetailItem("দৈর্ঘ্য ও প্রস্থ (ফুটে)", BnFormat.toBnNum(res.lengthFt, 2) + "' × " + BnFormat.toBnNum(res.widthFt, 2) + "'"));
            details.add(new DetailItem("মোট ক্ষেত্রফল", BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট (" + BnFormat.toBnNum(res.sqNol, 2) + " বর্গ নল)"));
            details.add(new DetailItem("মোট শতক / শতাংশ", BnFormat.toBnNum(res.decimal, 3) + " শতক"));
            details.add(new DetailItem("কুড়া / কাঠা / ধুর", res.mixedText));
            details.add(new DetailItem("কাঠা (৩.৩০ শতক)", BnFormat.toBnNum(res.katha, 2) + " কাঠা"));
            details.add(new DetailItem("কাঠা (৭২০ বর্গফুট)", BnFormat.toBnNum(res.standardKatha, 2) + " কাঠা"));
            details.add(new DetailItem("বিঘা", BnFormat.toBnNum(res.bigha, 3) + " বিঘা"));
            details.add(new DetailItem("একর", BnFormat.toBnNum(res.acre, 3) + " একর"));

            HistoryRecord hr = new HistoryRecord();
            hr.category = "nol";
            hr.categoryLabel = "নলের হিসাব";
            hr.subTypeLabel = "নল দিয়ে ক্ষেত্রফল (" + NOL_WORDS[nolOptionIdx] + ")";
            hr.note = note.trim();
            hr.summaryPrimary = BnFormat.toBnNum(res.decimal, 3) + " শতক";
            hr.summarySecondary = BnFormat.toBnNum(res.sqFt, 2) + " বর্গফুট | " + res.mixedText;
            hr.inputsText = inputsText;
            hr.details = details;
            host.saveHistory(hr);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (areaResult != null) {
            LinearLayout wrap = new LinearLayout(ctx);
            wrap.setOrientation(LinearLayout.VERTICAL);
            wrap.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 22, p.borderCard, 1));
            wrap.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12));

            LinearLayout hero = BnUi.makePrimaryGradientBox(ctx);
            TextView top = new TextView(ctx);
            top.setText("মোট ক্ষেত্রফল: " + BnFormat.toBnNum(areaResult.sqFt, 2) + " বর্গফুট  •  " + BnFormat.toBnNum(areaResult.sqNol, 2) + " বর্গ নল");
            top.setTextSize(11);
            top.setTextColor(Color.parseColor("#BAE6FD"));
            hero.addView(top);

            TextView big = new TextView(ctx);
            big.setText(BnFormat.toBnNum(areaResult.decimal, 3) + " শতক");
            big.setTextSize(28);
            big.setTypeface(null, Typeface.BOLD);
            big.setTextColor(Color.WHITE);
            hero.addView(big, BnUi.marginTop(ctx, 2));

            TextView mix = new TextView(ctx);
            mix.setText(areaResult.mixedText);
            mix.setTextSize(12);
            mix.setTypeface(null, Typeface.BOLD);
            mix.setTextColor(Color.WHITE);
            mix.setBackground(ThemeManager.roundRect(ctx, Color.parseColor("#26FFFFFF"), 10, 0, 0));
            mix.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 5));
            LinearLayout.LayoutParams mlp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            mlp.topMargin = ThemeManager.dp(ctx, 8);
            hero.addView(mix, mlp);
            wrap.addView(hero);

            String[][] tiles = {
                {"কাঠা (৩.৩০ শতক)", BnFormat.toBnNum(areaResult.katha, 2), "কাঠা (৭২০ বর্গফুট)", BnFormat.toBnNum(areaResult.standardKatha, 2)},
                {"বিঘা", BnFormat.toBnNum(areaResult.bigha, 3), "একর", BnFormat.toBnNum(areaResult.acre, 3)}
            };
            for (String[] pair : tiles) {
                LinearLayout row = new LinearLayout(ctx);
                row.setOrientation(LinearLayout.HORIZONTAL);
                LinearLayout.LayoutParams g1 = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
                g1.rightMargin = ThemeManager.dp(ctx, 6);
                row.addView(BnUi.makeGridMetricTile(ctx, p, pair[0], pair[1]), g1);
                row.addView(BnUi.makeGridMetricTile(ctx, p, pair[2], pair[3]), new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
                wrap.addView(row, BnUi.marginTop(ctx, 8));
            }

            final String shareTxt = "নলের হিসাব (" + NOL_WORDS[nolOptionIdx] + ")\nমোট জমি: "
                + BnFormat.toBnNum(areaResult.decimal, 3) + " শতক (" + BnFormat.toBnNum(areaResult.sqFt, 2) + " বর্গফুট)\n" + areaResult.mixedText;

            wrap.addView(BnUi.makeActionRow3(ctx, p, () -> {
                NativeTools.copyToClipboard(ctx, shareTxt);
                host.notifyUser("ফলাফল কপি করা হয়েছে!");
            }, () -> NativeTools.shareText(ctx, "নলের হিসাব", shareTxt), () -> {
                PrintableReport r = new PrintableReport();
                r.title = "নলের হিসাব";
                r.subtitle = "১ নল = " + NOL_WORDS[nolOptionIdx] + " (" + BnFormat.toBnNum(areaResult.nolLengthFt, 2) + " ফুট)";
                r.note = note.trim();
                r.inputsText = "দৈর্ঘ্য: " + BnFormat.toBnNum(areaResult.lengthFt, 2) + " ফুট, প্রস্থ: " + BnFormat.toBnNum(areaResult.widthFt, 2) + " ফুট";
                r.summaryPrimary = BnFormat.toBnNum(areaResult.decimal, 3) + " শতক";
                r.summarySecondary = BnFormat.toBnNum(areaResult.sqFt, 2) + " বর্গফুট | " + areaResult.mixedText;
                r.details = new ArrayList<>();
                r.details.add(new DetailItem("মোট বর্গফুট", BnFormat.toBnNum(areaResult.sqFt, 2) + " বর্গফুট"));
                r.details.add(new DetailItem("মোট শতক", BnFormat.toBnNum(areaResult.decimal, 3) + " শতক"));
                r.details.add(new DetailItem("কুড়া / কাঠা / ধুর", areaResult.mixedText));
                host.printReport(r);
            }), BnUi.marginTop(ctx, 10));

            form.addView(wrap, BnUi.marginTop(ctx, 14));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
    }

    private void renderReverseForm(Context ctx, Palette p) {
        LinearLayout form = BnUi.makeCard(ctx, p, 22, 12);

        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);
        BnSingleInput amtIn = new BnSingleInput(ctx, p, "কাঙ্ক্ষিত জমির পরিমাণ", "", false);
        amtIn.bind(revAmtStr, v -> revAmtStr = v);
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
        unitBox.addView(uLbl);

        TextView uVal = new TextView(ctx);
        uVal.setText(targetUnit.label + " ▾");
        uVal.setTextSize(13.5f);
        uVal.setTypeface(null, Typeface.BOLD);
        uVal.setTextColor(p.textBlueAccent);
        uVal.setSingleLine(true);
        unitBox.addView(uVal, BnUi.marginTop(ctx, 4));
        unitBox.setOnClickListener(v -> {
            LandUnitType[] units = LandUnitType.values();
            String[] labels = new String[units.length];
            for (int i = 0; i < units.length; i++) labels[i] = units[i].label;
            new AlertDialog.Builder(ctx)
                .setTitle("জমির একক নির্বাচন করুন")
                .setItems(labels, (d, which) -> {
                    targetUnit = units[which];
                    uVal.setText(targetUnit.label + " ▾");
                }).show();
        });
        row.addView(unitBox, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));
        form.addView(row);

        SideBoxGroup knownGroup = new SideBoxGroup(ctx, p, "জানা এক দিকের মাপ (নল / হাত / বিঘাত / আঙুল)", knownState);
        form.addView(knownGroup.container, BnUi.marginTop(ctx, 10));

        form.addView(BnUi.makeResetAndSubmitRow(ctx, p, "সীমানা বের করুন", () -> {
            revAmtStr = ""; knownState.clear();
            amtIn.setText(""); knownGroup.clear();
            revResult = null;
            render();
        }, () -> {
            double amt = amtIn.getValue();
            double hpn = NOL_HATS[nolOptionIdx];
            NolSideInput kSide = knownGroup.parse();
            if (amt <= 0) {
                host.notifyUser("দয়া করে জমির পরিমাণ দিন।");
                return;
            }
            ReverseNolResult res = Calculators.calculateReverseNolLand(hpn, amt, targetUnit, kSide);
            if (res.knownSideFt <= 0) {
                host.notifyUser("দয়া করে জানা বাহুর মাপ দিন।");
                return;
            }
            revResult = res;

            String ansFormatted = BnFormat.toBnNum(res.ansNol) + " নল "
                + BnFormat.toBnNum(res.ansHat) + " হাত "
                + BnFormat.toBnNum(res.ansBighat) + " বিঘাত "
                + BnFormat.toBnAngul(res.ansAngul) + " আঙুল";

            HistoryRecord hr = new HistoryRecord();
            hr.category = "nol";
            hr.categoryLabel = "নলের হিসাব";
            hr.subTypeLabel = "নল দিয়ে সীমানা নির্ণয়";
            hr.note = note.trim();
            hr.summaryPrimary = BnFormat.toBnNum(res.ansNol) + " নল " + BnFormat.toBnNum(res.ansHat) + " হাত";
            hr.summarySecondary = BnFormat.toBnNum(res.ansFt) + " ফুট " + BnFormat.toBnNum(res.ansIn, 2) + " ইঞ্চি";
            hr.inputsText = "১ নল = " + NOL_WORDS[nolOptionIdx] + " | কাঙ্ক্ষিত জমি: " + BnFormat.toBnNumTrim(amt) + " " + targetUnit.label + " | জানা বাহু: " + Calculators.formatNolPartBn(kSide);
            hr.details.add(new DetailItem("অজানা দিকের মাপ (নলে)", ansFormatted));
            hr.details.add(new DetailItem("অজানা দিকের মাপ (ফুটে)", BnFormat.toBnNum(res.ansFt) + " ফুট " + BnFormat.toBnNum(res.ansIn, 2) + " ইঞ্চি (" + BnFormat.toBnNum(res.requiredOppositeFt, 2) + " ফুট)"));
            hr.details.add(new DetailItem("মোট বর্গফুট", BnFormat.toBnNum(res.landDetails.sqFt, 2) + " বর্গফুট"));
            hr.details.add(new DetailItem("মোট শতক", BnFormat.toBnNum(res.landDetails.decimal, 3) + " শতক"));
            hr.details.add(new DetailItem("কুড়া / কাঠা / ধুর", res.landDetails.mixedText));
            host.saveHistory(hr);
            render();
        }), BnUi.marginTop(ctx, 12));

        if (revResult != null) {
            LinearLayout wrap = new LinearLayout(ctx);
            wrap.setOrientation(LinearLayout.VERTICAL);
            wrap.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 22, p.borderCard, 1));
            wrap.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 12));

            LinearLayout hero = BnUi.makePrimaryGradientBox(ctx);
            TextView t1 = new TextView(ctx);
            t1.setText("অজানা দিকের মাপ লাগবে (নলে):");
            t1.setTextSize(12);
            t1.setTextColor(Color.parseColor("#BAE6FD"));
            hero.addView(t1);

            String ansFormatted = BnFormat.toBnNum(revResult.ansNol) + " নল "
                + BnFormat.toBnNum(revResult.ansHat) + " হাত "
                + BnFormat.toBnNum(revResult.ansBighat) + " বিঘাত "
                + BnFormat.toBnAngul(revResult.ansAngul) + " আঙুল";

            TextView t2 = new TextView(ctx);
            t2.setText(ansFormatted);
            t2.setTextSize(20);
            t2.setTypeface(null, Typeface.BOLD);
            t2.setTextColor(Color.WHITE);
            hero.addView(t2, BnUi.marginTop(ctx, 3));

            TextView t3 = new TextView(ctx);
            t3.setText("ফুটে মাপ: " + BnFormat.toBnNum(revResult.ansFt) + " ফুট " + BnFormat.toBnNum(revResult.ansIn, 2)
                + " ইঞ্চি (" + BnFormat.toBnNum(revResult.requiredOppositeFt, 2) + " ফুট)");
            t3.setTextSize(12);
            t3.setTextColor(Color.parseColor("#E0F2FE"));
            hero.addView(t3, BnUi.marginTop(ctx, 5));
            wrap.addView(hero);

            final String shareTxt = "নলের সীমানা নির্ণয় (" + NOL_WORDS[nolOptionIdx] + ")\n" + ansFormatted + "\n" + t3.getText();
            wrap.addView(BnUi.makeActionRow3(ctx, p, () -> {
                NativeTools.copyToClipboard(ctx, shareTxt);
                host.notifyUser("ফলাফল কপি করা হয়েছে!");
            }, () -> NativeTools.shareText(ctx, "নলের হিসাব (সীমানা)", shareTxt), () -> {
                PrintableReport r = new PrintableReport();
                r.title = "নলের হিসাব — সীমানা নির্ণয়";
                r.subtitle = "১ নল = " + NOL_WORDS[nolOptionIdx];
                r.note = note.trim();
                r.summaryPrimary = ansFormatted;
                r.summarySecondary = t3.getText().toString();
                r.details = new ArrayList<>();
                r.details.add(new DetailItem("নলের মাপ", ansFormatted));
                r.details.add(new DetailItem("ফুটের মাপ", t3.getText().toString()));
                r.details.add(new DetailItem("মোট বর্গফুট", BnFormat.toBnNum(revResult.landDetails.sqFt, 2) + " বর্গফুট"));
                host.printReport(r);
            }), BnUi.marginTop(ctx, 10));

            form.addView(wrap, BnUi.marginTop(ctx, 14));
        }

        root.addView(form, BnUi.marginTop(ctx, 10));
    }
}
