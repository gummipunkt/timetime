import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

/**
 * GET /api/admin/work-models
 * Listet alle Arbeitszeitmodelle auf
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

    const models = await AdminService.listWorkTimeModels();

    return NextResponse.json({
      success: true,
      workTimeModels: models.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        weeklyMinutes: 
          m.mondayMinutes +
          m.tuesdayMinutes +
          m.wednesdayMinutes +
          m.thursdayMinutes +
          m.fridayMinutes +
          m.saturdayMinutes +
          m.sundayMinutes,
        isDefault: m.isDefault,
        userCount: m._count.users,
      })),
    });
  } catch (error) {
    console.error("List work models error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/work-models
 * Erstellt ein neues Arbeitszeitmodell
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
    const { 
      name, 
      description,
      mondayMinutes = 480,
      tuesdayMinutes = 480,
      wednesdayMinutes = 480,
      thursdayMinutes = 480,
      fridayMinutes = 480,
      saturdayMinutes = 0,
      sundayMinutes = 0,
      isDefault = false 
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    // Check if name is already taken
    const existing = await prisma.workTimeModel.findFirst({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'Ein Modell mit diesem Namen existiert bereits' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.workTimeModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const workModel = await prisma.workTimeModel.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        mondayMinutes,
        tuesdayMinutes,
        wednesdayMinutes,
        thursdayMinutes,
        fridayMinutes,
        saturdayMinutes,
        sundayMinutes,
        isDefault,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.CREATE,
        entityType: "WorkTimeModel",
        entityId: workModel.id,
        newValues: {
          name: workModel.name,
          description: workModel.description,
          mondayMinutes: workModel.mondayMinutes,
          tuesdayMinutes: workModel.tuesdayMinutes,
          wednesdayMinutes: workModel.wednesdayMinutes,
          thursdayMinutes: workModel.thursdayMinutes,
          fridayMinutes: workModel.fridayMinutes,
          saturdayMinutes: workModel.saturdayMinutes,
          sundayMinutes: workModel.sundayMinutes,
          isDefault: workModel.isDefault,
        },
        description: `Arbeitszeitmodell ${workModel.name} wurde erstellt`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        workTimeModel: workModel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create work model error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
