import React, { useState, useEffect } from 'react';
import { StudentProgress, RegisteredLearnerAccount } from '../../types';
import { GlobalNotificationPopup } from '../common/GlobalNotificationPopup';
import { EMTVLoader } from '../common/EMTVLoader';
import { ProgressiveButton } from '../common/ProgressiveButton';
import {
  getRegisteredLearnerAccount,
  requestLearnerRegistrationOtp,
  verifyLearnerRegistrationOtp,
  loginLearner,
  logoutLearner,
  recoverLearnerAccountWithPhrase,
  getLearnerGamificationStats,
  deleteLearnerAccount,
  requestLearnerPasswordResetOtp,
  verifyLearnerPasswordResetOtp,
  completeLearnerPasswordReset,
  syncProgressToAtlas,
  fetchProgressFromAtlas,
  claimReferralBonus,
  fetchReferralStats
} from '../../services/learnerService';
import { sha256Sync } from '../../services/security';
import {
  Trophy,
  Award,
  Coins,
  Sparkles,
  Flame,
  ShieldCheck,
  KeyRound,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  X,
  Target,
  Zap,
  Layers,
  Database,
  Gift,
  Star,
  ChevronRight,
  TrendingUp,
  Crown,
  Mail,
  Clock,
  RefreshCw,
  Share2,
  Users,
  CheckCircle2
} from 'lucide-react';

interface LearnerGamificationViewProps {
  progress: StudentProgress;
  onGoToPractice: () => void;
  onGoToMockExams: () => void;
  maintenanceMode?: boolean;
  autoOpenRegister?: boolean;
}

export const LearnerGamificationView: React.FC<LearnerGamificationViewProps> = ({
  progress,
  onGoToPractice,
  onGoToMockExams,
  maintenanceMode,
  autoOpenRegister
}) => {
  const [account, setAccount] = useState<RegisteredLearnerAccount | null>(() => getRegisteredLearnerAccount());
  const [stats, setStats] = useState(() => getLearnerGamificationStats(progress));
  const [activeLoadingTask, setActiveLoadingTask] = useState<string | null>(null);

  // Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      const tabParam = params.get('tab');
      if ((urlRef && urlRef.trim()) || tabParam === 'register') {
        return true;
      }
      const currentAcc = getRegisteredLearnerAccount();
      const pendingRef = localStorage.getItem('mongo_quiz_pending_referral_code');
      if ((autoOpenRegister || (pendingRef && pendingRef.trim())) && !currentAcc) {
        return true;
      }
    } catch {}
    return false;
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Delete Account Form State
  const [deleteReasonCategory, setDeleteReasonCategory] = useState('completed-goals');
  const [deleteStatement, setDeleteStatement] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Register Form State
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [generatedPhrase, setGeneratedPhrase] = useState<string>('');

  // Anti-spam countdown timer for email requests
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Recovery Form State
  const [recoverMode, setRecoverMode] = useState<'email_otp' | 'recovery_phrase'>('email_otp');
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [recoverOtpCode, setRecoverOtpCode] = useState('');
  const [isSendingRecoverOtp, setIsSendingRecoverOtp] = useState(false);
  const [recoverCooldown, setRecoverCooldown] = useState(0);

  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverPhrase, setRecoverPhrase] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverMsg, setRecoverMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Phrase Reveal State
  const [showPhraseAuthModal, setShowPhraseAuthModal] = useState(false);
  const [phraseAuthPassword, setPhraseAuthPassword] = useState('');
  const [phraseAuthError, setPhraseAuthError] = useState<string | null>(null);
  const [isPhraseRevealed, setIsPhraseRevealed] = useState(false);

  // Anti-spam countdown timer for recover email requests
  useEffect(() => {
    if (recoverCooldown <= 0) return;
    const timer = setInterval(() => {
      setRecoverCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [recoverCooldown]);

  // Rewards store purchase
  const [storeMessage, setStoreMessage] = useState<string | null>(null);

  // Referral & Bonuses State
  const [regReferralCode, setRegReferralCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      if (urlRef && urlRef.trim()) {
        return urlRef.trim().toUpperCase();
      }
    } catch {}
    return localStorage.getItem('mongo_quiz_pending_referral_code') || '';
  });
  const [referralStats, setReferralStats] = useState<{
    referralCode?: string;
    referredBy?: string | null;
    referralCount?: number;
    pendingCount?: number;
    referralBonusCoins?: number;
    referralBonusXp?: number;
    referrals?: any[];
  } | null>(null);
  const [claimReferralCodeInput, setClaimReferralCodeInput] = useState('');
  const [isClaimingReferral, setIsClaimingReferral] = useState(false);
  const [claimReferralMsg, setClaimReferralMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedReferral, setCopiedReferral] = useState<'code' | 'link' | null>(null);

  // Auto-drive referral and registration flow
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      const tabParam = params.get('tab');
      const pendingRef = localStorage.getItem('mongo_quiz_pending_referral_code');
      const code = (urlRef && urlRef.trim()) || (pendingRef && pendingRef.trim());

      if (code) {
        const clean = code.toUpperCase();
        setRegReferralCode(clean);
        if (urlRef || tabParam === 'register' || autoOpenRegister || !account) {
          setShowRegisterModal(true);
        } else if (!claimReferralCodeInput) {
          setClaimReferralCodeInput(clean);
        }
      } else if (tabParam === 'register' || autoOpenRegister) {
        setShowRegisterModal(true);
      }
    } catch {}
  }, [account, autoOpenRegister]);


  const loadReferralData = async (accountId: string) => {
    try {
      const statsRes = await fetchReferralStats(accountId);
      if (statsRes && statsRes.success) {
        setReferralStats(statsRes);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (account?.id) {
      loadReferralData(account.id);
    } else {
      setReferralStats(null);
    }
  }, [account?.id]);

  const handleClaimReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.id || !claimReferralCodeInput.trim()) return;
    setIsClaimingReferral(true);
    setClaimReferralMsg(null);
    try {
      const res = await claimReferralBonus(account.id, claimReferralCodeInput.trim());
      if (res.success) {
        setClaimReferralMsg({ text: res.message, isError: false });
        setClaimReferralCodeInput('');
        refreshAccountState();
        if (account.id) {
          loadReferralData(account.id);
        }
      } else {
        setClaimReferralMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setClaimReferralMsg({ text: err?.message || 'Failed to claim referral bonus.', isError: true });
    } finally {
      setIsClaimingReferral(false);
    }
  };

  const handleCopyReferral = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopiedReferral(type);
    setTimeout(() => setCopiedReferral(null), 2500);
  };

  const refreshAccountState = () => {
    const acc = getRegisteredLearnerAccount();
    setAccount(acc);
    setStats(getLearnerGamificationStats(progress));
  };

  useEffect(() => {
    const handleUpdate = () => refreshAccountState();
    window.addEventListener('learner_account_updated', handleUpdate);
    return () => window.removeEventListener('learner_account_updated', handleUpdate);
  }, [progress]);

  // Initial cloud sync
  useEffect(() => {
    if (account?.id) {
      fetchProgressFromAtlas(account.id).then(() => {
        refreshAccountState();
      });
    }
  }, [account?.id]);

  // Background progress sync
  useEffect(() => {
    const handleSync = () => syncProgressToAtlas();
    window.addEventListener('mongo_quiz_progress_saved', handleSync);
    return () => window.removeEventListener('mongo_quiz_progress_saved', handleSync);
  }, []);

  // Handle Register Step 1: Request OTP and dispatch dynamic email
  const handleRequestRegistrationOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (emailCooldown > 0) return;
    setRegError(null);
    setIsSendingEmail(true);

    try {
      const res = await requestLearnerRegistrationOtp(regEmail, regUsername, regDisplayName, regPassword, regReferralCode);
      if (res.success) {
        setRegStep(2);
        setRegSuccessMsg(res.message);
        setGeneratedPhrase(res.recoveryPhrase || '');
        setEmailCooldown(60); // 60 seconds cooldown to avoid spamming
      } else {
        setRegError(res.message);
      }
    } catch (err: any) {
      setRegError(err?.message || "Failed to dispatch email verification.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Register Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setActiveLoadingTask('Provisioning learner account...');
    setIsSendingEmail(true);
    const res = await verifyLearnerRegistrationOtp(otpCodeInput);
    setIsSendingEmail(false);
    setActiveLoadingTask(null);
    
    if (res.success && res.account) {
      localStorage.removeItem('mongo_quiz_pending_referral_code');
      refreshAccountState();
      setShowRegisterModal(false);
      alert(`🎉 Registration complete! Welcome @${res.account.username}. +100 MongoCoins bonus added to your account!`);
      // Reset form
      setRegStep(1);
      setRegEmail('');
      setRegUsername('');
      setRegDisplayName('');
      setRegPassword('');
      setRegReferralCode('');
      setOtpCodeInput('');
      setRegSuccessMsg(null);
    } else {
      setRegError(res.message);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    setActiveLoadingTask('Verifying credentials...');
    setIsAuthenticating(true);
    const res = await loginLearner(loginIdentifier, loginPassword);
    setIsAuthenticating(false);
    setActiveLoadingTask(null);
    if (res.success && res.account) {
      refreshAccountState();
      setShowLoginModal(false);
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      setLoginError(res.message);
    }
  };

  // Handle Logout
  const handleLogoutClick = () => {
    if (confirm("Are you sure you want to log out of your gamification profile?")) {
      logoutLearner();
      refreshAccountState();
    }
  };

  // Handle Account Deletion
  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setDeleteError(null);
    setIsDeletingAccount(true);

    try {
      const res = await deleteLearnerAccount(account.id, deleteReasonCategory, deleteStatement, deletePassword);
      if (res.success) {
        setShowDeleteModal(false);
        setDeleteStatement('');
        setDeletePassword('');
        refreshAccountState();
        alert(res.message);
      } else {
        setDeleteError(res.message);
      }
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleRecoverRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (recoverCooldown > 0) return;
    setIsSendingRecoverOtp(true);
    setRecoverMsg(null);

    try {
      const res = await requestLearnerPasswordResetOtp(recoverIdentifier);
      if (res.success) {
        setRecoverMsg({ text: res.message, isError: false });
        setRecoverStep(2);
        setRecoverCooldown(60);
      } else {
        setActiveLoadingTask(null);
        setRecoverMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setRecoverMsg({ text: err?.message || "Failed to dispatch reset OTP.", isError: true });
    } finally {
      setIsSendingRecoverOtp(false);
    }
  };

  const handlePhraseAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhraseAuthError(null);

    if (!account) return;

    const inputHash = sha256Sync(phraseAuthPassword.trim());
    if (inputHash === account.passwordHash) {
      setIsPhraseRevealed(true);
      setShowPhraseAuthModal(false);
      setPhraseAuthPassword('');
    } else {
      setPhraseAuthError("Incorrect password.");
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverMsg(null);

    if (recoverMode === 'email_otp') {
      const vRes = verifyLearnerPasswordResetOtp(recoverOtpCode);
      if (!vRes.success) {
        setRecoverMsg({ text: vRes.message, isError: true });
        return;
      }
      setActiveLoadingTask('Resetting cryptographic keys...');
        const cRes = await completeLearnerPasswordReset(recoverNewPassword);
        setActiveLoadingTask(null);
      if (cRes.success) {
        setRecoverMsg({ text: cRes.message, isError: false });
        setTimeout(() => {
          setShowRecoverModal(false);
          setRecoverIdentifier('');
          setRecoverOtpCode('');
          setRecoverNewPassword('');
          setRecoverMsg(null);
          setRecoverStep(1);
        }, 2000);
      } else {
        setRecoverMsg({ text: cRes.message, isError: true });
      }
    } else {
      const res = await recoverLearnerAccountWithPhrase(recoverIdentifier, recoverPhrase, recoverNewPassword);
      if (res.success) {
        setRecoverMsg({ text: res.message, isError: false });
        setTimeout(() => {
          setShowRecoverModal(false);
          setRecoverIdentifier('');
          setRecoverPhrase('');
          setRecoverNewPassword('');
          setRecoverMsg(null);
        }, 2000);
      } else {
        setActiveLoadingTask(null);
        setRecoverMsg({ text: res.message, isError: true });
      }
    }
  };

  const getTierStyle = (tierName: string) => {
    const base = tierName.replace(/[0-9 ]/g, '').trim();
    const map: Record<string, { bg: string; text: string; border: string }> = {
      'Master': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40' },
      'Grandmaster': { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-300', border: 'border-fuchsia-500/40' },
      'Mythic': { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/40' },
      'Celestial': { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/40' },
      'Galactic': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/40' },
      'Cosmic': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' },
      'Astral': { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/40' },
      'Ascendant': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
      'Ethereal': { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/40' },
      'Omniscient': { bg: 'bg-amber-600/15', text: 'text-amber-400', border: 'border-amber-600/40' },
      'Diamond': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' },
      'Platinum': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
      'Gold': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40' },
      'Silver': { bg: 'bg-slate-400/15', text: 'text-slate-200', border: 'border-slate-400/40' },
      'Bronze': { bg: 'bg-orange-600/15', text: 'text-orange-300', border: 'border-orange-500/40' }
    };
    return map[base] || map['Bronze'];
  };

  const activeTierStyle = getTierStyle(stats.tier);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fadeIn w-full max-w-full min-w-0">
      {/* Top Profile & Registration Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Learner Gamification Hub</span>
              </span>

              <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${activeTierStyle.bg} ${activeTierStyle.text} ${activeTierStyle.border}`}>
                {stats.tier} Tier
              </span>

              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.coins} MongoCoins (🪙)</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {account ? `Welcome, ${account.displayName}` : 'Earn Personal Points & MongoCoins'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {account
                ? `You are signed in as @${account.username}. Your earned points, achievements, and personal mastery stats are securely synced and saved.`
                : 'Registration is optional! You can explore anonymously as a guest, or register your profile with an email OTP and auto-generated recovery phrase to claim your personal points and rewards.'}
            </p>

            {/* Quick CTAs based on registration state */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {!account ? (
                <>
                  <button
                    onClick={() => {
                      setShowRegisterModal(true);
                      setRegStep(1);
                      setRegError(null);
                    }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register / Claim Profile (Free)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setLoginError(null);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Sign In</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{account.email}</span>
                  </div>

                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sign Out</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteError(null);
                      setDeleteStatement('');
                      setDeletePassword('');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                    title="Delete Account and Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rank Badge Box */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center min-w-[200px] space-y-2 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Personal Rank Level</span>
              <span className="text-3xl font-black font-mono text-white">Lvl {stats.rank}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              {stats.xp} Total XP
            </span>
          </div>
        </div>

        {/* Registered Recovery Phrase Callout if logged in */}
        {account?.recoveryPhrase && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/50 p-3.5 rounded-xl border border-purple-500/20">
            <div className="flex items-center space-x-2 text-purple-300">
              <KeyRound className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                <strong>Your Auto-Generated Recovery Phrase:</strong>{' '}
                {isPhraseRevealed ? (
                  <code className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-purple-500/30 ml-1">
                    {account.recoveryPhrase}
                  </code>
                ) : (
                  <span className="text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 ml-1 tracking-[0.2em]">
                    ••••••••••••••••
                  </span>
                )}
              </span>
            </div>
            {isPhraseRevealed ? (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(account.recoveryPhrase!);
                  alert(`Copied Recovery Phrase: ${account.recoveryPhrase}`);
                }}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Phrase</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPhraseAuthModal(true)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold self-start sm:self-auto transition-colors"
              >
                Reveal Phrase
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Gamification Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full min-w-0">
        {/* Total Points (XP) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Experience (XP)</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400 truncate">
            {stats.xp} XP
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Next Tier at {stats.nextTierXp} XP
          </div>
        </div>

        {/* MongoCoins Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">MongoCoins (🪙)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 truncate">
            {stats.coins} 🪙
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Earned via Solved Questions & Streaks
          </div>
        </div>

        {/* Personal Level Rank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Mastery Level</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 truncate">
            Level {stats.rank}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Your Personal Tier
          </div>
        </div>

        {/* Active Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 truncate">
            {progress.currentStreak} Days
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            +15 🪙 Coin Bonus Daily
          </div>
        </div>
      </div>

      {/* Referrals & Study Circle Bonuses Hub */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 w-full min-w-0 relative overflow-hidden">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Study Circle Referrals & Bonuses</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Invite your peers, classmates, and fellow developers to prepare for MongoDB certification. You earn{' '}
              <strong className="text-amber-300 font-mono">+250 Coins</strong> &{' '}
              <strong className="text-purple-300 font-mono">+500 XP</strong> for every friend who joins. Your friends get an instant{' '}
              <strong className="text-emerald-300 font-mono">+150 Coins</strong> &{' '}
              <strong className="text-purple-300 font-mono">+250 XP</strong> welcome bonus!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center space-x-1.5 shadow-sm">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Dual Referral Bonuses</span>
            </span>
          </div>
        </div>

        {account ? (
          <div className="space-y-6">
            {/* Share Code & Link Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unique Code Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Your Unique Referral Code
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 font-mono font-black text-lg sm:text-xl text-amber-400 tracking-wider truncate">
                    {account.referralCode || referralStats?.referralCode || 'GENERATING...'}
                  </div>
                  <button
                    onClick={() => handleCopyReferral(account.referralCode || referralStats?.referralCode || '', 'code')}
                    disabled={!account.referralCode && !referralStats?.referralCode}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center space-x-1.5 active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    {copiedReferral === 'code' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Share this code with friends to enter during registration.
                </p>
              </div>

              {/* Shareable Link Box & Social Buttons */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Instant Referral Link & Social Sharing
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      (account.referralCode || referralStats?.referralCode)
                        ? `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?ref=${account.referralCode || referralStats?.referralCode}&tab=register`
                        : 'Generating referral link...'
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none select-all truncate"
                  />
                  <button
                    onClick={() => {
                      const code = account.referralCode || referralStats?.referralCode;
                      if (!code) return;
                      const link = `${window.location.origin}${window.location.pathname}?ref=${code}&tab=register`;
                      handleCopyReferral(link, 'link');
                    }}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center space-x-1.5 active:scale-95 shadow-md shadow-purple-600/20"
                  >
                    {copiedReferral === 'link' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Social Share Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Master MongoDB quizzes and exam practice with me! Register via my referral link to get +150 bonus MongoCoins and +250 XP: ${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?ref=${account.referralCode || referralStats?.referralCode}&tab=register`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Sharpening my MongoDB skills on MongoDB Quiz Lab! Register via my invite link to claim +150 bonus MongoCoins and +250 XP: ${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?ref=${account.referralCode || referralStats?.referralCode}&tab=register`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-slate-700"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Twitter / X</span>
                  </a>

                  {typeof navigator !== 'undefined' && (navigator as any).share && (
                    <button
                      onClick={() => {
                        const code = account.referralCode || referralStats?.referralCode;
                        if (!code) return;
                        (navigator as any).share({
                          title: 'Join me on MongoDB Quiz Lab!',
                          text: `Use my referral link to register and get +150 bonus MongoCoins and +250 XP!`,
                          url: `${window.location.origin}${window.location.pathname}?ref=${code}&tab=register`
                        }).catch(() => {});
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors border border-slate-700"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Device Share</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Referral Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Verified Dedicated Referrals</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {referralStats?.referralCount ?? account.referralCount ?? 0}
                </div>
                <p className="text-[11px] text-slate-500">
                  {(referralStats?.pendingCount || 0) > 0
                    ? `${referralStats?.pendingCount} friend(s) in progress toward dedication`
                    : 'Dedicated learners in your network'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Referral MongoCoins Earned</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  +{referralStats?.referralBonusCoins ?? account.referralBonusCoins ?? 0} 🪙
                </div>
                <p className="text-[11px] text-slate-500">+250 🪙 per dedicated friend</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Referral Experience (XP) Earned</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
                  +{referralStats?.referralBonusXp ?? account.referralBonusXp ?? 0} XP
                </div>
                <p className="text-[11px] text-slate-500">+500 XP per dedicated friend</p>
              </div>
            </div>

            {/* Post-Registration Claim Form OR Referred By Badge */}
            {(account.referredBy || referralStats?.referredBy) ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>
                      You were referred by{' '}
                      <strong className="text-white font-mono font-bold">
                        @{account.referredBy || referralStats?.referredBy}
                      </strong>
                      . Your <strong className="text-amber-300">+150 Coins</strong> &{' '}
                      <strong className="text-purple-300">+250 XP</strong> welcome bonus was credited immediately!
                    </span>
                  </div>
                  <span className="text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    Welcome Bonus Active
                  </span>
                </div>

                {/* Dedication progress to unlock mentor bonus */}
                {(() => {
                  const targetXp = 750;
                  const targetCoins = 350;
                  const isDedicated = stats.xp >= targetXp || stats.coins >= targetCoins;
                  const progressPct = Math.min(100, Math.round((Math.max(stats.xp / targetXp, stats.coins / targetCoins)) * 100));

                  return (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {isDedicated ? (
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                              <Check className="w-4 h-4" />
                              <span>Dedication Verified! You've unlocked @{account.referredBy || referralStats?.referredBy}'s referral reward (+250 🪙, +500 XP).</span>
                            </span>
                          ) : (
                            <span>
                              Help @{account.referredBy || referralStats?.referredBy} unlock their referral reward by demonstrating dedication (reach 750 XP or 350 Coins in quizzes).
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[11px] text-amber-400 font-bold ml-2">
                          {stats.xp}/{targetXp} XP · {stats.coins}/{targetCoins} 🪙
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${isDedicated ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-emerald-400'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      Were you invited by a friend? Claim your bonus!
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    +150 Coins & +250 XP
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  If you created your account without entering a referral code, you can claim your friend's code here.
                </p>

                <form onSubmit={handleClaimReferralCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter friend's referral code (e.g. REF-ABC123XY)"
                    value={claimReferralCodeInput}
                    onChange={(e) => setClaimReferralCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white uppercase font-mono text-xs rounded-xl px-3.5 py-2.5 focus:border-amber-500 focus:outline-none"
                    disabled={isClaimingReferral}
                  />
                  <ProgressiveButton
                    type="submit"
                    isLoading={isClaimingReferral}
                    loadingText="Verifying..."
                    borderVariant="amber"
                    disabled={!claimReferralCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Claim Bonus</span>
                  </ProgressiveButton>
                </form>

                {claimReferralMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    claimReferralMsg.isError
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {claimReferralMsg.isError ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{claimReferralMsg.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Referral Milestone Roadmap */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Referral Milestones Roadmap</h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {referralStats?.referralCount ?? account.referralCount ?? 0} Verified Scholars
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    title: 'Community Spark',
                    target: 1,
                    coins: 100,
                    xp: 200,
                    desc: 'Invite your 1st friend',
                    unlocked: ((referralStats?.referralCount ?? account.referralCount ?? 0) >= 1) || ((account.unlockedBadges || []).includes('community-spark'))
                  },
                  {
                    title: 'Network Builder',
                    target: 3,
                    coins: 300,
                    xp: 500,
                    desc: 'Reach 3 active friends',
                    unlocked: ((referralStats?.referralCount ?? account.referralCount ?? 0) >= 3) || ((account.unlockedBadges || []).includes('network-builder'))
                  },
                  {
                    title: 'MongoDB Ambassador',
                    target: 5,
                    coins: 750,
                    xp: 1200,
                    desc: 'Onboard 5 colleagues',
                    unlocked: ((referralStats?.referralCount ?? account.referralCount ?? 0) >= 5) || ((account.unlockedBadges || []).includes('mongodb-ambassador'))
                  },
                  {
                    title: 'Grand Influencer',
                    target: 10,
                    coins: 2000,
                    xp: 3000,
                    desc: 'Reach 10+ referrals',
                    unlocked: ((referralStats?.referralCount ?? account.referralCount ?? 0) >= 10) || ((account.unlockedBadges || []).includes('grand-influencer'))
                  }
                ].map((m, idx) => {
                  const current = referralStats?.referralCount ?? account.referralCount ?? 0;
                  const progressPct = Math.min(100, (current / m.target) * 100);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        m.unlocked
                          ? 'bg-slate-950/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-950/40 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${m.unlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                          {m.title}
                        </span>
                        {m.unlocked ? (
                          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            {current}/{m.target}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{m.desc}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-400 font-bold">+{m.coins} 🪙</span>
                        <span className="text-purple-400">+{m.xp} XP</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            m.unlocked ? 'bg-emerald-400' : 'bg-amber-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referred Friends History List */}
            {((referralStats?.referrals && referralStats.referrals.length > 0) || (account.referrals && account.referrals.length > 0)) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Your Referred Friends List</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {(referralStats?.referrals || account.referrals || []).length} Joined
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono bg-slate-950/80">
                        <th className="py-2.5 px-3">Friend</th>
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3">Dedication Progress</th>
                        <th className="py-2.5 px-3 text-right">Referrer Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(referralStats?.referrals || account.referrals || []).map((ref: any, idx: number) => {
                        const isUnlocked = ref.status === 'unlocked' || (!ref.status && (ref.bonusCoinsAwarded || ref.bonusCoins));
                        const targetXp = ref.targetXp || 750;
                        const currentXp = ref.currentXp || 0;
                        const progressPct = Math.min(100, Math.round((currentXp / targetXp) * 100));

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {ref.displayName || 'Learner'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-400">
                              @{ref.username}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {isUnlocked ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  <Check className="w-3 h-3" />
                                  <span>Dedicated Scholar (Verified)</span>
                                </span>
                              ) : (
                                <div className="space-y-1 py-0.5">
                                  <div className="flex items-center space-x-2 text-[10px]">
                                    <span className="text-amber-400 font-bold">In Progress</span>
                                    <span className="text-slate-400 font-mono">({currentXp}/{targetXp} XP)</span>
                                  </div>
                                  <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[11px]">
                              {isUnlocked ? (
                                <>
                                  <span className="text-amber-400">+{ref.bonusCoins || 250} 🪙</span>
                                  <span className="text-purple-400 ml-2">+{ref.bonusXp || 500} XP</span>
                                </>
                              ) : (
                                <span className="text-slate-500 text-[10px] font-mono">Unlocks at {targetXp} XP</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Guest CTA */
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Unlock Your Personal Referral Code & Study Circle Rewards
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Create a free learner profile to get a custom shareable link. Every friend who joins gets an instant{' '}
                <strong className="text-amber-400">+150 Coins</strong> &{' '}
                <strong className="text-purple-400">+250 XP</strong> welcome bonus, and earns you{' '}
                <strong className="text-amber-400">+250 MongoCoins</strong> &{' '}
                <strong className="text-purple-400">+500 XP</strong> once they show dedication by reaching 750 XP or 350 Coins!
              </p>
            </div>
            <button
              onClick={() => {
                setShowRegisterModal(true);
                setRegStep(1);
                setRegError(null);
              }}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 inline-flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Free to Claim Referral Code</span>
            </button>
          </div>
        )}
      </div>

      {/* Cohort Leaderboard & Tier Progression Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Left 2 Cols: Personal Progression */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Personal Mastery Progression
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Sync</span>
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{stats.levelTitle}</div>
                <div className="text-xs text-slate-400">Current Rank Tier</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-400">{stats.xp} / {stats.nextTierXp} XP</div>
                <div className="text-xs text-slate-400">Progress to Next Tier</div>
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (stats.xp / stats.nextTierXp) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">Global Accuracy</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{stats.leaderboard[0]?.accuracy || 0}%</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Solved</div>
                <div className="text-2xl font-black text-white font-mono">{progress.questionsAttempted} Qs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Progression & Scoring Rules Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">
                How XP & Coins Work
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 block">
                🎯 Correct Question Solutions
              </span>
              <p className="text-[11px] text-slate-400">
                +25 XP and +5 MongoCoins on every fully correct solution (+10 XP on partial correct).
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 block">
                🔥 Daily Learning Streaks
              </span>
              <p className="text-[11px] text-slate-400">
                +35 XP and +15 MongoCoins awarded for every consecutive active practice day.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-purple-400 block">
                🎓 Full Mock Exam Completion
              </span>
              <p className="text-[11px] text-slate-400">
                +60 XP on completion, with +200 XP and +150 Coins distinction bonuses for scoring 85%+.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-blue-400 block">
                🛡️ Verified Profile & Recovery
              </span>
              <p className="text-[11px] text-slate-400">
                +100 Coins & +250 XP bonus on email OTP verification with auto-generated recovery phrase.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements & Unlocked Badges Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              Badges & Milestone Achievements ({stats.badges.filter(b => b.isUnlocked).length} / {stats.badges.length} Unlocked)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Earn MongoCoins & XP on every milestone
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                badge.isUnlocked
                  ? 'bg-gradient-to-br from-slate-950 to-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    badge.isUnlocked
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {badge.isUnlocked ? <Check className="w-5 h-5 text-emerald-400" /> : <Award className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${badge.isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                      {badge.title}
                    </h4>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                      {badge.category}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-amber-400 font-bold block">+{badge.coinReward} 🪙</span>
                  <span className="text-purple-400">+{badge.xpReward} XP</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {badge.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Requirement: {badge.requirementText}</span>
                  <span>{badge.isUnlocked ? 'Completed' : `${Math.round(badge.progressPercent)}%`}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-1.5 rounded-full transition-all ${badge.isUnlocked ? 'bg-emerald-400' : 'bg-purple-500'}`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Register / Claim Gamification Profile */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Activate Learner Profile</span>
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{regError}</span>
              </div>
            )}

            {/* Active Referral Welcome Banner */}
            {regReferralCode && (
              <div className="p-3 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-500/40 rounded-xl text-xs flex items-center space-x-2.5 animate-fadeIn">
                <Gift className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="font-extrabold text-amber-300">
                      Referral Invitation Active:
                    </span>
                    <span className="font-mono font-bold bg-amber-500/20 text-white px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px]">
                      {regReferralCode}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Register below to immediately receive your welcome bonus of <strong>+150 MongoCoins & +250 XP</strong>!
                  </p>
                </div>
              </div>
            )}

            {regStep === 1 ? (
              <form onSubmit={handleRequestRegistrationOtp} className="space-y-3.5 text-xs">
                <p className="text-slate-300 leading-snug">
                  Provide your registration details. A 6-digit OTP code will be sent to your email along with your <strong>Auto-Generated Account Recovery Phrase</strong>.
                </p>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. learner@university.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Desired Username *</label>
                    <input
                      type="text"
                      placeholder="e.g. mongomaster99"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Display Name / Pseudonym</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Set Account Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Referral Code (Optional)</label>
                    <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      🎁 +150 Coins & +250 XP Bonus
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. REF-ABC123XY"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 text-white uppercase font-mono rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Got invited by a friend? Enter their referral code to receive an extra +150 MongoCoins and +250 XP on signup.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <ProgressiveButton
                    type="submit"
                    isLoading={isSendingEmail}
                    loadingText="Dispatching Real Email..."
                    borderVariant="emerald"
                    disabled={emailCooldown > 0}
                    className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40"
                  >
                    {emailCooldown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                        <span>Resend in {emailCooldown}s</span>
                      </>
                    ) : (
                      <span>Send OTP & Generate Recovery Phrase</span>
                    )}
                  </ProgressiveButton>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 text-xs animate-fadeIn">
                {/* Dynamic Email Dispatch Notification */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Dynamic Email Dispatched!</span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    A 6-digit verification code (OTP) has been dispatched instantly to <strong className="text-white font-mono">{regEmail}</strong>.
                  </p>

                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="text-slate-200 font-semibold flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Email Verification Instructions:</span>
                    </div>
                    <div>1. Open the verification email sent to <strong>{regEmail}</strong> (check inbox & spam folder).</div>
                    <div>2. Enter the 6-digit OTP code below to verify your email and activate your profile.</div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Enter 6-Digit Email Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 748291"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-bold text-lg text-emerald-400 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none tracking-widest"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  {emailCooldown > 0 ? (
                    <span className="text-amber-400 font-mono text-xs flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Resend in {emailCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestRegistrationOtp()}
                      disabled={isSendingEmail}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                      <span>Resend Email</span>
                    </button>
                  )}

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                    >
                      Back
                    </button>
                    <ProgressiveButton
                      type="submit"
                      isLoading={isSendingEmail}
                      loadingText="Verifying OTP..."
                      borderVariant="emerald"
                      className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40"
                    >
                      Verify & Claim Profile (+100 🪙)
                    </ProgressiveButton>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Sign In */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <LogIn className="w-5 h-5 text-emerald-400" />
                <span>Sign In to Gamification Profile</span>
              </h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email or Username *</label>
                <input
                  type="text"
                  placeholder="Enter email or username..."
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowRecoverModal(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <ProgressiveButton
                  type="submit"
                  isLoading={isAuthenticating}
                  loadingText="Verifying Credentials..."
                  borderVariant="emerald"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40"
                >
                  Sign In
                </ProgressiveButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recovery */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Recover Account Password</span>
              </h3>
              <button
                onClick={() => setShowRecoverModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-slate-950 rounded-lg p-1">
              <button
                onClick={() => { setRecoverMode('email_otp'); setRecoverStep(1); setRecoverMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${recoverMode === 'email_otp' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Email OTP
              </button>
              <button
                onClick={() => { setRecoverMode('recovery_phrase'); setRecoverStep(1); setRecoverMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${recoverMode === 'recovery_phrase' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Recovery Phrase
              </button>
            </div>

            {recoverMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                recoverMsg.isError
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              }`}>
                {recoverMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                <span className="font-semibold">{recoverMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRecoverSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registered Email or Username *</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter email or username..."
                    value={recoverIdentifier}
                    onChange={(e) => setRecoverIdentifier(e.target.value)}
                    required
                    disabled={recoverStep === 2 && recoverMode === 'email_otp'}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 disabled:opacity-50"
                  />
                  {recoverMode === 'email_otp' && recoverStep === 1 && (
                    <div className="flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={handleRecoverRequestOtp}
                        disabled={isSendingRecoverOtp || recoverCooldown > 0 || !recoverIdentifier.trim()}
                        className="px-3 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap h-full"
                      >
                        {isSendingRecoverOtp ? 'Sending...' : recoverCooldown > 0 ? `Wait ${recoverCooldown}s` : 'Get OTP'}
                      </button>
                      <span className="text-[9px] text-amber-500/80 font-semibold px-1 text-center whitespace-nowrap tracking-tight">
                        Costs 50 🪙
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {recoverMode === 'email_otp' && recoverStep === 2 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">6-Digit Verification Code *</label>
                  <input
                    type="text"
                    placeholder="Enter OTP..."
                    value={recoverOtpCode}
                    onChange={(e) => setRecoverOtpCode(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 tracking-widest font-mono"
                  />
                </div>
              )}

              {recoverMode === 'recovery_phrase' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Your Auto-Generated Recovery Phrase *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-8492-1049-7712"
                    value={recoverPhrase}
                    onChange={(e) => setRecoverPhrase(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-500/40 text-purple-300 font-mono text-xs rounded-xl p-2.5"
                  />
                </div>
              )}

              {(recoverMode === 'recovery_phrase' || recoverStep === 2) && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Set New Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters..."
                    value={recoverNewPassword}
                    onChange={(e) => setRecoverNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecoverModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                {(recoverMode === 'recovery_phrase' || recoverStep === 2) && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md shadow-purple-500/20"
                  >
                    Reset Password & Recover
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reveal Phrase Auth */}
      {showPhraseAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Verify Password</span>
              </h3>
              <button
                onClick={() => { setShowPhraseAuthModal(false); setPhraseAuthPassword(''); setPhraseAuthError(null); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Please enter your password to reveal your recovery phrase.
            </p>

            {phraseAuthError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{phraseAuthError}</span>
              </div>
            )}

            <form onSubmit={handlePhraseAuthSubmit} className="space-y-4 text-xs">
              <div>
                <input
                  type="password"
                  placeholder="Enter your password..."
                  value={phraseAuthPassword}
                  onChange={(e) => setPhraseAuthPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowPhraseAuthModal(false); setPhraseAuthPassword(''); setPhraseAuthError(null); }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-md shadow-purple-500/20"
                >
                  Reveal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Learner Account */}
      {showDeleteModal && account && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-red-400">
                <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Learner Account</h3>
                  <span className="text-[11px] text-slate-400 font-mono">@{account.username}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 space-y-1">
              <p className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>This action cannot be undone.</span>
              </p>
              <p className="text-[11px] text-red-200/80">
                Your registered credentials, MongoCoins, and personal badges will be permanently removed. Your exit statement will be recorded on the Super Admin Statements Board.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Leaving *
                </label>
                <select
                  value={deleteReasonCategory}
                  onChange={(e) => setDeleteReasonCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-red-500/50 focus:outline-none"
                >
                  <option value="completed-goals">Completed my MongoDB study goals</option>
                  <option value="privacy-concerns">Privacy & data cleanup request</option>
                  <option value="starting-fresh">Starting fresh with a new account</option>
                  <option value="technical-difficulties">Encountered technical difficulties or bugs</option>
                  <option value="dissatisfied">Course / quiz content didn't meet needs</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Exit Statement & Feedback *
                </label>
                <textarea
                  value={deleteStatement}
                  onChange={(e) => setDeleteStatement(e.target.value)}
                  placeholder="Please state why you are deleting your account or leave any exit feedback for the instructors..."
                  required
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-red-500/50 focus:outline-none resize-none placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm Account Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password..."
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-red-500/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Keep My Account
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="px-5 py-2 rounded-xl font-bold bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/20 transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Use account or guest creation date to filter out old broadcast notifications */}
      <GlobalNotificationPopup audience="learners" userCreatedAt={account?.createdAt || progress?.learnerId?.createdAt} />
    </div>
  );
};
