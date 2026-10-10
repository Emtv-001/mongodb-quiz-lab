import { DEFAULT_QUESTIONS } from '../data/questions';
import { MOCK_EXAM_PRESETS } from '../data/mockExams';
import { MongoTopic, Question, QuizMode, QuizSession, DifficultyLevel, CurriculumLevel } from '../types';
import { loadCustomQuestions, loadProgress } from './storage';
import { generateAiDynamicQuestions } from './aiQuestionGenerator';

export interface QuizSetupOptions {
  mode: QuizMode;
  selectedTopic?: MongoTopic;
  mockExamId?: string;
  questionCount?: number;
  difficulty?: DifficultyLevel | 'All';
  level?: CurriculumLevel | 'All';
  useAiGeneration?: boolean;
}

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
export async function getAllQuestions(): Promise<Question[]> {
  const custom = await loadCustomQuestions();
  return [...DEFAULT_QUESTIONS, ...custom];
}

/**
 * Anti-memorization: creates question variations with shuffled options
 */
export function prepareQuestionForSession(q: Question): Question {
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

  if (q.matchPairs && q.matchPairs.length > 0) {
    return {
      ...q,
      matchPairs: shuffleArray(q.matchPairs)
    };
  }

  if (q.arrangeBlocks && q.arrangeBlocks.length > 0) {
    return {
      ...q,
      arrangeBlocks: shuffleArray(q.arrangeBlocks)
    };
  }

  return { ...q };
}

/**
 * Generates questions tailored for user-customized count, hardness, topic, and AI mode
 */
export async function generateQuizQuestions(options: QuizSetupOptions): Promise<Question[]> {
  const {
    mode,
    selectedTopic,
    mockExamId,
    questionCount = 10,
    difficulty = 'All',
    level = 'All',
    useAiGeneration = false
  } = options;

  let all = await getAllQuestions();
  const progress = loadProgress();

  // If user requested dynamic AI dynamic generation
  if (useAiGeneration) {
    try {
      const aiQuestions = await generateAiDynamicQuestions({
        topic: selectedTopic,
        level: level === 'All' ? 3 : (level as CurriculumLevel),
        difficulty: difficulty === 'All' ? 'Medium' : (difficulty as DifficultyLevel),
        count: questionCount
      });
      if (aiQuestions && aiQuestions.length > 0) {
        return aiQuestions.map(prepareQuestionForSession);
      }
    } catch (err: any) {
        console.warn('AI generation failed or skipped. Falling back to default questions.', err);
        const errMsg = err.message || "Unknown error";
        
        // Log to Admin Audit Trail silently
        fetch('/api/admin/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            adminUsername: "SYSTEM",
            action: "AI_ERROR",
            category: "Error",
            details: "AI Generation Error: " + errMsg
          })
        }).catch(() => {});
      }
  }

  // Filter by topic if specified
  if (selectedTopic) {
    all = all.filter(q => q.topic === selectedTopic);
  }

  // Filter by difficulty if specified
  if (difficulty && difficulty !== 'All') {
    all = all.filter(q => q.difficulty === difficulty);
  }

  // Filter by level if specified
  if (level && level !== 'All') {
    all = all.filter(q => q.level === level);
  }

  if (mode === 'topic-practice' && selectedTopic) {
    return shuffleArray(all).slice(0, questionCount).map(prepareQuestionForSession);
  }

  if (mode === 'mock-test') {
    const preset = MOCK_EXAM_PRESETS.find(p => p.id === mockExamId) || MOCK_EXAM_PRESETS[8];
    const matchingTopics = preset.topics;

    let pool = all.filter(q => matchingTopics.includes(q.topic));
    if (pool.length === 0) pool = all; // Only fallback if totally empty

    const targetCount = questionCount || preset.questionCount;
    const easy = shuffleArray(pool.filter(q => q.difficulty === 'Easy'));
    const medium = shuffleArray(pool.filter(q => q.difficulty === 'Medium'));
    const hard = shuffleArray(pool.filter(q => q.difficulty === 'Hard'));
    const expert = shuffleArray(pool.filter(q => q.difficulty === 'Expert'));

    const mockSet: Question[] = [
      ...easy.slice(0, Math.ceil(targetCount * 0.2)),
      ...medium.slice(0, Math.ceil(targetCount * 0.4)),
      ...hard.slice(0, Math.ceil(targetCount * 0.25)),
      ...expert.slice(0, Math.ceil(targetCount * 0.15))
    ];

    if (mockSet.length < targetCount) {
      const remaining = pool.filter(q => !mockSet.some(m => m.id === q.id));
      mockSet.push(...shuffleArray(remaining).slice(0, targetCount - mockSet.length));
    }

    return mockSet.slice(0, targetCount).map(prepareQuestionForSession);
  }

  if (mode === 'challenge') {
    const challengePool = all.filter(q => q.difficulty === 'Hard' || q.difficulty === 'Expert');
    return shuffleArray(challengePool.length > 0 ? challengePool : all).slice(0, questionCount).map(prepareQuestionForSession);
  }

  if (mode === 'weak-areas') {
    const weakTopics = Object.entries(progress.topicStats)
      .filter(([_, stats]) => stats.attempted > 0 && (stats.correct / stats.attempted) < 0.6)
      .map(([topic]) => topic as MongoTopic);

    let weakPool = all.filter(q => weakTopics.includes(q.topic));
    if (weakPool.length < 5) {
      const leastPracticed = Object.entries(progress.topicStats)
        .sort((a, b) => a[1].attempted - b[1].attempted)
        .slice(0, 3)
        .map(([topic]) => topic as MongoTopic);
      weakPool = all.filter(q => leastPracticed.includes(q.topic));
    }

    return shuffleArray(weakPool.length > 0 ? weakPool : all).slice(0, questionCount).map(prepareQuestionForSession);
  }

  if (mode === 'revision') {
    const today = new Date().toISOString().split('T')[0];
    const dueQuestionIds = Object.values(progress.spacedRepetition)
      .filter(sr => sr.nextReviewDate <= today || sr.consecutiveCorrect === 0)
      .map(sr => sr.questionId);

    const revisionPool = all.filter(q => dueQuestionIds.includes(q.id) || progress.bookmarkedQuestionIds.includes(q.id));
    return shuffleArray(revisionPool.length > 0 ? revisionPool : all).slice(0, questionCount).map(prepareQuestionForSession);
  }

  if (mode === 'mastery') {
    const masteryPool = all.filter(q => q.level >= 8 || q.difficulty === 'Expert' || q.datasetName);
    return shuffleArray(masteryPool.length > 0 ? masteryPool : all).slice(0, questionCount).map(prepareQuestionForSession);
  }

  // Standard Quiz, Practice Mode, Random
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, questionCount).map(prepareQuestionForSession);
}

/**
 * Creates a new quiz or mock exam session with customized setup
 */
export async function createSession(options: QuizSetupOptions): Promise<QuizSession> {
  const questions = await generateQuizQuestions(options);

  let duration: number | undefined;

  if (options.mode === 'mock-test' && options.mockExamId) {
    const preset = MOCK_EXAM_PRESETS.find(p => p.id === options.mockExamId);
    duration = (preset ? preset.durationMinutes : 20) * 60;
  } else if (options.mode === 'quiz' || options.mode === 'challenge') {
    duration = questions.length * 75; // 75s per question
  } else if (options.mode === 'mastery') {
    duration = questions.length * 90;
  }

  return {
    id: 'session_' + Date.now(),
    mode: options.mode,
    mockExamId: options.mockExamId,
    selectedTopic: options.selectedTopic,
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
