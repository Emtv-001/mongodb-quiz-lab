import React, { useState, useEffect } from 'react';
import {
  requestPasswordResetOtp,
  verifyPhoneResetOtp,
  completePhoneResetPassword,
  getAuditLogs,
  addAuditLog,
  MASTER_ADMIN_PHONE,
  MASTER_ADMIN_EMAIL,
  ROOT_SECURITY_EMAIL
} from '../../services/adminService';
import {
  getEmailConfig,
  saveEmailConfig,
  sendLiveTestEmail,
  sendRealtimeEmail
} from '../../services/emailService';
import { EmailServiceConfig, EmailProviderType, AdminUser } from '../../types/admin';
import {
  ShieldAlert,
  Phone,
  KeyRound,
  Check,
  AlertCircle,
  Clock,
  Lock,
  Unlock,
  Copy,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Mail,
  Send,
  Sliders
} from 'lucide-react';

interface AdminSecuritySettingsProps {
  currentUser?: AdminUser | null;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({ currentUser }) => {
  // Password Reset Flow state
  const adminEmail = currentUser?.email || MASTER_ADMIN_EMAIL;
  const [identifierInput, setIdentifierInput] = useState(adminEmail);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resetMessage, setResetMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Email Service Configuration state
  const [emailConfig, setEmailConfig] = useState<EmailServiceConfig>(() => getEmailConfig());
  const [testEmailAddress, setTestEmailAddress] = useState(adminEmail);

  // Master Security Authority Lock & OTP State
  const [isAuthorityUnlocked, setIsAuthorityUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mongo_quiz_master_authority_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedOtpTarget, setSelectedOtpTarget] = useState<string>(ROOT_SECURITY_EMAIL);
  const [authorityOtpInput, setAuthorityOtpInput] = useState('');
  const [isSendingAuthorityOtp, setIsSendingAuthorityOtp] = useState(false);
  const [authorityOtpSent, setAuthorityOtpSent] = useState(false);
  const [authorityOtpMessage, setAuthorityOtpMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [authorityCooldown, setAuthorityCooldown] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ text: string; isError: boolean } | null>(null);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [testEmailCooldown, setTestEmailCooldown] = useState(0);

  // Cooldown timers
  useEffect(() => {
    if (otpCooldown <= 0 && testEmailCooldown <= 0 && authorityCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setTestEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setAuthorityCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown, testEmailCooldown, authorityCooldown]);

  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = () => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Master Security Authority Handlers
  const handleSendAuthorityOtp = async () => {
    if (authorityCooldown > 0 || isSendingAuthorityOtp) return;
    setIsSendingAuthorityOtp(true);
    setAuthorityOtpMessage(null);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    try {
      sessionStorage.setItem('mongo_quiz_authority_otp_code', code);
      sessionStorage.setItem('mongo_quiz_authority_otp_expiry', expiry.toString());
      sessionStorage.setItem('mongo_quiz_authority_otp_target', selectedOtpTarget);

      const requesterName = currentUser?.displayName || currentUser?.username || 'Master Administrator';
      const subject = `🔐 Master Security Authority Verification Code: ${code}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #334155; overflow: hidden; color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">Master Security Authority</h1>
            <p style="color: #e0e7ff; margin: 0; font-size: 13px;">Confidential Root Authorization Passcode</p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
              An active administrator session (<strong>${requesterName}</strong>) has requested to decrypt the <strong>Master Security Authority & Policies</strong> enclave (Master Recovery Phrases, default root credentials, and cryptographic integrity policies).
            </p>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 6px;">Your 6-Digit Single-Use OTP</span>
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; font-family: monospace; color: #c084fc;">${code}</span>
              <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">Valid for 10 minutes &bull; Single-use authorization</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 12px 0;">
              If you did not initiate this request, take immediate administrative action. Check active session logs and rotate master administrator credentials.
            </p>
            <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
              Security alert generated automatically by MongoDB Quiz Lab &bull; Target: ${selectedOtpTarget}
            </div>
          </div>
        </div>
      `;

      const result = await sendRealtimeEmail({
        to: selectedOtpTarget,
        subject,
        html,
        text: `Master Security Authority Verification Code: ${code}. Valid for 10 minutes. If you did not initiate this request, take immediate administrative action.`
      });

      if (result.success) {
        setAuthorityOtpSent(true);
        setAuthorityCooldown(60);
        setAuthorityOtpMessage({
          text: `Verification code sent to ${selectedOtpTarget}. Enter the 6-digit code below to decrypt authority policies.`,
          isError: false
        });

        await addAuditLog(
          currentUser?.username || 'admin',
          'Request Master Authority Unlock OTP',
          'security',
          `Dispatched authority unlock OTP to ${selectedOtpTarget}`
        );
        fetchLogs();
      } else {
        setAuthorityOtpMessage({
          text: `Failed to dispatch OTP: ${result.message || 'Unknown error'}. Please check Email Service configuration.`,
          isError: true
        });
      }
    } catch (err: any) {
      setAuthorityOtpMessage({
        text: `Error dispatching OTP: ${err?.message || 'Network error'}`,
        isError: true
      });
    } finally {
      setIsSendingAuthorityOtp(false);
    }
  };

  const handleVerifyAuthorityOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedCode = sessionStorage.getItem('mongo_quiz_authority_otp_code');
    const storedExpiry = sessionStorage.getItem('mongo_quiz_authority_otp_expiry');

    if (!storedCode || !storedExpiry) {
      setAuthorityOtpMessage({
        text: 'No active OTP found. Please request a new verification code.',
        isError: true
      });
      return;
    }

    if (Date.now() > parseInt(storedExpiry, 10)) {
      setAuthorityOtpMessage({
        text: 'Verification code expired. Please request a new code.',
        isError: true
      });
      return;
    }

    if (authorityOtpInput.trim() !== storedCode.trim()) {
      setAuthorityOtpMessage({
        text: 'Invalid 6-digit code. Please enter the exact code sent to your email.',
        isError: true
      });
      return;
    }

    // Success!
    sessionStorage.setItem('mongo_quiz_master_authority_unlocked', 'true');
    sessionStorage.removeItem('mongo_quiz_authority_otp_code');
    sessionStorage.removeItem('mongo_quiz_authority_otp_expiry');
    setIsAuthorityUnlocked(true);
    setAuthorityOtpMessage(null);
    setAuthorityOtpInput('');

    await addAuditLog(
      currentUser?.username || 'admin',
      'Unlock Master Security Authority',
      'security',
      `Master Security Authority & Policies unlocked via OTP verified for ${selectedOtpTarget}`
    );
    fetchLogs();
  };

  const handleLockAuthority = async () => {
    try {
      sessionStorage.removeItem('mongo_quiz_master_authority_unlocked');
    } catch {}
    setIsAuthorityUnlocked(false);
    setAuthorityOtpSent(false);
    setAuthorityOtpInput('');
    setAuthorityOtpMessage(null);

    await addAuditLog(
      currentUser?.username || 'admin',
      'Lock Master Security Authority',
      'security',
      `Master Security Authority & Policies manually re-locked by administrator.`
    );
    fetchLogs();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCooldown > 0) return;
    setIsSendingOtp(true);
    setResetMessage(null);

    try {
      const res = await requestPasswordResetOtp(identifierInput);
      if (res.success) {
        setOtpSent(true);
        setOtpStep(2);
        setResetMessage({ text: res.message, isError: false });
        setOtpCooldown(60);
      } else {
        setResetMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setResetMessage({ text: err?.message || "Failed to dispatch reset code.", isError: true });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const verifyRes = verifyPhoneResetOtp(identifierInput, otpCodeInput);
    if (!verifyRes.success) {
      setResetMessage({ text: verifyRes.message, isError: true });
      return;
    }

    const resetRes = await completePhoneResetPassword(identifierInput, newPasswordInput);
    if (resetRes.success) {
      setResetMessage({ text: resetRes.message, isError: false });
      setOtpStep(1);
      setOtpSent(false);
      setOtpCodeInput('');
      setNewPasswordInput('');
    } else {
      setResetMessage({ text: resetRes.message, isError: true });
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testEmailCooldown > 0) return;
    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await sendLiveTestEmail(testEmailAddress);
      setTestEmailResult({ text: res.message, isError: !res.success });
      setEmailConfig(getEmailConfig());
      if (res.success) {
        setTestEmailCooldown(45); // 45s cooldown on test email
      }
    } catch (err: any) {
      setTestEmailResult({ text: err?.message || "Failed to send test email.", isError: true });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveEmailConfig(emailConfig);
    setEmailConfig(saved);
    setTestEmailResult({ text: "Email service gateway settings saved successfully!", isError: false });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" />
            <span>Security & Authentication Governance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Dynamic Email OTP & Notification Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic transactional email dispatch for OTP verifications, role authorizations, and audit tracking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dynamic Email OTP Password Reset Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Mail className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Dynamic Password Reset (Email / Phone)
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Dispatch a secure 6-digit one-time code directly to your registered administrator email address instantly.
          </p>

          {resetMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fadeIn ${
              resetMessage.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {resetMessage.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
              <span>{resetMessage.text}</span>
            </div>
          )}

          {otpStep === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Registered Administrator Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="e.g. admin@emtvtech.com"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 font-mono text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
              >
                <Send className={`w-4 h-4 ${isSendingOtp ? 'animate-pulse' : ''}`} />
                <span>{isSendingOtp ? 'Dispatching Real Email...' : 'Send 6-Digit Verification Code'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteReset} className="space-y-3 text-xs animate-fadeIn">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span>A 6-digit code has been sent instantly to <strong>{identifierInput}</strong>. Please check your inbox or spam folder.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value)}
                  placeholder="e.g. 849201"
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-center text-lg tracking-widest font-black rounded-xl py-2"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Set New Admin Password
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min 6 characters..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOtpStep(1)}
                  className="flex-1 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Dynamic Email Delivery Gateway & Test Hub */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Live Email Dispatch Pipeline
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live System Active</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Transactional emails (Learner OTPs, recovery phrases, admin invitations, password resets) are dispatched instantly to recipient email inboxes.
          </p>

          {/* Test Live Email Form */}
          <form onSubmit={handleSendTestEmail} className="space-y-3 text-xs p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <label className="block text-slate-300 font-semibold">
              Test Dynamic Email Delivery
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter recipient email..."
                required
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono w-full"
              />
              <button
                type="submit"
                disabled={isSendingTestEmail || testEmailCooldown > 0}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-1.5 flex-shrink-0 w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-emerald-500/40 relative overflow-hidden"
              >
                {testEmailCooldown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Wait {testEmailCooldown}s</span>
                  </>
                ) : (
                  <>
                    <Mail className={`w-3.5 h-3.5 ${isSendingTestEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingTestEmail ? 'Sending...' : 'Send Live Test'}</span>
                  </>
                )}
              </button>
            </div>

            {testEmailResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-fadeIn ${
                testEmailResult.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {testEmailResult.isError ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span className="leading-relaxed">{testEmailResult.text}</span>
              </div>
            )}
          </form>

          {/* Gateway Provider Toggle & Settings */}
          <div className="space-y-2 text-xs">
            <button
              type="button"
              onClick={() => setShowConfigDetails(!showConfigDetails)}
              className="text-xs text-slate-400 hover:text-white flex items-start sm:items-center space-x-2 font-semibold text-left w-full"
            >
              <Sliders className="w-4 h-4 mt-0.5 sm:mt-0 text-purple-400 flex-shrink-0" />
              <span>{showConfigDetails ? 'Hide' : 'Configure'} Gateway Credentials (Resend / Brevo / EmailJS / Webhook)</span>
            </button>

            {showConfigDetails && (
              <form onSubmit={handleSaveEmailConfig} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 animate-fadeIn text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Provider Strategy</label>
                  <select
                    value={emailConfig.provider}
                    onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value as EmailProviderType })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="auto">Auto-Detect / Public Cloud Gateway (Default)</option>
                    <option value="resend">Resend API</option>
                    <option value="brevo">Brevo (Sendinblue) API</option>
                    <option value="emailjs">EmailJS Client REST</option>
                    <option value="custom-webhook">Custom Webhook / HTTP Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Resend API Key (Optional)</label>
                  <input
                    type="password"
                    value={emailConfig.resendApiKey || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                    placeholder="re_..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Custom Webhook URL (Optional)</label>
                  <input
                    type="url"
                    value={emailConfig.customWebhookUrl || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, customWebhookUrl: e.target.value })}
                    placeholder="https://your-server.com/api/send-email"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Master Recovery Phrase & Security Policy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Master Security Authority & Policies
            </h3>
            </div>
            {isAuthorityUnlocked ? (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Decrypted & Unlocked</span>
                </span>
                <button
                  type="button"
                  onClick={handleLockAuthority}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1.5 transition-all"
                  title="Lock Master Security Authority"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Policies</span>
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Locked & Protected</span>
              </span>
            )}
          </div>

          {!isAuthorityUnlocked ? (
            /* LOCKED STATE UI */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-amber-500/20 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-amber-300 block">
                    Access Restricted: OTP Verification Required
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    The master recovery phrase, default platform credentials, and root authority policies are locked. Select an authorized destination below and dispatch a single-use 6-digit OTP to decrypt this section.
                  </p>
                </div>
              </div>

              {/* Destination selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Select OTP Dispatch Destination:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: ROOT_SECURITY_EMAIL */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOtpTarget(ROOT_SECURITY_EMAIL);
                      setAuthorityOtpMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedOtpTarget === ROOT_SECURITY_EMAIL
                        ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-purple-300 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Root Master Email</span>
                      </span>
                      {selectedOtpTarget === ROOT_SECURITY_EMAIL && (
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-white break-all">
                      {ROOT_SECURITY_EMAIL}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Dedicated master security mailbox
                    </span>
                  </button>

                  {/* Option 2: adminEmail */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOtpTarget(adminEmail);
                      setAuthorityOtpMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedOtpTarget === adminEmail
                        ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Admin Session Email</span>
                      </span>
                      {selectedOtpTarget === adminEmail && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-white break-all">
                      {adminEmail}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Current administrator account
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {authorityOtpMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                    authorityOtpMessage.isError
                      ? 'bg-red-950/40 border-red-500/30 text-red-300'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {authorityOtpMessage.isError ? (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  ) : (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  )}
                  <span className="leading-snug">{authorityOtpMessage.text}</span>
                </div>
              )}

              {/* Send button or OTP input form */}
              {!authorityOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendAuthorityOtp}
                  disabled={isSendingAuthorityOtp || authorityCooldown > 0}
                  className="w-full py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-95"
                >
                  <Send className={`w-4 h-4 ${isSendingAuthorityOtp ? 'animate-pulse' : ''}`} />
                  <span>
                    {isSendingAuthorityOtp
                      ? 'Dispatching Secure OTP...'
                      : authorityCooldown > 0
                      ? `Resend Available in ${authorityCooldown}s`
                      : `Send Unlock OTP to ${selectedOtpTarget}`}
                  </span>
                </button>
              ) : (
                <form onSubmit={handleVerifyAuthorityOtp} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                      Enter 6-Digit Authorization Code:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={authorityOtpInput}
                      onChange={(e) => setAuthorityOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-purple-300 font-mono text-center text-xl tracking-[0.4em] font-black rounded-xl py-2.5 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSendAuthorityOtp}
                      disabled={isSendingAuthorityOtp || authorityCooldown > 0}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                    >
                      {authorityCooldown > 0 ? `Resend in ${authorityCooldown}s` : 'Resend Code'}
                    </button>
                    <button
                      type="submit"
                      disabled={authorityOtpInput.length !== 6}
                      className="flex-[2] py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Verify & Unlock Policies</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* UNLOCKED STATE UI */
            <div className="space-y-3 text-xs animate-fadeIn">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Master Recovery Phrase Rule:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('09018537763', 'phrase')}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 transition-colors"
                    title="Copy Master Recovery Phrase"
                  >
                    {copiedKey === 'phrase' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The master recovery phrase (<code className="text-purple-300 font-mono font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">09018537763</code>) is required to provision sub-administrators or perform root authority overrides.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Cryptographic Data Integrity:
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Student test progress and streak scores are signed with SHA-256 HMAC digest verification to reject browser DevTools tampering.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Default Credentials:
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy('admin', 'user')}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 transition-colors"
                      title="Copy Username"
                    >
                      {copiedKey === 'user' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('AdminEMTV', 'pass')}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 transition-colors"
                      title="Copy Password"
                    >
                      {copiedKey === 'pass' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Pass</span>
                    </button>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Master Admin Username: <code className="text-emerald-400 font-mono font-bold">admin</code> | Default Password: <code className="text-emerald-400 font-mono font-bold">AdminEMTV</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Immutable Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Comprehensive Audit Trail Logs ({logs.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Immutable Event Log
          </span>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">Admin</th>
                <th className="pb-2 font-semibold">Action</th>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-white font-bold">
                    @{log.adminUsername}
                  </td>
                  <td className="py-2.5 text-emerald-400 font-bold">
                    {log.action}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300 text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
