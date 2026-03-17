"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  action: "APPROVED" | "REJECTED" | "CANCELLED" | "UPDATED";
  title: string;
  message: string;
  createdAt: string;
  actorName: string;
  link: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unseenCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Benachrichtigungen öffnen"
        >
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Benachrichtigungen</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={loadNotifications}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Neu
              </span>
            )}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Lädt...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-4 px-3 text-sm text-muted-foreground">
            Keine Benachrichtigungen.
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 py-2 px-3 whitespace-normal"
                asChild
              >
                <Link href={n.link}>
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-xs font-medium">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(n.createdAt), "dd.MM.yy HH:mm", {
                        locale: de,
                      })}
                    </span>
                  </div>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Von: <strong>{n.actorName}</strong>
                  </p>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

