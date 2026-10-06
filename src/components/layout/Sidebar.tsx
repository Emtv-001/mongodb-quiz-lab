import React, { useState, useEffect } from 'react';
import { getSiteCustomization } from '../../services/adminService';
import { SiteCustomization } from '../../types/admin';
import {
  LayoutDashboard,
  PlayCircle,
  GraduationCap,
  Layers,
  Sparkles,
  BookOpen,
  CheckSquare,
  Zap,
  Repeat,
  Database,
  Lock,
  Trophy,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'learner-hub'
  | 'practice'
  | 'quiz'
  | 'mock-exam-selector'
  | 'challenge'
  | 'mastery'
  | 'topic-practice'
  | 'weak-areas'
  | 'revision'
  | 'flashcards'
  | 'study-notes'
  | 'datasets'
  | 'review'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose
}) => {
  const [siteConfig, setSiteConfig] = useState<SiteCustomization>(() => getSiteCustomization());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSiteConfig(e.detail);
      } else {
        setSiteConfig(getSiteCustomization());
      }
    };
    window.addEventListener('site_branding_updated', handleUpdate);
    return () => window.removeEventListener('site_branding_updated', handleUpdate);
  }, []);

  const rawNavItems: { id: NavTab; defaultLabel: string; icon: React.FC<{ className?: string }>; badge?: string; category: string }[] = [
    { id: 'dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'learner-hub', defaultLabel: 'Points & Rewards', icon: Trophy, badge: 'Coins & XP', category: 'Main' },

    { id: 'practice', defaultLabel: 'Practice Mode', icon: PlayCircle, badge: 'Instant', category: 'Assessments' },
    { id: 'mock-exam-selector', defaultLabel: 'Mock Exam Suite', icon: GraduationCap, badge: '10 Exams', category: 'Assessments' },
    { id: 'challenge', defaultLabel: 'Challenge Mode', icon: Zap, badge: 'Hard', category: 'Assessments' },
    { id: 'mastery', defaultLabel: 'Level 9 Projects', icon: Sparkles, badge: 'Real-World', category: 'Assessments' },
    { id: 'topic-practice', defaultLabel: 'Practice by Topic', icon: Layers, category: 'Assessments' },

    { id: 'weak-areas', defaultLabel: 'Target Weak Areas', icon: Zap, badge: 'Smart', category: 'Smart Study' },
    { id: 'revision', defaultLabel: 'Spaced Repetition', icon: Repeat, category: 'Smart Study' },
    { id: 'flashcards', defaultLabel: 'Study Flashcards', icon: Sparkles, badge: '3D Deck', category: 'Smart Study' },
    { id: 'study-notes', defaultLabel: 'Notes & Cheatsheet', icon: BookOpen, category: 'Smart Study' },
    { id: 'datasets', defaultLabel: 'Live Datasets Explorer', icon: Database, badge: '5 Sets', category: 'Smart Study' },

    { id: 'review', defaultLabel: 'Question Review', icon: CheckSquare, category: 'Analysis' },
    { id: 'admin', defaultLabel: 'Instructor Portal', icon: Lock, badge: 'Secured', category: 'Admin' }
  ];

  // Filter based on admin enabled tabs configuration
  const navItems = rawNavItems.filter(item => {
    if (item.id === 'admin' || item.id === 'dashboard') return true; // always show admin and dashboard
    return siteConfig.enabledTabs[item.id] !== false;
  });

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const categories = ['Main', 'Assessments', 'Smart Study', 'Analysis', 'Admin'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Close */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <span className="font-bold text-sm text-white">Menu Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map(category => {
            const items = navItems.filter(item => item.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {category}
                </div>
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const customLabel = siteConfig.customTabLabels[item.id] || item.defaultLabel;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{customLabel}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Platform Status</span>
            <span className="inline-flex items-center text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Live Online
            </span>
          </div>
          <p className="text-slate-500 text-[10px] truncate">
            {siteConfig.footerText}
          </p>
        </div>
      </aside>
    </>
  );
};
