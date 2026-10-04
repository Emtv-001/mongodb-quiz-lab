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
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Database,
  Calendar,
  Compass,
  Zap,
  Shield,
  UserCheck
} from 'lucide-react';

interface DashboardProps {
  progress: StudentProgress;
  onStartQuiz: (mode: QuizMode, topic?: MongoTopic, mockExamId?: string) => void;
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

  // Topics classification
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

  // Overall mastery calculation across all curriculum topics
  const totalMasteryScore = topicsWithAccuracy.reduce((acc, curr) => acc + (curr.attempted >= 1 ? curr.accuracy : 0), 0);
  const overallMasteryPercent = Math.round(totalMasteryScore / (topicsWithAccuracy.length || 1));

  // Determine learner level (Level 1 to 9) based on questions and mock tests
  let currentLevel = 1;
  let levelTitle = "Level 1 — Beginner";
  if (progress.questionsAttempted >= 40 || progress.bestMockScore >= 80) {
    currentLevel = 9;
    levelTitle = "Level 9 — Master Architect";
  } else if (progress.questionsAttempted >= 30 || progress.bestMockScore >= 70) {
    currentLevel = 7;
    levelTitle = "Level 7 — Production Administrator";
  } else if (progress.questionsAttempted >= 20 || progress.bestMockScore >= 60) {
    currentLevel = 5;
    levelTitle = "Level 5 — Aggregation Specialist";
  } else if (progress.questionsAttempted >= 10) {
    currentLevel = 3;
    levelTitle = "Level 3 — CRUD Developer";
  }

  // Recommended topic to practice: lowest accuracy topic with attempts, or an unattempted topic
  const lowestAccuracyTopic = [...topicsWithAccuracy]
    .sort((a, b) => (a.attempted === 0 ? 0.5 : a.accuracy) - (b.attempted === 0 ? 0.5 : b.accuracy))[0]?.topic || "Aggregation Pipelines";

  // Last 21 calendar days activity heatmap calculation
  const calendarDays: { dateStr: string; dayLabel: string; count: number }[] = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const count = progress.activityHistory?.[dateStr]?.questionsAttempted || 0;
    calendarDays.push({ dateStr, dayLabel, count });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>{progress.learnerId?.pseudonym || 'MongoLearner-PRO'}</span>
            </span>

            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {levelTitle}
            </span>

            <span className="text-xs text-slate-400 font-mono">v{BRANDING.version}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to {BRANDING.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {BRANDING.tagline}. Progress from absolute beginner to advanced MongoDB practitioner through 9 structured levels, real-world datasets, instant code evaluation, and verified streak tracking.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => onNavigateTab('mock-exam-selector')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Mock Exam Suite (10 Exams)</span>
            </button>

            <button
              onClick={() => onStartQuiz('practice')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Practice Mode</span>
            </button>

            <button
              onClick={() => onStartQuiz('weak-areas')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Weak Areas</span>
            </button>

            <button
              onClick={() => onStartQuiz('mastery')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Level 9 Projects</span>
            </button>

            <button
              onClick={onOpenSeedData}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Explore Datasets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Questions Attempted */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Questions Solved</span>
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
            <span className="text-xs font-semibold">Accuracy & Score</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {accuracy}%
          </div>
          <div className="text-[11px] text-slate-400">
            Avg Assessment: {averageScore}%
          </div>
        </div>

        {/* Daily Calendar Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {progress.currentStreak} Days
          </div>
          <div className="text-[11px] text-slate-400">
            Longest Streak: {progress.longestStreak || progress.currentStreak} Days
          </div>
        </div>

        {/* Curriculum Mastery */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Curriculum Mastery</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
            {overallMasteryPercent}%
          </div>
          <div className="text-[11px] text-slate-400">
            Across 20 MongoDB Topics
          </div>
        </div>
      </div>

      {/* Daily Activity Calendar Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Daily Learning Activity Calendar (Last 21 Days)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Meaningful activity required for streak
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
          {calendarDays.map((cd) => {
            const hasActivity = cd.count > 0;
            const levelClass = cd.count >= 5
              ? 'bg-emerald-400 border-emerald-300'
              : cd.count >= 3
              ? 'bg-emerald-600 border-emerald-500'
              : cd.count >= 1
              ? 'bg-emerald-900 border-emerald-800'
              : 'bg-slate-950 border-slate-800';

            return (
              <div key={cd.dateStr} className="flex flex-col items-center space-y-1.5 flex-1 min-w-[28px]" title={`${cd.dateStr}: ${cd.count} questions solved`}>
                <div className={`w-full aspect-square rounded-md border ${levelClass} transition-colors`} />
                <span className="text-[10px] text-slate-500 font-mono">{cd.dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Practice & Weak Topics Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recommended Next Practice */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Recommended Next Practice</span>
          </div>

          <h4 className="text-base font-bold text-white">
            {lowestAccuracyTopic}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your mastery in {lowestAccuracyTopic} has the highest growth potential. Practice key operators and multi-stage syntax to boost your overall level.
          </p>

          <button
            onClick={() => onStartQuiz('topic-practice', lowestAccuracyTopic as MongoTopic)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <span>Practice {lowestAccuracyTopic}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Weak Topics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Weak Topics Requiring Review ({weakTopics.length})</span>
          </div>

          {weakTopics.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              No weak topics identified under 50% accuracy! Keep testing to maintain your mastery.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => onStartQuiz('topic-practice', t.topic)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors flex items-center space-x-1"
                >
                  <span>{t.topic} ({t.accuracy}%)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 20-Topic Mastery Progress Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Curriculum Mastery & Level Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            20 Core Topics
          </span>
        </div>

        <div className="space-y-3">
          {topicsWithAccuracy.map((item) => {
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
                      {item.attempted} solved ({item.correct} correct)
                    </span>
                  </div>

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
    </div>
  );
};
