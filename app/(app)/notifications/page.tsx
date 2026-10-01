"use client";

import { Bell, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setNotifications([]);
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select(
            "id, title, message, type, is_read, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(
            "NOTIFICATIONS PAGE ERROR:",
            error
          );
          return;
        }

        setNotifications(data || []);
      } catch (error) {
        console.error(
          "LOAD NOTIFICATIONS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const formatTime = (date: string) => {
    const created = new Date(date);
    const now = new Date();

    const difference =
      now.getTime() - created.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

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

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error(
        "MARK ALL READ ERROR:",
        error
      );
      return;
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  };

  const clearNotifications = async () => {
    const confirmed = window.confirm(
      "Clear all notifications?"
    );

    if (!confirmed) return;

    setClearing(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in again.");
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setNotifications([]);
    } catch (error) {
      console.error(
        "CLEAR NOTIFICATIONS ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not clear notifications."
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            View your latest notifications and updates.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notifications.some(
              (notification) => !notification.is_read
            ) && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Mark all as read
              </button>
            )}

            <button
              type="button"
              onClick={clearNotifications}
              disabled={clearing}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Loading notifications...
          </p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-primary" />

          <h2 className="text-lg font-semibold">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any notifications yet.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex gap-4 border-b border-border p-5 last:border-b-0 ${
                !notification.is_read
                  ? "bg-primary/5"
                  : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold">
                    {notification.title}
                  </h2>

                  {!notification.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {formatTime(notification.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}