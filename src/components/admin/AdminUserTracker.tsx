import React, { useState } from 'react';
import { LearnerProfile } from '../../types/admin';
import { getRealtimeLearnerProfiles } from '../../services/adminService';
import { loadProgress } from '../../services/storage';
import {
  Users,
  Search,
  Flame,
  Award,
  CheckCircle,
  Eye,
  Download,
  X
} from 'lucide-react';

export const AdminUserTracker: React.FC = () => {
  const [learners, setLearners] = useState<LearnerProfile[]>(() => getRealtimeLearnerProfiles());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<LearnerProfile | null>(null);

  const progress = loadProgress();

  const filtered = learners.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      l.pseudonym.toLowerCase().includes(term) ||
      l.fingerprintHash.toLowerCase().includes(term) ||
      l.weakTopics.some(t => t.toLowerCase().includes(term))
    );
  });

  const exportLearnersCsv = () => {
    let csv = "ID,Pseudonym,FingerprintHash,FirstJoined,LastActive,CurrentStreak,Attempted,Correct,Accuracy,BestMock,Status\n";
    learners.forEach(l => {
      csv += `"${l.id}","${l.pseudonym}","${l.fingerprintHash}","${l.firstJoined}","${l.lastActive}",${l.currentStreak},${l.questionsAttempted},${l.questionsCorrect},${l.accuracy}%,${l.bestMockScore}%,"${l.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `learners_cohort_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const avgAccuracy = learners.length > 0
    ? Math.round(learners.reduce((acc, l) => acc + l.accuracy, 0) / learners.length)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Learner Cohort Telemetry</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Student & Learner Activity Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of student streaks, accuracy rates, and identified misconceptions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportLearnersCsv}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Roster (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cohort Real-time Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-semibold block">Total Active Learners</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">{learners.length} Student</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-semibold block">Live Daily Streak</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {progress.currentStreak} Days
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-semibold block">Average Pass Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {avgAccuracy}%
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-semibold block">Best Mock Performance</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {progress.bestMockScore}%
          </span>
        </div>
      </div>

      {/* Table & Search Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by pseudonym, fingerprint hash, or weak topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filtered.length} Learners Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Learner Identity</th>
                <th className="pb-3 font-semibold">Joined / Active</th>
                <th className="pb-3 font-semibold">Streak</th>
                <th className="pb-3 font-semibold">Solved</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold">Best Mock</th>
                <th className="pb-3 font-semibold">Weak Area</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((learner) => (
                <tr key={learner.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3">
                    <div className="font-mono font-bold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      <span>{learner.pseudonym}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      hash: {learner.fingerprintHash.slice(0, 12)}...
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono text-[11px]">
                    <div>{learner.lastActive}</div>
                    <span className="text-[10px] text-slate-500">Joined {learner.firstJoined.split('T')[0]}</span>
                  </td>
                  <td className="py-3 font-mono font-bold text-amber-400">
                    <span className="flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{learner.currentStreak}d</span>
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-200">
                    {learner.questionsAttempted} ({learner.questionsCorrect} correct)
                  </td>
                  <td className="py-3">
                    <span className={`font-mono font-bold ${learner.accuracy >= 75 ? 'text-emerald-400' : learner.accuracy >= 50 ? 'text-blue-400' : 'text-amber-400'}`}>
                      {learner.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 font-mono text-purple-300 font-bold">
                    {learner.bestMockScore}%
                  </td>
                  <td className="py-3">
                    {learner.weakTopics.length > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-medium">
                        {learner.weakTopics[0]}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium">None flagged</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setSelectedLearner(learner)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Learner Modal */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  {selectedLearner.pseudonym.slice(-2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedLearner.pseudonym}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {selectedLearner.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLearner(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Assessment Accuracy</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{selectedLearner.accuracy}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Consecutive Streak</span>
                <span className="text-xl font-bold font-mono text-amber-400">{selectedLearner.currentStreak} Days</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Curriculum Diagnostics:</div>

              {selectedLearner.masteredTopics.length > 0 && (
                <div>
                  <span className="text-[11px] text-emerald-400 block mb-1">Mastered Topics:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedLearner.masteredTopics.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLearner.weakTopics.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-red-400 block mb-1">Identified Weak Areas:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedLearner.weakTopics.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLearner(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
