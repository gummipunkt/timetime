import { prisma } from "@/lib/prisma";
import { Role, AuditAction } from "@prisma/client";
import { hash } from "bcryptjs";

// ============================================
// TYPES
// ============================================

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  role: Role;
  departmentId?: string;
  supervisorId?: string;
  delegateId?: string;
  workTimeModelId?: string;
  annualLeaveEntitlement?: number;
  hireDate?: Date;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string | null;
  role?: Role;
  departmentId?: string | null;
  supervisorId?: string | null;
  delegateId?: string | null;
  workTimeModelId?: string | null;
  annualLeaveEntitlement?: number;
  isActive?: boolean;
}

export interface AuditLogInput {
  userId?: string;
  performedById: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// ADMIN SERVICE
// ============================================

export class AdminService {
  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * Erstellt einen neuen User
   */
  static async createUser(input: CreateUserInput, performedById: string) {
    // Prüfen ob Email bereits existiert
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits.");
    }

    // Passwort hashen
    const passwordHash = await hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        employeeNumber: input.employeeNumber,
        role: input.role,
        departmentId: input.departmentId,
        supervisorId: input.supervisorId,
        workTimeModelId: input.workTimeModelId,
        annualLeaveEntitlement: input.annualLeaveEntitlement || 30,
        hireDate: input.hireDate || new Date(),
        isActive: true,
      },
      include: {
        department: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        workTimeModel: true,
      },
    });

    // Audit Log erstellen
    await this.createAuditLog({
      userId: user.id,
      performedById,
      action: AuditAction.CREATE,
      entityType: "User",
      entityId: user.id,
      newValues: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      description: `Benutzer ${user.firstName} ${user.lastName} wurde erstellt`,
    });

    return user;
  }

  /**
   * Aktualisiert einen User
   */
  static async updateUser(
    userId: string,
    input: UpdateUserInput,
    performedById: string
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error("Benutzer nicht gefunden.");
    }

    // Email-Duplikat prüfen
    if (input.email && input.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (emailExists) {
        throw new Error("Diese E-Mail wird bereits verwendet.");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: input.email?.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        employeeNumber: input.employeeNumber,
        role: input.role,
        departmentId: input.departmentId,
        supervisorId: input.supervisorId,
        workTimeModelId: input.workTimeModelId,
        annualLeaveEntitlement: input.annualLeaveEntitlement,
        isActive: input.isActive,
      },
      include: {
        department: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        workTimeModel: true,
      },
    });

    // Änderungen für Audit Log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const key of Object.keys(input) as (keyof UpdateUserInput)[]) {
      if (input[key] !== undefined && input[key] !== (existingUser as any)[key]) {
        changes[key] = {
          old: (existingUser as any)[key],
          new: input[key],
        };
      }
    }

    // Audit Log erstellen
    await this.createAuditLog({
      userId,
      performedById,
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: userId,
      oldValues: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.old])
      ),
      newValues: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.new])
      ),
      description: `Benutzer ${updatedUser.firstName} ${updatedUser.lastName} wurde aktualisiert`,
    });

    return updatedUser;
  }

  /**
   * Deaktiviert einen User (kein hartes Löschen)
   */
  static async deactivateUser(userId: string, performedById: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }

    if (user.id === performedById) {
      throw new Error("Sie können sich nicht selbst deaktivieren.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Audit Log
    await this.createAuditLog({
      userId,
      performedById,
      action: AuditAction.DELETE,
      entityType: "User",
      entityId: userId,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      description: `Benutzer ${user.firstName} ${user.lastName} wurde deaktiviert`,
    });

    return updatedUser;
  }

  /**
   * Setzt das Passwort eines Users zurück
   */
  static async resetPassword(
    userId: string,
    newPassword: string,
    performedById: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Benutzer nicht gefunden.");
    }

    const passwordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Audit Log (ohne Passwort-Details)
    await this.createAuditLog({
      userId,
      performedById,
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: userId,
      description: `Passwort für ${user.firstName} ${user.lastName} wurde zurückgesetzt`,
    });

    return true;
  }

  /**
   * Listet alle User auf
   */
  static async listUsers(options?: {
    includeInactive?: boolean;
    departmentId?: string;
    role?: Role;
    search?: string;
  }) {
    const where: any = {};

    if (!options?.includeInactive) {
      where.isActive = true;
    }

    if (options?.departmentId) {
      where.departmentId = options.departmentId;
    }

    if (options?.role) {
      where.role = options.role;
    }

    if (options?.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: "insensitive" } },
        { lastName: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
        { employeeNumber: { contains: options.search, mode: "insensitive" } },
      ];
    }

    return prisma.user.findMany({
      where,
      include: {
        department: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        workTimeModel: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  /**
   * Holt einen einzelnen User
   */
  static async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        workTimeModel: true,
        subordinates: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  // ==========================================
  // AUDIT LOGGING
  // ==========================================

  /**
   * Erstellt einen Audit-Log-Eintrag
   */
  static async createAuditLog(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        userId: input.userId,
        performedById: input.performedById,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: (input.oldValues as any) || undefined,
        newValues: (input.newValues as any) || undefined,
        description: input.description,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Listet Audit-Logs auf
   */
  static async listAuditLogs(options?: {
    userId?: string;
    performedById?: string;
    entityType?: string;
    entityId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.performedById) {
      where.performedById = options.performedById;
    }

    if (options?.entityType) {
      where.entityType = options.entityType;
    }

    if (options?.entityId) {
      where.entityId = options.entityId;
    }

    if (options?.action) {
      where.action = options.action;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  /**
   * Listet alle Abteilungen auf
   */
  static async listDepartments() {
    return prisma.department.findMany({
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // ==========================================
  // WORK TIME MODELS
  // ==========================================

  /**
   * Listet alle Arbeitszeitmodelle auf
   */
  static async listWorkTimeModels() {
    return prisma.workTimeModel.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Holt Admin-Dashboard-Statistiken
   */
  static async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      pendingLeaveRequests,
      todayClockIns,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.timeEntry.count({
        where: {
          type: "CLOCK_IN",
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      pendingLeaveRequests,
      todayClockIns,
    };
  }
}
