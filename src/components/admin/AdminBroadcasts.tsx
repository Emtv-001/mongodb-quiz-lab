import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Send, Plus, RefreshCw, Mail, Bell } from 'lucide-react';
import { sendRealtimeEmail } from '../../services/emailService';

interface Notification {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'learners' | 'admins';
  type: 'info' | 'warning' | 'success' | 'urgent';
  showPopup: boolean;
  sendEmail: boolean;
  createdAt: string;
}

export const AdminBroadcasts: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'learners' | 'admins'>('all');
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'urgent'>('info');
  const [showPopup, setShowPopup] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications'); // Without audience query, returns all non-expired
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this broadcast?')) return;
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, message, audience, type, showPopup, sendEmail, createdBy: 'Admin'
        })
      });

      if (sendEmail) {
        const emails: string[] = [];
        if (audience === 'all' || audience === 'learners') {
          const lRes = await fetch('/api/admin/users');
          const lData = await lRes.json();
          if (lData.success && Array.isArray(lData.users)) {
            emails.push(...lData.users.map((u: any) => u.email).filter(Boolean));
          }
        }
        if (audience === 'all' || audience === 'admins') {
          const aRes = await fetch('/api/admin/admins');
          const aData = await aRes.json();
          if (aData.success && Array.isArray(aData.admins)) {
            emails.push(...aData.admins.map((u: any) => u.email).filter(Boolean));
          }
        }

        const uniqueEmails = Array.from(new Set(emails));
        
        await Promise.all(uniqueEmails.map(email => 
          sendRealtimeEmail({
            to: email,
            subject: title,
            text: message,
            html: `<p>${message}</p>`,
            category: 'test'
          })
        ));
      }

      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-emerald-400" />
          Create New Broadcast
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Title</label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white"
                placeholder="Broadcast Title"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Message</label>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white min-h-[100px]"
              placeholder="Your broadcast message here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Audience</label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Users</option>
                <option value="learners">Learners Only</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPopup}
                  onChange={e => setShowPopup(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500"
                />
                <span className="text-sm text-slate-300 flex items-center gap-1">
                  <Bell className="w-4 h-4" /> Show Popup
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500"
                />
                <span className="text-sm text-slate-300 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Send Email Alert
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Broadcast
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Active Broadcasts</h2>
          <button onClick={fetchNotifications} className="text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No active broadcasts.</div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className="p-6 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      n.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      n.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      n.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {n.type.toUpperCase()}
                    </span>
                    <h3 className="font-semibold text-white">{n.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">{n.message}</p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>Audience: {n.audience}</span>
                    <span>Popup: {n.showPopup ? 'Yes' : 'No'}</span>
                    <span>Email: {n.sendEmail ? 'Yes' : 'No'}</span>
                    <span>Date: {new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(n._id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
