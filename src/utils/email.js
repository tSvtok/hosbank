const nodemailer = require('nodemailer');
const env = require('../config/environment');

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: false,
});

async function sendMail({ to, subject, text, html }) {
  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.appUrl}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Vérifiez votre adresse e-mail — Hosbank',
    text: `Bonjour ${user.firstName},\n\nConfirmez votre compte Hosbank :\n${verifyUrl}\n\nLe lien expire dans 24 heures.\n`,
    html: `<p>Bonjour ${user.firstName},</p>
      <p>Confirmez votre compte Hosbank :</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Le lien expire dans 24 heures.</p>`,
  });
  return verifyUrl;
}

async function sendPinEmail(user, pin, last4) {
  await sendMail({
    to: user.email,
    subject: 'Votre code PIN Hosbank',
    text: `Bonjour ${user.firstName},\n\nLe code PIN de votre carte virtuelle **** ${last4} est : ${pin}\nNe communiquez ce code à personne.\n`,
    html: `<p>Bonjour ${user.firstName},</p>
      <p>Le code PIN de votre carte virtuelle **** ${last4} est : <strong>${pin}</strong></p>
      <p>Ne communiquez ce code à personne.</p>`,
  });
}

async function sendRequestDecisionEmail(user, typeLabel, status, response) {
  await sendMail({
    to: user.email,
    subject: `Votre demande « ${typeLabel} » a été ${status === 'approved' ? 'acceptée' : 'refusée'}`,
    text: `Bonjour ${user.firstName},\n\nVotre demande « ${typeLabel} » est ${status === 'approved' ? 'acceptée' : 'refusée'}.\n${response || ''}\n`,
    html: `<p>Bonjour ${user.firstName},</p>
      <p>Votre demande « ${typeLabel} » est <strong>${status === 'approved' ? 'acceptée' : 'refusée'}</strong>.</p>
      ${response ? `<p>${response}</p>` : ''}`,
  });
}

async function sendComplaintResponseEmail(user, subject, status, response) {
  await sendMail({
    to: user.email,
    subject: `Votre réclamation « ${subject} » — Hosbank`,
    text: `Bonjour ${user.firstName},\n\nVotre réclamation « ${subject} » est maintenant « ${status} ».\n${response || ''}\n`,
    html: `<p>Bonjour ${user.firstName},</p>
      <p>Votre réclamation « ${subject} » est maintenant <strong>${status}</strong>.</p>
      ${response ? `<p>${response}</p>` : ''}`,
  });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPinEmail,
  sendRequestDecisionEmail,
  sendComplaintResponseEmail,
};
