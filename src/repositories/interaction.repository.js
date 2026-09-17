const { query } = require('../config/database');

const interactionRepository = {
  async findByClientId(clientId, connection) {
    return query(
      `SELECT i.id, i.manager_id, i.client_id, i.type, i.content, i.created_at,
              m.first_name AS manager_first_name, m.last_name AS manager_last_name
       FROM interactions i
       JOIN users m ON m.id = i.manager_id
       WHERE i.client_id = :clientId
       ORDER BY i.created_at DESC`,
      { clientId },
      connection,
    );
  },

  async create(interaction, connection) {
    const result = await query(
      `INSERT INTO interactions (manager_id, client_id, type, content)
       VALUES (:managerId, :clientId, :type, :content)`,
      interaction,
      connection,
    );
    return result.insertId;
  },
};

module.exports = interactionRepository;
