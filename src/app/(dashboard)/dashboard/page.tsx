import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeClockWidget } from "@/components/time/time-clock-widget";
import { TodayOverview } from "@/components/time/today-overview";
import { FlexBalanceCard } from "@/components/time/flex-balance-card";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {session?.user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Time Clock Widget - Prominent */}
      <TimeClockWidget />

      {/* Stats Grid */}
      <DashboardStats />

      {/* Detailed Cards */}
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
