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
  phone?: string;
  email?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  passwordHash: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastActive?: string;
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
  phone?: string;
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

export interface PhoneResetSession {
  phone: string;
  otpCode: string;
  expiresAt: number;
  verified: boolean;
  adminId: string;
}
