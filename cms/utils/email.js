/**
 * Email sending helper (stubbed for development)
 */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Stub: log to console
    transporter = {
      sendMail: async (options) => {
        console.log('[EMAIL STUB] Would send email:');
        console.log(`  To: ${options.to}`);
        console.log(`  Subject: ${options.subject}`);
        console.log(`  Body: ${options.text || options.html}`);
        return { messageId: 'stub-' + Date.now() };
      }
    };
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  return t.sendMail({
    from: process.env.SMTP_FROM || 'noreply@websitemo.com',
    to,
    subject,
    text,
    html
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: 'Password Reset — WebsiteMo CMS',
    text: `You requested a password reset. Click the link below:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p><p>If you didn't request this, ignore this email.</p>`
  });
}

module.exports = { sendEmail, sendPasswordResetEmail };
