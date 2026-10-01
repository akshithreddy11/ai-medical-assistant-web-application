"use client";

import { useEffect, useState } from "react";
import {
  History as HistoryIcon,
  FileText,
  ImageIcon,
  MessageCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Activity = {
  id: string;
  activity_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
};

export default function HistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to view your history.");
          return;
        }

        const { data, error: historyError } =
          await supabase
            .from("activity_history")
            .select(
              "id, activity_type, description, reference_id, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (historyError) {
          console.error(
            "HISTORY LOAD ERROR:",
            historyError
          );

          setError("Could not load your history.");
          return;
        }

        setActivities(data || []);
      } catch (err) {
        console.error("HISTORY ERROR:", err);

        setError(
          "Something went wrong while loading history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getIcon = (activityType: string) => {
    const type = activityType.toLowerCase();

    if (type.includes("report")) {
      return (
        <FileText className="h-5 w-5 text-primary" />
      );
    }

    if (type.includes("image")) {
      return (
        <ImageIcon className="h-5 w-5 text-primary" />
      );
    }

    if (type.includes("chat")) {
      return (
        <MessageCircle className="h-5 w-5 text-primary" />
      );
    }

    if (type.includes("emergency")) {
      return (
        <AlertCircle className="h-5 w-5 text-primary" />
      );
    }

    return (
      <HistoryIcon className="h-5 w-5 text-primary" />
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const clearHistoryItem = async (activity: Activity) => {
    const confirmed = window.confirm(
      "Remove this item from history?"
    );

    if (!confirmed) return;

    setClearingId(activity.id);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in again.");
      }

      const { error: deleteError } = await supabase
        .from("activity_history")
        .delete()
        .eq("id", activity.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setActivities((previous) =>
        previous.filter((item) => item.id !== activity.id)
      );
    } catch (err) {
      console.error(
        "CLEAR HISTORY ITEM ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not clear this history item."
      );
    } finally {
      setClearingId(null);
    }
  };

  const clearAllHistory = async () => {
    const confirmed = window.confirm(
      "Clear all history?"
    );

    if (!confirmed) return;

    setClearingAll(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in again.");
      }

      const { error: deleteError } = await supabase
        .from("activity_history")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setActivities([]);
    } catch (err) {
      console.error(
        "CLEAR ALL HISTORY ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not clear history."
      );
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            History
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            View your previous chats, reports and medical
            image analyses.
          </p>
        </div>

        {activities.length > 0 && (
          <button
            type="button"
            onClick={clearAllHistory}
            disabled={clearingAll}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
          >
            {clearingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear All
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading your history...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500 p-4 text-red-500">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        activities.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <HistoryIcon className="mx-auto mb-4 h-12 w-12 text-primary" />

            <h2 className="text-lg font-semibold">
              No history yet
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Your conversations and analyses will appear
              here.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border border-border p-3">
                    {getIcon(activity.activity_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                      {activity.activity_type}
                    </h2>

                    {activity.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      clearHistoryItem(activity)
                    }
                    disabled={clearingId === activity.id}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {clearingId === activity.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}