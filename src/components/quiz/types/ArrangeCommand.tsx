import React, { useState, useEffect } from 'react';
import { Question } from '../../../types';
import { MoveUp, MoveDown, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ArrangeCommandProps {
  question: Question;
  selectedOrder: string[]; // array of block IDs
  onChangeOrder: (order: string[]) => void;
  disabled?: boolean;
}

export const ArrangeCommand: React.FC<ArrangeCommandProps> = ({
  question,
  selectedOrder,
  onChangeOrder,
  disabled = false
}) => {
  const blocks = question.arrangeBlocks || [];
  const blockMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    blocks.forEach((b) => (map[b.id] = b.text));
    return map;
  }, [blocks]);

  // Initial setup: if selectedOrder is empty, populate with initial blocks
  useEffect(() => {
    if ((!selectedOrder || selectedOrder.length === 0) && blocks.length > 0) {
      onChangeOrder(blocks.map((b) => b.id));
    }
  }, [blocks, selectedOrder, onChangeOrder]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const newOrder = [...selectedOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    onChangeOrder(newOrder);
  };

  const handleReset = () => {
    if (disabled) return;
    onChangeOrder(blocks.map((b) => b.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Arrange blocks into the correct MongoDB structural sequence:
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Order</span>
        </button>
      </div>

      <div className="space-y-2">
        {selectedOrder.map((blockId, idx) => {
          const text = blockMap[blockId] || blockId;
          const isFirst = idx === 0;
          const isLast = idx === selectedOrder.length - 1;

          return (
            <div
              key={blockId}
              className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between group hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex items-center space-x-3 overflow-x-auto">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center border border-slate-700 flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="font-mono text-xs sm:text-sm text-emerald-400 whitespace-pre">
                  {text}
                </span>
              </div>

              {!disabled && (
                <div className="flex items-center space-x-1 pl-2">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveItem(idx, 'up')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview of assembled command */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-400">
        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Assembled Query Preview:</span>
        </div>
        <div className="text-emerald-300/90 whitespace-pre-wrap">
          {selectedOrder.map((id) => blockMap[id]).join(' ')}
        </div>
      </div>
    </div>
  );
};
