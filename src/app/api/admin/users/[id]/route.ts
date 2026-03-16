import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { Role } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: { id: string };
}

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  employeeNumber: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "SUPERVISOR", "USER"]).optional(),
  departmentId: z.string().optional().nullable(),
  supervisorId: z.string().optional().nullable(),
  delegateId: z.string().optional().nullable(),
  workTimeModelId: z.string().optional().nullable(),
  annualLeaveEntitlement: z.number().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Holt einen einzelnen User
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const user = await AdminService.getUser(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeNumber: user.employeeNumber,
        role: user.role,
        isActive: user.isActive,
        department: user.department,
        supervisor: user.supervisor,
        workTimeModel: user.workTimeModel,
        subordinates: user.subordinates,
        annualLeaveEntitlement: user.annualLeaveEntitlement,
        carryOverDays: user.carryOverDays,
        hireDate: user.hireDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Aktualisiert einen User
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await AdminService.updateUser(
      params.id,
      {
        ...validatedData,
        role: validatedData.role as Role | undefined,
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

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

/**
 * DELETE /api/admin/users/[id]
 * Deaktiviert einen User
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    await AdminService.deactivateUser(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Benutzer wurde deaktiviert",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
