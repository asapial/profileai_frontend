"use client";

// Support ticket hooks for A-P11.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type TicketStatus = "OPEN" | "PENDING" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type TicketMessage = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "USER" | "ADMIN" | "BOT";
  body: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  user: { id: string; name: string | null; email: string };
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
  preview: string;
};

export type TicketWithMessages = Ticket & {
  messages: TicketMessage[];
};

export const ADMIN_TICKETS_QUERY_KEY = ["admin-tickets"] as const;

export function useAdminTickets(filters: {
  status?: TicketStatus | "ALL";
  q?: string;
} = {}) {
  return useQuery({
    queryKey: [...ADMIN_TICKETS_QUERY_KEY, filters],
    queryFn: async () => {
      try {
        const qs = new URLSearchParams();
        if (filters.status && filters.status !== "ALL")
          qs.set("status", filters.status);
        if (filters.q) qs.set("q", filters.q);
        const path =
          qs.toString().length > 0
            ? `/admin/tickets?${qs.toString()}`
            : "/admin/tickets";
        const r = await api.get<Ticket[]>(path);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404)
          return [] as Ticket[];
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminTicketDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin-ticket-detail", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const r = await api.get<TicketWithMessages>(`/admin/tickets/${id}`);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useReplyToTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<TicketMessage>(`/admin/tickets/${id}/messages`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", id] });
      qc.invalidateQueries({ queryKey: ADMIN_TICKETS_QUERY_KEY });
    },
  });
}

export function useTransitionTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: TicketStatus) =>
      api.patch<Ticket>(`/admin/tickets/${id}`, { status: next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticket-detail", id] });
      qc.invalidateQueries({ queryKey: ADMIN_TICKETS_QUERY_KEY });
    },
  });
}
