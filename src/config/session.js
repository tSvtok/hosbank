const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const env = require('./environment');

function createSessionMiddleware() {
  const store = new MySQLStore({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
    },
  });

  return session({
    name: 'hosbank.sid',
    secret: env.sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    },
  });
}

module.exports = { createSessionMiddleware };
