import React from 'react';
import { DifficultyLevel, MongoTopic, QuizMode } from '../../types';
import { Clock, Database, Bookmark, BookmarkCheck } from 'lucide-react';

interface ProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
  topic: MongoTopic;
  difficulty: DifficultyLevel;
  mode: QuizMode;
  timeRemaining?: number;
  currentPoints: number;
  totalPossiblePoints: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenSeedData: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalQuestions,
  topic,
  difficulty,
  mode,
  timeRemaining,
  currentPoints,
  totalPossiblePoints,
  isBookmarked,
  onToggleBookmark,
  onOpenSeedData
}) => {
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Format timer seconds into mm:ss
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeRemaining !== undefined && timeRemaining < 120; // under 2 mins

  const difficultyColors: Record<DifficultyLevel, string> = {
    Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Hard: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Expert: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Badges */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            Q{currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            {topic}
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${difficultyColors[difficulty]}`}
          >
            {difficulty}
          </span>
        </div>

        {/* Right Tools: Timer, Seed Data, Bookmark */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Timer (if timed mode) */}
          {timeRemaining !== undefined && mode !== 'practice' && (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-colors ${
                isTimeCritical
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : 'bg-slate-800 text-emerald-400 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Seed Data Explorer Button */}
          <button
            onClick={onOpenSeedData}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Inspect GptData02 collection"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">GptData02</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleBookmark}
            className={`p-1.5 rounded-xl border transition-colors ${
              isBookmarked
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isBookmarked ? 'Bookmarked for review' : 'Bookmark question'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Current Score Pill */}
          {mode !== 'practice' && (
            <div className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800">
              {currentPoints} / {totalPossiblePoints} pts
            </div>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
