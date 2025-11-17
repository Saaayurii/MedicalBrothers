import crypto from 'crypto';

/**
 * Generate email verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate verification URL
 */
export function generateVerificationURL(token: string, baseUrl: string): string {
  return `${baseUrl}/verify-email?token=${token}`;
}

/**
 * Send verification email (mock implementation)
 * In production, use services like SendGrid, Resend, or AWS SES
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
): Promise<boolean> {
  try {
    console.log(`
      ====================================
      EMAIL VERIFICATION
      ====================================
      To: ${email}
      Subject: Подтверждение email
      
      Для подтверждения вашего email перейдите по ссылке:
      ${verificationUrl}
      
      Ссылка действительна 24 часа.
      ====================================
    `);

    // TODO: Implement actual email sending with service like SendGrid
    // Example with SendGrid:
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@medicalbrothers.com',
    //   subject: 'Подтверждение email',
    //   html: `<p>Для подтверждения email перейдите по <a href="${verificationUrl}">ссылке</a></p>`,
    // });

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  try {
    console.log(`
      ====================================
      PASSWORD RESET
      ====================================
      To: ${email}
      Subject: Сброс пароля
      
      Для сброса пароля перейдите по ссылке:
      ${resetUrl}
      
      Ссылка действительна 1 час.
      Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
      ====================================
    `);

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
