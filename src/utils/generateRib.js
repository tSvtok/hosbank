function ribKey(bank, branch, account) {
  const n = BigInt(bank) * 89n + BigInt(branch) * 15n + BigInt(account) * 3n;
  const key = 97n - (n % 97n);
  return String(key).padStart(2, '0');
}

function ibanFromBban(country, bban) {
  const rearranged = `${bban}${country}00`;
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  const check = 98n - (BigInt(numeric) % 97n);
  return `${country}${String(check).padStart(2, '0')}${bban}`;
}

function generateRib() {
  const bank = '30004';
  const branch = '00001';
  const account = String(Math.floor(Math.random() * 10 ** 11)).padStart(11, '0');
  const key = ribKey(bank, branch, account);
  const bban = `${bank}${branch}${account}${key}`;
  const rib = ibanFromBban('FR', bban);
  return {
    rib,
    bank,
    branch,
    account,
    key,
    accountNumber: account.slice(-12).padStart(12, '0'),
  };
}

function formatRib(rib) {
  return String(rib || '')
    .replace(/\s+/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function normalizeRib(rib) {
  return String(rib || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

module.exports = { generateRib, formatRib, normalizeRib };
