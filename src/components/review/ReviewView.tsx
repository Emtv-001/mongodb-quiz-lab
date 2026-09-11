import React, { useState } from 'react';
import { Question, QuestionAttempt } from '../../types';
import { CheckCircle2, AlertCircle, Award, Filter, Lightbulb, Code, ArrowLeft } from 'lucide-react';

interface ReviewViewProps {
  questions: Question[];
  attempts: Record<string, QuestionAttempt>;
  onBack: () => void;
}

type FilterStatus = 'all' | 'correct' | 'partial' | 'incorrect';

export const ReviewView: React.FC<ReviewViewProps> = ({
  questions,
  attempts,
  onBack
}) => {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredQuestions = questions.filter((q) => {
    const attempt = attempts[q.id];
    if (!attempt) return filter === 'all' || filter === 'incorrect';

    const { isCorrect, isPartial } = attempt.result;
    if (filter === 'correct') return isCorrect;
    if (filter === 'partial') return isPartial;
    if (filter === 'incorrect') return !isCorrect && !isPartial;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </button>
          <h2 className="text-xl font-extrabold text-white">
            Detailed Question Review
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit your submitted answers against correct MongoDB syntax and read explanations.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-center">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          {(['all', 'correct', 'partial', 'incorrect'] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                filter === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Breakdown List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No questions match the "{filter}" filter.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const attempt = attempts[q.id];
            const result = attempt?.result;
            const isCorrect = result?.isCorrect;
            const isPartial = result?.isPartial;
            const score = attempt ? attempt.firstAttemptScore : 0;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all bg-slate-900/90 ${
                  isCorrect
                    ? 'border-emerald-500/30'
                    : isPartial
                    ? 'border-amber-500/30'
                    : 'border-red-500/30'
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {q.topic}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Marks ({score}/{q.points})</span>
                      </span>
                    ) : isPartial ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        <Award className="w-3.5 h-3.5" />
                        <span>Partial Credit ({score}/{q.points})</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Incorrect ({score}/{q.points})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Scenario */}
                <div className="py-3 space-y-1">
                  <h4 className="text-base font-bold text-white">{q.title}</h4>
                  {q.scenario && (
                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {q.scenario}
                    </p>
                  )}
                </div>

                {/* Comparison Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  {/* Student Answer */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1 uppercase text-[10px]">
                      Your Answer:
                    </span>
                    <div className="font-mono text-slate-300 whitespace-pre-wrap break-all">
                      {typeof result?.studentAnswer === 'object'
                        ? JSON.stringify(result?.studentAnswer, null, 2)
                        : result?.studentAnswer || '(No input provided)'}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block mb-1 uppercase text-[10px] flex items-center space-x-1">
                      <Code className="w-3 h-3" />
                      <span>Correct Answer / Command:</span>
                    </span>
                    <div className="font-mono text-emerald-300 whitespace-pre-wrap break-all">
                      {q.expectedCommand ||
                        (q.options && q.correctOptionIndex !== undefined ? q.options[q.correctOptionIndex] : null) ||
                        (typeof result?.correctAnswer === 'object' ? JSON.stringify(result?.correctAnswer, null, 2) : result?.correctAnswer) ||
                        'Refer to explanation below'}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-amber-400 font-bold flex items-center space-x-1 text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Explanation & Key Concept:</span>
                  </span>
                  <p className="leading-relaxed text-slate-300">
                    {result?.feedback ? `${result.feedback} ` : ''}
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
