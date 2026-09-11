import { MongoTopic, Question, QuestionAttempt, QuizMode, StudentProgress } from '../types';

const PROGRESS_STORAGE_KEY = 'mongo_quiz_student_progress_v1';
const CUSTOM_QUESTIONS_KEY = 'mongo_quiz_custom_questions_v1';

const ALL_TOPICS: MongoTopic[] = [
  'Basic Queries',
  'Comparison Operators',
  'Logical Operators',
  'Regular Expressions',
  'Arrays',
  'Nested Documents',
  'Update Operators',
  'Array Updates',
  '$addToSet vs $push',
  'Removing Array Elements',
  'Upsert & $setOnInsert',
  'Aggregation'
];

function getInitialProgress(): StudentProgress {
  const initialTopicStats: any = {};
  ALL_TOPICS.forEach(topic => {
    initialTopicStats[topic] = { attempted: 0, correct: 0, totalPoints: 0, earnedPoints: 0 };
  });

  return {
    questionsAttempted: 0,
    questionsCorrect: 0,
    questionsPartial: 0,
    totalScore: 0,
    totalMaxScore: 0,
    bestMockScore: 0,
    currentStreak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    topicStats: initialTopicStats,
    completedSessions: [],
    bookmarkedQuestionIds: [],
    masteredFlashcardIds: []
  };
}

export function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return getInitialProgress();
    const parsed = JSON.parse(raw);
    // Ensure all topics exist in parsed data
    ALL_TOPICS.forEach(t => {
      if (!parsed.topicStats[t]) {
        parsed.topicStats[t] = { attempted: 0, correct: 0, totalPoints: 0, earnedPoints: 0 };
      }
    });
    return parsed;
  } catch (err) {
    console.error("Failed to load progress from localStorage", err);
    return getInitialProgress();
  }
}

export function saveProgress(progress: StudentProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error("Failed to save progress to localStorage", err);
  }
}

/**
 * Records an attempt with strict adherence to the First-Attempt Rule in assessment modes.
 */
export function recordQuestionAttempt(
  topic: MongoTopic,
  attempt: QuestionAttempt,
  mode: QuizMode
): StudentProgress {
  const progress = loadProgress();

  // Streak calculation
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (progress.lastActiveDate === yesterday) {
      progress.currentStreak += 1;
    } else {
      progress.currentStreak = 1;
    }
    progress.lastActiveDate = today;
  }

  // In assessment modes (quiz or mock-test), score is determined solely by the first attempt
  const scoreToRecord = (mode === 'quiz' || mode === 'mock-test')
    ? attempt.firstAttemptScore
    : attempt.currentScore;

  const maxPoints = attempt.result.maxScore;

  progress.questionsAttempted += 1;
  if (scoreToRecord >= maxPoints * 0.95) {
    progress.questionsCorrect += 1;
  } else if (scoreToRecord > 0) {
    progress.questionsPartial += 1;
  }

  progress.totalScore += scoreToRecord;
  progress.totalMaxScore += maxPoints;

  // Update topic specific stats
  if (progress.topicStats[topic]) {
    progress.topicStats[topic].attempted += 1;
    if (scoreToRecord >= maxPoints * 0.95) {
      progress.topicStats[topic].correct += 1;
    }
    progress.topicStats[topic].earnedPoints += scoreToRecord;
    progress.topicStats[topic].totalPoints += maxPoints;
  }

  saveProgress(progress);
  return progress;
}

export function recordCompletedSession(
  sessionId: string,
  mode: QuizMode,
  score: number,
  maxScore: number,
  topic?: MongoTopic
): void {
  const progress = loadProgress();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  if (mode === 'mock-test' && percentage > progress.bestMockScore) {
    progress.bestMockScore = percentage;
  }

  progress.completedSessions.unshift({
    sessionId,
    mode,
    score,
    maxScore,
    percentage,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    topic
  });

  if (progress.completedSessions.length > 20) {
    progress.completedSessions.pop();
  }

  saveProgress(progress);
}

export function toggleBookmark(questionId: string): boolean {
  const progress = loadProgress();
  const index = progress.bookmarkedQuestionIds.indexOf(questionId);
  let isBookmarked = false;
  if (index >= 0) {
    progress.bookmarkedQuestionIds.splice(index, 1);
  } else {
    progress.bookmarkedQuestionIds.push(questionId);
    isBookmarked = true;
  }
  saveProgress(progress);
  return isBookmarked;
}

export function toggleFlashcardMastery(flashcardId: string): boolean {
  const progress = loadProgress();
  const index = progress.masteredFlashcardIds.indexOf(flashcardId);
  let isMastered = false;
  if (index >= 0) {
    progress.masteredFlashcardIds.splice(index, 1);
  } else {
    progress.masteredFlashcardIds.push(flashcardId);
    isMastered = true;
  }
  saveProgress(progress);
  return isMastered;
}

export function loadCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load custom questions", err);
    return [];
  }
}

export function saveCustomQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (err) {
    console.error("Failed to save custom questions", err);
  }
}

export function resetAllData(): void {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_QUESTIONS_KEY);
}
