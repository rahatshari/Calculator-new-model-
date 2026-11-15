package com.rahatsharif.hisabcalculator.util;

import java.util.List;

public final class Calculators {
    public static final double SQ_FEET_PER_SHOTOK = 435.6;
    public static final double FT_PER_HAT = 1.5;
    public static final double FT_PER_BIGHAT = 0.75;
    public static final double FT_PER_ANGUL = 1.0 / 12.0;

    private Calculators() {}

    public static double feetInchesToFeet(double feet, double inches) {
        return feet + (inches / 12.0);
    }

    public static String formatDimBn(double ft, double inch) {
        StringBuilder res = new StringBuilder();
        if (ft > 0) res.append(BnFormat.toBnNumTrim(ft)).append("'");
        if (inch > 0) {
            if (res.length() > 0) res.append(" ");
            res.append(BnFormat.toBnNumTrim(inch)).append("\"");
        }
        return res.length() == 0 ? "০" : res.toString();
    }

    public enum LandUnitType {
        decimal("শতক / শতাংশ"),
        katha("কাঠা (৩.৩০ শতক)"),
        kura("কুড়া (২০ কাঠা / ৬৬ শতক)"),
        standard_katha("প্রচলিত কাঠা (৭২০ বর্গফুট)"),
        bigha("বিঘা"),
        acre("একর"),
        gonda("গণ্ডা"),
        sqft("স্কয়ার ফুট (বর্গফুট)");

        public final String label;

        LandUnitType(String label) {
            this.label = label;
        }
    }

    public static double unitToSqFt(double amount, LandUnitType unit) {
        switch (unit) {
            case decimal: return amount * SQ_FEET_PER_SHOTOK;
            case katha: return amount * SQ_FEET_PER_SHOTOK * 3.30;
            case kura: return amount * SQ_FEET_PER_SHOTOK * 3.30 * 20.0;
            case standard_katha: return amount * 720.0;
            case bigha: return amount * 14400.0;
            case acre: return amount * 43560.0;
            case gonda: return amount * 871.2;
            case sqft: return amount;
            default: return amount * SQ_FEET_PER_SHOTOK;
        }
    }

    public static class LandResult {
        public double sqFt;
        public double sqHat;
        public double decimal;
        public double katha;
        public double standardKatha;
        public int kuraCount;
        public int kathaCount;
        public double dhurCount;
        public String mixedText;
        public double bigha;
        public double acre;
        public double gonda;
        public double avgLengthFt;
        public double avgWidthFt;
    }

    public static LandResult calculateLandFromSqFt(double sqFt, double avgLengthFt, double avgWidthFt) {
        double safeSqFt = Math.max(0.0, sqFt);
        double totalShotok = safeSqFt / SQ_FEET_PER_SHOTOK;
        double totalKatha = totalShotok / 3.30;

        int kuraCount = (int) Math.floor(totalKatha / 20.0);
        int kathaCount = (int) Math.floor(totalKatha % 20.0);
        double dhurCount = ((totalKatha % 20.0) - kathaCount) * 20.0;

        StringBuilder mixed = new StringBuilder("মোট: ");
        if (kuraCount > 0) mixed.append(BnFormat.toBnNum(kuraCount)).append(" কুড়া ");
        if (kathaCount > 0 || kuraCount > 0) mixed.append(BnFormat.toBnNum(kathaCount)).append(" কাঠা ");
        mixed.append(BnFormat.toBnNum(dhurCount, 2)).append(" ধুর");

        LandResult r = new LandResult();
        r.sqFt = safeSqFt;
        r.sqHat = safeSqFt / 2.25;
        r.decimal = totalShotok;
        r.katha = totalKatha;
        r.standardKatha = safeSqFt / 720.0;
        r.kuraCount = kuraCount;
        r.kathaCount = kathaCount;
        r.dhurCount = dhurCount;
        r.mixedText = mixed.toString();
        r.bigha = safeSqFt / 14400.0;
        r.acre = safeSqFt / 43560.0;
        r.gonda = safeSqFt / 871.2;
        r.avgLengthFt = avgLengthFt;
        r.avgWidthFt = avgWidthFt;
        return r;
    }

    public static LandResult calculateQuadLand(
        double l1Ft, double l1In,
        double l2Ft, double l2In,
        double w1Ft, double w1In,
        double w2Ft, double w2In
    ) {
        double l1 = feetInchesToFeet(l1Ft, l1In);
        double l2 = feetInchesToFeet(l2Ft, l2In);
        double w1 = feetInchesToFeet(w1Ft, w1In);
        double w2 = feetInchesToFeet(w2Ft, w2In);

        double avgL = l1;
        if (l2 > 0 && l1 > 0) avgL = (l1 + l2) / 2.0;
        else if (l2 > 0 && l1 == 0) avgL = l2;

        double avgW = w1;
        if (w2 > 0 && w1 > 0) avgW = (w1 + w2) / 2.0;
        else if (w2 > 0 && w1 == 0) avgW = w2;

        return calculateLandFromSqFt(avgL * avgW, avgL, avgW);
    }

    public static class HeronResult extends LandResult {
        public boolean isValidTriangle;
    }

    public static HeronResult calculateHeronLand(
        double aFt, double aIn,
        double bFt, double bIn,
        double cFt, double cIn
    ) {
        double a = feetInchesToFeet(aFt, aIn);
        double b = feetInchesToFeet(bFt, bIn);
        double c = feetInchesToFeet(cFt, cIn);

        HeronResult out = new HeronResult();
        if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) {
            LandResult zero = calculateLandFromSqFt(0, 0, 0);
            copyLandFields(zero, out);
            out.isValidTriangle = false;
            return out;
        }
        double s = (a + b + c) / 2.0;
        double area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        LandResult land = calculateLandFromSqFt(area, 0, 0);
        copyLandFields(land, out);
        out.isValidTriangle = true;
        return out;
    }

    private static void copyLandFields(LandResult src, LandResult dst) {
        dst.sqFt = src.sqFt;
        dst.sqHat = src.sqHat;
        dst.decimal = src.decimal;
        dst.katha = src.katha;
        dst.standardKatha = src.standardKatha;
        dst.kuraCount = src.kuraCount;
        dst.kathaCount = src.kathaCount;
        dst.dhurCount = src.dhurCount;
        dst.mixedText = src.mixedText;
        dst.bigha = src.bigha;
        dst.acre = src.acre;
        dst.gonda = src.gonda;
        dst.avgLengthFt = src.avgLengthFt;
        dst.avgWidthFt = src.avgWidthFt;
    }

    public static class ReverseLandResult {
        public double targetSqFt;
        public double knownSideFt;
        public double requiredOppositeFt;
        public int ansFt;
        public double ansIn;
        public LandResult landDetails;
    }

    public static ReverseLandResult calculateReverseLand(double targetAmount, LandUnitType unit, double knownFt, double knownIn) {
        double targetSqFt = unitToSqFt(targetAmount, unit);
        double knownSideFt = feetInchesToFeet(knownFt, knownIn);
        double req = knownSideFt > 0 ? targetSqFt / knownSideFt : 0.0;
        int ansFt = (int) Math.floor(req);
        double ansIn = (req - ansFt) * 12.0;

        ReverseLandResult res = new ReverseLandResult();
        res.targetSqFt = targetSqFt;
        res.knownSideFt = knownSideFt;
        res.requiredOppositeFt = req;
        res.ansFt = ansFt;
        res.ansIn = ansIn;
        res.landDetails = calculateLandFromSqFt(targetSqFt, knownSideFt, req);
        return res;
    }

    // [২] নলের হিসাব
    public static class NolSideInput {
        public double nol, hat, bighat, angul;

        public NolSideInput(double nol, double hat, double bighat, double angul) {
            this.nol = nol;
            this.hat = hat;
            this.bighat = bighat;
            this.angul = angul;
        }
    }

    public static String formatNolPartBn(NolSideInput side) {
        StringBuilder sb = new StringBuilder();
        if (side.nol > 0) sb.append(BnFormat.toBnNumTrim(side.nol)).append(" নল");
        if (side.hat > 0) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(BnFormat.toBnNumTrim(side.hat)).append(" হাত");
        }
        if (side.bighat > 0) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(BnFormat.toBnNumTrim(side.bighat)).append(" বিঘাত");
        }
        if (side.angul > 0) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(BnFormat.toBnAngul(side.angul)).append(" আঙুল");
        }
        return sb.length() > 0 ? sb.toString() : "০ নল";
    }

    public static double nolSideToFeet(double oneNolInFeet, NolSideInput side) {
        return (side.nol * oneNolInFeet)
            + (side.hat * FT_PER_HAT)
            + (side.bighat * FT_PER_BIGHAT)
            + (side.angul * FT_PER_ANGUL);
    }

    public static class NolLandResult extends LandResult {
        public double nolLengthFt;
        public double lengthFt;
        public double widthFt;
        public double sqNol;
    }

    public static NolLandResult calculateLandByNol(double hatPerNol, NolSideInput lenSide, NolSideInput widSide) {
        double nolLengthFt = hatPerNol * FT_PER_HAT;
        double lengthFt = nolSideToFeet(nolLengthFt, lenSide);
        double widthFt = nolSideToFeet(nolLengthFt, widSide);
        double sqFt = lengthFt * widthFt;
        double sqNol = nolLengthFt > 0 ? sqFt / (nolLengthFt * nolLengthFt) : 0.0;

        LandResult base = calculateLandFromSqFt(sqFt, lengthFt, widthFt);
        NolLandResult out = new NolLandResult();
        copyLandFields(base, out);
        out.nolLengthFt = nolLengthFt;
        out.lengthFt = lengthFt;
        out.widthFt = widthFt;
        out.sqNol = sqNol;
        return out;
    }

    public static class ReverseNolResult {
        public double nolLengthFt;
        public double targetSqFt;
        public double knownSideFt;
        public double requiredOppositeFt;
        public int ansNol;
        public int ansHat;
        public int ansBighat;
        public double ansAngul;
        public int ansFt;
        public double ansIn;
        public LandResult landDetails;
    }

    public static ReverseNolResult calculateReverseNolLand(double hatPerNol, double targetAmount, LandUnitType unit, NolSideInput knownSide) {
        double nolLengthFt = hatPerNol * FT_PER_HAT;
        double targetSqFt = unitToSqFt(targetAmount, unit);
        double knownFt = nolSideToFeet(nolLengthFt, knownSide);
        double reqFeet = knownFt > 0 ? targetSqFt / knownFt : 0.0;

        int ansNol = nolLengthFt > 0 ? (int) Math.floor(reqFeet / nolLengthFt) : 0;
        double rem1 = Math.max(0.0, reqFeet - ansNol * nolLengthFt);
        int ansHat = (int) Math.floor(rem1 / FT_PER_HAT);
        double rem2 = Math.max(0.0, rem1 - ansHat * FT_PER_HAT);
        int ansBighat = (int) Math.floor(rem2 / FT_PER_BIGHAT);
        double rem3 = Math.max(0.0, rem2 - ansBighat * FT_PER_BIGHAT);

        double rawAngul = Math.round((rem3 / FT_PER_ANGUL) * 2.0) / 2.0;
        if (rawAngul >= 12.0) {
            rawAngul -= 12.0;
            ansBighat += 1;
        }
        if (ansBighat >= 2) {
            ansBighat -= 2;
            ansHat += 1;
        }
        if (hatPerNol > 0 && ansHat >= hatPerNol) {
            ansHat -= (int) hatPerNol;
            ansNol += 1;
        }
        double ansAngul = Math.round(rawAngul * 10.0) / 10.0;

        int ansFt = (int) Math.floor(reqFeet);
        double ansIn = (reqFeet - ansFt) * 12.0;

        ReverseNolResult r = new ReverseNolResult();
        r.nolLengthFt = nolLengthFt;
        r.targetSqFt = targetSqFt;
        r.knownSideFt = knownFt;
        r.requiredOppositeFt = reqFeet;
        r.ansNol = ansNol;
        r.ansHat = ansHat;
        r.ansBighat = ansBighat;
        r.ansAngul = ansAngul;
        r.ansFt = ansFt;
        r.ansIn = ansIn;
        r.landDetails = calculateLandFromSqFt(targetSqFt, knownFt, reqFeet);
        return r;
    }

    // [৩] মাটির হিসাব
    public static class DimReading {
        public double ft;
        public double inch;

        public DimReading(double ft, double inch) {
            this.ft = ft;
            this.inch = inch;
        }
    }

    public static class SoilResult {
        public double avgLengthFt;
        public double avgWidthFt;
        public double avgDepthFt;
        public double volumeCft;
        public double volumeCubicMeter;
        public boolean isPer1000;
        public double rate;
        public double totalCost;
    }

    private static double averageReadings(List<DimReading> list) {
        double sum = 0.0;
        int count = 0;
        for (DimReading r : list) {
            double val = feetInchesToFeet(r.ft, r.inch);
            if (val > 0) {
                sum += val;
                count++;
            }
        }
        return count > 0 ? sum / count : 0.0;
    }

    public static SoilResult calculateSoil(
        List<DimReading> lengths,
        List<DimReading> widths,
        List<DimReading> depths,
        boolean isPer1000,
        double rate
    ) {
        double avgL = averageReadings(lengths);
        double avgW = averageReadings(widths);
        double avgD = averageReadings(depths);
        double cft = Math.max(0.0, avgL * avgW * avgD);
        double safeRate = Math.max(0.0, rate);
        double cost = isPer1000 ? (cft / 1000.0) * safeRate : cft * safeRate;

        SoilResult res = new SoilResult();
        res.avgLengthFt = avgL;
        res.avgWidthFt = avgW;
        res.avgDepthFt = avgD;
        res.volumeCft = cft;
        res.volumeCubicMeter = cft * 0.0283168;
        res.isPer1000 = isPer1000;
        res.rate = safeRate;
        res.totalCost = cost;
        return res;
    }

    // [৪] গাছ ও কাঠের হিসাব
    public static class TimberItem {
        public String id;
        public String type; // "round" or "sawn"
        public String description;
        public int quantity;
        public double unitCft;
        public double totalCft;
        public double ratePerCft;
        public double totalPrice;
    }

    public static TimberItem calculateRoundLogItem(
        double girthFt, double girthIn,
        double lenFt, double lenIn,
        int qty, String id, double ratePerCft
    ) {
        int safeQty = Math.max(1, qty);
        double totalLengthFt = feetInchesToFeet(lenFt, lenIn);
        double totalGirthIn = (girthFt * 12.0) + girthIn;
        double cft = (Math.pow(totalGirthIn / 4.0, 2) * totalLengthFt) / 144.0 * safeQty;
        double safeRate = Math.max(0.0, ratePerCft);

        TimberItem item = new TimberItem();
        item.id = id;
        item.type = "round";
        item.description = "বেড় " + formatDimBn(girthFt, girthIn) + " × লম্বা " + formatDimBn(lenFt, lenIn);
        item.quantity = safeQty;
        item.unitCft = cft / safeQty;
        item.totalCft = cft;
        item.ratePerCft = safeRate;
        item.totalPrice = cft * safeRate;
        return item;
    }

    public static TimberItem calculateSawnTimberItem(
        double widthIn, double thickIn,
        double lenFt, double lenIn,
        int qty, String id, double ratePerCft
    ) {
        int safeQty = Math.max(1, qty);
        double totalLengthFt = feetInchesToFeet(lenFt, lenIn);
        double cft = ((totalLengthFt * widthIn * thickIn) / 144.0) * safeQty;
        double safeRate = Math.max(0.0, ratePerCft);

        TimberItem item = new TimberItem();
        item.id = id;
        item.type = "sawn";
        item.description = BnFormat.toBnNumTrim(widthIn) + "\" × " + BnFormat.toBnNumTrim(thickIn) + "\" × " + formatDimBn(lenFt, lenIn);
        item.quantity = safeQty;
        item.unitCft = cft / safeQty;
        item.totalCft = cft;
        item.ratePerCft = safeRate;
        item.totalPrice = cft * safeRate;
        return item;
    }

    public static class TimberSummary {
        public int totalPieces;
        public double totalCft;
        public double roundCft;
        public double sawnCft;
        public double totalPrice;
    }

    public static TimberSummary summarizeTimberCart(List<TimberItem> items) {
        TimberSummary sum = new TimberSummary();
        for (TimberItem item : items) {
            sum.totalPieces += item.quantity;
            sum.totalCft += item.totalCft;
            sum.totalPrice += item.totalPrice;
            if ("round".equals(item.type)) sum.roundCft += item.totalCft;
            else sum.sawnCft += item.totalCft;
        }
        return sum;
    }
}
