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
import { LearnerGamificationView } from './components/learner/LearnerGamificationView';
import { LearnerFeedbackView } from './components/learner/LearnerFeedbackView';
import { DEFAULT_QUESTIONS } from './data/questions';

import { QuizConfigModal } from './components/quiz/QuizConfigModal';
import { QuizSetupOptions } from './services/quizEngine';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeedDataOpen, setIsSeedDataOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configModalMode, setConfigModalMode] = useState<QuizMode>('practice');
  const [configModalTopic, setConfigModalTopic] = useState<MongoTopic | undefined>(undefined);
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [progress, setProgress] = useState(loadProgress());

  // Reload progress when tabs or quiz completes
  useEffect(() => {
    setProgress(loadProgress());
  }, [currentTab, activeSession]);

  const handleStartQuiz = (mode: QuizMode, topic?: MongoTopic, mockExamId?: string, extraOptions?: Partial<QuizSetupOptions>) => {
    const session = createSession({
      mode,
      selectedTopic: topic,
      mockExamId,
      ...extraOptions
    });
    setActiveSession(session);
  };

  const handleOpenConfigModal = (mode: QuizMode = 'practice', topic?: MongoTopic) => {
    setConfigModalMode(mode);
    setConfigModalTopic(topic);
    setIsConfigModalOpen(true);
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
    const newSession = createSession({
      mode: activeSession.mode,
      selectedTopic: activeSession.selectedTopic,
      mockExamId: activeSession.mockExamId,
      questionCount: activeSession.totalQuestions
    });
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
            onOpenConfig={(mode, topic) => handleOpenConfigModal(mode, topic)}
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

      case 'learner-hub':
        return (
          <LearnerGamificationView
            progress={progress}
            onGoToPractice={() => handleStartQuiz('practice')}
            onGoToMockExams={() => handleSelectTab('mock-exam-selector')}
          />
        );

      case 'feedback':
        return <LearnerFeedbackView />;

      case 'admin':
        return <AdminView />;

      default:
        return (
          <Dashboard
            progress={progress}
            onStartQuiz={(mode, topic, mockExamId) => handleStartQuiz(mode, topic, mockExamId)}
            onOpenConfig={(mode, topic) => handleOpenConfigModal(mode, topic)}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            onOpenSeedData={() => setIsSeedDataOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        currentStreak={progress.currentStreak}
        bestScore={progress.bestMockScore}
        onOpenSeedData={() => setIsSeedDataOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigateTab={(tab) => handleSelectTab(tab)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full max-w-full overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Live Datasets Modal Explorer */}
      <SeedDataModal
        isOpen={isSeedDataOpen}
        onClose={() => setIsSeedDataOpen(false)}
      />

      {/* Custom Quiz Setup Modal */}
      <QuizConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        mode={configModalMode}
        initialTopic={configModalTopic}
        onStartConfiguredQuiz={(config) => {
          handleStartQuiz(config.mode, config.selectedTopic, undefined, {
            questionCount: config.questionCount,
            difficulty: config.difficulty,
            level: config.level,
            useAiGeneration: config.useAiGeneration
          });
        }}
      />
    </div>
  );
}

export default App;
