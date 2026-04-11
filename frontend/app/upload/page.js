"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { GlassCard } from "@/components/ui";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("events");
  const [loading, setLoading] = useState(false);
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setSuccess("");
    setError("");
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(`/upload?target=${target}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const successMsg = `${response.data.message}. Inserted ${response.data.insertedRows} rows into ${response.data.target}.`;
      setSuccess(successMsg);
      toast.success("Upload successful! ✨");
      setFile(null);
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
              <h1 className="text-2xl font-bold text-white">Bulk Upload</h1>
              <p className="text-slate-400 text-sm mt-1">Import data using CSV files</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* Target Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Upload Target</label>
              <select
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="input-field"
              >
                <option value="events">📅 Events (title, department, date, venue, total_students, status)</option>
                <option value="participation">👥 Participation (event_id, user_id, attended)</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Select CSV File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="csvFile"
                />
                <label
                  htmlFor="csvFile"
                  className="block w-full px-6 py-8 border-2 border-dashed border-cyan-400/50 rounded-xl cursor-pointer hover:bg-cyan-500/10 transition"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} className="text-cyan-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {file ? file.name : "Drop file here or click to browse"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">CSV files only</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

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
              <Upload size={18} />
              {loading ? "Uploading..." : "Upload CSV"}
            </button>

            {/* Help Text */}
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 font-semibold mb-2">CSV Format:</p>
              {target === "events" ? (
                <p className="text-xs text-slate-500">
                  title, department, date (YYYY-MM-DD), venue, total_students, status (scheduled/ongoing/completed/cancelled)
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  event_id, user_id, attended (true/false or 1/0)
                </p>
              )}
            </div>
          </form>
        </GlassCard>
      </main>
    </div>
  );
}