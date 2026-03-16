import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeService } from "@/lib/services/time.service";

/**
 * GET /api/admin/reports/monthly-timesheet
 * CSV-Export der Monatsübersicht aller aktiven Mitarbeiter
 * Query: year, month, optional departmentId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`);
    const month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`);
    const departmentId = searchParams.get("departmentId") || undefined;

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeNumber: true,
        department: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const lines: string[] = [];
    lines.push(
      [
        "Mitarbeiter",
        "Personalnummer",
        "E-Mail",
        "Abteilung",
        "Jahr",
        "Monat",
        "Gearbeitete_Minuten",
        "Soll_Minuten",
        "Delta_Minuten",
        "Gleitzeit_Saldo",
      ].join(";")
    );

    for (const user of users) {
      const summaries = await TimeService.getMonthSummaries(user.id, year, month);

      let worked = 0;
      let target = 0;
      let delta = 0;

      for (const s of summaries) {
        worked += s.workedMinutes;
        target += s.targetMinutes;
        delta += s.deltaMinutes;
      }

      const flex = await TimeService.calculateFlexBalance(user.id);

      lines.push(
        [
          `"${user.firstName} ${user.lastName}"`,
          user.employeeNumber || "",
          user.email,
          user.department?.name || "",
          year,
          month,
          worked,
          target,
          delta,
          flex,
        ].join(";")
      );
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="monthly-timesheet-${year}-${month}.csv"`,
      },
    });
  } catch (error) {
    console.error("Monthly timesheet export error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

