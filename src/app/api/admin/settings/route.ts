import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Settings {
  companyName: string
  companyEmail: string
  defaultRegion: string
  timezone: string
  allowSelfRegistration: boolean
  requireApprovalForOvertime: boolean
  maxOvertimeHoursPerMonth: number
  minBreakMinutes: number
  autoClockOutAfterHours: number
  emailNotifications: boolean
}

const DEFAULT_SETTINGS: Settings = {
  companyName: 'Meine Firma GmbH',
  companyEmail: 'hr@firma.de',
  defaultRegion: 'DE-BY',
  timezone: 'Europe/Berlin',
  allowSelfRegistration: false,
  requireApprovalForOvertime: true,
  maxOvertimeHoursPerMonth: 20,
  minBreakMinutes: 30,
  autoClockOutAfterHours: 10,
  emailNotifications: true,
}

/**
 * GET /api/admin/settings
 * Lädt die System-Einstellungen
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    // Load all settings from database
    const dbSettings = await prisma.systemSetting.findMany();
    
    // Convert to object
    const settingsMap: Record<string, string> = {};
    for (const s of dbSettings) {
      settingsMap[s.key] = s.value;
    }

    // Merge with defaults
    const settings: Settings = {
      companyName: settingsMap.companyName || DEFAULT_SETTINGS.companyName,
      companyEmail: settingsMap.companyEmail || DEFAULT_SETTINGS.companyEmail,
      defaultRegion: settingsMap.defaultRegion || DEFAULT_SETTINGS.defaultRegion,
      timezone: settingsMap.timezone || DEFAULT_SETTINGS.timezone,
      allowSelfRegistration: settingsMap.allowSelfRegistration === 'true',
      requireApprovalForOvertime: settingsMap.requireApprovalForOvertime !== 'false',
      maxOvertimeHoursPerMonth: parseInt(settingsMap.maxOvertimeHoursPerMonth) || DEFAULT_SETTINGS.maxOvertimeHoursPerMonth,
      minBreakMinutes: parseInt(settingsMap.minBreakMinutes) || DEFAULT_SETTINGS.minBreakMinutes,
      autoClockOutAfterHours: parseInt(settingsMap.autoClockOutAfterHours) || DEFAULT_SETTINGS.autoClockOutAfterHours,
      emailNotifications: settingsMap.emailNotifications !== 'false',
    };

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Aktualisiert die System-Einstellungen
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Prepare settings to save
    const settingsToSave: Array<{ key: string; value: string }> = [
      { key: 'companyName', value: String(body.companyName || DEFAULT_SETTINGS.companyName) },
      { key: 'companyEmail', value: String(body.companyEmail || DEFAULT_SETTINGS.companyEmail) },
      { key: 'defaultRegion', value: String(body.defaultRegion || DEFAULT_SETTINGS.defaultRegion) },
      { key: 'timezone', value: String(body.timezone || DEFAULT_SETTINGS.timezone) },
      { key: 'allowSelfRegistration', value: String(body.allowSelfRegistration ?? false) },
      { key: 'requireApprovalForOvertime', value: String(body.requireApprovalForOvertime ?? true) },
      { key: 'maxOvertimeHoursPerMonth', value: String(body.maxOvertimeHoursPerMonth ?? DEFAULT_SETTINGS.maxOvertimeHoursPerMonth) },
      { key: 'minBreakMinutes', value: String(body.minBreakMinutes ?? DEFAULT_SETTINGS.minBreakMinutes) },
      { key: 'autoClockOutAfterHours', value: String(body.autoClockOutAfterHours ?? DEFAULT_SETTINGS.autoClockOutAfterHours) },
      { key: 'emailNotifications', value: String(body.emailNotifications ?? true) },
    ];

    // Upsert each setting
    for (const setting of settingsToSave) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }

    // Return the saved settings
    const settings: Settings = {
      companyName: body.companyName || DEFAULT_SETTINGS.companyName,
      companyEmail: body.companyEmail || DEFAULT_SETTINGS.companyEmail,
      defaultRegion: body.defaultRegion || DEFAULT_SETTINGS.defaultRegion,
      timezone: body.timezone || DEFAULT_SETTINGS.timezone,
      allowSelfRegistration: body.allowSelfRegistration ?? false,
      requireApprovalForOvertime: body.requireApprovalForOvertime ?? true,
      maxOvertimeHoursPerMonth: body.maxOvertimeHoursPerMonth ?? DEFAULT_SETTINGS.maxOvertimeHoursPerMonth,
      minBreakMinutes: body.minBreakMinutes ?? DEFAULT_SETTINGS.minBreakMinutes,
      autoClockOutAfterHours: body.autoClockOutAfterHours ?? DEFAULT_SETTINGS.autoClockOutAfterHours,
      emailNotifications: body.emailNotifications ?? true,
    };

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
