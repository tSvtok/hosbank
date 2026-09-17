const { query } = require('../config/database');

const cardRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT id, account_id, user_id, brand, last4, masked, holder_name,
              expiry_month, expiry_year, pin_hash, is_virtual, status, created_at
       FROM cards WHERE id = :id LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByUserId(userId, connection) {
    return query(
      `SELECT c.id, c.account_id, c.user_id, c.brand, c.last4, c.masked, c.holder_name,
              c.expiry_month, c.expiry_year, c.is_virtual, c.status, c.created_at, a.rib
       FROM cards c
       JOIN accounts a ON a.id = c.account_id
       WHERE c.user_id = :userId
       ORDER BY c.created_at DESC`,
      { userId },
      connection,
    );
  },

  async create(card, connection) {
    const result = await query(
      `INSERT INTO cards (
         account_id, user_id, brand, last4, masked, holder_name,
         expiry_month, expiry_year, pin_hash, is_virtual, status
       ) VALUES (
         :accountId, :userId, :brand, :last4, :masked, :holderName,
         :expiryMonth, :expiryYear, :pinHash, :isVirtual, :status
       )`,
      card,
      connection,
    );
    return result.insertId;
  },

  async setStatus(id, status, connection) {
    await query('UPDATE cards SET status = :status WHERE id = :id', { id, status }, connection);
  },

  async updatePin(id, pinHash, connection) {
    await query('UPDATE cards SET pin_hash = :pinHash WHERE id = :id', { id, pinHash }, connection);
  },

  async listAll(connection) {
    return query(
      `SELECT c.id, c.account_id, c.user_id, c.brand, c.last4, c.masked, c.holder_name,
              c.expiry_month, c.expiry_year, c.is_virtual, c.status, c.created_at,
              u.email, u.first_name, u.last_name
       FROM cards c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC`,
      {},
      connection,
    );
  },
};

module.exports = cardRepository;
