package com.rahatsharif.hisabcalculator.util;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Calendar;
import java.util.Locale;

public final class BnFormat {
    public static final char[] BN_DIGITS = {'০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'};
    public static final char[] EN_DIGITS = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'};

    private BnFormat() {}

    public static String toBnDigits(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(BN_DIGITS[c - '0']);
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    public static String toBnNum(int val) {
        return toBnDigits(Integer.toString(val));
    }

    public static String toBnNum(double val, int decimals) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return "০";
        String fmt = String.format(Locale.US, "%." + Math.max(0, decimals) + "f", val);
        return toBnDigits(fmt);
    }

    public static String toBnNumTrim(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return "০";
        if (Math.abs(val - Math.rint(val)) < 1e-9) {
            return toBnDigits(Long.toString(Math.round(val)));
        }
        DecimalFormat df = new DecimalFormat("0.######", DecimalFormatSymbols.getInstance(Locale.US));
        return toBnDigits(df.format(val));
    }

    /**
     * আঙুলের জন্য: পূর্ণসংখ্যা হলে কোনো দশমিক দেখাবে না (১, ২, ৩),
     * এবং ভগ্নাংশ থাকলে শুধুমাত্র প্রয়োজনীয় দশমিক দেখাবে (যেমন ১.৫)।
     */
    public static String toBnAngul(double val) {
        if (Double.isNaN(val) || val == 0.0) return "০";
        double rounded = Math.round(val * 10.0) / 10.0;
        if (Math.abs(rounded - Math.rint(rounded)) < 1e-9) {
            return toBnDigits(Long.toString(Math.round(rounded)));
        }
        String s = String.format(Locale.US, "%.1f", rounded).replaceAll("\\.0$", "");
        return toBnDigits(s);
    }

    public static String toBnConverterNum(double val, int minDec) {
        if (Double.isNaN(val) || Double.isInfinite(val) || Math.abs(val) < 1e-12) {
            return toBnDigits(String.format(Locale.US, "%." + Math.max(0, minDec) + "f", 0.0));
        }
        double abs = Math.abs(val);
        int maxDec;
        if (abs < 0.0001) {
            maxDec = 7;
        } else if (abs < 100.0) {
            maxDec = Math.max(minDec, 4);
        } else {
            maxDec = Math.max(minDec, 3);
        }
        String raw = String.format(Locale.US, "%." + maxDec + "f", val);
        // Trim trailing zeros beyond minDec while keeping at least minDec decimal places
        int dot = raw.indexOf('.');
        if (dot >= 0) {
            int keepEnd = raw.length();
            while (keepEnd - 1 > dot + minDec && raw.charAt(keepEnd - 1) == '0') {
                keepEnd--;
            }
            if (keepEnd - 1 == dot && minDec == 0) {
                keepEnd--;
            }
            raw = raw.substring(0, keepEnd);
        }
        return toBnDigits(raw);
    }

    public static double parseBnNum(String raw) {
        if (raw == null) return 0.0;
        StringBuilder en = new StringBuilder();
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            int bnIdx = -1;
            for (int d = 0; d < 10; d++) {
                if (c == BN_DIGITS[d]) {
                    bnIdx = d;
                    break;
                }
            }
            if (bnIdx != -1) {
                en.append(EN_DIGITS[bnIdx]);
            } else if ((c >= '0' && c <= '9') || c == '.' || c == '-') {
                en.append(c);
            }
        }
        String s = en.toString().trim();
        if (s.isEmpty() || ".".equals(s) || "-".equals(s)) return 0.0;
        try {
            double v = Double.parseDouble(s);
            return Double.isNaN(v) ? 0.0 : v;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    public static String normalizeBnInput(String raw) {
        if (raw == null || raw.isEmpty()) return "";
        StringBuilder out = new StringBuilder(raw.length());
        boolean hasDot = false;
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (c >= '0' && c <= '9') {
                out.append(BN_DIGITS[c - '0']);
                continue;
            }
            boolean isBn = false;
            for (int d = 0; d < 10; d++) {
                if (c == BN_DIGITS[d]) {
                    isBn = true;
                    break;
                }
            }
            if (isBn) {
                out.append(c);
            } else if ((c == '.' || c == '।') && !hasDot) {
                out.append('.');
                hasDot = true;
            }
        }
        return out.toString();
    }

    public static String formatBnCurrency(double amount) {
        if (Double.isNaN(amount) || Double.isInfinite(amount)) amount = 0.0;
        String rounded = String.format(Locale.US, "%.2f", Math.max(0.0, amount));
        int dotIdx = rounded.indexOf('.');
        String intPart = rounded.substring(0, dotIdx);
        String decPart = rounded.substring(dotIdx + 1);

        String formattedInt;
        if (intPart.length() <= 3) {
            formattedInt = intPart;
        } else {
            String lastThree = intPart.substring(intPart.length() - 3);
            String other = intPart.substring(0, intPart.length() - 3);
            StringBuilder rev = new StringBuilder();
            int count = 0;
            for (int i = other.length() - 1; i >= 0; i--) {
                rev.append(other.charAt(i));
                count++;
                if (count % 2 == 0 && i != 0) {
                    rev.append(',');
                }
            }
            formattedInt = rev.reverse().toString() + "," + lastThree;
        }
        return "৳ " + toBnDigits(formattedInt) + "." + toBnDigits(decPart);
    }

    public static String getBnDateTime(long timeMillis) {
        String[] months = {
            "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
            "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
        };
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(timeMillis);
        int day = cal.get(Calendar.DAY_OF_MONTH);
        String month = months[cal.get(Calendar.MONTH)];
        int year = cal.get(Calendar.YEAR);
        int hour24 = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);
        String ampm = hour24 >= 12 ? "অপরাহ্ন" : "পূর্বাহ্ন";
        int hour12 = hour24 % 12;
        if (hour12 == 0) hour12 = 12;
        String minStr = String.format(Locale.US, "%02d", minute);
        return toBnNum(day) + " " + month + ", " + toBnNum(year) + " (" + ampm + " " + toBnNum(hour12) + ":" + toBnDigits(minStr) + ")";
    }
}
