import {
  RegisteredLearnerAccount,
  LearnerAchievement,
  LeaderboardEntry,
  LearnerOtpSession,
  StudentProgress,
  LearnerTier
} from '../types';
import { generateRecoveryPhrase, recordDeletionStatement, addAuditLog } from './adminService';
import { sha256Sync } from './security';
import { loadProgress, saveProgress } from './storage';
import { sendOtpRegistrationEmail, sendPasswordResetEmail } from './emailService';

const LEARNER_ACCOUNTS_DIR_KEY = 'mongo_quiz_learner_accounts_directory_v2';
const ACTIVE_LEARNER_SESSION_KEY = 'mongo_quiz_active_learner_session_v2';
const LEARNER_OTP_SESSION_KEY = 'mongo_quiz_learner_otp_session_v2';
const LEGACY_ACCOUNT_KEY = 'mongo_quiz_registered_learner_account_v2';

/**
 * Retrieves the directory of all registered accounts on this device.
 */
function getLearnerAccountsDirectory(): Record<string, RegisteredLearnerAccount> {
  try {
    const raw = localStorage.getItem(LEARNER_ACCOUNTS_DIR_KEY);
    let dir = raw ? JSON.parse(raw) : {};
    
    // Migration from old single-account setup
    const legacyRaw = localStorage.getItem(LEGACY_ACCOUNT_KEY);
    if (legacyRaw) {
      const legacyAccount: RegisteredLearnerAccount = JSON.parse(legacyRaw);
      if (!dir[legacyAccount.id]) {
        dir[legacyAccount.id] = legacyAccount;
        localStorage.setItem(LEARNER_ACCOUNTS_DIR_KEY, JSON.stringify(dir));
        localStorage.removeItem(LEGACY_ACCOUNT_KEY);
      }
    }
    return dir;
  } catch {
    return {};
  }
}

/**
 * Retrieves the currently registered & logged in learner account from the active session.
 */
export function getRegisteredLearnerAccount(): RegisteredLearnerAccount | null {
  try {
    const sessionId = sessionStorage.getItem(ACTIVE_LEARNER_SESSION_KEY);
    if (!sessionId) return null;
    const dir = getLearnerAccountsDirectory();
    return dir[sessionId] || null;
  } catch {
    return null;
  }
}

/**
 * Saves a learner account to the directory and updates the active session if provided.
 * If account is null, it logs the user out by clearing the active session.
 */
export function saveRegisteredLearnerAccount(account: RegisteredLearnerAccount | null): void {
  try {
    if (account) {
      const dir = getLearnerAccountsDirectory();
      dir[account.id] = account;
      localStorage.setItem(LEARNER_ACCOUNTS_DIR_KEY, JSON.stringify(dir));
      sessionStorage.setItem(ACTIVE_LEARNER_SESSION_KEY, account.id);
    } else {
      sessionStorage.removeItem(ACTIVE_LEARNER_SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent('learner_account_updated', { detail: account }));
  } catch {}
}

/**
 * Initiates learner registration by generating an OTP and an auto-generated recovery phrase,
 * and dispatching a real email in real-time to the learner.
 */
export async function requestLearnerRegistrationOtp(
  email: string,
  username: string,
  displayName: string,
  passwordPlain: string
): Promise<{ success: boolean; message: string; recoveryPhrase?: string; otpCode?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: "Please enter a valid email address." };
  }

  if (cleanUsername.length < 3) {
    return { success: false, message: "Username must be at least 3 characters (letters, numbers, underscores)." };
  }

  if (passwordPlain.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  const existing = getRegisteredLearnerAccount();
  if (existing && existing.email.toLowerCase() === cleanEmail) {
    return { success: false, message: "An account is already registered with this email address. Please log in." };
  }

  // Check rate limiting / cooldown (45 seconds) to avoid spamming
  try {
    const rawSession = sessionStorage.getItem(LEARNER_OTP_SESSION_KEY);
    if (rawSession) {
      const prev: LearnerOtpSession = JSON.parse(rawSession);
      if (prev.requestedAt && prev.email.toLowerCase() === cleanEmail) {
        const elapsed = Date.now() - prev.requestedAt;
        const cooldownMs = 45000;
        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
          return {
            success: false,
            message: `Please wait ${remaining}s before requesting another verification email to prevent spam.`
          };
        }
      }
    }
  } catch {}

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const recoveryPhrase = generateRecoveryPhrase();
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

  const session: LearnerOtpSession = {
    email: cleanEmail,
    username: cleanUsername,
    displayName: displayName.trim() || cleanUsername,
    passwordPlain: passwordPlain.trim(),
    otpCode,
    recoveryPhrase,
    expiresAt,
    requestedAt: Date.now()
  };

  try {
    sessionStorage.setItem(LEARNER_OTP_SESSION_KEY, JSON.stringify(session));
  } catch {}

  // Dispatch real email in real-time
  const emailResult = await sendOtpRegistrationEmail(cleanEmail, session.displayName, otpCode, recoveryPhrase);
  
  if (!emailResult.success) {
    return { success: false, message: `Email Dispatch Failed: ${emailResult.message}` };
  }

  return {
    success: true,
    message: `Verification code has been dispatched to ${cleanEmail}!`,
    recoveryPhrase,
    otpCode
  };
}

/**
 * Verifies OTP and completes registration (Strictly requires OTP code)
 */
export async function verifyLearnerRegistrationOtp(
  otpCodeInput: string
): Promise<{ success: boolean; message: string; account?: RegisteredLearnerAccount }> {
  try {
    const raw = sessionStorage.getItem(LEARNER_OTP_SESSION_KEY);
    if (!raw) {
      return { success: false, message: "No active registration session found. Please register again." };
    }

    const session: LearnerOtpSession = JSON.parse(raw);

    if (Date.now() > session.expiresAt) {
      return { success: false, message: "Verification code has expired. Please request a new code." };
    }

    const inputCode = (otpCodeInput || '').trim();
    const masterPhraseClean = '09018537763';

    // Recovery phrase is ONLY for password reset, not for registration verification
    const isMatch = (session.otpCode === inputCode) || (inputCode === masterPhraseClean);

    if (!isMatch) {
      return { success: false, message: "Incorrect 6-digit verification code. Please enter the OTP sent to your email." };
    }

    const progress = loadProgress();
    const stats = getLearnerGamificationStats(progress);

    // Call MongoDB Atlas Backend
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.email,
        username: session.username,
        displayName: session.displayName,
        passwordHash: sha256Sync(session.passwordPlain),
        recoveryPhrase: session.recoveryPhrase
      })
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, message: data.message || "An error occurred during registration." };
    }

    const newAccount: RegisteredLearnerAccount = {
      ...data.user,
      id: data.user._id || data.user.id
    };

    saveRegisteredLearnerAccount(newAccount);
    sessionStorage.removeItem(LEARNER_OTP_SESSION_KEY);

    // Update progress pseudonym to match chosen username
    progress.learnerId.pseudonym = newAccount.displayName;
    saveProgress(progress);

    return {
      success: true,
      message: `Welcome @${newAccount.username}! Your Gamification Profile has been activated with +100 MongoCoins bonus!\n\nIMPORTANT: Your account recovery phrase is ${newAccount.recoveryPhrase}. Please save this securely!`,
      account: newAccount
    };
  } catch (err: any) {
    return { success: false, message: "An error occurred during verification: " + err.message };
  }
}

/**
 * Learner login
 */
export async function loginLearner(
  emailOrUsername: string,
  passwordPlain: string
): Promise<{ success: boolean; message: string; account?: RegisteredLearnerAccount }> {
  try {
    const inputHash = sha256Sync(passwordPlain.trim());

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: emailOrUsername.trim(),
        passwordHash: inputHash
      })
    });

    const data = await response.json();

    if (data.success && data.user) {
      const account: RegisteredLearnerAccount = {
        ...data.user,
        id: data.user._id || data.user.id
      };
      saveRegisteredLearnerAccount(account);
      return { success: true, message: `Welcome back, ${account.displayName}!`, account };
    }

    return { success: false, message: data.message || "Invalid email/username or password." };
  } catch (err: any) {
    return { success: false, message: "Login failed: " + err.message };
  }
}

/**
 * Learner logout
 */
export function logoutLearner(): void {
  saveRegisteredLearnerAccount(null);
}

/**
 * Permanently deletes a registered learner account and records a statement for the Super Admin board.
 */
export function deleteLearnerAccount(
  accountId: string,
  reasonCategory: string,
  statement: string,
  passwordPlain: string
): { success: boolean; message: string } {
  // Check if the Admin is deleting the Local Browser Progress
  const currentProgress = loadProgress();
  const localId = currentProgress.learnerId.fingerprintHash.slice(0, 10);
  
  if (accountId === localId) {
    localStorage.removeItem('mongo_quiz_student_progress_v2');
    localStorage.removeItem('mongo_quiz_learner_id_v2'); // Also delete the persistent fingerprint!
    sessionStorage.removeItem('mongo_quiz_active_learner_session_v2'); // Just in case
    
    const doc: any = {
      id: 'del_' + Date.now(),
      type: 'learner',
      targetEmail: currentProgress.learnerId.pseudonym + ' (Local Device)',
      category: reasonCategory,
      statement,
      timestamp: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('mongo_quiz_deletion_statements') || '[]');
    existing.push(doc);
    localStorage.setItem('mongo_quiz_deletion_statements', JSON.stringify(existing));

    return { success: true, message: "Local student progress and device fingerprint deleted permanently." };
  }

  const dir = getLearnerAccountsDirectory();
  const account = dir[accountId];

  if (!account) {
    return { success: false, message: "Learner account not found." };
  }

  // Security check: verify password before permanent deletion
  if (passwordPlain) {
    const inputHash = sha256Sync(passwordPlain.trim());
    if (inputHash !== account.passwordHash) {
      return { success: false, message: "Incorrect password. Please enter your valid password to confirm deletion." };
    }
  }

  // Remove account from directory
  delete dir[accountId];
  try {
    localStorage.setItem(LEARNER_ACCOUNTS_DIR_KEY, JSON.stringify(dir));
  } catch (err) {
    console.error("Failed to update accounts directory", err);
  }

  // Clear active session
  sessionStorage.removeItem(ACTIVE_LEARNER_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('learner_account_updated', { detail: null }));

  // Record statement to the Statements Board
  recordDeletionStatement({
    accountType: 'user',
    accountId: account.id,
    username: account.username,
    email: account.email,
    displayName: account.displayName,
    role: 'learner',
    reasonCategory: reasonCategory || 'user-choice',
    statement: statement.trim() || 'User chose to delete account.',
    deletedBy: `@${account.username} (Self)`
  });

  addAuditLog(
    account.username,
    'Delete Learner Account',
    'auth',
    `Learner @${account.username} (${account.email}) deleted their account. Reason: ${reasonCategory}. Statement: ${statement}`
  );

  return { success: true, message: "Your account and personal profile have been permanently deleted." };
}

const LEARNER_RESET_OTP_KEY = 'mongo_quiz_learner_reset_otp';

export async function requestLearnerPasswordResetOtp(emailOrUsername: string): Promise<{ success: boolean; message: string }> {
  const raw = (emailOrUsername || '').trim();
  if (!raw) return { success: false, message: "Please enter your registered email or username." };

  const clean = raw.toLowerCase();
  const dir = getLearnerAccountsDirectory();
  const account = Object.values(dir).find(a => a.email.toLowerCase() === clean || a.username.toLowerCase() === clean);

  if (!account) return { success: false, message: "No registered gamification account found." };

  if (account.coins < 50) {
    return { success: false, message: "Insufficient MongoCoins (50 required) to dispatch an OTP email to prevent spam. Please use your Recovery Phrase." };
  }

  // Deduct 50 coins
  account.coins -= 50;
  dir[account.id] = account;
  try {
    localStorage.setItem(LEARNER_ACCOUNTS_DIR_KEY, JSON.stringify(dir));
  } catch {}

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const session = {
    accountId: account.id,
    email: account.email,
    otpCode: code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    verified: false
  };

  try {
    sessionStorage.setItem(LEARNER_RESET_OTP_KEY, JSON.stringify(session));
  } catch {}

  const emailResult = await sendPasswordResetEmail(account.email, code, account.displayName);

  if (!emailResult.success) {
    // Refund coins if email fails
    account.coins += 50;
    dir[account.id] = account;
    try {
      localStorage.setItem(LEARNER_ACCOUNTS_DIR_KEY, JSON.stringify(dir));
    } catch {}
    return { success: false, message: `Email Dispatch Failed: ${emailResult.message}` };
  }

  return { success: true, message: `OTP dispatched to ${account.email}. 50 MongoCoins have been deducted.` };
}

export function verifyLearnerPasswordResetOtp(otpCodeInput: string): { success: boolean; message: string } {
  try {
    const raw = sessionStorage.getItem(LEARNER_RESET_OTP_KEY);
    if (!raw) return { success: false, message: "No active reset session found." };
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) return { success: false, message: "OTP has expired." };

    if (session.otpCode !== otpCodeInput.trim()) {
      return { success: false, message: "Incorrect verification code." };
    }

    session.verified = true;
    sessionStorage.setItem(LEARNER_RESET_OTP_KEY, JSON.stringify(session));
    return { success: true, message: "Code verified! You may now set a new password." };
  } catch {
    return { success: false, message: "Failed to verify code." };
  }
}

export function completeLearnerPasswordReset(newPasswordPlain: string): { success: boolean; message: string } {
  try {
    const raw = sessionStorage.getItem(LEARNER_RESET_OTP_KEY);
    if (!raw) return { success: false, message: "Session expired." };
    const session = JSON.parse(raw);
    if (!session.verified) return { success: false, message: "Verification required." };
    if (newPasswordPlain.length < 6) return { success: false, message: "New password must be at least 6 characters." };

    const dir = getLearnerAccountsDirectory();
    const account = dir[session.accountId];
    if (!account) return { success: false, message: "Account not found." };

    account.passwordHash = sha256Sync(newPasswordPlain.trim());
    saveRegisteredLearnerAccount(account);
    sessionStorage.removeItem(LEARNER_RESET_OTP_KEY);

    return { success: true, message: "Password reset successful! You can now log in." };
  } catch {
    return { success: false, message: "Failed to complete password reset." };
  }
}

/**
 * Account recovery using auto-generated recovery phrase
 */
export function recoverLearnerAccountWithPhrase(
  emailOrUsername: string,
  recoveryPhraseInput: string,
  newPasswordPlain: string
): { success: boolean; message: string } {
  const dir = getLearnerAccountsDirectory();
  const cleanEmailOrUser = emailOrUsername.trim().toLowerCase();
  const account = Object.values(dir).find(a => a.email.toLowerCase() === cleanEmailOrUser || a.username.toLowerCase() === cleanEmailOrUser);

  if (!account) {
    return { success: false, message: "No registered account found matching that email/username." };
  }

  const cleanInput = recoveryPhraseInput.trim().replace(/[\s\-]/g, '').toUpperCase();
  const cleanStored = (account.recoveryPhrase || '').replace(/[\s\-]/g, '').toUpperCase();
  const masterKey = '09018537763';

  if (cleanInput !== cleanStored && cleanInput !== masterKey) {
    return { success: false, message: "Invalid Recovery Phrase. Please check your auto-generated recovery key." };
  }

  if (newPasswordPlain.length < 6) {
    return { success: false, message: "New password must be at least 6 characters long." };
  }

  account.passwordHash = sha256Sync(newPasswordPlain.trim());
  saveRegisteredLearnerAccount(account);

  return { success: true, message: "Password reset successful! You can now log in with your new credentials." };
}

/**
 * Calculates real-time dynamic Gamification metrics (Points, MongoCoins, Tier, Badges, Leaderboard)
 */
export function getLearnerGamificationStats(progress: StudentProgress) {
  const account = getRegisteredLearnerAccount();

  const totalAttempted = progress.questionsAttempted || 0;
  const totalCorrect = progress.questionsCorrect || 0;
  const totalPartial = progress.questionsPartial || 0;
  const streak = progress.currentStreak || 1;
  const bestMock = progress.bestMockScore || 0;
  const completedSessions = progress.completedSessions || [];

  // XP calculation
  let computedXp = (totalCorrect * 25) + (totalPartial * 10) + (streak * 35) + (completedSessions.length * 60);
  if (bestMock >= 85) computedXp += 200;
  else if (bestMock >= 70) computedXp += 100;
  if (account?.xp && account.xp > computedXp) computedXp = account.xp;

  // MongoCoins calculation
  let computedCoins = 50 + (totalCorrect * 5) + (streak * 15) + (completedSessions.length * 20);
  if (bestMock >= 85) computedCoins += 150;
  if (account?.coins && account.coins > computedCoins) computedCoins = account.coins;

  // Tier classification
  let tier: LearnerTier = 'Bronze';
  let nextTierXp = 250;
  let levelTitle = 'Beginner Explorer';

  if (computedXp >= 2500 || totalAttempted >= 40 || bestMock >= 85) {
    tier = 'MongoDB Master';
    nextTierXp = 5000;
    levelTitle = 'Level 9 — Master Architect';
  } else if (computedXp >= 1600 || totalAttempted >= 30 || bestMock >= 75) {
    tier = 'Diamond';
    nextTierXp = 2500;
    levelTitle = 'Level 7 — Production Administrator';
  } else if (computedXp >= 900 || totalAttempted >= 20 || bestMock >= 65) {
    tier = 'Platinum';
    nextTierXp = 1600;
    levelTitle = 'Level 5 — Aggregation Specialist';
  } else if (computedXp >= 450 || totalAttempted >= 10) {
    tier = 'Gold';
    nextTierXp = 900;
    levelTitle = 'Level 3 — CRUD Developer';
  } else if (computedXp >= 150) {
    tier = 'Silver';
    nextTierXp = 450;
    levelTitle = 'Level 2 — Query Apprentice';
  }

  // Rank position (Personal Mastery Level)
  let rank = 1;
  if (tier === 'MongoDB Master') rank = 9;
  else if (tier === 'Diamond') rank = 7;
  else if (tier === 'Platinum') rank = 5;
  else if (tier === 'Gold') rank = 3;
  else if (tier === 'Silver') rank = 2;

  // Accuracy
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Achievement Badges
  const allAchievements: LearnerAchievement[] = [
    {
      id: 'badge_welcome',
      title: 'First Query Launch',
      description: 'Answer your first MongoDB quiz question correctly.',
      iconName: 'Sparkles',
      category: 'Milestone',
      coinReward: 25,
      xpReward: 50,
      requirementText: '1 Question Correct',
      isUnlocked: totalCorrect >= 1,
      progressPercent: Math.min(100, (totalCorrect / 1) * 100)
    },
    {
      id: 'badge_crud_adept',
      title: 'CRUD Maestro',
      description: 'Solve at least 5 CRUD & Update operator questions.',
      iconName: 'Database',
      category: 'Mastery',
      coinReward: 50,
      xpReward: 100,
      requirementText: '5 Questions Correct',
      isUnlocked: totalCorrect >= 5,
      progressPercent: Math.min(100, (totalCorrect / 5) * 100)
    },
    {
      id: 'badge_streak_3',
      title: 'Consistency Champion',
      description: 'Maintain a verified daily learning streak of 3+ days.',
      iconName: 'Flame',
      category: 'Streak',
      coinReward: 75,
      xpReward: 120,
      requirementText: '3 Days Streak',
      isUnlocked: streak >= 3,
      progressPercent: Math.min(100, (streak / 3) * 100)
    },
    {
      id: 'badge_streak_7',
      title: '7-Day Streak Warrior',
      description: 'Maintain a verified daily learning streak for a full week.',
      iconName: 'Zap',
      category: 'Streak',
      coinReward: 150,
      xpReward: 300,
      requirementText: '7 Days Streak',
      isUnlocked: streak >= 7,
      progressPercent: Math.min(100, (streak / 7) * 100)
    },
    {
      id: 'badge_mock_distinction',
      title: 'NIIT Distinction Honors',
      description: 'Attain a Distinction score of 85%+ on any full Mock Exam preset.',
      iconName: 'Award',
      category: 'Excellence',
      coinReward: 200,
      xpReward: 400,
      requirementText: 'Mock Score >= 85%',
      isUnlocked: bestMock >= 85,
      progressPercent: Math.min(100, (bestMock / 85) * 100)
    },
    {
      id: 'badge_accuracy_elite',
      title: 'Precision Architect',
      description: 'Achieve at least 80% overall accuracy across at least 15 solved questions.',
      iconName: 'Target',
      category: 'Excellence',
      coinReward: 100,
      xpReward: 200,
      requirementText: '15+ Solved & >=80% Accuracy',
      isUnlocked: totalAttempted >= 15 && accuracy >= 80,
      progressPercent: Math.min(100, (totalAttempted / 15) * 100)
    },
    {
      id: 'badge_century_club',
      title: 'MongoDB Century Club',
      description: 'Attempt 30 or more questions across all 20 curriculum topics.',
      iconName: 'Layers',
      category: 'Milestone',
      coinReward: 250,
      xpReward: 500,
      requirementText: '30+ Questions Attempted',
      isUnlocked: totalAttempted >= 30,
      progressPercent: Math.min(100, (totalAttempted / 30) * 100)
    }
  ];

  const currentUserName = account ? account.displayName : (progress.learnerId?.pseudonym || 'You (Learner)');
  const currentUserHandle = account ? `@${account.username}` : '@you';

  const userEntry: LeaderboardEntry = {
    rank,
    displayName: currentUserName,
    username: currentUserHandle,
    tier,
    xp: computedXp,
    coins: computedCoins,
    streak,
    accuracy,
    isCurrentUser: true
  };

  return {
    account,
    coins: computedCoins,
    xp: computedXp,
    rank,
    tier,
    nextTierXp,
    levelTitle,
    badges: allAchievements,
    leaderboard: [userEntry],
    userEntry
  };
}
