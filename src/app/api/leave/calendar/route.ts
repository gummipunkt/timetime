import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";
import { startOfMonth, endOfMonth, format } from "date-fns";

/**
 * GET /api/leave/calendar
 * Holt Team-Kalender-Daten
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

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const entries = await LeaveService.getTeamCalendar(
      session.user.id,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      year,
      month,
      entries: entries.map((e) => ({
        userId: e.userId,
        userName: e.userName,
        date: format(e.date, "yyyy-MM-dd"),
        type: e.type,
        departmentColor: e.departmentColor,
      })),
    });
  } catch (error) {
    console.error("Get team calendar error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
