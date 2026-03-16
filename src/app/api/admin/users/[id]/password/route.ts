import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin.service";
import { z } from "zod";

interface RouteParams {
  params: { id: string };
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

/**
 * POST /api/admin/users/[id]/password
 * Setzt das Passwort eines Users zurück
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newPassword } = resetPasswordSchema.parse(body);

    await AdminService.resetPassword(
      params.id,
      newPassword,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: "Passwort wurde zurückgesetzt",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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
