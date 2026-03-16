import { getServerSession } from "next-auth";
import { authOptions, isSupervisorOrAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TimeCorrectionList } from "@/components/time/time-correction-list";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Zeitkorrekturen",
};

export default async function TimeCorrectionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isSupervisorOrAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zeitkorrekturen</h1>
        <p className="text-muted-foreground mt-1">
          Prüfen und genehmigen Sie Korrekturanträge zu Stempelzeiten Ihres Teams.
        </p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Offene Korrekturanträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeCorrectionList />
        </CardContent>
      </Card>
    </div>
  );
}

