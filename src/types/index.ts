export type QuestionType =
  | 'multiple-choice'     // Type A
  | 'predict-output'      // Type B
  | 'find-error'          // Type C
  | 'write-command'       // Type D
  | 'match-operator'      // Type E
  | 'scenario'            // Type F
  | 'arrange-command'     // Type G
  | 'multiple-select'     // Type H
  | 'true-false'          // Type I
  | 'fix-query';          // Type J

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type CurriculumLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type MongoTopic =
  | 'MongoDB Fundamentals'
  | 'Connections & Tools'
  | 'CRUD Operations'
  | 'Basic & Advanced Querying'
  | 'Comparison & Logical Operators'
  | 'Regular Expressions'
  | 'Arrays & Indexing'
  | 'Nested Documents & Dot Notation'
  | 'Update Operators & Modifiers'
  | 'Data Modeling & Schema Design'
  | 'Schema Validation'
  | 'Aggregation Pipelines'
  | 'JavaScript & mongosh Scripts'
  | 'Indexes & ESR Rule'
  | 'Performance & explain()'
  | 'Replication & High Availability'
  | 'Transactions & Consistency'
  | 'Backup & Restore'
  | 'Security & RBAC'
  | 'MongoDB Atlas & Advanced Features';

export interface MatchPair {
  id: string;
  operator: string;
  definition: string;
}

export interface ArrangeBlock {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  topic: MongoTopic;
  subtopic?: string;
  level: CurriculumLevel;
  difficulty: DifficultyLevel;
  type: QuestionType;
  title: string;
  scenario?: string;               // Given context or background
  datasetName?: string;            // 'GptData02' | 'hospital' | 'banking' | 'ecommerce' | 'inventory' | 'library' | 'hotel' | 'social'
  codeSnippet?: string;            // Faulty command or code to fix/predict
  sampleDocument?: Record<string, any>; // Document preview
  options?: string[];              // For Type A, B, C, F, H, I
  correctOptionIndex?: number;     // Index of correct option (0-based)
  correctOptionIndices?: number[]; // For multiple-select (Type H)
  expectedCommand?: string;        // For Type D (Write the Command)
  acceptableAlternatives?: string[]; // Valid alternative commands for Type D
  matchPairs?: MatchPair[];        // For Type E (Match the Operator)
  arrangeBlocks?: ArrangeBlock[];  // For Type G (Arrange the Command)
  correctArrangeOrder?: string[];  // Array of block IDs in correct sequence
  explanation: string;             // Detailed educational explanation
  misconception?: string;          // Common misconception or mistake
  conceptFocus: string;            // Short highlight of key MongoDB rule
  tags?: string[];
  points: number;                  // Maximum marks (5 - 10)
}

export interface PartialCreditBreakdown {
  awardedPoints: number;
  maxPoints: number;
  matchedCriteria: string[];
  missedCriteria: string[];
  feedbackNotes: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  maxScore: number;
  studentAnswer: any;
  correctAnswer: any;
  feedback: string;
  concept: string;
  misconception?: string;
  breakdown?: PartialCreditBreakdown;
  correctedCommand?: string;
}

export interface QuestionAttempt {
  questionId: string;
  firstAttemptScore: number;       // Immutable recorded score for assessments (First-Attempt Rule)
  currentScore: number;            // For practice retries
  attemptsCount: number;
  studentAnswer: any;
  result: EvaluationResult;
  timestamp: number;
  flaggedForReview?: boolean;
}

export type QuizMode =
  | 'learn'
  | 'practice'
  | 'quiz'
  | 'mock-test'
  | 'challenge'
  | 'weak-areas'
  | 'revision'
  | 'random'
  | 'mastery'
  | 'topic-practice';

export interface MockExamPreset {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  questionCount: number;
  durationMinutes: number;
  topics: MongoTopic[];
  targetLevel?: CurriculumLevel;
  iconName?: string;
}

export interface QuizSession {
  id: string;
  mode: QuizMode;
  mockExamId?: string;
  selectedTopic?: MongoTopic;
  totalQuestions: number;
  timeRemainingSeconds?: number;
  totalDurationSeconds?: number;
  currentIndex: number;
  questions: Question[];
  attempts: Record<string, QuestionAttempt>;
  flaggedQuestionIds: string[];
  completed: boolean;
  startTime: number;
  endTime?: number;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  questionsAttempted: number;
  questionsCorrect: number;
  earnedPoints: number;
}

export interface LearnerIdentity {
  pseudonym: string;          // e.g. "MongoLearner-a8b2"
  fingerprintHash: string;     // SHA-256 hash
  createdAt: string;
  lastActive: string;
}

export interface SpacedRepetitionItem {
  questionId: string;
  intervalDays: number;
  easeFactor: number;
  consecutiveCorrect: number;
  lastReviewedDate: string;
  nextReviewDate: string;
}

export interface StudentProgress {
  learnerId: LearnerIdentity;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsPartial: number;
  totalScore: number;
  totalMaxScore: number;
  bestMockScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  activityHistory: Record<string, DailyActivityRecord>; // date string -> record
  topicStats: Record<MongoTopic, { attempted: number; correct: number; totalPoints: number; earnedPoints: number }>;
  completedSessions: {
    sessionId: string;
    mode: QuizMode;
    mockExamTitle?: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
    topic?: MongoTopic;
  }[];
  bookmarkedQuestionIds: string[];
  masteredFlashcardIds: string[];
  spacedRepetition: Record<string, SpacedRepetitionItem>;
  checksum?: string; // Integrity signature to prevent browser DevTools tampering
}

export interface Flashcard {
  id: string;
  topic: MongoTopic;
  level: CurriculumLevel;
  difficulty: DifficultyLevel;
  front: string;
  back: string;
  syntax?: string;
  example?: string;
  note?: string;
}

export interface StudyNoteSection {
  id: string;
  topic: MongoTopic;
  level: CurriculumLevel;
  title: string;
  summary: string;
  keyOperators: {
    name: string;
    description: string;
    example: string;
  }[];
  importantRules: string[];
  commonMistakes: string[];
  realWorldScenario?: string;
}

// Student document from GptData02
export interface StudentDocument {
  _id: number;
  Name: string;
  DOB: string;
  Phone: string;
  Age: number;
  Course: string;
  Courses: string[];
  Skills: string[];
  MonthOfAdmission: string;
  Address: {
    Country: string;
    State: string;
    City: string;
    HouseNumber: number;
  };
  GPA: number;
  Marks: number;
  Section: string;
  Active: boolean;
  Misc: number[];
}

export type LearnerTier = string;

export interface RegisteredLearnerAccount {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  recoveryPhrase: string; // Auto-generated e.g. "REC-4829-1940-7763"
  createdAt: string;
  verified: boolean;
  coins: number;          // MongoCoins (🪙)
  xp: number;             // Total Earned Experience Points
  tier: LearnerTier;
  rankNumber: number;
  unlockedBadges: string[];
}

export interface LearnerAchievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'Milestone' | 'Mastery' | 'Streak' | 'Excellence';
  coinReward: number;
  xpReward: number;
  requirementText: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  username: string;
  tier: LearnerTier;
  xp: number;
  coins: number;
  streak: number;
  accuracy: number;
  isCurrentUser?: boolean;
}

export interface LearnerOtpSession {
  email: string;
  username: string;
  displayName: string;
  passwordPlain: string;
  otpCode: string;
  recoveryPhrase: string;
  expiresAt: number;
  requestedAt?: number;
}

export interface FeedbackEntry {
  id: string;
  type: 'complaint' | 'suggestion';
  message: string;
  senderFingerprint: string;
  senderPseudonym: string;
  createdAt: string;
}
