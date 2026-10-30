import React, { useState, useEffect } from 'react';
import { STUDY_NOTES } from '../../data/studyNotes';
import { StudyNoteSection, MongoTopic } from '../../types';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  AlertOctagon,
  CheckCircle2,
  Code,
  ArrowRight,
  ChevronLeft,
  Clock,
  Lightbulb,
  Terminal,
  GraduationCap,
  ListChecks,
  Layers,
  Map,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface StudyNotesViewProps {
  onPracticeTopic: (topic: MongoTopic) => void;
}

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({ onPracticeTopic }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<StudyNoteSection | null>(STUDY_NOTES[0] || null);
  const [isTocVisible, setIsTocVisible] = useState<boolean>(false); // mobile TOC toggle
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Reset scroll position when note changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setExpandedSections({});
  }, [selectedNote?.id]);

  const filteredNotes = STUDY_NOTES.filter((note) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      note.title.toLowerCase().includes(term) ||
      note.summary.toLowerCase().includes(term) ||
      note.topic.toLowerCase().includes(term) ||
      (note.moduleTitle || '').toLowerCase().includes(term) ||
      note.keyOperators.some(
        (op) =>
          op.name.toLowerCase().includes(term) ||
          op.description.toLowerCase().includes(term)
      )
    );
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectNote = (note: StudyNoteSection) => {
    setSelectedNote(note);
    setIsTocVisible(false); // hide mobile TOC after selection
  };

  /* ──────────────────────────────────────────────────────────────────────── */
  /* TABLE OF CONTENTS SIDEBAR                                                */
  /* ──────────────────────────────────────────────────────────────────────── */
  const TocSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Module Label */}
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 px-1">
        {filteredNotes.length} Lecture{filteredNotes.length !== 1 ? 's' : ''}
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {filteredNotes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No notes match your search.</p>
        ) : (
          filteredNotes.map((note) => {
            const isActive = selectedNote?.id === note.id;
            return (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                    : 'hover:bg-slate-800 border border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 mb-0.5">
                  {note.lectureNumber && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      #{note.lectureNumber}
                    </span>
                  )}
                  {note.moduleTitle && (
                    <span className="text-[10px] text-slate-500 truncate">{note.moduleTitle}</span>
                  )}
                </div>
                <div className="text-xs font-semibold leading-snug truncate">{note.title}</div>
                {note.estimatedReadTimeMinutes && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500">{note.estimatedReadTimeMinutes} min read</span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  /* CODE BLOCK (copyable)                                                    */
  /* ──────────────────────────────────────────────────────────────────────── */
  const CodeBlock = ({ code, copyKey }: { code: string; copyKey: string }) => (
    <div className="relative group">
      <pre className="font-mono text-xs text-emerald-300/90 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
      <button
        onClick={() => copyToClipboard(code, copyKey)}
        className="absolute top-2 right-2 flex items-center space-x-1 text-[10px] px-2 py-1 rounded-lg bg-slate-800/90 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
      >
        {copiedKey === copyKey ? (
          <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
        ) : (
          <><Copy className="w-3 h-3" /><span>Copy</span></>
        )}
      </button>
    </div>
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  /* LECTURE CONTENT                                                          */
  /* ──────────────────────────────────────────────────────────────────────── */
  const LectureContent = ({ note }: { note: StudyNoteSection }) => (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Lecture Header ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {note.lectureNumber && (
            <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Lecture {note.lectureNumber}
            </span>
          )}
          {note.moduleTitle && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              {note.moduleTitle}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-mono">
            {note.topic}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
            Level {note.level}
          </span>
          {note.estimatedReadTimeMinutes && (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              <Clock className="w-3 h-3" />
              <span>{note.estimatedReadTimeMinutes} min read</span>
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{note.title}</h2>
        {note.subtitle && (
          <p className="text-sm text-slate-300 font-medium">{note.subtitle}</p>
        )}
        <p className="text-xs text-slate-400 leading-relaxed">{note.summary}</p>
      </div>

      {/* ── Why Learn This? — Mental Model Analogy ── */}
      {note.noviceMentalModel && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <span>Why Learn This? — {note.noviceMentalModel.analogyTitle}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{note.noviceMentalModel.analogyStory}</p>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-300">
              <span className="text-indigo-400">🎯 Key Takeaway: </span>
              {note.noviceMentalModel.keyTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* ── Structural Diagram ── */}
      {note.structuralDiagram && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Visual Mental Model</span>
          </div>
          <pre className="font-mono text-xs text-emerald-400/85 bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed whitespace-pre">
            {note.structuralDiagram}
          </pre>
        </div>
      )}

      {/* ── Core Concepts ── */}
      {note.coreConcepts && note.coreConcepts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Core Concepts ({note.coreConcepts.length})</span>
          </div>

          {note.coreConcepts.map((concept, idx) => {
            const sectionKey = `concept-${note.id}-${idx}`;
            const isOpen = expandedSections[sectionKey] !== false; // default open
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">{concept.heading}</h4>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-800">
                    <p className="text-sm text-slate-300 leading-relaxed pt-4">{concept.explanation}</p>

                    {concept.codeSnippet && (
                      <div className="space-y-2">
                        <CodeBlock code={concept.codeSnippet} copyKey={`${sectionKey}-code`} />
                        {concept.codeExplanation && (
                          <p className="text-xs text-slate-400 italic pl-1">{concept.codeExplanation}</p>
                        )}
                      </div>
                    )}

                    {concept.analogyOrTip && (
                      <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl px-4 py-3">
                        <p className="text-xs text-amber-200">{concept.analogyOrTip}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step-by-Step Walkthrough ── */}
      {note.stepByStepWalkthrough && note.stepByStepWalkthrough.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span>Step-by-Step Walkthrough</span>
          </div>

          <div className="space-y-4">
            {note.stepByStepWalkthrough.map((step, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/20 flex items-center justify-center text-sm font-extrabold">
                    {step.stepNumber}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{step.stepTitle}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.explanation}</p>
                  </div>
                </div>

                {step.codeExample && (
                  <CodeBlock code={step.codeExample} copyKey={`step-${note.id}-${idx}`} />
                )}

                {step.outputPreview && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center space-x-1">
                      <Terminal className="w-3 h-3" />
                      <span>Output Preview</span>
                    </div>
                    <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {step.outputPreview}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Key Operators & Syntax ── */}
      {note.keyOperators && note.keyOperators.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Key Operators &amp; Syntax Reference</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {note.keyOperators.map((op, idx) => {
              const copyKey = `${note.id}-op-${idx}`;
              return (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {op.name}
                    </span>
                    <button
                      onClick={() => copyToClipboard(op.example, copyKey)}
                      className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {copiedKey === copyKey ? (
                        <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-semibold">Copied</span></>
                      ) : (
                        <><Copy className="w-3 h-3" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">{op.description}</p>
                  <div className="font-mono text-xs text-emerald-300/90 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                    {op.example}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Important Rules & Common Mistakes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {note.importantRules && note.importantRules.length > 0 && (
          <div className="p-5 bg-emerald-950/15 rounded-2xl border border-emerald-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Important Rules</span>
            </div>
            <ul className="space-y-2">
              {note.importantRules.map((rule, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold mt-0.5 flex-shrink-0">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {note.commonMistakes && note.commonMistakes.length > 0 && (
          <div className="p-5 bg-amber-950/15 rounded-2xl border border-amber-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              <span>Common Mistakes</span>
            </div>
            <ul className="space-y-2">
              {note.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-amber-400 font-bold mt-0.5 flex-shrink-0">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Teacher Tips ── */}
      {note.teacherTips && note.teacherTips.length > 0 && (
        <div className="p-5 bg-indigo-950/15 rounded-2xl border border-indigo-500/20 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Teacher Tips</span>
          </div>
          <ul className="space-y-2">
            {note.teacherTips.map((tip, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <span className="text-indigo-400 font-bold mt-0.5 flex-shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Novice Summary Checklist ── */}
      {note.noviceSummaryChecklist && note.noviceSummaryChecklist.length > 0 && (
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-700 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <ListChecks className="w-4 h-4 text-emerald-400" />
            <span>Before Moving On — Summary Checklist</span>
          </div>
          <ul className="space-y-2">
            {note.noviceSummaryChecklist.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-200 font-medium leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Real World Scenario ── */}
      {note.realWorldScenario && (
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
          <span className="font-semibold text-slate-300 not-italic">Real-World Context: </span>
          {note.realWorldScenario}
        </div>
      )}

      {/* ── Practice CTA ── */}
      <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/25 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Ready to Test Your Knowledge?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Practice &quot;{note.topic}&quot; questions to reinforce what you just learned.
          </p>
        </div>
        <button
          onClick={() => onPracticeTopic(note.topic)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
        >
          <span>Practice This Topic</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  /* MAIN RENDER                                                              */
  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>MongoDB Lecture Series</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Structured Learning — Study Notes
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Progressive lectures from zero-knowledge to advanced. Master each concept before moving to questions.
        </p>
      </div>

      {/* Mobile: TOC Toggle */}
      <div className="lg:hidden mb-4">
        {!selectedNote || isTocVisible ? null : (
          <button
            onClick={() => setIsTocVisible(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Browse All Lectures</span>
          </button>
        )}
        {isTocVisible && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">All Lectures</span>
              {selectedNote && (
                <button
                  onClick={() => setIsTocVisible(false)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Close ✕
                </button>
              )}
            </div>
            <TocSidebar />
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6 items-start">
        {/* Desktop Sidebar TOC */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden">
          <div className="flex items-center space-x-2 mb-4">
            <Map className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Lecture Contents</span>
          </div>
          <TocSidebar />
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {selectedNote ? (
            <>
              {/* Mobile: Back button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setIsTocVisible(true)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>All Lectures</span>
                </button>
              </div>
              <LectureContent note={selectedNote} />
            </>
          ) : (
            <div className="p-16 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Select a lecture from the sidebar to begin reading.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
