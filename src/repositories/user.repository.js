const { query } = require('../config/database');

const userRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone,
              u.role_id, u.manager_id, u.email_verified, u.status,
              u.verification_token, u.verification_expires, u.created_at,
              r.name AS role_name, r.label AS role_label
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = :id
       LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByEmail(email, connection) {
    const rows = await query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone,
              u.role_id, u.manager_id, u.email_verified, u.status,
              u.verification_token, u.verification_expires, u.created_at,
              r.name AS role_name, r.label AS role_label
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = :email
       LIMIT 1`,
      { email },
      connection,
    );
    return rows[0] || null;
  },

  async findByVerificationToken(token, connection) {
    const rows = await query(
      `SELECT id, email, verification_expires FROM users WHERE verification_token = :token LIMIT 1`,
      { token },
      connection,
    );
    return rows[0] || null;
  },

  async findRoleByName(name, connection) {
    const rows = await query(
      'SELECT id, name, label FROM roles WHERE name = :name LIMIT 1',
      { name },
      connection,
    );
    return rows[0] || null;
  },

  async getPermissionsForRole(roleId, connection) {
    const rows = await query(
      `SELECT p.code
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = :roleId
       ORDER BY p.code`,
      { roleId },
      connection,
    );
    return rows.map((row) => row.code);
  },

  async listAll(connection) {
    return query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.email_verified, u.status, u.created_at,
              u.manager_id, r.name AS role_name, r.label AS role_label,
              m.first_name AS manager_first_name, m.last_name AS manager_last_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN users m ON m.id = u.manager_id
       ORDER BY u.created_at DESC`,
      {},
      connection,
    );
  },

  async listByRole(roleName, connection) {
    return query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at, u.manager_id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = :roleName
       ORDER BY u.last_name, u.first_name`,
      { roleName },
      connection,
    );
  },

  async listClientsByManager(managerId, connection) {
    return query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'client' AND u.manager_id = :managerId
       ORDER BY u.last_name`,
      { managerId },
      connection,
    );
  },

  async create(user, connection) {
    const result = await query(
      `INSERT INTO users (
         email, password_hash, first_name, last_name, phone, role_id, manager_id,
         email_verified, verification_token, verification_expires
       ) VALUES (
         :email, :passwordHash, :firstName, :lastName, :phone, :roleId, :managerId,
         :emailVerified, :verificationToken, :verificationExpires
       )`,
      {
        phone: null,
        managerId: null,
        ...user,
      },
      connection,
    );
    return result.insertId;
  },

  async markEmailVerified(id, connection) {
    await query(
      `UPDATE users
       SET email_verified = 1, verification_token = NULL, verification_expires = NULL
       WHERE id = :id`,
      { id },
      connection,
    );
  },

  async setVerificationToken(id, token, expires, connection) {
    await query(
      `UPDATE users
       SET verification_token = :token, verification_expires = :expires
       WHERE id = :id`,
      { id, token, expires },
      connection,
    );
  },

  async listRoles(connection) {
    return query('SELECT id, name, label FROM roles ORDER BY id', {}, connection);
  },

  async updateProfile(id, { firstName, lastName, phone }, connection) {
    await query(
      `UPDATE users SET first_name = :firstName, last_name = :lastName, phone = :phone WHERE id = :id`,
      { id, firstName, lastName, phone: phone || null },
      connection,
    );
  },

  async updatePassword(id, passwordHash, connection) {
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', {
      id,
      passwordHash,
    }, connection);
  },

  async updateAdmin(id, data, connection) {
    await query(
      `UPDATE users
       SET first_name = :firstName,
           last_name = :lastName,
           email = :email,
           phone = :phone,
           role_id = :roleId,
           manager_id = :managerId,
           status = :status,
           email_verified = :emailVerified
       WHERE id = :id`,
      data,
      connection,
    );
  },

  async listManagerActivity(connection) {
    return query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.status,
              (SELECT COUNT(*) FROM users c
               JOIN roles cr ON cr.id = c.role_id
               WHERE c.manager_id = m.id AND cr.name = 'client') AS client_count,
              (SELECT COUNT(*) FROM requests req
               JOIN users cu ON cu.id = req.user_id
               WHERE cu.manager_id = m.id AND req.status = 'pending') AS pending_requests,
              (SELECT COUNT(*) FROM requests req WHERE req.handled_by = m.id) AS handled_requests,
              (SELECT COUNT(*) FROM complaints comp
               JOIN users cu ON cu.id = comp.user_id
               WHERE cu.manager_id = m.id AND comp.status <> 'closed') AS open_complaints
       FROM users m
       JOIN roles r ON r.id = m.role_id
       WHERE r.name = 'manager'
       ORDER BY m.last_name`,
      {},
      connection,
    );
  },

  async assignManager(id, managerId, connection) {
    await query('UPDATE users SET manager_id = :managerId WHERE id = :id', { id, managerId }, connection);
  },

  async setStatus(id, status, connection) {
    await query('UPDATE users SET status = :status WHERE id = :id', { id, status }, connection);
  },
};

module.exports = userRepository;
