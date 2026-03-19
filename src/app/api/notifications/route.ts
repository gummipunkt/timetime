import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

// GET /api/notifications
// Returns latest notifications for the current user from Notification table
// (includes: new requests for supervisor, approve/reject/cancel for employee)
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
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    // Notification-Tabelle: enthält CREATE (für Supervisor), APPROVE, REJECT, UPDATE (für Mitarbeiter)
    const notifications = await (prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    let items: Array<{
      id: string;
      type: string;
      action: string;
      title: string;
      message: string;
      createdAt: Date;
      actorName?: string;
      link: string;
    }> = [];

    if (notifications.length > 0) {
      items = notifications.map((n: any) => {
        let action = "UPDATED";
        if (n.action === AuditAction.APPROVE) action = "APPROVED";
        else if (n.action === AuditAction.REJECT) action = "REJECTED";
        else if (n.action === AuditAction.CREATE) action = "CREATED";
        else if (n.action === AuditAction.UPDATE) action = "CANCELLED";

        return {
          id: n.id,
          type: n.entityType,
          action,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          // Security: never trust persisted `notification.link` as an href.
          // We derive the link solely from `entityType` (whitelist).
          link:
            n.entityType === "LEAVE_REQUEST"
              ? "/leave"
              : "/team/time-corrections",
        };
      });
    } else {
      // Fallback: AuditLog (wenn Notification-Tabelle leer)
      const logs = await prisma.auditLog.findMany({
        where: {
          userId: session.user.id,
          entityType: { in: ["LEAVE_REQUEST", "TIME_CORRECTION"] },
          action: { in: [AuditAction.APPROVE, AuditAction.REJECT, AuditAction.UPDATE] },
        },
        include: {
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      items = logs.map((log) => {
        const isLeave = log.entityType === "LEAVE_REQUEST";
        let action = "UPDATED";
        if (log.action === AuditAction.APPROVE) action = "APPROVED";
        else if (log.action === AuditAction.REJECT) action = "REJECTED";
        else if (log.action === AuditAction.UPDATE) action = "CANCELLED";

        const baseTitle = isLeave ? "Urlaubsantrag" : "Zeitkorrektur";
        let title = baseTitle;
        if (action === "APPROVED") title += " genehmigt";
        else if (action === "REJECTED") title += " abgelehnt";
        else if (action === "CANCELLED") title += " storniert";

        const actorName = `${log.performedBy.firstName} ${log.performedBy.lastName}`;
        const message =
          log.description ||
          (isLeave
            ? `Ihr Urlaubsantrag wurde von ${actorName} ${action === "APPROVED" ? "genehmigt" : action === "REJECTED" ? "abgelehnt" : "aktualisiert"}.`
            : `Ihr Zeitkorrekturantrag wurde von ${actorName} ${action === "APPROVED" ? "genehmigt" : action === "REJECTED" ? "abgelehnt" : "aktualisiert"}.`);

        return {
          id: log.id,
          type: log.entityType,
          action,
          title,
          message,
          createdAt: log.createdAt,
          actorName,
          link: isLeave ? "/leave" : "/team/time-corrections",
        };
      });
    }

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
