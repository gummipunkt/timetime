"use client";

import { useState, useEffect, useCallback } from "react";
import { TimeEntryType } from "@prisma/client";

interface TimeEntry {
  id: string;
  type: TimeEntryType;
  timestamp: Date;
  note: string | null;
}

interface TimeStatus {
  isWorking: boolean;
  isOnBreak: boolean;
  todayWorkedMinutes: number;
  todayBreakMinutes: number;
  todayTargetMinutes: number;
  todayDelta: number;
  totalFlexBalance: number;
  requiredBreakMinutes: number;
  remainingBreakMinutes: number;
  lastEntry: {
    id: string;
    type: TimeEntryType;
    timestamp: Date;
  } | null;
  entries: TimeEntry[];
}

interface UseTimeTrackingReturn {
  status: TimeStatus | null;
  isLoading: boolean;
  error: string | null;
  clockIn: (note?: string) => Promise<void>;
  clockOut: (note?: string) => Promise<void>;
  startBreak: (note?: string) => Promise<void>;
  endBreak: (note?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTimeTracking(): UseTimeTrackingReturn {
  const [status, setStatus] = useState<TimeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status laden
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/time/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Laden des Status");
      }

      setStatus({
        isWorking: data.isWorking,
        isOnBreak: data.isOnBreak,
        todayWorkedMinutes: data.todayWorkedMinutes,
        todayBreakMinutes: data.todayBreakMinutes,
        todayTargetMinutes: data.todayTargetMinutes,
        todayDelta: data.todayDelta,
        totalFlexBalance: data.totalFlexBalance,
        requiredBreakMinutes: data.requiredBreakMinutes || 0,
        remainingBreakMinutes: data.remainingBreakMinutes || 0,
        lastEntry: data.lastEntry
          ? {
              ...data.lastEntry,
              timestamp: new Date(data.lastEntry.timestamp),
            }
          : null,
        entries: data.entries.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Beim Mount laden
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Stempel-Funktion
  const clock = useCallback(
    async (type: TimeEntryType, note?: string) => {
      try {
        setError(null);
        const response = await fetch("/api/time/clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, note }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Fehler beim Stempeln");
        }

        // Status aktualisieren
        setStatus({
          isWorking: data.status.isWorking,
          isOnBreak: data.status.isOnBreak,
          todayWorkedMinutes: data.status.todayWorkedMinutes,
          todayBreakMinutes: data.status.todayBreakMinutes,
          todayTargetMinutes: data.status.todayTargetMinutes,
          todayDelta: data.status.todayDelta,
          totalFlexBalance: data.status.totalFlexBalance,
          requiredBreakMinutes: data.status.requiredBreakMinutes || 0,
          remainingBreakMinutes: data.status.remainingBreakMinutes || 0,
          lastEntry: data.status.lastEntry
            ? {
                ...data.status.lastEntry,
                timestamp: new Date(data.status.lastEntry.timestamp),
              }
            : null,
          entries: data.status.entries.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unbekannter Fehler";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  const clockIn = useCallback(
    (note?: string) => clock(TimeEntryType.CLOCK_IN, note),
    [clock]
  );

  const clockOut = useCallback(
    (note?: string) => clock(TimeEntryType.CLOCK_OUT, note),
    [clock]
  );

  const startBreak = useCallback(
    (note?: string) => clock(TimeEntryType.BREAK_START, note),
    [clock]
  );

  const endBreak = useCallback(
    (note?: string) => clock(TimeEntryType.BREAK_END, note),
    [clock]
  );

  return {
    status,
    isLoading,
    error,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refresh: fetchStatus,
  };
}
