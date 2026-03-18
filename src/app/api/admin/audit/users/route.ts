import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/audit/users
 * Minimale User-Liste für Audit-Filter (id + Name)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isSupervisorOrAdmin(session.user.role)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const where: any = { isActive: true };

    // Supervisor: auf eigenes Team einschränken (plus er selbst)
    if (session.user.role === "SUPERVISOR") {
      where.OR = [
        { id: session.user.id },
        { supervisorId: session.user.id },
        { delegateId: session.user.id },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
      })),
    });
  } catch (error) {
    console.error("List audit users error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 });
  }
}

