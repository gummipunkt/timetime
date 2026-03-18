"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { defaultLocale, isLocale } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Clock,
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  BarChart3,
  Building2,
  Shield,
  FileText,
  ClipboardEdit,
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navigation: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [Role.USER, Role.SUPERVISOR, Role.ADMIN],
  },
  {
    key: "time",
    href: "/time",
    icon: Clock,
    roles: [Role.USER, Role.SUPERVISOR, Role.ADMIN],
  },
  {
    key: "leave",
    href: "/leave",
    icon: CalendarDays,
    roles: [Role.USER, Role.SUPERVISOR, Role.ADMIN],
  },
  {
    key: "team",
    href: "/team",
    icon: Users,
    roles: [Role.SUPERVISOR, Role.ADMIN],
  },
  {
    key: "timeCorrections",
    href: "/team/time-corrections",
    icon: ClipboardEdit,
    roles: [Role.SUPERVISOR, Role.ADMIN],
  },
  {
    key: "reports",
    href: "/reports",
    icon: BarChart3,
    roles: [Role.USER, Role.SUPERVISOR, Role.ADMIN],
  },
];

const adminNavigation: NavItem[] = [
  {
    key: "employees",
    href: "/admin/users",
    icon: Users,
    roles: [Role.ADMIN],
  },
  {
    key: "timeEntries",
    href: "/admin/time-entries",
    icon: ClipboardEdit,
    roles: [Role.ADMIN, Role.SUPERVISOR],
  },
  {
    key: "departments",
    href: "/admin/departments",
    icon: Building2,
    roles: [Role.ADMIN],
  },
  {
    key: "workModels",
    href: "/admin/work-models",
    icon: Clock,
    roles: [Role.ADMIN],
  },
  {
    key: "holidays",
    href: "/admin/holidays",
    icon: CalendarDays,
    roles: [Role.ADMIN],
  },
  {
    key: "auditLog",
    href: "/admin/audit",
    icon: FileText,
    roles: [Role.ADMIN, Role.SUPERVISOR],
  },
  {
    key: "settings",
    href: "/admin/settings",
    icon: Settings,
    roles: [Role.ADMIN],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const seg = (pathname || "/").split("/")[1] || "";
  const locale = isLocale(seg) ? seg : defaultLocale;
  const t = useTranslations();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  const filteredAdminNavigation = adminNavigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight gradient-text">TimeTracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </div>

        {/* Admin Section */}
        {filteredAdminNavigation.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {t("nav.admin")}
            </div>
            <div className="mt-2 space-y-1">
              {filteredAdminNavigation.map((item) => {
                const href = `/${locale}${item.href}`;
                const isActive = pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-sm font-medium text-white shadow-sm">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
