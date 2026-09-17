const { DomainError } = require('../middlewares/error.middleware');
const accountRepository = require('../repositories/account.repository');
const transferRepository = require('../repositories/transfer.repository');
const cardRepository = require('../repositories/card.repository');
const userRepository = require('../repositories/user.repository');
const { generateRib } = require('../utils/generateRib');

const accountService = {
  async getDashboard(userId) {
    const [accounts, transfers, cards] = await Promise.all([
      accountRepository.findByUserId(userId),
      transferRepository.listForUser(userId),
      cardRepository.findByUserId(userId),
    ]);
    return { accounts, transfers, cards };
  },

  async getByIdForUser(accountId, userId) {
    const account = await accountRepository.findById(accountId);
    if (!account || account.user_id !== userId) {
      throw new DomainError('Compte introuvable.', 404);
    }
    return account;
  },

  async listAll() {
    return accountRepository.listAll();
  },

  async setStatus(accountId, status) {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      throw new DomainError('Compte introuvable.', 404);
    }
    await accountRepository.setStatus(accountId, status);
  },

  async createSavingsAccount(userId) {
    return this.createForUser(userId, 'savings');
  },

  async createForUser(userId, type = 'checking') {
    if (!['checking', 'savings'].includes(type)) {
      throw new DomainError('Type de compte invalide.');
    }
    const owner = await userRepository.findById(userId);
    if (!owner) {
      throw new DomainError('Utilisateur introuvable.', 404);
    }
    const generated = generateRib();
    return accountRepository.create({
      userId,
      rib: generated.rib,
      accountNumber: generated.accountNumber,
      type,
      balance: 0,
      currency: 'EUR',
      status: 'active',
    });
  },
};

module.exports = accountService;
