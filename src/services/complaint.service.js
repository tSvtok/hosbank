const { DomainError } = require('../middlewares/error.middleware');
const complaintRepository = require('../repositories/complaint.repository');
const userRepository = require('../repositories/user.repository');
const { sendComplaintResponseEmail } = require('../utils/email');

const complaintService = {
  async listForUser(userId) {
    return complaintRepository.findByUserId(userId);
  },

  async listAll(managerId = null) {
    return complaintRepository.listAll({ managerId });
  },

  async create({ userId, subject, message }) {
    return complaintRepository.create({ userId, subject, message });
  },

  async updateStatus({ complaintId, status, handlerId, response, actor }) {
    if (!['open', 'in_progress', 'closed'].includes(status)) {
      throw new DomainError('Statut de réclamation invalide.');
    }
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new DomainError('Réclamation introuvable.', 404);
    }
    const owner = await userRepository.findById(complaint.user_id);
    if (actor?.roleName === 'manager' && Number(owner.manager_id) !== Number(actor.id)) {
      throw new DomainError('Cette réclamation n’appartient pas à votre portefeuille.');
    }
    await complaintRepository.updateStatus(complaintId, {
      status,
      handledBy: handlerId,
      response,
    });
    try {
      await sendComplaintResponseEmail(
        { email: owner.email, firstName: owner.first_name },
        complaint.subject,
        status,
        response,
      );
    } catch (error) {
      console.error('Envoi e-mail de réclamation impossible :', error.message);
    }
  },
};

module.exports = complaintService;
