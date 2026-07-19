import React, { useState, useEffect } from 'react';
import { useWalletStore, CashbackCampaign } from '../../store/useWalletStore';
import { formatBDT } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  CalendarCheck2,
  Plus,
  Trash2,
  CheckCircle,
  X,
  TrendingUp,
  Flame,
  Gift,
  Clock
} from 'lucide-react';

export const AdminOccasionsPage: React.FC = () => {
  const { campaigns, toggleCampaignStatus, createCampaign, deleteCampaign, fetchCampaigns } = useWalletStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Create Modal triggers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [occasionType, setOccasionType] = useState('other');
  const [percentageBack, setPercentageBack] = useState('15');
  const [capacityCap, setCapacityCap] = useState('500');
  const [validUntilDate, setValidUntilDate] = useState('June 30, 2026');
  const [errorText, setErrorText] = useState('');

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (title.trim().length === 0) {
      setErrorText('Title is required');
      return;
    }

    const pct = parseFloat(percentageBack);
    const maxCap = parseFloat(capacityCap);

    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setErrorText('Please enter a valid percentage rebate rate between 1% and 100%.');
      return;
    }

    if (isNaN(maxCap) || maxCap <= 0) {
      setErrorText('Specify a valid maximum reward value cap.');
      return;
    }

    // Add to store dataset
    createCampaign({
      name: title,
      type: occasionType,
      percent: pct,
      max_limit: maxCap,
      min_txn_amount: 0,
      eligible_txn_type: 'all',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
      end_date: validUntilDate
    });

    // Clean states & shut
    setTitle('');
    setOccasionType('other');
    setPercentageBack('15');
    setCapacityCap('500');
    setValidUntilDate('June 30, 2026');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 select-none">

      {/* Page Header Headers info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            Campaign Cashback rules
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure automated cashback multiplier logic for special holidays like Eid or Independence Day
          </p>
        </div>

        {/* Launch new campaigns trigger */}
        <Button
          onClick={() => {
            setErrorText('');
            setIsModalOpen(true);
          }}
          variant="primary"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-dm py-2.5 px-4 rounded-xl shadow-lg border border-amber-400/20"
          id="btn-admin-add-campaign"
        >
          <Plus size={14} />
          <span>Launch campaign event rule</span>
        </Button>
      </div>

      {/* DETAILED ACTIVE CAMPAIGNS GRID */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
          Currently Managed Campaigns Lists
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.length === 0 ? (
            <p className="p-8 text-center text-xs text-[var(--text-secondary)] md:col-span-2">
              No active campaigns configured. Click launching above!
            </p>
          ) : (
            campaigns.map((camp) => (
              <Card
                key={camp.id}
                className={`relative flex flex-col justify-between p-5.5 border transition-all ${camp.is_active
                    ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent'
                    : 'border-[var(--border)] opacity-65'
                  }`}
              >
                {/* Upper description header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${camp.is_active ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                      <Flame size={16} />
                    </div>
                    <div>
                      <h4 className="font-sora font-extrabold text-sm text-[var(--text-primary)] leading-tight">
                        {camp.name}
                      </h4>
                      <p className="text-[10px] text-amber-400 font-semibold mt-1">
                        Multiplier: {camp.percent}% Instant Bonus
                      </p>
                    </div>
                  </div>

                  {/* Delete trigger */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete campaign "${camp.name}" permanently?`)) {
                        deleteCampaign(camp.id);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-rose-400 transition-colors outline-none cursor-pointer"
                    title="Terminate campaign"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Parameters body */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-3 rounded-lg grid grid-cols-2 gap-1 text-[11px] font-semibold text-[var(--text-secondary)] my-4.5">
                  <div>
                    <span>Max cap amount:</span>
                    <strong className="block text-[var(--text-primary)] mt-0.5">{formatBDT(camp.max_limit)}</strong>
                  </div>
                  <div>
                    <span>Active until:</span>
                    <strong className="block text-[var(--text-primary)] mt-0.5">{camp.end_date}</strong>
                  </div>
                </div>

                {/* Toggle status control row */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 select-none">
                  <span className="text-[11px] text-[var(--text-secondary)]">Campaign Status:</span>

                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] uppercase font-mono font-bold ${camp.is_active ? 'text-[#00C9A7]' : 'text-slate-400'
                      }`}>
                      {camp.is_active ? 'Active' : 'Paused / Inactive'}
                    </span>

                    {/* Toggle switch visual */}
                    <button
                      onClick={() => toggleCampaignStatus(camp.id)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 outline-none ${camp.is_active ? 'bg-[#00C9A7]' : 'bg-slate-700'
                        }`}
                      id={`toggle-campaign-${camp.id}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ${camp.is_active ? 'translate-x-4.5' : 'translate-x-0'
                        }`} />
                    </button>
                  </div>
                </div>

              </Card>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL FORM OVERLAY */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch New Campaign"
      >
        <form onSubmit={handleCreateCampaignSubmit} className="flex flex-col gap-4 select-none">

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2 text-center">
            Specify automated campaign parameters. Transacting citizens meeting criteria automatically earn instantaneous bonuses!
          </p>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Occasion Campaign Title
            </label>
            <input
              type="text"
              placeholder="e.g. Eid-Ul-Adha Salami Rebate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Occasion Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Occasion Type
            </label>
            <select
              value={occasionType}
              onChange={(e) => setOccasionType(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-amber-400 appearance-none cursor-pointer"
              required
            >
              <option value="eid">Eid Holiday</option>
              <option value="puja">Puja Festival</option>
              <option value="new_year">New Year</option>
              <option value="independence">Independence Day</option>
              <option value="other">Other / Special</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Percentage rebate rate */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Bonus Rate %
              </label>
              <input
                type="number"
                placeholder="15"
                value={percentageBack}
                onChange={(e) => setPercentageBack(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Capacity Limit cap */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Max Limit per User (৳)
              </label>
              <input
                type="number"
                placeholder="500"
                value={capacityCap}
                onChange={(e) => setCapacityCap(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-amber-400"
                required
              />
            </div>

          </div>

          {/* Valid until date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Target Duration Period limit
            </label>
            <input
              type="text"
              placeholder="e.g. June 30, 2026"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-amber-400"
              required
            />
          </div>

          {errorText && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold text-center bg-rose-500/10 p-2 rounded-lg">
              {errorText}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border border-amber-400/20"
            id="btn-occasion-creation-save"
          >
            <span>Launch campaign event rebate</span>
          </Button>

        </form>
      </Modal>

    </div>
  );
};

export default AdminOccasionsPage;
