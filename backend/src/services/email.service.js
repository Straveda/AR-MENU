import { Resend } from 'resend';

// Initialize Resend lazily
let resend;

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email sending is enabled via environment variable
    // Default to 'false' if not strictly 'true'
    const isEmailEnabled = process.env.EMAIL_ENABLED === 'true';

    if (!isEmailEnabled) {
      console.log('====================================================');
      console.log('MOCK EMAIL SENDING (EMAIL_ENABLED!=true)');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || 'HTML Content'}`);
      console.log('====================================================');
      return { success: true, message: 'Mock email sent (logged to console)' };
    }

    if (!resend) {
      if (!process.env.RESEND_API_KEY) {
        console.error('Critical: EMAIL_ENABLED=true but RESEND_API_KEY is missing.');
        throw new Error('Email configuration error');
      }
      resend = new Resend(process.env.RESEND_API_KEY);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Restaurant AR <onboarding@resend.dev>',
      to,
      subject,
      html: html || text,
      text: text, // Fallback plain text
    });

    if (error) {
      console.error('Resend API Error:', error);

      if (error.statusCode === 403 && error.message.includes('domain is not verified')) {
        console.warn(
          "TIP: For testing, use 'onboarding@resend.dev' as EMAIL_FROM in .env, or verify your domain on Resend.",
        );
      }

      // Return generic error, don't expose provider details
      throw new Error('Email delivery failed');
    }

    console.log('Email sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    // Preserve the original error message if we threw it above
    if (error.message === 'Email delivery failed') throw error;

    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendOTPEmail = async (to, otp) => {
  const subject = 'Password Reset OTP - Restaurant AR';
  const text = `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password. Use the OTP below to proceed:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${otp}</span>
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};
