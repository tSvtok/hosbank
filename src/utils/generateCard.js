const crypto = require('crypto');

function generatePin() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

function generateCard(holderName) {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = new Date().getFullYear() + 3;
  return {
    last4,
    masked: `**** **** **** ${last4}`,
    expiryMonth: month,
    expiryYear: year,
    holderName,
    brand: 'visa',
    pin: generatePin(),
    isVirtual: true,
  };
}

module.exports = { generateCard, generatePin };
