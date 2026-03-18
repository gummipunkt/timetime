import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { TimeCorrectionService } from "@/lib/services/time-correction.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/time/corrections/[id]/approve
 * Genehmigt einen Korrekturantrag (Supervisor/Admin)
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

    const updated = await TimeCorrectionService.approveRequest(
      (await params).id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Korrekturantrag wurde genehmigt",
      request: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve time correction error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

