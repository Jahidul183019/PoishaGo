import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore, AppNotification } from '../../store/useWalletStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  ArrowLeft, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  MessageSquare, 
  X, 
  ShieldAlert, 
  Info,
  DollarSign
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useWalletStore();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    if (confirm('Flush entire inbox statements history?')) {
      clearAllNotifications();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">
      
      {/* Header and Bulk Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
              Notifications Inbox
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Secure receipts and compliance warnings bulletins
            </p>
          </div>
        </div>

        {/* Action icons row */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00C9A7] hover:underline outline-none"
              id="btn-inbox-mark-all-read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
            <div className="w-px h-3.5 bg-[var(--border)]" />
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:underline outline-none animate-[pulse_2s_infinite]"
              id="btn-inbox-clear-all"
            >
              <Trash2 size={13} />
              <span>Flush inbox</span>
            </button>
          </div>
        )}
      </div>

      {/* DETAILED NOTIFICATIONS BOX CARDS */}
      <div className="flex flex-col gap-4 select-none">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[var(--text-secondary)]">
              <Bell size={18} className="text-slate-400" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
              Your communications index is empty.
            </p>
          </div>
        ) : (
          notifications.map((msg) => (
            <div
              key={msg.id}
              className={`relative bg-[var(--bg-card)] border rounded-2xl p-4.5 transition-all duration-200 flex flex-col gap-3 group shadow ${
                msg.is_read 
                  ? 'border-[var(--border)] opacity-65 hover:opacity-100' 
                  : msg.notif_type === 'sms'
                    ? 'border-rose-500/30 shadow-md bg-gradient-to-r from-rose-500/5 to-transparent'
                    : msg.notif_type === 'email'
                      ? 'border-emerald-500/30 shadow-md bg-gradient-to-r from-emerald-500/5 to-transparent'
                      : 'border-blue-500/30 shadow-md bg-gradient-to-r from-blue-500/5 to-transparent'
              }`}
            >
              {/* Header icons + clear */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border shrink-0 ${
                    msg.notif_type === 'sms' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/15' 
                      : msg.notif_type === 'email'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/15'
                  }`}>
                    {msg.notif_type === 'sms' && <ShieldAlert size={14} />}
                    {msg.notif_type === 'email' && <DollarSign size={14} />}
                    {msg.notif_type !== 'sms' && msg.notif_type !== 'email' && <Info size={14} />}
                  </div>
                  <h4 className="font-sora font-extrabold text-xs text-[var(--text-primary)]">
                    System Alert
                  </h4>
                </div>

                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {!msg.is_read && (
                    <button
                      onClick={() => markAsRead(msg.id)}
                      className={`text-[10px] font-mono tracking-wide py-0.5 px-2 border rounded font-bold transition-all outline-none ${
                        msg.notif_type === 'sms'
                          ? 'bg-rose-500/20 border-rose-500/10 text-rose-500 hover:bg-rose-500/30'
                          : msg.notif_type === 'email'
                            ? 'bg-emerald-500/20 border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/30'
                            : 'bg-blue-500/20 border-blue-500/10 text-blue-500 hover:bg-blue-500/30'
                      }`}
                    >
                      New
                    </button>
                  )}
                  <button
                    onClick={() => clearNotification(msg.id)}
                    className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-rose-400 transition-all outline-none"
                    title="Dismiss alert"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Message Content descriptions */}
              <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed pl-9.5 pr-4">
                {msg.message}
              </p>

              {/* Footers timestamps */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] pl-9.5">
                <Clock size={10} />
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="mx-1">•</span>
                <span>{new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
