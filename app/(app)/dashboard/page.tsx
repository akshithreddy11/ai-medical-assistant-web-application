"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Image as ImageIcon,
  History,
  Siren,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Activity = {
  id: string;
  activity_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Dashboard auth error:", authError);
          setLoading(false);
          return;
        }

        if (!user) {
          setLoading(false);
          return;
        }

        // Load current user's details from Supabase Auth metadata
        const userMetadata = user.user_metadata || {};

        const profileData: Profile = {
          full_name:
            userMetadata.full_name ||
            userMetadata.name ||
            null,
          email: user.email || null,
          phone: userMetadata.phone || null,
        };

        setProfile(profileData);

        // Load recent activity
        const { data: activityData, error: activityError } =
          await supabase
            .from("activity_history")
            .select(
              "id, activity_type, description, reference_id, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

        if (activityError) {
          console.error("Activity loading error:", activityError);
        }

        if (activityData) {
          setActivities(activityData);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const displayName =
    profile?.full_name ||
    profile?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back{displayName ? `, ${displayName}` : ""}
        </h1>

        <p className="mt-2 text-muted-foreground">
          Your health journey matters
        </p>

        {!loading && profile && (
          <div className="mt-3 text-sm text-muted-foreground">
            {profile.email && <div>{profile.email}</div>}
            {profile.phone && <div>{profile.phone}</div>}
          </div>
        )}
      </div>

      {/* Features / Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          Features
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Chat */}
          <Link
            href="/chat"
            className="rounded-xl border p-5 transition hover:bg-muted"
          >
            <MessageSquare className="mb-3 h-7 w-7" />

            <h3 className="text-lg font-semibold">
              AI Medical Chat
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Get explanations for medical information.
            </p>
          </Link>

          {/* Reports */}
          <Link
            href="/reports"
            className="rounded-xl border p-5 transition hover:bg-muted"
          >
            <FileText className="mb-3 h-7 w-7" />

            <h3 className="text-lg font-semibold">
              Medical Report Analyzer
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload and understand medical reports.
            </p>
          </Link>

          {/* Images */}
          <Link
            href="/images"
            className="rounded-xl border p-5 transition hover:bg-muted"
          >
            <ImageIcon className="mb-3 h-7 w-7" />

            <h3 className="text-lg font-semibold">
              Medical Image Analyzer
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload medical images for analysis.
            </p>
          </Link>

          {/* History */}
          <Link
            href="/history"
            className="rounded-xl border p-5 transition hover:bg-muted"
          >
            <History className="mb-3 h-7 w-7" />

            <h3 className="text-lg font-semibold">
              Health History
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              View your previous chats and analyses.
            </p>
          </Link>

          {/* Emergency */}
          <Link
            href="/emergency"
            className="rounded-xl border p-5 transition hover:bg-muted"
          >
            <Siren className="mb-3 h-7 w-7" />

            <h3 className="text-lg font-semibold">
              Emergency Assistance
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Find nearby hospitals for an urgent health issue.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border p-8">
        <h2 className="text-xl font-semibold">
          Recent Activity
        </h2>

        {loading ? (
          <p className="mt-2 text-muted-foreground">
            Loading your activity...
          </p>
        ) : activities.length === 0 ? (
          <>
            <p className="mt-2 text-muted-foreground">
              No recent activity
            </p>

            <p className="mt-2 text-muted-foreground">
              Start an AI medical conversation, upload a report,
              or analyze a medical image to see your activity here.
            </p>
          </>
        ) : (
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border p-4"
              >
                <h3 className="font-semibold">
                  {activity.activity_type}
                </h3>

                {activity.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(
                    activity.created_at
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}