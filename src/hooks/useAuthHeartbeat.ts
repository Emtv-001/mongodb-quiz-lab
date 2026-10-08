import { useEffect } from 'react';
import { saveRegisteredLearnerAccount, getRegisteredLearnerAccount } from '../services/learnerService';
import { RegisteredLearnerAccount } from '../types';

export function useAuthHeartbeat() {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check Learner
        const learnerId = sessionStorage.getItem('mongo_quiz_active_learner_session_v2');
        if (learnerId) {
          const res = await fetch(`/api/auth/verify?id=${learnerId}&role=learner&_t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (!data.valid) {
              sessionStorage.removeItem('mongo_quiz_active_learner_session_v2');
              alert(`🚨 ACCOUNT ACCESS REVOKED 🚨\n\n${data.message}`);
              window.location.href = '/';
            } else if (data.user) {
              // Real-time synchronization of learner data from Atlas
              const currentLocalAccount = getRegisteredLearnerAccount();
              const newServerAccount: RegisteredLearnerAccount = {
                ...data.user,
                id: data.user._id || data.user.id
              };
              
              if (JSON.stringify(currentLocalAccount) !== JSON.stringify(newServerAccount)) {
                saveRegisteredLearnerAccount(newServerAccount);
              }
            }
          }
        }

        // Check Admin
        const adminSessionRaw = localStorage.getItem('mongo_quiz_logged_admin_user');
        if (adminSessionRaw) {
          const session = JSON.parse(adminSessionRaw);
          if (session.id !== 'admin_master_1') {
            const res = await fetch(`/api/auth/verify?id=${session.id}&role=admin&_t=${Date.now()}`);
            if (res.ok) {
              const data = await res.json();
              if (!data.valid) {
                localStorage.removeItem('mongo_quiz_logged_admin_user');
                alert(`🚨 ADMIN ACCESS REVOKED 🚨\n\n${data.message}`);
                window.location.href = '/';
              } else if (data.user) {
                // Real-time synchronization of admin data from Atlas
                const newServerDataObj = {
                  ...data.user,
                  id: data.user._id || data.user.id
                };
                
                // Compare objects to avoid unnecessary re-renders
                // Admin object has _id in server response, we should strictly compare the important fields
                // A simple stringify comparison usually works if properties order is stable, but let's just 
                // assign id and strip _id to be safe before comparison
                delete newServerDataObj._id;
                const localDataObj = { ...session };
                delete localDataObj._id;

                if (JSON.stringify(localDataObj) !== JSON.stringify(newServerDataObj)) {
                  localStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify(newServerDataObj));
                  // Dispatch storage event so other tabs/components update
                  window.dispatchEvent(new Event('storage'));
                }
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
