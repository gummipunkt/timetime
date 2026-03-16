import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";

/**
 * GET /api/leave/pending
 * Holt alle ausstehenden Anträge für Genehmigung (Supervisor/Admin)
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

    // Prüfen ob Supervisor oder Admin
    if (!isSupervisorOrAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const requests = await LeaveService.getPendingForApproval(session.user.id);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        reason: r.reason,
        user: {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`,
          email: r.user.email,
        },
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
