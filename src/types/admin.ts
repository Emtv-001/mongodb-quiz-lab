export type AdminRole = 'super-admin' | 'sub-admin' | 'examiner' | 'moderator';

export interface AdminPermissions {
  canEditBranding: boolean;
  canManageTabs: boolean;
  canManageDatabases: boolean;
  canManageQuestions: boolean;
  canViewLearnerData: boolean;
  canExportData: boolean;
  canManageSubAdmins: boolean;
  canResetSystem: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  recoveryPhrase?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  passwordHash: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastActive?: string;
  createdBy: string;
  permsSynced?: boolean;
}

export interface AdminInvitation {
  id: string;
  email?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  invitationCode: string; // e.g. "INV-98214"
  recoveryPhrase: string; // Auto-generated unique recovery phrase for the invitee (e.g. "REC-8291-4029-7104")
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: number;
  createdAt: string;
  createdBy: string;
}

export type DatabaseEngineType = 'mongodb' | 'postgresql' | 'mysql' | 'dynamodb' | 'sqlite' | 'json';

export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
}

export interface GenericDatabaseCollection {
  id: string;
  databaseType: DatabaseEngineType;
  name: string;
  label: string;
  description: string;
  schemaFields: SchemaField[];
  documents: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SiteCustomization {
  siteName: string;
  siteSubtitle: string;
  brandName: string;
  logoType: 'icon' | 'custom-url' | 'emoji';
  logoValue: string;
  accentColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan';
  enabledTabs: Record<string, boolean>;
  customTabLabels: Record<string, string>;
  footerText: string;
}

export interface AdminAuditLog {
  id: string;
  adminUsername: string;
  action: string;
  category: 'auth' | 'branding' | 'database' | 'questions' | 'security' | 'export';
  details: string;
  timestamp: string;
}

export interface LearnerProfile {
  id: string;
  pseudonym: string;
  fingerprintHash: string;
  firstJoined: string;
  lastActive: string;
  currentStreak: number;
  longestStreak: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  bestMockScore: number;
  weakTopics: string[];
  masteredTopics: string[];
  status: 'active' | 'inactive';
}

export interface EmailResetSession {
  emailOrPhone: string;
  otpCode: string;
  expiresAt: number;
  verified: boolean;
  adminId: string;
  requestedAt?: number;
}

export type EmailProviderType = 'formspree' | 'emailjs' | 'resend' | 'brevo' | 'custom-webhook' | 'auto';

export interface EmailServiceConfig {
  provider: EmailProviderType;
  formspreeEndpoint?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  resendApiKey?: string;
  brevoApiKey?: string;
  customWebhookUrl?: string;
  senderName: string;
  senderEmail: string;
  lastTestStatus?: {
    success: boolean;
    timestamp: string;
    message: string;
  };
}

export interface DeletionStatement {
  id: string;
  accountType: 'user' | 'admin';
  accountId: string;
  username: string;
  email: string;
  displayName: string;
  role?: string;
  reasonCategory: string;
  statement: string;
  deletedAt: string;
  deletedBy: string;
}
