"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  ImageIcon,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type SavedImage = {
  id: string;
  file_name: string;
  analysis: string;
  created_at: string;
};

export default function ImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [hiddenImages, setHiddenImages] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedImages = async () => {
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

        const { data, error: imageError } = await supabase
          .from("medical_images")
          .select("id, file_name, analysis, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (imageError) {
          console.error("LOAD IMAGE ERROR:", imageError);
          setError("Could not load your saved image analyses.");
          return;
        }

        setSavedImages((data || []) as SavedImage[]);
      } catch (err) {
        console.error("LOAD SAVED IMAGES ERROR:", err);
        setError("Could not load your saved image analyses.");
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedImages();
  }, []);

  const handleFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setError("Please upload JPG, JPEG or PNG image.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const newPreview = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPreview(newPreview);
    setError("");
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload an image first.");
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
            reject(new Error("Unable to read image."));
            return;
          }

          const parts = result.split(",");

          if (parts.length < 2) {
            reject(new Error("Unable to read image."));
            return;
          }

          resolve(parts[1]);
        };

        reader.onerror = () => {
          reject(new Error("Unable to read image."));
        };

        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/image-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
          fileName: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image analysis failed.");
      }

      const newImage: SavedImage = {
        id: data.image.id,
        file_name: data.image.file_name || file.name,
        analysis: data.analysis || "",
        created_at: data.image.created_at || new Date().toISOString(),
      };

      setSavedImages((previous) => [newImage, ...previous]);

      setFile(null);
      setFileName("");

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setPreview("");
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
    setHiddenImages((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const clearImage = async (image: SavedImage) => {
    const confirmed = window.confirm(
      `Clear "${image.file_name}" and its analysis?`
    );

    if (!confirmed) return;

    setClearingId(image.id);
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
        .eq("activity_type", "image_analysis")
        .eq("reference_id", image.id);

      const { error: deleteError } = await supabase
        .from("medical_images")
        .delete()
        .eq("id", image.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSavedImages((previous) =>
        previous.filter((item) => item.id !== image.id)
      );

      setHiddenImages((previous) => {
        const next = { ...previous };
        delete next[image.id];
        return next;
      });
    } catch (err) {
      console.error("CLEAR IMAGE ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not clear the image."
      );
    } finally {
      setClearingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">
        Medical Image Analyzer
      </h1>

      <p className="mt-2 text-muted-foreground">
        Upload a medical image for analysis.
      </p>

      {loadingSaved && (
        <div className="mt-6 text-sm text-muted-foreground">
          Loading saved image analyses...
        </div>
      )}

      <div className="relative mt-8 rounded-2xl border-2 border-dashed p-12 text-center">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
          }}
        />

        <Upload className="pointer-events-none mx-auto h-10 w-10" />

        <h2 className="pointer-events-none mt-4 text-xl font-semibold">
          Upload Medical Image
        </h2>

        <p className="pointer-events-none mt-2 text-sm text-muted-foreground">
          JPG, JPEG or PNG (Max 5 MB)
        </p>
      </div>

      {fileName && (
        <div className="mt-6 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6" />

            <div>
              <p className="font-semibold">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                Ready for analysis
              </p>
            </div>
          </div>

          {preview && (
            <img
              src={preview}
              alt="Uploaded medical image"
              className="mt-5 max-h-80 rounded-xl object-contain"
            />
          )}

          <button
            type="button"
            className="mt-5 rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze Image"
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500 p-4 text-red-500">
          {error}
        </div>
      )}

      {!loadingSaved && savedImages.length > 0 && (
        <div className="mt-8 space-y-6">
          {savedImages.map((image) => {
            const isHidden = hiddenImages[image.id] === true;
            const isClearing = clearingId === image.id;

            return (
              <div
                key={image.id}
                className="rounded-xl border p-6"
              >
                <div className="flex items-start gap-3">
                  <ImageIcon className="h-6 w-6 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words">
                      {image.file_name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {new Date(image.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAnalysis(image.id)}
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
                    onClick={() => clearImage(image)}
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
                      AI Analysis Result
                    </h2>

                    <div className="mt-4 whitespace-pre-wrap leading-7">
                      {image.analysis}
                    </div>

                    <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                      AI-generated information is not a medical diagnosis.
                      Consult a qualified healthcare professional for
                      interpretation and medical decisions.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loadingSaved && savedImages.length === 0 && (
        <div className="mt-8 rounded-xl border p-6 text-center text-sm text-muted-foreground">
          No saved image analyses yet.
        </div>
      )}
    </div>
  );
}