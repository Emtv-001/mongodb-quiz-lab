import React, { useState } from 'react';
import {
  requestPhoneResetOtp,
  verifyPhoneResetOtp,
  completePhoneResetPassword,
  getAuditLogs,
  MASTER_ADMIN_PHONE
} from '../../services/adminService';
import {
  ShieldAlert,
  Phone,
  KeyRound,
  Check,
  AlertCircle,
  Clock,
  Lock,
  Smartphone,
  RefreshCw
} from 'lucide-react';

export const AdminSecuritySettings: React.FC = () => {
  // Phone OTP Reset Flow state
  const [phoneInput, setPhoneInput] = useState(MASTER_ADMIN_PHONE);
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtpDisplay, setSimulatedOtpDisplay] = useState<string | null>(null);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resetMessage, setResetMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const logs = getAuditLogs();

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestPhoneResetOtp(phoneInput);
    if (res.success) {
      setOtpSent(true);
      setSimulatedOtpDisplay(res.simulatedOtp || null);
      setOtpStep(2);
      setResetMessage({ text: res.message, isError: false });
    } else {
      setResetMessage({ text: res.message, isError: true });
    }
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const verifyRes = verifyPhoneResetOtp(phoneInput, otpCodeInput);
    if (!verifyRes.success) {
      setResetMessage({ text: verifyRes.message, isError: true });
      return;
    }

    const resetRes = completePhoneResetPassword(phoneInput, newPasswordInput);
    if (resetRes.success) {
      setResetMessage({ text: resetRes.message, isError: false });
      setOtpStep(1);
      setOtpSent(false);
      setOtpCodeInput('');
      setNewPasswordInput('');
      setSimulatedOtpDisplay(null);
    } else {
      setResetMessage({ text: resetRes.message, isError: true });
    }
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
            Phone OTP Password Reset & Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset administrator credentials via SMS one-time verification codes and audit immutable administrative actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Phone OTP Password Reset Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Phone Number OTP Password Reset
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            If you forget your administrator password, dispatch a secure 6-digit one-time code to your registered mobile phone number.
          </p>

          {resetMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fadeIn ${
              resetMessage.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {resetMessage.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
              <span>{resetMessage.text}</span>
            </div>
          )}

          {/* Simulated SMS Notification Alert */}
          {simulatedOtpDisplay && (
            <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-2 font-bold text-purple-300">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Simulated SMS Gateway Dispatch</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Incoming SMS to <strong>{phoneInput}</strong>: <em>Your MongoDB Quiz Lab verification code is <strong className="font-mono text-white bg-purple-900 px-1.5 py-0.5 rounded">{simulatedOtpDisplay}</strong>. (Expires in 5 mins)</em>
              </p>
            </div>
          )}

          {otpStep === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Registered Admin Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 09018537763"
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Send 6-Digit OTP Code</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteReset} className="space-y-3 text-xs animate-fadeIn">
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
                  className="flex-1 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          )}
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
