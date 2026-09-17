-- Hosbank — schéma complet (rôles, clients, comptes, virements, cartes)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NULL,
  role_id INT UNSIGNED NOT NULL,
  manager_id INT UNSIGNED NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  verification_token VARCHAR(64) NULL,
  verification_expires DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_verification_token (verification_token),
  INDEX idx_users_manager (manager_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  rib VARCHAR(27) NULL UNIQUE,
  account_number CHAR(12) NOT NULL UNIQUE,
  type ENUM('checking', 'savings') NOT NULL DEFAULT 'checking',
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_accounts_user (user_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  label VARCHAR(120) NOT NULL,
  holder_name VARCHAR(160) NOT NULL,
  rib VARCHAR(27) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_beneficiaries_user (user_id),
  CONSTRAINT fk_beneficiaries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transfers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_account_id INT UNSIGNED NULL,
  to_account_id INT UNSIGNED NULL,
  beneficiary_id INT UNSIGNED NULL,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('deposit', 'withdrawal', 'transfer') NOT NULL DEFAULT 'transfer',
  label VARCHAR(255) NULL,
  status ENUM('completed', 'rejected') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transfers_from (from_account_id),
  INDEX idx_transfers_to (to_account_id),
  CONSTRAINT fk_transfers_from FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  CONSTRAINT fk_transfers_to FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  CONSTRAINT fk_transfers_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  brand VARCHAR(20) NOT NULL DEFAULT 'visa',
  last4 CHAR(4) NOT NULL,
  masked VARCHAR(32) NOT NULL,
  holder_name VARCHAR(160) NOT NULL,
  expiry_month CHAR(2) NOT NULL,
  expiry_year SMALLINT NOT NULL,
  pin_hash VARCHAR(255) NULL,
  is_virtual TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cards_user (user_id),
  CONSTRAINT fk_cards_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_cards_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM(
    'checkbook',
    'new_card',
    'savings_account',
    'appointment',
    'rib',
    'pin_reset',
    'card_opposition'
  ) NOT NULL,
  message TEXT NULL,
  response TEXT NULL,
  related_account_id INT UNSIGNED NULL,
  related_card_id INT UNSIGNED NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  handled_by INT UNSIGNED NULL,
  handled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_requests_user (user_id),
  CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_requests_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_requests_account FOREIGN KEY (related_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_requests_card FOREIGN KEY (related_card_id) REFERENCES cards(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaints (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NULL,
  status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  handled_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_complaints_user (user_id),
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_complaints_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  manager_id INT UNSIGNED NOT NULL,
  client_id INT UNSIGNED NOT NULL,
  type ENUM('call', 'meeting', 'note') NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interactions_client (client_id),
  CONSTRAINT fk_interactions_manager FOREIGN KEY (manager_id) REFERENCES users(id),
  CONSTRAINT fk_interactions_client FOREIGN KEY (client_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO roles (name, label) VALUES
  ('admin', 'Administrateur'),
  ('manager', 'Conseiller'),
  ('client', 'Client')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO permissions (code, label) VALUES
  ('users.read', 'Consulter les utilisateurs'),
  ('users.manage', 'Gérer les utilisateurs'),
  ('accounts.read_own', 'Consulter ses comptes'),
  ('accounts.read_all', 'Consulter tous les comptes'),
  ('accounts.transfer', 'Effectuer un virement'),
  ('accounts.manage', 'Gérer les comptes'),
  ('requests.handle', 'Traiter les demandes'),
  ('complaints.handle', 'Traiter les réclamations')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('users.read', 'accounts.read_own', 'accounts.read_all', 'requests.handle', 'complaints.handle')
WHERE r.name = 'manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN ('accounts.read_own', 'accounts.transfer')
WHERE r.name = 'client';
