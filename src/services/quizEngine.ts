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

  // Preserve full question pool before filtering as fallback
  const masterPool = [...all];

  // Filter by topic if specified
  if (selectedTopic) {
    const topicFiltered = all.filter(q => q.topic === selectedTopic);
    if (topicFiltered.length > 0) {
      all = topicFiltered;
    }
  }

  // Filter by difficulty if specified
  if (difficulty && difficulty !== 'All') {
    const diffFiltered = all.filter(q => q.difficulty === difficulty);
    if (diffFiltered.length > 0) {
      all = diffFiltered;
    }
  }

  // Filter by level if specified
  if (level && level !== 'All') {
    const levelFiltered = all.filter(q => q.level === level);
    if (levelFiltered.length > 0) {
      all = levelFiltered;
    }
  }

  // Final fallback: if somehow all is empty, restore masterPool or DEFAULT_QUESTIONS
  if (all.length === 0) {
    all = masterPool.length > 0 ? masterPool : [...DEFAULT_QUESTIONS];
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
 * Creates a new quiz or mock exam session with customized setup.
 * For AI-assisted quizzes, generates an initial seed batch (3 questions) so the learner
 * begins in ~2s while the rest are synthesized seamlessly in the background.
 */
export async function createSession(options: QuizSetupOptions): Promise<QuizSession> {
  const {
    questionCount = 10,
    useAiGeneration = false
  } = options;

  // Progressive loading: If AI generation is requested and count > 3, generate initial 3 questions first
  const isProgressiveAi = Boolean(useAiGeneration && questionCount > 3);
  const initialFetchCount = isProgressiveAi ? 3 : questionCount;

  const questions = await generateQuizQuestions({
    ...options,
    questionCount: initialFetchCount
  });

  // Check if AI generation succeeded (AI questions have 'ai_' prefix or 'ai-generated' tag)
  const isAiSucceeded = questions.length > 0 && Boolean(questions[0]?.tags?.includes('ai-generated') || questions[0]?.id?.startsWith('ai_'));

  let effectiveTotal = questions.length;
  let isGeneratingInBackground = false;

  if (isProgressiveAi && isAiSucceeded) {
    effectiveTotal = questionCount;
    isGeneratingInBackground = questions.length < questionCount;
  } else if (isProgressiveAi && !isAiSucceeded) {
    // If AI failed during seed batch, fill remaining from static questions immediately
    const remainingCount = questionCount - questions.length;
    if (remainingCount > 0) {
      const extraQuestions = await generateQuizQuestions({
        ...options,
        useAiGeneration: false,
        questionCount: questionCount
      });
      questions.splice(0, questions.length, ...extraQuestions);
      effectiveTotal = questions.length;
    }
  }

  // Absolute safety guarantee: ensure questions array is NEVER empty
  if (questions.length === 0) {
    const fallbackDefaults = shuffleArray([...DEFAULT_QUESTIONS]).slice(0, questionCount);
    questions.push(...fallbackDefaults.map(prepareQuestionForSession));
    effectiveTotal = questions.length;
  }

  let duration: number | undefined;

  if (options.mode === 'mock-test' && options.mockExamId) {
    const preset = MOCK_EXAM_PRESETS.find(p => p.id === options.mockExamId);
    duration = (preset ? preset.durationMinutes : 20) * 60;
  } else if (options.mode === 'quiz' || options.mode === 'challenge') {
    duration = effectiveTotal * 75; // 75s per question
  } else if (options.mode === 'mastery') {
    duration = effectiveTotal * 90;
  }

  return {
    id: 'session_' + Date.now(),
    mode: options.mode,
    mockExamId: options.mockExamId,
    selectedTopic: options.selectedTopic,
    totalQuestions: effectiveTotal,
    targetQuestionCount: effectiveTotal,
    isAiGeneratingInBackground: isGeneratingInBackground,
    aiGenerationOptions: isGeneratingInBackground ? { ...options } : undefined,
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

/**
 * Asynchronously replenishes a batch of AI questions in the background.
 * Falls back safely to default database questions if Gemini encounters rate limits or errors.
 */
export async function replenishAiQuestionsBatch(
  options: QuizSetupOptions,
  existingQuestions: Question[],
  batchSize: number = 3
): Promise<Question[]> {
  const existingTitles = existingQuestions.map(q => q.title);
  const existingIds = new Set(existingQuestions.map(q => q.id));

  try {
    const newAiQuestions = await generateAiDynamicQuestions({
      topic: options.selectedTopic,
      level: options.level === 'All' ? 3 : (options.level as CurriculumLevel),
      difficulty: options.difficulty === 'All' ? 'Medium' : (options.difficulty as DifficultyLevel),
      count: batchSize,
      existingQuestionsToAvoid: existingTitles
    });

    if (newAiQuestions && newAiQuestions.length > 0) {
      const prepared = newAiQuestions.map(prepareQuestionForSession);
      const unique = prepared.filter(q => !existingIds.has(q.id) && !existingTitles.includes(q.title));
      if (unique.length > 0) {
        return unique;
      }
    }
  } catch (err) {
    console.warn("Background AI replenishment failed, using curated fallback questions:", err);
  }

  // Fallback: draw from local curated question repository to avoid leaving learner stranded
  try {
    const all = await getAllQuestions();
    let candidates = all.filter(q => !existingIds.has(q.id) && !existingTitles.includes(q.title));

    if (options.selectedTopic) {
      const topicMatches = candidates.filter(q => q.topic === options.selectedTopic);
      if (topicMatches.length > 0) candidates = topicMatches;
    }
    if (options.difficulty && options.difficulty !== 'All') {
      const diffMatches = candidates.filter(q => q.difficulty === options.difficulty);
      if (diffMatches.length > 0) candidates = diffMatches;
    }

    return shuffleArray(candidates).slice(0, batchSize).map(prepareQuestionForSession);
  } catch {
    return [];
  }
}
