"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { Clock, TrendingUp, CalendarDays, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function DashboardStats() {
  const t = useTranslations("dashboard.stats");
  const { status, isLoading } = useTimeTracking();

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatMinutesSigned = (minutes: number) => {
    const formatted = formatMinutes(minutes);
    return minutes >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const todayWorked = status?.todayWorkedMinutes || 0;
  const todayTarget = status?.todayTargetMinutes || 480;
  const todayDelta = status?.todayDelta || 0;
  const flexBalance = status?.totalFlexBalance || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("workedToday")}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold time-display">{formatMinutes(todayWorked)}</div>
          <p className="text-xs text-muted-foreground">
            {t("ofTarget", { target: formatMinutes(todayTarget) })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("flexBalance")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold time-display",
              flexBalance >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {formatMinutesSigned(flexBalance)}
          </div>
          <p className="text-xs text-muted-foreground">{t("flexBalanceSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("leaveRemaining")}</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">30</div>
          <p className="text-xs text-muted-foreground">{t("daysAvailable")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("deltaToday")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold time-display",
              todayDelta >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {formatMinutesSigned(todayDelta)}
          </div>
          <p className="text-xs text-muted-foreground">{t("deltaSub")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
