import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Gift,
  KeyRound,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Home
} from 'lucide-react';
import {
  requestLearnerRegistrationOtp,
  verifyLearnerRegistrationOtp,
  getRegisteredLearnerAccount
} from '../../services/learnerService';

interface LearnerRegistrationPageProps {
  onRegistrationSuccess: () => void;
  onCancel: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const LearnerRegistrationPage: React.FC<LearnerRegistrationPageProps> = ({
  onRegistrationSuccess,
  onCancel,
  onNavigateTab
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      if (urlRef && urlRef.trim()) return urlRef.trim().toUpperCase();
      return localStorage.getItem('mongo_quiz_pending_referral_code') || '';
    } catch {
      return '';
    }
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [generatedPhrase, setGeneratedPhrase] = useState('');
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Sync referral code from URL or storage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referral');
      const pending = localStorage.getItem('mongo_quiz_pending_referral_code');
      const code = (urlRef && urlRef.trim()) || (pending && pending.trim());
      if (code) {
        setReferralCode(code.toUpperCase());
        localStorage.setItem('mongo_quiz_pending_referral_code', code.toUpperCase());
      }
    } catch {}
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  const handleCopyPhrase = () => {
    if (!generatedPhrase) return;
    navigator.clipboard.writeText(generatedPhrase);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2500);
  };

  // Step 1: Request Registration OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailCooldown > 0) return;
    setError(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long and alphanumeric.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Dispatching verification code...');

    try {
      const res = await requestLearnerRegistrationOtp(
        cleanEmail,
        cleanUsername,
        displayName.trim() || cleanUsername,
        password,
        referralCode.trim().toUpperCase()
      );

      if (res.success) {
        setStep(2);
        setSuccessMessage(res.message);
        setGeneratedPhrase(res.recoveryPhrase || '');
        setEmailCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification email. Please verify your connection.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 2: Verify OTP and Provision Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Provisioning your learner profile & claiming welcome bonuses...');

    try {
      const res = await verifyLearnerRegistrationOtp(otpCode.trim());
      if (res.success && res.account) {
        localStorage.removeItem('mongo_quiz_pending_referral_code');
        // Clean URL parameters without reloading
        if (typeof window !== 'undefined' && window.history) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        onRegistrationSuccess();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 animate-fadeIn">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Step {step} of 2
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Card Header */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <UserPlus className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Create Your Learner Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Track test scores, earn MongoCoins, climb live community leaderboards, and master practical MongoDB queries.
          </p>
        </div>

        {/* Active Referral Invitation Banner */}
        {referralCode && (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-500/40 rounded-2xl text-xs flex items-start space-x-3 shadow-md animate-fadeIn">
            <Gift className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-extrabold text-amber-300">
                  Referral Invitation Active!
                </span>
                <span className="font-mono font-bold bg-amber-500/20 text-white px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                  {referralCode}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                You were invited by a friend! Register now to claim your exclusive{' '}
                <strong className="text-amber-400">+150 MongoCoins</strong> &{' '}
                <strong className="text-purple-400">+250 XP</strong> instant welcome gift!
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-start space-x-2.5 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="font-semibold leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Step 1: Account Information Form */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            {/* Username & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="mongodb_pro"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-7 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Display / Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                We'll email a 6-digit confirmation code and account security details.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-8 pr-10 py-2.5 text-xs focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Referral Code Field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Referral Invitation Code (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="REF-XXXX"
                  className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold rounded-xl pl-8 pr-3 py-2.5 text-xs focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || emailCooldown > 0}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>{loadingMessage || 'Sending Code...'}</span>
                </>
              ) : emailCooldown > 0 ? (
                <span>Resend Code in {emailCooldown}s</span>
              ) : (
                <>
                  <span>Request Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification & Recovery Phrase Confirmation */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs">
            {/* Auto-Generated Recovery Phrase Card */}
            {generatedPhrase && (
              <div className="p-4 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-purple-300 font-bold">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <span>Your Account Recovery Phrase</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPhrase}
                    className="flex items-center space-x-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/30 transition-colors"
                  >
                    {copiedPhrase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPhrase ? 'Copied!' : 'Copy Phrase'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs font-bold break-words select-all text-center">
                  {generatedPhrase}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  ⚠️ <strong>Save this phrase in a secure notes app!</strong> If you ever forget your password and don't have access to your email, this phrase will instantly restore access to your account.
                </p>
              </div>
            )}

            {/* OTP Code Input */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold text-center">
                Enter the 6-Digit Email Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-950 border border-emerald-500/50 text-white font-mono text-2xl font-black rounded-xl text-center tracking-[0.5em] py-3 focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[11px] text-slate-400 text-center">
                Sent to <strong className="text-white">{email}</strong>. Check your inbox and spam folder.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>{loadingMessage || 'Activating Profile...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Complete Registration</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Edit registration info
                </button>

                <button
                  type="button"
                  disabled={emailCooldown > 0 || isLoading}
                  onClick={handleRequestOtp}
                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 font-bold transition-colors"
                >
                  {emailCooldown > 0 ? `Resend code in ${emailCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Existing Account Footer Link */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) onNavigateTab('learner-hub');
              else onCancel();
            }}
            className="text-emerald-400 hover:text-emerald-300 font-bold ml-1 transition-colors"
          >
            Log in here
          </button>
        </div>
      </div>
    </div>
  );
};
