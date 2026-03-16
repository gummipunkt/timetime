import { prisma } from "@/lib/prisma";
import { TimeEntryType, LeaveType, LeaveStatus } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isWeekend,
  format,
  differenceInMinutes,
  parseISO,
} from "date-fns";

// ============================================
// TYPES
// ============================================

export interface TimeEntryInput {
  userId: string;
  type: TimeEntryType;
  timestamp?: Date;
  note?: string;
  isManual?: boolean;
  correctedById?: string;
  correctionNote?: string;
}

export interface CurrentStatus {
  isWorking: boolean;
  isOnBreak: boolean;
  todayWorkedMinutes: number;
  todayBreakMinutes: number;
  todayTargetMinutes: number;
  todayDelta: number;
  totalFlexBalance: number;
  requiredBreakMinutes: number;
  remainingBreakMinutes: number;
  lastEntry: {
    id: string;
    type: TimeEntryType;
    timestamp: Date;
  } | null;
  entries: Array<{
    id: string;
    type: TimeEntryType;
    timestamp: Date;
    note: string | null;
  }>;
}

export interface DailySummary {
  date: Date;
  workedMinutes: number;
  breakMinutes: number;
  targetMinutes: number;
  deltaMinutes: number;
  isHoliday: boolean;
  isWeekend: boolean;
  isLeaveDay: boolean;
  leaveType: LeaveType | null;
  entries: Array<{
    id: string;
    type: TimeEntryType;
    timestamp: Date;
  }>;
}

// ============================================
// TIME SERVICE
// ============================================

export class TimeService {
  /**
   * Erstellt einen neuen Zeiteintrag
   */
  static async createEntry(input: TimeEntryInput) {
    const timestamp = input.timestamp || new Date();

    // Validierung: Prüfen ob der Eintrag logisch ist
    await this.validateEntry(input.userId, input.type, timestamp);

    const entry = await prisma.timeEntry.create({
      data: {
        userId: input.userId,
        type: input.type,
        timestamp,
        note: input.note,
        isManual: input.isManual || false,
        correctedById: input.correctedById,
        correctionNote: input.correctionNote,
      },
    });

    // Tagesübersicht aktualisieren
    await this.updateDailySummary(input.userId, timestamp);

    return entry;
  }

  /**
   * Validiert ob ein Zeiteintrag erstellt werden kann
   */
  private static async validateEntry(
    userId: string,
    type: TimeEntryType,
    timestamp: Date
  ) {
    const todayStart = startOfDay(timestamp);
    const todayEnd = endOfDay(timestamp);

    // Letzte Einträge heute holen
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        timestamp: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const lastEntry = todayEntries[0];

    // Validierungsregeln
    switch (type) {
      case TimeEntryType.CLOCK_IN:
        if (lastEntry && lastEntry.type !== TimeEntryType.CLOCK_OUT) {
          throw new Error(
            "Sie müssen zuerst ausstempeln, bevor Sie sich erneut einstempeln können."
          );
        }
        break;

      case TimeEntryType.CLOCK_OUT:
        if (!lastEntry || lastEntry.type === TimeEntryType.CLOCK_OUT) {
          throw new Error(
            "Sie müssen zuerst eingestempelt sein, um auszustempeln."
          );
        }
        if (lastEntry.type === TimeEntryType.BREAK_START) {
          throw new Error(
            "Bitte beenden Sie zuerst Ihre Pause, bevor Sie ausstempeln."
          );
        }
        break;

      case TimeEntryType.BREAK_START:
        if (!lastEntry || lastEntry.type !== TimeEntryType.CLOCK_IN && lastEntry.type !== TimeEntryType.BREAK_END) {
          throw new Error(
            "Sie können nur eine Pause starten, wenn Sie arbeiten."
          );
        }
        break;

      case TimeEntryType.BREAK_END:
        if (!lastEntry || lastEntry.type !== TimeEntryType.BREAK_START) {
          throw new Error(
            "Sie sind aktuell nicht in einer Pause."
          );
        }
        break;
    }
  }

  /**
   * Holt den aktuellen Status eines Users
   */
  static async getCurrentStatus(userId: string): Promise<CurrentStatus> {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Heutige Einträge
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        timestamp: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Arbeitszeit berechnen
    const { workedMinutes, breakMinutes } = this.calculateWorkTime(todayEntries);

    // Soll-Arbeitszeit für heute
    const targetMinutes = await this.getTargetMinutes(userId, today);

    // Gleitzeit-Saldo berechnen
    const totalFlexBalance = await this.calculateFlexBalance(userId);

    // Pflichtpause berechnen (gesetzlich: 30 Min bei >6h, 45 Min bei >9h)
    // Holen aus Arbeitszeitmodell oder Default
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workTimeModel: true },
    });
    
    let requiredBreakMinutes = 0;
    const breakMinutesFromModel = user?.workTimeModel?.breakMinutesPerDay || 30;
    
    // Gesetzliche Regelung: Nach 6h Arbeit mindestens 30 Min Pause
    if (workedMinutes > 360) { // > 6 Stunden
      requiredBreakMinutes = Math.max(breakMinutesFromModel, 30);
    }
    if (workedMinutes > 540) { // > 9 Stunden
      requiredBreakMinutes = Math.max(breakMinutesFromModel, 45);
    }
    
    const remainingBreakMinutes = Math.max(0, requiredBreakMinutes - breakMinutes);

    // Status bestimmen
    const lastEntry = todayEntries[todayEntries.length - 1] || null;
    const isWorking =
      lastEntry?.type === TimeEntryType.CLOCK_IN ||
      lastEntry?.type === TimeEntryType.BREAK_END;
    const isOnBreak = lastEntry?.type === TimeEntryType.BREAK_START;

    return {
      isWorking,
      isOnBreak,
      todayWorkedMinutes: workedMinutes,
      todayBreakMinutes: breakMinutes,
      todayTargetMinutes: targetMinutes,
      todayDelta: workedMinutes - targetMinutes,
      totalFlexBalance,
      requiredBreakMinutes,
      remainingBreakMinutes,
      lastEntry: lastEntry
        ? {
            id: lastEntry.id,
            type: lastEntry.type,
            timestamp: lastEntry.timestamp,
          }
        : null,
      entries: todayEntries.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp,
        note: e.note,
      })),
    };
  }

  /**
   * Berechnet Arbeits- und Pausenzeit aus Einträgen
   */
  static calculateWorkTime(entries: Array<{ type: TimeEntryType; timestamp: Date }>) {
    let workedMinutes = 0;
    let breakMinutes = 0;
    let workStartTime: Date | null = null;
    let breakStartTime: Date | null = null;

    for (const entry of entries) {
      switch (entry.type) {
        case TimeEntryType.CLOCK_IN:
          workStartTime = entry.timestamp;
          break;

        case TimeEntryType.CLOCK_OUT:
          if (workStartTime) {
            workedMinutes += differenceInMinutes(entry.timestamp, workStartTime);
            workStartTime = null;
          }
          break;

        case TimeEntryType.BREAK_START:
          breakStartTime = entry.timestamp;
          // Arbeitszeit bis Pausenbeginn
          if (workStartTime) {
            workedMinutes += differenceInMinutes(entry.timestamp, workStartTime);
            workStartTime = null;
          }
          break;

        case TimeEntryType.BREAK_END:
          if (breakStartTime) {
            breakMinutes += differenceInMinutes(entry.timestamp, breakStartTime);
            breakStartTime = null;
          }
          // Arbeit beginnt wieder
          workStartTime = entry.timestamp;
          break;
      }
    }

    // Falls noch eingestempelt (ohne Ausstempeln)
    if (workStartTime) {
      workedMinutes += differenceInMinutes(new Date(), workStartTime);
    }

    // Falls noch in Pause
    if (breakStartTime) {
      breakMinutes += differenceInMinutes(new Date(), breakStartTime);
    }

    return { workedMinutes, breakMinutes };
  }

  /**
   * Holt die Soll-Arbeitszeit für einen Tag
   */
  static async getTargetMinutes(userId: string, date: Date): Promise<number> {
    // Prüfen ob Wochenende
    if (isWeekend(date)) {
      return 0;
    }

    // Prüfen ob Feiertag
    const isHoliday = await this.isHoliday(userId, date);
    if (isHoliday) {
      return 0;
    }

    // Prüfen ob Urlaubstag
    const isLeaveDay = await this.isLeaveDay(userId, date);
    if (isLeaveDay) {
      return 0;
    }

    // Arbeitszeitmodell des Users holen
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workTimeModel: true },
    });

    if (!user?.workTimeModel) {
      // Fallback: Standard 8 Stunden
      return 480;
    }

    const dayOfWeek = date.getDay();
    const model = user.workTimeModel;

    switch (dayOfWeek) {
      case 0: return model.sundayMinutes;
      case 1: return model.mondayMinutes;
      case 2: return model.tuesdayMinutes;
      case 3: return model.wednesdayMinutes;
      case 4: return model.thursdayMinutes;
      case 5: return model.fridayMinutes;
      case 6: return model.saturdayMinutes;
      default: return 480;
    }
  }

  /**
   * Prüft ob ein Tag ein Feiertag ist
   */
  static async isHoliday(userId: string, date: Date): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    // Standard-Region holen
    const regionSetting = await prisma.systemSetting.findUnique({
      where: { key: "default_region" },
    });
    const region = regionSetting?.value || "DE-BY";

    const dateOnly = startOfDay(date);

    const holiday = await prisma.holiday.findFirst({
      where: {
        date: dateOnly,
        OR: [
          { region: "ALL" },
          { region: region },
        ],
      },
    });

    return !!holiday;
  }

  /**
   * Prüft ob ein Tag ein Urlaubstag ist
   */
  static async isLeaveDay(userId: string, date: Date): Promise<boolean> {
    const dateOnly = startOfDay(date);

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: LeaveStatus.APPROVED,
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
      },
    });

    return !!leave;
  }

  /**
   * Berechnet das gesamte Gleitzeit-Saldo
   */
  static async calculateFlexBalance(userId: string): Promise<number> {
    // Alle Tagesübersichten des Users holen
    const summaries = await prisma.dailyWorkSummary.findMany({
      where: { userId },
    });

    // Delta-Minuten summieren
    return summaries.reduce((total, summary) => total + summary.deltaMinutes, 0);
  }

  /**
   * Aktualisiert oder erstellt die Tagesübersicht
   */
  static async updateDailySummary(userId: string, date: Date) {
    const dateOnly = startOfDay(date);
    const dateEnd = endOfDay(date);

    // Alle Einträge des Tages holen
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        timestamp: {
          gte: dateOnly,
          lte: dateEnd,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Arbeitszeit berechnen
    const { workedMinutes, breakMinutes } = this.calculateWorkTime(entries);

    // Soll-Zeit berechnen
    const targetMinutes = await this.getTargetMinutes(userId, date);

    // Status-Flags
    const isWeekendDay = isWeekend(date);
    const isHolidayDay = await this.isHoliday(userId, date);
    const leaveDayInfo = await this.getLeaveInfo(userId, date);

    // Erster und letzter Stempel
    const clockIns = entries.filter((e) => e.type === TimeEntryType.CLOCK_IN);
    const clockOuts = entries.filter((e) => e.type === TimeEntryType.CLOCK_OUT);

    await prisma.dailyWorkSummary.upsert({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
      update: {
        workedMinutes,
        breakMinutes,
        targetMinutes,
        deltaMinutes: workedMinutes - targetMinutes,
        isHoliday: isHolidayDay,
        isWeekend: isWeekendDay,
        isLeaveDay: leaveDayInfo.isLeaveDay,
        leaveType: leaveDayInfo.leaveType,
        firstClockIn: clockIns[0]?.timestamp || null,
        lastClockOut: clockOuts[clockOuts.length - 1]?.timestamp || null,
      },
      create: {
        userId,
        date: dateOnly,
        workedMinutes,
        breakMinutes,
        targetMinutes,
        deltaMinutes: workedMinutes - targetMinutes,
        isHoliday: isHolidayDay,
        isWeekend: isWeekendDay,
        isLeaveDay: leaveDayInfo.isLeaveDay,
        leaveType: leaveDayInfo.leaveType,
        firstClockIn: clockIns[0]?.timestamp || null,
        lastClockOut: clockOuts[clockOuts.length - 1]?.timestamp || null,
      },
    });
  }

  /**
   * Holt Urlaubs-Info für einen Tag
   */
  private static async getLeaveInfo(userId: string, date: Date) {
    const dateOnly = startOfDay(date);

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: LeaveStatus.APPROVED,
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
      },
    });

    return {
      isLeaveDay: !!leave,
      leaveType: leave?.type || null,
    };
  }

  /**
   * Holt Einträge für einen Zeitraum
   */
  static async getEntries(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.timeEntry.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  /**
   * Holt Tagesübersichten für einen Monat
   */
  static async getMonthSummaries(userId: string, year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const summaries = await prisma.dailyWorkSummary.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Fehlende Tage auffüllen
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const summaryMap = new Map(
      summaries.map((s) => [format(s.date, "yyyy-MM-dd"), s])
    );

    return Promise.all(
      allDays.map(async (day) => {
        const key = format(day, "yyyy-MM-dd");
        const existing = summaryMap.get(key);

        if (existing) {
          return existing;
        }

        // Virtuelle Übersicht für Tage ohne Einträge
        const targetMinutes = await this.getTargetMinutes(userId, day);
        const isHolidayDay = await this.isHoliday(userId, day);
        const leaveDayInfo = await this.getLeaveInfo(userId, day);

        return {
          id: `virtual-${key}`,
          userId,
          date: day,
          workedMinutes: 0,
          breakMinutes: 0,
          targetMinutes,
          deltaMinutes: -targetMinutes,
          isHoliday: isHolidayDay,
          isWeekend: isWeekend(day),
          isLeaveDay: leaveDayInfo.isLeaveDay,
          leaveType: leaveDayInfo.leaveType,
          firstClockIn: null,
          lastClockOut: null,
        };
      })
    );
  }

  /**
   * Korrigiert einen Zeiteintrag (Admin-Funktion)
   */
  static async correctEntry(
    entryId: string,
    newTimestamp: Date,
    correctedById: string,
    correctionNote: string
  ) {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new Error("Zeiteintrag nicht gefunden");
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        timestamp: newTimestamp,
        isManual: true,
        correctedById,
        correctionNote,
        originalTimestamp: entry.timestamp,
      },
    });

    // Tagesübersicht aktualisieren
    await this.updateDailySummary(entry.userId, entry.timestamp);
    if (format(entry.timestamp, "yyyy-MM-dd") !== format(newTimestamp, "yyyy-MM-dd")) {
      await this.updateDailySummary(entry.userId, newTimestamp);
    }

    return updated;
  }

  /**
   * Löscht einen Zeiteintrag (Admin-Funktion)
   */
  static async deleteEntry(entryId: string, deletedById: string) {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new Error("Zeiteintrag nicht gefunden");
    }

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    // Tagesübersicht aktualisieren
    await this.updateDailySummary(entry.userId, entry.timestamp);

    return entry;
  }
}
