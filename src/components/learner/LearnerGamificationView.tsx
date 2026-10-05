import React, { useState, useEffect } from 'react';
import { StudentProgress, RegisteredLearnerAccount } from '../../types';
import {
  getRegisteredLearnerAccount,
  requestLearnerRegistrationOtp,
  verifyLearnerRegistrationOtp,
  loginLearner,
  logoutLearner,
  recoverLearnerAccountWithPhrase,
  getLearnerGamificationStats
} from '../../services/learnerService';
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
  RefreshCw
} from 'lucide-react';

interface LearnerGamificationViewProps {
  progress: StudentProgress;
  onGoToPractice: () => void;
  onGoToMockExams: () => void;
}

export const LearnerGamificationView: React.FC<LearnerGamificationViewProps> = ({
  progress,
  onGoToPractice,
  onGoToMockExams
}) => {
  const [account, setAccount] = useState<RegisteredLearnerAccount | null>(() => getRegisteredLearnerAccount());
  const [stats, setStats] = useState(() => getLearnerGamificationStats(progress));

  // Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);

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

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Recovery Form State
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverPhrase, setRecoverPhrase] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverMsg, setRecoverMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Rewards store purchase
  const [storeMessage, setStoreMessage] = useState<string | null>(null);

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

  // Handle Register Step 1: Request OTP and dispatch real-time email
  const handleRequestRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setIsSendingEmail(true);

    try {
      const res = await requestLearnerRegistrationOtp(regEmail, regUsername, regDisplayName, regPassword);
      if (res.success) {
        setRegStep(2);
        setRegSuccessMsg(res.message);
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
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const res = verifyLearnerRegistrationOtp(otpCodeInput);
    if (res.success && res.account) {
      refreshAccountState();
      setShowRegisterModal(false);
      alert(`🎉 Registration complete! Welcome @${res.account.username}. +100 MongoCoins bonus added to your account!`);
      // Reset form
      setRegStep(1);
      setRegEmail('');
      setRegUsername('');
      setRegDisplayName('');
      setRegPassword('');
      setOtpCodeInput('');
      setRegSuccessMsg(null);
    } else {
      setRegError(res.message);
    }
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = loginLearner(loginIdentifier, loginPassword);
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

  // Handle Recovery
  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverMsg(null);

    const res = recoverLearnerAccountWithPhrase(recoverIdentifier, recoverPhrase, recoverNewPassword);
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
      setRecoverMsg({ text: res.message, isError: true });
    }
  };

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    'MongoDB Master': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40' },
    'Diamond': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' },
    'Platinum': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    'Gold': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40' },
    'Silver': { bg: 'bg-slate-400/15', text: 'text-slate-200', border: 'border-slate-400/40' },
    'Bronze': { bg: 'bg-orange-600/15', text: 'text-orange-300', border: 'border-orange-500/40' }
  };

  const activeTierStyle = tierColors[stats.tier] || tierColors['Bronze'];

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
              {account ? `Welcome, ${account.displayName}` : 'Earn Points, MongoCoins & Cohort Rank'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {account
                ? `You are signed in as @${account.username}. Your earned points, achievements, and leaderboard rankings are saved and synced across sessions.`
                : 'Registration is optional! You can explore anonymously as a guest, or register your profile with an email OTP and auto-generated recovery phrase to claim your global leaderboard rank and rewards.'}
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
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
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
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort Ranking</span>
              <span className="text-3xl font-black font-mono text-white">#{stats.rank}</span>
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
                <code className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-purple-500/30 ml-1">
                  {account.recoveryPhrase}
                </code>
              </span>
            </div>
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

        {/* Cohort Leaderboard Rank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Cohort Rank</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 truncate">
            Rank #{stats.rank}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Top Active Learners
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

      {/* Cohort Leaderboard & Tier Progression Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Left 2 Cols: Real-Time Cohort Leaderboard */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Global Real-Time Leaderboard
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Updates</span>
            </span>
          </div>

          <div className="space-y-2.5 overflow-x-auto">
            {stats.leaderboard.map((entry) => {
              const isUser = Boolean(entry.isCurrentUser);
              const rankBadge =
                entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;

              return (
                <div
                  key={entry.username}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isUser
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-bold font-mono text-sm w-7 text-center text-slate-300">
                      {rankBadge}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-xs sm:text-sm truncate ${isUser ? 'text-emerald-400' : 'text-white'}`}>
                          {entry.displayName}
                        </span>
                        {isUser && (
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {entry.username} • {entry.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 flex-shrink-0 text-xs font-mono">
                    <div className="text-right">
                      <span className="font-bold text-purple-400 block">{entry.xp} XP</span>
                      <span className="text-[10px] text-slate-400">{entry.accuracy}% acc</span>
                    </div>

                    <div className="hidden sm:flex items-center space-x-1 text-amber-400 font-semibold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Coins className="w-3 h-3" />
                      <span>{entry.coins} 🪙</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
                <span>Activate Gamification Profile & Rankings</span>
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

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center space-x-2"
                  >
                    {isSendingEmail && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSendingEmail ? 'Dispatching Real Email...' : 'Send OTP & Generate Recovery Phrase'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 text-xs animate-fadeIn">
                {/* Real-time Email Dispatch Notification */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Real-Time Email Dispatched!</span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    A 6-digit verification code (OTP) and your Auto-Generated Recovery Phrase have been sent to <strong className="text-white font-mono">{regEmail}</strong>.
                  </p>

                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="text-slate-200 font-semibold flex items-center space-x-1">
                      <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                      <span>Check Your Mailbox & Spam Folder:</span>
                    </div>
                    <div>1. Open the email from <strong>MongoDB Quiz Lab</strong> (check inbox & spam folder).</div>
                    <div>2. Enter the 6-digit OTP code below, or verify directly with your Auto-Generated Recovery Phrase.</div>
                    <div>3. Master emergency bypass code: <code className="text-emerald-400 font-mono font-bold">09018537763</code>.</div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Enter 6-Digit Email Code or Auto-Generated Recovery Phrase *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 748291 or REC-XXXX-XXXX-XXXX"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    required
                    maxLength={32}
                    className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-bold text-sm text-emerald-400 rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none tracking-widest"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleRequestRegistrationOtp}
                    disabled={isSendingEmail}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>Resend Email</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    >
                      Verify & Claim Profile (+100 🪙)
                    </button>
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
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recovery with Recovery Phrase */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Recover Account with Recovery Phrase</span>
              </h3>
              <button
                onClick={() => setShowRecoverModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
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
                <input
                  type="text"
                  placeholder="Enter email or username..."
                  value={recoverIdentifier}
                  onChange={(e) => setRecoverIdentifier(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

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

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecoverModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md shadow-purple-500/20"
                >
                  Reset Password & Recover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
