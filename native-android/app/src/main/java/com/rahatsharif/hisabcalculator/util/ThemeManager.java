package com.rahatsharif.hisabcalculator.util;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import java.util.HashMap;
import java.util.Map;

public final class ThemeManager {
    public static class Palette {
        public boolean isDark;
        public int bgApp;
        public int bgHeader;
        public int bgCard;
        public int bgSecondary;
        public int bgInput;
        public int bgInputFocus;
        public int borderCard;
        public int borderInput;
        public int divider;
        public int textPrimary;
        public int textSecondary;
        public int textMuted;
        public int textBlueAccent;
        public int primaryBtnBg;
        public int primaryBtnText;
        public int softBlueBg;
        public int softBlueText;
        public int segmentBg;
        public int dangerBg;
        public int dangerText;
        public int emeraldText;
        public int emeraldBg;
        public int emeraldBorder;
    }

    public static class FontOption {
        public final String id;
        public final String nameBn;
        public final String subtitleBn;
        public final String regularAsset;
        public final String boldAsset;
        public final boolean isVariable;

        public FontOption(String id, String nameBn, String subtitleBn, String regularAsset, String boldAsset, boolean isVariable) {
            this.id = id;
            this.nameBn = nameBn;
            this.subtitleBn = subtitleBn;
            this.regularAsset = regularAsset;
            this.boldAsset = boldAsset;
            this.isVariable = isVariable;
        }
    }

    public static final FontOption[] FONT_OPTIONS = {
        new FontOption("anek", "অনেক বাংলা (Anek Bangla)", "আধুনিক ও ঝকঝকে মোবাইল ফন্ট", "fonts/AnekBangla.ttf", "fonts/AnekBangla.ttf", true),
        new FontOption("noto", "নোটো সান্স (Noto Sans Bengali)", "গুগল স্ট্যান্ডার্ড ক্লিন ফন্ট", "fonts/NotoSansBengali.ttf", "fonts/NotoSansBengali.ttf", true),
        new FontOption("baloo", "বালু দা ২ (Baloo Da 2)", "রাউন্ডেড ও আধুনিক ডিসপ্লে ফন্ট", "fonts/BalooDa2.ttf", "fonts/BalooDa2.ttf", true),
        new FontOption("hind", "হিন্দ শিলিগুড়ি (Hind Siliguri)", "ক্লাসিক কম্প্যাক্ট ইউআই ফন্ট", "fonts/HindSiliguri-Regular.ttf", "fonts/HindSiliguri-Bold.ttf", false),
        new FontOption("tiro", "তিরো বাংলা (Tiro Bangla)", "ঐতিহ্যবাহী দলিল ও পুস্তক ফন্ট", "fonts/TiroBangla-Regular.ttf", "fonts/TiroBangla-Regular.ttf", false)
    };

    private static final Map<String, Typeface> FONT_CACHE = new HashMap<>();

    private ThemeManager() {}

    public static Palette getPalette(boolean amoledDark) {
        Palette p = new Palette();
        p.isDark = amoledDark;
        if (amoledDark) {
            p.bgApp = Color.parseColor("#000000");
            p.bgHeader = Color.parseColor("#050A12");
            p.bgCard = Color.parseColor("#0B0C0E");
            p.bgSecondary = Color.parseColor("#12151B");
            p.bgInput = Color.parseColor("#12151B");
            p.bgInputFocus = Color.parseColor("#05070A");
            p.borderCard = Color.parseColor("#1F242D");
            p.borderInput = Color.parseColor("#262C36");
            p.divider = Color.parseColor("#2C3444");
            p.textPrimary = Color.parseColor("#F8FAFC");
            p.textSecondary = Color.parseColor("#CBD5E1");
            p.textMuted = Color.parseColor("#94A3B8");
            p.textBlueAccent = Color.parseColor("#60A5FA");
            p.primaryBtnBg = Color.parseColor("#123E6D");
            p.primaryBtnText = Color.parseColor("#FFFFFF");
            p.softBlueBg = Color.parseColor("#0F1F3D");
            p.softBlueText = Color.parseColor("#93C5FD");
            p.segmentBg = Color.parseColor("#12151B");
            p.dangerBg = Color.parseColor("#2B0D12");
            p.dangerText = Color.parseColor("#FCA5A5");
            p.emeraldText = Color.parseColor("#6EE7B7");
            p.emeraldBg = Color.parseColor("#062E22");
            p.emeraldBorder = Color.parseColor("#065F46");
        } else {
            p.bgApp = Color.parseColor("#F1F5F9");
            p.bgHeader = Color.parseColor("#123E6D");
            p.bgCard = Color.parseColor("#FFFFFF");
            p.bgSecondary = Color.parseColor("#F8FAFC");
            p.bgInput = Color.parseColor("#F1F5F9");
            p.bgInputFocus = Color.parseColor("#FFFFFF");
            p.borderCard = Color.parseColor("#E2E8F0");
            p.borderInput = Color.parseColor("#DCE3EC");
            p.divider = Color.parseColor("#CBD5E1");
            p.textPrimary = Color.parseColor("#0F172A");
            p.textSecondary = Color.parseColor("#334155");
            p.textMuted = Color.parseColor("#64748B");
            p.textBlueAccent = Color.parseColor("#123E6D");
            p.primaryBtnBg = Color.parseColor("#123E6D");
            p.primaryBtnText = Color.parseColor("#FFFFFF");
            p.softBlueBg = Color.parseColor("#D6E3FF");
            p.softBlueText = Color.parseColor("#001B3D");
            p.segmentBg = Color.parseColor("#E2E8F0");
            p.dangerBg = Color.parseColor("#FEF2F2");
            p.dangerText = Color.parseColor("#DC2626");
            p.emeraldText = Color.parseColor("#047857");
            p.emeraldBg = Color.parseColor("#ECFDF5");
            p.emeraldBorder = Color.parseColor("#A7F3D0");
        }
        return p;
    }

    public static FontOption getFontMeta(String fontId) {
        for (FontOption o : FONT_OPTIONS) {
            if (o.id.equals(fontId)) return o;
        }
        return FONT_OPTIONS[0];
    }

    public static Typeface getTypeface(Context ctx, String fontId, boolean bold) {
        String key = fontId + "_" + (bold ? "b" : "r");
        Typeface cached = FONT_CACHE.get(key);
        if (cached != null) return cached;

        FontOption meta = getFontMeta(fontId);
        AssetManager am = ctx.getAssets();
        Typeface loaded = null;
        String path = bold ? meta.boldAsset : meta.regularAsset;
        try {
            if (meta.isVariable && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                String variation = bold ? "'wght' 700" : "'wght' 500";
                loaded = new Typeface.Builder(am, path)
                    .setFontVariationSettings(variation)
                    .build();
            } else {
                Typeface base = Typeface.createFromAsset(am, path);
                loaded = bold ? Typeface.create(base, Typeface.BOLD) : base;
            }
        } catch (Throwable ignored) {
            loaded = null;
        }

        if (loaded == null) {
            Typeface fallback = "tiro".equals(meta.id) ? Typeface.SERIF : Typeface.SANS_SERIF;
            loaded = bold ? Typeface.create(fallback, Typeface.BOLD) : fallback;
        }
        FONT_CACHE.put(key, loaded);
        return loaded;
    }

    public static void applyFontRecursively(View root, Context ctx, String fontId) {
        if (root instanceof TextView) {
            TextView tv = (TextView) root;
            Typeface cur = tv.getTypeface();
            boolean isBold = cur != null && cur.isBold();
            tv.setTypeface(getTypeface(ctx, fontId, isBold));
        } else if (root instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) root;
            for (int i = 0; i < vg.getChildCount(); i++) {
                applyFontRecursively(vg.getChildAt(i), ctx, fontId);
            }
        }
    }

    public static int dp(Context ctx, float dp) {
        return Math.round(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, dp, ctx.getResources().getDisplayMetrics()
        ));
    }

    public static GradientDrawable roundRect(Context ctx, int fillColor, float radiusDp, int strokeColor, float strokeDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setShape(GradientDrawable.RECTANGLE);
        gd.setColor(fillColor);
        gd.setCornerRadius(dp(ctx, radiusDp));
        if (strokeDp > 0 && strokeColor != 0) {
            gd.setStroke(Math.max(1, dp(ctx, strokeDp)), strokeColor);
        }
        return gd;
    }

    public static GradientDrawable dashedRoundRect(Context ctx, int fillColor, float radiusDp, int strokeColor) {
        GradientDrawable gd = new GradientDrawable();
        gd.setShape(GradientDrawable.RECTANGLE);
        gd.setColor(fillColor);
        gd.setCornerRadius(dp(ctx, radiusDp));
        gd.setStroke(dp(ctx, 1.2f), strokeColor, dp(ctx, 5), dp(ctx, 4));
        return gd;
    }

    public static GradientDrawable gradientCard(Context ctx, int startColor, int endColor, float radiusDp) {
        GradientDrawable gd = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            new int[]{startColor, endColor}
        );
        gd.setShape(GradientDrawable.RECTANGLE);
        gd.setCornerRadius(dp(ctx, radiusDp));
        return gd;
    }
}
