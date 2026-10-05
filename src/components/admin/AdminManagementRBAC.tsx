import React, { useState } from 'react';
import { AdminUser, AdminPermissions, AdminRole } from '../../types/admin';
import {
  getAdminUsers,
  createSubAdminWithRecovery,
  updateSubAdmin,
  deleteSubAdmin,
  FULL_PERMISSIONS
} from '../../services/adminService';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Lock,
  KeyRound,
  Check,
  Trash2,
  Sliders,
  AlertCircle,
  X
} from 'lucide-react';

interface AdminManagementRBACProps {
  currentAdmin: AdminUser;
}

export const AdminManagementRBAC: React.FC<AdminManagementRBACProps> = ({ currentAdmin }) => {
  const [adminList, setAdminList] = useState<AdminUser[]>(() => getAdminUsers());
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // New Sub-Admin Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('sub-admin');
  const [recoveryPhraseInput, setRecoveryPhraseInput] = useState('');
  const [newPerms, setNewPerms] = useState<AdminPermissions>({
    canEditBranding: false,
    canManageTabs: false,
    canManageDatabases: true,
    canManageQuestions: true,
    canViewLearnerData: true,
    canExportData: true,
    canManageSubAdmins: false,
    canResetSystem: false
  });

  const refreshList = () => {
    setAdminList(getAdminUsers());
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    const res = createSubAdminWithRecovery(
      recoveryPhraseInput,
      {
        username: newUsername,
        displayName: newDisplayName,
        passwordPlain: newPassword,
        phone: newPhone,
        role: newRole,
        permissions: newPerms
      },
      currentAdmin.username
    );

    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      setShowAddModal(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewPhone('');
      setRecoveryPhraseInput('');
      refreshList();
      setTimeout(() => setStatusMsg(null), 4000);
    } else {
      setStatusMsg({ text: res.message, isError: true });
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
    refreshList();
  };

  const handleToggleStatus = (adminId: string) => {
    const target = adminList.find(a => a.id === adminId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    const res = updateSubAdmin(adminId, { status: newStatus }, currentAdmin.username);
    if (res.success) {
      refreshList();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = (adminId: string) => {
    if (!confirm("Are you sure you want to remove this administrator account?")) return;
    const res = deleteSubAdmin(adminId, currentAdmin.username);
    if (res.success) {
      refreshList();
      setStatusMsg({ text: res.message, isError: false });
      setTimeout(() => setStatusMsg(null), 3000);
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
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Administrator Governance & Rights Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create and track sub-administrators, restrict feature access, and verify master provisioning authority.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Administrator</span>
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

      {/* Admin Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Active Administrator Roster ({adminList.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Master Recovery Verification Required for New Admin Creation
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isMaster
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}>
                          {admin.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 space-x-3 mt-0.5">
                        {admin.phone && <span>Phone: {admin.phone}</span>}
                        <span>Created: {admin.createdAt.split('T')[0]}</span>
                        {admin.lastActive && <span>Last Active: {admin.lastActive.split('T')[0]}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle & Delete (Sub-admins only) */}
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

      {/* Modal: Create Sub-Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Provision New Administrator</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. examiner_john"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. John Doe"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 chars..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number (For OTP)</label>
                  <input
                    type="text"
                    placeholder="e.g. 08012345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                >
                  <option value="sub-admin">Sub-Admin (Standard)</option>
                  <option value="examiner">Examiner (Questions & Cohort only)</option>
                  <option value="moderator">Moderator (Review & Inspect only)</option>
                </select>
              </div>

              {/* Security Authorization: Master Recovery Phrase Check */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-xs">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Master Recovery Authorization Required</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  To prevent unauthorized sub-admin provisioning, enter the original master recovery phrase.
                </p>
                <input
                  type="text"
                  placeholder="Enter master recovery phrase..."
                  value={recoveryPhraseInput}
                  onChange={(e) => setRecoveryPhraseInput(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Verify & Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
