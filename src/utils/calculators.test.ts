import test from 'node:test';
import assert from 'node:assert/strict';
import { toBnNum, toBnAngul, parseBnNum, formatBnCurrency, feetInchesToFeet } from './bengali';
import {
  calculateQuadLand,
  calculateHeronLand,
  calculateReverseLand,
  calculateNolLengthInFeet,
  calculateLandByNol,
  calculateReverseNol,
  calculateSoilByAverage,
  calculateMultiSoilPit,
  calculateRoundTimberCft,
  calculateFlatTimberCft,
  LENGTH_UNITS,
  AREA_UNITS,
  convertLengthUnits,
  convertAreaUnits,
} from './calculators';

test('Bengali numeral conversion, Angul formatting without decimals, and parsing works accurately', () => {
  assert.equal(toBnNum(1234567890), '১২৩৪৫৬৭৮৯০');
  assert.equal(toBnNum(435.6, 2), '৪৩৫.৬০');
  assert.equal(toBnAngul(1), '১');
  assert.equal(toBnAngul(2), '২');
  assert.equal(toBnAngul(3), '৩');
  assert.equal(toBnAngul(1.5), '১.৫');
  assert.equal(parseBnNum('৪৩৫.৬০'), 435.6);
  assert.equal(parseBnNum('100'), 100);
  assert.equal(formatBnCurrency(1500), '৳ ১,৫০০.০০');
  assert.equal(feetInchesToFeet(10, 6), 10.5);
});

test('Land calculator: Quad (including 1-side fallback), Heron, Kura/Katha/Dhur, and Reverse', () => {
  // 43.56 ft x 100 ft = 4356 sq ft = 10 Shotok (Decimal)
  const quad = calculateQuadLand(100, 0, 100, 0, 43, 6.72, 43, 6.72);
  assert.ok(Math.abs(quad.sqFt - 4356) < 0.01);
  assert.ok(Math.abs(quad.decimal - 10) < 0.01);
  assert.ok(Math.abs(quad.katha - (10 / 3.30)) < 0.01);
  assert.equal(quad.kathaCount, 3);

  // If 2nd side is 0 (empty), uses 1st side directly without dividing by 2 (exact old-model behavior)
  const singleSide = calculateQuadLand(100, 0, 0, 0, 43, 6.72, 0, 0);
  assert.ok(Math.abs(singleSide.sqFt - 4356) < 0.01);

  // 3-4-5 right triangle -> area = 6 sq ft
  const heron = calculateHeronLand(3, 0, 4, 0, 5, 0);
  assert.equal(heron.isValidTriangle, true);
  assert.ok(Math.abs(heron.sqFt - 6) < 0.001);

  // Invalid triangle
  const invalidHeron = calculateHeronLand(1, 0, 2, 0, 10, 0);
  assert.equal(invalidHeron.isValidTriangle, false);

  // Reverse calculation: 10 shotok (4356 sq ft) with known side 100 ft -> opposite 43.56 ft (43 ft 6.72 in)
  const rev = calculateReverseLand(10, 'decimal', 100, 0);
  assert.ok(Math.abs(rev.requiredOppositeFt - 43.56) < 0.01);
  assert.equal(rev.ansFt, 43);
  assert.ok(Math.abs(rev.ansIn - 6.72) < 0.01);
});

test('Nol calculator: Nol length (1 angul = 1/12 ft), land by Nol+Hat+Bighat+Angul, and reverse Nol', () => {
  // 4 hat = 6 ft, 1 bighat = 0.75 ft, 6 angul = 0.5 ft -> 7.25 ft
  const nolFt = calculateNolLengthInFeet({ hat: 4, bighat: 1, angul: 6 });
  assert.equal(nolFt, 7.25);

  // 8 hat = 12 ft; 10 nol x 10 nol = 120ft x 120ft = 14400 sq ft
  const nolLand = calculateLandByNol({ hat: 8, bighat: 0, angul: 0 }, 10, 10);
  assert.equal(nolLand.sqFt, 14400);
  assert.equal(nolLand.standardKatha, 20);

  // Reverse Nol: 10 shotok (4356 sq ft) with 4-hat nol (6 ft) and known side 10 nol (60 ft)
  // reqFeet = 4356 / 60 = 72.6 ft = 12 nol (72 ft) + 0 hat + 0 bighat + 7 angul (0.6 ft = 7.2 in)
  const revNol = calculateReverseNol({ hat: 4, bighat: 0, angul: 0 }, 10, 'decimal', 10);
  assert.equal(revNol.ansNol, 12);
  assert.equal(revNol.ansHat, 0);
  assert.equal(revNol.ansBighat, 0);
  assert.equal(revNol.ansAngul, 7);
});

test('Soil CFT calculator: Multi-reading average (avgLen * avgWid * avgHei) & price modes', () => {
  const lenReadings = [
    { id: 'l1', ft: 90, inch: 0 },
    { id: 'l2', ft: 110, inch: 0 },
  ]; // avgLen = 100
  const widReadings = [
    { id: 'w1', ft: 15, inch: 0 },
    { id: 'w2', ft: 25, inch: 0 },
  ]; // avgWid = 20
  const heiReadings = [
    { id: 'h1', ft: 5, inch: 0 },
  ]; // avgHei = 5
  // 100 * 20 * 5 = 10,000 CFT
  const resPer1000 = calculateSoilByAverage(lenReadings, widReadings, heiReadings, 'per1000', 5000);
  assert.equal(resPer1000.totalCft, 10000);
  assert.equal(resPer1000.totalPrice, 50000);

  const resPer1 = calculateSoilByAverage(lenReadings, widReadings, heiReadings, 'per1', 5);
  assert.equal(resPer1.totalCft, 10000);
  assert.equal(resPer1.totalPrice, 50000);

  // Test 6 readings with Feet + Inch (e.g. 9 ft 6 in + 10 ft 6 in = avg 10 ft)
  const multiRes = calculateMultiSoilPit(
    [
      { ft: 9, inch: 6 },
      { ft: 10, inch: 6 },
      { ft: 9, inch: 6 },
      { ft: 10, inch: 6 },
      { ft: 9, inch: 6 },
      { ft: 10, inch: 6 },
    ],
    [
      { ft: 19, inch: 6 },
      { ft: 20, inch: 6 },
    ],
    [
      { ft: 4, inch: 6 },
      { ft: 5, inch: 6 },
    ],
    'per_1000_cft',
    5000
  );
  assert.equal(multiRes.avgLengthFt, 10);
  assert.equal(multiRes.avgWidthFt, 20);
  assert.equal(multiRes.avgDepthFt, 5);
  assert.equal(multiRes.volumeCft, 1000);
  assert.equal(multiRes.totalCost, 5000);
});

test('Timber CFT calculator: Hoppus Rule (round) and Size/Flat timber', () => {
  const round = calculateRoundTimberCft(12, 0, 4, 0, 1, 1000);
  assert.ok(Math.abs(round.cft - 12) < 0.001);
  assert.ok(Math.abs(round.totalPrice - 12000) < 0.01);

  const flat = calculateFlatTimberCft(12, 0, 12, 2, 6, 1500);
  assert.ok(Math.abs(flat.cft - 12) < 0.001);
  assert.ok(Math.abs(flat.totalPrice - 18000) < 0.01);
});

test('Unit converter: all 10 length units and 14 area units convert accurately', () => {
  assert.equal(LENGTH_UNITS.length, 10);
  assert.equal(AREA_UNITS.length, 14);

  // Empty / zero input defaults cleanly
  const zeroLen = convertLengthUnits(0, 'ft');
  assert.equal(zeroLen[0].formatted, '০.০০');
  assert.equal(zeroLen[8].formatted, '০.০০০০'); // km minDec=4

  // 100 ft -> 1200 inch, 30.48 m, 66.6667 hat, 33.3333 gaj
  const fromFt = convertLengthUnits(100, 'ft');
  const byKeyLen = Object.fromEntries(fromFt.map((r) => [r.key, r]));
  assert.ok(Math.abs(byKeyLen.inch.value - 1200) < 1e-6);
  assert.ok(Math.abs(byKeyLen.meter.value - 30.48) < 1e-6);
  assert.ok(Math.abs(byKeyLen.hat.value - (100 / 1.5)) < 1e-6);
  assert.ok(Math.abs(byKeyLen.gaj.value - (100 / 3)) < 1e-6);
  assert.ok(Math.abs(byKeyLen.cm.value - 3048) < 1e-6);
  assert.ok(Math.abs(byKeyLen.mm.value - 30480) < 1e-6);

  // 100 link = 66 ft (Gunter chain)
  const fromLink = convertLengthUnits(100, 'link');
  assert.ok(Math.abs(fromLink[0].value - 66) < 1e-6);
  assert.equal(fromLink.find((r) => r.key === 'link')?.isSource, true);

  // 1 mile = 5280 ft
  const fromMile = convertLengthUnits(1, 'mile');
  assert.ok(Math.abs(fromMile[0].value - 5280) < 1e-6);

  // Area: 1 shotok = 435.6 sq ft = 100 ojutangsho = 1000 sqlink = 0.5 gonda = 2 kora = 0.01 acre
  const fromShotok = convertAreaUnits(1, 'shotok');
  const byKeyArea = Object.fromEntries(fromShotok.map((r) => [r.key, r]));
  assert.ok(Math.abs(byKeyArea.sqft.value - 435.6) < 1e-6);
  assert.ok(Math.abs(byKeyArea.ojutangsho.value - 100) < 1e-6);
  assert.ok(Math.abs(byKeyArea.sqlink.value - 1000) < 1e-6);
  assert.ok(Math.abs(byKeyArea.gonda.value - 0.5) < 1e-6);
  assert.ok(Math.abs(byKeyArea.kora.value - 2) < 1e-6);
  assert.ok(Math.abs(byKeyArea.acre.value - 0.01) < 1e-6);

  // 1 kani = 40 shotok = 17424 sq ft; 1 bigha = 20 katha = 14400 sq ft; 1 hectare = 10000 sq meter
  const fromKani = convertAreaUnits(1, 'kani');
  assert.ok(Math.abs(fromKani.find((r) => r.key === 'shotok')!.value - 40) < 1e-6);

  const fromHectare = convertAreaUnits(1, 'hectare');
  assert.ok(Math.abs(fromHectare.find((r) => r.key === 'sqmeter')!.value - 10000) < 1e-6);

  const fromSqHat = convertAreaUnits(1, 'sqgaj');
  assert.ok(Math.abs(fromSqHat.find((r) => r.key === 'sqhat')!.value - 4) < 1e-6);
});

