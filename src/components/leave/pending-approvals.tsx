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
import { LeaveType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale, useTranslations } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locale";

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

function auditActionLabel(action: string, t: (key: string) => string) {
  if (action === "APPROVE") return t("approvals.auditApprove");
  if (action === "REJECT") return t("approvals.auditReject");
  if (action === "UPDATE") return t("approvals.auditUpdate");
  return action;
}

export function PendingApprovals() {
  const locale = useLocale();
  const dfLocale = getDateFnsLocale(locale);
  const t = useTranslations("leave");
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");
  const { requests, isLoading, error, approveRequest, rejectRequest } = usePendingApprovals();
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
        title: tToast("successTitle"),
        description: t("approvals.approveSuccess"),
      });
    } catch (err) {
      toast({
        title: tToast("errorTitle"),
        description: err instanceof Error ? err.message : tToast("unknownError"),
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
        title: tToast("successTitle"),
        description: t("approvals.rejectSuccess"),
      });
      setRejectDialogOpen(false);
    } catch (err) {
      toast({
        title: tToast("errorTitle"),
        description: err instanceof Error ? err.message : tToast("unknownError"),
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
        throw new Error(data.error || t("approvals.historyLoadError"));
      }
      setHistoryLogs(
        (data.logs || []).map((log: Record<string, unknown>) => ({
          id: log.id as string,
          action: log.action as string,
          entityType: log.entityType as string,
          description: log.description as string | null,
          performedBy: log.performedBy as { id: string; name: string },
          createdAt: log.createdAt as string,
        }))
      );
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : t("approvals.historyLoadError")
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
          <p className="text-muted-foreground">{t("approvals.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("approvals.emptyHint")}</p>
        </CardContent>
      </Card>
    );
  }

  const tLeave = t as unknown as (key: string) => string;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            {t("approvals.title")}
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
                        {leaveTypeLabel(request.type, tLeave)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <CalendarDays className="w-3 h-3 inline mr-1" />
                      {format(request.startDate, "dd. MMM", { locale: dfLocale })} -{" "}
                      {format(request.endDate, "dd. MMM yyyy", { locale: dfLocale })}
                      <span className="mx-2">·</span>
                      {request.totalDays}{" "}
                      {request.totalDays === 1 ? t("list.day") : t("list.days")}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("approvals.reasonShown", { reason: request.reason })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("approvals.submittedOn", {
                        dateTime: format(request.createdAt, "Pp", { locale: dfLocale }),
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
                    {t("approvals.history")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => openRejectDialog(request.id)}
                    disabled={processingId === request.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {t("approvals.reject")}
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
                    {t("approvals.approve")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approvals.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("approvals.rejectDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t("approvals.rejectPlaceholder")}
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
              {tCommon("cancel")}
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
              {t("approvals.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approvals.historyTitle")}</DialogTitle>
            <DialogDescription>{t("approvals.historyDescription")}</DialogDescription>
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
              <div className="text-muted-foreground">{t("approvals.historyEmpty")}</div>
            )}
            {!historyLoading && !historyError && historyLogs.length > 0 && (
              <ul className="space-y-2">
                {historyLogs.map((log) => (
                  <li key={log.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">
                        {auditActionLabel(log.action, tLeave)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", {
                          locale: dfLocale,
                        })}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-xs text-muted-foreground mt-1">{log.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("approvals.historyBy", { name: log.performedBy.name })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
