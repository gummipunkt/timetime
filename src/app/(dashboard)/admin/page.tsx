"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  FileText,
  Building2,
  Settings,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingLeaveRequests: number;
  todayClockIns: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLinks = [
    {
      title: "Benutzerverwaltung",
      description: "Mitarbeiter anlegen, bearbeiten und verwalten",
      href: "/admin/users",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Abteilungen",
      description: "Organisationsstruktur verwalten",
      href: "/admin/departments",
      icon: Building2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Arbeitszeitmodelle",
      description: "Soll-Stunden und Kernzeiten definieren",
      href: "/admin/work-models",
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Feiertage",
      description: "Gesetzliche Feiertage verwalten",
      href: "/admin/holidays",
      icon: CalendarDays,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Audit-Log",
      description: "Alle Änderungen protokolliert",
      href: "/admin/audit",
      icon: FileText,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    },
    {
      title: "Einstellungen",
      description: "Systemweite Konfiguration",
      href: "/admin/settings",
      icon: Settings,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1">
          Systemverwaltung und Konfiguration.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Benutzer
              </CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                von {stats.totalUsers} gesamt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inaktive Benutzer
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.inactiveUsers}
              </div>
              <p className="text-xs text-muted-foreground">deaktiviert</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Offene Urlaubsanträge
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.pendingLeaveRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                warten auf Genehmigung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Heute eingestempelt
              </CardTitle>
              <Clock className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.todayClockIns}
              </div>
              <p className="text-xs text-muted-foreground">Mitarbeiter</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Verwaltungsbereiche</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${link.bg} flex items-center justify-center`}
                    >
                      <link.icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
