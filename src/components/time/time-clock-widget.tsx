"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { Clock, Play, Square, Coffee, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { getIntlLocale } from "@/lib/date-fns-locale";

export function TimeClockWidget() {
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const t = useTranslations("time.clock");
  const tToast = useTranslations("toast");
  const { status, isLoading, error, clockIn, clockOut, startBreak, endBreak } =
    useTimeTracking();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClocking, setIsClocking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(intlLocale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatMinutes = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const formatted = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsClocking(true);
    try {
      await action();
      toast({
        title: tToast("successTitle"),
        description: successMessage,
      });
    } catch (err) {
      toast({
        title: tToast("errorTitle"),
        description: err instanceof Error ? err.message : tToast("unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockIn = () => handleAction(clockIn, t("toastIn"));
  const handleClockOut = () => handleAction(clockOut, t("toastOut"));
  const handleBreakStart = () => handleAction(startBreak, t("toastBreakStart"));
  const handleBreakEnd = () => handleAction(endBreak, t("toastBreakEnd"));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[140px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  const isWorking = status?.isWorking || false;
  const isOnBreak = status?.isOnBreak || false;
  const workedMinutes = status?.todayWorkedMinutes || 0;

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "h-2 transition-colors",
          !isWorking && !isOnBreak && "bg-muted",
          isWorking && "bg-success",
          isOnBreak && "bg-warning"
        )}
      />
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                !isWorking && !isOnBreak && "bg-muted",
                isWorking && "bg-success/10",
                isOnBreak && "bg-warning/10"
              )}
            >
              <Clock
                className={cn(
                  "w-8 h-8",
                  !isWorking && !isOnBreak && "text-muted-foreground",
                  isWorking && "text-success",
                  isOnBreak && "text-warning"
                )}
              />
            </div>
            <div>
              <div className="text-4xl font-bold time-display tracking-tight">
                {formatTime(currentTime)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "status-dot",
                    !isWorking && !isOnBreak && "status-inactive",
                    isWorking && "status-active",
                    isOnBreak && "status-break"
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {!isWorking && !isOnBreak && t("statusOff")}
                  {isWorking && t("statusWorking")}
                  {isOnBreak && t("statusBreak")}
                </span>
              </div>
            </div>
          </div>

          {(isWorking || isOnBreak || workedMinutes > 0) && (
            <div className="text-center lg:text-left">
              <p className="text-sm text-muted-foreground mb-1">{t("workedToday")}</p>
              <p className="text-3xl font-bold time-display text-primary">
                {formatMinutes(workedMinutes)}
              </p>
              {status?.todayTargetMinutes && status.todayTargetMinutes > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("targetLabel")} {formatMinutes(status.todayTargetMinutes)} · {t("deltaLabel")}{" "}
                  <span
                    className={cn(
                      "font-medium",
                      status.todayDelta >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {status.todayDelta >= 0 ? "+" : ""}
                    {formatMinutes(status.todayDelta)}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!isWorking && !isOnBreak && (
              <Button
                size="lg"
                className="flex-1 lg:flex-none bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleClockIn}
                disabled={isClocking}
              >
                {isClocking ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {t("clockIn")}
              </Button>
            )}

            {isWorking && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 lg:flex-none border-warning text-warning hover:bg-warning/10"
                  onClick={handleBreakStart}
                  disabled={isClocking}
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Coffee className="w-5 h-5 mr-2" />
                  )}
                  {t("pause")}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1 lg:flex-none"
                  onClick={handleClockOut}
                  disabled={isClocking}
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5 mr-2" />
                  )}
                  {t("clockOut")}
                </Button>
              </>
            )}

            {isOnBreak && (
              <>
                <Button
                  size="lg"
                  className="flex-1 lg:flex-none bg-success hover:bg-success/90 text-success-foreground"
                  onClick={handleBreakEnd}
                  disabled={isClocking}
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {t("resume")}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1 lg:flex-none"
                  onClick={handleClockOut}
                  disabled={isClocking}
                >
                  {isClocking ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5 mr-2" />
                  )}
                  {t("clockOut")}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          {status?.remainingBreakMinutes !== undefined && status.remainingBreakMinutes > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                {t("remainingBreak")}
              </span>
              <span className="font-medium time-display text-warning">
                {formatMinutes(status.remainingBreakMinutes)}
              </span>
            </div>
          )}

          {status?.todayBreakMinutes !== undefined && status.todayBreakMinutes > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("breakToday")}</span>
              <span className="font-medium time-display">
                {formatMinutes(status.todayBreakMinutes)}
              </span>
            </div>
          )}

          {status?.totalFlexBalance !== undefined && status.totalFlexBalance !== 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("flexBalanceTotal")}</span>
              <span
                className={cn(
                  "font-medium time-display",
                  status.totalFlexBalance >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {status.totalFlexBalance >= 0 ? "+" : ""}
                {formatMinutes(status.totalFlexBalance)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
