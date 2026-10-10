import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

interface AppNotification {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'learners' | 'admins';
  type: 'info' | 'warning' | 'success' | 'urgent';
  showPopup: boolean;
  createdAt: string;
}

export const GlobalNotificationPopup: React.FC<{ audience: 'learners' | 'admins', userCreatedAt?: string }> = ({ audience, userCreatedAt }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?audience=${audience}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!data.success || !Array.isArray(data.notifications)) return;
        
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        
        const unseen = data.notifications.filter((n: AppNotification) => {
          if (!n.showPopup) return false;
          if (dismissed.includes(n._id)) return false;
          
          if (userCreatedAt) {
            const userDate = new Date(userCreatedAt).getTime() - 60000; // 1 minute slack
            const notifDate = new Date(n.createdAt).getTime();
            if (notifDate < userDate) return false;
          }
          
          return true;
        });
        setNotifications(unseen);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, [audience]);

  if (notifications.length === 0 || currentIndex >= notifications.length) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  const handleDismiss = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    dismissed.push(currentNotification._id);
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
    
    setCurrentIndex(prev => prev + 1);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'urgent': return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'urgent': return <Bell className="w-5 h-5 text-red-500" />;
      case 'info':
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-lg rounded-lg border p-4 flex flex-col gap-2 transition-all duration-300 transform translate-y-0 opacity-100 bg-white">
      <div className={`p-4 rounded-md border ${getTypeStyles(currentNotification.type)}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 font-semibold">
            {getTypeIcon(currentNotification.type)}
            <span>{currentNotification.title}</span>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm opacity-90">{currentNotification.message}</p>
        <div className="mt-3 flex justify-end">
          <button 
            onClick={handleDismiss}
            className="text-xs font-medium bg-white/50 hover:bg-white/80 px-3 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
