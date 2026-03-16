"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLeave } from "@/hooks/use-leave";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus, ArrowLeft, Loader2, CalendarDays, Info } from "lucide-react";
import Link from "next/link";
import { LeaveType } from "@prisma/client";
import { format, addDays, differenceInDays } from "date-fns";

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
  { value: "VACATION", label: "Erholungsurlaub", description: "Regulärer bezahlter Urlaub" },
  { value: "SICK", label: "Krankheit", description: "Krankmeldung (ggf. mit AU)" },
  { value: "SPECIAL", label: "Sonderurlaub", description: "Hochzeit, Geburt, Umzug, etc." },
  { value: "COMPENSATORY", label: "Überstundenausgleich", description: "Ausgleich von Überstunden" },
  { value: "UNPAID", label: "Unbezahlter Urlaub", description: "Urlaub ohne Gehalt" },
  { value: "PARENTAL", label: "Elternzeit", description: "Elternzeit / Mutterschutz" },
  { value: "OTHER", label: "Sonstiges", description: "Andere Abwesenheit" },
];

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createRequest, balance } = useLeave();

  const [type, setType] = useState<LeaveType>("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDayStart, setIsHalfDayStart] = useState(false);
  const [isHalfDayEnd, setIsHalfDayEnd] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Berechnung der Tage (grobe Schätzung - Server macht genaue Berechnung)
  const estimatedDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = differenceInDays(end, start) + 1;
    if (isHalfDayStart) days -= 0.5;
    if (isHalfDayEnd) days -= 0.5;
    return Math.max(0, days);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie Start- und Enddatum.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createRequest({
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isHalfDayStart,
        isHalfDayEnd,
        reason: reason || undefined,
      });

      toast({
        title: "Erfolg",
        description: "Ihr Urlaubsantrag wurde eingereicht.",
      });

      router.push("/leave");
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Minimum date = heute (außer bei Krankheit)
  const minDate = type === "SICK" 
    ? format(addDays(new Date(), -30), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leave">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neuer Urlaubsantrag</h1>
          <p className="text-muted-foreground">
            Füllen Sie das Formular aus, um einen Antrag zu stellen.
          </p>
        </div>
      </div>

      {/* Balance Info */}
      {balance && type === "VACATION" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary" />
            <span className="text-sm">
              Sie haben noch <strong>{balance.remaining} Urlaubstage</strong> verfügbar
              ({balance.pending} beantragt, {balance.used} genommen).
            </span>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Antrag erstellen
          </CardTitle>
          <CardDescription>
            Alle Felder mit * sind Pflichtfelder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Art der Abwesenheit *</Label>
              <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      <div>
                        <div className="font-medium">{lt.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {lt.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Von *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minDate}
                  required
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="halfDayStart"
                    checked={isHalfDayStart}
                    onCheckedChange={(checked) => setIsHalfDayStart(checked === true)}
                  />
                  <Label htmlFor="halfDayStart" className="text-sm font-normal">
                    Nur halber Tag
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Bis *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || minDate}
                  required
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="halfDayEnd"
                    checked={isHalfDayEnd}
                    onCheckedChange={(checked) => setIsHalfDayEnd(checked === true)}
                  />
                  <Label htmlFor="halfDayEnd" className="text-sm font-normal">
                    Nur halber Tag
                  </Label>
                </div>
              </div>
            </div>

            {/* Estimated Days */}
            {startDate && endDate && (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <span>
                  Geschätzte Dauer: <strong>{estimatedDays()} Tage</strong>
                  <span className="text-xs text-muted-foreground ml-2">
                    (genaue Berechnung erfolgt durch das System)
                  </span>
                </span>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Begründung {type === "SPECIAL" && "*"}
              </Label>
              <Input
                id="reason"
                placeholder="Optional: Grund für den Antrag..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={type === "SPECIAL"}
              />
              <p className="text-xs text-muted-foreground">
                Bei Sonderurlaub ist eine Begründung erforderlich.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/leave">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Abbrechen
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Antrag einreichen
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
