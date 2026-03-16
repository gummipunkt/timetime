import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { TimeCorrectionService } from "@/lib/services/time-correction.service";
import { TimeEntryType } from "@prisma/client";
import { z } from "zod";

const createCorrectionSchema = z.object({
  timeEntryId: z.string().optional(),
  requestedType: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
  requestedTimestamp: z.string().datetime(),
  requestedNote: z.string().optional(),
  reason: z.string().min(1, "Bitte geben Sie eine Begründung an."),
});

/**
 * GET /api/time/corrections
 * Holt Korrekturanträge des aktuellen Users
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

    const requests = await TimeCorrectionService.getUserRequests(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get time corrections error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/time/corrections
 * Legt einen neuen Korrekturantrag an (Mitarbeiter)
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
    const validated = createCorrectionSchema.parse(body);

    const created = await TimeCorrectionService.createRequest({
      userId: session.user.id,
      timeEntryId: validated.timeEntryId,
      requestedType: validated.requestedType as TimeEntryType,
      requestedTimestamp: new Date(validated.requestedTimestamp),
      requestedNote: validated.requestedNote,
      reason: validated.reason,
    });

    return NextResponse.json({
      success: true,
      request: created,
    });
  } catch (error) {
    console.error("Create time correction error:", error);

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

