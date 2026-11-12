import { feetInchesToFeet, sqFtToTraditionalUnits, toBnNum, TraditionalUnits } from './bengali';

/**
 * Core Constants from https://rahatshari.github.io/calculator-old-model/
 */
export const SQ_FEET_PER_SHOTOK = 435.6;
export const FT_PER_HAT = 1.5;          // ১ হাত = ১৮ ইঞ্চি = ১.৫ ফুট
export const FT_PER_BIGHAT = 0.75;      // ১ বিঘাত = ৯ ইঞ্চি = ০.৭৫ ফুট
export const FT_PER_ANGUL = 1 / 12;     // ১ আঙুল = ১ ইঞ্চি = ১/১২ ফুট

/**
 * Formats feet and inches just like formatDim(ft, inch) in calculator-old-model
 */
export function formatDimBn(ft: number, inch: number): string {
  const f = ft || 0;
  const i = inch || 0;
  let res = '';
  if (f > 0) res += `${toBnNum(f)}'`;
  if (i > 0) res += ` ${toBnNum(i)}"`;
  if (res === '') res = '০';
  return res.trim();
}

/**
 * [১] 📐 জমির হিসাব (Land Calculator)
 */
export interface LandResult {
  sqFt: number;
  sqHat: number;
  decimal: number;        // শতক / শতাংশ (totalSqFeet / 435.6)
  katha: number;          // কাঠা (totalShotok / 3.30 as in old model)
  standardKatha: number;  // প্রচলিত কাঠা (totalSqFeet / 720)
  kuraCount: number;      // কুড়া (Math.floor(totalKatha / 20))
  kathaCount: number;     // পূর্ণ কাঠা (Math.floor(totalKatha % 20))
  dhurCount: number;      // ধুর (((totalKatha % 20) - kathaCount) * 20)
  mixedText: string;      // "মোট: X কুড়া Y কাঠা Z.ZZ ধুর"
  bigha: number;          // বিঘা (totalSqFeet / 14400)
  acre: number;           // একর (totalSqFeet / 43560)
  gonda: number;          // গণ্ডা (totalSqFeet / 871.2)
  avgLengthFt?: number;
  avgWidthFt?: number;
  traditional: TraditionalUnits;
}

export function calculateLandFromSqFt(
  sqFt: number,
  avgLengthFt?: number,
  avgWidthFt?: number
): LandResult {
  const safeSqFt = Math.max(0, sqFt);
  const totalShotok = safeSqFt / SQ_FEET_PER_SHOTOK;
  const totalKatha = totalShotok / 3.30;

  const kuraCount = Math.floor(totalKatha / 20);
  const kathaCount = Math.floor(totalKatha % 20);
  const dhurCount = ((totalKatha % 20) - kathaCount) * 20;

  let mixedText = 'মোট: ';
  if (kuraCount > 0) mixedText += `${toBnNum(kuraCount)} কুড়া `;
  if (kathaCount > 0 || kuraCount > 0) mixedText += `${toBnNum(kathaCount)} কাঠা `;
  mixedText += `${toBnNum(dhurCount, 2)} ধুর`;

  return {
    sqFt: safeSqFt,
    sqHat: safeSqFt / 2.25,
    decimal: totalShotok,
    katha: totalKatha,
    standardKatha: safeSqFt / 720,
    kuraCount,
    kathaCount,
    dhurCount,
    mixedText,
    bigha: safeSqFt / 14400,
    acre: safeSqFt / 43560,
    gonda: safeSqFt / 871.2,
    avgLengthFt,
    avgWidthFt,
    traditional: sqFtToTraditionalUnits(safeSqFt),
  };
}

/**
 * সাধারণ চতুর্ভুজ ও গড় নিয়ম (Exact calculateHisabArea from calculator-old-model)
 */
export function calculateQuadLand(
  l1Ft: number, l1In: number,
  l2Ft: number, l2In: number,
  w1Ft: number, w1In: number,
  w2Ft: number, w2In: number
): LandResult {
  const l1 = feetInchesToFeet(l1Ft, l1In);
  const l2 = feetInchesToFeet(l2Ft, l2In);
  const w1 = feetInchesToFeet(w1Ft, w1In);
  const w2 = feetInchesToFeet(w2Ft, w2In);

  let avgL = l1;
  if (l2 > 0 && l1 > 0) avgL = (l1 + l2) / 2;
  else if (l2 > 0 && l1 === 0) avgL = l2;

  let avgW = w1;
  if (w2 > 0 && w1 > 0) avgW = (w1 + w2) / 2;
  else if (w2 > 0 && w1 === 0) avgW = w2;

  const totalSqFeet = avgL * avgW;
  return calculateLandFromSqFt(totalSqFeet, avgL, avgW);
}

/**
 * বিষমবাহু ও ত্রিভুজ নিয়ম (Exact calculateTriangleArea / Heron's Formula)
 */
export interface HeronResult extends LandResult {
  isValidTriangle: boolean;
  semiPerimeter: number;
}

export function calculateHeronLand(
  aFt: number, aIn: number,
  bFt: number, bIn: number,
  cFt: number, cIn: number
): HeronResult {
  const a = feetInchesToFeet(aFt, aIn);
  const b = feetInchesToFeet(bFt, bIn);
  const c = feetInchesToFeet(cFt, cIn);

  if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) {
    return {
      ...calculateLandFromSqFt(0),
      isValidTriangle: false,
      semiPerimeter: 0,
    };
  }

  const s = (a + b + c) / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

  return {
    ...calculateLandFromSqFt(area),
    isValidTriangle: true,
    semiPerimeter: s,
  };
}

/**
 * জানা জমি থেকে বিপরীত দিকের সীমানা বের করার হিসাব (Exact calculateHisabRev)
 */
export type LandUnitType = 'decimal' | 'katha' | 'kura' | 'standard_katha' | 'bigha' | 'acre' | 'gonda' | 'sqft';

export interface ReverseLandResult {
  targetSqFt: number;
  knownSideFt: number;
  requiredOppositeFt: number;
  ansFt: number;
  ansIn: number;
  landDetails: LandResult;
}

export function unitToSqFt(amount: number, unit: LandUnitType): number {
  switch (unit) {
    case 'decimal': return amount * SQ_FEET_PER_SHOTOK;
    case 'katha': return amount * SQ_FEET_PER_SHOTOK * 3.30;
    case 'kura': return amount * SQ_FEET_PER_SHOTOK * 3.30 * 20;
    case 'standard_katha': return amount * 720;
    case 'bigha': return amount * 14400;
    case 'acre': return amount * 43560;
    case 'gonda': return amount * 871.2;
    case 'sqft': return amount;
    default: return amount * SQ_FEET_PER_SHOTOK;
  }
}

export function calculateReverseLand(
  targetAmount: number,
  unit: LandUnitType,
  knownFt: number,
  knownIn: number
): ReverseLandResult {
  const targetSqFt = unitToSqFt(targetAmount, unit);
  const knownSideFt = feetInchesToFeet(knownFt, knownIn);
  const requiredOppositeFt = knownSideFt > 0 ? targetSqFt / knownSideFt : 0;
  const ansFt = Math.floor(requiredOppositeFt);
  const ansIn = (requiredOppositeFt - ansFt) * 12;

  return {
    targetSqFt,
    knownSideFt,
    requiredOppositeFt,
    ansFt,
    ansIn,
    landDetails: calculateLandFromSqFt(targetSqFt, knownSideFt, requiredOppositeFt),
  };
}

/**
 * [২] 📏 নলের হিসাব (Exact calculateNolArea & calculateNolRev from calculator-old-model)
 */
export interface NolConfig {
  hat: number;
  bighat: number;
  angul: number;
}

export interface NolSideInput {
  nol: number;
  hat: number;
  bighat: number;
  angul: number;
}

export function formatNolPartBn(side: NolSideInput): string {
  const parts: string[] = [];
  if (side.nol > 0) parts.push(`${toBnNum(side.nol)} নল`);
  if (side.hat > 0) parts.push(`${toBnNum(side.hat)} হাত`);
  if (side.bighat > 0) parts.push(`${toBnNum(side.bighat)} বিঘাত`);
  if (side.angul > 0) parts.push(`${toBnNum(side.angul)} আঙুল`);
  return parts.length > 0 ? parts.join(' ') : '০ নল';
}

export function calculateNolLengthInFeet(config: NolConfig): number {
  return (config.hat * FT_PER_HAT) + (config.bighat * FT_PER_BIGHAT) + (config.angul * FT_PER_ANGUL);
}

export function nolSideToFeet(oneNolInFeet: number, side: NolSideInput): number {
  return (
    (side.nol * oneNolInFeet) +
    (side.hat * FT_PER_HAT) +
    (side.bighat * FT_PER_BIGHAT) +
    (side.angul * FT_PER_ANGUL)
  );
}

export interface NolLandResult {
  hatPerNol: number;
  nolLengthFt: number;
  lengthFt: number;
  widthFt: number;
  avgLengthFt: number;
  avgWidthFt: number;
  sqNol: number;
  sqFt: number;
  decimal: number;
  katha: number;
  standardKatha: number;
  bigha: number;
  acre: number;
  kuraCount: number;
  kathaCount: number;
  dhurCount: number;
  mixedText: string;
  gonda: number;
  kara: number;
  kranti: number;
  til: number;
}

export function calculateLandByNol(
  config: NolConfig,
  lengthSide: NolSideInput | number,
  widthSide: NolSideInput | number
): NolLandResult {
  const nolLengthFt = calculateNolLengthInFeet(config);

  const lSide: NolSideInput =
    typeof lengthSide === 'number'
      ? { nol: lengthSide, hat: 0, bighat: 0, angul: 0 }
      : lengthSide;
  const wSide: NolSideInput =
    typeof widthSide === 'number'
      ? { nol: widthSide, hat: 0, bighat: 0, angul: 0 }
      : widthSide;

  const lengthFt = nolSideToFeet(nolLengthFt, lSide);
  const widthFt = nolSideToFeet(nolLengthFt, wSide);
  const sqFt = lengthFt * widthFt;
  const sqNol = nolLengthFt > 0 ? sqFt / (nolLengthFt * nolLengthFt) : 0;

  const land = calculateLandFromSqFt(sqFt, lengthFt, widthFt);

  const gonda = Math.floor(sqFt / 871.2);
  const remAfterGonda = sqFt % 871.2;
  const kara = Math.floor(remAfterGonda / 217.8);
  const remAfterKara = remAfterGonda % 217.8;
  const kranti = Math.floor(remAfterKara / 72.6);
  const remAfterKranti = remAfterKara % 72.6;
  const til = Math.round(remAfterKranti / 3.63);

  return {
    hatPerNol: config.hat,
    nolLengthFt,
    lengthFt,
    widthFt,
    avgLengthFt: lengthFt,
    avgWidthFt: widthFt,
    sqNol,
    sqFt,
    decimal: land.decimal,
    katha: land.katha,
    standardKatha: land.standardKatha,
    bigha: land.bigha,
    acre: land.acre,
    kuraCount: land.kuraCount,
    kathaCount: land.kathaCount,
    dhurCount: land.dhurCount,
    mixedText: land.mixedText,
    gonda,
    kara,
    kranti,
    til,
  };
}

export function calculateNolLand(
  hatPerNol: number,
  len1: NolSideInput,
  len2: NolSideInput,
  wid1: NolSideInput,
  wid2: NolSideInput
): NolLandResult {
  const config: NolConfig = { hat: hatPerNol, bighat: 0, angul: 0 };
  const nolLengthFt = calculateNolLengthInFeet(config);

  const l1 = nolSideToFeet(nolLengthFt, len1);
  const l2 = nolSideToFeet(nolLengthFt, len2);
  const w1 = nolSideToFeet(nolLengthFt, wid1);
  const w2 = nolSideToFeet(nolLengthFt, wid2);

  let avgL = l1;
  if (l2 > 0 && l1 > 0) avgL = (l1 + l2) / 2;
  else if (l2 > 0 && l1 === 0) avgL = l2;

  let avgW = w1;
  if (w2 > 0 && w1 > 0) avgW = (w1 + w2) / 2;
  else if (w2 > 0 && w1 === 0) avgW = w2;

  const sqFt = avgL * avgW;
  const sqNol = nolLengthFt > 0 ? sqFt / (nolLengthFt * nolLengthFt) : 0;
  const land = calculateLandFromSqFt(sqFt, avgL, avgW);

  const gonda = Math.floor(sqFt / 871.2);
  const remAfterGonda = sqFt % 871.2;
  const kara = Math.floor(remAfterGonda / 217.8);
  const remAfterKara = remAfterGonda % 217.8;
  const kranti = Math.floor(remAfterKara / 72.6);
  const remAfterKranti = remAfterKara % 72.6;
  const til = Math.round(remAfterKranti / 3.63);

  return {
    hatPerNol,
    nolLengthFt,
    lengthFt: avgL,
    widthFt: avgW,
    avgLengthFt: avgL,
    avgWidthFt: avgW,
    sqNol,
    sqFt,
    decimal: land.decimal,
    katha: land.katha,
    standardKatha: land.standardKatha,
    bigha: land.bigha,
    acre: land.acre,
    kuraCount: land.kuraCount,
    kathaCount: land.kathaCount,
    dhurCount: land.dhurCount,
    mixedText: land.mixedText,
    gonda,
    kara,
    kranti,
    til,
  };
}

export interface ReverseNolResult {
  nolLengthFt: number;
  targetSqFt: number;
  knownFt: number;
  knownSideFt: number;
  requiredOppositeFt: number;
  requiredOppositeNol: number;
  ansNol: number;
  ansHat: number;
  ansBighat: number;
  ansAngul: number;
  formattedParts: string;
  ansFt: number;
  ansIn: number;
  landDetails: LandResult;
}

export function calculateReverseNol(
  config: NolConfig,
  targetAmount: number,
  unit: LandUnitType,
  knownSide: NolSideInput | number
): ReverseNolResult {
  const nolLengthFt = calculateNolLengthInFeet(config);
  const targetSqFt = unitToSqFt(targetAmount, unit);

  const kSide: NolSideInput =
    typeof knownSide === 'number'
      ? { nol: knownSide, hat: 0, bighat: 0, angul: 0 }
      : knownSide;

  const knownFt = nolSideToFeet(nolLengthFt, kSide);
  const reqFeet = knownFt > 0 ? targetSqFt / knownFt : 0;
  const requiredOppositeNol = nolLengthFt > 0 ? reqFeet / nolLengthFt : 0;

  const ansNol = nolLengthFt > 0 ? Math.floor(reqFeet / nolLengthFt) : 0;
  const remFeet1 = reqFeet - ansNol * nolLengthFt;
  const ansHat = Math.floor(remFeet1 / FT_PER_HAT);
  const remFeet2 = remFeet1 - ansHat * FT_PER_HAT;
  const ansBighat = Math.floor(remFeet2 / FT_PER_BIGHAT);
  const remFeet3 = remFeet2 - ansBighat * FT_PER_BIGHAT;
  const ansAngul = Math.round(remFeet3 / FT_PER_ANGUL);

  const parts: string[] = [];
  if (ansNol > 0) parts.push(`${toBnNum(ansNol)} নল`);
  if (ansHat > 0) parts.push(`${toBnNum(ansHat)} হাত`);
  if (ansBighat > 0) parts.push(`${toBnNum(ansBighat)} বিঘাত`);
  if (ansAngul > 0) parts.push(`${toBnNum(ansAngul)} আঙুল`);
  if (parts.length === 0) parts.push('০ নল');

  const ansFt = Math.floor(reqFeet);
  const ansIn = (reqFeet - ansFt) * 12;

  return {
    nolLengthFt,
    targetSqFt,
    knownFt,
    knownSideFt: knownFt,
    requiredOppositeFt: reqFeet,
    requiredOppositeNol,
    ansNol,
    ansHat,
    ansBighat,
    ansAngul,
    formattedParts: parts.join(' '),
    ansFt,
    ansIn,
    landDetails: calculateLandFromSqFt(targetSqFt, knownFt, reqFeet),
  };
}

export function calculateReverseNolLand(
  hatPerNol: number,
  targetAmount: number,
  unit: LandUnitType,
  knownSide: NolSideInput
): ReverseNolResult {
  return calculateReverseNol({ hat: hatPerNol, bighat: 0, angul: 0 }, targetAmount, unit, knownSide);
}

/**
 * [৩] ⛰️ মাটির হিসাব (Soil CFT Calculator — Exact calculateMatiArea from calculator-old-model)
 */
export interface DimReading {
  id: string;
  ft: number;
  inch: number;
  hasValue?: boolean;
}

export type SoilPriceMode = 'per1000' | 'per1' | 'per_1000_cft' | 'per_1_cft';

export interface SoilAverageResult {
  avgLenFt: number;
  avgWidFt: number;
  avgHeiFt: number;
  lenCount: number;
  widCount: number;
  heiCount: number;
  totalCft: number;
  priceMode: SoilPriceMode;
  rate: number;
  totalPrice: number;
}

export interface SoilCalculationResult {
  avgLengthFt: number;
  avgWidthFt: number;
  avgDepthFt: number;
  volumeCft: number;
  volumeCubicMeter: number;
  priceMode: SoilPriceMode;
  rate: number;
  totalCost: number;
}

export function calculateAverageDimension(readings: DimReading[]): { avg: number; count: number } {
  let sum = 0;
  let count = 0;
  for (const r of readings) {
    const val = feetInchesToFeet(r.ft, r.inch);
    if (r.hasValue ? true : val > 0) {
      if (val > 0 || r.hasValue) {
        sum += val;
        count++;
      }
    }
  }
  return { avg: count > 0 ? sum / count : 0, count };
}

export function calculateSoilByAverage(
  lengthReadings: DimReading[],
  widthReadings: DimReading[],
  heightReadings: DimReading[],
  priceMode: SoilPriceMode,
  rate: number
): SoilAverageResult {
  const lenStats = calculateAverageDimension(lengthReadings);
  const widStats = calculateAverageDimension(widthReadings);
  const heiStats = calculateAverageDimension(heightReadings);

  const totalCft = Math.max(0, lenStats.avg * widStats.avg * heiStats.avg);
  const safeRate = Math.max(0, rate);
  const isPer1000 = priceMode === 'per1000' || priceMode === 'per_1000_cft';
  const totalPrice = isPer1000 ? (totalCft / 1000) * safeRate : totalCft * safeRate;

  return {
    avgLenFt: lenStats.avg,
    avgWidFt: widStats.avg,
    avgHeiFt: heiStats.avg,
    lenCount: lenStats.count,
    widCount: widStats.count,
    heiCount: heiStats.count,
    totalCft,
    priceMode,
    rate: safeRate,
    totalPrice,
  };
}

export function calculateMultiSoilPit(
  lengths: number[],
  widths: number[],
  depths: number[],
  priceMode: SoilPriceMode,
  rate: number
): SoilCalculationResult {
  const lReadings: DimReading[] = lengths.map((ft, idx) => ({ id: `l-${idx}`, ft, inch: 0 }));
  const wReadings: DimReading[] = widths.map((ft, idx) => ({ id: `w-${idx}`, ft, inch: 0 }));
  const dReadings: DimReading[] = depths.map((ft, idx) => ({ id: `d-${idx}`, ft, inch: 0 }));

  const res = calculateSoilByAverage(lReadings, wReadings, dReadings, priceMode, rate);
  return {
    avgLengthFt: res.avgLenFt,
    avgWidthFt: res.avgWidFt,
    avgDepthFt: res.avgHeiFt,
    volumeCft: res.totalCft,
    volumeCubicMeter: res.totalCft * 0.0283168,
    priceMode,
    rate: res.rate,
    totalCost: res.totalPrice,
  };
}

export interface SoilMeasurementItem {
  id: string;
  label: string;
  lengthFt: number;
  lengthIn: number;
  widthFt: number;
  widthIn: number;
  depthFt: number;
  depthIn: number;
}

export function calculateSoilCft(
  items: SoilMeasurementItem[],
  priceMode: SoilPriceMode,
  rate: number
) {
  const lengths: DimReading[] = items.map((it) => ({ id: it.id, ft: it.lengthFt, inch: it.lengthIn }));
  const widths: DimReading[] = items.map((it) => ({ id: it.id, ft: it.widthFt, inch: it.widthIn }));
  const depths: DimReading[] = items.map((it) => ({ id: it.id, ft: it.depthFt, inch: it.depthIn }));
  return calculateSoilByAverage(lengths, widths, depths, priceMode, rate);
}

/**
 * [৪] 🪵 গাছ ও কাঠের হিসাব (Timber CFT Calculator — Exact addRoundWood & addFlatWood)
 */
export type TimberType = 'round' | 'flat' | 'sawn';

export interface TimberItem {
  id: string;
  type: TimberType;
  description: string;
  quantity: number;
  unitCft: number;
  totalCft: number;
  ratePerCft?: number;
  totalPrice?: number;
}

export interface TimberRow {
  id: string;
  type: TimberType;
  description: string;
  lengthFt: number;
  lengthIn: number;
  girthFt?: number;
  girthIn?: number;
  widthIn?: number;
  thicknessIn?: number;
  quantity: number;
  ratePerCft: number;
  cft: number;
  totalPrice: number;
}

export function calculateRoundTimberCft(
  lengthFt: number,
  lengthIn: number,
  girthFt: number,
  girthIn: number,
  quantity: number,
  ratePerCft: number
): { cft: number; totalPrice: number } {
  const totalLengthFt = feetInchesToFeet(lengthFt, lengthIn);
  const totalGirthIn = (girthFt * 12) + girthIn;
  const qty = Math.max(1, quantity);
  const cft = (Math.pow(totalGirthIn / 4, 2) * totalLengthFt) / 144 * qty;
  const totalPrice = cft * Math.max(0, ratePerCft);
  return { cft, totalPrice };
}

export function calculateFlatTimberCft(
  lengthFt: number,
  lengthIn: number,
  widthIn: number,
  thicknessIn: number,
  quantity: number,
  ratePerCft: number
): { cft: number; totalPrice: number } {
  const totalLengthFt = feetInchesToFeet(lengthFt, lengthIn);
  const qty = Math.max(1, quantity);
  const cft = ((totalLengthFt * widthIn * thicknessIn) / 144) * qty;
  const totalPrice = cft * Math.max(0, ratePerCft);
  return { cft, totalPrice };
}

export function calculateRoundLogItem(
  girthFt: number,
  girthIn: number,
  lengthFt: number,
  lengthIn: number,
  quantity: number,
  id: string,
  ratePerCft = 0
): TimberItem {
  const { cft, totalPrice } = calculateRoundTimberCft(
    lengthFt,
    lengthIn,
    girthFt,
    girthIn,
    quantity,
    ratePerCft
  );
  const qty = Math.max(1, quantity);
  return {
    id,
    type: 'round',
    description: `বেড় ${formatDimBn(girthFt, girthIn)} × লম্বা ${formatDimBn(lengthFt, lengthIn)}`,
    quantity: qty,
    unitCft: cft / qty,
    totalCft: cft,
    ratePerCft: Math.max(0, ratePerCft),
    totalPrice,
  };
}

export function calculateSawnTimberItem(
  widthIn: number,
  thicknessIn: number,
  lengthFt: number,
  lengthIn: number,
  quantity: number,
  id: string,
  ratePerCft = 0
): TimberItem {
  const { cft, totalPrice } = calculateFlatTimberCft(
    lengthFt,
    lengthIn,
    widthIn,
    thicknessIn,
    quantity,
    ratePerCft
  );
  const qty = Math.max(1, quantity);
  return {
    id,
    type: 'sawn',
    description: `${toBnNum(widthIn)}" × ${toBnNum(thicknessIn)}" × ${formatDimBn(lengthFt, lengthIn)}`,
    quantity: qty,
    unitCft: cft / qty,
    totalCft: cft,
    ratePerCft: Math.max(0, ratePerCft),
    totalPrice,
  };
}

export function summarizeTimberCart(items: TimberItem[]): {
  totalPieces: number;
  totalCft: number;
  roundCft: number;
  sawnCft: number;
  totalPrice: number;
} {
  let totalPieces = 0;
  let totalCft = 0;
  let roundCft = 0;
  let sawnCft = 0;
  let totalPrice = 0;
  for (const item of items) {
    totalPieces += item.quantity;
    totalCft += item.totalCft;
    totalPrice += item.totalPrice ?? (item.totalCft * (item.ratePerCft || 0));
    if (item.type === 'round') roundCft += item.totalCft;
    else sawnCft += item.totalCft;
  }
  return { totalPieces, totalCft, roundCft, sawnCft, totalPrice };
}
