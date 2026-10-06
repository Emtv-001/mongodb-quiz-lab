import React, { useState, useEffect } from 'react';
import { AdminUser, AdminPermissions, AdminRole, AdminInvitation } from '../../types/admin';
import {
  getAdminUsers,
  getAdminInvitations,
  createAdminInvitationCode,
  acceptAdminInvitation,
  cancelAdminInvitation,
  updateSubAdmin,
  deleteSubAdmin
} from '../../services/adminService';
import {
  Shield,
  ShieldCheck,
  Mail,
  UserPlus,
  Lock,
  KeyRound,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Send,
  X,
  Copy,
  RefreshCw
} from 'lucide-react';

interface AdminManagementRBACProps {
  currentAdmin: AdminUser;
}

export const AdminManagementRBAC: React.FC<AdminManagementRBACProps> = ({ currentAdmin }) => {
  const [adminList, setAdminList] = useState<AdminUser[]>(() => getAdminUsers());
  const [invitations, setInvitations] = useState<AdminInvitation[]>(() => getAdminInvitations());
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Invite Admin Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<AdminRole>('sub-admin');
  const [recoveryPhraseInput, setRecoveryPhraseInput] = useState('09018537763');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [lastCreatedInvite, setLastCreatedInvite] = useState<AdminInvitation | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [inviteCooldown, setInviteCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (inviteCooldown <= 0) return;
    const timer = setInterval(() => {
      setInviteCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [inviteCooldown]);

  const [invitePerms, setInvitePerms] = useState<AdminPermissions>({
    canEditBranding: false,
    canManageTabs: false,
    canManageDatabases: true,
    canManageQuestions: true,
    canViewLearnerData: true,
    canExportData: true,
    canManageSubAdmins: false,
    canResetSystem: false
  });

  // Accept Invite Modal state (for invitee activation)
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptCode, setAcceptCode] = useState('');
  const [acceptEmail, setAcceptEmail] = useState('');
  const [acceptUsername, setAcceptUsername] = useState('');
  const [acceptDisplayName, setAcceptDisplayName] = useState('');
  const [acceptPassword, setAcceptPassword] = useState('');

  const refreshData = () => {
    setAdminList(getAdminUsers());
    setInvitations(getAdminInvitations());
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCooldown > 0) return;
    setModalError(null);
    setIsSendingInvite(true);

    if (!recoveryPhraseInput.trim()) {
      setModalError("Please enter the Master Recovery Phrase (09018537763) to authorize role dispatch.");
      setIsSendingInvite(false);
      return;
    }

    try {
      const res = await createAdminInvitationCode(
        recoveryPhraseInput,
        inviteRole,
        invitePerms,
        currentAdmin.username
      );

      if (res.success && res.invitation) {
        setStatusMsg({ text: res.message, isError: false });
        setLastCreatedInvite(res.invitation);
        setInviteCooldown(30); // 30s cooldown on invitation dispatch
        refreshData();
      } else {
        setModalError(res.message);
        setStatusMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setModalError(err?.message || "Failed to generate invitation code.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleAcceptInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const res = acceptAdminInvitation(acceptCode, {
      username: acceptUsername,
      email: acceptEmail,
      displayName: acceptDisplayName,
      passwordPlain: acceptPassword
    });

    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      setShowAcceptModal(false);
      setAcceptCode('');
      setAcceptEmail('');
      setAcceptUsername('');
      setAcceptDisplayName('');
      setAcceptPassword('');
      refreshData();
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleCancelInvite = (id: string) => {
    const res = cancelAdminInvitation(id, currentAdmin.username);
    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      refreshData();
    }
  };

  const handleTogglePermission = (adminId: string, permKey: keyof AdminPermissions) => {
    const target = adminList.find(a => a.id === adminId);
    if (!target) return;
    if (target.role === 'super-admin') {
      alert("Super Admin permissions cannot be restricted.");
      return;
    }

    const updatedPermissions = {
      ...target.permissions,
      [permKey]: !target.permissions[permKey]
    };

    updateSubAdmin(adminId, { permissions: updatedPermissions }, currentAdmin.username);
    refreshData();
  };

  const handleToggleStatus = (adminId: string) => {
    const target = adminList.find(a => a.id === adminId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    const res = updateSubAdmin(adminId, { status: newStatus }, currentAdmin.username);
    if (res.success) {
      refreshData();
    } else {
      alert(res.message);
    }
  };

  const handleChangeRole = (adminId: string, newRole: AdminRole) => {
    const res = updateSubAdmin(adminId, { role: newRole }, currentAdmin.username);
    if (res.success) {
      refreshData();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = (adminId: string) => {
    if (!confirm("Are you sure you want to remove this administrator account?")) return;
    const res = deleteSubAdmin(adminId, currentAdmin.username);
    if (res.success) {
      refreshData();
      setStatusMsg({ text: res.message, isError: false });
    } else {
      alert(res.message);
    }
  };

  const permissionLabels: { key: keyof AdminPermissions; label: string }[] = [
    { key: 'canEditBranding', label: 'Branding & Tabs' },
    { key: 'canManageDatabases', label: 'Databases & Collections' },
    { key: 'canManageQuestions', label: 'Question Bank' },
    { key: 'canViewLearnerData', label: 'Learner Cohort' },
    { key: 'canExportData', label: 'Export Data & Reports' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Invitation & Role Assignment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Administrator Governance (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate admin roles with master recovery verification, and manage rights and active privileges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAcceptModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span>Accept Invite Code</span>
          </button>

          <button
            onClick={() => {
              setShowInviteModal(true);
              setLastCreatedInvite(null);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Generate Admin Invite</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 animate-fadeIn ${
          statusMsg.isError
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {statusMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Pending Email Invitations List */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-3 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-purple-300 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Pending Email Invitations ({invitations.filter(i => i.status === 'pending').length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Valid for 7 days
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invitations.filter(i => i.status === 'pending').map((inv) => (
              <div key={inv.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-white block">{inv.email}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono inline-block mt-1">
                      {inv.role}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Revoke / Cancel Invitation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Invite Code:</span>
                    <div className="flex items-center space-x-1.5">
                      <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{inv.invitationCode}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inv.invitationCode);
                          alert(`Copied Invitation Code: ${inv.invitationCode}`);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                        title="Copy Invitation Code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Recovery Phrase:</span>
                    <div className="flex items-center space-x-1.5">
                      <code className="text-purple-300 font-mono font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{inv.recoveryPhrase || 'Auto-generated'}</code>
                      <button
                        onClick={() => {
                          if (inv.recoveryPhrase) {
                            navigator.clipboard.writeText(inv.recoveryPhrase);
                            alert(`Copied Invitee Recovery Phrase: ${inv.recoveryPhrase}`);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-purple-300 rounded transition-colors"
                        title="Copy Invitee Recovery Phrase"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Administrators Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Active Administrator Accounts ({adminList.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Provisioned via Verified Email Authority
          </span>
        </div>

        <div className="space-y-4">
          {adminList.map((admin) => {
            const isMaster = admin.id === 'admin_master_1' || admin.role === 'super-admin';
            return (
              <div
                key={admin.id}
                className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                      {admin.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{admin.displayName}</span>
                        <span className="text-xs font-mono text-slate-400">(@{admin.username})</span>
                        {isMaster ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-purple-500/15 text-purple-300 border-purple-500/30">
                            {admin.role}
                          </span>
                        ) : (
                          <select
                            value={admin.role}
                            onChange={(e) => handleChangeRole(admin.id, e.target.value as AdminRole)}
                            className="bg-slate-900 border border-slate-700 text-emerald-400 text-[10px] font-bold uppercase rounded-lg px-2 py-0.5 cursor-pointer hover:border-emerald-500/50 outline-none"
                          >
                            <option value="sub-admin">SUB-ADMIN</option>
                            <option value="examiner">EXAMINER</option>
                            <option value="moderator">MODERATOR</option>
                            <option value="super-admin">SUPER-ADMIN</option>
                          </select>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 space-x-3 mt-0.5">
                        <span>Email: {admin.email}</span>
                        <span>Created: {admin.createdAt.split('T')[0]}</span>
                        {admin.recoveryPhrase && (
                          <span className="text-purple-400 font-mono text-[10px]">
                            RecPhrase: {admin.recoveryPhrase}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isMaster && (
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleStatus(admin.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                          admin.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        {admin.status === 'active' ? 'Active' : 'Suspended'}
                      </button>

                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove Administrator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Granular Permission Toggles */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Assigned Rights & Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {permissionLabels.map((perm) => {
                      const hasPerm = isMaster || Boolean(admin.permissions[perm.key]);
                      return (
                        <button
                          key={perm.key}
                          disabled={isMaster}
                          onClick={() => handleTogglePermission(admin.id, perm.key)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                            hasPerm
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          } ${isMaster ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasPerm ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span>{perm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Invite Admin */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>Generate Administrator Invite Code</span>
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setModalError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}

            {lastCreatedInvite ? (
              <div className="space-y-3.5 text-xs animate-fadeIn">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3">
                  <span className="font-bold text-emerald-400 flex items-center space-x-1.5 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Invitation Code Generated!</span>
                  </span>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    Share these credentials securely with the assignee to grant them the role of <strong className="text-emerald-400">{lastCreatedInvite.role.toUpperCase()}</strong>.
                  </p>

                  {/* Generated Credentials Callout */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Invitation Code:</span>
                        <code className="text-emerald-400 font-mono font-bold text-xs">{lastCreatedInvite.invitationCode}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(lastCreatedInvite.invitationCode);
                          alert(`Copied Code: ${lastCreatedInvite.invitationCode}`);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div>1. Securely share this Invitation Code with the assignee.</div>
                    <div>2. They can navigate to the Admin Login page and click <strong>"Accept Invite Code"</strong> to complete their account setup.</div>
                    <div>3. The assignee will receive their unique recovery phrase upon successful activation.</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setLastCreatedInvite(null);
                      setModalError(null);
                    }}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pre-Assigned Admin Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="sub-admin">Sub-Admin (Full Curriculum & Database Access)</option>
                    <option value="examiner">Examiner (Question Bank & Cohort only)</option>
                    <option value="moderator">Moderator (Review & Inspection only)</option>
                    <option value="super-admin">Super Admin (Root Governance Privileges)</option>
                  </select>
                </div>

                {/* Master Recovery Phrase Authorization */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      <span>Master Recovery Authorization Required</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecoveryPhraseInput('09018537763')}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold"
                    >
                      Fill Master Key
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Enter master recovery phrase to authorize generating sub-administrator invitations and auto-generating their unique recovery phrases.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter master recovery phrase (09018537763)..."
                    value={recoveryPhraseInput}
                    onChange={(e) => setRecoveryPhraseInput(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setModalError(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingInvite || inviteCooldown > 0}
                    className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
                  >
                    {inviteCooldown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Wait {inviteCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className={`w-3.5 h-3.5 ${isSendingInvite ? 'animate-pulse' : ''}`} />
                        <span>{isSendingInvite ? 'Generating Code...' : 'Generate Invitation Code'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Accept Invite Code & Complete Registration */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Complete Admin Registration</span>
              </h3>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcceptInvite} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Invitation Code *</label>
                <input
                  type="text"
                  placeholder="e.g. INV-98214"
                  value={acceptCode}
                  onChange={(e) => setAcceptCode(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-center rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Full Display Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={acceptDisplayName}
                  onChange={(e) => setAcceptDisplayName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. jane@university.edu"
                  value={acceptEmail}
                  onChange={(e) => setAcceptEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Desired Username *</label>
                <input
                  type="text"
                  placeholder="e.g. janesmith"
                  value={acceptUsername}
                  onChange={(e) => setAcceptUsername(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Set Your Password *</label>
                <input
                  type="password"
                  placeholder="Min 6 characters..."
                  value={acceptPassword}
                  onChange={(e) => setAcceptPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
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
};
