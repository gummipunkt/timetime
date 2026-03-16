import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";
import { z } from "zod";

interface RouteParams {
  params: { id: string };
}

const rejectSchema = z.object({
  reason: z.string().min(1, "Bitte geben Sie einen Ablehnungsgrund an."),
});

/**
 * POST /api/leave/[id]/reject
 * Lehnt einen Urlaubsantrag ab (Supervisor/Admin)
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

    // Prüfen ob Supervisor oder Admin
    if (!isSupervisorOrAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    const updatedRequest = await LeaveService.rejectRequest(
      params.id,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: "Antrag wurde abgelehnt",
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        rejectionReason: updatedRequest.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Reject leave request error:", error);

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
