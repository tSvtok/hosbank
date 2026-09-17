const { query } = require('../config/database');

const transferRepository = {
  async create(transfer, connection) {
    const result = await query(
      `INSERT INTO transfers (
         from_account_id, to_account_id, beneficiary_id, amount, type, label, status
       ) VALUES (
         :fromAccountId, :toAccountId, :beneficiaryId, :amount, :type, :label, :status
       )`,
      transfer,
      connection,
    );
    return result.insertId;
  },

  async listForUser(userId, connection) {
    return query(
      `SELECT t.id, t.amount, t.type, t.label, t.status, t.created_at,
              fa.rib AS from_rib, ta.rib AS to_rib,
              fa.account_number AS from_account_number,
              ta.account_number AS to_account_number
       FROM transfers t
       LEFT JOIN accounts fa ON fa.id = t.from_account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       WHERE t.from_account_id IN (SELECT id FROM accounts WHERE user_id = :userId)
          OR t.to_account_id IN (SELECT id FROM accounts WHERE user_id = :userId)
       ORDER BY t.created_at DESC
       LIMIT 50`,
      { userId },
      connection,
    );
  },

  async listAll(connection) {
    return query(
      `SELECT t.id, t.amount, t.type, t.label, t.status, t.created_at,
              fa.rib AS from_rib, ta.rib AS to_rib
       FROM transfers t
       LEFT JOIN accounts fa ON fa.id = t.from_account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       ORDER BY t.created_at DESC
       LIMIT 100`,
      {},
      connection,
    );
  },
};

module.exports = transferRepository;
