"use client";

import { useState, useEffect } from "react";
import { usePendingApprovals } from "@/hooks/use-leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  Loader2,
  CheckCircle,
  XCircle,
  CalendarDays,
  User,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { LeaveType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const leaveTypeLabels: Record<LeaveType, string> = {
  VACATION: "Urlaub",
  SICK: "Krankheit",
  SPECIAL: "Sonderurlaub",
  UNPAID: "Unbezahlt",
  COMPENSATORY: "Überstundenausgleich",
  PARENTAL: "Elternzeit",
  OTHER: "Sonstiges",
};

export function PendingApprovals() {
  const { requests, isLoading, error, approveRequest, rejectRequest, refresh } =
    usePendingApprovals();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<
    {
      id: string;
      action: string;
      entityType: string;
      description: string | null;
      performedBy: { id: string; name: string };
      createdAt: string;
    }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveRequest(id);
      toast({
        title: "Erfolg",
        description: "Antrag wurde genehmigt.",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;

    setProcessingId(rejectingId);
    try {
      await rejectRequest(rejectingId, rejectReason);
      toast({
        title: "Erfolg",
        description: "Antrag wurde abgelehnt.",
      });
      setRejectDialogOpen(false);
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setRejectingId(null);
    }
  };

  const openHistory = async (requestId: string) => {
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const params = new URLSearchParams();
      params.set("entityType", "LEAVE_REQUEST");
      params.set("entityId", requestId);
      params.set("limit", "20");
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Historie konnte nicht geladen werden.");
      }
      setHistoryLogs(
        (data.logs || []).map((log: any) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          description: log.description,
          performedBy: log.performedBy,
          createdAt: log.createdAt,
        }))
      );
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Historie konnte nicht geladen werden."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-6 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Keine ausstehenden Genehmigungen.</p>
          <p className="text-sm text-muted-foreground">
            Alle Anträge wurden bearbeitet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Ausstehende Genehmigungen
            <Badge variant="secondary" className="ml-2">
              {requests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{request.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {leaveTypeLabels[request.type]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <CalendarDays className="w-3 h-3 inline mr-1" />
                      {format(request.startDate, "dd. MMM", { locale: de })} -{" "}
                      {format(request.endDate, "dd. MMM yyyy", { locale: de })}
                      <span className="mx-2">·</span>
                      {request.totalDays} {request.totalDays === 1 ? "Tag" : "Tage"}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Grund: "{request.reason}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Beantragt am{" "}
                      {format(request.createdAt, "dd.MM.yyyy 'um' HH:mm", {
                        locale: de,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openHistory(request.id)}
                    disabled={processingId === request.id}
                  >
                    Historie
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => openRejectDialog(request.id)}
                    disabled={processingId === request.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Ablehnen
                  </Button>
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90"
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Genehmigen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Antrag ablehnen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen Grund für die Ablehnung an.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ablehnungsgrund..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processingId !== null}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historie des Antrags</DialogTitle>
            <DialogDescription>
              Genehmigungen und Ablehnungen dieses Urlaubsantrags.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 max-h-64 overflow-y-auto text-sm">
            {historyLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {historyError && !historyLoading && (
              <div className="text-destructive">{historyError}</div>
            )}
            {!historyLoading && !historyError && historyLogs.length === 0 && (
              <div className="text-muted-foreground">
                Es sind noch keine Aktionen für diesen Antrag protokolliert.
              </div>
            )}
            {!historyLoading && !historyError && historyLogs.length > 0 && (
              <ul className="space-y-2">
                {historyLogs.map((log) => (
                  <li key={log.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">
                        {log.action === "APPROVE"
                          ? "Genehmigt"
                          : log.action === "REJECT"
                          ? "Abgelehnt"
                          : log.action === "UPDATE"
                          ? "Aktualisiert"
                          : log.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Von: <strong>{log.performedBy.name}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
