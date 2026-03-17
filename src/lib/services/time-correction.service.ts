import { prisma } from "@/lib/prisma";
import { TimeEntryType, Role, AuditAction } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import { TimeService } from "./time.service";
import { AdminService } from "./admin.service";

const CorrectionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export interface CreateTimeCorrectionRequestInput {
  userId: string;
  timeEntryId?: string;
  requestedType: TimeEntryType;
  requestedTimestamp: Date;
  requestedNote?: string;
  reason: string;
}

export class TimeCorrectionService {
  /**
   * Legt einen neuen Korrekturantrag an
   */
  static async createRequest(input: CreateTimeCorrectionRequestInput) {
    if (!input.reason?.trim()) {
      throw new Error("Bitte geben Sie eine Begründung für die Korrektur an.");
    }

    // Optional sicherstellen, dass der Eintrag dem User gehört
    if (input.timeEntryId) {
      const entry = await prisma.timeEntry.findUnique({
        where: { id: input.timeEntryId },
        select: { userId: true },
      });

      if (!entry || entry.userId !== input.userId) {
        throw new Error("Sie können nur eigene Zeiteinträge korrigieren.");
      }
    }

    const request = await (prisma as any).timeCorrectionRequest.create({
      data: {
        userId: input.userId,
        timeEntryId: input.timeEntryId,
        requestedType: input.requestedType,
        requestedTimestamp: input.requestedTimestamp,
        requestedNote: input.requestedNote,
        reason: input.reason,
        status: CorrectionStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntry: true,
      },
    });

    return request;
  }

  /**
   * Holt Korrekturanträge eines Users
   */
  static async getUserRequests(userId: string) {
    const requests = await (prisma as any).timeCorrectionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        timeEntry: true,
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return requests;
  }

  /**
   * Holt ausstehende Anträge für Supervisor/Admin
   */
  static async getPendingForApproval(approverId: string) {
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      return [];
    }

    const baseWhere: any = {
      status: CorrectionStatus.PENDING,
    };

    if (approver.role === Role.ADMIN) {
      // Admin sieht alle Anträge
    } else if (approver.role === Role.SUPERVISOR) {
      // Supervisor sieht nur Anträge seines Teams
      baseWhere.user = {
        supervisorId: approverId,
      };
    } else {
      return [];
    }

    const requests = await (prisma as any).timeCorrectionRequest.findMany({
      where: baseWhere,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntry: true,
      },
    });

    return requests;
  }

  /**
   * Genehmigt einen Korrekturantrag und führt die Korrektur durch
   */
  static async approveRequest(requestId: string, approverId: string) {
    const request = await (prisma as any).timeCorrectionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        timeEntry: true,
      },
    });

    if (!request) {
      throw new Error("Korrekturantrag nicht gefunden.");
    }

    if (request.status !== CorrectionStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }

    // Berechtigung prüfen: Admin oder Supervisor des Users
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      throw new Error("Genehmiger nicht gefunden.");
    }

    const isSupervisorForUser =
      approver.role === Role.SUPERVISOR &&
      (request.user.supervisorId === approverId ||
        (request.user as any).delegateId === approverId);

    if (approver.role !== Role.ADMIN && !isSupervisorForUser) {
      throw new Error("Sie sind nicht berechtigt, diesen Antrag zu genehmigen.");
    }

    // Korrektur durchführen: bestehenden Eintrag korrigieren oder neuen Eintrag anlegen
    if (request.timeEntryId) {
      await prisma.timeEntry.update({
        where: { id: request.timeEntryId },
        data: {
          timestamp: request.requestedTimestamp,
          type: request.requestedType,
          note: request.requestedNote,
          isManual: true,
          correctedById: approverId,
          correctionNote: request.reason,
          originalTimestamp: request.timeEntry?.originalTimestamp || request.timeEntry?.timestamp,
        },
      });
    } else {
      await prisma.timeEntry.create({
        data: {
          userId: request.userId,
          type: request.requestedType,
          timestamp: request.requestedTimestamp,
          note: request.requestedNote,
          isManual: true,
          correctedById: approverId,
          correctionNote: request.reason,
        },
      });
    }

    // Tagesübersicht aktualisieren
    await TimeService.updateDailySummary(
      request.userId,
      request.requestedTimestamp
    );

    const updated = await (prisma as any).timeCorrectionRequest.update({
      where: { id: requestId },
      data: {
        status: CorrectionStatus.APPROVED,
        approverId,
        approvedAt: new Date(),
      },
    });

    // Audit log entry
    await AdminService.createAuditLog({
      userId: request.userId,
      performedById: approverId,
      action: AuditAction.APPROVE,
      entityType: "TIME_CORRECTION",
      entityId: request.id,
      description: `Time correction ${request.id} approved`,
    });

    // Persistent notification (optional)
    await (prisma as any).notification.create({
      data: {
        userId: request.userId,
        entityType: "TIME_CORRECTION",
        entityId: request.id,
        type: "TIME_CORRECTION",
        action: AuditAction.APPROVE,
        title: "Zeitkorrektur genehmigt",
        message: "Ihr Zeitkorrekturantrag wurde genehmigt.",
        link: "/team/time-corrections",
      },
    });

    return updated;
  }

  /**
   * Lehnt einen Korrekturantrag ab
   */
  static async rejectRequest(
    requestId: string,
    approverId: string,
    rejectionReason: string
  ) {
    const request = await (prisma as any).timeCorrectionRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error("Korrekturantrag nicht gefunden.");
    }

    if (request.status !== CorrectionStatus.PENDING) {
      throw new Error("Dieser Antrag wurde bereits bearbeitet.");
    }

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      throw new Error("Genehmiger nicht gefunden.");
    }

    const isSupervisorForUser =
      approver.role === Role.SUPERVISOR &&
      (request.user.supervisorId === approverId ||
        (request.user as any).delegateId === approverId);

    if (approver.role !== Role.ADMIN && !isSupervisorForUser) {
      throw new Error("Sie sind nicht berechtigt, diesen Antrag abzulehnen.");
    }

    const updated = await (prisma as any).timeCorrectionRequest.update({
      where: { id: requestId },
      data: {
        status: CorrectionStatus.REJECTED,
        approverId,
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    // Audit log entry
    await AdminService.createAuditLog({
      userId: request.userId,
      performedById: approverId,
      action: AuditAction.REJECT,
      entityType: "TIME_CORRECTION",
      entityId: request.id,
      description: `Time correction ${request.id} rejected: ${rejectionReason}`,
    });

    // Persistent notification (optional)
    await (prisma as any).notification.create({
      data: {
        userId: request.userId,
        entityType: "TIME_CORRECTION",
        entityId: request.id,
        type: "TIME_CORRECTION",
        action: AuditAction.REJECT,
        title: "Zeitkorrektur abgelehnt",
        message: `Ihr Zeitkorrekturantrag wurde abgelehnt: ${rejectionReason}`,
        link: "/team/time-corrections",
      },
    });

    return updated;
  }
}

