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
import { useLocale, useTranslations } from "next-intl";
import { format, addDays, differenceInDays } from "date-fns";

const LEAVE_TYPE_ORDER: LeaveType[] = [
  "VACATION",
  "SICK",
  "SPECIAL",
  "COMPENSATORY",
  "UNPAID",
  "PARENTAL",
  "OTHER",
];

export default function NewLeaveRequestPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("leave");
  const tNew = useTranslations("leave.new");
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const { createRequest, balance } = useLeave();

  const [type, setType] = useState<LeaveType>("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDayStart, setIsHalfDayStart] = useState(false);
  const [isHalfDayEnd, setIsHalfDayEnd] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        title: tToast("errorTitle"),
        description: tNew("toastDatesRequired"),
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
        title: tToast("successTitle"),
        description: tNew("toastSubmitted"),
      });

      router.push(`/${locale}/leave`);
    } catch (err) {
      toast({
        title: tToast("errorTitle"),
        description: err instanceof Error ? err.message : tToast("unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate =
    type === "SICK"
      ? format(addDays(new Date(), -30), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/leave`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tNew("title")}</h1>
          <p className="text-muted-foreground">{tNew("subtitle")}</p>
        </div>
      </div>

      {balance && type === "VACATION" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {tNew("balanceInfo", {
                remaining: balance.remaining,
                pending: balance.pending,
                used: balance.used,
              })}
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            {tNew("formTitle")}
          </CardTitle>
          <CardDescription>{tNew("formDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">{tNew("absenceType")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPE_ORDER.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      <div>
                        <div className="font-medium">{t(`formTypes.${lt}.label`)}</div>
                        <div className="text-xs text-muted-foreground">
                          {t(`formTypes.${lt}.description`)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{tNew("from")}</Label>
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
                    {tNew("halfDay")}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{tNew("to")}</Label>
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
                    {tNew("halfDay")}
                  </Label>
                </div>
              </div>
            </div>

            {startDate && endDate && (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <span>
                  {tNew("estimated")}{" "}
                  <strong>{tNew("estimatedDays", { count: estimatedDays() })}</strong>
                  <span className="text-xs text-muted-foreground ml-2">
                    {tNew("estimatedNote")}
                  </span>
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                {tNew("reason")}
                {type === "SPECIAL" ? " *" : ""}
              </Label>
              <Input
                id="reason"
                placeholder={tNew("reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={type === "SPECIAL"}
              />
              <p className="text-xs text-muted-foreground">{tNew("reasonHintSonder")}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href={`/${locale}/leave`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  {tCommon("cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tNew("submitting")}
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    {tNew("submit")}
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
