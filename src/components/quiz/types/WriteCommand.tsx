import React, { useState } from 'react';
import { Question } from '../../../types';
import { Code2, Wand2, RefreshCw } from 'lucide-react';

interface WriteCommandProps {
  question: Question;
  studentCommand: string;
  onChangeCommand: (val: string) => void;
  disabled?: boolean;
}

export const WriteCommand: React.FC<WriteCommandProps> = ({
  question,
  studentCommand,
  onChangeCommand,
  disabled = false
}) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Common operator quick-insert chips
  const quickChips = [
    '$push',
    '$each',
    '$position',
    '$slice',
    '$sort',
    '$addToSet',
    '$min',
    '$max',
    '$set',
    '$unset',
    '$inc',
    '$pull',
    '{upsert: true}'
  ];

  const handleInsertChip = (chip: string) => {
    if (disabled) return;
    const current = studentCommand || '';
    onChangeCommand(current + (current.endsWith(' ') || current === '' ? '' : ' ') + chip);
  };

  const insertStarterTemplate = () => {
    if (disabled) return;
    const starter = `db.GptData02.updateOne(\n  { _id: 1 },\n  {\n    \n  }\n)`;
    onChangeCommand(starter);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const formatCode = () => {
    if (!studentCommand) return;
    try {
      // Basic aesthetic indenting for braces and brackets
      let formatted = studentCommand
        .replace(/\s+/g, ' ')
        .replace(/\{\s*/g, '{\n  ')
        .replace(/\s*\}/g, '\n}')
        .replace(/\[\s*/g, '[\n    ')
        .replace(/\s*\]/g, '\n  ]')
        .replace(/,\s*/g, ',\n  ');
      onChangeCommand(formatted);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Editor Container */}
      <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-xl">
        {/* Editor Toolbar */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              MongoDB Query Editor
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              10 Points (Partial Credit Supported)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={disabled}
              onClick={insertStarterTemplate}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1"
              title="Insert Starter Template"
            >
              <Wand2 className="w-3 h-3 text-emerald-400" />
              <span>{copiedTemplate ? 'Inserted!' : 'Insert Shell Boilerplate'}</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={formatCode}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Format Indentation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Area Code Editor */}
        <div className="p-3 bg-slate-950">
          <textarea
            value={studentCommand}
            onChange={(e) => onChangeCommand(e.target.value)}
            disabled={disabled}
            placeholder={`// Write your MongoDB command here. Example:\n// db.GptData02.updateOne({_id: 1}, { ... })`}
            rows={7}
            className="w-full bg-transparent font-mono text-xs sm:text-sm text-emerald-300 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Operator Quick Inserts */}
        <div className="bg-slate-900/70 px-4 py-2 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Quick Operators:
          </span>
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => handleInsertChip(chip)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-emerald-400 border border-slate-700 transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Partial Credit Scoring Tip */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
        <span className="text-emerald-400 font-bold">Tip:</span>
        <span>
          Full marks are awarded for exact syntax. If you use the correct operator logic but make a minor typo (e.g. <code className="text-emerald-300">Address.HouseNo</code> instead of <code className="text-emerald-300">Address.HouseNumber</code>), our grading engine automatically awards partial credit!
        </span>
      </div>
    </div>
  );
};
