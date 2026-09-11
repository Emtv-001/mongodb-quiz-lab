import React from 'react';
import { Question } from '../../../types';
import { Briefcase } from 'lucide-react';

interface ScenarioQuestionProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

export const ScenarioQuestion: React.FC<ScenarioQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false
}) => {
  const options = question.options || [];

  return (
    <div className="space-y-4">
      {/* Scenario Context Card */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Real-World Engineering Scenario</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {question.scenario}
        </p>
      </div>

      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Choose the best engineering implementation:
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
                  ? 'bg-blue-500/10 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              } ${disabled ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white'
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
