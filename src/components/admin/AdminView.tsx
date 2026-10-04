import React, { useState } from 'react';
import { DEFAULT_QUESTIONS } from '../../data/questions';
import { ALL_TOPICS } from '../../services/storage';
import { DifficultyLevel, MongoTopic, Question, QuestionType, CurriculumLevel } from '../../types';
import { loadCustomQuestions, saveCustomQuestions, resetAllData, loadProgress } from '../../services/storage';
import { verifyAdminPassword, changeAdminPassword } from '../../services/security';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Search,
  CheckCircle,
  FileCode,
  Check,
  LogOut,
  AlertCircle
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('mongo_quiz_admin_authed') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Recovery Modal state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPhraseInput, setRecoveryPhraseInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Question Management state
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => loadCustomQuestions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importedStatus, setImportedStatus] = useState<string | null>(null);

  // Form fields for new question
  const [newTopic, setNewTopic] = useState<MongoTopic>('CRUD Operations');
  const [newLevel, setNewLevel] = useState<CurriculumLevel>(3);
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('Medium');
  const [newType, setNewType] = useState<QuestionType>('write-command');
  const [newTitle, setNewTitle] = useState('');
  const [newScenario, setNewScenario] = useState('');
  const [newDataset, setNewDataset] = useState('GptData02');
  const [newExpectedCommand, setNewExpectedCommand] = useState('');
  const [newOptionsText, setNewOptionsText] = useState('Option A\nOption B\nOption C\nOption D');
  const [newCorrectOptionIndex, setNewCorrectOptionIndex] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [newMisconception, setNewMisconception] = useState('');
  const [newConceptFocus, setNewConceptFocus] = useState('');
  const [newPoints, setNewPoints] = useState(10);

  const progress = loadProgress();
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('mongo_quiz_admin_authed', 'true');
      setAuthError(null);
      setPasswordInput('');
    } else {
      setAuthError('Incorrect admin password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('mongo_quiz_admin_authed');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changeAdminPassword(recoveryPhraseInput, newPasswordInput);
    if (res.success) {
      setRecoveryMessage({ text: res.message, isError: false });
      setTimeout(() => {
        setShowRecovery(false);
        setRecoveryPhraseInput('');
        setNewPasswordInput('');
        setRecoveryMessage(null);
      }, 2000);
    } else {
      setRecoveryMessage({ text: res.message, isError: true });
    }
  };

  // If locked, show Password Protection Barrier
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fadeIn p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Instructor Portal Locked
          </h2>
          <p className="text-xs text-slate-400">
            Enter the authorized instructor password to manage questions, data, and analytics.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full bg-slate-950 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            Unlock Portal
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowRecovery(!showRecovery)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center space-x-1 mx-auto"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Forgot or reset password via recovery phrase?</span>
          </button>
        </div>

        {/* Recovery Phrase Modal / Accordion */}
        {showRecovery && (
          <form onSubmit={handleChangePassword} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs animate-fadeIn">
            <div className="font-bold text-slate-200">Reset Admin Password</div>
            <p className="text-slate-400 text-[11px]">
              Provide the master recovery phrase to change your administrator password.
            </p>

            {recoveryMessage && (
              <div className={`p-2 rounded-lg text-[11px] ${recoveryMessage.isError ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'}`}>
                {recoveryMessage.text}
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Recovery Phrase</label>
              <input
                type="text"
                value={recoveryPhraseInput}
                onChange={(e) => setRecoveryPhraseInput(e.target.value)}
                placeholder="Enter recovery phrase..."
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">New Admin Password</label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Min 6 characters..."
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
            >
              Verify & Update Password
            </button>
          </form>
        )}
      </div>
    );
  }

  // --- UNLOCKED INSTRUCTOR PORTAL ---

  const filteredQuestions = allQuestions.filter((q) => {
    const matchesTopic = selectedTopic === 'All' || q.topic === selectedTopic;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      q.title.toLowerCase().includes(term) ||
      (q.scenario && q.scenario.toLowerCase().includes(term)) ||
      (q.expectedCommand && q.expectedCommand.toLowerCase().includes(term));
    return matchesTopic && matchesSearch;
  });

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExplanation.trim()) {
      alert('Please provide at least a title and an explanation.');
      return;
    }

    const created: Question = {
      id: 'custom_' + Date.now(),
      topic: newTopic,
      level: Number(newLevel) as CurriculumLevel,
      difficulty: newDifficulty,
      type: newType,
      title: newTitle.trim(),
      scenario: newScenario.trim() || undefined,
      datasetName: newDataset,
      expectedCommand: ['write-command', 'fix-query'].includes(newType) ? newExpectedCommand.trim() : undefined,
      options: ['multiple-choice', 'predict-output', 'find-error', 'scenario', 'multiple-select', 'true-false'].includes(newType)
        ? newOptionsText.split('\n').map((s) => s.trim()).filter(Boolean)
        : undefined,
      correctOptionIndex: ['multiple-choice', 'predict-output', 'find-error', 'scenario', 'true-false'].includes(newType)
        ? Number(newCorrectOptionIndex)
        : undefined,
      correctOptionIndices: newType === 'multiple-select' ? [Number(newCorrectOptionIndex)] : undefined,
      explanation: newExplanation.trim(),
      misconception: newMisconception.trim() || undefined,
      conceptFocus: newConceptFocus.trim() || newTopic,
      points: Number(newPoints) || 10
    };

    const updated = [...customQuestions, created];
    setCustomQuestions(updated);
    saveCustomQuestions(updated);
    setShowAddForm(false);
    // Reset form
    setNewTitle('');
    setNewScenario('');
    setNewExpectedCommand('');
    setNewExplanation('');
    setNewMisconception('');
    setNewConceptFocus('');
  };

  const handleDeleteQuestion = (id: string) => {
    if (!id.startsWith('custom_')) {
      alert('Built-in system questions cannot be deleted. Only custom instructor questions can be removed.');
      return;
    }
    const updated = customQuestions.filter((q) => q.id !== id);
    setCustomQuestions(updated);
    saveCustomQuestions(updated);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'mongodb_quiz_questions_bank.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item) => item.title && item.topic && item.explanation);
          const merged = [...customQuestions, ...valid];
          setCustomQuestions(merged);
          saveCustomQuestions(merged);
          setImportedStatus(`Successfully imported ${valid.length} questions!`);
          setTimeout(() => setImportedStatus(null), 3000);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all local student scores, streaks, and custom questions?')) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticated Instructor Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Instructor Portal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage question banks, author custom MongoDB questions, export/import JSON, and inspect learner metrics.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Question'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Download full question bank as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleResetProgress}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
            title="Reset student test progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-red-400 transition-colors"
            title="Lock instructor portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {importedStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{importedStatus}</span>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold block">Total In Question Bank</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">{allQuestions.length} Questions</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold block">Custom Added Questions</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{customQuestions.length} Custom</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold block">Student Questions Attempted</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">{progress.questionsAttempted}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold block">Overall Student Accuracy</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {progress.questionsAttempted > 0 ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Authoring Form Modal / Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleCreateQuestion}
          className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Create New Practical Question</span>
            </h3>
            <span className="text-xs text-slate-400">All fields validated locally</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Topic</label>
              <select
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value as MongoTopic)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                {ALL_TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Level (1 to 9)</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(Number(e.target.value) as CurriculumLevel)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                  <option key={l} value={l}>Level {l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Difficulty</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as DifficultyLevel)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Question Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as QuestionType)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="write-command">Type D — Write the Command</option>
                <option value="multiple-choice">Type A — Multiple Choice</option>
                <option value="predict-output">Type B — Predict the Output</option>
                <option value="find-error">Type C — Find the Error</option>
                <option value="scenario">Type F — Scenario Question</option>
                <option value="multiple-select">Type H — Multiple Select</option>
                <option value="true-false">Type I — True / False</option>
                <option value="fix-query">Type J — Fix the Query</option>
              </select>
            </div>
          </div>

          <div className="text-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Find Overdue Accounts with $gt"
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Dataset</label>
                <select
                  value={newDataset}
                  onChange={(e) => setNewDataset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                >
                  <option value="GptData02">School (GptData02)</option>
                  <option value="hospital">Hospital (patients)</option>
                  <option value="banking">Banking (accounts)</option>
                  <option value="ecommerce">E-Commerce (products)</option>
                  <option value="hotel">Hotel (reservations)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Scenario / Description</label>
              <textarea
                value={newScenario}
                onChange={(e) => setNewScenario(e.target.value)}
                placeholder="Detailed instructions or context for student..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              />
            </div>

            {['write-command', 'fix-query'].includes(newType) ? (
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Expected MongoDB Command (Shell Syntax)
                </label>
                <input
                  type="text"
                  value={newExpectedCommand}
                  onChange={(e) => setNewExpectedCommand(e.target.value)}
                  placeholder='db.accounts.find({ balance: { $gte: 10000 } })'
                  required
                  className="w-full bg-slate-950 border border-slate-700 font-mono text-emerald-400 rounded-xl p-2.5 text-xs"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Options (One per line)
                  </label>
                  <textarea
                    value={newOptionsText}
                    onChange={(e) => setNewOptionsText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 font-mono text-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Correct Option Index (0-based: 0=A, 1=B, 2=C, 3=D)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newCorrectOptionIndex}
                    onChange={(e) => setNewCorrectOptionIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Explanation</label>
                <input
                  type="text"
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Why this works..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Misconception</label>
                <input
                  type="text"
                  value={newMisconception}
                  onChange={(e) => setNewMisconception(e.target.value)}
                  placeholder="Common misunderstanding..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Concept Focus</label>
                <input
                  type="text"
                  value={newConceptFocus}
                  onChange={(e) => setNewConceptFocus(e.target.value)}
                  placeholder="e.g. $in with numeric comparison"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
            >
              Save Question to Bank
            </button>
          </div>
        </form>
      )}

      {/* Question Bank Explorer & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white">
              Question Bank Directory
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredQuestions.length} shown)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-xl px-2.5 py-1.5"
            >
              <option value="All">All Topics</option>
              {ALL_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
          {filteredQuestions.map((q) => {
            const isCustom = q.id.startsWith('custom_');
            return (
              <div
                key={q.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {q.id}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {q.topic}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      • Level {q.level} • {q.difficulty}
                    </span>
                    {isCustom && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        Custom
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {q.title}
                  </h4>
                  {q.expectedCommand && (
                    <p className="font-mono text-xs text-emerald-400/80 truncate max-w-xl">
                      {q.expectedCommand}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    {q.points} pts
                  </span>
                  {isCustom ? (
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete custom question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5">
                      System
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
