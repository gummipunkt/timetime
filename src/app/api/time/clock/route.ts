import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeService } from "@/lib/services/time.service";
import { TimeEntryType } from "@prisma/client";
import { z } from "zod";

// Validierungsschema
const clockSchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
  note: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * POST /api/time/clock
 * Erstellt einen neuen Zeiteintrag (Stempeln)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = clockSchema.parse(body);

    const entry = await TimeService.createEntry({
      userId: session.user.id,
      type: validatedData.type as TimeEntryType,
      note: validatedData.note,
      timestamp: validatedData.timestamp
        ? new Date(validatedData.timestamp)
        : undefined,
    });

    // Aktuellen Status zurückgeben
    const status = await TimeService.getCurrentStatus(session.user.id);

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        type: entry.type,
        timestamp: entry.timestamp,
        note: entry.note,
      },
      status,
    });
  } catch (error) {
    console.error("Clock error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
