"use client";

import { useState } from "react";
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
    </>
  );
}
