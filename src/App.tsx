import React, { useState, useEffect } from 'react';
import { MongoTopic, QuizMode, QuizSession } from './types';
import { createSession } from './services/quizEngine';
import { loadProgress } from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { SeedDataModal } from './components/common/SeedDataModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { QuizController } from './components/quiz/QuizController';
import { TopicSelectorView } from './components/quiz/TopicSelectorView';
import { MockExamSelectorView } from './components/quiz/MockExamSelectorView';
import { FlashcardsView } from './components/study/FlashcardsView';
import { StudyNotesView } from './components/study/StudyNotesView';
import { AdminView } from './components/admin/AdminView';
import { ReviewView } from './components/review/ReviewView';
import { DEFAULT_QUESTIONS } from './data/questions';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeedDataOpen, setIsSeedDataOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [progress, setProgress] = useState(loadProgress());

  // Reload progress when tabs or quiz completes
  useEffect(() => {
    setProgress(loadProgress());
  }, [currentTab, activeSession]);

  const handleStartQuiz = (mode: QuizMode, topic?: MongoTopic, mockExamId?: string) => {
    const session = createSession(mode, topic, mockExamId);
    setActiveSession(session);
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'practice') {
      handleStartQuiz('practice');
    } else if (tab === 'quiz') {
      handleStartQuiz('quiz');
    } else if (tab === 'challenge') {
      handleStartQuiz('challenge');
    } else if (tab === 'mastery') {
      handleStartQuiz('mastery');
    } else if (tab === 'weak-areas') {
      handleStartQuiz('weak-areas');
    } else if (tab === 'revision') {
      handleStartQuiz('revision');
    } else if (tab === 'datasets') {
      setIsSeedDataOpen(true);
      return;
    } else {
      setActiveSession(null);
    }
    setCurrentTab(tab);
  };

  const handleRestartQuiz = () => {
    if (!activeSession) return;
    const newSession = createSession(activeSession.mode, activeSession.selectedTopic, activeSession.mockExamId);
    setActiveSession(newSession);
  };

  const handleGoHome = () => {
    setActiveSession(null);
    setCurrentTab('dashboard');
  };

  const renderContent = () => {
    // If there is an ongoing or just-completed quiz session
    if (activeSession) {
      return (
        <QuizController
          session={activeSession}
          onOpenSeedData={() => setIsSeedDataOpen(true)}
          onGoHome={handleGoHome}
          onRestartQuiz={handleRestartQuiz}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            progress={progress}
            onStartQuiz={(mode, topic, mockExamId) => {
              handleStartQuiz(mode, topic, mockExamId);
            }}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            onOpenSeedData={() => setIsSeedDataOpen(true)}
          />
        );

      case 'mock-exam-selector':
        return (
          <MockExamSelectorView
            bestMockScore={progress.bestMockScore}
            onSelectExam={(preset) => {
              handleStartQuiz('mock-test', undefined, preset.id);
            }}
          />
        );

      case 'topic-practice':
        return (
          <TopicSelectorView
            onSelectTopic={(topic) => {
              handleStartQuiz('topic-practice', topic);
            }}
          />
        );

      case 'flashcards':
        return <FlashcardsView />;

      case 'study-notes':
        return (
          <StudyNotesView
            onPracticeTopic={(topic) => {
              handleStartQuiz('topic-practice', topic);
            }}
          />
        );

      case 'review':
        return (
          <ReviewView
            questions={DEFAULT_QUESTIONS}
            attempts={{}}
            onBack={handleGoHome}
          />
        );

      case 'admin':
        return <AdminView />;

      default:
        return (
          <Dashboard
            progress={progress}
            onStartQuiz={(mode, topic, mockExamId) => handleStartQuiz(mode, topic, mockExamId)}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            onOpenSeedData={() => setIsSeedDataOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentStreak={progress.currentStreak}
        bestScore={progress.bestMockScore}
        onOpenSeedData={() => setIsSeedDataOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Live Datasets Modal Explorer */}
      <SeedDataModal
        isOpen={isSeedDataOpen}
        onClose={() => setIsSeedDataOpen(false)}
      />
    </div>
  );
}

export default App;
