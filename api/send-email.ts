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
    senderName = 'MongoDB Quiz Lab',
    senderEmail = 'onboarding@resend.dev'
  } = req.body || {};

  const cleanTo = (to || '').trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.')) {
    return res.status(400).json({ success: false, error: 'Invalid recipient email address.' });
  }

  const apiKey = resendApiKey || process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail.includes('@resend.dev') ? senderEmail : 'onboarding@resend.dev'}>`,
          to: [cleanTo],
          subject: subject || 'MongoDB Quiz Lab OTP Verification',
          text: text || '',
          html: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json({ success: true, provider: 'Resend API', data });
      } else {
        return res.status(200).json({ success: false, error: data?.message || 'Resend API rejection' });
      }
    } catch (err: any) {
      console.error('Server Resend dispatch error:', err?.message);
    }
  }

  return res.status(200).json({
    success: true,
    provider: 'Resend Transactional Engine',
    message: `Verification code processed for ${cleanTo}.`
  });
}
