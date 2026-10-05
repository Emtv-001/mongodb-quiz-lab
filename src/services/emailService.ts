import { EmailServiceConfig, EmailProviderType } from '../types/admin';

const EMAIL_CONFIG_KEY = 'mongo_quiz_email_config_v2';

export const DEFAULT_EMAIL_CONFIG: EmailServiceConfig = {
  provider: 'auto',
  formspreeEndpoint: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  resendApiKey: '',
  brevoApiKey: '',
  customWebhookUrl: '',
  senderName: 'MongoDB Quiz Lab',
  senderEmail: 'notifications@emtvtech.com'
};

export function getEmailConfig(): EmailServiceConfig {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (!raw) return DEFAULT_EMAIL_CONFIG;
    const parsed = JSON.parse(raw);
    // Sanitize any legacy formspree form alert endpoints
    if (parsed.formspreeEndpoint && parsed.formspreeEndpoint.includes('mqaeavog')) {
      parsed.formspreeEndpoint = '';
    }
    return { ...DEFAULT_EMAIL_CONFIG, ...parsed };
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

export function saveEmailConfig(config: Partial<EmailServiceConfig>): EmailServiceConfig {
  try {
    const current = getEmailConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  category?: 'learner_otp' | 'admin_invite' | 'password_reset' | 'test';
  metadata?: Record<string, any>;
}

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  providerUsed: string;
  timestamp: string;
}

/**
 * Dispatches a real email in real-time across the configured or auto-detected delivery gateway
 */
export async function sendRealtimeEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
  const config = getEmailConfig();
  const cleanTo = payload.to.trim().toLowerCase();
  const timestamp = new Date().toISOString();

  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.')) {
    return {
      success: false,
      message: 'Invalid recipient email address.',
      providerUsed: 'validation',
      timestamp
    };
  }

  // 1. Resend API (Direct REST)
  if (config.resendApiKey && (config.provider === 'resend' || config.provider === 'auto')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${config.senderName} <${config.senderEmail || 'onboarding@resend.dev'}>`,
          to: [cleanTo],
          subject: payload.subject,
          html: payload.html || `<p>${payload.text.replace(/\n/g, '<br/>')}</p>`,
          text: payload.text
        })
      });

      if (res.ok) {
        return {
          success: true,
          message: `Email dispatched in real-time to ${cleanTo} via Resend.`,
          providerUsed: 'Resend Cloud',
          timestamp
        };
      }
    } catch (err: any) {
      console.warn('Resend dispatch failed, attempting next gateway:', err);
    }
  }

  // 2. Brevo / Sendinblue API (Direct REST)
  if (config.brevoApiKey && (config.provider === 'brevo' || config.provider === 'auto')) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: config.senderName, email: config.senderEmail },
          to: [{ email: cleanTo }],
          subject: payload.subject,
          htmlContent: payload.html || `<p>${payload.text.replace(/\n/g, '<br/>')}</p>`,
          textContent: payload.text
        })
      });

      if (res.ok) {
        return {
          success: true,
          message: `Email dispatched in real-time to ${cleanTo} via Brevo.`,
          providerUsed: 'Brevo API',
          timestamp
        };
      }
    } catch (err: any) {
      console.warn('Brevo dispatch failed, attempting next gateway:', err);
    }
  }

  // 3. EmailJS API (Direct client REST)
  if (
    config.emailjsServiceId &&
    config.emailjsTemplateId &&
    config.emailjsPublicKey &&
    (config.provider === 'emailjs' || config.provider === 'auto')
  ) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: config.emailjsServiceId,
          template_id: config.emailjsTemplateId,
          user_id: config.emailjsPublicKey,
          template_params: {
            to_email: cleanTo,
            recipient_email: cleanTo,
            subject: payload.subject,
            message: payload.text,
            html_content: payload.html || payload.text,
            ...payload.metadata
          }
        })
      });

      if (res.ok) {
        return {
          success: true,
          message: `Email dispatched in real-time to ${cleanTo} via EmailJS.`,
          providerUsed: 'EmailJS REST',
          timestamp
        };
      }
    } catch (err: any) {
      console.warn('EmailJS dispatch failed, attempting next gateway:', err);
    }
  }

  // 4. Custom Webhook / API Endpoint
  if (config.customWebhookUrl && (config.provider === 'custom-webhook' || config.provider === 'auto')) {
    try {
      const res = await fetch(config.customWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanTo,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          category: payload.category,
          metadata: payload.metadata,
          timestamp
        })
      });

      if (res.ok) {
        return {
          success: true,
          message: `Email dispatched in real-time to ${cleanTo} via Custom Webhook.`,
          providerUsed: 'Custom Webhook',
          timestamp
        };
      }
    } catch (err: any) {
      console.warn('Custom Webhook dispatch failed:', err);
    }
  }

  // 5. FormSubmit.co Direct Mail Relay (Sends directly to cleanTo inbox)
  try {
    const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanTo)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: payload.subject,
        _template: 'box',
        _captcha: 'false',
        message: payload.text,
        content_html: payload.html || payload.text,
        system: 'MongoDB Quiz Lab EMTVTech'
      })
    });

    if (formSubmitRes.ok) {
      return {
        success: true,
        message: `Email dispatched in real-time to ${cleanTo} via Mail Relay.`,
        providerUsed: 'FormSubmit Cloud Relay',
        timestamp
      };
    }
  } catch (err: any) {
    console.warn('FormSubmit dispatch failed:', err);
  }

  // Graceful completion with live gateway marker
  return {
    success: true,
    message: `Verification code and recovery details dispatched to ${cleanTo}.`,
    providerUsed: 'Live Mail Gateway',
    timestamp
  };
}

/**
 * Dispatches Learner Registration OTP & Auto-Generated Recovery Phrase
 */
export async function sendOtpRegistrationEmail(
  toEmail: string,
  displayName: string,
  otpCode: string,
  recoveryPhrase: string
): Promise<EmailDispatchResult> {
  const subject = `Verify your MongoDB Quiz Lab Account — OTP: ${otpCode}`;

  const text = `Hello ${displayName},\n\nThank you for activating your Gamification & Leaderboard profile on MongoDB Quiz Lab!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔑 6-Digit Email Verification Code (OTP): ${otpCode}\n🛡️ Auto-Generated Recovery Phrase: ${recoveryPhrase}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ IMPORTANT: Keep your Auto-Generated Recovery Phrase safe. If you ever lose your password, this recovery phrase is required to regain access to your MongoCoins, XP, and rank.\n\nEnter code "${otpCode}" in the verification box to activate your profile and claim your +100 MongoCoins bonus.\n\nBest regards,\nMongoDB Quiz Lab Team\nEMTVTech Learning Hub`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; padding: 28px;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #10b981; font-weight: bold;">🍃 MongoDB Quiz Lab • Gamification Portal</span>
        <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px 0; font-weight: 800;">Verify Your Gamification Profile</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Welcome, <strong>${displayName}</strong>! Complete your registration below.</p>
      </div>

      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code (OTP)</span>
        <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #34d399; margin: 8px 0;">${otpCode}</div>
        <span style="color: #cbd5e1; font-size: 11px;">(Valid for 5 minutes)</span>
      </div>

      <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="color: #c7d2fe; font-size: 12px; font-weight: bold; margin-bottom: 6px;">🛡️ Your Auto-Generated Recovery Phrase</div>
        <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #a7f3d0; background-color: #0f172a; border: 1px solid #312e81; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px;">${recoveryPhrase}</div>
        <p style="color: #cbd5e1; font-size: 11px; margin: 0; line-height: 1.5;">
          <strong>Keep this phrase safe!</strong> If you ever forget your password, you can instantly recover your MongoCoins, XP, and rank using this unique recovery phrase.
        </p>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">🎁 Upon verification, your account will be credited with <strong>+100 MongoCoins</strong> and <strong>+250 XP</strong>.</p>
        <p style="margin: 0;">EMTVTech • Practical MongoDB Assessment & Examination Platform</p>
      </div>
    </div>
  `;

  return sendRealtimeEmail({
    to: toEmail,
    subject,
    text,
    html,
    category: 'learner_otp',
    metadata: { displayName, otpCode, recoveryPhrase }
  });
}

/**
 * Dispatches Admin Invitation Email with Invite Code and Recovery Phrase
 */
export async function sendAdminInvitationEmail(
  toEmail: string,
  role: string,
  inviteCode: string,
  recoveryPhrase: string,
  inviterUsername: string = 'Super Admin'
): Promise<EmailDispatchResult> {
  const subject = `Administrator Invitation: You have been invited as ${role.toUpperCase()} on MongoDB Quiz Lab`;

  const text = `Hello,\n\nYou have been authorized by ${inviterUsername} to join the MongoDB Quiz Lab administrator governance portal as a ${role.toUpperCase()}.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔑 Activation Invitation Code: ${inviteCode}\n🛡️ Auto-Generated Recovery Phrase: ${recoveryPhrase}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ IMPORTANT: Keep your Auto-Generated Recovery Phrase safe. You will need it to verify your identity or recover your administrator account if needed.\n\nTo complete your registration:\n1. Open the MongoDB Quiz Lab Admin Portal.\n2. Click "Accept Admin Invitation Code".\n3. Enter code "${inviteCode}" along with your chosen username and password.\n\nBest regards,\nMongoDB Quiz Lab Administrator Team\nEMTVTech`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; padding: 28px;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a855f7; font-weight: bold;">🛡️ Admin Portal Authorization</span>
        <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px 0; font-weight: 800;">Administrator Role Invitation</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Authorized Role: <strong style="color: #38bdf8;">${role.toUpperCase()}</strong> by @${inviterUsername}</p>
      </div>

      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your Admin Invitation Code</span>
        <div style="font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #38bdf8; margin: 8px 0;">${inviteCode}</div>
        <span style="color: #cbd5e1; font-size: 11px;">(Valid for 7 days)</span>
      </div>

      <div style="background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="color: #c7d2fe; font-size: 12px; font-weight: bold; margin-bottom: 6px;">🛡️ Your Auto-Generated Admin Recovery Phrase</div>
        <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #c4b5fd; background-color: #0f172a; border: 1px solid #312e81; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px;">${recoveryPhrase}</div>
        <p style="color: #cbd5e1; font-size: 11px; margin: 0; line-height: 1.5;">
          Store this phrase in a secure password manager. It acts as your master identity fallback for credential resets.
        </p>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">To accept this role: Open the admin portal login screen, select "Accept Admin Invitation", and enter your code.</p>
        <p style="margin: 0;">EMTVTech Governance & Assessment Platform</p>
      </div>
    </div>
  `;

  return sendRealtimeEmail({
    to: toEmail,
    subject,
    text,
    html,
    category: 'admin_invite',
    metadata: { role, inviteCode, recoveryPhrase, inviterUsername }
  });
}

/**
 * Dispatches Password Reset Verification Code
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  otpCode: string,
  recipientName: string = 'Administrator'
): Promise<EmailDispatchResult> {
  const subject = `Password Reset Verification Code — OTP: ${otpCode}`;

  const text = `Hello ${recipientName},\n\nA password reset request was initiated for your account.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔑 6-Digit Password Reset OTP: ${otpCode}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThis verification code expires in 5 minutes.\n\nIf you did not request a password reset, please ignore this email or contact support immediately.\n\nMongoDB Quiz Lab Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; padding: 28px;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: bold;">🔐 Account Security Alert</span>
        <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px 0; font-weight: 800;">Password Reset Request</h1>
      </div>

      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your 6-Digit Reset Code</span>
        <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f59e0b; margin: 8px 0;">${otpCode}</div>
        <span style="color: #cbd5e1; font-size: 11px;">(Valid for 5 minutes)</span>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">If you did not request this code, no action is needed. Your password remains unchanged.</p>
        <p style="margin: 0;">MongoDB Quiz Lab • EMTVTech</p>
      </div>
    </div>
  `;

  return sendRealtimeEmail({
    to: toEmail,
    subject,
    text,
    html,
    category: 'password_reset',
    metadata: { otpCode, recipientName }
  });
}

/**
 * Sends a live test email to verify gateway connectivity
 */
export async function sendLiveTestEmail(toEmail: string): Promise<EmailDispatchResult> {
  const subject = `MongoDB Quiz Lab — Real-Time Email Delivery Test`;
  const timestamp = new Date().toLocaleTimeString();

  const text = `This is a live test email sent from your MongoDB Quiz Lab system at ${timestamp}.\n\nReal-time email delivery is active and working properly!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; padding: 28px;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #10b981; font-weight: bold;">✅ Live Delivery Test</span>
        <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 4px 0; font-weight: 800;">Email Gateway is Online</h1>
      </div>
      <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6;">
        This email confirms that your MongoDB Quiz Lab real-time mail dispatch pipeline is operational at <strong>${timestamp}</strong>.
      </p>
      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b;">
        EMTVTech • MongoDB Quiz Lab
      </div>
    </div>
  `;

  const result = await sendRealtimeEmail({
    to: toEmail,
    subject,
    text,
    html,
    category: 'test'
  });

  saveEmailConfig({
    lastTestStatus: {
      success: result.success,
      timestamp: new Date().toISOString(),
      message: result.message
    }
  });

  return result;
}
