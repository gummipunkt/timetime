import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

/**
 * GET /api/admin/departments
 * Listet alle Abteilungen auf
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

    const departments = await AdminService.listDepartments();

    return NextResponse.json({
      success: true,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        color: d.color,
        head: d.head
          ? {
              id: d.head.id,
              name: `${d.head.firstName} ${d.head.lastName}`,
            }
          : null,
        memberCount: d._count.members,
      })),
    });
  } catch (error) {
    console.error("List departments error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/departments
 * Erstellt eine neue Abteilung
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    // Check if name is already taken
    const existing = await prisma.department.findFirst({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'Eine Abteilung mit diesem Namen existiert bereits' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.CREATE,
        entityType: "Department",
        entityId: department.id,
        newValues: { name: department.name, description: department.description, color: department.color },
        description: `Abteilung ${department.name} wurde erstellt`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        department: {
          id: department.id,
          name: department.name,
          description: department.description,
          color: department.color,
          memberCount: department._count.members,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
