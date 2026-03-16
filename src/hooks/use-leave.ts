"use client";

import { useState, useEffect, useCallback } from "react";
import { LeaveType, LeaveStatus } from "@prisma/client";

interface LeaveRequest {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  totalDays: number;
  reason: string | null;
  approver: { id: string; name: string } | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
}

interface LeaveBalance {
  year: number;
  entitlement: number;
  carryOver: number;
  used: number;
  pending: number;
  remaining: number;
}

interface UseLeaveReturn {
  requests: LeaveRequest[];
  balance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;
  createRequest: (data: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    isHalfDayStart?: boolean;
    isHalfDayEnd?: boolean;
    reason?: string;
  }) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLeave(): UseLeaveReturn {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/leave");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Laden");
      }

      setRequests(
        data.requests.map((r: any) => ({
          ...r,
          startDate: new Date(r.startDate),
          endDate: new Date(r.endDate),
          approvedAt: r.approvedAt ? new Date(r.approvedAt) : null,
          createdAt: new Date(r.createdAt),
        }))
      );
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createRequest = async (data: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    isHalfDayStart?: boolean;
    isHalfDayEnd?: boolean;
    reason?: string;
  }) => {
    const response = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Fehler beim Erstellen");
    }

    await fetchData();
  };

  const cancelRequest = async (id: string) => {
    const response = await fetch(`/api/leave/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Fehler beim Stornieren");
    }

    await fetchData();
  };

  return {
    requests,
    balance,
    isLoading,
    error,
    createRequest,
    cancelRequest,
    refresh: fetchData,
  };
}

// Hook für Supervisor/Admin - ausstehende Genehmigungen
interface PendingRequest {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  user: { id: string; name: string; email: string };
  createdAt: Date;
}

interface UsePendingApprovalsReturn {
  requests: PendingRequest[];
  isLoading: boolean;
  error: string | null;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePendingApprovals(): UsePendingApprovalsReturn {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/leave/pending");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Laden");
      }

      setRequests(
        data.requests.map((r: any) => ({
          ...r,
          startDate: new Date(r.startDate),
          endDate: new Date(r.endDate),
          createdAt: new Date(r.createdAt),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approveRequest = async (id: string) => {
    const response = await fetch(`/api/leave/${id}/approve`, {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Fehler beim Genehmigen");
    }

    await fetchData();
  };

  const rejectRequest = async (id: string, reason: string) => {
    const response = await fetch(`/api/leave/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Fehler beim Ablehnen");
    }

    await fetchData();
  };

  return {
    requests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    refresh: fetchData,
  };
}
