/**
 * Bengali Numeral and Formatting Utilities
 * Converts English <-> Bengali digits, formats land/timber/soil calculations,
 * and handles number parsing for Bengali UI.
 */

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts English digits (0-9) to Bengali digits (০-৯).
 * Also formats numbers cleanly with decimal places if provided.
 */
export function toBnNum(val: number | string | undefined | null, decimals?: number): string {
  if (val === undefined || val === null || val === '') return '০';
  
  let numStr = typeof val === 'number' 
    ? (decimals !== undefined ? val.toFixed(decimals) : val.toString())
    : val.toString();

  // If passed a numeric string with decimals constraint
  if (typeof val === 'string' && decimals !== undefined && !isNaN(parseFloat(val))) {
    numStr = parseFloat(val).toFixed(decimals);
  }

  return numStr.replace(/\d/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Parses a string containing either English (0-9) or Bengali (০-৯) digits into a standard JS number.
 */
export function parseBnNum(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || val.trim() === '') return 0;

  // Replace Bengali digits with English digits
  let enStr = val.toString();
  for (let i = 0; i < 10; i++) {
    enStr = enStr.replace(new RegExp(BENGALI_DIGITS[i], 'g'), ENGLISH_DIGITS[i]);
  }

  // Remove commas or unwanted non-numeric characters except decimal point
  enStr = enStr.replace(/,/g, '').trim();

  const num = parseFloat(enStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats currency in Bangladeshi Taka with Bengali digits (e.g. ৳ ১,২৫,০০০.০০)
 */
export function formatBnCurrency(amount: number): string {
  const rounded = amount.toFixed(2);
  const parts = rounded.split('.');
  
  // Format integer part with Bangladeshi number grouping (3, 2, 2...)
  let intPart = parts[0];
  let lastThree = intPart.substring(intPart.length - 3);
  let otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  
  const bnInt = toBnNum(formattedInt);
  const bnDec = toBnNum(parts[1]);
  
  return `৳ ${bnInt}.${bnDec}`;
}

/**
 * Feet and inches helper functions
 */
export function feetInchesToFeet(feet: number, inches: number): number {
  return feet + (inches / 12);
}

export function feetToFeetInches(totalFeet: number): { feet: number; inches: number } {
  const feet = Math.floor(totalFeet);
  const inches = Math.round((totalFeet - feet) * 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Traditional Bangladeshi Land Sub-units (কড়া, ক্রান্তি, তিল) calculation:
 * 1 Decimal (শতাংশ) = 435.6 sq ft
 * 1 Katha (কাঠা) = 720 sq ft
 * 1 Bigha (বিঘা) = 14,400 sq ft (20 Katha)
 * 1 Kara (কড়া) = 216 sq ft (1/4 Gonda)
 * 1 Kranti (ক্রান্তি) = 72 sq ft (1/3 Kara)
 * 1 Til (তিল) = 3.6 sq ft (1/20 Kranti)
 */
export interface TraditionalUnits {
  katha: number;
  gonda: number;
  kara: number;
  kranti: number;
  til: number;
}

export function sqFtToTraditionalUnits(sqFt: number): TraditionalUnits {
  let remaining = sqFt;

  const katha = Math.floor(remaining / 720);
  remaining %= 720;

  const gonda = Math.floor(remaining / 432); // 1 Gonda = 432 sq ft in traditional system
  remaining %= 432;

  const kara = Math.floor(remaining / 216); // 1 Kara = 216 sq ft
  remaining %= 216;

  const kranti = Math.floor(remaining / 72); // 1 Kranti = 72 sq ft
  remaining %= 72;

  const til = Math.round(remaining / 3.6); // 1 Til = 3.6 sq ft

  return { katha, gonda, kara, kranti, til };
}

/**
 * Formats current timestamp in Bengali
 */
export function getBnDateTime(date: Date = new Date()): string {
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const day = toBnNum(date.getDate());
  const month = months[date.getMonth()];
  const year = toBnNum(date.getFullYear());
  
  let hours = date.getHours();
  const minutes = toBnNum(date.getMinutes().toString().padStart(2, '0'));
  const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  hours = hours % 12 || 12;

  return `${day} ${month}, ${year} (${ampm} ${toBnNum(hours)}:${minutes})`;
}
