export const analyticsUrl = '/api/admin/analytics';
export type ShareMethod = 'copy' | 'whatsapp' | 'x' | 'device';

function record(event: { kind: 'visit'; referral?: string } | { kind: 'share'; method: ShareMethod }) {
  if (!globalThis.crypto?.randomUUID) return;
  void fetch(analyticsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, id: crypto.randomUUID() }),
    keepalive: true
  }).catch(() => {});
}

let visitRecorded = false;

export function recordSiteVisit() {
  if (visitRecorded) return;
  visitRecorded = true;
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('ref') || params.get('referral'))?.trim();
  record({ kind: 'visit', referral: code?.slice(0, 80) });
}

export function recordSiteShare(method: ShareMethod) {
  record({ kind: 'share', method });
}
