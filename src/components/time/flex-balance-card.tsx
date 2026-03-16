"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from "@/hooks/use-time-tracking";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlexBalanceCard() {
  const { status, isLoading } = useTimeTracking();

  const balanceMinutes = status?.totalFlexBalance || 0;
  const monthDeltaMinutes = status?.todayDelta || 0;

  const formatMinutes = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const formatted = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    return isNegative ? `-${formatted}` : `+${formatted}`;
  };

  const getBalanceColor = (minutes: number) => {
    if (minutes > 0) return "text-success";
    if (minutes < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getBalanceIcon = (minutes: number) => {
    if (minutes > 0) return <TrendingUp className="w-5 h-5 text-success" />;
    if (minutes < 0) return <TrendingDown className="w-5 h-5 text-destructive" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gleitzeit-Saldo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Gleitzeit-Saldo
          {getBalanceIcon(balanceMinutes)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Balance */}
          <div>
            <p className={cn("text-3xl font-bold time-display", getBalanceColor(balanceMinutes))}>
              {formatMinutes(balanceMinutes)}
            </p>
            <p className="text-sm text-muted-foreground">Stunden gesamt</p>
          </div>

          {/* Today */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heute</span>
              <span className={cn("font-medium time-display", getBalanceColor(monthDeltaMinutes))}>
                {formatMinutes(monthDeltaMinutes)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p>
              Das Gleitzeit-Saldo zeigt Ihre aufgebauten oder abzubauenden Stunden basierend auf Ihrem Arbeitszeitmodell.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
