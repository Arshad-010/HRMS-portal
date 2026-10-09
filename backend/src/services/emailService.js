import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports (like 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration (optional startup check)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Nodemailer: SMTP connection error. Emails will not be sent.', error.message);
  } else {
    console.log('✅ Nodemailer: SMTP server is ready to take our messages');
  }
});

/**
 * Send an email
 * @param {Object} options 
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.text Plain text content
 * @param {string} options.html HTML content
 * @returns {Promise<boolean>} Success status
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"HRMS Portal" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${options.to}:`, error);
    return false;
  }
};

/**
 * Send welcome/activation email to a new employee
 * @param {Object} employee 
 * @param {string} activationUrl 
 * @returns {Promise<boolean>}
 */
export const sendActivationEmail = async (employee, activationUrl) => {
  const subject = 'Welcome to HRMS Portal - Activate Your Account';
  
  const text = `
    Hello ${employee.firstName},
    
    Welcome to the HRMS Portal! Your account has been provisioned.
    
    Please activate your account and set your password by clicking the link below:
    ${activationUrl}
    
    This link will expire in 24 hours.
    
    If you did not expect this invitation, please contact your HR or Administration team.
    
    Best regards,
    HRMS Portal Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0ea5e9; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">HRMS Portal</h2>
      </div>
      <div style="padding: 30px;">
        <h3 style="color: #0f172a; margin-top: 0;">Welcome, ${employee.firstName}!</h3>
        <p style="color: #475569; line-height: 1.6;">
          Your new account has been successfully provisioned on the HRMS Portal.
        </p>
        <p style="color: #475569; line-height: 1.6;">
          To get started, please securely activate your account and set your permanent password by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Activate My Account
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">
          Or copy and paste this link into your browser:<br/>
          <a href="${activationUrl}" style="color: #0ea5e9; word-break: break-all;">${activationUrl}</a>
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>This secure link will expire in 24 hours.</p>
          <p>If you did not expect this invitation, please contact your HR or Administration team.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: employee.email,
    subject,
    text,
    html
  });
};
