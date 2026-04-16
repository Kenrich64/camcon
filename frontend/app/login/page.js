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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[88vh] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 md:grid-cols-2">
          <section className="hidden rounded-3xl bg-[#1E293B] p-10 text-slate-100 md:block">
            <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Campus Event Operations</p>
            <h1 className="heading-display mt-4 text-4xl font-bold leading-tight">Camcon Dashboard</h1>
            <p className="mt-4 text-sm text-slate-300">
              Manage events, monitor participation, and track performance with a focused interface built for daily operations.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-200">
              <p>Live analytics by department and timeline</p>
              <p>Role-based access for admins and users</p>
              <p>Notifications for event and data updates</p>
            </div>
          </section>

          <section className="surface-card mx-auto w-full max-w-md p-8">
            <h2 className="heading-display mb-2 text-2xl font-bold text-slate-900">Sign In</h2>
            <p className="mb-8 text-sm text-slate-500">Access your Camcon workspace</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
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
                <button
                  type="button"
                  className="btn-secondary w-full"
                >
                  Register
                </button>
              </Link>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Use your registered email and password.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}