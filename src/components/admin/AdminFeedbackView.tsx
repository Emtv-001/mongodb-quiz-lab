import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, AlertTriangle, User, Calendar } from 'lucide-react';
import { getFeedbackEntries } from '../../services/feedbackService';
import { FeedbackEntry } from '../../types';

interface AdminFeedbackViewProps {
  isSuperAdmin: boolean;
}

export const AdminFeedbackView: React.FC<AdminFeedbackViewProps> = ({ isSuperAdmin }) => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    getFeedbackEntries().then(setEntries);
  }, []);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-fadeIn">
        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-semibold">No feedback or complaints logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <span>Learner Feedback & Complaints</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review suggestions and issues reported by users.
          {!isSuperAdmin && " Sender details are obfuscated for sub-admins."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(entry => (
          <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 shadow-lg hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                entry.type === 'suggestion' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {entry.type === 'suggestion' ? <ThumbsUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>{entry.type}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-mono">
                <Calendar className="w-3 h-3" />
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {entry.message}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-400">
                <User className="w-4 h-4" />
                <span className="font-mono">
                  {isSuperAdmin ? entry.senderPseudonym : 'Anonymous Learner'}
                </span>
              </div>
              {isSuperAdmin && (
                <span className="text-[9px] text-slate-600 font-mono">
                  ID: {entry.senderFingerprint.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
