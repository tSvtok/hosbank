const { query } = require('../config/database');

const accountRepository = {
  async findById(id, connection) {
    const rows = await query(
      `SELECT id, user_id, rib, account_number, type, balance, currency, status, created_at
       FROM accounts WHERE id = :id LIMIT 1`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByIdForUpdate(id, connection) {
    const rows = await query(
      `SELECT id, user_id, rib, account_number, type, balance, currency, status, created_at
       FROM accounts WHERE id = :id LIMIT 1 FOR UPDATE`,
      { id },
      connection,
    );
    return rows[0] || null;
  },

  async findByRib(rib, connection) {
    const rows = await query(
      `SELECT id, user_id, rib, account_number, type, balance, currency, status, created_at
       FROM accounts WHERE rib = :rib LIMIT 1`,
      { rib },
      connection,
    );
    return rows[0] || null;
  },

  async findByUserId(userId, connection) {
    return query(
      `SELECT id, user_id, rib, account_number, type, balance, currency, status, created_at
       FROM accounts WHERE user_id = :userId ORDER BY created_at ASC`,
      { userId },
      connection,
    );
  },

  async listAll(connection) {
    return query(
      `SELECT a.id, a.user_id, a.rib, a.account_number, a.type, a.balance, a.currency, a.status,
              u.email, u.first_name, u.last_name
       FROM accounts a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC`,
      {},
      connection,
    );
  },

  async create(account, connection) {
    const result = await query(
      `INSERT INTO accounts (user_id, rib, account_number, type, balance, currency, status)
       VALUES (:userId, :rib, :accountNumber, :type, :balance, :currency, :status)`,
      account,
      connection,
    );
    return result.insertId;
  },

  async updateBalance(id, balance, connection) {
    await query('UPDATE accounts SET balance = :balance WHERE id = :id', { id, balance }, connection);
  },

  async setStatus(id, status, connection) {
    await query('UPDATE accounts SET status = :status WHERE id = :id', { id, status }, connection);
  },
};

module.exports = accountRepository;
