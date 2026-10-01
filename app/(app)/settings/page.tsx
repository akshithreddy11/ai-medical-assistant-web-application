"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase/client";

type Section =
  | "account"
  | "security"
  | "notifications"
  | "appearance"
  | null;

type NotificationPreferences = {
  report: boolean;
  image: boolean;
  chat: boolean;
};

const defaultNotificationPreferences: NotificationPreferences = {
  report: true,
  image: true,
  chat: true,
};

export default function SettingsPage() {
  const [section, setSection] = useState<Section>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(
      defaultNotificationPreferences
    );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const loadSettings = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          ""
      );

      setEmail(user.email || "");

      setPhone(user.user_metadata?.phone || "");

      const savedPreferences =
        user.user_metadata?.notification_preferences;

      if (savedPreferences) {
        setNotificationPreferences({
          report:
            savedPreferences.report !== undefined
              ? savedPreferences.report
              : true,
          image:
            savedPreferences.image !== undefined
              ? savedPreferences.image
              : true,
          chat:
            savedPreferences.chat !== undefined
              ? savedPreferences.chat
              : true,
        });
      }
    };

    loadSettings();
  }, []);

  const saveAccount = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User is not logged in.");
      }

      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
        data: {
          full_name: name.trim(),
          name: name.trim(),
          phone: phone.trim(),
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Account details saved successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save account details."
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        throw new Error("User is not logged in.");
      }

      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationPreferences = async (
    preferences: NotificationPreferences
  ) => {
    setNotificationPreferences(preferences);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("User is not logged in.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: preferences,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Notification preferences saved.");
  };

  if (section) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setSection(null);
            setMessage("");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </button>

        {message && (
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {section === "account" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-xl font-semibold">Account</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account preferences.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Email
                </label>

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  placeholder="Your email"
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Mobile Number
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  placeholder="Your mobile number"
                  type="tel"
                />
              </div>

              <button
                type="button"
                onClick={saveAccount}
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {section === "security" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-xl font-semibold">Security</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage password and account security.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Current Password
                </label>

                <input
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  New Password
                </label>

                <input
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Confirm New Password
                </label>

                <input
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="button"
                onClick={updatePassword}
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-xl font-semibold">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage notification preferences.
            </p>

            <div className="mt-6 space-y-5">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Report Notifications
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Get notified when a report is analyzed.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationPreferences.report}
                  onChange={(e) =>
                    saveNotificationPreferences({
                      ...notificationPreferences,
                      report: e.target.checked,
                    })
                  }
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Image Notifications
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Get notified when an image is analyzed.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationPreferences.image}
                  onChange={(e) =>
                    saveNotificationPreferences({
                      ...notificationPreferences,
                      image: e.target.checked,
                    })
                  }
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Chat Notifications
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Receive notifications for chat activity.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationPreferences.chat}
                  onChange={(e) =>
                    saveNotificationPreferences({
                      ...notificationPreferences,
                      chat: e.target.checked,
                    })
                  }
                />
              </label>
            </div>
          </div>
        )}

        {section === "appearance" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-xl font-semibold">
              Appearance
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage dark and light theme preferences.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-lg border p-4 text-left hover:bg-muted ${
                  theme === "light"
                    ? "border-primary bg-muted"
                    : ""
                }`}
              >
                <p className="font-medium">Light Mode</p>

                <p className="text-sm text-muted-foreground">
                  Use a light appearance.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-lg border p-4 text-left hover:bg-muted ${
                  theme === "dark"
                    ? "border-primary bg-muted"
                    : ""
                }`}
              >
                <p className="font-medium">Dark Mode</p>

                <p className="text-sm text-muted-foreground">
                  Use a dark appearance.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const settings = [
    {
      id: "account" as Section,
      title: "Account",
      description: "Manage your account preferences.",
      icon: Settings,
    },
    {
      id: "security" as Section,
      title: "Security",
      description: "Manage password and account security.",
      icon: Shield,
    },
    {
      id: "notifications" as Section,
      title: "Notifications",
      description: "Manage notification preferences.",
      icon: Bell,
    },
    {
      id: "appearance" as Section,
      title: "Appearance",
      description: "Manage dark and light theme preferences.",
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>

      <div className="grid gap-4">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-6 text-left transition hover:bg-muted/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Icon className="text-primary" />

                <div>
                  <h2 className="font-semibold">
                    {item.title}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}