import { useEffect } from 'react';

export function useAuthHeartbeat() {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check Learner
        const learnerSessionRaw = sessionStorage.getItem('mongo_quiz_active_learner_session_v2');
        if (learnerSessionRaw) {
          const session = JSON.parse(learnerSessionRaw);
          const res = await fetch(`/api/auth/verify?id=${session.id}&role=learner`);
          if (res.ok) {
            const data = await res.json();
            if (!data.valid) {
              sessionStorage.removeItem('mongo_quiz_active_learner_session_v2');
              alert(`🚨 ACCOUNT ACCESS REVOKED 🚨\n\n${data.message}`);
              window.location.href = '/';
            }
          }
        }

        // Check Admin
        const adminSessionRaw = localStorage.getItem('mongo_quiz_logged_admin_user');
        if (adminSessionRaw) {
          const session = JSON.parse(adminSessionRaw);
          if (session.id !== 'admin_master_1') {
            const res = await fetch(`/api/auth/verify?id=${session.id}&role=admin`);
            if (res.ok) {
              const data = await res.json();
              if (!data.valid) {
                localStorage.removeItem('mongo_quiz_logged_admin_user');
                alert(`🚨 ADMIN ACCESS REVOKED 🚨\n\n${data.message}`);
                window.location.href = '/';
              }
            }
          }
        }
      } catch (err) {
        // silently ignore network errors
      }
    };

    // Run immediately on mount
    checkAuthStatus();

    // Poll every 10 seconds
    const intervalId = setInterval(checkAuthStatus, 10000);

    return () => clearInterval(intervalId);
  }, []);
}
