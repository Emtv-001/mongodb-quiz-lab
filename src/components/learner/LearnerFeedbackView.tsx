import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { submitFeedback } from '../../services/feedbackService';
import { loadProgress } from '../../services/storage';

export const LearnerFeedbackView: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'suggestion'>('suggestion');
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const progress = loadProgress();
    
    const res = submitFeedback(
      feedbackType,
      message,
      progress.learnerId.fingerprintHash,
      progress.learnerId.pseudonym
    );

    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      setMessage('');
      setTimeout(() => setStatusMsg(null), 5000);
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-6 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Support & Feedback</h2>
          <p className="text-sm text-slate-400">
            Have a suggestion to improve the platform or want to report an issue? Let us know below.
          </p>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl border text-sm flex items-center space-x-2 ${
            statusMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {statusMsg.isError ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            <span className="font-semibold">{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFeedbackType('suggestion')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                feedbackType === 'suggestion'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <ThumbsUp className="w-6 h-6" />
              <span className="font-bold text-sm">Suggestion</span>
            </button>

            <button
              type="button"
              onClick={() => setFeedbackType('complaint')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                feedbackType === 'complaint'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="font-bold text-sm">Complaint</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-300">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={feedbackType === 'suggestion' ? "I'd love to see a new feature that..." : "I'm experiencing an issue with..."}
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Submit {feedbackType === 'suggestion' ? 'Suggestion' : 'Complaint'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
