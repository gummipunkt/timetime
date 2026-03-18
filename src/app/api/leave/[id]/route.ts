import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leave/[id]
 * Holt Details eines Urlaubsantrags
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const leaveRequest = await LeaveService.getRequestById(id);

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Antrag nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: leaveRequest.id,
        type: leaveRequest.type,
        status: leaveRequest.status,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        isHalfDayStart: leaveRequest.isHalfDayStart,
        isHalfDayEnd: leaveRequest.isHalfDayEnd,
        totalDays: leaveRequest.totalDays,
        reason: leaveRequest.reason,
        user: {
          id: leaveRequest.user.id,
          name: `${leaveRequest.user.firstName} ${leaveRequest.user.lastName}`,
          email: leaveRequest.user.email,
        },
        approver: leaveRequest.approver
          ? {
              id: leaveRequest.approver.id,
              name: `${leaveRequest.approver.firstName} ${leaveRequest.approver.lastName}`,
            }
          : null,
        approvedAt: leaveRequest.approvedAt,
        rejectionReason: leaveRequest.rejectionReason,
        documentUrl: leaveRequest.documentUrl,
        createdAt: leaveRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Get leave request error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leave/[id]
 * Storniert einen Urlaubsantrag
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    await LeaveService.cancelRequest((await params).id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Antrag wurde storniert",
    });
  } catch (error) {
    console.error("Cancel leave request error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
