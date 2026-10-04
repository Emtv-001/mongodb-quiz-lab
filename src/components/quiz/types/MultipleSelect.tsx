import React from 'react';
import { Question } from '../../../types';
import { CheckSquare, Square } from 'lucide-react';

interface MultipleSelectProps {
  question: Question;
  selectedAnswers: number[];
  onChangeAnswers: (indices: number[]) => void;
  disabled?: boolean;
}

export const MultipleSelect: React.FC<MultipleSelectProps> = ({
  question,
  selectedAnswers = [],
  onChangeAnswers,
  disabled = false
}) => {
  const options = question.options || [];

  const handleToggle = (idx: number) => {
    if (disabled) return;
    if (selectedAnswers.includes(idx)) {
      onChangeAnswers(selectedAnswers.filter(i => i !== idx));
    } else {
      onChangeAnswers([...selectedAnswers, idx]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
        Select all options that apply:
      </div>

      {options.map((option, idx) => {
        const isSelected = selectedAnswers.includes(idx);
        const letter = String.fromCharCode(65 + idx);

        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(idx)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 text-sm ${
              isSelected
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
            } ${disabled ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
          >
            <div className="mt-0.5 text-emerald-400 flex-shrink-0">
              {isSelected ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-500" />}
            </div>

            <div className="flex-1">
              <span className="font-bold text-xs text-slate-400 mr-2">[{letter}]</span>
              <span className="text-xs sm:text-sm leading-relaxed">{option}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
