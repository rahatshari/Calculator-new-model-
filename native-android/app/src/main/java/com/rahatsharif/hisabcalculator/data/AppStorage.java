package com.rahatsharif.hisabcalculator.data;

import android.content.Context;
import android.content.SharedPreferences;

import com.rahatsharif.hisabcalculator.BuildConfig;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.Calculators.TimberItem;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class AppStorage {
    private static final String PREFS_NAME = "hisab_native_prefs_v1";
    private static final String KEY_HISTORY = "history_json";
    private static final String KEY_TIMBER = "timber_json";
    private static final String KEY_FONT = "font_id";
    private static final String KEY_AMOLED = "amoled_dark";
    private static final String KEY_AUTO_UPDATE = "auto_update";
    private static final String KEY_LAST_CHECK = "last_check_at";

    private AppStorage() {}

    public static class DetailItem {
        public final String label;
        public final String value;

        public DetailItem(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    public static class HistoryRecord {
        public String id;
        public String category;      // land, nol, soil, timber
        public String categoryLabel;
        public String subTypeLabel;
        public String timestamp;
        public long createdAt;
        public String note;
        public String summaryPrimary;
        public String summarySecondary;
        public String inputsText;
        public List<DetailItem> details = new ArrayList<>();
    }

    public static class AppSettings {
        public String fontFamily = "anek";
        public boolean amoledDark = false;
        public boolean autoUpdate = true;
        public String lastCheckedAt = "";
        public String githubRepo = BuildConfig.GITHUB_REPO;
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static AppSettings loadSettings(Context ctx) {
        SharedPreferences p = prefs(ctx);
        AppSettings s = new AppSettings();
        s.fontFamily = p.getString(KEY_FONT, "anek");
        s.amoledDark = p.getBoolean(KEY_AMOLED, false);
        s.autoUpdate = p.getBoolean(KEY_AUTO_UPDATE, true);
        s.lastCheckedAt = p.getString(KEY_LAST_CHECK, BnFormat.getBnDateTime(System.currentTimeMillis()));
        s.githubRepo = BuildConfig.GITHUB_REPO;
        return s;
    }

    public static void saveSettings(Context ctx, AppSettings s) {
        prefs(ctx).edit()
            .putString(KEY_FONT, s.fontFamily)
            .putBoolean(KEY_AMOLED, s.amoledDark)
            .putBoolean(KEY_AUTO_UPDATE, s.autoUpdate)
            .putString(KEY_LAST_CHECK, s.lastCheckedAt)
            .apply();
    }

    public static List<HistoryRecord> loadHistory(Context ctx) {
        List<HistoryRecord> list = new ArrayList<>();
        String raw = prefs(ctx).getString(KEY_HISTORY, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                HistoryRecord r = new HistoryRecord();
                r.id = o.optString("id", "");
                r.category = o.optString("category", "land");
                r.categoryLabel = o.optString("categoryLabel", "");
                r.subTypeLabel = o.optString("subTypeLabel", "");
                r.timestamp = o.optString("timestamp", "");
                r.createdAt = o.optLong("createdAt", 0L);
                r.note = o.optString("note", "");
                r.summaryPrimary = o.optString("summaryPrimary", "");
                r.summarySecondary = o.optString("summarySecondary", "");
                r.inputsText = o.optString("inputsText", "");
                JSONArray dets = o.optJSONArray("details");
                if (dets != null) {
                    for (int j = 0; j < dets.length(); j++) {
                        JSONObject d = dets.optJSONObject(j);
                        if (d != null) {
                            r.details.add(new DetailItem(d.optString("label", ""), d.optString("value", "")));
                        }
                    }
                }
                list.add(r);
            }
        } catch (JSONException ignored) {
        }
        return list;
    }

    public static void saveHistory(Context ctx, List<HistoryRecord> list) {
        JSONArray arr = new JSONArray();
        int limit = Math.min(list.size(), 200);
        for (int i = 0; i < limit; i++) {
            HistoryRecord r = list.get(i);
            JSONObject o = new JSONObject();
            try {
                o.put("id", r.id);
                o.put("category", r.category);
                o.put("categoryLabel", r.categoryLabel);
                o.put("subTypeLabel", r.subTypeLabel);
                o.put("timestamp", r.timestamp);
                o.put("createdAt", r.createdAt);
                o.put("note", r.note != null ? r.note : "");
                o.put("summaryPrimary", r.summaryPrimary);
                o.put("summarySecondary", r.summarySecondary);
                o.put("inputsText", r.inputsText);
                JSONArray dets = new JSONArray();
                for (DetailItem d : r.details) {
                    JSONObject dj = new JSONObject();
                    dj.put("label", d.label);
                    dj.put("value", d.value);
                    dets.put(dj);
                }
                o.put("details", dets);
                arr.put(o);
            } catch (JSONException ignored) {
            }
        }
        prefs(ctx).edit().putString(KEY_HISTORY, arr.toString()).apply();
    }

    public static List<HistoryRecord> addHistoryRecord(Context ctx, HistoryRecord rec) {
        long now = System.currentTimeMillis();
        rec.id = "rec_" + now + "_" + (int) (Math.random() * 10000);
        rec.createdAt = now;
        rec.timestamp = BnFormat.getBnDateTime(now);
        List<HistoryRecord> current = loadHistory(ctx);
        current.add(0, rec);
        if (current.size() > 200) {
            current = new ArrayList<>(current.subList(0, 200));
        }
        saveHistory(ctx, current);
        return current;
    }

    public static List<TimberItem> loadTimberCart(Context ctx) {
        List<TimberItem> list = new ArrayList<>();
        String raw = prefs(ctx).getString(KEY_TIMBER, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                TimberItem item = new TimberItem();
                item.id = o.optString("id", "");
                item.type = o.optString("type", "round");
                item.description = o.optString("description", "");
                item.quantity = o.optInt("quantity", 1);
                item.unitCft = o.optDouble("unitCft", 0);
                item.totalCft = o.optDouble("totalCft", 0);
                item.ratePerCft = o.optDouble("ratePerCft", 0);
                item.totalPrice = o.optDouble("totalPrice", 0);
                list.add(item);
            }
        } catch (JSONException ignored) {
        }
        return list;
    }

    public static void saveTimberCart(Context ctx, List<TimberItem> items) {
        JSONArray arr = new JSONArray();
        for (TimberItem item : items) {
            JSONObject o = new JSONObject();
            try {
                o.put("id", item.id);
                o.put("type", item.type);
                o.put("description", item.description);
                o.put("quantity", item.quantity);
                o.put("unitCft", item.unitCft);
                o.put("totalCft", item.totalCft);
                o.put("ratePerCft", item.ratePerCft);
                o.put("totalPrice", item.totalPrice);
                arr.put(o);
            } catch (JSONException ignored) {
            }
        }
        prefs(ctx).edit().putString(KEY_TIMBER, arr.toString()).apply();
    }
}
