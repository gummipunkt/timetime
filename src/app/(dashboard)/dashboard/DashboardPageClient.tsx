"use client";

import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { TimeClockWidget } from "@/components/time/time-clock-widget";
import { TodayOverview } from "@/components/time/today-overview";
import { FlexBalanceCard } from "@/components/time/flex-balance-card";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export function DashboardPageClient() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? "greeting.morning" : hour < 18 ? "greeting.afternoon" : "greeting.evening";
  const greeting = t(greetingKey);

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat(locale || "de", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {session?.user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">{formattedDate}</p>
      </div>

      <TimeClockWidget />

      <DashboardStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayOverview />
        <div className="space-y-6">
          <FlexBalanceCard />
          <LeaveBalanceCard />
        </div>
      </div>
    </div>
  );
}

