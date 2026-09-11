import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  Clock,
  GraduationCap,
  Layers,
  Sparkles,
  BookOpen,
  CheckSquare,
  ShieldCheck,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'practice'
  | 'quiz'
  | 'mock-test'
  | 'topic-practice'
  | 'flashcards'
  | 'study-notes'
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
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; category: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'practice', label: 'Practice Mode', icon: PlayCircle, badge: 'Instant Feedback', category: 'Testing' },
    { id: 'quiz', label: 'Timed Quiz', icon: Clock, category: 'Testing' },
    { id: 'mock-test', label: 'Mock Practical Test', icon: GraduationCap, badge: 'NIIT Style', category: 'Testing' },
    { id: 'topic-practice', label: 'Practice by Topic', icon: Layers, category: 'Testing' },
    { id: 'flashcards', label: 'Study Flashcards', icon: Sparkles, badge: 'Deck', category: 'Study Hub' },
    { id: 'study-notes', label: 'Notes & Cheatsheet', icon: BookOpen, category: 'Study Hub' },
    { id: 'review', label: 'Question Review', icon: CheckSquare, category: 'Analysis' },
    { id: 'admin', label: 'Instructor Portal', icon: ShieldCheck, category: 'Admin' }
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const categories = ['Main', 'Testing', 'Study Hub', 'Analysis', 'Admin'];

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
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
                        <span>{item.label}</span>
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
              Ready
            </span>
          </div>
          <p className="text-slate-400 text-[10px]">
            Storage: Local Client Engine
          </p>
        </div>
      </aside>
    </>
  );
};
