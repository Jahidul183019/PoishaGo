import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore, WalletTransaction } from '../../store/useWalletStore';
import { formatBDT } from '../../utils/format';
import Card from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Calendar, 
  Filter, 
  AlertCircle, 
  CheckCircle,
  Clock
} from 'lucide-react';

export const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useWalletStore();

  const [expandedTxnId, setExpandedTxnId] = useState<number | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [curPage, setCurPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tableRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    setCurPage(page);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleRowDetail = (id: number) => {
    setExpandedTxnId(expandedTxnId === id ? null : id);
  };

  // Memoized filters computation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // 1. Search term match reference or counterpart name
      const query = searchTerm.toLowerCase();
      const matchQuery = 
        txn.reference_no.toLowerCase().includes(query) ||
        txn.receiver_name.toLowerCase().includes(query) ||
        txn.sender_name.toLowerCase().includes(query) ||
        (txn.company_name && txn.company_name.toLowerCase().includes(query));

      // 2. Type filter
      const matchType = typeFilter === 'all' || txn.txn_type === typeFilter;

      // 3. Status filter
      const matchStatus = statusFilter === 'all' || txn.status === statusFilter;

      // 4. Date filter simulation
      let matchDate = true;
      const today = new Date();
      const txnDate = new Date(txn.txn_at);
      const diffMs = today.getTime() - txnDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateFilter === 'today') {
        matchDate = diffDays <= 1;
      } else if (dateFilter === 'week') {
        matchDate = diffDays <= 7;
      } else if (dateFilter === 'month') {
        matchDate = diffDays <= 30;
      }

      return matchQuery && matchType && matchStatus && matchDate;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter, dateFilter]);

  // Pagination parameters
  const paginatedTxns = useMemo(() => {
    const startIdx = (curPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTransactions, curPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // EXPORT STATED LEDGER DOWN TO LOCAL BROWSER IN CSV FORMAT
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Sender Wallet ID', 'Sender Name', 'Receiver Wallet ID', 'Receiver Name', 'Amount (BDT)', 'Transaction Type', 'Status', 'Surcharge (Fee)', 'Ref Reference Code', 'Completed Time'];
    
    const rows = filteredTransactions.map(t => [
      t.txn_id,
      t.sender_wallet_id,
      t.sender_name,
      t.receiver_wallet_id,
      t.receiver_name,
      t.amount,
      t.txn_type,
      t.status,
      t.fee,
      t.reference_no,
      t.txn_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PoishaGo_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Page header and export triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
              Authorized Statement ledger
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review and audit all secure transaction transcripts
            </p>
          </div>
        </div>

        {/* CSV Exporter trigger */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] hover:border-cyan-400/25 text-xs font-bold text-[var(--accent-teal)] rounded-xl transition-all outline-none self-start"
          id="btn-statement-export-csv"
        >
          <Download size={14} />
          <span>Export Ledger Statement (CSV)</span>
        </button>
      </div>

      {/* SEARCH AND COMPLEX FILTERS BAR */}
      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Searching input */}
          <div className="relative md:col-span-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search Ref Code / Counterpart..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurPage(1);
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
            />
          </div>

          {/* Type trigger */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurPage(1);
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] cursor-pointer"
            >
              <option value="all">All Service Types</option>
              <option value="send_money">Peer Transfers (Send)</option>
              <option value="cash_in">Bank Cash In</option>
              <option value="cash_out">Agent Cash Out</option>
              <option value="bill_pay">Utility Bill Payments</option>
            </select>
          </div>

          {/* Status filtering */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurPage(1);
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] cursor-pointer"
            >
              <option value="all">All Status Profiles</option>
              <option value="completed">Completed Successfully</option>
              <option value="pending">Pending Settlements</option>
              <option value="failed">Incomplete / Failed</option>
            </select>
          </div>

          {/* Date Range profiling */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurPage(1);
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] cursor-pointer"
            >
              <option value="all">All Dates Range</option>
              <option value="today">Sourced Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

        </div>
      </Card>

      {/* TRANSACTIONS STATEMENT DATA TABLE */}
      <div ref={tableRef} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg select-none">
        
        {/* Mobile column sticky helper is implemented implicitly with responsive styles */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase text-[10px] tracking-widest font-mono font-bold">
                <th className="py-4 px-6">Reference ID</th>
                <th className="py-4 px-6">Counterparty</th>
                <th className="py-4 px-6">Transaction Type</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Amount BDT</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-secondary)] font-semibold">
                    No transactions find matching selection criteria.
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((txn) => {
                  const isExpanded = expandedTxnId === txn.txn_id;
                  const isDebit = txn.txn_type === 'transfer' || txn.txn_type === 'cashout' || txn.txn_type === 'bill';

                  return (
                    <React.Fragment key={txn.txn_id}>
                      <tr 
                        onClick={() => toggleRowDetail(txn.txn_id)}
                        className="hover:bg-[var(--bg-secondary)]/50 cursor-pointer transition-colors"
                        id={`txn-row-${txn.txn_id}`}
                      >
                        {/* Reference code */}
                        <td className="py-4.5 px-6 font-mono text-xs text-[var(--text-primary)] font-bold">
                          {txn.reference_no}
                        </td>
                        
                        {/* Counterpart name */}
                        <td className="py-4.5 px-6 shrink-0">
                          <h4 className="font-semibold text-xs text-[var(--text-primary)] leading-none">
                            {txn.company_name || txn.receiver_name}
                          </h4>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono leading-none">
                            {txn.receiver_wallet_id}
                          </p>
                        </td>

                        {/* Service Type */}
                        <td className="py-4.5 px-6 text-xs text-[var(--text-secondary)] uppercase tracking-wide font-bold">
                          {txn.txn_type.replace('_', ' ')}
                        </td>

                        {/* Status tag */}
                        <td className="py-4.5 px-6">
                          <StatusBadge status={txn.status} />
                        </td>

                        {/* Amount cost */}
                        <td className={`py-4.5 px-6 text-right font-sora font-extrabold text-xs ${isDebit ? 'text-rose-400' : 'text-[#00C9A7]'}`}>
                          {isDebit ? '-' : '+'}
                          {formatBDT(txn.amount)}
                        </td>

                        {/* Interactive caret dropdown */}
                        <td className="py-4.5 px-6 text-center text-[var(--text-secondary)]">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>

                      {/* COLLAPSIBLE ROW TRANSCRIPT DETAIL PANEL */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-secondary)]/40">
                          <td colSpan={6} className="py-4 px-8 border-b border-[var(--border)]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs select-none p-2 rounded-xl">
                              
                              <div className="flex flex-col gap-1.5 border-r border-[var(--border)]/50 pr-4">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Sender Credentials</span>
                                <p className="font-semibold text-[var(--text-primary)]">{txn.sender_name}</p>
                                <p className="font-mono text-[var(--text-secondary)] text-[10px]">{txn.sender_wallet_id}</p>
                              </div>

                              <div className="flex flex-col gap-1.5 border-r border-[var(--border)]/50 pr-4">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Counterparty Outlet</span>
                                <p className="font-semibold text-[var(--text-primary)]">{txn.company_name || txn.receiver_name}</p>
                                <p className="font-mono text-[var(--text-secondary)] text-[10px]">{txn.receiver_wallet_id}</p>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Transaction Signatures</span>
                                <div className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                                  <div className="flex justify-between">
                                    <span>Charged commission fee:</span>
                                    <span className="text-white">{formatBDT(txn.fee)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Settled Timestamp ID:</span>
                                    <span className="text-white font-mono">{new Date(txn.txn_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        <Pagination
          currentPage={curPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count);
            setCurPage(1);
          }}
        />

      </div>
      
    </div>
  );
};

export default TransactionHistoryPage;
