import { useState, useEffect, useCallback } from 'react';
import { getMyTickets } from '../api';
import { SupportTicket } from '../types';
import { useAuth } from '../AuthContext';

const getSeenMap = (userId: number): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(`mesopro_ticket_seen_${userId}`) || '{}'); } catch { return {}; }
};

export const markTicketSeen = (userId: number, ticket: SupportTicket) => {
  if (!ticket.last_admin_reply_at) return;
  const map = getSeenMap(userId);
  map[String(ticket.id)] = ticket.last_admin_reply_at;
  localStorage.setItem(`mesopro_ticket_seen_${userId}`, JSON.stringify(map));
};

export const hasUnread = (userId: number, ticket: SupportTicket): boolean => {
  if (!ticket.last_admin_reply_at || !Number(ticket.admin_reply_count)) return false;
  const seen = getSeenMap(userId)[String(ticket.id)];
  return !seen || new Date(ticket.last_admin_reply_at) > new Date(seen);
};

export function useUnreadTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const refresh = useCallback(() => {
    if (!user) return;
    getMyTickets().then(setTickets).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) { setTickets([]); return; }
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const unreadCount = user ? tickets.filter(t => hasUnread(user.id, t)).length : 0;

  return { tickets, setTickets, unreadCount, refresh };
}
