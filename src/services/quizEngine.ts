import { DEFAULT_QUESTIONS } from '../data/questions';
import { MongoTopic, Question, QuizMode, QuizSession } from '../types';
import { loadCustomQuestions } from './storage';

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
 * Fetches all available questions (built-in + teacher custom questions)
 */
export function getAllQuestions(): Question[] {
  const custom = loadCustomQuestions();
  return [...DEFAULT_QUESTIONS, ...custom];
}

/**
 * Anti-memorization: creates question variations with shuffled options for MCQs/Scenarios/Errors
 */
export function prepareQuestionForSession(q: Question): Question {
  // If multiple-choice / scenario / predict / find-error, randomize the option order
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
 * Generates questions for different quiz modes
 */
export function generateQuizQuestions(
  mode: QuizMode,
  selectedTopic?: MongoTopic,
  limitCount: number = 10
): Question[] {
  const all = getAllQuestions();

  if (mode === 'topic-practice' && selectedTopic) {
    const topicQuestions = all.filter(q => q.topic === selectedTopic);
    return shuffleArray(topicQuestions).map(prepareQuestionForSession);
  }

  if (mode === 'mock-test') {
    // NIIT-Style Practical Assessment:
    // Difficulty progression: Easy -> Medium -> Hard -> Expert
    const easy = shuffleArray(all.filter(q => q.difficulty === 'Easy'));
    const medium = shuffleArray(all.filter(q => q.difficulty === 'Medium'));
    const hard = shuffleArray(all.filter(q => q.difficulty === 'Hard'));
    const expert = shuffleArray(all.filter(q => q.difficulty === 'Expert'));

    const mockSet: Question[] = [
      ...easy.slice(0, 3),
      ...medium.slice(0, 5),
      ...hard.slice(0, 4),
      ...expert.slice(0, 3)
    ];

    // Fallback if not enough in specific tiers
    if (mockSet.length < 15) {
      const remaining = all.filter(q => !mockSet.some(m => m.id === q.id));
      mockSet.push(...shuffleArray(remaining).slice(0, 15 - mockSet.length));
    }

    return mockSet.map(prepareQuestionForSession);
  }

  // Standard Quiz or Practice Mode: random selection
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, limitCount).map(prepareQuestionForSession);
}

/**
 * Creates a new quiz session
 */
export function createSession(
  mode: QuizMode,
  selectedTopic?: MongoTopic,
  questionCount: number = 10
): QuizSession {
  const questions = generateQuizQuestions(mode, selectedTopic, questionCount);

  // Time durations:
  // Practice mode: unlimited (undefined)
  // Standard quiz: 60 seconds per question
  // Mock test: 20 minutes (1200 seconds)
  let duration: number | undefined;
  if (mode === 'quiz') {
    duration = questions.length * 75; // 75s per question
  } else if (mode === 'mock-test') {
    duration = 1200; // 20 mins for full mock test
  }

  return {
    id: 'session_' + Date.now(),
    mode,
    selectedTopic,
    totalQuestions: questions.length,
    timeRemainingSeconds: duration,
    totalDurationSeconds: duration,
    currentIndex: 0,
    questions,
    attempts: {},
    completed: false,
    startTime: Date.now()
  };
}
