import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeService } from "@/lib/services/time.service";
import { format } from "date-fns";

/**
 * GET /api/time/summary
 * Holt Tagesübersichten für einen Monat
 * 
 * Query params:
 * - year: Jahr (YYYY)
 * - month: Monat (1-12)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

    const summaries = await TimeService.getMonthSummaries(
      session.user.id,
      year,
      month
    );

    // Statistiken berechnen
    const stats = summaries.reduce(
      (acc, s) => {
        if (!s.isWeekend && !s.isHoliday && !s.isLeaveDay) {
          acc.totalWorkedMinutes += s.workedMinutes;
          acc.totalTargetMinutes += s.targetMinutes;
          acc.totalDelta += s.deltaMinutes;
          acc.workDays++;
        }
        if (s.isHoliday) acc.holidays++;
        if (s.isLeaveDay) acc.leaveDays++;
        return acc;
      },
      {
        totalWorkedMinutes: 0,
        totalTargetMinutes: 0,
        totalDelta: 0,
        workDays: 0,
        holidays: 0,
        leaveDays: 0,
      }
    );

    // Gleitzeit-Saldo insgesamt
    const totalFlexBalance = await TimeService.calculateFlexBalance(session.user.id);

    return NextResponse.json({
      success: true,
      year,
      month,
      summaries: summaries.map((s) => ({
        date: format(s.date, "yyyy-MM-dd"),
        workedMinutes: s.workedMinutes,
        breakMinutes: s.breakMinutes,
        targetMinutes: s.targetMinutes,
        deltaMinutes: s.deltaMinutes,
        isHoliday: s.isHoliday,
        isWeekend: s.isWeekend,
        isLeaveDay: s.isLeaveDay,
        leaveType: s.leaveType,
        firstClockIn: s.firstClockIn,
        lastClockOut: s.lastClockOut,
      })),
      stats: {
        ...stats,
        totalFlexBalance,
      },
    });
  } catch (error) {
    console.error("Summary error:", error);

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
