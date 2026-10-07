import React, { useState, useEffect } from 'react';
import { getSiteCustomization, DEFAULT_SITE_CONFIG } from '../../services/adminService';
import { SiteCustomization } from '../../types/admin';
import { Database, Flame, Menu, Award, Server, Terminal, Sparkles, Coins, Trophy, UserCheck } from 'lucide-react';
import { getRegisteredLearnerAccount } from '../../services/learnerService';
import { RegisteredLearnerAccount } from '../../types';

interface NavbarProps {
  currentStreak: number;
  bestScore: number;
  onOpenSeedData: () => void;
  onToggleSidebar: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStreak,
  bestScore,
  onOpenSeedData,
  onToggleSidebar,
  onNavigateTab
}) => {
  const [siteConfig, setSiteConfig] = useState<SiteCustomization>(DEFAULT_SITE_CONFIG);
  const [learnerAccount, setLearnerAccount] = useState<RegisteredLearnerAccount | null>(() => getRegisteredLearnerAccount());

  useEffect(() => {
    getSiteCustomization().then(setSiteConfig);

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSiteConfig(e.detail);
      } else {
        getSiteCustomization().then(setSiteConfig);
      }
    };

    const handleLearnerUpdate = (e: any) => {
      setLearnerAccount(e.detail || getRegisteredLearnerAccount());
    };

    window.addEventListener('site_branding_updated', handleUpdate);
    window.addEventListener('learner_account_updated', handleLearnerUpdate);
    return () => {
      window.removeEventListener('site_branding_updated', handleUpdate);
      window.removeEventListener('learner_account_updated', handleLearnerUpdate);
    };
  }, []);

  const renderLogo = () => {
    switch (siteConfig.logoValue) {
      case 'database':
        return <Database className="w-5 h-5 text-slate-950" />;
      case 'server':
        return <Server className="w-5 h-5 text-slate-950" />;
      case 'terminal':
        return <Terminal className="w-5 h-5 text-slate-950" />;
      default:
        return (
          <svg className="w-5 h-5 text-slate-950 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        );
    }
  };

  const colorGradients: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-400',
    blue: 'from-blue-600 to-blue-400',
    purple: 'from-purple-600 to-purple-400',
    amber: 'from-amber-600 to-amber-400',
    cyan: 'from-cyan-600 to-cyan-400',
    rose: 'from-rose-600 to-rose-400'
  };

  const activeGradient = colorGradients[siteConfig.accentColor] || colorGradients['emerald'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 w-full max-w-full overflow-x-auto scrollbar-none shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-max sm:min-w-0">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Brand Left */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0"
            >
              {/* Dynamic Logo Icon */}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${activeGradient} flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0`}>
                {renderLogo()}
              </div>
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-1.5 whitespace-nowrap">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    {siteConfig.siteName}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {siteConfig.brandName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:block">
                  {siteConfig.siteSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Gamification / MongoCoins CTA */}
            <button
              onClick={() => onNavigateTab && onNavigateTab('learner-hub')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm flex-shrink-0 whitespace-nowrap"
              title="View Personal Points, Rank & MongoCoins"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{learnerAccount ? `${learnerAccount.coins || 100} 🪙` : 'Points & 🪙'}</span>
            </button>

            {/* Seed Data Explorer Button */}
            <button
              onClick={onOpenSeedData}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border border-slate-700 transition-all hover:shadow-md hover:shadow-emerald-500/10 flex-shrink-0 whitespace-nowrap"
              title="Inspect Live Data Collections"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="hidden md:inline">Live Datasets</span>
              <span className="md:hidden">Datasets</span>
            </button>

            {/* Best Score Badge */}
            {bestScore > 0 && (
              <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                <Award className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="hidden md:inline">Best Mock:</span>
                <span>{bestScore}%</span>
              </div>
            )}

            {/* Prominent Streak Counter */}
            <div
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex-shrink-0 whitespace-nowrap shadow-sm shadow-amber-500/10"
              title={`Current daily learning streak: ${currentStreak} days`}
            >
              <Flame className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
              <span>{currentStreak} Day{currentStreak === 1 ? '' : 's'} Streak 🔥</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
