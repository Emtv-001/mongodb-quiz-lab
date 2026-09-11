import React, { useEffect } from 'react';
import { QuizSession } from '../../types';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, CheckSquare, Home, Sparkles, AlertCircle } from 'lucide-react';

interface ResultsViewProps {
  session: QuizSession;
  onReviewAnswers: () => void;
  onRestartQuiz: () => void;
  onGoHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  session,
  onReviewAnswers,
  onRestartQuiz,
  onGoHome
}) => {
  // Calculate total score based on the First-Attempt Rule for assessments
  const isAssessment = session.mode === 'quiz' || session.mode === 'mock-test';

  let totalScore = 0;
  let totalMax = 0;
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;

  session.questions.forEach((q) => {
    const attempt = session.attempts[q.id];
    totalMax += q.points;
    if (attempt) {
      const score = isAssessment ? attempt.firstAttemptScore : attempt.currentScore;
      totalScore += score;
      if (score >= q.points * 0.95) {
        correctCount++;
      } else if (score > 0) {
        partialCount++;
      } else {
        incorrectCount++;
      }
    } else {
      incorrectCount++;
    }
  });

  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  // Grade classification (NIIT-Style)
  let grade = 'Referral';
  let gradeColor = 'text-red-400 bg-red-500/10 border-red-500/30';
  let badgeTitle = 'Needs Improvement';

  if (percentage >= 85) {
    grade = 'Distinction';
    gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    badgeTitle = 'Outstanding Mastery';
  } else if (percentage >= 70) {
    grade = 'Merit';
    gradeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    badgeTitle = 'Proficient';
  } else if (percentage >= 50) {
    grade = 'Pass';
    gradeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    badgeTitle = 'Satisfactory';
  }

  // Trigger confetti on good performance
  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn py-6">
      {/* Primary Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative space-y-3">
          <div className="inline-flex p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-inner">
            {percentage >= 70 ? (
              <Trophy className="w-10 h-10 text-emerald-400" />
            ) : (
              <Award className="w-10 h-10 text-amber-400" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {session.mode === 'mock-test'
              ? 'Mock Practical Assessment Results'
              : 'Quiz Assessment Completed!'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {isAssessment
              ? 'Scores are calculated using the First-Attempt Assessment Rule. Retries are available in Review for learning.'
              : 'Practice mode completed! Review your answers and try again anytime.'}
          </p>
        </div>

        {/* Big Percentage & Grade */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 shadow-inner">
            <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
              {percentage}%
            </span>
            <span className="block text-xs font-semibold text-slate-400 mt-1">
              Total Score: {totalScore} / {totalMax} pts
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start space-y-1.5">
            <span className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider border ${gradeColor}`}>
              {grade}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Status: {badgeTitle}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Mode: {session.mode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-xl font-bold text-emerald-400 font-mono">{correctCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Fully Correct</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-xl font-bold text-amber-400 font-mono">{partialCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Partial Credit</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-xl font-bold text-red-400 font-mono">{incorrectCount}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Incorrect</div>
          </div>
        </div>

        {/* First-Attempt Rule Advisory */}
        {isAssessment && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-center space-x-2 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Recorded under <strong>First-Attempt Rule</strong>: Initial responses determine assessment grades.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={onReviewAnswers}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Answers & Explanations</span>
          </button>

          <button
            onClick={onRestartQuiz}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Take Another Test</span>
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
