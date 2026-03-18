import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { TimeCorrectionService } from "@/lib/services/time-correction.service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const rejectSchema = z.object({
  reason: z.string().min(1, "Bitte geben Sie einen Ablehnungsgrund an."),
});

/**
 * POST /api/time/corrections/[id]/reject
 * Lehnt einen Korrekturantrag ab (Supervisor/Admin)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    if (!isSupervisorOrAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    const updated = await TimeCorrectionService.rejectRequest(
      (await params).id,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: "Korrekturantrag wurde abgelehnt",
      request: {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Reject time correction error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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

