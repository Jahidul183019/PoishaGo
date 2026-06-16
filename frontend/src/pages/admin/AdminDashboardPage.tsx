import React, { useState } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Megaphone, Send, ShieldAlert } from 'lucide-react';

const AdminBroadcastPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const { broadcastNotification } = useWalletStore();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!window.confirm("Are you sure you want to send this notification to ALL registered users?")) return;
    
    setIsSending(true);
    await broadcastNotification(message);
    setMessage('');
    setIsSending(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-sora">System Broadcast</h1>
        <p className="text-sm text-[var(--text-secondary)]">Issue emergency alerts or system-wide announcements.</p>
      </div>

      <Card className="flex flex-col gap-6 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-800 dark:text-amber-200">Admin Authority</h3>
            <p className="text-xs text-amber-700/70 dark:text-amber-300/60 leading-relaxed">
              Messages sent here will appear instantly in the notification inbox of every user. Use this sparingly for maintenance updates or holiday greetings.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full h-40 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl outline-none focus:border-amber-500 transition-colors resize-none text-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={isSending || !message.trim()}
            variant="primary"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none h-12"
          >
            <Megaphone size={18} />
            <span>{isSending ? 'Dispatching...' : 'Broadcast to All Users'}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminBroadcastPage;
