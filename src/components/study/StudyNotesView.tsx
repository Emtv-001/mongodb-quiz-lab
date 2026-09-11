import React, { useState } from 'react';
import { STUDY_NOTES } from '../../data/studyNotes';
import { MongoTopic } from '../../types';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  AlertOctagon,
  CheckCircle2,
  Code,
  ArrowRight
} from 'lucide-react';

interface StudyNotesViewProps {
  onPracticeTopic: (topic: MongoTopic) => void;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({ onPracticeTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const topics = ['All', ...STUDY_NOTES.map((n) => n.topic)];

  const filteredNotes = STUDY_NOTES.filter((note) => {
    const matchesTopic = selectedTopic === 'All' || note.topic === selectedTopic;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      note.title.toLowerCase().includes(term) ||
      note.summary.toLowerCase().includes(term) ||
      note.keyOperators.some(
        (op) =>
          op.name.toLowerCase().includes(term) ||
          op.description.toLowerCase().includes(term) ||
          op.example.toLowerCase().includes(term)
      );
    return matchesTopic && matchesSearch;
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>MongoDB Study Guide & Cheatsheet</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Essential Concepts & Operator Reference
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Read before attempting quizzes and the mock practical test.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search operators, rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Topic Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTopic === t
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Cards List */}
      <div className="space-y-6">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No notes match your search.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5"
            >
              {/* Note Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {note.topic}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {note.summary}
                  </p>
                </div>

                <button
                  onClick={() => onPracticeTopic(note.topic)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all self-start sm:self-center whitespace-nowrap"
                >
                  <span>Practice Topic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Key Operators */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Key Operators & Syntax</span>
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {note.keyOperators.map((op, idx) => {
                    const copyKey = `${note.id}-op-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {op.name}
                          </span>
                          <button
                            onClick={() => copyToClipboard(op.example, copyKey)}
                            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Copy syntax"
                          >
                            {copiedKey === copyKey ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-300">
                          {op.description}
                        </p>

                        <div className="font-mono text-xs text-emerald-300/90 bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                          {op.example}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column: Important Rules & Common Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Important Rules */}
                <div className="p-4 bg-emerald-950/15 rounded-xl border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Important Rules</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {note.importantRules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Mistakes */}
                <div className="p-4 bg-amber-950/15 rounded-xl border border-amber-500/20 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Common Mistakes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {note.commonMistakes.map((mistake, mIdx) => (
                      <li key={mIdx} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
