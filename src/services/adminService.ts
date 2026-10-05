import {
  AdminUser,
  AdminPermissions,
  SiteCustomization,
  GenericDatabaseCollection,
  AdminAuditLog,
  LearnerProfile,
  PhoneResetSession,
  DatabaseEngineType
} from '../types/admin';
import { sha256Sync } from './security';
import { ALL_DATASETS } from '../data/seedData';
import { loadProgress } from './storage';

export const MASTER_RECOVERY_PHRASE = '09018537763';
export const MASTER_ADMIN_PHONE = '09018537763';
const ADMIN_USERS_KEY = 'mongo_quiz_admin_users_v3';
const SITE_CONFIG_KEY = 'mongo_quiz_site_customization_v3';
const GENERIC_DATABASES_KEY = 'mongo_quiz_generic_databases_v3';
const AUDIT_LOGS_KEY = 'mongo_quiz_admin_audit_logs_v3';
const OTP_SESSION_KEY = 'mongo_quiz_otp_session_v3';

// Default permissions for Master Admin
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

export function addAuditLog(
  adminUsername: string,
  action: string,
  category: AdminAuditLog['category'],
  details: string
): void {
  const logs = getAuditLogs();
  const entry: AdminAuditLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    adminUsername,
    action,
    category,
    details,
    timestamp: new Date().toISOString()
  };
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

/**
 * Admin User Store & Management
 */
export function getAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Initial Master Super Admin
  const masterAdmin: AdminUser = {
    id: 'admin_master_1',
    username: 'admin',
    displayName: 'Chief Administrator (EMTV)',
    phone: MASTER_ADMIN_PHONE,
    email: 'admin@emtvtech.com',
    role: 'super-admin',
    permissions: FULL_PERMISSIONS,
    passwordHash: sha256Sync('AdminEMTV'),
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    createdBy: 'system'
  };

  const initialList = [masterAdmin];
  try {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(initialList));
  } catch {}
  return initialList;
}

export function saveAdminUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save admin users", err);
  }
}

/**
 * Authenticates admin (master or sub-admin)
 */
export function authenticateAdminUser(usernameOrPhone: string, passwordCandidate: string): { success: boolean; user?: AdminUser; error?: string } {
  const users = getAdminUsers();
  const cleanInput = usernameOrPhone.trim();
  const passHash = sha256Sync(passwordCandidate.trim());

  const user = users.find(u =>
    (u.username.toLowerCase() === cleanInput.toLowerCase() || u.phone === cleanInput) &&
    u.passwordHash === passHash
  );

  if (!user) {
    return { success: false, error: "Invalid username, phone number, or password." };
  }

  if (user.status === 'suspended') {
    return { success: false, error: "This administrator account is currently suspended. Contact Master Admin." };
  }

  // Update last active
  user.lastActive = new Date().toISOString();
  saveAdminUsers(users);
  addAuditLog(user.username, 'Admin Login', 'auth', `Successful authentication from web portal`);

  return { success: true, user };
}

/**
 * Create Sub-Admin (EXCLUSIVELY requires the master recovery phrase)
 */
export function createSubAdminWithRecovery(
  recoveryPhraseInput: string,
  newAdmin: {
    username: string;
    displayName: string;
    passwordPlain: string;
    phone?: string;
    email?: string;
    role: AdminUser['role'];
    permissions: AdminPermissions;
  },
  creatorUsername: string = 'admin'
): { success: boolean; message: string; user?: AdminUser } {
  if (recoveryPhraseInput.trim() !== MASTER_RECOVERY_PHRASE) {
    return {
      success: false,
      message: "Security Authorization Failed: Invalid master recovery phrase. Only verified master authority can provision administrators."
    };
  }

  const users = getAdminUsers();
  const cleanUsername = newAdmin.username.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: `Username "${newAdmin.username}" is already assigned to another administrator.` };
  }

  if (newAdmin.passwordPlain.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  const createdUser: AdminUser = {
    id: 'admin_' + Date.now(),
    username: newAdmin.username.trim(),
    displayName: newAdmin.displayName.trim() || newAdmin.username.trim(),
    phone: newAdmin.phone?.trim(),
    email: newAdmin.email?.trim(),
    role: newAdmin.role,
    permissions: newAdmin.role === 'super-admin' ? FULL_PERMISSIONS : newAdmin.permissions,
    passwordHash: sha256Sync(newAdmin.passwordPlain.trim()),
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: creatorUsername
  };

  users.push(createdUser);
  saveAdminUsers(users);
  addAuditLog(creatorUsername, 'Create Administrator', 'security', `Created new admin ${createdUser.username} (${createdUser.role}) with verified recovery phrase`);

  return {
    success: true,
    message: `Administrator "${createdUser.username}" successfully provisioned with designated rights.`,
    user: createdUser
  };
}

/**
 * Update sub-admin permissions & status
 */
export function updateSubAdmin(
  id: string,
  updates: Partial<AdminUser>,
  executorUsername: string = 'admin'
): { success: boolean; message: string } {
  const users = getAdminUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { success: false, message: "Admin not found." };

  if (users[index].id === 'admin_master_1' && updates.status === 'suspended') {
    return { success: false, message: "The Master Super Admin cannot be suspended." };
  }

  users[index] = { ...users[index], ...updates };
  saveAdminUsers(users);
  addAuditLog(executorUsername, 'Update Administrator', 'security', `Updated account/permissions for ${users[index].username}`);

  return { success: true, message: "Administrator details updated successfully." };
}

/**
 * Delete sub-admin
 */
export function deleteSubAdmin(id: string, executorUsername: string = 'admin'): { success: boolean; message: string } {
  if (id === 'admin_master_1') {
    return { success: false, message: "The Master Super Admin cannot be deleted." };
  }
  let users = getAdminUsers();
  const target = users.find(u => u.id === id);
  users = users.filter(u => u.id !== id);
  saveAdminUsers(users);
  if (target) {
    addAuditLog(executorUsername, 'Delete Administrator', 'security', `Deleted admin account ${target.username}`);
  }
  return { success: true, message: "Administrator removed." };
}

/**
 * Phone Number OTP Password Reset
 */
export function requestPhoneResetOtp(phoneInput: string): { success: boolean; message: string; simulatedOtp?: string } {
  const cleanPhone = phoneInput.replace(/[\s\-\(\)]/g, '');
  const users = getAdminUsers();
  const user = users.find(u => (u.phone && u.phone.replace(/[\s\-\(\)]/g, '') === cleanPhone) || cleanPhone === MASTER_ADMIN_PHONE);

  if (!user) {
    return { success: false, message: "No registered administrator found with this phone number." };
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

  const session: PhoneResetSession = {
    phone: cleanPhone,
    otpCode: code,
    expiresAt,
    verified: false,
    adminId: user.id
  };

  try {
    sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
  } catch {}

  addAuditLog(user.username, 'Request OTP Reset', 'auth', `One-time code requested for phone ${cleanPhone}`);

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${cleanPhone}. (Valid for 5 minutes)`,
    simulatedOtp: code
  };
}

export function verifyPhoneResetOtp(phoneInput: string, otpCodeInput: string): { success: boolean; message: string } {
  const cleanPhone = phoneInput.replace(/[\s\-\(\)]/g, '');
  try {
    const raw = sessionStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return { success: false, message: "No active verification session found. Please request a new code." };

    const session: PhoneResetSession = JSON.parse(raw);
    if (session.phone !== cleanPhone) return { success: false, message: "Phone number mismatch." };
    if (Date.now() > session.expiresAt) return { success: false, message: "Verification code has expired. Please request a new code." };
    if (session.otpCode !== otpCodeInput.trim()) return { success: false, message: "Incorrect 6-digit code. Please check and try again." };

    session.verified = true;
    sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));

    return { success: true, message: "Phone verified successfully! You may now set a new password." };
  } catch {
    return { success: false, message: "Failed to verify code." };
  }
}

export function completePhoneResetPassword(phoneInput: string, newPassword: string): { success: boolean; message: string } {
  const cleanPhone = phoneInput.replace(/[\s\-\(\)]/g, '');
  try {
    const raw = sessionStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return { success: false, message: "Session expired." };
    const session: PhoneResetSession = JSON.parse(raw);

    if (session.phone !== cleanPhone || !session.verified) {
      return { success: false, message: "Phone verification required before changing password." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const users = getAdminUsers();
    const user = users.find(u => u.id === session.adminId);
    if (!user) return { success: false, message: "Administrator account not found." };

    user.passwordHash = sha256Sync(newPassword.trim());
    saveAdminUsers(users);

    sessionStorage.removeItem(OTP_SESSION_KEY);
    addAuditLog(user.username, 'Password Reset Completed', 'auth', `Password successfully reset via phone OTP verification`);

    return { success: true, message: "Password updated successfully! You can now log in with your new password." };
  } catch {
    return { success: false, message: "An error occurred while resetting password." };
  }
}

/**
 * Site Branding & Navigation Tabs Customization
 */
export function getSiteCustomization(): SiteCustomization {
  try {
    const raw = localStorage.getItem(SITE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
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

export function saveSiteCustomization(config: SiteCustomization, executorUsername: string = 'admin'): void {
  try {
    localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('site_branding_updated', { detail: config }));
    addAuditLog(executorUsername, 'Update Site Branding', 'branding', `Updated site title to "${config.siteName}", color: ${config.accentColor}`);
  } catch (err) {
    console.error("Failed to save site customization", err);
  }
}

/**
 * Generic Multi-Database Collections Manager (Supports MongoDB, PostgreSQL, MySQL, SQLite, JSON)
 */
export function getDatabaseCollections(): GenericDatabaseCollection[] {
  try {
    const raw = localStorage.getItem(GENERIC_DATABASES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Initialize with the standard sets + generic relational/document datasets
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
 * Learner Cohort Tracking
 */
export function getLearnerProfiles(): LearnerProfile[] {
  const currentProgress = loadProgress();
  const currentAccuracy = currentProgress.questionsAttempted > 0
    ? Math.round((currentProgress.questionsCorrect / currentProgress.questionsAttempted) * 100)
    : 0;

  // Active student profile from this device
  const activeStudent: LearnerProfile = {
    id: currentProgress.learnerId.fingerprintHash.slice(0, 10),
    pseudonym: currentProgress.learnerId.pseudonym,
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
  };

  // Cohort sample records for multi-student view
  const cohortSamples: LearnerProfile[] = [
    {
      id: "std_e4f1a2",
      pseudonym: "MongoLearner-9B41",
      fingerprintHash: "9b41c0e3a5f8d91a",
      firstJoined: "2026-09-05",
      lastActive: "2026-10-03",
      currentStreak: 4,
      longestStreak: 7,
      questionsAttempted: 48,
      questionsCorrect: 41,
      accuracy: 85,
      bestMockScore: 88,
      weakTopics: ["Performance & explain()"],
      masteredTopics: ["CRUD Operations", "Aggregation Pipelines", "Basic & Advanced Querying"],
      status: "active"
    },
    {
      id: "std_3c8e9b",
      pseudonym: "MongoLearner-3C8E",
      fingerprintHash: "3c8e77a11f5d2b09",
      firstJoined: "2026-09-12",
      lastActive: "2026-09-28",
      currentStreak: 0,
      longestStreak: 3,
      questionsAttempted: 18,
      questionsCorrect: 9,
      accuracy: 50,
      bestMockScore: 55,
      weakTopics: ["Indexes & ESR Rule", "Aggregation Pipelines"],
      masteredTopics: ["MongoDB Fundamentals"],
      status: "inactive"
    },
    {
      id: "std_71a0fd",
      pseudonym: "MongoLearner-71A0",
      fingerprintHash: "71a0fd45e2c90a18",
      firstJoined: "2026-09-18",
      lastActive: "2026-10-04",
      currentStreak: 6,
      longestStreak: 6,
      questionsAttempted: 62,
      questionsCorrect: 57,
      accuracy: 92,
      bestMockScore: 94,
      weakTopics: [],
      masteredTopics: ["Security & RBAC", "Replication & High Availability", "Transactions & Consistency"],
      status: "active"
    }
  ];

  return [activeStudent, ...cohortSamples];
}

/**
 * Data Sharing & Report Generator
 */
export function generateShareableReport(
  type: 'cohort-summary' | 'curriculum-mastery' | 'exam-roster' | 'database-dump',
  dataPayload?: any
): { title: string; content: string; filename: string; mimeType: string } {
  const branding = getSiteCustomization();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (type === 'cohort-summary') {
    const learners = getLearnerProfiles();
    const totalAttempted = learners.reduce((sum, l) => sum + l.questionsAttempted, 0);
    const avgAccuracy = Math.round(learners.reduce((sum, l) => sum + l.accuracy, 0) / learners.length);

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

  // Database Dump
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
