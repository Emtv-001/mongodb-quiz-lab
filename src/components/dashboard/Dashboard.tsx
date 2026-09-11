import React from 'react';
import { StudentProgress, MongoTopic, QuizMode } from '../../types';
import { BRANDING } from '../../config/branding';
import {
  Flame,
  Award,
  Target,
  CheckCircle,
  BarChart3,
  GraduationCap,
  PlayCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Database
} from 'lucide-react';

interface DashboardProps {
  progress: StudentProgress;
  onStartQuiz: (mode: QuizMode, topic?: MongoTopic) => void;
  onNavigateTab: (tab: any) => void;
  onOpenSeedData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  onStartQuiz,
  onNavigateTab,
  onOpenSeedData
}) => {
  const accuracy =
    progress.questionsAttempted > 0
      ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
      : 0;

  const averageScore =
    progress.totalMaxScore > 0
      ? Math.round((progress.totalScore / progress.totalMaxScore) * 100)
      : 0;

  // Topics classification: Mastered (>= 75%), Learning (40%-74%), Weak (< 40% with attempts)
  const topicsList = Object.entries(progress.topicStats) as [
    MongoTopic,
    { attempted: number; correct: number; totalPoints: number; earnedPoints: number }
  ][];

  const topicsWithAccuracy = topicsList.map(([topic, stat]) => {
    const acc = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
    return { topic, ...stat, accuracy: acc };
  });

  const masteredTopics = topicsWithAccuracy.filter((t) => t.attempted >= 2 && t.accuracy >= 75);
  const weakTopics = topicsWithAccuracy.filter((t) => t.attempted >= 1 && t.accuracy < 50);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {BRANDING.name} Testing Suite
            </span>
            <span className="text-xs text-slate-400 font-mono">v{BRANDING.version}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to {BRANDING.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {BRANDING.tagline}. Test your practical MongoDB skills, array updates, dot notation, upserts, and aggregation pipelines with immediate feedback and partial credit grading.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onStartQuiz('mock-test')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Start Mock Test (NIIT Style)</span>
            </button>

            <button
              onClick={() => onStartQuiz('practice')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Practice Mode</span>
            </button>

            <button
              onClick={() => onNavigateTab('flashcards')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Study Flashcards</span>
            </button>

            <button
              onClick={onOpenSeedData}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inspect GptData02</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Questions Attempted */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Questions Attempted</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {progress.questionsAttempted}
          </div>
          <div className="text-[11px] text-slate-400">
            {progress.questionsCorrect} full marks, {progress.questionsPartial} partial
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Overall Accuracy</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {accuracy}%
          </div>
          <div className="text-[11px] text-slate-400">
            Average Score: {averageScore}%
          </div>
        </div>

        {/* Best Mock Test Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Best Mock Score</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
            {progress.bestMockScore > 0 ? `${progress.bestMockScore}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400">
            NIIT-style 20-min practical
          </div>
        </div>

        {/* Active Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {progress.currentStreak} Days
          </div>
          <div className="text-[11px] text-slate-400">
            Active daily study habit
          </div>
        </div>
      </div>

      {/* Weak Topics & Mastered Topics Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mastered Topics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Topics Mastered ({masteredTopics.length})</span>
          </div>

          {masteredTopics.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">
              No topics mastered yet. Complete quizzes with ≥ 75% accuracy to unlock mastery!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {masteredTopics.map((t) => (
                <span
                  key={t.topic}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  ✓ {t.topic} ({t.accuracy}%)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics to Focus On */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Focus Areas / Weak Topics ({weakTopics.length})</span>
          </div>

          {weakTopics.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">
              Great job! You have no weak topics identified under 50% accuracy.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => onStartQuiz('topic-practice', t.topic)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors flex items-center space-x-1"
                  title="Click to practice this weak topic"
                >
                  <span>{t.topic} ({t.accuracy}%)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Topic Mastery Progress Chart (ASCII / Bar Style matching prompt specification) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Topic Mastery Progress
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Based on student attempts
          </span>
        </div>

        <div className="space-y-3">
          {topicsWithAccuracy.map((item) => {
            // Calculate ASCII bar style like: ████████░░ 80%
            const filledBlocks = Math.round(item.accuracy / 10);
            const emptyBlocks = 10 - filledBlocks;
            const asciiBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

            return (
              <div
                key={item.topic}
                onClick={() => onStartQuiz('topic-practice', item.topic)}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/40 rounded-xl border border-slate-800 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {item.topic}
                    </span>
                    <span className="font-mono text-slate-400">
                      {item.attempted} attempts ({item.correct} correct)
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.accuracy >= 75
                          ? 'bg-emerald-400'
                          : item.accuracy >= 50
                          ? 'bg-blue-400'
                          : item.attempted > 0
                          ? 'bg-amber-400'
                          : 'bg-slate-800'
                      }`}
                      style={{ width: `${Math.max(item.accuracy, item.attempted > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>

                {/* ASCII Bar & Percentage Indicator */}
                <div className="flex items-center space-x-3 sm:pl-4 self-end sm:self-center">
                  <span className="font-mono text-xs text-emerald-400 tracking-tight hidden md:inline">
                    {asciiBar}
                  </span>
                  <span className="font-mono text-xs font-bold text-white min-w-[40px] text-right">
                    {item.accuracy}%
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 transition-colors">
                    Practice
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Test History */}
      {progress.completedSessions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Recent Assessment History</h3>
          <div className="space-y-2">
            {progress.completedSessions.slice(0, 5).map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 font-bold uppercase text-[10px] text-slate-300 border border-slate-700">
                    {s.mode}
                  </span>
                  <span className="text-slate-200 font-medium">
                    {s.topic ? `${s.topic} Practice` : 'Comprehensive Assessment'}
                  </span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    {s.date}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-300">
                    {s.score}/{s.maxScore} pts
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      s.percentage >= 70
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
