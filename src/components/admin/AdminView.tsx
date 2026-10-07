import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types/admin';
import {
  authenticateAdminUser,
  getAdminUsers,
  getSiteCustomization,
  DEFAULT_SITE_CONFIG,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
  resetAdminPasswordWithRecoveryPhrase,
  acceptAdminInvitation,
  getFreshAdminUser,
  getDeletionStatements,
  deleteSubAdmin,
  isMasterAccount
} from '../../services/adminService';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminBrandingConfig } from './AdminBrandingConfig';
import { AdminDatabaseManager } from './AdminDatabaseManager';
import { AdminUserTracker } from './AdminUserTracker';
import { AdminManagementRBAC } from './AdminManagementRBAC';
import { AdminShareHub } from './AdminShareHub';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { AdminFeedbackView } from './AdminFeedbackView';
import { AdminStatementsBoard } from './AdminStatementsBoard';
import { DEFAULT_QUESTIONS } from '../../data/questions';
import { ALL_TOPICS } from '../../services/storage';
import { DifficultyLevel, MongoTopic, Question, QuestionType, CurriculumLevel } from '../../types';
import { loadCustomQuestions, saveCustomQuestions } from '../../services/storage';
import { getFeedbackEntries } from '../../services/feedbackService';

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
  ShieldAlert,
  Clock,
  RefreshCw,
  MessageSquare,
  X,
  FileText
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'branding'
  | 'databases'
  | 'questions'
  | 'users'
  | 'admins'
  | 'share'
  | 'security'
  | 'feedback'
  | 'statements';

export const AdminView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const raw = sessionStorage.getItem('mongo_quiz_logged_admin_user');
    if (!raw) return null;
    try {
      const cached: AdminUser = JSON.parse(raw);
      const fresh = getFreshAdminUser(cached.id);
      if (!fresh || fresh.status !== 'active') {
        sessionStorage.removeItem('mongo_quiz_logged_admin_user');
        return null;
      }
      return fresh;
    } catch {
      return null;
    }
  });

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentAdminTab, setCurrentAdminTab] = useState<AdminTab>('overview');

  // Keep the session in sync with the stored admin record (role/permission/status changes)
  useEffect(() => {
    if (!currentUser) return;
    const sync = () => {
      const fresh = getFreshAdminUser(currentUser.id);
      if (!fresh || fresh.status !== 'active') {
        sessionStorage.removeItem('mongo_quiz_logged_admin_user');
        setCurrentUser(null);
        setAuthError(!fresh ? 'Your administrator account has been removed.' : 'Your administrator account has been suspended.');
        return;
      }
      if (JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        sessionStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify(fresh));
        setCurrentUser(fresh);
      }
    };
    sync();
    const interval = setInterval(sync, 5000);
    window.addEventListener('storage', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', sync);
    };
  }, [currentUser, currentAdminTab]);

  const TAB_PERMISSIONS: Partial<Record<AdminTab, keyof AdminUser['permissions']>> = {
    branding: 'canEditBranding',
    databases: 'canManageDatabases',
    questions: 'canManageQuestions',
    users: 'canViewLearnerData',
    admins: 'canManageSubAdmins',
    share: 'canExportData',
    security: 'canResetSystem'
  };

  const canAccessTab = (tab: AdminTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super-admin') return true;
    if (tab === 'statements') return false;
    const perm = TAB_PERMISSIONS[tab];
    return !perm || Boolean(currentUser.permissions?.[perm]);
  };

  // If the active tab becomes forbidden (e.g. after a role change), fall back to overview
  useEffect(() => {
    if (currentUser && !canAccessTab(currentAdminTab)) {
      setCurrentAdminTab('overview');
    }
  }, [currentUser, currentAdminTab]);

  // Login Page Password Reset Modal State
  const [showLoginResetModal, setShowLoginResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<'email_otp' | 'recovery_phrase'>('email_otp');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetMsg, setResetMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  // Countdown timer for email request anti-spam cooldown
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Recovery phrase reset state
  const [recoveryPhraseInput, setRecoveryPhraseInput] = useState('');
  const [recoveryUsernameOrEmail, setRecoveryUsernameOrEmail] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Login Page Invitation Activation Modal State
  const [showLoginInviteModal, setShowLoginInviteModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [acceptedInviteDetails, setAcceptedInviteDetails] = useState<{ recoveryPhrase: string; role: string } | null>(null);

  // Question Management state
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  useEffect(() => {
    loadCustomQuestions().then(setCustomQuestions);
  }, []);
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

  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE_CONFIG);
  useEffect(() => {
    getSiteCustomization().then(setSiteConfig);
  }, []);
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [unreadStatementsCount, setUnreadStatementsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (currentUser?.role === 'super-admin') {
        const feedbacks = await getFeedbackEntries();
        const totalFeedbacks = feedbacks.length;
        const lastSeenFBCount = Number(localStorage.getItem('mongo_quiz_last_seen_feedback_count') || '0');
        
        if (currentAdminTab === 'feedback') {
          localStorage.setItem('mongo_quiz_last_seen_feedback_count', totalFeedbacks.toString());
          setUnreadFeedbackCount(0);
        } else {
          setUnreadFeedbackCount(Math.max(0, totalFeedbacks - lastSeenFBCount));
        }

        const statements = await getDeletionStatements();
        const totalStatements = statements.length;
        const lastSeenStatementsCount = Number(localStorage.getItem('mongo_quiz_last_seen_statements_count') || '0');

        if (currentAdminTab === 'statements') {
          localStorage.setItem('mongo_quiz_last_seen_statements_count', totalStatements.toString());
          setUnreadStatementsCount(0);
        } else {
          setUnreadStatementsCount(Math.max(0, totalStatements - lastSeenStatementsCount));
        }
      }
    };
    fetchCounts();
  }, [currentAdminTab, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authenticateAdminUser(usernameOrEmail, passwordInput);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      sessionStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify(res.user));
      setAuthError(null);
      setPasswordInput('');

      if (res.user.id === 'admin_master_1') {
        const feedbacks = await getFeedbackEntries();
        const statements = await getDeletionStatements();
        const newFB = Math.max(0, feedbacks.length - Number(localStorage.getItem('mongo_quiz_last_seen_feedback_count') || '0'));
        const newStatements = Math.max(0, statements.length - Number(localStorage.getItem('mongo_quiz_last_seen_statements_count') || '0'));

        let msg = `Welcome back, ${res.user.displayName}!`;
        if (newFB > 0 || newStatements > 0) {
          msg += `\n\nNotifications:`;
          if (newFB > 0) msg += `\n- ${newFB} new Learner Feedback/Complaints`;
          if (newStatements > 0) msg += `\n- ${newStatements} new Account Deletion Statements`;
        }
        window.alert(msg);
      }
    } else {
      setAuthError(res.error || 'Invalid credentials. Please verify and try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('mongo_quiz_logged_admin_user');
  };

  const handleSelfDelete = async () => {
    if (!currentUser) return;
    if (isMasterAccount(currentUser)) {
      alert("The Master Super Admin account cannot be deleted.");
      return;
    }
    
    if (window.confirm("Are you absolutely sure you want to permanently delete your administrator account? This action cannot be undone.")) {
      const res = await deleteSubAdmin(currentUser.id, currentUser.username, 'self-resignation', 'Administrator chose to delete account.');
      if (res.success) {
        alert("Your account has been successfully deleted.");
        handleLogout();
      } else {
        alert(res.message);
      }
    }
  };

  const handleRequestLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resetCooldown > 0) return;
    setIsSendingLoginOtp(true);
    setResetMsg(null);

    try {
      const res = await requestPasswordResetOtp(resetIdentifier);
      if (res.success) {
        setResetMsg({ text: res.message, isError: false });
        setResetStep(2);
        setResetCooldown(60); // 60 seconds cooldown to avoid spamming
      } else {
        setResetMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setResetMsg({ text: err?.message || "Failed to dispatch reset OTP.", isError: true });
    } finally {
      setIsSendingLoginOtp(false);
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
        setResetMsg(null);
      }, 2500);
    } else {
      setResetMsg({ text: cRes.message, isError: true });
    }
  };

  const handleRecoveryPhraseReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMsg(null);
    const res = resetAdminPasswordWithRecoveryPhrase(
      recoveryUsernameOrEmail,
      recoveryPhraseInput,
      recoveryNewPassword
    );
    if (res.success) {
      setRecoveryMsg({ text: res.message, isError: false });
      if (res.username) {
        setUsernameOrEmail(res.username);
      }
      setTimeout(() => {
        setShowLoginResetModal(false);
        setRecoveryPhraseInput('');
        setRecoveryUsernameOrEmail('');
        setRecoveryNewPassword('');
        setRecoveryMsg(null);
      }, 2500);
    } else {
      setRecoveryMsg({ text: res.message, isError: true });
    }
  };

  const handleAcceptLoginInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await acceptAdminInvitation(inviteCodeInput, {
      username: inviteUsername,
      email: inviteEmail,
      displayName: inviteDisplayName,
      passwordPlain: invitePassword
    });

    if (res.success && res.user && res.recoveryPhrase && res.assignedRole) {
      setInviteMsg({ text: res.message, isError: false });
      setAcceptedInviteDetails({
        recoveryPhrase: res.recoveryPhrase,
        role: res.assignedRole
      });
      // We do not auto login right away. The user must copy the recovery phrase.
      // We will provide a button in the UI to proceed to login.
      sessionStorage.setItem('mongo_quiz_logged_admin_user_pending', JSON.stringify(res.user));
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
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('email_otp');
                      setShowLoginResetModal(true);
                      setResetMsg(null);
                      setRecoveryMsg(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                  <span className="text-slate-600 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('recovery_phrase');
                      setShowLoginResetModal(true);
                      setResetMsg(null);
                      setRecoveryMsg(null);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  >
                    Use Recovery Phrase
                  </button>
                </div>
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
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
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

        {/* Modal: Login Page Password Reset (Email OTP & Recovery Phrase) */}
        {showLoginResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[95vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Admin Password Recovery</span>
                </h3>
                <button
                  onClick={() => setShowLoginResetModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reset Mode Tabs */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode('email_otp');
                    setResetMsg(null);
                    setRecoveryMsg(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    resetMode === 'email_otp'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode('recovery_phrase');
                    setResetMsg(null);
                    setRecoveryMsg(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    resetMode === 'recovery_phrase'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Recovery Phrase</span>
                </button>
              </div>

              {/* Mode 1: Email OTP */}
              {resetMode === 'email_otp' && (
                <>
                  {resetMsg && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                      resetMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {resetMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                      <span>{resetMsg.text}</span>
                    </div>
                  )}

                  {resetStep === 1 ? (
                    <form onSubmit={handleRequestLoginOtp} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Registered Admin Email or Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. admin@emtvtech.com or username"
                          value={resetIdentifier}
                          onChange={(e) => setResetIdentifier(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          A real-time 6-digit OTP will be dispatched immediately to your mailbox.
                        </p>
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
                          disabled={isSendingLoginOtp || resetCooldown > 0}
                          className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                        >
                          {resetCooldown > 0 ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                              <span>Resend in {resetCooldown}s</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              <span>{isSendingLoginOtp ? 'Dispatching...' : 'Dispatch Reset OTP'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCompleteLoginReset} className="space-y-3.5 text-xs">
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
                        <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                        <span>A real-time 6-digit verification code has been dispatched to <strong>{resetIdentifier}</strong>. Please check your inbox and spam folder.</span>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Enter 6-Digit Email Verification Code *
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
                        <p className="text-[10px] text-slate-400 mt-1">
                          Don't want to use email OTP? Switch to the <button type="button" onClick={() => setResetMode('recovery_phrase')} className="text-purple-400 hover:underline font-semibold">Recovery Phrase</button> tab above to reset your password instantly.
                        </p>
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

                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <div className="flex items-center space-x-2">
                          {resetCooldown > 0 ? (
                            <span className="text-[11px] text-amber-400 font-mono flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              <span>Resend in {resetCooldown}s</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestLoginOtp()}
                              disabled={isSendingLoginOtp}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSendingLoginOtp ? 'animate-spin' : ''}`} />
                              <span>Resend Code</span>
                            </button>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setResetStep(1)}
                            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                          >
                            Update Password
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Mode 2: Instant Recovery Phrase Reset */}
              {resetMode === 'recovery_phrase' && (
                <form onSubmit={handleRecoveryPhraseReset} className="space-y-3.5 text-xs">
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200">
                    <p className="font-semibold text-purple-300 mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Instant Offline Verification</span>
                    </p>
                    <p className="text-[11px] text-purple-300/80">
                      Use the 16-character auto-generated recovery phrase (e.g. <code>REC-XXXX-XXXX-XXXX</code>) issued in your invitation email or your master recovery key to reset your password without email delivery delays.
                    </p>
                  </div>

                  {recoveryMsg && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                      recoveryMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {recoveryMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                      <span>{recoveryMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Admin Username or Registered Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. admin@emtvtech.com or username"
                      value={recoveryUsernameOrEmail}
                      onChange={(e) => setRecoveryUsernameOrEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Auto-Generated Recovery Phrase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REC-9B3A-8F12-4C7D or 09018537763"
                      value={recoveryPhraseInput}
                      onChange={(e) => setRecoveryPhraseInput(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-purple-300 font-mono rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Set New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters..."
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
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
                      className="px-5 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 flex items-center space-x-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Reset Password Instantly</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Login Page Accept Invitation */}
        {showLoginInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[95vh]">
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

              {!acceptedInviteDetails ? (
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
                    <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. jane@university.edu"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
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
                      className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                    >
                      Activate Account
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl text-center space-y-2">
                    <ShieldCheck className="w-8 h-8 text-purple-400 mx-auto" />
                    <p className="text-purple-200 font-medium">Your assigned role is <strong className="text-white">{acceptedInviteDetails.role.toUpperCase()}</strong>.</p>
                  </div>
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                    <p className="text-amber-400 font-bold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>CRITICAL: Save Your Recovery Phrase</span>
                    </p>
                    <p className="text-slate-300 text-xs">
                      If you ever forget your password, this phrase is the ONLY way to recover your account instantly. Please write it down and store it safely.
                    </p>
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <span className="text-lg font-mono font-bold text-amber-400 select-all">
                        {acceptedInviteDetails.recoveryPhrase}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const pendingUserStr = sessionStorage.getItem('mongo_quiz_logged_admin_user_pending');
                      if (pendingUserStr) {
                        sessionStorage.setItem('mongo_quiz_logged_admin_user', pendingUserStr);
                        sessionStorage.removeItem('mongo_quiz_logged_admin_user_pending');
                        setCurrentUser(JSON.parse(pendingUserStr));
                        setShowLoginInviteModal(false);
                      }
                    }}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                  >
                    I have saved my recovery phrase. Continue to Dashboard.
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- UNLOCKED INSTRUCTOR PORTAL NAVIGATION ---

  const allAdminNavTabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; perm?: keyof AdminUser['permissions'] }[] = [
    { id: 'overview', label: 'Overview & Telemetry', icon: LayoutDashboard },
    { id: 'branding', label: 'Branding & Tabs', icon: Palette, perm: 'canEditBranding' },
    { id: 'databases', label: 'Multi-Database Manager', icon: Database, perm: 'canManageDatabases' },
    { id: 'questions', label: 'Question Bank', icon: FileCode, badge: `${allQuestions.length}`, perm: 'canManageQuestions' },
    { id: 'users', label: 'Learner Cohort', icon: Users, perm: 'canViewLearnerData' },
    { id: 'admins', label: 'Admin Governance (RBAC)', icon: ShieldCheck, perm: 'canManageSubAdmins' },
    { id: 'share', label: 'Share & Export Hub', icon: Share2, perm: 'canExportData' },
    { id: 'feedback', label: 'Learner Feedback', icon: MessageSquare, badge: currentUser.role === 'super-admin' && unreadFeedbackCount > 0 ? `${unreadFeedbackCount} New` : undefined },
    { id: 'security', label: 'Security & Audit Logs', icon: Lock, perm: 'canResetSystem' },
    { id: 'statements', label: 'Statements Board', icon: FileText, badge: currentUser.role === 'super-admin' && unreadStatementsCount > 0 ? `${unreadStatementsCount} New` : undefined }
  ];
  const adminNavTabs = allAdminNavTabs.filter(t => canAccessTab(t.id));

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

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          {!isMasterAccount(currentUser) && (
            <button
              onClick={handleSelfDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
              title="Delete Administrator Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Logout</span>
          </button>
        </div>
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
      {canAccessTab(currentAdminTab) && currentAdminTab === 'overview' && (
        <AdminDashboardOverview onNavigateTab={(tab) => setCurrentAdminTab(tab as AdminTab)} />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'branding' && (
        <AdminBrandingConfig currentAdminUsername={currentUser.username} />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'databases' && (
        <AdminDatabaseManager currentAdminUsername={currentUser.username} />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'users' && (
        <AdminUserTracker />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'admins' && (
        <AdminManagementRBAC currentAdmin={currentUser} />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'share' && (
        <AdminShareHub />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'security' && (
        <AdminSecuritySettings />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'feedback' && (
        <AdminFeedbackView isSuperAdmin={currentUser.role === 'super-admin'} />
      )}

      {canAccessTab(currentAdminTab) && currentAdminTab === 'statements' && (
        <AdminStatementsBoard currentAdmin={currentUser} />
      )}

      {/* Question Bank Directory */}
      {canAccessTab(currentAdminTab) && currentAdminTab === 'questions' && (
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
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
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
                      <div className="flex flex-wrap items-center gap-1.5">
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
