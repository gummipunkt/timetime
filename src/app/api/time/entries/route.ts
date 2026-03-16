import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeService } from "@/lib/services/time.service";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

/**
 * GET /api/time/entries
 * Holt Zeiteinträge für einen Zeitraum
 * 
 * Query params:
 * - date: Einzelner Tag (YYYY-MM-DD)
 * - startDate: Startdatum (YYYY-MM-DD)
 * - endDate: Enddatum (YYYY-MM-DD)
 * - month: Monat (YYYY-MM)
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
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");

    let start: Date;
    let end: Date;

    if (date) {
      // Einzelner Tag
      start = startOfDay(new Date(date));
      end = endOfDay(new Date(date));
    } else if (month) {
      // Ganzer Monat
      const [year, monthNum] = month.split("-").map(Number);
      start = startOfMonth(new Date(year, monthNum - 1));
      end = endOfMonth(new Date(year, monthNum - 1));
    } else if (startDate && endDate) {
      // Zeitraum
      start = startOfDay(new Date(startDate));
      end = endOfDay(new Date(endDate));
    } else {
      // Default: Heute
      start = startOfDay(new Date());
      end = endOfDay(new Date());
    }

    const entries = await TimeService.getEntries(session.user.id, start, end);

    return NextResponse.json({
      success: true,
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp,
        note: e.note,
        isManual: e.isManual,
      })),
      period: {
        start,
        end,
      },
    });
  } catch (error) {
    console.error("Entries error:", error);

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
