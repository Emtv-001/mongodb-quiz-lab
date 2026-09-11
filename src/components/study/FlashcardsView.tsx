import React, { useState } from 'react';
import { FLASHCARDS } from '../../data/flashcards';
import { MongoTopic } from '../../types';
import { toggleFlashcardMastery, loadProgress } from '../../services/storage';
import {
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle,
  BookOpen,
  Code2
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>(() => {
    const p = loadProgress();
    const map: Record<string, boolean> = {};
    p.masteredFlashcardIds.forEach((id) => (map[id] = true));
    return map;
  });

  const topics = ['All', ...Array.from(new Set(FLASHCARDS.map((f) => f.topic)))];

  const filteredCards = FLASHCARDS.filter((f) => {
    if (selectedTopic === 'All') return true;
    return f.topic === selectedTopic;
  });

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    setCurrentIndex(randomIndex);
  };

  const handleToggleMastery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    const isNowMastered = toggleFlashcardMastery(currentCard.id);
    setMasteredIds((prev) => ({
      ...prev,
      [currentCard.id]: isNowMastered
    }));
  };

  if (!currentCard) {
    return (
      <div className="p-12 text-center text-slate-400">
        No flashcards found for topic "{selectedTopic}".
      </div>
    );
  }

  const isMastered = Boolean(masteredIds[currentCard.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Revision Deck</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            MongoDB Study Flashcards
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test yourself on operators, modifiers, edge cases, and syntax before the mock test.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Card Index Tracker */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-mono font-bold text-slate-300">
          Card {currentIndex + 1} of {filteredCards.length}
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMastery}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
              isMastered
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isMastered ? 'Mastered ✓' : 'Mark as Mastered'}</span>
          </button>

          <button
            onClick={handleShuffle}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Shuffle deck"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[340px] perspective-1000 cursor-pointer select-none"
      >
        <div
          className={`relative w-full h-full min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-3d border shadow-2xl p-6 sm:p-8 flex flex-col justify-between ${
            isFlipped ? 'rotate-y-180 bg-slate-900 border-emerald-500/40' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* FRONT OF CARD */}
          {!isFlipped ? (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  {currentCard.topic}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentCard.difficulty}
                </span>
              </div>

              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed max-w-xl mx-auto">
                  {currentCard.front}
                </h3>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>Click or tap card to flip and reveal answer</span>
              </div>
            </div>
          ) : (
            /* BACK OF CARD */
            <div className="flex-1 flex flex-col justify-between space-y-4 rotate-y-180">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Explanation & Syntax
                </span>
                <span className="text-xs font-bold text-emerald-300">Answer</span>
              </div>

              <div className="space-y-3 py-2 text-left">
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                  {currentCard.back}
                </p>

                {currentCard.syntax && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center space-x-1">
                      <Code2 className="w-3 h-3" />
                      <span>Syntax Example:</span>
                    </div>
                    {currentCard.syntax}
                  </div>
                )}

                {currentCard.note && (
                  <div className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    💡 <strong>Takeaway:</strong> {currentCard.note}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Click to flip back to question</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Card</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
        >
          <span>Next Card</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
