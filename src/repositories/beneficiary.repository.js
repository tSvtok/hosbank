const { query } = require('../config/database');

const beneficiaryRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT id, user_id, label, holder_name, rib, created_at
       FROM beneficiaries WHERE id = :id LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByUserId(userId, connection) {
    return query(
      `SELECT id, user_id, label, holder_name, rib, created_at
       FROM beneficiaries WHERE user_id = :userId ORDER BY label`,
      { userId },
      connection,
    );
  },

  async create(beneficiary, connection) {
    const result = await query(
      `INSERT INTO beneficiaries (user_id, label, holder_name, rib)
       VALUES (:userId, :label, :holderName, :rib)`,
      beneficiary,
      connection,
    );
    return result.insertId;
  },

  async remove(id, userId, connection) {
    await query(
      'DELETE FROM beneficiaries WHERE id = :id AND user_id = :userId',
      { id, userId },
      connection,
    );
  },
};

module.exports = beneficiaryRepository;
