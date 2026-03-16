import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TimeClockWidget } from "@/components/time/time-clock-widget";
import { TodayOverview } from "@/components/time/today-overview";
import { MonthlyTimesheet } from "@/components/time/monthly-timesheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Zeiterfassung",
};

export default async function TimePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zeiterfassung</h1>
        <p className="text-muted-foreground mt-1">
          Erfassen Sie Ihre Arbeitszeit und behalten Sie den Überblick.
        </p>
      </div>

      {/* Time Clock Widget */}
      <TimeClockWidget />

      {/* Tabs for different views */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="w-4 h-4" />
            Heute
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <Calendar className="w-4 h-4" />
            Monatsübersicht
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiken
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TodayOverview />
            <Card>
              <CardHeader>
                <CardTitle>Tages-Statistik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Arbeitszeit</span>
                    <span className="font-mono font-medium">--:--</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Pausenzeit</span>
                    <span className="font-mono font-medium">--:--</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Soll-Zeit</span>
                    <span className="font-mono font-medium">08:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Delta</span>
                    <span className="font-mono font-medium text-muted-foreground">
                      --:--
                    </span>
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
              <CardTitle>Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Statistiken werden hier angezeigt.</p>
                <p className="text-sm">
                  Charts und Auswertungen Ihrer Arbeitszeit.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
