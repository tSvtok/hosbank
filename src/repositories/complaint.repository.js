const { query } = require('../config/database');

const complaintRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT c.id, c.user_id, c.subject, c.message, c.response, c.status, c.handled_by, c.created_at, c.updated_at,
              u.first_name, u.last_name, u.email
       FROM complaints c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = :id
       LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByUserId(userId, connection) {
    return query(
      `SELECT id, user_id, subject, message, response, status, handled_by, created_at, updated_at
       FROM complaints WHERE user_id = :userId ORDER BY created_at DESC`,
      { userId },
      connection,
    );
  },

  async listAll({ managerId } = {}, connection) {
    return query(
      `SELECT c.id, c.user_id, c.subject, c.message, c.response, c.status, c.created_at,
              u.first_name, u.last_name, u.email, u.manager_id
       FROM complaints c
       JOIN users u ON u.id = c.user_id
       WHERE (:managerId IS NULL OR u.manager_id = :managerId)
       ORDER BY c.created_at DESC`,
      { managerId: managerId || null },
      connection,
    );
  },

  async create(complaint, connection) {
    const result = await query(
      `INSERT INTO complaints (user_id, subject, message, status)
       VALUES (:userId, :subject, :message, 'open')`,
      complaint,
      connection,
    );
    return result.insertId;
  },

  async updateStatus(id, { status, handledBy, response }, connection) {
    await query(
      `UPDATE complaints SET status = :status, handled_by = :handledBy, response = :response WHERE id = :id`,
      { id, status, handledBy, response: response || null },
      connection,
    );
  },
};

module.exports = complaintRepository;
