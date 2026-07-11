"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type InvoiceStatus = "PAID" | "OPEN" | "FAILED" | "REFUNDED" | "VOID";

export type AdminInvoice = {
  id: string;
  number: string;
  userId: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
  refundedAmount: number;
  invoiceUrl: string;
};

export type AdminInvoicesFilters = {
  status?: InvoiceStatus | "ALL";
  search?: string;
  from?: string;
  to?: string;
};

export const ADMIN_INVOICES_QUERY_KEY = ["admin-invoices"] as const;

export function adminInvoicesKey(filters: AdminInvoicesFilters = {}) {
  return [...ADMIN_INVOICES_QUERY_KEY, filters] as const;
}

export function useAdminInvoices(filters: AdminInvoicesFilters = {}) {
  return useQuery<AdminInvoice[]>({
    queryKey: adminInvoicesKey(filters),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.search) qs.set("search", filters.search);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);
      const path = qs.toString()
        ? `/admin/invoices?${qs.toString()}`
        : "/admin/invoices";
      try {
        const res = await api.get<AdminInvoice[]>(path);
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
  });
}

export function useRefundInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount?: number) => {
      const res = await api.post<AdminInvoice>(`/admin/invoices/${id}/refund`, {
        amount,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_INVOICES_QUERY_KEY });
    },
  });
}

export function useExportInvoices() {
  return useMutation({
    mutationFn: async (filters: AdminInvoicesFilters) => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.search) qs.set("search", filters.search);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);
      const path = qs.toString()
        ? `/admin/invoices/export?${qs.toString()}`
        : "/admin/invoices/export";
      const res = await api.get<{ url: string }>(path);
      return res.data;
    },
  });
}