"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Profile auth error:", error);
          setLoading(false);
          return;
        }

        if (!user) {
          setLoading(false);
          return;
        }

        // Use Supabase Auth as the single source of truth
        const metadata = user.user_metadata || {};

        setProfile({
          full_name:
            metadata.full_name ||
            metadata.name ||
            null,
          phone: metadata.phone || null,
          email: user.email || null,
        });
      } catch (error) {
        console.error("Profile loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            My Profile
          </h1>

          <p className="mt-2 text-muted-foreground">
            Your personal information
          </p>
        </div>

        <div className="rounded-xl border p-6">
          {loading ? (
            <p className="text-muted-foreground">
              Loading profile...
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Full Name
                </p>

                <p className="mt-1 text-lg">
                  {profile?.full_name || "Name not available"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Phone Number
                </p>

                <p className="mt-1 text-lg">
                  {profile?.phone || "Phone number not available"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email Address
                </p>

                <p className="mt-1 text-lg">
                  {profile?.email || "Email not available"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}