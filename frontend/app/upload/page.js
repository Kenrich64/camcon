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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

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
      const msg = "Please select a CSV file first";
      setError(msg);
      toast.error(msg);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
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
      toast.success("Upload successful! ✨");
      setFile(null);
      setProgress(100);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
        <GlassCard className="w-full max-w-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400/40 to-blue-500/40">
              <Upload size={24} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Upload Events</h1>
              <p className="text-slate-400 text-sm mt-1">CSV/Excel import for events table</p>
              <Link
                href="/upload/history"
                className="mt-2 inline-flex text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                View upload history
              </Link>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Select CSV or XLSX File</label>
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
                      ? "border-cyan-300 bg-cyan-500/15"
                      : "border-cyan-400/50 hover:bg-cyan-500/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet size={32} className="text-cyan-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {file ? file.name : "Drop file here or click to browse"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Supported: .csv, .xlsx</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {loading ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
                <AlertCircle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {loading ? "Uploading..." : "Upload File"}
            </button>

            {/* Help Text */}
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 font-semibold mb-2">CSV Format:</p>
              <p className="text-xs text-slate-500">
                event_name, department, total_students, attended_students
              </p>
            </div>
          </form>
        </GlassCard>
      </main>
    </div>
  );
}