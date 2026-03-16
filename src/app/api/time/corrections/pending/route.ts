import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { TimeCorrectionService } from "@/lib/services/time-correction.service";

/**
 * GET /api/time/corrections/pending
 * Holt ausstehende Korrekturanträge (Supervisor/Admin)
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

    if (!isSupervisorOrAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const requests = await TimeCorrectionService.getPendingForApproval(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get pending time corrections error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

