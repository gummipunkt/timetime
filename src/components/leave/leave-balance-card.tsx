"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, CalendarDays, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface LeaveBalance {
  year: number;
  entitlement: number;
  carryOver: number;
  used: number;
  pending: number;
  remaining: number;
}

export function LeaveBalanceCard() {
  const locale = useLocale();
  const t = useTranslations("leave.balance");
  const year = new Date().getFullYear();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch("/api/leave/balance");
        const data = await response.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t("title", { year })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalDays = balance ? balance.entitlement + balance.carryOver : 30;
  const usedDays = balance?.used || 0;
  const pendingDays = balance?.pending || 0;
  const remainingDays = balance?.remaining || totalDays;

  const usedPercentage = (usedDays / totalDays) * 100;
  const pendingPercentage = (pendingDays / totalDays) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t("title", { year })}
          </span>
          <Link href={`/${locale}/leave/new`}>
            <Button size="sm" variant="outline">
              <CalendarPlus className="w-4 h-4 mr-1" />
              {t("requestShort")}
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-primary">{remainingDays}</p>
            <p className="text-sm text-muted-foreground">{t("available")}</p>
          </div>

          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-primary transition-all"
                style={{ width: `${usedPercentage}%` }}
              />
              <div
                className="bg-warning transition-all"
                style={{ width: `${pendingPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {t("takenLegend", { count: usedDays })}
                </span>
                {pendingDays > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    {t("pendingLegend", { count: pendingDays })}
                  </span>
                )}
              </div>
              <span>{t("total", { count: totalDays })}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold">{usedDays}</p>
              <p className="text-xs text-muted-foreground">{t("taken")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-warning">{pendingDays}</p>
              <p className="text-xs text-muted-foreground">{t("pending")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">{remainingDays}</p>
              <p className="text-xs text-muted-foreground">{t("left")}</p>
            </div>
          </div>

          {balance && balance.carryOver > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p>{t("carryOver", { count: balance.carryOver })}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
