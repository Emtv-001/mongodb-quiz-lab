import React, { useState } from 'react';
import { GptData02 } from '../../data/seedData';
import { Database, Search, X, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface SeedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeedDataModal: React.FC<SeedDataModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const filteredData = GptData02.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      doc.Name.toLowerCase().includes(term) ||
      doc.Course.toLowerCase().includes(term) ||
      doc.Section.toLowerCase().includes(term) ||
      doc.Address.State.toLowerCase().includes(term) ||
      doc.Address.City.toLowerCase().includes(term) ||
      doc._id.toString() === term ||
      doc.Courses.some(c => c.toLowerCase().includes(term)) ||
      doc.Skills.some(s => s.toLowerCase().includes(term))
    );
  });

  const copyDocJson = (doc: any) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedId(doc._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">GptData02 Collection</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {GptData02.length} Documents
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live reference dataset for student queries, nested documents, arrays, and updates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID (e.g. 10), name, skill, course, state, section..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filteredData.length} matches
          </span>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredData.map(doc => {
            const isExpanded = expandedId === doc._id;
            return (
              <div
                key={doc._id}
                className="border border-slate-800 bg-slate-950/60 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : doc._id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700">
                      _id: {doc._id}
                    </span>
                    <span className="text-sm font-semibold text-white">{doc.Name}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      ({doc.Course} • Section {doc.Section})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      GPA: {doc.GPA}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono hidden sm:inline">
                      Marks: {doc.Marks}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyDocJson(doc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                      title="Copy Document JSON"
                    >
                      {copiedId === doc._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 font-mono text-xs text-slate-300 overflow-x-auto">
                    <pre className="text-emerald-400/90 leading-relaxed">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <span>Target collection: <code className="text-emerald-400">db.GptData02</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
