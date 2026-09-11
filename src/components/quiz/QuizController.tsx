import React, { useState, useEffect } from 'react';
import { Question, QuestionAttempt, QuizMode, QuizSession } from '../../types';
import { evaluateAnswer } from '../../services/evaluator';
import { recordQuestionAttempt, recordCompletedSession, toggleBookmark, loadProgress } from '../../services/storage';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultsView } from '../results/ResultsView';
import { ReviewView } from '../review/ReviewView';

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

  const currentQuestion: Question | undefined = session.questions[session.currentIndex];

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
          // Auto complete test
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

  // Reset answer buffer when advancing to next question
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
    // If user clicked Review Answers on ResultsView
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

  // Handle Answer Validation Check
  const canSubmit = (() => {
    if (currentAnswer === undefined || currentAnswer === null) return false;
    if (typeof currentAnswer === 'string') return currentAnswer.trim().length > 0;
    if (typeof currentAnswer === 'number') return currentAnswer >= 0;
    if (typeof currentAnswer === 'object') return Object.keys(currentAnswer).length > 0;
    return false;
  })();

  const handleSubmit = () => {
    if (!canSubmit || !currentQuestion) return;

    // Evaluate answer
    const result = evaluateAnswer(currentQuestion, currentAnswer);
    const existingAttempt = session.attempts[currentQuestion.id];

    // FIRST-ATTEMPT RULE:
    // If an attempt exists, preserve firstAttemptScore; otherwise this IS the first attempt!
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

    // Save to session attempts
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

    // Persist to LocalStorage
    recordQuestionAttempt(currentQuestion.topic, attempt, session.mode);
  };

  const handleNext = () => {
    if (session.currentIndex + 1 >= session.totalQuestions) {
      // Finished all questions
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

      recordCompletedSession(
        session.id,
        session.mode,
        totalEarned,
        totalMax,
        session.selectedTopic
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

  const handleRetryPractice = () => {
    if (session.mode !== 'practice') return;
    setIsSubmitted(false);
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    const isNowBookmarked = toggleBookmark(currentQuestion.id);
    setBookmarkedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: isNowBookmarked
    }));
  };

  // Calculate ongoing score
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

      {/* Main Question Card */}
      <QuestionCard
        question={currentQuestion}
        studentAnswer={currentAnswer}
        onChangeAnswer={(ans) => setCurrentAnswer(ans)}
        onSubmit={handleSubmit}
        isSubmitted={isSubmitted}
        canSubmit={canSubmit}
      />

      {/* Immediate Feedback Panel */}
      {isSubmitted && currentAttempt && (
        <FeedbackPanel
          result={currentAttempt.result}
          mode={session.mode}
          onRetry={session.mode === 'practice' ? handleRetryPractice : undefined}
          onNext={handleNext}
          isLastQuestion={session.currentIndex + 1 === session.totalQuestions}
          firstAttemptScore={currentAttempt.firstAttemptScore}
        />
      )}
    </div>
  );
};
