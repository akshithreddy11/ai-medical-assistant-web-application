"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type SavedReport = {
  id: string;
  file_name: string;
  file_path: string;
  analysis: string;
  created_at: string;
};

export default function ReportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [hiddenReports, setHiddenReports] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedReports = async () => {
      try {
        setLoadingSaved(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoadingSaved(false);
          return;
        }

        const { data, error: reportError } = await supabase
          .from("medical_reports")
          .select("id, file_name, file_path, analysis, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reportError) {
          console.error("LOAD REPORT ERROR:", reportError);
          setError("Could not load your saved reports.");
          return;
        }

        setSavedReports((data || []) as SavedReport[]);
      } catch (err) {
        console.error("LOAD SAVED REPORTS ERROR:", err);
        setError("Could not load your saved reports.");
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedReports();
  }, []);

  const handleFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload PDF, JPG, JPEG or PNG file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File must be smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a medical report first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;

          if (typeof result !== "string") {
            reject(new Error("Could not read the uploaded file."));
            return;
          }

          const parts = result.split(",");

          if (parts.length < 2) {
            reject(new Error("Could not read the uploaded file."));
            return;
          }

          resolve(parts[1]);
        };

        reader.onerror = () => {
          reject(new Error("Could not read the uploaded file."));
        };

        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/report-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64,
          mimeType: file.type,
          fileName: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Report analysis failed.");
      }

      const newReport: SavedReport = {
        id: data.reportId,
        file_name: data.fileName || file.name,
        file_path: data.filePath,
        analysis: data.analysis || "",
        created_at: new Date().toISOString(),
      };

      setSavedReports((previous) => [newReport, ...previous]);
      setFile(null);
      setFileName("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAnalysis = (id: string) => {
    setHiddenReports((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const clearReport = async (report: SavedReport) => {
    const confirmed = window.confirm(
      `Clear "${report.file_name}" and its analysis?`
    );

    if (!confirmed) return;

    setClearingId(report.id);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in again.");
      }

      await supabase
        .from("activity_history")
        .delete()
        .eq("user_id", user.id)
        .eq("activity_type", "report_analysis")
        .eq("reference_id", report.id);

      await supabase.storage
        .from("medical-reports")
        .remove([report.file_path]);

      const { error: deleteError } = await supabase
        .from("medical_reports")
        .delete()
        .eq("id", report.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSavedReports((previous) =>
        previous.filter((item) => item.id !== report.id)
      );

      setHiddenReports((previous) => {
        const next = { ...previous };
        delete next[report.id];
        return next;
      });
    } catch (err) {
      console.error("CLEAR REPORT ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not clear the report."
      );
    } finally {
      setClearingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">
        Medical Report Analyzer
      </h1>

      <p className="mt-2 text-muted-foreground">
        Upload your medical report for analysis.
      </p>

      {loadingSaved && (
        <div className="mt-6 text-sm text-muted-foreground">
          Loading saved reports...
        </div>
      )}

      <div className="relative mt-8 rounded-2xl border-2 border-dashed p-12 text-center">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
          }}
        />

        <Upload className="pointer-events-none mx-auto h-10 w-10" />

        <h2 className="pointer-events-none mt-4 text-xl font-semibold">
          Upload Medical Report
        </h2>

        <p className="pointer-events-none mt-2 text-sm text-muted-foreground">
          PDF, JPG, JPEG or PNG (Max 10 MB)
        </p>
      </div>

      {fileName && (
        <div className="mt-6 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />

            <div>
              <p className="font-semibold">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                Ready for analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            className="mt-5 rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Report...
              </span>
            ) : (
              "Analyze Report"
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500 p-4 text-red-500">
          {error}
        </div>
      )}

      {!loadingSaved && savedReports.length > 0 && (
        <div className="mt-8 space-y-6">
          {savedReports.map((report) => {
            const isHidden = hiddenReports[report.id] === true;
            const isClearing = clearingId === report.id;

            return (
              <div
                key={report.id}
                className="rounded-xl border p-6"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words">
                      {report.file_name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAnalysis(report.id)}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {isHidden ? (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Analysis
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hide Analysis
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => clearReport(report)}
                    disabled={isClearing}
                    className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {isClearing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Clear
                  </button>
                </div>

                {!isHidden && (
                  <div className="mt-6 border-t pt-6">
                    <h2 className="text-xl font-bold">
                      AI Report Analysis
                    </h2>

                    <div className="mt-4 whitespace-pre-wrap leading-7">
                      {report.analysis}
                    </div>

                    <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                      This AI-generated summary is for informational
                      purposes only and is not a medical diagnosis.
                      Consult a qualified healthcare professional
                      for interpretation and medical decisions.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loadingSaved && savedReports.length === 0 && (
        <div className="mt-8 rounded-xl border p-6 text-center text-sm text-muted-foreground">
          No saved reports yet.
        </div>
      )}
    </div>
  );
}