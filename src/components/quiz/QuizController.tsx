import React, { useState, useEffect } from 'react';
import { Question, QuestionAttempt, QuizMode, QuizSession } from '../../types';
import { evaluateAnswer } from '../../services/evaluator';
import { recordQuestionAttempt, recordCompletedSession, toggleBookmark, loadProgress } from '../../services/storage';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultsView } from '../results/ResultsView';
import { ReviewView } from '../review/ReviewView';
import { Bookmark, Flag, ChevronLeft, ChevronRight, CheckCircle2, List } from 'lucide-react';
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
  const [currentAnswer, setCurrentAnswer] = useState<any>(undefined);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<QuestionAttempt | null>(null);
  const [showReview, setShowReview] = useState<boolean>(false);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [showPalette, setShowPalette] = useState<boolean>(false);

  const currentQuestion: Question | undefined = session.questions[session.currentIndex];
  const isMock = session.mode === 'mock-test';

  // Sync bookmarks from storage
  useEffect(() => {
    const progress = loadProgress();
    const map: Record<string, boolean> = {};
    progress.bookmarkedQuestionIds.forEach((id) => (map[id] = true));
    setBookmarkedMap(map);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (session.completed || session.timeRemainingSeconds === undefined) return;

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
  }, [session.completed, session.timeRemainingSeconds]);

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

    // FIRST-ATTEMPT RULE:
    // In assessment modes (mock-test or quiz), initial submission determines the recorded grade
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
      // Completed all questions
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
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fadeIn">
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

      {/* Navigation Tools (Palette toggle & Flag for Review) */}
      <div className="flex items-center justify-between px-2 text-xs">
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
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn">
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
