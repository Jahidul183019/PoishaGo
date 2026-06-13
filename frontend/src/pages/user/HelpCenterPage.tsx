import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_BASE_URL } from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  HelpCircle, Plus, Send, MessageCircle, ArrowLeft, CheckCircle2, Clock,
} from 'lucide-react';

interface Ticket {
  ticket_id: number;
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

export const HelpCenterPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<Ticket[]>('/api/support/tickets');
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Open ticket chat
  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setLoading(true);

    try {
      const msgs = await api.get<ChatMessage[]>(`/api/support/tickets/${ticket.ticket_id}/messages`);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }

    // Connect WebSocket
    const token = localStorage.getItem('token');
    if (!token) return;

    // Close existing ws
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

  // Cleanup ws on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Send message
  const handleSend = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ message: newMessage }));
    setNewMessage('');
  };

  // Create ticket
  const handleCreateTicket = async () => {
    if (!newSubject.trim()) return;
    try {
      const ticket = await api.post<Ticket>('/api/support/tickets', { subject: newSubject });
      setNewSubject('');
      setShowNewForm(false);
      await fetchTickets();
      openTicket(ticket);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  // Back to list
  const handleBack = () => {
    wsRef.current?.close();
    setActiveTicket(null);
    setMessages([]);
    fetchTickets();
  };

  // ── Chat View ──────────────────────────────────────────────────────────────
  if (activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-48px)]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <button onClick={handleBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors outline-none">
            <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-sora font-bold text-lg text-[var(--text-primary)] truncate">
              {activeTicket.subject}
            </h2>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              activeTicket.status === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              {activeTicket.status}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 scroll-smooth">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--accent-teal)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_type === 'USER' && msg.sender_id === user?.user_id;
              const isAdmin = msg.sender_type === 'ADMIN';
              return (
                <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-br-md'
                      : isAdmin
                        ? 'bg-amber-500/10 border border-amber-500/20 text-[var(--text-primary)] rounded-bl-md'
                        : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
                  }`}>
                    {isAdmin && (
                      <div className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Support Admin
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        {activeTicket.status === 'OPEN' && (
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              />
              <button
                onClick={handleSend}
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform outline-none shrink-0"
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
            <HelpCircle className="w-6 h-6 text-teal-500" />
            Help Center
          </h1>
          <p className="text-[var(--text-secondary)]">Get support from our team</p>
        </div>
        <Button className="py-2 px-4 text-sm" onClick={() => setShowNewForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Complaint
        </Button>
      </div>

      {/* New Ticket Form */}
      {showNewForm && (
        <Card className="p-5 border-teal-500/20 bg-teal-500/5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Describe your issue</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTicket()}
              placeholder="e.g. Transaction failed but balance deducted"
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500 transition-colors"
            />
            <Button className="px-5 shrink-0" onClick={handleCreateTicket}>Submit</Button>
          </div>
          <button onClick={() => setShowNewForm(false)} className="text-xs text-[var(--text-secondary)] mt-2 hover:text-rose-400 transition-colors outline-none">
            Cancel
          </button>
        </Card>
      )}

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle size={48} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-30" />
            <p className="text-[var(--text-secondary)]">No complaints yet. Tap "New Complaint" if you need help.</p>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.ticket_id}
              className="p-4 cursor-pointer hover:border-teal-500/30 transition-all group"
              onClick={() => openTicket(ticket)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      ticket.status === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-teal-400 transition-colors">
                      {ticket.subject}
                    </h3>
                  </div>
                  {ticket.last_message && (
                    <p className="text-xs text-[var(--text-secondary)] truncate ml-4">
                      {ticket.last_message}
                    </p>
                  )}
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

export default HelpCenterPage;
