import React from 'react';
import { Question } from '../../types';
import { MultipleChoice } from './types/MultipleChoice';
import { PredictOutput } from './types/PredictOutput';
import { FindError } from './types/FindError';
import { WriteCommand } from './types/WriteCommand';
import { MatchOperator } from './types/MatchOperator';
import { ScenarioQuestion } from './types/ScenarioQuestion';
import { ArrangeCommand } from './types/ArrangeCommand';
import { HelpCircle, Check } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  studentAnswer: any;
  onChangeAnswer: (answer: any) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  canSubmit: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  studentAnswer,
  onChangeAnswer,
  onSubmit,
  isSubmitted,
  canSubmit
}) => {
  const renderQuestionBody = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <MultipleChoice
            question={question}
            selectedAnswer={studentAnswer !== undefined ? Number(studentAnswer) : null}
            onSelectAnswer={(idx) => onChangeAnswer(idx)}
            disabled={isSubmitted}
          />
        );

      case 'predict-output':
        return (
          <PredictOutput
            question={question}
            selectedAnswer={studentAnswer !== undefined ? Number(studentAnswer) : null}
            onSelectAnswer={(idx) => onChangeAnswer(idx)}
            disabled={isSubmitted}
          />
        );

      case 'find-error':
        return (
          <FindError
            question={question}
            selectedAnswer={studentAnswer !== undefined ? Number(studentAnswer) : null}
            onSelectAnswer={(idx) => onChangeAnswer(idx)}
            disabled={isSubmitted}
          />
        );

      case 'write-command':
        return (
          <WriteCommand
            question={question}
            studentCommand={studentAnswer || ''}
            onChangeCommand={(val) => onChangeAnswer(val)}
            disabled={isSubmitted}
          />
        );

      case 'match-operator':
        return (
          <MatchOperator
            question={question}
            selectedMatches={studentAnswer || {}}
            onChangeMatches={(matches) => onChangeAnswer(matches)}
            disabled={isSubmitted}
          />
        );

      case 'scenario':
        return (
          <ScenarioQuestion
            question={question}
            selectedAnswer={studentAnswer !== undefined ? Number(studentAnswer) : null}
            onSelectAnswer={(idx) => onChangeAnswer(idx)}
            disabled={isSubmitted}
          />
        );

      case 'arrange-command':
        return (
          <ArrangeCommand
            question={question}
            selectedOrder={studentAnswer || []}
            onChangeOrder={(order) => onChangeAnswer(order)}
            disabled={isSubmitted}
          />
        );

      default:
        return <div className="text-red-400">Unsupported question type.</div>;
    }
  };

  const typeLabels: Record<string, string> = {
    'multiple-choice': 'Type A — Multiple Choice',
    'predict-output': 'Type B — Predict the Output',
    'find-error': 'Type C — Find the Error',
    'write-command': 'Type D — Write the Command',
    'match-operator': 'Type E — Match the Operator',
    'scenario': 'Type F — Scenario Question',
    'arrange-command': 'Type G — Arrange the Command'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Title & Type Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            {typeLabels[question.type] || question.type}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
            {question.points} Points
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {question.title}
        </h3>

        {/* Scenario description if available and not already inside specific renderer */}
        {question.scenario && question.type !== 'predict-output' && question.type !== 'scenario' && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {question.scenario}
          </p>
        )}
      </div>

      {/* Specific Question Renderer Body */}
      <div>{renderQuestionBody()}</div>

      {/* Submit / Grade Button (Shown only before submission) */}
      {!isSubmitted && (
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Submit to calculate score and view explanation</span>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Submit Answer</span>
          </button>
        </div>
      )}
    </div>
  );
};
