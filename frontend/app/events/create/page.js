"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function CreateEventPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-800 p-8 shadow-glow">
          <h1 className="text-2xl font-semibold text-white">Create Event</h1>
          <p className="mt-3 text-slate-300">
            Event creation is currently available in the Events page form.
          </p>
          <Link
            href="/events"
            className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Go to Events
          </Link>
        </div>
      </main>
    </div>
  );
}