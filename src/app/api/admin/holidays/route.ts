import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

/**
 * GET /api/admin/holidays
 * Listet alle Feiertage auf
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') 
      ? parseInt(searchParams.get('year')!) 
      : new Date().getFullYear();

    const holidays = await prisma.holiday.findMany({
      where: { year },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({
      success: true,
      holidays: holidays.map(h => ({
        id: h.id,
        name: h.name,
        date: h.date,
        year: h.year,
        region: h.region,
        isRecurring: h.isRecurring,
        isHalfDay: h.isHalfDay,
      })),
    });
  } catch (error) {
    console.error("List holidays error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/holidays
 * Erstellt einen neuen Feiertag
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, date, region = 'ALL', isRecurring = false, isHalfDay = false } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Datum ist erforderlich' }, { status: 400 });
    }

    const holidayDate = new Date(date);
    const year = holidayDate.getFullYear();

    // Check for duplicate
    const existing = await prisma.holiday.findFirst({
      where: {
        date: holidayDate,
        region: region,
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'An diesem Datum existiert bereits ein Feiertag für diese Region' 
      }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: name.trim(),
        date: holidayDate,
        year,
        region,
        isRecurring,
        isHalfDay,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.CREATE,
        entityType: "Holiday",
        entityId: holiday.id,
        newValues: {
          name: holiday.name,
          date: holiday.date,
          year: holiday.year,
          region: holiday.region,
          isRecurring: holiday.isRecurring,
          isHalfDay: holiday.isHalfDay,
        },
        description: `Feiertag ${holiday.name} wurde erstellt`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        holiday,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create holiday error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
