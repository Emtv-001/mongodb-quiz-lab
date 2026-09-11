import React from 'react';
import { BRANDING } from '../../config/branding';
import { Database, Flame, Menu, Award } from 'lucide-react';

interface NavbarProps {
  currentStreak: number;
  bestScore: number;
  onOpenSeedData: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStreak,
  bestScore,
  onOpenSeedData,
  onToggleSidebar
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Left */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 cursor-pointer">
              {/* MongoDB Leaf Icon Style */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-5 h-5 text-slate-950 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    {BRANDING.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {BRANDING.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  {BRANDING.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Seed Data Explorer Button */}
            <button
              onClick={onOpenSeedData}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border border-slate-700 transition-all hover:shadow-md hover:shadow-emerald-500/10"
              title="Inspect GptData02 sample collection"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">GptData02</span>
              <span className="sm:hidden">Data</span>
            </button>

            {/* Best Score Badge */}
            {bestScore > 0 && (
              <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Best Mock:</span>
                <span>{bestScore}%</span>
              </div>
            )}

            {/* Streak Counter */}
            <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{currentStreak}d Streak</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
