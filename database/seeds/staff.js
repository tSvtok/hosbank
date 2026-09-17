const { query } = require('../../src/config/database');
const env = require('../../src/config/environment');
const userRepository = require('../../src/repositories/user.repository');
const accountRepository = require('../../src/repositories/account.repository');
const cardRepository = require('../../src/repositories/card.repository');
const transferRepository = require('../../src/repositories/transfer.repository');
const { hashPassword } = require('../../src/utils/password');
const { generateRib } = require('../../src/utils/generateRib');
const { generateCard } = require('../../src/utils/generateCard');

async function findRole(name) {
  const rows = await query('SELECT id, name FROM roles WHERE name = :name LIMIT 1', { name });
  return rows[0] || null;
}

async function createStaffUser({ email, password, firstName, lastName, roleId, managerId = null }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return existing.id;
  }
  return userRepository.create({
    email,
    passwordHash: await hashPassword(password),
    firstName,
    lastName,
    phone: null,
    roleId,
    managerId,
    emailVerified: 1,
    verificationToken: null,
    verificationExpires: null,
  });
}

async function ensureAccountAndCard(userId, firstName, lastName, openingBalance, issueCard = false) {
  const accounts = await accountRepository.findByUserId(userId);
  if (accounts.length > 0) {
    for (const account of accounts) {
      if (!account.rib) {
        const generated = generateRib();
        await query('UPDATE accounts SET rib = :rib WHERE id = :id', {
          rib: generated.rib,
          id: account.id,
        });
      }
    }
    return accounts[0].id;
  }

  const generated = generateRib();
  const accountId = await accountRepository.create({
    userId,
    rib: generated.rib,
    accountNumber: generated.accountNumber,
    type: 'checking',
    balance: openingBalance,
    currency: 'EUR',
    status: 'active',
  });

  if (openingBalance > 0) {
    await transferRepository.create({
      fromAccountId: null,
      toAccountId: accountId,
      beneficiaryId: null,
      amount: openingBalance,
      type: 'deposit',
      label: 'Dotation initiale',
      status: 'completed',
    });
  }

  if (issueCard) {
    const card = generateCard(`${firstName} ${lastName}`);
    await cardRepository.create({
      accountId,
      userId,
      brand: card.brand,
      last4: card.last4,
      masked: card.masked,
      holderName: card.holderName,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      pinHash: await hashPassword(card.pin),
      isVirtual: 1,
      status: 'active',
    });
  }

  return accountId;
}

async function seed() {
  const adminRole = await findRole('admin');
  const managerRole = await findRole('manager');
  const clientRole = await findRole('client');
  if (!adminRole || !managerRole || !clientRole) {
    throw new Error('Rôles introuvables. Vérifiez database/schema.sql.');
  }

  const adminId = await createStaffUser({
    email: env.admin.email,
    password: env.admin.password,
    firstName: 'Admin',
    lastName: 'Hosbank',
    roleId: adminRole.id,
  });
  await ensureAccountAndCard(adminId, 'Admin', 'Hosbank', 10000, false);

  const managerId = await createStaffUser({
    email: env.manager.email,
    password: env.manager.password,
    firstName: 'Camille',
    lastName: 'Morel',
    roleId: managerRole.id,
  });
  await ensureAccountAndCard(managerId, 'Camille', 'Morel', 0, false);

  const clientId = await createStaffUser({
    email: 'client@hosbank.local',
    password: 'Client123!',
    firstName: 'Léa',
    lastName: 'Martin',
    roleId: clientRole.id,
    managerId,
  });
  await ensureAccountAndCard(clientId, 'Léa', 'Martin', 1250, true);

  const client2Id = await createStaffUser({
    email: 'client2@hosbank.local',
    password: 'Client123!',
    firstName: 'Noah',
    lastName: 'Bernard',
    roleId: clientRole.id,
    managerId,
  });
  await ensureAccountAndCard(client2Id, 'Noah', 'Bernard', 800, true);
}

module.exports = { seed };
