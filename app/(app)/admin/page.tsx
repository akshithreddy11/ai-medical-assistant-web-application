"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AdminPage() {
  const [chatCount, setChatCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [
          { count: chats, error: chatError },
          { count: reports, error: reportError },
          { count: images, error: imageError },
        ] = await Promise.all([
          supabase
            .from("chat_conversations")
            .select("id", { count: "exact", head: true }),

          supabase
            .from("medical_reports")
            .select("id", { count: "exact", head: true }),

          supabase
            .from("medical_images")
            .select("id", { count: "exact", head: true }),
        ]);

        if (chatError) {
          console.error("Chat count error:", chatError);
        }

        if (reportError) {
          console.error("Report count error:", reportError);
        }

        if (imageError) {
          console.error("Image count error:", imageError);
        }

        setChatCount(chats ?? 0);
        setReportCount(reports ?? 0);
        setImageCount(images ?? 0);
      } catch (error) {
        console.error("Dashboard count error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <p className="mt-2 text-muted-foreground">
          Manage medical chats, reports and images.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <MessageCircle className="mb-3 h-6 w-6" />

          <p className="text-sm text-muted-foreground">
            Medical Chats
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {loading ? "..." : chatCount}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <FileText className="mb-3 h-6 w-6" />

          <p className="text-sm text-muted-foreground">
            Medical Reports
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {loading ? "..." : reportCount}
          </h2>
        </div>

        <div className="rounded-xl border p-5">
          <ImageIcon className="mb-3 h-6 w-6" />

          <p className="text-sm text-muted-foreground">
            Medical Images
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {loading ? "..." : imageCount}
          </h2>
        </div>
      </div>
    </div>
  );
}