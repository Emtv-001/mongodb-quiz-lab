export type QuestionType =
  | 'multiple-choice'     // Type A
  | 'predict-output'      // Type B
  | 'find-error'          // Type C
  | 'write-command'       // Type D
  | 'match-operator'      // Type E
  | 'scenario'            // Type F
  | 'arrange-command';    // Type G

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type MongoTopic =
  | 'Basic Queries'
  | 'Comparison Operators'
  | 'Logical Operators'
  | 'Regular Expressions'
  | 'Arrays'
  | 'Nested Documents'
  | 'Update Operators'
  | 'Array Updates'
  | '$addToSet vs $push'
  | 'Removing Array Elements'
  | 'Upsert & $setOnInsert'
  | 'Aggregation';

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
  difficulty: DifficultyLevel;
  type: QuestionType;
  title: string;
  scenario?: string;               // Given context or background
  codeSnippet?: string;            // Relevant code or faulty command
  sampleDocument?: Record<string, any>; // For predict-output or reference
  options?: string[];              // For Type A, B, C, F
  correctOptionIndex?: number;     // Index of correct option (0-based)
  expectedCommand?: string;        // For Type D (Write the Command)
  acceptableAlternatives?: string[]; // Valid alternative commands for Type D
  matchPairs?: MatchPair[];        // For Type E (Match the Operator)
  arrangeBlocks?: ArrangeBlock[];  // For Type G (Arrange the Command)
  correctArrangeOrder?: string[];  // Array of block IDs in correct sequence
  explanation: string;             // Detailed educational explanation
  conceptFocus: string;            // Short highlight of key MongoDB rule
  points: number;                  // Maximum marks (default 10 for practical, 5-10 for others)
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
}

export type QuizMode = 'practice' | 'quiz' | 'mock-test' | 'topic-practice';

export interface QuizSession {
  id: string;
  mode: QuizMode;
  selectedTopic?: MongoTopic;
  totalQuestions: number;
  timeRemainingSeconds?: number;
  totalDurationSeconds?: number;
  currentIndex: number;
  questions: Question[];
  attempts: Record<string, QuestionAttempt>;
  completed: boolean;
  startTime: number;
  endTime?: number;
}

export interface StudentProgress {
  questionsAttempted: number;
  questionsCorrect: number;
  questionsPartial: number;
  totalScore: number;
  totalMaxScore: number;
  bestMockScore: number;
  currentStreak: number;
  lastActiveDate: string;
  topicStats: Record<MongoTopic, { attempted: number; correct: number; totalPoints: number; earnedPoints: number }>;
  completedSessions: {
    sessionId: string;
    mode: QuizMode;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
    topic?: MongoTopic;
  }[];
  bookmarkedQuestionIds: string[];
  masteredFlashcardIds: string[];
}

export interface Flashcard {
  id: string;
  topic: MongoTopic;
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
  title: string;
  summary: string;
  keyOperators: {
    name: string;
    description: string;
    example: string;
  }[];
  importantRules: string[];
  commonMistakes: string[];
}

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
