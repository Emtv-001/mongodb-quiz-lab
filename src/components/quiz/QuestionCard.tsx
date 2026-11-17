import React from 'react';
import { Question } from '../../types';
import { MultipleChoice } from './types/MultipleChoice';
import { PredictOutput } from './types/PredictOutput';
import { FindError } from './types/FindError';
import { WriteCommand } from './types/WriteCommand';
import { MatchOperator } from './types/MatchOperator';
import { ScenarioQuestion } from './types/ScenarioQuestion';
import { ArrangeCommand } from './types/ArrangeCommand';
import { MultipleSelect } from './types/MultipleSelect';
import { HelpCircle, Check, Database } from 'lucide-react';
import { ProgressiveButton } from '../common/ProgressiveButton';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface QuestionCardProps {
  question: Question;
  studentAnswer: any;
  onChangeAnswer: (answer: any) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  canSubmit: boolean;
  onOpenSeedData?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  studentAnswer,
  onChangeAnswer,
  onSubmit,
  isSubmitted,
  canSubmit,
  onOpenSeedData
}) => {
  const renderQuestionBody = () => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <MultipleChoice
            question={question}
            selectedAnswer={studentAnswer !== undefined ? Number(studentAnswer) : null}
            onSelectAnswer={(idx) => onChangeAnswer(idx)}
            disabled={isSubmitted}
          />
        );

      case 'multiple-select':
        return (
          <MultipleSelect
            question={question}
            selectedAnswers={Array.isArray(studentAnswer) ? studentAnswer : []}
            onChangeAnswers={(indices) => onChangeAnswer(indices)}
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
      case 'fix-query':
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
    'arrange-command': 'Type G — Arrange the Command',
    'multiple-select': 'Type H — Multiple Select',
    'true-false': 'Type I — True / False',
    'fix-query': 'Type J — Fix the Query'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Title & Type Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
              {typeLabels[question.type] || String(question.type)}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Level {Number(question.level) || 1}
            </span>
            {question.databaseName && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center space-x-1" title="Target Database">
                <Database className="w-3 h-3 text-amber-400" />
                <span>DB: {String(question.databaseName)}</span>
              </span>
            )}
            {question.datasetName && (
              <button
                type="button"
                onClick={onOpenSeedData}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center space-x-1 hover:bg-purple-500/20 transition-colors"
                title="View target collection / dataset"
              >
                <Database className="w-3 h-3 text-purple-400" />
                <span>Collection: {String(question.datasetName)}</span>
              </button>
            )}
          </div>

          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
            {Number(question.points) || 10} Points
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {typeof question.title === 'string' ? question.title : JSON.stringify(question.title)}
        </h3>

        {/* Structured Schema Specification Card */}
        <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3.5 space-y-2 text-xs font-mono shadow-inner">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-semibold">Database:</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {question.databaseName || 'mongodb_lab'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-semibold">Collection:</span>
              <span className="text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                db.{String(question.datasetName || 'GptData02').replace(/^db\./i, '')}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-semibold">Field(s):</span>
              {question.fieldNames && question.fieldNames.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  {question.fieldNames.map((fn) => (
                    <span key={fn} className="text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {fn}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic font-sans text-[11px]">As specified in scenario</span>
              )}
            </div>
          </div>
        </div>

        {question.scenario && question.type !== 'predict-output' && question.type !== 'scenario' && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {typeof question.scenario === 'string' ? question.scenario : JSON.stringify(question.scenario)}
          </p>
        )}
      </div>

      {/* Specific Question Renderer Body */}
      <div>
        <ErrorBoundary fallbackName="Question Display">
          {renderQuestionBody()}
        </ErrorBoundary>
      </div>

      {/* Submit / Grade Button (Shown only before submission) */}
      {!isSubmitted && (
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Submit to check answer immediately and see concept breakdown</span>
          </div>

          <ProgressiveButton
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            borderVariant="emerald"
            loadingText="Evaluating..."
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Submit Answer</span>
          </ProgressiveButton>
        </div>
      )}
    </div>
  );
};
