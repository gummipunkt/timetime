import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";

/**
 * GET /api/leave/balance
 * Holt das Urlaubskonto des aktuellen Users
 * 
 * Query params:
 * - year: Jahr (optional, default: aktuelles Jahr)
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
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const balance = await LeaveService.getBalance(session.user.id, year);

    return NextResponse.json({
      success: true,
      balance,
    });
  } catch (error) {
    console.error("Get leave balance error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
