"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  Loader2,
  CalendarDays,
  Coffee,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface MonthlySummary {
  date: string;
  workedMinutes: number;
  targetMinutes: number;
  deltaMinutes: number;
  isHoliday: boolean;
  isWeekend: boolean;
  isLeaveDay: boolean;
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

export default function ReportsPage() {
  const { data: session } = useSession();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/time/summary?year=${year}&month=${month}`
      );
      const data = await response.json();

      if (data.success) {
        setSummaries(data.summaries);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const formatMinutesSigned = (minutes: number) => {
    const formatted = formatMinutes(minutes);
    return minutes >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), "MMMM", { locale: de }),
  }));

  // Berechne Wochensummen
  const weekSummaries: { week: number; worked: number; target: number; delta: number }[] = [];
  let currentWeek = 1;
  let weekWorked = 0;
  let weekTarget = 0;

  summaries.forEach((s, i) => {
    const date = new Date(s.date);
    const dayOfWeek = date.getDay();

    weekWorked += s.workedMinutes;
    weekTarget += s.targetMinutes;

    // Sonntag oder letzter Tag
    if (dayOfWeek === 0 || i === summaries.length - 1) {
      weekSummaries.push({
        week: currentWeek,
        worked: weekWorked,
        target: weekTarget,
        delta: weekWorked - weekTarget,
      });
      currentWeek++;
      weekWorked = 0;
      weekTarget = 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berichte</h1>
          <p className="text-muted-foreground mt-1">
            Übersichten und Auswertungen Ihrer Arbeitszeit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {session?.user?.role === "ADMIN" && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `/api/admin/reports/monthly-timesheet?year=${year}&month=${month}`
                  );
                  if (!res.ok) return;
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `monthly-timesheet-${year}-${month}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  console.error("Export failed", e);
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export (CSV)
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gearbeitete Zeit
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold time-display">
                    {formatMinutes(stats.totalWorkedMinutes)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    von {formatMinutes(stats.totalTargetMinutes)} Soll
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monatssaldo
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "text-2xl font-bold time-display",
                      stats.totalDelta >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {formatMinutesSigned(stats.totalDelta)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plus/Minus diesen Monat
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gleitzeit gesamt
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "text-2xl font-bold time-display",
                      stats.totalFlexBalance >= 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {formatMinutesSigned(stats.totalFlexBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Überstunden insgesamt
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Arbeitstage
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.workDays}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.holidays} Feiertage, {stats.leaveDays} Urlaub
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs for different views */}
          <Tabs defaultValue="weekly" className="space-y-6">
            <TabsList>
              <TabsTrigger value="weekly">Wochenübersicht</TabsTrigger>
              <TabsTrigger value="daily">Tagesübersicht</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>Wochenweise Auswertung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weekSummaries.map((week) => (
                      <div
                        key={week.week}
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="w-20 font-medium">KW {week.week}</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Gearbeitet: {formatMinutes(week.worked)}</span>
                            <span className="text-muted-foreground">
                              Soll: {formatMinutes(week.target)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                week.delta >= 0 ? "bg-success" : "bg-primary"
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (week.worked / Math.max(week.target, 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-20 text-right font-mono font-medium",
                            week.delta >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {formatMinutesSigned(week.delta)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle>Tägliche Übersicht</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">
                            Datum
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Gearbeitet
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Soll
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Delta
                          </th>
                          <th className="text-center py-3 px-4 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {summaries.map((s) => (
                          <tr
                            key={s.date}
                            className={cn(
                              "hover:bg-muted/30",
                              s.isWeekend && "bg-muted/20",
                              s.isHoliday && "bg-amber-50 dark:bg-amber-950/20",
                              s.isLeaveDay && "bg-blue-50 dark:bg-blue-950/20"
                            )}
                          >
                            <td className="py-2 px-4">
                              {format(new Date(s.date), "EEE, dd.MM.", {
                                locale: de,
                              })}
                            </td>
                            <td className="py-2 px-4 text-right font-mono">
                              {s.workedMinutes > 0
                                ? formatMinutes(s.workedMinutes)
                                : "-"}
                            </td>
                            <td className="py-2 px-4 text-right font-mono text-muted-foreground">
                              {s.targetMinutes > 0
                                ? formatMinutes(s.targetMinutes)
                                : "-"}
                            </td>
                            <td
                              className={cn(
                                "py-2 px-4 text-right font-mono",
                                !s.isWeekend &&
                                  !s.isHoliday &&
                                  !s.isLeaveDay &&
                                  (s.deltaMinutes >= 0
                                    ? "text-success"
                                    : "text-destructive")
                              )}
                            >
                              {!s.isWeekend && !s.isHoliday && !s.isLeaveDay
                                ? formatMinutesSigned(s.deltaMinutes)
                                : "-"}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {s.isHoliday && (
                                <span className="text-xs text-amber-600">
                                  Feiertag
                                </span>
                              )}
                              {s.isLeaveDay && (
                                <span className="text-xs text-blue-600">
                                  Urlaub
                                </span>
                              )}
                              {s.isWeekend && !s.isHoliday && !s.isLeaveDay && (
                                <span className="text-xs text-muted-foreground">
                                  Wochenende
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
