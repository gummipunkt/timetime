import type { Metadata } from "next";
import { TimeClockWidget } from "@/components/time/time-clock-widget";
import { TodayOverview } from "@/components/time/today-overview";
import { MonthlyTimesheet } from "@/components/time/monthly-timesheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, BarChart3 } from "lucide-react";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = await getTranslations({ locale, namespace: "time" });
  return { title: t("metaTitle") };
}

export default async function TimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "time.page" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <TimeClockWidget />

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="w-4 h-4" />
            {t("tabToday")}
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <Calendar className="w-4 h-4" />
            {t("tabMonth")}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {t("tabStats")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TodayOverview />
            <Card>
              <CardHeader>
                <CardTitle>{t("dayStatsTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("workTime")}</span>
                    <span className="font-mono font-medium">--:--</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("breakTime")}</span>
                    <span className="font-mono font-medium">--:--</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("targetTime")}</span>
                    <span className="font-mono font-medium">08:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t("delta")}</span>
                    <span className="font-mono font-medium text-muted-foreground">--:--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="month">
          <MonthlyTimesheet />
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>{t("statsCardTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("statsPlaceholder1")}</p>
                <p className="text-sm">{t("statsPlaceholder2")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
