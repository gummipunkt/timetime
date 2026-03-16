import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeService } from "@/lib/services/time.service";

/**
 * GET /api/time/status
 * Holt den aktuellen Zeiterfassungs-Status des Users
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

    const status = await TimeService.getCurrentStatus(session.user.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Status error:", error);

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
