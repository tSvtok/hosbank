const { DomainError } = require('../middlewares/error.middleware');
const beneficiaryRepository = require('../repositories/beneficiary.repository');
const { normalizeRib } = require('../utils/generateRib');

const beneficiaryService = {
  async listForUser(userId) {
    return beneficiaryRepository.findByUserId(userId);
  },

  async create({ userId, label, holderName, rib }) {
    const normalized = normalizeRib(rib);
    if (!/^FR\d{12,25}$/.test(normalized) && !/^\d{10,27}$/.test(normalized)) {
      throw new DomainError('RIB / IBAN invalide.');
    }
    return beneficiaryRepository.create({
      userId,
      label,
      holderName,
      rib: normalized,
    });
  },

  async remove(id, userId) {
    const existing = await beneficiaryRepository.findById(id);
    if (!existing || existing.user_id !== userId) {
      throw new DomainError('Bénéficiaire introuvable.', 404);
    }
    await beneficiaryRepository.remove(id, userId);
  },
};

module.exports = beneficiaryService;
