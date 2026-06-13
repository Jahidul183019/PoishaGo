import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_BASE_URL } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  Headphones, Send, MessageCircle, ArrowLeft, User, CheckCircle,
  Clock, AlertCircle, Filter,
} from 'lucide-react';

interface Ticket {
  ticket_id: number;
  user_id: number;
  user_name: string | null;
  subject: string;
  status: string;
  created_at: string;
  last_message: string | null;
}

interface ChatMessage {
  message_id: number;
  sender_type: string;
  sender_id: number;
  sender_name: string | null;
  message: string;
  sent_at: string;
}

export const AdminSupportPage: React.FC = () => {
  const { admin } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<Ticket[]>(`/api/admin/support/tickets?status=${statusFilter}`);
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Open ticket
  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setLoading(true);

    try {
      const msgs = await api.get<ChatMessage[]>(`/api/admin/support/tickets/${ticket.ticket_id}/messages`);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }

    // Connect WebSocket
    const token = localStorage.getItem('token');
    if (!token) return;
    wsRef.current?.close();

    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`${wsProtocol}://${wsHost}/api/ws/support/${ticket.ticket_id}?token=${token}`);

    ws.onmessage = (event) => {
      const msg: ChatMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    ws.onerror = () => console.error('WebSocket error');
    wsRef.current = ws;
  };

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const handleSend = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: newMessage }));
    setNewMessage('');
  };

  const handleResolve = async () => {
    if (!activeTicket) return;
    if (!window.confirm('Mark this ticket as resolved?')) return;
    try {
      await api.patch(`/api/admin/support/tickets/${activeTicket.ticket_id}/resolve`, {});
      setActiveTicket({ ...activeTicket, status: 'RESOLVED' });
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    }
  };

  const handleBack = () => {
    wsRef.current?.close();
    setActiveTicket(null);
    setMessages([]);
    fetchTickets();
  };

  // ── Chat View ──────────────────────────────────────────────────────────────
  if (activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-48px)]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <button onClick={handleBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors outline-none">
            <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-sora font-bold text-lg text-[var(--text-primary)] truncate">
              {activeTicket.subject}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <User size={12} /> {activeTicket.user_name || `User #${activeTicket.user_id}`}
              </span>
              <span className={`font-mono px-2 py-0.5 rounded-full ${
                activeTicket.status === 'OPEN'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {activeTicket.status}
              </span>
            </div>
          </div>
          {activeTicket.status === 'OPEN' && (
            <Button
              className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 border-none"
              onClick={handleResolve}
            >
              <CheckCircle size={14} className="mr-1" /> Resolve
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 scroll-smooth">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages in this ticket yet.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.sender_type === 'ADMIN';
              return (
                <div key={msg.message_id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isAdmin
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-md'
                      : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
                  }`}>
                    {!isAdmin && (
                      <div className="text-[10px] font-bold text-blue-400 mb-1 flex items-center gap-1">
                        <User size={10} /> {msg.sender_name || 'Citizen'}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="text-[10px] font-bold text-white/80 mb-1">You (Admin)</div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        {activeTicket.status === 'OPEN' && (
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Reply to the user..."
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500 transition-colors"
              />
              <button
                onClick={handleSend}
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform outline-none shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Ticket List View ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-amber-400" />
            Support Tickets
          </h1>
          <p className="text-[var(--text-secondary)]">Manage user complaints and inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--text-secondary)]" />
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all outline-none ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all outline-none ${
              statusFilter === 'RESOLVED'
                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-30" />
            <p className="text-[var(--text-secondary)]">
              {statusFilter === 'OPEN' ? 'No open tickets. All clear!' : 'No resolved tickets found.'}
            </p>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.ticket_id}
              className="p-4 cursor-pointer hover:border-amber-500/30 transition-all group"
              onClick={() => openTicket(ticket)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      ticket.status === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-amber-400 transition-colors">
                      {ticket.subject}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <User size={10} /> {ticket.user_name || `User #${ticket.user_id}`}
                    </span>
                    {ticket.last_message && (
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        "{ticket.last_message}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    ticket.status === 'OPEN'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSupportPage;
