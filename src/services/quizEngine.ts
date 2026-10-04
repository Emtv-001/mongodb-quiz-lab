import { DEFAULT_QUESTIONS } from '../data/questions';
import { MOCK_EXAM_PRESETS } from '../data/mockExams';
import { MongoTopic, Question, QuizMode, QuizSession } from '../types';
import { loadCustomQuestions, loadProgress } from './storage';

/**
 * Fisher-Yates array shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fetches all available questions (built-in + instructor custom questions)
 */
export function getAllQuestions(): Question[] {
  const custom = loadCustomQuestions();
  return [...DEFAULT_QUESTIONS, ...custom];
}

/**
 * Anti-memorization: creates question variations with shuffled options
 */
export function prepareQuestionForSession(q: Question): Question {
  // If multiple-choice / scenario / predict / find-error / multiple-select, randomize the option order
  if (q.options && q.options.length > 1 && q.correctOptionIndex !== undefined) {
    const correctOption = q.options[q.correctOptionIndex];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctOption);
    return {
      ...q,
      options: shuffledOptions,
      correctOptionIndex: newCorrectIndex
    };
  }

  // If match-operator, randomize the pairs order
  if (q.matchPairs && q.matchPairs.length > 0) {
    return {
      ...q,
      matchPairs: shuffleArray(q.matchPairs)
    };
  }

  // If arrange-command, shuffle the blocks
  if (q.arrangeBlocks && q.arrangeBlocks.length > 0) {
    return {
      ...q,
      arrangeBlocks: shuffleArray(q.arrangeBlocks)
    };
  }

  return { ...q };
}

/**
 * Generates questions tailored for each specific learning and practice mode
 */
export function generateQuizQuestions(
  mode: QuizMode,
  selectedTopic?: MongoTopic,
  mockExamId?: string,
  limitCount: number = 10
): Question[] {
  const all = getAllQuestions();
  const progress = loadProgress();

  if (mode === 'topic-practice' && selectedTopic) {
    const topicQuestions = all.filter(q => q.topic === selectedTopic);
    return shuffleArray(topicQuestions).slice(0, 15).map(prepareQuestionForSession);
  }

  if (mode === 'mock-test') {
    const preset = MOCK_EXAM_PRESETS.find(p => p.id === mockExamId) || MOCK_EXAM_PRESETS[8]; // Full mock default
    const matchingTopics = preset.topics;

    let pool = all.filter(q => matchingTopics.includes(q.topic));
    if (pool.length < preset.questionCount) {
      pool = all;
    }

    // Difficulty progression: Easy -> Medium -> Hard -> Expert
    const easy = shuffleArray(pool.filter(q => q.difficulty === 'Easy'));
    const medium = shuffleArray(pool.filter(q => q.difficulty === 'Medium'));
    const hard = shuffleArray(pool.filter(q => q.difficulty === 'Hard'));
    const expert = shuffleArray(pool.filter(q => q.difficulty === 'Expert'));

    const mockSet: Question[] = [
      ...easy.slice(0, Math.ceil(preset.questionCount * 0.2)),
      ...medium.slice(0, Math.ceil(preset.questionCount * 0.4)),
      ...hard.slice(0, Math.ceil(preset.questionCount * 0.25)),
      ...expert.slice(0, Math.ceil(preset.questionCount * 0.15))
    ];

    if (mockSet.length < preset.questionCount) {
      const remaining = pool.filter(q => !mockSet.some(m => m.id === q.id));
      mockSet.push(...shuffleArray(remaining).slice(0, preset.questionCount - mockSet.length));
    }

    return mockSet.slice(0, preset.questionCount).map(prepareQuestionForSession);
  }

  if (mode === 'challenge') {
    // Difficult practical questions (Hard and Expert only)
    const challengePool = all.filter(q => q.difficulty === 'Hard' || q.difficulty === 'Expert');
    return shuffleArray(challengePool.length > 0 ? challengePool : all).slice(0, 10).map(prepareQuestionForSession);
  }

  if (mode === 'weak-areas') {
    // Automatically target topics where accuracy is under 60%
    const weakTopics = Object.entries(progress.topicStats)
      .filter(([_, stats]) => stats.attempted > 0 && (stats.correct / stats.attempted) < 0.6)
      .map(([topic]) => topic as MongoTopic);

    let weakPool = all.filter(q => weakTopics.includes(q.topic));
    if (weakPool.length < 5) {
      // If not enough weak topics identified, take from less practiced topics
      const leastPracticed = Object.entries(progress.topicStats)
        .sort((a, b) => a[1].attempted - b[1].attempted)
        .slice(0, 3)
        .map(([topic]) => topic as MongoTopic);
      weakPool = all.filter(q => leastPracticed.includes(q.topic));
    }

    return shuffleArray(weakPool.length > 0 ? weakPool : all).slice(0, 10).map(prepareQuestionForSession);
  }

  if (mode === 'revision') {
    // Spaced repetition queue
    const today = new Date().toISOString().split('T')[0];
    const dueQuestionIds = Object.values(progress.spacedRepetition)
      .filter(sr => sr.nextReviewDate <= today || sr.consecutiveCorrect === 0)
      .map(sr => sr.questionId);

    const revisionPool = all.filter(q => dueQuestionIds.includes(q.id) || progress.bookmarkedQuestionIds.includes(q.id));
    return shuffleArray(revisionPool.length > 0 ? revisionPool : all).slice(0, 10).map(prepareQuestionForSession);
  }

  if (mode === 'mastery') {
    // Real-world project scenarios (Level 9) & multi-stage architectures
    const masteryPool = all.filter(q => q.level >= 8 || q.difficulty === 'Expert' || q.datasetName);
    return shuffleArray(masteryPool.length > 0 ? masteryPool : all).slice(0, 12).map(prepareQuestionForSession);
  }

  // Standard Quiz, Practice Mode, Random
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, limitCount).map(prepareQuestionForSession);
}

/**
 * Creates a new quiz or mock exam session
 */
export function createSession(
  mode: QuizMode,
  selectedTopic?: MongoTopic,
  mockExamId?: string,
  questionCount: number = 10
): QuizSession {
  const questions = generateQuizQuestions(mode, selectedTopic, mockExamId, questionCount);

  let duration: number | undefined;

  if (mode === 'mock-test' && mockExamId) {
    const preset = MOCK_EXAM_PRESETS.find(p => p.id === mockExamId);
    duration = (preset ? preset.durationMinutes : 20) * 60;
  } else if (mode === 'quiz' || mode === 'challenge') {
    duration = questions.length * 75; // 75s per question
  } else if (mode === 'mastery') {
    duration = questions.length * 90; // 90s per practical mastery question
  }

  return {
    id: 'session_' + Date.now(),
    mode,
    mockExamId,
    selectedTopic,
    totalQuestions: questions.length,
    timeRemainingSeconds: duration,
    totalDurationSeconds: duration,
    currentIndex: 0,
    questions,
    attempts: {},
    flaggedQuestionIds: [],
    completed: false,
    startTime: Date.now()
  };
}
