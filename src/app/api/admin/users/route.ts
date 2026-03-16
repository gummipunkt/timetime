import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { Role } from "@prisma/client";
import { z } from "zod";

// Validierungsschema für neuen User
const createUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  employeeNumber: z.string().optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "USER"]),
  departmentId: z.string().optional(),
  supervisorId: z.string().optional(),
  workTimeModelId: z.string().optional(),
  annualLeaveEntitlement: z.number().min(0).max(365).optional(),
  hireDate: z.string().optional(),
});

/**
 * GET /api/admin/users
 * Listet alle User auf
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
    const includeInactive = searchParams.get("includeInactive") === "true";
    const departmentId = searchParams.get("departmentId") || undefined;
    const role = searchParams.get("role") as Role | undefined;
    const search = searchParams.get("search") || undefined;

    const users = await AdminService.listUsers({
      includeInactive,
      departmentId,
      role,
      search,
    });

    return NextResponse.json({
      success: true,
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        employeeNumber: u.employeeNumber,
        role: u.role,
        isActive: u.isActive,
        department: u.department
          ? { id: u.department.id, name: u.department.name }
          : null,
        supervisor: u.supervisor
          ? {
              id: u.supervisor.id,
              name: `${u.supervisor.firstName} ${u.supervisor.lastName}`,
            }
          : null,
        delegate: u.delegate
          ? {
              id: u.delegate.id,
              name: `${u.delegate.firstName} ${u.delegate.lastName}`,
            }
          : null,
        workTimeModel: u.workTimeModel
          ? { id: u.workTimeModel.id, name: u.workTimeModel.name }
          : null,
        annualLeaveEntitlement: u.annualLeaveEntitlement,
        hireDate: u.hireDate,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Erstellt einen neuen User
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
    const validatedData = createUserSchema.parse(body);

    const user = await AdminService.createUser(
      {
        ...validatedData,
        role: validatedData.role as Role,
        hireDate: validatedData.hireDate
          ? new Date(validatedData.hireDate)
          : undefined,
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
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

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
