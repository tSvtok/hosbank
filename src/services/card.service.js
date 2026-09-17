const { DomainError } = require('../middlewares/error.middleware');
const cardRepository = require('../repositories/card.repository');
const accountRepository = require('../repositories/account.repository');
const userRepository = require('../repositories/user.repository');
const { generateCard, generatePin } = require('../utils/generateCard');
const { hashPassword } = require('../utils/password');
const { sendPinEmail } = require('../utils/email');

const cardService = {
  async listForUser(userId) {
    return cardRepository.findByUserId(userId);
  },

  async listAll() {
    return cardRepository.listAll();
  },

  async forceStatus(cardId, status) {
    const card = await cardRepository.findById(cardId);
    if (!card) {
      throw new DomainError('Carte introuvable.', 404);
    }
    if (!['active', 'blocked', 'pending'].includes(status)) {
      throw new DomainError('Statut de carte invalide.');
    }
    await cardRepository.setStatus(cardId, status);
  },

  async issueForUser(userId) {
    const accounts = await accountRepository.findByUserId(userId);
    const checking = accounts.find((item) => item.type === 'checking') || accounts[0];
    if (!checking) {
      throw new DomainError('Aucun compte pour émettre une carte.');
    }
    const owner = await userRepository.findById(userId);
    const card = generateCard(`${owner.first_name} ${owner.last_name}`);
    const pinHash = await hashPassword(card.pin);
    const cardId = await cardRepository.create({
      accountId: checking.id,
      userId,
      brand: card.brand,
      last4: card.last4,
      masked: card.masked,
      holderName: card.holderName,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      pinHash,
      isVirtual: 1,
      status: 'active',
    });
    try {
      await sendPinEmail(
        { email: owner.email, firstName: owner.first_name },
        card.pin,
        card.last4,
      );
    } catch (error) {
      console.error('Envoi e-mail PIN impossible :', error.message);
    }
    return cardId;
  },

  async resetPin(cardId, userId) {
    const card = await cardRepository.findById(cardId);
    if (!card || (userId && card.user_id !== userId)) {
      throw new DomainError('Carte introuvable.', 404);
    }
    const pin = generatePin();
    await cardRepository.updatePin(cardId, await hashPassword(pin));
    const owner = await userRepository.findById(card.user_id);
    try {
      await sendPinEmail(
        { email: owner.email, firstName: owner.first_name },
        pin,
        card.last4,
      );
    } catch (error) {
      console.error('Envoi e-mail PIN impossible :', error.message);
    }
  },
};

module.exports = cardService;
