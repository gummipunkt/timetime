import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";
import { LeaveType } from "@prisma/client";
import { z } from "zod";

// Validierungsschema für neuen Antrag
const createLeaveSchema = z.object({
  type: z.enum(["VACATION", "SICK", "SPECIAL", "UNPAID", "COMPENSATORY", "PARENTAL", "OTHER"]),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  isHalfDayStart: z.boolean().optional(),
  isHalfDayEnd: z.boolean().optional(),
  reason: z.string().optional(),
  documentUrl: z.string().optional(),
});

/**
 * GET /api/leave
 * Holt alle Urlaubsanträge des aktuellen Users
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const requests = await LeaveService.getUserRequests(
      session.user.id,
      year ? parseInt(year) : undefined
    );

    // Balance für aktuelles Jahr
    const balance = await LeaveService.getBalance(
      session.user.id,
      new Date().getFullYear()
    );

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        isHalfDayStart: r.isHalfDayStart,
        isHalfDayEnd: r.isHalfDayEnd,
        totalDays: r.totalDays,
        reason: r.reason,
        approver: r.approver
          ? {
              id: r.approver.id,
              name: `${r.approver.firstName} ${r.approver.lastName}`,
            }
          : null,
        approvedAt: r.approvedAt,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
      balance,
    });
  } catch (error) {
    console.error("Get leave requests error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leave
 * Erstellt einen neuen Urlaubsantrag
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
    const validatedData = createLeaveSchema.parse(body);

    const leaveRequest = await LeaveService.createRequest({
      userId: session.user.id,
      type: validatedData.type as LeaveType,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      isHalfDayStart: validatedData.isHalfDayStart,
      isHalfDayEnd: validatedData.isHalfDayEnd,
      reason: validatedData.reason,
      documentUrl: validatedData.documentUrl,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: leaveRequest.id,
        type: leaveRequest.type,
        status: leaveRequest.status,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        totalDays: leaveRequest.totalDays,
      },
    });
  } catch (error) {
    console.error("Create leave request error:", error);

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
