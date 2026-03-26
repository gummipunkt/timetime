"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Clock,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AuditAction } from "@prisma/client";
import { cn } from "@/lib/utils";

interface AuditUserOption {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string | null;
  user: { id: string; name: string } | null;
  performedBy: { id: string; name: string };
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Erstellt",
  UPDATE: "Aktualisiert",
  DELETE: "Gelöscht",
  APPROVE: "Genehmigt",
  REJECT: "Abgelehnt",
  CORRECT: "Korrigiert",
};

const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  APPROVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CORRECT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>(""); // betroffener User
  const [performedByFilter, setPerformedByFilter] = useState<string>(""); // wer hat es gemacht
  const [userOptions, setUserOptions] = useState<AuditUserOption[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", (page * limit).toString());
      if (entityFilter) params.set("entityType", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (userFilter) params.set("userId", userFilter);
      if (performedByFilter) params.set("performedById", performedByFilter);

      const response = await fetch(`/api/admin/audit?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Laden");
      }
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        throw new Error(data.error || "Unbekannter Fehler");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setFetchError(error instanceof Error ? error.message : "Fehler beim Laden der Audit-Logs");
      setLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, entityFilter, limit, page, performedByFilter, userFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Wenn Filter wechseln, Pagination zurücksetzen (sonst leere Seite durch Offset)
  useEffect(() => {
    setPage(0);
  }, [entityFilter, actionFilter, userFilter, performedByFilter]);

  // User-Optionen laden (für Filter-Auswahl)
  useEffect(() => {
    const loadUsers = async () => {
      setIsUsersLoading(true);
      try {
        const response = await fetch("/api/admin/audit/users");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Fehler beim Laden der Nutzer");
        }
        if (data.success) {
          setUserOptions(data.users || []);
        } else {
          throw new Error(data.error || "Unbekannter Fehler");
        }
      } catch (e) {
        console.error("Fetch audit users error:", e);
        setUserOptions([]);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit-Log</h1>
        <p className="text-muted-foreground mt-1">
          Protokoll aller administrativen Änderungen im System.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={entityFilter || "all"} onValueChange={(v) => setEntityFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Entitäten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Entitäten</SelectItem>
                <SelectItem value="User">Benutzer</SelectItem>
                <SelectItem value="LEAVE_REQUEST">Urlaubsantrag</SelectItem>
                <SelectItem value="TIME_CORRECTION">Zeitkorrektur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter || "all"} onValueChange={(v) => setActionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Aktionen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                <SelectItem value="CREATE">Erstellt</SelectItem>
                <SelectItem value="UPDATE">Aktualisiert</SelectItem>
                <SelectItem value="DELETE">Gelöscht</SelectItem>
                <SelectItem value="APPROVE">Genehmigt</SelectItem>
                <SelectItem value="REJECT">Abgelehnt</SelectItem>
                <SelectItem value="CORRECT">Korrigiert</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter || "all"} onValueChange={(v) => setUserFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Betroffener Nutzer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle betroffenen Nutzer</SelectItem>
                {isUsersLoading ? (
                  <SelectItem value="__loading" disabled>
                    Lade Nutzer…
                  </SelectItem>
                ) : (
                  userOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select
              value={performedByFilter || "all"}
              onValueChange={(v) => setPerformedByFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Ausgeführt von" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ausführenden</SelectItem>
                {isUsersLoading ? (
                  <SelectItem value="__loading2" disabled>
                    Lade Nutzer…
                  </SelectItem>
                ) : (
                  userOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Änderungsprotokoll
            <Badge variant="secondary" className="ml-2">
              {total} Einträge
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-12">
              <p className="text-destructive font-medium">{fetchError}</p>
              <p className="text-sm text-muted-foreground mt-1">Bitte prüfen Sie Ihre Berechtigung (nur Admin).</p>
              <Button variant="outline" className="mt-4" onClick={fetchLogs}>
                Erneut laden
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Einträge gefunden.</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {log.entityType === "User" && (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                        {log.entityType === "TimeEntry" && (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        {(log.entityType === "LeaveRequest" || log.entityType === "LEAVE_REQUEST") && (
                          <CalendarDays className="w-5 h-5 text-muted-foreground" />
                        )}
                        {log.entityType === "TIME_CORRECTION" && (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        {!["User", "TimeEntry", "LeaveRequest", "LEAVE_REQUEST", "TIME_CORRECTION"].includes(
                          log.entityType
                        ) && (
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={cn("text-xs", actionColors[log.action])}
                          >
                            {actionLabels[log.action]}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.entityType}
                          </span>
                          {log.user && (
                            <span className="text-sm text-muted-foreground">
                              → {log.user.name}
                            </span>
                          )}
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            Von: <strong>{log.performedBy.name}</strong>
                          </span>
                          <span>
                            {format(
                              new Date(log.createdAt),
                              "dd.MM.yyyy HH:mm:ss",
                              { locale: de }
                            )}
                          </span>
                        </div>
                        {/* Show changes */}
                        {(log.oldValues || log.newValues) && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                            {log.oldValues && (
                              <div className="text-red-600 dark:text-red-400">
                                - {JSON.stringify(log.oldValues)}
                              </div>
                            )}
                            {log.newValues && (
                              <div className="text-green-600 dark:text-green-400">
                                + {JSON.stringify(log.newValues)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Zeige {page * limit + 1} -{" "}
                  {Math.min((page + 1) * limit, total)} von {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Seite {page + 1} von {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
