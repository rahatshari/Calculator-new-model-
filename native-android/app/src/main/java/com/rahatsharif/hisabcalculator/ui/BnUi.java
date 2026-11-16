package com.rahatsharif.hisabcalculator.ui;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.method.DigitsKeyListener;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.rahatsharif.hisabcalculator.util.BnFormat;
import com.rahatsharif.hisabcalculator.util.ThemeManager;
import com.rahatsharif.hisabcalculator.util.ThemeManager.Palette;

import java.util.ArrayList;
import java.util.List;

public final class BnUi {
    private BnUi() {}

    public static TextWatcher attachBnNumberWatcher(final EditText et) {
        TextWatcher tw = new TextWatcher() {
            boolean selfChange = false;
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (selfChange) return;
                String raw = s.toString();
                String norm = BnFormat.normalizeBnInput(raw);
                if (!norm.equals(raw)) {
                    selfChange = true;
                    int sel = Math.min(et.getSelectionStart(), norm.length());
                    et.setText(norm);
                    et.setSelection(Math.max(0, Math.min(sel, norm.length())));
                    selfChange = false;
                }
            }
        };
        et.addTextChangedListener(tw);
        return tw;
    }

    public static void configureBnNumberEdit(EditText et) {
        et.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        et.setKeyListener(DigitsKeyListener.getInstance("0123456789০১২৩৪৫৬৭৮৯."));
        et.setSingleLine(true);
        et.setBackground(null);
        et.setPadding(0, 0, 0, 0);
        attachBnNumberWatcher(et);
    }

    public static class BnSingleInput {
        public final LinearLayout box;
        public final TextView labelView;
        public final EditText editText;
        public final TextView suffixView;

        public BnSingleInput(Context ctx, Palette p, String label, String suffix, boolean compact) {
            box = new LinearLayout(ctx);
            box.setOrientation(LinearLayout.VERTICAL);
            int px = ThemeManager.dp(ctx, compact ? 10 : 14);
            int py = ThemeManager.dp(ctx, compact ? 7 : 9);
            box.setPadding(px, py, px, py);
            box.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 16, p.borderInput, 1));

            boolean hasSuffix = (suffix != null && !suffix.isEmpty());

            labelView = new TextView(ctx);
            labelView.setText(label);
            labelView.setTextSize(11);
            labelView.setTypeface(null, Typeface.BOLD);
            labelView.setTextColor(p.textMuted);
            if (!hasSuffix) labelView.setGravity(Gravity.CENTER);
            box.addView(labelView);

            LinearLayout row = new LinearLayout(ctx);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            rlp.topMargin = ThemeManager.dp(ctx, 2);
            box.addView(row, rlp);

            editText = new EditText(ctx);
            configureBnNumberEdit(editText);
            editText.setHint("০");
            editText.setTextColor(p.textPrimary);
            editText.setHintTextColor(p.textMuted);
            editText.setTextSize(compact ? 14 : 16);
            editText.setTypeface(null, Typeface.BOLD);
            if (!hasSuffix) editText.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams elp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            row.addView(editText, elp);

            if (hasSuffix) {
                suffixView = new TextView(ctx);
                suffixView.setText(suffix);
                suffixView.setTextSize(11);
                suffixView.setTypeface(null, Typeface.BOLD);
                suffixView.setTextColor(p.softBlueText);
                suffixView.setBackground(ThemeManager.roundRect(ctx, p.softBlueBg, 999, 0, 0));
                suffixView.setPadding(ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 3), ThemeManager.dp(ctx, 8), ThemeManager.dp(ctx, 3));
                row.addView(suffixView);
            } else {
                suffixView = null;
            }

            editText.setOnFocusChangeListener((v, hasFocus) -> {
                int focusStroke = p.isDark ? Color.parseColor("#38BDF8") : Color.parseColor("#123E6D");
                box.setBackground(ThemeManager.roundRect(
                    ctx,
                    hasFocus ? p.bgInputFocus : p.bgInput,
                    16,
                    hasFocus ? focusStroke : p.borderInput,
                    hasFocus ? 1.5f : 1f
                ));
            });

            box.setOnClickListener(v -> editText.requestFocus());
        }

        public double getValue() {
            return BnFormat.parseBnNum(editText.getText().toString());
        }

        public void setText(String s) {
            editText.setText(s != null ? s : "");
        }

        public void bind(String initialValue, StringConsumer onChange) {
            if (initialValue != null && !initialValue.isEmpty()) {
                editText.setText(BnFormat.normalizeBnInput(initialValue));
            }
            editText.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(Editable s) {
                    if (onChange != null) onChange.accept(s.toString());
                }
            });
        }
    }

    public interface StringConsumer {
        void accept(String value);
    }

    /**
     * বড় ও চওড়া একক ঘরের মধ্যে উপরে "ফুট" ও "ইঞ্চি" লেবেলসহ ইনপুট বক্স
     */
    public static class BnFeetInchBox {
        public final LinearLayout box;
        public final EditText ftEdit;
        public final EditText inEdit;

        public BnFeetInchBox(Context ctx, Palette p, String title) {
            box = new LinearLayout(ctx);
            box.setOrientation(LinearLayout.VERTICAL);
            box.setPadding(ThemeManager.dp(ctx, 11), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 11), ThemeManager.dp(ctx, 10));
            box.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 16, p.borderInput, 1));

            TextView tvTitle = new TextView(ctx);
            tvTitle.setText(title);
            tvTitle.setTextSize(11.5f);
            tvTitle.setTypeface(null, Typeface.BOLD);
            tvTitle.setTextColor(p.textBlueAccent);
            tvTitle.setGravity(Gravity.CENTER);
            tvTitle.setSingleLine(true);
            LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            tlp.bottomMargin = ThemeManager.dp(ctx, 6);
            box.addView(tvTitle, tlp);

            LinearLayout splitRow = new LinearLayout(ctx);
            splitRow.setOrientation(LinearLayout.HORIZONTAL);
            splitRow.setGravity(Gravity.CENTER_VERTICAL);
            box.addView(splitRow, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ));

            // Left: ফুট
            LinearLayout ftCol = new LinearLayout(ctx);
            ftCol.setOrientation(LinearLayout.VERTICAL);
            ftCol.setGravity(Gravity.CENTER_HORIZONTAL);
            TextView ftLbl = new TextView(ctx);
            ftLbl.setText("ফুট");
            ftLbl.setTextSize(11);
            ftLbl.setTypeface(null, Typeface.BOLD);
            ftLbl.setTextColor(p.textMuted);
            ftLbl.setGravity(Gravity.CENTER);
            ftCol.addView(ftLbl, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ));

            ftEdit = new EditText(ctx);
            configureBnNumberEdit(ftEdit);
            ftEdit.setHint("০");
            ftEdit.setTextColor(p.textPrimary);
            ftEdit.setHintTextColor(p.textMuted);
            ftEdit.setTextSize(18);
            ftEdit.setTypeface(null, Typeface.BOLD);
            ftEdit.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams flp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            flp.topMargin = ThemeManager.dp(ctx, 2);
            ftCol.addView(ftEdit, flp);
            ftCol.setOnClickListener(v -> ftEdit.requestFocus());
            splitRow.addView(ftCol, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            // Vertical divider (dead center)
            View div = new View(ctx);
            div.setBackgroundColor(p.divider);
            LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 1), ThemeManager.dp(ctx, 34));
            dlp.leftMargin = ThemeManager.dp(ctx, 8);
            dlp.rightMargin = ThemeManager.dp(ctx, 8);
            splitRow.addView(div, dlp);

            // Right: ইঞ্চি
            LinearLayout inCol = new LinearLayout(ctx);
            inCol.setOrientation(LinearLayout.VERTICAL);
            inCol.setGravity(Gravity.CENTER_HORIZONTAL);
            TextView inLbl = new TextView(ctx);
            inLbl.setText("ইঞ্চি");
            inLbl.setTextSize(11);
            inLbl.setTypeface(null, Typeface.BOLD);
            inLbl.setTextColor(p.textMuted);
            inLbl.setGravity(Gravity.CENTER);
            inCol.addView(inLbl, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ));

            inEdit = new EditText(ctx);
            configureBnNumberEdit(inEdit);
            inEdit.setHint("০");
            inEdit.setTextColor(p.textPrimary);
            inEdit.setHintTextColor(p.textMuted);
            inEdit.setTextSize(18);
            inEdit.setTypeface(null, Typeface.BOLD);
            inEdit.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            );
            ilp.topMargin = ThemeManager.dp(ctx, 2);
            inCol.addView(inEdit, ilp);
            inCol.setOnClickListener(v -> inEdit.requestFocus());
            splitRow.addView(inCol, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            View.OnFocusChangeListener fl = (v, hasFocus) -> {
                boolean active = ftEdit.hasFocus() || inEdit.hasFocus();
                int focusStroke = p.isDark ? Color.parseColor("#38BDF8") : Color.parseColor("#123E6D");
                box.setBackground(ThemeManager.roundRect(
                    ctx,
                    active ? p.bgInputFocus : p.bgInput,
                    16,
                    active ? focusStroke : p.borderInput,
                    active ? 1.5f : 1f
                ));
            };
            ftEdit.setOnFocusChangeListener(fl);
            inEdit.setOnFocusChangeListener(fl);
        }

        public double getFt() {
            return BnFormat.parseBnNum(ftEdit.getText().toString());
        }

        public double getIn() {
            return BnFormat.parseBnNum(inEdit.getText().toString());
        }

        public void clear() {
            ftEdit.setText("");
            inEdit.setText("");
        }

        public void bind(String initFt, String initIn, StringConsumer onFtChange, StringConsumer onInChange) {
            if (initFt != null && !initFt.isEmpty()) {
                ftEdit.setText(BnFormat.normalizeBnInput(initFt));
            }
            if (initIn != null && !initIn.isEmpty()) {
                inEdit.setText(BnFormat.normalizeBnInput(initIn));
            }
            ftEdit.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(Editable s) {
                    if (onFtChange != null) onFtChange.accept(s.toString());
                }
            });
            inEdit.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(Editable s) {
                    if (onInChange != null) onInChange.accept(s.toString());
                }
            });
        }
    }

    public static LinearLayout makeCard(Context ctx, Palette p, float radiusDp, int padDp) {
        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(ThemeManager.roundRect(ctx, p.bgCard, radiusDp, p.borderCard, 1));
        int pad = ThemeManager.dp(ctx, padDp);
        card.setPadding(pad, pad, pad, pad);
        return card;
    }

    public static Button makePillButton(Context ctx, String text, int bgColor, int textColor, int strokeColor, int heightDp) {
        Button b = new Button(ctx);
        b.setAllCaps(false);
        b.setText(text);
        b.setTextSize(13);
        b.setTypeface(null, Typeface.BOLD);
        b.setTextColor(textColor);
        b.setBackground(ThemeManager.roundRect(ctx, bgColor, 999, strokeColor, strokeColor != 0 ? 1 : 0));
        b.setMinHeight(ThemeManager.dp(ctx, heightDp));
        b.setMinimumHeight(ThemeManager.dp(ctx, heightDp));
        b.setPadding(ThemeManager.dp(ctx, 12), 0, ThemeManager.dp(ctx, 12), 0);
        b.setStateListAnimator(null);
        return b;
    }

    public static LinearLayout makeSubHeader(
        Context ctx, Palette p, String title, String subtitle,
        boolean hasNote, Runnable onBack, Runnable onToggleNote
    ) {
        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setBackground(ThemeManager.roundRect(ctx, p.bgCard, 22, p.borderCard, 1));
        row.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10));

        TextView backBtn = new TextView(ctx);
        backBtn.setText("←");
        backBtn.setTextSize(20);
        backBtn.setTypeface(null, Typeface.BOLD);
        backBtn.setTextColor(p.textPrimary);
        backBtn.setGravity(Gravity.CENTER);
        backBtn.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 999, 0, 0));
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(ThemeManager.dp(ctx, 40), ThemeManager.dp(ctx, 40));
        backBtn.setOnClickListener(v -> onBack.run());
        row.addView(backBtn, blp);

        LinearLayout titles = new LinearLayout(ctx);
        titles.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        tlp.leftMargin = ThemeManager.dp(ctx, 10);
        TextView tvT = new TextView(ctx);
        tvT.setText(title);
        tvT.setTextSize(16);
        tvT.setTypeface(null, Typeface.BOLD);
        tvT.setTextColor(p.textPrimary);
        titles.addView(tvT);

        TextView tvS = new TextView(ctx);
        tvS.setText(subtitle);
        tvS.setTextSize(11);
        tvS.setTextColor(p.textMuted);
        titles.addView(tvS);
        row.addView(titles, tlp);

        if (onToggleNote != null) {
            TextView noteBtn = new TextView(ctx);
            noteBtn.setText(hasNote ? "📝 নোট যুক্ত" : "📝 নোট");
            noteBtn.setTextSize(12);
            noteBtn.setTypeface(null, Typeface.BOLD);
            noteBtn.setTextColor(hasNote ? p.softBlueText : p.textSecondary);
            noteBtn.setBackground(ThemeManager.roundRect(ctx, hasNote ? p.softBlueBg : p.bgInput, 999, 0, 0));
            noteBtn.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 7), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 7));
            noteBtn.setOnClickListener(v -> onToggleNote.run());
            row.addView(noteBtn);
        }

        return row;
    }

    public static EditText makeNoteInput(Context ctx, Palette p, String currentNote, String hint) {
        EditText et = new EditText(ctx);
        et.setText(currentNote != null ? currentNote : "");
        et.setHint(hint);
        et.setTextSize(13);
        et.setTextColor(p.textPrimary);
        et.setHintTextColor(p.textMuted);
        et.setSingleLine(true);
        et.setBackground(ThemeManager.roundRect(ctx, p.bgInput, 14, p.borderInput, 1));
        et.setPadding(ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10), ThemeManager.dp(ctx, 12), ThemeManager.dp(ctx, 10));
        return et;
    }

    public interface OnTabSelected {
        void onSelect(int index);
    }

    public static LinearLayout makeSegmentedBar(Context ctx, Palette p, String[] labels, int activeIdx, OnTabSelected listener) {
        LinearLayout bar = new LinearLayout(ctx);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackground(ThemeManager.roundRect(ctx, p.segmentBg, 999, p.borderCard, 1));
        int pad = ThemeManager.dp(ctx, 4);
        bar.setPadding(pad, pad, pad, pad);

        List<TextView> tabs = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            final int idx = i;
            TextView tv = new TextView(ctx);
            boolean active = (i == activeIdx);
            tv.setText(active ? "✓ " + labels[i] : labels[i]);
            tv.setTextSize(12);
            tv.setTypeface(null, Typeface.BOLD);
            tv.setGravity(Gravity.CENTER);
            tv.setSingleLine(true);
            tv.setTextColor(active ? Color.WHITE : p.textSecondary);
            tv.setBackground(active ? ThemeManager.roundRect(ctx, Color.parseColor("#123E6D"), 999, 0, 0) : null);
            tv.setPadding(ThemeManager.dp(ctx, 6), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 6), ThemeManager.dp(ctx, 9));
            tv.setOnClickListener(v -> listener.onSelect(idx));
            tabs.add(tv);
            bar.addView(tv, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        }
        return bar;
    }

    public static LinearLayout makeResetAndSubmitRow(
        Context ctx, Palette p, String submitLabel, Runnable onReset, Runnable onSubmit
    ) {
        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);

        Button resetBtn = makePillButton(ctx, "↺ মুছুন", p.bgInput, p.textSecondary, 0, 48);
        resetBtn.setOnClickListener(v -> onReset.run());
        LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 48), 1f);
        rlp.rightMargin = ThemeManager.dp(ctx, 8);
        row.addView(resetBtn, rlp);

        Button submitBtn = makePillButton(ctx, "🧮 " + submitLabel, Color.parseColor("#123E6D"), Color.WHITE, 0, 48);
        submitBtn.setOnClickListener(v -> onSubmit.run());
        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 48), 2f);
        row.addView(submitBtn, slp);
        return row;
    }

    public static LinearLayout makeActionRow3(
        Context ctx, Palette p, Runnable onCopy, Runnable onShare, Runnable onPrint
    ) {
        LinearLayout row = new LinearLayout(ctx);
        row.setOrientation(LinearLayout.HORIZONTAL);

        Button copyBtn = makePillButton(ctx, "📋 কপি", p.bgCard, p.textSecondary, p.borderCard, 40);
        copyBtn.setOnClickListener(v -> onCopy.run());
        LinearLayout.LayoutParams lp1 = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 40), 1f);
        lp1.rightMargin = ThemeManager.dp(ctx, 6);
        row.addView(copyBtn, lp1);

        Button shareBtn = makePillButton(ctx, "📤 শেয়ার", p.bgCard, p.textSecondary, p.borderCard, 40);
        shareBtn.setOnClickListener(v -> onShare.run());
        LinearLayout.LayoutParams lp2 = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 40), 1f);
        lp2.rightMargin = ThemeManager.dp(ctx, 6);
        row.addView(shareBtn, lp2);

        Button printBtn = makePillButton(ctx, "🖨️ প্রিন্ট", Color.parseColor("#123E6D"), Color.WHITE, 0, 40);
        printBtn.setOnClickListener(v -> onPrint.run());
        LinearLayout.LayoutParams lp3 = new LinearLayout.LayoutParams(0, ThemeManager.dp(ctx, 40), 1f);
        row.addView(printBtn, lp3);

        return row;
    }

    public static LinearLayout makeGridMetricTile(Context ctx, Palette p, String label, String value) {
        LinearLayout tile = new LinearLayout(ctx);
        tile.setOrientation(LinearLayout.VERTICAL);
        tile.setBackground(ThemeManager.roundRect(ctx, p.bgCard, 16, p.borderCard, 1));
        tile.setPadding(ThemeManager.dp(ctx, 11), ThemeManager.dp(ctx, 9), ThemeManager.dp(ctx, 11), ThemeManager.dp(ctx, 9));

        TextView tvL = new TextView(ctx);
        tvL.setText(label);
        tvL.setTextSize(11);
        tvL.setTextColor(p.textMuted);
        tvL.setTypeface(null, Typeface.BOLD);
        tile.addView(tvL);

        TextView tvV = new TextView(ctx);
        tvV.setText(value);
        tvV.setTextSize(15);
        tvV.setTextColor(p.textPrimary);
        tvV.setTypeface(null, Typeface.BOLD);
        LinearLayout.LayoutParams vlp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        vlp.topMargin = ThemeManager.dp(ctx, 2);
        tile.addView(tvV, vlp);
        return tile;
    }

    public static LinearLayout makePrimaryGradientBox(Context ctx) {
        LinearLayout box = new LinearLayout(ctx);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackground(ThemeManager.gradientCard(
            ctx, Color.parseColor("#123E6D"), Color.parseColor("#1B528C"), 20
        ));
        int pad = ThemeManager.dp(ctx, 16);
        box.setPadding(pad, pad, pad, pad);
        return box;
    }

    public static LinearLayout.LayoutParams marginTop(Context ctx, float dp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.topMargin = ThemeManager.dp(ctx, dp);
        return lp;
    }
}
