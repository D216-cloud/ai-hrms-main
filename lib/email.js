import nodemailer from "nodemailer";

// Create reusable transporter
export const createTransporter = () => {
  // If running locally and emails are disabled, avoid creating transporter
  if (process.env.DISABLE_EMAIL === 'true') return null;

  // Check if we're using Gmail or custom SMTP
  const isGmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_USER.includes("gmail.com"));
  const isCustom = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

  if (isGmail) {
    // Gmail configuration (use App Password)
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    });
  } else if (isCustom) {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // No valid email configuration available
  return null;
};

/**
 * Send email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
export async function sendEmail({ to, subject, html, text }) {
  // Respect DISABLE_EMAIL or missing config in non-production environments
  const transporter = createTransporter();
  if (!transporter) {
    const reason = process.env.DISABLE_EMAIL === 'true' ? 'Email disabled via DISABLE_EMAIL' : 'Email configuration missing';
    console.warn(`Skipping sendEmail: ${reason}`);
    return { success: false, error: reason };
  }

  try {
    const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"AI HRMS" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>/g, "") : ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log a friendly message and include the error message but do not throw
    console.error("Error sending email:", error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
