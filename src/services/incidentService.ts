import { sendRealtimeEmail } from './emailService';
import { getAdminUsers, MASTER_ADMIN_EMAIL, ROOT_SECURITY_EMAIL, addAuditLog } from './adminService';

export interface IncidentReport {
  service: string;
  summary: string;
  technicalDetails: string;
  severity?: 'warning' | 'urgent';
  context?: string;
}

// In-memory / localStorage cache for incident deduplication (5-minute cooldown per signature)
const INCIDENT_THROTTLE_KEY = 'mongo_quiz_last_incident_dispatch_v1';

/**
 * Automatically logs system incidents to the Admin Portal (MongoDB notifications & audit logs)
 * and dispatches immediate notification emails to system administrators.
 */
export async function reportSystemIncident(incident: IncidentReport): Promise<{ success: boolean; message: string }> {
  const {
    service,
    summary,
    technicalDetails,
    severity = 'urgent',
    context = 'Background Process'
  } = incident;

  const signature = `${service}:${summary}`.toLowerCase();
  const now = Date.now();

  // Deduplication check: Avoid blasting admins with identical emails within 5 minutes
  try {
    const rawThrottle = localStorage.getItem(INCIDENT_THROTTLE_KEY);
    if (rawThrottle) {
      const parsedThrottle: Record<string, number> = JSON.parse(rawThrottle);
      const lastSent = parsedThrottle[signature];
      if (lastSent && (now - lastSent) < 5 * 60 * 1000) {
        console.warn(`[IncidentService] Incident "${signature}" throttled. (Last sent ${Math.round((now - lastSent) / 1000)}s ago)`);
        return { success: true, message: 'Incident logged locally (throttled email).' };
      }
      parsedThrottle[signature] = now;
      localStorage.setItem(INCIDENT_THROTTLE_KEY, JSON.stringify(parsedThrottle));
    } else {
      localStorage.setItem(INCIDENT_THROTTLE_KEY, JSON.stringify({ [signature]: now }));
    }
  } catch {}

  console.error(`[IncidentService] Reporting System Incident: [${service}] ${summary}`);

  // 1. Post to MongoDB Admin Notifications (surfaces on Admin Dashboard & AdminBroadcasts)
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `🚨 ${severity === 'urgent' ? '[CRITICAL]' : '[ALERT]'} ${service}: ${summary}`,
        message: `Context: ${context}\n\nTechnical Error:\n${technicalDetails.substring(0, 1000)}\n\nTimestamp: ${new Date().toISOString()}`,
        audience: 'admins',
        type: severity,
        showPopup: true,
        sendEmail: true,
        createdBy: 'Automated Incident Watchdog'
      })
    });
  } catch (err: any) {
    console.warn('[IncidentService] Failed to record notification to MongoDB API:', err.message);
  }

  // 2. Add entry to Security / Admin Audit Log
  try {
    await addAuditLog('system', 'System Incident Detected', 'security', `[${service}] ${summary}: ${technicalDetails.substring(0, 300)}`);
  } catch {}

  // 3. Dispatch direct alert emails to all system administrators
  try {
    const adminRecipients = new Set<string>();
    if (ROOT_SECURITY_EMAIL) adminRecipients.add(ROOT_SECURITY_EMAIL.trim().toLowerCase());
    if (MASTER_ADMIN_EMAIL) adminRecipients.add(MASTER_ADMIN_EMAIL.trim().toLowerCase());

    const activeAdmins = getAdminUsers();
    activeAdmins.forEach(admin => {
      if (admin.email && admin.email.includes('@')) {
        adminRecipients.add(admin.email.trim().toLowerCase());
      }
    });

    const recipientList = Array.from(adminRecipients);
    if (recipientList.length > 0) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
          <div style="display: flex; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 20px;">🚨 System Incident Alert: ${service}</h2>
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            An automated incident was flagged by the <strong>MongoDB Quiz Lab System Watchdog</strong> during <em>${context}</em>.
          </p>
          <div style="background: #1e293b; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #f8fafc; font-size: 14px;">Summary: ${summary}</p>
            <p style="margin: 0; font-family: monospace; font-size: 12px; color: #fca5a5; white-space: pre-wrap; word-break: break-all;">${technicalDetails.substring(0, 1500)}</p>
          </div>
          <div style="background: #090d16; padding: 12px; border-radius: 6px; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 0 0 4px 0;"><strong>Severity:</strong> <span style="color: #f87171; text-transform: uppercase;">${severity}</span></p>
            <p style="margin: 0;"><strong>Action Required:</strong> Check your Google AI Studio API key and Gemini model configuration in the Super Admin Dashboard.</p>
          </div>
          <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
            MongoDB Quiz Lab • Automated Incident Monitoring & Dispatch Service
          </div>
        </div>
      `;

      await Promise.all(
        recipientList.map(email =>
          sendRealtimeEmail({
            to: email,
            subject: `🚨 [Alert] MongoDB Quiz Lab: ${service} Error (${summary})`,
            text: `System Incident Alert: ${service}\n\nSummary: ${summary}\nContext: ${context}\n\nDetails:\n${technicalDetails}\n\nTime: ${new Date().toISOString()}`,
            html: emailHtml,
            category: 'test'
          })
        )
      );
    }
  } catch (emailErr: any) {
    console.warn('[IncidentService] Error dispatching incident emails:', emailErr.message);
  }

  return { success: true, message: 'Incident logged to admin portal and alerts dispatched to administrators.' };
}
