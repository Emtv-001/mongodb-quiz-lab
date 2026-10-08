import React, { useState, useEffect } from 'react';
import {
  requestPasswordResetOtp,
  verifyPhoneResetOtp,
  completePhoneResetPassword,
  getAuditLogs,
  MASTER_ADMIN_PHONE,
  MASTER_ADMIN_EMAIL
} from '../../services/adminService';
import {
  getEmailConfig,
  saveEmailConfig,
  sendLiveTestEmail
} from '../../services/emailService';
import { EmailServiceConfig, EmailProviderType } from '../../types/admin';
import {
  ShieldAlert,
  Phone,
  KeyRound,
  Check,
  AlertCircle,
  Clock,
  Lock,
  Smartphone,
  RefreshCw,
  Mail,
  Send,
  Sliders
} from 'lucide-react';

export const AdminSecuritySettings: React.FC = () => {
  // Password Reset Flow state
  const [identifierInput, setIdentifierInput] = useState(MASTER_ADMIN_EMAIL);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resetMessage, setResetMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Email Service Configuration state
  const [emailConfig, setEmailConfig] = useState<EmailServiceConfig>(() => getEmailConfig());
  const [testEmailAddress, setTestEmailAddress] = useState(MASTER_ADMIN_EMAIL);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ text: string; isError: boolean } | null>(null);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [testEmailCooldown, setTestEmailCooldown] = useState(0);

  // Cooldown timers
  useEffect(() => {
    if (otpCooldown <= 0 && testEmailCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setTestEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown, testEmailCooldown]);

  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(console.error);
  }, []);

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

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const verifyRes = verifyPhoneResetOtp(identifierInput, otpCodeInput);
    if (!verifyRes.success) {
      setResetMessage({ text: verifyRes.message, isError: true });
      return;
    }

    const resetRes = completePhoneResetPassword(identifierInput, newPasswordInput);
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
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <KeyRound className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Master Security Authority & Policies
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-300 block">
                Master Recovery Phrase Rule:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The master recovery phrase (<code className="text-purple-300 font-mono">09018537763</code>) is required to provision sub-administrators or perform root authority overrides.
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

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-300 block">
                Default Credentials:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Master Admin Username: <code className="text-emerald-400 font-mono">admin</code> | Default Password: <code className="text-emerald-400 font-mono">AdminEMTV</code>
              </p>
            </div>
          </div>
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
