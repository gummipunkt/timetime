"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { LogIn, LogOut, Coffee, Clock, Loader2, AlertTriangle } from "lucide-react";
import { TimeEntryType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function TodayOverview() {
  const { status, isLoading, error, refresh } = useTimeTracking();
  const { toast } = useToast();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionTimestamp, setCorrectionTimestamp] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const getIcon = (type: TimeEntryType) => {
    switch (type) {
      case TimeEntryType.CLOCK_IN:
        return <LogIn className="w-4 h-4 text-success" />;
      case TimeEntryType.CLOCK_OUT:
        return <LogOut className="w-4 h-4 text-destructive" />;
      case TimeEntryType.BREAK_START:
        return <Coffee className="w-4 h-4 text-warning" />;
      case TimeEntryType.BREAK_END:
        return <Coffee className="w-4 h-4 text-success" />;
    }
  };

  const getLabel = (type: TimeEntryType) => {
    switch (type) {
      case TimeEntryType.CLOCK_IN:
        return "Kommen";
      case TimeEntryType.CLOCK_OUT:
        return "Gehen";
      case TimeEntryType.BREAK_START:
        return "Pause Start";
      case TimeEntryType.BREAK_END:
        return "Pause Ende";
    }
  };

  const openCorrectionDialog = (entryId: string, ts: string) => {
    setSelectedEntryId(entryId);
    const d = new Date(ts);
    setCorrectionTimestamp(d.toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
    setCorrectionReason("");
    setCorrectionOpen(true);
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryId || !correctionTimestamp || !correctionReason.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/time/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeEntryId: selectedEntryId,
          requestedType: status?.lastEntry?.type ?? TimeEntryType.CLOCK_IN,
          requestedTimestamp: new Date(correctionTimestamp).toISOString(),
          reason: correctionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Antrag konnte nicht erstellt werden.");
      }
      toast({
        title: "Korrekturantrag erstellt",
        description: "Ihr Antrag wurde zur Prüfung an Ihre Führungskraft/HR gesendet.",
      });
      setCorrectionOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Korrekturantrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Heutige Stempelungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const entries = status?.entries || [];

  const breakMinutes = status?.todayBreakMinutes || 0;
  const remainingBreak = status?.remainingBreakMinutes || 0;
  const requiredBreak = status?.requiredBreakMinutes || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Heutige Stempelungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Erneut laden
            </Button>
          </div>
        )}
        {!error && entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Stempelungen heute.</p>
            <p className="text-sm">Stempeln Sie sich ein, um zu beginnen.</p>
          </div>
        )}
        {!error && entries.length > 0 && (
          <div className="space-y-4">
            {/* Pause Summary */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pause heute</span>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {formatMinutes(breakMinutes)}
                </Badge>
              </div>
              {remainingBreak > 0 && (
                <div className="flex items-center gap-2 mt-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Noch {formatMinutes(remainingBreak)} Pause erforderlich
                  </span>
                </div>
              )}
              {requiredBreak > 0 && remainingBreak === 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  ✓ Pflichtpause von {formatMinutes(requiredBreak)} erfüllt
                </div>
              )}
            </div>

            {/* Entries List */}
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                    {getIcon(entry.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getLabel(entry.type)}</p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">{entry.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">
                      {new Date(entry.timestamp).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => openCorrectionDialog(entry.id, entry.timestamp as unknown as string)}
                    >
                      Korrektur beantragen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <form onSubmit={submitCorrection}>
            <DialogHeader>
              <DialogTitle>Korrektur der Stempelzeit beantragen</DialogTitle>
              <DialogDescription>
                Geben Sie die gewünschte Zeit und eine kurze Begründung für die Korrektur an.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Neue Zeit</label>
                <Input
                  type="datetime-local"
                  value={correctionTimestamp}
                  onChange={(e) => setCorrectionTimestamp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Begründung</label>
                <Textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  rows={3}
                  placeholder="z.B. Vergessen zu stempeln, falsche Uhrzeit erfasst..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCorrectionOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gesendet..." : "Korrekturantrag senden"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
