import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus, Role, AuditAction } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isWeekend,
  differenceInDays,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { TimeService } from "./time.service";
import { AdminService } from "./admin.service";

// ============================================
// TYPES
// ============================================

export interface LeaveRequestInput {
  userId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  reason?: string;
  documentUrl?: string;
}

export interface LeaveRequestWithUser {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string | null;
  };
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  totalDays: number;
  reason: string | null;
  approverId: string | null;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  documentUrl: string | null;
  createdAt: Date;
}

export interface LeaveBalance {
  year: number;
  entitlement: number;
  carryOver: number;
  used: number;
  pending: number;
  remaining: number;
}

// ============================================
// LEAVE SERVICE
// ============================================

export class LeaveService {
  /**
   * Erstellt einen neuen Urlaubsantrag
   */
  static async createRequest(input: LeaveRequestInput) {
    // Validierung
    await this.validateRequest(input);

    // Arbeitstage berechnen (ohne Wochenenden und Feiertage)
    const totalDays = await this.calculateLeaveDays(
      input.userId,
      input.startDate,
      input.endDate,
      input.isHalfDayStart,
      input.isHalfDayEnd
    );

    // Prüfen ob genug Urlaubstage vorhanden
    const balance = await this.getBalance(input.userId, input.startDate.getFullYear());
    
    if (input.type === LeaveType.VACATION && totalDays > balance.remaining) {
      throw new Error(
        `Nicht genügend Urlaubstage verfügbar. Verfügbar: ${balance.remaining}, Beantragt: ${totalDays}`
      );
    }

    // Antrag erstellen
    const request = await prisma.leaveRequest.create({
      data: {
        userId: input.userId,
        type: input.type,
        status: LeaveStatus.PENDING,
        startDate: startOfDay(input.startDate),
        endDate: startOfDay(input.endDate),
        isHalfDayStart: input.isHalfDayStart || false,
        isHalfDayEnd: input.isHalfDayEnd || false,
        totalDays,
        reason: input.reason,
        documentUrl: input.documentUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    // Pending-Tage im Balance aktualisieren
    if (input.type === LeaveType.VACATION) {
      await this.updateBalance(input.userId, input.startDate.getFullYear());
    }

    return request;
  }

  /**
   * Validiert einen Urlaubsantrag
   */
  private static async validateRequest(input: LeaveRequestInput) {
    // Startdatum muss vor oder gleich Enddatum sein
    if (input.startDate > input.endDate) {
      throw new Error("Startdatum muss vor dem Enddatum liegen.");
    }

    // Nicht in der Vergangenheit (außer bei Krankheit)
    if (input.type !== LeaveType.SICK && startOfDay(input.startDate) < startOfDay(new Date())) {
      throw new Error("Urlaubsanträge können nicht in der Vergangenheit liegen.");
    }

    // Prüfen auf überlappende Anträge
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId: input.userId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: input.endDate },
            endDate: { gte: input.startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error(
        "Es existiert bereits ein Antrag für diesen Zeitraum."
      );
    }
  }

  /**
   * Berechnet die Anzahl der Urlaubstage (ohne Wochenenden/Feiertage)
   */
  static async calculateLeaveDays(
    userId: string,
    startDate: Date,
    endDate: Date,
    isHalfDayStart = false,
    isHalfDayEnd = false
  ): Promise<number> {
    const days = eachDayOfInterval({
      start: startOfDay(startDate),
      end: startOfDay(endDate),
    });

    let count = 0;

    for (const day of days) {
      // Wochenenden überspringen
      if (isWeekend(day)) continue;

      // Feiertage überspringen
      const isHoliday = await TimeService.isHoliday(userId, day);
      if (isHoliday) continue;

      count++;
    }

    // Halbe Tage berücksichtigen
    if (isHalfDayStart && count > 0) count -= 0.5;
    if (isHalfDayEnd && count > 0) count -= 0.5;

    return Math.max(0, count);
  }

  /**
   * Genehmigt einen Urlaubsantrag
   */
  static async approveRequest(
    requestId: string,
    approverId: string
  ) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error("Antrag nicht gefunden.");
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error("Dieser Antrag kann nicht mehr genehmigt werden.");
    }

    // Prüfen ob der Approver berechtigt ist
    await this.checkApprovalPermission(approverId, request.userId);

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.APPROVED,
        approverId,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Balance aktualisieren
    await this.updateBalance(request.userId, request.startDate.getFullYear());

    // Audit log entry
    await AdminService.createAuditLog({
      userId: request.userId,
      performedById: approverId,
      action: AuditAction.APPROVE,
      entityType: "LEAVE_REQUEST",
      entityId: request.id,
      oldValues: { status: request.status },
      newValues: { status: updated.status },
      description: `Leave request ${request.id} approved`,
    });

    // Persistent notification (optional)
    await (prisma as any).notification.create({
      data: {
        userId: request.userId,
        entityType: "LEAVE_REQUEST",
        entityId: request.id,
        type: "LEAVE_REQUEST",
        action: AuditAction.APPROVE,
        title: "Urlaubsantrag genehmigt",
        message: `Ihr Urlaubsantrag wurde von Ihrem Vorgesetzten genehmigt.`,
        link: "/leave",
      },
    });

    return updated;
  }

  /**
   * Lehnt einen Urlaubsantrag ab
   */
  static async rejectRequest(
    requestId: string,
    approverId: string,
    rejectionReason: string
  ) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Antrag nicht gefunden.");
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error("Dieser Antrag kann nicht mehr abgelehnt werden.");
    }

    // Prüfen ob der Approver berechtigt ist
    await this.checkApprovalPermission(approverId, request.userId);

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.REJECTED,
        approverId,
        approvedAt: new Date(),
        rejectionReason,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Balance aktualisieren (pending wieder freigeben)
    await this.updateBalance(request.userId, request.startDate.getFullYear());

    // Audit log entry
    await AdminService.createAuditLog({
      userId: request.userId,
      performedById: approverId,
      action: AuditAction.REJECT,
      entityType: "LEAVE_REQUEST",
      entityId: request.id,
      oldValues: { status: request.status },
      newValues: { status: updated.status },
      description: `Leave request ${request.id} rejected: ${rejectionReason}`,
    });

    // Persistent notification (optional)
    await (prisma as any).notification.create({
      data: {
        userId: request.userId,
        entityType: "LEAVE_REQUEST",
        entityId: request.id,
        type: "LEAVE_REQUEST",
        action: AuditAction.REJECT,
        title: "Urlaubsantrag abgelehnt",
        message: `Ihr Urlaubsantrag wurde abgelehnt: ${rejectionReason}`,
        link: "/leave",
      },
    });

    return updated;
  }

  /**
   * Storniert einen Urlaubsantrag (durch den User selbst)
   */
  static async cancelRequest(requestId: string, userId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Antrag nicht gefunden.");
    }

    if (request.userId !== userId) {
      throw new Error("Sie können nur eigene Anträge stornieren.");
    }

    if (request.status === LeaveStatus.CANCELLED) {
      throw new Error("Dieser Antrag wurde bereits storniert.");
    }

    // Prüfen ob der Urlaub bereits begonnen hat
    if (
      request.status === LeaveStatus.APPROVED &&
      startOfDay(request.startDate) <= startOfDay(new Date())
    ) {
      throw new Error(
        "Bereits begonnener Urlaub kann nicht storniert werden."
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.CANCELLED,
      },
    });

    // Balance aktualisieren
    await this.updateBalance(request.userId, request.startDate.getFullYear());

    // Audit log entry (user-initiated cancel)
    await AdminService.createAuditLog({
      userId: request.userId,
      performedById: userId,
      action: AuditAction.UPDATE,
      entityType: "LEAVE_REQUEST",
      entityId: request.id,
      oldValues: { status: request.status },
      newValues: { status: updated.status },
      description: `Leave request ${request.id} cancelled by user`,
    });

    // Persistent notification (optional)
    await (prisma as any).notification.create({
      data: {
        userId: request.userId,
        entityType: "LEAVE_REQUEST",
        entityId: request.id,
        type: "LEAVE_REQUEST",
        action: AuditAction.UPDATE,
        title: "Urlaubsantrag storniert",
        message: `Ihr Urlaubsantrag wurde storniert.`,
        link: "/leave",
      },
    });

    return updated;
  }

  /**
   * Prüft ob ein User einen anderen User genehmigen darf
   */
  private static async checkApprovalPermission(
    approverId: string,
    userId: string
  ) {
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      throw new Error("Genehmiger nicht gefunden.");
    }

    // Admin darf alles genehmigen
    if (approver.role === Role.ADMIN) {
      return true;
    }

    // Supervisor darf nur seine Teammitglieder oder delegierte Mitarbeiter genehmigen
    if (approver.role === Role.SUPERVISOR) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      const u = user as any;
      if (u?.supervisorId === approverId || u?.delegateId === approverId) {
        return true;
      }
    }

    throw new Error(
      "Sie sind nicht berechtigt, diesen Antrag zu genehmigen."
    );
  }

  /**
   * Holt alle Anträge eines Users
   */
  static async getUserRequests(
    userId: string,
    year?: number
  ): Promise<LeaveRequestWithUser[]> {
    const whereClause: any = { userId };

    if (year) {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));
      whereClause.OR = [
        { startDate: { gte: yearStart, lte: yearEnd } },
        { endDate: { gte: yearStart, lte: yearEnd } },
      ];
    }

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return requests;
  }

  /**
   * Holt alle ausstehenden Anträge für einen Supervisor
   */
  static async getPendingForApproval(
    approverId: string
  ): Promise<LeaveRequestWithUser[]> {
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      return [];
    }

    let whereClause: any = {
      status: LeaveStatus.PENDING,
    };

    // Admin sieht alle
    if (approver.role === Role.ADMIN) {
      // Keine weitere Einschränkung
    }
    // Supervisor sieht nur seine Teammitglieder
    else if (approver.role === Role.SUPERVISOR) {
      whereClause.user = {
        supervisorId: approverId,
      };
    } else {
      return [];
    }

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return requests;
  }

  /**
   * Holt das Urlaubskonto eines Users
   */
  static async getBalance(userId: string, year: number): Promise<LeaveBalance> {
    // Bestehenden Balance-Eintrag suchen oder erstellen
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_year: { userId, year },
      },
    });

    if (!balance) {
      // User-Daten für Berechnung holen
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          annualLeaveEntitlement: true,
          carryOverDays: true,
        },
      });

      if (!user) {
        throw new Error("User nicht gefunden.");
      }

      // Neuen Balance-Eintrag erstellen
      balance = await prisma.leaveBalance.create({
        data: {
          userId,
          year,
          entitlement: user.annualLeaveEntitlement,
          carryOver: year === new Date().getFullYear() ? user.carryOverDays : 0,
          used: 0,
          pending: 0,
          remaining: user.annualLeaveEntitlement + (year === new Date().getFullYear() ? user.carryOverDays : 0),
        },
      });
    }

    return {
      year: balance.year,
      entitlement: balance.entitlement,
      carryOver: balance.carryOver,
      used: balance.used,
      pending: balance.pending,
      remaining: balance.remaining,
    };
  }

  /**
   * Aktualisiert das Urlaubskonto basierend auf Anträgen
   */
  static async updateBalance(userId: string, year: number) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Genehmigte Urlaube zählen
    const approvedRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        type: LeaveType.VACATION,
        status: LeaveStatus.APPROVED,
        startDate: { gte: yearStart, lte: yearEnd },
      },
    });

    const usedDays = approvedRequests.reduce((sum, r) => sum + r.totalDays, 0);

    // Ausstehende Anträge zählen
    const pendingRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        type: LeaveType.VACATION,
        status: LeaveStatus.PENDING,
        startDate: { gte: yearStart, lte: yearEnd },
      },
    });

    const pendingDays = pendingRequests.reduce((sum, r) => sum + r.totalDays, 0);

    // Balance aktualisieren
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        annualLeaveEntitlement: true,
        carryOverDays: true,
      },
    });

    if (!user) return;

    const entitlement = user.annualLeaveEntitlement;
    const carryOver = year === new Date().getFullYear() ? user.carryOverDays : 0;
    const remaining = entitlement + carryOver - usedDays - pendingDays;

    await prisma.leaveBalance.upsert({
      where: {
        userId_year: { userId, year },
      },
      update: {
        used: usedDays,
        pending: pendingDays,
        remaining,
      },
      create: {
        userId,
        year,
        entitlement,
        carryOver,
        used: usedDays,
        pending: pendingDays,
        remaining,
      },
    });
  }

  /**
   * Holt Team-Kalender-Daten
   */
  static async getTeamCalendar(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    // User und seine Berechtigung holen
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      return [];
    }

    let whereClause: any = {
      status: LeaveStatus.APPROVED,
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    };

    // Nur Team des Supervisors oder der Abteilung anzeigen
    if (user.role === Role.SUPERVISOR) {
      whereClause.user = {
        OR: [
          { supervisorId: userId },
          { id: userId },
        ],
      };
    } else if (user.role === Role.USER) {
      // User sieht nur seine Abteilung
      if (user.departmentId) {
        whereClause.user = {
          departmentId: user.departmentId,
        };
      } else {
        // Nur eigene Anträge
        whereClause.userId = userId;
      }
    }
    // Admin sieht alle

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // In Kalender-Format umwandeln
    const calendarEntries: Array<{
      userId: string;
      userName: string;
      date: Date;
      type: LeaveType;
      departmentColor: string | null;
    }> = [];

    for (const request of requests) {
      const days = eachDayOfInterval({
        start: request.startDate > startDate ? request.startDate : startDate,
        end: request.endDate < endDate ? request.endDate : endDate,
      });

      for (const day of days) {
        if (!isWeekend(day)) {
          calendarEntries.push({
            userId: request.user.id,
            userName: `${request.user.firstName} ${request.user.lastName}`,
            date: day,
            type: request.type,
            departmentColor: request.user.department?.color || null,
          });
        }
      }
    }

    return calendarEntries;
  }

  /**
   * Holt einen einzelnen Antrag mit Details
   */
  static async getRequestById(requestId: string): Promise<LeaveRequestWithUser | null> {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return request;
  }
}
