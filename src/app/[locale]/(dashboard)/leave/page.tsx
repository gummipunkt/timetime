import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { LeaveRequestsList } from "@/components/leave/leave-requests-list";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { PendingApprovals } from "@/components/leave/pending-approvals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, List, ClipboardCheck, Calendar } from "lucide-react";
import Link from "next/link";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = await getTranslations({ locale, namespace: "leave" });
  return { title: t("metaTitle") };
}

export default async function LeavePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "leave" });
  const session = await getServerSession(authOptions);
  const canApprove = session?.user ? isSupervisorOrAdmin(session.user.role) : false;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("page.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("page.description")}</p>
        </div>
        <Link href={`/${locale}/leave/new`}>
          <Button className="gap-2">
            <CalendarPlus className="w-4 h-4" />
            {t("page.newRequest")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LeaveBalanceCard />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("page.quickOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">-</p>
                <p className="text-xs text-muted-foreground">{t("page.statOpen")}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-success">-</p>
                <p className="text-xs text-muted-foreground">{t("page.statApproved")}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-muted-foreground">-</p>
                <p className="text-xs text-muted-foreground">{t("page.statDaysTaken")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-requests" className="gap-2">
            <List className="w-4 h-4" />
            {t("page.tabMyRequests")}
          </TabsTrigger>
          {canApprove && (
            <TabsTrigger value="approvals" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              {t("page.tabApprovals")}
            </TabsTrigger>
          )}
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            {t("page.tabCalendar")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests">
          <LeaveRequestsList />
        </TabsContent>

        {canApprove && (
          <TabsContent value="approvals">
            <PendingApprovals />
          </TabsContent>
        )}

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>{t("page.calendarCardTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("page.calendarPlaceholder1")}</p>
                <p className="text-sm">{t("page.calendarPlaceholder2")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
