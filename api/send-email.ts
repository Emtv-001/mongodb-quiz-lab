import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    to,
    subject,
    text,
    html,
    resendApiKey,
    brevoApiKey,
    customWebhookUrl,
    senderName = 'MongoDB Quiz Lab',
    senderEmail = 'notifications@emtvtech.com'
  } = req.body || {};

  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.')) {
    return res.status(400).json({ success: false, error: 'Invalid recipient email address.' });
  }

  const activeResendKey = resendApiKey || process.env.RESEND_API_KEY;
  const activeBrevoKey = brevoApiKey || process.env.BREVO_API_KEY;
  const activeWebhook = customWebhookUrl || process.env.CUSTOM_WEBHOOK_URL;

  // 1. Resend API
  if (activeResendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeResendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail.includes('@resend.dev') ? senderEmail : 'onboarding@resend.dev'}>`,
          to: [cleanTo],
          subject: subject || 'MongoDB Quiz Lab Notification',
          html: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
          text: text || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          success: true,
          provider: 'Resend API',
          data
        });
      }
    } catch (err: any) {
      console.error('Server Resend dispatch error:', err);
    }
  }

  // 2. Brevo API
  if (activeBrevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': activeBrevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanTo }],
          subject: subject || 'MongoDB Quiz Lab Notification',
          htmlContent: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
          textContent: text || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          success: true,
          provider: 'Brevo API',
          data
        });
      }
    } catch (err: any) {
      console.error('Server Brevo dispatch error:', err);
    }
  }

  // 3. Custom Webhook
  if (activeWebhook) {
    try {
      const response = await fetch(activeWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanTo,
          subject,
          text,
          html,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        return res.status(200).json({
          success: true,
          provider: 'Custom Webhook'
        });
      }
    } catch (err: any) {
      console.error('Server Custom Webhook dispatch error:', err);
    }
  }

  return res.status(200).json({
    success: false,
    message: 'No server-side transactional mail provider configured or reached.'
  });
}
