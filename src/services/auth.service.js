const crypto = require('crypto');
const { DomainError } = require('../middlewares/error.middleware');
const { withTransaction } = require('../config/database');
const userRepository = require('../repositories/user.repository');
const accountRepository = require('../repositories/account.repository');
const transferRepository = require('../repositories/transfer.repository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendVerificationEmail } = require('../utils/email');
const { generateRib } = require('../utils/generateRib');

const WELCOME_AMOUNT = 100;
const TOKEN_TTL_HOURS = 24;

function hashToken() {
  return crypto.randomBytes(32).toString('hex');
}

function tokenExpiry() {
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_TTL_HOURS);
  return expires;
}

const authService = {
  async register({ email, password, firstName, lastName, phone }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new DomainError('Cette adresse e-mail est déjà utilisée.');
    }

    const clientRole = await userRepository.findRoleByName('client');
    if (!clientRole) {
      throw new DomainError('Rôle client introuvable.', 500);
    }

    const managers = await userRepository.listByRole('manager');
    const managerId = managers[0]?.id || null;
    const passwordHash = await hashPassword(password);
    const verificationToken = hashToken();

    await withTransaction(async (connection) => {
      const userId = await userRepository.create(
        {
          email,
          passwordHash,
          firstName,
          lastName,
          phone: phone || null,
          roleId: clientRole.id,
          managerId,
          emailVerified: 0,
          verificationToken,
          verificationExpires: tokenExpiry(),
        },
        connection,
      );

      const generated = generateRib();
      const accountId = await accountRepository.create(
        {
          userId,
          rib: generated.rib,
          accountNumber: generated.accountNumber,
          type: 'checking',
          balance: WELCOME_AMOUNT,
          currency: 'EUR',
          status: 'active',
        },
        connection,
      );

      await transferRepository.create(
        {
          fromAccountId: null,
          toAccountId: accountId,
          beneficiaryId: null,
          amount: WELCOME_AMOUNT,
          type: 'deposit',
          label: 'Offre de bienvenue',
          status: 'completed',
        },
        connection,
      );
    });

    return sendVerificationEmail({ email, firstName }, verificationToken);
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new DomainError('Identifiants incorrects.');
    }

    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      throw new DomainError('Identifiants incorrects.');
    }

    if (!user.email_verified) {
      throw new DomainError(
        'Votre e-mail n’est pas encore vérifié. Consultez votre boîte de réception.',
      );
    }

    if (user.status === 'suspended') {
      throw new DomainError('Ce compte est suspendu.');
    }

    return user;
  },

  async verifyEmail(token) {
    if (!token) {
      throw new DomainError('Jeton de vérification manquant.');
    }
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new DomainError('Lien de vérification invalide.');
    }
    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      throw new DomainError('Ce lien a expiré. Demandez un nouvel e-mail de vérification.');
    }
    await userRepository.markEmailVerified(user.id);
  },

  async resendVerification(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return;
    }
    if (user.email_verified) {
      throw new DomainError('Ce compte est déjà vérifié.');
    }
    const token = hashToken();
    await userRepository.setVerificationToken(user.id, token, tokenExpiry());
    await sendVerificationEmail({ email: user.email, firstName: user.first_name }, token);
  },
};

module.exports = authService;
