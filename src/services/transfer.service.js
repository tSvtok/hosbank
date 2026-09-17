const { DomainError } = require('../middlewares/error.middleware');
const { withTransaction } = require('../config/database');
const accountRepository = require('../repositories/account.repository');
const beneficiaryRepository = require('../repositories/beneficiary.repository');
const transferRepository = require('../repositories/transfer.repository');
const { normalizeRib } = require('../utils/generateRib');

function toAmount(value) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new DomainError('Le montant doit être supérieur à 0.');
  }
  return Number(amount.toFixed(2));
}

const transferService = {
  async listForUser(userId) {
    return transferRepository.listForUser(userId);
  },

  async listAll() {
    return transferRepository.listAll();
  },

  async execute({ userId, fromAccountId, beneficiaryId, amount, label }) {
    const parsedAmount = toAmount(amount);
    const beneficiary = await beneficiaryRepository.findById(beneficiaryId);
    if (!beneficiary || beneficiary.user_id !== userId) {
      throw new DomainError('Bénéficiaire introuvable.');
    }

    const destination = await accountRepository.findByRib(normalizeRib(beneficiary.rib));
    if (!destination) {
      throw new DomainError('Ce RIB n’est pas un compte Hosbank (virements internes uniquement).');
    }

    await withTransaction(async (connection) => {
      const source = await accountRepository.findByIdForUpdate(fromAccountId, connection);
      if (!source || source.user_id !== userId) {
        throw new DomainError('Compte source introuvable.');
      }
      if (source.status !== 'active') {
        throw new DomainError('Ce compte n’est pas actif.');
      }
      if (source.id === destination.id) {
        throw new DomainError('Le virement vers le même compte est impossible.');
      }

      const lockedDestination = await accountRepository.findByIdForUpdate(
        destination.id,
        connection,
      );
      if (lockedDestination.status !== 'active') {
        throw new DomainError('Le compte destinataire n’est pas actif.');
      }

      const sourceBalance = Number(source.balance);
      if (sourceBalance < parsedAmount) {
        throw new DomainError('Solde insuffisant.');
      }

      await accountRepository.updateBalance(
        source.id,
        (sourceBalance - parsedAmount).toFixed(2),
        connection,
      );
      await accountRepository.updateBalance(
        lockedDestination.id,
        (Number(lockedDestination.balance) + parsedAmount).toFixed(2),
        connection,
      );
      await transferRepository.create(
        {
          fromAccountId: source.id,
          toAccountId: lockedDestination.id,
          beneficiaryId: beneficiary.id,
          amount: parsedAmount,
          type: 'transfer',
          label: label || `Virement vers ${beneficiary.label}`,
          status: 'completed',
        },
        connection,
      );
    });
  },
};

module.exports = transferService;
