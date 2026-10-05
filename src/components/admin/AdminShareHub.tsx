import React, { useState } from 'react';
import { generateShareableReport, getDatabaseCollections } from '../../services/adminService';
import {
  Share2,
  Copy,
  Download,
  Check,
  FileText,
  Table,
  Database,
  Users,
  Award
} from 'lucide-react';

export const AdminShareHub: React.FC = () => {
  const [reportType, setReportType] = useState<'cohort-summary' | 'curriculum-mastery' | 'database-dump'>('cohort-summary');
  const [selectedColIndex, setSelectedColIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const collections = getDatabaseCollections();
  const selectedCol = collections[selectedColIndex] || collections[0];

  const currentReport = generateShareableReport(
    reportType,
    reportType === 'database-dump' ? selectedCol : undefined
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([currentReport.content], { type: currentReport.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentReport.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Share2 className="w-4 h-4" />
            <span>Data Sharing & Distribution Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Export & Share Portal Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate and dispatch formatted performance reports, curriculum audits, and database datasets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setReportType('cohort-summary')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'cohort-summary'
              ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-white">Cohort Performance Report</span>
          </div>
          <p className="text-[11px] text-slate-400">Roster, accuracy rates, and active streaks.</p>
        </button>

        <button
          type="button"
          onClick={() => setReportType('curriculum-mastery')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'curriculum-mastery'
              ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs text-white">Curriculum Mastery Audit</span>
          </div>
          <p className="text-[11px] text-slate-400">20-topic mastery and accuracy breakdown.</p>
        </button>

        <button
          type="button"
          onClick={() => setReportType('database-dump')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'database-dump'
              ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs text-white">Database Collection Dump</span>
          </div>
          <p className="text-[11px] text-slate-400">Export selected collection documents in JSON.</p>
        </button>
      </div>

      {/* If Database Dump: Collection Dropdown */}
      {reportType === 'database-dump' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-300 whitespace-nowrap">Target Collection to Share:</span>
          <select
            value={selectedColIndex}
            onChange={(e) => setSelectedColIndex(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl p-2 flex-1 font-mono"
          >
            {collections.map((col, idx) => (
              <option key={col.id} value={idx}>
                {col.label} ({col.name}) — {col.documents.length} docs [{col.databaseType}]
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Live Generated Preview Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <span className="font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Generated Preview: {currentReport.title}</span>
          </span>
          <span className="text-slate-400 font-mono text-[11px]">{currentReport.filename}</span>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-[450px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {currentReport.content}
        </div>
      </div>
    </div>
  );
};
