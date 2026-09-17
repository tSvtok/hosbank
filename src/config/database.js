const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('./environment');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  multipleStatements: true,
  charset: 'utf8mb4',
  timezone: 'Z',
});

async function query(sql, params, connection = pool) {
  const [rows] = await connection.query(sql, params);
  return rows;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function waitForDb(retries = 40) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await query('SELECT 1 AS ok');
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = :table
       AND COLUMN_NAME = :column`,
    { table, column },
  );
  return Number(rows[0].total) > 0;
}

async function tableExists(table) {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = :table`,
    { table },
  );
  return Number(rows[0].total) > 0;
}

async function applySchema() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true,
  });
  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }
}

async function migrateLegacy() {
  if (await tableExists('users')) {
    if (!(await columnExists('users', 'phone'))) {
      await query('ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER last_name');
    }
    if (!(await columnExists('users', 'manager_id'))) {
      await query(
        'ALTER TABLE users ADD COLUMN manager_id INT UNSIGNED NULL AFTER role_id',
      );
    }
    if (!(await columnExists('users', 'status'))) {
      await query(
        "ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER email_verified",
      );
    }
  }

  if (await tableExists('accounts')) {
    if (!(await columnExists('accounts', 'rib'))) {
      await query('ALTER TABLE accounts ADD COLUMN rib VARCHAR(27) NULL AFTER user_id');
    }
    if (!(await columnExists('accounts', 'type'))) {
      await query(
        "ALTER TABLE accounts ADD COLUMN type ENUM('checking', 'savings') NOT NULL DEFAULT 'checking' AFTER account_number",
      );
    }
  }

  if (await tableExists('cards')) {
    if (!(await columnExists('cards', 'pin_hash'))) {
      await query('ALTER TABLE cards ADD COLUMN pin_hash VARCHAR(255) NULL AFTER expiry_year');
    }
    if (!(await columnExists('cards', 'is_virtual'))) {
      await query(
        'ALTER TABLE cards ADD COLUMN is_virtual TINYINT(1) NOT NULL DEFAULT 1 AFTER pin_hash',
      );
    }
  }

  if (await tableExists('requests')) {
    await query(
      `ALTER TABLE requests
       MODIFY COLUMN type ENUM(
         'checkbook', 'new_card', 'savings_account', 'appointment',
         'rib', 'pin_reset', 'card_opposition'
       ) NOT NULL`,
    );
    if (!(await columnExists('requests', 'response'))) {
      await query('ALTER TABLE requests ADD COLUMN response TEXT NULL AFTER message');
    }
    if (!(await columnExists('requests', 'related_account_id'))) {
      await query(
        'ALTER TABLE requests ADD COLUMN related_account_id INT UNSIGNED NULL AFTER response',
      );
    }
    if (!(await columnExists('requests', 'related_card_id'))) {
      await query(
        'ALTER TABLE requests ADD COLUMN related_card_id INT UNSIGNED NULL AFTER related_account_id',
      );
    }
  }

  if (await tableExists('complaints') && !(await columnExists('complaints', 'response'))) {
    await query('ALTER TABLE complaints ADD COLUMN response TEXT NULL AFTER message');
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  waitForDb,
  applySchema,
  migrateLegacy,
};
