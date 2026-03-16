"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

interface TimeCorrectionRequest {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  timeEntryId?: string | null;
  requestedType: string;
  requestedTimestamp: string;
  requestedNote?: string | null;
  reason: string;
  status: CorrectionStatus;
  createdAt: string;
  approverId?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export function TimeCorrectionList() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TimeCorrectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/time/corrections/pending");
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load time corrections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/time/corrections/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Korrekturantrag konnte nicht genehmigt werden.");
      }
      toast({
        title: "Korrektur genehmigt",
        description: "Der Zeiteintrag wurde entsprechend angepasst.",
      });
      loadRequests();
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Korrekturantrag konnte nicht genehmigt werden.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Bitte geben Sie einen Ablehnungsgrund an:");
    if (!reason) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/time/corrections/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Korrekturantrag konnte nicht abgelehnt werden.");
      }
      toast({
        title: "Korrektur abgelehnt",
        description: "Der Antrag wurde mit Begründung abgelehnt.",
      });
      loadRequests();
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Korrekturantrag konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Es liegen aktuell keine offenen Korrekturanträge vor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {req.user.firstName} {req.user.lastName}
                </span>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(req.requestedTimestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Typ: {req.requestedType} • Grund: {req.reason}
              </p>
              {req.requestedNote && (
                <p className="text-xs text-muted-foreground">
                  Notiz des Mitarbeiters: {req.requestedNote}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={processingId === req.id}
                onClick={() => handleReject(req.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Ablehnen
              </Button>
              <Button
                size="sm"
                disabled={processingId === req.id}
                onClick={() => handleApprove(req.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Genehmigen
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

