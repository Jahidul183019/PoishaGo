import React, { useState, useMemo, useEffect } from 'react';
import { useWalletStore, UserAccount } from '../../store/useWalletStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBDT } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToastStore } from '../../hooks/useToast';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Settings2,
  ClipboardList
} from 'lucide-react';

export const AdminUserTxnMgmtPage: React.FC = () => {
  const {
    users,
    toggleCitizenStatus,
    fetchUsers
  } = useWalletStore();
  const { admin } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const checkAccess = (permission: string) => {
    if (admin?.role === 'SUPER_ADMIN') return true;
    if (admin?.permissions.includes(permission)) return true;

    const roleName = admin?.role.replace('_', ' ').toLowerCase();
    useToastStore.getState().showToast(`ACCESS DENIED: Your ${roleName} clearance level does not permit this operational procedure.`, 'error');
    return false;
  };

  const { user: currentLoggedUser, updateUserBalance } = useAuthStore();

  // Citizen Selection / Search
  const [searchCitizenStr, setSearchCitizenStr] = useState('');

 

  // Memo filters
  const filteredCitizens = useMemo(() => {
    return users.filter(cit => {
      const q = searchCitizenStr.toLowerCase();
      return (
        cit.full_name.toLowerCase().includes(q) ||
        cit.phone.includes(q) ||
        cit.wallet_number.toLowerCase().includes(q)
      );
    });
  }, [users, searchCitizenStr]);

 

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 select-none">

      {/* Heading */}
      <div>
        <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
          Citizens & Accounts Ledger
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Execute account parameter overrides, block secure login channels, or run auditor balance adjustments
        </p>
      </div>

      {/* FILTER SEARCH CRITERIA */}
      <Card className="flex flex-col gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Query citizen registries by full name, phone profile or wallet IDs..."
            value={searchCitizenStr}
            onChange={(e) => setSearchCitizenStr(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </Card>

      {/* REGISTRY ACCOUNTS TABLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase text-[10px] tracking-widest font-mono font-bold">
                <th className="py-4 px-6">Citizen Credentials</th>
                <th className="py-4 px-6">Wallet ID / Phone</th>
                <th className="py-4 px-6">Account Balance</th>
                <th className="py-4 px-6">Security status</th>
                <th className="py-4 px-6 text-center">Auditor controls</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] text-xs font-semibold">
              {filteredCitizens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[var(--text-secondary)] font-semibold">
                    No matching citizen registries found in sandbox database.
                  </td>
                </tr>
              ) : (
                filteredCitizens.map((citizen) => (
                  <tr key={citizen.wallet_number} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">

                    {/* Name */}
                    <td className="py-4 px-6">
                      <h4 className="font-bold text-[var(--text-primary)]">{citizen.full_name}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 capitalize">Role: {citizen.user_type}</p>
                    </td>

                    {/* Phone details */}
                    <td className="py-4 px-6 font-mono text-slate-300">
                      <div>{citizen.wallet_number}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{citizen.phone}</div>
                    </td>

                    {/* Cash balance */}
                    <td className="py-4 px-6 font-sora font-extrabold text-[#00C9A7]">
                      {formatBDT(citizen.balance)}
                    </td>

                    {/* Status badge and blockers link */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-lg text-[9px] uppercase font-mono border font-bold ${citizen.status === 'active'
                          ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/15 text-rose-400'
                        }`}>
                        {citizen.status === 'active' ? '✓ Safe' : '🚫 Blocked'}
                      </span>
                    </td>

                    {/* Interactive auditing tools */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-3.5">

 

                        {/* Status Toggle Blockers */}
                        <button
                          onClick={() => {
                            if (!checkAccess('TOGGLE_USER_STATUS')) return;
                            toggleCitizenStatus(citizen.user_id, citizen.status);
                          }}
                          className={`flex items-center gap-1 py-1.5 px-3 rounded-lg font-bold border transition-all outline-none cursor-pointer ${citizen.status === 'active'
                              ? 'bg-rose-500/10 border-rose-500/15 hover:bg-rose-500/25 text-rose-400'
                              : 'bg-emerald-500/10 border-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
                            }`}
                        >
                          {citizen.status === 'active' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                          <span>{citizen.status === 'active' ? 'Block account' : 'Restore'}</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

 

    </div>
  );
};

export default AdminUserTxnMgmtPage;
