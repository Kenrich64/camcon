"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { GlassCard } from "@/components/ui";
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadPage() {
  const router = useRouter();
  // State management
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Access control
  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  // Validation helpers
  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select a file";
    }

    const fileName = selectedFile.name.toLowerCase();
    const isCsv = selectedFile.type === "text/csv" || fileName.endsWith(".csv");
    const isXlsx =
      selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (!isCsv && !isXlsx) {
      return "Only .csv and .xlsx files are allowed";
    }

    return null;
  };

  // Interaction handlers
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setFile(selectedFile);
    setSuccess("");
    setError("");
    setProgress(0);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0] || null;
    const validationError = validateFile(droppedFile);

    if (validationError) {
      setFile(null);
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setFile(droppedFile);
    setSuccess("");
    setError("");
    setProgress(0);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setSuccess("");
    setError("");

    if (!file) {
      const msg = "Please select a CSV or XLSX file first";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post("/upload/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const nextProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(nextProgress);
        },
      });

      const successMsg = `${response.data.message}. Inserted ${response.data.insertedRows} rows, skipped ${response.data.skippedDuplicates} duplicates.`;

      // Refresh analytics and predictions right after upload so new data is reflected.
      await Promise.all([
        API.get("/analytics/overview"),
        API.get("/predictions"),
      ]);

      setSuccess(successMsg);
      toast.success("Upload completed successfully.");
      setFile(null);
      setProgress(100);
      window.location.reload();
    } catch (apiError) {
      if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const errorMsg =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Upload failed";
      setError(errorMsg);
      toast.error(errorMsg);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // UI rendering
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1220] dark:text-slate-100">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
        <GlassCard className="w-full max-w-2xl border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Upload size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="heading-display text-2xl font-bold text-slate-900 dark:text-slate-100">Upload Events</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">CSV/Excel import for event analytics</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Uploading replaces the previous dataset and recalculates analytics.</p>
              <Link
                href="/upload/history"
                className="mt-2 inline-flex text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View upload history
              </Link>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Select CSV or XLSX File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="csvFile"
                />
                <label
                  htmlFor="csvFile"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                  className={`block w-full cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 transition ${
                    dragActive
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/60 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet size={32} className="text-blue-600" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {file ? file.name : "Drop file here or click to browse"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Supported: .csv, .xlsx</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {loading ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-rose-500" />
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-green-600" />
                <p className="text-sm text-green-700 dark:text-emerald-300">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="btn-primary w-full"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {loading ? "Uploading..." : "Upload File"}
            </button>

            {/* Help Text */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">CSV Format:</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                event_name, department, total_students, attended_students
              </p>
            </div>
          </form>
        </GlassCard>
      </main>
    </div>
  );
}