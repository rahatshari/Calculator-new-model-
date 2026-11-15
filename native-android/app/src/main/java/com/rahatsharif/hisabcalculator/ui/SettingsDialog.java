package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.rahatsharif.hisabcalculator.BuildConfig;
import com.rahatsharif.hisabcalculator.R;
import com.rahatsharif.hisabcalculator.data.AppStorage.AppSettings;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.UpdateCheckResult;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.FontOption;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

public class SettingsDialog {
    public interface Listener {
        void onSettingsUpdated(AppSettings newSettings);
        void onUpdateChecked(UpdateCheckResult result);
    }

    private final Context ctx;
    private AppSettings settings;
    private UpdateCheckResult updateInfo;
    private final Listener listener;

    private BottomSheetDialog dialog;
    private LinearLayout rootBox;
    private boolean showFontList = false;
    private boolean checking = false;

    public SettingsDialog(Context ctx, AppSettings settings, UpdateCheckResult updateInfo, Listener listener) {
        this.ctx = ctx;
        this.settings = settings;
        this.updateInfo = updateInfo;
        this.listener = listener;
    }

    public boolean isShowing() {
        return dialog != null && dialog.isShowing();
    }

    public void dismiss() {
        if (dialog != null && dialog.isShowing()) {
            dialog.dismiss();
        }
    }

    public void show() {
        dialog = new BottomSheetDialog(ctx);
        ScrollView scroll = new ScrollView(ctx);
        scroll.setFillViewport(true);

        rootBox = new LinearLayout(ctx);
        rootBox.setOrientation(LinearLayout.VERTICAL);
        rootBox.setPadding(ThemeManager.dp(ctx, 16), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 16), ThemeManager.dp(ctx, 22));
        scroll.addView(rootBox);

        render();
        dialog.setContentView(scroll);

        // Clear default bottom sheet background so custom dark/light card matches seamlessly
        View parent = (View) scroll.getParent();
        if (parent != null) {
            parent.setBackgroundColor(Color.TRANSPARENT);
        }
        dialog.show();
    }

    private void render() {
        if (rootBox == null) return;
        Palette p = ThemeManager.getPalette(settings.amoledDark);
        rootBox.removeAllViews();

        GradientDrawable sheetBg = new GradientDrawable();
        sheetBg.setColor(p.bgCard);
        float r = ThemeManager.dp(ctx, 26);
        sheetBg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
        if (p.isDark) {
            sheetBg.setStroke(ThemeManager.dp(ctx, 1), p.borderCard);
        }
        rootBox.setBackground(sheetBg);

        // Handle pill
        View pill = new View(ctx);
        pill.setBackground(ThemeManager.roundRect(ctx, p.borderInput, 999, 0, 0));
        LinearLayout.LayoutParams plp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 44), ThemeManager.dp(ctx, 4));
        plp.gravity = Gravity.CENTER_HORIZONTAL;
        plp.bottomMargin = ThemeManager.dp(ctx, 12);
        rootBox.addView(pill, plp);

        // Header row: Logo + Title + Close button
        LinearLayout hdr = new LinearLayout(ctx);
        hdr.setOrientation(LinearLayout.HORIZONTAL);
        hdr.setGravity(Gravity.CENTER_VERTICAL);

        FrameLayout logoWrap = new FrameLayout(ctx);
        logoWrap.setBackground(ThemeManager.roundRect(ctx, Color.WHITE, 14, p.borderCard, 1));
        logoWrap.setPadding(ThemeManager.dp(ctx, 2), ThemeManager.dp(ctx, 2), ThemeManager.dp(ctx, 2), ThemeManager.dp(ctx, 2));
        ImageView iv = new ImageView(ctx);
        iv.setImageResource(R.drawable.app_logo_small);
        logoWrap.addView(iv, new FrameLayout.LayoutParams(ThemeManager.dp(ctx, 42), ThemeManager.dp(ctx, 42)));
        hdr.addView(logoWrap);

        LinearLayout titles = new LinearLayout(ctx);
        titles.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        tlp.leftMargin = ThemeManager.dp(ctx, 12);

        TextView tvTitle = new TextView(ctx);
        tvTitle.setText("হিসাব ক্যালকুলেটর সেটিংস");
        tvTitle.setTextSize(17);
        tvTitle.setTypeface(null, Typeface.BOLD);
        tvTitle.setTextColor(p.textPrimary);
        titles.addView(tvTitle);

        TextView tvVer = new TextView(ctx);
        tvVer.setText("সংস্করণ v" + BnFormat.toBnDigits(BuildConfig.VERSION_NAME) + " • বিল্ড #" + BnFormat.toBnNum(BuildConfig.VERSION_CODE));
        tvVer.setTextSize(11.5f);
        tvVer.setTextColor(p.textMuted);
        titles.addView(tvVer);
        hdr.addView(titles, tlp);

        TextView closeBtn = new TextView(ctx);
        closeBtn.setText("✕");
        closeBtn.setTextSize(16);
        closeBtn.setTypeface(null, Typeface.BOLD);
        closeBtn.setTextColor(p.textSecondary);
        closeBtn.setGravity(Gravity.CENTER);
        closeBtn.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 999, 0, 0));
        closeBtn.setOnClickListener(v -> dismiss());
        hdr.addView(closeBtn, new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 36), ThemeManager.dp(ctx, 36)));
        rootBox.addView(hdr);

        // Update available highlight banner
        if (updateInfo != null && updateInfo.hasUpdate) {
            LinearLayout upCard = new LinearLayout(ctx);
            upCard.setOrientation(LinearLayout.VERTICAL);
            upCard.setBackground(ThemeManager.roundRect(
                ctx,
                p.isDark ? Color.parseColor("#2B1A03") : Color.parseColor("#FFFBEB"),
                18,
                Color.parseColor("#F59E0B"),
                1
            ));
            upCard.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12));

            TextView uT = new TextView(ctx);
            uT.setText("🎉 নতুন আপডেট পাওয়া গেছে: v" + BnFormat.toBnDigits(updateInfo.latestVersion));
            uT.setTextSize(14);
            uT.setTypeface(null, Typeface.BOLD);
            uT.setTextColor(p.isDark ? Color.parseColor("#FCD34D") : Color.parseColor("#92400E"));
            upCard.addView(uT);

            TextView uN = new TextView(ctx);
            uN.setText(updateInfo.releaseNotes != null && !updateInfo.releaseNotes.isEmpty()
                ? updateInfo.releaseNotes
                : "নতুন সংস্করণটি ডাউনলোড করে সরাসরি ইনস্টল করতে পারবেন (পূর্বের ডেটা ও হিস্ট্রি মুছবে না)।");
            uN.setTextSize(11.5f);
            uN.setTextColor(p.isDark ? Color.parseColor("#FDE68A") : Color.parseColor("#78350F"));
            upCard.addView(uN, BnUi.marginTop(ctx, 4));

            Button dlBtn = BnUi.makePillButton(ctx, "⬇ এখনই আপডেট ডাউনলোড করুন", Color.parseColor("#D97706"), Color.WHITE, 0, 42);
            dlBtn.setOnClickListener(v -> {
                String url = (updateInfo.apkDownloadUrl != null && !updateInfo.apkDownloadUrl.isEmpty())
                    ? updateInfo.apkDownloadUrl : updateInfo.releasePageUrl;
                NativeTools.openUrl(ctx, url);
            });
            upCard.addView(dlBtn, BnUi.marginTop(ctx, 10));
            rootBox.addView(upCard, BnUi.marginTop(ctx, 12));
        }

        // 1. Font Switcher ("ফন্ট পরিবর্তন করুন")
        FontOption activeFont = ThemeManager.getFontMeta(settings.fontFamily);
        LinearLayout fontCard = new LinearLayout(ctx);
        fontCard.setOrientation(LinearLayout.VERTICAL);
        fontCard.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 18, p.borderCard, 1));
        fontCard.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12));

        LinearLayout fontRow = new LinearLayout(ctx);
        fontRow.setOrientation(LinearLayout.HORIZONTAL);
        fontRow.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout fLeft = new LinearLayout(ctx);
        fLeft.setOrientation(LinearLayout.VERTICAL);
        TextView fTitle = new TextView(ctx);
        fTitle.setText("🔤 ফন্ট পরিবর্তন করুন");
        fTitle.setTextSize(14);
        fTitle.setTypeface(null, Typeface.BOLD);
        fTitle.setTextColor(p.textPrimary);
        fLeft.addView(fTitle);

        TextView fSub = new TextView(ctx);
        fSub.setText("বর্তমান ফন্ট: " + activeFont.nameBn);
        fSub.setTextSize(11.5f);
        fSub.setTextColor(p.textBlueAccent);
        fLeft.addView(fSub, BnUi.marginTop(ctx, 2));
        fontRow.addView(fLeft, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView chev = new TextView(ctx);
        chev.setText(showFontList ? "▲ বন্ধ করুন" : "▼ ফন্ট দেখুন");
        chev.setTextSize(11.5f);
        chev.setTypeface(null, Typeface.BOLD);
        chev.setTextColor(p.softBlueText);
        chev.setBackground(ThemeManager.roundRect(ctx, p.softBlueBg, 999, 0, 0));
        chev.setPadding(ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 6), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 6));
        fontRow.addView(chev);
        fontRow.setOnClickListener(v -> {
            showFontList = !showFontList;
            render();
        });
        fontCard.addView(fontRow);

        if (showFontList) {
            LinearLayout list = new LinearLayout(ctx);
            list.setOrientation(LinearLayout.VERTICAL);
            for (int i = 0; i < ThemeManager.FONT_OPTIONS.length; i++) {
                final FontOption opt = ThemeManager.FONT_OPTIONS[i];
                boolean selected = opt.id.equals(settings.fontFamily);

                LinearLayout optRow = new LinearLayout(ctx);
                optRow.setOrientation(LinearLayout.HORIZONTAL);
                optRow.setGravity(Gravity.CENTER_VERTICAL);
                optRow.setBackground(ThemeManager.roundRect(
                    ctx,
                    selected ? p.softBlueBg : p.bgCard,
                    14,
                    selected ? p.textBlueAccent : p.borderCard,
                    selected ? 1.5f : 1f
                ));
                optRow.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10));

                LinearLayout oCol = new LinearLayout(ctx);
                oCol.setOrientation(LinearLayout.VERTICAL);
                TextView oName = new TextView(ctx);
                oName.setText(opt.nameBn);
                oName.setTextSize(13.5f);
                oName.setTypeface(ThemeManager.getTypeface(ctx, opt.id, true));
                oName.setTextColor(selected ? p.softBlueText : p.textPrimary);
                oCol.addView(oName);

                TextView oSample = new TextView(ctx);
                oSample.setText("নমুনা: আমার সোনার বাংলা — ১২৩৪৫৬৭৮৯০");
                oSample.setTextSize(11.5f);
                oSample.setTypeface(ThemeManager.getTypeface(ctx, opt.id, false));
                oSample.setTextColor(p.textMuted);
                oCol.addView(oSample, BnUi.marginTop(ctx, 2));
                optRow.addView(oCol, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

                if (selected) {
                    TextView chk = new TextView(ctx);
                    chk.setText("✓ নির্বাচিত");
                    chk.setTextSize(11);
                    chk.setTypeface(null, Typeface.BOLD);
                    chk.setTextColor(p.softBlueText);
                    optRow.addView(chk);
                }

                optRow.setOnClickListener(v -> {
                    settings.fontFamily = opt.id;
                    listener.onSettingsUpdated(settings);
                    render();
                });

                LinearLayout.LayoutParams olp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
                );
                olp.topMargin = ThemeManager.dp(ctx, 8);
                list.addView(optRow, olp);
            }
            fontCard.addView(list, BnUi.marginTop(ctx, 6));
            // Apply global UI font first, then preserve individual font previews:
            ThemeManager.applyFontRecursively(fontCard, ctx, settings.fontFamily);
            for (int i = 0; i < list.getChildCount(); i++) {
                View rowV = list.getChildAt(i);
                if (rowV instanceof ViewGroup) {
                    View colV = ((ViewGroup) rowV).getChildAt(0);
                    if (colV instanceof ViewGroup) {
                        FontOption opt = ThemeManager.FONT_OPTIONS[i];
                        View nV = ((ViewGroup) colV).getChildAt(0);
                        View sV = ((ViewGroup) colV).getChildAt(1);
                        if (nV instanceof TextView) ((TextView) nV).setTypeface(ThemeManager.getTypeface(ctx, opt.id, true));
                        if (sV instanceof TextView) ((TextView) sV).setTypeface(ThemeManager.getTypeface(ctx, opt.id, false));
                    }
                }
            }
        }
        if (!showFontList) {
            ThemeManager.applyFontRecursively(fontCard, ctx, settings.fontFamily);
        }
        rootBox.addView(fontCard, BnUi.marginTop(ctx, 12));

        // 2. AMOLED Black Dark Mode Toggle
        rootBox.addView(makeSwitchRow(
            ctx, p,
            "🌙 অ্যামোলেড ব্ল্যাক ডার্ক মোড (AMOLED)",
            "চোখের আরাম ও ব্যাটারি সাশ্রয়ের জন্য পিওর কালো ব্যাকগ্রাউন্ড",
            settings.amoledDark,
            () -> {
                settings.amoledDark = !settings.amoledDark;
                listener.onSettingsUpdated(settings);
                render();
            }
        ), BnUi.marginTop(ctx, 10));

        // 3. Auto Update Check Toggle + Manual Check Button
        LinearLayout updateCard = new LinearLayout(ctx);
        updateCard.setOrientation(LinearLayout.VERTICAL);
        updateCard.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 18, p.borderCard, 1));
        updateCard.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12));

        updateCard.addView(makeSwitchRowInner(
            ctx, p,
            "🔄 স্বয়ংক্রিয় আপডেট নোটিফিকেশন",
            "GitHub Release-এ নতুন APK এলে অ্যাপের মধ্যে জানাবে",
            settings.autoUpdate,
            () -> {
                settings.autoUpdate = !settings.autoUpdate;
                listener.onSettingsUpdated(settings);
                render();
            }
        ));

        Button chkBtn = BnUi.makePillButton(
            ctx,
            checking ? "⏳ আপডেট চেক করা হচ্ছে..." : "🔍 এখনই আপডেট চেক করুন",
            p.softBlueBg, p.softBlueText, 0, 42
        );
        chkBtn.setEnabled(!checking);
        chkBtn.setOnClickListener(v -> {
            checking = true;
            render();
            NativeTools.checkGitHubReleaseUpdate(settings.githubRepo, res -> {
                checking = false;
                updateInfo = res;
                settings.lastCheckedAt = BnFormat.getBnDateTime(System.currentTimeMillis());
                listener.onSettingsUpdated(settings);
                listener.onUpdateChecked(res);
                render();
            });
        });
        updateCard.addView(chkBtn, BnUi.marginTop(ctx, 10));

        if (updateInfo != null && updateInfo.checked && !updateInfo.hasUpdate) {
            TextView upToDate = new TextView(ctx);
            upToDate.setText(updateInfo.error != null && !updateInfo.error.isEmpty()
                ? "⚠ " + updateInfo.error
                : "✅ আপনার অ্যাপটি সর্বশেষ সংস্করণে (v" + BnFormat.toBnDigits(BuildConfig.VERSION_NAME) + ") রয়েছে।");
            upToDate.setTextSize(11.5f);
            upToDate.setTypeface(null, Typeface.BOLD);
            upToDate.setTextColor(updateInfo.error != null && !updateInfo.error.isEmpty() ? p.dangerText : p.emeraldText);
            updateCard.addView(upToDate, BnUi.marginTop(ctx, 8));
        }

        rootBox.addView(updateCard, BnUi.marginTop(ctx, 10));

        // 4. Same Signature Info Card
        LinearLayout sigBox = new LinearLayout(ctx);
        sigBox.setOrientation(LinearLayout.VERTICAL);
        sigBox.setBackground(ThemeManager.roundRect(ctx, p.emeraldBg, 16, p.emeraldBorder, 1));
        sigBox.setPadding(ThemeManager.dp(ctx, 13), ThemeManager.dp(ctx, 11), ThemeManager.dp(ctx, 13), ThemeManager.dp(ctx, 11));

        TextView sigT = new TextView(ctx);
        sigT.setText("🔐 পিওর নেটিভ অ্যান্ড্রয়েড + স্থায়ী সিগনেচার");
        sigT.setTextSize(12.5f);
        sigT.setTypeface(null, Typeface.BOLD);
        sigT.setTextColor(p.emeraldText);
        sigBox.addView(sigT);

        TextView sigD = new TextView(ctx);
        sigD.setText("০-মিলিসেকেন্ডে ফাস্ট ওপেন, সরাসরি Same Keystore সিগনেচার এবং পুরোনো হিস্ট্রি অক্ষত রেখে আপডেট সমর্থিত।");
        sigD.setTextSize(11);
        sigD.setTextColor(p.textSecondary);
        sigBox.addView(sigD, BnUi.marginTop(ctx, 3));
        rootBox.addView(sigBox, BnUi.marginTop(ctx, 10));

        // Apply active font across non-preview controls
        for (int i = 0; i < rootBox.getChildCount(); i++) {
            View child = rootBox.getChildAt(i);
            if (child == fontCard) continue;
            ThemeManager.applyFontRecursively(child, ctx, settings.fontFamily);
        }
    }

    private LinearLayout makeSwitchRow(
        Context ctx, Palette p, String title, String sub, boolean checked, Runnable onToggle
    ) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(ThemeManager.roundRect(ctx, p.bgSecondary, 18, p.borderCard, 1));
        card.setPadding(ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 14), ThemeManager.dp(ctx, 12));
        card.addView(makeSwitchRowInner(ctx, p, title, sub, checked, onToggle));
        return card;
    }

    private LinearLayout makeSwitchRowInner(
        Context ctx, Palette p, String title, String sub, boolean checked, Runnable onToggle
    ) {
        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout left = new LinearLayout(ctx);
        left.setOrientation(LinearLayout.VERTICAL);
        TextView tvT = new TextView(ctx);
        tvT.setText(title);
        tvT.setTextSize(13.5f);
        tvT.setTypeface(null, Typeface.BOLD);
        tvT.setTextColor(p.textPrimary);
        left.addView(tvT);

        TextView tvS = new TextView(ctx);
        tvS.setText(sub);
        tvS.setTextSize(11);
        tvS.setTextColor(p.textMuted);
        left.addView(tvS, BnUi.marginTop(ctx, 2));
        row.addView(left, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        // Custom crisp pill toggle
        FrameLayout track = new FrameLayout(ctx);
        int w = ThemeManager.dp(ctx, 48);
        int h = ThemeManager.dp(ctx, 28);
        track.setBackground(ThemeManager.roundRect(
            ctx,
            checked ? Color.parseColor("#123E6D") : p.segmentBg,
            999,
            checked ? Color.parseColor("#60A5FA") : p.borderInput,
            checked && p.isDark ? 1 : 0
        ));
        View thumb = new View(ctx);
        thumb.setBackground(ThemeManager.roundRect(ctx, Color.WHITE, 999, 0, 0));
        int thumbSize = ThemeManager.dp(ctx, 22);
        FrameLayout.LayoutParams tlp = new FrameLayout.LayoutParams(thumbSize, thumbSize);
        tlp.gravity = Gravity.CENTER_VERTICAL | (checked ? Gravity.END : Gravity.START);
        int m = ThemeManager.dp(ctx, 3);
        tlp.setMargins(m, 0, m, 0);
        track.addView(thumb, tlp);

        LinearLayout.LayoutParams trLp = new LinearLayout.LayoutParams(w, h);
        trLp.leftMargin = ThemeManager.dp(ctx, 10);
        row.addView(track, trLp);
        row.setOnClickListener(v -> onToggle.run());
        return row;
    }
}
