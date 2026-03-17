import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

// GET /api/notifications
// Returns latest notifications for the current user derived from AuditLog
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
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const since = searchParams.get("since");

    const where: any = {
      userId: session.user.id,
      entityType: { in: ["LEAVE_REQUEST", "TIME_CORRECTION"] },
      action: { in: [AuditAction.APPROVE, AuditAction.REJECT, AuditAction.UPDATE] },
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const items = logs.map((log) => {
      const isLeave = log.entityType === "LEAVE_REQUEST";
      const isTimeCorrection = log.entityType === "TIME_CORRECTION";

      let action: "APPROVED" | "REJECTED" | "CANCELLED" | "UPDATED" = "UPDATED";
      if (log.action === AuditAction.APPROVE) action = "APPROVED";
      else if (log.action === AuditAction.REJECT) action = "REJECTED";
      else if (log.action === AuditAction.UPDATE) action = "CANCELLED";

      const baseTitle = isLeave
        ? "Urlaubsantrag"
        : isTimeCorrection
        ? "Zeitkorrektur"
        : log.entityType;

      let title = baseTitle;
      if (action === "APPROVED") title += " genehmigt";
      else if (action === "REJECTED") title += " abgelehnt";
      else if (action === "CANCELLED") title += " storniert";

      const actorName = `${log.performedBy.firstName} ${log.performedBy.lastName}`;
      const message =
        log.description ||
        (isLeave
          ? `Ihr Urlaubsantrag wurde von ${actorName} ${action === "APPROVED" ? "genehmigt" : action === "REJECTED" ? "abgelehnt" : "aktualisiert"}.`
          : isTimeCorrection
          ? `Ihr Zeitkorrekturantrag wurde von ${actorName} ${action === "APPROVED" ? "genehmigt" : action === "REJECTED" ? "abgelehnt" : "aktualisiert"}.`
          : "");

      const link = isLeave ? "/leave" : isTimeCorrection ? "/team/time-corrections" : "/";

      return {
        id: log.id,
        type: log.entityType,
        action,
        title,
        message,
        createdAt: log.createdAt,
        actorName,
        link,
      };
    });

    return NextResponse.json({
      success: true,
      notifications: items,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

