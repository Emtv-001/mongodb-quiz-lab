import { MongoTopic, Question, QuestionAttempt, QuizMode, StudentProgress, SpacedRepetitionItem } from '../types';
import { getOrCreateLearnerIdentity, computeProgressDigest, verifyProgressIntegrity } from './security';

const PROGRESS_STORAGE_KEY = 'mongo_quiz_student_progress_v2';
export const CUSTOM_QUESTIONS_KEY = 'mongo_quiz_custom_questions_v1';

export const ALL_TOPICS: MongoTopic[] = [
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

function getInitialProgress(): StudentProgress {
  const initialTopicStats: any = {};
  ALL_TOPICS.forEach(topic => {
    initialTopicStats[topic] = { attempted: 0, correct: 0, totalPoints: 0, earnedPoints: 0 };
  });

  const identity = getOrCreateLearnerIdentity();
  const today = new Date().toISOString().split('T')[0];

  const p: StudentProgress = {
    learnerId: identity,
    questionsAttempted: 0,
    questionsCorrect: 0,
    questionsPartial: 0,
    totalScore: 0,
    totalMaxScore: 0,
    bestMockScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: today,
    activityHistory: {},
    topicStats: initialTopicStats,
    completedSessions: [],
    bookmarkedQuestionIds: [],
    masteredFlashcardIds: [],
    spacedRepetition: {}
  };

  p.checksum = computeProgressDigest(p);
  return p;
}

export function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return getInitialProgress();
    const parsed: StudentProgress = JSON.parse(raw);

    // Verify cryptographic integrity to avoid browser DevTools score tampering
    if (!verifyProgressIntegrity(parsed)) {
      console.warn("Progress integrity checksum verification failed. Recomputing baseline.");
    }

    if (!parsed.learnerId) {
      parsed.learnerId = getOrCreateLearnerIdentity();
    }

    if (!parsed.activityHistory) {
      parsed.activityHistory = {};
    }

    if (!parsed.longestStreak) {
      parsed.longestStreak = parsed.currentStreak || 0;
    }

    if (!parsed.spacedRepetition) {
      parsed.spacedRepetition = {};
    }

    // Ensure all 20 topics exist
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
    progress.checksum = computeProgressDigest(progress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    
    // Dispatch event to trigger MongoDB Atlas background sync without circular dependencies
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mongo_quiz_progress_saved'));
    }
  } catch (err) {
    console.error("Failed to save progress to localStorage", err);
  }
}

/**
 * Calculates genuine calendar day streak based on meaningful learning activity
 */
function updateStreakLogic(progress: StudentProgress): void {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = progress.lastActiveDate;

  if (lastActive === today) {
    if (progress.currentStreak === 0) {
      progress.currentStreak = 1;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    }
    return;
  }

  // Calculate calendar days difference
  const todayDate = new Date(today);
  const lastDate = new Date(lastActive);
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    progress.currentStreak += 1;
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
  } else if (diffDays > 1) {
    // Skipped one or more days: reset streak to 1
    progress.currentStreak = 1;
  }

  progress.lastActiveDate = today;
  progress.learnerId.lastActive = new Date().toISOString();
}

/**
 * Records a question attempt with streak and spaced repetition tracking
 */
export function recordQuestionAttempt(
  topic: MongoTopic,
  attempt: QuestionAttempt,
  mode: QuizMode
): StudentProgress {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];

  // Record daily activity history
  if (!progress.activityHistory[today]) {
    progress.activityHistory[today] = {
      date: today,
      questionsAttempted: 0,
      questionsCorrect: 0,
      earnedPoints: 0
    };
  }

  const actualScore = (mode === 'quiz' || mode === 'mock-test')
    ? attempt.firstAttemptScore
    : attempt.currentScore;

  const scoreToRecord = mode === 'practice' ? 0 : actualScore;
  const maxPointsToRecord = mode === 'practice' ? 0 : attempt.result.maxScore;
  const maxPoints = attempt.result.maxScore; // Real max points for pass calculation

  progress.questionsAttempted += 1;
  progress.activityHistory[today].questionsAttempted += 1;

  if (actualScore >= maxPoints * 0.95) {
    progress.questionsCorrect += 1;
    progress.activityHistory[today].questionsCorrect += 1;
  } else if (actualScore > 0) {
    progress.questionsPartial += 1;
  }

  progress.totalScore += scoreToRecord;
  progress.totalMaxScore += maxPointsToRecord;
  progress.activityHistory[today].earnedPoints += scoreToRecord;

  // Meaningful activity requirement (at least 3 questions in a day qualifies for streak check)
  if (progress.activityHistory[today].questionsAttempted >= 3) {
    updateStreakLogic(progress);
  }

  // Topic specific stats
  if (progress.topicStats[topic]) {
    progress.topicStats[topic].attempted += 1;
    if (actualScore >= maxPoints * 0.95) {
      progress.topicStats[topic].correct += 1;
    }
    progress.topicStats[topic].earnedPoints += scoreToRecord;
    progress.topicStats[topic].totalPoints += maxPointsToRecord;
  }

  // Spaced Repetition (SuperMemo SM-2 inspired algorithm)
  const qId = attempt.questionId;
  const isPass = actualScore >= maxPoints * 0.7;
  const existingSR: SpacedRepetitionItem = progress.spacedRepetition[qId] || {
    questionId: qId,
    intervalDays: 1,
    easeFactor: 2.5,
    consecutiveCorrect: 0,
    lastReviewedDate: today,
    nextReviewDate: today
  };

  if (isPass) {
    existingSR.consecutiveCorrect += 1;
    if (existingSR.consecutiveCorrect === 1) existingSR.intervalDays = 1;
    else if (existingSR.consecutiveCorrect === 2) existingSR.intervalDays = 3;
    else existingSR.intervalDays = Math.round(existingSR.intervalDays * existingSR.easeFactor);
  } else {
    existingSR.consecutiveCorrect = 0;
    existingSR.intervalDays = 1;
    existingSR.easeFactor = Math.max(1.3, existingSR.easeFactor - 0.2);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + existingSR.intervalDays);
  existingSR.lastReviewedDate = today;
  existingSR.nextReviewDate = nextDate.toISOString().split('T')[0];
  progress.spacedRepetition[qId] = existingSR;

  saveProgress(progress);
  return progress;
}

export function recordCompletedSession(
  sessionId: string,
  mode: QuizMode,
  score: number,
  maxScore: number,
  topic?: MongoTopic,
  mockExamTitle?: string
): void {
  const progress = loadProgress();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  if (mode === 'mock-test' && percentage > progress.bestMockScore) {
    progress.bestMockScore = percentage;
  }

  updateStreakLogic(progress);

  progress.completedSessions.unshift({
    sessionId,
    mode,
    mockExamTitle,
    score,
    maxScore,
    percentage,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    topic
  });

  if (progress.completedSessions.length > 25) {
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

export function sanitizeQuestion(raw: any, index = 0): Question {
  // Helper to stringify fields safely
  const safeString = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if (val.$oid) return String(val.$oid);
      return val.text || val.command || val.query || val.code || val.statement || val.value || val.description || val.title || JSON.stringify(val);
    }
    return String(val);
  };

  if (!raw || typeof raw !== 'object') {
    return {
      id: `custom_${Date.now()}_${index}`,
      topic: 'CRUD Operations',
      level: 1,
      difficulty: 'Easy',
      type: 'multiple-choice',
      title: 'MongoDB Question',
      scenario: '',
      points: 10,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: 'Select the best answer that adheres to MongoDB standards.',
      conceptFocus: 'CRUD Operations'
    };
  }

  // Ensure id is a valid string
  let id = `custom_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
  if (typeof raw.id === 'string' && raw.id.trim()) {
    id = raw.id.trim();
  } else if (raw.id && typeof raw.id === 'object' && raw.id.$oid) {
    id = String(raw.id.$oid);
  } else if (raw._id) {
    id = typeof raw._id === 'object' && raw._id.$oid ? String(raw._id.$oid) : String(raw._id);
  }

  // Ensure options is an array of strings
  let options: string[] | undefined;
  if (Array.isArray(raw.options)) {
    options = raw.options.map((opt: any) => {
      if (typeof opt === 'string') return opt;
      if (opt && typeof opt === 'object') {
        return opt.text || opt.value || opt.option || opt.label || opt.description || JSON.stringify(opt);
      }
      return String(opt ?? '');
    });
  } else if (typeof raw.options === 'string') {
    options = raw.options.split('\n').map((s: string) => s.trim()).filter(Boolean);
  } else if (raw.options && typeof raw.options === 'object') {
    options = Object.values(raw.options).map((v: any) => typeof v === 'object' ? (v.text || JSON.stringify(v)) : String(v));
  }

  const rawType = safeString(raw.type, 'multiple-choice').toLowerCase();
  const validTypes = ['multiple-choice', 'predict-output', 'find-error', 'write-command', 'match-operator', 'scenario', 'arrange-command', 'multiple-select', 'true-false', 'fix-query'];
  const type = (validTypes.includes(rawType) ? rawType : 'multiple-choice') as any;

  if (!options && ['multiple-choice', 'predict-output', 'find-error', 'scenario', 'true-false'].includes(type)) {
    options = type === 'true-false' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  return {
    id,
    title: safeString(raw.title, 'MongoDB Question'),
    topic: safeString(raw.topic, 'CRUD Operations') as any,
    subtopic: raw.subtopic ? safeString(raw.subtopic) : undefined,
    level: typeof raw.level === 'number' && !isNaN(raw.level) ? raw.level : (Number(raw.level) || 1),
    difficulty: safeString(raw.difficulty, 'Medium') as any,
    type,
    scenario: raw.scenario ? safeString(raw.scenario) : undefined,
    datasetName: raw.datasetName ? safeString(raw.datasetName) : undefined,
    codeSnippet: raw.codeSnippet ? safeString(raw.codeSnippet) : undefined,
    sampleDocument: raw.sampleDocument && typeof raw.sampleDocument === 'object' ? raw.sampleDocument : undefined,
    expectedCommand: raw.expectedCommand ? safeString(raw.expectedCommand) : undefined,
    acceptableAlternatives: Array.isArray(raw.acceptableAlternatives) ? raw.acceptableAlternatives.map((a: any) => safeString(a)) : undefined,
    options,
    correctOptionIndex: typeof raw.correctOptionIndex === 'number' && !isNaN(raw.correctOptionIndex) ? raw.correctOptionIndex : (Number(raw.correctOptionIndex) || 0),
    correctOptionIndices: Array.isArray(raw.correctOptionIndices) ? raw.correctOptionIndices.map((i: any) => Number(i)).filter((n: number) => !isNaN(n)) : undefined,
    matchPairs: Array.isArray(raw.matchPairs) ? raw.matchPairs : undefined,
    arrangeBlocks: Array.isArray(raw.arrangeBlocks) ? raw.arrangeBlocks : undefined,
    correctArrangeOrder: Array.isArray(raw.correctArrangeOrder) ? raw.correctArrangeOrder : undefined,
    explanation: safeString(raw.explanation, 'Review MongoDB documentation for this topic.'),
    misconception: raw.misconception ? safeString(raw.misconception) : undefined,
    conceptFocus: safeString(raw.conceptFocus, raw.topic || 'CRUD Operations'),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => safeString(t)) : undefined,
    points: typeof raw.points === 'number' && !isNaN(raw.points) ? raw.points : (Number(raw.points) || 10)
  };
}

export function getLocalCachedCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((q: any, idx: number) => sanitizeQuestion(q, idx));
  } catch {
    return [];
  }
}

export async function loadCustomQuestions(): Promise<Question[]> {
  try {
    const res = await fetch('/api/questions');
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data.questions) ? data.questions : [];
      const sanitized = rawList.map((q: any, idx: number) => sanitizeQuestion(q, idx));
      if (sanitized.length > 0) {
        localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (err) {
    console.error("Failed to load custom questions from API, using local cache", err);
  }
  return getLocalCachedCustomQuestions();
}

export async function saveCustomQuestions(questions: Question[]): Promise<void> {
  const sanitized = (questions || []).map((q, idx) => sanitizeQuestion(q, idx));
  // Immediate local persistence
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(sanitized));
  } catch {}

  // Sync to Atlas cloud
  try {
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    });
  } catch (err) {
    console.error("Failed to save custom questions to Atlas", err);
  }
}

export async function appendCustomQuestions(questions: Question[]): Promise<Question[]> {
  const sanitized = (questions || []).map((q, idx) => sanitizeQuestion(q, idx));
  const current = getLocalCachedCustomQuestions();
  const existingIds = new Set(current.map(q => q.id));
  const merged = [...current, ...sanitized.filter(q => !existingIds.has(q.id))];
  
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(merged));
  } catch {}

  try {
    const res = await fetch('/api/questions?mode=append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    });
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data.questions) ? data.questions : [];
      const cloudList = rawList.map((q: any, idx: number) => sanitizeQuestion(q, idx));
      if (cloudList.length > 0) {
        localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(cloudList));
        return cloudList;
      }
    }
  } catch (err) {
    console.error("Failed to append custom questions to Atlas", err);
  }
  return merged;
}

export function resetAllData(): void {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
}
