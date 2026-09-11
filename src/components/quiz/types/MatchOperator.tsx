import React from 'react';
import { Question } from '../../../types';
import { ArrowRight, Check } from 'lucide-react';

interface MatchOperatorProps {
  question: Question;
  selectedMatches: Record<string, string>; // operatorId -> definitionId
  onChangeMatches: (matches: Record<string, string>) => void;
  disabled?: boolean;
}

export const MatchOperator: React.FC<MatchOperatorProps> = ({
  question,
  selectedMatches,
  onChangeMatches,
  disabled = false
}) => {
  const pairs = question.matchPairs || [];
  // Definitions list (shuffled for matching)
  const definitions = React.useMemo(() => {
    return [...pairs].sort(() => 0.5 - Math.random());
  }, [question.id]);

  const handleSelectDefinition = (operatorId: string, definitionId: string) => {
    if (disabled) return;
    onChangeMatches({
      ...selectedMatches,
      [operatorId]: definitionId
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Match each operator on the left with its correct behavior on the right:
      </div>

      <div className="space-y-3">
        {pairs.map((pair, idx) => {
          const selectedDefId = selectedMatches[pair.id];
          const isSelected = Boolean(selectedDefId);

          return (
            <div
              key={pair.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              {/* Operator */}
              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-700">
                  {idx + 1}
                </span>
                <span className="font-mono text-sm font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  {pair.operator}
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />

              {/* Definition Selector */}
              <div className="flex-1 max-w-md">
                <select
                  disabled={disabled}
                  value={selectedDefId || ''}
                  onChange={(e) => handleSelectDefinition(pair.id, e.target.value)}
                  className={`w-full text-xs font-medium rounded-xl p-2.5 border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/50 text-slate-200'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  } focus:outline-none focus:border-emerald-500`}
                >
                  <option value="">-- Choose matching definition --</option>
                  {definitions.map((def) => (
                    <option key={def.id} value={def.id}>
                      {def.definition}
                    </option>
                  ))}
                </select>
              </div>

              {isSelected && (
                <div className="hidden sm:flex items-center text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
