const { DomainError } = require('../middlewares/error.middleware');
const { query } = require('../config/database');
const userRepository = require('../repositories/user.repository');
const accountRepository = require('../repositories/account.repository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateRib } = require('../utils/generateRib');

const ALLOWED_ROLES = ['client', 'manager', 'admin'];

const userService = {
  async getWithPermissions(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }
    const permissions = await userRepository.getPermissionsForRole(user.role_id);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      roleId: user.role_id,
      roleName: user.role_name,
      roleLabel: user.role_label,
      managerId: user.manager_id,
      emailVerified: Boolean(user.email_verified),
      status: user.status || 'active',
      permissions,
    };
  },

  async listUsers() {
    return userRepository.listAll();
  },

  async listManagers() {
    return userRepository.listByRole('manager');
  },

  async listRoles() {
    return userRepository.listRoles();
  },

  async listClientsForManager(managerId) {
    return userRepository.listClientsByManager(managerId);
  },

  async listManagerActivity() {
    return userRepository.listManagerActivity();
  },

  async assignManager(userId, managerId) {
    await userRepository.assignManager(userId, managerId || null);
  },

  async setStatus(userId, status) {
    if (!['active', 'suspended'].includes(status)) {
      throw new DomainError('Statut utilisateur invalide.');
    }
    await userRepository.setStatus(userId, status);
  },

  async updateProfile(userId, { firstName, lastName, phone, currentPassword, newPassword }) {
    if (newPassword) {
      const user = await userRepository.findById(userId);
      if (!currentPassword || !(await verifyPassword(currentPassword, user.password_hash))) {
        throw new DomainError('Mot de passe actuel incorrect.');
      }
      if (newPassword.length < 8) {
        throw new DomainError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      }
      await userRepository.updatePassword(userId, await hashPassword(newPassword));
    }
    await userRepository.updateProfile(userId, { firstName, lastName, phone });
  },

  async createUser({ email, password, firstName, lastName, phone, roleName, managerId }) {
    if (!ALLOWED_ROLES.includes(roleName)) {
      throw new DomainError('Rôle invalide.');
    }
    if (await userRepository.findByEmail(email)) {
      throw new DomainError('Cette adresse e-mail est déjà utilisée.');
    }
    if (!password || password.length < 8) {
      throw new DomainError('Le mot de passe doit contenir au moins 8 caractères.');
    }
    const role = await userRepository.findRoleByName(roleName);
    const userId = await userRepository.create({
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: phone || null,
      roleId: role.id,
      managerId: roleName === 'client' ? managerId || null : null,
      emailVerified: 1,
      verificationToken: null,
      verificationExpires: null,
    });

    if (roleName === 'client') {
      const generated = generateRib();
      await accountRepository.create({
        userId,
        rib: generated.rib,
        accountNumber: generated.accountNumber,
        type: 'checking',
        balance: 0,
        currency: 'EUR',
        status: 'active',
      });
    }

    return userId;
  },

  async updateUser(userId, payload) {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new DomainError('Utilisateur introuvable.', 404);
    }
    if (!ALLOWED_ROLES.includes(payload.roleName)) {
      throw new DomainError('Rôle invalide.');
    }
    const other = await userRepository.findByEmail(payload.email);
    if (other && other.id !== userId) {
      throw new DomainError('Cette adresse e-mail est déjà utilisée.');
    }
    const role = await userRepository.findRoleByName(payload.roleName);
    await userRepository.updateAdmin(userId, {
      id: userId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone || null,
      roleId: role.id,
      managerId: payload.roleName === 'client' ? payload.managerId || null : null,
      status: payload.status || existing.status,
      emailVerified: existing.email_verified,
    });
    if (payload.password) {
      if (payload.password.length < 8) {
        throw new DomainError('Le mot de passe doit contenir au moins 8 caractères.');
      }
      await userRepository.updatePassword(userId, await hashPassword(payload.password));
    }
  },

  async getStats() {
    const [users] = await query(
      `SELECT
         COUNT(*) AS total_users,
         SUM(CASE WHEN r.name = 'client' THEN 1 ELSE 0 END) AS clients,
         SUM(CASE WHEN r.name = 'manager' THEN 1 ELSE 0 END) AS managers,
         SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) AS admins
       FROM users u JOIN roles r ON r.id = u.role_id`,
    );
    const [accounts] = await query(
      `SELECT COUNT(*) AS total_accounts, COALESCE(SUM(balance), 0) AS total_balance
       FROM accounts WHERE status = 'active'`,
    );
    const [transfers] = await query(
      `SELECT COUNT(*) AS total_transfers, COALESCE(SUM(amount), 0) AS transfer_volume
       FROM transfers WHERE type = 'transfer'`,
    );
    const [requests] = await query(
      `SELECT COUNT(*) AS total_requests,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_requests
       FROM requests`,
    );
    const [complaints] = await query(
      `SELECT COUNT(*) AS total_complaints,
              SUM(CASE WHEN status <> 'closed' THEN 1 ELSE 0 END) AS open_complaints
       FROM complaints`,
    );
    const [cards] = await query(
      `SELECT COUNT(*) AS total_cards,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_cards,
              SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked_cards
       FROM cards`,
    );
    return {
      ...users,
      ...accounts,
      ...transfers,
      ...requests,
      ...complaints,
      ...cards,
    };
  },
};

module.exports = userService;
