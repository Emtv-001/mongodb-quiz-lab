import React, { useState, useEffect } from 'react';
import { getRegisteredLearnerAccount } from '../../services/learnerService';
import { Question, QuestionAttempt, QuizMode, QuizSession } from '../../types';
import { evaluateAnswer } from '../../services/evaluator';
import { recordQuestionAttempt, recordCompletedSession, toggleBookmark, loadProgress } from '../../services/storage';
import { recordDeletionStatement } from '../../services/adminService';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultsView } from '../results/ResultsView';
import { ReviewView } from '../review/ReviewView';
import {
  Bookmark,
  Flag,
  ChevronLeft,
  ChevronRight,
  List,
  Play,
  Clock,
  Target,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Award
} from 'lucide-react';
import { MOCK_EXAM_PRESETS } from '../../data/mockExams';

interface QuizControllerProps {
  session: QuizSession;
  onOpenSeedData: () => void;
  onGoHome: () => void;
  onRestartQuiz: () => void;
}

export const QuizController: React.FC<QuizControllerProps> = ({
  session: initialSession,
  onOpenSeedData,
  onGoHome,
  onRestartQuiz
}) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [hasStarted, setHasStarted] = useState<boolean>(false); // Pre-start briefing screen state
  const [currentAnswer, setCurrentAnswer] = useState<any>(undefined);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<QuestionAttempt | null>(null);
  const [showReview, setShowReview] = useState<boolean>(false);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [showPalette, setShowPalette] = useState<boolean>(false);

  const currentQuestion: Question | undefined = session.questions[session.currentIndex];
  const isMock = session.mode === 'mock-test';
  const preset = MOCK_EXAM_PRESETS.find(p => p.id === session.mockExamId);

  // Sync bookmarks from storage
  useEffect(() => {
    const progress = loadProgress();
    const map: Record<string, boolean> = {};
    progress.bookmarkedQuestionIds.forEach((id) => (map[id] = true));
    setBookmarkedMap(map);
  }, []);

  // Timer Tick - ONLY ticks AFTER user clicks Start
  useEffect(() => {
    if (!hasStarted || session.completed || session.timeRemainingSeconds === undefined) return;

    const timer = setInterval(() => {
      setSession((prev) => {
        if (prev.completed || prev.timeRemainingSeconds === undefined) return prev;
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(timer);
          return {
            ...prev,
            timeRemainingSeconds: 0,
            completed: true,
            endTime: Date.now()
          };
        }
        return {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, session.completed, session.timeRemainingSeconds]);

  // Load question state on index change
  useEffect(() => {
    if (!currentQuestion) return;
    const existing = session.attempts[currentQuestion.id];
    if (existing) {
      setCurrentAnswer(existing.studentAnswer);
      setCurrentAttempt(existing);
      setIsSubmitted(true);
    } else {
      setCurrentAnswer(undefined);
      setCurrentAttempt(null);
      setIsSubmitted(false);
    }
  }, [session.currentIndex, currentQuestion]);

  // --- PRE-START EXAM BRIEFING SCREEN ---
  if (!hasStarted) {
    const durationMins = session.totalDurationSeconds ? Math.ceil(session.totalDurationSeconds / 60) : 15;
    let totalPoints = 0;
    session.questions.forEach(q => (totalPoints += q.points));

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Ready to Begin Assessment</span>
              </span>
              <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Mode: {session.mode.toUpperCase()}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {preset ? preset.title : session.selectedTopic ? `${session.selectedTopic} Practice` : 'MongoDB Practical Assessment'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Review session parameters below. The timer will <strong>only start counting down after you click the Begin Exam button</strong>.
            </p>
          </div>

          {/* Key Parameters Matrix */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <Target className="w-5 h-5 text-blue-400 mx-auto" />
              <div className="text-xl font-bold font-mono text-white">{session.totalQuestions}</div>
              <div className="text-[11px] text-slate-400 font-medium">Questions</div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <Clock className="w-5 h-5 text-amber-400 mx-auto" />
              <div className="text-xl font-bold font-mono text-amber-400">{durationMins}m</div>
              <div className="text-[11px] text-slate-400 font-medium">Time Limit</div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <Award className="w-5 h-5 text-purple-400 mx-auto" />
              <div className="text-xl font-bold font-mono text-purple-300">{totalPoints}</div>
              <div className="text-[11px] text-slate-400 font-medium">Max Points</div>
            </div>
          </div>

          {/* Exam Rules & Instructions */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-2 text-xs">
            <div className="font-bold text-slate-200 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Assessment Rules & Guidance:</span>
            </div>
            <ul className="text-slate-400 space-y-1.5 pl-4 list-disc text-[11px] leading-relaxed">
              <li><strong>First-Attempt Rule</strong>: In assessment and mock exam modes, your initial score is recorded for transcript grades.</li>
              <li>You can navigate between questions using the Question Grid Palette or Previous/Next controls.</li>
              <li>Toggle <strong>Mark for Review</strong> on challenging questions to revisit them before final submission.</li>
              <li>Instant feedback with partial credit breakdown and concept rules will be revealed.</li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onGoHome}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors text-center"
            >
              Back to Dashboard
            </button>

            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Assessment Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS & REVIEW VIEWS ---
  if (!currentQuestion || session.completed) {
    if (showReview) {
      return (
        <ReviewView
          questions={session.questions}
          attempts={session.attempts}
          onBack={() => setShowReview(false)}
        />
      );
    }

    return (
      <ResultsView
        session={session}
        onReviewAnswers={() => setShowReview(true)}
        onRestartQuiz={onRestartQuiz}
        onGoHome={onGoHome}
      />
    );
  }

  // Answer validation
  const canSubmit = (() => {
    if (currentAnswer === undefined || currentAnswer === null) return false;
    if (typeof currentAnswer === 'string') return currentAnswer.trim().length > 0;
    if (typeof currentAnswer === 'number') return currentAnswer >= 0;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    if (typeof currentAnswer === 'object') return Object.keys(currentAnswer).length > 0;
    return false;
  })();

  const handleSubmit = () => {
    if (!canSubmit || !currentQuestion) return;

    const result = evaluateAnswer(currentQuestion, currentAnswer);
    const existingAttempt = session.attempts[currentQuestion.id];

    const firstAttemptScore = existingAttempt
      ? existingAttempt.firstAttemptScore
      : result.score;

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,
      firstAttemptScore,
      currentScore: result.score,
      attemptsCount: existingAttempt ? existingAttempt.attemptsCount + 1 : 1,
      studentAnswer: currentAnswer,
      result,
      timestamp: Date.now()
    };

    const updatedAttempts = {
      ...session.attempts,
      [currentQuestion.id]: attempt
    };

    setSession((prev) => ({
      ...prev,
      attempts: updatedAttempts
    }));

    setCurrentAttempt(attempt);
    setIsSubmitted(true);

    recordQuestionAttempt(currentQuestion.topic, attempt, session.mode);
  };

  const handleNext = () => {
    if (session.currentIndex + 1 >= session.totalQuestions) {
      let totalEarned = 0;
      let totalMax = 0;
      session.questions.forEach((q) => {
        totalMax += q.points;
        const att = session.attempts[q.id];
        if (att) {
          totalEarned += (session.mode === 'quiz' || session.mode === 'mock-test')
            ? att.firstAttemptScore
            : att.currentScore;
        }
      });

      const preset = MOCK_EXAM_PRESETS.find(p => p.id === session.mockExamId);

      recordCompletedSession(
          session.id,
          session.mode,
          totalEarned,
          totalMax,
          session.selectedTopic,
          preset?.title
        );

        // Auto-generate error report for the Statements Board if score is low
        const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
        if (percentage < 70) {
          const missedAttempts = Object.values(session.attempts).filter(a => a.result.score < a.result.maxScore);
          if (missedAttempts.length > 0) {
            const worstQuestionId = missedAttempts[0].questionId;
            const worstQuestion = session.questions.find(q => q.id === worstQuestionId);
            const account = getRegisteredLearnerAccount();
            
            if (worstQuestion && account) {
              const statementData = {
                accountType: 'learner' as const,
                accountId: account.id,
                username: account.username,
                email: account.email,
                displayName: account.displayName,
                reasonCategory: 'Learning Error: ' + worstQuestion.topic,
                statement: `Learner completed a quiz but scored low (${Math.round(percentage)}%). They specifically struggled with this scenario:\n\n"${worstQuestion.scenario}"\n\nTheir incorrect answer was likely due to a misconception about this topic.`,
                tip: worstQuestion.misconception || `Review ${worstQuestion.topic} syntax and common pitfalls.`,
                deletedBy: 'System Auto-Report'
              };
              recordDeletionStatement(statementData).catch(e => console.error('Failed to log error report', e));
            }
          }
        }

        setSession((prev) => ({
          ...prev,
          completed: true,
          endTime: Date.now()
        }));
    } else {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));
    }
  };

  const handlePrev = () => {
    if (session.currentIndex > 0) {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }));
    }
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const isFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);
    const updated = isFlagged
      ? session.flaggedQuestionIds.filter(id => id !== currentQuestion.id)
      : [...session.flaggedQuestionIds, currentQuestion.id];

    setSession(prev => ({ ...prev, flaggedQuestionIds: updated }));
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    const isNowBookmarked = toggleBookmark(currentQuestion.id);
    setBookmarkedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: isNowBookmarked
    }));
  };

  let currentPoints = 0;
  let totalPossiblePoints = 0;
  session.questions.forEach((q) => {
    totalPossiblePoints += q.points;
    const att = session.attempts[q.id];
    if (att) {
      currentPoints += (session.mode === 'quiz' || session.mode === 'mock-test')
        ? att.firstAttemptScore
        : att.currentScore;
    }
  });

  const isCurrentFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);

  return (
    <div className="max-w-4xl mx-auto space-y-5 py-4 px-2 sm:px-4 animate-fadeIn">
      {/* Progress & Countdown Header */}
      <ProgressBar
        currentIndex={session.currentIndex}
        totalQuestions={session.totalQuestions}
        topic={currentQuestion.topic}
        difficulty={currentQuestion.difficulty}
        mode={session.mode}
        timeRemaining={session.timeRemainingSeconds}
        currentPoints={currentPoints}
        totalPossiblePoints={totalPossiblePoints}
        isBookmarked={Boolean(bookmarkedMap[currentQuestion.id])}
        onToggleBookmark={handleToggleBookmark}
        onOpenSeedData={onOpenSeedData}
      />

      {/* Navigation Tools Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <button
          type="button"
          onClick={() => setShowPalette(!showPalette)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <List className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showPalette ? 'Hide Question Grid' : 'Question Grid Palette'}</span>
        </button>

        <div className="flex items-center space-x-2">
          {isMock && (
            <button
              type="button"
              onClick={handleToggleFlag}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border transition-colors ${
                isCurrentFlagged
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCurrentFlagged ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          )}

          {session.currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Grid Palette Drawer */}
      {showPalette && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-white">Jump to Question</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Answered</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Marked</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <span>Pending</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {session.questions.map((q, idx) => {
              const hasAttempt = Boolean(session.attempts[q.id]);
              const isFlagged = session.flaggedQuestionIds.includes(q.id);
              const isCurrent = idx === session.currentIndex;

              let btnClass = 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700';
              if (isCurrent) btnClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500 ring-1 ring-emerald-500';
              else if (isFlagged) btnClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              else if (hasAttempt) btnClass = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSession(prev => ({ ...prev, currentIndex: idx }));
                    setShowPalette(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-mono font-bold border transition-all text-center ${btnClass}`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <QuestionCard
        question={currentQuestion}
        studentAnswer={currentAnswer}
        onChangeAnswer={(ans) => setCurrentAnswer(ans)}
        onSubmit={handleSubmit}
        isSubmitted={isSubmitted}
        canSubmit={canSubmit}
        onOpenSeedData={onOpenSeedData}
      />

      {/* Immediate Feedback Panel */}
      {isSubmitted && currentAttempt && (
        <FeedbackPanel
          result={currentAttempt.result}
          mode={session.mode}
          onRetry={session.mode === 'practice' ? () => setIsSubmitted(false) : undefined}
          onNext={handleNext}
          isLastQuestion={session.currentIndex + 1 === session.totalQuestions}
          firstAttemptScore={currentAttempt.firstAttemptScore}
        />
      )}
    </div>
  );
};
