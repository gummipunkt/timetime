"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Plane,
  Stethoscope,
  Clock,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { de } from "date-fns/locale";
import { LeaveType } from "@prisma/client";

interface CalendarEntry {
  userId: string;
  userName: string;
  date: string;
  type: LeaveType;
  departmentColor: string | null;
}

const leaveTypeIcons: Record<LeaveType, React.ElementType> = {
  VACATION: Plane,
  SICK: Stethoscope,
  SPECIAL: Calendar,
  UNPAID: Calendar,
  COMPENSATORY: Clock,
  PARENTAL: Calendar,
  OTHER: Calendar,
};

const leaveTypeColors: Record<LeaveType, string> = {
  VACATION: "bg-blue-500",
  SICK: "bg-red-400",
  SPECIAL: "bg-purple-500",
  UNPAID: "bg-gray-500",
  COMPENSATORY: "bg-amber-500",
  PARENTAL: "bg-pink-500",
  OTHER: "bg-gray-400",
};

export function TeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/leave/calendar?year=${year}&month=${month}`
      );
      const data = await response.json();

      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Failed to fetch calendar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Kalender-Grid erstellen
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Wochentag des ersten Tags (0 = Sonntag, 1 = Montag, ...)
  const startDay = getDay(monthStart);
  // Offset für Montag als ersten Tag der Woche
  const startOffset = startDay === 0 ? 6 : startDay - 1;

  // Entries nach Datum gruppieren
  const entriesByDate = new Map<string, CalendarEntry[]>();
  entries.forEach((entry) => {
    const key = entry.date;
    if (!entriesByDate.has(key)) {
      entriesByDate.set(key, []);
    }
    entriesByDate.get(key)!.push(entry);
  });

  // Unique users für Legende
  const uniqueUsers = Array.from(
    new Map(entries.map((e) => [e.userId, e])).values()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Team-Kalender
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Heute
          </Button>
          <div className="w-40 text-center font-medium">
            {format(currentDate, "MMMM yyyy", { locale: de })}
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
            {/* Wochentage Header */}
            <div className="grid grid-cols-7 mb-2">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Kalender Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Leere Zellen am Anfang */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Tage */}
              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDate.get(dateStr) || [];
                const isWeekendDay = isWeekend(day);
                const isTodayDay = isToday(day);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "aspect-square p-1 rounded-lg border transition-colors",
                      isWeekendDay && "bg-muted/30",
                      isTodayDay && "border-primary bg-primary/5",
                      !isWeekendDay && !isTodayDay && "border-transparent hover:border-muted"
                    )}
                  >
                    <div className="h-full flex flex-col">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isWeekendDay && "text-muted-foreground",
                          isTodayDay && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-0.5 mt-1 overflow-hidden">
                        {dayEntries.slice(0, 3).map((entry, idx) => {
                          const Icon = leaveTypeIcons[entry.type];
                          return (
                            <div
                              key={`${entry.userId}-${idx}`}
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center",
                                leaveTypeColors[entry.type]
                              )}
                              title={`${entry.userName} - ${entry.type}`}
                            >
                              <Icon className="w-2.5 h-2.5 text-white" />
                            </div>
                          );
                        })}
                        {dayEntries.length > 3 && (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium">
                            +{dayEntries.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legende */}
            {uniqueUsers.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Abwesende Mitarbeiter</h4>
                <div className="flex flex-wrap gap-3">
                  {uniqueUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          leaveTypeColors[user.type]
                        )}
                      />
                      <span>{user.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typ-Legende */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Urlaub</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span>Krankheit</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Sonderurlaub</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Ausgleich</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
