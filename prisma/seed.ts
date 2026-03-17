import { PrismaClient, Role, LeaveType, LeaveStatus, TimeEntryType } from "@prisma/client";
import { hash } from "bcryptjs";
import { setHours, setMinutes, eachDayOfInterval, isWeekend, subDays } from "date-fns";
import { TimeService } from "../src/lib/services/time.service";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // WORK TIME MODELS
  // ============================================
  console.log("Creating work time models...");

  const fullTime = await prisma.workTimeModel.upsert({
    where: { id: "default-fulltime" },
    update: {},
    create: {
      id: "default-fulltime",
      name: "Vollzeit 40h",
      description: "Standard Vollzeit-Arbeitsmodell mit 8 Stunden pro Tag",
      mondayMinutes: 480,
      tuesdayMinutes: 480,
      wednesdayMinutes: 480,
      thursdayMinutes: 480,
      fridayMinutes: 480,
      saturdayMinutes: 0,
      sundayMinutes: 0,
      coreTimeStart: "09:00",
      coreTimeEnd: "15:00",
      breakMinutesPerDay: 30,
      breakAfterMinutes: 360,
      isDefault: true,
      isActive: true,
    },
  });

  const partTime = await prisma.workTimeModel.upsert({
    where: { id: "default-parttime" },
    update: {},
    create: {
      id: "default-parttime",
      name: "Teilzeit 20h",
      description: "Teilzeit-Arbeitsmodell mit 4 Stunden pro Tag",
      mondayMinutes: 240,
      tuesdayMinutes: 240,
      wednesdayMinutes: 240,
      thursdayMinutes: 240,
      fridayMinutes: 240,
      saturdayMinutes: 0,
      sundayMinutes: 0,
      coreTimeStart: "10:00",
      coreTimeEnd: "14:00",
      breakMinutesPerDay: 15,
      breakAfterMinutes: 360,
      isDefault: false,
      isActive: true,
    },
  });

  // ============================================
  // DEPARTMENTS
  // ============================================
  console.log("Creating departments...");

  const devDept = await prisma.department.upsert({
    where: { id: "dept-dev" },
    update: { name: "Entwicklung" },
    create: {
      id: "dept-dev",
      name: "Entwicklung",
      description: "Software-Entwicklung und IT",
      color: "#3B82F6",
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { id: "dept-sales" },
    update: {},
    create: {
      id: "dept-sales",
      name: "Vertrieb",
      description: "Vertrieb und Kundenbetreuung",
      color: "#F59E0B",
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { id: "dept-hr" },
    update: {},
    create: {
      id: "dept-hr",
      name: "Personal",
      description: "Human Resources und Management",
      color: "#10B981",
    },
  });

  // ============================================
  // USERS
  // ============================================
  console.log("Creating users...");

  const adminPassword = await hash("admin123", 12);
  const userPassword = await hash("user123", 12);

  // Admin (CEO)
  const ceo = await prisma.user.upsert({
    where: { email: "ceo@timetracker.local" },
    update: {},
    create: {
      email: "ceo@timetracker.local",
      passwordHash: adminPassword,
      firstName: "Clara",
      lastName: "Chef",
      employeeNumber: "CEO001",
      role: Role.ADMIN,
      departmentId: hrDept.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 30,
      hireDate: new Date("2019-01-01"),
    },
  });

  // Admin (HR)
  const hr = await prisma.user.upsert({
    where: { email: "hr@timetracker.local" },
    update: {},
    create: {
      email: "hr@timetracker.local",
      passwordHash: adminPassword,
      firstName: "Heinrich",
      lastName: "Personal",
      employeeNumber: "HR001",
      role: Role.ADMIN,
      departmentId: hrDept.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 30,
      hireDate: new Date("2020-03-01"),
    },
  });

  // Supervisor Entwicklung
  const leadDev = await prisma.user.upsert({
    where: { email: "lead.dev@timetracker.local" },
    update: {},
    create: {
      email: "lead.dev@timetracker.local",
      passwordHash: userPassword,
      firstName: "Lisa",
      lastName: "Dev",
      employeeNumber: "DEV001",
      role: Role.SUPERVISOR,
      departmentId: devDept.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 30,
      hireDate: new Date("2021-03-15"),
    },
  });

  // Supervisor Vertrieb
  const leadSales = await prisma.user.upsert({
    where: { email: "lead.sales@timetracker.local" },
    update: {},
    create: {
      email: "lead.sales@timetracker.local",
      passwordHash: userPassword,
      firstName: "Lars",
      lastName: "Sales",
      employeeNumber: "SAL001",
      role: Role.SUPERVISOR,
      departmentId: salesDept.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 30,
      hireDate: new Date("2021-06-01"),
    },
  });

  // Entwicklung: User Vollzeit
  const annaDev = await prisma.user.upsert({
    where: { email: "anna.dev@timetracker.local" },
    update: {},
    create: {
      email: "anna.dev@timetracker.local",
      passwordHash: userPassword,
      firstName: "Anna",
      lastName: "Dev",
      employeeNumber: "DEV002",
      role: Role.USER,
      departmentId: devDept.id,
      supervisorId: leadDev.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 28,
      hireDate: new Date("2022-06-01"),
    },
  });

  // Entwicklung: User Teilzeit
  const benDev = await prisma.user.upsert({
    where: { email: "ben.dev@timetracker.local" },
    update: {},
    create: {
      email: "ben.dev@timetracker.local",
      passwordHash: userPassword,
      firstName: "Ben",
      lastName: "Dev",
      employeeNumber: "DEV003",
      role: Role.USER,
      departmentId: devDept.id,
      supervisorId: leadDev.id,
      workTimeModelId: partTime.id,
      annualLeaveEntitlement: 14,
      hireDate: new Date("2023-01-15"),
    },
  });

  const coraDev = await prisma.user.upsert({
    where: { email: "cora.dev@timetracker.local" },
    update: {},
    create: {
      email: "cora.dev@timetracker.local",
      passwordHash: userPassword,
      firstName: "Cora",
      lastName: "Dev",
      employeeNumber: "DEV004",
      role: Role.USER,
      departmentId: devDept.id,
      supervisorId: leadDev.id,
      workTimeModelId: partTime.id,
      annualLeaveEntitlement: 14,
      hireDate: new Date("2023-01-15"),
    },
  });

  // Vertrieb: User Vollzeit
  const davidSales = await prisma.user.upsert({
    where: { email: "david.sales@timetracker.local" },
    update: {},
    create: {
      email: "david.sales@timetracker.local",
      passwordHash: userPassword,
      firstName: "David",
      lastName: "Sales",
      employeeNumber: "SAL002",
      role: Role.USER,
      departmentId: salesDept.id,
      supervisorId: leadSales.id,
      workTimeModelId: fullTime.id,
      annualLeaveEntitlement: 28,
      hireDate: new Date("2022-06-01"),
    },
  });

  // Vertrieb: User Teilzeit
  const evaSales = await prisma.user.upsert({
    where: { email: "eva.sales@timetracker.local" },
    update: {},
    create: {
      email: "eva.sales@timetracker.local",
      passwordHash: userPassword,
      firstName: "Eva",
      lastName: "Sales",
      employeeNumber: "SAL003",
      role: Role.USER,
      departmentId: salesDept.id,
      supervisorId: leadSales.id,
      workTimeModelId: partTime.id,
      annualLeaveEntitlement: 14,
      hireDate: new Date("2023-01-15"),
    },
  });

  const finnSales = await prisma.user.upsert({
    where: { email: "finn.sales@timetracker.local" },
    update: {},
    create: {
      email: "finn.sales@timetracker.local",
      passwordHash: userPassword,
      firstName: "Finn",
      lastName: "Sales",
      employeeNumber: "SAL004",
      role: Role.USER,
      departmentId: salesDept.id,
      supervisorId: leadSales.id,
      workTimeModelId: partTime.id,
      annualLeaveEntitlement: 14,
      hireDate: new Date("2023-01-15"),
    },
  });

  // Department heads & Delegation
  await prisma.department.update({
    where: { id: devDept.id },
    data: { headId: leadDev.id },
  });
  await prisma.department.update({
    where: { id: salesDept.id },
    data: { headId: leadSales.id },
  });
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { headId: hr.id },
  });

  // Vertretung: Lead Dev vertritt Lead Sales, Lead Sales vertritt Lead Dev
  await (prisma as any).user.update({
    where: { id: leadDev.id },
    data: { delegateId: leadSales.id },
  });
  await (prisma as any).user.update({
    where: { id: leadSales.id },
    data: { delegateId: leadDev.id },
  });

  const allUsers = [ceo, hr, leadDev, leadSales, annaDev, benDev, coraDev, davidSales, evaSales, finnSales];

  // ============================================
  // HOLIDAYS (Deutsche Feiertage, aktuelles + Folgejahr)
  // ============================================
  console.log("Creating holidays...");

  const holidaysByYear: Record<number, Array<{ name: string; date: Date; region: string }>> = {
    2025: [
      { name: "Neujahr", date: new Date("2025-01-01"), region: "ALL" },
      { name: "Heilige Drei Könige", date: new Date("2025-01-06"), region: "DE-BY" },
      { name: "Karfreitag", date: new Date("2025-04-18"), region: "ALL" },
      { name: "Ostermontag", date: new Date("2025-04-21"), region: "ALL" },
      { name: "Tag der Arbeit", date: new Date("2025-05-01"), region: "ALL" },
      { name: "Christi Himmelfahrt", date: new Date("2025-05-29"), region: "ALL" },
      { name: "Pfingstmontag", date: new Date("2025-06-09"), region: "ALL" },
      { name: "Fronleichnam", date: new Date("2025-06-19"), region: "DE-BY" },
      { name: "Mariä Himmelfahrt", date: new Date("2025-08-15"), region: "DE-BY" },
      { name: "Tag der Deutschen Einheit", date: new Date("2025-10-03"), region: "ALL" },
      { name: "Allerheiligen", date: new Date("2025-11-01"), region: "DE-BY" },
      { name: "1. Weihnachtstag", date: new Date("2025-12-25"), region: "ALL" },
      { name: "2. Weihnachtstag", date: new Date("2025-12-26"), region: "ALL" },
    ],
    2026: [
      { name: "Neujahr", date: new Date("2026-01-01"), region: "ALL" },
      { name: "Heilige Drei Könige", date: new Date("2026-01-06"), region: "DE-BY" },
      { name: "Karfreitag", date: new Date("2026-04-03"), region: "ALL" },
      { name: "Ostermontag", date: new Date("2026-04-06"), region: "ALL" },
      { name: "Tag der Arbeit", date: new Date("2026-05-01"), region: "ALL" },
      { name: "Christi Himmelfahrt", date: new Date("2026-05-14"), region: "ALL" },
      { name: "Pfingstmontag", date: new Date("2026-05-25"), region: "ALL" },
      { name: "Fronleichnam", date: new Date("2026-06-04"), region: "DE-BY" },
      { name: "Mariä Himmelfahrt", date: new Date("2026-08-15"), region: "DE-BY" },
      { name: "Tag der Deutschen Einheit", date: new Date("2026-10-03"), region: "ALL" },
      { name: "Allerheiligen", date: new Date("2026-11-01"), region: "DE-BY" },
      { name: "1. Weihnachtstag", date: new Date("2026-12-25"), region: "ALL" },
      { name: "2. Weihnachtstag", date: new Date("2026-12-26"), region: "ALL" },
    ],
  };

  const seedYear = new Date().getFullYear();
  for (const y of [seedYear, seedYear + 1]) {
    const holidays = holidaysByYear[y as keyof typeof holidaysByYear];
    if (!holidays) continue;
    for (const h of holidays) {
      await prisma.holiday.upsert({
        where: { date_region: { date: h.date, region: h.region } },
        update: {},
        create: { name: h.name, date: h.date, year: y, region: h.region, isRecurring: false, isHalfDay: false },
      });
    }
  }

  // ============================================
  // DEMO ARBEITSZEITEN (relativ zum aktuellen Datum)
  // ============================================
  console.log("Creating demo time entries...");

  await prisma.timeEntry.deleteMany({
    where: { userId: { in: allUsers.map((u) => u.id) } },
  });

  const partTimeUsers = [benDev, coraDev, evaSales, finnSales];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = subDays(today, 42);
  const endDate = subDays(today, 1);
  const workDays = eachDayOfInterval({ start: startDate, end: endDate }).filter((d) => !isWeekend(d));

  const userIndex = (u: (typeof allUsers)[0]) => allUsers.indexOf(u);
  for (const day of workDays) {
    for (const user of allUsers) {
      const isPartTime = partTimeUsers.includes(user);
      const startVariation = (userIndex(user) % 3) * 15;
      const startHour = isPartTime ? 10 : 8;
      const startMin = startVariation;
      const workStart = setMinutes(setHours(day, startHour), startMin);
      const workEnd = setMinutes(setHours(day, isPartTime ? 14 : 17), isPartTime ? 0 : 30);
      const breakStart = setMinutes(setHours(day, 12), 0);
      const breakEnd = setMinutes(setHours(day, 12), isPartTime ? 15 : 30);

      await prisma.timeEntry.createMany({
        data: [
          { userId: user.id, type: TimeEntryType.CLOCK_IN, timestamp: workStart, isManual: false },
          { userId: user.id, type: TimeEntryType.BREAK_START, timestamp: breakStart, isManual: false },
          { userId: user.id, type: TimeEntryType.BREAK_END, timestamp: breakEnd, isManual: false },
          { userId: user.id, type: TimeEntryType.CLOCK_OUT, timestamp: workEnd, isManual: false },
        ],
        skipDuplicates: true,
      });
    }
  }

  // Heutige Arbeitszeiten – alle User eingestempelt (ohne Ausstempeln)
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  for (const user of allUsers) {
    const isPartTime = partTimeUsers.includes(user);
    const workStart = setMinutes(setHours(todayDate, isPartTime ? 10 : 8), 0);
    const breakStart = setMinutes(setHours(todayDate, 12), 0);
    const breakEnd = setMinutes(setHours(todayDate, 12), isPartTime ? 15 : 30);
    await prisma.timeEntry.createMany({
      data: [
        { userId: user.id, type: TimeEntryType.CLOCK_IN, timestamp: workStart, isManual: false },
        { userId: user.id, type: TimeEntryType.BREAK_START, timestamp: breakStart, isManual: false },
        { userId: user.id, type: TimeEntryType.BREAK_END, timestamp: breakEnd, isManual: false },
      ],
      skipDuplicates: true,
    });
  }

  // DailyWorkSummary für alle betroffenen Tage/Benutzer aktualisieren
  console.log("Updating daily summaries...");
  for (const day of workDays.concat([todayDate])) {
    for (const user of allUsers) {
      await TimeService.updateDailySummary(user.id, day);
    }
  }

  // ============================================
  // SAMPLE LEAVE REQUESTS
  // ============================================
  console.log("Creating sample leave requests...");

  const currentYear = new Date().getFullYear();
  const leaveRequests = [
    { userId: annaDev.id, approverId: leadDev.id, status: LeaveStatus.APPROVED,
      startDate: `${currentYear}-02-09`, endDate: `${currentYear}-02-13`, totalDays: 5, reason: "Winterurlaub" },
    { userId: benDev.id, approverId: null, status: LeaveStatus.PENDING,
      startDate: `${currentYear}-03-23`, endDate: `${currentYear}-03-27`, totalDays: 5, reason: "Familienbesuch" },
    { userId: coraDev.id, approverId: leadDev.id, status: LeaveStatus.APPROVED,
      startDate: `${currentYear}-02-19`, endDate: `${currentYear}-02-20`, totalDays: 2, reason: "Arzttermin" },
    { userId: davidSales.id, approverId: leadSales.id, status: LeaveStatus.APPROVED,
      startDate: `${currentYear}-03-09`, endDate: `${currentYear}-03-13`, totalDays: 5, reason: "Urlaub" },
    { userId: evaSales.id, approverId: null, status: LeaveStatus.PENDING,
      startDate: `${currentYear}-04-01`, endDate: `${currentYear}-04-03`, totalDays: 3, reason: "Osterurlaub" },
    { userId: finnSales.id, approverId: leadSales.id, status: LeaveStatus.APPROVED,
      startDate: `${currentYear}-01-15`, endDate: `${currentYear}-01-16`, totalDays: 2, reason: "Krankheit" },
  ];

  for (let i = 0; i < leaveRequests.length; i++) {
    const lr = leaveRequests[i];
    await prisma.leaveRequest.upsert({
      where: { id: `leave-${i + 1}` },
      update: {},
      create: {
        id: `leave-${i + 1}`,
        userId: lr.userId,
        type: LeaveType.VACATION,
        status: lr.status,
        startDate: new Date(lr.startDate),
        endDate: new Date(lr.endDate),
        totalDays: lr.totalDays,
        reason: lr.reason,
        approverId: lr.approverId,
        approvedAt: lr.approverId ? new Date() : null,
      },
    });
  }

  // ============================================
  // LEAVE BALANCES (aktuelles Jahr)
  // ============================================
  console.log("Creating leave balances...");

  for (const user of allUsers) {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { annualLeaveEntitlement: true, carryOverDays: true },
    });
    if (!userData) continue;

    await prisma.leaveBalance.upsert({
      where: {
        userId_year: { userId: user.id, year: currentYear },
      },
      update: {},
      create: {
        userId: user.id,
        year: currentYear,
        entitlement: userData.annualLeaveEntitlement,
        carryOver: userData.carryOverDays ?? 0,
        used: 0,
        pending: 0,
        remaining: userData.annualLeaveEntitlement + (userData.carryOverDays ?? 0),
      },
    });
  }

  // ============================================
  // SYSTEM SETTINGS
  // ============================================
  console.log("Creating system settings...");

  const settings = [
    { key: "company_name", value: "TimeTracker Demo GmbH", description: "Name des Unternehmens" },
    { key: "default_region", value: "DE-BY", description: "Standard-Bundesland für Feiertage" },
    { key: "default_timezone", value: "Europe/Berlin", description: "Standard-Zeitzone" },
    { key: "max_flex_hours", value: "40", description: "Maximales Gleitzeitguthaben in Stunden" },
    { key: "min_flex_hours", value: "-20", description: "Minimales Gleitzeitguthaben in Stunden" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("📧 Login Credentials:");
  console.log("   CEO (Admin): ceo@timetracker.local / admin123");
  console.log("   HR (Admin):  hr@timetracker.local / admin123");
  console.log("   Lead Dev:    lead.dev@timetracker.local / user123");
  console.log("   Lead Sales:  lead.sales@timetracker.local / user123");
  console.log("   Anna Dev:    anna.dev@timetracker.local / user123");
  console.log("   Ben Dev:     ben.dev@timetracker.local / user123");
  console.log("   Cora Dev:    cora.dev@timetracker.local / user123");
  console.log("   David Sales: david.sales@timetracker.local / user123");
  console.log("   Eva Sales:   eva.sales@timetracker.local / user123");
  console.log("   Finn Sales:  finn.sales@timetracker.local / user123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
