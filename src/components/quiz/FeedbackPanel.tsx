import React from 'react';
import { EvaluationResult, QuizMode } from '../../types';
import { CheckCircle2, AlertCircle, Award, ArrowRight, RotateCcw, Lightbulb, Code } from 'lucide-react';

interface FeedbackPanelProps {
  result: EvaluationResult;
  mode: QuizMode;
  onRetry?: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
  firstAttemptScore?: number;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  result,
  mode,
  onRetry,
  onNext,
  isLastQuestion,
  firstAttemptScore
}) => {
  const isAssessment = mode === 'quiz' || mode === 'mock-test';
  const { isCorrect, isPartial, score, maxScore, feedback, concept, correctAnswer, studentAnswer, correctedCommand, breakdown } = result;

  // Color theme based on correctness
  const statusColor = isCorrect
    ? 'emerald'
    : isPartial
    ? 'amber'
    : 'red';

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all animate-fadeIn ${
        isCorrect
          ? 'bg-emerald-950/20 border-emerald-500/40'
          : isPartial
          ? 'bg-amber-950/20 border-amber-500/40'
          : 'bg-red-950/20 border-red-500/40'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          {isCorrect ? (
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : isPartial ? (
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}

          <div>
            <h4
              className={`text-base font-bold ${
                isCorrect
                  ? 'text-emerald-300'
                  : isPartial
                  ? 'text-amber-300'
                  : 'text-red-300'
              }`}
            >
              {isCorrect
                ? 'Correct! Full Marks'
                : isPartial
                ? 'Partially Correct (Partial Credit Awarded)'
                : 'Incorrect'}
            </h4>
            <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>Concept: <strong className="text-slate-200">{concept}</strong></span>
            </div>
          </div>
        </div>

        {/* Points Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <div
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border ${
              isCorrect
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isPartial
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            Score: {score} / {maxScore} pts
          </div>

          {isAssessment && firstAttemptScore !== undefined && (
            <span
              className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700"
              title="In assessment modes, your recorded score is locked on your first submitted attempt"
            >
              First Attempt: {firstAttemptScore}/{maxScore}
            </span>
          )}
        </div>
      </div>

      {/* Answer Comparison Details */}
      <div className="py-4 space-y-3 text-xs sm:text-sm">
        {/* Student Answer */}
        {studentAnswer !== undefined && (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">
              What You Submitted:
            </span>
            <div className="font-mono text-slate-200 whitespace-pre-wrap break-all">
              {typeof studentAnswer === 'object'
                ? JSON.stringify(studentAnswer, null, 2)
                : studentAnswer || '(No input)'}
            </div>
          </div>
        )}

        {/* Correct Answer / Corrected Command */}
        {(correctAnswer || correctedCommand) && (
          <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-400 block text-[11px] uppercase font-bold mb-1 flex items-center space-x-1">
              <Code className="w-3.5 h-3.5" />
              <span>Correct MongoDB Syntax:</span>
            </span>
            <div className="font-mono text-emerald-300 whitespace-pre-wrap break-all">
              {correctedCommand || (typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer, null, 2) : correctAnswer)}
            </div>
          </div>
        )}

        {/* Pedagogical Explanation & Partial Credit rationale */}
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1 flex items-center space-x-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Explanation & Concept Breakdown:</span>
          </span>
          <p className="text-slate-300 leading-relaxed">
            {feedback}
          </p>

          {/* Breakdown checklist if available */}
          {breakdown && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-xs space-y-1">
              {breakdown.matchedCriteria.map((item, i) => (
                <div key={i} className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="text-[10px] font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
              {breakdown.missedCriteria.map((item, i) => (
                <div key={i} className="flex items-center space-x-1.5 text-amber-400">
                  <span className="text-[10px] font-bold">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-between">
        {mode === 'practice' && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again (Practice)</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-400">
            {isAssessment && "Assessment mode: First attempt recorded."}
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all ml-auto"
        >
          <span>{isLastQuestion ? 'Complete Assessment' : 'Next Question'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
