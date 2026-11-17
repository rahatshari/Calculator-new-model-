package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.R;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

public class HomeView {
    private final AppHost host;

    public HomeView(AppHost host) {
        this.host = host;
    }

    public View build() {
        Context ctx = host.getHostContext();
        Palette p = host.getPalette();

        LinearLayout root = new LinearLayout(ctx);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_VERTICAL);
        root.setPadding(ThemeManager.dp(ctx, 4), ThemeManager.dp(ctx, 16), ThemeManager.dp(ctx, 4), ThemeManager.dp(ctx, 16));

        root.addView(makeCard(ctx, p, "land", "জমির হিসাব", "📐", false,
            p.isDark ? Color.parseColor("#0F1F3D") : Color.parseColor("#D6E3FF"),
            p.isDark ? Color.parseColor("#93C5FD") : Color.parseColor("#001B3D"), 0));

        root.addView(makeCard(ctx, p, "nol", "নলের হিসাব", "", true,
            p.isDark ? Color.parseColor("#062E22") : Color.parseColor("#D0F4EA"),
            p.isDark ? Color.parseColor("#6EE7B7") : Color.parseColor("#002119"), 14));

        root.addView(makeCard(ctx, p, "soil", "মাটির হিসাব", "⛰️", false,
            p.isDark ? Color.parseColor("#362204") : Color.parseColor("#FFDEA8"),
            p.isDark ? Color.parseColor("#FCD34D") : Color.parseColor("#271900"), 14));

        root.addView(makeCard(ctx, p, "timber", "গাছ ও কাঠের হিসাব", "🪵", false,
            p.isDark ? Color.parseColor("#381A05") : Color.parseColor("#FFDCC3"),
            p.isDark ? Color.parseColor("#FDBA74") : Color.parseColor("#2E1500"), 14));

        root.addView(makeCard(ctx, p, "converter", "একক পরিবর্তন", "📏", false,
            p.isDark ? Color.parseColor("#042F2E") : Color.parseColor("#CCFBF1"),
            p.isDark ? Color.parseColor("#5EEAD4") : Color.parseColor("#115E59"), 14));

        return root;
    }

    private View makeCard(
        Context ctx, Palette p, String screenId, String title, String emoji,
        boolean useLathiDrawable, int iconBg, int iconText, int topMarginDp
    ) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setBackground(ThemeManager.roundRect(ctx, p.bgCard, 26, p.borderCard, 1));
        int pad = ThemeManager.dp(ctx, 18);
        card.setPadding(pad, pad, pad, pad);

        LinearLayout iconBox = new LinearLayout(ctx);
        iconBox.setGravity(Gravity.CENTER);
        iconBox.setBackground(ThemeManager.roundRect(ctx, iconBg, 20, 0, 0));
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 56), ThemeManager.dp(ctx, 56));

        if (useLathiDrawable) {
            ImageView iv = new ImageView(ctx);
            iv.setImageResource(R.drawable.ic_lathi);
            iconBox.addView(iv, new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 36), ThemeManager.dp(ctx, 36)));
        } else {
            TextView tvEmoji = new TextView(ctx);
            tvEmoji.setText(emoji);
            tvEmoji.setTextSize(24);
            tvEmoji.setTextColor(iconText);
            tvEmoji.setGravity(Gravity.CENTER);
            iconBox.addView(tvEmoji);
        }
        card.addView(iconBox, ilp);

        TextView tvTitle = new TextView(ctx);
        tvTitle.setText(title);
        tvTitle.setTextSize(18);
        tvTitle.setTypeface(null, Typeface.BOLD);
        tvTitle.setTextColor(p.textPrimary);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        tlp.leftMargin = ThemeManager.dp(ctx, 16);
        card.addView(tvTitle, tlp);

        TextView arrow = new TextView(ctx);
        arrow.setText("›");
        arrow.setTextSize(22);
        arrow.setTypeface(null, Typeface.BOLD);
        arrow.setTextColor(p.textMuted);
        arrow.setGravity(Gravity.CENTER);
        arrow.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 999, 0, 0));
        card.addView(arrow, new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 40), ThemeManager.dp(ctx, 40)));

        card.setOnClickListener(v -> host.navigateTo(screenId));

        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        if (topMarginDp > 0) clp.topMargin = ThemeManager.dp(ctx, topMarginDp);
        card.setLayoutParams(clp);
        return card;
    }
}
