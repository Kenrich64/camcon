"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { Loader } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/auth/login", form);
      const user = response.data?.user || {};
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", user.role || "user");
      router.push("/dashboard");
    } catch (apiError) {
      setError(apiError?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-[#0B1220]">
      <div className="mx-auto flex min-h-[88vh] w-full max-w-md items-center justify-center">
        <section className="surface-card w-full p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Campus Event Operations</p>
            <h1 className="heading-display mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">Sign in to Camcon</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Access your dashboard, notifications, and uploaded analytics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <Link href="/register" className="block">
              <button type="button" className="btn-secondary w-full">
                Register
              </button>
            </Link>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Use your registered email and password.
          </p>
        </section>
      </div>
    </main>
  );
}