package com.rahatsharif.hisabcalculator;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.rahatsharif.hisabcalculator.data.AppStorage;
import com.rahatsharif.hisabcalculator.data.AppStorage.AppSettings;
import com.rahatsharif.hisabcalculator.data.AppStorage.HistoryRecord;
import com.rahatsharif.hisabcalculator.ui.AppHost;
import com.rahatsharif.hisabcalculator.ui.HistoryView;
import com.rahatsharif.hisabcalculator.ui.HomeView;
import com.rahatsharif.hisabcalculator.ui.LandCalculatorView;
import com.rahatsharif.hisabcalculator.ui.NolCalculatorView;
import com.rahatsharif.hisabcalculator.ui.SettingsDialog;
import com.rahatsharif.hisabcalculator.ui.SoilCalculatorView;
import com.rahatsharif.hisabcalculator.ui.TimberCalculatorView;
import com.rahatsharif.hisabcalculator.ui.UnitConverterView;
import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.NativeTools;
import com.rahatsharif.hisabcalculator.util.NativeTools.PrintableReport;
import com.rahatsharif.hisabcalculator.util.NativeTools.UpdateCheckResult;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity implements AppHost {
    private AppSettings settings;
    private Palette palette;
    private List<HistoryRecord> historyList = new ArrayList<>();
    private String currentScreen = "home";
    private UpdateCheckResult latestUpdate;

    private LinearLayout rootLayout;
    private LinearLayout topBar;
    private FrameLayout contentHolder;
    private ScrollView scrollView;
    private TextView historyCountBadge;
    private TextView themeToggleBtn;
    private View menuUpdateDot;
    private TextView toastBanner;

    private HomeView homeView;
    private LandCalculatorView landView;
    private NolCalculatorView nolView;
    private SoilCalculatorView soilView;
    private TimberCalculatorView timberView;
    private UnitConverterView converterView;
    private HistoryView historyView;
    private SettingsDialog activeSettingsDialog;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable hideToastRunnable = () -> {
        if (toastBanner != null) toastBanner.setVisibility(View.GONE);
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        settings = AppStorage.loadSettings(this);
        palette = ThemeManager.getPalette(settings.amoledDark);
        historyList = AppStorage.loadHistory(this);

        buildRootShell();
        setContentView(rootLayout);
        applySystemBars();
        renderScreen("home");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleNativeBack();
            }
        });

        // Deferred non-blocking update check after instant first paint
        if (settings.autoUpdate) {
            mainHandler.postDelayed(() -> {
                if (isFinishing()) return;
                NativeTools.checkGitHubReleaseUpdate(settings.githubRepo, res -> {
                    latestUpdate = res;
                    updateMenuDot();
                    if (res.hasUpdate && !isFinishing()) {
                        showUpdatePromptDialog(res);
                    }
                });
            }, 2500);
        }
    }

    private void handleNativeBack() {
        if (activeSettingsDialog != null && activeSettingsDialog.isShowing()) {
            activeSettingsDialog.dismiss();
            return;
        }
        if (!"home".equals(currentScreen)) {
            goBackHome();
            return;
        }
        moveTaskToBack(true);
    }

    private void applySystemBars() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setStatusBarColor(palette.bgHeader);
            window.setNavigationBarColor(palette.bgApp);
        }
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(!palette.isDark);
        }
    }

    private void buildRootShell() {
        rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setBackgroundColor(palette.bgApp);

        FrameLayout bodyOverlay = new FrameLayout(this);
        rootLayout.addView(buildTopBar());
        rootLayout.addView(bodyOverlay, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ));

        scrollView = new ScrollView(this);
        scrollView.setFillViewport(true);
        scrollView.setVerticalScrollBarEnabled(false);

        contentHolder = new FrameLayout(this);
        int padH = ThemeManager.dp(this, 10);
        int padV = ThemeManager.dp(this, 12);
        contentHolder.setPadding(padH, padV, padH, ThemeManager.dp(this, 26));
        scrollView.addView(contentHolder);
        bodyOverlay.addView(scrollView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));

        // Floating toast banner at bottom
        toastBanner = new TextView(this);
        toastBanner.setVisibility(View.GONE);
        toastBanner.setTextColor(Color.WHITE);
        toastBanner.setTextSize(12.5f);
        toastBanner.setTypeface(null, Typeface.BOLD);
        toastBanner.setGravity(Gravity.CENTER);
        toastBanner.setBackground(ThemeManager.roundRect(this, Color.parseColor("#0F172A"), 999, Color.parseColor("#334155"), 1));
        toastBanner.setPadding(ThemeManager.dp(this, 16), ThemeManager.dp(this, 10), ThemeManager.dp(this, 16), ThemeManager.dp(this, 10));
        FrameLayout.LayoutParams tlp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT
        );
        tlp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        tlp.bottomMargin = ThemeManager.dp(this, 20);
        tlp.leftMargin = ThemeManager.dp(this, 16);
        tlp.rightMargin = ThemeManager.dp(this, 16);
        bodyOverlay.addView(toastBanner, tlp);
    }

    private View buildTopBar() {
        topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(palette.bgHeader);
        topBar.setPadding(ThemeManager.dp(this, 12), ThemeManager.dp(this, 10), ThemeManager.dp(this, 12), ThemeManager.dp(this, 10));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            topBar.setElevation(ThemeManager.dp(this, 4));
        }

        // Modern flat 3-bar hamburger icon
        FrameLayout menuBtn = new FrameLayout(this);
        menuBtn.setBackground(ThemeManager.roundRect(this, Color.parseColor("#1FFFFFFF"), 12, Color.parseColor("#2EFFFFFF"), 1));
        LinearLayout bars = new LinearLayout(this);
        bars.setOrientation(LinearLayout.VERTICAL);
        bars.setGravity(Gravity.CENTER_VERTICAL);
        int[] widths = {18, 12, 16};
        for (int i = 0; i < widths.length; i++) {
            View bar = new View(this);
            bar.setBackground(ThemeManager.roundRect(this, Color.WHITE, 999, 0, 0));
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(ThemeManager.dp(this, widths[i]), ThemeManager.dp(this, 2.3f));
            if (i > 0) blp.topMargin = ThemeManager.dp(this, 4);
            bars.addView(bar, blp);
        }
        FrameLayout.LayoutParams barsLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT
        );
        barsLp.gravity = Gravity.CENTER;
        menuBtn.addView(bars, barsLp);

        menuUpdateDot = new View(this);
        menuUpdateDot.setBackground(ThemeManager.roundRect(this, Color.parseColor("#F59E0B"), 999, Color.WHITE, 1));
        FrameLayout.LayoutParams dotLp = new FrameLayout.LayoutParams(ThemeManager.dp(this, 9), ThemeManager.dp(this, 9));
        dotLp.gravity = Gravity.TOP | Gravity.END;
        dotLp.topMargin = ThemeManager.dp(this, 4);
        dotLp.rightMargin = ThemeManager.dp(this, 4);
        menuBtn.addView(menuUpdateDot, dotLp);
        updateMenuDot();

        menuBtn.setOnClickListener(v -> openSettingsDialog());
        topBar.addView(menuBtn, new LinearLayout.LayoutParams(ThemeManager.dp(this, 40), ThemeManager.dp(this, 38)));

        // App Logo + Title
        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.HORIZONTAL);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams brLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        brLp.leftMargin = ThemeManager.dp(this, 10);

        FrameLayout logoFrame = new FrameLayout(this);
        logoFrame.setBackground(ThemeManager.roundRect(this, Color.WHITE, 10, 0, 0));
        logoFrame.setPadding(ThemeManager.dp(this, 2), ThemeManager.dp(this, 2), ThemeManager.dp(this, 2), ThemeManager.dp(this, 2));
        ImageView logoIv = new ImageView(this);
        logoIv.setImageResource(R.drawable.app_logo_small);
        logoFrame.addView(logoIv, new FrameLayout.LayoutParams(ThemeManager.dp(this, 28), ThemeManager.dp(this, 28)));
        brand.addView(logoFrame);

        TextView titleTv = new TextView(this);
        titleTv.setText("হিসাব ক্যালকুলেটর");
        titleTv.setTextSize(16);
        titleTv.setTypeface(null, Typeface.BOLD);
        titleTv.setTextColor(Color.WHITE);
        titleTv.setSingleLine(true);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        tlp.leftMargin = ThemeManager.dp(this, 8);
        brand.addView(titleTv, tlp);
        brand.setOnClickListener(v -> goBackHome());
        topBar.addView(brand, brLp);

        // Quick AMOLED toggle pill button
        themeToggleBtn = new TextView(this);
        themeToggleBtn.setText(settings.amoledDark ? "☀️" : "🌙");
        themeToggleBtn.setTextSize(15);
        themeToggleBtn.setGravity(Gravity.CENTER);
        themeToggleBtn.setBackground(ThemeManager.roundRect(this, Color.parseColor("#1FFFFFFF"), 999, Color.parseColor("#2EFFFFFF"), 1));
        themeToggleBtn.setOnClickListener(v -> {
            settings.amoledDark = !settings.amoledDark;
            AppStorage.saveSettings(this, settings);
            applyThemeAndRefresh();
        });
        LinearLayout.LayoutParams thLp = new LinearLayout.LayoutParams(ThemeManager.dp(this, 36), ThemeManager.dp(this, 36));
        thLp.rightMargin = ThemeManager.dp(this, 6);
        topBar.addView(themeToggleBtn, thLp);

        // History button with badge count
        LinearLayout histBtn = new LinearLayout(this);
        histBtn.setOrientation(LinearLayout.HORIZONTAL);
        histBtn.setGravity(Gravity.CENTER_VERTICAL);
        histBtn.setBackground(ThemeManager.roundRect(this, Color.parseColor("#1FFFFFFF"), 999, Color.parseColor("#2EFFFFFF"), 1));
        histBtn.setPadding(ThemeManager.dp(this, 10), ThemeManager.dp(this, 6), ThemeManager.dp(this, 8), ThemeManager.dp(this, 6));

        TextView histLbl = new TextView(this);
        histLbl.setText("📋 হিস্ট্রি");
        histLbl.setTextSize(12);
        histLbl.setTypeface(null, Typeface.BOLD);
        histLbl.setTextColor(Color.WHITE);
        histBtn.addView(histLbl);

        historyCountBadge = new TextView(this);
        historyCountBadge.setText(BnFormat.toBnNum(historyList.size()));
        historyCountBadge.setTextSize(10.5f);
        historyCountBadge.setTypeface(null, Typeface.BOLD);
        historyCountBadge.setTextColor(Color.parseColor("#0F172A"));
        historyCountBadge.setGravity(Gravity.CENTER);
        historyCountBadge.setBackground(ThemeManager.roundRect(this, Color.parseColor("#FACC15"), 999, 0, 0));
        historyCountBadge.setPadding(ThemeManager.dp(this, 6), ThemeManager.dp(this, 1), ThemeManager.dp(this, 6), ThemeManager.dp(this, 1));
        LinearLayout.LayoutParams hblp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        hblp.leftMargin = ThemeManager.dp(this, 5);
        histBtn.addView(historyCountBadge, hblp);

        histBtn.setOnClickListener(v -> {
            if ("history".equals(currentScreen)) goBackHome();
            else navigateTo("history");
        });
        topBar.addView(histBtn);

        ThemeManager.applyFontRecursively(topBar, this, settings.fontFamily);
        return topBar;
    }

    private void updateMenuDot() {
        if (menuUpdateDot != null) {
            menuUpdateDot.setVisibility(latestUpdate != null && latestUpdate.hasUpdate ? View.VISIBLE : View.GONE);
        }
    }

    private void updateHistoryBadge() {
        if (historyCountBadge != null) {
            historyCountBadge.setText(BnFormat.toBnNum(historyList.size()));
        }
    }

    private void renderScreen(String screen) {
        currentScreen = screen;
        contentHolder.removeAllViews();

        View target;
        switch (screen) {
            case "land":
                if (landView == null) landView = new LandCalculatorView(this);
                target = landView.build();
                break;
            case "nol":
                if (nolView == null) nolView = new NolCalculatorView(this);
                target = nolView.build();
                break;
            case "soil":
                if (soilView == null) soilView = new SoilCalculatorView(this);
                target = soilView.build();
                break;
            case "timber":
                if (timberView == null) timberView = new TimberCalculatorView(this);
                target = timberView.build();
                break;
            case "converter":
                if (converterView == null) converterView = new UnitConverterView(this);
                target = converterView.build();
                break;
            case "history":
                if (historyView == null) historyView = new HistoryView(this);
                target = historyView.build(historyList);
                break;
            case "home":
            default:
                currentScreen = "home";
                if (homeView == null) homeView = new HomeView(this);
                target = homeView.build();
                break;
        }

        contentHolder.addView(target);
        ThemeManager.applyFontRecursively(contentHolder, this, settings.fontFamily);
        scrollView.post(() -> scrollView.scrollTo(0, 0));
    }

    private void applyThemeAndRefresh() {
        palette = ThemeManager.getPalette(settings.amoledDark);
        rootLayout.setBackgroundColor(palette.bgApp);
        topBar.setBackgroundColor(palette.bgHeader);
        if (themeToggleBtn != null) themeToggleBtn.setText(settings.amoledDark ? "☀️" : "🌙");
        applySystemBars();

        ThemeManager.applyFontRecursively(topBar, this, settings.fontFamily);
        // Re-render current screen preserving inputs
        renderScreen(currentScreen);
    }

    private void openSettingsDialog() {
        activeSettingsDialog = new SettingsDialog(this, settings, latestUpdate, new SettingsDialog.Listener() {
            @Override
            public void onSettingsUpdated(AppSettings newSettings) {
                settings = newSettings;
                AppStorage.saveSettings(MainActivity.this, settings);
                applyThemeAndRefresh();
            }

            @Override
            public void onUpdateChecked(UpdateCheckResult result) {
                latestUpdate = result;
                updateMenuDot();
            }
        });
        activeSettingsDialog.show();
    }

    private void showUpdatePromptDialog(final UpdateCheckResult res) {
        new AlertDialog.Builder(this)
            .setTitle("নতুন আপডেট উপলব্ধ (v" + BnFormat.toBnDigits(res.latestVersion) + ")")
            .setMessage("হিসাব ক্যালকুলেটর-এর একটি নতুন সংস্করণ পাওয়া গেছে। পূর্বের কোনো তথ্য বা হিসাব না হারিয়েই সরাসরি আপডেট করতে পারবেন।")
            .setPositiveButton("এখনই আপডেট করুন", (d, w) -> {
                String url = (res.apkDownloadUrl != null && !res.apkDownloadUrl.isEmpty())
                    ? res.apkDownloadUrl : res.releasePageUrl;
                NativeTools.openUrl(MainActivity.this, url);
            })
            .setNegativeButton("পরে দেখুন", null)
            .show();
    }

    // --- AppHost Implementation ---

    @Override
    public Context getHostContext() {
        return this;
    }

    @Override
    public Palette getPalette() {
        return palette;
    }

    @Override
    public String getActiveFontId() {
        return settings.fontFamily;
    }

    @Override
    public void navigateTo(String screen) {
        renderScreen(screen);
    }

    @Override
    public void goBackHome() {
        renderScreen("home");
    }

    @Override
    public void saveHistory(HistoryRecord record) {
        historyList = AppStorage.addHistoryRecord(this, record);
        updateHistoryBadge();
        if ("history".equals(currentScreen) && historyView != null) {
            historyView.setRecords(historyList);
        }
    }

    @Override
    public void deleteHistoryItem(String id) {
        List<HistoryRecord> next = new ArrayList<>();
        for (HistoryRecord r : historyList) {
            if (r.id == null || !r.id.equals(id)) next.add(r);
        }
        historyList = next;
        AppStorage.saveHistory(this, historyList);
        updateHistoryBadge();
        if (historyView != null) historyView.setRecords(historyList);
    }

    @Override
    public void updateHistoryNote(String id, String note) {
        for (HistoryRecord r : historyList) {
            if (r.id != null && r.id.equals(id)) {
                r.note = note;
                break;
            }
        }
        AppStorage.saveHistory(this, historyList);
        if (historyView != null) historyView.setRecords(historyList);
    }

    @Override
    public void clearAllHistory() {
        historyList = new ArrayList<>();
        AppStorage.saveHistory(this, historyList);
        updateHistoryBadge();
        if (historyView != null) historyView.setRecords(historyList);
    }

    @Override
    public void printReport(PrintableReport report) {
        NativeTools.printReport(this, report);
    }

    @Override
    public void notifyUser(String msg) {
        mainHandler.removeCallbacks(hideToastRunnable);
        toastBanner.setText(msg);
        ThemeManager.applyFontRecursively(toastBanner, this, settings.fontFamily);
        toastBanner.setVisibility(View.VISIBLE);
        mainHandler.postDelayed(hideToastRunnable, 2600);
    }
}
