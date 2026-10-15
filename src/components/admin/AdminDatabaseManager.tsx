import React, { useState } from 'react';
import { GenericDatabaseCollection, DatabaseEngineType } from '../../types/admin';
import {
  getDatabaseCollections,
  saveDatabaseCollections
} from '../../services/adminService';
import {
  Database,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  FileCode,
  Edit,
  Copy,
  Table,
  Layers,
  Server,
  X,
  Code2
} from 'lucide-react';

interface AdminDatabaseManagerProps {
  currentAdminUsername: string;
}

export const AdminDatabaseManager: React.FC<AdminDatabaseManagerProps> = ({ currentAdminUsername }) => {
  const [collections, setCollections] = useState<GenericDatabaseCollection[]>(() => getDatabaseCollections());
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<any>(null);
  const [copiedDocId, setCopiedDocId] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New Collection modal state
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColType, setNewColType] = useState<DatabaseEngineType>('mongodb');
  const [newColInitialJson, setNewColInitialJson] = useState('[\n  {\n    "_id": "doc-1",\n    "title": "Example Record",\n    "active": true\n  }\n]');

  // Add Document modal state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocJson, setNewDocJson] = useState('{\n  "_id": "new-item",\n  "name": "Sample Entry"\n}');

  const currentCollection = collections.find(c => c.id === selectedColId) || collections[0];

  const filteredDocs = (currentCollection?.documents || []).filter((doc: any) => {
    const term = searchTerm.toLowerCase();
    return JSON.stringify(doc).toLowerCase().includes(term);
  });

  const handleCopyDocJson = (doc: any, id: any) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !newColLabel.trim()) return;

    let parsedDocs: any[] = [];
    try {
      parsedDocs = JSON.parse(newColInitialJson);
      if (!Array.isArray(parsedDocs)) parsedDocs = [parsedDocs];
    } catch {
      alert("Invalid JSON format in initial documents.");
      return;
    }

    const created: GenericDatabaseCollection = {
      id: 'col_' + Date.now(),
      databaseType: newColType,
      name: newColName.trim(),
      label: newColLabel.trim(),
      description: newColDesc.trim() || `${newColType.toUpperCase()} collection`,
      schemaFields: [
        { name: "_id", type: "string", required: true },
        { name: "title", type: "string" }
      ],
      documents: parsedDocs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...collections, created];
    setCollections(updated);
    saveDatabaseCollections(updated, currentAdminUsername);
    setSelectedColId(created.id);
    setShowAddColModal(false);
    setNewColName('');
    setNewColLabel('');
    setNewColDesc('');
    setStatusMsg(`Collection "${created.label}" created successfully!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteCollection = (id: string) => {
    if (collections.length <= 1) {
      alert("At least one database collection must be retained.");
      return;
    }
    if (confirm("Are you sure you want to delete this collection and all its stored records?")) {
      const updated = collections.filter(c => c.id !== id);
      setCollections(updated);
      saveDatabaseCollections(updated, currentAdminUsername);
      setSelectedColId(updated[0]?.id || '');
      setStatusMsg("Collection removed.");
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newDocJson);
      const updatedCollections = collections.map(c => {
        if (c.id === currentCollection.id) {
          return {
            ...c,
            documents: [parsed, ...c.documents],
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      });
      setCollections(updatedCollections);
      saveDatabaseCollections(updatedCollections, currentAdminUsername);
      setShowAddDocModal(false);
      setStatusMsg("Document successfully added to collection!");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      alert("Invalid JSON format.");
    }
  };

  const handleDeleteDocument = (docId: any) => {
    if (!confirm("Delete this document?")) return;
    const updatedCollections = collections.map(c => {
      if (c.id === currentCollection.id) {
        return {
          ...c,
          documents: c.documents.filter((d: any) => d._id !== docId && JSON.stringify(d._id) !== JSON.stringify(docId)),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    setCollections(updatedCollections);
    saveDatabaseCollections(updatedCollections, currentAdminUsername);
  };

  const handleExportCollectionJson = () => {
    if (!currentCollection) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentCollection.documents, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${currentCollection.name}_export.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const getEngineBadge = (type: DatabaseEngineType) => {
    switch (type) {
      case 'mongodb':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">MongoDB NoSQL</span>;
      case 'postgresql':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">PostgreSQL SQL</span>;
      case 'mysql':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">MySQL RDBMS</span>;
      default:
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">{type.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Server className="w-4 h-4" />
            <span>Universal Multi-Database Engine</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {collections.length} Collections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Generic Database & Collections Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure, inspect, query, and manage datasets across MongoDB, PostgreSQL, MySQL, and Custom JSON Stores.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowAddColModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection / Table</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-fadeIn shadow-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Database Collection Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {collections.map((col) => {
          const isSelected = col.id === currentCollection?.id;
          return (
            <div
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-slate-400 font-bold truncate max-w-[90px]">{col.name}</span>
                {getEngineBadge(col.databaseType)}
              </div>
              <h4 className="text-xs font-bold truncate text-white" title={col.label}>{col.label}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                <span>{col.documents.length} Records</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Collection Inspector */}
      {currentCollection && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          {/* Top Bar for Selected Collection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">{currentCollection.label}</h3>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {currentCollection.databaseType === 'mongodb' ? `db.${currentCollection.name}` : currentCollection.name}
                </span>
                {getEngineBadge(currentCollection.databaseType)}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{currentCollection.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAddDocModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Document</span>
              </button>

              <button
                onClick={handleExportCollectionJson}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Export collection as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <button
                onClick={() => handleDeleteCollection(currentCollection.id)}
                className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                title="Delete this entire collection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search records in ${currentCollection.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap self-end sm:self-center">
              {filteredDocs.length} of {currentCollection.documents.length} docs
            </span>
          </div>

          {/* Documents Stream */}
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                No documents found matching your search.
              </div>
            ) : (
              filteredDocs.map((doc: any, idx: number) => {
                const docId = doc._id || `row_${idx}`;
                const isExpanded = expandedDocId === docId;
                const isCopied = copiedDocId === docId;
                const titleText = doc.Name || doc.patientName || doc.accountHolder || doc.title || doc.sku || `Record #${idx + 1}`;

                return (
                  <div key={docId} className="border border-slate-800 bg-slate-950/70 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                    <div
                      onClick={() => setExpandedDocId(isExpanded ? null : docId)}
                      className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-mono text-[11px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                          {JSON.stringify(doc._id || idx + 1)}
                        </span>
                        <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-md">
                          {titleText}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopyDocJson(doc, docId)}
                          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Copy JSON to clipboard"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400/90 overflow-x-auto rounded-b-xl">
                        <pre>{JSON.stringify(doc, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Collection */}
      {showAddColModal && (
        <div 
          onClick={() => setShowAddColModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Database Collection</h3>
                  <p className="text-[11px] text-slate-400">Add a new dataset across MongoDB, SQL, or JSON stores.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddColModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateCollection} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Database Engine</label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as DatabaseEngineType)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="mongodb">MongoDB (NoSQL Document)</option>
                    <option value="postgresql">PostgreSQL (Relational SQL)</option>
                    <option value="mysql">MySQL (Relational SQL)</option>
                    <option value="sqlite">SQLite (Embedded DB)</option>
                    <option value="dynamodb">DynamoDB (Key-Value/Doc)</option>
                    <option value="json">Custom JSON Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Internal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. library_books"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. University Library Catalog"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Books, borrowings, and author references"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial JSON Seed Documents</label>
                <textarea
                  rows={4}
                  value={newColInitialJson}
                  onChange={(e) => setNewColInitialJson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Document */}
      {showAddDocModal && (
        <div 
          onClick={() => setShowAddDocModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Insert Document
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Target: {currentCollection.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddDocument} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Content (JSON Format)</label>
                <textarea
                  rows={6}
                  value={newDocJson}
                  onChange={(e) => setNewDocJson(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Insert Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
