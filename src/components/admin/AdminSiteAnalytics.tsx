import { useEffect, useState } from 'react';
import { analyticsUrl } from '../../services/siteAnalytics';

type Summary = {
  counts: { _id: { kind: 'visit' | 'share'; channel: string }; count: number }[];
  leaders: { code: string; username?: string; visits: number }[];
};

export function AdminSiteAnalytics() {
  const [summary, setSummary] = useState<Summary>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(analyticsUrl, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSummary(data);
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : 'Site analytics is temporarily unavailable.');
        }
      }
    })();
    return () => controller.abort();
  }, []);

  const count = (kind: 'visit' | 'share', channel: string) =>
    summary?.counts.find(row => row._id.kind === kind && row._id.channel === channel)?.count ?? 0;
  const visits = [
    ['Total visits', summary?.counts.filter(row => row._id.kind === 'visit').reduce((total, row) => total + row.count, 0) ?? 0],
    ['Referral visits', count('visit', 'referral')],
    ['Non-referral visits', count('visit', 'non-referral')],
    ['Unrecognized referral links', count('visit', 'unknown-referral')]
  ] as const;

  return (
    <section className="mb-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-100" aria-labelledby="site-analytics-heading">
      <div>
        <h2 id="site-analytics-heading" className="font-bold">Site analytics</h2>
        <p className="text-sm text-slate-400">Last 30 days · Each page load counts as one visit.</p>
      </div>
      {!summary && <p role="status" className="text-sm text-slate-300">{error || 'Loading site analytics…'}</p>}
      {summary && <>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visits.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-950 p-3">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xl font-semibold">{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Top referrers by visits</h3>
            {summary.leaders.length ? (
              <ol className="mt-2 space-y-1 text-sm text-slate-300">
                {summary.leaders.map(row => (
                  <li key={row.code} className="flex justify-between gap-2">
                    <span>{row.username ? '@' + row.username : row.code}</span>
                    <span>{row.visits.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-slate-400">No referral visits recorded yet.</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Share methods</h3>
            <dl className="mt-2 space-y-1 text-sm text-slate-300">
              {([['copy', 'Copy link'], ['whatsapp', 'WhatsApp'], ['x', 'X'], ['device', 'Device share']] as const).map(([method, label]) => (
                <div key={method} className="flex justify-between gap-2">
                  <dt>{label}</dt><dd>{count('share', method).toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-slate-400">Counts actions taken on the site. External sends and shares are unobservable.</p>
          </div>
        </div>
      </>}
    </section>
  );
}
