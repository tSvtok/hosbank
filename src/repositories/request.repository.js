const { query } = require('../config/database');

const requestSelect = `r.id, r.user_id, r.type, r.message, r.response, r.related_account_id, r.related_card_id,
              r.status, r.handled_by, r.handled_at, r.created_at,
              u.first_name, u.last_name, u.email, u.manager_id`;

const requestRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT ${requestSelect}
       FROM requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = :id
       LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByUserId(userId, connection) {
    return query(
      `SELECT id, user_id, type, message, response, related_account_id, related_card_id,
              status, handled_by, handled_at, created_at
       FROM requests WHERE user_id = :userId ORDER BY created_at DESC`,
      { userId },
      connection,
    );
  },

  async listAll({ managerId } = {}, connection) {
    return query(
      `SELECT ${requestSelect}
       FROM requests r
       JOIN users u ON u.id = r.user_id
       WHERE (:managerId IS NULL OR u.manager_id = :managerId)
       ORDER BY r.created_at DESC`,
      { managerId: managerId || null },
      connection,
    );
  },

  async findPendingDuplicate(userId, type, relatedCardId, relatedAccountId, connection) {
    const rows = await query(
      `SELECT id FROM requests
       WHERE user_id = :userId AND type = :type AND status = 'pending'
         AND related_card_id <=> :relatedCardId
         AND related_account_id <=> :relatedAccountId
       LIMIT 1`,
      {
        userId,
        type,
        relatedCardId: relatedCardId || null,
        relatedAccountId: relatedAccountId || null,
      },
      connection,
    );
    return rows[0] || null;
  },

  async create(request, connection) {
    const result = await query(
      `INSERT INTO requests (user_id, type, message, related_account_id, related_card_id, status)
       VALUES (:userId, :type, :message, :relatedAccountId, :relatedCardId, 'pending')`,
      {
        relatedAccountId: null,
        relatedCardId: null,
        ...request,
      },
      connection,
    );
    return result.insertId;
  },

  async updateDecision(id, { status, handledBy, response }, connection) {
    await query(
      `UPDATE requests
       SET status = :status, handled_by = :handledBy, handled_at = NOW(), response = :response
       WHERE id = :id`,
      { id, status, handledBy, response: response || null },
      connection,
    );
  },
};

module.exports = requestRepository;
