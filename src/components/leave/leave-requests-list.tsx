"use client";

import { useLeave } from "@/hooks/use-leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  List,
  Loader2,
  CalendarDays,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { LeaveStatus, LeaveType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locale";

const statusConfig: Record<
  LeaveStatus,
  { color: string; icon: React.ElementType }
> = {
  PENDING: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  APPROVED: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  REJECTED: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  CANCELLED: { color: "bg-muted text-muted-foreground border-muted", icon: X },
};

function leaveTypeLabel(type: LeaveType, t: (key: string) => string) {
  const m: Record<LeaveType, string> = {
    VACATION: t("types.VACATION"),
    SICK: t("types.SICK"),
    SPECIAL: t("types.SPECIAL"),
    UNPAID: t("types.UNPAID"),
    COMPENSATORY: t("types.COMPENSATORY"),
    PARENTAL: t("types.PARENTAL"),
    OTHER: t("types.OTHER"),
  };
  return m[type];
}

function leaveStatusLabel(status: LeaveStatus, t: (key: string) => string) {
  const m: Record<LeaveStatus, string> = {
    PENDING: t("status.PENDING"),
    APPROVED: t("status.APPROVED"),
    REJECTED: t("status.REJECTED"),
    CANCELLED: t("status.CANCELLED"),
  };
  return m[status];
}

export function LeaveRequestsList() {
  const locale = useLocale();
  const dfLocale = getDateFnsLocale(locale);
  const t = useTranslations("leave");
  const tToast = useTranslations("toast");
  const { requests, isLoading, error, cancelRequest } = useLeave();
  const { toast } = useToast();

  const handleCancel = async (id: string) => {
    if (!confirm(t("list.confirmCancel"))) return;

    try {
      await cancelRequest(id);
      toast({
        title: tToast("successTitle"),
        description: t("list.cancelSuccess"),
      });
    } catch (err) {
      toast({
        title: tToast("errorTitle"),
        description: err instanceof Error ? err.message : tToast("unknownError"),
        variant: "destructive",
      });
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
          <List className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t("list.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("list.emptyHint")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          {t("list.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {requests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;
            const typeLabel = leaveTypeLabel(request.type, t as (key: string) => string);
            const statusLabel = leaveStatusLabel(request.status, t as (key: string) => string);

            return (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{typeLabel}</span>
                      <Badge variant="outline" className={cn("text-xs", status.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(request.startDate, "dd. MMM", { locale: dfLocale })} -{" "}
                      {format(request.endDate, "dd. MMM yyyy", { locale: dfLocale })}
                      <span className="mx-2">·</span>
                      {request.totalDays}{" "}
                      {request.totalDays === 1 ? t("list.day") : t("list.days")}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        &quot;{request.reason}&quot;
                      </p>
                    )}
                    {request.rejectionReason && (
                      <p className="text-sm text-destructive mt-1">
                        {t("list.reasonLabel")} {request.rejectionReason}
                      </p>
                    )}
                    {request.approver && request.status === LeaveStatus.APPROVED && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("list.approvedBy", {
                          name: request.approver.name,
                          date: format(request.approvedAt!, "dd.MM.yyyy", { locale: dfLocale }),
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {(request.status === LeaveStatus.PENDING ||
                    (request.status === LeaveStatus.APPROVED &&
                      new Date(request.startDate) > new Date())) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t("list.cancel")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
