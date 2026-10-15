import React, { useState } from 'react';
import { MongoTopic, DifficultyLevel, CurriculumLevel, Question } from '../../types';
import { generateAiDynamicQuestions } from '../../services/aiQuestionGenerator';
import { appendCustomQuestions } from '../../services/storage';
import {
  Sparkles,
  X,
  Check,
  AlertCircle,
  Trash2,
  Save,
  RotateCcw,
  BookOpen,
  Code2,
  CheckCircle2,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';

const TOPICS: MongoTopic[] = [
  'MongoDB Fundamentals',
  'Connections & Tools',
  'CRUD Operations',
  'Basic & Advanced Querying',
  'Comparison & Logical Operators',
  'Regular Expressions',
  'Arrays & Indexing',
  'Nested Documents & Dot Notation',
  'Update Operators & Modifiers',
  'Data Modeling & Schema Design',
  'Schema Validation',
  'Aggregation Pipelines',
  'JavaScript & mongosh Scripts',
  'Indexes & ESR Rule',
  'Performance & explain()',
  'Replication & High Availability',
  'Transactions & Consistency',
  'Backup & Restore',
  'Security & RBAC',
  'MongoDB Atlas & Advanced Features'
];

interface AdminAiQuestionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsSaved: () => void;
  currentAdminUsername: string;
}

export const AdminAiQuestionStudioModal: React.FC<AdminAiQuestionStudioModalProps> = ({
  isOpen,
  onClose,
  onQuestionsSaved,
  currentAdminUsername
}) => {
  const [topic, setTopic] = useState<MongoTopic>('CRUD Operations');
  const [level, setLevel] = useState<CurriculumLevel>(3);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [count, setCount] = useState<number>(5);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const questions = await generateAiDynamicQuestions({
        topic,
        level,
        difficulty,
        count
      });

      if (!questions || questions.length === 0) {
        throw new Error("No questions were returned. Check your Gemini API Key in Branding settings.");
      }

      setGeneratedQuestions(questions);
      setStatusMessage({
        text: `Successfully synthesized ${questions.length} questions for "${topic}"! Review them below before saving.`,
        isError: false
      });
    } catch (err: any) {
      console.error("AI Generation Error in Admin Studio:", err);
      setStatusMessage({
        text: `Generation Failed: ${err.message || 'Unknown error. Verify API key in Branding/Config.'}`,
        isError: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveToBank = async () => {
    if (generatedQuestions.length === 0) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await appendCustomQuestions(generatedQuestions);
      setStatusMessage({
        text: `Success! Saved ${generatedQuestions.length} AI-synthesized questions into the live Question Bank!`,
        isError: false
      });
      onQuestionsSaved();
      setGeneratedQuestions([]);
    } catch (err: any) {
      console.error("Failed to save to bank:", err);
      setStatusMessage({
        text: `Save failed: ${err.message || 'Error writing to MongoDB.'}`,
        isError: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                AI Question Synthesizer & Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 2.0 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Batch-generate practical MongoDB questions directly to your live question bank (Zero learner wait time).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${
              statusMessage.isError 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {statusMessage.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
              <span className="font-semibold text-xs leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Generator Controls Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Synthesis Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Topic */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as MongoTopic)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                >
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Curriculum Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value) as CurriculumLevel)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Question Batch Size</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Synthesizing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Batch ({count} Questions)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Questions Preview List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">
                    Generated Question Batch ({generatedQuestions.length})
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setGeneratedQuestions([])}
                    className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Clear Batch
                  </button>
                  <button
                    onClick={handleSaveToBank}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save All to Question Bank'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {q.type === 'write-command' ? 'Command' : 'Multiple Choice'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Level {q.level} • {q.difficulty}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            +{q.points} pts
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{q.title}</h4>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove question from batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      {q.scenario}
                    </p>

                    {q.type === 'write-command' && q.expectedCommand && (
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-emerald-400 text-[11px] flex items-center space-x-2">
                        <Code2 className="w-4 h-4 shrink-0 text-slate-500" />
                        <span className="break-all">{q.expectedCommand}</span>
                      </div>
                    )}

                    {q.type === 'multiple-choice' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border text-[11px] flex items-center space-x-2 ${
                              oIdx === q.correctOptionIndex
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-mono text-[10px] opacity-60">[{String.fromCharCode(65 + oIdx)}]</span>
                            <span>{opt}</span>
                            {oIdx === q.correctOptionIndex && (
                              <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/30 p-2 rounded-xl flex items-start space-x-2">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span><strong className="text-slate-300">Explanation:</strong> {q.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Powered by Google Gemini 2.0 • Generated questions are immediately available to all learners.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
