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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-card p-8">
          <h1 className="heading-display text-2xl font-semibold text-slate-900">Create Event</h1>
          <p className="mt-3 text-slate-600">
            Event creation is currently available in the Events page form.
          </p>
          <Link
            href="/events"
            className="btn-primary mt-6"
          >
            Go to Events
          </Link>
        </div>
      </main>
    </div>
  );
}