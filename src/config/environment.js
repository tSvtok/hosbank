require('dotenv').config();

const env = {
  node: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT) || 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'hosbank',
    password: process.env.DB_PASSWORD || 'hosbank',
    name: process.env.DB_NAME || 'hosbank',
  },
  mail: {
    host: process.env.MAIL_HOST || 'localhost',
    port: Number(process.env.MAIL_PORT) || 1025,
    from: process.env.MAIL_FROM || 'Hosbank <noreply@hosbank.local>',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@hosbank.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
  manager: {
    email: process.env.MANAGER_EMAIL || 'manager@hosbank.local',
    password: process.env.MANAGER_PASSWORD || 'Manager123!',
  },
};

module.exports = env;
