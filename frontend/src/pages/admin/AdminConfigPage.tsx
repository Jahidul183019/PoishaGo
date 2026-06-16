import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import { useAuthStore } from '../../store/useAuthStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Settings, Plus, Tag, Gift, Trash2, Megaphone, Send } from 'lucide-react';
import * as Icons from 'lucide-react';
import { formatBDT } from '../../utils/format';

export const AdminConfigPage: React.FC = () => {
  const { rewardOptions, fetchRewardOptions, addRewardOption, deleteRewardOption, broadcastNotification } = useWalletStore();
  const { admin } = useAuthStore();

  useEffect(() => {
    fetchRewardOptions();
  }, [fetchRewardOptions]);

  // Form states for Reward Option
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [pointsReq, setPointsReq] = useState('');
  const [valueBdt, setValueBdt] = useState('');
  const [rewardCat, setRewardCat] = useState('cashback');

  // Broadcast states
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleAddReward = async () => {
    if(!rewardTitle || !pointsReq || !valueBdt) return;
    await addRewardOption({
      title: rewardTitle,
      points_required: parseInt(pointsReq),
      value_bdt: parseFloat(valueBdt),
      category: rewardCat as "cashback" | "voucher" | "offer"
    });
    setIsRewardModalOpen(false);
    setRewardTitle('');
    setPointsReq('');
    setValueBdt('');
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    if (!window.confirm("Are you sure you want to send this notification to ALL registered users?")) return;
    
    setIsBroadcasting(true);
    await broadcastNotification(broadcastMessage);
    setBroadcastMessage('');
    setIsBroadcasting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-500" />
            Configurations
          </h1>
          <p className="text-[var(--text-secondary)]">Manage dynamic system configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reward Options Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-400" />
              Reward Options
            </h2>
            <Button className="py-1.5 px-3 text-xs" onClick={() => setIsRewardModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Reward
            </Button>
          </div>

          <div className="space-y-3">
            {rewardOptions.map((opt) => (
              <div key={opt.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex justify-between items-center">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{opt.title}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{opt.points_required} pts • {formatBDT(opt.value_bdt)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full border border-indigo-500/20 capitalize">
                    {opt.category}
                  </div>
                  <button onClick={() => deleteRewardOption(opt.id)} className="text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
      
      {/* System Broadcast Section - Only for SUPPORT & SUPER_ADMIN */}
      {(admin?.role === 'SUPER_ADMIN' || admin?.role === 'SUPPORT') && (
        <Card className="p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">System-wide Broadcast</h2>
          </div>
          <div className="space-y-4">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Announce maintenance, holidays, or alerts to all citizens..."
              className="w-full h-32 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl outline-none focus:border-amber-500 transition-colors resize-none text-sm text-[var(--text-primary)]"
            />
            <Button onClick={handleBroadcast} disabled={isBroadcasting || !broadcastMessage.trim()} className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none h-12">
              <Send size={16} className="mr-2" />
              <span>{isBroadcasting ? 'Dispatching...' : 'Broadcast to All Users'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Reward Modal */}
      <Modal 
        isOpen={isRewardModalOpen} 
        onClose={() => setIsRewardModalOpen(false)}
        title="Add Reward Option"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title</label>
            <input 
              type="text" 
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
              placeholder="e.g. ৳200 Daraz Voucher"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Points Required</label>
            <input 
              type="number" 
              value={pointsReq}
              onChange={(e) => setPointsReq(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Value (BDT)</label>
            <input 
              type="number" 
              value={valueBdt}
              onChange={(e) => setValueBdt(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
              placeholder="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Category</label>
            <select
              value={rewardCat}
              onChange={(e) => setRewardCat(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
            >
              <option value="cashback">Cashback</option>
              <option value="voucher">Voucher</option>
            </select>
          </div>
          <Button className="w-full mt-4" onClick={handleAddReward}>Save Reward</Button>
        </div>
      </Modal>

    </div>
  );
};
