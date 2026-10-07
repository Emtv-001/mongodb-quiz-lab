const fs = require('fs');
const path = require('path');

const adminServicePath = path.join(__dirname, 'src', 'services', 'adminService.ts');
let content = fs.readFileSync(adminServicePath, 'utf8');

content = content.replace(
  /export function addAuditLog\([\s\S]*?\): void \{[\s\S]*?try \{\s*localStorage\.setItem\(AUDIT_LOGS_KEY, JSON\.stringify\(logs\)\);\s*\} catch \{\}\n\}/,
  `export async function addAuditLog(
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
}`
);

content = content.replace(
  /export async function createAdminInvitationCode\([\s\S]*?\): Promise<\{ success: boolean; message: string; invitation\?: AdminInvitation \}> \{[\s\S]*?invites\.unshift\(invitation\);\s*saveAdminInvitations\(invites\);\s*addAuditLog\([\s\S]*?\);\s*return \{[\s\S]*?invitation\s*\};\s*\}/,
  `export async function createAdminInvitationCode(
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

  const cleanPhrase = recoveryPhraseInput.trim().replace(/[\\s\\-]/g, '');
  const cleanMaster = MASTER_RECOVERY_PHRASE.replace(/[\\s\\-]/g, '');

  if (cleanPhrase !== cleanMaster) {
    return {
      success: false,
      message: "Security Authorization Failed: Invalid master recovery phrase. Enter the master recovery phrase (09018537763) to authorize role dispatch."
    };
  }

  const codeNumber = Math.floor(10000 + Math.random() * 90000);
  const inviteCode = \`INV-\${codeNumber}\`;
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
    \`Generated \${role} invitation code (Code: \${inviteCode})\`
  );

  return {
    success: true,
    message: \`Invitation code successfully generated!\`,
    invitation
  };
}`
);

content = content.replace(
  /export function acceptAdminInvitation\([\s\S]*?assignedRole\?: string \} \{[\s\S]*?return \{[\s\S]*?assignedRole: newUser\.role\s*\};\s*\}/,
  `export async function acceptAdminInvitation(
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
    await fetch(\`/api/admin/invites?id=\${invite.id}\`, { method: 'DELETE' });
  } catch (e) {}

  addAuditLog(
    newUser.username,
    'Accept Admin Invitation',
    'security',
    \`Completed registration via invitation \${cleanCode} with assigned role \${invite.role}\`
  );

  return {
    success: true,
    message: \`Welcome @\${newUser.username}! Your administrator account is now active.\`,
    user: newUser,
    recoveryPhrase: newUser.recoveryPhrase,
    assignedRole: newUser.role
  };
}`
);

content = content.replace(
  /export function cancelAdminInvitation\([\s\S]*?\): \{ success: boolean; message: string \} \{[\s\S]*?return \{ success: true, message: "Invitation cancelled\." \};\s*\}/,
  `export async function cancelAdminInvitation(id: string, executorUsername: string = 'admin'): Promise<{ success: boolean; message: string }> {
  const authError = authorize(executorUsername, 'canManageSubAdmins');
  if (authError) return { success: false, message: authError };

  try {
    const res = await fetch(\`/api/admin/invites?id=\${id}\`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  addAuditLog(executorUsername, 'Cancel Admin Invite', 'security', \`Revoked invitation \${id}\`);
  return { success: true, message: "Invitation cancelled." };
}`
);

content = content.replace(
  /export function updateSubAdmin\([\s\S]*?\): \{ success: boolean; message: string \} \{[\s\S]*?return \{ success: true, message: "Administrator details updated successfully\." \};\s*\}/,
  `export async function updateSubAdmin(
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

  addAuditLog(executorUsername, 'Update Administrator', 'security', \`Updated account/permissions for admin ID: \${id}\`);

  return { success: true, message: "Administrator details updated successfully." };
}`
);

content = content.replace(
  /export function deleteSubAdmin\([\s\S]*?\): \{ success: boolean; message: string \} \{[\s\S]*?return \{ success: true, message: `Administrator account @\$\{target\.username\} has been deleted\.` \};\s*\}/,
  `export async function deleteSubAdmin(
  id: string,
  executorUsername: string = 'admin',
  reasonCategory: string = 'administrative-removal',
  statement: string = 'Administrator account removed.'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(\`/api/admin/admins?id=\${id}\`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return { success: false, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }

  addAuditLog(
    executorUsername,
    'Delete Administrator',
    'security',
    \`Deleted admin ID: \${id}. Reason: \${reasonCategory}. Statement: \${statement}\`
  );

  return { success: true, message: \`Administrator account has been deleted.\` };
}`
);

fs.writeFileSync(adminServicePath, content);
console.log('adminService refactored!');

const rbacPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminManagementRBAC.tsx');
let rbacContent = fs.readFileSync(rbacPath, 'utf8');

rbacContent = rbacContent.replace(
  /const handleAcceptInvite = \(e: React\.FormEvent\) => \{/,
  'const handleAcceptInvite = async (e: React.FormEvent) => {'
);
rbacContent = rbacContent.replace(
  /const res = acceptAdminInvitation\(/,
  'const res = await acceptAdminInvitation('
);

rbacContent = rbacContent.replace(
  /const handleCancelInvite = \(id: string\) => \{/,
  'const handleCancelInvite = async (id: string) => {'
);
rbacContent = rbacContent.replace(
  /const res = cancelAdminInvitation\(/,
  'const res = await cancelAdminInvitation('
);

rbacContent = rbacContent.replace(
  /const handleTogglePermission = \(adminId: string, permKey: keyof AdminPermissions\) => \{/,
  'const handleTogglePermission = async (adminId: string, permKey: keyof AdminPermissions) => {'
);
rbacContent = rbacContent.replace(
  /const res = updateSubAdmin\(/,
  'const res = await updateSubAdmin('
);

rbacContent = rbacContent.replace(
  /const handleToggleStatus = \(adminId: string\) => \{/,
  'const handleToggleStatus = async (adminId: string) => {'
);
rbacContent = rbacContent.replace(
  /const res = updateSubAdmin\(/g,
  'const res = await updateSubAdmin('
);

rbacContent = rbacContent.replace(
  /const handleChangeRole = \(adminId: string, newRole: AdminRole\) => \{/,
  'const handleChangeRole = async (adminId: string, newRole: AdminRole) => {'
);
// res = updateSubAdmin is handled by the global replacement above.

rbacContent = rbacContent.replace(
  /const handleConfirmAdminDelete = \(e: React\.FormEvent\) => \{/,
  'const handleConfirmAdminDelete = async (e: React.FormEvent) => {'
);
rbacContent = rbacContent.replace(
  /const res = deleteSubAdmin\(/,
  'const res = await deleteSubAdmin('
);

fs.writeFileSync(rbacPath, rbacContent);
console.log('AdminManagementRBAC refactored!');

const secPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminSecuritySettings.tsx');
let secContent = fs.readFileSync(secPath, 'utf8');

secContent = secContent.replace(
  /const logs = getAuditLogs\(\);/,
  `const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(console.error);
  }, []);`
);

fs.writeFileSync(secPath, secContent);
console.log('AdminSecuritySettings refactored!');
