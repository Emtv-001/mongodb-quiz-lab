import React, { useState } from 'react';
import { AdminUser } from '../../types/admin';
import {
  authenticateAdminUser,
  getAdminUsers,
  getSiteCustomization,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
  acceptAdminInvitation
} from '../../services/adminService';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminBrandingConfig } from './AdminBrandingConfig';
import { AdminDatabaseManager } from './AdminDatabaseManager';
import { AdminUserTracker } from './AdminUserTracker';
import { AdminManagementRBAC } from './AdminManagementRBAC';
import { AdminShareHub } from './AdminShareHub';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { DEFAULT_QUESTIONS } from '../../data/questions';
import { ALL_TOPICS } from '../../services/storage';
import { DifficultyLevel, MongoTopic, Question, QuestionType, CurriculumLevel } from '../../types';
import { loadCustomQuestions, saveCustomQuestions } from '../../services/storage';

import {
  LayoutDashboard,
  Palette,
  Database,
  FileCode,
  Users,
  ShieldCheck,
  Share2,
  Lock,
  LogOut,
  KeyRound,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Check,
  AlertCircle,
  Mail,
  Smartphone,
  X
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'branding'
  | 'databases'
  | 'questions'
  | 'users'
  | 'admins'
  | 'share'
  | 'security';

export const AdminView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const raw = sessionStorage.getItem('mongo_quiz_logged_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentAdminTab, setCurrentAdminTab] = useState<AdminTab>('overview');

  // Login Page OTP Password Reset Modal State
  const [showLoginResetModal, setShowLoginResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetMsg, setResetMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [simulatedResetOtp, setSimulatedResetOtp] = useState<string | null>(null);

  // Login Page Invitation Activation Modal State
  const [showLoginInviteModal, setShowLoginInviteModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ text: string; isError: boolean } | null>(null);

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

  const siteConfig = getSiteCustomization();
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = authenticateAdminUser(usernameOrEmail, passwordInput);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      sessionStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify(res.user));
      setAuthError(null);
      setPasswordInput('');
    } else {
      setAuthError(res.error || 'Invalid credentials. Please verify and try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('mongo_quiz_logged_admin_user');
  };

  const handleRequestLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestPasswordResetOtp(resetIdentifier);
    if (res.success) {
      setResetMsg({ text: res.message, isError: false });
      setSimulatedResetOtp(res.simulatedOtp || null);
      setResetStep(2);
    } else {
      setResetMsg({ text: res.message, isError: true });
    }
  };

  const handleCompleteLoginReset = (e: React.FormEvent) => {
    e.preventDefault();
    const vRes = verifyPasswordResetOtp(resetIdentifier, resetOtpCode);
    if (!vRes.success) {
      setResetMsg({ text: vRes.message, isError: true });
      return;
    }

    const cRes = completePasswordReset(resetIdentifier, newPasswordValue);
    if (cRes.success) {
      setResetMsg({ text: cRes.message, isError: false });
      setTimeout(() => {
        setShowLoginResetModal(false);
        setResetStep(1);
        setResetIdentifier('');
        setResetOtpCode('');
        setNewPasswordValue('');
        setSimulatedResetOtp(null);
        setResetMsg(null);
      }, 2500);
    } else {
      setResetMsg({ text: cRes.message, isError: true });
    }
  };

  const handleAcceptLoginInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const res = acceptAdminInvitation(inviteCodeInput, {
      username: inviteUsername,
      displayName: inviteDisplayName,
      passwordPlain: invitePassword
    });

    if (res.success && res.user) {
      setInviteMsg({ text: res.message, isError: false });
      setTimeout(() => {
        setShowLoginInviteModal(false);
        setCurrentUser(res.user!);
        sessionStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify(res.user));
      }, 1800);
    } else {
      setInviteMsg({ text: res.message, isError: true });
    }
  };

  // --- PASSWORD PROTECTION LOGIN BARRIER ---
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Instructor & Admin Portal
            </h2>
            <p className="text-xs text-slate-400">
              Enter your authorized administrator credentials to access governance and curriculum controls.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Username or Registered Email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter username or email..."
                required
                className="w-full bg-slate-950 border border-slate-700 text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginResetModal(true);
                    setResetMsg(null);
                    setSimulatedResetOtp(null);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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
              Sign In to Admin Hub
            </button>
          </form>

          {/* Accept Invite Link */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setShowLoginInviteModal(true);
                setInviteMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-purple-300 flex items-center justify-center space-x-1.5 mx-auto transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Have an invitation code? Complete registration</span>
            </button>
          </div>
        </div>

        {/* Modal: Login Page OTP Password Reset */}
        {showLoginResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Reset Password via One-Time Code</span>
                </h3>
                <button
                  onClick={() => setShowLoginResetModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  resetMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {resetMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                  <span>{resetMsg.text}</span>
                </div>
              )}

              {simulatedResetOtp && (
                <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-purple-300 flex items-center space-x-1.5">
                    <Mail className="w-4 h-4" />
                    <span>Simulated Dispatch (SMS / Email)</span>
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Your 6-digit verification code is <strong className="font-mono text-white bg-purple-900 px-1.5 py-0.5 rounded">{simulatedResetOtp}</strong>.
                  </p>
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleRequestLoginOtp} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Registered Email or Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. admin@emtvtech.com or 09018537763"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowLoginResetModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    >
                      Dispatch OTP Code
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCompleteLoginReset} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 748291"
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-center text-lg font-black tracking-widest rounded-xl py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Set New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters..."
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Login Page Accept Invitation */}
        {showLoginInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-purple-400" />
                  <span>Accept Admin Invitation</span>
                </h3>
                <button
                  onClick={() => setShowLoginInviteModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inviteMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  inviteMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {inviteMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                  <span>{inviteMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleAcceptLoginInvite} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invitation Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-98214"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-center rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={inviteDisplayName}
                    onChange={(e) => setInviteDisplayName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Desired Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. janesmith"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Set Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters..."
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowLoginInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  >
                    Activate Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- UNLOCKED INSTRUCTOR PORTAL NAVIGATION ---

  const adminNavTabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'Overview & Telemetry', icon: LayoutDashboard },
    { id: 'branding', label: 'Branding & Tabs', icon: Palette },
    { id: 'databases', label: 'Multi-Database Manager', icon: Database },
    { id: 'questions', label: 'Question Bank', icon: FileCode, badge: `${allQuestions.length}` },
    { id: 'users', label: 'Learner Cohort', icon: Users },
    { id: 'admins', label: 'Admin Governance (RBAC)', icon: ShieldCheck },
    { id: 'share', label: 'Share & Export Hub', icon: Share2 },
    { id: 'security', label: 'Security & Audit Logs', icon: Lock }
  ];

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExplanation.trim()) return;

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
        ? newOptionsText.split('\n').map(s => s.trim()).filter(Boolean)
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
    setNewTitle('');
    setNewScenario('');
    setNewExpectedCommand('');
    setNewExplanation('');
  };

  const handleDeleteQuestion = (id: string) => {
    if (!id.startsWith('custom_')) {
      alert("System built-in questions cannot be deleted. Only custom questions can be removed.");
      return;
    }
    const updated = customQuestions.filter(q => q.id !== id);
    setCustomQuestions(updated);
    saveCustomQuestions(updated);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allQuestions, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', 'mongodb_quiz_questions_bank.json');
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(item => item.title && item.topic && item.explanation);
          const merged = [...customQuestions, ...valid];
          setCustomQuestions(merged);
          saveCustomQuestions(merged);
          setImportedStatus(`Imported ${valid.length} questions successfully!`);
          setTimeout(() => setImportedStatus(null), 3000);
        }
      } catch {
        alert("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
  };

  const filteredQuestions = allQuestions.filter((q) => {
    const matchesTopic = selectedTopic === 'All' || q.topic === selectedTopic;
    const term = searchTerm.toLowerCase();
    return matchesTopic && (
      q.title.toLowerCase().includes(term) ||
      (q.scenario && q.scenario.toLowerCase().includes(term)) ||
      (q.expectedCommand && q.expectedCommand.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 px-2 sm:px-4 animate-fadeIn">
      {/* Top Admin Identity Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-slate-950 shadow-md">
            AD
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-white">{currentUser.displayName}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {currentUser.role}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">{currentUser.email} • {siteConfig.siteName}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors self-end sm:self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock & Logout</span>
        </button>
      </div>

      {/* Admin Module Tabs Switcher */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {adminNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentAdminTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Active Admin Submodule */}
      {currentAdminTab === 'overview' && (
        <AdminDashboardOverview onNavigateTab={(tab) => setCurrentAdminTab(tab as AdminTab)} />
      )}

      {currentAdminTab === 'branding' && (
        <AdminBrandingConfig currentAdminUsername={currentUser.username} />
      )}

      {currentAdminTab === 'databases' && (
        <AdminDatabaseManager currentAdminUsername={currentUser.username} />
      )}

      {currentAdminTab === 'users' && (
        <AdminUserTracker />
      )}

      {currentAdminTab === 'admins' && (
        <AdminManagementRBAC currentAdmin={currentUser} />
      )}

      {currentAdminTab === 'share' && (
        <AdminShareHub />
      )}

      {currentAdminTab === 'security' && (
        <AdminSecuritySettings />
      )}

      {/* Question Bank Directory */}
      {currentAdminTab === 'questions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <FileCode className="w-4 h-4" />
                <span>Question Bank & Curriculum Editor</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Practical Question Authoring & Directory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create custom practical questions across Levels 1–9, import JSON sets, and inspect grading models.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'Cancel Form' : 'New Question'}</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <label className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>

          {importedStatus && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{importedStatus}</span>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Author Practical Assessment Question</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Topic</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Level (1 to 9)</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Question Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as QuestionType)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  >
                    <option value="write-command">Type D — Write Command</option>
                    <option value="multiple-choice">Type A — Multiple Choice</option>
                    <option value="predict-output">Type B — Predict Output</option>
                    <option value="find-error">Type C — Find Error</option>
                    <option value="scenario">Type F — Scenario</option>
                    <option value="multiple-select">Type H — Multiple Select</option>
                    <option value="true-false">Type I — True / False</option>
                    <option value="fix-query">Type J — Fix Query</option>
                  </select>
                </div>
              </div>

              <div className="text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Question Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Find Active Patients in Cardiology"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Dataset</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">Scenario Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions for the student..."
                    value={newScenario}
                    onChange={(e) => setNewScenario(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>

                {['write-command', 'fix-query'].includes(newType) ? (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Expected Shell Command</label>
                    <input
                      type="text"
                      placeholder='db.patients.find({ department: "Cardiology", admitted: true })'
                      value={newExpectedCommand}
                      onChange={(e) => setNewExpectedCommand(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 font-mono text-emerald-400 text-xs rounded-xl p-2.5"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Options (One per line)</label>
                      <textarea
                        rows={3}
                        value={newOptionsText}
                        onChange={(e) => setNewOptionsText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Correct Index (0-based)</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={newCorrectOptionIndex}
                        onChange={(e) => setNewCorrectOptionIndex(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Explanation</label>
                    <input
                      type="text"
                      placeholder="Why this is correct..."
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Misconception</label>
                    <input
                      type="text"
                      placeholder="Common mistake..."
                      value={newMisconception}
                      onChange={(e) => setNewMisconception(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Concept Focus</label>
                    <input
                      type="text"
                      placeholder="Key rule..."
                      value={newConceptFocus}
                      onChange={(e) => setNewConceptFocus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Save Question
                </button>
              </div>
            </form>
          )}

          {/* Directory Explorer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-bold text-white text-sm">
                Question Bank Directory ({filteredQuestions.length} questions)
              </span>

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

            <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
              {filteredQuestions.map((q) => {
                const isCustom = q.id.startsWith('custom_');
                return (
                  <div key={q.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 rounded-xl transition-colors">
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
                      <h4 className="text-sm font-semibold text-white">{q.title}</h4>
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
                      {isCustom && (
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Custom Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
