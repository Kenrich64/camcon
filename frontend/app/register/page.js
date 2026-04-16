"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { Loader } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (apiError) {
      setError(apiError?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[88vh] w-full max-w-md items-center justify-center">
        <div className="surface-card w-full p-8 shadow-sm sm:p-10">
          <h1 className="heading-display mb-2 text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="mb-8 text-sm text-slate-500">Register to start using Camcon.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Create password"
                className="input-field"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
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
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
