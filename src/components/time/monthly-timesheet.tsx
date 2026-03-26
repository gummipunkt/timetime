"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Sun,
  Plane,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locale";

interface DaySummary {
  date: string;
  workedMinutes: number;
  breakMinutes: number;
  targetMinutes: number;
  deltaMinutes: number;
  isHoliday: boolean;
  isWeekend: boolean;
  isLeaveDay: boolean;
  leaveType: string | null;
  firstClockIn: string | null;
  lastClockOut: string | null;
}

interface MonthStats {
  totalWorkedMinutes: number;
  totalTargetMinutes: number;
  totalDelta: number;
  workDays: number;
  holidays: number;
  leaveDays: number;
  totalFlexBalance: number;
}

export function MonthlyTimesheet() {
  const locale = useLocale();
  const dfLocale = getDateFnsLocale(locale);
  const t = useTranslations("time.monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/time/summary?year=${year}&month=${month}`);
      const data = await response.json();

      if (data.success) {
        setSummaries(data.summaries);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch summaries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMinutes = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const formatted = `${hours}:${mins.toString().padStart(2, "0")}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const formatMinutesSigned = (minutes: number) => {
    const formatted = formatMinutes(minutes);
    return minutes >= 0 ? `+${formatted}` : formatted;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClass = (summary: DaySummary) => {
    const date = new Date(summary.date);
    const today = isToday(date);

    if (today) return "bg-primary/10 border-primary";
    if (summary.isHoliday) return "bg-amber-50 dark:bg-amber-950/30";
    if (summary.isLeaveDay) return "bg-blue-50 dark:bg-blue-950/30";
    if (summary.isWeekend) return "bg-muted/50";
    return "";
  };

  const summaryMap = new Map(summaries.map((s) => [s.date, s]));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t("title")}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            {t("today")}
          </Button>
          <div className="w-40 text-center font-medium">
            {format(currentDate, "MMMM yyyy", { locale: dfLocale })}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t("worked")}</p>
                  <p className="text-xl font-bold time-display">
                    {formatMinutes(stats.totalWorkedMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("target")}</p>
                  <p className="text-xl font-bold time-display">
                    {formatMinutes(stats.totalTargetMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("monthBalance")}</p>
                  <p
                    className={cn(
                      "text-xl font-bold time-display",
                      stats.totalDelta >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {formatMinutesSigned(stats.totalDelta)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("flexTotal")}</p>
                  <p
                    className={cn(
                      "text-xl font-bold time-display",
                      stats.totalFlexBalance >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {formatMinutesSigned(stats.totalFlexBalance)}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">{t("colDay")}</th>
                    <th className="text-center py-2 px-3 font-medium">{t("colIn")}</th>
                    <th className="text-center py-2 px-3 font-medium">{t("colOut")}</th>
                    <th className="text-right py-2 px-3 font-medium">{t("colWorked")}</th>
                    <th className="text-right py-2 px-3 font-medium">{t("colTarget")}</th>
                    <th className="text-right py-2 px-3 font-medium">{t("colDelta")}</th>
                  </tr>
                </thead>
                <tbody>
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const summary = summaryMap.get(dateStr);
                    const dayOfWeek = format(day, "EEE", { locale: dfLocale });
                    const dayNum = format(day, "d");

                    if (!summary) {
                      return (
                        <tr key={dateStr} className="border-b border-muted">
                          <td className="py-2 px-3">
                            <span className="text-muted-foreground">
                              {dayOfWeek}, {dayNum}.
                            </span>
                          </td>
                          <td colSpan={5} className="py-2 px-3 text-center text-muted-foreground">
                            -
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={dateStr}
                        className={cn(
                          "border-b border-muted transition-colors hover:bg-muted/30",
                          getDayClass(summary)
                        )}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(summary.isWeekend && "text-muted-foreground")}
                            >
                              {dayOfWeek}, {dayNum}.
                            </span>
                            {summary.isHoliday && (
                              <Sun className="w-4 h-4 text-amber-500" />
                            )}
                            {summary.isLeaveDay && (
                              <Plane className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {summary.firstClockIn
                            ? format(new Date(summary.firstClockIn), "HH:mm")
                            : "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {summary.lastClockOut
                            ? format(new Date(summary.lastClockOut), "HH:mm")
                            : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {summary.workedMinutes > 0
                            ? formatMinutes(summary.workedMinutes)
                            : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          {summary.targetMinutes > 0
                            ? formatMinutes(summary.targetMinutes)
                            : "-"}
                        </td>
                        <td
                          className={cn(
                            "py-2 px-3 text-right font-mono",
                            summary.deltaMinutes > 0 && "text-success",
                            summary.deltaMinutes < 0 &&
                              !summary.isWeekend &&
                              !summary.isHoliday &&
                              !summary.isLeaveDay &&
                              "text-destructive"
                          )}
                        >
                          {!summary.isWeekend &&
                          !summary.isHoliday &&
                          !summary.isLeaveDay
                            ? formatMinutesSigned(summary.deltaMinutes)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/10 border border-primary" />
                <span>{t("legendToday")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t("legendHoliday")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-500" />
                <span>{t("legendLeave")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/50" />
                <span>{t("legendWeekend")}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
