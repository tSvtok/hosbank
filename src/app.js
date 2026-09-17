const path = require('path');
const express = require('express');
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/environment');
const { query, waitForDb, applySchema, migrateLegacy } = require('./config/database');
const { createSessionMiddleware } = require('./config/session');
const { loadUser } = require('./middlewares/auth.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { seed } = require('../database/seeds/staff');
const { formatRib } = require('./utils/generateRib');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const accountRoutes = require('./routes/account.routes');
const transferRoutes = require('./routes/transfer.routes');
const beneficiaryRoutes = require('./routes/beneficiary.routes');
const requestRoutes = require('./routes/request.routes');
const complaintRoutes = require('./routes/complaint.routes');
const cardRoutes = require('./routes/card.routes');
const managerRoutes = require('./routes/manager.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.locals.formatMoney = (value, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value));
app.locals.formatRib = formatRib;
app.locals.requestTypeLabel = {
  checkbook: 'Chéquier',
  new_card: 'Carte virtuelle',
  savings_account: 'Livret d’épargne',
  appointment: 'Rendez-vous',
  rib: 'RIB',
  pin_reset: 'Renouvellement PIN',
  card_opposition: 'Opposition carte',
};
app.locals.accountTypeLabel = {
  checking: 'Compte courant',
  savings: 'Livret',
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
        ],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
      },
    },
  }),
);
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(createSessionMiddleware());
app.use(flash());
app.use((req, res, next) => {
  res.locals.title = 'Hosbank';
  res.locals.flash = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info'),
  };
  next();
});
app.use(loadUser);

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, db: true });
  } catch (error) {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use('/', authRoutes);
app.use('/client', clientRoutes);
app.use('/accounts', accountRoutes);
app.use('/transfers', transferRoutes);
app.use('/beneficiaries', beneficiaryRoutes);
app.use('/requests', requestRoutes);
app.use('/complaints', complaintRoutes);
app.use('/cards', cardRoutes);
app.use('/manager', managerRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await waitForDb();
  await applySchema();
  await migrateLegacy();
  await seed();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Hosbank disponible sur ${env.appUrl}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Impossible de démarrer Hosbank :', error);
    process.exit(1);
  });
}

module.exports = app;
