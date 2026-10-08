import { StudentProgress, UserConfig, Question } from '../types';

const PROGRESS_KEY = 'mongo_quiz_student_progress';
const CONFIG_KEY = 'mongo_quiz_user_config';
const FEEDBACK_KEY = 'mongo_quiz_feedback_logs';
const CUSTOM_QUESTIONS_KEY = 'mongo_quiz_custom_questions';

import { computeProgressDigest } from './security';

export function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed: StudentProgress = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse progress', e);
  }

  // fallback empty struct
  return {
    learnerId: {
      pseudonym: 'Anonymous',
      fingerprintHash: 'unregistered',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    },
    completedTopicIds: [],
    questionsAttempted: 0,
    questionsCorrect: 0,
    totalScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0]
  };
}

export function saveProgress(p: StudentProgress): void {
  try {
    p.checksum = computeProgressDigest(p);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}

export function loadUserConfig(): UserConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse config', e);
  }
  return { soundEnabled: true };
}

export function saveUserConfig(c: UserConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function hasMasteredLevel(level: number, progress: StudentProgress): boolean {
  if (level === 1) return true;
  
  // E.g. to access level N, you must have answered at least (N-1)*10 questions correctly
  const requiredScore = (level - 1) * 10;
  const isMastered = progress.questionsCorrect >= requiredScore;
  return isMastered;
}

export async function loadCustomQuestions(): Promise<Question[]> {
  try {
    const res = await fetch('/api/questions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.error("Failed to load custom questions", err);
    return [];
  }
}

export async function saveCustomQuestions(questions: Question[]): Promise<void> {
  try {
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions)
    });
  } catch (err) {
    console.error("Failed to save custom questions", err);
  }
}

export const ALL_TOPICS = [
  'All',
  'CRUD Operations',
  'Aggregation Pipeline',
  'Indexing & Performance',
  'Data Modeling',
  'Security & Roles',
  'Transactions'
] as const;
