import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leave/[id]/approve
 * Genehmigt einen Urlaubsantrag (Supervisor/Admin)
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

    const updatedRequest = await LeaveService.approveRequest(
      (await params).id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Antrag wurde genehmigt",
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        approvedAt: updatedRequest.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve leave request error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
