import React from 'react';
import {
  Users,
  CheckCircle,
  TrendingUp,
  Database,
  Shield,
  Layers,
  Award,
  Sparkles,
  ArrowUpRight,
  Clock,
  Share2,
  Sliders
} from 'lucide-react';
import {
  getLearnerProfiles,
  getAdminUsers,
  getDatabaseCollections,
  getAuditLogs,
  getSiteCustomization
} from '../../services/adminService';
import { loadProgress } from '../../services/storage';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ onNavigateTab }) => {
  const learners = getLearnerProfiles();
  const admins = getAdminUsers();
  const databases = getDatabaseCollections();
  const logs = getAuditLogs().slice(0, 6);
  const progress = loadProgress();
  const siteConfig = getSiteCustomization();

  const totalQuestions = learners.reduce((acc, l) => acc + l.questionsAttempted, 0);
  const totalCorrect = learners.reduce((acc, l) => acc + l.questionsCorrect, 0);
  const cohortAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const activeLearners = learners.filter(l => l.status === 'active').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Master Admin Control Center
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Network Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {siteConfig.siteName} — Executive Overview
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Monitor real-time cohort statistics, configure site white-labeling, audit sub-administrators, and govern multi-database collections.
          </p>
        </div>

        {/* Shortcut Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateTab('branding')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Site Logo & Tabs</span>
          </button>
          <button
            onClick={() => onNavigateTab('databases')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Manage DBs</span>
          </button>
          <button
            onClick={() => onNavigateTab('share')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tracked Learners</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {learners.length}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>{activeLearners} Active recently</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Queries Solved</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {totalQuestions}
          </div>
          <div className="text-[11px] text-slate-400">
            Avg Cohort Score: {cohortAccuracy}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Database Collections</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
            {databases.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Multi-Engine (Mongo, SQL, JSON)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Administrators (RBAC)</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {admins.length}
          </div>
          <div className="text-[11px] text-slate-400">
            {admins.filter(a => a.role === 'super-admin').length} Super, {admins.filter(a => a.role !== 'super-admin').length} Sub-admins
          </div>
        </div>
      </div>

      {/* Cohort Grade & Topic Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Learner Roster Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Live Learner Activity Roster
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>View All Learners</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-2 font-semibold">Pseudonym / ID</th>
                  <th className="pb-2 font-semibold">Streak</th>
                  <th className="pb-2 font-semibold">Attempted</th>
                  <th className="pb-2 font-semibold">Accuracy</th>
                  <th className="pb-2 font-semibold">Best Mock</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {learners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <span>{learner.pseudonym}</span>
                    </td>
                    <td className="py-2.5 font-mono text-amber-400 font-semibold">
                      {learner.currentStreak}d
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">
                      {learner.questionsAttempted}
                    </td>
                    <td className="py-2.5">
                      <span className={`font-mono font-bold ${learner.accuracy >= 75 ? 'text-emerald-400' : learner.accuracy >= 50 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {learner.accuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-purple-300">
                      {learner.bestMockScore}%
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${learner.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {learner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Admin Audit Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Immutable Records
            </span>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No recent audit activities recorded.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">
                      @{log.adminUsername} • {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
