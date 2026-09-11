import React from 'react';
import { Question } from '../../../types';
import { Terminal } from 'lucide-react';

interface PredictOutputProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

export const PredictOutput: React.FC<PredictOutputProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false
}) => {
  const options = question.options || [];

  return (
    <div className="space-y-4">
      {/* Visual Terminal / Code Window */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>MongoDB Shell Session</span>
          </div>
          <span className="text-[10px] text-slate-400">Prediction Engine</span>
        </div>

        <div className="p-4 font-mono text-xs sm:text-sm text-emerald-400/90 overflow-x-auto">
          {question.scenario}
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Select the Predicted Outcome:
      </div>

      <div className="space-y-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelectAnswer(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 text-sm ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              } ${disabled ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {letter}
              </span>
              <span className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-all">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
