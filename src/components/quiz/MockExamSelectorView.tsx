import React from 'react';
import { MOCK_EXAM_PRESETS } from '../../data/mockExams';
import { MockExamPreset } from '../../types';
import { GraduationCap, Clock, Award, Shield, ArrowRight, Zap, Target } from 'lucide-react';

interface MockExamSelectorViewProps {
  onSelectExam: (preset: MockExamPreset) => void;
  bestMockScore: number;
}

export const MockExamSelectorView: React.FC<MockExamSelectorViewProps> = ({
  onSelectExam,
  bestMockScore
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NIIT & Atlas Aligned Examinations
            </span>
            {bestMockScore > 0 && (
              <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Personal Best: {bestMockScore}%
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            MongoDB Mock Examination Suite
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Test yourself under strict exam conditions: countdown timer, randomized questions, mark-for-review navigation, and the First-Attempt Assessment Rule. Choose your milestone examination below.
          </p>
        </div>
      </div>

      {/* Grid of 10 Dedicated Mock Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_EXAM_PRESETS.map((preset, idx) => {
          const isMastery = preset.id === 'mock-mastery';
          const isFull = preset.id === 'mock-full';

          return (
            <div
              key={preset.id}
              onClick={() => onSelectExam(preset)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xl ${
                isMastery
                  ? 'bg-gradient-to-br from-purple-950/20 to-slate-900 border-purple-500/40 hover:border-purple-400'
                  : isFull
                  ? 'bg-gradient-to-br from-emerald-950/20 to-slate-900 border-emerald-500/40 hover:border-emerald-400'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    EXAM #{idx + 1}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isMastery
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : isFull
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {preset.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {preset.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preset.topics.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                      {t}
                    </span>
                  ))}
                  {preset.topics.length > 3 && (
                    <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                      +{preset.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{preset.durationMinutes} mins</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                    <span>{preset.questionCount} Questions</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Begin Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
