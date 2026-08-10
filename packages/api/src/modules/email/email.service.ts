import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  code: string;
  displayName: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASS;
    const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";
    const port = Number(process.env.SMTP_PORT) || 587;

    if (
      host &&
      user &&
      pass &&
      user !== "your_email@gmail.com" &&
      pass !== "your_16_digit_app_password"
    ) {
      // Production / Custom Gmail SMTP Server
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(
        `✉️ [EMAIL SERVICE] Gmail SMTP Transport initialized for: ${user}`,
      );
    } else {
      // Ethereal / Test Transporter fallback
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(
          `✉️ [EMAIL SERVICE] Ethereal test SMTP mailbox initialized: ${testAccount.user}`,
        );
      } catch {
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }

    return this.transporter;
  }

  /**
   * Sends a 6-digit OTP email verification code to the target user.
   */
  async sendVerificationOtp({
    to,
    code,
    displayName,
  }: SendOtpOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const user = process.env.SMTP_USER || "no-reply@collaboard.app";
      const from = process.env.SMTP_FROM || `"Collaboard Support" <${user}>`;

      const info = await transporter.sendMail({
        from,
        to,
        subject: `${code} is your Collaboard verification code`,
        text: `Hello ${displayName},\n\nYour 6-digit email verification code for Collaboard is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this code, please ignore this message.\n\nBest regards,\nThe Collaboard Team`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Collaborative Whiteboard</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Email Verification Code</p>
            </div>
            
            <p style="font-size: 15px; color: #e2e8f0;">Hello <strong>${displayName}</strong>,</p>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">Thank you for registering. Please enter the following 6-digit verification code to complete your registration:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; background-color: #1e293b; color: #60a5fa; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px 28px; border-radius: 8px; border: 1px solid #3b82f6;">${code}</span>
            </div>

            <p style="font-size: 13px; color: #64748b; text-align: center;">This code will expire in <strong>15 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="font-size: 12px; color: #475569; text-align: center; margin: 0;">If you didn't request this email, you can safely ignore it.</p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(
          `\n=======================================================`,
        );
        console.log(`✉️ EMAIL DISPATCHED to ${to}`);
        console.log(`🔗 VIEW TEST MAILBOX: ${previewUrl}`);
        console.log(
          `=======================================================\n`,
        );
      } else {
        console.log(
          `\n=======================================================`,
        );
        console.log(`✉️ LIVE GMAIL OTP DISPATCHED to ${to}`);
        console.log(
          `=======================================================\n`,
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to send OTP email via SMTP:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
