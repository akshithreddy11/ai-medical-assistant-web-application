"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { NotificationIcon } from "@/components/app/notification-icon";
import { supabase } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const unread = items.filter((item) => !item.is_read).length;

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("NOTIFICATIONS LOAD ERROR:", error);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error("NOTIFICATIONS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNotificationsUpdated = () => {
      loadNotifications();
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated
    );

    return () => {
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, []);

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || unread === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("MARK NOTIFICATIONS READ ERROR:", error);
      return;
    }

    setItems((previous) =>
      previous.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  };

  const formatTime = (date: string) => {
    const created = new Date(date);
    const now = new Date();

    const difference = now.getTime() - created.getTime();
    const minutes = Math.floor(difference / (1000 * 60));

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return created.toLocaleDateString();
  };

  const getNotificationKind = (type: string) => {
    if (type === "report") return "report";
    if (type === "image") return "image";
    if (type === "chat") return "chat";
    if (type === "emergency") return "emergency";

    return "info";
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4.5" aria-hidden="true" />

        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>

              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:opacity-50"
                disabled={unread === 0}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            </div>

            <ul className="max-h-96 overflow-y-auto">
              {loading && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </li>
              )}

              {!loading && items.length === 0 && (
                <li className="px-4 py-8 text-center">
                  <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    No notifications
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Your new activity notifications will appear here.
                  </p>
                </li>
              )}

              {!loading &&
                items.slice(0, 4).map((notification) => (
                  <li
                    key={notification.id}
                    className="flex gap-3 border-b border-border/60 px-4 py-3"
                  >
                    <NotificationIcon
                      kind={getNotificationKind(notification.type) as any}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </li>
                ))}
            </ul>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-xs font-medium text-primary hover:bg-muted"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}