import {
  AdminUser,
  AdminRole,
  AdminPermissions,
  AdminInvitation,
  SiteCustomization,
  GenericDatabaseCollection,
  AdminAuditLog,
  LearnerProfile,
  EmailResetSession,
  DatabaseEngineType,
  DeletionStatement
} from '../types/admin';
import { sha256Sync } from './security';
import { ALL_DATASETS } from '../data/seedData';
import { loadProgress } from './storage';
import { sendAdminInvitationEmail, sendPasswordResetEmail } from './emailService';

export const MASTER_RECOVERY_PHRASE = '09018537763';
export const MASTER_ADMIN_EMAIL = 'admin@emtvtech.com';
export const MASTER_ADMIN_PHONE = '09018537763';

const ADMIN_USERS_KEY = 'mongo_quiz_admin_users_v3';
const ADMIN_INVITES_KEY = 'mongo_quiz_admin_invites_v3';
const SITE_CONFIG_KEY = 'mongo_quiz_site_customization_v3';
const GENERIC_DATABASES_KEY = 'mongo_quiz_generic_databases_v3';
const AUDIT_LOGS_KEY = 'mongo_quiz_admin_audit_logs_v3';
const RESET_OTP_KEY = 'mongo_quiz_reset_otp_session_v3';
const DELETION_STATEMENTS_KEY = 'mongo_quiz_deletion_statements_v1';

export const FULL_PERMISSIONS: AdminPermissions = {
  canEditBranding: true,
  canManageTabs: true,
  canManageDatabases: true,
  canManageQuestions: true,
  canViewLearnerData: true,
  canExportData: true,
  canManageSubAdmins: true,
  canResetSystem: true
};

export const DEFAULT_SITE_CONFIG: SiteCustomization = {
  siteName: "MongoDB Quiz Lab",
  siteSubtitle: "Master MongoDB Through Practical Questions",
  brandName: "EMTVTech",
  logoType: "icon",
  logoValue: "leaf",
  accentColor: "emerald",
  enabledTabs: {
    dashboard: true,
    practice: true,
    quiz: true,
    'mock-exam-selector': true,
    challenge: true,
    mastery: true,
    'topic-practice': true,
    'weak-areas': true,
    revision: true,
    flashcards: true,
    'study-notes': true,
    datasets: true,
    review: true
  },
  customTabLabels: {
    dashboard: "Dashboard",
    practice: "Practice Mode",
    'mock-exam-selector': "Mock Exam Suite",
    challenge: "Challenge Mode",
    mastery: "Level 9 Projects",
    'topic-practice': "Practice by Topic",
    'weak-areas': "Target Weak Areas",
    revision: "Spaced Repetition",
    flashcards: "Study Flashcards",
    'study-notes': "Notes & Cheatsheet",
    datasets: "Live Datasets Explorer",
    review: "Question Review"
  },
  footerText: "EMTVTech Learning Hub • Practical Assessment Platform"
};

/**
 * Audit Logging
 */
export function getAuditLogs(): AdminAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addAuditLog(
  adminUsername: string,
  action: string,
  category: AdminAuditLog['category'],
  details: string
): Promise<void> {
  const entry: AdminAuditLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    adminUsername,
    action,
    category,
    details,
    timestamp: new Date().toISOString()
  };
  try {
    await fetch('/api/admin/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  } catch (err) {}
}

/**
 * Admin User Store & Management
 */
export function getAdminUsers(): AdminUser[] {
  let users: AdminUser[] = [];
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) users = parsed;
    }
  } catch {}

  // Check legacy storage keys if empty or to merge older admin entries
  if (users.length === 0) {
    try {
      const raw2 = localStorage.getItem('mongo_quiz_admin_users_v2') || localStorage.getItem('mongo_quiz_admin_users');
      if (raw2) {
        const parsed2 = JSON.parse(raw2);
        if (Array.isArray(parsed2)) users = parsed2;
      }
    } catch {}
  }

  // Ensure master admin is always present and fully populated
  const masterIndex = users.findIndex(u => u.id === 'admin_master_1' || u.username.toLowerCase() === 'admin');
  if (masterIndex === -1) {
    const masterAdmin: AdminUser = {
      id: 'admin_master_1',
      username: 'admin',
      displayName: 'Chief Administrator (EMTV)',
      email: MASTER_ADMIN_EMAIL,
      phone: MASTER_ADMIN_PHONE,
      recoveryPhrase: MASTER_RECOVERY_PHRASE,
      role: 'super-admin',
      permissions: FULL_PERMISSIONS,
      passwordHash: sha256Sync('AdminEMTV'),
      status: 'active',
      createdAt: '2026-09-01T00:00:00.000Z',
      createdBy: 'system'
    };
    users.unshift(masterAdmin);
    saveAdminUsers(users);
  } else {
    // Repair any missing properties on master admin
    let updated = false;
    if (!users[masterIndex].email) { users[masterIndex].email = MASTER_ADMIN_EMAIL; updated = true; }
    if (!users[masterIndex].phone) { users[masterIndex].phone = MASTER_ADMIN_PHONE; updated = true; }
    if (!users[masterIndex].recoveryPhrase) { users[masterIndex].recoveryPhrase = MASTER_RECOVERY_PHRASE; updated = true; }
    if (updated) saveAdminUsers(users);
  }

  // Ensure all other sub-admins have a recovery phrase
  let hasRepaired = false;

  // One-time removal of admin accounts requested by the Master Super Admin
  const PURGE_FLAG = 'mongo_quiz_admin_purge_v1';
  const PURGED_EMAILS = ['uzooejims@gmail.com'];
  if (!localStorage.getItem(PURGE_FLAG)) {
    const before = users.length;
    users = users.filter(u => isMasterAccount(u) || !PURGED_EMAILS.includes((u.email || '').trim().toLowerCase()));
    if (users.length !== before) {
      hasRepaired = true;
      addAuditLog('admin', 'Delete Administrator', 'security', `Removed admin account(s): ${PURGED_EMAILS.join(', ')}`);
    }
    try { localStorage.setItem(PURGE_FLAG, '1'); } catch {}
  }

  users.forEach(u => {
    // The master account is the only Super Admin
    if (!isMasterAccount(u) && u.role === 'super-admin') {
      u.role = 'sub-admin';
      u.permissions = getRolePermissions('sub-admin');
      hasRepaired = true;
    }
    if (!u.recoveryPhrase) {
      u.recoveryPhrase = generateRecoveryPhrase();
      hasRepaired = true;
    }
    // One-time migration: sync permissions with the assigned role
    if (!u.permsSynced) {
      u.permissions = getRolePermissions(u.role);
      u.permsSynced = true;
      hasRepaired = true;
    }
    // Super admins always retain full rights
    if (u.role === 'super-admin' && Object.values(u.permissions).some(v => !v)) {
      u.permissions = { ...FULL_PERMISSIONS };
      hasRepaired = true;
    }
  });
  if (hasRepaired) saveAdminUsers(users);

  return users;
}

export function isMasterAccount(u: Pick<AdminUser, 'id' | 'username'>): boolean {
  return u.id === 'admin_master_1' || u.username.toLowerCase() === 'admin';
}

/**
 * ROLE-BASED PERMISSION PRESETS
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  'super-admin': {
    canEditBranding: true, canManageTabs: true, canManageDatabases: true, canManageQuestions: true,
    canViewLearnerData: true, canExportData: true, canManageSubAdmins: true, canResetSystem: true
  },
  'sub-admin': {
    canEditBranding: true, canManageTabs: true, canManageDatabases: true, canManageQuestions: true,
    canViewLearnerData: true, canExportData: true, canManageSubAdmins: false, canResetSystem: false
  },
  'examiner': {
    canEditBranding: false, canManageTabs: false, canManageDatabases: false, canManageQuestions: true,
    canViewLearnerData: true, canExportData: false, canManageSubAdmins: false, canResetSystem: false
  },
  'moderator': {
    canEditBranding: false, canManageTabs: false, canManageDatabases: false, canManageQuestions: false,
    canViewLearnerData: true, canExportData: false, canManageSubAdmins: false, canResetSystem: false
  }
};

export function getRolePermissions(role: AdminRole): AdminPermissions {
  return { ...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['moderator']) };
}

/** Returns the fresh stored record for an admin (or null if deleted). */
export function getFreshAdminUser(id: string): AdminUser | null {
  return getAdminUsers().find(u => u.id === id) || null;
}

/** Verifies that the executor is an active admin holding the given permission. */
function authorize(executorUsername: string, perm: keyof AdminPermissions): string | null {
  const executor = getAdminUsers().find(u => u.username.toLowerCase() === executorUsername.toLowerCase());
  if (!executor || executor.status !== 'active') return "Unauthorized: your admin session is invalid.";
  if (executor.role !== 'super-admin' && !executor.permissions[perm]) {
    return "Access denied: your role does not have permission to perform this action.";
  }
  return null;
}

export function saveAdminUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save admin users", err);
  }
}

export async function authenticateAdminUser(usernameOrEmail: string, passwordCandidate: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const passHash = sha256Sync(passwordCandidate.trim());
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail.trim(), passwordHash: passHash })
    });
    
    const data = await res.json();
    if (data.success && data.user) {
      const user = data.user;
      user.id = user._id || user.id;
      
      const users = getAdminUsers();
      if (!users.find((u: AdminUser) => u.username === user.username)) {
        users.push(user);
      } else {
        const idx = users.findIndex((u: AdminUser) => u.username === user.username);
        users[idx] = user;
      }
      saveAdminUsers(users);
      
      // We don't await addAuditLog so it doesn't block login
      addAuditLog(user.username, 'Admin Login', 'auth', 'Successful authentication from web portal (Cloud)');
      return { success: true, user };
    }
    return { success: false, error: data.message || "Invalid username/email or password." };
  } catch (err: any) {
    return { success: false, error: "Login failed: " + err.message };
  }
}

/**
 * EMAIL-BASED ADMIN INVITATIONS WORKFLOW
 */
export function getAdminInvitations(): AdminInvitation[] {
  try {
    const raw = localStorage.getItem(ADMIN_INVITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAdminInvitations(invites: AdminInvitation[]): void {
  try {
    localStorage.setItem(ADMIN_INVITES_KEY, JSON.stringify(invites));
  } catch {}
}

export function generateRecoveryPhrase(): string {
  const num1 = Math.floor(1000 + Math.random() * 9000);
  const num2 = Math.floor(1000 + Math.random() * 9000);
  const num3 = Math.floor(1000 + Math.random() * 9000);
  return `REC-${num1}-${num2}-${num3}`;
}

export async function createAdminInvitationCode(
  recoveryPhraseInput: string,
  role: AdminUser['role'],
  permissions: AdminPermissions,
  creatorUsername: string = 'admin'
): Promise<{ success: boolean; message: string; invitation?: AdminInvitation }> {
  const authError = authorize(creatorUsername, 'canManageSubAdmins');
  if (authError) return { success: false, message: authError };

  if (role === 'super-admin') {
    return { success: false, message: "The Super Admin role is reserved for the Master account and cannot be assigned." };
  }

  const cleanPhrase = recoveryPhraseInput.trim().replace(/[\s\-]/g, '');
  const cleanMaster = MASTER_RECOVERY_PHRASE.replace(/[\s\-]/g, '');

  if (cleanPhrase !== cleanMaster) {
    return {
      success: false,
      message: "Security Authorization Failed: Invalid master recovery phrase. Enter the master recovery phrase (09018537763) to authorize role dispatch."
    };
  }

  const codeNumber = Math.floor(10000 + Math.random() * 90000);
  const inviteCode = `INV-${codeNumber}`;
  const inviteeRecoveryPhrase = generateRecoveryPhrase();

  const invitation: AdminInvitation = {
    id: 'invite_' + Date.now(),
    role,
    permissions: permissions || getRolePermissions(role),
    invitationCode: inviteCode,
    recoveryPhrase: inviteeRecoveryPhrase,
    status: 'pending',
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date().toISOString(),
    createdBy: creatorUsername
  };

  try {
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitation)
    });
    const data = await res.json();
    if (!data.success) {
      return { success: false, message: data.message || "Failed to create invitation" };
    }
  } catch (err: any) {
    return { success: false, message: "Network error: " + err.message };
  }

  addAuditLog(
    creatorUsername,
    'Generate Admin Invite Code',
    'security',
    `Generated ${role} invitation code (Code: ${inviteCode})`
  );

  return {
    success: true,
    message: `Invitation code successfully generated!`,
    invitation
  };
}

export async function acceptAdminInvitation(
  invitationCodeInput: string,
  details: { username: string; email: string; displayName: string; passwordPlain: string }
): Promise<{ success: boolean; message: string; user?: AdminUser; recoveryPhrase?: string; assignedRole?: string }> {
  const cleanCode = invitationCodeInput.trim().toUpperCase();
  
  let invites: AdminInvitation[] = [];
  try {
    const res = await fetch('/api/admin/invites');
    const data = await res.json();
    if (data.success) invites = data.invites;
  } catch (e) {}

  const invite = invites.find(i => i.invitationCode === cleanCode && i.status === 'pending');

  if (!invite) {
    return { success: false, message: "Invalid or expired invitation code." };
  }

  if (Date.now() > invite.expiresAt) {
    return { success: false, message: "This invitation code has expired. Please request a new invitation." };
  }

  const cleanUsername = details.username.trim().toLowerCase();
  const cleanEmail = details.email.trim().toLowerCase();

  if (details.passwordPlain.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  const newUser: AdminUser = {
    id: 'admin_' + Date.now(),
    username: details.username.trim(),
    displayName: details.displayName.trim() || details.username.trim(),
    email: cleanEmail,
    recoveryPhrase: invite.recoveryPhrase || generateRecoveryPhrase(),
    role: invite.role,
    permissions: invite.permissions,
    passwordHash: sha256Sync(details.passwordPlain.trim()),
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: invite.createdBy,
    permsSynced: true
  };

  try {
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: "Failed to create user: " + e.message };
  }

  try {
    await fetch(`/api/admin/invites?id=${invite.id}`, { method: 'DELETE' });
  } catch (e) {}

  addAuditLog(
    newUser.username,
    'Accept Admin Invitation',
    'security',
    `Completed registration via invitation ${cleanCode} with assigned role ${invite.role}`
  );

  return {
    success: true,
    message: `Welcome @${newUser.username}! Your administrator account is now active.`,
    user: newUser,
    recoveryPhrase: newUser.recoveryPhrase,
    assignedRole: newUser.role
  };
}

export async function cancelAdminInvitation(id: string, executorUsername: string = 'admin'): Promise<{ success: boolean; message: string }> {
  const authError = authorize(executorUsername, 'canManageSubAdmins');
  if (authError) return { success: false, message: authError };

  try {
    const res = await fetch(`/api/admin/invites?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  addAuditLog(executorUsername, 'Cancel Admin Invite', 'security', `Revoked invitation ${id}`);
  return { success: true, message: "Invitation cancelled." };
}

export async function updateSubAdmin(
  id: string,
  updates: Partial<AdminUser>,
  executorUsername: string = 'admin'
): Promise<{ success: boolean; message: string }> {
  const authError = authorize(executorUsername, 'canManageSubAdmins');
  
  const safeUpdates: Partial<AdminUser> = { ...updates };
  delete safeUpdates.id;

  try {
    const res = await fetch('/api/admin/admins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...safeUpdates })
    });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  addAuditLog(executorUsername, 'Update Administrator', 'security', `Updated account/permissions for admin ID: ${id}`);

  return { success: true, message: "Administrator details updated successfully." };
}

/**
 * ACCOUNT DELETION STATEMENTS & STATEMENTS BOARD (FOR SUPER ADMIN)
 */
export async function getDeletionStatements(): Promise<DeletionStatement[]> {
  try {
    const res = await fetch('/api/admin/statements');
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch deletion statements", err);
    return [];
  }
}

export async function saveDeletionStatements(statements: DeletionStatement[]): Promise<void> {
  // Now no-op since API handles storage, but keeping it async if needed.
}

export async function recordDeletionStatement(
  data: Omit<DeletionStatement, 'id' | 'deletedAt'>
): Promise<DeletionStatement | null> {
  try {
    const res = await fetch('/api/admin/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to record deletion statement", err);
    return null;
  }
}

export function clearDeletionStatements(executorUsername: string = 'admin'): { success: boolean; message: string } {
  const authError = authorize(executorUsername, 'canResetSystem');
  if (authError) return { success: false, message: authError };
  saveDeletionStatements([]);
  addAuditLog(executorUsername, 'Clear Deletion Statements', 'security', 'Super Admin cleared the account deletion statements board.');
  return { success: true, message: "Deletion statements board cleared." };
}

export async function deleteSubAdmin(
  id: string,
  executorUsername: string = 'admin',
  reasonCategory: string = 'administrative-removal',
  statement: string = 'Administrator account removed.'
): Promise<{ success: boolean; message: string }> {
  let targetUser = getFreshAdminUser(id);
  
  try {
    const res = await fetch(`/api/admin/admins?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  if (targetUser) {
    await recordDeletionStatement({
      accountId: targetUser.id,
      accountType: 'admin',
      username: targetUser.username,
      displayName: targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName}` : targetUser.username,
      role: targetUser.role,
      reasonCategory,
      statement,
      deletedBy: executorUsername
    });
  }

  addAuditLog(
    executorUsername,
    'Delete Administrator',
    'security',
    `Deleted admin ID: ${id}. Reason: ${reasonCategory}. Statement: ${statement}`
  );

  return { success: true, message: `Administrator account has been deleted.` };
}

/**
 * PASSWORD RESET VIA OTP (EMAIL & PHONE)
 */
export async function requestPasswordResetOtp(emailOrPhoneInput: string): Promise<{ success: boolean; message: string }> {
  const raw = (emailOrPhoneInput || '').trim();
  if (!raw) {
    return { success: false, message: "Please enter your registered email address or username." };
  }

  const clean = raw.toLowerCase();
  const digitsOnly = raw.replace(/\D/g, '');
  let users = getAdminUsers();

  // 1. Search in active admin users
  let user = users.find(u =>
    (u.email && u.email.trim().toLowerCase() === clean) ||
    (u.username && u.username.trim().toLowerCase() === clean) ||
    (u.phone && (u.phone.trim().toLowerCase() === clean || (digitsOnly.length >= 7 && u.phone.replace(/\D/g, '') === digitsOnly)))
  );

  // 2. If not found, check pending/active admin invitations
  if (!user) {
    const invites = getAdminInvitations();
    const invite = invites.find(i => i.email && i.email.trim().toLowerCase() === clean);
    if (invite) {
      // Auto-provision admin user from invitation so they can reset/set password
      const newAdmin: AdminUser = {
        id: 'admin_' + Date.now(),
        username: clean.split('@')[0].replace(/[^a-z0-9_]/g, '') || ('admin_' + Math.floor(100 + Math.random() * 900)),
        displayName: invite.email!.split('@')[0],
        email: invite.email!,
        recoveryPhrase: invite.recoveryPhrase || generateRecoveryPhrase(),
        role: invite.role,
        permissions: invite.permissions,
        passwordHash: sha256Sync('AdminEMTV'),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: invite.createdBy
      };
      users.push(newAdmin);
      saveAdminUsers(users);
      user = newAdmin;
    }
  }

  // 3. Fallback for master admin aliases
  if (!user && (clean === 'admin' || clean === MASTER_ADMIN_EMAIL.toLowerCase() || (digitsOnly.length >= 7 && MASTER_ADMIN_PHONE.replace(/\D/g, '') === digitsOnly))) {
    user = users.find(u => u.username === 'admin');
  }

  if (!user) {
    return {
      success: false,
      message: `No administrator account found matching "${raw}". Please check your email spelling or use your recovery phrase.`
    };
  }

  // Check rate limiting / cooldown (45 seconds) to avoid spamming
  try {
    const rawSession = sessionStorage.getItem(RESET_OTP_KEY);
    if (rawSession) {
      const prev: EmailResetSession = JSON.parse(rawSession);
      if (prev.requestedAt && (prev.emailOrPhone.toLowerCase() === raw.toLowerCase() || prev.adminId === user.id)) {
        const elapsed = Date.now() - prev.requestedAt;
        const cooldownMs = 45000;
        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
          return {
            success: false,
            message: `Rate limit active: Please wait ${remaining}s before requesting another verification code to avoid email spam.`
          };
        }
      }
    }
  } catch {}

  const targetEmail = user.email || MASTER_ADMIN_EMAIL;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

  const session: EmailResetSession = {
    emailOrPhone: raw,
    otpCode: code,
    expiresAt,
    verified: false,
    adminId: user.id,
    requestedAt: Date.now()
  };

  try {
    sessionStorage.setItem(RESET_OTP_KEY, JSON.stringify(session));
  } catch {}

  addAuditLog(user.username, 'Request Password Reset OTP', 'auth', `One-time reset code dispatched in real-time to ${targetEmail}`);

  // Dispatch real email in real-time
  await sendPasswordResetEmail(targetEmail, code, user.displayName || user.username);

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched in real-time to ${targetEmail}. (Valid for 5 minutes)`
  };
}

export function verifyPasswordResetOtp(emailOrPhoneInput: string, otpCodeInput: string): { success: boolean; message: string } {
  const inputCode = (otpCodeInput || '').trim();
  const cleanInputPhrase = inputCode.replace(/[\s\-]/g, '').toUpperCase();
  const masterPhraseClean = MASTER_RECOVERY_PHRASE.replace(/[\s\-]/g, '').toUpperCase();

  try {
    const raw = sessionStorage.getItem(RESET_OTP_KEY);
    if (!raw) return { success: false, message: "No active reset session found. Please request a new code." };

    const session: EmailResetSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) return { success: false, message: "Verification code has expired. Please request a new code." };

    const users = getAdminUsers();
    const user = users.find(u => u.id === session.adminId);
    const userPhraseClean = (user?.recoveryPhrase || '').replace(/[\s\-]/g, '').toUpperCase();

    const isMatch = (session.otpCode === inputCode) ||
                    (cleanInputPhrase === masterPhraseClean) ||
                    (userPhraseClean && cleanInputPhrase === userPhraseClean);

    if (!isMatch) return { success: false, message: "Incorrect code. Please enter the 6-digit OTP or your Auto-Generated Recovery Phrase." };

    session.verified = true;
    sessionStorage.setItem(RESET_OTP_KEY, JSON.stringify(session));

    return { success: true, message: "Code verified successfully! You may now set a new password." };
  } catch {
    return { success: false, message: "Failed to verify code." };
  }
}

export function completePasswordReset(emailOrPhoneInput: string, newPassword: string): { success: boolean; message: string } {
  try {
    const raw = sessionStorage.getItem(RESET_OTP_KEY);
    if (!raw) return { success: false, message: "Session expired. Please request a new verification code." };
    const session: EmailResetSession = JSON.parse(raw);

    if (!session.verified) {
      return { success: false, message: "Verification required before changing password." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const users = getAdminUsers();
    const user = users.find(u => u.id === session.adminId);
    if (!user) return { success: false, message: "Administrator account not found." };

    user.passwordHash = sha256Sync(newPassword.trim());
    user.status = 'active';
    saveAdminUsers(users);

    sessionStorage.removeItem(RESET_OTP_KEY);
    addAuditLog(user.username, 'Password Reset Completed', 'auth', `Password reset successfully via OTP verification`);

    return { success: true, message: "Password updated successfully! You can now log in with your new credentials." };
  } catch {
    return { success: false, message: "An error occurred while updating password." };
  }
}

/**
 * INSTANT PASSWORD RESET USING ACCOUNT RECOVERY PHRASE
 */
export function resetAdminPasswordWithRecoveryPhrase(
  emailOrUsernameInput: string,
  recoveryPhraseInput: string,
  newPasswordPlain: string
): { success: boolean; message: string; username?: string } {
  const rawInput = (emailOrUsernameInput || '').trim();
  const clean = rawInput.toLowerCase();
  const cleanPhrase = (recoveryPhraseInput || '').trim().replace(/[\s\-]/g, '').toUpperCase();
  const masterPhraseClean = MASTER_RECOVERY_PHRASE.replace(/[\s\-]/g, '').toUpperCase();

  if (!clean) {
    return { success: false, message: "Please enter your username or registered email." };
  }
  if (!cleanPhrase) {
    return { success: false, message: "Please enter your auto-generated recovery phrase." };
  }
  if (newPasswordPlain.trim().length < 6) {
    return { success: false, message: "New password must be at least 6 characters long." };
  }

  let users = getAdminUsers();
  let user = users.find(u =>
    (u.email && u.email.trim().toLowerCase() === clean) ||
    (u.username && u.username.trim().toLowerCase() === clean) ||
    (u.phone && u.phone.replace(/\D/g, '') === rawInput.replace(/\D/g, ''))
  );

  // Check admin invitations if not yet converted
  if (!user) {
    const invites = getAdminInvitations();
    const invite = invites.find(i => i.email && i.email.trim().toLowerCase() === clean);
    if (invite) {
      const invitePhraseClean = (invite.recoveryPhrase || '').replace(/[\s\-]/g, '').toUpperCase();
      if (cleanPhrase === invitePhraseClean || cleanPhrase === masterPhraseClean) {
        const newAdmin: AdminUser = {
          id: 'admin_' + Date.now(),
          username: clean.split('@')[0].replace(/[^a-z0-9_]/g, '') || ('admin_' + Math.floor(100 + Math.random() * 900)),
          displayName: invite.email!.split('@')[0],
          email: invite.email!,
          recoveryPhrase: invite.recoveryPhrase || generateRecoveryPhrase(),
          role: invite.role,
          permissions: invite.permissions,
          passwordHash: sha256Sync(newPasswordPlain.trim()),
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: invite.createdBy
        };
        users.push(newAdmin);
        saveAdminUsers(users);
        invite.status = 'accepted';
        saveAdminInvitations(invites);
        addAuditLog(newAdmin.username, 'Password Reset via Recovery Phrase', 'auth', `Admin activated & password set via recovery phrase`);
        return {
          success: true,
          message: `Password set successfully! Welcome @${newAdmin.username}. You can now log in.`,
          username: newAdmin.username
        };
      }
    }
  }

  // Fallback for master admin
  if (!user && (clean === 'admin' || clean === MASTER_ADMIN_EMAIL.toLowerCase())) {
    user = users.find(u => u.username === 'admin');
  }

  if (!user) {
    return { success: false, message: `No administrator account found matching "${rawInput}".` };
  }

  const userPhraseClean = (user.recoveryPhrase || MASTER_RECOVERY_PHRASE).replace(/[\s\-]/g, '').toUpperCase();
  const isMatch = (cleanPhrase === userPhraseClean) || (cleanPhrase === masterPhraseClean);

  if (!isMatch) {
    return {
      success: false,
      message: "Invalid Recovery Phrase. Please check your auto-generated recovery phrase (REC-XXXX-XXXX-XXXX or 09018537763) and try again."
    };
  }

  user.passwordHash = sha256Sync(newPasswordPlain.trim());
  user.status = 'active';
  saveAdminUsers(users);

  addAuditLog(user.username, 'Password Reset via Recovery Phrase', 'auth', `Password reset successfully via recovery phrase verification`);

  return {
    success: true,
    message: "Password reset successful! You can now log in with your new password.",
    username: user.username
  };
}

// Phone OTP aliases for backwards compatibility
export const requestPhoneResetOtp = requestPasswordResetOtp;
export const verifyPhoneResetOtp = verifyPasswordResetOtp;
export const completePhoneResetPassword = completePasswordReset;

/**
 * Site Branding & Navigation Customization
 */
export async function getSiteCustomization(): Promise<SiteCustomization> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const parsed = await res.json();
      return {
        ...DEFAULT_SITE_CONFIG,
        ...parsed,
        enabledTabs: { ...DEFAULT_SITE_CONFIG.enabledTabs, ...(parsed.enabledTabs || {}) },
        customTabLabels: { ...DEFAULT_SITE_CONFIG.customTabLabels, ...(parsed.customTabLabels || {}) }
      };
    }
  } catch {}
  return DEFAULT_SITE_CONFIG;
}

export async function saveSiteCustomization(config: SiteCustomization, executorUsername: string = 'admin'): Promise<void> {
  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('site_branding_updated', { detail: config }));
      addAuditLog(executorUsername, 'Update Site Branding', 'branding', `Updated site title to "${config.siteName}", color: ${config.accentColor}`);
    }
  } catch (err) {
    console.error("Failed to save site customization", err);
  }
}

/**
 * Universal Multi-Database Collections
 */
export function getDatabaseCollections(): GenericDatabaseCollection[] {
  try {
    const raw = localStorage.getItem(GENERIC_DATABASES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const initialCollections: GenericDatabaseCollection[] = [
    {
      id: "col_gptdata02",
      databaseType: "mongodb",
      name: "GptData02",
      label: "Students & Academic Records",
      description: "Default MongoDB student collection with nested addresses, array courses, and numeric GPAs.",
      schemaFields: [
        { name: "_id", type: "number", required: true },
        { name: "Name", type: "string", required: true },
        { name: "Age", type: "number" },
        { name: "GPA", type: "double" },
        { name: "Courses", type: "array" },
        { name: "Address.State", type: "string" }
      ],
      documents: ALL_DATASETS['GptData02']?.data || [],
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z"
    },
    {
      id: "col_hospital",
      databaseType: "mongodb",
      name: "patients",
      label: "Hospital Management",
      description: "Healthcare records, clinical vitals, blood groups, and doctor assignments.",
      schemaFields: [
        { name: "_id", type: "string", required: true },
        { name: "patientName", type: "string", required: true },
        { name: "department", type: "string" },
        { name: "admitted", type: "boolean" },
        { name: "prescriptions", type: "array" }
      ],
      documents: ALL_DATASETS['hospital']?.data || [],
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z"
    },
    {
      id: "col_banking",
      databaseType: "mongodb",
      name: "accounts",
      label: "Banking & Ledgers",
      description: "Financial account records, balances, KYC verification, and transaction histories.",
      schemaFields: [
        { name: "_id", type: "string", required: true },
        { name: "accountNumber", type: "string", required: true },
        { name: "balance", type: "double", required: true },
        { name: "tier", type: "number" }
      ],
      documents: ALL_DATASETS['banking']?.data || [],
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z"
    },
    {
      id: "col_ecommerce",
      databaseType: "mongodb",
      name: "products",
      label: "E-Commerce Catalog",
      description: "Product inventory, pricing, SKU tags, and category attributes.",
      schemaFields: [
        { name: "_id", type: "string", required: true },
        { name: "sku", type: "string", required: true },
        { name: "price", type: "number", required: true },
        { name: "stock", type: "number" }
      ],
      documents: ALL_DATASETS['ecommerce']?.data || [],
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z"
    },
    {
      id: "col_relational_sql",
      databaseType: "postgresql",
      name: "customer_invoices",
      label: "PostgreSQL Invoices Table",
      description: "Relational customer billing records with foreign key customerId and tax calculations.",
      schemaFields: [
        { name: "invoice_id", type: "serial", required: true },
        { name: "customer_id", type: "integer", required: true },
        { name: "subtotal", type: "numeric(10,2)", required: true },
        { name: "tax_rate", type: "numeric(4,2)" },
        { name: "status", type: "varchar(20)" }
      ],
      documents: [
        { invoice_id: 101, customer_id: 42, subtotal: 350.00, tax_rate: 7.50, status: "PAID", created_at: "2026-09-15" },
        { invoice_id: 102, customer_id: 88, subtotal: 1250.50, tax_rate: 7.50, status: "PENDING", created_at: "2026-09-18" },
        { invoice_id: 103, customer_id: 19, subtotal: 90.00, tax_rate: 7.50, status: "OVERDUE", created_at: "2026-08-30" }
      ],
      createdAt: "2026-09-15T00:00:00.000Z",
      updatedAt: "2026-09-15T00:00:00.000Z"
    }
  ];

  try {
    localStorage.setItem(GENERIC_DATABASES_KEY, JSON.stringify(initialCollections));
  } catch {}
  return initialCollections;
}

export function saveDatabaseCollections(collections: GenericDatabaseCollection[], executorUsername: string = 'admin'): void {
  try {
    localStorage.setItem(GENERIC_DATABASES_KEY, JSON.stringify(collections));
    addAuditLog(executorUsername, 'Update Databases', 'database', `Saved ${collections.length} database collections`);
  } catch (err) {
    console.error("Failed to save database collections", err);
  }
}

/**
 * REAL-TIME DYNAMIC METRICS & LIVE LEARNER PROFILES (NO HARDCODING)
 */
export function getRealtimeLearnerProfiles(): LearnerProfile[] {
  const profiles: LearnerProfile[] = [];
  const currentProgress = loadProgress();
  const activeLocalId = currentProgress.learnerId.fingerprintHash.slice(0, 10);
  
  let activeRegisteredAccountId: string | null = null;
  try {
    const sessionRaw = sessionStorage.getItem('mongo_quiz_active_learner_session_v2');
    if (sessionRaw) {
      activeRegisteredAccountId = JSON.parse(sessionRaw).id;
    }
  } catch {}

  // 1. Process all Registered Gamification Accounts
  try {
    const raw = localStorage.getItem('mongo_quiz_learner_accounts_directory_v2');
    if (raw) {
      const dir = JSON.parse(raw);
      Object.values(dir).forEach((acc: any) => {
        const isCurrentlyActive = acc.id === activeRegisteredAccountId;
        
        // If this registered account is currently playing, show their real real-time progress stats!
        const attempts = isCurrentlyActive ? currentProgress.questionsAttempted : (acc.xp || 0);
        const corrects = isCurrentlyActive ? currentProgress.questionsCorrect : (acc.coins || 0);
        const accuracy = attempts > 0 ? Math.round((corrects / attempts) * 100) : 100;
        
        profiles.push({
          id: acc.id,
          pseudonym: acc.username,
          fingerprintHash: acc.email,
          firstJoined: acc.createdAt || new Date().toISOString(),
          lastActive: isCurrentlyActive ? currentProgress.lastActiveDate : (acc.createdAt || new Date().toISOString()),
          currentStreak: isCurrentlyActive ? currentProgress.currentStreak : 0,
          longestStreak: isCurrentlyActive ? currentProgress.longestStreak : 0,
          questionsAttempted: attempts,
          questionsCorrect: corrects,
          accuracy: accuracy,
          bestMockScore: isCurrentlyActive ? currentProgress.bestMockScore : 0,
          weakTopics: [],
          masteredTopics: acc.unlockedBadges || [],
          status: 'active'
        });
      });
    }
  } catch (err) {}

  // 2. Add active local progress student ONLY if they aren't logged into a gamification account
  // and they have actually answered questions (not just a blank slate).
  const isWorthTracking = currentProgress.questionsAttempted > 0;
  if (!activeRegisteredAccountId && isWorthTracking) {
    const currentAccuracy = currentProgress.questionsAttempted > 0
      ? Math.round((currentProgress.questionsCorrect / currentProgress.questionsAttempted) * 100)
      : 0;

    profiles.push({
      id: activeLocalId,
      pseudonym: currentProgress.learnerId.pseudonym + " (Local)",
      fingerprintHash: currentProgress.learnerId.fingerprintHash,
      firstJoined: currentProgress.learnerId.createdAt,
      lastActive: currentProgress.lastActiveDate,
      currentStreak: currentProgress.currentStreak,
      longestStreak: currentProgress.longestStreak,
      questionsAttempted: currentProgress.questionsAttempted,
      questionsCorrect: currentProgress.questionsCorrect,
      accuracy: currentAccuracy,
      bestMockScore: currentProgress.bestMockScore,
      weakTopics: Object.entries(currentProgress.topicStats)
        .filter(([_, s]) => s.attempted > 0 && (s.correct / s.attempted) < 0.6)
        .map(([t]) => t),
      masteredTopics: Object.entries(currentProgress.topicStats)
        .filter(([_, s]) => s.attempted >= 2 && (s.correct / s.attempted) >= 0.75)
        .map(([t]) => t),
      status: 'active'
    });
  }

  return profiles;
}

export async function generateShareableReport(
  type: 'cohort-summary' | 'curriculum-mastery' | 'database-dump',
  dataPayload?: any
): Promise<{ title: string; content: string; filename: string; mimeType: string }> {
  const branding = await getSiteCustomization();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (type === 'cohort-summary') {
    const learners = getRealtimeLearnerProfiles();
    const totalAttempted = learners.reduce((sum, l) => sum + l.questionsAttempted, 0);
    const avgAccuracy = learners.length > 0 ? Math.round(learners.reduce((sum, l) => sum + l.accuracy, 0) / learners.length) : 0;

    let content = `# ${branding.siteName} — Cohort Performance Report\n`;
    content += `**Generated**: ${dateStr} | **Brand**: ${branding.brandName}\n\n`;
    content += `## Summary Metrics\n`;
    content += `- Total Tracked Learners: ${learners.length}\n`;
    content += `- Total Questions Solved: ${totalAttempted}\n`;
    content += `- Average Cohort Accuracy: ${avgAccuracy}%\n\n`;
    content += `## Learner Roster\n\n`;
    content += `| Learner Pseudonym | Streak | Solved | Accuracy | Best Mock | Status |\n`;
    content += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    learners.forEach(l => {
      content += `| ${l.pseudonym} | ${l.currentStreak}d | ${l.questionsAttempted} | ${l.accuracy}% | ${l.bestMockScore}% | ${l.status} |\n`;
    });

    return {
      title: "Cohort Performance Report",
      content,
      filename: `cohort_performance_report_${Date.now()}.md`,
      mimeType: "text/markdown"
    };
  }

  if (type === 'curriculum-mastery') {
    const progress = loadProgress();
    let content = `# ${branding.siteName} — Curriculum Mastery Breakdown\n`;
    content += `**Date**: ${dateStr}\n\n`;
    content += `| Topic | Attempted | Correct | Accuracy | Earned Points |\n`;
    content += `| :--- | :--- | :--- | :--- | :--- |\n`;
    Object.entries(progress.topicStats).forEach(([topic, stat]) => {
      const acc = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
      content += `| ${topic} | ${stat.attempted} | ${stat.correct} | ${acc}% | ${stat.earnedPoints}/${stat.totalPoints} |\n`;
    });

    return {
      title: "Curriculum Mastery Breakdown",
      content,
      filename: `curriculum_mastery_${Date.now()}.md`,
      mimeType: "text/markdown"
    };
  }

  const collections = getDatabaseCollections();
  const targetCol = dataPayload || collections[0];
  const jsonStr = JSON.stringify(targetCol, null, 2);

  return {
    title: `${targetCol.label} (${targetCol.name}) Export`,
    content: jsonStr,
    filename: `${targetCol.name}_export_${Date.now()}.json`,
    mimeType: "application/json"
  };
}
