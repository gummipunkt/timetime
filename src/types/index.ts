import { Role, LeaveStatus, LeaveType, TimeEntryType, AuditAction } from "@prisma/client";

// Re-export Prisma Enums für einfacheren Import
export { Role, LeaveStatus, LeaveType, TimeEntryType, AuditAction };

// ============================================
// USER TYPES
// ============================================

export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profileImage?: string | null;
}

export interface UserWithDetails extends UserBasic {
  employeeNumber?: string | null;
  departmentId?: string | null;
  supervisorId?: string | null;
  annualLeaveEntitlement: number;
  carryOverDays: number;
  isActive: boolean;
  hireDate: Date;
  workTimeModel?: WorkTimeModelBasic | null;
  department?: DepartmentBasic | null;
  supervisor?: UserBasic | null;
}

// ============================================
// DEPARTMENT TYPES
// ============================================

export interface DepartmentBasic {
  id: string;
  name: string;
  color?: string | null;
}

export interface DepartmentWithMembers extends DepartmentBasic {
  description?: string | null;
  head?: UserBasic | null;
  members: UserBasic[];
}

// ============================================
// WORK TIME MODEL TYPES
// ============================================

export interface WorkTimeModelBasic {
  id: string;
  name: string;
}

export interface WorkTimeModelFull extends WorkTimeModelBasic {
  description?: string | null;
  mondayMinutes: number;
  tuesdayMinutes: number;
  wednesdayMinutes: number;
  thursdayMinutes: number;
  fridayMinutes: number;
  saturdayMinutes: number;
  sundayMinutes: number;
  coreTimeStart?: string | null;
  coreTimeEnd?: string | null;
  breakMinutesPerDay: number;
  breakAfterMinutes: number;
  isDefault: boolean;
  isActive: boolean;
}

// ============================================
// TIME TRACKING TYPES
// ============================================

export interface TimeEntryBasic {
  id: string;
  type: TimeEntryType;
  timestamp: Date;
  note?: string | null;
  isManual: boolean;
}

export interface TimeEntryWithDetails extends TimeEntryBasic {
  userId: string;
  correctedById?: string | null;
  correctionNote?: string | null;
  originalTimestamp?: Date | null;
}

export interface DailyWorkSummaryData {
  id: string;
  userId: string;
  date: Date;
  workedMinutes: number;
  breakMinutes: number;
  targetMinutes: number;
  deltaMinutes: number;
  isHoliday: boolean;
  isWeekend: boolean;
  isLeaveDay: boolean;
  leaveType?: LeaveType | null;
  firstClockIn?: Date | null;
  lastClockOut?: Date | null;
}

export interface CurrentWorkStatus {
  isWorking: boolean;
  isOnBreak: boolean;
  todayWorkedMinutes: number;
  todayBreakMinutes: number;
  todayTargetMinutes: number;
  todayDelta: number; // Plus/Minus heute
  totalFlexBalance: number; // Gesamtes Gleitzeit-Saldo
  lastEntry?: TimeEntryBasic | null;
  entries: TimeEntryBasic[];
}

// ============================================
// LEAVE TYPES
// ============================================

export interface LeaveRequestBasic {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string | null;
}

export interface LeaveRequestWithDetails extends LeaveRequestBasic {
  userId: string;
  user: UserBasic;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  approverId?: string | null;
  approver?: UserBasic | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  documentUrl?: string | null;
  createdAt: Date;
}

export interface LeaveBalanceData {
  id: string;
  userId: string;
  year: number;
  entitlement: number;
  carryOver: number;
  used: number;
  pending: number;
  remaining: number;
}

// ============================================
// HOLIDAY TYPES
// ============================================

export interface HolidayData {
  id: string;
  name: string;
  date: Date;
  region?: string | null;
  isRecurring: boolean;
  isHalfDay: boolean;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  performedById: string;
  performedBy: UserBasic;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  description?: string | null;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface TimeEntryFormData {
  type: TimeEntryType;
  timestamp?: Date;
  note?: string;
}

export interface LeaveRequestFormData {
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  reason?: string;
}

export interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  role: Role;
  departmentId?: string;
  supervisorId?: string;
  workTimeModelId?: string;
  annualLeaveEntitlement?: number;
}

// ============================================
// DASHBOARD / REPORTING TYPES
// ============================================

export interface MonthlyOverview {
  month: number;
  year: number;
  workedDays: number;
  totalWorkedMinutes: number;
  totalTargetMinutes: number;
  totalDelta: number;
  leaveDays: number;
  sickDays: number;
  holidays: number;
}

export interface TeamCalendarEntry {
  userId: string;
  user: UserBasic;
  date: Date;
  type: "leave" | "holiday" | "sick";
  leaveType?: LeaveType;
  status?: LeaveStatus;
}
