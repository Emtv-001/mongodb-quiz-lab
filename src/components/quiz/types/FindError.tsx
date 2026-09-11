import React from 'react';
import { Question } from '../../../types';
import { AlertTriangle } from 'lucide-react';

interface FindErrorProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

export const FindError: React.FC<FindErrorProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false
}) => {
  const options = question.options || [];

  return (
    <div className="space-y-4">
      {/* Faulty Code Snippet Box */}
      {question.codeSnippet && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/10 overflow-hidden shadow-inner">
          <div className="bg-red-950/30 px-4 py-2 border-b border-red-500/20 flex items-center justify-between text-xs text-red-300 font-mono">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Faulty MongoDB Command (Contains a Bug)</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-red-400">Diagnosis Required</span>
          </div>

          <div className="p-4 font-mono text-xs sm:text-sm text-red-200 overflow-x-auto whitespace-pre">
            {question.codeSnippet}
          </div>
        </div>
      )}

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Identify the root error or why this command fails:
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
                  ? 'bg-red-500/10 border-red-500 text-white shadow-md shadow-red-500/10 ring-1 ring-red-500'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              } ${disabled ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {letter}
              </span>
              <span className="text-xs sm:text-sm leading-relaxed">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
