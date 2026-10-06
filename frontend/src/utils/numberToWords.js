/**
 * Converts numeric amounts into formal English words for hospital invoices and receipts.
 * Example: 3500 -> "Three Thousand Five Hundred Rupees Only"
 * Example: 4250.50 -> "Four Thousand Two Hundred Fifty Rupees and Fifty Cents Only"
 */
export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Zero Rupees Only';

  const num = Math.abs(Number(amount));
  if (num === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertGroup(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (billions > 0) {
    result += convertGroup(billions) + ' Billion ';
  }
  if (millions > 0) {
    result += convertGroup(millions) + ' Million ';
  }
  if (thousands > 0) {
    result += convertGroup(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder) + ' ';
  }

  result = result.trim();
  if (!result) result = 'Zero';

  let finalWords = result + ' Rupees';

  if (decimalPart > 0) {
    finalWords += ' and ' + convertGroup(decimalPart) + ' Cents';
  }

  return finalWords + ' Only';
}
