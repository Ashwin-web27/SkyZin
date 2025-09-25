// Test currency formatting
const { formatPrice, formatPriceFull, calculateDiscountPercentage, calculateSavings } = require('./lib/utils/currency.ts');

console.log('Testing Currency Formatting:');
console.log('----------------------------');

// Test different price ranges
const testPrices = [500, 1500, 12499, 16599, 125000, 1500000, 50000000];

testPrices.forEach(price => {
  console.log(`₹${price.toLocaleString('en-IN')} -> ${formatPrice(price)}`);
});

console.log('\nTesting Full Format:');
console.log('--------------------');
testPrices.forEach(price => {
  console.log(`₹${price.toLocaleString('en-IN')} -> ${formatPriceFull(price)}`);
});

console.log('\nTesting Discount Calculation:');
console.log('-----------------------------');
console.log(`Original: ₹16,599, Current: ₹12,499`);
console.log(`Discount: ${calculateDiscountPercentage(16599, 12499)}%`);
console.log(`Savings: ${formatPrice(calculateSavings(16599, 12499))}`);