package com.rahatsharif.hisabcalculator.util;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.text.TextUtils;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.rahatsharif.hisabcalculator.BuildConfig;
import com.rahatsharif.hisabcalculator.data.AppStorage.DetailItem;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class NativeTools {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static WebView printWebViewRef;

    private NativeTools() {}

    public static class PrintableReport {
        public String title;
        public String subtitle;
        public String dateTime;
        public String note;
        public String inputsText;
        public String summaryPrimary;
        public String summarySecondary;
        public List<DetailItem> details;
    }

    public static class UpdateCheckResult {
        public boolean checked;
        public boolean hasUpdate;
        public String currentVersion;
        public String latestVersion;
        public int latestBuildNumber;
        public String apkDownloadUrl;
        public String releasePageUrl;
        public String releaseNotes;
        public String error;
    }

    public interface UpdateCallback {
        void onResult(UpdateCheckResult result);
    }

    public static void copyToClipboard(Context ctx, String text) {
        ClipboardManager cm = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("হিসাব ক্যালকুলেটর", text));
        }
    }

    public static void shareText(Context ctx, String title, String text) {
        String safeTitle = (title != null && !title.isEmpty()) ? title : "হিসাব ক্যালকুলেটর";
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_SUBJECT, safeTitle);
        send.putExtra(Intent.EXTRA_TEXT, text != null ? text : "");
        Intent chooser = Intent.createChooser(send, safeTitle);
        if (!(ctx instanceof Activity)) {
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        }
        ctx.startActivity(chooser);
    }

    public static void openUrl(Context ctx, String url) {
        if (url == null || url.isEmpty()) return;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            if (!(ctx instanceof Activity)) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            }
            ctx.startActivity(i);
        } catch (Throwable ignored) {
        }
    }

    public static void printReport(final Activity activity, final PrintableReport report) {
        if (activity == null || report == null) return;
        final String jobName = "হিসাব_ক্যালকুলেটর_" + (report.title != null ? report.title : "রিপোর্ট");
        final String html = buildPrintableHtml(report);

        activity.runOnUiThread(() -> {
            WebView wv = new WebView(activity);
            printWebViewRef = wv;
            wv.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    PrintManager pm = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                    if (pm != null) {
                        PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName);
                        pm.print(jobName, adapter, new PrintAttributes.Builder().build());
                    }
                    printWebViewRef = null;
                }
            });
            wv.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }

    private static String esc(String s) {
        if (s == null) return "";
        return TextUtils.htmlEncode(s);
    }

    private static String buildPrintableHtml(PrintableReport r) {
        String date = (r.dateTime != null && !r.dateTime.isEmpty())
            ? r.dateTime
            : BnFormat.getBnDateTime(System.currentTimeMillis());

        StringBuilder rows = new StringBuilder();
        if (r.details != null) {
            for (int i = 0; i < r.details.size(); i++) {
                DetailItem d = r.details.get(i);
                rows.append("<tr>")
                    .append("<td>").append(esc(BnFormat.toBnNum(i + 1))).append("</td>")
                    .append("<td>").append(esc(d.label)).append("</td>")
                    .append("<td style='text-align:right;font-weight:700;'>").append(esc(d.value)).append("</td>")
                    .append("</tr>");
            }
        }

        StringBuilder noteSection = new StringBuilder();
        if ((r.note != null && !r.note.isEmpty()) || (r.inputsText != null && !r.inputsText.isEmpty())) {
            noteSection.append("<div class='box'>");
            if (r.note != null && !r.note.isEmpty()) {
                noteSection.append("<div style='font-weight:700;margin-bottom:4px;'>📝 নাম / নোট: ").append(esc(r.note)).append("</div>");
            }
            if (r.inputsText != null && !r.inputsText.isEmpty()) {
                noteSection.append("<div><strong>প্রদত্ত মাপসমূহ:</strong> ").append(esc(r.inputsText)).append("</div>");
            }
            noteSection.append("</div>");
        }

        StringBuilder summarySection = new StringBuilder();
        if ((r.summaryPrimary != null && !r.summaryPrimary.isEmpty()) || (r.summarySecondary != null && !r.summarySecondary.isEmpty())) {
            summarySection.append("<div class='summary-box'>");
            if (r.summaryPrimary != null && !r.summaryPrimary.isEmpty()) {
                summarySection.append("<div><div class='lbl'>প্রধান ফলাফল</div><div class='val-big'>").append(esc(r.summaryPrimary)).append("</div></div>");
            }
            if (r.summarySecondary != null && !r.summarySecondary.isEmpty()) {
                summarySection.append("<div style='text-align:right;'><div class='lbl'>আনুষঙ্গিক ফলাফল / মূল্য</div><div class='val-sub'>").append(esc(r.summarySecondary)).append("</div></div>");
            }
            summarySection.append("</div>");
        }

        return "<!doctype html><html lang='bn'><head><meta charset='UTF-8'/>"
            + "<style>"
            + "body{font-family:sans-serif;background:#fff;color:#000;margin:0;padding:16px;}"
            + ".wrap{border:1.5px solid #000;border-radius:10px;padding:16px;}"
            + ".head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:12px;}"
            + ".title{font-size:20px;font-weight:800;margin:0;}"
            + ".sub{font-size:12px;font-weight:700;margin:2px 0 0;}"
            + ".date{text-align:right;font-size:11px;}"
            + ".box{border:1px solid #000;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;}"
            + ".summary-box{border:2px solid #000;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;}"
            + ".lbl{font-size:11px;font-weight:700;}.val-big{font-size:18px;font-weight:800;}.val-sub{font-size:13px;font-weight:700;}"
            + "table{width:100%;border-collapse:collapse;margin-top:6px;font-size:12px;}"
            + "th,td{border:1px solid #000;padding:7px 8px;text-align:left;}"
            + "th{background:#f8fafc;font-weight:800;}"
            + ".foot{border-top:1px solid #000;margin-top:14px;padding-top:8px;text-align:center;font-size:11px;font-weight:700;}"
            + "</style></head><body><div class='wrap'>"
            + "<div class='head'><div><h1 class='title'>হিসাব ক্যালকুলেটর</h1><p class='sub'>"
            + esc(r.title) + " — " + esc(r.subtitle)
            + "</p></div><div class='date'><strong>তারিখ ও সময়:</strong><br/>" + esc(date) + "</div></div>"
            + noteSection.toString()
            + summarySection.toString()
            + "<table><thead><tr><th>নং</th><th>বিবরণ / একক</th><th style='text-align:right;'>পরিমাণ / ফলাফল</th></tr></thead>"
            + "<tbody>" + rows.toString() + "</tbody></table>"
            + "<div class='foot'>হিসাব ক্যালকুলেটর দ্বারা প্রস্তুতকৃত হিসাব বিবরণী</div>"
            + "</div></body></html>";
    }

    public static int compareVersions(String a, String b) {
        String[] pa = a.replaceAll("^[vV]", "").trim().split("\\.");
        String[] pb = b.replaceAll("^[vV]", "").trim().split("\\.");
        int len = Math.max(pa.length, pb.length);
        for (int i = 0; i < len; i++) {
            int va = 0, vb = 0;
            try { if (i < pa.length) va = Integer.parseInt(pa[i]); } catch (NumberFormatException ignored) {}
            try { if (i < pb.length) vb = Integer.parseInt(pb[i]); } catch (NumberFormatException ignored) {}
            if (va > vb) return 1;
            if (va < vb) return -1;
        }
        return 0;
    }

    public static void checkGitHubReleaseUpdate(final String repo, final UpdateCallback cb) {
        final Handler main = new Handler(Looper.getMainLooper());
        EXECUTOR.execute(() -> {
            UpdateCheckResult res = new UpdateCheckResult();
            res.currentVersion = BuildConfig.VERSION_NAME;
            res.latestVersion = BuildConfig.VERSION_NAME;
            res.latestBuildNumber = BuildConfig.VERSION_CODE;
            res.releasePageUrl = "https://github.com/" + repo + "/releases";
            res.apkDownloadUrl = "";

            if (repo == null || !repo.contains("/")) {
                main.post(() -> cb.onResult(res));
                return;
            }

            HttpURLConnection conn = null;
            try {
                URL url = new URL("https://api.github.com/repos/" + repo + "/releases/latest");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setRequestProperty("Accept", "application/vnd.github+json");
                conn.setRequestProperty("User-Agent", "HisabCalculator-Android");

                int code = conn.getResponseCode();
                res.checked = true;
                if (code == 200) {
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    br.close();

                    JSONObject json = new JSONObject(sb.toString());
                    String rawTag = json.optString("tag_name", json.optString("name", BuildConfig.VERSION_NAME));
                    String latestVer = rawTag.replaceAll("^[vV]", "").trim();
                    if (latestVer.isEmpty()) latestVer = BuildConfig.VERSION_NAME;
                    res.latestVersion = latestVer;

                    String[] parts = latestVer.split("\\.");
                    try {
                        res.latestBuildNumber = Integer.parseInt(parts[parts.length - 1]);
                    } catch (NumberFormatException ignored) {
                        res.latestBuildNumber = BuildConfig.VERSION_CODE;
                    }

                    JSONArray assets = json.optJSONArray("assets");
                    if (assets != null) {
                        for (int i = 0; i < assets.length(); i++) {
                            JSONObject asset = assets.optJSONObject(i);
                            if (asset != null) {
                                String name = asset.optString("name", "");
                                if (name.toLowerCase().endsWith(".apk")) {
                                    res.apkDownloadUrl = asset.optString("browser_download_url", "");
                                    break;
                                }
                            }
                        }
                    }
                    res.releasePageUrl = json.optString("html_url", "https://github.com/" + repo + "/releases/latest");
                    if (res.apkDownloadUrl.isEmpty()) res.apkDownloadUrl = res.releasePageUrl;
                    res.releaseNotes = json.optString("body", "নতুন সংস্করণে পারফরম্যান্স ও ফিচার উন্নত করা হয়েছে।");
                    res.hasUpdate = compareVersions(latestVer, BuildConfig.VERSION_NAME) > 0
                        || res.latestBuildNumber > BuildConfig.VERSION_CODE;
                }
            } catch (Throwable t) {
                res.error = "ইন্টারনেট সংযোগ পাওয়া যায়নি (অফলাইন মোড)";
            } finally {
                if (conn != null) conn.disconnect();
            }
            main.post(() -> cb.onResult(res));
        });
    }
}
