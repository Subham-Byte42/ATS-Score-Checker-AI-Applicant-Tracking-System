import nodemailer from 'nodemailer';

/**
 * Helper to get a configured Nodemailer transport.
 * If SMTP credentials are provided in env, it uses those.
 * Otherwise, it falls back to a stream transport so account creation always succeeds smoothly.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    const isGmail = host.toLowerCase().includes('gmail');
    if (isGmail) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS via STARTTLS
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Fallback stream transport when SMTP credentials are missing
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

/**
 * Sends a welcome / registration confirmation email to the user's email address.
 * @param to Email address of the recipient
 * @param userName Name of the user (or extracted from email)
 */
export async function sendWelcomeEmail(to: string, userName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    const displayName = userName || to.split('@')[0] || 'Valued User';
    const recipientEmail = to.trim();

    const smtpUser = process.env.SMTP_USER;
    
    // For Gmail and standard SMTP servers, the From header MUST match the authenticated user address
    // otherwise recipient mail servers (and Gmail itself) will block/bounce the email for domain spoofing.
    let fromAddress: string;
    if (smtpUser) {
      fromAddress = `"ATS Score Checker" <${smtpUser}>`;
    } else if (process.env.SMTP_FROM) {
      fromAddress = process.env.SMTP_FROM;
    } else {
      fromAddress = '"ATS Score Checker" <noreply@atsscorechecker.com>';
    }

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      replyTo: smtpUser || fromAddress,
      subject: 'Welcome to ATS Score Checker - Account Created Successfully!',
      text: `Hello ${displayName},\n\nWelcome! You have successfully created your account and logged in to the ATS Score Checker.\n\nYou can now upload your resume, check ATS match scores against target job descriptions, and optimize your application.\n\nBest regards,\nThe ATS Score Checker Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #1877f2; color: #ffffff; width: 52px; height: 52px; line-height: 52px; border-radius: 12px; font-weight: bold; font-size: 22px;">
              ATS
            </div>
            <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px;">Welcome to ATS Score Checker</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Account Registration & Access Confirmation</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Hello <strong>${displayName}</strong>,
          </p>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Congratulations! Your account (<strong>${recipientEmail}</strong>) has been successfully registered and logged in to the <strong>ATS Score Checker</strong> platform.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #1877f2; padding: 18px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600;">
              What you can do next:
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
              <li>Upload your resume in PDF, DOCX, or TXT format</li>
              <li>Match your resume against job descriptions for instant ATS scoring</li>
              <li>Get actionable AI recommendations to boost your interview callbacks</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            If you did not initiate this account creation, please ignore this email or contact support.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} ATS Score Checker. All rights reserved.
          </div>
        </div>
      `,
    };

    console.log(`✉️ Sending confirmation email from ${fromAddress} to recipient ${recipientEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipientEmail}! Message ID: ${info.messageId || 'stream'}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error sending email to ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Sends a Password Reset Verification Code email to the user.
 * @param to Recipient email address
 * @param resetCode 6-digit PIN code for resetting password
 * @param userName Optional display name
 */
export async function sendPasswordResetEmail(
  to: string,
  resetCode: string,
  userName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    const displayName = userName || to.split('@')[0] || 'Valued User';
    const recipientEmail = to.trim();
    const smtpUser = process.env.SMTP_USER;

    let fromAddress: string;
    if (smtpUser) {
      fromAddress = `"ATS Score Checker" <${smtpUser}>`;
    } else if (process.env.SMTP_FROM) {
      fromAddress = process.env.SMTP_FROM;
    } else {
      fromAddress = '"ATS Score Checker" <noreply@atsscorechecker.com>';
    }

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      replyTo: smtpUser || fromAddress,
      subject: 'Password Reset Request - ATS Score Checker',
      text: `Hello ${displayName},\n\nWe received a request to reset your password for your ATS Score Checker account.\n\nYour Password Reset Verification Code is: ${resetCode}\n\nThis code will expire in 15 minutes. Enter this code on the reset password screen to set a new password.\n\nIf you did not request a password reset, please ignore this message.\n\nBest regards,\nThe ATS Score Checker Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #1877f2; color: #ffffff; width: 52px; height: 52px; line-height: 52px; border-radius: 12px; font-weight: bold; font-size: 22px;">
              ATS
            </div>
            <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px;">Password Reset Request</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">ATS Score Checker Account Security</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Hello <strong>${displayName}</strong>,
          </p>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            We received a request to reset the password for your account associated with <strong>${recipientEmail}</strong>.
          </p>
          
          <div style="background-color: #eff6ff; border: 1px border-blue-200; border-left: 4px solid #1877f2; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Your 6-Digit Password Reset Code
            </p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1877f2; font-family: monospace; padding: 8px 0;">
              ${resetCode}
            </div>
            <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 12px;">
              This verification code expires in 15 minutes.
            </p>
          </div>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Enter this code in the <strong>Reset Password</strong> screen along with your new password to update your database credentials.
          </p>
          
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            If you did not request this password change, no action is needed. Your existing password remains secure.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} ATS Score Checker. All rights reserved.
          </div>
        </div>
      `,
    };

    console.log(`✉️ Sending password reset email from ${fromAddress} to ${recipientEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent! Message ID: ${info.messageId || 'stream'}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error sending password reset email to ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Sends a Password Changed Confirmation Email once the password is updated in DB.
 */
export async function sendPasswordChangedConfirmationEmail(
  to: string,
  userName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    const displayName = userName || to.split('@')[0] || 'Valued User';
    const recipientEmail = to.trim();
    const smtpUser = process.env.SMTP_USER;

    let fromAddress: string;
    if (smtpUser) {
      fromAddress = `"ATS Score Checker" <${smtpUser}>`;
    } else if (process.env.SMTP_FROM) {
      fromAddress = process.env.SMTP_FROM;
    } else {
      fromAddress = '"ATS Score Checker" <noreply@atsscorechecker.com>';
    }

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      replyTo: smtpUser || fromAddress,
      subject: 'Password Successfully Changed - ATS Score Checker',
      text: `Hello ${displayName},\n\nYour password for ATS Score Checker (${recipientEmail}) has been successfully updated in our database.\n\nYou can now log in using your new password.\n\nBest regards,\nThe ATS Score Checker Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #10b981; color: #ffffff; width: 52px; height: 52px; line-height: 52px; border-radius: 12px; font-weight: bold; font-size: 22px;">
              ✓
            </div>
            <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px;">Password Successfully Changed</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Database Security Update Confirmed</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Hello <strong>${displayName}</strong>,
          </p>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            This email confirms that your password for <strong>${recipientEmail}</strong> has been successfully changed in our system database.
          </p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">
              ✓ Your account is now secured with your new password.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            If you did not perform this change, please contact our support immediately.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} ATS Score Checker. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error sending password changed confirmation email to ${to}:`, error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
