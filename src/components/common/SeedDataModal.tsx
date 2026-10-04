import React, { useState } from 'react';
import { ALL_DATASETS } from '../../data/seedData';
import { Database, Search, X, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface SeedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDatasetKey?: string;
}

export const SeedDataModal: React.FC<SeedDataModalProps> = ({
  isOpen,
  onClose,
  defaultDatasetKey = 'GptData02'
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(defaultDatasetKey);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<any>(null);

  if (!isOpen) return null;

  const currentDataset = ALL_DATASETS[selectedKey] || ALL_DATASETS['GptData02'];

  const filteredData = (currentDataset.data || []).filter((doc: any) => {
    const term = searchTerm.toLowerCase();
    const str = JSON.stringify(doc).toLowerCase();
    return str.includes(term);
  });

  const copyDocJson = (doc: any, id: any) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">MongoDB Live Dataset Explorer</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {Object.keys(ALL_DATASETS).length} Collections
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore real-world collections across School, Hospital, Banking, E-Commerce, and Hotel systems.
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

        {/* Dataset Switcher Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center space-x-2 overflow-x-auto">
          {Object.entries(ALL_DATASETS).map(([key, dataset]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedKey(key);
                setExpandedId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedKey === key
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{dataset.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedKey === key ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {dataset.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search within ${currentDataset.collectionName}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filteredData.length} records
          </span>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredData.map((doc: any, idx: number) => {
            const docId = doc._id || idx;
            const isExpanded = expandedId === docId;
            const titleLabel = doc.Name || doc.patientName || doc.accountHolder || doc.title || doc.guestName || `Doc #${idx + 1}`;

            return (
              <div
                key={docId}
                className="border border-slate-800 bg-slate-950/60 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : docId)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700">
                      _id: {JSON.stringify(doc._id)}
                    </span>
                    <span className="text-sm font-semibold text-white">{titleLabel}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyDocJson(doc, docId);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                      title="Copy Document JSON"
                    >
                      {copiedId === docId ? (
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
          <span>Target collection: <code className="text-emerald-400 font-bold">{currentDataset.collectionName}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
