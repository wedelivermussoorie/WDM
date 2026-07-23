const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using the Resend service.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 */
async function sendEmail({ to, subject, html, attachments }) {
  const payload = {
    from: "We Deliver Mussoorie <noreply@wedelivermussoorie.com>",
    to,
    subject,
    html,
  };

  if (attachments) {
    payload.attachments = attachments;
  }

  const { error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

module.exports = sendEmail;