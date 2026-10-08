import React, { useState } from 'react';
import { QuizMode, MongoTopic, DifficultyLevel, CurriculumLevel } from '../../types';
import { ALL_TOPICS } from '../../services/storage';
import { Sliders, Sparkles, Target, Zap, Clock, X, Play } from 'lucide-react';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: QuizMode;
  initialTopic?: MongoTopic;
  onStartConfiguredQuiz: (config: {
    mode: QuizMode;
    selectedTopic?: MongoTopic;
    questionCount: number;
    difficulty: DifficultyLevel | 'All';
    level: CurriculumLevel | 'All';
    useAiGeneration: boolean;
  }) => void;
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTopic,
  onStartConfiguredQuiz
}) => {
  const [selectedTopic, setSelectedTopic] = useState<MongoTopic | 'All'>(initialTopic || 'All');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [level, setLevel] = useState<CurriculumLevel | 'All'>('All');
  const [useAiGeneration, setUseAiGeneration] = useState<boolean>(false);

  if (!isOpen) return null;

  const modeTitles: Record<QuizMode, string> = {
    learn: "Learn Mode Setup",
    practice: "Practice Mode Configuration",
    quiz: "Timed Quiz Parameters",
    'mock-test': "Mock Exam Configuration",
    challenge: "Challenge Mode Setup",
    'weak-areas': "Weak Area Drill Setup",
    revision: "Spaced Repetition Setup",
    random: "Random Practice Setup",
    mastery: "Level 9 Projects Setup",
    'topic-practice': "Topic Practice Setup"
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartConfiguredQuiz({
      mode,
      selectedTopic: selectedTopic === 'All' ? undefined : selectedTopic,
      questionCount: Number(questionCount),
      difficulty,
      level,
      useAiGeneration
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {modeTitles[mode] || "Configure Practice Session"}
              </h3>
              <p className="text-xs text-slate-400">
                Customize question volume, hardness, topic filter, and generation engine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-4 text-xs">
          {/* Question Count Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
              <span>Number of Questions</span>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">{questionCount} Questions</span>
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[5, 10, 15, 20, 25, 30].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-xl font-bold font-mono border transition-all text-center ${
                    questionCount === cnt
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Hardness / Difficulty Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Level of Hardness / Difficulty
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'All', label: 'Mixed' },
                { id: 'Easy', label: 'Easy' },
                { id: 'Medium', label: 'Medium' },
                { id: 'Hard', label: 'Hard' },
                { id: 'Expert', label: 'Expert' }
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as any)}
                  className={`py-2 rounded-xl font-bold border transition-all text-center ${
                    difficulty === d.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Topic Selection
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-medium"
            >
              <option value="All">All 20 Curriculum Topics (Cross-Topic)</option>
              {ALL_TOPICS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* AI Dynamic Generator Mode Toggle */}
          <div
            onClick={() => setUseAiGeneration(!useAiGeneration)}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              useAiGeneration
                ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500 shadow-lg'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${useAiGeneration ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-purple-400'}`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">Dynamic AI Question Agent</span>
                <span className="text-[11px] text-slate-400 block">Synthesize unique, dynamic practical questions on the fly</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${useAiGeneration ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
              {useAiGeneration ? 'ENABLED' : 'OFF'}
            </span>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
