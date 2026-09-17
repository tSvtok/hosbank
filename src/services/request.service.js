const { DomainError } = require('../middlewares/error.middleware');
const requestRepository = require('../repositories/request.repository');
const accountRepository = require('../repositories/account.repository');
const cardRepository = require('../repositories/card.repository');
const userRepository = require('../repositories/user.repository');
const accountService = require('./account.service');
const cardService = require('./card.service');
const { formatRib } = require('../utils/generateRib');
const { sendRequestDecisionEmail } = require('../utils/email');

const CLIENT_TYPES = ['savings_account', 'new_card', 'rib', 'pin_reset', 'card_opposition'];

const requestService = {
  async listForUser(userId) {
    return requestRepository.findByUserId(userId);
  },

  async listAll(managerId = null) {
    return requestRepository.listAll({ managerId });
  },

  async create({ userId, type, message, relatedAccountId, relatedCardId }) {
    if (!CLIENT_TYPES.includes(type)) {
      throw new DomainError('Type de demande invalide.');
    }

    if (type === 'rib') {
      let account = relatedAccountId ? await accountRepository.findById(relatedAccountId) : null;
      if (!account) {
        const accounts = await accountRepository.findByUserId(userId);
        account = accounts[0] || null;
        relatedAccountId = account?.id || null;
      }
      if (!account || account.user_id !== userId) {
        throw new DomainError('Compte introuvable pour la demande de RIB.');
      }
    }

    if (type === 'pin_reset' || type === 'card_opposition') {
      let card = relatedCardId ? await cardRepository.findById(relatedCardId) : null;
      if (!card) {
        const cards = await cardRepository.findByUserId(userId);
        card = cards.find((item) => item.status === 'active') || cards[0] || null;
        relatedCardId = card?.id || null;
      }
      if (!card || card.user_id !== userId) {
        throw new DomainError('Carte introuvable.');
      }
      if (type === 'card_opposition' && card.status === 'blocked') {
        throw new DomainError('Cette carte est déjà en opposition.');
      }
    }

    const duplicate = await requestRepository.findPendingDuplicate(
      userId,
      type,
      relatedCardId,
      relatedAccountId,
    );
    if (duplicate) {
      throw new DomainError('Une demande identique est déjà en attente.');
    }

    return requestRepository.create({
      userId,
      type,
      message: message || null,
      relatedAccountId: relatedAccountId || null,
      relatedCardId: relatedCardId || null,
    });
  },

  async decide({ requestId, status, handlerId, response, actor }) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new DomainError('Statut de demande invalide.');
    }
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new DomainError('Demande introuvable.', 404);
    }
    if (request.status !== 'pending') {
      throw new DomainError('Cette demande a déjà été traitée.');
    }
    if (actor?.roleName === 'manager' && Number(request.manager_id) !== Number(actor.id)) {
      throw new DomainError('Cette demande n’appartient pas à votre portefeuille.');
    }

    let finalResponse = response || null;

    if (status === 'approved') {
      if (request.type === 'savings_account') {
        await accountService.createSavingsAccount(request.user_id);
        finalResponse = finalResponse || 'Livret d’épargne ouvert.';
      }
      if (request.type === 'new_card') {
        await cardService.issueForUser(request.user_id);
        finalResponse = finalResponse || 'Carte virtuelle émise. Le PIN a été envoyé par e-mail.';
      }
      if (request.type === 'rib') {
        const account = await accountRepository.findById(request.related_account_id);
        finalResponse =
          finalResponse || `RIB officiel : ${formatRib(account?.rib || '')}`;
      }
      if (request.type === 'pin_reset') {
        await cardService.resetPin(request.related_card_id, request.user_id);
        finalResponse = finalResponse || 'PIN renouvelé. Le nouveau code a été envoyé par e-mail.';
      }
      if (request.type === 'card_opposition') {
        await cardService.forceStatus(request.related_card_id, 'blocked');
        finalResponse = finalResponse || 'Opposition enregistrée. La carte est bloquée.';
      }
    }

    await requestRepository.updateDecision(requestId, {
      status,
      handledBy: handlerId,
      response: finalResponse,
    });

    const owner = await userRepository.findById(request.user_id);
    const labels = {
      savings_account: 'Livret d’épargne',
      new_card: 'Carte virtuelle',
      rib: 'RIB',
      pin_reset: 'Renouvellement PIN',
      card_opposition: 'Opposition carte',
    };
    try {
      await sendRequestDecisionEmail(
        { email: owner.email, firstName: owner.first_name },
        labels[request.type] || request.type,
        status,
        finalResponse,
      );
    } catch (error) {
      console.error('Envoi e-mail de décision impossible :', error.message);
    }
  },
};

module.exports = requestService;
