const fs = require('fs');

let file = fs.readFileSync('src/components/learner/LearnerGamificationView.tsx', 'utf8');

// Add activeLoadingTask state
if (!file.includes('activeLoadingTask')) {
  file = file.replace(
    /const \[stats, setStats\] = useState\(\(\) => getLearnerGamificationStats\(progress\)\);/,
    "const [stats, setStats] = useState(() => getLearnerGamificationStats(progress));\n  const [activeLoadingTask, setActiveLoadingTask] = useState<string | null>(null);"
  );
  
  // Wrap handleLoginSubmit
  file = file.replace(
    /setIsAuthenticating\(true\);\s*const res = await loginLearner\(loginIdentifier, loginPassword\);\s*setIsAuthenticating\(false\);/g,
    "setActiveLoadingTask('Verifying credentials...');\n    setIsAuthenticating(true);\n    const res = await loginLearner(loginIdentifier, loginPassword);\n    setIsAuthenticating(false);\n    setActiveLoadingTask(null);"
  );
  
  // Wrap Reg OTP Request
  file = file.replace(
    /setIsSendingEmail\(true\);\s*const res = await requestLearnerRegistrationOtp\(regEmail\);\s*setIsSendingEmail\(false\);/g,
    "setActiveLoadingTask('Transmitting verification code...');\n    setIsSendingEmail(true);\n    const res = await requestLearnerRegistrationOtp(regEmail);\n    setIsSendingEmail(false);\n    setActiveLoadingTask(null);"
  );
  
  // Wrap Reg OTP Verify
  file = file.replace(
    /setIsSendingEmail\(true\);\s*const res = await verifyLearnerRegistrationOtp\(otpCodeInput\);\s*setIsSendingEmail\(false\);/g,
    "setActiveLoadingTask('Provisioning learner account...');\n    setIsSendingEmail(true);\n    const res = await verifyLearnerRegistrationOtp(otpCodeInput);\n    setIsSendingEmail(false);\n    setActiveLoadingTask(null);"
  );
  
  // Wrap Delete Account
  file = file.replace(
    /setIsDeletingAccount\(true\);\s*const res = await deleteLearnerAccount\(account\.id, deletePassword, deleteReasonCategory, deleteStatement\);\s*setIsDeletingAccount\(false\);/g,
    "setActiveLoadingTask('Decommissioning account data...');\n    setIsDeletingAccount(true);\n    const res = await deleteLearnerAccount(account.id, deletePassword, deleteReasonCategory, deleteStatement);\n    setIsDeletingAccount(false);\n    setActiveLoadingTask(null);"
  );
  
  // Wrap Request Reset OTP
  file = file.replace(
    /setIsSendingRecoverOtp\(true\);\s*const res = await requestLearnerPasswordResetOtp\(recoverIdentifier\);\s*if \(res\.success\)/g,
    "setActiveLoadingTask('Locating account records...');\n    setIsSendingRecoverOtp(true);\n    const res = await requestLearnerPasswordResetOtp(recoverIdentifier);\n    if (res.success) {\n      setActiveLoadingTask(null);\n"
  );
  file = file.replace(
    /\} else \{\s*setRecoverMsg\(\{ text: res\.message, isError: true \}\);\s*\}/g,
    "} else {\n        setActiveLoadingTask(null);\n        setRecoverMsg({ text: res.message, isError: true });\n      }"
  );
  
  // Wrap Complete Reset
  file = file.replace(
    /const cRes = await completeLearnerPasswordReset\(recoverNewPassword\);/g,
    "setActiveLoadingTask('Resetting cryptographic keys...');\n        const cRes = await completeLearnerPasswordReset(recoverNewPassword);\n        setActiveLoadingTask(null);"
  );
  
  // Render EMTVLoader
  file = file.replace(
    /return \(\s*<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">/g,
    "return (\n    <div className=\"min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4\">\n      {activeLoadingTask && <EMTVLoader message={activeLoadingTask} />}"
  );
  
  fs.writeFileSync('src/components/learner/LearnerGamificationView.tsx', file);
}
