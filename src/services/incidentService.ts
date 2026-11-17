import { sendRealtimeEmail } from './emailService';
import { getAdminUsers, MASTER_ADMIN_EMAIL, ROOT_SECURITY_EMAIL, addAuditLog } from './adminService';

export interface IncidentReport {
  service: string;
  summary: string;
  technicalDetails: string;
  severity?: 'warning' | 'urgent';
  context?: string;
}

interface IncidentHistoryRecord {
  firstSeen: number;
  lastSeen: number;
  count: number;
  lastEmailSent?: number;
}

// In-memory / localStorage keys for persistence-based alerting
const INCIDENT_TRACKER_KEY = 'mongo_quiz_incident_history_tracker_v2';

// Persistence thresholds:
// 1. Error must persist for at least 15 minutes (or have occurred at least 3 distinct times)
const PERSISTENCE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MIN_PERSISTENCE_COUNT = 3;               // Or 3 occurrences
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000;      // 1 hour between repeated emails for the same persistent error

function loadIncidentTracker(): Record<string, IncidentHistoryRecord> {
  try {
    const raw = localStorage.getItem(INCIDENT_TRACKER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveIncidentTracker(tracker: Record<string, IncidentHistoryRecord>): void {
  try {
    localStorage.setItem(INCIDENT_TRACKER_KEY, JSON.stringify(tracker));
  } catch {}
}

/**
 * Automatically logs system incidents to the Admin Portal (MongoDB notifications & audit logs).
 * Direct Gmail/email alerts are ONLY dispatched if the error has been PERSISTENT
 * (active for >= 15 minutes OR has recurred >= 3 times) to avoid spamming admins with transient glitches.
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

  const tracker = loadIncidentTracker();
  let record = tracker[signature];

  if (!record) {
    record = {
      firstSeen: now,
      lastSeen: now,
      count: 1
    };
  } else {
    // If the error last happened over 24 hours ago, reset the window
    if (now - record.lastSeen > 24 * 60 * 60 * 1000) {
      record = {
        firstSeen: now,
        lastSeen: now,
        count: 1
      };
    } else {
      record.lastSeen = now;
      record.count += 1;
    }
  }

  tracker[signature] = record;
  saveIncidentTracker(tracker);

  console.error(`[IncidentService] Incident: [${service}] ${summary} (Occurrence #${record.count}, span: ${Math.round((now - record.firstSeen) / 60000)}m)`);

  // 1. ALWAYS post to MongoDB Admin Notifications (surfaces silently on Admin Dashboard & AdminBroadcasts)
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `🚨 ${severity === 'urgent' ? '[CRITICAL]' : '[ALERT]'} ${service}: ${summary}`,
        message: `Context: ${context}\n\nTechnical Error:\n${technicalDetails.substring(0, 1000)}\n\nOccurrences: ${record.count} (First seen: ${new Date(record.firstSeen).toLocaleTimeString()})\n\nTimestamp: ${new Date().toISOString()}`,
        audience: 'admins',
        type: severity,
        showPopup: false,
        sendEmail: false,
        createdBy: 'Automated Incident Watchdog'
      })
    });
  } catch (err: any) {
    console.warn('[IncidentService] Failed to record notification to MongoDB API:', err.message);
  }

  // 2. Add entry to Security / Admin Audit Log
  try {
    await addAuditLog('system', 'System Incident Detected', 'security', `[${service}] ${summary} (x${record.count}): ${technicalDetails.substring(0, 300)}`);
  } catch {}

  // 3. Check Persistence Threshold for Email Alert:
  // Error MUST be persistent (running for >= 15 minutes OR >= 3 recurrences)
  const durationActive = now - record.firstSeen;
  const isPersistent = durationActive >= PERSISTENCE_DURATION_MS || record.count >= MIN_PERSISTENCE_COUNT;

  if (!isPersistent) {
    console.log(`[IncidentService] Email alert withheld. Error is transient (active for ${Math.round(durationActive / 1000)}s, ${record.count} occurrences). Requires >= 15m or 3 occurrences to alert via Gmail.`);
    return {
      success: true,
      message: `Incident logged to Admin Portal. Email held pending error persistence (${record.count}/${MIN_PERSISTENCE_COUNT} occurrences).`
    };
  }

  // Check cooldown so we don't spam if it stays persistent
  if (record.lastEmailSent && (now - record.lastEmailSent) < EMAIL_COOLDOWN_MS) {
    console.log(`[IncidentService] Persistent error email throttled (last emailed ${Math.round((now - record.lastEmailSent) / 60000)}m ago).`);
    return {
      success: true,
      message: 'Persistent error logged; email already sent recently within cooldown window.'
    };
  }

  // Update lastEmailSent timestamp
  record.lastEmailSent = now;
  tracker[signature] = record;
  saveIncidentTracker(tracker);

  // 4. Dispatch alert email to system administrators
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
      const durationMins = Math.max(1, Math.round(durationActive / 60000));
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
          <div style="display: flex; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 20px;">🚨 Persistent System Error Alert: ${service}</h2>
          </div>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            An error has been <strong>consistently detected</strong> by the <strong>MongoDB Quiz Lab Watchdog</strong> and has met the persistent alert threshold.
          </p>
          <div style="background: #1e293b; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #f8fafc; font-size: 14px;">Summary: ${summary}</p>
            <p style="margin: 0; font-family: monospace; font-size: 12px; color: #fca5a5; white-space: pre-wrap; word-break: break-all;">${technicalDetails.substring(0, 1500)}</p>
          </div>
          <div style="background: #090d16; padding: 12px; border-radius: 6px; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 4px 0;"><strong>Active Duration:</strong> Persistent for ~${durationMins} minutes (${record.count} logged occurrences)</p>
            <p style="margin: 0 0 4px 0;"><strong>First Detected:</strong> ${new Date(record.firstSeen).toLocaleString()}</p>
            <p style="margin: 0 0 4px 0;"><strong>Context:</strong> ${context}</p>
            <p style="margin: 0 0 4px 0;"><strong>Severity:</strong> <span style="color: #f87171; text-transform: uppercase;">${severity}</span></p>
            <p style="margin: 0;"><strong>Action Required:</strong> Check your Gemini API Key in the Admin Portal Branding settings.</p>
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
            subject: `🚨 [Persistent Error] MongoDB Quiz Lab: ${service} (${summary})`,
            text: `Persistent System Incident: ${service}\n\nSummary: ${summary}\nContext: ${context}\nActive Duration: ~${durationMins} minutes (${record.count} occurrences)\n\nDetails:\n${technicalDetails}\n\nTime: ${new Date().toISOString()}`,
            html: emailHtml,
            category: 'test'
          })
        )
      );
    }
  } catch (emailErr: any) {
    console.warn('[IncidentService] Error dispatching incident emails:', emailErr.message);
  }

  return { success: true, message: 'Persistent error confirmed and alerts dispatched to administrators.' };
}
