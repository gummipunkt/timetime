import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { AuditAction } from "@prisma/client";

/**
 * GET /api/admin/audit
 * Listet Audit-Logs auf
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const performedById = searchParams.get("performedById") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { logs, total } = await AdminService.listAuditLogs({
      userId,
      performedById,
      entityType,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        user: log.user
          ? {
              id: log.user.id,
              name: `${log.user.firstName} ${log.user.lastName}`,
            }
          : null,
        performedBy: {
          id: log.performedBy.id,
          name: `${log.performedBy.firstName} ${log.performedBy.lastName}`,
        },
        oldValues: log.oldValues,
        newValues: log.newValues,
        createdAt: log.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
